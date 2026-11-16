import { NextRequest, NextResponse } from 'next/server';
import { resolveBaseUrl, tutorSystemPrompt, type TutorContext } from '@/lib/lmstudio';

// Proxies a chat to LM Studio's OpenAI-compatible endpoint and streams the SSE bytes back untouched.
// The request's AbortSignal is forwarded, so "Stop", closing the drawer or closing the tab
// actually cancels generation in LM Studio instead of letting it run on.

interface ChatBody {
  messages?: { role: string; content: string }[];
  model?: string;
  baseUrl?: string;
  context?: TutorContext;
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let baseUrl: string;
  try {
    baseUrl = resolveBaseUrl(body.baseUrl);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
  if (!history.length || history[history.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Last message must be from the user' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        model: body.model || undefined,
        messages: [{ role: 'system', content: tutorSystemPrompt(body.context) }, ...history],
        stream: true,
        temperature: 0.4,
      }),
      signal: req.signal,
    });
  } catch (err) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    return NextResponse.json({ error: `Can't reach LM Studio at ${baseUrl}. Is the local server running? (${(err as Error).message})` }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json({ error: `LM Studio error ${upstream.status}: ${text.slice(0, 300) || upstream.statusText}. Is a model loaded?` }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';

interface ProblemContext {
  id?: string;
  sheetIndex?: number;
  title?: string;
  difficulty?: string;
  topic?: string;
  subTopic?: string;
  hints?: string[];
}

export async function POST(req: NextRequest) {
  let requestedBaseUrl = 'http://127.0.0.1:1234/v1';
  try {
    const body = await req.json();
    const { 
      messages = [], 
      model, 
      baseUrl = 'http://127.0.0.1:1234/v1',
      problemContext 
    }: {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      baseUrl?: string;
      problemContext?: ProblemContext;
    } = body;
    requestedBaseUrl = baseUrl;

    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

    // Build system message
    let systemContent = `You are an expert Java DSA Tutor assisting a software engineer working through Striver's SDE Sheet.
Provide crisp, concise, high-yield answers tailored to competitive programming and technical interviews.
Always prefer modern Java idioms (e.g. ArrayDeque over Stack, primitive arrays for performance, Long overflow prevention).
Use Markdown formatting with Java syntax highlighting for code blocks.`;

    if (problemContext && problemContext.title) {
      systemContent += `\n\nActive Problem Context:
- #${problemContext.sheetIndex || ''} ${problemContext.title} (${problemContext.difficulty || 'DSA'})
- Topic: ${problemContext.topic || ''} / ${problemContext.subTopic || ''}
${problemContext.hints && problemContext.hints.length > 0 ? `- Hints available: ${problemContext.hints.join(' | ')}` : ''}
Use this context to answer queries regarding this specific problem when relevant.`;
    }

    // Ensure system prompt is first message
    const formattedMessages = [
      { role: 'system', content: systemContent },
      ...messages.filter(m => m.role !== 'system'),
    ];

    // Attempt to connect to LM Studio
    const lmStudioRes = await fetch(`${cleanBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        model: model || 'default',
        messages: formattedMessages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!lmStudioRes.ok) {
      const errorText = await lmStudioRes.text().catch(() => '');
      return NextResponse.json(
        { 
          error: `LM Studio error (HTTP ${lmStudioRes.status}): ${errorText || lmStudioRes.statusText}. Ensure a model is loaded in LM Studio.` 
        }, 
        { status: lmStudioRes.status }
      );
    }

    if (!lmStudioRes.body) {
      return NextResponse.json(
        { error: 'No response stream received from LM Studio.' }, 
        { status: 500 }
      );
    }

    // Stream back to client
    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = lmStudioRes.body!.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          console.error('Error reading stream from LM Studio:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: `Failed to connect to LM Studio. Make sure LM Studio is running with local server started at ${requestedBaseUrl}. Error: ${msg}` 
      }, 
      { status: 502 }
    );
  }
}

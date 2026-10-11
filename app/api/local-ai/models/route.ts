import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawBaseUrl = searchParams.get('baseUrl') || 'http://127.0.0.1:1234/v1';
  // Strip trailing slash if present
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({
        connected: false,
        error: `LM Studio returned status ${res.status}`,
        models: [],
      });
    }

    const data = await res.json();
    const models: string[] = Array.isArray(data?.data)
      ? data.data.map((m: { id?: string }) => m.id || '').filter(Boolean)
      : [];

    return NextResponse.json({
      connected: true,
      baseUrl,
      models,
      defaultModel: models.length > 0 ? models[0] : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return NextResponse.json({
      connected: false,
      error: `Could not connect to LM Studio at ${baseUrl}: ${message}`,
      models: [],
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { resolveBaseUrl } from '@/lib/lmstudio';

export async function GET(req: NextRequest) {
  let baseUrl: string;
  try {
    baseUrl = resolveBaseUrl(req.nextUrl.searchParams.get('baseUrl'));
  } catch (err) {
    return NextResponse.json({ connected: false, models: [], error: (err as Error).message });
  }

  try {
    const res = await fetch(`${baseUrl}/models`, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ connected: false, models: [], error: `LM Studio returned ${res.status}` });
    const data = await res.json();
    const models: string[] = Array.isArray(data?.data) ? data.data.map((m: { id?: string }) => m.id ?? '').filter(Boolean) : [];
    return NextResponse.json({ connected: true, models });
  } catch (err) {
    return NextResponse.json({ connected: false, models: [], error: `Can't reach LM Studio at ${baseUrl}: ${(err as Error).message}` });
  }
}

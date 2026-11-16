import { NextRequest, NextResponse } from 'next/server';

// Reads a user's public contest rating from LeetCode's GraphQL endpoint.
// Unofficial API: it can change or be blocked by Cloudflare at any time, so the
// client treats any failure as "hide the tile", never as an error screen.
// Only ever calls leetcode.com, and only with a validated username (no open proxy).

const QUERY = `query contestRating($username: String!) {
  userContestRanking(username: $username) { attendedContestsCount rating topPercentage }
  userContestRankingHistory(username: $username) { attended rating contest { title startTime } }
}`;

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('u')?.trim() ?? '';
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(username)) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com/' },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: `LeetCode returned ${res.status}` }, { status: 502 });

    const json = await res.json();
    const ranking = json?.data?.userContestRanking ?? null;
    const history = Array.isArray(json?.data?.userContestRankingHistory) ? json.data.userContestRankingHistory : [];
    if (json?.errors && !ranking) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      username,
      rating: ranking?.rating != null ? Math.round(ranking.rating) : null,
      attended: ranking?.attendedContestsCount ?? 0,
      topPercentage: ranking?.topPercentage ?? null,
      history: history
        .filter((h: { attended?: boolean }) => h.attended)
        .slice(-12)
        .map((h: { rating: number; contest: { title: string; startTime: number } }) => ({
          title: h.contest?.title ?? '',
          rating: Math.round(h.rating),
          time: h.contest?.startTime ?? 0,
        })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Request failed' }, { status: 502 });
  }
}

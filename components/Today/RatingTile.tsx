'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import type { ContestRating } from '@/types';
import { cacheRating, getCachedRating } from '@/lib/db';

const MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** Small, optional: shows nothing until a LeetCode username is set in Settings. */
export function RatingTile({ username }: { username: string }) {
  const [data, setData] = useState<ContestRating | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle');

  const load = useCallback(async (force: boolean) => {
    if (!username) return;
    const cached = await getCachedRating();
    if (cached && cached.username === username) {
      setData(cached);
      if (!force && Date.now() - cached.fetchedAt < MAX_AGE_MS) return;
    } else {
      setData(null);
    }
    setState('loading');
    try {
      const res = await fetch(`/api/leetcode/rating?u=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error();
      const fresh: ContestRating = { ...(await res.json()), fetchedAt: Date.now() };
      await cacheRating(fresh);
      setData(fresh);
      setState('idle');
    } catch {
      setState('failed');
    }
  }, [username]);

  useEffect(() => { load(false); }, [load]);

  if (!username) return null;
  if (!data && state === 'failed') {
    return (
      <div className="rule-top pt-6 flex items-center gap-3 text-sm text-ink-2">
        <Trophy className="w-4 h-4" /> Couldn&apos;t load the LeetCode rating for {username}.
        <button className="btn !py-1 ml-auto" onClick={() => load(true)}>Retry</button>
      </div>
    );
  }
  if (!data) return <div className="rule-top pt-6"><div className="h-12 w-64 bg-paper-2 animate-pulse" /></div>;

  const pts = data.history.map(h => h.rating);
  const delta = pts.length >= 2 ? pts[pts.length - 1] - pts[pts.length - 2] : null;

  return (
    <div className="rule-top pt-6 flex items-center gap-4">
      <Trophy className="w-5 h-5 shrink-0 text-ink-yellow" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm text-ink-2">LeetCode contest rating</p>
        {data.rating === null ? (
          <p className="text-sm text-ink">No rated contests yet. The weekly contest is on Sunday morning.</p>
        ) : (
          <p className="text-ink">
            <span className="text-xl font-semibold tabular-nums">{data.rating}</span>
            {delta !== null && (
              <span className={`ml-2 text-xs font-display ${delta >= 0 ? 'text-ink-green' : 'text-ink-orange'}`}>{delta >= 0 ? '+' : ''}{delta}</span>
            )}
            <span className="ml-2 text-xs text-ink-2">
              {data.attended} contest{data.attended === 1 ? '' : 's'}{data.topPercentage != null ? ` · top ${data.topPercentage.toFixed(1)}%` : ''}
            </span>
          </p>
        )}
      </div>
      {pts.length >= 2 && <Sparkline points={pts} />}
      <button className="btn-icon ml-auto shrink-0" onClick={() => load(true)} aria-label="Refresh rating" title={state === 'failed' ? 'Last refresh failed. Retry' : 'Refresh'}>
        <RefreshCw className={`w-3.5 h-3.5 ${state === 'loading' ? 'animate-spin' : ''} ${state === 'failed' ? 'text-ink-orange' : ''}`} />
      </button>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 96, h = 28;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const d = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / span) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} className="hidden sm:block shrink-0" aria-hidden>
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

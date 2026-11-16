'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { Problem, ProblemState } from '@/types';
import { DifficultyTag, HalftoneBar, StatusDot } from '../ui/bits';

type Filter = 'all' | 'new' | 'due' | 'learning' | 'mastered';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'Not started' },
  { id: 'due', label: 'Re-solve due' },
  { id: 'learning', label: 'In rotation' },
  { id: 'mastered', label: 'Mastered' },
];

interface Props {
  problems: Problem[];
  states: Map<string, ProblemState>;
  today: string;
  onOpenProblem: (p: Problem) => void;
}

export function SheetView({ problems, states, onOpenProblem }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showStretch, setShowStretch] = useState(true);
  const q = useDeferredValue(query.trim().toLowerCase());

  const matches = (p: Problem) => {
    const s = states.get(p.id)!;
    if (!showStretch && p.stretch) return false;
    if (filter === 'new' && s.phase !== 'new') return false;
    if (filter === 'due' && !s.isDue) return false;
    if (filter === 'learning' && s.phase !== 'learning') return false;
    if (filter === 'mastered' && s.phase !== 'mastered') return false;
    if (!q) return true;
    const num = q.replace(/^#/, '');
    if (/^\d+$/.test(num)) return String(p.n).startsWith(num);
    return `${p.title} ${p.pattern} ${p.module}`.toLowerCase().includes(q);
  };

  // module -> pattern -> problems, keeping sheet order
  const groups = useMemo(() => {
    const out: { module: string; total: number; done: number; patterns: { pattern: string; items: Problem[] }[] }[] = [];
    for (const p of problems) {
      let m = out.find(g => g.module === p.module);
      if (!m) { m = { module: p.module, total: 0, done: 0, patterns: [] }; out.push(m); }
      m.total++;
      if (states.get(p.id)!.phase !== 'new') m.done++;
      if (!matches(p)) continue;
      let pat = m.patterns.find(x => x.pattern === p.pattern);
      if (!pat) { pat = { pattern: p.pattern, items: [] }; m.patterns.push(pat); }
      pat.items.push(p);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems, states, q, filter, showStretch]);

  const shown = groups.reduce((n, g) => n + g.patterns.reduce((k, p) => k + p.items.length, 0), 0);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: problems.length, new: 0, due: 0, learning: 0, mastered: 0 };
    for (const s of states.values()) {
      if (s.phase === 'new') c.new++;
      if (s.phase === 'learning') c.learning++;
      if (s.phase === 'mastered') c.mastered++;
      if (s.isDue) c.due++;
    }
    return c;
  }, [problems.length, states]);

  return (
    <div className="space-y-5">
      <h1 className="spray misreg text-[clamp(2.75rem,10vw,4.75rem)]">The sheet</h1>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-2 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            type="search"
            className="field !pl-9"
            placeholder="Search by name, pattern or number (e.g. 42)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search problems"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-2 shrink-0">
          <input type="checkbox" checked={showStretch} onChange={e => setShowStretch(e.target.checked)} className="accent-ink-pink w-4 h-4" />
          Show stretch problems
        </label>
      </div>

      <div className="flex flex-wrap gap-x-1 gap-y-1 -mx-2" role="group" aria-label="Filter">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className="chip"
          >
            {f.label} <span className="font-display font-bold tabular-nums">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {shown === 0 && <p className="text-sm text-ink-2 py-8 text-center">No problems match.</p>}

      {groups.filter(g => g.patterns.length > 0).map(g => (
        <details key={g.module} open className="group/mod rule-top pt-2">
          <summary className="flex items-center gap-3 py-3 cursor-pointer select-none list-none">
            <span className="font-display font-extrabold text-xl text-ink" style={{ fontStretch: '115%' }}>{g.module}</span>
            <span className="badge tabular-nums">{g.done}/{g.total}</span>
            <span className="ml-auto w-28" aria-hidden>
              <HalftoneBar total={g.total} mastered={g.done} label="" height="h-2.5" />
            </span>
          </summary>
          <div className="pb-4">
            {g.patterns.map(pat => (
              <div key={pat.pattern}>
                {g.patterns.length > 1 || pat.pattern !== g.module ? (
                  <p className="pt-3 pb-1 text-xs t-label text-ink-2">{pat.pattern}</p>
                ) : null}
                <ul>
                  {pat.items.map(p => <Row key={p.id} p={p} state={states.get(p.id)!} onOpen={onOpenProblem} />)}
                </ul>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

const Row = React.memo(function Row({ p, state, onOpen }: { p: Problem; state: ProblemState; onOpen: (p: Problem) => void }) {
  return (
    <li>
      <button onClick={() => onOpen(p)} className="w-full flex items-center gap-3 px-2 -mx-2 py-2 text-left rounded-[2px] hover:bg-paper-2 transition-colors group">
        <span className="w-9 text-xs font-display text-ink-2 tabular-nums shrink-0">{p.n}</span>
        <span className="w-3 shrink-0 flex justify-center">
          {state.last ? <StatusDot status={state.last.status} /> : <span className="w-2 h-2 rounded-full border border-line" aria-hidden />}
        </span>
        <span className={`flex-1 min-w-0 truncate text-[0.9375rem] group-hover:underline underline-offset-4 decoration-ink-pink ${state.phase === 'mastered' ? 'text-ink-2' : 'text-ink'}`}>{p.title}</span>
        {state.isDue && <span className="text-xs font-display font-bold text-ink-blue shrink-0">due</span>}
        {state.phase === 'mastered' && <span className="text-xs font-display font-bold text-ink-green shrink-0 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />mastered</span>}
        {p.stretch && <span className="text-xs font-display font-bold text-ink-pink shrink-0 hidden sm:inline">stretch</span>}
        <span className="w-14 text-right shrink-0"><DifficultyTag d={p.difficulty} /></span>
      </button>
    </li>
  );
});

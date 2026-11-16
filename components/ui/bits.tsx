import React from 'react';
import type { AttemptStatus, Difficulty, Problem, ProblemState } from '@/types';

// Ink meanings (design language §3.3): green = done/clean, yellow = highlighter,
// orange = struggled (never red), blue = review / spaced repetition, pink = brand.

export function DifficultyTag({ d }: { d: Difficulty }) {
  const color = d === 'Easy' ? 'text-ink-green' : d === 'Medium' ? 'text-ink-yellow' : 'text-ink-orange';
  return <span className={`text-xs font-display font-semibold ${color}`}>{d}</span>;
}

const STATUS_DOT: Record<AttemptStatus, string> = {
  CLEAN: 'bg-ink-green',
  HESITANT: 'bg-ink-yellow-fill',
  BLOCKER: 'bg-ink-orange',
};

export function StatusDot({ status, className = '' }: { status: AttemptStatus; className?: string }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ring-1 ring-ink/40 ${STATUS_DOT[status]} ${className}`} aria-hidden />;
}

const STAMP: Record<AttemptStatus, { text: string; ink: string }> = {
  CLEAN: { text: 'Clean', ink: 'var(--ink-green)' },
  HESITANT: { text: 'With hints', ink: 'var(--ink-yellow)' },
  BLOCKER: { text: 'Needed solution', ink: 'var(--ink-orange)' },
};

/** Deterministic tilt (±1–6°) from an id, so stamps and stickers don't jump between renders. */
export function tilt(seed: string | number, max = 5): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const mag = 1 + (Math.abs(h) % (max * 10)) / 10;
  return `${h & 1 ? '-' : ''}${mag.toFixed(1)}deg`;
}

export function Stamp({ children, ink, seed, animate = false, className = '' }: { children: React.ReactNode; ink?: string; seed: string | number; animate?: boolean; className?: string }) {
  return (
    <span className={`stamp ${animate ? 'stamp-in' : ''} ${className}`} style={{ ['--rot' as string]: tilt(seed, 4), ['--stamp-ink' as string]: ink }}>
      {children}
    </span>
  );
}

export function StatusStamp({ status, seed }: { status: AttemptStatus; seed: string | number }) {
  return <Stamp ink={STAMP[status].ink} seed={seed}>{STAMP[status].text}</Stamp>;
}

export function PhaseBadge({ state, today }: { state: ProblemState; today: string }) {
  if (state.phase === 'new') return <span className="badge text-ink-2">Not started</span>;
  if (state.phase === 'mastered') return <span className="sticker" style={{ ['--sticker-ink' as string]: 'var(--ink-green)', ['--rot' as string]: tilt(state.problemId, 4) }}>Mastered</span>;
  if (state.isDue) return <span className="badge !text-ink-blue">Re-solve due</span>;
  return (
    <span className="badge text-ink-2">
      Re-solve {state.nextResolveDay === today ? 'today' : state.nextResolveDay ? `on ${state.nextResolveDay.slice(5)}` : ''}
    </span>
  );
}

export function ProblemMeta({ p }: { p: Problem }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-display text-ink-2">
      <span className="badge tabular-nums !text-[11px] !py-0">#{String(p.n).padStart(3, '0')}</span>
      <span>{p.module}</span>
      <span aria-hidden>·</span>
      <span>{p.pattern}</span>
      <span aria-hidden>·</span>
      <DifficultyTag d={p.difficulty} />
      {p.stretch && <span className="font-bold text-ink-pink">stretch</span>}
    </div>
  );
}

/** Halftone progress bar (§7.4): mastered in green dots, in-rotation in blue dots. */
export function HalftoneBar({ total, mastered, active = 0, label, height = 'h-3' }: { total: number; mastered: number; active?: number; label: string; height?: string }) {
  const pct = (n: number) => `${total ? (n / total) * 100 : 0}%`;
  return (
    <div className={`${height} border-2 border-line bg-paper-2 flex overflow-hidden`} style={{ borderRadius: 3 }} role="img" aria-label={label}>
      <div className="halftone-fill" style={{ width: pct(mastered), ['--dot' as string]: 'var(--ink-green)' }} />
      {active > 0 && <div className="halftone-fill" style={{ width: pct(active), ['--dot' as string]: 'var(--ink-blue)' }} />}
    </div>
  );
}

/** What you said you'd tried before each hint, printed small under a yellow hint tag. */
export function TriedNotes({ notes, className = '' }: { notes?: string[]; className?: string }) {
  if (!notes?.length) return null;
  return (
    <ul className={`space-y-1.5 text-sm ${className}`} aria-label="What you tried before each hint">
      {notes.map((t, i) => (
        <li key={i} className="flex gap-2 items-baseline">
          <span className="t-label text-[10px] text-ink-yellow shrink-0">Before hint {i + 1}</span>
          <span className="text-ink-2 whitespace-pre-wrap">{t}</span>
        </li>
      ))}
    </ul>
  );
}

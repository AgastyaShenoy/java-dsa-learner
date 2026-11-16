// What the desktop app publishes to Home Base (home base\apps\dsa\status.json).
//
// Home Base's DSA screen reads the top-level fields (counts, `next`, `resolves`, `links`).
// `session` and `problems` carry the detail: every attempt with the hints you saw, what
// you said you'd tried before each one, and your final note. The tracker is the only
// writer of this file; Home Base only reads it. Field reference: docs/home-base-status.md.

import type { Attempt, FocusSession, Problem, ProblemState } from '@/types';
import type { Stats, TodayPlan } from './progress';
import { elapsedMs, leetcodeUrl, practiceUrl } from './session';

/** Home Base skips status files over 512 KB; stay well under it. */
const MAX_BYTES = 450 * 1024;
const SHEET_URL = 'https://takeuforward.org/prep-hub/strivers-180-master-dsa-patterns';
const APP_URL = 'http://127.0.0.1:31780';

export interface HintUse {
  /** 1 or 2. */
  n: number;
  /** The hint text that was revealed. */
  hint: string;
  /** What you said you'd tried before asking for it. */
  tried?: string;
}

/** ISO timestamp with the local offset, e.g. 2026-11-16T22:05:04+05:30 (matches other Home Base files). */
export function localIso(d: Date = new Date()): string {
  const pad = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${off >= 0 ? '+' : '-'}${pad(off / 60)}:${pad(off % 60)}`;
}

/**
 * Before 0.2.1 the "what I tried" notes were folded into the attempt's notes as
 * "Before hint N: …" lines. Split those back out so old attempts read the same as new ones.
 */
export function splitNotes(a: Attempt): { tried: string[]; note: string } {
  if (a.triedNotes?.length) return { tried: a.triedNotes, note: a.notes };
  const tried: string[] = [];
  const rest: string[] = [];
  for (const line of a.notes.split('\n')) {
    const m = /^Before hint (\d): (.*)$/.exec(line);
    if (m) tried[Number(m[1]) - 1] = m[2];
    else rest.push(line);
  }
  return { tried: Array.from(tried, t => t ?? ''), note: rest.join('\n').trim() };
}

function hintUses(p: Problem, count: number, tried: string[]): HintUse[] {
  return Array.from({ length: Math.min(2, count) }, (_, i) => ({ n: i + 1, hint: p.hints[i], ...(tried[i] ? { tried: tried[i] } : {}) }));
}

function ref(p: Problem) {
  return { id: p.id, n: p.n, title: p.title, url: practiceUrl(p) };
}

export function buildHomeBaseStatus(input: {
  problems: Problem[];
  byId: Map<string, Problem>;
  states: Map<string, ProblemState>;
  plan: TodayPlan;
  stats: Stats;
  session?: FocusSession;
  leetcodeUsername?: string;
  now?: Date;
}) {
  const { problems, byId, states, plan, stats, session, leetcodeUsername } = input;
  const now = input.now ?? new Date();

  // Every pending re-solve (due or later), soonest first. Home Base splits due / upcoming itself.
  const resolves = problems
    .filter(p => states.get(p.id)?.nextResolveDay)
    .map(p => ({ ...ref(p), due: states.get(p.id)!.nextResolveDay! }))
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.n - b.n));

  const next = plan.upNext[0];
  const sp = session ? byId.get(session.problemId) : undefined;

  // Attempted problems, most recently worked on first, with their full history.
  const worked = problems
    .map(p => ({ p, s: states.get(p.id)! }))
    .filter(({ s }) => s && s.attempts.length > 0)
    .sort((a, b) => (a.s.last!.at < b.s.last!.at ? 1 : -1))
    .map(({ p, s }) => ({
      id: p.id,
      n: p.n,
      title: p.title,
      module: p.module,
      pattern: p.pattern,
      difficulty: p.difficulty,
      url: practiceUrl(p),
      leetcode: leetcodeUrl(p),
      phase: s.phase,
      nextResolveDay: s.nextResolveDay,
      javaNote: p.javaNote,
      attempts: s.attempts.map(a => {
        const { tried, note } = splitNotes(a);
        return {
          kind: a.kind,
          day: a.day,
          at: a.at,
          status: a.status,
          minutes: a.minutes,
          hintsUsed: a.hintsUsed,
          sawSolution: a.sawSolution,
          hints: hintUses(p, a.hintsUsed, tried),
          note,
        };
      }),
    }));

  const links: Record<string, string> = { 'Open tracker': APP_URL, "Striver's 180": SHEET_URL };
  if (leetcodeUsername) links.LeetCode = `https://leetcode.com/u/${encodeURIComponent(leetcodeUsername)}/`;

  const status = {
    schema: 1,
    app: 'dsa',
    updatedAt: localIso(now),
    attempted: stats.attempted,
    mastered: stats.mastered,
    learning: stats.learning,
    total: stats.total,
    coreTotal: stats.coreTotal,
    doneToday: stats.doneToday,
    doneThisWeek: stats.doneThisWeek,
    activeDaysThisWeek: stats.activeDaysThisWeek,
    next: next ? { ...ref(next), module: next.module, pattern: next.pattern, difficulty: next.difficulty } : null,
    resolves,
    session:
      session && sp
        ? {
            ...ref(sp),
            kind: session.kind,
            startedAt: session.startedAt,
            paused: session.runningSince === null,
            minutesSoFar: Math.round(elapsedMs(session, now.getTime()) / 60_000),
            hints: hintUses(sp, session.hintsRevealed, session.triedNotes),
            solutionRevealed: session.solutionRevealed,
          }
        : null,
    problems: worked,
    problemsOmitted: 0,
    links,
  };

  // Size guard: drop the least recently worked problems' detail until it fits.
  while (status.problems.length && new Blob([JSON.stringify(status)]).size > MAX_BYTES) {
    status.problems.pop();
    status.problemsOmitted++;
  }
  return status;
}

export type HomeBaseStatus = ReturnType<typeof buildHomeBaseStatus>;

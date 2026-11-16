// Pure scheduling logic. Everything here is derived from the attempts table on the fly
// (179 problems x a few attempts each is microseconds), so there is no second copy of
// "state" in the database that can drift out of sync.
//
// The method:
//   1. First attempt of a problem (any outcome)  -> re-solve from scratch 2 days later.
//   2. Re-solve CLEAN (no hints, no solution)    -> mastered, leaves the queue.
//   3. Re-solve not clean                         -> re-solve again 2 days after that.
//   A later non-clean attempt on a mastered problem puts it back into rotation.

import type { Attempt, Problem, ProblemState } from '@/types';
import { addDays, weekStart } from './dates';

export const RESOLVE_GAP_DAYS = 2;

export function sortAttempts(a: Attempt[]): Attempt[] {
  return [...a].sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : (x.id ?? 0) - (y.id ?? 0)));
}

export function deriveState(problemId: string, attempts: Attempt[], today: string): ProblemState {
  if (attempts.length === 0) {
    return { problemId, phase: 'new', attempts, nextResolveDay: null, isDue: false };
  }
  const sorted = sortAttempts(attempts);
  const last = sorted[sorted.length - 1];
  const mastered = last.kind === 'resolve' && last.status === 'CLEAN';
  const nextResolveDay = mastered ? null : addDays(last.day, RESOLVE_GAP_DAYS);
  return {
    problemId,
    phase: mastered ? 'mastered' : 'learning',
    attempts: sorted,
    last,
    nextResolveDay,
    isDue: nextResolveDay !== null && nextResolveDay <= today,
  };
}

export function buildStates(problems: Problem[], attempts: Attempt[], today: string): Map<string, ProblemState> {
  const byProblem = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const list = byProblem.get(a.problemId);
    if (list) list.push(a);
    else byProblem.set(a.problemId, [a]);
  }
  const states = new Map<string, ProblemState>();
  for (const p of problems) states.set(p.id, deriveState(p.id, byProblem.get(p.id) ?? [], today));
  return states;
}

/** The next attempt for a problem is a re-solve once it has any history. */
export function nextKind(state: ProblemState | undefined): 'first' | 'resolve' {
  return state && state.attempts.length > 0 ? 'resolve' : 'first';
}

export interface TodayPlan {
  /** Re-solves due today or overdue, most overdue first. */
  due: { problem: Problem; state: ProblemState }[];
  /** Next untouched problems in sheet order (stretch skipped unless enabled). */
  upNext: Problem[];
  /** Re-solves coming up in the next few days. */
  upcoming: { problem: Problem; state: ProblemState }[];
}

export function planToday(
  problems: Problem[],
  states: Map<string, ProblemState>,
  today: string,
  includeStretch: boolean,
  upNextCount = 3,
): TodayPlan {
  const due: TodayPlan['due'] = [];
  const upcoming: TodayPlan['upcoming'] = [];
  const upNext: Problem[] = [];
  for (const p of problems) {
    const s = states.get(p.id)!;
    if (s.isDue) due.push({ problem: p, state: s });
    else if (s.nextResolveDay && s.nextResolveDay <= addDays(today, 3)) upcoming.push({ problem: p, state: s });
    else if (s.phase === 'new' && upNext.length < upNextCount && (includeStretch || !p.stretch)) upNext.push(p);
  }
  due.sort((a, b) => (a.state.nextResolveDay! < b.state.nextResolveDay! ? -1 : 1) || a.problem.n - b.problem.n);
  upcoming.sort((a, b) => (a.state.nextResolveDay! < b.state.nextResolveDay! ? -1 : 1));
  return { due, upNext, upcoming };
}

export interface Stats {
  total: number;
  coreTotal: number;
  attempted: number;
  mastered: number;
  learning: number;
  doneToday: number;
  doneThisWeek: number;
  activeDaysThisWeek: number;
}

export function computeStats(problems: Problem[], states: Map<string, ProblemState>, attempts: Attempt[], today: string): Stats {
  let attempted = 0, mastered = 0, learning = 0, coreTotal = 0;
  for (const p of problems) {
    if (!p.stretch) coreTotal++;
    const s = states.get(p.id);
    if (!s || s.phase === 'new') continue;
    attempted++;
    if (s.phase === 'mastered') mastered++;
    else learning++;
  }
  const monday = weekStart(today);
  const thisWeek = attempts.filter(a => a.day >= monday && a.day <= today);
  return {
    total: problems.length,
    coreTotal,
    attempted,
    mastered,
    learning,
    doneToday: attempts.filter(a => a.day === today).length,
    doneThisWeek: thisWeek.length,
    activeDaysThisWeek: new Set(thisWeek.map(a => a.day)).size,
  };
}

/** Sensible default status for the log form, from what happened in the session. */
export function suggestStatus(hintsUsed: number, sawSolution: boolean): Attempt['status'] {
  if (sawSolution) return 'BLOCKER';
  if (hintsUsed > 0) return 'HESITANT';
  return 'CLEAN';
}

export const STATUS_LABEL: Record<Attempt['status'], string> = {
  CLEAN: 'Clean — no hints',
  HESITANT: 'With hints / shaky',
  BLOCKER: 'Needed the solution',
};

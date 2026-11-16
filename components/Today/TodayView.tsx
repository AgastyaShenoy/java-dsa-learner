'use client';

import React from 'react';
import { Play, RotateCcw } from 'lucide-react';
import type { FocusSession, Problem, ProblemState, UserSettings } from '@/types';
import type { Stats, TodayPlan } from '@/lib/progress';
import { formatDay, relativeDay } from '@/lib/dates';
import { HalftoneBar, ProblemMeta, Stamp } from '../ui/bits';
import { LiveClock } from '../Focus/LiveClock';
import { RatingTile } from './RatingTile';

interface TodayViewProps {
  plan: TodayPlan;
  stats: Stats;
  today: string;
  session?: FocusSession;
  sessionProblem?: Problem;
  settings: UserSettings;
  canFloat: boolean;
  onStart: (p: Problem) => void;
  onOpenProblem: (p: Problem) => void;
  onResume: () => void;
  onBrowse: () => void;
}

export function TodayView({ plan, stats, today, session, sessionProblem, settings, canFloat, onStart, onOpenProblem, onResume, onBrowse }: TodayViewProps) {
  const hero = plan.due[0] ?? (plan.upNext[0] ? { problem: plan.upNext[0], state: undefined } : undefined);
  const heroIsResolve = !!plan.due[0];
  const moreDue = plan.due.slice(1);
  const afterThat = heroIsResolve ? plan.upNext.slice(0, 2) : plan.upNext.slice(1, 3);
  const heroRunning = !!hero && session?.problemId === hero.problem.id;

  return (
    <div className="space-y-14">
      <header className="flex items-end justify-between gap-x-6 gap-y-2 flex-wrap">
        <h1 className="spray misreg text-[clamp(2.75rem,10vw,4.75rem)]">Today</h1>
        <p className="t-label text-xs text-ink-2 pb-2">{formatDay(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      {/* Attempt in progress: a small sticky note, taped where you'll see it. */}
      {session && sessionProblem && !heroRunning && (
        <div className="relative w-fit max-w-full">
          <span className="tape -top-3 left-1/2 -translate-x-1/2 !w-16" style={{ ['--rot' as string]: '3deg' }} aria-hidden />
          <button onClick={onResume} className="note px-5 pt-5 pb-4 text-left min-w-[15rem] max-w-xs transition-transform hover:rotate-0">
            <span className="block text-xs text-ink-2">Attempt in progress{session.runningSince === null ? ', paused' : ''}</span>
            <span className="block font-display font-bold leading-snug mt-0.5">{sessionProblem.title}</span>
            <LiveClock session={session} className="t-clock text-2xl block mt-2" />
          </button>
        </div>
      )}

      {/* The one thing to do now: the biggest thing on the screen. */}
      {hero ? (
        <section aria-labelledby="hero-title" className="space-y-5">
          <div className="flex items-start gap-4">
            <h2 id="hero-title" className="flex-1 text-[2.25rem] sm:text-[3.5rem] leading-[1] font-extrabold" style={{ fontStretch: '118%' }}>
              <button onClick={() => onOpenProblem(hero.problem)} className="text-left hover:underline underline-offset-[8px] decoration-[3px] decoration-ink-pink">
                {hero.problem.title}
              </button>
            </h2>
            {heroIsResolve && (
              <Stamp seed={hero.problem.id} ink="var(--ink-blue)" className="mt-2 shrink-0">
                <RotateCcw className="w-3.5 h-3.5" aria-hidden /> Re-solve
              </Stamp>
            )}
          </div>
          <ProblemMeta p={hero.problem} />
          {heroIsResolve && hero.state && <ResolveNote state={hero.state} today={today} />}

          <div className="pt-4 flex flex-wrap items-center gap-x-8 gap-y-5">
            <button className="btn-primary !text-base !px-7 !py-4" onClick={() => (heroRunning ? onResume() : onStart(hero.problem))}>
              <Play className="w-4 h-4 fill-current" aria-hidden />
              {heroRunning ? 'Back to it' : "Open today's problem"}
            </button>
            {heroRunning && session ? (
              <span className="flex items-baseline gap-2 text-ink-2">
                <LiveClock session={session} className="t-clock text-3xl text-ink" />
                {session.runningSince === null ? 'paused' : 'running'}
              </span>
            ) : (
              <p className="text-[0.9375rem] text-ink-2 max-w-[20rem] leading-snug">
                {typeof window !== 'undefined' && window.desktop
                  ? 'Opens it in your browser with a small timer floating on top.'
                  : canFloat ? 'A small timer floats on top; open LeetCode from it.' : 'Opens it in its own window and starts the timer.'}{' '}
                Hints unlock after {settings.hintLockMinutes} minutes alone.
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="py-6 space-y-4">
          <p className="spray misreg text-[3.25rem]">All caught up</p>
          <p className="text-ink-2 max-w-sm">
            {settings.includeStretch ? 'You have attempted every problem.' : 'Only stretch problems are left. Turn them on in Settings, or pick one from the sheet.'}
          </p>
          <button className="btn" onClick={onBrowse}>Browse the sheet</button>
        </section>
      )}

      {moreDue.length > 0 && (
        <ProblemList title={`Also due (${moreDue.length})`} items={moreDue.map(d => ({ problem: d.problem, note: overdueText(d.state, today) }))} onStart={onStart} onOpen={onOpenProblem} />
      )}

      {afterThat.length > 0 && (
        <ProblemList title="After that" items={afterThat.map(p => ({ problem: p }))} onStart={onStart} onOpen={onOpenProblem} />
      )}

      {plan.upcoming.length > 0 && (
        <section>
          <h2 className="text-lg mb-4">Re-solves coming up</h2>
          <ul className="flex flex-wrap gap-x-3 gap-y-3">
            {plan.upcoming.slice(0, 8).map(({ problem, state }, i) => (
              <li key={problem.id} style={{ transform: `rotate(${i % 2 ? 1.2 : -1}deg)` }}>
                <button onClick={() => onOpenProblem(problem)} className="badge !text-[13px] !py-1 !px-2.5 hover:!rotate-0">
                  {problem.title} <span className="text-ink-blue">{relativeDay(state.nextResolveDay!, today)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Tally stats={stats} />

      <RatingTile username={settings.leetcodeUsername} />
    </div>
  );
}

function overdueText(state: ProblemState, today: string) {
  const d = state.nextResolveDay!;
  return d === today ? 'due today' : `due ${relativeDay(d, today)}`;
}

function ResolveNote({ state, today }: { state: ProblemState; today: string }) {
  const last = state.last!;
  const verdict = last.status === 'CLEAN' ? 'clean' : last.status === 'HESITANT' ? 'with hints' : 'needed the solution';
  return (
    <p className="text-[1.0625rem] text-ink-2 max-w-prose">
      Last time ({relativeDay(last.day, today)}): {verdict}, {last.minutes} min. Close the old code and write it again from a blank file.
    </p>
  );
}

function ProblemList({ title, items, onStart, onOpen }: {
  title: string;
  items: { problem: Problem; note?: string }[];
  onStart: (p: Problem) => void;
  onOpen: (p: Problem) => void;
}) {
  return (
    <section>
      <h2 className="text-lg mb-2">{title}</h2>
      <ul className="ruled rule-top rule-bottom">
        {items.map(({ problem, note }) => (
          <li key={problem.id} className="flex items-center gap-4 py-4">
            <button onClick={() => onOpen(problem)} className="min-w-0 flex-1 text-left group">
              <span className="block font-display font-bold text-[1.125rem] truncate group-hover:underline underline-offset-4 decoration-2 decoration-ink-pink">{problem.title}</span>
              <span className="mt-1.5 flex items-center gap-2">
                <ProblemMeta p={problem} />
                {note && <span className="text-xs font-display font-bold text-ink-blue">{note}</span>}
              </span>
            </button>
            <button className="btn shrink-0" onClick={() => onStart(problem)} aria-label={`Start ${problem.title}`}>
              <Play className="w-3.5 h-3.5" aria-hidden /> <span className="hidden sm:inline">Start</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Progress printed straight on the desk: how far through the sheet, then the week in a sentence. */
function Tally({ stats }: { stats: Stats }) {
  const rotating = stats.attempted - stats.mastered;
  return (
    <section className="rule-top pt-8" aria-label="Progress">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="t-stat text-[3.5rem]">{stats.attempted}</span>
        <span className="font-display font-bold text-lg">of {stats.total} attempted</span>
        <span className="sm:ml-auto text-ink-2">{stats.mastered} mastered · {rotating} in rotation</span>
      </div>
      <div className="mt-4">
        <HalftoneBar total={stats.total} mastered={stats.mastered} active={rotating} label={`${stats.mastered} mastered and ${rotating} in rotation out of ${stats.total}`} height="h-4" />
      </div>
      <p className="mt-3 text-sm text-ink-2">
        This week: {stats.doneThisWeek} attempt{stats.doneThisWeek === 1 ? '' : 's'} over {stats.activeDaysThisWeek} day{stats.activeDaysThisWeek === 1 ? '' : 's'}, {stats.doneToday} of them today.
      </p>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import { Bot, CheckCircle2, ExternalLink, Lock, Pause, PictureInPicture2, Play, RotateCcw, Trash2, Unlock, Video, FileText, XCircle } from 'lucide-react';
import type { FocusSession as Session, Problem } from '@/types';
import { Dialog } from '../ui/Dialog';
import { ProblemMeta } from '../ui/bits';
import { LiveClock } from './LiveClock';
import { useNow } from '@/lib/hooks';
import { formatClock } from '@/lib/dates';
import { hintGate, MIN_TRIED_CHARS, pause, practiceUrl, resume, revealHint, revealSolution, youtubeUrl } from '@/lib/session';

interface Props {
  session: Session;
  problem: Problem;
  lockMinutes: number;
  onMinimize: () => void;
  onFinish: (outcome: 'solved' | 'stuck') => void;
  onDiscard: () => void;
  onAskAI: () => void;
  /** Opens the practice window (and the floating timer, where supported). */
  onOpenPractice: () => void;
  /** Present when the timer can float and isn't floating yet. */
  onFloat?: () => void;
}

export function FocusSession({ session, problem, lockMinutes, onMinimize, onFinish, onDiscard, onAskAI, onOpenPractice, onFloat }: Props) {
  const paused = session.runningSince === null;
  const onLeetcode = practiceUrl(problem).includes('leetcode.com');

  return (
    <Dialog
      open
      variant="full"
      onClose={onMinimize}
      title={<span className="t-label text-xs text-ink-2">{session.kind === 'resolve' ? 'Re-solve' : 'Attempt'} · Esc to minimise</span>}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Problem + clock */}
        <section className="text-center space-y-4">
          <h1 className="text-[1.75rem] sm:text-[2.5rem] text-ink">{problem.title}</h1>
          <div className="flex justify-center"><ProblemMeta p={problem} /></div>
          {session.kind === 'resolve' && (
            <p className="flex items-center justify-center gap-2 text-sm text-ink-blue">
              <RotateCcw className="w-4 h-4" aria-hidden /> Re-solve from a blank file. Don&apos;t look at your old code.
            </p>
          )}

          <LiveClock session={session} className={`block t-clock text-[5rem] sm:text-[7.5rem] pt-4 pb-2 ${paused ? 'text-ink-3' : 'text-ink'}`} />

          <div className="flex flex-wrap justify-center gap-3">
            <button className="btn" onClick={() => (paused ? resume(session) : pause(session))} data-autofocus>
              {paused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Take a break</>}
            </button>
            <button className="btn" onClick={onOpenPractice}>
              <ExternalLink className="w-4 h-4" /> Open on {onLeetcode ? 'LeetCode' : 'takeuforward'}
            </button>
            {onFloat && (
              <button className="btn" onClick={onFloat} title="An always-on-top mini timer you can keep over LeetCode">
                <PictureInPicture2 className="w-4 h-4" /> Float the timer
              </button>
            )}
          </div>
          {paused && <p className="text-sm text-ink-2">Paused. Break time doesn&apos;t count toward the hint unlock.</p>}
        </section>

        {/* Hint ladder */}
        <section className="space-y-3" aria-label="Hints">
          {[0, 1].map(i => (
            <HintStep key={i} index={i} session={session} problem={problem} lockMinutes={lockMinutes} />
          ))}
          <SolutionStep session={session} problem={problem} />
        </section>

        {/* Finish */}
        <section className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 pt-2">
          <button className="btn-primary !px-6 !py-3.5" onClick={() => onFinish('solved')}>
            <CheckCircle2 className="w-4 h-4" aria-hidden /> I solved it
          </button>
          <button className="btn !py-2.5" onClick={() => onFinish('stuck')}>
            <XCircle className="w-4 h-4" aria-hidden /> Didn&apos;t get it. Log it
          </button>
          <button className="btn !py-2.5" onClick={onAskAI}>
            <Bot className="w-4 h-4" aria-hidden /> Rubber-duck with local AI
          </button>
          <button className="btn-quiet" onClick={onDiscard}>
            <Trash2 className="w-4 h-4" aria-hidden /> Discard
          </button>
        </section>
      </div>
    </Dialog>
  );
}

function HintStep({ index, session, problem, lockMinutes }: { index: number; session: Session; problem: Problem; lockMinutes: number }) {
  const [tried, setTried] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Tick only while this step is counting down.
  const lockedByTime = index === 0 && session.hintsRevealed === 0;
  const now = useNow(1000, lockedByTime && session.runningSince !== null);
  const gate = hintGate(session, index, lockMinutes, now);
  const label = index === 0 ? 'Hint 1 · what to notice' : 'Hint 2 · which direction';

  // Locked: a dashed outline on the desk. Ready: the outline turns yellow and asks
  // what you tried. Revealed: the hint is printed on the desk under a small tag.
  if (gate.kind === 'done') {
    return (
      <div className="px-1 py-2">
        <span className="badge stock-yellow">{label}</span>
        <p className="mt-3 text-[1.125rem] text-ink leading-relaxed max-w-prose">{problem.hints[index]}</p>
        <p className="mt-2 text-sm text-ink-2">You tried: {session.triedNotes[index]}</p>
      </div>
    );
  }

  if (gate.kind === 'locked') {
    return (
      <div className="placeholder px-6 py-4">
        <p className="text-xs t-label text-ink-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <Lock className="w-3.5 h-3.5" aria-hidden />{label}
          <span className="ml-auto normal-case tracking-normal font-sans font-medium text-sm">
            {Number.isFinite(gate.unlocksInMs) ? <>unlocks in <span className="t-clock text-ink">{formatClock(gate.unlocksInMs)}</span> of solo time</> : 'after hint 1'}
          </span>
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await revealHint(session, tried);
      setTried('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reveal hint');
    }
  };

  return (
    <form className="placeholder !border-ink-yellow-fill px-6 py-5 space-y-4" onSubmit={submit}>
      <label htmlFor={`tried-${index}`} className="block">
        <span className="badge stock-yellow"><Unlock className="w-3 h-3" aria-hidden />{label} is ready</span>
        <span className="block mt-3 font-display font-bold text-xl">First, what have you tried{index === 1 ? ' since hint 1' : ''}?</span>
      </label>
      <textarea
        id={`tried-${index}`}
        className="field min-h-[72px] text-sm"
        value={tried}
        onChange={e => setTried(e.target.value)}
        placeholder={index === 0 ? 'e.g. brute force with two loops works but is O(n²); stuck on how to avoid rescanning…' : 'e.g. tracked X like the hint said, but the window breaks when…'}
      />
      <div className="flex items-center gap-3">
        <button type="submit" className="btn" disabled={tried.trim().length < MIN_TRIED_CHARS}>Show hint {index + 1}</button>
        {error && <span className="text-xs text-ink-orange">{error}</span>}
        <span className="text-sm text-ink-2 ml-auto">Writing it down is half the hint.</span>
      </div>
    </form>
  );
}

function SolutionStep({ session, problem }: { session: Session; problem: Problem }) {
  const [confirming, setConfirming] = useState(false);
  const yt = youtubeUrl(problem);
  const available = session.hintsRevealed >= 2;

  if (session.solutionRevealed) {
    return (
      <div className="px-1 py-2 space-y-4">
        <span className="badge stock-white">Solution</span>
        <div className="flex flex-wrap gap-2">
          {yt && <a className="btn" href={yt} target="_blank" rel="noopener noreferrer"><Video className="w-4 h-4" /> Striver&apos;s video</a>}
          {problem.editorialUrl && <a className="btn" href={problem.editorialUrl} target="_blank" rel="noopener noreferrer"><FileText className="w-4 h-4" /> Editorial</a>}
          <a className="btn" href={problem.tufUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /> takeuforward page</a>
        </div>
        <p className="text-sm text-ink-2">Watch until you get the idea, then close it and write the code yourself. This attempt is logged as &quot;needed the solution&quot;, and the re-solve in 2 days is where it sticks.</p>
      </div>
    );
  }

  return (
    <div className={`placeholder px-6 ${available ? 'py-5 !border-ink-pink' : 'py-4'}`}>
      <p className="text-xs t-label text-ink-2 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" aria-hidden /> Full solution
        {!available && <span className="ml-auto normal-case tracking-normal font-sans font-medium text-sm">after both hints</span>}
      </p>
      {available && !confirming && (
        <button className="btn mt-4" onClick={() => setConfirming(true)}>I made a real attempt. Show me the solution</button>
      )}
      {available && confirming && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-ink">Sure? Another 10 minutes with hint 2 often does it. Seeing the solution marks this attempt as &quot;needed the solution&quot;.</p>
          <div className="flex gap-2">
            <button className="btn" onClick={() => revealSolution(session)}>Yes, show it</button>
            <button className="btn" onClick={() => setConfirming(false)}>Keep trying</button>
          </div>
        </div>
      )}
    </div>
  );
}

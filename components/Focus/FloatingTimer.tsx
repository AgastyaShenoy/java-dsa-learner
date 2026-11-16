'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ExternalLink, Lock, Maximize2, Pause, Play, XCircle } from 'lucide-react';
import type { FocusSession, Problem } from '@/types';
import { TimerWindowContext, useNow } from '@/lib/hooks';
import { formatClock } from '@/lib/dates';
import { hintGate, MIN_TRIED_CHARS, pause, practiceUrl, resume, revealHint } from '@/lib/session';
import { LiveClock } from './LiveClock';

interface Props {
  pipWindow: Window;
  session: FocusSession;
  problem: Problem;
  lockMinutes: number;
  onFinish: (outcome: 'solved' | 'stuck') => void;
  onBackToApp: () => void;
  /** Whether the practice window has been opened from this float yet. */
  practiceOpened: boolean;
  onOpenPractice: () => void;
}

/**
 * The always-on-top mini panel (Document Picture-in-Picture). React renders into the PiP
 * window's body through a portal, so it shares state with the app: pausing here pauses
 * the session everywhere. The solution step stays in the app on purpose (more friction).
 */
export function FloatingTimer({ pipWindow, ...rest }: Props) {
  // Keep the panel's theme in sync if it changes in Settings while the panel is open.
  useEffect(() => {
    const sync = () => pipWindow.document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') ?? 'dark');
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, [pipWindow]);

  return createPortal(
    <TimerWindowContext.Provider value={pipWindow}>
      <Panel {...rest} />
    </TimerWindowContext.Provider>,
    pipWindow.document.body,
  );
}

/** The panel itself. Also rendered directly as the desktop app's timer window. */
export function FloatPanel(props: Omit<Props, 'pipWindow'>) {
  return <Panel {...props} />;
}

function Panel({ session, problem, lockMinutes, onFinish, onBackToApp, practiceOpened, onOpenPractice }: Omit<Props, 'pipWindow'>) {
  const paused = session.runningSince === null;
  const site = practiceUrl(problem).includes('leetcode.com') ? 'LeetCode' : 'takeuforward';
  return (
    <div className="h-screen flex flex-col gap-3 p-3 bg-paper-0 text-ink">
      <div className="flex items-center gap-1 min-w-0">
        <p className="t-label text-[11px] text-ink-2 truncate flex-1" title={problem.title}>
          {session.kind === 'resolve' ? 'Re-solve · ' : ''}{problem.title}
        </p>
        {practiceOpened && (
          <button className="btn-icon !w-7 !h-7" onClick={onOpenPractice} title={`Bring ${site} back`} aria-label={`Bring ${site} back`}>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
        <button className="btn-icon !w-7 !h-7" onClick={onBackToApp} title="Back to the app" aria-label="Back to the app">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!practiceOpened && (
        <button className="btn-primary !py-2.5" onClick={onOpenPractice} autoFocus>
          <ExternalLink className="w-4 h-4" /> Open on {site}
        </button>
      )}

      <div className="flex items-center gap-3">
        <LiveClock session={session} className={`t-clock text-[2.6rem] flex-1 ${paused ? 'text-ink-3' : 'text-ink'}`} />
        <button
          className="btn !px-2.5"
          onClick={() => (paused ? resume(session) : pause(session))}
          aria-label={paused ? 'Resume' : 'Take a break'}
          title={paused ? 'Resume' : 'Take a break'}
        >
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {session.triedNotes.slice(0, session.hintsRevealed).map((_, i) => (
          <div key={i} className="pb-1">
            <span className="badge stock-yellow !text-[10.5px]">Hint {i + 1}</span>
            <p className="mt-1.5 text-[13px] leading-snug">{problem.hints[i]}</p>
          </div>
        ))}
        <NextHint session={session} lockMinutes={lockMinutes} onBackToApp={onBackToApp} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className={practiceOpened ? 'btn-primary !px-2 !text-sm' : 'btn !px-2 !py-2'} onClick={() => onFinish('solved')}>
          <CheckCircle2 className="w-4 h-4" /> Solved
        </button>
        <button className="btn !px-2 !py-2" onClick={() => onFinish('stuck')}>
          <XCircle className="w-4 h-4" /> Didn&apos;t get it
        </button>
      </div>
    </div>
  );
}

function NextHint({ session, lockMinutes, onBackToApp }: { session: FocusSession; lockMinutes: number; onBackToApp: () => void }) {
  const index = session.hintsRevealed;
  const [tried, setTried] = useState('');
  const [error, setError] = useState<string | null>(null);
  const counting = index === 0 && session.runningSince !== null;
  const now = useNow(1000, counting);

  if (index >= 2) {
    return (
      <button className="w-full text-left text-xs text-ink-2 px-1 hover:text-ink" onClick={onBackToApp}>
        Both hints used. The full solution is in the app, behind one more confirm.
      </button>
    );
  }

  const gate = hintGate(session, index, lockMinutes, now);
  if (gate.kind === 'locked') {
    return (
      <p className="flex items-center gap-1.5 text-xs text-ink-2 px-1">
        <Lock className="w-3 h-3" /> Hint {index + 1} in {formatClock(gate.unlocksInMs)} of solo time
      </p>
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
    <form onSubmit={submit} className="space-y-1.5">
      <label htmlFor="pip-tried" className="t-label text-[10px] text-ink-yellow block">
        Hint {index + 1} ready · what have you tried{index === 1 ? ' since hint 1' : ''}?
      </label>
      <textarea id="pip-tried" className="field !text-[13px] !py-1.5 min-h-[56px]" value={tried} onChange={e => setTried(e.target.value)} />
      <div className="flex items-center gap-2">
        <button type="submit" className="btn !py-1 !text-xs" disabled={tried.trim().length < MIN_TRIED_CHARS}>Show hint {index + 1}</button>
        {error && <span className="text-[11px] text-ink-orange">{error}</span>}
      </div>
    </form>
  );
}

'use client';

import React from 'react';
import { Bot, ExternalLink, FileText, Pencil, Play, PlusCircle, Trash2, Video } from 'lucide-react';
import type { Attempt, Problem, ProblemState } from '@/types';
import { Dialog } from './ui/Dialog';
import { PhaseBadge, ProblemMeta, StatusStamp } from './ui/bits';
import { STATUS_LABEL } from '@/lib/progress';
import { formatDay, relativeDay } from '@/lib/dates';
import { leetcodeUrl, youtubeUrl } from '@/lib/session';

interface Props {
  problem: Problem;
  state: ProblemState;
  today: string;
  activeSessionProblemId: string | null;
  onClose: () => void;
  onStart: () => void;
  onLogElsewhere: () => void;
  onEditAttempt: (a: Attempt) => void;
  onDeleteAttempt: (a: Attempt) => void;
  onAskAI: () => void;
}

export function ProblemDrawer({ problem, state, today, activeSessionProblemId, onClose, onStart, onLogElsewhere, onEditAttempt, onDeleteAttempt, onAskAI }: Props) {
  const lc = leetcodeUrl(problem);
  const yt = youtubeUrl(problem);
  const hasHistory = state.attempts.length > 0;
  const runningHere = activeSessionProblemId === problem.id;
  const startLabel = runningHere ? 'Back to the attempt' : hasHistory ? 'Start a re-solve' : 'Start attempt';

  return (
    <Dialog open variant="right" onClose={onClose} title={problem.title}>
      <div className="px-6 py-6 space-y-7">
        <div className="space-y-2">
          <ProblemMeta p={problem} />
          <PhaseBadge state={state} today={today} />
          {state.nextResolveDay && (
            <p className="text-xs text-ink-2">Next from-scratch re-solve: {formatDay(state.nextResolveDay)} ({relativeDay(state.nextResolveDay, today)})</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={onStart}><Play className="w-4 h-4 fill-paper-0" /> {startLabel}</button>
          <button className="btn" onClick={onLogElsewhere}><PlusCircle className="w-4 h-4" /> Log one I did elsewhere</button>
        </div>

        <section>
          <h3 className="label">Practice links</h3>
          <div className="flex flex-wrap gap-2">
            {lc && (
              <a className="btn" href={lc} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" /> LeetCode{problem.leetcodePremium ? ' (Premium)' : ''}
              </a>
            )}
            <a className="btn" href={problem.tufUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" /> takeuforward{problem.tufPremium ? ' (Plus)' : ''}
            </a>
          </div>
          {!lc && <p className="mt-2 text-xs text-ink-2">No exact LeetCode match, so practise it on takeuforward.</p>}
        </section>

        <section>
          <h3 className="label">History</h3>
          {hasHistory ? (
            <ol className="ruled border-y-[1.5px] border-dashed border-line">
              {[...state.attempts].reverse().map(a => (
                <li key={a.id} className="py-3">
                  <div className="flex items-center gap-3 text-sm">
                    <StatusStamp status={a.status} seed={a.id ?? a.at} />
                    <span className="text-ink-2 font-display" title={STATUS_LABEL[a.status]}>{a.kind === 'resolve' ? 're-solve' : 'first try'} · {formatDay(a.day)} · {a.minutes}m{a.hintsUsed ? ` · ${a.hintsUsed} hint${a.hintsUsed > 1 ? 's' : ''}` : ''}</span>
                    <span className="ml-auto flex gap-0.5">
                      <button className="btn-icon !w-7 !h-7" onClick={() => onEditAttempt(a)} aria-label="Edit attempt"><Pencil className="w-3.5 h-3.5" /></button>
                      <button className="btn-icon !w-7 !h-7 hover:!text-ink-orange" onClick={() => onDeleteAttempt(a)} aria-label="Delete attempt"><Trash2 className="w-3.5 h-3.5" /></button>
                    </span>
                  </div>
                  {a.notes && <p className="mt-2 text-[0.9375rem] text-ink whitespace-pre-wrap">{a.notes}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-2">Not attempted yet. Hints unlock inside an attempt, after solo time.</p>
          )}
        </section>

        {hasHistory && (
          <section>
            <h3 className="label">Review (you&apos;ve done this one)</h3>
            <details className="group border-y-[1.5px] border-dashed border-line py-3">
              <summary className="text-[0.9375rem] font-semibold text-ink cursor-pointer select-none hover:text-ink-pink">Show hints, Java note and solution links</summary>
              <div className="mt-3 space-y-3 text-[0.9375rem]">
                <p><span className="text-ink-2">Notice: </span><span className="text-ink">{problem.hints[0]}</span></p>
                <p><span className="text-ink-2">Direction: </span><span className="text-ink">{problem.hints[1]}</span></p>
                <p><span className="text-ink-2">Java: </span><span className="text-ink">{problem.javaNote}</span></p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {yt && <a className="btn" href={yt} target="_blank" rel="noopener noreferrer"><Video className="w-3.5 h-3.5" /> Video</a>}
                  {problem.editorialUrl && <a className="btn" href={problem.editorialUrl} target="_blank" rel="noopener noreferrer"><FileText className="w-3.5 h-3.5" /> Editorial</a>}
                </div>
              </div>
            </details>
          </section>
        )}

        <button className="btn" onClick={onAskAI}><Bot className="w-4 h-4" /> Ask local AI about this problem</button>
      </div>
    </Dialog>
  );
}

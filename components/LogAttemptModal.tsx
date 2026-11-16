'use client';

import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import type { Attempt, AttemptKind, AttemptStatus, Problem, ProblemState } from '@/types';
import { Dialog } from './ui/Dialog';
import { Stamp, StatusDot, TriedNotes } from './ui/bits';
import { RESOLVE_GAP_DAYS, STATUS_LABEL, nextKind, suggestStatus } from '@/lib/progress';
import { addDays, formatDay, localDay } from '@/lib/dates';

export interface LogRequest {
  mode: 'new' | 'edit';
  problemId: string;
  attempt?: Attempt;
  /** True when this closes a running focus session. */
  fromSession?: boolean;
  prefill?: {
    kind: AttemptKind;
    status: AttemptStatus;
    minutes: number;
    hintsUsed: number;
    sawSolution: boolean;
    notes: string;
    /** The session's "what have you tried?" notes, saved with the attempt as-is. */
    triedNotes?: string[];
  };
}

type Values = Pick<Attempt, 'status' | 'minutes' | 'hintsUsed' | 'notes' | 'sawSolution'>;

interface Props {
  request: LogRequest;
  problem: Problem;
  state: ProblemState;
  onClose: () => void;
  onSave: (req: LogRequest, v: Values) => Promise<void>;
  onDelete: (a: Attempt) => Promise<void>;
}

export function LogAttemptModal({ request, problem, state, onClose, onSave, onDelete }: Props) {
  const base = request.attempt ?? request.prefill;
  const kind: AttemptKind = request.attempt?.kind ?? request.prefill?.kind ?? nextKind(state);
  const [status, setStatus] = useState<AttemptStatus>(base?.status ?? 'CLEAN');
  const [minutes, setMinutes] = useState<string>(base?.minutes ? String(base.minutes) : '');
  const [hintsUsed, setHintsUsed] = useState<number>(base?.hintsUsed ?? 0);
  const [sawSolution, setSawSolution] = useState<boolean>(base?.sawSolution ?? false);
  const [notes, setNotes] = useState<string>(base?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minutesNum = Number(minutes);
  const minutesValid = minutes.trim() !== '' && Number.isFinite(minutesNum) && minutesNum >= 0 && minutesNum <= 1440;

  // Keep status honest when the hint/solution toggles change (only for new logs).
  const setHints = (n: number) => { setHintsUsed(n); if (request.mode === 'new') setStatus(suggestStatus(n, sawSolution)); };
  const setSolution = (b: boolean) => { setSawSolution(b); if (request.mode === 'new') setStatus(suggestStatus(hintsUsed, b)); };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!minutesValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(request, { status, minutes: Math.round(minutesNum), hintsUsed, sawSolution, notes: notes.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      setSaving(false);
    }
  };

  const today = localDay();
  const masteredIfSaved = request.mode === 'new' && kind === 'resolve' && status === 'CLEAN';
  const title = request.mode === 'edit'
    ? `Edit ${request.attempt?.kind === 'resolve' ? 're-solve' : 'attempt'} · ${formatDay(request.attempt!.day)}`
    : `Log ${kind === 'resolve' ? 're-solve' : 'attempt'}: ${problem.title}`;

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      closeOnBackdrop={false}
      width="32rem"
      footer={
        <div className="flex items-center gap-2">
          {request.mode === 'edit' && request.attempt && (
            <button type="button" className="btn danger" onClick={() => onDelete(request.attempt!)}>Delete</button>
          )}
          {error && <span className="text-xs text-ink-orange">{error}</span>}
          <button type="button" className="btn ml-auto" onClick={onClose}>Cancel</button>
          <button type="submit" form="log-form" className="btn-primary" disabled={!minutesValid || saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      <form
        id="log-form"
        onSubmit={submit}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
        className="px-6 py-6 space-y-6"
      >
        <fieldset>
          <legend className="label">How did it go?</legend>
          <div className="flex flex-wrap gap-x-2 gap-y-1 -mx-2">
            {(Object.keys(STATUS_LABEL) as AttemptStatus[]).map(s => (
              <label key={s} className={`chip !text-[0.9375rem] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ink-yellow-fill ${status === s ? 'is-on' : ''}`}>
                <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" data-autofocus={status === s ? true : undefined} />
                <StatusDot status={s} />
                {STATUS_LABEL[s]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="log-minutes" className="label">Minutes</label>
            <input
              id="log-minutes"
              className="field tabular-nums"
              inputMode="numeric"
              value={minutes}
              onChange={e => setMinutes(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 40"
            />
          </div>
          <div>
            <span className="label">Hints used</span>
            <div className="flex gap-1 -mx-1" role="radiogroup" aria-label="Hints used">
              {[0, 1, 2].map(n => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={hintsUsed === n}
                  onClick={() => setHints(n)}
                  className="chip !justify-center t-clock !text-lg !px-4"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={sawSolution} onChange={e => setSolution(e.target.checked)} className="accent-ink-pink w-4 h-4" />
          I looked at the solution (video, editorial or someone else&apos;s code)
        </label>

        <TriedNotes notes={request.attempt?.triedNotes ?? request.prefill?.triedNotes} />

        <div>
          <label htmlFor="log-notes" className="label">Notes: what you missed, the key idea</label>
          <textarea id="log-notes" className="field min-h-[96px] text-sm" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Missed that the window only ever grows. Use HashMap<Character,Integer>, not int[26], for mixed case." />
        </div>

        {request.mode === 'new' && (
          <div className="flex items-center gap-4">
            {/* Verdict stamp; re-keyed so it lands again when the outcome changes. */}
            {masteredIfSaved ? (
              <Stamp key="m" seed={problem.id} ink="var(--ink-green)" animate>Mastered</Stamp>
            ) : (
              <Stamp key="r" seed={problem.id} ink="var(--ink-blue)" animate>Re-solve in {RESOLVE_GAP_DAYS} days</Stamp>
            )}
            <p className="text-xs text-ink-2 flex items-start gap-2">
              <Coffee className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {masteredIfSaved
                ? 'Clean re-solve: this one leaves the queue.'
                : `From scratch on ${formatDay(addDays(today, RESOLVE_GAP_DAYS), { weekday: 'short', day: 'numeric', month: 'short' })}.`}
            </p>
          </div>
        )}

        <aside className="border-t-[1.5px] border-dashed border-line pt-4">
          <p className="label !mb-1">Java note</p>
          <p className="text-[0.9375rem] text-ink">{problem.javaNote}</p>
        </aside>
      </form>
    </Dialog>
  );
}

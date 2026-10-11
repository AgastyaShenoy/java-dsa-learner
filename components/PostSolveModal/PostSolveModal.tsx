'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Coffee, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { Problem, ProblemLog } from '@/types';
import { saveProblemLog, getProblemLog } from '@/lib/db';

interface PostSolveModalProps {
  problem: Problem | null;
  initialHintsCount?: number;
  initialTimeSpentMinutes?: number;
  isOpen: boolean;
  onClose: () => void;
  onLogSaved: () => void;
}

export const PostSolveModal: React.FC<PostSolveModalProps> = ({
  problem,
  initialHintsCount = 0,
  initialTimeSpentMinutes,
  isOpen,
  onClose,
  onLogSaved
}) => {
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(30);
  const [status, setStatus] = useState<ProblemLog['status']>('CLEAN');
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<ProblemLog['perceivedDifficulty']>('Medium');
  const [hintsViewedCount, setHintsViewedCount] = useState<number>(initialHintsCount);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!problem) return;
    setHintsViewedCount(initialHintsCount);

    getProblemLog(problem.id).then(existingLog => {
      if (existingLog) {
        setTimeSpentMinutes(
          initialTimeSpentMinutes && initialTimeSpentMinutes > 0 
            ? initialTimeSpentMinutes 
            : existingLog.timeSpentMinutes
        );
        setStatus(existingLog.status);
        setPerceivedDifficulty(existingLog.perceivedDifficulty);
        setHintsViewedCount(Math.max(initialHintsCount, existingLog.hintsViewedCount));
        setNotes(existingLog.notes || '');
      } else {
        setTimeSpentMinutes(
          initialTimeSpentMinutes && initialTimeSpentMinutes > 0 
            ? initialTimeSpentMinutes 
            : 30
        );
        setStatus(initialHintsCount > 0 ? 'HESITANT' : 'CLEAN');
        setPerceivedDifficulty(problem.difficulty as ProblemLog['perceivedDifficulty']);
        setNotes('');
      }
    });
  }, [problem, initialHintsCount, initialTimeSpentMinutes, isOpen]);

  if (!isOpen || !problem) return null;

  const willScheduleReview = status === 'HESITANT' || status === 'BLOCKER';
  const nextReviewDateObj = new Date();
  nextReviewDateObj.setDate(nextReviewDateObj.getDate() + 3);
  const nextReviewFormatted = nextReviewDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const quickTimes = [15, 30, 45, 60];
  const quickJavaTags = [
    'Long overflow',
    'ArrayDeque > Stack',
    'Sentinel dummy node',
    'Integer.compare(a, b)',
    'Dutch Flag mid invariant',
    'HashMap put(0, 1) prefix XOR',
    'Floyd cycle slow/fast',
    'Math.max in-place'
  ];

  const handleAddQuickTag = (tag: string) => {
    setNotes(prev => prev ? `${prev} • ${tag}` : tag);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const nowISO = new Date().toISOString();
      const nextReviewISO = willScheduleReview ? nextReviewDateObj.toISOString() : undefined;

      const logData: ProblemLog = {
        problemId: problem.id,
        completedAt: nowISO,
        timeSpentMinutes: Number(timeSpentMinutes) || 30,
        status,
        perceivedDifficulty,
        hintsViewedCount,
        notes: notes.trim(),
        nextReviewDate: nextReviewISO
      };

      await saveProblemLog(logData);

      if (status === 'CLEAN') {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      onLogSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save problem log:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog: Cursor Command Palette Style */}
      <div className="relative w-full max-w-lg rounded-xl bg-[#0e1015] border border-zinc-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-[#000000] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-semibold">
              Post-Solve Telemetry
            </span>
            <h2 className="text-sm font-semibold text-white line-clamp-1">
              #{problem.sheetIndex.toString().padStart(2, '0')} &bull; {problem.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md bg-zinc-900 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* 1. Time Spent Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-medium text-zinc-400 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-300" />
                <span>TIME SPENT</span>
              </label>
              {initialTimeSpentMinutes && initialTimeSpentMinutes > 0 ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-1.5 py-0.5 rounded">
                  ⏱️ {initialTimeSpentMinutes}m from timer
                </span>
              ) : null}
            </div>

            <div className="flex items-center space-x-2">
              <div className="grid grid-cols-4 gap-1.5 flex-1">
                {quickTimes.map((mins) => (
                  <button
                    key={`time-${mins}`}
                    type="button"
                    onClick={() => setTimeSpentMinutes(mins)}
                    className={`py-1.5 px-2 rounded-md text-xs font-mono font-medium transition border ${
                      timeSpentMinutes === mins
                        ? 'bg-white text-black border-white shadow-sm'
                        : 'bg-[#12141a] text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    {mins === 60 ? '60m+' : `${mins}m`}
                  </button>
                ))}
              </div>

              <div className="relative w-24 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={timeSpentMinutes}
                  onChange={(e) => setTimeSpentMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#08090c] border border-zinc-800 rounded-md py-1.5 pl-2.5 pr-7 text-xs font-mono font-semibold text-white focus:outline-none focus:border-zinc-500 text-center"
                />
                <span className="absolute right-2 top-1.5 text-[10px] font-mono text-zinc-500 pointer-events-none">
                  min
                </span>
              </div>
            </div>
          </div>

          {/* 2. Quality Rating */}
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-400 mb-1.5">
              QUALITY RATING
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Clean */}
              <button
                type="button"
                onClick={() => setStatus('CLEAN')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  status === 'CLEAN'
                    ? 'bg-emerald-950/30 border-emerald-600 text-white'
                    : 'bg-[#12141a] border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-1 font-mono font-bold text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clean</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                  100% solo solve.
                </p>
              </button>

              {/* Hesitant */}
              <button
                type="button"
                onClick={() => setStatus('HESITANT')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  status === 'HESITANT'
                    ? 'bg-amber-950/30 border-amber-600 text-white'
                    : 'bg-[#12141a] border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-1 font-mono font-bold text-xs text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Hesitant</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                  Hints or TLE debug.
                </p>
              </button>

              {/* Blocker */}
              <button
                type="button"
                onClick={() => setStatus('BLOCKER')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  status === 'BLOCKER'
                    ? 'bg-rose-950/30 border-rose-600 text-white'
                    : 'bg-[#12141a] border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-1 font-mono font-bold text-xs text-rose-400">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Blocker</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                  Needed editorial.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Perceived Difficulty & Hints Count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 mb-1">
                PERCEIVED DIFFICULTY
              </label>
              <select
                value={perceivedDifficulty}
                onChange={(e) => setPerceivedDifficulty(e.target.value as ProblemLog['perceivedDifficulty'])}
                className="w-full bg-[#08090c] border border-zinc-800 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Brutal">Brutal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 mb-1">
                HINTS VIEWED (0 - 3)
              </label>
              <input
                type="number"
                min={0}
                max={3}
                value={hintsViewedCount}
                onChange={(e) => setHintsViewedCount(Math.min(3, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full bg-[#08090c] border border-zinc-800 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* 4. Java Insights & Personal Notes */}
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-400 mb-1 flex items-center space-x-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              <span>JAVA TAKEAWAYS &amp; CODE GOTCHAS</span>
            </label>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1 mb-2">
              {quickJavaTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddQuickTag(tag)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 font-mono transition"
                >
                  + {tag}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cast sum to long before squaring; ArrayDeque has 0 sync overhead."
              className="w-full bg-[#08090c] border border-zinc-800 rounded-md p-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          {/* 5. Automated Spaced Repetition Indicator */}
          {willScheduleReview ? (
            <div className="p-2.5 rounded-md bg-amber-950/20 border border-amber-900/40 flex items-center space-x-2.5 text-xs text-amber-300 font-mono">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold">Spaced Review Scheduled:</span> Re-solve queued for <span className="underline font-bold text-white">{nextReviewFormatted}</span> (+3 days).
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-md bg-[#08090c] border border-zinc-800/80 flex items-center space-x-2 text-xs text-zinc-400 font-mono">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Clean solve recorded. Retained without extra review interval.</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#000000] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-mono text-zinc-400 hover:text-white transition"
          >
            Cancel [Esc]
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-zinc-200 shadow-sm disabled:opacity-50 transition"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Log'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { ProblemCard } from './ProblemCard';
import { Problem } from '@/types';
import { TodayQueueItem } from '@/lib/db';
import { CheckCircle2, RotateCcw, ListFilter } from 'lucide-react';

interface TodayQueueProps {
  queueItems: TodayQueueItem[];
  dueCount: number;
  solvedTodayCount: number;
  targetCount: number;
  onOpenStudyDeck: (problem: Problem) => void;
  onOpenSolveLogger: (problem: Problem) => void;
  onOpenEmbeddedSolver: (problem: Problem) => void;
}

export const TodayQueue: React.FC<TodayQueueProps> = ({
  queueItems,
  dueCount,
  solvedTodayCount,
  targetCount,
  onOpenStudyDeck,
  onOpenSolveLogger,
  onOpenEmbeddedSolver
}) => {
  const reviewItems = queueItems.filter(item => item.isReviewDue);
  const targetItems = queueItems.filter(item => !item.isReviewDue);

  return (
    <div className="space-y-6">
      {/* 1. Spaced Repetition Due Section (if any) */}
      {reviewItems.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80">
            <div className="flex items-center space-x-2 text-zinc-300">
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <h2 className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-300">
                Spaced Repetition ({dueCount || reviewItems.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              3-day intervals
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {reviewItems.map((item) => (
              <ProblemCard
                key={`review-${item.problem.id}`}
                problem={item.problem}
                log={item.log}
                isReviewDue={true}
                reviewReason={item.reviewReason}
                onOpenStudyDeck={onOpenStudyDeck}
                onOpenSolveLogger={onOpenSolveLogger}
                onOpenEmbeddedSolver={onOpenEmbeddedSolver}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Today's Target Queue Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80">
          <div className="flex items-center space-x-2 text-zinc-300">
            <ListFilter className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-300">
              Today&apos;s Target Queue ({targetItems.length} queued &bull; {solvedTodayCount} solved)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
            Quota: {targetCount} / day
          </span>
        </div>

        {targetItems.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-6 text-center space-y-2">
            <div className="w-8 h-8 rounded-md bg-zinc-900 text-zinc-300 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-white">Daily Target Completed</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              All {targetCount} problems for today are completed. Use [+] in the header if you want to extend your target.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {targetItems.map((item) => (
              <ProblemCard
                key={`target-${item.problem.id}`}
                problem={item.problem}
                log={item.log}
                isReviewDue={false}
                onOpenStudyDeck={onOpenStudyDeck}
                onOpenSolveLogger={onOpenSolveLogger}
                onOpenEmbeddedSolver={onOpenEmbeddedSolver}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { 
  ExternalLink, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  HelpCircle, 
  RotateCcw,
  Code2
} from 'lucide-react';
import { Problem, ProblemLog } from '@/types';

interface ProblemCardProps {
  problem: Problem;
  log?: ProblemLog;
  isReviewDue?: boolean;
  reviewReason?: string;
  onOpenStudyDeck: (problem: Problem) => void;
  onOpenSolveLogger: (problem: Problem) => void;
  onOpenEmbeddedSolver: (problem: Problem) => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  log,
  isReviewDue = false,
  reviewReason,
  onOpenStudyDeck,
  onOpenSolveLogger,
  onOpenEmbeddedSolver
}) => {
  const renderStatus = () => {
    if (!log) {
      return (
        <span className="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          <span>Unsolved</span>
        </span>
      );
    }
    switch (log.status) {
      case 'CLEAN':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Clean Solve</span>
          </span>
        );
      case 'HESITANT':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Hesitant</span>
          </span>
        );
      case 'BLOCKER':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Blocker</span>
          </span>
        );
    }
  };

  return (
    <div className={`relative group rounded-lg bg-[#09090b] border transition-all duration-150 ${
      isReviewDue 
        ? 'border-amber-900/40 bg-zinc-950/80' 
        : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-[#0c0c0f]'
    }`}>
      {/* Spaced Repetition Due Alert Ribbon */}
      {isReviewDue && (
        <div className="bg-amber-950/20 border-b border-amber-900/30 px-3.5 py-1 flex items-center justify-between text-xs font-mono text-amber-400 rounded-t-lg">
          <div className="flex items-center space-x-1.5">
            <RotateCcw className="w-3 h-3 text-amber-500" />
            <span className="font-medium">Spaced Review Due</span>
          </div>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            {reviewReason || '3-day retention check'}
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Header: Index, Title, Topic & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-zinc-500 font-semibold tabular-nums">
                #{problem.sheetIndex.toString().padStart(2, '0')}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                {problem.subTopic}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                {problem.difficulty}
              </span>
              {renderStatus()}
            </div>

            <h3 className="text-sm sm:text-base font-medium text-white group-hover:text-zinc-200 transition-colors">
              {problem.title}
            </h3>
          </div>

          {/* Log metrics */}
          {log && (
            <div className="flex items-center space-x-3 text-xs text-zinc-400 font-mono self-start shrink-0">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-zinc-600" />
                <span className="tabular-nums">{log.timeSpentMinutes}m</span>
              </span>
              {log.hintsViewedCount > 0 && (
                <span className="flex items-center space-x-1 text-zinc-400">
                  <HelpCircle className="w-3 h-3 text-zinc-600" />
                  <span className="tabular-nums">{log.hintsViewedCount} hints</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Existing Java notes snippet if any */}
        {log?.notes && (
          <div className="mb-3 p-2.5 rounded bg-[#000000] border border-zinc-800/80 text-xs text-zinc-300 font-mono line-clamp-2">
            <span className="text-zinc-500">Java Takeaway:</span> {log.notes}
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-zinc-800/60">
          
          {/* Primary Action: Solve (In-App Embedded LeetCode) */}
          <button
            onClick={() => onOpenEmbeddedSolver(problem)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-zinc-200 transition shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Solve (In-App)</span>
          </button>

          {/* Secondary: Study Deck */}
          <button
            onClick={() => onOpenStudyDeck(problem)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Study Deck</span>
          </button>

          {/* Tertiary: External LeetCode */}
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
            title="Open in external browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Mark Solved / Update Log */}
          <button
            onClick={() => onOpenSolveLogger(problem)}
            className="ml-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>{log ? 'Edit Log' : 'Mark Solved'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

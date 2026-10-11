'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { PacingMetrics } from '@/types';

interface TargetHeaderProps {
  metrics: PacingMetrics | null;
  onAdjustTarget: (delta: number) => void;
}

export const TargetHeader: React.FC<TargetHeaderProps> = ({
  metrics,
  onAdjustTarget
}) => {
  const target = metrics?.todayTarget || 4;
  const solvedToday = metrics?.solvedTodayCount || 0;
  const targetProgress = Math.min(100, Math.round((solvedToday / target) * 100));

  return (
    <div className="w-full mb-6">
      <div className="rounded-xl bg-[#09090b] border border-zinc-800/80 p-5 sm:p-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Daily Quota Controller */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
                Daily Target: <span className="font-mono font-semibold">{target} Problems</span>
              </h1>

              {/* Minimalist Stepper */}
              <div className="inline-flex items-center bg-[#121215] border border-zinc-800 rounded-md p-0.5">
                <button
                  onClick={() => onAdjustTarget(-1)}
                  disabled={target <= 1}
                  className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-25 disabled:cursor-not-allowed transition"
                  title="Decrease target"
                  aria-label="Decrease target"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-mono font-medium text-xs text-white tabular-nums">
                  {target}
                </span>
                <button
                  onClick={() => onAdjustTarget(1)}
                  className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  title="Increase target"
                  aria-label="Increase target"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Linear Progress Bar */}
            <div className="max-w-sm">
              <div className="flex justify-between text-xs text-zinc-500 mb-1.5 font-mono">
                <span>Completed today: <span className="text-zinc-300 font-medium">{solvedToday}</span> of {target}</span>
                <span className="text-zinc-300 tabular-nums">{targetProgress}%</span>
              </div>
              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300 ease-out"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            {/* Streak */}
            <div className="p-3 rounded-lg bg-[#000000] border border-zinc-800/80 flex flex-col justify-between">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Streak
              </div>
              <div className="text-base font-mono font-medium text-white tabular-nums mt-1">
                {metrics?.streakDays || 0} <span className="text-xs text-zinc-500 font-normal">days</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {metrics?.streakDays ? 'Daily momentum' : 'Ready to start'}
              </div>
            </div>

            {/* Total Solved */}
            <div className="p-3 rounded-lg bg-[#000000] border border-zinc-800/80 flex flex-col justify-between">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Solved
              </div>
              <div className="text-base font-mono font-medium text-white tabular-nums mt-1">
                {metrics?.totalSolved || 0} <span className="text-xs text-zinc-500 font-normal">/ {metrics?.totalProblems || 30}</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {metrics?.completionPercentage || 0}% total sheet
              </div>
            </div>

            {/* Due for Review */}
            <div className="p-3 rounded-lg bg-[#000000] border border-zinc-800/80 flex flex-col justify-between">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Due Today
              </div>
              <div className="text-base font-mono font-medium text-white tabular-nums mt-1">
                {metrics?.dueForReviewCount || 0} <span className="text-xs text-zinc-500 font-normal">reviews</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {metrics?.dueForReviewCount ? 'Spaced repetition' : 'All clear'}
              </div>
            </div>

            {/* ETA */}
            <div className="p-3 rounded-lg bg-[#000000] border border-zinc-800/80 flex flex-col justify-between">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Pace ETA
              </div>
              <div className="text-xs font-mono font-medium text-white truncate mt-1">
                {metrics?.estimatedCompletionDate || 'Calculating...'}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                @ {metrics?.velocityPerDay || 4} prob/day
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

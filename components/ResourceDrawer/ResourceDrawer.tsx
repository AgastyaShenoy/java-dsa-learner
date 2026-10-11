'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  ExternalLink, 
  Video, 
  BookOpen, 
  CheckCircle, 
  Lightbulb, 
  Cpu, 
  Coffee
} from 'lucide-react';
import { Problem } from '@/types';

interface ResourceDrawerProps {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenLogger: (problem: Problem, revealedHintsCount: number) => void;
}

export const ResourceDrawer: React.FC<ResourceDrawerProps> = ({
  problem,
  isOpen,
  onClose,
  onOpenLogger
}) => {
  const [revealed, setRevealed] = useState<[boolean, boolean, boolean]>([false, false, false]);

  useEffect(() => {
    setRevealed([false, false, false]);
  }, [problem?.id]);

  if (!isOpen || !problem) return null;

  const toggleHint = (index: 0 | 1 | 2) => {
    setRevealed(prev => {
      const next: [boolean, boolean, boolean] = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const hintsViewedCount = revealed.filter(Boolean).length;

  const hintTitles = [
    { title: 'Intuition & Angle of Attack', step: '01', icon: Lightbulb, color: 'text-[#38bdf8]' },
    { title: 'Optimal Invariant & Data Structure', step: '02', icon: Cpu, color: 'text-[#38bdf8]' },
    { title: 'Java Gotchas & Overflow Hazards', step: '03', icon: Coffee, color: 'text-[#f59e0b]' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Cursor Secondary Sidebar Panel */}
      <div className="relative w-full max-w-xl bg-[#0a0b0e] border-l border-[#1f2228] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-[#1f2228] bg-[#000000] flex items-start justify-between">
          <div className="space-y-1 pr-4">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#13151b] font-mono text-[#8b929f] border border-[#22252e]">
                #{problem.sheetIndex.toString().padStart(2, '0')}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#13151b] text-[#38bdf8] border border-[#38bdf8]/30 font-mono">
                {problem.subTopic}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded border font-mono font-medium ${
                problem.difficulty === 'Easy' ? 'text-[#34d399] bg-[#064e3b]/25 border-[#059669]/40' :
                problem.difficulty === 'Medium' ? 'text-[#fbbf24] bg-[#78350f]/25 border-[#d97706]/40' :
                'text-[#f87171] bg-[#7f1d1d]/25 border-[#dc2626]/40'
              }`}>
                {problem.difficulty}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-semibold text-[#f4f4f6] tracking-tight">
              {problem.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md bg-[#13151b] text-[#8b929f] hover:text-[#f4f4f6] hover:bg-[#181a22] border border-[#22252e] transition"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Hint Tracker Strip */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#12141a] border border-[#1f2228]">
            <div className="flex items-center space-x-2 text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span className="text-[#8b929f] font-mono">Revealed Hints:</span>
              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                hintsViewedCount === 0 ? 'bg-[#064e3b]/30 text-[#34d399] border border-[#059669]/40' :
                hintsViewedCount === 1 ? 'bg-[#78350f]/30 text-[#fbbf24] border border-[#d97706]/40' :
                'bg-[#7f1d1d]/30 text-[#f87171] border border-[#dc2626]/40'
              }`}>
                {hintsViewedCount} / 3
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#555b67] hidden sm:inline">
              Auto-logged on solve
            </span>
          </div>

          {/* Section: 3-Tier Progressive Accordion Hints */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#8b929f]">
              Progressive Hint Ladder
            </h3>

            {(problem.hints || []).map((hintText, idx) => {
              const hintIdx = idx as 0 | 1 | 2;
              const isRevealed = revealed[hintIdx];
              const meta = hintTitles[hintIdx] || { title: `Hint ${idx + 1}`, step: `0${idx + 1}`, icon: Lightbulb, color: 'text-[#38bdf8]' };
              const Icon = meta.icon;

              return (
                <div 
                  key={`hint-${idx}`}
                  className={`rounded-lg border transition-all ${
                    isRevealed 
                      ? 'border-[#2c313d] bg-[#12141a]' 
                      : 'border-[#1f2228] bg-[#0e1015] hover:border-[#282c37]'
                  }`}
                >
                  <button
                    onClick={() => toggleHint(hintIdx)}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left focus:outline-none"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs text-[#555b67] font-bold">
                        {meta.step}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      <span className="text-xs font-medium text-[#f4f4f6]">
                        {meta.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] font-mono text-[#8b929f]">
                      <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                      {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isRevealed && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-[#1f2228] text-xs text-[#c2c7d0] leading-relaxed font-sans animate-in fade-in duration-150">
                      {hintIdx === 2 && (
                        <div className="mb-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/25 text-[10px] font-mono font-medium">
                          <Coffee className="w-3 h-3" />
                          <span>Java Consideration</span>
                        </div>
                      )}
                      <p>{hintText}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section: Direct Solution Access (YouTube Player & Editorial Link) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-red-500" />
                <span>Striver Solution Walkthrough</span>
              </h3>

              {problem.youtubeId && (
                <a
                  href={`https://www.youtube.com/watch?v=${problem.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-red-400 hover:text-red-300 underline flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open on YouTube ↗</span>
                </a>
              )}
            </div>

            {/* Responsive YouTube Embed */}
            {problem.youtubeId ? (
              <div className="space-y-2">
                <div className="rounded-lg overflow-hidden border border-zinc-800 bg-black aspect-video relative">
                  <iframe
                    className="w-full h-full border-0"
                    src={`https://www.youtube-nocookie.com/embed/${problem.youtubeId}?rel=0&modestbranding=1`}
                    title={`${problem.title} Striver Explanation`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>

                <div className="p-2 rounded bg-zinc-950 border border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Blocked or not playing?</span>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://www.youtube.com/watch?v=${problem.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Watch on YouTube ↗
                    </a>
                    <span className="text-zinc-600">&bull;</span>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent("Striver " + problem.title + " SDE Sheet")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white underline"
                    >
                      Search Video ↗
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 text-center font-mono">
                Video walkthrough available on TakeUForward.
              </div>
            )}

            {/* External Links Bar */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {problem.takeUForwardUrl && (
                <a
                  href={problem.takeUForwardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#12141a] hover:bg-[#181a22] text-[#f43f5e] border border-[#f43f5e]/30 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>TakeUForward Editorial</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}

              <a
                href={problem.leetcodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#12141a] hover:bg-[#181a22] text-[#c2c7d0] hover:text-[#f4f4f6] border border-[#22252e] transition"
              >
                <span>LeetCode</span>
                <ExternalLink className="w-3 h-3 text-[#555b67]" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1f2228] bg-[#000000] flex items-center justify-between gap-4">
          <div className="text-xs text-[#8b929f] font-mono">
            Hints revealed: <span className="font-bold text-[#f4f4f6] tabular-nums">{hintsViewedCount}</span>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenLogger(problem, hintsViewedCount);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-medium bg-white text-black hover:bg-zinc-200 shadow-sm transition"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Mark as Solved</span>
          </button>
        </div>

      </div>
    </div>
  );
};

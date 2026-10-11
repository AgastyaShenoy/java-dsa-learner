'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  BookOpen, 
  CheckCircle, 
  Code2, 
  Globe, 
  Video, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  HelpCircle, 
  Bot, 
  Tv 
} from 'lucide-react';
import { Problem } from '@/types';
import { LocalAIChatDrawer } from '../LocalAI/LocalAIChatDrawer';

interface EmbeddedLeetCodeModalProps {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSolveLogger: (problem: Problem, timeSpentMinutes?: number) => void;
  onOpenLocalAI?: (problem: Problem) => void;
}

type PrimaryPaneView = 'LEETCODE' | 'EDITOR';
type CompanionPaneView = 'NONE' | 'AI_TUTOR' | 'SCRATCHPAD' | 'HINTS' | 'VIDEO';

export const EmbeddedLeetCodeModal: React.FC<EmbeddedLeetCodeModalProps> = ({
  problem,
  isOpen,
  onClose,
  onOpenSolveLogger,
}) => {
  // Primary & Companion View State
  const [primaryView, setPrimaryView] = useState<PrimaryPaneView>('LEETCODE');
  const [companionView, setCompanionView] = useState<CompanionPaneView>('HINTS');
  
  // Resizable Split Ratio (Percentage of container for primary pane, e.g. 55%)
  const [splitRatio, setSplitRatio] = useState<number>(55);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Picture-in-Picture (PiP) Video Mode State
  const [isPiPVideoActive, setIsPiPVideoActive] = useState<boolean>(false);
  const [isPiPMinimized, setIsPiPMinimized] = useState<boolean>(false);

  // Fullscreen and Code State
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [codeContent, setCodeContent] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [revealedHints, setRevealedHints] = useState<[boolean, boolean, boolean]>([false, false, false]);

  // Stopwatch / Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Frame security help modal
  const [showFrameHelpModal, setShowFrameHelpModal] = useState<boolean>(false);

  // Auto-tick timer
  useEffect(() => {
    if (!isOpen || !isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning]);

  // Generate initial Java boilerplate on problem change
  useEffect(() => {
    if (!problem) return;
    const defaultTemplate = `// Problem: ${problem.title} (${problem.difficulty})
// Striver SDE Sheet #${problem.sheetIndex}

class Solution {
    // Write your solution here
    public void solve() {
        // Java Gotcha: Remember Long overflow and Deque instead of Stack
    }
}
`;
    setCodeContent(defaultTemplate);
    setRevealedHints([false, false, false]);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setIsPiPVideoActive(false);
  }, [problem]);

  // Handle Dragging Splitter
  const handleMouseDownSplitter = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      // Clamp between 25% and 75%
      const clamped = Math.min(Math.max(25, percentage), 75);
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen || !problem) return null;

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePopout = () => {
    window.open(problem.leetcodeUrl, '_blank', 'width=1100,height=900,left=200,top=100');
  };

  const toggleHint = (idx: 0 | 1 | 2) => {
    setRevealedHints(prev => {
      const next: [boolean, boolean, boolean] = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleMarkSolved = () => {
    onClose();
    const elapsedMinutes = Math.max(1, Math.round(timerSeconds / 60));
    onOpenSolveLogger(problem, elapsedMinutes);
  };

  const hasCompanion = companionView !== 'NONE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Multi-Pane Workspace Shell */}
      <div className={`relative w-full rounded-xl bg-[#09090b] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden z-10 transition-all ${
        isFullScreen ? 'h-[98vh] max-w-[99vw]' : 'h-[92vh] max-w-[96vw]'
      }`}>
        
        {/* Unified Top Command Toolbar (Single Sleek 44px Row) */}
        <div className="px-3 py-1.5 bg-[#000000] border-b border-zinc-800 flex items-center justify-between gap-2.5 shrink-0 flex-wrap">
          
          {/* Left: Problem info */}
          <div className="flex items-center space-x-2 truncate min-w-[200px] max-w-[280px] lg:max-w-xs">
            <span className="text-xs font-mono text-zinc-500 font-semibold shrink-0">
              #{problem.sheetIndex.toString().padStart(2, '0')}
            </span>
            <span className="text-sm font-semibold text-white truncate" title={problem.title}>
              {problem.title}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
              problem.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40' :
              problem.difficulty === 'Medium' ? 'text-amber-400 bg-amber-950/20 border-amber-900/40' :
              'text-rose-400 bg-rose-950/20 border-rose-900/40'
            }`}>
              {problem.difficulty}
            </span>
          </div>

          {/* Center: Modular Pane View Selectors */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Primary Selector */}
            <div className="flex items-center bg-[#121215] p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setPrimaryView('LEETCODE')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                  primaryView === 'LEETCODE'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Primary: Embedded LeetCode Webview"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-300" />
                <span>LeetCode</span>
              </button>

              <button
                onClick={() => setPrimaryView('EDITOR')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                  primaryView === 'EDITOR'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Primary: Java Scratchpad Editor"
              >
                <Code2 className="w-3.5 h-3.5 text-zinc-300" />
                <span>Java Editor</span>
              </button>
            </div>

            {/* Split Indicator / Companion Pane Switcher */}
            <span className="text-zinc-600 font-mono text-xs">|</span>

            <div className="flex items-center bg-[#121215] p-0.5 rounded-lg border border-zinc-800 text-xs">
              <button
                onClick={() => setCompanionView(companionView === 'AI_TUTOR' ? 'NONE' : 'AI_TUTOR')}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition ${
                  companionView === 'AI_TUTOR'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Companion: Local LM Studio AI Tutor"
              >
                <Bot className="w-3.5 h-3.5 text-zinc-300" />
                <span className="hidden sm:inline">AI Tutor</span>
              </button>

              {primaryView === 'LEETCODE' && (
                <button
                  onClick={() => setCompanionView(companionView === 'SCRATCHPAD' ? 'NONE' : 'SCRATCHPAD')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded transition ${
                    companionView === 'SCRATCHPAD'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Companion: Side-by-side Java Scratchpad"
                >
                  <Code2 className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="hidden sm:inline">Code</span>
                </button>
              )}

              <button
                onClick={() => setCompanionView(companionView === 'HINTS' ? 'NONE' : 'HINTS')}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition ${
                  companionView === 'HINTS'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Companion: Progressive Hints & Gotchas"
              >
                <BookOpen className="w-3.5 h-3.5 text-zinc-300" />
                <span className="hidden sm:inline">Hints</span>
              </button>

              {problem.youtubeId && (
                <button
                  onClick={() => setCompanionView(companionView === 'VIDEO' ? 'NONE' : 'VIDEO')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded transition ${
                    companionView === 'VIDEO'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Companion: Striver Walkthrough Video"
                >
                  <Video className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="hidden sm:inline">Video</span>
                </button>
              )}

              {/* Single Pane Toggle (Close companion) */}
              {hasCompanion && (
                <button
                  onClick={() => setCompanionView('NONE')}
                  className="p-1 rounded text-zinc-500 hover:text-white ml-0.5"
                  title="Hide side pane (Full width primary)"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Split Presets (when companion is active) */}
            {hasCompanion && (
              <div className="hidden xl:flex items-center space-x-1 bg-[#121215] px-1.5 py-1 rounded-md border border-zinc-800 text-[10px] font-mono text-zinc-400">
                <button
                  onClick={() => setSplitRatio(50)}
                  className={`px-1 py-0.5 rounded hover:text-white ${splitRatio === 50 ? 'bg-zinc-800 text-white font-bold' : ''}`}
                  title="50:50 Split"
                >
                  50/50
                </button>
                <button
                  onClick={() => setSplitRatio(60)}
                  className={`px-1 py-0.5 rounded hover:text-white ${splitRatio === 60 ? 'bg-zinc-800 text-white font-bold' : ''}`}
                  title="60:40 Split"
                >
                  60/40
                </button>
              </div>
            )}
          </div>

          {/* Right: Stopwatch, Mark Solved & Controls */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Solving Stopwatch */}
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#121215] border border-zinc-800 text-xs font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isTimerRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <Clock className="w-3 h-3 text-zinc-400" />
              <span className="tabular-nums font-semibold text-white tracking-wider text-[11px]">
                {formatTime(timerSeconds)}
              </span>

              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
                title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
              >
                {isTimerRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 text-emerald-400" />}
              </button>

              <button
                onClick={() => setTimerSeconds(0)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                title="Reset Timer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Mark Solved */}
            <button
              onClick={handleMarkSolved}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-black hover:bg-zinc-200 transition flex items-center space-x-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Solved</span>
            </button>

            {/* Pop-out detached companion */}
            <button
              onClick={handlePopout}
              className="p-1.5 rounded-md bg-[#121215] text-zinc-400 hover:text-white border border-zinc-800 transition"
              title="Open problem in detached companion window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-md bg-[#121215] text-zinc-400 hover:text-white border border-zinc-800 transition hidden sm:block"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md bg-[#121215] text-zinc-400 hover:text-white border border-zinc-800 transition"
              title="Close Workspace"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Content Body: Split Panes Container */}
        <div ref={containerRef} className="flex-1 bg-[#000000] relative overflow-hidden flex flex-row">
          
          {/* PRIMARY PANE (Left / Main) */}
          <div 
            style={{ width: hasCompanion ? `${splitRatio}%` : '100%' }}
            className="h-full flex flex-col overflow-hidden transition-all duration-75 relative bg-black"
          >
            {/* Primary View A: Embedded LeetCode Webview */}
            {primaryView === 'LEETCODE' && (
              <div className="flex-1 flex flex-col h-full">
                {/* Clean Sub-header URL Bar */}
                <div className="px-3 py-1 bg-[#0a0a0c] border-b border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <a 
                      href={problem.leetcodeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-zinc-300 hover:text-white truncate hover:underline"
                    >
                      {problem.leetcodeUrl}
                    </a>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* Picture-in-Picture Button for Video */}
                    {problem.youtubeId && !isPiPVideoActive && (
                      <button
                        onClick={() => setIsPiPVideoActive(true)}
                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center space-x-1 text-[10px] font-mono transition"
                        title="Watch Striver in Picture-in-Picture mini player"
                      >
                        <Tv className="w-3 h-3 text-amber-400" />
                        <span>PiP Video</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowFrameHelpModal(true)}
                      className="px-1.5 py-0.5 rounded bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 flex items-center space-x-1 text-[10px] font-mono transition"
                      title="Frame blocked by browser? Click for solutions"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Help</span>
                    </button>
                  </div>
                </div>

                {/* 100% Unobstructed Iframe */}
                <div className="flex-1 w-full h-full relative bg-black">
                  <iframe
                    src={problem.leetcodeUrl}
                    title={`${problem.title} - LeetCode`}
                    className="w-full h-full border-0"
                    allow="clipboard-write; clipboard-read"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  />
                </div>
              </div>
            )}

            {/* Primary View B: Full Java Scratchpad Editor */}
            {primaryView === 'EDITOR' && (
              <div className="flex-1 flex flex-col h-full p-3 space-y-2 bg-[#09090b]">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
                    <Code2 className="w-4 h-4 text-zinc-300" />
                    <span>Solution.java</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {problem.youtubeId && !isPiPVideoActive && (
                      <button
                        onClick={() => setIsPiPVideoActive(true)}
                        className="px-2 py-1 rounded-md text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center space-x-1 transition"
                      >
                        <Tv className="w-3.5 h-3.5 text-amber-400" />
                        <span>PiP Video</span>
                      </button>
                    )}

                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center space-x-1.5 transition"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Solution'}</span>
                    </button>

                    <button
                      onClick={handlePopout}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-white text-black hover:bg-zinc-200 flex items-center space-x-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Paste into LeetCode</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="flex-1 w-full bg-[#000000] border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* DRAGGABLE RESIZER SPLITTER (Rendered only when companion pane is visible) */}
          {hasCompanion && (
            <div
              onMouseDown={handleMouseDownSplitter}
              onDoubleClick={() => setSplitRatio(50)}
              className={`w-1.5 bg-zinc-900 hover:bg-zinc-600 cursor-col-resize transition-colors flex items-center justify-center shrink-0 border-x border-zinc-800/80 z-20 ${
                isResizing ? 'bg-zinc-500' : ''
              }`}
              title="Drag to resize panes (Double-click to reset 50/50)"
            >
              <div className="w-0.5 h-6 bg-zinc-700 rounded-full" />
            </div>
          )}

          {/* COMPANION PANE (Right Side) */}
          {hasCompanion && (
            <div 
              style={{ width: `${100 - splitRatio}%` }}
              className="h-full flex flex-col overflow-hidden bg-[#09090b] relative"
            >
              {/* Companion Tool A: Embedded Local AI Tutor */}
              {companionView === 'AI_TUTOR' && (
                <div className="flex-1 h-full flex flex-col overflow-hidden">
                  <LocalAIChatDrawer
                    embedded={true}
                    isOpen={true}
                    onClose={() => setCompanionView('NONE')}
                    activeProblem={problem}
                  />
                </div>
              )}

              {/* Companion Tool B: Side-by-Side Java Scratchpad */}
              {companionView === 'SCRATCHPAD' && (
                <div className="flex-1 flex flex-col h-full p-3 space-y-2">
                  <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-1.5 text-xs font-mono text-zinc-400">
                      <Code2 className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Java Scratchpad</span>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 flex items-center space-x-1 transition"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    className="flex-1 w-full bg-[#000000] border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Companion Tool C: Progressive Hints Ladder */}
              {companionView === 'HINTS' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-300" />
                      <span>3-Tier Progressive Hints</span>
                    </h3>
                    <button
                      onClick={() => setRevealedHints([true, true, true])}
                      className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline"
                    >
                      Reveal All
                    </button>
                  </div>

                  {(problem.hints || []).map((hint, idx) => {
                    const isRevealed = revealedHints[idx as 0 | 1 | 2];
                    const labels = ['01 / Intuition', '02 / Optimal Invariant', '03 / Java Gotcha'];

                    return (
                      <div 
                        key={`hint-${idx}`}
                        className="rounded-lg border border-zinc-800/80 bg-[#000000] overflow-hidden transition"
                      >
                        <button
                          onClick={() => toggleHint(idx as 0 | 1 | 2)}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#121215] transition"
                        >
                          <span className="text-xs font-mono text-zinc-300 font-medium">
                            {labels[idx]}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {isRevealed ? 'Hide' : 'Click to reveal'}
                          </span>
                        </button>

                        {isRevealed && (
                          <div className="px-3.5 pb-3 pt-1 border-t border-zinc-800/60 text-xs text-zinc-300 leading-relaxed font-sans">
                            <p>{hint}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Companion Tool D: Striver Video Walkthrough */}
              {companionView === 'VIDEO' && problem.youtubeId && (
                <div className="flex-1 flex flex-col h-full p-3 space-y-2">
                  <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-1.5 text-xs font-mono text-zinc-300">
                      <Video className="w-3.5 h-3.5 text-red-500" />
                      <span>Striver Video Solution</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <a
                        href={`https://www.youtube.com/watch?v=${problem.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded text-xs font-mono bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-900/60 flex items-center space-x-1 transition"
                        title="Watch directly on YouTube"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Watch on YouTube ↗</span>
                      </a>

                      <button
                        onClick={() => setIsPiPVideoActive(true)}
                        className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-800 flex items-center space-x-1 transition"
                        title="Pop video into floating Picture-in-Picture window"
                      >
                        <Tv className="w-3 h-3" />
                        <span>PiP Mode</span>
                      </button>
                    </div>
                  </div>

                  {/* Responsive YouTube Player */}
                  <div className="flex-1 rounded-lg overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center relative">
                    <iframe
                      className="w-full h-full border-0"
                      src={`https://www.youtube-nocookie.com/embed/${problem.youtubeId}?rel=0&modestbranding=1`}
                      title={`${problem.title} Striver Explanation`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>

                  {/* Direct Links & Fallback Strip */}
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 text-[11px]">Video blocked or not loading?</span>
                    <div className="flex items-center space-x-2.5">
                      <a
                        href={`https://www.youtube.com/watch?v=${problem.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-400 hover:text-red-300 underline flex items-center space-x-1 text-[11px]"
                      >
                        <span>Open in YouTube ↗</span>
                      </a>
                      {problem.takeUForwardUrl && (
                        <>
                          <span className="text-zinc-600">&bull;</span>
                          <a
                            href={problem.takeUForwardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-300 hover:text-white underline text-[11px]"
                          >
                            TUF Editorial ↗
                          </a>
                        </>
                      )}
                      <span className="text-zinc-600">&bull;</span>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent("Striver " + problem.title + " SDE Sheet")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-white underline text-[11px]"
                      >
                        Search Video ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* FLOATING PICTURE-IN-PICTURE (PiP) VIDEO MINI-PLAYER */}
      {isPiPVideoActive && problem.youtubeId && (
        <aside 
          className={`fixed bottom-5 right-5 z-60 rounded-xl bg-[#000000] border border-zinc-700 shadow-2xl overflow-hidden transition-all duration-200 animate-in slide-in-from-bottom-5 ${
            isPiPMinimized ? 'w-64 h-11' : 'w-80 sm:w-96 aspect-video max-h-[300px]'
          }`}
        >
          {/* PiP Header Toolbar */}
          <div className="px-3 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-1.5 truncate">
              <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-mono text-zinc-300 truncate">
                PiP: Striver Walkthrough
              </span>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <a
                href={`https://www.youtube.com/watch?v=${problem.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                title="Watch on YouTube"
              >
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => setIsPiPMinimized(!isPiPMinimized)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                title={isPiPMinimized ? "Expand PiP player" : "Minimize PiP player"}
              >
                {isPiPMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setIsPiPVideoActive(false)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                title="Close PiP"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* PiP Iframe (hidden if minimized to keep audio playing) */}
          <div className={`w-full h-[calc(100%-28px)] bg-black ${isPiPMinimized ? 'hidden' : 'block'}`}>
            <iframe
              className="w-full h-full border-0"
              src={`https://www.youtube-nocookie.com/embed/${problem.youtubeId}?rel=0&modestbranding=1`}
              title="Striver PiP Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </aside>
      )}

      {/* Frame Help Modal */}
      {showFrameHelpModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl bg-[#0e1015] border border-zinc-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-zinc-300" />
                <h3 className="text-sm font-semibold text-white">Embedded Frame Solutions</h3>
              </div>
              <button
                onClick={() => setShowFrameHelpModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              LeetCode servers send <code className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">X-Frame-Options: SAMEORIGIN</code>. If your browser blocks embedding:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="font-semibold text-white block mb-1">1. Companion Window (Recommended)</span>
                <p className="text-zinc-400 mb-2">Opens LeetCode in a detached window side-by-side with no iframe restrictions.</p>
                <button
                  onClick={() => {
                    handlePopout();
                    setShowFrameHelpModal(false);
                  }}
                  className="px-3 py-1 rounded bg-white text-black text-xs font-medium hover:bg-zinc-200 transition flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Companion Window ↗</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="font-semibold text-white block mb-1">2. Chrome Extension (For Direct In-App)</span>
                <p className="text-zinc-400 mb-2">Install the free Chrome extension &quot;Ignore X-Frame-Options&quot; to allow embedding.</p>
                <a
                  href="https://chromewebstore.google.com/search/Ignore%20X-Frame-Options"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white underline inline-flex items-center space-x-1"
                >
                  <span>Search Chrome Web Store ↗</span>
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowFrameHelpModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

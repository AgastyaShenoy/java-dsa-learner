'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './Navbar';
import { TargetHeader } from './MissionControl/TargetHeader';
import { TodayQueue } from './MissionControl/TodayQueue';
import { ResourceDrawer } from './ResourceDrawer/ResourceDrawer';
import { PostSolveModal } from './PostSolveModal/PostSolveModal';
import { RoadmapView } from './Roadmap/RoadmapView';
import { AICoachView } from './AICoach/AICoachView';
import { SettingsModal } from './SettingsModal';
import { EmbeddedLeetCodeModal } from './EmbeddedLeetCode/EmbeddedLeetCodeModal';
import { LocalAIChatDrawer } from './LocalAI/LocalAIChatDrawer';
import { 
  initDatabase, 
  getTodayQueue, 
  calculatePacingMetrics, 
  getUserSettings, 
  updateUserSettings,
  getAllProblems,
  getAllLogs,
  TodayQueueItem
} from '@/lib/db';
import { Problem, ProblemLog, PacingMetrics } from '@/types';
import { Bot } from 'lucide-react';

export function CursorAppSkeleton() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col">
      {/* Top command bar skeleton */}
      <div className="h-13 border-b border-zinc-900 bg-black flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded bg-zinc-900 animate-pulse" />
          <div className="w-24 h-4 bg-zinc-900 rounded animate-pulse" />
        </div>
        <div className="w-48 h-7 bg-zinc-900 rounded-lg animate-pulse" />
        <div className="w-28 h-6 bg-zinc-900 rounded animate-pulse" />
      </div>

      {/* Body skeleton */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="h-28 rounded-xl bg-zinc-950 border border-zinc-900 p-5 flex items-center justify-between animate-pulse">
          <div className="w-48 h-8 bg-zinc-900 rounded" />
          <div className="flex space-x-2">
            <div className="w-20 h-16 bg-zinc-900 rounded" />
            <div className="w-20 h-16 bg-zinc-900 rounded" />
            <div className="w-20 h-16 bg-zinc-900 rounded" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="w-36 h-4 bg-zinc-900 rounded animate-pulse" />
          <div className="h-24 rounded-lg bg-zinc-950 border border-zinc-900 animate-pulse" />
          <div className="h-24 rounded-lg bg-zinc-950 border border-zinc-900 animate-pulse" />
          <div className="h-24 rounded-lg bg-zinc-950 border border-zinc-900 animate-pulse" />
        </div>
      </main>
    </div>
  );
}

export default function AppShell() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'mission-control' | 'roadmap' | 'ai-coach'>('mission-control');
  
  // Data state
  const [metrics, setMetrics] = useState<PacingMetrics | null>(null);
  const [queueItems, setQueueItems] = useState<TodayQueueItem[]>([]);
  const [targetCount, setTargetCount] = useState<number>(4);
  const [dueCount, setDueCount] = useState<number>(0);
  const [solvedTodayCount, setSolvedTodayCount] = useState<number>(0);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [logs, setLogs] = useState<ProblemLog[]>([]);

  // Modal / Drawer state
  const [studyDeckProblem, setStudyDeckProblem] = useState<Problem | null>(null);
  const [isStudyDeckOpen, setIsStudyDeckOpen] = useState(false);
  
  const [solveProblem, setSolveProblem] = useState<Problem | null>(null);
  const [solveHintsCount, setSolveHintsCount] = useState<number>(0);
  const [solveTimeSpent, setSolveTimeSpent] = useState<number | undefined>(undefined);
  const [isSolveModalOpen, setIsSolveModalOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // In-App Embedded LeetCode Workspace state
  const [embeddedProblem, setEmbeddedProblem] = useState<Problem | null>(null);
  const [isEmbeddedModalOpen, setIsEmbeddedModalOpen] = useState(false);

  // Local AI (LM Studio) state
  const [isLocalAIOpen, setIsLocalAIOpen] = useState<boolean>(false);
  const [localAIProblem, setLocalAIProblem] = useState<Problem | null>(null);

  // Refresh and calculate telemetry
  const refreshData = useCallback(async () => {
    try {
      const [todayData, pacing, allProbs, allLogs, settings] = await Promise.all([
        getTodayQueue(),
        calculatePacingMetrics(),
        getAllProblems(),
        getAllLogs(),
        getUserSettings()
      ]);

      setQueueItems(todayData.queue);
      setTargetCount(settings.targetProblemsPerDay);
      setDueCount(todayData.dueCount);
      setSolvedTodayCount(todayData.solvedTodayCount);
      setMetrics(pacing);
      setProblems(allProbs);
      setLogs(allLogs);
    } catch (err) {
      console.error('Error refreshing SDE Tracker state:', err);
    }
  }, []);

  // Initialize Dexie & hydrate initial data on mount
  useEffect(() => {
    const bootstrap = async () => {
      await initDatabase();
      await refreshData();
      setIsReady(true);
    };
    bootstrap();
  }, [refreshData]);

  // Adjust daily target with instant feedback
  const handleAdjustTarget = async (delta: number) => {
    const current = await getUserSettings();
    const newTarget = Math.max(1, current.targetProblemsPerDay + delta);
    await updateUserSettings({ targetProblemsPerDay: newTarget });
    await refreshData();
  };

  const handleOpenStudyDeck = (problem: Problem) => {
    setStudyDeckProblem(problem);
    setIsStudyDeckOpen(true);
  };

  const handleOpenSolveLogger = (problem: Problem, initialHints = 0, initialTime?: number) => {
    setSolveProblem(problem);
    setSolveHintsCount(initialHints);
    setSolveTimeSpent(initialTime);
    setIsSolveModalOpen(true);
  };

  const handleOpenEmbeddedSolver = (problem: Problem) => {
    setEmbeddedProblem(problem);
    setIsEmbeddedModalOpen(true);
  };

  const handleOpenLocalAI = (problem?: Problem) => {
    if (problem) {
      setLocalAIProblem(problem);
    } else if (embeddedProblem) {
      setLocalAIProblem(embeddedProblem);
    } else if (studyDeckProblem) {
      setLocalAIProblem(studyDeckProblem);
    }
    setIsLocalAIOpen(true);
  };

  if (!isReady) {
    return <CursorAppSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black text-[#ededed] flex flex-col selection:bg-zinc-800 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleLocalAI={() => setIsLocalAIOpen(!isLocalAIOpen)}
        isLocalAIOpen={isLocalAIOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* View A: Mission Control (Daily Dashboard) */}
        {activeTab === 'mission-control' && (
          <div>
            <TargetHeader
              metrics={metrics}
              onAdjustTarget={handleAdjustTarget}
            />
            <TodayQueue
              queueItems={queueItems}
              dueCount={dueCount}
              solvedTodayCount={solvedTodayCount}
              targetCount={targetCount}
              onOpenStudyDeck={handleOpenStudyDeck}
              onOpenSolveLogger={(p: Problem) => handleOpenSolveLogger(p, 0)}
              onOpenEmbeddedSolver={handleOpenEmbeddedSolver}
            />
          </div>
        )}

        {/* View D: Striver Sheet Roadmap View */}
        {activeTab === 'roadmap' && (
          <RoadmapView
            problems={problems}
            logs={logs}
            onOpenStudyDeck={handleOpenStudyDeck}
            onOpenSolveLogger={(p: Problem) => handleOpenSolveLogger(p, 0)}
            onOpenEmbeddedSolver={handleOpenEmbeddedSolver}
          />
        )}

        {/* View E: AI Progress Coach & Assessment (Gemini Powered) */}
        {activeTab === 'ai-coach' && (
          <AICoachView />
        )}
      </main>

      {/* View: In-App Embedded LeetCode Workspace */}
      <EmbeddedLeetCodeModal
        problem={embeddedProblem}
        isOpen={isEmbeddedModalOpen}
        onClose={() => setIsEmbeddedModalOpen(false)}
        onOpenSolveLogger={(p: Problem, timeSpent?: number) => handleOpenSolveLogger(p, 0, timeSpent)}
        onOpenLocalAI={(p: Problem) => handleOpenLocalAI(p)}
      />

      {/* Right-Hand Local LM Studio AI Chat Drawer */}
      <LocalAIChatDrawer
        isOpen={isLocalAIOpen}
        onClose={() => setIsLocalAIOpen(false)}
        activeProblem={localAIProblem || embeddedProblem || studyDeckProblem}
      />

      {/* Floating Right Edge Quick-Toggle for Local AI */}
      {!isLocalAIOpen && !isEmbeddedModalOpen && (
        <button
          onClick={() => handleOpenLocalAI()}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#121215] hover:bg-zinc-800 text-zinc-400 hover:text-white border-l border-t border-b border-zinc-800 px-2 py-3.5 rounded-l-lg shadow-xl flex flex-col items-center space-y-1.5 transition group"
          title="Open Local AI Chat (LM Studio)"
        >
          <Bot className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition" />
          <span className="[writing-mode:vertical-lr] text-[9px] font-mono tracking-widest text-zinc-500 group-hover:text-zinc-300 uppercase">
            Local AI
          </span>
        </button>
      )}

      {/* View B: Resource Drawer / Slide-Over Modal */}
      <ResourceDrawer
        problem={studyDeckProblem}
        isOpen={isStudyDeckOpen}
        onClose={() => setIsStudyDeckOpen(false)}
        onOpenLogger={(prob: Problem, hintsCount: number) => {
          handleOpenSolveLogger(prob, hintsCount);
        }}
      />

      {/* View C: 10-Second Post-Solve Modal */}
      <PostSolveModal
        problem={solveProblem}
        initialHintsCount={solveHintsCount}
        initialTimeSpentMinutes={solveTimeSpent}
        isOpen={isSolveModalOpen}
        onClose={() => setIsSolveModalOpen(false)}
        onLogSaved={refreshData}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChanged={refreshData}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 font-mono">
        SDE Tracker: Java Edition &bull; Local-first &bull; Dexie.js &bull; Local LM Studio &bull; Gemini 2.5 Flash
      </footer>
    </div>
  );
}

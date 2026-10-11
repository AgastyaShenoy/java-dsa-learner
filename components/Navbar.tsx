'use client';

import React from 'react';
import { 
  Flame, 
  Settings, 
  Sparkles,
  Bot
} from 'lucide-react';
import { PacingMetrics } from '@/types';

interface NavbarProps {
  activeTab: 'mission-control' | 'roadmap' | 'ai-coach';
  setActiveTab: (tab: 'mission-control' | 'roadmap' | 'ai-coach') => void;
  metrics: PacingMetrics | null;
  onOpenSettings: () => void;
  onToggleLocalAI: () => void;
  isLocalAIOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  onOpenSettings,
  onToggleLocalAI,
  isLocalAIOpen
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-[#000000]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        
        {/* Left: Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold text-xs">
            S
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm text-white tracking-tight">
              SDE Tracker
            </span>
            <span className="text-[11px] font-mono text-zinc-500 border-l border-zinc-800 pl-2">
              Striver Java
            </span>
          </div>
        </div>

        {/* Center: Cursor Website Minimalist Tab Nav */}
        <nav className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('mission-control')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'mission-control'
                ? 'text-white bg-zinc-900 border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
            }`}
          >
            Mission Control
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'roadmap'
                ? 'text-white bg-zinc-900 border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
            }`}
          >
            Roadmap
          </button>

          <button
            onClick={() => setActiveTab('ai-coach')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'ai-coach'
                ? 'text-white bg-zinc-900 border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
            }`}
          >
            <Sparkles className="w-3 h-3 text-zinc-400" />
            <span>AI Coach</span>
          </button>
        </nav>

        {/* Right: Telemetry & Actions */}
        <div className="flex items-center space-x-2">
          {/* Local LM Studio AI Button */}
          <button
            onClick={onToggleLocalAI}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition border ${
              isLocalAIOpen 
                ? 'bg-zinc-800 text-white border-zinc-700' 
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80'
            }`}
            title="Toggle Local AI Chat (LM Studio)"
          >
            <Bot className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Local AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Streak */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800/80 text-zinc-300 text-xs font-mono">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="tabular-nums">{metrics?.streakDays || 0}d</span>
          </div>

          {/* Solved */}
          <div className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800/80 text-zinc-300 text-xs font-mono">
            <span className="tabular-nums font-medium text-white">{metrics?.totalSolved || 0}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500">{metrics?.totalProblems || 30}</span>
          </div>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};

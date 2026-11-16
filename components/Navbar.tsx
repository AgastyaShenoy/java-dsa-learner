'use client';

import React from 'react';
import { Bot, Settings, Timer as TimerIcon } from 'lucide-react';
import type { FocusSession } from '@/types';
import type { Stats } from '@/lib/progress';
import { LiveClock } from './Focus/LiveClock';

export type Tab = 'today' | 'sheet';

interface NavbarProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  stats: Stats;
  onOpenSettings: () => void;
  onOpenAI: () => void;
  /** Present only while a session is minimized. */
  session?: FocusSession;
  sessionTitle?: string;
  onResumeSession: () => void;
}

export function Navbar({ tab, setTab, stats, onOpenSettings, onOpenAI, session, sessionTitle, onResumeSession }: NavbarProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'sheet', label: 'Sheet' },
  ];
  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-paper-0">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="sticker !text-[11px] !px-1.5 !py-0" style={{ ['--rot' as string]: '-6deg' }} aria-hidden>180</span>
          <span className="hidden sm:inline font-display font-extrabold text-sm text-ink" style={{ fontStretch: '118%' }}>SDE TRACKER</span>
        </div>

        <nav className="flex items-center gap-1.5" aria-label="Main">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className="chip !py-1.5 !px-3 !text-[13px] t-label"
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 min-w-0">
          {session && (
            <button
              onClick={onResumeSession}
              className="chip !py-1 !px-2 !text-xs !text-ink-green min-w-0"
              title={`Back to: ${sessionTitle ?? 'current attempt'}`}
            >
              <TimerIcon className="w-3.5 h-3.5 shrink-0" />
              <LiveClock session={session} className="t-clock" />
              <span className="hidden md:inline truncate max-w-[10rem] font-sans">{sessionTitle}</span>
            </button>
          )}

          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-display text-ink-2" title="Problems attempted / total">
            <span className="text-ink font-extrabold tabular-nums">{stats.attempted}</span>/<span className="tabular-nums">{stats.total}</span>
          </span>

          <button onClick={onOpenAI} className="btn !px-2.5 !py-1 !text-xs" title="Local AI tutor (LM Studio)">
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Local AI</span>
          </button>

          <button onClick={onOpenSettings} className="btn-icon" aria-label="Settings" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

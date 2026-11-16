'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLiveQuery } from 'dexie-react-hooks';
import { Navbar, type Tab } from './Navbar';
import { TodayView } from './Today/TodayView';
import { SheetView } from './Sheet/SheetView';
import { ProblemDrawer } from './ProblemDrawer';
import { LogAttemptModal, type LogRequest } from './LogAttemptModal';
import { FocusSession } from './Focus/FocusSession';
import { AppSkeleton } from './AppSkeleton';
import { db, initDatabase, getSettings, getSession, saveSession, addAttempt, editAttempt, deleteAttempt, SEED_PROBLEMS } from '@/lib/db';
import { buildStates, computeStats, nextKind, planToday, suggestStatus } from '@/lib/progress';
import { elapsedMs, newSession, openPractice, practiceUrl } from '@/lib/session';
import { canFloat, preparePipDocument, requestFloat } from '@/lib/float';
import { FloatingTimer, FloatPanel } from './Focus/FloatingTimer';
import { useToday } from '@/lib/hooks';
import { localDay } from '@/lib/dates';
import type { Attempt, Problem } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

// Heavy, rarely-opened panels load on demand so the first paint stays light.
const SettingsModal = dynamic(() => import('./SettingsModal').then(m => m.SettingsModal), { ssr: false });
const LocalAIChatDrawer = dynamic(() => import('./LocalAI/LocalAIChatDrawer').then(m => m.LocalAIChatDrawer), { ssr: false });

const PROBLEMS: Problem[] = [...SEED_PROBLEMS].sort((a, b) => a.n - b.n);
const BY_ID = new Map(PROBLEMS.map(p => [p.id, p]));

// Set by electron/preload.js in the desktop app; undefined in a normal browser.
// (This module only ever runs client-side: page.tsx loads it with ssr: false.)
const desktop = typeof window !== 'undefined' ? window.desktop : undefined;
const IS_FLOAT_WINDOW = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('float') === '1';

export default function AppShell() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string>();

  useEffect(() => {
    initDatabase().then(() => setReady(true), err => setBootError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (!ready) return IS_FLOAT_WINDOW ? null : <AppSkeleton error={bootError} />;
  return IS_FLOAT_WINDOW ? <FloatApp /> : <App />;
}

/**
 * The desktop app's always-on-top timer window. Same origin as the main window, so it
 * reads and writes the same IndexedDB; Dexie's live queries keep both windows in sync.
 */
function FloatApp() {
  const session = useLiveQuery(getSession, [], undefined);
  const settings = useLiveQuery(getSettings, [], DEFAULT_SETTINGS);
  const problem = session ? BY_ID.get(session.problemId) : undefined;
  useEffect(() => { document.title = 'Timer'; }, []);

  if (!session || !problem) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 p-4 text-center text-ink-2">
        <p>No attempt running.</p>
        <button className="btn" onClick={() => desktop?.focusMain()}>Back to the app</button>
      </div>
    );
  }
  return (
    <FloatPanel
      session={session}
      problem={problem}
      lockMinutes={settings.hintLockMinutes}
      practiceOpened
      onOpenPractice={() => void desktop?.openExternal(practiceUrl(problem))}
      onFinish={outcome => desktop?.finishFromFloat(outcome)}
      onBackToApp={() => desktop?.focusMain()}
    />
  );
}

function App() {
  const today = useToday();
  const attempts = useLiveQuery(() => db.attempts.toArray(), [], [] as Attempt[]);
  const settings = useLiveQuery(getSettings, [], DEFAULT_SETTINGS);
  const session = useLiveQuery(getSession, [], undefined);

  const states = useMemo(() => buildStates(PROBLEMS, attempts, today), [attempts, today]);
  const plan = useMemo(() => planToday(PROBLEMS, states, today, settings.includeStretch), [states, today, settings.includeStretch]);
  const stats = useMemo(() => computeStats(PROBLEMS, states, attempts, today), [states, attempts, today]);

  const [tab, setTab] = useState<Tab>('today');
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [logRequest, setLogRequest] = useState<LogRequest | null>(null);
  const [focusMinimized, setFocusMinimized] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  // Desktop app: the float is a separate always-on-top window owned by Electron.
  const [desktopFloatOpen, setDesktopFloatOpen] = useState(false);
  const floatable = useMemo(() => !!desktop || canFloat(), []);

  const sessionProblem = session ? BY_ID.get(session.problemId) : undefined;
  const focusOpen = !!session && !!sessionProblem && !focusMinimized && !logRequest;

  // ─── Actions ──────────────────────────────────────────────────────────────

  const [practiceOpened, setPracticeOpened] = useState(false);

  const attachFloat = useCallback((pw: Window) => {
    if (!pw.document.documentElement.hasAttribute('data-prepared')) {
      preparePipDocument(pw);
      pw.document.documentElement.setAttribute('data-prepared', '');
      pw.addEventListener('pagehide', () => setPipWindow(null), { once: true });
      setPracticeOpened(false);
    }
    setPipWindow(pw);
  }, []);

  /**
   * One click can't open both windows in Chrome: the floating timer and window.open each
   * need the click's "user activation", and whichever goes first uses it up. So Start
   * floats the timer, and the timer's first button opens LeetCode (a click inside the
   * float counts as activation for the app too). Without float support, Start opens
   * LeetCode directly, as before.
   */
  const floatTimer = useCallback(() => {
    if (desktop) {
      desktop.openFloat();
      setDesktopFloatOpen(true);
      return;
    }
    requestFloat()?.then(attachFloat, err => console.warn('Floating timer not opened:', err));
  }, [attachFloat]);

  const openPracticeWindow = useCallback((p: Problem) => {
    if (desktop) {
      // Your normal browser, where you're logged in to LeetCode.
      void desktop.openExternal(practiceUrl(p));
      setPracticeOpened(true);
      return;
    }
    if (openPractice(p)) setPracticeOpened(true);
  }, []);

  const startAttempt = useCallback((p: Problem) => {
    if (session && session.problemId !== p.id) {
      const current = BY_ID.get(session.problemId);
      if (!window.confirm(`You have an attempt running on "${current?.title}". Discard it and start "${p.title}"?`)) return;
    }
    if (desktop) {
      // No popup blocker on the desktop, so one click does both.
      floatTimer();
      openPracticeWindow(p);
    } else if (floatable) floatTimer();
    else openPracticeWindow(p);
    if (!session || session.problemId !== p.id) {
      void saveSession(newSession(p.id, nextKind(states.get(p.id))));
    }
    setDrawerId(null);
    setFocusMinimized(false);
  }, [session, states, floatable, floatTimer, openPracticeWindow]);

  // The float belongs to the session: close it when a session ENDS (logged or discarded).
  // Not merely "no session yet": right after Start the new session is still being saved.
  const hadSession = useRef(false);
  useEffect(() => {
    if (hadSession.current && !session) {
      pipWindow?.close();
      desktop?.closeFloat();
    }
    hadSession.current = !!session;
  }, [session, pipWindow]);

  const backToApp = useCallback(() => {
    window.focus();
    setFocusMinimized(false);
  }, []);

  const finishSession = useCallback((outcome: 'solved' | 'stuck') => {
    if (!session) return;
    pipWindow?.close();
    desktop?.closeFloat();
    window.focus();
    const minutes = Math.max(1, Math.round(elapsedMs(session) / 60_000));
    setLogRequest({
      mode: 'new',
      problemId: session.problemId,
      fromSession: true,
      prefill: {
        kind: session.kind,
        minutes,
        hintsUsed: session.hintsRevealed,
        sawSolution: session.solutionRevealed,
        status: outcome === 'stuck' ? 'BLOCKER' : suggestStatus(session.hintsRevealed, session.solutionRevealed),
        notes: session.triedNotes.length ? session.triedNotes.map((t, i) => `Before hint ${i + 1}: ${t}`).join('\n') : '',
      },
    });
  }, [session, pipWindow]);

  // Desktop: "Solved" / "Didn't get it" in the float window arrive here.
  const finishRef = useRef(finishSession);
  finishRef.current = finishSession;
  useEffect(() => {
    if (!desktop) return;
    const offFinish = desktop.onFinish(outcome => finishRef.current(outcome));
    const offClosed = desktop.onFloatClosed(() => setDesktopFloatOpen(false));
    return () => { offFinish(); offClosed(); };
  }, []);

  const discardSession = useCallback(async () => {
    if (!window.confirm('Discard this attempt? The timer and revealed hints are thrown away; nothing is logged.')) return;
    await saveSession(null);
    setFocusMinimized(false);
  }, []);

  const handleSaveLog = useCallback(async (req: LogRequest, values: Pick<Attempt, 'status' | 'minutes' | 'hintsUsed' | 'notes' | 'sawSolution'>) => {
    if (req.mode === 'edit' && req.attempt?.id !== undefined) {
      await editAttempt(req.attempt.id, values);
    } else {
      const now = new Date();
      await addAttempt({
        problemId: req.problemId,
        kind: req.prefill?.kind ?? nextKind(states.get(req.problemId)),
        day: localDay(now),
        at: now.toISOString(),
        ...values,
      });
      if (req.fromSession) await saveSession(null);
    }
    setLogRequest(null);
  }, [states]);

  const handleDeleteAttempt = useCallback(async (a: Attempt) => {
    if (a.id === undefined) return;
    if (!window.confirm(`Delete the ${a.kind === 'first' ? 'first attempt' : 're-solve'} from ${a.day}? This can't be undone.`)) return;
    await deleteAttempt(a.id);
    setLogRequest(null);
  }, []);

  const drawerProblem = drawerId ? BY_ID.get(drawerId) : undefined;
  const logProblem = logRequest ? BY_ID.get(logRequest.problemId) : undefined;
  const aiProblem = sessionProblem ?? drawerProblem;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        tab={tab}
        setTab={setTab}
        stats={stats}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAI={() => setAiOpen(true)}
        session={focusMinimized ? session : undefined}
        sessionTitle={sessionProblem?.title}
        onResumeSession={() => setFocusMinimized(false)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {tab === 'today' ? (
          <TodayView
            plan={plan}
            stats={stats}
            today={today}
            session={session}
            sessionProblem={sessionProblem}
            settings={settings}
            canFloat={floatable}
            onStart={startAttempt}
            onOpenProblem={p => setDrawerId(p.id)}
            onResume={() => setFocusMinimized(false)}
            onBrowse={() => setTab('sheet')}
          />
        ) : (
          <SheetView problems={PROBLEMS} states={states} today={today} onOpenProblem={p => setDrawerId(p.id)} />
        )}
      </main>

      <footer className="border-t-2 border-line py-5 text-center text-xs text-ink-2 px-4">
        Striver&apos;s 180 · local-first · your data stays in this browser (back it up in Settings)
      </footer>

      {drawerProblem && (
        <ProblemDrawer
          problem={drawerProblem}
          state={states.get(drawerProblem.id)!}
          today={today}
          activeSessionProblemId={session?.problemId ?? null}
          onClose={() => setDrawerId(null)}
          onStart={() => startAttempt(drawerProblem)}
          onLogElsewhere={() => setLogRequest({ mode: 'new', problemId: drawerProblem.id })}
          onEditAttempt={a => setLogRequest({ mode: 'edit', problemId: drawerProblem.id, attempt: a })}
          onDeleteAttempt={handleDeleteAttempt}
          onAskAI={() => setAiOpen(true)}
        />
      )}

      {focusOpen && session && sessionProblem && (
        <FocusSession
          session={session}
          problem={sessionProblem}
          lockMinutes={settings.hintLockMinutes}
          onMinimize={() => setFocusMinimized(true)}
          onFinish={finishSession}
          onDiscard={discardSession}
          onAskAI={() => setAiOpen(true)}
          onOpenPractice={() => openPracticeWindow(sessionProblem)}
          onFloat={floatable && !pipWindow && !desktopFloatOpen ? floatTimer : undefined}
        />
      )}

      {pipWindow && session && sessionProblem && (
        <FloatingTimer
          pipWindow={pipWindow}
          session={session}
          problem={sessionProblem}
          lockMinutes={settings.hintLockMinutes}
          onFinish={finishSession}
          onBackToApp={backToApp}
          practiceOpened={practiceOpened}
          onOpenPractice={() => openPracticeWindow(sessionProblem)}
        />
      )}

      {logRequest && logProblem && (
        <LogAttemptModal
          request={logRequest}
          problem={logProblem}
          state={states.get(logProblem.id)!}
          onClose={() => setLogRequest(null)}
          onSave={handleSaveLog}
          onDelete={handleDeleteAttempt}
        />
      )}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} settings={settings} attemptCount={attempts.length} />}

      {aiOpen && (
        <LocalAIChatDrawer
          onClose={() => setAiOpen(false)}
          baseUrl={settings.lmStudioUrl}
          problem={aiProblem ?? null}
          session={session && aiProblem && session.problemId === aiProblem.id ? session : undefined}
          hasHistory={!!aiProblem && (states.get(aiProblem.id)?.attempts.length ?? 0) > 0}
        />
      )}
    </div>
  );
}

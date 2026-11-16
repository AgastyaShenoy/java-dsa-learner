'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { localDay, msUntilMidnight } from './dates';

/**
 * The current local day. Updates at local midnight and whenever the tab becomes visible
 * again, so a tab left open overnight shows today's queue, not yesterday's.
 */
export function useToday(): string {
  const [today, setToday] = useState(localDay);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const sync = () => setToday(localDay());
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { sync(); schedule(); }, msUntilMidnight() + 500);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') { sync(); schedule(); } };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  return today;
}

/**
 * Which window's timers drive the ticking clocks below. Inside the floating
 * Picture-in-Picture panel this is the PiP window: it stays visible while the app's own
 * tab sits behind LeetCode, where Chrome would throttle its timers to once a minute.
 */
export const TimerWindowContext = createContext<Window | null>(null);

/** Epoch ms that re-renders every `intervalMs` while enabled. Keep it in small leaf components. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  const ctxWin = useContext(TimerWindowContext);
  useEffect(() => {
    if (!enabled) return;
    const win = ctxWin ?? window;
    setNow(Date.now());
    const id = win.setInterval(() => setNow(Date.now()), intervalMs);
    const onVisible = () => setNow(Date.now());
    win.document.addEventListener('visibilitychange', onVisible);
    return () => {
      win.clearInterval(id);
      win.document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, enabled, ctxWin]);
  return now;
}

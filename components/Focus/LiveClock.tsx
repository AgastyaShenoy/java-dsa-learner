'use client';

import React from 'react';
import type { FocusSession } from '@/types';
import { elapsedMs } from '@/lib/session';
import { formatClock } from '@/lib/dates';
import { useNow } from '@/lib/hooks';

/** The only thing that re-renders every second. Keep it a leaf. */
export function LiveClock({ session, className = '' }: { session: FocusSession; className?: string }) {
  const now = useNow(1000, session.runningSince !== null);
  return <span className={`tabular-nums ${className}`}>{formatClock(elapsedMs(session, now))}</span>;
}

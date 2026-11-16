// The focus session = the one attempt in progress. It lives in IndexedDB (kv 'session'),
// so a reload, a closed tab or a crash never loses the timer or revealed hints.
//
// Timer: wall-clock based. elapsed = bankedMs + (now - runningSince). A hidden/throttled tab
// can't make it drift, because nothing is counted per tick; ticks only repaint.

import type { AttemptKind, FocusSession, Problem } from '@/types';
import { saveSession } from './db';

export function elapsedMs(s: FocusSession, now = Date.now()): number {
  return s.bankedMs + (s.runningSince !== null ? Math.max(0, now - s.runningSince) : 0);
}

export function newSession(problemId: string, kind: AttemptKind): FocusSession {
  const now = Date.now();
  return {
    id: 'active',
    problemId,
    kind,
    runningSince: now,
    bankedMs: 0,
    triedNotes: [],
    hintsRevealed: 0,
    solutionRevealed: false,
    startedAt: new Date(now).toISOString(),
  };
}

export async function pause(s: FocusSession) {
  if (s.runningSince === null) return;
  await saveSession({ ...s, bankedMs: elapsedMs(s), runningSince: null });
}

export async function resume(s: FocusSession) {
  if (s.runningSince !== null) return;
  await saveSession({ ...s, runningSince: Date.now() });
}

// ─── Hint gate ───────────────────────────────────────────────────────────────
// Hint 1: after `lockMinutes` of active (unpaused) time, and only with a "what I tried" note.
// Hint 2: after hint 1, again with a fresh note of what you tried with hint 1.
// Solution (video / editorial): only after both hints, behind an explicit confirm.

export const MIN_TRIED_CHARS = 12;

export type GateState =
  | { kind: 'locked'; unlocksInMs: number }
  | { kind: 'ready' }
  | { kind: 'done' };

export function hintGate(s: FocusSession, index: number, lockMinutes: number, now = Date.now()): GateState {
  if (s.hintsRevealed > index) return { kind: 'done' };
  if (index > s.hintsRevealed) return { kind: 'locked', unlocksInMs: Infinity };
  if (index === 0) {
    const remaining = lockMinutes * 60_000 - elapsedMs(s, now);
    if (remaining > 0) return { kind: 'locked', unlocksInMs: remaining };
  }
  return { kind: 'ready' };
}

export async function revealHint(s: FocusSession, triedNote: string) {
  const note = triedNote.trim();
  if (note.length < MIN_TRIED_CHARS) throw new Error('Write a line about what you tried first.');
  await saveSession({ ...s, hintsRevealed: s.hintsRevealed + 1, triedNotes: [...s.triedNotes, note] });
}

export async function revealSolution(s: FocusSession) {
  await saveSession({ ...s, solutionRevealed: true });
}

// ─── Links ───────────────────────────────────────────────────────────────────

export function leetcodeUrl(p: Problem): string | null {
  return p.leetcodeSlug ? `https://leetcode.com/problems/${p.leetcodeSlug}/` : null;
}

/** Where to actually solve it: LeetCode when there's a free exact match, else takeuforward. */
export function practiceUrl(p: Problem): string {
  const lc = leetcodeUrl(p);
  return lc && !p.leetcodePremium ? lc : p.tufUrl;
}

const PRACTICE_WINDOW = 'sde-tracker-practice';

/**
 * Open the practice page in its own browser window, sized to the screen. It's a real
 * top-level window (not an iframe), so your LeetCode login works. The name makes every
 * click reuse that one window instead of piling up tabs.
 *
 * Must run inside a click handler. In Chrome, window.open uses up the click's
 * "user activation", so anything else that needs it (the floating timer) must be
 * requested BEFORE this call.
 */
export function openPractice(p: Problem): Window | null {
  const s = window.screen as Screen & { availLeft?: number; availTop?: number };
  const features = `popup,width=${s.availWidth},height=${s.availHeight},left=${s.availLeft ?? 0},top=${s.availTop ?? 0}`;
  return window.open(practiceUrl(p), PRACTICE_WINDOW, features);
}

export function youtubeUrl(p: Problem): string | null {
  return p.youtubeId ? `https://www.youtube.com/watch?v=${p.youtubeId}` : null;
}

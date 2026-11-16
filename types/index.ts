// ─── Problem catalogue (static, shipped in data/striver180.json) ────────────────

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Problem {
  /** Stable id = takeuforward slug, e.g. "majority-element-i". */
  id: string;
  /** 1-based position in Striver's 180 sheet. */
  n: number;
  /** Top-level module, e.g. "Binary Search". */
  module: string;
  /** Pattern group inside the module, e.g. "Search on Answer". */
  pattern: string;
  title: string;
  difficulty: Difficulty;
  /** Striver's tier label: basic | core | pro. */
  tier: 'basic' | 'core' | 'pro';
  /** Niche / rarely asked in fresher interviews: skipped by "Up next" unless enabled. */
  stretch: boolean;
  /** LeetCode slug when an exact LeetCode equivalent exists. */
  leetcodeSlug: string | null;
  leetcodePremium: boolean;
  /** takeuforward practice page (always present). */
  tufUrl: string;
  tufPremium: boolean;
  youtubeId: string | null;
  editorialUrl: string | null;
  /** Two nudge-only hints: [what to notice, which direction]. Never the answer. */
  hints: [string, string];
  /** One Java pitfall, shown only after an attempt is logged. */
  javaNote: string;
}

// ─── Attempts (append-only history; every solve and re-solve is a row) ─────────

/** CLEAN = solved with no hints. HESITANT = solved, but needed hints or was shaky. BLOCKER = needed the solution / did not get it. */
export type AttemptStatus = 'CLEAN' | 'HESITANT' | 'BLOCKER';
export type AttemptKind = 'first' | 'resolve';

export interface Attempt {
  id?: number;
  problemId: string;
  kind: AttemptKind;
  /** Local calendar day the attempt was made, YYYY-MM-DD (never UTC). */
  day: string;
  /** Exact timestamp (ISO) for ordering within a day. */
  at: string;
  status: AttemptStatus;
  minutes: number;
  hintsUsed: number;
  sawSolution: boolean;
  /** Final note: what you missed, the key idea. */
  notes: string;
  /** What you said you had tried before each hint, in order (one per hint revealed). */
  triedNotes?: string[];
}

// ─── Settings ──────────────────────────────────────────────────────────────────

export interface UserSettings {
  id: 'user_settings';
  /** Minutes of solo effort before hint 1 unlocks. */
  hintLockMinutes: number;
  /** Include stretch problems when picking what's up next. */
  includeStretch: boolean;
  lmStudioUrl: string;
  leetcodeUsername: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'user_settings',
  hintLockMinutes: 25,
  includeStretch: false,
  lmStudioUrl: 'http://127.0.0.1:1234/v1',
  leetcodeUsername: '',
};

// ─── Focus session (the one attempt in progress; survives reloads) ────────────

export interface FocusSession {
  id: 'active';
  problemId: string;
  kind: AttemptKind;
  /** Epoch ms when the current running stretch started; null while paused. */
  runningSince: number | null;
  /** Active milliseconds banked before the current running stretch. */
  bankedMs: number;
  /** One "what have you tried?" note per revealed hint. */
  triedNotes: string[];
  hintsRevealed: number;
  solutionRevealed: boolean;
  startedAt: string;
}

// ─── Derived per-problem state (computed, never stored) ───────────────────────

export type ProblemPhase = 'new' | 'learning' | 'mastered';

export interface ProblemState {
  problemId: string;
  phase: ProblemPhase;
  attempts: Attempt[];
  last?: Attempt;
  /** Local day the next from-scratch re-solve is due (null when new or mastered). */
  nextResolveDay: string | null;
  isDue: boolean;
}

// ─── LeetCode contest rating (cached) ────────────────────────────────────────

export interface ContestRating {
  username: string;
  rating: number | null;
  attended: number;
  topPercentage: number | null;
  history: { title: string; rating: number; time: number }[];
  fetchedAt: number;
}

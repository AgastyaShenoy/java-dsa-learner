import Dexie, { type Table } from 'dexie';
import type { Attempt, AttemptStatus, FocusSession, Problem, UserSettings, ContestRating } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { localDay, isValidDay } from './dates';
import sheet from '@/data/striver180.json';

// The JSON's inferred types are looser than Problem (string vs union, string[] vs tuple);
// scripts/build-sheet.mjs is what guarantees the shape.
export const SHEET_VERSION: number = sheet.version;
export const SEED_PROBLEMS: Problem[] = sheet.problems as unknown as Problem[];

/** Generic key-value rows: seed version, focus session, cached contest rating, migration leftovers. */
interface KV {
  key: string;
  value: unknown;
}

export class TrackerDB extends Dexie {
  problems!: Table<Problem, string>;
  attempts!: Table<Attempt, number>;
  settings!: Table<UserSettings, string>;
  kv!: Table<KV, string>;

  constructor() {
    super('SDETrackerJavaDB');

    // v1: the original app (one log per problem, overwritten on every save).
    this.version(1).stores({
      problems: 'id, sheetIndex, topic, subTopic, difficulty',
      problemLogs: 'problemId, completedAt, status, nextReviewDate',
      settings: 'id',
      coachReports: '++id, createdAt',
    });

    // v2: append-only attempts, local-day dates, Striver 180 catalogue, no cloud coach.
    this.version(2)
      .stores({
        problems: 'id, n, module',
        attempts: '++id, problemId, day',
        settings: 'id',
        kv: 'key',
        problemLogs: null,
        coachReports: null,
      })
      .upgrade(async tx => {
        const oldProblems = await tx.table('problems').toArray();
        const oldLogs = await tx.table('problemLogs').toArray();
        const { attempts, unmapped } = convertLegacyLogs(oldLogs, oldProblems);
        if (attempts.length) await tx.table('attempts').bulkAdd(attempts);
        if (unmapped.length) await tx.table('kv').put({ key: 'legacyUnmapped', value: unmapped });

        const oldSettings = await tx.table('settings').get('user_settings');
        await tx.table('settings').put({ ...DEFAULT_SETTINGS, ...pickSettings(oldSettings) });

        // Problems are re-seeded by syncSeed() right after open.
        await tx.table('problems').clear();
      });
  }
}

export const db = new TrackerDB();

// ─── Legacy (v1) conversion: used by the schema upgrade and by importing old backups ──

interface LegacyLog {
  problemId: string;
  completedAt: string;
  timeSpentMinutes?: number;
  status?: string;
  hintsViewedCount?: number;
  notes?: string;
}

const slugFromUrl = (url: unknown) =>
  typeof url === 'string' ? (url.match(/leetcode\.com\/problems\/([^/?#]+)/)?.[1] ?? null) : null;

export function convertLegacyLogs(logs: LegacyLog[], legacyProblems: { id: string; leetcodeUrl?: string; title?: string }[]) {
  const byLeetcode = new Map<string, Problem>();
  const byTitle = new Map<string, Problem>();
  for (const p of SEED_PROBLEMS) {
    if (p.leetcodeSlug) byLeetcode.set(p.leetcodeSlug, p);
    byTitle.set(p.title.toLowerCase().replace(/[^a-z0-9]/g, ''), p);
  }
  const attempts: Attempt[] = [];
  const unmapped: LegacyLog[] = [];
  for (const log of logs) {
    const old = legacyProblems.find(p => p.id === log.problemId);
    const target =
      byLeetcode.get(slugFromUrl(old?.leetcodeUrl) ?? '') ??
      byTitle.get((old?.title ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')) ??
      SEED_PROBLEMS.find(p => p.id === log.problemId);
    const when = new Date(log.completedAt);
    if (!target || isNaN(when.getTime())) {
      unmapped.push(log);
      continue;
    }
    const status: AttemptStatus = log.status === 'HESITANT' || log.status === 'BLOCKER' ? log.status : 'CLEAN';
    attempts.push({
      problemId: target.id,
      kind: 'first',
      day: localDay(when),
      at: when.toISOString(),
      status,
      minutes: Math.max(0, Math.round(Number(log.timeSpentMinutes) || 0)),
      hintsUsed: Math.max(0, Math.round(Number(log.hintsViewedCount) || 0)),
      sawSolution: status === 'BLOCKER',
      notes: typeof log.notes === 'string' ? log.notes : '',
    });
  }
  return { attempts, unmapped };
}

function pickSettings(s: unknown): Partial<UserSettings> {
  if (!s || typeof s !== 'object') return {};
  const o = s as Record<string, unknown>;
  const out: Partial<UserSettings> = {};
  if (typeof o.hintLockMinutes === 'number' && o.hintLockMinutes >= 0 && o.hintLockMinutes <= 120) out.hintLockMinutes = Math.round(o.hintLockMinutes);
  if (typeof o.includeStretch === 'boolean') out.includeStretch = o.includeStretch;
  if (typeof o.lmStudioUrl === 'string' && o.lmStudioUrl) out.lmStudioUrl = o.lmStudioUrl;
  if (typeof o.leetcodeUsername === 'string') out.leetcodeUsername = o.leetcodeUsername.trim();
  return out;
}

// ─── Startup ──────────────────────────────────────────────────────────────────

let initPromise: Promise<void> | null = null;

/** Idempotent and safe to call twice (React StrictMode mounts effects twice in dev). */
export function initDatabase(): Promise<void> {
  if (!initPromise) initPromise = doInit().catch(err => { initPromise = null; throw err; });
  return initPromise;
}

async function doInit() {
  await db.open();
  await db.transaction('rw', db.problems, db.settings, db.kv, async () => {
    const seeded = await db.kv.get('sheetVersion');
    const count = await db.problems.count();
    // Only touch the catalogue when the bundled sheet changes (not on every load).
    if (seeded?.value !== SHEET_VERSION || count !== SEED_PROBLEMS.length) {
      await db.problems.clear();
      await db.problems.bulkAdd(SEED_PROBLEMS);
      await db.kv.put({ key: 'sheetVersion', value: SHEET_VERSION });
    }
    const s = await db.settings.get('user_settings');
    if (!s) await db.settings.put(DEFAULT_SETTINGS);
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  return { ...DEFAULT_SETTINGS, ...(await db.settings.get('user_settings')) };
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...pickSettings({ ...current, ...patch }), id: 'user_settings' });
}

// ─── Attempts ────────────────────────────────────────────────────────────────

export async function addAttempt(a: Omit<Attempt, 'id'>): Promise<number> {
  return db.attempts.add(a as Attempt);
}

/** Edit notes/status/minutes of a past attempt. The day never changes, so history stays honest. */
export async function editAttempt(id: number, patch: Pick<Attempt, 'status' | 'minutes' | 'hintsUsed' | 'notes' | 'sawSolution'>): Promise<void> {
  await db.attempts.update(id, patch);
}

export async function deleteAttempt(id: number): Promise<void> {
  await db.attempts.delete(id);
}

// ─── Focus session ───────────────────────────────────────────────────────────

export async function getSession(): Promise<FocusSession | undefined> {
  return (await db.kv.get('session'))?.value as FocusSession | undefined;
}

export async function saveSession(s: FocusSession | null): Promise<void> {
  if (s) await db.kv.put({ key: 'session', value: s });
  else await db.kv.delete('session');
}

// ─── Contest rating cache ────────────────────────────────────────────────────

export async function getCachedRating(): Promise<ContestRating | undefined> {
  return (await db.kv.get('contestRating'))?.value as ContestRating | undefined;
}

export async function cacheRating(r: ContestRating): Promise<void> {
  await db.kv.put({ key: 'contestRating', value: r });
}

// ─── Backup / restore ────────────────────────────────────────────────────────

export interface BackupFile {
  app: 'sde-tracker';
  version: 2;
  exportedAt: string;
  sheetVersion: number;
  attempts: Attempt[];
  settings: UserSettings;
  /** Old v1 logs for problems that aren't in Striver 180 (kept, never silently dropped). */
  legacyUnmapped?: unknown[];
}

export async function getLegacyUnmapped(): Promise<unknown[]> {
  const v = (await db.kv.get('legacyUnmapped'))?.value;
  return Array.isArray(v) ? v : [];
}

export async function exportBackup(): Promise<BackupFile> {
  const legacy = await getLegacyUnmapped();
  return {
    app: 'sde-tracker',
    version: 2,
    exportedAt: new Date().toISOString(),
    sheetVersion: SHEET_VERSION,
    attempts: await db.attempts.toArray(),
    settings: await getSettings(),
    ...(legacy.length ? { legacyUnmapped: legacy } : {}),
  };
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadBackup(label = 'backup') {
  downloadJSON(await exportBackup(), `sde-tracker-${label}-${localDay()}.json`);
}

const STATUSES: AttemptStatus[] = ['CLEAN', 'HESITANT', 'BLOCKER'];

function validAttempt(x: unknown, known: Set<string>): Attempt | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (typeof o.problemId !== 'string' || !known.has(o.problemId)) return null;
  if (!isValidDay(o.day) || typeof o.at !== 'string' || isNaN(Date.parse(o.at))) return null;
  if (!STATUSES.includes(o.status as AttemptStatus)) return null;
  return {
    problemId: o.problemId,
    kind: o.kind === 'resolve' ? 'resolve' : 'first',
    day: o.day,
    at: o.at,
    status: o.status as AttemptStatus,
    minutes: Math.max(0, Math.min(1440, Math.round(Number(o.minutes) || 0))),
    hintsUsed: Math.max(0, Math.min(2, Math.round(Number(o.hintsUsed) || 0))),
    sawSolution: o.sawSolution === true,
    notes: typeof o.notes === 'string' ? o.notes.slice(0, 20_000) : '',
    ...(Array.isArray(o.triedNotes) && o.triedNotes.length
      ? { triedNotes: o.triedNotes.filter((t): t is string => typeof t === 'string').slice(0, 2).map(t => t.slice(0, 4000)) }
      : {}),
  };
}

export interface ParsedImport {
  attempts: Attempt[];
  settings: Partial<UserSettings>;
  skipped: number;
  format: 'v2' | 'v1-legacy';
}

/** Parse and validate without writing anything, so the UI can show "replace N attempts?" first. */
export function parseBackup(text: string): ParsedImport {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!data || typeof data !== 'object') throw new Error('Unrecognised backup file.');
  const known = new Set(SEED_PROBLEMS.map(p => p.id));

  if (data.app === 'sde-tracker' && data.version === 2 && Array.isArray(data.attempts)) {
    const attempts = (data.attempts as unknown[]).map(a => validAttempt(a, known)).filter((a): a is Attempt => !!a);
    return { attempts, settings: pickSettings(data.settings), skipped: data.attempts.length - attempts.length, format: 'v2' };
  }
  if (Array.isArray(data.problemLogs)) {
    const { attempts, unmapped } = convertLegacyLogs(data.problemLogs as LegacyLog[], (data.problems as never[]) ?? []);
    return { attempts, settings: {}, skipped: unmapped.length, format: 'v1-legacy' };
  }
  throw new Error('Unrecognised backup file: expected an SDE Tracker export.');
}

export async function applyImport(parsed: ParsedImport): Promise<void> {
  await db.transaction('rw', db.attempts, db.settings, db.kv, async () => {
    await db.attempts.clear();
    // Drop ids from the file so Dexie assigns fresh ones.
    await db.attempts.bulkAdd(parsed.attempts.map(a => ({ ...a, id: undefined })));
    if (Object.keys(parsed.settings).length) {
      const current = await getSettings();
      await db.settings.put({ ...current, ...parsed.settings, id: 'user_settings' });
    }
    await db.kv.delete('session');
  });
}

export async function resetProgress(): Promise<void> {
  await db.transaction('rw', db.attempts, db.kv, async () => {
    await db.attempts.clear();
    await db.kv.delete('session');
  });
}

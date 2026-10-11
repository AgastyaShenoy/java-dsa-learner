import Dexie, { type Table } from 'dexie';
import { Problem, ProblemLog, UserSettings, CoachReport, PacingMetrics } from '@/types';
import seedProblems from '@/data/striverSheet.json';

export class SDETDatabase extends Dexie {
  problems!: Table<Problem, string>;
  problemLogs!: Table<ProblemLog, string>;
  settings!: Table<UserSettings, string>;
  coachReports!: Table<CoachReport, number>;

  constructor() {
    super('SDETrackerJavaDB');
    this.version(1).stores({
      problems: 'id, sheetIndex, topic, subTopic, difficulty',
      problemLogs: 'problemId, completedAt, status, nextReviewDate',
      settings: 'id',
      coachReports: '++id, createdAt'
    });
  }
}

export const db = new SDETDatabase();

export async function initDatabase(): Promise<void> {
  if (typeof window === 'undefined') return;

  const problemCount = await db.problems.count();
  if (problemCount === 0) {
    console.log('Seeding Striver SDE Sheet problems into Dexie...');
    await db.problems.bulkAdd(seedProblems as Problem[]);
  } else {
    // Keep problem metadata synced (e.g. updated video IDs) while preserving user logs
    await db.problems.bulkPut(seedProblems as Problem[]);
  }

  const existingSettings = await db.settings.get('user_settings');
  if (!existingSettings) {
    await db.settings.put({
      id: 'user_settings',
      targetProblemsPerDay: 4,
      startDate: new Date().toISOString(),
      preferredLanguage: 'Java'
    });
  }
}

export async function getUserSettings(): Promise<UserSettings> {
  const current = await db.settings.get('user_settings');
  if (current) return current;
  const defaults: UserSettings = {
    id: 'user_settings',
    targetProblemsPerDay: 4,
    startDate: new Date().toISOString(),
    preferredLanguage: 'Java'
  };
  await db.settings.put(defaults);
  return defaults;
}

export async function updateUserSettings(updated: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getUserSettings();
  const merged: UserSettings = { ...current, ...updated, id: 'user_settings' };
  await db.settings.put(merged);
  return merged;
}

export async function saveProblemLog(log: ProblemLog): Promise<void> {
  await db.problemLogs.put(log);
}

export async function deleteProblemLog(problemId: string): Promise<void> {
  await db.problemLogs.delete(problemId);
}

export async function getProblemLog(problemId: string): Promise<ProblemLog | undefined> {
  return await db.problemLogs.get(problemId);
}

export async function getAllLogs(): Promise<ProblemLog[]> {
  return await db.problemLogs.toArray();
}

export async function getAllProblems(): Promise<Problem[]> {
  return await db.problems.orderBy('sheetIndex').toArray();
}

export async function getCoachReports(): Promise<CoachReport[]> {
  return await db.coachReports.reverse().sortBy('createdAt');
}

export async function saveCoachReport(report: Omit<CoachReport, 'id'>): Promise<number> {
  const id = await db.coachReports.add(report as CoachReport);
  return id as number;
}

export interface TodayQueueItem {
  problem: Problem;
  log?: ProblemLog;
  isReviewDue: boolean;
  reviewReason?: string;
}

export async function getTodayQueue(): Promise<{
  queue: TodayQueueItem[];
  targetCount: number;
  dueCount: number;
  solvedTodayCount: number;
}> {
  const settings = await getUserSettings();
  const problems = await getAllProblems();
  const logs = await getAllLogs();

  const logMap = new Map<string, ProblemLog>();
  logs.forEach(l => logMap.set(l.problemId, l));

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Find items solved today
  const solvedToday = logs.filter(l => l.completedAt.startsWith(todayStr));
  const solvedTodayCount = solvedToday.length;

  // 2. Find problems due for spaced repetition
  const reviewDueItems: TodayQueueItem[] = [];
  for (const prob of problems) {
    const log = logMap.get(prob.id);
    if (log && log.nextReviewDate) {
      const reviewDate = log.nextReviewDate.split('T')[0];
      if (reviewDate <= todayStr) {
        reviewDueItems.push({
          problem: prob,
          log,
          isReviewDue: true,
          reviewReason: log.status === 'BLOCKER' 
            ? 'Blocked 3 days ago - time to solidify!' 
            : 'Hesitant solve - review to achieve clean mastery'
        });
      }
    }
  }

  // 3. Find unsolved problems to meet today's quota
  const remainingQuota = Math.max(0, settings.targetProblemsPerDay - solvedTodayCount);
  const newQueueItems: TodayQueueItem[] = [];

  for (const prob of problems) {
    if (newQueueItems.length >= remainingQuota) break;
    const log = logMap.get(prob.id);
    // If not solved at all, or solved today
    if (!log) {
      // Don't duplicate if already in review items
      if (!reviewDueItems.some(r => r.problem.id === prob.id)) {
        newQueueItems.push({
          problem: prob,
          isReviewDue: false
        });
      }
    }
  }

  return {
    queue: [...reviewDueItems, ...newQueueItems],
    targetCount: settings.targetProblemsPerDay,
    dueCount: reviewDueItems.length,
    solvedTodayCount
  };
}

export async function calculatePacingMetrics(): Promise<PacingMetrics> {
  const settings = await getUserSettings();
  const totalProblems = await db.problems.count();
  const logs = await getAllLogs();

  const totalSolved = logs.length;
  const completionPercentage = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const solvedTodayCount = logs.filter(l => l.completedAt.startsWith(todayStr)).length;

  // Due for review count
  const dueForReviewCount = logs.filter(l => {
    if (!l.nextReviewDate) return false;
    return l.nextReviewDate.split('T')[0] <= todayStr;
  }).length;

  // Calculate Streak
  // Set of dates with at least 1 solve
  const solveDates = new Set<string>();
  logs.forEach(l => {
    solveDates.add(l.completedAt.split('T')[0]);
  });

  let streak = 0;
  const checkDate = new Date();
  // If today has no solve, start checking from yesterday, or from today if solved
  const checkTodayStr = checkDate.toISOString().split('T')[0];
  if (!solveDates.has(checkTodayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (solveDates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Velocity (problems per day)
  const remainingProblems = Math.max(0, totalProblems - totalSolved);
  const velocity = Math.max(1, settings.targetProblemsPerDay);
  const daysNeeded = Math.ceil(remainingProblems / velocity);
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);
  const estimatedCompletionDate = estimatedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    streakDays: streak,
    totalSolved,
    totalProblems,
    completionPercentage,
    estimatedCompletionDate,
    dueForReviewCount,
    solvedTodayCount,
    todayTarget: settings.targetProblemsPerDay,
    velocityPerDay: velocity
  };
}

export async function exportDatabaseJSON(): Promise<string> {
  const problems = await db.problems.toArray();
  const logs = await db.problemLogs.toArray();
  const settings = await db.settings.toArray();
  const reports = await db.coachReports.toArray();

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    problems,
    problemLogs: logs,
    settings,
    coachReports: reports
  };

  return JSON.stringify(data, null, 2);
}

export async function importDatabaseJSON(jsonStr: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.problems || !Array.isArray(data.problems)) {
      throw new Error('Invalid backup file: problems array missing');
    }

    await db.transaction('rw', [db.problems, db.problemLogs, db.settings, db.coachReports], async () => {
      await db.problems.clear();
      await db.problems.bulkAdd(data.problems);

      if (data.problemLogs && Array.isArray(data.problemLogs)) {
        await db.problemLogs.clear();
        await db.problemLogs.bulkAdd(data.problemLogs);
      }

      if (data.settings && Array.isArray(data.settings) && data.settings.length > 0) {
        await db.settings.clear();
        await db.settings.bulkAdd(data.settings);
      }

      if (data.coachReports && Array.isArray(data.coachReports)) {
        await db.coachReports.clear();
        await db.coachReports.bulkAdd(data.coachReports);
      }
    });

    return { success: true, message: `Successfully restored ${data.problems.length} problems and ${data.problemLogs?.length || 0} logs.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown import error';
    return { success: false, message: msg };
  }
}

export async function resetToSeedData(): Promise<void> {
  await db.transaction('rw', [db.problems, db.problemLogs, db.settings, db.coachReports], async () => {
    await db.problems.clear();
    await db.problems.bulkAdd(seedProblems as Problem[]);
    await db.problemLogs.clear();
    await db.coachReports.clear();
    await db.settings.clear();
    await db.settings.put({
      id: 'user_settings',
      targetProblemsPerDay: 4,
      startDate: new Date().toISOString(),
      preferredLanguage: 'Java'
    });
  });
}

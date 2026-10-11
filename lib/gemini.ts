import { getAllLogs, getAllProblems, saveCoachReport } from './db';
import { CoachReport, Problem } from '@/types';

export interface PerformanceStats {
  periodStart: string;
  periodEnd: string;
  totalSolvedCount: number;
  cleanCount: number;
  hesitantCount: number;
  blockerCount: number;
  avgTimeSpentMinutes: number;
  topicBreakdown: Record<string, {
    solved: number;
    clean: number;
    hesitant: number;
    blocker: number;
    totalHintsViewed: number;
    avgTime: number;
  }>;
  javaNotes: Array<{
    title: string;
    note: string;
    status: string;
  }>;
}

export async function gatherPast7DaysStats(): Promise<PerformanceStats> {
  const allLogs = await getAllLogs();
  const allProblems = await getAllProblems();
  const problemMap = new Map<string, Problem>();
  allProblems.forEach(p => problemMap.set(p.id, p));

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Filter logs within 7 days
  const recentLogs = allLogs.filter(l => {
    const d = new Date(l.completedAt);
    return d >= sevenDaysAgo;
  });

  const topicBreakdown: PerformanceStats['topicBreakdown'] = {};
  const javaNotes: PerformanceStats['javaNotes'] = [];
  let totalTime = 0;
  let cleanCount = 0;
  let hesitantCount = 0;
  let blockerCount = 0;

  for (const log of recentLogs) {
    totalTime += log.timeSpentMinutes || 0;
    if (log.status === 'CLEAN') cleanCount++;
    else if (log.status === 'HESITANT') hesitantCount++;
    else if (log.status === 'BLOCKER') blockerCount++;

    const problem = problemMap.get(log.problemId);
    const topic = problem?.topic || 'General';

    if (!topicBreakdown[topic]) {
      topicBreakdown[topic] = {
        solved: 0,
        clean: 0,
        hesitant: 0,
        blocker: 0,
        totalHintsViewed: 0,
        avgTime: 0
      };
    }

    topicBreakdown[topic].solved++;
    if (log.status === 'CLEAN') topicBreakdown[topic].clean++;
    if (log.status === 'HESITANT') topicBreakdown[topic].hesitant++;
    if (log.status === 'BLOCKER') topicBreakdown[topic].blocker++;
    topicBreakdown[topic].totalHintsViewed += log.hintsViewedCount || 0;

    if (log.notes && log.notes.trim().length > 0) {
      javaNotes.push({
        title: problem?.title || log.problemId,
        note: log.notes.trim(),
        status: log.status
      });
    }
  }

  // Calculate averages per topic
  for (const topic of Object.keys(topicBreakdown)) {
    const item = topicBreakdown[topic];
    item.avgTime = item.solved > 0 ? Math.round(totalTime / item.solved) : 0;
  }

  const avgTime = recentLogs.length > 0 ? Math.round(totalTime / recentLogs.length) : 0;

  return {
    periodStart: sevenDaysAgo.toISOString(),
    periodEnd: now.toISOString(),
    totalSolvedCount: recentLogs.length,
    cleanCount,
    hesitantCount,
    blockerCount,
    avgTimeSpentMinutes: avgTime,
    topicBreakdown,
    javaNotes
  };
}

export async function requestCoachAudit(apiKey?: string): Promise<{ report: CoachReport; isDemo: boolean }> {
  const stats = await gatherPast7DaysStats();

  const response = await fetch('/api/ai-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, stats })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.fallbackReport) {
      await saveCoachReport(errorData.fallbackReport);
      return { report: errorData.fallbackReport, isDemo: true };
    }
    throw new Error(errorData.error || 'Failed to generate Coach report');
  }

  const data = await response.json();
  if (data.report) {
    await saveCoachReport(data.report);
  }

  return { report: data.report, isDemo: !!data.isDemo };
}

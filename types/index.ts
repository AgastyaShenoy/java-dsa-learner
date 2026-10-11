export interface Problem {
  id: string;
  sheetIndex: number;
  title: string;
  topic: string; // e.g., "Arrays", "Linked List", "Dynamic Programming"
  subTopic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  leetcodeUrl: string;
  takeUForwardUrl?: string;
  youtubeId?: string; // YouTube video ID for Striver's solution
  hints: string[]; // [Hint 1: Intuition, Hint 2: Data Structure, Hint 3: Gotchas]
}

export interface ProblemLog {
  problemId: string;
  completedAt: string; // ISO date string
  timeSpentMinutes: number;
  status: 'CLEAN' | 'HESITANT' | 'BLOCKER';
  perceivedDifficulty: 'Easy' | 'Medium' | 'Hard' | 'Brutal';
  hintsViewedCount: number;
  notes: string; // Markdown notes (e.g., Java-specific gotchas)
  nextReviewDate?: string; // For spaced repetition (ISO date string)
}

export interface UserSettings {
  id?: string;
  targetProblemsPerDay: number;
  startDate: string;
  geminiApiKey?: string;
  preferredLanguage: 'Java';
}

export interface MiniDrill {
  title: string;
  concept: string;
  challenge: string;
  javaCodeSnippet?: string;
}

export interface CoachReport {
  id?: number;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  problemsAnalyzedCount: number;
  executiveDiagnosis: string;
  javaBlindspots: string[];
  pacingRecommendation: {
    action: 'INCREASE' | 'MAINTAIN' | 'SLOW_DOWN';
    rationale: string;
    suggestedDailyTarget: number;
  };
  miniDrills: MiniDrill[];
  rawMarkdown?: string;
}

export interface PacingMetrics {
  streakDays: number;
  totalSolved: number;
  totalProblems: number;
  completionPercentage: number;
  estimatedCompletionDate: string;
  dueForReviewCount: number;
  solvedTodayCount: number;
  todayTarget: number;
  velocityPerDay: number;
}

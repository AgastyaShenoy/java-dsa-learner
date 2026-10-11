import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { CoachReport } from '@/types';

export async function POST(req: NextRequest) {
  let statsPayload: Record<string, unknown> = {};
  try {
    const body = await req.json();
    const { apiKey, stats } = body;
    statsPayload = stats || {};

    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!activeApiKey) {
      // Return a simulated intelligent report based on actual metrics so user can explore without key
      const demoReport = generateHeuristicReport(stats);
      return NextResponse.json({ report: demoReport, isDemo: true });
    }

    const ai = new GoogleGenAI({ apiKey: activeApiKey });

    const prompt = `
You are an elite Senior Staff Engineer and Java Technical Coach auditing a software engineer's progress through Striver's SDE Sheet.
The student is practicing problems on LeetCode and logging their performance, time, hint dependency, and Java takeaways.

Here is the student's 7-Day Performance Dossier:
- Total Solved in Last 7 Days: ${stats.totalSolvedCount}
- Solved Breakdown:
  * Clean (independent): ${stats.cleanCount}
  * Hesitant (hints / debugging / TLE): ${stats.hesitantCount}
  * Blocker (required full editorial / walkthrough): ${stats.blockerCount}
- Average Time Spent: ${stats.avgTimeSpentMinutes} minutes/problem
- Topic Breakdown & Hints Viewed:
${JSON.stringify(stats.topicBreakdown, null, 2)}
- Recorded Java Notes & Gotchas:
${stats.javaNotes.map((n: { title: string; note: string; status: string }) => `* [${n.status}] ${n.title}: "${n.note}"`).join('\n') || 'No specific notes logged yet.'}

Instructions:
Provide a rigorous, constructive diagnostic assessment specifically tailored for a Java-based DSA interview candidate.
You MUST respond with valid JSON matching EXACTLY this structure (no markdown fences, just pure JSON):
{
  "executiveDiagnosis": "A sharp 2-3 sentence executive analysis distinguishing patterns the candidate has mastered versus conceptual bottlenecks where hesitation or blockers accumulate.",
  "javaBlindspots": [
    "3-4 concrete Java syntax, API, memory, or idiomatic blindspots identified from their notes or the topics they hesitated on (e.g., Integer overflow in Math.abs/prefix sums, using ArrayDeque instead of legacy Stack/LinkedList, Object vs primitive array sorting, Sentinel nodes for linked lists, etc.)."
  ],
  "pacingRecommendation": {
    "action": "INCREASE" | "MAINTAIN" | "SLOW_DOWN",
    "rationale": "Clear reasoning why (e.g. if hesitation/blocker ratio is high, recommend slowing down to solidify fundamentals; if clean ratio is >80%, recommend increasing target).",
    "suggestedDailyTarget": 4
  },
  "miniDrills": [
    {
      "title": "Drill 1 Title (e.g., Overflow-Safe Modular Exponentiation or Invariant Preservation)",
      "concept": "Specific DSA/Java concept",
      "challenge": "A targeted 2-sentence micro-exercise or scenario to test their retention.",
      "javaCodeSnippet": "// 4-8 line Java snippet showing the idiomatic pattern or gotcha trap"
    },
    {
      "title": "Drill 2 Title",
      "concept": "Specific DSA/Java concept",
      "challenge": "Targeted micro-exercise.",
      "javaCodeSnippet": "// Java snippet"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '';
    let parsedData;
    try {
      // Clean possible backticks if any
      const cleaned = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      parsedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText, parseError);
      parsedData = generateHeuristicReport(stats);
    }

    const report: CoachReport = {
      createdAt: new Date().toISOString(),
      periodStart: stats.periodStart,
      periodEnd: stats.periodEnd,
      problemsAnalyzedCount: stats.totalSolvedCount,
      executiveDiagnosis: parsedData.executiveDiagnosis,
      javaBlindspots: parsedData.javaBlindspots || [],
      pacingRecommendation: parsedData.pacingRecommendation || {
        action: 'MAINTAIN',
        rationale: 'Steady progress maintained.',
        suggestedDailyTarget: 4
      },
      miniDrills: parsedData.miniDrills || [],
      rawMarkdown: responseText
    };

    return NextResponse.json({ report, isDemo: false });
  } catch (error: unknown) {
    console.error('Error calling Gemini API:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error calling AI Coach';
    return NextResponse.json(
      { error: errMessage, fallbackReport: generateHeuristicReport(statsPayload) },
      { status: 500 }
    );
  }
}

function generateHeuristicReport(stats: Record<string, unknown>): CoachReport {
  const total = Number(stats?.totalSolvedCount) || 0;
  const clean = Number(stats?.cleanCount) || 0;
  const blocker = Number(stats?.blockerCount) || 0;
  const cleanRate = total > 0 ? (clean / total) : 1;

  let pacingAction: 'INCREASE' | 'MAINTAIN' | 'SLOW_DOWN' = 'MAINTAIN';
  let pacingRationale = 'Your current rhythm is balanced. Keep focusing on writing zero-hint solutions.';
  let suggestedTarget = 4;

  if (cleanRate >= 0.8 && total >= 6) {
    pacingAction = 'INCREASE';
    pacingRationale = 'Strong mastery with over 80% clean solves. You have headroom to step up your daily volume.';
    suggestedTarget = 5;
  } else if (blocker >= 3 || cleanRate < 0.4) {
    pacingAction = 'SLOW_DOWN';
    pacingRationale = 'Frequent blockers indicate fundamental gaps in invariant tracking. Slow down to study patterns in depth before writing code.';
    suggestedTarget = 2;
  }

  return {
    createdAt: new Date().toISOString(),
    periodStart: (stats?.periodStart as string) || new Date(Date.now() - 7 * 86400000).toISOString(),
    periodEnd: (stats?.periodEnd as string) || new Date().toISOString(),
    problemsAnalyzedCount: total,
    executiveDiagnosis: total > 0 
      ? `Audit across ${total} recent problem logs reveals steady execution in fundamental Arrays and Linked Lists, with ${clean} clean implementations. Primary friction points occur around edge boundary edge-cases and nested pointer updates.`
      : 'No problem logs detected in the past 7 days. Solve and log at least 3-4 problems to unlock fine-grained pattern recognition and idiomatic Java blindspot analysis.',
    javaBlindspots: [
      'Primitive overflow in accumulator variables: sum of squares or Kadane sum can exceed 2^31 - 1; always prefer `long` for intermediate arithmetic.',
      'Collection API overhead: Avoid using `java.util.Stack` (synchronized overhead); use `Deque<Integer> stack = new ArrayDeque<>()` instead.',
      'Sentinel Dummy Nodes: In linked list reversals and deletions, failing to anchor `ListNode dummy = new ListNode(0, head)` introduces tedious head-null checks.',
      'Array sorting comparator traps: `(a, b) -> a[0] - b[0]` is prone to arithmetic underflow/overflow; prefer `Integer.compare(a[0], b[0])`.'
    ],
    pacingRecommendation: {
      action: pacingAction,
      rationale: pacingRationale,
      suggestedDailyTarget: suggestedTarget
    },
    miniDrills: [
      {
        title: 'Dutch National Flag Invariant Drill',
        concept: 'Three-way partitioning without mid increment on high swap',
        challenge: 'Write the 3-pointer partition loop for 0s, 1s, and 2s in-place. Verify why `mid` is not incremented when swapping with `high`.',
        javaCodeSnippet: `while (mid <= high) {
  if (nums[mid] == 0) swap(nums, low++, mid++);
  else if (nums[mid] == 1) mid++;
  else swap(nums, mid, high--); // Notice: do NOT increment mid!
}`
      },
      {
        title: 'Sentinel Dummy Node List Splicing',
        concept: 'Linked List head deletion / insertion with zero edge branches',
        challenge: 'Refactor a linked list node deletion or merge to use a dummy head node and return `dummy.next`.',
        javaCodeSnippet: `ListNode dummy = new ListNode(0);
ListNode tail = dummy;
while (l1 != null && l2 != null) {
  if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
  else { tail.next = l2; l2 = l2.next; }
  tail = tail.next;
}
tail.next = (l1 != null) ? l1 : l2;
return dummy.next;`
      }
    ]
  };
}

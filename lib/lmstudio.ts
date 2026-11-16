// Server-only helpers for the LM Studio proxy routes.

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
export const DEFAULT_LM_URL = 'http://127.0.0.1:1234/v1';

/**
 * Only allow LM Studio on this machine. Without this, the API routes would let anyone who
 * can reach the dev server make it fetch arbitrary URLs (an open proxy).
 * Set LMSTUDIO_ALLOW_REMOTE=1 to allow another host on your LAN.
 */
export function resolveBaseUrl(raw: unknown): string {
  const value = typeof raw === 'string' && raw.trim() ? raw.trim() : DEFAULT_LM_URL;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`"${value}" is not a valid URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('LM Studio URL must be http(s)');
  if (!LOOPBACK.has(url.hostname) && process.env.LMSTUDIO_ALLOW_REMOTE !== '1') {
    throw new Error(`Refusing non-local host "${url.hostname}". Set LMSTUDIO_ALLOW_REMOTE=1 to allow it.`);
  }
  return url.toString().replace(/\/+$/, '');
}

export interface TutorContext {
  n?: number;
  title?: string;
  module?: string;
  pattern?: string;
  difficulty?: string;
  kind?: 'first' | 'resolve';
  elapsedMinutes?: number;
  revealedHints?: string[];
  triedNotes?: string[];
  solutionUnlocked?: boolean;
  /** Problem already attempted before and no attempt running: free to discuss fully. */
  reviewMode?: boolean;
}

export function tutorSystemPrompt(ctx?: TutorContext): string {
  const base = `You are a Socratic Java DSA tutor for a student working through Striver's 180 problem sheet.
Style: short, direct, one idea per reply. Prefer questions that make the student think over explanations.
Java: modern idioms (ArrayDeque not Stack, Integer.compare in comparators, long for overflow, StringBuilder).
Format: Markdown. Inline math like $O(n \\log n)$ is fine.`;

  if (!ctx?.title) return `${base}\nNo specific problem is attached. Answer general Java and DSA questions helpfully.`;

  const lines = [
    `${base}`,
    ``,
    `Problem: #${ctx.n ?? '?'} ${ctx.title} (${ctx.difficulty ?? ''}; ${ctx.module ?? ''} / ${ctx.pattern ?? ''}).`,
  ];

  if (ctx.solutionUnlocked || ctx.reviewMode) {
    lines.push(
      ctx.reviewMode
        ? `The student has already attempted this problem and is reviewing it. You may explain the full approach, complexity and Java code.`
        : `The student made a real attempt, used both hints and unlocked the solution. You may explain the full approach and show Java code, but walk through the reasoning, not just the code.`,
    );
  } else {
    lines.push(
      `The student is MID-ATTEMPT (${ctx.kind === 'resolve' ? 'a from-scratch re-solve' : 'first attempt'}, ${ctx.elapsedMinutes ?? 0} min in).`,
      `STRICT RULES while mid-attempt:`,
      `- Never write the solution code, pseudocode for the full algorithm, the recurrence, or name the exact trick if it IS the answer.`,
      `- Give at most ONE nudge per reply, phrased as a question or observation. Go no further than the hints already revealed (listed below), plus one small step.`,
      `- If they ask for the answer, say it's locked until they've used both hints and unlocked the solution in the app, then ask what they've tried.`,
      `- Reviewing THEIR approach is fine: point at the bug or the edge case by asking about a specific input, without rewriting their code.`,
      ctx.revealedHints?.length ? `Hints already revealed: ${ctx.revealedHints.map((h, i) => `(${i + 1}) ${h}`).join(' ')}` : `No hints revealed yet.`,
      ctx.triedNotes?.length ? `What they said they tried: ${ctx.triedNotes.join(' | ')}` : '',
    );
  }
  return lines.filter(Boolean).join('\n');
}

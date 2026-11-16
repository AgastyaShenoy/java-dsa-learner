// Builds data/striver180.json (what the app ships) from:
//   data/striver180.raw.json    - scraped sheet (scripts/fetch-striver180.mjs)
//   data/striver180.hints.json  - our own nudge hints, Java notes, link checks, stretch flags
// Bump SHEET_VERSION whenever the output changes so existing installs re-seed the catalogue.
// Usage: node scripts/build-sheet.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const SHEET_VERSION = 1;
const here = p => new URL(`../data/${p}`, import.meta.url);
const raw = JSON.parse(readFileSync(here('striver180.raw.json'), 'utf8'));
const hints = new Map(JSON.parse(readFileSync(here('striver180.hints.json'), 'utf8')).map(h => [h.n, h]));

const tierDifficulty = { basic: 'Easy', core: 'Medium', pro: 'Hard' };
const problems = raw.map(r => {
  const h = hints.get(r.n);
  if (!h) throw new Error(`missing hints for #${r.n} ${r.title}`);
  const leetcodeSlug = h.leetcodeOk ? r.leetcodeSlug : (h.leetcodeFix || null);
  return {
    id: r.tufSlug,
    n: r.n,
    module: r.module,
    pattern: r.pattern,
    title: r.title.replace(/\s+/g, ' ').trim(),
    difficulty: h.difficulty || tierDifficulty[r.tier] || 'Medium',
    tier: r.tier,
    stretch: !!h.stretch,
    leetcodeSlug,
    leetcodePremium: !!(leetcodeSlug && h.leetcodePremium),
    tufUrl: `https://takeuforward.org/practice/dsa/${encodeURIComponent(r.tufSlug).replace(/%27/g, "'")}`,
    tufPremium: !!r.tufPremium,
    youtubeId: r.youtubeId,
    editorialUrl: r.tufBlog ? `https://takeuforward.org${r.tufBlog}` : null,
    hints: [h.hints[0], h.hints[1]],
    javaNote: h.javaNote,
  };
});

const ids = new Set(problems.map(p => p.id));
if (ids.size !== problems.length) throw new Error('duplicate problem ids');

writeFileSync(here('striver180.json'), JSON.stringify({ version: SHEET_VERSION, source: 'https://takeuforward.org/prep-hub/strivers-180-master-dsa-patterns', problems }, null, 1));
const stretch = problems.filter(p => p.stretch).length;
console.log(`wrote ${problems.length} problems (${problems.length - stretch} core, ${stretch} stretch), ${problems.filter(p => !p.leetcodeSlug || p.leetcodePremium).length} practised on takeuforward`);

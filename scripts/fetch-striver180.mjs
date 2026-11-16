// Regenerates data/striver180.raw.json from takeuforward's public "Striver's 180 – Master DSA Patterns" page.
// The page is server-rendered with the whole syllabus embedded in the React Server Components payload,
// so we fetch the HTML, pull out the `sheet_syllabus` blob and flatten it (module > pattern > problem).
// Usage: node scripts/fetch-striver180.mjs
import { writeFileSync } from 'node:fs';

const SHEET_URL = 'https://takeuforward.org/prep-hub/strivers-180-master-dsa-patterns';
const html = await (await fetch(SHEET_URL, { headers: { 'user-agent': 'Mozilla/5.0 (sde-tracker data script)' } })).text();

// 1. Concatenate every RSC chunk: self.__next_f.push([1,"..."])
const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map(m => JSON.parse(m[1]));
const payload = chunks.join('');
const at = payload.indexOf('sheet_syllabus');
if (at < 0) throw new Error('sheet_syllabus not found — page format changed');

// 2. The syllabus sits inside a JSON string, so its quotes are escaped once more.
const s = payload.slice(at + 'sheet_syllabus'.length + 2).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
let depth = 0, inStr = false, esc = false, end = -1;
for (let i = 0; i < s.length; i++) {
  const c = s[i];
  if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
  if (c === '"') { inStr = true; continue; }
  if (c === '{' || c === '[') depth++;
  else if (c === '}' || c === ']') { depth--; if (depth === 0) { end = i; break; } }
}
const syl = JSON.parse(s.slice(0, end + 1)); // { fields: string[][], rows: any[][], roots: number[] }

// 3. Rows are columnar: row[0] picks a field list, the rest are values. Walk the tree from roots.
const toObj = r => Object.fromEntries(syl.fields[r[0]].map((k, i) => [k, r[i + 1]]));
const out = [];
const walk = (ri, path) => {
  const o = toObj(syl.rows[ri]);
  if (o.type === 'item') {
    out.push({
      n: out.length + 1,
      module: path[0],
      pattern: path[1] ?? path[0],
      title: String(o.label).trim(),
      tufSlug: o.slug,
      leetcodeSlug: o.leetcode_link ? o.leetcode_link.replace(/^https?:\/\/leetcode\.com\/problems\//, '').replace(/\/.*$/, '') : null,
      youtubeId: o.yt_video ? (o.yt_video.match(/(?:youtu\.be\/|v=)([\w-]{11})/) || [])[1] ?? null : null,
      tufBlog: o.free_blog_link || null,
      tier: o.difficulty, // basic | core | pro
      tufMinutes: o.duration ? parseInt(o.duration, 10) : null,
      tufPremium: !!o.isPremium,
    });
  } else (o.children || []).forEach(c => walk(c, [...path, String(o.label).trim()]));
};
syl.roots.forEach(r => walk(r, []));

writeFileSync(new URL('../data/striver180.raw.json', import.meta.url), JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} problems`);

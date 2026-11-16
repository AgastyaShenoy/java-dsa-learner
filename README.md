# SDE Tracker — Striver 180 in Java

A local-first practice tracker for [Striver's 180 – Master DSA Patterns](https://takeuforward.org/prep-hub/strivers-180-master-dsa-patterns), built around one method:

1. **Try alone for 25 minutes.** One button opens today's problem on LeetCode (or takeuforward when there's no free LeetCode match) and starts a timer.
2. **Then hints, one at a time.** Hint 1 unlocks after 25 minutes of solo time. Each hint first asks what you've tried. Hints nudge; they don't solve.
3. **The solution only after both hints**, behind an explicit "I made a real attempt" confirm.
4. **Re-solve from scratch 2 days later.** Every first attempt schedules a re-solve. A clean re-solve (no hints) means mastered; anything else comes back in another 2 days.

No daily targets, no streaks, no deadlines. You go at your own pace.

## Features

- **179 problems** in 17 modules (arrays, hashing, binary search, sliding window, recursion, linked lists, stacks, greedy, heaps, trees, BSTs, graphs, DP, tries, strings, bits), grouped by pattern. 21 niche ones (KMP, Kosaraju, Floyd–Warshall…) are marked *stretch* and skipped by "Next up" unless you turn them on.
- **Today view:** one "Open today's problem" button, then due re-solves, what's next and upcoming re-solves, with quiet stats (attempted, mastered, this week).
- **Focus session:** a wall-clock timer that survives reloads, closed tabs and background throttling, pause for breaks, the hint ladder, and minimize to a navbar pill.
- **Floating timer (Chrome / Edge):** Start opens a small always-on-top window (Document Picture-in-Picture) with the timer, pause, hints and finish buttons. Its first button opens LeetCode in its own full-size window, where your normal LeetCode login works. It takes two clicks because Chrome lets one click open only one new window. In other browsers, Start opens LeetCode directly and the timer stays in the app.
- **Full attempt history:** every attempt is its own record, so editing notes never rewrites dates, and attempts can be deleted.
- **Local AI tutor (LM Studio):** in hint-only mode during an attempt it gives one nudge per reply and no code, and it opens up once you've unlocked the solution or are reviewing a problem you've already done.
- **LeetCode contest rating tile** (optional; uses LeetCode's unofficial public API, cached for 6 hours).
- **Backup and restore:** validated JSON import with a confirm step and an automatic backup before anything is replaced.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Data lives in your browser's IndexedDB. Export a backup from **Settings** now and then.

### Desktop app (Windows)

Download `SDE-Tracker-Setup-x.y.z.exe` from [Releases](https://github.com/AgastyaShenoy/java-dsa-learner/releases/latest) and run it. It installs for your user only (no admin prompt). The installer isn't code-signed, so Windows SmartScreen may warn you: click **More info → Run anyway**.

- **Updates:** the app checks GitHub Releases on launch and every 6 hours, downloads a new version in the background, and offers to restart. Your progress is kept.
- **Start** opens the problem in your normal browser (where you're logged in to LeetCode) and a small always-on-top timer window, with pause, hints and the finish buttons.
- **Your data** is the app's own, separate from the browser version. To move it over, use **Settings → Export backup** in the browser, then **Restore from backup** in the app.

How it's built: `electron/main.js` starts the Next.js app's standalone server (`output: "standalone"`) on `127.0.0.1:31780` with Electron's own Node, and opens a window on it. The port is fixed because IndexedDB is tied to the origin. `electron/preload.js` exposes a small `window.desktop` bridge: open a link in the browser, open or close the timer window, and finish the attempt from it. Updates use `electron-updater` with the GitHub provider.

```bash
npm run desktop:dev   # Electron window on top of `next dev`
npm run dist          # build the installer into release/ (no upload)
GH_TOKEN=... npm run release   # build and publish a GitHub release (bump "version" first)
```

### Local AI (optional)

Install [LM Studio](https://lmstudio.ai/), load a coding model (e.g. Qwen2.5-Coder-7B-Instruct), and start the server from **Developer → Start Server** (default `http://127.0.0.1:1234/v1`). For safety the app only talks to LM Studio on this machine. To use another host on your LAN, start the app with `LMSTUDIO_ALLOW_REMOTE=1`.

## Look

Styled with the shared "Spray & Paper" design language (`home base/design-language.md`, v1.2). The page is a pure black desk (OLED-friendly) with everything printed straight onto it in paper-white ink. Paper only appears as small textured scraps: number tags, a sticky note for the attempt in progress, and masking tape.

The controls are desk objects:
- **Main action:** Dymo label tape.
- **Secondary actions:** strips of masking tape.
- **Choices:** circled in pink marker.
- **Current tab:** a yellow highlighter swipe.
- **Icon buttons:** turn into round stickers on hover.

Hints start as dashed outlines and fill in as they unlock. There's also a newsprint light theme (Settings → Look).

Fonts are self-hosted from npm: Mona Sans, Open Runde and JetBrains Mono. The spray font, Sister Spray, is free for personal use only, so it's never shipped: the app uses it when it's installed on the machine, and otherwise the spray headings fall back to heavy, wide Mona Sans.

## How it works

```
app/page.tsx                 client-only entry (IndexedDB is browser-only)
components/AppShell.tsx      live Dexie queries -> derived state -> views
lib/db.ts                    Dexie schema (v2: problems, attempts, settings, kv) + v1 migration, backup/restore
lib/progress.ts              pure scheduling: phase, next re-solve day, today's plan, stats
lib/session.ts               focus session: wall-clock timer, hint gate, practice window
lib/float.ts                 floating timer (Document Picture-in-Picture) helpers
lib/theme.ts                 dark / light theme choice (localStorage, set before first paint)
lib/dates.ts                 LOCAL calendar days (never UTC; IST would roll over at 05:30)
lib/lmstudio.ts              LM Studio URL allow-list + tutor system prompt
app/api/local-ai/*           streaming proxy to LM Studio (aborts propagate)
app/api/leetcode/rating      contest rating from LeetCode GraphQL
data/striver180.json         the shipped catalogue (built, don't edit by hand)
scripts/fetch-striver180.mjs re-scrapes the sheet -> data/striver180.raw.json
scripts/build-sheet.mjs      raw + data/striver180.hints.json -> data/striver180.json
```

**Data flow:** the only stored progress is the append-only `attempts` table. Each problem's state (new, learning or mastered, plus its next re-solve day) is computed from its attempts on every render, so there's no second copy to drift out of sync. The UI subscribes with `useLiveQuery`, so any write re-renders every view, and `useToday()` re-computes at local midnight and whenever the tab becomes visible again.

**Updating the sheet:** run `node scripts/fetch-striver180.mjs`, update `data/striver180.hints.json` for any new problems, bump `SHEET_VERSION` in `scripts/build-sheet.mjs`, then run `node scripts/build-sheet.mjs`. Existing installs re-seed the catalogue on next load. Attempts are untouched.

## Credits

Problem selection, ordering, videos and editorials: [Striver / takeUforward](https://takeuforward.org/). Hints and Java notes in `data/striver180.hints.json` are original to this project. Not affiliated with takeUforward or LeetCode.

MIT licensed.

# Home Base status file

The desktop app writes `home base\apps\dsa\status.json` for the Home Base app to read. The tracker is its only writer; Home Base only reads it. It is rewritten (atomically: temp file, then rename) about a second after anything changes: an attempt is logged, edited or deleted, a hint is revealed, a session starts or ends, the day rolls over, or the app starts. Identical snapshots aren't rewritten.

- **Where:** `Documents\antigravity projects\home base` (set `HOME_BASE_DIR` to override). If that folder doesn't exist, nothing is written. Only the packaged app writes, since `npm run desktop:dev` has its own, different data.
- **Browser version:** doesn't write anything, because a web page can't write files.
- **Size:** kept under 450 KB (Home Base skips files over 512 KB). If the history ever outgrows that, the least recently worked problems are left out of `problems` and counted in `problemsOmitted`.
- **Builder:** `lib/homebase.ts` builds it; `electron/main.js` (`writeHomeBaseStatus`) writes it.

## Fields

| Field | Meaning |
|---|---|
| `schema`, `app`, `updatedAt` | `1`, `"dsa"`, and the local time with offset (`2026-11-16T22:05:04+05:30`) |
| `attempted`, `mastered`, `learning` | problems tried at least once / mastered (clean re-solve) / still in rotation |
| `total`, `coreTotal` | 179 in the sheet / those that aren't *stretch* |
| `doneToday`, `doneThisWeek`, `activeDaysThisWeek` | attempts logged today / since Monday, and on how many days |
| `next` | the next new problem: `{ id, n, title, url, module, pattern, difficulty }`, or `null` |
| `resolves` | every pending re-solve, soonest first: `{ id, n, title, url, due }` (`due` is `YYYY-MM-DD`; on or before today means due) |
| `session` | the attempt in progress, or `null` (see below) |
| `problems` | every attempted problem, most recently worked first, with its full history (see below) |
| `problemsOmitted` | how many were left out for size (normally 0) |
| `links` | `"Open tracker"` (only works while the app is open), `"Striver's 180"`, and `"LeetCode"` (your profile, when a username is set in Settings) |

`url` is where you practise the problem: LeetCode when there's a free exact match, otherwise takeuforward.

### `session`

`{ id, n, title, url, kind, startedAt, paused, minutesSoFar, hints, solutionRevealed }`

- `kind` is `"first"` or `"resolve"`.
- `minutesSoFar` is the active (unpaused) time at the moment of writing.
- `hints` holds the hints revealed so far (see the hint entry below).

### `problems[]`

`{ id, n, title, module, pattern, difficulty, url, leetcode, phase, nextResolveDay, javaNote, attempts }`

- `phase` is `"learning"` or `"mastered"`.
- `javaNote` is the problem's Java pitfall. The app shows it once an attempt is logged.
- Each entry in `attempts` (oldest first) is:
  `{ kind, day, at, status, minutes, hintsUsed, sawSolution, hints, note }`
  - `status`: `CLEAN` means no hints. `HESITANT` means solved with hints or shaky. `BLOCKER` means it needed the solution or wasn't solved.
  - `note`: the final note (what you missed, the key idea).

A hint entry, used in `session.hints` and `attempts[].hints`, is `{ n, hint, tried }`:
- `n`: 1 or 2.
- `hint`: the hint text that was shown.
- `tried`: what you wrote you'd tried before asking for it.

Attempts logged before 0.2.1 kept those "tried" notes inside the notes as `Before hint N: …` lines. They're split back out into `hints[].tried` and `note`.

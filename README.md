# SDE Tracker: Java Edition (v0.1-beta)

<p align="center">
  <strong>The high-velocity, distraction-free companion app for conquering Striver's SDE Sheet (180+ problems) in Java.</strong><br>
  Built with Next.js 15, pitch-black Cursor aesthetics, an in-app multi-pane solver, PiP video editorials, and offline LM Studio AI tutoring.
</p>

<p align="center">
  <a href="https://github.com/AgastyaShenoy/java-dsa-learner/releases/tag/v0.1-beta"><img src="https://img.shields.io/badge/release-v0.1--beta-white?style=flat-square" alt="Version"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15.5.25-black?style=flat-square&logo=next.js" alt="Next.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-black?style=flat-square&logo=typescript" alt="TypeScript"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-black?style=flat-square&logo=tailwindcss" alt="Tailwind CSS"></a>
  <a href="https://dexie.com/"><img src="https://img.shields.io/badge/Storage-Dexie.js_(IndexedDB)-black?style=flat-square" alt="Dexie.js"></a>
  <a href="https://lmstudio.ai/"><img src="https://img.shields.io/badge/Local_AI-LM_Studio-black?style=flat-square" alt="LM Studio"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-black?style=flat-square" alt="License"></a>
</p>

---

## 💡 Why SDE Tracker?

Grinding Data Structures & Algorithms for software engineering interviews often leads to **cognitive fragmentation**:
1. You open LeetCode in one tab, Striver's video editorial in another, an IDE in a third, and ChatGPT in a fourth.
2. Constant alt-tabbing ruins deep work, breaks your mental invariant models, and causes friction in tracking pacing.
3. Spreadsheets and static checklists lack real-time solve telemetry, stopwatch automation, spaced repetition, and Java-specific edge-case warnings.

**SDE Tracker** solves this by unifying your entire preparation workflow into a single, cohesive, pitch-black workspace.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SDE TRACKER WORKSPACE                                 │
├──────────────────────────────────────┬──────────────────────────────────────────┤
│         IN-APP LEETCODE SOLVER       │         AUXILIARY COPILOT PANE           │
│                                      │                                          │
│  - Problem Statement                 │  [Scratchpad] [Hints] [Video] [Local AI] │
│  - Integrated Code Editor            │                                          │
│  - Direct Submission Engine          │  • Tier 1: Core Mathematical Invariant   │
│  - Monospace Stopwatch Timer         │  • Tier 2: Algorithmic Blueprint         │
│    (00:24:15 · [Pause] [+5m] [Reset])│  • Tier 3: Java Gotchas (long, Deque)    │
│                                      │  • Floating PiP Video Walkthrough        │
│                                      │  • Local LM Studio Markdown Assistant    │
├──────────────────────────────────────┴──────────────────────────────────────────┤
│  POST-SOLVE: 10s Reflection -> Auto-Forward Time -> 3-Day Spaced Repetition     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features at a Glance

### 1. In-App Multi-Pane Solver
- **Zero Alt-Tabbing**: Embeds LeetCode problems directly into a flexible split-view modal.
- **Adjustable Pane Presets**: Toggle between **50:50 Balanced**, **60:40 Widescreen**, or **Full Screen Focus** with smooth layout transitions.
- **Embedded Stopwatch**: Track solve duration in real time with quick Pause/Resume, Reset, and `+5m` bump controls. Elapsed minutes are automatically forwarded to your post-solve reflection log.
- **Iframe Bypass Handling**: Built-in intelligent detection for LeetCode's security headers, providing 1-click fallback and direct deep links.

### 2. Picture-in-Picture (PiP) Video Walkthroughs
- **Floating Video Player**: Detach Striver's YouTube editorial into a draggable, minimizable corner player while keeping LeetCode and your scratchpad active.
- **Privacy-Enhanced Embeds**: Streams via `youtube-nocookie.com` with strict referrer policies and direct external fallbacks.

### 3. Offline Local AI Tutor (LM Studio)
- **100% Private & Free**: Streams responses directly from your local hardware using [LM Studio](https://lmstudio.ai/) (`http://127.0.0.1:1234/v1`).
- **Context-Aware Prompts**: Automatically injects current problem details, difficulty, tags, and Java requirements into the conversation.
- **Mathematical LaTeX & Syntax Highlighting**:
  - Full **KaTeX** math engine renders complexities like $\mathcal{O}(N \log N)$ and space bounds $\Omega(K)$.
  - **Prism.js** token highlighting with one-click copy for Java, Python, C++, and pseudocode.
- **Quick Action Chips**: One-click prompts for *"Explain Invariant"*, *"Java Pitfalls"*, *"Optimize Space"*, and *"Step-by-step Dry Run"*.

### 4. 3-Tier Progressive Hints & Java Gotchas
- **Tier 1 (Core Intuition)**: High-level mathematical perspective without spoiling implementation details.
- **Tier 2 (Algorithm & Data Structure)**: Optimal two-pointer, monotonic stack, DP transition, or graph representation.
- **Tier 3 (Java Gotchas & Edge Cases)**: Critical Java-specific edge cases:
  - Primitive integer overflow: casting `(long) a * b` vs `long sum = a * b`.
  - Preferring `ArrayDeque` over legacy synchronized `java.util.Stack`.
  - `PriorityQueue` comparator subtraction overflow (`(a, b) -> a - b` vs `Integer.compare(a, b)`).
  - String manipulation overhead (`StringBuilder` vs immutability bottlenecks).

### 5. 10-Second Post-Solve Reflection & Spaced Repetition
- Prompted immediately after completing a problem.
- Automatically captures elapsed time from the stopwatch.
- Logs difficulty perception: `Trivial`, `Clean`, `Hesitant`, or `Blocker`.
- **Automated Spaced Repetition**: Problems rated `Hesitant` or `Blocker` are automatically scheduled for a mandatory 3-day spaced review in your daily mission queue.
- Lightweight confetti animation celebrates completed milestones.

### 6. Mission Control & Dynamic Pacing
- **Dynamic Daily Targets**: Adjust daily problem quotas on the fly (`[-]` / `[+]`).
- **Pacing Telemetry**: Visual velocity charts, streak trackers, completion percentages, and estimated finish dates.
- **Review Queue**: Dedicated priority queue for spaced repetition and flagged problems.

### 7. Interactive Striver's Sheet Roadmap
- Complete **180+ problems** across all 26 topics (Arrays, Linked Lists, Greedy, Binary Trees, BST, Graphs, Dynamic Programming, Trie, Strings).
- Instant search and multi-criteria filters (by difficulty, status, day, or keyword).

### 8. Cloud AI Coach (Optional Gemini 2.5 Flash)
- Automated weekly diagnostics analyzing solve velocity, difficulty distribution, and streak health.
- Identifies Java architectural blind spots and generates actionable calibration recommendations.

### 9. Local-First & Zero Setup
- **100% Client-Side Storage**: Backed by **Dexie.js (IndexedDB)**.
- No remote database, no account creation, and no subscription fees.
- Full **Export / Import JSON** feature to easily backup and migrate your progress across machines.

---

## 🎨 Design Philosophy: Pitch-Black Cursor UI

SDE Tracker embraces the design language of the **Cursor IDE / Cursor website**:
- **Pure Black Canvas**: `#000000` pitch-black backgrounds for minimal OLED power consumption and zero eye strain.
- **Subtle Surface Hierarchy**: Soft zinc borders (`#27272a` / `#18181b`) and layered translucent backdrops (`bg-zinc-950/80 backdrop-blur-md`).
- **Precision Typography**: Clean geometric typography using `Geist Sans`, `Inter`, and `JetBrains Mono`.
- **Restrained Color Palette**: Intentional, functional color accents (Emerald for solves, Amber for reviews, Violet for AI assistance) without visual clutter.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.5 (App Router) | High-performance React 19 architecture with Server & Client components |
| **Language** | TypeScript 5+ | End-to-end type safety for problem metadata, solve records, and telemetry |
| **Styling** | Tailwind CSS v4 | Utility-first styling with custom Cursor pitch-black tokens |
| **Local Database** | Dexie.js 4.0 (IndexedDB) | Reactive, zero-latency browser storage via `dexie-react-hooks` |
| **Local AI** | LM Studio (OpenAI API spec) | Offline LLM inference with Server-Sent Events (SSE) streaming |
| **Cloud AI** | Google Gemini 2.5 Flash SDK | Deep diagnostic problem analysis and weekly training reviews |
| **Syntax Highlighting**| Prism.js | High-fidelity multi-language code block rendering |
| **Math Engine** | KaTeX + Rehype / Remark | High-speed LaTeX formula rendering for algorithmic complexities |
| **Icons & FX** | Lucide React + Canvas Confetti | Minimalist SVG iconography and milestone celebrations |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.18+` or `v20+` / `v24+` installed ([Download Node.js](https://nodejs.org/))
- **npm** or **pnpm** / **yarn**

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/AgastyaShenoy/java-dsa-learner.git
cd java-dsa-learner

# Install dependencies
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app is ready to use immediately—no database setup or sign-in required!

### 3. Production Build

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

---

## 🤖 Setting Up Local AI (LM Studio)

You can run your AI tutor completely offline with zero API costs:

```
┌──────────────┐          HTTP / SSE           ┌────────────────────────┐
│  SDE Tracker │ ────────────────────────────> │  LM Studio             │
│  (Next.js)   │ <──────────────────────────── │  (http://127.0.0.1:1234)│
└──────────────┘    Real-time Token Stream     └────────────────────────┘
```

1. **Install LM Studio**: Download from [lmstudio.ai](https://lmstudio.ai/) (macOS, Windows, or Linux).
2. **Download a Recommended Coding Model**:
   - `Qwen2.5-Coder-7B-Instruct` (Recommended: outstanding for Java DSA & complexity proofs)
   - `DeepSeek-R1-Distill-Qwen-7B` / `8B` (Exceptional step-by-step reasoning)
   - `Meta-Llama-3.1-8B-Instruct`
3. **Start the Local Server**:
   - Click the **Developer / Local Server** tab (`<->` icon on the left).
   - Select your downloaded model and click **Start Server**.
   - Default port is `1234` (`http://127.0.0.1:1234`).
4. **Chat**:
   - Open SDE Tracker and click the **Local AI** tab in the top navigation or within the solver modal.
   - The indicator will display `Local Live` with a green badge. You're ready to chat!

---

## ⚙️ Optional Cloud AI: Gemini 2.5 Flash Coach

To enable automated weekly diagnostic coaching reports via Google Gemini:

1. Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Click the **Settings** gear icon in the SDE Tracker navbar.
3. Paste your API key into the **Gemini API Key** field and click **Save Settings** (stored securely in local IndexedDB).
4. Alternatively, add it to `.env.local`:
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY="your_api_key_here"
   ```

---

## 📂 Project Directory Structure

```text
java-dsa-learner/
├── app/
│   ├── api/
│   │   ├── ai-coach/route.ts      # Cloud Gemini diagnostic endpoint
│   │   └── local-ai/route.ts      # LM Studio proxy & SSE streaming handler
│   ├── globals.css                # Cursor pitch-black styling & KaTeX/Prism imports
│   ├── layout.tsx                 # Root layout with font definitions & metadata
│   └── page.tsx                   # Main entry point mounting AppShell
├── components/
│   ├── AICoach/                   # Weekly diagnostic reports & AI coach view
│   ├── EmbeddedLeetCode/
│   │   └── EmbeddedLeetCodeModal.tsx # Multi-pane solver, stopwatch, PiP & hints
│   ├── LocalAI/
│   │   ├── LocalAIChatDrawer.tsx  # Slide-over chat drawer with prompt chips
│   │   └── MarkdownRenderer.tsx   # KaTeX LaTeX math & Prism.js syntax renderer
│   ├── MissionControl/            # Target header, queue cards, velocity telemetry
│   ├── PostSolveModal/            # 10s reflection modal with spaced repetition
│   ├── ResourceDrawer/            # 3-tier hints & Java gotchas drawer
│   ├── Roadmap/                   # 180+ problems interactive sheet view
│   ├── AppShell.tsx               # Main app state coordinator
│   ├── Navbar.tsx                 # Navigation bar, streak badge & status indicators
│   └── SettingsModal.tsx          # Export/Import JSON & API configuration
├── data/
│   └── striverSheet.json          # Curated 180+ Striver SDE problems dataset
├── lib/
│   ├── db.ts                      # Dexie.js IndexedDB schema & CRUD operations
│   └── gemini.ts                  # Gemini 2.5 Flash client setup
├── types/
│   └── index.ts                   # TypeScript interfaces (Problem, Solve, Target)
├── LICENSE                        # MIT License
├── package.json
└── README.md
```

---

## 💾 Data Backup & Portability

Your data is stored 100% locally in your browser's IndexedDB. To ensure your progress is never lost:
- Open **Settings** (gear icon in the top right).
- Click **Export Backup (JSON)** to download a complete snapshot of your solves, notes, and targets.
- To restore or transfer to a different computer or browser, click **Import Backup (JSON)**.

---

## 🗺️ Roadmap & Upcoming Milestones

- [x] **v0.1-beta**: Initial release with multi-pane solver, PiP video, LM Studio integration, KaTeX math, Prism syntax highlighting, and local Dexie persistence.
- [ ] **v0.2**: Offline Java syntax linter and interactive code execution runner.
- [ ] **v0.3**: Anki deck (.apkg) export for spaced repetition cards.
- [ ] **v0.4**: Peer challenge rooms and collaborative whiteboard mode.

---

## 🤝 Contributing

Contributions, feedback, and issue reports are very welcome!
1. Fork the Project: `git checkout -b feature/AmazingFeature`
2. Commit your Changes: `git commit -m 'feat: Add some AmazingFeature'`
3. Push to the Branch: `git push origin feature/AmazingFeature`
4. Open a **Pull Request**.

---

## 📜 License & Disclaimers

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

> *Disclaimer: Problem descriptions, curation, and video tutorials are attributed to [Striver (Take U Forward)](https://takeuforward.org/) and [LeetCode](https://leetcode.com/). This open-source companion tool is independently developed to improve study productivity.*

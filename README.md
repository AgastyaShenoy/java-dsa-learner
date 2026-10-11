# SDE Tracker: Java Edition (v0.1-beta)

> High-productivity companion app tailored for working through **Striver's SDE Sheet** (180+ problems). Designed with the minimalist **Cursor website** dark aesthetic, local-first browser persistence, an in-app multi-pane solver, and local LM Studio AI assistance.

![Version](https://img.shields.io/badge/version-v0.1--beta-white?style=flat-square)
![Stack](https://img.shields.io/badge/framework-Next.js%2015%20App%20Router-black?style=flat-square&logo=next.js)
![Language](https://img.shields.io/badge/language-TypeScript%20%7C%20Java-black?style=flat-square)
![Styling](https://img.shields.io/badge/styling-Tailwind%20CSS-black?style=flat-square&logo=tailwindcss)
![Storage](https://img.shields.io/badge/storage-Dexie.js%20(IndexedDB)-black?style=flat-square)
![AI](https://img.shields.io/badge/AI-LM%20Studio%20%2B%20Gemini%202.5%20Flash-black?style=flat-square)

---

## ⚡ Highlights & Key Capabilities

- **Mission Control (Daily Dashboard)**: Dynamic daily target quota with instant `[-]` / `[+]` adjustments, real-time pacing telemetry, streak tracking, and velocity completion forecasting.
- **In-App Multi-Pane Solver**: Solve LeetCode problems directly inside the workspace without losing context.
  - **Draggable Split Panes**: Side-by-side view with LeetCode on the left and Java Scratchpad / Hints / Video / AI on the right (`50:50`, `60:40`, or full screen).
  - **Solving Stopwatch**: Monospace elapsed timer with Play/Pause, Reset, and +5m controls, auto-forwarding elapsed minutes to the solve logger.
  - **Picture-in-Picture (PiP) Video Mode**: Detach Striver's video walkthrough into a floating, minimizable corner player while writing code.
- **3-Tier Progressive Hints**: Reveal intuition, optimal invariants, and Java-specific gotchas (`long` overflow, `ArrayDeque` vs `Stack`, comparator subtleties) step-by-step.
- **10-Second Post-Solve Logger**: Record difficulty, elapsed time, and takeaways with automated 3-day spaced repetition for hesitant/blocker solves.
- **Local LM Studio AI Companion**:
  - Connects to your local LM Studio instance (`http://127.0.0.1:1234/v1`).
  - Real-time SSE Markdown token streaming.
  - **KaTeX LaTeX Math**: Full rendering for mathematical complexity like $O(N \log N)$ and $\Omega(1)$.
  - **Prism.js Syntax Highlighting**: IDE-grade syntax highlighting for Java, Python, C++, etc.
  - **Attached Problem Context**: 1-click prompt chips for optimal invariants and edge cases tailored to the active problem.
- **Gemini 2.5 Flash Progress Coach**: Weekly automated diagnostics analyzing your solve patterns, Java blindspots, and pacing calibration.
- **Local-First & Zero Config**: Runs 100% in the browser using Dexie.js (IndexedDB). Your code, notes, logs, and API keys never leave your machine.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Client Components, Server-Sent Events)
- **Styling**: Tailwind CSS + Pitch-Black (`#000000`) Cursor aesthetic
- **Typography**: `Inter` (sans-serif) & `JetBrains Mono` (code & metrics)
- **Database**: Dexie.js (IndexedDB local database)
- **Math & Markdown**: `react-markdown`, `remark-math`, `rehype-katex`, `katex`, `prismjs`
- **AI Integrations**:
  - Local AI: LM Studio OpenAI-compatible local server (`/v1/chat/completions`)
  - Cloud Coach: Google Gemini 2.5 Flash (`@google/genai` SDK)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18+ (tested on Node v20/v24)
- (Optional) [LM Studio](https://lmstudio.ai/) for offline local AI tutoring

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/java-dsa-learner.git
cd java-dsa-learner

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Configuring Local AI (LM Studio)

1. Open **LM Studio** and download an instruct model (e.g., `Meta-Llama-3.1-8B-Instruct`, `Qwen2.5-Coder-7B`, or `DeepSeek-R1-Distill`).
2. Go to the **Local Server** tab (developer icon on the left).
3. Click **Start Server** (default: `http://127.0.0.1:1234`).
4. In SDE Tracker, open **Local AI** from the navbar or right tab. The status indicator will turn green (`Local Live`).

---

## 📦 Building for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

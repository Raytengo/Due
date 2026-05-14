<div align="center">

<img src="icon_design.png" width="120" alt="Due" />

# Due

**A Canvas dashboard that actually tells you what to do next.**

Due is a Chrome extension that syncs with any Canvas LMS and shows all your assignments, deadlines, and grade weights in one clean dashboard — with optional AI analysis to break down exactly what each assignment requires.

</div>

---

## What it does

Canvas is cluttered. Due strips it down to what matters.

Open the **popup** for a 7-day snapshot of upcoming deadlines. Open the **dashboard** for the full picture — every course, every assignment, color-coded by urgency, with grade weights and a built-in grade calculator.

If Canvas doesn't provide grade weights for a course, the optional **AI analysis** can read the course syllabus and automatically extract the grading breakdown for you.

---

## Features

| | |
|---|---|
| **7-day popup** | Click the extension icon for an instant view of what's due this week |
| **Dashboard** | All courses and assignments in one place, sorted by urgency |
| **Urgency color coding** | Orange ≤7 days · Yellow 8–30 days · Blue 30+ days · Purple for exams |
| **Grade weights** | Per-course breakdown of assignment groups and their weights |
| **Grade calculator** | Enter scores to get a live weighted total |
| **Syllabus analysis** | AI reads your syllabus and extracts grade weight breakdowns |
| **Claude usage** | Live usage % and reset countdown shown in the popup |
| **Smart filtering** | Filter by type (assignment / exam), hide submitted items |
| **Course renaming** | Set a custom display name for any course — stored locally |
| **Dark mode** | Persisted across sessions |
| **Multi-language** | Traditional Chinese · Simplified Chinese · English |

---

## Works with any Canvas school

Due uses your browser's existing Canvas login session — no API tokens or account setup required. If your school runs Canvas and you're already logged in, it works.

---

## Installation

1. Clone or download this repo
2. Go to `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `extension/` folder
5. Log in to Canvas — Due syncs automatically on your next visit
6. Click the extension icon → **Open Dashboard**

---

## AI analysis setup

1. Click the extension icon → settings gear ⚙
2. Choose a provider (Gemini, Qwen, or DeepSeek) and paste your API key
3. Open any course in the dashboard and click **Analyze Weights**

**Supported providers:** Gemini · Qwen · DeepSeek

---

## Design

Built on Anthropic's design language — warm off-white backgrounds, Source Serif 4 headings, DM Sans body, DM Mono for labels. Full light/dark mode.

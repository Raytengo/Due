# Canvas Dashboard

A Chrome extension for HKUST(GZ) students that pulls course data from Canvas LMS and displays all assignments, deadlines, grade weights, and AI-powered analysis in a clean dashboard — so you always know what to do, how to do it, and when it's due.

<img src="icon_design.png" width="180" alt="Canvas Dashboard icon" />

---

## Features

- **7-day popup** — click the extension icon for an instant view of everything due in the next 7 days
- **Card grid overview** — one card per course, 3 assignments per page with pagination
- **This-week panel** — all upcoming assignments grouped by urgency (≤7d / 8–30d / 30d+) with a pie chart
- **Course detail view** — click any card to see the full assignment list, grade weight breakdown, and grade calculator
- **Syllabus analysis** — AI reads the course syllabus to extract grade weight components when Canvas doesn't provide them
- **AI assignment analysis** — powered by Claude, Gemini, OpenAI, DeepSeek, Qwen, Moonshot, Zhipu, or MiniMax; generates summaries, requirements, estimated hours, and milestone plans
- **Course renaming** — click the pencil icon on any course detail to set a custom display name (stored locally, never sent to Canvas)
- **Smart filtering** — filter by assignments or exams; toggle submitted items
- **Attendance auto-exclusion** — attendance/participation items are permanently hidden
- **Urgency color coding** — orange (≤7 days), warm yellow (8–30 days), blue (30+ days), purple (exams)
- **Dark mode** — persisted across sessions
- **Grade calculator** — enter scores per assignment group and get a live weighted total
- **Multi-language UI** — Traditional Chinese, Simplified Chinese, English

---

## Why this exists

HKUST(GZ) does not allow students to generate Personal Access Tokens for the Canvas API. This extension borrows the browser's existing login session (cookie) to call the Canvas API directly — no token setup required.

---

## Installation

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `extension/` folder
5. Log in to [canvas.hkust-gz.edu.hk](https://hkust-gz.instructure.com) — the extension will sync automatically on your next visit
6. Click the extension icon → **Open Dashboard**

---

## Project structure

```
canvas-dashboard/
├── extension/
│   ├── manifest.json          # Manifest V3 config
│   ├── background.js          # Service worker — Canvas API sync, AI analysis & storage
│   ├── popup.html / popup.js  # Extension popup — 7-day task quick-view
│   ├── settings.html / .js    # AI API key & model configuration
│   └── dashboard/
│       ├── index.html         # Main dashboard UI & styles
│       └── dashboard.js       # Rendering, filtering, i18n, navigation logic
```

---

## Canvas API endpoints used

```
GET /api/v1/courses?enrollment_state=active&per_page=50
GET /api/v1/courses/:id/assignments?per_page=50&include[]=submission
GET /api/v1/courses/:id/assignment_groups?include[]=assignments&include[]=group_weight
GET /api/v1/courses/:id/files?per_page=50
GET /api/v1/courses/:id/discussion_topics?only_announcements=true&per_page=50
GET /api/v1/courses/:id?include[]=syllabus_body
GET /courses/:id/assignments/syllabus  (web page fallback for syllabus PDF extraction)
```

Data is cached in `chrome.storage.local` and refreshed automatically when you visit Canvas.

---

## AI analysis setup

1. Click the extension icon → settings gear (⚙)
2. Choose your AI provider and paste your API key
3. Click **AI Analyze** on any assignment to generate an analysis
4. Click **Analyze Grades** on any course detail to extract grade weights from the syllabus

**Supported providers:** Gemini (default), Claude (Anthropic), OpenAI, DeepSeek, Qwen, Moonshot, Zhipu, MiniMax

---

## Design

Follows Anthropic's brand design language — warm off-white backgrounds, Source Serif 4 headings, DM Sans body text, DM Mono for labels and numbers. Full light/dark mode support.

---

## Roadmap

- [x] Canvas API sync (courses, assignments, grade weights)
- [x] Dashboard card grid with pagination
- [x] In-page course detail view with View Transitions animation
- [x] AI assignment analysis (8 providers)
- [x] Syllabus PDF analysis for grade weight extraction
- [x] Grade calculator
- [x] Dark mode
- [x] Multi-language UI (zh-TW / zh-CN / en)
- [x] Course custom display names
- [x] 7-day popup task list
- [ ] PDF auto-download and parsing for all providers
- [ ] Smarter milestone scheduling
- [ ] Grade prediction

---

## Development notes

- After editing any file in `extension/`, reload the extension at `chrome://extensions`
- `background.js` is a Service Worker — no access to `window` or `document`
- Canvas API returns dates in ISO 8601 (`2026-03-15T23:59:59Z`) — `formatDue()` handles locale-aware display
- Always add `per_page=50` to API calls to reduce pagination overhead
- View Transition named elements in the course card→detail morph: `course-shell`, `course-code`, `course-name`, `course-badge`, `course-meta`
- Any element inside `.detail-name` that participates in layout (e.g. `display: inline-flex`) will change the captured bounding box and distort the View Transition — keep such elements `position: absolute`

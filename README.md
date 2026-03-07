# Canvas Dashboard

A Chrome extension for HKUST(GZ) students that pulls course data from Canvas LMS and displays all assignments, deadlines, grade weights, and AI-powered analysis in a clean dashboard — so you always know what to do, how to do it, and when it's due.

![Light and dark mode support](icon_design.png)

---

## Features

- **Card grid overview** — one card per course, 3 assignments per page with pagination
- **This-week panel** — all upcoming assignments due within 7 days, sorted by urgency
- **Course detail view** — click any card to see the full assignment list, grade weight breakdown, and grade calculator
- **AI assignment analysis** — powered by Claude or Gemini; generates summaries, requirements, estimated hours, and milestone plans
- **Smart filtering** — filter by assignments or exams; toggle submitted items
- **Attendance auto-exclusion** — attendance/participation items are permanently hidden
- **Urgency color coding** — orange (≤7 days), warm yellow (8–30 days), blue (30+ days), purple (exams)
- **Dark mode** — persisted across sessions
- **Grade calculator** — enter scores per assignment group and get a live weighted total

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
│   ├── background.js          # Service worker — Canvas API sync & storage
│   ├── popup.html / popup.js  # Extension popup (sync status + quick actions)
│   ├── settings.html / .js    # AI API key configuration
│   └── dashboard/
│       ├── index.html         # Main dashboard UI
│       └── dashboard.js       # Rendering, filtering, navigation logic
└── dashboard/                 # Standalone dashboard (development reference)
```

---

## Canvas API endpoints used

```
GET /api/v1/courses?enrollment_state=active&per_page=50
GET /api/v1/courses/:id/assignments?per_page=50&include[]=submission
GET /api/v1/courses/:id/assignment_groups?include[]=assignments&include[]=group_weight
GET /api/v1/courses/:id/files?per_page=50
```

Data is cached in `chrome.storage.local` and refreshed automatically when you visit Canvas.

---

## AI analysis setup

1. Click the extension icon → settings gear
2. Choose model: **Claude** (Anthropic) or **Gemini** (Google)
3. Paste your API key
4. Click **AI 分析** on any assignment to generate an analysis

---

## Design

Follows Anthropic's brand design language — warm off-white backgrounds, Source Serif 4 headings, DM Sans body text, DM Mono for labels and numbers. Full light/dark mode support.

---

## Roadmap

- [x] Canvas API sync (courses, assignments, grade weights)
- [x] Dashboard card grid with pagination
- [x] In-page course detail view
- [x] AI assignment analysis (Claude + Gemini)
- [x] Grade calculator
- [x] Dark mode
- [ ] PDF auto-download and parsing
- [ ] Smarter milestone scheduling
- [ ] Grade prediction

---

## Development notes

- After editing any file in `extension/`, reload the extension at `chrome://extensions`
- `background.js` is a Service Worker — no access to `window` or `document`
- Canvas API returns dates in ISO 8601 (`2026-03-15T23:59:59Z`) — convert timezone before display
- Always add `per_page=50` to API calls to reduce pagination overhead

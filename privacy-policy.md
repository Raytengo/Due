# Privacy Policy — Due Extension

**Last updated: September 3, 2026**

## Overview

Due ("the Extension") is a Chrome extension that connects to Canvas LMS to help students track assignments, deadlines, and grading weights. This policy explains what data the Extension accesses, how it is used, and what is shared with third parties.

---

## Data We Access

### Canvas LMS Data
When you visit your school's Canvas site, the Extension reads the following data from the Canvas API using your existing browser session (cookies):

- Course list and names
- Assignments, due dates, descriptions, and submission status
- Assignment groups and their grading weights
- Only if you enable the optional AI analysis: the course syllabus text and, if you grant access to `canvas-user-content.com`, PDF files linked from the syllabus or stored in the course's Files area

**This data is stored locally on your device** using `chrome.storage.local` and is never transmitted to the extension developer or any server controlled by the developer.

### Claude usage (optional popup chip)
If you are logged in to claude.ai, the Extension can read your own usage percentage from claude.ai's usage endpoint and show it in the popup. This is read-only, stays on your device, and can be hidden from the settings menu.

### AI API Key (optional)
You may optionally provide an API key for one of these third-party AI services: Google Gemini, Alibaba Qwen (DashScope), DeepSeek, or NVIDIA NIM. This key is:

- Stored locally on your device (`chrome.storage.local`, readable only by the Extension's own pages)
- Never transmitted to the extension developer
- Used exclusively to authenticate requests to the AI service you have chosen
- Removable at any time via "Remove key" in the AI analysis settings

---

## Third-Party Data Sharing

The AI grading-weight analysis is **off by default** and only runs after you enter an API key and press Save. When it runs, the Extension sends the following data **directly from your browser to the AI service you selected**:

- The course syllabus text from Canvas
- Syllabus-related PDF files from the course (only if you granted access to `canvas-user-content.com` and the provider supports PDF input)
- A list of the course's PDF file names, when the Extension needs help choosing which file is the syllabus

Each course is analyzed once (a failed attempt is retried at most twice, after a cooling-off period); the result (grading components and weights) is stored locally as that course's manual weights.

**The extension developer does not receive, process, store, or have access to this data.** The transmission happens entirely between your browser and the AI provider you configured, under that provider's terms.

You are responsible for reviewing the privacy policy of your chosen AI provider:
- Google Gemini: https://policies.google.com/privacy
- Alibaba Cloud (Qwen / DashScope): https://www.alibabacloud.com/help/en/legal/latest/alibaba-cloud-international-website-privacy-policy
- DeepSeek: https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html
- NVIDIA (NIM): https://www.nvidia.com/en-us/about-nvidia/privacy-policy/

---

## Permissions

- `https://*.instructure.com/*` — read your Canvas data with your existing login
- `https://claude.ai/*` — read your own Claude usage for the optional popup chip
- Optional, requested only when you save AI analysis settings: `https://*.canvas-user-content.com/*` — download syllabus PDFs from Canvas's file host. You can decline; the analysis then uses syllabus text only.
- Optional, requested only when you save AI analysis settings with NVIDIA NIM selected: `https://integrate.api.nvidia.com/*` — call the NVIDIA NIM API. Unlike the other providers, NVIDIA's endpoint does not allow direct browser calls, so this permission is required for it to work at all. You can decline; the AI analysis then does nothing until you pick another provider.
- `storage`, `tabs`, `webNavigation`, `scripting` — save data locally, detect when you visit Canvas, and open the dashboard tab.

Calls to Gemini, Qwen and DeepSeek use their public HTTPS APIs and require no additional permissions; NVIDIA NIM is the one exception noted above.

---

## Data We Do NOT Collect

The extension developer collects **no data whatsoever**. The Extension has no backend server, no analytics, no telemetry, and no remote logging. All data stays on your device or goes directly to Canvas, claude.ai, or your chosen AI service.

---

## Data Retention & Deletion

All data stored by the Extension can be cleared at any time by:
- Removing the Extension from Chrome
- Using Chrome's "Clear extension storage" option in `chrome://extensions`
- Removing the AI key and analysis records from the AI analysis settings dialog

---

## Changes to This Policy

If this policy is updated, the new version will be published at this URL with an updated "Last updated" date.

---

## Contact

If you have any questions about this privacy policy, please open an issue at: https://github.com/Raytengo/Due

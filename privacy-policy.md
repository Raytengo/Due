# Privacy Policy — Due Extension

**Last updated: October 25, 2026**

## Overview

Due ("the Extension") is a Chrome extension that connects to Canvas LMS to help students track assignments, deadlines, and grading weights. This policy explains what data the Extension accesses, how it is used, and what is shared with third parties.

---

## Data We Access

### Canvas LMS Data
When you visit your school's Canvas site, the Extension reads the following data from the Canvas API using your existing browser session (cookies):

- Course list and names
- Assignments, due dates, descriptions, submission status, and your scores/grades as returned by Canvas
- Assignment groups and their grading weights
- Only if you enable the optional AI analysis: the course syllabus text, the list of the course's PDF files (names, sizes and dates), and, if you grant access to `canvas-user-content.com`, PDF files linked from the syllabus or stored in the course's Files area

Scores you type into the grade calculator, custom assignments, course nicknames and grading weights you edit are stored the same way.

**This data is stored locally on your device** using `chrome.storage.local` and is never transmitted to the extension developer or any server controlled by the developer.

### Claude usage (popup chip)
If you use claude.ai, a script that the Extension runs on claude.ai pages watches the page's own requests to learn your organization ID and your 5-hour usage figures; when you refresh the chip in the popup, the Extension looks for an open claude.ai tab and reads the same usage endpoint from that tab. The organization ID and usage figures are stored locally and shown in the popup; nothing else from claude.ai (such as your conversations) is read. This is on by default. The "Claude usage" switch in the settings menu only hides the chip; the stored figures stay on your device until you remove the Extension.

### AI API Key (optional)
You may optionally provide an API key for one of these third-party AI services: Google Gemini, Alibaba Qwen (DashScope), DeepSeek, or NVIDIA NIM. This key is:

- Stored locally on your device (`chrome.storage.local`, readable only by the Extension's own pages)
- Never transmitted to the extension developer
- Used exclusively to authenticate requests to the AI service you have chosen
- Removable at any time via "Remove key" in the AI analysis settings (see "Data Retention & Deletion" below)

---

## Third-Party Data Sharing

The AI grading-weight analysis is **off by default** and only runs after you enter an API key and press Save. It runs right after you save and then automatically after each Canvas sync, only for courses that do not have grading weights yet. When it runs, the Extension sends the following data **directly from your browser to the AI service you selected** (or to the custom Base URL you entered for an OpenAI-compatible provider), using your own API key (any usage charges are billed by that provider to your account):

- The course syllabus text from Canvas
- PDF files linked from the syllabus (only if you granted access to `canvas-user-content.com`). Google Gemini receives the PDF file itself; the other providers receive text extracted from the PDF inside your browser (up to 30,000 characters per PDF).
- Only when the syllabus and its linked PDFs contain no grading breakdown: one PDF from the course's Files area (or its extracted text). The Extension first looks for a file whose name says it is the syllabus; if none does, it sends the AI a list of the course's PDF file names so the AI can pick one.

When weights are found, they are stored locally as that course's manual weights, and the course is not analyzed again unless you clear its weights in the weight editor. A course where no weights were found is analyzed again only when its syllabus or course files change, when you change the AI provider, model or Base URL, when you grant PDF access, or when the previous attempt could not download everything; a request that failed (for example because of an invalid key or a rate limit) is retried on the next sync. If your instructor later sets grading weights in Canvas and you have not edited the AI-generated ones, the Extension switches back to the Canvas weights.

**The extension developer does not receive, process, store, or have access to this data.** The transmission happens entirely between your browser and the AI provider you configured, and the provider handles it under its own terms. Some providers' free tiers (for example, the free tier of the Gemini API) allow the provider to use what you send to improve their products, including review by human reviewers; use a paid tier, or leave the AI analysis off, if that matters to you.

You are responsible for reviewing the privacy policy of your chosen AI provider:
- Google Gemini: https://policies.google.com/privacy
- Alibaba Cloud (Qwen / DashScope): https://www.alibabacloud.com/help/en/legal/latest/alibaba-cloud-international-website-privacy-policy
- DeepSeek: https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html
- NVIDIA (NIM): https://www.nvidia.com/en-us/about-nvidia/privacy-policy/

---

## Permissions

- `https://*.instructure.com/*` — read your Canvas data with your existing login
- `https://claude.ai/*` — run the script described under "Claude usage" on claude.ai pages and read your own usage for the popup chip
- Optional, requested only when you save AI analysis settings (for every provider): `https://*.canvas-user-content.com/*` — download syllabus PDFs from Canvas's file host. You can decline; the analysis then uses syllabus text only.
- Optional, requested only when you save AI analysis settings with NVIDIA NIM selected: `https://integrate.api.nvidia.com/*` — call the NVIDIA NIM API. Unlike the other providers, NVIDIA's endpoint does not allow direct browser calls, so this permission is required for it to work at all. You can decline; no data is then sent to NVIDIA until you grant the permission or pick another provider.
- `storage` — save data locally
- `webNavigation` — detect when you visit Canvas so the Extension can sync
- `tabs` — open the dashboard and Canvas tabs, and find an open claude.ai tab for the usage chip
- `scripting` — read the usage endpoint from inside that claude.ai tab when you refresh the chip

Calls to Gemini, Qwen and DeepSeek use their public HTTPS APIs and require no additional permissions; NVIDIA NIM is the one exception noted above.

---

## Data We Do NOT Collect

The extension developer collects **no data whatsoever**. The Extension has no backend server, no analytics, no telemetry, and no remote logging. All data stays on your device or goes directly to Canvas, claude.ai, or your chosen AI service.

---

## Limited Use

The use of information received from Canvas and claude.ai complies with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the Limited Use requirements. The Extension uses this data only to provide its features: showing your assignments, deadlines, grading weights and scores, and your Claude usage. The developer never receives it, does not sell it, does not use it for advertising or credit decisions, and does not read it. The only transfer is the one described under "Third-Party Data Sharing": syllabus material sent to the AI service you configure, at your request, to extract a course's grading weights; what that service does with it is governed by its own terms (see above).

---

## Data Retention & Deletion

All data the Extension stores stays on your device. Removing the Extension from Chrome deletes all of it.

- **Remove key** in the AI analysis settings deletes your API key, so no AI analysis runs from the next sync onward (an analysis round that is already running may still finish). Weights the AI already filled in stay on your device; you can edit or clear them in each course's weight editor. A short per-course analysis status record (result, time, provider, model) also stays until you remove the Extension.
- Grading weights, course names and other edits you make can be changed or cleared in the dashboard at any time.

---

## Changes to This Policy

If this policy is updated, the new version will be published at this URL with an updated "Last updated" date.

---

## Contact

If you have any questions about this privacy policy, please open an issue at: https://github.com/Raytengo/Due

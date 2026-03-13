# Privacy Policy — Due Extension

**Last updated: March 13, 2026**

## Overview

Due ("the Extension") is a Chrome extension that connects to Canvas LMS to help students track assignments, deadlines, and course information. This policy explains what data the Extension accesses, how it is used, and what is shared with third parties.

---

## Data We Access

### Canvas LMS Data
When you visit your school's Canvas site, the Extension reads the following data from the Canvas API using your existing browser session (cookies):

- Course list and names
- Assignments and due dates
- Assignment descriptions and attachments (PDF files)
- Course files (PDF only)
- Course announcements
- Grading/assessment structure

**This data is stored locally on your device** using `chrome.storage.local` and is never transmitted to the extension developer or any server controlled by the developer.

### AI API Key
You may optionally provide an API key for a third-party AI service (e.g. Google Gemini, Anthropic Claude, OpenAI, DeepSeek, Qwen, Moonshot, Zhipu, MiniMax). This key is:

- Stored locally on your device (`chrome.storage.local`)
- Never transmitted to the extension developer
- Used exclusively to authenticate requests to the AI service you have chosen

---

## Third-Party Data Sharing

When you use the AI Analysis feature, the Extension sends the following data **directly from your browser to the AI service you selected**:

- Assignment title and description
- PDF content of relevant course files or attachments
- Relevant course announcements (title and body)

**The extension developer does not receive, process, store, or have access to this data.** The transmission happens entirely between your browser and the AI provider you configured.

You are responsible for reviewing the privacy policy of your chosen AI provider:
- Google Gemini: https://policies.google.com/privacy
- Anthropic Claude: https://www.anthropic.com/privacy
- OpenAI: https://openai.com/policies/privacy-policy

---

## Data We Do NOT Collect

The extension developer collects **no data whatsoever**. The Extension has no backend server, no analytics, no telemetry, and no remote logging. All data stays on your device or goes directly to Canvas/your chosen AI service.

---

## Data Retention & Deletion

All data stored by the Extension can be cleared at any time by:
- Removing the Extension from Chrome
- Using Chrome's "Clear extension storage" option in `chrome://extensions`

---

## Changes to This Policy

If this policy is updated, the new version will be published at this URL with an updated "Last updated" date.

---

## Contact

If you have any questions about this privacy policy, please open an issue at: https://github.com/Raytengo/Due

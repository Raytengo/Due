const BASE_URL = 'https://hkust-gz.instructure.com';

// 監聽造訪 Canvas 頁面，自動觸發同步
chrome.webNavigation
  ? chrome.webNavigation.onCompleted.addListener(
      (details) => {
        if (details.frameId === 0) syncAll();
      },
      { url: [{ hostContains: 'hkust-gz.instructure.com' }] }
    )
  : null;

// ── Message handlers ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC') {
    syncAll()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['lastSync', 'courses'], (data) => {
      sendResponse({
        lastSync: data.lastSync || null,
        courseCount: (data.courses || []).length,
      });
    });
    return true;
  }

  if (message.type === 'FETCH_PDF') {
    (async () => {
      try {
        const res = await fetch(message.url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 10 * 1024 * 1024) {
          sendResponse({ success: false, error: '檔案過大（超過 10MB）' });
          return;
        }
        sendResponse({ success: true, base64: arrayBufferToBase64(buffer) });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'ANALYZE_ASSIGNMENT') {
    handleAnalyze(message, sendResponse);
    return true;
  }

  if (message.type === 'GET_ANALYSIS') {
    chrome.storage.local.get(['analysis'], (data) => {
      sendResponse({ success: true, analysis: (data.analysis || {})[message.assignmentId] || null });
    });
    return true;
  }
});

// ── AI Analysis handler ──
async function handleAnalyze({ assignmentId, courseId }, sendResponse) {
  try {
    const data = await chrome.storage.local.get([
      'aiModel', 'geminiApiKey', 'geminiModel', 'claudeApiKey',
      'assignments', 'files', 'analysis',
    ]);

    const aiModel = data.aiModel || 'gemini';

    // Validate key for selected model
    if (aiModel === 'gemini' && !data.geminiApiKey) {
      sendResponse({ success: false, error: 'NO_API_KEY' });
      return;
    }
    if (aiModel === 'claude' && !data.claudeApiKey) {
      sendResponse({ success: false, error: 'NO_API_KEY' });
      return;
    }

    const assignment = (data.assignments[courseId] || []).find((a) => a.id === assignmentId);
    if (!assignment) {
      sendResponse({ success: false, error: 'Assignment not found' });
      return;
    }

    // Build content parts (unified format)
    const parts = [];

    for (const file of ((data.files || {})[courseId] || []).slice(0, 3)) {
      try {
        const res = await fetch(file.url, { credentials: 'include' });
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 10 * 1024 * 1024) continue;
        parts.push({ type: 'pdf', base64: arrayBufferToBase64(buffer), mimeType: 'application/pdf' });
      } catch (_) { /* skip */ }
    }

    const desc = assignment.description ? stripHtmlService(assignment.description) : '（無描述）';
    parts.push({
      type: 'text',
      text: `Assignment: ${assignment.name}\nDue: ${assignment.due_at || 'N/A'}\n\nDescription: ${desc}`,
    });

    const systemPrompt =
      'Return ONLY valid JSON with no markdown fences: { "summary": string, "requirements": string[], ' +
      '"milestones": [{"title": string, "description": string, "daysBeforeDue": number}], ' +
      '"tips": string[], "estimatedHours": number }';

    let responseText;
    if (aiModel === 'gemini') {
      responseText = await callGemini(parts, systemPrompt, data.geminiApiKey, data.geminiModel || 'gemini-2.0-flash-lite');
    } else {
      responseText = await callClaude(parts, systemPrompt, data.claudeApiKey, 'claude-opus-4-6');
    }

    // Parse JSON (strip accidental markdown fences)
    let parsed;
    try {
      const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (_) {
      parsed = { summary: responseText, requirements: [], milestones: [], tips: [], estimatedHours: 0 };
    }

    // Cache
    const analysis = data.analysis || {};
    analysis[assignmentId] = { timestamp: new Date().toISOString(), model: aiModel, result: parsed };
    await chrome.storage.local.set({ analysis });

    sendResponse({ success: true, result: parsed, model: aiModel });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// ── Gemini API ──
async function callGemini(parts, systemPrompt, apiKey, modelId) {
  const geminiParts = parts.map((p) =>
    p.type === 'pdf'
      ? { inlineData: { mimeType: p.mimeType, data: p.base64 } }
      : { text: p.text }
  );

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: geminiParts }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);

  const json = await res.json();
  const candidate = json.candidates?.[0];
  if (!candidate) throw new Error('Gemini 回傳空結果');
  return candidate.content.parts[0].text;
}

// ── Claude API ──
async function callClaude(parts, systemPrompt, apiKey, modelId) {
  const claudeParts = parts.map((p) =>
    p.type === 'pdf'
      ? { type: 'document', source: { type: 'base64', media_type: p.mimeType, data: p.base64 } }
      : { type: 'text', text: p.text }
  );

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: claudeParts }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);

  const json = await res.json();
  return json.content[0].text;
}

// ── Helpers ──
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function stripHtmlService(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Canvas API pagination ──
async function fetchAllPages(url) {
  const results = [];
  let nextUrl = url;
  while (nextUrl) {
    const res = await fetch(nextUrl, { credentials: 'include' });
    if (!res.ok) throw new Error(`Canvas API error: ${res.status} ${res.statusText}`);
    results.push(...(await res.json()));
    nextUrl = parseLinkNext(res.headers.get('Link'));
  }
  return results;
}

function parseLinkNext(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

// ── Canvas API endpoints ──
async function fetchCourses() {
  return fetchAllPages(`${BASE_URL}/api/v1/courses?enrollment_state=active&per_page=50`);
}

async function fetchAssignments(courseId) {
  return fetchAllPages(
    `${BASE_URL}/api/v1/courses/${courseId}/assignments?per_page=50&include[]=submission`
  );
}

async function fetchAssignmentGroups(courseId) {
  return fetchAllPages(
    `${BASE_URL}/api/v1/courses/${courseId}/assignment_groups?include[]=assignments&include[]=group_weight`
  );
}

async function fetchFiles(courseId) {
  try {
    return await fetchAllPages(
      `${BASE_URL}/api/v1/courses/${courseId}/files?per_page=50&content_types[]=application/pdf`
    );
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) return [];
    console.warn(`[Canvas Dashboard] 課程 ${courseId} 檔案拉取失敗:`, err.message);
    return [];
  }
}

// ── Sync ──
async function syncAll() {
  console.log('[Canvas Dashboard] 開始同步...');

  let courses;
  try {
    courses = await fetchCourses();
  } catch (err) {
    console.error('[Canvas Dashboard] 拉取課程失敗:', err);
    return;
  }

  courses = courses.filter((c) => c.name && c.workflow_state === 'available');

  const assignments = {};
  const assignmentGroups = {};
  const files = {};

  await Promise.all(
    courses.map(async (course) => {
      try {
        const [asgn, groups, courseFiles] = await Promise.all([
          fetchAssignments(course.id),
          fetchAssignmentGroups(course.id),
          fetchFiles(course.id),
        ]);
        assignments[course.id] = asgn;
        assignmentGroups[course.id] = groups;
        files[course.id] = courseFiles;
      } catch (err) {
        console.error(`[Canvas Dashboard] 課程 ${course.id} 同步失敗:`, err);
        assignments[course.id] = [];
        assignmentGroups[course.id] = [];
        files[course.id] = [];
      }
    })
  );

  await chrome.storage.local.set({
    lastSync: new Date().toISOString(),
    courses,
    assignments,
    assignmentGroups,
    files,
  });

  console.log(`[Canvas Dashboard] 同步完成，共 ${courses.length} 門課程`);
}

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

  if (message.type === 'ANALYZE_SYLLABUS') {
    handleSyllabusAnalyze(message, sendResponse);
    return true;
  }

  if (message.type === 'GET_SYLLABUS_ANALYSIS') {
    chrome.storage.local.get(['syllabusAnalysis'], (data) => {
      sendResponse({ success: true, analysis: (data.syllabusAnalysis || {})[message.courseId] || null });
    });
    return true;
  }
});

// ── AI Analysis handler ──
async function handleAnalyze({ assignmentId, courseId }, sendResponse) {
  try {
    const data = await chrome.storage.local.get([
      'aiModel', 'geminiApiKey', 'geminiModel', 'claudeApiKey',
      'assignments', 'files', 'announcements', 'analysis',
    ]);

    const aiModel = data.aiModel || 'gemini';

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

    const desc = assignment.description ? stripHtmlService(assignment.description) : '（無描述）';
    const seenIds = new Set();
    const parts = [];

    // ── Step 1: Assignment attachments (directly attached by teacher) ──
    try {
      const full = await fetchJSON(`${BASE_URL}/api/v1/courses/${courseId}/assignments/${assignmentId}`);
      for (const att of full.attachments || []) {
        if (seenIds.has(att.id)) continue;
        seenIds.add(att.id);
        const pdf = await tryFetchPdf(`${BASE_URL}/api/v1/files/${att.id}/download`);
        if (pdf) parts.push(pdf);
      }
    } catch (_) {}

    // ── Step 2: Canvas file links embedded in description HTML ──
    for (const fileId of extractCanvasFileIds(assignment.description || '')) {
      if (seenIds.has(fileId)) continue;
      seenIds.add(fileId);
      const pdf = await tryFetchPdf(`${BASE_URL}/api/v1/files/${fileId}/download`);
      if (pdf) parts.push(pdf);
    }

    // ── Step 3: AI-assisted selection from course files ──
    const courseFiles = ((data.files || {})[courseId] || []).filter((f) => !seenIds.has(f.id));
    if (courseFiles.length > 0) {
      const selectedIds = await selectRelevantFiles(
        assignment, desc, courseFiles, aiModel,
        data.claudeApiKey, data.geminiApiKey, data.geminiModel || 'gemini-2.0-flash-lite'
      );
      for (const fileId of selectedIds) {
        if (seenIds.has(fileId)) continue;
        seenIds.add(fileId);
        const file = courseFiles.find((f) => f.id === fileId);
        if (!file) continue;
        const pdf = await tryFetchPdf(file.url || `${BASE_URL}/api/v1/files/${fileId}/download`);
        if (pdf) parts.push(pdf);
      }
    }

    // ── Step 3.5: AI-assisted selection from course announcements ──
    const courseAnnouncements = ((data.announcements || {})[courseId] || []);
    if (courseAnnouncements.length > 0) {
      const selectedAnnIds = await selectRelevantAnnouncements(
        assignment, desc, courseAnnouncements, aiModel,
        data.claudeApiKey, data.geminiApiKey, data.geminiModel || 'gemini-2.0-flash-lite'
      );
      for (const annId of selectedAnnIds) {
        const ann = courseAnnouncements.find((a) => a.id === annId);
        if (!ann) continue;
        const body = ann.message ? stripHtmlService(ann.message) : '';
        if (body) parts.push({
          type: 'text',
          text: `Announcement: ${ann.title}\nPosted: ${ann.posted_at || ''}\n\n${body}`,
        });
      }
    }

    // ── Step 4: Assignment text (always included) ──
    parts.push({
      type: 'text',
      text: `Assignment: ${assignment.name}\nDue: ${assignment.due_at || 'N/A'}\n\nDescription: ${desc}`,
    });

    // ── Early exit: No meaningful content available ──
    const hasFiles = parts.some(p => p.type === 'pdf');
    const hasDescription = desc !== '（無描述）' && desc.length > 50;
    if (!hasFiles && !hasDescription) {
      const shortResult = {
        summary: '此作業目前沒有可供分析的資訊（無描述、無附件、無相關檔案或公告）。請查看課程大綱或聯繫老師確認作業要求。',
        requirements: [],
        milestones: [],
        tips: ['查看課程網站或 Canvas 上是否有更新的作業說明', '聯繫助教或老師確認作業內容'],
        estimatedHours: 0,
      };
      const analysis = data.analysis || {};
      analysis[assignmentId] = { timestamp: new Date().toISOString(), model: 'none', result: shortResult };
      await chrome.storage.local.set({ analysis });
      sendResponse({ success: true, result: shortResult, model: 'none' });
      return;
    }

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

    let parsed;
    try {
      const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (_) {
      parsed = { summary: responseText, requirements: [], milestones: [], tips: [], estimatedHours: 0 };
    }

    const analysis = data.analysis || {};
    analysis[assignmentId] = { timestamp: new Date().toISOString(), model: aiModel, result: parsed };
    await chrome.storage.local.set({ analysis });

    sendResponse({ success: true, result: parsed, model: aiModel });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// ── Syllabus Analysis ──
const SYLLABUS_KEYWORDS = ['syllabus', 'course outline', 'course_outline', 'grading', 'course info', 'courseinfo', 'assessment', 'course guide', 'unit guide'];

async function fetchSyllabusHtml(courseId) {
  // Try 1: API syllabus_body (lightweight, just the editable HTML)
  try {
    const data = await fetchJSON(`${BASE_URL}/api/v1/courses/${courseId}?include[]=syllabus_body`);
    if (data.syllabus_body && data.syllabus_body.trim().length > 0) return data.syllabus_body;
  } catch (_) {}

  // Try 2: Fetch the actual Syllabus web page (contains all file links the user sees)
  try {
    const res = await fetch(`${BASE_URL}/courses/${courseId}/assignments/syllabus`, { credentials: 'include' });
    if (res.ok) return await res.text();
  } catch (_) {}

  return null;
}

function findSyllabusByKeyword(files) {
  for (const f of files) {
    const name = (f.display_name || f.filename || '').toLowerCase();
    if (SYLLABUS_KEYWORDS.some((k) => name.includes(k))) return f;
  }
  return null;
}

async function selectSyllabusPdfWithAI(files, aiModel, claudeKey, geminiKey, geminiModel) {
  const fileList = files.slice(0, 60).map((f) => `${f.id}: ${f.display_name || f.filename}`).join('\n');
  const prompt =
    `Course files:\n${fileList}\n\n` +
    `Which file most likely contains the course syllabus or grading policy? ` +
    `Return only the file ID as a JSON integer, or null if none seem relevant. Return ONLY the JSON value.`;
  try {
    let raw;
    if (aiModel === 'gemini') {
      raw = await callGemini([{ type: 'text', text: prompt }], 'Return only valid JSON, no explanation.', geminiKey, geminiModel, 0);
    } else {
      raw = await callClaude([{ type: 'text', text: prompt }], 'Return only valid JSON, no explanation.', claudeKey, 'claude-haiku-4-5', 0);
    }
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const id = JSON.parse(cleaned);
    return Number.isInteger(id) ? (files.find((f) => f.id === id) || null) : null;
  } catch (_) {
    return null;
  }
}

async function handleSyllabusAnalyze({ courseId, force }, sendResponse) {
  try {
    const data = await chrome.storage.local.get([
      'aiModel', 'geminiApiKey', 'geminiModel', 'claudeApiKey',
      'files', 'syllabusAnalysis',
    ]);

    // ① Cache check — skip full analysis if cached and not forced
    if (!force) {
      const cached = (data.syllabusAnalysis || {})[courseId];
      if (cached) {
        sendResponse({ success: true, result: cached });
        return;
      }
    }

    const aiModel = data.aiModel || 'gemini';
    if (aiModel === 'gemini' && !data.geminiApiKey) { sendResponse({ success: false, error: 'NO_API_KEY' }); return; }
    if (aiModel === 'claude' && !data.claudeApiKey) { sendResponse({ success: false, error: 'NO_API_KEY' }); return; }

    const parts = [];
    let source = 'none';
    let debugNote = '';

    // Step 1: Fetch syllabus HTML (API first, then full web page fallback)
    const syllabusHtml = await fetchSyllabusHtml(courseId);

    if (syllabusHtml) {
      // Extract ALL file IDs from the HTML, regardless of link format
      for (const fileId of extractAllFileIds(syllabusHtml)) {
        // Use course-context URL (not /api/v1/) — this is the format that works with cookies
        const pdf = await tryFetchPdf(`${BASE_URL}/courses/${courseId}/files/${fileId}/download?download_frd=1`);
        if (pdf) { parts.push(pdf); source = 'syllabus_page_pdf'; }
      }

      // Add text content if substantial
      const syllabusText = stripHtmlService(syllabusHtml);
      if (syllabusText && syllabusText.trim().length > 50) {
        parts.push({ type: 'text', text: `Course Syllabus:\n${syllabusText}` });
        if (source === 'none') source = 'syllabus_body';
      }
    }

    if (parts.length === 0) {
      // Step 2: keyword match on file list
      // Use stored files; if empty, try fetching live from Canvas API
      let courseFiles = (data.files || {})[courseId] || [];
      if (courseFiles.length === 0) {
        try { courseFiles = await fetchFiles(courseId); } catch (_) {}
      }

      if (courseFiles.length === 0) {
        debugNote = '找不到課程 PDF 清單（API 403 或尚未同步）';
      } else {
        let syllabusFile = findSyllabusByKeyword(courseFiles);

        if (!syllabusFile) {
          // Step 3: AI selects from file list
          syllabusFile = await selectSyllabusPdfWithAI(
            courseFiles, aiModel,
            data.claudeApiKey, data.geminiApiKey, data.geminiModel || 'gemini-2.0-flash-lite'
          );
          if (syllabusFile) source = 'ai_selected_pdf';
          else debugNote = `PDF 清單中無 syllabus 相關檔案（共 ${courseFiles.length} 個）`;
        } else {
          source = 'keyword_pdf';
        }

        if (syllabusFile) {
          const fileName = syllabusFile.display_name || syllabusFile.filename || `file ${syllabusFile.id}`;
          let pdf = await tryFetchPdf(`${BASE_URL}/api/v1/files/${syllabusFile.id}/download`);
          if (!pdf) {
            // Fallback: fetch fresh metadata to get a new signed download URL
            try {
              const meta = await fetchJSON(`${BASE_URL}/api/v1/files/${syllabusFile.id}`);
              if (meta.url) pdf = await tryFetchPdf(meta.url);
            } catch (_) {}
          }
          if (pdf) {
            parts.push(pdf);
          } else {
            debugNote = `找到 ${fileName} 但 PDF 下載失敗（HTTP 403？）`;
          }
        }
      }
    }

    if (parts.length === 0) {
      const result = { found: false, components: [], notes: debugNote || '找不到課程大綱或評分說明文件', source: 'none' };
      const syllabusAnalysis = data.syllabusAnalysis || {};
      syllabusAnalysis[courseId] = { timestamp: new Date().toISOString(), ...result };
      await chrome.storage.local.set({ syllabusAnalysis });
      sendResponse({ success: true, result });
      return;
    }

    parts.push({
      type: 'text',
      text: 'Extract the grading/assessment breakdown from this course material. List each graded component with its name, percentage weight (or null if not specified), and a brief description.',
    });

    const systemPrompt =
      'Return ONLY valid JSON with no markdown fences: ' +
      '{ "found": boolean, "components": [{"name": string, "weight": number|null, "description": string}], "notes": string }';

    let responseText;
    if (aiModel === 'gemini') {
      responseText = await callGemini(parts, systemPrompt, data.geminiApiKey, data.geminiModel || 'gemini-2.0-flash-lite', 0);
    } else {
      responseText = await callClaude(parts, systemPrompt, data.claudeApiKey, 'claude-opus-4-6', 0);
    }

    let parsed;
    try {
      const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (_) {
      parsed = { found: false, components: [], notes: responseText };
    }
    parsed.source = source;

    const syllabusAnalysis = data.syllabusAnalysis || {};
    syllabusAnalysis[courseId] = { timestamp: new Date().toISOString(), ...parsed };
    await chrome.storage.local.set({ syllabusAnalysis });

    sendResponse({ success: true, result: parsed });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// ── Helpers for smart file selection ──

async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function extractCanvasFileIds(html) {
  const ids = new Set();
  const re = /\/files\/(\d+)\/(?:download|preview)/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.add(parseInt(m[1], 10));
  return [...ids];
}

// Extracts all unique Canvas file IDs from any HTML (handles all link formats)
function extractAllFileIds(html) {
  const ids = new Set();
  const re = /\/files\/(\d+)/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.add(m[1]);
  return [...ids];
}

async function selectRelevantFiles(assignment, desc, courseFiles, aiModel, claudeKey, geminiKey, geminiModel) {
  const fileList = courseFiles
    .slice(0, 60)
    .map((f) => `${f.id}: ${f.display_name || f.filename}`)
    .join('\n');

  const prompt =
    `Assignment: ${assignment.name}\n` +
    `Description (excerpt): ${desc.slice(0, 600)}\n\n` +
    `Course files:\n${fileList}\n\n` +
    `Return a JSON array of file IDs (integers) most likely needed for this assignment. ` +
    `Return [] if none are relevant. Return ONLY the JSON array.`;

  try {
    let raw;
    if (aiModel === 'gemini') {
      raw = await callGemini(
        [{ type: 'text', text: prompt }],
        'Return only valid JSON, no explanation.',
        geminiKey, geminiModel
      );
    } else {
      raw = await callClaude(
        [{ type: 'text', text: prompt }],
        'Return only valid JSON, no explanation.',
        claudeKey, 'claude-haiku-4-5'
      );
    }
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const ids = JSON.parse(cleaned);
    return Array.isArray(ids) ? ids.filter((x) => Number.isInteger(x)) : [];
  } catch (_) {
    return [];
  }
}

async function selectRelevantAnnouncements(assignment, desc, announcements, aiModel, claudeKey, geminiKey, geminiModel) {
  const annList = announcements
    .slice(0, 30)
    .map((a) => `${a.id}: ${a.title}`)
    .join('\n');

  const prompt =
    `Assignment: ${assignment.name}\n` +
    `Description (excerpt): ${desc.slice(0, 400)}\n\n` +
    `Course announcements:\n${annList}\n\n` +
    `Return a JSON array of announcement IDs (integers) that likely contain information relevant to this assignment. ` +
    `Return [] if none are relevant. Return ONLY the JSON array.`;

  try {
    let raw;
    if (aiModel === 'gemini') {
      raw = await callGemini(
        [{ type: 'text', text: prompt }],
        'Return only valid JSON, no explanation.',
        geminiKey, geminiModel
      );
    } else {
      raw = await callClaude(
        [{ type: 'text', text: prompt }],
        'Return only valid JSON, no explanation.',
        claudeKey, 'claude-haiku-4-5'
      );
    }
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const ids = JSON.parse(cleaned);
    return Array.isArray(ids) ? ids.filter((x) => Number.isInteger(x)) : [];
  } catch (_) {
    return [];
  }
}

async function tryFetchPdf(url) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024) return null;
    return { type: 'pdf', base64: arrayBufferToBase64(buffer), mimeType: 'application/pdf' };
  } catch (_) {
    return null;
  }
}

// ── Gemini API ──
async function callGemini(parts, systemPrompt, apiKey, modelId, temperature = undefined) {
  const geminiParts = parts.map((p) =>
    p.type === 'pdf'
      ? { inlineData: { mimeType: p.mimeType, data: p.base64 } }
      : { text: p.text }
  );

  const generationConfig = { maxOutputTokens: 2048 };
  if (temperature !== undefined) generationConfig.temperature = temperature;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
        contents: [{ parts: geminiParts }],
        generationConfig,
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
async function callClaude(parts, systemPrompt, apiKey, modelId, temperature = undefined) {
  const claudeParts = parts.map((p) =>
    p.type === 'pdf'
      ? { type: 'document', source: { type: 'base64', media_type: p.mimeType, data: p.base64 } }
      : { type: 'text', text: p.text }
  );

  const body = {
    model: modelId,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: claudeParts }],
  };
  if (temperature !== undefined) body.temperature = temperature;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
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

async function fetchAnnouncements(courseId) {
  try {
    return await fetchAllPages(
      `${BASE_URL}/api/v1/courses/${courseId}/discussion_topics?only_announcements=true&per_page=50`
    );
  } catch (err) {
    if (err.message.includes('403') || err.message.includes('401')) return [];
    console.warn(`[Canvas Dashboard] 課程 ${courseId} 公告拉取失敗:`, err.message);
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
  const announcements = {};

  await Promise.all(
    courses.map(async (course) => {
      try {
        const [asgn, groups, courseFiles, courseAnnouncements] = await Promise.all([
          fetchAssignments(course.id),
          fetchAssignmentGroups(course.id),
          fetchFiles(course.id),
          fetchAnnouncements(course.id),
        ]);
        assignments[course.id] = asgn;
        assignmentGroups[course.id] = groups;
        files[course.id] = courseFiles;
        announcements[course.id] = courseAnnouncements;
      } catch (err) {
        console.error(`[Canvas Dashboard] 課程 ${course.id} 同步失敗:`, err);
        assignments[course.id] = [];
        assignmentGroups[course.id] = [];
        files[course.id] = [];
        announcements[course.id] = [];
      }
    })
  );

  await chrome.storage.local.set({
    lastSync: new Date().toISOString(),
    courses,
    assignments,
    assignmentGroups,
    files,
    announcements,
  });

  console.log(`[Canvas Dashboard] 同步完成，共 ${courses.length} 門課程`);
}

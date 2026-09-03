(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueGradingRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ═══════════════════════════════════════════════════════════════
  // Due AI 評分比重分析：純規則（service worker 與 dashboard 共用，可在 node 測試）
  // 不碰 chrome.*、不 fetch；所有 I/O 在 ai/analysisRunner.js
  // spec：docs/superpowers/specs/2026-09-03-ai-grading-weights-restore-design.md
  // ═══════════════════════════════════════════════════════════════

  const DAY_MS = 86400000;
  const MAX_ATTEMPTS = 3;                       // 每門課最多嘗試次數（done 之後不再增加）
  const RETRY_NOT_FOUND_MS = 7 * DAY_MS;        // 找不到大綱 → 7 天後再試
  const RETRY_ERROR_MS = 24 * 3600000;          // 供應商／網路錯誤 → 24 小時後再試
  const MAX_COURSES_PER_RUN = 10;               // 每輪最多處理幾門課
  const MAX_PDF_BYTES = 10 * 1024 * 1024;       // 單檔上限
  const MAX_TOTAL_PDF_BYTES = 15 * 1024 * 1024; // 累計上限（Gemini inline 約 20MB）
  const MAX_FILES_FOR_PICK = 60;                // AI 挑檔時最多列幾個檔名
  const MIN_SYLLABUS_TEXT_CHARS = 50;           // syllabus 文字短於此不算材料
  const WEIGHT_SUM_MIN = 80;                    // 權重總和合理區間
  const WEIGHT_SUM_MAX = 120;
  const PDF_PERMISSION_ORIGIN = 'https://*.canvas-user-content.com/*';

  const PROVIDERS = {
    gemini: {
      label: 'Google Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-flash',
      supportsPdf: true,
      keyPlaceholder: 'AIza...',
    },
    qwen: {
      label: 'Qwen (通義千問)',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      defaultModel: 'qwen-plus',
      supportsPdf: false,
      keyPlaceholder: 'sk-...',
    },
    deepseek: {
      label: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
      supportsPdf: false,
      keyPlaceholder: 'sk-...',
    },
  };

  // ── 設定 ──
  function resolveConfig(stored) {
    const s = stored && typeof stored === 'object' ? stored : {};
    const provider = PROVIDERS[s.provider] ? s.provider : 'gemini';
    const def = PROVIDERS[provider];
    const apiKey = typeof s.apiKey === 'string' ? s.apiKey.trim() : '';
    const model = (typeof s.model === 'string' && s.model.trim()) || def.defaultModel;
    // baseUrl 只有 OpenAI 相容路徑會用到（spec §4.1）；gemini 一律用官方端點，
    // 免得切換供應商後殘留的自訂 baseUrl 把 Gemini key 送去別家。
    const baseUrl = provider === 'gemini'
      ? def.baseUrl
      : ((typeof s.baseUrl === 'string' && s.baseUrl.trim()) || def.baseUrl);
    return { provider, apiKey, model, baseUrl, configured: apiKey !== '' };
  }

  // ── 只跑一次規則 ──
  function hasCanvasWeights(groups) {
    return Array.isArray(groups) && groups.some((g) => g && Number(g.group_weight) > 0);
  }

  function shouldAnalyze({ courseId, customWeights, groups, record, now }) {
    const cw = customWeights && customWeights[courseId];
    if (Array.isArray(cw) && cw.length > 0) return { run: false, reason: 'hasCustomWeights' };
    if (hasCanvasWeights(groups)) return { run: false, reason: 'hasCanvasWeights' };
    if (record) {
      if (record.status === 'done') return { run: false, reason: 'done' };
      if ((record.attempts || 0) >= MAX_ATTEMPTS) return { run: false, reason: 'maxAttempts' };
      const retryAt = record.nextRetryAt ? Date.parse(record.nextRetryAt) : NaN;
      if (Number.isFinite(retryAt) && now < retryAt) return { run: false, reason: 'cooldown' };
      return { run: true, reason: 'retry' };
    }
    return { run: true, reason: 'first' };
  }

  // outcome: { kind: 'done'|'notFound'|'error', source, components?, notes?, error? }
  function nextRecord(prev, outcome, now, meta) {
    const attempts = ((prev && prev.attempts) || 0) + 1;
    // status 只會是這三個值；未知 kind 一律當 error（下方 else 分支已套用 error 的重試時間）
    const kind = outcome.kind === 'done' || outcome.kind === 'notFound' ? outcome.kind : 'error';
    const rec = {
      status: kind,
      attempts,
      at: new Date(now).toISOString(),
      nextRetryAt: null,
      source: outcome.source || 'none',
      provider: meta && meta.provider,
      model: meta && meta.model,
    };
    if (kind === 'done') {
      rec.components = outcome.components;
    } else if (kind === 'notFound') {
      rec.nextRetryAt = new Date(now + RETRY_NOT_FOUND_MS).toISOString();
      if (outcome.notes) rec.notes = String(outcome.notes).slice(0, 200);
    } else {
      rec.nextRetryAt = new Date(now + RETRY_ERROR_MS).toISOString();
      rec.error = String(outcome.error || 'unknown error').slice(0, 200);
    }
    return rec;
  }

  // modal 狀態列用：done | notFound | error | skipped | pending
  function courseStatus({ courseId, customWeights, groups, record, now }) {
    if (record && record.status === 'done') return 'done';
    const d = shouldAnalyze({ courseId, customWeights, groups, record, now });
    if (d.run) return 'pending';
    if (d.reason === 'hasCustomWeights' || d.reason === 'hasCanvasWeights') return 'skipped';
    return record ? record.status : 'skipped'; // cooldown / maxAttempts → 顯示最後結果
  }

  // ── 材料搜尋 ──
  // 只用強關鍵字：裸的 grading／assessment 會把「Assessment 1 rubric.pdf」當大綱
  const SYLLABUS_KEYWORDS = [
    'syllabus', 'course outline', 'course_outline', 'course-outline',
    'course info', 'courseinfo', 'course guide', 'unit guide', 'course description',
    'grading policy', 'grading scheme', 'assessment scheme', 'assessment policy',
  ];

  function findSyllabusByKeyword(files) {
    if (!Array.isArray(files)) return null;
    for (const f of files) {
      const name = String((f && (f.display_name || f.filename)) || '').toLowerCase();
      if (SYLLABUS_KEYWORDS.some((k) => name.includes(k))) return f;
    }
    return null;
  }

  function extractFileIds(html) {
    const ids = [];
    const seen = new Set();
    const re = /\/files\/(\d+)/g;
    let m;
    const s = String(html || '');
    while ((m = re.exec(s)) !== null) {
      if (!seen.has(m[1])) { seen.add(m[1]); ids.push(m[1]); }
    }
    return ids;
  }

  // 數值實體 → 字元；超出 Unicode 範圍時原樣保留（String.fromCodePoint 會丟 RangeError）
  function codePointChar(code, raw) {
    if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return raw;
    return String.fromCodePoint(code);
  }

  function stripHtml(html) {
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6]|table|ul|ol)>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (m, n) => codePointChar(Number(n), m))
      .replace(/&#x([0-9a-f]+);/gi, (m, h) => codePointChar(parseInt(h, 16), m))
      .replace(/[ \t\f\v]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  // ── LLM 回應解析 ──
  function stripFences(text) {
    return String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  function toWeightNumber(w) {
    if (typeof w === 'number') return Number.isFinite(w) ? w : null;
    if (typeof w === 'string') {
      const n = parseFloat(w.replace(/%/g, '').trim());
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function parseAnalysisResponse(text) {
    const cleaned = stripFences(text);
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (_) {
      // 模型常在 JSON 前後多寫一句話（或用 ```javascript 圍欄）：退一步取第一個 { 到最後一個 }
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end <= start) return { ok: false, error: 'invalid JSON' };
      try {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } catch (__) {
        return { ok: false, error: 'invalid JSON' };
      }
    }
    if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'not an object' };
    const raw = Array.isArray(parsed.components) ? parsed.components : [];
    const components = [];
    for (const c of raw) {
      if (!c || typeof c !== 'object') continue;
      const name = typeof c.name === 'string' ? c.name.trim().slice(0, 60) : '';
      const weight = toWeightNumber(c.weight);
      if (!name || weight === null || weight <= 0) continue;
      const description = typeof c.description === 'string' ? c.description.trim().slice(0, 200) : '';
      components.push({ name, weight, description });
    }
    const notes = typeof parsed.notes === 'string' ? parsed.notes.slice(0, 200) : '';
    return { ok: true, found: components.length > 0, components, notes };
  }

  function normalizeWeights(components) {
    const list = Array.isArray(components) ? components : [];
    if (!list.length) return { ok: false, reason: 'empty', components: [], total: 0 };
    let items = list.map((c) => ({ ...c }));
    const rawTotal = items.reduce((s, c) => s + c.weight, 0);
    // 全部 ≤ 1 且總和 ≤ 1.05 → LLM 回了小數比例
    if (items.every((c) => c.weight <= 1) && rawTotal <= 1.05) {
      items = items.map((c) => ({ ...c, weight: c.weight * 100 }));
    }
    // 同名合併（不分大小寫），後者權重加到前者
    const merged = [];
    const index = new Map();
    for (const c of items) {
      const key = String(c.name || '').toLowerCase();
      if (index.has(key)) merged[index.get(key)].weight += c.weight;
      else { index.set(key, merged.length); merged.push({ ...c }); }
    }
    for (const c of merged) c.weight = Math.round(c.weight * 10) / 10;
    const total = Math.round(merged.reduce((s, c) => s + c.weight, 0) * 10) / 10;
    // NaN（權重缺漏／非數字）兩邊比較都是 false，會漏過關卡 → 明確要求有限數
    if (!Number.isFinite(total) || total < WEIGHT_SUM_MIN || total > WEIGHT_SUM_MAX) {
      return { ok: false, reason: `weights sum ${total}`, components: merged, total };
    }
    return { ok: true, components: merged, total };
  }

  function toCustomWeights(components) {
    return components.map((c) => ({ name: c.name, weight: c.weight }));
  }

  // ── Prompt 文字 ──
  const SYSTEM_PROMPT =
    'You extract a course\'s grading breakdown. Return ONLY valid JSON with no markdown fences and no commentary:\n' +
    '{ "found": boolean, "components": [{ "name": string, "weight": number, "description": string }], "notes": string }\n' +
    'Rules: "weight" is a percentage of the final grade as a plain number (e.g. 30, not "30%" and not 0.3). ' +
    'If the syllabus gives a range, use the midpoint. If it gives points, convert to percent of the total. ' +
    'Keep component names as written in the source (same language). Only include components that count toward the final grade. ' +
    'If the material contains no grading breakdown, return found=false with an empty components array.';

  const USER_PROMPT = 'Extract the grading/assessment breakdown of this course from the material above.';

  function buildFilePickPrompt(files) {
    const lines = files
      .slice(0, MAX_FILES_FOR_PICK)
      .map((f) => `${f.id}: ${f.display_name || f.filename || ''}`)
      .join('\n');
    return `Course files:\n${lines}\n\nWhich single file most likely contains the course syllabus or grading policy? Return ONLY a JSON integer file id, or null if none is relevant.`;
  }

  function parseFilePick(text, files) {
    const cleaned = stripFences(text);
    let v;
    try {
      v = JSON.parse(cleaned);
    } catch (_) {
      const m = cleaned.match(/\d+/);
      v = m ? Number(m[0]) : null;
    }
    if (!Number.isInteger(v)) return null;
    return files.find((f) => Number(f.id) === v) || null;
  }

  // parts 組完後依實際附進去的材料決定 source（舊版在下載前就寫，會與實際不符）
  function pickSource({ syllabusPdf, keywordPdf, aiPdf, syllabusText } = {}) {
    if (syllabusPdf) return 'syllabus_pdf';
    if (keywordPdf) return 'keyword_pdf';
    if (aiPdf) return 'ai_selected_pdf';
    if (syllabusText) return 'syllabus_body';
    return 'none';
  }

  return {
    PROVIDERS,
    MAX_ATTEMPTS,
    MAX_COURSES_PER_RUN,
    MAX_PDF_BYTES,
    MAX_TOTAL_PDF_BYTES,
    MAX_FILES_FOR_PICK,
    MIN_SYLLABUS_TEXT_CHARS,
    PDF_PERMISSION_ORIGIN,
    SYSTEM_PROMPT,
    USER_PROMPT,
    resolveConfig,
    shouldAnalyze,
    nextRecord,
    courseStatus,
    findSyllabusByKeyword,
    extractFileIds,
    stripHtml,
    parseAnalysisResponse,
    normalizeWeights,
    toCustomWeights,
    buildFilePickPrompt,
    parseFilePick,
    pickSource,
  };
});

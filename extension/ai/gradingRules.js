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
  const MAX_COURSES_PER_RUN = 10;               // 每輪最多處理幾門課
  const MAX_PDF_BYTES = 10 * 1024 * 1024;       // 單檔上限
  // 累計上限：base64 膨脹 4/3 → 約 16MB，加上文字與 JSON 包裝仍低於 Gemini 20MB 請求上限（15MB 會剛好撞頂）
  const MAX_TOTAL_PDF_BYTES = 12 * 1024 * 1024;
  const MAX_FILES_FOR_PICK = 60;                // AI 挑檔時最多列幾個檔名
  const MIN_SYLLABUS_TEXT_CHARS = 50;           // syllabus 文字短於此不算材料
  // pdf.js 抽出的文字上限：約數十頁大綱，同時不把單次 LLM 請求的 token 預算撐爆（超過就截斷，大綱重點通常在前段）
  const MAX_EXTRACTED_TEXT_CHARS = 30000;
  const WEIGHT_SUM_MIN = 80;                    // 權重總和合理區間
  const WEIGHT_SUM_MAX = 120;
  const PDF_PERMISSION_ORIGIN = 'https://*.canvas-user-content.com/*';

  // hostPermission（選填）：該供應商的端點不回 CORS header，必須靠 Chrome host permission 略過 CORS。
  // 沒有這個欄位（gemini／qwen／deepseek）代表供應商自己有開 CORS，純 fetch 就能呼叫，不佔任何權限。
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
      // deepseek-chat／deepseek-reasoner 是舊別名，官方公告 2026-07-24 停用，改用 v4 名稱
      defaultModel: 'deepseek-v4-flash',
      supportsPdf: false,
      keyPlaceholder: 'sk-...',
    },
    nvidia: {
      label: 'NVIDIA NIM',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      defaultModel: 'deepseek-ai/deepseek-v4-flash-0731',
      supportsPdf: false,
      keyPlaceholder: 'nvapi-...',
      // NVIDIA 端點完全不回 CORS header（連一般網頁來源也不回），純 fetch 一定被瀏覽器擋掉；
      // 宣告 host permission 可讓 Chrome 直接略過 CORS 檢查（走 optional，儲存設定時才請求）
      hostPermission: 'https://integrate.api.nvidia.com/*',
    },
  };

  // 該供應商需要哪些 host permission（供 modal 一次請求、runner 檢查是否已授權）
  function providerHostPermission(provider) {
    const p = PROVIDERS[provider];
    return (p && p.hostPermission) || null;
  }

  // 儲存設定時要一次請求的 origins：供應商自己的 host（若需要）＋ PDF 下載（所有供應商都要）。
  // 純文字供應商現在也會下載 PDF 大綱、用 pdf.js 抽字，故不再看 supportsPdf
  function requiredOrigins(provider) {
    const p = PROVIDERS[provider] || PROVIDERS.gemini;
    const out = [];
    if (p.hostPermission) out.push(p.hostPermission);
    out.push(PDF_PERMISSION_ORIGIN);
    return out;
  }

  // ── 設定 ──
  function resolveConfig(stored) {
    const s = stored && typeof stored === 'object' ? stored : {};
    const provider = PROVIDERS[s.provider] ? s.provider : 'gemini';
    const def = PROVIDERS[provider];
    const apiKey = typeof s.apiKey === 'string' ? s.apiKey.trim() : '';
    const model = (typeof s.model === 'string' && s.model.trim()) || def.defaultModel;
    // baseUrl 只有 OpenAI 相容路徑會用到（spec §4.1）；gemini 一律用官方端點，
    // 免得切換供應商後殘留的自訂 baseUrl 把 Gemini key 送去別家。
    // 自訂端點只收 https：http:// 會把 Authorization: Bearer <key> 用明文送出。
    const custom = typeof s.baseUrl === 'string' ? s.baseUrl.trim() : '';
    const baseUrl = provider === 'gemini'
      ? def.baseUrl
      : ((/^https:\/\//i.test(custom) && custom) || def.baseUrl);
    return { provider, apiKey, model, baseUrl, configured: apiKey !== '' };
  }

  // ── 只跑一次規則 ──
  // 課程關掉「依組別加權」（apply_assignment_group_weights === false）時殘留的 group_weight 不算數：
  // 與 dashboard 的 courseUsesGroupWeights 一致（QA #93），那種課圓餅顯示「沒有評分資訊」，要讓 AI 補上
  function hasCanvasWeights(groups, course) {
    if (course && course.apply_assignment_group_weights === false) return false;
    return Array.isArray(groups) && groups.some((g) => g && Number(g.group_weight) > 0);
  }

  // 沒有冷卻期、沒有次數上限：只要這門課目前沒有權重就每次同步都試（2026-09-03）。
  // 不特別擋「record.status === done」：done 之所以不重跑，是因為 done 一定會把權重寫進
  // customWeights，下面的 hasCustomWeights 就會擋掉；使用者按「還原 Canvas 權重」把
  // customWeights 清空後，這裡會自然放行重跑，不需要另外清「分析紀錄」
  function shouldAnalyze({ courseId, customWeights, groups, record, course }) {
    const cw = customWeights && customWeights[courseId];
    if (Array.isArray(cw) && cw.length > 0) return { run: false, reason: 'hasCustomWeights' };
    if (hasCanvasWeights(groups, course)) return { run: false, reason: 'hasCanvasWeights' };
    return { run: true, reason: record ? 'retry' : 'first' };
  }

  // outcome: { kind: 'done'|'notFound'|'error', source, components?, notes?, error? }
  function nextRecord(prev, outcome, now, meta) {
    const attempts = ((prev && prev.attempts) || 0) + 1; // 純資訊用途（modal 不顯示），不再拿來擋重試
    // status 只會是這三個值；未知 kind 一律當 error
    const kind = outcome.kind === 'done' || outcome.kind === 'notFound' ? outcome.kind : 'error';
    const rec = {
      status: kind,
      attempts,
      at: new Date(now).toISOString(),
      source: outcome.source || 'none',
      provider: meta && meta.provider,
      model: meta && meta.model,
    };
    if (kind === 'done') {
      rec.components = outcome.components;
    } else if (kind === 'notFound') {
      if (outcome.notes) rec.notes = String(outcome.notes).slice(0, 200);
    } else {
      rec.error = String(outcome.error || 'unknown error').slice(0, 200);
    }
    return rec;
  }

  // modal 狀態列用：done | notFound | error | skipped | pending
  // 「還會不會再跑」跟「上次結果是什麼」是兩件事——沒有冷卻期後 shouldAnalyze 對任何未 done
  // 的紀錄都回 run:true，所以這裡不能再借用它的結果來判斷顯示，直接看 record 本身
  function courseStatus({ courseId, customWeights, groups, record, course }) {
    // done 要最先判斷：AI 分析成功後權重就寫進 customWeights，這門課從此也會落入下面的
    // hasCustomWeights 分支，先判斷 record.status 才不會把「AI 分析完成」誤顯示成「使用者手動設定」
    if (record && record.status === 'done') return 'done';
    const cw = customWeights && customWeights[courseId];
    if (Array.isArray(cw) && cw.length > 0) return 'skipped';
    if (hasCanvasWeights(groups, course)) return 'skipped';
    if (!record) return 'pending';
    if (record.status === 'notFound' || record.status === 'error') return record.status;
    return 'skipped'; // 髒紀錄（未知 status）：modal 只認得固定幾種
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

  // ── PDF 取用判準（純函式；實際 fetch 在 analysisRunner.tryFetchPdf）──
  // 讀 body 之前就能判死的情況：宣告長度已超上限，或型別明擺著是網頁／JSON（Canvas 未登入會回登入頁）
  function rejectBeforeDownload({ contentType, contentLength, maxBytes } = {}) {
    const limit = Number.isFinite(maxBytes) ? maxBytes : MAX_PDF_BYTES;
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > limit) return true;
    const ct = String(contentType || '').toLowerCase();
    return ct.includes('text/html') || ct.includes('application/json');
  }

  // 讀完 body 後才判得準的：Content-Type 含 pdf 或前 5 bytes 為 %PDF-，且大小在 (0, maxBytes]
  function acceptPdf({ ok, contentType, byteLength, head, maxBytes } = {}) {
    if (!ok) return false;
    const limit = Number.isFinite(maxBytes) ? maxBytes : MAX_PDF_BYTES;
    if (!Number.isFinite(byteLength) || byteLength <= 0 || byteLength > limit) return false;
    return String(contentType || '').toLowerCase().includes('pdf') || head === '%PDF-';
  }

  // Gemini inlineData 要 base64；分段避免 String.fromCharCode.apply 參數過多爆堆疊
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
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
    MAX_COURSES_PER_RUN,
    MAX_PDF_BYTES,
    MAX_TOTAL_PDF_BYTES,
    MAX_FILES_FOR_PICK,
    MIN_SYLLABUS_TEXT_CHARS,
    MAX_EXTRACTED_TEXT_CHARS,
    PDF_PERMISSION_ORIGIN,
    SYSTEM_PROMPT,
    USER_PROMPT,
    providerHostPermission,
    requiredOrigins,
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
    rejectBeforeDownload,
    acceptPdf,
    arrayBufferToBase64,
  };
});

// ═══════════════════════════════════════════════════════════════
// Due AI 評分比重分析：service worker 側編排
// 由 background.js 以 importScripts 載入，與 background.js 同屬 worker 全域：
//   - 依賴 DueGradingRules / DueAiProviders（先 importScripts）
//   - 直接呼叫 background.js 的 fetchJSON(url) / fetchAllPages(url)（帶 cookie 的 Canvas fetch）
//   - BASE_URL 由呼叫端傳入，這裡不讀 background.js 的變數
// 只跑一次規則、重試冷卻、寫入 customWeights 的邏輯見 DueGradingRules 與 spec §5–§6
// ═══════════════════════════════════════════════════════════════

let _aiAnalyzing = false; // 全域鎖：新手教學期間連續多次 SYNC 不會疊跑
// AI_RESET_ANALYSIS 會遞增：分析途中被重置時，in-flight 那輪的結果不得寫回剛清空的 map
let _aiResetEpoch = 0;

// Gemini 2.5 的 thinking token 也算進 maxOutputTokens，額度太小會只回 finishReason:MAX_TOKENS 沒有正文
const AI_MAX_TOKENS_MAIN = 8192;  // 主分析：要留得下 thinking ＋ 完整 JSON
const AI_MAX_TOKENS_SMALL = 512;  // 測試連線／挑檔：正文極短，但仍要留 thinking 空間
const MAX_LINKED_PDFS = 5;        // 大綱頁可能連結很多檔案，位元組上限只擋使用不擋下載

// 同步完成後由 syncAll 呼叫：不 await、不阻塞 SYNC 回應、不持有 _syncing
function scheduleGradingAnalysis(baseUrl) {
  setTimeout(() => {
    runPendingGradingAnalysis(baseUrl).catch((err) => console.error('[Due][AI] 分析失敗:', err));
  }, 0);
}

async function aiResolveBaseUrl(baseUrl) {
  if (baseUrl) return baseUrl;
  // SW 剛喚醒時 background.js 的 BASE_URL 可能還沒回填
  const { canvasBaseUrl } = await chrome.storage.local.get(['canvasBaseUrl']);
  return canvasBaseUrl || '';
}

async function aiHasPdfPermission() {
  try {
    if (!chrome.permissions || !chrome.permissions.contains) return false;
    return await chrome.permissions.contains({ origins: [DueGradingRules.PDF_PERMISSION_ORIGIN] });
  } catch (_) {
    return false;
  }
}

async function runPendingGradingAnalysis(baseUrlHint) {
  if (_aiAnalyzing) return;
  // 旗標必須在守衛之後「同步」設定：中間若有 await，同一個 tick 內的兩次觸發會雙雙通過守衛而疊跑
  _aiAnalyzing = true;
  const epoch = _aiResetEpoch; // 這輪開始時的世代；使用者中途重置就作廢
  try {
    const { aiConfig } = await chrome.storage.local.get(['aiConfig']);
    const cfg = DueGradingRules.resolveConfig(aiConfig);
    if (!cfg.configured) return; // 沒 key：整個功能沉默
    const baseUrl = await aiResolveBaseUrl(baseUrlHint);
    if (!baseUrl) return;

    const data = await chrome.storage.local.get(['courses', 'customWeights', 'assignmentGroups', 'gradingAnalysis']);
    const courses = Array.isArray(data.courses) ? data.courses : [];
    const now = Date.now();
    const todo = courses
      .filter((c) => DueGradingRules.shouldAnalyze({
        courseId: c.id,
        customWeights: data.customWeights || {},
        groups: (data.assignmentGroups || {})[c.id] || [],
        record: (data.gradingAnalysis || {})[c.id],
        now,
      }).run)
      .slice(0, DueGradingRules.MAX_COURSES_PER_RUN);
    if (!todo.length) return;

    const pdfAllowed = await aiHasPdfPermission();
    console.log(`[Due][AI] 待分析 ${todo.length} 門課（PDF 權限：${pdfAllowed}）`);

    for (const course of todo) {
      // 使用者中途按了「清除分析紀錄」：剩下的課不再花額度（結果反正會被 epoch 守衛丟掉），finally 會補排一輪
      if (epoch !== _aiResetEpoch) break;
      let outcome;
      try {
        outcome = await analyzeCourse(course, cfg, { baseUrl, pdfAllowed });
      } catch (err) {
        outcome = { kind: 'error', source: 'none', error: err && err.message ? err.message : String(err) };
      }
      await recordOutcome(course.id, outcome, cfg, epoch);
    }
  } finally {
    _aiAnalyzing = false;
    // 執行中被 AI_RESET_ANALYSIS 作廢：那次 reset 排的補跑撞到鎖而直接返回了，
    // 這裡補排一輪（每輪重新取 epoch，必然收斂），否則所有課會停在 pending 沒人再跑
    if (epoch !== _aiResetEpoch) scheduleGradingAnalysis(baseUrlHint);
  }
}

// 每門課寫入前重新讀 storage（舊版一次讀整個 map 再寫回，多課會互相覆蓋）。
// 這個逐課重讀是刻意的：chrome.storage 沒有交易，get 與 set 之間仍留有次毫秒的窗口——
// 恰好同時發生的權重編輯器存檔仍可能被蓋掉。已知且接受的取捨，別為了「優化」把重讀改回一次性讀取。
async function recordOutcome(courseId, outcome, cfg, epoch) {
  // 這輪跑到一半使用者按了「重新分析」→ 紀錄已清空，舊結果不該寫回去
  if (epoch !== undefined && epoch !== _aiResetEpoch) {
    console.log(`[Due][AI] 課程 ${courseId}: 略過寫入（分析期間使用者已重置紀錄）`);
    return;
  }
  const data = await chrome.storage.local.get(['gradingAnalysis', 'customWeights']);
  const all = data.gradingAnalysis || {};
  all[courseId] = DueGradingRules.nextRecord(all[courseId], outcome, Date.now(), { provider: cfg.provider, model: cfg.model });
  const toSet = { gradingAnalysis: all };

  let weights = null;
  if (outcome.kind === 'done') {
    const cw = data.customWeights || {};
    const existing = cw[courseId];
    // 分析期間使用者若已手動填了權重，不覆蓋（仍記 done）
    if (!(Array.isArray(existing) && existing.length > 0)) {
      weights = DueGradingRules.toCustomWeights(outcome.components);
      cw[courseId] = weights;
      toSet.customWeights = cw;
    }
  }
  // 寫入前再驗一次：get 與 set 之間（含上面的 await）仍可能發生重置，窗口越窄越好
  if (epoch !== undefined && epoch !== _aiResetEpoch) {
    console.log(`[Due][AI] 課程 ${courseId}: 放棄寫入（讀取後、寫入前使用者已重置紀錄）`);
    return;
  }
  await chrome.storage.local.set(toSet);
  console.log(`[Due][AI] 課程 ${courseId}: ${outcome.kind} (${outcome.source})`);

  if (weights) {
    try {
      await chrome.runtime.sendMessage({ type: 'GRADING_WEIGHTS_UPDATED', courseId, weights });
    } catch (_) {
      // dashboard 沒開是常態，沒有接收者會 reject
    }
  }
}

// 回 outcome：{ kind:'done', source, components } | { kind:'notFound', source, notes } | { kind:'error', source, error }
async function analyzeCourse(course, cfg, ctx) {
  const R = DueGradingRules;
  const parts = [];
  const flags = { syllabusPdf: false, keywordPdf: false, aiPdf: false, syllabusText: false };
  let pdfBudget = R.MAX_TOTAL_PDF_BYTES;
  const wantPdf = ctx.pdfAllowed && DueAiProviders.supportsPdf(cfg.provider); // 純文字供應商不下載 PDF
  const pushPdf = (pdf) => {
    if (!pdf || pdf.bytes > pdfBudget) return false;
    pdfBudget -= pdf.bytes;
    parts.push(pdf);
    return true;
  };

  // Step 1：syllabus 文字（只用 API 的 syllabus_body；不抓整頁 HTML）
  let syllabusBody = '';
  try {
    const c = await fetchJSON(`${ctx.baseUrl}/api/v1/courses/${course.id}?include[]=syllabus_body`);
    syllabusBody = c && typeof c.syllabus_body === 'string' ? c.syllabus_body : '';
  } catch (_) { }

  const fetchedIds = new Set();
  if (syllabusBody.trim()) {
    // Step 2：syllabus 內連結的 PDF
    if (wantPdf) {
      // 只試前 MAX_LINKED_PDFS 個：未嘗試的 id 不進 fetchedIds，Step 3 仍可考慮
      for (const fid of R.extractFileIds(syllabusBody).slice(0, MAX_LINKED_PDFS)) {
        fetchedIds.add(String(fid));
        const pdf = await tryFetchPdf(`${ctx.baseUrl}/courses/${course.id}/files/${fid}/download?download_frd=1`);
        if (pushPdf(pdf)) flags.syllabusPdf = true;
      }
    }
    const text = R.stripHtml(syllabusBody);
    if (text.length > R.MIN_SYLLABUS_TEXT_CHARS) {
      parts.push({ type: 'text', text: `Course Syllabus:\n${text}` });
      flags.syllabusText = true;
    }
  }

  // Step 3：課程檔案（關鍵字 → AI 挑檔）
  if (wantPdf) {
    let files = [];
    try {
      files = await fetchAllPages(`${ctx.baseUrl}/api/v1/courses/${course.id}/files?per_page=50&content_types[]=application/pdf`);
    } catch (_) {
      files = []; // 401/403（課程關閉檔案頁）視為沒有檔案
    }
    files = (Array.isArray(files) ? files : []).filter((f) => f && !fetchedIds.has(String(f.id)));
    if (files.length) {
      let picked = R.findSyllabusByKeyword(files);
      let viaAi = false;
      if (!picked) {
        picked = await selectSyllabusPdfWithAI(files, cfg);
        viaAi = !!picked;
      }
      if (picked) {
        let pdf = picked.url ? await tryFetchPdf(picked.url) : null;
        if (!pdf) {
          // 簽名 URL 過期 → 重抓 metadata 拿新 URL
          try {
            const meta = await fetchJSON(`${ctx.baseUrl}/api/v1/files/${picked.id}`);
            if (meta && meta.url) pdf = await tryFetchPdf(meta.url);
          } catch (_) { }
        }
        if (pushPdf(pdf)) {
          if (viaAi) flags.aiPdf = true;
          else flags.keywordPdf = true;
        }
      }
    }
  }

  const source = R.pickSource(flags);
  if (!parts.length) return { kind: 'notFound', source: 'none', notes: 'no syllabus material' };

  parts.push({ type: 'text', text: R.USER_PROMPT });
  // 供應商 HTTP／網路錯誤在這裡收斂成 outcome，才留得住 source（丟到外層 catch 會退化成 'none'）
  let raw;
  try {
    raw = await callProvider(cfg, parts, R.SYSTEM_PROMPT, { temperature: 0, maxTokens: AI_MAX_TOKENS_MAIN });
  } catch (err) {
    return { kind: 'error', source, error: err && err.message ? err.message : String(err) };
  }
  const parsed = R.parseAnalysisResponse(raw);
  if (!parsed.ok) return { kind: 'error', source, error: `bad response: ${parsed.error}` };
  if (!parsed.found) return { kind: 'notFound', source, notes: parsed.notes || 'no grading breakdown found' };
  const norm = R.normalizeWeights(parsed.components);
  if (!norm.ok) return { kind: 'notFound', source, notes: norm.reason };
  return { kind: 'done', source, components: norm.components };
}

async function selectSyllabusPdfWithAI(files, cfg) {
  try {
    const raw = await callProvider(
      cfg,
      [{ type: 'text', text: DueGradingRules.buildFilePickPrompt(files) }],
      'Return only valid JSON, no explanation.',
      { temperature: 0, maxTokens: AI_MAX_TOKENS_SMALL }
    );
    return DueGradingRules.parseFilePick(raw, files);
  } catch (_) {
    return null;
  }
}

// 只接受真的 PDF：Content-Type 含 pdf 或前 5 bytes 為 %PDF-；單檔 ≤ MAX_PDF_BYTES（判準見 gradingRules）
async function tryFetchPdf(url) {
  const R = DueGradingRules;
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const contentType = res.headers.get('Content-Type');
    // 先看 header：宣告長度已超上限、或根本是網頁／JSON（未登入時 Canvas 會回登入頁）就別把 body 讀進記憶體。
    // 只在伺服器有宣告 Content-Length／Content-Type 時擋得到（Canvas／S3 都有宣告）；
    // 沒宣告的超大 body 仍會整份讀進來，由下面的 acceptPdf 事後擋掉
    if (R.rejectBeforeDownload({
      contentType,
      contentLength: res.headers.get('Content-Length'),
      maxBytes: R.MAX_PDF_BYTES,
    })) return null;
    const buf = await res.arrayBuffer();
    const head = String.fromCharCode(...new Uint8Array(buf.slice(0, 5)));
    if (!R.acceptPdf({ ok: true, contentType, byteLength: buf.byteLength, head, maxBytes: R.MAX_PDF_BYTES })) return null;
    return { type: 'pdf', base64: R.arrayBufferToBase64(buf), mimeType: 'application/pdf', bytes: buf.byteLength };
  } catch (_) {
    return null;
  }
}

async function callProvider(cfg, parts, systemPrompt, opts) {
  const req = DueAiProviders.buildRequest(cfg, parts, systemPrompt, opts);
  // MV3 SW 閒置 30 秒會被回收，長 LLM 呼叫期間定期呼叫擴充 API 重置計時器
  const keepAlive = (chrome.runtime && chrome.runtime.getPlatformInfo)
    ? setInterval(() => { try { chrome.runtime.getPlatformInfo(() => { }); } catch (_) { } }, 20000)
    : null;
  try {
    let res;
    try {
      res = await fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) });
    } catch (err) {
      // fetch 本身丟錯（拿不到 HTTP 狀態碼）：多半是供應商未對擴充功能來源開放 CORS，或離線；
      // 給可辨識的訊息，讓 modal 狀態列能與「key 錯」區分
      throw new Error(`${cfg.provider} network/CORS error: ${err && err.message ? err.message : String(err)}`);
    }
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`${cfg.provider} API ${res.status}: ${t.slice(0, 160)}`);
    }
    const json = await res.json();
    return DueAiProviders.extractText(cfg.provider, json);
  } finally {
    clearInterval(keepAlive);
  }
}

// ── AI_* 訊息（由 background.js 的 onMessage 轉交；回傳值即 onMessage 的回傳值）──
function handleAiMessage(message, sendResponse, baseUrl) {
  // 一律用 then(onOk, onErr) 兩參數形式：sendResponse 自己丟錯時（port 已斷）
  // 不會再被 catch 接住而重複呼叫一次
  if (message.type === 'AI_GET_STATUS') {
    aiGetStatus().then(sendResponse, (err) => sendResponse({ error: err.message }));
    return true;
  }
  if (message.type === 'AI_TEST_CONNECTION') {
    // 一定要回覆：漏掉 sendResponse 會讓 modal 的「測試連線」永遠轉圈
    aiTestConnection(message.config)
      .then(sendResponse, () => sendResponse({ success: false, error: 'internal error' }));
    return true;
  }
  if (message.type === 'AI_RUN_NOW') {
    scheduleGradingAnalysis(baseUrl);
    sendResponse({ success: true });
    return false;
  }
  if (message.type === 'AI_RESET_ANALYSIS') {
    // 世代先加：正在跑的那輪之後就不會把結果寫回這裡清空的 map
    _aiResetEpoch++;
    // 只清分析紀錄；不動 customWeights（使用者要還原權重走編輯器的「還原 Canvas 權重」）
    chrome.storage.local.set({ gradingAnalysis: {} })
      .then(
        () => {
          scheduleGradingAnalysis(baseUrl);
          sendResponse({ success: true });
        },
        () => sendResponse({ success: false, error: 'internal error' })
      );
    return true;
  }
  return false;
}

async function aiGetStatus() {
  const data = await chrome.storage.local.get(['aiConfig', 'courses', 'customWeights', 'assignmentGroups', 'gradingAnalysis']);
  const cfg = DueGradingRules.resolveConfig(data.aiConfig);
  const records = data.gradingAnalysis || {};
  const now = Date.now();
  const courses = (Array.isArray(data.courses) ? data.courses : []).map((c) => {
    const record = records[c.id];
    const status = DueGradingRules.courseStatus({
      courseId: c.id,
      customWeights: data.customWeights || {},
      groups: (data.assignmentGroups || {})[c.id] || [],
      record,
      now,
    });
    return { courseId: c.id, status, at: record ? record.at : null, error: record && record.error ? record.error : null };
  });
  // 上次執行時間＝所有紀錄中最新的 at
  const lastRunAt = Object.values(records).reduce((m, r) => (r && r.at && (!m || r.at > m) ? r.at : m), null);
  return {
    configured: cfg.configured,
    provider: cfg.provider,
    model: cfg.model,
    pdfPermission: await aiHasPdfPermission(),
    running: _aiAnalyzing,
    lastRunAt,
    courses,
  };
}

async function aiTestConnection(rawConfig) {
  const cfg = DueGradingRules.resolveConfig(rawConfig);
  if (!cfg.configured) return { success: false, error: 'NO_API_KEY' };
  try {
    await callProvider(cfg, [{ type: 'text', text: 'Reply with the single word OK.' }], '', { maxTokens: AI_MAX_TOKENS_SMALL });
    return { success: true };
  } catch (err) {
    return { success: false, error: String((err && err.message) || err).slice(0, 200) };
  }
}

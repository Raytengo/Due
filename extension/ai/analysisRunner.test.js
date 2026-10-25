// analysisRunner.js 的編排契約測試：用 node:vm 模擬 service worker 全域
// （importScripts 的三個檔案同屬一個 global，chrome.* / fetch / fetchJSON / fetchAllPages 都是 stub）
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

async function test(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

// vm realm 的物件原型與本 realm 不同，deepStrictEqual 會失敗 → 先轉成本 realm 的純資料
const plain = (v) => JSON.parse(JSON.stringify(v));

const BASE = 'https://school.instructure.com';
const SYLLABUS_HTML =
  '<h2>Grading</h2><table><tr><td>Homework</td><td>30%</td></tr><tr><td>Midterm</td><td>30%</td></tr>' +
  '<tr><td>Final Exam</td><td>40%</td></tr></table><p>Late work loses 10% per day; attendance required.</p>';
const LLM_JSON =
  '```json\n{"found":true,"components":[{"name":"Homework","weight":"30%"},' +
  '{"name":"Midterm","weight":30},{"name":"Final Exam","weight":40}]}\n```';
const WEIGHTS = [{ name: 'Homework', weight: 30 }, { name: 'Midterm', weight: 30 }, { name: 'Final Exam', weight: 40 }];
// pdf.js 抽出來的文字（夠長，超過 MIN_SYLLABUS_TEXT_CHARS）
const EXTRACTED = 'Grading: Homework 30%, Midterm 30%, Final Exam 40%. Attendance is required for all sessions.';

// ── 可變的測試狀態 ──
const PDF_HEADERS = { 'content-type': 'application/pdf' };
// 每次都給全新的陣列：共用同一份物件會讓 llm/fetches 跨測試累積
const PDF_ORIGIN = 'https://*.canvas-user-content.com/*';
const NVIDIA_ORIGIN = 'https://integrate.api.nvidia.com/*';
const defaults = () => ({
  sets: 0, pdfPermission: true, sent: [], fetches: [], llm: [], syllabus: '', files: [],
  // 已授權的 origin 清單；預設由 pdfPermission 推導（只有 PDF 那個 origin），
  // 需要驗供應商自己的 host permission 時由測試明確給
  grantedOrigins: null,
  llmStatus: 200, llmText: LLM_JSON,
  // DuePdfText.extractText 的回傳（真的 pdf.js 太重，這裡只驗編排；抽字本身見 pdfText.test.js）
  extractedText: '',
  bodyReads: 0,          // arrayBuffer() 被呼叫幾次（驗「下載前就拒絕」時不讀 body）
  pdfHeaders: PDF_HEADERS,
  llmGate: null,         // 設成 promise 可把 LLM 回應卡住，模擬「分析途中」
  llmThrow: false,       // fetch 本身丟 TypeError（CORS 被擋／離線），而不是回 HTTP 狀態碼
  platformInfo: 0,       // keepalive 呼叫 chrome.runtime.getPlatformInfo 的次數
  failNextSet: false,    // 下一次 storage.local.set 丟錯
  afterGet: null,        // 每次 storage.local.get 回覆前呼叫：可在 get 與 set 之間插入事件
});
const S = { store: {}, ...defaults() };
function reset(store, over) {
  Object.assign(S, { store }, defaults(), over || {});
}
const res = (status, body, headers) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (k) => (headers || {})[String(k).toLowerCase()] || null },
  json: async () => body,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  arrayBuffer: async () => { S.bodyReads++; return body; },
});

async function fakeFetch(url, init) {
  const u = String(url);
  S.fetches.push({ url: u, init: init || {} });
  if (u.includes(':generateContent') || u.includes('/chat/completions')) {
    S.llm.push({ url: u, method: (init || {}).method, headers: (init || {}).headers, body: JSON.parse((init || {}).body) });
    if (S.llmGate) await S.llmGate; // 手動放行：測試「分析途中」的行為
    if (S.llmThrow) throw new TypeError('Failed to fetch');
    if (S.llmStatus !== 200) return res(S.llmStatus, 'provider exploded');
    // llmText 可給函式：同一輪裡「AI 挑檔」與「主分析」要回不同內容時用
    const body = (init || {}).body;
    const text = typeof S.llmText === 'function' ? S.llmText(String(body)) : S.llmText;
    return res(200, u.includes(':generateContent')
      ? { candidates: [{ content: { parts: [{ text }] } }] }
      : { choices: [{ message: { content: text } }] });
  }
  if (/\/api\/v1\/courses\/\d+\?/.test(u)) return res(200, { id: 1, syllabus_body: S.syllabus });
  if (u.includes('/files?')) return res(200, S.files, { link: '' });
  if (u.includes('/files/')) {
    const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(64, 0x41)]);
    return res(200, pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength), S.pdfHeaders);
  }
  return res(404, {});
}
// background.js 的兩個 helper（同樣的語意）
async function fetchJSON(url) {
  const r = await fakeFetch(url, { credentials: 'include' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function fetchAllPages(url) {
  const out = [];
  let next = url;
  while (next) {
    const r = await fakeFetch(next, { credentials: 'include' });
    if (!r.ok) throw new Error(`Canvas API error: ${r.status}`);
    out.push(...(await r.json()));
    const m = (r.headers.get('Link') || '').match(/<([^>]+)>;\s*rel="next"/);
    next = m ? m[1] : null;
  }
  return out;
}

const sandbox = {
  chrome: {
    storage: {
      local: {
        get: async (keys) => {
          const list = Array.isArray(keys) ? keys : [keys];
          const out = {};
          // 真的 chrome.storage 會跨邊界結構化複製：拿到的物件改了也不會動到 store，一定要 set 才算數
          for (const k of list) if (k in S.store) out[k] = structuredClone(S.store[k]);
          if (S.afterGet) await S.afterGet(list);
          return out;
        },
        set: async (obj) => {
          if (S.failNextSet) { S.failNextSet = false; throw new Error('QUOTA_BYTES quota exceeded'); }
          S.sets++;
          Object.assign(S.store, obj);
        },
      },
    },
    permissions: {
      contains: async (q) => {
        const granted = S.grantedOrigins || (S.pdfPermission ? [PDF_ORIGIN] : []);
        return ((q && q.origins) || []).every((o) => granted.includes(o));
      },
    },
    runtime: {
      sendMessage: async (msg) => {
        S.sent.push(msg);
        throw new Error('Could not establish connection. Receiving end does not exist.'); // dashboard 沒開是常態
      },
      // keepalive 用；被呼叫代表 20 秒的 interval 真的跑過一次
      getPlatformInfo: (cb) => { S.platformInfo++; if (cb) cb({ os: 'mac' }); },
    },
  },
  fetch: fakeFetch,
  fetchJSON,
  fetchAllPages,
  // ai/pdfText.js 的替身（不載入 1.5MB 的 vendor pdf.js）
  DuePdfText: { extractText: async () => S.extractedText },
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  console: { log() { }, warn() { }, error() { } },
  setTimeout,
  setInterval,
  clearInterval,
  Date,
};
const ctx = vm.createContext(sandbox);
for (const f of ['gradingRules.js', 'providers.js', 'analysisRunner.js']) {
  const file = path.join(__dirname, f);
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
}
const run = (base) => sandbox.runPendingGradingAnalysis(base);

(async () => {
  await test('沒有 aiConfig：零 fetch、零寫入', async () => {
    reset({ courses: [{ id: 101, name: 'C1' }] });
    await run(BASE);
    assert.equal(S.fetches.length, 0);
    assert.equal(S.sets, 0);
    assert.equal(S.store.gradingAnalysis, undefined);
  });

  reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 101, name: 'C1' }], customWeights: {} }, { syllabus: SYLLABUS_HTML });
  await test('gemini 成功：寫 customWeights、done/syllabus_body、一次 LLM POST、key 只在 header、發出 GRADING_WEIGHTS_UPDATED', async () => {
    await run(BASE);
    assert.deepEqual(plain(S.store.customWeights[101]), WEIGHTS);
    assert.equal(S.store.gradingAnalysis[101].status, 'done');
    assert.equal(S.store.gradingAnalysis[101].source, 'syllabus_body');
    assert.equal(S.store.gradingAnalysis[101].attempts, 1);
    assert.equal(S.llm.length, 1);
    assert.equal(S.llm[0].method, 'POST');
    assert.equal(S.llm[0].url.includes('k'), false, S.llm[0].url); // key 不進 URL
    assert.equal(S.llm[0].headers['x-goog-api-key'], 'k');
    assert.equal(S.llm[0].body.generationConfig.maxOutputTokens, 8192); // Gemini 2.5 thinking 預留
    assert.deepEqual(plain(S.sent), [{ type: 'GRADING_WEIGHTS_UPDATED', courseId: 101, weights: WEIGHTS }]);
  });

  const doneSnapshot = structuredClone(S.store);

  await test('只跑一次：再跑一輪零 LLM 呼叫、attempts 不變', async () => {
    S.llm = [];
    await run(BASE);
    assert.equal(S.llm.length, 0);
    assert.equal(S.store.gradingAnalysis[101].attempts, 1);
  });

  await test('AI_GET_STATUS：configured 為 true，該課 status 為 done', async () => {
    S.store = structuredClone(doneSnapshot);
    const resp = await new Promise((resolve) => {
      const kept = sandbox.handleAiMessage({ type: 'AI_GET_STATUS' }, resolve, BASE);
      assert.equal(kept, true); // 非同步回覆必須回 true
    });
    assert.equal(resp.configured, true);
    assert.equal(resp.courses.find((c) => c.courseId === 101).status, 'done');
  });

  await test('全域鎖：同一 tick 連呼兩次只跑一輪（只有一次 LLM 呼叫）', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 404, name: 'C4' }], customWeights: {} }, { syllabus: SYLLABUS_HTML });
    const a = run(BASE);
    const b = run(BASE); // 不 await 第一個：修好前兩邊都會通過守衛
    await Promise.all([a, b]);
    assert.equal(S.llm.length, 1);
    assert.equal(S.store.gradingAnalysis[404].attempts, 1);
  });

  await test('純文字供應商（deepseek）：課程檔案是 PDF 大綱 → 照樣下載、抽字後送純文字 part', async () => {
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 202, name: 'C2' }], customWeights: {} }, {
      syllabus: '', files: [{ id: 9, display_name: 'Syllabus.pdf', url: `${BASE}/files/9/download` }],
      extractedText: EXTRACTED,
    });
    await run(BASE);
    assert.equal(S.fetches.filter((f) => f.url.includes('/files/9/download')).length, 1, '純文字供應商也要下載 PDF');
    assert.ok(S.bodyReads > 0);
    assert.equal(S.llm.length, 1);
    const sent = S.llm[0].body.messages.map((m) => m.content).join('\n');
    assert.ok(sent.includes(EXTRACTED), '抽出來的文字要進 prompt');
    assert.equal(JSON.stringify(S.llm[0].body).includes('inlineData'), false); // 不是原始 PDF 路徑
    assert.equal(S.store.gradingAnalysis[202].status, 'done');
    assert.equal(S.store.gradingAnalysis[202].source, 'keyword_pdf');
    assert.deepEqual(plain(S.store.customWeights[202]), WEIGHTS);
  });

  await test('純文字供應商（deepseek）：syllabus_body 內連 PDF → 下載並抽字，文字進 prompt', async () => {
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 203, name: 'C2b' }], customWeights: {} }, {
      syllabus: '<a href="/courses/203/files/9/download">Syllabus PDF</a>',
      extractedText: EXTRACTED,
    });
    await run(BASE);
    assert.equal(S.fetches.filter((f) => f.url.includes('/files/9/download')).length, 1);
    assert.equal(S.llm.length, 1);
    assert.ok(S.llm[0].body.messages.map((m) => m.content).join('\n').includes(EXTRACTED));
    assert.equal(S.store.gradingAnalysis[203].status, 'done');
    assert.equal(S.store.gradingAnalysis[203].source, 'syllabus_pdf');
    assert.deepEqual(plain(S.store.customWeights[203]), WEIGHTS);
  });

  await test('純文字供應商：抽字失敗（掃描件）且無其他材料 → notFound: no syllabus material，不打 LLM', async () => {
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 204, name: 'C2c' }], customWeights: {} }, {
      syllabus: '<a href="/courses/204/files/9/download">Syllabus PDF</a>', // 純連結，文字太短不算材料
      extractedText: '',
    });
    await run(BASE);
    assert.equal(S.fetches.filter((f) => f.url.includes('/files/9/download')).length, 1, '仍會下載，只是抽不到字');
    assert.equal(S.llm.length, 0, '沒材料就不該花額度');
    assert.equal(S.store.gradingAnalysis[204].status, 'notFound');
    assert.equal(S.store.gradingAnalysis[204].source, 'none');
    assert.equal(S.store.gradingAnalysis[204].notes, 'no syllabus material');
    assert.equal(S.store.customWeights[204], undefined);
  });

  await test('純文字供應商：抽出的文字太短（≤ MIN_SYLLABUS_TEXT_CHARS）→ 視同這個檔案沒材料', async () => {
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 205, name: 'C2d' }], customWeights: {} }, {
      syllabus: '<a href="/courses/205/files/9/download">Syllabus PDF</a>',
      extractedText: 'Cover page only',
    });
    await run(BASE);
    assert.equal(S.llm.length, 0);
    assert.equal(S.store.gradingAnalysis[205].status, 'notFound');
    assert.equal(S.store.gradingAnalysis[205].source, 'none');
  });

  await test('純文字供應商：抽出的文字超過 MAX_EXTRACTED_TEXT_CHARS → 截斷後仍照常送出', async () => {
    const huge = 'Grading policy. '.repeat(4000); // 64000 字元
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 206, name: 'C2e' }], customWeights: {} }, {
      syllabus: '<a href="/courses/206/files/9/download">Syllabus PDF</a>',
      extractedText: huge,
    });
    await run(BASE);
    assert.equal(S.llm.length, 1);
    const user = S.llm[0].body.messages.find((m) => m.role === 'user').content;
    assert.ok(user.includes(huge.slice(0, 30000)));
    assert.equal(user.includes(huge.slice(0, 30001)), false, '超過 30000 字元要截掉');
    assert.equal(S.store.gradingAnalysis[206].status, 'done');
  });

  await test('純文字供應商：關鍵字比對不到 → 一樣會呼叫 AI 挑檔，挑到的檔案下載＋抽字', async () => {
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 207, name: 'C2f' }], customWeights: {} }, {
      syllabus: '',
      files: [{ id: 11, display_name: 'week01-intro.pdf', url: `${BASE}/files/11/download` }],
      extractedText: EXTRACTED,
      // 第一次呼叫是挑檔（prompt 內含 Course files:），回檔案 id；第二次才是主分析
      llmText: (body) => (body.includes('Course files:') ? '11' : LLM_JSON),
    });
    await run(BASE);
    assert.equal(S.llm.length, 2, '挑檔一次＋主分析一次');
    assert.ok(JSON.stringify(S.llm[0].body).includes('Course files:'));
    assert.equal(S.fetches.filter((f) => f.url.includes('/files/11/download')).length, 1);
    assert.ok(S.llm[1].body.messages.map((m) => m.content).join('\n').includes(EXTRACTED));
    assert.equal(S.store.gradingAnalysis[207].status, 'done');
    assert.equal(S.store.gradingAnalysis[207].source, 'ai_selected_pdf');
  });

  await test('純文字供應商：沒有 PDF 權限 → 不下載 PDF，只用 syllabus 文字', async () => {
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 208, name: 'C2g' }], customWeights: {} }, {
      syllabus: '<a href="/courses/208/files/9/download">Syllabus PDF</a>' + SYLLABUS_HTML,
      pdfPermission: false, extractedText: EXTRACTED,
    });
    await run(BASE);
    assert.equal(S.fetches.filter((f) => f.url.includes('/files/9/download')).length, 0);
    assert.equal(S.llm.length, 1);
    assert.equal(S.store.gradingAnalysis[208].source, 'syllabus_body');
  });

  await test('大綱連結的 PDF 只試前 5 個；未嘗試的 id 之後仍可被課程檔案步驟撿到', async () => {
    const links = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<a href="/courses/505/files/${i}/download">f${i}</a>`).join('');
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 505, name: 'C5' }], customWeights: {} }, {
      syllabus: links + SYLLABUS_HTML,
      files: [{ id: 8, display_name: 'Course Syllabus.pdf', url: `${BASE}/files/8/download` }],
    });
    await run(BASE);
    const got = S.fetches.map((f) => (f.url.match(/\/files\/(\d+)\/download/) || [])[1]).filter(Boolean);
    assert.deepEqual(got, ['1', '2', '3', '4', '5', '8']); // 6、7 從未下載；8 沒被 fetchedIds 吃掉
    assert.equal(S.store.gradingAnalysis[505].source, 'syllabus_pdf');
    assert.ok(S.bodyReads > 0); // 合格的 PDF 仍會讀 body
    assert.ok(JSON.stringify(S.llm[0].body).includes('inlineData'));
  });

  await test('PDF 下載前先看 Content-Length：宣告 50MB → 不讀 body、不附 PDF', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 707, name: 'C7' }], customWeights: {} }, {
      syllabus: '<a href="/courses/707/files/3/download">f3</a>' + SYLLABUS_HTML,
      pdfHeaders: { 'content-type': 'application/pdf', 'content-length': '50000000' },
    });
    await run(BASE);
    assert.equal(S.bodyReads, 0, '宣告超上限就不該把 body 讀進記憶體');
    assert.equal(S.llm.length, 1);
    assert.equal(JSON.stringify(S.llm[0].body).includes('inlineData'), false);
    assert.equal(S.store.gradingAnalysis[707].source, 'syllabus_body');
  });

  await test('PDF 下載前先看 Content-Type：text/html（未登入的登入頁）→ 不讀 body', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 717, name: 'C7b' }], customWeights: {} }, {
      syllabus: '<a href="/courses/717/files/3/download">f3</a>' + SYLLABUS_HTML,
      pdfHeaders: { 'content-type': 'text/html; charset=utf-8' },
    });
    await run(BASE);
    assert.equal(S.bodyReads, 0);
    assert.equal(JSON.stringify(S.llm[0].body).includes('inlineData'), false);
  });

  await test('LLM 呼叫期間有 keepalive：快回應時不會真的 ping（證明 clearInterval 有跑，行程能自行結束）', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 808, name: 'C8' }], customWeights: {} }, { syllabus: SYLLABUS_HTML });
    await run(BASE);
    assert.equal(S.llm.length, 1);
    assert.equal(S.store.gradingAnalysis[808].status, 'done');
    assert.equal(S.platformInfo, 0); // 20 秒才會第一次觸發；沒清掉的話行程也不會結束
  });

  await test('AI_RESET_ANALYSIS：storage 寫入失敗仍會回覆（dashboard 不會卡住）', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [], customWeights: {} }, { failNextSet: true });
    const resp = await new Promise((resolve) => {
      const kept = sandbox.handleAiMessage({ type: 'AI_RESET_ANALYSIS' }, resolve, BASE);
      assert.equal(kept, true);
    });
    assert.equal(resp.success, false);
    assert.ok(resp.error);
  });

  await test('分析途中重置：in-flight 的結果不寫回剛清空的紀錄（epoch 守衛）', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 909, name: 'C9' }], customWeights: {} }, { syllabus: SYLLABUS_HTML });
    let release;
    S.llmGate = new Promise((r) => { release = r; });
    const p = run(BASE);
    while (!S.llm.length) await new Promise((r) => setTimeout(r, 0)); // 等到 LLM 請求已送出
    sandbox.handleAiMessage({ type: 'AI_RESET_ANALYSIS' }, () => { }, BASE);
    await new Promise((r) => setTimeout(r, 0)); // 讓 reset 的 storage.set 落地
    S.store.courses = []; // reset 會再排一輪；本測試只驗舊 run 的寫入被擋掉，讓新一輪無事可做
    release();
    await p;
    assert.deepEqual(plain(S.store.gradingAnalysis), {}); // 舊 run 沒把 done 寫回來
    assert.deepEqual(plain(S.store.customWeights), {});
    assert.deepEqual(plain(S.sent), []); // 也不會通知 dashboard 更新權重
    // 作廢的那輪在 finally 會補排一輪；這裡課程已清空 → 補跑無事可做。
    // 等它跑完再進下一個測試，免得全域鎖／計時器外溢
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(S.llm.length, 1);
  });

  await test('分析途中重置：作廢的那輪結束後會補排一輪，重新分析並寫入（不會卡在 pending）', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 919, name: 'C9b' }], customWeights: {} }, { syllabus: SYLLABUS_HTML });
    let release;
    S.llmGate = new Promise((r) => { release = r; });
    const p = run(BASE);
    while (!S.llm.length) await new Promise((r) => setTimeout(r, 0)); // 等到 LLM 請求已送出
    sandbox.handleAiMessage({ type: 'AI_RESET_ANALYSIS' }, () => { }, BASE);
    // reset 排的補跑會撞上仍持有的全域鎖而直接返回；LLM 再卡 150ms 確保那次補跑確實無效
    setTimeout(release, 150);
    await p;
    // 補跑必須由 in-flight 那輪的 finally 重新排出來
    const deadline = Date.now() + 2000;
    while (!(S.store.gradingAnalysis && S.store.gradingAnalysis[919]) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 10));
    }
    await new Promise((r) => setTimeout(r, 50)); // 讓可能多出來的第三輪現形
    assert.equal(S.llm.length, 2, '作廢一輪＋補跑一輪，不多不少');
    assert.equal(S.store.gradingAnalysis[919].status, 'done');
    assert.equal(S.store.gradingAnalysis[919].attempts, 1);
    assert.deepEqual(plain(S.store.customWeights[919]), WEIGHTS);
  });

  await test('分析途中重置：迴圈提前結束，剩下的課不再花額度（作廢 1 次＋補跑 2 次＝3 次 LLM 呼叫）', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 931, name: 'C9d' }, { id: 932, name: 'C9e' }], customWeights: {} }, { syllabus: SYLLABUS_HTML });
    let release;
    S.llmGate = new Promise((r) => { release = r; });
    const p = run(BASE);
    while (!S.llm.length) await new Promise((r) => setTimeout(r, 0)); // 第一門課的 LLM 請求已送出、卡住
    sandbox.handleAiMessage({ type: 'AI_RESET_ANALYSIS' }, () => { }, BASE);
    setTimeout(release, 150);
    await p;
    const deadline = Date.now() + 2000;
    while (!(S.store.gradingAnalysis && S.store.gradingAnalysis[931] && S.store.gradingAnalysis[932]) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 10));
    }
    await new Promise((r) => setTimeout(r, 50));
    // 沒有 break 的話會是 4（作廢那輪把第二門也跑完再丟掉）
    assert.equal(S.llm.length, 3, '第一輪只跑一門就中止，補跑兩門');
    assert.equal(S.store.gradingAnalysis[931].status, 'done');
    assert.equal(S.store.gradingAnalysis[932].status, 'done');
    assert.equal(S.store.gradingAnalysis[931].attempts, 1);
  });

  await test('fetch 丟 TypeError（CORS 被擋／離線）→ error 紀錄帶 network/CORS 字樣，與 key 錯可區分', async () => {
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 941, name: 'C9f' }], customWeights: {} }, { syllabus: SYLLABUS_HTML, llmThrow: true });
    await run(BASE);
    const rec = S.store.gradingAnalysis[941];
    assert.equal(rec.status, 'error');
    assert.match(rec.error, /deepseek network\/CORS error: Failed to fetch/);
    assert.equal(rec.source, 'syllabus_body');
    assert.deepEqual(S.store.customWeights, {});
  });

  await test('寫入前再驗 epoch：重置剛好落在 get 與 set 之間 → 放棄寫入', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 929, name: 'C9c' }], customWeights: {} }, { syllabus: SYLLABUS_HTML });
    S.afterGet = (keys) => {
      // recordOutcome 的那次 get（只讀這兩個 key）：在它與 set 之間插入重置
      if (keys.length === 2 && keys.includes('gradingAnalysis') && keys.includes('customWeights')) {
        S.afterGet = null;
        sandbox.handleAiMessage({ type: 'AI_RESET_ANALYSIS' }, () => { }, BASE);
        S.store.courses = []; // 之後的補跑無事可做
      }
    };
    await run(BASE);
    await new Promise((r) => setTimeout(r, 20)); // 讓補跑跑完
    assert.deepEqual(plain(S.store.gradingAnalysis), {});
    assert.deepEqual(plain(S.store.customWeights), {});
    assert.deepEqual(plain(S.sent), []);
    assert.equal(S.llm.length, 1);
  });

  await test('供應商 500：記 error/attempts 1，source 保留 syllabus_body，不動 customWeights（沒有冷卻期，下次同步就會再試）', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 303, name: 'C3' }], customWeights: {} }, { syllabus: SYLLABUS_HTML, llmStatus: 500 });
    await run(BASE);
    const rec = S.store.gradingAnalysis[303];
    assert.equal(rec.status, 'error');
    assert.equal(rec.attempts, 1);
    assert.match(rec.error, /gemini API 500/);
    assert.equal(rec.source, 'syllabus_body'); // 不是 'none'
    assert.deepEqual(S.store.customWeights, {});
    assert.deepEqual(S.sent, []);
  });

  await test('nvidia 未授權 host permission：直接報 NO_HOST_PERMISSION，零 LLM 呼叫、不動權重', async () => {
    reset({ aiConfig: { provider: 'nvidia', apiKey: 'nvapi-x' }, courses: [{ id: 951, name: 'C9g' }], customWeights: {} }, {
      syllabus: SYLLABUS_HTML, grantedOrigins: [PDF_ORIGIN], // 只有 PDF 權限，沒有 NVIDIA 的
    });
    await run(BASE);
    const rec = S.store.gradingAnalysis[951];
    assert.equal(rec.status, 'error');
    assert.match(rec.error, /NO_HOST_PERMISSION/);
    assert.equal(S.llm.length, 0, '沒授權就不該送出請求（省額度、也避免糊成 CORS TypeError）');
    assert.deepEqual(plain(S.store.customWeights), {});
  });

  await test('nvidia 已授權：走 OpenAI 相容端點、Bearer 金鑰、寫入權重', async () => {
    reset({ aiConfig: { provider: 'nvidia', apiKey: 'nvapi-x' }, courses: [{ id: 952, name: 'C9h' }], customWeights: {} }, {
      syllabus: SYLLABUS_HTML, grantedOrigins: [NVIDIA_ORIGIN],
    });
    await run(BASE);
    assert.equal(S.llm.length, 1);
    assert.equal(S.llm[0].url, 'https://integrate.api.nvidia.com/v1/chat/completions');
    assert.equal(S.llm[0].method, 'POST');
    assert.equal(S.llm[0].headers.Authorization, 'Bearer nvapi-x');
    assert.equal(S.store.gradingAnalysis[952].status, 'done');
    assert.deepEqual(plain(S.store.customWeights[952]), WEIGHTS);
  });

  await test('AI_GET_STATUS：providerPermission 反映該供應商自己的 host 權限', async () => {
    const status = () => new Promise((resolve) => {
      const kept = sandbox.handleAiMessage({ type: 'AI_GET_STATUS' }, resolve, BASE);
      assert.equal(kept, true);
    });
    reset({ aiConfig: { provider: 'nvidia', apiKey: 'nvapi-x' }, courses: [] }, { grantedOrigins: [PDF_ORIGIN] });
    assert.equal((await status()).providerPermission, false);
    reset({ aiConfig: { provider: 'nvidia', apiKey: 'nvapi-x' }, courses: [] }, { grantedOrigins: [NVIDIA_ORIGIN] });
    assert.equal((await status()).providerPermission, true);
    // gemini 不需要額外 origin → 一律 true（PDF 權限另外由 pdfPermission 表示）
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [] }, { grantedOrigins: [] });
    const st = await status();
    assert.equal(st.providerPermission, true);
    assert.equal(st.pdfPermission, false);
  });

  // 課程關掉「依組別加權」：殘留的 group_weight 不算 Canvas 權重（QA #93）——要靠 runner 把 course 帶進規則
  const WEIGHTS_OFF = () => ({
    aiConfig: { provider: 'gemini', apiKey: 'k' },
    courses: [{ id: 960, name: 'C10', apply_assignment_group_weights: false }],
    assignmentGroups: { 960: [{ id: 1, name: 'Homework', group_weight: 40 }, { id: 2, name: 'Exam', group_weight: 60 }] },
    customWeights: {},
  });

  await test('課程關掉依組別加權、只有殘留 group_weight → 照樣分析並寫入權重', async () => {
    reset(WEIGHTS_OFF(), { syllabus: SYLLABUS_HTML });
    await run(BASE);
    assert.equal(S.llm.length, 1);
    assert.equal(S.store.gradingAnalysis[960].status, 'done');
    assert.deepEqual(plain(S.store.customWeights[960]), WEIGHTS);
  });

  await test('AI_GET_STATUS：關掉依組別加權的課回報 pending，不是 skipped', async () => {
    reset(WEIGHTS_OFF());
    const resp = await new Promise((resolve) => sandbox.handleAiMessage({ type: 'AI_GET_STATUS' }, resolve, BASE));
    assert.equal(resp.courses.find((c) => c.courseId === 960).status, 'pending');
  });

  console.log('ALL analysisRunner TESTS PASSED');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

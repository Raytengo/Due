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

// ── 可變的測試狀態 ──
const PDF_HEADERS = { 'content-type': 'application/pdf' };
// 每次都給全新的陣列：共用同一份物件會讓 llm/fetches 跨測試累積
const defaults = () => ({
  sets: 0, pdfPermission: true, sent: [], fetches: [], llm: [], syllabus: '', files: [],
  llmStatus: 200, llmText: LLM_JSON,
  bodyReads: 0,          // arrayBuffer() 被呼叫幾次（驗「下載前就拒絕」時不讀 body）
  pdfHeaders: PDF_HEADERS,
  llmGate: null,         // 設成 promise 可把 LLM 回應卡住，模擬「分析途中」
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
    if (S.llmStatus !== 200) return res(S.llmStatus, 'provider exploded');
    return res(200, u.includes(':generateContent')
      ? { candidates: [{ content: { parts: [{ text: S.llmText }] } }] }
      : { choices: [{ message: { content: S.llmText } }] });
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
    permissions: { contains: async () => S.pdfPermission },
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

  await test('純文字供應商（deepseek）：不列課程檔案、不抓 PDF，無材料 → notFound 且零 LLM 呼叫', async () => {
    reset({ aiConfig: { provider: 'deepseek', apiKey: 'sk-x' }, courses: [{ id: 202, name: 'C2' }], customWeights: {} }, {
      syllabus: '', files: [{ id: 9, display_name: 'Syllabus.pdf', url: `${BASE}/files/9/download` }],
    });
    await run(BASE);
    assert.equal(S.fetches.filter((f) => f.url.includes('/files')).length, 0);
    assert.equal(S.llm.length, 0);
    assert.equal(S.store.gradingAnalysis[202].status, 'notFound');
    assert.equal(S.store.gradingAnalysis[202].source, 'none');
    assert.equal(S.store.customWeights[202], undefined);
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

  await test('供應商 500：記 error/attempts 1/24 小時後重試，source 保留 syllabus_body，不動 customWeights', async () => {
    reset({ aiConfig: { provider: 'gemini', apiKey: 'k' }, courses: [{ id: 303, name: 'C3' }], customWeights: {} }, { syllabus: SYLLABUS_HTML, llmStatus: 500 });
    const before = Date.now();
    await run(BASE);
    const rec = S.store.gradingAnalysis[303];
    assert.equal(rec.status, 'error');
    assert.equal(rec.attempts, 1);
    assert.match(rec.error, /gemini API 500/);
    assert.equal(rec.source, 'syllabus_body'); // 不是 'none'
    assert.ok(Math.abs(Date.parse(rec.nextRetryAt) - (before + 24 * 3600000)) < 60000, rec.nextRetryAt);
    assert.deepEqual(S.store.customWeights, {});
    assert.deepEqual(S.sent, []);
  });

  console.log('ALL analysisRunner TESTS PASSED');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

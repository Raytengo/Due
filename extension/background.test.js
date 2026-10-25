// background.js 測試：以 vm 載入真實 service worker 腳本，stub chrome.* 與 fetch。
// 執行：node extension/background.test.js（無依賴）
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const BASE = 'https://hkust-gz.instructure.com';
const SOURCE = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Response stub ──
function res(status, body = [], headers = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const r = {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',                       // HTTP/2 下 statusText 恆為空字串
    headers: { get: (k) => lower[k.toLowerCase()] ?? null },
    json: async () => JSON.parse(text),
    text: async () => text,
    clone: () => r,
  };
  return r;
}

// ── 依 URL 路由的 fetch stub；routes: [[regex, () => response]]，未命中 → 401 ──
function makeFetch(routes, { delayMs = 1 } = {}) {
  const stats = { calls: [], inFlight: 0, maxInFlight: 0 };
  const fetch = async (url) => {
    stats.calls.push(url);
    stats.inFlight++;
    stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);
    try {
      await sleep(delayMs);
      const hit = routes.find(([re]) => re.test(url));
      return hit ? hit[1](url) : res(401, { errors: [{ message: 'unauthorized' }] });
    } finally {
      stats.inFlight--;
    }
  };
  return { fetch, stats };
}

// ── 載入 background.js：storageDelayMs 模擬 SW 冷啟動時 storage 回呼晚於事件 ──
// getFails：第一個 callback 式 get 回呼 undefined（模擬 storage 錯誤 / runtime.lastError）
// tabsQuery／executeScript：Claude 用量（SYNC_CLAUDE_USAGE）測試用，覆寫找 claude.ai 分頁與分頁內執行的結果
// setFailsIf(obj)：回 true 的 set 整筆不寫入並 reject（模擬超過 QUOTA_BYTES 等寫入失敗）
function loadBackground({ stored = {}, storageDelayMs = 0, fetch, getFails = false, tabsQuery, executeScript, setFailsIf, aiHandler }) {
  const store = structuredClone(stored);
  const listeners = { message: [], nav: [] };
  const callbackErrors = [];   // 比照 Chrome：回呼內 throw 只會被記下，不會傳回呼叫端
  const runCb = (cb, v) => { try { cb(v); } catch (e) { callbackErrors.push(e); } };
  let failNextCallbackGet = getFails;
  const get = (keys, cb) => {
    const out = {};
    [].concat(keys).forEach((k) => { if (k in store) out[k] = structuredClone(store[k]); });
    if (cb && failNextCallbackGet) {
      failNextCallbackGet = false;
      sleep(storageDelayMs).then(() => runCb(cb, undefined));
      return undefined;
    }
    const p = sleep(storageDelayMs).then(() => out);
    if (cb) { p.then((v) => runCb(cb, v)); return undefined; }
    return p;
  };
  // storage.onChanged：比照 Chrome，只送「真的有變」的 key（{ oldValue, newValue }），寫入完成後非同步送達
  const changeListeners = [];
  const emitChanges = (changes) => {
    if (!Object.keys(changes).length) return;
    Promise.resolve().then(() => changeListeners.forEach((fn) => runCb(() => fn(structuredClone(changes), 'local'))));
  };
  const setLog = [];   // 每次 set 寫了哪些 key、值為何（驗證「網址與資料同一次寫入」用）
  const set = (obj, cb) => {
    setLog.push(structuredClone(obj));
    if (setFailsIf && setFailsIf(obj)) {
      const p = Promise.reject(new Error('QUOTA_BYTES quota exceeded'));
      if (cb) { p.catch(() => { }).then(() => runCb(cb)); return undefined; }
      return p;
    }
    const changes = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (JSON.stringify(store[k]) !== JSON.stringify(v)) changes[k] = { oldValue: store[k], newValue: v };
    });
    Object.assign(store, structuredClone(obj));
    emitChanges(changes);
    const p = Promise.resolve();
    if (cb) { p.then(() => runCb(cb)); return undefined; }
    return p;
  };
  const remove = (keys, cb) => {
    const changes = {};
    [].concat(keys).forEach((k) => {
      if (k in store) changes[k] = { oldValue: store[k] };
      delete store[k];
    });
    emitChanges(changes);
    const p = Promise.resolve();
    if (cb) { p.then(() => runCb(cb)); return undefined; }
    return p;
  };
  const chrome = {
    storage: { local: { get, set, remove }, onChanged: { addListener: (fn) => changeListeners.push(fn) } },
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: { addListener: (fn) => listeners.message.push(fn) },
      getURL: (p) => p,
    },
    webNavigation: { onCompleted: { addListener: (fn) => listeners.nav.push(fn) } },
    tabs: { create() {}, query: tabsQuery || (async () => []) },
    scripting: { executeScript: executeScript || (async () => []) },
  };
  const quiet = { log() {}, warn() {}, error() {} };
  // 重試等待在測試裡縮短（只縮 background 內部的 timer，stub 自身用 node 的 setTimeout）
  const fastTimeout = (fn, ms, ...a) => setTimeout(fn, Math.min(ms, 5), ...a);
  // v2.1 的 background 第一行 importScripts 載入 ai/ 模組（pdf.js、analysisRunner…）：這裡不載入，只 stub 它對外的兩個入口，
  // 記下呼叫以驗證「同步成功後用這場同步的網址排程 AI 分析」（AI 模組本身另有 extension/ai/*.test.js）
  const scheduled = [];
  const aiMessages = [];
  const ctx = vm.createContext({
    chrome, fetch, console: quiet, setTimeout: fastTimeout, clearTimeout, URL,
    importScripts: () => { },
    scheduleGradingAnalysis: (base) => { scheduled.push(base); },
    handleAiMessage: (message, sendResponse, base) => {
      aiMessages.push({ type: message.type, base });
      if (aiHandler) return aiHandler(message, sendResponse, base);
      sendResponse({ success: true });
      return false;
    },
  });
  vm.runInContext(SOURCE, ctx);
  // 回應物件建在 vm realm（Array 原型不同），轉回本 realm 才能 deepStrictEqual
  // 1.5 秒沒回應 → { timeout: true }（掛住的 handler 要讓測試失敗，而不是讓整個測試卡死）
  const send = (msg) => Promise.race([
    new Promise((resolve) => {
      listeners.message.forEach((fn) => fn(msg, {}, (r) => resolve(r === undefined ? undefined : JSON.parse(JSON.stringify(r)))));
    }),
    sleep(1500).then(() => ({ timeout: true })),
  ]);
  const navigate = (url) => Promise.all(listeners.nav.map((fn) => fn({ frameId: 0, url })));
  // 等頂層 storage 回填完成＝已暖機的 SW（只有冷啟動測試不呼叫）
  const warm = () => sleep(storageDelayMs + 5);
  // storage 被清掉（例如在 chrome://extensions 清除擴充功能資料）：除 uiLanguage 外全部經 storage.local.remove 刪掉
  const clearStorage = async () => {
    await remove(Object.keys(store).filter((k) => k !== 'uiLanguage'));
    await sleep(1);   // 等 onChanged 送達
  };
  return { store, send, navigate, warm, callbackErrors, clearStorage, setLog, scheduled, aiMessages };
}

const course = (id) => ({ id, name: `Course ${id}`, workflow_state: 'available', account_id: null });
const coursesRoute = (ids) => [/\/api\/v1\/courses\?/, () => res(200, ids.map(course))];
const okCourseRoutes = [
  [/\/courses\/\d+\/assignments\?/, (u) => res(200, [{ id: Number(u.match(/courses\/(\d+)/)[1]) * 10, name: 'HW' }])],
  [/\/courses\/\d+\/assignment_groups\?/, () => res(200, [{ id: 1, name: 'Homework', group_weight: 100 }])],
];

// ── 多 origin 用：路由綁定 origin，未登入的 origin 一律走 makeFetch 的 401 ──
const OTHER = 'https://other-uni.instructure.com';
const at = (origin, re) => new RegExp('^' + origin.replace(/[.]/g, '\\.') + re.source);
const selfOk = (origin) => [at(origin, /\/api\/v1\/users\/self/), () => res(200, { id: 42, name: 'Student' })];
const originRoutes = (origin, ids) => [
  selfOk(origin),
  [at(origin, /\/api\/v1\/courses\?/), () => res(200, ids.map(course))],
  [at(origin, /\/api\/v1\/courses\/\d+\/assignments\?/), (u) => res(200, [{ id: Number(u.match(/courses\/(\d+)/)[1]) * 10, name: 'HW' }])],
  [at(origin, /\/api\/v1\/courses\/\d+\/assignment_groups\?/), () => res(200, [{ id: 1, name: 'Homework', group_weight: 100 }])],
];
const isCoursesList = (u) => /\/api\/v1\/courses\?/.test(u);
const synced = (ids) => ({ courses: ids.map(course), lastSync: new Date().toISOString() });
// 等到 cond() 成立（輪詢；逾時 throw，避免時序假設默默失效）
async function until(cond, ms = 1000) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error('until：等待條件逾時');
    await sleep(2);
  }
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// ── P0-4a：SW 冷啟動，storage 回呼晚於 SYNC 訊息 ──
test('SYNC：冷啟動時 storage 還沒回填也要用已存的 canvasBaseUrl 同步成功', async () => {
  const { fetch, stats } = makeFetch([coursesRoute([101]), ...okCourseRoutes]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, storageDelayMs: 30, fetch });
  const resp = await bg.send({ type: 'SYNC' });
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.ok(stats.calls.some((u) => u.startsWith(`${BASE}/api/v1/courses?`)));
  assert.deepEqual(bg.store.assignments['101'], [{ id: 1010, name: 'HW' }]);
});

test('webNavigation：冷啟動時同一學校、5 分鐘內同步過 → 仍套用節流，不重新同步', async () => {
  const { fetch, stats } = makeFetch([coursesRoute([101]), ...okCourseRoutes]);
  const bg = loadBackground({
    stored: { canvasBaseUrl: BASE, lastSync: new Date().toISOString() },
    storageDelayMs: 30,
    fetch,
  });
  await bg.navigate(`${BASE}/courses/101`);
  await sleep(80);
  assert.equal(stats.calls.length, 0, `不該發請求，實際：${stats.calls.join(', ')}`);
});

// ── P0-4b：同步進行中再收到 SYNC ──
test('SYNC 重入：進行中的同步失敗時，後到的 SYNC 也要回報失敗（不能立刻回成功）', async () => {
  const { fetch } = makeFetch([[/\/api\/v1\/courses\?/, () => res(401)]], { delayMs: 20 });
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const [first, second] = await Promise.all([bg.send({ type: 'SYNC' }), bg.send({ type: 'SYNC' })]);
  assert.equal(first.success, false);
  assert.equal(second.success, false, `second=${JSON.stringify(second)}`);
});

test('SYNC 重入：後到的 SYNC 等同一場同步完成，資料已寫入才回應', async () => {
  const { fetch, stats } = makeFetch([coursesRoute([101]), ...okCourseRoutes], { delayMs: 10 });
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const firstP = bg.send({ type: 'SYNC' });
  await sleep(2);
  const second = await bg.send({ type: 'SYNC' });
  assert.equal(second.success, true);
  assert.ok(bg.store.assignments && bg.store.assignments['101'], '回應時資料應已寫入');
  await firstP;
  assert.equal(stats.calls.filter((u) => /\/api\/v1\/courses\?/.test(u)).length, 1, '只跑一場同步');
});

// ── P0-1：單課失敗不可清空該課舊資料 ──
test('單課 assignment_groups 403 → 保留該課上次的作業與分組，其他課正常更新，回報 failedCourses', async () => {
  const prevAsgn = { 101: [{ id: 1, name: 'old 101' }], 102: [{ id: 2, name: 'old 102' }] };
  const prevGroups = { 101: [{ id: 9 }], 102: [{ id: 8, name: 'old group' }] };
  const { fetch } = makeFetch([
    coursesRoute([101, 102]),
    [/\/courses\/102\/assignment_groups\?/, () => res(403, { errors: [{ message: 'forbidden' }] })],
    ...okCourseRoutes,
  ]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE, assignments: prevAsgn, assignmentGroups: prevGroups }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC' });
  assert.equal(resp.success, true);
  assert.deepEqual(bg.store.assignments['102'], [{ id: 2, name: 'old 102' }], '102 的舊作業不能被清空');
  assert.deepEqual(bg.store.assignmentGroups['102'], [{ id: 8, name: 'old group' }]);
  assert.deepEqual(bg.store.assignments['101'], [{ id: 1010, name: 'HW' }], '101 應更新為新資料');
  assert.deepEqual((resp.failedCourses || []).map((c) => c.id), [102]);
});

test('單課失敗且從沒同步過該課 → 寫入 []（不留 undefined），並列入 failedCourses', async () => {
  const { fetch } = makeFetch([
    coursesRoute([101, 103]),
    [/\/courses\/103\/assignments\?/, () => res(500)],
    ...okCourseRoutes,
  ]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC' });
  assert.deepEqual(bg.store.assignments['103'], []);
  assert.deepEqual((resp.failedCourses || []).map((c) => c.id), [103]);
});

test('Canvas 限流（403 Rate Limit Exceeded）→ 重試一次成功，不算失敗', async () => {
  let hits = 0;
  const { fetch } = makeFetch([
    coursesRoute([101]),
    [/\/courses\/101\/assignments\?/, () => (++hits === 1 ? res(403, '403 Forbidden (Rate Limit Exceeded)') : res(200, [{ id: 7 }]))],
    ...okCourseRoutes,
  ]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC' });
  assert.equal(resp.success, true);
  assert.deepEqual(resp.failedCourses || [], []);
  assert.deepEqual(bg.store.assignments['101'], [{ id: 7 }]);
});

test('併發上限：12 門課同步時同時最多 8 個請求（每門課 2 個端點 × 4 門）', async () => {
  const ids = Array.from({ length: 12 }, (_, i) => 200 + i);
  const { fetch, stats } = makeFetch([coursesRoute(ids), ...okCourseRoutes], { delayMs: 5 });
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC' });
  assert.equal(resp.success, true);
  assert.equal(Object.keys(bg.store.assignments).length, 12);
  assert.ok(stats.maxInFlight <= 8, `maxInFlight=${stats.maxInFlight}`);
});

// ── A2（review sync-2）：_ready 一定要 settle ──
test('_ready：storage.get 回呼拿到 undefined（storage 錯誤／lastError）也要 settle，SYNC 誠實回報失敗而不是掛住', async () => {
  const { fetch } = makeFetch([]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch, getFails: true });
  const resp = await bg.send({ type: 'SYNC' });
  assert.notEqual(resp.timeout, true, 'SYNC 不應掛住');
  assert.equal(resp.success, false);
  assert.deepEqual(bg.callbackErrors.map((e) => e.message), [], '回填回呼不應 throw');
});

// ── A1（review sync-1）：一場同步固定用開始時的 BASE_URL ──
test('同步途中 BASE_URL 改變 → 舊同步的每門課請求仍打原 origin，結束後為新 origin 再同步一次', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101, 102]), ...originRoutes(OTHER, [701])], { delayMs: 15 });
  // 有 canvasBaseUrl 但從沒同步出課程 → 首次偵測：造訪另一個已登入的 Canvas 會被採用
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const first = bg.send({ type: 'SYNC' });
  await sleep(20);                       // 課程清單已回來，接著是每門課的請求
  await bg.navigate(`${OTHER}/courses/701`);
  await first;
  await sleep(150);
  const oldCourseCalls = stats.calls.filter((u) => /\/courses\/10[12]\//.test(u));
  assert.ok(oldCourseCalls.length > 0);
  oldCourseCalls.forEach((u) => assert.ok(u.startsWith(BASE), `舊課程的請求打到別的 origin：${u}`));
  assert.ok(stats.calls.some((u) => u.startsWith(`${OTHER}/api/v1/courses?`)), '應為新 origin 再跑一場同步');
  assert.equal(bg.store.canvasBaseUrl, OTHER);
  assert.deepEqual(Object.keys(bg.store.assignments), ['701'], '舊 origin 的結果不能蓋掉新 origin');
});

test('SET_CANVAS_BASE 在舊網址同步進行中送達 → 不加入舊同步；回應等新網址那場同步完成', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101, 102]), ...originRoutes(OTHER, [701])], { delayMs: 15 });
  const bg = loadBackground({
    stored: { canvasBaseUrl: BASE, ...synced([101, 102]), canvasBaseCandidate: { origin: OTHER, at: new Date().toISOString() } },
    fetch,
  });
  await bg.warm();
  const first = bg.send({ type: 'SYNC' });
  await sleep(20);
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  await first;
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  stats.calls.filter((u) => /\/courses\/10[12]\//.test(u)).forEach((u) => assert.ok(u.startsWith(BASE), u));
  assert.deepEqual(bg.store.courses.map((c) => c.id), [701]);
  assert.deepEqual(Object.keys(bg.store.assignments), ['701']);
});

// ── A3（QA P1-9）：webNavigation 不能採用任意 *.instructure.com ──
test('webNavigation：www／status／community／support／info／*.beta／*.test 不是學生的 Canvas → 不改網址、不發請求', async () => {
  const hosts = ['www', 'status', 'community', 'support', 'info', 'hkust-gz.beta', 'hkust-gz.test'];
  for (const stored of [{ canvasBaseUrl: BASE, ...synced([101]) }, {}]) {
    const { fetch, stats } = makeFetch([[/\/api\/v1\/users\/self/, () => res(200, { id: 1 })]]);
    const bg = loadBackground({ stored, fetch });
    await bg.warm();
    for (const h of hosts) await bg.navigate(`https://${h}.instructure.com/`);
    await sleep(30);
    assert.deepEqual(stats.calls, [], `不該發請求：${stats.calls.join(', ')}`);
    assert.equal(bg.store.canvasBaseUrl, stored.canvasBaseUrl);
    assert.equal(bg.store.canvasBaseCandidate, undefined);
  }
});

test('首次偵測：未登入（users/self 401 或 200 HTML）→ 不採用、不同步；登入後再造訪才採用並同步', async () => {
  let selfResp = () => res(401);
  const { fetch, stats } = makeFetch([
    [at(BASE, /\/api\/v1\/users\/self/), () => selfResp()],
    ...originRoutes(BASE, [101]).slice(1),
  ]);
  const bg = loadBackground({ stored: {}, fetch });
  await bg.warm();
  await bg.navigate(`${BASE}/login/canvas`);
  selfResp = () => res(200, '<!DOCTYPE html><html>SSO login</html>');
  await bg.navigate(`${BASE}/login/saml`);
  await sleep(20);
  assert.equal(bg.store.canvasBaseUrl, undefined, '未登入不能寫 canvasBaseUrl');
  assert.ok(!stats.calls.some(isCoursesList), '未登入不該同步');
  selfResp = () => res(200, { id: 7, name: 'Ray' });
  await bg.navigate(`${BASE}/`);
  await sleep(60);
  assert.equal(bg.store.canvasBaseUrl, BASE);
  assert.deepEqual(bg.store.assignments['101'], [{ id: 1010, name: 'HW' }]);
});

test('已有同步資料時造訪另一個已登入的 Canvas → 不切換、不同步，只記 canvasBaseCandidate', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE, ...synced([101]) }, fetch });
  await bg.warm();
  await bg.navigate(`${OTHER}/courses/701`);
  await sleep(30);
  assert.equal(bg.store.canvasBaseUrl, BASE);
  assert.equal(bg.store.canvasBaseCandidate && bg.store.canvasBaseCandidate.origin, OTHER);
  assert.ok(Number.isFinite(Date.parse(bg.store.canvasBaseCandidate.at)));
  assert.ok(!stats.calls.some(isCoursesList), '不應同步任何一邊');
  const resp = await bg.send({ type: 'SYNC' });
  assert.equal(resp.success, true);
  assert.ok(stats.calls.filter(isCoursesList).every((u) => u.startsWith(BASE)), '手動同步仍打原本的學校');
  assert.deepEqual(bg.store.courses.map((c) => c.id), [101]);
});

test('已有同步資料、另一個 Canvas 未登入 → 不記候選', async () => {
  const { fetch } = makeFetch([...originRoutes(BASE, [101])]);   // OTHER 的 users/self → 401
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE, ...synced([101]) }, fetch });
  await bg.warm();
  await bg.navigate(`${OTHER}/`);
  await sleep(20);
  assert.equal(bg.store.canvasBaseCandidate, undefined);
  assert.equal(bg.store.canvasBaseUrl, BASE);
});

test('ignoredCanvasOrigins 內的 origin → 不記候選，也不必驗證登入', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE, ...synced([101]), ignoredCanvasOrigins: [OTHER] }, fetch });
  await bg.warm();
  await bg.navigate(`${OTHER}/courses/701`);
  await sleep(20);
  assert.equal(bg.store.canvasBaseCandidate, undefined);
  assert.deepEqual(stats.calls, []);
});

test('SET_CANVAS_BASE → BASE_URL 與 canvasBaseUrl 換成新網址、清掉候選、同步新網址', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])]);
  const bg = loadBackground({
    stored: { canvasBaseUrl: BASE, ...synced([101]), canvasBaseCandidate: { origin: OTHER, at: new Date().toISOString() } },
    fetch,
  });
  await bg.warm();
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.equal(bg.store.canvasBaseUrl, OTHER);
  assert.equal(bg.store.canvasBaseCandidate, undefined);
  assert.deepEqual(bg.store.courses.map((c) => c.id), [701]);
  await bg.send({ type: 'SYNC' });
  assert.ok(stats.calls.filter(isCoursesList).every((u) => u.startsWith(OTHER)));
});

test('SET_CANVAS_BASE 拒絕非 Canvas 網址（www、beta、非 instructure）', async () => {
  for (const origin of ['https://www.instructure.com', 'https://hkust-gz.beta.instructure.com', 'https://evil.example.com', undefined]) {
    const { fetch, stats } = makeFetch([]);
    const bg = loadBackground({ stored: { canvasBaseUrl: BASE, ...synced([101]) }, fetch });
    await bg.warm();
    const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin });
    assert.equal(resp.success, false, `${origin} resp=${JSON.stringify(resp)}`);
    assert.equal(bg.store.canvasBaseUrl, BASE);
    assert.deepEqual(stats.calls, []);
  }
});

test('IGNORE_CANVAS_BASE → 加入 ignoredCanvasOrigins、清掉候選；之後再造訪不再記候選', async () => {
  const { fetch } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])]);
  const bg = loadBackground({
    stored: { canvasBaseUrl: BASE, ...synced([101]), canvasBaseCandidate: { origin: OTHER, at: new Date().toISOString() } },
    fetch,
  });
  await bg.warm();
  const resp = await bg.send({ type: 'IGNORE_CANVAS_BASE', origin: OTHER });
  assert.equal(resp.success, true);
  assert.deepEqual(bg.store.ignoredCanvasOrigins, [OTHER]);
  assert.equal(bg.store.canvasBaseCandidate, undefined);
  await bg.navigate(`${OTHER}/`);
  await sleep(20);
  assert.equal(bg.store.canvasBaseCandidate, undefined);
  assert.equal(bg.store.canvasBaseUrl, BASE);
});

test('舊版被改成 www.instructure.com 的 canvasBaseUrl → 回到已登入的學校 Canvas 直接修正並同步', async () => {
  const { fetch } = makeFetch([...originRoutes(BASE, [101])]);
  const bg = loadBackground({ stored: { canvasBaseUrl: 'https://www.instructure.com', ...synced([101]) }, fetch });
  await bg.warm();
  await bg.navigate(`${BASE}/courses/101`);
  await sleep(60);
  assert.equal(bg.store.canvasBaseUrl, BASE);
  assert.equal(bg.store.canvasBaseCandidate, undefined);
  assert.deepEqual(bg.store.assignments['101'], [{ id: 1010, name: 'HW' }]);
});

// ── A4（QA P2-7）：assignment_groups 不再重複存整包作業 ──
// ── QA #152：storage 被清掉後，仍活著的 SW 不能沿用記憶體裡的網址／節流時間戳 ──
test('storage 被清掉（SW 仍活著）→ 回到 Canvas 不被 5 分鐘節流擋掉，重新偵測並同步，canvasBaseUrl 一併寫回', async () => {
  const { fetch } = makeFetch(originRoutes(BASE, [101, 102]));
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE, uiLanguage: 'en' }, fetch });
  await bg.warm();
  assert.equal((await bg.send({ type: 'SYNC' })).success, true);
  await bg.clearStorage();
  assert.deepEqual(Object.keys(bg.store), ['uiLanguage']);
  await bg.navigate(`${BASE}/courses`);
  await sleep(60);
  assert.equal((bg.store.courses || []).length, 2, '清除後回到 Canvas 應立即同步（不被節流擋掉）');
  assert.ok(bg.store.lastSync);
  assert.equal(bg.store.canvasBaseUrl, BASE, '同步出的資料要帶 canvasBaseUrl（dashboard 點作業名稱、教學連結都靠它）');
});

test('同步寫入 lastSync 時一併寫入 canvasBaseUrl（storage 裡的網址遺失也能自我修復）', async () => {
  const { fetch } = makeFetch([coursesRoute([101]), ...okCourseRoutes]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  delete bg.store.canvasBaseUrl;   // 不經 remove、不發 onChanged：記憶體仍有網址、storage 卻沒有
  assert.equal((await bg.send({ type: 'SYNC' })).success, true);
  assert.equal(bg.store.canvasBaseUrl, BASE);
});

test('storage 被清掉時有同步進行中 → 那場同步的結果丟棄不寫回（不讓剛清掉的資料復活）', async () => {
  const { fetch } = makeFetch([coursesRoute([101]), ...okCourseRoutes], { delayMs: 15 });
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE, uiLanguage: 'en' }, fetch });
  await bg.warm();
  const syncP = bg.send({ type: 'SYNC' });
  await sleep(5);
  await bg.clearStorage();
  await syncP;
  assert.deepEqual(Object.keys(bg.store), ['uiLanguage'], `store=${JSON.stringify(Object.keys(bg.store))}`);
});

test('assignment_groups 請求不帶 include[]=assignments（成員改用 assignment_group_id），仍帶 group_weight', async () => {
  const { fetch, stats } = makeFetch([coursesRoute([101, 102]), ...okCourseRoutes]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  await bg.send({ type: 'SYNC' });
  const groupCalls = stats.calls.filter((u) => /assignment_groups/.test(u));
  assert.equal(groupCalls.length, 2);
  groupCalls.forEach((u) => {
    assert.ok(!/include\[\]=assignments/.test(u), u);
    assert.ok(/include\[\]=group_weight/.test(u), u);
  });
});

// ── A5（QA #65）：schoolName 不要每次同步都打 accounts ──
const accountCalls = (stats) => stats.calls.filter((u) => /\/api\/v1\/accounts\//.test(u));

test('schoolName：沒有快取時最多查 accounts/self ＋ 第一門課的 account_id，都 401 → hostname 推算並快取；下次同步不再打 accounts', async () => {
  const ids = [101, 102, 103, 104, 105, 106];
  const { fetch, stats } = makeFetch([
    [/\/api\/v1\/courses\?/, () => res(200, ids.map((id, i) => ({ ...course(id), account_id: 500 + i })))],
    ...okCourseRoutes,
  ]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  await bg.send({ type: 'SYNC' });
  assert.ok(accountCalls(stats).length <= 2, `accounts 請求太多：${accountCalls(stats).join(', ')}`);
  assert.equal(bg.store.schoolName, 'HKUST(GZ)');
  assert.equal(bg.store.schoolNameBase, BASE);
  const before = accountCalls(stats).length;
  await bg.send({ type: 'SYNC' });
  assert.equal(accountCalls(stats).length, before, '同一個 Canvas 已有校名 → 不再打 accounts');
});

test('schoolName：快取屬於別的 Canvas 或是通用名稱 → 重新查', async () => {
  for (const cached of [
    { schoolName: 'Other University', schoolNameBase: OTHER },
    { schoolName: 'Canvas', schoolNameBase: BASE },
    { schoolName: 'HKUST(GZ)' },                         // 舊資料沒有 schoolNameBase
  ]) {
    const { fetch, stats } = makeFetch([
      [/\/api\/v1\/accounts\/self/, () => res(200, { id: 1, name: 'HKUST (Guangzhou)' })],
      coursesRoute([101]), ...okCourseRoutes,
    ]);
    const bg = loadBackground({ stored: { canvasBaseUrl: BASE, ...cached }, fetch });
    await bg.warm();
    await bg.send({ type: 'SYNC' });
    assert.equal(accountCalls(stats).length, 1, JSON.stringify(cached));
    assert.equal(bg.store.schoolName, 'HKUST (Guangzhou)');
    assert.equal(bg.store.schoolNameBase, BASE);
  }
});

// ── QA P3 #63：Claude 用量 ↻ 抓不到時要誠實回報 success:false＋reason（popup 依 reason 顯示提示）──
const CLAUDE_TAB = { id: 7, url: 'https://claude.ai/new' };
const claudeTabs = async () => [{ id: 1, url: `${BASE}/courses` }, CLAUDE_TAB];
const inTab = (result) => async () => [{ result }];
const noFetch = makeFetch([]).fetch;

test('SYNC_CLAUDE_USAGE：沒有 claude.ai 分頁 → success:false, reason no-tab', async () => {
  const bg = loadBackground({ fetch: noFetch, tabsQuery: async () => [{ id: 1, url: `${BASE}/courses` }] });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC_CLAUDE_USAGE', force: true });
  assert.equal(resp.success, false, `resp=${JSON.stringify(resp)}`);
  assert.equal(resp.reason, 'no-tab');
});

test('SYNC_CLAUDE_USAGE：分頁內 org/usage 請求失敗（403、Cloudflare HTML）→ success:false, reason request-failed', async () => {
  for (const error of ['org status 403', 'usage status 500', 'no org found', 'Unexpected token < in JSON']) {
    const bg = loadBackground({ fetch: noFetch, tabsQuery: claudeTabs, executeScript: inTab({ error }) });
    await bg.warm();
    const resp = await bg.send({ type: 'SYNC_CLAUDE_USAGE', force: true });
    assert.equal(resp.success, false, `${error} → ${JSON.stringify(resp)}`);
    assert.equal(resp.reason, 'request-failed', error);
    assert.equal(bg.store.claudeUsage, undefined, '失敗不寫入用量');
  }
});

test('SYNC_CLAUDE_USAGE：executeScript 被拒或沒有結果 → success:false, reason script-failed', async () => {
  for (const executeScript of [
    async () => { throw new Error('Cannot access contents of the page'); },
    async () => [],
    async () => [{ result: null }],
  ]) {
    const bg = loadBackground({ fetch: noFetch, tabsQuery: claudeTabs, executeScript });
    await bg.warm();
    const resp = await bg.send({ type: 'SYNC_CLAUDE_USAGE', force: true });
    assert.equal(resp.success, false, `resp=${JSON.stringify(resp)}`);
    assert.equal(resp.reason, 'script-failed');
  }
});

test('SYNC_CLAUDE_USAGE：抓到用量 → success:true＋usage，寫入 claudeUsage／claudeOrgId', async () => {
  const resetAt = '2026-10-23T12:00:00Z';
  const bg = loadBackground({
    fetch: noFetch, tabsQuery: claudeTabs,
    executeScript: inTab({ orgId: 'org-1', data: { five_hour: { utilization: 42.4, resets_at: resetAt } } }),
  });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC_CLAUDE_USAGE', force: true });
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.equal(resp.usage.usedPercent, 42);
  assert.equal(resp.usage.resetAt, resetAt);
  assert.equal(bg.store.claudeUsage.usedPercent, 42);
  assert.equal(bg.store.claudeOrgId, 'org-1');
});

test('SYNC_CLAUDE_USAGE：請求成功但目前沒有 5 小時用量窗（five_hour 為 null）→ 不算失敗，success:true／usage:null', async () => {
  const bg = loadBackground({
    fetch: noFetch, tabsQuery: claudeTabs,
    executeScript: inTab({ orgId: 'org-1', data: { five_hour: null } }),
  });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC_CLAUDE_USAGE', force: true });
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.equal(resp.usage, null);
});

// ── A2-2（verifier A）：SET_CANVAS_BASE 原子化——先確認登入、為新網址同步，成功才連同資料一起換網址 ──
const candidateOf = (origin) => ({ origin, at: new Date().toISOString() });
const oldSchool = () => ({ canvasBaseUrl: BASE, ...synced([101]), schoolName: 'HKUST(GZ)', schoolNameBase: BASE });

test('SET_CANVAS_BASE：候選學校的課程清單 401 → 網址／課程／校名維持舊校、候選保留、回 success:false', async () => {
  const { fetch, stats } = makeFetch([
    ...originRoutes(BASE, [101]),
    selfOk(OTHER),
    [at(OTHER, /\/api\/v1\/courses\?/), () => res(401)],
  ]);
  const cand = candidateOf(OTHER);
  const bg = loadBackground({ stored: { ...oldSchool(), canvasBaseCandidate: cand }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  assert.equal(resp.success, false, `resp=${JSON.stringify(resp)}`);
  assert.equal(resp.reason, 'sync-failed', '已確認登入、是同步本身失敗 → 不能叫使用者「先登入」');
  assert.equal(bg.store.canvasBaseUrl, BASE);
  assert.deepEqual(bg.store.courses.map((c) => c.id), [101]);
  assert.equal(bg.store.schoolName, 'HKUST(GZ)');
  assert.equal(bg.store.schoolNameBase, BASE);
  assert.deepEqual(bg.store.canvasBaseCandidate, cand, '失敗要保留候選（使用者登入後可再按一次）');
  // 記憶體的 BASE_URL 也沒換：之後的手動同步仍打舊校
  const before = stats.calls.length;
  assert.equal((await bg.send({ type: 'SYNC' })).success, true);
  const after = stats.calls.slice(before).filter(isCoursesList);
  assert.ok(after.length === 1 && after[0].startsWith(BASE), after.join(', '));
});

test('SET_CANVAS_BASE：候選學校未登入（users/self 401）→ 先擋下：不打該校課程清單、不換網址、候選保留', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701]).slice(1)]);   // OTHER 的 users/self → 401
  const cand = candidateOf(OTHER);
  const bg = loadBackground({ stored: { ...oldSchool(), canvasBaseCandidate: cand }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  assert.equal(resp.success, false, `resp=${JSON.stringify(resp)}`);
  assert.equal(resp.reason, 'not-logged-in', 'dashboard 依 reason 決定是否提示「先登入」');
  assert.ok(!stats.calls.some((u) => u.startsWith(OTHER) && isCoursesList(u)), stats.calls.join(', '));
  assert.equal(bg.store.canvasBaseUrl, BASE);
  assert.deepEqual(bg.store.courses.map((c) => c.id), [101]);
  assert.deepEqual(bg.store.canvasBaseCandidate, cand);
});

test('SET_CANVAS_BASE 成功：新網址與新資料同一次寫入（中途不會出現「新網址＋舊校資料」），校名改查新校', async () => {
  const { fetch } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])]);
  const bg = loadBackground({ stored: { ...oldSchool(), canvasBaseCandidate: candidateOf(OTHER) }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  const urlWrites = bg.setLog.filter((o) => 'canvasBaseUrl' in o);
  assert.equal(urlWrites.length, 1, JSON.stringify(urlWrites.map(Object.keys)));
  assert.equal(urlWrites[0].canvasBaseUrl, OTHER);
  assert.ok(urlWrites[0].lastSync && urlWrites[0].courses, '網址要跟同步資料同一次 set');
  assert.equal(bg.store.schoolNameBase, OTHER);
  assert.equal(bg.store.schoolName, 'OTHER(UNI)');
  assert.equal(bg.store.canvasBaseCandidate, undefined);
});

test('SET_CANVAS_BASE：新校某門課失敗 → 不沿用舊校同 id 課程的資料（那是別間學校的）', async () => {
  const { fetch } = makeFetch([
    ...originRoutes(BASE, [101]),
    selfOk(OTHER),
    [at(OTHER, /\/api\/v1\/courses\?/), () => res(200, [course(101), course(702)])],
    [at(OTHER, /\/api\/v1\/courses\/101\/assignments\?/), () => res(500)],
    ...originRoutes(OTHER, []).slice(2),
  ]);
  const bg = loadBackground({
    stored: { ...oldSchool(), assignments: { 101: [{ id: 1, name: 'old school HW' }] }, assignmentGroups: { 101: [{ id: 9 }] } },
    fetch,
  });
  await bg.warm();
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.deepEqual((resp.failedCourses || []).map((c) => c.id), [101]);
  assert.deepEqual(bg.store.assignments['101'], [], '不能把舊校的作業掛到新校的課上');
  assert.deepEqual(bg.store.assignmentGroups['101'], []);
  assert.deepEqual(bg.store.assignments['702'], [{ id: 7020, name: 'HW' }]);
});

test('SET_CANVAS_BASE 不加入同網址、但結果將作廢的一般同步（不能回成功卻沒切過去）', async () => {
  const { fetch } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])], { delayMs: 15 });
  const bg = loadBackground({ stored: { canvasBaseUrl: OTHER }, fetch });   // 有網址但從沒同步成功過
  await bg.warm();
  const first = bg.send({ type: 'SYNC' });       // OTHER 的一般同步
  await sleep(5);
  await bg.navigate(`${BASE}/`);                 // 首次偵測採用 BASE → 進行中那場 OTHER 同步結尾會作廢
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  await first;
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.equal(bg.store.canvasBaseUrl, OTHER);
  assert.deepEqual(bg.store.courses.map((c) => c.id), [701]);
});

// ── A2 追加（verify-a2）：寫入失敗要退回舊校、只清仍屬新網址的候選、作廢的切換要回失敗 ──
test('SET_CANVAS_BASE：新校資料寫入失敗（例如超過 storage 配額）→ success:false／sync-failed，記憶體網址退回舊校', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])]);
  const cand = candidateOf(OTHER);
  const bg = loadBackground({
    stored: { ...oldSchool(), canvasBaseCandidate: cand },
    fetch,
    setFailsIf: (o) => 'courses' in o && o.canvasBaseUrl === OTHER,   // 只有新校那筆寫入失敗
  });
  await bg.warm();
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  assert.equal(resp.success, false, `resp=${JSON.stringify(resp)}`);
  assert.equal(resp.reason, 'sync-failed');
  assert.equal(bg.store.canvasBaseUrl, BASE);
  assert.deepEqual(bg.store.canvasBaseCandidate, cand, '失敗要保留候選');
  // 記憶體的 BASE_URL 也要是舊校：之後的手動同步打舊校
  const before = stats.calls.length;
  assert.equal((await bg.send({ type: 'SYNC' })).success, true);
  const after = stats.calls.slice(before).filter(isCoursesList);
  assert.ok(after.length === 1 && after[0].startsWith(BASE), after.join(', '));
  // 回到舊校不能被當成「另一個 Canvas」記成候選
  await bg.navigate(`${BASE}/courses/101`);
  await sleep(30);
  assert.deepEqual(bg.store.canvasBaseCandidate, cand, `候選被改成：${JSON.stringify(bg.store.canvasBaseCandidate)}`);
});

test('SET_CANVAS_BASE 成功時只清「仍是新網址」的候選：切換途中記下的第三間學校要留著', async () => {
  const THIRD = 'https://third-uni.instructure.com';
  const many = Array.from({ length: 24 }, (_, i) => 701 + i);
  const { fetch, stats } = makeFetch(
    [...originRoutes(BASE, [101]), ...originRoutes(OTHER, many), ...originRoutes(THIRD, [801])],
    { delayMs: 10 },
  );
  const bg = loadBackground({ stored: { ...oldSchool(), canvasBaseCandidate: candidateOf(OTHER) }, fetch });
  await bg.warm();
  const p = bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  await until(() => stats.calls.some((u) => u.startsWith(OTHER) && /\/assignments\?/.test(u)));   // 已在拉新校各課
  await bg.navigate(`${THIRD}/`);
  assert.equal(bg.store.canvasBaseCandidate && bg.store.canvasBaseCandidate.origin, THIRD, '前提：切換途中記下第三間');
  const resp = await p;
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.equal(bg.store.canvasBaseUrl, OTHER);
  assert.equal(bg.store.canvasBaseCandidate && bg.store.canvasBaseCandidate.origin, THIRD, '第三間的候選被切換結尾刪掉');
});

test('SET_CANVAS_BASE 進行中 storage 被清掉 → 切換作廢：回 success:false／sync-failed，不把新網址／新資料寫回', async () => {
  const many = Array.from({ length: 12 }, (_, i) => 701 + i);
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, many)], { delayMs: 10 });
  const bg = loadBackground({ stored: { ...oldSchool(), canvasBaseCandidate: candidateOf(OTHER) }, fetch });
  await bg.warm();
  const p = bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  await until(() => stats.calls.some((u) => u.startsWith(OTHER) && /\/assignments\?/.test(u)));
  await bg.clearStorage();
  const resp = await p;
  assert.equal(resp.success, false, `作廢的切換不能回成功（dashboard 會收起提示）：${JSON.stringify(resp)}`);
  assert.equal(resp.reason, 'sync-failed');
  for (const k of ['canvasBaseUrl', 'lastSync', 'courses', 'assignments', 'assignmentGroups', 'canvasBaseCandidate']) {
    assert.equal(bg.store[k], undefined, `${k} 被寫回：${JSON.stringify(bg.store[k])}`);
  }
});

// ── A2-3（verifier A）：「已有確認的學校」看 lastSync，不看課程數；ignoredCanvasOrigins 一律適用 ──
test('已確認的學校（有 lastSync）放假沒有進行中的課 → 造訪另一個 Canvas 只記候選，不默默換掉', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, []), ...originRoutes(OTHER, [701])]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE, ...synced([]) }, fetch });
  await bg.warm();
  await bg.navigate(`${OTHER}/courses/701`);
  await sleep(40);
  assert.equal(bg.store.canvasBaseUrl, BASE);
  assert.equal(bg.store.canvasBaseCandidate && bg.store.canvasBaseCandidate.origin, OTHER);
  assert.ok(!stats.calls.some(isCoursesList), stats.calls.join(', '));
});

test('ignoredCanvasOrigins 不論有沒有已確認的學校都適用：被忽略的 origin 不採用、不記候選、不發請求', async () => {
  for (const stored of [{}, { canvasBaseUrl: BASE }, { canvasBaseUrl: BASE, ...synced([]) }]) {
    const { fetch, stats } = makeFetch([...originRoutes(OTHER, [701])]);
    const bg = loadBackground({ stored: { ...stored, ignoredCanvasOrigins: [OTHER] }, fetch });
    await bg.warm();
    await bg.navigate(`${OTHER}/`);
    await sleep(40);
    assert.equal(bg.store.canvasBaseUrl, stored.canvasBaseUrl, JSON.stringify(stored));
    assert.equal(bg.store.canvasBaseCandidate, undefined, JSON.stringify(stored));
    assert.deepEqual(stats.calls, [], JSON.stringify(stored));
  }
});

// ── A2-4（verifier A）：登入前的「未登入」檢查不能吞掉登入後的落地頁 ──
test('登入前發出的 users/self 還在途中、登入後的落地頁又載入 → 不沿用「未登入」結果，重驗一次', async () => {
  for (const stored of [{}, { canvasBaseUrl: BASE, ...synced([101]) }]) {
    let loggedIn = false;
    const { fetch, stats } = makeFetch([
      ...originRoutes(BASE, [101]),
      // 回應看的是「請求發出當下」的登入狀態（登入前發出的請求即使晚回來也是 401）
      [at(OTHER, /\/api\/v1\/users\/self/), () => { const ok = loggedIn; return sleep(30).then(() => (ok ? res(200, { id: 9 }) : res(401))); }],
      ...originRoutes(OTHER, [701]).slice(1),
    ]);
    const bg = loadBackground({ stored, fetch });
    await bg.warm();
    const pre = bg.navigate(`${OTHER}/login/saml`);
    await sleep(10);
    loggedIn = true;
    const post = bg.navigate(`${OTHER}/`);
    await Promise.all([pre, post]);
    await sleep(60);
    const selfCalls = stats.calls.filter((u) => u.startsWith(`${OTHER}/api/v1/users/self`));
    assert.equal(selfCalls.length, 2, `應重驗一次：${selfCalls.length}（${JSON.stringify(stored)}）`);
    if (stored.lastSync) {
      assert.equal(bg.store.canvasBaseUrl, BASE);
      assert.equal(bg.store.canvasBaseCandidate && bg.store.canvasBaseCandidate.origin, OTHER, '已確認學校 → 記候選');
    } else {
      assert.equal(bg.store.canvasBaseUrl, OTHER, '首次偵測 → 採用');
      assert.deepEqual(Object.keys(bg.store.assignments || {}), ['701']);
    }
  }
});

test('同一 origin 連續載入、已登入 → 進行中的檢查仍合併，只驗一次', async () => {
  const { fetch, stats } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])], { delayMs: 10 });
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE, ...synced([101]) }, fetch });
  await bg.warm();
  await Promise.all([bg.navigate(`${OTHER}/`), bg.navigate(`${OTHER}/courses`), bg.navigate(`${OTHER}/courses/701`)]);
  await sleep(20);
  assert.equal(stats.calls.filter((u) => /users\/self/.test(u)).length, 1);
  assert.equal(bg.store.canvasBaseCandidate && bg.store.canvasBaseCandidate.origin, OTHER);
});

// ── A2-5（verifier A）：補上存活 mutant 的測試 ──
test('同步途中網址被換掉、新網址那場同步失敗 → 舊網址那批結果也不能寫入', async () => {
  const { fetch } = makeFetch([
    ...originRoutes(BASE, [101, 102]),
    selfOk(OTHER),
    [at(OTHER, /\/api\/v1\/courses\?/), () => res(401)],
  ], { delayMs: 15 });
  // 有網址但從沒同步成功過 → 造訪另一個已登入的 Canvas 走首次偵測，立刻換網址
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const first = bg.send({ type: 'SYNC' });
  await sleep(20);
  await bg.navigate(`${OTHER}/`);
  await first;
  await sleep(120);
  assert.equal(bg.store.canvasBaseUrl, OTHER);
  assert.equal(bg.store.courses, undefined, `舊網址的課程被寫入：${JSON.stringify(bg.store.courses)}`);
  assert.equal(bg.store.assignments, undefined);
  assert.equal(bg.store.lastSync, undefined);
});

test('手動 SYNC 成功後 5 分鐘內造訪同一學校 → 不再同步（記憶體節流時間戳已更新）', async () => {
  const { fetch, stats } = makeFetch([coursesRoute([101]), ...okCourseRoutes]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  assert.equal((await bg.send({ type: 'SYNC' })).success, true);
  await bg.navigate(`${BASE}/courses/101`);
  await sleep(40);
  assert.equal(stats.calls.filter(isCoursesList).length, 1, stats.calls.filter(isCoursesList).join(', '));
});

test('限流 403 連續兩次 → 只重試一次（該端點共 2 個請求），該課列入 failedCourses', async () => {
  const { fetch, stats } = makeFetch([
    coursesRoute([101]),
    [/\/courses\/101\/assignments\?/, () => res(403, '403 Forbidden (Rate Limit Exceeded)')],
    ...okCourseRoutes,
  ]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC' });
  assert.equal(resp.success, true);
  assert.deepEqual((resp.failedCourses || []).map((c) => c.id), [101]);
  assert.equal(stats.calls.filter((u) => /\/courses\/101\/assignments\?/.test(u)).length, 2);
});

test('users/self 回應帶 while(1); 前綴 → 仍算已登入（首次偵測採用並同步）', async () => {
  const { fetch } = makeFetch([
    [at(BASE, /\/api\/v1\/users\/self/), () => res(200, 'while(1);{"id":7,"name":"Ray"}')],
    ...originRoutes(BASE, [101]).slice(1),
  ]);
  const bg = loadBackground({ stored: {}, fetch });
  await bg.warm();
  await bg.navigate(`${BASE}/`);
  await sleep(60);
  assert.equal(bg.store.canvasBaseUrl, BASE);
  assert.deepEqual(bg.store.assignments && bg.store.assignments['101'], [{ id: 1010, name: 'HW' }]);
});

// ── AI 評分比重分析的排程（v2.1 合併）：同步資料寫入成功後，用這場同步的網址排程一次 ──
test('AI 排程：SYNC 成功 → 用這場同步的網址排程一次', async () => {
  const { fetch } = makeFetch(originRoutes(BASE, [101]));
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC' });
  assert.equal(resp.success, true);
  assert.deepEqual([...bg.scheduled], [BASE]);
});

test('AI 排程：課程清單 401（同步失敗）→ 不排程', async () => {
  const { fetch } = makeFetch([[/\/api\/v1\/courses\?/, () => res(401)]]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const resp = await bg.send({ type: 'SYNC' });
  assert.equal(resp.success, false);
  assert.deepEqual([...bg.scheduled], []);
});

test('AI 排程：SET_CANVAS_BASE 切換成功 → 用新網址排程', async () => {
  const { fetch } = makeFetch([...originRoutes(BASE, [101]), ...originRoutes(OTHER, [701])]);
  const bg = loadBackground({
    stored: { canvasBaseUrl: BASE, ...synced([101]), canvasBaseCandidate: { origin: OTHER, at: new Date().toISOString() } },
    fetch,
  });
  await bg.warm();
  const resp = await bg.send({ type: 'SET_CANVAS_BASE', origin: OTHER });
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.deepEqual([...bg.scheduled], [OTHER]);
});

test('AI 排程：同步途中網址被換掉、舊網址那批結果作廢 → 不用舊網址排程', async () => {
  const { fetch } = makeFetch([
    ...originRoutes(BASE, [101, 102]),
    selfOk(OTHER),
    [at(OTHER, /\/api\/v1\/courses\?/), () => res(401)],
  ], { delayMs: 15 });
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch });
  await bg.warm();
  const first = bg.send({ type: 'SYNC' });
  await sleep(20);
  await bg.navigate(`${OTHER}/`);
  await first;
  await sleep(120);
  assert.ok(!bg.scheduled.includes(BASE), `不該用舊網址排程：${JSON.stringify([...bg.scheduled])}`);
});

test('AI 訊息：SW 冷啟動、storage 還沒回填 → 等讀回學校網址再交給 handleAiMessage', async () => {
  const { fetch } = makeFetch([]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, storageDelayMs: 30, fetch });
  const resp = await bg.send({ type: 'AI_RUN_NOW' });
  assert.equal(resp.success, true, `resp=${JSON.stringify(resp)}`);
  assert.deepEqual(bg.aiMessages.map((m) => m.base), [BASE]);
});

test('AI 訊息：handleAiMessage 不認得、也沒回應的 AI_ 訊息 → 仍會關掉通道（回 undefined），不讓呼叫端等到逾時', async () => {
  const { fetch } = makeFetch([]);
  const bg = loadBackground({ stored: { canvasBaseUrl: BASE }, fetch, aiHandler: () => false });
  await bg.warm();
  const resp = await bg.send({ type: 'AI_UNKNOWN' });
  assert.notEqual(resp && resp.timeout, true, `resp=${JSON.stringify(resp)}`);
});

(async () => {
  // 跑完全部再回報（一個失敗不擋住後面的案例）
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`PASS ${name}`);
    } catch (err) {
      failed++;
      console.error(`FAIL ${name}\n  ${err && err.message}`);
    }
  }
  if (failed) throw new Error(`${failed} background test(s) failed`);
  console.log('ALL background TESTS PASSED');
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

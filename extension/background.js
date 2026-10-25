// AI 評分比重分析（spec 2026-09-03）：純規則 + 供應商層 + 編排，全部在 ai/ 目錄，與同步路徑隔離
// vendor 的 pdf.js 必須先 worker 再 lib（worker 檔設定全域 pdfjsWorker，lib 的 fake-worker 直接抓它用）——見 ai/vendor/README.md
importScripts('ai/vendor/pdf.worker.min.js', 'ai/vendor/pdf.min.js', 'ai/pdfText.js', 'ai/gradingRules.js', 'ai/providers.js', 'ai/analysisRunner.js');

let BASE_URL = '';

// 自動同步節流狀態（記憶體）：上次成功同步的時間戳（ms）。
// service worker 會被殺再喚醒、記憶體會歸零，故啟動時從 storage 的 lastSync 回填（別只靠記憶體）。
let _lastAutoSyncAt = 0;
// 進行中的同步（防重入）：同一個 Canvas 同步中再被呼叫就回傳同一個 promise，後到的呼叫端拿到真實結果，
// 而不是立刻回報成功；也避免並行同步交錯寫 chrome.storage.local。
// _syncBase＝進行中那場同步的 Canvas 網址；網址不同的呼叫不加入，等它結束後另跑一場（見 syncBase）。
// _syncAdopt＝進行中那場是不是切換同步（SET_CANVAS_BASE）；切換請求只加入切換同步
let _syncPromise = null;
let _syncBase = null;
let _syncAdopt = false;


// Load stored Canvas URL on startup (service worker may restart)
// SW 被事件喚醒時，事件 handler 可能比這個非同步回填先跑（BASE_URL 還是空的）→
// 讀 BASE_URL / _lastAutoSyncAt 的 handler 一律先 await _ready。
// _ready 一定要 settle：storage 出錯時回呼可能拿到 undefined（runtime.lastError），
// 回呼 throw 會讓 promise 永遠 pending、所有 handler 跟著掛住 → try/finally。
const _ready = new Promise((resolve) => {
  try {
    chrome.storage.local.get(['canvasBaseUrl', 'lastSync'], (data) => {
      try {
        const d = data || {};
        if (d.canvasBaseUrl) BASE_URL = d.canvasBaseUrl;
        // 從 storage 回填節流時間戳，避免 SW 重啟後每頁又觸發一次全量同步
        if (d.lastSync) {
          const ms = new Date(d.lastSync).getTime();
          if (Number.isFinite(ms)) _lastAutoSyncAt = ms;
        }
      } finally {
        resolve();
      }
    });
  } catch (_) {
    resolve();
  }
});

// storage 被清掉（例如在 chrome://extensions 清除擴充功能資料，QA #152）→ 記憶體裡的網址／節流時間戳跟著歸零。
// 否則這個仍活著的 SW 回到 Canvas 會被 5 分鐘節流擋掉，之後同步出的資料也不再帶 canvasBaseUrl。
// 歸零後下次造訪 Canvas 走「首次偵測」：確認已登入 → 採用並立即同步，等同全新安裝；
// 清除當下若有同步進行中，runSync 結尾的 BASE_URL !== base 檢查會丟棄那批結果，剛清掉的資料不會被寫回。
if (chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const removed = (k) => changes[k] && changes[k].newValue === undefined;
    if (removed('canvasBaseUrl')) BASE_URL = '';
    if (removed('lastSync')) _lastAutoSyncAt = 0;
  });
}

// 首次安裝時開啟教學頁面
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html?welcome=1') });
  }
});

// 自動同步節流：使用者在 Canvas 每點開一頁都會觸發 onCompleted，每次打開 popup 也會送 AUTO_SYNC，
// 若不節流，每一頁／每次打開都會對所有課程 × 作業 × 權重發出大量並行請求。
// 規則：同一個 Canvas、距上次成功同步未滿 5 分鐘就跳過（依記憶體時間戳 _lastAutoSyncAt 判斷）；
//      從未同步（_lastAutoSyncAt 為 0）或首次偵測採用新網址一律立即同步；
//      手動 SYNC 訊息不受此節流限制。
const AUTO_SYNC_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 分鐘

// 呼叫前先 await _ready（_lastAutoSyncAt 由 storage 的 lastSync 回填）
function autoSyncDue() {
  return !_lastAutoSyncAt || Date.now() - _lastAutoSyncAt >= AUTO_SYNC_MIN_INTERVAL_MS;
}

// 自動同步不能讓 rejection 逸出（會變成 unhandled rejection）
function runAutoSync() {
  return syncAll().catch((err) => console.error('[Due] auto-sync 失敗:', err));
}

// ── Canvas 網址偵測 ──
// webNavigation 的 filter 只有 hostSuffix '.instructure.com'，會比對到官網、狀態頁、beta/test 環境；
// 這些都不是學生要同步的 Canvas（beta/test 是定期複製的舊資料），一律忽略。
const NON_CANVAS_SUBDOMAINS = ['www', 'status', 'community', 'support', 'info'];

function isCanvasHost(origin) {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'https:' || !hostname.endsWith('.instructure.com')) return false;
    const labels = hostname.split('.').slice(0, -2);   // 去掉 instructure.com
    if (!labels.length || NON_CANVAS_SUBDOMAINS.includes(labels[0])) return false;
    return !labels.some((l) => l === 'beta' || l === 'test');
  } catch (_) {
    return false;
  }
}

// 該 origin 是否為「已登入的 Canvas」：/api/v1/users/self 回 200 JSON 且有 id。
// 未登入（401、或被導去 SSO 而拿到 HTML）→ false；使用者登入後會再落到該 origin，屆時再判斷。
async function isLoggedInCanvas(origin) {
  try {
    const res = await fetch(`${origin}/api/v1/users/self`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;
    // Canvas 對 session 驗證的 JSON 可能加 while(1); 前綴（防 JSON hijacking）
    const user = JSON.parse((await res.text()).replace(/^while\(1\);/, ''));
    return !!(user && user.id != null);
  } catch (_) {
    return false;
  }
}

// 造訪的 Canvas 與目前 BASE_URL 不同：
//   ignoredCanvasOrigins 內的 → 一律不理（不論有沒有已確認的學校）；
//   首次偵測（沒有已確認的學校）→ 確認已登入才採用並立即同步；
//   已確認的學校 → 不切換、不同步，只記成候選 canvasBaseCandidate，由 dashboard 讓使用者決定（已是目前候選的不重驗）。
// 「已確認的學校」＝BASE_URL 是 Canvas host 且有 lastSync（runSync 成功時與 canvasBaseUrl 同一次寫入）；
// 不看課程數：放假沒有進行中課程的學校也是使用者選定的，不能被默默換掉（verifier A）。
// 同一 origin 連續載入多頁時只驗一次（_originChecks 合併進行中的檢查）；但檢查若以「未登入」收場，
// 而途中又有新的載入（例如登入後的落地頁）→ 那個 users/self 可能是登入前發出的，不能套用到之後的載入，重驗一次。
const _originChecks = new Map();   // origin → { promise, reloaded }
function handleOtherCanvasOrigin(origin) {
  const running = _originChecks.get(origin);
  if (running) {
    running.reloaded = true;
    return running.promise;
  }
  const entry = { promise: null, reloaded: false };
  entry.promise = (async () => {
    try {
      let notLoggedIn = await checkOtherCanvasOrigin(origin);
      while (notLoggedIn && entry.reloaded) {
        entry.reloaded = false;
        notLoggedIn = await checkOtherCanvasOrigin(origin);
      }
    } finally {
      _originChecks.delete(origin);
    }
  })();
  _originChecks.set(origin, entry);
  return entry.promise;
}

// 回傳 true＝因「未登入」而沒動作（handleOtherCanvasOrigin 據此決定要不要為途中的新載入重驗）
async function checkOtherCanvasOrigin(origin) {
  const data = (await chrome.storage.local.get(['lastSync', 'canvasBaseCandidate', 'ignoredCanvasOrigins'])) || {};
  if ((data.ignoredCanvasOrigins || []).includes(origin)) return false;
  // 舊版可能把 canvasBaseUrl 改成 www／status 等非 Canvas 網址 → 視同沒有已確認的學校，回到學校 Canvas 就自動修正
  const hasConfirmedSchool = isCanvasHost(BASE_URL) && !!data.lastSync;
  if (hasConfirmedSchool && data.canvasBaseCandidate && data.canvasBaseCandidate.origin === origin) return false;
  if (!(await isLoggedInCanvas(origin))) return true;
  if (origin === BASE_URL) return false;   // 驗證期間已被採用（例如 SET_CANVAS_BASE 成功）
  if (hasConfirmedSchool) {
    await chrome.storage.local.set({ canvasBaseCandidate: { origin, at: new Date().toISOString() } });
    return false;
  }
  BASE_URL = origin;
  await chrome.storage.local.set({ canvasBaseUrl: origin });
  await chrome.storage.local.remove('canvasBaseCandidate');
  runAutoSync();
  return false;
}

// 使用者在 dashboard 按「切換到這裡」：原子切換——
//   1) 先確認已登入該 Canvas（未登入直接失敗，不打課程 API）；
//   2) 為新網址跑一場同步，但期間 BASE_URL／canvasBaseUrl 維持舊校（runSync 的 adopt 模式）；
//   3) 同步成功才把新網址連同新資料同一次寫入、清候選、換 BASE_URL（寫入失敗則退回舊校）。
// 任何一步失敗 → throw（SET_CANVAS_BASE 回 success:false），舊網址、舊資料、候選都不動，使用者可再按一次。
// 失敗原因帶 reason 給 dashboard 選提示：'not-logged-in'（users/self 未通過）；其餘一律 'sync-failed'（handler 預設）
async function setCanvasBase(origin) {
  await _ready;
  if (!isCanvasHost(origin)) throw new Error('不是可用的 Canvas 網址');
  const next = new URL(origin).origin;
  if (next === BASE_URL) {
    await chrome.storage.local.remove('canvasBaseCandidate');
    return syncAll();
  }
  if (!(await isLoggedInCanvas(next))) throw reasonError('not-logged-in', '尚未登入該 Canvas');
  return syncBase(next, true);
}

// 帶 reason 的失敗（SET_CANVAS_BASE handler 原樣回給 dashboard）
function reasonError(reason, message) {
  const err = new Error(message);
  err.reason = reason;
  return err;
}

// 使用者按「忽略」：之後造訪該 origin 不再提示
async function ignoreCanvasBase(origin) {
  const data = (await chrome.storage.local.get(['ignoredCanvasOrigins', 'canvasBaseCandidate'])) || {};
  const ignored = new Set(data.ignoredCanvasOrigins || []);
  if (typeof origin === 'string' && origin) ignored.add(origin);
  await chrome.storage.local.set({ ignoredCanvasOrigins: [...ignored] });
  const cand = data.canvasBaseCandidate;
  if (!cand || cand.origin === origin) await chrome.storage.local.remove('canvasBaseCandidate');
}

// 監聽造訪 Canvas 頁面：自動偵測學校 URL 並（節流後）觸發同步
chrome.webNavigation
  ? chrome.webNavigation.onCompleted.addListener(
    async (details) => {
      if (details.frameId !== 0) return;
      try {
        await _ready;
        const origin = new URL(details.url).origin;
        if (!isCanvasHost(origin)) return;

        if (origin !== BASE_URL) {
          await handleOtherCanvasOrigin(origin);
          return;
        }

        // 同一個 Canvas：從未成功同步過（_lastAutoSyncAt 為 0；SW 重啟後若 storage 也無 lastSync 亦為 0）→ 立即同步；
        // 否則套用 5 分鐘節流（依記憶體時間戳判斷，不必每頁讀 storage）
        if (!autoSyncDue()) {
          console.log('[Due] auto-sync 跳過：距上次同步未滿 5 分鐘');
          return;
        }
        runAutoSync();
      } catch (err) {
        console.error('[Due] 偵測 Canvas 網址失敗:', err);
      }
    },
    { url: [{ hostSuffix: '.instructure.com' }] }
  )
  : null;

// Claude usage is now handled passively via content script (claude_injected.js + claude_content.js)
// No webNavigation listener needed for claude.ai

// ── Message handlers ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && typeof message.type === 'string' && message.type.startsWith('AI_')) {
    // 先等 storage 回填學校網址（SW 剛被這則訊息喚醒時 BASE_URL 可能還是空的，見 _ready）。
    // 改成非同步後一定要回應：handleAiMessage 回 false 且沒呼叫 sendResponse（不認得的 AI_ 訊息）→ 補回 undefined 關掉通道
    _ready.then(() => {
      let responded = false;
      const respond = (r) => { responded = true; sendResponse(r); };
      const isAsync = handleAiMessage(message, respond, BASE_URL);
      if (!isAsync && !responded) sendResponse(undefined);
    });
    return true;
  }

  // popup 打開時送來：使用者多半接著會開 Dashboard，先在背景同步省下等待。
  // 與造訪 Canvas 同一套 5 分鐘節流；還沒有學校網址（從未偵測到 Canvas）就不動。不等同步結束就回應（popup 可能隨時關掉）
  if (message.type === 'AUTO_SYNC') {
    _ready.then(() => {
      if (!BASE_URL) { sendResponse({ started: false, reason: 'no-base' }); return; }
      if (!autoSyncDue()) { sendResponse({ started: false, reason: 'throttled' }); return; }
      runAutoSync();
      sendResponse({ started: true });
    });
    return true;
  }

  if (message.type === 'SYNC') {
    syncAll()
      .then(({ failedCourses }) => sendResponse({ success: true, failedCourses }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // dashboard「偵測到另一個 Canvas」提示的兩個動作
  if (message.type === 'SET_CANVAS_BASE') {
    setCanvasBase(message.origin)
      .then(({ failedCourses }) => sendResponse({ success: true, failedCourses }))
      .catch((err) => sendResponse({ success: false, reason: err.reason || 'sync-failed', error: err.message }));
    return true;
  }

  if (message.type === 'IGNORE_CANVAS_BASE') {
    ignoreCanvasBase(message.origin)
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

  if (message.type === 'CLAUDE_ORG_ID_LEARNED') {
    // Passively learned orgId from any claude.ai org API call — store for future direct fetches
    chrome.storage.local.set({ claudeOrgId: message.orgId });
    return false;
  }

  if (message.type === 'CLAUDE_USAGE_INTERCEPTED') {
    // Passively received from content script — parse and store
    const record = parseApiUsage(message.data);
    if (record) {
      chrome.storage.local.set({ claudeOrgId: message.orgId, claudeUsage: record });
    }
    return false; // no sendResponse needed
  }

  // 抓不到 → { success:false, reason, error }；reason：'no-tab'｜'request-failed'｜'script-failed'
  // （popup 依 reason 顯示提示，見 QA P3 #63）。請求成功但目前沒有 5 小時用量窗 → success:true／usage:null
  if (message.type === 'SYNC_CLAUDE_USAGE') {
    fetchClaudeUsageDirect()
      .then((usage) => sendResponse({ success: true, usage }))
      .catch((err) => sendResponse({ success: false, reason: err.reason || 'unknown', error: err.message }));
    return true;
  }
});

// API key 存在 storage.local：鎖成只有擴充功能自身頁面可讀（claude.ai 的 content script 讀不到）
// 必須放在所有 listener 註冊「之後」並包 try：舊版 Chrome 不支援限制 storage.local 時這行會同步丟錯，
// 擺在最前面會讓整支 script 中斷，onInstalled／onCompleted／onMessage 全都註冊不到。
try {
  if (chrome.storage.local.setAccessLevel) {
    chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).catch(() => { });
  }
} catch (_) { }

async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Claude Usage (API-based) ──

// Parse the /api/organizations/{id}/usage JSON response
function parseApiUsage(data) {
  if (!data || !data.five_hour) return null;
  const { utilization, resets_at } = data.five_hour;
  if (utilization == null) return null;
  return {
    usedPercent: Math.round(Number(utilization)),
    resetAt: resets_at || null,
    lastSync: new Date().toISOString(),
  };
}

// 帶 reason 的失敗（SYNC_CLAUDE_USAGE handler 原樣回給 popup）
function claudeUsageError(reason, message) {
  const err = new Error(message);
  err.reason = reason;
  return err;
}

// Fetch usage by executing script inside an existing claude.ai tab
// (Cloudflare blocks direct fetch from service worker context)
// 抓不到一律 throw claudeUsageError（不再 return null 吞掉原因）；回傳 null 只代表「請求成功但沒有用量窗」
async function fetchClaudeUsageDirect() {
  // Find any claude.ai tab
  const tabs = await chrome.tabs.query({});
  const claudeTab = tabs.find((t) => {
    try { return t.url && new URL(t.url).hostname === 'claude.ai'; } catch (_) { return false; }
  });

  if (!claudeTab) {
    console.warn('[Due] No claude.ai tab open — cannot fetch usage');
    throw claudeUsageError('no-tab', 'No claude.ai tab open');
  }

  let result;
  try {
    [result] = await chrome.scripting.executeScript({
      target: { tabId: claudeTab.id },
      func: async () => {
        try {
          // Step 1: get orgId
          const orgRes = await fetch('/api/organizations', { credentials: 'include' });
          if (!orgRes.ok) return { error: `org status ${orgRes.status}` };
          const orgs = await orgRes.json();
          if (!Array.isArray(orgs) || orgs.length === 0 || !orgs[0].uuid) {
            return { error: 'no org found' };
          }
          const orgId = orgs[0].uuid;

          // Step 2: get usage
          const usageRes = await fetch(`/api/organizations/${orgId}/usage`, { credentials: 'include' });
          if (!usageRes.ok) return { error: `usage status ${usageRes.status}` };
          const data = await usageRes.json();

          return { orgId, data };
        } catch (err) {
          return { error: err.message };
        }
      },
    });
  } catch (err) {
    console.warn('[Due] executeScript failed:', err.message);
    throw claudeUsageError('script-failed', err.message);
  }

  if (!result || !result.result) throw claudeUsageError('script-failed', 'No result from claude.ai tab');
  const { orgId, data, error } = result.result;

  if (error) {
    // org/usage 非 2xx（未登入 403 等）、找不到 org、回 HTML（Cloudflare 擋）JSON 解析失敗
    console.warn('[Due] In-tab usage fetch error:', error);
    throw claudeUsageError('request-failed', error);
  }

  // Store orgId for content script use
  if (orgId) await chrome.storage.local.set({ claudeOrgId: orgId });

  const record = parseApiUsage(data);
  if (record) {
    await chrome.storage.local.set({ claudeUsage: record });
    return record;
  }

  return null;
}


// ── Canvas API pagination ──
// Canvas 限流回 403「Rate Limit Exceeded」（或 429）：等一下重試一次，避免單課失敗
const RATE_LIMIT_RETRY_MS = 2000;

async function isRateLimited(res) {
  if (res.status === 429) return true;
  if (res.status !== 403) return false;
  try { return /rate limit/i.test(await res.clone().text()); } catch (_) { return false; }
}

async function fetchAllPages(url) {
  const results = [];
  let nextUrl = url;
  let retried = false;
  while (nextUrl) {
    const res = await fetch(nextUrl, { credentials: 'include' });
    if (!res.ok) {
      if (!retried && await isRateLimited(res)) {
        retried = true;
        await new Promise((r) => setTimeout(r, RATE_LIMIT_RETRY_MS));
        continue;
      }
      throw new Error(`Canvas API error: ${res.status} ${res.statusText}`);
    }
    results.push(...(await res.json()));
    nextUrl = parseLinkNext(res.headers.get('Link'));
  }
  return results;
}

// 以固定併發數跑 fn（fn 自行處理錯誤）；同步時每門課同時打 2 個端點，
// 不設上限的話修課一多就是 2N 個並行請求，容易撞 Canvas 限流
async function mapWithConcurrency(items, limit, fn) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

function parseLinkNext(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

// ── Canvas API endpoints ──
// 一律傳入該場同步開始時的 base（runSync 的快照），不讀全域 BASE_URL：
// 同步途中網址被換掉時，A 校的課程 id 才不會拿去 B 校查（401 → 整包清空）。
async function fetchCourses(base) {
  return fetchAllPages(`${base}/api/v1/courses?enrollment_state=active&per_page=50`);
}

async function fetchAssignments(base, courseId) {
  return fetchAllPages(
    `${base}/api/v1/courses/${courseId}/assignments?per_page=50&include[]=submission`
  );
}

// 不帶 include[]=assignments：那會把整包作業物件（含描述）在 assignmentGroups 再存一份；
// 分組成員改用作業本身的 assignment_group_id 對應（dashboard 的 findGroup / 成績計算器）
async function fetchAssignmentGroups(base, courseId) {
  return fetchAllPages(
    `${base}/api/v1/courses/${courseId}/assignment_groups?include[]=group_weight`
  );
}

function isGenericSchoolName(name) {
  if (!name) return true;
  const n = String(name).trim().toLowerCase();
  return n === 'canvas' || n === 'instructure';
}

function inferSchoolNameFromHost(base) {
  try {
    const host = new URL(base).host; // e.g. hkust-gz.instructure.com
    const sub = host.split('.')[0] || '';
    if (!sub) return 'Canvas';
    const parts = sub.split('-').filter(Boolean).map((p) => p.toUpperCase());
    if (parts.length >= 2) return `${parts[0]}(${parts.slice(1).join('-')})`;
    return parts[0];
  } catch (_) {
    return 'Canvas';
  }
}

// 學生身分查 accounts 幾乎必回 401：同一個 Canvas 已有非通用校名就沿用（schoolNameBase 記它屬於哪個網址），
// 否則 accounts/self 查一次 → 最多再查第一門課的 account_id → hostname 推算。
async function fetchSchoolName(base, courses = [], prev = {}) {
  if (prev.schoolNameBase === base && !isGenericSchoolName(prev.schoolName)) return prev.schoolName;

  // 1) Try account self first.
  try {
    const account = await fetchJSON(`${base}/api/v1/accounts/self`);
    if (account && account.name && !isGenericSchoolName(account.name)) return account.name;
  } catch (_) { }

  // 2) Try the first course account_id only.
  const accountId = (courses || []).map((c) => c.account_id).find(Boolean);
  if (accountId) {
    try {
      const account = await fetchJSON(`${base}/api/v1/accounts/${accountId}`);
      if (account && account.name && !isGenericSchoolName(account.name)) return account.name;
    } catch (_) { }
  }

  // 3) Fallback from hostname.
  return inferSchoolNameFromHost(base);
}

// ── Sync ──
const SYNC_CONCURRENCY = 4;   // 同時同步的課程數（每門課 2 個端點 → 最多 8 個並行請求）

// 為目前網址（BASE_URL）同步
function syncAll() {
  return _ready.then(() => syncBase(BASE_URL, false));
}

// 同一個 Canvas 的同步進行中 → 加入它；進行中的是「另一個」網址 → 不加入，等它結束後再跑
// （一般同步重讀 BASE_URL；adopt 切換同步仍為指定的 base）。
// adopt=true：SET_CANVAS_BASE 的切換同步——base 還不是 BASE_URL，成功才採用（見 runSync）
function syncBase(base, adopt) {
  if (!_syncPromise) {
    _syncBase = base;
    _syncAdopt = adopt;
    _syncPromise = runSync(base, { adopt }).finally(() => { _syncPromise = null; _syncBase = null; _syncAdopt = false; });
    return _syncPromise;
  }
  // 切換請求不加入同網址的一般同步：那場若因網址已變而作廢會回成功卻沒寫入，切換就會假成功
  if (_syncBase === base && (_syncAdopt || !adopt)) {
    console.log('[Due] 已有同步進行中，等待同一場同步的結果');
    return _syncPromise;
  }
  console.log('[Due] 進行中的同步屬於另一個 Canvas 網址，結束後再同步');
  return _syncPromise.catch(() => { }).then(() => (adopt ? syncBase(base, true) : syncAll()));
}

// base：這場同步固定使用的 Canvas 網址（開始時的快照，途中不再讀全域 BASE_URL）
// adopt：切換同步（SET_CANVAS_BASE）。期間 BASE_URL 仍是舊校；成功時才把 BASE_URL 換成 base，
//        canvasBaseUrl 與新資料同一次寫入並清候選。單課失敗不沿用 storage 裡的舊資料（那是舊校的）。
// 回傳 { failedCourses: [{ id, name, error }] }；拉課程清單失敗則 throw
async function runSync(base, { adopt = false } = {}) {
  if (!base) {
    // throw 讓手動 SYNC 誠實回報失敗（auto-sync 路徑已有 .catch 吞掉）
    throw new Error('尚未偵測到 Canvas 網址，請先造訪一次你的 Canvas 網站');
  }
  // 結尾寫入前 BASE_URL 必須仍是這個值，否則這批結果作廢（一般同步＝base；切換同步＝開始時的舊校網址）
  const expectedBase = adopt ? BASE_URL : base;
  console.log('[Due] 開始同步...', base, adopt ? '（切換）' : '');

  let courses;
  try {
    courses = await fetchCourses(base);
  } catch (err) {
    console.error('[Due] 拉取課程失敗:', err);
    throw err; // 往上拋，讓 SYNC handler 能回報 success:false，dashboard 端才知道失敗
  }

  // 單課失敗時沿用上次成功的資料：清成 [] 會讓那門課看起來「沒有作業」。
  // 切換同步時 storage 裡的是舊校資料（課程 id 可能撞號）→ 不沿用
  const prev = (await chrome.storage.local.get(['assignments', 'assignmentGroups', 'schoolName', 'schoolNameBase'])) || {};
  const prevAssignments = adopt ? {} : (prev.assignments || {});
  const prevGroups = adopt ? {} : (prev.assignmentGroups || {});

  const schoolName = await fetchSchoolName(base, courses, prev);
  courses = courses.filter((c) => c.name && c.workflow_state === 'available');

  const assignments = {};
  const assignmentGroups = {};
  const failedCourses = [];

  await mapWithConcurrency(courses, SYNC_CONCURRENCY, async (course) => {
    try {
      const [asgn, groups] = await Promise.all([
        fetchAssignments(base, course.id),
        fetchAssignmentGroups(base, course.id),
      ]);
      assignments[course.id] = asgn;
      assignmentGroups[course.id] = groups;
    } catch (err) {
      console.error(`[Due] 課程 ${course.id} 同步失敗，沿用上次資料:`, err);
      assignments[course.id] = prevAssignments[course.id] || [];
      assignmentGroups[course.id] = prevGroups[course.id] || [];
      failedCourses.push({ id: course.id, name: course.name, error: err.message });
    }
  });

  // 同步途中網址已被換掉（首次偵測採用新網址／storage 被清掉／別的切換先成功）→ 這批結果作廢不寫；
  // 新網址那場同步由 syncBase 接在這場之後跑。切換同步作廢時 throw（SET_CANVAS_BASE 回 success:false）
  if (BASE_URL !== expectedBase) {
    console.log('[Due] 同步期間 Canvas 網址已變更，丟棄這次結果:', base);
    if (adopt) throw new Error('同步期間 Canvas 網址已變更');
    return { failedCourses };
  }
  // 切換同步：檢查通過就同步換 BASE_URL（與上面的檢查之間沒有 await，不會被別的 handler 插隊）
  if (adopt) BASE_URL = base;

  // canvasBaseUrl 隨每次同步回寫：storage 裡的網址不論怎麼遺失，下一次成功同步就補回（QA #152）；
  // 切換同步也靠這裡把新網址與新資料同一次寫入（不會有「新網址＋舊校資料」的中間態）
  try {
    await chrome.storage.local.set({
      lastSync: new Date().toISOString(),
      canvasBaseUrl: base,
      schoolName,
      schoolNameBase: base,
      courses,
      assignments,
      assignmentGroups,
    });
  } catch (err) {
    // 寫入失敗（例如超過 QUOTA_BYTES）：storage 仍是舊校 → 記憶體也退回舊校，否則之後的同步都打新校、
    // 回到舊校反而被記成候選。期間網址若已被別處改掉（例如 storage 被清掉而歸零）就不動
    if (adopt && BASE_URL === base) BASE_URL = expectedBase;
    throw err;
  }
  // 候選就是剛同步成功的這個網址（切換成功）→ 清掉，dashboard 的提示跟著消失。
  // 寫入後重讀：同步途中可能又記下另一間學校的候選（不能用同步開始時的快照判斷，會誤刪）
  const { canvasBaseCandidate } = (await chrome.storage.local.get('canvasBaseCandidate')) || {};
  if (canvasBaseCandidate && canvasBaseCandidate.origin === base) {
    await chrome.storage.local.remove('canvasBaseCandidate');
  }

  // 成功寫入 storage 後才更新節流時間戳；上面拉課程失敗會 throw、走不到這裡，
  // 時間戳不更新 → 下次造訪 Canvas 仍會重試同步
  _lastAutoSyncAt = Date.now();

  // AI 評分比重分析：資料寫入成功後才排程，用這場同步的網址（不讀全域 BASE_URL；切換學校成功也走這裡）；
  // 排到下一個 tick 跑，不 await、不阻塞 SYNC 回應、不佔用同步排程
  scheduleGradingAnalysis(base);

  console.log(`[Due] 同步完成，共 ${courses.length} 門課程，${failedCourses.length} 門沿用舊資料`);
  return { failedCourses };
}

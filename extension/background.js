// AI 評分比重分析（spec 2026-09-03）：純規則 + 供應商層 + 編排，全部在 ai/ 目錄，與同步路徑隔離
importScripts('ai/gradingRules.js', 'ai/providers.js', 'ai/analysisRunner.js');

let BASE_URL = '';

// 自動同步節流狀態（記憶體）：上次成功同步的時間戳（ms）。
// service worker 會被殺再喚醒、記憶體會歸零，故啟動時從 storage 的 lastSync 回填（別只靠記憶體）。
let _lastAutoSyncAt = 0;
// syncAll 防重入旗標：避免並行 syncAll 交錯寫 chrome.storage.local。
let _syncing = false;


// Load stored Canvas URL on startup (service worker may restart)
chrome.storage.local.get(['canvasBaseUrl', 'lastSync'], (data) => {
  if (data.canvasBaseUrl) BASE_URL = data.canvasBaseUrl;
  // 從 storage 回填節流時間戳，避免 SW 重啟後每頁又觸發一次全量同步
  if (data.lastSync) {
    const ms = new Date(data.lastSync).getTime();
    if (Number.isFinite(ms)) _lastAutoSyncAt = ms;
  }
});

// 首次安裝時開啟教學頁面
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html?welcome=1') });
  }
});

// 自動同步節流：使用者在 Canvas 每點開一頁都會觸發 onCompleted，
// 若不節流，每一頁都會對所有課程 × 作業 × 權重發出大量並行請求。
// 規則：距上次成功同步未滿 5 分鐘且 BASE_URL 未變化就跳過（依記憶體時間戳 _lastAutoSyncAt 判斷）；
//      從未同步（_lastAutoSyncAt 為 0）或 BASE_URL 變化（換學校 / 首次偵測）一律立即同步；
//      手動 SYNC 訊息不受此節流限制。
const AUTO_SYNC_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 分鐘

// 監聽造訪任何 Canvas 頁面，自動偵測學校 URL 並（節流後）觸發同步
chrome.webNavigation
  ? chrome.webNavigation.onCompleted.addListener(
    (details) => {
      if (details.frameId !== 0) return;

      let baseUrlChanged = false;
      try {
        const origin = new URL(details.url).origin;
        if (origin !== BASE_URL) {
          BASE_URL = origin;
          baseUrlChanged = true;
          chrome.storage.local.set({ canvasBaseUrl: origin });
        }
      } catch (_) { }

      // 自動同步不能讓 rejection 逸出（會變成 unhandled rejection）
      const runAutoSync = () =>
        syncAll().catch((err) => console.error('[Due] auto-sync 失敗:', err));

      // 一定要同步的例外（略過節流）：
      //   1) BASE_URL 剛變化（換學校 / 首次偵測 origin）
      //   2) 從未成功同步過（_lastAutoSyncAt 為 0；SW 重啟後若 storage 也無 lastSync 亦為 0）
      if (baseUrlChanged || !_lastAutoSyncAt) {
        runAutoSync();
        return;
      }

      // 否則套用 5 分鐘節流（依記憶體時間戳判斷，不必每頁讀 storage）
      if (Date.now() - _lastAutoSyncAt < AUTO_SYNC_MIN_INTERVAL_MS) {
        console.log('[Due] auto-sync 跳過：距上次同步未滿 5 分鐘');
        return;
      }
      runAutoSync();
    },
    { url: [{ hostSuffix: '.instructure.com' }] }
  )
  : null;

// Claude usage is now handled passively via content script (claude_injected.js + claude_content.js)
// No webNavigation listener needed for claude.ai

// ── Message handlers ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && typeof message.type === 'string' && message.type.startsWith('AI_')) {
    return handleAiMessage(message, sendResponse, BASE_URL);
  }

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

  if (message.type === 'SYNC_CLAUDE_USAGE') {
    fetchClaudeUsageDirect()
      .then((usage) => sendResponse({ success: true, usage }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
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

// Fetch usage by executing script inside an existing claude.ai tab
// (Cloudflare blocks direct fetch from service worker context)
async function fetchClaudeUsageDirect() {
  // Find any claude.ai tab
  const tabs = await chrome.tabs.query({});
  const claudeTab = tabs.find((t) => {
    try { return t.url && new URL(t.url).hostname === 'claude.ai'; } catch (_) { return false; }
  });

  if (!claudeTab) {
    console.warn('[Due] No claude.ai tab open — cannot fetch usage');
    return null;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
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

    if (!result || !result.result) return null;
    const { orgId, data, error } = result.result;

    if (error) {
      console.warn('[Due] In-tab usage fetch error:', error);
      return null;
    }

    // Store orgId for content script use
    if (orgId) await chrome.storage.local.set({ claudeOrgId: orgId });

    const record = parseApiUsage(data);
    if (record) {
      await chrome.storage.local.set({ claudeUsage: record });
      return record;
    }
  } catch (err) {
    console.warn('[Due] executeScript failed:', err.message);
  }

  return null;
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

function isGenericSchoolName(name) {
  if (!name) return true;
  const n = String(name).trim().toLowerCase();
  return n === 'canvas' || n === 'instructure';
}

function inferSchoolNameFromHost() {
  try {
    const host = new URL(BASE_URL).host; // e.g. hkust-gz.instructure.com
    const sub = host.split('.')[0] || '';
    if (!sub) return 'Canvas';
    const parts = sub.split('-').filter(Boolean).map((p) => p.toUpperCase());
    if (parts.length >= 2) return `${parts[0]}(${parts.slice(1).join('-')})`;
    return parts[0];
  } catch (_) {
    return 'Canvas';
  }
}

async function fetchSchoolName(courses = []) {
  // 1) Try account self first.
  try {
    const account = await fetchJSON(`${BASE_URL}/api/v1/accounts/self`);
    if (account && account.name && !isGenericSchoolName(account.name)) return account.name;
  } catch (_) { }

  // 2) Try course account_id(s), pick first non-generic account name.
  const accountIds = [...new Set((courses || []).map((c) => c.account_id).filter(Boolean))];
  for (const accountId of accountIds) {
    try {
      const account = await fetchJSON(`${BASE_URL}/api/v1/accounts/${accountId}`);
      if (account && account.name && !isGenericSchoolName(account.name)) return account.name;
    } catch (_) { }
  }

  // 3) Fallback from hostname.
  return inferSchoolNameFromHost();
}

// ── Sync ──
async function syncAll() {
  // 防重入：已在同步中就直接 return，避免並行 syncAll 交錯寫 chrome.storage.local
  if (_syncing) {
    console.log('[Due] 已有同步進行中，略過本次重入');
    return;
  }
  if (!BASE_URL) {
    // throw 讓手動 SYNC 誠實回報失敗（auto-sync 路徑已有 .catch 吞掉）
    throw new Error('尚未偵測到 Canvas 網址，請先造訪一次你的 Canvas 網站');
  }
  console.log('[Due] 開始同步...', BASE_URL);

  _syncing = true;
  try {
    let courses;
    let schoolName = 'Canvas';
    try {
      courses = await fetchCourses();
      schoolName = await fetchSchoolName(courses);
    } catch (err) {
      console.error('[Due] 拉取課程失敗:', err);
      throw err; // 往上拋，讓 SYNC handler 能回報 success:false，dashboard 端才知道失敗
    }

    courses = courses.filter((c) => c.name && c.workflow_state === 'available');

    const assignments = {};
    const assignmentGroups = {};

    await Promise.all(
      courses.map(async (course) => {
        try {
          const [asgn, groups] = await Promise.all([
            fetchAssignments(course.id),
            fetchAssignmentGroups(course.id),
          ]);
          assignments[course.id] = asgn;
          assignmentGroups[course.id] = groups;
        } catch (err) {
          console.error(`[Due] 課程 ${course.id} 同步失敗:`, err);
          assignments[course.id] = [];
          assignmentGroups[course.id] = [];
        }
      })
    );

    await chrome.storage.local.set({
      lastSync: new Date().toISOString(),
      schoolName,
      courses,
      assignments,
      assignmentGroups,
    });

    // 成功寫入 storage 後才更新節流時間戳；上面拉課程失敗會 throw、走不到這裡，
    // 時間戳不更新 → 下次造訪 Canvas 仍會重試同步
    _lastAutoSyncAt = Date.now();

    // AI 評分比重分析：排到下一個 tick 跑，不 await、不阻塞 SYNC 回應、不持有 _syncing
    scheduleGradingAnalysis(BASE_URL);

    console.log(`[Due] 同步完成，共 ${courses.length} 門課程`);
  } finally {
    // 無論成功或拋錯都歸位，避免旗標卡住讓之後的同步全被擋掉
    _syncing = false;
  }
}

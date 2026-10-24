# AI 評分比重分析（自動、只跑一次、寫入手動權重）實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 同步結束後在背景用使用者自備的 LLM API key 從 Canvas 課程大綱抓出評分比重，寫進現有的手動權重（`customWeights`），每門課成功一次後不再重跑；前端顯示邏輯零改動，只新增設定 modal。

**Architecture:** 所有 AI 邏輯放新目錄 `extension/ai/`：兩個純函式 UMD 模組（`gradingRules.js` 規則／解析、`providers.js` 組請求）附 node 測試，加一個 service worker 側編排檔 `analysisRunner.js`（透過 `importScripts` 併入 `background.js` 全域）。Dashboard 只新增 `aiSettings.js`（modal，自帶三語字串）與 `dashboard.js` 四個接點。LLM 呼叫靠供應商 CORS，不加必要 host permission；PDF 下載走 `optional_host_permissions`。

**Tech Stack:** Chrome MV3、vanilla JS、`chrome.storage.local`、`chrome.permissions`、`node:assert/strict` 測試（無 runner、無 package.json）。

**Spec:** `docs/superpowers/specs/2026-09-03-ai-grading-weights-restore-design.md`（實作時遇到本計畫沒寫到的細節，以 spec 為準）。

**分支：** 已在 `feat/ai-grading-weights`。所有 commit 訊息結尾加：
```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

**重要慣例（每個 task 都適用）**
- 專案沒有 package.json，測試用 `node <file>.test.js` 直接跑，語法檢查用 `node --check <file>`。
- UMD 包裝格式照 `extension/dashboard/taskRules.js`。
- 註解用繁體中文，與既有程式一致。
- **不得**修改 `extension/dashboard/taskRules.js`、`completion.js`、`customAssignments.js`、`descSanitizer.js`、`extension/popup.*`、`extension/claude_*.js`，也不得修改 `dashboard.js` 內的 `renderWeightPie`／`openWeightEditModal`／`renderCourseDetailSection`／`loadData`／`I18N`。
- 工作區原本就有 `.claude/settings.local.json` 修改與 `extension.zip` 刪除，**不要** `git add -A`；每次只 add 本 task 的檔案。

---

## 檔案結構

| 檔案 | 動作 | 職責 |
|---|---|---|
| `extension/ai/gradingRules.js` | 新增 | 純函式：供應商預設、設定解析、`shouldAnalyze` 規則、重試狀態機、關鍵字比對、HTML 去標籤、回應解析、權重正規化、prompt 文字、狀態摘要 |
| `extension/ai/gradingRules.test.js` | 新增 | 上述測試 |
| `extension/ai/providers.js` | 新增 | 純函式：`buildRequest`（Gemini 原生／OpenAI 相容）、`extractText`、`normalizeBaseUrl`、`supportsPdf` |
| `extension/ai/providers.test.js` | 新增 | 上述測試 |
| `extension/ai/analysisRunner.js` | 新增 | service worker 側編排：鎖、排程、Canvas fetch、PDF 下載、呼叫供應商、寫 storage、AI_* 訊息 |
| `extension/background.js` | 修改 | `importScripts`、`setAccessLevel`、訊息轉交、`syncAll` 尾端排程（<15 行） |
| `extension/manifest.json` | 修改 | `optional_host_permissions`、`version` |
| `extension/dashboard/aiSettings.js` | 新增 | 設定 modal 全部邏輯與三語字串 |
| `extension/dashboard/index.html` | 修改 | 選單項目、modal markup 與 CSS、兩個 `<script>` |
| `extension/dashboard/dashboard.js` | 修改 | 選單 click、`applyUILanguage` 一行、Esc closers 一行、a11y 陣列一項、`GRADING_WEIGHTS_UPDATED` 監聽 |
| `CLAUDE.md`、`AGENTS.md`、`README.md`、`README.zh-TW.md`、`privacy-policy.md` | 修改 | 文件 |

---

### Task 1: `gradingRules.js` 純規則模組（TDD）

**Files:**
- Create: `extension/ai/gradingRules.js`
- Create: `extension/ai/gradingRules.test.js`

- [ ] **Step 1: 寫失敗的測試**

建立 `extension/ai/gradingRules.test.js`：

```js
const assert = require('node:assert/strict');
const R = require('./gradingRules.js');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const DAY = 86400000;
const HOUR = 3600000;
const NOW = Date.parse('2026-09-03T00:00:00Z');

// ── resolveConfig ──
test('resolveConfig: 空／未知 provider → gemini 預設，未設定', () => {
  const c = R.resolveConfig(undefined);
  assert.equal(c.provider, 'gemini');
  assert.equal(c.model, 'gemini-2.5-flash');
  assert.equal(c.baseUrl, 'https://generativelanguage.googleapis.com/v1beta');
  assert.equal(c.configured, false);
  assert.equal(R.resolveConfig({ provider: 'bogus', apiKey: 'k' }).provider, 'gemini');
});

test('resolveConfig: model/baseUrl 空字串取供應商預設；key 有值即 configured', () => {
  const c = R.resolveConfig({ provider: 'deepseek', apiKey: ' sk-1 ', model: '  ', baseUrl: '' });
  assert.equal(c.apiKey, 'sk-1');
  assert.equal(c.model, 'deepseek-chat');
  assert.equal(c.baseUrl, 'https://api.deepseek.com/v1');
  assert.equal(c.configured, true);
  const q = R.resolveConfig({ provider: 'qwen', apiKey: 'k', model: 'qwen-max', baseUrl: 'https://x.example/v1/' });
  assert.equal(q.model, 'qwen-max');
  assert.equal(q.baseUrl, 'https://x.example/v1/');
});

// ── shouldAnalyze ──
const base = { courseId: 7, customWeights: {}, groups: [], record: undefined, now: NOW };

test('shouldAnalyze: 已有手動權重 → 不跑', () => {
  const d = R.shouldAnalyze({ ...base, customWeights: { 7: [{ name: 'HW', weight: 40 }] } });
  assert.deepEqual(d, { run: false, reason: 'hasCustomWeights' });
});

test('shouldAnalyze: 手動權重為空陣列 → 視同沒有，照跑', () => {
  assert.equal(R.shouldAnalyze({ ...base, customWeights: { 7: [] } }).run, true);
});

test('shouldAnalyze: Canvas 有 group_weight → 不跑', () => {
  const d = R.shouldAnalyze({ ...base, groups: [{ name: 'A', group_weight: 0 }, { name: 'B', group_weight: 30 }] });
  assert.deepEqual(d, { run: false, reason: 'hasCanvasWeights' });
});

test('shouldAnalyze: 全部 group_weight 為 0/null → 照跑', () => {
  assert.equal(R.shouldAnalyze({ ...base, groups: [{ group_weight: 0 }, { group_weight: null }] }).run, true);
});

test('shouldAnalyze: 已 done → 永不重跑（即使權重被還原）', () => {
  const d = R.shouldAnalyze({ ...base, record: { status: 'done', attempts: 1, nextRetryAt: null } });
  assert.deepEqual(d, { run: false, reason: 'done' });
});

test('shouldAnalyze: attempts 達 3 → 不跑', () => {
  const d = R.shouldAnalyze({ ...base, record: { status: 'notFound', attempts: 3, nextRetryAt: new Date(NOW - DAY).toISOString() } });
  assert.deepEqual(d, { run: false, reason: 'maxAttempts' });
});

test('shouldAnalyze: 冷卻中 → 不跑；冷卻到期 → retry', () => {
  const rec = { status: 'notFound', attempts: 1, nextRetryAt: new Date(NOW + HOUR).toISOString() };
  assert.deepEqual(R.shouldAnalyze({ ...base, record: rec }), { run: false, reason: 'cooldown' });
  assert.deepEqual(R.shouldAnalyze({ ...base, record: rec, now: NOW + HOUR }), { run: true, reason: 'retry' });
});

test('shouldAnalyze: 無紀錄 → first', () => {
  assert.deepEqual(R.shouldAnalyze(base), { run: true, reason: 'first' });
});

// ── nextRecord ──
const META = { provider: 'gemini', model: 'gemini-2.5-flash' };

test('nextRecord: done → attempts 累加、nextRetryAt null、保留 components', () => {
  const r = R.nextRecord({ status: 'notFound', attempts: 1 }, { kind: 'done', source: 'syllabus_pdf', components: [{ name: 'HW', weight: 40, description: '' }] }, NOW, META);
  assert.equal(r.status, 'done');
  assert.equal(r.attempts, 2);
  assert.equal(r.nextRetryAt, null);
  assert.equal(r.at, '2026-09-03T00:00:00.000Z');
  assert.equal(r.source, 'syllabus_pdf');
  assert.equal(r.provider, 'gemini');
  assert.deepEqual(r.components, [{ name: 'HW', weight: 40, description: '' }]);
});

test('nextRecord: notFound → 7 天後重試；error → 24 小時後重試、error 截 200 字', () => {
  const nf = R.nextRecord(undefined, { kind: 'notFound', source: 'none', notes: 'no material' }, NOW, META);
  assert.equal(nf.attempts, 1);
  assert.equal(nf.nextRetryAt, new Date(NOW + 7 * DAY).toISOString());
  assert.equal(nf.notes, 'no material');
  const er = R.nextRecord(undefined, { kind: 'error', source: 'none', error: 'x'.repeat(500) }, NOW, META);
  assert.equal(er.nextRetryAt, new Date(NOW + 24 * HOUR).toISOString());
  assert.equal(er.error.length, 200);
});

// ── courseStatus ──
test('courseStatus: done → done；有權重無紀錄 → skipped；無紀錄無權重 → pending；冷卻中 notFound → notFound', () => {
  assert.equal(R.courseStatus({ ...base, record: { status: 'done', attempts: 1 } }), 'done');
  assert.equal(R.courseStatus({ ...base, groups: [{ group_weight: 50 }] }), 'skipped');
  assert.equal(R.courseStatus(base), 'pending');
  const cooling = { status: 'notFound', attempts: 1, nextRetryAt: new Date(NOW + DAY).toISOString() };
  assert.equal(R.courseStatus({ ...base, record: cooling }), 'notFound');
  assert.equal(R.courseStatus({ ...base, record: { ...cooling, nextRetryAt: new Date(NOW - 1).toISOString() } }), 'pending');
});

// ── findSyllabusByKeyword ──
test('findSyllabusByKeyword: 強關鍵字命中；rubric 類不命中', () => {
  const files = [
    { id: 1, display_name: 'Assessment 1 rubric.pdf' },
    { id: 2, display_name: 'Grading Rubric HW2.pdf' },
    { id: 3, display_name: 'COMP1001_Syllabus_2026.pdf' },
  ];
  assert.equal(R.findSyllabusByKeyword(files).id, 3);
  assert.equal(R.findSyllabusByKeyword(files.slice(0, 2)), null);
  assert.equal(R.findSyllabusByKeyword([{ id: 9, filename: 'grading policy.pdf' }]).id, 9);
  assert.equal(R.findSyllabusByKeyword([{ id: 8, display_name: 'Course Outline.pdf' }]).id, 8);
  assert.equal(R.findSyllabusByKeyword(null), null);
});

// ── extractFileIds ──
test('extractFileIds: 多種連結格式、去重、保序', () => {
  const html = '<a href="/courses/1/files/111/download?x=1">a</a> <a href="https://s.instructure.com/files/222/preview">b</a> <a href="/files/111">dup</a>';
  assert.deepEqual(R.extractFileIds(html), ['111', '222']);
  assert.deepEqual(R.extractFileIds(''), []);
});

// ── stripHtml ──
test('stripHtml: 移除 script/style 內容、解碼實體、壓空白、區塊結尾換行', () => {
  const html = '<style>.a{color:red}</style><p>Grading &amp; Policy</p><script>var x = 1;</script><div>HW   30%&nbsp;&#65;</div>';
  const out = R.stripHtml(html);
  assert.equal(out.includes('color:red'), false);
  assert.equal(out.includes('var x'), false);
  assert.equal(out, 'Grading & Policy\nHW 30% A');
});

// ── parseAnalysisResponse ──
test('parseAnalysisResponse: 去 ```json 圍欄、"30%" 字串轉數字、過濾無效項', () => {
  const text = '```json\n{"found":true,"components":[{"name":"Homework","weight":"30%","description":"d"},{"name":"","weight":10},{"name":"Final","weight":0},{"name":"Exam","weight":70}],"notes":"ok"}\n```';
  const p = R.parseAnalysisResponse(text);
  assert.equal(p.ok, true);
  assert.equal(p.found, true);
  assert.deepEqual(p.components.map((c) => [c.name, c.weight]), [['Homework', 30], ['Exam', 70]]);
  assert.equal(p.notes, 'ok');
});

test('parseAnalysisResponse: 非法 JSON → ok:false；components 全無效 → found:false', () => {
  assert.equal(R.parseAnalysisResponse('Sorry, I cannot').ok, false);
  const p = R.parseAnalysisResponse('{"found":true,"components":[{"name":"x","weight":null}]}');
  assert.equal(p.ok, true);
  assert.equal(p.found, false);
});

// ── normalizeWeights ──
test('normalizeWeights: 小數比例 ×100；同名合併；四捨五入一位', () => {
  const n = R.normalizeWeights([
    { name: 'HW', weight: 0.3, description: '' },
    { name: 'hw', weight: 0.1, description: '' },
    { name: 'Final', weight: 0.6, description: '' },
  ]);
  assert.equal(n.ok, true);
  assert.deepEqual(n.components.map((c) => [c.name, c.weight]), [['HW', 40], ['Final', 60]]);
  assert.equal(n.total, 100);
});

test('normalizeWeights: 總和 70 → 不採用；總和 95 → 採用', () => {
  const bad = R.normalizeWeights([{ name: 'A', weight: 30, description: '' }, { name: 'B', weight: 40, description: '' }]);
  assert.equal(bad.ok, false);
  assert.equal(bad.reason, 'weights sum 70');
  assert.equal(R.normalizeWeights([{ name: 'A', weight: 55.55, description: '' }, { name: 'B', weight: 39.44, description: '' }]).ok, true);
  assert.equal(R.normalizeWeights([]).ok, false);
});

test('toCustomWeights: 只留 name/weight', () => {
  assert.deepEqual(R.toCustomWeights([{ name: 'A', weight: 40, description: 'x' }]), [{ name: 'A', weight: 40 }]);
});

// ── prompts / file pick ──
test('prompts: SYSTEM_PROMPT 要求 JSON 與百分比；buildFilePickPrompt 列檔案；parseFilePick 對回檔案', () => {
  assert.ok(R.SYSTEM_PROMPT.includes('ONLY valid JSON'));
  assert.ok(R.SYSTEM_PROMPT.includes('percentage'));
  assert.ok(R.USER_PROMPT.length > 10);
  const files = [{ id: 5, display_name: 'a.pdf' }, { id: 6, filename: 'b.pdf' }];
  const prompt = R.buildFilePickPrompt(files);
  assert.ok(prompt.includes('5: a.pdf'));
  assert.ok(prompt.includes('6: b.pdf'));
  assert.equal(R.parseFilePick('6', files).id, 6);
  assert.equal(R.parseFilePick('```json\n5\n```', files).id, 5);
  assert.equal(R.parseFilePick('null', files), null);
  assert.equal(R.parseFilePick('99', files), null);
});

test('pickSource: 優先序 syllabus_pdf > keyword_pdf > ai_selected_pdf > syllabus_body > none', () => {
  assert.equal(R.pickSource({ syllabusPdf: true, keywordPdf: true, syllabusText: true }), 'syllabus_pdf');
  assert.equal(R.pickSource({ keywordPdf: true, syllabusText: true }), 'keyword_pdf');
  assert.equal(R.pickSource({ aiPdf: true }), 'ai_selected_pdf');
  assert.equal(R.pickSource({ syllabusText: true }), 'syllabus_body');
  assert.equal(R.pickSource({}), 'none');
});

test('constants: 上限值', () => {
  assert.equal(R.MAX_ATTEMPTS, 3);
  assert.equal(R.MAX_COURSES_PER_RUN, 10);
  assert.equal(R.MAX_PDF_BYTES, 10 * 1024 * 1024);
  assert.equal(R.MAX_TOTAL_PDF_BYTES, 15 * 1024 * 1024);
  assert.equal(R.PDF_PERMISSION_ORIGIN, 'https://*.canvas-user-content.com/*');
});

console.log('ALL gradingRules TESTS PASSED');
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node extension/ai/gradingRules.test.js`
Expected: `Error: Cannot find module './gradingRules.js'`

- [ ] **Step 3: 寫實作**

建立 `extension/ai/gradingRules.js`：

```js
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
    const baseUrl = (typeof s.baseUrl === 'string' && s.baseUrl.trim()) || def.baseUrl;
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
    const rec = {
      status: outcome.kind,
      attempts,
      at: new Date(now).toISOString(),
      nextRetryAt: null,
      source: outcome.source || 'none',
      provider: meta && meta.provider,
      model: meta && meta.model,
    };
    if (outcome.kind === 'done') {
      rec.components = outcome.components;
    } else if (outcome.kind === 'notFound') {
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
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
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
    let parsed;
    try {
      parsed = JSON.parse(stripFences(text));
    } catch (_) {
      return { ok: false, error: 'invalid JSON' };
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
      const key = c.name.toLowerCase();
      if (index.has(key)) merged[index.get(key)].weight += c.weight;
      else { index.set(key, merged.length); merged.push({ ...c }); }
    }
    for (const c of merged) c.weight = Math.round(c.weight * 10) / 10;
    const total = Math.round(merged.reduce((s, c) => s + c.weight, 0) * 10) / 10;
    if (total < WEIGHT_SUM_MIN || total > WEIGHT_SUM_MAX) {
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
```

- [ ] **Step 4: 跑測試確認通過**

Run: `node extension/ai/gradingRules.test.js`
Expected: 每行 `PASS ...`，最後 `ALL gradingRules TESTS PASSED`，exit 0。若 `stripHtml` 那題失敗，先檢查輸出字串（區塊結尾應為 `\n`、`&#65;` 應解成 `A`、多個空白壓成一個）。

- [ ] **Step 5: Commit**

```bash
git add extension/ai/gradingRules.js extension/ai/gradingRules.test.js
git commit -m "feat(ai): 評分比重分析純規則模組 gradingRules.js（含測試）

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: `providers.js` 供應商請求模組（TDD）

**Files:**
- Create: `extension/ai/providers.js`
- Create: `extension/ai/providers.test.js`

- [ ] **Step 1: 寫失敗的測試**

建立 `extension/ai/providers.test.js`：

```js
const assert = require('node:assert/strict');
const P = require('./providers.js');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const GEMINI = { provider: 'gemini', apiKey: 'AIza-secret', model: 'gemini-2.5-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/' };
const DEEPSEEK = { provider: 'deepseek', apiKey: 'sk-secret', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1/' };
const PARTS = [
  { type: 'pdf', base64: 'QUJD', mimeType: 'application/pdf', bytes: 3 },
  { type: 'text', text: 'Course Syllabus:\nHW 30%' },
  { type: 'text', text: 'Extract it.' },
];

test('normalizeBaseUrl: 去尾斜線與空白', () => {
  assert.equal(P.normalizeBaseUrl('https://x.example/v1///'), 'https://x.example/v1');
  assert.equal(P.normalizeBaseUrl('  https://x.example/v1 '), 'https://x.example/v1');
  assert.equal(P.normalizeBaseUrl(undefined), '');
});

test('supportsPdf: 只有 gemini', () => {
  assert.equal(P.supportsPdf('gemini'), true);
  assert.equal(P.supportsPdf('qwen'), false);
  assert.equal(P.supportsPdf('deepseek'), false);
});

test('buildRequest gemini: url 不含 key、key 走 x-goog-api-key、pdf → inlineData、systemInstruction、generationConfig', () => {
  const req = P.buildRequest(GEMINI, PARTS, 'SYS', { temperature: 0, maxTokens: 2048 });
  assert.equal(req.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
  assert.equal(req.url.includes('AIza'), false);
  assert.equal(req.headers['x-goog-api-key'], 'AIza-secret');
  assert.equal(req.headers['Content-Type'], 'application/json');
  assert.deepEqual(Object.keys(req.headers).sort(), ['Content-Type', 'x-goog-api-key']);
  assert.deepEqual(req.body.systemInstruction, { parts: [{ text: 'SYS' }] });
  assert.deepEqual(req.body.contents[0].parts[0], { inlineData: { mimeType: 'application/pdf', data: 'QUJD' } });
  assert.deepEqual(req.body.contents[0].parts[1], { text: 'Course Syllabus:\nHW 30%' });
  assert.deepEqual(req.body.generationConfig, { maxOutputTokens: 2048, temperature: 0 });
});

test('buildRequest gemini: 無 systemPrompt／無 temperature 時不帶對應欄位', () => {
  const req = P.buildRequest(GEMINI, [{ type: 'text', text: 'hi' }], '', { maxTokens: 8 });
  assert.equal('systemInstruction' in req.body, false);
  assert.deepEqual(req.body.generationConfig, { maxOutputTokens: 8 });
});

test('buildRequest OpenAI 相容: /chat/completions、Bearer、PDF 丟棄、文字以空行串接', () => {
  const req = P.buildRequest(DEEPSEEK, PARTS, 'SYS', { temperature: 0, maxTokens: 2048 });
  assert.equal(req.url, 'https://api.deepseek.com/v1/chat/completions');
  assert.equal(req.headers.Authorization, 'Bearer sk-secret');
  assert.equal(req.body.model, 'deepseek-chat');
  assert.deepEqual(req.body.messages[0], { role: 'system', content: 'SYS' });
  assert.deepEqual(req.body.messages[1], { role: 'user', content: 'Course Syllabus:\nHW 30%\n\nExtract it.' });
  assert.equal(req.body.max_tokens, 2048);
  assert.equal(req.body.temperature, 0);
  assert.equal(JSON.stringify(req.body).includes('QUJD'), false);
});

test('buildRequest OpenAI 相容: 無 systemPrompt 只有 user 訊息；maxTokens 預設 2048', () => {
  const req = P.buildRequest(DEEPSEEK, [{ type: 'text', text: 'hi' }], '', {});
  assert.equal(req.body.messages.length, 1);
  assert.equal(req.body.max_tokens, 2048);
  assert.equal('temperature' in req.body, false);
});

test('extractText gemini: 串接 parts；空回應 throw', () => {
  assert.equal(P.extractText('gemini', { candidates: [{ content: { parts: [{ text: '{"a":' }, { text: '1}' }] } }] }), '{"a":1}');
  assert.throws(() => P.extractText('gemini', { candidates: [] }), /Empty response/);
  assert.throws(() => P.extractText('gemini', {}), /Empty response/);
});

test('extractText OpenAI 相容: choices[0].message.content；空回應 throw', () => {
  assert.equal(P.extractText('deepseek', { choices: [{ message: { content: 'ok' } }] }), 'ok');
  assert.throws(() => P.extractText('qwen', { choices: [{ message: { content: '' } }] }), /Empty response/);
});

console.log('ALL providers TESTS PASSED');
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node extension/ai/providers.test.js`
Expected: `Error: Cannot find module './providers.js'`

- [ ] **Step 3: 寫實作**

建立 `extension/ai/providers.js`：

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueAiProviders = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ═══════════════════════════════════════════════════════════════
  // Due AI 供應商層：只負責「組請求」與「取回應文字」，不 fetch（可在 node 測試）
  // gemini → 原生 generateContent（支援 PDF inlineData；key 走 header，不進 URL）
  // 其餘（qwen / deepseek / 任何 OpenAI 相容）→ {baseUrl}/chat/completions（純文字）
  // 只送供應商需要的 header：Gemini 對 preflight 帶未知 header 會回 403
  // ═══════════════════════════════════════════════════════════════

  function normalizeBaseUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
  }

  function supportsPdf(provider) {
    return provider === 'gemini';
  }

  // cfg: resolveConfig() 的結果；parts: [{type:'text', text} | {type:'pdf', base64, mimeType}]
  // 回 { url, headers, body }，body 為物件（呼叫端 JSON.stringify）
  function buildRequest(cfg, parts, systemPrompt, opts) {
    const o = opts || {};
    const maxTokens = o.maxTokens || 2048;
    const temperature = o.temperature;

    if (cfg.provider === 'gemini') {
      const geminiParts = parts.map((p) =>
        p.type === 'pdf'
          ? { inlineData: { mimeType: p.mimeType || 'application/pdf', data: p.base64 } }
          : { text: p.text }
      );
      const generationConfig = { maxOutputTokens: maxTokens };
      if (temperature !== undefined) generationConfig.temperature = temperature;
      const body = { contents: [{ parts: geminiParts }], generationConfig };
      if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
      return {
        url: `${normalizeBaseUrl(cfg.baseUrl)}/models/${encodeURIComponent(cfg.model)}:generateContent`,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
        body,
      };
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({
      role: 'user',
      content: parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n\n'),
    });
    const body = { model: cfg.model, messages, max_tokens: maxTokens };
    if (temperature !== undefined) body.temperature = temperature;
    return {
      url: `${normalizeBaseUrl(cfg.baseUrl)}/chat/completions`,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body,
    };
  }

  function extractText(provider, json) {
    if (provider === 'gemini') {
      const cand = json && Array.isArray(json.candidates) ? json.candidates[0] : null;
      const parts = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts : [];
      const text = parts.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('');
      if (!text.trim()) throw new Error('Empty response');
      return text;
    }
    const choice = json && Array.isArray(json.choices) ? json.choices[0] : null;
    const text = choice && choice.message ? choice.message.content : '';
    if (typeof text !== 'string' || !text.trim()) throw new Error('Empty response');
    return text;
  }

  return { normalizeBaseUrl, supportsPdf, buildRequest, extractText };
});
```

- [ ] **Step 4: 跑測試確認通過**

Run: `node extension/ai/providers.test.js`
Expected: 全部 `PASS`，最後 `ALL providers TESTS PASSED`。

- [ ] **Step 5: Commit**

```bash
git add extension/ai/providers.js extension/ai/providers.test.js
git commit -m "feat(ai): 供應商請求模組 providers.js（Gemini 原生／OpenAI 相容，含測試）

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: `analysisRunner.js` 編排 ＋ `background.js` 接線 ＋ manifest

**Files:**
- Create: `extension/ai/analysisRunner.js`
- Modify: `extension/background.js`（第 1 行前加 importScripts；啟動區塊；訊息路由開頭；`syncAll` 內 `_lastAutoSyncAt = Date.now();` 之後）
- Modify: `extension/manifest.json`

沒有單元測試（用 `chrome.*` 與 `fetch`）；以 `node --check` 與人工驗收為驗證。

- [ ] **Step 1: 建立 `extension/ai/analysisRunner.js`**

```js
// ═══════════════════════════════════════════════════════════════
// Due AI 評分比重分析：service worker 側編排
// 由 background.js 以 importScripts 載入，與 background.js 同屬 worker 全域：
//   - 依賴 DueGradingRules / DueAiProviders（先 importScripts）
//   - 直接呼叫 background.js 的 fetchJSON(url) / fetchAllPages(url)（帶 cookie 的 Canvas fetch）
//   - BASE_URL 由呼叫端傳入，這裡不讀 background.js 的變數
// 只跑一次規則、重試冷卻、寫入 customWeights 的邏輯見 DueGradingRules 與 spec §5–§6
// ═══════════════════════════════════════════════════════════════

let _aiAnalyzing = false; // 全域鎖：新手教學期間連續多次 SYNC 不會疊跑

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
  const { aiConfig } = await chrome.storage.local.get(['aiConfig']);
  const cfg = DueGradingRules.resolveConfig(aiConfig);
  if (!cfg.configured) return; // 沒 key：整個功能沉默
  const baseUrl = await aiResolveBaseUrl(baseUrlHint);
  if (!baseUrl) return;

  _aiAnalyzing = true;
  try {
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
      let outcome;
      try {
        outcome = await analyzeCourse(course, cfg, { baseUrl, pdfAllowed });
      } catch (err) {
        outcome = { kind: 'error', source: 'none', error: err && err.message ? err.message : String(err) };
      }
      await recordOutcome(course.id, outcome, cfg);
    }
  } finally {
    _aiAnalyzing = false;
  }
}

// 每門課寫入前重新讀 storage（舊版一次讀整個 map 再寫回，多課會互相覆蓋）
async function recordOutcome(courseId, outcome, cfg) {
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
      for (const fid of R.extractFileIds(syllabusBody)) {
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
  const raw = await callProvider(cfg, parts, R.SYSTEM_PROMPT, { temperature: 0, maxTokens: 2048 });
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
      { temperature: 0, maxTokens: 16 }
    );
    return DueGradingRules.parseFilePick(raw, files);
  } catch (_) {
    return null;
  }
}

// 只接受真的 PDF：Content-Type 含 pdf 或前 5 bytes 為 %PDF-；單檔 ≤ MAX_PDF_BYTES
async function tryFetchPdf(url) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > DueGradingRules.MAX_PDF_BYTES) return null;
    const ct = (res.headers.get('Content-Type') || '').toLowerCase();
    const head = String.fromCharCode(...new Uint8Array(buf.slice(0, 5)));
    if (!ct.includes('pdf') && head !== '%PDF-') return null;
    return { type: 'pdf', base64: arrayBufferToBase64(buf), mimeType: 'application/pdf', bytes: buf.byteLength };
  } catch (_) {
    return null;
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function callProvider(cfg, parts, systemPrompt, opts) {
  const req = DueAiProviders.buildRequest(cfg, parts, systemPrompt, opts);
  const res = await fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`${cfg.provider} API ${res.status}: ${t.slice(0, 160)}`);
  }
  const json = await res.json();
  return DueAiProviders.extractText(cfg.provider, json);
}

// ── AI_* 訊息（由 background.js 的 onMessage 轉交；回傳值即 onMessage 的回傳值）──
function handleAiMessage(message, sendResponse, baseUrl) {
  if (message.type === 'AI_GET_STATUS') {
    aiGetStatus().then(sendResponse).catch((err) => sendResponse({ error: err.message }));
    return true;
  }
  if (message.type === 'AI_TEST_CONNECTION') {
    aiTestConnection(message.config).then(sendResponse);
    return true;
  }
  if (message.type === 'AI_RUN_NOW') {
    scheduleGradingAnalysis(baseUrl);
    sendResponse({ success: true });
    return false;
  }
  if (message.type === 'AI_RESET_ANALYSIS') {
    // 只清分析紀錄；不動 customWeights（使用者要還原權重走編輯器的「還原 Canvas 權重」）
    chrome.storage.local.set({ gradingAnalysis: {} }).then(() => {
      scheduleGradingAnalysis(baseUrl);
      sendResponse({ success: true });
    });
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
    await callProvider(cfg, [{ type: 'text', text: 'Reply with the single word OK.' }], '', { maxTokens: 8 });
    return { success: true };
  } catch (err) {
    return { success: false, error: String((err && err.message) || err).slice(0, 200) };
  }
}
```

- [ ] **Step 2: `node --check extension/ai/analysisRunner.js`**

Expected: 無輸出、exit 0。

- [ ] **Step 3: 修改 `extension/background.js`**

(a) 檔案最上方（`let BASE_URL = '';` 之前）加：

```js
// AI 評分比重分析（spec 2026-09-03）：純規則 + 供應商層 + 編排，全部在 ai/ 目錄，與同步路徑隔離
importScripts('ai/gradingRules.js', 'ai/providers.js', 'ai/analysisRunner.js');

```

(b) 在 `chrome.storage.local.get(['canvasBaseUrl', 'lastSync'], ...)` 那個啟動區塊**之後**加：

```js
// API key 存在 storage.local：鎖成只有擴充功能自身頁面可讀（claude.ai 的 content script 讀不到）
if (chrome.storage.local.setAccessLevel) {
  chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).catch(() => { });
}
```

(c) 訊息路由 `chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {` 的第一行加：

```js
  if (message && typeof message.type === 'string' && message.type.startsWith('AI_')) {
    return handleAiMessage(message, sendResponse, BASE_URL);
  }
```

(d) `syncAll` 內，在 `_lastAutoSyncAt = Date.now();` 之後、`console.log(`[Due] 同步完成...`)` 之前加：

```js
    // AI 評分比重分析：排到下一個 tick 跑，不 await、不阻塞 SYNC 回應、不持有 _syncing
    scheduleGradingAnalysis(BASE_URL);
```

- [ ] **Step 4: 修改 `extension/manifest.json`**

`"version": "2.0.1"` → `"version": "2.1.0"`；在 `"host_permissions": [...]` 之後加：

```json
  "optional_host_permissions": [
    "https://*.canvas-user-content.com/*"
  ],
```

`host_permissions`、`permissions`、`content_scripts` 不得變動。

- [ ] **Step 5: 驗證**

```bash
node --check extension/background.js
node --check extension/ai/analysisRunner.js
node -e "JSON.parse(require('fs').readFileSync('extension/manifest.json','utf8')); console.log('manifest ok')"
git diff extension/background.js | grep '^[-+]' | grep -v '^+++\|^---' | wc -l
```
Expected: 前兩個無輸出；`manifest ok`；background.js 的 diff 行數 ≤ 15。另 `git diff extension/manifest.json` 只該看到 version 與 optional_host_permissions。

- [ ] **Step 6: Commit**

```bash
git add extension/ai/analysisRunner.js extension/background.js extension/manifest.json
git commit -m "feat(ai): 背景自動分析編排 analysisRunner.js；background 接線；optional PDF 權限；v2.1.0

- syncAll 後以 setTimeout 排程，不阻塞 SYNC；全域鎖防疊跑
- 每門課成功一次永不重跑；找不到 7 天／錯誤 24 小時冷卻，最多 3 次
- 結果寫入 customWeights，並送 GRADING_WEIGHTS_UPDATED 給 dashboard
- LLM 不加必要 host permission；PDF 下載走 optional_host_permissions

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Dashboard 設定 modal ＋ 四個接點

**Files:**
- Create: `extension/dashboard/aiSettings.js`
- Modify: `extension/dashboard/index.html`（設定選單、CSS、modal markup、script tags）
- Modify: `extension/dashboard/dashboard.js`（`applyUILanguage` 末尾、選單 handler 區、Esc closers、`setupModalA11y` 陣列、`storage.onChanged` 之後）

- [ ] **Step 1: `index.html` — 設定選單加項目**

找到：
```html
                <button class="settings-menu-item" id="menu-claude-usage-toggle">Claude 用量</button>
```
在其**下一行**加：
```html
                <button class="settings-menu-item" id="menu-ai-settings">AI 分析設定</button>
```

- [ ] **Step 2: `index.html` — CSS**

在 `.weight-edit-save:hover { opacity: 0.8; }` 那行之後、`/* ── 無障礙：鍵盤 focus 一致外框` 註解之前，插入：

```css
    /* ── AI 分析設定 modal（spec 2026-09-03；視覺語言與權重編輯器一致）── */
    .ai-settings-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;            /* 低於 .confirm-overlay(3000)：清除紀錄的確認框要疊在上面 */
    }

    .ai-settings-overlay.open { display: flex; }

    .ai-settings-modal {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      width: 460px;
      max-width: 92vw;
      max-height: 84vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.14);
    }

    .ai-settings-header {
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .ai-settings-title {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 18px;
      color: var(--dark);
    }

    .ai-settings-body {
      flex: 1;
      overflow-y: auto;
      padding: 14px 20px 6px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      font-size: 13px;
      color: var(--dark);
    }

    .ai-settings-intro { color: var(--muted); line-height: 1.55; }

    .ai-settings-consent {
      color: var(--muted);
      line-height: 1.55;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
    }

    .ai-settings-label {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-top: 4px;
    }

    .ai-settings-select,
    .ai-settings-input {
      width: 100%;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 300;
      padding: 7px 10px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: var(--bg);
      color: var(--dark);
      outline: none;
      transition: border-color 0.12s;
    }

    .ai-settings-select:focus,
    .ai-settings-input:focus { border-color: var(--orange); }

    .ai-settings-keyrow {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ai-settings-keyrow .ai-settings-input { flex: 1; font-family: 'DM Mono', monospace; }

    .ai-settings-eye {
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted);
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      padding: 6px 10px;
      border-radius: 5px;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color 0.12s, color 0.12s;
    }

    .ai-settings-eye:hover { border-color: var(--orange); color: var(--orange); }

    .ai-settings-hint {
      font-size: 12px;
      color: var(--warm);
      line-height: 1.5;
    }

    .ai-settings-actions-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 2px;
    }

    .ai-settings-link {
      border: none;
      background: none;
      color: var(--muted);
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      cursor: pointer;
      padding: 4px 0;
      text-decoration: underline;
      text-underline-offset: 2px;
      transition: color 0.12s;
      white-space: nowrap;
    }

    .ai-settings-link:hover { color: var(--orange); }

    .ai-settings-link:disabled { color: var(--border); cursor: default; text-decoration: none; }

    .ai-settings-test-result {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: var(--muted);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 260px;
    }

    .ai-settings-test-result.ok { color: var(--green); }
    .ai-settings-test-result.fail { color: var(--overdue); }

    .ai-settings-section {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-top: 10px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .ai-settings-summary {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: var(--muted);
      line-height: 1.6;
    }

    .ai-status-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ai-status-list li {
      display: flex;
      align-items: baseline;
      gap: 10px;
      font-size: 12px;
      line-height: 1.5;
    }

    .ai-status-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--dark);
    }

    .ai-status-state {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      white-space: nowrap;
      color: var(--muted);
    }

    .ai-status-state.done { color: var(--green); }
    .ai-status-state.error { color: var(--overdue); }
    .ai-status-state.notFound { color: var(--warm); }

    .ai-status-error {
      flex-basis: 100%;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      color: var(--muted);
      padding-left: 2px;
    }

    .ai-settings-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }

    .ai-settings-cancel {
      padding: 7px 16px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: transparent;
      color: var(--muted);
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: border-color 0.12s, color 0.12s;
    }

    .ai-settings-cancel:hover { border-color: var(--orange); color: var(--orange); }

    .ai-settings-save {
      padding: 7px 20px;
      border: none;
      border-radius: 6px;
      background: var(--dark);
      color: var(--bg);
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: opacity 0.12s;
    }

    .ai-settings-save:hover { opacity: 0.8; }

```

- [ ] **Step 3: `index.html` — modal markup**

在 `<!-- 自製確認對話框（取代 window.confirm；...） -->` 註解**之前**插入：

```html
  <!-- AI 分析設定 modal（spec 2026-09-03；所有文字由 aiSettings.js 依語言填入）-->
  <div class="ai-settings-overlay" id="ai-settings-overlay">
    <div class="ai-settings-modal" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
      <div class="ai-settings-header">
        <span class="ai-settings-title" id="ai-settings-title"></span>
      </div>
      <div class="ai-settings-body">
        <p class="ai-settings-intro" id="ai-settings-intro"></p>
        <p class="ai-settings-consent" id="ai-settings-consent"></p>

        <label class="ai-settings-label" for="ai-provider" id="ai-provider-label"></label>
        <select class="ai-settings-select" id="ai-provider">
          <option value="gemini">Google Gemini</option>
          <option value="qwen">Qwen (通義千問)</option>
          <option value="deepseek">DeepSeek</option>
        </select>

        <label class="ai-settings-label" for="ai-api-key" id="ai-api-key-label"></label>
        <div class="ai-settings-keyrow">
          <input class="ai-settings-input" id="ai-api-key" type="password" autocomplete="off" spellcheck="false">
          <button type="button" class="ai-settings-eye" id="ai-key-toggle"></button>
        </div>

        <label class="ai-settings-label" for="ai-model" id="ai-model-label"></label>
        <input class="ai-settings-input" id="ai-model" type="text" autocomplete="off" spellcheck="false">

        <div id="ai-base-url-wrap" hidden>
          <label class="ai-settings-label" for="ai-base-url" id="ai-base-url-label"></label>
          <input class="ai-settings-input" id="ai-base-url" type="text" autocomplete="off" spellcheck="false">
        </div>

        <p class="ai-settings-hint" id="ai-text-only-hint" hidden></p>
        <p class="ai-settings-hint" id="ai-pdf-hint" hidden></p>

        <div class="ai-settings-actions-row">
          <button type="button" class="ai-settings-link" id="ai-test-btn"></button>
          <span class="ai-settings-test-result" id="ai-test-result"></span>
          <button type="button" class="ai-settings-link" id="ai-clear-btn"></button>
        </div>

        <div class="ai-settings-section" id="ai-status-heading"></div>
        <div class="ai-settings-summary" id="ai-status-summary"></div>
        <ul class="ai-status-list" id="ai-status-list"></ul>
        <div class="ai-settings-actions-row">
          <button type="button" class="ai-settings-link" id="ai-reset-btn"></button>
        </div>
      </div>
      <div class="ai-settings-footer">
        <button type="button" class="ai-settings-cancel" id="ai-cancel-btn"></button>
        <button type="button" class="ai-settings-save" id="ai-save-btn"></button>
      </div>
    </div>
  </div>

```

- [ ] **Step 4: `index.html` — script tags**

把
```html
  <script src="dashboard.js"></script>
```
改成
```html
  <script src="../ai/gradingRules.js"></script>
  <script src="dashboard.js"></script>
  <script src="aiSettings.js"></script>
```
（`gradingRules.js` 提供供應商預設給 modal；`aiSettings.js` 在 `dashboard.js` 之後載入，因為它在事件中呼叫 `openConfirmDialog`／讀 `_currentData`。）

- [ ] **Step 5: 建立 `extension/dashboard/aiSettings.js`**

```js
// ═══════════════════════════════════════════════════════════════
// Due AI 分析設定 modal（spec 2026-09-03）
// - 自帶三語字串，不塞 dashboard.js 的 I18N；dashboard.js 的 applyUILanguage 末尾呼叫 applyLanguage(lang)
// - 只寫 chrome.storage.local.aiConfig；分析狀態一律透過 AI_* 訊息向 background 取
// - 依賴（執行期才用到）：DueGradingRules（供應商預設）、openConfirmDialog／_currentData（dashboard.js 全域）
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const PDF_ORIGIN = 'https://*.canvas-user-content.com/*';

  const STRINGS = {
    'zh-TW': {
      menuItem: 'AI 分析設定',
      title: 'AI 分析設定',
      intro: '同步後自動從課程大綱抓出評分比重，寫進「手動權重」。每門課成功一次後不再重跑；沒填 API key 就不會啟用。',
      consent: '啟用後，課程大綱與相關 PDF 會直接從你的瀏覽器送到你選的供應商；開發者不會收到任何資料。按「儲存」即表示同意。',
      providerLabel: '供應商',
      apiKeyLabel: 'API key',
      modelLabel: '模型 ID',
      modelPlaceholder: '留空使用預設：{model}',
      baseUrlLabel: 'Base URL（進階）',
      textOnlyHint: '此供應商只能讀 syllabus 文字；大綱若是 PDF，建議改用 Gemini。',
      pdfHint: '尚未授權存取 canvas-user-content.com，只會分析 syllabus 文字。重新按「儲存」可再次授權。',
      testBtn: '測試連線',
      testing: '測試中…',
      testOk: '✓ 連線正常',
      testFail: '失敗：{error}',
      clearBtn: '清除金鑰',
      statusHeading: '分析狀態',
      notConfigured: '尚未設定 API key，分析不會執行。',
      summary: '已分析 {done} · 找不到大綱 {notFound} · 錯誤 {error} · 待分析 {pending}',
      lastRun: '上次分析 {time}',
      running: '分析中…',
      never: '尚未分析',
      noCourses: '尚無課程資料，請先同步。',
      stDone: '已分析',
      stNotFound: '找不到大綱',
      stError: '錯誤',
      stSkipped: '已有權重',
      stPending: '待分析',
      resetBtn: '清除分析紀錄並重新分析',
      resetConfirmTitle: '清除分析紀錄？',
      resetConfirmMsg: '所有課程的分析紀錄會清除；下次同步會為「沒有權重」的課程重新分析。已寫入的手動權重不會改動。',
      resetConfirmOk: '清除',
      cancel: '取消',
      save: '儲存',
      show: '顯示',
      hide: '隱藏',
    },
    'zh-CN': {
      menuItem: 'AI 分析设置',
      title: 'AI 分析设置',
      intro: '同步后自动从课程大纲提取评分比重，写入「手动权重」。每门课成功一次后不再重跑；未填 API key 不会启用。',
      consent: '启用后，课程大纲与相关 PDF 会直接从你的浏览器发送到你选择的供应商；开发者不会收到任何数据。点击「保存」即表示同意。',
      providerLabel: '供应商',
      apiKeyLabel: 'API key',
      modelLabel: '模型 ID',
      modelPlaceholder: '留空使用默认：{model}',
      baseUrlLabel: 'Base URL（高级）',
      textOnlyHint: '此供应商只能读取 syllabus 文本；大纲若为 PDF，建议改用 Gemini。',
      pdfHint: '尚未授权访问 canvas-user-content.com，只会分析 syllabus 文本。重新点击「保存」可再次授权。',
      testBtn: '测试连接',
      testing: '测试中…',
      testOk: '✓ 连接正常',
      testFail: '失败：{error}',
      clearBtn: '清除密钥',
      statusHeading: '分析状态',
      notConfigured: '尚未设置 API key，分析不会执行。',
      summary: '已分析 {done} · 未找到大纲 {notFound} · 错误 {error} · 待分析 {pending}',
      lastRun: '上次分析 {time}',
      running: '分析中…',
      never: '尚未分析',
      noCourses: '暂无课程数据，请先同步。',
      stDone: '已分析',
      stNotFound: '未找到大纲',
      stError: '错误',
      stSkipped: '已有权重',
      stPending: '待分析',
      resetBtn: '清除分析记录并重新分析',
      resetConfirmTitle: '清除分析记录？',
      resetConfirmMsg: '所有课程的分析记录将被清除；下次同步会为「没有权重」的课程重新分析。已写入的手动权重不会改动。',
      resetConfirmOk: '清除',
      cancel: '取消',
      save: '保存',
      show: '显示',
      hide: '隐藏',
    },
    en: {
      menuItem: 'AI analysis settings',
      title: 'AI analysis settings',
      intro: 'After each sync, Due reads the course syllabus and writes the grading weights into "manual weights". Each course is analyzed once; nothing runs until you add an API key.',
      consent: 'When enabled, the syllabus and related PDFs go straight from your browser to the provider you choose. The developer never receives any of it. Saving means you agree.',
      providerLabel: 'Provider',
      apiKeyLabel: 'API key',
      modelLabel: 'Model ID',
      modelPlaceholder: 'Leave blank for default: {model}',
      baseUrlLabel: 'Base URL (advanced)',
      textOnlyHint: 'This provider can only read the syllabus text. If your syllabus is a PDF, use Gemini.',
      pdfHint: 'Access to canvas-user-content.com was not granted, so only the syllabus text is analyzed. Press Save again to re-request.',
      testBtn: 'Test connection',
      testing: 'Testing…',
      testOk: '✓ Connected',
      testFail: 'Failed: {error}',
      clearBtn: 'Remove key',
      statusHeading: 'Analysis status',
      notConfigured: 'No API key set. Analysis will not run.',
      summary: 'Done {done} · No syllabus {notFound} · Error {error} · Pending {pending}',
      lastRun: 'Last run {time}',
      running: 'Analyzing…',
      never: 'Not run yet',
      noCourses: 'No courses yet. Sync first.',
      stDone: 'Done',
      stNotFound: 'No syllabus',
      stError: 'Error',
      stSkipped: 'Has weights',
      stPending: 'Pending',
      resetBtn: 'Clear records and re-analyze',
      resetConfirmTitle: 'Clear analysis records?',
      resetConfirmMsg: 'All analysis records are cleared; the next sync re-analyzes courses that have no weights. Manual weights already written are left untouched.',
      resetConfirmOk: 'Clear',
      cancel: 'Cancel',
      save: 'Save',
      show: 'Show',
      hide: 'Hide',
    },
  };

  const LOCALE = { 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', en: 'en-US' };

  let _lang = 'zh-TW';
  let _keyVisible = false;

  function t(key, vars) {
    const table = STRINGS[_lang] || STRINGS['zh-TW'];
    let s = table[key] || STRINGS['zh-TW'][key] || key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
    return s;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const $ = (id) => document.getElementById(id);

  function sendMsg(msg) {
    return new Promise((resolve) => {
      if (!chrome.runtime?.sendMessage) { resolve(null); return; }
      try {
        chrome.runtime.sendMessage(msg, (res) => {
          void chrome.runtime.lastError; // 沒有接收者時不要噴到 console
          resolve(res || null);
        });
      } catch (_) {
        resolve(null);
      }
    });
  }

  function providers() {
    return (typeof DueGradingRules !== 'undefined' && DueGradingRules.PROVIDERS) || {};
  }

  function readForm() {
    return {
      provider: $('ai-provider').value,
      apiKey: $('ai-api-key').value.trim(),
      model: $('ai-model').value.trim(),
      baseUrl: $('ai-base-url').value.trim(),
      consentedAt: new Date().toISOString(),
    };
  }

  // 切換供應商只更新 placeholder／提示，不清空使用者已輸入的欄位
  function updateProviderUi() {
    const p = providers()[$('ai-provider').value] || providers().gemini || {};
    $('ai-model').placeholder = t('modelPlaceholder', { model: p.defaultModel || '' });
    $('ai-api-key').placeholder = p.keyPlaceholder || '';
    $('ai-base-url').placeholder = p.baseUrl || '';
    $('ai-base-url-wrap').hidden = !!p.supportsPdf;      // Gemini 不需要 base URL
    $('ai-text-only-hint').hidden = !!p.supportsPdf;
  }

  function applyStaticText() {
    const menu = $('menu-ai-settings');
    if (menu) menu.textContent = t('menuItem');
    if (!$('ai-settings-overlay')) return;
    $('ai-settings-title').textContent = t('title');
    $('ai-settings-intro').textContent = t('intro');
    $('ai-settings-consent').textContent = t('consent');
    $('ai-provider-label').textContent = t('providerLabel');
    $('ai-api-key-label').textContent = t('apiKeyLabel');
    $('ai-model-label').textContent = t('modelLabel');
    $('ai-base-url-label').textContent = t('baseUrlLabel');
    $('ai-text-only-hint').textContent = t('textOnlyHint');
    $('ai-pdf-hint').textContent = t('pdfHint');
    $('ai-test-btn').textContent = t('testBtn');
    $('ai-clear-btn').textContent = t('clearBtn');
    $('ai-status-heading').textContent = t('statusHeading');
    $('ai-reset-btn').textContent = t('resetBtn');
    $('ai-cancel-btn').textContent = t('cancel');
    $('ai-save-btn').textContent = t('save');
    $('ai-key-toggle').textContent = _keyVisible ? t('hide') : t('show');
    updateProviderUi();
  }

  function courseName(courseId) {
    const data = (typeof _currentData !== 'undefined' && _currentData) || {};
    const custom = (data.courseNames || {})[courseId];
    if (custom) return custom;
    const c = (data.courses || []).find((x) => String(x.id) === String(courseId));
    return c ? (c.name || c.course_code || String(courseId)) : String(courseId);
  }

  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(LOCALE[_lang] || 'zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function refreshStatus() {
    const st = await sendMsg({ type: 'AI_GET_STATUS' });
    const summary = $('ai-status-summary');
    const list = $('ai-status-list');
    if (!st || st.error) { summary.textContent = ''; list.innerHTML = ''; return; }

    $('ai-pdf-hint').hidden = !(st.configured && !st.pdfPermission);

    if (!st.configured) {
      summary.textContent = t('notConfigured');
      list.innerHTML = '';
      $('ai-reset-btn').disabled = true;
      return;
    }
    $('ai-reset-btn').disabled = false;

    const counts = { done: 0, notFound: 0, error: 0, pending: 0, skipped: 0 };
    for (const c of st.courses) counts[c.status] = (counts[c.status] || 0) + 1;
    const lines = [t('summary', counts)];
    lines.push(st.running ? t('running') : (st.lastRunAt ? t('lastRun', { time: formatTime(st.lastRunAt) }) : t('never')));
    summary.textContent = lines.join('  ·  ');

    if (!st.courses.length) { list.innerHTML = `<li><span class="ai-status-name">${escapeHtml(t('noCourses'))}</span></li>`; return; }
    const label = { done: 'stDone', notFound: 'stNotFound', error: 'stError', skipped: 'stSkipped', pending: 'stPending' };
    list.innerHTML = st.courses.map((c) => `
      <li>
        <span class="ai-status-name" title="${escapeHtml(courseName(c.courseId))}">${escapeHtml(courseName(c.courseId))}</span>
        <span class="ai-status-state ${escapeHtml(c.status)}">${escapeHtml(t(label[c.status] || 'stPending'))}</span>
        ${c.status === 'error' && c.error ? `<span class="ai-status-error">${escapeHtml(c.error)}</span>` : ''}
      </li>`).join('');
  }

  function loadConfigIntoForm() {
    if (!chrome.storage?.local?.get) { updateProviderUi(); return; }
    chrome.storage.local.get(['aiConfig'], (data) => {
      const c = (data && data.aiConfig) || {};
      $('ai-provider').value = providers()[c.provider] ? c.provider : 'gemini';
      $('ai-api-key').value = c.apiKey || '';
      $('ai-model').value = c.model || '';
      $('ai-base-url').value = c.baseUrl || '';
      updateProviderUi();
    });
  }

  function open() {
    const overlay = $('ai-settings-overlay');
    if (!overlay) return;
    _keyVisible = false;
    $('ai-api-key').type = 'password';
    $('ai-test-result').textContent = '';
    $('ai-test-result').className = 'ai-settings-test-result';
    applyStaticText();
    loadConfigIntoForm();
    overlay.classList.add('open');
    refreshStatus();
  }

  function close() {
    const overlay = $('ai-settings-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function applyLanguage(lang) {
    _lang = STRINGS[lang] ? lang : 'zh-TW';
    applyStaticText();
  }

  function bind() {
    const overlay = $('ai-settings-overlay');
    if (!overlay) return;

    $('ai-provider').addEventListener('change', updateProviderUi);

    $('ai-key-toggle').addEventListener('click', () => {
      _keyVisible = !_keyVisible;
      $('ai-api-key').type = _keyVisible ? 'text' : 'password';
      $('ai-key-toggle').textContent = _keyVisible ? t('hide') : t('show');
    });

    $('ai-test-btn').addEventListener('click', async () => {
      const out = $('ai-test-result');
      out.className = 'ai-settings-test-result';
      out.textContent = t('testing');
      const res = await sendMsg({ type: 'AI_TEST_CONNECTION', config: readForm() });
      if (res && res.success) { out.textContent = t('testOk'); out.classList.add('ok'); }
      else { out.textContent = t('testFail', { error: (res && res.error) || 'no response' }); out.classList.add('fail'); }
    });

    $('ai-clear-btn').addEventListener('click', () => {
      $('ai-api-key').value = '';
      $('ai-model').value = '';
      $('ai-base-url').value = '';
      if (chrome.storage?.local?.remove) chrome.storage.local.remove('aiConfig', refreshStatus);
    });

    $('ai-reset-btn').addEventListener('click', () => {
      if (typeof openConfirmDialog !== 'function') return;
      openConfirmDialog({
        title: t('resetConfirmTitle'),
        message: t('resetConfirmMsg'),
        confirmLabel: t('resetConfirmOk'),
        cancelLabel: t('cancel'),
        onConfirm: () => { sendMsg({ type: 'AI_RESET_ANALYSIS' }).then(refreshStatus); },
      });
    });

    $('ai-save-btn').addEventListener('click', () => {
      // 權限請求必須在 user gesture 內、且在任何 await 之前呼叫，Chrome 才會顯示對話框；已授權時直接回 true
      const perm = chrome.permissions?.request
        ? chrome.permissions.request({ origins: [PDF_ORIGIN] }).catch(() => false)
        : Promise.resolve(false);
      const config = readForm();
      perm
        .then(() => (chrome.storage?.local?.set ? chrome.storage.local.set({ aiConfig: config }) : null))
        .then(() => sendMsg({ type: 'AI_RUN_NOW' }))
        .finally(close);
    });

    $('ai-cancel-btn').addEventListener('click', close);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  bind();
  applyStaticText();

  window.DueAiSettings = { open, close, applyLanguage, refreshStatus };
})();
```

- [ ] **Step 6: `dashboard.js` — 四個接點**

(a) `applyUILanguage()` 函式最末（`bindLanguageMenuActions();` 所在的 `if` 區塊結束之後、函式的 `}` 之前）加一行：

```js
  if (typeof DueAiSettings !== 'undefined') DueAiSettings.applyLanguage(_uiLanguage);
```

(b) 在 `if (menuOpenTutorial) { ... }` 區塊之後加：

```js
const menuAiSettings = document.getElementById('menu-ai-settings');
if (menuAiSettings) {
  menuAiSettings.addEventListener('click', () => {
    if (typeof DueAiSettings !== 'undefined') DueAiSettings.open();
    if (settingsMenu) settingsMenu.classList.remove('open');
    if (settingsMenuBtn) settingsMenuBtn.classList.remove('open');
    const menuLanguageLabel = document.getElementById('menu-language-label');
    if (menuLanguageLabel) menuLanguageLabel.classList.remove('submenu-open');
  });
}
```

(c) Esc closers：把
```js
  const closers = [
    ['confirm-overlay', closeConfirmDialog],
    ['custom-assignment-overlay', closeCustomAssignmentModal],
```
改成
```js
  const closers = [
    ['confirm-overlay', closeConfirmDialog],
    ['ai-settings-overlay', () => { if (typeof DueAiSettings !== 'undefined') DueAiSettings.close(); }],
    ['custom-assignment-overlay', closeCustomAssignmentModal],
```

(d) a11y：把
```js
['custom-assignment-overlay', 'weight-edit-overlay', 'welcome-overlay', 'confirm-overlay']
  .forEach((id) => setupModalA11y(document.getElementById(id)));
```
改成
```js
['custom-assignment-overlay', 'weight-edit-overlay', 'welcome-overlay', 'confirm-overlay', 'ai-settings-overlay']
  .forEach((id) => setupModalA11y(document.getElementById(id)));
```

(e) 在「唯一的 storage 監聽」那個 `if (chrome.storage?.onChanged?.addListener) { ... }` 區塊**之後**加：

```js
// AI 評分比重分析寫入 customWeights 後由 background 送來（spec 2026-09-03 §10）：
// 只更新記憶體快取；正開著該課詳情且沒有拖曳／完成動畫進行中才重繪。不新增 storage.onChanged（見開發注意事項 9）
if (chrome.runtime?.onMessage?.addListener) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== 'GRADING_WEIGHTS_UPDATED' || !_currentData) return;
    if (!_currentData.customWeights) _currentData.customWeights = {};
    _currentData.customWeights[msg.courseId] = msg.weights;
    const idle = !_dragCtx && Object.keys(_completeTimers).length === 0;
    if (idle && currentView === 'course' && currentCourseId === msg.courseId) rerenderDetailAndNav(msg.courseId);
    const overlay = document.getElementById('ai-settings-overlay');
    if (overlay && overlay.classList.contains('open') && typeof DueAiSettings !== 'undefined') DueAiSettings.refreshStatus();
  });
}
```

- [ ] **Step 7: 驗證**

```bash
node --check extension/dashboard/dashboard.js
node --check extension/dashboard/aiSettings.js
git diff --stat extension/dashboard/dashboard.js
git diff extension/dashboard/dashboard.js | grep -c '^[-+]  *\(renderWeightPie\|openWeightEditModal\|renderCourseDetailSection\|loadData\)\b'
node -e "
const s=require('fs').readFileSync('extension/dashboard/aiSettings.js','utf8');
const m=s.match(/const STRINGS = \{([\s\S]*?)\n  \};/);
const keys=(b)=>[...b.matchAll(/^\s{6}(\w+):/gm)].map(x=>x[1]).sort().join(',');
const blocks=[...m[1].matchAll(/'?(zh-TW|zh-CN|en)'?: \{([\s\S]*?)\n    \}/g)];
const sets=blocks.map(b=>keys(b[2]));
console.log(sets.every(x=>x===sets[0])?'i18n keys parity OK ('+blocks.length+' langs)':'i18n MISMATCH');
"
```
Expected：兩個 `node --check` 無輸出；dashboard.js diff 約 +30 行；第四個指令輸出 `0`（未碰四個受保護函式）；最後輸出 `i18n keys parity OK (3 langs)`。

- [ ] **Step 8: 人工煙霧測試（Chrome）**

1. `chrome://extensions` → 重新載入 Due → 無錯誤（Service worker 的 console 也看一下）。
2. 開 Dashboard → 設定齒輪 → 出現「AI 分析設定」→ 點開 modal：文字齊、切換三種語言 modal 與選單文字跟著變、Esc 可關、點背景可關、Tab 焦點在 modal 內循環。
3. 不填 key 直接看：狀態區顯示「尚未設定 API key」；其他頁面與 2.0.1 完全一樣。
4. 填一個 Gemini key → 測試連線 → ✓ →「儲存」→ Chrome 跳 canvas-user-content.com 權限對話框 → 允許 → modal 關閉。再開 modal → 狀態區各課顯示「待分析」或「已有權重」。
5. 按側欄「同步」→ 同步按鈕轉圈時間與以前一樣（不會等 AI）→ 幾十秒後再開 modal → 有大綱的課變「已分析」，該課圓餅圖出現權重、編輯器可改、有「還原 Canvas 權重」。
6. 再按同步 → 狀態不變（供應商後台用量不增加）。

- [ ] **Step 9: Commit**

```bash
git add extension/dashboard/aiSettings.js extension/dashboard/index.html extension/dashboard/dashboard.js
git commit -m "feat(dashboard): AI 分析設定 modal 與 GRADING_WEIGHTS_UPDATED 刷新接點

- 設定選單新增「AI 分析設定」，modal 自帶三語字串（不動 dashboard.js I18N）
- 儲存時於 user gesture 內請求 canvas-user-content.com optional 權限
- 分析狀態／測試連線／清除金鑰／清除紀錄重新分析皆走 AI_* 訊息
- dashboard.js 只加四個接點；renderWeightPie 等顯示邏輯零改動

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: 文件更新

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `README.zh-TW.md`
- Modify: `privacy-policy.md`

- [ ] **Step 1: `CLAUDE.md`**

(a) 「專案結構」樹：在 `├── background.js` 那行後加 `ai/` 目錄；在 `dashboard/` 下加 `aiSettings.js`。把該區塊改成：

```
cc/
├── CLAUDE.md
└── extension/
    ├── manifest.json              ← 擴充功能設定（Manifest V3；LLM 不佔必要權限，PDF 下載走 optional_host_permissions）
    ├── background.js              ← Service worker：Canvas API 同步 + Claude 用量；importScripts 載入 ai/ 三檔
    ├── ai/
    │   ├── gradingRules.js        ← AI 評分比重分析純規則：設定解析、只跑一次規則、重試狀態機、回應解析、權重正規化（含測試）
    │   ├── providers.js           ← LLM 供應商請求層：Gemini 原生／OpenAI 相容（含測試）
    │   └── analysisRunner.js      ← service worker 側編排：同步後排程、Canvas 材料蒐集、PDF 下載、呼叫供應商、寫 customWeights、AI_* 訊息
    ├── popup.html                 ← 點擊擴充功能圖示的小視窗
    ├── popup.js                   ← popup 的邏輯
    └── dashboard/
        ├── index.html             ← Dashboard 頁面（CSS + HTML 骨架）
        ├── dashboard.js           ← 所有 Dashboard 渲染邏輯和事件綁定
        ├── aiSettings.js          ← AI 分析設定 modal（自帶三語字串；只寫 aiConfig）
        ├── taskRules.js           ← 共用規則：考試/簽到判定、緊急度色階、逾期窗（含測試，popup 共用）
        ├── completion.js          ← 完成標記單一真相來源：isDone / toggleManualDone（含測試）
        ├── customAssignments.js   ← 自訂作業建立與合併（含測試）
        └── descSanitizer.js       ← 作業描述 HTML 白名單 sanitize（含測試）
```

(b) 「技術規格 → Chrome 擴充功能」的 Host Permissions 那行後加一行：
```
- **Optional Host Permissions**：`https://*.canvas-user-content.com/*`（僅 AI 分析下載 Canvas PDF 用，儲存 AI 設定時請求；LLM 端點靠供應商 CORS，不佔必要權限）
```

(c) 「資料儲存」JSON 範例在 `"claudeUsage": {...}` 之後加兩個 key：
```json
  "aiConfig": { "provider": "gemini", "apiKey": "…", "model": "", "baseUrl": "", "consentedAt": "…" },
  "gradingAnalysis": { "courseId": { "status": "done", "attempts": 1, "at": "…", "nextRetryAt": null, "source": "syllabus_pdf", "provider": "gemini", "model": "gemini-2.5-flash", "components": [] } }
```

(d) 「已實作功能 → background.js」：把
```
> 註：逐作業 AI 分析與 syllabus 評分比重 AI 分析已於 2026-07 移除（見 `docs/superpowers/specs/2026-07-21-remove-ai-analysis-design.md`）。
```
改成下面整段：

```
- `importScripts('ai/gradingRules.js', 'ai/providers.js', 'ai/analysisRunner.js')`：AI 評分比重分析（見下節）；`syncAll` 成功寫入 storage 後呼叫 `scheduleGradingAnalysis(BASE_URL)`（`setTimeout` 排程，不 await、不阻塞 SYNC 回應、不持有 `_syncing`）；`AI_*` 訊息轉交 `handleAiMessage`
- 啟動時 `chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })`：API key 只讓擴充功能自身頁面讀得到

### AI 評分比重分析（`extension/ai/`，spec `docs/superpowers/specs/2026-09-03-ai-grading-weights-restore-design.md`）

- **定位**：AI 只負責「產生課程權重」並寫進現有 `customWeights[courseId]`；圓餅圖／權重編輯器／「還原 Canvas 權重」原樣呈現，**前端顯示邏輯零改動**。沒填 API key 時整個功能沉默，行為與未加此功能完全相同
- **觸發**：每次同步完成後自動、序列、每輪最多 10 門；全域鎖 `_aiAnalyzing` 防疊跑
- **只跑一次**（`DueGradingRules.shouldAnalyze`）：有手動權重／Canvas `group_weight`／已 `done` → 跳過；`notFound` 7 天冷卻、`error` 24 小時冷卻、最多 3 次。成功後即使按「還原 Canvas 權重」也不重跑；要重跑用 modal 的「清除分析紀錄並重新分析」
- **材料**（`analyzeCourse`）：API `syllabus_body` 文字（`stripHtml`）→ syllabus 內連結 PDF → 課程 PDF 檔案（強關鍵字 → AI 挑檔）；PDF 只在有 optional 權限且供應商支援 PDF（Gemini）時下載；`parts` 為空不呼叫 LLM。Content-Type／`%PDF-` 檢查，單檔 10MB、累計 15MB
- **供應商**（`DueAiProviders`）：Gemini 原生（key 走 `x-goog-api-key` header）；Qwen／DeepSeek 走 OpenAI 相容 `/chat/completions`（純文字，可自訂 base URL）。只送供應商需要的 header
- **回應**：`parseAnalysisResponse` → `normalizeWeights`（小數比例 ×100、同名合併、總和須在 [80,120]）→ `toCustomWeights`。寫入前重新讀 storage；若使用者已手動填權重則不覆蓋。寫入後送 `GRADING_WEIGHTS_UPDATED` 給 dashboard
- **設定 modal**（`dashboard/aiSettings.js`，設定選單「AI 分析設定」）：供應商／key／模型／base URL、測試連線、清除金鑰、分析狀態列、清除紀錄。「儲存」在 user gesture 內先 `chrome.permissions.request` PDF 權限再寫 `aiConfig`。字串自帶三語，`applyUILanguage` 末尾呼叫 `DueAiSettings.applyLanguage`
- **訊息**：`AI_GET_STATUS`／`AI_TEST_CONNECTION`／`AI_RUN_NOW`／`AI_RESET_ANALYSIS`（dashboard → bg）、`GRADING_WEIGHTS_UPDATED`（bg → dashboard）
- 逐作業 AI 分析（A）仍為移除狀態，不在此功能範圍

> 註：舊版（1.5.0）的 `aiProvider`／`aiApiKey`／`syllabusAnalysis` 等 key 不復用、不讀取；殘留無害。
```

(e) 「資料儲存」段落末的括號註記：把
```
（AI 相關 key：`analysis`、`syllabusAnalysis`、`milestoneChecks`、`aiModel`、`geminiApiKey`、`geminiModel`、`claudeApiKey` 已隨 AI 分析移除；舊資料殘留無害，不主動清除。）
```
改成
```
（1.5.0 時代的 AI key：`analysis`、`syllabusAnalysis`、`milestoneChecks`、`aiModel`、`aiProvider`、`aiApiKey`、`geminiApiKey`、`geminiModel`、`claudeApiKey` 已不再讀寫；2.1.0 起改用 `aiConfig`／`gradingAnalysis`。舊資料殘留無害，不主動清除。）
```

(f) 「開發注意事項」末尾加第 10 條：
```
10. AI 分析結果寫入 `customWeights` 後由 background 送 `GRADING_WEIGHTS_UPDATED` 訊息刷新 `_currentData`，**不**走 `storage.onChanged`（第 9 條的限制不變）；監聽器只在「正開著該課詳情且無拖曳／完成動畫」時重繪。AI 邏輯一律放 `extension/ai/`，`dashboard.js` 只保留五個接點（選單 click、`applyUILanguage` 一行、Esc closers、a11y 陣列、訊息監聽）
```

- [ ] **Step 2: `AGENTS.md`**

「結構」那行的 `dashboard/`（...）括號內加 `taskRules.js`＋`aiSettings.js`，並加 `ai/`：
```
- **結構**：`extension/` 下有 `manifest.json`、`background.js`（Service Worker：Canvas 同步 + Claude 用量 + AI 評分比重分析排程）、`ai/`（`gradingRules.js`＋`providers.js`＋`analysisRunner.js`）、`popup.*`，以及 `dashboard/`（`index.html`＋`dashboard.js`＋`aiSettings.js`＋`taskRules.js`＋`completion.js`＋`customAssignments.js`＋`descSanitizer.js`）。
```
最後一行改成：
```
> 註：逐作業 AI 分析已於 2026-07 移除；syllabus 評分比重 AI 分析於 2026-09 以新架構加回（自動、只跑一次、寫入 `customWeights`；見 `docs/superpowers/specs/2026-09-03-ai-grading-weights-restore-design.md`），請勿依 1.5.0 的舊描述開發。
```

- [ ] **Step 3: `README.md`**

(a) 首段
```
assignment, deadline, and grade weight in one calm, prioritized dashboard —
no API tokens, no account setup, no server.
```
改成
```
assignment, deadline, and grade weight in one calm, prioritized dashboard —
no Canvas API tokens, no account setup, no server. An optional AI feature can
read your syllabus for grading weights; bring your own LLM key if you want it.
```

(b) 「Works with any Canvas school」段落後加一句（同段內）：
```
The only key Due ever asks for is optional: your own Gemini / Qwen / DeepSeek
API key, if you turn on AI grading-weight analysis (see below).
```

(c) 「Install」之後、「Privacy」之前新增小節：
```
## Optional: AI grading-weight analysis

Some courses never publish weights in Canvas. Turn this on and Due reads the
course syllabus (text and PDF) after each sync, extracts the grading breakdown,
and writes it into the course's **manual weights** — the same place you'd type
them yourself, so you can still edit or reset them.

- Settings gear → **AI analysis settings** → choose Gemini, Qwen, or DeepSeek,
  paste your own API key, save.
- Each course is analyzed **once**. Courses that already have Canvas or manual
  weights are skipped. Nothing runs until you add a key.
- Chrome asks once for access to `canvas-user-content.com` so Due can download
  syllabus PDFs; decline and it still works with the syllabus text.
- Syllabus content goes straight from your browser to the provider you chose.
  Due has no server in between.
```

(d) 「Privacy」段：
```
Everything stays on your device. Due has **no backend server, no analytics, and
no telemetry** — all data lives in `chrome.storage.local` and is never sent to
the developer. Read the full [privacy policy](privacy-policy.md).
```
改成
```
Everything stays on your device. Due has **no backend server, no analytics, and
no telemetry** — all data lives in `chrome.storage.local` and is never sent to
the developer. If you enable the optional AI analysis, your syllabus is sent
directly to the AI provider you picked, with your own key; the developer never
sees it. Read the full [privacy policy](privacy-policy.md).
```

(e) 「For developers」的 tree 註解行 `└── *.js           # taskRules · completion · customAssignments · descSanitizer` 之後（若存在同格式的 tree）加一行 `ai/*.js` 的說明；若 tree 格式不同，在 Tests 那個 bullet 後補：
```
- **AI module tests:** `node extension/ai/gradingRules.test.js` and `node extension/ai/providers.test.js`.
```

(f) 頁尾 `Version 2.0.0` → `Version 2.1.0`。

- [ ] **Step 4: `README.zh-TW.md`**

(a) 首段
```
評分比重整理進一個乾淨、依緊急度排序的 Dashboard——不需要 API token、不用
註冊帳號、沒有伺服器。
```
改成
```
評分比重整理進一個乾淨、依緊急度排序的 Dashboard——不需要 Canvas API token、
不用註冊帳號、沒有伺服器。另有選用的 AI 功能可從課程大綱抓出評分比重，想用
的話自備 LLM API key 即可。
```

(b) 「適用任何 Canvas 學校」段後加：
```
Due 唯一會問你要的 key 是選用的：開啟 AI 評分比重分析時，你自己的 Gemini／
Qwen／DeepSeek API key（見下方）。
```

(c) 「安裝」之後、「隱私」之前新增：
```
## 選用：AI 評分比重分析

有些課程從不在 Canvas 上填權重。開啟這個功能後，Due 會在每次同步後讀課程大綱
（文字與 PDF），抓出評分比重，寫進該課的**手動權重**——和你自己手動輸入是
同一個地方，所以隨時可以改、可以還原。

- 設定齒輪 →「**AI 分析設定**」→ 選 Gemini／Qwen／DeepSeek，貼上你自己的
  API key，儲存。
- 每門課只分析**一次**；已有 Canvas 或手動權重的課會跳過。沒填 key 什麼都不會跑。
- Chrome 會問一次是否允許存取 `canvas-user-content.com`，用來下載大綱 PDF；
  拒絕也能用，只是只讀大綱文字。
- 大綱內容直接從你的瀏覽器送到你選的供應商，中間沒有 Due 的伺服器。
```

(d) 「隱私」段：
```
所有資料都留在你的裝置上。Due **沒有後端伺服器、沒有分析追蹤、也沒有任何
遙測**——資料全存在 `chrome.storage.local`，絕不會傳送給開發者。完整說明見
[隱私政策](privacy-policy.md)。
```
改成
```
所有資料都留在你的裝置上。Due **沒有後端伺服器、沒有分析追蹤、也沒有任何
遙測**——資料全存在 `chrome.storage.local`，絕不會傳送給開發者。若你開啟選用
的 AI 分析，課程大綱會用你自己的 key 直接送到你選的供應商，開發者不經手。
完整說明見[隱私政策](privacy-policy.md)。
```

(e) 「給開發者」的測試 bullet 後補：
```
- **AI 模組測試：** `node extension/ai/gradingRules.test.js`、`node extension/ai/providers.test.js`。
```

(f) 頁尾 `版本 2.0.0` → `版本 2.1.0`。

- [ ] **Step 5: `privacy-policy.md`**

整份改寫為（保留原本標題結構）：

```markdown
# Privacy Policy — Due Extension

**Last updated: September 3, 2026**

## Overview

Due ("the Extension") is a Chrome extension that connects to Canvas LMS to help students track assignments, deadlines, and grading weights. This policy explains what data the Extension accesses, how it is used, and what is shared with third parties.

---

## Data We Access

### Canvas LMS Data
When you visit your school's Canvas site, the Extension reads the following data from the Canvas API using your existing browser session (cookies):

- Course list and names
- Assignments, due dates, descriptions, and submission status
- Assignment groups and their grading weights
- Only if you enable the optional AI analysis: the course syllabus text and, if you grant access to `canvas-user-content.com`, PDF files linked from the syllabus or stored in the course's Files area

**This data is stored locally on your device** using `chrome.storage.local` and is never transmitted to the extension developer or any server controlled by the developer.

### Claude usage (optional popup chip)
If you are logged in to claude.ai, the Extension can read your own usage percentage from claude.ai's usage endpoint and show it in the popup. This is read-only, stays on your device, and can be hidden from the settings menu.

### AI API Key (optional)
You may optionally provide an API key for one of these third-party AI services: Google Gemini, Alibaba Qwen (DashScope), or DeepSeek. This key is:

- Stored locally on your device (`chrome.storage.local`, readable only by the Extension's own pages)
- Never transmitted to the extension developer
- Used exclusively to authenticate requests to the AI service you have chosen
- Removable at any time via "Remove key" in the AI analysis settings

---

## Third-Party Data Sharing

The AI grading-weight analysis is **off by default** and only runs after you enter an API key and press Save. When it runs, the Extension sends the following data **directly from your browser to the AI service you selected**:

- The course syllabus text from Canvas
- Syllabus-related PDF files from the course (only if you granted access to `canvas-user-content.com` and the provider supports PDF input)
- A list of the course's PDF file names, when the Extension needs help choosing which file is the syllabus

Each course is analyzed once; the result (grading components and weights) is stored locally as that course's manual weights.

**The extension developer does not receive, process, store, or have access to this data.** The transmission happens entirely between your browser and the AI provider you configured, under that provider's terms.

You are responsible for reviewing the privacy policy of your chosen AI provider:
- Google Gemini: https://policies.google.com/privacy
- Alibaba Cloud (Qwen / DashScope): https://www.alibabacloud.com/help/en/legal/latest/alibaba-cloud-international-website-privacy-policy
- DeepSeek: https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html

---

## Permissions

- `https://*.instructure.com/*` — read your Canvas data with your existing login
- `https://claude.ai/*` — read your own Claude usage for the optional popup chip
- Optional, requested only when you save AI analysis settings: `https://*.canvas-user-content.com/*` — download syllabus PDFs from Canvas's file host. You can decline; the analysis then uses syllabus text only.

Calls to the AI providers use their public HTTPS APIs and do not require additional permissions.

---

## Data We Do NOT Collect

The extension developer collects **no data whatsoever**. The Extension has no backend server, no analytics, no telemetry, and no remote logging. All data stays on your device or goes directly to Canvas, claude.ai, or your chosen AI service.

---

## Data Retention & Deletion

All data stored by the Extension can be cleared at any time by:
- Removing the Extension from Chrome
- Using Chrome's "Clear extension storage" option in `chrome://extensions`
- Removing the AI key and analysis records from the AI analysis settings dialog

---

## Changes to This Policy

If this policy is updated, the new version will be published at this URL with an updated "Last updated" date.

---

## Contact

If you have any questions about this privacy policy, please open an issue at: https://github.com/Raytengo/Due
```

- [ ] **Step 6: 驗證**

```bash
grep -n "2\.1\.0" README.md README.zh-TW.md extension/manifest.json
grep -n -i "moonshot\|zhipu\|minimax\|anthropic claude\|openai" privacy-policy.md
grep -n "已於 2026-07 移除" CLAUDE.md AGENTS.md
```
Expected：第一個各檔至少一筆；第二、三個**無輸出**。

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md AGENTS.md README.md README.zh-TW.md privacy-policy.md
git commit -m "docs: AI 評分比重分析回歸——CLAUDE.md/AGENTS.md 架構與 schema、README 選用功能說明、privacy policy 改為現況

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: 整體驗證與隔離檢查

**Files:** 無新增；只跑檢查。

- [ ] **Step 1: 語法與測試全跑**

```bash
for f in extension/background.js extension/ai/gradingRules.js extension/ai/providers.js extension/ai/analysisRunner.js extension/dashboard/dashboard.js extension/dashboard/aiSettings.js extension/popup.js; do node --check "$f" || echo "SYNTAX FAIL $f"; done
for t in extension/dashboard/*.test.js extension/ai/*.test.js; do node "$t" > /dev/null 2>&1 && echo "PASS $t" || echo "FAIL $t"; done
```
Expected：無 `SYNTAX FAIL`；六個測試檔全 `PASS`。

- [ ] **Step 2: 隔離 grep（相對 master）**

```bash
git diff master --stat
git diff master -- extension/dashboard/taskRules.js extension/dashboard/completion.js extension/dashboard/customAssignments.js extension/dashboard/descSanitizer.js extension/popup.js extension/popup.html extension/claude_content.js extension/claude_injected.js | wc -l
git diff master -- extension/manifest.json
grep -rn "aiProvider\|aiApiKey\|syllabusAnalysis\|geminiApiKey" extension/ | wc -l
git diff master -- extension/dashboard/dashboard.js | grep -c "^[-+].*\(I18N\|renderWeightPie(\|function openWeightEditModal\|function renderCourseDetailSection\|function loadData\)"
```
Expected：第二個輸出 `0`；manifest diff 只有 `version` 與 `optional_host_permissions`；第四個 `0`；第五個 `0`。

- [ ] **Step 3: 人工驗收清單（交回使用者，寫進最終回報）**

依 spec §13.3 六點：無 key 等於現況；填 key → 測試連線 → 儲存 → 權限對話框；同步不變慢、稍後圓餅出現；再同步不重跑；還原不重跑、清除紀錄會重跑；清除金鑰後沉默。另附 spec §14 的 Web Store 後台待辦。

- [ ] **Step 4: 收尾**

不合併、不推送；回報 branch 名、commit 清單、測試輸出摘要、人工驗收清單與 Web Store 待辦。

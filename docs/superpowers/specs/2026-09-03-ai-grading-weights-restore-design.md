# 加回 AI 評分比重分析（自動、只跑一次、不動前端）— 設計文件

- **日期**：2026-09-03
- **狀態**：範圍與細節已與使用者確認，待實作
- **前身**：`docs/superpowers/specs/2026-07-21-remove-ai-analysis-design.md`（當時砍掉 A 逐作業分析＋B syllabus 評分比重分析，保留 C Claude 用量 chip）
- **本次**：只加回 **B**，且以「AI 只負責產生課程權重，寫進現有手動權重；前端顯示邏輯零改動」為原則重做，不是把舊碼貼回來

---

## 0. 決策摘要（已確認）

| 項目 | 決定 |
|------|------|
| 範圍 | 只做 B（課程評分比重）。A（逐作業分析）不做 |
| 觸發 | 每次同步完成後**自動**在背景跑，**不阻塞**同步；每門課成功一次後**永不再跑** |
| 資料來源 | 與舊版相同：Canvas syllabus 文字、syllabus 內連結的 PDF、課程檔案（關鍵字比對 → AI 挑檔） |
| 供應商 | Gemini（原生 API，支援 PDF）、Qwen、DeepSeek、NVIDIA NIM（OpenAI 相容，可自訂 base URL，純文字）。NVIDIA 端點不回 CORS header，需要 optional host permission（見 §8.1） |
| 結果去向 | 直接寫入 `customWeights[courseId]`（現有「手動權重」），由現有圓餅圖／權重編輯器／「還原 Canvas 權重」原樣呈現與操作 |
| 前端 | 不新增任何顯示邏輯。僅新增：設定選單一個項目＋一個設定 modal；以及一段「資料刷新」訊息監聽（無 UI） |
| 設定位置 | dashboard 內 modal（設定選單 →「AI 分析設定」），不做獨立 `settings.html` |
| 權限策略 | LLM 呼叫**不加任何必要 host permission**（靠供應商的 CORS）；PDF 下載所需的 `https://*.canvas-user-content.com/*` 與 NVIDIA 端點 `https://integrate.api.nvidia.com/*` 放 `optional_host_permissions`，儲存設定時一次請求該供應商用得到的那幾個 |
| 儲存 key | 全新：`aiConfig`、`gradingAnalysis`。不沿用 1.5.0 的 `aiProvider`/`aiApiKey`/`syllabusAnalysis` 等舊 key（殘留不讀不清） |
| 文件 | README（EN／繁中）、privacy-policy.md、CLAUDE.md、AGENTS.md 同步更新 |
| 版本 | manifest `2.1.0` |
| 實作方式 | subagent（Opus 5）依本 spec 實作；純邏輯進 UMD 模組並附 node 測試 |

---

## 1. 範圍

### 做（IN）
1. 背景自動分析管線（service worker 側），含「只跑一次」與重試規則
2. 供應商呼叫層（Gemini 原生／OpenAI 相容）
3. 純邏輯模組 `gradingRules.js`、`providers.js` ＋ 測試
4. Dashboard 設定 modal（供應商、key、模型、base URL、測試連線、清除、分析狀態、重新分析）
5. Dashboard 接收 `GRADING_WEIGHTS_UPDATED` 訊息刷新 `_currentData.customWeights`
6. manifest：`optional_host_permissions`、版本號
7. 文件更新

### 不做（OUT）
- 任何圓餅圖／圖例／編輯器／作業列的顯示改動；不標示「AI 來源」
- 逐作業分析、里程碑、分析面板
- 手動「分析這門課」按鈕（modal 內只有全域「清除紀錄並重新分析」）
- 成績計算器接 AI 權重（維持只吃 Canvas `group_weight`）
- 新手教學改動（5 頁不動）
- popup 改動
- API key 加密（見 §8.3 的替代作法）

---

## 2. 使用者體驗

- **沒填 API key**：擴充功能行為與 2.0.1 **完全相同**，不多發任何請求。唯一差異是設定選單多一項「AI 分析設定」。
- **填了 key 並儲存**：Chrome 跳一次「允許存取 canvas-user-content.com」（用於下載 PDF；拒絕也能用，只是只讀 syllabus 文字）。之後每次同步結束，背景為「還沒有權重」的課跑一次分析，成功就把權重寫進手動權重，圓餅圖自然出現。
- **看得到的狀態**：只在 modal 內。每門課一行：已分析／找不到大綱／錯誤／待分析，加上次執行時間。
- **AI 抓錯**：使用者用現有權重編輯器改，或按「還原 Canvas 權重」。還原後**不會**再自動跑（成功紀錄仍在）；要重跑得到 modal 按「清除分析紀錄」。

---

## 3. 架構與檔案

```
extension/
├── manifest.json                  ← + optional_host_permissions、version 2.1.0
├── background.js                  ← + importScripts 三個 ai/ 檔；syncAll 尾端排程一次分析；訊息路由轉交 AI_* 訊息（合計 <15 行改動）
├── ai/                            ← 全新目錄，所有 AI 邏輯都在這
│   ├── gradingRules.js            ← UMD 純函式：設定解析、shouldAnalyze、重試狀態機、關鍵字比對、HTML 去標籤、回應解析與權重驗證、prompt 文字（含測試）
│   ├── gradingRules.test.js
│   ├── providers.js               ← UMD 純函式：組 request（url/headers/body）、解析回應文字（含測試）
│   ├── providers.test.js
│   └── analysisRunner.js          ← service worker 側編排：讀寫 storage、Canvas fetch、PDF 下載、呼叫供應商、鎖與排程、AI_* 訊息處理（用 chrome.*，不做單元測試）
└── dashboard/
    ├── index.html                 ← + 設定選單項目、AI 設定 modal 的 markup 與 CSS、<script src="aiSettings.js">
    ├── aiSettings.js              ← 全新：modal 的所有邏輯與三語言字串（自帶 STRINGS，不塞 dashboard.js 的 I18N）
    └── dashboard.js               ← 4 個接點：選單項目 click（複製既有 close-menu 樣板）；applyUILanguage 末尾呼叫 DueAiSettings.applyLanguage；Esc closers 與 setupModalA11y 各加一個 id；GRADING_WEIGHTS_UPDATED 監聽（~15 行）
```

**隔離原則**：
- `dashboard.js` 不新增任何 I18N key；不改 `renderWeightPie`／`openWeightEditModal`／`renderCourseDetailSection`／`loadData`。
- `background.js` 不新增 Canvas 資料抓取（`syncAll` 的 fetch 路徑原樣）；不在 `syncAll` 內 `await` 分析。
- `taskRules.js`、`completion.js`、`customAssignments.js`、`descSanitizer.js`、`popup.*`、`claude_*.js` 不動。
- 所有 `chrome.*` 呼叫在 dashboard 側用可選鏈守衛（`chrome.permissions?.request`），與現有程式一致。

UMD 包裝沿用 `taskRules.js` 樣式：Node 下 `module.exports`，瀏覽器／service worker 下掛 `globalThis.DueGradingRules`、`globalThis.DueAiProviders`。service worker 用 `importScripts('ai/gradingRules.js', 'ai/providers.js', 'ai/analysisRunner.js')`（manifest 的 background 非 module 型，可用；放在 `background.js` 最上方）。

`analysisRunner.js` 與 `background.js` 同屬 worker 全域：runner 可直接呼叫 `background.js` 既有的 `fetchJSON(url)` 與 `fetchAllPages(url)`（不重複實作），但 **`BASE_URL` 由呼叫端傳入**（`scheduleGradingAnalysis(BASE_URL)`、AI_* 訊息處理時由 `background.js` 帶入），runner 不直接讀 `background.js` 的 `let BASE_URL`。

---

## 4. 資料模型

### 4.1 `chrome.storage.local.aiConfig`
```js
{
  provider: 'gemini' | 'qwen' | 'deepseek',
  apiKey: string,          // 明文（見 §8.3）
  model: string,           // 空字串時用該供應商預設
  baseUrl: string,         // 空字串時用該供應商預設；只有 OpenAI 相容路徑會用到
  consentedAt: string,     // ISO；按「儲存」即視為同意送出課程資料
}
```
`resolveConfig(stored)` → `{ provider, apiKey, model, baseUrl, configured: boolean }`；`configured = apiKey.trim() !== ''`。非 gemini 的 `baseUrl` 只接受 `https://` 開頭，否則退回該供應商預設（避免 bearer token 走明文）。`provider === 'gemini'` 時 `resolveConfig` **忽略**儲存的 `baseUrl`，一律用 Google 預設（避免切換供應商後殘留的其他家 URL 把 Gemini key 送錯地方）。供應商預設：

| provider | baseUrl 預設 | model 預設 | 支援 PDF |
|---|---|---|---|
| gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-2.5-flash` | 是 |
| qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | 否 |
| deepseek | `https://api.deepseek.com/v1` | `deepseek-chat` | 否 |
| nvidia | `https://integrate.api.nvidia.com/v1` | `deepseek-ai/deepseek-v4-flash-0731` | 否 |

未知 provider 一律視為 `gemini`。`nvidia` 與其他非 gemini 供應商一樣吃「自訂 `baseUrl` 只收 `https://`，否則退回預設」的規則。

`PROVIDERS` 另有選填欄位 `hostPermission`：該供應商端點不回 CORS header、必須靠 Chrome host permission 才呼叫得動時才有值（目前只有 `nvidia`：`https://integrate.api.nvidia.com/*`）。兩個純函式對外：
- `providerHostPermission(provider)` → 該供應商的 host permission 字串，或 `null`（含未知 provider）。
- `requiredOrigins(provider)` → 儲存設定時要一次請求的 origins：供應商 host（若需要）＋ `PDF_PERMISSION_ORIGIN`（若該供應商支援 PDF）。`gemini`／未知 → `[PDF_PERMISSION_ORIGIN]`；`qwen`／`deepseek` → `[]`；`nvidia` → `['https://integrate.api.nvidia.com/*']`。

### 4.2 `chrome.storage.local.gradingAnalysis`
```js
{
  [courseId: string]: {
    status: 'done' | 'notFound' | 'error',
    attempts: number,          // 累計嘗試次數（done 之後不再增加）
    at: string,                // 最後一次嘗試 ISO
    nextRetryAt: string|null,  // notFound/error 才有；done 為 null
    source: 'syllabus_body' | 'syllabus_pdf' | 'keyword_pdf' | 'ai_selected_pdf' | 'none',
    provider: string, model: string,
    components?: [{ name: string, weight: number, description: string }],  // done 才有，稽核用
    notes?: string,            // notFound 才有（如 'no syllabus material'、'weights sum 70'），截 200 字
    error?: string,            // error 才有，截 200 字
  }
}
```
`source` 反映**實際附進 prompt 的最主要材料**（優先序 syllabus_pdf > keyword_pdf > ai_selected_pdf > syllabus_body），在 parts 組完後才決定，不再像舊版在下載前就寫。

### 4.3 寫入 `customWeights[courseId]`
`[{ name: string, weight: number }]`，與權重編輯器儲存的形狀完全一致。寫入前**重新讀取** `customWeights`，若此刻該課已有非空陣列（使用者剛手動填了）→ 不覆蓋，但仍記 `done`。

### 4.4 訊息
| type | 方向 | payload | 回應 |
|---|---|---|---|
| `AI_GET_STATUS` | dashboard → bg | — | `{ configured, provider, model, pdfPermission: boolean, running: boolean, lastRunAt, courses: [{ courseId, status: 'done'|'notFound'|'error'|'skipped'|'pending', at, error }] }`（`skipped`＝有 Canvas 或手動權重所以不需分析；`pending`＝下次同步會跑。課名由 dashboard 端從 `_currentData.courses`／`courseNames` 解析，runner 不回傳名稱） |
| `AI_TEST_CONNECTION` | dashboard → bg | `{ config }`（未儲存的表單值） | `{ success: boolean, error?: string }` |
| `AI_RUN_NOW` | dashboard → bg | — | `{ success: true }`（立即排程 `runPending`，不等待完成） |
| `AI_RESET_ANALYSIS` | dashboard → bg | — | `{ success: true }`（清空 `gradingAnalysis` 後排程 `runPending`；**不**動 `customWeights`） |
| `GRADING_WEIGHTS_UPDATED` | bg → dashboard | `{ courseId: number, weights: [{name, weight}] }` | 無（`sendMessage` 的 rejection 一律吞掉：dashboard 沒開是常態） |

---

## 5. 觸發與「只跑一次」規則

### 5.1 排程點
`background.js` 的 `syncAll()` 在 `_lastAutoSyncAt = Date.now()` 之後、`console.log('同步完成')` 之前呼叫 `scheduleGradingAnalysis(BASE_URL)`；該函式（定義在 `analysisRunner.js`）只做 `setTimeout(() => runPendingGradingAnalysis(baseUrl).catch(console.error), 0)`。因此：
- SYNC 的 `sendResponse` 與 `lastSync` 落地時機**不變**（同步 skeleton、新手教學自動跳回都不受影響）。
- 分析在 `syncAll` 的 `finally` 釋放 `_syncing` 之後才開始，不持有 `_syncing`。
- 分析內部任何錯誤不會變成「同步失敗」。

### 5.2 全域鎖
`analysisRunner.js` 有模組層 `_aiAnalyzing` 旗標：進入函式第一件事就同步設為 true（不能夾在 `await` 之後，否則同一 tick 兩次觸發都會通過檢查），已在跑就直接 return（新手教學期間連續多次 SYNC 不會疊跑）；所有提前 return 都在 `try/finally` 內歸位。

**Service worker 存活**：MV3 SW 閒置約 30 秒會被回收，長 LLM 呼叫期間 `callProvider` 以 `setInterval` 每 20 秒呼叫一次 `chrome.runtime.getPlatformInfo` 重置閒置計時器，呼叫結束 `clearInterval`。

**重置期間的競態**：`AI_RESET_ANALYSIS` 會遞增模組層 `_aiResetEpoch`；進行中的分析在 `recordOutcome` 前發現 epoch 已變就放棄寫入，避免把結果寫回剛清空的紀錄。

### 5.3 `shouldAnalyze({ courseId, customWeights, groups, record, now })`（純函式，有測試）
依序判斷，回 `{ run: boolean, reason: string }`：
1. `customWeights[courseId]` 為非空陣列 → `{run:false, reason:'hasCustomWeights'}`
2. `groups` 任一 `group_weight > 0` → `{run:false, reason:'hasCanvasWeights'}`
3. `record?.status === 'done'` → `{run:false, reason:'done'}`
4. `record` 存在且 `record.attempts >= MAX_ATTEMPTS`（3） → `{run:false, reason:'maxAttempts'}`
5. `record` 存在且 `now < Date.parse(record.nextRetryAt)` → `{run:false, reason:'cooldown'}`
6. 否則 `{run:true, reason: record ? 'retry' : 'first'}`

### 5.4 `nextRecord(prev, outcome, now, meta)`（純函式，有測試）
`outcome ∈ { kind: 'done'|'notFound'|'error', components?, source, error? }`：
- `attempts = (prev?.attempts || 0) + 1`
- `done` → `nextRetryAt: null`
- `notFound` → `nextRetryAt = now + 7 天`
- `error` → `nextRetryAt = now + 24 小時`
- `meta = { provider, model }` 併入

### 5.5 每輪上限
每次 `runPending` 最多處理 `MAX_COURSES_PER_RUN = 10` 門（依 `courses` 順序），其餘等下次同步。一門一門**序列**跑，避免撞供應商 rate limit。

### 5.6 一律不跑的情況
- `resolveConfig(aiConfig).configured === false`（沒 key）→ 立即 return，不讀其他 storage、不記錄。
- `BASE_URL` 空 → return。

---

## 6. 單門課分析流程 `analyzeCourse(course, cfg, ctx)`

`ctx = { baseUrl, pdfAllowed: boolean }`（`pdfAllowed` 由 `chrome.permissions.contains({ origins: ['https://*.canvas-user-content.com/*'] })` 決定，每輪算一次）。

### 6.1 蒐集材料 `parts`（元素為 `{type:'text', text}` 或 `{type:'pdf', base64, mimeType:'application/pdf', bytes}`）

**Step 1 — syllabus 文字**：`GET /api/v1/courses/:id?include[]=syllabus_body`（`fetchJSON`，帶 cookie）。`syllabus_body` 非空 → `stripHtml()`（移除 `<script>`/`<style>` 內容、去標籤、解碼 `&amp; &lt; &gt; &quot; &#39; &nbsp;`、壓空白）；長度 > 50 → push `Course Syllabus:\n{text}`。
**不再**抓 `/courses/:id/assignments/syllabus` 整頁 HTML（舊版由此撿到頁面導覽的一堆檔案 id 與 inline JS，且該頁的大綱區塊與 API 的 `syllabus_body` 是同一份資料）。

**Step 2 — syllabus 內連結的 PDF**（僅當 `pdfAllowed && supportsPdf(provider)`）：`extractFileIds(syllabus_body)` 取 `/files/(\d+)` 唯一 id，每個走 `tryFetchPdf(`${baseUrl}/courses/${courseId}/files/${id}/download?download_frd=1`)`。

**Step 3 — 課程檔案**（僅當 `pdfAllowed && supportsPdf(provider)`）：`GET /api/v1/courses/:id/files?per_page=50&content_types[]=application/pdf`（用現有 `fetchAllPages`；401/403 視為空陣列）。排除 Step 2 已抓過的 id。
- `findSyllabusByKeyword(files)`：檔名（`display_name || filename`，小寫）含任一**強關鍵字**：`syllabus`, `course outline`, `course_outline`, `course-outline`, `course info`, `courseinfo`, `course guide`, `unit guide`, `course description`, `grading policy`, `grading scheme`, `assessment scheme`, `assessment policy`；**不再**用裸的 `grading`／`assessment`（舊版會把 `Assessment 1 rubric.pdf` 當大綱）。回第一個命中。
- 沒命中且 `files.length > 0` → `selectSyllabusPdfWithAI(files.slice(0, 60), cfg)`：一次 LLM 呼叫（temperature 0，`maxTokens 512`），prompt 見 §6.3；回傳合法檔案 id 才算。
- 命中的檔案 → `tryFetchPdf(file.url)`；失敗則 `GET /api/v1/files/:id` 取新 `url` 再試一次。

**`tryFetchPdf(url)`**：`fetch(url, {credentials:'include'})`；**下載前**先看 header：`Content-Length` 超過單檔上限、或 `Content-Type` 為 `text/html`／`application/json` 就不讀 body（`rejectBeforeDownload`）；下載後 `res.ok` 且（`Content-Type` 含 `pdf` **或** 前 5 bytes 為 `%PDF-`）才接受（`acceptPdf`）；單檔 ≤ `MAX_PDF_BYTES` 10MB；**累計** ≤ `MAX_TOTAL_PDF_BYTES` 12MB，超過的略過（base64 膨脹 4/3 後約 16MB，留 Gemini 20MB 請求上限的空間；15MB 會剛好撞頂）。syllabus 內連結的檔案最多嘗試 `MAX_LINKED_PDFS` 5 個。不合格回 `null`。

**Step 4 — 判定**：`parts` 為空 → outcome `notFound`，`source:'none'`，**不呼叫 LLM**。

### 6.2 呼叫與解析
- push 使用者指令文字（§6.3），`callProvider(cfg, parts, SYSTEM_PROMPT, { temperature: 0, maxTokens: 8192 })`。
- `parseAnalysisResponse(text)`（純函式）：去 ``` 圍欄 → `JSON.parse`（失敗時再取第一個 `{` 到最後一個 `}` 重試；模型在 JSON 前後多講話不算錯誤；仍失敗 → `{ok:false}`）→ 驗 `components` 為陣列 → 逐項：`name` 為非空字串（trim、截 60 字）；`weight` 接受 number 或可轉數字的字串（去 `%`），需有限且 > 0 → 過濾後為空 → `{ok:true, found:false}`。
- `normalizeWeights(components)`（純函式）：全部 ≤ 1 且總和 ≤ 1.05 → 視為小數比例，×100；四捨五入到 1 位小數；總和非有限數或落在 **[80, 120]** 之外 → 視為 `notFound`（notes 記 `weights sum {total}`）。同名合併（後者權重加到前者）。
- 成功 → `toCustomWeights(components)` → `[{name, weight}]` → 寫 `customWeights`（§4.3）、記 `done`、`sendMessage(GRADING_WEIGHTS_UPDATED)`。
- 供應商 HTTP 非 2xx／網路錯誤／回應無文字 → outcome `error`（訊息含狀態碼，截 200 字）。

### 6.3 Prompt（定義在 `gradingRules.js`，測試只驗非空與含關鍵句）
**SYSTEM_PROMPT**：
```
You extract a course's grading breakdown. Return ONLY valid JSON with no markdown fences and no commentary:
{ "found": boolean, "components": [{ "name": string, "weight": number, "description": string }], "notes": string }
Rules: "weight" is a percentage of the final grade as a plain number (e.g. 30, not "30%" and not 0.3). If the syllabus gives a range, use the midpoint. If it gives points, convert to percent of the total. Keep component names as written in the source (same language). Only include components that count toward the final grade. If the material contains no grading breakdown, return found=false with an empty components array.
```
**USER_PROMPT**（放在材料之後）：
```
Extract the grading/assessment breakdown of this course from the material above.
```
**FILE_PICK_PROMPT(files)**：
```
Course files:
{id}: {display_name}
...
Which single file most likely contains the course syllabus or grading policy? Return ONLY a JSON integer file id, or null if none is relevant.
```

---

## 7. 供應商層 `providers.js`（純函式，有測試）

- `buildRequest(cfg, parts, systemPrompt, { temperature, maxTokens })` → `{ url, headers, body }`（`body` 為物件，呼叫端 `JSON.stringify`）
  - **gemini**：`url = `${baseUrl}/models/${model}:generateContent``；headers `{'Content-Type':'application/json', 'x-goog-api-key': apiKey}`（**key 不進 URL**）；body `{ systemInstruction:{parts:[{text}]}, contents:[{parts: [...]}], generationConfig:{ maxOutputTokens, temperature } }`；pdf part → `{ inlineData:{ mimeType, data: base64 } }`。model id 若帶 `models/` 前綴會先去掉。
  - **qwen / deepseek / nvidia**（OpenAI 相容）：`url = `${normalizeBaseUrl(baseUrl)}/chat/completions``；headers `{'Content-Type':'application/json', Authorization:`Bearer ${apiKey}`}`；body `{ model, messages:[{role:'system',content},{role:'user',content: 文字 parts 以 \n\n 串接}], max_tokens, temperature }`；PDF parts **丟棄**（呼叫端在 §6.1 已不會為這兩家下載 PDF，這裡只是防禦）。
- `extractText(provider, json)`：gemini 讀 `candidates[0].content.parts[].text` 串接；OpenAI 相容讀 `choices[0].message.content`；缺 → throw `Empty response (finishReason 或 blockReason)`，便於在 modal 狀態列判讀 MAX_TOKENS／SAFETY。
- `normalizeBaseUrl(url)`：去尾端 `/`。
- `supportsPdf(provider)`：只有 `gemini` 為 true（`nvidia` 因此自動走 OpenAI 相容路徑，`providers.js` 不需為它加任何分支；model id 含斜線（`deepseek-ai/...`）只出現在 JSON body，不進 URL path，不會被百分號編碼）。
- 送出的 header 只有上面列的（Gemini 對 preflight 帶未知 header 會回 403）。

`analysisRunner.js` 的 `callProvider` 即 `buildRequest → fetch → res.ok 檢查 → json → extractText`，但在 `buildRequest` **之前**先擋一道：`providerHostPermission(cfg.provider)` 有值而 `chrome.permissions.contains` 說沒授權時，直接丟 `"<provider> NO_HOST_PERMISSION: <origin>"`，不送請求也不花額度。否則 NVIDIA 未授權時只會得到與離線同形、無從判讀的 CORS `TypeError`。

**NVIDIA NIM 的 CORS（實測）**：`https://integrate.api.nvidia.com/v1/chat/completions` 的 preflight 回 200，但**完全沒有任何 `Access-Control-Allow-*` header**（連一般網頁來源也不回），所以純 fetch 一定被瀏覽器擋成 `TypeError: Failed to fetch`；端點本身正常（亂填 key 會乾淨地回 `403 {"status":403,"title":"Forbidden","detail":"Authorization failed"}`）。Chrome 的 host permission 會讓該來源的請求完全略過 CORS 檢查，因此宣告 host 即可運作。

---

## 8. 權限與 manifest

### 8.1 manifest.json
```json
"version": "2.1.0",
"optional_host_permissions": [
  "https://*.canvas-user-content.com/*",
  "https://integrate.api.nvidia.com/*"
]
```
`host_permissions`、`permissions`、`content_scripts` **不變**。加 optional 權限的更新**不會**讓現有使用者的擴充功能被停用。

LLM 端點**原則上不需要任何權限**——Gemini／Qwen／DeepSeek 都對 `chrome-extension://` 來源回正確 CORS header（已實測），純 fetch 即可。**NVIDIA NIM 是例外**：它一個 `Access-Control-Allow-*` header 都不回（§7），只能靠 host permission 讓 Chrome 略過 CORS，所以 `https://integrate.api.nvidia.com/*` 進 `optional_host_permissions`——沒選 NVIDIA 的使用者永遠不會看到這個權限。日後若某家收緊 CORS，比照辦理：加進 `optional_host_permissions`、在 `PROVIDERS` 該筆補 `hostPermission`，其餘（請求時機、未授權提示、fail-fast）自動生效，不需改必要權限。

### 8.2 請求時機
`aiSettings.js` 的「儲存」click handler **第一個非同步呼叫**就是 `chrome.permissions.request({ origins })`，其中 `origins = DueGradingRules.requiredOrigins(表單上的 provider)`（§4.1）——供應商自己的 host 與 PDF 下載權限**併成一次請求**，只跳一個對話框（必須在 user gesture 內、且在任何 `await` 之前；已授權時 Chrome 直接回 true 不彈窗），之後才寫 storage。**用不到的權限一律不請求**：純文字供應商永遠不會下載 PDF，Gemini／Qwen／DeepSeek 也不需要端點權限，不該讓使用者看到用不到的權限對話框（供應商查表是同步 DOM 讀取，不影響 gesture；`origins` 為空時直接跳過請求）。同理 `readForm()` 對支援 PDF 的供應商把隱藏的 base URL 欄位存為空字串。使用者拒絕 → 照常儲存設定，modal 顯示對應提示：PDF 權限缺 → 「未授權 PDF 存取，只會分析 syllabus 文字」（`AI_GET_STATUS.pdfPermission`）；供應商端點權限缺 → §9.2 的 host 權限提示（`AI_GET_STATUS.providerPermission`），此時該供應商完全無法運作，分析會記 `NO_HOST_PERMISSION` 錯誤。

### 8.3 API key 存放
明文存 `aiConfig.apiKey`（與舊版相同，Web Store 上 BYOK 擴充常見作法），但：
- `background.js` 呼叫 `chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })`（守衛：API 存在才呼叫，並以 `try/catch` 包住、放在所有 listener 註冊**之後**——若在舊版 Chrome 同步拋錯，不能連帶讓 `onMessage` 等 listener 沒註冊到），讓 claude.ai 的 content script 讀不到 storage（已確認 `claude_content.js` 只用 `runtime.sendMessage`，不讀 storage）。
- 絕不 `console.log` key、絕不用 `storage.sync`、只送到使用者選的供應商 host。
- modal 有「清除金鑰」。

---

## 9. 設定 modal（`aiSettings.js` ＋ `index.html`）

### 9.1 入口
`#settings-menu` 內、`#menu-claude-usage-toggle` 之後新增 `<button class="settings-menu-item" id="menu-ai-settings">AI 分析設定</button>`。`dashboard.js` 綁 click → `DueAiSettings.open()` ＋ 既有的關選單三行樣板。

### 9.2 內容（overlay id `ai-settings-overlay`，樣式沿用 `.weight-edit-overlay/.weight-edit-modal` 的視覺語言：1px 邊框、8px 圓角、DM Sans 300、Section 標題 DM Mono 小字大寫）
1. 標題「AI 分析設定」＋一句說明：「自動從課程大綱抓出評分比重，寫進手動權重。沒填 key 就不會啟用。」
2. **同意聲明**（醒目但不刺眼，`--muted`）：「啟用後，課程大綱與相關 PDF 會直接從你的瀏覽器送到你選的供應商；開發者不會收到任何資料。」
3. 欄位：供應商 `<select>`（Gemini／Qwen／DeepSeek／NVIDIA NIM）；API key（`type=password`＋顯示切換）；模型 ID（placeholder 顯示該供應商預設，留空即用預設）；Base URL（進階，可折疊，只在 Qwen／DeepSeek 顯示，placeholder 為預設）。切換供應商只更新 placeholder，不清空使用者已輸入的模型。
4. 供應商為 Qwen／DeepSeek／NVIDIA 時顯示提示：「此供應商只能讀 syllabus 文字，大綱若是 PDF 建議用 Gemini」。
5. 按鈕列：`測試連線`（送 `AI_TEST_CONNECTION` 帶表單值，`maxTokens 512`，顯示 ✓／錯誤訊息）、`清除金鑰`（清 `aiConfig`，不動 `gradingAnalysis`／`customWeights`）、`取消`、`儲存`（§8.2 流程 → 寫 `aiConfig`（含 `consentedAt`）→ 送 `AI_RUN_NOW` → 關閉）。
6. **分析狀態區**（開啟時與每次操作後送 `AI_GET_STATUS` 刷新）：摘要一行「已分析 N · 找不到大綱 M · 錯誤 K · 待分析 P · 上次執行 {時間}」＋每門課一行（課名用 `courseNames` 自訂名優先；狀態字；error 顯示截短訊息）。底部 `清除分析紀錄` 按鈕（走現有 `openConfirmDialog` 確認後送 `AI_RESET_ANALYSIS`；確認文案明講：紀錄清除後只會為「目前沒有權重」的課重新分析，已寫入的權重不動，要重分析某課請先在該課權重編輯器按「還原 Canvas 權重」）。
7. 未授權 PDF 時顯示一行提示（§8.2）。
8. **供應商端點權限缺席提示**（`#ai-host-perm-hint`，i18n key `hostPermHint`，三語齊備）：`AI_GET_STATUS` 回 `configured && providerPermission === false` 時顯示「此供應商不允許瀏覽器直接呼叫，需要『存取 {host}』的權限才能運作。請重新按『儲存』並允許。」；`{host}` 由 `providerHostPermission(已儲存的 provider)` 去掉 scheme 與結尾 `/*` 而來（`integrate.api.nvidia.com`）。判定依**已儲存**的供應商（狀態由 background 依 `aiConfig` 算），語言切換時一併重畫。

### 9.3 i18n
`aiSettings.js` 內建 `STRINGS = { 'zh-TW': {...}, 'zh-CN': {...}, en: {...} }`，`DueAiSettings.applyLanguage(lang)` 由 `dashboard.js` 的 `applyUILanguage()` 末尾呼叫（一行），負責 modal 全部文字**與** `#menu-ai-settings` 的選單文字。三語言必須齊備（測試不驗，實作者自檢 key 集合相等）。

### 9.4 a11y／關閉
- `dashboard.js` Esc closers 陣列加 `['ai-settings-overlay', () => DueAiSettings.close()]`（放在 confirm 之後、custom-assignment 之前）。
- `setupModalA11y` 的 id 陣列加 `'ai-settings-overlay'`。
- 點 overlay 背景關閉（與權重編輯器一致）。

---

## 10. Dashboard 刷新訊息（`dashboard.js`，緊接現有 `storage.onChanged` 監聽之後）

```js
chrome.runtime?.onMessage?.addListener((msg) => {
  if (!msg || msg.type !== 'GRADING_WEIGHTS_UPDATED' || !_currentData) return;
  if (!_currentData.customWeights) _currentData.customWeights = {};
  _currentData.customWeights[msg.courseId] = msg.weights;
  const idle = !_dragCtx && Object.keys(_completeTimers).length === 0;
  if (idle && currentView === 'course' && currentCourseId === msg.courseId) rerenderDetailAndNav(msg.courseId);
});
```
- 只更新記憶體快取；只有「正開著該課詳情且沒有拖曳／完成動畫進行中」才重繪。其他情況下一次 render 自然帶到。
- **不**新增任何 `storage.onChanged` 監聽（CLAUDE.md 開發注意事項 9）。

---

## 11. 相對舊版修正的問題（實作時對照）

| 舊行為 | 新行為 |
|---|---|
| 找不到大綱永久快取、永不重試 | 7 天後重試，最多 3 次 |
| key 無效／沒填模型 → 每次同步都重跑整個迴圈 | 錯誤 24 小時冷卻、最多 3 次；沒填模型用預設值 |
| 自動分析 `await` 在 `syncAll` 內，阻塞 SYNC 回應 | `setTimeout` 排程，`syncAll` 不等待 |
| 多課分析 read-modify-write 整個 map，會互相覆蓋 | 每門課寫入前重新讀取 storage |
| Gemini key 放 URL query | 放 `x-goog-api-key` header |
| 抓整頁 syllabus HTML，撿到導覽列檔案 id 與 inline JS | 只用 API `syllabus_body`，`stripHtml` 移除 script/style |
| `grading`／`assessment` 裸關鍵字誤中 rubric | 只用強關鍵字 |
| `source` 在下載前就寫、與實際附件不符 | parts 組完後依實際材料決定 |
| Qwen／DeepSeek 仍下載 PDF 再丟掉 | 不支援 PDF 的供應商直接跳過下載與 AI 挑檔 |
| 無 Content-Type 檢查，任何回應都當 PDF | 檢查 Content-Type 或 `%PDF-` magic；單檔與累計大小上限 |
| 權重總和離譜也照顯示 | 小數比例自動 ×100；總和不在 [80,120] 視為找不到 |
| 需要 `host_permissions` 加 LLM 網域（更新會停用擴充） | 不加必要權限；PDF host 用 optional 權限 |

---

## 12. 文件更新

- **CLAUDE.md**：專案結構加 `ai/` 目錄與 `aiSettings.js`；「資料儲存」加 `aiConfig`、`gradingAnalysis`；「已實作功能」新增「AI 評分比重分析」小節（觸發規則、只跑一次、寫入手動權重、設定 modal、權限策略）；`background.js` 段落加 `importScripts` 與 `scheduleGradingAnalysis`；移除「AI 分析已移除」的過時註記改為指向本 spec；開發注意事項加一條「分析結果透過 `GRADING_WEIGHTS_UPDATED` 訊息刷新，不走 `storage.onChanged`」。
- **AGENTS.md**：那行「逐作業 AI 分析與多 LLM 後端等舊功能已於 2026-07 移除」改為「逐作業 AI 分析已移除；評分比重 AI 分析於 2026-09 以新架構加回（見 spec）」，模組清單補 `taskRules.js` 與 `ai/`。
- **README.md／README.zh-TW.md**：
  - 首段「no API tokens, no account setup, no server」改為「Canvas 不需要 token 或註冊；沒有伺服器」＋一句「選用的 AI 評分比重分析需自備 LLM API key」。
  - 「Due never asks for an API token」段補：「例外：選用的 AI 功能需要你自己的 Gemini／Qwen／DeepSeek key，只存在本機、只送到該供應商」。
  - Privacy 段補一句：啟用 AI 功能時，課程大綱與 PDF 直接送到你選的供應商，開發者不經手。
  - 新增小節「Optional: AI grading-weight analysis」說明啟用方式與只跑一次的行為。
  - 頁尾版本 2.0.0 → 2.1.0。
- **privacy-policy.md**：更新日期；「Data We Access」改為現況（不再抓公告；PDF 僅在啟用 AI 且授權時）；AI 段改為三家供應商、送出的資料為 syllabus 文字與相關 PDF、`optional_host_permissions` 說明、key 明文存本機與清除方式；移除 Anthropic/OpenAI/Moonshot/Zhipu/MiniMax。

---

## 13. 測試與驗證

### 13.1 單元測試（node，沿用 `node:assert/strict` ＋ 本地 `test()` 樣式）
`extension/ai/gradingRules.test.js`：
- `resolveConfig`：空／未知 provider → gemini 預設；model/baseUrl 空字串取預設；`configured` 判定；`nvidia` 預設 model／baseUrl 與 https-only 規則
- `providerHostPermission`／`requiredOrigins`：只有 nvidia 有 host permission；三種供應商各自的 origins 聯集（未知 → 比照 gemini）
- `shouldAnalyze`：六條規則各一例；`nextRetryAt` 到期前後
- `nextRecord`：attempts 累加；done/notFound/error 的 `nextRetryAt`
- `findSyllabusByKeyword`：`Syllabus_2026.pdf` 命中；`Assessment 1 rubric.pdf`、`Grading Rubric HW2.pdf` **不**命中；`grading policy.pdf` 命中
- `extractFileIds`：多種連結格式、去重
- `stripHtml`：移除 script/style 內容、實體解碼、空白壓縮
- `parseAnalysisResponse`：帶 ```json 圍欄；`"30%"` 字串；非法 JSON；空 components
- `normalizeWeights`：小數比例 ×100；總和 70 → notFound；同名合併；四捨五入
- `toCustomWeights` 形狀

`extension/ai/providers.test.js`：
- gemini request：url、`x-goog-api-key` header、key 不在 url、pdf → inlineData、systemInstruction
- OpenAI 相容 request：`/chat/completions`、Bearer、PDF 被丟棄、base URL 尾斜線正規化；`nvidia` 走同一路徑且含斜線的 model id 不被 URL 編碼
- `extractText` 兩家正常／空回應 throw
- `supportsPdf`

`extension/ai/analysisRunner.test.js`（`node:vm` 載入三個 ai/ 檔＋stub `chrome`／`fetch`）：沒 key 零請求；成功寫入 `customWeights`＋`gradingAnalysis` 並送 `GRADING_WEIGHTS_UPDATED`；再跑一次零 LLM 呼叫；同 tick 兩次觸發只有一次 LLM 呼叫；純文字供應商不下載 PDF；LLM 500 → `error` 且 `source` 保留；`AI_GET_STATUS` 形狀；連結 PDF 只試前 5 個；`Content-Length`／`text/html` 不讀 body；reset epoch；需要 host permission 的供應商未授權 → `NO_HOST_PERMISSION` 且零 LLM 呼叫、已授權 → 正常打 NVIDIA 端點並寫入權重；`AI_GET_STATUS.providerPermission` 三種情境（`chrome.permissions.contains` 的 stub 依 origin 判定）。

### 13.2 靜態檢查
- `node --check` 全部 JS：`background.js`、`ai/*.js`、`dashboard/dashboard.js`、`dashboard/aiSettings.js`、`popup.js`。
- 既有四個測試檔仍全綠。
- **隔離 grep**（皆應成立）：
  - `dashboard.js` 內 `renderWeightPie`、`openWeightEditModal`、`renderCourseDetailSection`、`loadData` 函式本體 diff 為空
  - `dashboard.js` 的 `I18N` 物件 diff 為空
  - `background.js` 的 `fetchCourses`／`fetchAssignments`／`fetchAssignmentGroups`／`syncAll` 的 fetch 區段 diff 為空（只多 `scheduleGradingAnalysis()` 一行）
  - `taskRules.js`、`completion.js`、`customAssignments.js`、`descSanitizer.js`、`popup.*`、`claude_*.js` 無 diff
  - manifest `host_permissions` 與 `permissions` 無 diff
  - `extension/` 目錄下不含 `aiProvider`、`aiApiKey`、`syllabusAnalysis`、`geminiApiKey`（舊 key 不復用；docs 內的歷史 spec 不在此限）

### 13.3 人工驗收（交回使用者；暑假 Canvas 幾乎無作業，重點驗「沒 key 等於現況」與設定流程）
1. `chrome://extensions` 重新載入 → 無錯誤；不填 key 時同步、圓餅、編輯器、popup 與 2.0.1 一致；設定選單多「AI 分析設定」。
2. 打開 modal → 填 Gemini key → 測試連線 ✓ → 儲存 → 出現 PDF 權限提示 → 允許。
3. 按同步 → SYNC 回應不變慢；稍後 modal 狀態區出現各課結果；有大綱的課圓餅出現權重、編輯器可改、「還原 Canvas 權重」出現。
4. 再按同步 → 狀態不變、供應商後台無新請求（只跑一次）。
5. 「還原 Canvas 權重」→ 圓餅回到無資訊；再同步不重跑。「清除分析紀錄」→ 該課（此時已無權重）重跑。
6. 清除金鑰 → 之後同步完全沉默。

---

## 14. Web Store 後台待辦（使用者手動，隨 2.1.0 上傳）
- Privacy practices：資料類型勾 **Website content**（課程大綱／PDF）與 **Authentication information**（API key）；`optional_host_permissions` 的用途說明填「僅在使用者啟用 AI 分析時下載 Canvas 課程 PDF」；「是否使用遠端程式碼」答否（呼叫 JSON API 不算）。
- 隱私政策 URL 指向更新後的 `privacy-policy.md`。
- 商店描述可加一句「選用：自備 API key 的 AI 評分比重分析」。
- 三項資料使用認證照勾（不出售、不轉作無關用途、不用於信用評估）。

---

## 15. 影響檔案

**新增**：`extension/ai/gradingRules.js`、`extension/ai/gradingRules.test.js`、`extension/ai/providers.js`、`extension/ai/providers.test.js`、`extension/ai/analysisRunner.js`、`extension/dashboard/aiSettings.js`
**修改**：`extension/manifest.json`、`extension/background.js`、`extension/dashboard/index.html`、`extension/dashboard/dashboard.js`、`CLAUDE.md`、`AGENTS.md`、`README.md`、`README.zh-TW.md`、`privacy-policy.md`
**不動**：`extension/dashboard/taskRules.js`、`completion.js`、`customAssignments.js`、`descSanitizer.js`（含測試）、`extension/popup.*`、`extension/claude_*.js`、`extension/fonts/`、`extension/icons/`

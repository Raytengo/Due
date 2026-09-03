# Due — 項目說明書

## 項目概述

這是一個 Chrome 擴充功能，幫助 HKUST(GZ) 的學生從 Canvas LMS 自動拉取課程資料，
並在一個美觀的 Dashboard 上顯示所有作業、截止日期和評分比重。

目標是讓學生不需要打開 Canvas，就能知道「現在該做什麼、怎麼做、什麼時候要做完」。

---

## 關鍵背景資訊

- **學校 Canvas 網址**：`https://hkust-gz.instructure.com`
- **重要限制**：學校不允許學生自己產生 Personal Access Token，所以必須透過 Chrome 擴充功能借用瀏覽器的登入狀態（Cookie）來呼叫 Canvas API，不能用 Bearer Token 的方式
- **Canvas API** 不需要額外 header，Chrome 擴充功能在使用者已登入的情況下直接 fetch 即可

---

## 專案結構

```
cc/
├── CLAUDE.md
└── extension/
    ├── manifest.json              ← 擴充功能設定（Manifest V3；LLM 不佔必要權限，PDF 下載走 optional_host_permissions）
    ├── background.js              ← Service worker：Canvas API 同步 + Claude 用量；importScripts 載入 ai/ 三檔
    ├── ai/
    │   ├── gradingRules.js        ← AI 評分比重分析純規則：設定解析、只跑一次規則、回應解析、權重正規化（含測試）
    │   ├── providers.js           ← LLM 供應商請求層：Gemini 原生／OpenAI 相容（含測試）
    │   ├── pdfText.js             ← PDF 抽字：bytes → text（包 vendor pdf.js；純函式，含測試）
    │   ├── vendor/                ← pdfjs-dist 3.11.174 legacy build（載入順序：worker → lib，見 vendor/README.md）
    │   └── analysisRunner.js      ← service worker 側編排：同步後排程、Canvas 材料蒐集、PDF 下載、呼叫供應商、寫 customWeights、AI_* 訊息（含 node:vm 測試）
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

---

## 技術規格

### Chrome 擴充功能

- **Manifest Version**：3（必須用 V3）
- **Permissions**：`storage`、`tabs`、`webNavigation`、`scripting`
- **Host Permissions**：`https://*.instructure.com/*`、`https://claude.ai/*`（後者供 popup 的 Claude 用量顯示與 content script）
- **Optional Host Permissions**：`https://*.canvas-user-content.com/*`（AI 分析下載 Canvas PDF 用；所有供應商都會請求）、`https://integrate.api.nvidia.com/*`（僅選 NVIDIA NIM 供應商時用）；兩者都在儲存 AI 設定時才請求。LLM 端點原則上靠供應商 CORS、不佔必要權限，NVIDIA 是唯一例外（見 AI 章節）
- **背景執行**：Service Worker（background.js），不能用 `window` 或 `document`

### Canvas API 端點

```
GET /api/v1/courses?enrollment_state=active&per_page=50
→ 拿所有目前選修的課程（過濾 workflow_state === 'available' 且有名稱）

GET /api/v1/courses/:id/assignments?per_page=50&include[]=submission
→ 拿某門課的所有作業（含繳交狀態）

GET /api/v1/courses/:id/assignment_groups?include[]=assignments&include[]=group_weight
→ 拿評分比重分組
```

注意：Canvas API 有分頁，需要處理 `Link` header 的 `rel="next"`。

### 資料儲存

用 `chrome.storage.local` 存所有資料，格式如下：

```json
{
  "lastSync": "2026-03-06T10:00:00Z",
  "courses": [],
  "assignments": { "courseId": [] },
  "assignmentGroups": { "courseId": [] },
  "scores": { "assignmentId": 85.5 },
  "manualDone": { "assignmentId": true },
  "manualUndone": { "assignmentId": true },
  "manualShown": { "assignmentId": true },
  "manualHidden": { "assignmentId": true },
  "customWeights": { "courseId": [{ "name": "Homework", "weight": 30 }] },
  "courseNames": { "courseId": "自訂名稱" },
  "uiLanguage": "zh-TW",
  "showClaudeUsageInPopup": true,
  "claudeUsage": { "usedPercent": 0, "resetAt": "..." },
  "aiConfig": { "provider": "gemini | qwen | deepseek | nvidia", "apiKey": "…", "model": "", "baseUrl": "", "consentedAt": "…" },
  "gradingAnalysis": { "courseId": { "status": "done", "attempts": 1, "at": "…", "source": "syllabus_pdf", "provider": "gemini", "model": "gemini-2.5-flash", "components": [] } }
}
```

---

## 設計規範

嚴格遵守 Anthropic 品牌設計語言：

### 顏色

```css
--bg:       #faf9f5;   /* 暖米白，頁面背景 */
--surface:  #f2f0e8;   /* 稍深的米白，卡片/側欄背景 */
--dark:     #141413;   /* 近黑，主要文字 */
--mid:      #6c685e;   /* 中灰，次要文字（WCAG AA：對 surface ≥4.5:1）*/
--muted:    #63605a;   /* 深灰，說明文字（WCAG AA：對 surface ≥4.5:1）*/
--border:   #dedad0;   /* 邊框顏色 */
--orange:   #d97757;   /* 主強調色 */
--blue:     #6a9bcc;   /* 次強調色 */
--green:    #788c5d;   /* 第三強調色 */
--warm:     #b09050;   /* 暖黃 */
--purple:   #a86070;   /* 考試/測驗顏色 */
```

### 字體

```css
標題/課程名稱：'Source Serif 4', Georgia, serif（font-weight: 400）
內文：         'DM Sans', sans-serif（font-weight: 300）
代碼/數字/標籤：'DM Mono', monospace
```

字體已打包於 `extension/fonts/`（latin subset woff2，透過 `@font-face` 宣告），不再使用 Google Fonts CDN；CJK 字元由系統字體 fallback。

### 風格原則

- 大量留白，不要擁擠
- 邊框用細線（1px），圓角保守（4–8px）
- 一律 light mode（深色模式已於 2026-07-23 移除；`darkMode` 舊 key 殘留無害，不主動清除）
- Section 標題用 DM Mono 小字大寫間距
- 動畫克制：卡片 hover 用 `translateY(-2px)`，轉場用 View Transitions API

### 截止日期顏色規則

色階統一由 `taskRules.urgency(dueAt)` 決定；`dashboard/urgencyClass()` 只做映射（popup 共用同一規則）。

- 逾期未繳（30 天窗內）：紅橘 `var(--overdue)`（`#b3452c`，class: `due-overdue`）
- ≤7 天：橘紅 `var(--orange)`（class: `due-urgent`）
- 8–30 天：暖黃 `var(--warm)`（class: `due-soon`）
- 30 天以上：藍色 `var(--blue)`（class: `due-later`）
- 已過期（30 天窗外的舊逾期）：灰色淡化 `var(--mid)`（class: `due-past`；窗外項目只在課程詳情可見）
- 考試類：紫色 `var(--purple)`（class: `due-exam`；日常視圖不顯示考試，此色目前用於課程詳情的「已自動隱藏」稽核列）
- 無截止日期／已完成：class: `due-none`
- **已完成且時間已過 → 不顯示任何時間標籤**（`dueLabelFor`；已繳交視圖／稽核列適用——過去的事無需再標「逾X天」）；緊急件數（詳情 header／grid 卡 badge）一律排除已完成，已繳交視圖不會出現「N件緊急」
- 時間標籤括號內不留空格：`8月4日（2天後）`、`7月2日（逾20天）`（`daysLater`／`overdueDaysLabel` 為 `{n}` 模板，與 popup 一致）

---

## 已實作功能

### background.js

- 監聽 `webNavigation.onCompleted` — 使用者造訪 Canvas 時自動觸發同步
- 響應訊息：`SYNC`、`GET_STATUS`、`SYNC_CLAUDE_USAGE`
- `syncAll()`：並行拉取所有課程的作業與評分分組（courses / assignments / assignmentGroups）
- `fetchSchoolName()`：自動偵測學校名稱（優先 Canvas API → hostname 解析）
- `fetchClaudeUsageDirect()`：popup 的 Claude 用量 chip — 找開著的 `claude.ai` 分頁，借該分頁登入狀態讀 `/api/organizations/:id/usage`，**不呼叫任何 LLM**；結果存 `claudeUsage`。搭配注入 claude.ai 的 `claude_injected.js` / `claude_content.js`
- `importScripts('ai/vendor/pdf.worker.min.js', 'ai/vendor/pdf.min.js', 'ai/pdfText.js', 'ai/gradingRules.js', 'ai/providers.js', 'ai/analysisRunner.js')`（vendor 兩檔的順序不可調換）：AI 評分比重分析（見下節）；`syncAll` 成功寫入 storage 後呼叫 `scheduleGradingAnalysis(BASE_URL)`（`setTimeout` 排程，不 await、不阻塞 SYNC 回應、不持有 `_syncing`）；`AI_*` 訊息轉交 `handleAiMessage`
- 啟動時 `chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })`：API key 只讓擴充功能自身頁面讀得到

### AI 評分比重分析（`extension/ai/`，spec `docs/superpowers/specs/2026-09-03-ai-grading-weights-restore-design.md`）

- **定位**：AI 只負責「產生課程權重」並寫進現有 `customWeights[courseId]`；圓餅圖／權重編輯器／「還原 Canvas 權重」原樣呈現，**前端顯示邏輯零改動**。沒填 API key 時整個功能沉默，行為與未加此功能完全相同
- **觸發**：每次同步完成後自動、序列、每輪最多 10 門；全域鎖 `_aiAnalyzing`（進函式即同步設定）防疊跑；LLM 呼叫期間每 20 秒 `getPlatformInfo` keepalive 防 SW 回收；`AI_RESET_ANALYSIS` 遞增 `_aiResetEpoch`，進行中的分析發現 epoch 變了就不寫回
- **只跑一次**（`DueGradingRules.shouldAnalyze`）：只看目前是否已有權重——有手動權重／Canvas `group_weight` → 跳過，`record.status` 本身不擋。`notFound`／`error` **沒有冷卻期、沒有次數上限**（2026-09-03 起）：只要這門課目前沒有權重，每次同步都會再試一次。成功（`done`）後權重會寫進 `customWeights`，之後自然被「已有權重」擋掉不再重跑；要重跑已 done 的課，在該課權重編輯器按「還原 Canvas 權重」清空 `customWeights` 即可，下次同步就會自動重新分析，不需要（也沒有）額外的「清除分析紀錄」按鈕——modal 裡的「分析狀態」現在只讀不寫，`AI_RESET_ANALYSIS` 訊息仍在 `handleAiMessage` 但已無任何呼叫端
- **材料**（`analyzeCourse`）：API `syllabus_body` 文字（`stripHtml`）→ syllabus 內連結 PDF → 課程 PDF 檔案（強關鍵字 → AI 挑檔）；PDF 只要有 optional 權限就下載，**所有供應商都適用**（AI 挑檔亦然）——Gemini 送原始 bytes（`inlineData`，自帶 OCR），其餘供應商用 `ai/pdfText.js`（vendor pdf.js）抽字後送純文字 part，截斷至 `MAX_EXTRACTED_TEXT_CHARS`（30000）、短於 `MIN_SYLLABUS_TEXT_CHARS` 視同這個檔案沒材料（掃描／圖片型 PDF 仍只有 Gemini 讀得到，其餘落到 `notFound`）；`parts` 為空不呼叫 LLM。下載前先看 `Content-Length`／`Content-Type`，下載後 `%PDF-`／Content-Type 檢查，單檔 10MB、累計 12MB（base64 膨脹後仍低於 Gemini 20MB 請求上限），大綱內連結檔最多試 5 個
- **供應商**（`DueAiProviders`）：Gemini 原生（key 走 `x-goog-api-key` header；base URL 固定 Google，不吃使用者輸入）；Qwen／DeepSeek／NVIDIA NIM 走 OpenAI 相容 `/chat/completions`（純文字，可自訂 base URL，僅接受 `https://`）。**NVIDIA NIM 需要 host permission**：該端點完全不回 `Access-Control-Allow-*` header（實測連一般網頁來源也不回），純 fetch 必被瀏覽器擋掉，靠 `optional_host_permissions` 的 `https://integrate.api.nvidia.com/*` 讓 Chrome 略過 CORS；`PROVIDERS[].hostPermission` 為單一真相來源，`requiredOrigins()` 決定儲存時請求哪些 origin，未授權時 `callProvider` 直接丟 `NO_HOST_PERMISSION`（不送請求、不花額度），modal 顯示 `#ai-host-perm-hint`。只送供應商需要的 header。Gemini 2.5 的 thinking token 計入輸出上限，主分析 `maxTokens 8192`、挑檔／測試連線 512
- **回應**：`parseAnalysisResponse`（去 ``` 圍欄；解析失敗再取第一個 `{` 到最後一個 `}`）→ `normalizeWeights`（小數比例 ×100、同名合併、總和須在 [80,120] 且為有限數）→ `toCustomWeights`。寫入前重新讀 storage；若使用者已手動填權重則不覆蓋。寫入後送 `GRADING_WEIGHTS_UPDATED` 給 dashboard
- **設定 modal**（`dashboard/aiSettings.js`，設定選單「AI 分析設定」）：供應商／key／模型／base URL、測試連線、清除金鑰、分析狀態列（只讀，無操作按鈕）。「儲存」在 user gesture 內先 `chrome.permissions.request(DueGradingRules.requiredOrigins(provider))`——供應商 host（NVIDIA）＋ PDF 權限（所有供應商都要）一次請求完——再寫 `aiConfig`（Gemini 不存隱藏的 base URL）。字串自帶三語，`applyUILanguage` 末尾呼叫 `DueAiSettings.applyLanguage`
- **訊息**：`AI_GET_STATUS`／`AI_TEST_CONNECTION`／`AI_RUN_NOW`／`AI_RESET_ANALYSIS`（dashboard → bg）、`GRADING_WEIGHTS_UPDATED`（bg → dashboard）
- 逐作業 AI 分析（A）仍為移除狀態，不在此功能範圍

> 註：舊版（1.5.0）的 `aiProvider`／`aiApiKey`／`syllabusAnalysis` 等 key 不復用、不讀取；殘留無害。

### popup.html / popup.js

- 7 天待辦快速預覽：顯示所有 7 天內到期的未繳作業清單
- 每筆任務顯示：緊急程度色點、作業名稱、**課程名稱**（支援自訂名稱）、剩餘時間
- 置頂「已逾期」區（30 天窗內逾期未繳；緊急度色階與 dashboard 統一，皆走 `taskRules.urgency`）
- 每筆可勾完成（1.5 秒撤銷窗口，寫入 `manualDone`／`manualUndone`，與 dashboard 同步）
- 支援 UI 語言（跟隨 Dashboard 設定）
- 開啟 Dashboard 按鈕；顯示上次同步時間

> 註：popup 的完成勾選、置頂逾期區與統一色階由並行工作完成；上述為行為說明。

### Dashboard（index.html + dashboard.js）

**整體佈局：**

```
sidebar（300px）+ main-content（flex:1）
│                      │
│  品牌標題             │  .page-tabs（頁面標題 + 返回鍵 + 新增作業）
│  主導航 .side-nav     │  #main-section（目前頁面）
│   學期待辦/課程/已繳交 │  #course-detail-container（課程詳情）
│  課程導航列 課程導航列  │
│  同步/設定            │
```

> 主導航（`.side-nav`）：`學期待辦`／`課程` 為兩個頁面（互斥 active，切換帶水平 slide），`已繳交` 為過濾切換（`showSubmitted`，開啟時獨立高亮）。三者右側各顯示數量（待辦數／課程數／已完成數）。active 狀態、數量與頂部 `#page-title` 由 `updateSideNav()` 統一更新；在課程詳情頁點 `學期待辦`／`課程` 會先退出詳情再切換（見 `goToPage()`）。頂部 `.page-tabs` 只保留頁面標題（詳情模式下由 CSS 隱藏，改顯示返回鍵）與「新增作業」。
>
> **已繳交固定用各課程 grid 版面**：`render()` 選版面的條件為 `currentPage === 'week' && !showSubmitted` 才走週待辦（圓餅圖）版面，否則一律 `renderCardGrid()`。因此不論從「學期待辦」或「課程」頁開啟已繳交，都顯示各課程 grid；關閉後回到原本所在頁面。

**學期待辦頁（Week）：**
- 左側「本週概覽」面板（頂部對齊，`.week-left`）：
  - **進度環**（`.wk-ring`，conic-gradient 綠色弧）：本週完成度 `nearDone/nearTotal`；範圍＝逾期窗 ∪ 未來 7 天（`isNear`），分母含已完成項，現算；中央顯示 `X/Y` + 「本週完成」，`role="img"` + aria-label
  - **分級摘要**（`.wk-breakdown` / `.wk-sum-row`）：逾期/7天內/8-30天/30天以上 的未完成數，色碼（逾期紅底凸顯），只顯示 count>0；每列為 `<button>`，點擊/Enter/Space 捲動右側清單到對應區塊（`data-scroll-group` ↔ `.week-group[data-group]`，手動算位移用 `scrollTo` smooth）
  - （舊 conic 圓餅 `.week-pie`/`.week-legend` 已移除）
- 右側：2 欄 task cards，依緊急度分區塊顯示（`.week-group[data-group]`）；分組委派 `taskRules.urgency`
- **置頂「已逾期 (N)」區**（紅橘 `color-overdue`）：只收 30 天窗內逾期未繳（`taskRules.isWithinOverdueWindow`），排序最近錯過的在最上；窗外逾期不進待辦（只在課程詳情可見），側欄待辦數（`updateSideNav` weekCount）＝未來三組＋窗內逾期，與列表一致
- 每張週卡片右上角有完成勾選圈（含逾期卡）：勾選走 1.5 秒撤銷窗口＋碎點爆（`beginCompleteWeek`／`cancelCompleteWeek`／`finishCompleteWeek`，與課程詳情列共用 `COMPLETE_*` 常數與 `spawnBurstDots`），窗口內點卡片任意處可取消
- 點擊 task card（非勾選圈、非撤銷窗口）→ View Transitions API morph 展開對應課程詳情

**課程頁（Courses）：**
- 3 欄課程卡片 grid，依最近截止日期排序
- 每張卡片顯示：課程代碼、**課程名稱**、緊急件數 badge、最多 3 筆作業（含分頁）
- 課程卡片點擊 → View Transitions API morph 動畫展開為詳情頁

**課程詳情頁（Course Detail）：**
- 上半：課程代碼、名稱（含鉛筆圖示可 inline 重命名）、緊急 badge
- 左下：評分比重圓餅圖 + 圖例；資料來源優先序：手動輸入權重（`customWeights`）→ Canvas 分組權重（`group_weight`）→ 皆無則顯示「無評分資訊」
- 右下：成績計算器（accordion）+ 作業清單
  - 成績計算器：輸入分數即時計算加權總分；**Canvas 已評分自動預填**（可改可清；清空會記住 → `scores[id]=null`），詳見下方「成績計算器」
  - 作業列表：點擊行展開描述，點擊作業名稱文字開新分頁跳轉 Canvas
  - 作業列最左有完成勾選圈（見下方「完成標記」）
  - 清單底部「已自動隱藏 N 項（考試・簽到）」稽核入口（`renderHiddenItemsSection`）：點開展開精簡列（作業名可跳 Canvas＋分組名＋due 標籤，考試顯 `due-exam` 紫），整列淡化、**不顯示任何分數**；預設收合、開合不持久化
  - **拖曳升級／降級隱藏項**（`manualShown`，見 spec 2026-07-22）：稽核列可拖進作業清單「升級」為一般可操作作業（可勾/可點；考試仍紫），升級後在清單中亦可拖回稽核區「降級」。升級為逐項手動覆蓋，**視同一般作業出現在所有視圖**（學期待辦進度環/分級/計數、課程 grid、popup）。判定：`isHideable(a) && !isManuallyShown(a)` 才隱藏；此規則同時套用於 `applyFilters`、`updateSideNav` 計數、`renderWeekSection` 進度環 nearItems、popup `getTasks`。稽核區只要該課「原本有」考試/簽到即恆存在（作降級放置目標）。拖曳為 **Pointer Events 自繪引擎**（`setupHideablePromoteDrag`／`trackDragFrom`；原生 HTML5 DnD 啟動層在部分環境不觸發已棄用）：名稱正後方的 grip 為唯一拖曳起點（4px 閾值內視為點擊），拿起後浮動 clone（`.drag-clone` 陰影＋微傾）跟隨游標；懸停清單時插入點以下列讓位（`.drag-shift` × `--drag-gap`，含 `.assignment-desc`），實際落點依 due 排序、放開後 clone 飛入真實位置並 `drag-arrived` 閃示；Esc／界外放開飛回原位；邊緣自動捲動；drop 目標 `.drop-active`／`.drop-hover` ＋ `data-drophint` 提示；重繪前 `abortActiveDrag()` 防孤兒 clone

**成績計算器（Canvas 預填 + 三態）：**
- 日常視圖（學期待辦／課程 grid／作業列／稽核列）一律**不顯示分數**（決策 3）；分數只出現在成績計算器
- `scores[id]` 三態：無此 key → 有 Canvas `submission.score` 就預填、否則空；值為數字 → 顯示該數字；值為 `null` → 使用者清空過 → 顯示空
- `recalculateGrades(courseId, { persist })`：開詳情主動算一次傳 `persist:false`（只算顯示、**不把預填值固化成手動值**）；使用者輸入的 `input` 事件走 `persist:true`。顯示與計算一律從輸入框現值讀（`Number.isFinite` 才計入），預填與手動輸入一致
- persist 規則：欄位空且該作業有 Canvas 分數 → `scores[id]=null`（記住清空）；空且無 Canvas 分數 → 刪除 key；有值 → 存數字

**課程自訂名稱：**
- 課程詳情頁的課程名稱旁有鉛筆圖示（hover 顯示）
- 點擊鉛筆 → inline 輸入框，Enter 儲存、Escape 取消
- 自訂名稱儲存在 `chrome.storage.local.courseNames`，不影響 Canvas API 資料
- 自訂名稱同步顯示於：sidebar 導航、週待辦卡片、課程 grid 卡片、popup

**完成標記（手動，雙向）：**
- 每個作業列最左有一個勾選圈，所有作業皆可雙向切換完成/未完成，獨立於 Canvas 繳交狀態
- 判斷公式 `isDone = (isExternallyDone && !manualUndone[id]) || manualDone[id]`，單一真相來源在 `dashboard/completion.js`（含單元測試）；`isExternallyDone = Canvas 已繳 ∨ 考試已結束`（`taskRules.isExamConcluded`：考試 due 一過即不可再行動，與已繳歸同一完成桶，不進待辦/逾期——還沒考的考試才進未完成，見 spec 2026-07-22）
- 外部完成（已繳或考試已結束）者翻轉 `manualUndone` 覆蓋——標回未完成會回到待辦清單（popup 同步），「已繳交」badge 仍顯示 Canvas 事實；再點一次移除覆蓋、回歸外部事實判定；其餘翻轉 `manualDone`。勾選圈路由屬性為 `data-ext-done`
- 待辦視圖勾選完成 → 維持原尺寸 1.5 秒（底部橘色撤銷倒數條，due 文字換成「↩ 撤銷」），期間點該列/卡片可取消；時間到「碎點爆」後移除、清單收合。**課程詳情列與學期待辦週卡片皆支援**（`beginComplete*`／`cancelComplete*`／`finishComplete*` 兩套平行版，共用 `COMPLETE_DELAY_MS`／`COMPLETE_BURST_MS`／`spawnBurstDots`；`toggleCompletion`／`revertCompletion` 為兩邊共用的寫入/還原）
- 重繪/切頁前一律 `clearCompleteTimers()` 清掉殘留計時器（兩視圖共用同一組 `_completeTimers`），避免幽靈 callback
- 兩個 map 同步皆不覆蓋；髒資料兩者同時存在時 `manualDone` 勝出（見 docs/superpowers/specs/2026-07-21-bidirectional-completion-toggle-design.md）

**多語言支援（i18n）：**
- 支援：繁體中文（預設）、简体中文、English
- `I18N` 物件涵蓋 70+ 個 key，透過 `tr(key)` 函式取值
- 語言偏好儲存在 `chrome.storage.local.uiLanguage`
- 切換語言後，`formatDue()`、`formatLastSync()` 等函式也會隨語言調整顯示格式

**全域篩選邏輯（`applyFilters`）：**
- 預設排除簽到/出勤/參與類與考試/測驗類；考試/簽到判定已移至 `taskRules.js`（`isExam`／`isAttendance` 單一真相來源，含測試，popup 共用）。`dashboard.js` 的 `isExam`／`isAttendance` 僅為委派包裝；`isHideable = isExam || isAttendance`
- **例外：`manualShown` 升級**——使用者拖曳升級的隱藏項（`isManuallyShown`）視同一般作業放行，出現在所有視圖（見上方課程詳情「拖曳升級／降級」）
- 被隱藏（未升級）的項目可在該課程詳情底部「已自動隱藏 N 項」稽核清單展開檢視、並由此拖曳升級
- 已無「作業／考試／全部」類型篩選 UI（篩選 pills 已拆除）
- 按完成狀態篩選：預設隱藏已完成；「查看已繳交」切換後只顯示已完成（Canvas 已繳 + 手動標記完成，見 completion.js 的 isDone）

**頁面切換動畫：**
- 學期待辦 ↔ 課程：水平 slide（`.page-slider` translateX，470ms）
- 課程卡片 ↔ 詳情：View Transitions API morph（0.28s，命名元素：`course-shell`、`course-code`、`course-name`、`course-badge`、`course-meta`）
- Sidebar 在 morph 期間靜止（`view-transition-name: sidebar`，`animation: none`）
- **注意**：若課程名稱 `div.detail-name` 內有 inline 元素（如鉛筆按鈕），需確保按鈕為 `position: absolute`（不影響 layout box），否則 View Transition 捕捉到不同高度會產生動畫跳動

**瀏覽器上一頁整合（History API）：**
- SPA 導航接上瀏覽器歷史，系統慣用的返回（Back 手勢／按鈕／Cmd+[／Alt+←）可退出課程詳情回到清單
- 模型：清單（週待辦／課程 grid，含 `showSubmitted` 過濾）永遠是**同一個** history entry——橫向切換（`switchPage`／`goToPage`／已繳交切換）用 `replaceState`（`syncHistory()`）更新它、不疊返回步；**開課程詳情**才 `pushState` 疊一步（詳情內換課用 `replaceState` swap，Back 仍直接回清單）
- `_appLocation()` 為 entry 狀態 `{app:'due', page, showSubmitted, view, courseId}`；`popstate` 依目標 state 還原畫面，期間 `_suppressHistory=true` 擋掉再寫 history
- `← 返回` 按鈕與瀏覽器返回統一走 `history.back()` → `popstate`；`showGridView()` 現依 `currentPage`/`showSubmitted` 回對應清單（不再寫死回 courses grid，順帶修正「從週待辦開課程、Back 卻回課程頁」）
- 動導航函式（`showCourseDetail`/`showGridView`/`switchPage`/`goToPage`）時務必同步維護對應的 push/replace，否則返回行為會錯亂

**新手教學（Welcome Modal，5 頁）：**
- 首次安裝自動開啟（`?welcome=1`），設定選單「使用教學」可重開；換頁為 translateX 滑動（track 500%、每步 20%，`welcomeGoStep` 位移 `(n-1)*20%`，完成頁按鈕判斷 `n===5`）
- 頁面：1 歡迎（右側為 HTML/CSS 迷你「本週概覽」mock——SVG stroke 進度環＋分級摘要列；mock 文案硬編碼中文、不走 i18n）→ 2 登入 Canvas → 3 釘選（`icons/pin_guide.png`，圖中圖示為 DUE 商標）→ 4 拖曳整理（隱藏/還原教學；右側 inline SVG 示意圖：課程大卡片內含 header、作業清單、浮起拖曳列、已隱藏區與隱藏/還原雙向箭頭）→ 5 一切就緒
- **登入 Canvas 自動跳回**（spec 2026-07-23-onboarding-redesign）：點連結（`canvasBaseUrl` 為空時 fallback `https://hkust-gz.instructure.com`）開分頁後「武裝」10 分鐘——`storage.onChanged` 只看 `lastSync` 落地（未登入時 API 401、lastSync 不動，不會過早跳回）→ `loadData()` 刷新、關閉開出的分頁、聚焦回 dashboard、連結旁顯示「✓ 已同步」；輔以 `tabs.onUpdated` 在 Canvas 分頁載入完成時補發手動 SYNC（繞過 5 分鐘節流）。chrome.* 呼叫皆守衛（dev harness 只 stub 部分 API）
- canvas link 用**事件委派**綁在 overlay 上（`applyWelcomeTranslations` 以 innerHTML 重建該連結，直接綁定會失效）
- i18n keys：`wTitle1-5`／`wBody1-5`／`wStep2Li*`／`wStep4Li*`／`wDone1-3`／`wCanvasSynced`，三語言齊備

---

## 資料儲存

見上方「技術規格 → 資料儲存」的 `chrome.storage.local` 格式。
（1.5.0 時代的 AI key：`analysis`、`syllabusAnalysis`、`milestoneChecks`、`aiModel`、`aiProvider`、`aiApiKey`、`geminiApiKey`、`geminiModel`、`claudeApiKey` 已不再讀寫；2.1.0 起改用 `aiConfig`／`gradingAnalysis`。舊資料殘留無害，不主動清除。）

---

## 開發注意事項

1. 每次修改 `extension/` 下的檔案後，需要在 `chrome://extensions` 重新載入擴充功能才會生效
2. `background.js` 是 Service Worker，不能用 `window` 或 `document`（有需要的話用 regex 代替 DOM 操作）
3. Canvas API 回傳的日期格式是 ISO 8601（`2026-03-15T23:59:59Z`）；使用 `formatDue()` 轉換顯示
4. 有些作業沒有截止日期（`due_at` 為 null），`urgencyClass` 和 `formatDue` 都已處理
5. View Transitions API 是 Chrome 111+ 的功能，`showCourseDetail` 有 fallback 處理
6. `_currentData` 是全域快取；頁面切換時用 `_currentData` 同步渲染，不要再呼叫 `loadData()`（避免空白閃爍）
7. `courseNames` 只影響顯示層，Canvas API 呼叫仍使用原始 `course.id`，不受自訂名稱影響
8. `field-sizing: content`（Chrome 123+）用於 inline 重命名輸入框自動縮放
9. 完成標記動畫：勾選後不立即重繪，該列跑 1.5 秒撤銷窗口＋碎點爆才移除（`COMPLETE_DELAY_MS = 1500`）；`dashboard.js` 唯一的 `storage.onChanged` 監聽器只在「登入 Canvas 自動跳回」武裝期間反應 `lastSync`（不碰 `manualDone` 等 key），故寫入 `manualDone` 不會打斷動畫（見 `completion.js`）
10. AI 分析結果寫入 `customWeights` 後由 background 送 `GRADING_WEIGHTS_UPDATED` 訊息刷新 `_currentData`，**不**走 `storage.onChanged`（第 9 條的限制不變）；監聽器只在「正開著該課詳情且無拖曳／完成動畫」時重繪。AI 邏輯一律放 `extension/ai/`，`dashboard.js` 只保留五個接點（選單 click、`applyUILanguage` 一行、Esc closers、a11y 陣列、訊息監聽）

---

## 待開發功能

- 成績計算器顯示優化（目前 accordion 折疊）
- 多學期 / 歸檔課程過濾

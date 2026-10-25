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
    ├── _locales/{en,zh_TW,zh_CN}/messages.json ← 只放擴充功能名稱與摘要（extName／extDescription），商店名稱與摘要也來自這裡；介面字串仍在各頁的 I18N
    ├── background.js              ← Service worker：Canvas API 同步 + Claude 用量；importScripts 載入 ai/ 三檔
    ├── background.test.js         ← background.js 測試（vm 載入 + stub chrome/fetch）
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
        ├── taskRules.js           ← 共用規則：考試/簽到判定（結構規則優先＋名稱備援）、緊急度色階、逾期窗（含測試，popup 共用）
        ├── completion.js          ← 完成標記單一真相來源：isDone / setDone（勾選寫入入口）/ toggleManualDone（含測試）
        ├── customAssignments.js   ← 自訂作業建立與合併、modal 草稿 key（含測試）
        ├── gradeCalc.js           ← 成績計算純規則：權重來源、自訂權重的作業歸類、加權分數（含測試；計算器與學期成績總覽共用）
        └── descSanitizer.js       ← 作業描述 HTML 白名單 sanitize（含測試）
```

---

## 技術規格

### Chrome 擴充功能

- **Manifest Version**：3（必須用 V3）
- **名稱與摘要在地化**：`name`／`description` 是 `__MSG_extName__`／`__MSG_extDescription__`，`default_locale: "en"`；改名稱或商店摘要就改三份 `_locales/*/messages.json`（名稱上限 75、摘要上限 132 字元），要發新版本才會到商店。商店的詳細說明與素材文案在 `docs/store-listing.md`
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

GET /api/v1/courses/:id/assignment_groups?include[]=group_weight
→ 拿評分比重分組（不帶 include[]=assignments：那會把整包作業含描述再存一份，QA P2-7；
  作業屬於哪一組改看作業本身的 assignment_group_id，見 dashboard 的 findGroup）

GET /api/v1/users/self
→ 偵測到新的 Canvas 網址、以及 SET_CANVAS_BASE 切換前確認已登入（200 JSON 且有 id 才算；回應可能帶 while(1); 前綴）

GET /api/v1/accounts/self、/api/v1/accounts/:account_id
→ 學校名稱（學生身分幾乎必回 401；同一網址已有非通用校名就沿用 schoolName，不再打）
```

注意：Canvas API 有分頁，需要處理 `Link` header 的 `rel="next"`。限流（403 內文含 Rate Limit，或 429）等 2 秒重試一次（`fetchAllPages`）。

### 資料儲存

用 `chrome.storage.local` 存所有資料，格式如下：

```json
{
  "lastSync": "2026-03-06T10:00:00Z",
  "canvasBaseUrl": "https://hkust-gz.instructure.com",
  "schoolName": "HKUST(GZ)",
  "schoolNameBase": "https://hkust-gz.instructure.com",
  "canvasBaseCandidate": { "origin": "https://other.instructure.com", "at": "..." },
  "ignoredCanvasOrigins": ["https://other.instructure.com"],
  "courses": [...],
  "assignments": { "courseId": [...] },
  "assignmentGroups": { "courseId": [...] },
  "customAssignments": { "courseId": [{ "id": "custom-assignment-…", "_isCustom": true, "name": "...", "due_at": "...", "description": "純文字" }] },
  "scores": { "assignmentId": 85.5 },
  "manualDone": { "assignmentId": true },
  "manualUndone": { "assignmentId": true },
  "manualShown": { "assignmentId": true },
  "manualHidden": { "assignmentId": true },
  "customWeights": { "courseId": [{ "name": "Homework", "weight": 30 }] },
  "gradeItemMap": { "courseId": { "assignmentId": "Homework | null" } },
  "courseNames": { "courseId": "自訂名稱" },
  "uiLanguage": "zh-TW",
  "showClaudeUsageInPopup": true,
  "claudeOrgId": "...",
  "claudeUsage": { "usedPercent": 0, "resetAt": "..." },
  "aiConfig": { "provider": "gemini | qwen | deepseek | nvidia", "apiKey": "…", "model": "", "baseUrl": "", "consentedAt": "…" },
  "gradingAnalysis": { "courseId": { "status": "done", "attempts": 1, "at": "…", "source": "syllabus_pdf", "provider": "gemini", "model": "gemini-2.5-flash", "components": [], "materialHash": "…" } }
}
```

`canvasBaseUrl`／`schoolName*`／`courses`／`assignments`／`assignmentGroups`／`lastSync` 只由 background 寫入：成功同步時同一次 `set`（`schoolNameBase`＝`schoolName` 屬於哪個網址，`fetchSchoolName` 的快取鍵）；唯一例外是首次偵測採用新網址時（`checkOtherCanvasOrigin`）在同步之外單獨寫 `canvasBaseUrl`；`canvasBaseCandidate`／`ignoredCanvasOrigins` 見下方 background.js「Canvas 網址偵測」。

**寫入規則（多 context 共用）**：`manualDone`／`manualUndone`／`manualShown`／`manualHidden`／`scores`／`courseNames`／`customAssignments`／`customWeights` 會被 popup 與多個 dashboard 分頁同時寫，**一律 read-modify-write**：讀 storage 最新值 → 只套用這次修改（單一 id／單一課）→ 寫回，不可拿頁面快照整包覆寫。dashboard 走 `updateShared(keys, mutate, {optimistic, done})`（先樂觀更新 `_currentData`，再排進本頁寫入佇列以 storage 最新值重套；`mutate` 必須是冪等的「目標狀態」寫法）；popup 走 `writeDone(assignment, done)`。跨 context 同毫秒競寫理論上仍可能（無鎖），窗口只剩一次 get→set。

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
- 動畫克制：時長／曲線一律取 `:root` 動效 token（見下方「動效規範」），不在呼叫端手寫；卡片 hover 上浮 `translate: 0 var(--lift)`（-2px，`--spring-highlight`），課程卡 ↔ 詳情轉場用 View Transitions API

### 截止日期顏色規則

色階統一由 `taskRules.urgency(dueAt)` 決定；`dashboard/urgencyClass()` 只做映射（popup 共用同一規則）。

- 逾期未繳（30 天窗內）：紅橘 `var(--overdue)`（`#b3452c`，class: `due-overdue`）
- ≤7 天：橘紅 `var(--orange)`（class: `due-urgent`）
- 8–30 天：暖黃 `var(--warm)`（class: `due-soon`）
- 30 天以上：藍色 `var(--blue)`（class: `due-later`）
- 已過期（30 天窗外的舊逾期）：灰色淡化 `var(--mid)`（class: `due-past`；窗外項目只在課程詳情可見）
- 考試類：紫色 `var(--purple)`（class: `due-exam`；日常視圖不顯示考試，此色目前用於課程詳情「已隱藏」區的考試列，以及拖曳升級回作業清單的考試列）
- 無截止日期／已完成：class: `due-none`
- **已完成且時間已過 → 不顯示任何時間標籤**（`dueLabelFor`；「已完成」區／已隱藏列適用——過去的事無需再標「逾X天」）；緊急件數（詳情 header／grid 卡 badge）一律排除已完成
- 時間標籤括號內不留空格：`8月4日（2天後）`、`7月2日（逾20天）`（`daysLater`／`overdueDaysLabel` 為 `{n}` 模板，與 popup 一致）；括號樣式由 `dueWithRel` 模板決定——中文全形 `{date}（{rel}）`、英文半形 `{date} ({rel})`（`Oct 23 (1 day left)`）。英文單複數走 `daysLaterOne`／`daysLater`（`daysLaterText`），當天的小時標籤走 `hoursLater`（簡中 `h后`）；門檻與單位不變

### 動效規範（2026-10-23 動效審查）

來源：`docs/motion-review-2026-10-22.md`（52 條，依 Animate UI skill 規則）＋實作 spec `docs/superpowers/specs/2026-10-23-motion-review-implementation-design.md`。除 #16（卡片↔詳情 morph 的文字拉扯）外全做；#7 只做作業描述；#21 重新設計；N1（語言子選單點擊開關）、N2（modal 不吃背景點擊＋草稿）為新增。

- **Token（#39）**：`index.html`／`popup.html` 的 `:root` 定義 `--ease-*`（color／out／soft／in-out／ring／draw／away）、`--t-*`（color 200、fade 200、swap 150、reveal 300、menu 220、disclosure 350、check 300、overlay 400、dialog-fade 400、dismiss 200 ms）、`--spring-press`／`--spring-highlight`／`--reflow`／`--spring-selection`／`--spring-dialog`（spring 轉好的 CSS `linear()`）、`--ring`／`--ring-tick`（進度環，使用者拍板的 0.8s `cubic-bezier(0.16,1,0.3,1)`，只命名不改值）、`--lift`（-2px）、`--scale-press` 0.97／`--scale-choice` 0.985／`--scale-menu` 0.9（popup 只帶用得到的子集，同名同值）。`dashboard.js` 的 `MOTION` 是 JS 鏡像（每個 token 為 `{duration, easing}`，WAAPI 直接當 options；`cssTransition(prop, token)` 產 inline transition 字串；setTimeout 讀 `.duration`）——**改一邊要改另一邊**，呼叫端不另寫時長
- **減少動態**：JS 一律問 `reduceMotion()`（每次即時讀 media query，系統設定中途切換也跟得上）；CSS 在 `index.html` 檔尾一個 `prefers-reduced-motion` 區塊。詳見下方 Dashboard「減少動態效果」
- **觸發 transition 不用 rAF**：要「先套起點再過渡」時用 forced reflow（`el.getBoundingClientRect()`）提交起點——背景分頁的 rAF 會暫停
- **hover 一律包在 `@media (hover: hover) and (pointer: fine)`**（#11）：觸控時不會黏住上浮／halo／握把；改名鉛筆在 `:focus-visible` 時也出現，握把在該列有鍵盤焦點（`:has(:focus-visible)`）時亮起，沒有精細指標的裝置兩者靜止時就顯示
- **焦點框不過渡**（#26）：不用 `transition: all`；`outline` 不列進任何 transition（聚焦那一幀就完整）；輸入框的 focus 邊框第一幀到位。週卡、popup 勾選圈的捲動容器留出焦點框空間（#4）
- **按壓回饋（#24）**：`:active` → 按鈕 `scale: var(--scale-press)`、整張卡片／整列 `var(--scale-choice)`，都走 `--spring-press`；用獨立的 `scale` 屬性（不蓋掉 hover 的 `translate`、鉛筆的 `translateY(-50%)`、FLIP／出場層的 WAAPI transform）。勾選圈（用填色回應）、拖曳握把（grabbing 游標）、設定選單項目（highlight）不縮；卡片／列用 `:has()` 擋掉「按的是裡面的按鈕卻整張一起縮」（含觸控 tap 時剛變 disabled 的分頁鈕）；鍵盤 Enter／Space 走 click() 不觸發 `:active`。減少動態：兩個 scale token 為 1
- **hover（#25／#37）**：課程卡與週卡同一組 card recipe——框與陰影走 `--t-color`，上浮 `translate` 走 `--spring-highlight`（滑鼠離開立即 retarget）；週卡 `cursor: pointer`，離場中（`.bursting`）不上浮。作業列的 hover 底色畫在不影響版面的 `::before`（拖曳、離場、落點閃示期間關掉）；確認框按鈕、已隱藏區短註、新增作業 ✕／取消／儲存、權重 ✕、成績計算器標題、教學圓點都有 hover 過渡。完成的卡／列進出場層前由 `freezeHoverLook()` 把當下的 hover 樣子釘成 inline，離場第一幀不會切回靜止樣式
- **螢幕閱讀器播報（#3）**：`index.html` 常駐 `#a11y-status`（`role=status`、`aria-live=polite`）＋`announce(text)`：先清空、50ms 後寫入（同一句連播也會重念；短時間連續呼叫只念最後一句）。只用動效呈現的結果——完成、撤銷、全部完成、同步結果、拖曳升降級——都要經它念出（i18n `a11y*` key，三語）

---

## 已實作功能

### background.js

- 監聽 `webNavigation.onCompleted`（filter `{ hostSuffix: '.instructure.com' }`、只看 `frameId === 0`）— 使用者造訪 Canvas 時偵測網址並自動同步：同一網址 5 分鐘節流（記憶體 `_lastAutoSyncAt`，每次成功同步更新；SW 重啟由 storage 的 `lastSync` 回填）；從未同步過（`_lastAutoSyncAt` 為 0）或首次採用新網址立即同步；手動 `SYNC` 不受節流限制
- 響應訊息：
  - `SYNC` → `{ success:true, failedCourses:[{id,name,error}] }`／`{ success:false, error }`
  - `AUTO_SYNC`（popup 與 Dashboard 每次打開送，不等同步結束）→ 與造訪 Canvas 同一套 5 分鐘節流（`autoSyncDue`）：`{ started:true }`（背景 `runAutoSync`）／`{ started:false, reason:'throttled'|'no-base' }`（`no-base`＝還沒有學校網址）。Dashboard 帶 `refreshSession:true` → 走 `autoSyncWithSessionRefresh`（見下方「登入補救」）
  - `GET_STATUS` → `{ lastSync, courseCount }`
  - `SET_CANVAS_BASE {origin}`（候選提示「切換到這裡」）→ 成功 `{ success:true, failedCourses }`；失敗 `{ success:false, reason, error }`（網址、資料、候選都不動）：`reason:'not-logged-in'`＝`users/self` 未通過（未登入該校）；其餘一律 `'sync-failed'`（非 Canvas 網址、課程清單 4xx/5xx／網路錯誤、新校資料寫入失敗、切換途中網址被換掉／storage 被清掉）。dashboard 依 reason 選失敗說明
  - `IGNORE_CANVAS_BASE {origin}`（「忽略」）→ `{ success:true }`／storage 寫入失敗 `{ success:false, error }`：origin 加進 `ignoredCanvasOrigins`，候選是它就清掉（dashboard 送出即收起提示、不看回應）
  - `SYNC_CLAUDE_USAGE` → `{ success:true, usage }`（`usage` 為 `{usedPercent, resetAt, lastSync}`，或請求成功但目前沒有 5 小時用量窗時為 `null`）／`{ success:false, reason:'no-tab'|'request-failed'|'script-failed', error }`
  - `CLAUDE_ORG_ID_LEARNED`／`CLAUDE_USAGE_INTERCEPTED`：content script 被動回報，只寫 storage、不回應
- **Canvas 網址偵測（QA P1-9）**：`isCanvasHost` 只認 `https://*.instructure.com`，排除 `www`／`status`／`community`／`support`／`info` 子網域與任何含 `beta`／`test` 標籤的環境。造訪的 origin 不等於 `BASE_URL` 時走 `handleOtherCanvasOrigin` → `checkOtherCanvasOrigin`：
  - `ignoredCanvasOrigins` 內的 origin → **一律不理**（不驗、不採用、不記候選，不論有沒有已確認的學校）
  - **已確認的學校**＝`BASE_URL` 是 Canvas host **且 storage 有 `lastSync`**（`runSync` 成功時與 `canvasBaseUrl` 同一次寫入）；**不看課程數**——放假沒有進行中課程的學校也不能被默默換掉
  - 沒有已確認的學校（首次偵測；含舊版被改成 `www` 的網址）→ `GET /api/v1/users/self` 確認已登入（200 JSON 有 `id`，容許 `while(1);` 前綴）才採用：寫 `canvasBaseUrl`、清候選、立即同步；未登入不動（登入後會再落到該 origin）
  - 有已確認的學校 → **不切換、不同步**，確認已登入後只寫 `canvasBaseCandidate {origin, at}`（已是目前候選的不重驗），由 dashboard 側欄提示讓使用者決定
  - 同一 origin 連續載入時合併進行中的檢查（`_originChecks`，只驗一次）；但檢查若以「未登入」收場、而途中又有新的載入（例如 SSO 登入後的落地頁）→ 不沿用那個可能是登入前發出的結果，**重驗一次**
- **`SET_CANVAS_BASE` 原子切換**（`setCanvasBase`）：先 `isLoggedInCanvas` 確認已登入該校（未登入直接失敗、不打課程 API）→ `syncBase(next, adopt=true)` 為新網址同步，**期間 `BASE_URL`／`canvasBaseUrl` 仍是舊校** → 同步完成、作廢檢查通過才把 `BASE_URL` 換成新網址，`canvasBaseUrl` 與新資料**同一次 `storage.set`** 寫入；**這次 `set` 失敗**（例如超過 `QUOTA_BYTES`，manifest 沒有 `unlimitedStorage`）→ `BASE_URL` 退回舊校再 throw（期間已被別處改掉，例如 storage 被清掉而歸零，就不動）。寫入成功後**重讀** storage 的 `canvasBaseCandidate`，`origin` 仍是新網址才清（同步途中可能又記下第三間學校的候選，不能用同步開始時的快照判斷）。任何一步失敗 → throw，舊網址／舊資料／候選全保留（使用者登入後可再按一次）；切換途中網址被換掉（storage 被清掉等）同樣 throw，不會回假成功。切換同步的單課失敗不沿用 storage 舊資料（那是舊校的、課程 id 可能撞號）
- 同步排程（`syncAll` → `syncBase(base, adopt)`）：**同一網址**的同步進行中 → 加入它（後到者拿同一個 promise 的真實結果，不會假成功；但切換請求只加入切換同步——同網址的一般同步可能因網址已變而作廢，加入會讓切換假成功）；進行中的是**另一個網址** → 不加入，等它結束後再跑（一般同步屆時重讀 `BASE_URL`，切換同步仍為指定網址）。`runSync(base)` 全程用開始時的 `base` 快照打 API；結尾寫入前 `BASE_URL` 必須仍是預期值（一般同步＝`base`；切換同步＝開始時的舊校網址），否則這批結果作廢不寫（首次偵測換了網址、storage 被清掉、別的切換先成功）
- `runSync()`：拉取所有課程的作業與評分分組（courses / assignments / assignmentGroups）；同時最多 4 門課（`SYNC_CONCURRENCY`），403 Rate Limit／429 等 2 秒**只重試一次**；**單課失敗沿用該課上次的資料**（不清成 `[]`），回應附 `failedCourses`；拉課程清單失敗則 throw
- SW 冷啟動：`BASE_URL`／`_lastAutoSyncAt` 由頂層 `_ready` promise 從 storage 回填（storage 出錯也一定 settle）。會讀它們的入口先等 `_ready`：webNavigation handler（`await _ready`）、`syncAll`（`_ready.then`）、`setCanvasBase`；`syncBase`／`runSync`／`checkOtherCanvasOrigin` 只經由這些入口呼叫（測試：`node extension/background.test.js`，以 vm 載入 background.js）
- 記憶體狀態跟著 storage 歸零（QA #152）：`storage.onChanged` 看到 `canvasBaseUrl` 被移除 → `BASE_URL=''`、`lastSync` 被移除 → `_lastAutoSyncAt=0`（例如在 chrome://extensions 清除擴充功能資料時 SW 仍活著也一樣；dashboard 原本的「清除本機資料」選單已於 2026-10-24 依 owner 決定移除，這段自我修復保留）；下次造訪 Canvas 走首次偵測（確認登入 → 採用並立即同步），清除當下進行中的同步因 `BASE_URL` 已變而丟棄不寫回。每次成功同步也把 `canvasBaseUrl` 跟 `lastSync` 一起寫入（storage 的網址遺失也會自我修復）
- **登入補救**（`autoSyncWithSessionRefresh`／`refreshCanvasSession`，2026-10-25）：同步本身不需要開 Canvas 分頁（SW 直接帶 cookie 打 API）；Dashboard 打開時的自動同步若失敗、且 `isLoggedInCanvas` 確認未登入（多半是重開瀏覽器後 Canvas session cookie 沒了）→ `tabs.create({ url: base, active:false })` 在背景開 Canvas 分頁讓學校 SSO 自動登入，`waitForCanvasTab` 等分頁停在 base 的非 `/login` 頁（上限 20 秒，SSO 自動放行時通常幾秒就回來）→ 確認已登入 → 立刻關分頁（`closeTabIfBackground`）→ 再 `syncAll`（同步不需要分頁，不留著它等）。仍未登入（SSO 要手動輸入）→ 關分頁並冷卻 30 分鐘不再開；使用者在這段期間切到那個分頁（`tab.active`）就不關。同時只跑一個（`_sessionRefresh`）；已登入卻同步失敗（網路、5xx）不開分頁；popup 的 `AUTO_SYNC` 不補救
- `fetchSchoolName(base, courses, prev)`：自動偵測學校名稱——**按網址快取**：`prev.schoolNameBase === base` 且已有非通用校名（不是 Canvas／Instructure）就沿用、不打 API（換校後快取自然失效、改查新校）；否則 `accounts/self` → 最多再查第一門課的 `account_id` → hostname 推算（學生身分查 accounts 幾乎必回 401，舊版每次同步打 N+1 個請求）
- `fetchClaudeUsageDirect()`：popup 的 Claude 用量 chip — 找開著的 `claude.ai` 分頁，借該分頁登入狀態讀 `/api/organizations/:id/usage`，**不呼叫任何 LLM**；結果存 `claudeUsage`。搭配注入 claude.ai 的 `claude_injected.js` / `claude_content.js`。抓不到一律 throw，`SYNC_CLAUDE_USAGE` 回 `{ success:false, reason:'no-tab'|'request-failed'|'script-failed', error }`；請求成功但目前沒有 5 小時用量窗回 `success:true, usage:null`（不算失敗）
- `importScripts('ai/vendor/pdf.worker.min.js', 'ai/vendor/pdf.min.js', 'ai/pdfText.js', 'ai/gradingRules.js', 'ai/providers.js', 'ai/analysisRunner.js')`（vendor 兩檔的順序不可調換）：AI 評分比重分析（見下節）；`runSync` 成功寫入 storage 後以**這場同步的網址**呼叫 `scheduleGradingAnalysis(base)`（不讀全域 `BASE_URL`；切換學校成功也走這裡；`setTimeout` 排程，不 await、不阻塞 SYNC 回應、不佔用同步排程）；`AI_*` 訊息轉交 `handleAiMessage`
- 啟動時 `chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })`：API key 只讓擴充功能自身頁面讀得到

### AI 評分比重分析（`extension/ai/`，spec `docs/superpowers/specs/2026-09-03-ai-grading-weights-restore-design.md`）

- **定位**：AI 只負責「產生課程權重」並寫進現有 `customWeights[courseId]`；圓餅圖／權重編輯器沿用同一套。前端只多兩處（2026-10-25，D2／D3）：圓餅圖例下一行來源小字（見課程詳情「左下」），以及權重編輯器清除鈕依情況換文字。沒填 API key 時分析完全沉默（唯一例外是下方「讓位」：收回 AI 自己寫過的權重，不送任何請求）
- **觸發**：每次同步完成後自動、序列、每輪最多實際分析 10 門（因材料沒變而跳過的課不佔名額）；全域鎖 `_aiAnalyzing`（進函式即同步設定）防疊跑，鎖住期間的觸發記成 `_aiRerunRequested`，這輪結束後補跑一輪（同步完成、儲存設定、「清除並重新分析」都不會被吃掉）；LLM 呼叫期間每 20 秒 `getPlatformInfo` keepalive 防 SW 回收；`AI_RESET_ANALYSIS` 遞增 `_aiResetEpoch`，進行中的分析發現 epoch 變了就不寫回
- **只跑一次**（`DueGradingRules.shouldAnalyze`）：只看目前是否已有權重——有手動權重／Canvas `group_weight` → 跳過，`record.status` 本身不擋。Canvas `group_weight` 只在課程開著「依組別加權」時才算：`apply_assignment_group_weights === false` 的殘留權重不算（與 dashboard `courseUsesGroupWeights` 一致，QA #93；`shouldAnalyze`／`courseStatus` 帶 `course`）。`customWeights[courseId]` 是空陣列視同沒有權重、照跑（owner 2026-10-24 決定維持 v2.1 行為）：權重編輯器全刪存檔時，該課沒有生效的 Canvas 權重就直接刪 key，下次同步 AI 會再寫回；有 Canvas 權重才存 `[]`，而那種課 AI 本來就跳過。`error` **沒有冷卻期、沒有次數上限**（2026-09-03 起），每次同步都會再試。`notFound` 改看**材料指紋**（D1，2026-10-25）：`DueGradingRules.materialFingerprint` 涵蓋分析規則版本 `ANALYSIS_RULES_VERSION`（改 prompt／解析／正規化／抽字上限就遞增，舊 notFound 自動重跑）、`syllabus_body`、課程 PDF 清單的 `id:size:updated_at:鎖定狀態`（上鎖模組的檔案沒有 url／`locked_for_user`，解鎖時只有這個會變）、供應商、模型、base URL、PDF 權限（抓不到的大綱／檔案清單記成 unavailable，與「空的」不同，之後抓到了指紋自然改變）；上次 `notFound` 且指紋相同（`isUnchangedNotFound`）→ 只花兩個 Canvas metadata 請求就跳過，不下載 PDF、不呼叫 LLM、不寫紀錄。這輪若因暫時性錯誤沒抓齊材料（`tryFetchPdf` 回 `{transient:true}`：斷網／5xx／429／401／Canvas 限流的 403〔內文含 Rate Limit〕；一般 403 與 404 是確定結果；AI 挑檔呼叫失敗；檔案 metadata 重抓遇網路／5xx／429／401／403，`isTransientFetchError`）就**不記指紋**，下次同步照跑。舊紀錄沒有指紋 → 照跑一次再記。成功（`done`）後權重會寫進 `customWeights`，之後自然被「已有權重」擋掉不再重跑；要重跑已 done 的課，在該課權重編輯器按清除鈕（沒有 Canvas 權重、已設定 key、且上次不是 notFound 時文字是「清除並重新分析」，寫入落地後送 `AI_RUN_NOW`，正在分析中就等這輪結束後補跑），不需要（也沒有）額外的「清除分析紀錄」按鈕——modal 裡的「分析狀態」現在只讀不寫，`AI_RESET_ANALYSIS` 訊息仍在 `handleAiMessage` 但已無任何呼叫端
- **讓位給 Canvas**（D2，`yieldAiWeightsToCanvas`，每輪開頭、在鎖內、不需要 key）：課程後來有了生效的 Canvas 權重（`hasCanvasWeights`，含依組別加權開關），而 `customWeights` 仍是 AI 寫的原樣（`isAiWeights`：與 done 紀錄的 components 名稱、數字逐項相同）→ 刪掉 `customWeights[cid]` 與 `gradingAnalysis[cid]`，圓餅改用 Canvas 權重、與成績計算器一致。使用者改過的權重不動
- **材料**（`analyzeCourse`，D4 兩階段，2026-10-25）：先拿 Canvas metadata 算指紋；第一階段只用 API `syllabus_body` 文字（`stripHtml`）＋ syllabus 內連結 PDF 問一次——`done` 或 `error` 就收（error 換材料也不會好）；`notFound` 或第一階段沒材料，才翻課程 PDF 檔案（強關鍵字 → AI 挑檔，這時才送檔名清單），有新 PDF 就連同第一階段材料再問一次，沒有就沿用第一階段的 notFound。AI 挑檔呼叫失敗且沒有第一階段結果 → 記 `error`（帶原因），不再謊稱「找不到大綱」。PDF 只要有 optional 權限就下載，**所有供應商都適用**（AI 挑檔亦然）——Gemini 送原始 bytes（`inlineData`，自帶 OCR），其餘供應商用 `ai/pdfText.js`（vendor pdf.js）抽字後送純文字 part，截斷至 `MAX_EXTRACTED_TEXT_CHARS`（30000）、短於 `MIN_SYLLABUS_TEXT_CHARS` 視同這個檔案沒材料（掃描／圖片型 PDF 仍只有 Gemini 讀得到，其餘落到 `notFound`）；`parts` 為空不呼叫 LLM。下載前先看 `Content-Length`／`Content-Type`，下載後 `%PDF-`／Content-Type 檢查，單檔 10MB、累計 12MB（base64 膨脹後仍低於 Gemini 20MB 請求上限），大綱內連結檔最多試 5 個
- **供應商**（`DueAiProviders`）：Gemini 原生（key 走 `x-goog-api-key` header；base URL 固定 Google，不吃使用者輸入）；Qwen／DeepSeek／NVIDIA NIM 走 OpenAI 相容 `/chat/completions`（純文字，可自訂 base URL，僅接受 `https://`）。**NVIDIA NIM 需要 host permission**：該端點完全不回 `Access-Control-Allow-*` header（實測連一般網頁來源也不回），純 fetch 必被瀏覽器擋掉，靠 `optional_host_permissions` 的 `https://integrate.api.nvidia.com/*` 讓 Chrome 略過 CORS；`PROVIDERS[].hostPermission` 為單一真相來源，`requiredOrigins()` 決定儲存時請求哪些 origin，未授權時 `callProvider` 直接丟 `NO_HOST_PERMISSION`（不送請求、不花額度），modal 顯示 `#ai-host-perm-hint`。只送供應商需要的 header。Gemini 2.5 的 thinking token 計入輸出上限，主分析 `maxTokens 8192`、挑檔／測試連線 512
- **回應**：`parseAnalysisResponse`（去 ``` 圍欄；解析失敗再取第一個 `{` 到最後一個 `}`）→ `normalizeWeights`（小數比例 ×100、同名合併、總和須在 [80,120] 且為有限數）→ `toCustomWeights`。寫入前重新讀 storage；若使用者已手動填權重則不覆蓋。寫入後送 `GRADING_WEIGHTS_UPDATED` 給 dashboard——dashboard 只用它刷新開著的 AI 設定 modal 狀態列；畫面重繪由常駐 `storage.onChanged` 處理（見開發注意事項 9、10）
- **設定 modal**（`dashboard/aiSettings.js`，設定選單「AI 分析設定」）：供應商／key／模型／base URL、測試連線、清除金鑰、分析狀態列（只讀，無操作按鈕）。「儲存」在 user gesture 內先 `chrome.permissions.request(DueGradingRules.requiredOrigins(provider))`——供應商 host（NVIDIA）＋ PDF 權限（所有供應商都要）一次請求完——再寫 `aiConfig`（Gemini 不存隱藏的 base URL；`consentedAt` 只在有填 key 時寫）。頂端同意文字（`consent`）照實說何時送（儲存當下＋之後每次同步）、送什麼（還沒有權重的課的大綱文字與 PDF，必要時含檔名清單）、送到哪一家（`{provider}` 隨表單供應商替換，`updateProviderUi`）、依該家條款處理（部分免費方案會拿去改進模型）、用使用者自己的額度（QA AI P0-2）。字串自帶三語，`applyUILanguage` 末尾呼叫 `DueAiSettings.applyLanguage`。與其他 modal 共用 QA 的 modal 機制：點背景關閉走 dashboard 的 `trackBackdropPress`／`isBackdropClick`（按下與放開都在背景才關）、列在 `MODAL_OVERLAY_IDS`（開著時 `isUiIdle` 為 false，自動更新等它關掉）、Esc 由 dashboard 全域 keydown 處理（排除 IME 組字）
- **訊息**：`AI_GET_STATUS`／`AI_TEST_CONNECTION`／`AI_RUN_NOW`／`AI_RESET_ANALYSIS`（dashboard → bg）、`GRADING_WEIGHTS_UPDATED`（bg → dashboard）。background 收到 `AI_*` 先等 `_ready`（SW 冷啟動時學校網址還沒讀回）再交給 `handleAiMessage`；它回 false 又沒回應時補回 `undefined` 關掉通道
- 逐作業 AI 分析（A）仍為移除狀態，不在此功能範圍

> 註：舊版（1.5.0）的 `aiProvider`／`aiApiKey`／`syllabusAnalysis` 等 key 不復用、不讀取；殘留無害。

### popup.html / popup.js

- 7 天待辦快速預覽：顯示所有 7 天內到期的未繳作業清單；超過 3 筆內部捲動，捲動區高度由 `fitTaskListHeight` 量到第 3 筆下緣（扣掉其下框線，底下已有 `.divider`），不露半列；渲染、字型載入完成、勾完成收合後都重量（列高因課名折行／分組小標題而不固定）。量的是「收合完成後」的版面（`measureTaskListFit` 用離屏複本、去掉 `.collapsing`，不碰真實清單以免中斷進行中的過渡）：收合開始時清單高度就沿 `--reflow` 與列同步變到終點（`fitTaskListHeight(true)`），收完時只有最後一筆收合的列重量一次——連勾兩筆不會先縮後撐、勾掉唯一逾期項不會一幀跳 50px
- **含自訂作業**（QA P1-7）：`popup.html` 載入 `dashboard/customAssignments.js`，`loadData` 以 `mergeAssignmentMaps` 合併 Canvas ∪ 自訂作業，規則與 dashboard 相同（掛在已不在 `courses` 的課上的自訂作業不列）；自訂作業沒有 Canvas 頁，點擊改開 Dashboard
- 隱藏規則同 dashboard：hideable＝`!_isCustom && (isExam || isAttendance)`（`taskRules.isHideable`），hideable 的看 `manualShown`、其餘看 `manualHidden`；自訂作業名稱含 Quiz/Midterm/簽到也照樣列
- 每筆任務顯示：緊急程度色點、作業名稱、**課程名稱**（支援自訂名稱）、剩餘時間
- 置頂「已逾期」區（30 天窗內逾期未繳；緊急度色階與 dashboard 統一，皆走 `taskRules.urgency`）
- 每筆可勾完成（1.5 秒撤銷窗口；與 dashboard 同一寫入入口 `DueCompletion.setDone`，經 `writeDone` read-modify-write——已繳但被標回未完成者勾完成是清掉 `manualUndone`，不是寫 `manualDone`）
  - 撤銷窗（`makeTaskItem` 內的 `enterUndo`／`cancelUndo`／`finalize`）：勾選圈填綠、勾號在填色後畫出（clip-path，`--t-check`，#46）；3px 倒數條 `.complete-countdown` absolute 疊在列內底部（列高 0px 變化，#23）；badge 的到期文字與「↩ 撤銷」兩個標籤疊在同一格、opacity＋blur 2px 交叉淡換，寬度先釘住再 150ms 滑到目標寬度（名稱截斷點不跳，#36）。窗口內點整列（含名稱）＝撤銷；鍵盤在同一顆勾選圈按 Enter／Space＝撤銷
  - 窗口結束（`finalize`）：撤銷窗立刻關閉（`leaving`，之後的點擊與按鍵不再改狀態，列設 inert，#14）→ 焦點交給下一列（沒有就上一列）的勾選圈，清單空了交給「開啟 Dashboard」（`handOffFocus`，#1）→ 10 顆碎點從勾選圈中心迸出（body 下的 fixed 圖層）→ 列與變空的組標題一起收合（淡出與高度用不同曲線，transitionend 移除，#35）；最後一筆收掉時空狀態淡入
  - 勾選圈 16px，另有隱形擴大熱區約 26px（差一點沒點中不會落到列上去開 Canvas，#22）
- **「今天到期」badge（#21 重新設計 C1，設計稿 `dev/flame-redesign/`）**：實心紅底 `--urgent: #c4381e`＋白字＋白色單色火焰，沒有漸層與光暈；火焰 `flame-hop` 1.1s ease-in-out infinite（往上竄→落下微壓扁，底部為原點）；減少動態時火焰停住
- 支援 UI 語言（跟隨 Dashboard 設定；`applyUILanguage` 同步設 `<html lang>`）
- Claude 用量 ↻ 失敗時，header 下方 `#claude-usage-note`（`role=status`）顯示 `claudeRefreshMissing`（reason `no-tab`）或 `claudeRefreshFailed`，4 秒後清空；舊用量保留
- ↻ 忙碌時圖示旋轉、`aria-disabled`（不用 disabled，焦點留在按鈕上）；手動重新整理成功時 chip 文字 blur 交換一次（#49）。**重新整理用量不重建任務清單**（不再 `loadData()`），進行中的撤銷窗不會被砍掉（#40）
- 打開 popup 只讀一次 storage（`POPUP_KEYS`）：語言、用量顯示設定與清單在同一個 callback 一起套上，不會先翻一次預設 UI（#51）；沒有進場動畫
- **打開 popup 就背景同步**（2026-10-25）：送 `AUTO_SYNC`（5 分鐘節流，見 background.js 訊息），使用者接著開 Dashboard 時資料已是新的；同步在 SW 裡跑，popup 關掉也會跑完。同步在 popup 還開著時落地（`lastSync` 變了）→ `refreshTaskListIfIdle` 只重畫清單；撤銷窗、收合、碎點進行中或焦點在清單裡（`isTaskListBusy`）就不動
- hover 只在 `(hover: hover) and (pointer: fine)` 下作用；頂部兩顆按鈕按下只縮放、hover 不上浮（#24）；減少動態：收合只淡出、沒有碎點、火焰停住、↻ 改脈動、按壓不縮放、badge 寬度直接到位
- 開啟 Dashboard 按鈕（同步狀態／上次同步時間目前不顯示——同步錯誤 UI 屬 QA P0-3，決策不做）

> 註：popup 的完成勾選、置頂逾期區與統一色階由並行工作完成；上述為行為說明。

### Dashboard（index.html + dashboard.js）

**整體佈局：**

```
sidebar（300px）+ main-content（flex:1）
│                      │
│  品牌標題             │  .page-tabs（頁面標題 + 返回鍵 + 新增作業）
│  主導航 .side-nav     │  #main-section（目前頁面）
│   學期待辦/課程/成績  │  #course-detail-container（課程詳情）
│  課程導航列 課程導航列  │
│  同步/設定            │
```

> 主導航（`.side-nav`）：`學期待辦`／`課程` 為兩個頁面（互斥 active，切換時新頁淡入，見「頁面切換動畫」），右側各顯示數量（待辦數／課程數）。第三顆 `成績`（`#nav-grades`，`aria-haspopup="dialog"`）不是頁面：開「學期成績」modal（見下方），不 active、沒有計數，沒有課程時與課程一起停用（`setNoCoursesMode`）。**沒有「已繳交」**：2026-10-25 起拿掉全域的已完成過濾（`showSubmitted`／`#nav-submitted`，spec 2026-10-25-drop-submitted-filter）——它會讓側欄課程徽章換意思、跟進課程詳情、把已隱藏區切成兩半。已完成的作業只在各課程詳情的「已完成」區看得到。active 狀態、數量與頂部 `#page-title` 由 `updateSideNav()` 統一更新；在課程詳情頁點 `學期待辦`／`課程` 會先退出詳情再切換（見 `goToPage()`）。頂部 `.page-tabs` 只保留頁面標題（詳情模式下由 CSS 隱藏，改顯示返回鍵）與「新增作業」。
>
> **滑動 indicator（#47）**：學期待辦／課程的 active 底色是同一塊 `#side-nav-indicator`（`updateSideNav` → `placeSideNavIndicator`／`placeIndicatorAt` 寫 `--y`／`--h`），換項時沿 `--spring-selection` 滑過去；沒有 active 項（課程詳情）→ `.is-off` 原地淡出、位置不動；恢復時先 `transition:none` 寫到新項位置、forced reflow 後才移除 `.is-off`——在新位置原地淡入，不從舊位置滑來。頁面載入（含 reload 還原課程頁／詳情）直接到位、項目本身的過渡先關掉，不會出現兩塊高亮。按下 active 項時 indicator 跟著縮（`--scale-choice`）。減少動態：直接跳
>
> **每個作業只在一個地方**：已隱藏 → 已完成 → 待辦，由上往下判斷。`applyFilters` 只回待辦（沒隱藏、沒落地完成），學期待辦、課程 grid、側欄課程徽章、側欄學期待辦計數都用它，沒有任何模式能改變這些數字。

**學期待辦頁（Week）：**
- 左側「本週概覽」面板（頂部對齊，`.week-left`）：
  - **進度環**（`.wk-ring`，SVG stroke 綠色弧）：近期完成度 `nearDone/nearTotal`；範圍＝逾期窗（30 天）∪ 未來 7 天（`isNearAssignment`），分母含已完成項，現算；中央顯示 `X/Y` + 「近期完成」（`weekDoneLabel`；不是「本週」——範圍含 30 天內的逾期，QA #14），`role="img"`，aria-label 與 title 寫出範圍（`weekRingScope`）
  - **分級摘要**（`.wk-breakdown` / `.wk-sum-row`）：逾期/7天內/8-30天/30天以上 的未完成數，色碼（逾期紅底凸顯），只顯示 count>0；每列為 `<button>`，點擊/Enter/Space 捲動右側清單到對應區塊（`data-scroll-group` ↔ `.week-group[data-group]`，手動算位移用 `scrollTo` smooth；減少動態時瞬間捲動），捲動的同時焦點移到目標組標題（#33）
  - （舊 conic 圓餅 `.week-pie`/`.week-legend` 已移除）
- 右側：2 欄 task cards，依緊急度分區塊顯示（`.week-group[data-group]`）；分組委派 `taskRules.urgency`
- **置頂「已逾期 (N)」區**（紅橘 `color-overdue`）：只收 30 天窗內逾期未繳（`taskRules.isWithinOverdueWindow`），排序最近錯過的在最上；窗外逾期不進待辦（只在課程詳情可見），側欄待辦數（`updateSideNav` weekCount）＝未來三組＋窗內逾期，與列表一致
- 每張週卡片右上角有完成勾選圈（含逾期卡）：勾選走 1.5 秒撤銷窗口 → 就地離場（`beginCompleteWeek`／`cancelCompleteWeek`／`finishCompleteWeek`，與課程詳情列共用撤銷窗視覺、出場層、FLIP 補位與碎點，見下方「完成標記」），窗口內點卡片任意處可取消
- 點擊 task card（非勾選圈、非撤銷窗口）→ View Transitions API morph 展開對應課程詳情（課名對課名配對，作業名不命名，#17）

**課程頁（Courses）：**
- 3 欄課程卡片 grid，依最近截止日期排序
- 每張卡片顯示：課程代碼、**課程名稱**、緊急件數 badge、最多 3 筆作業（含分頁）；換頁時卡片高度不變（3 列的 min-height，同一排下面的卡不再移動），列以 opacity＋blur 原地交換（#31）
- 課程卡片點擊 → View Transitions API morph 動畫展開為詳情頁

**課程詳情頁（Course Detail）：**
- 上半：課程代碼、名稱（含鉛筆圖示可 inline 重命名）、緊急 badge
- 左下：評分比重圓餅圖 + 圖例；資料來源優先序：手動輸入權重（`customWeights`）→ Canvas 分組權重（`group_weight`）→ 皆無則顯示「無評分資訊」
  - **來源小字**（D2，`weightSourceHtml`，圖例最後一行、`.detail-weight-source` DM Mono 10.5px `--mid`，title 說明）只有三種情況：`customWeights` 與 AI 的 done 紀錄逐項相同（`isAiCustomWeights` → `DueGradingRules.isAiWeights`）→「AI 分析」；畫的是 Canvas 分組權重 →「Canvas 設定」；其餘（自己填的、改過的、沒有權重）不標。`loadData` 一定把 `gradingAnalysis`（預設 `{}`）放進 `_currentData`，常駐 onChanged 才會合併 AI 之後寫的紀錄；`aiConfig` 只取布林 `_aiConfigured`（`isAiConfigured`），不進 `_currentData`
  - **`customWeights[courseId]` 存在（含空陣列）＝使用者覆寫**：總和 > 0 畫自訂圓餅；全刪／總和 0 → 「沒有評分資訊」（與編輯器一致，不偷偷回退 Canvas 權重，QA #168）；回到 Canvas 權重只走編輯器的清除鈕（刪 key，覆寫存在時才顯示該鈕；文字依 `DueGradingRules.resetButtonKind`（有測試）存成 `_weightResetKey`：Canvas 權重生效 →「還原 Canvas 權重」；否則 AI 已設定且上次不是 notFound →「清除並重新分析」；其餘（沒設定 key，或 AI 上次判 notFound——材料沒變時指紋會擋掉、按了也不會重跑）→「清除權重」；`applyUILanguage` 沿用目前的 key）。**既有資料的語意變更（不遷移）**：v2.0.0 以前「全刪後儲存」也會存成 `[]`，當時圓餅會回退顯示 Canvas 權重；升級後這類舊 `[]` 改顯示「沒有評分資訊」，編輯器列 0 項且「還原 Canvas 權重」鈕可見，按下即回到 Canvas 權重
  - 權重編輯器（`openWeightEditModal`）：總和 > 100%、有負數、或仍有「會被存下的項目」（`weightRowKept`：有名稱或權重 > 0，與存檔過濾同一規則）但總和 0 → 儲存鈕 disabled＋`#weight-edit-msg` 說明原因（`weightEditProblem()`；總計字樣沿用 `.over` 橘色；名稱與權重欄的 `input` 都會重算）。名稱空且 0% 的空白列不觸發「總和 0」——在 0 列編輯器按「+ 新增項目」不會立刻報錯。全部刪光可以存：Canvas 有生效權重 → 存 `[]`（明確「不顯示權重」），沒有 → 直接刪 key。未命名項目存 `name: ''`，圖例／aria-label 顯示時才套當前語言的 `unnamedWeight`（`weightItemLabel`）；名稱空且 0% 的列存檔時丟掉（QA #170）
  - 存檔／還原換左欄圓餅＋右欄成績計算器（`refreshWeightPanel` → `refreshGradeCalc`：計算器與圓餅吃同一份權重，保留 accordion 開合與右欄捲動），已隱藏區、展開描述不動（QA #169）
  - **課程關掉「依組別加權」**（`course.apply_assignment_group_weights === false`）→ 殘留的 `group_weight` 一律忽略（`courseUsesGroupWeights`）：圓餅、計算器、編輯器預填都視為不加權（QA #93）
- 右下：成績計算器（accordion）+ 作業清單
  - 成績計算器：輸入分數即時計算加權總分；**Canvas 已評分自動預填**（可改可清；清空會記住 → `scores[id]=null`），詳見下方「成績計算器」
  - 作業列表：點擊行展開描述，點擊作業名稱文字開新分頁跳轉 Canvas（`window.open(url, '_blank', 'noopener')`，切斷 opener，QA #154）。描述可用鍵盤展開：左欄蓋一顆透明、不吃指標的 `<button class="assignment-desc-toggle">`（Tab 停得到，Enter／Space 的 click 冒泡到列走同一個開關；`aria-expanded`／`aria-controls` 由 `toggleAssignmentDesc` 同步，#7）；成績計算器標題維持原樣（#7 縮小範圍）
  - **展開面板共用 disclosure 過渡**（#28）：作業描述、成績計算器、已隱藏清單都是 height 0 ↔ auto（`.detail-right-panel` 的 `interpolate-size: allow-keywords`，Chrome 129+；更舊的版本高度直接跳、淡入仍有效）＋opacity＋2px blur，與 chevron 同一條 `--t-disclosure`；收合時 `visibility:hidden`（裡面的連結／輸入框不在 Tab 順序；打開那一邊 0s 立即可聚焦）。即時刷新等重繪後還原「本來就開著」的面板用 `openPanelInstant`（先關過渡、forced reflow 提交終點），不重播展開
  - 描述 HTML 走 `descSanitizer`（`hrefKind`）：`http(s)` 開新分頁、`mailto:` 保留為可點連結（不開分頁）、頁內錨點 `#xxx` 保留——來源元素的 `id`／`<a name>` 轉成空的 `<a data-desc-anchor>` 標記（不沿用 id，避免撞名／DOM clobbering），點擊由 `#course-detail-container` 委派攔截、捲到同一則描述內的標記（不改網址：hash 變動會觸發 popstate 把詳情退回清單）；`javascript:`／`data:`／相對路徑／`//host` 一律拿掉 href（QA #158）
  - **窄視窗（≤1100px）上下堆疊**：圓餅＋圖例縮成一列在上（圓餅 104px），作業清單用滿寬度、仍由 `.detail-right-panel` 捲動（拖曳邊緣捲動、重繪還原捲動依賴它）；≤767px 收窄下半部左右留白（28→16px）、列內名稱與截止標籤間距（20→12px）、截止標籤 14→13px；≤680px 改整個下半部一起捲動。681–1280px 三語言下被截斷的作業名至少約 6em（QA P1-10；實測英文 681px 6.9em、700px 8.1em、1101px 6.1em）；≤680px 側欄仍佔 240px，英文名稱只剩約 2em，未處理
  - 作業列最左有完成勾選圈（見下方「完成標記」）
  - **作業清單下方兩個收合區**（`.detail-fold`，開關／箭頭／清單共用 `.fold-toggle`／`.fold-arrow`／`.fold-list`，開合走 `setFoldOpen`，帶 `aria-expanded`／`aria-controls`；預設收合、開合不持久化，即時刷新與重繪由 `captureViewState` 的 `doneOpen`／`hiddenOpen` 保留）
  - 「已完成 N 項」區（`renderDoneItemsSection`／`doneItemsOf`，`.done-items`）：沒隱藏、已落地完成的項目，最近截止的在上、無截止殿後；只要該課有作業就恆存在（N=0 顯示空狀態 `doneItemsEmpty`，作放置目標）。列與作業清單同一個 `renderAssignmentRow`（勾選圈標回未完成 → `rerenderDetailAndNav`，列回到作業清單；描述、名稱連結、握把可拖到另外兩區、自訂作業編輯／刪除）。作業清單勾完成落地時 `finishComplete` 呼叫 `refreshDoneSection`：沿用原外框（開合、FLIP 位置）只換計數與列；事件經 `bindDetailRows(scope)`／`setupHideablePromoteDrag(el, scope)` 只綁新列
  - 清單底部「已隱藏 N 項」區（`renderHiddenItemsSection`）：收的是**自動隱藏的考試/簽到（未升級）＋手動拖進來的一般作業**（`isHidden`），**不分完成與否**（spec 2026-10-25-drop-submitted-filter，取代 10-23 的跟隨完成過濾）：未完成的在前（截止升冪），已完成的在後（最近截止在前、`.submitted` 淡化）；N＝全部隱藏項。考完的考試因此留在這裡（已隱藏優先，owner 拍板）。精簡列：作業名可跳 Canvas＋分組名＋due 標籤（考試顯 `due-exam` 紫），標題 `--mid`、分組/due 標籤 0.75、**不整列降透明**（避免把握把對比疊乘稀釋），**不顯示任何分數**；隱藏的自訂作業同樣有編輯/刪除鈕（`customActionsHtml`，與主清單共用）。只要該課有作業就恆存在（作降級放置目標），N=0 時顯示空狀態文字
  - **三區互拖**（spec 2026-10-25-drop-submitted-filter）：作業清單、「已完成」、已隱藏三區，列所在的區是來源（`dragSourceOf`），另外兩區都是放置目標（`dragTargets`，拖曳中一起 `.drop-active`，`updateDropState` 先找正好壓在框內的、沒有再放寬 14px）。`commitDrag` 依放到哪一區寫入：作業清單＝取消隱藏＋標回未完成；「已完成」＝取消隱藏＋標完成（`setCompletion`，不走撤銷窗）；已隱藏＝隱藏、完成狀態不動。兩種寫入都先不重繪（`setItemHiddenByDrag(…, { rerender:false })`），最後 `rerenderDetailAndNav` 一次；落點以寫入後的實際狀態判定，那一區瞬間展開，播報 `a11yMovedToList`／`a11yMovedToDone`／`a11yMovedToHidden`
  - **拖曳隱藏／取消隱藏**（`manualShown`／`manualHidden`，見 spec 2026-07-22 與 2026-10-23）：**看得到就能拖**——三區每一列都有握把，沒有鎖住的列。隱藏列拖進作業清單＝取消隱藏（考試/簽到寫 `manualShown`＝「升級」為一般可操作作業，可勾/可點、考試仍紫；一般作業清 `manualHidden`；落點依放開當下的完成狀態：已完成的落在「已完成」區並把它瞬間展開，未完成的落在作業清單），清單列拖進已隱藏區＝隱藏（反向寫入），統一走 `setItemHiddenByDrag(id, makeHidden, courseId)`。升級為逐項手動覆蓋，**視同一般作業出現在所有視圖**（學期待辦進度環/分級/計數、課程 grid、popup）。判定：`isHidden(a) = isHideable(a) ? !isManuallyShown(a) : isManuallyHidden(a)`；此規則同時套用於 `applyFilters`、`updateSideNav` 計數、`computeNearProgress` 進度環、popup `getTasks`。拖曳為 **Pointer Events 自繪引擎**（`setupHideablePromoteDrag`／`trackDragFrom`；原生 HTML5 DnD 啟動層在部分環境不觸發已棄用）：名稱正後方的 grip 為唯一拖曳起點（4px 閾值內視為點擊；靜止透明度 0.75，對 `--bg` 約 3.2:1——**已完成列的淡化只套在內容上**〔`.submitted` → `--done-fade: .45` 套在勾選圈/標題文字/分組/右欄，不含握把與自訂作業操作鈕；已隱藏區裡已完成的列同樣帶 `.submitted`〕，不整列 `opacity`，故作業清單、「已完成」區、已隱藏列的握把都維持此對比；拖曳 clone／殘影把 `--done-fade` 歸 1），拿起後浮動 clone（`.drag-clone` 陰影＋微傾，clone 內文字留在原位不跳、清單不被下推，#41；clone inert＋`aria-hidden`）跟隨游標；**沒有插入讓位動畫**（`.drag-shift`／`--drag-gap` 已於 cd2180e 移除），放開後依 due 排序重繪、clone **只飛 transform**（`--reflow`，寬高不動）到真實位置，快到時與落地列交叉淡換（`settleClone`，各 200ms、150ms 起交疊；兩種列形狀不在最後一幀硬切）並 `drag-arrived` 閃示；Esc／界外放開飛回原位（原列從殘影 0.3 淡回）；邊緣自動捲動；drop 目標 `.drop-active`／`.drop-hover` ＋ `data-drophint` 提示。減少動態：clone 只平移、落地原地交叉淡換不飛行
  - **拖曳的鍵盤路徑（#6）**：握把是 `<button class="drag-grip">`（aria-label `a11yShowItem`「取消隱藏」／`a11yHideItem`），Enter／Space 只做隱藏 ↔ 取消隱藏、不改完成狀態（清單／已完成的列 → 已隱藏；已隱藏的列 → 依完成狀態回到作業清單或「已完成」）——`keyboardMove` 建一個「已拿起、已在目標上」的 ctx（不掛 `_dragCtx`），走與放開滑鼠相同的 `commitDrag` → `settleClone`，動效一致；焦點跟到落地後那一列的握把（`focusAfterMove`），結果經 `announce` 念出；按住不放的 repeat 不重複移動。收合區開關 `.fold-toggle` 帶 `aria-expanded`／`aria-controls`（`setFoldOpen`）
  - 拖曳健壯性：寫入綁定**拖曳開始時的課程**（`ctx.courseId`，不讀當下 `currentCourseId`）；`showGridView`／`goToPage`／`switchPage`／`showCourseDetail`／`popstate` 與重繪前一律 `abortActiveDrag()`（clone 直接移除、不寫入）；放開時放置目標已不在 DOM 或已換課 → 當取消。落點當下重新判定完成桶（拖曳中考試剛結束等時間差）：照樣寫入並重繪，若該項已不屬於目前視圖則 clone 原地淡出

**成績計算器（Canvas 預填 + 三態）：**
- 日常視圖（學期待辦／課程 grid／作業列／已隱藏列）一律**不顯示分數**（決策 3）；分數只出現在成績計算器與「學期成績」總覽（側欄獨立入口開的 modal，主動點了才看到）。考試被拖曳升級回作業清單、Canvas 已評分時也一樣（初版遺留的列上 `.exam-grade`「18 / 20 · 90.0%」已於 2026-10-23 移除）
- `scores[id]` 三態：無此 key → 有 Canvas `submission.score` 就預填、否則空；值為數字 → 顯示該數字；值為 `null` → 使用者清空過 → 顯示空
- `recalculateGrades(courseId, { persist, changedId })`：開詳情主動算一次傳 `persist:false`（只算顯示、**不把預填值固化成手動值**）；使用者輸入的 `input` 事件走 `persist:true` 並帶 `changedId`——**只寫正在輸入的那一格**（read-modify-write，不以畫面上其他格的舊值覆寫整門課）。顯示與計算一律從輸入框現值讀（`Number.isFinite` 才計入），預填與手動輸入一致
- persist 規則：欄位空且該作業有 Canvas 分數 → `scores[id]=null`（記住清空）；空且無 Canvas 分數 → 刪除 key；有值 → 存數字
- 負分：輸入框標紅（`.invalid`＋`aria-invalid`）、不計入、不寫入 storage（維持原值）；超過配分照收（可能是加分題）（QA #25）。鍵盤打負數時先按的「-」會讓 number input 進入 `validity.badInput`（`value` 讀回 `''`）：同樣標紅、不計入，persist **跳過**（不當成清空寫 null／刪 key），原值不會在打字途中被清掉
- Canvas 已免除（`submission.excused`）：不給輸入框、顯示「已免除」，不計入分子分母（殘留的 `scores[id]` 也忽略，QA #94）
- **權重來源與圓餅一致**（spec 2026-10-25-semester-grades，規則在 `gradeCalc.js` 的 `DueGradeCalc.weightMode`，含測試）：`customWeights[cid]` 是陣列 → 總和 > 0 用自訂（`custom`）、空陣列／總和 0 → 不顯示計算器；否則 Canvas 實際加權（`usesGroupWeights`，`courseUsesGroupWeights` 委派它）→ 用 `group_weight`（`canvas`）；都沒有 → 不顯示。AI 寫入的權重也走 `custom`
- 結構與數學抽成純函式：`DueGradeCalc.plan`（哪些作業、各歸哪一桶；只收有配分的作業）→ `compute(plan, scoreOf)`（各桶 Σearned/Σpossible，總分＝Σ(桶%×權重)/Σ(有成績的桶的權重)——只算已評分的部分）。DOM 計算器把輸入框現值當 `scoreOf`；`bindGradeCalc` 把當下的 plan 掛在 `.grade-calc._plan`，即時試算用同一份對應（資料在輸入途中被別處更新也不會與畫面錯位，閒置後的重繪才換新）
- **Canvas 模式**外觀不變：只列有作業的組。**自訂模式**：依權重項目分組（順序同圓餅；沒有作業的項目照樣列組頭、小計 `—`），每列多一個小下拉 `.grade-calc-map`（選項＝各項目＋「不計入」，未歸類時多一個停用的「未歸類」佔位、虛線框），改了就寫 `gradeItemMap` 並 `refreshGradeCalc`（焦點留在同一筆的下拉）；最下面「未計入」區（`.grade-calc-out`）收未歸類＋手動不計入，有未歸類時附說明句
- **自訂權重的作業歸類**（`DueGradeCalc.matchItem`，寧可不算、不可算錯：只有唯一最佳候選才歸，平手或零分 → 未歸類）：① `gradeItemMap[cid][aid]` 手動指定（字串＝項目名稱，名稱已不在 → 當作沒指定；`null`＝不計入）→ ② 作業名稱關鍵字唯一最佳 → ③ Canvas 組名與項目名稱相同（英文單數化、去標點）→ ④ Canvas 組名關鍵字唯一最佳 → ⑤ 未歸類。關鍵字（`keysOf`）：同義詞表（homework/quiz/exam/midterm/final/project/lab/participation/presentation/report/paper/reading，中英繁簡）＋其他 ≥3 字母英文字（去停用字），單獨的 midterm／final 補 `exam`，含中文的項目名整串出現在作業名稱裡加 1。**大雜燴組**：同組作業依 ①② 已對到兩個以上不同項目（例如 Canvas 預設的 Assignments 組）→ 組名不可信，該組對不上名稱的跳過 ③④
- `gradeItemMap` 為共享使用者 key（`SHARED_USER_KEYS`，`updateShared` read-modify-write，`loadData` 預設 `{}`）；不主動清理，殘留名稱被 ① 略過

**學期成績總覽（modal，spec 2026-10-25-semester-grades）：**
- 入口：側欄主導航「成績」（`openGradesOverview`）；`#grades-overlay` 共用 modal 機制（`MODAL_OVERLAY_IDS`、Esc `closers`、`setupModalA11y`、`trackBackdropPress`／`isBackdropClick`），開著時 `isUiIdle` 為 false
- 每門課一列（依課程代碼排序）：代碼＋名稱（含自訂名稱）＋權重來源小字（`Canvas 設定`／`AI 分析`（`isAiCustomWeights`）／`自訂`），有已評分卻未歸類的作業接「· N 項未歸類」（`.grades-warn`）；右側加權分數（`DueGradeCalc.courseGrade`，與該課計算器同數字）＋「已評分 N%」（`gradedWeight/totalWeight`）＋ 2px 綠色細條。沒有權重 →「沒有評分比重」、有權重沒成績 →「尚無成績」
- 點一列：關 modal → `showCourseDetail(cid)`（不帶卡片，同步渲染）→ 展開計算器 accordion
- 不算學期平均（Canvas API 拿不到學分）；Canvas 沒開加權也沒有自訂權重的課維持「沒有評分比重」，不用總配分硬算

**課程自訂名稱：**
- 課程詳情頁的課程名稱旁有鉛筆圖示（hover 或鍵盤 `:focus-visible` 時顯示；沒有精細指標的裝置靜止就顯示；有 `aria-label`，#5／#11）；改名後鉛筆跟到新標題尾端，進入編輯時底線不增加標題高度（#34）
- 點擊鉛筆 → inline 輸入框，Enter 儲存、Escape 取消；**IME 組字中的 Enter／Esc 不算**（`isImeComposing`：`isComposing` 或 keyCode 229，側欄雙擊重命名同；全域 Esc 關 modal 也排除組字，QA P2-14）
- 失焦提交走 `commitOnBlur`（queueMicrotask 後再判斷）：輸入框若是被重繪整段換掉（Chrome 移除聚焦元素時同步發 blur，當下仍 `isConnected`）→ 放棄這次編輯、不寫入半截名稱（QA #159）；使用者點別處 → 照常提交。不可改成 setTimeout：快速點擊時 click 觸發的重繪會排在 timer 前面，正常改名會被當成放棄
- 提交後側欄只就地更新（詳情改名 → `setNavCourseNameText`；側欄改名 → 只把輸入框換回該課按鈕，`navCourseItemHtml`＋`bindNavCourseItem`），不整段 `renderNav`——失焦發生在別課按鈕的 mousedown，整段重建會吞掉隨後的 click、切不了課（QA #166）
- 鉛筆為 absolute，`positionRenameBtn()` 以課名最後一個 line box（`getClientRects`）定位到尾端：詳情 render、改名後、hover／focusin 時重算；`.detail-name` 右側留 32px 並 `overflow-wrap: anywhere`，超長名稱也不會把鉛筆推出卡片（QA #167）
- 自訂名稱儲存在 `chrome.storage.local.courseNames`，不影響 Canvas API 資料
- 自訂名稱同步顯示於：sidebar 導航、週待辦卡片、課程 grid 卡片、popup

**自訂作業（`customAssignments.js`＋新增/編輯 modal）：**
- 建立／編輯經 `createCustomAssignment`／`updateCustomAssignment`；錯誤帶 `code`：`name_required` → 「請輸入作業名稱」、`invalid_due` → 「截止日期無效」（Chrome 年欄位可打到 6 位數、或只打兩位數成 0026 年；合理年份 2000–9999，`isValidDueLocalValue`，QA #161）。截止日期欄另設 `min`/`max`，Chrome 年欄位打滿 4 位數就自動跳到月
- 存檔後（`afterCustomSaved`）若作業落在目前畫面看不到的地方，底部 toast（`showToast`，`#due-toast` role=status，4 秒淡出）說明去處：詳情頁在別門課（`customSavedInCourse`）→ 被收進已隱藏區（`customSavedInHidden`；同一門課的詳情不提示）→ 已完成（`customSavedInDone`，「已完成」區預設收著）→ 週待辦的 30 天逾期窗外（`customSavedPastWindow`）；看得到就不提示（`customPlacementNote`，QA #162）
- 描述是純文字：escape 後以 `.assignment-desc-inner.is-plain`（`white-space: pre-wrap`）保留換行，不走 `DueDescSanitizer`（只給 Canvas 的 HTML 描述用，QA #155）
- 刪除：確認框帶作業名稱（`confirmDeleteCustomNamed`）；同一次寫入連同 `manualDone`／`manualUndone`／`manualShown`／`manualHidden`／`scores` 裡該 id 的 key 一起清掉（只寫實際含該 id 的 map，QA #172）；刪除後空隙以 FLIP 收合（`detailFlipSnapshot`／`detailFlipPlay`），焦點交給鄰居（#8／#48）
- 送出失敗（#38）：錯誤文字寫進 `#custom-assignment-error`（`role=alert`，欄位 `aria-describedby` 指向它）、出錯欄位 `aria-invalid` 轉紅框（名稱或截止日期，`showCustomFormError(code)`）、焦點回到該欄、欄位搖一次（`SHAKE_KEYFRAMES`，`MOTION.shake`，減少動態不搖）；開始打字即清掉錯誤狀態。空名稱由原生 `required` 擋，只有空白的名稱才走 `name_required`
- 新增／編輯存檔後（`afterCustomSaved` → `refreshView` → `landCustomAssignment`）：落點捲進可視範圍、淡入＋上移 8px 落地（#48）；編輯後焦點回到重建後的同一顆「編輯」鈕

**Modal 共通：**
- **點背景**：確認框、教學、AI 分析設定（`aiSettings.js` 綁定）、學期成績點背景會關，但要「按下（pointerdown）、放開（pointerup）與 click 都在背景本身」（`trackBackdropPress`／`isBackdropClick`）——按下與放開在不同元素時 click 會派發到共同祖先 overlay，所以在對話框內按下、拖曳選字到背景放開，或反過來從背景拖進對話框放開，都不會關掉 modal（QA P2-9）。**新增／編輯作業與權重編輯器點背景一律不關**（N2，比 P2-9 更嚴），只用 ✕、取消、Esc
- **草稿（N2）**：新增／編輯作業與權重編輯器裡已輸入的內容是草稿（只在記憶體，`_customDraft`／`_weightDraft`）：✕ 與 Esc 關掉時保留，重開「同一個」視窗才還原——key 由 `customAssignments.js` 決定（`formDraftKey`：新增一律 `new`、編輯 `edit:<id>`；`weightDraftKey(courseId)`；`draftValuesFor` 比對，含測試），開別筆作業或別門課的權重就重新開始；「取消」、儲存、權重的「還原 Canvas 權重」丟掉草稿
- **進出場（#29）**：六個 overlay（新增作業、權重、確認、教學、AI 分析設定、學期成績）的背景雙向淡入淡出（`--t-overlay`），卡片進場 `--t-dialog-fade`＋`--spring-dialog`、關閉走 `--t-dismiss`；關閉中的 overlay inert。Esc 一次只關最上層（確認框 → AI 分析設定 → 新增作業 → 權重 → 學期成績 → 教學），組字中的 Esc 不算
- 文案插入使用者字串（作業名、課名）一律用函式型替換 `.replace('{name}', () => s)`，避免 `$&`／`$$` 被 `String.replace` 展開

**完成標記（手動，雙向）：**
- 每個作業列最左有一個勾選圈，所有作業皆可雙向切換完成/未完成，獨立於 Canvas 繳交狀態
- 判斷公式 `isDone = (isExternallyDone && !manualUndone[id]) || manualDone[id]`，單一真相來源在 `dashboard/completion.js`（含單元測試）；`isExternallyDone = Canvas 已繳 ∨ 考試已結束`（`taskRules.isExamConcluded`：考試 due 一過即不可再行動，與已繳歸同一完成桶，不進待辦/逾期——還沒考的考試才進未完成，見 spec 2026-07-22；**要交東西的考試不適用**：`submission_types` 含交件型（`DELIVERABLE_TYPES`，見下方「全域篩選邏輯」）的 take-home 考試 `isExam` 本身就是 false（結構規則），截止後照一般作業算逾期、未繳就進已逾期，不會自動完成；`isExamConcluded` 內另有同一判斷作防線（QA P0-2）；無截止日／日期無效也不算考完；自訂作業不算考試，不適用）
- **寫入單一入口 `DueCompletion.setDone(maps, a, done)`**（dashboard 勾選圈／撤銷、popup 勾選／撤銷共用；QA P1-4）：目標狀態取**畫面顯示的狀態**的反面（勾選圈 `data-done`，`toggleCompletion(id, cid, shownDone)`；不用點擊當下重算的 `isDone`——render 後作業可能已變外部完成〔升級考試時間到、同步已併入但重繪延後〕，重算會把看起來未勾的一點反向寫成未完成），再依**點擊當下**的 `isExternallyDone(a)` 決定用哪張 map 表達，另一張同 id 一律清掉 → 結果恆為最小覆蓋：完成＝外部完成則兩張都不留／否則只留 `manualDone`；未完成＝外部完成則只留 `manualUndone`／否則兩張都不留。外部完成者標回未完成會回到待辦清單（popup 同步），「已繳交」badge 仍顯示 Canvas 事實。勾選圈不再帶 `data-ext-done`（render 時的外部事實會過期：先手動勾完成、之後 Canvas 才記錄繳交或考試時間過了）
- **撤銷窗**（`markCompleting`／`unmarkCompleting`，詳情列與週卡共用）：待辦視圖勾選完成 → `.completing`：勾選圈填綠、勾號在填色後畫出（`.just-checked`，`--t-check`＋200ms delay，只有「勾下去的這一下」播，重繪出來就已勾選的不播，#46）；due 標籤與「↩ 撤銷」從一開始就疊在同一格 `.due-slot`，撤銷窗只做 opacity＋blur 原地淡換；橘色倒數條 `.complete-countdown` absolute 疊在卡片／列框內底部、裁在圓角內（#13／#44）——**卡片／列尺寸完全不變、其他項目不被推動**；經 `announce` 念出。期間點該列／卡片（含作業名稱）＝撤銷；鍵盤在同一顆勾選圈按 Enter／Space＝撤銷。`beginComplete*`／`cancelComplete*`／`finishComplete*` 為詳情列與週卡兩套平行版，`toggleCompletion`／`revertCompletion` 為共用的寫入／還原
- **每項的撤銷窗各自獨立**（#1／#12）：`_completeTimers[id]` 一項一個計時器、互不清除，完成流程本身從不呼叫 `clearCompleteTimers()`——連勾三張，每張都跑滿自己的 1.5 秒倒數，第一張落地不會截斷或重置其他張（使用者明確要求：「每個倒數的時間都會被第一個倒數進度條給影響，請你確保他們獨立」）。QA 分支的 `settleCompletion` 批次收尾與 `${id}:burst` 重繪 timer 因此不再需要、已移除
- **落地＝就地移除，不整段重繪**（`finishComplete`／`finishCompleteWeek`）：① 焦點交接：離場項持有焦點時交給下一項（沒有就上一項）的勾選圈，再沒有就交給 `#page-title`／`.detail-assignments-label`（`handOffFocus`；只在離場那一刻移，scope 限目前清單——開詳情時 `#main-section` 只是隱藏，用 document 查會找到看不見的同 id 勾選圈）② 碎點從被點的勾選圈中心迸出，畫在 fixed、`pointer-events:none` 的 `#burst-layer`（`spawnBurstDots`，#20）③ 節點立刻抽出版面、搬進出場層釘在原視覺位置淡出＋縮到 0.96（`exitInPlace`，`EXIT_SCALE`；殘影裁在原捲動容器內、離場節點 inert，#19）④ **同一幀**其餘卡片／列／組標題／分隔線／摘要列以 FLIP 沿 `--reflow` 滑進空位（`flipSnapshot`／`flipPlay`，WAAPI id `reflow`，只動 transform；再次觸發時從目前位置接續，#18）⑤ 組標題 (N)、摘要列數字、空狀態、詳情 header 待辦數／緊急 badge（`updateDetailHeader`）、詳情的「已完成」區（`refreshDoneSection`）、側欄計數、進度環就地更新。組裡最後一張離場時，組標題＋相鄰分隔線＋左欄摘要列一起離場。捲動位置、展開的描述／成績計算器／已隱藏區、其他仍在窗內的項目都保得住
- `isDoneLanded(a)`：撤銷窗內的項目畫面上還在清單裡，計數、組標題、進度環、側欄都先不算它完成，落地那一刻才一起更新
- 整段重繪（`renderCourseDetailSection`／`renderWeekSection`／`renderCardGrid`）一律先 `clearCompleteTimers()`；撤銷窗內導覽離開時完成已在勾選當下寫入，那一列／卡留在已隱藏的容器裡直到下次重繪（`finishComplete*` 看到節點已不在畫面上就略過）。`rerenderDetailAndNav(cid)`／`rerenderWeekAndNav()`（拖曳、標回未完成用）只在仍停在該課詳情／週待辦版面時重繪（QA #113）
- 進度環就地更新（`updateWeekRing`，#12）：只改 `stroke-dashoffset`（0.8s 過渡從目前位置 retarget，不換節點），分子 tick（forced reflow 重播）、aria-label 同步。**「全部完成」慶祝只看狀態轉移**：最後一項近期作業落地、分子剛到分母且上次顯示的還沒到（`_prevRingDone`）→ 等弧真的停在終點（`whenRingLands`，只認停在 target 的 transitionend；減少動態或已在終點立即執行）才 `celebrateRingArrival`：中心換字淡入「全部完成」＋播報（減少動態也保留），非減少動態才有環與分子的彈跳和 16 顆多色碎點。全部完成後再勾非近期項不重播；連勾最後兩項只由後落地的那一項觸發一次
- 撤銷窗口內點作業名稱（詳情列的 Canvas 連結）＝點該列 → 取消完成，不開 Canvas
- 即時刷新遇到撤銷窗：見「開發注意事項」第 9 點——任何一項還在窗內、離場或 FLIP 還在跑，整頁重繪就延後
- `isDone` 公式不變：兩張 map 同時有 id 時 `manualDone` 勝出；但 `setDone` 下一次寫入就會把它正規化，不會再卡在「標不回未完成」（見 docs/superpowers/specs/2026-07-21-bidirectional-completion-toggle-design.md）

**多語言支援（i18n）：**
- 支援：繁體中文（預設）、简体中文、English
- `I18N` 物件約 140 個 key（三語言 key 集合一致），透過 `tr(key)` 函式取值；新增使用者可見文字（含 title／aria-label／alt）一律三語言都加 key，不寫死在 HTML（HTML 內只留繁中預設值，`applyUILanguage` 覆寫）
- 語言偏好儲存在 `chrome.storage.local.uiLanguage`；`applyUILanguage` 同步設定 `<html lang>`（`zh-TW`／`zh-CN`／`en`，QA #125）
- 切換語言後，`formatDue()`、`formatLastSync()` 等函式也會隨語言調整顯示格式
- 英文的 Canvas 已繳 badge 是 `Submitted`（不是 Done：被標回未完成的已繳作業才不會同時出現「Done」和「Mark done」，QA #134）

**側欄 header meta（`setHeaderMeta`）：** 「校名 · 同步時間」拆兩個 span——同步時間 `flex-shrink:0` 永遠完整顯示；校名放不下時先微縮字（13→11px 為地板），仍放不下就省略號（整格 title 看全名）。舊版 `fitMetaText` 逐步縮到 8px 仍裁掉同步時間，已移除（QA #135）。單段提示（同步中…）傳一個參數。啟動時的「載入中…」帶 `data-loading`，`applyUILanguage` 依語言替換。側欄課名被省略號截斷時，按鈕給 title 看全名（`syncNavNameTitles`；renderNav／改名收尾時算，視窗 resize 時以 rAF 節流重算——跨 900px 斷點側欄 300→240px 會改變誰被截斷）

**同步按鈕（`setSyncStatus`，#30）：** 閒置／三點／「✓ 已同步」／「同步失敗」四個標籤一開始就疊在同一格（`.sync-swap`），換狀態只改 `data-status`，CSS 原地 opacity＋blur 淡換（按鈕不變寬）；「✓ 已同步」停 1.5 秒（`SYNC_DONE_MS`）、「同步失敗」停 2.5 秒（`SYNC_ERROR_MS`，期間 disabled）再回閒置；結果經 `announce` 念出。`SYNC` 回 `success:false`（整體失敗，例如課程清單 401）或訊息通道錯誤 → 錯誤態（錯誤代碼橫幅屬 QA P0-3，決策不做）；部分失敗（`success:true`＋`failedCourses`，QA P0-1）仍是「✓ 已同步」；成功且已有資料 → 不立即重繪，交給 `requestRefresh()`（等 UI 閒置才原地重繪，同步期間勾的撤銷窗不被截斷）；首次同步（無資料）→ 同步期間畫 skeleton，結束後 `loadData()`

**空狀態（`renderEmptyState`，QA P2-6）：** 沒有課程時區分「從未同步」（無 `lastSync`：`emptyNeverTitle/Body`）與「已同步但沒有進行中的課程」（有 `lastSync`、courses 空：`emptyNoCoursesTitle/Body`，說明 Due 只抓進行中的課程）。header 照常顯示「學校 · N 分鐘前同步／尚未同步」。主要動作「前往 Canvas」（`openCanvasTab`，與教學的登入連結共用：點擊當下讀 storage 的 `canvasBaseUrl`，沒有就開 HKUST(GZ) 並附其他學校說明；從未同步時同教學「武裝」自動跳回）。`loadData` 的空分支把 `_currentData` 換成只有同步狀態（側欄計數與課程列不留上一份資料的殘影）、回到學期待辦（`currentPage='week'`），並以 `setNoCoursesMode(true)` 停用「+ 新增作業」「課程」「成績」（title 說明 `needCourses`）；有資料時 `render()` 解除

**側欄「偵測到另一個 Canvas」提示（`#canvas-candidate`，QA P1-9）：** 同步鍵上方一行安靜的提示。`loadData` 讀 `canvasBaseCandidate`（另存 `_canvasCandidate`，不進 `_currentData`），常駐 `storage.onChanged` 看到 `canvasBaseCandidate` 變動時只重畫這一行（`setCanvasCandidate`，不排整頁重繪）；`canvasBaseUrl` 屬於同步 key（`LIVE_SYNC_KEYS`），外部變更照常排整頁重繪（`requestRefresh`），並順手重畫這一行（`renderCanvasCandidate`）；候選存在且 `origin !== canvasBaseUrl` 才顯示（空狀態也顯示——放假沒課的學校同樣可能偵測到別校），host 顯示 `URL.host`、title 為完整 origin。「切換到這裡」送 `SET_CANVAS_BASE`：等待期間兩鈕停用、文字換 `canvasCandidateSwitching`（期間任何重畫都不解除）；成功 → 收起提示並 `loadData()`；失敗 → 提示保留、下方 `#canvas-candidate-error` 依回應的 `reason` 顯示說明：`'not-logged-in'` → `canvasCandidateFailed`（請先登入該 Canvas）；其餘（含訊息通道錯誤、沒有 reason）→ `canvasCandidateSyncFailed`（請稍後再試）；`_canvasCandidateError` 存原因字串，再按切換或候選換成別的網址時清除。「忽略」送 `IGNORE_CANVAS_BASE` 並立即收起。i18n：`canvasCandidateLabel`／`Switch`／`Switching`／`Ignore`／`Failed`／`SyncFailed`

**設定選單：** 標題與齒輪 title／aria-label 走 `settingsTitle`；Popup Claude 用量開關、AI 分析設定、語言、使用教學。（QA #152 加的「清除本機資料…」已於 2026-10-24 依 owner 決定移除；要清資料用 Chrome 自己的 chrome://extensions，background 的自我修復見上方 background.js 段。）
- 選單與語言子選單從觸發點長出、收回原點（`--scale-menu` 0.9 ↔ 1＋opacity，`--t-menu`，#50）
- **語言子選單點擊開關（N1／#10）**：「語言」列的 click（含鍵盤 Enter／Space）開／關，不再靠 hover＋180ms 關閉延遲——滑鼠不小心移開不會關，hover 也不會打開。子選單是 `index.html` 裡**唯一一個靜態節點**（`#menu-language-submenu`，fixed 定位在「語言」列右側；母選單還在縮放中也用 `menuRowFinalRect` 量最終位置），`applyUILanguage` 只改文字、不重建（QA 回報的「每切一次語言多一個重複 id 子選單」已不存在）。開啟時焦點進第一個語言（`menuitemradio`，目前語言另有 `aria-checked`）；↑↓／Home／End 在語言間移動，→ 開、←／Esc 收回並把焦點還給「語言」，Tab 走出邊界接回母選單
- 所有關閉路徑（選語言、點外面、齒輪、Claude 用量開關、AI 分析設定、使用教學）走同一個 `closeSettingsMenu()`：母選單與子選單一起收，焦點原本在選單裡（鍵盤操作）就還給 ⚙

**減少動態效果（`prefers-reduced-motion`，#0；涵蓋 QA #138）：** 原則是保留淡入淡出與顏色、拿掉位移／縮放／旋轉／尺寸動畫，無限循環改成只閃透明度或停止。
- CSS：`index.html` 檔尾一個 media 區塊（與各規則同特異度時靠順序勝出）：`--lift: 0`、scale token 歸 1、展開面板高度直接到位只留淡入與模糊、同步中的三點只閃不跳、skeleton 掃光停止等。**不再用「`*` 全部壓成 0.01ms !important」的全域規則**——它會把要保留的淡入淡出、撤銷倒數條與展開面板透明度一起抹掉
- JS（CSS 管不到的 WAAPI、`scrollTo`、View Transition 共享元素命名、拖曳 clone 的 inline transform）一律問 `reduceMotion()`：頁面切換只淡入不位移；課程 morph 仍走 VT 但不命名共享元素（只剩 root crossfade）；FLIP 不量不滑、直接到位；離場只淡出不縮放；沒有完成碎點；進度環慶祝只換字＋播報（不彈跳、不迸粒子；`whenRingLands` 不等 transitionend——CSS 的 `transition:none` 會讓它永遠不來）；分級摘要瞬間捲動；拖曳 clone 只平移、落定原地交叉淡換；教學換頁 crossfade；表單錯誤不搖
- 保留：淡入淡出、顏色、due／撤銷淡換、勾號畫出、撤銷倒數條（期限 meter，不算位移；inline `animation … !important` 保留）、完成項目離場的 opacity、`drag-arrived` 閃色、View Transition 的 root crossfade、`:focus-visible` 外框
- 兩邊必須一起改：只在 CSS 把某個過渡設成 none、JS 卻還在等它的 transitionend，就會讓後續效果（例如慶祝）一起消失

**全域篩選邏輯（`applyFilters`）：**
- 預設排除簽到/出勤/參與類與考試/測驗類；考試/簽到判定已移至 `taskRules.js`（`isExam`／`isAttendance` 單一真相來源，含測試，popup 共用）。`dashboard.js` 的 `isExam`／`isAttendance`／`isHideable` 僅為委派包裝；`taskRules.isHideable = isExam || isAttendance`（popup `getTasks` 共用）
- **判定順序（2026-10-23 B2，QA P0-2；原則：藏掉一份要交的東西會讓學生錯過截止，比多顯示一場考試嚴重——不確定時寧可顯示）**：
  1. **自訂作業（`_isCustom`）一律不是考試/簽到**：入口即回 false → 永不自動隱藏、截止後不被 `isExamConcluded` 自動判完成（照常進已逾期）、due 標籤走一般緊急度色階而非考試紫（名稱含 Quiz/Midterm/簽到也一樣，QA P1-6；仍可手動拖進已隱藏區，走 `manualHidden`）
  2. **Canvas 測驗一律是考試**：`is_quiz_assignment` 為真（New Quizzes，其 `submission_types` 是 `external_tool`）或 `submission_types` 含 `online_quiz`（Classic quiz）→ 考試，不看名稱，且排在結構規則之前（線上 quiz 照舊隱藏，決策 4 維持）
  3. **結構規則**：`submission_types` 含任一交件型（`DELIVERABLE_TYPES`：`online_upload`／`online_text_entry`／`online_url`／`media_recording`／`student_annotation`／`discussion_topic`）→ 一定要交東西，**不論名稱都不是考試也不是簽到**（上傳型的 Take-home Final Exam、討論區的 Participation 都照常顯示）。`external_tool` 不算交件型（Gradescope 等工具同時用於考試與作業），交給名稱
  4. **名稱備援**：只有繳交方式缺漏或非交件型（`on_paper`／`none`／`not_graded`／`external_tool`…）才看名稱（`splitName` → `nameMatchesCategory`，規則如下）
- **名稱備援規則（分段＋段內中心語在後）**：
  - 分段：先把連續空白收成一格；開頭的括號標籤自成第一段（`[Quiz] Chapter 3`、`【期中考】作業系統`），其餘括號旁註 `(…)`／`（…）`／`[…]`／`【…】` 拿掉另存（整個名稱都在括號裡就用原名）；再依 `: ： | ｜`、`– —` 與前後有空格的 ` - ` 切段——破折號兩側都是數字時是範圍、不切（`Homework 1–3 Quiz` 是 quiz）
  - 每段去掉尾端介系詞子句（第一個 ` on ／ for ／ about ／ covering ／ of ` 之後）；但介系詞前只有 make-up／retake／resit／re-exam／part／section／round／session（加短編號）時保留——`Make-up for Midterm Exam`、`Part 1 of Final Exam` 的考試在介系詞之後
  - 判定：由左而右，**第一個**含分類詞或交付物詞的段落決定（課號、主題這類中性段跳過）：
    - 段內最後一個關鍵詞是交付物 → 不是該類（`Midterm Paper`、`Project Report – Midterm`、`Reflection: Quiz 2`）
    - 段內有**強分類詞** → 成立，除非後面某段**整段就是交付物**（拿掉交付物詞、編號標點與 final／group／individual／team／written／self／peer／short／mini／revised／weekly／and 後不剩任何字：`Quiz 2: Corrections`、`Final Exam: Written Paper` 顯示）；括號旁註不看（`Midterm Exam (covers Homework 1-4)`、`Quiz 2 (Corrections)` 仍是考試）
    - 段內只有**弱分類詞** midterm → 後段或括號旁註提到任何交付物就不算（`Midterm: Project Report`、`Midterm (Group Presentation)` 顯示）
  - 考試強分類詞：英文 `exam`／`quiz` 完整詞（複數與單獨的 `Examination` 不算）；`midterm／mid-term／final ＋（序號）＋ test(s)／examination(s)`（Midterm Test、Midterm II Examination、Final Examination；後接 cases／suites／scripts 不算）；`test` 接數字（Test 1、Test-2、Test #3），但前面是 unit／usability／user／A/B／beta／integration／load／stress／pilot／regression／acceptance／t 時不算（Unit Test 1、t-test 2）；中文 考試 考试 測驗 测验 期中考 期末考 隨堂考 随堂考 小考（單獨「期中」「期末」不算）
  - 考試弱分類詞 midterm（期中這個時段）：只在單獨、接序號（2、#2、II、A–D）、接逗號，或後接 review／retake／make-up／resit／part N／online／in-class／in-person／closed-book／open-book／grade／score／marks 時才是中心語；`Midterm Prototype`／`Midterm Pitch`／`Midterm Practice` 的中心語是後面那個詞
  - 簽到詞（判定簽到時全部算強分類詞）：英文 attendance(s)／attendence／participation／sign in(s)／check in(s)（可有空白或連字號），「非字母」邊界——數字／底線可相鄰、複數也算（Week1_Attendance、L02Attendance、Check-in1、Weekly Check-ins），Design Inspiration、Checking 不算；中文 簽到 签到 出勤 考勤。先遮掉不是簽到的搭配（`NOT_ATTENDANCE_RE`）：project／milestone／progress／team／group／sprint／design check-in（要準備進度的進度會議，刻意不算）、sign-in page／form／feature…（軟體作業的功能）、版控語意 check in (your／the／my／our／all) code／changes／commits／files 與 check in … to GitHub／GitLab／Bitbucket／git／svn／repo；`Check-in to Lecture 5`、`Check in the classroom` 仍是簽到
  - 交付物詞，英文（非字母邊界，單複數皆可）：report reflection project proposal worksheet essay presentation slides draft homework hw assignment paper poster video demo portfolio milestone write-up plan correction wrapper submission「problem set」exercise self-assessment evaluation「case study」survey questionnaire prototype peer-review（`exam paper` 是考卷不算：Final Exam Paper 是考試）；中文：作業 作业 報告 报告 專題 专题 心得 提案 簡報 简报 企劃 企划 反思 訂正 订正 論文 论文 海報 海报 練習 练习 習題 习题 作品 汇报 匯報 展示 問卷 问卷
  - 例（非交件型，走名稱備援）：作業系統期中考／Paper Reading Quiz 1／In-class Quiz on Assignment 2／Quiz: Homework 3 concepts／Midterm 2／Midterm Review → 考試；Midterm Project Report／Final Exam Review Worksheet／Unit Test 3 Report／Quiz 2 Corrections／Reflection on Quiz 2／期中考後反思／小考訂正 → 顯示
  - 已知模稜兩可、刻意偏向顯示：Midterm Assessment、Final Exam: Written Paper、Team／Group Check-in、Midterm Exam Seating Plan、Quiz 1 — Exercises 1.1-1.5；名稱判定下偏向隱藏：Quiz 2 (Corrections)、Attendance Tracker App (Project 2)（交件型時結構規則先顯示）。完整清單在 `taskRules.js` 檔頭；誤判的項目使用者可手動拖曳
  - 名稱來自 Canvas、長度不可信：先收空白、括號 regex 排除左括號本身，長空白串或一串未閉合括號不會 O(n²) 回溯（測試有超長名稱案例）
  - **dev harness 注意**：`dev/seed-mock-data.js` 的 quiz 是 `online_quiz`＋`is_quiz_assignment`、紙本考試是 `on_paper`，其餘 `online_upload`；手寫 harness 案例要測「名稱被隱藏」必須把 `submission_types` 設為 `on_paper`／`none` 或省略——設成 `online_upload` 一律顯示
- **例外：`manualShown` 升級**——使用者拖曳升級的隱藏項（`isManuallyShown`）視同一般作業放行，出現在所有視圖（見上方課程詳情「拖曳隱藏／取消隱藏」）
- 被隱藏的項目可在該課程詳情底部「已隱藏 N 項」區展開檢視（依目前完成過濾分桶）、並由此拖回清單
- 已無「作業／考試／全部」類型篩選 UI（篩選 pills 已拆除）
- 已完成（Canvas 已繳 + 手動標記完成，見 completion.js 的 isDone）一律不進待辦；沒有「已繳交」過濾，已完成的作業只在各課程詳情的「已完成」區

**頁面切換動畫：**
- 學期待辦 ↔ 課程（#15）：`switchPage` 直接畫出目標頁，新頁以 WAAPI 淡入＋12px 水平位移（`MOTION.panelIn` 300ms，方向依頁序，無 fill）——**沒有 slider、沒有 innerHTML 字串複製、沒有收尾 timer、不用 rAF**，切換期間點擊不會失效；再按一次直接取消進行中的動畫（`_pageAnim`）。`settlePageSwitch()`（goToPage／進詳情／popstate）讓進行中的淡入立即落定。原本 470ms 的 `.page-slider` 連同 QA 對它的修正（巢狀 slider、收尾 timer 晚到重畫，QA #192／#199）一起移除——那些問題在這版不存在
- 課程卡片 ↔ 詳情：View Transitions API morph（0.28s，命名元素：`course-shell`、`course-code`、`course-name`、`course-badge`、`course-meta`）。從週卡開詳情時課名對課名配對、作業名不命名（#17）
- **焦點與返回（#2／#27）**：開詳情時焦點在 VT update 裡移到詳情標題 `.detail-name-text`（tabindex=-1，`focusDetailHeading`，preventScroll 不打斷 morph）；回清單時還給來源週卡／課程卡／側欄課程項（`_detailOrigin.focusSel`，找不到落在 `#page-title`）。從週卡開的詳情按 Back：`.week-right` 捲回開詳情前的位置，該卡在可視範圍內才 morph 回它，否則詳情原地淡出（`returnMorphTarget`）
- **導覽狀態同步設定**：`showCourseDetail`／`showGridView` 在呼叫當下就設好 `currentView`／`currentCourseId`，VT callback 只負責畫，晚到時若狀態已被後來的導覽改掉就略過（連點兩門課、morph 中途 Back／點側欄）。進行中的那一段記在 `_morph`（`startMorph`，#42）：舊 transition 的 finished 清理只清自己命名的元素，不會把下一段剛設好的名字清掉；開新 morph 前 `clearStaleMorphNames()` 清掉進行中那段殘留的名字（同名殘留會讓新 transition 以 InvalidStateError 中止）；不走 VT 的導覽（goToPage、fallback、popstate）先 `_skipMorph()`；`transition.ready` 的 rejection 一律吞掉
- 課程卡分頁索引 `cardPages`（`cardPageKey` → courseId），`renderCardBottom` 把夾過的頁寫回（清單縮短後第一下「‹」就有反應）
- 首次同步 skeleton 的形狀＝落地版面（`currentPage==='week'` → 進度環＋分級摘要＋2 欄卡片的 `.skel-week`；否則課程卡 grid）；同步進行中（`_syncInFlight`）`loadData()` 的空資料分支改畫 skeleton（skeleton 期間換語言等不會變成「尚無資料」），`applyUILanguage` 保留按鈕三點。skeleton 畫在 `#sync-skeleton` 疊層裡，資料落地後與真內容交叉淡換（`dismissSyncSkeleton`，不再硬切＋空白一幀），shimmer 為 linear（#43）
- Sidebar 在 morph 期間靜止（`view-transition-name: sidebar`，`animation: none`）
- **注意**：若課程名稱 `div.detail-name` 內有 inline 元素（如鉛筆按鈕），需確保按鈕為 `position: absolute`（不影響 layout box），否則 View Transition 捕捉到不同高度會產生動畫跳動

**瀏覽器上一頁整合（History API）：**
- SPA 導航接上瀏覽器歷史，系統慣用的返回（Back 手勢／按鈕／Cmd+[／Alt+←）可退出課程詳情回到清單
- 模型：清單（週待辦／課程 grid）永遠是**同一個** history entry——橫向切換（`switchPage`／`goToPage`）用 `replaceState`（`syncHistory()`）更新它、不疊返回步；**開課程詳情**才 `pushState` 疊一步（詳情內換課用 `replaceState` swap，Back 仍直接回清單）
- `_appLocation()` 為 entry 狀態 `{app:'due', page, view, courseId}`；`popstate` 依目標 state 還原畫面，期間 `_suppressHistory=true` 擋掉再寫 history，並把到達的 entry 改寫成實際畫面。2.x 舊 entry 帶的 `showSubmitted` 欄位一律忽略
- 目標課程已不在資料中（換學期同步後 Forward、或正在看的課被同步移除）→ 不進幽靈詳情，留在／退回清單並 `_replaceEntryWithList()`
- reload：啟動時若 `history.state.app==='due'` 就依它還原頁面與課程詳情（不再覆寫回週待辦）；進詳情一律 `updateSideNav()`（學期待辦／課程熄燈、頂部計數同步）
- `← 返回` 按鈕與瀏覽器返回統一走 `history.back()` → `popstate`；按鈕常駐於 `.page-tabs`，click 只在 top-level 綁一次（不可綁在 `renderCourseDetailSection` 裡：詳情會被勾選／拖曳／即時刷新反覆重繪，listener 累積會一次連發多個 `history.back()` 退出 dashboard，QA P1-8）；`showGridView()` 現依 `currentPage` 回對應清單（不再寫死回 courses grid，順帶修正「從週待辦開課程、Back 卻回課程頁」）
- 動導航函式（`showCourseDetail`/`showGridView`/`switchPage`/`goToPage`）時務必同步維護對應的 push/replace，否則返回行為會錯亂

**新手教學（Welcome Modal，5 頁）：**
- 首次安裝自動開啟（`?welcome=1`），設定選單「使用教學」可重開；換頁為 translateX 滑動（track 500%、每步 20%，`welcomeGoStep` 位移 `(n-1)*20%`，完成頁按鈕判斷 `n===5`）。開過後以 `history.replaceState` 把 `welcome` 參數從網址拿掉（保留其他參數、hash 與 history state），重新整理不會再跳出（QA #48）
- 只有目前那頁可互動：其餘投影片設 `inert`（`_welcomeSyncSlides`），Tab 不會聚焦到畫面外的連結而把 `overflow:hidden` 的軌道捲走；`.welcome-main-area.scrollLeft` 開教學／換頁時歸零；按鈕列固定兩個節點（上一步／主按鈕），換頁只就地改文字、`data-wgo` 與 class，焦點留在原按鈕上（上一步要消失時先交給主按鈕，#8）；focus trap 的頭尾排除 inert 子樹（QA P2-13）。`.welcome-main-area` 用 `overflow: clip`（不可捲動，Tab 也捲不歪）；開教學以 forced reflow 直接歸位到第 1 頁（不靠 rAF）；減少動態時換頁 crossfade（#9）
- 頁面：1 歡迎（右側為 HTML/CSS 迷你 Dashboard mock——SVG stroke 進度環＋分級摘要列；文字隨語言切換：標題 `wMockTitle`、環與摘要沿用真介面的 key、卡片日期以 `dueWithRel` 產生）→ 2 登入 Canvas → 3 釘選（`icons/pin_guide.png`，圖中圖示為 DUE 商標；alt 走 `wPinAlt`；載入失敗由 JS 收起預覽框——MV3 CSP 擋 inline onerror，QA #157）→ 4 拖曳整理（文案明講「進入任一課程頁」；右側 inline SVG 示意圖：課程大卡片內含 header、作業清單、浮起拖曳列、已隱藏區與隱藏/還原雙向箭頭；SVG 文字 `wds-*` 隨語言替換，箭頭旁直排短標中文逐字、英文轉 90°，見 `setSvgVerticalLabel`）→ 5 一切就緒
- **登入 Canvas 自動跳回**（spec 2026-07-23-onboarding-redesign）：點連結（`openCanvasTab`：點擊時直接讀 storage 的 `canvasBaseUrl`；為空時 fallback `DEFAULT_CANVAS_URL`＝`https://hkust-gz.instructure.com`，此時連結文字明講「HKUST(GZ) Canvas」並附其他學校說明 `wCanvasOtherSchool`：打開網址結尾是 .instructure.com 的學校 Canvas）。**連結文字與目標出自同一份狀態**（`_welcomeCanvasBase`）：開教學、進第 2 頁、點擊當下、同步落地後都重讀 `canvasBaseUrl` 並重畫該行（`renderWelcomeCanvasLine`），不會寫著 HKUST(GZ) 卻開別校（review OB-3）。開分頁後「武裝」10 分鐘——`storage.onChanged` 只看 `lastSync` 落地（未登入時 API 401、lastSync 不動，不會過早跳回）→ `loadData()` 刷新、關閉開出的分頁、聚焦回 dashboard、連結旁顯示「✓ 已同步」；輔以 `tabs.onUpdated` 在 Canvas 分頁載入完成時補發手動 SYNC（繞過 5 分鐘節流）。chrome.* 呼叫皆守衛（dev harness 只 stub 部分 API）
- canvas link 用**事件委派**綁在 overlay 上（`applyWelcomeTranslations` 以 innerHTML 重建該連結，直接綁定會失效）
- i18n keys：`wTitle1-5`／`wBody1-5`／`wStep2Li*`／`wStep3Li*`／`wStep4Li1`／`wFeat*`／`wSupport5`／`wCanvasSynced`／`wCanvasOtherSchool`／`wPinAlt`／`wMock*`，三語言齊備

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
9. 完成標記動畫：勾選後不立即重繪，該列跑 1.5 秒撤銷窗口＋碎點爆才移除（`COMPLETE_DELAY_MS = 1500`）。`dashboard.js` 有一個**常駐** `storage.onChanged` 監聽器（QA P1-3）：所有畫面相關 key 的新值一律併進 `_currentData`（`_mergeIntoCurrentData`；事件依寫入順序送達，最後收斂到 storage 真值）；本頁 `updateShared` 寫出的回聲（`_selfWrites`，記錄與比對一律用 `_canonJson`＝物件 key 遞迴排序後的 JSON：真 Chrome storage 讀回的物件 key 依字典序，不等於寫入時的插入順序）只併資料、不重繪，所以寫入 `manualDone` 不會打斷動畫；來自別處（背景同步、popup、其他分頁）的變更 → `requestRefresh()`，等 `isUiIdle()`（無拖曳；**任何一項還在撤銷窗內**〔`_completeTimers` 非空〕——重建會把其他項的倒數一起清掉；無離場／碎點爆／落點飛入〔`.completing`／`.bursting`／`.drag-clone` 只算畫面上看得到的，`getClientRects()` 非空——撤銷窗口中導覽離開時，該列/卡會殘留在已 `display:none` 的詳情或 main-section 直到該容器下次重繪，不能因此永遠擋住刷新〕；FLIP 補位（WAAPI id `reflow`）與頁面切換淡入（`_pageAnim`）沒在跑；沒有課程 morph（`view-transition-name` 殘留連續超過 2 秒不算）；焦點不在輸入框；無 modal 開著）才 `refreshView()`：以 `_currentData` 原地 `render()`（不重讀 storage），並還原捲動、已隱藏區開合、展開的描述、成績計算器開合（`openPanelInstant`，不重播展開）與焦點（`_focusSelector` 對沒有 id 的列內控制項——拖曳握把、描述開關、組標題——冠上所在列／組的 selector，焦點回到同一列而不是第一列）（自訂作業新增/編輯/刪除存檔後也走 `refreshView()`，不 `loadData()`——在已隱藏區編輯不會整區收起）；尚未以資料渲染過（首次同步落地）或資料被清空則走 `loadData()`。武裝期間的「登入 Canvas 自動跳回」也在同一個監聽器裡（`lastSync` 落地 → `_returnToDashboard()`）。時間驅動：header「N 分鐘前同步」每 60 秒重算（`refreshHeaderMeta`）；分頁回到前景且距上次 `render()`（`_lastRenderAt`）超過 60 秒就重繪；前景時每 5 分鐘重繪一次（逾期分組、7/30 天邊界、考試結束都隨時間變）。dev harness 的 storage stub 會在 set/remove 實際改值時發 `onChanged`，並比照 Chrome 把讀回／事件中的物件 key 遞迴排序（只差 key 順序的寫入不發事件）
10. AI 分析結果：background（`analysisRunner` 的 `recordOutcome`）以 read-modify-write 寫入 `customWeights`；dashboard 由第 9 條的常駐 `storage.onChanged` 併進 `_currentData`，閒置時重繪並保留展開狀態（不另外重繪）。background 另送 `GRADING_WEIGHTS_UPDATED` 訊息，dashboard 只用它刷新開著的 AI 設定 modal 狀態列。**AI 程式碼隔離**：AI 邏輯一律放 `extension/ai/`（modal 在 `dashboard/aiSettings.js`），`dashboard.js` 只保留這些接點——設定選單 click（`DueAiSettings.open`）、`applyUILanguage` 末尾一行、Esc `closers`、a11y 陣列（`setupModalA11y`）、`MODAL_OVERLAY_IDS`、`GRADING_WEIGHTS_UPDATED` 監聽，以及 2026-10-25 的 D2／D3：`loadData` 讀 `gradingAnalysis`／`aiConfig`、onChanged 更新 `_aiConfigured`、`isAiConfigured`／`isAiCustomWeights`／`weightSourceHtml`（規則都呼叫 `DueGradingRules`，不在 dashboard 重寫）、清除鈕文字與 `AI_RUN_NOW`；反方向 `aiSettings.js` 只借用 dashboard 的 `trackBackdropPress`／`isBackdropClick`（`typeof` 守衛）
11. 單元測試（全部，無依賴）：`for t in extension/background.test.js extension/dashboard/*.test.js extension/ai/*.test.js; do node $t; done`。`background.test.js` 以 vm 載入 background.js，`importScripts` 與 AI 模組入口（`scheduleGradingAnalysis`／`handleAiMessage`）在測試裡是 stub，AI 模組本身由 `extension/ai/*.test.js` 測

---

## 待開發功能

- 成績計算器顯示優化（目前 accordion 折疊；header 是 div，鍵盤無法開合）
- 多學期 / 歸檔課程過濾

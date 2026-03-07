# Canvas Dashboard — 項目說明書

## 項目概述

這是一個 Chrome 擴充功能，幫助 HKUST(GZ) 的學生從 Canvas LMS 自動拉取課程資料，
並在一個美觀的 Dashboard 上顯示所有作業、截止日期、評分比重和項目要求。

目標是讓學生不需要打開 Canvas，就能知道「現在該做什麼、怎麼做、什麼時候要做完」。

---

## 關鍵背景資訊

- **學校 Canvas 網址**：`https://hkust-gz.instructure.com`
- **重要限制**：學校不允許學生自己產生 Personal Access Token，所以必須透過 Chrome 擴充功能借用瀏覽器的登入狀態（Cookie）來呼叫 Canvas API，不能用 Bearer Token 的方式
- **Canvas API** 不需要額外 header，Chrome 擴充功能在使用者已登入的情況下直接 fetch 即可

---

## 專案結構

```
canvas-dashboard/
├── CLAUDE.md                  ← 你現在看到的這個檔案
├── extension/                 ← Chrome 擴充功能
│   ├── manifest.json          ← 擴充功能設定（Manifest V3）
│   ├── background.js          ← Service worker，負責呼叫 Canvas API 和存資料
│   ├── popup.html             ← 點擊擴充功能圖示的小視窗
│   └── popup.js               ← popup 的邏輯
└── dashboard/
    ├── index.html             ← 主要 Dashboard 頁面（完整介面）
    └── dashboard.js           ← Dashboard 的資料讀取和渲染邏輯
```

---

## 技術規格

### Chrome 擴充功能

- **Manifest Version**：3（必須用 V3）
- **Permissions**：`storage`、`activeTab`、`scripting`
- **Host Permissions**：`https://hkust-gz.instructure.com/*`
- **背景執行**：使用 Service Worker（background.js）

### Canvas API 端點

```
GET /api/v1/courses?enrollment_state=active&per_page=50
→ 拿所有目前選修的課程

GET /api/v1/courses/:id/assignments?per_page=50&include[]=submission
→ 拿某門課的所有作業（含繳交狀態）

GET /api/v1/courses/:id/assignment_groups?include[]=assignments&include[]=group_weight
→ 拿評分比重分組

GET /api/v1/courses/:id/files?per_page=50
→ 拿課程檔案列表（含下載連結）
```

注意：Canvas API 有分頁，需要處理 `Link` header 的 `rel="next"`

### 資料儲存

- 用 `chrome.storage.local` 存所有從 API 拿到的資料
- 存的格式：
```json
{
  "lastSync": "2026-03-06T10:00:00Z",
  "courses": [...],
  "assignments": { "courseId": [...] },
  "assignmentGroups": { "courseId": [...] }
}
```

---

## 設計規範

嚴格遵守 Anthropic 品牌設計語言：

### 顏色
```css
--bg:       #faf9f5;   /* 暖米白，頁面背景 */
--surface:  #f2f0e8;   /* 稍深的米白，卡片背景 */
--dark:     #141413;   /* 近黑，主要文字 */
--mid:      #9a9890;   /* 中灰，次要文字 */
--muted:    #7c7a72;   /* 深灰，說明文字 */
--border:   #dedad0;   /* 邊框顏色 */
--orange:   #d97757;   /* 主強調色 */
--blue:     #6a9bcc;   /* 次強調色 */
--green:    #788c5d;   /* 第三強調色 */
--warm:     #b09050;   /* 暖黃 */
```

### 字體
```css
標題：'Source Serif 4', Georgia, serif（font-weight: 400）
內文：'DM Sans', sans-serif（font-weight: 300）
代碼/數字/標籤：'DM Mono', monospace
```

### 風格原則
- 大量留白，不要擁擠
- 邊框用細線（1px），圓角保守（4–8px）
- 不用深色背景（整體 light mode）
- Section 標題用 DM Mono 小字大寫間距
- 動畫要克制，只用在 accordion 展開等必要互動

### 截止日期顏色規則
- 7 天內：橘紅 `var(--orange)`
- 8–30 天：暖黃 `var(--warm)`
- 30 天以上：藍色 `var(--blue)`
- 已過期：灰色 `var(--mid)`，opacity 0.4
- 考試類：紫色 `#a86070`

---

## 功能規格（MVP）

### background.js 需要做到
1. 監聽使用者造訪 `hkust-gz.instructure.com` 任意頁面
2. 觸發 Canvas API 同步（拉取課程、作業、評分比重）
3. 處理 API 分頁（Link header）
4. 把資料存入 `chrome.storage.local`
5. 記錄 `lastSync` 時間戳

### popup.html 需要做到
1. 顯示「上次同步：X 分鐘前」
2. 顯示「手動同步」按鈕
3. 顯示「開啟 Dashboard」按鈕（打開 dashboard/index.html）
4. 簡單顯示今天到期的作業數量

### dashboard/index.html 需要做到
1. 從 `chrome.storage.local` 讀取所有資料
2. 頂部「本週待辦」區塊：列出 7 天內到期的所有作業
3. 每門課的卡片，點擊展開顯示：
   - 評分比重（視覺化 bar chart）
   - 所有作業和截止日期（含距今天數）
   - 點擊作業可展開看作業描述原文
4. 自動依緊急程度排序
5. 篩選功能：全部 / 未繳 / 已繳

---

## 目前開發階段

**現在：MVP**
- [ ] Chrome 擴充功能骨架
- [ ] Canvas API 整合（課程 + 作業 + 評分比重）
- [ ] Dashboard 基本介面

**之後（MVP 完成後才做）**
- PDF 自動下載和解析
- Claude API 整合（分析作業要求、項目里程碑,目前先讓我填入自己的llm api key，之後再想辦法優化）
- 成績計算器（輸入分數即時算加權總分）
- 項目深度分析面板

---

## 開發注意事項

1. 每次修改 extension/ 下的檔案後，需要在 `chrome://extensions` 重新載入擴充功能才會生效
2. background.js 是 Service Worker，不能用 `window` 或 `document`
3. Canvas API 回傳的日期格式是 ISO 8601（`2026-03-15T23:59:59Z`），顯示前要轉換時區
4. 有些作業可能沒有截止日期（`due_at` 為 null），需要處理這個情況
5. API 呼叫要加 `per_page=50` 減少分頁次數

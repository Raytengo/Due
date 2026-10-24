# 純文字供應商也能讀 PDF 大綱（pdf.js 抽字）— 設計文件

- **日期**：2026-09-03
- **狀態**：範圍與細節已與使用者確認，待實作
- **前身**：`docs/superpowers/specs/2026-09-03-ai-grading-weights-restore-design.md`（本次改動的 base；該 spec 裡「PDF 只交給支援 PDF 的模型（Gemini），其餘供應商略過」的限制在本次拿掉）
- **觸發**：使用者用 NVIDIA NIM 跑分析時，多門課因為 syllabus 是 PDF 而被判定「找不到大綱」（`notFound`，`source: unsupported_pdf`）

---

## 0. 決策摘要（已確認）

| 項目 | 決定 |
|------|------|
| 範圍 | Qwen／DeepSeek／NVIDIA 三個純文字供應商都做（不只 NVIDIA），因為抽字邏輯不分供應商 |
| 抽字機制 | vendor 進 pdf.js（legacy／no-worker build），不手寫解析器——PDF 文字抽取牽涉壓縮流、內嵌字型、ToUnicode CMap，手寫版本正確率風險太高 |
| 觸發點 | 非 Gemini 供應商原本「偵測到 PDF 就跳過、回 `unsupported_pdf`」的地方，改成照樣下載 PDF 後呼叫抽字 |
| Gemini 路徑 | 完全不變，繼續送原始 PDF bytes（`inlineData`），因為它自帶 OCR、掃描件也讀得到，覆蓋率比抽字高 |
| 抽取失敗／太短 | 視同「這個候選檔案沒有材料」，繼續找下一個候選；全部試完仍沒有 → 現有 `no syllabus material` / `notFound` 分支（沿用 7 天冷卻），不特別區分「掃描件」與「其他找不到」的訊息 |
| AI 挑檔 | 目前只有 Gemini 在關鍵字比對不到時會呼叫 AI 從檔名挑檔；改為所有供應商都會，因為現在大家都能真的讀到檔案內容 |
| 權限 | `requiredOrigins()` 拿掉 `provider.supportsPdf` 的條件，所有供應商存設定時都會請求 `https://*.canvas-user-content.com/*`。已存過 Qwen/DeepSeek/NVIDIA 設定的使用者下次存設定會重新跳一次授權提示——使用者已確認可接受，不做「跳過既有使用者」的特殊處理 |
| 實作方式 | subagent（Opus 5）依本 spec 實作；純邏輯進 UMD 模組並附 node 測試 |

---

## 1. 範圍

### 做（IN）
1. 新檔 `extension/ai/pdfText.js`：`bytes → text` 純函式，包 pdf.js
2. vendor `extension/ai/vendor/pdf.min.js`（pdf.js legacy/no-worker build，pin 版本）
3. `analysisRunner.js`：非 Gemini 供應商的 PDF 下載＋抽字路徑；AI 挑檔擴大到所有供應商
4. `gradingRules.js`：`requiredOrigins()` 拿掉 provider 條件；新增 `MAX_EXTRACTED_TEXT_CHARS`
5. `aiSettings.js`：更新/移除「此供應商只能讀 syllabus 文字」的文案
6. 測試：`pdfText.test.js`（新）＋ `analysisRunner.test.js`／`gradingRules.test.js` 補案例
7. CLAUDE.md AI 章節同步更新（PDF 限制的描述）

### 不做（OUT）
- 掃描件／圖片型 PDF 的 OCR（那是 Gemini 專屬能力，維持現狀）
- 逐頁圖片轉換（`image_url` 多模態路徑）——見對話中方案 2，本次不做
- 前端顯示邏輯（圓餅圖／編輯器等）不動，延續前身 spec 的原則
- 既有使用者的權限重新授權特殊處理（已確認照舊彈窗）

---

## 2. 架構

新增純函式模組 `extension/ai/pdfText.js`（跟 `gradingRules.js`/`providers.js` 同風格：UMD wrapper，可在 node 測試），內部依賴 vendor 進來的 `extension/ai/vendor/pdf.min.js`（pdf.js legacy/no-worker build，pin 死版本號，檔頭註明來源版本與授權）。`background.js` 用 `importScripts` 依序載入 vendor 檔與 `pdfText.js`。`analysisRunner.js` 在下載到 PDF bytes 後呼叫 `DuePdfText.extractText(bytes)` 拿純文字，取代原本「非 Gemini 供應商直接略過 PDF」的邏輯。

Gemini 路徑完全不變（仍走 `inlineData` 原始 PDF bytes）。抽字只加在「其餘供應商」這條路，兩條路徑在 `analyzeCourse` 內用既有的 `providerSupportsPdf` 旗標分流。

`pdfText.js` 只管「bytes → text 或 `''`」，不碰 fetch、不碰 provider 邏輯；`analysisRunner.js` 原本的下載/預算/來源標記機制原封不動沿用。

---

## 3. 元件與資料流

### `extension/ai/pdfText.js`（新檔）
```js
async function extractText(bytes) // → Promise<string>
```
- 用 pdf.js `disableWorker`/no-worker 模式（同執行緒跑，SW 環境不能穩定 spawn 額外 Worker）解析 `bytes`
- 逐頁呼叫 `getTextContent()`，頁與頁之間插入空行後串接
- 內部 `try/catch` 吃掉 pdf.js 例外（加密／損毀／非標準 PDF），統一回傳 `''`
- 超過 `MAX_EXTRACTED_TEXT_CHARS`（見下）就截斷

### `extension/ai/gradingRules.js`（改）
- `requiredOrigins(provider)`：
  ```js
  // 改前：if (p.supportsPdf) out.push(PDF_PERMISSION_ORIGIN);
  // 改後：一律 push，因為現在所有供應商都要下載 PDF 來抽字
  out.push(PDF_PERMISSION_ORIGIN);
  ```
- 新增常數 `MAX_EXTRACTED_TEXT_CHARS = 30000`（約可覆蓋數十頁大綱，同時不至於把單一 LLM 請求的 token 預算撐爆）

### `extension/ai/analysisRunner.js`（改）
`analyzeCourse` 內三處要動：

1. **syllabus 內連結的 PDF**（現有 Step 2）：
   - 現在：`if (linkedFileIds.length && !providerSupportsPdf) return pdfModelRequired();`（直接放棄整門課）
   - 改為：不再提早 return；不論供應商都下載（沿用 `MAX_LINKED_PDFS`／`tryFetchPdf`／`pushPdf` 的位元組預算），下載成功後：
     - `providerSupportsPdf`（Gemini）→ 照舊 `parts.push({type:'pdf', ...})`
     - 否則 → `await DuePdfText.extractText(bytes)`，長度 > `MIN_SYLLABUS_TEXT_CHARS` 才 `parts.push({type:'text', text})` 並標記 `flags.syllabusPdf = true`；太短就當這個檔案沒東西，不 push，繼續走後面的 syllabus 文字／課程檔案候選

2. **課程檔案關鍵字比對**（現有 Step 3 前半）：
   - 現在：`if (!providerSupportsPdf && !parts.length) { ...找到就 return pdfModelRequired(); }`
   - 改為：拿掉這整段提早 return；讓流程直接進入下面「AI 挑檔」那段（見第 3 點），關鍵字比對到的檔案跟 AI 挑到的檔案走同一套下載＋抽字邏輯

3. **AI 挑檔下載**（現有 Step 3 後半，目前 `if (wantPdf)` 包住）：
   - 改為 `if (ctx.pdfAllowed)`（拿掉 `providerSupportsPdf` 條件，所有供應商都跑這段）
   - `pushPdf` 之後同第 1 點：Gemini 送原始 PDF part，其餘供應商送抽出來的文字 part（抽取失敗/太短就不 push，`picked` 這個候選作廢，不繼續試同一輪的下一個檔案——維持現有「只挑一個檔案」的行為，抽取失敗直接落到最後的 `no syllabus material`）

`pdfModelRequired()` 函式與 `unsupported_pdf` source、`PDF_MODEL_REQUIRED_NOTE` 常數整組移除（不再有「這供應商讀不了 PDF」這種 outcome；抽取失敗一律併入現有 `notFound` / `no syllabus material`）。

### `extension/dashboard/aiSettings.js`（小改）
- `#ai-text-only-hint` 的文案（目前「此供應商只能讀 syllabus 文字；PDF 大綱會略過，只交給支援 PDF 的模型」）改為說明「PDF 大綱會自動轉文字讀取；掃描/圖片型 PDF 讀不到」，或視覺上直接把這個 hint 移除（因為「純文字供應商」的限制已經大幅弱化，只剩掃描件讀不到，跟 Gemini 路徑差異不大到需要一個永久提示）——實作時可視覺呈現簡化為一行小字說明，不需要整塊 hint

---

## 4. 錯誤處理

- pdf.js 解析丟例外（加密／損毀／非標準 PDF）：`extractText` 內部 catch，回傳 `''`，呼叫端視同「這個檔案沒有可用文字」，不中斷整個分析流程
- 抽出文字太短（< `MIN_SYLLABUS_TEXT_CHARS`）：多半是掃描件/圖片型 PDF，同上視同無材料，沿用現有 `notFound` 冷卻（不特別區分掃描件與其他找不到的原因）
- 抽出文字超過 `MAX_EXTRACTED_TEXT_CHARS`：截斷後仍照常送出（大綱重點通常在前段，截斷比整份放棄更好）
- pdf.js 函式庫載入失敗（vendor 檔案損毀等）：開發期就該抓到，不加 runtime fallback；讓例外自然拋出，被外層 `catch` 收斂成該課的 `error` outcome（沿用現有 24 小時冷卻）

---

## 5. 測試

- `extension/ai/pdfText.test.js`（新）：node 手刻一個最小、未壓縮、內容單純的合法 PDF fixture（不依賴外部檔案/工具產生），驗證：
  - `extractText` 能正確抽出已知字串
  - 餵一段非 PDF bytes（例如純文字或亂數 bytes）回傳 `''`，不丟例外
- `extension/ai/analysisRunner.test.js`（現有 node:vm harness，補案例）：
  - 非 Gemini 供應商：stub `DuePdfText.extractText` 回傳固定文字 → 驗證 PDF 被下載、抽出的文字進了 `parts`、最終呼叫供應商
  - 非 Gemini 供應商：stub `extractText` 回傳 `''` → 驗證正確落到 `notFound: no syllabus material`（沒有其他材料的情況下）
  - AI 挑檔現在對非 Gemini 供應商也會觸發：驗證關鍵字比對不到時仍會呼叫 `selectSyllabusPdfWithAI`
- `extension/ai/gradingRules.test.js`（補案例）：`requiredOrigins('qwen')` / `requiredOrigins('deepseek')` / `requiredOrigins('nvidia')` 都要包含 `PDF_PERMISSION_ORIGIN`

---

## 6. 文件更新

- `CLAUDE.md` AI 評分比重分析章節：「PDF 只在有 optional 權限且供應商支援 PDF（Gemini）時下載」這句話要改，說明現在所有供應商都會下載並嘗試抽字，只有 Gemini 走原始 bytes、其餘走抽字文字；掃描件/圖片型 PDF 仍只有 Gemini 讀得到

---

## 7. 開放但已有預設答案的細節（實作時照此執行，不再另外確認）

- `MAX_EXTRACTED_TEXT_CHARS` 訂為 30000 字，之後若實測發現常被截斷或 token 預算吃緊可再調整，不阻塞本次實作
- pdf.js 版本：實作時 subagent 選一個穩定的 legacy build 版本 pin 死，並在 vendor 檔頭註記版本號與來源（供之後手動升級對照）

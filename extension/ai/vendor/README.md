# vendor/pdf.js

- **來源**：`pdfjs-dist@3.11.174`（npm，Mozilla 官方），legacy/no-module build
  - `pdf.min.js` ← `legacy/build/pdf.min.js`
  - `pdf.worker.min.js` ← `legacy/build/pdf.worker.min.js`
- **授權**：Apache License 2.0（見各檔案內 `@licstart`/`@licend` 區塊，或 `PDFJS_LICENSE`）
- **為何兩個檔案都要**：service worker 裡沒有 `window`，pdf.js 建立真正的 `Worker` 會失敗並自動退回 fake worker（同執行緒跑）；fake worker 需要 `pdf.worker.min.js` 提供 `WorkerMessageHandler`。載入順序：先 `pdf.worker.min.js`（設定全域 `pdfjsWorker`），再 `pdf.min.js`（設定全域 `pdfjsLib`，其 fake-worker 邏輯會直接抓已存在的 `pdfjsWorker`，不會嘗試 `new Worker()` 或 fetch 任何檔案）
- **升級方式**：`npm pack pdfjs-dist@<新版本>`，解壓後用 `legacy/build/pdf.min.js` 與 `legacy/build/pdf.worker.min.js` 覆蓋這兩個檔案，更新本檔版本號；升級後務必重跑 `extension/ai/pdfText.test.js`
- **不含**：`pdf_viewer.js`、`image_decoders`、SVG 圖示等渲染/UI 相關檔案——本專案只用文字抽取（`getTextContent`），不 render 頁面，用不到

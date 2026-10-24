(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DuePdfText = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  // ═══════════════════════════════════════════════════════════════
  // Due AI：PDF 抽字（pdf.js 包裝）
  // 只管「bytes → text 或 ''」：不 fetch、不碰供應商邏輯、不做長度政策
  //（截斷與「太短視同沒材料」都在 analysisRunner，常數在 gradingRules）
  // 依賴 vendor 的 pdf.js（載入順序：pdf.worker.min.js → pdf.min.js → 本檔），
  // 詳見 ai/vendor/README.md
  // spec：docs/superpowers/specs/2026-09-03-pdf-text-extraction-design.md
  // ═══════════════════════════════════════════════════════════════

  async function extractText(bytes) {
    try {
      const pdfjsLib = root.pdfjsLib;
      if (!pdfjsLib || !bytes) return '';
      // isEvalSupported: false 是必要的——MV3 service worker 的 CSP 不准 eval／new Function
      // useSystemFonts: false——worker 環境沒有 document.fonts
      const task = pdfjsLib.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: false });
      const doc = await task.promise;
      const pageTexts = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const items = (content && content.items) || [];
        pageTexts.push(items.map((it) => (it && typeof it.str === 'string' ? it.str : '')).join(' '));
      }
      return pageTexts.join('\n');
    } catch (_) {
      // 加密／損毀／非標準 PDF、掃描件解析失敗：一律當「這個檔案沒有可用文字」
      return '';
    }
  }

  return { extractText };
});

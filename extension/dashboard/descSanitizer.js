(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueDescSanitizer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ── 白名單標籤（一律小寫比對）：保留並重建乾淨元素 ──
  const ALLOWED_TAGS = new Set([
    'p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'code', 'pre', 'a',
  ]);

  // ── 危險標籤：整棵子樹移除（連同其文字內容一併丟棄）──
  const DROP_TAGS = new Set([
    'script', 'style', 'iframe', 'img', 'video', 'object', 'embed',
  ]);

  // ── 標題標籤：降級為 <strong>…</strong><br>（Canvas 描述常見 h1-h6）──
  const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

  // ── href 分類（大小寫不敏感、去除前後空白後比對）──
  //    'web'：http/https 絕對網址 → 開新分頁
  //    'mailto'：mailto:（教師留的 Email，QA #158）→ 交給郵件程式，不開新分頁
  //    'fragment'：頁內錨點 #xxx → 由 dashboard 攔截，捲到描述內對應的 data-desc-anchor（不改網址）
  //    其餘（javascript:/data:/vbscript:/相對路徑/協定相對(//)/空值/裸 #）→ null，一律拒絕
  function hrefKind(href) {
    if (typeof href !== 'string') return null;
    const trimmed = href.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return 'web';
    if (/^mailto:\S/i.test(trimmed)) return 'mailto';
    if (/^#\S+$/.test(trimmed)) return 'fragment';
    return null;
  }

  function isSafeHref(href) {
    return hrefKind(href) !== null;
  }

  // ── 錨點目標：來源元素的 id（或 <a name>）→ 以 data-desc-anchor 標記保留 ──
  //    不沿用 id 本身：描述與 dashboard 同一份 DOM，外來 id 會撞名／DOM clobbering
  function anchorTargetOf(node) {
    if (!node || typeof node.getAttribute !== 'function') return null;
    const id = (node.getAttribute('id') || '').trim();
    if (id) return id;
    if ((node.tagName || '').toLowerCase() === 'a') {
      const name = (node.getAttribute('name') || '').trim();
      if (name) return name;
    }
    return null;
  }

  // ── 遞迴走訪來源節點的子節點，把清理後的節點附加到目標元素 ──
  function sanitizeChildren(srcParent, destParent, doc) {
    const children = srcParent.childNodes;
    for (let i = 0; i < children.length; i++) {
      sanitizeNode(children[i], destParent, doc);
    }
  }

  function sanitizeNode(node, destParent, doc) {
    // 文字節點：原樣複製（createTextNode 自動處理跳脫，無 XSS 風險）
    if (node.nodeType === 3 /* TEXT_NODE */) {
      destParent.appendChild(doc.createTextNode(node.nodeValue));
      return;
    }
    // 非元素節點（註解、CDATA…）一律忽略
    if (node.nodeType !== 1 /* ELEMENT_NODE */) return;

    const tag = (node.tagName || '').toLowerCase();

    // 危險標籤：整棵子樹移除
    if (DROP_TAGS.has(tag)) return;

    // 帶 id／name 的元素（標題、段落、被 unwrap 的 div/span…）→ 先放一個空的錨點標記，頁內連結才有地方捲過去
    const anchor = anchorTargetOf(node);
    if (anchor) {
      const mark = doc.createElement('a');
      mark.setAttribute('data-desc-anchor', anchor);
      destParent.appendChild(mark);
    }

    // 標題降級：<strong>內容</strong> + 換行
    if (HEADING_TAGS.has(tag)) {
      const strong = doc.createElement('strong');
      sanitizeChildren(node, strong, doc);
      destParent.appendChild(strong);
      destParent.appendChild(doc.createElement('br'));
      return;
    }

    // 白名單標籤：以 createElement 重建，僅複製明確允許的屬性
    if (ALLOWED_TAGS.has(tag)) {
      const clean = doc.createElement(tag);
      if (tag === 'a') {
        const href = node.getAttribute('href');
        const kind = hrefKind(href);
        if (kind) clean.setAttribute('href', href.trim());
        if (kind === 'web') {
          clean.setAttribute('target', '_blank');
          clean.setAttribute('rel', 'noopener noreferrer');
        } else if (kind === 'mailto') {
          clean.setAttribute('rel', 'noopener noreferrer');   // 郵件程式接手，不開空白分頁
        }
        // 'fragment'：同頁錨點，點擊由 dashboard 攔截捲動（見 dashboard.js 描述錨點委派）
        // href 不安全 → 不設任何屬性（style/on*/class/id 等一律不複製）
      }
      sanitizeChildren(node, clean, doc);
      destParent.appendChild(clean);
      return;
    }

    // 其餘未知標籤：unwrap（丟棄標籤本身，保留其文字與合法子元素）
    sanitizeChildren(node, destParent, doc);
  }

  // ── 主入口：回傳安全 HTML 字串 ──
  //    node 環境無 DOMParser → 明確拋錯（isSafeHref 等純函式仍可 require 測試）
  function sanitize(html) {
    if (typeof DOMParser === 'undefined') {
      throw new Error('DueDescSanitizer.sanitize requires DOMParser (browser-only)');
    }
    if (!html || typeof html !== 'string') return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = doc.createElement('div');
    // 只走訪 body：DOMParser 會把散落的 <script>/<style> 塞進 head，天然被排除
    sanitizeChildren(doc.body, out, doc);
    return out.innerHTML;
  }

  return {
    sanitize,
    isSafeHref,
    hrefKind,
    anchorTargetOf,
    ALLOWED_TAGS,
    DROP_TAGS,
    HEADING_TAGS,
  };
});

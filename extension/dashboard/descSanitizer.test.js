const assert = require('node:assert/strict');
const DueDescSanitizer = require('./descSanitizer.js');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

// ── isSafeHref：通過 http/https ──
test('isSafeHref: http:// passes', () => {
  assert.equal(DueDescSanitizer.isSafeHref('http://example.com'), true);
});

test('isSafeHref: https:// passes', () => {
  assert.equal(DueDescSanitizer.isSafeHref('https://example.com/path?q=1#frag'), true);
});

test('isSafeHref: uppercase scheme passes (大小寫不敏感)', () => {
  assert.equal(DueDescSanitizer.isSafeHref('HTTPS://EXAMPLE.COM'), true);
  assert.equal(DueDescSanitizer.isSafeHref('HtTp://Example.com'), true);
});

test('isSafeHref: leading/trailing whitespace is trimmed then passes', () => {
  assert.equal(DueDescSanitizer.isSafeHref('   https://example.com  '), true);
  assert.equal(DueDescSanitizer.isSafeHref('\n\thttp://example.com\t'), true);
});

// ── isSafeHref：拒絕危險與非絕對 http(s) ──
test('isSafeHref: javascript: rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref('javascript:alert(1)'), false);
});

test('isSafeHref: javascript: with leading space + case variant rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref(' JAVASCRIPT:alert(1)'), false);
  assert.equal(DueDescSanitizer.isSafeHref('  JavaScript:void(0)'), false);
});

test('isSafeHref: data: rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref('data:text/html,<script>alert(1)</script>'), false);
});

test('isSafeHref: vbscript: rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref('vbscript:msgbox("x")'), false);
});

test('isSafeHref: relative paths rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref('/courses/1/assignments/2'), false);
  assert.equal(DueDescSanitizer.isSafeHref('relative/page.html'), false);
});

test('isSafeHref: protocol-relative (//host) rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref('//evil.example.com'), false);
});

test('isSafeHref: other schemes rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref('ftp://host/file'), false);
  assert.equal(DueDescSanitizer.isSafeHref('tel:+85212345678'), false);
  assert.equal(DueDescSanitizer.isSafeHref('file:///etc/passwd'), false);
});

// ── mailto: 與頁內錨點（#…）保留為可點連結（QA #158）──
test('isSafeHref: mailto: passes (大小寫不敏感、去前後空白)', () => {
  assert.equal(DueDescSanitizer.isSafeHref('mailto:ta@school.edu'), true);
  assert.equal(DueDescSanitizer.isSafeHref('MAILTO:ta@school.edu?subject=Lab%201'), true);
  assert.equal(DueDescSanitizer.isSafeHref('  mailto:ta@school.edu '), true);
});

test('isSafeHref: empty mailto: rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref('mailto:'), false);
  assert.equal(DueDescSanitizer.isSafeHref('mailto: '), false);
});

test('isSafeHref: in-page #anchor passes; bare # rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref('#rubric'), true);
  assert.equal(DueDescSanitizer.isSafeHref('#_Toc12345'), true);
  assert.equal(DueDescSanitizer.isSafeHref('#'), false);
  assert.equal(DueDescSanitizer.isSafeHref('# rubric'), false);
});

test('hrefKind: classifies web / mailto / fragment / unsafe', () => {
  assert.equal(DueDescSanitizer.hrefKind('https://example.com'), 'web');
  assert.equal(DueDescSanitizer.hrefKind('HTTP://example.com'), 'web');
  assert.equal(DueDescSanitizer.hrefKind('mailto:ta@school.edu'), 'mailto');
  assert.equal(DueDescSanitizer.hrefKind('#rubric'), 'fragment');
  assert.equal(DueDescSanitizer.hrefKind('javascript:alert(1)'), null);
  assert.equal(DueDescSanitizer.hrefKind('data:text/html,x'), null);
  assert.equal(DueDescSanitizer.hrefKind('//evil.example/x'), null);
  assert.equal(DueDescSanitizer.hrefKind(null), null);
});

// 錨點目標：來源元素的 id（或 <a name>）以 data-desc-anchor 標記保留（不沿用 id：避免與 dashboard 的 id 衝突／DOM clobbering）
test('anchorTargetOf: id or <a name> becomes the anchor target; others none', () => {
  const el = (tag, attrs) => ({
    tagName: tag.toUpperCase(),
    getAttribute: (k) => (Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null),
  });
  assert.equal(DueDescSanitizer.anchorTargetOf(el('h2', { id: 'rubric' })), 'rubric');
  assert.equal(DueDescSanitizer.anchorTargetOf(el('a', { name: 'top' })), 'top');
  assert.equal(DueDescSanitizer.anchorTargetOf(el('span', { id: '  ' })), null);
  assert.equal(DueDescSanitizer.anchorTargetOf(el('div', { name: 'x' })), null);
  assert.equal(DueDescSanitizer.anchorTargetOf(el('p', {})), null);
});

test('isSafeHref: empty / whitespace-only rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref(''), false);
  assert.equal(DueDescSanitizer.isSafeHref('     '), false);
});

test('isSafeHref: non-string values rejected', () => {
  assert.equal(DueDescSanitizer.isSafeHref(null), false);
  assert.equal(DueDescSanitizer.isSafeHref(undefined), false);
  assert.equal(DueDescSanitizer.isSafeHref(123), false);
  assert.equal(DueDescSanitizer.isSafeHref({}), false);
});

// ── sanitize：node 無 DOMParser → 明確拋錯（DOM 走訪由瀏覽器 harness 驗證）──
test('sanitize: throws a clear error when DOMParser is unavailable (node)', () => {
  assert.throws(() => DueDescSanitizer.sanitize('<p>hi</p>'), /DOMParser/);
});

// ── 白名單集合正確性（供瀏覽器端走訪邏輯依賴）──
test('tag sets: whitelist / drop / heading membership', () => {
  assert.equal(DueDescSanitizer.ALLOWED_TAGS.has('a'), true);
  assert.equal(DueDescSanitizer.ALLOWED_TAGS.has('code'), true);
  assert.equal(DueDescSanitizer.ALLOWED_TAGS.has('script'), false);
  assert.equal(DueDescSanitizer.DROP_TAGS.has('script'), true);
  assert.equal(DueDescSanitizer.DROP_TAGS.has('img'), true);
  assert.equal(DueDescSanitizer.HEADING_TAGS.has('h3'), true);
});

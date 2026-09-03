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
  assert.equal(c.model, 'deepseek-v4-flash');
  assert.equal(c.baseUrl, 'https://api.deepseek.com/v1');
  assert.equal(c.configured, true);
  const q = R.resolveConfig({ provider: 'qwen', apiKey: 'k', model: 'qwen-max', baseUrl: 'https://x.example/v1/' });
  assert.equal(q.model, 'qwen-max');
  assert.equal(q.baseUrl, 'https://x.example/v1/');
});

test('resolveConfig: gemini 忽略殘留的 baseUrl（避免把 Gemini key 送到別家）', () => {
  const c = R.resolveConfig({ provider: 'gemini', apiKey: 'k', baseUrl: 'https://api.deepseek.com/v1' });
  assert.equal(c.baseUrl, 'https://generativelanguage.googleapis.com/v1beta');
});

test('resolveConfig: 非 https 的自訂 baseUrl 一律退回供應商預設（Bearer token 不走明文）', () => {
  assert.equal(R.resolveConfig({ provider: 'deepseek', apiKey: 'k', baseUrl: 'http://evil.example/v1' }).baseUrl, 'https://api.deepseek.com/v1');
  assert.equal(R.resolveConfig({ provider: 'qwen', apiKey: 'k', baseUrl: '//evil.example/v1' }).baseUrl, 'https://dashscope.aliyuncs.com/compatible-mode/v1');
  assert.equal(R.resolveConfig({ provider: 'qwen', apiKey: 'k', baseUrl: 'HTTPS://x.example/v1' }).baseUrl, 'HTTPS://x.example/v1');
});

test('resolveConfig: nvidia → 預設模型與官方 base URL', () => {
  const c = R.resolveConfig({ provider: 'nvidia', apiKey: 'nvapi-x' });
  assert.equal(c.provider, 'nvidia');
  assert.equal(c.model, 'deepseek-ai/deepseek-v4-flash-0731');
  assert.equal(c.baseUrl, 'https://integrate.api.nvidia.com/v1');
  assert.equal(c.configured, true);
});

test('resolveConfig: nvidia 的自訂 baseUrl 也吃 https-only 規則', () => {
  assert.equal(
    R.resolveConfig({ provider: 'nvidia', apiKey: 'k', baseUrl: 'https://nim.example/v1' }).baseUrl,
    'https://nim.example/v1'
  );
  assert.equal(
    R.resolveConfig({ provider: 'nvidia', apiKey: 'k', baseUrl: 'http://nim.example/v1' }).baseUrl,
    'https://integrate.api.nvidia.com/v1'
  );
});

// ── providerHostPermission / requiredOrigins ──
test('providerHostPermission: 只有 nvidia 需要額外 host permission', () => {
  assert.equal(R.providerHostPermission('nvidia'), 'https://integrate.api.nvidia.com/*');
  assert.equal(R.providerHostPermission('deepseek'), null);
  assert.equal(R.providerHostPermission('qwen'), null);
  assert.equal(R.providerHostPermission('gemini'), null);
  assert.equal(R.providerHostPermission('bogus'), null);
  assert.equal(R.providerHostPermission(undefined), null);
});

test('requiredOrigins: 所有供應商都要 PDF 權限（純文字供應商改成下載後抽字），nvidia 另加自己的 host', () => {
  assert.deepEqual(R.requiredOrigins('gemini'), [R.PDF_PERMISSION_ORIGIN]);
  assert.deepEqual(R.requiredOrigins('deepseek'), [R.PDF_PERMISSION_ORIGIN]);
  assert.deepEqual(R.requiredOrigins('qwen'), [R.PDF_PERMISSION_ORIGIN]);
  assert.deepEqual(R.requiredOrigins('nvidia'), ['https://integrate.api.nvidia.com/*', R.PDF_PERMISSION_ORIGIN]);
  assert.deepEqual(R.requiredOrigins('bogus'), [R.PDF_PERMISSION_ORIGIN]);
  assert.deepEqual(R.requiredOrigins(undefined), [R.PDF_PERMISSION_ORIGIN]);
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

test('shouldAnalyze: nextRetryAt 壞字串 → 失效開放（照跑），attempts 上限仍保護', () => {
  const rec = { status: 'notFound', attempts: 1, nextRetryAt: 'garbage' };
  assert.deepEqual(R.shouldAnalyze({ ...base, record: rec }), { run: true, reason: 'retry' });
  assert.deepEqual(R.shouldAnalyze({ ...base, record: { ...rec, attempts: 3 } }), { run: false, reason: 'maxAttempts' });
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

test('nextRecord: 未知 kind → status 收斂為 error（與 error 的重試時間一致）', () => {
  const r = R.nextRecord(undefined, { kind: 'weird', source: 'none' }, NOW, META);
  assert.equal(r.status, 'error');
  assert.equal(r.nextRetryAt, new Date(NOW + 24 * HOUR).toISOString());
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

test('courseStatus: error 冷卻中／attempts 用盡 → 都顯示 error', () => {
  const rec = { status: 'error', attempts: 1, nextRetryAt: new Date(NOW + DAY).toISOString() };
  assert.equal(R.courseStatus({ ...base, record: rec }), 'error');
  assert.equal(R.courseStatus({ ...base, record: { ...rec, attempts: 3 } }), 'error');
});

test('courseStatus: 未知 status 的髒紀錄 → 收斂為 skipped（modal 只認得固定幾種）', () => {
  const rec = { status: 'weird', attempts: 1, nextRetryAt: new Date(NOW + DAY).toISOString() };
  assert.equal(R.courseStatus({ ...base, record: rec }), 'skipped');
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

test('stripHtml: 十六進位實體與四位元組字元（emoji）', () => {
  assert.equal(R.stripHtml('<p>&#x41;&#66;&#128512;</p>'), 'AB😀');
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

test('parseAnalysisResponse: components 不是陣列 → ok:true, found:false', () => {
  const p = R.parseAnalysisResponse('{"found":true,"components":"nope"}');
  assert.equal(p.ok, true);
  assert.equal(p.found, false);
});

test('parseAnalysisResponse: 容忍 JSON 前後的贅字與非 json 圍欄標籤', () => {
  const json = '{"found":true,"components":[{"name":"Exam","weight":100,"description":""}],"notes":""}';
  const after = R.parseAnalysisResponse('```json\n' + json + '\n```\nHope this helps!');
  assert.equal(after.ok, true);
  assert.equal(after.found, true);
  assert.deepEqual(after.components.map((c) => [c.name, c.weight]), [['Exam', 100]]);
  const before = R.parseAnalysisResponse('Sure! Here you go:\n```json\n' + json + '\n```');
  assert.equal(before.ok, true);
  assert.equal(before.found, true);
  const tagged = R.parseAnalysisResponse('```javascript\n' + json + '\n```');
  assert.equal(tagged.ok, true);
  assert.equal(tagged.found, true);
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

test('normalizeWeights: 權重缺漏／非數字（總和 NaN）→ 不採用', () => {
  const n = R.normalizeWeights([{ name: 'A' }, { name: 'B' }]);
  assert.equal(n.ok, false);
  assert.ok(n.reason.startsWith('weights sum'), `reason=${n.reason}`);
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

// ── acceptPdf / rejectBeforeDownload ──
test('acceptPdf: application/pdf 小檔接受；octet-stream 但 %PDF- 魔數也接受', () => {
  assert.equal(R.acceptPdf({ ok: true, contentType: 'application/pdf; charset=binary', byteLength: 1024, head: 'xxxxx' }), true);
  assert.equal(R.acceptPdf({ ok: true, contentType: 'application/octet-stream', byteLength: 1024, head: '%PDF-' }), true);
});

test('acceptPdf: text/html、超過上限、0 bytes、res 非 ok 一律拒絕', () => {
  assert.equal(R.acceptPdf({ ok: true, contentType: 'text/html', byteLength: 1024, head: '<!DOC' }), false);
  assert.equal(R.acceptPdf({ ok: true, contentType: 'application/pdf', byteLength: 11 * 1024 * 1024, head: '%PDF-' }), false);
  assert.equal(R.acceptPdf({ ok: true, contentType: 'application/pdf', byteLength: 0, head: '' }), false);
  assert.equal(R.acceptPdf({ ok: false, contentType: 'application/pdf', byteLength: 1024, head: '%PDF-' }), false);
  assert.equal(R.acceptPdf({ ok: true, contentType: 'application/pdf', byteLength: NaN, head: '%PDF-' }), false);
  assert.equal(R.acceptPdf({ ok: true, contentType: 'application/pdf', byteLength: 5000, head: '%PDF-', maxBytes: 1000 }), false);
});

test('rejectBeforeDownload: Content-Length 超上限或 Content-Type 明顯不是 PDF → 連 body 都不讀', () => {
  const MAX = R.MAX_PDF_BYTES;
  assert.equal(R.rejectBeforeDownload({ contentType: 'application/pdf', contentLength: String(20 * 1024 * 1024), maxBytes: MAX }), true);
  assert.equal(R.rejectBeforeDownload({ contentType: 'text/html; charset=utf-8', contentLength: '1024', maxBytes: MAX }), true);
  assert.equal(R.rejectBeforeDownload({ contentType: 'application/json', contentLength: null, maxBytes: MAX }), true);
  assert.equal(R.rejectBeforeDownload({ contentType: 'application/pdf', contentLength: null, maxBytes: MAX }), false);
  assert.equal(R.rejectBeforeDownload({ contentType: 'binary/octet-stream', contentLength: '2048', maxBytes: MAX }), false);
});

// ── arrayBufferToBase64 ──
test('arrayBufferToBase64: 二進位往返正確；2 萬 bytes（跨 8192 chunk）也正確', () => {
  const src = new Uint8Array([0, 1, 2, 253, 254, 255]);
  assert.deepEqual(Buffer.from(R.arrayBufferToBase64(src.buffer), 'base64'), Buffer.from(src));
  const big = new Uint8Array(20000);
  for (let i = 0; i < big.length; i++) big[i] = i % 256;
  assert.deepEqual(Buffer.from(R.arrayBufferToBase64(big.buffer), 'base64'), Buffer.from(big));
});

test('constants: 上限值', () => {
  assert.equal(R.MAX_ATTEMPTS, 3);
  assert.equal(R.MAX_COURSES_PER_RUN, 10);
  assert.equal(R.MAX_PDF_BYTES, 10 * 1024 * 1024);
  assert.equal(R.MAX_TOTAL_PDF_BYTES, 12 * 1024 * 1024);
  assert.equal(R.PDF_PERMISSION_ORIGIN, 'https://*.canvas-user-content.com/*');
  assert.equal(R.MIN_SYLLABUS_TEXT_CHARS, 50);
  assert.equal(R.MAX_EXTRACTED_TEXT_CHARS, 30000);
});

console.log('ALL gradingRules TESTS PASSED');

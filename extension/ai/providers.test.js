const assert = require('node:assert/strict');
const P = require('./providers.js');
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

const GEMINI = { provider: 'gemini', apiKey: 'AIza-secret', model: 'gemini-2.5-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/' };
const DEEPSEEK = { provider: 'deepseek', apiKey: 'sk-secret', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1/' };
const PARTS = [
  { type: 'pdf', base64: 'QUJD', mimeType: 'application/pdf', bytes: 3 },
  { type: 'text', text: 'Course Syllabus:\nHW 30%' },
  { type: 'text', text: 'Extract it.' },
];

test('normalizeBaseUrl: 去尾斜線與空白', () => {
  assert.equal(P.normalizeBaseUrl('https://x.example/v1///'), 'https://x.example/v1');
  assert.equal(P.normalizeBaseUrl('  https://x.example/v1 '), 'https://x.example/v1');
  assert.equal(P.normalizeBaseUrl(undefined), '');
});

test('supportsPdf: 只有 gemini', () => {
  assert.equal(P.supportsPdf('gemini'), true);
  assert.equal(P.supportsPdf('qwen'), false);
  assert.equal(P.supportsPdf('deepseek'), false);
});

test('supportsPdf 與 gradingRules.PROVIDERS 的 supportsPdf 一致（單一真相來源）', () => {
  const keys = Object.keys(R.PROVIDERS);
  assert.ok(keys.length >= 3);
  for (const k of keys) assert.equal(P.supportsPdf(k), R.PROVIDERS[k].supportsPdf, `provider=${k}`);
});

test('buildRequest gemini: url 不含 key、key 走 x-goog-api-key、pdf → inlineData、systemInstruction、generationConfig', () => {
  const req = P.buildRequest(GEMINI, PARTS, 'SYS', { temperature: 0, maxTokens: 2048 });
  assert.equal(req.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
  assert.equal(req.url.includes('AIza'), false);
  assert.equal(req.headers['x-goog-api-key'], 'AIza-secret');
  assert.equal(req.headers['Content-Type'], 'application/json');
  assert.deepEqual(Object.keys(req.headers).sort(), ['Content-Type', 'x-goog-api-key']);
  assert.deepEqual(req.body.systemInstruction, { parts: [{ text: 'SYS' }] });
  assert.deepEqual(req.body.contents[0].parts[0], { inlineData: { mimeType: 'application/pdf', data: 'QUJD' } });
  assert.deepEqual(req.body.contents[0].parts[1], { text: 'Course Syllabus:\nHW 30%' });
  assert.deepEqual(req.body.generationConfig, { maxOutputTokens: 2048, temperature: 0 });
});

test('buildRequest gemini: 無 systemPrompt／無 temperature 時不帶對應欄位', () => {
  const req = P.buildRequest(GEMINI, [{ type: 'text', text: 'hi' }], '', { maxTokens: 8 });
  assert.equal('systemInstruction' in req.body, false);
  assert.deepEqual(req.body.generationConfig, { maxOutputTokens: 8 });
});

test('buildRequest gemini: model 帶 models/ 前綴時不重複', () => {
  const req = P.buildRequest({ ...GEMINI, model: 'models/gemini-2.5-flash' }, [{ type: 'text', text: 'hi' }], '', {});
  assert.ok(req.url.endsWith('/models/gemini-2.5-flash:generateContent'), req.url);
});

test('buildRequest gemini: 未知 part 型別一律丟棄（與 OpenAI 路徑一致）', () => {
  const parts = [{ type: 'image', data: 'x' }, ...PARTS];
  const req = P.buildRequest(GEMINI, parts, '', {});
  assert.equal(req.body.contents[0].parts.length, 3); // 1 pdf + 2 text，image 被丟掉
  assert.equal(JSON.stringify(req.body).includes('"image"'), false);
});

test('buildRequest: 未給 opts 時 maxTokens 預設 2048、不帶 temperature（兩條路徑）', () => {
  const g = P.buildRequest(GEMINI, [{ type: 'text', text: 'hi' }], 'SYS');
  assert.equal(g.body.generationConfig.maxOutputTokens, 2048);
  assert.equal('temperature' in g.body.generationConfig, false);
  const d = P.buildRequest(DEEPSEEK, [{ type: 'text', text: 'hi' }], 'SYS');
  assert.equal(d.body.max_tokens, 2048);
  assert.equal('temperature' in d.body, false);
});

test('buildRequest: 非 gemini 的 provider（含未知）一律走 OpenAI 相容路徑', () => {
  const req = P.buildRequest({ provider: 'openai', apiKey: 'k', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' }, [{ type: 'text', text: 'hi' }], '', {});
  assert.ok(req.url.endsWith('/chat/completions'), req.url);
  assert.equal(req.body.model, 'gpt-4o-mini');
});

test('buildRequest OpenAI 相容: header 只有 Authorization 與 Content-Type', () => {
  const req = P.buildRequest(DEEPSEEK, [{ type: 'text', text: 'hi' }], '', {});
  assert.deepEqual(Object.keys(req.headers).sort(), ['Authorization', 'Content-Type']);
});

test('buildRequest OpenAI 相容: /chat/completions、Bearer、PDF 丟棄、文字以空行串接', () => {
  const req = P.buildRequest(DEEPSEEK, PARTS, 'SYS', { temperature: 0, maxTokens: 2048 });
  assert.equal(req.url, 'https://api.deepseek.com/v1/chat/completions');
  assert.equal(req.headers.Authorization, 'Bearer sk-secret');
  assert.equal(req.body.model, 'deepseek-chat');
  assert.deepEqual(req.body.messages[0], { role: 'system', content: 'SYS' });
  assert.deepEqual(req.body.messages[1], { role: 'user', content: 'Course Syllabus:\nHW 30%\n\nExtract it.' });
  assert.equal(req.body.max_tokens, 2048);
  assert.equal(req.body.temperature, 0);
  assert.equal(JSON.stringify(req.body).includes('QUJD'), false);
});

test('buildRequest OpenAI 相容: null part 被忽略（與 gemini 路徑一致，不丟 TypeError）', () => {
  const req = P.buildRequest(DEEPSEEK, [null, { type: 'text', text: 'hi' }], '');
  assert.equal(req.body.messages[0].content, 'hi');
});

test('buildRequest OpenAI 相容: 無 systemPrompt 只有 user 訊息；maxTokens 預設 2048', () => {
  const req = P.buildRequest(DEEPSEEK, [{ type: 'text', text: 'hi' }], '', {});
  assert.equal(req.body.messages.length, 1);
  assert.equal(req.body.max_tokens, 2048);
  assert.equal('temperature' in req.body, false);
});

test('extractText gemini: 串接 parts；空回應 throw', () => {
  assert.equal(P.extractText('gemini', { candidates: [{ content: { parts: [{ text: '{"a":' }, { text: '1}' }] } }] }), '{"a":1}');
  assert.throws(() => P.extractText('gemini', { candidates: [] }), /Empty response/);
  assert.throws(() => P.extractText('gemini', {}), /Empty response/);
});

test('extractText OpenAI 相容: choices[0].message.content；空回應 throw', () => {
  assert.equal(P.extractText('deepseek', { choices: [{ message: { content: 'ok' } }] }), 'ok');
  assert.throws(() => P.extractText('qwen', { choices: [{ message: { content: '' } }] }), /Empty response/);
});

test('extractText gemini: 跳過非文字 part；空回應附上原因', () => {
  assert.equal(P.extractText('gemini', { candidates: [{ content: { parts: [{ inlineData: {} }, { text: 'ok' }] } }] }), 'ok');
  assert.throws(() => P.extractText('gemini', { candidates: [{ finishReason: 'MAX_TOKENS', content: {} }] }), /Empty response \(MAX_TOKENS\)/);
  assert.throws(() => P.extractText('gemini', { promptFeedback: { blockReason: 'SAFETY' } }), /SAFETY/);
});

test('extractText gemini: finishReason 非字串／超長時截斷，不讓錯誤訊息爆長', () => {
  let msg = '';
  try { P.extractText('gemini', { candidates: [{ finishReason: 'X'.repeat(100), content: {} }] }); } catch (e) { msg = e.message; }
  assert.ok(msg.startsWith('Empty response (X'), msg);
  assert.ok(msg.length <= 'Empty response ('.length + 40 + 1, `len=${msg.length}`);
  let msg2 = '';
  try { P.extractText('gemini', { candidates: [{ finishReason: { a: 1 }, content: {} }] }); } catch (e) { msg2 = e.message; }
  assert.equal(msg2, 'Empty response ([object Object])');
});

test('extractText OpenAI 相容: 只有 reasoning_content → 錯誤訊息指出原因', () => {
  assert.throws(
    () => P.extractText('deepseek', { choices: [{ message: { content: null, reasoning_content: '想了很久…' } }] }),
    /Empty response \(reasoning_content only\)/
  );
});

console.log('ALL providers TESTS PASSED');

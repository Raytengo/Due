const assert = require('node:assert/strict');
const P = require('./providers.js');

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

console.log('ALL providers TESTS PASSED');

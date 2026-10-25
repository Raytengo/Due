const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const DueSchools = require('./schools.js');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const ROWS = [
  ['aaa', 'Alpha College'],
  ['hkust-gz', 'The Hong Kong University of Science and Technology (GuangZhou)'],
  ['hkaa', 'Hong Kong Adventist Academy'],
  ['cityu-dg', 'City University of Hong Kong (Dongguan)'],
  ['ln', 'Lingnan University'],
  ['liverpoolbhs', 'Liverpool Boys High School'],
  ['ljmu', 'Liverpool John Moores University'],
  ['www', 'Not a school'],
  ['foo.beta', 'Beta environment'],
  ['bad host', 'Broken'],
];
const INDEX = DueSchools.buildIndex(ROWS);
const names = (list) => list.map((e) => e.sub);

test('buildIndex drops non-selectable subdomains', () => {
  assert.deepEqual(names(INDEX), ['aaa', 'hkust-gz', 'hkaa', 'cityu-dg', 'ln', 'liverpoolbhs', 'ljmu']);
});

test('empty query lists featured schools first, in their configured order', () => {
  const top = names(DueSchools.search(INDEX, ''));
  assert.deepEqual(top.slice(0, 3), ['hkust-gz', 'cityu-dg', 'ln']);
  assert.equal(top.length, INDEX.length);
});

test('every token must match; name word-prefix beats substring', () => {
  assert.deepEqual(names(DueSchools.search(INDEX, 'liverpool')).sort(), ['liverpoolbhs', 'ljmu']);
  assert.deepEqual(names(DueSchools.search(INDEX, 'liverpool john')), ['ljmu']);
  assert.deepEqual(names(DueSchools.search(INDEX, 'zzz')), []);
  assert.equal(DueSchools.search(INDEX, 'hong kong')[0].sub, 'hkaa');   // 名稱開頭就是 Hong Kong 的排在中間才出現的前面
});

test('matches featured schools by Chinese alias and by subdomain', () => {
  assert.equal(DueSchools.search(INDEX, '港科廣')[0].sub, 'hkust-gz');
  assert.equal(DueSchools.search(INDEX, '岭南大学')[0].sub, 'ln');
  assert.equal(DueSchools.search(INDEX, 'hkust')[0].sub, 'hkust-gz');
  assert.equal(DueSchools.search(INDEX, 'dongguan')[0].sub, 'cityu-dg');
});

test('featured short name is shown, the full Canvas name still searches', () => {
  const e = INDEX.find((x) => x.sub === 'hkust-gz');
  assert.equal(e.name, 'HKUST (Guangzhou)');
  assert.equal(DueSchools.search(INDEX, 'science technology')[0].sub, 'hkust-gz');
});

test('search is case, accent and punctuation insensitive; limit applies', () => {
  assert.equal(DueSchools.search(INDEX, 'HONG-KONG   adventist')[0].sub, 'hkaa');
  assert.equal(DueSchools.search(INDEX, '', { limit: 2 }).length, 2);
});

test('parseInstructure accepts urls and bare hosts, rejects everything else', () => {
  const ok = { sub: 'abc', origin: 'https://abc.instructure.com' };
  assert.deepEqual(DueSchools.parseInstructure('https://abc.instructure.com/courses/1?x=1'), ok);
  assert.deepEqual(DueSchools.parseInstructure('  ABC.instructure.com/ '), ok);
  assert.equal(DueSchools.parseInstructure('http://abc.instructure.com'), null);
  assert.equal(DueSchools.parseInstructure('https://www.instructure.com'), null);
  assert.equal(DueSchools.parseInstructure('https://abc.beta.instructure.com'), null);
  assert.equal(DueSchools.parseInstructure('canvas.ust.hk'), null);
  assert.equal(DueSchools.parseInstructure('https://abc.instructure.com.evil.com'), null);
  assert.equal(DueSchools.parseInstructure('hong kong'), null);
  assert.equal(DueSchools.parseInstructure(''), null);
});

test('the shipped schools.json is well-formed and contains the default school', () => {
  const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'schools.json'), 'utf8'));
  const idx = DueSchools.buildIndex(rows);
  assert.equal(idx.length, rows.length, 'every row is selectable');
  assert.ok(idx.some((e) => e.sub === DueSchools.DEFAULT_SUB));
  for (const f of DueSchools.FEATURED) assert.ok(idx.some((e) => e.sub === f.sub), f.sub);
});

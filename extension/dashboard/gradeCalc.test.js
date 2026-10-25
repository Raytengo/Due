const assert = require('node:assert/strict');
const G = require('./gradeCalc.js');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const asgn = (id, name, pts, extra = {}) => ({ id, name, points_possible: pts, submission: null, ...extra });
const graded = (id, name, pts, score, extra = {}) => asgn(id, name, pts, { submission: { score }, ...extra });
const items = (...pairs) => pairs.map(([name, weight]) => ({ name, weight }));
const round = (x) => Math.round(x * 1000) / 1000;
const COURSE = { id: 5 };

// ── keysOf：正規化、同義詞、單複數、停用字 ──
test('keysOf: 同義詞歸一（中英繁簡）', () => {
  assert.ok(G.keysOf('Homework 3').has('homework'));
  assert.ok(G.keysOf('HW1').has('homework'));
  assert.ok(G.keysOf('Assignments').has('homework'));
  assert.ok(G.keysOf('第三次作業').has('homework'));
  assert.ok(G.keysOf('第三次作业').has('homework'));
  assert.ok(G.keysOf('Quizzes').has('quiz'));
  assert.ok(G.keysOf('隨堂測驗').has('quiz'));
  assert.ok(G.keysOf('Laboratories').has('lab'));
});

test('keysOf: mid-term／mid term／全形 → midterm', () => {
  assert.ok(G.keysOf('Mid-term Exam').has('midterm'));
  assert.ok(G.keysOf('mid term').has('midterm'));
  assert.ok(G.keysOf('ＭＩＤＴＥＲＭ').has('midterm'));
});

test('keysOf: 單獨的 midterm／final 視為考試；有別的字就不補 exam', () => {
  assert.ok(G.keysOf('Midterm').has('exam'));
  assert.ok(G.keysOf('Final').has('exam'));
  assert.ok(G.keysOf('期中考').has('exam'));
  assert.equal(G.keysOf('Final Portfolio').has('exam'), false);
  assert.equal(G.keysOf('Final Project').has('exam'), false);
});

test('keysOf: 一般英文字以原字（單數）為 key，停用字與短字不算', () => {
  const k = G.keysOf('Case Studies for the Course');
  assert.ok(k.has('w:case'));
  assert.ok(k.has('w:study'));
  assert.equal(k.has('w:the'), false);
  assert.equal(k.has('w:course'), false);
  assert.equal(k.has('w:for'), false);
});

// ── matchItem：五層 ──
const COMP = items(['Assignments', 30], ['Midterm', 30], ['Final Exam', 40]);

test('matchItem: 作業名稱關鍵字優先於組名完全相同（Canvas 預設 Assignments 組裝了期中考）', () => {
  const r = G.matchItem({ assignment: asgn(1, 'Midterm Exam', 100), groupName: 'Assignments', items: COMP });
  assert.deepEqual(r, { index: 1, how: 'name' });
});

test('matchItem: 作業名稱沒有線索 → 組名完全相同', () => {
  const r = G.matchItem({ assignment: asgn(1, 'Raft Consensus', 100), groupName: 'Assignments', items: COMP });
  assert.deepEqual(r, { index: 0, how: 'group' });
});

test('matchItem: 作業名稱平手 → 往下看組名關鍵字', () => {
  const its = items(['Labs', 40], ['Final Report', 20]);
  // 「Lab Report」：lab 對 Labs、report 對 Final Report → 平手
  const r = G.matchItem({ assignment: asgn(1, 'Lab Report 2', 10), groupName: 'Laboratory Work', items: its });
  assert.deepEqual(r, { index: 0, how: 'groupKeys' });
});

test('matchItem: 組名關鍵字（Canvas 預設 Assignments 組 → Homework 項目；畫面上看得到、可改）', () => {
  const its = items(['Homework', 30], ['Midterm', 30], ['Final Exam', 40]);
  const r = G.matchItem({ assignment: asgn(1, 'Peer Review', 5), groupName: 'Assignments', items: its });
  assert.deepEqual(r, { index: 0, how: 'groupKeys' });
});

test('matchItem: groupMixed → 組名不可信，跳過組名兩層', () => {
  const its = items(['Homework', 30], ['Midterm', 30], ['Final Exam', 40]);
  const r = G.matchItem({ assignment: asgn(1, 'Peer Review', 5), groupName: 'Assignments', items: its, groupMixed: true });
  assert.deepEqual(r, { index: -1, how: 'none' });
});

test('plan: 大雜燴組（同組依名稱對到兩個以上項目）裡對不上名稱的 → 未歸類，不被組名算進 Homework', () => {
  const groups = [{ id: 11, name: 'Assignments', group_weight: 0 }];
  const inG = { assignment_group_id: 11 };
  const cw = items(['Homework', 30], ['Midterm', 30], ['Final Exam', 40]);
  const p = G.plan({
    course: COURSE, groups, customWeights: cw,
    assignments: [asgn(1, 'Homework 1', 10, inG), asgn(2, 'Midterm Exam', 100, inG), asgn(3, 'Peer Review', 5, inG)],
  });
  assert.deepEqual(p.rows.map((r) => [r.a.id, r.bucket, r.how]), [[1, 0, 'name'], [2, 1, 'name'], [3, -1, 'none']]);
});

test('plan: 單純的組（名稱只對到一個項目）→ 對不上名稱的照組名歸', () => {
  const groups = [{ id: 11, name: 'Quizzes', group_weight: 0 }];
  const inG = { assignment_group_id: 11 };
  const cw = items(['Quiz', 10], ['Essay', 90]);
  const p = G.plan({
    course: COURSE, groups, customWeights: cw,
    assignments: [asgn(1, 'Reading Quiz 1', 10, inG), asgn(2, 'Week 3 check-in', 5, inG)],
  });
  assert.deepEqual(p.rows.map((r) => [r.a.id, r.bucket, r.how]), [[1, 0, 'name'], [2, 0, 'group']]);
});

test('matchItem: 組名與項目名只差單複數 → 視為相同', () => {
  const its = items(['Quiz', 10], ['Essay', 90]);
  const r = G.matchItem({ assignment: asgn(1, 'Week 3 check-in', 5), groupName: 'Quizzes', items: its });
  assert.equal(r.index, 0);
});

test('matchItem: 全部對不上 → 未歸類', () => {
  const r = G.matchItem({ assignment: asgn(1, 'Survey', 5), groupName: 'Misc', items: COMP });
  assert.deepEqual(r, { index: -1, how: 'none' });
});

test('matchItem: 平手且組名也平手 → 未歸類（寧可不算，不可算錯）', () => {
  const its = items(['Final Exam', 50], ['Final Project', 50]);
  const r = G.matchItem({ assignment: asgn(1, 'Final (closed book)', 100), groupName: 'Assignments', items: its });
  assert.deepEqual(r, { index: -1, how: 'none' });
});

test('matchItem: 「Final Exam」作業選 Final 不選 Midterm（midterm/final 單獨時視為考試）', () => {
  const its = items(['Midterm', 30], ['Final', 40], ['Homework', 30]);
  assert.equal(G.matchItem({ assignment: asgn(1, 'Final Exam', 100), groupName: '', items: its }).index, 1);
  assert.equal(G.matchItem({ assignment: asgn(2, 'Midterm Exam', 100), groupName: '', items: its }).index, 0);
  assert.equal(G.matchItem({ assignment: asgn(3, 'Homework 2', 10), groupName: '', items: its }).index, 2);
});

test('matchItem: 一般英文字也算（Kaggle Competition）', () => {
  const its = items(['Assignments', 45], ['Kaggle Competition', 20], ['Course Project', 35]);
  const r = G.matchItem({ assignment: asgn(1, 'Kaggle Competition — Phase 1 Submission', 100), groupName: 'Assignments', items: its });
  assert.deepEqual(r, { index: 1, how: 'name' });
});

test('matchItem: 中文項目名稱整串出現在作業名稱裡', () => {
  const its = items(['平時作業', 30], ['論文', 70]);
  const r = G.matchItem({ assignment: asgn(1, '期末論文初稿', 100), groupName: 'Assignments', items: its });
  assert.equal(r.index, 1);
});

test('matchItem: 手動指定優先；名稱已不存在 → 回到自動', () => {
  const a = asgn(1, 'Midterm Exam', 100);
  assert.deepEqual(G.matchItem({ assignment: a, groupName: 'Assignments', items: COMP, override: 'Final Exam' }), { index: 2, how: 'manual' });
  assert.deepEqual(G.matchItem({ assignment: a, groupName: 'Assignments', items: COMP, override: 'Gone' }), { index: 1, how: 'name' });
});

test('matchItem: 手動 null → 不計入', () => {
  const r = G.matchItem({ assignment: asgn(1, 'Midterm Exam', 100), groupName: 'Assignments', items: COMP, override: null });
  assert.deepEqual(r, { index: -1, how: 'excluded' });
});

test('matchItem: 手動指定到未命名項目（名稱空字串）', () => {
  const its = items(['', 50], ['Exam', 50]);
  assert.deepEqual(G.matchItem({ assignment: asgn(1, 'X', 1), groupName: '', items: its, override: '' }), { index: 0, how: 'manual' });
});

// ── effectiveScore／inputValue：三態、免除、負分 ──
test('effectiveScore: 沒有手動值 → Canvas 分數；沒分數 → null', () => {
  assert.equal(G.effectiveScore(graded(1, 'a', 10, 8), {}), 8);
  assert.equal(G.effectiveScore(asgn(1, 'a', 10), {}), null);
});

test('effectiveScore: 手動值優先；null＝清空過（不回退 Canvas）', () => {
  assert.equal(G.effectiveScore(graded(1, 'a', 10, 8), { 1: 9.5 }), 9.5);
  assert.equal(G.effectiveScore(graded(1, 'a', 10, 8), { 1: null }), null);
});

test('effectiveScore: 已免除不計，殘留手動值也忽略', () => {
  const a = graded(1, 'a', 10, 8, { submission: { score: 8, excused: true } });
  assert.equal(G.effectiveScore(a, { 1: 7 }), null);
});

test('effectiveScore: 負分與非數字不計', () => {
  assert.equal(G.effectiveScore(graded(1, 'a', 10, -2), {}), null);
  assert.equal(G.effectiveScore(asgn(1, 'a', 10), { 1: 'abc' }), null);
});

test('inputValue: 三態（無 key → Canvas 預填；null → 空；數字 → 數字）', () => {
  assert.equal(G.inputValue(graded(1, 'a', 10, 8), {}), 8);
  assert.equal(G.inputValue(asgn(1, 'a', 10), {}), '');
  assert.equal(G.inputValue(graded(1, 'a', 10, 8), { 1: null }), '');
  assert.equal(G.inputValue(graded(1, 'a', 10, 8), { 1: 6 }), 6);
});

// ── weightMode ──
const GROUPS = [{ id: 11, name: 'HW', group_weight: 60, assignments: [] }, { id: 12, name: 'Exam', group_weight: 40, assignments: [] }];

test('weightMode: 自訂權重優先；總和 0／空陣列 → none（明確覆寫成不顯示）', () => {
  assert.equal(G.weightMode(COURSE, GROUPS, items(['A', 100])), 'custom');
  assert.equal(G.weightMode(COURSE, GROUPS, []), 'none');
  assert.equal(G.weightMode(COURSE, GROUPS, items(['A', 0])), 'none');
});

test('weightMode: 沒有自訂 → Canvas 實際加權才算；加權開關關掉 → none', () => {
  assert.equal(G.weightMode(COURSE, GROUPS, undefined), 'canvas');
  assert.equal(G.weightMode({ id: 5, apply_assignment_group_weights: false }, GROUPS, undefined), 'none');
  assert.equal(G.weightMode(COURSE, [{ id: 1, name: 'x', group_weight: 0 }], undefined), 'none');
});

// ── plan + compute / courseGrade ──
test('courseGrade(canvas): 與舊計算器同一套算法（只算有成績的組）', () => {
  const groups = [
    { id: 11, name: 'HW', group_weight: 60 },
    { id: 12, name: 'Exam', group_weight: 40 },
  ];
  const as = [
    graded(1, 'HW1', 10, 8, { assignment_group_id: 11 }),
    graded(2, 'HW2', 10, 10, { assignment_group_id: 11 }),
    asgn(3, 'Final', 100, { assignment_group_id: 12 }),
  ];
  const r = G.courseGrade({ course: COURSE, groups, assignments: as, scores: {} });
  assert.equal(r.mode, 'canvas');
  assert.equal(round(r.percent), 90);       // 只有 HW 組有成績：18/20
  assert.equal(r.gradedWeight, 60);
  assert.equal(r.totalWeight, 100);
  assert.equal(r.buckets[1].percent, null);
  assert.equal(r.unmappedGraded, 0);
});

test('courseGrade(canvas): 用 group.assignments 對應（沒有 assignment_group_id）', () => {
  const groups = [{ id: 11, name: 'HW', group_weight: 100, assignments: [{ id: 1 }] }];
  const r = G.courseGrade({ course: COURSE, groups, assignments: [graded(1, 'HW1', 10, 5)], scores: {} });
  assert.equal(r.percent, 50);
});

test('courseGrade(custom): 依名稱歸類、未歸類有成績的計數、覆蓋率', () => {
  const groups = [{ id: 11, name: 'Coursework', group_weight: 0 }];
  const inG = { assignment_group_id: 11 };
  const as = [
    graded(1, 'Homework 1', 10, 9, inG),
    graded(2, 'Midterm Exam', 100, 70, inG),
    graded(3, 'Mystery Task', 10, 10, inG),   // 對不上：名稱與組名都沒有線索
    asgn(4, 'Final Exam', 100, inG),
  ];
  const cw = items(['Homework', 30], ['Midterm', 30], ['Final Exam', 40]);
  const r = G.courseGrade({ course: COURSE, groups, assignments: as, scores: {}, customWeights: cw });
  assert.equal(r.mode, 'custom');
  // (0.9×30 + 0.7×30) / 60 = 80
  assert.equal(round(r.percent), 80);
  assert.equal(r.gradedWeight, 60);
  assert.equal(r.totalWeight, 100);
  assert.equal(r.unmappedGraded, 1);
});

test('courseGrade(custom): 手動不計入的不算進 unmappedGraded', () => {
  const cw = items(['Homework', 100]);
  const as = [graded(1, 'Homework 1', 10, 9), graded(2, 'Bonus', 10, 10)];
  const r = G.courseGrade({ course: COURSE, groups: [], assignments: as, scores: {}, customWeights: cw, itemMap: { 2: null } });
  assert.equal(r.unmappedGraded, 0);
  assert.equal(r.percent, 90);
});

test('courseGrade: 沒有權重 → none、分數 null', () => {
  const r = G.courseGrade({ course: COURSE, groups: [], assignments: [graded(1, 'a', 10, 9)], scores: {} });
  assert.equal(r.mode, 'none');
  assert.equal(r.percent, null);
});

test('courseGrade: 沒配分、免除的作業不進計算', () => {
  const cw = items(['Homework', 100]);
  const as = [
    graded(1, 'Homework 1', 10, 5),
    graded(2, 'Homework 2', 0, 0),
    graded(3, 'Homework 3', 10, 0, { submission: { score: 0, excused: true } }),
  ];
  const r = G.courseGrade({ course: COURSE, groups: [], assignments: as, scores: {}, customWeights: cw });
  assert.equal(r.percent, 50);
});

test('compute: scoreOf 覆寫（DOM 即時試算用輸入框現值）', () => {
  const cw = items(['Homework', 100]);
  const p = G.plan({ course: COURSE, groups: [], assignments: [graded(1, 'Homework 1', 10, 5)], customWeights: cw });
  assert.equal(G.compute(p, () => 10).percent, 100);
  assert.equal(G.compute(p, () => null).percent, null);
});

test('plan(custom): rows 帶 bucket 與 how；沒有作業的項目也有 bucket', () => {
  const cw = items(['Homework', 30], ['Participation', 10]);
  const p = G.plan({ course: COURSE, groups: [], assignments: [asgn(1, 'Homework 1', 10)], customWeights: cw });
  assert.equal(p.buckets.length, 2);
  assert.equal(p.buckets[1].name, 'Participation');
  assert.deepEqual(p.rows.map((r) => [r.a.id, r.bucket, r.how]), [[1, 0, 'name']]);
});

test('usesGroupWeights: 加權開關關掉 → false', () => {
  assert.equal(G.usesGroupWeights({ apply_assignment_group_weights: false }, GROUPS), false);
  assert.equal(G.usesGroupWeights(null, GROUPS), true);
  assert.equal(G.usesGroupWeights(null, []), false);
});

console.log('gradeCalc: all tests passed');

const assert = require('node:assert/strict');
const DueCompletion = require('./completion.js');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

// ── isSubmitted ──
test('isSubmitted: submitted_at set → true', () => {
  assert.equal(DueCompletion.isSubmitted({ submission: { submitted_at: '2026-03-06T10:00:00Z' } }), true);
});

test('isSubmitted: workflow_state submitted → true', () => {
  assert.equal(DueCompletion.isSubmitted({ submission: { workflow_state: 'submitted' } }), true);
});

test('isSubmitted: workflow_state graded → true', () => {
  assert.equal(DueCompletion.isSubmitted({ submission: { workflow_state: 'graded' } }), true);
});

test('isSubmitted: submission null → false (暑假無繳交常態)', () => {
  assert.equal(DueCompletion.isSubmitted({ submission: null }), false);
});

test('isSubmitted: missing submission field → false', () => {
  assert.equal(DueCompletion.isSubmitted({ id: 1, name: 'x' }), false);
});

test('isSubmitted: unsubmitted workflow_state → false', () => {
  assert.equal(DueCompletion.isSubmitted({ submission: { workflow_state: 'unsubmitted' } }), false);
});

// ── isManualDone ──
test('isManualDone: numeric id hits string key via String() normalization', () => {
  assert.equal(DueCompletion.isManualDone({ '12345': true }, 12345), true);
});

test('isManualDone: string id hits key', () => {
  assert.equal(DueCompletion.isManualDone({ 'custom-assignment-abc': true }, 'custom-assignment-abc'), true);
});

test('isManualDone: empty map → false', () => {
  assert.equal(DueCompletion.isManualDone({}, 12345), false);
});

test('isManualDone: null map → false', () => {
  assert.equal(DueCompletion.isManualDone(null, 12345), false);
});

// ── isDone ──
test('isDone: Canvas-submitted + empty manualDone → true', () => {
  assert.equal(DueCompletion.isDone({ id: 1, submission: { workflow_state: 'submitted' } }, {}), true);
});

test('isDone: not submitted + manualDone has id → true', () => {
  assert.equal(DueCompletion.isDone({ id: 7, submission: null }, { '7': true }), true);
});

test('isDone: numeric id resolves against string manualDone key → true', () => {
  assert.equal(DueCompletion.isDone({ id: 7, submission: null }, { 7: true }), true);
});

test('isDone: neither submitted nor manual → false', () => {
  assert.equal(DueCompletion.isDone({ id: 7, submission: null }, {}), false);
});

test('isDone: empty map + submission null → false (暑假空清單情境)', () => {
  assert.equal(DueCompletion.isDone({ id: 99, submission: null }, {}), false);
});

// ── toggleManualDone ──
test('toggleManualDone: add then remove by flipping', () => {
  const added = DueCompletion.toggleManualDone({}, 7);
  assert.deepEqual(added, { '7': true });
  const removed = DueCompletion.toggleManualDone(added, 7);
  assert.deepEqual(removed, {});
});

test('toggleManualDone: explicit nextState true adds; false removes', () => {
  const added = DueCompletion.toggleManualDone({}, 'custom-1', true);
  assert.deepEqual(added, { 'custom-1': true });
  const removed = DueCompletion.toggleManualDone(added, 'custom-1', false);
  assert.deepEqual(removed, {});
});

test('toggleManualDone: normalizes numeric id to string key', () => {
  assert.deepEqual(DueCompletion.toggleManualDone({}, 42, true), { '42': true });
});

test('toggleManualDone: does NOT mutate the original map', () => {
  const original = { '1': true };
  const frozenSnapshot = { ...original };
  const next = DueCompletion.toggleManualDone(original, 2, true);
  assert.deepEqual(original, frozenSnapshot); // unchanged
  assert.deepEqual(next, { '1': true, '2': true });
  // removing also must not mutate input
  const afterRemove = DueCompletion.toggleManualDone(original, 1, false);
  assert.deepEqual(original, frozenSnapshot); // still unchanged
  assert.deepEqual(afterRemove, {});
});

test('toggleManualDone: handles null input map', () => {
  assert.deepEqual(DueCompletion.toggleManualDone(null, 5, true), { '5': true });
});

// ── normalizeManualDone ──
test('normalizeManualDone: drops false/0/null values, keeps true', () => {
  const cleaned = DueCompletion.normalizeManualDone({
    '1': true,
    '2': false,
    '3': 0,
    '4': null,
    '5': true,
  });
  assert.deepEqual(cleaned, { '1': true, '5': true });
});

test('normalizeManualDone: null/undefined input → {}', () => {
  assert.deepEqual(DueCompletion.normalizeManualDone(null), {});
  assert.deepEqual(DueCompletion.normalizeManualDone(undefined), {});
});

// ── isManualUndone(鏡像 isManualDone)──
test('isManualUndone: numeric id hits string key via String() normalization', () => {
  assert.equal(DueCompletion.isManualUndone({ '12345': true }, 12345), true);
});

test('isManualUndone: string id hits key', () => {
  assert.equal(DueCompletion.isManualUndone({ '991004': true }, '991004'), true);
});

test('isManualUndone: empty map → false', () => {
  assert.equal(DueCompletion.isManualUndone({}, 12345), false);
});

test('isManualUndone: null map → false', () => {
  assert.equal(DueCompletion.isManualUndone(null, 12345), false);
});

// ── isDone 第三參數 manualUndone(雙向切換核心)──
test('isDone: Canvas-submitted + manualUndone has id → false (標回未完成)', () => {
  assert.equal(
    DueCompletion.isDone({ id: 9, submission: { workflow_state: 'graded' } }, {}, { '9': true }),
    false
  );
});

test('isDone: submitted_at set + undone via numeric key → false', () => {
  assert.equal(
    DueCompletion.isDone({ id: 9, submission: { submitted_at: '2026-07-01T00:00:00Z' } }, {}, { 9: true }),
    false
  );
});

test('isDone: submitted + undone + manualDone 髒資料同時存在 → true (manualDone 勝出)', () => {
  assert.equal(
    DueCompletion.isDone({ id: 9, submission: { workflow_state: 'graded' } }, { '9': true }, { '9': true }),
    true
  );
});

test('isDone: not submitted + stale undone entry → false (無害殘留)', () => {
  assert.equal(DueCompletion.isDone({ id: 9, submission: null }, {}, { '9': true }), false);
});

test('isDone: 省略第三參數 → 與現行為完全相同 (回歸)', () => {
  assert.equal(DueCompletion.isDone({ id: 9, submission: { workflow_state: 'graded' } }, {}), true);
  assert.equal(DueCompletion.isDone({ id: 9, submission: null }, { '9': true }), true);
  assert.equal(DueCompletion.isDone({ id: 9, submission: null }, {}), false);
});

test('isDone: null undone map → 同省略', () => {
  assert.equal(
    DueCompletion.isDone({ id: 9, submission: { workflow_state: 'graded' } }, {}, null),
    true
  );
});

// ── 雙向切換流程(toggleManualDone 為通用 map 切換,直接重用於 undone map)──
test('bidirectional flow: 已繳 → 標回未完成 → 再點回歸 Canvas 事實', () => {
  const a = { id: 991004, submission: { workflow_state: 'graded', submitted_at: '2026-07-10T12:00:00Z' } };
  let undone = {};
  assert.equal(DueCompletion.isDone(a, {}, undone), true);   // Canvas 事實:完成
  undone = DueCompletion.toggleManualDone(undone, a.id);     // 標回未完成
  assert.deepEqual(undone, { '991004': true });
  assert.equal(DueCompletion.isDone(a, {}, undone), false);
  undone = DueCompletion.toggleManualDone(undone, a.id);     // 再點 → 刪 key,回歸 Canvas 事實
  assert.deepEqual(undone, {});
  assert.equal(DueCompletion.isDone(a, {}, undone), true);
});

// ── 考試結束＝已完成桶(2026-07-22 決策:過期考試與已繳考試放一起,不進待辦)──
const past = (days) => new Date(Date.now() - days * 86400000).toISOString();
const future = (days) => new Date(Date.now() + days * 86400000).toISOString();

test('isExternallyDone: Canvas 已繳 → true;過期考試未繳 → true;未來考試 → false;過期一般作業 → false', () => {
  assert.equal(DueCompletion.isExternallyDone({ id: 1, submission: { workflow_state: 'graded' } }), true);
  assert.equal(DueCompletion.isExternallyDone({ id: 2, name: 'Midterm Exam', due_at: past(3) }), true);
  assert.equal(DueCompletion.isExternallyDone({ id: 3, name: 'Midterm Exam', due_at: future(3) }), false);
  assert.equal(DueCompletion.isExternallyDone({ id: 4, name: 'Lab Report', due_at: past(3) }), false);
});

test('isDone: 過期未繳考試 → 預設完成(視同已繳);可 manualUndone 標回未完成;manualDone 髒資料仍勝出', () => {
  const exam = { id: 991009, name: 'Paper Reading Quiz 9', due_at: past(5) };
  assert.equal(DueCompletion.isDone(exam, {}, {}), true);                       // 過期考試=完成
  assert.equal(DueCompletion.isDone(exam, {}, { '991009': true }), false);      // 手動標回未完成
  assert.equal(DueCompletion.isDone(exam, { '991009': true }, { '991009': true }), true); // manualDone 勝出
});

test('isDone: 未來考試未繳 → 未完成(出現在待辦,不亂跳已繳交)', () => {
  const exam = { id: 991010, name: 'Final Exam', due_at: future(10) };
  assert.equal(DueCompletion.isDone(exam, {}, {}), false);
});

test('isDone: 名為 Midterm review 的自訂作業過期 → 未完成(進已逾期,不悄悄移到已繳交;QA P1-6 #71)', () => {
  const custom = { id: 'custom-assignment-1', _isCustom: true, name: 'Midterm review', due_at: new Date(Date.now() - 3600000).toISOString() };
  assert.equal(DueCompletion.isExternallyDone(custom), false);
  assert.equal(DueCompletion.isDone(custom, {}, {}), false);
});

// ── setDone：勾選/撤銷的單一寫入入口（依「目標狀態」＋當下外部事實決定兩張 map，順手正規化髒資料）──
//    QA P1-4（#69 #35 #98 #109 #177 #190）：只翻單一 map 會在正常操作下產生兩 map 並存 → manualDone 勝出 → 標不回未完成
const submitted = (id) => ({ id, name: 'Lab', submission: { workflow_state: 'submitted', submitted_at: '2026-10-01T00:00:00Z' } });
const pending = (id) => ({ id, name: 'Lab', due_at: future(3), submission: { workflow_state: 'unsubmitted' } });
const doneOf = (a, m) => DueCompletion.isDone(a, m.manualDone, m.manualUndone);

test('setDone: 未繳 → 完成：只寫 manualDone；→ 未完成：兩張都不留', () => {
  const a = pending(1);
  let m = DueCompletion.setDone({ manualDone: {}, manualUndone: {} }, a, true);
  assert.deepEqual(m, { manualDone: { '1': true }, manualUndone: {} });
  assert.equal(doneOf(a, m), true);
  m = DueCompletion.setDone(m, a, false);
  assert.deepEqual(m, { manualDone: {}, manualUndone: {} });
  assert.equal(doneOf(a, m), false);
});

test('setDone: 已繳 → 未完成：寫 manualUndone；→ 完成：回歸 Canvas 事實（兩張都不留）', () => {
  const a = submitted(2);
  let m = DueCompletion.setDone({ manualDone: {}, manualUndone: {} }, a, false);
  assert.deepEqual(m, { manualDone: {}, manualUndone: { '2': true } });
  assert.equal(doneOf(a, m), false);
  m = DueCompletion.setDone(m, a, true);
  assert.deepEqual(m, { manualDone: {}, manualUndone: {} });
  assert.equal(doneOf(a, m), true);
});

test('setDone: 髒資料（兩張都有 id）＋已繳 → 標未完成真的變未完成（#190 #109）', () => {
  const a = submitted(991004);
  const dirty = { manualDone: { '991004': true }, manualUndone: { '991004': true } };
  assert.equal(doneOf(a, dirty), true);                         // 舊行為：manualDone 勝出卡死
  const m = DueCompletion.setDone(dirty, a, false);
  assert.deepEqual(m, { manualDone: {}, manualUndone: { '991004': true } });
  assert.equal(doneOf(a, m), false);
});

test('setDone: 先手動完成、之後 Canvas 才記錄繳交 → 仍可標回未完成再完成（#69 #177 路徑 A）', () => {
  const before = pending(991021);
  let m = DueCompletion.setDone({ manualDone: {}, manualUndone: {} }, before, true);
  const after = { ...before, submission: { workflow_state: 'submitted', submitted_at: '2026-10-02T00:00:00Z' } };
  assert.equal(doneOf(after, m), true);
  m = DueCompletion.setDone(m, after, false);                     // 已繳交視圖點勾選圈
  assert.equal(doneOf(after, m), false);
  assert.deepEqual(m, { manualDone: {}, manualUndone: { '991021': true } });
  m = DueCompletion.setDone(m, after, true);
  assert.equal(doneOf(after, m), true);
  m = DueCompletion.setDone(m, after, false);
  assert.equal(doneOf(after, m), false);
});

test('setDone: 已繳被標回未完成 → popup 勾完成 → dashboard 仍能標回未完成（#35 #98 popup 路徑）', () => {
  const a = submitted(9);
  let m = { manualDone: {}, manualUndone: { '9': true } };
  m = DueCompletion.setDone(m, a, true);                          // popup 勾完成（不再只寫 manualDone）
  assert.deepEqual(m, { manualDone: {}, manualUndone: {} });
  assert.equal(doneOf(a, m), true);
  m = DueCompletion.setDone(m, a, false);                         // dashboard 標回未完成
  assert.equal(doneOf(a, m), false);
});

test('setDone: 升級的考試先手動完成、考試時間過了 → 仍可標回未完成（#69 路徑 C）', () => {
  const exam = { id: 77, name: 'Midterm Exam', due_at: past(1) };   // 已結束 → 外部完成
  const m0 = { manualDone: { '77': true }, manualUndone: {} };      // 考試前手動勾的
  const m1 = DueCompletion.setDone(m0, exam, false);
  assert.equal(doneOf(exam, m1), false);
  assert.deepEqual(m1, { manualDone: {}, manualUndone: { '77': true } });
});

test('setDone: 未繳＋殘留 manualUndone → 標未完成時一併清掉（之後在 Canvas 繳交才不會被舊覆蓋藏起來）', () => {
  const a = pending(5);
  const m = DueCompletion.setDone({ manualDone: { '5': true }, manualUndone: { '5': true } }, a, false);
  assert.deepEqual(m, { manualDone: {}, manualUndone: {} });
  const nowSubmitted = { ...a, submission: { workflow_state: 'submitted' } };
  assert.equal(doneOf(nowSubmitted, m), true);
});

test('setDone: 不 mutate 輸入、保留其他 id、數字 id 正規化成字串 key、null map 安全', () => {
  const md = { '1': true, '3': true };
  const mu = { '4': true };
  const snap = JSON.stringify({ md, mu });
  const m = DueCompletion.setDone({ manualDone: md, manualUndone: mu }, pending(3), false);
  assert.equal(JSON.stringify({ md, mu }), snap);
  assert.deepEqual(m, { manualDone: { '1': true }, manualUndone: { '4': true } });
  assert.deepEqual(DueCompletion.setDone({}, pending(8), true), { manualDone: { '8': true }, manualUndone: {} });
  assert.deepEqual(DueCompletion.setDone(null, submitted(8), false), { manualDone: {}, manualUndone: { '8': true } });
});

test('setDone: 目標狀態冪等——同一個目標套兩次結果相同（供「樂觀更新＋storage 最新值重套」使用）', () => {
  const a = submitted(6);
  const base = { manualDone: { '6': true, '7': true }, manualUndone: {} };
  const once = DueCompletion.setDone(base, a, false);
  assert.deepEqual(DueCompletion.setDone(once, a, false), once);
});

test('setDone: 任何起始狀態套目標後 isDone 恆等於目標（dashboard 依畫面 data-done 翻轉時仰賴此契約）', () => {
  const exam = { id: 78, name: 'Midterm Exam', due_at: past(1) };   // render 後才結束的升級考試 → 點擊當下已外部完成
  const cases = [pending(11), submitted(12), exam];
  const starts = [
    { manualDone: {}, manualUndone: {} },
    { manualDone: { '11': true, '12': true, '78': true }, manualUndone: {} },
    { manualDone: {}, manualUndone: { '11': true, '12': true, '78': true } },
    { manualDone: { '11': true, '12': true, '78': true }, manualUndone: { '11': true, '12': true, '78': true } },
  ];
  cases.forEach((a) => starts.forEach((m0) => [true, false].forEach((target) => {
    assert.equal(doneOf(a, DueCompletion.setDone(m0, a, target)), target, `${a.id} ${JSON.stringify(m0)} → ${target}`);
  })));
  // 畫面顯示未勾 → 使用者要完成：考試已結束也是「完成」，不寫 manualUndone
  assert.deepEqual(DueCompletion.setDone({ manualDone: {}, manualUndone: {} }, exam, true), { manualDone: {}, manualUndone: {} });
});

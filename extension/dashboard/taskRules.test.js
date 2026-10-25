const assert = require('node:assert/strict');
const DueTaskRules = require('./taskRules.js');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const { isExam, isAttendance, urgency, isWithinOverdueWindow, overdueDays } = DueTaskRules;
const DAY = 86400000;

// ── isExam：該抓的要抓 ──
test('isExam: Midterm Exam → true', () => {
  assert.equal(isExam({ name: 'Midterm Exam' }), true);
});

test('isExam: Paper Reading Quiz 1 → true', () => {
  assert.equal(isExam({ name: 'Paper Reading Quiz 1' }), true);
});

test('isExam: Test 1 / Test-2 / Test #3（test 接數字）→ true', () => {
  assert.equal(isExam({ name: 'Test 1' }), true);
  assert.equal(isExam({ name: 'Test-2' }), true);
  assert.equal(isExam({ name: 'Test #3' }), true);
});

test('isExam: 期中考 / 期末考 / 隨堂考 / 小考 / 測驗 → true', () => {
  assert.equal(isExam({ name: '期中考' }), true);
  assert.equal(isExam({ name: '期末考安排' }), true);
  assert.equal(isExam({ name: '隨堂考 3' }), true);
  assert.equal(isExam({ name: '第五週小考' }), true);
  assert.equal(isExam({ name: '線上測驗' }), true);
});

test('isExam: Canvas 事實（is_quiz_assignment / online_quiz）→ true', () => {
  assert.equal(isExam({ name: 'Weekly reflection', is_quiz_assignment: true }), true);
  assert.equal(isExam({ name: 'Weekly reflection', submission_types: ['online_quiz'] }), true);
});

// ── isExam：不該抓的不能抓（舊版誤殺回歸測試）──
test('isExam: 期中小組報告大綱 → false（舊版「期中」誤殺案例）', () => {
  assert.equal(isExam({ name: '期中小組報告大綱' }), false);
});

test('isExam: 期中專題進度 / 期末報告 → false', () => {
  assert.equal(isExam({ name: '期中專題進度' }), false);
  assert.equal(isExam({ name: '期末報告' }), false);
});

test('isExam: Test plan / Testing report / Unit testing HW → false', () => {
  assert.equal(isExam({ name: 'Test plan submission' }), false);
  assert.equal(isExam({ name: 'Testing report' }), false);
  assert.equal(isExam({ name: 'Unit testing homework' }), false);
});

test('isExam: Examination of algorithms（exam 需完整詞）→ false', () => {
  assert.equal(isExam({ name: 'Examination of algorithms essay' }), false);
});

test('isExam: null / 空名稱 → false', () => {
  assert.equal(isExam(null), false);
  assert.equal(isExam({ name: '' }), false);
  assert.equal(isExam({}), false);
});

// ── isAttendance ──
test('isAttendance: attendance / 簽到 / 出勤 / participation → true', () => {
  assert.equal(isAttendance({ name: 'Week 3 Attendance' }), true);
  assert.equal(isAttendance({ name: '第三週簽到' }), true);
  assert.equal(isAttendance({ name: '出勤紀錄' }), true);
  assert.equal(isAttendance({ name: 'Class Participation' }), true);
});

test('isAttendance: 一般作業 → false', () => {
  assert.equal(isAttendance({ name: 'Programming Assignment 2' }), false);
  assert.equal(isAttendance(null), false);
});

// ── urgency（固定 nowMs 測邊界）──
const NOW = new Date('2026-07-21T12:00:00Z').getTime();

test('urgency: 無截止 / 無效日期 → none', () => {
  assert.equal(urgency(null, NOW), 'none');
  assert.equal(urgency('not-a-date', NOW), 'none');
});

test('urgency: 過期 → overdue', () => {
  assert.equal(urgency(new Date(NOW - 1000).toISOString(), NOW), 'overdue');
  assert.equal(urgency(new Date(NOW - 10 * DAY).toISOString(), NOW), 'overdue');
});

test('urgency: ≤7 天 → urgent（含恰好 7 天邊界）', () => {
  assert.equal(urgency(new Date(NOW + 1000).toISOString(), NOW), 'urgent');
  assert.equal(urgency(new Date(NOW + 7 * DAY).toISOString(), NOW), 'urgent');
});

test('urgency: 8–30 天 → soon（含恰好 30 天邊界）', () => {
  assert.equal(urgency(new Date(NOW + 7 * DAY + 1000).toISOString(), NOW), 'soon');
  assert.equal(urgency(new Date(NOW + 30 * DAY).toISOString(), NOW), 'soon');
});

test('urgency: 30 天以上 → later', () => {
  assert.equal(urgency(new Date(NOW + 30 * DAY + 1000).toISOString(), NOW), 'later');
});

// ── isWithinOverdueWindow ──
test('overdueWindow: 未過期 → false；剛過期 → true；30 天內 → true；超過 → false', () => {
  assert.equal(isWithinOverdueWindow(new Date(NOW + DAY).toISOString(), NOW), false);
  assert.equal(isWithinOverdueWindow(new Date(NOW - 1000).toISOString(), NOW), true);
  assert.equal(isWithinOverdueWindow(new Date(NOW - 30 * DAY).toISOString(), NOW), true);
  assert.equal(isWithinOverdueWindow(new Date(NOW - 31 * DAY).toISOString(), NOW), false);
  assert.equal(isWithinOverdueWindow(null, NOW), false);
});

// ── overdueDays（本地日曆天差）──
test('overdueDays: 同日 → 0；昨天 → 1；未來 → 0（夾住）', () => {
  const now = new Date('2026-07-21T20:00:00');
  assert.equal(overdueDays(new Date('2026-07-21T08:00:00').toISOString(), now), 0);
  assert.equal(overdueDays(new Date('2026-07-20T23:59:00').toISOString(), now), 1);
  assert.equal(overdueDays(new Date('2026-07-25T00:00:00').toISOString(), now), 0);
});

// ── isExamConcluded（考試時間已過＝已結束，歸入已完成桶；見 2026-07-22 決策）──
const { isExamConcluded } = DueTaskRules;

test('isExamConcluded: 過期考試 → true；未來考試 → false', () => {
  assert.equal(isExamConcluded({ name: 'Midterm Exam', due_at: new Date(NOW - DAY).toISOString() }, NOW), true);
  assert.equal(isExamConcluded({ name: 'Midterm Exam', due_at: new Date(NOW + DAY).toISOString() }, NOW), false);
});

test('isExamConcluded: 剛好到時 → true（due 即開考/結束時點，過了就不可再行動）', () => {
  assert.equal(isExamConcluded({ name: 'Final Quiz', due_at: new Date(NOW).toISOString() }, NOW), true);
});

test('isExamConcluded: 非考試過期 → false（一般作業仍可補繳，不歸這規則管）', () => {
  assert.equal(isExamConcluded({ name: 'Lab Report 3', due_at: new Date(NOW - DAY).toISOString() }, NOW), false);
});

test('isExamConcluded: 考試無截止日/日期無效 → false（無從判定結束）', () => {
  assert.equal(isExamConcluded({ name: 'Midterm Exam', due_at: null }, NOW), false);
  assert.equal(isExamConcluded({ name: 'Midterm Exam', due_at: 'not-a-date' }, NOW), false);
  assert.equal(isExamConcluded(null, NOW), false);
});

// ── 交付物誤判回歸（QA 2026-10-22 P0-2：要交的作業被當考試/簽到永久隱藏）──
test('isAttendance: 需字邊界——Design Inspiration / Checking 不是簽到', () => {
  assert.equal(isAttendance({ name: 'Design Inspiration Board' }), false);   // de-"sign in"-spiration
  assert.equal(isAttendance({ name: 'Checking Algorithm HW' }), false);      // "checkin"-g
  assert.equal(isAttendance({ name: 'Sign-in Sheet Week 3' }), true);
  assert.equal(isAttendance({ name: 'Lab check in' }), true);
  assert.equal(isAttendance({ name: 'Week 5 Check-in' }), true);
});

test('isAttendance: 名稱含交付物詞（report / reflection / 心得…）→ false', () => {
  assert.equal(isAttendance({ name: 'Weekly Check-in Report' }), false);
  assert.equal(isAttendance({ name: 'Participation Reflection' }), false);
  assert.equal(isAttendance({ name: '出勤心得' }), false);
});

test('isExam: 名稱含交付物詞 → false', () => {
  assert.equal(isExam({ name: 'Midterm Project Report' }), false);
  assert.equal(isExam({ name: 'Final Exam Review Worksheet' }), false);
  assert.equal(isExam({ name: 'Unit Test 3 Report' }), false);
  assert.equal(isExam({ name: 'Exam Paper Review Assignment' }), false);
  assert.equal(isExam({ name: 'Midterm Presentation Slides' }), false);
  assert.equal(isExam({ name: '小考錯題整理作業' }), false);
});

test('isExam: 真的考試照抓（Take-home Exam / Final Exam / Lab Test 2）', () => {
  assert.equal(isExam({ name: 'Take-home Exam' }), true);
  assert.equal(isExam({ name: 'Final Exam' }), true);
  assert.equal(isExam({ name: 'Lab Test 2' }), true);
});

test('isExam: Canvas 事實（online_quiz）不受交付物詞影響 → true', () => {
  assert.equal(isExam({ name: 'Reading Report Quiz', submission_types: ['online_quiz'] }), true);
});

test('isExamConcluded: 要上傳的考試（take-home）過期 → false（還能補交）；紙本/線上測驗 → true', () => {
  const past = new Date(NOW - DAY).toISOString();
  assert.equal(isExamConcluded({ name: 'Take-home Exam', submission_types: ['online_upload'], due_at: past }, NOW), false);
  assert.equal(isExamConcluded({ name: 'Midterm Exam', submission_types: ['on_paper'], due_at: past }, NOW), true);
  assert.equal(isExamConcluded({ name: 'Quiz 3', submission_types: ['online_quiz'], due_at: past }, NOW), true);
});

// ── 中心語在後（head-final）規則（2026-10-23 review rules-1/2/3、CC-1/2）──
// 舊「名稱含任一交付物詞即否決」會誤放真考試（作業系統期中考），又漏擋沒列到的交付物（Midterm Paper）。
// 新規則：去掉括號旁註與尾端介系詞子句後，最後一個考試詞之後沒有交付物詞才算考試。
test('isExam(head-final): 考試詞後接交付物 → false（要交的東西）', () => {
  for (const name of [
    'Midterm Paper', 'Midterm Poster', 'Midterm Milestone', 'Midterm Code Submission',
    'Midterm Write-up', 'Midterm Research Plan', 'Midterm Self-Assessment',
    'Quiz 2 Corrections', 'Test 1 Correction', 'Exam Wrapper',
    '期中考後反思', '小考訂正', '期中考論文',
    'Midterm Project Report', 'Final Exam Review Worksheet', 'Unit Test 3 Report',
    'Exam Paper Review Assignment', 'Midterm Presentation Slides', '小考錯題整理作業',
  ]) {
    assert.equal(isExam({ name }), false, name);
  }
});

test('isExam(head-final): 考試詞為中心語 → true（交付物詞在前、在括號或介系詞子句裡不算）', () => {
  for (const name of [
    'Take-home Exam', 'Final Exam', 'Lab Test 2',
    'Midterm Exam (covers Homework 1-4)', 'Final Exam (Lecture Slides 1-12)',
    'In-class Quiz on Assignment 2', '小考（第三章作業範圍）',
    '作業系統期中考', '作業研究 期末考', '作業系統 小考 3',
    'Project Management Midterm Exam', 'Software Project Management Final Exam',
    'Project Management Quiz 2', 'Paper Reading Quiz 1',
  ]) {
    assert.equal(isExam({ name }), true, name);
  }
});

test('isExam(head-final): 交付物為中心語、考試詞只在介系詞子句 → false', () => {
  assert.equal(isExam({ name: 'Reflection on Quiz 2' }), false);
  assert.equal(isExam({ name: 'Report about Midterm Exam' }), false);
});

test('isExam(head-final): 整個名稱都在括號裡 → 仍判定（不因去旁註而清空）', () => {
  assert.equal(isExam({ name: '[Quiz 3]' }), true);
  assert.equal(isExam({ name: '【期中考】' }), true);
});

test('isAttendance(head-final): 簽到詞容許數字/底線相鄰、複數 → true', () => {
  for (const name of [
    'Weekly Check-ins', 'Lab Check-ins (W1-W13)', 'Check-in1', 'Tutorial sign-ins', 'Attendances',
    'Week1_Attendance', 'Attendance_W3', 'Attendance1', 'L02Attendance', 'Participation_Lab4',
    'Check-in_Week2', 'Attendance (Project Presentation Day)', 'Week 5 Check-in', 'Lab check in',
    'Sign-in Sheet Week 3',
  ]) {
    assert.equal(isAttendance({ name }), true, name);
  }
});

test('isAttendance(head-final): 字母相鄰（非完整詞）或後接交付物 → false', () => {
  for (const name of [
    'Design Inspiration Board', 'Checking Algorithm HW', 'Check Inheritance Lab',
    'Weekly Check-in Report', 'Participation Reflection', '出勤心得',
  ]) {
    assert.equal(isAttendance({ name }), false, name);
  }
});

test('isExamConcluded: 括號旁註含交付物詞的紙本考試過期 → true', () => {
  const past = new Date(NOW - DAY).toISOString();
  assert.equal(isExamConcluded({ name: 'Midterm Exam (covers Homework 1-4)', submission_types: ['on_paper'], due_at: past }, NOW), true);
});

// ── 自訂作業不套名稱分類器（QA P1-6，#6/#71/#96）──
// 使用者親手建立的待辦：不自動隱藏、截止後不自動判完成、不當考試上紫色——三者都源自 isExam/isAttendance
const { isHideable } = DueTaskRules;

test('custom: 名稱含考試/簽到詞的自訂作業 → isExam / isAttendance / isHideable 皆 false', () => {
  for (const name of ['Midterm review', '複習 Midterm Exam 範圍', 'Quiz 3 (in class, not on Canvas)', '小考準備']) {
    assert.equal(isExam({ _isCustom: true, name }), false, name);
    assert.equal(isHideable({ _isCustom: true, name }), false, name);
  }
  assert.equal(isAttendance({ _isCustom: true, name: 'Lab sign-in' }), false);
  assert.equal(isHideable({ _isCustom: true, name: '簽到' }), false);
});

test('custom: 同名的 Canvas 項仍照分類（守衛只看 _isCustom）', () => {
  assert.equal(isExam({ name: 'Midterm review' }), true);
  assert.equal(isHideable({ name: 'Midterm review' }), true);
  assert.equal(isHideable({ name: 'Lab sign-in' }), true);
  assert.equal(isHideable({ name: 'Lab Report 3' }), false);
  assert.equal(isHideable(null), false);
});

test('custom: 名為 Midterm review 的自訂作業過期 → isExamConcluded false（不自動完成）', () => {
  const past = new Date(NOW - 3600000).toISOString();
  assert.equal(isExamConcluded({ _isCustom: true, name: 'Midterm review', due_at: past }, NOW), false);
  assert.equal(isExamConcluded({ name: 'Midterm review', due_at: past }, NOW), true);
});

// ── 結構規則：Canvas 繳交方式優先（2026-10-23 B2-1）──
// 要學生「交東西」的繳交方式（上傳/文字/網址/錄音錄影/批註/討論區）→ 一定是要做的事，
// 名稱再像考試/簽到都不隱藏；名稱規則只在繳交方式缺漏或不是交件型時才用。
const DELIVERABLE_TYPES = ['online_upload', 'online_text_entry', 'online_url', 'media_recording', 'student_annotation', 'discussion_topic'];

test('structural: 交件型繳交方式 → isExam / isAttendance / isHideable 皆 false（名稱再像也一樣）', () => {
  for (const type of DELIVERABLE_TYPES) {
    for (const name of ['Final Exam', 'Midterm', 'Quiz 3', 'Test 2', '期中考', 'Attendance', 'Week 5 Check-in', '簽到']) {
      const a = { name, submission_types: [type] };
      assert.equal(isExam(a), false, `isExam ${name} / ${type}`);
      assert.equal(isAttendance(a), false, `isAttendance ${name} / ${type}`);
      assert.equal(isHideable(a), false, `isHideable ${name} / ${type}`);
    }
  }
});

test('structural: 指定案例（Midterm Paper / Take-home Exam 上傳 → 顯示；紙本考試、none 簽到、線上測驗 → 隱藏）', () => {
  assert.equal(isExam({ name: 'Midterm Paper', submission_types: ['online_upload'] }), false);
  assert.equal(isExam({ name: 'Midterm Exam', submission_types: ['on_paper'] }), true);
  assert.equal(isExam({ name: 'Take-home Exam', submission_types: ['online_upload'] }), false);
  assert.equal(isHideable({ name: 'Take-home Exam', submission_types: ['online_upload'] }), false);
  assert.equal(isAttendance({ name: 'Week 5 Check-in', submission_types: ['none'] }), true);
  assert.equal(isAttendance({ name: 'Discussion Participation', submission_types: ['discussion_topic'] }), false);
  assert.equal(isHideable({ name: 'Discussion Participation', submission_types: ['discussion_topic'] }), false);
  assert.equal(isExam({ name: 'Quiz 3', submission_types: ['online_quiz'] }), true);
  assert.equal(isExam({ _isCustom: true, name: 'Quiz 3 prep' }), false);
});

test('structural: 交件型與非交件型並存 → 交件型勝出（仍要交東西）', () => {
  assert.equal(isExam({ name: 'Final Exam', submission_types: ['on_paper', 'online_upload'] }), false);
  assert.equal(isAttendance({ name: 'Attendance', submission_types: ['none', 'online_text_entry'] }), false);
});

test('structural: 繳交方式缺漏或非交件型（none / on_paper / not_graded / external_tool…）→ 走名稱規則', () => {
  for (const types of [undefined, null, [], ['none'], ['on_paper'], ['not_graded'], ['external_tool'], ['wiki_page']]) {
    const label = JSON.stringify(types);
    assert.equal(isExam({ name: 'Final Exam', submission_types: types }), true, `Final Exam ${label}`);
    assert.equal(isExam({ name: 'Homework 3', submission_types: types }), false, `Homework 3 ${label}`);
    assert.equal(isAttendance({ name: 'Week 3 Attendance', submission_types: types }), true, `Attendance ${label}`);
    assert.equal(isAttendance({ name: 'Weekly Check-in Report', submission_types: types }), false, `Check-in Report ${label}`);
  }
});

test('structural: Canvas 測驗旗標先於交件判定（is_quiz_assignment＝quiz LTI，New Quizzes 為 external_tool）', () => {
  assert.equal(isExam({ name: 'Week 3 Check', is_quiz_assignment: true, submission_types: ['external_tool'] }), true);
  assert.equal(isExam({ name: 'Reading Response', is_quiz_assignment: true, submission_types: ['online_upload'] }), true);
});

test('structural isExamConcluded: 交件型「考試」過期 → false（照一般作業算逾期）；none / on_paper / external_tool → true', () => {
  const past = new Date(NOW - DAY).toISOString();
  assert.equal(isExamConcluded({ name: 'Final Exam', submission_types: ['online_text_entry'], due_at: past }, NOW), false);
  assert.equal(isExamConcluded({ name: 'Midterm', submission_types: ['discussion_topic'], due_at: past }, NOW), false);
  assert.equal(isExamConcluded({ name: 'Final Exam', submission_types: ['none'], due_at: past }, NOW), true);
  assert.equal(isExamConcluded({ name: 'Midterm Exam', submission_types: ['external_tool'], due_at: past }, NOW), true);
});

test('custom: 名為 Midterm 的自訂作業過期 → isExamConcluded false（自訂作業不是考試）', () => {
  const past = new Date(NOW - DAY).toISOString();
  assert.equal(isExamConcluded({ _isCustom: true, name: 'Midterm', due_at: past }, NOW), false);
  assert.equal(isExamConcluded({ name: 'Midterm', due_at: past }, NOW), true);
});

// ── 名稱備援規則：分段 + 段內中心語在後（2026-10-23 B2-2；案例取自 verifier 語料）──
const allEqual = (fn, names, expected) => {
  for (const name of names) assert.equal(fn({ name }), expected, name);
};

test('name: 冒號/破折號/直線後的主題副標不改變中心語 → 考試', () => {
  allEqual(isExam, [
    'Quiz 1 - Software Project Management', 'Quiz 4 – Project Scheduling', 'Midterm Exam — Case Study Analysis',
    'Final Exam - Advanced Topics in Video Processing', 'Midterm Exam: Research Methods and Paper Writing',
    'Quiz 3: Homework Review', 'Exam 2: Essay Questions', 'Quiz 3: Model Evaluation', 'Quiz 5: Assignment Problem',
    'Final Exam: Data Presentation', 'Midterm Exam: Policy Evaluation', 'Quiz 2 – Lecture Slides 3-5',
    'Quiz 2 | Linear Regression', '期中考 - 作業系統', '小考 3 - 作業研究', '期中考：論文閱讀', '小考｜作業研究',
  ], true);
});

test('name: 前導括號標籤自成一段 → 考試', () => {
  allEqual(isExam, [
    '[Quiz] Chapter 3', '[Exam] Midterm', '(Midterm) Chapters 1-5', '【期中考】作業系統', '【期中考】第1-5章',
    '[DSAA2011] Quiz 1',
  ], true);
});

test('name: 「Title: 階段」或「考試: 交付物」形式的交付物 → false', () => {
  allEqual(isExam, [
    'Project Report – Midterm', 'Reflection: Quiz 2', 'Exam Wrapper: Midterm', 'Quiz 2: Corrections',
    'Exam 1: Reflection', '【期中考】反思', '[Midterm] Project Report', 'Midterm: Project Report',
    'Midterm - Project Report', 'Quiz 1 Reflection - Week 3', 'Midterm: Group Presentation',
  ], false);
});

test('name: midterm 只在單獨/接編號/接分隔時才是中心語（Midterm X 的 X 才是要交的東西）', () => {
  allEqual(isExam, [
    'Midterm', 'Midterm 1', 'Midterm #2', 'Midterm-2', 'Midterm: Chapters 1-5', 'Midterm - Chapters 1-5',
    'Take-home Midterm', 'Midterm review', 'DSAA2011 Midterm',
  ], true);
  allEqual(isExam, [
    'Midterm Prototype', 'Midterm Code', 'Midterm Lab', 'Midterm Pitch', 'Midterm Design Review',
    'Midterm Group Work', 'Midterm Implementation', 'Midterm (Project Report)', 'Midterm (Group Presentation)',
    'Midterm 1 (Written Report)',
  ], false);
});

test('name: 介系詞子句保留清單（make-up / retake / part / section）→ 考試本身；其他介系詞子句照去', () => {
  allEqual(isExam, ['Make-up for Midterm Exam', 'Part 1 of Final Exam', 'Retake of Quiz 3', 'Section A of Final Exam'], true);
  allEqual(isExam, ['Midterm Report of Team 3', 'Midterm Project for Group A', 'Summary of Midterm Exam'], false);
});

test('name: test N 排除軟體/HCI/統計用語（unit/usability/user/A/B/integration/t-test…）', () => {
  allEqual(isExam, [
    'Unit Test 3', 'Usability Test 1', 'Usability Test 2 Results', 'User Test 1 Findings', 'A/B Test 1 Analysis',
    'Integration Test 2', 'Load Test 1', 'Lab 4: T-test 2 samples',
  ], false);
  allEqual(isExam, ['Test 1', 'Lab Test 2', 'Class Test 3'], true);
});

test('name: exam paper 是考卷本身 → 考試；其他 paper 照算交付物', () => {
  allEqual(isExam, ['Final Exam Paper', 'Final Exam Paper 1', 'Midterm Exam Paper'], true);
  allEqual(isExam, ['Midterm Paper', 'Exam Paper Review Assignment'], false);
});

test('name: 新增交付物詞（HW、survey、questionnaire、prototype、peer review、作品/汇报/匯報/展示/問卷/问卷）', () => {
  allEqual(isExam, [
    'Quiz & HW 3', 'Exam Prep HW', 'Midterm HW', 'Quiz 2 HWs', 'Midterm Survey', 'Midterm Questionnaire',
    'Midterm Peer Review', 'Midterm 汇报', 'Midterm 匯報', 'Midterm 作品集', '期中考 作品', 'Midterm 展示',
    '期中考問卷', '期中考问卷',
  ], false);
});

test('isAttendance(name): 專案進度 check-in / 軟體 sign-in 頁面 / check in code 不是簽到', () => {
  allEqual(isAttendance, [
    'Project Check-in 1', 'Project Check-in 1 (progress slides)', 'Team Check-in Meeting Notes',
    'Milestone Check In Report', 'Implement Sign-in Feature', 'Lab 3: Sign In Page', 'Sign-in Page Prototype',
    'Check in your code to GitHub', 'Lab 2: Check in code',
  ], false);
  allEqual(isAttendance, [
    'Attendance: Presentation Day', 'Attendance - Guest Lecture on Reports', 'Seminar Attendance for Project Talks',
    'Lab Sign-in Sheet', 'Week 5 Check-in', 'Lab check in', '签到 Week 2',
  ], true);
});

// ── B2 回歸修正（verify-b2 probe）：紙本/現場考試只能靠名稱，收窄過頭會讓考完的考試掛在「已逾期」──
test('name: midterm 後接考試詞（Test / Examination）→ 強分類詞，旁註提到交付物也照算考試', () => {
  allEqual(isExam, [
    'Midterm Test', 'Midterm Test 2', 'Midterm Examination', 'Midterm Examination 1', 'Mid-term Test', 'Mid Term Test',
    'Midterm Test (covers Homework 1-4)', 'Midterm Examination (Assignments 1-3)', 'Final Examination',
    'Final Examination (Lecture Slides 1-12)',
  ], true);
  // 考試詞後面仍有交付物 → 交付物；軟體課的 test cases / suites 不是考試
  allEqual(isExam, [
    'Midterm Test Plan', 'Midterm Test Report', 'Midterm Test Cases', 'Midterm Test Suite', 'Final Examination Essay',
    'Examination of algorithms',
  ], false);
});

test('name: midterm 後接序號（II / I / A）或場次說法（retake / make-up / resit / part N / online / in-class / grade / score）→ 考試', () => {
  allEqual(isExam, [
    'Midterm II', 'Midterm I', 'Midterm A', 'Midterm B', 'Midterm II Review', 'Mid-term', 'Midterm Retake', 'Midterm Makeup',
    'Midterm Make-up', 'Midterm Resit', 'Midterm Part 1', 'Midterm Part A', 'Midterm Online', 'Midterm In-class',
    'Midterm Closed-book', 'Midterm Grade', 'Midterm Score', 'Midterm Marks',
  ], true);
  // 序號/場次後面還有交付物，或 midterm 後接一般詞 → 仍是交付物（弱分類詞規則不變）
  allEqual(isExam, [
    'Midterm II Project', 'Midterm Part 1 Report', 'Midterm Online Survey', 'Midterm Retake (Written Report)',
    'Midterm A/B Testing Report', 'Midterm Video', 'Midterm Implementation', 'Midterm Assessment (Group Presentation)',
    'Midterm Score Report',
    // 模稜兩可、刻意偏向顯示：assessment 也可能是簡報/作品評量
    'Midterm Assessment',
  ], false);
});

test('isExamConcluded: 紙本「Midterm Examination」/ none「Midterm II」過期 → true（不掛在已逾期）', () => {
  const past = new Date(NOW - 2 * DAY).toISOString();
  assert.equal(isExamConcluded({ name: 'Midterm Examination', submission_types: ['on_paper'], due_at: past }, NOW), true);
  assert.equal(isExamConcluded({ name: 'Midterm Test', submission_types: ['on_paper'], due_at: past }, NOW), true);
  assert.equal(isExamConcluded({ name: 'Midterm II', submission_types: ['none'], due_at: past }, NOW), true);
  assert.equal(isExamConcluded({ name: 'Midterm Retake', submission_types: ['none'], due_at: past }, NOW), true);
});

test('isAttendance(name): 「Check-in to Lecture 5」「Check in the classroom」是簽到；版控語意才排除', () => {
  allEqual(isAttendance, [
    'Check-in to Lecture 5', 'Check in the classroom', 'Check in to class', 'Check-in to Tutorial 3',
    'Check in the lab', 'Check-ins to Seminar',
  ], true);
  allEqual(isAttendance, [
    'Check in your code to GitHub', 'Lab 2: Check in code', 'Check in the code', 'Check in your changes',
    'Check-in to GitHub', 'Check in Lab 3 to the repo', 'Check in changes to repository',
    // 團隊/小組 check-in 是進度會議（要準備進度），刻意不當簽到
    'Team Check-in', 'Group Check-in Week 2',
  ], false);
});

test('name: 兩側都是數字的破折號是範圍（Homework 1–3 Quiz），不切段；其餘破折號照切', () => {
  allEqual(isExam, [
    'Homework 1–3 Quiz', 'Exercises 1–5 Quiz', 'Homework 1 – 3 Quiz', 'HW 1 - 3 Quiz', 'Assignments 1—4 Exam',
    'Quiz 4–Project Scheduling', 'Quiz 4 – Project Scheduling', 'Quiz 2 – Lecture Slides 3-5',
  ], true);
  allEqual(isExam, ['Project Report – Midterm', 'Midterm - Project Report', 'Quiz 1 Reflection - Week 3'], false);
});

test('name: 超長名稱（含長空白串）不會卡住', () => {
  const t0 = Date.now();
  for (const name of ['Quiz' + ' '.repeat(50000) + 'x', 'Quiz' + ' -'.repeat(20000), '('.repeat(50000), 'problem '.repeat(6000),
    'Check in' + ' to'.repeat(20000), 'Midterm' + ' #'.repeat(20000) + 'x', '1 – '.repeat(20000), 'Midterm II '.repeat(6000)]) {
    isExam({ name });
    isAttendance({ name });
  }
  assert.ok(Date.now() - t0 < 2000, `took ${Date.now() - t0}ms`);
});

console.log('ALL taskRules TESTS PASSED');

const assert = require('node:assert/strict');
const DueCustomAssignments = require('./customAssignments.js');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('default due value is seven days later at 23:59 local time', () => {
  const value = DueCustomAssignments.getDefaultDueLocalValue(new Date(2026, 2, 6, 10, 15));
  assert.equal(value, '2026-03-13T23:59');
});

test('creates a custom assignment with trimmed fields and ISO due date', () => {
  const assignment = DueCustomAssignments.createCustomAssignment({
    courseId: '42',
    name: '  Project draft  ',
    description: '  Bring outline  ',
    dueLocalValue: '2026-03-13T23:59',
    idFactory: () => 'custom-fixed-id',
  });

  assert.equal(assignment.id, 'custom-fixed-id');
  assert.equal(assignment.course_id, 42);
  assert.equal(assignment.name, 'Project draft');
  assert.equal(assignment.description, 'Bring outline');
  assert.equal(assignment.due_at, new Date(2026, 2, 13, 23, 59).toISOString());
  assert.equal(assignment._isCustom, true);
});

test('rejects blank assignment names', () => {
  assert.throws(() => {
    DueCustomAssignments.createCustomAssignment({
      courseId: '42',
      name: '   ',
      dueLocalValue: '2026-03-13T23:59',
    });
  }, /name is required/);
});

test('merges Canvas and custom assignments by course id without mutating inputs', () => {
  const canvasAssignments = {
    42: [{ id: 1, name: 'Canvas item', due_at: '2026-03-10T00:00:00.000Z' }],
  };
  const customAssignments = {
    42: [{ id: 'custom-1', name: 'Custom item', course_id: 42, due_at: '2026-03-11T00:00:00.000Z' }],
    99: [{ id: 'custom-2', name: 'Other item', course_id: 99, due_at: null }],
  };

  const merged = DueCustomAssignments.mergeAssignmentMaps(canvasAssignments, customAssignments);

  assert.deepEqual(merged[42].map((a) => a.name), ['Canvas item', 'Custom item']);
  assert.deepEqual(merged[99].map((a) => a.name), ['Other item']);
  assert.equal(canvasAssignments[42].length, 1);
});

test('updates a custom assignment while preserving id and created_at', () => {
  const existing = {
    id: 'custom-fixed-id',
    course_id: 42,
    name: 'Old name',
    description: 'Old desc',
    due_at: new Date(2026, 2, 13, 23, 59).toISOString(),
    submission: null,
    points_possible: null,
    html_url: null,
    _isCustom: true,
    created_at: '2026-03-06T02:15:00.000Z',
  };

  const updated = DueCustomAssignments.updateCustomAssignment(existing, {
    courseId: '77',
    name: '  New name  ',
    description: '  New desc  ',
    dueLocalValue: '2026-04-01T18:30',
  });

  assert.equal(updated.id, 'custom-fixed-id');
  assert.equal(updated.created_at, '2026-03-06T02:15:00.000Z');
  assert.equal(updated.course_id, 77);
  assert.equal(updated.name, 'New name');
  assert.equal(updated.description, 'New desc');
  assert.equal(updated.due_at, new Date(2026, 3, 1, 18, 30).toISOString());
  assert.equal(updated._isCustom, true);
  // 不 mutate 原物件
  assert.equal(existing.name, 'Old name');
  assert.equal(existing.course_id, 42);
});

test('update clears due date when no due value is provided', () => {
  const existing = {
    id: 'custom-1', course_id: 5, name: 'Task', description: '',
    due_at: new Date(2026, 2, 13, 23, 59).toISOString(), _isCustom: true,
    created_at: '2026-03-01T00:00:00.000Z',
  };
  const updated = DueCustomAssignments.updateCustomAssignment(existing, {
    courseId: 5, name: 'Task', description: '', dueLocalValue: '',
  });
  assert.equal(updated.due_at, null);
});

test('update rejects blank assignment names', () => {
  assert.throws(() => {
    DueCustomAssignments.updateCustomAssignment(
      { id: 'custom-1', created_at: 'x', _isCustom: true },
      { courseId: '42', name: '   ', dueLocalValue: '2026-03-13T23:59' },
    );
  }, /name is required/);
});

// QA #161：Chrome 的 datetime-local 年欄位可打到 6 位數（2 0 2 6 1 1 → 202611 年）→ new Date 得 Invalid Date，
// 原本 toISOString 拋 RangeError、被 UI 當成「請輸入作業名稱」。改為拋帶 code 的錯誤，UI 才能顯示日期錯誤
test('rejects an unparseable due date (6-digit year) with code invalid_due', () => {
  assert.throws(() => {
    DueCustomAssignments.createCustomAssignment({
      courseId: '42', name: 'Essay draft', dueLocalValue: '202611-10-29T23:59',
    });
  }, (err) => err.code === 'invalid_due');
});

test('rejects an implausible year (two-digit year typed → 0026) with code invalid_due', () => {
  assert.throws(() => {
    DueCustomAssignments.createCustomAssignment({
      courseId: '42', name: 'Essay draft', dueLocalValue: '0026-10-29T23:59',
    });
  }, (err) => err.code === 'invalid_due');
});

test('update also rejects an invalid due date with code invalid_due', () => {
  assert.throws(() => {
    DueCustomAssignments.updateCustomAssignment(
      { id: 'custom-1', created_at: 'x', _isCustom: true },
      { courseId: '42', name: 'Task', dueLocalValue: '202611-10-29T23:59' },
    );
  }, (err) => err.code === 'invalid_due');
});

test('blank name error carries code name_required', () => {
  assert.throws(() => {
    DueCustomAssignments.createCustomAssignment({ courseId: '42', name: ' ', dueLocalValue: '2026-03-13T23:59' });
  }, (err) => err.code === 'name_required');
});

test('isValidDueLocalValue accepts empty and normal dates, rejects bad years', () => {
  assert.equal(DueCustomAssignments.isValidDueLocalValue(''), true);
  assert.equal(DueCustomAssignments.isValidDueLocalValue('2026-10-29T23:59'), true);
  assert.equal(DueCustomAssignments.isValidDueLocalValue('202611-10-29T23:59'), false);
  assert.equal(DueCustomAssignments.isValidDueLocalValue('0026-10-29T23:59'), false);
});

test('update rejects a missing existing assignment', () => {
  assert.throws(() => {
    DueCustomAssignments.updateCustomAssignment(null, { name: 'X' });
  }, /existing assignment is required/);
});

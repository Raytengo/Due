(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueCustomAssignments = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CUSTOM_PREFIX = 'custom-assignment-';

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function toDatetimeLocalValue(date) {
    return [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate()),
    ].join('-') + `T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }

  function getDefaultDueLocalValue(now = new Date()) {
    const due = new Date(now);
    due.setDate(due.getDate() + 7);
    due.setHours(23, 59, 0, 0);
    return toDatetimeLocalValue(due);
  }

  function normalizeCourseId(courseId) {
    const asNumber = Number(courseId);
    return Number.isFinite(asNumber) && String(courseId).trim() !== '' ? asNumber : courseId;
  }

  function defaultIdFactory() {
    const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${CUSTOM_PREFIX}${randomPart}`;
  }

  function createCustomAssignment(input) {
    const name = (input.name || '').trim();
    if (!name) throw new Error('name is required');

    const courseId = normalizeCourseId(input.courseId);
    const dueAt = input.dueLocalValue ? new Date(input.dueLocalValue).toISOString() : null;
    const idFactory = input.idFactory || defaultIdFactory;

    return {
      id: idFactory(),
      course_id: courseId,
      name,
      description: (input.description || '').trim(),
      due_at: dueAt,
      submission: null,
      points_possible: null,
      html_url: null,
      _isCustom: true,
      created_at: new Date().toISOString(),
    };
  }

  // 更新既有自訂作業：保留 id / created_at / _isCustom，更新 name / description / due_at / course_id。
  // 沿用 createCustomAssignment 的 normalize 與驗證（空名 throw）。回傳新物件，不 mutate existing。
  function updateCustomAssignment(existing, input) {
    if (!existing || !existing.id) throw new Error('existing assignment is required');
    const name = (input.name || '').trim();
    if (!name) throw new Error('name is required');

    const courseId = normalizeCourseId(input.courseId);
    const dueAt = input.dueLocalValue ? new Date(input.dueLocalValue).toISOString() : null;

    return {
      ...existing,
      course_id: courseId,
      name,
      description: (input.description || '').trim(),
      due_at: dueAt,
      submission: null,
      _isCustom: true,
      id: existing.id,
      created_at: existing.created_at,
    };
  }

  function normalizeCustomAssignment(assignment, fallbackCourseId) {
    if (!assignment || !assignment.id || !assignment.name) return null;
    const courseId = assignment.course_id != null
      ? assignment.course_id
      : normalizeCourseId(fallbackCourseId);
    return {
      ...assignment,
      course_id: normalizeCourseId(courseId),
      submission: null,
      _isCustom: true,
    };
  }

  function normalizeCustomAssignmentMap(customAssignments = {}) {
    const normalized = {};
    Object.entries(customAssignments || {}).forEach(([courseId, assignments]) => {
      const list = Array.isArray(assignments) ? assignments : [];
      const cleaned = list
        .map((assignment) => normalizeCustomAssignment(assignment, courseId))
        .filter(Boolean);
      if (cleaned.length) normalized[courseId] = cleaned;
    });
    return normalized;
  }

  function mergeAssignmentMaps(canvasAssignments = {}, customAssignments = {}) {
    const merged = {};
    const normalizedCustom = normalizeCustomAssignmentMap(customAssignments);
    const courseIds = new Set([
      ...Object.keys(canvasAssignments || {}),
      ...Object.keys(normalizedCustom),
    ]);

    courseIds.forEach((courseId) => {
      merged[courseId] = [
        ...((canvasAssignments && canvasAssignments[courseId]) || []),
        ...((normalizedCustom && normalizedCustom[courseId]) || []),
      ];
    });

    return merged;
  }

  // ── 表單草稿（N2）──
  // ✕／Esc 關掉視窗時保留已輸入的內容（只存在記憶體），重開「同一個」視窗才還原；送出或按「取消」才丟掉。
  // 「同一個」＝同一個 key：新增作業一律 'new'；編輯作業 'edit:<id>'（開別筆就重新開始）；
  // 權重視窗用 weightDraftKey(courseId)（開別門課就重新開始）
  function formDraftKey(editing) {
    return editing && editing.id != null ? `edit:${editing.id}` : 'new';
  }

  function weightDraftKey(courseId) {
    return `weight:${courseId}`;
  }

  // draft：{ key, values } 或 null；key 相同才回傳 values，否則 null（＝重新開始）
  function draftValuesFor(draft, key) {
    return draft && draft.key === key ? draft.values : null;
  }

  return {
    CUSTOM_PREFIX,
    createCustomAssignment,
    draftValuesFor,
    formDraftKey,
    weightDraftKey,
    updateCustomAssignment,
    getDefaultDueLocalValue,
    mergeAssignmentMaps,
    normalizeCustomAssignmentMap,
    toDatetimeLocalValue,
  };
});

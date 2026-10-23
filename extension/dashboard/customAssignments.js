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

  // 帶 code 的錯誤：UI 依 code 顯示對應文案（name_required → 名稱；invalid_due → 截止日期）
  function codedError(message, code) {
    const err = new Error(message);
    err.code = code;
    return err;
  }

  function requireName(input) {
    const name = (input.name || '').trim();
    if (!name) throw codedError('name is required', 'name_required');
    return name;
  }

  // 截止日期合理範圍：Chrome 的 datetime-local 年欄位可打到 6 位數（2 0 2 6 1 1 → 202611 年，new Date 得 Invalid Date），
  // 只打兩位數則成 0026 年——兩者都是打錯，不是真的截止日（QA #161/#162）
  const MIN_DUE_YEAR = 2000;
  const MAX_DUE_YEAR = 9999;

  function isValidDueLocalValue(value) {
    if (!value) return true;   // 空值＝無截止日期，合法
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;
    const y = d.getFullYear();
    return y >= MIN_DUE_YEAR && y <= MAX_DUE_YEAR;
  }

  // datetime-local 值 → ISO（空值 → null）；無效或年份不合理 → throw code 'invalid_due'
  function parseDueLocalValue(value) {
    if (!value) return null;
    if (!isValidDueLocalValue(value)) throw codedError('invalid due date', 'invalid_due');
    return new Date(value).toISOString();
  }

  function createCustomAssignment(input) {
    const name = requireName(input);

    const courseId = normalizeCourseId(input.courseId);
    const dueAt = parseDueLocalValue(input.dueLocalValue);
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
    const name = requireName(input);

    const courseId = normalizeCourseId(input.courseId);
    const dueAt = parseDueLocalValue(input.dueLocalValue);

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
    MIN_DUE_YEAR,
    MAX_DUE_YEAR,
    createCustomAssignment,
    draftValuesFor,
    formDraftKey,
    weightDraftKey,
    updateCustomAssignment,
    isValidDueLocalValue,
    getDefaultDueLocalValue,
    mergeAssignmentMaps,
    normalizeCustomAssignmentMap,
    toDatetimeLocalValue,
  };
});

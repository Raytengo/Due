// ── 顏色池（評分比重分組用） ──
const GROUP_COLORS = [
  '#d97757', '#6a9bcc', '#788c5d', '#b09050',
  '#a86070', '#7a9ba8', '#b08060', '#6a7c5d',
];

// ── 截止日期處理 ──
function urgencyClass(dueAt, isExam) {
  if (!dueAt) return 'due-none';
  if (isExam) return 'due-exam';
  const diff = new Date(dueAt) - Date.now();
  if (diff < 0) return 'due-past';
  const days = diff / 86400000;
  if (days <= 7) return 'due-urgent';
  if (days <= 30) return 'due-soon';
  return 'due-later';
}

function formatDue(dueAt) {
  if (!dueAt) return '無截止日期';
  const d = new Date(dueAt);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / 86400000);

  const dateStr = d.toLocaleDateString('zh-TW', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (diffMs < 0) return `${dateStr}（已過期）`;
  if (diffDays === 0) return `${dateStr}（今天）`;
  if (diffDays === 1) return `${dateStr}（明天）`;
  return `${dateStr}（${diffDays} 天後）`;
}

function formatLastSync(iso) {
  if (!iso) return '尚未同步';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '剛才同步';
  if (m < 60) return `${m} 分鐘前同步`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前同步`;
  return `${Math.floor(h / 24)} 天前同步`;
}

function isExam(assignment) {
  const title = (assignment.name || '').toLowerCase();
  return title.includes('exam') || title.includes('quiz') || title.includes('test') || title.includes('midterm') || title.includes('final');
}

// ── 全域 filter 狀態 ──
let currentFilter = 'all';

// ── 主要渲染 ──
function render(data) {
  const { lastSync, courses = [], assignments = {}, assignmentGroups = {} } = data;

  document.getElementById('header-meta').textContent =
    `HKUST(GZ) · ${courses.length} 門課程 · ${formatLastSync(lastSync)}`;

  renderWeekSection(courses, assignments);
  renderCoursesSection(courses, assignments, assignmentGroups);
}

// ── 本週待辦 ──
function renderWeekSection(courses, assignments) {
  const el = document.getElementById('week-section');
  const now = Date.now();
  const weekMs = 7 * 86400000;

  const items = [];
  for (const course of courses) {
    const asgns = assignments[course.id] || [];
    for (const a of asgns) {
      if (!a.due_at) continue;
      const diff = new Date(a.due_at) - now;
      if (diff >= 0 && diff <= weekMs) {
        if (currentFilter === 'submitted' && !isSubmitted(a)) continue;
        if (currentFilter === 'unsubmitted' && isSubmitted(a)) continue;
        items.push({ ...a, _course: course });
      }
    }
  }

  items.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

  const uClass = (a) => urgencyClass(a.due_at, isExam(a));

  const rows = items.length
    ? items.map((a) => `
        <div class="week-item">
          <div class="week-item-left">
            <div class="week-item-title">${esc(a.name)}</div>
            <div class="week-item-course">${esc(a._course.course_code || a._course.name)}</div>
          </div>
          <div class="week-item-due ${uClass(a)}">${formatDue(a.due_at)}</div>
        </div>`)
      .join('')
    : '<div class="week-empty">本週沒有待繳作業</div>';

  el.innerHTML = `
    <div class="week-panel">
      <div class="section-label">本週待辦（7 天內）</div>
      ${rows}
    </div>`;
}

// ── 課程卡片 ──
function renderCoursesSection(courses, assignments, assignmentGroups) {
  const el = document.getElementById('courses-section');

  if (!courses.length) {
    el.innerHTML = `
      <div class="state-msg">
        <div class="big">尚無資料</div>
        <div class="small">請先前往 Canvas 頁面或點擊同步</div>
      </div>`;
    return;
  }

  // 排序：有最緊急作業的課程排前面
  const sorted = [...courses].sort((a, b) => {
    const nextDue = (cid) => {
      const asgns = (assignments[cid] || []).filter((x) => x.due_at && new Date(x.due_at) > new Date());
      if (!asgns.length) return Infinity;
      return Math.min(...asgns.map((x) => new Date(x.due_at).getTime()));
    };
    return nextDue(a.id) - nextDue(b.id);
  });

  el.innerHTML = `
    <div class="courses-section">
      <div class="section-label">所有課程</div>
      ${sorted.map((c) => renderCourseCard(c, assignments[c.id] || [], assignmentGroups[c.id] || [])).join('')}
    </div>`;

  // 綁定展開
  el.querySelectorAll('.course-header').forEach((header) => {
    header.addEventListener('click', () => {
      const card = header.closest('.course-card');
      card.classList.toggle('open');
    });
  });

  // 綁定作業展開描述
  el.querySelectorAll('.assignment-item').forEach((item) => {
    item.addEventListener('click', () => {
      const desc = item.nextElementSibling;
      if (desc && desc.classList.contains('assignment-desc')) {
        desc.classList.toggle('open');
      }
    });
  });
}

function isSubmitted(a) {
  return a.submission && (a.submission.submitted_at || a.submission.workflow_state === 'submitted' || a.submission.workflow_state === 'graded');
}

function renderCourseCard(course, asgns, groups) {
  // 過濾依 filter
  let filtered = asgns;
  if (currentFilter === 'submitted') filtered = asgns.filter(isSubmitted);
  if (currentFilter === 'unsubmitted') filtered = asgns.filter((a) => !isSubmitted(a));

  // 排序：有截止日 → 緊急度；無截止日排最後
  filtered = [...filtered].sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  });

  const urgentCount = filtered.filter((a) => {
    if (!a.due_at) return false;
    const diff = new Date(a.due_at) - Date.now();
    return diff >= 0 && diff <= 7 * 86400000;
  }).length;

  const weightHtml = renderWeightBar(groups);
  const assignmentRows = filtered.map((a) => renderAssignmentRow(a, groups)).join('');

  return `
    <div class="course-card">
      <div class="course-header">
        <div class="course-header-left">
          <div class="course-name">${esc(course.name)}</div>
          <div class="course-code">${esc(course.course_code || '')}</div>
        </div>
        <div class="course-header-right">
          ${urgentCount ? `<div class="course-badge urgent">${urgentCount} 件緊急</div>` : ''}
          <div class="course-badge">${filtered.length} 件</div>
          <div class="chevron">▼</div>
        </div>
      </div>
      <div class="course-body">
        ${weightHtml}
        ${assignmentRows || '<div style="padding:12px 0;color:var(--mid);font-size:13px;">無作業</div>'}
      </div>
    </div>`;
}

function renderWeightBar(groups) {
  if (!groups.length) return '';
  const total = groups.reduce((s, g) => s + (g.group_weight || 0), 0);
  if (!total) return '';

  const segments = groups.map((g, i) => {
    const pct = ((g.group_weight || 0) / total) * 100;
    return `<div class="weight-bar-segment" style="flex:${pct};background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>`;
  }).join('');

  const legend = groups.map((g, i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>
      ${esc(g.name)} ${g.group_weight || 0}%
    </div>`).join('');

  return `
    <div class="weight-section">
      <div class="weight-title">評分比重</div>
      <div class="weight-bar-container">${segments}</div>
      <div class="weight-legend">${legend}</div>
    </div>`;
}

function renderAssignmentRow(a, groups) {
  const submitted = isSubmitted(a);
  const uClass = urgencyClass(a.due_at, isExam(a));
  const groupName = findGroupName(a, groups);
  const desc = a.description ? stripHtml(a.description) : '（無描述）';

  return `
    <div class="assignment-item${submitted ? ' submitted' : ''}">
      <div class="assignment-left">
        <div class="assignment-title">${esc(a.name)}</div>
        ${groupName ? `<div class="assignment-group">${esc(groupName)}</div>` : ''}
      </div>
      <div class="assignment-right">
        <div class="due-label ${uClass}">${formatDue(a.due_at)}</div>
        ${submitted ? '<div class="submitted-badge">已繳</div>' : ''}
      </div>
    </div>
    <div class="assignment-desc">
      <div class="assignment-desc-inner">${desc}</div>
    </div>`;
}

function findGroupName(assignment, groups) {
  for (const g of groups) {
    if (g.assignments && g.assignments.some((a) => a.id === assignment.id)) {
      return g.name;
    }
    if (assignment.assignment_group_id && g.id === assignment.assignment_group_id) {
      return g.name;
    }
  }
  return '';
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Filter 按鈕 ──
document.querySelectorAll('.pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadData();
  });
});

// ── 同步按鈕 ──
document.getElementById('sync-btn').addEventListener('click', () => {
  const btn = document.getElementById('sync-btn');
  btn.textContent = '同步中...';
  btn.disabled = true;
  chrome.runtime.sendMessage({ type: 'SYNC' }, () => {
    btn.textContent = '同步';
    btn.disabled = false;
    loadData();
  });
});

// ── 讀取資料 ──
function loadData() {
  chrome.storage.local.get(
    ['lastSync', 'courses', 'assignments', 'assignmentGroups'],
    (data) => {
      if (!data.courses || !data.courses.length) {
        document.getElementById('header-meta').textContent = '尚無資料，請先前往 Canvas 頁面';
        document.getElementById('week-section').innerHTML = '';
        document.getElementById('courses-section').innerHTML = `
          <div class="state-msg">
            <div class="big">尚無資料</div>
            <div class="small">請先登入 Canvas 並點擊同步</div>
          </div>`;
        return;
      }
      render(data);
    }
  );
}

loadData();

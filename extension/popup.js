const ATTENDANCE_KEYWORDS = [
  'attendance',
  '\u7C3D\u5230',
  'check-in',
  'checkin',
  'sign in',
  'sign-in',
];

let _uiLanguage = 'zh-TW';

const I18N = {
  'zh-TW': {
    taskHeading: 'NEXT 7-DAY TASKS',
    emptyState: '\u4E03\u5929\u5167\u6C92\u6709\u5F85\u7E73\u4F5C\u696D',
    dashboard: '\u958B\u555F Dashboard',
    today: '\u4ECA\u5929',
    tomorrow: '\u660E\u5929',
    daysLater: (n) => `${n}\u5929\u5F8C`,
  },
  'zh-CN': {
    taskHeading: 'NEXT 7-DAY TASKS',
    emptyState: '\u4E03\u5929\u5185\u6CA1\u6709\u5F85\u7F34\u4F5C\u4E1A',
    dashboard: '\u6253\u5F00 Dashboard',
    today: '\u4ECA\u5929',
    tomorrow: '\u660E\u5929',
    daysLater: (n) => `${n}\u5929\u540E`,
  },
  en: {
    taskHeading: 'NEXT 7-DAY TASKS',
    emptyState: 'No pending tasks in the next 7 days',
    dashboard: 'Open Dashboard',
    today: 'Today',
    tomorrow: 'Tomorrow',
    daysLater: (n) => `${n}d`,
  },
};

function tr(key) {
  return (I18N[_uiLanguage] && I18N[_uiLanguage][key]) || I18N['zh-TW'][key];
}

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function applyUILanguage() {
  const taskLabel = document.getElementById('task-label');
  if (taskLabel) taskLabel.textContent = tr('taskHeading');

  const btn = document.getElementById('dashboard-btn');
  if (btn) btn.textContent = tr('dashboard');
}

function isAttendance(name) {
  const lower = (name || '').toLowerCase();
  return ATTENDANCE_KEYWORDS.some((k) => lower.includes(k));
}

function isExam(name) {
  const lower = (name || '').toLowerCase();
  return /\b(exam|quiz|midterm|final|test)\b/.test(lower)
    || lower.includes('\u8003\u8A66')
    || lower.includes('\u8003\u8BD5')
    || lower.includes('\u6E2C\u9A57')
    || lower.includes('\u6D4B\u9A8C');
}

function formatDueShort(isoString) {
  const due = new Date(isoString);
  const now = new Date();
  const diffMs = due - now;
  const diffHours = Math.ceil(diffMs / 3600000);
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffHours <= 0) return tr('today');
  if (diffHours <= 24) return `${diffHours}h`;
  if (diffDays <= 1) return tr('tomorrow');

  const daysLater = tr('daysLater');
  return typeof daysLater === 'function' ? daysLater(diffDays) : `${diffDays}d`;
}

function urgencyClass(isoString) {
  const diff = new Date(isoString) - new Date();
  const days = diff / 86400000;
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'later';
}

function getDisplayName(course, courseNames) {
  if (!course) return '';
  const custom = (courseNames || {})[course.id];
  return custom || course.name || '';
}

function buildCourseMap(courses) {
  const map = {};
  for (const c of (courses || [])) map[c.id] = c;
  return map;
}

function getUpcomingTasks(assignments, courseMap) {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 86400000);
  const tasks = [];

  for (const courseId in assignments) {
    for (const a of assignments[courseId]) {
      if (!a.due_at) continue;
      if (isAttendance(a.name)) continue;
      if (a.submission && (
        a.submission.workflow_state === 'submitted' ||
        a.submission.workflow_state === 'graded' ||
        a.submission.score != null
      )) continue;

      const due = new Date(a.due_at);
      if (due <= now || due > sevenDays) continue;

      tasks.push({
        name: a.name,
        due_at: a.due_at,
        course: courseMap[courseId],
        exam: isExam(a.name),
        html_url: a.html_url || null,
      });
    }
  }

  tasks.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
  return tasks;
}

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTasks(tasks, courseNames) {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  if (tasks.length === 0) {
    list.innerHTML = `<li class="empty-state">${tr('emptyState')}</li>`;
    return;
  }

  for (const task of tasks) {
    const cls = task.exam ? 'exam' : urgencyClass(task.due_at);
    const displayName = getDisplayName(task.course, courseNames);
    const dueStr = formatDueShort(task.due_at);

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <span class="task-dot ${cls}"></span>
      <div class="task-body">
        <div class="task-name${task.html_url ? ' clickable' : ''}">${esc(task.name)}</div>
        <div class="task-meta">${esc(displayName)}</div>
      </div>
      <span class="task-due ${cls}">${esc(dueStr)}</span>
    `;
    if (task.html_url && /^https?:\/\/.+\/courses\/\d+\/(assignments|quizzes|discussion_topics)\/\d+/.test(task.html_url)) {
      li.querySelector('.task-name').addEventListener('click', () => {
        chrome.tabs.create({ url: task.html_url });
      });
    }
    list.appendChild(li);
  }
}

function loadData() {
  chrome.storage.local.get(['courses', 'assignments', 'courseNames'], (data) => {
    const courseMap = buildCourseMap(data.courses);
    const tasks = getUpcomingTasks(data.assignments || {}, courseMap);
    renderTasks(tasks, data.courseNames || {});
  });
}

document.getElementById('dashboard-btn').addEventListener('click', () => {
  const url = chrome.runtime.getURL('dashboard/index.html');
  chrome.tabs.create({ url });
});

chrome.storage.local.get(['darkMode', 'uiLanguage'], (data) => {
  _uiLanguage = data.uiLanguage || 'zh-TW';
  applyTheme(!!data.darkMode);
  applyUILanguage();
  loadData();
});

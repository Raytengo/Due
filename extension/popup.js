const ATTENDANCE_KEYWORDS = ['attendance', '簽到', 'check-in', 'checkin', 'sign in', 'sign-in'];
let _uiLanguage = 'zh-TW';
let _schoolName = 'Canvas';

const I18N = {
  'zh-TW': {
    subtitle: (school) => `${school} · 七天待辦`,
    loading: '載入中...',
    emptyLabel: '七天內無待辦',
    emptyState: '七天內沒有待繳作業',
    dueCount: (n) => `七天內 · ${n} 件待辦`,
    dashboard: '開啟 Dashboard',
    unsynced: '未同步',
    justNow: '剛才',
  },
  'zh-CN': {
    subtitle: (school) => `${school} · 七天待办`,
    loading: '加载中...',
    emptyLabel: '七天内无待办',
    emptyState: '七天内没有待缴作业',
    dueCount: (n) => `七天内 · ${n} 件待办`,
    dashboard: '打开 Dashboard',
    unsynced: '未同步',
    justNow: '刚才',
  },
  en: {
    subtitle: (school) => `${school} · 7-Day Tasks`,
    loading: 'Loading...',
    emptyLabel: 'No tasks in 7 days',
    emptyState: 'No pending tasks in the next 7 days',
    dueCount: (n) => `Next 7 days · ${n} tasks`,
    dashboard: 'Open Dashboard',
    unsynced: 'Not synced',
    justNow: 'Just now',
  },
};

function tr(key) {
  return (I18N[_uiLanguage] && I18N[_uiLanguage][key]) || I18N['zh-TW'][key];
}

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function applyUILanguage() {
  const subtitle = document.getElementById('popup-subtitle');
  if (subtitle) subtitle.textContent = tr('subtitle')(_schoolName);
  const taskLabel = document.getElementById('task-label');
  if (taskLabel && taskLabel.textContent === '載入中...') {
    taskLabel.textContent = tr('loading');
  }
  const btn = document.getElementById('dashboard-btn');
  if (btn) btn.textContent = tr('dashboard');
}

function isAttendance(name) {
  const lower = (name || '').toLowerCase();
  return ATTENDANCE_KEYWORDS.some(k => lower.includes(k));
}

function isExam(name) {
  const lower = (name || '').toLowerCase();
  return /\b(exam|quiz|midterm|final|test)\b/.test(lower) || lower.includes('考試') || lower.includes('測驗');
}

function formatRelativeSync(isoString) {
  if (!isoString) return tr('unsynced');
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return tr('justNow');
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDueShort(isoString) {
  const due = new Date(isoString);
  const now = new Date();
  const diffMs = due - now;
  const diffHours = Math.ceil(diffMs / 3600000);
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffHours <= 0) return '今天';
  if (diffHours <= 24) return `${diffHours}h`;
  if (diffDays <= 1) return '明天';
  return `${diffDays}天後`;
}

function urgencyClass(isoString) {
  const diff = new Date(isoString) - new Date();
  const days = diff / 86400000;
  if (days <= 2) return 'urgent';
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
      if (a.submission && a.submission.workflow_state === 'submitted') continue;

      const due = new Date(a.due_at);
      if (due <= now || due > sevenDays) continue;

      tasks.push({
        name: a.name,
        due_at: a.due_at,
        course: courseMap[courseId],
        exam: isExam(a.name),
      });
    }
  }

  tasks.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
  return tasks;
}

function renderTasks(tasks, courseNames) {
  const list = document.getElementById('task-list');
  const label = document.getElementById('task-label');
  list.innerHTML = '';

  if (tasks.length === 0) {
    label.textContent = tr('emptyLabel');
    list.innerHTML = `<li class="empty-state">${tr('emptyState')}</li>`;
    return;
  }

  label.textContent = tr('dueCount')(tasks.length);

  for (const task of tasks) {
    const cls = task.exam ? 'exam' : urgencyClass(task.due_at);
    const displayName = getDisplayName(task.course, courseNames);
    const dueStr = formatDueShort(task.due_at);

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <span class="task-dot ${cls}"></span>
      <div class="task-body">
        <div class="task-name">${task.name}</div>
        <div class="task-meta">${displayName}</div>
      </div>
      <span class="task-due ${cls}">${dueStr}</span>
    `;
    list.appendChild(li);
  }
}

function loadData() {
  chrome.storage.local.get(['lastSync', 'courses', 'assignments', 'courseNames'], (data) => {
    document.getElementById('sync-time').textContent = formatRelativeSync(data.lastSync);

    const courseMap = buildCourseMap(data.courses);
    const tasks = getUpcomingTasks(data.assignments || {}, courseMap);
    renderTasks(tasks, data.courseNames || {});
  });
}

document.getElementById('dashboard-btn').addEventListener('click', () => {
  const url = chrome.runtime.getURL('dashboard/index.html');
  chrome.tabs.create({ url });
});

chrome.storage.local.get(['darkMode', 'uiLanguage', 'schoolName'], (data) => {
  _uiLanguage = data.uiLanguage || 'zh-TW';
  _schoolName = data.schoolName || 'Canvas';
  applyTheme(!!data.darkMode);
  applyUILanguage();
  loadData();
});

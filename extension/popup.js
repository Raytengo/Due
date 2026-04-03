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
    taskHeading: 'NEXT 7-D TASKS',
    emptyState: '\u4E03\u5929\u5167\u6C92\u6709\u5F85\u7E73\u4F5C\u696D',
    dashboard: '\u958B\u555F Dashboard',
    claudeUnknown: 'CLAUDE --',
    claudeNeverSynced: 'Claude usage \u5C1A\u672A\u540C\u6B65',
    claudeLastSync: '\u4E0A\u6B21\u540C\u6B65',
    claudeResetAt: '\u91CD\u7F6E\u6642\u9593',
    claudeRefresh: '\u91CD\u65B0\u6293\u53D6 Claude usage',
    claudeRefreshMissing: '\u8ACB\u5148\u6253\u958B\u4E00\u500B Claude \u5206\u9801\u518D\u91CD\u65B0\u6293\u53D6',
    claudeRefreshing: '\u6293\u53D6\u4E2D...',
    today: '\u4ECA\u5929',
    tomorrow: '\u660E\u5929',
    daysLater: (n) => `${n}\u5929\u5F8C`,
  },
  'zh-CN': {
    taskHeading: 'NEXT 7-D TASKS',
    emptyState: '\u4E03\u5929\u5185\u6CA1\u6709\u5F85\u7F34\u4F5C\u4E1A',
    dashboard: '\u6253\u5F00 Dashboard',
    claudeUnknown: 'CLAUDE --',
    claudeNeverSynced: 'Claude usage \u5C1A\u672A\u540C\u6B65',
    claudeLastSync: '\u4E0A\u6B21\u540C\u6B65',
    claudeResetAt: '\u91CD\u7F6E\u65F6\u95F4',
    claudeRefresh: '\u91CD\u65B0\u6293\u53D6 Claude usage',
    claudeRefreshMissing: '\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Claude \u5206\u9875\u518D\u91CD\u65B0\u6293\u53D6',
    claudeRefreshing: '\u6293\u53D6\u4E2D...',
    today: '\u4ECA\u5929',
    tomorrow: '\u660E\u5929',
    daysLater: (n) => `${n}\u5929\u540E`,
  },
  en: {
    taskHeading: 'NEXT 7-D TASKS',
    emptyState: 'No pending tasks in the next 7 days',
    dashboard: 'Open Dashboard',
    claudeUnknown: 'CLAUDE --',
    claudeNeverSynced: 'Claude usage has not been synced yet',
    claudeLastSync: 'Last sync',
    claudeResetAt: 'Reset',
    claudeRefresh: 'Refresh Claude usage',
    claudeRefreshMissing: 'Open a Claude tab first, then refresh usage',
    claudeRefreshing: 'Refreshing...',
    today: 'Today',
    tomorrow: 'Tomorrow',
    daysLater: (n) => `${n}d`,
  },
};

let _claudeRefreshBusy = false;
let _currentClaudeUsage = null;

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

function formatAbsoluteDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(_uiLanguage === 'en' ? 'en-US' : _uiLanguage, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatCountdown(isoString) {
  if (!isoString) return '';
  const target = new Date(isoString);
  if (Number.isNaN(target.getTime())) return '';

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return '0m';

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function buildClaudeSummary(usage) {
  if (!usage) return '--';
  const parts = [];
  if (Number.isFinite(usage.usedPercent)) parts.push(`${usage.usedPercent}%`);
  const countdown = formatCountdown(usage.resetAt);
  if (countdown) parts.push(countdown);
  return parts.join(' / ') || '--';
}

function setClaudeRefreshBusy(busy) {
  _claudeRefreshBusy = busy;
  const btn = document.getElementById('claude-usage-refresh');
  if (!btn) return;
  btn.disabled = busy;
  btn.textContent = busy ? '...' : '\u21bb';
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

function renderClaudeUsage(usage) {
  _currentClaudeUsage = usage;
  const chip = document.getElementById('claude-usage-chip');
  if (!chip) return;

  if (!usage) {
    chip.textContent = tr('claudeUnknown');
    chip.title = tr('claudeNeverSynced');
    chip.classList.add('is-empty');
    chip.className = 'chip is-empty'; // Reset classes
    return;
  }

  // Handle expired/reset state logic
  const target = new Date(usage.resetAt);
  const isExpired = !Number.isNaN(target.getTime()) && (target.getTime() <= Date.now());

  let summary = '';
  let percent = usage.usedPercent;

  if (isExpired) {
    summary = '0% / --';
    percent = 0;
  } else {
    summary = buildClaudeSummary(usage);
  }

  chip.textContent = `CLAUDE ${summary}`;

  // Apply colors based on usage percent
  chip.className = 'usage-chip'; // Reset
  if (percent === 100) {
    chip.classList.add('usage-full');
  } else if (percent > 75) {
    chip.classList.add('usage-high');
  } else if (isExpired || percent === 0 || !usage) {
    chip.classList.add('is-empty');
  }

  const titleLines = [];
  if (usage.lastSync) {
    titleLines.push(`${tr('claudeLastSync')}: ${formatAbsoluteDate(usage.lastSync)}`);
  }
  if (usage.resetAt) {
    titleLines.push(`${tr('claudeResetAt')}: ${formatAbsoluteDate(usage.resetAt)}`);
  }
  chip.title = titleLines.join('\n') || tr('claudeNeverSynced');
}

// Keep countdown ticking while popup is open
setInterval(() => {
  if (_currentClaudeUsage) {
    renderClaudeUsage(_currentClaudeUsage);
  }
}, 30000); // refresh every 30s

function applyClaudeRefreshCopy() {
  const btn = document.getElementById('claude-usage-refresh');
  if (!btn) return;
  btn.title = _claudeRefreshBusy ? tr('claudeRefreshing') : tr('claudeRefresh');
}

function loadData() {
  chrome.storage.local.get(['courses', 'assignments', 'courseNames', 'claudeUsage'], (data) => {
    const courseMap = buildCourseMap(data.courses);
    const tasks = getUpcomingTasks(data.assignments || {}, courseMap);
    renderTasks(tasks, data.courseNames || {});
    renderClaudeUsage(data.claudeUsage || null);
  });
}

document.getElementById('dashboard-btn').addEventListener('click', () => {
  const url = chrome.runtime.getURL('dashboard/index.html');
  chrome.tabs.create({ url });
});

document.getElementById('claude-usage-chip').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://claude.ai/settings/usage' });
});

async function triggerClaudeRefreshSilently() {
  if (_claudeRefreshBusy) return;
  setClaudeRefreshBusy(true);
  applyClaudeRefreshCopy();
  try {
    const response = await chrome.runtime.sendMessage({ type: 'SYNC_CLAUDE_USAGE', force: true });
    // If it fails (no tab), we just keep the old data silently
  } catch (err) {
    console.warn('[Due] Auto-refresh failed:', err.message);
  } finally {
    setClaudeRefreshBusy(false);
    applyClaudeRefreshCopy();
    loadData();
  }
}

document.getElementById('claude-usage-refresh').addEventListener('click', triggerClaudeRefreshSilently);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes.claudeUsage) renderClaudeUsage(changes.claudeUsage.newValue || null);
});

chrome.storage.local.get(['darkMode', 'uiLanguage'], (data) => {
  _uiLanguage = data.uiLanguage || 'zh-TW';
  applyTheme(!!data.darkMode);
  applyUILanguage();
  applyClaudeRefreshCopy();
  loadData();
});

const ATTENDANCE_KEYWORDS = ['attendance', '簽到', 'check-in', 'checkin', 'sign in', 'sign-in'];

function isAttendance(name) {
  const lower = (name || '').toLowerCase();
  return ATTENDANCE_KEYWORDS.some(k => lower.includes(k));
}

function isExam(name) {
  const lower = (name || '').toLowerCase();
  return /\b(exam|quiz|midterm|final|test)\b/.test(lower) || lower.includes('考試') || lower.includes('測驗');
}

function formatRelativeSync(isoString) {
  if (!isoString) return '未同步';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '剛才';
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

function getCourseCode(course) {
  if (!course) return '';
  // Try to extract a short code from course name
  const match = course.name && course.name.match(/^([A-Z]{2,6}\d{4}[A-Z]?)/);
  return match ? match[1] : (course.course_code || '').split('-')[0].trim();
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

function renderTasks(tasks) {
  const list = document.getElementById('task-list');
  const label = document.getElementById('task-label');
  list.innerHTML = '';

  if (tasks.length === 0) {
    label.textContent = '七天內無待辦';
    list.innerHTML = '<li class="empty-state">輕鬆！七天內沒有未繳作業</li>';
    return;
  }

  label.textContent = `七天內 · ${tasks.length} 件待辦`;

  for (const task of tasks) {
    const cls = task.exam ? 'exam' : urgencyClass(task.due_at);
    const code = getCourseCode(task.course);
    const dueStr = formatDueShort(task.due_at);

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <span class="task-dot ${cls}"></span>
      <div class="task-body">
        <div class="task-name">${task.name}</div>
        <div class="task-meta">${code}</div>
      </div>
      <span class="task-due ${cls}">${dueStr}</span>
    `;
    list.appendChild(li);
  }
}

function loadData() {
  chrome.storage.local.get(['lastSync', 'courses', 'assignments'], (data) => {
    document.getElementById('sync-time').textContent = formatRelativeSync(data.lastSync);

    const courseMap = buildCourseMap(data.courses);
    const tasks = getUpcomingTasks(data.assignments || {}, courseMap);
    renderTasks(tasks);
  });
}

document.getElementById('dashboard-btn').addEventListener('click', () => {
  const url = chrome.runtime.getURL('dashboard/index.html');
  chrome.tabs.create({ url });
});

loadData();

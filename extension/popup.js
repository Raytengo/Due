function formatRelativeTime(isoString) {
  if (!isoString) return '尚未同步';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '剛才';
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function countDueToday(assignments) {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  let count = 0;
  for (const courseId in assignments) {
    for (const a of assignments[courseId]) {
      if (!a.due_at) continue;
      const due = new Date(a.due_at);
      if (due <= todayEnd && due > now) count++;
    }
  }
  return count;
}

function loadStatus() {
  chrome.storage.local.get(
    ['lastSync', 'courses', 'assignments'],
    (data) => {
      document.getElementById('last-sync').textContent = formatRelativeTime(
        data.lastSync
      );
      document.getElementById('course-count').textContent = data.courses
        ? data.courses.length
        : 0;
      const dueCount = data.assignments
        ? countDueToday(data.assignments)
        : 0;
      document.getElementById('due-today').textContent = dueCount;
    }
  );
}

document.getElementById('sync-btn').addEventListener('click', () => {
  const btn = document.getElementById('sync-btn');
  const status = document.getElementById('sync-status');
  btn.disabled = true;
  status.textContent = '同步中...';
  status.className = 'sync-status syncing';

  chrome.runtime.sendMessage({ type: 'SYNC' }, (response) => {
    btn.disabled = false;
    if (response && response.success) {
      status.textContent = '同步完成';
      status.className = 'sync-status done';
      loadStatus();
    } else {
      status.textContent = '同步失敗，請確認已登入 Canvas';
      status.className = 'sync-status';
    }
    setTimeout(() => {
      status.textContent = '';
      status.className = 'sync-status';
    }, 3000);
  });
});

document.getElementById('dashboard-btn').addEventListener('click', () => {
  const url = chrome.runtime.getURL('dashboard/index.html');
  chrome.tabs.create({ url });
});

document.getElementById('settings-btn').addEventListener('click', () => {
  const url = chrome.runtime.getURL('settings.html');
  chrome.tabs.create({ url });
});

loadStatus();

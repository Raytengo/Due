let _uiLanguage = 'zh-TW';

const I18N = {
  'zh-TW': {
    taskHeading: '7 天內待辦',
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
    hoursLater: (n) => `${n}h\u5F8C`,
    daysLater: (n) => `${n}\u5929\u5F8C`,
    overdueHeading: '\u5DF2\u903E\u671F',
    upcomingHeading: '7 \u5929\u5167',
    overdueDaysLabel: (n) => (n === 0 ? '\u4ECA\u5929\u5230\u671F' : `\u903E${n}\u5929`),
    markDone: '\u6A19\u8A18\u5B8C\u6210',
    undoComplete: '\u64A4\u92B7',
  },
  'zh-CN': {
    taskHeading: '7 天内待办',
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
    hoursLater: (n) => `${n}h\u540E`,
    daysLater: (n) => `${n}\u5929\u540E`,
    overdueHeading: '\u5DF2\u903E\u671F',
    upcomingHeading: '7 \u5929\u5185',
    overdueDaysLabel: (n) => (n === 0 ? '\u4ECA\u5929\u5230\u671F' : `\u903E${n}\u5929`),
    markDone: '\u6807\u8BB0\u5B8C\u6210',
    undoComplete: '\u64A4\u9500',
  },
  en: {
    taskHeading: 'NEXT 7-DAY TASKS',
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
    hoursLater: (n) => `${n}h`,
    daysLater: (n) => `${n}d`,
    overdueHeading: 'OVERDUE',
    upcomingHeading: 'NEXT 7 DAYS',
    overdueDaysLabel: (n) => (n === 0 ? 'due today' : `${n}d late`),
    markDone: 'Mark done',
    undoComplete: 'Undo',
  },
};

let _claudeRefreshBusy = false;
let _currentClaudeUsage = null;
let _manualDone = {};             // 最新手動完成 map（loadData 更新；勾選/撤銷即時寫回）
const COMPLETE_DELAY_MS = 1500;   // 勾選後撤銷窗口（毫秒，對齊 dashboard）

function tr(key) {
  return (I18N[_uiLanguage] && I18N[_uiLanguage][key]) || I18N['zh-TW'][key];
}

function applyUILanguage() {
  const taskLabel = document.getElementById('task-label');
  if (taskLabel) taskLabel.textContent = tr('taskHeading');

  const btn = document.getElementById('dashboard-btn');
  if (btn) btn.textContent = tr('dashboard');

  // Claude chip 初始提示改用 i18n（實際用量載入後由 renderClaudeUsage 覆蓋為同步/重置時間）
  const claudeChip = document.getElementById('claude-usage-chip');
  if (claudeChip) claudeChip.title = tr('claudeNeverSynced');
}

function formatDueShort(isoString) {
  const due = new Date(isoString);
  const now = new Date();
  const diffMs = due - now;
  if (diffMs <= 0) {
    const hoursLater = tr('hoursLater');
    return typeof hoursLater === 'function' ? hoursLater(0) : '0h';
  }

  const isSameDay =
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate();

  if (isSameDay) {
    const roundedHours = Math.floor((diffMs + 1800000) / 3600000);
    const hoursLater = tr('hoursLater');
    return typeof hoursLater === 'function' ? hoursLater(roundedHours) : `${roundedHours}h`;
  }

  const dueDayUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const nowDayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDayUtc - nowDayUtc) / 86400000);

  const daysLater = tr('daysLater');
  return typeof daysLater === 'function' ? daysLater(diffDays) : `${diffDays}d`;
}

// 逾期天數 → 顯示文案（委派 DueTaskRules.overdueDays 算天數，i18n 決定字串）
function overdueDaysLabel(isoString) {
  const n = DueTaskRules.overdueDays(isoString);
  const fn = tr('overdueDaysLabel');
  return typeof fn === 'function' ? fn(n) : `${n}d`;
}

// popup 只看 7 天內，故在視窗內再細分三層緊急度（今天 / ≤3 天 / 4–7 天）。
// 用本地日曆天差計算（與 formatDueShort 的「N 天後」一致），色階由右側 badge 承載。
function upcomingClass(isoString) {
  const due = new Date(isoString);
  const now = new Date();
  const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay - nowDay) / 86400000);
  if (diffDays <= 0) return 'today';   // 今天到期（最燙）
  if (diffDays <= 3) return 'soon3';   // 3 天內
  return 'week7';                       // 4–7 天
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

// 回傳兩組：overdue（30 天內逾期未完成，最近錯過在最上）＋ upcoming（7 天內，最快到期在最上）
function getTasks(assignments, courseMap, manualDone, manualUndone, manualShown, manualHidden) {
  const now = new Date();
  const nowMs = now.getTime();
  const sevenDays = new Date(nowMs + 7 * 86400000);
  const shown = manualShown || {};
  const hidden = manualHidden || {};
  const overdue = [];
  const upcoming = [];

  for (const courseId in assignments) {
    for (const a of assignments[courseId]) {
      if (!a.due_at) continue;
      // 被收進稽核區者排除：考試/簽到看 manualShown（未升級即隱藏）、一般作業看 manualHidden
      const hideable = DueTaskRules.isAttendance(a) || DueTaskRules.isExam(a);
      if (hideable ? !shown[String(a.id)] : !!hidden[String(a.id)]) continue;
      // 完成判斷共用 completion.js（Canvas 已繳或手動完成排除；已繳但標回未完成則顯示）
      if (DueCompletion.isDone(a, manualDone, manualUndone)) continue;

      const task = {
        id: a.id,
        name: a.name,
        due_at: a.due_at,
        course: courseMap[courseId],
        html_url: a.html_url || null,
      };

      if (DueTaskRules.urgency(a.due_at, nowMs) === 'overdue') {
        // 逾期：只收 30 天內（避免學期中途安裝被整學期舊帳洗版，同 dashboard）
        if (DueTaskRules.isWithinOverdueWindow(a.due_at, nowMs)) overdue.push(task);
        continue;
      }

      const due = new Date(a.due_at);
      if (due > now && due <= sevenDays) upcoming.push(task);
    }
  }

  overdue.sort((a, b) => new Date(b.due_at) - new Date(a.due_at));  // 最近錯過在最上（降冪）
  upcoming.sort((a, b) => new Date(a.due_at) - new Date(b.due_at)); // 最快到期在最上（升冪）
  return { overdue, upcoming };
}

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTasks(groups, courseNames) {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  const overdue = (groups && groups.overdue) || [];
  const upcoming = (groups && groups.upcoming) || [];

  if (overdue.length === 0 && upcoming.length === 0) {
    list.innerHTML = `<li class="empty-state">${tr('emptyState')}</li>`;
    return;
  }

  // 有逾期才分組並加子標題；無逾期則維持單一平列表（不加標題）
  if (overdue.length > 0) {
    list.appendChild(makeGroupHeading(tr('overdueHeading'), 'overdue'));
    for (const task of overdue) list.appendChild(makeTaskItem(task, courseNames, 'overdue'));
    // 逾期組存在時，才為 7 天內組加標題（upcoming 為空則不加空標題）
    if (upcoming.length > 0) list.appendChild(makeGroupHeading(tr('upcomingHeading'), 'upcoming'));
  }

  for (const task of upcoming) list.appendChild(makeTaskItem(task, courseNames, 'upcoming'));
}

// 分組小標題（樣式比照 .section-label；overdue 版用 var(--overdue) 色）
function makeGroupHeading(text, group) {
  const li = document.createElement('li');
  li.className = 'task-group-label' + (group === 'overdue' ? ' overdue' : '');
  li.dataset.group = group;
  li.textContent = text;
  return li;
}

function makeTaskItem(task, courseNames, group) {
  const isOverdue = group === 'overdue';
  const cls = isOverdue ? 'overdue' : upcomingClass(task.due_at);
  const displayName = getDisplayName(task.course, courseNames);
  const dueStr = isOverdue ? overdueDaysLabel(task.due_at) : formatDueShort(task.due_at);
  const canOpen = task.html_url
    && /^https?:\/\/.+\/courses\/\d+\/(assignments|quizzes|discussion_topics)\/\d+/.test(task.html_url);

  const li = document.createElement('li');
  li.className = 'task-item' + (canOpen ? ' openable' : '');
  li.dataset.group = group;
  li.innerHTML = `
    <button class="task-check" type="button" aria-label="${esc(tr('markDone'))}"></button>
    <div class="task-body">
      <div class="task-name${canOpen ? ' clickable' : ''}"${canOpen ? ' role="button" tabindex="0"' : ''}>${esc(task.name)}</div>
      <div class="task-meta">${esc(displayName)}</div>
    </div>
    <span class="task-due ${cls}">${esc(dueStr)}</span>
  `;

  const check = li.querySelector('.task-check');
  const nameEl = li.querySelector('.task-name');
  const badge = li.querySelector('.task-due');
  let undoTimer = null;
  let inUndo = false;

  // 作業名稱點擊 → 開 Canvas 分頁；撤銷窗口內則不開，讓事件冒泡到整列 → 取消
  if (canOpen) {
    const openCanvas = (e) => {
      if (inUndo) return;
      e.stopPropagation();
      chrome.tabs.create({ url: task.html_url });
    };
    nameEl.addEventListener('click', openCanvas);
    // 鍵盤可觸發（role=button + tabindex=0）：Enter/Space 等同 click；Space 需 preventDefault 擋捲動
    nameEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();
      if (inUndo) { cancelUndo(); return; }  // 撤銷窗口內：等同滑鼠點列 → 取消
      openCanvas(e);
    });
  }

  function enterUndo() {
    inUndo = true;
    li.classList.add('completing');
    check.classList.add('done');                         // 空心圈 → 綠底白勾
    check.setAttribute('aria-label', tr('undoComplete'));
    badge.className = 'task-due undo';
    badge.textContent = '↩ ' + tr('undoComplete');  // ↩ 撤銷
    // 立即持久化（與 dashboard 即時同步；popup 皆未繳項 → 只走 manualDone）
    _manualDone = DueCompletion.toggleManualDone(_manualDone, task.id, true);
    chrome.storage.local.set({ manualDone: _manualDone });
    undoTimer = setTimeout(finalize, COMPLETE_DELAY_MS);
  }

  function cancelUndo() {
    if (undoTimer) { clearTimeout(undoTimer); undoTimer = null; }
    inUndo = false;
    li.classList.remove('completing');
    check.classList.remove('done');                      // 還原空心圈
    check.setAttribute('aria-label', tr('markDone'));
    badge.className = 'task-due ' + cls;
    badge.textContent = dueStr;
    _manualDone = DueCompletion.toggleManualDone(_manualDone, task.id, false);
    chrome.storage.local.set({ manualDone: _manualDone });
  }

  function finalize() {
    undoTimer = null;
    // 高度收合動畫（~200ms）後從 DOM 移除
    li.style.maxHeight = li.offsetHeight + 'px';
    li.classList.add('collapsing');
    void li.offsetHeight;                                // 強制 reflow 讓起始高度生效
    li.style.maxHeight = '0px';
    li.style.opacity = '0';
    li.style.paddingTop = '0';
    li.style.paddingBottom = '0';
    setTimeout(() => { li.remove(); maybeShowEmpty(); }, 200);
  }

  // 勾選鈕：stopPropagation；未完成→進撤銷窗口，窗口內再點→取消
  check.addEventListener('click', (e) => {
    e.stopPropagation();
    if (inUndo) cancelUndo();
    else enterUndo();
  });

  // 整列點擊（勾選圈已 stopPropagation 排除）：
  //   撤銷窗口內 → 取消；否則若有有效連結 → 開該作業的 Canvas 頁（名稱點擊會先 stopPropagation，不重複開）
  li.addEventListener('click', () => {
    if (inUndo) { cancelUndo(); return; }
    if (canOpen) chrome.tabs.create({ url: task.html_url });
  });

  return li;
}

// 移除某列後：兩組皆空 → 顯示 emptyState；逾期組清空 → 回單一平列表（移除子標題）
function maybeShowEmpty() {
  const list = document.getElementById('task-list');
  const overdueItems = list.querySelectorAll('.task-item[data-group="overdue"]');
  const upcomingItems = list.querySelectorAll('.task-item[data-group="upcoming"]');

  if (overdueItems.length === 0 && upcomingItems.length === 0) {
    list.innerHTML = `<li class="empty-state">${tr('emptyState')}</li>`;
    return;
  }
  if (overdueItems.length === 0) {
    list.querySelectorAll('.task-group-label').forEach((h) => h.remove());
  }
}

function renderClaudeUsage(usage) {
  _currentClaudeUsage = usage;
  const chip = document.getElementById('claude-usage-chip');
  if (!chip) return;

  if (!usage) {
    chip.textContent = tr('claudeUnknown');
    chip.title = tr('claudeNeverSynced');
    chip.className = 'usage-chip is-empty';
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
  chrome.storage.local.get(['courses', 'assignments', 'customAssignments', 'courseNames', 'claudeUsage', 'manualDone', 'manualUndone', 'manualShown', 'manualHidden'], (data) => {
    _manualDone = data.manualDone || {};   // 記住最新值供勾選/撤銷即時寫回
    const courseMap = buildCourseMap(data.courses);
    // 自訂作業跟 dashboard 共用同一份合併邏輯，才不會 dashboard 加的作業 popup 看不到
    const assignments = DueCustomAssignments.mergeAssignmentMaps(data.assignments || {}, data.customAssignments || {});
    const groups = getTasks(assignments, courseMap, _manualDone, data.manualUndone || {}, data.manualShown || {}, data.manualHidden || {});
    renderTasks(groups, data.courseNames || {});
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

chrome.storage.local.get(['uiLanguage', 'showClaudeUsageInPopup'], (data) => {
  _uiLanguage = data.uiLanguage || 'zh-TW';
  applyUILanguage();
  applyClaudeRefreshCopy();

  const showUsage = data.showClaudeUsageInPopup !== false;
  const usageActions = document.querySelector('.usage-actions');
  if (usageActions) usageActions.style.display = showUsage ? '' : 'none';

  loadData();
});

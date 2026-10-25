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
    claudeRefreshFailed: 'Claude usage 抓取失敗',
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
    claudeRefreshMissing: '请先打开一个 Claude 标签页再重新抓取',
    claudeRefreshFailed: 'Claude usage 抓取失败',
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
    claudeRefreshFailed: 'Could not refresh Claude usage',
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
let _claudeSwapPending = false;   // 手動 ↻ 進行中：用量落地時 chip 文字 blur 交換一次，數字沒變也看得出刷新過（#49）
let _currentClaudeUsage = null;
const COMPLETE_DELAY_MS = 1500;   // 勾選後撤銷窗口（毫秒，對齊 dashboard）；倒數條長度同值
const COLLAPSE_FALLBACK_MS = 350; // 列收合移除的保底：--reflow 300ms＋餘裕（transitionend 沒到時才用）
const FADE_FALLBACK_MS = 250;     // 減少動態時只淡出（--t-fade 200ms）的移除保底
const SWAP_FALLBACK_MS = 250;     // 標籤交換（--t-swap 150ms）收尾的保底

// 減少動態：CSS media query 管不到 JS 驅動的收合高度、碎點與 badge 寬度過渡，JS 自己檢查（#0）
const _rmq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const reduceMotion = () => !!(_rmq && _rmq.matches);

// 今天到期 badge 的白色單色火焰（#21 C1）：一筆實心路徑、fill 吃 currentColor，跳動由 CSS flame-hop 負責
const FLAME_SVG = '<svg class="flame" viewBox="0 0 9 11" aria-hidden="true" focusable="false"><path d="M4.6.2c.2 1.6 1.2 2.5 2.1 3.5C7.6 4.7 8.4 5.9 8.4 7.3c0 2-1.7 3.5-3.9 3.5S.6 9.3.6 7.3c0-1.2.5-2.2 1.3-2.9.1.9.6 1.5 1.3 1.7C2.8 4.3 3.4 2 4.6.2z"/></svg>';

// ── 完成標記寫入（read-modify-write，QA P1-2／P1-4）──
// 讀 storage 最新的 manualDone/manualUndone → DueCompletion.setDone 套用目標狀態（依當下外部事實決定寫哪張、
// 順手清掉兩張並存的髒資料，與 dashboard 同一入口）→ 寫回。不拿 popup 開啟當下的快照整包覆寫，
// 否則會吃掉 dashboard／其他視窗在 popup 開著期間的變更。佇列：前一筆寫完才讀下一筆（連點勾/撤銷不互蓋）
let _writeQueue = Promise.resolve();
function writeDone(assignment, done) {
  _writeQueue = _writeQueue.then(() => new Promise((resolve) => {
    chrome.storage.local.get(['manualDone', 'manualUndone'], (cur) => {
      const next = DueCompletion.setDone(cur || {}, assignment, done);
      chrome.storage.local.set(next, () => {
        const err = chrome.runtime && chrome.runtime.lastError;
        if (err) console.error('[Due] 完成標記寫入失敗:', err.message);
        resolve();
      });
    });
  })).catch((err) => console.error('[Due] 完成標記寫入失敗:', err));
}

function tr(key) {
  return (I18N[_uiLanguage] && I18N[_uiLanguage][key]) || I18N['zh-TW'][key];
}

function applyUILanguage() {
  // <html lang> 跟 UI 語言（螢幕閱讀器選語音、CJK 字形 fallback 依此判斷）；未知值退回 zh-TW（同 tr 的 fallback）
  document.documentElement.lang = I18N[_uiLanguage] ? _uiLanguage : 'zh-TW';

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

// 忙碌狀態（#49）：同一顆 ↻ 原地轉圈（減少動態改明暗呼吸），不再一幀換成「...」。
// 不用 disabled：鍵盤按下時 disabled 會把焦點丟到 body；改 aria-disabled＋trigger 開頭 early return
function setClaudeRefreshBusy(busy) {
  _claudeRefreshBusy = busy;
  const btn = document.getElementById('claude-usage-refresh');
  if (!btn) return;
  btn.setAttribute('aria-disabled', busy ? 'true' : 'false');
  btn.setAttribute('aria-busy', busy ? 'true' : 'false');
  btn.classList.toggle('is-busy', busy);
}

// 回傳兩組：overdue（30 天內逾期未完成，最近錯過在最上）＋ upcoming（7 天內，最快到期在最上）
// assignments 為 Canvas ∪ 自訂作業（renderPopup 以 DueCustomAssignments.mergeAssignmentMaps 合併，同 dashboard render）
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
      // 自訂作業掛在已不在課程清單的課（退選/換學期）→ 不列（dashboard 只走 courses，同樣看不到）
      if (a._isCustom && !courseMap[courseId]) continue;
      // 被收進稽核區者排除：考試/簽到看 manualShown（未升級即隱藏）、一般作業看 manualHidden
      // 自訂作業一律不自動隱藏（名稱含 Quiz/Midterm/簽到也照樣列；taskRules.isHideable 與 dashboard 共用，QA P1-6）
      const hideable = DueTaskRules.isHideable(a);
      if (hideable ? !shown[String(a.id)] : !!hidden[String(a.id)]) continue;
      // 完成判斷共用 completion.js（Canvas 已繳或手動完成排除；已繳但標回未完成則顯示）
      if (DueCompletion.isDone(a, manualDone, manualUndone)) continue;

      const task = {
        id: a.id,
        assignment: a,                // 完成寫入用（setDone 需看外部事實：已繳／考試已結束）
        name: a.name,
        due_at: a.due_at,
        course: courseMap[courseId],
        html_url: a.html_url || null,
        isCustom: !!a._isCustom,      // 自訂作業沒有 Canvas 頁 → 點擊改開 dashboard
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
    fitTaskListHeight();
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
  fitTaskListHeight();
}

// 清單捲動區停在整列：露出前 POPUP_VISIBLE_TASKS 筆作業（連同其上的分組小標題），高度＝第 N 筆的下緣，
// 不會切出半列；更多的項目靠常駐的 3px 捲軸提示可捲。列高不固定（課名折行、分組小標題），所以用量的。
// 裁切點扣掉第 N 筆的下框線：底下已有 .divider，和 ≤N 筆時（:last-child 無框線）一樣只留一條線。
// ≤N 筆時不設上限（自然高度、無捲軸）
const POPUP_VISIBLE_TASKS = 3;

// 量「收合完成後」的版面：正在收合的列／組標題（.collapsing）視為已移除。
// 用離屏複本量，不碰真實清單——對收合中的元素 display:none 或改清單的 max-height 都會中斷它們進行中的過渡。
// 回傳 { capped, px }：capped＝超過 N 筆、px 是停在第 N 筆下緣的高度；否則 px 是自然高度
function measureTaskListFit(list) {
  const clone = list.cloneNode(true);
  clone.removeAttribute('id');
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('.collapsing').forEach((el) => el.remove());
  Object.assign(clone.style, {
    position: 'absolute', visibility: 'hidden', pointerEvents: 'none',
    left: '0', top: '0', width: `${list.getBoundingClientRect().width}px`,
    maxHeight: 'none', transition: 'none',
  });
  list.parentElement.appendChild(clone);
  const items = clone.querySelectorAll('.task-item');
  let res;
  if (items.length > POPUP_VISIBLE_TASKS) {
    const last = items[POPUP_VISIBLE_TASKS - 1];
    const cut = last.getBoundingClientRect().bottom - parseFloat(getComputedStyle(last).borderBottomWidth || 0);
    res = { capped: true, px: Math.floor(cut - clone.getBoundingClientRect().top) };
  } else {
    res = { capped: false, px: clone.scrollHeight };
  }
  clone.remove();
  return res;
}

// animate：收合開始時呼叫，清單高度沿 --reflow 與列的收合同步變到終點（不在收完那一幀才跳）。
// 終點不設上限時先動到自然高度，收完（不帶 animate 的那次）才換回 none；原本就沒設上限就跟著內容走、不動它
function fitTaskListHeight(animate = false) {
  const list = document.getElementById('task-list');
  if (!list) return;
  const fit = measureTaskListFit(list);
  let target;
  if (fit.capped) target = `${fit.px}px`;
  else if (animate) {
    if (!list.style.maxHeight || list.style.maxHeight === 'none') return;
    target = `${fit.px}px`;
  } else target = 'none';
  if (list.style.maxHeight === target) return;   // 同值不重設：別打斷進行中的高度過渡
  list.style.transition = animate && !reduceMotion() ? 'max-height var(--reflow)' : 'none';
  list.style.maxHeight = target;
}

// 字型晚於首次渲染載入時列高會變 → 重量一次
if (document.fonts) document.fonts.ready.then(fitTaskListHeight);

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
  const hasCanvasUrl = !!task.html_url
    && /^https?:\/\/.+\/courses\/\d+\/(assignments|quizzes|discussion_topics)\/\d+/.test(task.html_url);
  // 可點開：有效的 Canvas 作業頁；自訂作業沒有 Canvas 頁 → 改開 dashboard
  const canOpen = hasCanvasUrl || task.isCustom;
  const openItem = () => (hasCanvasUrl ? chrome.tabs.create({ url: task.html_url }) : openDashboard());

  const li = document.createElement('li');
  li.className = 'task-item' + (canOpen ? ' openable' : '');
  li.dataset.group = group;
  // badge 內放兩個標籤供交叉淡換（#36）：到期文字（今天到期帶白色火焰）與疊在上面的「↩ 撤銷」
  li.innerHTML = `
    <button class="task-check" type="button" aria-label="${esc(tr('markDone'))}"></button>
    <div class="task-body">
      <div class="task-name${canOpen ? ' clickable' : ''}"${canOpen ? ' role="button" tabindex="0"' : ''}>${esc(task.name)}</div>
      <div class="task-meta">${esc(displayName)}</div>
    </div>
    <span class="task-due ${cls}"><span class="lbl lbl-due">${cls === 'today' ? FLAME_SVG : ''}${esc(dueStr)}</span><span class="lbl lbl-undo" aria-hidden="true">↩ ${esc(tr('undoComplete'))}</span></span>
  `;

  const check = li.querySelector('.task-check');
  const nameEl = li.querySelector('.task-name');
  const badge = li.querySelector('.task-due');
  const lblDue = badge.querySelector('.lbl-due');
  const lblUndo = badge.querySelector('.lbl-undo');
  let undoTimer = null;
  let inUndo = false;
  let leaving = false;      // 撤銷窗已結束、列正在離場：點擊與按鍵一律不再改狀態（#14）
  let countdown = null;     // 撤銷倒數條（#23）
  let settleTimer = null;   // badge 換回後清掉 inline width 的保底計時器

  // 作業名稱點擊 → 開 Canvas 分頁（自訂作業開 dashboard）；撤銷窗口內則不開，讓事件冒泡到整列 → 取消
  if (canOpen) {
    const openCanvas = (e) => {
      if (inUndo || leaving) return;
      e.stopPropagation();
      openItem();
    };
    nameEl.addEventListener('click', openCanvas);
    // 鍵盤可觸發（role=button + tabindex=0）：Enter/Space 等同 click；Space 需 preventDefault 擋捲動
    nameEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();
      if (leaving) return;
      if (inUndo) { cancelUndo(); return; }  // 撤銷窗口內：等同滑鼠點列 → 取消
      openCanvas(e);
    });
  }

  // badge 換回自然寬度：寬度過渡結束（或保底到期）才清掉 inline width；撤銷窗內維持釘住
  function releaseBadgeWidth() {
    clearTimeout(settleTimer);
    settleTimer = null;
    if (badge.classList.contains('undo')) return;
    badge.style.width = '';
    badge.classList.remove('pinned');
  }
  badge.addEventListener('transitionend', (e) => {
    if (e.target === badge && e.propertyName === 'width') releaseBadgeWidth();
  });

  // 到期文字 ⇄「↩ 撤銷」（#36）：標籤由 CSS 交叉淡換（opacity＋blur 2px）；
  // 寬度先釘住目前 px → forced reflow → 設成目標標籤量到的寬度，150ms 滑過去，名稱截斷點不再一幀跳動。
  // 減少動態時 CSS 不過渡 width：寬度直接到位（仍要釘，撤銷標籤才不會疊到名稱上），換回時立刻放開。
  function swapBadge(toUndo) {
    clearTimeout(settleTimer);
    settleTimer = null;
    const animate = !reduceMotion();
    badge.style.width = badge.getBoundingClientRect().width + 'px';   // 釘住目前寬度（含換到一半的過渡值）
    badge.getBoundingClientRect();                                     // forced reflow：起點生效
    badge.className = 'task-due ' + (toUndo ? 'undo' : cls) + ' pinned';
    (toUndo ? lblDue : lblUndo).setAttribute('aria-hidden', 'true');
    (toUndo ? lblUndo : lblDue).removeAttribute('aria-hidden');
    const cs = getComputedStyle(badge);
    const chromeW = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    badge.style.width = ((toUndo ? lblUndo : lblDue).getBoundingClientRect().width + chromeW) + 'px';
    if (toUndo) return;
    if (animate) settleTimer = setTimeout(releaseBadgeWidth, SWAP_FALLBACK_MS);
    else releaseBadgeWidth();
  }

  function enterUndo() {
    inUndo = true;
    li.classList.add('completing');
    check.classList.add('done');                         // 空心圈 → 綠底，勾號隨後畫出
    check.setAttribute('aria-label', tr('undoComplete'));
    swapBadge(true);                                     // → ↩ 撤銷
    // 撤銷倒數條：列底部 3px 橘條線性縮到 0，看得出撤銷窗還剩多久；absolute 疊在列內，不改列尺寸（#23）
    countdown = document.createElement('div');
    countdown.className = 'complete-countdown';
    countdown.style.animationDuration = COMPLETE_DELAY_MS + 'ms';
    li.appendChild(countdown);
    // 立即持久化（與 dashboard 同一入口；已繳但被標回未完成者會清 manualUndone 而非寫 manualDone）
    writeDone(task.assignment, true);
    undoTimer = setTimeout(finalize, COMPLETE_DELAY_MS);
  }

  function cancelUndo() {
    if (undoTimer) { clearTimeout(undoTimer); undoTimer = null; }
    inUndo = false;
    li.classList.remove('completing');
    check.classList.remove('done');                      // 還原空心圈
    check.setAttribute('aria-label', tr('markDone'));
    swapBadge(false);                                    // → 到期文字
    if (countdown) { countdown.remove(); countdown = null; }
    writeDone(task.assignment, false);
  }

  // 撤銷窗結束：收合一開始就關閉撤銷窗（#14）。先把焦點交給鄰居（#1），再設 inert
  // （擋掉點擊與 Tab/Space；離場中的列不可再被操作），接著碎點＋收合（#23、#35）
  function finalize() {
    undoTimer = null;
    inUndo = false;
    leaving = true;
    handOffFocus(li);
    li.inert = true;
    collapseRow(li, check);
  }

  // 勾選鈕：stopPropagation；未完成→進撤銷窗口，窗口內再點→取消
  check.addEventListener('click', (e) => {
    e.stopPropagation();
    if (leaving) return;
    if (inUndo) cancelUndo();
    else enterUndo();
  });

  // 整列點擊（勾選圈已 stopPropagation 排除）：
  //   撤銷窗口內 → 取消；否則若有有效連結 → 開該作業的 Canvas 頁、自訂作業開 dashboard（名稱點擊會先 stopPropagation，不重複開）
  li.addEventListener('click', () => {
    if (leaving) return;
    if (inUndo) { cancelUndo(); return; }
    if (canOpen) openItem();
  });

  return li;
}

// 離場列持有焦點時（鍵盤勾完一項），交給下一列（沒有就上一列）的勾選圈，整份清單都沒了就交給「開啟 Dashboard」，
// 不讓焦點跟著被移除的列掉到 <body>（#1）。在撤銷窗結束時才移：窗內在同一顆勾選圈按 Enter/Space 是鍵盤的撤銷路徑
function handOffFocus(li) {
  if (!li.contains(document.activeElement)) return;
  const sib = (dir) => {
    let n = li[dir];
    while (n && !n.matches('.task-item:not(.collapsing)')) n = n[dir];
    return n;
  };
  const next = sib('nextElementSibling') || sib('previousElementSibling');
  const target = next ? next.querySelector('.task-check') : document.getElementById('dashboard-btn');
  if (target) target.focus({ preventScroll: true });
}

// 列離場（#35）：淡出走 --t-fade、高度與 padding 走 --reflow，兩條曲線分開。
// 這列帶走某一組的最後一筆時，該組標題在同一幀一起收合（不再等列收完才一幀消失、讓下面的列再跳約 50px）。
// 移除跟著 transitionend(max-height)，另有保底計時器。減少動態：只淡出、不壓高度，淡完移除；碎點略過（#0）。
function collapseRow(li, check) {
  const list = li.parentElement;
  const rm = reduceMotion();
  if (!rm) spawnBurstDots(check);
  li.classList.add('collapsing');

  const left = (g) => list.querySelectorAll(`.task-item[data-group="${g}"]:not(.collapsing)`).length;
  let heads = [];
  if (li.dataset.group === 'overdue' && left('overdue') === 0) {
    // 逾期組清空 → 回單一平列表：兩個組標題一起收
    heads = [...list.querySelectorAll('.task-group-label')];
  } else if (li.dataset.group === 'upcoming' && left('upcoming') === 0 && left('overdue') > 0) {
    // 7 天內清空但逾期還在 → 收掉沒有內容的「7 天內」標題（同 renderTasks：空組不加標題）
    heads = [...list.querySelectorAll('.task-group-label[data-group="upcoming"]')];
  }
  heads = heads.filter((h) => !h.classList.contains('collapsing'));

  const els = [li, ...heads];
  els.forEach((el) => {
    el.style.maxHeight = el.offsetHeight + 'px';
    el.classList.add('collapsing');
  });
  li.getBoundingClientRect();                            // forced reflow 讓起始高度生效（不用 rAF：隱藏時 rAF 會暫停）
  els.forEach((el) => {
    el.style.opacity = '0';
    if (rm) return;
    el.style.maxHeight = '0px';
    el.style.paddingTop = '0';
    el.style.paddingBottom = '0';
  });
  if (!rm) fitTaskListHeight(true);                      // 捲動區高度與列同一條曲線收到終點

  const prop = rm ? 'opacity' : 'max-height';
  let fallback = null;
  let finished = false;
  const onEnd = (e) => { if (e.target === li && e.propertyName === prop) done(); };
  function done() {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    li.removeEventListener('transitionend', onEnd);
    els.forEach((el) => el.remove());
    maybeShowEmpty();
    // 少了一列：捲動區重量到新的第 3 筆下緣。還有別列在收合就交給最後收完的那一列量
    if (!list.querySelector('.task-item.collapsing')) fitTaskListHeight();
  }
  li.addEventListener('transitionend', onEnd);
  fallback = setTimeout(done, rm ? FADE_FALLBACK_MS : COLLAPSE_FALLBACK_MS);
}

// 撤銷倒數歸零時從勾選圈中心迸出 10 顆碎點（與 dashboard 同一個完成概念；popup 列較矮，距離 16–24px）。
// 掛在 body 下的 fixed 圖層，不放進列：列的 overflow:hidden 與淡出會把碎點裁掉/一起淡掉
function spawnBurstDots(check) {
  const r = check.getBoundingClientRect();
  if (!r.width) return;
  let layer = document.getElementById('burst-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'burst-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const n = 10;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const dot = document.createElement('span');
    const ang = (Math.PI * 2 * i) / n;
    const dist = 16 + ((i * 13) % 9);
    dot.className = 'complete-burst-dot';
    dot.style.left = cx + 'px';
    dot.style.top = cy + 'px';
    dot.style.setProperty('--dx', `${Math.round(Math.cos(ang) * dist)}px`);
    dot.style.setProperty('--dy', `${Math.round(Math.sin(ang) * dist)}px`);
    dot.style.background = i % 2 ? 'var(--green)' : 'var(--orange)';
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
    layer.appendChild(dot);
    dots.push(dot);
  }
  setTimeout(() => dots.forEach((d) => d.remove()), 700);  // 保底（complete-dot 0.5s）
}

// 移除某列後：兩組皆空 → 顯示 emptyState；組標題正常已跟著最後一筆一起收合（collapseRow），殘留的才在這裡移除
function maybeShowEmpty() {
  const list = document.getElementById('task-list');
  const overdueItems = list.querySelectorAll('.task-item[data-group="overdue"]');
  const upcomingItems = list.querySelectorAll('.task-item[data-group="upcoming"]');

  if (overdueItems.length === 0 && upcomingItems.length === 0) {
    // 清單在使用中變空：空狀態淡入（.is-entering + @starting-style），不再硬切（#35）
    list.innerHTML = `<li class="empty-state is-entering">${tr('emptyState')}</li>`;
    return;
  }
  if (overdueItems.length === 0) {
    list.querySelectorAll('.task-group-label:not(.collapsing)').forEach((h) => h.remove());
  } else if (upcomingItems.length === 0) {
    list.querySelectorAll('.task-group-label[data-group="upcoming"]:not(.collapsing)').forEach((h) => h.remove());
  }
}

// chip 文字（#49）：平常直接換字（30 秒倒數刷新不閃）；手動刷新成功時新舊兩層交叉淡換（--t-swap＋blur 2px）
function setChipText(chip, text, swap) {
  const cur = chip.querySelector('.chip-txt:not(.out)');
  if (!cur) {
    chip.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'chip-txt';
    span.textContent = text;
    chip.appendChild(span);
    return;
  }
  if (!swap) {
    cur.textContent = text;
    return;
  }
  const next = document.createElement('span');
  next.className = 'chip-txt in';
  next.textContent = text;
  chip.appendChild(next);
  next.getBoundingClientRect();                          // forced reflow：進來的從 opacity 0＋blur 起跳
  cur.classList.add('out');
  cur.setAttribute('aria-hidden', 'true');
  next.classList.remove('in');
  cur.addEventListener('transitionend', () => cur.remove(), { once: true });
  setTimeout(() => cur.remove(), SWAP_FALLBACK_MS);
}

// 手動刷新的交換只用一次：storage.onChanged 與 sendMessage 回應誰先到誰用，後到的只是同值重畫
function takeClaudeSwap() {
  const swap = _claudeSwapPending;
  _claudeSwapPending = false;
  return swap;
}

function renderClaudeUsage(usage, { swap = false } = {}) {
  _currentClaudeUsage = usage;
  const chip = document.getElementById('claude-usage-chip');
  if (!chip) return;

  if (!usage) {
    setChipText(chip, tr('claudeUnknown'), false);
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

  setChipText(chip, `CLAUDE ${summary}`, swap);

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
  const label = _claudeRefreshBusy ? tr('claudeRefreshing') : tr('claudeRefresh');
  btn.title = label;
  btn.setAttribute('aria-label', label);   // 內容只剩 ↻ 圖示（aria-hidden），名稱由這裡給
}

// 打開 popup 時要的全部 key：一次讀完（#51）；含自訂作業（QA：popup 顯示自訂作業）
const POPUP_KEYS = ['uiLanguage', 'showClaudeUsageInPopup', 'courses', 'assignments', 'customAssignments', 'courseNames', 'claudeUsage', 'manualDone', 'manualUndone', 'manualShown', 'manualHidden'];

// 完成標記不在這裡快取：勾選/撤銷走 writeDone 的 read-modify-write（讀 storage 最新值），不拿開啟當下的快照覆寫
function renderPopup(data) {
  renderTaskList(data);
  renderClaudeUsage(data.claudeUsage || null);
}

function renderTaskList(data) {
  const courseMap = buildCourseMap(data.courses);
  // Canvas ∪ 自訂作業（與 dashboard render 同一合併；自訂作業同套隱藏／完成／7 天與逾期窗規則）
  const assignments = DueCustomAssignments.mergeAssignmentMaps(data.assignments || {}, data.customAssignments || {});
  const groups = getTasks(assignments, courseMap, data.manualDone || {}, data.manualUndone || {}, data.manualShown || {}, data.manualHidden || {});
  renderTasks(groups, data.courseNames || {});
}

// 打開 popup 時觸發的背景同步若在 popup 還開著時落地（lastSync 變了）→ 清單閒置才重讀重畫：
// 撤銷窗、收合、碎點進行中，或焦點在清單裡（鍵盤操作中）就不動——重建會砍掉撤銷窗、搶走焦點；下次打開 popup 就是新的
function isTaskListBusy() {
  if (document.querySelector('#task-list .completing, #task-list .collapsing, #burst-layer > *')) return true;
  const ae = document.activeElement;
  return !!(ae && ae.closest && ae.closest('#task-list'));
}

function refreshTaskListIfIdle() {
  if (isTaskListBusy()) return;
  chrome.storage.local.get(POPUP_KEYS, (data) => {
    if (!isTaskListBusy()) renderTaskList(data);
  });
}

function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
}

document.getElementById('dashboard-btn').addEventListener('click', openDashboard);

document.getElementById('claude-usage-chip').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://claude.ai/settings/usage' });
});

// ↻ 抓不到用量時的短暫提示：沒有 claude.ai 分頁 → 請先開分頁；其他失敗 → 通用失敗。數秒後清空（key 為 null → 立即清空）
const CLAUDE_NOTE_MS = 4000;
let _claudeNoteTimer = null;
function showClaudeRefreshNote(key) {
  const note = document.getElementById('claude-usage-note');
  if (!note) return;
  clearTimeout(_claudeNoteTimer);
  _claudeNoteTimer = null;
  note.textContent = key ? tr(key) : '';
  if (key) _claudeNoteTimer = setTimeout(() => { note.textContent = ''; }, CLAUDE_NOTE_MS);
}

async function triggerClaudeRefreshSilently() {
  if (_claudeRefreshBusy) return;
  _claudeSwapPending = true;
  setClaudeRefreshBusy(true);
  applyClaudeRefreshCopy();
  showClaudeRefreshNote(null);   // 重按 ↻ 先清掉上一次的提示
  try {
    const response = await chrome.runtime.sendMessage({ type: 'SYNC_CLAUDE_USAGE', force: true });
    if (response && response.success) {
      // 成功：background 已把新用量寫進 storage（onChanged 也會到）；回應先到就由這裡做那一次交換
      if (response.usage && _claudeSwapPending) {
        renderClaudeUsage(response.usage, { swap: takeClaudeSwap() });
      }
    } else {
      // 抓不到（background 回 success:false＋reason）→ 保留舊用量，短暫提示原因
      showClaudeRefreshNote(response && response.reason === 'no-tab' ? 'claudeRefreshMissing' : 'claudeRefreshFailed');
    }
  } catch (err) {
    console.warn('[Due] Claude usage refresh failed:', err.message);
    showClaudeRefreshNote('claudeRefreshFailed');
  } finally {
    _claudeSwapPending = false;
    setClaudeRefreshBusy(false);
    applyClaudeRefreshCopy();
    // 不再 loadData()：重新整理用量沒有理由重建任務清單，會把進行中的撤銷窗砍掉（#40）
  }
}

document.getElementById('claude-usage-refresh').addEventListener('click', triggerClaudeRefreshSilently);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes.lastSync && changes.lastSync.newValue) refreshTaskListIfIdle();
  if (changes.claudeUsage) {
    const usage = changes.claudeUsage.newValue || null;
    renderClaudeUsage(usage, { swap: !!usage && takeClaudeSwap() });
  }
});

// 打開 popup 只讀一次 storage：語言、用量顯示設定與清單在同一個 callback 一起套上，
// 不再先換語言／收 chip、再等第二次讀取才出現清單（#51）。維持沒有進場動畫。
chrome.storage.local.get(POPUP_KEYS, (data) => {
  _uiLanguage = data.uiLanguage || 'zh-TW';
  applyUILanguage();
  applyClaudeRefreshCopy();

  const showUsage = data.showClaudeUsageInPopup !== false;
  const usageActions = document.querySelector('.usage-actions');
  if (usageActions) usageActions.style.display = showUsage ? '' : 'none';

  renderPopup(data);
});

// 打開 popup 就在背景同步 Canvas（使用者多半接著開 Dashboard，到時資料已是新的）。
// background 套用與造訪 Canvas 相同的 5 分鐘節流；不等結果（同步在 service worker 裡跑，popup 關掉也會跑完）
try {
  chrome.runtime.sendMessage({ type: 'AUTO_SYNC' }).catch(() => {});
} catch (_) { /* 擴充功能剛重新載入、訊息通道不在：這次不同步，不影響 popup */ }

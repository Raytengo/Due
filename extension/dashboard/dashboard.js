// ── 顏色池（評分比重分組用） ──
const GROUP_COLORS = [
  '#d97757', '#6a9bcc', '#788c5d', '#b09050',
  '#a86070', '#7a9ba8', '#b08060', '#6a7c5d',
];

// ── 全域資料快取（供事件處理器使用） ──
let _currentData = {};

// ── 截止日期處理 ──
function urgencyClass(dueAt, isExamFlag, submitted = false) {
  if (!dueAt) return 'due-none';
  if (submitted) return 'due-none';
  if (isExamFlag) return 'due-exam';
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
    month: 'short', day: 'numeric',
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
  if (assignment.is_quiz_assignment) return true;
  if ((assignment.submission_types || []).includes('online_quiz')) return true;
  const title = (assignment.name || '').toLowerCase();
  return (
    title.includes('exam') || title.includes('quiz') ||
    title.includes('test') || title.includes('midterm') ||
    title.includes('final')
  );
}

function isAttendance(assignment) {
  const title = (assignment.name || '').toLowerCase();
  return (
    title.includes('attendance') ||
    title.includes('attendence') ||
    title.includes('participation') ||
    title.includes('sign-in') ||
    title.includes('sign in') ||
    title.includes('check-in') ||
    title.includes('check in') ||
    title.includes('checkin') ||
    title.includes('簽到') ||
    title.includes('出勤') ||
    title.includes('考勤')
  );
}

function isSubmitted(a) {
  return a.submission && (
    a.submission.submitted_at ||
    a.submission.workflow_state === 'submitted' ||
    a.submission.workflow_state === 'graded'
  );
}

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function findGroupName(assignment, groups) {
  for (const g of groups) {
    if (g.assignments && g.assignments.some((a) => a.id === assignment.id)) return g.name;
    if (assignment.assignment_group_id && g.id === assignment.assignment_group_id) return g.name;
  }
  return '';
}

function findGroup(assignment, groups) {
  for (const g of groups) {
    if (g.assignments && g.assignments.some((a) => a.id === assignment.id)) return g;
    if (assignment.assignment_group_id && g.id === assignment.assignment_group_id) return g;
  }
  return null;
}

// ── 全域 filter 狀態 ──
let currentFilter = 'assignment';
let showSubmitted = false;

// ── View 狀態 ──
let currentView = 'grid';      // 'grid' | 'course'
let currentCourseId = null;
let currentPage = 'week';      // 'week' | 'courses'
const cardPages = {};           // { [courseId]: pageIndex }

// ── 套用篩選到作業列表 ──
function applyFilters(asgns) {
  // 永久排除簽到/出勤/參與類
  let result = asgns.filter((a) => !isAttendance(a));

  // 類型篩選
  if (currentFilter === 'assignment') result = result.filter((a) => !isExam(a));
  else if (currentFilter === 'exam') result = result.filter((a) => isExam(a));

  // 默認隱藏已繳交；勾選「查看已繳交」後改為只顯示已繳交
  if (showSubmitted) {
    result = result.filter((a) => isSubmitted(a));
  } else {
    result = result.filter((a) => !isSubmitted(a));
  }

  return result;
}

// ── 主要渲染 ──
function render(data) {
  _currentData = data;
  const { lastSync, courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = data;

  document.getElementById('header-meta').textContent =
    `HKUST(GZ) · ${courses.length} 門課程 · ${formatLastSync(lastSync)}`;

  renderNav(courses, assignments);

  if (currentView === 'course') {
    document.getElementById('page-tabs').style.display = 'none';
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('course-detail-container').style.display = 'flex';
    const course = courses.find((c) => c.id === currentCourseId);
    if (course) {
      renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);
    } else {
      showGridView();
    }
  } else {
    document.getElementById('page-tabs').style.display = '';
    document.getElementById('main-section').style.display = '';
    document.getElementById('course-detail-container').style.display = 'none';
    updateTabs();
    if (currentPage === 'week') {
      renderWeekSection(courses, assignments);
    } else {
      renderCardGrid(courses, assignments, assignmentGroups);
    }
  }
}

// ── 左欄課程導航 ──
function renderNav(courses, assignments) {
  const navEl = document.getElementById('course-nav');
  if (!navEl) return;

  if (!courses.length) {
    navEl.innerHTML = '';
    return;
  }

  // Use same sort order as main section (by soonest due)
  const sorted = [...courses].sort((a, b) => {
    const nextDue = (cid) => {
      const asgns = (assignments[cid] || []).filter((x) => x.due_at && new Date(x.due_at) > new Date());
      if (!asgns.length) return Infinity;
      return Math.min(...asgns.map((x) => new Date(x.due_at).getTime()));
    };
    return nextDue(a.id) - nextDue(b.id);
  });

  navEl.innerHTML = sorted.map((c) => {
    const asgns = assignments[c.id] || [];
    const pendingCount = asgns.filter((a) => !isSubmitted(a) && a.due_at && new Date(a.due_at) > new Date()).length;
    const urgentCount = asgns.filter((a) => {
      if (!a.due_at || isSubmitted(a)) return false;
      const diff = new Date(a.due_at) - Date.now();
      return diff > 0 && diff <= 7 * 86400000;
    }).length;

    const badgeClass = urgentCount ? 'nav-course-badge urgent' : 'nav-course-badge';
    const badgeText = pendingCount || '';

    return `
      <button class="nav-course-item" data-target-course="${c.id}">
        <span class="nav-course-name">${esc(c.name)}</span>
        ${badgeText ? `<span class="${badgeClass}">${badgeText}</span>` : ''}
      </button>`;
  }).join('');

  // Bind nav clicks → course detail view
  navEl.querySelectorAll('.nav-course-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      showCourseDetail(parseInt(btn.dataset.targetCourse, 10));
    });
  });
}

// ── 頁面切換 ──
function updateTabs() {
  document.querySelectorAll('.page-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.page === currentPage);
  });
}

function switchPage(page) {
  if (page === currentPage) return;
  if (!_currentData.courses) return;

  const mainSection = document.getElementById('main-section');
  const direction = (currentPage === 'week' && page === 'courses') ? 'left' : 'right';

  // 1. 保存旧内容
  const oldContent = mainSection.innerHTML;

  // 2. 渲染新内容到一个临时容器（不触发 loadData）
  const tempDiv = document.createElement('div');
  tempDiv.style.display = 'none';
  document.body.appendChild(tempDiv);

  const { courses = [], assignments = {}, assignmentGroups = {} } = _currentData;
  const prevPage = currentPage;
  currentPage = page;
  updateTabs();

  // 渲染新页面内容到 mainSection（暂时）
  if (page === 'week') {
    renderWeekSection(courses, assignments);
  } else {
    renderCardGrid(courses, assignments, assignmentGroups);
  }
  const newContent = mainSection.innerHTML;

  // 3. 创建并排滑动容器
  if (direction === 'left') {
    mainSection.innerHTML = `
      <div class="page-slider" id="page-slider">
        <div class="page-slide">${oldContent}</div>
        <div class="page-slide">${newContent}</div>
      </div>`;
  } else {
    mainSection.innerHTML = `
      <div class="page-slider" id="page-slider" style="transform: translateX(-50%)">
        <div class="page-slide">${newContent}</div>
        <div class="page-slide">${oldContent}</div>
      </div>`;
  }

  document.body.removeChild(tempDiv);

  const slider = document.getElementById('page-slider');

  // 4. 触发滑动动画
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      slider.style.transition = 'transform 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)';
      slider.style.transform = direction === 'left' ? 'translateX(-50%)' : 'translateX(0)';
    });
  });

  // 5. 动画结束后恢复正常内容并绑定事件
  setTimeout(() => {
    if (currentPage === 'week') {
      renderWeekSection(courses, assignments);
    } else {
      renderCardGrid(courses, assignments, assignmentGroups);
    }
  }, 470);
}

// ── 本週待辦 ──
function renderWeekSection(courses, assignments) {
  const el = document.getElementById('main-section');
  const now = Date.now();

  const items = [];
  for (const course of courses) {
    const asgns = assignments[course.id] || [];
    for (const a of asgns) {
      if (!a.due_at) continue;
      const diff = new Date(a.due_at) - now;
      // 只顯示未到期的作業
      if (diff >= 0) {
        items.push({ ...a, _course: course });
      }
    }
  }

  const filtered = applyFilters(items);
  filtered.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

  // 分成三組：7天內 / 8-30天 / 30天以上
  const urgent = [];   // 7天內
  const soon = [];     // 8-30天
  const later = [];    // 30天以上

  for (const a of filtered) {
    const diff = new Date(a.due_at) - now;
    const days = diff / 86400000;
    if (days <= 7) urgent.push(a);
    else if (days <= 30) soon.push(a);
    else later.push(a);
  }

  const total = urgent.length + soon.length + later.length;
  const urgentPct = total > 0 ? (urgent.length / total) * 100 : 0;
  const soonPct = total > 0 ? (soon.length / total) * 100 : 0;
  const laterPct = total > 0 ? (later.length / total) * 100 : 0;

  const pieStyle = total > 0
    ? `background: conic-gradient(
        var(--orange) 0% ${urgentPct}%,
        var(--warm) ${urgentPct}% ${urgentPct + soonPct}%,
        var(--blue) ${urgentPct + soonPct}% 100%
      );`
    : 'background: var(--border);';

  const renderGroup = (title, list, colorClass, isLast) => {
    if (list.length === 0) {
      return '';
    }
    const cards = list.map((a) => {
      const uClass = urgencyClass(a.due_at, isExam(a));
      return `
        <div class="week-task-card">
          <div class="week-task-course">${esc(a._course.course_code || a._course.name)}</div>
          <div class="week-task-title">${esc(a.name)}</div>
          <div class="week-task-due ${uClass}">${formatDue(a.due_at)}</div>
        </div>`;
    }).join('');
    return `
      <div class="week-group">
        <div class="week-group-title ${colorClass}">${title} (${list.length})</div>
        <div class="week-task-grid">
          ${cards}
        </div>
      </div>
      ${!isLast ? '<div class="week-divider"></div>' : ''}`;
  };

  const groupsHTML = [
    renderGroup('7天內', urgent, 'color-urgent', false),
    renderGroup('8-30天', soon, 'color-soon', false),
    renderGroup('30天以上', later, 'color-later', true)
  ].filter(h => h).join('');

  el.innerHTML = `
    <div class="week-panel">
      <div class="week-content">
        <div class="week-left">
          <div class="week-pie" style="${pieStyle}"></div>
          <div class="week-legend">
            <div class="week-legend-item">
              <span class="week-legend-dot" style="background: var(--orange);"></span>
              <span class="week-legend-label">7天內 (${urgent.length})</span>
            </div>
            <div class="week-legend-item">
              <span class="week-legend-dot" style="background: var(--warm);"></span>
              <span class="week-legend-label">8-30天 (${soon.length})</span>
            </div>
            <div class="week-legend-item">
              <span class="week-legend-dot" style="background: var(--blue);"></span>
              <span class="week-legend-label">30天+ (${later.length})</span>
            </div>
          </div>
        </div>
        <div class="week-right">
          ${groupsHTML || '<div class="week-group-empty">無待辦事項</div>'}
        </div>
      </div>
    </div>`;
}

// ── 卡片格 ──
function renderCardGrid(courses, assignments, assignmentGroups) {
  const el = document.getElementById('main-section');

  if (!courses.length) {
    el.innerHTML = `
      <div class="state-msg">
        <div class="big">尚無資料</div>
        <div class="small">請先前往 Canvas 頁面或點擊同步</div>
      </div>`;
    return;
  }

  const sorted = [...courses].sort((a, b) => {
    const nextDue = (cid) => {
      const asgns = (assignments[cid] || []).filter((x) => x.due_at && new Date(x.due_at) > new Date());
      if (!asgns.length) return Infinity;
      return Math.min(...asgns.map((x) => new Date(x.due_at).getTime()));
    };
    return nextDue(a.id) - nextDue(b.id);
  });

  el.innerHTML = `<div class="courses-grid">
    ${sorted.map((c) => renderCourseCardGrid(c, assignments[c.id] || [], assignmentGroups[c.id] || [])).join('')}
  </div>`;

  // 整个卡片可点击
  el.querySelectorAll('.course-card-grid').forEach((card) => {
    card.addEventListener('click', (e) => {
      // 如果点击的是分页按钮，不触发卡片点击
      if (e.target.closest('.card-pager-btn')) return;

      const courseId = parseInt(card.dataset.courseId, 10);
      showCourseDetail(courseId, card);
    });
  });

  el.querySelectorAll('.card-pager-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateCardPage(parseInt(btn.dataset.courseId, 10), parseInt(btn.dataset.dir, 10));
    });
  });
}

// ── 單張課程卡片（格狀視圖） ──
function renderCourseCardGrid(course, asgns, groups) {
  const filtered = applyFilters(asgns).sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  });

  const urgentCount = filtered.filter((a) => {
    if (!a.due_at) return false;
    const diff = new Date(a.due_at) - Date.now();
    return diff > 0 && diff <= 7 * 86400000;
  }).length;

  const pendingCount = filtered.length;
  const metaParts = [];
  if (pendingCount) metaParts.push(`${pendingCount} 件待繳`);

  const pageIdx = cardPages[course.id] || 0;
  const bottomHtml = renderCardBottom(course.id, filtered, pageIdx);

  return `
    <div class="course-card-grid" data-course-id="${course.id}">
      <div class="card-top" data-course-id="${course.id}">
        <div class="card-top-row">
          <div class="card-code">${esc(course.course_code || '')}</div>
          ${urgentCount ? `<div class="card-badge-urgent">${urgentCount} 件緊急</div>` : ''}
        </div>
        <div class="card-name">${esc(course.name)}</div>
        ${metaParts.length ? `<div class="card-meta">${metaParts.join(' · ')}</div>` : ''}
      </div>
      ${bottomHtml}
    </div>`;
}

// ── 卡片下半部分（作業列表 + 分頁） ──
function renderCardBottom(courseId, sorted, pageIdx) {
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(pageIdx, totalPages - 1);
  const visible = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const rows = visible.length
    ? visible.map((a) => {
        const uClass = urgencyClass(a.due_at, isExam(a), isSubmitted(a));
        return `
          <div class="card-row">
            <div class="card-row-title">${esc(a.name)}</div>
            <div class="card-row-due ${uClass}">${formatDue(a.due_at)}</div>
          </div>`;
      }).join('')
    : '<div class="card-empty">無待繳作業</div>';

  const pager = totalPages > 1 ? `
    <div class="card-pager">
      <button class="card-pager-btn" data-course-id="${courseId}" data-dir="-1"${page === 0 ? ' disabled' : ''}>‹</button>
      <span class="card-pager-info">${page + 1} / ${totalPages}</span>
      <button class="card-pager-btn" data-course-id="${courseId}" data-dir="1"${page >= totalPages - 1 ? ' disabled' : ''}>›</button>
    </div>` : '';

  return `<div class="card-bottom"><div class="card-rows-container">${rows}</div>${pager}</div>`;
}

// ── 分頁切換（局部重繪） ──
function updateCardPage(courseId, dir) {
  const asgns = (_currentData.assignments || {})[courseId] || [];
  const filtered = applyFilters(asgns).sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  });

  const pageSize = 2;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = cardPages[courseId] || 0;
  const next = Math.max(0, Math.min(totalPages - 1, current + dir));
  if (next === current) return;
  cardPages[courseId] = next;

  const card = document.querySelector(`.course-card-grid[data-course-id="${courseId}"]`);
  if (!card) return;
  const newBottom = renderCardBottom(courseId, filtered, next);
  card.querySelector('.card-bottom').outerHTML = newBottom;

  card.querySelectorAll('.card-pager-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateCardPage(parseInt(btn.dataset.courseId, 10), parseInt(btn.dataset.dir, 10));
    });
  });
}

// ── 切換至課程詳細 ──
function showCourseDetail(courseId, cardEl) {
  // 没有卡片元素或不支持 View Transitions 时的回退
  if (!cardEl || !document.startViewTransition) {
    currentView = 'course';
    currentCourseId = courseId;
    loadData();
    return;
  }

  // ── FIRST: 在小卡片上标记共享元素 ──
  cardEl.style.viewTransitionName = 'course-shell';
  const cCode = cardEl.querySelector('.card-code');
  const cName = cardEl.querySelector('.card-name');
  const cBadge = cardEl.querySelector('.card-badge-urgent');
  const cMeta = cardEl.querySelector('.card-meta');
  if (cCode) cCode.style.viewTransitionName = 'course-code';
  if (cName) cName.style.viewTransitionName = 'course-name';
  if (cBadge) cBadge.style.viewTransitionName = 'course-badge';
  if (cMeta) cMeta.style.viewTransitionName = 'course-meta';

  // ── 启动 View Transition ──
  const transition = document.startViewTransition(() => {
    currentView = 'course';
    currentCourseId = courseId;

    const detailContainer = document.getElementById('course-detail-container');
    const pageTabs = document.getElementById('page-tabs');
    const mainSection = document.getElementById('main-section');

    pageTabs.style.display = 'none';
    mainSection.style.display = 'none';
    detailContainer.style.display = 'flex';

    const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    renderNav(courses, assignments);
    renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);

    // ── LAST: 在详情视图上标记对应的共享元素 ──
    const detailCard = detailContainer.querySelector('.course-detail-view');
    if (detailCard) detailCard.style.viewTransitionName = 'course-shell';
    const dCode = detailContainer.querySelector('.detail-code');
    const dName = detailContainer.querySelector('.detail-name');
    const dBadge = detailContainer.querySelector('.card-badge-urgent');
    const dMeta = detailContainer.querySelector('.detail-meta');
    if (dCode) dCode.style.viewTransitionName = 'course-code';
    if (dName) dName.style.viewTransitionName = 'course-name';
    if (dBadge) dBadge.style.viewTransitionName = 'course-badge';
    if (dMeta) dMeta.style.viewTransitionName = 'course-meta';
  });

  // 动画完成后清理 view-transition-name
  transition.finished.then(() => {
    document.querySelectorAll('[style*="view-transition-name"]').forEach((el) => {
      el.style.viewTransitionName = '';
    });
  });
}

// ── 返回格狀視圖 ──
function showGridView() {
  const prevCourseId = currentCourseId;

  if (!document.startViewTransition) {
    currentView = 'grid';
    currentCourseId = null;
    currentPage = 'courses';
    loadData();
    return;
  }

  // ── FIRST: 在详情视图上标记共享元素 ──
  const detailContainer = document.getElementById('course-detail-container');
  const detailCard = detailContainer.querySelector('.course-detail-view');
  if (detailCard) detailCard.style.viewTransitionName = 'course-shell';
  const dCode = detailContainer.querySelector('.detail-code');
  const dName = detailContainer.querySelector('.detail-name');
  const dBadge = detailContainer.querySelector('.card-badge-urgent');
  const dMeta = detailContainer.querySelector('.detail-meta');
  if (dCode) dCode.style.viewTransitionName = 'course-code';
  if (dName) dName.style.viewTransitionName = 'course-name';
  if (dBadge) dBadge.style.viewTransitionName = 'course-badge';
  if (dMeta) dMeta.style.viewTransitionName = 'course-meta';

  const transition = document.startViewTransition(() => {
    currentView = 'grid';
    currentCourseId = null;
    currentPage = 'courses';

    const pageTabs = document.getElementById('page-tabs');
    const mainSection = document.getElementById('main-section');

    pageTabs.style.display = '';
    mainSection.style.display = '';
    detailContainer.style.display = 'none';

    const { courses = [], assignments = {}, assignmentGroups = {} } = _currentData;
    updateTabs();
    renderNav(courses, assignments);
    renderCardGrid(courses, assignments, assignmentGroups);

    // ── LAST: 在小卡片上标记对应的共享元素 ──
    const card = document.querySelector(`.course-card-grid[data-course-id="${prevCourseId}"]`);
    if (card) {
      card.style.viewTransitionName = 'course-shell';
      const cCode = card.querySelector('.card-code');
      const cName = card.querySelector('.card-name');
      const cBadge = card.querySelector('.card-badge-urgent');
      const cMeta = card.querySelector('.card-meta');
      if (cCode) cCode.style.viewTransitionName = 'course-code';
      if (cName) cName.style.viewTransitionName = 'course-name';
      if (cBadge) cBadge.style.viewTransitionName = 'course-badge';
      if (cMeta) cMeta.style.viewTransitionName = 'course-meta';
    }
  });

  transition.finished.then(() => {
    document.querySelectorAll('[style*="view-transition-name"]').forEach((el) => {
      el.style.viewTransitionName = '';
    });
  });
}

// ── 課程詳細視圖 ──
function renderCourseDetailSection(course, asgns, groups, scores) {
  const el = document.getElementById('course-detail-container');

  const filtered = applyFilters(asgns).sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  });

  const urgentCount = filtered.filter((a) => {
    if (!a.due_at) return false;
    const diff = new Date(a.due_at) - Date.now();
    return diff > 0 && diff <= 7 * 86400000;
  }).length;

  const pendingCount = filtered.length;
  const metaParts = [];
  if (pendingCount) metaParts.push(`${pendingCount} 件待繳`);

  const syllabusData = (_currentData.syllabusAnalysis || {})[course.id] || null;
  const weightPieHtml = renderWeightPie(groups, syllabusData);
  const gradeCalcHtml = renderGradeCalculator(course, asgns, groups, scores);
  const assignmentRows = filtered.map((a) => renderAssignmentRow(a, groups, course.id)).join('');

  el.innerHTML = `
    <button class="detail-back" id="detail-back-btn">← 返回</button>
    <div class="course-detail-view">
      <div class="detail-card-top">
        <div class="detail-top-row">
          <div class="detail-code">${esc(course.course_code || '')}</div>
          ${urgentCount ? `<div class="card-badge-urgent">${urgentCount} 件緊急</div>` : ''}
        </div>
        <div class="detail-name">${esc(course.name)}</div>
        ${metaParts.length ? `<div class="detail-meta">${metaParts.join(' · ')}</div>` : ''}
      </div>
      <div class="detail-card-bottom">
        <div class="detail-left-panel">
          ${weightPieHtml}
          ${renderSyllabusSection(course.id)}
        </div>
        <div class="detail-right-panel">
          ${gradeCalcHtml}
          <div class="detail-assignments-label">作業清單</div>
          ${assignmentRows || '<div style="padding:12px 0;color:var(--mid);font-size:13px;">無作業</div>'}
        </div>
      </div>
    </div>`;

  document.getElementById('detail-back-btn').addEventListener('click', showGridView);

  el.querySelectorAll('.assignment-item').forEach((item) => {
    item.addEventListener('click', () => {
      const desc = item.nextElementSibling;
      if (desc && desc.classList.contains('assignment-desc')) {
        desc.classList.toggle('open');
      }
    });
  });

  el.querySelectorAll('.btn-analyze').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAnalysisPanel(parseInt(btn.dataset.assignmentId, 10), parseInt(btn.dataset.courseId, 10));
    });
  });

  el.querySelectorAll('.assignment-title-link').forEach((title) => {
    title.addEventListener('click', (e) => {
      e.stopPropagation();
      const assignmentId = title.dataset.assignmentId;
      const courseId = title.dataset.courseId;
      const url = `https://hkust-gz.instructure.com/courses/${courseId}/assignments/${assignmentId}`;
      window.open(url, '_blank');
    });
  });

  el.querySelectorAll('.grade-calc-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.closest('.grade-calc').classList.toggle('open');
    });
  });

  el.querySelectorAll('.grade-calc-pts input').forEach((input) => {
    input.addEventListener('input', () => {
      recalculateGrades(parseInt(input.dataset.courseId, 10));
    });
  });

  el.querySelectorAll('.btn-syllabus-analyze').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cid = parseInt(btn.dataset.courseId, 10);
      const force = btn.dataset.force === 'true';
      const section = document.getElementById(`syllabus-section-${cid}`);
      if (section) section.innerHTML = '<div class="syllabus-loading">分析中...</div>';
      chrome.runtime.sendMessage({ type: 'ANALYZE_SYLLABUS', courseId: cid, force }, (res) => {
        if (res && res.success) {
          if (!_currentData.syllabusAnalysis) _currentData.syllabusAnalysis = {};
          _currentData.syllabusAnalysis[cid] = { timestamp: new Date().toISOString(), ...res.result };
          // Re-render entire detail section so pie chart updates
          const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
          const course = courses.find((c) => c.id === cid);
          if (course) renderCourseDetailSection(course, assignments[cid] || [], assignmentGroups[cid] || [], scores);
        } else {
          const msg = res && res.error === 'NO_API_KEY' ? '請先設定 API 金鑰' : '分析失敗，請稍後再試';
          if (section) section.innerHTML = `<div class="syllabus-empty">${msg}</div><button class="btn-syllabus-analyze" data-course-id="${cid}">重試</button>`;
        }
      });
    });
  });
}


// ── Weight Pie Chart ──
function renderWeightPie(groups, syllabusData) {
  const hasGroupWeights = groups.some((g) => g.group_weight);
  const total = groups.reduce((s, g) => s + (g.group_weight || 0), 0);

  // Use Canvas assignment groups if available
  if (hasGroupWeights && total > 0) {
    let currentPct = 0;
    const gradientParts = groups.map((g, i) => {
      const pct = ((g.group_weight || 0) / total) * 100;
      const startPct = currentPct;
      currentPct += pct;
      return `${GROUP_COLORS[i % GROUP_COLORS.length]} ${startPct}% ${currentPct}%`;
    }).join(', ');

    const legend = groups.map((g, i) => `
      <div class="detail-pie-legend-item">
        <div class="detail-pie-legend-dot" style="background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>
        <span class="detail-pie-legend-text">${esc(g.name)}</span>
        <span class="detail-pie-legend-weight">${g.group_weight || 0}%</span>
      </div>`).join('');

    return `
      <div class="detail-weight-pie-container">
        <div class="detail-pie" style="background: conic-gradient(${gradientParts});"></div>
        <div class="detail-pie-legend">${legend}</div>
      </div>`;
  }

  // Fallback: use syllabus analysis components
  if (syllabusData && syllabusData.found && syllabusData.components && syllabusData.components.length > 0) {
    const components = syllabusData.components.filter((c) => c.weight != null && c.weight > 0);
    if (components.length > 0) {
      const syllabusTotal = components.reduce((s, c) => s + c.weight, 0);
      let currentPct = 0;
      const gradientParts = components.map((c, i) => {
        const pct = (c.weight / syllabusTotal) * 100;
        const startPct = currentPct;
        currentPct += pct;
        return `${GROUP_COLORS[i % GROUP_COLORS.length]} ${startPct}% ${currentPct}%`;
      }).join(', ');

      const legend = components.map((c, i) => `
        <div class="detail-pie-legend-item">
          <div class="detail-pie-legend-dot" style="background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>
          <span class="detail-pie-legend-text">${esc(c.name)}</span>
          <span class="detail-pie-legend-weight">${c.weight}%</span>
        </div>`).join('');

      return `
        <div class="detail-weight-pie-container">
          <div class="detail-pie" style="background: conic-gradient(${gradientParts});"></div>
          <div class="detail-pie-legend">${legend}</div>
        </div>`;
    }
  }

  // No data
  return `
    <div class="detail-weight-pie-container">
      <div class="detail-pie" style="background: var(--border);"></div>
      <div class="detail-pie-label">沒有評分資訊</div>
    </div>`;
}

// ── Syllabus Section ──
function renderSyllabusSection(courseId) {
  const cached = (_currentData.syllabusAnalysis || {})[courseId];

  if (!cached) {
    return `
      <div class="syllabus-section" id="syllabus-section-${courseId}">
        <button class="btn-syllabus-analyze" data-course-id="${courseId}">分析評分方式</button>
      </div>`;
  }

  const sourceLabel = {
    syllabus_body: 'Syllabus',
    'syllabus_body+pdf': 'Syllabus PDF',
    syllabus_page_pdf: 'Syllabus PDF',
    keyword_pdf: '課程 PDF',
    ai_selected_pdf: 'AI 選取 PDF',
  }[cached.source] || '';

  const notFound = !cached.found || !cached.components || cached.components.length === 0;

  return `
    <div class="syllabus-section" id="syllabus-section-${courseId}">
      ${notFound ? `<div class="syllabus-empty">${esc(cached.notes || '未找到評分資訊')}</div>` : ''}
      <div class="syllabus-footer">
        ${sourceLabel ? `<span class="syllabus-source">${sourceLabel}</span>` : ''}
        <button class="btn-syllabus-analyze" data-course-id="${courseId}" data-force="true">重新分析</button>
      </div>
    </div>`;
}

// ── Weight Bar ──
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

// ── 成績計算器 ──
function renderGradeCalculator(course, asgns, groups, scores) {
  // Only show for courses with weighted groups
  const hasWeights = groups.some((g) => g.group_weight);
  if (!groups.length || !hasWeights) return '';

  const groupRows = groups.map((g) => {
    const groupAsgns = asgns.filter((a) => {
      if (g.assignments) return g.assignments.some((ga) => ga.id === a.id);
      return a.assignment_group_id === g.id;
    }).filter((a) => a.points_possible != null && a.points_possible > 0);

    if (!groupAsgns.length) return '';

    const rows = groupAsgns.map((a) => {
      const savedScore = scores[a.id] !== undefined ? scores[a.id] : '';
      return `
        <div class="grade-calc-row">
          <span class="grade-calc-asgn-name" title="${esc(a.name)}">${esc(a.name)}</span>
          <div class="grade-calc-pts">
            <input
              type="number"
              min="0"
              max="${a.points_possible}"
              placeholder="—"
              value="${savedScore}"
              data-assignment-id="${a.id}"
              data-course-id="${course.id}"
            />
            <span class="grade-calc-possible">/ ${a.points_possible}</span>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="grade-calc-group">
        <div class="grade-calc-group-header">
          <span class="grade-calc-group-name">${esc(g.name)} · ${g.group_weight || 0}%</span>
          <span class="grade-calc-group-score" id="group-score-${g.id}">—</span>
        </div>
        ${rows}
      </div>`;
  }).join('');

  if (!groupRows.trim()) return '';

  return `
    <div class="grade-calc">
      <div class="grade-calc-header">
        <span class="grade-calc-title">成績計算器</span>
        <span class="grade-calc-final-display" id="final-grade-${course.id}">—</span>
      </div>
      <div class="grade-calc-body">
        ${groupRows}
      </div>
    </div>`;
}

// ── 成績即時計算 ──
function recalculateGrades(courseId) {
  const { assignments = {}, assignmentGroups = {} } = _currentData;
  const asgns = assignments[courseId] || [];
  const groups = assignmentGroups[courseId] || [];

  // Read all input values for this course
  const newScores = {};
  const clearedIds = new Set();

  asgns.forEach((a) => {
    const input = document.querySelector(
      `.grade-calc-pts input[data-assignment-id="${a.id}"][data-course-id="${courseId}"]`
    );
    if (!input) return;
    if (input.value !== '') {
      newScores[a.id] = parseFloat(input.value);
    } else {
      clearedIds.add(a.id);
    }
  });

  // Persist scores
  chrome.storage.local.get(['scores'], (data) => {
    const scores = { ...(data.scores || {}), ...newScores };
    clearedIds.forEach((id) => delete scores[id]);
    chrome.storage.local.set({ scores });
    _currentData.scores = scores;

    // Update group score displays
    let weightedSum = 0;
    let weightedTotal = 0;

    groups.forEach((g) => {
      const groupAsgns = asgns.filter((a) => {
        if (g.assignments) return g.assignments.some((ga) => ga.id === a.id);
        return a.assignment_group_id === g.id;
      });

      let earnedSum = 0;
      let possibleSum = 0;
      let hasScore = false;

      groupAsgns.forEach((a) => {
        if (scores[a.id] !== undefined && a.points_possible) {
          earnedSum += scores[a.id];
          possibleSum += a.points_possible;
          hasScore = true;
        }
      });

      const scoreEl = document.getElementById(`group-score-${g.id}`);
      if (scoreEl) {
        if (hasScore && possibleSum > 0) {
          const pct = ((earnedSum / possibleSum) * 100).toFixed(1);
          scoreEl.textContent = `${pct}%`;
          weightedSum += (earnedSum / possibleSum) * (g.group_weight || 0);
          weightedTotal += (g.group_weight || 0);
        } else {
          scoreEl.textContent = '—';
        }
      }
    });

    const finalEl = document.getElementById(`final-grade-${courseId}`);
    if (finalEl) {
      if (weightedTotal > 0) {
        const final = ((weightedSum / weightedTotal) * 100).toFixed(1);
        finalEl.textContent = `${final}%`;
      } else {
        finalEl.textContent = '—';
      }
    }
  });
}

// ── 作業列 ──
function renderAssignmentRow(a, groups, courseId) {
  const submitted = isSubmitted(a);
  const examFlag = isExam(a);
  const uClass = urgencyClass(a.due_at, examFlag, submitted);
  const groupName = findGroupName(a, groups);
  const desc = a.description ? stripHtml(a.description) : '（無描述）';

  // 考試成績顯示
  let gradeHtml = '';
  if (examFlag && submitted && a.submission) {
    if (a.submission.score != null && a.points_possible) {
      const pct = ((a.submission.score / a.points_possible) * 100).toFixed(1);
      gradeHtml = `<div class="exam-grade">${a.submission.score} / ${a.points_possible} · ${pct}%</div>`;
    } else if (a.submission.grade) {
      gradeHtml = `<div class="exam-grade">${esc(a.submission.grade)}</div>`;
    }
  }

  return `
    <div class="assignment-item${submitted ? ' submitted' : ''}">
      <div class="assignment-left">
        <div class="assignment-title"><span class="assignment-title-link" data-assignment-id="${a.id}" data-course-id="${courseId}">${esc(a.name)}</span></div>
        ${groupName ? `<div class="assignment-group">${esc(groupName)}</div>` : ''}
      </div>
      <div class="assignment-right">
        <div class="due-label ${uClass}">${formatDue(a.due_at)}</div>
        ${gradeHtml}
        ${submitted ? '<div class="submitted-badge">已繳</div>' : ''}
        <button class="btn-analyze" data-assignment-id="${a.id}" data-course-id="${courseId}">AI 分析</button>
      </div>
    </div>
    <div class="assignment-desc">
      <div class="assignment-desc-inner">${desc}</div>
    </div>`;
}

// ── 分析面板 ──
function openAnalysisPanel(assignmentId, courseId) {
  const { assignments = {}, analysis = {}, milestoneChecks = {} } = _currentData;
  const asgns = assignments[courseId] || [];
  const assignment = asgns.find((a) => a.id === assignmentId);

  if (!assignment) return;

  // Update panel subtitle
  document.getElementById('analysis-panel-subtitle').textContent = esc(assignment.name);

  // Show panel
  document.getElementById('analysis-backdrop').classList.add('open');
  document.getElementById('analysis-panel').classList.add('open');

  const cachedAnalysis = (analysis[assignmentId] || null);

  if (cachedAnalysis) {
    renderAnalysisContent(cachedAnalysis.result, assignmentId, assignment, milestoneChecks, cachedAnalysis.timestamp);
  } else {
    document.getElementById('analysis-content').innerHTML =
      '<div class="analysis-loading">正在呼叫 Claude API 分析中...</div>';
    fetchAnalysis(assignmentId, courseId, assignment, milestoneChecks);
  }
}

function fetchAnalysis(assignmentId, courseId, assignment, milestoneChecks) {
  chrome.runtime.sendMessage(
    { type: 'ANALYZE_ASSIGNMENT', assignmentId, courseId },
    (response) => {
      if (!response) {
        showAnalysisError('通訊失敗，請重試');
        return;
      }
      if (!response.success) {
        if (response.error === 'NO_API_KEY') {
          document.getElementById('analysis-content').innerHTML = `
            <div class="analysis-error">
              尚未設定 AI API 金鑰。<br /><br />
              請先前往
              <a href="#" id="open-settings-link">設定頁面</a>
              選擇模型並輸入 API 金鑰。
            </div>`;
          document.getElementById('open-settings-link').addEventListener('click', (e) => {
            e.preventDefault();
            const url = chrome.runtime.getURL('settings.html');
            chrome.tabs.create({ url });
          });
        } else {
          showAnalysisError(response.error);
        }
        return;
      }
      // Cache in _currentData
      if (!_currentData.analysis) _currentData.analysis = {};
      _currentData.analysis[assignmentId] = {
        timestamp: new Date().toISOString(),
        result: response.result,
      };
      renderAnalysisContent(response.result, assignmentId, assignment, milestoneChecks, new Date().toISOString());
    }
  );
}

function showAnalysisError(msg) {
  document.getElementById('analysis-content').innerHTML =
    `<div class="analysis-error">${esc(msg)}</div>`;
}

function renderAnalysisContent(result, assignmentId, assignment, milestoneChecks, timestamp) {
  const timeAgo = formatLastSync(timestamp);
  const usedModel = _currentData.analysis?.[assignmentId]?.model || '';
  const modelLabel = usedModel === 'gemini' ? 'Gemini' : usedModel === 'claude' ? 'Claude' : '';

  let html = `<div class="analysis-cached-note">${modelLabel ? `${modelLabel} · ` : ''}${timeAgo} · <button class="btn-reanalyze" id="btn-reanalyze">重新分析</button></div>`;

  // Summary
  if (result.summary) {
    html += `
      <div class="analysis-section">
        <div class="analysis-section-label">摘要</div>
        <div class="analysis-summary">${esc(result.summary)}</div>
      </div>`;
  }

  // Estimated hours
  if (result.estimatedHours) {
    html += `
      <div class="analysis-section">
        <div class="analysis-section-label">預估作業時間</div>
        <div class="analysis-hours">${result.estimatedHours} hrs</div>
      </div>`;
  }

  // Requirements
  if (result.requirements && result.requirements.length) {
    html += `
      <div class="analysis-section">
        <div class="analysis-section-label">作業要求</div>
        <ul class="analysis-list">
          ${result.requirements.map((r) => `<li>${esc(r)}</li>`).join('')}
        </ul>
      </div>`;
  }

  // Milestones
  if (result.milestones && result.milestones.length) {
    const milestoneItems = result.milestones.map((m, i) => {
      const checkKey = `${assignmentId}_${i}`;
      const isChecked = milestoneChecks[checkKey] ? 'checked' : '';
      const checkedClass = milestoneChecks[checkKey] ? 'checked' : '';

      let dateStr = '';
      if (assignment.due_at && m.daysBeforeDue != null) {
        const dueDate = new Date(assignment.due_at);
        const milestoneDate = new Date(dueDate.getTime() - m.daysBeforeDue * 86400000);
        dateStr = milestoneDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
      } else if (m.daysBeforeDue != null) {
        dateStr = `截止前 ${m.daysBeforeDue} 天`;
      }

      return `
        <div class="milestone-item ${checkedClass}" id="milestone-${assignmentId}-${i}">
          <input type="checkbox" class="milestone-check" ${isChecked}
            data-assignment-id="${assignmentId}" data-milestone-index="${i}" />
          <div class="milestone-info">
            <div class="milestone-title">${esc(m.title)}</div>
            <div class="milestone-desc">${esc(m.description)}</div>
            ${dateStr ? `<div class="milestone-date">${dateStr}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    html += `
      <div class="analysis-section">
        <div class="analysis-section-label">里程碑規劃</div>
        ${milestoneItems}
      </div>`;
  }

  // Tips
  if (result.tips && result.tips.length) {
    html += `
      <div class="analysis-section">
        <div class="analysis-section-label">建議</div>
        <ul class="analysis-list">
          ${result.tips.map((t) => `<li>${esc(t)}</li>`).join('')}
        </ul>
      </div>`;
  }

  document.getElementById('analysis-content').innerHTML = html;

  // Re-analyze button
  document.getElementById('btn-reanalyze').addEventListener('click', () => {
    const courseId = parseInt(
      document.querySelector(`[data-assignment-id="${assignmentId}"][data-course-id]`)?.dataset.courseId,
      10
    );
    if (!courseId) return;
    document.getElementById('analysis-content').innerHTML =
      '<div class="analysis-loading">正在重新分析...</div>';
    fetchAnalysis(assignmentId, courseId, assignment, milestoneChecks);
  });

  // Milestone checkboxes
  document.querySelectorAll('.milestone-check').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const asgId = parseInt(checkbox.dataset.assignmentId, 10);
      const idx = parseInt(checkbox.dataset.milestoneIndex, 10);
      const key = `${asgId}_${idx}`;
      const milestoneEl = document.getElementById(`milestone-${asgId}-${idx}`);

      chrome.storage.local.get(['milestoneChecks'], (data) => {
        const checks = data.milestoneChecks || {};
        if (checkbox.checked) {
          checks[key] = true;
          milestoneEl && milestoneEl.classList.add('checked');
        } else {
          delete checks[key];
          milestoneEl && milestoneEl.classList.remove('checked');
        }
        chrome.storage.local.set({ milestoneChecks: checks });
        _currentData.milestoneChecks = checks;
      });
    });
  });
}

// ── 分析面板關閉 ──
function closeAnalysisPanel() {
  document.getElementById('analysis-backdrop').classList.remove('open');
  document.getElementById('analysis-panel').classList.remove('open');
}

document.getElementById('analysis-close').addEventListener('click', closeAnalysisPanel);
document.getElementById('analysis-backdrop').addEventListener('click', closeAnalysisPanel);

// ── Filter 按鈕 ──
document.querySelectorAll('.pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadData();
  });
});

// ── 頁面切換 ──
document.querySelectorAll('.page-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    switchPage(tab.dataset.page);
  });
});

// ── 查看已繳交 ──
document.getElementById('hide-done-cb').addEventListener('change', (e) => {
  showSubmitted = e.target.checked;
  loadData();
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
    ['lastSync', 'courses', 'assignments', 'assignmentGroups', 'scores', 'files', 'analysis', 'milestoneChecks', 'syllabusAnalysis'],
    (data) => {
      if (!data.courses || !data.courses.length) {
        currentView = 'grid';
        currentCourseId = null;
        document.getElementById('header-meta').textContent = '尚無資料，請先前往 Canvas 頁面';
        document.getElementById('course-nav').innerHTML = '';
        document.getElementById('week-section').style.display = '';
        document.getElementById('week-section').innerHTML = '';
        document.getElementById('courses-section').innerHTML = `
          <div class="state-msg">
            <div class="big">尚無資料</div>
            <div class="small">請先登入 Canvas 並點擊同步</div>
          </div>`;
        return;
      }
      render({
        ...data,
        scores: data.scores || {},
        files: data.files || {},
        analysis: data.analysis || {},
        milestoneChecks: data.milestoneChecks || {},
        syllabusAnalysis: data.syllabusAnalysis || {},
      });
    }
  );
}

// ── 深色模式 ──
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.getElementById('theme-toggle').textContent = dark ? '☀' : '☾';
}

chrome.storage.local.get(['darkMode'], (data) => {
  applyTheme(!!data.darkMode);
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
  chrome.storage.local.set({ darkMode: !isDark });
});

loadData();

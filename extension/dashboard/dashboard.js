// ── 顏色池（評分比重分組用） ──
const GROUP_COLORS = [
  '#d97757', '#6a9bcc', '#788c5d', '#b09050',
  '#a86070', '#7a9ba8', '#b08060', '#6a7c5d',
];

// 拖曳握把（grip-vertical，用於可拖曳的考試/簽到列：升級/降級）；緊跟在作業名稱後、為唯一拖曳起點
const DRAG_GRIP = '<span class="drag-grip" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg></span>';

let _uiLanguage = 'zh-TW';
let _showClaudeUsage = true;
const I18N = {
  'zh-TW': {
    filter: '篩選',
    assignment: '作業',
    exam: '考試',
    all: '全部',
    courses: '課程',
    sync: '同步',
    syncing: '同步中...',
    syncFailed: '同步失敗',
    tabWeek: '學期待辦',
    tabCourses: '課程',
    addAssignment: '+ 新增作業',
    addAssignmentTitle: '新增作業',
    editAssignmentTitle: '編輯作業',
    customDelete: '刪除',
    customAssignment: '自訂作業',
    customCourseLabel: '課程',
    customNameLabel: '作業名稱',
    customDescriptionLabel: '作業描述',
    customDueLabel: '截止日期',
    customCancel: '取消',
    customSave: '儲存',
    customNameRequired: '請輸入作業名稱',
    confirmDeleteCustom: '確定要刪除此自訂作業嗎？',
    deleteCustomTitle: '刪除自訂作業',
    languageLabel: '語言',
    langZhTw: '繁體中文',
    langZhCn: '简体中文',
    langEn: 'English',
    menuTutorial: '使用教學',
    menuUsageShow: '顯示 Popup Claude 用量',
    menuUsageHide: '隱藏 Popup Claude 用量',
    // formatDue
    noDueDate: '無截止日期',
    // 逾期文案與稽核入口（2026-07）
    overdueToday: '今天到期',
    overdueDaysLabel: '逾{n}天',
    overdueGroup: '已逾期',
    hiddenItemsToggle: '已隱藏 {n} 項',
    hiddenItemsEmpty: '目前沒有隱藏項目（把作業拖到這裡可隱藏）',
    dropToShow: '放開以加入作業清單',
    dropToHide: '放開以隱藏',
    today: '今天',
    tomorrow: '明天',
    daysLater: '{n}天後',
    // formatLastSync
    neverSynced: '尚未同步',
    justSynced: '剛才同步',
    minutesAgo: '分鐘前同步',
    hoursAgo: '小時前同步',
    daysAgo: '天前同步',
    // header meta
    courseCountSuffix: '門課程',
    // empty states
    noData: '尚無資料',
    noDataHint: '請先前往 Canvas 頁面或點擊同步',
    noDataHintSync: '請先登入 Canvas 並點擊同步',
    noDataMeta: '尚無資料，請先前往 Canvas 頁面',
    // badges
    pendingItems: '件待繳',
    completedItems: '件已完成',
    urgentItems: '件緊急',
    // back button
    back: '返回',
    // list labels
    listAssignment: '作業清單',
    listExam: '考試清單',
    listAll: '項目清單',
    // empty item labels
    noPendingAssignment: '無待繳作業',
    noPendingExam: '無待繳考試',
    noPendingAll: '無待辦項目',
    noAssignment: '無作業',
    noExam: '無考試',
    noAll: '無項目',
    // weight pie
    noGradeInfo: '沒有評分資訊',
    renameCourse: '重命名',
    weightItemName: '項目名稱',
    // grade calculator
    gradeCalcTitle: '成績計算器',
    // assignment row
    noDesc: '（無描述）',
    submittedBadge: '已繳',
    markDone: '標記完成',
    markUndone: '取消完成',
    undoComplete: '撤銷',
    // week section
    within7Days: '7天內',
    within30Days: '8-30天',
    beyond30Days: '30天以上',
    noTasks: '無待辦事項',
    weekDoneLabel: '本週完成',
    weekAllDoneLabel: '全部完成',
    // ui widgets
    editWeight: '編輯',
    weightEditTitle: '編輯評分權重',
    weightReset: '還原 Canvas 權重',
    weightAddItem: '+ 新增項目',
    weightTotal: '總計：',
    unnamedWeight: '未命名',
    submittedBtn: '已繳交',
    // welcome steps
    wTitle1: '歡迎使用 Due',
    wBody1Intro: 'Due，提醒你該做的事 ⚡️',
    wBody1Q1: '「Canvas找個作業要翻半天」- 有人',
    wBody1Q2: '「明天要交Lab喔...」- 另一個人',
    wTitle2: '登入 Canvas（必須）',
    wBody2: 'Due 透過你的 Canvas 登入狀態同步資料，不需要額外設定或 Token。',
    wStep2Li1: '登入 <a class="welcome-inline-link" id="welcome-canvas-link">Canvas ↗</a>（點一下，同步完成會自動帶你回來）',
    wStep2Li2: 'Due 會<strong>在你每次打開Canvas時自動更新</strong>你的所有課程與作業',
    wStep2Li3: '點擊工具列或進入 Dashboard 都可以看到相關資訊',
    wCanvasSynced: '✓ 已同步，資料已更新',
    wTitle3: '釘選 Due 到工具列',
    wBody3: '釘選後點一下圖示就能查看 7 天待辦',
    wBody3Joke: '（是為了這碟醋包的餃子btw）',
    wStep3Li1: '點擊瀏覽器右上角的<strong>拼圖圖示</strong>（擴充功能）',
    wStep3Li2: '找到 <strong>Due</strong>，點擊旁邊的<strong>釘選圖示</strong>',
    wStep3Li3: '工具列出現 Due 圖示後即完成',
    wTitle4: '拖曳整理作業清單',
    wBody4: 'Due 會自動隱藏考試、簽到<br>你也可以自己決定要藏誰、留誰',
    wStep4Li1: '按住作業的 <strong>⠿</strong> 拖到底部「<strong>已隱藏</strong>」區即可隱藏；反之亦然',
    wTitle5: '開始用 Due 吧',
    wBody5: '這幾個功能容易錯過，記得試試：',
    wFeatCustomName: '自訂作業',
    wFeatCustomDesc: '加入 Canvas 上沒有的個人任務',
    wFeatRenameName: '課程改名',
    wFeatRenameDesc: '改成你習慣的叫法',
    wSupport5: '有 bug 或建議？跟我說一聲 → <a class="welcome-inline-link" href="mailto:0610raymond@gmail.com">0610raymond@gmail.com</a>',
    wBtnStart: '開始設定',
    wBtnPrev: '上一步',
    wBtnNext: '下一步',
    wBtnDone: '開始使用',
  },
  'zh-CN': {
    filter: '筛选',
    assignment: '作业',
    exam: '考试',
    all: '全部',
    courses: '课程',
    sync: '同步',
    syncing: '同步中...',
    syncFailed: '同步失败',
    tabWeek: '学期待办',
    tabCourses: '课程',
    addAssignment: '+ 新增作业',
    addAssignmentTitle: '新增作业',
    editAssignmentTitle: '编辑作业',
    customDelete: '删除',
    customAssignment: '自定义作业',
    customCourseLabel: '课程',
    customNameLabel: '作业名称',
    customDescriptionLabel: '作业描述',
    customDueLabel: '截止日期',
    customCancel: '取消',
    customSave: '保存',
    customNameRequired: '请输入作业名称',
    confirmDeleteCustom: '确定要删除此自定义作业吗？',
    deleteCustomTitle: '删除自定义作业',
    languageLabel: '语言',
    langZhTw: '繁體中文',
    langZhCn: '简体中文',
    langEn: 'English',
    menuTutorial: '使用教程',
    menuUsageShow: '显示 Popup Claude 用量',
    menuUsageHide: '隐藏 Popup Claude 用量',
    noDueDate: '无截止日期',
    overdueToday: '今天到期',
    overdueDaysLabel: '逾{n}天',
    overdueGroup: '已逾期',
    hiddenItemsToggle: '已隐藏 {n} 项',
    hiddenItemsEmpty: '目前没有隐藏项目（把作业拖到这里可隐藏）',
    dropToShow: '放开以加入作业清单',
    dropToHide: '放开以隐藏',
    today: '今天',
    tomorrow: '明天',
    daysLater: '{n}天后',
    neverSynced: '尚未同步',
    justSynced: '刚才同步',
    minutesAgo: '分钟前同步',
    hoursAgo: '小时前同步',
    daysAgo: '天前同步',
    courseCountSuffix: '门课程',
    noData: '尚无资料',
    noDataHint: '请先前往 Canvas 页面或点击同步',
    noDataHintSync: '请先登录 Canvas 并点击同步',
    noDataMeta: '尚无资料，请先前往 Canvas 页面',
    pendingItems: '件待交',
    completedItems: '件已完成',
    urgentItems: '件紧急',
    back: '返回',
    listAssignment: '作业清单',
    listExam: '考试清单',
    listAll: '项目清单',
    noPendingAssignment: '无待交作业',
    noPendingExam: '无待考考试',
    noPendingAll: '无待办项目',
    noAssignment: '无作业',
    noExam: '无考试',
    noAll: '无项目',
    noGradeInfo: '没有评分信息',
    renameCourse: '重命名',
    weightItemName: '项目名称',
    gradeCalcTitle: '成绩计算器',
    noDesc: '（无描述）',
    submittedBadge: '已交',
    markDone: '标记完成',
    markUndone: '取消完成',
    undoComplete: '撤销',
    within7Days: '7天内',
    within30Days: '8-30天',
    beyond30Days: '30天以上',
    noTasks: '无待办事项',
    weekDoneLabel: '本周完成',
    weekAllDoneLabel: '全部完成',
    editWeight: '编辑',
    weightEditTitle: '编辑评分权重',
    weightReset: '还原 Canvas 权重',
    weightAddItem: '+ 新增项目',
    weightTotal: '总计：',
    unnamedWeight: '未命名',
    submittedBtn: '已提交',
    wTitle1: '欢迎使用 Due',
    wBody1Intro: 'Due，提醒你该做的事 ⚡️',
    wBody1Q1: '「Canvas 很烦，找个作业要翻半天」- 某人',
    wBody1Q2: '「啥？明天要交Lab？」- 另一个人',
    wTitle2: '登录 Canvas（必须）',
    wBody2: 'Due 通过你的 Canvas 登录状态同步数据，无需额外设置或 Token。',
    wStep2Li1: '登录 <a class="welcome-inline-link" id="welcome-canvas-link">Canvas ↗</a>（点一下，同步完成后会自动带你回来）',
    wStep2Li2: 'Due 会<strong>在每次打开 Canvas 时自动更新</strong>你的所有课程和作业',
    wStep2Li3: '点击工具栏图标或进入 Dashboard 即可查看',
    wCanvasSynced: '✓ 已同步，数据已更新',
    wTitle3: '固定 Due 到工具栏',
    wBody3: '固定后点一下图标就能查看 7 天待办',
    wBody3Joke: '（是为了这碟醋包的饺子btw）',
    wStep3Li1: '点击浏览器右上角的<strong>拼图图标</strong>（扩展程序）',
    wStep3Li2: '找到 <strong>Due</strong>，点击旁边的<strong>固定图标</strong>',
    wStep3Li3: '工具栏出现 Due 图标后即完成',
    wTitle4: '拖拽整理作业清单',
    wBody4: 'Due 会自动隐藏考试、签到<br>你也可以自己决定要藏谁、留谁',
    wStep4Li1: '按住作业的 <strong>⠿</strong> 拖到底部「<strong>已隐藏</strong>」区即可隐藏；反之亦然',
    wTitle5: '开始用 Due 吧',
    wBody5: '这几个功能容易错过，记得试试：',
    wFeatCustomName: '自定义作业',
    wFeatCustomDesc: '加入 Canvas 上没有的个人任务',
    wFeatRenameName: '课程改名',
    wFeatRenameDesc: '改成你习惯的叫法',
    wSupport5: '有 bug 或建议？跟我说一声 → <a class="welcome-inline-link" href="mailto:0610raymond@gmail.com">0610raymond@gmail.com</a>',
    wBtnStart: '开始设置',
    wBtnPrev: '上一步',
    wBtnNext: '下一步',
    wBtnDone: '开始使用',
  },
  en: {
    filter: 'Filter',
    assignment: 'Assignments',
    exam: 'Exams',
    all: 'All',
    courses: 'Courses',
    sync: 'Sync',
    syncing: 'Syncing...',
    syncFailed: 'Sync failed',
    tabWeek: 'Upcoming',
    tabCourses: 'Courses',
    addAssignment: '+ Add Assignment',
    addAssignmentTitle: 'Add Assignment',
    editAssignmentTitle: 'Edit Assignment',
    customDelete: 'Delete',
    customAssignment: 'Custom Assignment',
    customCourseLabel: 'Course',
    customNameLabel: 'Assignment Name',
    customDescriptionLabel: 'Description',
    customDueLabel: 'Due Date',
    customCancel: 'Cancel',
    customSave: 'Save',
    customNameRequired: 'Enter an assignment name',
    confirmDeleteCustom: 'Delete this custom assignment?',
    deleteCustomTitle: 'Delete custom assignment',
    languageLabel: 'Language',
    langZhTw: 'Traditional Chinese',
    langZhCn: 'Simplified Chinese',
    langEn: 'English',
    menuTutorial: 'Tutorial',
    menuUsageShow: 'Show Claude usage in popup',
    menuUsageHide: 'Hide Claude usage in popup',
    noDueDate: 'No due date',
    overdueToday: 'due today',
    overdueDaysLabel: '{n}d late',
    overdueGroup: 'Overdue',
    hiddenItemsToggle: '{n} hidden',
    hiddenItemsEmpty: 'Nothing hidden (drag items here to hide)',
    dropToShow: 'Drop to add to list',
    dropToHide: 'Drop to hide',
    today: 'Today',
    tomorrow: 'Tomorrow',
    daysLater: '{n} days left',
    neverSynced: 'Never synced',
    justSynced: 'Just synced',
    minutesAgo: 'min ago',
    hoursAgo: 'hr ago',
    daysAgo: 'd ago',
    courseCountSuffix: 'courses',
    noData: 'No data',
    noDataHint: 'Visit Canvas or click Sync first',
    noDataHintSync: 'Log into Canvas and click Sync',
    noDataMeta: 'No data — visit Canvas first',
    pendingItems: ' pending',
    completedItems: ' done',
    urgentItems: ' urgent',
    back: 'Back',
    listAssignment: 'Assignments',
    listExam: 'Exams',
    listAll: 'All Items',
    noPendingAssignment: 'No pending assignments',
    noPendingExam: 'No upcoming exams',
    noPendingAll: 'No items',
    noAssignment: 'No assignments',
    noExam: 'No exams',
    noAll: 'No items',
    noGradeInfo: 'No grade info',
    renameCourse: 'Rename',
    weightItemName: 'Item name',
    gradeCalcTitle: 'Grade Calculator',
    noDesc: '(No description)',
    submittedBadge: 'Done',
    markDone: 'Mark done',
    markUndone: 'Mark undone',
    undoComplete: 'Undo',
    within7Days: 'Due ≤ 7d',
    within30Days: '8-30 days',
    beyond30Days: 'Later (30d+)',
    noTasks: 'No pending tasks',
    weekDoneLabel: 'Done this week',
    weekAllDoneLabel: 'All done',
    editWeight: 'Edit',
    weightEditTitle: 'Edit Grade Weights',
    weightReset: 'Reset to Canvas weights',
    weightAddItem: '+ Add Item',
    weightTotal: 'Total:',
    unnamedWeight: 'Unnamed',
    submittedBtn: 'Submitted',
    wTitle1: 'Welcome to Due',
    wBody1Intro: 'Due — your assignment tracker ⚡️',
    wBody1Q1: '"Canvas is a mess — finding one assignment takes forever" — someone',
    wBody1Q2: '"Wait, the lab is due tomorrow?" — someone else',
    wTitle2: 'Log in to Canvas (Required)',
    wBody2: 'Due syncs data using your Canvas login session — no extra setup or tokens needed.',
    wStep2Li1: 'Log in to <a class="welcome-inline-link" id="welcome-canvas-link">Canvas ↗</a> (click it — you\'ll be brought back automatically once syncing finishes)',
    wStep2Li2: 'Due <strong>auto-syncs all your courses and assignments</strong> every time you open Canvas',
    wStep2Li3: 'Click the toolbar icon or open Dashboard to view your tasks',
    wCanvasSynced: '✓ Synced — data updated',
    wTitle3: 'Pin Due to Toolbar',
    wBody3: 'Pin it and tap the icon to see your 7-day tasks at a glance',
    wBody3Joke: "(it's for the dumpling dipped in vinegar, btw)",
    wStep3Li1: 'Click the <strong>puzzle icon</strong> (Extensions) in the top-right of your browser',
    wStep3Li2: 'Find <strong>Due</strong> and click the <strong>pin icon</strong> next to it',
    wStep3Li3: 'Done when the Due icon appears in your toolbar',
    wTitle4: 'Organize by dragging',
    wBody4: 'Due auto-hides exams and attendance items<br>but you decide what stays hidden',
    wStep4Li1: 'Grab an assignment\'s <strong>⠿</strong> and drop it into <strong>Hidden</strong> to hide it, or drag it back to restore — it works both ways',
    wTitle5: 'Start using Due',
    wBody5: 'A couple of features worth trying:',
    wFeatCustomName: 'Custom assignments',
    wFeatCustomDesc: 'Add tasks that aren\'t on Canvas',
    wFeatRenameName: 'Rename courses',
    wFeatRenameDesc: 'Give courses names you prefer',
    wSupport5: 'Found a bug or have an idea? Let me know → <a class="welcome-inline-link" href="mailto:0610raymond@gmail.com">0610raymond@gmail.com</a>',
    wBtnStart: 'Get Started',
    wBtnPrev: 'Back',
    wBtnNext: 'Next',
    wBtnDone: 'Start Using Due',
  },
};

function tr(key) {
  return (I18N[_uiLanguage] && I18N[_uiLanguage][key]) || I18N['zh-TW'][key] || key;
}

function applyWelcomeTranslations() {
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = tr(key);
  };
  const setHTML = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = tr(key);
  };
  setText('wstep-1-title', 'wTitle1');
  setText('wstep-1-intro', 'wBody1Intro');
  setText('wstep-1-q1', 'wBody1Q1');
  setText('wstep-1-q2', 'wBody1Q2');
  setText('wstep-2-title', 'wTitle2');
  setText('wstep-2-body', 'wBody2');
  setHTML('wstep-2-li1', 'wStep2Li1');
  setHTML('wstep-2-li2', 'wStep2Li2');
  setText('wstep-2-li3', 'wStep2Li3');
  setText('wstep-3-title', 'wTitle3');
  setText('wstep-3-body', 'wBody3');
  setText('wstep-3-joke', 'wBody3Joke');
  setHTML('wstep-3-li1', 'wStep3Li1');
  setHTML('wstep-3-li2', 'wStep3Li2');
  setText('wstep-3-li3', 'wStep3Li3');
  setText('wstep-4-title', 'wTitle4');
  setHTML('wstep-4-body', 'wBody4');
  setHTML('wstep-4-li1', 'wStep4Li1');
  setText('wstep-5-title', 'wTitle5');
  setText('wstep-5-body', 'wBody5');
  setText('wstep-5-feat1-name', 'wFeatCustomName');
  setText('wstep-5-feat1-desc', 'wFeatCustomDesc');
  setText('wstep-5-feat2-name', 'wFeatRenameName');
  setText('wstep-5-feat2-desc', 'wFeatRenameDesc');
  setHTML('wstep-5-support', 'wSupport5');
  // 「已同步」狀態若已顯示，隨語言切換更新文字
  const syncedEl = document.getElementById('welcome-canvas-synced');
  if (syncedEl && !syncedEl.hidden) syncedEl.textContent = tr('wCanvasSynced');
  document.querySelectorAll('.welcome-lang-switch button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === _uiLanguage);
  });
  _welcomeUpdateButtons(_welcomeStep);
}

function setUILanguage(lang) {
  _uiLanguage = lang;
  chrome.storage.local.set({ uiLanguage: lang });
  applyUILanguage();
  updateClaudeUsageMenuLabel();
  loadData();
}

function applyUILanguage() {
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = tr(key);
  };
  setText('label-courses', 'courses');
  setText('sync-btn', 'sync');
  setText('nav-week-label', 'tabWeek');
  setText('nav-courses-label', 'tabCourses');
  setText('btn-add-assignment', 'addAssignment');
  setText('nav-submitted-label', 'submittedBtn');
  const backLabel = document.querySelector('#detail-back-btn .detail-back-label');
  if (backLabel) backLabel.textContent = tr('back');
  else setText('detail-back-btn', 'back');
  updateSideNav();
  setText('custom-assignment-modal-title', 'addAssignmentTitle');
  setText('custom-assignment-course-label', 'customCourseLabel');
  setText('custom-assignment-name-label', 'customNameLabel');
  setText('custom-assignment-description-label', 'customDescriptionLabel');
  setText('custom-assignment-due-label', 'customDueLabel');
  setText('custom-assignment-cancel', 'customCancel');
  setText('custom-assignment-save', 'customSave');
  setText('weight-edit-title', 'weightEditTitle');
  setText('weight-edit-add', 'weightAddItem');
  setText('weight-edit-save', 'customSave');
  setText('weight-edit-cancel', 'customCancel');
  setText('weight-edit-reset', 'weightReset');
  applyWelcomeTranslations();
  const tutorialBtn = document.getElementById('menu-open-tutorial');
  if (tutorialBtn) tutorialBtn.innerHTML = `${tr('menuTutorial')} <span>↗</span>`;
  const menuLanguageLabel = document.getElementById('menu-language-label');
  if (menuLanguageLabel) {
    menuLanguageLabel.innerHTML = `${tr('languageLabel')}
      <div class="settings-submenu">
        <button id="menu-language-zh-tw">${tr('langZhTw')}</button>
        <button id="menu-language-zh-cn">${tr('langZhCn')}</button>
        <button id="menu-language-en">${tr('langEn')}</button>
      </div>`;
    bindLanguageMenuActions();
  }
  if (typeof DueAiSettings !== 'undefined') DueAiSettings.applyLanguage(_uiLanguage);
}

function bindLanguageMenuActions() {
  const menuLanguageLabel = document.getElementById('menu-language-label');
  const menuLanguageSubmenu = menuLanguageLabel
    ? menuLanguageLabel.querySelector('.settings-submenu')
    : null;
  const menuLanguageZhTw = document.getElementById('menu-language-zh-tw');
  const menuLanguageZhCn = document.getElementById('menu-language-zh-cn');
  const menuLanguageEn = document.getElementById('menu-language-en');
  let closeTimer = null;

  // Move submenu to <body> so position:fixed is in the true root stacking context,
  // unaffected by any ancestor's transform/opacity/will-change stacking context
  if (menuLanguageSubmenu && menuLanguageSubmenu.parentElement !== document.body) {
    document.body.appendChild(menuLanguageSubmenu);
  }

  const openSubmenu = () => {
    if (!menuLanguageLabel || !menuLanguageSubmenu) return;
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    const rect = menuLanguageLabel.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const submenuH = menuLanguageSubmenu.offsetHeight;
    menuLanguageSubmenu.style.top = `${midY - submenuH / 2}px`;
    menuLanguageSubmenu.style.left = `${rect.right + 8}px`;
    menuLanguageSubmenu.classList.add('submenu-visible');
  };

  const closeSubmenuLater = () => {
    if (!menuLanguageSubmenu) return;
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      menuLanguageSubmenu.classList.remove('submenu-visible');
    }, 180);
  };

  const setLang = (lang) => {
    setUILanguage(lang);
    if (settingsMenu) settingsMenu.classList.remove('open');
    if (settingsMenuBtn) settingsMenuBtn.classList.remove('open');
  };

  if (menuLanguageZhTw) menuLanguageZhTw.onclick = () => setLang('zh-TW');
  if (menuLanguageZhCn) menuLanguageZhCn.onclick = () => setLang('zh-CN');
  if (menuLanguageEn) menuLanguageEn.onclick = () => setLang('en');
  if (menuLanguageLabel) {
    menuLanguageLabel.onmouseenter = openSubmenu;
    menuLanguageLabel.onmouseleave = closeSubmenuLater;
  }
  if (menuLanguageSubmenu) {
    menuLanguageSubmenu.onmouseenter = openSubmenu;
    menuLanguageSubmenu.onmouseleave = closeSubmenuLater;
  }
}

// ── 全域資料快取（供事件處理器使用） ──
let _currentData = {};

// ── 截止日期處理 ──
// 緊急度色階統一由 DueTaskRules.urgency 決定（單一真相來源，popup 共用）；
// 逾期在 30 天窗內顯 due-overdue（紅橘），窗外淡化為 due-past（灰）。
function urgencyClass(dueAt, isExamFlag, submitted = false) {
  if (submitted) return 'due-none';
  if (!dueAt) return 'due-none';
  if (isExamFlag) return 'due-exam';
  switch (DueTaskRules.urgency(dueAt)) {
    case 'overdue': return DueTaskRules.isWithinOverdueWindow(dueAt) ? 'due-overdue' : 'due-past';
    case 'urgent': return 'due-urgent';
    case 'soon': return 'due-soon';
    case 'later': return 'due-later';
    default: return 'due-none';
  }
}

function formatDue(dueAt) {
  if (!dueAt) return tr('noDueDate');
  const d = new Date(dueAt);
  const now = new Date();
  const diffMs = d - now;

  const locale = _uiLanguage === 'en' ? 'en-US' : 'zh-TW';
  const dateStr = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  if (diffMs < 0) {
    const n = DueTaskRules.overdueDays(dueAt);
    const label = n === 0 ? tr('overdueToday') : tr('overdueDaysLabel').replace('{n}', n);
    return `${dateStr}（${label}）`;
  }

  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    const roundedHours = Math.floor((diffMs + 1800000) / 3600000);
    const hourLabel = _uiLanguage === 'en' ? `${roundedHours}h left` : `${roundedHours}h後`;
    return `${dateStr}（${hourLabel}）`;
  }

  const dueDayUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDayUtc - nowDayUtc) / 86400000);
  return `${dateStr}（${tr('daysLater').replace('{n}', diffDays)}）`;
}

// 列上的時間標籤：已完成且時間已過 → 什麼都不寫（過去的事無需再標示；已繳交視圖／稽核列適用）
function dueLabelFor(a) {
  if (isDone(a) && a.due_at && new Date(a.due_at).getTime() <= Date.now()) return '';
  return formatDue(a.due_at);
}

function formatLastSync(iso) {
  if (!iso) return tr('neverSynced');
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return tr('justSynced');
  if (m < 60) return `${m} ${tr('minutesAgo')}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${tr('hoursAgo')}`;
  return `${Math.floor(h / 24)} ${tr('daysAgo')}`;
}

// 考試/簽到判定委派 DueTaskRules（單一真相來源，含測試，popup 共用；見 taskRules.js）
function isExam(assignment) {
  return DueTaskRules.isExam(assignment);
}

function isAttendance(assignment) {
  return DueTaskRules.isAttendance(assignment);
}

// 委派 DueCompletion.isSubmitted（單一真相來源，見 completion.js）
function isSubmitted(a) {
  return DueCompletion.isSubmitted(a);
}

// 「外部事實」完成：Canvas 已繳「或」考試已結束（過期考試不可再行動，與已繳歸同桶；2026-07-22 決策）
// 勾選圈路由用它決定翻哪張 map：外部完成 → manualUndone 覆蓋；純手動 → manualDone
function isExternallyDone(a) {
  return DueCompletion.isExternallyDone(a);
}

// 綜合完成判斷：（外部事實完成 且 未標回未完成）「或」手動完成（比照 getCourseName 讀 _currentData）
function isDone(a) {
  return DueCompletion.isDone(a, _currentData.manualDone || {}, _currentData.manualUndone || {});
}

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

let showSubmitted = false;

// ── 完成過渡動畫（碎點爆）狀態 ──
const COMPLETE_DELAY_MS = 1500;       // 勾選後的撤銷窗口（毫秒）
const COMPLETE_BURST_MS = 480;        // 碎點爆淡出後才重繪（略長於 .45s 動畫）
const _completeTimers = {};           // assignmentId -> setTimeout id

// 清掉所有殘留完成計時器（重繪/切頁前呼叫，course detail 與 week 卡共用）
function clearCompleteTimers() {
  Object.keys(_completeTimers).forEach((k) => { clearTimeout(_completeTimers[k]); delete _completeTimers[k]; });
}

// 勾選圈點擊：依「外部事實完成」（已繳或考試已結束）翻轉對應 map（就地寫入 _currentData 與 storage）
//   外部完成 → 翻 manualUndone（標回未完成的覆蓋）；否則 → 翻 manualDone
function toggleCompletion(extDone, id) {
  const mapKey = extDone ? 'manualUndone' : 'manualDone';
  const next = DueCompletion.toggleManualDone(_currentData[mapKey] || {}, id);
  _currentData[mapKey] = next;
  chrome.storage.local.set({ [mapKey]: next });
}

// 撤銷完成：還原到「未完成」（外部完成 → 補回 manualUndone 覆蓋；否則 → 移除 manualDone）
function revertCompletion(extDone, id) {
  if (extDone) {
    const next = DueCompletion.toggleManualDone(_currentData.manualUndone || {}, id, true);
    _currentData.manualUndone = next;
    chrome.storage.local.set({ manualUndone: next });
  } else {
    const next = DueCompletion.toggleManualDone(_currentData.manualDone || {}, id, false);
    _currentData.manualDone = next;
    chrome.storage.local.set({ manualDone: next });
  }
}

// ── View 狀態 ──
let currentView = 'grid';      // 'grid' | 'course'
let currentCourseId = null;
// 側欄雙擊課程名 → 進入重命名（同課 300ms 內連點兩下）：計時狀態放模組層級，第一下重繪換掉按鈕後仍讀得到
const NAV_RENAME_DBLCLICK_MS = 300;
let _navLastRenameId = null;
let _navLastRenameTime = 0;
let currentPage = 'week';      // 'week' | 'courses'
const cardPages = {};           // { [courseId]: pageIndex }
const CARD_PAGE_SIZE = 3;       // 課程卡片每頁作業數（renderCardBottom / updateCardPage 共用）

// ── 瀏覽器上一頁整合（History API）──
// 目標：開課程詳情後，用系統慣用的返回（Back 手勢／按鈕／Cmd+[）就能退回清單。
// 模型：清單（週待辦／課程 grid，含「已繳交」過濾）永遠是同一個 history entry（橫向切換用
//       replaceState 更新它、不疊返回步）；開課程詳情才 pushState 疊一步，Back → popstate → 退回清單。
let _historyReady = false;      // 首次 render 前不動 history
let _suppressHistory = false;   // popstate 驅動的重繪期間，不要再寫 history
function _appLocation() {
  return { app: 'due', page: currentPage, showSubmitted, view: currentView, courseId: currentCourseId };
}
function syncHistory() {         // 橫向移動：更新目前 entry（不增加返回步）
  if (!_historyReady || _suppressHistory) return;
  history.replaceState(_appLocation(), '');
}

function currentItemLabel() {
  return tr('assignment');
}

function currentListLabel() { return tr('listAssignment'); }
function cardEmptyLabel() { return tr('noPendingAssignment'); }
function noItemsLabel() { return tr('noAssignment'); }

// ── 套用篩選到作業列表 ──
// 考試/簽到＝可被自動隱藏的類別
function isHideable(a) {
  return isExam(a) || isAttendance(a);
}

// 使用者是否手動把此隱藏項「升級」為正常作業（拖曳升級，見 spec 2026-07-22）
function isManuallyShown(a) {
  return !!(_currentData.manualShown || {})[String(a && a.id)];
}

// 寫入升級/降級：val=true 升級（視同一般作業）、false 降級（回自動隱藏）；就地更新 + storage + 重繪詳情/側欄
function setManualShown(id, val) {
  const key = String(id);
  const next = { ...(_currentData.manualShown || {}) };
  if (val) next[key] = true; else delete next[key];
  _currentData.manualShown = next;
  chrome.storage.local.set({ manualShown: next });
  rerenderDetailAndNav(currentCourseId);
}

// 使用者是否手動把「一般作業」收進稽核區（拖曳隱藏，見 spec 2026-07-22 drag-hide-all）
function isManuallyHidden(a) {
  return !!(_currentData.manualHidden || {})[String(a && a.id)];
}

// 寫入手動隱藏（一般作業）：val=true 隱藏、false 顯示；就地更新 + storage + 重繪
function setManualHidden(id, val) {
  const key = String(id);
  const next = { ...(_currentData.manualHidden || {}) };
  if (val) next[key] = true; else delete next[key];
  _currentData.manualHidden = next;
  chrome.storage.local.set({ manualHidden: next });
  rerenderDetailAndNav(currentCourseId);
}

// 是否被收進稽核區（不在主清單）：考試/簽到預設隱藏（除非升級）；一般作業預設顯示（除非手動隱藏）
function isHidden(a) {
  return isHideable(a) ? !isManuallyShown(a) : isManuallyHidden(a);
}

// 是否為進度環分母的「近期作業」：7 天內到期，或在 30 天逾期窗內的逾期作業
// （與 renderWeekSection 的 isNear 邏輯相同，抽出供週卡完成 handler 共用判斷「是否全部完成」）
function isNearAssignment(a) {
  const u = DueTaskRules.urgency(a.due_at);
  return u === 'urgent' || (u === 'overdue' && DueTaskRules.isWithinOverdueWindow(a.due_at));
}

// 算出「本週概覽」進度環的分子/分母：所有課程作業中，未隱藏的近期作業，及其中已完成數
function computeNearProgress(courses, assignments) {
  const items = [];
  for (const course of courses) {
    for (const a of (assignments[course.id] || [])) items.push(a);
  }
  const nearItems = items.filter((a) => !isHidden(a) && isNearAssignment(a));
  const nearTotal = nearItems.length;
  const nearDone = nearItems.filter((a) => isDone(a)).length;
  return { nearDone, nearTotal };
}

// 拖曳落點統一寫入：makeHidden=true 收進稽核區、false 拉回清單（依類型寫 manualShown/manualHidden）
function setItemHiddenByDrag(id, makeHidden) {
  const a = ((_currentData.assignments || {})[currentCourseId] || []).find((x) => String(x.id) === String(id));
  if (a && isHideable(a)) setManualShown(id, !makeHidden);
  else setManualHidden(id, makeHidden);
}

function applyFilters(asgns) {
  // 排除「被收進稽核區」者（未升級的考試/簽到 ∪ 手動隱藏的一般作業）
  let result = asgns.filter((a) => !isHidden(a));

  // 默認隱藏已完成（含手動）；勾選「查看已繳交」後改為只顯示已完成
  if (showSubmitted) {
    result = result.filter((a) => isDone(a));
  } else {
    result = result.filter((a) => !isDone(a));
  }

  return result;
}

// ── 課程顯示名稱（支援自訂） ──
function getCourseName(course) {
  if (!course) return '';
  const custom = (_currentData.courseNames || {})[course.id];
  return custom || course.name || '';
}

// 模組級狀態：null = 新增模式；非 null = 正在編輯的既有自訂作業（帶原 id / created_at / course_id）
let _editingCustom = null;

function openCustomAssignmentModal(defaultCourseId = currentCourseId, editing = null) {
  const courses = _currentData.courses || [];
  if (!courses.length) return;

  const overlay = document.getElementById('custom-assignment-overlay');
  const form = document.getElementById('custom-assignment-form');
  const courseSelect = document.getElementById('custom-assignment-course');
  const nameInput = document.getElementById('custom-assignment-name');
  const descInput = document.getElementById('custom-assignment-description');
  const dueInput = document.getElementById('custom-assignment-due');
  const errorEl = document.getElementById('custom-assignment-error');
  const titleEl = document.getElementById('custom-assignment-modal-title');
  if (!overlay || !form || !courseSelect || !nameInput || !descInput || !dueInput) return;

  _editingCustom = editing;

  courseSelect.innerHTML = courses.map((course) => `
    <option value="${course.id}">${esc(getCourseName(course))}</option>
  `).join('');

  form.reset();
  if (editing) {
    // 編輯模式：預填課程／名稱／描述／截止；標題改為「編輯作業」
    if (titleEl) titleEl.textContent = tr('editAssignmentTitle');
    const editCourseId = editing.course_id != null ? editing.course_id : defaultCourseId;
    if (editCourseId != null && courses.some((c) => String(c.id) === String(editCourseId))) {
      courseSelect.value = String(editCourseId);
    }
    nameInput.value = editing.name || '';
    descInput.value = editing.description || '';
    dueInput.value = editing.due_at
      ? DueCustomAssignments.toDatetimeLocalValue(new Date(editing.due_at))
      : '';
  } else {
    // 新增模式：標題「新增作業」，截止預設 7 天後 23:59
    if (titleEl) titleEl.textContent = tr('addAssignmentTitle');
    if (defaultCourseId && courses.some((course) => String(course.id) === String(defaultCourseId))) {
      courseSelect.value = String(defaultCourseId);
    }
    dueInput.value = DueCustomAssignments.getDefaultDueLocalValue();
  }
  if (errorEl) errorEl.textContent = '';
  overlay.classList.add('open');
  requestAnimationFrame(() => nameInput.focus());
}

function closeCustomAssignmentModal() {
  const overlay = document.getElementById('custom-assignment-overlay');
  if (overlay) overlay.classList.remove('open');
  _editingCustom = null;   // 關閉/取消一律清掉編輯狀態
}

function saveCustomAssignmentFromForm(e) {
  e.preventDefault();
  const courseSelect = document.getElementById('custom-assignment-course');
  const nameInput = document.getElementById('custom-assignment-name');
  const descInput = document.getElementById('custom-assignment-description');
  const dueInput = document.getElementById('custom-assignment-due');
  const errorEl = document.getElementById('custom-assignment-error');

  const input = {
    courseId: courseSelect.value,
    name: nameInput.value,
    description: descInput.value,
    dueLocalValue: dueInput.value,
  };

  try {
    if (_editingCustom) {
      // ── 編輯：更新既有筆（保留 id / created_at）；若改了課程要跨陣列搬移 ──
      const oldKey = String(_editingCustom.course_id);
      const updated = DueCustomAssignments.updateCustomAssignment(_editingCustom, input);
      const newKey = String(updated.course_id);
      chrome.storage.local.get(['customAssignments'], (data) => {
        const customAssignments = data.customAssignments || {};
        if (oldKey === newKey) {
          // 同課程：就地取代（保留原順序）；找不到就補到最前
          const list = customAssignments[newKey] || [];
          const idx = list.findIndex((a) => String(a.id) === String(updated.id));
          if (idx >= 0) list[idx] = updated;
          else list.unshift(updated);
          customAssignments[newKey] = list;
        } else {
          // 換課程：從舊 course_id 陣列移除、加到新 course_id 陣列
          customAssignments[oldKey] = (customAssignments[oldKey] || [])
            .filter((a) => String(a.id) !== String(updated.id));
          if (!customAssignments[oldKey].length) delete customAssignments[oldKey];
          customAssignments[newKey] = [updated, ...(customAssignments[newKey] || [])];
        }
        chrome.storage.local.set({ customAssignments }, () => {
          closeCustomAssignmentModal();
          loadData();
        });
      });
    } else {
      // ── 新增：建立新筆並置於該課程陣列最前 ──
      const assignment = DueCustomAssignments.createCustomAssignment(input);
      const key = String(assignment.course_id);
      chrome.storage.local.get(['customAssignments'], (data) => {
        const customAssignments = data.customAssignments || {};
        customAssignments[key] = [assignment, ...(customAssignments[key] || [])];
        chrome.storage.local.set({ customAssignments }, () => {
          closeCustomAssignmentModal();
          loadData();
        });
      });
    }
  } catch (err) {
    if (errorEl) errorEl.textContent = tr('customNameRequired');
  }
}

function deleteCustomAssignment(courseId, assignmentId) {
  // 以自製確認對話框取代原生 window.confirm 對話框（見 openConfirmDialog）
  openConfirmDialog({
    title: tr('deleteCustomTitle'),
    message: tr('confirmDeleteCustom'),
    confirmLabel: tr('customDelete'),
    onConfirm: () => {
      chrome.storage.local.get(['customAssignments'], (data) => {
        const customAssignments = data.customAssignments || {};
        const key = String(courseId);
        customAssignments[key] = (customAssignments[key] || [])
          .filter((assignment) => String(assignment.id) !== String(assignmentId));
        if (!customAssignments[key].length) delete customAssignments[key];
        chrome.storage.local.set({ customAssignments }, loadData);
      });
    },
  });
}

// ── 自製確認對話框（取代 window.confirm；焦點 trap 與 Esc/背景關閉見 setupModalA11y / Esc handler）──
let _confirmOnOk = null;

function openConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm } = {}) {
  const overlay = document.getElementById('confirm-overlay');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');
  if (!overlay || !okBtn || !cancelBtn) return;
  if (titleEl) titleEl.textContent = title || '';
  if (msgEl) msgEl.textContent = message || '';
  okBtn.textContent = confirmLabel || tr('customSave');
  cancelBtn.textContent = cancelLabel || tr('customCancel');
  _confirmOnOk = typeof onConfirm === 'function' ? onConfirm : null;
  overlay.classList.add('open');
}

function closeConfirmDialog() {
  const overlay = document.getElementById('confirm-overlay');
  if (overlay) overlay.classList.remove('open');
  _confirmOnOk = null;
}

function fitMetaText() {
  const el = document.getElementById('header-meta');
  if (!el) return;
  let size = 13;
  el.style.fontSize = size + 'px';
  while (el.scrollWidth > el.clientWidth && size > 8) {
    size -= 0.5;
    el.style.fontSize = size + 'px';
  }
}

// 課程詳情左欄評分圖例：固定寬度下字體自動縮小以放下（13→11px 保 a11y 地板），
// 縮到 11px 仍溢出則交給 CSS 的 text-overflow: ellipsis。
function fitLegendText(root) {
  (root || document).querySelectorAll('.detail-pie-legend-text').forEach((el) => {
    let size = 13;
    el.style.fontSize = size + 'px';
    while (el.scrollWidth > el.clientWidth && size > 11) {
      size -= 0.5;
      el.style.fontSize = size + 'px';
    }
  });
}

// ── 同步 skeleton（首次同步的載入佔位，見 spec 2026-07-23-sync-skeleton）──
// 只在「無資料＋點同步」時渲染；成功後 loadData 原位替換成真卡片、失敗由 loadData 還原空狀態
function renderSyncSkeleton() {
  document.getElementById('header-meta').textContent = tr('syncing');
  fitMetaText();

  // 側欄：4 列課名佔位（寬度略變化，避免整齊到假）
  document.getElementById('course-nav').innerHTML = [72, 58, 80, 64]
    .map((w) => `<div class="skel-nav-row" aria-hidden="true"><span class="skel" style="width:${w}%"></span></div>`)
    .join('');

  // 主區：6 張課程卡佔位（對齊 .course-card-grid 結構：code 短條、name 長條、2–3 列作業條）
  const card = (nameW, rows) => `
    <div class="course-card-grid skel-card" aria-hidden="true">
      <div class="card-top">
        <span class="skel skel-code"></span>
        <span class="skel skel-name" style="width:${nameW}%"></span>
      </div>
      <div class="card-bottom">
        ${Array.from({ length: rows }, (_, i) => `<span class="skel skel-row" style="width:${88 - i * 14}%"></span>`).join('')}
      </div>
    </div>`;
  const main = document.getElementById('main-section');
  main.innerHTML = `<div class="courses-grid">${[[76, 3], [58, 2], [84, 3], [66, 2], [72, 3], [60, 2]]
    .map(([w, r]) => card(w, r)).join('')}</div>`;
  main.dataset.skeleton = '1';   // render() 據此在真資料到位時做一次性淡入
}

// ── 主要渲染 ──
function render(data) {
  // skeleton → 真資料的一次性淡入（同步完成、真課程原位出現的瞬間）
  const _mainEl = document.getElementById('main-section');
  if (_mainEl.dataset.skeleton) {
    delete _mainEl.dataset.skeleton;
    _mainEl.classList.add('arrive');
    setTimeout(() => _mainEl.classList.remove('arrive'), 400);
  }

  const canvasAssignments = data.assignments || {};
  const customAssignments = data.customAssignments || {};
  const mergedAssignments = DueCustomAssignments.mergeAssignmentMaps(canvasAssignments, customAssignments);
  _currentData = {
    ...data,
    canvasAssignments,
    customAssignments: DueCustomAssignments.normalizeCustomAssignmentMap(customAssignments),
    assignments: mergedAssignments,
  };
  const { lastSync, schoolName = 'Canvas', courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;

  document.getElementById('header-meta').textContent =
    `${schoolName} · ${formatLastSync(lastSync)}`;
  fitMetaText();

  renderNav(courses, assignments);
  updateSideNav();

  if (currentView === 'course') {
    document.getElementById('page-tabs').style.display = '';
    document.getElementById('page-tabs').classList.add('detail-mode');
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
    document.getElementById('page-tabs').classList.remove('detail-mode');
    document.getElementById('main-section').style.display = '';
    document.getElementById('course-detail-container').style.display = 'none';
    // 「已繳交」一律用各課程 grid 版面（不套用週待辦的圓餅圖版面）
    if (currentPage === 'week' && !showSubmitted) {
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
    const filtered = applyFilters(asgns);
    const pendingCount = filtered.length;
    const urgentCount = filtered.filter((a) => {
      if (!a.due_at || isDone(a)) return false;
      const diff = new Date(a.due_at) - Date.now();
      return diff > 0 && diff <= 7 * 86400000;
    }).length;

    const hasBadge = pendingCount > 0;
    const badgeClass = hasBadge
      ? (urgentCount ? 'nav-course-badge urgent' : 'nav-course-badge')
      : 'nav-course-badge is-placeholder';
    const badgeText = hasBadge ? pendingCount : '0';

    const isActive = currentView === 'course' && currentCourseId === c.id;
    return `
      <button class="nav-course-item${isActive ? ' active' : ''}" data-target-course="${c.id}">
        <span class="nav-course-name">${esc(getCourseName(c))}</span>
        <span class="${badgeClass}">${badgeText}</span>
      </button>`;
  }).join('');

  // Bind nav clicks → 單擊即時開詳情；同課 300ms 內雙擊 → 就地在側欄行內重命名（左側編輯）
  navEl.querySelectorAll('.nav-course-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.targetCourse, 10);
      const now = Date.now();
      const isDouble = id === _navLastRenameId && (now - _navLastRenameTime) < NAV_RENAME_DBLCLICK_MS;
      _navLastRenameId = id;
      _navLastRenameTime = now;
      if (isDouble) {
        // 雙擊：就地在側欄把課名換成輸入框編輯（編輯在左側，不跑到右側詳情）；
        // 三連點時該側欄項已被 input 取代，startSidebarRename 找不到目標而 early-return，保留進行中的編輯
        startSidebarRename(id);
      } else {
        showCourseDetail(id);   // 單擊：維持即時開啟
      }
    });
  });
}

// ── 側欄主導航（active 狀態、數量、頁面標題） ──
function updateSideNav() {
  const navWeek = document.getElementById('nav-week');
  if (!navWeek) return;
  const navCourses = document.getElementById('nav-courses');
  const navSubmitted = document.getElementById('nav-submitted');

  const inCourse = currentView === 'course';
  navWeek.classList.toggle('active', !inCourse && !showSubmitted && currentPage === 'week');
  navCourses.classList.toggle('active', !inCourse && !showSubmitted && currentPage === 'courses');
  navSubmitted.classList.toggle('active', showSubmitted);

  // 數量：學期待辦＝未完成的待辦（無截止＋未來三組＋窗內逾期）；已繳交＝已完成作業；課程＝課程數
  const { courses = [], assignments = {} } = _currentData;
  let weekCount = 0;
  let doneCount = 0;
  for (const c of courses) {
    for (const a of (assignments[c.id] || [])) {
      if (isHidden(a)) continue;  // 被收進稽核區者（未升級考試/簽到 ∪ 手動隱藏作業）不計數
      if (isDone(a)) { doneCount++; continue; }
      // 與週待辦列表一致：無截止 ＋ 未來三組（urgent/soon/later）＋ 30 天窗內逾期；窗外逾期不計
      const u = DueTaskRules.urgency(a.due_at);
      if (u === 'overdue') {
        if (DueTaskRules.isWithinOverdueWindow(a.due_at)) weekCount++;
      } else {
        weekCount++;  // 'none'（無截止）／urgent／soon／later 皆計入
      }
    }
  }
  const setCount = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = n > 0 ? n : '';
  };
  setCount('nav-week-count', weekCount);
  setCount('nav-courses-count', courses.length);
  setCount('nav-submitted-count', doneCount);

  // 頁面標題（詳情模式下由 CSS 隱藏）
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    const key = showSubmitted ? 'submittedBtn' : (currentPage === 'week' ? 'tabWeek' : 'tabCourses');
    titleEl.textContent = tr(key);
  }
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
  updateSideNav();
  syncHistory();   // 週待辦↔課程 為橫向切換：更新目前 entry，不疊返回步

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
// 進度環分子上次渲染值：分子有變才給數字 tick 動畫（首次渲染不 tick）
let _prevRingDone = null;

// 進度環 SVG 幾何：158 外徑、20 線寬 → 半徑 69，全周長 2πr
const RING_R = 69;
const RING_C = 2 * Math.PI * RING_R;

// ── 進度環「落點迸發」慶祝（見 spec 2026-07-23 後記）──
// 只在勾完最後一項近期作業、弧合攏落地的瞬間觸發（renderWeekSection 的 celebrateNow）；
// 之後維持全部完成狀態的重繪只靜態顯示「全部完成」，不重播。
// 內容：環微彈＋分子 pop、多色碎點沿圓周外迸（切線初速＝旋轉能量）、中心淡入「全部完成」
function celebrateRingArrival(ring) {
  if (!ring || !ring.isConnected) return;   // 等待落地期間被重繪換掉 → 略過
  const spring = 'cubic-bezier(0.34, 1.3, 0.5, 1)';
  ring.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.04)', offset: 0.38 }, { transform: 'scale(1)' }],
    { duration: 320, easing: spring });
  const fracB = ring.querySelector('.wk-ring-frac b');
  if (fracB) {
    fracB.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.16)', offset: 0.4 }, { transform: 'scale(1)' }],
      { duration: 320, easing: spring });
  }
  const cap = ring.querySelector('.wk-ring-cap');
  if (cap) {
    cap.textContent = tr('weekAllDoneLabel');
    cap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });
  }
  // 放大多色版碎點爆：16 顆沿圓周迸開，橘/藍/綠/暖黃輪替
  const colors = ['--orange', '--blue', '--green', '--warm'];
  for (let i = 0; i < 16; i++) {
    const th = (Math.PI * 2 * i) / 16 - Math.PI / 2 + ((i % 3) - 1) * 0.07;
    const p = document.createElement('span');
    p.className = 'wk-celebrate-dot';
    p.style.background = `var(${colors[i % 4]})`;
    p.style.left = `${79 + RING_R * Math.cos(th)}px`;
    p.style.top = `${79 + RING_R * Math.sin(th)}px`;
    ring.appendChild(p);
    const dist = 30 + ((i * 11) % 22);                              // 30–52px
    const dx = Math.cos(th) * dist + Math.cos(th + Math.PI / 2) * dist * 0.85;
    const dy = Math.sin(th) * dist + Math.sin(th + Math.PI / 2) * dist * 0.85;
    p.animate(
      [
        { transform: 'translate(-50%, -50%) translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0 },
      ],
      { duration: 650 + ((i * 13) % 140), delay: (i * 7) % 60,
        easing: 'cubic-bezier(0.2, 0.55, 0.3, 1)', fill: 'forwards' }
    ).onfinish = () => p.remove();
  }
}

function renderWeekSection(courses, assignments, celebrate = false) {
  const el = document.getElementById('main-section');
  // 重繪前清掉殘留的完成計時器（切頁/重繪時避免週卡幽靈 callback）
  clearCompleteTimers();

  // 收集所有作業（含逾期、含無截止日期）；applyFilters 已排除考試/簽到/已完成
  const items = [];
  for (const course of courses) {
    const asgns = assignments[course.id] || [];
    for (const a of asgns) {
      items.push({ ...a, _course: course });
    }
  }
  const filtered = applyFilters(items);

  // 依統一緊急度分組（單一真相來源 DueTaskRules.urgency）
  const overdue = [];  // 逾期（僅 30 天窗內；窗外不進待辦，僅課程詳情可見）
  const urgent = [];   // 7 天內
  const soon = [];     // 8-30 天
  const later = [];    // 30 天以上
  const noDue = [];    // 無截止日期（due_at 為 null 或無效日期 → urgency 'none'）
  for (const a of filtered) {
    switch (DueTaskRules.urgency(a.due_at)) {
      case 'overdue':
        if (DueTaskRules.isWithinOverdueWindow(a.due_at)) overdue.push(a);
        break;
      case 'urgent': urgent.push(a); break;
      case 'soon': soon.push(a); break;
      case 'later': later.push(a); break;
      default: noDue.push(a); break; // 'none' → 無截止日期組（置底）
    }
  }
  // 逾期組：最近錯過的在最上（due_at 降冪）；未來三組：due_at 升冪
  overdue.sort((a, b) => new Date(b.due_at) - new Date(a.due_at));
  const byDueAsc = (a, b) => new Date(a.due_at) - new Date(b.due_at);
  urgent.sort(byDueAsc); soon.sort(byDueAsc); later.sort(byDueAsc);
  // 無截止組：無日期可排，依課程名→作業名穩定排序
  noDue.sort((a, b) =>
    getCourseName(a._course).localeCompare(getCourseName(b._course)) ||
    String(a.name).localeCompare(String(b.name)));

  // 「本週概覽」進度環：範圍＝逾期窗 ∪ 未來 7 天（近期可行動集），現算完成/總數（含已完成項）
  const { nearDone, nearTotal } = computeNearProgress(courses, assignments);
  const donePct = nearTotal > 0 ? (nearDone / nearTotal) * 100 : 0;
  const targetOffset = RING_C * (1 - donePct / 100);
  // 讀取畫面上舊弧的目前 offset 當動畫起點（可正確接續被打斷的動畫）；無舊節點（首次掛載）直接用目標值不做動畫
  const _prevBar = document.querySelector('.wk-ring-bar');
  const _prevParsed = _prevBar ? parseFloat(getComputedStyle(_prevBar).strokeDashoffset) : NaN;
  const prevOffset = Number.isFinite(_prevParsed) ? _prevParsed : targetOffset;
  const ringAria = `${tr('weekDoneLabel')} ${nearDone}/${nearTotal}`;
  // 分子變動時給數字一個微上滑 tick（與弧的過渡同曲線）；首次渲染不 tick
  const fracTick = _prevRingDone !== null && _prevRingDone !== nearDone;
  _prevRingDone = nearDone;
  // 全部完成狀態與慶祝旗標：celebrate 由「勾完最後一項近期作業」的鏈路傳入，render 端即時核對
  const allNearDone = nearTotal > 0 && nearDone === nearTotal;
  const celebrateNow = celebrate && allNearDone;
  // 慶祝時中心先維持「本週完成」、落地瞬間才換字淡入；非慶祝的全部完成重繪直接靜態顯示「全部完成」
  const capText = (allNearDone && !celebrateNow) ? tr('weekAllDoneLabel') : tr('weekDoneLabel');

  // 分級摘要列（只顯示 count>0；逾期紅色，點擊跳到右側對應區塊）
  const sumRows = [
    { key: 'overdue', cls: 'is-overdue', label: tr('overdueGroup'), n: overdue.length },
    { key: 'urgent', cls: 'is-urgent', label: tr('within7Days'), n: urgent.length },
    { key: 'soon', cls: 'is-soon', label: tr('within30Days'), n: soon.length },
    { key: 'later', cls: 'is-later', label: tr('beyond30Days'), n: later.length },
    { key: 'nodue', cls: 'is-nodue', label: tr('noDueDate'), n: noDue.length },
  ].filter((r) => r.n > 0)
    .map((r) => `<button class="wk-sum-row ${r.cls}" data-scroll-group="${r.key}"><span class="wk-sum-num">${r.n}</span><span class="wk-sum-label">${esc(r.label)}</span></button>`)
    .join('');

  // 單張週卡片（含右上角完成勾選圈；勾選圈狀態沿用 .assignment-check 語言）
  const renderWeekCard = (a) => {
    const uClass = urgencyClass(a.due_at, isExam(a)); // 已濾除考試 → 走 overdue/urgent/soon/later 色
    const extDone = isExternallyDone(a);               // 勾選路由：外部完成翻 manualUndone、否則翻 manualDone
    const done = isDone(a);                            // 週視圖恆為 false，仍寫入以保勾選圈狀態一致
    const checkLabel = done ? tr('markUndone') : tr('markDone');
    return `
      <div class="week-task-card" role="button" tabindex="0" aria-label="${esc(getCourseName(a._course) + ' · ' + a.name)}" data-course-id="${a._course.id}" data-assignment-id="${esc(String(a.id))}">
        <button class="assignment-check week-task-check" data-assignment-id="${esc(String(a.id))}" data-course-id="${a._course.id}" data-done="${done ? 'true' : 'false'}" data-ext-done="${extDone ? 'true' : 'false'}" aria-label="${esc(checkLabel)}"></button>
        <div class="week-task-course">${esc(getCourseName(a._course))}</div>
        <div class="week-task-title">${esc(a.name)}</div>
        <div class="week-task-due ${uClass}">${formatDue(a.due_at)}</div>
      </div>`;
  };

  const renderGroup = (title, list, colorClass, groupKey) => {
    if (list.length === 0) return '';
    return `
      <div class="week-group" data-group="${groupKey}">
        <div class="week-group-title ${colorClass}">${title} (${list.length})</div>
        <div class="week-task-grid">
          ${list.map(renderWeekCard).join('')}
        </div>
      </div>`;
  };

  // 逾期組置頂；分隔線只夾在相鄰的非空組之間
  const groupsHTML = [
    renderGroup(tr('overdueGroup'), overdue, 'color-overdue', 'overdue'),
    renderGroup(tr('within7Days'), urgent, 'color-urgent', 'urgent'),
    renderGroup(tr('within30Days'), soon, 'color-soon', 'soon'),
    renderGroup(tr('beyond30Days'), later, 'color-later', 'later'),
    renderGroup(tr('noDueDate'), noDue, 'color-nodue', 'nodue'),
  ].filter(h => h).join('<div class="week-divider"></div>');

  el.innerHTML = `
    <div class="week-panel">
      <div class="week-content">
        <div class="week-left">
          <div class="wk-ring-wrap">
            <div class="wk-ring" role="img" aria-label="${esc(ringAria)}">
              <svg class="wk-ring-svg" viewBox="0 0 158 158" aria-hidden="true">
                <circle class="wk-ring-track" cx="79" cy="79" r="${RING_R}"></circle>
                <circle class="wk-ring-bar" cx="79" cy="79" r="${RING_R}" stroke-dasharray="${RING_C}" stroke-dashoffset="${prevOffset}"></circle>
              </svg>
              <div class="wk-ring-center">
                <div class="wk-ring-frac"><b${fracTick ? ' class="tick"' : ''}>${nearDone}</b>/${nearTotal}</div>
                <div class="wk-ring-cap">${capText}</div>
              </div>
            </div>
          </div>
          ${sumRows ? `<div class="wk-breakdown">${sumRows}</div>` : ''}
        </div>
        <div class="week-right">
          ${groupsHTML || `<div class="week-group-empty">${tr('noTasks')}</div>`}
        </div>
      </div>
    </div>`;

  // 觸發弧的過渡：強制 reflow 讓瀏覽器先提交 prevOffset 起點，再同步設目標值
  // （不用 rAF——分頁隱藏時 rAF 被暫停，寫入永遠不會發生，弧會卡在舊值；同步寫保證最終值一定落地）
  const _barEl = el.querySelector('.wk-ring-bar');
  if (_barEl) {
    _barEl.getBoundingClientRect();   // forced reflow：提交起點樣式
    _barEl.style.strokeDashoffset = `${targetOffset}`;
  }

  // 慶祝：等弧合攏「落地」的 transitionend 才引爆；弧已在終點（無過渡可等）則直接引爆
  if (celebrateNow && _barEl) {
    const _ringEl = el.querySelector('.wk-ring');
    if (Math.abs(prevOffset - targetOffset) < 0.5) {
      celebrateRingArrival(_ringEl);
    } else {
      _barEl.addEventListener('transitionend', function h(e) {
        if (e.propertyName !== 'stroke-dashoffset') return;
        _barEl.removeEventListener('transitionend', h);
        celebrateRingArrival(_ringEl);
      });
    }
  }

  // 勾選圈：依 Canvas 事實翻轉，未完成→完成走 1.5 秒撤銷窗口動畫（stopPropagation 不開詳情）
  el.querySelectorAll('.week-task-check').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.week-task-card');
      const id = String(btn.dataset.assignmentId);
      const cid = parseInt(btn.dataset.courseId, 10);
      if (card && card.classList.contains('bursting')) return;        // 爆開中不互動
      if (card && card.classList.contains('completing')) {            // 撤銷窗口內 → 取消
        cancelCompleteWeek(card, id, cid);
        return;
      }
      toggleCompletion(btn.dataset.extDone === 'true', id);
      const a = ((_currentData.assignments || {})[cid] || []).find((x) => String(x.id) === id);
      const nowDone = a ? isDone(a) : false;
      if (nowDone && card) {
        const { nearDone: _nd, nearTotal: _nt } = computeNearProgress(_currentData.courses || [], _currentData.assignments || {});
        const celebrate = _nt > 0 && _nd === _nt;   // 這次勾選讓近期作業全部完成 → 落地時引爆慶祝
        beginCompleteWeek(card, id, cid, celebrate);
      } else {
        rerenderWeekAndNav();
      }
    });
  });

  el.querySelectorAll('.week-task-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('bursting')) return;                // 爆開中不互動
      if (card.classList.contains('completing')) {                    // 撤銷窗口內 → 點卡片任意處取消
        const chk = card.querySelector('.assignment-check');
        if (chk) cancelCompleteWeek(card, String(chk.dataset.assignmentId), parseInt(chk.dataset.courseId, 10));
        return;
      }
      const courseId = parseInt(card.dataset.courseId, 10);
      if (!Number.isNaN(courseId)) {
        showCourseDetail(courseId, card);
      }
    });
    // 鍵盤：Enter / Space 等同點擊（Space preventDefault 阻止捲動）；焦點在內部勾選圈時不攔截
    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // 左欄分級摘要 → 捲動右側清單到對應區塊（原生 button，Enter/Space 自動觸發 click）
  // 手動算相對位移，避免 scrollIntoView 在巢狀 overflow 結構下不作用
  el.querySelectorAll('.wk-sum-row').forEach((row) => {
    row.addEventListener('click', () => {
      const target = el.querySelector(`.week-group[data-group="${row.dataset.scrollGroup}"]`);
      const right = el.querySelector('.week-right');
      if (!target || !right) return;
      const delta = target.getBoundingClientRect().top - right.getBoundingClientRect().top + right.scrollTop;
      right.scrollTo({ top: delta, behavior: 'smooth' });
    });
  });
}

// ── 卡片格 ──
function renderCardGrid(courses, assignments, assignmentGroups) {
  const el = document.getElementById('main-section');
  // 切到卡片格前清掉殘留的週卡完成計時器，避免幽靈 callback 重繪週待辦
  clearCompleteTimers();

  if (!courses.length) {
    el.innerHTML = `
      <div class="state-msg">
        <div class="big">${tr('noData')}</div>
        <div class="small">${tr('noDataHint')}</div>
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
    // 鍵盤：Enter / Space 等同點擊（Space preventDefault 阻止捲動）；焦點在分頁鈕時不攔截
    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        card.click();
      }
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

  // 緊急＝7 天內到期「且未完成」——已完成（含已繳交視圖）不算緊急
  const urgentCount = filtered.filter((a) => {
    if (!a.due_at || isDone(a)) return false;
    const diff = new Date(a.due_at) - Date.now();
    return diff > 0 && diff <= 7 * 86400000;
  }).length;

  const pendingCount = filtered.length;
  const metaParts = [];
  if (pendingCount) metaParts.push(`${pendingCount}${tr(showSubmitted ? 'completedItems' : 'pendingItems')}`);

  const pageIdx = cardPages[course.id] || 0;
  const bottomHtml = renderCardBottom(course.id, filtered, pageIdx);

  return `
    <div class="course-card-grid" role="button" tabindex="0" aria-label="${esc(getCourseName(course))}" data-course-id="${course.id}">
      <div class="card-top" data-course-id="${course.id}">
        <div class="card-top-row">
          <div class="card-code">${esc(course.course_code || '')}</div>
          ${urgentCount ? `<div class="card-badge-urgent">${urgentCount}${tr('urgentItems')}</div>` : ''}
        </div>
        <div class="card-name">${esc(getCourseName(course))}</div>
        ${metaParts.length ? `<div class="card-meta">${metaParts.join(' · ')}</div>` : ''}
      </div>
      ${bottomHtml}
    </div>`;
}

// ── 卡片下半部分（作業列表 + 分頁） ──
function renderCardBottom(courseId, sorted, pageIdx) {
  const pageSize = CARD_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(pageIdx, totalPages - 1);
  const visible = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const rows = visible.length
    ? visible.map((a) => {
        const uClass = urgencyClass(a.due_at, isExam(a), isDone(a));
        return `
          <div class="card-row">
            <div class="card-row-title">${esc(a.name)}</div>
            <div class="card-row-due ${uClass}">${dueLabelFor(a)}</div>
          </div>`;
      }).join('')
    : `<div class="card-empty">${cardEmptyLabel()}</div>`;

  const pager = totalPages > 1 ? `
    <div class="card-pager">
      <button class="card-pager-btn" data-course-id="${courseId}" data-dir="-1"${page === 0 ? ' disabled' : ''}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
      <span class="card-pager-info">${page + 1} / ${totalPages}</span>
      <button class="card-pager-btn" data-course-id="${courseId}" data-dir="1"${page >= totalPages - 1 ? ' disabled' : ''}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
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

  const pageSize = CARD_PAGE_SIZE;
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
  // 歷史：從清單進詳情 → push（新增一個返回步，Back 回清單）；
  //       詳情內換課（sidebar 點另一課）→ replace（不疊步，Back 仍直接回清單）。
  if (_historyReady && !_suppressHistory) {
    const loc = { app: 'due', page: currentPage, showSubmitted, view: 'course', courseId };
    if (currentView === 'course') history.replaceState(loc, '');
    else history.pushState(loc, '');
  }

  // 没有卡片元素或不支持 View Transitions 时的回退
  if (!cardEl || !document.startViewTransition) {
    currentView = 'course';
    currentCourseId = courseId;

    const detailContainer = document.getElementById('course-detail-container');
    const pageTabs = document.getElementById('page-tabs');
    const mainSection = document.getElementById('main-section');
    const detailBackBtn = document.getElementById('detail-back-btn');

    pageTabs.classList.add('detail-mode');
    if (detailBackBtn) detailBackBtn.style.display = 'inline-flex';
    mainSection.style.display = 'none';
    detailContainer.style.display = 'flex';

    const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      renderNav(courses, assignments);
      renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);
    }
    return;
  }

  // ── FIRST: 在小卡片上标记共享元素 ──
  cardEl.style.viewTransitionName = 'course-shell';
  const cCode = cardEl.querySelector('.card-code, .week-task-course');
  const cName = cardEl.querySelector('.card-name, .week-task-title');
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
    const detailBackBtn = document.getElementById('detail-back-btn');

    pageTabs.style.display = '';
    pageTabs.classList.add('detail-mode');
    if (detailBackBtn) detailBackBtn.style.display = 'inline-flex';
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

// ── 退出課程詳情、回到清單 ──
// 回到「currentPage / showSubmitted 所指的清單」（不再寫死回 courses grid）——
// 由 popstate（Back）或 render() fallback 呼叫；currentPage/showSubmitted 已由呼叫端設好。
function showGridView() {
  const prevCourseId = currentCourseId;

  if (!document.startViewTransition) {
    currentView = 'grid';
    currentCourseId = null;
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

    const pageTabs = document.getElementById('page-tabs');
    const mainSection = document.getElementById('main-section');
    const detailBackBtn = document.getElementById('detail-back-btn');

    pageTabs.style.display = '';
    pageTabs.classList.remove('detail-mode');
    if (detailBackBtn) detailBackBtn.style.display = 'none';
    mainSection.style.display = '';
    detailContainer.style.display = 'none';

    const { courses = [], assignments = {}, assignmentGroups = {} } = _currentData;
    updateSideNav();
    renderNav(courses, assignments);
    // 回到原本所在的清單（週待辦或課程 grid）；回週待辦時下方 querySelector 找不到課程卡 → 自然淡出
    if (currentPage === 'week' && !showSubmitted) {
      renderWeekSection(courses, assignments);
    } else {
      renderCardGrid(courses, assignments, assignmentGroups);
    }

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

// ── 課程重命名（inline edit）──
function startCourseRename(courseId) {
  const textSpan = document.querySelector('.detail-name .detail-name-text');
  const renameBtn = document.querySelector('.btn-rename-course');
  if (!textSpan) return;

  const course = (_currentData.courses || []).find((c) => c.id === courseId);
  const currentName = (_currentData.courseNames || {})[courseId] || (course ? course.name : '');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'course-rename-input';
  input.value = currentName;
  if (renameBtn) renameBtn.style.visibility = 'hidden';
  textSpan.replaceWith(input);
  input.focus();
  input.select();

  const restore = (displayName) => {
    const span = document.createElement('span');
    span.className = 'detail-name-text';
    span.textContent = displayName;
    input.replaceWith(span);
    if (renameBtn) renameBtn.style.visibility = '';
  };

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    const displayName = newName || (course ? course.name : '');
    restore(displayName);

    persistCourseName(courseId, newName, course);

    const { courses = [], assignments = {} } = _currentData;
    renderNav(courses, assignments);
  };

  const cancel = () => {
    if (committed) return;
    committed = true;
    restore(currentName);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', commit);
}

// 寫入課程自訂名稱（單一真相：_currentData + chrome.storage.local.courseNames）；
// newName 已 trim，空或等於原始課名 → 視為移除自訂（startCourseRename / startSidebarRename 共用）
function persistCourseName(courseId, newName, course) {
  const useCustom = !!(newName && course && newName !== course.name);
  if (!_currentData.courseNames) _currentData.courseNames = {};
  if (useCustom) _currentData.courseNames[courseId] = newName;
  else delete _currentData.courseNames[courseId];

  chrome.storage.local.get(['courseNames'], (data) => {
    const names = data.courseNames || {};
    if (useCustom) names[courseId] = newName;
    else delete names[courseId];
    chrome.storage.local.set({ courseNames: names });
  });
}

// ── 側欄課程 inline 重命名（雙擊側欄課名觸發：就地在左欄編輯，不跑到右側詳情）──
function startSidebarRename(courseId) {
  const item = document.querySelector(`.nav-course-item[data-target-course="${courseId}"]`);
  if (!item) return;   // 目標不在（如三連點時已被 input 取代）→ 直接略過

  const course = (_currentData.courses || []).find((c) => c.id === courseId);
  const currentName = (_currentData.courseNames || {})[courseId] || (course ? course.name : '');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'nav-rename-input';
  input.value = currentName;
  item.replaceWith(input);   // 用輸入框取代整個按鈕（避免把 input 巢狀進 button 造成事件/焦點問題）
  input.focus();
  input.select();

  const rerenderNav = () => {
    const { courses = [], assignments = {} } = _currentData;
    renderNav(courses, assignments);   // 重繪還原按鈕（commit 後即套用新名）
  };

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    const displayName = newName || (course ? course.name : '');
    persistCourseName(courseId, newName, course);
    rerenderNav();
    // 若右側正顯示同一課，順手同步詳情標題（只改文字、不整段重繪，避免打斷成績計算器/捲動）
    if (currentView === 'course' && currentCourseId === courseId) {
      const dName = document.querySelector('#course-detail-container .detail-name-text');
      if (dName) dName.textContent = displayName;
    }
  };

  const cancel = () => {
    if (committed) return;
    committed = true;
    rerenderNav();   // 還原原本按鈕（不寫入）
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', commit);
}

// ── 完成過渡動畫：3 秒撤銷窗口 → 碎點爆 ──
function rerenderDetailAndNav(cid) {
  const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
  const course = courses.find((c) => c.id === cid);
  if (course) renderCourseDetailSection(course, assignments[cid] || [], assignmentGroups[cid] || [], scores);
  renderNav(courses, assignments);
  updateSideNav();   // 升級/降級、完成勾選後同步刷新側欄頂部計數（待辦/已完成）
}

function beginComplete(item, id, cid) {
  const chk = item.querySelector('.assignment-check');
  if (chk) { chk.dataset.done = 'true'; chk.setAttribute('aria-label', tr('markUndone')); } // 不重繪，手動點綠
  item.classList.add('completing');
  const right = item.querySelector('.assignment-right');
  if (right && !right.querySelector('.complete-undo-hint')) {
    const hint = document.createElement('div');
    hint.className = 'complete-undo-hint';
    hint.textContent = '↩ ' + tr('undoComplete');
    right.insertBefore(hint, right.firstChild);
  }
  // 底部撤銷倒數條：3 秒縮短歸零 → 觸發爆開（時長依 COMPLETE_DELAY_MS）
  if (!item.querySelector('.complete-countdown')) {
    const bar = document.createElement('div');
    bar.className = 'complete-countdown';
    bar.style.animation = `complete-countdown ${COMPLETE_DELAY_MS / 1000}s linear forwards`;
    item.appendChild(bar);
  }
  _completeTimers[id] = setTimeout(() => {
    delete _completeTimers[id];
    finishComplete(item, id, cid);
  }, COMPLETE_DELAY_MS);
}

function finishComplete(item, id, cid) {
  spawnBurstDots(item);
  item.classList.add('bursting');
  // 略長於 .45s 爆開動畫，結束後重繪：已完成的會被濾掉、計數/圓餅/側欄一起更新
  setTimeout(() => rerenderDetailAndNav(cid), COMPLETE_BURST_MS);
}

function cancelComplete(item, id, cid) {
  if (_completeTimers[id]) { clearTimeout(_completeTimers[id]); delete _completeTimers[id]; }
  const chk = item.querySelector('.assignment-check');
  revertCompletion(chk && chk.dataset.extDone === 'true', id);
  // 就地還原（不整段重繪，避免影響其他進行中的動畫）
  item.classList.remove('completing');
  const hint = item.querySelector('.complete-undo-hint');
  if (hint) hint.remove();
  const bar = item.querySelector('.complete-countdown');
  if (bar) bar.remove();
  if (chk) { chk.dataset.done = 'false'; chk.setAttribute('aria-label', tr('markDone')); }
}

// ── 週卡片完成過渡（平行於 assignment-item 版；共用 COMPLETE_* 常數與 spawnBurstDots）──
function rerenderWeekAndNav(celebrate = false) {
  const { courses = [], assignments = {} } = _currentData;
  renderWeekSection(courses, assignments, celebrate);
  updateSideNav();
  renderNav(courses, assignments);
}

function beginCompleteWeek(card, id, cid, celebrate = false) {
  const chk = card.querySelector('.assignment-check');
  if (chk) { chk.dataset.done = 'true'; chk.setAttribute('aria-label', tr('markUndone')); }
  card.classList.add('completing');
  // due 文字位置換成「↩ 撤銷」hint（沿用 .complete-undo-hint 樣式）
  const due = card.querySelector('.week-task-due');
  if (due && !card.querySelector('.complete-undo-hint')) {
    due.style.display = 'none';
    const hint = document.createElement('div');
    hint.className = 'complete-undo-hint';
    hint.textContent = '↩ ' + tr('undoComplete');
    due.parentNode.insertBefore(hint, due);
  }
  if (!card.querySelector('.complete-countdown')) {
    const bar = document.createElement('div');
    bar.className = 'complete-countdown';
    bar.style.animation = `complete-countdown ${COMPLETE_DELAY_MS / 1000}s linear forwards`;
    card.appendChild(bar);
  }
  _completeTimers[id] = setTimeout(() => {
    delete _completeTimers[id];
    finishCompleteWeek(card, id, cid, celebrate);
  }, COMPLETE_DELAY_MS);
}

function finishCompleteWeek(card, id, cid, celebrate = false) {
  spawnBurstDots(card);
  card.classList.add('bursting');
  // 已完成者會被 applyFilters 濾掉；重繪週 section＋側欄＋左欄（用 _currentData，避免閃白）
  setTimeout(() => rerenderWeekAndNav(celebrate), COMPLETE_BURST_MS);
}

function cancelCompleteWeek(card, id) {
  if (_completeTimers[id]) { clearTimeout(_completeTimers[id]); delete _completeTimers[id]; }
  const chk = card.querySelector('.assignment-check');
  revertCompletion(chk && chk.dataset.extDone === 'true', id);
  card.classList.remove('completing');
  const hint = card.querySelector('.complete-undo-hint');
  if (hint) hint.remove();
  const due = card.querySelector('.week-task-due');
  if (due) due.style.display = '';
  const bar = card.querySelector('.complete-countdown');
  if (bar) bar.remove();
  if (chk) { chk.dataset.done = 'false'; chk.setAttribute('aria-label', tr('markDone')); }
}

function spawnBurstDots(item) {
  const n = 10;
  for (let i = 0; i < n; i++) {
    const dot = document.createElement('span');
    const ang = (Math.PI * 2 * i) / n;
    const dist = 42 + ((i * 13) % 18);
    dot.className = 'complete-burst-dot';
    dot.style.setProperty('--dx', `${Math.round(Math.cos(ang) * dist)}px`);
    dot.style.setProperty('--dy', `${Math.round(Math.sin(ang) * dist)}px`);
    dot.style.background = i % 2 ? 'var(--green)' : 'var(--orange)';
    item.appendChild(dot);
  }
}

// ── 課程詳細視圖 ──
function renderCourseDetailSection(course, asgns, groups, scores) {
  const el = document.getElementById('course-detail-container');

  // 重繪前清掉殘留的完成計時器（導覽離開 / 切換篩選時避免 stray callback；week 卡共用同一組計時器）
  clearCompleteTimers();
  // 重繪前中止進行中的拖曳（避免浮動 clone／window 監聽器變孤兒）
  abortActiveDrag();

  const filtered = applyFilters(asgns).sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  });

  // 緊急＝7 天內到期「且未完成」——已完成（含已繳交視圖）不算緊急
  const urgentCount = filtered.filter((a) => {
    if (!a.due_at || isDone(a)) return false;
    const diff = new Date(a.due_at) - Date.now();
    return diff > 0 && diff <= 7 * 86400000;
  }).length;

  const pendingCount = filtered.length;
  const detailMeta = `${pendingCount}${tr(showSubmitted ? 'completedItems' : 'pendingItems')}`;
  const detailUrgentBadge = urgentCount
    ? `<div class="card-badge-urgent">${urgentCount}${tr('urgentItems')}</div>`
    : `<div class="card-badge-urgent is-placeholder" aria-hidden="true">0${tr('urgentItems')}</div>`;

  const weightPieHtml = renderWeightPie(groups, course.id);
  const gradeCalcHtml = renderGradeCalculator(course, asgns, groups, scores);
  const assignmentRows = filtered.map((a) => renderAssignmentRow(a, groups, course.id)).join('');
  // 稽核入口：僅列目前仍隱藏（未升級）的考試/簽到；只要該課「原本有」可隱藏項就恆常顯示此區
  // （即使全部升級、隱藏數為 0，仍作為「拖回降級」的放置目標）
  const hiddenItems = asgns.filter((a) => isHidden(a));
  // 「已隱藏」區恆存在（只要該課有作業）作為拖放目標；列出所有被收起來的項目
  const hiddenHtml = asgns.length ? renderHiddenItemsSection(hiddenItems, groups, course.id) : '';

  el.innerHTML = `
    <div class="course-detail-view">
      <div class="detail-card-top">
        <div class="detail-top-row">
          <div class="detail-code">${esc(course.course_code || '')}</div>
          ${detailUrgentBadge}
        </div>
        <div class="detail-name">
          <span class="detail-name-text">${esc(getCourseName(course))}</span>
          <button class="btn-rename-course" data-course-id="${course.id}" title="${tr('renameCourse')}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
        </div>
        <div class="detail-meta">${detailMeta}</div>
      </div>
      <div class="detail-card-bottom">
        <div class="detail-left-panel">
          ${weightPieHtml}
        </div>
        <div class="detail-right-panel">
          ${gradeCalcHtml}
          <div class="detail-assignments-label">${currentListLabel()}</div>
          <div class="detail-assignments-list" data-course-id="${course.id}" data-drophint="${esc(tr('dropToShow'))}">
            ${assignmentRows || `<div style="padding:12px 0;color:var(--mid);font-size:13px;">${noItemsLabel()}</div>`}
          </div>
          ${hiddenHtml}
        </div>
      </div>
    </div>`;

  // Position rename button right after the text (can't do this in CSS alone since
  // the button is position:absolute but the block width != text width)
  const textSpan = el.querySelector('.detail-name-text');
  const renameBtn = el.querySelector('.btn-rename-course');
  if (textSpan && renameBtn) {
    renameBtn.style.left = `${textSpan.offsetLeft + textSpan.offsetWidth + 8}px`;
  }

  // 固定寬左欄下，評分圖例字體自動縮放（過長再 ellipsis）
  fitLegendText(el);

  // ← 返回：走 history.back()，與瀏覽器返回（手勢／按鈕／Cmd+[）統一由 popstate 處理
  document.getElementById('detail-back-btn').addEventListener('click', () => history.back());

  el.querySelectorAll('.assignment-item').forEach((item) => {
    item.addEventListener('click', () => {
      if (item.classList.contains('bursting')) return;      // 爆開中不互動
      if (item.classList.contains('completing')) {           // 撤銷窗口內 → 點列取消
        const chk = item.querySelector('.assignment-check');
        if (chk) cancelComplete(item, String(chk.dataset.assignmentId), parseInt(chk.dataset.courseId, 10));
        return;
      }
      const desc = item.nextElementSibling;
      if (desc && desc.classList.contains('assignment-desc')) {
        desc.classList.toggle('open');
      }
    });
  });

  el.querySelectorAll('.btn-rename-course').forEach((btn) => {
    btn.addEventListener('click', () => startCourseRename(parseInt(btn.dataset.courseId, 10)));
  });

  el.querySelectorAll('.btn-delete-custom-assignment').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCustomAssignment(btn.dataset.courseId, btn.dataset.assignmentId);
    });
  });

  // 自訂作業「編輯」鈕 → 帶入既有資料開 modal（編輯模式）
  el.querySelectorAll('.btn-edit-custom-assignment').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cid = parseInt(btn.dataset.courseId, 10);
      const id = String(btn.dataset.assignmentId);
      const list = (_currentData.assignments || {})[cid] || [];
      const editing = list.find((a) => String(a.id) === id && a._isCustom);
      if (editing) openCustomAssignmentModal(cid, editing);
    });
  });

  el.querySelectorAll('.assignment-check').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 不觸發整列展開或作業名稱跳轉
      const item = btn.closest('.assignment-item');
      const id = String(btn.dataset.assignmentId);
      const cid = parseInt(btn.dataset.courseId, 10);
      if (item && item.classList.contains('bursting')) return;   // 爆開中不互動
      if (item && item.classList.contains('completing')) {        // 撤銷窗口內 → 取消
        cancelComplete(item, id, cid);
        return;
      }
      // 依 Canvas 事實分流：已繳 → 翻轉「標回未完成」覆蓋；未繳 → 翻轉手動完成（就地更新，避免閃白）
      toggleCompletion(btn.dataset.extDone === 'true', id);
      const a = ((_currentData.assignments || {})[cid] || []).find((x) => String(x.id) === id);
      const nowDone = a ? isDone(a) : false;
      if (nowDone && !showSubmitted && item) {
        // 待辦視圖勾選完成 → 3 秒撤銷窗口 → 碎點爆 → 移除
        beginComplete(item, id, cid);
      } else {
        // 標回未完成：直接重繪（待辦視圖跳回清單；已繳視圖離開清單）
        rerenderDetailAndNav(cid);
      }
    });
  });

  el.querySelectorAll('.assignment-title-link').forEach((title) => {
    title.addEventListener('click', (e) => {
      e.stopPropagation();
      const assignmentId = title.dataset.assignmentId;
      const courseId = title.dataset.courseId;
      const base = _currentData.canvasBaseUrl || '';
      if (!base) return;
      const url = `${base}/courses/${courseId}/assignments/${assignmentId}`;
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

  el.querySelectorAll('.btn-edit-weights').forEach((btn) => {
    btn.addEventListener('click', () => {
      openWeightEditModal(parseInt(btn.dataset.courseId, 10));
    });
  });

  // 「已自動隱藏」稽核清單展開/收合（不持久化，每次進詳情預設收合）
  el.querySelectorAll('.hidden-items-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.hidden-items');
      if (!wrap) return;
      wrap.classList.toggle('open');
    });
  });

  // 拖曳升級／降級隱藏項
  setupHideablePromoteDrag(el);

  // 開頁時主動算一次「顯示用」總分（persist:false → 不把 Canvas 預填值固化成手動值）
  if (el.querySelector('.grade-calc')) {
    recalculateGrades(course.id, { persist: false });
  }
}

// ── 拖曳升級（隱藏列→作業清單）／降級（升級列→稽核區）──
// Pointer Events 自繪引擎（原生 HTML5 DnD 的啟動層在部分環境不觸發、ghost/插入動畫皆不可控）：
// grip 為唯一拖曳起點 → 超過閾值「拿起」浮動 clone 跟隨游標 → 懸停清單時插入點以下的列讓位 →
// 放開命中則寫入 manualShown 重繪，clone 飛入重繪後的實際落點（清單依 due 排序）；未命中/Esc 飛回原位。
let _dragCtx = null;                 // 進行中的拖曳（全域僅允許一場）

const DRAG_LIFT_PX = 4;              // 移動超過此距離才視為拖曳（否則當一般點擊）
const DRAG_SETTLE_MS = 240;          // 落點／返回動畫時長
const DRAG_EDGE_ZONE = 56;           // 距捲動容器上下緣此距離內自動捲動
const DRAG_EDGE_SPEED = 14;          // 自動捲動每 frame 最大位移

function setupHideablePromoteDrag(el) {
  const zones = {
    list: el.querySelector('.detail-assignments-list'),
    hidden: el.querySelector('.hidden-items'),
    scroller: el.querySelector('.detail-right-panel'),
  };
  el.querySelectorAll('[data-drag]').forEach((row) => {
    const grip = row.querySelector('.drag-grip');
    if (!grip) return;
    // grip 上的點擊不觸發列展開／名稱跳轉
    grip.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); });
    grip.addEventListener('pointerdown', (e) => {
      if (_dragCtx || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (row.classList.contains('completing') || row.classList.contains('bursting')) return;
      e.preventDefault();              // 擋文字選取
      e.stopPropagation();
      trackDragFrom(e, row, zones);
    });
  });
}

function trackDragFrom(e, row, zones) {
  const dir = row.dataset.drag;                                  // 'promote' | 'demote'
  const target = dir === 'promote' ? zones.list : zones.hidden;
  if (!target) return;
  const ctx = _dragCtx = {
    row, dir, target, zones,
    id: row.dataset.hideableId,
    pointerId: e.pointerId,
    startX: e.clientX, startY: e.clientY,
    lastX: e.clientX, lastY: e.clientY,
    lifted: false, over: false, done: false,
    clone: null, base: null,
    scrollV: 0, scrollRaf: 0,
  };
  try { e.target.setPointerCapture(e.pointerId); } catch (_) { /* 合成事件無 active pointer */ }
  ctx.onMove = (ev) => { if (ev.pointerId === ctx.pointerId) dragMove(ctx, ev); };
  ctx.onUp = (ev) => { if (ev.pointerId === ctx.pointerId) endDrag(ctx, false); };
  ctx.onCancel = (ev) => { if (ev.pointerId === ctx.pointerId) endDrag(ctx, true); };
  ctx.onKey = (ev) => { if (ev.key === 'Escape' && ctx.lifted) { ev.stopPropagation(); endDrag(ctx, true); } };
  // 拖曳放開後瀏覽器仍會補發 click → 吞掉，避免誤觸列展開
  ctx.onClick = (ev) => { if (ctx.lifted) { ev.stopPropagation(); ev.preventDefault(); } };
  window.addEventListener('pointermove', ctx.onMove);
  window.addEventListener('pointerup', ctx.onUp);
  window.addEventListener('pointercancel', ctx.onCancel);
  window.addEventListener('keydown', ctx.onKey, true);
  window.addEventListener('click', ctx.onClick, true);
}

function dragMove(ctx, ev) {
  ctx.lastX = ev.clientX;
  ctx.lastY = ev.clientY;
  if (!ctx.lifted) {
    if (Math.hypot(ctx.lastX - ctx.startX, ctx.lastY - ctx.startY) < DRAG_LIFT_PX) return;
    liftRow(ctx);
  }
  positionClone(ctx);
  updateDropState(ctx);
  maybeEdgeScroll(ctx);
}

// 「拿起」：以原列複製浮動 clone；原列留殘影、目標區亮起
function liftRow(ctx) {
  ctx.lifted = true;
  const rect = ctx.row.getBoundingClientRect();
  ctx.base = rect;
  const clone = ctx.row.cloneNode(true);
  clone.classList.add('drag-clone');
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  document.body.appendChild(clone);
  ctx.clone = clone;
  ctx.row.classList.add('drag-source');
  ctx.target.classList.add('drop-active');
  document.body.classList.add('drag-active');
}

function positionClone(ctx) {
  const dx = ctx.lastX - ctx.startX;
  const dy = ctx.lastY - ctx.startY;
  ctx.clone.style.transform = `translate(${dx}px, ${dy}px) scale(1.02) rotate(0.4deg)`;
}

function updateDropState(ctx) {
  const t = ctx.target.getBoundingClientRect();
  const pad = 14;                                 // 貼近邊緣也算在目標內
  const over = ctx.lastX >= t.left - pad && ctx.lastX <= t.right + pad
            && ctx.lastY >= t.top - pad && ctx.lastY <= t.bottom + pad;
  if (over !== ctx.over) {
    ctx.over = over;
    ctx.target.classList.toggle('drop-hover', over);
  }
}

// 游標貼近捲動容器上下緣時自動捲動（速度與貼近程度成正比），捲動中持續重算 drop 狀態
function maybeEdgeScroll(ctx) {
  const sc = ctx.zones.scroller;
  if (!sc || !ctx.lifted) return;
  const r = sc.getBoundingClientRect();
  let v = 0;
  if (ctx.lastY < r.top + DRAG_EDGE_ZONE) {
    v = -DRAG_EDGE_SPEED * Math.min(1, (r.top + DRAG_EDGE_ZONE - ctx.lastY) / DRAG_EDGE_ZONE);
  } else if (ctx.lastY > r.bottom - DRAG_EDGE_ZONE) {
    v = DRAG_EDGE_SPEED * Math.min(1, (ctx.lastY - (r.bottom - DRAG_EDGE_ZONE)) / DRAG_EDGE_ZONE);
  }
  ctx.scrollV = v;
  if (v && !ctx.scrollRaf) {
    const step = () => {
      if (ctx.done || !ctx.scrollV) { ctx.scrollRaf = 0; return; }
      const before = sc.scrollTop;
      sc.scrollTop += ctx.scrollV;
      if (sc.scrollTop !== before) updateDropState(ctx);
      ctx.scrollRaf = requestAnimationFrame(step);
    };
    ctx.scrollRaf = requestAnimationFrame(step);
  }
}

function endDrag(ctx, cancelled) {
  if (ctx.done) return;
  ctx.done = true;
  _dragCtx = null;
  window.removeEventListener('pointermove', ctx.onMove);
  window.removeEventListener('pointerup', ctx.onUp);
  window.removeEventListener('pointercancel', ctx.onCancel);
  window.removeEventListener('keydown', ctx.onKey, true);
  setTimeout(() => window.removeEventListener('click', ctx.onClick, true), 0);  // 留到補發的 click 之後
  ctx.scrollV = 0;
  if (ctx.scrollRaf) { cancelAnimationFrame(ctx.scrollRaf); ctx.scrollRaf = 0; }
  document.body.classList.remove('drag-active');
  if (!ctx.lifted) return;                        // 未達閾值＝點擊，無事發生

  ctx.target.classList.remove('drop-active', 'drop-hover');
  if (!cancelled && ctx.over) {
    commitDrag(ctx);
  } else {
    settleClone(ctx, ctx.row, { flash: false, after: () => {
      ctx.row.classList.remove('drag-source');
    } });
  }
}

// 命中：寫入隱藏/顯示（同步重繪詳情＋側欄）→ clone 飛入重繪後的實際落點
function commitDrag(ctx) {
  const savedScroll = ctx.zones.scroller ? ctx.zones.scroller.scrollTop : 0;
  const hiddenWasOpen = !!(ctx.zones.hidden && ctx.zones.hidden.classList.contains('open'));
  setItemHiddenByDrag(ctx.id, ctx.dir === 'demote');

  const container = document.getElementById('course-detail-container');
  const scroller = container.querySelector('.detail-right-panel');
  if (scroller) scroller.scrollTop = savedScroll;  // 重繪會重置捲動位置 → 還原
  // 稽核區開合：降級後強制展開（讓使用者看到落點）；升級則維持拖曳前狀態
  const hidden = container.querySelector('.hidden-items');
  if (hidden && (hiddenWasOpen || ctx.dir === 'demote')) hidden.classList.add('open');

  const cssId = (window.CSS && CSS.escape) ? CSS.escape(String(ctx.id)) : String(ctx.id);
  let landed = null;
  if (ctx.dir === 'promote') {
    const chk = container.querySelector(`.detail-assignments-list .assignment-check[data-assignment-id="${cssId}"]`);
    landed = chk && chk.closest('.assignment-item');
  } else {
    landed = container.querySelector(`.hidden-item-row[data-hideable-id="${cssId}"]`);
  }
  settleClone(ctx, landed, { flash: true });
}

// clone 飛入 targetRow 的位置後移除；targetRow 期間隱形、落地後亮一下（flash）
function settleClone(ctx, targetRow, { flash = true, after = null } = {}) {
  const clone = ctx.clone;
  const finish = () => {
    clone.remove();
    if (targetRow && targetRow.isConnected) {
      targetRow.classList.remove('drag-arriving');
      if (flash) {
        targetRow.classList.add('drag-arrived');
        setTimeout(() => targetRow.classList.remove('drag-arrived'), 900);
      }
    }
    if (after) after();
  };
  let to = null;
  if (targetRow && targetRow.isConnected) {
    targetRow.scrollIntoView({ block: 'nearest' });
    to = targetRow.getBoundingClientRect();
  }
  if (!to || (!to.width && !to.height)) {          // 落點不存在/不可見（如已繳交過濾）→ 原地淡出
    clone.style.transition = `opacity ${DRAG_SETTLE_MS}ms ease`;
    clone.style.opacity = '0';
    setTimeout(finish, DRAG_SETTLE_MS + 30);
    return;
  }
  targetRow.classList.add('drag-arriving');
  clone.style.transition = `transform ${DRAG_SETTLE_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1), width ${DRAG_SETTLE_MS}ms ease, height ${DRAG_SETTLE_MS}ms ease`;
  clone.style.transform = `translate(${to.left - ctx.base.left}px, ${to.top - ctx.base.top}px)`;
  clone.style.width = to.width + 'px';
  clone.style.height = to.height + 'px';
  setTimeout(finish, DRAG_SETTLE_MS + 30);
}

// 重繪前中止進行中的拖曳（clone 直接移除，不跑動畫），避免 clone/監聽器變孤兒
function abortActiveDrag() {
  const ctx = _dragCtx;
  if (!ctx) return;
  ctx.done = true;
  _dragCtx = null;
  window.removeEventListener('pointermove', ctx.onMove);
  window.removeEventListener('pointerup', ctx.onUp);
  window.removeEventListener('pointercancel', ctx.onCancel);
  window.removeEventListener('keydown', ctx.onKey, true);
  window.removeEventListener('click', ctx.onClick, true);
  if (ctx.scrollRaf) cancelAnimationFrame(ctx.scrollRaf);
  document.body.classList.remove('drag-active');
  if (ctx.clone) ctx.clone.remove();
  if (ctx.row && ctx.row.isConnected) ctx.row.classList.remove('drag-source');
  if (ctx.target && ctx.target.isConnected) ctx.target.classList.remove('drop-active', 'drop-hover');
}

// ── 已自動隱藏稽核清單（唯讀精簡列；考試/簽到；不顯示任何分數，見決策 3）──
function renderHiddenItemsSection(items, groups, courseId) {
  // 排序：還沒到的（拖出會進待辦）在前依 due 升冪；已結束/已繳的放一起殿後、最近結束在前
  const ordered = [...items].sort((a, b) => {
    const da = isDone(a), db = isDone(b);
    if (da !== db) return da ? 1 : -1;
    const ta = a.due_at ? new Date(a.due_at).getTime() : Infinity;
    const tb = b.due_at ? new Date(b.due_at).getTime() : Infinity;
    return da ? tb - ta : ta - tb;
  });
  const rows = ordered.map((a) => {
    const examFlag = isExam(a);
    // 帶 examFlag → 考試顯 due-exam 紫色；簽到走一般 due 色階（此處不傳 submitted，考試恆紫）
    const uClass = urgencyClass(a.due_at, examFlag);
    const groupName = findGroupName(a, groups);
    const submitted = isSubmitted(a);
    const isCustom = !!a._isCustom;
    // 只有「與當前視圖完成類別相符」者可拖升級（見 spec 2026-07-22 same-bucket）；
    // 不相符者（如未完成視圖裡已結束/已繳的考試）淡化、無握把、此視圖拖不動
    const draggable = isDone(a) === showSubmitted;
    const titleHtml = isCustom
      ? `<span>${esc(a.name)}</span>`
      : `<span class="assignment-title-link" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}">${esc(a.name)}</span>`;
    return `
      <div class="hidden-item-row${draggable ? '' : ' hidden-item-locked'}"${draggable ? ' data-drag="promote"' : ''} data-hideable-id="${esc(String(a.id))}">
        <div class="hidden-item-left">
          <div class="hidden-item-title">${titleHtml}${draggable ? DRAG_GRIP : ''}</div>
          ${groupName ? `<div class="assignment-group">${esc(groupName)}</div>` : ''}
        </div>
        <div class="hidden-item-right">
          <div class="due-label ${uClass}">${dueLabelFor(a)}</div>
          ${submitted ? `<div class="submitted-badge">${tr('submittedBadge')}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  const listInner = rows || `<div class="hidden-items-empty">${esc(tr('hiddenItemsEmpty'))}</div>`;

  // 整個 .hidden-items 為「降級」放置目標（data-drophint 供 .drop-active::after 顯示提示）
  return `
    <div class="hidden-items" data-course-id="${courseId}" data-drophint="${esc(tr('dropToHide'))}">
      <button class="hidden-items-toggle" data-course-id="${courseId}">
        <span class="hidden-items-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>
        <span>${esc(tr('hiddenItemsToggle').replace('{n}', items.length))}</span>
      </button>
      <div class="hidden-items-list">${listInner}</div>
    </div>`;
}


// ── Weight Pie Chart ──
const EDIT_WEIGHT_BTN = (courseId) => `
  <button class="btn-edit-weights" data-course-id="${courseId}">
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
    ${tr('editWeight')}
  </button>`;

function renderWeightPie(groups, courseId) {
  // Prioritize custom weights
  const customWeights = courseId && (_currentData.customWeights || {})[courseId];
  if (customWeights && customWeights.length > 0) {
    const total = customWeights.reduce((s, c) => s + (c.weight || 0), 0);
    if (total > 0) {
      let currentPct = 0;
      const gradientParts = customWeights.map((c, i) => {
        const pct = (c.weight / total) * 100;
        const startPct = currentPct;
        currentPct += pct;
        return `${GROUP_COLORS[i % GROUP_COLORS.length]} ${startPct}% ${currentPct}%`;
      }).join(', ');
      const legend = customWeights.map((c, i) => `
        <div class="detail-pie-legend-item">
          <div class="detail-pie-legend-dot" style="background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>
          <span class="detail-pie-legend-text">${esc(c.name)}</span>
          <span class="detail-pie-legend-weight">${c.weight}%</span>
        </div>`).join('');
      return `
        <div class="detail-weight-pie-container">
          <div class="detail-pie" role="img" aria-label="${esc(customWeights.map((c) => `${c.name} ${c.weight}%`).join(', '))}" style="background: conic-gradient(${gradientParts});"></div>
          <div class="detail-pie-legend">${legend}</div>
          ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
        </div>`;
    }
  }

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
        <div class="detail-pie" role="img" aria-label="${esc(groups.map((g) => `${g.name} ${g.group_weight || 0}%`).join(', '))}" style="background: conic-gradient(${gradientParts});"></div>
        <div class="detail-pie-legend">${legend}</div>
        ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
      </div>`;
  }

  // No data
  return `
    <div class="detail-weight-pie-container">
      <div class="detail-pie" role="img" aria-label="${esc(tr('noGradeInfo'))}" style="background: var(--border);"></div>
      <div class="detail-pie-label">${tr('noGradeInfo')}</div>
      ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
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
      // 三態：scores 自有該 id → null 代表使用者清空過（顯示空）、數字則顯示；
      //       scores 無該 id → 有 Canvas 已評分成績就預填，否則空
      let savedScore;
      if (Object.prototype.hasOwnProperty.call(scores, a.id)) {
        savedScore = scores[a.id] === null ? '' : scores[a.id];
      } else if (a.submission && a.submission.score != null) {
        savedScore = a.submission.score;
      } else {
        savedScore = '';
      }
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
        <span class="grade-calc-title">${tr('gradeCalcTitle')}</span>
        <span class="grade-calc-final-display" id="final-grade-${course.id}">—</span>
      </div>
      <div class="grade-calc-body">
        ${groupRows}
      </div>
    </div>`;
}

// ── 成績即時計算 ──
// persist:true（使用者輸入）才寫 storage；persist:false（開頁預填）只算顯示，
// 不把 Canvas 預填值固化成手動值。顯示一律從輸入框現值讀，確保預填與手動輸入一致。
function recalculateGrades(courseId, { persist = true } = {}) {
  const { assignments = {}, assignmentGroups = {} } = _currentData;
  const asgns = assignments[courseId] || [];
  const groups = assignmentGroups[courseId] || [];

  const inputFor = (a) => document.querySelector(
    `.grade-calc-pts input[data-assignment-id="${a.id}"][data-course-id="${courseId}"]`
  );

  // 每個作業的「有效分數」＝輸入框現值（含預填）；只在可解析為有限數時記錄
  const effective = {};
  asgns.forEach((a) => {
    const input = inputFor(a);
    if (!input) return;
    const v = input.value === '' ? NaN : parseFloat(input.value);
    if (Number.isFinite(v)) effective[a.id] = v;
  });

  // 分組小計＋加權總分（只有有限數且有配分才計入）
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
      if (Number.isFinite(effective[a.id]) && a.points_possible) {
        earnedSum += effective[a.id];
        possibleSum += a.points_possible;
        hasScore = true;
      }
    });

    const scoreEl = document.getElementById(`group-score-${g.id}`);
    if (scoreEl) {
      if (hasScore && possibleSum > 0) {
        scoreEl.textContent = `${((earnedSum / possibleSum) * 100).toFixed(1)}%`;
        weightedSum += (earnedSum / possibleSum) * (g.group_weight || 0);
        weightedTotal += (g.group_weight || 0);
      } else {
        scoreEl.textContent = '—';
      }
    }
  });

  const finalEl = document.getElementById(`final-grade-${courseId}`);
  if (finalEl) {
    finalEl.textContent = weightedTotal > 0
      ? `${((weightedSum / weightedTotal) * 100).toFixed(1)}%`
      : '—';
  }

  if (!persist) return;

  // 持久化三態：空且有 Canvas 分數 → null（記住「清空」）；空且無 Canvas 分數 → 刪除；有值 → 數字
  chrome.storage.local.get(['scores'], (data) => {
    const scores = { ...(data.scores || {}) };
    asgns.forEach((a) => {
      const input = inputFor(a);
      if (!input) return;
      if (input.value === '') {
        if (a.submission && a.submission.score != null) scores[a.id] = null;
        else delete scores[a.id];
      } else {
        const v = parseFloat(input.value);
        if (Number.isFinite(v)) scores[a.id] = v;
        else delete scores[a.id];
      }
    });
    chrome.storage.local.set({ scores });
    _currentData.scores = scores;
  });
}

// ── 作業列 ──
function renderAssignmentRow(a, groups, courseId) {
  const submitted = isSubmitted(a); // Canvas 事實：badge / 成績顯示
  const extDone = isExternallyDone(a); // 勾選路由：已繳或考試已結束 → 翻 manualUndone
  const done = isDone(a);           // 顯示狀態：列樣式 / 勾選圈（外部完成可被標回未完成）
  const examFlag = isExam(a);
  const uClass = urgencyClass(a.due_at, examFlag, done);
  const groupName = findGroupName(a, groups);
  // 作業描述：白名單 sanitize 後直接以 innerHTML 呈現；空白 → noDesc（見 descSanitizer.js）
  const sanitizedDesc = DueDescSanitizer.sanitize(a.description || '');
  const descInner = sanitizedDesc.trim() ? sanitizedDesc : esc(tr('noDesc'));
  const isCustom = !!a._isCustom;
  // 升級後的考試/簽到（manualShown）：在清單中可拖回稽核區降級 → 名稱後加 grip 拖曳把手
  const promotedHideable = isHideable(a) && isManuallyShown(a);
  const titleHtml = isCustom
    ? `<span>${esc(a.name)}</span>`
    : `<span class="assignment-title-link" data-assignment-id="${a.id}" data-course-id="${courseId}">${esc(a.name)}</span>`;
  const customLabel = isCustom ? `<div class="custom-assignment-label">${tr('customAssignment')}</div>` : '';

  // ── 完成勾選圈：一律可雙向切換；Canvas 已繳者切的是 manualUndone 覆蓋（見 spec 2026-07-21）──
  const checkLabel = done ? tr('markUndone') : tr('markDone');
  const checkHtml = `<button class="assignment-check" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}" data-done="${done ? 'true' : 'false'}" data-ext-done="${extDone ? 'true' : 'false'}" aria-label="${esc(checkLabel)}"${submitted ? ` title="${esc(tr('submittedBadge'))}"` : ''}></button>`;

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
    <div class="assignment-item${done ? ' submitted' : ''}${isCustom ? ' custom-assignment' : ''}${promotedHideable ? ' promoted-hideable' : ''}" data-drag="demote" data-hideable-id="${esc(String(a.id))}">
      ${checkHtml}
      <div class="assignment-left">
        <div class="assignment-title">${titleHtml}${DRAG_GRIP}</div>
        ${customLabel}
        ${groupName ? `<div class="assignment-group">${esc(groupName)}</div>` : ''}
      </div>
      <div class="assignment-right">
        <div class="due-label ${uClass}">${dueLabelFor(a)}</div>
        ${gradeHtml}
        ${submitted ? `<div class="submitted-badge">${tr('submittedBadge')}</div>` : ''}
        ${isCustom
          ? `<div class="custom-actions-row">
              <button class="btn-edit-custom-assignment" title="${esc(tr('editAssignmentTitle'))}" aria-label="${esc(tr('editAssignmentTitle'))}" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
              <button class="btn-delete-custom-assignment" title="${esc(tr('deleteCustomTitle'))}" aria-label="${esc(tr('deleteCustomTitle'))}" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            </div>`
          : ''}
      </div>
    </div>
    <div class="assignment-desc">
      <div class="assignment-desc-inner">${descInner}</div>
    </div>`;
}

document.getElementById('btn-add-assignment')?.addEventListener('click', () => {
  openCustomAssignmentModal();
});
document.getElementById('custom-assignment-close')?.addEventListener('click', closeCustomAssignmentModal);
document.getElementById('custom-assignment-cancel')?.addEventListener('click', closeCustomAssignmentModal);
document.getElementById('custom-assignment-overlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('custom-assignment-overlay')) closeCustomAssignmentModal();
});
document.getElementById('custom-assignment-form')?.addEventListener('submit', saveCustomAssignmentFromForm);

// 確認對話框：確定 → 跑 callback 後關閉；取消／點背景 → 關閉不執行
document.getElementById('confirm-ok')?.addEventListener('click', () => {
  const cb = _confirmOnOk;
  closeConfirmDialog();
  if (cb) cb();
});
document.getElementById('confirm-cancel')?.addEventListener('click', closeConfirmDialog);
document.getElementById('confirm-overlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('confirm-overlay')) closeConfirmDialog();
});

// ── 側欄主導航（學期待辦 / 課程 / 已繳交） ──
function goToPage(page) {
  // 在課程詳情頁時，先退出詳情再切換到目標頁
  if (currentView === 'course') {
    currentView = 'grid';
    currentCourseId = null;
    currentPage = page;
    showSubmitted = false;
    document.getElementById('page-tabs').classList.remove('detail-mode');
    document.getElementById('detail-back-btn').style.display = 'none';
    document.getElementById('course-detail-container').style.display = 'none';
    document.getElementById('main-section').style.display = '';
    syncHistory();   // 由詳情經 sidebar 離開：把目前 entry 更新為目標清單
    loadData();
    return;
  }
  // 若正在看「已繳交」，關閉後回到目標頁
  if (showSubmitted) {
    showSubmitted = false;
    currentPage = page;
    syncHistory();
    loadData();
    return;
  }
  switchPage(page);
}
document.getElementById('nav-week').addEventListener('click', () => goToPage('week'));
document.getElementById('nav-courses').addEventListener('click', () => goToPage('courses'));

// ── 查看已繳交（切換過濾） ──
document.getElementById('nav-submitted').addEventListener('click', () => {
  showSubmitted = !showSubmitted;
  syncHistory();   // 「已繳交」為過濾切換：更新目前 entry，不疊返回步
  loadData();
});

// ── 同步按鈕 ──
document.getElementById('sync-btn').addEventListener('click', () => {
  const btn = document.getElementById('sync-btn');
  btn.innerHTML = '<span class="sync-dots"><span></span><span></span><span></span></span>';
  btn.disabled = true;
  // 首次同步（無資料）→ 渲染 skeleton 佔位；已有資料則維持靜默背景刷新（不用佔位蓋真資料）
  const firstSync = !(_currentData.courses || []).length;
  if (firstSync) renderSyncSkeleton();
  chrome.runtime.sendMessage({ type: 'SYNC' }, (resp) => {
    if (chrome.runtime.lastError || !resp || !resp.success) {
      // 同步失敗：先還原畫面（清掉 skeleton、回空狀態），再顯示錯誤態 2.5 秒
      if (firstSync) loadData();
      btn.textContent = tr('syncFailed');
      btn.classList.add('sync-error');
      setTimeout(() => {
        btn.textContent = tr('sync');
        btn.classList.remove('sync-error');
        btn.disabled = false;
      }, 2500);
    } else {
      btn.textContent = tr('sync');
      btn.disabled = false;
      loadData();
    }
  });
});

// ── 讀取資料 ──
function loadData() {
  chrome.storage.local.get(
    ['lastSync', 'schoolName', 'canvasBaseUrl', 'courses', 'assignments', 'customAssignments', 'assignmentGroups', 'scores', 'courseNames', 'customWeights', 'manualDone', 'manualUndone', 'manualShown', 'manualHidden'],
    (data) => {
      if (!data.courses || !data.courses.length) {
        currentView = 'grid';
        currentCourseId = null;
        document.getElementById('header-meta').textContent = tr('noDataMeta');
        fitMetaText();
        document.getElementById('course-nav').innerHTML = '';
        document.getElementById('page-tabs').classList.remove('detail-mode');
        document.getElementById('page-tabs').style.display = '';
        document.getElementById('main-section').style.display = '';
        document.getElementById('course-detail-container').style.display = 'none';
        delete document.getElementById('main-section').dataset.skeleton;   // 失敗還原：清掉 skeleton 標記
        document.getElementById('main-section').innerHTML = `
          <div class="state-msg">
            <div class="big">${tr('noData')}</div>
            <div class="small">${tr('noDataHintSync')}</div>
          </div>`;
        return;
      }
      render({
        ...data,
        scores: data.scores || {},
        courseNames: data.courseNames || {},
        customAssignments: data.customAssignments || {},
        manualDone: data.manualDone || {},
        manualUndone: data.manualUndone || {},
        manualShown: data.manualShown || {},
        manualHidden: data.manualHidden || {},
      });
    }
  );
}

function updateClaudeUsageMenuLabel() {
  const btn = document.getElementById('menu-claude-usage-toggle');
  if (!btn) return;
  btn.textContent = _showClaudeUsage ? tr('menuUsageHide') : tr('menuUsageShow');
}

chrome.storage.local.get(['uiLanguage', 'showClaudeUsageInPopup'], (data) => {
  _uiLanguage = data.uiLanguage || 'zh-TW';
  _showClaudeUsage = data.showClaudeUsageInPopup !== false;
  applyUILanguage();
  updateClaudeUsageMenuLabel();
});

const settingsMenuBtn = document.getElementById('settings-menu-btn');
const settingsMenu = document.getElementById('settings-menu');
const menuClaudeUsageToggle = document.getElementById('menu-claude-usage-toggle');
const menuOpenTutorial = document.getElementById('menu-open-tutorial');

if (settingsMenuBtn && settingsMenu) {
  settingsMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('open');
    settingsMenuBtn.classList.toggle('open', settingsMenu.classList.contains('open'));
    if (!settingsMenu.classList.contains('open')) {
      const menuLanguageLabel = document.getElementById('menu-language-label');
      if (menuLanguageLabel) menuLanguageLabel.classList.remove('submenu-open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && !settingsMenuBtn.contains(e.target)) {
      settingsMenu.classList.remove('open');
      settingsMenuBtn.classList.remove('open');
      const menuLanguageLabel = document.getElementById('menu-language-label');
      if (menuLanguageLabel) menuLanguageLabel.classList.remove('submenu-open');
    }
  });
}

if (menuClaudeUsageToggle) {
  menuClaudeUsageToggle.addEventListener('click', () => {
    _showClaudeUsage = !_showClaudeUsage;
    chrome.storage.local.set({ showClaudeUsageInPopup: _showClaudeUsage });
    updateClaudeUsageMenuLabel();
    if (settingsMenu) settingsMenu.classList.remove('open');
    if (settingsMenuBtn) settingsMenuBtn.classList.remove('open');
    const menuLanguageLabel = document.getElementById('menu-language-label');
    if (menuLanguageLabel) menuLanguageLabel.classList.remove('submenu-open');
  });
}

if (menuOpenTutorial) {
  menuOpenTutorial.addEventListener('click', () => {
    openWelcomeModal();
    if (settingsMenu) settingsMenu.classList.remove('open');
    if (settingsMenuBtn) settingsMenuBtn.classList.remove('open');
    const menuLanguageLabel = document.getElementById('menu-language-label');
    if (menuLanguageLabel) menuLanguageLabel.classList.remove('submenu-open');
  });
}

const menuAiSettings = document.getElementById('menu-ai-settings');
if (menuAiSettings) {
  menuAiSettings.addEventListener('click', () => {
    if (typeof DueAiSettings !== 'undefined') DueAiSettings.open();
    if (settingsMenu) settingsMenu.classList.remove('open');
    if (settingsMenuBtn) settingsMenuBtn.classList.remove('open');
    const menuLanguageLabel = document.getElementById('menu-language-label');
    if (menuLanguageLabel) menuLanguageLabel.classList.remove('submenu-open');
  });
}

// ── Welcome Modal ──
let _welcomeStep = 1;

function _welcomeUpdateDots(n) {
  document.querySelectorAll('.welcome-dot[data-wstep]').forEach(d => {
    d.classList.toggle('active', +d.dataset.wstep === n);
  });
}

function _welcomeUpdateButtons(n) {
  const btnRow = document.getElementById('welcome-btn-row');
  if (!btnRow) return;

  let html = '';
  if (n === 1) {
    html = `<button class="welcome-btn" data-wgo="2">${tr('wBtnStart')}</button>`;
  } else if (n === 5) {
    html = `
      <button class="welcome-btn sec" data-wgo="4">${tr('wBtnPrev')}</button>
      <button class="welcome-btn ora" id="welcome-done-btn">${tr('wBtnDone')}</button>
    `;
  } else {
    html = `
      <button class="welcome-btn sec" data-wgo="${n - 1}">${tr('wBtnPrev')}</button>
      <button class="welcome-btn" data-wgo="${n + 1}">${tr('wBtnNext')}</button>
    `;
  }
  btnRow.innerHTML = html;

  // Re-bind the done button since it's dynamic
  document.getElementById('welcome-done-btn')?.addEventListener('click', closeWelcomeModal);
}

function openWelcomeModal() {
  _welcomeStep = 1;
  const track = document.getElementById('welcome-track');
  if (track) track.style.transition = 'none';
  if (track) track.style.transform = 'translateX(0)';
  _welcomeUpdateDots(1);
  _welcomeUpdateButtons(1);
  const overlay = document.getElementById('welcome-overlay');
  if (overlay) overlay.classList.add('open');
  // re-enable transition after reset
  requestAnimationFrame(() => {
    if (track) track.style.transition = '';
  });
}

function closeWelcomeModal() {
  const overlay = document.getElementById('welcome-overlay');
  if (overlay) overlay.classList.remove('open');
}

function welcomeGoStep(n) {
  if (n === _welcomeStep) return;
  _welcomeStep = n;
  const track = document.getElementById('welcome-track');
  if (track) track.style.transform = `translateX(-${(n - 1) * 20}%)`;
  _welcomeUpdateDots(n);
  _welcomeUpdateButtons(n);
}

document.getElementById('welcome-close')?.addEventListener('click', closeWelcomeModal);
document.getElementById('welcome-done-btn')?.addEventListener('click', closeWelcomeModal);
document.querySelectorAll('.welcome-lang-switch button').forEach((btn) => {
  btn.addEventListener('click', () => setUILanguage(btn.dataset.lang));
});

// ── 登入 Canvas 自動跳回 ──
// 點連結開 Canvas 分頁後「武裝」監聽：同步成功（lastSync 落地）→ 關閉開出的分頁、聚焦回 dashboard。
// 未登入時 Canvas API 401、lastSync 不會動，所以不會過早跳回；登入完成後 auto-sync 成功才觸發。
// 所有 chrome.* 呼叫皆守衛（dev harness 只 stub 部分 API）。
const CANVAS_RETURN_TIMEOUT_MS = 10 * 60 * 1000; // 超時自動解除，避免使用者早已離開流程還被突然拉回
let _canvasReturn = null; // { canvasTabId, dashboardTabId, timeoutId, onUpdated }

function _disarmCanvasReturn() {
  if (!_canvasReturn) return;
  clearTimeout(_canvasReturn.timeoutId);
  if (_canvasReturn.onUpdated && chrome.tabs?.onUpdated?.removeListener) {
    chrome.tabs.onUpdated.removeListener(_canvasReturn.onUpdated);
  }
  _canvasReturn = null;
}

function _returnToDashboard() {
  const armed = _canvasReturn;
  if (!armed) return;
  _disarmCanvasReturn();
  loadData(); // 剛同步完的資料上畫面
  const syncedEl = document.getElementById('welcome-canvas-synced');
  if (syncedEl) { syncedEl.hidden = false; syncedEl.textContent = tr('wCanvasSynced'); }
  // 只關我們自己開的那個 Canvas 分頁（可能已被使用者關掉，lastError 靜默）
  if (chrome.tabs?.remove && armed.canvasTabId != null) {
    chrome.tabs.remove(armed.canvasTabId, () => void chrome.runtime.lastError);
  }
  if (chrome.tabs?.update && armed.dashboardTabId != null) {
    chrome.tabs.update(armed.dashboardTabId, { active: true }, (tab) => {
      if (chrome.runtime.lastError) return;
      if (tab && chrome.windows?.update) chrome.windows.update(tab.windowId, { focused: true });
    });
  }
}

function _armCanvasReturn(canvasTabId) {
  _disarmCanvasReturn();
  _canvasReturn = {
    canvasTabId,
    dashboardTabId: null,
    timeoutId: setTimeout(_disarmCanvasReturn, CANVAS_RETURN_TIMEOUT_MS),
    onUpdated: null,
  };
  if (chrome.tabs?.getCurrent) {
    chrome.tabs.getCurrent((tab) => { if (_canvasReturn && tab) _canvasReturn.dashboardTabId = tab.id; });
  }
  // 輔助訊號：Canvas 分頁每次載入完成就補發手動 SYNC（不受 5 分鐘節流限制），
  // 涵蓋「近期已同步過、auto-sync 被節流 → lastSync 不會變」的情況；跳回仍統一由 lastSync 變化觸發
  if (chrome.tabs?.onUpdated?.addListener) {
    const onUpdated = (tabId, info) => {
      if (!_canvasReturn || tabId !== _canvasReturn.canvasTabId || info.status !== 'complete') return;
      chrome.runtime.sendMessage({ type: 'SYNC' }, () => void chrome.runtime.lastError);
    };
    _canvasReturn.onUpdated = onUpdated;
    chrome.tabs.onUpdated.addListener(onUpdated);
  }
}

// 唯一的 storage 監聽：只在武裝期間反應 lastSync（不碰 manualDone 等 key，不影響完成動畫，見 CLAUDE.md）
if (chrome.storage?.onChanged?.addListener) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !_canvasReturn || !changes.lastSync) return;
    if (changes.lastSync.newValue && changes.lastSync.newValue !== changes.lastSync.oldValue) {
      _returnToDashboard();
    }
  });
}

// AI 評分比重分析寫入 customWeights 後由 background 送來（spec 2026-09-03 §10）：
// 只更新記憶體快取；正開著該課詳情且沒有拖曳／完成動畫進行中才重繪。不新增 storage.onChanged（見開發注意事項 9）
if (chrome.runtime?.onMessage?.addListener) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== 'GRADING_WEIGHTS_UPDATED' || !_currentData) return;
    if (!_currentData.customWeights) _currentData.customWeights = {};
    _currentData.customWeights[msg.courseId] = msg.weights;
    const idle = !_dragCtx && Object.keys(_completeTimers).length === 0;
    if (idle && currentView === 'course' && currentCourseId === msg.courseId) rerenderDetailAndNav(msg.courseId);
    const overlay = document.getElementById('ai-settings-overlay');
    if (overlay && overlay.classList.contains('open') && typeof DueAiSettings !== 'undefined') DueAiSettings.refreshStatus();
  });
}

// Delegate: overlay background click to close, canvas link, data-wgo step nav, dot clicks
// （canvas link 用委派：applyWelcomeTranslations 會以 innerHTML 重建該連結，直接綁定會失效）
document.getElementById('welcome-overlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('welcome-overlay')) { closeWelcomeModal(); return; }
  const link = e.target.closest('#welcome-canvas-link');
  if (link) {
    e.preventDefault();
    const url = _currentData.canvasBaseUrl || 'https://hkust-gz.instructure.com';
    if (chrome.tabs?.create) {
      chrome.tabs.create({ url, active: true }, (tab) => { if (tab) _armCanvasReturn(tab.id); });
    }
    return;
  }
  const btn = e.target.closest('[data-wgo]');
  if (btn) { welcomeGoStep(+btn.dataset.wgo); return; }
  const dot = e.target.closest('.welcome-dot[data-wstep]');
  if (dot) welcomeGoStep(+dot.dataset.wstep);
});

// Open on first install (URL param ?welcome=1)
if (new URLSearchParams(location.search).get('welcome') === '1') {
  openWelcomeModal();
}

// ── 瀏覽器返回整合：popstate 把畫面還原到目標 entry（期間 _suppressHistory 擋掉再寫 history）──
window.addEventListener('popstate', (e) => {
  if (!_currentData.courses) return;   // 資料尚未載入前忽略
  const loc = (e.state && e.state.app === 'due')
    ? e.state
    : { page: 'week', showSubmitted: false, view: 'grid', courseId: null };
  _suppressHistory = true;
  try {
    if (loc.view === 'course' && loc.courseId != null) {
      // 前進／重做到某課程詳情
      if (currentView !== 'course' || currentCourseId !== loc.courseId) {
        currentPage = loc.page || currentPage;
        showSubmitted = !!loc.showSubmitted;
        showCourseDetail(loc.courseId);   // 無 cardEl → 直接切換（無 morph）
      }
    } else if (currentView === 'course') {
      // 從課程詳情 Back → 帶 morph 退回 currentPage 指向的清單
      currentPage = loc.page || 'week';
      showSubmitted = !!loc.showSubmitted;
      showGridView();
    } else {
      // 已在清單，僅頁面／過濾不同 → 重繪
      currentPage = loc.page || 'week';
      showSubmitted = !!loc.showSubmitted;
      updateSideNav();
      loadData();
    }
  } finally {
    _suppressHistory = false;
  }
});

// 建立 base entry（week grid），之後 pushState/replaceState 才有基準
_historyReady = true;
history.replaceState(_appLocation(), '');

loadData();

// ── Weight Edit Modal ──
let _weightEditCourseId = null;

function openWeightEditModal(courseId) {
  _weightEditCourseId = courseId;

  const custom = (_currentData.customWeights || {})[courseId];
  const groups = (_currentData.assignmentGroups || {})[courseId] || [];

  let items = [];
  if (custom && custom.length > 0) {
    items = custom.map((c) => ({ name: c.name, weight: c.weight }));
  } else if (groups.some((g) => g.group_weight)) {
    items = groups.filter((g) => g.group_weight).map((g) => ({ name: g.name, weight: g.group_weight }));
  }

  renderWeightEditList(items);
  // 逃生口：僅當該課已有自訂權重時，才顯示「還原 Canvas 權重」
  const resetBtn = document.getElementById('weight-edit-reset');
  if (resetBtn) resetBtn.style.display = (custom && custom.length > 0) ? '' : 'none';
  document.getElementById('weight-edit-overlay').classList.add('open');
}

function renderWeightEditList(items) {
  const list = document.getElementById('weight-edit-list');
  list.innerHTML = items.map((item, i) => `
    <div class="weight-edit-row" data-index="${i}">
      <div class="weight-edit-color" style="background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>
      <input class="weight-edit-name" type="text" value="${esc(item.name)}" placeholder="${tr('weightItemName')}">
      <input class="weight-edit-pct" type="number" value="${item.weight}" min="0" max="100" step="0.1">
      <button class="weight-edit-del" data-index="${i}"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
    </div>`).join('');

  list.querySelectorAll('.weight-edit-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.weight-edit-row').remove();
      updateWeightTotal();
      refreshWeightColors();
    });
  });

  list.querySelectorAll('.weight-edit-pct').forEach((input) => {
    input.addEventListener('input', updateWeightTotal);
  });

  updateWeightTotal();
}

function refreshWeightColors() {
  document.querySelectorAll('.weight-edit-row').forEach((row, i) => {
    const dot = row.querySelector('.weight-edit-color');
    if (dot) dot.style.background = GROUP_COLORS[i % GROUP_COLORS.length];
  });
}

function updateWeightTotal() {
  const inputs = document.querySelectorAll('.weight-edit-pct');
  const total = Array.from(inputs).reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  const el = document.getElementById('weight-edit-total');
  el.textContent = `${tr('weightTotal')}${Math.round(total * 10) / 10}%`;
  el.classList.toggle('over', total > 100.05);
}

document.getElementById('weight-edit-add').addEventListener('click', () => {
  const rows = document.querySelectorAll('.weight-edit-row');
  const i = rows.length;
  const row = document.createElement('div');
  row.className = 'weight-edit-row';
  row.dataset.index = i;
  row.innerHTML = `
    <div class="weight-edit-color" style="background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>
    <input class="weight-edit-name" type="text" value="" placeholder="${tr('weightItemName')}">
    <input class="weight-edit-pct" type="number" value="0" min="0" max="100" step="0.1">
    <button class="weight-edit-del"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>`;
  row.querySelector('.weight-edit-del').addEventListener('click', () => {
    row.remove();
    updateWeightTotal();
    refreshWeightColors();
  });
  row.querySelector('.weight-edit-pct').addEventListener('input', updateWeightTotal);
  document.getElementById('weight-edit-list').appendChild(row);
  row.querySelector('.weight-edit-name').focus();
  updateWeightTotal();
});

document.getElementById('weight-edit-save').addEventListener('click', () => {
  const rows = document.querySelectorAll('.weight-edit-row');
  const items = Array.from(rows).map((row) => ({
    name: row.querySelector('.weight-edit-name').value.trim() || tr('unnamedWeight'),
    weight: parseFloat(row.querySelector('.weight-edit-pct').value) || 0,
  })).filter((item) => item.weight > 0 || item.name !== tr('unnamedWeight'));

  if (!_currentData.customWeights) _currentData.customWeights = {};
  _currentData.customWeights[_weightEditCourseId] = items;

  chrome.storage.local.get(['customWeights'], (data) => {
    const all = data.customWeights || {};
    all[_weightEditCourseId] = items;
    chrome.storage.local.set({ customWeights: all });
  });

  document.getElementById('weight-edit-overlay').classList.remove('open');

  const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
  const course = courses.find((c) => c.id === _weightEditCourseId);
  if (course) renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);
});

document.getElementById('weight-edit-cancel').addEventListener('click', () => {
  document.getElementById('weight-edit-overlay').classList.remove('open');
});

document.getElementById('weight-edit-reset').addEventListener('click', () => {
  const courseId = _weightEditCourseId;
  // 刪除該課自訂權重 → 圓餅自然回退到 Canvas group_weight，或顯示無評分資訊
  if (_currentData.customWeights) delete _currentData.customWeights[courseId];
  chrome.storage.local.get(['customWeights'], (data) => {
    const all = data.customWeights || {};
    delete all[courseId];
    chrome.storage.local.set({ customWeights: all });
  });
  document.getElementById('weight-edit-overlay').classList.remove('open');
  const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
  const course = courses.find((c) => c.id === courseId);
  if (course) renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);
});

document.getElementById('weight-edit-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

// ── Esc 關閉最上層 overlay（一次只關一個；優先序：新增作業 → 權重 → 教學）──
// 註：課程重命名 inline input 自帶 Escape 處理，且重命名時無 overlay 開著，兩者不衝突
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  // 優先序：確認框 → 新增/編輯作業 → 權重 → 教學（一次只關最上層；經 close 函式一併清狀態）
  const closers = [
    ['confirm-overlay', closeConfirmDialog],
    ['ai-settings-overlay', () => { if (typeof DueAiSettings !== 'undefined') DueAiSettings.close(); }],
    ['custom-assignment-overlay', closeCustomAssignmentModal],
    ['weight-edit-overlay', () => document.getElementById('weight-edit-overlay').classList.remove('open')],
    ['welcome-overlay', closeWelcomeModal],
  ];
  for (const [id, close] of closers) {
    const ov = document.getElementById(id);
    if (ov && ov.classList.contains('open')) {
      close();
      return;
    }
  }
});

// ── Modal 無障礙：focus trap ＋ 開啟聚焦第一元素 ＋ 關閉還原焦點到觸發元素（四個 overlay 共用）──
function _focusablesIn(container) {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(sel)).filter((el) => el.getClientRects().length > 0);
}

function setupModalA11y(overlay) {
  if (!overlay || overlay._a11yBound) return;
  overlay._a11yBound = true;
  let triggerEl = null;

  const activate = () => {
    if (overlay._trapActive) return;
    overlay._trapActive = true;
    triggerEl = document.activeElement;                 // 記住觸發元素，關閉時還原
    requestAnimationFrame(() => {
      if (!overlay.contains(document.activeElement)) {   // 尊重呼叫端已設定的焦點（如作業名稱輸入框）
        const f = _focusablesIn(overlay);
        if (f.length) f[0].focus();
      }
    });
  };
  const deactivate = () => {
    if (!overlay._trapActive) return;
    overlay._trapActive = false;
    if (triggerEl && document.contains(triggerEl) && typeof triggerEl.focus === 'function') triggerEl.focus();
    triggerEl = null;
  };

  // Tab / Shift+Tab 在 modal 內循環
  overlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !overlay.classList.contains('open')) return;
    const f = _focusablesIn(overlay);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // 監看 .open class：開→啟用 trap；關→還原焦點（涵蓋 Esc／背景點擊／儲存等所有關閉路徑）
  new MutationObserver(() => {
    if (overlay.classList.contains('open')) activate();
    else deactivate();
  }).observe(overlay, { attributes: true, attributeFilter: ['class'] });

  if (overlay.classList.contains('open')) activate();   // 設定時已開著（如首次載入教學）也啟用
}

['custom-assignment-overlay', 'weight-edit-overlay', 'welcome-overlay', 'confirm-overlay', 'ai-settings-overlay']
  .forEach((id) => setupModalA11y(document.getElementById(id)));


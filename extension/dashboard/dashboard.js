// ── 顏色池（評分比重分組用） ──
const GROUP_COLORS = [
  '#d97757', '#6a9bcc', '#788c5d', '#b09050',
  '#a86070', '#7a9ba8', '#b08060', '#6a7c5d',
];

let _uiLanguage = 'zh-TW';
const I18N = {
  'zh-TW': {
    filter: '篩選',
    assignment: '作業',
    exam: '考試',
    all: '全部',
    hideSubmitted: '查看已繳交',
    courses: '課程',
    sync: '同步',
    syncing: '同步中...',
    tabWeek: '學期待辦',
    tabCourses: '課程',
    addAssignment: '+ 新增作業',
    addAssignmentTitle: '新增作業',
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
    themeDark: '切換深色模式',
    themeLight: '切換淺色模式',
    languageLabel: '語言',
    langZhTw: '繁體中文',
    langZhCn: '简体中文',
    langEn: 'English',
    apiSettings: 'API 設定',
    menuTutorial: '使用教學',
    // formatDue
    noDueDate: '無截止日期',
    overdue: '已過期',
    today: '今天',
    tomorrow: '明天',
    daysLater: '天後',
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
    urgentItems: '件緊急',
    // back button
    back: '← 返回',
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
    // syllabus
    analyzeWeight: '分析權重',
    updateWeight: '更新權重',
    weightNotFound: '未找到評分資訊',
    renameCourse: '重命名',
    weightItemName: '項目名稱',
    coursePdf: '課程 PDF',
    aiSelectedPdf: 'AI 選取 PDF',
    // grade calculator
    gradeCalcTitle: '成績計算器',
    // assignment row
    noDesc: '（無描述）',
    submittedBadge: '已繳',
    analyzeBtn: 'AI 分析',
    // analysis panel
    analyzing: '正在分析中...',
    reanalyzing: '正在重新分析...',
    analyzingShort: '分析中',
    commError: '通訊失敗，請重試',
    noModelIdMsg: '尚未設定模型 ID',
    noApiKeyMsg: '尚未設定 AI API 金鑰',
    settingsPage: '設定頁面',
    pleaseGoTo: '請先前往',
    andConfigure: '選擇模型並輸入 API 金鑰',
    reanalyze: '重新分析',
    summaryLabel: '摘要',
    estimatedHoursLabel: '預估作業時間',
    requirementsLabel: '作業要求',
    milestonesLabel: '里程碑規劃',
    tipsLabel: '建議',
    daysBeforeDuePrefix: '截止前 ',
    daysBeforeDueSuffix: ' 天',
    // analysis errors
    noApiKeyShort: '請先設定 API 金鑰',
    noModelIdShort: '請先設定模型 ID',
    analysisError: '分析失敗，請稍後再試',
    retry: '重試',
    // week section
    within7Days: '7天內',
    within30Days: '8-30天',
    beyond30Days: '30天以上',
    beyond30DaysShort: '30天+',
    noTasks: '無待辦事項',
    analysisTitle: '作業分析',
    // ui widgets
    editWeight: '編輯',
    weightEditTitle: '編輯評分權重',
    weightAddItem: '+ 新增項目',
    weightTotal: '總計：',
    unnamedWeight: '未命名',
    submittedBtn: '已繳交',
    // welcome steps
    wTitle1: '歡迎使用 Due',
    wBody1Intro: 'Due，提醒你該做的事 ⚡️',
    wBody1Q1: '「Canvas 很靠北，找個作業要翻半天」- 有人',
    wBody1Q2: '「蛤？明天要交Lab喔」- 另外一個人',
    wTitle2: '登入 Canvas（必須）',
    wBody2: 'Due 透過你的 Canvas 登入狀態同步資料，不需要額外設定或 Token。',
    wStep2Li1: '登入 <a class="welcome-inline-link" id="welcome-canvas-link">Canvas ↗</a>（點一下這個連結用於第一次同步😭）',
    wStep2Li2: 'Due 會<strong>在你每次打開Canvas時自動更新</strong>你的所有課程與作業',
    wStep2Li3: '點擊工具列或進入 Dashboard 都可以看到相關資訊',
    wTitle3: '釘選 Due 到工具列',
    wBody3: '釘選後點一下圖示就能查看 7 天待辦（煮菠愛用😋）',
    wStep3Li1: '點擊瀏覽器右上角的<strong>拼圖圖示</strong>（擴充功能）',
    wStep3Li2: '找到 <strong>Due</strong>，點擊旁邊的<strong>釘選圖示</strong>',
    wStep3Li3: '工具列出現 Due 圖示後即完成',
    wTitle4: 'AI 評分權重分析（可選）',
    wBody4a: '添加 API Key 後，Due 可自動讀取課程 Syllabus，找出各項目的評分比重。',
    wBody4b: '進入課程詳情頁，點擊「分析權重」即可執行',
    wBody4c: '不加 API 也可以手動在課程頁編輯評分比重',
    wBody4d: '如果你不知道 API 是什麼，可以跳過這頁',
    wTitle5: '一切就緒',
    wBody5: '設定完成。登入 Canvas 後資料會自動同步，可隨時在設定中調整 AI 服務。',
    wDone1: 'Due 已釘選到瀏覽器工具列',
    wDone2: 'Canvas 登入狀態已確認',
    wDone3: 'AI 分析功能已了解（可隨時在設定中配置）',
    wBtnStart: '開始設定',
    wBtnPrev: '上一步',
    wBtnNext: '下一步',
    wBtnDone: '開始使用',
    wApiLink: '添加 API Key',
  },
  'zh-CN': {
    filter: '筛选',
    assignment: '作业',
    exam: '考试',
    all: '全部',
    hideSubmitted: '查看已提交',
    courses: '课程',
    sync: '同步',
    syncing: '同步中...',
    tabWeek: '学期待办',
    tabCourses: '课程',
    addAssignment: '+ 新增作业',
    addAssignmentTitle: '新增作业',
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
    themeDark: '切换深色模式',
    themeLight: '切换浅色模式',
    languageLabel: '语言',
    langZhTw: '繁體中文',
    langZhCn: '简体中文',
    langEn: 'English',
    apiSettings: 'API 设置',
    menuTutorial: '使用教程',
    noDueDate: '无截止日期',
    overdue: '已过期',
    today: '今天',
    tomorrow: '明天',
    daysLater: '天后',
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
    urgentItems: '件紧急',
    back: '← 返回',
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
    analyzeWeight: '分析权重',
    updateWeight: '更新权重',
    weightNotFound: '未找到评分信息',
    renameCourse: '重命名',
    weightItemName: '项目名称',
    coursePdf: '课程 PDF',
    aiSelectedPdf: 'AI 选取 PDF',
    gradeCalcTitle: '成绩计算器',
    noDesc: '（无描述）',
    submittedBadge: '已交',
    analyzeBtn: 'AI 分析',
    analyzing: '正在分析中...',
    reanalyzing: '正在重新分析...',
    analyzingShort: '分析中',
    commError: '通信失败，请重试',
    noModelIdMsg: '尚未设置模型 ID',
    noApiKeyMsg: '尚未设置 AI API 密钥',
    settingsPage: '设置页面',
    pleaseGoTo: '请先前往',
    andConfigure: '选择模型并输入 API 密钥',
    reanalyze: '重新分析',
    summaryLabel: '摘要',
    estimatedHoursLabel: '预估作业时间',
    requirementsLabel: '作业要求',
    milestonesLabel: '里程碑规划',
    tipsLabel: '建议',
    daysBeforeDuePrefix: '截止前 ',
    daysBeforeDueSuffix: ' 天',
    noApiKeyShort: '请先设置 API 密钥',
    noModelIdShort: '请先设置模型 ID',
    analysisError: '分析失败，请稍后再试',
    retry: '重试',
    within7Days: '7天内',
    within30Days: '8-30天',
    beyond30Days: '30天以上',
    beyond30DaysShort: '30天+',
    noTasks: '无待办事项',
    analysisTitle: '作业分析',
    editWeight: '编辑',
    weightEditTitle: '编辑评分权重',
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
    wStep2Li1: '登录 <a class="welcome-inline-link" id="welcome-canvas-link">Canvas ↗</a>（点击此链接以完成第一次同步😭）',
    wStep2Li2: 'Due 会<strong>在每次打开 Canvas 时自动更新</strong>你的所有课程和作业',
    wStep2Li3: '点击工具栏图标或进入 Dashboard 即可查看',
    wTitle3: '固定 Due 到工具栏',
    wBody3: '固定后点一下图标就能查看 7 天待办😋',
    wStep3Li1: '点击浏览器右上角的<strong>拼图图标</strong>（扩展程序）',
    wStep3Li2: '找到 <strong>Due</strong>，点击旁边的<strong>固定图标</strong>',
    wStep3Li3: '工具栏出现 Due 图标后即完成',
    wTitle4: 'AI 评分权重分析（可选）',
    wBody4a: '添加 API Key 后，Due 可自动读取课程 Syllabus，找出各项目的评分比重。',
    wBody4b: '进入课程详情页，点击「分析权重」即可执行',
    wBody4c: '不加 API 也可以在课程页手动编辑评分比重',
    wBody4d: '如果你不知道 API 是什么，可以跳过这页',
    wTitle5: '一切就绪',
    wBody5: '设置完成。登录 Canvas 后数据将自动同步，可随时在设置中调整 AI 服务。',
    wDone1: 'Due 已固定到浏览器工具栏',
    wDone2: 'Canvas 登录状态已确认',
    wDone3: '已了解 AI 分析功能（可随时在设置中配置）',
    wBtnStart: '开始设置',
    wBtnPrev: '上一步',
    wBtnNext: '下一步',
    wBtnDone: '开始使用',
    wApiLink: '添加 API Key',
  },
  en: {
    filter: 'Filter',
    assignment: 'Assignments',
    exam: 'Exams',
    all: 'All',
    hideSubmitted: 'Show Submitted',
    courses: 'Courses',
    sync: 'Sync',
    syncing: 'Syncing...',
    tabWeek: 'This Week',
    tabCourses: 'Courses',
    addAssignment: '+ Add Assignment',
    addAssignmentTitle: 'Add Assignment',
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
    themeDark: 'Switch To Dark',
    themeLight: 'Switch To Light',
    languageLabel: 'Language',
    langZhTw: 'Traditional Chinese',
    langZhCn: 'Simplified Chinese',
    langEn: 'English',
    apiSettings: 'API Settings',
    menuTutorial: 'Tutorial',
    noDueDate: 'No due date',
    overdue: 'Overdue',
    today: 'Today',
    tomorrow: 'Tomorrow',
    daysLater: 'days left',
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
    urgentItems: ' urgent',
    back: '← Back',
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
    analyzeWeight: 'Analyze Grades',
    updateWeight: 'Update',
    weightNotFound: 'Grade info not found',
    renameCourse: 'Rename',
    weightItemName: 'Item name',
    coursePdf: 'Course PDF',
    aiSelectedPdf: 'AI-selected PDF',
    gradeCalcTitle: 'Grade Calculator',
    noDesc: '(No description)',
    submittedBadge: 'Done',
    analyzeBtn: 'AI Analyze',
    analyzing: 'Analyzing...',
    reanalyzing: 'Re-analyzing...',
    analyzingShort: 'Analyzing',
    commError: 'Connection error, try again',
    noModelIdMsg: 'Model ID not configured',
    noApiKeyMsg: 'AI API key not set',
    settingsPage: 'Settings',
    pleaseGoTo: 'Go to',
    andConfigure: 'to select a model and enter your API key',
    reanalyze: 'Re-analyze',
    summaryLabel: 'Summary',
    estimatedHoursLabel: 'Est. Time',
    requirementsLabel: 'Requirements',
    milestonesLabel: 'Milestones',
    tipsLabel: 'Tips',
    daysBeforeDuePrefix: '',
    daysBeforeDueSuffix: ' days before due',
    noApiKeyShort: 'Please configure API key',
    noModelIdShort: 'Please configure model ID',
    analysisError: 'Analysis failed, try again',
    retry: 'Retry',
    within7Days: 'Due ≤ 7d',
    within30Days: '8-30 days',
    beyond30Days: 'Later (30d+)',
    beyond30DaysShort: '30 d+',
    noTasks: 'No pending tasks',
    analysisTitle: 'Assignment Analysis',
    editWeight: 'Edit',
    weightEditTitle: 'Edit Grade Weights',
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
    wStep2Li1: 'Log in to <a class="welcome-inline-link" id="welcome-canvas-link">Canvas ↗</a> (click this link for your first sync 😭)',
    wStep2Li2: 'Due <strong>auto-syncs all your courses and assignments</strong> every time you open Canvas',
    wStep2Li3: 'Click the toolbar icon or open Dashboard to view your tasks',
    wTitle3: 'Pin Due to Toolbar',
    wBody3: 'Pin it and tap the icon to see your 7-day tasks at a glance 😋',
    wStep3Li1: 'Click the <strong>puzzle icon</strong> (Extensions) in the top-right of your browser',
    wStep3Li2: 'Find <strong>Due</strong> and click the <strong>pin icon</strong> next to it',
    wStep3Li3: 'Done when the Due icon appears in your toolbar',
    wTitle4: 'AI Grade Weights (Optional)',
    wBody4a: 'Add an API Key and Due will auto-detect grade weights from your course Syllabus.',
    wBody4b: 'Open a course, then click "Analyze Weights" to run it',
    wBody4c: 'You can also edit weights manually — no API key needed',
    wBody4d: 'Not sure what an API is? Skip this step',
    wTitle5: 'All Set!',
    wBody5: 'Setup complete. Data syncs automatically after you log in to Canvas. Adjust AI settings anytime.',
    wDone1: 'Due pinned to browser toolbar',
    wDone2: 'Canvas login confirmed',
    wDone3: 'AI analysis feature noted (configure in Settings anytime)',
    wBtnStart: 'Get Started',
    wBtnPrev: 'Back',
    wBtnNext: 'Next',
    wBtnDone: 'Start Using Due',
    wApiLink: 'Add an API Key',
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
  setHTML('wstep-3-li1', 'wStep3Li1');
  setHTML('wstep-3-li2', 'wStep3Li2');
  setText('wstep-3-li3', 'wStep3Li3');
  setText('wstep-4-title', 'wTitle4');
  setText('welcome-api-link', 'wApiLink');
  setText('wstep-4-body-a', 'wBody4a');
  setText('wstep-4-body-b', 'wBody4b');
  setText('wstep-4-body-c', 'wBody4c');
  setText('wstep-4-body-d', 'wBody4d');
  setText('wstep-5-title', 'wTitle5');
  setText('wstep-5-body', 'wBody5');
  setText('wstep-5-done1', 'wDone1');
  setText('wstep-5-done2', 'wDone2');
  setText('wstep-5-done3', 'wDone3');
  _welcomeUpdateButtons(_welcomeStep);
}

function applyUILanguage() {
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = tr(key);
  };
  setText('label-hide-done', 'hideSubmitted');
  setText('label-courses', 'courses');
  setText('sync-btn', 'sync');
  setText('tab-week', 'tabWeek');
  setText('tab-courses', 'tabCourses');
  setText('btn-add-assignment', 'addAssignment');
  setText('btn-show-submitted', 'submittedBtn');
  setText('detail-back-btn', 'back');
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
  const weightAiBtn = document.getElementById('weight-edit-ai-btn');
  if (weightAiBtn) {
    const svg = weightAiBtn.querySelector('svg');
    weightAiBtn.innerHTML = '';
    if (svg) weightAiBtn.appendChild(svg);
    weightAiBtn.appendChild(document.createTextNode(' ' + tr('analyzeBtn')));
  }
  applyWelcomeTranslations();
  const apiSettingsBtn = document.getElementById('menu-open-api-settings');
  if (apiSettingsBtn) apiSettingsBtn.innerHTML = `${tr('apiSettings')} <span>↗</span>`;
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
    _uiLanguage = lang;
    chrome.storage.local.set({ uiLanguage: lang });
    applyUILanguage();
    updateThemeMenuLabel();
    loadData();
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
  if (!dueAt) return tr('noDueDate');
  const d = new Date(dueAt);
  const now = new Date();
  const diffMs = d - now;

  const locale = _uiLanguage === 'en' ? 'en-US' : 'zh-TW';
  const dateStr = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  if (diffMs < 0) return `${dateStr}（${tr('overdue')}）`;

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
  return `${dateStr}（${diffDays} ${tr('daysLater')}）`;
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

function isExam(assignment) {
  if (assignment.is_quiz_assignment) return true;
  if ((assignment.submission_types || []).includes('online_quiz')) return true;
  const lower = (assignment.name || '').toLowerCase();
  return /\b(exam|quiz|midterm|test)\b/.test(lower)
    || lower.includes('考試') || lower.includes('考试')
    || lower.includes('測驗') || lower.includes('测验')
    || lower.includes('期中');
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

let showSubmitted = false;

// ── View 狀態 ──
let currentView = 'grid';      // 'grid' | 'course'
let currentCourseId = null;
let currentPage = 'week';      // 'week' | 'courses'
const cardPages = {};           // { [courseId]: pageIndex }

function currentItemLabel() {
  return tr('assignment');
}

function currentListLabel() { return tr('listAssignment'); }
function cardEmptyLabel() { return tr('noPendingAssignment'); }
function noItemsLabel() { return tr('noAssignment'); }

// ── 套用篩選到作業列表 ──
function applyFilters(asgns) {
  // 永久排除簽到/出勤/參與類，以及考試類
  let result = asgns.filter((a) => !isAttendance(a) && !isExam(a));

  // 默認隱藏已繳交；勾選「查看已繳交」後改為只顯示已繳交
  if (showSubmitted) {
    result = result.filter((a) => isSubmitted(a));
  } else {
    result = result.filter((a) => !isSubmitted(a));
  }

  return result;
}

// ── 課程顯示名稱（支援自訂） ──
function getCourseName(course) {
  if (!course) return '';
  const custom = (_currentData.courseNames || {})[course.id];
  return custom || course.name || '';
}

function openCustomAssignmentModal(defaultCourseId = currentCourseId) {
  const courses = _currentData.courses || [];
  if (!courses.length) return;

  const overlay = document.getElementById('custom-assignment-overlay');
  const form = document.getElementById('custom-assignment-form');
  const courseSelect = document.getElementById('custom-assignment-course');
  const nameInput = document.getElementById('custom-assignment-name');
  const descInput = document.getElementById('custom-assignment-description');
  const dueInput = document.getElementById('custom-assignment-due');
  const errorEl = document.getElementById('custom-assignment-error');
  if (!overlay || !form || !courseSelect || !nameInput || !descInput || !dueInput) return;

  courseSelect.innerHTML = courses.map((course) => `
    <option value="${course.id}">${esc(getCourseName(course))}</option>
  `).join('');

  form.reset();
  if (defaultCourseId && courses.some((course) => String(course.id) === String(defaultCourseId))) {
    courseSelect.value = String(defaultCourseId);
  }
  dueInput.value = DueCustomAssignments.getDefaultDueLocalValue();
  if (errorEl) errorEl.textContent = '';
  overlay.classList.add('open');
  requestAnimationFrame(() => nameInput.focus());
}

function closeCustomAssignmentModal() {
  const overlay = document.getElementById('custom-assignment-overlay');
  if (overlay) overlay.classList.remove('open');
}

function saveCustomAssignmentFromForm(e) {
  e.preventDefault();
  const courseSelect = document.getElementById('custom-assignment-course');
  const nameInput = document.getElementById('custom-assignment-name');
  const descInput = document.getElementById('custom-assignment-description');
  const dueInput = document.getElementById('custom-assignment-due');
  const errorEl = document.getElementById('custom-assignment-error');

  try {
    const assignment = DueCustomAssignments.createCustomAssignment({
      courseId: courseSelect.value,
      name: nameInput.value,
      description: descInput.value,
      dueLocalValue: dueInput.value,
    });
    const key = String(assignment.course_id);
    chrome.storage.local.get(['customAssignments'], (data) => {
      const customAssignments = data.customAssignments || {};
      customAssignments[key] = [assignment, ...(customAssignments[key] || [])];
      chrome.storage.local.set({ customAssignments }, () => {
        closeCustomAssignmentModal();
        loadData();
      });
    });
  } catch (err) {
    if (errorEl) errorEl.textContent = tr('customNameRequired');
  }
}

function deleteCustomAssignment(courseId, assignmentId) {
  if (!confirm(tr('confirmDeleteCustom'))) return;
  chrome.storage.local.get(['customAssignments'], (data) => {
    const customAssignments = data.customAssignments || {};
    const key = String(courseId);
    customAssignments[key] = (customAssignments[key] || [])
      .filter((assignment) => String(assignment.id) !== String(assignmentId));
    if (!customAssignments[key].length) delete customAssignments[key];
    chrome.storage.local.set({ customAssignments }, loadData);
  });
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

// ── 主要渲染 ──
function render(data) {
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
    const filtered = applyFilters(asgns);
    const pendingCount = filtered.length;
    const urgentCount = filtered.filter((a) => {
      if (!a.due_at || isSubmitted(a)) return false;
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
        <div class="week-task-card" data-course-id="${a._course.id}">
          <div class="week-task-course">${esc(getCourseName(a._course))}</div>
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
    renderGroup(tr('within7Days'), urgent, 'color-urgent', false),
    renderGroup(tr('within30Days'), soon, 'color-soon', false),
    renderGroup(tr('beyond30Days'), later, 'color-later', true)
  ].filter(h => h).join('');

  el.innerHTML = `
    <div class="week-panel">
      <div class="week-content">
        <div class="week-left">
          <div class="week-pie" style="${pieStyle}"></div>
          <div class="week-legend">
            <div class="week-legend-item">
              <span class="week-legend-dot" style="background: var(--orange);"></span>
              <span class="week-legend-label">${tr('within7Days')} (${urgent.length})</span>
            </div>
            <div class="week-legend-item">
              <span class="week-legend-dot" style="background: var(--warm);"></span>
              <span class="week-legend-label">${tr('within30Days')} (${soon.length})</span>
            </div>
            <div class="week-legend-item">
              <span class="week-legend-dot" style="background: var(--blue);"></span>
              <span class="week-legend-label">${tr('beyond30DaysShort')} (${later.length})</span>
            </div>
          </div>
        </div>
        <div class="week-right">
          ${groupsHTML || `<div class="week-group-empty">${tr('noTasks')}</div>`}
        </div>
      </div>
    </div>`;

  el.querySelectorAll('.week-task-card').forEach((card) => {
    card.addEventListener('click', () => {
      const courseId = parseInt(card.dataset.courseId, 10);
      if (!Number.isNaN(courseId)) {
        showCourseDetail(courseId, card);
      }
    });
  });
}

// ── 卡片格 ──
function renderCardGrid(courses, assignments, assignmentGroups) {
  const el = document.getElementById('main-section');

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
  if (pendingCount) metaParts.push(`${pendingCount}${tr('pendingItems')}`);

  const pageIdx = cardPages[course.id] || 0;
  const bottomHtml = renderCardBottom(course.id, filtered, pageIdx);

  return `
    <div class="course-card-grid" data-course-id="${course.id}">
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
    : `<div class="card-empty">${cardEmptyLabel()}</div>`;

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
    const detailBackBtn = document.getElementById('detail-back-btn');

    pageTabs.style.display = '';
    pageTabs.classList.remove('detail-mode');
    if (detailBackBtn) detailBackBtn.style.display = 'none';
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

    if (!_currentData.courseNames) _currentData.courseNames = {};
    if (newName && course && newName !== course.name) {
      _currentData.courseNames[courseId] = newName;
    } else {
      delete _currentData.courseNames[courseId];
    }

    chrome.storage.local.get(['courseNames'], (data) => {
      const names = data.courseNames || {};
      if (newName && course && newName !== course.name) {
        names[courseId] = newName;
      } else {
        delete names[courseId];
      }
      chrome.storage.local.set({ courseNames: names });
    });

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
  const detailMeta = `${pendingCount}${tr('pendingItems')}`;
  const detailUrgentBadge = urgentCount
    ? `<div class="card-badge-urgent">${urgentCount}${tr('urgentItems')}</div>`
    : `<div class="card-badge-urgent is-placeholder" aria-hidden="true">0${tr('urgentItems')}</div>`;

  const syllabusData = (_currentData.syllabusAnalysis || {})[course.id] || null;
  const weightPieHtml = renderWeightPie(groups, syllabusData, course.id);
  const gradeCalcHtml = renderGradeCalculator(course, asgns, groups, scores);
  const assignmentRows = filtered.map((a) => renderAssignmentRow(a, groups, course.id)).join('');

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
          ${renderSyllabusSection(course.id)}
        </div>
        <div class="detail-right-panel">
          ${gradeCalcHtml}
          <div class="detail-assignments-label">${currentListLabel()}</div>
          ${assignmentRows || `<div style="padding:12px 0;color:var(--mid);font-size:13px;">${noItemsLabel()}</div>`}
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

  document.getElementById('detail-back-btn').addEventListener('click', showGridView);

  el.querySelectorAll('.assignment-item').forEach((item) => {
    item.addEventListener('click', () => {
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

  el.querySelectorAll('.btn-syllabus-analyze').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cid = parseInt(btn.dataset.courseId, 10);
      const force = btn.dataset.force === 'true';
      const section = document.getElementById(`syllabus-section-${cid}`);
      if (section) section.innerHTML = `<div class="syllabus-loading">${tr('analyzingShort')}</div>`;
      chrome.runtime.sendMessage({ type: 'ANALYZE_SYLLABUS', courseId: cid, force }, (res) => {
        if (res && res.success) {
          if (!_currentData.syllabusAnalysis) _currentData.syllabusAnalysis = {};
          _currentData.syllabusAnalysis[cid] = { timestamp: new Date().toISOString(), ...res.result };
          // Re-render entire detail section so pie chart updates
          const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
          const course = courses.find((c) => c.id === cid);
          if (course) renderCourseDetailSection(course, assignments[cid] || [], assignmentGroups[cid] || [], scores);
        } else {
          const msg = res && res.error === 'NO_API_KEY'
            ? tr('noApiKeyShort')
            : res && res.error === 'NO_MODEL_ID'
              ? tr('noModelIdShort')
              : tr('analysisError');
          if (section) section.innerHTML = `<div class="syllabus-empty">${msg}</div><button class="btn-syllabus-analyze" data-course-id="${cid}">${tr('retry')}</button>`;
        }
      });
    });
  });

  el.querySelectorAll('.btn-edit-weights').forEach((btn) => {
    btn.addEventListener('click', () => {
      openWeightEditModal(parseInt(btn.dataset.courseId, 10));
    });
  });
}


// ── Weight Pie Chart ──
const EDIT_WEIGHT_BTN = (courseId) => `
  <button class="btn-edit-weights" data-course-id="${courseId}">
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
    ${tr('editWeight')}
  </button>`;

function renderWeightPie(groups, syllabusData, courseId) {
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
          <div class="detail-pie" style="background: conic-gradient(${gradientParts});"></div>
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
        <div class="detail-pie" style="background: conic-gradient(${gradientParts});"></div>
        <div class="detail-pie-legend">${legend}</div>
        ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
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
          ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
        </div>`;
    }
  }

  // No data
  return `
    <div class="detail-weight-pie-container">
      <div class="detail-pie" style="background: var(--border);"></div>
      <div class="detail-pie-label">${tr('noGradeInfo')}</div>
      ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
    </div>`;
}

// ── Syllabus Section ──
function renderSyllabusSection(courseId) {
  return `<div class="syllabus-section" id="syllabus-section-${courseId}"></div>`;
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
        <span class="grade-calc-title">${tr('gradeCalcTitle')}</span>
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
  const desc = a.description ? stripHtml(a.description) : tr('noDesc');
  const isCustom = !!a._isCustom;
  const titleHtml = isCustom
    ? `<span>${esc(a.name)}</span>`
    : `<span class="assignment-title-link" data-assignment-id="${a.id}" data-course-id="${courseId}">${esc(a.name)}</span>`;
  const customLabel = isCustom ? `<div class="custom-assignment-label">${tr('customAssignment')}</div>` : '';

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
    <div class="assignment-item${submitted ? ' submitted' : ''}${isCustom ? ' custom-assignment' : ''}">
      <div class="assignment-left">
        <div class="assignment-title">${titleHtml}</div>
        ${customLabel}
        ${groupName ? `<div class="assignment-group">${esc(groupName)}</div>` : ''}
      </div>
      <div class="assignment-right">
        <div class="due-label ${uClass}">${formatDue(a.due_at)}</div>
        ${gradeHtml}
        ${submitted ? `<div class="submitted-badge">${tr('submittedBadge')}</div>` : ''}
        ${isCustom
          ? `<button class="btn-delete-custom-assignment" title="${tr('deleteCustomTitle')}" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}">✕</button>`
          : ''}
      </div>
    </div>
    <div class="assignment-desc">
      <div class="assignment-desc-inner">${esc(desc)}</div>
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

// ── 頁面切換 ──
document.querySelectorAll('.page-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    switchPage(tab.dataset.page);
  });
});

// ── 查看已繳交 ──
document.getElementById('btn-show-submitted').addEventListener('click', (e) => {
  showSubmitted = !showSubmitted;
  e.currentTarget.classList.toggle('active', showSubmitted);
  loadData();
});

// ── 同步按鈕 ──
document.getElementById('sync-btn').addEventListener('click', () => {
  const btn = document.getElementById('sync-btn');
  btn.innerHTML = '<span class="sync-dots"><span></span><span></span><span></span></span>';
  btn.disabled = true;
  chrome.runtime.sendMessage({ type: 'SYNC' }, () => {
    btn.textContent = tr('sync');
    btn.disabled = false;
    loadData();
  });
});

// ── 讀取資料 ──
function loadData() {
  chrome.storage.local.get(
    ['lastSync', 'schoolName', 'canvasBaseUrl', 'courses', 'assignments', 'customAssignments', 'assignmentGroups', 'scores', 'files', 'analysis', 'milestoneChecks', 'syllabusAnalysis', 'courseNames', 'customWeights'],
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
        files: data.files || {},
        analysis: data.analysis || {},
        milestoneChecks: data.milestoneChecks || {},
        syllabusAnalysis: data.syllabusAnalysis || {},
        courseNames: data.courseNames || {},
        customAssignments: data.customAssignments || {},
      });
    }
  );
}

// ── 深色模式 ──
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function updateThemeMenuLabel() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('menu-theme-toggle');
  if (!btn) return;
  btn.textContent = isDark ? tr('themeLight') : tr('themeDark');
}

chrome.storage.local.get(['darkMode', 'uiLanguage'], (data) => {
  _uiLanguage = data.uiLanguage || 'zh-TW';
  applyTheme(!!data.darkMode);
  applyUILanguage();
  updateThemeMenuLabel();
});

const settingsMenuBtn = document.getElementById('settings-menu-btn');
const settingsMenu = document.getElementById('settings-menu');
const menuThemeToggle = document.getElementById('menu-theme-toggle');
const menuOpenApiSettings = document.getElementById('menu-open-api-settings');
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

if (menuThemeToggle) {
  menuThemeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
    chrome.storage.local.set({ darkMode: !isDark });
    updateThemeMenuLabel();
    if (settingsMenu) settingsMenu.classList.remove('open');
    if (settingsMenuBtn) settingsMenuBtn.classList.remove('open');
    const menuLanguageLabel = document.getElementById('menu-language-label');
    if (menuLanguageLabel) menuLanguageLabel.classList.remove('submenu-open');
  });
}

if (menuOpenApiSettings) {
  menuOpenApiSettings.addEventListener('click', () => {
    const url = chrome.runtime.getURL('settings.html');
    chrome.tabs.create({ url });
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
document.getElementById('welcome-api-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});
document.getElementById('welcome-canvas-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  const base = _currentData.canvasBaseUrl || '';
  if (base) chrome.tabs.create({ url: base });
});

// Delegate: overlay background click to close, data-wgo step nav, dot clicks
document.getElementById('welcome-overlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('welcome-overlay')) { closeWelcomeModal(); return; }
  const btn = e.target.closest('[data-wgo]');
  if (btn) { welcomeGoStep(+btn.dataset.wgo); return; }
  const dot = e.target.closest('.welcome-dot[data-wstep]');
  if (dot) welcomeGoStep(+dot.dataset.wstep);
});

// Open on first install (URL param ?welcome=1)
if (new URLSearchParams(location.search).get('welcome') === '1') {
  openWelcomeModal();
}

loadData();

// ── Weight Edit Modal ──
let _weightEditCourseId = null;

function openWeightEditModal(courseId) {
  _weightEditCourseId = courseId;

  const custom = (_currentData.customWeights || {})[courseId];
  const groups = (_currentData.assignmentGroups || {})[courseId] || [];
  const syllabus = (_currentData.syllabusAnalysis || {})[courseId];

  let items = [];
  if (custom && custom.length > 0) {
    items = custom.map((c) => ({ name: c.name, weight: c.weight }));
  } else if (groups.some((g) => g.group_weight)) {
    items = groups.filter((g) => g.group_weight).map((g) => ({ name: g.name, weight: g.group_weight }));
  } else if (syllabus && syllabus.found && syllabus.components) {
    items = syllabus.components.map((c) => ({ name: c.name, weight: c.weight }));
  }

  renderWeightEditList(items);
  document.getElementById('weight-edit-overlay').classList.add('open');
}

function renderWeightEditList(items) {
  const list = document.getElementById('weight-edit-list');
  list.innerHTML = items.map((item, i) => `
    <div class="weight-edit-row" data-index="${i}">
      <div class="weight-edit-color" style="background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>
      <input class="weight-edit-name" type="text" value="${esc(item.name)}" placeholder="${tr('weightItemName')}">
      <input class="weight-edit-pct" type="number" value="${item.weight}" min="0" max="100" step="0.1">
      <button class="weight-edit-del" data-index="${i}">✕</button>
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
    <button class="weight-edit-del">✕</button>`;
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

document.getElementById('weight-edit-ai-btn').addEventListener('click', () => {
  const btn = document.getElementById('weight-edit-ai-btn');
  btn.classList.add('loading');
  btn.innerHTML = `<span class="sync-dots"><span></span><span></span><span></span></span> ${tr('analyzeBtn')}`;

  chrome.runtime.sendMessage({ type: 'ANALYZE_SYLLABUS', courseId: _weightEditCourseId, force: true }, (res) => {
    btn.classList.remove('loading');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><path d="M18 2v4h4"/></svg> ${tr('analyzeBtn')}`;

    if (res && res.success && res.result && res.result.components) {
      if (!_currentData.syllabusAnalysis) _currentData.syllabusAnalysis = {};
      _currentData.syllabusAnalysis[_weightEditCourseId] = { timestamp: new Date().toISOString(), ...res.result };
      const items = res.result.components.map((c) => ({ name: c.name, weight: c.weight }));
      renderWeightEditList(items);
    }
  });
});

document.getElementById('weight-edit-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});


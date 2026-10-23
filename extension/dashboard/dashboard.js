// ── 顏色池（評分比重分組用） ──
const GROUP_COLORS = [
  '#d97757', '#6a9bcc', '#788c5d', '#b09050',
  '#a86070', '#7a9ba8', '#b08060', '#6a7c5d',
];

// 拖曳握把（grip-vertical，用於可拖曳的考試/簽到列：升級/降級）；緊跟在作業名稱後、為唯一拖曳起點。
// 是真的 <button>（#6）：鍵盤 Tab 停得到、Enter／Space 直接移動（keyboardMove），名稱說明按下去會去哪
// dir：'promote'（已隱藏 → 作業清單）｜'demote'（作業清單 → 已隱藏），與列的 data-drag 相同
const DRAG_GRIP_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>';
function dragGripHtml(dir) {
  const label = tr(dir === 'promote' ? 'a11yShowItem' : 'a11yHideItem');
  return `<button type="button" class="drag-grip" aria-label="${esc(label)}">${DRAG_GRIP_SVG}</button>`;
}

// ── 動效 token（鏡像 index.html :root 的 --t-*／--spring-*／--reflow／--ring，見 docs/motion-review-2026-10-22.md #39）──
// 每個 token 都是 { duration(ms), easing }：WAAPI 直接當 options 用 el.animate(kf, MOTION.reveal)；
// inline transition 用 cssTransition('transform', MOTION.reflow)；setTimeout 讀 .duration。
// 數值必須與 CSS 同步：改一邊要改另一邊（不要在呼叫端另寫時長／曲線）。
const _EASE_COLOR = 'cubic-bezier(0.25, 0.1, 0.25, 1)';   // ease.color
const _EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';       // ease.out
const _EASE_SOFT = 'cubic-bezier(0.215, 0.61, 0.355, 1)'; // ease.soft
// spring.highlight 500/40（--spring-highlight）；spring.reflow 同為 500/40（--reflow），共用同一組值
const _SPRING_HIGHLIGHT = Object.freeze({ duration: 300, easing: 'linear(0, 0.0233, 0.0813, 0.1598, 0.2483, 0.3396, 0.4288, 0.5126, 0.5894, 0.658, 0.7183, 0.7704, 0.8149, 0.8524, 0.8837, 0.9094, 0.9303, 0.9472, 0.9607, 0.9713, 0.9796, 0.986, 0.9908, 0.9944, 0.997, 0.9988, 1.0001, 1.001, 1.0015, 1)' });
const MOTION = Object.freeze({
  color: Object.freeze({ duration: 200, easing: _EASE_COLOR }),      // --t-color：hover 換色
  fade: Object.freeze({ duration: 200, easing: _EASE_OUT }),         // --t-fade：原地淡入淡出
  swap: Object.freeze({ duration: 150, easing: _EASE_OUT }),         // --t-swap：兩個標籤原地互換
  reveal: Object.freeze({ duration: 300, easing: _EASE_OUT }),       // --t-reveal：落地後才出現的標籤
  menu: Object.freeze({ duration: 220, easing: _EASE_SOFT }),        // --t-menu
  disclosure: Object.freeze({ duration: 350, easing: _EASE_SOFT }),  // --t-disclosure
  // transition.panelIn（無 CSS 對應）：新頁在舊頁離開後淡入
  panelIn: Object.freeze({ duration: 300, easing: 'cubic-bezier(0.25, 0.1, 0.35, 1)' }),
  // spring.press 550/30
  press: Object.freeze({ duration: 400, easing: 'linear(0, 0.0261, 0.0935, 0.188, 0.2977, 0.4132, 0.5271, 0.6343, 0.7313, 0.8159, 0.8872, 0.9452, 0.9906, 1.0244, 1.048, 1.063, 1.0709, 1.0732, 1.0713, 1.0663, 1.0594, 1.0514, 1.0429, 1.0346, 1.0267, 1.0196, 1.0134, 1.0082, 1.004, 1.0007, 0.9982, 0.9965, 1, 0.9948, 0.9946, 0.9948, 1, 1, 1, 1)' }),
  highlight: _SPRING_HIGHLIGHT,                                      // --spring-highlight：跟隨指標的 highlight
  reflow: _SPRING_HIGHLIGHT,                                         // --reflow：補位、落點
  // spring.selection 300/30
  selection: Object.freeze({ duration: 500, easing: 'linear(0, 0.0141, 0.0509, 0.1035, 0.1663, 0.2349, 0.306, 0.3769, 0.4459, 0.5115, 0.573, 0.6297, 0.6814, 0.728, 0.7696, 0.8064, 0.8387, 0.8668, 0.8911, 0.9119, 0.9296, 0.9445, 0.957, 0.9673, 0.9758, 0.9827, 0.9882, 0.9926, 0.9961, 0.9987, 1.0007, 1.0021, 1.0031, 1.0038, 1.0041, 1, 1, 1, 1.004, 1.0038, 1.0035, 1.0032, 1.0029, 1.0026, 1.0023, 1.002, 1.0017, 1.0015, 1, 1)' }),
  ring: Object.freeze({ duration: 800, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }),      // --ring：進度環弧（使用者拍板）
  ringTick: Object.freeze({ duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }),  // --ring-tick：分子 tick
});

// inline transition 字串：cssTransition('opacity', MOTION.fade) → 'opacity 200ms cubic-bezier(...)'
function cssTransition(prop, token) {
  return `${prop} ${token.duration}ms ${token.easing}`;
}

// ── 減少動態（prefers-reduced-motion，#0）──
// CSS 端由 index.html 檔尾的 media 區塊處理；WAAPI、scrollTo、View Transition 共享元素命名、JS 寫的 transform
// 都是 CSS 管不到的，呼叫端自己讀 reduceMotion()：保留淡入淡出與顏色，拿掉位移、縮放、旋轉。
// 每次呼叫即時讀 media query，系統設定中途切換也跟得上。
const _reduceMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
function reduceMotion() {
  return _reduceMotionMq.matches;
}

// ── 螢幕閱讀器播報（#3）──
// 寫進頁面一開始就掛好的 #a11y-status（role=status、aria-live=polite）：只用動效呈現的結果
// （完成、撤銷、同步、拖曳升降級、全部完成）都要經這裡念出來。
// 先清空、50ms 後才寫入：同一句連播兩次（如連勾兩項）也會重念；短時間內連續呼叫只念最後一句。
let _announceTimer = 0;
function announce(text) {
  const region = document.getElementById('a11y-status');
  if (!region) return;
  clearTimeout(_announceTimer);
  region.textContent = '';
  _announceTimer = setTimeout(() => { region.textContent = text; }, 50);
}

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
    // 螢幕閱讀器播報（#3）：{name} 換成作業名稱
    a11yCompleted: '已完成「{name}」，1.5 秒內再按一次可撤銷',
    a11yUndone: '已撤銷',
    // 隱藏／還原的鍵盤路徑（#6）：握把按鈕名稱與移動後的播報
    a11yShowItem: '移回作業清單',
    a11yHideItem: '移到已隱藏',
    a11yMovedToList: '「{name}」已移回作業清單',
    a11yMovedToHidden: '「{name}」已移到已隱藏',
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
    a11yCompleted: '已完成「{name}」，1.5 秒内再按一次可撤销',
    a11yUndone: '已撤销',
    a11yShowItem: '移回作业清单',
    a11yHideItem: '移到已隐藏',
    a11yMovedToList: '「{name}」已移回作业清单',
    a11yMovedToHidden: '「{name}」已移到已隐藏',
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
    a11yCompleted: 'Completed “{name}”. Press again within 1.5 seconds to undo.',
    a11yUndone: 'Undone',
    a11yShowItem: 'Move back to list',
    a11yHideItem: 'Move to hidden',
    a11yMovedToList: '“{name}” moved back to the list',
    a11yMovedToHidden: '“{name}” moved to hidden',
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
  _welcomeUpdateButtons(_welcomeStep);
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
  // 語言選單：就地改文字與 aria-checked（子選單節點只有一份、listener 只綁一次；不重建就不會留下孤兒節點，#10）
  setText('menu-language-text', 'languageLabel');
  setText('menu-language-zh-tw', 'langZhTw');
  setText('menu-language-zh-cn', 'langZhCn');
  setText('menu-language-en', 'langEn');
  document.querySelectorAll('#menu-language-submenu [data-lang]').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.lang === _uiLanguage));
  });
}

// ── 語言子選單（#10／N1）──
// 點擊開關：「語言」按一下打開、再按一下（或選好語言、點選單外、Esc／←、母選單關閉）才收；
// 不再靠 hover＋180ms 延遲關閉——滑鼠不小心移開不會把它關掉，觸控點一下也不會卡住。
// 打開（點擊、Enter／Space／→）時焦點放到第一個語言；Tab／Shift+Tab 與 ↑↓／Home／End 在語言間移動，
// 走出最後一個（Tab）或第一個（Shift+Tab）就收回、接回母選單的順序；Esc／← 收回並把焦點還給「語言」。
// 只在載入時綁一次（applyUILanguage 只改文字）
function languageSubmenuEls() {
  return {
    label: document.getElementById('menu-language-label'),
    submenu: document.getElementById('menu-language-submenu'),
  };
}

function isLanguageSubmenuOpen() {
  const { submenu } = languageSubmenuEls();
  return !!(submenu && submenu.classList.contains('submenu-visible'));
}

function openLanguageSubmenu({ focusItem = false } = {}) {
  const { label, submenu } = languageSubmenuEls();
  if (!label || !submenu) return;
  // 依「語言」那一列定位（fixed，相對 viewport）：右側 8px、垂直置中
  const rect = label.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  submenu.style.top = `${midY - submenu.offsetHeight / 2}px`;
  submenu.style.left = `${rect.right + 8}px`;
  submenu.classList.add('submenu-visible');
  label.setAttribute('aria-expanded', 'true');
  if (focusItem) {
    // 第一個語言（menu button 慣例；目前的語言另有 aria-checked）。.submenu-visible 的 visibility 是 0s 切換，這裡已經 focus 得上去
    const first = submenu.querySelector('[role="menuitemradio"]');
    if (first) first.focus();
  }
}

function closeLanguageSubmenu({ refocus = false } = {}) {
  const { label, submenu } = languageSubmenuEls();
  if (!submenu) return;
  const hadFocus = submenu.contains(document.activeElement);
  submenu.classList.remove('submenu-visible');
  if (label) label.setAttribute('aria-expanded', 'false');
  // 焦點在子選單裡時一定要搬走：收合淡出後它是 visibility:hidden，焦點會掉到 <body>
  if ((refocus || hadFocus) && label && label.offsetParent !== null) label.focus();
}

// 統一的設定選單關閉（setLang、外部點擊、齒輪、Claude 用量、使用教學共用）：母選單與 <body> 層的子選單一起收。
// 焦點原本在選單或子選單裡（鍵盤操作）→ 還給 ⚙，否則它會留在 display:none 的項目上、或隨節點消失掉到 <body>
function closeSettingsMenu() {
  const menu = document.getElementById('settings-menu');
  const btn = document.getElementById('settings-menu-btn');
  const { submenu } = languageSubmenuEls();
  const active = document.activeElement;
  const hadFocus = !!active && ((menu && menu.contains(active)) || (submenu && submenu.contains(active)));
  if (submenu) submenu.classList.remove('submenu-visible');
  const { label } = languageSubmenuEls();
  if (label) label.setAttribute('aria-expanded', 'false');
  if (menu) menu.classList.remove('open');
  if (btn) btn.classList.remove('open');
  if (hadFocus && btn) btn.focus();
}

function bindLanguageMenuActions() {
  const { label, submenu } = languageSubmenuEls();
  if (!label || !submenu) return;

  const setLang = (lang) => {
    _uiLanguage = lang;
    chrome.storage.local.set({ uiLanguage: lang });
    applyUILanguage();
    updateClaudeUsageMenuLabel();
    closeSettingsMenu();
    loadData();
  };

  submenu.querySelectorAll('[data-lang]').forEach((b) => {
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });

  // click 涵蓋滑鼠、觸控與鍵盤的 Enter／Space（按鈕原生）：開著就收、收著就開並把焦點放進子選單
  // （滑鼠點擊後的程式 focus 不會畫焦點框；接著按方向鍵也直接在語言間移動）
  label.addEventListener('click', () => {
    if (isLanguageSubmenuOpen()) closeLanguageSubmenu();
    else openLanguageSubmenu({ focusItem: true });
  });
  label.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      openLanguageSubmenu({ focusItem: true });
    } else if (e.key === 'ArrowLeft' && isLanguageSubmenuOpen()) {
      e.preventDefault();
      closeLanguageSubmenu({ refocus: true });
    }
  });

  submenu.addEventListener('keydown', (e) => {
    const items = [...submenu.querySelectorAll('[role="menuitemradio"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();   // 不讓全域 Esc（關 overlay）也處理這一下
      closeLanguageSubmenu({ refocus: true });
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      items[(i + step + items.length) % items.length]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      (e.key === 'Home' ? items[0] : items[items.length - 1])?.focus();
    } else if (e.key === 'Tab') {
      // 語言之間照 Tab 順序走（瀏覽器原生）；走出邊界時子選單在 <body> 層、DOM 順序不在選單裡 →
      // 收回並接回母選單：Tab 出最後一個 → 「語言」的下一項，Shift+Tab 出第一個 → 「語言」
      const out = e.shiftKey ? i <= 0 : i >= items.length - 1;
      if (!out) return;
      e.preventDefault();
      closeLanguageSubmenu({ refocus: true });
      if (!e.shiftKey) {
        const next = label.nextElementSibling;
        if (next && typeof next.focus === 'function') next.focus();
      }
    }
  });
}

bindLanguageMenuActions();

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

// ── 完成過渡動畫（撤銷窗 → 碎點爆＋原地出場＋FLIP 補位）狀態 ──
const COMPLETE_DELAY_MS = 1500;       // 勾選後的撤銷窗口（毫秒）
const EXIT_SCALE = 0.96;              // 離場縮到的比例（list recipe：淡出＋縮到 0.96）
const _completeTimers = {};           // assignmentId -> 撤銷窗 setTimeout id（每項各自一個，互不清除）

// 清掉所有殘留完成計時器（整段重繪/切頁前呼叫，course detail 與 week 卡共用；完成流程本身不呼叫）
function clearCompleteTimers() {
  Object.keys(_completeTimers).forEach((k) => { clearTimeout(_completeTimers[k]); delete _completeTimers[k]; });
}

// 「已落地」的完成：撤銷窗內（_completeTimers 有這個 id）的項目畫面上還在清單裡，
// 計數、組標題、進度環、側欄數字都先不算它完成；撤銷窗結束、節點離開清單的那一刻才一起更新（#12）。
// 整段重繪前一律 clearCompleteTimers()，所以重繪時與 isDone 相同。
function isDoneLanded(a) {
  return isDone(a) && !Object.prototype.hasOwnProperty.call(_completeTimers, String(a.id));
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
// （分子只算已落地的完成：撤銷窗內的項目還在清單上，弧等它離場才前進）
function computeNearProgress(courses, assignments) {
  const items = [];
  for (const course of courses) {
    for (const a of (assignments[course.id] || [])) items.push(a);
  }
  const nearItems = items.filter((a) => !isHidden(a) && isNearAssignment(a));
  const nearTotal = nearItems.length;
  const nearDone = nearItems.filter((a) => isDoneLanded(a)).length;
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
  // 撤銷窗內的項目仍算在清單裡（isDoneLanded），完成後就地更新的計數才會與畫面一致
  if (showSubmitted) {
    result = result.filter((a) => isDoneLanded(a));
  } else {
    result = result.filter((a) => !isDoneLanded(a));
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
          // 重建會拆掉 modal 剛把焦點還回去的那顆「編輯」→ 用 id 找回同一列的新按鈕（換了課程就不在這頁，退到清單標題）
          const cssId = CSS.escape(String(updated.id));
          loadData(() => refocusInDetail([`.btn-edit-custom-assignment[data-assignment-id="${cssId}"]`]));
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
  // 刪除後焦點交給鄰居（#8）：先記下這一列的下一列（沒有就上一列）的 id，重建後用 id 找回它的勾選圈
  const cssId = CSS.escape(String(assignmentId));
  const delBtn = document.querySelector(`#course-detail-container .btn-delete-custom-assignment[data-assignment-id="${cssId}"]`);
  const row = delBtn && delBtn.closest('.assignment-item');
  const rows = row ? [...row.parentElement.querySelectorAll('.assignment-item')] : [];
  const i = rows.indexOf(row);
  const neighbour = i >= 0 ? (rows[i + 1] || rows[i - 1]) : null;
  const neighbourChk = neighbour && neighbour.querySelector('.assignment-check');
  const neighbourSel = neighbourChk
    ? `.detail-assignments-list .assignment-check[data-assignment-id="${CSS.escape(neighbourChk.dataset.assignmentId)}"]`
    : null;
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
        chrome.storage.local.set({ customAssignments }, () => loadData(() => refocusInDetail([neighbourSel])));
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

  // 重建會拆掉持有焦點的側欄項（完成落地、改名、升降級都會呼叫這裡）→ 重建後把焦點還給同一課的新按鈕（#8）
  const focusedCourse = navEl.contains(document.activeElement) ? document.activeElement.dataset.targetCourse : null;

  navEl.innerHTML = sorted.map((c) => {
    const asgns = assignments[c.id] || [];
    const filtered = applyFilters(asgns);
    const pendingCount = filtered.length;
    const urgentCount = filtered.filter((a) => {
      if (!a.due_at || isDoneLanded(a)) return false;
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

  if (focusedCourse) {
    const again = navEl.querySelector(`.nav-course-item[data-target-course="${focusedCourse}"]`);
    if (again) again.focus({ preventScroll: true });
  }
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
      if (isDoneLanded(a)) { doneCount++; continue; }  // 撤銷窗內的仍算待辦（卡片還在清單上）
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

// ── 學期待辦 ↔ 課程 切換（#15）──
// 直接渲染真的新頁（listener 第一幀就在，切換途中點卡片照常生效），只讓進場那一頁淡入＋橫移 shift.tabs（12px），
// transition.panelIn 300ms。不做字串拷貝、不包 slider、不留 timer、不用 rAF 觸發（分頁隱藏時 rAF 暫停會卡在起點）。
// 連點：新的一次先 cancel 上一段，DOM 永遠只有一頁。不設 fill：動畫結束（或分頁在背景時跑完）一定落在最終狀態。
// 具名 deviation：tabs recipe 的 panelOut（舊頁 150ms 淡出）刻意拿掉——常用導航不等出場。
// 方向保留：去課程從右邊進、回學期待辦從左邊進。減少動態：不橫移，只淡入（#0）。
const SHIFT_TABS_PX = 12;   // shift.tabs
let _pageAnim = null;
function switchPage(page) {
  if (page === currentPage) return;
  if (!_currentData.courses) return;

  const dir = page === 'courses' ? 1 : -1;
  currentPage = page;
  updateSideNav();
  syncHistory();   // 週待辦↔課程 為橫向切換：更新目前 entry，不疊返回步

  if (_pageAnim) { _pageAnim.cancel(); _pageAnim = null; }
  const { courses = [], assignments = {}, assignmentGroups = {} } = _currentData;
  if (page === 'week') renderWeekSection(courses, assignments);
  else renderCardGrid(courses, assignments, assignmentGroups);

  const entering = document.getElementById('main-section').firstElementChild;
  if (!entering) return;
  const from = reduceMotion() ? 'none' : `translateX(${SHIFT_TABS_PX * dir}px)`;
  _pageAnim = entering.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], MOTION.panelIn);
}

// ── 本週待辦 ──
// 進度環分子上次渲染值：分子有變才給數字 tick 動畫（首次渲染不 tick）
let _prevRingDone = null;

// 進度環 SVG 幾何：158 外徑、20 線寬 → 半徑 69，全周長 2πr
const RING_R = 69;
const RING_C = 2 * Math.PI * RING_R;

// ── 進度環「落點迸發」慶祝（見 spec 2026-07-23 後記）──
// 只在最後一項近期作業落地（撤銷窗結束、離開清單）、弧合攏的瞬間觸發（updateWeekRing）；
// 之後維持全部完成狀態的重繪只靜態顯示「全部完成」，不重播。
// 內容：環微彈＋分子 pop、多色碎點沿圓周外迸（切線初速＝旋轉能量）、中心淡入「全部完成」
function celebrateRingArrival(ring) {
  if (!ring || !ring.isConnected) return;   // 等待落地期間被重繪換掉 → 略過
  // 中心換字淡入「全部完成」（transition.reveal）：減少動態時也保留，它是唯一的完成訊號；螢幕閱讀器同步念出（#3）
  const cap = ring.querySelector('.wk-ring-cap');
  if (cap) {
    cap.textContent = tr('weekAllDoneLabel');
    cap.animate([{ opacity: 0 }, { opacity: 1 }], MOTION.reveal);
  }
  announce(tr('weekAllDoneLabel'));
  if (reduceMotion()) return;   // 減少動態：環與分子不縮放、不迸粒子（#0）
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

// 週待辦五組（順序＝畫面順序）：data-group key → 標題 i18n key、標題色、摘要列色（整段渲染與完成後就地更新共用）
const WEEK_GROUPS = [
  { key: 'overdue', label: 'overdueGroup', color: 'color-overdue', sum: 'is-overdue' },
  { key: 'urgent', label: 'within7Days', color: 'color-urgent', sum: 'is-urgent' },
  { key: 'soon', label: 'within30Days', color: 'color-soon', sum: 'is-soon' },
  { key: 'later', label: 'beyond30Days', color: 'color-later', sum: 'is-later' },
  { key: 'nodue', label: 'noDueDate', color: 'color-nodue', sum: 'is-nodue' },
];

function weekGroupTitleText(key, n) {
  const g = WEEK_GROUPS.find((x) => x.key === key);
  return `${g ? tr(g.label) : ''} (${n})`;
}

// 截止日期與「↩ 撤銷」從一開始就疊在同一格（.due-slot）：撤銷窗只切 .completing 原地淡換，
// 不插入／移除節點、不 display:none，列與卡片尺寸完全不變，其他項目不被推動（#13）
function dueSlotHtml(labelHtml) {
  return `<div class="due-slot">${labelHtml}<div class="complete-undo-hint" aria-hidden="true">↩ ${esc(tr('undoComplete'))}</div></div>`;
}

function renderWeekSection(courses, assignments) {
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
  // 全部完成狀態：整段重繪一律靜態顯示「全部完成」；落地瞬間的慶祝只發生在完成後的就地更新（updateWeekRing）
  const allNearDone = nearTotal > 0 && nearDone === nearTotal;
  const capText = allNearDone ? tr('weekAllDoneLabel') : tr('weekDoneLabel');

  const buckets = { overdue, urgent, soon, later, nodue: noDue };

  // 分級摘要列（只顯示 count>0；逾期紅色，點擊跳到右側對應區塊）
  const sumRows = WEEK_GROUPS.filter((g) => buckets[g.key].length > 0)
    .map((g) => `<button class="wk-sum-row ${g.sum}" data-scroll-group="${g.key}"><span class="wk-sum-num">${buckets[g.key].length}</span><span class="wk-sum-label">${esc(tr(g.label))}</span></button>`)
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
        ${dueSlotHtml(`<div class="week-task-due ${uClass}">${formatDue(a.due_at)}</div>`)}
      </div>`;
  };

  const renderGroup = (g) => {
    const list = buckets[g.key];
    if (list.length === 0) return '';
    return `
      <div class="week-group" data-group="${g.key}">
        <div class="week-group-title ${g.color}" tabindex="-1">${weekGroupTitleText(g.key, list.length)}</div>
        <div class="week-task-grid">
          ${list.map(renderWeekCard).join('')}
        </div>
      </div>`;
  };

  // 逾期組置頂；分隔線只夾在相鄰的非空組之間
  const groupsHTML = WEEK_GROUPS.map(renderGroup).filter(h => h).join('<div class="week-divider"></div>');

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

  // 勾選圈：依 Canvas 事實翻轉，未完成→完成走 1.5 秒撤銷窗口動畫（stopPropagation 不開詳情）
  el.querySelectorAll('.week-task-check').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.week-task-card');
      const id = String(btn.dataset.assignmentId);
      const cid = parseInt(btn.dataset.courseId, 10);
      if (card && card.classList.contains('bursting')) return;        // 爆開中不互動
      if (card && card.classList.contains('completing')) {            // 撤銷窗口內 → 取消
        cancelCompleteWeek(card, id);
        return;
      }
      toggleCompletion(btn.dataset.extDone === 'true', id);
      const a = ((_currentData.assignments || {})[cid] || []).find((x) => String(x.id) === id);
      const nowDone = a ? isDone(a) : false;
      if (nowDone && card) {
        // 慶祝不在點擊當下決定：連勾最後幾項時要等最後一項落地才判斷（updateWeekRing）
        beginCompleteWeek(card, id);
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
        if (chk) cancelCompleteWeek(card, String(chk.dataset.assignmentId));
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
      // 焦點跟著捲動走（#33，A17）：開始捲動時就交給目標組標題（tabindex=-1，不進 Tab 順序）。
      // 螢幕閱讀器念出「7 天內 (3)」，下一個 Tab 到該組第一張卡；preventScroll，捲動交給下面的 scrollTo
      const title = target.querySelector('.week-group-title');
      if (title) title.focus({ preventScroll: true });
      // 對齊到 padding 內緣（.week-right 上方留給焦點框的 4px 不捲掉，組標題的框才不會被裁）
      const padTop = parseFloat(getComputedStyle(right).paddingTop) || 0;
      const delta = target.getBoundingClientRect().top - right.getBoundingClientRect().top + right.scrollTop - padTop;
      right.scrollTo({ top: delta, behavior: reduceMotion() ? 'auto' : 'smooth' });
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

  bindCardPager(el);
}

// 分頁鈕 listener（renderCardGrid 綁一次；換頁時按鈕節點保留，不必重綁，見 updateCardPage）
function bindCardPager(root) {
  root.querySelectorAll('.card-pager-btn').forEach((btn) => {
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

  const rows = renderCardRows(visible);

  const pager = totalPages > 1 ? `
    <div class="card-pager">
      <button class="card-pager-btn" data-course-id="${courseId}" data-dir="-1"${page === 0 ? ' disabled' : ''}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
      <span class="card-pager-info">${page + 1} / ${totalPages}</span>
      <button class="card-pager-btn" data-course-id="${courseId}" data-dir="1"${page >= totalPages - 1 ? ' disabled' : ''}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
    </div>` : '';

  return `<div class="card-bottom"><div class="card-rows-container">${rows}</div>${pager}</div>`;
}

// 卡片作業列（renderCardBottom 首次渲染與 updateCardPage 換頁共用）
function renderCardRows(visible) {
  return visible.length
    ? visible.map((a) => {
        const uClass = urgencyClass(a.due_at, isExam(a), isDone(a));
        return `
          <div class="card-row">
            <div class="card-row-title">${esc(a.name)}</div>
            <div class="card-row-due ${uClass}">${dueLabelFor(a)}</div>
          </div>`;
      }).join('')
    : `<div class="card-empty">${cardEmptyLabel()}</div>`;
}

// ── 分頁切換（局部重繪） ──
// 只換 .card-rows-container 的內容；頁碼文字與兩顆分頁鈕的 disabled 就地更新——分頁鈕節點保留，
// 鍵盤可以連按 Enter 一路翻頁（整段 outerHTML 重建會把持有焦點的按鈕拆掉、焦點掉到 <body>，#8）。
// listener 在 renderCardGrid 綁一次就好。翻到第一頁／最後一頁時，持有焦點的那顆會變 disabled → 焦點先交給另一顆
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
  const rowsEl = card.querySelector('.card-rows-container');
  const prevBtn = card.querySelector('.card-pager-btn[data-dir="-1"]');
  const nextBtn = card.querySelector('.card-pager-btn[data-dir="1"]');
  const info = card.querySelector('.card-pager-info');
  if (!rowsEl || !prevBtn || !nextBtn) {
    // 結構不完整（理論上不會：有分頁鈕才會走到這裡）→ 退回整段重建並重綁
    const bottom = card.querySelector('.card-bottom');
    if (!bottom) return;
    bottom.outerHTML = renderCardBottom(courseId, filtered, next);
    bindCardPager(card);
    return;
  }
  rowsEl.innerHTML = renderCardRows(filtered.slice(next * pageSize, (next + 1) * pageSize));
  if (info) info.textContent = `${next + 1} / ${totalPages}`;
  const prevOff = next === 0;
  const nextOff = next >= totalPages - 1;
  const active = document.activeElement;
  if (prevOff && active === prevBtn) { nextBtn.disabled = false; nextBtn.focus({ preventScroll: true }); }
  if (nextOff && active === nextBtn) { prevBtn.disabled = false; prevBtn.focus({ preventScroll: true }); }
  prevBtn.disabled = prevOff;
  nextBtn.disabled = nextOff;
  // 只剩一頁（兩顆都 disabled）時退回卡片本身
  const now = document.activeElement;
  if ((now === prevBtn || now === nextBtn) && now.disabled) card.focus({ preventScroll: true });
}

// View Transition 共享元素命名（卡片 ↔ 詳情 morph）。減少動態時不命名：沒有 morph 的位移與縮放，
// 只剩 root 的 opacity crossfade（#0；不要改用 group animation-duration:0，old 快照仍會被放大後淡出）
function setMorphName(el, name) {
  if (el && !reduceMotion()) el.style.viewTransitionName = name;
}

// 卡片端命名（開詳情的 FIRST、回清單的 LAST 共用）。
// 課程卡：外框＋課號／課名／badge／meta 各自對到詳情的同一個東西。
// 週卡（#17）：卡片本身＝course-shell，課名 .week-task-course＝course-name（課名對課名）；
// 作業名不命名，跟著 course-shell 快照一起 crossfade；週卡沒有課號／badge／meta，詳情那幾個只有 new 端，自然淡入
function nameCardForMorph(cardEl) {
  const isWeek = cardEl.classList.contains('week-task-card');
  setMorphName(cardEl, 'course-shell');
  setMorphName(cardEl.querySelector(isWeek ? '.week-task-course' : '.card-name'), 'course-name');
  if (isWeek) return;
  setMorphName(cardEl.querySelector('.card-code'), 'course-code');
  setMorphName(cardEl.querySelector('.card-badge-urgent'), 'course-badge');
  setMorphName(cardEl.querySelector('.card-meta'), 'course-meta');
}

// 詳情端命名（開詳情的 LAST、回清單的 FIRST 共用）
function nameDetailForMorph(container) {
  setMorphName(container.querySelector('.course-detail-view'), 'course-shell');
  setMorphName(container.querySelector('.detail-code'), 'course-code');
  setMorphName(container.querySelector('.detail-name'), 'course-name');
  setMorphName(container.querySelector('.card-badge-urgent'), 'course-badge');
  setMorphName(container.querySelector('.detail-meta'), 'course-meta');
}

// ── 卡片 ↔ 詳情 morph 的啟動與清理（#42）──
// 新的 startViewTransition 會 skip 上一段，上一段的 finished 在 microtask 裡 resolve——早於新的一段捕捉 old 狀態。
// 若上一段 finished 無條件清掉所有名字，morph 中途按 Back（或再點一張卡）時，新一段剛設好的 old 名字會被清掉，
// 回程退化成只有 new 的淡入。所以只有「目前這一段」結束時才清；已被下一段接手就把名字交給下一段管
let _morph = null;
function clearMorphNames() {
  document.querySelectorAll('[style*="view-transition-name"]').forEach((el) => {
    el.style.viewTransitionName = '';
  });
}
// 新的一段命名（FIRST）之前呼叫：上一段還在跑時，它 LAST 掛的名字還留在清單的卡上。
// 回程 morph 中途用鍵盤在「另一張」卡按 Enter，兩張卡都叫 course-shell → duplicate name，
// 整段 VT 被 skip（InvalidStateError）、硬切。先清掉再命名；與 startViewTransition 同一個 task，中間不會畫出任何一幀
function clearStaleMorphNames() {
  if (_morph) clearMorphNames();
}
function startMorph(update) {
  const t = document.startViewTransition(update);
  _morph = t;
  t.ready.catch(() => {});   // 被下一段 skip 時 ready 會 reject（AbortError），屬預期，不要變成未處理的 rejection
  t.finished.then(() => {
    if (_morph !== t) return;   // 已被下一段接手，名字交給它管
    _morph = null;
    clearMorphNames();
  });
  return t;
}

// ── 開詳情的來源（#2／#27）──
// 回清單時：焦點還給觸發的卡（或側欄項），週卡還在可視區內就 morph 回那張卡，週清單捲回開詳情前的位置。
// 存 selector／id、不存節點：回清單時整段重繪，節點都是新的。
//   focusSel     — 回清單後焦點的去處（找不到就退到 #page-title）
//   assignmentId — 從週卡開的才有：回程 morph 的目標週卡
//   weekScroll   — 離開清單那一刻 .week-right 的 scrollTop
let _detailOrigin = null;
function rememberDetailOrigin(courseId, cardEl) {
  const fromList = currentView !== 'course';
  const isWeekCard = !!cardEl && cardEl.classList.contains('week-task-card');
  const active = document.activeElement;
  const fromNav = !cardEl && !!active && !!active.closest && !!active.closest('.nav-course-item');
  let focusSel;
  if (isWeekCard) focusSel = `.week-task-card[data-assignment-id="${CSS.escape(String(cardEl.dataset.assignmentId))}"]`;
  else if (fromNav) focusSel = `.nav-course-item[data-target-course="${courseId}"]`;
  else focusSel = `.course-card-grid[data-course-id="${courseId}"]`;
  // 詳情內換課時清單是隱藏的（display:none 讀不到 scrollTop）：沿用第一次離開清單時記下的位置
  const weekRight = document.querySelector('#main-section .week-right');
  const weekScroll = fromList
    ? (weekRight ? weekRight.scrollTop : 0)
    : (_detailOrigin ? _detailOrigin.weekScroll : 0);
  _detailOrigin = {
    focusSel,
    assignmentId: isWeekCard ? String(cardEl.dataset.assignmentId) : null,
    weekScroll,
  };
}

// 開詳情後焦點落在詳情標題（#2，A17）：在 VT update callback 裡移（焦點跟著動效走，不等 finished）。
// .detail-name-text 是 tabindex=-1：只接受程式 focus、不進 Tab 順序；preventScroll 不打斷 morph。
// 程式 focus 在滑鼠點擊後不會觸發 :focus-visible，滑鼠使用者看不出差別
function focusDetailHeading(container) {
  const h = container.querySelector('.detail-name-text');
  if (h) h.focus({ preventScroll: true });
}

// 回程 morph 的目標：課程卡（課程頁）；找不到時改找開詳情的那張週卡——只在 .week-right 可視區內才 morph，否則維持淡出（#27）
function returnMorphTarget(courseId, origin, weekRight) {
  const main = document.getElementById('main-section');
  const courseCard = main.querySelector(`.course-card-grid[data-course-id="${courseId}"]`);
  if (courseCard) return courseCard;
  if (!origin || !origin.assignmentId || !weekRight) return null;
  const wc = main.querySelector(`.week-task-card[data-assignment-id="${CSS.escape(origin.assignmentId)}"]`);
  if (!wc || parseInt(wc.dataset.courseId, 10) !== courseId) return null;
  const r = wc.getBoundingClientRect();
  const v = weekRight.getBoundingClientRect();
  return (r.bottom > v.top && r.top < v.bottom) ? wc : null;
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

  rememberDetailOrigin(courseId, cardEl);   // 必須在 currentView 改成 'course' 之前（據此判斷是否從清單離開）

  const detailContainer = document.getElementById('course-detail-container');
  const update = () => {
    currentView = 'course';
    currentCourseId = courseId;

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
    if (!course) return false;

    renderNav(courses, assignments);
    renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);
    focusDetailHeading(detailContainer);
    return true;
  };

  // 没有卡片元素（側欄、popstate 前進）或不支持 View Transitions 时：直接切換，無 morph
  if (!cardEl || !document.startViewTransition) {
    update();
    return;
  }

  // ── FIRST: 在小卡片上标记共享元素 ──
  clearStaleMorphNames();
  nameCardForMorph(cardEl);

  // ── 启动 View Transition；LAST: 在详情视图上标记对应的共享元素 ──
  startMorph(() => {
    if (update()) nameDetailForMorph(detailContainer);
  });
}

// ── 退出課程詳情、回到清單 ──
// 回到「currentPage / showSubmitted 所指的清單」（不再寫死回 courses grid）——
// 由 popstate（Back）或 render() fallback 呼叫；currentPage/showSubmitted 已由呼叫端設好。
function showGridView() {
  const prevCourseId = currentCourseId;
  const origin = _detailOrigin;
  _detailOrigin = null;
  const detailContainer = document.getElementById('course-detail-container');

  const update = () => {
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
    // 回到原本所在的清單（週待辦或課程 grid）
    if (currentPage === 'week' && !showSubmitted) {
      renderWeekSection(courses, assignments);
    } else {
      renderCardGrid(courses, assignments, assignmentGroups);
    }

    // 週清單捲回開詳情前的位置（#27）：同步寫入，VT 捕捉 new 狀態時已就位；要在找回程目標之前（可視判定看的是還原後的位置）
    const weekRight = mainSection.querySelector('.week-right');
    if (weekRight && origin && origin.weekScroll) weekRight.scrollTop = origin.weekScroll;

    // ── LAST: 在小卡片上标记对应的共享元素（找不到 → 詳情原地淡出）──
    const card = returnMorphTarget(prevCourseId, origin, weekRight);
    if (card) nameCardForMorph(card);

    // 焦點還給觸發它的卡／側欄項（#2）；找不到（已完成離開清單、側欄以外的來源）就落在頁面標題
    const back = (origin && document.querySelector(origin.focusSel)) || document.getElementById('page-title');
    if (back) back.focus({ preventScroll: true });
  };

  if (!document.startViewTransition) {
    update();
    return;
  }

  // ── FIRST: 在详情视图上标记共享元素 ──
  clearStaleMorphNames();
  nameDetailForMorph(detailContainer);
  startMorph(update);
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

  // 焦點（#8）：輸入框被換回 span 時焦點會掉到 <body> → 只有 Enter／Escape 收尾時還給鉛筆；
  // blur 觸發的 commit 不動焦點（使用者已經 Tab 或點去別處，不要搶回來）
  const refocusPencil = () => {
    if (renameBtn && renameBtn.isConnected) renameBtn.focus({ preventScroll: true });
  };

  let committed = false;
  // handoff：blur 收尾時焦點要去的元素（e.relatedTarget）；若它是側欄項，會被下面的 renderNav 重建拆掉 → 交給重建後的同一課
  const commit = ({ refocus = false, handoff = null } = {}) => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    const displayName = newName || (course ? course.name : '');
    restore(displayName);
    if (refocus) refocusPencil();

    persistCourseName(courseId, newName, course);

    const { courses = [], assignments = {} } = _currentData;
    renderNav(courses, assignments);
    refocusRebuiltNavItem(handoff);
  };

  const cancel = ({ refocus = false } = {}) => {
    if (committed) return;
    committed = true;
    restore(currentName);
    if (refocus) refocusPencil();
  };

  input.addEventListener('keydown', (e) => {
    // preventDefault：焦點在 keydown 裡換到鉛筆按鈕，不擋的話這次 Enter 的 keypress 會落在鉛筆上、又把改名打開
    if (e.key === 'Enter') { e.preventDefault(); commit({ refocus: true }); }
    if (e.key === 'Escape') { e.preventDefault(); cancel({ refocus: true }); }
  });
  input.addEventListener('blur', (e) => commit({ handoff: e.relatedTarget }));
}

// 改名的 blur 收尾（#8）：blur 當下焦點還沒落到下一個元素（activeElement 是 <body>），renderNav 認不出要保留誰；
// 用 blur 的 relatedTarget 判斷——它若是被重建拆掉的側欄項，就聚焦重建後的同一課
function refocusRebuiltNavItem(handoff) {
  if (!handoff || handoff.isConnected || !handoff.dataset || !handoff.dataset.targetCourse) return;
  const again = document.querySelector(`.nav-course-item[data-target-course="${handoff.dataset.targetCourse}"]`);
  if (again) again.focus({ preventScroll: true });
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

  // refocus（#8）：只有 Enter／Escape 收尾時把焦點放回重建出來的同一課側欄項；blur 觸發的不動焦點
  // handoff：blur 收尾時焦點要去的元素（e.relatedTarget，例如 Tab 到下一個側欄項）——它會被這次重建拆掉，交給重建後的同一課
  const rerenderNav = (refocus = false, handoff = null) => {
    const { courses = [], assignments = {} } = _currentData;
    renderNav(courses, assignments);   // 重繪還原按鈕（commit 後即套用新名）
    if (refocus) {
      const again = document.querySelector(`.nav-course-item[data-target-course="${courseId}"]`);
      if (again) again.focus({ preventScroll: true });
    } else {
      refocusRebuiltNavItem(handoff);
    }
  };

  let committed = false;
  const commit = ({ refocus = false, handoff = null } = {}) => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    const displayName = newName || (course ? course.name : '');
    persistCourseName(courseId, newName, course);
    rerenderNav(refocus, handoff);
    // 若右側正顯示同一課，順手同步詳情標題（只改文字、不整段重繪，避免打斷成績計算器/捲動）
    if (currentView === 'course' && currentCourseId === courseId) {
      const dName = document.querySelector('#course-detail-container .detail-name-text');
      if (dName) dName.textContent = displayName;
    }
  };

  const cancel = ({ refocus = false } = {}) => {
    if (committed) return;
    committed = true;
    rerenderNav(refocus);   // 還原原本按鈕（不寫入）
  };

  input.addEventListener('keydown', (e) => {
    // preventDefault：焦點換到側欄項按鈕後，這次 Enter 的 keypress 不會落在它身上而打開課程詳情
    if (e.key === 'Enter') { e.preventDefault(); commit({ refocus: true }); }
    if (e.key === 'Escape') { e.preventDefault(); cancel({ refocus: true }); }
  });
  input.addEventListener('blur', (e) => commit({ handoff: e.relatedTarget }));
}

// ── 完成過渡：1.5 秒撤銷窗 → 碎點爆＋原地出場＋FLIP 補位 ──
// 完成後不再整段 innerHTML 重建：只把完成的那一項抽出清單，其餘就地更新（計數、組標題、摘要列、進度環、側欄），
// 所以捲動位置、展開的描述／成績計算器、其他仍在撤銷窗內的項目（各自獨立的計時器）都保得住（#12）。
// 時間線（詳情列與週卡相同）：
//   勾選 → .completing：勾選圈填綠、勾號畫出（#46）、due 與「↩ 撤銷」原地淡換、底部倒數條（#13，尺寸不變）；播報（#3）
//   1.5 秒到 → 焦點交給鄰居（#1）→ 碎點從勾選圈迸出（#20）→ 節點抽出版面、在出場層淡出＋縮到 0.96（#19），
//             同一幀其他項目沿 spring.reflow 滑進空位（#18）、計數與進度環就地更新；最後一項落地且弧合攏 → 慶祝
function rerenderDetailAndNav(cid) {
  const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
  const course = courses.find((c) => c.id === cid);
  if (course) renderCourseDetailSection(course, assignments[cid] || [], assignmentGroups[cid] || [], scores);
  renderNav(courses, assignments);
  updateSideNav();   // 升級/降級、標回未完成後同步刷新側欄頂部計數（待辦/已完成）
}

// 撤銷窗的視覺狀態（詳情列與週卡共用）：只切 class 與勾選圈屬性，不插入／移除會佔位的節點（#13）；
// 倒數條是 absolute 疊在框內底部，不佔位
function markCompleting(host) {
  const chk = host.querySelector('.assignment-check');
  if (chk) {
    chk.dataset.done = 'true';                       // 不重繪，手動點綠
    chk.setAttribute('aria-label', tr('markUndone'));
    chk.classList.add('just-checked');               // 只有「勾下去的這一下」播勾號畫出（#46），重繪出來就已勾選的不播
  }
  host.classList.add('completing');
  if (!host.querySelector('.complete-countdown')) {
    const bar = document.createElement('div');
    bar.className = 'complete-countdown';
    bar.style.animation = `complete-countdown ${COMPLETE_DELAY_MS / 1000}s linear forwards`;
    host.appendChild(bar);
  }
  const name = (host.querySelector('.week-task-title, .assignment-title') || {}).textContent || '';
  announce(tr('a11yCompleted').replace('{name}', name.trim()));
}

function unmarkCompleting(host) {
  host.classList.remove('completing');
  const bar = host.querySelector('.complete-countdown');
  if (bar) bar.remove();
  const chk = host.querySelector('.assignment-check');
  if (chk) {
    chk.dataset.done = 'false';
    chk.setAttribute('aria-label', tr('markDone'));
    chk.classList.remove('just-checked');
  }
  announce(tr('a11yUndone'));
}

function beginComplete(item, id, cid) {
  markCompleting(item);
  _completeTimers[id] = setTimeout(() => finishComplete(item, id, cid), COMPLETE_DELAY_MS);
}

// 撤銷窗結束：這一列離開清單，課程詳情其餘部分就地更新
function finishComplete(item, id, cid) {
  delete _completeTimers[id];                        // 從這一刻起算「已落地」（計數一起更新）
  const list = item.closest('.detail-assignments-list');
  const view = item.closest('.course-detail-view');
  if (!item.isConnected || !list || !view) return;  // 撤銷窗內整段重繪過（換課等）→ 節點已不在畫面上
  const scroller = scrollParentOf(item);

  // ① 焦點交接：下一列，沒有就上一列，再沒有就清單標題（#1）
  const rows = [...list.querySelectorAll('.assignment-item')];
  const i = rows.indexOf(item);
  const restoreFocus = handOffFocus(item, rows[i + 1] || rows[i - 1], view.querySelector('.detail-assignments-label'), list);

  // ② 碎點從勾選圈迸出
  spawnBurstDots(item.querySelector('.assignment-check'));
  item.classList.add('bursting');

  // ③ 離場：這一列；描述展開著就一起離場（收合的描述 display:none，直接移除）
  const desc = item.nextElementSibling && item.nextElementSibling.classList.contains('assignment-desc')
    ? item.nextElementSibling : null;
  const leaving = [item];
  if (desc && desc.classList.contains('open')) leaving.push(desc);
  const scrollTop = scroller ? scroller.scrollTop : 0;
  // leaf：捲動容器裡的每一塊（捲到底時移除會讓 scrollTop 被夾小，上方的成績計算器、標題——窄版面連圓餅欄——
  // 也跟著位移，一起滑）
  const first = flipSnapshot(view.querySelectorAll(
    '.detail-left-panel, .detail-right-panel > .grade-calc, .detail-assignments-label, .assignment-item, .assignment-desc.open, .hidden-items'),
  leaving);
  exitInPlace(leaving, scroller);
  if (desc && !leaving.includes(desc)) desc.remove();

  // ④ 就地更新：空清單提示、header 待辦數／緊急 badge、側欄
  if (!list.querySelector('.assignment-item')) list.insertAdjacentHTML('beforeend', detailListEmptyHtml());
  if (scroller && scroller.scrollTop !== scrollTop) scroller.scrollTop = scrollTop;
  updateDetailHeader(view, cid);
  updateSideNav();
  renderNav(_currentData.courses || [], _currentData.assignments || {});

  // ⑤ 剩下的列滑進空位
  flipPlay(first);
  restoreFocus();
}

function cancelComplete(item, id) {
  if (_completeTimers[id]) { clearTimeout(_completeTimers[id]); delete _completeTimers[id]; }
  const chk = item.querySelector('.assignment-check');
  revertCompletion(chk && chk.dataset.extDone === 'true', id);
  unmarkCompleting(item);   // 就地還原（不整段重繪，其他撤銷窗照跑）
}

// ── 週卡片完成過渡（平行於 assignment-item 版；共用撤銷窗視覺、出場層、FLIP、碎點）──
function rerenderWeekAndNav() {
  const { courses = [], assignments = {} } = _currentData;
  renderWeekSection(courses, assignments);
  updateSideNav();
  renderNav(courses, assignments);
}

function beginCompleteWeek(card, id) {
  markCompleting(card);
  _completeTimers[id] = setTimeout(() => finishCompleteWeek(card, id), COMPLETE_DELAY_MS);
}

// 撤銷窗結束：這張卡離開清單，週視圖其餘部分就地更新
function finishCompleteWeek(card, id) {
  delete _completeTimers[id];                        // 從這一刻起算「已落地」（計數、進度環一起更新）
  const panel = card.closest('.week-panel');
  const right = card.closest('.week-right');
  const group = card.closest('.week-group');
  if (!card.isConnected || !panel || !right || !group) return;   // 撤銷窗內整段重繪過 → 節點已不在畫面上
  const grid = card.parentElement;
  const groupKey = group.dataset.group;
  const remaining = grid.querySelectorAll('.week-task-card').length - 1;   // 這組剩下的張數（含其他仍在撤銷窗內的）

  // ① 焦點交接：同組下一張 → 下一組第一張 → 上一張 → #page-title（#1）
  const cards = [...right.querySelectorAll('.week-task-card')];
  const i = cards.indexOf(card);
  const restoreFocus = handOffFocus(card, cards[i + 1] || cards[i - 1], document.getElementById('page-title'), right);

  // ② 碎點從勾選圈迸出
  spawnBurstDots(card.querySelector('.assignment-check'));
  card.classList.add('bursting');

  // ③ 離場：這組只剩這張 → 整組（標題＋一條相鄰分隔線）與左欄摘要列一起離場
  const leaving = [card];
  const sumLeaving = [];
  const sumRow = panel.querySelector(`.wk-sum-row[data-scroll-group="${groupKey}"]`);
  if (remaining === 0) {
    leaving[0] = group;
    const prev = group.previousElementSibling;
    const next = group.nextElementSibling;
    const divider = (prev && prev.classList.contains('week-divider')) ? prev
      : (next && next.classList.contains('week-divider')) ? next : null;
    if (divider) leaving.push(divider);
    if (sumRow) sumLeaving.push(sumRow);
  }
  const scrollTop = right.scrollTop;
  const first = flipSnapshot(
    panel.querySelectorAll('.week-task-card, .week-group-title, .week-divider, .wk-sum-row'),
    [...leaving, ...sumLeaving]);
  exitInPlace(leaving, right);
  exitInPlace(sumLeaving, null);   // 左欄不捲動，不需裁切

  // ④ 就地更新：組標題 (N)、摘要列數字、空狀態、進度環、側欄
  if (remaining > 0) {
    const title = group.querySelector('.week-group-title');
    if (title) title.textContent = weekGroupTitleText(groupKey, remaining);
    const num = sumRow && sumRow.querySelector('.wk-sum-num');
    if (num) num.textContent = remaining;
  }
  if (!right.querySelector('.week-group')) {
    right.insertAdjacentHTML('beforeend', `<div class="week-group-empty">${tr('noTasks')}</div>`);
    right.lastElementChild.animate([{ opacity: 0 }, { opacity: 1 }], MOTION.reveal);
  }
  const breakdown = panel.querySelector('.wk-breakdown');
  if (breakdown && !breakdown.querySelector('.wk-sum-row')) breakdown.remove();
  if (right.scrollTop !== scrollTop) right.scrollTop = scrollTop;
  updateWeekRing();
  updateSideNav();
  renderNav(_currentData.courses || [], _currentData.assignments || {});

  // ⑤ 剩下的卡片、組標題、分隔線、摘要列滑進空位
  flipPlay(first);
  restoreFocus();
}

function cancelCompleteWeek(card, id) {
  if (_completeTimers[id]) { clearTimeout(_completeTimers[id]); delete _completeTimers[id]; }
  const chk = card.querySelector('.assignment-check');
  revertCompletion(chk && chk.dataset.extDone === 'true', id);
  unmarkCompleting(card);
}

// ── 進度環就地更新（#12）──
// 只改 stroke-dashoffset：既有 0.8s 過渡從目前位置重新導向（不換節點，不從頭播）；分子 tick、aria-label 同步。
// 慶祝在「最後一項近期作業落地」時判斷：分子剛到分母、上次顯示的還沒到 → 等弧合攏才引爆。
// 撤銷窗內的項目不算（computeNearProgress 只數已落地的），所以連勾最後兩項時由後落地的那一項觸發
function updateWeekRing() {
  const ring = document.querySelector('#main-section .wk-ring');
  const bar = ring && ring.querySelector('.wk-ring-bar');
  if (!bar) return;
  const { nearDone, nearTotal } = computeNearProgress(_currentData.courses || [], _currentData.assignments || {});
  const target = RING_C * (1 - (nearTotal > 0 ? nearDone / nearTotal : 0));
  const prevOffset = parseFloat(getComputedStyle(bar).strokeDashoffset);
  bar.style.strokeDashoffset = `${target}`;
  const prevDone = _prevRingDone;
  _prevRingDone = nearDone;
  ring.setAttribute('aria-label', `${tr('weekDoneLabel')} ${nearDone}/${nearTotal}`);
  const frac = ring.querySelector('.wk-ring-frac');
  const b = frac && frac.querySelector('b');
  if (b && prevDone !== nearDone) {
    b.textContent = nearDone;
    b.classList.remove('tick');
    b.getBoundingClientRect();   // forced reflow：重播 tick（不用 rAF）
    b.classList.add('tick');
  }
  const allDone = nearTotal > 0 && nearDone === nearTotal;
  const cap = ring.querySelector('.wk-ring-cap');
  if (allDone && prevDone !== null && prevDone < nearTotal) {
    whenRingLands(bar, prevOffset, target, () => celebrateRingArrival(ring));   // cap 由慶祝換字
  } else if (cap && !(allDone && prevDone === nearTotal)) {
    // 已經全部完成時（之後落地的是非近期卡）不碰 cap：它要嘛已是「全部完成」，要嘛正等弧落地的慶祝換字淡入，
    // 這裡先換會讓「全部完成」在弧合攏前就出現、慶祝時再閃一次
    cap.textContent = tr(allDone ? 'weekAllDoneLabel' : 'weekDoneLabel');
  }
}

// 等弧真的停在 target 才執行 fn。沿用同一個 .wk-ring-bar，上一段過渡（被重新導向前）的 transitionend 可能晚到，
// 只認停在 target 的那一次；減少動態（transition:none，transitionend 永遠不來）或弧已在終點 → 立刻執行
function whenRingLands(bar, prevOffset, target, fn) {
  if (reduceMotion() || !Number.isFinite(prevOffset) || Math.abs(prevOffset - target) < 0.5) { fn(); return; }
  const h = (e) => {
    if (e.propertyName !== 'stroke-dashoffset') return;
    if (Math.abs(parseFloat(getComputedStyle(bar).strokeDashoffset) - target) > 0.5) return;
    bar.removeEventListener('transitionend', h);
    fn();
  };
  bar.addEventListener('transitionend', h);
}

// ── 完成後的就地更新：課程詳情 header ──
// 待辦數與緊急數（renderCourseDetailSection 與完成後的就地更新共用；撤銷窗內的項目仍算待辦）
function detailCounts(asgns) {
  const filtered = applyFilters(asgns);
  // 緊急＝7 天內到期「且未完成」——已完成（含已繳交視圖）不算緊急
  const urgentCount = filtered.filter((a) => {
    if (!a.due_at || isDoneLanded(a)) return false;
    const diff = new Date(a.due_at) - Date.now();
    return diff > 0 && diff <= 7 * 86400000;
  }).length;
  return { pendingCount: filtered.length, urgentCount };
}

function detailMetaText(n) {
  return `${n}${tr(showSubmitted ? 'completedItems' : 'pendingItems')}`;
}

function detailListEmptyHtml() {
  return `<div class="detail-list-empty">${noItemsLabel()}</div>`;
}

function updateDetailHeader(view, cid) {
  const { pendingCount, urgentCount } = detailCounts(((_currentData.assignments || {})[cid]) || []);
  const meta = view.querySelector('.detail-meta');
  if (meta) meta.textContent = detailMetaText(pendingCount);
  const badge = view.querySelector('.detail-top-row .card-badge-urgent');
  if (badge) {   // 同一個節點改內容（保留 View Transition 命名），0 件時保留佔位、不念出
    badge.textContent = `${urgentCount}${tr('urgentItems')}`;
    badge.classList.toggle('is-placeholder', !urgentCount);
    if (urgentCount) badge.removeAttribute('aria-hidden');
    else badge.setAttribute('aria-hidden', 'true');
  }
}

// ── 焦點交接（#1，A17）──
// 離場的項目若持有焦點，在它離場（碎點爆開始）時交給鄰居的勾選圈，沒有鄰居就交給 fallback（tabindex=-1 的標題）。
// 不在點擊當下移：撤銷窗內在同一個勾選圈按 Enter／Space 就是鍵盤的撤銷路徑。
// 回傳 restore()：就地更新之後再確認一次，萬一鄰居被重繪換掉，用 assignment id（不是節點）在 scope 內找回來。
// scope 必須是目前這個清單（週：.week-right；詳情：.detail-assignments-list）：開詳情時 #main-section 只是隱藏，
// 裡面的週卡勾選圈帶著同一個 id 且在 DOM 前面，用 document 查會找到看不見、focus 不上去的那顆
function handOffFocus(host, neighbour, fallback, scope) {
  if (!host.contains(document.activeElement)) return () => {};
  const target = (neighbour && neighbour.querySelector('.assignment-check')) || fallback;
  const targetId = target && target.dataset.assignmentId;
  if (target) target.focus({ preventScroll: true });
  return () => {
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected && !host.contains(active)) return;
    const again = targetId && scope && scope.querySelector(`.assignment-check[data-assignment-id="${CSS.escape(targetId)}"]`);
    const to = (again && again.isConnected) ? again : fallback;
    if (to && to.isConnected) to.focus({ preventScroll: true });
  };
}

// 最近的捲動容器（週：.week-right；詳情：.detail-right-panel，窄版面時是外層）
function scrollParentOf(el) {
  for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if (oy === 'auto' || oy === 'scroll') return n;
  }
  return null;
}

// ── 出場層（#burst-layer：position:fixed、pointer-events:none，見 index.html）──
// 碎點與出場殘影都畫在這層：不在任何捲動容器或正在淡出的列裡，碎點不會被列的淡出乘掉（#20）
function burstLayer() {
  let layer = document.getElementById('burst-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'burst-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}

// 原地出場（list recipe 的 popLayout）：節點立刻抽出版面（其他項目同一幀開始 FLIP 補位，不等它淡完），
// 搬進出場層、釘在原本的視覺位置淡出＋縮到 0.96（transition.fade），跑完移除。離場節點 inert。
// clipEl：節點原本所在的捲動容器，殘影裁在它的可視範圍內（不會畫到容器外）；null＝不裁切。
// 減少動態：只淡出、不縮放（#0）
function exitInPlace(nodes, clipEl) {
  if (!nodes.length) return;
  const clip = document.createElement('div');
  clip.className = 'exit-clip';
  let ox = 0;
  let oy = 0;
  if (clipEl) {
    const r = clipEl.getBoundingClientRect();
    ox = r.left + clipEl.clientLeft;
    oy = r.top + clipEl.clientTop;
    Object.assign(clip.style, {
      left: `${ox}px`, top: `${oy}px`,
      width: `${clipEl.clientWidth}px`, height: `${clipEl.clientHeight}px`, overflow: 'hidden',
    });
  } else {
    clip.style.inset = '0';
  }
  // 先全部量完（視覺位置，含進行中的補位 transform）再搬，避免搬第一個時其他節點的位置跟著變
  const boxes = nodes.map((n) => ({
    n, r: n.getBoundingClientRect(), w: n.offsetWidth, h: n.offsetHeight,
    hadPrev: !!n.previousElementSibling, hadNext: !!n.nextElementSibling,
  }));
  burstLayer().prepend(clip);   // 在碎點下面
  const anims = boxes.map(({ n, r, w, h, hadPrev, hadNext }) => {
    n.getAnimations().forEach((a) => a.cancel());           // 進行中的補位：位置已含在 r 裡
    const bar = n.querySelector('.complete-countdown');
    if (bar) bar.remove();                                   // 搬家會重播 CSS 動畫：倒數條與勾號畫出都先拿掉（勾號留最終狀態）
    n.querySelectorAll('.just-checked').forEach((c) => c.classList.remove('just-checked'));
    n.inert = true;
    // 用 holder 保住原本的 :first-child／:last-child 狀態（組的 padding、列的底線不會在殘影裡跳）
    const holder = document.createElement('div');
    Object.assign(holder.style, {
      position: 'absolute', left: `${r.left - ox}px`, top: `${r.top - oy}px`, width: `${w}px`, height: `${h}px`,
    });
    if (hadPrev) holder.appendChild(document.createElement('i')).hidden = true;
    holder.appendChild(n);
    if (hadNext) holder.appendChild(document.createElement('i')).hidden = true;
    Object.assign(n.style, { width: `${w}px`, height: `${h}px`, margin: '0' });
    clip.appendChild(holder);
    return holder.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: reduceMotion() ? 'none' : `scale(${EXIT_SCALE})` }],
      { duration: MOTION.fade.duration, easing: MOTION.fade.easing, fill: 'forwards' });
  });
  const done = () => clip.remove();
  Promise.all(anims.map((a) => a.finished)).then(done, done);
  setTimeout(done, MOTION.fade.duration + 300);   // 保底（分頁在背景時 finished 可能延後）
}

// ── FLIP 補位（#18）──
// 改 DOM 前 flipSnapshot 記下 leaf 元素的視覺位置 → 改 DOM → flipPlay 再量，有位移的從舊位置沿 spring.reflow 滑回
// （只動 transform，不拉伸）。WAAPI＋id:'reflow'：不靠 rAF 或 transition 觸發，分頁隱藏也安全；
// 再次觸發時舊位置是含進行中 transform 的視覺位置，cancel 後從那裡接續（A12）。
// 只傳 leaf（卡片、列、標題、分隔線），不要同時傳容器和它裡面的項目，否則會位移兩次。
// 減少動態：不量不滑，直接到位（#0）
function flipSnapshot(els, exclude = []) {
  const first = new Map();
  if (reduceMotion()) return first;
  els.forEach((el) => {
    if (exclude.some((x) => x === el || x.contains(el))) return;
    first.set(el, el.getBoundingClientRect());
  });
  return first;
}

function flipPlay(first) {
  const moves = [];
  first.forEach((r0, el) => {
    if (!el.isConnected) return;
    el.getAnimations().forEach((a) => { if (a.id === 'reflow') a.cancel(); });
    const r1 = el.getBoundingClientRect();
    const dx = r0.left - r1.left;
    const dy = r0.top - r1.top;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) moves.push([el, dx, dy]);
  });
  moves.forEach(([el, dx, dy]) => {
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
      { duration: MOTION.reflow.duration, easing: MOTION.reflow.easing, id: 'reflow' });
  });
}

// 碎點爆：從被點的勾選圈中心迸出，畫在出場層（#20）；角度、距離 42–60px、數量、顏色不變
function spawnBurstDots(chk) {
  if (reduceMotion() || !chk) return;   // 減少動態：碎點是位移，不產生（#0）
  const c = chk.getBoundingClientRect();
  const cx = c.left + c.width / 2;
  const cy = c.top + c.height / 2;
  const layer = burstLayer();
  const n = 10;
  for (let i = 0; i < n; i++) {
    const dot = document.createElement('span');
    const ang = (Math.PI * 2 * i) / n;
    const dist = 42 + ((i * 13) % 18);
    dot.className = 'complete-burst-dot';
    dot.style.left = `${cx}px`;
    dot.style.top = `${cy}px`;
    dot.style.setProperty('--dx', `${Math.round(Math.cos(ang) * dist)}px`);
    dot.style.setProperty('--dy', `${Math.round(Math.sin(ang) * dist)}px`);
    dot.style.background = i % 2 ? 'var(--green)' : 'var(--orange)';
    dot.addEventListener('animationend', () => dot.remove());
    layer.appendChild(dot);
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

  const { pendingCount, urgentCount } = detailCounts(asgns);
  const detailMeta = detailMetaText(pendingCount);
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
          <span class="detail-name-text" tabindex="-1">${esc(getCourseName(course))}</span>
          <button class="btn-rename-course" data-course-id="${course.id}" title="${tr('renameCourse')}" aria-label="${esc(tr('renameCourse'))}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
        </div>
        <div class="detail-meta">${detailMeta}</div>
      </div>
      <div class="detail-card-bottom">
        <div class="detail-left-panel">
          ${weightPieHtml}
        </div>
        <div class="detail-right-panel">
          ${gradeCalcHtml}
          <div class="detail-assignments-label" tabindex="-1">${currentListLabel()}</div>
          <div class="detail-assignments-list" data-course-id="${course.id}" data-drophint="${esc(tr('dropToShow'))}">
            ${assignmentRows || detailListEmptyHtml()}
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


  el.querySelectorAll('.assignment-item').forEach((item) => {
    item.addEventListener('click', () => {
      if (item.classList.contains('bursting')) return;      // 爆開中不互動
      if (item.classList.contains('completing')) {           // 撤銷窗口內 → 點列取消
        const chk = item.querySelector('.assignment-check');
        if (chk) cancelComplete(item, String(chk.dataset.assignmentId));
        return;
      }
      toggleAssignmentDesc(item);
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
        cancelComplete(item, id);
        return;
      }
      // 依 Canvas 事實分流：已繳 → 翻轉「標回未完成」覆蓋；未繳 → 翻轉手動完成（就地更新，避免閃白）
      toggleCompletion(btn.dataset.extDone === 'true', id);
      const a = ((_currentData.assignments || {})[cid] || []).find((x) => String(x.id) === id);
      const nowDone = a ? isDone(a) : false;
      if (nowDone && !showSubmitted && item) {
        // 待辦視圖勾選完成 → 1.5 秒撤銷窗口 → 碎點爆＋原地出場 → 其餘就地更新
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
      setHiddenItemsOpen(wrap, !wrap.classList.contains('open'));
    });
  });

  // 拖曳升級／降級隱藏項
  setupHideablePromoteDrag(el);

  // 開頁時主動算一次「顯示用」總分（persist:false → 不把 Canvas 預填值固化成手動值）
  if (el.querySelector('.grade-calc')) {
    recalculateGrades(course.id, { persist: false });
  }
}

// 作業描述開關（整列點擊與鍵盤 .assignment-desc-toggle 共用同一條，#7）：切 .open 並同步 aria-expanded
function toggleAssignmentDesc(item) {
  const desc = item.nextElementSibling;
  if (!desc || !desc.classList.contains('assignment-desc')) return;
  const open = desc.classList.toggle('open');
  const toggle = item.querySelector('.assignment-desc-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', String(open));
}

// ── 拖曳升級（隱藏列→作業清單）／降級（升級列→稽核區）──
// Pointer Events 自繪引擎（原生 HTML5 DnD 的啟動層在部分環境不觸發、ghost/插入動畫皆不可控）：
// grip 為唯一拖曳起點 → 超過閾值「拿起」浮動 clone 跟隨游標 → 懸停清單時插入點以下的列讓位 →
// 放開命中則寫入 manualShown 重繪，clone 飛入重繪後的實際落點（清單依 due 排序）；未命中/Esc 飛回原位。
let _dragCtx = null;                 // 進行中的拖曳（全域僅允許一場）

const DRAG_LIFT_PX = 4;              // 移動超過此距離才視為拖曳（否則當一般點擊）
const DRAG_SETTLE_MS = MOTION.reflow.duration;   // 落點／返回飛行時長（--reflow，#39）
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
    // 鍵盤路徑（#6）：Enter／Space 直接把這一項移到另一區，走和放開滑鼠相同的 commitDrag → settleClone
    // （preventDefault 擋掉按鈕原生的 click 與 Space 捲動；按住不放的 repeat 不重複移動）
    grip.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.repeat) keyboardMove(row, zones);
    });
  });
}

// 鍵盤移動（#6）：和 trackDragFrom 同形狀的 ctx（已拿起、已在目標上），clone 從原列原地起飛，飛進重繪後的落點、落地閃一下——
// 動效與滑鼠拖曳相同（A2）。這個 ctx 不指派給 _dragCtx、也不掛 window 監聽：commitDrag 裡的重繪會跑 abortActiveDrag()，
// 若掛在 _dragCtx 上，clone 會在 settleClone 之前就被刪掉
function keyboardMove(row, zones) {
  if (_dragCtx) return;                                          // 滑鼠拖曳進行中
  if (row.classList.contains('completing') || row.classList.contains('bursting')) return;
  const dir = row.dataset.drag;
  const target = dir === 'promote' ? zones.list : zones.hidden;
  if (!target) return;
  const ctx = {
    row, dir, target, zones,
    id: row.dataset.hideableId,
    lifted: true, over: true, done: true,
    clone: null, base: null,
  };
  makeDragClone(ctx);
  commitDrag(ctx, { viaKeyboard: true });
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

// 浮動 clone（拖曳與鍵盤移動共用）：疊在原列的位置；複本裡的勾選圈／握把是假的，
// inert＋aria-hidden 讓 Tab 與螢幕閱讀器碰不到（#6）
function makeDragClone(ctx) {
  const rect = ctx.row.getBoundingClientRect();
  ctx.base = rect;
  const clone = ctx.row.cloneNode(true);
  clone.classList.add('drag-clone');
  clone.inert = true;
  clone.setAttribute('aria-hidden', 'true');
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  document.body.appendChild(clone);
  ctx.clone = clone;
  return clone;
}

// 「拿起」：以原列複製浮動 clone；原列留殘影、目標區亮起
function liftRow(ctx) {
  ctx.lifted = true;
  makeDragClone(ctx);
  ctx.row.classList.add('drag-source');
  ctx.target.classList.add('drop-active');
  document.body.classList.add('drag-active');
}

function positionClone(ctx) {
  const dx = ctx.lastX - ctx.startX;
  const dy = ctx.lastY - ctx.startY;
  // 抬起感（微放大＋微傾）是縮放與旋轉：減少動態時只跟隨游標（直接操作保留，#0）
  ctx.clone.style.transform = reduceMotion()
    ? `translate(${dx}px, ${dy}px)`
    : `translate(${dx}px, ${dy}px) scale(1.02) rotate(0.4deg)`;
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
// 焦點：鍵盤移動、或焦點本來就在被移動的那一列（例如先 Tab 到這一列、再用滑鼠拖；pointerdown 有 preventDefault，
// 單純滑鼠按握把不會把焦點給它），重繪會把它拆掉 →
// 交給落地那一列的握把（落在鎖定列就交給同區的鄰居，再沒有就交給該區的標題），並播報結果（#6）
function commitDrag(ctx, { viaKeyboard = false } = {}) {
  const savedScroll = ctx.zones.scroller ? ctx.zones.scroller.scrollTop : 0;
  const hiddenWasOpen = !!(ctx.zones.hidden && ctx.zones.hidden.classList.contains('open'));
  const keepFocus = viaKeyboard || ctx.row.contains(document.activeElement);
  const item = ((_currentData.assignments || {})[currentCourseId] || []).find((x) => String(x.id) === String(ctx.id));
  const name = item ? item.name : (ctx.row.querySelector('.assignment-title, .hidden-item-title')?.textContent || '').trim();
  setItemHiddenByDrag(ctx.id, ctx.dir === 'demote');

  const container = document.getElementById('course-detail-container');
  const scroller = container.querySelector('.detail-right-panel');
  if (scroller) scroller.scrollTop = savedScroll;  // 重繪會重置捲動位置 → 還原
  // 稽核區開合：降級後強制展開（讓使用者看到落點）；升級則維持拖曳前狀態
  const hidden = container.querySelector('.hidden-items');
  if (hidden && (hiddenWasOpen || ctx.dir === 'demote')) setHiddenItemsOpen(hidden, true);

  const cssId = (window.CSS && CSS.escape) ? CSS.escape(String(ctx.id)) : String(ctx.id);
  let landed = null;
  if (ctx.dir === 'promote') {
    const chk = container.querySelector(`.detail-assignments-list .assignment-check[data-assignment-id="${cssId}"]`);
    landed = chk && chk.closest('.assignment-item');
  } else {
    landed = container.querySelector(`.hidden-item-row[data-hideable-id="${cssId}"]`);
  }
  if (keepFocus) focusAfterMove(container, landed, ctx.dir);
  announce(tr(ctx.dir === 'promote' ? 'a11yMovedToList' : 'a11yMovedToHidden').replace('{name}', name));
  settleClone(ctx, landed, { flash: true });
}

// 移動後的焦點落點：落地列的握把 → 同區最近一列有握把的（鎖定列沒有握把）→ 該區的標題／開關
function focusAfterMove(container, landed, dir) {
  const zone = dir === 'promote'
    ? container.querySelector('.detail-assignments-list')
    : container.querySelector('.hidden-items-list');
  let to = landed && landed.querySelector('.drag-grip');
  if (!to && zone) {
    const rows = [...zone.querySelectorAll('.assignment-item, .hidden-item-row')];
    const i = landed ? rows.indexOf(landed) : -1;
    const near = i >= 0
      ? [...rows.slice(i + 1), ...rows.slice(0, i).reverse()]
      : rows;
    const row = near.find((r) => r.querySelector('.drag-grip'));
    to = row && row.querySelector('.drag-grip');
  }
  if (!to) {
    to = dir === 'promote'
      ? container.querySelector('.detail-assignments-label')
      : container.querySelector('.hidden-items-toggle');
  }
  if (to) to.focus({ preventScroll: true });   // 捲動交給 settleClone 的 scrollIntoView（與飛行落點同一次）
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
  // 落點不存在/不可見（如已繳交過濾）→ 原地淡出；減少動態時一律不飛行、原地淡出（落點閃色保留，#0）
  if (reduceMotion() || !to || (!to.width && !to.height)) {
    clone.style.transition = cssTransition('opacity', MOTION.fade);
    clone.style.opacity = '0';
    setTimeout(finish, MOTION.fade.duration + 30);
    return;
  }
  targetRow.classList.add('drag-arriving');
  // 位置走 --reflow；寬高仍隨飛行改變（#41 會拿掉寬高、改成只飛位置）
  clone.style.transition = `${cssTransition('transform', MOTION.reflow)}, width ${DRAG_SETTLE_MS}ms ease, height ${DRAG_SETTLE_MS}ms ease`;
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

// 已隱藏區開合（按鈕點擊與拖曳／鍵盤降級後強制展開共用）：切 .open 並同步開關的 aria-expanded——
// 鍵盤使用者要靠它知道裡面的列現在 Tab 得到（#6）
function setHiddenItemsOpen(wrap, open) {
  wrap.classList.toggle('open', open);
  const btn = wrap.querySelector('.hidden-items-toggle');
  if (btn) btn.setAttribute('aria-expanded', String(open));
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
          <div class="hidden-item-title">${titleHtml}${draggable ? dragGripHtml('promote') : ''}</div>
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
      <button class="hidden-items-toggle" data-course-id="${courseId}" aria-expanded="false" aria-controls="hidden-items-list-${courseId}">
        <span class="hidden-items-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>
        <span>${esc(tr('hiddenItemsToggle').replace('{n}', items.length))}</span>
      </button>
      <div class="hidden-items-list" id="hidden-items-list-${courseId}">${listInner}</div>
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
  // 描述開關（#7）：整列點擊展開描述，但列不可聚焦（裡面有勾選圈、握把、編輯/刪除，設成 role=button 會巢狀互動元件）→
  // 在左欄放一顆透明、不吃指標事件的 <button> 蓋滿左欄：鍵盤 Tab 停得到，Enter／Space 的 click 冒泡到列，走同一個開關；
  // 焦點框畫在左欄外緣。aria-expanded 由 toggleAssignmentDesc 同步，aria-controls 指向下方的描述
  const descId = `desc-${esc(String(a.id))}`;

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
        <button type="button" class="assignment-desc-toggle" aria-expanded="false" aria-controls="${descId}" aria-label="${esc(a.name)}"></button>
        <div class="assignment-title">${titleHtml}${dragGripHtml('demote')}</div>
        ${customLabel}
        ${groupName ? `<div class="assignment-group">${esc(groupName)}</div>` : ''}
      </div>
      <div class="assignment-right">
        ${dueSlotHtml(`<div class="due-label ${uClass}">${dueLabelFor(a)}</div>`)}
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
    <div class="assignment-desc" id="${descId}">
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
    _detailOrigin = null;   // 不是 Back：不還原來源卡的焦點與捲動
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

// ← 返回：走 history.back()，與瀏覽器返回（手勢／按鈕／Cmd+[）統一由 popstate 處理。
// 按鈕是 index.html 的靜態節點，只綁一次（以前每次 renderCourseDetailSection 都再綁一個：開過 N 次詳情後
// 一次點擊會 history.back() N 次，退過清單那一步、直接離開 dashboard）
document.getElementById('detail-back-btn').addEventListener('click', () => history.back());

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
// onRendered（選用）：畫面重建完之後呼叫——需要在重建後用 id 找回焦點的路徑用（自訂作業編輯／刪除，#8）
function loadData(onRendered) {
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
      if (typeof onRendered === 'function') onRendered();
    }
  );
}

// 重建後把焦點放回（#8）：只在焦點真的掉了（<body> 或已被拆掉的節點）時才動，使用者已經移走的焦點不搶回來。
// 依序試 selectors（在課程詳情內找），都沒有就用清單標題
function refocusInDetail(selectors) {
  const active = document.activeElement;
  if (active && active !== document.body && active.isConnected) return;
  const scope = document.getElementById('course-detail-container');
  if (!scope || currentView !== 'course') return;
  for (const sel of selectors) {
    const el = sel && scope.querySelector(sel);
    if (el) { el.focus(); return; }
  }
  const label = scope.querySelector('.detail-assignments-label');
  if (label) label.focus({ preventScroll: true });
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
    if (settingsMenu.classList.contains('open')) {
      closeSettingsMenu();
    } else {
      settingsMenu.classList.add('open');
      settingsMenuBtn.classList.add('open');
    }
  });

  // 點選單外關閉；子選單在 <body> 層、不在 #settings-menu 裡，點它（例如兩個語言之間的空隙）不算外面
  document.addEventListener('click', (e) => {
    const submenu = document.getElementById('menu-language-submenu');
    if (settingsMenu.contains(e.target) || settingsMenuBtn.contains(e.target)) return;
    if (submenu && submenu.contains(e.target)) return;
    if (settingsMenu.classList.contains('open') || isLanguageSubmenuOpen()) closeSettingsMenu();
  });

  // 鍵盤在母選單裡按 Esc → 收起整個選單、焦點回 ⚙（子選單裡的 Esc 只收子選單，見 bindLanguageMenuActions）
  settingsMenu.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    closeSettingsMenu();
  });
}

if (menuClaudeUsageToggle) {
  menuClaudeUsageToggle.addEventListener('click', () => {
    _showClaudeUsage = !_showClaudeUsage;
    chrome.storage.local.set({ showClaudeUsageInPopup: _showClaudeUsage });
    updateClaudeUsageMenuLabel();
    closeSettingsMenu();
  });
}

if (menuOpenTutorial) {
  menuOpenTutorial.addEventListener('click', () => {
    // 先收選單（焦點還給 ⚙）再開教學：教學的 focus trap 會把當下的焦點記成觸發元素、關閉時還給它——
    // 記到的要是 ⚙，而不是馬上變 display:none 的「使用教學」
    closeSettingsMenu();
    openWelcomeModal();
  });
}

// ── Welcome Modal ──
let _welcomeStep = 1;

function _welcomeUpdateDots(n) {
  document.querySelectorAll('.welcome-dot[data-wstep]').forEach(d => {
    d.classList.toggle('active', +d.dataset.wstep === n);
  });
}

// 按鈕列固定兩個節點（上一步／主按鈕），換頁只就地改文字、data-wgo 與 class（#8）：
// 舊版每步 btnRow.innerHTML 重建，按「開始設定」後持有焦點的按鈕被拆掉、焦點掉到 <body>，Tab 還能離開 modal。
// 第 1 頁沒有「上一步」（hidden）；第 5 頁主按鈕變成「開始使用」（#welcome-done-btn，overlay 委派關閉）
function _welcomeUpdateButtons(n) {
  const btnRow = document.getElementById('welcome-btn-row');
  if (!btnRow) return;

  let prev = btnRow.querySelector('.welcome-btn-prev');
  let main = btnRow.querySelector('.welcome-btn-main');
  if (!prev || !main) {
    btnRow.innerHTML = `
      <button type="button" class="welcome-btn sec welcome-btn-prev"></button>
      <button type="button" class="welcome-btn welcome-btn-main"></button>`;
    prev = btnRow.querySelector('.welcome-btn-prev');
    main = btnRow.querySelector('.welcome-btn-main');
  }

  // 上一步要消失時若正拿著焦點（第 2 頁按「上一步」回第 1 頁）→ 先交給主按鈕
  if (n === 1 && document.activeElement === prev) main.focus();
  prev.hidden = n === 1;
  prev.dataset.wgo = String(Math.max(1, n - 1));
  prev.textContent = tr('wBtnPrev');

  const isLast = n === 5;
  main.classList.toggle('ora', isLast);
  if (isLast) {
    main.id = 'welcome-done-btn';
    delete main.dataset.wgo;
    main.textContent = tr('wBtnDone');
  } else {
    main.removeAttribute('id');
    main.dataset.wgo = String(n + 1);
    main.textContent = tr(n === 1 ? 'wBtnStart' : 'wBtnNext');
  }
}

// 畫面外的 step 設 inert（#9）：5 頁都留在 500% 寬的 track 裡，不設的話 Tab 會落到看不見的頁
// （例如第 5 頁的 mailto），還會把 .welcome-main-area 捲歪；螢幕閱讀器也只念目前這一頁
function _welcomeInert(n) {
  document.querySelectorAll('#welcome-track .welcome-step').forEach((s, i) => {
    s.inert = i + 1 !== n;
  });
}

function openWelcomeModal() {
  _welcomeStep = 1;
  const track = document.getElementById('welcome-track');
  _welcomeInert(1);
  if (track) {
    // 直接歸位到第 1 頁（不滑）：先關 transition、forced reflow 提交位置，再還原（不靠 rAF，背景分頁也成立）
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    track.getBoundingClientRect();
    track.style.transition = '';
  }
  _welcomeUpdateDots(1);
  _welcomeUpdateButtons(1);
  const overlay = document.getElementById('welcome-overlay');
  if (overlay) overlay.classList.add('open');
}

function closeWelcomeModal() {
  const overlay = document.getElementById('welcome-overlay');
  if (overlay) overlay.classList.remove('open');
}

function welcomeGoStep(n) {
  if (n === _welcomeStep) return;
  _welcomeStep = n;
  _welcomeInert(n);   // 在設定 transform 之前：離場頁從第一幀就是 inert
  const track = document.getElementById('welcome-track');
  if (track) track.style.transform = `translateX(-${(n - 1) * 20}%)`;
  _welcomeUpdateDots(n);
  _welcomeUpdateButtons(n);
}

document.getElementById('welcome-close')?.addEventListener('click', closeWelcomeModal);

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
  if (e.target.closest('#welcome-done-btn')) { closeWelcomeModal(); return; }
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
    btn.addEventListener('click', () => removeWeightRow(btn.closest('.weight-edit-row')));
  });

  list.querySelectorAll('.weight-edit-pct').forEach((input) => {
    input.addEventListener('input', updateWeightTotal);
  });

  updateWeightTotal();
}

// 刪除一列權重（清單渲染與「+ 新增項目」共用）：被刪的 ✕ 正拿著焦點，直接 remove 會讓焦點掉出 modal 的 trap →
// 交給下一列（沒有就上一列）的 ✕，刪光了就交給「+ 新增項目」（#8）
function removeWeightRow(row) {
  if (!row) return;
  const neighbour = row.nextElementSibling || row.previousElementSibling;
  row.remove();
  updateWeightTotal();
  refreshWeightColors();
  const to = (neighbour && neighbour.querySelector('.weight-edit-del')) || document.getElementById('weight-edit-add');
  if (to) to.focus();
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
  row.querySelector('.weight-edit-del').addEventListener('click', () => removeWeightRow(row));
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
// inert 子樹（教學畫面外的 step，#9）不算：它們有 client rect、卻永遠拿不到焦點，算進來 trap 的頭尾會錯
function _focusablesIn(container) {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(sel))
    .filter((el) => el.getClientRects().length > 0 && !el.closest('[inert]'));
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

['custom-assignment-overlay', 'weight-edit-overlay', 'welcome-overlay', 'confirm-overlay']
  .forEach((id) => setupModalA11y(document.getElementById(id)));


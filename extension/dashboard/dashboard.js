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
    courses: '課程',
    sync: '同步',
    syncing: '同步中...',
    syncFailed: '同步失敗',
    canvasCandidateLabel: '偵測到另一個 Canvas：',
    canvasCandidateSwitch: '切換到這裡',
    canvasCandidateIgnore: '忽略',
    canvasCandidateSwitching: '切換中…',
    canvasCandidateFailed: '切換失敗：請先登入該 Canvas 再試一次',
    canvasCandidateSyncFailed: '切換失敗，請稍後再試',
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
    confirmDeleteCustomNamed: '確定要刪除「{name}」嗎？',
    customDueInvalid: '截止日期無效，請檢查年份（4 位數）',
    // 自訂作業存到目前畫面看不到的位置時的提示（QA #162）
    customSavedInPending: '已存到「{course}」，在待辦中（目前顯示已繳交）',
    customSavedInSubmitted: '已存到「{course}」，在「已繳交」中',
    customSavedInCourse: '已存到「{course}」',
    customSavedInHidden: '已存到「{course}」的已隱藏區',
    customSavedPastWindow: '已存到「{course}」：逾期超過 30 天，只在課程詳情顯示',
    languageLabel: '語言',
    langZhTw: '繁體中文',
    langZhCn: '简体中文',
    langEn: 'English',
    menuTutorial: '使用教學',
    menuUsageShow: '顯示 Popup Claude 用量',
    menuUsageHide: '隱藏 Popup Claude 用量',
    settingsTitle: '設定',
    loading: '載入中…',
    // formatDue
    noDueDate: '無截止日期',
    // 逾期文案與稽核入口（2026-07）
    overdueToday: '今天到期',
    overdueDaysLabel: '逾{n}天',
    overdueGroup: '已逾期',
    hiddenItemsToggle: '已隱藏 {n} 項',
    hiddenItemsOtherDone: '另 {n} 項已完成，在「已繳交」中',
    hiddenItemsOtherPending: '另 {n} 項未完成，在待辦中',
    hiddenItemsEmpty: '目前沒有隱藏項目（把作業拖到這裡可隱藏）',
    dropToShow: '放開以加入作業清單',
    dropToHide: '放開以隱藏',
    daysLater: '{n}天後',
    daysLaterOne: '{n}天後',
    hoursLater: '{n}h後',
    dueWithRel: '{date}（{rel}）',
    // formatLastSync
    neverSynced: '尚未同步',
    justSynced: '剛才同步',
    minutesAgo: '分鐘前同步',
    hoursAgo: '小時前同步',
    daysAgo: '天前同步',
    // empty states
    // 空狀態：從未同步 vs 已同步但沒有進行中的課程（QA P2-6）
    emptyNeverTitle: '尚未同步',
    emptyNeverBody: '登入你學校的 Canvas，Due 會自動同步課程與作業，待辦就會出現在這裡。',
    emptyNoCoursesTitle: '目前沒有進行中的課程',
    emptyNoCoursesBody: 'Due 只顯示 Canvas 上進行中的課程。學期開始或選課生效後，下次打開 Canvas 就會自動出現。',
    emptyOpenCanvas: '前往 {canvas} ↗',
    needCourses: '同步課程後才能使用',
    // badges
    pendingItems: '件待繳',
    completedItems: '件已完成',
    urgentItems: '件緊急',
    // back button
    back: '返回',
    // list labels
    listAssignment: '作業清單',
    // empty item labels
    noPendingAssignment: '無待繳作業',
    noAssignment: '無作業',
    // weight pie
    noGradeInfo: '沒有評分資訊',
    renameCourse: '重命名',
    weightItemName: '項目名稱',
    // grade calculator
    gradeCalcTitle: '成績計算器',
    gradeExcused: '已免除',
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
    weekDoneLabel: '近期完成',
    weekRingScope: '範圍：30 天內的逾期＋未來 7 天到期',
    weekAllDoneLabel: '全部完成',
    // ui widgets
    editWeight: '編輯',
    weightEditTitle: '編輯評分權重',
    weightReset: '還原 Canvas 權重',
    weightResetReanalyze: '清除並重新分析',
    weightResetClear: '清除權重',
    weightSourceAi: 'AI 分析',
    weightSourceAiTitle: '由 AI 從課程大綱推估，請以大綱為準；在「編輯」改過就不再標示',
    weightSourceCanvas: 'Canvas 設定',
    weightSourceCanvasTitle: '老師在 Canvas 設定的評分比重',
    weightAddItem: '+ 新增項目',
    weightTotal: '總計：',
    unnamedWeight: '未命名',
    submittedBtn: '已繳交',
    weightOverLimit: '總和超過 100%，請調整後再儲存',
    weightZeroTotal: '總和需大於 0%（要清空請刪除所有項目）',
    weightNegative: '權重不可為負數',
    // welcome steps
    wTitle1: '歡迎使用 Due',
    wBody1Intro: 'Due，提醒你該做的事 ⚡️',
    wBody1Q1: '「Canvas找個作業要翻半天」- 有人',
    wBody1Q2: '「明天要交Lab喔...」- 另一個人',
    wTitle2: '登入 Canvas（必須）',
    wBody2: 'Due 透過你的 Canvas 登入狀態同步資料，不需要額外設定或 Token。',
    wStep2Li1: '登入 <a class="welcome-inline-link" id="welcome-canvas-link">{canvas} ↗</a>（點一下，同步完成會自動帶你回來）',
    wCanvasDefaultSchool: 'HKUST(GZ) Canvas',
    wCanvasOtherSchool: '其他學校：打開你學校的 Canvas（網址結尾是 .instructure.com）並登入，Due 會自動偵測',
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
    wStep4Li1: '進入任一<strong>課程頁</strong>，按住作業的 <strong>⠿</strong> 拖到底部「<strong>已隱藏</strong>」區即可隱藏；反之亦然',
    wPinAlt: '釘選 Due 到工具列的步驟示意圖',
    // 教學第 1 頁迷你 Dashboard／第 4 頁拖曳示意圖的文字（隨語言切換）
    wMockTitle: 'Dashboard 概覽',
    wMockCard1: '期中小組報告大綱',
    wMockExam: '考試',
    wMockHide: '隱藏',
    wMockShow: '還原',
    wTitle5: '開始用 Due 吧',
    wBody5: '這幾個功能容易錯過，記得試試：',
    wFeatCustomName: '自動課程分析',
    wFeatCustomDesc: '接上你自己的 AI API，自動抓出每門課的分數權重',
    wFeatRenameName: '課程改名',
    wFeatRenameDesc: '改成你習慣的叫法',
    wSupport5: '有 bug 或建議？跟我說一聲 → <a class="welcome-inline-link" href="mailto:0610raymond@gmail.com">0610raymond@gmail.com</a>',
    wBtnStart: '開始設定',
    wBtnPrev: '上一步',
    wBtnNext: '下一步',
    wBtnDone: '開始使用',
  },
  'zh-CN': {
    courses: '课程',
    sync: '同步',
    syncing: '同步中...',
    syncFailed: '同步失败',
    canvasCandidateLabel: '检测到另一个 Canvas：',
    canvasCandidateSwitch: '切换到这里',
    canvasCandidateIgnore: '忽略',
    canvasCandidateSwitching: '切换中…',
    canvasCandidateFailed: '切换失败：请先登录该 Canvas 再试一次',
    canvasCandidateSyncFailed: '切换失败，请稍后再试',
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
    confirmDeleteCustomNamed: '确定要删除「{name}」吗？',
    customDueInvalid: '截止日期无效，请检查年份（4 位数）',
    customSavedInPending: '已保存到「{course}」，在待办中（当前显示已提交）',
    customSavedInSubmitted: '已保存到「{course}」，在「已提交」中',
    customSavedInCourse: '已保存到「{course}」',
    customSavedInHidden: '已保存到「{course}」的已隐藏区',
    customSavedPastWindow: '已保存到「{course}」：逾期超过 30 天，只在课程详情显示',
    languageLabel: '语言',
    langZhTw: '繁體中文',
    langZhCn: '简体中文',
    langEn: 'English',
    menuTutorial: '使用教程',
    menuUsageShow: '显示 Popup Claude 用量',
    menuUsageHide: '隐藏 Popup Claude 用量',
    settingsTitle: '设置',
    loading: '加载中…',
    noDueDate: '无截止日期',
    overdueToday: '今天到期',
    overdueDaysLabel: '逾{n}天',
    overdueGroup: '已逾期',
    hiddenItemsToggle: '已隐藏 {n} 项',
    hiddenItemsOtherDone: '另 {n} 项已完成，在「已提交」中',
    hiddenItemsOtherPending: '另 {n} 项未完成，在待办中',
    hiddenItemsEmpty: '目前没有隐藏项目（把作业拖到这里可隐藏）',
    dropToShow: '放开以加入作业清单',
    dropToHide: '放开以隐藏',
    daysLater: '{n}天后',
    daysLaterOne: '{n}天后',
    hoursLater: '{n}h后',
    dueWithRel: '{date}（{rel}）',
    neverSynced: '尚未同步',
    justSynced: '刚才同步',
    minutesAgo: '分钟前同步',
    hoursAgo: '小时前同步',
    daysAgo: '天前同步',
    emptyNeverTitle: '尚未同步',
    emptyNeverBody: '登录你学校的 Canvas，Due 会自动同步课程和作业，待办就会出现在这里。',
    emptyNoCoursesTitle: '目前没有进行中的课程',
    emptyNoCoursesBody: 'Due 只显示 Canvas 上进行中的课程。学期开始或选课生效后，下次打开 Canvas 就会自动出现。',
    emptyOpenCanvas: '前往 {canvas} ↗',
    needCourses: '同步课程后才能使用',
    pendingItems: '件待交',
    completedItems: '件已完成',
    urgentItems: '件紧急',
    back: '返回',
    listAssignment: '作业清单',
    noPendingAssignment: '无待交作业',
    noAssignment: '无作业',
    noGradeInfo: '没有评分信息',
    renameCourse: '重命名',
    weightItemName: '项目名称',
    gradeCalcTitle: '成绩计算器',
    gradeExcused: '已免除',
    noDesc: '（无描述）',
    submittedBadge: '已交',
    markDone: '标记完成',
    markUndone: '取消完成',
    undoComplete: '撤销',
    within7Days: '7天内',
    within30Days: '8-30天',
    beyond30Days: '30天以上',
    noTasks: '无待办事项',
    weekDoneLabel: '近期完成',
    weekRingScope: '范围：30 天内的逾期＋未来 7 天到期',
    weekAllDoneLabel: '全部完成',
    editWeight: '编辑',
    weightEditTitle: '编辑评分权重',
    weightReset: '还原 Canvas 权重',
    weightResetReanalyze: '清除并重新分析',
    weightResetClear: '清除权重',
    weightSourceAi: 'AI 分析',
    weightSourceAiTitle: '由 AI 从课程大纲推估，请以大纲为准；在「编辑」改过就不再标示',
    weightSourceCanvas: 'Canvas 设定',
    weightSourceCanvasTitle: '老师在 Canvas 设定的评分比重',
    weightAddItem: '+ 新增项目',
    weightTotal: '总计：',
    unnamedWeight: '未命名',
    submittedBtn: '已提交',
    weightOverLimit: '总和超过 100%，请调整后再保存',
    weightZeroTotal: '总和需大于 0%（要清空请删除所有项目）',
    weightNegative: '权重不能为负数',
    wTitle1: '欢迎使用 Due',
    wBody1Intro: 'Due，提醒你该做的事 ⚡️',
    wBody1Q1: '「Canvas 很烦，找个作业要翻半天」- 某人',
    wBody1Q2: '「啥？明天要交Lab？」- 另一个人',
    wTitle2: '登录 Canvas（必须）',
    wBody2: 'Due 通过你的 Canvas 登录状态同步数据，无需额外设置或 Token。',
    wStep2Li1: '登录 <a class="welcome-inline-link" id="welcome-canvas-link">{canvas} ↗</a>（点一下，同步完成后会自动带你回来）',
    wCanvasDefaultSchool: 'HKUST(GZ) Canvas',
    wCanvasOtherSchool: '其他学校：打开你学校的 Canvas（网址结尾是 .instructure.com）并登录，Due 会自动识别',
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
    wStep4Li1: '进入任一<strong>课程页</strong>，按住作业的 <strong>⠿</strong> 拖到底部「<strong>已隐藏</strong>」区即可隐藏；反之亦然',
    wPinAlt: '固定 Due 到工具栏的步骤示意图',
    wMockTitle: 'Dashboard 概览',
    wMockCard1: '期中小组报告大纲',
    wMockExam: '考试',
    wMockHide: '隐藏',
    wMockShow: '还原',
    wTitle5: '开始用 Due 吧',
    wBody5: '这几个功能容易错过，记得试试：',
    wFeatCustomName: '自动课程分析',
    wFeatCustomDesc: '接入你自己的 AI API，自动抓取每门课的分数权重',
    wFeatRenameName: '课程改名',
    wFeatRenameDesc: '改成你习惯的叫法',
    wSupport5: '有 bug 或建议？跟我说一声 → <a class="welcome-inline-link" href="mailto:0610raymond@gmail.com">0610raymond@gmail.com</a>',
    wBtnStart: '开始设置',
    wBtnPrev: '上一步',
    wBtnNext: '下一步',
    wBtnDone: '开始使用',
  },
  en: {
    courses: 'Courses',
    sync: 'Sync',
    syncing: 'Syncing...',
    syncFailed: 'Sync failed',
    canvasCandidateLabel: 'Another Canvas detected: ',
    canvasCandidateSwitch: 'Switch to it',
    canvasCandidateIgnore: 'Ignore',
    canvasCandidateSwitching: 'Switching…',
    canvasCandidateFailed: 'Couldn’t switch. Sign in to that Canvas and try again.',
    canvasCandidateSyncFailed: 'Couldn’t switch. Try again in a moment.',
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
    confirmDeleteCustomNamed: 'Delete "{name}"?',
    customDueInvalid: 'Invalid due date. Check the year (4 digits)',
    customSavedInPending: "Saved to {course}. It's in your to-dos (you're viewing Submitted)",
    customSavedInSubmitted: 'Saved to {course}, under Submitted',
    customSavedInCourse: 'Saved to {course}',
    customSavedInHidden: 'Saved to {course}, in its hidden items',
    customSavedPastWindow: 'Saved to {course}. Over 30 days overdue, so it only shows on the course page',
    languageLabel: 'Language',
    langZhTw: 'Traditional Chinese',
    langZhCn: 'Simplified Chinese',
    langEn: 'English',
    menuTutorial: 'Tutorial',
    menuUsageShow: 'Show Claude usage in popup',
    menuUsageHide: 'Hide Claude usage in popup',
    settingsTitle: 'Settings',
    loading: 'Loading…',
    noDueDate: 'No due date',
    overdueToday: 'due today',
    overdueDaysLabel: '{n}d late',
    overdueGroup: 'Overdue',
    hiddenItemsToggle: '{n} hidden',
    hiddenItemsOtherDone: '{n} more done, under Submitted',
    hiddenItemsOtherPending: '{n} more not done, in the to-do list',
    hiddenItemsEmpty: 'Nothing hidden (drag items here to hide)',
    dropToShow: 'Drop to add to list',
    dropToHide: 'Drop to hide',
    daysLater: '{n} days left',
    daysLaterOne: '{n} day left',
    hoursLater: '{n}h left',
    dueWithRel: '{date} ({rel})',
    neverSynced: 'Never synced',
    justSynced: 'Just synced',
    minutesAgo: 'min ago',
    hoursAgo: 'hr ago',
    daysAgo: 'd ago',
    emptyNeverTitle: 'Not synced yet',
    emptyNeverBody: "Log in to your school's Canvas and Due syncs your courses and assignments automatically. Your to-dos will show up here.",
    emptyNoCoursesTitle: 'No active courses right now',
    emptyNoCoursesBody: "Due only shows courses that are active on Canvas. Once your term starts or your enrollment is confirmed, they'll appear the next time you open Canvas.",
    emptyOpenCanvas: 'Open {canvas} ↗',
    needCourses: 'Available once your courses sync',
    pendingItems: ' pending',
    completedItems: ' done',
    urgentItems: ' urgent',
    back: 'Back',
    listAssignment: 'Assignments',
    noPendingAssignment: 'No pending assignments',
    noAssignment: 'No assignments',
    noGradeInfo: 'No grade info',
    renameCourse: 'Rename',
    weightItemName: 'Item name',
    gradeCalcTitle: 'Grade Calculator',
    gradeExcused: 'Excused',
    noDesc: '(No description)',
    submittedBadge: 'Submitted',
    markDone: 'Mark done',
    markUndone: 'Mark undone',
    undoComplete: 'Undo',
    within7Days: 'Due ≤ 7d',
    within30Days: '8-30 days',
    beyond30Days: 'Later (30d+)',
    noTasks: 'No pending tasks',
    weekDoneLabel: 'Near-term',
    weekRingScope: 'Overdue within 30 days + due in the next 7 days',
    weekAllDoneLabel: 'All done',
    editWeight: 'Edit',
    weightEditTitle: 'Edit Grade Weights',
    weightReset: 'Reset to Canvas weights',
    weightResetReanalyze: 'Clear and re-analyze',
    weightResetClear: 'Clear weights',
    weightSourceAi: 'AI analysis',
    weightSourceAiTitle: 'Estimated by AI from the syllabus. Check it against the syllabus; the label goes away once you edit the weights.',
    weightSourceCanvas: 'Set in Canvas',
    weightSourceCanvasTitle: 'Grading weights your instructor set in Canvas',
    weightAddItem: '+ Add Item',
    weightTotal: 'Total:',
    unnamedWeight: 'Unnamed',
    submittedBtn: 'Submitted',
    weightOverLimit: 'Total is over 100%. Adjust it before saving',
    weightZeroTotal: 'Total must be above 0% (to clear, delete every item)',
    weightNegative: 'Weights cannot be negative',
    wTitle1: 'Welcome to Due',
    wBody1Intro: 'Due — your assignment tracker ⚡️',
    wBody1Q1: '"Canvas is a mess — finding one assignment takes forever" — someone',
    wBody1Q2: '"Wait, the lab is due tomorrow?" — someone else',
    wTitle2: 'Log in to Canvas (Required)',
    wBody2: 'Due syncs data using your Canvas login session — no extra setup or tokens needed.',
    wStep2Li1: 'Log in to <a class="welcome-inline-link" id="welcome-canvas-link">{canvas} ↗</a> (click it — you\'ll be brought back automatically once syncing finishes)',
    wCanvasDefaultSchool: 'HKUST(GZ) Canvas',
    wCanvasOtherSchool: 'Other school? Open your school\'s Canvas (its address ends in .instructure.com) and log in — Due detects it automatically',
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
    wStep4Li1: 'Open any <strong>course page</strong>, grab an assignment\'s <strong>⠿</strong> and drop it into <strong>Hidden</strong> to hide it, or drag it back to restore — it works both ways',
    wPinAlt: 'How to pin Due to the toolbar',
    wMockTitle: 'Dashboard overview',
    wMockCard1: 'Group report outline',
    wMockExam: 'Exam',
    wMockHide: 'Hide',
    wMockShow: 'Show',
    wTitle5: 'Start using Due',
    wBody5: 'A couple of features worth trying:',
    wFeatCustomName: 'Auto course analysis',
    wFeatCustomDesc: 'Connect your own AI API to auto-fill each course\'s grade weights',
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
  // 第 1 頁迷你 Dashboard：與真介面同一套字串（日期標籤走 formatDue 同款格式）
  setText('wmock-title', 'wMockTitle');
  setText('wmock-ring-cap', 'weekDoneLabel');
  const mockRing = document.getElementById('wmock-ring');
  if (mockRing) mockRing.setAttribute('aria-label', `${tr('weekDoneLabel')} 3/5`);
  setText('wmock-sum-overdue', 'overdueGroup');
  setText('wmock-sum-urgent', 'within7Days');
  setText('wmock-sum-soon', 'within30Days');
  setText('wmock-card1', 'wMockCard1');
  const mockDate = dueWithRel(shortDateStr(new Date(2000, 2, 15)), daysLaterText(3));
  ['wmock-date1', 'wmock-date2'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = mockDate;
  });
  setText('wstep-2-title', 'wTitle2');
  setText('wstep-2-body', 'wBody2');
  renderWelcomeCanvasLine();
  setHTML('wstep-2-li2', 'wStep2Li2');
  setText('wstep-2-li3', 'wStep2Li3');
  setText('wstep-3-title', 'wTitle3');
  setText('wstep-3-body', 'wBody3');
  setText('wstep-3-joke', 'wBody3Joke');
  setHTML('wstep-3-li1', 'wStep3Li1');
  setHTML('wstep-3-li2', 'wStep3Li2');
  setText('wstep-3-li3', 'wStep3Li3');
  const pinImg = document.getElementById('wstep-3-img');
  if (pinImg) pinImg.alt = tr('wPinAlt');
  setText('wstep-4-title', 'wTitle4');
  setHTML('wstep-4-body', 'wBody4');
  setHTML('wstep-4-li1', 'wStep4Li1');
  // 第 4 頁拖曳示意圖（SVG）的文字
  const wdsHidden = document.getElementById('wds-hidden-label');
  if (wdsHidden) wdsHidden.textContent = tr('hiddenItemsToggle').replace('{n}', 2);
  setText('wds-exam', 'wMockExam');
  setSvgVerticalLabel(document.getElementById('wds-hide'), tr('wMockHide'));
  setSvgVerticalLabel(document.getElementById('wds-show'), tr('wMockShow'));
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

// 示意圖箭頭旁的直排短標：中文逐字直排（每字一個 tspan），英文整個字轉 90° 直排
function setSvgVerticalLabel(el, text) {
  if (!el) return;
  if (el.dataset.x == null) { el.dataset.x = el.getAttribute('x'); el.dataset.y = el.getAttribute('y'); }
  const { x, y } = el.dataset;
  if (/^[\u3000-\u9fff\uff00-\uffef]+$/.test(text)) {
    el.removeAttribute('transform');
    el.removeAttribute('text-anchor');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.innerHTML = [...text].map((ch, i) => `<tspan x="${x}" dy="${i ? 12 : 0}">${esc(ch)}</tspan>`).join('');
  } else {
    // 轉 90° 後字身落在錨點右側；以兩個中文字直排的中心（y+2）為中點、右移 2px 避開箭頭弧線
    const cx = +x + 2;
    const cy = +y + 2;
    el.textContent = text;
    el.setAttribute('x', cx);
    el.setAttribute('y', cy);
    el.setAttribute('text-anchor', 'middle');
    el.setAttribute('transform', `rotate(90 ${cx} ${cy})`);
  }
}

// 「登入 Canvas」那一行：已偵測到學校 → 連到該校；尚未偵測 → 明講是 HKUST(GZ)，並說明其他學校怎麼做。
// 連結文字與連結目標必須出自同一份狀態（_welcomeCanvasBase；點擊時的目標見 openCanvasTab 的 onBase，review OB-3）
function renderWelcomeCanvasLine() {
  const li1 = document.getElementById('wstep-2-li1');
  if (!li1) return;
  const label = _welcomeCanvasBase ? 'Canvas' : tr('wCanvasDefaultSchool');
  li1.innerHTML = tr('wStep2Li1').replace('{canvas}', () => esc(label))
    + (_welcomeCanvasBase ? '' : `<span class="welcome-inst-sub">${esc(tr('wCanvasOtherSchool'))}</span>`);
}

// 重讀 storage 的 canvasBaseUrl（尚未同步出課程時 _currentData 是空的）；有變才重畫第 2 頁那一行
function setWelcomeCanvasBase(base) {
  const next = base || null;
  if (next === _welcomeCanvasBase) return;
  _welcomeCanvasBase = next;
  renderWelcomeCanvasLine();
}
function refreshWelcomeCanvasBase() {
  chrome.storage.local.get(['canvasBaseUrl'], (d) => setWelcomeCanvasBase(d && d.canvasBaseUrl));
}

function setUILanguage(lang) {
  _uiLanguage = lang;
  saveLocal({ uiLanguage: lang });
  applyUILanguage();
  updateClaudeUsageMenuLabel();
  loadData();
}

function applyUILanguage() {
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = tr(key);
  };
  document.documentElement.lang = _uiLanguage;   // zh-TW／zh-CN／en（讀屏發音、斷字跟著語言，QA #125）
  const headerMeta = document.getElementById('header-meta');
  if (headerMeta && headerMeta.dataset.loading) headerMeta.textContent = tr('loading');
  setText('label-courses', 'courses');
  // 同步進行中保留三點（不然會變成「Sync」字樣卻停用、像壞掉的按鈕，QA #194）
  if (!_syncInFlight) setText('sync-btn', 'sync');
  setText('canvas-candidate-label', 'canvasCandidateLabel');
  setText('canvas-candidate-ignore', 'canvasCandidateIgnore');
  renderCanvasCandidate();   // 「切換到這裡／切換中…」與失敗說明依狀態而定
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
  setText('weight-edit-reset', _weightResetKey);
  setText('settings-menu-title', 'settingsTitle');
  const settingsBtn = document.getElementById('settings-menu-btn');
  if (settingsBtn) {
    settingsBtn.title = tr('settingsTitle');
    settingsBtn.setAttribute('aria-label', tr('settingsTitle'));
  }
  if (_noCoursesMode) setNoCoursesMode(true);   // 停用鈕的說明 tooltip 跟著換語言
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
// AI 分析是否已設定 key（只存布林，不把 aiConfig 放進頁面快取）：決定權重編輯器清除鈕的文字（D3）
let _aiConfigured = false;
// 權重編輯器清除鈕目前用的 i18n key：有 Canvas 權重→還原；沒有→清除並重新分析（AI 已設定）／清除權重
let _weightResetKey = 'weightReset';
let _lastRenderAt = 0;   // 上次以資料完整 render() 的時間（0＝尚未渲染或目前是空狀態；即時刷新用，見 refreshView）

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

  const dateStr = shortDateStr(d);

  if (diffMs < 0) {
    const n = DueTaskRules.overdueDays(dueAt);
    const label = n === 0 ? tr('overdueToday') : tr('overdueDaysLabel').replace('{n}', n);
    return dueWithRel(dateStr, label);
  }

  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    const roundedHours = Math.floor((diffMs + 1800000) / 3600000);
    return dueWithRel(dateStr, tr('hoursLater').replace('{n}', roundedHours));
  }

  const dueDayUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDayUtc - nowDayUtc) / 86400000);
  return dueWithRel(dateStr, daysLaterText(diffDays));
}

// 「3月15日」／「Mar 15」（簡中用 zh-CN locale，輸出與繁中相同）
function shortDateStr(d) {
  const locale = _uiLanguage === 'en' ? 'en-US' : (_uiLanguage === 'zh-CN' ? 'zh-CN' : 'zh-TW');
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

// 日期＋相對時間：中文全形括號不留空格「3月15日（3天後）」、英文半形括號「Mar 15 (3 days left)」（QA #23/#133）
function dueWithRel(dateStr, rel) {
  return tr('dueWithRel').replace('{date}', () => dateStr).replace('{rel}', () => rel);
}

// 「N 天後」：英文單複數分開（1 day left / 3 days left）
function daysLaterText(n) {
  return tr(n === 1 ? 'daysLaterOne' : 'daysLater').replace('{n}', n);
}

// 列上的時間標籤：已完成且時間已過 → 什麼都不寫（過去的事無需再標示；已繳交視圖／稽核列適用）
function dueLabelFor(a) {
  if (isDone(a) && a.due_at && new Date(a.due_at).getTime() <= Date.now()) return '';
  return formatDue(a.due_at);
}

// header：「學校 · N 分鐘前同步」（render、空狀態與每分鐘 tick 共用）→ [校名, 同步狀態]
function headerMetaParts() {
  const { lastSync, schoolName = 'Canvas' } = _currentData;
  return [schoolName, formatLastSync(lastSync)];
}

// 寫入側欄 header meta：「校名 · 同步時間」拆兩段——同步時間永遠完整顯示；校名放不下時先微縮字（13→11px 為地板），
// 仍放不下就省略號（整格 title 看全名）。舊版一路縮到 8px 仍裁掉同步時間（QA #135）。status 省略＝單段提示文字（同步中…）
const META_FONT_PX = 13;
const META_FONT_MIN_PX = 11;
function setHeaderMeta(main, status) {
  const el = document.getElementById('header-meta');
  if (!el) return;
  delete el.dataset.loading;
  el.style.fontSize = '';
  if (status == null) {
    el.textContent = main;
    el.removeAttribute('title');
    return;
  }
  el.innerHTML = '<span class="meta-school"></span><span class="meta-sync"></span>';
  const school = el.firstChild;
  school.textContent = main;
  el.lastChild.textContent = ` · ${status}`;
  el.title = `${main} · ${status}`;
  let size = META_FONT_PX;
  while (school.scrollWidth > school.clientWidth && size > META_FONT_MIN_PX) {
    size -= 0.5;
    el.style.fontSize = `${size}px`;
  }
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
// （勾選圈寫哪張 map 已收進 DueCompletion.setDone，點擊當下現算；此包裝留給其他判斷用）
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

// 作業是否屬於某個 assignment group：以作業本身的 assignment_group_id 對應
// （同步不再帶 include[]=assignments，group 不內嵌作業清單）；
// 作業缺 assignment_group_id 時（舊 mock 資料）才退回比對舊資料殘留的 group.assignments。自訂作業不屬於任何 group
function inGroup(a, g) {
  if (!a || !g) return false;
  if (a.assignment_group_id != null) return a.assignment_group_id === g.id;
  return !!(g.assignments && g.assignments.some((ga) => ga.id === a.id));
}

function findGroup(assignment, groups) {
  return (groups || []).find((g) => inGroup(assignment, g)) || null;
}

function findGroupName(assignment, groups) {
  const g = findGroup(assignment, groups);
  return g ? g.name : '';
}

// 寫入使用者資料：失敗（例如超過 storage 配額）只把 runtime.lastError 記到 console，不加 UI；
// cb 照常呼叫，維持原本「寫完接著重繪」的流程
function saveLocal(obj, cb) {
  chrome.storage.local.set(obj, () => {
    const err = chrome.runtime && chrome.runtime.lastError;
    if (err) console.error('[Due] storage 寫入失敗:', Object.keys(obj).join(', '), err.message);
    if (cb) cb();
  });
}

// ── 共享 storage key 的 read-modify-write（QA P1-2）──
// popup／其他 dashboard 分頁也會寫同一批 key（manualDone、manualUndone、manualShown、manualHidden、
// scores、courseNames、customAssignments、customWeights）。不可拿本頁 _currentData 快照整包覆寫（會吃掉別處的變更），
// 一律：讀 storage 最新值 → 套用這次修改 → 寫回 → 結果併回 _currentData。
// mutate(cur) 收各 key 目前值（缺 key → undefined）、回傳要寫入的 patch；必須是「目標狀態」寫法（冪等、不 mutate 輸入），
// 因為它會套兩次：
//   1) optimistic（預設）：先對本頁 _currentData 套一次 → 呼叫端可立刻同步重繪／判斷 isDone，不必等 storage
//   2) 排進本頁寫入佇列：前一筆 set 完成才讀下一筆（同頁連點時第二筆讀得到第一筆的結果），以 storage 最新值為底再套一次
// optimistic:false 只做 2)（customAssignments 這類寫完才重繪的；結果仍會併回 _currentData）；done(patch) 在 set 完成後呼叫。
// 跨 context 的同毫秒競寫仍可能（沒有鎖），但窗口從「分頁存活期間」縮到一次 get→set 之間。
const SHARED_USER_KEYS = ['manualDone', 'manualUndone', 'manualShown', 'manualHidden', 'scores', 'courseNames', 'customAssignments', 'customWeights'];
let _writeQueue = Promise.resolve();
const _selfWrites = {};   // key → 本頁寫出、尚待 onChanged 回聲的值（canonical JSON）；回聲只併資料、不觸發重繪

// 回聲比對用的 canonical JSON：純物件 key 遞迴排序後再 stringify（陣列保持原順序）。
// 真 Chrome 的 storage 把值存成 key 排序過的 map，onChanged 送回的物件 key 順序≠本頁寫入時的插入順序
// （custom-assignment-<uuid> 這類非整數 key、自訂作業物件的欄位）→ 直接 JSON.stringify 比不中，被誤判成外部變更多重繪一次
function _canonJson(v) {
  const sortDeep = (x) => {
    if (Array.isArray(x)) return x.map(sortDeep);
    if (x && typeof x === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(x))) {
      const out = {};
      Object.keys(x).sort().forEach((k) => { out[k] = sortDeep(x[k]); });
      return out;
    }
    return x;
  };
  return JSON.stringify(sortDeep(v === undefined ? null : v));
}

function _pickKeys(obj, keys) {
  const out = {};
  keys.forEach((k) => { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
}

// 把單一 storage key 的新值併進 _currentData（render 存的形狀：assignments＝Canvas＋自訂合併、自訂作業已正規化）
function _mergeIntoCurrentData(patch) {
  let assignmentsTouched = false;
  Object.keys(patch).forEach((key) => {
    const value = patch[key];
    if (key === 'assignments') {
      _currentData.canvasAssignments = value || {};
      assignmentsTouched = true;
    } else if (key === 'customAssignments') {
      _currentData.customAssignments = DueCustomAssignments.normalizeCustomAssignmentMap(value || {});
      assignmentsTouched = true;
    } else if (SHARED_USER_KEYS.includes(key)) {
      _currentData[key] = value || {};
    } else {
      _currentData[key] = value;
    }
  });
  if (assignmentsTouched) {
    _currentData.assignments = DueCustomAssignments.mergeAssignmentMaps(
      _currentData.canvasAssignments || {}, _currentData.customAssignments || {});
  }
}

function updateShared(keys, mutate, { optimistic = true, done = null } = {}) {
  if (optimistic) _mergeIntoCurrentData(mutate(_pickKeys(_currentData, keys)) || {});
  _writeQueue = _writeQueue.then(() => new Promise((resolve) => {
    chrome.storage.local.get(keys, (latest) => {
      let patch;
      try {
        patch = mutate(latest || {}) || {};
      } catch (err) {
        console.error('[Due] 合併寫入失敗:', keys.join(', '), err);
        resolve();
        return;
      }
      Object.keys(patch).forEach((k) => {
        const json = _canonJson(patch[k]);
        // 值沒變（含只差 key 順序）→ storage 不會發 onChanged，不記（否則殘留紀錄會把日後別處寫出的同值誤判成回聲）
        if (json === _canonJson(latest ? latest[k] : undefined)) return;
        const q = (_selfWrites[k] = _selfWrites[k] || []);
        q.push(json);
        if (q.length > 20) q.shift();
      });
      _mergeIntoCurrentData(patch);
      saveLocal(patch, () => {
        resolve();
        if (done) done(patch);
      });
    });
  })).catch((err) => console.error('[Due] 寫入佇列錯誤:', err));
}

// 在 map 上設/刪單一 id 旗標（immutable）：val=true → true；false → 刪 key（不留 false）
function _withFlag(map, id, val) {
  const next = { ...(map || {}) };
  if (val) next[String(id)] = true; else delete next[String(id)];
  return next;
}

let showSubmitted = false;

// ── 系統「減少動態效果」（QA #138）：頁面滑動、課程 morph、碎點爆、進度環慶祝、拖曳落點飛入一律改瞬間；
// CSS 端（index.html 的 prefers-reduced-motion 區塊）把其餘過渡／動畫壓成瞬間（撤銷倒數條除外：它是計時資訊）
const _reducedMotionMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
function prefersReducedMotion() {
  return !!(_reducedMotionMQ && _reducedMotionMQ.matches);
}

// ── 完成過渡動畫（碎點爆）狀態 ──
const COMPLETE_DELAY_MS = 1500;       // 勾選後的撤銷窗口（毫秒）
const COMPLETE_BURST_MS = 480;        // 碎點爆淡出後才重繪（略長於 .45s 動畫）
const _completeTimers = {};           // assignmentId → 撤銷窗口 timer；`${id}:burst` → 爆開後重繪 timer
let _completeSettle = null;           // 已爆完、等其他撤銷窗口／爆開結束才執行的統一重繪（批次收尾）

// 清掉所有殘留完成計時器（重繪/切頁前呼叫，course detail 與 week 卡共用；爆開後的重繪 timer 也在內，QA #113）
function clearCompleteTimers() {
  Object.keys(_completeTimers).forEach((k) => { clearTimeout(_completeTimers[k]); delete _completeTimers[k]; });
  _completeSettle = null;
}

// 一筆完成收尾（爆完或撤銷）後：仍有其他撤銷窗口／爆開進行中 → 先不重繪（已爆完的列維持淡出後的原位，
// 不推動其他列），等最後一筆收尾再統一重繪一次；否則立即執行。
// 重繪會 clearCompleteTimers，提早重繪會截斷其他卡片的撤銷窗口（QA #16）
function settleCompletion(rerender) {
  if (rerender) _completeSettle = rerender;
  if (Object.keys(_completeTimers).length || !_completeSettle) return;
  const run = _completeSettle;
  _completeSettle = null;
  run();
}

// 依 id（＋課程）找 _currentData 裡的作業（含自訂作業）；cid 缺省時掃全部課程
function findAssignment(id, cid) {
  const all = _currentData.assignments || {};
  const lists = cid != null && !Number.isNaN(cid) ? [all[cid] || []] : Object.values(all);
  for (const list of lists) {
    const hit = list.find((x) => String(x.id) === String(id));
    if (hit) return hit;
  }
  return null;
}

// 把作業設成目標完成狀態：兩張 map 一起由 DueCompletion.setDone 決定（依「當下」外部事實，
// 不讀 render 時的屬性），經 updateShared 做樂觀更新＋storage read-modify-write
function setCompletion(id, cid, done) {
  const a = findAssignment(id, cid);
  if (!a) return;
  updateShared(['manualDone', 'manualUndone'], (cur) => DueCompletion.setDone(cur, a, done));
}

// 勾選圈點擊：以「畫面顯示的狀態」（勾選圈 data-done）翻轉（完成 ↔ 未完成）。
// 不用點擊當下重算的 isDone：render 之後作業可能已變成外部完成（升級的考試時間到、背景同步已併進 _currentData
// 但重繪因撤銷窗口／焦點延後），重算會把「看起來未勾」的這一點反向寫成未完成（manualUndone）。
// 寫哪張 map 仍由 setDone 依當下外部事實決定
function toggleCompletion(id, cid, shownDone) {
  setCompletion(id, cid, !shownDone);
}

// 撤銷完成：還原到「未完成」（外部完成 → manualUndone 覆蓋；否則 → 移除 manualDone）
function revertCompletion(id, cid) {
  setCompletion(id, cid, false);
}

// ── View 狀態 ──
let currentView = 'grid';      // 'grid' | 'course'
let currentCourseId = null;
// 側欄雙擊課程名 → 進入重命名（同課 300ms 內連點兩下）：計時狀態放模組層級，第一下重繪換掉按鈕後仍讀得到
const NAV_RENAME_DBLCLICK_MS = 300;
let _navLastRenameId = null;
let _navLastRenameTime = 0;
let currentPage = 'week';      // 'week' | 'courses'
const cardPages = {};           // { [`${courseId}:todo|done`]: pageIndex }——待繳／已繳交各記各的頁（cardPageKey）
const CARD_PAGE_SIZE = 3;       // 課程卡片每頁作業數（renderCardBottom / updateCardPage 共用）
// 分頁索引依完成桶分開：待繳停在第 2 頁時切到已繳交，不能直接跳到已繳交清單的第 2 頁（QA #165）
function cardPageKey(courseId) { return `${courseId}:${showSubmitted ? 'done' : 'todo'}`; }

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

// 清單標題；「已繳交」過濾開著時附上過濾名，詳情頁內就看得出目前在看哪一桶（頁面標題在詳情模式被隱藏，QA #5/#119）
function currentListLabel() {
  const base = esc(tr('listAssignment'));
  return showSubmitted ? `${base}<span class="detail-filter-tag">${esc(tr('submittedBtn'))}</span>` : base;
}
function cardEmptyLabel() { return tr('noPendingAssignment'); }
function noItemsLabel() { return tr('noAssignment'); }

// ── 套用篩選到作業列表 ──
// 考試/簽到＝可被自動隱藏的類別（委派 taskRules，popup 共用）；使用者親手建立的自訂作業一律不自動隱藏
// （名稱含 Quiz/Midterm/簽到也照樣顯示，QA P1-6；手動拖進已隱藏區仍走 manualHidden）
function isHideable(a) {
  return DueTaskRules.isHideable(a);
}

// 使用者是否手動把此隱藏項「升級」為正常作業（拖曳升級，見 spec 2026-07-22）
function isManuallyShown(a) {
  return !!(_currentData.manualShown || {})[String(a && a.id)];
}

// 寫入升級/降級：val=true 升級（視同一般作業）、false 降級（回自動隱藏）；樂觀更新＋storage read-modify-write＋重繪詳情/側欄
function setManualShown(id, val, courseId = currentCourseId) {
  updateShared(['manualShown'], (cur) => ({ manualShown: _withFlag(cur.manualShown, id, val) }));
  rerenderDetailAndNav(courseId);
}

// 使用者是否手動把「一般作業」收進稽核區（拖曳隱藏，見 spec 2026-07-22 drag-hide-all）
function isManuallyHidden(a) {
  return !!(_currentData.manualHidden || {})[String(a && a.id)];
}

// 寫入手動隱藏（一般作業）：val=true 隱藏、false 顯示；樂觀更新＋storage read-modify-write＋重繪
function setManualHidden(id, val, courseId = currentCourseId) {
  updateShared(['manualHidden'], (cur) => ({ manualHidden: _withFlag(cur.manualHidden, id, val) }));
  rerenderDetailAndNav(courseId);
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
// courseId 由拖曳開始時記下（ctx.courseId），不讀當下的 currentCourseId——拖曳中導覽離開時它已是 null，
// 查不到作業會把考試誤寫進 manualHidden（QA #205）
function setItemHiddenByDrag(id, makeHidden, courseId = currentCourseId) {
  const a = ((_currentData.assignments || {})[courseId] || []).find((x) => String(x.id) === String(id));
  if (a && isHideable(a)) setManualShown(id, !makeHidden, courseId);
  else setManualHidden(id, makeHidden, courseId);
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
      // 以 storage 最新值為底（read-modify-write，見 updateShared）；寫完以 _currentData 原地重繪（refreshView 保留已隱藏區開合與捲動）
      updateShared(['customAssignments'], (cur) => {
        const customAssignments = { ...(cur.customAssignments || {}) };
        if (oldKey === newKey) {
          // 同課程：就地取代（保留原順序）；找不到就補到最前
          const list = [...(customAssignments[newKey] || [])];
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
        return { customAssignments };
      }, { optimistic: false, done: () => afterCustomSaved(updated.id) });
    } else {
      // ── 新增：建立新筆並置於該課程陣列最前 ──
      const assignment = DueCustomAssignments.createCustomAssignment(input);
      const key = String(assignment.course_id);
      updateShared(['customAssignments'], (cur) => {
        const customAssignments = { ...(cur.customAssignments || {}) };
        customAssignments[key] = [assignment, ...(customAssignments[key] || [])];
        return { customAssignments };
      }, { optimistic: false, done: () => afterCustomSaved(assignment.id) });
    }
  } catch (err) {
    // 依錯誤種類指向正確欄位（日期打錯不能再顯示成「請輸入作業名稱」，QA #161）
    if (errorEl) errorEl.textContent = tr(err && err.code === 'invalid_due' ? 'customDueInvalid' : 'customNameRequired');
  }
}

// 存檔寫入完成：關 modal、原地重繪；若作業落在目前畫面看不到的地方，短 toast 告知去處（QA #162）
function afterCustomSaved(id) {
  closeCustomAssignmentModal();
  refreshView();
  showToast(customPlacementNote(findAssignment(id)));
}

// 自訂作業在「目前畫面」看不到時，回傳說明它在哪的一句話；看得到 → ''（不打擾）
// 判斷順序：完成桶不符（已繳交視圖 vs 待辦）→ 在別門課（詳情頁）→ 被收進已隱藏區（清單頁）→ 週待辦的 30 天逾期窗外
function customPlacementNote(a) {
  if (!a) return '';
  const course = (_currentData.courses || []).find((c) => String(c.id) === String(a.course_id));
  // 函式型替換：課名含 $&、$$ 等時不被 String.replace 當成特殊樣式展開
  const say = (key) => tr(key).replace('{course}', () => (course ? getCourseName(course) : ''));
  if (isDone(a) !== showSubmitted) return say(showSubmitted ? 'customSavedInPending' : 'customSavedInSubmitted');
  if (currentView === 'course') {
    // 同一門課的詳情：主清單或已隱藏區都在畫面上
    return String(currentCourseId) === String(a.course_id) ? '' : say('customSavedInCourse');
  }
  if (isHidden(a)) return say('customSavedInHidden');
  const pastWindow = DueTaskRules.urgency(a.due_at) === 'overdue' && !DueTaskRules.isWithinOverdueWindow(a.due_at);
  if (currentPage === 'week' && !showSubmitted && pastWindow) return say('customSavedPastWindow');
  return '';
}

// ── 輕量 toast（role=status，數秒後自動淡出；同時只有一則，新訊息覆蓋舊的）──
const TOAST_MS = 4000;
let _toastTimer = 0;
function showToast(message) {
  const el = document.getElementById('due-toast');
  if (!el || !message) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), TOAST_MS);
}

function deleteCustomAssignment(courseId, assignmentId) {
  const id = String(assignmentId);
  const target = findAssignment(id);
  // 以自製確認對話框取代原生 window.confirm 對話框（見 openConfirmDialog）；訊息帶作業名稱，連刪多筆時不刪錯（QA #172）
  openConfirmDialog({
    title: tr('deleteCustomTitle'),
    message: target && target.name
      ? tr('confirmDeleteCustomNamed').replace('{name}', () => target.name)   // 函式型替換：名稱含 $ 不被展開
      : tr('confirmDeleteCustom'),
    confirmLabel: tr('customDelete'),
    onConfirm: () => {
      // 連同此 id 在各使用者 map 的旗標／分數一併清掉，不在 storage 留孤兒 key（只寫實際有該 id 的 map）
      const idMaps = ['manualDone', 'manualUndone', 'manualShown', 'manualHidden', 'scores'];
      updateShared(['customAssignments', ...idMaps], (cur) => {
        const customAssignments = { ...(cur.customAssignments || {}) };
        const key = String(courseId);
        customAssignments[key] = (customAssignments[key] || [])
          .filter((assignment) => String(assignment.id) !== id);
        if (!customAssignments[key].length) delete customAssignments[key];
        const patch = { customAssignments };
        idMaps.forEach((k) => {
          if (!cur[k] || !Object.prototype.hasOwnProperty.call(cur[k], id)) return;
          const next = { ...cur[k] };
          delete next[id];
          patch[k] = next;
        });
        return patch;
      }, { optimistic: false, done: () => refreshView() });
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
let _syncInFlight = false;   // 「同步」按鈕發出的 SYNC 尚未回應（skeleton 期間重繪要維持 skeleton、按鈕維持三點）
// 只在「無資料＋點同步」時渲染；成功後 loadData 原位替換成真卡片、失敗由 loadData 還原空狀態
function renderSyncSkeleton() {
  setHeaderMeta(tr('syncing'));

  // 側欄：4 列課名佔位（寬度略變化，避免整齊到假）
  document.getElementById('course-nav').innerHTML = [72, 58, 80, 64]
    .map((w) => `<div class="skel-nav-row" aria-hidden="true"><span class="skel" style="width:${w}%"></span></div>`)
    .join('');

  const main = document.getElementById('main-section');
  main.dataset.skeleton = '1';   // render() 據此在真資料到位時做一次性淡入

  // 主區形狀＝同步完成後會落地的版面（判斷與 render() 相同）：週待辦 → 進度環＋分級摘要＋2 欄卡片；
  // 課程／已繳交 → 課程卡 grid。載完原位替換，不會從 grid 跳成週版面（QA #195）
  if (currentPage === 'week' && !showSubmitted) {
    const weekCard = (codeW, nameW) => `
      <div class="week-task-card">
        <span class="skel skel-code" style="width:${codeW}%"></span>
        <span class="skel skel-name" style="width:${nameW}%"></span>
        <span class="skel skel-row"></span>
      </div>`;
    main.innerHTML = `
      <div class="week-panel skel-week" aria-hidden="true">
        <div class="week-content">
          <div class="week-left">
            <div class="wk-ring-wrap">
              <div class="wk-ring">
                <svg class="wk-ring-svg" viewBox="0 0 158 158"><circle class="wk-ring-track" cx="79" cy="79" r="${RING_R}"></circle></svg>
                <div class="wk-ring-center"><span class="skel skel-ring-frac"></span></div>
              </div>
            </div>
            <div class="wk-breakdown">
              ${[52, 64, 44].map((w) => `<div class="wk-sum-row"><span class="skel skel-sum-num"></span><span class="skel skel-sum-label" style="width:${w}%"></span></div>`).join('')}
            </div>
          </div>
          <div class="week-right">
            <div class="week-group">
              <span class="skel skel-group-title"></span>
              <div class="week-task-grid">
                ${[[42, 82], [36, 64], [48, 74], [40, 58], [34, 78], [44, 68]].map(([c, n]) => weekCard(c, n)).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>`;
    return;
  }

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
  main.innerHTML = `<div class="courses-grid">${[[76, 3], [58, 2], [84, 3], [66, 2], [72, 3], [60, 2]]
    .map(([w, r]) => card(w, r)).join('')}</div>`;
}

// ── 主要渲染 ──
function render(data) {
  // 整段重繪會換掉 main-section：進行中的頁面滑動直接作廢（不讓它的收尾 timer 晚到再畫一次、清掉新的完成計時器）
  if (_pageSlideTimer) { clearTimeout(_pageSlideTimer); _pageSlideTimer = 0; }
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
  const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;

  setHeaderMeta(...headerMetaParts());
  _lastRenderAt = Date.now();
  setNoCoursesMode(false);

  renderNav(courses, assignments);
  updateSideNav();

  if (currentView === 'course') {
    document.getElementById('page-tabs').style.display = '';
    document.getElementById('page-tabs').classList.add('detail-mode');
    document.getElementById('detail-back-btn').style.display = 'inline-flex';   // reload 直接還原詳情時也要有返回鍵
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('course-detail-container').style.display = 'flex';
    const course = courses.find((c) => c.id === currentCourseId);
    if (course) {
      renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);
    } else {
      // 正在看的課程已不在資料中（換學期同步）→ 退回清單；entry 一併改回清單，Back／Forward 不再回到幽靈詳情（QA #187）
      showGridView();
      _replaceEntryWithList();
    }
  } else {
    document.getElementById('page-tabs').style.display = '';
    document.getElementById('page-tabs').classList.remove('detail-mode');
    document.getElementById('detail-back-btn').style.display = 'none';
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

  navEl.innerHTML = sorted.map((c) => navCourseItemHtml(c, assignments)).join('');
  navEl.querySelectorAll('.nav-course-item').forEach(bindNavCourseItem);
  syncNavNameTitles(navEl);
}

// 側欄課名被省略號截斷 → 整顆按鈕給 title 看全名（沒截斷不加，免得多一層重複提示，QA #135）
function syncNavNameTitles(root) {
  (root || document).querySelectorAll('.nav-course-item').forEach((btn) => {
    const name = btn.querySelector('.nav-course-name');
    if (!name) return;
    if (name.scrollWidth > name.clientWidth) btn.title = name.textContent;
    else btn.removeAttribute('title');
  });
}

// 視窗縮放跨過 900px 斷點（側欄 300→240px）會改變哪些課名被截斷 → 重算 title（每幀最多一次）
let _navTitlesRaf = 0;
window.addEventListener('resize', () => {
  if (_navTitlesRaf) return;
  _navTitlesRaf = requestAnimationFrame(() => {
    _navTitlesRaf = 0;
    const navEl = document.getElementById('course-nav');
    if (navEl) syncNavNameTitles(navEl);
  });
});

// 單一側欄課程項（renderNav 與重命名收尾共用：重命名只換回「這一項」，不整段重建側欄）
function navCourseItemHtml(c, assignments) {
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
}

// Bind nav click → 單擊即時開詳情；同課 300ms 內雙擊 → 就地在側欄行內重命名（左側編輯）
function bindNavCourseItem(btn) {
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
  navSubmitted.setAttribute('aria-pressed', String(showSubmitted));   // 過濾切換鈕：讀屏可知開關狀態（QA #119）

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

// ── 學期待辦 ↔ 課程 水平滑動 ──
// slider 內固定為 [週待辦 | 課程]：週待辦 = translateX(0)、課程 = translateX(-50%)（兩個方向的組法都是這個順序）
const PAGE_SLIDE_MS = 470;      // 略長於 .45s transform 過渡，結束後換回可互動的真內容
let _pageSlideTimer = 0;

// 滑動結束（或被別的導覽搶先）→ 依「目前」狀態換回真內容；收尾判斷與 render() 相同，不能只看 currentPage：
// 滑動途中開了「已繳交」要落在 grid、進了詳情則不碰版面（renderCardGrid 會清掉詳情裡的完成計時器，QA #192）
function _finishPageSlide() {
  _pageSlideTimer = 0;
  const main = document.getElementById('main-section');
  if (currentView === 'course') {
    if (main.querySelector(':scope > .page-slider')) main.innerHTML = '';   // 隱藏中的 slider 也要收掉（isUiIdle 會被它卡住）
    return;
  }
  const { courses = [], assignments = {}, assignmentGroups = {} } = _currentData;
  if (currentPage === 'week' && !showSubmitted) {
    renderWeekSection(courses, assignments);
  } else {
    renderCardGrid(courses, assignments, assignmentGroups);
  }
}

// 有進行中的滑動就立即結束（goToPage／已繳交切換／進詳情等導覽的入口呼叫）
function settlePageSlide() {
  if (!_pageSlideTimer) return;
  clearTimeout(_pageSlideTimer);
  _finishPageSlide();
}

function switchPage(page) {
  abortActiveDrag();   // 導覽離開前中止進行中的拖曳（QA #198）
  if (page === currentPage) return;
  if (!_currentData.courses) return;

  const mainSection = document.getElementById('main-section');

  // 滑動進行中又切回另一頁：沿用同一條 slider 反向接續——transform 過渡會從「目前的視覺位置」起跳，
  // 不再把含 slider 的 innerHTML 包進新 slider（巢狀、重複 id），也不會被前一段的收尾 timer 硬切（QA #199）
  const liveSlider = _pageSlideTimer ? mainSection.querySelector(':scope > .page-slider') : null;
  if (liveSlider) {
    currentPage = page;
    updateSideNav();
    syncHistory();
    liveSlider.style.transform = page === 'week' ? 'translateX(0)' : 'translateX(-50%)';
    clearTimeout(_pageSlideTimer);
    _pageSlideTimer = setTimeout(_finishPageSlide, PAGE_SLIDE_MS);
    return;
  }

  // 減少動態：不滑動，直接畫目標頁
  if (prefersReducedMotion()) {
    currentPage = page;
    updateSideNav();
    syncHistory();
    _finishPageSlide();
    return;
  }

  const direction = (currentPage === 'week' && page === 'courses') ? 'left' : 'right';

  // 1. 保存旧内容
  const oldContent = mainSection.innerHTML;

  // 2. 渲染新内容到一个临时容器（不触发 loadData）
  const tempDiv = document.createElement('div');
  tempDiv.style.display = 'none';
  document.body.appendChild(tempDiv);

  const { courses = [], assignments = {}, assignmentGroups = {} } = _currentData;
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

  // 4. 触发滑动动画：forced reflow 先提交起點，再同步設終點（不用 rAF——rAF 晚到會蓋掉滑動中途的反向切換；
  //    分頁隱藏時 rAF 也會被暫停）
  slider.getBoundingClientRect();
  slider.style.transition = 'transform 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)';
  slider.style.transform = direction === 'left' ? 'translateX(-50%)' : 'translateX(0)';

  // 5. 动画结束后恢复正常内容并绑定事件（timer 可被 settlePageSlide／render 取消）
  _pageSlideTimer = setTimeout(_finishPageSlide, PAGE_SLIDE_MS);
}

// ── 本週待辦 ──
// 進度環分子上次渲染值：分子有變才給數字 tick 動畫（首次渲染不 tick）
let _prevRingDone = null;
// 進度環上次渲染時是否「近期作業全部完成」（null＝尚未渲染）：慶祝只在 false → true 的轉移播放
let _ringAllDone = null;

// 進度環 SVG 幾何：158 外徑、20 線寬 → 半徑 69，全周長 2πr
const RING_R = 69;
const RING_C = 2 * Math.PI * RING_R;

// ── 進度環「落點迸發」慶祝（見 spec 2026-07-23 後記）──
// 只在勾完最後一項近期作業、弧合攏落地的瞬間觸發（renderWeekSection 的 celebrateNow）；
// 之後維持全部完成狀態的重繪只靜態顯示「全部完成」，不重播。
// 內容：環微彈＋分子 pop、多色碎點沿圓周外迸（切線初速＝旋轉能量）、中心淡入「全部完成」
function celebrateRingArrival(ring) {
  if (!ring || !ring.isConnected) return;   // 等待落地期間被重繪換掉 → 略過
  if (prefersReducedMotion()) {             // 減少動態：只換成「全部完成」，不彈不迸
    const cap = ring.querySelector('.wk-ring-cap');
    if (cap) cap.textContent = tr('weekAllDoneLabel');
    return;
  }
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

function renderWeekSection(courses, assignments, fromCommit = false) {
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
  // 環的範圍不是「本週」：逾期窗（30 天）∪ 未來 7 天 → 標「近期完成」，範圍寫進 aria-label 與 title（QA #14）
  const ringAria = `${tr('weekDoneLabel')} ${nearDone}/${nearTotal} · ${tr('weekRingScope')}`;
  // 分子變動時給數字一個微上滑 tick（與弧的過渡同曲線）；首次渲染不 tick
  const fracTick = _prevRingDone !== null && _prevRingDone !== nearDone;
  _prevRingDone = nearDone;
  // 全部完成狀態與慶祝：只在「週卡完成 commit 的收尾重繪」且由「未全部完成 → 全部完成」轉移時播一次。
  // 用上次渲染的狀態判斷，不依賴點擊當下的旗標：全部完成後再勾 8-30 天／無截止的作業不重播（QA #193），
  // 最後兩項間隔勾選、先收尾的被延到批次重繪也照樣會播（QA #201）
  const allNearDone = nearTotal > 0 && nearDone === nearTotal;
  const celebrateNow = fromCommit && allNearDone && _ringAllDone === false;
  _ringAllDone = allNearDone;
  // 慶祝時中心先維持「近期完成」、落地瞬間才換字淡入；非慶祝的全部完成重繪直接靜態顯示「全部完成」
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
    const done = isDone(a);                            // 週視圖恆為 false，仍寫入以保勾選圈狀態一致
    const checkLabel = done ? tr('markUndone') : tr('markDone');
    return `
      <div class="week-task-card" role="button" tabindex="0" aria-label="${esc(getCourseName(a._course) + ' · ' + a.name)}" data-course-id="${a._course.id}" data-assignment-id="${esc(String(a.id))}">
        <button class="assignment-check week-task-check" data-assignment-id="${esc(String(a.id))}" data-course-id="${a._course.id}" data-done="${done ? 'true' : 'false'}" aria-label="${esc(checkLabel)}"></button>
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
            <div class="wk-ring" role="img" aria-label="${esc(ringAria)}" title="${esc(tr('weekRingScope'))}">
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

  // 勾選圈：依畫面顯示的狀態翻轉，未完成→完成走 1.5 秒撤銷窗口動畫（stopPropagation 不開詳情）
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
      toggleCompletion(id, cid, btn.dataset.done === 'true');
      const a = findAssignment(id, cid);
      const nowDone = a ? isDone(a) : false;
      if (nowDone && card) {
        // 要不要慶祝不在這裡算：由收尾重繪時的狀態轉移決定（renderWeekSection 的 _ringAllDone，QA #193/#201）
        beginCompleteWeek(card, id, cid);
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
      right.scrollTo({ top: delta, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  });
}

// ── 卡片格 ──
function renderCardGrid(courses, assignments, assignmentGroups) {
  const el = document.getElementById('main-section');
  // 切到卡片格前清掉殘留的週卡完成計時器，避免幽靈 callback 重繪週待辦
  clearCompleteTimers();

  if (!courses.length) {
    renderEmptyState();
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

  const pageIdx = cardPages[cardPageKey(course.id)] || 0;
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
  // 清單縮短（勾完成、同步）時把夾過的頁寫回：否則下次「‹」從過期的舊索引起算，第一下看起來沒反應（QA #165）
  cardPages[cardPageKey(courseId)] = page;
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
  const current = Math.min(cardPages[cardPageKey(courseId)] || 0, totalPages - 1);
  const next = Math.max(0, Math.min(totalPages - 1, current + dir));
  if (next === current) return;
  cardPages[cardPageKey(courseId)] = next;

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

// ── 課程 morph（View Transition）的進行中狀態 ──
// 導覽狀態（currentView／currentCourseId）一律在呼叫當下同步設好，VT callback 只負責畫；callback 晚到時
// 若狀態已被後來的導覽改掉（連點兩門課、morph 中途按 Back／點側欄）就什麼都不做，交給後來的導覽（QA #197）
let _morphTransition = null;

// 清掉殘留的 view-transition-name：上一段 morph 還沒 finished 就開下一段時，兩張卡同名會讓新 transition
// 以 InvalidStateError 中止
function _clearMorphNames() {
  document.querySelectorAll('[style*="view-transition-name"]').forEach((el) => {
    el.style.viewTransitionName = '';
  });
}

// 跳過進行中的 morph（不走 VT 的導覽用：舊動畫不再蓋在新畫面上；被跳過的 callback 仍會執行，但會因狀態不符而略過）
function _skipMorph() {
  const t = _morphTransition;
  _morphTransition = null;
  if (t) { try { t.skipTransition(); } catch (_) { /* 已結束 */ } }
}

function _trackMorph(transition) {
  _morphTransition = transition;
  // 被跳過／中止時 ready 會 reject：吞掉，避免 chrome://extensions 累積 Uncaught (in promise)
  transition.ready.catch(() => {});
  // 動畫完成後清理 view-transition-name（已有更新的 morph 接手時由它清，不能清掉它剛設好的名字）
  const cleanup = () => {
    if (_morphTransition !== transition) return;
    _morphTransition = null;
    _clearMorphNames();
  };
  transition.finished.then(cleanup, cleanup);
}

// 把目前 history entry 改寫成「清單」狀態（popstate 期間也要寫：修正剛到達、但畫面沒照它走的 entry）
function _replaceEntryWithList() {
  if (!_historyReady) return;
  history.replaceState({ app: 'due', page: currentPage, showSubmitted, view: 'grid', courseId: null }, '');
}

// ── 切換至課程詳細 ──
function showCourseDetail(courseId, cardEl) {
  abortActiveDrag();   // 換課／進詳情前中止進行中的拖曳（VT callback 非同步，不能只靠重繪時的 abort）
  // 目標課程已不在資料中（換學期同步後按「下一頁」等）→ 不進幽靈詳情，留在原畫面（QA #187；
  // popstate 呼叫端會把 entry 改寫回實際畫面）
  if (!(_currentData.courses || []).some((c) => c.id === courseId)) return;

  // 歷史：從清單進詳情 → push（新增一個返回步，Back 回清單）；
  //       詳情內換課（sidebar 點另一課）→ replace（不疊步，Back 仍直接回清單）。
  if (_historyReady && !_suppressHistory) {
    const loc = { app: 'due', page: currentPage, showSubmitted, view: 'course', courseId };
    if (currentView === 'course') history.replaceState(loc, '');
    else history.pushState(loc, '');
  }
  // 導覽狀態同步設好（不等 VT callback）：第二次呼叫才會正確判斷成 replace、Back 才回得到清單
  currentView = 'course';
  currentCourseId = courseId;
  settlePageSlide();   // 頁面滑動中進詳情：結束滑動、收掉 slider（它的收尾 timer 不能再碰版面，QA #192）

  // 没有卡片元素、不支持 View Transitions 或「減少動態效果」时的回退（直接切換，無 morph）
  if (!cardEl || !document.startViewTransition || prefersReducedMotion()) {
    _skipMorph();

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
    renderNav(courses, assignments);
    updateSideNav();   // 進詳情：學期待辦／課程熄燈、頂部計數同步刷新（QA #202/#186）
    renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);
    return;
  }

  // ── FIRST: 在小卡片上标记共享元素 ──
  _clearMorphNames();
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
    // 等待期間已導覽到別處（換課／回清單／切頁）→ 畫面交給後來的導覽
    if (currentView !== 'course' || currentCourseId !== courseId) return;

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
    updateSideNav();   // 進詳情：學期待辦／課程熄燈、頂部計數同步刷新（QA #202/#186）
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
  _trackMorph(transition);
}

// ── 退出課程詳情、回到清單 ──
// 回到「currentPage / showSubmitted 所指的清單」（不再寫死回 courses grid）——
// 由 popstate（Back）或 render() fallback 呼叫；currentPage/showSubmitted 已由呼叫端設好。
function showGridView() {
  abortActiveDrag();   // 拖曳中按 Back：中止拖曳，clone 不漂到清單上、放開也不寫入（QA #198）
  const prevCourseId = currentCourseId;
  // 導覽狀態同步設好（同 showCourseDetail，QA #197）
  currentView = 'grid';
  currentCourseId = null;
  const detailContainer = document.getElementById('course-detail-container');

  // 切回清單並以 _currentData 同步重繪（VT callback 與無 morph 的路徑共用）
  const paintList = () => {
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
  };

  // 不支援 View Transitions 或「減少動態效果」：直接切換，無 morph
  if (!document.startViewTransition || prefersReducedMotion()) {
    _skipMorph();
    paintList();
    return;
  }

  // ── FIRST: 在详情视图上标记共享元素 ──
  _clearMorphNames();
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
    if (currentView !== 'grid') return;   // 等待期間又進了詳情 → 交給後來的導覽
    paintList();

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
  _trackMorph(transition);
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
    positionRenameBtn();   // 名稱長短／換行變了 → 鉛筆跟到新尾端（QA #167）
  };

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    const displayName = newName || (course ? course.name : '');
    restore(displayName);

    persistCourseName(courseId, newName, course);
    // 側欄只就地換這一課的名字，不整段 renderNav：失焦提交發生在側欄按鈕的 mousedown，
    // 整段重建會讓隨後的 click 落到新按鈕上而被吞掉、切不了課（QA #166）
    setNavCourseNameText(courseId, displayName);
  };

  const cancel = () => {
    if (committed) return;
    committed = true;
    restore(currentName);
  };

  input.addEventListener('keydown', (e) => {
    if (isImeComposing(e)) return;   // 注音／拼音組字中按 Enter 是選字、Esc 是取消組字，不提交（QA P2-14）
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', () => commitOnBlur(input, () => committed, () => { committed = true; }, commit));
}

// IME 組字中的按鍵（Enter 選字、Esc 取消組字）：keyCode 229 涵蓋部分瀏覽器 isComposing 尚未設好的那一下
function isImeComposing(e) {
  return !!(e && (e.isComposing || e.keyCode === 229));
}

// 重命名輸入框失焦 → 等 microtask 再決定提交或放棄：
// 失焦若是因為輸入框被重繪整段換掉（完成動畫收尾、即時刷新…），Chrome 會在移除當下「同步」發 blur，
// 那一刻 isConnected 仍是 true；blur 發生在重繪的 JS 呼叫堆疊裡，microtask 要等整段重繪跑完才執行 →
// 那時已不在 DOM → 放棄這次編輯，不把打到一半的名稱寫進 storage（QA #159）。
// 使用者點別處的失焦由瀏覽器在 mousedown 時發出（堆疊是空的），microtask 緊接著跑、早於 click → 照常提交。
// 不能用 setTimeout：快速點擊時 mouseup／click 會排在 timer 前面，click 觸發的重繪先把輸入框換掉，正常的改名就被當成放棄
function commitOnBlur(input, isSettled, markSettled, commit) {
  queueMicrotask(() => {
    if (isSettled()) return;
    if (!input.isConnected) { markSettled(); return; }
    commit();
  });
}

// 側欄某課的顯示名稱就地更新（不重建按鈕，進行中的點擊不受影響）
function setNavCourseNameText(courseId, displayName) {
  const item = document.querySelector(`.nav-course-item[data-target-course="${courseId}"]`);
  const nameEl = item && item.querySelector('.nav-course-name');
  if (nameEl) nameEl.textContent = displayName;
  if (item) syncNavNameTitles(item.parentElement);
}

// 課程詳情標題旁的鉛筆：absolute 定位緊貼課名「最後一行」的尾端。
// 不能改成 inline（View Transition 量到的標題高度會變、morph 跳動，見 CLAUDE.md）；
// 用 getClientRects 取最後一個 line box，換行的長名也對得準；改名、hover（字體載入／視窗寬度變了）時重算（QA #167）
function positionRenameBtn() {
  const nameEl = document.querySelector('#course-detail-container .detail-name');
  if (!nameEl) return;
  const textSpan = nameEl.querySelector('.detail-name-text');
  const btn = nameEl.querySelector('.btn-rename-course');
  if (!textSpan || !btn) return;
  const rects = textSpan.getClientRects();
  if (!rects.length) return;   // 容器尚未顯示（display:none）→ 等 hover 時再算
  const last = rects[rects.length - 1];
  const box = nameEl.getBoundingClientRect();
  btn.style.left = `${Math.round(last.right - box.left + 8)}px`;
  btn.style.top = `${Math.round(last.top - box.top + last.height / 2)}px`;
}

// 寫入課程自訂名稱（單一真相：_currentData + chrome.storage.local.courseNames）；
// newName 已 trim，空或等於原始課名 → 視為移除自訂（startCourseRename / startSidebarRename 共用）
function persistCourseName(courseId, newName, course) {
  const useCustom = !!(newName && course && newName !== course.name);
  // 樂觀更新 _currentData＋storage read-modify-write（只動這一門課的 key，見 updateShared）
  updateShared(['courseNames'], (cur) => {
    const names = { ...(cur.courseNames || {}) };
    if (useCustom) names[courseId] = newName;
    else delete names[courseId];
    return { courseNames: names };
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

  // 只把輸入框換回「這一課」的按鈕（commit 後即套用新名），不整段重建側欄：
  // 失焦提交發生在別課按鈕的 mousedown，整段重建會吞掉隨後的 click（QA #166）
  const restoreItem = () => {
    if (!input.isConnected) return;
    const { courses = [], assignments = {} } = _currentData;
    const c = courses.find((x) => x.id === courseId);
    if (!c) { renderNav(courses, assignments); return; }
    const tmp = document.createElement('div');
    tmp.innerHTML = navCourseItemHtml(c, assignments).trim();
    const btn = tmp.firstElementChild;
    input.replaceWith(btn);
    bindNavCourseItem(btn);
    syncNavNameTitles(btn.parentElement);
  };

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    const displayName = newName || (course ? course.name : '');
    persistCourseName(courseId, newName, course);
    restoreItem();
    // 若右側正顯示同一課，順手同步詳情標題（只改文字、不整段重繪，避免打斷成績計算器/捲動）
    if (currentView === 'course' && currentCourseId === courseId) {
      const dName = document.querySelector('#course-detail-container .detail-name-text');
      if (dName) dName.textContent = displayName;
      positionRenameBtn();
    }
  };

  const cancel = () => {
    if (committed) return;
    committed = true;
    restoreItem();   // 還原原本按鈕（不寫入）
  };

  input.addEventListener('keydown', (e) => {
    if (isImeComposing(e)) return;   // 組字中的 Enter／Esc 交給輸入法（QA P2-14）
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', () => commitOnBlur(input, () => committed, () => { committed = true; }, commit));
}

// ── 完成過渡動畫：3 秒撤銷窗口 → 碎點爆 ──
function rerenderDetailAndNav(cid) {
  const { courses = [], assignments = {}, assignmentGroups = {}, scores = {} } = _currentData;
  const course = courses.find((c) => c.id === cid);
  // 只在仍停留於該課詳情時重繪詳情：延遲 callback（碎點爆後重繪等）觸發時使用者可能已換課／離開，
  // 不能把舊課程畫回容器（QA #113）
  if (course && currentView === 'course' && currentCourseId === cid) {
    // 保留成績計算器、已隱藏區、展開的描述與捲動（勾選完成、拖曳都走這裡，整段重繪會把它們收起）
    const st = captureViewState();
    renderCourseDetailSection(course, assignments[cid] || [], assignmentGroups[cid] || [], scores);
    restoreViewState(st);
  }
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
    // important：減少動態效果時 CSS 會把動畫壓成瞬間，倒數條是撤銷窗口的計時資訊，要保留（QA #138）
    bar.style.setProperty('animation', `complete-countdown ${COMPLETE_DELAY_MS / 1000}s linear forwards`, 'important');
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
  // 略長於 .45s 爆開動畫，結束後重繪：已完成的會被濾掉、計數/圓餅/側欄一起更新。
  // timer 登記進 _completeTimers（導覽離開時一併清掉，QA #113）；其他列仍在撤銷窗口時延到最後一筆收尾（QA #16）
  const key = `${id}:burst`;
  _completeTimers[key] = setTimeout(() => {
    delete _completeTimers[key];
    settleCompletion(() => rerenderDetailAndNav(cid));
  }, COMPLETE_BURST_MS);
}

function cancelComplete(item, id, cid) {
  if (_completeTimers[id]) { clearTimeout(_completeTimers[id]); delete _completeTimers[id]; }
  const chk = item.querySelector('.assignment-check');
  revertCompletion(id, cid);
  // 就地還原（不整段重繪，避免影響其他進行中的動畫）
  item.classList.remove('completing');
  const hint = item.querySelector('.complete-undo-hint');
  if (hint) hint.remove();
  const bar = item.querySelector('.complete-countdown');
  if (bar) bar.remove();
  if (chk) { chk.dataset.done = 'false'; chk.setAttribute('aria-label', tr('markDone')); }
  settleCompletion();   // 這是最後一筆進行中的完成 → 補跑先前爆完而延後的重繪（須在還原寫入之後）
}

// ── 週卡片完成過渡（平行於 assignment-item 版；共用 COMPLETE_* 常數與 spawnBurstDots）──
// fromCommit：由週卡完成 commit 觸發的重繪（renderWeekSection 據此判斷要不要播「全部完成」慶祝）
function rerenderWeekAndNav(fromCommit = false) {
  const { courses = [], assignments = {} } = _currentData;
  // 只在仍停留於週待辦版面時重繪週 section（延遲 callback 觸發時可能已切頁／進詳情，QA #113）
  if (currentView === 'grid' && currentPage === 'week' && !showSubmitted) {
    renderWeekSection(courses, assignments, fromCommit);
  }
  updateSideNav();
  renderNav(courses, assignments);
}

function beginCompleteWeek(card, id, cid) {
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
    // important：減少動態效果時 CSS 會把動畫壓成瞬間，倒數條是撤銷窗口的計時資訊，要保留（QA #138）
    bar.style.setProperty('animation', `complete-countdown ${COMPLETE_DELAY_MS / 1000}s linear forwards`, 'important');
    card.appendChild(bar);
  }
  _completeTimers[id] = setTimeout(() => {
    delete _completeTimers[id];
    finishCompleteWeek(card, id, cid);
  }, COMPLETE_DELAY_MS);
}

function finishCompleteWeek(card, id, cid) {
  spawnBurstDots(card);
  card.classList.add('bursting');
  // 已完成者會被 applyFilters 濾掉；重繪週 section＋側欄＋左欄（用 _currentData，避免閃白）。
  // 與詳情列同：timer 登記進 _completeTimers、其他卡仍在撤銷窗口時延到最後一筆收尾（QA #113/#16）
  const key = `${id}:burst`;
  _completeTimers[key] = setTimeout(() => {
    delete _completeTimers[key];
    settleCompletion(() => rerenderWeekAndNav(true));
  }, COMPLETE_BURST_MS);
}

function cancelCompleteWeek(card, id, cid) {
  if (_completeTimers[id]) { clearTimeout(_completeTimers[id]); delete _completeTimers[id]; }
  const chk = card.querySelector('.assignment-check');
  revertCompletion(id, cid);
  card.classList.remove('completing');
  const hint = card.querySelector('.complete-undo-hint');
  if (hint) hint.remove();
  const due = card.querySelector('.week-task-due');
  if (due) due.style.display = '';
  const bar = card.querySelector('.complete-countdown');
  if (bar) bar.remove();
  if (chk) { chk.dataset.done = 'false'; chk.setAttribute('aria-label', tr('markDone')); }
  settleCompletion();   // 最後一筆進行中的完成被撤銷 → 補跑先前爆完而延後的重繪
}

function spawnBurstDots(item) {
  if (prefersReducedMotion()) return;   // 減少動態：不噴碎點（列本身照樣淡出／瞬間消失）
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
  // 「已隱藏」區恆存在（只要該課有作業）作為拖回降級的放置目標；傳入該課全部被收起來的項目，
  // 由 renderHiddenItemsSection 依目前完成過濾分桶（見 spec 2026-10-23 hidden-section-follows-filter）
  const hiddenItems = asgns.filter((a) => isHidden(a));
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

  // 鉛筆緊貼課名尾端（absolute，不能純 CSS：block 寬 ≠ 文字寬）；hover／鍵盤聚焦時重算——
  // 字體晚到、視窗寬度變了會讓換行位置改變（QA #167）
  positionRenameBtn();
  const nameBlock = el.querySelector('.detail-name');
  if (nameBlock) {
    nameBlock.addEventListener('mouseenter', positionRenameBtn);
    nameBlock.addEventListener('focusin', positionRenameBtn);
  }

  // 固定寬左欄下，評分圖例字體自動縮放（過長再 ellipsis）
  fitLegendText(el);

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
      // 以畫面顯示的狀態翻轉；兩張 map 由 DueCompletion.setDone 依當下外部事實決定（樂觀更新，避免閃白）
      toggleCompletion(id, cid, btn.dataset.done === 'true');
      const a = findAssignment(id, cid);
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
      // 撤銷窗口內點名稱＝點該列：取消完成，不開 Canvas（spec「窗口內點該列任何位置 → 取消」，QA #200）
      const item = title.closest('.assignment-item');
      if (item && item.classList.contains('bursting')) return;
      if (item && item.classList.contains('completing')) {
        const chk = item.querySelector('.assignment-check');
        if (chk) cancelComplete(item, String(chk.dataset.assignmentId), parseInt(chk.dataset.courseId, 10));
        return;
      }
      const assignmentId = title.dataset.assignmentId;
      const courseId = title.dataset.courseId;
      const base = _currentData.canvasBaseUrl || '';
      if (!base) return;
      const url = `${base}/courses/${courseId}/assignments/${assignmentId}`;
      window.open(url, '_blank', 'noopener');   // 切斷 opener：Canvas 頁不能把 dashboard 分頁導走（QA #154）
    });
  });

  el.querySelectorAll('.grade-calc-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.closest('.grade-calc').classList.toggle('open');
    });
  });

  el.querySelectorAll('.grade-calc-pts input').forEach((input) => {
    input.addEventListener('input', () => {
      recalculateGrades(parseInt(input.dataset.courseId, 10), { changedId: input.dataset.assignmentId });
    });
  });

  bindEditWeightsBtns(el);

  // 「已隱藏」區展開/收合（不持久化，每次進詳情預設收合；切換已繳交／即時刷新由 captureViewState 保留）
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

// ── 作業描述裡的頁內錨點（#xxx，見 descSanitizer 的 'fragment'，QA #158）──
// 不讓瀏覽器改網址：hash 變動會觸發 popstate，把課程詳情退回清單；改捲到同一則描述內的 data-desc-anchor
document.getElementById('course-detail-container')?.addEventListener('click', (e) => {
  const link = e.target.closest('.assignment-desc-inner a[href^="#"]');
  if (!link) return;
  e.preventDefault();
  const raw = link.getAttribute('href').slice(1);
  let name = raw;
  try { name = decodeURIComponent(raw); } catch (_) { /* 非法編碼 → 用原字串 */ }
  const inner = link.closest('.assignment-desc-inner');
  const target = inner && [...inner.querySelectorAll('[data-desc-anchor]')]
    .find((el) => el.dataset.descAnchor === name || el.dataset.descAnchor === raw);
  if (target) target.scrollIntoView({ block: 'start' });   // 瞬間跳到（同頁錨點的慣例行為）
});

// ── 拖曳升級（隱藏列→作業清單）／降級（清單列→已隱藏區）──
// Pointer Events 自繪引擎（原生 HTML5 DnD 的啟動層在部分環境不觸發、ghost 不可控）：
// grip 為唯一拖曳起點 → 超過閾值「拿起」浮動 clone 跟隨游標 → 目標區亮起（drop-active／drop-hover）→
// 放開命中則寫入 manualShown/manualHidden 重繪，clone 飛入重繪後的實際落點（清單依 due 排序）；
// 未命中/Esc 飛回原位。導覽離開（showGridView／goToPage／switchPage／showCourseDetail／popstate）一律先 abortActiveDrag。
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
    courseId: currentCourseId,                                   // 寫入綁定拖曳開始時的課程（QA #205）
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
  // 放置目標已不在畫面（重繪／導覽離開但沒被 abort 到）或已換課 → 當取消，不寫入（QA #198）
  const stillHere = ctx.target.isConnected && currentView === 'course' && currentCourseId === ctx.courseId;
  if (!cancelled && ctx.over && stillHere) {
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
  setItemHiddenByDrag(ctx.id, ctx.dir === 'demote', ctx.courseId);

  const container = document.getElementById('course-detail-container');
  const scroller = container.querySelector('.detail-right-panel');
  if (scroller) scroller.scrollTop = savedScroll;  // 重繪會重置捲動位置 → 還原
  // 稽核區開合：降級後強制展開（讓使用者看到落點）；升級則維持拖曳前狀態
  const hidden = container.querySelector('.hidden-items');
  if (hidden && (hiddenWasOpen || ctx.dir === 'demote')) hidden.classList.add('open');

  // 落點當下重新判定完成桶：拖曳期間時間可能經過（如考試剛結束 → 已完成桶），render 時的分桶已過期（QA #178）。
  // 照樣寫入並重繪；若該項已不屬於目前視圖，兩區都不會有它 → 不找落點、clone 原地淡出（另一桶數量見已隱藏區短註／側欄計數）
  const a = ((_currentData.assignments || {})[ctx.courseId] || []).find((x) => String(x.id) === String(ctx.id));
  const inThisView = !!a && isDone(a) === showSubmitted;
  const cssId = (window.CSS && CSS.escape) ? CSS.escape(String(ctx.id)) : String(ctx.id);
  let landed = null;
  if (inThisView && ctx.dir === 'promote') {
    const chk = container.querySelector(`.detail-assignments-list .assignment-check[data-assignment-id="${cssId}"]`);
    landed = chk && chk.closest('.assignment-item');
  } else if (inThisView) {
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
  if (prefersReducedMotion()) {                     // 減少動態：不飛入，直接落定
    finish();
    return;
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

// ── 已隱藏區（精簡列；不顯示任何分數，見決策 3）──
// 跟隨作業清單的完成過濾（spec 2026-10-23 hidden-section-follows-filter，取代 7/22 same-bucket 鎖定列）：
// 待辦視圖只列未完成的隱藏項、已繳交視圖只列已完成的；列出的每一列都有握把可拖——看得到就能移。
// items＝該課全部隱藏項；另一桶的數量以展開鈕後的短註交代（「另 M 項已完成，在『已繳交』中」）。
function renderHiddenItemsSection(items, groups, courseId) {
  const inView = items.filter((a) => isDone(a) === showSubmitted);
  const otherCount = items.length - inView.length;
  // 排序：待辦依 due 升冪（無 due 殿後）；已繳交則最近結束的在前
  const ordered = [...inView].sort((a, b) => {
    const ta = a.due_at ? new Date(a.due_at).getTime() : Infinity;
    const tb = b.due_at ? new Date(b.due_at).getTime() : Infinity;
    return showSubmitted ? tb - ta : ta - tb;
  });
  const rows = ordered.map((a) => {
    const examFlag = isExam(a);
    // 帶 examFlag → 考試顯 due-exam 紫色；簽到走一般 due 色階（此處不傳 submitted，考試恆紫）
    const uClass = urgencyClass(a.due_at, examFlag);
    const groupName = findGroupName(a, groups);
    const submitted = isSubmitted(a);
    const isCustom = !!a._isCustom;
    const titleHtml = isCustom
      ? `<span>${esc(a.name)}</span>`
      : `<span class="assignment-title-link" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}">${esc(a.name)}</span>`;
    // 已繳交視圖的隱藏列皆已完成 → 與主清單已完成列同一套內容淡化（.submitted → --done-fade，不淡化握把）
    return `
      <div class="hidden-item-row${isDone(a) ? ' submitted' : ''}" data-drag="promote" data-hideable-id="${esc(String(a.id))}">
        <div class="hidden-item-left">
          <div class="hidden-item-title">${titleHtml}${DRAG_GRIP}</div>
          ${groupName ? `<div class="assignment-group">${esc(groupName)}</div>` : ''}
        </div>
        <div class="hidden-item-right">
          <div class="due-label ${uClass}">${dueLabelFor(a)}</div>
          ${submitted ? `<div class="submitted-badge">${tr('submittedBadge')}</div>` : ''}
          ${isCustom ? customActionsHtml(a, courseId) : ''}
        </div>
      </div>`;
  }).join('');

  const listInner = rows || `<div class="hidden-items-empty">${esc(tr('hiddenItemsEmpty'))}</div>`;
  const otherNote = otherCount
    ? `<span class="hidden-items-note">${esc(tr(showSubmitted ? 'hiddenItemsOtherPending' : 'hiddenItemsOtherDone').replace('{n}', otherCount))}</span>`
    : '';

  // 整個 .hidden-items 為「降級」放置目標（data-drophint 供 .drop-active::after 顯示提示）
  return `
    <div class="hidden-items" data-course-id="${courseId}" data-drophint="${esc(tr('dropToHide'))}">
      <button class="hidden-items-toggle" data-course-id="${courseId}">
        <span class="hidden-items-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>
        <span class="hidden-items-label">${esc(tr('hiddenItemsToggle').replace('{n}', inView.length))}${otherNote}</span>
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

// 權重項的顯示名稱：未命名的項目存成空字串，顯示時才套當前語言的「未命名」（不把某一語言的字串寫進資料，QA #170）
function weightItemLabel(item) {
  return (item && item.name) || tr('unnamedWeight');
}

// Canvas 是否實際依分組加權：課程關掉「依組別加權」（apply_assignment_group_weights === false）時，
// API 仍可能帶著殘留的 group_weight → 視為不加權，圓餅、計算器、權重編輯器預填都忽略（QA #93）
function courseUsesGroupWeights(courseId, groups) {
  const course = (_currentData.courses || []).find((c) => c.id === courseId);
  if (course && course.apply_assignment_group_weights === false) return false;
  return (groups || []).some((g) => g.group_weight);
}

// AI 分析是否已設定 key（AI 規則在 ai/gradingRules.js；dashboard 只拿布林）
function isAiConfigured(aiConfig) {
  return typeof DueGradingRules !== 'undefined' && DueGradingRules.resolveConfig(aiConfig).configured;
}

// 圓餅下的權重來源小字（D2，只有三種情況）：'ai'＝AI 寫的、使用者沒改過；'canvas'＝老師在 Canvas 設的；
// 其餘（自己填的、改過的、沒有權重）不標。是不是 AI 的看 gradingAnalysis 紀錄（規則在 DueGradingRules.isAiWeights）
function weightSourceHtml(source) {
  if (source === 'ai') return `<div class="detail-weight-source" title="${esc(tr('weightSourceAiTitle'))}">${esc(tr('weightSourceAi'))}</div>`;
  if (source === 'canvas') return `<div class="detail-weight-source" title="${esc(tr('weightSourceCanvasTitle'))}">${esc(tr('weightSourceCanvas'))}</div>`;
  return '';
}

function isAiCustomWeights(courseId, weights) {
  if (typeof DueGradingRules === 'undefined') return false;
  return DueGradingRules.isAiWeights((_currentData.gradingAnalysis || {})[courseId], weights);
}

function renderWeightPie(groups, courseId) {
  // 自訂權重優先。customWeights[courseId] 存在（含空陣列）＝使用者的覆寫：
  // 總和 > 0 → 畫自訂圓餅；全刪／總和 0 → 「沒有評分資訊」，與編輯器看到的一致，不偷偷回退成 Canvas 權重（QA #168）。
  // 要回到 Canvas 權重走編輯器的「還原 Canvas 權重」（刪掉覆寫）
  const customWeights = courseId != null ? (_currentData.customWeights || {})[courseId] : undefined;
  if (Array.isArray(customWeights)) {
    const total = customWeights.reduce((s, c) => s + (c.weight || 0), 0);
    if (total > 0) {
      let currentPct = 0;
      const gradientParts = customWeights.map((c, i) => {
        const pct = ((c.weight || 0) / total) * 100;
        const startPct = currentPct;
        currentPct += pct;
        return `${GROUP_COLORS[i % GROUP_COLORS.length]} ${startPct}% ${currentPct}%`;
      }).join(', ');
      const legend = customWeights.map((c, i) => `
        <div class="detail-pie-legend-item">
          <div class="detail-pie-legend-dot" style="background:${GROUP_COLORS[i % GROUP_COLORS.length]}"></div>
          <span class="detail-pie-legend-text">${esc(weightItemLabel(c))}</span>
          <span class="detail-pie-legend-weight">${c.weight}%</span>
        </div>`).join('');
      return `
        <div class="detail-weight-pie-container">
          <div class="detail-pie" role="img" aria-label="${esc(customWeights.map((c) => `${weightItemLabel(c)} ${c.weight}%`).join(', '))}" style="background: conic-gradient(${gradientParts});"></div>
          <div class="detail-pie-legend">${legend}${weightSourceHtml(isAiCustomWeights(courseId, customWeights) ? 'ai' : null)}</div>
          ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
        </div>`;
    }
    return renderNoWeightPie(courseId);
  }

  const hasGroupWeights = courseUsesGroupWeights(courseId, groups);
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
        <div class="detail-pie-legend">${legend}${weightSourceHtml('canvas')}</div>
        ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
      </div>`;
  }

  return renderNoWeightPie(courseId);
}

// No data
function renderNoWeightPie(courseId) {
  return `
    <div class="detail-weight-pie-container">
      <div class="detail-pie" role="img" aria-label="${esc(tr('noGradeInfo'))}" style="background: var(--border);"></div>
      <div class="detail-pie-label">${tr('noGradeInfo')}</div>
      ${courseId ? EDIT_WEIGHT_BTN(courseId) : ''}
    </div>`;
}

// 「編輯權重」鈕（圓餅區內）：詳情整段重繪與權重存檔後只換左欄時共用
function bindEditWeightsBtns(root) {
  root.querySelectorAll('.btn-edit-weights').forEach((btn) => {
    btn.addEventListener('click', () => {
      openWeightEditModal(parseInt(btn.dataset.courseId, 10));
    });
  });
}

// 權重存檔／還原後只換左欄圓餅（成績計算器用 Canvas 分組權重、不吃自訂權重）：
// 右欄的計算器 accordion、已隱藏區、展開的描述與捲動位置都不動（QA #169）。已離開該課詳情 → 不畫，下次進詳情自然是新資料
function refreshWeightPanel(courseId) {
  if (currentView !== 'course' || currentCourseId !== courseId) return;
  const panel = document.querySelector('#course-detail-container .detail-left-panel');
  if (!panel) return;
  const groups = (_currentData.assignmentGroups || {})[courseId] || [];
  panel.innerHTML = renderWeightPie(groups, courseId);
  fitLegendText(panel);
  bindEditWeightsBtns(panel);
  // 觸發 modal 的「編輯」鈕已被換掉（modal 關閉時無處還原焦點）→ 焦點交給新的那顆
  const ae = document.activeElement;
  const overlay = document.getElementById('weight-edit-overlay');
  if (!ae || ae === document.body || (overlay && overlay.contains(ae))) {
    const btn = panel.querySelector('.btn-edit-weights');
    if (btn) btn.focus({ preventScroll: true });
  }
}

// ── 成績計算器 ──
function renderGradeCalculator(course, asgns, groups, scores) {
  // Only show for courses with weighted groups（課程關掉依組別加權 → 殘留 group_weight 不算，QA #93）
  const hasWeights = courseUsesGroupWeights(course.id, groups);
  if (!groups.length || !hasWeights) return '';

  const groupRows = groups.map((g) => {
    const groupAsgns = asgns.filter((a) => inGroup(a, g))
      .filter((a) => a.points_possible != null && a.points_possible > 0);

    if (!groupAsgns.length) return '';

    const rows = groupAsgns.map((a) => {
      // Canvas 已免除（excused）：不給輸入框、標「已免除」，不計入分子分母（Canvas 本身也排除，QA #94）
      if (a.submission && a.submission.excused) {
        return `
        <div class="grade-calc-row is-excused">
          <span class="grade-calc-asgn-name" title="${esc(a.name)}">${esc(a.name)}</span>
          <div class="grade-calc-pts">
            <span class="grade-calc-excused">${esc(tr('gradeExcused'))}</span>
            <span class="grade-calc-possible">/ ${a.points_possible}</span>
          </div>
        </div>`;
      }
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
// changedId：只持久化這一格（使用者正在輸入的那格）——其他格可能是較舊的畫面值，不可整門課覆寫別處的變更
function recalculateGrades(courseId, { persist = true, changedId = null } = {}) {
  const { assignments = {}, assignmentGroups = {} } = _currentData;
  const asgns = assignments[courseId] || [];
  const groups = assignmentGroups[courseId] || [];

  const inputFor = (a) => document.querySelector(
    `.grade-calc-pts input[data-assignment-id="${a.id}"][data-course-id="${courseId}"]`
  );

  // 每個作業的「有效分數」＝輸入框現值（含預填）；只在可解析為「非負」有限數時記錄。
  // 負分不合理 → 輸入框標紅、不計入、也不寫入 storage（QA #25；超過配分則照收，可能是加分題）。
  // badInput（number input 打到一半的「-」「1e」：value 讀回 ''）同樣標紅、不計入——它不是「清空」，見下方 persist
  const badInput = (input) => !!(input.validity && input.validity.badInput);
  const effective = {};
  asgns.forEach((a) => {
    const input = inputFor(a);
    if (!input) return;   // 沒有輸入框（已免除、無配分）→ 不計
    const v = input.value === '' ? NaN : parseFloat(input.value);
    const invalid = (Number.isFinite(v) && v < 0) || badInput(input);
    input.classList.toggle('invalid', invalid);
    if (invalid) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    if (Number.isFinite(v) && !invalid) effective[a.id] = v;
  });

  // 分組小計＋加權總分（只有有限數且有配分才計入）
  let weightedSum = 0;
  let weightedTotal = 0;
  groups.forEach((g) => {
    const groupAsgns = asgns.filter((a) => inGroup(a, g));

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
  // 先同步把「要寫的目標值」從輸入框取出（undefined＝刪 key），再交給 updateShared 以 storage 最新值為底套用
  const targets = [];
  asgns.forEach((a) => {
    if (changedId != null && String(a.id) !== String(changedId)) return;
    const input = inputFor(a);
    if (!input) return;
    // badInput：鍵盤打負數時先按的「-」會讓 value 讀回 ''，不可當成「使用者清空」寫 null／刪 key
    // （否則接著打完 -5 被拒時，原本存的分數已被清掉）→ 輸入中、尚未有效，維持 storage 原值
    if (badInput(input)) return;
    if (input.value === '') {
      targets.push([a.id, (a.submission && a.submission.score != null) ? null : undefined]);
    } else {
      const v = parseFloat(input.value);
      if (Number.isFinite(v) && v < 0) return;   // 負分被拒：維持 storage 原值
      targets.push([a.id, Number.isFinite(v) ? v : undefined]);
    }
  });
  if (!targets.length) return;
  updateShared(['scores'], (cur) => {
    const scores = { ...(cur.scores || {}) };
    targets.forEach(([id, v]) => {
      if (v === undefined) delete scores[id];
      else scores[id] = v;
    });
    return { scores };
  });
}

// ── 作業列 ──
// 自訂作業的編輯／刪除鈕：主清單列與已隱藏列共用（點擊綁定委派整個詳情容器，見 renderCourseDetailSection）
function customActionsHtml(a, courseId) {
  return `<div class="custom-actions-row">
              <button class="btn-edit-custom-assignment" title="${esc(tr('editAssignmentTitle'))}" aria-label="${esc(tr('editAssignmentTitle'))}" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
              <button class="btn-delete-custom-assignment" title="${esc(tr('deleteCustomTitle'))}" aria-label="${esc(tr('deleteCustomTitle'))}" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            </div>`;
}

function renderAssignmentRow(a, groups, courseId) {
  const submitted = isSubmitted(a); // Canvas 事實：已繳交 badge
  const done = isDone(a);           // 顯示狀態：列樣式 / 勾選圈（外部完成可被標回未完成）
  const examFlag = isExam(a);
  const uClass = urgencyClass(a.due_at, examFlag, done);
  const groupName = findGroupName(a, groups);
  const isCustom = !!a._isCustom;
  // 作業描述：Canvas 的是 HTML → 白名單 sanitize 後以 innerHTML 呈現（見 descSanitizer.js）；
  // 自訂作業的是使用者打的純文字 → escape、以 pre-wrap 保留換行，不走 HTML 解析（「a<b」「<Intro>」會被吞，QA #155）；
  // 空白 → noDesc
  const descBody = isCustom ? esc(a.description || '') : DueDescSanitizer.sanitize(a.description || '');
  const descInner = descBody.trim() ? descBody : esc(tr('noDesc'));
  // 升級後的考試/簽到（manualShown）：在清單中可拖回稽核區降級 → 名稱後加 grip 拖曳把手
  const promotedHideable = isHideable(a) && isManuallyShown(a);
  const titleHtml = isCustom
    ? `<span>${esc(a.name)}</span>`
    : `<span class="assignment-title-link" data-assignment-id="${a.id}" data-course-id="${courseId}">${esc(a.name)}</span>`;
  const customLabel = isCustom ? `<div class="custom-assignment-label">${tr('customAssignment')}</div>` : '';

  // ── 完成勾選圈：一律可雙向切換；寫入由 DueCompletion.setDone 依點擊當下的外部事實決定（見 completion.js）──
  const checkLabel = done ? tr('markUndone') : tr('markDone');
  const checkHtml = `<button class="assignment-check" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}" data-done="${done ? 'true' : 'false'}" aria-label="${esc(checkLabel)}"${submitted ? ` title="${esc(tr('submittedBadge'))}"` : ''}></button>`;

  // 不在列上顯示分數（含升級回清單、Canvas 已評分的考試）：分數只出現在成績計算器（決策 3）

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
        ${submitted ? `<div class="submitted-badge">${tr('submittedBadge')}</div>` : ''}
        ${isCustom ? customActionsHtml(a, courseId) : ''}
      </div>
    </div>
    <div class="assignment-desc">
      <div class="assignment-desc-inner${isCustom && descBody.trim() ? ' is-plain' : ''}">${descInner}</div>
    </div>`;
}

document.getElementById('btn-add-assignment')?.addEventListener('click', () => {
  openCustomAssignmentModal();
});
document.getElementById('custom-assignment-close')?.addEventListener('click', closeCustomAssignmentModal);
document.getElementById('custom-assignment-cancel')?.addEventListener('click', closeCustomAssignmentModal);
// ── 點背景關閉 modal：按下（pointerdown）、放開（pointerup）與 click 都落在背景本身才算 ──
// 按下與放開落在不同元素時，click 會派發到兩者的共同祖先 overlay（target 也是 overlay）：
// 在對話框內按下、拖曳選字到背景放開，或反過來在背景按下、拖進對話框才放開，只看 click 都會把 modal
// 連同未存的輸入一起關掉（QA P2-9）。五個 overlay（新增作業／權重／確認／教學／AI 設定）共用；AI 設定在 aiSettings.js 綁定
function trackBackdropPress(overlay) {
  if (!overlay || overlay._backdropTracked) return;
  overlay._backdropTracked = true;
  overlay.addEventListener('pointerdown', (e) => {
    overlay._pressedOnBackdrop = e.target === overlay;
    overlay._releasedOnBackdrop = false;
  });
  overlay.addEventListener('pointerup', (e) => { overlay._releasedOnBackdrop = e.target === overlay; });
}
function isBackdropClick(overlay, e) {
  const hit = !!overlay && e.target === overlay && !!overlay._pressedOnBackdrop && !!overlay._releasedOnBackdrop;
  if (overlay) overlay._pressedOnBackdrop = overlay._releasedOnBackdrop = false;
  return hit;
}

const _customOverlay = document.getElementById('custom-assignment-overlay');
trackBackdropPress(_customOverlay);
_customOverlay?.addEventListener('click', (e) => {
  if (isBackdropClick(_customOverlay, e)) closeCustomAssignmentModal();
});
document.getElementById('custom-assignment-form')?.addEventListener('submit', saveCustomAssignmentFromForm);

// 確認對話框：確定 → 跑 callback 後關閉；取消／點背景 → 關閉不執行
document.getElementById('confirm-ok')?.addEventListener('click', () => {
  const cb = _confirmOnOk;
  closeConfirmDialog();
  if (cb) cb();
});
document.getElementById('confirm-cancel')?.addEventListener('click', closeConfirmDialog);
const _confirmOverlay = document.getElementById('confirm-overlay');
trackBackdropPress(_confirmOverlay);
_confirmOverlay?.addEventListener('click', (e) => {
  if (isBackdropClick(_confirmOverlay, e)) closeConfirmDialog();
});

// ── 側欄主導航（學期待辦 / 課程 / 已繳交） ──
function goToPage(page) {
  abortActiveDrag();   // 導覽離開前中止進行中的拖曳（QA #198）
  _skipMorph();        // 課程 morph 進行中點側欄：不讓舊動畫蓋在新頁面上（QA #197）
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
    settlePageSlide();
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

// ── ← 返回：走 history.back()，與瀏覽器返回（手勢／按鈕／Cmd+[）統一由 popstate 處理 ──
// 按鈕常駐於 .page-tabs，只在這裡綁一次：renderCourseDetailSection 會被勾選、拖曳與即時刷新反覆呼叫，
// 綁在裡面會累積 listener，一次點擊連發多個 history.back() 直接退出 dashboard（QA P1-8）
document.getElementById('detail-back-btn').addEventListener('click', () => history.back());

// ── 查看已繳交（切換過濾） ──
document.getElementById('nav-submitted').addEventListener('click', () => {
  showSubmitted = !showSubmitted;
  settlePageSlide();   // 滑動中切過濾：立即換成「已繳交」該有的 grid 版面，不等收尾 timer（QA #192）
  syncHistory();   // 「已繳交」為過濾切換：更新目前 entry，不疊返回步
  // 課程詳情內切換：以 _currentData 同步重繪，保留已隱藏區開合與右欄捲動位置（QA #78）
  if (currentView === 'course' && (_currentData.courses || []).length) {
    const st = captureViewState();
    rerenderDetailAndNav(currentCourseId);
    restoreViewState(st);
    return;
  }
  loadData();
});

// ── 同步按鈕 ──
document.getElementById('sync-btn').addEventListener('click', () => {
  const btn = document.getElementById('sync-btn');
  btn.innerHTML = '<span class="sync-dots"><span></span><span></span><span></span></span>';
  btn.disabled = true;
  _syncInFlight = true;
  // 首次同步（無資料）→ 渲染 skeleton 佔位；已有資料則維持靜默背景刷新（不用佔位蓋真資料）
  const firstSync = !(_currentData.courses || []).length;
  if (firstSync) renderSyncSkeleton();
  chrome.runtime.sendMessage({ type: 'SYNC' }, (resp) => {
    _syncInFlight = false;
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

// ── 偵測到另一個 Canvas（QA P1-9）──
// background 在「已確認學校」的使用者造訪另一個已登入的 Canvas 時只記 canvasBaseCandidate、不自動切換；
// 這裡在側欄同步鍵上方提示，由使用者決定：
//   切換到這裡 → SET_CANVAS_BASE（background 先確認已登入、為新網址同步，成功才連同新資料一起換網址；
//                失敗時網址／資料／候選都不動）→ 成功收起提示並重讀資料；失敗保留提示並顯示一行說明
//                （依 background 回的 reason：'not-logged-in' → 請先登入；其餘（課程清單 5xx、網路、寫入失敗…）→ 請稍後再試）
//   忽略       → IGNORE_CANVAS_BASE（之後造訪該網址不再提示）→ 立即收起
// 候選與目前網址相同（剛切換成功、storage 尚未清候選）→ 不顯示。
// 候選由 loadData 與常駐 storage.onChanged 餵進來；不放進 _currentData（候選變動時只重畫這一行，不排整頁重繪；
// canvasBaseUrl 屬於同步 key，外部變更照常排整頁重繪，並順手重畫這一行）
let _canvasCandidate = null;          // { origin, at } | null
let _canvasCandidatePending = false;  // 切換中：兩鈕停用，期間任何重畫都不解除
let _canvasCandidateError = null;     // 上次切換失敗的原因 'not-logged-in'｜'sync-failed'｜null（再按切換或候選換成別的網址時清除）

function renderCanvasCandidate() {
  const box = document.getElementById('canvas-candidate');
  if (!box) return;
  const cand = _canvasCandidate;
  const show = !!(cand && cand.origin && cand.origin !== _currentData.canvasBaseUrl);
  box.hidden = !show;
  // 按鈕狀態不論顯示與否都歸位（收起時不留「切換中…」或停用狀態）
  const sw = document.getElementById('canvas-candidate-switch');
  const ig = document.getElementById('canvas-candidate-ignore');
  sw.textContent = tr(_canvasCandidatePending ? 'canvasCandidateSwitching' : 'canvasCandidateSwitch');
  sw.disabled = _canvasCandidatePending;
  ig.disabled = _canvasCandidatePending;
  box.setAttribute('aria-busy', _canvasCandidatePending ? 'true' : 'false');
  if (!show) return;
  let host = cand.origin;
  try { host = new URL(cand.origin).host; } catch (_) { }
  const hostEl = document.getElementById('canvas-candidate-host');
  hostEl.textContent = host;
  hostEl.title = cand.origin;
  const err = document.getElementById('canvas-candidate-error');
  err.hidden = !_canvasCandidateError;
  err.textContent = !_canvasCandidateError ? ''
    : tr(_canvasCandidateError === 'not-logged-in' ? 'canvasCandidateFailed' : 'canvasCandidateSyncFailed');
}

function setCanvasCandidate(cand) {
  const next = cand && cand.origin ? cand : null;
  if ((next && next.origin) !== (_canvasCandidate && _canvasCandidate.origin)) _canvasCandidateError = null;
  _canvasCandidate = next;
  renderCanvasCandidate();
}

document.getElementById('canvas-candidate-switch')?.addEventListener('click', () => {
  const cand = _canvasCandidate;
  if (!cand || _canvasCandidatePending) return;
  _canvasCandidatePending = true;
  _canvasCandidateError = null;
  renderCanvasCandidate();
  chrome.runtime.sendMessage({ type: 'SET_CANVAS_BASE', origin: cand.origin }, (resp) => {
    _canvasCandidatePending = false;
    if (chrome.runtime.lastError || !resp || !resp.success) {
      // 只有 background 明確回「未登入」才叫使用者去登入；訊息通道錯誤／沒有 reason 一律當同步失敗
      _canvasCandidateError = (resp && resp.reason === 'not-logged-in') ? 'not-logged-in' : 'sync-failed';
      renderCanvasCandidate();
      return;
    }
    // 成功：background 已把新網址連同新資料寫入並清掉候選 → 收起提示、以新資料重畫
    setCanvasCandidate(null);
    loadData();
  });
});

document.getElementById('canvas-candidate-ignore')?.addEventListener('click', () => {
  const cand = _canvasCandidate;
  if (!cand || _canvasCandidatePending) return;
  setCanvasCandidate(null);
  chrome.runtime.sendMessage({ type: 'IGNORE_CANVAS_BASE', origin: cand.origin }, () => void chrome.runtime.lastError);
});

// ── 空狀態（QA P2-6：#13 #44 #64 #171）──
// 從未同步（無 lastSync）vs 已同步但沒有進行中的課程（有 lastSync、courses 為空）：文案不同，
// 兩者都給明確的下一步「前往 Canvas」（已偵測到學校 → 該校；否則同教學：連 HKUST(GZ)，並說明其他學校怎麼做）
function renderEmptyState() {
  const main = document.getElementById('main-section');
  if (!main) return;
  const { lastSync, canvasBaseUrl } = _currentData;
  const synced = !!lastSync;
  const label = canvasBaseUrl ? 'Canvas' : tr('wCanvasDefaultSchool');
  main.innerHTML = `
    <div class="state-msg">
      <div class="big">${esc(tr(synced ? 'emptyNoCoursesTitle' : 'emptyNeverTitle'))}</div>
      <div class="body">${esc(tr(synced ? 'emptyNoCoursesBody' : 'emptyNeverBody'))}</div>
      <button type="button" class="state-msg-action" id="empty-open-canvas">${esc(tr('emptyOpenCanvas').replace('{canvas}', () => label))}</button>
      ${canvasBaseUrl ? '' : `<div class="state-msg-sub">${esc(tr('wCanvasOtherSchool'))}</div>`}
    </div>`;
}

// 沒有課程時「+ 新增作業」「課程」「已繳交」無事可做 → 停用並以 title 說明，不留點了沒反應的死按鈕（QA #13/#171）
let _noCoursesMode = false;
function setNoCoursesMode(on) {
  _noCoursesMode = on;
  ['btn-add-assignment', 'nav-courses', 'nav-submitted'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = on;
    if (on) el.title = tr('needCourses');
    else el.removeAttribute('title');
  });
}

// 開 Canvas 分頁（教學「登入 Canvas」連結與空狀態共用）：點擊當下讀 storage 的 canvasBaseUrl
// （尚未同步出課程時 _currentData 是空的），沒有就開預設學校。
// onBase(base)：開之前回報實際用的 base（教學據此把連結文字對齊目標）；armReturn：同步落地後自動跳回 dashboard
function openCanvasTab({ armReturn = false, onBase = null } = {}) {
  chrome.storage.local.get(['canvasBaseUrl'], (d) => {
    const base = (d && d.canvasBaseUrl) || null;
    if (onBase) onBase(base);
    if (!chrome.tabs?.create) return;
    chrome.tabs.create({ url: base || DEFAULT_CANVAS_URL, active: true }, (tab) => {
      if (armReturn && tab) _armCanvasReturn(tab.id);
    });
  });
}

// 空狀態的「前往 Canvas」（委派：空狀態會隨語言／同步重畫）。從未同步 → 同教學，同步落地後自動跳回
document.getElementById('main-section')?.addEventListener('click', (e) => {
  if (!e.target.closest('#empty-open-canvas')) return;
  openCanvasTab({ armReturn: !_currentData.lastSync });
});

// ── 讀取資料 ──
function loadData() {
  chrome.storage.local.get(
    ['lastSync', 'schoolName', 'canvasBaseUrl', 'canvasBaseCandidate', 'courses', 'assignments', 'customAssignments', 'assignmentGroups', 'scores', 'courseNames', 'customWeights', 'manualDone', 'manualUndone', 'manualShown', 'manualHidden', 'gradingAnalysis', 'aiConfig'],
    (raw) => {
      // 候選網址另存在 _canvasCandidate（不進 _currentData），在 _currentData 的 canvasBaseUrl 更新後再畫提示；
      // aiConfig 只取「有沒有設定 key」，不進 _currentData
      const { canvasBaseCandidate, aiConfig, ...data } = raw || {};
      _aiConfigured = isAiConfigured(aiConfig);
      if (!data.courses || !data.courses.length) {
        currentView = 'grid';
        currentCourseId = null;
        // 沒有課程時只有「學期待辦」可停（課程／已繳交停用，見 setNoCoursesMode）；資料回來後落在學期待辦
        currentPage = 'week';
        showSubmitted = false;
        syncHistory();
        // 快取換成「只有同步狀態」：側欄計數、課程列不再顯示上一份資料的殘影（QA #13）
        _currentData = { lastSync: data.lastSync, schoolName: data.schoolName, canvasBaseUrl: data.canvasBaseUrl };
        setCanvasCandidate(canvasBaseCandidate);   // 放假沒課的學校也可能偵測到另一個 Canvas
        _lastRenderAt = 0;   // 空狀態不是資料畫面；資料落地後走 loadData 完整路徑
        setHeaderMeta(...headerMetaParts());   // 「學校 · N 分鐘前同步／尚未同步」，與有資料時同一格式（QA #44）
        setNoCoursesMode(true);
        document.getElementById('course-nav').innerHTML = '';
        document.getElementById('page-tabs').classList.remove('detail-mode');
        document.getElementById('page-tabs').style.display = '';
        document.getElementById('main-section').style.display = '';
        document.getElementById('course-detail-container').style.display = 'none';
        updateSideNav();   // 空狀態下切「已繳交」也要反映在側欄高亮
        // 首次同步進行中（skeleton 期間切已繳交／換語言都會走到這裡）→ 重畫 skeleton（形狀跟著目前頁面），
        // 不換成「尚無資料，請點擊同步」——同步其實還在跑（QA #194）
        if (_syncInFlight) {
          renderSyncSkeleton();
          return;
        }
        delete document.getElementById('main-section').dataset.skeleton;   // 失敗還原：清掉 skeleton 標記
        renderEmptyState();
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
        // 一定要有這個 key：常駐 onChanged 只合併 _currentData 裡已有的 key，AI 之後寫的紀錄才會進來（D2 來源標示）
        gradingAnalysis: data.gradingAnalysis || {},
      });
      setCanvasCandidate(canvasBaseCandidate);
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
    saveLocal({ showClaudeUsageInPopup: _showClaudeUsage });
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
let _welcomeCanvasBase = null;   // 已偵測到的學校 Canvas 網址（開教學時從 storage 讀；尚未同步時 _currentData 是空的）

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
  // 按鈕整排重建：焦點原本在這排（剛按了上一步／下一步）→ 交給新的主要按鈕，不掉回 body（QA #122）
  const hadFocus = btnRow.contains(document.activeElement);
  btnRow.innerHTML = html;
  if (hadFocus) btnRow.querySelector('.welcome-btn:last-child')?.focus();

  // Re-bind the done button since it's dynamic
  document.getElementById('welcome-done-btn')?.addEventListener('click', closeWelcomeModal);
}

// 只有目前這頁可互動：其餘投影片 inert（Tab 不會聚焦到畫面外的連結、把 overflow:hidden 的軌道捲走，QA P2-13）；
// 軌道容器若曾被捲動過一律歸零（位移只由 translateX 負責）
function _welcomeSyncSlides(n) {
  document.querySelectorAll('#welcome-track > .welcome-step').forEach((step, i) => {
    step.inert = i + 1 !== n;
  });
  const area = document.querySelector('.welcome-main-area');
  if (area) area.scrollLeft = 0;
}

function openWelcomeModal() {
  _welcomeStep = 1;
  const track = document.getElementById('welcome-track');
  if (track) track.style.transition = 'none';
  if (track) track.style.transform = 'translateX(0)';
  _welcomeUpdateDots(1);
  _welcomeUpdateButtons(1);
  _welcomeSyncSlides(1);
  const overlay = document.getElementById('welcome-overlay');
  if (overlay) overlay.classList.add('open');
  refreshWelcomeCanvasBase();
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
  _welcomeSyncSlides(n);
  if (n === 2) refreshWelcomeCanvasBase();   // 進「登入 Canvas」頁：連結對齊目前偵測到的學校
}

document.getElementById('welcome-close')?.addEventListener('click', closeWelcomeModal);
document.getElementById('welcome-done-btn')?.addEventListener('click', closeWelcomeModal);
document.querySelectorAll('.welcome-lang-switch button').forEach((btn) => {
  btn.addEventListener('click', () => setUILanguage(btn.dataset.lang));
});

// 教學第 3 頁示意圖載入失敗 → 收起預覽框，不留破圖（MV3 CSP 擋 inline onerror，改由這裡綁，QA #157）
(() => {
  const img = document.getElementById('wstep-3-img');
  if (!img) return;
  const hide = () => {
    const box = img.closest('.welcome-preview');
    if (box) box.style.display = 'none';
  };
  img.addEventListener('error', hide);
  if (img.complete && !img.naturalWidth) hide();   // 腳本執行前就已失敗
})();

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
  refreshWelcomeCanvasBase();   // 同步落地＝學校已偵測到：連結改指向該校
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

// ── 即時刷新（QA P1-3）：常駐 storage 監聽＋時間驅動重繪 ──
// 背景同步、popup、其他 dashboard 分頁寫入 storage → 一律併進 _currentData（事件依 storage 寫入順序送達，
// 最後一定收斂到 storage 真值）；來自「別處」的變更再排一次重繪，等 UI 閒置才執行（isUiIdle），
// 重繪保留頁面／詳情、捲動、稽核區開合、展開的描述、成績計算器開合與焦點（refreshView）。
// 本頁自己寫的回聲（updateShared 記在 _selfWrites）只併資料、不重繪——呼叫端已樂觀更新並自行重繪。
const LIVE_SYNC_KEYS = ['lastSync', 'courses', 'assignments', 'assignmentGroups', 'schoolName', 'canvasBaseUrl'];
const REFRESH_DEBOUNCE_MS = 150;          // 同一次同步連發多個 key → 合併成一次重繪
const REFRESH_RETRY_MS = 800;             // 非閒置時隔一段再試
const META_TICK_MS = 60 * 1000;           // header「N 分鐘前」每分鐘重算
const STALE_ON_SHOW_MS = 60 * 1000;       // 分頁回到前景：距上次 render 超過此值就重繪
const IDLE_RERENDER_MS = 5 * 60 * 1000;   // 前景時每 5 分鐘重繪一次（逾期分組、7/30 天邊界、考試結束都隨時間變）
const MODAL_OVERLAY_IDS = ['custom-assignment-overlay', 'weight-edit-overlay', 'welcome-overlay', 'confirm-overlay', 'ai-settings-overlay'];
const MORPH_STALE_MS = 2000;              // view-transition-name 殘留超過此值視為已結束
let _refreshPending = false;
let _refreshTimer = 0;
let _morphSeenAt = 0;

// 是否為本頁 updateShared 寫出的值的回聲（命中即消耗該筆及更早的紀錄）
function _isOwnEcho(key, newValue) {
  const q = _selfWrites[key];
  if (!q || !q.length) return false;
  const i = q.indexOf(_canonJson(newValue));
  if (i < 0) return false;
  q.splice(0, i + 1);
  return true;
}

// UI 閒置＝此刻整段重繪不會打斷使用者：沒有拖曳、撤銷窗口／碎點爆、拖曳落點飛入、頁面滑動、課程 morph，
// 焦點不在輸入框（課程重命名、成績計算器），也沒有 modal 開著
function isUiIdle() {
  if (_dragCtx) return false;
  if (Object.keys(_completeTimers).length) return false;
  // 只看畫面上看得到的（getClientRects 非空）：撤銷窗口／碎點爆中導覽離開，該列/卡會留在已 display:none 的
  // 詳情或 main-section 裡（計時器已被 clearCompleteTimers 清掉、完成在勾選當下就已寫入），要等那個容器
  // 下次重繪才被換掉——不能讓這種殘留一直擋住即時刷新
  const busy = document.querySelectorAll('.completing, .bursting, .drag-clone, .page-slider');
  if ([...busy].some((el) => el.getClientRects().length)) return false;
  // 課程 morph（0.28s）期間共享元素帶 view-transition-name，finished 後清掉；
  // transition 中斷沒清到的殘留不能永遠擋住刷新 → 同一段連續看到超過 2 秒就不再算進行中
  if (document.querySelector('[style*="view-transition-name"]')) {
    if (!_morphSeenAt) _morphSeenAt = Date.now();
    if (Date.now() - _morphSeenAt < MORPH_STALE_MS) return false;
  } else {
    _morphSeenAt = 0;
  }
  const ae = document.activeElement;
  if (ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable)) return false;
  return !MODAL_OVERLAY_IDS.some((id) => {
    const ov = document.getElementById(id);
    return !!(ov && ov.classList.contains('open'));
  });
}

function requestRefresh() {
  _refreshPending = true;
  if (!_refreshTimer) _refreshTimer = setTimeout(_tryRefresh, REFRESH_DEBOUNCE_MS);
}

function _tryRefresh() {
  _refreshTimer = 0;
  if (!_refreshPending) return;
  if (!isUiIdle()) { _refreshTimer = setTimeout(_tryRefresh, REFRESH_RETRY_MS); return; }
  _refreshPending = false;
  refreshView();
}

// 重繪前記下會被 innerHTML 重建洗掉的畫面狀態
const REFRESH_SCROLLERS = ['.sidebar', '.week-right', '.detail-right-panel', '.main-content', '#main-section', '#course-detail-container'];
function _focusSelector(el) {
  if (!el || el === document.body || !el.tagName) return null;
  const css = (v) => ((window.CSS && CSS.escape) ? CSS.escape(String(v)) : String(v));
  if (el.id) return `#${css(el.id)}`;
  const cls = el.classList[0];
  if (!cls) return null;
  let sel = `${el.tagName.toLowerCase()}.${css(cls)}`;
  ['assignmentId', 'hideableId', 'targetCourse', 'scrollGroup', 'courseId'].forEach((k) => {
    if (el.dataset[k] != null) sel += `[data-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}="${css(el.dataset[k])}"]`;
  });
  return sel;
}

function captureViewState() {
  const detail = document.getElementById('course-detail-container');
  return {
    view: currentView,
    courseId: currentCourseId,
    scrolls: REFRESH_SCROLLERS.map((sel) => {
      const el = document.querySelector(sel);
      return [sel, el ? el.scrollTop : 0];
    }),
    pageScroll: document.scrollingElement ? document.scrollingElement.scrollTop : 0,
    hiddenOpen: !!(detail && detail.querySelector('.hidden-items.open')),
    gradeOpen: !!(detail && detail.querySelector('.grade-calc.open')),
    openDescIds: detail
      ? Array.from(detail.querySelectorAll('.assignment-desc.open')).map((d) => {
        const row = d.previousElementSibling;
        if (!row) return null;
        const chk = row.querySelector('.assignment-check');
        return row.dataset.hideableId || (chk && chk.dataset.assignmentId) || null;
      }).filter(Boolean)
      : [],
    focus: _focusSelector(document.activeElement),
  };
}

function restoreViewState(st) {
  const detail = document.getElementById('course-detail-container');
  if (detail && st.view === 'course' && currentView === 'course' && st.courseId === currentCourseId) {
    const hidden = detail.querySelector('.hidden-items');
    if (st.hiddenOpen && hidden) hidden.classList.add('open');
    const calc = detail.querySelector('.grade-calc');
    if (st.gradeOpen && calc) calc.classList.add('open');
    st.openDescIds.forEach((id) => {
      const css = (window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id);
      const chk = detail.querySelector(`.assignment-item .assignment-check[data-assignment-id="${css}"]`);
      const row = chk && chk.closest('.assignment-item');
      const desc = row && row.nextElementSibling;
      if (desc && desc.classList.contains('assignment-desc')) desc.classList.add('open');
    });
  }
  st.scrolls.forEach(([sel, top]) => {
    const el = document.querySelector(sel);
    if (el && top) el.scrollTop = top;
  });
  if (document.scrollingElement && st.pageScroll) document.scrollingElement.scrollTop = st.pageScroll;
  if (st.focus && (!document.activeElement || document.activeElement === document.body)) {
    const el = document.querySelector(st.focus);
    if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
  }
}

// 以已併入最新變更的 _currentData 原地重繪目前畫面（不重讀 storage：本頁佇列中的寫入不會被舊值蓋掉）
function refreshView() {
  // 尚未以資料渲染過（首次同步落地）或資料被清空 → 走 loadData 完整路徑（含空狀態、skeleton 淡入）
  if (!_lastRenderAt || !(_currentData.courses || []).length) {
    loadData();
    return;
  }
  const st = captureViewState();
  render({
    ..._currentData,
    assignments: _currentData.canvasAssignments || {},
    customAssignments: _currentData.customAssignments || {},
  });
  restoreViewState(st);
}

// 常駐 storage 監聽（同時處理「登入 Canvas 自動跳回」的武裝分支）
if (chrome.storage?.onChanged?.addListener) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const patch = {};
    let external = false;
    Object.keys(changes).forEach((key) => {
      // 只管畫面用得到的 key（同步資料、共享使用者 map、render 帶進 _currentData 的其他 key）；
      // claudeUsage、uiLanguage 等與 dashboard 畫面無關的略過
      if (!LIVE_SYNC_KEYS.includes(key) && !SHARED_USER_KEYS.includes(key) && !(key in _currentData)) return;
      const { newValue } = changes[key];
      patch[key] = newValue;
      if (!_isOwnEcho(key, newValue)) external = true;
    });
    if (Object.keys(patch).length) _mergeIntoCurrentData(patch);
    if (changes.aiConfig) _aiConfigured = isAiConfigured(changes.aiConfig.newValue);

    // 「偵測到另一個 Canvas」提示：候選變了 → 只重畫側欄那一行（候選不進 _currentData、不排整頁重繪）；
    // 目前網址變了 → 也重畫這一行（canvasBaseUrl 是同步 key，外部變更另由下方 requestRefresh 排整頁重繪）
    if (changes.canvasBaseCandidate) setCanvasCandidate(changes.canvasBaseCandidate.newValue);
    else if (changes.canvasBaseUrl) renderCanvasCandidate();
    // 教學開著、使用者自己去開學校 Canvas（未武裝）時網址落地 → 第 2 頁連結文字跟著換，不會寫著 HKUST(GZ) 卻開別校
    if (changes.canvasBaseUrl) setWelcomeCanvasBase(changes.canvasBaseUrl.newValue);

    // 武裝期間 lastSync 落地 → 跳回 dashboard（內含 loadData，不必再排一般重繪）
    const ls = changes.lastSync;
    if (_canvasReturn && ls && ls.newValue && ls.newValue !== ls.oldValue) {
      _returnToDashboard();
      return;
    }
    if (external) requestRefresh();
  });
}

// header「N 分鐘前同步」每分鐘重算：資料畫面與「已同步但沒有課程」的空狀態都要跑；
// 首次同步 skeleton（顯示「同步中」）與尚未載入（「載入中」）時不動
function refreshHeaderMeta() {
  if (!_lastRenderAt && !_currentData.lastSync) return;
  const main = document.getElementById('main-section');
  if (main && main.dataset.skeleton) return;
  const el = document.getElementById('header-meta');
  if (!el || el.dataset.loading) return;
  const [school, status] = headerMetaParts();
  if (el.textContent !== `${school} · ${status}`) setHeaderMeta(school, status);
}

setInterval(() => {
  refreshHeaderMeta();
  if (document.visibilityState === 'visible' && _lastRenderAt && Date.now() - _lastRenderAt >= IDLE_RERENDER_MS) {
    requestRefresh();
  }
}, META_TICK_MS);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  refreshHeaderMeta();
  if (_lastRenderAt && Date.now() - _lastRenderAt > STALE_ON_SHOW_MS) requestRefresh();
});

// 尚未偵測到學校時「登入 Canvas」連結的預設目標（連結文字會明講是 HKUST(GZ)）
const DEFAULT_CANVAS_URL = 'https://hkust-gz.instructure.com';

// AI 評分比重分析寫入 customWeights 後由 background 送來（spec 2026-09-03 §10）。
// 畫面重繪交給常駐 storage.onChanged（customWeights 是共享 key：併進 _currentData、等閒置後保留展開狀態重繪）；
// 這裡只刷新開著的 AI 設定 modal 狀態列
if (chrome.runtime?.onMessage?.addListener) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== 'GRADING_WEIGHTS_UPDATED') return;
    const overlay = document.getElementById('ai-settings-overlay');
    if (overlay && overlay.classList.contains('open') && typeof DueAiSettings !== 'undefined') DueAiSettings.refreshStatus();
  });
}

// Delegate: overlay background click to close, canvas link, data-wgo step nav, dot clicks
// （canvas link 用委派：applyWelcomeTranslations 會以 innerHTML 重建該連結，直接綁定會失效）
const _welcomeOverlay = document.getElementById('welcome-overlay');
trackBackdropPress(_welcomeOverlay);
_welcomeOverlay?.addEventListener('click', (e) => {
  if (e.target === _welcomeOverlay) {
    if (isBackdropClick(_welcomeOverlay, e)) closeWelcomeModal();   // 按下點在卡片內、拖到背景放開 → 不關（QA P2-9）
    return;
  }
  const link = e.target.closest('#welcome-canvas-link');
  if (link) {
    e.preventDefault();
    // 開的目標＝點擊當下 storage 的 canvasBaseUrl；連結文字同步改成這份狀態（不會寫著 HKUST(GZ) 卻開別校）
    openCanvasTab({ armReturn: true, onBase: setWelcomeCanvasBase });
    return;
  }
  const btn = e.target.closest('[data-wgo]');
  if (btn) { welcomeGoStep(+btn.dataset.wgo); return; }
  const dot = e.target.closest('.welcome-dot[data-wstep]');
  if (dot) welcomeGoStep(+dot.dataset.wstep);
});

// Open on first install (URL param ?welcome=1)
// 開過就把 welcome 參數從網址拿掉（保留其他參數、hash 與 history state）：重新整理不會再從第 1 頁跳出教學（QA #48）
if (new URLSearchParams(location.search).get('welcome') === '1') {
  openWelcomeModal();
  const params = new URLSearchParams(location.search);
  params.delete('welcome');
  const qs = params.toString();
  history.replaceState(history.state, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
}

// ── 瀏覽器返回整合：popstate 把畫面還原到目標 entry（期間 _suppressHistory 擋掉再寫 history）──
window.addEventListener('popstate', (e) => {
  if (!_currentData.courses) return;   // 資料尚未載入前忽略
  abortActiveDrag();                   // 拖曳中按 Back／Forward：先中止拖曳（QA #198）
  settlePageSlide();
  const loc = (e.state && e.state.app === 'due')
    ? e.state
    : { page: 'week', showSubmitted: false, view: 'grid', courseId: null };
  _suppressHistory = true;
  try {
    if (loc.view === 'course' && loc.courseId != null) {
      // 前進／重做到某課程詳情：沿用「目前」的頁面與已繳交過濾——entry 裡的是舊值（Back 後在清單切過過濾，
      // Forward 回來不能悄悄還原成舊過濾、側欄卻亮著另一個，QA #188）
      if (currentView !== 'course' || currentCourseId !== loc.courseId) {
        showCourseDetail(loc.courseId);   // 無 cardEl → 直接切換（無 morph）；課程已不在 → 留在清單（QA #187）
      }
      // entry 改寫成實際畫面（目前過濾；課程已不在則改回清單）
      history.replaceState(_appLocation(), '');
    } else if (currentView === 'course') {
      // 從課程詳情 Back → 帶 morph 退回清單。已繳交過濾沿用目前值（在詳情內切過也算數，QA #203），寫回清單 entry
      _skipMorph();
      currentPage = loc.page || 'week';
      showGridView();                     // 同步設好 view=grid
      history.replaceState(_appLocation(), '');
    } else {
      // 已在清單，僅頁面／過濾不同 → 重繪
      _skipMorph();
      currentPage = loc.page || 'week';
      showSubmitted = !!loc.showSubmitted;
      updateSideNav();
      loadData();
    }
  } finally {
    _suppressHistory = false;
  }
});

// 建立 base entry（week grid），之後 pushState/replaceState 才有基準。
// 重新整理（reload）時目前 entry 已帶有狀態 → 依它還原頁面、已繳交過濾與課程詳情，而不是覆寫回週待辦
// （課程已不在時 render() 會退回清單並改寫 entry，QA #114）
const _bootLoc = (history.state && history.state.app === 'due') ? history.state : null;
if (_bootLoc) {
  currentPage = _bootLoc.page === 'courses' ? 'courses' : 'week';
  showSubmitted = !!_bootLoc.showSubmitted;
  if (_bootLoc.view === 'course' && _bootLoc.courseId != null) {
    currentView = 'course';
    currentCourseId = _bootLoc.courseId;
  }
}
_historyReady = true;
history.replaceState(_appLocation(), '');

loadData();

// ── Weight Edit Modal ──
let _weightEditCourseId = null;

function openWeightEditModal(courseId) {
  _weightEditCourseId = courseId;

  const custom = (_currentData.customWeights || {})[courseId];
  const groups = (_currentData.assignmentGroups || {})[courseId] || [];

  // 有自訂覆寫（含全刪後存下的空陣列）→ 照覆寫列出，與圓餅一致；否則以 Canvas 實際生效的分組權重預填
  const hasCustom = Array.isArray(custom);
  let items = [];
  if (hasCustom) {
    items = custom.map((c) => ({ name: c.name || '', weight: c.weight }));
  } else if (courseUsesGroupWeights(courseId, groups)) {
    items = groups.filter((g) => g.group_weight).map((g) => ({ name: g.name, weight: g.group_weight }));
  }

  renderWeightEditList(items);
  // 逃生口：僅當該課已有自訂權重時才顯示。文字照實說按下去會怎樣（D3，規則在 DueGradingRules.resetButtonKind）：
  // 有 Canvas 權重 → 還原；沒有 → 清掉後圓餅變「沒有評分資訊」，AI 會重跑的課才寫「清除並重新分析」
  const resetKind = typeof DueGradingRules !== 'undefined'
    ? DueGradingRules.resetButtonKind({
      canvasWeights: courseUsesGroupWeights(courseId, groups),
      aiConfigured: _aiConfigured,
      record: (_currentData.gradingAnalysis || {})[courseId],
    })
    : (courseUsesGroupWeights(courseId, groups) ? 'restore' : 'clear');
  _weightResetKey = { restore: 'weightReset', reanalyze: 'weightResetReanalyze', clear: 'weightResetClear' }[resetKind];
  const resetBtn = document.getElementById('weight-edit-reset');
  if (resetBtn) {
    resetBtn.style.display = hasCustom ? '' : 'none';
    resetBtn.textContent = tr(_weightResetKey);
  }
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

  // 名稱也要聽：0% 的列有沒有名稱會改變「總和 0」判定（見 weightEditProblem）
  list.querySelectorAll('.weight-edit-pct, .weight-edit-name').forEach((input) => {
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

// 編輯器目前狀態能不能存：總和超過 100%、有負數、或還有「會被存下的項目」但總和為 0 → 不能存（QA #25/#168）。
// 全部刪光（0 列）可以存：代表「此課不顯示權重」（圓餅顯示「沒有評分資訊」，要回 Canvas 權重按還原）。
// 「會被存下」與儲存時的過濾一致（weightRowKept：有名稱或權重 > 0）——名稱空且 0% 的空白列存檔時會丟掉，
// 不算數；否則在 0 列的編輯器按「+ 新增項目」還沒輸入就報總和 0、儲存被擋
function weightRowKept(item) {
  return item.weight > 0 || item.name !== '';
}
function readWeightEditRows() {
  return Array.from(document.querySelectorAll('.weight-edit-row')).map((row) => ({
    name: row.querySelector('.weight-edit-name').value.trim(),
    weight: parseFloat(row.querySelector('.weight-edit-pct').value) || 0,
  }));
}
function weightEditProblem() {
  const rows = readWeightEditRows();
  const total = rows.reduce((s, r) => s + r.weight, 0);
  let problem = '';
  if (rows.some((r) => r.weight < 0)) problem = 'weightNegative';
  else if (total > 100.05) problem = 'weightOverLimit';   // 0.05 容差：33.3+33.3+33.4 的浮點誤差
  else if (rows.some(weightRowKept) && total <= 0) problem = 'weightZeroTotal';
  return { total, problem };
}

function updateWeightTotal() {
  const { total, problem } = weightEditProblem();
  const el = document.getElementById('weight-edit-total');
  el.textContent = `${tr('weightTotal')}${Math.round(total * 10) / 10}%`;
  el.classList.toggle('over', !!problem);
  const msg = document.getElementById('weight-edit-msg');
  if (msg) msg.textContent = problem ? tr(problem) : '';
  const saveBtn = document.getElementById('weight-edit-save');
  if (saveBtn) saveBtn.disabled = !!problem;
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
  row.querySelector('.weight-edit-name').addEventListener('input', updateWeightTotal);
  document.getElementById('weight-edit-list').appendChild(row);
  row.querySelector('.weight-edit-name').focus();
  updateWeightTotal();
});

document.getElementById('weight-edit-save').addEventListener('click', () => {
  if (weightEditProblem().problem) return;   // 鈕已 disabled；保險起見再擋一次
  // 未命名的項目存成空字串（顯示時才套當前語言的「未命名」）；名稱空且 0% 的空白列直接丟掉（QA #170）
  const items = readWeightEditRows().filter(weightRowKept);

  // 樂觀更新 _currentData＋storage read-modify-write（只動這一門課，見 updateShared）。
  // 刪光所有項目：Canvas 有生效權重 → 存空陣列（明確覆寫成「不顯示權重」）；沒有 → 等同沒有自訂，直接刪 key
  const savedCourseId = _weightEditCourseId;
  const groups = (_currentData.assignmentGroups || {})[savedCourseId] || [];
  const keepEmpty = items.length > 0 || courseUsesGroupWeights(savedCourseId, groups);
  updateShared(['customWeights'], (cur) => {
    const all = { ...(cur.customWeights || {}) };
    if (keepEmpty) all[savedCourseId] = items;
    else delete all[savedCourseId];
    return { customWeights: all };
  });

  document.getElementById('weight-edit-overlay').classList.remove('open');
  refreshWeightPanel(savedCourseId);
});

document.getElementById('weight-edit-cancel').addEventListener('click', () => {
  document.getElementById('weight-edit-overlay').classList.remove('open');
});

document.getElementById('weight-edit-reset').addEventListener('click', () => {
  const courseId = _weightEditCourseId;
  const reanalyze = _weightResetKey === 'weightResetReanalyze';
  // 刪除該課自訂權重 → 圓餅自然回退到 Canvas group_weight，或顯示無評分資訊
  updateShared(['customWeights'], (cur) => {
    const all = { ...(cur.customWeights || {}) };
    delete all[courseId];
    return { customWeights: all };
  }, {
    // 「清除並重新分析」：寫入落地後才叫 AI 跑（先叫的話 runner 讀到的還是舊權重，會直接跳過這門課）
    done: () => {
      if (!reanalyze || !chrome.runtime?.sendMessage) return;
      try {
        chrome.runtime.sendMessage({ type: 'AI_RUN_NOW' }, () => void chrome.runtime.lastError);
      } catch (_) { }
    },
  });
  document.getElementById('weight-edit-overlay').classList.remove('open');
  refreshWeightPanel(courseId);
});

const _weightOverlay = document.getElementById('weight-edit-overlay');
trackBackdropPress(_weightOverlay);
_weightOverlay.addEventListener('click', (e) => {
  if (isBackdropClick(_weightOverlay, e)) _weightOverlay.classList.remove('open');
});

// ── Esc 關閉最上層 overlay（一次只關一個；優先序見 closers）──
// 註：課程重命名 inline input 自帶 Escape 處理，且重命名時無 overlay 開著，兩者不衝突
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (isImeComposing(e)) return;   // 組字中的 Esc 是取消候選字，不關 modal（連同未存輸入，QA P2-14）
  // 優先序：確認框 → AI 設定 → 新增/編輯作業 → 權重 → 教學（一次只關最上層；經 close 函式一併清狀態）
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

// ── Modal 無障礙：focus trap ＋ 開啟聚焦第一元素 ＋ 關閉還原焦點到觸發元素（五個 overlay 共用）──
function _focusablesIn(container) {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  // inert 子樹（教學畫面外的投影片）不可聚焦，不算進 trap 的頭尾
  return Array.from(container.querySelectorAll(sel)).filter((el) => el.getClientRects().length > 0 && !el.closest('[inert]'));
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


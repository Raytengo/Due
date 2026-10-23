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
  // transition.shake（--ease-in-out）：送出失敗時欄位搖一次「不」（#38）
  shake: Object.freeze({ duration: 400, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }),
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
    courses: '課程',
    sync: '同步',
    syncing: '同步中...',
    syncFailed: '同步失敗',
    // 同步按鈕的完成狀態（#30）：按鈕上停 1.5 秒；短字，最寬的狀態決定按鈕寬度
    syncDone: '✓ 已同步',
    a11ySynced: '同步完成',
    closeDialog: '關閉',
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
    // 設定選單：清除本機資料（QA #152）
    menuClearData: '清除本機資料…',
    clearDataTitle: '清除本機資料',
    clearDataMessage: '會刪除這個瀏覽器裡 Due 的所有資料：同步的課程與作業、完成與隱藏標記、成績計算器分數、自訂作業、課程改名與權重。介面語言會保留，下次打開 Canvas 時會重新同步。此動作無法復原。',
    clearDataConfirm: '清除',
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
    weekDoneLabel: '近期完成',
    weekRingScope: '範圍：30 天內的逾期＋未來 7 天到期',
    weekAllDoneLabel: '全部完成',
    // ui widgets
    editWeight: '編輯',
    weightEditTitle: '編輯評分權重',
    weightReset: '還原 Canvas 權重',
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
    courses: '课程',
    sync: '同步',
    syncing: '同步中...',
    syncFailed: '同步失败',
    syncDone: '✓ 已同步',
    a11ySynced: '同步完成',
    closeDialog: '关闭',
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
    menuClearData: '清除本地数据…',
    clearDataTitle: '清除本地数据',
    clearDataMessage: '会删除这个浏览器里 Due 的所有数据：同步的课程和作业、完成与隐藏标记、成绩计算器分数、自定义作业、课程改名和权重。界面语言会保留，下次打开 Canvas 时会重新同步。此操作无法撤销。',
    clearDataConfirm: '清除',
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
    weekDoneLabel: '近期完成',
    weekRingScope: '范围：30 天内的逾期＋未来 7 天到期',
    weekAllDoneLabel: '全部完成',
    editWeight: '编辑',
    weightEditTitle: '编辑评分权重',
    weightReset: '还原 Canvas 权重',
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
    courses: 'Courses',
    sync: 'Sync',
    syncing: 'Syncing...',
    syncFailed: 'Sync failed',
    syncDone: '✓ Synced',
    a11ySynced: 'Sync complete',
    closeDialog: 'Close',
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
    menuClearData: 'Clear local data…',
    clearDataTitle: 'Clear local data',
    clearDataMessage: "This deletes all of Due's data in this browser: synced courses and assignments, done and hidden marks, grade calculator scores, custom assignments, course names and weights. Your language setting is kept, and Due syncs again the next time you open Canvas. This can't be undone.",
    clearDataConfirm: 'Clear',
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
    weekDoneLabel: 'Near-term',
    weekRingScope: 'Overdue within 30 days + due in the next 7 days',
    weekAllDoneLabel: 'All done',
    editWeight: 'Edit',
    weightEditTitle: 'Edit Grade Weights',
    weightReset: 'Reset to Canvas weights',
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

function applyUILanguage() {
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = tr(key);
  };
  document.documentElement.lang = _uiLanguage;   // zh-TW／zh-CN／en（讀屏發音、斷字跟著語言，QA #125）
  const headerMeta = document.getElementById('header-meta');
  if (headerMeta && headerMeta.dataset.loading) headerMeta.textContent = tr('loading');
  setText('label-courses', 'courses');
  // 同步按鈕四個狀態各自一格（#30）：只改文字，data-status 不動（換語言不打斷進行中的狀態）。
  // 三點是 .s-loading 裡獨立的節點，同步進行中換語言也不會被字樣蓋掉（QA #194 的症狀在這個結構下不會發生）
  setText('sync-label-idle', 'sync');
  setText('sync-label-loading-text', 'syncing');
  setText('sync-label-done', 'syncDone');
  setText('sync-label-error', 'syncFailed');
  ['custom-assignment-close', 'weight-edit-close'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('aria-label', tr('closeDialog'));
  });
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
  setText('weight-edit-reset', 'weightReset');
  setText('settings-menu-title', 'settingsTitle');
  const settingsBtn = document.getElementById('settings-menu-btn');
  if (settingsBtn) {
    settingsBtn.title = tr('settingsTitle');
    settingsBtn.setAttribute('aria-label', tr('settingsTitle'));
  }
  setText('menu-clear-data', 'menuClearData');
  if (_noCoursesMode) setNoCoursesMode(true);   // 停用鈕的說明 tooltip 跟著換語言
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

// 「語言」列在母選單長到原尺寸時的位置（#50）：母選單還在從齒輪長出來（scale 0.9 → 1）時，getBoundingClientRect 量到的是
// 縮放中的 rect，子選單會開歪。不等 transitionend（等的那 ~200ms 內鍵盤的 Tab／方向鍵會落在母選單上，焦點也進不了子選單），
// 直接把縮放反算回去：origin 在縮放中不動，P_最終 = O + (P_目前 − O) / s
function menuRowFinalRect(row, menu) {
  const r = row.getBoundingClientRect();
  const cs = menu ? getComputedStyle(menu) : null;
  const s = cs ? parseFloat(cs.scale) : NaN;   // 'none' → NaN（沒有縮放）
  if (!Number.isFinite(s) || s <= 0 || Math.abs(s - 1) < 1e-4) return r;
  const m = menu.getBoundingClientRect();
  const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);   // 相對母選單自身（未縮放）的 px
  const Ox = m.left + s * ox;
  const Oy = m.top + s * oy;
  const top = Oy + (r.top - Oy) / s;
  const bottom = Oy + (r.bottom - Oy) / s;
  return { top, bottom, left: Ox + (r.left - Ox) / s, right: Ox + (r.right - Ox) / s, height: bottom - top };
}

function openLanguageSubmenu({ focusItem = false } = {}) {
  const { label, submenu } = languageSubmenuEls();
  if (!label || !submenu) return;
  // 依「語言」那一列定位（fixed，相對 viewport）：右側 8px、垂直置中；母選單縮放中也量最終位置（menuRowFinalRect）
  const rect = menuRowFinalRect(label, document.getElementById('settings-menu'));
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
    saveLocal({ uiLanguage: lang });
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

// ── 完成過渡動畫（撤銷窗 → 碎點爆＋原地出場＋FLIP 補位）狀態 ──
// 完成不再觸發整段重繪（見 finishComplete／finishCompleteWeek 的就地更新），所以 QA 分支的
// 「爆開後重繪 timer（`${id}:burst`）＋settleCompletion 批次收尾」在這裡不需要：每項的撤銷窗各自獨立跑滿（QA #16／#113 的症狀一併消失）
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
// 表單草稿（N2）：{ key, values } 或 null。✕／Esc 關掉時存起來，重開同一個視窗（同一 key，見 DueCustomAssignments.formDraftKey）
// 就還原；送出成功或按「取消」才丟掉。只放在記憶體（重新整理頁面就沒了）
let _customDraft = null;

function customFormEls() {
  return {
    overlay: document.getElementById('custom-assignment-overlay'),
    form: document.getElementById('custom-assignment-form'),
    courseSelect: document.getElementById('custom-assignment-course'),
    nameInput: document.getElementById('custom-assignment-name'),
    descInput: document.getElementById('custom-assignment-description'),
    dueInput: document.getElementById('custom-assignment-due'),
    errorEl: document.getElementById('custom-assignment-error'),
    titleEl: document.getElementById('custom-assignment-modal-title'),
  };
}

// 錯誤狀態（#38）：清掉欄位的 aria-invalid 與錯誤文字（開視窗、開始打字時）
function clearCustomFormError() {
  const { nameInput, dueInput, errorEl } = customFormEls();
  if (nameInput) nameInput.removeAttribute('aria-invalid');
  if (dueInput) dueInput.removeAttribute('aria-invalid');
  if (errorEl) errorEl.textContent = '';
}

function openCustomAssignmentModal(defaultCourseId = currentCourseId, editing = null) {
  const courses = _currentData.courses || [];
  if (!courses.length) return;

  const { overlay, form, courseSelect, nameInput, descInput, dueInput, titleEl } = customFormEls();
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

  // 草稿（N2）：重開同一個視窗 → 蓋回上次關掉時的內容；開的是別的（新增↔編輯、編輯別筆）→ 重新開始、舊草稿丟掉
  const key = DueCustomAssignments.formDraftKey(editing);
  const draft = DueCustomAssignments.draftValuesFor(_customDraft, key);
  if (draft) {
    if (courses.some((c) => String(c.id) === String(draft.courseId))) courseSelect.value = String(draft.courseId);
    nameInput.value = draft.name;
    descInput.value = draft.description;
    dueInput.value = draft.dueLocalValue;
  } else {
    _customDraft = null;
  }

  clearCustomFormError();
  overlay.classList.add('open');
  requestAnimationFrame(() => nameInput.focus());
}

// 關閉新增／編輯作業視窗。keepDraft（✕、Esc）：把已輸入的內容存成草稿，重開同一個視窗會還原（N2）；
// 取消、送出成功：丟掉草稿。背景點擊不再關閉（N2：誤觸背景就得重填）
function closeCustomAssignmentModal({ keepDraft = false } = {}) {
  const { overlay, courseSelect, nameInput, descInput, dueInput } = customFormEls();
  if (keepDraft && overlay && overlay.classList.contains('open') && nameInput) {
    _customDraft = {
      key: DueCustomAssignments.formDraftKey(_editingCustom),
      values: {
        courseId: courseSelect ? courseSelect.value : '',
        name: nameInput.value,
        description: descInput ? descInput.value : '',
        dueLocalValue: dueInput ? dueInput.value : '',
      },
    };
  } else if (!keepDraft) {
    _customDraft = null;
  }
  if (overlay) overlay.classList.remove('open');
  _editingCustom = null;   // 關閉/取消一律清掉編輯狀態（草稿自帶 key，重開時比對）
}

// 送出失敗（#38，field-error recipe）：錯誤文字寫進 role=alert（念出）、欄位 aria-invalid（轉紅框）、焦點回到欄位、
// 欄位搖一次「不」（shift.shake 3px，transition.shake；每次送出失敗搖一次，打字時不搖；減少動態不搖）
// code 依 DueCustomAssignments 的錯誤碼指向出錯的欄位（QA #161）：'invalid_due' → 截止日期欄（customDueInvalid）；其餘 → 名稱欄
const SHAKE_KEYFRAMES = [0, -3, 3, -2, 2, -1, 1, 0].map((x) => ({ transform: `translateX(${x}px)` }));
function showCustomFormError(code = 'name_required') {
  const { nameInput, dueInput, errorEl } = customFormEls();
  const isDue = code === 'invalid_due';
  const field = isDue ? dueInput : nameInput;
  const other = isDue ? nameInput : dueInput;
  if (other) other.removeAttribute('aria-invalid');   // 換了出錯的欄位：舊欄位的紅框退掉
  const msg = tr(isDue ? 'customDueInvalid' : 'customNameRequired');
  if (errorEl) {
    if (errorEl.textContent === msg) {
      // 同一句再寫一次 alert 不會重念：先清空、稍後再寫（與 announce() 同一招）
      errorEl.textContent = '';
      setTimeout(() => { if (field && field.getAttribute('aria-invalid') === 'true') errorEl.textContent = msg; }, 50);
    } else {
      errorEl.textContent = msg;
    }
  }
  if (!field) return;
  if (errorEl && errorEl.id && !field.hasAttribute('aria-describedby')) field.setAttribute('aria-describedby', errorEl.id);
  field.setAttribute('aria-invalid', 'true');
  field.focus();
  if (!reduceMotion()) field.animate(SHAKE_KEYFRAMES, MOTION.shake);
}

function saveCustomAssignmentFromForm(e) {
  e.preventDefault();
  const { courseSelect, nameInput, descInput, dueInput } = customFormEls();

  const input = {
    courseId: courseSelect.value,
    name: nameInput.value,
    description: descInput.value,
    dueLocalValue: dueInput.value,
  };

  // 重建前記下右欄捲動位置（重建會歸零），落地提示之前還原（#48）
  const savedScroll = captureListScroll();

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
      }, {
        optimistic: false,
        // 重建會拆掉 modal 剛把焦點還回去的那顆「編輯」→ 用 id 找回同一列的新按鈕（換了課程就不在這頁，退到清單標題）
        done: () => afterCustomSaved(updated.id, {
          savedScroll,
          refocus: [`.btn-edit-custom-assignment[data-assignment-id="${CSS.escape(String(updated.id))}"]`],
        }),
      });
    } else {
      // ── 新增：建立新筆並置於該課程陣列最前 ──
      const assignment = DueCustomAssignments.createCustomAssignment(input);
      const key = String(assignment.course_id);
      updateShared(['customAssignments'], (cur) => {
        const customAssignments = { ...(cur.customAssignments || {}) };
        customAssignments[key] = [assignment, ...(customAssignments[key] || [])];
        return { customAssignments };
      }, { optimistic: false, done: () => afterCustomSaved(assignment.id, { savedScroll }) });
    }
  } catch (err) {
    // 依錯誤種類指向正確欄位（日期打錯不能再顯示成「請輸入作業名稱」，QA #161）；呈現方式見 showCustomFormError（#38）
    showCustomFormError(err && err.code === 'invalid_due' ? 'invalid_due' : 'name_required');
  }
}

// 存檔寫入完成：關 modal（丟掉草稿）、以 _currentData 原地重繪（refreshView：不重讀 storage，保留已隱藏區開合等畫面狀態）；
// 重建後還原清單捲動、用 id 找回焦點（#8）、落點提示（#48）；若作業落在目前畫面看不到的地方，短 toast 告知去處（QA #162）
function afterCustomSaved(id, { savedScroll = null, refocus = [] } = {}) {
  closeCustomAssignmentModal();
  refreshView(() => {
    if (savedScroll) restoreListScroll(savedScroll);
    landCustomAssignment(id);
    showToast(customPlacementNote(findAssignment(id)));
    // 焦點等 modal 的歸還（setupModalA11y 的 MutationObserver，microtask）跑完再找：它要還的「編輯」鈕已被這次重繪拆掉，
    // 焦點會停在剛變 inert 的 modal 裡——refocusInDetail 把它當成「掉了」，交給重建後的同一顆（#8）
    if (refocus.length) setTimeout(() => refocusInDetail(refocus), 0);
  });
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

// ── 自訂作業的落地提示（#48，list recipe）──
// 重建後用 id 找到那一列（詳情：作業列；學期待辦：週卡），先捲進可視區（nearest），再在落點淡入＋上浮 8px
// （opacity transition.fade、transform --reflow）並閃一下底色；課程 grid 沒有逐列的落點，不提示。
// forced reflow 提交起點再清回 CSS 值（不用 rAF）；減少動態只淡入
function landCustomAssignment(id) {
  const cssId = CSS.escape(String(id));
  let row = null;
  if (currentView === 'course') {
    row = document.querySelector(`#course-detail-container .detail-assignments-list .assignment-item[data-hideable-id="${cssId}"]`);
  } else if (currentPage === 'week' && !showSubmitted) {
    row = document.querySelector(`#main-section .week-task-card[data-assignment-id="${cssId}"]`);
  }
  if (!row) return;
  row.scrollIntoView({ block: 'nearest' });
  row.style.transition = 'none';
  row.style.opacity = '0';
  if (!reduceMotion()) row.style.transform = 'translateY(8px)';
  row.getBoundingClientRect();
  row.style.transition = `${cssTransition('opacity', MOTION.fade)}, ${cssTransition('transform', MOTION.reflow)}`;
  row.style.opacity = '';
  row.style.transform = '';
  // 底色閃示只給詳情列（底色透明）：週卡有自己的 var(--bg) 底，閃示動畫跑完會一幀跳回原底色
  if (row.classList.contains('assignment-item')) row.classList.add('drag-arrived');
  setTimeout(() => {
    if (!row.isConnected) return;
    row.style.transition = '';
    row.classList.remove('drag-arrived');
  }, 900);
}

// 重建（loadData → innerHTML）會把清單的捲動位置歸零：重建前記下、重建後還原（#48）。
// 詳情：右欄（窄版面時是外層 .detail-card-bottom）；學期待辦：.week-right
const LIST_SCROLLERS = ['#course-detail-container .detail-right-panel', '#course-detail-container .detail-card-bottom', '#main-section .week-right'];
function captureListScroll() {
  return LIST_SCROLLERS.map((sel) => {
    const el = document.querySelector(sel);
    return el ? el.scrollTop : 0;
  });
}

function restoreListScroll(saved) {
  LIST_SCROLLERS.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (el && saved[i]) el.scrollTop = saved[i];
  });
}

function deleteCustomAssignment(courseId, assignmentId) {
  const id = String(assignmentId);
  const target = findAssignment(id);
  // 刪除後焦點交給鄰居（#8）：先記下這一列的下一列（沒有就上一列）的 id，重建後用 id 找回它的勾選圈
  const cssId = CSS.escape(id);
  const delBtn = document.querySelector(`#course-detail-container .btn-delete-custom-assignment[data-assignment-id="${cssId}"]`);
  const row = delBtn && delBtn.closest('.assignment-item');
  const rows = row ? [...row.parentElement.querySelectorAll('.assignment-item')] : [];
  const i = rows.indexOf(row);
  const neighbour = i >= 0 ? (rows[i + 1] || rows[i - 1]) : null;
  const neighbourChk = neighbour && neighbour.querySelector('.assignment-check');
  const neighbourSel = neighbourChk
    ? `.detail-assignments-list .assignment-check[data-assignment-id="${CSS.escape(neighbourChk.dataset.assignmentId)}"]`
    : null;
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
      }, {
        optimistic: false,
        // 刪除後空隙收合（#48）：重建前用 key 記下其他列的位置與捲動 → 原地重繪（refreshView）→ 還原捲動 → 下面的列從舊位置沿 --reflow 滑上來
        // （done 在寫入完成、重繪之前呼叫：此刻畫面上還是刪除前的清單）
        done: () => {
          const savedScroll = captureListScroll();
          const first = detailFlipSnapshot();
          // 焦點交給鄰居在 FLIP 之前：focus 可能把清單捲動一段，FLIP 要量捲完之後的位置，列才會從舊位置一路滑到最終位置
          refreshView(() => {
            restoreListScroll(savedScroll);
            refocusInDetail([neighbourSel]);
            detailFlipPlay(first);
          });
        },
      });
    },
  });
}

// 課程詳情整段重建前後的 FLIP（#48）：節點全換新，用 key 對應新舊（作業列＝id；標題、成績計算器、已隱藏區各一個）。
// 量的是含進行中 transform 的視覺位置，連刪兩筆時從目前位置接續（flipPlay 會先 cancel 進行中的 reflow，A12）
function detailFlipKeyed(root) {
  const out = new Map();
  if (!root) return out;
  root.querySelectorAll('.detail-right-panel > .grade-calc, .detail-assignments-label, .detail-assignments-list .assignment-item, .hidden-items')
    .forEach((el) => {
      const key = el.classList.contains('assignment-item') ? `row:${el.dataset.hideableId}` : el.className.split(' ')[0];
      out.set(key, el);
    });
  return out;
}

function detailFlipSnapshot() {
  const first = new Map();
  if (reduceMotion() || currentView !== 'course') return first;
  detailFlipKeyed(document.getElementById('course-detail-container'))
    .forEach((el, key) => first.set(key, el.getBoundingClientRect()));
  return first;
}

function detailFlipPlay(firstByKey) {
  if (!firstByKey.size || currentView !== 'course') return;
  const first = new Map();
  detailFlipKeyed(document.getElementById('course-detail-container')).forEach((el, key) => {
    if (firstByKey.has(key)) first.set(el, firstByKey.get(key));
  });
  flipPlay(first);
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

// ── 同步 skeleton（首次同步的載入佔位，見 spec 2026-07-23-sync-skeleton；#43）──
// 只在「無資料＋點同步」時渲染；成功後 render 在疊層底下畫好真內容再交叉淡換、失敗由 loadData 還原空狀態並淡掉疊層。
// 形狀跟著真的會換上來的那一頁走（判斷與 render() 相同，QA #195）：學期待辦＝進度環＋摘要列＋2 欄卡片條，其餘＝課程卡 grid
let _syncInFlight = false;   // 「同步」按鈕發出的 SYNC 尚未回應：期間 loadData 的空資料分支重畫 skeleton、不換成空狀態（QA #194）
function renderSyncSkeleton() {
  setHeaderMeta(tr('syncing'));

  // 側欄：4 列課名佔位（寬度略變化，避免整齊到假）
  document.getElementById('course-nav').innerHTML = [72, 58, 80, 64]
    .map((w) => `<div class="skel-nav-row" aria-hidden="true"><span class="skel" style="width:${w}%"></span></div>`)
    .join('');

  let html;
  if (currentPage === 'week' && !showSubmitted) {
    // 週頁形狀：用真的週頁版面 class，圓環（158px）、4 條摘要、組標題與 2 欄卡片條都落在真內容的位置
    const sums = [46, 54, 50, 62].map((w) => `
      <div class="skel-sum"><span class="skel skel-sum-n"></span><span class="skel skel-sum-l" style="width:${w}px"></span></div>`).join('');
    const wcard = () => `
      <div class="skel-wcard"><span class="skel skel-wcard-a"></span><span class="skel skel-wcard-b"></span><span class="skel skel-wcard-c"></span></div>`;
    html = `
      <div class="week-panel"><div class="week-content">
        <div class="week-left">
          <div class="wk-ring-wrap"><span class="skel skel-ring"></span></div>
          <div class="wk-breakdown">${sums}</div>
        </div>
        <div class="week-right">
          <div class="week-group"><span class="skel skel-group-title"></span>
            <div class="week-task-grid">${Array.from({ length: 4 }, wcard).join('')}</div>
          </div>
          <div class="week-divider"></div>
          <div class="week-group"><span class="skel skel-group-title"></span>
            <div class="week-task-grid">${Array.from({ length: 4 }, wcard).join('')}</div>
          </div>
        </div>
      </div></div>`;
  } else {
    // 課程卡 grid：6 張課程卡佔位（對齊 .course-card-grid 結構：code 短條、name 長條、2–3 列作業條）
    const card = (nameW, rows) => `
      <div class="course-card-grid skel-card">
        <div class="card-top">
          <span class="skel skel-code"></span>
          <span class="skel skel-name" style="width:${nameW}%"></span>
        </div>
        <div class="card-bottom">
          ${Array.from({ length: rows }, (_, i) => `<span class="skel skel-row" style="width:${88 - i * 14}%"></span>`).join('')}
        </div>
      </div>`;
    html = `<div class="courses-grid">${[[76, 3], [58, 2], [84, 3], [66, 2], [72, 3], [60, 2]]
      .map(([w, r]) => card(w, r)).join('')}</div>`;
  }

  // 疊層掛在 #main-section 的 parent（它的 innerHTML 會被真內容覆寫），對齊 #main-section 的 offset box；
  // 不用 inset:0——.main-content 還有 padding 與頁首（.page-tabs），inset:0 會蓋住頁首、skeleton 也會比內容高一截
  const main = document.getElementById('main-section');
  dismissSyncSkeleton({ instant: true });
  const overlay = document.createElement('div');
  overlay.className = 'sync-skeleton';
  overlay.id = 'sync-skeleton';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    top: `${main.offsetTop}px`, left: `${main.offsetLeft}px`,
    width: `${main.offsetWidth}px`, height: `${main.offsetHeight}px`,
  });
  overlay.innerHTML = html;
  main.parentElement.appendChild(overlay);
}

// skeleton 疊層離場：forced reflow 提交目前的不透明度，再淡出（transition.fade），transitionend 移除（保底 timeout：背景分頁）
function dismissSyncSkeleton({ instant = false } = {}) {
  const overlay = document.getElementById('sync-skeleton');
  if (!overlay) return false;
  overlay.removeAttribute('id');   // 進行中的淡出不再被當成「目前的 skeleton」
  if (instant) { overlay.remove(); return true; }
  overlay.getBoundingClientRect();
  overlay.style.opacity = '0';
  const done = () => overlay.remove();
  overlay.addEventListener('transitionend', (e) => { if (e.target === overlay) done(); });
  setTimeout(done, MOTION.fade.duration + 100);
  return true;
}

// 新內容從 blur.surface 清晰（transition.reveal，不位移）：先 inline 釘在起點、forced reflow、再清回 CSS 值（不靠 rAF）
function revealFromBlur(els) {
  els.forEach((el) => {
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.filter = 'var(--blur-surface)';
  });
  if (!els.length) return;
  els[0].getBoundingClientRect();
  const t = `${cssTransition('opacity', MOTION.reveal)}, ${cssTransition('filter', MOTION.reveal)}`;
  els.forEach((el) => {
    el.style.transition = t;
    el.style.opacity = '';
    el.style.filter = '';
  });
  setTimeout(() => els.forEach((el) => { if (!el.style.opacity) el.style.transition = ''; }), MOTION.reveal.duration + 50);
}

// 由「已繳交」切換觸發的下一次 render：新畫面淡入（#32）
let _fadeNextRender = false;

// ── 主要渲染 ──
function render(data) {
  // skeleton → 真資料（#43）：疊層還蓋著時在底下畫好真內容，接著疊層淡出、內容同時清晰，中間沒有空白幀
  const arriving = !!document.getElementById('sync-skeleton');
  const fadeIn = _fadeNextRender;
  _fadeNextRender = false;

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

  const shown = currentView === 'course'
    ? document.getElementById('course-detail-container')
    : document.getElementById('main-section');
  if (arriving) {
    // 首次同步：skeleton 淡出（transition.fade）與真內容從模糊清晰（transition.reveal）交疊；側欄課程列同一個進場
    dismissSyncSkeleton();
    revealFromBlur([...shown.children, ...document.getElementById('course-nav').children]);
  } else if (fadeIn) {
    // 「已繳交」切換（#32）：待辦與已完成兩組沒有交集、沒有東西能滑到新位置 → 新畫面只做一個短淡入（transition.fade），
    // 不位移、不 stagger；WAAPI 不靠 rAF 觸發，不設 fill，跑完就是最終狀態。
    // 在課程詳情裡切換時，換掉的是作業清單（課名、圓餅、成績計算器不變，標頭只換一行件數字）→ 只淡入清單，整頁不閃一下
    const targets = currentView === 'course'
      ? [...shown.querySelectorAll('.detail-assignments-list')]
      : [...shown.children];
    targets.forEach((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], MOTION.fade));
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

  navEl.innerHTML = sorted.map((c) => navCourseItemHtml(c, assignments)).join('');
  navEl.querySelectorAll('.nav-course-item').forEach(bindNavCourseItem);
  syncNavNameTitles(navEl);

  if (focusedCourse) {
    const again = navEl.querySelector(`.nav-course-item[data-target-course="${focusedCourse}"]`);
    if (again) again.focus({ preventScroll: true });
  }
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
  // 撤銷窗內的項目仍算待辦（isDoneLanded，與 applyFilters 一致；#12）
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
  abortActiveDrag();   // 導覽離開前中止進行中的拖曳（QA #198）
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

// 頁面切換的淡入還在跑 → 立即結束（cancel 即落在最終狀態：動畫沒有 fill）。導覽入口（goToPage／已繳交切換／進詳情／popstate）
// 先呼叫它再換畫面。這版切換不包 slider、沒有收尾 timer，QA #192／#199 的 slider 問題（巢狀 slider、收尾 timer 晚到重畫）不存在
function settlePageSwitch() {
  if (_pageAnim) { _pageAnim.cancel(); _pageAnim = null; }
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
  // 環的範圍不是「本週」：逾期窗（30 天）∪ 未來 7 天 → 標「近期完成」，範圍寫進 aria-label 與 title（QA #14）
  const ringAria = `${tr('weekDoneLabel')} ${nearDone}/${nearTotal} · ${tr('weekRingScope')}`;
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
    const done = isDone(a);                            // 週視圖恆為 false，仍寫入以保勾選圈狀態一致
    const checkLabel = done ? tr('markUndone') : tr('markDone');
    return `
      <div class="week-task-card" role="button" tabindex="0" aria-label="${esc(getCourseName(a._course) + ' · ' + a.name)}" data-course-id="${a._course.id}" data-assignment-id="${esc(String(a.id))}">
        <button class="assignment-check week-task-check" data-assignment-id="${esc(String(a.id))}" data-course-id="${a._course.id}" data-done="${done ? 'true' : 'false'}" aria-label="${esc(checkLabel)}"></button>
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

  // 「全部完成」慶祝不在整段重繪裡判斷：只在最後一項近期作業落地時由 updateWeekRing 依「上次顯示的分子 → 這次」的
  // 狀態轉移觸發——全部完成後再勾非近期項不重播（QA #193），最後兩項先後勾也只在後落地的那一項播一次（QA #201）

  // 勾選圈：依畫面顯示的狀態翻轉（data-done，寫哪張 map 由 setDone 依當下外部事實決定），
  // 未完成→完成走 1.5 秒撤銷窗口動畫（stopPropagation 不開詳情）
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
  const current = Math.min(cardPages[cardPageKey(courseId)] || 0, totalPages - 1);
  const next = Math.max(0, Math.min(totalPages - 1, current + dir));
  if (next === current) return;
  cardPages[cardPageKey(courseId)] = next;

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
  // 換內容不換位置（#31，swap recipe）：高度由 CSS 的 min-height 保住；新的列從透明＋2px 模糊原地清晰
  // （transition.swap＋blur.icon），沒有位移。forced reflow 提交起點再清回 CSS 值，不用 rAF
  rowsEl.style.transition = 'none';
  rowsEl.style.opacity = '0';
  rowsEl.style.filter = 'var(--blur-swap)';
  rowsEl.getBoundingClientRect();
  rowsEl.style.transition = `${cssTransition('opacity', MOTION.swap)}, ${cssTransition('filter', MOTION.swap)}`;
  rowsEl.style.opacity = '';
  rowsEl.style.filter = '';
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
// 整段 VT 被 skip（InvalidStateError）、硬切。先清掉再命名；與 startViewTransition 同一個 task，中間不會畫出任何一幀。
// 不只看 _morph：被中斷而沒清到的殘留名字一樣會讓新的一段中止（QA 分支的 _clearMorphNames 同理），一律清
function clearStaleMorphNames() {
  clearMorphNames();
}
function startMorph(update) {
  const t = document.startViewTransition(update);
  _morph = t;
  t.ready.catch(() => {});   // 被下一段 skip 時 ready 會 reject（AbortError），屬預期，不要變成未處理的 rejection
  const cleanup = () => {
    if (_morph !== t) return;   // 已被下一段接手，名字交給它管
    _morph = null;
    clearMorphNames();
  };
  t.finished.then(cleanup, cleanup);   // update callback 丟錯時 finished 會 reject：名字照樣要清
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

// ── 課程 morph（View Transition）的導覽狀態（QA #197）──
// 導覽狀態（currentView／currentCourseId）一律在呼叫當下同步設好，VT callback 只負責畫；callback 晚到時
// 若狀態已被後來的導覽改掉（連點兩門課、morph 中途按 Back／點側欄）就什麼都不做，交給後來的導覽。
// 進行中的那一段記在 _morph（startMorph），名字的清理也由它負責（見上方 #42）

// 跳過進行中的 morph（不走 VT 的導覽用：goToPage、無 morph 的直接切換、popstate、側欄點課——舊動畫不再蓋在新畫面上）。
// 被跳過的那段 update callback 仍會執行，但會因導覽狀態不符而略過；名字在它的 finished 清（startMorph），已被下一段接手就交給下一段
function _skipMorph() {
  if (!_morph) return;
  try { _morph.skipTransition(); } catch (_) { /* 已結束 */ }
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

  rememberDetailOrigin(courseId, cardEl);   // 必須在 currentView 改成 'course' 之前（據此判斷是否從清單離開）

  // 導覽狀態同步設好（不等 VT callback）：第二次呼叫才會正確判斷成 replace、Back 才回得到清單（QA #197）
  currentView = 'course';
  currentCourseId = courseId;
  settlePageSwitch();   // 頁面切換的淡入還在跑：直接落定，再換成詳情

  const detailContainer = document.getElementById('course-detail-container');
  const update = () => {
    // 等待期間已導覽到別處（換課／回清單／切頁）→ 畫面交給後來的導覽
    if (currentView !== 'course' || currentCourseId !== courseId) return false;

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
    updateSideNav();   // 進詳情：學期待辦／課程熄燈、頂部計數同步刷新（QA #202/#186）
    renderCourseDetailSection(course, assignments[course.id] || [], assignmentGroups[course.id] || [], scores);
    focusDetailHeading(detailContainer);
    return true;
  };

  // 没有卡片元素（側欄、popstate 前進）或不支持 View Transitions 时：直接切換，無 morph；進行中的 morph 跳過（QA #197）。
  // 減少動態仍走 VT：setMorphName 不命名，只剩 root 的 opacity crossfade（#0）
  if (!cardEl || !document.startViewTransition) {
    _skipMorph();
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
  abortActiveDrag();   // 拖曳中按 Back：中止拖曳，clone 不漂到清單上、放開也不寫入（QA #198）
  const prevCourseId = currentCourseId;
  const origin = _detailOrigin;
  _detailOrigin = null;
  // 導覽狀態同步設好（同 showCourseDetail，QA #197）
  currentView = 'grid';
  currentCourseId = null;
  const detailContainer = document.getElementById('course-detail-container');

  // 切回清單並以 _currentData 同步重繪（VT callback 與無 morph 的路徑共用）
  const update = () => {
    if (currentView !== 'grid') return;   // 等待期間又進了詳情 → 交給後來的導覽

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

  // 不支援 View Transitions：直接切換，無 morph；進行中的 morph 跳過（QA #197）。減少動態仍走 VT（不命名，只 crossfade，#0）
  if (!document.startViewTransition) {
    _skipMorph();
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
    positionRenameBtn(span.closest('.detail-card-top'));   // 名稱長短／換行變了 → 鉛筆跟到新尾端（#34／QA #167）
  };

  // 焦點（#8）：輸入框被換回 span 時焦點會掉到 <body> → 只有 Enter／Escape 收尾時還給鉛筆；
  // blur 觸發的 commit 不動焦點（使用者已經 Tab 或點去別處，不要搶回來）
  const refocusPencil = () => {
    if (renameBtn && renameBtn.isConnected) renameBtn.focus({ preventScroll: true });
  };

  let committed = false;
  const commit = ({ refocus = false } = {}) => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    const displayName = newName || (course ? course.name : '');
    restore(displayName);
    if (refocus) refocusPencil();

    persistCourseName(courseId, newName, course);
    // 側欄只就地換這一課的名字，不整段 renderNav：失焦提交發生在側欄按鈕的 mousedown，
    // 整段重建會讓隨後的 click 落到新按鈕上而被吞掉、切不了課（QA #166）；Tab 到側欄項的焦點也因此不會被拆掉（#8）
    setNavCourseNameText(courseId, displayName);
  };

  const cancel = ({ refocus = false } = {}) => {
    if (committed) return;
    committed = true;
    restore(currentName);
    if (refocus) refocusPencil();
  };

  input.addEventListener('keydown', (e) => {
    if (isImeComposing(e)) return;   // 注音／拼音組字中按 Enter 是選字、Esc 是取消組字，不提交（QA P2-14）
    // preventDefault：焦點在 keydown 裡換到鉛筆按鈕，不擋的話這次 Enter 的 keypress 會落在鉛筆上、又把改名打開
    if (e.key === 'Enter') { e.preventDefault(); commit({ refocus: true }); }
    if (e.key === 'Escape') { e.preventDefault(); cancel({ refocus: true }); }
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

// 課程詳情標題旁的鉛筆：absolute 定位緊貼課名「最後一行」的尾端（CSS 做不到：.detail-name 的寬度不等於文字寬度）。
// 不能改成 inline（View Transition 量到的標題高度會變、morph 跳動，見 CLAUDE.md）；
// 用 getClientRects 取最後一個 line box，換行的長名也對得準。渲染詳情、改名收尾、側欄改名同步詳情標題、
// hover／focusin（字體載入／視窗寬度變了）時都重算——只算一次的話改短會空一大段、改長會蓋到字（#34／QA #167）。
// root（選用）：詳情容器或其中的 .detail-card-top；省略或傳入事件物件（mouseenter／focusin 直接綁）時找 #course-detail-container
function positionRenameBtn(root) {
  const scope = (root && typeof root.querySelector === 'function') ? root : document.getElementById('course-detail-container');
  const nameEl = scope && scope.querySelector('.detail-name');
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
  // 失焦提交發生在別課按鈕的 mousedown，整段重建會吞掉隨後的 click（QA #166）；Tab 到下一個側欄項的焦點也不會被拆掉（#8）。
  // refocus（#8）：只有 Enter／Escape 收尾時把焦點放回換回來的這一課按鈕；blur 觸發的不動焦點
  const restoreItem = (refocus = false) => {
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
    if (refocus) btn.focus({ preventScroll: true });
  };

  let committed = false;
  const commit = ({ refocus = false } = {}) => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    const displayName = newName || (course ? course.name : '');
    persistCourseName(courseId, newName, course);
    restoreItem(refocus);
    // 若右側正顯示同一課，順手同步詳情標題（只改文字、不整段重繪，避免打斷成績計算器/捲動）
    if (currentView === 'course' && currentCourseId === courseId) {
      const dName = document.querySelector('#course-detail-container .detail-name-text');
      if (dName) dName.textContent = displayName;
      positionRenameBtn();   // 鉛筆跟著新名字（#34）
    }
  };

  const cancel = ({ refocus = false } = {}) => {
    if (committed) return;
    committed = true;
    restoreItem(refocus);   // 還原原本按鈕（不寫入）
  };

  input.addEventListener('keydown', (e) => {
    if (isImeComposing(e)) return;   // 組字中的 Enter／Esc 交給輸入法（QA P2-14）
    // preventDefault：焦點換到側欄項按鈕後，這次 Enter 的 keypress 不會落在它身上而打開課程詳情
    if (e.key === 'Enter') { e.preventDefault(); commit({ refocus: true }); }
    if (e.key === 'Escape') { e.preventDefault(); cancel({ refocus: true }); }
  });
  input.addEventListener('blur', () => commitOnBlur(input, () => committed, () => { committed = true; }, commit));
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
  // 只在仍停留於該課詳情時重繪詳情：延遲 callback（碎點爆後重繪等）觸發時使用者可能已換課／離開，
  // 不能把舊課程畫回容器（QA #113）
  if (course && currentView === 'course' && currentCourseId === cid) {
    // 保留成績計算器、已隱藏區、展開的描述與捲動（勾選完成、拖曳都走這裡，整段重繪會把它們收起）
    const st = captureViewState();
    renderCourseDetailSection(course, assignments[cid] || [], assignmentGroups[cid] || [], scores);
    restoreViewState(st);
  }
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
    // important：倒數條是撤銷窗口的計時資訊（期限 meter，不算位移），減少動態效果時也要保留——
    // 不讓任何壓成瞬間的 reduced-motion 規則把它吃掉（QA #138；#0 的 CSS 本來就保留它）
    bar.style.setProperty('animation', `complete-countdown ${COMPLETE_DELAY_MS / 1000}s linear forwards`, 'important');
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

function cancelComplete(item, id, cid) {
  if (_completeTimers[id]) { clearTimeout(_completeTimers[id]); delete _completeTimers[id]; }
  revertCompletion(id, cid);   // 經 DueCompletion.setDone 寫回未完成（依當下外部事實決定用哪張 map，QA P1-4）
  unmarkCompleting(item);   // 就地還原（不整段重繪，其他撤銷窗照跑）
}

// ── 週卡片完成過渡（平行於 assignment-item 版；共用撤銷窗視覺、出場層、FLIP、碎點）──
function rerenderWeekAndNav() {
  const { courses = [], assignments = {} } = _currentData;
  // 只在仍停留於週待辦版面時重繪週 section（呼叫時可能已切頁／進詳情，不能把週版面畫回來，QA #113）
  if (currentView === 'grid' && currentPage === 'week' && !showSubmitted) {
    renderWeekSection(courses, assignments);
  }
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

function cancelCompleteWeek(card, id, cid) {
  if (_completeTimers[id]) { clearTimeout(_completeTimers[id]); delete _completeTimers[id]; }
  revertCompletion(id, cid);   // 經 DueCompletion.setDone 寫回未完成（QA P1-4）
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
  // 與整段渲染同一格式：範圍寫進 aria-label（「近期」＝30 天內逾期＋未來 7 天，QA #14）
  ring.setAttribute('aria-label', `${tr('weekDoneLabel')} ${nearDone}/${nearTotal} · ${tr('weekRingScope')}`);
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

  // 鉛筆緊貼課名尾端（absolute，不能純 CSS：block 寬 ≠ 文字寬）；hover／鍵盤聚焦時重算——
  // 字體晚到、視窗寬度變了會讓換行位置改變（QA #167）
  positionRenameBtn(el);
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
        cancelComplete(item, id, cid);
        return;
      }
      // 以畫面顯示的狀態翻轉；兩張 map 由 DueCompletion.setDone 依當下外部事實決定（樂觀更新，避免閃白）
      toggleCompletion(id, cid, btn.dataset.done === 'true');
      const a = findAssignment(id, cid);
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
// 放開命中則寫入 manualShown/manualHidden 重繪，clone 飛入重繪後的實際落點（清單依 due 排序）；未命中/Esc 飛回原位。
// 鍵盤（grip 是 <button>，#6）走同一條 commitDrag → settleClone。
// 導覽離開（showGridView／goToPage／switchPage／showCourseDetail／popstate）一律先 abortActiveDrag。
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
    courseId: currentCourseId,                                   // 與滑鼠拖曳同：寫入綁定這一刻的課程（QA #205）
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

// 浮動 clone（拖曳與鍵盤移動共用）：疊在原列的位置；複本裡的勾選圈／握把是假的，
// inert＋aria-hidden 讓 Tab 與螢幕閱讀器碰不到（#6）。
// 拿起時字不動（#41）：clone 左右各多 14px 的 padding（.drag-clone），所以往左挪 14px、加寬 28px，
// 內容區與原列完全重合（同寬、截斷點不變）；上下沿用列本身的 padding，top／height 照原列
const DRAG_CLONE_PAD_X = 14;
function makeDragClone(ctx) {
  const rect = ctx.row.getBoundingClientRect();
  ctx.base = rect;
  const clone = ctx.row.cloneNode(true);
  clone.classList.add('drag-clone');
  clone.inert = true;
  clone.setAttribute('aria-hidden', 'true');
  clone.style.width = rect.width + DRAG_CLONE_PAD_X * 2 + 'px';
  clone.style.height = rect.height + 'px';
  // 原列的底線（作業列／稽核列 1px，最後一列 0）換成等寬的透明邊：內容區高度與原列一樣，置中的字不會差半個 px
  // （外框細線改由 .drag-clone 的 box-shadow 畫；背景鋪到 border 底下，看不出來）
  clone.style.borderBottom = `${getComputedStyle(ctx.row).borderBottomWidth} solid transparent`;
  clone.style.left = rect.left - DRAG_CLONE_PAD_X + 'px';
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
// 焦點：鍵盤移動、或焦點本來就在被移動的那一列（例如先 Tab 到這一列、再用滑鼠拖；pointerdown 有 preventDefault，
// 單純滑鼠按握把不會把焦點給它），重繪會把它拆掉 →
// 交給落地那一列的握把（該項落到另一個完成桶、兩區都看不到時交給同區的鄰居，再沒有就交給該區的標題），並播報結果（#6）
function commitDrag(ctx, { viaKeyboard = false } = {}) {
  const savedScroll = ctx.zones.scroller ? ctx.zones.scroller.scrollTop : 0;
  const hiddenWasOpen = !!(ctx.zones.hidden && ctx.zones.hidden.classList.contains('open'));
  const keepFocus = viaKeyboard || ctx.row.contains(document.activeElement);
  const item = ((_currentData.assignments || {})[ctx.courseId] || []).find((x) => String(x.id) === String(ctx.id));
  const name = item ? item.name : (ctx.row.querySelector('.assignment-title, .hidden-item-title')?.textContent || '').trim();
  // 寫入綁定拖曳開始時的課程（ctx.courseId，QA #205）
  setItemHiddenByDrag(ctx.id, ctx.dir === 'demote', ctx.courseId);

  const container = document.getElementById('course-detail-container');
  const scroller = container.querySelector('.detail-right-panel');
  // 稽核區開合：降級後強制展開（讓使用者看到落點）；升級則維持拖曳前狀態。
  // 新節點直接到位、不重播展開（instant）：重繪前畫面上它本來就開著（拖曳前開著，或降級拖曳中 .drop-active 已把它展開）；
  // 鍵盤降級、原本收著的情況也直接打開——落點列要在這一幀就有最終位置，scrollIntoView 與 clone 的飛行才量得對
  // （高度還在 0 時，清單裡的列被 overflow:clip 裁掉、不算進捲動範圍，捲不到落點）
  const hidden = container.querySelector('.hidden-items');
  if (hidden && (hiddenWasOpen || ctx.dir === 'demote')) setHiddenItemsOpen(hidden, true, { instant: true });
  // 重繪會重置捲動位置 → 還原；在展開之後：先還原的話，收著的新清單會把 scrollTop 夾小
  if (scroller) scroller.scrollTop = savedScroll;

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
  if (keepFocus) focusAfterMove(container, landed, ctx.dir);
  announce(tr(ctx.dir === 'promote' ? 'a11yMovedToList' : 'a11yMovedToHidden').replace('{name}', name));
  settleClone(ctx, landed, { flash: true });
}

// 移動後的焦點落點：落地列的握把 → 同區最近一列有握把的（落點不在目前視圖時，QA #178）→ 該區的標題／開關
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

// clone 飛入 targetRow 的位置後移除；落地後亮一下（flash）。
// 只飛位置（#41，A8）：transform 走 --reflow，clone 的寬高不動；快到時 clone 淡出、落地列同時淡入（各 200ms ease.out，
// 從 150ms 起交疊），兩種形狀（稽核列 ↔ 作業列）用 crossfade 銜接，不在最後一幀硬切成另一個形狀的列。
// 取消（targetRow＝原列）時原列從殘影的 0.3 淡回，而不是從 0。減少動態：不飛行，原地交叉淡換（#0）
const DRAG_CROSSFADE_DELAY_MS = 150;
function settleClone(ctx, targetRow, { flash = true, after = null } = {}) {
  const clone = ctx.clone;
  let to = null;
  if (targetRow && targetRow.isConnected) {
    targetRow.scrollIntoView({ block: 'nearest' });
    to = targetRow.getBoundingClientRect();
  }
  const visible = !!to && !!(to.width || to.height);
  const fly = visible && !reduceMotion();
  const delay = fly ? DRAG_CROSSFADE_DELAY_MS : 0;
  const finish = () => {
    clone.remove();
    if (targetRow && targetRow.isConnected) {
      targetRow.style.transition = '';
      if (flash) {
        targetRow.classList.add('drag-arrived');
        setTimeout(() => targetRow.classList.remove('drag-arrived'), 900);
      }
    }
    if (after) after();
  };

  // 落地列：inline opacity 釘在起點（原列殘影 0.3／新列 0）→ forced reflow → 清回 CSS 值，同一條 ease.out 淡入
  if (visible) {
    const from = targetRow.classList.contains('drag-source') ? '0.3' : '0';
    targetRow.classList.remove('drag-source');
    targetRow.style.transition = 'none';
    targetRow.style.opacity = from;
    targetRow.getBoundingClientRect();
    targetRow.style.transition = `opacity ${MOTION.fade.duration}ms ${MOTION.fade.easing} ${delay}ms`;
    targetRow.style.opacity = '';
  }
  if (fly) {
    clone.style.transition = cssTransition('transform', MOTION.reflow);
    clone.style.transform = `translate(${to.left - ctx.base.left}px, ${to.top - ctx.base.top}px)`;
  }
  // clone 淡出（落點不存在/不可見，如已繳交過濾 → 原地淡出）；WAAPI 不靠 rAF
  clone.animate([{ opacity: 1 }, { opacity: 0 }],
    { duration: MOTION.fade.duration, delay, easing: MOTION.fade.easing, fill: 'forwards' });
  setTimeout(finish, Math.max(fly ? DRAG_SETTLE_MS : 0, delay + MOTION.fade.duration) + 30);
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
// 鍵盤使用者要靠它知道裡面的列現在 Tab 得到（#6）。
// instant：重繪後還原「畫面上本來就開著」的清單（拖曳中 .drop-active 已把它展開、或拖曳前就開著）——
// 新節點從 height 0 起算，不跳過過渡的話整段清單會在落點前重新長一次，落點也會量在展開途中（#28／#41）
function setHiddenItemsOpen(wrap, open, { instant = false } = {}) {
  const list = instant ? wrap.querySelector('.hidden-items-list') : null;
  const arrow = instant ? wrap.querySelector('.hidden-items-arrow') : null;
  if (list) list.style.transition = 'none';
  if (arrow) arrow.style.transition = 'none';
  wrap.classList.toggle('open', open);
  if (list || arrow) {
    wrap.getBoundingClientRect();   // forced reflow：在 transition:none 下提交終點，再還原 CSS 的過渡
    if (list) list.style.transition = '';
    if (arrow) arrow.style.transition = '';
  }
  const btn = wrap.querySelector('.hidden-items-toggle');
  if (btn) btn.setAttribute('aria-expanded', String(open));
}

// 展開面板的 chevron（已隱藏清單、成績計算器共用，#28）
const DISCLOSURE_CHEVRON = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

// ── 已隱藏區（精簡列；不顯示任何分數，見決策 3）──
// 跟隨作業清單的完成過濾（spec 2026-10-23 hidden-section-follows-filter，取代 7/22 same-bucket 鎖定列）：
// 待辦視圖只列未完成的隱藏項、已繳交視圖只列已完成的；列出的每一列都有握把可拖——看得到就能移（鍵盤同，#6）。
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
          <div class="hidden-item-title">${titleHtml}${dragGripHtml('promote')}</div>
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
      <button class="hidden-items-toggle" data-course-id="${courseId}" aria-expanded="false" aria-controls="hidden-items-list-${courseId}">
        <span class="hidden-items-arrow">${DISCLOSURE_CHEVRON}</span>
        <span class="hidden-items-label">${esc(tr('hiddenItemsToggle').replace('{n}', inView.length))}${otherNote}</span>
      </button>
      <div class="hidden-items-list" id="hidden-items-list-${courseId}"><div class="hidden-items-list-inner">${listInner}</div></div>
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
          <div class="detail-pie-legend">${legend}</div>
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
        <div class="detail-pie-legend">${legend}</div>
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

  // 標頭補上與「已隱藏 N 項」同一顆 chevron（#28）：開著轉 90°，一看就知道是開是關；
  // padding 放在 .grade-calc-body-inner，外層 height:0 才收得乾淨（開合見 index.html「展開面板」）
  return `
    <div class="grade-calc">
      <div class="grade-calc-header">
        <span class="grade-calc-head">
          <span class="grade-calc-arrow" aria-hidden="true">${DISCLOSURE_CHEVRON}</span>
          <span class="grade-calc-title">${tr('gradeCalcTitle')}</span>
        </span>
        <span class="grade-calc-final-display" id="final-grade-${course.id}">—</span>
      </div>
      <div class="grade-calc-body">
        <div class="grade-calc-body-inner">
          ${groupRows}
        </div>
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
  // 描述開關（#7）：整列點擊展開描述，但列不可聚焦（裡面有勾選圈、握把、編輯/刪除，設成 role=button 會巢狀互動元件）→
  // 在左欄放一顆透明、不吃指標事件的 <button> 蓋滿左欄：鍵盤 Tab 停得到，Enter／Space 的 click 冒泡到列，走同一個開關；
  // 焦點框畫在左欄外緣。aria-expanded 由 toggleAssignmentDesc 同步，aria-controls 指向下方的描述
  const descId = `desc-${esc(String(a.id))}`;

  // ── 完成勾選圈：一律可雙向切換；寫入由 DueCompletion.setDone 依點擊當下的外部事實決定（見 completion.js）──
  const checkLabel = done ? tr('markUndone') : tr('markDone');
  const checkHtml = `<button class="assignment-check" data-assignment-id="${esc(String(a.id))}" data-course-id="${courseId}" data-done="${done ? 'true' : 'false'}" aria-label="${esc(checkLabel)}"${submitted ? ` title="${esc(tr('submittedBadge'))}"` : ''}></button>`;

  // 不在列上顯示分數（含升級回清單、Canvas 已評分的考試）：分數只出現在成績計算器（決策 3）

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
        ${submitted ? `<div class="submitted-badge">${tr('submittedBadge')}</div>` : ''}
        ${isCustom ? customActionsHtml(a, courseId) : ''}
      </div>
    </div>
    <div class="assignment-desc" id="${descId}">
      <div class="assignment-desc-inner${isCustom && descBody.trim() ? ' is-plain' : ''}">${descInner}</div>
    </div>`;
}

document.getElementById('btn-add-assignment')?.addEventListener('click', () => {
  openCustomAssignmentModal();
});
// 關閉路徑（N2）：✕ 與 Esc 保留草稿、「取消」丟掉草稿；點背景不關閉（誤觸背景不該讓已輸入的內容消失）——
// 比 QA P2-9 的「按下與放開都在背景才關」更嚴，拖曳選字放到背景自然也不會關
document.getElementById('custom-assignment-close')?.addEventListener('click', () => closeCustomAssignmentModal({ keepDraft: true }));
document.getElementById('custom-assignment-cancel')?.addEventListener('click', () => closeCustomAssignmentModal());
// ── 點背景關閉 modal：按下（pointerdown）、放開（pointerup）與 click 都落在背景本身才算 ──
// 按下與放開落在不同元素時，click 會派發到兩者的共同祖先 overlay（target 也是 overlay）：
// 在對話框內按下、拖曳選字到背景放開，或反過來在背景按下、拖進對話框才放開，只看 click 都會把 modal
// 連同未存的輸入一起關掉（QA P2-9）。點背景仍會關閉的 overlay（確認／教學）共用；新增作業／權重不吃背景點擊（N2）
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

document.getElementById('custom-assignment-form')?.addEventListener('submit', saveCustomAssignmentFromForm);
// 開始打字就清掉送出失敗的狀態（#38）：紅框退回一般焦點框、錯誤文字消失；只在送出時搖，打字不搖
// 名稱與截止日期兩欄都可能是出錯的欄位（QA #161 的 invalid_due 指向截止日期欄）
['custom-assignment-name', 'custom-assignment-due'].forEach((fieldId) => {
  document.getElementById(fieldId)?.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') clearCustomFormError();
  });
});

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
    _detailOrigin = null;   // 不是 Back：不還原來源卡的焦點與捲動
    syncHistory();   // 由詳情經 sidebar 離開：把目前 entry 更新為目標清單
    loadData();
    return;
  }
  // 若正在看「已繳交」，關閉後回到目標頁：與「已繳交」切換同一套（側欄當幀亮起、新畫面淡入，#32）
  if (showSubmitted) {
    settlePageSwitch();
    showSubmitted = false;
    currentPage = page;
    updateSideNav();
    syncHistory();
    _fadeNextRender = true;
    loadData();
    return;
  }
  switchPage(page);
}
document.getElementById('nav-week').addEventListener('click', () => goToPage('week'));
document.getElementById('nav-courses').addEventListener('click', () => goToPage('courses'));

// ── ← 返回：走 history.back()，與瀏覽器返回（手勢／按鈕／Cmd+[）統一由 popstate 處理 ──
// 按鈕是 index.html 的靜態節點（常駐於 .page-tabs），只在這裡綁一次：renderCourseDetailSection 會被勾選、拖曳與即時刷新反覆呼叫，
// 綁在裡面會累積 listener，一次點擊連發多個 history.back()、退過清單那一步直接退出 dashboard（QA P1-8）
document.getElementById('detail-back-btn').addEventListener('click', () => history.back());

// ── 查看已繳交（切換過濾） ──
document.getElementById('nav-submitted').addEventListener('click', () => {
  showSubmitted = !showSubmitted;
  settlePageSwitch();   // 頁面切換的淡入還在跑：直接落定，再換成「已繳交」該有的版面
  // 按下的那一幀就亮起（#32，A5）：updateSideNav 只讀 _currentData，不必等 storage 讀完；新畫面到了再淡入
  updateSideNav();
  syncHistory();   // 「已繳交」為過濾切換：更新目前 entry，不疊返回步
  // 課程詳情內切換：以 _currentData 同步重繪（rerenderDetailAndNav 內含 captureViewState／restoreViewState），
  // 保留已隱藏區開合與右欄捲動位置（QA #78）。換掉的只有作業清單與已隱藏區（兩者都跟著完成過濾）→ 只淡入這兩塊（#32）
  if (currentView === 'course' && (_currentData.courses || []).length) {
    rerenderDetailAndNav(currentCourseId);
    document.querySelectorAll('#course-detail-container .detail-assignments-list, #course-detail-container .hidden-items')
      .forEach((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], MOTION.fade));
    return;
  }
  _fadeNextRender = true;
  loadData();
});

// ── 同步按鈕（#30）──
// 狀態顯示在觸發它的地方：閒置 →（三點）→「✓ 已同步」停 1.5 秒／「同步失敗」停 2.5 秒 → 閒置。
// 四個標籤一開始就疊在同一格（index.html .sync-swap），換狀態只改 data-status，CSS 原地模糊淡換；結果同時念出（#3）
const SYNC_DONE_MS = 1500;
const SYNC_ERROR_MS = 2500;
let _syncStatusTimer = 0;
function setSyncStatus(btn, status) {
  clearTimeout(_syncStatusTimer);
  btn.dataset.status = status;
  btn.classList.toggle('sync-error', status === 'error');
  btn.disabled = status === 'loading' || status === 'error';
  if (status === 'done' || status === 'error') {
    _syncStatusTimer = setTimeout(() => setSyncStatus(btn, 'idle'), status === 'done' ? SYNC_DONE_MS : SYNC_ERROR_MS);
  }
}

document.getElementById('sync-btn').addEventListener('click', () => {
  const btn = document.getElementById('sync-btn');
  if (btn.dataset.status === 'loading') return;
  setSyncStatus(btn, 'loading');
  _syncInFlight = true;   // 期間 loadData 的空資料分支維持 skeleton（QA #194）
  // 首次同步（無資料）→ 渲染 skeleton 佔位；已有資料則維持靜默背景刷新（不用佔位蓋真資料）
  const firstSync = !(_currentData.courses || []).length;
  if (firstSync) renderSyncSkeleton();
  chrome.runtime.sendMessage({ type: 'SYNC' }, (resp) => {
    _syncInFlight = false;
    if (chrome.runtime.lastError || !resp || !resp.success) {
      // 同步失敗：先還原畫面（淡出 skeleton、回空狀態），再顯示錯誤態 2.5 秒
      if (firstSync) loadData();
      setSyncStatus(btn, 'error');
      announce(tr('syncFailed'));
    } else {
      setSyncStatus(btn, 'done');
      announce(tr('a11ySynced'));
      // 首次同步：skeleton → 真內容立刻換上。已有資料：同步寫入的新值已由常駐 storage.onChanged 併進 _currentData，
      // 重繪交給 requestRefresh——等 UI 閒置（沒有撤銷窗口／拖曳／morph…）才原地重繪並保留捲動與展開狀態，
      // 同步期間勾的撤銷窗口不會被整段重建截斷（#12；QA P1-3 的即時刷新同一條路）
      if (firstSync) loadData();
      else requestRefresh();
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
// onRendered（選用）：畫面重建完之後呼叫——需要在重建後用 id 找回焦點的路徑用（自訂作業編輯／刪除，#8）
function loadData(onRendered) {
  chrome.storage.local.get(
    ['lastSync', 'schoolName', 'canvasBaseUrl', 'canvasBaseCandidate', 'courses', 'assignments', 'customAssignments', 'assignmentGroups', 'scores', 'courseNames', 'customWeights', 'manualDone', 'manualUndone', 'manualShown', 'manualHidden'],
    (raw) => {
      // 候選網址另存在 _canvasCandidate（不進 _currentData），在 _currentData 的 canvasBaseUrl 更新後再畫提示
      const { canvasBaseCandidate, ...data } = raw || {};
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
        _fadeNextRender = false;
        // 首次同步進行中（skeleton 期間切已繳交／換語言都會走到這裡）→ 重畫 skeleton 疊層（形狀跟著目前頁面），
        // 不淡掉、不換成空狀態——同步其實還在跑（QA #194）
        if (_syncInFlight) {
          renderSyncSkeleton();
          return;
        }
        renderEmptyState();      // 從未同步 vs 已同步但沒有進行中的課程（QA P2-6）
        dismissSyncSkeleton();   // 失敗還原：skeleton 疊層淡出、露出底下的空狀態（#43）
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
      setCanvasCandidate(canvasBaseCandidate);
      if (typeof onRendered === 'function') onRendered();
    }
  );
}

// 重建後把焦點放回（#8）：只在焦點真的掉了（<body> 或已被拆掉的節點）時才動，使用者已經移走的焦點不搶回來。
// 依序試 selectors（在課程詳情內找），都沒有就用清單標題
function refocusInDetail(selectors) {
  const active = document.activeElement;
  // 焦點還留在已關閉（inert）的 modal 裡也算掉了：要還的觸發元素被重繪拆掉時，modal 的歸還落空
  if (active && active !== document.body && active.isConnected && !active.closest('[inert]')) return;
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
    saveLocal({ showClaudeUsageInPopup: _showClaudeUsage });
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

// ── 清除本機資料（QA #152：共用 Chrome 設定檔時，上一位使用者的標記／分數／自訂作業會留給下一位）──
// 確認後刪掉 chrome.storage.local 裡 Due 的所有資料（只保留介面語言），再重新載入成空狀態
function clearLocalData() {
  chrome.storage.local.get(null, (all) => {
    const keys = Object.keys(all || {}).filter((k) => k !== 'uiLanguage');
    const reload = () => location.reload();
    if (!keys.length) { reload(); return; }
    chrome.storage.local.remove(keys, () => {
      const err = chrome.runtime && chrome.runtime.lastError;
      if (err) console.error('[Due] 清除本機資料失敗:', err.message);
      reload();
    });
  });
}

document.getElementById('menu-clear-data')?.addEventListener('click', () => {
  // 與「使用教學」同：先走統一的 closeSettingsMenu（子選單一起收、鍵盤焦點還給 ⚙，#10），再開確認框——
  // 確認框的 focus trap 記下的觸發元素才會是 ⚙，取消後焦點回得去，不會落在已 display:none 的選單項上
  closeSettingsMenu();
  openConfirmDialog({
    title: tr('clearDataTitle'),
    message: tr('clearDataMessage'),
    confirmLabel: tr('clearDataConfirm'),
    onConfirm: clearLocalData,
  });
});

// ── Welcome Modal ──
let _welcomeStep = 1;
let _welcomeCanvasBase = null;   // 已偵測到的學校 Canvas 網址（開教學時從 storage 讀；尚未同步時 _currentData 是空的）

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
  // 節點不重建，按了上一步／下一步的焦點留在原按鈕上，不會掉回 body（QA #122 的症狀在這個做法下不會發生）

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

// 只有目前這頁可互動：其餘投影片 inert（_welcomeInert；Tab 不會聚焦到畫面外的連結、把 overflow:hidden 的軌道捲走，QA P2-13）；
// 軌道容器若曾被捲動過一律歸零（位移只由 translateX 負責）
function _welcomeSyncSlides(n) {
  _welcomeInert(n);
  const area = document.querySelector('.welcome-main-area');
  if (area) area.scrollLeft = 0;
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
  _welcomeSyncSlides(1);
  const overlay = document.getElementById('welcome-overlay');
  if (overlay) overlay.classList.add('open');
  refreshWelcomeCanvasBase();   // 第 2 頁「登入 Canvas」連結對齊目前偵測到的學校（OB-3）
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
  _welcomeSyncSlides(n);
  if (n === 2) refreshWelcomeCanvasBase();   // 進「登入 Canvas」頁：連結對齊目前偵測到的學校
}

document.getElementById('welcome-close')?.addEventListener('click', closeWelcomeModal);

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
const MODAL_OVERLAY_IDS = ['custom-assignment-overlay', 'weight-edit-overlay', 'welcome-overlay', 'confirm-overlay'];
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

// UI 閒置＝此刻整段重繪不會打斷使用者：沒有拖曳、撤銷窗口／碎點爆與離場、FLIP 補位、拖曳落點飛入、頁面切換淡入、
// 課程 morph，焦點不在輸入框（課程重命名、成績計算器），也沒有 modal 開著。
// 每項完成的撤銷窗各自獨立（#12）：任何一項還在窗內（_completeTimers 有計時器）就不重建，重建會把其他項的倒數一起清掉
function isUiIdle() {
  if (_dragCtx) return false;
  if (Object.keys(_completeTimers).length) return false;
  // 只看畫面上看得到的（getClientRects 非空）：撤銷窗口中導覽離開，該列/卡會留在已 display:none 的
  // 詳情或 main-section 裡（計時器已被 clearCompleteTimers 清掉、完成在勾選當下就已寫入），要等那個容器
  // 下次重繪才被換掉——不能讓這種殘留一直擋住即時刷新。離場中的列/卡在 #burst-layer（.bursting），淡完就移除
  const busy = document.querySelectorAll('.completing, .bursting, .drag-clone');
  if ([...busy].some((el) => el.getClientRects().length)) return false;
  // 頁面切換的淡入（_pageAnim）與完成後的 FLIP 補位（WAAPI id 'reflow'）還在跑：重建會讓畫面跳一下
  if (_pageAnim && _pageAnim.playState === 'running') return false;
  if (document.getAnimations().some((a) => a.id === 'reflow' && a.playState === 'running')) return false;
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
const FOCUS_KEYS = ['assignmentId', 'hideableId', 'targetCourse', 'scrollGroup', 'courseId', 'group'];
function _focusSelector(el) {
  if (!el || el === document.body || !el.tagName) return null;
  const css = (v) => ((window.CSS && CSS.escape) ? CSS.escape(String(v)) : String(v));
  if (el.id) return `#${css(el.id)}`;
  const cls = el.classList[0];
  if (!cls) return null;
  let sel = `${el.tagName.toLowerCase()}.${css(cls)}`;
  FOCUS_KEYS.forEach((k) => {
    if (el.dataset[k] != null) sel += `[data-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}="${css(el.dataset[k])}"]`;
  });
  // 自己沒帶 id 的列內控制項（拖曳握把 .drag-grip、描述開關 .assignment-desc-toggle，#6／#7；摘要列聚焦的組標題，#33）：
  // 只靠 class 會在重繪後落到「第一列／第一組」的同名元素 → 冠上所在列（data-hideable-id／週卡 data-assignment-id）或組（data-group）的 selector
  if (!FOCUS_KEYS.some((k) => el.dataset[k] != null)) {
    const row = el.parentElement && el.parentElement.closest('[data-hideable-id], .week-task-card[data-assignment-id], .week-group[data-group]');
    const rowSel = row ? _focusSelector(row) : null;
    if (rowSel) sel = `${rowSel} ${sel}`;
  }
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

// 重繪後把展開面板還原成「本來就開著」：新節點從 height 0 起算，直接加 .open 會讓整段重新長一次（#28 的 disclosure 過渡）
// → 過渡先關掉、forced reflow 提交終點、再還原 CSS 的過渡（不用 rAF）。animated：會跑過渡的節點（面板本身、chevron）
function openPanelInstant(classTarget, animated) {
  const els = animated.filter(Boolean);
  els.forEach((el) => { el.style.transition = 'none'; });
  classTarget.classList.add('open');
  if (!els.length) return;
  classTarget.getBoundingClientRect();
  els.forEach((el) => { el.style.transition = ''; });
}

function restoreViewState(st) {
  const detail = document.getElementById('course-detail-container');
  if (detail && st.view === 'course' && currentView === 'course' && st.courseId === currentCourseId) {
    const hidden = detail.querySelector('.hidden-items');
    // 走 setHiddenItemsOpen：同步開關的 aria-expanded（#6），instant 不重播展開
    if (st.hiddenOpen && hidden) setHiddenItemsOpen(hidden, true, { instant: true });
    const calc = detail.querySelector('.grade-calc');
    if (st.gradeOpen && calc) openPanelInstant(calc, [calc.querySelector('.grade-calc-body'), calc.querySelector('.grade-calc-arrow')]);
    st.openDescIds.forEach((id) => {
      const css = (window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id);
      const chk = detail.querySelector(`.assignment-item .assignment-check[data-assignment-id="${css}"]`);
      const row = chk && chk.closest('.assignment-item');
      const desc = row && row.nextElementSibling;
      if (desc && desc.classList.contains('assignment-desc')) {
        openPanelInstant(desc, [desc]);
        const toggle = row.querySelector('.assignment-desc-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');   // 與 toggleAssignmentDesc 同步（#7）
      }
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
// onRendered（選用）：重建完之後呼叫——自訂作業存檔／刪除後要用 id 找回焦點、落點提示、FLIP 收合（#8／#48）
function refreshView(onRendered) {
  // 尚未以資料渲染過（首次同步落地）或資料被清空 → 走 loadData 完整路徑（含空狀態、skeleton 淡入）
  if (!_lastRenderAt || !(_currentData.courses || []).length) {
    loadData(onRendered);
    return;
  }
  const st = captureViewState();
  render({
    ..._currentData,
    assignments: _currentData.canvasAssignments || {},
    customAssignments: _currentData.customAssignments || {},
  });
  restoreViewState(st);
  if (typeof onRendered === 'function') onRendered();
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
  if (document.getElementById('sync-skeleton')) return;   // 首次同步 skeleton 疊層還在（#43）
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
  if (e.target.closest('#welcome-done-btn')) { closeWelcomeModal(); return; }
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
  settlePageSwitch();                  // 頁面切換的淡入還在跑：直接落定
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
// 權重草稿（N2）：{ key: weightDraftKey(courseId), values: [{ name, weight }] }。✕／Esc 關掉時存起來，
// 重開同一門課的權重視窗就還原；開別門課、按「取消」、儲存、還原 Canvas 權重都會丟掉
let _weightDraft = null;

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
  const draft = DueCustomAssignments.draftValuesFor(_weightDraft, DueCustomAssignments.weightDraftKey(courseId));
  if (draft) items = draft;
  else _weightDraft = null;

  renderWeightEditList(items);
  // 逃生口：僅當該課已有自訂權重時，才顯示「還原 Canvas 權重」
  const resetBtn = document.getElementById('weight-edit-reset');
  if (resetBtn) resetBtn.style.display = hasCustom ? '' : 'none';
  document.getElementById('weight-edit-overlay').classList.add('open');
  // 開啟後焦點落在第一個項目名稱（沒有項目就「+ 新增項目」），與補上 ✕ 之前一樣——不讓標頭的 ✕ 成為第一個停點
  // （與新增作業視窗同一個做法：等 overlay 解除 inert 後的下一幀）
  const firstField = document.querySelector('#weight-edit-list .weight-edit-name') || document.getElementById('weight-edit-add');
  requestAnimationFrame(() => { if (firstField && firstField.isConnected) firstField.focus(); });
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

  // 名稱也要聽：0% 的列有沒有名稱會改變「總和 0」判定（見 weightEditProblem）
  list.querySelectorAll('.weight-edit-pct, .weight-edit-name').forEach((input) => {
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
  row.querySelector('.weight-edit-del').addEventListener('click', () => removeWeightRow(row));
  row.querySelector('.weight-edit-pct').addEventListener('input', updateWeightTotal);
  row.querySelector('.weight-edit-name').addEventListener('input', updateWeightTotal);
  document.getElementById('weight-edit-list').appendChild(row);
  row.querySelector('.weight-edit-name').focus();
  updateWeightTotal();
});

// 關閉權重視窗。keepDraft（✕、Esc）：目前每一列的名稱與百分比存成草稿（N2）；取消／儲存／還原：丟掉草稿
function closeWeightEditModal({ keepDraft = false } = {}) {
  const overlay = document.getElementById('weight-edit-overlay');
  if (keepDraft && overlay.classList.contains('open') && _weightEditCourseId != null) {
    _weightDraft = {
      key: DueCustomAssignments.weightDraftKey(_weightEditCourseId),
      values: [...document.querySelectorAll('#weight-edit-list .weight-edit-row')].map((row) => ({
        name: row.querySelector('.weight-edit-name').value,
        weight: row.querySelector('.weight-edit-pct').value,
      })),
    };
  } else if (!keepDraft) {
    _weightDraft = null;
  }
  overlay.classList.remove('open');
}

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

  closeWeightEditModal();   // 存檔＝丟掉草稿（N2）
  // 只換左欄圓餅：右欄的成績計算器 accordion、已隱藏區、展開的描述與捲動都不動（QA #169）；
  // 被換掉的「編輯」鈕由 refreshWeightPanel 把焦點交給新的那顆（#8）
  refreshWeightPanel(savedCourseId);
});

// 取消＝丟掉這次的修改（含草稿）；✕／Esc 才保留（N2）。點背景不關閉
document.getElementById('weight-edit-cancel').addEventListener('click', () => closeWeightEditModal());
document.getElementById('weight-edit-close').addEventListener('click', () => closeWeightEditModal({ keepDraft: true }));

document.getElementById('weight-edit-reset').addEventListener('click', () => {
  const courseId = _weightEditCourseId;
  // 刪除該課自訂權重 → 圓餅自然回退到 Canvas group_weight，或顯示無評分資訊
  updateShared(['customWeights'], (cur) => {
    const all = { ...(cur.customWeights || {}) };
    delete all[courseId];
    return { customWeights: all };
  });
  closeWeightEditModal();   // 還原＝丟掉草稿（N2）；點背景不關閉這個視窗（N2）
  refreshWeightPanel(courseId);   // 只換左欄圓餅（QA #169）
});

// ── Esc 關閉最上層 overlay（一次只關一個；優先序：新增作業 → 權重 → 教學）──
// 註：課程重命名 inline input 自帶 Escape 處理，且重命名時無 overlay 開著，兩者不衝突
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (isImeComposing(e)) return;   // 組字中的 Esc 是取消候選字，不關 modal（連同未存輸入，QA P2-14）
  // 優先序：確認框 → 新增/編輯作業 → 權重 → 教學（一次只關最上層；經 close 函式一併清狀態）
  // 新增作業與權重視窗用 Esc 關掉時保留草稿（N2），重開同一個視窗會還原
  const closers = [
    ['confirm-overlay', closeConfirmDialog],
    ['custom-assignment-overlay', () => closeCustomAssignmentModal({ keepDraft: true })],
    ['weight-edit-overlay', () => closeWeightEditModal({ keepDraft: true })],
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

  // 監看 .open class：開→啟用 trap；關→還原焦點（涵蓋 Esc／背景點擊／儲存等所有關閉路徑）。
  // 關閉後 overlay 還要淡出 400ms 才 display:none（#29）：這段期間設 inert，出場中的 modal 接不到焦點與點擊
  // （先把焦點還給觸發元素再設 inert）
  const sync = () => {
    if (overlay.classList.contains('open')) {
      overlay.inert = false;
      activate();
    } else {
      deactivate();
      overlay.inert = true;
    }
  };
  new MutationObserver(sync).observe(overlay, { attributes: true, attributeFilter: ['class'] });

  sync();   // 設定時已開著（如首次載入教學）也啟用；關著的一開始就 inert
}

['custom-assignment-overlay', 'weight-edit-overlay', 'welcome-overlay', 'confirm-overlay']
  .forEach((id) => setupModalA11y(document.getElementById(id)));


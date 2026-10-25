// ═══════════════════════════════════════════════════════════════
// Due 互動導覽（product tour）
// - 畫面變暗、只亮出這一步要看／要點的地方，旁邊一個說明框；「下一步」前進、右上角 ✕ 結束、Esc 也結束
// - 有些步驟可以直接點亮起來的元素前進（advanceOn）；按「下一步」時由導覽代點（next），使用者不必自己找
// - 有些步驟要先到某個畫面（before：例如先打開一門課），導覽代點側欄後等目標出現才顯示
// - 亮框以外擋住點擊（四塊透明 blocker 圍住目標）；interactive:false 的步驟連亮框本身也擋（例如 ⚙：點了會開選單蓋在遮罩下）
// - 目標每幀重新查詢、重新量位置（側欄、詳情會整段重建，active 底色會滑），不快取節點
// - 自帶三語字串；依賴（執行期才用到）：_uiLanguage、announce、reduceMotion（dashboard.js 全域，皆有 typeof 守衛）
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const STRINGS = {
    'zh-TW': {
      counter: '{n} / {total}',
      next: '下一步',
      done: '開始使用',
      close: '結束導覽',
      orClick: '或直接點亮起來的地方',
      tryIt: '可以直接試試看',
      syncTitle: '先同步一次',
      syncBody: 'Due 會從 Canvas 拉課程與作業。之後只要打開 Canvas 就會自動同步，想立刻更新就按這裡。',
      homeTitle: '這是學期待辦',
      homeBody: '左邊是近期完成度與各時段的件數；右邊所有課程的作業依截止日期排好，逾期的置頂。',
      courseTitle: '打開一門課',
      courseBody: '側欄列出你這學期的課，數字是還沒做完的件數。點一門課看裡面的東西。',
      renameTitle: '改成你習慣的課名',
      renameBody: '點課名旁的鉛筆，就能改成你習慣的名字（例如中文課名），按 Enter 儲存。側欄、待辦卡片和 popup 都會跟著換。',
      checkTitle: '做完就勾掉',
      checkBody: '點左邊的圓圈標記完成，1.5 秒內再點一次可以撤銷。完成的作業會收進下方「已完成」。',
      dragTitle: '拖曳整理',
      dragBody: '按住名稱後的 ⋮⋮，可以拖到下方「已完成」或「已隱藏」。考試與簽到預設就收在「已隱藏」。',
      weightTitle: '評分比重',
      weightBody: 'Canvas 有設定就直接用；沒有的話可以按「編輯」自己填，成績計算器會跟著算。',
      aiTitle: '讓 AI 自動填權重',
      aiBody: '在設定 →「AI 分析設定」填入你自己的 API key（Gemini、Qwen、DeepSeek…），Due 會在同步後讀課程大綱，自動填入還沒有權重的課。',
      backTitle: '回到學期待辦',
      backBody: '導覽到這裡結束。之後想再看一次，在設定 →「使用教學」。',
    },
    'zh-CN': {
      counter: '{n} / {total}',
      next: '下一步',
      done: '开始使用',
      close: '结束导览',
      orClick: '或直接点亮起来的地方',
      tryIt: '可以直接试试看',
      syncTitle: '先同步一次',
      syncBody: 'Due 会从 Canvas 拉课程和作业。之后只要打开 Canvas 就会自动同步，想立刻更新就按这里。',
      homeTitle: '这是学期待办',
      homeBody: '左边是近期完成度和各时段的件数；右边所有课程的作业按截止日期排好，逾期的置顶。',
      courseTitle: '打开一门课',
      courseBody: '侧栏列出你这学期的课，数字是还没做完的件数。点一门课看里面的东西。',
      renameTitle: '改成你习惯的课名',
      renameBody: '点课名旁的铅笔，就能改成你习惯的名字（例如中文课名），按 Enter 保存。侧栏、待办卡片和 popup 都会跟着换。',
      checkTitle: '做完就勾掉',
      checkBody: '点左边的圆圈标记完成，1.5 秒内再点一次可以撤销。完成的作业会收进下方「已完成」。',
      dragTitle: '拖动整理',
      dragBody: '按住名称后的 ⋮⋮，可以拖到下方「已完成」或「已隐藏」。考试和签到默认就收在「已隐藏」。',
      weightTitle: '评分比重',
      weightBody: 'Canvas 有设置就直接用；没有的话可以按「编辑」自己填，成绩计算器会跟着算。',
      aiTitle: '让 AI 自动填权重',
      aiBody: '在设置 →「AI 分析设置」填入你自己的 API key（Gemini、Qwen、DeepSeek…），Due 会在同步后读课程大纲，自动填入还没有权重的课。',
      backTitle: '回到学期待办',
      backBody: '导览到这里结束。之后想再看一次，在设置 →「使用教程」。',
    },
    en: {
      counter: '{n} / {total}',
      next: 'Next',
      done: 'Get started',
      close: 'End tour',
      orClick: 'or click the highlighted spot',
      tryIt: 'Go ahead and try it',
      syncTitle: 'Sync first',
      syncBody: 'Due pulls your courses and assignments from Canvas. It syncs automatically whenever you open Canvas; click here to update right now.',
      homeTitle: 'Your to-dos',
      homeBody: 'On the left, how much of your near-term work is done and how many items fall in each window. On the right, every course’s assignments sorted by due date, overdue on top.',
      courseTitle: 'Open a course',
      courseBody: 'The sidebar lists this term’s courses; the number is what’s still to do. Click one to look inside.',
      renameTitle: 'Rename a course',
      renameBody: 'Click the pencil next to the course name to give it a name you recognize; press Enter to save. The sidebar, to-do cards and popup all follow.',
      checkTitle: 'Check it off',
      checkBody: 'Click the circle to mark an item done; click again within 1.5 seconds to undo. Done items move to “Done” below.',
      dragTitle: 'Drag to organize',
      dragBody: 'Grab the ⋮⋮ after a name and drop it on “Done” or “Hidden” below. Exams and attendance start out in “Hidden”.',
      weightTitle: 'Grade weights',
      weightBody: 'If Canvas has weights, Due uses them. If not, click “Edit” to fill them in; the grade calculator follows along.',
      aiTitle: 'Let AI fill in weights',
      aiBody: 'In Settings → “AI analysis settings”, add your own API key (Gemini, Qwen, DeepSeek…). After each sync Due reads the syllabus and fills in weights for courses that have none.',
      backTitle: 'Back to your to-dos',
      backBody: 'That’s the tour. You can replay it anytime from Settings → “Tutorial”.',
    },
  };

  // ── 畫面操作（導覽代點，與使用者自己點走同一條路）──
  const q = (sel) => (typeof sel === 'function' ? sel() : document.querySelector(sel));
  const visible = (n) => !!n && n.getClientRects().length > 0;
  const inCourseDetail = () => visible(q('#course-detail-container .course-detail-view'));
  // 優先挑還有待辦的課（課程詳情裡才有可以勾、可以拖的列）
  function pickCourse() {
    const items = [...document.querySelectorAll('#course-nav .nav-course-item')];
    return items.find((b) => !b.querySelector('.nav-course-badge.is-placeholder')) || items[0] || null;
  }
  function goHome() {
    const week = q('#nav-week');
    if (week && !week.classList.contains('active')) week.click();
  }
  function openCourse() {
    if (inCourseDetail()) return;
    const c = pickCourse();
    if (c) c.click();
  }
  // 詳情裡第一列「待辦」作業（勾選圈＋握把都在列上）；最後一列的握把（清單裡還有別的子元素，不能用 :last-child）
  const FIRST_ROW = '#course-detail-container .detail-assignments-list .assignment-item';
  const lastRowGrip = () => {
    const rows = document.querySelectorAll(FIRST_ROW);
    return rows.length ? rows[rows.length - 1].querySelector('.drag-grip') : null;
  };

  // target：亮起來的元素（選擇器或回傳元素的函式；陣列＝取聯集）；advanceOn：使用者點到它就前進；next：按「下一步」時導覽代做的事；
  // before：顯示這一步前要先到的畫面；interactive：亮框內可不可以點（預設可以）；tryIt：可以在亮框裡試、但不會自動前進；
  // scrollTo：要捲進可視範圍的元素（預設是第一個 target）；reveal：這一步期間加在 <html> 上的 class（把平常藏著的控制項亮出來）
  const STEPS = [
    { key: 'sync', target: '#sync-btn', advanceOn: '#sync-btn', before: goHome },
    { key: 'home', target: '#main-section', interactive: false, before: goHome },
    { key: 'course', target: '#course-nav', advanceOn: '#course-nav .nav-course-item', next: openCourse },
    {
      // 鉛筆平常要 hover 才出現：這一步把它亮出來（reveal 加在 <html> 上，換步／結束時拿掉）
      key: 'rename',
      target: ['#course-detail-container .detail-name-text', '#course-detail-container .btn-rename-course'],
      before: openCourse,
      reveal: 'tour-reveal-rename',
      tryIt: true,
    },
    { key: 'check', target: FIRST_ROW, before: openCourse, tryIt: true },
    {
      key: 'drag',
      // 最後一列的握把緊鄰下方兩區：握把與放置目標在同一個亮框裡，捲到底就一起看得到
      target: [lastRowGrip, '#course-detail-container .done-items', '#course-detail-container .hidden-items'],
      scrollTo: '#course-detail-container .hidden-items',
      before: openCourse,
      tryIt: true,
    },
    { key: 'weight', target: '#course-detail-container .detail-left-panel', before: openCourse, interactive: false },
    { key: 'ai', target: '#settings-menu-btn', interactive: false },
    { key: 'back', target: '#nav-week', advanceOn: '#nav-week', next: goHome },
  ];

  // 預設只走這 5 步（2026-10-26 依挑選頁拍板：只教自己找不到的東西）；其餘步驟留著給 dev/tour-review.html 比較
  const DEFAULT_STEPS = ['course', 'rename', 'check', 'drag', 'ai'];

  const PAD = 6;              // 亮框比目標大一圈
  const GAP = 18;             // 說明框與亮框的距離
  const EDGE = 14;            // 說明框離視窗邊緣的最小距離
  const SETTLE_MS = 380;      // 點了／代點之後等頁面換完（頁面切換淡入、課程 morph）
  const WAIT_MAX_MS = 2000;   // before 之後等目標出現的上限
  const FADE_MS = 400;        // 與 --t-overlay 同長

  let _state = null;

  function lang() {
    const l = typeof _uiLanguage !== 'undefined' ? _uiLanguage : 'zh-TW';
    return STRINGS[l] ? l : 'zh-TW';
  }
  function t(key) {
    return STRINGS[lang()][key];
  }
  function reduced() {
    return typeof reduceMotion === 'function' && reduceMotion();
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // 目標的聯集矩形；第一個選擇器必須存在、看得到、沒停用，其餘找得到才併進來
  function targetRect(step) {
    const sels = Array.isArray(step.target) ? step.target : [step.target];
    const first = q(sels[0]);
    if (!first || first.disabled || !visible(first)) return null;
    let r = null;
    sels.forEach((sel) => {
      const n = q(sel);
      if (!visible(n)) return;
      const b = n.getBoundingClientRect();
      if (!b.width || !b.height) return;
      r = r
        ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) }
        : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    });
    return r;
  }

  const CLOSE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const NEXT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function build() {
    const root = document.createElement('div');
    root.className = 'tour-root';
    const blockers = [0, 1, 2, 3].map(() => {
      const b = document.createElement('div');
      b.className = 'tour-block';
      root.appendChild(b);
      return b;
    });
    const ring = document.createElement('div');
    ring.className = 'tour-ring';
    root.appendChild(ring);
    const pop = document.createElement('div');
    pop.className = 'tour-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    pop.setAttribute('aria-labelledby', 'tour-title');
    pop.setAttribute('aria-describedby', 'tour-body');
    pop.tabIndex = -1;
    pop.innerHTML = `
      <div class="tour-progress" aria-hidden="true"><span class="tour-progress-bar"></span></div>
      <div class="tour-arrow" aria-hidden="true"></div>
      <div class="tour-head">
        <span class="tour-counter"></span>
        <button type="button" class="tour-close">${CLOSE_SVG}</button>
      </div>
      <div class="tour-title" id="tour-title"></div>
      <div class="tour-body" id="tour-body"></div>
      <div class="tour-foot">
        <span class="tour-hint"><span class="tour-hint-dot" aria-hidden="true"></span><span class="tour-hint-text"></span></span>
        <button type="button" class="tour-next"><span class="tour-next-label"></span>${NEXT_SVG}</button>
      </div>`;
    root.appendChild(pop);
    document.body.appendChild(root);

    blockers.forEach((b) => b.addEventListener('click', nudge));
    ring.addEventListener('click', nudge);   // 只有 interactive:false 時 ring 才吃得到點擊
    pop.querySelector('.tour-close').addEventListener('click', () => end());
    pop.querySelector('.tour-next').addEventListener('click', () => next());
    return { root, ring, pop, blockers };
  }

  // 點到被擋住的地方：說明框輕推一下（減少動態：不動，只把焦點拉回說明框）
  function nudge() {
    if (!_state) return;
    const { pop } = _state;
    if (!reduced()) {
      pop.animate(
        [{ translate: '0 0' }, { translate: '5px 0' }, { translate: '-3px 0' }, { translate: '0 0' }],
        { duration: 320, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', composite: 'add' },
      );
    }
    pop.focus({ preventScroll: true });
  }

  function setReveal(cls) {
    if (_state.reveal === cls) return;
    if (_state.reveal) document.documentElement.classList.remove(_state.reveal);
    _state.reveal = cls || null;
    if (cls) document.documentElement.classList.add(cls);
  }

  function fillPop() {
    const { pop, i } = _state;
    const steps = _state.steps;
    const step = steps[i];
    const last = i === steps.length - 1;
    pop.querySelector('.tour-counter').textContent = t('counter').replace('{n}', String(i + 1)).replace('{total}', String(steps.length));
    pop.querySelector('.tour-close').setAttribute('aria-label', t('close'));
    pop.querySelector('.tour-close').title = t('close');
    pop.querySelector('#tour-title').textContent = t(`${step.key}Title`);
    pop.querySelector('#tour-body').textContent = t(`${step.key}Body`);
    const hint = pop.querySelector('.tour-hint');
    hint.hidden = !step.advanceOn && !step.tryIt;
    pop.querySelector('.tour-hint-text').textContent = step.advanceOn ? t('orClick') : t('tryIt');
    pop.querySelector('.tour-next-label').textContent = last ? t('done') : t('next');
    pop.querySelector('.tour-progress-bar').style.width = `${((i + 1) / steps.length) * 100}%`;
    setReveal(step.reveal);
    _state.root.classList.toggle('is-blocking', step.interactive === false);
    _state.root.classList.toggle('is-actionable', !!step.advanceOn);
  }

  // 依目標位置擺亮框、四塊 blocker、說明框與箭頭（每幀量；位置沒變就不寫 DOM）
  function place(r) {
    const { ring, pop, blockers } = _state;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 亮框夾在視窗內（主畫面這種大目標貼著視窗邊時，框線才看得到）
    const x = Math.max(2, r.left - PAD);
    const y = Math.max(2, r.top - PAD);
    const w = Math.min(vw - 2, r.right + PAD) - x;
    const h = Math.min(vh - 2, r.bottom + PAD) - y;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const key = [x, y, w, h, vw, vh, pw, ph].map(Math.round).join(',');
    if (key === _state.lastKey) return;
    _state.lastKey = key;

    Object.assign(ring.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    const [top, right, bottom, left] = blockers;
    Object.assign(top.style, { left: '0px', top: '0px', width: `${vw}px`, height: `${Math.max(0, y)}px` });
    Object.assign(bottom.style, { left: '0px', top: `${y + h}px`, width: `${vw}px`, height: `${Math.max(0, vh - y - h)}px` });
    Object.assign(left.style, { left: '0px', top: `${y}px`, width: `${Math.max(0, x)}px`, height: `${h}px` });
    Object.assign(right.style, { left: `${x + w}px`, top: `${y}px`, width: `${Math.max(0, vw - x - w)}px`, height: `${h}px` });

    // 說明框：右 → 左 → 下 → 上，都放不下（目標幾乎佔滿畫面）就放在目標內的右下角、不畫箭頭
    const clampX = (v) => Math.min(Math.max(EDGE, v), vw - pw - EDGE);
    const clampY = (v) => Math.min(Math.max(EDGE, v), vh - ph - EDGE);
    let side;
    let px;
    let py;
    if (x + w + GAP + pw <= vw - EDGE) { side = 'right'; px = x + w + GAP; py = clampY(y + h / 2 - ph / 2); }
    else if (x - GAP - pw >= EDGE) { side = 'left'; px = x - GAP - pw; py = clampY(y + h / 2 - ph / 2); }
    else if (y + h + GAP + ph <= vh - EDGE) { side = 'bottom'; py = y + h + GAP; px = clampX(x + w / 2 - pw / 2); }
    else if (y - GAP - ph >= EDGE) { side = 'top'; py = y - GAP - ph; px = clampX(x + w / 2 - pw / 2); }
    else { side = 'inside'; px = clampX(x + w - pw - 24); py = clampY(y + h - ph - 24); }
    pop.dataset.side = side;
    pop.style.left = `${px}px`;
    pop.style.top = `${py}px`;
    if (side === 'left' || side === 'right') {
      pop.style.setProperty('--arrow-y', `${Math.min(Math.max(20, y + h / 2 - py), ph - 20)}px`);
    } else if (side === 'top' || side === 'bottom') {
      pop.style.setProperty('--arrow-x', `${Math.min(Math.max(20, x + w / 2 - px), pw - 20)}px`);
    }
  }

  function frame() {
    if (!_state) return;
    if (!_state.moving) {
      const r = targetRect(_state.steps[_state.i]);
      if (r) place(r);
    }
    _state.raf = requestAnimationFrame(frame);
  }

  async function waitForTarget(step) {
    const t0 = Date.now();
    while (_state && Date.now() - t0 < WAIT_MAX_MS) {
      if (targetRect(step)) return true;
      await sleep(60);
    }
    return !!(_state && targetRect(step));
  }

  // 導覽代點：期間不算使用者點擊（不觸發 advanceOn）
  function act(fn) {
    if (!fn) return;
    _state.programmatic = true;
    try { fn(); } finally { if (_state) _state.programmatic = false; }
  }

  // 走到第 i 步：說明框淡出 → 先到該步的畫面 → 等目標出現 → 捲進可視範圍 → 亮框滑過去、說明框在新位置淡入。
  // 目標一直沒出現（例如沒有課、課裡沒有作業）就往後跳
  async function go(i) {
    if (!_state) return;
    const token = ++_state.token;
    _state.moving = true;
    _state.root.classList.add('is-moving');
    const steps = _state.steps;
    for (; i < steps.length; i++) {
      const step = steps[i];
      act(step.before);
      if (await waitForTarget(step)) break;
      if (!_state || token !== _state.token) return;
    }
    if (!_state || token !== _state.token) return;
    if (i >= steps.length) { end(); return; }
    _state.i = i;
    const step = steps[i];
    const n = q(step.scrollTo || (Array.isArray(step.target) ? step.target[0] : step.target));
    if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    await sleep(reduced() ? 0 : 280);   // 等平滑捲動差不多停了再擺說明框
    if (!_state || token !== _state.token) return;
    fillPop();
    _state.lastKey = '';
    _state.moving = false;
    const r = targetRect(step);
    if (r) place(r);
    _state.root.classList.remove('is-moving');
    _state.pop.focus({ preventScroll: true });
    if (typeof announce === 'function') announce(`${t(`${step.key}Title`)}。${t(`${step.key}Body`)}`);
  }

  // 「下一步」：這一步有代做的事（打開課程、回學期待辦）就先做，等畫面換完再前進；最後一步＝結束
  async function next() {
    if (!_state || _state.moving) return;
    _state.moving = true;   // 代點換畫面那段等待也要擋住：連點兩下不能連跳兩步
    _state.root.classList.add('is-moving');
    const step = _state.steps[_state.i];
    if (step.next) {
      act(step.next);
      await sleep(SETTLE_MS);
      if (!_state) return;
    }
    if (_state.i >= _state.steps.length - 1) end();
    else go(_state.i + 1);
  }

  // 使用者自己點了亮起來的元素：讓點擊照常生效（不 preventDefault），等頁面換完再前進
  function onClick(e) {
    if (!_state || _state.programmatic || _state.moving) return;
    const step = _state.steps[_state.i];
    if (!step.advanceOn || !e.target.closest || !e.target.closest(step.advanceOn)) return;
    _state.moving = true;
    _state.root.classList.add('is-moving');
    setTimeout(() => {
      if (!_state) return;
      if (_state.i >= _state.steps.length - 1) end();
      else go(_state.i + 1);
    }, SETTLE_MS);
  }

  // Esc 結束導覽；在 capture 階段攔下，不讓 dashboard 的 Esc 另外去關別的東西。
  // 焦點在輸入框（導覽中試著改課名）時 Esc 是「取消編輯」，交給輸入框，不結束導覽
  function onKey(e) {
    if (!_state || e.key !== 'Escape' || e.isComposing) return;
    const tgt = e.target;
    if (tgt && (tgt.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName))) return;
    e.stopPropagation();
    e.preventDefault();
    end();
  }

  // opts.only：只走這些步驟（key 陣列，照 STEPS 的順序；'all'＝全部；省略＝DEFAULT_STEPS）；
  // opts.from：從這一步開始（挑選頁預覽單步用）
  function start(opts = {}) {
    if (_state) end(true);
    const only = opts.only === 'all' ? null
      : (Array.isArray(opts.only) && opts.only.length ? opts.only : DEFAULT_STEPS);
    const steps = only ? STEPS.filter((s) => only.includes(s.key)) : STEPS.slice();
    if (!steps.length) return;
    const from = Math.max(0, steps.findIndex((s) => s.key === opts.from));
    const parts = build();
    _state = { i: from, raf: 0, token: 0, lastKey: '', moving: false, programmatic: false, reveal: null, steps, ...parts };
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    // 第一步直接到位、不從 (0,0) 滑進來：先關過渡，第一次擺好、forced reflow 後再打開
    parts.root.classList.add('no-anim');
    _state.raf = requestAnimationFrame(frame);
    go(from).then(() => {
      if (!_state) return;
      parts.root.getBoundingClientRect();
      parts.root.classList.remove('no-anim');
    });
    parts.root.getBoundingClientRect();
    parts.root.classList.add('is-open');
  }

  function end(instant = false) {
    if (!_state) return;
    const { root, raf } = _state;
    cancelAnimationFrame(raf);
    setReveal(null);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    _state = null;
    root.classList.remove('is-open');
    root.classList.add('is-closing');   // 遮罩淡出期間就不再擋點擊
    if (instant || reduced() || document.hidden) root.remove();
    else setTimeout(() => root.remove(), FADE_MS);
  }

  // 換語言時說明框跟著換
  function applyLanguage() {
    if (_state && !_state.moving) fillPop();
  }

  window.DueTour = { start, end, applyLanguage, isActive: () => !!_state, steps: () => STEPS.map((s) => s.key) };
})();

// ═══════════════════════════════════════════════════════════════
// Due 互動導覽（product tour，原型：先做側邊欄四步）
// - 畫面變暗、只亮出要操作的元素，旁邊一個說明框；使用者真的點了亮起來的元素才進下一步
// - 亮起來以外的地方擋住點擊（四塊透明 blocker 圍住目標），點到就輕推說明框提醒
// - 目標每幀重新查詢、重新量位置（側欄課程列會被 renderNav 整段重建、active 底色會滑動），不快取節點
// - 自帶三語字串；依賴（執行期才用到）：_uiLanguage、announce、reduceMotion（dashboard.js 全域，皆有 typeof 守衛）
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const STRINGS = {
    'zh-TW': {
      counter: '{n} / {total}',
      skip: '跳過導覽',
      done: '完成',
      actionHint: '點亮起來的地方繼續',
      coursesTitle: '課程總覽',
      coursesBody: '點「課程」，一次看每門課最近要交的作業。',
      courseTitle: '打開一門課',
      courseBody: '點側欄任何一門課，看它的作業清單、評分比重和成績計算器。',
      weekTitle: '回到學期待辦',
      weekBody: '所有課程的待辦依截止日期排在這裡，逾期的置頂。點「學期待辦」回來。',
      syncTitle: '隨時同步',
      syncBody: '你打開 Canvas 時 Due 會自動同步；想立刻更新就按這裡。',
    },
    'zh-CN': {
      counter: '{n} / {total}',
      skip: '跳过导览',
      done: '完成',
      actionHint: '点亮起来的地方继续',
      coursesTitle: '课程总览',
      coursesBody: '点「课程」，一次看每门课最近要交的作业。',
      courseTitle: '打开一门课',
      courseBody: '点侧栏任何一门课，看它的作业清单、评分比重和成绩计算器。',
      weekTitle: '回到学期待办',
      weekBody: '所有课程的待办按截止日期排在这里，逾期的置顶。点「学期待办」回来。',
      syncTitle: '随时同步',
      syncBody: '你打开 Canvas 时 Due 会自动同步；想立刻更新就按这里。',
    },
    en: {
      counter: '{n} / {total}',
      skip: 'Skip tour',
      done: 'Done',
      actionHint: 'Click the highlighted spot to continue',
      coursesTitle: 'All your courses',
      coursesBody: 'Click “Courses” to see what’s due next in every course at once.',
      courseTitle: 'Open a course',
      courseBody: 'Click any course in the sidebar to see its assignments, grade weights and grade calculator.',
      weekTitle: 'Back to your to-dos',
      weekBody: 'Every course’s to-dos are sorted by due date here, overdue on top. Click “Upcoming” to come back.',
      syncTitle: 'Sync anytime',
      syncBody: 'Due syncs automatically whenever you open Canvas. Click here to update right now.',
    },
  };

  // target：要亮起來的元素；advanceOn：點到它（closest）才進下一步；最後一步另有「完成」鈕
  const STEPS = [
    { key: 'courses', target: '#nav-courses', advanceOn: '#nav-courses' },
    { key: 'course', target: '#course-nav', advanceOn: '#course-nav .nav-course-item' },
    { key: 'week', target: '#nav-week', advanceOn: '#nav-week' },
    { key: 'sync', target: '#sync-btn', advanceOn: '#sync-btn' },
  ];

  const PAD = 6;              // 亮框比目標大一圈
  const GAP = 16;             // 說明框與亮框的距離
  const EDGE = 12;            // 說明框離視窗邊緣的最小距離
  const ADVANCE_DELAY = 420;  // 點了之後等頁面換完（頁面切換淡入、課程 morph）再移到下一步
  const FADE_MS = 400;        // 與 --t-overlay 同長

  let _state = null;   // { i, root, ring, pop, blockers, raf, lastKey, advancing, onClick, onKey }

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

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // 目標存在、看得到、沒停用才算數（例：沒有課程時「課程」停用、課程列是空的 → 跳過該步）
  function findTarget(step) {
    const n = document.querySelector(step.target);
    if (!n || n.disabled) return null;
    const r = n.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return n;
  }

  function build() {
    const root = el('div', 'tour-root');
    const blockers = ['top', 'right', 'bottom', 'left'].map(() => el('div', 'tour-block'));
    const ring = el('div', 'tour-ring');
    const pop = el('div', 'tour-pop');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    pop.setAttribute('aria-labelledby', 'tour-title');
    pop.setAttribute('aria-describedby', 'tour-body');
    pop.tabIndex = -1;
    pop.innerHTML = `
      <div class="tour-arrow" aria-hidden="true"></div>
      <div class="tour-counter"></div>
      <div class="tour-title" id="tour-title"></div>
      <div class="tour-body" id="tour-body"></div>
      <div class="tour-hint"></div>
      <div class="tour-actions">
        <button type="button" class="tour-skip"></button>
        <button type="button" class="tour-done"></button>
      </div>`;
    blockers.forEach((b) => root.appendChild(b));
    root.appendChild(ring);
    root.appendChild(pop);
    document.body.appendChild(root);

    blockers.forEach((b) => b.addEventListener('click', nudge));
    pop.querySelector('.tour-skip').addEventListener('click', () => end());
    pop.querySelector('.tour-done').addEventListener('click', () => end());
    return { root, ring, pop, blockers };
  }

  // 點到被擋住的地方：說明框輕推一下（減少動態：不動，只把焦點拉回說明框）
  function nudge() {
    if (!_state) return;
    const { pop } = _state;
    if (!reduced()) {
      pop.animate(
        [{ translate: '0 0' }, { translate: '6px 0' }, { translate: '-4px 0' }, { translate: '0 0' }],
        { duration: 320, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
      );
    }
    pop.focus({ preventScroll: true });
  }

  function fillPop(step) {
    const { pop } = _state;
    const last = _state.i === STEPS.length - 1;
    pop.querySelector('.tour-counter').textContent = t('counter')
      .replace('{n}', String(_state.i + 1)).replace('{total}', String(STEPS.length));
    pop.querySelector('#tour-title').textContent = t(`${step.key}Title`);
    pop.querySelector('#tour-body').textContent = t(`${step.key}Body`);
    pop.querySelector('.tour-hint').textContent = t('actionHint');
    pop.querySelector('.tour-skip').textContent = t('skip');
    pop.querySelector('.tour-skip').hidden = last;
    const done = pop.querySelector('.tour-done');
    done.textContent = t('done');
    done.hidden = !last;
    if (typeof announce === 'function') announce(`${t(`${step.key}Title`)}。${t(`${step.key}Body`)}`);
  }

  // 依目標位置擺亮框、四塊 blocker、說明框與箭頭（每幀量；位置沒變就不寫 DOM）
  function place(rect) {
    const { ring, pop, blockers } = _state;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = rect.left - PAD;
    const y = rect.top - PAD;
    const w = rect.width + PAD * 2;
    const h = rect.height + PAD * 2;
    const key = [x, y, w, h, vw, vh, pop.offsetWidth, pop.offsetHeight].map(Math.round).join(',');
    if (key === _state.lastKey) return;
    _state.lastKey = key;

    Object.assign(ring.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    const [top, right, bottom, left] = blockers;
    Object.assign(top.style, { left: '0px', top: '0px', width: `${vw}px`, height: `${Math.max(0, y)}px` });
    Object.assign(bottom.style, { left: '0px', top: `${y + h}px`, width: `${vw}px`, height: `${Math.max(0, vh - y - h)}px` });
    Object.assign(left.style, { left: '0px', top: `${y}px`, width: `${Math.max(0, x)}px`, height: `${h}px` });
    Object.assign(right.style, { left: `${x + w}px`, top: `${y}px`, width: `${Math.max(0, vw - x - w)}px`, height: `${h}px` });

    // 說明框預設在亮框右邊（側欄在左）；右邊放不下就放左邊
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    let side = 'right';
    let px = x + w + GAP;
    if (px + pw > vw - EDGE) { side = 'left'; px = Math.max(EDGE, x - GAP - pw); }
    const cy = y + h / 2;
    const py = Math.min(Math.max(EDGE, cy - ph / 2), Math.max(EDGE, vh - ph - EDGE));
    pop.dataset.side = side;
    pop.style.left = `${px}px`;
    pop.style.top = `${py}px`;
    pop.style.setProperty('--arrow-y', `${Math.min(Math.max(16, cy - py), ph - 16)}px`);
  }

  function frame() {
    if (!_state) return;
    const step = STEPS[_state.i];
    const n = step && findTarget(step);
    if (n) place(n.getBoundingClientRect());
    _state.raf = requestAnimationFrame(frame);
  }

  // 走到第 i 步；目標不存在（例如沒有課程）就往後跳
  function go(i) {
    if (!_state) return;
    while (i < STEPS.length && !findTarget(STEPS[i])) i++;
    if (i >= STEPS.length) { end(); return; }
    _state.i = i;
    _state.advancing = false;
    _state.root.classList.remove('is-advancing');
    fillPop(STEPS[i]);
    _state.lastKey = '';
    _state.pop.focus({ preventScroll: true });
  }

  // 使用者點了亮起來的元素：讓點擊照常生效（不 preventDefault），等頁面換完再前進
  function onClick(e) {
    if (!_state || _state.advancing) return;
    const step = STEPS[_state.i];
    if (!e.target.closest || !e.target.closest(step.advanceOn)) return;
    _state.advancing = true;
    _state.root.classList.add('is-advancing');   // 說明框先淡出，換到下一個位置後再淡入
    setTimeout(() => {
      if (!_state) return;
      if (_state.i === STEPS.length - 1) end();
      else go(_state.i + 1);
    }, ADVANCE_DELAY);
  }

  // Esc 結束導覽；在 capture 階段攔下，不讓 dashboard 的 Esc 另外去關別的東西
  function onKey(e) {
    if (!_state || e.key !== 'Escape' || e.isComposing) return;
    e.stopPropagation();
    e.preventDefault();
    end();
  }

  function start() {
    if (_state) end(true);
    const parts = build();
    _state = { i: 0, raf: 0, lastKey: '', advancing: false, ...parts };
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    // 第一幀直接到位、不從 (0,0) 滑進來：先關過渡量一次，forced reflow 後再打開
    parts.root.classList.add('no-anim');
    go(0);
    if (!_state) return;   // 一步都走不了（例如沒有任何課程）
    const n = findTarget(STEPS[_state.i]);
    if (n) place(n.getBoundingClientRect());
    parts.root.getBoundingClientRect();
    parts.root.classList.remove('no-anim');
    parts.root.classList.add('is-open');
    _state.raf = requestAnimationFrame(frame);
  }

  function end(instant = false) {
    if (!_state) return;
    const { root, raf } = _state;
    cancelAnimationFrame(raf);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    _state = null;
    root.classList.remove('is-open');
    root.style.pointerEvents = 'none';
    root.querySelectorAll('.tour-block').forEach((b) => { b.style.pointerEvents = 'none'; });
    if (instant || reduced() || document.hidden) root.remove();
    else setTimeout(() => root.remove(), FADE_MS);
  }

  // 換語言時說明框跟著換
  function applyLanguage() {
    if (_state) fillPop(STEPS[_state.i]);
  }

  window.DueTour = { start, end, applyLanguage, isActive: () => !!_state };
})();

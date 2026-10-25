// ═══════════════════════════════════════════════════════════════
// Due 互動導覽（product tour）
// - 畫面變暗、只亮出這一步要點的地方，旁邊一個說明框叫使用者「點這裡」；照著做完就自動到下一步
//   （點擊類看 advanceOn；改名／勾完成／拖曳這種要等結果的，聽 dashboard.js 的 due:action 事件）
// - 「下一步」跳過這一步（需要換畫面的由導覽代點，next）；右上角 ✕ 與 Esc 結束
// - 有些步驟要先到某個畫面（before：例如先打開一門課），導覽代點側欄後等目標出現才顯示
// - 要點／要拖的地方（spot）：亮框貼著那個元素的形狀（driver.js／react-joyride 的 spotlight 做法），
//   角落再放一個會脈動的小信標（hotspot beacon）提示「點這裡」；只看不點的步驟（⚙）沒有信標
// - 變暗用 SVG mask 挖洞：主亮處之外可以再挖一個虛線框（point：拖曳的目的地、AI 權重會填的地方），AI 那步再配手繪繞圈箭頭
// - 亮框以外擋住點擊（四塊透明 blocker 圍住主亮框）；interactive:false 的步驟連亮框本身也擋
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
      autoNext: '做完會自動到下一步',
      courseTitle: '打開一門課',
      courseBody: '點這門課，看看裡面有什麼。',
      renameTitle: '幫課取個好認的名字',
      renameBody: '點鉛筆，改成你習慣的叫法，按 Enter 儲存。',
      checkTitle: '做完就勾掉',
      checkBody: '點最左邊的圓圈，把這項標成完成。1.5 秒內再點一次可以反悔。',
      dragTitle: '拖曳整理',
      dragBody: '按住名稱後的 ⋮⋮，往下拖進「已隱藏」就算完成，拖回來就還原。',
      aiTitle: '讓 AI 幫你填評分比重',
      aiBody: '在 ⚙ 的「AI 分析設定」貼上你的 API key。',
    },
    'zh-CN': {
      counter: '{n} / {total}',
      next: '下一步',
      done: '开始使用',
      close: '结束导览',
      autoNext: '做完会自动到下一步',
      courseTitle: '打开一门课',
      courseBody: '点这门课，看看里面有什么。',
      renameTitle: '给课取个好认的名字',
      renameBody: '点铅笔，改成你习惯的叫法，按 Enter 保存。',
      checkTitle: '做完就勾掉',
      checkBody: '点最左边的圆圈，把这项标成完成。1.5 秒内再点一次可以反悔。',
      dragTitle: '拖动整理',
      dragBody: '按住名称后的 ⋮⋮，往下拖进「已隐藏」就算完成，拖回来就还原。',
      aiTitle: '让 AI 帮你填评分比重',
      aiBody: '在 ⚙ 的「AI 分析设置」贴上你的 API key。',
    },
    en: {
      counter: '{n} / {total}',
      next: 'Next',
      done: 'Get started',
      close: 'End tour',
      autoNext: 'Do it and we’ll move on',
      courseTitle: 'Open a course',
      courseBody: 'Click this course to see what’s inside.',
      renameTitle: 'Give it a name you know',
      renameBody: 'Click the pencil, type the name you use, and press Enter.',
      checkTitle: 'Check it off',
      checkBody: 'Click the circle on the left to mark this done. Click again within 1.5 seconds to undo.',
      dragTitle: 'Drag to organize',
      dragBody: 'Grab the ⋮⋮ after a name and drag it down into “Hidden” to mark it done; drag it back to undo.',
      aiTitle: 'Let AI fill in grade weights',
      aiBody: 'Paste your API key in ⚙ → “AI analysis settings”.',
    },
  };

  // ── 畫面操作（導覽代點，與使用者自己點走同一條路）──
  const q = (sel) => (typeof sel === 'function' ? sel() : document.querySelector(sel));
  const visible = (n) => !!n && n.getClientRects().length > 0;
  const DETAIL = '#course-detail-container';
  const inCourseDetail = () => visible(q(`${DETAIL} .course-detail-view`));
  // 優先挑還有待辦的課（課程詳情裡才有可以勾、可以拖的列）
  function pickCourse() {
    const items = [...document.querySelectorAll('#course-nav .nav-course-item')];
    return items.find((b) => !b.querySelector('.nav-course-badge.is-placeholder')) || items[0] || null;
  }
  function openCourse() {
    if (inCourseDetail()) return;
    const c = pickCourse();
    if (c) c.click();
  }
  const FIRST_ROW = `${DETAIL} .detail-assignments-list .assignment-item`;
  const lastRow = () => {
    const rows = document.querySelectorAll(FIRST_ROW);
    return rows.length ? rows[rows.length - 1] : null;
  };
  const lastRowGrip = () => {
    const r = lastRow();
    return r ? r.querySelector('.drag-grip') : null;
  };
  const firstRowCheck = () => {
    const row = q(FIRST_ROW);
    return row ? row.querySelector('.assignment-check') : null;
  };

  // 每一步：
  //   target：亮起來的元素（選擇器或回傳元素的函式；陣列＝取聯集）；scrollTo：要捲進可視範圍的（預設第一個 target）
  //   advanceOn：使用者點到它（closest）就前進；advanceEvent：收到這個 due:action 就前進
  //   next：按「下一步」時導覽代做的事；before：顯示這一步前要先到的畫面
  //   interactive：亮框內可不可以點（預設可以）；reveal：這一步期間加在 <html> 上的 class（亮出平常藏著的控制項）
  //   spot：使用者要點／要拖的那個小東西 → 主亮處改成圍著它的小圓（target 只用來等畫面、捲動）
  //   point：另外挖一個虛線框「指給你看」；pointArrow：再從說明框畫一條手繪繞圈箭頭過去
  //   resolve(state)：依這一趟的狀況換文案／目標
  const STEPS = [
    {
      key: 'course',
      target: pickCourse,
      spot: pickCourse,
      advanceOn: '#course-nav .nav-course-item',
      next: openCourse,
    },
    {
      key: 'rename',
      // 點了鉛筆，課名換成輸入框 → 亮處改成整個輸入框（不然正在打的字在暗處）
      target: [() => q(`${DETAIL} .course-rename-input`) || q(`${DETAIL} .detail-name-text`), `${DETAIL} .btn-rename-course`],
      spot: () => (q(`${DETAIL} .course-rename-input`) ? null : q(`${DETAIL} .btn-rename-course`)),
      before: openCourse,
      reveal: 'tour-reveal-rename',
      advanceEvent: 'rename',
    },
    {
      key: 'check',
      target: FIRST_ROW,
      spot: firstRowCheck,
      before: openCourse,
      advanceEvent: 'complete',
    },
    {
      // 從清單最後一列往下拖：它緊鄰下方「已隱藏」區（已完成＋隱藏合併的那一區），握把與目的地（虛線框）同時在畫面裡
      key: 'drag',
      target: [lastRow, `${DETAIL} .archive-items`],
      spot: lastRowGrip,
      point: `${DETAIL} .archive-items`,
      scrollTo: `${DETAIL} .archive-items`,
      before: openCourse,
      advanceEvent: 'drag',
    },
    {
      key: 'ai',
      target: '#settings-menu-btn',
      before: openCourse,
      interactive: false,
      point: `${DETAIL} .detail-left-panel`,
      pointArrow: true,
    },
  ];

  const PAD = 6;              // 亮框比目標大一圈
  const SPOT_PAD = 5;         // 要點的元素：亮框只比它大一點，貼著它的形狀
  const GAP = 18;             // 說明框與亮框的距離
  const EDGE = 14;            // 說明框離視窗邊緣的最小距離
  const SETTLE_MS = 380;      // 點了／代點之後等頁面換完（頁面切換淡入、課程 morph）
  const EVENT_SETTLE_MS = 650; // 勾完成／拖曳落地後，讓離場與飛回的動畫演完再換步
  const WAIT_MAX_MS = 2000;   // before 之後等目標出現的上限
  const FADE_MS = 400;        // 與 --t-overlay 同長
  const SVG_NS = 'http://www.w3.org/2000/svg';

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

  // 這一步實際用的設定（resolve 換掉的欄位蓋在原本的上面）
  function spec(step) {
    return step.resolve ? { ...step, ...step.resolve(_state) } : step;
  }

  // 裁到所有會裁切的祖先（捲動容器）的可見範圍內：亮框不會框到捲出去、看不到的地方
  function clipRect(n, b) {
    let r = { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    for (let p = n.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (!/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX)) continue;
      const c = p.getBoundingClientRect();
      r = { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) };
    }
    return r.right > r.left && r.bottom > r.top ? r : null;
  }

  // 目標的聯集矩形；第一個必須存在、看得到、沒停用，其餘找得到才併進來。
  // clip（預設）：裁到捲動容器的可見範圍；等目標出現時不裁（還沒捲進來的目標也算「出現了」）
  function rectOf(target, { clip = true } = {}) {
    const sels = Array.isArray(target) ? target : [target];
    const first = q(sels[0]);
    if (!first || first.disabled || !visible(first)) return null;
    let r = null;
    sels.forEach((sel) => {
      const n = q(sel);
      if (!visible(n)) return;
      const raw = n.getBoundingClientRect();
      if (!raw.width || !raw.height) return;
      const b = clip ? clipRect(n, raw) : raw;
      if (!b) return;
      r = r
        ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) }
        : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    });
    return r;
  }

  const CLOSE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const NEXT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function svgEl(tag, attrs = {}) {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  }

  function build() {
    const root = document.createElement('div');
    root.className = 'tour-root';

    // 變暗層：整片半透明，mask 挖掉主亮框（hole）與「指給你看」的洞（hole2）
    const dim = svgEl('svg', { class: 'tour-dim', 'aria-hidden': 'true' });
    const mask = svgEl('mask', { id: 'tour-dim-mask', maskUnits: 'userSpaceOnUse' });
    mask.appendChild(svgEl('rect', { x: 0, y: 0, width: '100%', height: '100%', fill: '#fff' }));
    const hole = svgEl('rect', { class: 'tour-hole', rx: 10, fill: '#000' });
    const hole2 = svgEl('rect', { class: 'tour-hole', rx: 10, fill: '#000' });
    mask.appendChild(hole);
    mask.appendChild(hole2);
    const defs = svgEl('defs');
    defs.appendChild(mask);
    dim.appendChild(defs);
    dim.appendChild(svgEl('rect', { class: 'tour-dim-fill', x: 0, y: 0, width: '100%', height: '100%', mask: 'url(#tour-dim-mask)' }));
    root.appendChild(dim);

    const blockers = [0, 1, 2, 3].map(() => {
      const b = document.createElement('div');
      b.className = 'tour-block';
      root.appendChild(b);
      return b;
    });
    const ring = document.createElement('div');
    ring.className = 'tour-ring';
    root.appendChild(ring);
    const ring2 = document.createElement('div');
    ring2.className = 'tour-ring2';
    root.appendChild(ring2);
    // 脈動信標（hotspot beacon）：實心小點＋兩圈往外擴散的光圈，掛在要點的亮框角上
    const beacon = document.createElement('div');
    beacon.className = 'tour-beacon';
    beacon.setAttribute('aria-hidden', 'true');
    beacon.innerHTML = '<span></span><span></span>';
    root.appendChild(beacon);

    // 手繪繞圈箭頭（point 用）：路徑＋箭頭兩撇
    const sketch = svgEl('svg', { class: 'tour-sketch', 'aria-hidden': 'true' });
    // 線下面墊一條米白淡底（halo），壓在變暗的介面文字上也看得清楚
    const sketchHalo = svgEl('path', { class: 'tour-sketch-halo' });
    const sketchPath = svgEl('path', { class: 'tour-sketch-line' });
    const sketchHead = svgEl('path', { class: 'tour-sketch-line' });
    sketch.appendChild(sketchHalo);
    sketch.appendChild(sketchPath);
    sketch.appendChild(sketchHead);
    root.appendChild(sketch);

    const pop = document.createElement('div');
    pop.className = 'tour-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    pop.setAttribute('aria-labelledby', 'tour-title');
    pop.setAttribute('aria-describedby', 'tour-body');
    pop.tabIndex = -1;
    pop.innerHTML = `
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
    return { root, hole, hole2, ring, ring2, beacon, pop, blockers, sketch, sketchHalo, sketchPath, sketchHead };
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
    const { pop, i, cur } = _state;
    const steps = _state.steps;
    const last = i === steps.length - 1;
    const textKey = cur.textKey || cur.key;
    const actionable = !!(cur.advanceOn || cur.advanceEvent);
    pop.querySelector('.tour-counter').textContent = t('counter').replace('{n}', String(i + 1)).replace('{total}', String(steps.length));
    pop.querySelector('.tour-close').setAttribute('aria-label', t('close'));
    pop.querySelector('.tour-close').title = t('close');
    pop.querySelector('#tour-title').textContent = t(`${textKey}Title`);
    pop.querySelector('#tour-body').textContent = t(`${textKey}Body`);
    pop.querySelector('.tour-hint').hidden = !actionable;
    pop.querySelector('.tour-hint-text').textContent = t('autoNext');
    pop.querySelector('.tour-next-label').textContent = last ? t('done') : t('next');
    setReveal(cur.reveal);
    _state.root.classList.toggle('is-blocking', cur.interactive === false);
    _state.root.classList.toggle('is-actionable', actionable);
    _state.root.classList.toggle('has-point', !!cur.point);
    _state.root.classList.toggle('has-arrow', !!cur.pointArrow);
  }

  function setRect(el, x, y, w, h, rx = 10) {
    el.style.setProperty('rx', `${rx}px`);
    el.style.setProperty('x', `${x}px`);
    el.style.setProperty('y', `${y}px`);
    el.style.setProperty('width', `${Math.max(0, w)}px`);
    el.style.setProperty('height', `${Math.max(0, h)}px`);
  }

  // 亮框：比目標大一圈、夾在視窗內（大目標貼著視窗邊時框線才看得到）
  function padded(r, vw, vh) {
    const x = Math.max(2, r.left - PAD);
    const y = Math.max(2, r.top - PAD);
    return { x, y, w: Math.min(vw - 2, r.right + PAD) - x, h: Math.min(vh - 2, r.bottom + PAD) - y };
  }

  const clampN = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  // 貼著要點的元素的亮框；元素本身是圓（勾選圈）就是圓，否則小圓角（比照 driver.js 的 stageRadius 上限：不超過短邊一半）
  function spotBox(el, r) {
    const x = r.left - SPOT_PAD;
    const y = r.top - SPOT_PAD;
    const w = r.right - r.left + SPOT_PAD * 2;
    const h = r.bottom - r.top + SPOT_PAD * 2;
    const own = el ? parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 : 0;
    const roundEl = own >= Math.min(r.right - r.left, r.bottom - r.top) / 2 - 0.5;
    return { x, y, w, h, rx: roundEl ? Math.min(w, h) / 2 : Math.min(8, Math.min(w, h) / 2) };
  }

  // 手繪箭頭：一條圓滑的弧線，從說明框右邊出去、往外鼓一圈，指進「指給你看」的框；箭頭兩撇順著最後的切線。
  // 終點在框上離起點最近的那條邊（往框中央錯開一點）；兩者太近畫不出弧線就不畫
  const SKETCH_MIN_LEN = 70;
  function drawSketch(popBox, b) {
    const { sketchHalo, sketchPath, sketchHead } = _state;
    const f = (v) => v.toFixed(1);
    const clear = () => [sketchPath, sketchHalo, sketchHead].forEach((n) => n.setAttribute('d', ''));
    const sx = popBox.x + popBox.w + 8;
    const sy = popBox.y + Math.min(34, popBox.h / 2);
    // 終點：框上離起點最近的點；落在上下緣時往右錯開、落在左右緣時往上錯開（箭頭斜斜進框，不是直直戳）
    let ex = clampN(sx, b.x, b.x + b.w);
    let ey = clampN(sy, b.y, b.y + b.h);
    if (ey === b.y || ey === b.y + b.h) ex = clampN(ex + 50, b.x + 24, b.x + b.w - 24);
    else ey = clampN(ey - 40, b.y + 24, b.y + b.h - 24);
    const dx0 = sx - ex;
    const dy0 = sy - ey;
    const d0 = Math.hypot(dx0, dy0) || 1;
    ex += (dx0 / d0) * 12;   // 停在框外一點
    ey += (dy0 / d0) * 12;
    const L = Math.hypot(ex - sx, ey - sy);
    if (L < SKETCH_MIN_LEN) { clear(); return; }
    const ux = (ex - sx) / L;
    const uy = (ey - sy) / L;
    // 往外鼓的方向：朝右（先往右出去再拐過去）
    let px = -uy;
    let py = ux;
    if (px < 0) { px = -px; py = -py; }
    const bow = clampN(L * 0.32, 24, 90);
    const c1 = { x: sx + ux * L * 0.2 + px * bow, y: sy + uy * L * 0.2 + py * bow };
    const c2 = { x: sx + ux * L * 0.8 + px * bow, y: sy + uy * L * 0.8 + py * bow };
    const d = `M ${f(sx)} ${f(sy)} C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(ex)} ${f(ey)}`;
    sketchPath.setAttribute('d', d);
    sketchHalo.setAttribute('d', d);
    // 箭頭兩撇：沿最後一段的切線（c2 → 終點）往回、左右各張 30°
    const tl = Math.hypot(ex - c2.x, ey - c2.y) || 1;
    const tx = (ex - c2.x) / tl;
    const ty = (ey - c2.y) / tl;
    const wing = (deg) => {
      const a = (deg * Math.PI) / 180;
      const wx = -(tx * Math.cos(a) - ty * Math.sin(a)) * 11;
      const wy = -(tx * Math.sin(a) + ty * Math.cos(a)) * 11;
      return `${f(ex + wx)} ${f(ey + wy)}`;
    };
    sketchHead.setAttribute('d', `M ${wing(30)} L ${f(ex)} ${f(ey)} L ${wing(-30)}`);
  }

  // 每次換步：箭頭從起點畫到終點（減少動態：直接出現）
  function playSketch() {
    const { sketchHalo, sketchPath, sketchHead } = _state;
    [sketchHalo, sketchPath, sketchHead].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    if (reduced()) return;
    const len = sketchPath.getAttribute('d') ? sketchPath.getTotalLength() : 0;
    [sketchHalo, sketchPath].forEach((n) => n.animate(
      [{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }],
      { duration: 700, delay: 150, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'backwards' },
    ));
    sketchHead.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, delay: 820, fill: 'backwards' });
  }

  // 依目標位置擺挖洞、亮框、四塊 blocker、說明框、箭頭（每幀量；位置沒變就不寫 DOM）
  function place(r) {
    const { ring, ring2, hole, hole2, pop, blockers, cur } = _state;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sr = cur.spot ? rectOf(cur.spot) : null;
    const box = sr ? spotBox(q(cur.spot), sr) : { ...padded(r, vw, vh), rx: 10 };
    const { x, y, w, h } = box;
    const round = box.rx;
    _state.root.classList.toggle('is-spot', !!sr);   // spot 可能中途消失（改名輸入框出現）→ 收起信標
    // 說明框以整個目標（例如這一列）為基準擺在外側，不蓋住同一列的其他內容；箭頭仍對著亮處的中線
    const anchor = sr ? padded(r, vw, vh) : { x, y, w, h };
    const pr = cur.point ? rectOf(cur.point) : null;
    const b = pr ? padded(pr, vw, vh) : null;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const key = [x, y, w, h, round, anchor.x, anchor.y, anchor.w, anchor.h, vw, vh, pw, ph, ...(b ? [b.x, b.y, b.w, b.h] : [])].map(Math.round).join(',');
    if (key === _state.lastKey) return;
    _state.lastKey = key;

    setRect(hole, x, y, w, h, round);
    Object.assign(ring.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${round}px` });
    // 信標：圓形亮框放在右上 45° 的邊上，方框放在右上角，各往外挪一點不壓住元素
    const k = round >= Math.min(w, h) / 2 - 0.5 ? 0.85 : 1;
    Object.assign(_state.beacon.style, { left: `${x + w / 2 + (w / 2) * k}px`, top: `${y + h / 2 - (h / 2) * k}px` });
    if (b) {
      setRect(hole2, b.x, b.y, b.w, b.h);
      Object.assign(ring2.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
    } else {
      // 沒有第二個洞：縮成主亮框中心的一點（下次出現時從那裡長出來，而不是從左上角飛來）
      setRect(hole2, x + w / 2, y + h / 2, 0, 0);
    }
    const [top, right, bottom, left] = blockers;
    Object.assign(top.style, { left: '0px', top: '0px', width: `${vw}px`, height: `${Math.max(0, y)}px` });
    Object.assign(bottom.style, { left: '0px', top: `${y + h}px`, width: `${vw}px`, height: `${Math.max(0, vh - y - h)}px` });
    Object.assign(left.style, { left: '0px', top: `${y}px`, width: `${Math.max(0, x)}px`, height: `${h}px` });
    Object.assign(right.style, { left: `${x + w}px`, top: `${y}px`, width: `${Math.max(0, vw - x - w)}px`, height: `${h}px` });

    // 說明框：右 → 左 → 下 → 上，都放不下（目標幾乎佔滿畫面）就放在目標內的右下角、不畫箭頭
    const clampX = (v) => clampN(v, EDGE, vw - pw - EDGE);
    const clampY = (v) => clampN(v, EDGE, vh - ph - EDGE);
    const A = anchor;
    const cx = x + w / 2;   // 亮處中心（箭頭對準這裡）
    const cy = y + h / 2;
    // 依序試右、左、下、上：放得進視窗、而且不壓住「指給你看」的框（b）的第一個；都壓到就取第一個放得進的；
    // 都放不下（目標幾乎佔滿畫面）就放在目標內的右下角、不畫箭頭
    // 上／下兩個位置另外試「往左／往右錯開到框外」的版本（箭頭小三角仍對著亮處，只要還在說明框寬度內）
    const vert = (side, py, fits) => [clampX(cx - pw / 2), ...(b ? [b.x - 12 - pw, b.x + b.w + 12] : [])]
      .filter((px) => px >= EDGE && px + pw <= vw - EDGE && cx - px >= 20 && px + pw - cx >= 20)
      .map((px) => ({ side, px, py, fits }));
    const cands = [
      { side: 'right', px: A.x + A.w + GAP, py: clampY(cy - ph / 2), fits: A.x + A.w + GAP + pw <= vw - EDGE },
      { side: 'left', px: A.x - GAP - pw, py: clampY(cy - ph / 2), fits: A.x - GAP - pw >= EDGE },
      ...vert('bottom', A.y + A.h + GAP, A.y + A.h + GAP + ph <= vh - EDGE),
      ...vert('top', A.y - GAP - ph, A.y - GAP - ph >= EDGE),
    ];
    const hits = (c) => !!b && c.px < b.x + b.w + 8 && c.px + pw > b.x - 8 && c.py < b.y + b.h + 8 && c.py + ph > b.y - 8;
    const pick = cands.find((c) => c.fits && !hits(c)) || cands.find((c) => c.fits)
      || { side: 'inside', px: clampX(A.x + A.w - pw - 24), py: clampY(A.y + A.h - ph - 24) };
    const { side, px, py } = pick;
    pop.dataset.side = side;
    pop.style.left = `${px}px`;
    pop.style.top = `${py}px`;
    if (side === 'left' || side === 'right') {
      pop.style.setProperty('--arrow-y', `${clampN(cy - py, 20, ph - 20)}px`);
    } else if (side === 'top' || side === 'bottom') {
      pop.style.setProperty('--arrow-x', `${clampN(cx - px, 20, pw - 20)}px`);
    }
    if (b && cur.pointArrow) drawSketch({ x: px, y: py, w: pw, h: ph }, b);
  }

  function frame() {
    if (!_state) return;
    if (!_state.moving && _state.cur) {
      const r = rectOf(_state.cur.target);
      if (r) place(r);
    }
    _state.raf = requestAnimationFrame(frame);
  }

  async function waitForTarget(getSpec) {
    const t0 = Date.now();
    while (_state && Date.now() - t0 < WAIT_MAX_MS) {
      if (rectOf(getSpec().target, { clip: false })) return true;
      await sleep(60);
    }
    return !!(_state && rectOf(getSpec().target, { clip: false }));
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
    let cur = null;
    for (; i < steps.length; i++) {
      act(spec(steps[i]).before);
      const idx = i;
      if (await waitForTarget(() => spec(steps[idx]))) { cur = spec(steps[i]); break; }
      if (!_state || token !== _state.token) return;
    }
    if (!_state || token !== _state.token) return;
    if (i >= steps.length) { end(); return; }
    _state.i = i;
    _state.cur = cur;
    const n = q(cur.scrollTo || (Array.isArray(cur.target) ? cur.target[0] : cur.target));
    if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    await sleep(reduced() ? 0 : 280);   // 等平滑捲動差不多停了再擺說明框
    if (!_state || token !== _state.token) return;
    _state.cur = spec(steps[i]);         // 捲動、展開之後再定一次（resolve 看的是當下畫面）
    fillPop();
    _state.lastKey = '';
    _state.moving = false;
    const r = rectOf(_state.cur.target);
    if (r) place(r);
    if (_state.cur.pointArrow) playSketch();
    _state.root.classList.remove('is-moving');
    _state.pop.focus({ preventScroll: true });
    const textKey = _state.cur.textKey || _state.cur.key;
    if (typeof announce === 'function') announce(`${t(`${textKey}Title`)}。${t(`${textKey}Body`)}`);
  }

  // 前進到下一步（最後一步＝結束）；wait：先等多久再換（讓頁面或動畫演完）
  function advance(wait) {
    if (!_state || _state.moving) return;
    _state.moving = true;
    _state.root.classList.add('is-moving');
    setTimeout(() => {
      if (!_state) return;
      if (_state.i >= _state.steps.length - 1) end();
      else go(_state.i + 1);
    }, wait);
  }

  // 「下一步」：這一步有代做的事（打開課程）就先做，等畫面換完再前進
  async function next() {
    if (!_state || _state.moving) return;
    const step = _state.cur;
    if (step && step.next) {
      _state.moving = true;   // 代點換畫面那段等待也要擋住：連點兩下不能連跳兩步
      _state.root.classList.add('is-moving');
      act(step.next);
      await sleep(SETTLE_MS);
      if (!_state) return;
      _state.moving = false;
    }
    advance(0);
  }

  // 使用者自己點了亮起來的元素：讓點擊照常生效（不 preventDefault），等頁面換完再前進
  function onClick(e) {
    if (!_state || _state.programmatic || _state.moving || !_state.cur) return;
    const sel = _state.cur.advanceOn;
    if (!sel || !e.target.closest || !e.target.closest(sel)) return;
    advance(SETTLE_MS);
  }

  // dashboard.js 的 due:action：使用者照著做完（改名提交、勾完成落地、拖曳落地）→ 自動下一步
  function onAction(e) {
    if (!_state || !_state.cur) return;
    const type = e.detail && e.detail.type;
    if (_state.moving || type !== _state.cur.advanceEvent) return;
    advance(type === 'rename' ? SETTLE_MS : EVENT_SETTLE_MS);
  }

  // Esc 結束導覽；在 capture 階段攔下，不讓 dashboard 的 Esc 另外去關別的東西。
  // 焦點在輸入框（導覽中改課名）時 Esc 是「取消編輯」，交給輸入框，不結束導覽
  function onKey(e) {
    if (!_state || e.key !== 'Escape' || e.isComposing) return;
    const tgt = e.target;
    if (tgt && (tgt.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName))) return;
    e.stopPropagation();
    e.preventDefault();
    end();
  }

  // opts.only：只走這些步驟（key 陣列，照 STEPS 的順序；省略＝全部）；opts.from：從這一步開始（挑選頁預覽單步用）
  function start(opts = {}) {
    if (_state) end(true);
    const only = Array.isArray(opts.only) && opts.only.length ? opts.only : null;
    const steps = only ? STEPS.filter((s) => only.includes(s.key)) : STEPS.slice();
    if (!steps.length) return;
    const from = Math.max(0, steps.findIndex((s) => s.key === opts.from));
    const parts = build();
    _state = {
      i: from, cur: null, raf: 0, token: 0, lastKey: '', moving: false, programmatic: false,
      reveal: null, steps, ...parts,
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('due:action', onAction);
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
    document.removeEventListener('due:action', onAction);
    _state = null;
    root.classList.remove('is-open');
    root.classList.add('is-closing');   // 遮罩淡出期間就不再擋點擊
    if (instant || reduced() || document.hidden) root.remove();
    else setTimeout(() => root.remove(), FADE_MS);
  }

  // 換語言時說明框跟著換
  function applyLanguage() {
    if (_state && !_state.moving && _state.cur) fillPop();
  }

  window.DueTour = { start, end, applyLanguage, isActive: () => !!_state, steps: () => STEPS.map((s) => s.key) };
})();

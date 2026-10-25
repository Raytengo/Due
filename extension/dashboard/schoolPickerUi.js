// 空狀態的「選擇你的學校」combobox（ARIA 1.2 editable combobox with list autocomplete）。
// 規則在 schools.js（純函式，有測試）；這裡只管 DOM：搜尋框＋下拉清單，↑↓／Enter／Esc／Tab 與滑鼠都能用。
// 清單 schools.json 第一次 mount 才抓（約 280KB，整個 session 共用同一個 promise）；
// 還沒載入完時清單顯示「載入中」，已選的學校名稱載入後補上。
(function () {
  'use strict';

  const CHUNK = 60;                 // 一次畫幾列；捲到底再補（六千多列一次畫完會卡）
  const MAX_ROWS_WHEN_SEARCHING = 200;

  let _indexPromise = null;
  function loadIndex() {
    if (!_indexPromise) {
      _indexPromise = fetch(chrome.runtime.getURL('dashboard/schools.json'))
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((rows) => DueSchools.buildIndex(rows))
        .catch((err) => { _indexPromise = null; throw err; });   // 失敗不快取：下次打開再試
    }
    return _indexPromise;
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));

  // host：放 combobox 的容器；opts.tr(key)＝取字串；opts.origin＝目前選的學校 origin（可為 null＝預設學校）；
  // opts.onPick(origin)＝使用者選了一所學校（呼叫端負責存起來）
  function mount(host, opts) {
    const tr = opts.tr;
    let index = [];
    let loadFailed = false;
    let selected = DueSchools.parseInstructure(opts.origin) || { sub: DueSchools.DEFAULT_SUB, origin: DueSchools.originOf(DueSchools.DEFAULT_SUB) };
    let open = false;
    let query = '';          // 使用者實際打的字（沒打字＝空，列出全部）
    let rows = [];           // 目前的選項：[{ entry, custom? }]
    let shown = 0;           // 已畫出幾個選項
    let active = -1;         // 鍵盤／滑鼠停留的選項索引
    const uid = `school-pick-${Math.random().toString(36).slice(2, 7)}`;

    host.innerHTML = `
      <div class="school-pick">
        <label class="school-pick-label" for="${uid}-input">${esc(tr('schoolLabel'))}</label>
        <div class="school-pick-field">
          <input id="${uid}-input" class="school-pick-input" type="text" role="combobox" autocomplete="off" spellcheck="false"
            aria-autocomplete="list" aria-expanded="false" aria-controls="${uid}-list" placeholder="${esc(tr('schoolPlaceholder'))}">
          <svg class="school-pick-chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="school-pick-pop" id="${uid}-pop" hidden>
            <ul class="school-pick-list" id="${uid}-list" role="listbox" aria-label="${esc(tr('schoolLabel'))}"></ul>
            <div class="school-pick-foot">${esc(tr('schoolUnsupported'))}</div>
          </div>
        </div>
        <div class="school-pick-host" id="${uid}-host"></div>
      </div>`;
    const input = host.querySelector('input');
    const pop = host.querySelector('.school-pick-pop');
    const list = host.querySelector('.school-pick-list');
    const hostLine = host.querySelector('.school-pick-host');
    const field = host.querySelector('.school-pick-field');

    const nameOf = (sub) => {
      const e = index.find((x) => x.sub === sub);
      return e ? e.name : `${sub}${DueSchools.SUFFIX}`;
    };
    const syncInputToSelection = () => {
      input.value = nameOf(selected.sub);
      hostLine.textContent = `${selected.sub}${DueSchools.SUFFIX}`;
    };

    function computeRows() {
      const out = [];
      const pasted = DueSchools.parseInstructure(query);
      if (pasted) {
        // 貼上的是 Canvas 網址：清單裡有這所學校就直接指給它；沒有（清單是快照，新學校會漏）就讓使用者照網址用
        const known = index.find((e) => e.sub === pasted.sub);
        if (known) return [{ entry: known }];
        return [{ custom: true, entry: { sub: pasted.sub, origin: pasted.origin, host: `${pasted.sub}${DueSchools.SUFFIX}`, name: '' } }];
      }
      const found = DueSchools.search(index, query, { limit: query ? MAX_ROWS_WHEN_SEARCHING : Infinity });
      for (const entry of found) out.push({ entry });
      return out;
    }

    function rowHtml(r, i) {
      const e = r.entry;
      const isSel = e.sub === selected.sub;
      const id = `${uid}-opt-${i}`;
      const title = r.custom ? fmt(tr('schoolUse'), { host: e.host }) : e.name;
      const sub = r.custom ? '' : `<span class="school-opt-host">${esc(e.host)}</span>`;
      return `<li class="school-opt${r.custom ? ' is-custom' : ''}${isSel ? ' is-selected' : ''}${i === active ? ' is-active' : ''}" id="${id}" role="option" aria-selected="${isSel}" data-i="${i}">
        <span class="school-opt-main"><span class="school-opt-name">${esc(title)}</span>${sub}</span>
        <svg class="school-opt-check" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 6.3 5 8.8l4.5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </li>`;
    }

    // 空查詢時在「常用」與其餘之間放小標；其他情況不分組
    function sectionLabel(i) {
      if (query || !rows[i]) return '';
      const featured = rows[i].entry.featured >= 0;
      const prevFeatured = i > 0 && rows[i - 1].entry.featured >= 0;
      if (i === 0 && featured) return tr('schoolFeatured');
      if (!featured && (i === 0 || prevFeatured)) return fmt(tr('schoolAll'), { n: index.length.toLocaleString() });
      return '';
    }

    function render() {
      shown = Math.min(rows.length, Math.max(shown, CHUNK));
      if (loadFailed && !index.length) {
        list.innerHTML = `<li class="school-pick-note" role="presentation">${esc(tr('schoolLoadFailed'))}</li>`;
        return;
      }
      if (!index.length) {
        list.innerHTML = `<li class="school-pick-note" role="presentation">${esc(tr('schoolLoading'))}</li>`;
        return;
      }
      if (!rows.length) {
        list.innerHTML = `<li class="school-pick-note" role="presentation">${esc(fmt(tr('schoolNone'), { q: query.trim() }))}</li>`;
        return;
      }
      let html = '';
      for (let i = 0; i < shown; i++) {
        const label = sectionLabel(i);
        if (label) html += `<li class="school-pick-group" role="presentation">${esc(label)}</li>`;
        html += rowHtml(rows[i], i);
      }
      list.innerHTML = html;
    }

    function setActive(i, { scroll = true } = {}) {
      const prev = list.querySelector('.school-opt.is-active');
      if (prev) prev.classList.remove('is-active');
      active = i;
      const el = i >= 0 ? list.querySelector(`[data-i="${i}"]`) : null;
      if (el) {
        el.classList.add('is-active');
        input.setAttribute('aria-activedescendant', el.id);
        if (scroll) {   // 只捲清單自己（scrollIntoView 會連頁面一起捲）
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (top < list.scrollTop) list.scrollTop = top;
          else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
        }
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function refresh({ keepActive = false } = {}) {
      rows = computeRows();
      shown = 0;
      if (!keepActive) active = rows.length ? (query ? 0 : Math.max(0, rows.findIndex((r) => r.entry.sub === selected.sub))) : -1;
      // 要讓 active 那列已經畫出來
      if (active >= CHUNK) shown = active + 1;
      render();
      list.scrollTop = 0;
      setActive(active);
    }

    function openList() {
      if (open) return;
      open = true;
      pop.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      field.classList.add('is-open');
      refresh();
    }

    function closeList({ restore = true } = {}) {
      if (!open) return;
      open = false;
      pop.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      field.classList.remove('is-open');
      query = '';
      if (restore) syncInputToSelection();
    }

    function choose(i) {
      const r = rows[i];
      if (!r) return;
      const e = r.entry;
      selected = { sub: e.sub, origin: e.origin };
      if (r.custom) index = index.concat(DueSchools.buildIndex([[e.sub, e.host]]));   // 之後的清單／名稱查得到
      closeList();
      opts.onPick(e.origin);
    }

    // 捲到快底就補畫下一批
    list.addEventListener('scroll', () => {
      if (shown >= rows.length) return;
      if (list.scrollTop + list.clientHeight < list.scrollHeight - 80) return;
      const from = shown;
      shown = Math.min(rows.length, shown + CHUNK);
      let html = '';
      for (let i = from; i < shown; i++) {
        const label = sectionLabel(i);
        if (label) html += `<li class="school-pick-group" role="presentation">${esc(label)}</li>`;
        html += rowHtml(rows[i], i);
      }
      list.insertAdjacentHTML('beforeend', html);
    });

    // 點選項：mousedown 不讓輸入框失焦（不然 blur 先關掉清單，click 就落空）
    pop.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.school-opt');
      if (li) choose(Number(li.dataset.i));
    });
    list.addEventListener('mousemove', (e) => {
      const li = e.target.closest('.school-opt');
      if (li && Number(li.dataset.i) !== active) setActive(Number(li.dataset.i), { scroll: false });
    });

    input.addEventListener('focus', () => {
      openList();
      input.select();
    });
    input.addEventListener('click', () => {
      if (!open) openList();
      else if (!query) input.select();
    });
    field.querySelector('.school-pick-chev').addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (open) closeList();
      else { input.focus(); }
    });
    input.addEventListener('input', () => {
      query = input.value;
      if (open) refresh();
      else openList();
    });
    input.addEventListener('blur', () => closeList());
    input.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;   // 選字中的 Enter／方向鍵屬於輸入法
      const key = e.key;
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault();
        if (!open) { openList(); return; }
        if (!rows.length) return;
        const n = key === 'ArrowDown' ? active + 1 : active - 1;
        const next = (n + rows.length) % rows.length;
        if (next >= shown) { shown = next + 1; render(); }
        setActive(next);
      } else if (key === 'Enter') {
        if (open && active >= 0) { e.preventDefault(); choose(active); }
      } else if (key === 'Escape') {
        if (open) { e.preventDefault(); e.stopPropagation(); closeList(); }
      } else if (key === 'Tab') {
        closeList();
      }
    });

    syncInputToSelection();
    loadIndex().then((idx) => {
      index = idx;
      loadFailed = false;
      if (!host.isConnected) return;
      syncInputToSelection();
      if (open) refresh({ keepActive: false });
    }).catch(() => {
      loadFailed = true;
      if (open) render();
    });
  }

  window.DueSchoolPicker = { mount };
})();

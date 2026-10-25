// ═══════════════════════════════════════════════════════════════
// Due AI 分析設定 modal（spec 2026-09-03）
// - 自帶三語字串，不塞 dashboard.js 的 I18N；dashboard.js 的 applyUILanguage 末尾呼叫 applyLanguage(lang)
// - 只寫 chrome.storage.local.aiConfig；分析狀態一律透過 AI_* 訊息向 background 取
// - 依賴（執行期才用到）：DueGradingRules（供應商預設）、openConfirmDialog／_currentData（dashboard.js 全域）
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const STRINGS = {
    'zh-TW': {
      menuItem: 'AI 分析設定',
      title: 'AI 分析設定',
      // 揭露：送什麼、送去哪、用誰的額度（CWS Prominent Disclosure；QA AI P0-2）。{provider} 隨表單上的供應商替換
      consent: '儲存後與每次同步，會把還沒有權重的課的大綱、PDF 與檔名從你的瀏覽器直接送到 {provider}，用你自己的額度。開發者收不到。',
      providerLabel: '供應商',
      apiKeyLabel: 'API key',
      modelLabel: '模型 ID',
      modelPlaceholder: '留空使用預設：{model}',
      baseUrlLabel: 'Base URL（進階）',
      pdfHint: '尚未授權存取 canvas-user-content.com，只會分析 syllabus 文字。重新按「儲存」可再次授權。',
      hostPermHint: '此供應商不允許瀏覽器直接呼叫，需要「存取 {host}」的權限才能運作。請重新按「儲存」並允許。',
      testBtn: '測試連線',
      testing: '測試中…',
      testOk: '✓ 連線正常',
      testFail: '失敗：{error}',
      clearBtn: '清除金鑰',
      statusHeading: '分析狀態',
      notConfigured: '尚未設定 API key，分析不會執行。',
      lastRun: '上次分析 {time}',
      running: '分析中…',
      never: '尚未分析',
      noCourses: '尚無課程資料，請先同步。',
      stDone: '已分析',
      stNotFound: '找不到大綱',
      stError: '錯誤',
      stSkipped: '已有權重',
      stPending: '待分析',
      noteNoMaterial: '找不到大綱文字或 PDF',
      noteNoBreakdown: '文件中沒有評分比重資訊',
      noteEmptyWeights: '沒有解析出任何權重項目',
      noteWeightsSum: '權重總和 {total}%，超出合理範圍',
      cancel: '取消',
      save: '儲存',
      show: '顯示',
      hide: '隱藏',
    },
    'zh-CN': {
      menuItem: 'AI 分析设置',
      title: 'AI 分析设置',
      consent: '保存后与每次同步，会把还没有权重的课程的大纲、PDF 和文件名从你的浏览器直接发送到 {provider}，用你自己的额度。开发者收不到。',
      providerLabel: '供应商',
      apiKeyLabel: 'API key',
      modelLabel: '模型 ID',
      modelPlaceholder: '留空使用默认：{model}',
      baseUrlLabel: 'Base URL（高级）',
      pdfHint: '尚未授权访问 canvas-user-content.com，只会分析 syllabus 文本。重新点击「保存」可再次授权。',
      hostPermHint: '此供应商不允许浏览器直接调用，需要「访问 {host}」的权限才能运作。请重新点击「保存」并允许。',
      testBtn: '测试连接',
      testing: '测试中…',
      testOk: '✓ 连接正常',
      testFail: '失败：{error}',
      clearBtn: '清除密钥',
      statusHeading: '分析状态',
      notConfigured: '尚未设置 API key，分析不会执行。',
      lastRun: '上次分析 {time}',
      running: '分析中…',
      never: '尚未分析',
      noCourses: '暂无课程数据，请先同步。',
      stDone: '已分析',
      stNotFound: '未找到大纲',
      stError: '错误',
      stSkipped: '已有权重',
      stPending: '待分析',
      noteNoMaterial: '未找到大纲文本或 PDF',
      noteNoBreakdown: '文件中没有评分比重信息',
      noteEmptyWeights: '未解析出任何权重项目',
      noteWeightsSum: '权重总和 {total}%，超出合理范围',
      cancel: '取消',
      save: '保存',
      show: '显示',
      hide: '隐藏',
    },
    en: {
      menuItem: 'AI analysis settings',
      title: 'AI analysis settings',
      consent: 'On save and each sync, syllabi, PDFs and file names of courses without weights go straight from your browser to {provider}, on your own quota. The developer never sees them.',
      providerLabel: 'Provider',
      apiKeyLabel: 'API key',
      modelLabel: 'Model ID',
      modelPlaceholder: 'Leave blank for default: {model}',
      baseUrlLabel: 'Base URL (advanced)',
      pdfHint: 'Access to canvas-user-content.com was not granted, so only the syllabus text is analyzed. Press Save again to re-request.',
      hostPermHint: 'This provider blocks direct browser calls, so Due needs permission to access {host}. Press Save again and allow it.',
      testBtn: 'Test connection',
      testing: 'Testing…',
      testOk: '✓ Connected',
      testFail: 'Failed: {error}',
      clearBtn: 'Remove key',
      statusHeading: 'Analysis status',
      notConfigured: 'No API key set. Analysis will not run.',
      lastRun: 'Last run {time}',
      running: 'Analyzing…',
      never: 'Not run yet',
      noCourses: 'No courses yet. Sync first.',
      stDone: 'Done',
      stNotFound: 'No syllabus',
      stError: 'Error',
      stSkipped: 'Has weights',
      stPending: 'Pending',
      noteNoMaterial: 'No syllabus text or PDF found',
      noteNoBreakdown: 'No grading breakdown found in the document',
      noteEmptyWeights: 'No weight items were parsed',
      noteWeightsSum: 'Weights sum to {total}%, outside the expected range',
      cancel: 'Cancel',
      save: 'Save',
      show: 'Show',
      hide: 'Hide',
    },
  };

  const LOCALE = { 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', en: 'en-US' };

  let _lang = 'zh-TW';
  let _keyVisible = false;
  let _lastStatus = null;   // 最近一次 AI_GET_STATUS 結果，供 updateProviderUi 重算 PDF 提示

  function t(key, vars) {
    const table = STRINGS[_lang] || STRINGS['zh-TW'];
    let s = table[key] || STRINGS['zh-TW'][key] || key;
    // 用 function replacer：供應商錯誤訊息裡的 $& / $` 不會被當成替換樣式而糊掉輸出
    if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, () => String(vars[k]));
    return s;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const $ = (id) => document.getElementById(id);

  function sendMsg(msg) {
    return new Promise((resolve) => {
      if (!chrome.runtime?.sendMessage) { resolve(null); return; }
      try {
        chrome.runtime.sendMessage(msg, (res) => {
          void chrome.runtime.lastError; // 沒有接收者時不要噴到 console
          resolve(res || null);
        });
      } catch (_) {
        resolve(null);
      }
    });
  }

  function providers() {
    return (typeof DueGradingRules !== 'undefined' && DueGradingRules.PROVIDERS) || {};
  }

  // 目前表單選的供應商設定；未知值一律退回 gemini（與 loadConfigIntoForm 的正規化一致）
  function currentProvider() {
    const all = providers();
    return all[$('ai-provider').value] || all.gemini || {};
  }

  function readForm() {
    const p = currentProvider();
    const apiKey = $('ai-api-key').value.trim();
    const cfg = {
      provider: $('ai-provider').value,
      apiKey,
      model: $('ai-model').value.trim(),
      // 支援 PDF 的供應商（Gemini）不顯示 base URL 欄位，就別把隱藏欄位的殘值存進去
      baseUrl: p.supportsPdf ? '' : $('ai-base-url').value.trim(),
    };
    // 沒填 key 什麼都不會送出，不算同意（QA AI P0-2）
    if (apiKey) cfg.consentedAt = new Date().toISOString();
    return cfg;
  }

  // 切換供應商只更新 placeholder／提示，不清空使用者已輸入的欄位
  function updateProviderUi() {
    const p = currentProvider();
    // 同意文字點名資料會送到哪一家：跟著表單上選的供應商換
    $('ai-settings-consent').textContent = t('consent', { provider: p.label || '' });
    $('ai-model').placeholder = t('modelPlaceholder', { model: p.defaultModel || '' });
    $('ai-api-key').placeholder = p.keyPlaceholder || '';
    $('ai-base-url').placeholder = p.baseUrl || '';
    $('ai-base-url-wrap').hidden = !!p.supportsPdf;      // Gemini 不需要 base URL
    // 所有供應商都會下載 PDF 大綱 → 未授權提示與供應商無關；用上次 AI_GET_STATUS 的快取重算，
    // 切換供應商時不必再送一次訊息就能把提示放回來
    $('ai-pdf-hint').hidden = !(_lastStatus && _lastStatus.configured && !_lastStatus.pdfPermission);
  }

  // host permission 字串（'https://integrate.api.nvidia.com/*'）→ 給人看的主機名
  function hostLabel(origin) {
    return String(origin || '').replace(/^https?:\/\//, '').replace(/\/\*$/, '');
  }

  // 「該供應商不回 CORS、需要 host permission 但尚未授權」的提示。
  // 依「已儲存的設定」判定（providerPermission 由 background 依 aiConfig 算），語言切換時也要能重畫
  function renderHostPermHint() {
    const el = $('ai-host-perm-hint');
    if (!el) return;
    const st = _lastStatus;
    const origin = (st && typeof DueGradingRules !== 'undefined' && DueGradingRules.providerHostPermission)
      ? DueGradingRules.providerHostPermission(st.provider)
      : null;
    el.textContent = t('hostPermHint', { host: hostLabel(origin) });
    el.hidden = !(st && st.configured && st.providerPermission === false);
  }

  function applyStaticText() {
    const menu = $('menu-ai-settings');
    if (menu) menu.textContent = t('menuItem');
    if (!$('ai-settings-overlay')) return;
    $('ai-settings-title').textContent = t('title');
    $('ai-provider-label').textContent = t('providerLabel');
    $('ai-api-key-label').textContent = t('apiKeyLabel');
    $('ai-model-label').textContent = t('modelLabel');
    $('ai-base-url-label').textContent = t('baseUrlLabel');
    $('ai-pdf-hint').textContent = t('pdfHint');
    renderHostPermHint();
    $('ai-test-btn').textContent = t('testBtn');
    $('ai-clear-btn').textContent = t('clearBtn');
    $('ai-status-heading').textContent = t('statusHeading');
    $('ai-cancel-btn').textContent = t('cancel');
    $('ai-save-btn').textContent = t('save');
    $('ai-key-toggle').textContent = _keyVisible ? t('hide') : t('show');
    updateProviderUi();
  }

  function courseName(courseId) {
    const data = (typeof _currentData !== 'undefined' && _currentData) || {};
    const custom = (data.courseNames || {})[courseId];
    if (custom) return custom;
    const c = (data.courses || []).find((x) => String(x.id) === String(courseId));
    return c ? (c.name || c.course_code || String(courseId)) : String(courseId);
  }

  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(LOCALE[_lang] || 'zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function refreshStatus() {
    const st = await sendMsg({ type: 'AI_GET_STATUS' });
    const summary = $('ai-status-summary');
    const lastrun = $('ai-status-lastrun');
    const list = $('ai-status-list');
    if (!st || st.error) {
      _lastStatus = null;
      summary.innerHTML = '';
      lastrun.textContent = '';
      list.innerHTML = '';
      $('ai-pdf-hint').hidden = true;
      $('ai-host-perm-hint').hidden = true;
      return;
    }
    _lastStatus = st;

    // 所有供應商都會下載 PDF 大綱（Gemini 送原始 bytes，其餘抽字），未授權提示與供應商無關
    $('ai-pdf-hint').hidden = !(st.configured && !st.pdfPermission);
    renderHostPermHint();

    if (!st.configured) {
      summary.innerHTML = escapeHtml(t('notConfigured'));
      lastrun.textContent = '';
      list.innerHTML = '';
      return;
    }

    lastrun.textContent = st.running ? t('running') : (st.lastRunAt ? t('lastRun', { time: formatTime(st.lastRunAt) }) : t('never'));

    const counts = { done: 0, notFound: 0, error: 0, pending: 0, skipped: 0 };
    for (const c of st.courses) counts[c.status] = (counts[c.status] || 0) + 1;
    // 每個計數用跟課程列表一致的顏色（綠/紅/暖黃），一眼看出哪類需要注意；待分析用預設的 muted 色
    summary.innerHTML = [
      ['done', 'stDone'], ['notFound', 'stNotFound'], ['error', 'stError'], ['pending', 'stPending'],
    ].map(([key, label]) => `<span class="ai-count ${key}">${escapeHtml(t(label))} ${counts[key]}</span>`)
      .join('<span class="ai-count-sep"> · </span>');

    if (!st.courses.length) { list.innerHTML = `<li><span class="ai-status-name">${escapeHtml(t('noCourses'))}</span></li>`; return; }
    const label = { done: 'stDone', notFound: 'stNotFound', error: 'stError', skipped: 'stSkipped', pending: 'stPending' };
    list.innerHTML = st.courses.map((c) => {
      const name = escapeHtml(courseName(c.courseId));
      const note = c.status === 'error' ? c.error : (c.status === 'notFound' ? c.notes : '');
      return `
      <li>
        <span class="ai-status-name" title="${name}">${name}</span>
        <span class="ai-status-state ${escapeHtml(c.status)}">${escapeHtml(t(label[c.status] || 'stPending'))}</span>
        ${note ? `<span class="ai-status-note">${escapeHtml(noteLabel(note))}</span>` : ''}
      </li>`;
    }).join('');
  }

  // 把幾種固定的內部 notes/reason 字串換成看得懂的話；其餘（多半是 LLM 自己回的說明文字）原樣顯示
  function noteLabel(raw) {
    const s = String(raw || '');
    if (s === 'no syllabus material') return t('noteNoMaterial');
    if (s === 'no grading breakdown found') return t('noteNoBreakdown');
    if (s === 'empty') return t('noteEmptyWeights');
    const sumMatch = s.match(/^weights sum (.+)$/);
    if (sumMatch) return t('noteWeightsSum', { total: sumMatch[1] });
    return s;
  }

  function loadConfigIntoForm() {
    if (!chrome.storage?.local?.get) { updateProviderUi(); return; }
    chrome.storage.local.get(['aiConfig'], (data) => {
      const c = (data && data.aiConfig) || {};
      $('ai-provider').value = providers()[c.provider] ? c.provider : 'gemini';
      $('ai-api-key').value = c.apiKey || '';
      $('ai-model').value = c.model || '';
      $('ai-base-url').value = c.baseUrl || '';
      updateProviderUi();
    });
  }

  function open() {
    const overlay = $('ai-settings-overlay');
    if (!overlay) return;
    _keyVisible = false;
    $('ai-api-key').type = 'password';
    $('ai-test-result').textContent = '';
    $('ai-test-result').className = 'ai-settings-test-result';
    $('ai-test-result').title = '';
    applyStaticText();
    loadConfigIntoForm();
    overlay.classList.add('open');
    refreshStatus();
  }

  function close() {
    const overlay = $('ai-settings-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function applyLanguage(lang) {
    _lang = STRINGS[lang] ? lang : 'zh-TW';
    applyStaticText();
  }

  function bind() {
    const overlay = $('ai-settings-overlay');
    if (!overlay) return;

    $('ai-provider').addEventListener('change', updateProviderUi);

    $('ai-key-toggle').addEventListener('click', () => {
      _keyVisible = !_keyVisible;
      $('ai-api-key').type = _keyVisible ? 'text' : 'password';
      $('ai-key-toggle').textContent = _keyVisible ? t('hide') : t('show');
    });

    $('ai-test-btn').addEventListener('click', async () => {
      const out = $('ai-test-result');
      out.className = 'ai-settings-test-result';
      out.textContent = t('testing');
      out.title = '';
      const res = await sendMsg({ type: 'AI_TEST_CONNECTION', config: readForm() });
      if (res && res.success) { out.textContent = t('testOk'); out.classList.add('ok'); }
      else { out.textContent = t('testFail', { error: (res && res.error) || 'no response' }); out.classList.add('fail'); }
      out.title = out.textContent;   // 這一行會 ellipsis 截斷，hover 才看得到完整錯誤
    });

    $('ai-clear-btn').addEventListener('click', () => {
      $('ai-api-key').value = '';
      $('ai-model').value = '';
      $('ai-base-url').value = '';
      if (chrome.storage?.local?.remove) chrome.storage.local.remove('aiConfig', refreshStatus);
    });

    $('ai-save-btn').addEventListener('click', () => {
      // 供應商自己的 host（NVIDIA 不回 CORS，必須靠 host permission 略過）＋ PDF 下載權限，一次請求完
      // （不需要的權限不請求，彈窗只是噪音）。供應商查表是同步 DOM 讀取，user gesture 不會斷；
      // 權限請求必須是第一個 async 呼叫、前面不能有 await
      const origins = (typeof DueGradingRules !== 'undefined' && DueGradingRules.requiredOrigins)
        ? DueGradingRules.requiredOrigins($('ai-provider').value)
        : [];
      const perm = origins.length && chrome.permissions?.request
        ? chrome.permissions.request({ origins }).catch(() => false)
        : Promise.resolve(false);
      const config = readForm();
      perm
        .then(() => (chrome.storage?.local?.set ? chrome.storage.local.set({ aiConfig: config }) : null))
        .then(() => sendMsg({ type: 'AI_RUN_NOW' }))
        .catch(() => { })
        .finally(close);
    });

    $('ai-cancel-btn').addEventListener('click', close);

    // 點背景關閉：按下與放開都在背景才算（dashboard.js 的 trackBackdropPress／isBackdropClick，QA P2-9）——
    // 在 API key 欄位拖曳選字、放開在背景上，不會把 modal 連同未存的設定一起關掉
    if (typeof trackBackdropPress === 'function') trackBackdropPress(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target !== overlay) return;
      if (typeof isBackdropClick !== 'function' || isBackdropClick(overlay, e)) close();
    });
  }

  bind();
  applyStaticText();

  window.DueAiSettings = { open, close, applyLanguage, refreshStatus };
})();

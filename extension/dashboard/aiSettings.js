// ═══════════════════════════════════════════════════════════════
// Due AI 分析設定 modal（spec 2026-09-03）
// - 自帶三語字串，不塞 dashboard.js 的 I18N；dashboard.js 的 applyUILanguage 末尾呼叫 applyLanguage(lang)
// - 只寫 chrome.storage.local.aiConfig；分析狀態一律透過 AI_* 訊息向 background 取
// - 依賴（執行期才用到）：DueGradingRules（供應商預設）、openConfirmDialog／_currentData（dashboard.js 全域）
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const PDF_ORIGIN = 'https://*.canvas-user-content.com/*';

  const STRINGS = {
    'zh-TW': {
      menuItem: 'AI 分析設定',
      title: 'AI 分析設定',
      intro: '同步後自動從課程大綱抓出評分比重，寫進「手動權重」。每門課成功一次後不再重跑；沒填 API key 就不會啟用。',
      consent: '啟用後，課程大綱與相關 PDF 會直接從你的瀏覽器送到你選的供應商；開發者不會收到任何資料。按「儲存」即表示同意。',
      providerLabel: '供應商',
      apiKeyLabel: 'API key',
      modelLabel: '模型 ID',
      modelPlaceholder: '留空使用預設：{model}',
      baseUrlLabel: 'Base URL（進階）',
      textOnlyHint: '此供應商只能讀 syllabus 文字；大綱若是 PDF，建議改用 Gemini。',
      pdfHint: '尚未授權存取 canvas-user-content.com，只會分析 syllabus 文字。重新按「儲存」可再次授權。',
      testBtn: '測試連線',
      testing: '測試中…',
      testOk: '✓ 連線正常',
      testFail: '失敗：{error}',
      clearBtn: '清除金鑰',
      statusHeading: '分析狀態',
      notConfigured: '尚未設定 API key，分析不會執行。',
      summary: '已分析 {done} · 找不到大綱 {notFound} · 錯誤 {error} · 待分析 {pending}',
      lastRun: '上次分析 {time}',
      running: '分析中…',
      never: '尚未分析',
      noCourses: '尚無課程資料，請先同步。',
      stDone: '已分析',
      stNotFound: '找不到大綱',
      stError: '錯誤',
      stSkipped: '已有權重',
      stPending: '待分析',
      resetBtn: '清除分析紀錄並重新分析',
      resetConfirmTitle: '清除分析紀錄？',
      resetConfirmMsg: '所有課程的分析紀錄會清除；下次同步會為「沒有權重」的課程重新分析。已寫入的手動權重不會改動。',
      resetConfirmOk: '清除',
      cancel: '取消',
      save: '儲存',
      show: '顯示',
      hide: '隱藏',
    },
    'zh-CN': {
      menuItem: 'AI 分析设置',
      title: 'AI 分析设置',
      intro: '同步后自动从课程大纲提取评分比重，写入「手动权重」。每门课成功一次后不再重跑；未填 API key 不会启用。',
      consent: '启用后，课程大纲与相关 PDF 会直接从你的浏览器发送到你选择的供应商；开发者不会收到任何数据。点击「保存」即表示同意。',
      providerLabel: '供应商',
      apiKeyLabel: 'API key',
      modelLabel: '模型 ID',
      modelPlaceholder: '留空使用默认：{model}',
      baseUrlLabel: 'Base URL（高级）',
      textOnlyHint: '此供应商只能读取 syllabus 文本；大纲若为 PDF，建议改用 Gemini。',
      pdfHint: '尚未授权访问 canvas-user-content.com，只会分析 syllabus 文本。重新点击「保存」可再次授权。',
      testBtn: '测试连接',
      testing: '测试中…',
      testOk: '✓ 连接正常',
      testFail: '失败：{error}',
      clearBtn: '清除密钥',
      statusHeading: '分析状态',
      notConfigured: '尚未设置 API key，分析不会执行。',
      summary: '已分析 {done} · 未找到大纲 {notFound} · 错误 {error} · 待分析 {pending}',
      lastRun: '上次分析 {time}',
      running: '分析中…',
      never: '尚未分析',
      noCourses: '暂无课程数据，请先同步。',
      stDone: '已分析',
      stNotFound: '未找到大纲',
      stError: '错误',
      stSkipped: '已有权重',
      stPending: '待分析',
      resetBtn: '清除分析记录并重新分析',
      resetConfirmTitle: '清除分析记录？',
      resetConfirmMsg: '所有课程的分析记录将被清除；下次同步会为「没有权重」的课程重新分析。已写入的手动权重不会改动。',
      resetConfirmOk: '清除',
      cancel: '取消',
      save: '保存',
      show: '显示',
      hide: '隐藏',
    },
    en: {
      menuItem: 'AI analysis settings',
      title: 'AI analysis settings',
      intro: 'After each sync, Due reads the course syllabus and writes the grading weights into "manual weights". Each course is analyzed once; nothing runs until you add an API key.',
      consent: 'When enabled, the syllabus and related PDFs go straight from your browser to the provider you choose. The developer never receives any of it. Saving means you agree.',
      providerLabel: 'Provider',
      apiKeyLabel: 'API key',
      modelLabel: 'Model ID',
      modelPlaceholder: 'Leave blank for default: {model}',
      baseUrlLabel: 'Base URL (advanced)',
      textOnlyHint: 'This provider can only read the syllabus text. If your syllabus is a PDF, use Gemini.',
      pdfHint: 'Access to canvas-user-content.com was not granted, so only the syllabus text is analyzed. Press Save again to re-request.',
      testBtn: 'Test connection',
      testing: 'Testing…',
      testOk: '✓ Connected',
      testFail: 'Failed: {error}',
      clearBtn: 'Remove key',
      statusHeading: 'Analysis status',
      notConfigured: 'No API key set. Analysis will not run.',
      summary: 'Done {done} · No syllabus {notFound} · Error {error} · Pending {pending}',
      lastRun: 'Last run {time}',
      running: 'Analyzing…',
      never: 'Not run yet',
      noCourses: 'No courses yet. Sync first.',
      stDone: 'Done',
      stNotFound: 'No syllabus',
      stError: 'Error',
      stSkipped: 'Has weights',
      stPending: 'Pending',
      resetBtn: 'Clear records and re-analyze',
      resetConfirmTitle: 'Clear analysis records?',
      resetConfirmMsg: 'All analysis records are cleared; the next sync re-analyzes courses that have no weights. Manual weights already written are left untouched.',
      resetConfirmOk: 'Clear',
      cancel: 'Cancel',
      save: 'Save',
      show: 'Show',
      hide: 'Hide',
    },
  };

  const LOCALE = { 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', en: 'en-US' };

  let _lang = 'zh-TW';
  let _keyVisible = false;

  function t(key, vars) {
    const table = STRINGS[_lang] || STRINGS['zh-TW'];
    let s = table[key] || STRINGS['zh-TW'][key] || key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
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

  function readForm() {
    return {
      provider: $('ai-provider').value,
      apiKey: $('ai-api-key').value.trim(),
      model: $('ai-model').value.trim(),
      baseUrl: $('ai-base-url').value.trim(),
      consentedAt: new Date().toISOString(),
    };
  }

  // 切換供應商只更新 placeholder／提示，不清空使用者已輸入的欄位
  function updateProviderUi() {
    const p = providers()[$('ai-provider').value] || providers().gemini || {};
    $('ai-model').placeholder = t('modelPlaceholder', { model: p.defaultModel || '' });
    $('ai-api-key').placeholder = p.keyPlaceholder || '';
    $('ai-base-url').placeholder = p.baseUrl || '';
    $('ai-base-url-wrap').hidden = !!p.supportsPdf;      // Gemini 不需要 base URL
    $('ai-text-only-hint').hidden = !!p.supportsPdf;
  }

  function applyStaticText() {
    const menu = $('menu-ai-settings');
    if (menu) menu.textContent = t('menuItem');
    if (!$('ai-settings-overlay')) return;
    $('ai-settings-title').textContent = t('title');
    $('ai-settings-intro').textContent = t('intro');
    $('ai-settings-consent').textContent = t('consent');
    $('ai-provider-label').textContent = t('providerLabel');
    $('ai-api-key-label').textContent = t('apiKeyLabel');
    $('ai-model-label').textContent = t('modelLabel');
    $('ai-base-url-label').textContent = t('baseUrlLabel');
    $('ai-text-only-hint').textContent = t('textOnlyHint');
    $('ai-pdf-hint').textContent = t('pdfHint');
    $('ai-test-btn').textContent = t('testBtn');
    $('ai-clear-btn').textContent = t('clearBtn');
    $('ai-status-heading').textContent = t('statusHeading');
    $('ai-reset-btn').textContent = t('resetBtn');
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
    const list = $('ai-status-list');
    if (!st || st.error) { summary.textContent = ''; list.innerHTML = ''; return; }

    $('ai-pdf-hint').hidden = !(st.configured && !st.pdfPermission);

    if (!st.configured) {
      summary.textContent = t('notConfigured');
      list.innerHTML = '';
      $('ai-reset-btn').disabled = true;
      return;
    }
    $('ai-reset-btn').disabled = false;

    const counts = { done: 0, notFound: 0, error: 0, pending: 0, skipped: 0 };
    for (const c of st.courses) counts[c.status] = (counts[c.status] || 0) + 1;
    const lines = [t('summary', counts)];
    lines.push(st.running ? t('running') : (st.lastRunAt ? t('lastRun', { time: formatTime(st.lastRunAt) }) : t('never')));
    summary.textContent = lines.join('  ·  ');

    if (!st.courses.length) { list.innerHTML = `<li><span class="ai-status-name">${escapeHtml(t('noCourses'))}</span></li>`; return; }
    const label = { done: 'stDone', notFound: 'stNotFound', error: 'stError', skipped: 'stSkipped', pending: 'stPending' };
    list.innerHTML = st.courses.map((c) => `
      <li>
        <span class="ai-status-name" title="${escapeHtml(courseName(c.courseId))}">${escapeHtml(courseName(c.courseId))}</span>
        <span class="ai-status-state ${escapeHtml(c.status)}">${escapeHtml(t(label[c.status] || 'stPending'))}</span>
        ${c.status === 'error' && c.error ? `<span class="ai-status-error">${escapeHtml(c.error)}</span>` : ''}
      </li>`).join('');
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
      const res = await sendMsg({ type: 'AI_TEST_CONNECTION', config: readForm() });
      if (res && res.success) { out.textContent = t('testOk'); out.classList.add('ok'); }
      else { out.textContent = t('testFail', { error: (res && res.error) || 'no response' }); out.classList.add('fail'); }
    });

    $('ai-clear-btn').addEventListener('click', () => {
      $('ai-api-key').value = '';
      $('ai-model').value = '';
      $('ai-base-url').value = '';
      if (chrome.storage?.local?.remove) chrome.storage.local.remove('aiConfig', refreshStatus);
    });

    $('ai-reset-btn').addEventListener('click', () => {
      if (typeof openConfirmDialog !== 'function') return;
      openConfirmDialog({
        title: t('resetConfirmTitle'),
        message: t('resetConfirmMsg'),
        confirmLabel: t('resetConfirmOk'),
        cancelLabel: t('cancel'),
        onConfirm: () => { sendMsg({ type: 'AI_RESET_ANALYSIS' }).then(refreshStatus); },
      });
    });

    $('ai-save-btn').addEventListener('click', () => {
      // 權限請求必須在 user gesture 內、且在任何 await 之前呼叫，Chrome 才會顯示對話框；已授權時直接回 true
      const perm = chrome.permissions?.request
        ? chrome.permissions.request({ origins: [PDF_ORIGIN] }).catch(() => false)
        : Promise.resolve(false);
      const config = readForm();
      perm
        .then(() => (chrome.storage?.local?.set ? chrome.storage.local.set({ aiConfig: config }) : null))
        .then(() => sendMsg({ type: 'AI_RUN_NOW' }))
        .finally(close);
    });

    $('ai-cancel-btn').addEventListener('click', close);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  bind();
  applyStaticText();

  window.DueAiSettings = { open, close, applyLanguage, refreshStatus };
})();

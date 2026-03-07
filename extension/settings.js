const statusEl = document.getElementById('status');

// ── Load saved settings ──
chrome.storage.local.get(['aiModel', 'geminiApiKey', 'geminiModel', 'claudeApiKey'], (data) => {
  const model = data.aiModel || 'gemini';
  selectModel(model);

  if (data.geminiApiKey)  document.getElementById('gemini-key').value  = data.geminiApiKey;
  if (data.claudeApiKey)  document.getElementById('claude-key').value  = data.claudeApiKey;
  if (data.geminiModel)   document.getElementById('gemini-model').value = data.geminiModel;
});

// ── Model selector ──
document.querySelectorAll('input[name="ai-model"]').forEach((radio) => {
  radio.addEventListener('change', () => selectModel(radio.value));
});

function selectModel(model) {
  // Radio state
  document.querySelectorAll('input[name="ai-model"]').forEach((r) => {
    r.checked = (r.value === model);
  });

  // Visual state
  document.getElementById('opt-gemini').classList.toggle('active', model === 'gemini');
  document.getElementById('opt-claude').classList.toggle('active', model === 'claude');

  document.getElementById('section-gemini').classList.toggle('dimmed', model !== 'gemini');
  document.getElementById('section-claude').classList.toggle('dimmed', model !== 'claude');

  document.getElementById('badge-gemini').className = model === 'gemini' ? 'provider-badge active-badge' : 'provider-badge';
  document.getElementById('badge-gemini').textContent = model === 'gemini' ? '使用中' : '備用';

  document.getElementById('badge-claude').className = model === 'claude' ? 'provider-badge active-badge' : 'provider-badge';
  document.getElementById('badge-claude').textContent = model === 'claude' ? '使用中' : '備用';
}

// ── Toggle key visibility ──
document.querySelectorAll('.toggle-vis').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.textContent = isPassword ? '隱藏' : '顯示';
  });
});

// ── Save ──
document.getElementById('save-btn').addEventListener('click', () => {
  const aiModel = document.querySelector('input[name="ai-model"]:checked')?.value || 'gemini';
  const geminiKey = document.getElementById('gemini-key').value.trim();
  const geminiModel = document.getElementById('gemini-model').value.trim() || 'gemini-2.0-flash-lite';
  const claudeKey = document.getElementById('claude-key').value.trim();

  // Validate active model's key
  if (aiModel === 'gemini' && geminiKey && !geminiKey.startsWith('AIza')) {
    showStatus('Gemini 金鑰格式錯誤（應以 AIza 開頭）', 'err');
    return;
  }
  if (aiModel === 'claude' && claudeKey && !claudeKey.startsWith('sk-ant-')) {
    showStatus('Claude 金鑰格式錯誤（應以 sk-ant- 開頭）', 'err');
    return;
  }

  const payload = { aiModel, geminiModel };
  if (geminiKey) payload.geminiApiKey = geminiKey;
  if (claudeKey) payload.claudeApiKey = claudeKey;

  chrome.storage.local.set(payload, () => {
    showStatus('設定已儲存', 'ok');
  });
});

// ── Clear all keys ──
document.getElementById('clear-btn').addEventListener('click', () => {
  chrome.storage.local.remove(['geminiApiKey', 'claudeApiKey'], () => {
    document.getElementById('gemini-key').value = '';
    document.getElementById('claude-key').value = '';
    showStatus('所有金鑰已清除', 'ok');
  });
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 3000);
}

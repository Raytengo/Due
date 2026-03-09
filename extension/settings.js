const statusEl = document.getElementById('status');

const PROVIDERS = {
  gemini: {
    label: 'Google Gemini',
    keyPlaceholder: 'AIza...',
    baseUrlDefault: 'https://generativelanguage.googleapis.com/v1beta',
    modelHint: '請自行輸入模型，例如：gemini-2.5-flash',
    baseUrlHint: 'Gemini 通常用預設 base URL。',
  },
  anthropic: {
    label: 'Anthropic Claude',
    keyPlaceholder: 'sk-ant-...',
    baseUrlDefault: 'https://api.anthropic.com',
    modelHint: '請自行輸入模型，例如：claude-sonnet-4-5',
    baseUrlHint: 'Anthropic 通常用預設 base URL。',
  },
  openai: {
    label: 'OpenAI',
    keyPlaceholder: 'sk-...',
    baseUrlDefault: 'https://api.openai.com/v1',
    modelHint: '請自行輸入模型，例如：gpt-5.2',
    baseUrlHint: 'OpenAI 預設為 https://api.openai.com/v1。',
  },
  qwen: {
    label: 'Qwen (通義千問)',
    keyPlaceholder: 'sk-...',
    baseUrlDefault: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelHint: '請自行輸入模型，例如：qwen-plus',
    baseUrlHint: 'DashScope 使用 OpenAI 相容 endpoint。',
  },
  minimax: {
    label: 'MiniMax',
    keyPlaceholder: 'sk-...',
    baseUrlDefault: 'https://api.minimax.chat/v1',
    modelHint: '請自行輸入模型，例如：MiniMax-M1',
    baseUrlHint: 'MiniMax 使用 OpenAI 相容 endpoint。',
  },
};

function setProviderUI(provider, keepCustom = false) {
  const cfg = PROVIDERS[provider] || PROVIDERS.gemini;

  const providerSelect = document.getElementById('provider-select');
  if (providerSelect) providerSelect.value = provider;

  document.getElementById('provider-title').textContent = cfg.label;
  document.getElementById('provider-key').placeholder = cfg.keyPlaceholder;
  document.getElementById('provider-model-hint').textContent = cfg.modelHint;
  document.getElementById('provider-base-url-hint').textContent = cfg.baseUrlHint;

  if (!keepCustom) {
    document.getElementById('provider-model').value = '';
    document.getElementById('provider-base-url').value = cfg.baseUrlDefault;
  }
}

// ── Load saved settings ──
chrome.storage.local.get([
  'aiProvider', 'aiApiKey', 'aiModelId', 'aiBaseUrl',
  'aiModel', 'geminiApiKey', 'geminiModel', 'claudeApiKey', 'claudeModel',
], (data) => {
  let provider = data.aiProvider;
  if (!provider) {
    provider = data.aiModel === 'claude' ? 'anthropic' : 'gemini';
  }
  if (!PROVIDERS[provider]) {
    provider = 'gemini';
  }

  setProviderUI(provider, true);

  // New unified keys first, then fallback to legacy keys.
  const legacyKey = provider === 'gemini' ? data.geminiApiKey : provider === 'anthropic' ? data.claudeApiKey : '';
  const legacyModel = provider === 'gemini' ? data.geminiModel : provider === 'anthropic' ? data.claudeModel : '';

  document.getElementById('provider-key').value = data.aiApiKey || legacyKey || '';
  document.getElementById('provider-model').value = data.aiModelId || legacyModel || '';
  document.getElementById('provider-base-url').value = data.aiBaseUrl || (PROVIDERS[provider]?.baseUrlDefault || '');
});

// ── Provider selector ──
document.getElementById('provider-select').addEventListener('change', (e) => {
  setProviderUI(e.target.value);
});

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
  const provider = document.getElementById('provider-select').value || 'gemini';
  const key = document.getElementById('provider-key').value.trim();
  const modelId = document.getElementById('provider-model').value.trim();
  const baseUrl = document.getElementById('provider-base-url').value.trim() || PROVIDERS[provider].baseUrlDefault;

  if (!key) {
    showStatus('請先輸入 API 金鑰', 'err');
    return;
  }
  if (!modelId) {
    showStatus('請先輸入模型 ID', 'err');
    return;
  }

  if (provider === 'gemini' && !key.startsWith('AIza')) {
    showStatus('Gemini 金鑰格式通常以 AIza 開頭', 'err');
    return;
  }
  if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
    showStatus('Anthropic 金鑰格式通常以 sk-ant- 開頭', 'err');
    return;
  }

  const payload = {
    aiProvider: provider,
    aiApiKey: key,
    aiModelId: modelId,
    aiBaseUrl: baseUrl,
    // legacy compatibility
    aiModel: provider === 'anthropic' ? 'claude' : 'gemini',
    geminiApiKey: provider === 'gemini' ? key : '',
    claudeApiKey: provider === 'anthropic' ? key : '',
    geminiModel: provider === 'gemini' ? modelId : '',
    claudeModel: provider === 'anthropic' ? modelId : '',
  };

  chrome.storage.local.set(payload, () => {
    showStatus('設定已儲存', 'ok');
  });
});

// ── Clear key ──
document.getElementById('clear-btn').addEventListener('click', () => {
  chrome.storage.local.remove(['aiApiKey', 'geminiApiKey', 'claudeApiKey'], () => {
    document.getElementById('provider-key').value = '';
    showStatus('API 金鑰已清除', 'ok');
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

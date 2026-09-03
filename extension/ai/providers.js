(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueAiProviders = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ═══════════════════════════════════════════════════════════════
  // Due AI 供應商層：只負責「組請求」與「取回應文字」，不 fetch（可在 node 測試）
  // gemini → 原生 generateContent（支援 PDF inlineData；key 走 header，不進 URL）
  // 其餘（qwen / deepseek / 任何 OpenAI 相容）→ {baseUrl}/chat/completions（純文字）
  // 只送供應商需要的 header：Gemini 對 preflight 帶未知 header 會回 403
  // ═══════════════════════════════════════════════════════════════

  function normalizeBaseUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
  }

  function supportsPdf(provider) {
    return provider === 'gemini';
  }

  // cfg: resolveConfig() 的結果；parts: [{type:'text', text} | {type:'pdf', base64, mimeType}]
  // 回 { url, headers, body }，body 為物件（呼叫端 JSON.stringify）
  function buildRequest(cfg, parts, systemPrompt, opts) {
    const o = opts || {};
    const maxTokens = o.maxTokens || 2048;
    const temperature = o.temperature;

    if (cfg.provider === 'gemini') {
      const geminiParts = parts.map((p) =>
        p.type === 'pdf'
          ? { inlineData: { mimeType: p.mimeType || 'application/pdf', data: p.base64 } }
          : { text: p.text }
      );
      const generationConfig = { maxOutputTokens: maxTokens };
      if (temperature !== undefined) generationConfig.temperature = temperature;
      const body = { contents: [{ parts: geminiParts }], generationConfig };
      if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
      return {
        url: `${normalizeBaseUrl(cfg.baseUrl)}/models/${encodeURIComponent(cfg.model)}:generateContent`,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
        body,
      };
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({
      role: 'user',
      content: parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n\n'),
    });
    const body = { model: cfg.model, messages, max_tokens: maxTokens };
    if (temperature !== undefined) body.temperature = temperature;
    return {
      url: `${normalizeBaseUrl(cfg.baseUrl)}/chat/completions`,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body,
    };
  }

  function extractText(provider, json) {
    if (provider === 'gemini') {
      const cand = json && Array.isArray(json.candidates) ? json.candidates[0] : null;
      const parts = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts : [];
      const text = parts.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('');
      if (!text.trim()) throw new Error('Empty response');
      return text;
    }
    const choice = json && Array.isArray(json.choices) ? json.choices[0] : null;
    const text = choice && choice.message ? choice.message.content : '';
    if (typeof text !== 'string' || !text.trim()) throw new Error('Empty response');
    return text;
  }

  return { normalizeBaseUrl, supportsPdf, buildRequest, extractText };
});

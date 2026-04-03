// Main world — patches window.fetch to intercept Claude's API calls.
// 1. Learns orgId from ANY /api/organizations/{id}/... call (happens on every page load)
// 2. Captures full usage data when /usage endpoint is called
(function () {
  const ORG_RE = /\/api\/organizations\/([0-9a-f-]{36})/i;
  const USAGE_RE = /\/api\/organizations\/([0-9a-f-]{36})\/usage/i;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url = typeof args[0] === 'string' ? args[0]
        : (args[0] instanceof Request ? args[0].url : '');

      const orgMatch = url.match(ORG_RE);
      if (orgMatch) {
        const orgId = orgMatch[1];

        if (USAGE_RE.test(url)) {
          // Full usage data — capture response body
          response.clone().json().then((data) => {
            window.postMessage({ type: '__DUE_CLAUDE_USAGE__', orgId, data }, '*');
          }).catch(() => {});
        } else {
          // Just learn the orgId silently (no response body needed)
          window.postMessage({ type: '__DUE_CLAUDE_ORG_ID__', orgId }, '*');
        }
      }
    } catch (_) {}

    return response;
  };
})();

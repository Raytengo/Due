(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueSchools = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // 空狀態「選擇你的學校」的純規則：清單建索引、搜尋排序、把貼上的網址變成 origin。
  // 清單 schools.json 由 scripts/build-schools.py 從 Canvas 官方「找學校」API 重建（只含 *.instructure.com）。
  // 這裡不碰 DOM、不碰 chrome.*，UI 在 schoolPickerUi.js。

  const SUFFIX = '.instructure.com';
  const DEFAULT_SUB = 'hkust-gz';

  // 置頂的學校（空查詢時排最前，順序即顯示順序）與中文別名（Canvas 上只有英文名，中文使用者打不出來）；
  // short：Canvas 全名太長、放不進選單欄位時的顯示名（全名仍可搜）
  const FEATURED = [
    { sub: 'hkust-gz', short: 'HKUST (Guangzhou)', alias: '港科大廣州 港科廣 香港科技大學廣州 香港科技大学广州 港科大广州' },
    { sub: 'cityu-dg', alias: '城大東莞 香港城市大學東莞 香港城市大学东莞 城大东莞' },
    { sub: 'ln', alias: '嶺南大學 岭南大学 嶺大' },
    { sub: 'hkapa', alias: '香港演藝學院 香港演艺学院 演藝' },
  ];

  // 與 background.js 的 isCanvasHost 同一組規則：不收 www／status／community／support／info，也不收 beta／test 環境
  const NON_CANVAS_SUBDOMAINS = ['www', 'status', 'community', 'support', 'info'];

  function normalize(s) {
    return String(s == null ? '' : s)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  function originOf(sub) {
    return `https://${sub}${SUFFIX}`;
  }

  function isSelectableSub(sub) {
    if (!sub || typeof sub !== 'string') return false;
    const labels = sub.split('.');
    if (labels.some((l) => !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(l))) return false;
    if (NON_CANVAS_SUBDOMAINS.includes(labels[0])) return false;
    return !labels.some((l) => l === 'beta' || l === 'test');
  }

  // 使用者貼上的網址或主機名 → { sub, origin }；不是 https 的 *.instructure.com 就 null
  // （接受「https://x.instructure.com/courses/1」「x.instructure.com」「X.INSTRUCTURE.COM/」）
  function parseInstructure(text) {
    let t = String(text == null ? '' : text).trim();
    if (!t || /\s/.test(t)) return null;
    if (/^http:\/\//i.test(t)) return null;
    if (!/^https:\/\//i.test(t)) t = `https://${t}`;
    let host;
    try {
      host = new URL(t).hostname.toLowerCase();
    } catch (_) {
      return null;
    }
    if (!host.endsWith(SUFFIX)) return null;
    const sub = host.slice(0, -SUFFIX.length);
    if (!isSelectableSub(sub)) return null;
    return { sub, origin: originOf(sub) };
  }

  // rows：schools.json 的 [[sub, name], ...]。回傳可搜尋的條目（保持原順序），並把置頂的學校標記出來
  function buildIndex(rows) {
    const featuredRank = new Map(FEATURED.map((f, i) => [f.sub, i]));
    const aliasOf = new Map(FEATURED.map((f) => [f.sub, f.alias]));
    const shortOf = new Map(FEATURED.filter((f) => f.short).map((f) => [f.sub, f.short]));
    const entries = [];
    for (const row of Array.isArray(rows) ? rows : []) {
      const sub = row && row[0];
      const name = row && row[1];
      if (!isSelectableSub(sub) || !name) continue;
      const alias = aliasOf.get(sub) || '';
      entries.push({
        sub,
        name: shortOf.get(sub) || name,
        origin: originOf(sub),
        host: `${sub}${SUFFIX}`,
        featured: featuredRank.has(sub) ? featuredRank.get(sub) : -1,
        nameKey: normalize(shortOf.has(sub) ? `${shortOf.get(sub)} ${name}` : name),
        aliasKey: normalize(alias),
        subKey: normalize(sub),
      });
    }
    return entries;
  }

  // 單一詞對一個條目的分數（0＝不符）：名稱詞首 3、別名 3、名稱內任意位置 2、網域 1
  function tokenScore(entry, token) {
    if (entry.nameKey.split(' ').some((w) => w.startsWith(token))) return entry.nameKey.startsWith(token) ? 4 : 3;
    if (entry.aliasKey && entry.aliasKey.includes(token)) return 3;
    if (entry.nameKey.includes(token)) return 2;
    if (entry.subKey.includes(token)) return 1;
    return 0;
  }

  // 空查詢：置頂的學校在前、其餘照名稱順序；有查詢：每個詞都要符合，分數高、置頂、名稱短的在前
  function search(index, query, { limit = Infinity } = {}) {
    const q = normalize(query);
    if (!q) {
      const featured = index.filter((e) => e.featured >= 0).sort((a, b) => a.featured - b.featured);
      const rest = index.filter((e) => e.featured < 0);
      return featured.concat(rest).slice(0, limit);
    }
    const tokens = q.split(' ');
    const hits = [];
    for (const e of index) {
      let total = 0;
      let ok = true;
      for (const t of tokens) {
        const s = tokenScore(e, t);
        if (!s) { ok = false; break; }
        total += s;
      }
      if (ok) hits.push({ e, total });
    }
    hits.sort((a, b) =>
      b.total - a.total
      || (b.e.featured >= 0) - (a.e.featured >= 0)
      || a.e.name.length - b.e.name.length
      || a.e.name.localeCompare(b.e.name));
    return hits.slice(0, limit).map((h) => h.e);
  }

  return {
    SUFFIX,
    DEFAULT_SUB,
    FEATURED,
    normalize,
    originOf,
    isSelectableSub,
    parseInstructure,
    buildIndex,
    search,
  };
});

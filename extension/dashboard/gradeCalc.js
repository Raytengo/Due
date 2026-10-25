(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueGradeCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // 成績計算的純規則（spec 2026-10-25-semester-grades）：課程詳情的成績計算器與「學期成績」總覽共用。
  // 權重來源與圓餅一致（自訂優先 → Canvas 實際加權 → 沒有）；自訂權重項目與作業的對應走 matchItem 五層，
  // 原則是寧可不算、不可算錯：只有唯一最佳候選才自動歸類，其餘「未歸類」並在畫面上標出來

  // ── 權重來源 ──
  // Canvas 是否實際依分組加權：課程關掉「依組別加權」時 API 仍可能帶著殘留的 group_weight → 不算（QA #93）
  function usesGroupWeights(course, groups) {
    if (course && course.apply_assignment_group_weights === false) return false;
    return (groups || []).some((g) => g && Number(g.group_weight) > 0);
  }

  // 'custom'｜'canvas'｜'none'。customWeights 是陣列＝使用者（或 AI）的覆寫：總和 0／空陣列＝明確「不顯示權重」，
  // 不回退 Canvas（與 renderWeightPie 相同，QA #168）
  function weightMode(course, groups, customWeights) {
    if (Array.isArray(customWeights)) {
      const total = customWeights.reduce((s, c) => s + (Number(c && c.weight) || 0), 0);
      return total > 0 ? 'custom' : 'none';
    }
    return usesGroupWeights(course, groups) ? 'canvas' : 'none';
  }

  function inGroup(a, g) {
    if (!a || !g) return false;
    if (a.assignment_group_id != null) return a.assignment_group_id === g.id;
    return !!(g.assignments && g.assignments.some((ga) => ga.id === a.id));
  }

  // ── 分數 ──
  function isExcused(a) {
    return !!(a && a.submission && a.submission.excused);
  }

  function ownScore(scores, a) {
    return !!scores && Object.prototype.hasOwnProperty.call(scores, a.id);
  }

  // 輸入框要顯示的值（三態）：scores 有該 id → null＝使用者清空過（空）、數字照顯示；沒有 → Canvas 已評分就預填
  function inputValue(a, scores) {
    if (ownScore(scores, a)) return scores[a.id] === null ? '' : scores[a.id];
    if (a && a.submission && a.submission.score != null) return a.submission.score;
    return '';
  }

  // 計入計算的分數：已免除不計（殘留手動值也忽略，QA #94）；負數、非數字不計（QA #25）
  function effectiveScore(a, scores) {
    if (!a || isExcused(a)) return null;
    const v = inputValue(a, scores);
    if (v === '' || v == null) return null;
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  // ── 名稱 → 關鍵字 ──
  // 同義詞歸到同一個 key（英文比對整字、中文比對子字串）
  const SYNONYMS = {
    homework: ['homework', 'hw', 'assignment', 'exercise', '作業', '作业', '習題', '习题', '功課', '功课'],
    quiz: ['quiz', '測驗', '测验', '小測', '小测', '小考'],
    exam: ['exam', 'examination', 'test', '考試', '考试'],
    midterm: ['midterm', '期中'],
    final: ['final', '期末'],
    project: ['project', '專題', '专题', '專案', '专案', '項目', '项目', '大作業', '大作业'],
    lab: ['lab', 'laboratory', '實驗', '实验'],
    participation: ['participation', 'attendance', 'engagement', '出席', '出勤', '參與', '参与'],
    presentation: ['presentation', '簡報', '简报', '展示', '演講', '演讲'],
    report: ['report', '報告', '报告'],
    paper: ['paper', 'essay', '論文', '论文'],
    reading: ['reading', '閱讀', '阅读'],
  };
  const LATIN_SYN = new Map();
  const CJK_SYN = [];
  Object.keys(SYNONYMS).forEach((key) => {
    SYNONYMS[key].forEach((w) => {
      if (/^[a-z]+$/.test(w)) LATIN_SYN.set(w, key);
      else CJK_SYN.push([w, key]);
    });
  });
  // 太泛、各項目都可能有的字：不當 key（否則「In-class Quiz」會因 class 跟「Class Participation」平手）
  const STOP = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'per', 'via', 'all', 'not', 'any', 'each', 'your', 'our',
    'week', 'part', 'phase', 'unit', 'module', 'chapter', 'session', 'section', 'course', 'class', 'lecture',
    'group', 'team', 'individual', 'submission', 'submit', 'online', 'due', 'total', 'score', 'grade', 'point',
    'pts', 'weight', 'weighting', 'component', 'assessment', 'one', 'two', 'three', 'first', 'second', 'third',
  ]);
  const CJK_RE = /[㐀-鿿豈-﫿]/;

  function normalize(s) {
    return String(s == null ? '' : s).normalize('NFKC').toLowerCase().replace(/mid[\s_-]*term/g, 'midterm');
  }

  // 單複數歸一：quizzes→quiz、studies→study、classes→class、labs→lab（不追求語言學正確，兩邊一致即可）
  function singular(w) {
    if (w.length > 4 && w.endsWith('zzes')) return w.slice(0, -3);
    if (w.length > 4 && /(sses|shes|ches|xes)$/.test(w)) return w.slice(0, -2);
    if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  }

  function keysOf(text) {
    const s = normalize(text);
    const keys = new Set();
    (s.match(/[a-z]+/g) || []).forEach((w) => {
      const sw = singular(w);
      const syn = LATIN_SYN.get(sw) || LATIN_SYN.get(w);
      if (syn) keys.add(syn);
      else if (sw.length >= 3 && !STOP.has(sw) && !STOP.has(w)) keys.add(`w:${sw}`);
    });
    CJK_SYN.forEach(([needle, key]) => { if (s.includes(needle)) keys.add(key); });
    // 只有 midterm／final、沒有別的字 →「Midterm」「期末考」就是考試；「Final Project」「Final Portfolio」不是
    if (keys.size && [...keys].every((k) => k === 'midterm' || k === 'final')) keys.add('exam');
    return keys;
  }

  // 比對用的整串名稱：英文字單數化、去掉標點空白（「Quizzes」＝「Quiz」）
  function compactName(text) {
    return normalize(text)
      .replace(/[a-z]+/g, (w) => singular(w))
      .replace(/[^a-z0-9㐀-鿿豈-﫿]+/g, '');
  }

  function itemInfo(item) {
    const name = (item && item.name) || '';
    const compact = compactName(name);
    return { keys: keysOf(name), compact, cjk: CJK_RE.test(compact) };
  }

  function textInfo(text) {
    return { keys: keysOf(text), compact: compactName(text) };
  }

  // 交集數；項目名稱含中文且整串出現在文字裡再加 1（給沒有關鍵字的中文名稱，例如「論文」對「期末論文」）
  function score(info, text) {
    let n = 0;
    info.keys.forEach((k) => { if (text.keys.has(k)) n += 1; });
    if (info.cjk && info.compact.length >= 2 && text.compact.includes(info.compact)) n += 1;
    return n;
  }

  // 唯一最佳；平手或零分 → -1
  function bestIndex(infos, text) {
    let best = -1;
    let bestScore = 0;
    let tie = false;
    infos.forEach((info, i) => {
      const sc = score(info, text);
      if (sc > bestScore) {
        best = i;
        bestScore = sc;
        tie = false;
      } else if (sc > 0 && sc === bestScore) {
        tie = true;
      }
    });
    return bestScore > 0 && !tie ? best : -1;
  }

  // 一筆作業歸到哪個自訂權重項目（依序取第一個有結果的）：
  //   1 手動指定（override：字串＝項目名稱、null＝不計入；名稱已不在 → 當作沒指定）
  //   2 作業名稱關鍵字唯一最佳  3 Canvas 組名與項目名稱相同  4 Canvas 組名關鍵字唯一最佳  5 未歸類
  // 作業名稱先於組名：組是容器層級的證據，Canvas 預設的「Assignments」組常把期中考也裝在裡面。
  // groupMixed：同組作業依 1、2 已對到兩個以上不同項目＝大雜燴組，組名不可信 → 跳過 3、4（由 plan 算）
  function matchItem({ assignment, groupName, items, override, infos, groupMixed = false }) {
    const list = items || [];
    if (override === null) return { index: -1, how: 'excluded' };
    if (typeof override === 'string') {
      const i = list.findIndex((it) => ((it && it.name) || '') === override);
      if (i >= 0) return { index: i, how: 'manual' };
    }
    const its = infos || list.map(itemInfo);
    const byName = bestIndex(its, textInfo(assignment && assignment.name));
    if (byName >= 0) return { index: byName, how: 'name' };
    if (groupName && !groupMixed) {
      const g = textInfo(groupName);
      const same = g.compact ? its.findIndex((info) => info.compact === g.compact) : -1;
      if (same >= 0) return { index: same, how: 'group' };
      const byGroup = bestIndex(its, g);
      if (byGroup >= 0) return { index: byGroup, how: 'groupKeys' };
    }
    return { index: -1, how: 'none' };
  }

  // ── 計算結構 ──
  // plan：哪些作業、各歸哪一桶（不含分數）。桶＝Canvas 分組（canvas）或自訂權重項目（custom）。
  // 只收有配分的作業（含已免除：畫面上要列出「已免除」）；row.bucket＝-1 表示不進任何桶
  function plan({ course, groups, assignments, customWeights, itemMap }) {
    const gs = groups || [];
    const mode = weightMode(course, gs, customWeights);
    if (mode === 'none') return { mode, buckets: [], rows: [] };
    const eligible = (assignments || []).filter((a) => a && Number(a.points_possible) > 0);
    if (mode === 'canvas') {
      return {
        mode,
        buckets: gs.map((g) => ({ name: g.name || '', weight: Number(g.group_weight) || 0, groupId: g.id })),
        rows: eligible.map((a) => ({ a, bucket: gs.findIndex((g) => inGroup(a, g)), how: 'group' })),
      };
    }
    const infos = customWeights.map(itemInfo);
    const map = itemMap || {};
    // 第一輪只看手動指定與作業名稱；同時記下每組對到哪些項目，對到兩個以上＝大雜燴組
    const first = eligible.map((a) => {
      const g = gs.find((x) => inGroup(a, x)) || null;
      const override = Object.prototype.hasOwnProperty.call(map, a.id) ? map[a.id] : undefined;
      return { a, g, m: matchItem({ assignment: a, groupName: '', items: customWeights, override, infos }) };
    });
    const hits = new Map();
    first.forEach(({ g, m }) => {
      if (!g || m.index < 0) return;
      if (!hits.has(g)) hits.set(g, new Set());
      hits.get(g).add(m.index);
    });
    return {
      mode,
      buckets: customWeights.map((c) => ({ name: (c && c.name) || '', weight: Number(c && c.weight) || 0 })),
      rows: first.map(({ a, g, m }) => {
        const final = m.how !== 'none' || !g ? m : matchItem({
          assignment: a, groupName: g.name, items: customWeights, infos,
          groupMixed: !!(hits.get(g) && hits.get(g).size >= 2),
        });
        return { a, bucket: final.index, how: final.how };
      }),
    };
  }

  // compute：各桶有成績的作業 Σearned/Σpossible；總分＝Σ(桶百分比×權重)/Σ(有成績的桶的權重)——
  // 只算已評分的部分，未評分不當 0 分（與 Canvas「目前成績」同義）。scoreOf(a) 回傳數字或 null
  function compute(p, scoreOf) {
    const n = p.buckets.length;
    const earned = new Array(n).fill(0);
    const possible = new Array(n).fill(0);
    let unmappedGraded = 0;
    p.rows.forEach((r) => {
      const s = isExcused(r.a) ? null : scoreOf(r.a);
      if (!Number.isFinite(s)) return;
      if (r.bucket < 0) {
        if (r.how === 'none') unmappedGraded += 1;
        return;
      }
      earned[r.bucket] += s;
      possible[r.bucket] += Number(r.a.points_possible);
    });
    let weightedSum = 0;
    let gradedWeight = 0;
    let totalWeight = 0;
    const buckets = p.buckets.map((b, i) => {
      totalWeight += b.weight;
      const ratio = possible[i] > 0 ? earned[i] / possible[i] : null;
      if (ratio != null) {
        weightedSum += ratio * b.weight;
        gradedWeight += b.weight;
      }
      return { ...b, earned: earned[i], possible: possible[i], percent: ratio == null ? null : ratio * 100 };
    });
    return {
      mode: p.mode,
      percent: gradedWeight > 0 ? (weightedSum / gradedWeight) * 100 : null,
      gradedWeight,
      totalWeight,
      buckets,
      unmappedGraded,
    };
  }

  // 一門課目前的成績（總覽用；scores 為 storage 的手動分數 map）
  function courseGrade({ course, groups, assignments, scores, customWeights, itemMap }) {
    return compute(plan({ course, groups, assignments, customWeights, itemMap }), (a) => effectiveScore(a, scores));
  }

  return {
    usesGroupWeights,
    weightMode,
    inGroup,
    inputValue,
    effectiveScore,
    keysOf,
    matchItem,
    plan,
    compute,
    courseGrade,
  };
});

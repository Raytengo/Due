(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueTaskRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ═══════════════════════════════════════════════════════════════
  // Due 任務分類與緊急度規則（單一真相來源，dashboard 與 popup 共用）
  // 背景：2026-07-21 決策——考試類永久隱藏，但判定關鍵字必須收緊以防
  //       誤殺一般作業（「期中小組報告」曾被舊版含「期中」的規則吞掉）。
  // 原則：藏掉一份要交的東西會讓學生錯過截止，遠比多顯示一場考試嚴重——不確定時寧可顯示。
  // 判定順序（2026-10-23 B2）：
  //   1. 自訂作業 → 一律不是考試/簽到
  //   2. Canvas 測驗（is_quiz_assignment / online_quiz）→ 考試
  //   3. 繳交方式是交件型 → 一定要交東西 → 不是考試/簽到（結構規則，扛下絕大多數真實案例）
  //   4. 其餘（繳交方式缺漏或為 on_paper / none / not_graded / external_tool…）才看名稱
  // ═══════════════════════════════════════════════════════════════

  // ── 1. 自訂作業不套分類器（QA P1-6，#6/#71/#96）──
  // 使用者親手建立的待辦（_isCustom）是明確宣告「要做的事」，名稱含 Midterm/Quiz/簽到
  // 多半是「準備考試」這類提醒。守在分類器入口 → 自動隱藏、考試結束自動完成、考試紫色一次排除。
  function isCustom(assignment) {
    return !!(assignment && assignment._isCustom);
  }

  // ── 2/3. 結構規則：Canvas 繳交方式 ──
  // 交件型＝學生要上傳/填文字/貼網址/錄音錄影/在文件上批註/在討論區發文：不論名稱叫 Final Exam、
  // Take-home Midterm 還是 Attendance，都是有截止日的待交物（截止後也能補交，不是「考完就結束」）。
  // external_tool 不算交件型：Gradescope 等工具同時用於考試與作業，交給名稱判定。
  const DELIVERABLE_TYPES = ['online_upload', 'online_text_entry', 'online_url', 'media_recording', 'student_annotation', 'discussion_topic'];

  function submissionTypes(assignment) {
    return Array.isArray(assignment.submission_types) ? assignment.submission_types : [];
  }

  function requiresSubmission(assignment) {
    return submissionTypes(assignment).some((type) => DELIVERABLE_TYPES.includes(type));
  }

  // classic quiz：submission_types 含 online_quiz；is_quiz_assignment（Canvas 文件描述為 quiz LTI 旗標，
  // 即 New Quizzes，其 submission_types 為 external_tool）——任一成立即為測驗（2026-07 決策：線上測驗照樣隱藏）
  function isCanvasQuiz(assignment) {
    return !!assignment.is_quiz_assignment || submissionTypes(assignment).includes('online_quiz');
  }

  // ── 4. 名稱備援規則：分段 + 段內中心語在後 ──
  // 中英文名詞片語的中心語都在最後：「作業系統期中考」是考試、「期中考論文」是論文、
  // 「Paper Reading Quiz 1」是 quiz、「Midterm Paper」是 paper。
  //  a. 前導括號標籤自成一段（「[Quiz] Chapter 3」「【期中考】作業系統」），其餘括號旁註 (…)（…）[…]【…】拿掉
  //     ——旁註只是說明範圍：「Midterm Exam (covers Homework 1-4)」仍是考試
  //  b. 依「: ： – — | ｜」與「 - 」切段：分隔號後多半是主題副標（Quiz 1 - Software Project Management）；
  //     破折號兩側都是數字是範圍不切（Homework 1–3 Quiz 是 quiz）
  //  c. 每段去掉尾端介系詞子句（第一個 on / for / about / covering / of 之後）：「In-class Quiz on Assignment 2」
  //     是 quiz、「Reflection on Quiz 2」是反思；但「Make-up for / Part 1 of / Retake of」之後才是考試本身，保留
  //  d. 由左而右第一個含分類詞或交付物詞的段落決定：
  //     - 段內最後一個關鍵詞是交付物 → 交付物（Project Report – Midterm、Reflection: Quiz 2）
  //     - 段內是強分類詞（exam / quiz / test N / 考試詞 / 簽到詞）→ 成立，除非後面某段整段就是交付物（Quiz 2: Corrections）
  //     - 段內只有弱分類詞 midterm（期中這個時段）→ 後段或旁註提到交付物就算交付物（Midterm: Project Report、
  //       Midterm (Group Presentation)）
  // 已知仍模稜兩可（名稱本身無法分辨，結構規則多半已先處理；名稱判定時偏向顯示）：
  //   「Attendance Check: Final Presentation」→ 顯示（後段整段是交付物）；「Quiz 1 — Exercises 1.1-1.5」→ 顯示；
  //   「Midterm Exam Seating Plan」→ 顯示（plan 在最後）；「Quiz 2 (Corrections)」→ 隱藏（強分類詞不看旁註）；
  //   「Midterm Practice / Midterm Prep」→ 顯示（midterm 後接一般詞不算中心語）；
  //   「Midterm Assessment」→ 顯示（assessment 也可能是簡報/作品評量）；「Final Exam: Written Paper」→ 顯示（後段整段是交付物）；
  //   「Team Check-in / Group Check-in」→ 顯示（團隊進度會議要準備進度，見 NOT_ATTENDANCE_RE）；
  //   「Attendance Tracker App (Project 2)」→ 隱藏（旁註不看；交件型時由結構規則顯示）。

  // midterm 後的序號：2 / #2 / -2、羅馬數字 II、版本字母 A–D（後面不能緊接字母：Midterm Video / Design 不算）
  const MIDTERM_ORDINAL = '(?:\\d+|[IVX]{1,3}(?![a-z])|[A-D](?![a-z]))';
  // 英文 exam / quiz 需完整詞（Examination 單獨不算：Examination of algorithms）；複數不算（多為分組名）。
  // midterm / final 後接 test / examination（可夾序號）是明確的考試說法：Midterm Test、Midterm II Examination、
  // Final Examination——強分類詞，旁註提到交付物也照算；軟體課的 test cases / suites / scripts 不算
  const EXAM_STRONG_EN_RE = new RegExp(
    '\\b(?:exam|quiz|(?:mid[\\s-]?terms?|final)(?:[\\s#_-]*' + MIDTERM_ORDINAL + ')?[\\s-]+'
    + '(?:examinations?|tests?(?![\\s-]*(?:cases?|suites?|scripts?)\\b)))\\b',
    'i'
  );
  // midterm（期中這個時段）是弱分類詞，只在下列情況是中心語：單獨、接序號、接逗號，或後面是「考試本身」的說法——
  // review（考前複習）、retake / make-up / resit、part N、online / in-class / in-person / closed-book、grade / score / marks
  // （紙本/現場考試只能靠名稱判定，這些漏掉會讓考完的考試掛在「已逾期」）；
  // 「Midterm Prototype」「Midterm Pitch」的中心語是後面那個詞
  const EXAM_MIDTERM_RE = new RegExp(
    '\\bmid[\\s-]?terms?(?=[\\s#_-]*' + MIDTERM_ORDINAL + '?\\s*(?:$|,|(?:review|retakes?|make[\\s-]?ups?|resits?'
    + '|part\\s*' + MIDTERM_ORDINAL + '|online|in[\\s-]?(?:class|person)|(?:closed|open)[\\s-]?book|grades?|scores?|marks?)(?![a-z])))',
    'i'
  );
  // test 必須接數字（Test 1、Test-2、Test #3），避免「Test plan」「Testing report」誤殺；
  // 軟體/HCI/統計的 Unit Test 3、Usability Test 1、A/B Test 1、t-test 2 不是考試
  const EXAM_EN_TEST_RE = /(?<!\b(?:unit|usability|user|a\/b|ab|beta|integration|load|stress|pilot|regression|acceptance|t)[\s-]*)\btest\s*[-#]?\d/i;
  // 中文只匹配明確考試詞；單獨「期中」「期末」不匹配
  const EXAM_ZH_KEYWORDS = ['考試', '考试', '測驗', '测验', '期中考', '期末考', '隨堂考', '随堂考', '小考'];

  // 交付物詞：英文用「非字母」邊界（數字/底線可相鄰）：Demo2、HW1Report 也認得出來。
  // exam paper 是考卷本身，不算交付物（Final Exam Paper 是考試）
  const DELIVERABLE_EN_RE = new RegExp(
    '(?<![a-z])(?:reports?|reflections?|projects?|proposals?|worksheets?|essays?|presentations?|slides|drafts?'
    + '|homework|hws?|assignments?|(?<!exam\\s)papers?|posters?|videos?|demos?|portfolios?|milestones?|write[\\s-]?ups?|plans?'
    + '|corrections?|wrappers?|submissions?|problem\\s+sets?|exercises?|self[\\s-]?assessments?|evaluations?'
    + '|case\\s+stud(?:y|ies)|surveys?|questionnaires?|prototypes?|peer[\\s-]?reviews?)(?![a-z])',
    'i'
  );
  const DELIVERABLE_ZH_KEYWORDS = [
    '作業', '作业', '報告', '报告', '專題', '专题', '心得', '提案', '簡報', '简报', '企劃', '企划',
    '反思', '訂正', '订正', '論文', '论文', '海報', '海报', '練習', '练习', '習題', '习题',
    '作品', '汇报', '匯報', '展示', '問卷', '问卷',
  ];
  // 「整段就是交付物」可容許的修飾詞（Final Report、Group Presentation、Self Reflection）
  const PURE_DELIVERABLE_MODIFIER_RE = /^(?:and|final|group|individual|team|written|self|peer|short|mini|revised|weekly)$/i;

  // 括號內容排除左括號本身：一串未閉合的「((((」才不會讓每個起點都掃到字串尾（O(n²)）
  const LEADING_TAG_RE = /^(\([^()]*\)|（[^（）]*）|\[[^[\]]*\]|【[^【】]*】) ?/;
  const BRACKET_ASIDE_RE = /\([^()]*\)|（[^（）]*）|\[[^[\]]*\]|【[^【】]*】/g;
  // 「: ： | ｜」一律切段；破折號（– —，以及前後有空格的 -）兩側都是數字時是範圍（Homework 1–3 Quiz、
  // HW 1 - 3 Quiz），不切——否則範圍前半段的交付物詞（Homework）會先決定結果
  const SEGMENT_SEP_RE = / ?[:：|｜] ?|(?<!\d ?) ?[–—] ?| ?[–—] ?(?! ?\d)|(?<!\d) - | - (?!\d)/;
  const TRAILING_PREP_RE = / (?:on|for|about|covering|of) .*$/i;
  // 介系詞前只有這些詞（加短編號）→ 介系詞後是考試本身：Make-up for Midterm Exam、Part 1 of Final Exam
  const PREP_KEEP_RE = /^(?:make[\s-]?ups?|retakes?|resits?|re-?exams?|part|section|round|session)\b[\w#. -]{0,6}$/i;

  // 先把連續空白收成一格：之後所有 regex 都不會在長空白串上回溯（名稱來自 Canvas，長度不可信）
  function squish(s) {
    return s.replace(/\s+/g, ' ').trim();
  }

  // 關鍵字在字串中「最後一次出現」的起點；沒有則 -1
  function lastRegexIndex(re, s) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let last = -1;
    for (const m of s.matchAll(g)) last = m.index;
    return last;
  }

  function lastKeywordIndex(keywords, s) {
    return keywords.reduce((last, k) => Math.max(last, s.lastIndexOf(k)), -1);
  }

  function lastDeliverableIndex(s) {
    return Math.max(lastRegexIndex(DELIVERABLE_EN_RE, s), lastKeywordIndex(DELIVERABLE_ZH_KEYWORDS, s));
  }

  // 整段就是交付物（「Corrections」「Final Report」「反思」）：拿掉交付物詞、編號標點與修飾詞後什麼都不剩
  function isPureDeliverable(segment) {
    if (lastDeliverableIndex(segment) < 0) return false;
    let rest = segment.replace(new RegExp(DELIVERABLE_EN_RE.source, 'gi'), ' ');
    for (const k of DELIVERABLE_ZH_KEYWORDS) rest = rest.split(k).join(' ');
    return rest.replace(/[\d#.,;!?'"&()（）\-–—]+/g, ' ').split(' ').filter(Boolean)
      .every((word) => PURE_DELIVERABLE_MODIFIER_RE.test(word));
  }

  function stripTrailingPrep(segment) {
    const s = segment.trim();
    const m = s.match(TRAILING_PREP_RE);
    if (!m) return s;
    const before = s.slice(0, m.index);
    return PREP_KEEP_RE.test(before) ? s : before;
  }

  // 名稱 → { segments: 依序的段落, asides: 括號旁註全文 }
  function splitName(rawName) {
    let name = squish(rawName);
    let tag = '';
    const m = name.match(LEADING_TAG_RE);
    if (m && m[0].length < name.length) {
      tag = m[1].slice(1, -1).trim();
      name = name.slice(m[0].length);
    }
    const asides = (name.match(BRACKET_ASIDE_RE) || []).join(' ');
    // 整個名稱都在括號裡（「[Quiz 3]」「【期中考】」）→ 沒有旁註可去，用原名
    const body = squish(name.replace(BRACKET_ASIDE_RE, ' ')) || name;
    const segments = body.split(SEGMENT_SEP_RE).map(stripTrailingPrep).filter(Boolean);
    return { segments: tag ? [tag, ...segments] : segments, asides };
  }

  // lastCategoryIndex(段) → 段內最後一個分類詞位置；isStrong(段) → 段內有強分類詞
  function nameMatchesCategory(name, lastCategoryIndex, isStrong) {
    const { segments, asides } = splitName(name);
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const at = lastCategoryIndex(segment);
      const deliverableAt = lastDeliverableIndex(segment);
      if (at < 0 && deliverableAt < 0) continue;     // 中性段（課號、主題）→ 往右看
      if (deliverableAt > at) return false;          // 段內中心語是交付物
      const later = segments.slice(i + 1);
      if (isStrong(segment)) return !later.some(isPureDeliverable);
      // 弱分類詞（只有 midterm）：後段或旁註提到交付物 → 交付物
      return !later.some((s) => lastDeliverableIndex(s) >= 0) && lastDeliverableIndex(asides) < 0;
    }
    return false;
  }

  function lastExamIndex(s) {
    return Math.max(
      lastRegexIndex(EXAM_STRONG_EN_RE, s),
      lastRegexIndex(EXAM_MIDTERM_RE, s),
      lastRegexIndex(EXAM_EN_TEST_RE, s),
      lastKeywordIndex(EXAM_ZH_KEYWORDS, s)
    );
  }

  function hasStrongExamWord(s) {
    return EXAM_STRONG_EN_RE.test(s) || EXAM_EN_TEST_RE.test(s) || EXAM_ZH_KEYWORDS.some((k) => s.includes(k));
  }

  function isExam(assignment) {
    if (!assignment || isCustom(assignment)) return false;
    if (isCanvasQuiz(assignment)) return true;
    if (requiresSubmission(assignment)) return false;
    return nameMatchesCategory(String(assignment.name || ''), lastExamIndex, hasStrongExamWord);
  }

  // ── 簽到/出勤判定（原 dashboard 與 popup 兩套關鍵字的聯集）──
  // 英文用「非字母」邊界：舊版 substring 讓「De-sign in-spiration」「Check-in-g」被當簽到；
  // 但數字/底線可相鄰（Week1_Attendance、L02Attendance、Check-in1），複數也算（Check-ins）。
  const ATTENDANCE_EN_RE = /(?<![a-z])(?:attendances?|attendence|participation|sign[\s-]?ins?|check[\s-]?ins?)(?![a-z])/i;
  const ATTENDANCE_ZH_KEYWORDS = ['簽到', '签到', '出勤', '考勤'];
  // 不是簽到的搭配：專案/團隊進度 check-in（要準備進度）、軟體作業裡的 sign-in 頁面/功能、
  // 版控的 check in (your/the) code / changes、check in … to GitHub / repo。
  // 單獨的 to / the 不算版控語意：「Check-in to Lecture 5」「Check in the classroom」是簽到
  // （名稱已 squish 成單一空格：「(?: \S+){0,4}?」每個字只有一種切法，不會回溯爆炸）
  const NOT_ATTENDANCE_RE = new RegExp(
    '(?<![a-z])(?:(?:project|milestone|progress|team|group|sprint|design)[\\s-]+check[\\s-]?ins?'
    + '|sign[\\s-]?ins?[\\s-]+(?:page|form|feature|flow|screen|ui|button|module|system|api|function|logic|component)s?'
    + '|check[\\s-]?ins?[\\s-]+(?:your|(?:the|my|our|all)[\\s-]+(?:code|changes|commits?|files?)|code|changes|commits?)'
    + '|check[\\s-]?ins?(?: \\S+){0,4}? to (?:the |your )?(?:github|gitlab|bitbucket|git|svn|repo(?:sitory)?))(?![a-z])',
    'gi'
  );

  function lastAttendanceIndex(s) {
    // 排除搭配以等長空白遮掉，位置仍可與交付物位置比較
    const masked = s.replace(NOT_ATTENDANCE_RE, (m) => ' '.repeat(m.length));
    return Math.max(lastRegexIndex(ATTENDANCE_EN_RE, masked), lastKeywordIndex(ATTENDANCE_ZH_KEYWORDS, masked));
  }

  function isAttendance(assignment) {
    if (!assignment || isCustom(assignment)) return false;
    if (requiresSubmission(assignment)) return false;
    return nameMatchesCategory(String(assignment.name || ''), lastAttendanceIndex, () => true);
  }

  // ── 可被自動隱藏的類別（考試 ∪ 簽到；dashboard 與 popup 共用，自訂作業恆 false）──
  function isHideable(assignment) {
    return isExam(assignment) || isAttendance(assignment);
  }

  // ── 考試是否已結束（2026-07-22 決策）──
  // 考試時間一過即不可再行動（不像一般作業可補繳）→ 與「已繳」歸同一個完成桶，
  // 不進待辦/逾期清單；無截止日或日期無效則無從判定，維持未結束。
  // 要學生上傳/填寫的考試（take-home exam）截止後仍可補交，不算「考完」——
  // isExam 已對交件型回 false，這行只是防線。
  function isExamConcluded(assignment, nowMs = Date.now()) {
    if (!assignment || !isExam(assignment) || !assignment.due_at) return false;
    if (requiresSubmission(assignment)) return false;
    const t = new Date(assignment.due_at).getTime();
    if (Number.isNaN(t)) return false;
    return t <= nowMs;
  }

  // ── 統一緊急度刻度（popup 舊版 ≤3 天才橘、dashboard ≤7 天橘，現收斂為一套）──
  // 'none' 無截止｜'overdue' 已過期｜'urgent' ≤7 天｜'soon' 8–30 天｜'later' 30 天以上
  const DAY_MS = 86400000;

  function urgency(dueAt, nowMs = Date.now()) {
    if (!dueAt) return 'none';
    const t = new Date(dueAt).getTime();
    if (Number.isNaN(t)) return 'none';
    const diff = t - nowMs;
    if (diff < 0) return 'overdue';
    const days = diff / DAY_MS;
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'soon';
    return 'later';
  }

  // ── 逾期顯示窗 ──
  // 逾期超過此天數的項目不再進「學期待辦 / popup」的逾期區
  // （避免學期中途安裝時被整學期舊帳洗版；課程詳情仍看得到全部）。
  const OVERDUE_WINDOW_DAYS = 30;

  function isWithinOverdueWindow(dueAt, nowMs = Date.now()) {
    if (!dueAt) return false;
    const t = new Date(dueAt).getTime();
    if (Number.isNaN(t)) return false;
    const overdueMs = nowMs - t;
    return overdueMs >= 0 && overdueMs <= OVERDUE_WINDOW_DAYS * DAY_MS;
  }

  // ── 逾期天數（本地日曆天差，同日=0；顯示層對 0 用「今天」）──
  function overdueDays(dueAt, now = new Date()) {
    const d = new Date(dueAt);
    if (Number.isNaN(d.getTime())) return 0;
    const dueDayUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const nowDayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.round((nowDayUtc - dueDayUtc) / DAY_MS));
  }

  return {
    isExam,
    isAttendance,
    isHideable,
    isExamConcluded,
    urgency,
    isWithinOverdueWindow,
    overdueDays,
    OVERDUE_WINDOW_DAYS,
  };
});

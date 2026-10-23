(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DueCompletion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ── Canvas 是否已收到繳交（單一真相來源，供 dashboard.js 委派）──
  function isSubmitted(assignment) {
    return !!(assignment && assignment.submission && (
      assignment.submission.submitted_at ||
      assignment.submission.workflow_state === 'submitted' ||
      assignment.submission.workflow_state === 'graded'
    ));
  }

  // ── taskRules 延遲解析（popup.html 的 script 順序不保證 taskRules 先載；呼叫時才查全域）──
  function taskRules() {
    if (typeof module === 'object' && module.exports) return require('./taskRules.js');
    const root = typeof globalThis !== 'undefined' ? globalThis : this;
    return root.DueTaskRules || null;
  }

  // ── 「外部事實」已完成：Canvas 已繳，或考試時間已過（考試不可補繳，見 2026-07-22 決策）──
  //    與手動標記相對——此類完成可被 manualUndone 覆蓋標回未完成
  function isExternallyDone(assignment) {
    if (isSubmitted(assignment)) return true;
    const rules = taskRules();
    return !!(rules && rules.isExamConcluded && rules.isExamConcluded(assignment));
  }

  // ── 手動完成 map 是否標記該 id（id 一律 String 正規化）──
  function isManualDone(manualDoneMap, id) {
    return !!(manualDoneMap || {})[String(id)];
  }

  // ── 手動「標回未完成」map 是否標記該 id（鏡像 isManualDone，只對 Canvas 已繳者有意義）──
  function isManualUndone(manualUndoneMap, id) {
    return !!(manualUndoneMap || {})[String(id)];
  }

  // ── 綜合完成判斷：（外部事實完成〔已繳或考試已結束〕且 未標回未完成）「或」手動完成 ──
  //    manualUndoneMap 可省略（省略＝舊行為）；髒資料兩 map 同時有 → manualDone 勝出（仍算完成）
  function isDone(assignment, manualDoneMap, manualUndoneMap) {
    const id = assignment && assignment.id;
    return (isExternallyDone(assignment) && !isManualUndone(manualUndoneMap, id))
      || isManualDone(manualDoneMap, id);
  }

  // ── 切換手動完成，回傳「新的」map（immutable，不 mutate 輸入）──
  //    nextState 省略時翻轉；true → 設 true；false → 刪除該 key（不留 false）
  function toggleManualDone(manualDoneMap, id, nextState) {
    const key = String(id);
    const base = manualDoneMap || {};
    const target = typeof nextState === 'boolean' ? nextState : !base[key];
    if (target) {
      return { ...base, [key]: true };
    }
    const next = { ...base };
    delete next[key];
    return next;
  }

  // ── 勾選/撤銷的單一寫入入口：把作業設成「目標完成狀態」，回傳新的兩張 map（immutable）──
  //    依「當下」外部事實（isExternallyDone 現算，不讀 render 時的屬性）決定該用哪張 map 表達，
  //    並把另一張的同 id 一律清掉 → 結果恆為最小覆蓋，兩 map 並存的髒資料在下一次勾選時自癒：
  //      done=true ：外部完成 → 兩張都不留（回歸外部事實）；否則 → 只留 manualDone
  //      done=false：外部完成 → 只留 manualUndone；否則 → 兩張都不留（日後 Canvas 繳交才不會被舊覆蓋藏起來）
  //    目標狀態冪等：同一目標重套結果不變（供「本頁樂觀更新＋storage 最新值重套」，見 dashboard updateShared）
  function setDone(maps, assignment, done) {
    const id = assignment && assignment.id;
    const ext = isExternallyDone(assignment);
    const src = maps || {};
    let manualDone = toggleManualDone(src.manualDone, id, false);
    let manualUndone = toggleManualDone(src.manualUndone, id, false);
    if (done && !ext) manualDone = toggleManualDone(manualDone, id, true);
    if (!done && ext) manualUndone = toggleManualDone(manualUndone, id, true);
    return { manualDone, manualUndone };
  }

  // ── 清理手動完成 map，只留 truthy 值 → { [String(id)]: true }──
  function normalizeManualDone(map) {
    const cleaned = {};
    Object.entries(map || {}).forEach(([id, value]) => {
      if (value) cleaned[String(id)] = true;
    });
    return cleaned;
  }

  return {
    isSubmitted,
    isExternallyDone,
    isManualDone,
    isManualUndone,
    isDone,
    toggleManualDone,
    setDone,
    normalizeManualDone,
  };
});

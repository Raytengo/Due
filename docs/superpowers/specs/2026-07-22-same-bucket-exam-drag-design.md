# 拖曳升級只在「同完成類別」內發生（修正已結束考試被拖上來會消失）

日期：2026-07-22

## 背景與問題

`2026-07-22-drag-promote-hidden-items-design.md` 的「考試分桶」決策讓已結束/已繳的考試歸「已完成」桶、還沒考的歸「未完成」桶。當時對**分桶不合**（例如在「未完成」視圖拖一個已結束考試）的處理是：不開插入縫、改寫 drophint、放開後把 clone 飛向側欄對應導航（`#nav-submitted`），該項升級後因完成度過濾而不出現在目前清單。

實測體驗是壞的：使用者在「未完成」視圖把稽核區底部的**已繳考試**往上拉，該項「憑空消失」——實際上它被正確地歸進「已繳交」桶，但使用者人在「未完成」視圖，所以看不到它。使用者感受為「它亂跳、我找不到它」。

分桶邏輯本身沒錯（考試沒有真的變成未繳交），壞的是「已繳考試在未完成視圖被拖上來後會憑空消失」這個互動。

## 決策（取代舊 spec 的「分桶不合」行為）

**拖曳升級只允許發生在「與目前視圖完成類別相符」的項目上**——徹底移除跨桶拖曳，因此不再有東西飛向側欄、不再有東西消失。（使用者選定：Option A ＋ 稽核區仍顯示但不可拖＝選項一。）

- 判定：一個可隱藏項（考試/簽到）**可拖 ⇔ `isDone(item) === showSubmitted`**。
  - 「未完成」視圖（`showSubmitted=false`）：只有**未完成**（還沒考）的隱藏項可拖，升級後落入待辦清單。
  - 「已繳交」視圖（`showSubmitted=true`）：只有**已完成**（已繳/已結束）的隱藏項可拖，升級後落入已繳清單。
- 稽核區（已自動隱藏）在**兩個視圖都仍列出該課全部隱藏項**（維持完整稽核清單、數量穩定、已完成的依既有排序殿後「放在一起」）；但**只有相符類別的列有握把（grip）可拖**，不相符的列淡化、無握把、在此視圖拖不動。
- 降級（拖回稽核區）方向不變：升級項只會在其相符視圖出現（`applyFilters`），故其降級握把恆在正確視圖，天然同桶。
- 效果：任何拖曳都不跨越「已完成 ↔ 未完成」界線、不改變任何項目的完成狀態、不會有項目消失或飛向側欄。要升級一個已結束考試，先切到「已繳交」視圖再拖。

## 實作

### 顯示層 — `renderHiddenItemsSection`（dashboard.js）

- 每列的握把（`DRAG_GRIP`）只在 `isDone(a) === showSubmitted` 時輸出；不相符的列不輸出握把、加上一個 locked class 作視覺提示（既有 `.hidden-item-row` 已 `opacity:0.55`；locked 列以「無握把」為主要區別，是否再降一階透明度於實作時定）。`setupHideablePromoteDrag` 既有 `if (!grip) return` 會自動跳過無握把列，故無握把即等於不可拖。
- 排序維持現狀（未完成在前、due 升冪；已完成殿後、最近結束在前），使已完成項在清單底部「放在一起」。
- `showSubmitted` 為模組級全域、`isDone` 為模組函式，此函式可直接讀取，無需改簽名。

### 互動層 — 移除跨桶路徑（dashboard.js）

- `liftRow`：移除 `ctx.bucketDone` / `ctx.bucketMatch`；`promote` 一律加 `drag-flow`（不再改寫 drophint）。
- `updateDropState`：`if (ctx.dir === 'promote' && ctx.bucketMatch)` → `if (ctx.dir === 'promote')`。
- `commitDrag`：移除 `!bucketMatch` 的 `settleCloneToNav` 分支。
- 移除已無用者：`settleCloneToNav` 函式、`DRAG_NAV_MS` 常數、`restoreDropHint` 函式與其 2 處呼叫（`endDrag`／`abortActiveDrag`；`origHint` 已不再設定）、i18n key `dropToDone` / `dropToPending`（zh-TW／zh-CN／en 三語系）。
- 保留：`dropToShow`（清單放置提示）、`dropToHide`（稽核區放置提示）仍在用。

### 不需改動

- `applyFilters` / `getTasks` / `updateSideNav` / 週視圖進度環與計數 / 課程 grid / popup 的分桶邏輯本來就正確（已結束/已繳 → 已完成桶），不動。
- 降級（demote）路徑不動（升級項恆在相符視圖，天然同桶）。
- `taskRules.isExamConcluded` / `completion.isExternallyDone`／`isDone` 不動。

## 邊角 / 風險

- 稽核區在「未完成」視圖仍列出已結束考試（淡化、無握把）——刻意保留完整稽核清單；使用者已熟悉「有握把＝可拖」，無握把即清楚表示「此視圖不可拖」，正是本次要的「不能跨類別拖」。
- 切換「已繳交」會 `loadData()` 重繪開啟中的課程詳情，故握把/可拖性即時反映當前視圖（已驗證：`nav-submitted` click → `loadData` → `render` → `renderCourseDetailSection`）。
- 移除跨桶路徑後 `bucketMatch` 恆真、相關程式為死碼，安全移除。若要保險，可在 `commitDrag` 落點前再確認同桶、否則當取消彈回（非必要，因握把閘門已保證）。
- 髒資料：`isDone` 對簽到走 `isSubmitted || manualDone`（無 `isExamConcluded`），規則以 `isDone` 表述，考試與簽到一致適用。

## 驗收

- `node --check extension/dashboard/dashboard.js` 通過；既有四支測試（taskRules / completion / customAssignments / descSanitizer）維持綠（本變更不觸及其覆蓋範圍）。
- 瀏覽器 harness（COMP 5567：`Midterm Exam` 還沒考＝未完成、`Paper Reading Quiz 1` 已繳＝已完成）：
  - 「未完成」視圖：`Midterm Exam` 有握把、可往上拖並落入待辦清單；`Paper Reading Quiz 1` 淡化、無握把、拖不動；全程無任何項目飛向側欄或消失。
  - 「已繳交」視圖：`Paper Reading Quiz 1` 有握把、可拖並落入已繳清單；`Midterm Exam` 淡化、無握把。
  - 升級後 `manualShown` 寫入、側欄計數同步、稽核區開合與捲動位置保留（沿用既有行為）。
  - 深/淺色兩態的 locked 列與握把樣式正確。

---

> **後記（2026-10-23）：本 spec 已被取代。** 「稽核區兩視圖都列出全部、只有同桶列可拖（locked 列）」改為 `2026-10-23-hidden-section-follows-filter-design.md`：已隱藏區跟隨作業清單的完成過濾，看得到的每一列都可拖、沒有鎖住的列；切換「已繳交」也不再走 `loadData()`。本文保留作決策歷史。

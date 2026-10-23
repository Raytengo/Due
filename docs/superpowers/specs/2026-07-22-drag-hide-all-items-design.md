# 拖曳隱藏／顯示開放給所有作業（不再只限考試・簽到）

日期：2026-07-22（延續 `2026-07-22-same-bucket-exam-drag-design.md`）

## 目標

把「拖曳升級／降級」從只適用於自動隱藏的考試/簽到，**開放給每一個作業**：任何作業或考試都能從清單往下拖進底部「已隱藏」區收起來，也能從「已隱藏」區往上拖回清單顯示。

## 決策（使用者選定：Option 1）

- **一般作業新增手動隱藏**：新 storage key `manualHidden: { [id]: true }`（鏡像考試/簽到的 `manualShown`）。
- **統一「是否被收進稽核區」判定** `isHidden(a)`：
  - 考試/簽到（`isHideable`）：預設隱藏，除非 `manualShown` → `!isManuallyShown(a)`。
  - 一般作業：預設顯示，除非 `manualHidden` → `isManuallyHidden(a)`。
- **被隱藏者一律從所有 todo/清單視圖消失**（學期待辦進度環＋分級＋卡片、課程 grid、popup、側欄計數），只在該課詳情底部「已隱藏」區看得到、可拖回。
- **同視圖才能拖的規則不變**（沿用 same-bucket spec）：握把只在 `isDone(a) === showSubmitted` 時出現。因為主清單經 `applyFilters` 後每列必為同桶，所以**清單每一列都可拖（降級）**；稽核區跨桶列仍鎖住（淡化、無握把）。
- **成績計算器不受影響**：隱藏只影響清單/待辦呈現，分數照算（`renderGradeCalculator` 不看 `isHidden`）。
- **「已隱藏」區恆存在**（只要該課有任何作業）作為拖放目標；標籤改為通用「已隱藏 N 項」，不再寫「考試・簽到」。

## 實作（dashboard.js 除非另註）

- 新增 `isManuallyHidden`、`setManualHidden`、`isHidden`、`setItemHiddenByDrag(id, makeHidden)`（後者依 `isHideable` 決定寫 `manualShown` 或 `manualHidden`）。
- `applyFilters`：排除條件由 `!isHideable || isManuallyShown` 改為 `!isHidden(a)`。
- `updateSideNav` 計數：`if (isHidden(a)) continue;`
- 週視圖 `nearItems`：`!isHidden(a) && isNear(a)`。
- `renderCourseDetailSection`：`hiddenItems = asgns.filter(isHidden)`；只要 `asgns.length` 就渲染「已隱藏」區（移除 `hasHideable` 條件）。
- `renderAssignmentRow`：**每一列**都加 `data-drag="demote" data-hideable-id` ＋ 名稱後 `DRAG_GRIP`（不再只限 `promotedHideable`；`promoted-hideable` class 維持僅標記升級考試，無樣式影響）。
- `commitDrag`：`setManualShown(ctx.id, dir==='promote')` → `setItemHiddenByDrag(ctx.id, ctx.dir === 'demote')`。
- `loadData` 讀取 + `render` 帶入 `manualHidden`。
- i18n：`hiddenItemsToggle` →「已隱藏 {n} 項」；`hiddenItemsEmpty` → 通用空訊息；`dropToHide` →「放開以隱藏」（三語系）。
- **popup.js**：`getTasks` 加 `manualHidden` 參數；排除條件改為「考試/簽到看 `manualShown`、一般作業看 `manualHidden`」；`loadData` 讀取並傳入。
- **CLAUDE.md**：storage схема補 `manualHidden`。

## 不變 / 不做

- `manualShown`、same-bucket 握把閘門、考試分桶、`isExamConcluded`/`isDone` 皆不動。
- 降級（demote）落點動畫、稽核區展開、settle 皆沿用。
- 不做「自由排序」（Option 3 未選）；隱藏不影響成績計算。

## 驗收

- `node --check` 通過；四支既有測試維持綠。
- harness：
  - 一般作業列有握把 → 往下拖進「已隱藏」→ 從清單/週/grid/popup/計數消失、出現在稽核區；再拖回 → 復原。
  - 考試沿用（升級/降級、同視圖鎖）行為不變。
  - 「已隱藏」區在無隱藏項時仍顯示（0 項）作為放置目標；跨桶列淡化不可拖。

## 後記（2026-10-23，QA #81）

本文「稽核區跨桶列仍鎖住（淡化、無握把）」與「同視圖鎖」已被 `2026-10-23-hidden-section-follows-filter-design.md` 取代：已隱藏區改為跟隨完成過濾，只列與目前視圖同一完成桶的隱藏項，畫面上每一列都可拖，不再有鎖住的列。一般作業的拖曳隱藏（`manualHidden`）與考試/簽到的升級（`manualShown`）兩種寫入方式不變。

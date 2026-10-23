# 拖曳升級／降級「已自動隱藏」項目

日期：2026-07-22

## 目標

課程詳情底部「已自動隱藏（考試・簽到）」的項目，使用者可用**拖曳**把單一項往上拉進作業清單，將它「升級」成一般可操作作業（可勾完成、可點開描述、可跳 Canvas）；也可把升級後的項目**拖回**稽核區降級回隱藏。升級為使用者手動、逐項的覆蓋，預設仍全部隱藏。

## 決策

- **升級範圍：所有視圖**。升級後該項等同一般作業，出現在學期待辦（進度環＋分級摘要＋卡片）、課程 grid 卡、popup 7 天待辦、課程詳情清單。降級則從所有視圖移除、回到稽核區。
- **考試分桶（2026-07-22 補充）**：「已繳」或「已過期」的考試視同**已完成**（考試時間一過即不可再行動，不像一般作業可補繳）——升級後只會出現在「已繳交」視圖，不進待辦/逾期清單；還沒考的考試升級後進未完成清單。單一真相來源：`taskRules.isExamConcluded`（考試且 due 已過）＋ `completion.isExternallyDone`（已繳∨考試結束）→ `isDone` 以它取代單純 isSubmitted；`manualUndone` 仍可把已結束考試手動標回未完成（沿用雙向切換語意），勾選圈路由改依 `isExternallyDone`（`data-ext-done`）。稽核清單排序：未結束在前（due 升冪）、已結束/已繳放一起殿後（最近結束在前）。
- 觸控 DnD 不特別處理（桌面 dashboard）。
- 只處理「原本就有考試/簽到項」的課程；純無隱藏項的課程無此區、無此互動。

## 資料模型

- 新 storage key：`manualShown: { [assignmentId]: true }`。
- 分層：
  - `taskRules.isExam / isAttendance` 維持純分類（單一真相來源，不動）。
  - 「是否隱藏」在**過濾層**判定：考試/簽到 **且不在 manualShown** → 隱藏。
    - `dashboard.js applyFilters`：排除條件改為 `(isExam(a) || isAttendance(a)) && !manualShown[id]`。
    - `popup.js getTasks`：同樣改為 promoted 者放行。
  - `manualShown[id]` 為真的考試/簽到 → 視同一般作業，走既有 `renderAssignmentRow` / 週卡 / grid / popup 列的一般路徑（考試仍上紫色 `due-exam`，但可操作）。
- `renderHiddenItemsSection` 的隱藏清單 = `(isExam||isAttendance) && !manualShown`。
- 讀取：`loadData`（dashboard 與 popup）新增讀 `manualShown`；dashboard 快取進 `_currentData.manualShown`，寫入即時更新 `_currentData` 與 storage（比照 `manualDone` 模式，避免重繪打斷）。

## 互動（Pointer Events 自繪拖曳；2026-07-22 v2 取代 HTML5 DnD）

> v1 用原生 HTML5 DnD，實測「按住拖動 → dragstart」的啟動層在使用者環境不觸發（JS 佈線經合成事件驗證無誤），且原生 ghost 影像與插入動畫皆不可控、無法自動化測試 → 改為 pointer events 自繪引擎。

- **可拖對象**：只有考試/簽到列（稽核區的隱藏列、以及升級後在清單中的考試/簽到列）。一般作業列不可拖、行為不變。
- **握把＝唯一拖曳起點**：grip 圖示（SVG 六點）緊跟在**作業名稱正後方**（`.hidden-item-title` / `.assignment-title` 內，名稱過長由內層 span ellipsis），平時 45% 透明、列 hover 提升、grip hover 轉橘色。`pointerdown` 於 grip 且移動超過 4px 才「拿起」（未超過視為點擊、無作用；grip 點擊不觸發列展開）。
- **拿起（lift）**：以原列複製浮動 clone（`position:fixed`，實底＋邊框＋陰影＋`scale(1.02) rotate(0.4deg)` 微傾）跟隨游標；原列留 30% 殘影（`.drag-source`）；目標區亮 `.drop-active`（虛線框＋提示字），游標真正在目標上時 `.drop-hover`（實線＋加深）；`body.drag-active` 統一 grabbing 游標＋禁選字。
- **插入物理感（升級方向）**：懸停作業清單時，依游標 Y 對比各列「未讓位時」的中點算插入索引，索引起的列（含其描述列）以 `transform: translateY(--drag-gap)` 平移讓位（0.18s 過渡；`--drag-gap`＝被拖列高），容器同步撐出等高 padding-bottom 讓稽核區順移——視覺上像被插入。游標離開清單則全部彈回。讓位僅為即時回饋：**實際落點依 due 排序**，放開後 clone 以 0.24s 飛入重繪後該列的真實位置（`drag-arriving` 期間目標列隱形，落地後 `drag-arrived` 淡橘閃 0.9s 標示落點）。
- **分桶不合的升級（落點不在目前視圖）**：升級後會落在另一個視圖（如在待辦視圖拖「已結束考試」→ 落點是「已繳交」）時，**不開插入縫**（不假裝插得進目前清單），目標區提示字改寫落點（「已結束的考試——放開將移至『已繳交』」／「放開將移至『學期待辦』」）；放開後 clone 縮小飛向側欄對應導航（`#nav-submitted`／`#nav-week`，0.32s）、該導航計數 `count-flash` 閃示，明確傳達「東西進了那裡」。
- **升級（往上拖）**：放開於作業清單 → `manualShown[id]=true` → 重繪詳情＋側欄（保留捲動位置與稽核區開合狀態）→ settle 動畫。
- **降級（拖回）**：拖清單中升級列的 grip → 放到稽核區 → 移除 `manualShown[id]` → 重繪後**強制展開稽核區**讓使用者看到落點 → settle 動畫。
- **取消**：放開於目標外、按 Esc、`pointercancel` → clone 飛回原列位置、讓位彈回、無資料變更。
- **邊緣自動捲動**：拖曳中游標距 `.detail-right-panel` 上下緣 56px 內，以貼近程度成正比的速度自動捲動並持續重算讓位。
- **重繪保險**：任何詳情重繪前 `abortActiveDrag()`（clone／window 監聽器即時清除），與 `clearCompleteTimers()` 並列。
- 稽核區只要課程有任一考試/簽到項就恆常存在（即使全升級、隱藏數為 0，仍作為降級 drop 目標，標題顯示「已自動隱藏 0 項」）。

## 邊角 / 風險

- 升級的考試會進入學期待辦進度環的「近期」統計與各級計數——符合「當真正的作業」語意。
- 拖曳與既有列點擊（展開描述）、勾選圈：grip 為唯一拖曳起點且 4px 閾值內視為點擊；拖曳放開後瀏覽器補發的 click 由 capture 階段監聽器吞掉，不誤觸列展開。
- settle 落點列不存在或不可見（如「已繳交」視圖下升級了未完成項被過濾）→ clone 原地淡出，資料照常寫入。
- 重繪前沿用 `clearCompleteTimers()`；drop 後重繪走 `_currentData`（不 `loadData` 閃白），並更新側欄計數。
- 髒資料：`manualShown` 對非考試/簽到 id 無效果（過濾層只在考試/簽到分支查此 map）。

## 驗收

- `node --check`、四支既有測試維持綠。
- 瀏覽器 harness（pointer 事件可合成，全流程可自動驗證）：
  - grip 顯示在名稱正後方（稽核列＋升級列）。
  - 拖升級：拿起有 clone／殘影／目標亮起；懸停清單時插入點以下列讓位、離開彈回；放開後 settle 至 due 排序落點並閃示；`manualShown` 寫入、稽核數－1、側欄計數同步、稽核區開合與捲動位置保留。
  - 拖回降級：稽核區亮起、放開後強制展開並 settle；`manualShown` 移除。
  - Esc／放開於界外：clone 飛回原位、無資料變更。
  - 深/淺色兩態的 clone／目標區樣式。

---

> **後記（2026-10-23，QA #81）：本 spec 的互動細節有兩部分已不成立，保留本文作決策歷史。**
>
> - **插入讓位動畫已移除**：§互動「插入物理感」（懸停清單時插入點以下列以 `.drag-shift`／`--drag-gap` 讓位、容器撐出 padding）已於 cd2180e 拿掉，升級與降級兩個方向都沒有讓位。理由是實際落點永遠由排序決定（清單依 due；已隱藏區待辦視圖依 due 升冪、已繳交視圖最近結束的在前），移動中的縫隙會讓人以為可以自由放置。保留的部分：`.drop-active`／`.drop-hover` 目標高亮、`data-drophint` 提示、clone 飛入重繪後真實位置並 `drag-arrived` 閃示。驗收清單中「插入點以下列讓位、離開彈回」一項一併作廢。
> - **已隱藏區的規則改看 `2026-10-23-hidden-section-follows-filter-design.md`**：已隱藏區收的是「自動隱藏的考試/簽到（未升級）＋手動拖進來的一般作業」，並跟隨作業清單的完成過濾分桶；看得到的每一列（已隱藏區與作業清單）都有握把、都可雙向拖，沒有鎖住的列。因此本文的「可拖對象只有考試/簽到列」「分桶不合的升級改飛向側欄並 `count-flash`」（`count-flash` CSS 已刪）「只要課程有任一考試/簽到項就恆常存在」都已不適用：現在只要該課有作業，已隱藏區就存在。
> - 其他已過時的細節：握把靜止透明度改為 0.75（對比約 3.2:1）；勾選圈不再帶 `data-ext-done`，完成寫入統一走 `DueCompletion.setDone`（QA P1-4）；深色模式已於 2026-07-23 移除。現行行為以 CLAUDE.md「課程詳情頁」與「完成標記」段落為準。

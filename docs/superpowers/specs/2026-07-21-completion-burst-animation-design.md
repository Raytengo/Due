# 完成過渡動畫（碎點爆）— 設計文件

- **日期**：2026-07-21
- **狀態**：已與使用者確認（透過互動 demo 逐項定案），待實作
- **前置**：延續 [2026-07-19 手動標記作業完成](2026-07-19-manual-assignment-completion-design.md)

---

## 1. 目標

在課程詳情頁勾選「完成」後，那一列不要立刻消失，而是給一個 **3 秒撤銷窗口**，
時間到後以「**碎點爆**」動畫向外爆開消失。過程中可及時取消。

使用者明確定案（demo 迭代結果）：
- **不放大也不縮小**：那一列不做 scale 變化，原地淡出；「爆」的感覺全由碎點四散呈現。
- **碎點爆**：爆開同時噴出約 10 顆小碎點向四周擴散（最有泡泡破掉感）。
- **窗口 3 秒**（原本提的 5 秒改短）。
- **窗口內維持原尺寸**：3 秒間該列正常顯示，勾變綠 + 「↩ 撤銷」提示 + 底部橘色**撤銷倒數條**（隨 3 秒縮短）；倒數條歸零才爆。

---

## 2. 行為規格

| 情境 | 行為 |
|------|------|
| 待辦視圖勾選完成（未完成 → 完成） | 勾綠 + 顯示「↩ 撤銷」，維持原樣 3 秒 → 碎點爆 → 移除該列、清單收合、計數/圓餅/側欄更新 |
| 3 秒內點該列任何位置 | **取消**：清除計時器、還原完成狀態、移除撤銷提示與綠勾，該列留在清單 |
| 「查看已繳交」取消手動完成（完成 → 未完成） | **直接重繪跳回**，無動畫（維持現狀） |
| Canvas 已繳 | 仍 `locked`、不可點（不變） |
| 爆開中（.45 秒）再點 | 忽略（`bursting` 期間不可互動） |

- 範圍：動畫只發生在**課程詳情頁**的 `.assignment-item`（勾選圈只在那）。
- 觸發判斷：`nowDone === true && showSubmitted === false` 才播動畫；其餘（取消完成）走即時重繪。

---

## 3. 狀態與持久化

- 勾選當下**立即**寫入 `chrome.storage.local.manualDone`（`isManualDone` 為 true）。
- 取消（3 秒內）→ `toggleManualDone(map, id, false)` 還原並寫回。
- dashboard.js **無** `storage.onChanged` 監聽器 → 寫入不會觸發自動重繪，動畫不被打斷（已確認）。
- 3 秒窗口內**不重繪**（否則 `applyFilters` 會立刻把已完成的濾掉）；只在爆開結束後才 `rerenderDetailAndNav`。
- 側欄緊急件數、課程評分圓餅在窗口內**不預先更新**（不「跳先」），爆開結束重繪時才一起更新。

---

## 4. 實作（dashboard.js）

### 4.1 模組層
```js
const COMPLETE_DELAY_MS = 3000;
const _completeTimers = {}; // id -> timeoutId
```

### 4.2 輔助函式
- `rerenderDetailAndNav(cid)`：重繪課程詳情 + `renderNav`（沿用既有 render 路徑）。
- `beginComplete(item, id, cid)`：加 `.completing`、勾綠、插入 `.complete-undo-hint`、設 3 秒計時器 → `finishComplete`。
- `finishComplete(item, id, cid)`：`spawnBurstDots(item)`、加 `.bursting`、`setTimeout(() => rerenderDetailAndNav(cid), 480)`（略長於 .45s 爆開）。
- `cancelComplete(item, id, cid)`：清計時器、`toggleManualDone(...,false)` 還原並寫 storage、就地移除 `.completing`/提示/綠勾（**不整段重繪**，避免影響其他進行中的動畫）。
- `spawnBurstDots(item)`：建立 10 個 `<span class="complete-burst-dot">`，以三角函式算角度、設 `--dx/--dy`、綠橘交錯。

### 4.3 事件處理改寫（`renderCourseDetailSection` 內）
- `.assignment-check` click：
  1. `stopPropagation`；`if (locked) return`；`if (bursting) return`；
  2. `if (completing) { cancelComplete(...); return; }`
  3. `toggleManualDone` → 寫 storage → `if (nowDone && !showSubmitted) beginComplete(...)` else `rerenderDetailAndNav(cid)`。
  4. 進入 `beginComplete` 前先把該列勾選圈設為綠（`dataset.done='true'`），因為此時不重繪。
- `.assignment-item` click（原本切換描述展開）：最前面加
  `if (bursting) return; if (completing) { cancelComplete(...); return; }`，否則維持展開描述。
- `renderCourseDetailSection` 開頭：清掉所有 `_completeTimers`（避免導覽離開 / 切換「查看已繳交」後殘留計時器；已知的並行動畫取捨見 §6）。

---

## 5. CSS（index.html，接在 `.assignment-check` 規則後）

```css
@keyframes complete-burst { from { opacity:1; } to { opacity:0; } }
@keyframes complete-dot   { to { opacity:0; transform:translate(var(--dx),var(--dy)) scale(.3); } }
.assignment-item.completing { position: relative; }
.assignment-item.bursting   { animation: complete-burst .4s ease-out forwards; }
.complete-undo-hint { font-family:'DM Mono',monospace; font-size:12px; color:var(--orange);
  background:var(--surface); border-radius:999px; padding:2px 10px; margin-bottom:4px; }
.complete-burst-dot { position:absolute; left:26px; top:50%; width:7px; height:7px;
  border-radius:50%; pointer-events:none; animation: complete-dot .5s ease-out forwards; }
@keyframes complete-countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }
.complete-countdown { position:absolute; left:0; bottom:0; height:3px; width:100%;
  background:var(--orange); transform-origin:left; } /* 動畫時長由 JS 依 COMPLETE_DELAY_MS 設定 */
```
- 撤銷提示插入 `.assignment-right`（column、右對齊）第一個子元素 → 顯示在到期標籤上方。
- 碎點以 `.assignment-item.completing`（`position:relative`）為定位基準；`.bursting` 不移除 `.completing`，故 burst 期間定位仍有效。
- 用 `var(--orange)` / `var(--green)`，深色模式自動適配。

### i18n
新增 `undoComplete`：zh-TW `撤銷`、zh-CN `撤销`、en `Undo`（模板前綴 `↩ `）。

---

## 6. 邊界與已知取捨

- **並行完成**：同時勾兩筆、其中一筆先爆 → 觸發重繪會清掉另一筆的計時器並（因已完成）把它濾掉，導致第二筆提早消失、少了爆開動畫。少見操作，接受此取捨。
- **導覽離開 / 切「查看已繳交」**：`renderCourseDetailSection` 開頭清計時器，狀態已持久化，回來時正確（已完成的已濾掉）。
- **關閉 dashboard 於窗口內**：狀態已在勾選當下寫入，維持完成（可接受）。
- `bursting` 期間忽略點擊，避免爆到一半被取消的怪狀態。

---

## 7. 測試（暑假無作業，涵蓋空狀態）

1. `node --check extension/dashboard/dashboard.js`、`extension/dashboard/index.html` 無語法問題（HTML 用瀏覽器/人工檢視）。
2. `node extension/dashboard/completion.test.js`、`customAssignments.test.js` 仍全綠（本次不改純邏輯，但確認未回歸）。
3. 動畫為 DOM/計時器層，無法 node 單測；由獨立 review 檢查：計時器無洩漏、窗口內不重繪、取消為就地還原、`bursting`/`completing` class 生命週期正確。
4. 人工驗收（交回使用者）：`chrome://extensions` 重新載入 → 課程詳情勾選 → 3 秒撤銷窗口 → 碎點爆；3 秒內點列可取消；「查看已繳交」取消為即時。暑假可用自訂作業走完整流程。

---

## 8. 影響檔案

| 檔案 | 變更 |
|------|------|
| `extension/dashboard/dashboard.js` | 計時器 map + 常數；`beginComplete`/`finishComplete`/`cancelComplete`/`spawnBurstDots`/`rerenderDetailAndNav`；改寫勾選圈與列點擊 handler；`renderCourseDetailSection` 開頭清計時器；`undoComplete` i18n |
| `extension/dashboard/index.html` | `.completing`/`.bursting`/`.complete-undo-hint`/`.complete-burst-dot` CSS + 兩個 keyframes |

> 不改 `completion.js`（純邏輯不變）、不改 `background.js`、不改 `popup.js`。

---

> **2026-10-23 後記（QA #16／#113）**：§6 第一點「並行完成：先爆的那筆重繪時會清掉另一筆的計時器」的取捨**已作廢**，改為**批次收尾**：
>
> - 爆開後的重繪 timer 改登記進 `_completeTimers`（key `${id}:burst`），導覽離開時由 `clearCompleteTimers()` 一併清掉。`rerenderDetailAndNav(cid)` 只在仍停在該課詳情時重繪詳情，`rerenderWeekAndNav` 只在仍是週待辦版面時重繪週 section，延遲 callback 不會把舊課程或舊頁面畫回來（#113）。
> - `settleCompletion(rerender)`：一筆爆完（或被撤銷）時，如果還有其他撤銷窗口或爆開在進行，就先不重繪；已爆完的列/卡留在原位、已淡出，`.bursting` 帶 `pointer-events:none`，不推動其他列。等最後一筆收尾時再統一重繪一次。這樣每一筆都跑得完 1.5 秒窗口和碎點爆（#16；撤銷窗口已從 3 秒縮為 1.5 秒，見 `COMPLETE_DELAY_MS`）。
> - 撤銷窗口或碎點爆進行中導覽離開時，該列會殘留在已 `display:none` 的容器裡，直到那個容器下次重繪。即時刷新的 `isUiIdle()` 只看畫面上可見的 `.completing`／`.bursting`，這些殘留不會擋住背景同步或 popup 勾選的刷新。
> - §3 第三點「dashboard.js 無 `storage.onChanged` 監聽器」已不成立：現在有常駐監聽器（QA P1-3），但本頁自己寫入的回聲只合併資料、不重繪，所以動畫不會被打斷（見 CLAUDE.md 開發注意事項第 9 點）。

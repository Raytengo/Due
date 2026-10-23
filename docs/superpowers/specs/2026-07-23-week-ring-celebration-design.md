# 學期待辦進度環：平滑過渡 + 全部完成慶祝動畫 — 設計文件

- **日期**：2026-07-23
- **狀態**：**部分撤回**（見下方後記）；§2 平滑過渡已實作但技術方案已改
- **範圍**：只動 Dashboard 學期待辦頁左側「本週概覽」進度環（`.wk-ring`），不影響課程詳情頁圓餅圖、popup。

> **2026-07-23 後記（實作後視覺 review）**：§3 的貓耳朵與三色旋轉慶祝動畫實作出來後被使用者否決（「很難看」），已全部撤除。§2 的過渡保留但技術方案從 `@property --ring-pct` + conic-gradient 改為 **SVG stroke**（`stroke-dasharray`/`stroke-dashoffset` 過渡）：conic 硬切邊有鋸齒、端點平頭、又受限於 `::before` 挖洞結構，質感不足；SVG stroke 有抗鋸齒與圓帽端點。時長 0.5s → 0.8s（減速尾巴才看得見），曲線不變；分子數字加同曲線微上滑 tick。觸發改用同步 forced reflow 而非雙層 rAF（分頁隱藏時 rAF 被暫停，寫入永遠不落地、弧會卡在舊值）。
>
> **2026-07-23 慶祝動畫定案（經 design-mockups/ring-celebration-demo.html 互動比稿）**：採「**落點迸發**」——弧合攏落地的 `transitionend` 瞬間：環 1→1.04→1 微彈（spring）＋分子 pop、16 顆橘/藍/綠/暖黃碎點沿圓周外迸（帶 0.85 切線初速＝旋轉能量，放大多色版碎點爆、與勾完成同一動效字彙）、中心「本週完成」淡入換「**全部完成**」（`weekAllDoneLabel`，此後為持久狀態：全部完成時靜態顯示，不重播動畫）。觸發判定沿用 §3.1/3.2（勾完最後一項近期作業、render 端即時核對），實作於 `celebrateRingArrival`。三色旋轉環（實心與光帶版）經比稿後放棄——慶祝能量應「從環釋放到新維度」（粒子/縮放/內容），不是在環上再畫一層。

---

## 1. 目標

目前 `.wk-ring` 的 `conic-gradient` 百分比由 `renderWeekSection` 每次整段 `innerHTML` 重繪時直接內聯設定，沒有過渡效果，勾完作業後圓環是「瞬間跳」。

本次要做兩件事：

1. **進度環平滑過渡**：百分比變化時有動畫，且**終點明顯減速**（無回彈），帶出動態感。
2. **全部完成慶祝動畫**：使用者在學期待辦頁勾完「本週」最後一項未完成的近期作業（進度環的分母歸零）時，播放**三色旋轉**動畫，播完圓環維持綠色，並冒出**兩個貓耳朵**。之後只要這週維持全部完成，貓耳朵都直接顯示（不重播旋轉），一有新的未完成近期項目出現就跟綠色一起消失。

---

## 2. 進度環平滑過渡

### 2.1 技術方案：可動畫的 CSS 自訂屬性

`conic-gradient` 本身不能被 CSS transition 直接內插百分比，需要透過 `@property` 把 `--ring-pct` 註冊成可動畫的型別：

```css
@property --ring-pct {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

.wk-ring {
  transition: --ring-pct .5s cubic-bezier(0.16, 1, 0.3, 1);
  background: conic-gradient(var(--green) 0% var(--ring-pct), var(--border) var(--ring-pct) 100%);
}
```

- 曲線 `cubic-bezier(0.16, 1, 0.3, 1)`（expo-out）：前段快速填色，接近終點時明顯放慢、緩緩貼到定點，**沒有回彈**。
- 只支援 Chrome（`@property` Chrome 85+），符合本擴充功能 Chrome-only 前提（專案已用 `field-sizing: content` 等新特性）。

### 2.2 JS 端：跨重繪接續起點

`renderWeekSection` 每次整段 `innerHTML` 重繪會產生全新的 `.wk-ring` 節點，新節點若直接內聯目標百分比，transition 沒有「舊值」可接，等於沒有動畫。做法：

1. 重繪前，讀取畫面上**目前**的 `.wk-ring`（若存在）的 `getComputedStyle(...).getPropertyValue('--ring-pct')`，當作 `prevPct`（讀取 computed 值而非直接用上次算的 donePct，可以正確接續「動畫進行到一半又被打斷」的情況）。
2. 若畫面上還沒有 `.wk-ring`（首次掛載），`prevPct = donePct`（不做動畫，直接顯示最終值）。
3. 新 HTML 先用 `prevPct` 當作 `--ring-pct` 的內聯初始值插入 DOM。
4. 用雙層 `requestAnimationFrame` 確保瀏覽器完成一次繪製後，再把 `.wk-ring` 的 `--ring-pct` 設成目標 `donePct`，觸發 transition。

```js
const ringEl = document.querySelector('.wk-ring');
const prevPct = ringEl ? (parseFloat(getComputedStyle(ringEl).getPropertyValue('--ring-pct')) || 0) : donePct;
// ...渲染時 --ring-pct 內聯用 prevPct...
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const el = document.querySelector('.wk-ring');
    if (el) el.style.setProperty('--ring-pct', `${donePct}%`);
  });
});
```

這個過渡對**所有**會改變 `donePct` 的重繪都生效（勾選完成、切頁回來、同步等），不只完成動畫這條路徑。

---

## 3. 全部完成慶祝動畫

### 3.1 觸發時機

**只在** `finishCompleteWeek` 真正 commit 最後一筆「近期作業」的完成、且 commit 後 `nearDone === nearTotal > 0` 時，才播放三色旋轉；其餘情況（切頁、重繪、從課程詳情頁完成後回到週待辦、`beginCompleteWeek` 撤銷後又重新勾選但不是最後一項等）一律**不重播**旋轉，只依當下狀態直接顯示（全部完成 → 綠環 + 貓耳朵靜態顯示；否則正常部分填色環）。

「近期作業」＝進度環分母的定義：`urgency === 'urgent'`，或 `urgency === 'overdue'` 且在 30 天逾期窗內（與 `renderWeekSection` 現有 `isNear` 邏輯一致），且排除隱藏項（`isHidden`）。

### 3.2 判斷邏輯（dashboard.js）

抽出目前 `renderWeekSection` 內的 `isNear` 判斷為模組層共用函式：

```js
function isNearAssignment(a) {
  const u = DueTaskRules.urgency(a.due_at);
  return u === 'urgent' || (u === 'overdue' && DueTaskRules.isWithinOverdueWindow(a.due_at));
}

function computeNearProgress(courses, assignments) {
  const items = [];
  for (const course of courses) {
    for (const a of (assignments[course.id] || [])) items.push(a);
  }
  const nearItems = items.filter((a) => !isHidden(a) && isNearAssignment(a));
  const nearTotal = nearItems.length;
  const nearDone = nearItems.filter((a) => isDone(a)).length;
  return { nearDone, nearTotal };
}
```

`renderWeekSection` 原本內聯計算 `nearItems`/`nearTotal`/`nearDone` 改呼叫 `computeNearProgress`（結果不變，純重構）。

週卡片勾選 handler（`.week-task-check` click，目前約在 `renderWeekSection` 尾段）在 `toggleCompletion` 之後、決定要不要進入 `beginCompleteWeek` 時，順手算出這次勾選**是否會**讓近期作業全部完成：

```js
toggleCompletion(btn.dataset.extDone === 'true', id);
const a = ((_currentData.assignments || {})[cid] || []).find((x) => String(x.id) === id);
const nowDone = a ? isDone(a) : false;
if (nowDone && card) {
  const { nearDone, nearTotal } = computeNearProgress(_currentData.courses || [], _currentData.assignments || {});
  const celebrate = nearTotal > 0 && nearDone === nearTotal;
  beginCompleteWeek(card, id, cid, celebrate);
} else {
  rerenderWeekAndNav();
}
```

`celebrate` 旗標沿著既有的 1.5 秒撤銷窗口鏈路傳遞：`beginCompleteWeek(card, id, cid, celebrate)` → 計時器 closure 帶著 `celebrate` → `finishCompleteWeek(card, id, cid, celebrate)` → `rerenderWeekAndNav(celebrate)` → `renderWeekSection(courses, assignments, celebrate)`。

**撤銷視窗內取消**（`cancelCompleteWeek`）不受影響：本來就不會走到 `finishCompleteWeek`，`celebrate` 旗標自然作廢。

**Render 端仍需即時核對**：`renderWeekSection` 拿到 `celebrate=true` 後，仍要用當下重新算出的 `nearDone`/`nearTotal` 再驗證一次 `nearTotal > 0 && nearDone === nearTotal` 才真的播放旋轉，不完全信任呼叫端傳入的旗標——避免撤銷窗口等待期間資料有其他變動（例如背景同步）造成的不一致。

### 3.3 視覺：三色旋轉

`celebrate` 為真時，在 `.wk-ring` 內（`.wk-ring-center` 之前）插入三個疊層：

```html
<div class="wk-spin-arc wk-spin-1"></div>
<div class="wk-spin-arc wk-spin-2"></div>
<div class="wk-spin-arc wk-spin-3"></div>
```

```css
@keyframes wk-spin { from { transform: rotate(0deg); } to { transform: rotate(720deg); } }
@keyframes wk-spin-fade { to { opacity: 0; } }

.wk-spin-arc {
  position: absolute; inset: 0; border-radius: 50%;
  mask-image: radial-gradient(circle, transparent 58px, #000 60px);
  -webkit-mask-image: radial-gradient(circle, transparent 58px, #000 60px);
  pointer-events: none;
  animation: wk-spin .9s linear both, wk-spin-fade .3s ease-out 1.9s forwards;
}
.wk-spin-1 { background: conic-gradient(var(--orange) 0deg 90deg, transparent 90deg 360deg); animation-delay: 0s, 1.9s; }
.wk-spin-2 { background: conic-gradient(var(--blue)   0deg 90deg, transparent 90deg 360deg); animation-delay: .5s, 1.9s; }
.wk-spin-3 { background: conic-gradient(var(--green)  0deg 90deg, transparent 90deg 360deg); animation-delay: 1s,  1.9s; }
```

- 三層各自轉 720°／0.9s／`animation-delay` 差 0.5 秒（0s / 0.5s / 1.0s）→ 最後一層轉完約在 **1.9s**。
- 1.9s 時三層**一起** 0.3s 淡出（`wk-spin-fade`，同一個 delay），約 **2.2s** 時完全消失。
- `mask-image` 挖掉中心（跟 `.wk-ring::before` 的 118px 挖空半徑一致），只有圓環的甜甜圈色帶會被蓋到，中央的 `X/Y` 文字（DOM 順序在後，繪製在上層）全程不受遮擋。
- 底下 `.wk-ring` 本身此時已經是 `--ring-pct: 100%`（純綠），所以旋轉層淡出後自然露出綠色圓環，不需要額外收尾動畫。
- 旋轉層不清 DOM（跟現有 `complete-burst-dot` 的取捨一致）：opacity 0 之後無視覺/互動影響，下次任何重繪都會整段替換掉。

### 3.4 視覺：貓耳朵

顯示條件（**與是否正在慶祝無關**，是持續性狀態）：`nearTotal > 0 && nearDone === nearTotal`。

```html
<div class="wk-ears${celebrate ? ' wk-ears-pop' : ''}">
  <span class="wk-ear wk-ear-l"></span>
  <span class="wk-ear wk-ear-r"></span>
</div>
```

```css
.wk-ears { position: absolute; top: -9px; left: 50%; width: 96px; margin-left: -48px;
  display: flex; justify-content: space-between; pointer-events: none; }
.wk-ear { width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent;
  border-bottom: 18px solid var(--dark); position: relative; }
.wk-ear::before { content: ''; position: absolute; left: -9px; top: 3px; width: 0; height: 0;
  border-left: 9px solid transparent; border-right: 9px solid transparent; border-bottom: 13px solid var(--bg); }
.wk-ear-l { transform: rotate(-12deg); }
.wk-ear-r { transform: rotate(12deg); }

@keyframes wk-ears-pop {
  0%   { opacity: 0; transform: scale(0) translateY(6px); }
  60%  { opacity: 1; transform: scale(1.15) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.wk-ears-pop .wk-ear { animation: wk-ears-pop .35s cubic-bezier(.34,1.56,.64,1) 2.2s both; }
```

- 深色（`--dark`）外框三角形 + 背景色（`--bg`）內填三角形疊出「描邊」效果，跟整體「簡約線條」風格一致，不套用 `--green`。
- 靜態顯示（非慶祝）：無 `.wk-ears-pop`，直接 `opacity:1`、無位移，跟隨圓環一起出現/消失。
- 慶祝時：`.wk-ears-pop` 加上 2.2 秒延遲的彈出動畫（scale 0→1.15→1 的小彈跳），時間點正好接在旋轉層淡出（2.2s）之後。
- Dark mode 沿用 `--dark`/`--bg` 變數即自動適配，不需另外覆蓋。

---

## 4. 邊界與已知取捨

- **一次勾多筆的並行完成**：跟既有碎點爆動畫的取捨一致（見 [2026-07-21 完成過渡動畫設計 §6](2026-07-21-completion-burst-animation-design.md)）——先完成觸發重繪會清掉另一筆的計時器。若兩筆都是「最後兩項」，只有先 commit 的那筆會判斷到 `celebrate`；此為既有並行限制的延伸，可接受。
- **旋轉/彈出動畫進行中切頁或重繪**（例如使用者在 1.9 秒內按了「課程」分頁）：`clearCompleteTimers()`/整段重繪會直接換掉 DOM，動畫中止不報錯（新的 innerHTML 沒有殘留計時器依賴這些節點）。
- **貓耳朵消失即再出現**：不需要額外邏輯，`nearTotal > 0 && nearDone === nearTotal` 本來就是每次重繪即時算出的狀態，新項目一出現、或有近期作業被取消完成，下一次重繪自然不滿足條件、貓耳朵與綠色一起消失。
- **`nearTotal === 0`**（本週沒有任何近期作業）：不顯示貓耳朵（`nearTotal > 0` 前提），維持現狀（空的灰色環）。

---

## 5. 測試

動畫為 CSS/DOM 層，無法 node 單測。驗收方式：

1. `node --check extension/dashboard/dashboard.js` 無語法錯誤。
2. `node extension/dashboard/completion.test.js`、`taskRules.test.js` 等既有測試維持全綠（本次不改純邏輯，`computeNearProgress`/`isNearAssignment` 是既有邏輯的重構抽取，非新規則）。
3. 用專案既有 dev harness（`dev/harness.html`，`due-static` port 8765）在瀏覽器實測：
   - 進度環百分比變化時有平滑過渡、終點明顯減速無回彈。
   - 勾完本週最後一項近期作業 → 三色旋轉 → 收斂成綠環 + 貓耳朵彈出。
   - 切到課程頁再切回、或整頁重整，貓耳朵在「全部完成」狀態下直接顯示（不重播旋轉）。
   - 新增一筆近期作業（或取消某筆完成）後，貓耳朵與綠環立即消失。
   - Dark mode 下貓耳朵、三色旋轉色彩皆正常對比。

---

## 6. 影響檔案

| 檔案 | 變更 |
|------|------|
| `extension/dashboard/dashboard.js` | 新增 `isNearAssignment`/`computeNearProgress`；`renderWeekSection` 改用共用函式、加入 `celebrate` 參數與雙 rAF 接續起點邏輯、`.wk-spin-arc`/`.wk-ears` 條件渲染；`.week-task-check` click handler 算出 `celebrate` 並傳遞；`beginCompleteWeek`/`finishCompleteWeek`/`rerenderWeekAndNav` 簽章加 `celebrate` 參數 |
| `extension/dashboard/index.html` | `@property --ring-pct`、`.wk-ring` transition；新增 `.wk-spin-arc`/`.wk-spin-1/2/3`/`wk-spin`/`wk-spin-fade`/`.wk-ears`/`.wk-ear`/`wk-ears-pop` CSS |

> 不改 `completion.js`、`taskRules.js`、`background.js`、`popup.js`、課程詳情頁圓餅圖。

---

> **2026-10-23 後記（QA #193／#201／#16）**：§3.2 的「click 當下算 `celebrate` 旗標、沿 `beginCompleteWeek` → `finishCompleteWeek` → `rerenderWeekAndNav` 鏈路傳遞」與 §4 第一點的並行取捨**已作廢**，改為 render 端的**狀態轉移判定**：
>
> - `renderWeekSection(courses, assignments, fromCommit)`：`fromCommit` 只表示「這次是週卡完成 commit 的收尾重繪」（`rerenderWeekAndNav(true)`），不再帶任何點擊當下的判斷。模組層 `_ringAllDone` 記住上次渲染時近期作業是否全部完成（`null`＝尚未渲染）；`celebrateNow = fromCommit && allNearDone && _ringAllDone === false`，算完即更新 `_ringAllDone`。勾選 handler 不再呼叫 `computeNearProgress`。
> - 修掉的兩個問題：近期作業已全部完成後，再勾 8-30 天／30 天以上／無截止的作業不會重播慶祝（#193，上次已是 true，沒有轉移）；最後兩項間隔勾選時，先收尾的那筆會被延到批次重繪（見 [2026-07-21 碎點爆 spec 後記](2026-07-21-completion-burst-animation-design.md)），最後那次重繪仍看得到 false → true 的轉移，所以只播一次、不會漏播（#201）。
> - §4「並行完成會清掉另一筆計時器」不再成立：連勾多筆時，每筆都會跑完整的撤銷窗口，最後一筆收尾後才統一重繪（`settleCompletion`，#16）。

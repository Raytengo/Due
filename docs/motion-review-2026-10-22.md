# Due 動效審查（Animate UI skill v2 規則）— 2026-10-22

> 規則來源：`.claude/skills/animate-ui`（`references/rules.md` A1–A17 品質規則＝bug；B1–B9 風格規則＝預設）。
> Due 是 vanilla JS，Animate UI 的 React 套件／import swap／CLI audit 都用不上（audit 對 Due 回報 0 facts），
> 這裡只借用它的**規則與 token**；所有修法都是純 CSS/JS，spring token 已用 skill 的 `css-timing.mjs` 轉成 CSS `linear()`。

## 流程與可信度

- 6 個維度各一個 finder → 每維度一個 adversarial verifier 對原始碼反駁 → synthesizer 去重排序＋查漏。
- 93 條通過驗證（63 confirmed／30 adjusted），103 條被駁回或歸為「使用者已拍板」，合併後 **52 條**。
- 我親手在 `dev/harness.html`／`dev/popup-harness.html` 重現了 4 條（均成立）：
  1. 勾完一張週卡 → `.week-right` scrollTop 400 → 0（#12）
  2. 勾完後 `document.activeElement === body`（#1）
  3. 1.5 秒內連勾兩張卡 → 第二張在自己的撤銷窗剩約 1.2s 就消失、無碎點爆（#12）
  4. popup 收合 200ms 內點該列 → 列消失但 `manualDone` 變 `{}`，與畫面不一致（#14）

## 一個根因吃掉 6 條

**完成後用 `innerHTML` 整段重建**（`finishComplete`／`finishCompleteWeek` → `rerender*AndNav` → `clearCompleteTimers()`）同時造成：
焦點掉到 body（P0 #1）、捲動歸零與展開面板收合、砍掉其他撤銷窗中的項目、最後兩項連勾不慶祝（P1 #12）、
剩餘列一幀跳進空位（P1 #18）、週卡沒有出場（P1 #19）、碎點長在淡出中的列裡看不見（P1 #20）、倒數條方角（P3 #44）。
→ 改成「就地移除節點＋FLIP 收合，計數/進度環局部更新」一次修完；分開修會在 FLIP 量測時機、用 id 還原焦點、`clearCompleteTimers` 互相打架。
權重儲存／重設（dashboard.js:3270-3291）也是同一個根因（見 Gaps）。

## 必須同時出貨的配對

- reduced-motion 的 CSS 與 JS（#0）：只寫 CSS、把 `.wk-ring-bar` 設 `transition:none` 會讓 `transitionend` 不觸發，落點迸發與「全部完成」cap 一起消失。


## P0 — 對部分使用者是壞的（無障礙／鍵盤／觸控）

### #0 Dashboard 完全沒有 reduced-motion 路徑（CSS 與 JS 動效都沒有），popup 只停了火焰

- **規則**：A1（loop 部分為 A4）　**頻率**：constant
- **位置**：`dashboard/index.html:2276`, `dashboard/index.html:2283`, `dashboard/index.html:2389-2395`, `dashboard/index.html:675`, `dashboard/index.html:706-714`, `dashboard/index.html:1032` 等 26 處
- **現況**：在整個 extension/ grep prefers-reduced-motion|matchMedia，只有 popup.html:362 一處命中，而且那條規則只停掉火焰。OS 開啟「減少動態」後，以下動效照樣完整播放。CSS：卡片 hover 上浮 2px、content-arrive 4px、進度環 0.8s stroke、分子 7px tick、完成碎點飛 42–60px、welcomeIn scale(0.96)、教學 track 680px 滑動、chevron 旋轉 90°、sync dots 無限彈跳 4px、skeleton shimmer 無限循環、VT morph 的位移與縮放。JS：switchPage 全寬 0.45s slide、wk-sum-row smooth scroll、celebrateRingArrival 的 WAAPI scale 1.04/1.16 加 16 顆粒子、拖曳 clone 的 scale(1.02) rotate(0.4deg) 加 240ms 飛行。popup：finalize() 的 max-height 收合，以及兩顆按鈕 hover 上浮 1px。
- **為什麼**：A1：減少動態時保留淡入淡出與 blur，拿掉位移、縮放和旋轉；A4：loop 要停，loader 改成 opacity pulse。卡片上浮和完成碎點每個 session 都會出現很多次，是最常遇到的違規。CSS media query 管不到 WAAPI 和 scrollTo，所以 JS 要自己檢查。另外有個暗坑：只寫 CSS、把 .wk-ring-bar 設成 transition:none，transitionend 就永遠不會觸發，使用者拍板的落點迸發和「全部完成」cap 會一起消失。

<details><summary>修法</summary>

```
CSS 和 JS 必須放在同一個 change 出貨。
CSS（index.html <style> 結尾，放在 3246 的 a11y 區塊旁邊）：
@keyframes rm-fade { from { opacity: 0 } }
@media (prefers-reduced-motion: reduce) {
  :root { --lift: 0px; --scale-press: 1; --scale-choice: 1; --modal-from: none; }
  .course-card-grid:hover { transform: none; }            /* border/shadow 保留 */
  #main-section.arrive > *, .wk-ring-frac b.tick, .welcome-card { animation-name: rm-fade; }
  .complete-burst-dot, .wk-celebrate-dot { display: none; }
  .wk-ring-bar, .hidden-items-arrow, .welcome-track { transition: none; }
  @keyframes dot-pulse { 0%, 80%, 100% { opacity: .4 } 40% { opacity: 1 } }
  .sync-dots span { animation-name: dot-pulse; }          /* A4：保留 1.2s 節奏，不位移 */
  .skel { animation: none; }                              /* skeleton.md：loop 停止 */
}
JS（dashboard.js 頂部）：const _rmq = matchMedia('(prefers-reduced-motion: reduce)'); const reduceMotion = () => _rmq.matches;
• 1434：if (reduceMotion() || Math.abs(prevOffset - targetOffset) < 0.5) celebrateRingArrival(_ringEl);
• celebrateRingArrival：先執行 cap.textContent = tr('weekAllDoneLabel'); cap.animate([{opacity:0},{opacity:1}], {duration:300, easing:'cubic-bezier(0.23, 1, 0.32, 1)'})（transition.reveal），接著 if (reduceMotion()) return;，跳過 ring/分子 scale 與 16 顆粒子。
• 1502：behavior: reduceMotion() ? 'auto' : 'smooth'。
• showCourseDetail/showGridView：所有 el.style.viewTransitionName = 'course-*' 都包進 if (!reduceMotion())，只留 vt-root 的 0.08s/0.1s opacity crossfade。不要改用 group animation-duration:0s，那樣 old 快照仍會被放大後淡出。
• switchPage：用 P1 的 WAAPI 版，reduce 時 transform 設 'none'，只留 opacity。
• positionClone：reduce 時只寫 translate(dx,dy)，直接操作保留。settleClone：reduce 時走現有的「no target」分支，200ms cubic-bezier(0.23, 1, 0.32, 1) 淡出（transition.fade），drag-arrived 閃色保留。
• 之後新增的 FLIP、modal 縮放、disclosure 高度都讀同一個 reduceMotion()。
Popup：popup.html:362 的區塊補上 .usage-chip:hover, .usage-refresh:hover:not(:disabled) { transform: none; } .task-item.collapsing.rm { transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1); }。popup.js finalize()：if (matchMedia('(prefers-reduced-motion: reduce)').matches) { li.classList.add('collapsing', 'rm'); li.getBoundingClientRect(); li.style.opacity = '0'; setTimeout(() => { li.remove(); maybeShowEmpty(); }, 200); return; }。class 一定要加上，否則淡出規則不會生效。
保留不動：.complete-countdown（撤銷期限是 meter，不算位移）、.bursting 的 opacity、drag-arrived、vt-root 淡入淡出、所有顏色過渡。.welcome-step[inert] { opacity: 0 } 只能和 P0 教學 inert 修正一起上。
```
</details>

### #1 完成一項後焦點掉到 <body>（dashboard 詳情列、週卡、popup 都會）

- **規則**：A17　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1969-1974`, `dashboard/dashboard.js:2022-2027`, `dashboard/dashboard.js:1937`, `dashboard/dashboard.js:1990`, `popup.js:347-358`
- **現況**：beginComplete 讓焦點留在 check 上，並把 aria-label 換成 markUndone。1.5s 撤銷窗結束後，finishComplete 會 setTimeout(rerenderDetailAndNav, 480)，用 innerHTML 重建整段，被 focus 的 check 跟著被銷毀。harness 實測完成後 document.activeElement === body，週卡（finishCompleteWeek）也一樣。popup 的 li.remove()（357）同樣帶走焦點，而且收合中、正淡出的那一列在 200ms 內仍然可以被 Tab 到。
- **為什麼**：A17：被移除的項目如果持有焦點，要交給鄰居；正在離場的元素不能接收焦點。完成是每天最核心的動作，鍵盤使用者每勾一項都得從文件頂端重新 Tab，用鍵盤逐項清單根本做不到。

<details><summary>修法</summary>

```
在 burst 開始時移動焦點（也就是 1.5s 窗結束時）。不要在點擊當下移，因為窗內在同一個 check 上按 Enter/Space 就是鍵盤的撤銷路徑。記 id、不記節點，重建後再用 id query：
function finishComplete(item, id, cid) {
  const hadFocus = item.contains(document.activeElement);
  const rows = [...item.parentElement.querySelectorAll('.assignment-item')];  // 跳過 .assignment-desc
  const i = rows.indexOf(item);
  const nb = (rows[i + 1] || rows[i - 1])?.querySelector('.assignment-check');
  const nbId = nb?.dataset.assignmentId;
  if (hadFocus && nb) nb.focus({ preventScroll: true });
  item.inert = true;
  spawnBurstDots(item); item.classList.add('bursting');
  setTimeout(() => {
    rerenderDetailAndNav(cid);
    if (!hadFocus) return;
    const c = document.getElementById('course-detail-container');
    (nbId && c.querySelector(`.assignment-check[data-assignment-id="${CSS.escape(nbId)}"]`) || c.querySelector('.detail-assignments-label'))?.focus({ preventScroll: true });
  }, COMPLETE_BURST_MS);
}
.detail-assignments-label 加上 tabindex="-1"。finishCompleteWeek 比照：鄰居取同一個 .week-task-grid 的下一張 .week-task-card，沒有就取下一組的第一張，再沒有就退到 #page-title（tabindex=-1）。
Popup finalize() 開頭：if (li.contains(document.activeElement)) { const sib = (el, d) => { let n = el[d]; while (n && !n.matches('.task-item')) n = n[d]; return n; }; const t = sib(li, 'nextElementSibling') || sib(li, 'previousElementSibling'); (t ? t.querySelector('.task-check') : document.getElementById('dashboard-btn')).focus({ preventScroll: true }); } li.inert = true;。這段也一併修掉 P1 的 popup 收合點擊 bug。
```
</details>

### #2 開關課程詳情（View Transition）時鍵盤焦點掉到 <body>

- **規則**：A17　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1658-1745`, `dashboard/dashboard.js:1715`, `dashboard/dashboard.js:1749-1816`, `dashboard/dashboard.js:1781`, `dashboard/dashboard.js:1791-1793`
- **現況**：在 .course-card-grid 或 .week-task-card 上按 Enter，會呼叫 card.click()，接著 showCourseDetail。VT callback 和 fallback 都設 mainSection.style.display='none'（1679/1714-1715），把正在 focus 的卡片藏起來。showGridView 用 innerHTML 重繪清單（1791/1793），並把 #detail-back-btn 藏掉（1781）。兩個函式都沒有呼叫 focus()。harness 實測：開詳情後、按返回後，activeElement 都是 BODY。
- **為什麼**：A17：焦點要跟著動效走，而不是等動效結束。視圖換掉時焦點應落在新內容上，回來時要還給觸發它的元素。這是 dashboard 最常用的 drill-down，現在鍵盤使用者每開一次課、每回一次清單都得從頭 Tab。

<details><summary>修法</summary>

```
在 startViewTransition 的 update callback 裡移動焦點（不要放在 transition.finished）。
• showCourseDetail 開頭先記住來源：const originSel = cardEl?.matches('.week-task-card') ? `.week-task-card[data-assignment-id="${CSS.escape(cardEl.dataset.assignmentId)}"]` : `.course-card-grid[data-course-id="${courseId}"]`;。callback 和 no-VT fallback 都在 renderCourseDetailSection 之後執行：const h = detailContainer.querySelector('.detail-name-text'); h.tabIndex = -1; h.focus({ preventScroll: true });
• showGridView 的 callback 在清單渲染完成後執行：(document.querySelector(originSel) || document.getElementById('page-title'))?.focus({ preventScroll: true });，#page-title 加上 tabindex="-1"。
程式設定的 focus 在滑鼠點擊後不會觸發 :focus-visible，滑鼠使用者看不出差別，不必區分輸入方式。這段不影響 view-transition-name 的指派，morph 照常。
```
</details>

### #3 沒有 role=status live region：完成、撤銷窗、同步、拖曳結果、全部完成都只有視覺

- **規則**：A17　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1945`, `dashboard/dashboard.js:1997`, `dashboard/dashboard.js:2866-2889`, `dashboard/dashboard.js:2404`, `dashboard/dashboard.js:1254`, `dashboard/index.html:3435` 等 7 處
- **現況**：index.html 和 dashboard.js 裡沒有任何 aria-live 或 role="status"（grep 0 筆），index.html 也沒有 .sr-only 或 .visually-hidden 這類 class。完成只顯示橘色倒數條和「↩ 撤銷」<div>，唯一可存取的變化是 focused 按鈕的 aria-label 改了，但螢幕閱讀器通常不會念出來。Sync 時 innerHTML 換成三個空 <span>（2868），按鈕的 accessible name 變成空字串；它還對正在 focus 的按鈕設 btn.disabled = true（2869），焦點因此被丟掉。同步成功沒有任何訊號，失敗只顯示 2.5s。拖曳升降級和「全部完成」都只有動效。popup 一樣沒有 live region。
- **為什麼**：A17：只用動效呈現的結果，也要透過一開始就掛好的 role=status 區域念出來。螢幕閱讀器使用者現在不知道作業已完成、不知道有一個 1.5s 的撤銷窗正在跑，也不知道同步有沒有完成。

<details><summary>修法</summary>

```
index.html 的 <body> 一開頭加 <div id="a11y-status" class="sr-only" role="status" aria-live="polite"></div>，並新增 .sr-only { position:absolute; width:1px; height:1px; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0 }。
JS：function announce(msg) { const r = document.getElementById('a11y-status'); r.textContent = ''; setTimeout(() => { r.textContent = msg; }, 50); }
呼叫點：
• beginComplete* →「已完成「{name}」，1.5 秒內再按一次可撤銷」
• cancelComplete* →「已撤銷」
• commitDrag 和鍵盤移動 →「「{name}」已移到已隱藏」或「…已移回作業清單」
• celebrateRingArrival → tr('weekAllDoneLabel')
• sync 結果 → tr('syncDone') 或 tr('syncFailed')
Sync 鈕：btn.innerHTML = '<span class="sync-dots" aria-hidden="true"><span></span><span></span><span></span></span><span class="sr-only">' + tr('syncing') + '</span>'; btn.setAttribute('aria-busy', 'true');。改用 aria-disabled="true" 加上 handler 開頭的 early return，取代 btn.disabled，這樣焦點不會掉。新字串在 zh-TW、zh-CN、en 三語都要補齊。
Popup：掛 <p id="popup-status" role="status" class="sr-only"></p>，enterUndo 寫入「{name} 已完成，可撤銷」，cancelUndo 寫入撤銷結果。
```
</details>

### #4 焦點框被捲動容器裁掉左側：週卡（.week-right）與 popup 勾選圈（.task-list）

- **規則**：A17　**頻率**：constant
- **位置**：`dashboard/index.html:794-800`, `dashboard/index.html:3253`, `popup.html:171-172`, `popup.html:64-70`
- **現況**：.week-right 是 overflow-y:auto，overflow-x 因此算成 auto，而它的 padding-left 是 0。左欄卡片的左緣和捲動容器左緣重合（615px = 615px），卡片的 ring（2px，offset 2px）超出卡片 4px，左邊那段被裁掉。popup 也一樣：.task-check 和 .task-list 的左緣都在 x=18，ring 的左邊同樣被裁。
- **為什麼**：A17 的檢查清單要求 ring 不可被裁切。這兩處分別是 dashboard 的主頁和 popup 的每一列，鍵盤使用者每次 focus 都會看到缺了一邊的框。

<details><summary>修法</summary>

```
週卡改用 inset ring，這是規則首選的做法，也一起蓋掉最後一列的底邊：.week-task-card:focus-visible { outline-offset: -2px; }。
Popup 給 ring 留空間，內容不動：.task-list { margin-inline: -4px; padding-inline: 4px; }。content box 仍是 284px，不會出現水平捲動；popup.html 200-201 註解警告的是列寬超過清單，跟這裡無關。這 4px 同時是 P1 勾選圈擴大熱區與 halo 需要的空間。
```
</details>

### #5 改名鉛筆在 opacity:0 時仍是 Tab 停點：焦點完全看不見

- **規則**：A17　**頻率**：occasional
- **位置**：`dashboard/index.html:2563-2585`, `dashboard/index.html:2575`, `dashboard/index.html:2579`, `dashboard/dashboard.js:2104`
- **現況**：.btn-rename-course 是 <button>，預設 opacity:0，只有 .detail-name:hover 會把它顯示出來，沒有任何 :focus-visible 或 :focus-within 規則。它是每個課程詳情裡的第一個 Tab 停點。harness 實測：:focus-visible 生效時 computed opacity 仍是 0，2px 橘色 outline 有畫，但 opacity 連 outline 一起隱藏了。觸控裝置上要先點一下課名，按鈕才會出現。
- **為什麼**：A17：看不見的東西不能接收焦點，ring 要立即出現。每次用鍵盤走過詳情頁都會撞到這個隱形的停點。按鈕有 title，所以並非沒有名稱，aria-label 只是加分。

<details><summary>修法</summary>

```
.btn-rename-course:focus-visible { opacity: 1; transition: none; }
@media (hover: hover) and (pointer: fine) { .detail-name:hover .btn-rename-course { opacity: 1; } }
@media (hover: none) { .btn-rename-course { opacity: .6; } }
hover 淡入改成 opacity 200ms ease（transition.color）。.btn-rename-course 本身是 position:absolute，這些修改不會影響 View Transition 的高度。
```
</details>

### #6 拖曳隱藏/還原沒有鍵盤與螢幕閱讀器路徑

- **規則**：A2；interaction:reorder　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:8`, `dashboard/dashboard.js:2259-2276`, `dashboard/dashboard.js:2321-2329`, `dashboard/dashboard.js:2404-2414`
- **現況**：DRAG_GRIP 是 <span class="drag-grip" aria-hidden="true">，只綁 pointerdown 和 click。setItemHiddenByDrag 只有 commitDrag 會呼叫，所以要在作業清單和「已隱藏」之間移動項目，唯一的方法是滑鼠或觸控拖曳。教學第 4 頁把它當核心功能介紹。liftRow 把 cloneNode(true) append 到 body，複本裡有 check <button>，但沒設 inert 也沒設 aria-hidden。
- **為什麼**：A2 要求鍵盤得到和 pointer 一樣的動效，這裡鍵盤完全沒有路徑，鍵盤和螢幕閱讀器使用者無法隱藏或還原項目。reorder.md 也要求按鈕替代方案、polite 播報，以及移動後歸還焦點。

<details><summary>修法</summary>

```
把 grip 渲染成 <button type="button" class="drag-grip" aria-label="${tr(dir === 'promote' ? 'a11yShowItem' : 'a11yHideItem')}">…svg…</button>，pointerdown 保留。
加 keydown Enter/Space → keyboardMove(row, zones)：用 lifted:true、over:true、base = row.getBoundingClientRect() 建一個和 trackDragFrom 相同的 ctx，比照 liftRow 建 clone，再 commitDrag(ctx)。這樣鍵盤會得到同樣的 settleClone 飛入和 drag-arrived 閃示（A2）。注意這個 ctx 不能指派給 _dragCtx，也不能註冊 window listener，否則 setItemHiddenByDrag 內的重繪會跑 abortActiveDrag()，在 settleClone 之前就把 clone 刪掉。
移動後焦點放到落地那一列的 .drag-grip；如果落在鎖定位置，就放到鄰居。用 announce() 播報「「{name}」已移到已隱藏」或「…已移回清單」。
liftRow 加 clone.inert = true; clone.setAttribute('aria-hidden', 'true');。CSS 加 .drag-grip:focus-visible { opacity: 1; }。減少動態時沿用 P0-1 的 settleClone 淡出分支。
```
</details>

### #7 作業描述與成績計算器無法用鍵盤展開，也不暴露展開狀態

- **規則**：A2 / A17　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:2784`, `dashboard/dashboard.js:2138-2149`, `dashboard/dashboard.js:2657`, `dashboard/dashboard.js:2519`
- **現況**：負責展開 .assignment-desc 的那一列是沒有 tabindex、沒有 role 的 div；.grade-calc-header 也是 div。兩者都 Tab 不到，所以兩個面板都無法用鍵盤打開。.hidden-items-toggle 是真正的 button，但沒有 aria-expanded（實測為 null）。
- **為什麼**：A2：用 Enter 打開的面板應該和點擊打開的一樣，這裡則是根本打不開。

<details><summary>修法</summary>

```
描述：把 disclosure 語意放在沒有可聚焦子孫的 .assignment-left 上（裡面只有標題 span 和 aria-hidden 的 grip），屬性為 role="button" tabindex="0" aria-expanded="false" aria-controls="desc-{id}"，keydown Enter/Space 呼叫和整列點擊相同的 toggle，對應的 .assignment-desc 加 id="desc-{id}"。整列本身不要設成可聚焦，否則會把 check、編輯、刪除按鈕包進 role=button，構成 axe 的 nested-interactive 違規。
成績計算器：.grade-calc-header 改成 <button type="button" aria-expanded="false">，CSS 補 width:100%; border:0; font:inherit; text-align:left，保留原本的 flex 排版。.grade-calc 有 overflow:hidden，所以 ring 用 inset：.grade-calc-header:focus-visible { outline: 2px solid var(--orange); outline-offset: -2px; }。
在 2147、2214、2235 三處同步更新 aria-expanded，.hidden-items-toggle 也一併補上。
```
</details>

### #8 其他「重建或移除持有焦點的控制項」路徑：分頁鈕、改名、權重列刪除、教學按鈕、自訂作業編輯/刪除

- **規則**：A17　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:1647`, `dashboard/dashboard.js:1836-1842`, `dashboard/dashboard.js:1888`, `dashboard/dashboard.js:3220`, `dashboard/dashboard.js:3260`, `dashboard/dashboard.js:3017` 等 8 處
- **現況**：以下幾處都會讓 activeElement 變成 BODY（harness 實測）：
• updateCardPage 用 outerHTML 換掉整個 .card-bottom，分頁鈕一起被換掉，每按一次焦點就回到文件。
• 課程改名 commit/cancel 後 span 重建；側欄改名經 renderNav 重建。
• 刪除權重列時 row.remove()，焦點掉出 modal 的 trap，下一個 Tab 會進到後面的頁面。
• 教學的 _welcomeUpdateButtons 每一步都 btnRow.innerHTML = html，按「開始設定」後焦點掉到 body，trap 在 overlay 上聽 keydown，因此 Tab 可以離開 modal。
• 自訂作業編輯或刪除後，setupModalA11y 把焦點還給列上的按鈕，接著 loadData 非同步重建把那顆按鈕拆掉。
- **為什麼**：A17：swap 要保留被 focus 的元素；移除持有焦點的元素時要交給鄰居；modal 後面的東西不能拿到焦點。鍵盤使用者因此無法連續翻頁、無法連按兩次 Enter 走完教學，刪除權重後焦點還會跑到 modal 背後。

<details><summary>修法</summary>

```
• 分頁鈕：只重繪 .card-rows-container 的 innerHTML，.card-pager-info 文字和兩顆按鈕的 disabled 就地更新，listener 在 renderCardGrid 綁一次就好；如果 focused 的按鈕變成 disabled（第一頁或最後一頁），把焦點移到另一顆。
• 課程改名：只在 Enter/Escape 分支呼叫 renameBtn.focus({ preventScroll: true })，例如 commit({ refocus: true })；blur 觸發的 commit 不動焦點，避免把使用者剛 Tab 或點走的焦點搶回來。側欄改名在 renderNav 之後，只有 Enter/Escape 時 focus .nav-course-item[data-target-course="${courseId}"]。
• 權重列：const row = btn.closest('.weight-edit-row'); const next = row.nextElementSibling || row.previousElementSibling; row.remove(); (next?.querySelector('.weight-edit-del') || document.getElementById('weight-edit-add')).focus();（3260 同樣處理）。
• 教學按鈕：保留兩顆按鈕節點，只更新 data-wgo、文字和 class；最低限度的做法是 const hadFocus = btnRow.contains(document.activeElement); 換完 innerHTML 後 if (hadFocus) btnRow.lastElementChild?.focus();。
• 自訂作業：重建後用 id 重新 query。編輯完 focus 該列的 .btn-edit-custom-assignment；刪除後 focus 鄰居的 .assignment-check；新增則維持在 #btn-add-assignment（它不會被重建，現在已經正確）。
```
</details>

### #9 教學 modal：畫面外的 step 可被 Tab 到，overflow:hidden 被捲動後 track 錯位、卡片一片空白

- **規則**：A17　**頻率**：rare
- **位置**：`dashboard/dashboard.js:3023-3047`, `dashboard/dashboard.js:3336-3340`, `dashboard/index.html:1448-1453`, `dashboard/index.html:3707`
- **現況**：5 個 .welcome-step 都留在 500% 寬的 track 裡，沒有一個設 inert。_focusablesIn 只用 getClientRects 過濾，被裁掉的元素照樣通過，所以 focus 序列是 [welcome-close, 第 5 頁 mailto, welcome-btn]。從關閉鈕按一次 Tab 就到了第 5 頁的 mailto，.welcome-main-area.scrollLeft 從 0 跳到 2696.5（overflow:hidden 仍可被 focus 捲動）。之後每次 welcomeGoStep 的 translate 都偏掉這段距離，截圖確認卡片主區空白、dots 卻顯示第 2 頁。螢幕閱讀器會把 5 頁全部念出來。
- **為什麼**：A17：畫面外的 step 要設 inert，Tab 不可以落在沒人看得見的東西上。這是首次安裝的 onboarding，鍵盤使用者按一次 Tab 就會把教學弄壞。

<details><summary>修法</summary>

```
function _welcomeInert(n) { document.querySelectorAll('#welcome-track .welcome-step').forEach((s, i) => { s.inert = i + 1 !== n; }); }
openWelcomeModal() 裡呼叫 _welcomeInert(1)；welcomeGoStep(n) 在設定 transform 之前呼叫 _welcomeInert(n)，讓離場頁一開始就是 inert。
CSS：.welcome-main-area { overflow: clip; }。clip 不是 scroll container，focus 捲不動它。
_focusablesIn 加上 .filter((el) => !el.closest('[inert]'))。
減少動態時（P0-1 的區塊）：.welcome-step[inert] { opacity: 0 } 配 .welcome-step { transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1); }，換頁變成淡入淡出。
```
</details>

### #10 語言子選單：鍵盤打不開、hover 無 pointer gate、關閉路徑移除的是不存在的 class、每換一次語言多一個孤兒節點

- **規則**：A3 / A2；recipe:menu　**頻率**：rare
- **位置**：`dashboard/dashboard.js:463-469`, `dashboard/dashboard.js:473-528`, `dashboard/dashboard.js:508-516`, `dashboard/dashboard.js:2954`, `dashboard/dashboard.js:2963`, `dashboard/dashboard.js:2976` 等 9 處
- **現況**：「語言」是 <div class="settings-menu-item has-submenu">，沒有 tabindex，只綁 onmouseenter/onmouseleave（521-528），沒有 pointer 判斷。子選單在 .submenu-visible 之前是 visibility:hidden，所以鍵盤無法切換語言。四條關閉路徑都只移除 'submenu-open'，而沒有任何程式碼加上這個 class；真正控制顯示的是 'submenu-visible'。觸控點一下會觸發 mouseenter，之後收不到 mouseleave，子選單就以 z-index 9999 卡在畫面上。另外 applyUILanguage 每次都重建一個新的 .settings-submenu 並 append 到 body，舊的那個從沒被刪掉，還保留 submenu-visible；實測點 English 400ms 後，母選單已經關閉，舊子選單的 opacity 仍是 1。
- **為什麼**：A3：自己接線的 hover 要加 pointer gate。A2：鍵盤要有和 pointer 一樣的路徑。menu recipe：子選單跟著母選單進出。現在母選單消失了，子選單還單獨懸在原地。

<details><summary>修法</summary>

```
• 把「語言」改成 <button class="settings-menu-item has-submenu" aria-haspopup="menu" aria-expanded="false">。click、Enter、Space、ArrowRight 都呼叫 openSubmenu() 並 focus 第一個語言按鈕；Escape、ArrowLeft 收回並把焦點還給「語言」。
• hover 加 gate：const canHover = matchMedia('(hover: hover) and (pointer: fine)'); menuLanguageLabel.onmouseenter = () => { if (canHover.matches) openSubmenu(); };
• 新增統一的 closeSettingsMenu()：移除 #settings-menu 和 #settings-menu-btn 的 .open，並移除 body 層 .settings-submenu 的 submenu-visible。setLang、外部點擊、齒輪 toggle、Claude 用量、使用教學五處都改呼叫它，取代四處 classList.remove('submenu-open')。
• bindLanguageMenuActions 在搬到 body 之前先清掉舊的：document.querySelectorAll('body > .settings-submenu').forEach((s) => { if (s !== menuLanguageSubmenu) s.remove(); });
```
</details>

### #11 CSS hover 未限定可 hover 的指標：觸控時上浮、勾選 halo、grip 黏住；改名鉛筆只有 hover 才出現

- **規則**：A3　**頻率**：rare
- **位置**：`dashboard/index.html:2280-2284`, `dashboard/index.html:2579`, `dashboard/index.html:2845-2848`, `dashboard/index.html:1004-1008`, `dashboard/index.html:890`, `popup.html:120` 等 11 處
- **現況**：index.html 唯一的 @media 是四個寬度斷點（3367-3382），popup.html 也沒有任何 (hover: hover)。在觸控螢幕（ChromeOS、Windows 2-in-1）上，點一下就會把 :hover 黏住：課程卡一直浮著 2px；撤銷後勾選圈還留著綠色 12% 填色和 4px halo，看起來像完成了一半；grip 一直是 0.45 opacity；popup 頂部按鈕維持上浮和橘色。
- **為什麼**：A3：hover 效果只給支援 hover 的指標。觸控使用 dashboard 屬於少數，所以排在本 tier 最後；但黏住的勾選 halo 會誤報完成狀態。

<details><summary>修法</summary>

```
把會移動或會揭示東西的 hover 區塊包進 @media (hover: hover) and (pointer: fine) { … }，包括 .course-card-grid:hover、.week-task-card:hover、.detail-name:hover .btn-rename-course、.assignment-item:hover .drag-grip、.hidden-item-row:hover .drag-grip、.assignment-check:hover，以及 popup 的六條 hover。最好整份檔案的 :hover 都包進去。:focus-visible 與 :active 留在外面。(hover: none) 下設靜止 fallback：.btn-rename-course { opacity: .6 } .drag-grip { opacity: .85 }。
```
</details>


## P1 — 每天都會碰到的卡頓或錯誤

### #12 完成後整段 innerHTML 重建：捲動跳回頂端、展開的面板收合、其他仍在撤銷窗內的項目被砍掉、最後兩項連勾時不慶祝

- **規則**：interaction:list（continuity）/ A12　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1937`, `dashboard/dashboard.js:1990`, `dashboard/dashboard.js:1298`, `dashboard/dashboard.js:2062`, `dashboard/dashboard.js:1400`, `dashboard/dashboard.js:2095` 等 9 處
- **現況**：rerenderWeekAndNav 和 rerenderDetailAndNav 都用 innerHTML 重建整段，捲動容器 .week-right 和 .detail-right-panel 被換成新元素。實測 scrollTop 1327→0、150→0；開著的 .grade-calc 和 .assignment-desc 都回到收合。每次重建前都會 clearCompleteTimers()（1298/2062），把其他仍在 1.5s 窗內的 timer 一併清掉；那些項目在點擊時已寫進 manualDone，於是重建後直接消失，沒有 burst，也無法撤銷（harness：A 在 0ms、B 在 802ms 勾選，B 在 2004ms 消失，manualDone[B] 已經持久化）。celebrate 在點擊時就決定好（1462-1463），A、B 是最後兩項時，A 的重建傳入 celebrate=false，進度環到 14/14，只顯示靜態的「全部完成」，慶祝不會觸發。commitDrag（2405-2414）已經處理過同樣的捲動重置，完成路徑卻沒有。
- **為什麼**：list recipe：清單在變動時仍是同一張清單。在 8-30 天那組勾一項，整個清單就跳回頂端；連續勾選（追進度時最常見的做法）會讓後勾的項目失去撤銷安全網，也錯過使用者拍板的落點迸發。這發生在 app 最常做的動作上。

<details><summary>修法</summary>

```
建議做法：burst 結束後只移除那個節點，其餘就地更新：直接設 .wk-ring-bar.style.strokeDashoffset，讓既有的 0.8s 過渡重新導向；分子、群組 '(N)'、wk-sum 列、側欄計數都只改文字。不重建，捲動、展開狀態、其他 timer 就全都保得住，P0 焦點、P1 FLIP、P1 週卡出場也會變簡單。
若暫時保留重建，最低限度三件事：
(a) 重建前同步記下 .week-right／.detail-right-panel 的 scrollTop、.grade-calc 是否有 .open、開著的 desc id（desc.previousElementSibling.dataset.hideableId）；innerHTML 之後同步還原，比照 commitDrag 的做法，不要用 rAF。
(b) 改成 _completeTimers[id] = { timer, startedAt: Date.now() }。渲染時 _completeTimers 裡的 id 照樣畫出來並帶 .completing，countdown 設 style.animationDelay = -(Date.now() - startedAt) + 'ms' 接著跑；timer 觸發時用 id 重新 query 節點；clearCompleteTimers() 只在換頁或換課時呼叫。
(c) celebrate 改在最後一個 pending burst 時判斷：Object.keys(_completeTimers).length === 0 && nearDone === nearTotal && _prevRingDone < nearTotal。
```
</details>

### #13 按下勾選後列或卡片變高、把下面整排往下推，撤銷時又彈回（詳情列 +30px）

- **規則**：B9 / B6；recipe:swap　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1945-1955`, `dashboard/dashboard.js:2002-2008`, `dashboard/index.html:1052-1060`, `dashboard/index.html:1117-1124`
- **現況**：課程詳情：「↩ 撤銷」pill（padding 2px 10px，margin-bottom 4px）被插在 due label 前面，due label 沒有隱藏。實測列高 53.8→83.8px，下一列下移 30px（442.7→472.7）。週卡：due 改成 display:none，換上比較高的 pill，卡片 167.2→173.2px，下一排下移約 6px。兩者都是瞬間切換，撤銷時再跳回來。CLAUDE.md 寫的是「維持原尺寸 1.5 秒」「due 文字換成撤銷」，但詳情列的實作是新增一個元素，不是替換。
- **為什麼**：B9：變動周圍的字不能移動，要保留空間。swap recipe：原地換標籤用 opacity 加 blur.icon 淡換。另外，撤銷窗內點列上任何位置都會取消完成（2140-2143），所以下一列被推下 30px 之後，快速的第二次點擊可能落在原列上，把剛才的完成撤掉。

<details><summary>修法</summary>

```
從一開始就把兩個狀態疊在同一個 grid cell，begin/cancel 只切換 .completing，不插入或移除節點，也不用 display:none。
Markup（renderAssignmentRow 2792、renderWeekCard 1376）：<div class="due-slot"><div class="due-label …">…</div><div class="complete-undo-hint" aria-hidden="true">↩ …</div></div>
CSS：
.due-slot { display: grid; }
.assignment-right .due-slot { justify-items: end; }
.week-task-card .due-slot { justify-items: start; }
.due-slot > * { grid-area: 1/1; align-self: center; transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), filter 150ms cubic-bezier(0.23, 1, 0.32, 1); }   /* transition.swap */
.due-slot > .complete-undo-hint { margin: 0; padding: 0 10px; opacity: 0; filter: blur(2px); }   /* blur.icon */
.completing .due-slot > .complete-undo-hint { opacity: 1; filter: none; }
.completing .due-slot > :not(.complete-undo-hint) { opacity: 0; filter: blur(2px); }
這裡只有淡入淡出和 blur，減少動態時照常保留。
```
</details>

### #14 Popup：收合的 200ms 內點擊，storage 寫成「未完成」，但列照樣消失

- **規則**：A12　**頻率**：occasional
- **位置**：`popup.js:347-358`, `popup.js:361-372`
- **現況**：finalize() 清掉了 undoTimer，卻沒有把 inUndo 重設，收合中的 li 仍然可以點。在這 200ms 內點列或點 check 會執行 cancelUndo()，寫入 manualDone[id]=false，但 setTimeout(…, 200) 照樣把列移除。harness 實測：勾選後在 1560ms 點列，列已從 DOM 消失，__store.manualDone === {}。popup 畫面顯示已完成，storage 和 dashboard 卻是未完成，下次打開 popup 它又回來了。popup 沒有倒數條，使用者看不出撤銷窗何時結束，所以「晚一點的撤銷點擊」很容易發生。
- **為什麼**：動效必須和狀態同步：收合一旦開始，互動要嘛反轉收合，要嘛直接關閉，不能各做一半。現在資料和畫面往相反方向走。popup 是一天開很多次的介面。

<details><summary>修法</summary>

```
收合開始時就關閉撤銷窗：在 finalize() 設定收合樣式之前加 inUndo = false; li.inert = true;。要先依 P0-2 移動焦點，再設 inert。inert 會擋掉點擊與 Tab/Space。P1 的 popup 倒數條讓撤銷窗何時結束變得可見，晚點擊會更少。
```
</details>

### #15 學期待辦↔課程 切換：470ms 期間點擊全部失效、連點時 slider 巢狀疊加、用雙 rAF 觸發、450ms 全寬 push 太重

- **規則**：A12 / A5 / B3；recipe:route；使用者規則「不要用 rAF 觸發 transition」　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1176-1239`, `dashboard/dashboard.js:1184`, `dashboard/dashboard.js:1203-1218`, `dashboard/dashboard.js:1225-1230`, `dashboard/dashboard.js:1233`, `dashboard/index.html:599-611`
- **現況**：switchPage 把舊頁和新頁的 innerHTML 都轉成字串，塞進 200% 寬的 .page-slider，用雙 requestAnimationFrame 設定 transform 0.45s cubic-bezier(0.4,0,0.2,1)，470ms 後再整頁重繪一次。harness 實測三點：(1) 滑動期間點 slider 裡的卡片沒有反應，因為複製出來的 HTML 沒有 listener；(2) 150ms 內連點兩頁，oldContent 抓到的是正在滑的 slider，DOM 裡出現 2 個 .page-slider（巢狀、id 重複），第一次留下的 470ms timer 在第二段滑到一半時重繪，把它攔腰切斷；(3) 分頁隱藏時 rAF 暫停，transform 停在起點。每次切換都是整個 main 區（約 1000px）推過去。
- **為什麼**：A12：再觸發時要從原本的位置接著往新目標走，不能疊加或重播。route.md：轉場期間沒人能點，短 slide 應在 0.3–0.4s，跨全螢幕才用 0.5–0.6s。B3：越常用越快，這兩頁本質上是同一個 app 的 tabs。雙 rAF 同時違反使用者自己記下的技術教訓。這是全 app 最常點的導航。

<details><summary>修法</summary>

```
直接渲染真的 DOM，只對進場那一頁跑 WAAPI，不做字串拷貝、不留 timer、不用 rAF：
let _pageAnim = null;
function switchPage(page) {
  if (page === currentPage || !_currentData.courses) return;
  const dir = page === 'courses' ? 1 : -1;
  currentPage = page; updateSideNav(); syncHistory();
  if (_pageAnim) _pageAnim.cancel();
  const { courses = [], assignments = {}, assignmentGroups = {} } = _currentData;
  if (page === 'week') renderWeekSection(courses, assignments); else renderCardGrid(courses, assignments, assignmentGroups);
  const el = document.getElementById('main-section').firstElementChild; if (!el) return;
  _pageAnim = el.animate(
    [{ opacity: 0, transform: reduceMotion() ? 'none' : `translateX(${12 * dir}px)` }, { opacity: 1, transform: 'none' }],
    { duration: 300, easing: 'cubic-bezier(0.25, 0.1, 0.35, 1)' });   // transition.panelIn + shift.tabs 12px
}
不設 fill，所以動畫結束或分頁隱藏時，元素一定落在最終狀態。同時刪除 index.html:599-611 的 .page-slider 和 .page-slide。這裡有一個具名 deviation：tabs recipe 的 150ms panelOut 刻意拿掉，因為常用導航不等出場，新頁第一個 frame 就能點。方向保留：去課程從右邊進，回學期待辦從左邊進。
```
</details>

### #16 卡片↔詳情 morph：課名和 meta 被非等比拉扯，卡片內容放大約 2 倍溢出外框

- **規則**：B9（nothing stretches）；recipe:expanding-card　**頻率**：constant
- **位置**：`dashboard/index.html:2979-3004`, `dashboard/index.html:3001-3003`
- **現況**：文字類的 old/new 加了 height:100%; overflow:hidden。UA 預設本來就是 width:100%，兩個方向都被固定住，object-fit:fill 就非等比拉伸。t=30ms 時 group(course-name) 是 592×27：old 快照 296.7×22.9 被畫成 592×27（scaleX 2.0、scaleY 1.18），new 快照 992×32.5 也被畫成 592×27（scaleX 0.60）。兩張同時半透明，畫面上是一窄一寬兩組「Distributed Systems」疊在一起。course-shell 依寬度等比縮放：卡片快照放大約 2 倍，作業列和「1 / 2」分頁器以巨大字級溢出外框，詳情則縮成約 0.6 倍。
- **為什麼**：B9：被擠扁、被拉長的文字看起來是故障，不是動效。這是 dashboard 最常用的 drill-down，每次開課程、每次 Back 都會出現。主打 craft 的工具最不該有這種一閃而過的變形。

<details><summary>修法</summary>

```
已在 harness 注入驗證：改完後 old 是 349×27、new 是 824×27，都是等比；卡片內容保持原尺寸，只有外框在長大。
::view-transition-old(course-code), ::view-transition-old(course-name), ::view-transition-old(course-badge), ::view-transition-old(course-meta),
::view-transition-new(course-code), ::view-transition-new(course-name), ::view-transition-new(course-badge), ::view-transition-new(course-meta) { animation-duration: 0.18s; height: 100%; width: auto; }
::view-transition-group(course-shell) { overflow: clip; border-radius: 8px; background: var(--surface); outline: 1px solid var(--border); outline-offset: -1px; }
::view-transition-old(course-shell), ::view-transition-new(course-shell) { animation-duration: 0.22s; width: 100%; height: 100%; object-fit: none; object-position: left top; }
```
</details>

### #17 從週卡開詳情時 morph 配對錯字串：作業名看起來變成了課名

- **規則**：recipe:expanding-card（continuity）/ B9　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1693-1698`, `dashboard/dashboard.js:1374-1375`, `dashboard/dashboard.js:2099`, `dashboard/dashboard.js:2103`
- **現況**：cardEl.querySelector('.card-code, .week-task-course') 被命名為 course-code，'.card-name, .week-task-title' 被命名為 course-name。週卡的 .week-task-course 是課名，.week-task-title 是作業名，所以課名 morph 成詳情的「COMP 5567」，作業名「Lab Report 0 — …」morph 成詳情標題「Distributed Systems」。兩組都是不同字串一邊縮放一邊 crossfade。
- **為什麼**：expanding-card 要表達的是同一個東西換了位置、變大了。這裡配對的不是同一個東西，語意上會誤導；不同字串互相縮放也違反 B9。學期待辦是落地頁，週卡是最主要的點擊目標。

<details><summary>修法</summary>

```
const isWeek = cardEl.classList.contains('week-task-card');
const cCode = isWeek ? null : cardEl.querySelector('.card-code');
const cName = cardEl.querySelector(isWeek ? '.week-task-course' : '.card-name');   // 課名對課名
作業名不命名，跟著 course-shell 一起 crossfade；詳情的 .detail-code 只有 new 端，自然淡入。
```
</details>

### #18 完成項目移除後，剩下的列和卡片一幀跳進空位（週 grid 跳 183px），CLAUDE.md 寫的「清單收合」並不存在

- **規則**：interaction:list（others close the gap on spring.reflow）　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1973`, `dashboard/dashboard.js:2026`, `dashboard/index.html:1040`
- **現況**：480ms burst 結束後清單重建，後面每個項目都瞬移。harness：完成卡片下方那張從 top 514.5px 跳到 331.4px（183px），補進 2 欄空出的格子，之後每張卡都跨欄重排。詳情列的下一列一次上跳 54px（連同點擊時變高的部分是 84px）。
- **為什麼**：list recipe：被移除的項目離場，其他項目用 transform 在 spring.reflow 上收合空隙，只移動、不拉伸。這是使用者拍板流程「burst 後列收合」的一步，現在是硬切，在 2 欄 grid 裡眼睛會跟丟哪張是哪張。動作頻率是 constant，所以要快且不回彈，spring.reflow 正好符合。

<details><summary>修法</summary>

```
用 WAAPI FLIP，不用 rAF，也不靠 transition 觸發，分頁隱藏時也安全：
(1) 移除前量 before：每張 .week-task-card、.week-group-title、.week-divider 的 rect（詳情用 .assignment-item，以 data-hideable-id 為 key，加上它的 .assignment-desc）。
(2) 移除節點並就地更新，或重建。
(3) 先還原 scrollTop（P1-1），再量 after，否則每個項目都會滑一整段捲動距離。量之前 cancel 掉正在跑的 id:'reflow' 動畫；getBoundingClientRect 會把進行中的 transform 算進去，所以再次觸發時從目前位置開始（A12）。
(4) 每個有位移的項目：el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 300, easing: REFLOW, id: 'reflow' })，REFLOW = 'linear(0, 0.0233, 0.0813, 0.1598, 0.2483, …, 1)'，取自 css-tokens spring.highlight 300ms（spring.reflow 同為 500/40，曲線相同）。
只對 leaf 元素做，不要同時動 group 容器和它裡面的卡片，否則會位移兩次。reduceMotion() 時跳過。
```
</details>

### #19 週卡沒有出場：burst 期間完全不透明，480ms 後一幀切掉（詳情列卻會淡出）

- **規則**：B5；recipe:list（removed item fades on transition.fade）/ B8　**頻率**：constant
- **位置**：`dashboard/dashboard.js:2024`, `dashboard/index.html:1040-1042`
- **現況**：只有 .assignment-item.bursting 有樣式，沒有任何規則對應 .week-task-card.bursting。harness 實測 burst 期間週卡的 animationName 是 none、opacity 是 1，480ms 後重建時一幀消失。詳情列則有 complete-burst 0.4s 淡出，同一個動作在兩個視圖長得不一樣。
- **為什麼**：離場的東西應該淡出，而不是被切掉；同一個動作在兩個視圖應該一致。完成最常發生在週視圖。

<details><summary>修法</summary>

```
先完成 P1 的碎點 overlay（否則淡出會把週卡上的碎點一起淡掉），再把 index.html:1040 改成：
.assignment-item.bursting, .week-task-card.bursting { animation: complete-burst 0.4s ease-out forwards; pointer-events: none; }
若要對齊 list recipe 的 token：200ms cubic-bezier(0.23, 1, 0.32, 1)（transition.fade），COMPLETE_BURST_MS 跟著調整。這只是淡出，減少動態時保留。
```
</details>

### #20 完成碎點長在正在淡出的列裡面，還沒飛就幾乎看不見；起點固定在 left:26px，不是被點的勾選圈（週卡偏約 100px）

- **規則**：A8 group opacity；recipe:press（flourish 跟著控制項）　**頻率**：constant
- **位置**：`dashboard/dashboard.js:2043-2055`, `dashboard/index.html:1040-1042`, `dashboard/index.html:1061-1070`, `dashboard/index.html:897-902`
- **現況**：spawnBurstDots 把碎點 append 進 .assignment-item，而該列同時以 0.4s 從 1 淡到 0，父層 opacity 會乘上碎點自己的 opacity。實測有效 opacity：50ms 0.67、100ms 0.43、200ms 0.14、300ms 0.02，42–60px 的迸發還沒過半就消失了。.complete-burst-dot 固定在 left:26px; top:50%，keyframe 沒有 -50% 偏移，對齊原點的是點的左上角。週卡的勾選圈在右上（top:11px; right:11px），實測 check 在 (741,343)，碎點卻從 (641,417) 冒出來，落在卡片文字上；詳情列偏約 17px。
- **為什麼**：碎點迸發是使用者拍板的完成回饋。現在被列自己的出場淡出抹掉，起點又不在手指或游標所在處，看起來像一個無關的特效，而不是勾選圈的回應。這是拍板概念內部的品質 bug，不涉及風格選擇。

<details><summary>修法</summary>

```
把碎點放到列外的 fixed overlay，從 check 的中心發出。把被點的 .assignment-check 或 .week-task-check 傳給 spawnBurstDots：
const c = chk.getBoundingClientRect();
const layer = document.getElementById('burst-layer') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'burst-layer' }));
dot.style.left = (c.left + c.width / 2) + 'px'; dot.style.top = (c.top + c.height / 2) + 'px';
layer.appendChild(dot); dot.addEventListener('animationend', () => dot.remove());
CSS：#burst-layer { position: fixed; inset: 0; pointer-events: none; z-index: 50; } .complete-burst-dot { position: absolute; margin: -3.5px 0 0 -3.5px; }
角度、距離（42–60px）、數量、顏色都不變。列本身的淡出保持原樣。
```
</details>

### #21 Popup「今天到期」badge 的火焰與光暈是兩個無限 loop，建議移除

- **規則**：A4 / A8；gate（open request: less motion）　**頻率**：constant
- **位置**：`popup.html:335`, `popup.html:347`, `popup.html:350-360`
- **現況**：只要有今天到期的任務，popup 開著的期間就一直跑兩個無限動畫：chip 的 box-shadow 脈動（flame-glow 1.5s），以及火焰字元的 scaleY/translateY/opacity 閃爍（flame-flicker 0.85s）。getAnimations() 顯示列被捲出 188px 的 .task-list 之後，兩者仍是 running。
- **為什麼**：A4：背後沒有 loading 狀態的 loop 是裝飾，而且捲出畫面也不會暫停。A8：box-shadow 每一幀都重繪。gate 判斷沒有任何 purpose 對得上：「今天」已經由紅色 --overdue chip 和「Xh後」文字表達，使用者自己的 popup 規則是「一個資訊不雙重編碼」，這裡卻用了顏色、火焰、光暈、動態四重。loop 會把視線從使用者正要讀的那一列拉走，而 popup 是一天開很多次的介面。這不在使用者記錄過的決策裡，是在未逐項驗證的 a1ebe62 一起帶進來的。

<details><summary>修法</summary>

```
刪掉 animation: flame-glow …（335）、animation: flame-flicker …（347）和兩個 @keyframes（350-360），同時刪掉變空的 reduced-motion 規則。如果使用者想保留一個標記，就保留靜態的 ::before 火焰字元，否則一併刪除。如果還是想要一點生氣，打開 popup 時只閃一次：animation: flame-flicker 0.85s ease-in-out 1。永遠不要 infinite，也不要動 box-shadow。
```
</details>

### #22 Popup 勾選圈只有 16px：差一點點就點到列，結果開了 Canvas 分頁、popup 關閉

- **規則**：WCAG 2.5.8 target size / B8（dashboard 已解決）　**頻率**：constant
- **位置**：`popup.html:242-255`, `dashboard/index.html:996-1008`
- **現況**：點擊熱區剛好就是 16px 的圓。點在圓外一點點，就落到 openable 列上，觸發 chrome.tabs.create，popup 因此關閉，任務沒有完成。dashboard 的 check 有一圈大 8px 的隱形 ::before，hover 時還有綠色填色和 4px halo；popup 的 hover 只有綠框。
- **為什麼**：popup 最常做的動作，一次 miss 就是一次 context switch。dashboard 已經解決過同樣的問題，兩邊應一致（B8）。

<details><summary>修法</summary>

```
.task-check::before { content: ''; position: absolute; inset: -6px; border-radius: 50%; }（::after 已經用來畫勾號；和名字之間有 9px 間隔，-6px 不會壓到）。可選：hover 時加 background: color-mix(in srgb, var(--green) 12%, transparent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--green) 10%, transparent);，並把 box-shadow 加進 transition 清單。需要 P0 的 .task-list padding-inline 4px，否則 halo 也會被裁。
```
</details>

### #23 Popup 完成沒有倒數條（也沒有碎點），看不出撤銷窗什麼時候結束

- **規則**：B8（同一個完成概念）　**頻率**：occasional
- **位置**：`popup.js:322-358`, `dashboard/dashboard.js:1956-1962`, `dashboard/index.html:1032-1051`
- **現況**：popup 勾選後，列變暗到 0.5，badge 換成「↩ 撤銷」，1500ms 後收合。沒有任何東西顯示撤銷窗還剩多久，也沒有碎點。dashboard 則是 3px 橘色 complete-countdown scaleX 條（1.5s linear），接著碎點迸發。
- **為什麼**：使用者拍板的完成概念包含橘色倒數條，在 popup 它不是裝飾，而是唯一能看出撤銷何時結束的線索（P1 收合點擊 bug 的成因之一）。B8：同一個概念在兩處應該以同樣方式動。

<details><summary>修法</summary>

```
enterUndo 裡：const bar = document.createElement('div'); bar.className = 'complete-countdown'; bar.style.animationDuration = COMPLETE_DELAY_MS + 'ms'; li.appendChild(bar);，cancelUndo 時移除。
CSS：.task-item { position: relative; } .complete-countdown { position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; background: var(--orange); transform-origin: left; animation: complete-countdown linear forwards; pointer-events: none; } @keyframes complete-countdown { from { transform: scaleX(1) } to { transform: scaleX(0) } }。剩餘時間條用 linear 是對的。
碎點（可選）：在 finalize 淡出的同一刻，把 10 顆點以 position:fixed 加到 document.body，位置用 check 的 getBoundingClientRect() 中心，不要放進 li，因為 li 的 overflow:hidden 會裁掉。沿用 dashboard 的 complete-dot keyframes（0.5s ease-out），距離改成 16–24px 以配合 48px 的列高；減少動態時跳過。
```
</details>

### #24 所有按鈕、卡片、整列可點元素按下時都沒有回饋；popup 頂部兩顆按鈕 hover 會上浮

- **規則**：B4 / A5；recipe:press、recipe:card　**頻率**：constant
- **位置**：`dashboard/index.html:2855`, `dashboard/index.html:317`, `dashboard/index.html:2267`, `dashboard/index.html:878`, `dashboard/index.html:732`, `dashboard/index.html:147` 等 11 處
- **現況**：index.html 唯一的 :active 規則是 .drag-grip:active { cursor: grabbing }（2855）。同步、齒輪、「+ 新增作業」、分頁 ‹ ›、編輯權重、自訂作業 ✎/✕、welcome 按鈕、三個 modal 的按鈕，按下那一幀都沒有任何變化。課程卡、週卡（role=button）、wk-sum-row、側欄兩種列、作業列也一樣沒有。popup 的 .usage-chip 和 .usage-refresh 在 hover 時 translateY(-1px)，三顆按鈕（包括最常點的「開啟 Dashboard」）都沒有 :active。
- **為什麼**：B4：可按的東西按住時縮到 scale.press 0.97、走 spring.press；整張卡或整列用 scale.choice 0.985；hover 時不移動也不縮放，上浮是卡片 surface 才用的 affordance。A5：控制項要在互動那一幀回應，:active 在 pointerdown 當幀就生效，是放開之前唯一能表示「收到了」的訊號。

<details><summary>修法</summary>

```
:root { --spring-press: 400ms linear(0, 0.0261, 0.0935, 0.188, 0.2977, …, 0.9948, 1, 1, 1, 1); --scale-press: 0.97; --scale-choice: 0.985; }（css-tokens spring.press 400ms；減少動態時兩個 scale 都設為 1，見 P0-1）。
按鈕：:is(.btn-sync, .btn-theme-toggle, .btn-add-assignment, .card-pager-btn, .btn-edit-weights, .btn-delete-custom-assignment, .btn-edit-custom-assignment, .welcome-btn, .welcome-close, .custom-assignment-close, .custom-assignment-actions button, .confirm-actions button, .weight-edit-add, .weight-edit-cancel, .weight-edit-save):active:not(:disabled) { scale: var(--scale-press); }，並在各自的 transition 清單加上 scale var(--spring-press)。用獨立的 scale 屬性，才不會蓋掉 .btn-rename-course 的 translateY(-50%)。
卡片與列（用 :has 擋掉祖先 :active 連帶縮放）：.course-card-grid:active:not(:has(.card-pager-btn:active)), .week-task-card:active:not(.bursting):not(:has(.assignment-check:active)), .wk-sum-row:active, .side-nav-item:active, .nav-course-item:active, .assignment-item:active:not(.bursting):not(:has(:is(button, .drag-grip, .assignment-title-link):active)) { scale: var(--scale-choice); }
Popup：刪掉 121 和 157 的 transform: translateY(-1px)，border 和顏色變化保留。加 .usage-chip:active, .usage-refresh:active:not(:disabled), .btn:active { transform: scale(0.97); }，transition 寫 transform 400ms linear(...)（spring.press）。
勾選圈與 .drag-grip 都不縮放：checkbox 用填色回應，grip 用 grabbing 游標回應。VT 會在回彈途中拍下 old snapshot，morph 從使用者當下看到的框開始，是連續的。
```
</details>

### #25 課程卡 hover 上浮用了顏色曲線 ease；週卡 hover 只變框、沒有 pointer 游標，看起來像不能點

- **規則**：B4 / B2 / B8；recipe:card　**頻率**：constant
- **位置**：`dashboard/index.html:2276`, `dashboard/index.html:2280-2284`, `dashboard/index.html:878-892`, `dashboard/index.html:887`, `dashboard/index.html:794-800`
- **現況**：.course-card-grid：transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease，hover 時 transform: translateY(-2px)，上浮也走 ease。上浮寫在 transform 上，之後加的任何 press transform 都會覆蓋它。.week-task-card 只有 transition: border-color 0.12s，hover 只把框變橘，沒有 shadow、沒有上浮、沒有宣告 cursor（computed 為 auto）。兩者都是 role=button，點了都走同一個 showCourseDetail morph。CLAUDE.md 規範寫「卡片 hover 用 translateY(-2px)」，偏離規範的是週卡。.week-right 的 padding-left 是 0，加 shadow 也會被裁。
- **為什麼**：card recipe：border 和 shadow 走 transition.color，上浮走 spring.highlight，滑鼠離開時才能立即 retarget；B2 規定 ease 只給顏色用。B8：做同一件事的兩個元件應該用同一組 token。週卡在每天最常用的主視圖上，顯示的卻是一般箭頭游標。

<details><summary>修法</summary>

```
:root { --spring-highlight: 300ms linear(0, 0.0233, 0.0813, 0.1598, 0.2483, …, 1.0015, 1); --lift: -2px; }（css-tokens spring.highlight；減少動態時 --lift 設 0px）。
.course-card-grid, .week-task-card { cursor: pointer; transition: border-color 200ms ease, box-shadow 200ms ease, translate var(--spring-highlight), scale var(--spring-press); }
@media (hover: hover) and (pointer: fine) { .course-card-grid:hover, .week-task-card:not(.bursting):hover { border-color: var(--orange); box-shadow: 0 2px 8px rgba(0,0,0,.08); translate: 0 var(--lift); } }
.week-right { padding-left: 4px; }，比照 .courses-grid 的 padding 4px，讓左欄的 shadow 不被裁。用獨立的 translate 屬性，才能和 press 的 scale 疊加。卡片上方有 group title 的 12px margin，2px 上浮碰不到頂端。
```
</details>

### #26 Focus 指示會漸入：7 顆按鈕用 transition: all，連 outline 一起過渡；輸入框的 focus 邊框 0.12s 淡入

- **規則**：A11 / A17　**頻率**：constant
- **位置**：`dashboard/index.html:330`, `dashboard/index.html:380`, `dashboard/index.html:580`, `dashboard/index.html:1394`, `dashboard/index.html:1752`, `dashboard/index.html:2467` 等 10 處
- **現況**：330 .btn-sync、380 .btn-theme-toggle、580 .btn-add-assignment、1394 .btn-delete-custom-assignment、1752 .welcome-btn、2467 .card-pager-btn、3276 .btn-edit-custom-assignment 都寫 transition: all 0.1–0.15s。Tab 到 #sync-btn 和 #btn-add-assignment 時，getAnimations() 回傳 outline-color、outline-offset、outline-width 三個 CSS transition（120ms/150ms），ring 從灰字色慢慢變橘，offset 從 0 長到 2px。.grade-calc-pts input 和 .custom-assignment-field 的 input/select/textarea 設了 outline:none（specificity 0,1,1，壓過全域的 :focus-visible），唯一的 focus 指示是 border-color: var(--orange)，走 0.12s 過渡。
- **為什麼**：A11：不准用 transition: all，要寫出過渡哪些屬性。A17：:focus-visible 必須立即出現，不能漸入。這些按鈕在常駐介面上；加 press scale 之前也要先把 all 拆掉，否則按壓會走 0.12s ease，而不是 spring.press。

<details><summary>修法</summary>

```
逐顆列出屬性，永遠不要列 outline（200ms ease = transition.color）：
330 .btn-sync：border-color 200ms ease, color 200ms ease, scale var(--spring-press)
380 .btn-theme-toggle、1394、3276：border-color, color, background-color 各 200ms ease，加 scale var(--spring-press)
580 .btn-add-assignment：border-color, color 加 scale
1752 .welcome-btn：background-color, border-color, color 加 scale
2467 .card-pager-btn：border-color, color, opacity（disabled 時 0.3）加 scale
輸入框：.grade-calc-pts input:focus, .custom-assignment-field :is(input, select, textarea):focus { transition: none; }，focus 那一幀邊框就是橘色，blur 時的淡回保留。.weight-edit-name 和 .weight-edit-pct 不用改，全域的 :focus-visible 已經能立即畫出 outline。
```
</details>


## P2 — 偶爾出現的介面

### #27 從週卡開的詳情按 Back 不會 morph 回原卡，週清單也跳回頂端

- **規則**：B5　**頻率**：constant
- **位置**：`dashboard/dashboard.js:1789`, `dashboard/dashboard.js:1797`, `dashboard/index.html:798`
- **現況**：回程只查 .course-card-grid[data-course-id=…]（1797）。回到學期待辦時頁面上沒有課程卡，course-shell 只剩 old，於是淡出（1789 的註解也這樣寫）。進場是 morph，回程是淡出，兩邊不對稱。renderWeekSection 用 innerHTML 重繪，.week-right 的 scrollTop 歸零，從下方卡片開的詳情回來後，清單會在頂端。
- **為什麼**：B5：出場要倒著重播進場。進場讓使用者看到「這張卡變成了詳情」，回程卻沒有告訴他回到了哪一張；清單跳回頂端又讓他找不到剛才的位置。

<details><summary>修法</summary>

```
showCourseDetail 開頭記住來源和捲動位置：const wr = document.querySelector('.week-right'); _detailOrigin = cardEl ? { assignmentId: cardEl.dataset.assignmentId || null, weekScroll: wr ? wr.scrollTop : 0 } : null;
showGridView 的 VT callback 在 renderWeekSection 之後、命名之前：
const wr2 = document.querySelector('.week-right'); if (wr2 && _detailOrigin) wr2.scrollTop = _detailOrigin.weekScroll;   // 同步還原，捕捉 new 狀態時已就位
let card = document.querySelector(`.course-card-grid[data-course-id="${prevCourseId}"]`);
if (!card && _detailOrigin?.assignmentId && wr2) { const wc = document.querySelector(`.week-task-card[data-assignment-id="${CSS.escape(_detailOrigin.assignmentId)}"]`); const r = wc?.getBoundingClientRect(), v = wr2.getBoundingClientRect(); if (wc && r.bottom > v.top && r.top < v.bottom) card = wc; }   // 只在可視區內才 morph，否則維持淡出
週卡的命名比照 P1（週卡本身是 course-shell，.week-task-course 是 course-name）。
```
</details>

### #28 作業描述、成績計算器、已隱藏清單都是 display:none 硬切；chevron 自己旋轉，但面板不動

- **規則**：recipe:disclosure　**頻率**：occasional
- **位置**：`dashboard/index.html:1148-1159`, `dashboard/index.html:1293-1300`, `dashboard/index.html:2791-2810`, `dashboard/index.html:2915`, `dashboard/dashboard.js:2147`, `dashboard/dashboard.js:2657-2660`
- **現況**：.assignment-desc（最高 240px）、.grade-calc-body、.hidden-items-list 都在 display:none 和 block 之間切換，開與關都是一幀完成，下面所有列一次跳過它的高度。.hidden-items-arrow 用 transition: transform 0.15s（預設 ease）轉 90°，旁邊的清單卻是硬切。.grade-calc-header 沒有 chevron，除了 body 突然出現，看不出它是開是關。拖曳降級時 .hidden-items.drop-active .hidden-items-list { display:block } 又是一次硬切。
- **為什麼**：disclosure.md（purpose：continuity）：面板用 transition.disclosure 展開，內容從 blur.disclosure 清晰，chevron 用同一個 timing 跟著轉，三者讀起來才是同一個動作。rulebook 的驗證步驟會把「chevron timing 和面板不一致」算成一個 miss。

<details><summary>修法</summary>

```
把 padding（12px 0 8px 和 border-bottom）從 .assignment-desc 移到 .assignment-desc-inner，max-height 改成 260px。.grade-calc-body 的 groupRows 包一層 <div class="grade-calc-body-inner"> 並把 padding 放進去；.hidden-items-list 的 margin-top:4px 改成內層的 padding-top。這樣 height:0 才收得乾淨。
.detail-right-panel { interpolate-size: allow-keywords; }
:is(.assignment-desc, .grade-calc-body, .hidden-items-list) { display: block; height: 0; overflow: clip; opacity: 0; filter: blur(2px); visibility: hidden; transition: height 350ms cubic-bezier(0.215, 0.61, 0.355, 1), opacity 350ms cubic-bezier(0.215, 0.61, 0.355, 1), filter 350ms cubic-bezier(0.215, 0.61, 0.355, 1), visibility 0s linear 350ms; }
開啟狀態 { height: auto; opacity: 1; filter: none; visibility: visible; transition-delay: 0s; }。開啟狀態包括 .assignment-desc.open、.grade-calc.open .grade-calc-body、開啟中的 .hidden-items-list，以及 .hidden-items.drop-active .hidden-items-list。
.hidden-items-arrow { transition: transform 350ms cubic-bezier(0.215, 0.61, 0.355, 1); }，.grade-calc-header 加同樣的 SVG chevron，.grade-calc.open 時旋轉 90°。
visibility 讓收合時的連結不在 Tab 順序裡（A17）。減少動態時只保留 opacity、filter、visibility。Chrome 129 以下沒有 interpolate-size，高度會照舊直接跳，淡入仍然有效。
```
</details>

### #29 四個 modal 都沒有出場、backdrop 直接切暗；只有教學卡有進場，而且用 ease

- **規則**：B5 / B7 / B2；recipe:modal、recipe:overlay　**頻率**：occasional
- **位置**：`dashboard/index.html:1411-1466`, `dashboard/index.html:1442`, `dashboard/index.html:2129-2140`, `dashboard/index.html:3038-3048`, `dashboard/index.html:3286-3297`, `dashboard/dashboard.js:854` 等 9 處
- **現況**：四個 overlay 都在 display:none 和 .open { display:flex } 之間切換，關閉函式只移除 class，整個瞬間消失。backdrop 的 rgba（教學那層還有 backdrop-filter blur(2px)）也是瞬間出現、瞬間消失。只有 .welcome-card 有進場：welcomeIn 0.28s ease（ease 是給顏色用的曲線）。新增作業、權重、確認框連進場都沒有。
- **為什麼**：B5：出場要倒著重播進場。B7：overlay 的顏色和 blur 要從無淡入，再用同一條曲線淡出，不能直接切暗。B2：進場要用 ease-out 系。同一個 app 裡一個 modal 會動、三個不會，正是 craft 層級會被注意到的不一致。

<details><summary>修法</summary>

```
:root { --modal-from: scale(0.96); }（P0-1 的減少動態區塊設成 none，這樣連 @starting-style 也一起被蓋掉，不會被 specificity 壓過）。
:is(.welcome-card, .custom-assignment-modal, .weight-edit-modal, .confirm-modal) { opacity: 0; transform: var(--modal-from); transition: opacity 200ms cubic-bezier(0.33, 0.17, 0.67, 0.5), transform 200ms cubic-bezier(0.33, 0.17, 0.67, 0.5); }   /* transition.dismiss */
.open > :is(同上) { opacity: 1; transform: none; transition: opacity 400ms cubic-bezier(0.215, 0.61, 0.355, 1), transform 750ms linear(...); }   /* transition.dialogFade + css-tokens spring.dialog 750ms */
@starting-style { .open > :is(同上) { opacity: 0; transform: var(--modal-from); } }
Overlay：background-color 400ms cubic-bezier(0.215, 0.61, 0.355, 1)（transition.overlay），加 display 400ms allow-discrete 與 @starting-style 從 transparent 開始。只有 .welcome-overlay 另外過渡 backdrop-filter blur(0px)↔blur(2px)。移除 .welcome-card 的 welcomeIn。在 setupModalA11y 的 MutationObserver 裡加 overlay.inert = !overlay.classList.contains('open')，讓出場中的 modal 不能接收焦點。
```
</details>

### #30 同步按鈕：狀態硬切、沒有完成狀態

- **規則**：interaction:status-button / B6　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:2866-2889`, `dashboard/index.html:330`, `dashboard/index.html:3435`
- **現況**：閒置、三點、「同步失敗」之間都是瞬間的 innerHTML/textContent 替換。同步成功後直接回到「同步」，唯一的成功訊號是側欄頂端的 meta（「剛才同步」），離按鈕很遠。
- **為什麼**：status-button.md：進度要顯示在觸發它的地方，標籤用 blur.icon 和 transition.swap 交換，成功標籤停留約 1.5s，並且要念出來（念的部分在 P0 live region）。

<details><summary>修法</summary>

```
把狀態疊在同一格：<span class="sync-swap"> 裡放 idle、loading（sync-dots）、done、error 四個 span。.sync-swap { display: inline-grid; } .sync-swap > * { grid-area: 1/1; opacity: 0; filter: blur(2px); transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), filter 150ms cubic-bezier(0.23, 1, 0.32, 1); } [data-status="idle"] .s-idle, [data-status="loading"] .s-loading, [data-status="done"] .s-done, [data-status="error"] .s-error { opacity: 1; filter: none; }（transition.swap 加 blur.icon）。
新增一個短 i18n key syncDone：'✓ 已同步' / '✓ 已同步' / '✓ Synced'。不要沿用 wCanvasSynced，那是一整句，最寬的狀態會決定按鈕寬度，平常就會變成約 150px。done 停 1500ms，error 維持現在的 2500ms。transition: all 的拆解見 P1。
```
</details>

### #31 課程卡換頁時卡片高度改變，同一排下面的卡全部移動 34px，列內容一幀換掉

- **規則**：B9；recipe:swap　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:1647`
- **現況**：作業標題有 1–2 行的 clamp，每一頁高度不同。實測第 1 頁換到第 2 頁時，卡片 314→280px，grid 919→885px，下面每張卡都位移 34px，列內容一幀完成替換。
- **為什麼**：B9：內容改變不應該移動鄰居。swap.md：原地換內容用輕微 blur 淡換。

<details><summary>修法</summary>

```
（焦點部分見 P0）只重繪 .card-rows-container。保留高度：.card-bottom:has(.card-pager) .card-rows-container { min-height: 171px; }（3 列兩行標題：2 × 14px × 1.3 + 20px padding + 1px border，每列約 57px）。換內容：rows.innerHTML = …; rows.style.transition = 'none'; rows.style.opacity = '0'; rows.style.filter = 'blur(2px)'; rows.getBoundingClientRect(); rows.style.transition = 'opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), filter 150ms cubic-bezier(0.23, 1, 0.32, 1)'; rows.style.opacity = ''; rows.style.filter = '';。這是 transition.swap 加 blur.icon，沒有位移，用 forced reflow 觸發，不用 rAF。
```
</details>

### #32 「已繳交」切換要等 storage 讀完才亮起，接著整個視圖硬切

- **規則**：A5；interaction:filter-grid　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:2859-2863`, `dashboard/dashboard.js:1041`
- **現況**：切換鈕自己的 active 狀態只在 render() 內透過 updateSideNav 更新（1041），而 render() 要等 chrome.storage.local.get 讀完所有 key（包括全部作業）才會執行。之後 #main-section 一幀重建，從週頁切過來時版面直接換成各課程 grid。
- **為什麼**：A5：控制項要在互動那一幀回應。filter-grid.md：留下來的項目應該滑動到新位置，但待辦和已完成兩組沒有交集，沒有東西可以 reflow，用一個短淡入表達「這是另一組」就夠了。

<details><summary>修法</summary>

```
翻轉 showSubmitted 之後、loadData() 之前，同步呼叫一次 updateSideNav()（它只讀 _currentData）。由切換觸發的 render 中，#main-section 的新子元素從 opacity 0 淡入，200ms cubic-bezier(0.23, 1, 0.32, 1)（transition.fade）。只做 opacity，不位移，不 stagger。
```
</details>

### #33 週摘要列點擊後清單捲過去了，焦點卻留在左欄

- **規則**：A17（focus moves with the motion）　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:1495-1504`, `dashboard/dashboard.js:1362`, `dashboard/dashboard.js:1383`
- **現況**：啟動摘要列（原生 button）會 smooth scroll .week-right 到對應的 .week-group，但焦點留在摘要按鈕上。下一個 Tab 會先走完剩下的摘要列，再到清單的第一張卡，而不是跳到的那一組；螢幕閱讀器的位置也不會跟著動。
- **為什麼**：A17：焦點要跟著動效走。這個操作看起來像導航，卻沒有把鍵盤和螢幕閱讀器的位置帶過去。

<details><summary>修法</summary>

```
在開始捲動時執行：const t = target.querySelector('.week-group-title'); t.tabIndex = -1; t.focus({ preventScroll: true }); right.scrollTo({ top: delta, behavior: reduceMotion() ? 'auto' : 'smooth' });。螢幕閱讀器會念出組標題（例如「7 天內 (3)」），下一個 Tab 會到該組的第一張卡。
```
</details>

### #34 課程改名後鉛筆停在舊位置；進入編輯模式時標題長高 2px

- **規則**：B9　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:1836-1842`, `dashboard/dashboard.js:2128`, `dashboard/index.html:2587-2600`
- **現況**：restore() 把 input 換回一個新的 span，但從沒重算 renameBtn.style.left（只在 2128 依舊文字寬度設過一次）。實測把「Distributed Systems」改成「DS」：span 右緣 606→408px，鉛筆仍在 614px，中間空出 206px；改成更長的名字則會蓋到鉛筆。input 的 2px border-bottom 讓 .detail-name 從 32.5px 變成 34.5px，.detail-meta 被往下推 2px。
- **為什麼**：B9：周圍的字不應該因為狀態改變而移動。

<details><summary>修法</summary>

```
restore() 一律重算位置：renameBtn.style.left = (span.offsetLeft + span.offsetWidth + 8) + 'px';。.course-rename-input { border-bottom: 0; box-shadow: 0 2px 0 var(--orange); }，編輯模式就不會增加高度。焦點部分見 P0「其他重建路徑」。
```
</details>

### #35 Popup：最後一筆逾期收合後，兩個組標題一幀消失（跳 52px）；收合的淡出和高度用同一條 ease；空狀態硬切

- **規則**：recipe:list / B2　**頻率**：occasional
- **位置**：`popup.js:387-389`, `popup.js:357`, `popup.html:217`
- **現況**：「已逾期」組標題 22px、「7 天內」30px。逾期那一列平滑收合（第一筆 upcoming 從 y=149 滑到約 101），然後兩個標題被一幀移除，列再跳 52px 到 y=49。最後一筆完成時，空狀態 li 用 innerHTML 換上，沒有淡入。收合用 max-height、opacity、padding 0.2s ease，並在剛好 200ms 時用 setTimeout 移除。
- **為什麼**：list recipe：空隙要平滑收合，清單始終是同一張清單。平滑收合之後再 snap 52px 讀起來像故障，而且比收合本身還大。B2：離場要用 ease.out；被移除的項目用 transition.fade 淡出，鄰居用 spring.reflow 收合。

<details><summary>修法</summary>

```
規則擴大成 .task-item.collapsing, .task-group-label.collapsing { overflow: hidden; transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1), max-height 300ms linear(0, 0.0233, 0.0813, …, 1), padding 300ms linear(0, 0.0233, 0.0813, …, 1); }（opacity 用 transition.fade；高度用 spring.reflow，即 css-tokens spring.highlight 300ms）。
finalize() 在 li 加上 .collapsing 之後：如果這是最後一筆逾期（li.dataset.group === 'overdue' && !list.querySelector('.task-item[data-group="overdue"]:not(.collapsing)')），在同一幀對每個 .task-group-label 做同樣的收合（maxHeight 釘成 offsetHeight、加 .collapsing、forced reflow、再設 maxHeight/padding 為 0、opacity 為 0），並在同一個 callback 裡移除。
移除改用 li.addEventListener('transitionend', (e) => { if (e.target === li && e.propertyName === 'max-height') done(); })，加 350ms fallback timeout。
空狀態只在 maybeShowEmpty 插入時才帶 class：<li class="empty-state is-entering">；.empty-state.is-entering { transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1); } @starting-style { .empty-state.is-entering { opacity: 0; } }。這樣打開 popup 時本來就空的清單仍然立即顯示。
```
</details>

### #36 Popup badge 換成「↩ 撤銷」時硬切並改變寬度，任務名的截斷點跟著位移

- **規則**：B9　**頻率**：occasional
- **位置**：`popup.js:327-328`, `popup.js:341-342`, `popup.html:211-213`, `popup.html:390-396`
- **現況**：badge 文字一幀從「2天後」換成「↩ 撤銷」，chip 背景和框同時直接變透明。badge 46.6→53.25px，.task-name 200.4→193.75px，被截斷的名字跟著移動；英文版變化更大（'3d' → '↩ Undo'）。.task-body 瞬間變成 0.5 opacity，旁邊的勾選圈填色卻是 0.15s 淡入。
- **為什麼**：B9：變動的標籤用輕微 blur 淡換，一行裡的字改變時不要推動鄰居。現在 dim 和換字都是硬切，旁邊的 check 卻是淡入，一個動作讀起來像兩種動效。

<details><summary>修法</summary>

```
兩個 span 交叉淡換：進來的那個從 opacity:0; filter:blur(2px) 開始，兩者都用 transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), filter 150ms cubic-bezier(0.23, 1, 0.32, 1)（transition.swap 加 blur.icon）。
寬度只在撤銷窗內釘住：enterUndo 先把 badge.style.width 設成目前的 px，forced reflow，再設成撤銷標籤量出來的寬度，transition: width 150ms cubic-bezier(0.23, 1, 0.32, 1)（單一小元素、occasional，成本可以接受）。cancelUndo 時反向，並在 transitionend 清掉 inline width，讓平常的 badge 維持自然寬度。如果改採永久預留寬度，就要接受每一列都少 6px（zh）到 25px（en）的名稱空間。
加 .task-body { transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1); }（transition.fade），.task-due 的 background-color、border-color、color 各加 150ms 過渡。
```
</details>

### #37 Hover 高亮硬切或缺失：popup 列與名字、新增作業 modal 按鈕、確認框按鈕、成績計算器 header、作業列、welcome dot

- **規則**：transition.color（never a cut）/ B8；recipe:card（row）　**頻率**：occasional
- **位置**：`popup.html:206-208`, `popup.html:304-307`, `dashboard/index.html:2169-2181`, `dashboard/index.html:2243-2260`, `dashboard/index.html:3333-3361`, `dashboard/index.html:1269` 等 8 處
- **現況**：popup 列的 6% 橘色底和名字的橘色是一幀切上去的，旁邊的 check、chip、按鈕則是 0.15s 淡入。新增作業 modal 的 ✕、取消、儲存完全沒有 :hover。確認框兩顆按鈕有 hover，但 .confirm-actions button 沒有 transition，所以也是硬切。成績計算器 header、welcome dot 有 cursor:pointer 卻沒有 hover 狀態。作業列是 cursor:pointer，但沒有 hover 底色。
- **為什麼**：transition.color：highlight 出現或消失時不要硬切。在同一個 320px 的介面裡，有的 hover 硬切、有的淡入，看起來像沒做完。整列可點的元素，目前唯一的線索只有游標。

<details><summary>修法</summary>

```
Popup：.task-item { transition: background-color 200ms ease; } .task-name { transition: color 200ms ease; }（底線維持即時）。
Modal：.custom-assignment-close, .custom-assignment-actions button, .confirm-actions button { transition: border-color 200ms ease, color 200ms ease, opacity 200ms ease, scale var(--spring-press); }。在 @media (hover: hover) and (pointer: fine) 內加：.custom-assignment-close:hover, .btn-custom-cancel:hover { border-color: var(--orange); color: var(--orange); } .btn-custom-save:hover { opacity: .88; } .grade-calc-header:hover .grade-calc-title { color: var(--orange); } .welcome-dot:not(.active):hover { background: var(--mid); }，另外 .grade-calc-title { transition: color 200ms ease; }。
作業列用溢出層畫底色，不改 layout：.assignment-item { position: relative; isolation: isolate; } .assignment-item::before { content: ''; position: absolute; inset: 0 -8px; border-radius: 6px; background: var(--surface); opacity: 0; transition: opacity 200ms ease; pointer-events: none; z-index: -1; }，以及 @media (hover: hover) and (pointer: fine) { body:not(.drag-active) .assignment-item:not(.bursting):not(.drag-source):hover::before { opacity: 1; } }。列下面是 --bg，所以用 --surface 才看得見；-8px 剛好在 .detail-right-panel 的 8px 側邊 padding 內。
```
</details>

### #38 自訂作業表單的錯誤訊息沒有念出、沒有綁到欄位；權重總和超過 100% 時沒有 live region

- **規則**：interaction:field-error　**頻率**：rare
- **位置**：`dashboard/index.html:3759`, `dashboard/index.html:3748`, `dashboard/dashboard.js:916`, `dashboard/index.html:3180`
- **現況**：名稱欄有 required，所以只有純空白的名稱才會走到這個錯誤。錯誤寫進一個普通 div，沒有 role="alert"；input 沒有 aria-invalid 或 aria-describedby，邊框不變、不搖動，打字時訊息也不會清掉。權重總和超過時只是瞬間變橘，沒有 live region。
- **為什麼**：field-error.md：邊框轉紅，訊息透過 role=alert 加 aria-describedby 念出來，每次送出失敗搖一次，絕不在每次按鍵時搖。

<details><summary>修法</summary>

```
錯誤 div 加 role="alert"，name input 加 aria-describedby="custom-assignment-error"。dashboard.js:916 的 catch 裡：nameInput.setAttribute('aria-invalid', 'true');，沒有減少動態時：nameInput.animate([{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(-2px)'},{transform:'translateX(2px)'},{transform:'translateX(-1px)'},{transform:'translateX(1px)'},{transform:'translateX(0)'}], { duration: 400, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' })（shift.shake 3px，transition.shake 0.4s ease.inOut）。input 事件時清掉 aria-invalid 和錯誤文字。CSS：#custom-assignment-name[aria-invalid="true"] { border-color: var(--overdue); transition: border-color 200ms ease; }。權重總和加 aria-live="polite" 和 transition: color 200ms ease。
```
</details>


## P3 — 罕見情境、打磨、一致性

### #39 Timing 是手寫值、沒有 :root 動態 token，JS 與 CSS 的時長已經漂移（全 review 算一條）

- **規則**：B8　**頻率**：constant
- **位置**：`dashboard/index.html:53-68`, `dashboard/index.html:480`, `dashboard/index.html:1442`, `dashboard/index.html:1496`, `dashboard/index.html:2276`, `dashboard/index.html:2796` 等 21 處
- **現況**：dashboard CSS 有 18 種不同時長；光是 hover 換色就用了 0.1、0.12、0.15、0.2s 四種。CSS 有 4 條 cubic-bezier，JS 另有 (0.34,1.3,0.5,1)、(0.2,0.55,0.3,1)、(0.2,0.7,0.2,1)。ease 用在會動的東西上：2276 卡片上浮、2796 chevron、1442 welcomeIn。已經漂移的部分：COMPLETE_BURST_MS=480 的註解寫「略長於 .45s」，實際 complete-burst 是 0.4s、碎點是 0.5s；setTimeout 900 手動對應 0.9s 閃色；0.45s slide 對應 setTimeout 470；welcome-track 用同一條曲線卻是 0.38s。popup 自己又寫了一套 0.15s、0.2s ease。兩個檔案都沒有共用變數。
- **為什麼**：B8：一套 token、一個節奏，同一個角色只有一個值，popup 和 dashboard 才會像同一個產品。review.md 規定，對不上 token 的手寫值整份 review 只算一條 minor finding。

<details><summary>修法</summary>

```
兩個檔案的 :root 都宣告同一組：
--t-color: 200ms cubic-bezier(0.25, 0.1, 0.25, 1)（transition.color）
--t-fade: 200ms cubic-bezier(0.23, 1, 0.32, 1)（transition.fade）
--t-swap: 150ms cubic-bezier(0.23, 1, 0.32, 1)
--t-reveal: 300ms cubic-bezier(0.23, 1, 0.32, 1)
--t-disclosure 與 --t-menu: 350ms / 220ms cubic-bezier(0.215, 0.61, 0.355, 1)（ease.soft）
--spring-press: 400ms linear(...)（css-tokens spring.press）
--reflow 與 --spring-highlight: 300ms linear(...)（css-tokens spring.highlight，等同 spring.reflow 500/40）
--spring-selection: 500ms linear(...)
--ring: 800ms cubic-bezier(0.16, 1, 0.3, 1)（使用者已拍板，只命名，數值不動）
對應方式：所有 hover 換色（160、242、460、500、555、743、887、992、1101、1483、1735 的 background、1803、2525、2576、2719、2784、2842、3140、3159、3206、3223、3239）改用 var(--t-color)。480 的 submenu 改 var(--t-menu)。1496 的 welcome-track 改 ease.inOut cubic-bezier(0.77, 0, 0.175, 1)（route.md：兩頁一起移動的 push）。welcomeIn 改 ease.out。dashboard.js:2453 的 drag settle 改 var(--reflow)，DRAG_SETTLE_MS = 300。2985 的 VT group 保留 cubic-bezier(0.22,1,0.36,1)（約等於 ease.out），列為具名 deviation：B2 對 morph 的角色曲線是 ease.inOut、recipe 是 spring.dialog 750ms，但這是高頻 drill-down，起步慢的曲線看起來像延遲，750ms 又太長。COMPLETE_BURST_MS 改成至少 500（或監聽最後一顆碎點的 animationend），並修正「.45s」的過期註解。輸入框的 focus 邊框不要延長成 200ms（A17，見 P1）。
```
</details>

### #40 Popup 重新整理 Claude 用量會重建任務清單，把進行中的撤銷窗砍掉

- **規則**：A12　**頻率**：rare
- **位置**：`popup.js:484`, `popup.js:249`, `popup.js:490-493`
- **現況**：triggerClaudeRefreshSilently() 的 finally 會呼叫 loadData()，接著 renderTasks() 執行 list.innerHTML = ''。實測：勾一列，500ms 後按 ↻，100ms 內那一列消失（因為 manualDone 已是 true，被篩掉了），沒有收合，也無法撤銷。
- **為什麼**：A12：觸發一件事不應該重播或砍掉其他正在進行的動效。重新整理用量的 chip 沒有理由重建任務清單。

<details><summary>修法</summary>

```
刪除 484 的 loadData();。background.js:191 寫入 claudeUsage 後，storage.onChanged（490-493）本來就會 renderClaudeUsage。如果需要手動讀一次，用 chrome.storage.local.get('claudeUsage', (d) => renderClaudeUsage(d.claudeUsage || null))。
```
</details>

### #41 拖曳拿起時 clone 裡的文字跳位、清單下推 28px；放下時用 width/height 飛行，最後再切成另一個形狀的列

- **規則**：interaction:reorder / B9 / B5 / A8　**頻率**：rare
- **位置**：`dashboard/dashboard.js:2321-2329`, `dashboard/index.html:2861-2874`, `dashboard/index.html:2901-2911`, `dashboard/index.html:2889`, `dashboard/dashboard.js:2428-2458`, `dashboard/index.html:2920`
- **現況**：拿起時：clone 複製列的 border-box 尺寸，又多加 padding 6px 14px 和 1px 邊框，標題右移 12.6px，寬度 93.9→65.3px，截斷位置改變。同一幀 drop hint ::before（display:block）插到清單頂端，整個清單和 ghost 下推 27.6px；降級時收合的稽核清單被強制展開，也是硬切。.drop-active 的 transition 只寫在 active 狀態上，所以底色淡入、淡出卻是切的；padding-bottom 在 cd2180e 之後已經是死屬性。放下時：clone 用 transform 240ms cubic-bezier(0.2,0.7,0.2,1) 加 width、height 240ms ease 飛行（layout 屬性）。270ms 時 clone 被移除、落地列一幀解除隱藏；升級時 clone 仍是稽核列的形狀（14px、沒有勾選圈），落地的卻是有勾選圈、16px 標題的作業列，標題側移約 15px。
- **為什麼**：reorder.md：拿起的東西帶著陰影浮起，其他一切保持不動，被拿起的列裡面的字也不該移動。A8：只動 transform 和 opacity。B9：形狀改變要用 crossfade 銜接，不要硬切。B5：出場要倒著重播進場。

<details><summary>修法</summary>

```
拿起：.drag-clone.drag-clone 的 padding 改成 padding-inline: 14px（block 方向沿用列本身的 12px 或 8px），邊框改成 border: 0; box-shadow: 0 0 0 1px var(--border), 0 4px 10px rgba(20,20,19,.08), 0 14px 32px rgba(20,20,19,.16)。liftRow 設 clone.style.left = rect.left - 14 + 'px'; clone.style.width = rect.width + 28 + 'px';，top 和 height 維持 rect 原值。hint 移出文件流：.detail-assignments-list { position: relative; } .detail-assignments-list.drop-active::before { position: absolute; left: 50%; top: -3px; translate: -50% -50%; padding: 0 8px; background: var(--bg); }。tint 的過渡移到 base rule：.detail-assignments-list, .hidden-items { transition: background-color 200ms ease; }，並刪掉 padding-bottom。
放下：只飛位置，clone.style.transition = 'transform 300ms linear(...)'（--reflow），不動 width 和 height。快到達時 clone.animate([{opacity:1},{opacity:0}], { duration: 200, delay: 150, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' })；落地列以 inline opacity:0 開始，forced reflow 後清回 ''，同一條 200ms ease.out 過渡淡入，取代 !important 硬切。減少動態時不飛行，只在原地 crossfade。
```
</details>

### #42 詳情 morph 中途按 Back：上一段的 finished 清理會把下一段剛設好的名字清掉

- **規則**：A12　**頻率**：rare
- **位置**：`dashboard/dashboard.js:1739-1743`, `dashboard/dashboard.js:1811-1815`
- **現況**：兩個函式在 finished 之後都無條件清掉所有 [style*="view-transition-name"]。新的 startViewTransition 會 skip 上一段，上一段的 finished 在 microtask 裡 resolve，時間點在新 VT 捕捉 old 狀態之前，於是把剛設好的 old 名字清掉。實測回程只剩 ::view-transition-new(course-*)，沒有 old 也沒有 group，morph 退化成淡入。
- **為什麼**：A12：被打斷時要從當下接著往新目標走，不能退化。view transition 本身無法中斷，程式至少不能自己把下一段弄壞。

<details><summary>修法</summary>

```
let _vt = null;
function startMorph(update) {
  const t = document.startViewTransition(update); _vt = t;
  t.finished.then(() => {
    if (_vt !== t) return;   // 已被下一段接手，名字交給下一段管
    document.querySelectorAll('[style*="view-transition-name"]').forEach((el) => { el.style.viewTransitionName = ''; });
    _vt = null;
  });
  return t;
}
showCourseDetail 和 showGridView 都改成呼叫 startMorph。
```
</details>

### #43 首次同步的 skeleton 形狀不對（永遠是 6 張課程卡），結束時硬切加空白一幀，shimmer 用 ease-in-out

- **規則**：interaction:skeleton / A4 / B2　**頻率**：rare
- **位置**：`dashboard/dashboard.js:989-1013`, `dashboard/dashboard.js:1019-1023`, `dashboard/dashboard.js:691`, `dashboard/index.html:2363-2376`, `dashboard/index.html:2389-2395`
- **現況**：skeleton 永遠是 6 張課程卡，但 currentPage 預設是 'week'（691），真正換上來的是進度環加任務清單，整個版面跳一次。skeleton 被 innerHTML 一幀刪掉，內容再以 opacity 0 加 translateY(4px)、.3s ease-out、fill both 進場，中間有一幀空白。側欄的 skeleton 列被 renderNav 直接換掉。shimmer 是 background-position 1.4s ease-in-out loop。
- **為什麼**：skeleton.md：skeleton 的形狀要像內容；skeleton 用 transition.fade 淡出，同時內容從 blur.surface 用 transition.reveal 清晰，兩者重疊，畫面才不會跳。B2：持續的 loader 要用 linear。

<details><summary>修法</summary>

```
依 currentPage === 'week' && !showSubmitted 分支，畫週頁形狀的 skeleton：左邊一個 158px 圓環加 4 條摘要，右邊 2 欄卡片條。skeleton 根節點不要放在 #main-section 裡面（renderWeekSection 和 renderCardGrid 都會覆寫它的 innerHTML），要掛在它的 parent：#main-section 的 parent { position: relative }，overlay { position: absolute; inset: 0; pointer-events: none; } 並加 aria-hidden。真內容渲染完後，forced reflow，再把 overlay 的 opacity 設成 0，走 200ms cubic-bezier(0.23, 1, 0.32, 1)（transition.fade），transitionend 時移除。新的子元素從 opacity:0; filter:blur(4px)（blur.surface）進場，300ms cubic-bezier(0.23, 1, 0.32, 1)（transition.reveal），不加 translateY。#course-nav 用同樣的進場。shimmer 改 animation-timing-function: linear；減少動態時 animation: none（P0-1）。
```
</details>

### #44 3px 倒數條的方角凸出週卡的圓角

- **規則**：craft polish　**頻率**：constant
- **位置**：`dashboard/index.html:1043-1051`, `dashboard/index.html:878-888`
- **現況**：.complete-countdown 是 absolute 定位，bottom:0; left:0; width:100%，沒有圓角。.week-task-card 是 border-radius 6px，沒有裁切，方角超出 1px 邊框內側曲線最多約 5px，最角落的像素甚至落在外側 6px 曲線之外。未截圖驗證。
- **為什麼**：差異很小，但每次在週視圖完成都會看到，而 Due 的品質就是靠這種細節。

<details><summary>修法</summary>

```
原 fix 的 border-radius: 0 0 5px 5px 無效：3px 高的元素圓角會被等比縮小到約 3px，而且 scaleX 會把左角壓扁。改成只在撤銷窗內裁切卡片：.week-task-card.completing { overflow: clip; }。overflow 會沿著內側 5px 曲線裁切，倒數條的動畫不必改。前提是先做 P1 的碎點 overlay，否則碎點也會被裁；勾選圈的 4px halo 和 outline 在 11px 的 inset 內，不會受影響。
```
</details>

### #45 死碼：.side-nav-count.count-flash 會把數字放大到 1.35，一旦被重新啟用就違反 B9

- **規則**：B9 / count-badge.md　**頻率**：rare
- **位置**：`dashboard/index.html:190-199`
- **現況**：沒有任何程式碼會加上 count-flash；註解指向的 settleCloneToNav 已經不存在（a1ebe62）。keyframes 會把 11px 的計數從 1.35 縮回 1，0.9s ease-out。
- **為什麼**：目前完全不會執行。但只要有人重新啟用，就違反 B9（變動中的數字不能縮放）和 count-badge.md（只有 badge 外框可以從 1.15 bump，數字本身只能淡換或滾動）。

<details><summary>修法</summary>

```
刪除 index.html 190-199。以後如果需要落地標記，只用 transition.color（200ms ease）把顏色閃成 var(--orange)，數字用 opacity 加 blur(2px) 在 transition.swap（150ms cubic-bezier(0.23, 1, 0.32, 1)）上交換。
```
</details>


## Opportunity — 目前硬切、加一點動效會更好懂

### #46 勾號一幀完整出現；可以讓它在填色之後「畫出來」（dashboard 與 popup 一起做）

- **規則**：recipe:press（checkbox）/ B2 ease.draw　**頻率**：constant
- **位置**：`dashboard/index.html:1015-1025`, `dashboard/index.html:992`, `dashboard/dashboard.js:1947`, `dashboard/dashboard.js:1999`, `popup.html:254`, `popup.html:268`
- **現況**：dashboard 的 data-done 是同步設定的，底色走 0.15s 過渡，點擊那一幀就開始填，A5 已經滿足；但白色 L 形勾號（rotate 45deg 的 ::after）一幀完整出現。popup 的填色和勾號（::after opacity 0.15s）是同時出現的。
- **為什麼**：press recipe 的 checkbox：框用填色立即回應，勾號接著在 transition.check 上畫出自己，而且只在「勾選這個動作」時播放，一開始就是勾選狀態的框保持靜止。這是 Due 最核心、每天反覆做的動作，也正是靠 craft 加分的地方。500ms 內畫完，落在 1.5s 撤銷窗裡面，不增加任何等待。

<details><summary>修法</summary>

```
@keyframes check-draw { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0); } }
.assignment-check.just-checked[data-done="true"]::after { animation: check-draw 300ms cubic-bezier(0, 0, 0.58, 1) 200ms both; }   /* transition.check：0.3s、delay 0.2s、ease.draw */
beginComplete 和 beginCompleteWeek 加 chk.classList.add('just-checked')，cancelComplete* 和重繪時移除。在旋轉後的局部座標裡，clip 從底部往上展開，會先露出短邊，再把長邊往上畫。
popup 用同一個 keyframe：.task-check.done::after { animation: check-draw 300ms cubic-bezier(0, 0, 0.58, 1) 200ms both; }，popup 只有在撤銷窗內才會出現 done，不必另做 just-checked。這是揭示而不是位移，減少動態時可以保留，或設 animation: none。
```
</details>

### #47 側欄主導航的 active 底色是兩處各自淡入淡出，可以改成一個會滑動的 indicator

- **規則**：recipe:indicator　**頻率**：constant
- **位置**：`dashboard/index.html:160`, `dashboard/index.html:167-170`, `dashboard/dashboard.js:1139-1141`
- **現況**：切換學期待辦/課程時，舊項底色淡出、新項底色淡入，各 0.12s，畫面上沒有任何東西從 A 移到 B。
- **為什麼**：indicator recipe 直接點名 Sidebar active item：一個 surface 以 spring.selection 從前一項滑到下一項（spatial：選取移動了）。搭配 P1 的 12px 方向滑入，側欄移動的方向就和內容進場方向一致。這是最常點的控制項上的 micro-interaction，符合 tool-first、以 craft 取勝的方向。

<details><summary>修法</summary>

```
在 .side-nav 裡加一個 <span class="side-nav-indicator" aria-hidden="true">，定位為 absolute; top: 0; height: var(--h); transform: translateY(var(--y)); background: rgba(217,119,87,.09)，並移除 .side-nav-item.active 本身的底色。
.side-nav-indicator { transition: transform 500ms linear(...), opacity 200ms cubic-bezier(0.25, 0.1, 0.25, 1); }（css-tokens spring.selection 500ms；transition.color）
.side-nav-indicator.is-off { opacity: 0; }
updateSideNav()：const act = document.querySelector('#nav-week.active, #nav-courses.active');。沒有 act 時（課程詳情、已繳交）加 is-off 淡出；從 is-off 恢復時先設 transition:none、寫入 --y/--h、getBoundingClientRect()（forced reflow，不用 rAF），再清掉 transition 並移除 is-off，原地淡入、不滑動；其餘情況直接寫入 --y = act.offsetTop + 'px'、--h = act.offsetHeight + 'px'。減少動態時 transform 不過渡。
```
</details>

### #48 自訂作業新增或編輯後沒有落地提示，刪除後空隙一幀收合

- **規則**：interaction:list　**頻率**：occasional
- **位置**：`dashboard/dashboard.js:899`, `dashboard/dashboard.js:911`, `dashboard/dashboard.js:933`
- **現況**：儲存後關閉 modal，經 loadData 重建。新項目依 due 排序落在某處，在詳情面板裡可能根本在可視區外，沒有任何提示。刪除後空隙一幀收合。
- **為什麼**：list.md：新增的項目在落地處淡入並上浮 8px；被移除的項目淡出，其他項目用 spring.reflow 收合空隙。

<details><summary>修法</summary>

```
重建後用 id 找到那一列（詳情用 [data-hideable-id]，週頁用 .week-task-card[data-assignment-id]），先 scrollIntoView({ block: 'nearest' })。以 forced reflow 播放進場：從 opacity:0; transform:translateY(8px) 回到靜止，transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1), transform 300ms linear(...)（--reflow）；減少動態時只做 opacity。.drag-arrived 底色閃示可選。刪除時在重建前後套用 P1 的 FLIP helper。焦點處理見 P0「其他重建路徑」。
```
</details>

### #49 Popup 重新整理按鈕：「↻」一幀換成「...」，重新整理成功沒有可見回饋

- **規則**：interaction:status-button / B9 / A4（spinner 例外）　**頻率**：occasional
- **位置**：`popup.js:187-193`, `popup.js:418`
- **現況**：忙碌時圖示立刻換成「...」，按鈕變暗到 0.45。fetch 回來後 chip 文字直接換掉；如果數值沒變，就完全看不出有沒有重新整理過。
- **為什麼**：status-button recipe：進度顯示在觸發它的地方，標籤用輕微 blur 交換。A4：loading spinner 是唯一保有意義的 loop，減少動態時改成 opacity pulse，不能停成一張靜止畫面。

<details><summary>修法</summary>

```
Markup 改成 <span class="refresh-glyph">↻</span>。setClaudeRefreshBusy 改為切換 .is-busy 和 disabled，不再改寫 textContent。CSS：.is-busy .refresh-glyph { display: inline-block; animation: refresh-spin 800ms linear infinite; } @keyframes refresh-spin { to { transform: rotate(360deg) } }；減少動態時 animation: refresh-pulse 1.2s ease-in-out infinite; @keyframes refresh-pulse { 50% { opacity: .4 } }。只有使用者手動觸發的重新整理（不含 30s 定時刷新）才讓 chip 文字用 opacity 加 blur(2px)、150ms cubic-bezier(0.23, 1, 0.32, 1) 交換（transition.swap、blur.icon）。
```
</details>

### #50 設定選單瞬開瞬關，子選單有淡入卻沒有 origin，兩層不一致

- **規則**：recipe:menu / A6 / B2　**頻率**：rare
- **位置**：`dashboard/index.html:411`, `dashboard/index.html:442-444`, `dashboard/index.html:480`
- **現況**：母選單在 display:none 和 block 之間切換，完全沒有動效。子選單是 transition: opacity 0.16s ease, visibility 0.16s ease，沒有 scale，也沒有 transform-origin。
- **為什麼**：menu recipe：選單從觸發點長出來，scale.menu 0.9，transition.menu 220ms ease.soft，關閉走同一條曲線，子選單比照母選單（spatial：讓人看出它是從齒輪冒出來的）。

<details><summary>修法</summary>

```
.settings-menu { display: none; opacity: 0; scale: .9; transform-origin: calc(100% - 16px) 100%; transition: opacity 220ms cubic-bezier(0.215, 0.61, 0.355, 1), scale 220ms cubic-bezier(0.215, 0.61, 0.355, 1), display 220ms allow-discrete; } .settings-menu.open { display: block; opacity: 1; scale: 1; } @starting-style { .settings-menu.open { opacity: 0; scale: .9; } }。子選單用同樣的參數，origin 對準「語言」那一列。減少動態時 scale 維持 1。openSubmenu 開頭加：if (settingsMenu.getAnimations().length) { settingsMenu.addEventListener('transitionend', openSubmenu, { once: true }); return; }，避免在母選單縮放途中量到錯的 rect。
```
</details>

### #51 Popup 首次開啟要串接兩次 storage 讀取才畫出清單，期間預設 UI 可能翻轉

- **規則**：gate（constant surface：no wait, no jump）　**頻率**：constant
- **位置**：`popup.js:495`, `popup.js:453-461`
- **現況**：第一個 paint 顯示寫死的「7 天內待辦」、「CLAUDE --」、空清單和用量 chip。兩次依序的 async 讀取之後，清單才填上，標題可能換語言（英文使用者），chip 也可能消失（showClaudeUsageInPopup=false 時）。沒有進場動畫，對一個一直被打開的 popup 來說是正確的。未在真正的 popup 視窗驗證，harness 無法重現 Chrome popup 的 auto-sizing。
- **為什麼**：gate：整天都會打開的介面用最短的形式，不等待、不跳動。修法是拿掉第二次 round trip 和看得見的翻轉，而不是加進場動畫。

<details><summary>修法</summary>

```
合併成一次 chrome.storage.local.get(['uiLanguage', 'showClaudeUsageInPopup', 'courses', 'assignments', 'courseNames', 'claudeUsage', 'manualDone', 'manualUndone', 'manualShown', 'manualHidden'], cb)，在同一個 callback 裡套用語言、用量顯示設定並 renderTasks。markup 裡 .usage-actions 維持可見（符合預設的 !== false），只在設定為 false 時於 callback 內隱藏；不要預設 hidden，否則大多數使用者會看到 chip 在載入後才冒出來。維持沒有進場動畫。
```
</details>


## Gaps（沒人審到／存疑）

- 未涵蓋：儲存權重（dashboard.js:3270-3291）與重設權重（weight-edit-reset）。這兩條路徑會同步呼叫 renderCourseDetailSection 整段重建，造成三個未經任何 finding 檢查的問題：(1) .detail-right-panel 的 scrollTop 歸零。(2) 圓餅的 conic-gradient 與圖例硬切。(3) modal 關閉時，setupModalA11y 透過 MutationObserver 歸還焦點，但它要還的那個 trigger 已被同步重建銷毀，焦點很可能落到 body，需在 harness 驗證。這三點與 P1『完成後整段重建』同一個根因。
- 未涵蓋：設定選單本身的鍵盤與焦點行為。#settings-menu-btn 沒有 aria-expanded，沒有 Escape 關閉，開啟時也不移動焦點。點『Claude 用量』或『使用教學』後選單變成 display:none，焦點留在被隱藏的 item 上（A17，dashboard.js:2945-2990）。[39] 只談動效，[12/38/40] 只談語言子選單。
- 未涵蓋：切換語言時 setLang 呼叫 applyUILanguage 加 loadData，會整頁重建（dashboard.js:508-516）。焦點、捲動位置、開著的課程詳情與展開面板是否保留，都沒有人檢查。
- 未涵蓋：welcome 第 2 頁『登入 Canvas 自動跳回』。#welcome-canvas-synced 用 hidden 切換直接冒出，沒有 role=status。chrome.tabs 把 dashboard 聚焦回來之後，焦點落在哪裡也沒查。
- 未涵蓋：#page-title 文字（學期待辦／課程／已繳交）在 updateSideNav（dashboard.js:1169）硬切，#detail-back-btn 的 display 也是硬切，兩者都沒有用 B9/swap 評估。也要確認它們與 P1 WAAPI switchPage 進場的時間點是否一致。
- 未涵蓋：週待辦有一組歸零時，左欄 .wk-breakdown 的摘要列會消失，右欄整個 .week-group（含 divider）也會消失。P1 FLIP 只把 card、group-title、divider 當 leaf 處理，左欄摘要列的硬切與連帶的版面位移沒人量過。
- 未涵蓋：側欄課程列 .nav-course-item 的 active 底色（index.html:242，background 0.12s），在詳情內切換課程時的表現。[43] 的 indicator 只處理 #nav-week 與 #nav-courses。
- 未涵蓋：首次安裝帶 ?welcome=1 時，welcome modal 會疊在 first-sync skeleton 之上。modal 進場與 skeleton→content 的 arrive 同時發生，兩者的互動沒有檢查。
- 未涵蓋：popup 的 .usage-chip 依用量百分比變色（renderClaudeUsage, popup.js:418），變色是否硬切沒有評估。[77] 只涵蓋 refresh 的忙碌狀態。
- 已確認不需審：welcome 第 1 頁 mock 進度環與第 4 頁 SVG 示意圖都是靜態的，沒有引用任何 keyframe。claude_content.js / claude_injected.js 注入 claude.ai，grep 不到 style/animation/innerHTML，沒有 UI 動效。
- 存疑：[65] popup 火焰 loop 不在使用者記錄過的決策裡（記憶中的『一個資訊不雙重編碼』支持移除），但它是很顯眼的視覺元素。移除前應先問使用者是否為刻意設計。
- 存疑：[79] popup 兩段 storage 讀取造成的翻轉沒有在真正的 popup 驗證，harness 無法重現 popup 的 auto-sizing。信心低。
- 存疑：[19]/[46] FLIP 的 verifier 說會和 .drag-shift 衝突，但 [48] 的 verifier 指出 drag-shift 已在 cd2180e 移除，這個衝突應該不存在。真正的風險是量 after 之前必須先還原 scrollTop，否則所有 item 都會滑過一整段捲動距離。
- 存疑：[27] 原本的 fix（border-radius 0 0 5px 5px）不成立，已改成 .completing 時 overflow:clip。方角是否肉眼可見，沒有截圖驗證。
- 存疑：[7] 週卡 focus ring 被裁是依 harness 幾何推算（conf medium），沒有截圖。[60] 已繳交切換的延遲沒有量 storage 讀取是否真的超過一幀（conf low）。[15] input 邊框 0.12s 淡入信心低，且 .weight-edit-name/.weight-edit-pct 的部分已被 verifier 證偽。
- 存疑：[30] VT 修正用 object-fit:none，只在 harness 的單一 viewport 驗證過。寬度斷點（index.html:3367-3382）下卡片→詳情的比例，以及 .detail-weight-pie-container 的換行，都沒有測。
- 存疑：[36] 的『只在卡片位於可視區內才 morph』門檻需要實測。[43] 在課程詳情與已繳交狀態下 indicator 該不該顯示、該停在哪，屬於產品決定，目前只是暫定為 is-off。
- 實作依賴（非新 finding）：P0 完成焦點、P1 完成重建、P1 FLIP 收合、P1 週卡出場、P1 碎點 overlay、P3 倒數條圓角，共用同一個架構改動，也就是完成後改為『就地移除節點』而不是整段重建。建議一次做完，分開做會在 FLIP 量測時機、用 id 還原焦點、clearCompleteTimers 這幾處互相打架。P0 reduced-motion 的 CSS 與 JS（.wk-ring-bar transition:none 加 1434 的 matchMedia 判斷）也必須同時出貨。

## 被排除的事實（使用者已拍板或 verifier 駁回）

- (a11y-quality) Progress ring stroke-dashoffset .8s cubic-bezier(0.16,1,0.3,1) with no overshoot, plus the numerator tick on the same curve (index.html 675, 706-714) — user-decided. It deviates from spring.progress on style only. Its missing reduced-motion path is reported (A1 CSS/JS findings).
- (a11y-quality) celebrateRingArrival landing burst: ring micro-bounce, 16 four-color tangential dots, cap changes to 全部完成 (dashboard.js 1254) — user-decided. Only the reduced-motion path and the announcement are reported.
- (a11y-quality) 1.5s undo window with orange countdown bar, then dot burst, then row collapse (COMPLETE_DELAY_MS 653, complete-countdown 1035) — user-decided. The countdown bar's scaleX is the undo deadline, a meter rather than travel, so it stays under reduced motion. The focus and announcement bugs are reported.
- (a11y-quality) .side-nav-count.count-flash / @keyframes nav-count-flash with scale(1.35) (index.html 191-199) — Dead CSS. No JS adds 'count-flash' (settleCloneToNav doesn't exist), so no motion runs.
- (a11y-quality) .drop-active transition includes padding-bottom 0.18s (index.html 2889) — Nothing ever changes padding-bottom (drag-shift/--drag-gap aren't in the code), so it never animates.
- (a11y-quality) Modal focus handling for custom-assignment, weight, confirm and welcome overlays (setupModalA11y 3342-3389) — A17 is OK there: focus is trapped, the first field is focused on open, and the trigger gets focus back on close. The welcome-specific issues are reported separately.
- (a11y-quality) Collapsed .assignment-desc, .grade-calc-body and .hidden-items-list — They use display:none, so they aren't focusable when collapsed. A17 OK.
- (a11y-quality) .settings-submenu hidden with opacity+visibility 0.16s (index.html 468-487) — visibility:hidden takes its buttons out of the tab order, and the fade is opacity only, which is fine under reduced motion. Reachability is reported in the language-submenu finding.
- (a11y-quality) Keyboard parity for completion check, course/week card open, summary rows, card pager — A2 OK. Enter/Space call the same click path, so the keyboard gets the same undo window, burst and View Transition.
- (a11y-quality) openWelcomeModal re-enables the track transition in requestAnimationFrame (dashboard.js 3033) — It only restores a transition after a reset, and nothing animates until the user clicks, so a paused rAF in a hidden tab is harmless.
- (a11y-quality) A4 hidden-tab and off-screen pause for sync-dots / skel-shimmer — Chrome doesn't render CSS animations in background tabs. The sync button is always on screen in the sidebar footer, and skeletons exist only during the first sync. Only the reduced-motion part is reported.
- (a11y-quality) Drag edge autoscroll rAF loop (maybeEdgeScroll 2356) and the clone following the pointer — Direct manipulation. It stops on drop via cancelAnimationFrame, and the reorder recipe keeps pointer-follow under reduced motion. Only the tilt and the fly-in are reported.
- (a11y-quality) vt-root-out/in opacity (3017-3034), drag-arrived-flash background (2925-2931), complete-burst opacity (1028-1031), submenu opacity — Fades and color changes, which reduced motion keeps.
- (a11y-quality) .welcome-dot width 0.2s (1735) and settleClone width/height (2428) — A8 layout-property cost. That belongs to the performance dimension, not this accessibility review.
- (a11y-quality) .course-card-grid:focus-visible ring inside .courses-grid (padding 4px) — Outline offset 2px + width 2px = 4px, which fits the padding exactly, so it isn't clipped.
- (a11y-quality) .detail-right-panel focus/drop rings — 8px padding on both sides already keeps them from being clipped.
- (a11y-quality) .assignment-item rows, .assignment-title-link spans and .grade-calc-header are click-only divs/spans without tabindex; .hidden-items-toggle lacks aria-expanded — Real keyboard and accessibility gaps, but not motion. They're outside this rulebook and should be raised separately.
- (a11y-quality) .week-task-card role=button contains a nested <button> check — Nested interactive semantics, not motion. Outside this rulebook.
- (a11y-quality) Dark-mode remnants (.skel --skel-glint comment) — Light mode only is user-decided, so no dark-mode suggestions.
- (completion-celebration) Ring stroke-dashoffset transition .8s cubic-bezier(0.16,1,0.3,1), no overshoot (index.html L675) — user-decided
- (completion-celebration) Ring retargets mid-transition: prevOffset is read from getComputedStyle of the live bar, then a forced reflow, then the target is set synchronously (dashboard.js L1341-1343, L1426-1430) — Compliant with A12 (continues from the current value, no restart) and with the user's no-rAF rule
- (completion-celebration) Landing-burst celebration: ring scale 1.04, numerator pop 1.16, 16 four-color tangential dots, hand-typed cubic-bezier(0.34,1.3,0.5,1) — user-decided; also a rare success moment, which the gate lets use its own motion. Only the A1 gap is flagged
- (completion-celebration) Numerator pop scale(1.16) inside celebrateRingArrival (dashboard.js L1263) — The number is not changing at that moment (its tick finished earlier); it is a pop within the user-decided celebration, not a B9 text swap
- (completion-celebration) wk-frac-tick slides 7px with a fade, no scale (index.html L706-714) — B9-compliant ('more' level slide). It always slides up even when the count drops, but drops are rare (un-completing elsewhere), so ignored
- (completion-celebration) Countdown bar: transform scaleX 1→0, linear, 1.5s, transform-origin left, set inline from COMPLETE_DELAY_MS — Confirmed good: compositor-only, real time, matches the css-driven remaining-time bar; the undo window itself is user-decided
- (completion-celebration) Check circle answers on the click frame: data-done set synchronously, background/border transition 150ms ease, no press scale — A5 met; B4 says the checkbox does not scale
- (completion-celebration) Clicks ignored during the 480ms 'bursting' phase; a second click within the 1.5s window cancels — Deliberate guard plus user-decided undo semantics; toggling twice fast nets to no change as expected
- (completion-celebration) Particle cost: 10 x 7px dots per completion, 16 x 6px for the celebration, transform+opacity only, removed on re-render or onfinish — Negligible performance cost
- (completion-celebration) COMPLETE_BURST_MS 480 cuts the 500ms complete-dot keyframe 20ms early — Opacity is near zero by then; not visible
- (completion-celebration) Ring stroke-dashoffset is a paint property — A 158px SVG once per completion; the A8 cost is irrelevant at that size and frequency
- (completion-celebration) About 2.8s from click to arc landing (1.5s window + 0.48s burst + 0.8s arc) — Consequence of the user-decided undo window and ring curve
- (completion-celebration) drag-arrived-flash: background rgba(217,119,87,.14) to transparent, 0.9s ease-out (index.html L2924-2931) — Color-only, rare (drag landing), one row; color is allowed under reduced motion. 'ease' instead of 'ease-out' would be a nitpick
- (completion-celebration) Side-nav counts, group '(N)' titles and wk-sum numbers update instantly via textContent (count-badge.md would roll the digits) — Less motion on an open request with a tool-first gate: the ring numerator tick already gives feedback for the same change, and three more moving numbers in peripheral vision would be noise
- (completion-celebration) Burst and row-fade keyframes use the CSS 'ease-out' keyword rather than the ease.out token — A success flourish may keep its own curve; counts only toward one minor B8 cohesion note
- (completion-celebration) .assignment-check:hover glow not gated by (hover:hover) and (pointer:fine) (A3) — Belongs to the hover dimension and the page is desktop-first; left for the hover pass
- (completion-celebration) Exam and attendance items are hidden and scores are absent from daily views; popup uses a 3-tier urgency scale — user-decided; out of this dimension
- (completion-celebration) Welcome modal mini ring (.welcome-dash-mock-ring-bar) — Different class, so renderWeekSection's document.querySelector('.wk-ring-bar') cannot pick it up as the start offset; onboarding is out of this dimension
- (navigation-surfaces) VT group 用 0.28s cubic-bezier(0.22,1,0.36,1)，沒有用 expanding-card recipe 的 spring.dialog（750ms CSS 曲線） — 這是常用的 drill-down，VT 播放期間點擊不會生效。0.28s 而且曲線幾乎等於 ease.out token，比 750ms 的 spring 更符合 B3（越常用越快）；只在 B8 那條做 token 收斂。
- (navigation-surfaces) ::view-transition-group(sidebar)、old/new(sidebar) 設 animation:none — 這樣寫是正確的：實測 VT 動畫清單裡沒有 sidebar，-ua-mix-blend-mode-plus-lighter 也一起被拿掉，新的側欄當下就顯示，不會過曝也不會位移。
- (navigation-surfaces) vt-root-out 0.08s 與 vt-root-in 0.1s（延遲 0.05s）中間有約 30–50ms 兩邊都半透明的 dip — 發生在米白低對比的背景上，時間不到 50ms，感知不到，不值得改。
- (navigation-surfaces) .welcome-dot 對 width 做 transition（A8 layout 屬性） — 只有 5 個 6px 小方塊，而且在少用的 modal 裡，layout 成本可以忽略（review.md：成本只在常跑或大面積時才算數）；旁邊的點本來就該跟著挪位，改成 transform 得另做一個 indicator 元素，看不出差別。
- (navigation-surfaces) openWelcomeModal 在 rAF 裡把 track 的 transition 恢復（3033-3035） — 不構成 rAF 觸發 transition 的 bug：overlay 在加上 .open 前是 display:none，transition 本來就不會在開啟時觸發。這段重設是死碼，無害。
- (navigation-surfaces) setupModalA11y 和 openCustomAssignmentModal 用 rAF 移動 focus（3351、851） — 焦點在開啟後一個 frame 內就到位，符合 A17『開啟時聚焦內容』；分頁隱藏時焦點本來就沒有意義。
- (navigation-surfaces) popstate 前進到詳情（3160）、側欄點課程（1125）都是不做 morph 直接切換 — 程式註解寫明是刻意的（『無 cardEl → 直接切換』、『單擊：維持即時開啟』）；畫面上沒有來源卡片可以 morph，而且側欄是常用操作，直接切換不會讓人等。
- (navigation-surfaces) content-arrive：0.3s ease-out 加 4px 上浮，只在首次同步完成時播一次 — 跟 page.md（transition.reveal 300ms、小幅上浮）幾乎一致，又是一次性事件；只缺 reduced-motion，已併入 A1 那條。
- (navigation-surfaces) .welcome-btn（1752）、齒輪 .btn-theme-toggle（380）、.btn-add-assignment（580）用了 transition: all — hover 只改顏色和邊框，review.md 判定這種情況的 transition: all 無害；而且屬於按鈕那個 dimension。
- (navigation-surfaces) 教學頁用 680px 全寬 carousel，沒有用 steps.md 的 24px 位移加淡入 — onboarding 很少出現，gate 允許它有自己的節奏；真正的問題是畫面外的 step 可被 focus，已經單獨列為一條。
- (navigation-surfaces) 切頁時 renderWeekSection 會跑兩次（先渲染到暫存，470ms 後再渲染一次） — 看過 1341-1343 的 prevOffset 邏輯：第一次渲染時沒有舊弧，第二次讀到的就是目標值，所以進度環不會重複播放，分子的 tick 也不會觸發。
- (navigation-surfaces) 不支援 startViewTransition 時直接切換（1668/1752） — 擴充功能只跑在 Chrome 111 以上，這條 fallback 實際上走不到，直接切換也可以接受。
- (navigation-surfaces) 使用者已拍板的決策（工具優先、進度環、1.5s 完成窗、只有 light mode、popup 三級色階、考試永久隱藏） — 都不屬於導航和 overlay 這個 dimension；所有 fix 都只寫 light mode，沒有任何 dark 變體。
- (in-place-changes) Progress ring stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1) and the wk-frac-tick numerator (index.html:675, 706-713) — user-decided
- (in-place-changes) celebrateRingArrival landing burst on the week ring — user-decided, and outside this dimension
- (in-place-changes) 1.5s undo window (COMPLETE_DELAY_MS) with the linear scaleX complete-countdown bar (index.html:1035, dashboard.js:1960) — user-decided concept; linear is the right curve for a timer (B2)
- (in-place-changes) Dot burst plus the 0.4s row fade and the 480ms wait before the rebuild (COMPLETE_BURST_MS) — user-decided concept; only its missing reduced-motion path is reported (F4)
- (in-place-changes) Drag clone tilt rotate(0.4deg) + scale(1.02) + double shadow (dashboard.js:2341, index.html:2871) — user-decided look (CLAUDE.md '陰影＋微傾', mirrored in the welcome illustration). It deviates from B4/reorder.md (shadow only) but is not reported.
- (in-place-changes) CLAUDE.md documents an insert gap (.drag-shift with --drag-gap) that no longer exists in the code — user-decided: removed on purpose in cd2180e because the landing spot is decided by sorting and the gap implied a false placement. CLAUDE.md is stale.
- (in-place-changes) drag-arrived-flash 0.9s background fade after a drop (index.html:2924-2931) — color-only landing cue on a rare action; it doesn't block anything, so it isn't a wait
- (in-place-changes) maybeEdgeScroll drives auto-scroll with requestAnimationFrame (dashboard.js:2373) — a loop that runs only while the pointer is held on a visible page; the hidden-tab rAF lesson is about triggering transitions, which this doesn't do
- (in-place-changes) Grade calculator totals (.grade-calc-final-display, group scores) change text on every keystroke with no animation — frequent typing feedback should snap; motion would lag behind the input
- (in-place-changes) The rename input replaces the course name instantly when the pencil is clicked — an edit mode should answer on the frame of the click (A5); only its side effects are reported (F9)
- (in-place-changes) Weight editor rows are added and removed with no motion, and the color dots re-index on delete — rare, a handful of rows in a modal; snapping is fine; only the focus bug is reported (F10)
- (in-place-changes) .card-pager-info '1 / 2' text changes instantly — tiny counter; covered by the rows' swap in F8
- (in-place-changes) sync-dots loop uses ease-in-out — a loop moving on screen uses ease-in-out per B2; only reduced motion (F4) and accessibility (F11) are reported
- (in-place-changes) .assignment-check background, border and box-shadow transitions at 0.15s — a color change on a small control is fine (A8 note); how the check mark draws belongs to the controls dimension
- (in-place-changes) switchPage uses a double rAF and a 470ms page slider; View Transition morph; wk-sum-row smooth scrollTo; nav-count-flash — outside this dimension (page transitions, navigation, badges)
- (in-place-changes) Popup's 3-tier urgency scale, exams/attendance hidden, light mode only — user-decided; nothing recommended against them
- (in-place-changes) No validation feedback when a grade-calculator score is above points_possible — a product validation question, not motion; outside this review
- (popup) No `transition: all` anywhere in popup.html; every transition names its properties (117, 153, 217, 254, 268, 425) — A11 passes
- (popup) :focus-visible outline rules (63-71) on .task-check, .task-name.clickable, .usage-chip, .usage-refresh, .btn — None of those elements' transitions include outline or box-shadow, so the ring shows at once (A17 passes). Only the clipping is a finding.
- (popup) Refresh button is set `disabled` while busy (popup.js 191) and could drop keyboard focus — Verified in Chrome 152: focus stays on the button while it's disabled and after it's re-enabled. No A17 issue.
- (popup) No entrance animation when the popup opens — Correct per the gate for a surface opened constantly: the shortest form is none.
- (popup) 1.5s undo window, manualDone persisted immediately at check time (popup.js 330-331), so closing the popup mid-window keeps the completion — User-decided
- (popup) Popup's 3-tier urgency scale today/soon3/week7 (upcomingClass, popup.html 330-388) differs from the dashboard's — User-decided; deliberately not unified
- (popup) Row collapse animates max-height and padding (layout properties) — A8 height exception: content must push what's below. At most a few rows in a 320px popup, so negligible cost. Only its curve and reduced-motion path are findings.
- (popup) Collapsing row content during the height animation — Clipped by overflow:hidden, never scaled, so nothing stretches (B9 passes)
- (popup) .task-check has no press scale — Correct per the press recipe: a checkbox answers with its fill, not a scale
- (popup) Check fill starts on the click frame (background 0.15s) — A5 passes
- (popup) setInterval 30s re-render of the usage chip (popup.js 441-445) — Not an animation, and it only runs while the popup document exists. Chrome destroys the popup when it loses focus, so A4's hidden-tab case doesn't apply.
- (popup) Reduced-motion block (362-367) stops the flame loops entirely — Correct for a decorative loop (A4). It leaves the check and row opacity fades alone, so fades are kept. Only its incompleteness is a finding.
- (popup) .task-list max-height 188px internal scroll (171-172) and 3px styled scrollbar — No scroll-driven or smooth-scroll motion to judge; layout is user-decided (about 3 rows).
- (popup) Last row's border-bottom vanishing by :last-child when the row below is removed (1px shift) — Sub-pixel-scale polish, not worth a change
- (popup) Chrome popup window auto-resizing every frame while a row collapses (when ≤3 rows, no scroll) — Can't be verified in the harness (real popup sizing is browser-driven), so not reported as a finding
- (popup) font-display: swap on the bundled local woff2 fonts (popup.html 14-39) — Local extension fonts load near-instantly; a flash can't be confirmed without the real popup
- (popup) Silent refresh failure: i18n key claudeRefreshMissing is never shown — UX copy, not motion; outside this dimension
- (popup) font-weight 500 on .task-name/.task-meta/.task-due with only 300/400 faces bundled (renders as 400) — Typography, not motion; outside this dimension
- (popup) Dashboard (dashboard/index.html, dashboard.js) has no prefers-reduced-motion rule at all; grep finds only popup.html:362 — Outside the popup dimension; for the dashboard reviewer
- (popup) Dashboard's completion snaps the list closed by re-rendering after the burst (dashboard.js 1973, 2026), while the popup collapses smoothly — The cohesion gap that runs the other way belongs to the dashboard dimension. Noted here only so the B8 comparison isn't one-sided.
- (press-hover-cohesion) 沒有任何可按元素在 hover 時縮放：index.html 裡的 transform 只有 nav-count-flash keyframe（196）、welcomeIn（1459）、卡片 translateY（2283）、ring 和勾號的 rotate；JS 裡只有慶祝動畫（WAAPI）和拖曳 clone 的 scale(1.02)（dashboard.js:2341） — B4 這條成立，不需要修
- (press-hover-cohesion) .assignment-check 勾選圈沒有按壓縮放 — 這是正確的：B4 規定 checkbox 不縮放。beginComplete／beginCompleteWeek 同步設定 data-done（dashboard.js:1947／1999），底色當幀就填上，A5 成立
- (press-hover-cohesion) 沒有任何進場或回應中的元素使用 ease-in — 只有 loop 用 ease-in-out（dot-bounce 361、skel-shimmer 2375），B2 允許 loop 這樣用
- (press-hover-cohesion) 只改顏色的 hover 走 `ease`，例如 .side-nav-item 0.12s（160） — 曲線正確（ease 本來就是給顏色用的），只是時長不符合 token，已併入 B8
- (press-hover-cohesion) .course-card-grid 的 border-color／box-shadow 走 0.2s ease — 完全等於 transition.color（200ms ease），只有 transform 那部分需要修（F4）
- (press-hover-cohesion) 進度環的 stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)，以及分子 tick 0.4s 同一條曲線（675、713） — 使用者已決定；只在 B8 裡命名成 --ring，數值不動
- (press-hover-cohesion) celebrateRingArrival 的曲線：cubic-bezier(0.34,1.3,0.5,1) 320ms、cap 淡入 350ms ease-out、碎點 cubic-bezier(0.2,0.55,0.3,1) 650–790ms（dashboard.js:1256–1290） — 使用者已決定（落點迸發慶祝）
- (press-hover-cohesion) complete-countdown 1.5s linear、complete-burst 0.4s、complete-dot 0.5s 的完成流程 — 使用者已決定；倒數條用 linear 是對的（恆速）。只有 JS 時長漂移的問題列在 B8
- (press-hover-cohesion) .drag-grip:active 只把游標換成 grabbing，沒有縮放 — 這是正確的：它是拖曳握把，不是按鈕；拿起時用游標和 clone 回應
- (press-hover-cohesion) .settings-menu-item 和 submenu 按鈕沒有按壓縮放 — 選單項目用 highlight 回應，不用 press scale；選單的進出場屬於 menu 那個 dimension
- (press-hover-cohesion) 點側欄主導航時，active 狀態在 switchPage 裡同步透過 updateSideNav() 更新（dashboard.js:1194） — A5 成立
- (press-hover-cohesion) .course-card-grid 和 .week-task-card 的 transition 是逐一列名、不含 outline — 它們的 focus ring 會立即出現，A17 成立
- (press-hover-cohesion) role=button 的 div 卡片按 Enter/Space 時不會觸發 :active（A2） — keydown 直接呼叫 card.click()（dashboard.js:1489、1549），morph 立刻開始，本來就看不到按壓
- (press-hover-cohesion) 頁面 slider 用 double requestAnimationFrame 觸發 transition（dashboard.js:1225），welcome track 也用 rAF（3033） — 不在這個 dimension（page transition）；請交給負責那邊的 review，它違反使用者『不要用 rAF 觸發 transition』的教訓
- (press-hover-cohesion) .welcome-dot 過渡 width（1735），.drop-active 過渡 padding-bottom（2889） — A8 的 layout 屬性問題屬於 indicator／drag 那兩個 dimension；這裡只把時長併入 B8
- (press-hover-cohesion) Popup 的按壓與 hover — 不在範圍內：這個 dimension 只看 dashboard

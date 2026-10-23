# 動效審查實作（2026-10-23）

來源：`docs/motion-review-2026-10-22.md`（52 條，依 Animate UI skill 規則審查）＋使用者在 `dev/motion-review/` 逐條看前後對比後的決定（`dev/motion-review/decisions-final-2026-10-23.json`）。

## 範圍

| 決定 | 項目 |
|---|---|
| 做 | 除了 #16 以外的全部項目（#1、#5、#25、#50 經 2026-10-23 對話改為同意） |
| 做，但縮小範圍 | #7 只修「作業描述」的鍵盤展開與 `aria-expanded`；成績計算器維持原樣（使用者不使用它，要不要移除另外決定） |
| 不做 | #16（卡片↔詳情 morph 的文字拉扯） |
| 重新設計 | #21 popup「今天到期」badge：實心紅底（`#c4381e`）＋白色單色火焰，拿掉漸層與光暈；火焰要「跳」（預設 C1 跳躍：`flame-hop` 1.1s，往上竄→落下微壓扁，底部為原點；C2 搖曳為備選）。reduced-motion 時停。設計稿 `dev/flame-redesign/` |
| 新增 N1 | 語言子選單改為點擊開關（不再靠 hover＋180ms 延遲），滑鼠不小心移開不會關閉；與 #10 一起做 |
| 新增 N2 | 「新增／編輯作業」與「權重編輯」視窗：點背景不關閉（只用 ✕、取消、Esc），已輸入的內容保留到送出或按取消為止 |

## 使用者備註 → 實作要求

- **#1／#12**：每張卡的 1.5 秒撤銷窗彼此獨立。連勾三張時每張都要跑滿自己的倒數，不能被第一張的重繪清掉（驗收：連勾三張，三張都有完整倒數＋碎點爆）。
- **#13／#23**：dashboard 的倒數條和「↩ 撤銷」收進卡片／列原本的框裡，**卡片尺寸完全不變、其他卡片不被推動**，跟 popup 一樣（驗收：勾選前後量每張卡的 getBoundingClientRect，撤銷窗期間 0px 位移）。
- **#19**：週卡離場要順（淡出＋輕微縮小，接著 #18 的 FLIP 補位，兩段要接得上，不能有停頓或跳幀）。
- **#25**：直接做，不用再問。
- **#0 備註**：demo 裡圓環上移是 demo 的版面問題；真正的 Due 左欄頂部對齊，不受影響。

## 共同約束

- vanilla JS／CSS，不加任何套件。數值取自 Animate UI token（`.claude/skills/animate-ui/references/tokens.md`；spring 轉好的 CSS `linear()` 在審查報告的修法裡）。
- 先寫 `:root` 動效 token（#39），之後各波都用 token，不再手寫時長。
- 一律 light mode；不要用 rAF 觸發 transition（改用 forced reflow）。
- 進度環 SVG stroke 0.8s `cubic-bezier(0.16,1,0.3,1)` 與落點迸發是使用者拍板的設計，只修品質問題（reduced-motion、獨立計時），不改外觀。
- popup 三層相對緊急度刻度不要併回 dashboard。
- 審查報告的行號是 QA session（`fix/qa-2026-10-23`）改動**之前**的程式碼；實作時以函式名重新定位。

## 實作波次

dashboard 的 `dashboard.js`／`index.html` 是單一大檔，依序進行：

| 波 | 內容 | 項目 |
|---|---|---|
| W0 基礎 | `:root` 動效 token、`reduceMotion()` helper＋reduced-motion CSS 骨架、live region helper、focus ring 不過渡、hover 限定 `(hover:hover) and (pointer:fine)` | #39、#0（基礎）、#3（基礎）、#26、#11 |
| W1 完成流程 | 改成就地移除節點（取代整段 innerHTML 重建）＋FLIP 補位＋獨立計時＋焦點交接＋撤銷提示不改尺寸＋週卡出場＋碎點 overlay 與起點＋倒數條圓角＋勾號畫出＋環局部更新與慶祝 | #1、#12、#13、#18、#19、#20、#44、#46、#3、#0 |
| W2 導航 | 頁面切換、VT 焦點與配對、Back 回原卡、摘要列焦點、morph 中途 Back | #2、#15、#17、#27、#33、#42、#0 |
| W3 焦點／鍵盤 | 焦點框裁切、改名鉛筆、拖曳的鍵盤路徑、描述展開、重建控制項的焦點、教學 modal、語言子選單 | #4、#5、#6、#7（縮小）、#8、#9、#10、N1 |
| W4 就地變化 | disclosure、modal 出場、同步按鈕、課程卡換頁、已繳交切換、改名、表單錯誤、拖曳、skeleton、死碼、新增作業落地、設定選單、表單草稿 | #28–#32、#34、#38、#41、#43、#45、#48、#50、N2 |
| W5 按壓／hover | 按壓回饋、課程卡／週卡 hover、hover 過渡、側欄 indicator | #24、#25、#37、#47 |
| P popup | 與 dashboard 檔案不重疊，可平行 | #14、#21、#22、#23、#35、#36、#40、#49、#51，以及 #0、#1、#4、#11、#24、#37、#46 的 popup 部分 |

每波：實作 → 跑 `node extension/dashboard/*.test.js` → 在 `dev/harness.html`／`dev/popup-harness.html` 用 headless Chrome 驗收該波的每一條 → 獨立 reviewer 對照報告的修法與本 spec 檢查 diff。全部完成後更新 `CLAUDE.md` 對應段落（完成標記、撤銷窗、語言選單、modal 行為等）。

## 前置條件

QA session「Due bug」在同一個工作區有大量未 commit 修改（完成流程、同步錯誤、語言選單、新增作業表單都有動到）。**等它 commit 之後，以它的分支為基底開新分支再實作**，避免兩邊同時改 dashboard.js。

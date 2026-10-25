# Chrome Web Store 商店頁改版提案（2026-10-24）

> 文案草稿在 `docs/store-listing.md`；這份是「現況診斷＋素材規格＋執行順序」。

## 0. 先面對反方向的證據

- 目前 **11 位使用者、3 則評分**。商店頁優化提升的是「看到的人 → 安裝」的轉換率，前提是要有人看到。Canvas 這個利基在商店內的搜尋流量很小，**真正的流量來源大概是同學口耳相傳／群組貼連結**——那些人點進來看到的就是這一頁，所以頁面還是值得做，但別期待只改頁面就自己長大。
- 官方明講排名看「評分＋安裝數 vs 解除安裝數」（[Creating a great listing page](https://developer.chrome.com/docs/webstore/best-listing)）。頁面做漂亮之後，**請滿意的同學留評分**是第二槓桿。
- 我搜過 Reddit／Indie Hackers，**找不到有對照組數據的「改截圖後安裝數變多」分享**。以下建議分兩種：官方規格（硬性）、開發者經驗（意見，沒量測過）。所以要自己量：改版前先在開發者後台記下「曝光數／安裝數」當基準。

## 1. 現況診斷（2026-10-24 抓下來的頁面）

| 問題 | 證據 | 後果 |
|---|---|---|
| **說明自己唱衰自己** | 詳細說明寫「推薦使用 Popup，因為他基本上是唯一的核心功能」 | 讀者直接得出「這東西只有一個小功能」。**最便宜、最該先改** |
| 說明只有兩行 | 官方建議「一段概述＋短功能清單」 | 看起來像半成品 |
| 摘要過時又不精確 | 商店上是 v2.1.0 的「…for any Canvas school」，但只支援 `*.instructure.com` | 自訂網域學校裝了不能用 → 解除安裝 → 傷排名 |
| 截圖過時 | 標題列寫著 `Mock`；詳情頁清單出現 Midterm Exam（現在考試已自動隱藏）；進度環還是「本週完成」（現為「近期完成」）；日期停在 7–8 月 | 官方要求截圖反映最新版 |
| 截圖沒有說話 | 4 張都是純 UI，沒有標題字 | 讀者要自己猜每張在演什麼 |
| 第 3 張是 640×400 放大的 popup | 字糊、比例怪 | 官方點名不要模糊/失真 |
| 只有 4 張 | 上限 5 張 | 浪費一格 |
| 影片是第一個素材，縮圖＝一張沒有標題的截圖 | 商店顯示順序：**影片 → 截圖**（[listing 文件](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)） | 影片縮圖等於你的封面，現在它沒有傳達任何訊息 |
| 沒有官網／支援網址 | 詳細資料只有個人 gmail | 信任感低 |
| 名稱只有「Due」 | 商店搜尋很吃名稱的關鍵字匹配（[Matt Frisbie](https://mattfrisbie.substack.com/p/10-things-every-chrome-extension-needs)）；競品都叫「Canvas …」 | 搜「canvas」時幾乎找不到你 |
| 單一語言 | 擴充功能沒有 `_locales/`，所以後台無法填多語言說明/截圖 | 中英文只能擠在同一段裡 |

我沒辦法從公開頁面看出你**有沒有上傳 440×280 小宣傳圖**——請去後台確認。官方說法：沒有小宣傳圖的項目會排在有的後面（[Supplying Images](https://developer.chrome.com/docs/webstore/images)）。

## 2. 官方硬規格（照做，沒得商量）

- **截圖**：1280×800（建議）或 640×400；直角、滿版不留白邊；最多 5 張；**在商店裡一律縮成 640×400 顯示** → 字要在半尺寸下還讀得清楚。
- **小宣傳圖**：440×280，顯示在首頁/分類/搜尋結果。**不能多語言**。
- **Marquee**：1400×560，只有被選進首頁輪播才用到；沒有這張就不可能被選。
- **宣傳圖原則**：少字或不放字、縮到一半還能看、用飽和色、**避免大片白色/淺灰**（背景本身就是淺灰）、填滿整個區域、不能寫「第一名」「編輯精選」。
- **摘要**：≤132 字元、純文字，**來源是 manifest 的 `description`**——所以改摘要要發新版本。
- **影片**：YouTube 連結，可依語言另放。
- **Featured 徽章**：從 One Stop Support 自薦，看技術最佳實踐＋UX＋listing 品質，需要支援英文，新開發者通常要維持幾個月（[Google 部落格](https://blog.google/products/chrome/find-great-extensions-new-chrome-web-store-badges/)、[i-programmer](https://www.i-programmer.info/news/81-web-general/15399-google-adds-new-chrome-extension-badges.html)）。有開發者回報拿到徽章後安裝數短期跳約 7 倍（[Indie Niche](https://indieniche.substack.com/p/the-pinterest-extension-quietly-exploding)，個案）。**等這次改版上線、評分多一些再申請。**

## 3. 開發者經驗（意見，非量測）

- 第一張素材＝銷售主張，只講最有價值的一件事；每張只講一件事。
- 圖上加一行標題，6–10 個字（中文約 10–14 字）。
- 用看起來真實的假資料，別用空狀態或 onboarding 畫面。
- 3 張好圖勝過 5 張普通的。

## 4. 具體提案

### 4.1 名稱與摘要（需發 2.5.0）

- `name`：**`Due — Canvas 作業與截止日`**（英文 locale：`Due — Canvas Deadline Dashboard`）。保留品牌字 Due，後面加一個描述，不塞關鍵字。
- 摘要（中，51 字）：`Canvas 作業、截止日、評分比重一頁看完。點一下工具列就知道這週要交什麼，逾期自動置頂，不再漏交。`
- 摘要（英，122 字元）：`See every Canvas deadline at a glance. Auto-syncs assignments, due dates & grade weights, with overdue work pinned on top.`
- **加 `_locales/`（en、zh_TW、zh_CN）**，manifest 改 `__MSG_extName__`／`__MSG_extDescription__`＋`default_locale: "en"`。這是唯一需要動程式碼的部分，好處是解鎖每種語言各自的說明、截圖、影片，也滿足 Featured 的「支援英文」。

### 4.2 詳細說明

用 `docs/store-listing.md` 的草稿，但上架前要修三點：

1. **隱私段落要補 AI 分析**：「一個位元組都不會傳給開發者」對開發者是真的，但開了 AI 評分分析後，課程大綱會送到**你自己選的** LLM 供應商。不寫會變成誤導，也可能跟後台的隱私揭露對不上。
2. **加上 AI 評分比重分析**（2.1.0 之後最大的新功能）：「填自己的 Gemini/Qwen/DeepSeek key，Due 會讀課程大綱，自動補上 Canvas 沒設定的評分比重」。
3. 「本週進度環」改成「近期完成進度」，跟現在的介面一致。功能清單從 10 條縮到 6–7 條，把課程改名、多語言這類小功能合併成一行。

### 4.3 五張截圖（1280×800，每張頂部一行標題＋底下真實 UI）

統一外框：`--bg` 米白底、標題用 Source Serif 4、UI 截圖放大到佔畫面約 75%，邊角直角滿版。資料用 dev harness 的 mock，但**把標題列的 `Mock` 拿掉、日期改成 11 月**。

| # | 標題（中／英） | 畫面 |
|---|---|---|
| 1 | 點一下，就知道這週要交什麼／One click: everything due this week | popup 放大 2×（不是放大截圖，而是在 2× DPR 下截），旁邊縮小的 Canvas 分頁示意「不用打開 Canvas」 |
| 2 | 逾期置頂，顏色告訴你哪個最急／Overdue on top, color tells you what's urgent | 學期待辦頁：進度環＋分級摘要＋已逾期區 |
| 3 | 每份作業佔幾 %，一眼看懂／See what each assignment is worth | 課程詳情：圓餅圖＋成績計算器展開 |
| 4 | 考試、簽到自動收起，清單只留要做的事／Exams & attendance tucked away | 拖曳中的畫面（浮起的 clone＋已隱藏區 drop 提示） |
| 5 | 不用 token、不用註冊，資料只存在你的瀏覽器／No token, no sign-up, data stays local | 簡單的三格圖示：登入 Canvas → 自動同步 → 本機儲存。可附「AI 分析：讀大綱自動補比重」 |

### 4.4 小宣傳圖 440×280（＋ Marquee 1400×560 同一設計放大）

- 不放截圖、幾乎不放字：左邊 Due 圖示＋「Due」字標，右邊一個抽象化的進度環＋三條彩色截止標籤（橘/黃/藍）。
- 背景**不要用米白**（官方說避免白/淺灰，因為商店背景就是淺灰）→ 用 `--dark #141413` 或 `--orange #d97757` 滿版。
- 不能多語言，所以不放中文字。

### 4.5 影片（取代現在的 demo）

- 30–40 秒，不用講話，畫面上用字幕，1280×720。
- 0–5 秒：點工具列圖示 → popup 彈出（最重要的一幕放最前面）。
- 5–15 秒：勾掉一項（碎點爆）→ 打開 Dashboard → 逾期區。
- 15–25 秒：點課程 → morph 展開 → 圓餅＋計算器輸入分數。
- 25–35 秒：拖一場考試進已隱藏區。
- 結尾：圖示＋「Due — Canvas 作業與截止日」。
- **YouTube 自訂縮圖要放截圖 1 的設計**——它是整個頁面的封面。

### 4.6 其他欄位

- 官網：開一個 GitHub Pages（一頁就夠：一句話＋截圖＋隱私權政策＋回報問題連結），填進「官網」與「支援網址」。
- 支援信箱可以繼續用現在的 gmail，但要放在 Dashboard 設定選單裡（例如「回報問題」）。

## 5. 執行順序（從最便宜的開始）

1. **今天，5 分鐘**：後台把詳細說明換成修過的草稿，刪掉「基本上是唯一的核心功能」。不需要發新版本。
2. 去後台確認有沒有 440×280 小宣傳圖；記下現在的曝光數/安裝數當基準。
3. 做 5 張截圖＋小宣傳圖（可以用 dev harness 畫成 HTML 模板，再用瀏覽器以 1280×800 截圖）。
4. 加 `_locales/`、改 name/description → 發 2.5.0，同時上新截圖、中英兩套說明。
5. 錄新影片、設定自訂縮圖。
6. 上線 4 週後比對曝光 → 安裝的轉換率；評分 ≥10 再自薦 Featured。

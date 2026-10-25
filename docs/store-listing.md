# Chrome Web Store — 商店資訊文案（2026-10-25 定稿草稿）

配合商店素材定稿（`dev/store-review/v2/out/final/`、英文版 `out/final-en/`）。

- **名稱**和**摘要**來自擴充功能的 `_locales/<語言>/messages.json`（`extName`、`extDescription`），要發新版本才會更新。摘要上限 132 字元。
- **詳細說明**在開發者後台「商店資訊」裡直接填，每種語言各一份，不用發新版本。
- 擴充功能加了 `_locales` 之後，後台才能按語言分別填說明、上傳截圖和影片。預設語言是 `en`。

---

## 繁體中文（zh_TW）

**名稱**：Due — Canvas 作業與截止日

**摘要**：Canvas 的作業、截止日和評分比重一頁看完。點一下工具列就知道這週要交什麼，逾期的自動置頂。

**詳細說明**：

點一下，這週要交的都在這。Due 自動同步你的 Canvas，把作業、截止日和評分比重整理成一頁，逾期的釘在最上面。

不要 API token，也不用註冊：Due 直接用你瀏覽器裡現有的 Canvas 登入，打開 Canvas 一次之後就會自動同步。

■ 主要功能
・工具列 popup：7 天內要交的作業一覽，做完直接勾掉（1.5 秒內可以反悔）
・依緊急程度上色：逾期、7 天內、8–30 天、30 天以上
・評分比重圓餅圖：Canvas 有設定就照用，也可以自己填
・成績計算器：已評分的自動帶入，填上預估分數就算出加權總分；側欄「成績」一次看每一科
・考試、簽到自動收進「已隱藏」，判斷錯了拖回清單就好
・自訂作業、課程改名、繁中／简中／English
・AI 評分比重分析（選用）：填入你自己的 Gemini、Qwen、DeepSeek 或 NVIDIA NIM 金鑰，Due 會讀課程大綱，補上 Canvas 沒設定的比重
・附加：如果你也用 claude.ai，popup 可以顯示 Claude 的 5 小時用量

■ 適用學校
Canvas 網址結尾是 .instructure.com 的學校（例如 hkust-gz.instructure.com）。用自己網域架設 Canvas 的學校目前還不支援。

■ 隱私
沒有後端伺服器、沒有分析、沒有追蹤。資料存在你的瀏覽器，開發者收不到任何東西。
AI 分析預設關閉。開啟後，還沒有評分比重的課程，它的大綱文字和 PDF 會從你的瀏覽器直接送到你選的 AI 供應商，用你自己的額度，並依該供應商的條款處理（部分免費方案可能會拿去改進模型）。詳見隱私權政策。

---

## 简体中文（zh_CN）

**名称**：Due — Canvas 作业与截止日

**摘要**：Canvas 的作业、截止日和评分比重一页看完。点一下工具栏就知道这周要交什么，逾期的自动置顶。

**详细说明**：

点一下，这周要交的都在这。Due 自动同步你的 Canvas，把作业、截止日和评分比重整理成一页，逾期的钉在最上面。

不要 API token，也不用注册：Due 直接用你浏览器里现有的 Canvas 登录，打开 Canvas 一次之后就会自动同步。

■ 主要功能
・工具栏 popup：7 天内要交的作业一览，做完直接勾掉（1.5 秒内可以反悔）
・按紧急程度上色：逾期、7 天内、8–30 天、30 天以上
・评分比重饼图：Canvas 有设定就照用，也可以自己填
・成绩计算器：已评分的自动带入，填上预估分数就算出加权总分；侧栏「成绩」一次看每一科
・考试、签到自动收进「已隐藏」，判断错了拖回列表就好
・自定义作业、课程改名、繁中／简中／English
・AI 评分比重分析（可选）：填入你自己的 Gemini、Qwen、DeepSeek 或 NVIDIA NIM 密钥，Due 会读课程大纲，补上 Canvas 没设定的比重
・附加：如果你也用 claude.ai，popup 可以显示 Claude 的 5 小时用量

■ 适用学校
Canvas 网址结尾是 .instructure.com 的学校（例如 hkust-gz.instructure.com）。用自己域名架设 Canvas 的学校目前还不支持。

■ 隐私
没有后端服务器、没有分析、没有追踪。数据存在你的浏览器，开发者收不到任何东西。
AI 分析默认关闭。开启后，还没有评分比重的课程，它的大纲文字和 PDF 会从你的浏览器直接发到你选的 AI 供应商，用你自己的额度，并按该供应商的条款处理（部分免费方案可能会拿去改进模型）。详见隐私政策。

---

## English（en，預設）

**Name**: Due — Canvas Deadline Dashboard

**Summary**: Every Canvas deadline at a glance. Auto-syncs assignments, due dates and grade weights, with overdue work pinned on top.

**Description**:

One click shows everything due this week. Due syncs your Canvas automatically and puts assignments, deadlines and grade weights on one page, with overdue work pinned on top.

No API token, no sign-up: Due uses the Canvas session already in your browser. Open Canvas once and it keeps itself in sync.

■ Features
・Toolbar popup: everything due in the next 7 days. Check items off when you're done (1.5 seconds to undo)
・Color by urgency: overdue, next 7 days, 8–30 days, 30+ days
・Grade weights as a pie chart: Canvas weights when your instructor set them, or enter your own
・Grade calculator: graded scores fill in automatically; type an estimate and see your weighted total. The Grades view in the sidebar shows every course at once
・Exams and attendance go to "Hidden" automatically. If one is sorted wrong, drag it back to the list
・Custom to-dos, course renaming, English / 繁中 / 简中
・AI grade-weight analysis (optional): add your own Gemini, Qwen, DeepSeek or NVIDIA NIM key and Due reads the syllabus to fill in weights Canvas doesn't have
・Extra: if you also use claude.ai, the popup can show your Claude 5-hour usage

■ Which schools work
Schools whose Canvas address ends in .instructure.com (for example hkust-gz.instructure.com). Schools that host Canvas on their own domain aren't supported yet.

■ Privacy
No backend server, no analytics, no tracking. Your data stays in your browser; nothing reaches the developer.
AI analysis is off by default. When you turn it on, the syllabus text and PDFs of courses that don't have grade weights yet go straight from your browser to the AI provider you picked, on your own quota and under that provider's terms (some free tiers may use it to improve their models). See the privacy policy for details.

---

## 截圖上的文案（定稿，對照用）

| 位置 | 繁中 | English |
|---|---|---|
| 影片縮圖 | Canvas 作業，一眼看完／30 秒看懂怎麼用。 | Every Canvas deadline, at a glance / See how it works in 30 seconds. |
| 第 1 張 | 點一下，｜這週要交的／不用打開 Canvas，逾期的釘在最上面。 | One click, \| this week's work / No need to open Canvas. Overdue work stays on top. |
| 第 2 張 | 做完，就勾掉（還沒交／1.5 秒內可以反悔／完成） | Done? Check it off (Not done / 1.5s to undo / Done) |
| 第 3 張 | 每一科怎麼算分，一眼看懂 | How every course is graded, at a glance |
| 第 4 張 | 考試、簽到自動收起 | Exams and attendance, tucked away |
| 第 5 張 | 登入 Canvas，就能用 | Signed in to Canvas? You're set. |

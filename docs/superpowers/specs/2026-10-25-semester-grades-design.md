# 成績計算吃自訂權重＋學期成績總覽

日期：2026-10-25
基準分支：`fix/qa-2026-10-23`（94abcf7，含 AI 權重來源標示；master 尚未合併 QA 對計算器的修正）
來源：擁有者問「現在有沒有計算學期所有成績的分數」。實情是只有單門課、而且只有 Canvas 自己設了權重的課才有計算器。

## 背景

- 成績計算器（`renderGradeCalculator`／`recalculateGrades`）只在 `courseUsesGroupWeights` 為真時出現，只用 Canvas `group_weight`，完全不讀 `customWeights`。
- 圓餅卻是「自訂優先」：`customWeights[cid]` 有值就畫自訂。結果是：
  - AI 分析或手填權重的課（Canvas 沒開加權，正是 AI 功能的目標客群）**沒有計算器**。
  - Canvas 有權重、使用者又改過的課，圓餅顯示自訂、計算器卻用 Canvas，**兩邊對不上**。
- 沒有任何跨課的總覽。
- 決策 3：日常視圖（學期待辦／課程 grid／作業列／已隱藏列）不顯示分數，分數只在計算器。

## 判斷點 1：自訂權重項目跟作業怎麼對上

自訂權重是 `{ name, weight }`，名稱來自大綱（AI）或使用者自己打的字，跟 Canvas assignment group 沒有對應關係。候選做法：

| 做法 | 問題 |
|---|---|
| 只靠名稱比對 group | Canvas 預設只有一個「Assignments」組裝全部作業（含期中、期末）。照組名比對會把期中考算進作業項目，而且使用者看不出來 |
| 只讓使用者手動指派 | AI 寫完權重後，計算器是空的，要先指派十幾項作業才有數字。大部分其實能自動對上 |
| 對不上就不計入並標示 | 不會算錯，但只靠它，能自動對上的也全被丟掉 |

**推薦：三層疊起來。先自動歸類，每列都能手動改，對不上的明確標示「未計入」。** 原則是**寧可不算，不可算錯**：自動歸類只在有唯一最佳候選時才歸，平手或零分一律未歸類。每一筆歸類都看得到，也都能改。

### 自動歸類規則（純函式 `DueGradeCalc.matchItem`，依序取第一個有結果的）

1. **手動指定**：`gradeItemMap[cid][aid]` 是字串，而且這個名稱還在目前的權重項目裡 → 用它。值是 `null` → 不計入（使用者明說的）。名稱已經不在（項目改名或刪除）→ 當作沒指定，往下走。
2. **作業名稱關鍵字**：作業名稱與各項目名稱的關鍵字交集最多、而且唯一 → 用它。
3. **Canvas 組名完全相同**：作業所屬 group 的名稱正規化後等於某項目名稱 → 用它（Canvas 權重改編過的課，項目就是從 group 名稱預填的）。
4. **Canvas 組名關鍵字**：同第 2 條，改拿 group 名稱比對。
5. 其餘 → **未歸類**。

先看作業名稱、再看組名，是因為組名是容器層級的證據。Canvas 預設的「Assignments」組常把期中考也裝在裡面，作業名稱「Midterm Exam」才是直接證據。

**大雜燴組不看組名**：同一組的作業依第 1、2 條已經對到兩個以上不同項目（例如預設的 Assignments 組裡，HW 對到 Homework、Midterm Exam 對到 Midterm），代表這組什麼都裝，組名不可信。這組裡對不上名稱的作業跳過第 3、4 條，直接未歸類。否則「Peer Review」這類東西會因為組名叫 Assignments，被默默算進 Homework。組內只對到一個項目、或一個都沒對到的「單純組」，照常用組名。

**關鍵字（`keysOf`）**：小寫、全形轉半形、`mid-term`／`mid term` 先併成 `midterm`；英文切字，去掉數字與停用字，單複數歸一（`quizzes→quiz`、`studies→study`、`labs→lab`）。同義詞歸到同一個 key：

| key | 同義（英／繁／簡） |
|---|---|
| homework | homework, hw, assignment, exercise, 作業, 作业, 習題, 习题, 功課, 功课 |
| quiz | quiz, 測驗, 测验, 小測, 小测, 小考 |
| exam | exam, examination, test, 考試, 考试 |
| midterm | midterm, 期中 |
| final | final, 期末 |
| project | project, 專題, 专题, 專案, 专案, 項目, 项目, 大作業, 大作业 |
| lab | lab, laboratory, 實驗, 实验 |
| participation | participation, attendance, engagement, 出席, 出勤, 參與, 参与 |
| presentation | presentation, 簡報, 简报, 展示, 演講, 演讲 |
| report | report, 報告, 报告 |
| paper | paper, essay, 論文, 论文 |
| reading | reading, 閱讀, 阅读 |

- 單獨出現的 `midterm`／`final`（除了它沒有別的字）視為考試，補上 `exam`。所以「Midterm」項目對得上「Midterm Exam」作業，「Final Portfolio」不會被當成期末考。
- 其他英文字（≥3 字母）以原字當 key，例如 `kaggle`、`case`、`study`，「Case Studies」項目才對得上「Case Study — Market Entry」。
- 項目名稱含中文、整串（正規化後 ≥2 字）出現在作業名稱裡，再加 1 分（給沒有關鍵字的中文名稱用，例如「論文」對「期末論文」）。英文名稱靠上面的字詞 key 就夠，不做子字串比對（避免「Lab」命中「Collaboration」）。
- 第 3 條的「名稱相同」比對英文字單數化、去標點後的整串，所以「Quizzes」組等於「Quiz」項目。

### 資料

新的共享使用者 key `gradeItemMap: { [courseId]: { [assignmentId]: string | null } }`：

- 字串＝計入這個名稱的權重項目，`null`＝不計入，沒有這個 key＝自動。
- 走 `updateShared`（read-modify-write，只動這一門課的這一項），列進 `SHARED_USER_KEYS`，`loadData` 讀進 `_currentData`（常駐 `onChanged` 只合併已有的 key）。
- 不主動清理。項目改名、刪除後殘留的名稱會被第 1 條略過，回到自動歸類。清掉自訂權重（回 Canvas 權重）後，這個 key 用不到，但留著無害。

### 權重來源（計算器與圓餅一致）

`DueGradeCalc.weightMode(course, groups, customWeights)` 是單一真相來源，規則與 `renderWeightPie` 相同：

- `customWeights[cid]` 是陣列 → 總和 > 0 → `custom`；總和 0 或空陣列 → `none`（使用者明確覆寫成「不顯示權重」）。
- 否則 Canvas 實際加權（`apply_assignment_group_weights !== false` 且有 `group_weight > 0`）→ `canvas`。
- 否則 `none`。

`dashboard.courseUsesGroupWeights` 改成委派 `DueGradeCalc.usesGroupWeights`。

### 計算（不變的部分抽成純函式）

- `effectiveScore(a, scores)`：已免除 → 不計；`scores` 有自己的 key → `null`＝清空過、數字照用；否則用 Canvas `submission.score`；負數或非有限數 → 不計。與現行三態完全相同。
- 只算有配分（`points_possible > 0`）的作業。
- 各桶（Canvas group 或自訂項目）：有成績的作業 `Σearned / Σpossible`；總分＝`Σ(桶百分比 × 權重) / Σ(有成績的桶的權重)`。也就是**只算已評分的部分，未評分不當 0 分**，與現行計算器一致。
- 另外回傳 `gradedWeight / totalWeight`（已評分佔總權重多少）與 `unmappedGraded`（未歸類、但有成績的作業數）。
- DOM 計算器即時試算時讀輸入框現值，不存檔也看得到結果：`recalculateGrades` 把「輸入框值」當成 scores 傳給同一個 `compute`，畫面與總覽用同一套數學。

### 計算器 UI

- **出現條件**改成 `weightMode !== 'none'`，而且至少有一項有配分的作業。
- **Canvas 模式**：外觀與行為不變。
- **自訂模式**：
  - 依權重項目分組，順序同圓餅。組頭寫「名稱 · 權重%」和小計。沒有任何作業的項目（例如 Participation 不在 Canvas 上）照樣列出組頭、小計 `—`，看得出這部分還沒算進去。
  - 每列在分數框左邊多一個小下拉 `.grade-calc-map`（DM Mono 11px、`--mid`、無框，hover／focus 才出框線），選項是各權重項目加「不計入」。改了就寫 `gradeItemMap`，計算器當場重畫（保留展開與捲動），總分跟著變。
  - 最下面一區「未計入」：列出未歸類（下拉顯示「未歸類」）與手動設為不計入的作業，區頭附一句「沒對上權重項目，不算進總分；用下拉指定」。沒有這類作業時不顯示這一區。
- 權重編輯器存檔或還原後，`refreshWeightPanel` 除了換左欄圓餅，也換右欄計算器（`refreshGradeCalc`，保留展開狀態與焦點以外的版面）。原本「計算器不吃自訂權重，所以不用動」的註解作廢。

## 判斷點 2：學期總覽放哪裡、怎麼呈現

決策 3 的用意是：每天看待辦的時候不要被分數干擾。總覽**不能**塞進學期待辦或課程 grid。候選做法：

| 做法 | 問題 |
|---|---|
| 課程 grid 卡片加分數 | 直接違反決策 3 |
| 第三個頁面（與學期待辦／課程並列的 slide page） | `page-slider` 寫死兩頁，歷史紀錄、`showSubmitted`、`+ 新增作業`、計數都綁兩頁；「已繳交」過濾套在成績頁上也沒有意義。動到的地方多，收益卻只是換一個容器 |
| 設定選單裡一項 | 找不到，而且成績不是設定 |

**推薦：側欄主導航加一個「成績」入口，點開的是 modal「學期成績」，不是頁面。**

- 入口 `#nav-grades` 放在 `.side-nav` 第四顆（已繳交下面），沒有計數、不會 active，`aria-haspopup="dialog"`。主動點了才看到分數，符合決策 3 的「獨立入口」。
- modal `#grades-overlay` 共用現有 modal 機制：`MODAL_OVERLAY_IDS`（開著時不自動刷新）、Esc `closers`、`setupModalA11y`、`trackBackdropPress`／`isBackdropClick`。
- 內容：每門課一列（依課程代碼排序，順序穩定，不跟著截止日跳）。
  - 左：課程代碼（DM Mono）＋課程名稱（支援自訂名稱）；下方一行小字：權重來源（`Canvas 設定`／`AI 分析`／`自訂`）。有未歸類但已評分的作業時，接「· N 項未歸類」。
  - 右：目前加權分數（DM Mono，大一號）；下方「已評分 45%」＋一條 2px 細條表示已評分佔比。95% 的分數只建立在 10% 的權重上時，一眼看得出來。
  - 沒有權重：分數 `—`，小字「沒有評分比重」；有權重但沒成績：`—`、「尚無成績」。
  - 整列是按鈕：關 modal → `showCourseDetail(cid)`（不帶卡片，同步渲染）→ 展開計算器 accordion。
- 頂端一句說明：「只算已評分的部分，未評分不當 0 分。點課程看明細與試算。」
- **不算學期平均**：Canvas API 拿不到學分，簡單平均會誤導。不做。

## 不做

- Canvas 沒開加權（`apply_assignment_group_weights === false`）、也沒有自訂權重時，Canvas 官方算法是總分／總配分。但這類課的真實權重通常在大綱裡，用總配分算會誤導，所以維持「沒有評分比重」，等 AI 或使用者補權重。
- 不做 drop lowest、extra credit group 等 Canvas 進階規則（現行計算器也沒有）。
- 不做學分加權的 GPA。
- 不在 popup 顯示分數。

## 驗收

- 單元測試（`extension/dashboard/gradeCalc.test.js`）：關鍵字與正規化、`matchItem` 五層（含手動指定名稱已不存在、手動 `null`、平手→未歸類、Assignments 組裝期中考）、`effectiveScore` 三態／免除／負分、`weightMode` 三種（含空陣列、加權開關關掉）、`courseGrade` 的分數、覆蓋率與 `unmappedGraded`。
- harness：
  - Canvas 加權的課計算器與改版前數字相同。
  - 一門 Canvas 沒開加權、AI 寫了權重的課：計算器出現，作業依名稱自動歸到各項，對不上的進「未計入」；用下拉改歸類後總分即時變化，重整後仍在。
  - 在權重編輯器改權重存檔，計算器的組頭與總分跟著換，accordion 保持展開。
  - 側欄「成績」開出 modal，各課分數與各自計算器總分相同；點一列進該課詳情、計算器已展開；Esc／點背景關閉，焦點回到入口。
  - 學期待辦、課程 grid、作業列仍然看不到任何分數。
- 三語（zh-TW／zh-CN／en）字串齊備，切語言後 modal 與計算器文字跟著換。
- 全部單元測試綠。

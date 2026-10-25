#!/usr/bin/env python3
"""重建 extension/dashboard/schools.json（空狀態「選擇你的學校」的清單）。

資料來源：Canvas 官方「找學校」公開 API（canvas.instructure.com/api/v1/accounts/search，CORS 全開、免登入）。
只留 Due 目前支援的 *.instructure.com 網域（規則同 background.js 的 isCanvasHost）；
同一個網域有多個登入入口（Parents／SSO…）只留一個名字。輸出 [[subdomain, name], ...]，依名稱排序。

用法：python3 scripts/build-schools.py [rows.json]
  不帶參數＝從 API 抓（約 110 頁，偶爾會回空 body，所以有重試）；帶 rows.json＝用先前存下的原始回應重跑過濾
"""
import json, re, subprocess, sys, time

API = 'https://canvas.instructure.com/api/v1/accounts/search?per_page=100&page={}'
NON_CANVAS = {'www', 'status', 'community', 'support', 'info'}
JUNK = re.compile(r'\b(test|sandbox|demo|training|dap|template|trial)\b', re.I)
SECONDARY = re.compile(r'(parent|guardian|observer|staff only|employee)', re.I)


def fetch(page):
    for _ in range(8):
        r = subprocess.run(['curl', '-s', '--max-time', '30', API.format(page)], capture_output=True)
        try:
            return json.loads(r.stdout)
        except ValueError:
            time.sleep(2)
    sys.exit(f'page {page} failed')


rows, page = [], 1
if len(sys.argv) > 1:
    rows = json.load(open(sys.argv[1]))
else:
    while True:
        d = fetch(page)
        if not d:
            break
        rows += d
        page += 1

best = {}
for a in rows:
    dom = (a.get('domain') or '').lower()
    name = re.sub(r'\s+', ' ', (a.get('name') or '')).strip()
    if not dom.endswith('.instructure.com') or not name or JUNK.search(name) or not name[0].isalpha():   # 數字／符號開頭的多半是內部測試帳號
        continue
    labels = dom.split('.')[:-2]
    if not labels or labels[0] in NON_CANVAS or any(l in ('beta', 'test') for l in labels):
        continue
    sub = '.'.join(labels)
    key = (bool(SECONDARY.search(name)), len(name))   # 先避開 Parents 之類，再取最短
    if sub not in best or key < best[sub][0]:
        best[sub] = (key, name)

out = sorted(([s, n] for s, (_, n) in best.items()), key=lambda x: x[1].lower())
with open('extension/dashboard/schools.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print(len(out), 'schools')

# -*- coding: utf-8 -*-
"""构建离线搜索索引 mirror/search-index.json
数据源：
- 4 个 React 科目：课程架构数据.json → 各册 dataPath → course-data/books/*.json 的 currentCardMapping
- chemistry：从 Vite 产物 app-*.js 提取导航模块（标签 + view key）
条目字段：s=科目 st=学段 b=册 t=标题 m=摘要行 h=检索用全文 u=跳转 URL
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "mirror"
SUBJECTS = ["biology", "math", "geography", "chinese"]
STAGE_LABEL = {"junior": "初中", "senior": "高中"}
SUBJECT_LABEL = {"biology": "生物", "math": "数学", "geography": "地理", "chinese": "语文", "chemistry": "化学"}

items = []


def add(subject, stage, book, title, meta, hay, url):
    items.append({
        "s": subject, "st": stage or "", "b": book or "",
        "t": title, "m": meta, "h": hay, "u": url,
    })


for s in SUBJECTS:
    base = ROOT / "subjects" / s
    arch = base / "课程架构数据.json"
    if not arch.exists():
        print(f"[skip] {s}: 无 课程架构数据.json")
        continue
    d = json.loads(arch.read_text(encoding="utf-8"))
    n = 0
    for stage in d.get("stages", []):
        sid = stage.get("id", "")
        for book in stage.get("books", []):
            data_path = book.get("dataPath", "")
            if not data_path:
                continue
            f = base / data_path.lstrip("./")
            if not f.exists():
                continue
            try:
                bd = json.loads(f.read_text(encoding="utf-8"))
            except Exception as e:
                print(f"[warn] {s}: {f.name} 解析失败 {e}")
                continue
            for c in bd.get("currentCardMapping", []):
                title = str(c.get("title", "")).strip()
                if not title:
                    continue
                detail = str(c.get("detail", "")).strip()
                points = " / ".join(c.get("points", []) or [])
                tags = " ".join(c.get("tags", []) or [])
                hay = " ".join([title, detail, points, tags, book.get("label", ""), STAGE_LABEL.get(sid, "")])
                meta_bits = [STAGE_LABEL.get(sid, ""), book.get("label", ""), points[:40]]
                meta = " · ".join(x for x in meta_bits if x)
                add(s, sid, book.get("label", ""), title, meta, hay,
                    f"/subjects/{s}/app.html?stage={sid}" if sid else f"/subjects/{s}/app.html")
                n += 1
    print(f"[ok] {s}: {n} 条目")

# chemistry：从 Vite 产物提取导航模块（label + view key）
chem_dir = ROOT / "subjects" / "chemistry" / "assets"
app_js = None
for f in chem_dir.glob("app-*.js"):
    app_js = f
    break
if app_js:
    src = app_js.read_text(encoding="utf-8", errors="replace")
    n = 0
    # 已知导航标签（浏览器实勘），在产物中定位其附近的 view key（形如 xxx-yyy）
    labels = ["元素周期表", "晶体与晶胞", "有机结构", "化学反应沙盒", "杂化轨道",
              "无机图谱", "动态原理", "分析检验", "化学计算", "安全演示"]
    for lb in labels:
        for m in re.finditer(re.escape(lb), src):
            seg = src[max(0, m.start() - 220): m.start() + 220]
            keys = re.findall(r'["\']([a-z][a-z0-9]*(?:-[a-z0-9]+)+)["\']', seg)
            keys = [k for k in keys if k not in ("organic-chemistry",) or lb == "有机结构"]
            view = keys[0] if keys else ""
            url = f"/subjects/chemistry/app.html?view={view}" if view else "/subjects/chemistry/app.html"
            add("chemistry", "", "", lb + "（化学演示）",
                "化学 · 交互演示模块", lb, url)
            n += 1
            break
    print(f"[ok] chemistry: {n} 条目")

out = ROOT / "search-index.json"
out.write_text(json.dumps({"items": items}, ensure_ascii=False), encoding="utf-8")
print(f"[done] 共 {len(items)} 条 -> {out}")

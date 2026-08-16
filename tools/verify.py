# -*- coding: utf-8 -*-
"""自动化验证（requests 版，规避本机 urllib 批量挂起问题）：
1. 对本地服务器全量请求镜像文件，断言 200 且字节数>0（跳过 .orig 备份）
2. 与源站抽样对比 Content-Length（跳过本任务修改过的文件，避免误报）
生成 verify-report.txt"""
import random
import sys
import urllib.parse
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent / "mirror"
ORIGIN = "https://www.shiguangtongxue.cn"
LOCAL = "http://localhost:8000"

session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0"})


def head(url):
    try:
        r = session.head(url, timeout=(10, 60), allow_redirects=True)
        return r.status_code, int(r.headers.get("Content-Length") or 0), r.headers.get("Content-Type", "")
    except Exception as e:
        return 0, 0, f"{type(e).__name__}: {str(e)[:80]}"


files = [f.relative_to(ROOT).as_posix() for f in ROOT.rglob("*")
         if f.is_file() and not f.name.endswith(".orig")]
print(f"本地镜像文件总数: {len(files)}", flush=True)

missing, mime_bad = [], []
MIME_MAP = {".wasm": "application/wasm", ".glb": "model/gltf-binary", ".woff2": "font/woff2"}
for i, rel in enumerate(files):
    status, size, ctype = head(LOCAL + "/" + urllib.parse.quote(rel))
    if status != 200 or size == 0:
        missing.append(f"{rel} -> {status} {size}")
        continue
    ext = Path(rel).suffix.lower()
    if ext in MIME_MAP and MIME_MAP[ext] not in (ctype or ""):
        mime_bad.append(f"{rel} -> {ctype}")
    if (i + 1) % 1000 == 0:
        print(f"  checked {i + 1}/{len(files)}", flush=True)

# 与源站抽样对比（排除本任务有意修改/新增的文件）
MODIFIED_MARKERS = ("powertech-ui.js", "index.html", "disclaimer.html", "search-index.json", "app.html", "stage-selector.html")
random.seed(42)
sample = random.sample(files, min(80, len(files)))
size_mismatch = []
for rel in sample:
    if any(m in rel for m in MODIFIED_MARKERS):
        continue
    local_file = ROOT / rel
    try:
        if b"PowerTech" in local_file.read_bytes()[:200_000]:
            continue  # 品牌替换/补丁触碰过的文件，与源站字节本就不同
    except OSError:
        pass
    s1, sz1, _ = head(LOCAL + "/" + urllib.parse.quote(rel))
    s2, sz2, _ = head(ORIGIN + "/" + urllib.parse.quote(rel))
    if s2 == 200 and s1 == 200 and sz1 and sz2 and sz1 != sz2:
        size_mismatch.append(f"{rel}: local={sz1} origin={sz2}")
    print(f"  抽样 {rel.split('/')[-1]}: {s1}/{s2}", flush=True)

report = ROOT.parent / "verify-report.txt"
lines = [
    f"验证报告 @ {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}",
    f"文件总数: {len(files)}  缺失/异常: {len(missing)}  MIME错误: {len(mime_bad)}  抽样大小不一致: {len(size_mismatch)}",
    "",
]
lines += [f"MISS {x}" for x in missing[:200]]
lines += [f"MIME {x}" for x in mime_bad[:100]]
lines += [f"SIZE {x}" for x in size_mismatch[:100]]
report.write_text("\n".join(lines), encoding="utf-8")
print(f"缺失 {len(missing)} | MIME {len(mime_bad)} | 大小不一致 {len(size_mismatch)}", flush=True)
print(f"报告 -> {report}", flush=True)
sys.exit(0 if not missing and not size_mismatch else 1)

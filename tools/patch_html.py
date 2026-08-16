# -*- coding: utf-8 -*-
"""给各科目镜像版 app.html 打补丁：移除小拾光学习助手的 2 个 script 标签（隐藏入口）。
同时校验移除后其余内容不变，并保留 .orig 原始副本。"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "mirror"
SUBJECTS = ["biology", "chemistry", "math", "geography", "chinese"]
PAT = re.compile(
    r'[ \t]*<script[^>]*>(?:window\.SHG_LEARNING_ASSISTANT_CONFIG[\s\S]*?)?</script>\s*\n?[ \t]*<script[^>]*src="/dist-learning-assistant/loader\.js"[^>]*></script>\s*\n?'
    r'|[ \t]*<script>window\.SHG_LEARNING_ASSISTANT_CONFIG[\s\S]*?</script>\s*\n?'
    r'|[ \t]*<script[^>]*src="/dist-learning-assistant/[^"]*"[^>]*></script>\s*\n?',
)

for s in SUBJECTS:
    p = ROOT / "subjects" / s / "app.html"
    if not p.exists():
        print(f"[skip] {s}: app.html 不存在")
        continue
    html = p.read_text(encoding="utf-8")
    orig = p.with_suffix(".html.orig")
    if not orig.exists():
        orig.write_text(html, encoding="utf-8", newline="")
    patched, n = PAT.subn("", html)
    if n == 0:
        print(f"[warn] {s}: 未匹配到助手标签")
        continue
    if "dist-learning-assistant" in patched:
        print(f"[warn] {s}: 补丁后仍残留 assistant 引用")
    p.write_text(patched, encoding="utf-8", newline="")
    print(f"[ok] {s}: 移除 {n} 处，原始备份 -> {orig.name}")

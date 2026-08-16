# -*- coding: utf-8 -*-
"""清理爬取器因 SPA 兜底壳(200 假 HTML)产生的垃圾文件：
1. 内容含兜底壳标记的文件
2. 路径中含连续重复目录段的文件
3. 下载不完整的 0 字节文件
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent / "mirror"
MARK = b"Biology Entry Demo"
removed, freed = 0, 0

for f in ROOT.rglob("*"):
    if not f.is_file():
        continue
    # 0 字节
    if f.stat().st_size == 0:
        f.unlink()
        removed += 1
        continue
    # 路径连续重复段（如 a/a/）
    parts = f.relative_to(ROOT).parts
    dup = any(parts[i] == parts[i + 1] for i in range(len(parts) - 1))
    if dup:
        freed += f.stat().st_size
        f.unlink()
        removed += 1
        continue
    # 兜底壳内容（仅检查小文件前 2KB，二进制大文件跳过）
    if f.stat().st_size < 100_000:
        try:
            if MARK in f.read_bytes()[:2048]:
                freed += f.stat().st_size
                f.unlink()
                removed += 1
                continue
        except OSError:
            pass

# 清理空目录
for d in sorted((p for p in ROOT.rglob("*") if p.is_dir()), reverse=True):
    try:
        next(d.iterdir())
    except StopIteration:
        d.rmdir()

print(f"removed={removed} freed={freed/1048576:.1f}MB")
rest = sum(1 for _ in ROOT.rglob("*") if _.is_file())
print(f"remaining files={rest}")

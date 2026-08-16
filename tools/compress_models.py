# -*- coding: utf-8 -*-
"""批量 Draco 压缩 GLB 模型（部署瘦身）。

流程：
1. 备份原始 GLB 到项目根 models-backup/（保留相对目录结构，幂等：已有备份跳过）
2. 用 tools/gltf-tools 的 @gltf-transform/cli 逐文件压缩（4 进程并行）
3. 校验输出含 KHR_draco_mesh_compression 且体积变小后原子替换原文件
4. 失败文件跳过并记录；汇总报告写 compress-report.txt

用法：
    python tools\\compress_models.py
"""
import concurrent.futures
import os
import shutil
import struct
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIRROR = ROOT / "mirror"
BACKUP = ROOT / "models-backup"
CLI = ROOT / "tools" / "gltf-tools" / "node_modules" / ".bin" / "gltf-transform.cmd"
REPORT = ROOT / "compress-report.txt"
WORKERS = 4


def has_draco(path):
    try:
        with open(path, "rb") as fh:
            head = fh.read(4)
            if head != b"glTF":
                return False
            fh.read(8)
            clen = struct.unpack("<I", fh.read(4))[0]
            return b"KHR_draco_mesh_compression" in fh.read(clen)
    except Exception:
        return False


def process(glb):
    rel = glb.relative_to(MIRROR)
    orig = glb.stat().st_size
    bak = BACKUP / rel
    tmp = glb.with_name(glb.name.replace(".glb", ".draco-tmp.glb"))
    try:
        if not bak.exists():
            bak.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(glb, bak)
        if tmp.exists():
            tmp.unlink()
        r = subprocess.run(
            [str(CLI), "draco", str(glb), str(tmp)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=1800,
        )
        if r.returncode != 0 or not tmp.exists():
            raise RuntimeError((r.stderr or r.stdout or "").strip()[-300:])
        if not has_draco(tmp):
            raise RuntimeError("输出缺少 KHR_draco_mesh_compression")
        newsize = tmp.stat().st_size
        if newsize >= orig:
            raise RuntimeError("体积未减小 (%d >= %d)" % (newsize, orig))
        tmp.replace(glb)
        return (rel, orig, newsize, None)
    except Exception as e:
        if tmp.exists():
            try:
                tmp.unlink()
            except OSError:
                pass
        return (rel, orig, None, str(e)[:200])


def main():
    glbs = sorted(g for g in MIRROR.rglob("*.glb") if ".draco-tmp" not in g.name)
    print("发现 %d 个 GLB（原始 %.1f MB）" % (len(glbs), sum(g.stat().st_size for g in glbs) / 1048576))
    t0 = time.time()
    results = []
    done = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(process, g): g for g in glbs}
        for fut in concurrent.futures.as_completed(futs):
            res = fut.result()
            results.append(res)
            done += 1
            if done % 5 == 0 or done == len(glbs):
                print("[%d/%d] 已用时 %.0fs" % (done, len(glbs), time.time() - t0), flush=True)

    ok = [r for r in results if r[3] is None]
    bad = [r for r in results if r[3] is not None]
    osum = sum(r[1] for r in ok)
    nsum = sum(r[2] for r in ok)
    print("\n===== 汇总 =====")
    print("成功 %d / 失败 %d" % (len(ok), len(bad)))
    print("原始 %.1f MB -> 压缩后 %.1f MB（节省 %.1f MB, %.1f%%）"
          % (osum / 1048576, nsum / 1048576, (osum - nsum) / 1048576,
             (osum - nsum) * 100.0 / osum if osum else 0))
    for rel, o, n, e in bad:
        print("FAIL %s: %s" % (rel, e))
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write("===== 压缩报告 %s =====\n" % time.strftime("%Y-%m-%d %H:%M:%S"))
        for rel, o, n, e in sorted(results, key=lambda x: str(x[0])):
            if e is None:
                fh.write("OK %s: %.1fKB -> %.1fKB\n" % (rel, o / 1024, n / 1024))
            else:
                fh.write("FAIL %s: %s\n" % (rel, e))
    print("报告已写入 %s" % REPORT)


if __name__ == "__main__":
    sys.exit(main())
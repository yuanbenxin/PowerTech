# -*- coding: utf-8 -*-
"""离线 Draco 补丁：
1. 检查 GLB 是否使用 meshopt/KTX2 压缩（决定是否还需要额外解码器）
2. 在 5 个科目 app.html 的 </head> 前注入 ModelViewerElement.dracoDecoderLocation
   指向本地 /draco/1.5.6/（model-viewer 均为动态加载，注入必在其前生效），
   使断网时 Draco 压缩 GLB 也能解码。
"""
import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "mirror"


def check_compression():
    meshopt = ktx2 = draco = 0
    for f in glob.glob(str(ROOT / "**" / "*.glb"), recursive=True):
        with open(f, "rb") as fh:
            head = fh.read(800)
        if b"EXT_meshopt_compression" in head:
            meshopt += 1
        if b"KHR_texture_basisu" in head:
            ktx2 += 1
        if b"draco" in head.lower():
            draco += 1
    print(f"GLB 压缩统计: draco={draco} meshopt={meshopt} ktx2={ktx2}")


INJECT = (
    "<script>window.ModelViewerElement=window.ModelViewerElement||{};"
    'window.ModelViewerElement.dracoDecoderLocation="/draco/1.5.6/";</script>\n</head>'
)


def patch_html():
    for s in ["biology", "chemistry", "math", "geography", "chinese"]:
        p = ROOT / "subjects" / s / "app.html"
        if not p.exists():
            print(f"[skip] {s}: app.html 不存在")
            continue
        html = p.read_text(encoding="utf-8")
        if "dracoDecoderLocation" in html:
            print(f"[ok] {s}: 已有补丁")
            continue
        if "</head>" not in html:
            print(f"[warn] {s}: 无 </head>")
            continue
        p.write_text(html.replace("</head>", INJECT, 1), encoding="utf-8", newline="")
        print(f"[ok] {s}: 已注入 draco 本地解码配置")


if __name__ == "__main__":
    check_compression()
    patch_html()

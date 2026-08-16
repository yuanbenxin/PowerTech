# -*- coding: utf-8 -*-
"""构建可部署的 Netlify 版本（deploy/ 目录）。

流程：
1. 重建 deploy/：从 mirror/ 完整复制（排除 *.orig 备份文件）
2. 打认证补丁：5 份 shg-subject-auth-gate.js 恒走本地预览身份，公网不再请求 /api/unified
3. 生成 netlify.toml（/api/* 返回 404；/subjects/* 限流 60 次/60 秒/每 IP）
4. 生成 _headers（模型/媒体 30 天缓存；HTML/JS/CSS/JSON 不缓存）
5. 生成 404.html 与 README-DEPLOY.md
6. 校验：无 .orig 残留、认证补丁全部生效、GLB 压缩统计、deploy 体积

用法：
    python tools\\build_deploy.py
"""
import shutil
import struct
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIRROR = ROOT / "mirror"
DEPLOY = ROOT / "deploy"
MARKER = ".deploy-root"

AUTH_PATCH_OLD = """    function shouldBypass() {
        const protocol = String(window.location.protocol || '').toLowerCase();
        const hostname = String(window.location.hostname || '').trim().toLowerCase();
        const isLocalPreviewOrigin = protocol === 'file:' || isPrivatePreviewHost(hostname);
        const params = new URLSearchParams(window.location.search || '');
        const mode = String(params.get('subjectAuth') || '').trim().toLowerCase();
        if (mode === 'on') return false;
        // A query parameter must never disable authentication on a LAN or public origin.
        if (mode === 'off') return isLocalPreviewOrigin;
        return isLocalPreviewOrigin;
    }"""

AUTH_PATCH_NEW = """    function shouldBypass() {
        // 公网部署补丁：始终使用本地预览身份，不再请求统一权限 API。
        return true;
    }"""

NETLIFY_TOML = """# PowerTech 在线教学演示 - Netlify 部署配置

# 残留的统一权限 API 一律返回 404（站点为纯静态）
[[redirects]]
  from = "/api/*"
  to = "/404.html"
  status = 404

# 学科资源走 CDN 缓存并限流：每 IP 每 60 秒最多 60 次请求，超限返回 429
[[redirects]]
  from = "/subjects/*"
  to = "/subjects/:splat"
  status = 200

[redirects.rate_limit]
  action = "rate_limit"
  window_limit = 60
  window_size = 60
  aggregate_by = ["ip", "domain"]
"""

HEADERS = """# 模型/媒体等大资源：浏览器本地缓存 30 天，回访不再重复下载（省流量）
/*.glb
/*.mp4
/*.png
/*.jpg
/*.jpeg
/*.webp
/*.gif
/*.svg
/*.wasm
/*.woff
/*.woff2
  Cache-Control: public, max-age=2592000

# 代码与内容：不缓存，重新部署立即生效
/*.html
/*.js
/*.css
/*.json
  Cache-Control: no-cache, must-revalidate
"""

PAGE_404 = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>页面不存在 - PowerTech 在线教学演示</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f7fa;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#333}
  .box{text-align:center;padding:48px}
  h1{font-size:72px;margin:0;color:#4f6ef2}
  p{font-size:16px;color:#666}
  a{display:inline-block;margin-top:24px;padding:10px 28px;background:#4f6ef2;color:#fff;border-radius:8px;text-decoration:none}
</style>
</head>
<body>
<div class="box">
  <h1>404</h1>
  <p>您访问的页面不存在或已被移除。</p>
  <a href="/">返回首页</a>
</div>
</body>
</html>
"""

README_DEPLOY = """# deploy/ — Netlify 可部署版本

本目录由 `python tools\\build_deploy.py` 从 `mirror/` 生成，**不要手动改**（每次重建会整体覆盖）。
生成内容包括：静态资源副本（排除 `*.orig` 备份）、认证补丁、`netlify.toml`、`_headers`、`404.html`。
本目录已在 `.gitignore` 中，不会提交到 GitHub。

## 部署步骤（CI 自动）

构建与部署全流程由 GitHub Actions 完成（`.github/workflows/deploy.yml`）：

1. 本地修改源码后 `git push` 到 `main` 分支（或 Actions 手动触发）；
2. Actions 运行 `python tools/build_deploy.py` 生成 `deploy/`；
3. Actions 用 `netlify-cli deploy --prod --dir deploy --site <site_id>`
   把构建产物直接推送到 Netlify（API 部署，不触发站点构建，不消耗 credits）。

前置条件：仓库 Secrets 已配置 `NETLIFY_AUTH_TOKEN`；Netlify 站点的 GitHub 自动构建已断开。

## 手动回退部署（可选）

```powershell
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir deploy --site 975c8089-f9c0-410a-bd5b-3ee182920527
```

## 本版本的差异（相对本地镜像）

| 项 | 说明 |
|----|------|
| 认证 | 公网**免登录**：5 份 `shg-subject-auth-gate.js` 的 `shouldBypass()` 恒为 true，直接注入本地预览教师身份；不再请求 `/api/unified/*`（该路径在 netlify.toml 中一律 404）。`?subjectAuth=on/off` 参数已失效。 |
| 3D 模型 | 86 个 GLB 中 80 个已用 Draco 压缩（~46% 体积节省）；chloroplast 系列等 6 个原本接近最优，保留原样。浏览器端由 model-viewer（生物）与地理引擎补丁（three.js GLTFLoader + DRACOLoader）本地解码，解码器位于 `/draco/1.5.6/`。 |
| 限流 | `/subjects/*` 每 IP 每 60 秒最多 60 次请求，超限返回 429。调整：改 `deploy/netlify.toml` 中 `[redirects.rate_limit]`（window_limit/window_size）后重新部署。 |
| 缓存 | 模型/图片/视频 30 天本地缓存（回访不再下载）；HTML/JS/CSS/JSON 不缓存（改版立即生效）。改模型后想立刻让访客看到新版，需等缓存过期或改文件名。 |

## 体积与带宽

- deploy 全量约 **1.8 GB**（GLB 由 973 MB 压至 525 MB）。
- Netlify 免费版带宽约 15 GB/月（300 credits）：80 MB 的呼吸系统模型一次完整下载约 2 credits；30 天本地缓存可显著降低回访流量。

## 本地模型验证

- 起服务：`server\\start.ps1`（或 `python server\\serve.py`），浏览器检查生物（model-viewer）与地理（three.js）的 3D 模块。
- 压缩失败/回退：原始 GLB 全量备份在 `models-backup/`（相对路径与原文件一致），需要还原时直接复制覆盖 `mirror/` 对应文件，然后重建 deploy。
- 重新压缩：`python tools\\compress_models.py`（幂等，可重复运行）。

## 本地开发不受影响

mirror/ 与本地认证门保持原样（localhost 自动本地预览），deploy/ 只影响线上。
"""


def has_draco(path):
    try:
        with open(path, "rb") as fh:
            if fh.read(4) != b"glTF":
                return False
            fh.read(8)
            clen = struct.unpack("<I", fh.read(4))[0]
            return b"KHR_draco_mesh_compression" in fh.read(clen)
    except Exception:
        return False


def patch_auth_gate(path):
    text = path.read_text(encoding="utf-8")
    count = text.count(AUTH_PATCH_OLD)
    if count == 0:
        if AUTH_PATCH_NEW.strip() in text:
            return "already-patched"
        raise RuntimeError("未找到补丁锚点: %s" % path)
    if count != 1:
        raise RuntimeError("补丁锚点出现 %d 次（异常）: %s" % (count, path))
    path.write_text(text.replace(AUTH_PATCH_OLD, AUTH_PATCH_NEW), encoding="utf-8")
    return "patched"


def main():
    t0 = time.time()
    if DEPLOY.exists():
        if not (DEPLOY / MARKER).is_file():
            raise SystemExit("deploy/ 已存在但不是本脚本产物（缺少 %s 标记），拒绝覆盖" % MARKER)
        shutil.rmtree(DEPLOY)
    DEPLOY.mkdir(parents=True)

    print("复制 mirror -> deploy（排除 *.orig）...", flush=True)
    shutil.copytree(MIRROR, DEPLOY, ignore=shutil.ignore_patterns("*.orig"), dirs_exist_ok=True)
    (DEPLOY / MARKER).write_text(time.strftime("%Y-%m-%d %H:%M:%S"), encoding="utf-8")

    print("打认证补丁...", flush=True)
    gates = sorted(DEPLOY.glob("subjects/*/shg-subject-auth-gate.js"))
    for gate in gates:
        print("  %s: %s" % (gate.relative_to(DEPLOY), patch_auth_gate(gate)))

    print("写 netlify.toml / _headers / 404.html / README-DEPLOY.md ...", flush=True)
    (DEPLOY / "netlify.toml").write_text(NETLIFY_TOML, encoding="utf-8")
    (DEPLOY / "_headers").write_text(HEADERS, encoding="utf-8")
    (DEPLOY / "404.html").write_text(PAGE_404, encoding="utf-8")
    (DEPLOY / "README-DEPLOY.md").write_text(README_DEPLOY, encoding="utf-8")

    print("\n===== 校验 =====", flush=True)
    origs = list(DEPLOY.rglob("*.orig"))
    print("*.orig 残留: %d（应为 0）" % len(origs))
    unpatched = [g for g in gates if "公网部署补丁" not in g.read_text(encoding="utf-8")]
    print("认证补丁未生效: %d（应为 0）" % len(unpatched))
    glbs = list(DEPLOY.rglob("*.glb"))
    compressed = [g for g in glbs if has_draco(g)]
    total = sum(g.stat().st_size for g in glbs) / 1048576
    print("GLB: %d 个 / %.1f MB，其中 Draco 压缩 %d 个" % (len(glbs), total, len(compressed)))
    size = sum(p.stat().st_size for p in DEPLOY.rglob("*") if p.is_file()) / 1048576
    files = sum(1 for p in DEPLOY.rglob("*") if p.is_file())
    print("deploy 体积: %.1f MB，%d 个文件，用时 %.0fs" % (size, files, time.time() - t0))
    if origs or unpatched:
        raise SystemExit("校验失败")
    print("\n完成。部署命令：netlify deploy --prod --dir deploy")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地镜像静态文件服务器（仅标准库，Windows / Python 3）。

用法：
    python serve.py                                  # 默认端口 8000，根目录 ../mirror
    python serve.py --port 8080                      # 自定义端口
    python serve.py --root d:\\DevData\\SmartTeach\\mirror  # 自定义镜像根目录

特性：
- 中文文件名（percent-decode）支持，如 /subjects/biology/课程架构数据.json
- 路径穿越防护（normalize 后必须仍在 root 内）
- 目录请求自动尝试 index.html
- 单段 Range 请求（206 + Content-Range），便于 model-viewer / 视频流式加载
- ETag（mtime+size 十六进制）与 If-None-Match -> 304
- /api/ 开头的请求统一返回 404（本地镜像无后端），并打印一行日志
- 根路径返回内置导航页，列出各科目入口链接
"""

import argparse
import mimetypes
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

# ---------------------------------------------------------------------------
# 自定义 MIME 映射（优先于 mimetypes 内置表，未命中再用 guess_type 兜底）
# ---------------------------------------------------------------------------
MIME_OVERRIDES = {
    ".wasm": "application/wasm",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".mjs": "text/javascript",
    ".js": "text/javascript",
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webp": "image/webp",
}

# Range 头解析：仅支持 bytes=start-end / bytes=start- / bytes=-suffix 单段
_RANGE_RE = re.compile(r"^bytes=(\d*)-(\d*)$")

# 根路径导航页（HTML）
INDEX_PAGE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>本地镜像 · 学科导航</title>
<style>
  body { margin:0; background:#f4f6f9; font-family:system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif; color:#243b53; }
  .wrap { max-width:680px; margin:48px auto 64px; padding:0 20px; }
  h1 { font-size:22px; margin:0 0 6px; }
  .tip { color:#6b7a90; font-size:14px; margin:0 0 24px; }
  ul { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
  a.card { display:block; padding:14px 18px; background:#fff; border:1px solid #e1e7ef; border-radius:10px; text-decoration:none; transition:border-color .15s, box-shadow .15s; }
  a.card:hover { border-color:#2f6fed; box-shadow:0 4px 14px rgba(47,111,237,.14); }
  .name { color:#2f6fed; font-size:16px; font-weight:600; }
  .path { color:#8494ab; font-size:12px; margin-top:3px; word-break:break-all; }
</style>
</head>
<body>
<div class="wrap">
  <h1>本地镜像站点</h1>
  <p class="tip">由 server/serve.py 托管，仅供本地调试使用</p>
  <ul>
    <li><a class="card" href="/subjects/biology/app.html?stage=senior"><div class="name">生物 · 高中</div><div class="path">/subjects/biology/app.html?stage=senior</div></a></li>
    <li><a class="card" href="/subjects/biology/app.html?stage=junior"><div class="name">生物 · 初中</div><div class="path">/subjects/biology/app.html?stage=junior</div></a></li>
    <li><a class="card" href="/subjects/chemistry/app.html"><div class="name">化学</div><div class="path">/subjects/chemistry/app.html</div></a></li>
    <li><a class="card" href="/subjects/math/app.html"><div class="name">数学</div><div class="path">/subjects/math/app.html</div></a></li>
    <li><a class="card" href="/subjects/geography/app.html"><div class="name">地理</div><div class="path">/subjects/geography/app.html</div></a></li>
    <li><a class="card" href="/subjects/chinese/app.html"><div class="name">语文</div><div class="path">/subjects/chinese/app.html</div></a></li>
  </ul>
</div>
</body>
</html>
"""


class MirrorRequestHandler(BaseHTTPRequestHandler):
    """静态文件请求处理器：路径安全解析 + ETag/304 + 单段 Range。"""

    server_version = "LocalMirror/1.0"
    protocol_version = "HTTP/1.1"  # 启用 keep-alive（需保证 Content-Length 正确）

    # 镜像根目录，默认为脚本同级 ../mirror，可由 main() 覆盖
    root_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mirror"))

    # ------------------------------------------------------------------ 工具

    def _guess_type(self, fs_path):
        """根据扩展名返回 Content-Type；自定义表优先，未命中用 mimetypes 兜底。"""
        ext = os.path.splitext(fs_path)[1].lower()
        if ext in MIME_OVERRIDES:
            return MIME_OVERRIDES[ext]
        guessed = mimetypes.guess_type(fs_path)[0]
        return guessed if guessed else "application/octet-stream"

    def _resolve_fs_path(self, url_path):
        """
        将（已 percent-decode 的）URL 路径映射为 root 内的文件系统绝对路径。
        返回 None 表示路径非法（含 .. 或越出 root），应返回 403。
        """
        parts = []
        # 统一按 "/" 拆分（同时防住反斜杠形式），逐段过滤，拒绝 ".." 防止穿越
        for seg in url_path.replace("\\", "/").split("/"):
            if seg in ("", "."):
                continue
            if seg == "..":
                return None
            parts.append(seg)
        root_abs = os.path.abspath(self.root_dir)
        fs_path = os.path.normpath(os.path.join(root_abs, *parts))
        # 双保险：normalize 后必须仍位于 root 内（同时防住盘符绝对路径注入）
        if fs_path != root_abs and not fs_path.startswith(root_abs + os.sep):
            return None
        return fs_path

    def _etag_of(self, st):
        """ETag：mtime 与 size 的十六进制组合（带引号）。"""
        return '"%x-%x"' % (int(st.st_mtime), st.st_size)

    def _etag_match(self, etag):
        """检查请求头 If-None-Match 是否命中（弱比较，兼容 W/ 前缀与 *）。"""
        header = self.headers.get("If-None-Match")
        if not header:
            return False
        if header.strip() == "*":
            return True
        for item in header.split(","):
            item = item.strip()
            if item.startswith("W/"):
                item = item[2:]
            if item == etag:
                return True
        return False

    def _parse_range(self, header, size):
        """
        解析单段 Range 头。
        返回 (start, end) 闭区间；返回 None 表示忽略该头（回退 200 全量）；
        返回 "invalid" 表示范围不满足（416）。
        """
        m = _RANGE_RE.match(header.strip())
        if not m:
            return None  # 多段区间等不支持的格式：忽略，按全量返回
        start_s, end_s = m.group(1), m.group(2)
        if start_s == "" and end_s == "":
            return None
        if start_s == "":  # bytes=-N：最后 N 字节
            n = int(end_s)
            if n == 0 or size == 0:
                return "invalid"
            return (max(0, size - n), size - 1)
        start = int(start_s)
        if start >= size:
            return "invalid"
        end = size - 1 if end_s == "" else min(int(end_s), size - 1)
        if start > end:
            return None  # 语法无效：忽略
        return (start, end)

    # ------------------------------------------------------------------ 响应

    def _send_bytes(self, status, body, content_type):
        """发送完整的小响应（导航页 / JSON / 错误页）。"""
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _send_error_page(self, status, text):
        """发送简单的中文错误页。"""
        body = (
            '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">'
            "<title>%d %s</title></head><body>"
            '<h1>%d</h1><p>%s</p></body></html>' % (status, text, status, text)
        ).encode("utf-8")
        self._send_bytes(status, body, "text/html; charset=utf-8")

    def _handle_api_disabled(self, url_path):
        """本地镜像无后端：/api/ 请求统一返回 404，并在服务端打印一行日志。"""
        print("[api-disabled] %s %s" % (self.command, url_path), flush=True)
        body = b'{"ok":false,"error":"local mirror: api not available"}'
        self._send_bytes(404, body, "application/json; charset=utf-8")

    def _serve_file(self, fs_path):
        """发送文件内容，支持 ETag/304 协商与单段 Range/206。"""
        try:
            st = os.stat(fs_path)
            f = open(fs_path, "rb")
        except OSError:
            self._send_error_page(404, "Not Found")
            return

        with f:
            size = st.st_size
            etag = self._etag_of(st)

            # 命中缓存协商：返回 304（不带 body）
            if self._etag_match(etag):
                self.send_response(304)
                self.send_header("ETag", etag)
                self.end_headers()
                return

            # 解析可选的 Range 头
            range_header = self.headers.get("Range")
            start, end, partial = 0, max(size - 1, 0), False
            if range_header:
                parsed = self._parse_range(range_header, size)
                if parsed == "invalid":
                    # 范围不满足：416 + Content-Range: bytes */size
                    self.send_response(416)
                    self.send_header("Content-Range", "bytes */%d" % size)
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                if parsed is not None:
                    start, end = parsed
                    partial = True

            length = end - start + 1
            self.send_response(206 if partial else 200)
            self.send_header("Content-Type", self._guess_type(fs_path))
            self.send_header("Content-Length", str(length))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("ETag", etag)
            self.send_header("Cache-Control", "no-cache")  # 允许缓存但每次协商校验
            if partial:
                self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
            self.end_headers()
            if self.command == "HEAD":
                return

            # 分块发送，避免大文件（视频/模型）一次性占用内存
            try:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(65536, remaining))
                    if not chunk:
                        break  # 文件被并发修改/截断，尽力发送已承诺部分
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            except (ConnectionResetError, BrokenPipeError):
                pass  # 客户端提前断开（如视频拖动进度条），无需处理

    # ------------------------------------------------------------------ 分发

    def _dispatch(self):
        """GET / HEAD 公共处理流程。"""
        # 去掉查询串，并对路径做 percent-decode（支持中文文件名）
        url_path = unquote(urlsplit(self.path).path)

        # 根路径：优先返回静态欢迎页（mirror/index.html），否则回退内置导航页
        if url_path == "/":
            welcome = os.path.join(self._resolve_fs_path("/") or "", "index.html")
            if os.path.isfile(welcome):
                self._serve_file(welcome)
            else:
                self._send_bytes(200, INDEX_PAGE.encode("utf-8"), "text/html; charset=utf-8")
            return

        # 本地镜像无后端：/api/ 开头统一返回 404
        if url_path.startswith("/api/"):
            self._handle_api_disabled(url_path)
            return

        # URL -> 文件系统路径（含穿越防护）
        fs_path = self._resolve_fs_path(url_path)
        if fs_path is None:
            self._send_error_page(403, "Forbidden")
            return

        # 目录请求自动尝试 index.html
        if os.path.isdir(fs_path):
            index_path = os.path.join(fs_path, "index.html")
            if os.path.isfile(index_path):
                fs_path = index_path
            else:
                self._send_error_page(404, "Not Found")
                return

        if not os.path.isfile(fs_path):
            self._send_error_page(404, "Not Found")
            return

        self._serve_file(fs_path)

    def do_GET(self):
        self._dispatch()

    def do_HEAD(self):
        self._dispatch()

    def do_POST(self):
        # 本地镜像无后端：/api/ 的 POST 同样统一 404，其余返回 405
        url_path = unquote(urlsplit(self.path).path)
        if url_path.startswith("/api/"):
            self._handle_api_disabled(url_path)
        else:
            self._send_error_page(405, "Method Not Allowed")


def main(argv=None):
    # 默认镜像根目录：脚本同级目录的 ../mirror
    default_root = os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mirror")
    )
    parser = argparse.ArgumentParser(description="本地镜像静态文件服务器（仅标准库）")
    parser.add_argument("--port", type=int, default=8000, help="监听端口（默认 8000）")
    parser.add_argument("--root", default=default_root, help="镜像根目录（默认 ../mirror）")
    args = parser.parse_args(argv)

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print("[warn] 镜像根目录不存在：%s" % root, flush=True)
    MirrorRequestHandler.root_dir = root

    server = ThreadingHTTPServer(("0.0.0.0", args.port), MirrorRequestHandler)
    print("[serve] root : %s" % root, flush=True)
    print("[serve] url  : http://localhost:%d/" % args.port, flush=True)
    print("[serve] 按 Ctrl+C 停止", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[serve] 已停止", flush=True)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

# server/ — 本地开发服务器

本地镜像静态服务器（端口 8000，根目录 `mirror/`），仅标准库实现。

## 启动

Windows PowerShell：

```powershell
.\server\start.ps1          # 端口 8000
.\server\start.ps1 -Port 8080
```

macOS / Linux：

```bash
./server/start.sh           # 端口 8000
./server/start.sh 8080
```

或直接：

```bash
python server/serve.py
```

浏览器打开 **http://localhost:8000/** 进入 PowerTech 欢迎页。

## serve.py 特性

- 中文文件名支持、路径穿越防护
- 目录请求自动尝试 index.html
- 单段 Range 请求（model-viewer / 视频流式加载）
- ETag 与 304 缓存
- `/api/*` 一律返回 404（纯静态镜像）
- 根路径返回导航页

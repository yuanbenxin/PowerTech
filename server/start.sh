#!/usr/bin/env bash
# PowerTech 在线教学演示 - 本地开发服务器启动脚本（macOS / Linux）
# 用法：./server/start.sh [端口]   默认端口 8000
# 启动后浏览器打开 http://localhost:8000/
set -euo pipefail
PORT="${1:-8000}"
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$DIR")"
echo "PowerTech 本地服务器 -> http://localhost:$PORT/"
python3 "$DIR/serve.py" --port "$PORT" --root "$ROOT/mirror"

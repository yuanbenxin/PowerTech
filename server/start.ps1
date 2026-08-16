# -*- coding: utf-8 -*-
"""
PowerTech 在线教学演示 - 本地开发服务器启动脚本（Windows PowerShell）
用法：.\server\start.ps1             # 默认端口 8000
      .\server\start.ps1 -Port 8080  # 自定义端口
启动后浏览器打开 http://localhost:8000/
"""
param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir

Write-Host "PowerTech 本地服务器 -> http://localhost:$Port/" -ForegroundColor Green
python (Join-Path $scriptDir "serve.py") --port $Port --root (Join-Path $root "mirror")

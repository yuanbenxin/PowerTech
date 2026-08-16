# AGENTS.md — 给 AI 代理的项目指南

> 面向接管本仓库的 AI 代理。先读本文件再动手；重要改动前先看
> `HANDOFF.md`（历史交接）与 `.trae/specs/mirror-shiguang-biology-site/spec.md`（架构调研）。

## 1. 项目是什么

**PowerTech 在线教学演示**：5 个学科交互教学系统（biology / math / geography / chinese / chemistry）
的本地离线镜像，并叠加了 PowerTech UI 定制层（浅色主题、全站离线搜索、导航工具栏、化学侧边栏改造等）。

- 全部静态资源位于 `mirror/`，由 `server/serve.py` 托管（端口 8000）。
- 纯静态、无后端：全部资源本地提供，无外部依赖。

## 2. 快速开始

```powershell
cd d:\DevData\SmartTeach
.\server\start.ps1           # 启动本地服务器（等价 python server\serve.py）
```

浏览器打开 **http://localhost:8000/**（PowerTech 欢迎页，选学科进入）。

各学科直达 URL：

| 学科 | 入口 |
|------|------|
| 生物 | http://localhost:8000/subjects/biology/app.html?stage=senior（junior 为初中） |
| 数学 | http://localhost:8000/subjects/math/app.html?stage=senior |
| 地理 | http://localhost:8000/subjects/geography/app.html?stage=senior |
| 语文 | http://localhost:8000/subjects/chinese/app.html |
| 化学 | http://localhost:8000/subjects/chemistry/app.html |

**认证**：`shg-subject-auth-gate.js` 的 `shouldBypass()` 对 localhost / 127.0.0.1 自动注入
"本地预览"身份（教师、全权限），本地无需登录。

## 3. 目录结构（只看关键部分）

```
d:\DevData\SmartTeach\
├── mirror/                          # 站点根（静态资源 + 定制层）★ 源码在此
│   ├── index.html                   # PowerTech 欢迎页（学科入口卡片；页脚版权）
│   ├── powertech-ui.js              # ★ 全站 UI 覆盖层（注入各 app.html / 欢迎页）
│   ├── disclaimer.html              # 重要声明页
│   ├── search-index.json            # 离线搜索索引（build_search_index.py 生成）
│   ├── dist-learning-assistant/     # AI 助手资源（入口已删除，保留文件无妨）
│   ├── draco/1.5.6/                 # Draco WASM 本地化（离线 3D 解码）
│   └── subjects/<subject>/          # 5 科目
│       ├── app.html                 # React SPA 入口（有 .orig 原始备份）
│       ├── <subject>.config.js      # window.__SHG_<SUBJECT>_RUNTIME__（ASSET_MANIFEST 资源清单）
│       ├── app/*.compiled.js        # 应用代码
│       ├── course-data/books/*.json # 各册卡片数据
│       └── visualizations/books/<book>/<module>/  # 每模块一个目录
│           ├── scene.config.json + scene.js       #（或 *-source.bundle.js / source/index.html）
│           └── assets/              # models/*.glb、draco、images
├── server/                          # 本地开发服务器（serve.py + start.ps1 / start.sh）
├── tools/                           # Python 构建/维护工具链（见 §5；爬虫 mirror.py 不入库）
├── .github/workflows/deploy.yml     # ★ CI 部署：构建 deploy/ → 推送到 Netlify
├── .trae/specs/mirror-shiguang-biology-site/
│   ├── spec.md                      # 架构调研结论（改动前建议读；该目录被 gitignore）
│   ├── tasks.md / checklist.md      # 任务与验收清单
├── README.md                        # 用户向说明（启动 + 定制清单 + 部署流程）
├── HANDOFF.md                       # AI 交接（历史坑）
```

> 部署架构：本地改 `mirror/` → `git push` → GitHub Actions 跑 `tools/build_deploy.py`
> 生成 `deploy/` → `netlify-cli` API 推送（Site 975c8089-f9c0-410a-bd5b-3ee182920527）。
> Netlify 只收产物不构建，0 credits；token 走仓库 Secrets `NETLIFY_AUTH_TOKEN`。
> `deploy/`、`models-backup/`、`.trae/`、`tools/mirror.py` 等均在 .gitignore 中。

## 4. 定制层（改 UI 最常动这里）

### mirror/index.html（欢迎页）
- `SUBJECTS` 数组定义 5 个学科卡片（name / desc / color / stages）。
- `render()` 渲染所有卡片，**不做初/高中切换**（页面无切换按钮；卡片内直接列各学段入口链接）。
- 品牌 `<a class="brand" href="/">` 点击回主页。
- 页脚：`©2026-现在 本新同学 All right reserved`。

### mirror/powertech-ui.js（全站覆盖层，注入各 app.html）
单文件 IIFE，职责与关键函数：

| 函数 | 职责 |
|------|------|
| `CSS`（字符串数组） | 注入的覆盖样式：浅色反色滤镜、毛玻璃、平滑滚动、圆角收敛、隐藏残留登录/订阅入口、#pt-nav 样式 |
| `mountToolbar()` / `buildToolbar()` | 顶栏内嵌导航工具栏（搜索 / 关于作者 / 重要声明 / 主题切换），挂不进 header 时浮动右上 |
| `applyTheme()` / `toggleTheme()` | 浅/深色切换（localStorage `shg-theme`）；浅色用 `html.shg-light` + `filter:invert(1) hue-rotate(180deg)` 反色方案，媒体/题库双重反转还原 |
| `loadIndex()` / `doSearch()` / `renderResults()` | 离线全站搜索（读 search-index.json，支持本学科/全站范围） |
| `initBrandHome()` | "PowerTech在线教学演示"品牌点击回到 `/`（全站） |
| `unifyBackButtons()` | "返回列表/返回"按钮统一样式 |
| `posterWatchdog()` | 3D 下载进度条改不定式动画 |
| `propagateIframes()` | 把主题类名传播进 iframe 模拟器 |
| `installChem()` / `chemIconize()` / `chemToggleRaw()` / `chemExpanded()` / `bindChemHover()` | 化学专项：侧栏 emoji→SVG、hover 展开/收起、左下角图钉固定、隐藏自带主题钮、浅色画布衬底 |
| `install()` | 注入 style、挂工具栏、MutationObserver 重挂兜底 + 1s 轮询兜底 |

> 重要：覆盖层是"侵入式"的，靠 `MutationObserver` + 每 1s 轮询兜底，避免 React 重建后丢失。
> 改动后务必在真实页面（5 科目 app.html）验证，而不是只看静态 HTML。

### 主题实现要点
- 浅色 = 全局反色滤镜（`body filter:invert(1) hue-rotate(180deg)`），`body` 底色给深色终值（反转后视觉为浅）。
- 图片 / 视频 / canvas / iframe / model-viewer 需 `filter:invert(1) hue-rotate(180deg)` 二次反转还原。
- 化学 canvas 另给 `background-color:#e9ebee` 浅色衬底。
- 数学题库 `question-bank-visual-v2` 自带米白纸感，双重反转还原原生观感。

## 5. 工具链（tools/ 与 server/）

| 脚本 | 用途 | 何时用 |
|------|------|--------|
| `server/serve.py`（+ `start.ps1` / `start.sh`） | 本地静态服务器（端口 8000，mirror/ 为根） | 日常启动 |
| `build_deploy.py` | 从 mirror/ 生成 deploy/（认证补丁 + netlify.toml + _headers + 404.html + 校验） | CI 部署必跑；本地手动生成 deploy/ |
| `build_search_index.py` | 重建 mirror/search-index.json | 搜索索引变化时 |
| `verify.py` | 全量资源 200 检查 + 抽样比对 → verify-report.txt | 验收/回归 |
| `clean.py` | 清理兜底壳垃圾文件 / 重复目录 / 0 字节文件 | 清理垃圾 |
| `compress_models.py` | GLB Draco 压缩（幂等） | 模型体积优化 |
| `rank_courseware.py` | 调整课程卡片顺序（可演示卡片靠前） | 卡片排序调整 |
| `patch_html.py` | 删除各科目 app.html 的 AI 助手 script（生成 .orig） | 已执行过 |
| `patch_draco.py` | Draco 解码器本地化注入 | 已执行过 |
| `patch_ui.py` | UI 定制补丁（按钮/弹窗删除、进度条、品牌替换、覆盖层注入），幂等 | 已执行过 |
| `mirror.py`（**不入库**，.gitignore） | 递归爬虫（断点续传、miss 缓存、requests 连接池、16 线程） | 仅本地补缺失资源：`python tools\mirror.py --workers 16` |

> 爬虫与诊断脚本（mirror.py / probe.py / netdiag.py / _tmp_*.py）被 .gitignore 排除，仅存在于本地。

## 6. 常见任务速查

- **改欢迎页文案/卡片**：编辑 `mirror/index.html`（SUBJECTS + render）。
- **改全站 UI / 主题 / 工具栏**：编辑 `mirror/powertech-ui.js`。
- **新增学科或调整学段**：改 `index.html` 的 SUBJECTS 数组（stages 用 `senior`/`junior`）。
- **验证**：起 server/start.ps1 → 浏览器逐个打开 5 科目 app.html 与欢迎页，检查控制台报错与渲染。
- **恢复被改文件原始字节**：`<subject>/app.html` 有 `.orig` 备份。

## 7. 重要注意事项

1. **大文件注意**：`chemistry.config.js`（约 69KB）等用 Read 需 offset/limit；不要整读。
2. **页脚版权**：`©2026-现在 本新同学 All right reserved`（欢迎页 index.html 底部）。

## 8. 用户偏好（协作准则）

- **语言**：始终用中文与用户沟通；代码注释随项目用中文。
- **优先级**：功能实现优先于性能、占用与存储空间。
- **改动最小化**：只做被要求的事，不顺手重构无关代码。
- **长命令敏感性**：对长时间无输出的命令主动汇报进度，避免用户误以为卡死。

## 9. 技术栈与代码可修改性（2026-08 排查结论）

### 技术栈
- **前端（5 科目 React SPA）**：React + Babel 内联 JSX（开发构建、未压缩）+ Tailwind CSS + Lucide 图标；
  3D 用 `model-viewer` + **Draco WASM**（GLB）与 **three.js**（iframe 模拟器 / 地理 / 数学）。
- **化学**：独立的 **Vite + React Three Fiber** 生产构建（哈希 chunk，`assets/app-*.js`）。
- **认证门**：`shg-subject-auth-gate.js`（localhost 自动注入"本地预览"教师身份）。
- **后端/工具链**：纯 Python（`serve.py` / `mirror.py` / `patch_*.py` / `verify.py` / `build_search_index.py`）。
- **定制层**：`mirror/powertech-ui.js`（单文件 IIFE 全站覆盖层）。

### 混淆 / 可修改性
- **无 obfuscator 级别混淆**：全库无 `_0x…` 十六进制变量、无 eval 壳、无字符串编码；仅 3 处 `atob(` 均为正常 base64 解码 GLB。**无任何 .map 源映射**。
- **可读可改（核心业务，绝大多数）**：5 科目 `app/*.compiled.js`（带注释与原始开发路径）、biology 各模块 `scene.js`、`scene.config.json`、`visualizations/manifest.json`、`*-source.bundle.js`（esbuild 开发构建，`__defProp` 等为 esbuild 标准 helper 非混淆）、5 科目 `*.config.js`、auth gate、`powertech-ui.js`。
- **压缩但非混淆（minify，可改但费劲）**：
  - 化学 `subjects/chemistry/assets/*.js` 全部（Vite 产物，单行/哈希文件名）；
  - `subjects/<bio|geo>/visualizations/.../assets/source/index.html` 内联模拟器（约 787KB 压缩脚本）；
  - 地理 `worldgeo.js` / `geodata.js` / `nighttex.js`；
  - vendor 库（`babel.min.js`、`tailwind.min.js`、`three.min.js`、`draco_decoder.js`、leaflet/d3/lucide 等，均为知名开源库）。
- 结论：改业务逻辑优先找可读文件直接改；压缩产物只能原地改 min 代码（无 source map，无法反编译到原源码）。

### 自建页面（欢迎页/声明页/友链页）
- `mirror/index.html` 欢迎页、`mirror/disclaimer.html` 声明页、`mirror/friends.html` 友链页均为**手写原生 HTML/CSS/JS**，未用框架，直接可改。
- 背景图 `background.webp` 存放于 `mirror/` 根（站根 `/background.webp`）；项目根 `D:\DevData\SmartTeach\background.webp` 为其源文件。
- 友链页 `mirror/friends.html`：卡片图标经 GitHub API `https://api.github.com/users/<org>` 取 org/用户 logo（`avatar_url`），失败时回退首字占位。

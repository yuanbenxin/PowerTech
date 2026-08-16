# PowerTech 在线教学演示（拾光视界全站离线镜像）

原站 https://www.shiguangtongxue.cn/ 的完整本地离线镜像，含 5 个学科交互教学系统，
并叠加 PowerTech UI 定制层（浅色主题、全站离线搜索、导航工具栏、化学侧边栏改造等）。

## 启动

```powershell
.\server\start.ps1            # Windows
```

```bash
./server/start.sh             # macOS / Linux
```

或直接 `python server/serve.py`。浏览器打开 **http://localhost:8000/**（PowerTech 欢迎页，选学段与学科进入）。

## 各学科直达

| 学科 | 入口 |
|------|------|
| 生物（高中 38 模块 / 初中 35 模块，3D 模型 + 模拟器） | http://localhost:8000/subjects/biology/app.html?stage=senior |
| 数学（可视化课件 + 题库练习） | http://localhost:8000/subjects/math/app.html?stage=senior |
| 地理（高中 / 初中） | http://localhost:8000/subjects/geography/app.html?stage=senior |
| 语文（初中诗词文言文） | http://localhost:8000/subjects/chinese/app.html |
| 化学（元素视界实验室） | http://localhost:8000/subjects/chemistry/app.html |

- 认证自动进入"本地预览"模式（localhost 自动绕过，教师身份全权限），无需登录。
- 重要声明：http://localhost:8000/disclaimer.html

## 定制内容（相对原站的有意差异）

1. **隐藏 AI 学习助手**（小拾光，依赖后端无法本地化）——入口已移除。
2. **移除账号/订阅体系**——个人中心、订阅中心、退出系统按钮及弹窗全部删除，
   试用提示（trial-user-notice）不再加载。认证门控保留（仅用于本地身份注入）。
3. **主题**——默认浅色，导航栏右侧按钮切换浅/深色（localStorage 记忆）。
4. **导航工具栏**——每页顶栏内嵌：离线全站搜索（517 条模块索引，支持本学科/全站范围）、
   关于作者、重要声明、主题切换。
5. **品牌**——原"拾光视界/元素视界"统一替换为"PowerTech在线教学演示"。
6. **进度条**——3D 模型下载进度改为不定式动画（不显示百分比）。
7. **视觉统一**——卡片毛玻璃、平滑滚动、大圆角收敛、"返回列表"统一样式。
8. **数学题库**——保持原生米白纸感主题（浅色模式下双重反转还原）。
9. **化学**——侧栏 emoji 换 SVG 线条图标；hover 自动展开/移开收起；左下角图钉按钮固定展开；
   自带背景切换按钮停用（由全局主题接管）；浅色下演示画布衬浅底。
10. **离线 3D**——Draco 解码器本地化（/draco/1.5.6/），断网可解码压缩 GLB。

## 工具链（tools/ 与 server/）

| 脚本 | 用途 |
|------|------|
| `server/serve.py`（+ `start.ps1` / `start.sh`） | 本地静态服务器（端口 8000，mirror/ 为根） |
| `build_deploy.py` | 从 mirror/ 生成 deploy/（认证补丁 + netlify.toml + _headers + 404.html），CI 部署前必跑 |
| `build_search_index.py` | 重建离线搜索索引（mirror/search-index.json） |
| `compress_models.py` | GLB Draco 压缩（幂等） |
| `verify.py` | 全量资源 200 检查 + 源站抽样比对（verify-report.txt） |
| `clean.py` | 兜底清理垃圾文件 |
| `patch_html.py` / `patch_draco.py` / `patch_ui.py` | 一次性定制补丁（已执行，幂等可重跑） |
| `rank_courseware.py` | 调整课程卡片顺序（可演示卡片靠前） |

注意：`mirror/` 下的文件被 patch_ui.py 等修改过，重跑 mirror.py 会跳过已存在文件，
不会覆盖定制；如需恢复原始字节，删除对应文件后重爬即可（app.html 有 .orig 备份）。

## 部署（GitHub Actions → Netlify，零构建 credits）

纯静态站点，构建与部署全在 GitHub Actions 完成，Netlify 只接收构建产物：

1. 本地修改 `mirror/` 源码后 `git push` 到 `main`（或 Actions 手动触发）；
2. Workflow（`.github/workflows/deploy.yml`）运行 `python tools/build_deploy.py` 生成 `deploy/`；
3. `netlify-cli deploy --prod --dir deploy --site 975c8089-f9c0-410a-bd5b-3ee182920527`
   把产物直接推送到 Netlify（API 部署，不触发站点构建、不消耗 credits）。

前置条件（已配置）：
- 仓库 Secrets：`NETLIFY_AUTH_TOKEN`（Netlify Personal Access Token）；
- Netlify 站点已断开 GitHub 自动构建集成；
- `deploy/`、`models-backup/` 在 `.gitignore` 中，不入库。

手动回退部署：`netlify deploy --prod --dir deploy --site 975c8089-f9c0-410a-bd5b-3ee182920527`。

## 已知说明

- `s_x1/s_x2/s_x3` 部分选修模块的 `scene.config.json` 在**源站即为 404**（应用自动降级），非镜像缺失。
- `/api/*` 接口本地不存在，应用内置静默降级，不影响课件功能。
- 浅色主题采用全局反色滤镜方案（媒体/题库双重反转还原），个别模块深浅模式下观感以可用性优先。

# 任务交接文档（给接手的 AI）

> 更新时间：2026-08-15 清晨。上一任 AI 因积分用尽中断，请从本文档继续。

---

## 1. 任务需求

用户要求：**把 https://www.shiguangtongxue.cn/ 生物教学站完整镜像到本地**，建立可离线运行的完整副本。

已确认的用户决策：
- **范围**：全站 5 科目 —— `biology`、`chemistry`、`math`、`geography`、`chinese`（其余路径是 SPA 兜底壳，非真实科目）
- **验收标准**：本地版本与原站表现一致；接受模块拆成不同页面，功能不能有出入
- **AI 学习助手**（小拾光，依赖后端 API 无法本地化）：**隐藏入口**（删除各 app.html 中 dist-learning-assistant 的 script 标签）
- 用户已授权完全访问浏览器与系统命令；

规格文档（Spec 模式产出，任务/验收清单以它为准）：
- `d:\DevData\SmartTeach\.trae\specs\mirror-shiguang-biology-site\spec.md`（架构调研结论，务必先读）
- `tasks.md`（7 个任务，全部未完成勾选）
- `checklist.md`（15 项验收）

---

## 2. 站点架构要点（已实测，详见 spec.md）

```
www.shiguangtongxue.cn/
├── subjects/<subject>/app.html          5 个科目，均为 React SPA
│   ├── <subject>.config.js              window.__SHG_<SUBJECT>_RUNTIME__，含 ASSET_MANIFEST（资源全清单）
│   ├── 课程架构数据.json                 课程索引（文件名是中文，URL 中是 %E8%AF%BE…）
│   ├── app/*.compiled.js                应用代码
│   ├── course-data/books/*.json         各册卡片数据
│   ├── assets/（vendor/字体/卡片图）、images/、courseware-images/
│   └── visualizations/books/<book>/<module>/  每模块一个目录
│       ├── scene.config.json + scene.js（或 *-source.bundle.js，~1.4MB）
│       └── assets/（models/*.glb、draco/*.wasm、images/、source/index.html 自包含模拟器）
└── dist-learning-assistant/             AI 助手资源（要下载但入口要删）
```

**关键机制**：
1. 科目 config.js 的 `ASSET_MANIFEST` 每个资源有 3 个前缀变体键（`""`/`"./"`/`"/"`），去重后才是真实清单：biology=622、math=1478、chinese=1044、geography=585、chemistry=185
2. **清单不完整**：scene.js 内 `assets/...` 相对引用（GLB、draco、source/index.html 等）不在清单里，必须递归解析 JS/JSON/HTML/CSS 文本内容发现，直到闭包
3. **认证无需破解**：`shg-subject-auth-gate.js` 的 `shouldBypass()` 对 localhost/127.0.0.1/file:// 自动注入 local-preview 用户（教师身份、全权限）。本地直接能用
4. **API 静默降级**：`/api/unified/*`、`/api/announcements/*` 等失败会被 catch，本地不需模拟
5. 所有 URL 带 `?v=<hash>` 版本参数，但不带也返回 200
6. 3D 用 `<model-viewer>` + Draco WASM；部分模块是 iframe 内嵌自包含 three.js 模拟器

---

## 3. 已发现的坑（务必先看！）

| # | 坑 | 说明/对策 |
|---|-----|----------|
| 1 | **SPA 兜底壳** | 服务器对不存在的路径返回 **200 + HTML 壳**（正文含 "Biology Entry Demo"，约 24-26KB）。曾导致爬虫把假 200 存盘并从壳里提取引用，产生无限嵌套垃圾路径。`mirror.py` 已加 `is_fallback_shell()` 判别（非 html 扩展名收到 text/html → 判假；内容含标记 → 判假） |
| 2 | **服务器限速 ~50KB/s/连接** | 1MB 文件要 20s+，6MB GLB 要 2 分钟+。**"长时间无输出"通常是正常慢，不是挂死**。不要频繁杀进程重启 |
| 3 | **僵尸 python 进程** | 被 StopCommand 杀掉的爬虫可能残留子进程，抢占服务器连接配额导致新进程全卡。跑爬虫前先 `Get-Process python \| Stop-Process -Force` |
| 4 | **Python urllib 批量挂起** | 本机 urllib 在 ThreadPool 下偶发整批挂死（单发正常，原因未查明）。`mirror.py` 现已改用 `requests.Session`（每线程一个，连接池）——受控实验验证 8 并发正常 |
| 5 | 中文文件名 | `课程架构数据.json` 等，本地存解码名，请求时 quote |
| 6 | dist-portal 垃圾 | mirror/ 下混入了兜底壳递归出的 `subjects/dist-portal/founding-members/...`，验收前要删（`tools/clean.py` 可清理兜底壳内容文件，垃圾目录需手动删） |

---

## 4. 当前进度

### 已完成的工具（`d:\DevData\SmartTeach\tools\`）

| 文件 | 状态 | 说明 |
|------|------|------|
| `mirror.py` | ✅ 可用 | 多科目递归爬虫。requests 连接池、16 线程、批次超时 420s、**miss 持久化**（`mirror-miss.txt`，重跑不重复探测 404 路径）、本地已存在文件自动跳过下载但仍做引用提取（断点续传） |
| `serve.py` | ✅ 完成并冒烟通过 | 本地静态服务器（端口 8000，mirror/ 为根），MIME 表齐全（.wasm/.glb/.woff2…）、中文路径、Range/ETag/304、`/api/*` 返回 404、根路径有导航页 |
| `patch_html.py` | ✅ 已写，未运行 | 删除 5 科目 app.html 中助手 script（会生成 .html.orig 备份） |
| `verify.py` | ✅ 已写，未运行 | 全量资源本地 200 检查 + 与源站抽样比对 Content-Length，生成 verify-report.txt |
| `clean.py` | ✅ | 清理兜底壳垃圾文件/重复目录/0 字节文件 |
| `conctest.py`/`netdiag.py`/`probe.py` | 诊断用 | 可忽略/删除 |

### 镜像数据（`d:\DevData\SmartTeach\mirror\`）

- 现有 **644 个文件，约 1031 MB**
- **biology 科目基本完整**：622 清单项 + 递归发现资源（GLB、draco、source/index.html、bundle.js、courseware-images 等）
- 5 科目的 `*.config.js`、`app.html` 已下载
- `dist-learning-assistant/` 已下载
- **未完成**：math / geography / chinese / chemistry 四科目的绝大部分资源（清单项 1478+585+1044+185 + 递归发现）
- `mirror-report.txt` 是旧的错误报告（03:36 全失败那次），可忽略；`mirror-miss.txt` 若存在则是已确认 404 的路径缓存

### Spec 任务状态
- Task 1（爬虫）：代码完成，等价于 ✅
- Task 2（全站爬取）：**biology 完成，其余 4 科目未爬**
- Task 3（serve.py）：✅ 代码完成（未勾 tasks.md）
- Task 4-7：未开始

---

## 5. 后续工作（按顺序）

### Step 1：清场
```powershell
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2：续爬剩余 4 科目
```powershell
python d:\DevData\SmartTeach\tools\mirror.py --workers 16
```
- 断点续传，biology 已下文件会跳过下载只做引用扫描（很快）
- **预期很慢**（限速 50KB/s，总量估计数 GB）：每 10 个文件打印一次进度；批次摘要每批打印；可用 `Get-ChildItem mirror -Recurse -File | Measure` 监控文件数增长
- 若进程超过 30 分钟文件数完全不增长再考虑重启；重启前先杀残留进程
- 结束后看 `mirror-report.txt`，对 `FAIL` 项（网络错误/超时，非 404）复跑一次即可
- 若仍有个别失败，可 `--subject <name>` 单独补爬

### Step 3：清理垃圾
- 删除 `mirror/subjects/dist-portal/`（兜底壳递归垃圾）
- 运行 `python tools\clean.py` 兜底清理

### Step 4：打补丁隐藏助手入口
```powershell
python d:\DevData\SmartTeach\tools\patch_html.py
```

### Step 5：启动服务器 + 自动验证
```powershell
python d:\DevData\SmartTeach\tools\serve.py          # 后台/新终端
python d:\DevData\SmartTeach\tools\verify.py          # 全量 200 检查 + 源站抽样比对
```

### Step 6：浏览器逐模块验收（用浏览器自动化工具，用户浏览器已授权）
1. `http://localhost:8000/subjects/biology/app.html?stage=senior`：确认"本地预览"身份、38 张卡片、无 404
2. 重点抽验：
   - 3D 模块 `s_b1_m03/m06/m07`（GLB + Draco WASM 加载旋转）
   - iframe 模拟器 `s_b1_m04`（滑块/播放/视角切换）
   - bundle 模块 `s_b1_m01`、`s_b2_m04` 等
   - 初中 `j7a_m03` 等 ≥5 个
3. 其余科目各打开 app.html 验证首页渲染 + 抽 1-2 模块
4. 发现 404 → 复跑 mirror.py 补爬 → 复验

### Step 7：收尾
- 按 checklist.md 逐项勾选；更新 tasks.md 勾选
- 写启动说明（`python tools\serve.py` → 访问 `http://localhost:8000/`，列出 5 科目 URL）

---

## 6. 常用验证命令

```powershell
# 文件数与总大小
$f = Get-ChildItem d:\DevData\SmartTeach\mirror -Recurse -File
"$($f.Count) files, $([math]::Round(($f | Measure-Object Length -Sum).Sum/1MB,1)) MB"

# 生物模块完整性抽查（应输出 73 个模块目录，每个都有 scene.config.json）
Get-ChildItem d:\DevData\SmartTeach\mirror\subjects\biology\visualizations\books -Recurse -Filter scene.config.json | Measure

# GLB / WASM 计数
(Get-ChildItem d:\DevData\SmartTeach\mirror -Recurse -Filter *.glb).Count
(Get-ChildItem d:\DevData\SmartTeach\mirror -Recurse -Filter *.wasm).Count
```

## 7. 联系用户时的注意事项
- 用中文交流
- 功能实现优先于性能/占用
- 用户对"长时间无输出的命令"很敏感（曾误以为卡死而取消）——跑爬虫时主动汇报进度

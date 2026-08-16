# -*- coding: utf-8 -*-
"""UI 定制补丁（对镜像文件打补丁，幂等可重跑）：

1. 删除顶栏「个人中心 / 订阅中心 / 退出系统」按钮（4 个 React 科目的 *.compiled.js）
2. 删除「个人中心」弹窗（overlayMode === 'account' ? (...) : null → null）
3. 删除课件页头部「退出系统」按钮（typeof onExit === 'function' ? (...) : null → null）
4. 模型下载进度条改为不定式动画（隐藏百分比 + 循环滑动条）
5. app.html 移除 trial-user-notice.js（试用/订阅提示，登录验证残留）
6. app.html 注入 theme-toggle.js（默认浅色主题 + 右上角切换按钮）
7. chemistry（Vite 压缩产物不动 JS，由 theme-toggle.js 的 CSS 属性选择器隐藏入口）

说明：shg-subject-auth-gate.js 保留——它提供 localhost 自动注入 local-preview
用户的能力，是本地免登录运行的基础，删除会导致应用拿不到身份。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "mirror"
SUBJECTS = ["biology", "chemistry", "math", "geography", "chinese"]
REMOVE_LABELS = ["个人中心", "订阅中心", "退出系统"]

report = []


def log(msg):
    print(msg)
    report.append(msg)


def esc_variants(s):
    r"""字符串 → \uXXXX 大写/小写两种转义形式"""
    up = "".join("\\u%04X" % ord(c) for c in s)
    low = "".join("\\u%04x" % ord(c) for c in s)
    return [up, low]


def label_alt(labels):
    """标签列表 → 正则交替（字面中文 + 两种转义）"""
    alts = []
    for lb in labels:
        alts.append(re.escape(lb))
        alts += [re.escape(v) for v in esc_variants(lb)]
    return "(?:%s)" % "|".join(alts)


# ---------- 1+2+3：React 科目 compiled 文件补丁 ----------

def patch_entry_and_layout(path: Path):
    """对 entry / layout-components 的 compiled 文件打补丁，返回 (removed_btn, removed_overlay, removed_exit)"""
    src = path.read_text(encoding="utf-8", errors="replace")
    orig = src
    n_btn = n_overlay = n_exit = 0

    # 3) 先处理 onExit 三元（避免通用按钮删除破坏外层语法）
    pat_exit = re.compile(
        r"typeof onExit === 'function' \?\s*"
        r"(?:/\*#__PURE__\*/\s*)?React\.createElement\(\"button\"[\s\S]*?\}\s*,\s*\"%s\"\s*\)\s*:\s*null"
        % label_alt(["退出系统"])
    )
    src, n_exit = pat_exit.subn("null", src)

    # 2) 删除 account 弹窗三元：X === 'account' ? (<element>) : null → null
    pat_cond = re.compile(r"([\w?$.\[\]]+)\s*===\s*(['\"])account\2\s*\?")
    pos = 0
    while True:
        m = pat_cond.search(src, pos)
        if not m:
            break
        i = m.end()
        # 跳过空白与 PURE 注释
        j = i
        while True:
            j2 = re.match(r"\s+", src[j:])
            if j2:
                j += j2.end()
            if src.startswith("/*#__PURE__*/", j):
                j += len("/*#__PURE__*/")
                continue
            break
        elem_start = j
        ok = False
        if src.startswith("React.createElement(", j):
            end = match_paren(src, j + len("React.createElement") )  # 位置在 '('
            if end > 0:
                k = end + 1
                # 跳过空白，期待 " : null"
                m2 = re.match(r"\s*:\s*null", src[k:])
                if m2:
                    k2 = k + m2.end()
                    src = src[: m.start()] + "null" + src[k2:]
                    n_overlay += 1
                    pos = m.start() + 4
                    ok = True
        if not ok:
            pos = m.end()

    # 1) 删除顶栏按钮：扫描式（避免正则跨元素吞噬）
    src, n_btn = remove_buttons_by_label(src, REMOVE_LABELS)

    if src != orig:
        path.write_text(src, encoding="utf-8", newline="")
    return n_btn, n_overlay, n_exit


def find_string_end(src: str, i: int):
    """src[i] 为引号 → 返回字符串结束下标（含引号），感知转义"""
    q = src[i]
    i += 1
    n = len(src)
    while i < n:
        if src[i] == "\\":
            i += 2
            continue
        if src[i] == q:
            return i + 1
        i += 1
    return -1


def match_brace(src: str, open_pos: int):
    """src[open_pos] == '{' → 匹配的 '}' 下标（字符串感知，跳过注释）"""
    depth = 0
    i = open_pos
    n = len(src)
    while i < n:
        c = src[i]
        if c in "'\"`":
            # 模板串中的 ${...} 需处理
            if c == "`":
                depth_t = 0
                i += 1
                while i < n:
                    d = src[i]
                    if d == "\\":
                        i += 2
                        continue
                    if d == "`" and depth_t == 0:
                        i += 1
                        break
                    if d == "$" and i + 1 < n and src[i + 1] == "{" and depth_t == 0:
                        depth_t = 1
                        i += 2
                        continue
                    if depth_t > 0:
                        if d == "{":
                            depth_t += 1
                        elif d == "}":
                            depth_t -= 1
                    i += 1
                continue
            e = find_string_end(src, i)
            if e < 0:
                return -1
            i = e
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            if j < 0:
                return -1
            i = j + 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i)
            if j < 0:
                return -1
            i = j + 2
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def remove_buttons_by_label(src: str, labels):
    """删除 createElement("button", {...}, "LABEL") 元素。
    扫描式：先定位标签字符串字面量，向前验证同属一个 button 元素，向后取元素边界，
    连同后面的逗号分隔符一起删除。绝不跨越元素边界。"""
    alt = label_alt(labels)
    lit = re.compile(r'"(%s)"' % alt)
    removed = 0
    while True:
        m = lit.search(src)
        if not m:
            break
        i = m.start()
        # 向前找最近的 React.createElement(
        k = src.rfind("React.createElement(", 0, i)
        if k < 0:
            break
        seg = src[k + len("React.createElement("): i]
        # seg 应为:  ws "button" ws , ws {...} ws ,
        mm = re.match(r'^\s*"button"\s*,\s*', seg)
        if not mm or "{" not in seg[mm.end():]:
            # 不是 button 元素的直接子串 → 把这个字面量换成同长占位，防止死循环
            src = src[: i] + '"\u00b7"' + src[m.end():]
            continue
        brace_pos = k + len("React.createElement(") + mm.end()
        # seg 中 props 必须恰好是一个平衡对象且其后只有逗号空白
        rest = seg[mm.end():]
        bp = rest.find("{")
        be = match_brace(rest, bp)
        if be < 0 or rest[be + 1:].strip() not in (",",):
            src = src[: i] + '"\u00b7"' + src[m.end():]
            continue
        # 元素结束：标签字符串后应为 )
        j = m.end()
        j2 = re.match(r"\s*\)", src[j:])
        if not j2:
            src = src[: i] + '"\u00b7"' + src[m.end():]
            continue
        elem_end = j + j2.end()
        # 删除范围起点：包含前面的 PURE 注释与前导空白
        start = k
        pre = src.rfind("/*#__PURE__*/", 0, k)
        if pre >= 0 and src[pre + len("/*#__PURE__*/"): k].strip() == "":
            start = pre
        # 范围终点：元素后若有 ", " 分隔符一并删除；否则回退删除前面的 ", "
        post = re.match(r"\s*,\s*", src[elem_end:])
        if post:
            end = elem_end + post.end()
        else:
            pre2 = re.compile(r"\s*,\s*$").search(src[: start])
            if pre2:
                start = pre2.start()
            end = elem_end
        src = src[:start] + src[end:]
        removed += 1
    return src, removed


def match_paren(src: str, open_pos: int):
    """src[open_pos] == '(' → 返回匹配的 ')' 下标（感知字符串/模板/转义），失败 -1"""
    depth = 0
    i = open_pos
    n = len(src)
    while i < n:
        c = src[i]
        if c in "'\"`":
            q = c
            i += 1
            while i < n:
                d = src[i]
                if d == "\\":
                    i += 2
                    continue
                if d == q:
                    break
                # 模板串中的 ${...} 需按普通代码处理（内部可能有括号）
                if q == "`" and d == "$" and i + 1 < n and src[i + 1] == "{":
                    depth_t = 1
                    i += 2
                    while i < n and depth_t:
                        e = src[i]
                        if e == "\\":
                            i += 2
                            continue
                        if e in "'\"`":
                            qq = e
                            i += 1
                            while i < n and src[i] != qq:
                                if src[i] == "\\":
                                    i += 1
                                i += 1
                            i += 1
                            continue
                        if e == "{":
                            depth_t += 1
                        elif e == "}":
                            depth_t -= 1
                        i += 1
                    continue
                i += 1
            i += 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j + 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i)
            i = n if j < 0 else j + 2
            continue
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


# ---------- 4：进度条不定式 ----------

def patch_progress(path: Path):
    src = path.read_text(encoding="utf-8", errors="replace")
    if "bio-model-download-progress" not in src:
        return False
    orig = src
    # 隐藏百分比（幂等：已含 display: none 则跳过）
    if not re.search(r"\.bio-model-download-progress__percent\s*\{[^}]*display:\s*none", src):
        src, _ = re.subn(
            r"(\.bio-model-download-progress__percent\s*\{)",
            r"\1 display: none;", src, count=1)
    # fill 改为固定宽度循环滑动（容忍换行空白；幂等：已有 animation 则跳过）
    if "bio-progress-indeterminate 1.15s" not in src:
        src, _ = re.subn(
            r"(\.bio-model-download-progress__fill\s*\{)\s*width: 0%;",
            r"\1 width: 38% !important; animation: bio-progress-indeterminate 1.15s ease-in-out infinite;",
            src, count=1)
    src, _ = re.subn(
        r"(\.bio-model-download-progress__fill\s*\{[^}]*?)transition: width 160ms ease;",
        r"\1", src, count=1)
    # 关键帧（插进模板串，幂等）
    if "bio-progress-indeterminate" in src and "@keyframes bio-progress-indeterminate" not in src:
        src = src.replace(
            "      .bio-model-download-progress__percent {",
            "      @keyframes bio-progress-indeterminate {\n"
            "        0% { margin-left: -38%; }\n"
            "        100% { margin-left: 100%; }\n"
            "      }\n\n"
            "      .bio-model-download-progress__percent {", 1)
    # setProgress 不再写宽度/百分比文本（逐行删除，避免模板串 } 干扰）
    src = src.replace("        if (fill) fill.style.width = percentText;\n", "", 1)
    src = src.replace("        if (percent) percent.textContent = percentText;\n", "", 1)
    if src != orig:
        path.write_text(src, encoding="utf-8", newline="")
    return src != orig


# ---------- 5+6：app.html / stage-selector.html 补丁 ----------

UI_TAG = '<script src="/powertech-ui.js"></script>\n</head>'


def patch_app_html(path: Path, with_trial: bool = True):
    html = path.read_text(encoding="utf-8")
    orig = html
    n_trial = 0
    if with_trial:
        # 移除 trial-user-notice（试用/订阅提示）
        html, n_trial = re.subn(
            r'[ \t]*<script src="\.?/?trial-user-notice\.js[^"]*"[^>]*></script>\s*\n?', "", html)
    # 旧版注入替换为新版
    html = html.replace('<script src="/theme-toggle.js"></script>', '<script src="/powertech-ui.js"></script>')
    # 注入 UI 覆盖层
    if "/powertech-ui.js" not in html:
        html = html.replace("</head>", UI_TAG, 1)
    if html != orig:
        path.write_text(html, encoding="utf-8", newline="")
    return n_trial, "/powertech-ui.js" in html


# ---------- 7：品牌替换 ----------

BRAND_MAP = [
    ("拾光视界", "PowerTech在线教学演示"),
    ("元素视界", "PowerTech在线教学演示"),
]


def esc_all(s):
    up = "".join("\\u%04X" % ord(c) for c in s)
    low = "".join("\\u%04x" % ord(c) for c in s)
    return [s, up, low]


def patch_brands():
    r"""subjects 下全部文本资源（js/html/css/json）替换品牌字符串（含 \u 转义形态）。"""
    total = 0
    for s in SUBJECTS:
        n_subj = 0
        for f in (ROOT / "subjects" / s).rglob("*"):
            if not f.is_file() or f.name.endswith(".orig"):
                continue
            if f.suffix.lower() not in {".js", ".mjs", ".html", ".htm", ".css", ".json", ".svg", ".txt"}:
                continue
            try:
                src = f.read_text(encoding="utf-8", errors="strict")
            except (UnicodeDecodeError, ValueError):
                continue
            orig = src
            for old, new in BRAND_MAP:
                for variant in esc_all(old):
                    if variant in src:
                        src = src.replace(variant, new)
            if src != orig:
                f.write_text(src, encoding="utf-8", newline="")
                n_subj += 1
                total += 1
        if n_subj:
            log(f"[ok] {s}: 品牌替换 {n_subj} 个文件")
    return total


def main():
    if not (ROOT / "powertech-ui.js").exists():
        log("[FAIL] mirror/powertech-ui.js 缺失")
        return 1

    for s in SUBJECTS:
        base = ROOT / "subjects" / s
        # app.html
        html_path = base / "app.html"
        if html_path.exists():
            n_trial, has_ui = patch_app_html(html_path)
            log(f"[ok] {s}/app.html: 移除 trial-notice ×{n_trial}, powertech-ui {'已注入' if has_ui else '缺失!'}")
        # stage-selector.html（math/geography 启动页）
        sel = base / "stage-selector.html"
        if sel.exists():
            _, has_ui = patch_app_html(sel, with_trial=False)
            log(f"[ok] {s}/stage-selector.html: powertech-ui {'已注入' if has_ui else '缺失!'}")

        # compiled 应用代码
        for js in sorted((base / "app").glob("*.compiled.js")):
            try:
                nb, no, ne = patch_entry_and_layout(js)
            except Exception as e:
                log(f"[FAIL] {js.name}: {e}")
                continue
            if nb or no or ne:
                log(f"[ok] {s}/app/{js.name}: 按钮 ×{nb} 弹窗 ×{no} onExit ×{ne}")

        # 进度条（source 与 compiled 都处理，命中即改）
        for js in list((base / "app").glob("*shared*.js")):
            if patch_progress(js):
                log(f"[ok] {s}/app/{js.name}: 进度条改为不定式动画")

    # 品牌替换
    patch_brands()

    # 清理旧版注入文件
    old = ROOT / "theme-toggle.js"
    if old.exists():
        old.unlink()
        log("[ok] 移除旧版 theme-toggle.js（由 powertech-ui.js 取代）")

    out = Path(__file__).resolve().parent.parent / "patch-ui-report.txt"
    out.write_text("\n".join(report), encoding="utf-8")
    print(f"\n[done] 报告 -> {out}")


if __name__ == "__main__":
    main()

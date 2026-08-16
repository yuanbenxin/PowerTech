const svg = document.getElementById("geometry-svg");
const gridLayer = document.getElementById("svg-grid-layer");
const drawingLayer = document.getElementById("geometry-drawing-layer");
const controlsLayer = document.getElementById("geometry-controls-layer");
const hudContent = document.getElementById("hud-content-body");
const liveStats = document.getElementById("live-stats-container");
const formulaBody = document.getElementById("formula-card-body");
const actionButtonsGrid = document.getElementById("action-buttons-grid");
const stepGuideIndicator = document.getElementById("step-guide-indicator");
const btnHudToggle = document.getElementById("btn-hud-toggle");
const hudCard = document.getElementById("analysis-hud-card");
const teachingFlow = document.getElementById("teaching-flow");

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEW_BOX = { width: 600, height: 420 };
const COLORS = {
    red: "#ef4444",
    green: "#10b981",
    blue: "#2563eb",
    violet: "#7c3aed",
    amber: "#f59e0b",
    slate: "#1e293b"
};

let activeTab = "viviani";
let activeDragId = null;
let activePointerId = null;
let lockedElement = null;
let demoTimers = [];
let demoRaf = 0;

const state = {
    viviani: {
        A: { x: 300, y: 58 },
        B: { x: 155, y: 309 },
        C: { x: 445, y: 309 },
        P: { x: 300, y: 198 }
    },
    doubleHeight: {
        C: { x: 180, y: 310 },
        A: { x: 180, y: 92 },
        B: { x: 450, y: 310 }
    },
    bisector: {
        B: { x: 135, y: 318 },
        C: { x: 465, y: 318 },
        A: { x: 258, y: 92 }
    }
};

const defaults = JSON.parse(JSON.stringify(state));

const flowCopy = {
    viviani: ["连线分割", "面积求和", "同底消元", "距离和=高"],
    "double-height": ["确定底高", "作斜边高", "两算面积", "得到 ab=ch"],
    bisector: ["作平分线", "等距高 d", "公共高 H", "比值联立"]
};

function el(tag, attrs = {}, text = "") {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (value !== undefined && value !== null) node.setAttribute(key, value);
    });
    if (text) node.textContent = text;
    return node;
}

function html(strings, ...values) {
    return strings.reduce((acc, item, index) => acc + item + (values[index] ?? ""), "");
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function triangleArea(a, b, c) {
    return Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2;
}

function perpendicularFoot(p, a, b) {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len2 = vx * vx + vy * vy;
    if (!len2) return { foot: { ...a }, dist: distance(p, a) };
    const t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
    const foot = { x: a.x + t * vx, y: a.y + t * vy };
    return { foot, dist: distance(p, foot) };
}

function cross(a, b) {
    return a.x * b.y - a.y * b.x;
}

function normalizeVector(v) {
    const len = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / len, y: v.y / len };
}

function angleBisectorIntersection(a, b, c) {
    const ab = normalizeVector({ x: b.x - a.x, y: b.y - a.y });
    const ac = normalizeVector({ x: c.x - a.x, y: c.y - a.y });
    const ray = normalizeVector({ x: ab.x + ac.x, y: ab.y + ac.y });
    const base = { x: c.x - b.x, y: c.y - b.y };
    const start = { x: b.x - a.x, y: b.y - a.y };
    const denominator = cross(ray, base);
    if (Math.abs(denominator) < 0.0001) {
        return { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
    }
    const t = cross(start, base) / denominator;
    return {
        x: a.x + ray.x * t,
        y: a.y + ray.y * t
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function constrainToTriangle(p, a, b, c) {
    const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    const u = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / det;
    const v = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / det;
    const w = 1 - u - v;
    if (u >= 0.015 && v >= 0.015 && w >= 0.015) return p;
    const cu = clamp(u, 0.015, 0.97);
    const cv = clamp(v, 0.015, 0.97);
    const cw = clamp(w, 0.015, 0.97);
    const sum = cu + cv + cw;
    return {
        x: (cu * a.x + cv * b.x + cw * c.x) / sum,
        y: (cu * a.y + cv * b.y + cw * c.y) / sum
    };
}

function svgPointFromEvent(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (matrix) {
        const mapped = point.matrixTransform(matrix.inverse());
        return {
            x: clamp(mapped.x, 0, VIEW_BOX.width),
            y: clamp(mapped.y, 0, VIEW_BOX.height)
        };
    }
    const rect = svg.getBoundingClientRect();
    return {
        x: clamp((event.clientX - rect.left) * VIEW_BOX.width / Math.max(1, rect.width), 0, VIEW_BOX.width),
        y: clamp((event.clientY - rect.top) * VIEW_BOX.height / Math.max(1, rect.height), 0, VIEW_BOX.height)
    };
}

function clearDemo() {
    demoTimers.forEach(id => window.clearTimeout(id));
    demoTimers = [];
    if (demoRaf) window.cancelAnimationFrame(demoRaf);
    demoRaf = 0;
}

function drawGrid() {
    gridLayer.innerHTML = "";
    gridLayer.appendChild(el("rect", {
        x: 0,
        y: 0,
        width: VIEW_BOX.width,
        height: VIEW_BOX.height,
        fill: "#ffffff"
    }));
    gridLayer.appendChild(el("rect", {
        x: 0,
        y: 0,
        width: VIEW_BOX.width,
        height: VIEW_BOX.height,
        fill: "url(#grid-dots)",
        opacity: "0.45"
    }));
}

function label(parent, x, y, text, className = "") {
    const group = el("g");
    group.appendChild(el("text", { x, y, class: "label-halo" }, text));
    group.appendChild(el("text", { x, y, class: `label-text ${className}` }, text));
    parent.appendChild(group);
    return group;
}

function line(parent, a, b, attrs = {}) {
    const node = el("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        class: "geo-line",
        ...attrs
    });
    parent.appendChild(node);
    return node;
}

function polygon(parent, points, attrs = {}) {
    const node = el("polygon", {
        points: points.map(p => `${p.x},${p.y}`).join(" "),
        ...attrs
    });
    parent.appendChild(node);
    return node;
}

function rightAnglePath(foot, base, source, size = 10) {
    const ux = base.x - foot.x;
    const uy = base.y - foot.y;
    const vx = source.x - foot.x;
    const vy = source.y - foot.y;
    const ul = Math.hypot(ux, uy) || 1;
    const vl = Math.hypot(vx, vy) || 1;
    const a = { x: foot.x + ux / ul * size, y: foot.y + uy / ul * size };
    const c = { x: foot.x + vx / vl * size, y: foot.y + vy / vl * size };
    const b = { x: a.x + vx / vl * size, y: a.y + vy / vl * size };
    return `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`;
}

function dragPoint(parent, id, point) {
    const group = el("g", { id, class: "drag-point" });
    group.appendChild(el("circle", { cx: point.x, cy: point.y, r: 24, class: "drag-hit" }));
    group.appendChild(el("circle", { cx: point.x, cy: point.y, r: 8, class: "drag-point-outer" }));
    group.appendChild(el("circle", { cx: point.x, cy: point.y, r: 3.8, class: "drag-point-inner" }));
    parent.appendChild(group);
    return group;
}

function stat(labelText, valueText, color = "") {
    const style = color ? `style="color:${color};"` : "";
    return `<div class="stat-item"><span class="stat-label">${labelText}</span><span class="stat-value" ${style}>${valueText}</span></div>`;
}

function setFlow(activeIndex = 0) {
    const steps = flowCopy[activeTab] || flowCopy.viviani;
    teachingFlow.innerHTML = steps.map((step, index) => `
        <div class="flow-step ${index === activeIndex ? "active" : ""}">
            <span>${index + 1}</span>
            <b>${step}</b>
        </div>
    `).join("");
}

function setCanvasInfo(title, lines) {
    const group = el("g");
    group.appendChild(el("rect", { x: 414, y: 24, width: 158, height: 74, rx: 10, class: "guide-card" }));
    label(group, 493, 45, title, "label-blue");
    lines.forEach((item, index) => label(group, 493, 66 + index * 18, item, index === lines.length - 1 ? "label-amber" : ""));
    drawingLayer.appendChild(group);
}

function renderViviani() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";
    const { A, B, C, P } = state.viviani;
    const footAB = perpendicularFoot(P, A, B);
    const footBC = perpendicularFoot(P, B, C);
    const footCA = perpendicularFoot(P, C, A);
    const side = distance(A, B);
    const height = perpendicularFoot(A, B, C).dist;
    const h1 = footAB.dist;
    const h2 = footBC.dist;
    const h3 = footCA.dist;
    const sum = h1 + h2 + h3;

    polygon(drawingLayer, [P, A, B], {
        class: "area-fill",
        fill: lockedElement === "area1" ? "rgba(239,68,68,0.24)" : "rgba(239,68,68,0.13)"
    });
    polygon(drawingLayer, [P, B, C], {
        class: "area-fill",
        fill: lockedElement === "area2" ? "rgba(16,185,129,0.24)" : "rgba(16,185,129,0.13)"
    });
    polygon(drawingLayer, [P, C, A], {
        class: "area-fill",
        fill: lockedElement === "area3" ? "rgba(37,99,235,0.22)" : "rgba(37,99,235,0.12)"
    });

    polygon(drawingLayer, [A, B, C], { fill: "none", stroke: COLORS.slate, "stroke-width": 3, class: "geo-line" });
    line(drawingLayer, P, A, { stroke: "#94a3b8", "stroke-width": 1.5, "stroke-dasharray": "5 5" });
    line(drawingLayer, P, B, { stroke: "#94a3b8", "stroke-width": 1.5, "stroke-dasharray": "5 5" });
    line(drawingLayer, P, C, { stroke: "#94a3b8", "stroke-width": 1.5, "stroke-dasharray": "5 5" });
    line(drawingLayer, P, footAB.foot, { stroke: COLORS.red, "stroke-width": lockedElement === "h1" ? 4 : 2.4, "stroke-dasharray": "6 4" });
    line(drawingLayer, P, footBC.foot, { stroke: COLORS.green, "stroke-width": lockedElement === "h2" ? 4 : 2.4, "stroke-dasharray": "6 4" });
    line(drawingLayer, P, footCA.foot, { stroke: COLORS.blue, "stroke-width": lockedElement === "h3" ? 4 : 2.4, "stroke-dasharray": "6 4" });

    drawingLayer.appendChild(el("path", { d: rightAnglePath(footAB.foot, A, P, 8), class: "right-angle-marker" }));
    drawingLayer.appendChild(el("path", { d: rightAnglePath(footBC.foot, B, P, 8), class: "right-angle-marker" }));
    drawingLayer.appendChild(el("path", { d: rightAnglePath(footCA.foot, C, P, 8), class: "right-angle-marker" }));

    label(drawingLayer, A.x, A.y - 18, "A");
    label(drawingLayer, B.x - 18, B.y + 14, "B");
    label(drawingLayer, C.x + 18, C.y + 14, "C");
    label(drawingLayer, P.x + 18, P.y - 14, "P", "label-violet");
    label(drawingLayer, (P.x + footAB.foot.x) / 2 - 12, (P.y + footAB.foot.y) / 2, "h1", "label-red");
    label(drawingLayer, (P.x + footBC.foot.x) / 2 + 14, (P.y + footBC.foot.y) / 2 + 2, "h2", "label-green");
    label(drawingLayer, (P.x + footCA.foot.x) / 2 + 13, (P.y + footCA.foot.y) / 2 - 2, "h3", "label-blue");

    dragPoint(controlsLayer, "drag-P", P);
    setCanvasInfo("同底面积求和", ["S1 + S2 + S3 = S", "h1 + h2 + h3 = H"]);

    liveStats.innerHTML = [
        stat("到 AB 的距离 h1", `${(h1 / 25).toFixed(2)} cm`, COLORS.red),
        stat("到 BC 的距离 h2", `${(h2 / 25).toFixed(2)} cm`, COLORS.green),
        stat("到 CA 的距离 h3", `${(h3 / 25).toFixed(2)} cm`, COLORS.blue),
        stat("三段距离和", `${(sum / 25).toFixed(2)} cm`, COLORS.violet),
        stat("等边三角形高 H", `${(height / 25).toFixed(2)} cm`, COLORS.slate)
    ].join("");

    formulaBody.innerHTML = html`
        <div class="formula-mini-label">面积链</div>
        <div class="formula-line compact">1/2·a·h1 + 1/2·a·h2 + 1/2·a·h3 = 1/2·a·H</div>
        <div class="formula-line result">h1 + h2 + h3 = H</div>
    `;
    updateHUDContent();
}

function renderDoubleHeight() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";
    const data = state.doubleHeight;
    const { A, B, C } = data;
    const foot = perpendicularFoot(C, A, B);
    const a = distance(B, C) / 25;
    const b = distance(A, C) / 25;
    const c = distance(A, B) / 25;
    const h = foot.dist / 25;

    polygon(drawingLayer, [A, B, C], { fill: "rgba(124,58,237,0.08)", stroke: COLORS.slate, "stroke-width": 3, class: "geo-line" });
    line(drawingLayer, C, foot.foot, { stroke: COLORS.violet, "stroke-width": 2.5, "stroke-dasharray": "6 4" });
    line(drawingLayer, A, C, { stroke: lockedElement === "ab" ? COLORS.amber : COLORS.slate, "stroke-width": lockedElement === "ab" ? 4 : 3 });
    line(drawingLayer, B, C, { stroke: lockedElement === "ab" ? COLORS.amber : COLORS.slate, "stroke-width": lockedElement === "ab" ? 4 : 3 });
    line(drawingLayer, A, B, { stroke: lockedElement === "ch" ? COLORS.violet : COLORS.slate, "stroke-width": lockedElement === "ch" ? 4 : 3 });
    drawingLayer.appendChild(el("path", { d: `M ${C.x} ${C.y - 15} L ${C.x + 15} ${C.y - 15} L ${C.x + 15} ${C.y}`, class: "right-angle-marker" }));
    drawingLayer.appendChild(el("path", { d: rightAnglePath(foot.foot, A, C, 9), class: "right-angle-marker" }));

    const barX = 388;
    const barY = 88;
    const barW = 145;
    drawingLayer.appendChild(el("rect", { x: barX, y: barY, width: barW, height: 24, rx: 7, fill: "rgba(245,158,11,0.16)", stroke: COLORS.amber }));
    drawingLayer.appendChild(el("rect", { x: barX, y: barY + 42, width: barW, height: 24, rx: 7, fill: "rgba(124,58,237,0.16)", stroke: COLORS.violet }));
    label(drawingLayer, barX + barW / 2, barY + 12, "ab", "label-amber");
    label(drawingLayer, barX + barW / 2, barY + 54, "ch", "label-violet");
    label(drawingLayer, barX + barW / 2, barY + 88, "同一面积：ab = ch", "label-blue");

    label(drawingLayer, A.x - 16, A.y - 12, "A");
    label(drawingLayer, B.x + 16, B.y + 14, "B");
    label(drawingLayer, C.x - 16, C.y + 14, "C");
    label(drawingLayer, foot.foot.x + 18, foot.foot.y - 14, "D", "label-violet");
    label(drawingLayer, (A.x + C.x) / 2 - 16, (A.y + C.y) / 2, "b", "label-amber");
    label(drawingLayer, (B.x + C.x) / 2, (B.y + C.y) / 2 + 18, "a", "label-amber");
    label(drawingLayer, (C.x + foot.foot.x) / 2 - 14, (C.y + foot.foot.y) / 2 + 4, "h", "label-violet");

    dragPoint(controlsLayer, "drag-A", A);
    dragPoint(controlsLayer, "drag-B", B);

    liveStats.innerHTML = [
        stat("直角边 a = BC", `${a.toFixed(2)} cm`, COLORS.amber),
        stat("直角边 b = AC", `${b.toFixed(2)} cm`, COLORS.amber),
        stat("斜边 c = AB", `${c.toFixed(2)} cm`, COLORS.violet),
        stat("斜边高 h = CD", `${h.toFixed(2)} cm`, COLORS.violet),
        stat("ab 与 ch", `${(a * b).toFixed(2)} ≈ ${(c * h).toFixed(2)}`, COLORS.blue)
    ].join("");

    formulaBody.innerHTML = html`
        <div class="formula-mini-label">面积链</div>
        <div class="formula-line compact">S = 1/2·a·b = 1/2·c·h</div>
        <div class="formula-line result">ab = ch，h = ab / c</div>
    `;
    updateHUDContent();
}

function renderBisector() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";
    const data = state.bisector;
    const { A, B, C } = data;
    const ab = distance(A, B);
    const ac = distance(A, C);
    const D = angleBisectorIntersection(A, B, C);
    const E = perpendicularFoot(D, A, B);
    const F = perpendicularFoot(D, A, C);
    const G = perpendicularFoot(A, B, C);
    const bd = distance(B, D) / 25;
    const cd = distance(C, D) / 25;

    polygon(drawingLayer, [A, B, D], { fill: "rgba(239,68,68,0.14)", class: "area-fill" });
    polygon(drawingLayer, [A, D, C], { fill: "rgba(16,185,129,0.14)", class: "area-fill" });
    polygon(drawingLayer, [A, B, C], { fill: "none", stroke: COLORS.slate, "stroke-width": 3, class: "geo-line" });
    line(drawingLayer, A, D, { stroke: COLORS.violet, "stroke-width": 3 });
    line(drawingLayer, D, E.foot, { stroke: COLORS.red, "stroke-width": 2.3, "stroke-dasharray": "6 4" });
    line(drawingLayer, D, F.foot, { stroke: COLORS.green, "stroke-width": 2.3, "stroke-dasharray": "6 4" });
    line(drawingLayer, A, G.foot, { stroke: COLORS.blue, "stroke-width": lockedElement === "bd-cd" ? 4 : 2, "stroke-dasharray": "6 4" });
    drawingLayer.appendChild(el("path", { d: rightAnglePath(E.foot, A, D, 8), class: "right-angle-marker" }));
    drawingLayer.appendChild(el("path", { d: rightAnglePath(F.foot, A, D, 8), class: "right-angle-marker" }));
    drawingLayer.appendChild(el("path", { d: rightAnglePath(G.foot, B, A, 8), class: "right-angle-marker" }));

    label(drawingLayer, A.x, A.y - 18, "A");
    label(drawingLayer, B.x - 18, B.y + 14, "B");
    label(drawingLayer, C.x + 18, C.y + 14, "C");
    label(drawingLayer, D.x, D.y + 18, "D", "label-violet");
    label(drawingLayer, E.foot.x - 14, E.foot.y - 10, "E", "label-red");
    label(drawingLayer, F.foot.x + 14, F.foot.y - 10, "F", "label-green");
    label(drawingLayer, G.foot.x, G.foot.y + 18, "G", "label-blue");
    label(drawingLayer, (D.x + E.foot.x) / 2 - 12, (D.y + E.foot.y) / 2, "d", "label-red");
    label(drawingLayer, (D.x + F.foot.x) / 2 + 12, (D.y + F.foot.y) / 2, "d", "label-green");

    dragPoint(controlsLayer, "drag-A", A);
    setCanvasInfo("两条面积比路径", ["S1/S2 = AB/AC", "S1/S2 = BD/CD"]);

    liveStats.innerHTML = [
        stat("邻边 AB", `${(ab / 25).toFixed(2)} cm`, COLORS.red),
        stat("邻边 AC", `${(ac / 25).toFixed(2)} cm`, COLORS.green),
        stat("底段 BD", `${bd.toFixed(2)} cm`, COLORS.blue),
        stat("底段 CD", `${cd.toFixed(2)} cm`, COLORS.blue),
        stat("AB/AC 与 BD/CD", `${(ab / ac).toFixed(3)} ≈ ${(bd / cd).toFixed(3)}`, COLORS.violet)
    ].join("");

    formulaBody.innerHTML = html`
        <div class="formula-mini-label">面积比</div>
        <div class="formula-line compact">S1/S2 = AB/AC，S1/S2 = BD/CD</div>
        <div class="formula-line result">BD / CD = AB / AC</div>
    `;
    updateHUDContent();
}

function updateHUDContent() {
    const content = {
        viviani: html`
            <h3>维维亚尼定理</h3>
            <p>等边三角形内一点 P 到三边距离分别为 h1、h2、h3。</p>
            <ul>
                <li>连接 PA、PB、PC，把大三角形剖成三块：S(PAB)、S(PBC)、S(PCA)。</li>
                <li>三块面积相加等于大三角形面积。</li>
                <li>三块小三角形的底都是同一边长 a。</li>
                <li>消去 1/2 和 a，得到 h1 + h2 + h3 = H。</li>
            </ul>
        `,
        "double-height": html`
            <h3>直角三角形双高法</h3>
            <p>同一个三角形，用两组底高表达同一面积。</p>
            <ul>
                <li>直角边作底高：S = 1/2·a·b。</li>
                <li>斜边作底高：S = 1/2·c·h。</li>
                <li>两个式子表示同一个面积，两边同时去掉 1/2。</li>
                <li>等量代换得到 ab = ch，再求斜边高 h = ab/c。</li>
            </ul>
        `,
        bisector: html`
            <h3>角平分线面积比</h3>
            <p>同一组面积比，用两种底高路径表达。</p>
            <ul>
                <li>先作 ∠A 的角平分线，与 BC 交于 D。</li>
                <li>路径一：D 在角平分线上，到 AB、AC 的距离相等，都是 d。</li>
                <li>用等距高 d：S1/S2 = AB/AC。</li>
                <li>路径二：两个小三角形共用从 A 到 BC 的高 H。</li>
                <li>用公共高 H：S1/S2 = BD/CD。</li>
                <li>联立得 BD/CD = AB/AC。</li>
            </ul>
        `
    };
    hudContent.innerHTML = content[activeTab] || content.viviani;
}

function renderActiveTab() {
    if (activeTab === "viviani") renderViviani();
    if (activeTab === "double-height") renderDoubleHeight();
    if (activeTab === "bisector") renderBisector();
}

function switchTab(tabId) {
    clearDemo();
    activeTab = tabId;
    activeDragId = null;
    activePointerId = null;
    lockedElement = null;
    document.querySelectorAll(".tab-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.tab === tabId);
    });
    const names = {
        viviani: "当前模型：维维亚尼定理",
        "double-height": "当前模型：直角三角形双高法",
        bisector: "当前模型：角平分线面积比"
    };
    stepGuideIndicator.textContent = names[tabId] || names.viviani;
    setFlow(0);
    renderActiveTab();
    initActionButtons();
}

function resetCurrentTopic() {
    clearDemo();
    activeDragId = null;
    activePointerId = null;
    lockedElement = null;
    Object.assign(state.viviani, JSON.parse(JSON.stringify(defaults.viviani)));
    Object.assign(state.doubleHeight, JSON.parse(JSON.stringify(defaults.doubleHeight)));
    Object.assign(state.bisector, JSON.parse(JSON.stringify(defaults.bisector)));
    switchTab(activeTab);
}

function animateValue(duration, update, done) {
    const start = performance.now();
    const tick = now => {
        const t = clamp((now - start) / duration, 0, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        update(ease);
        if (t < 1) {
            demoRaf = requestAnimationFrame(tick);
        } else {
            demoRaf = 0;
            if (done) done();
        }
    };
    demoRaf = requestAnimationFrame(tick);
}

function queueDemo(delay, fn) {
    const id = window.setTimeout(() => {
        demoTimers = demoTimers.filter(item => item !== id);
        fn();
    }, delay);
    demoTimers.push(id);
}

function runDemo() {
    clearDemo();
    setFlow(0);
    lockedElement = null;
    renderActiveTab();

    if (activeTab === "viviani") {
        const start = { ...state.viviani.P };
        const end = { x: 345, y: 178 };
        queueDemo(450, () => {
            setFlow(1);
            animateValue(900, t => {
                state.viviani.P.x = start.x + (end.x - start.x) * t;
                state.viviani.P.y = start.y + (end.y - start.y) * t;
                renderViviani();
            });
        });
        queueDemo(1500, () => { lockedElement = "h1"; setFlow(2); renderViviani(); });
        queueDemo(2200, () => { lockedElement = "h2"; renderViviani(); });
        queueDemo(2900, () => { lockedElement = "h3"; renderViviani(); });
        queueDemo(3600, () => { lockedElement = null; setFlow(3); renderViviani(); });
        return;
    }

    if (activeTab === "double-height") {
        const startA = { ...state.doubleHeight.A };
        const startB = { ...state.doubleHeight.B };
        const endA = { x: 180, y: 122 };
        const endB = { x: 396, y: 310 };
        queueDemo(450, () => {
            setFlow(1);
            animateValue(900, t => {
                state.doubleHeight.A.y = startA.y + (endA.y - startA.y) * t;
                state.doubleHeight.B.x = startB.x + (endB.x - startB.x) * t;
                renderDoubleHeight();
            });
        });
        queueDemo(1500, () => { lockedElement = "ab"; setFlow(2); renderDoubleHeight(); });
        queueDemo(2500, () => { lockedElement = "ch"; renderDoubleHeight(); });
        queueDemo(3400, () => { lockedElement = null; setFlow(3); renderDoubleHeight(); });
        return;
    }

    const startA = { ...state.bisector.A };
    const endA = { x: 305, y: 106 };
    queueDemo(450, () => {
        setFlow(1);
        animateValue(900, t => {
            state.bisector.A.x = startA.x + (endA.x - startA.x) * t;
            state.bisector.A.y = startA.y + (endA.y - startA.y) * t;
            renderBisector();
        });
    });
    queueDemo(1500, () => { lockedElement = "ab-ac"; setFlow(2); renderBisector(); });
    queueDemo(2600, () => { lockedElement = "bd-cd"; renderBisector(); });
    queueDemo(3600, () => { lockedElement = null; setFlow(3); renderBisector(); });
}

function initActionButtons() {
    const presets = {
        viviani: html`
            <button class="btn-action" id="btn-demo" type="button">自动演示一次</button>
            <button class="btn-action" id="btn-reset" type="button">重置模型</button>
            <button class="btn-action" id="btn-v-center" type="button">P 到中心</button>
            <button class="btn-action" id="btn-v-edge" type="button">P 靠近边</button>
        `,
        "double-height": html`
            <button class="btn-action" id="btn-demo" type="button">自动演示一次</button>
            <button class="btn-action" id="btn-reset" type="button">重置模型</button>
            <button class="btn-action" id="btn-d-iso" type="button">等腰直角</button>
            <button class="btn-action" id="btn-d-long" type="button">细长直角</button>
        `,
        bisector: html`
            <button class="btn-action" id="btn-demo" type="button">自动演示一次</button>
            <button class="btn-action" id="btn-reset" type="button">重置模型</button>
            <button class="btn-action" id="btn-b-iso" type="button">等腰三角形</button>
            <button class="btn-action" id="btn-b-scalene" type="button">一般三角形</button>
        `
    };
    actionButtonsGrid.innerHTML = presets[activeTab];

    document.getElementById("btn-demo")?.addEventListener("click", runDemo);
    document.getElementById("btn-reset")?.addEventListener("click", resetCurrentTopic);
    document.getElementById("btn-v-center")?.addEventListener("click", () => {
        state.viviani.P = { x: 300, y: 225 };
        renderViviani();
    });
    document.getElementById("btn-v-edge")?.addEventListener("click", () => {
        state.viviani.P = { x: 260, y: 286 };
        renderViviani();
    });
    document.getElementById("btn-d-iso")?.addEventListener("click", () => {
        state.doubleHeight.A = { x: 180, y: 130 };
        state.doubleHeight.B = { x: 360, y: 310 };
        renderDoubleHeight();
    });
    document.getElementById("btn-d-long")?.addEventListener("click", () => {
        state.doubleHeight.A = { x: 180, y: 82 };
        state.doubleHeight.B = { x: 468, y: 310 };
        renderDoubleHeight();
    });
    document.getElementById("btn-b-iso")?.addEventListener("click", () => {
        state.bisector.A = { x: 300, y: 104 };
        renderBisector();
    });
    document.getElementById("btn-b-scalene")?.addEventListener("click", () => {
        state.bisector.A = { x: 238, y: 92 };
        renderBisector();
    });
}

function updateDragPoint(pos) {
    if (activeTab === "viviani" && activeDragId === "drag-P") {
        const data = state.viviani;
        data.P = constrainToTriangle(pos, data.A, data.B, data.C);
        renderViviani();
        return;
    }

    if (activeTab === "double-height") {
        if (activeDragId === "drag-A") {
            state.doubleHeight.A.y = clamp(pos.y, 62, 250);
            renderDoubleHeight();
            return;
        }
        if (activeDragId === "drag-B") {
            state.doubleHeight.B.x = clamp(pos.x, 245, 505);
            renderDoubleHeight();
            return;
        }
    }

    if (activeTab === "bisector" && activeDragId === "drag-A") {
        state.bisector.A.x = clamp(pos.x, 150, 450);
        state.bisector.A.y = clamp(pos.y, 58, 245);
        renderBisector();
    }
}

function initDragEvents() {
    svg.addEventListener("pointerdown", event => {
        const target = event.target.closest(".drag-point");
        if (!target) return;
        clearDemo();
        activeDragId = target.id;
        activePointerId = event.pointerId;
        svg.setPointerCapture?.(event.pointerId);
        updateDragPoint(svgPointFromEvent(event));
        event.preventDefault();
    });

    svg.addEventListener("pointermove", event => {
        if (!activeDragId || event.pointerId !== activePointerId) return;
        updateDragPoint(svgPointFromEvent(event));
        event.preventDefault();
    });

    const endDrag = event => {
        if (event.pointerId !== activePointerId) return;
        activeDragId = null;
        activePointerId = null;
        svg.releasePointerCapture?.(event.pointerId);
        event.preventDefault();
    };
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);
    svg.addEventListener("lostpointercapture", () => {
        activeDragId = null;
        activePointerId = null;
    });
}

function init() {
    ["contextmenu", "selectstart", "dragstart"].forEach(type => {
        document.addEventListener(type, event => event.preventDefault());
    });

    btnHudToggle.addEventListener("click", () => {
        hudCard.classList.toggle("collapsed");
    });

    document.querySelectorAll(".tab-btn").forEach(button => {
        button.addEventListener("click", () => switchTab(button.dataset.tab));
    });

    drawGrid();
    initDragEvents();
    switchTab("viviani");
}

window.__MATH_TOPIC_RESET__jm_topic_m14 = resetCurrentTopic;
init();

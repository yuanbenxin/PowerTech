/**
 * 一线三等角模型演示仪 - 交互逻辑 (app.js)
 * 1. 几何坐标精密计算与联动 (K形全等、K形相似、等边三角形内折)
 * 2. 线性插值平移/旋转全等过渡动画 + Canvas 物理碰撞火花
 * 3. 一阶低通滤波 LERP 缓动渲染引擎
 * 4. 可折叠半透明 HUD 板书公式动态同步
 */

// ==========================================================================
// 全局状态与配置
// ==========================================================================
let currentScene = "similarity";    // 当前场景: "congruent" | "similarity" | "triangle-fold"
let isAnimating = false;            // 是否在播放动画
let pPosPercent = 40.0;             // P点位置百分比 (15 ~ 85)
let equalAngle = 72.0;              // 场景2等角角度 (30 ~ 150)
let teachingStep = "angles";        // 教学步骤: "line" | "angles" | "extract" | "judge"
let isHudExpanded = false;          // HUD 默认收起
let isTeachingDemo = false;         // 是否在播放一次性教学步骤演示

// 画布缩放与平移状态变量
let zoomScale = 1.0;
let panX = 0;
let panY = 0;

let isPanning = false;
let startPanMouseX = 0;
let startPanMouseY = 0;
let startPanX = 0;
let startPanY = 0;

let isPinchZooming = false;
let lastTouchDist = 0;

// 动画变量
let animationProgress = 0.0;        // 动画进度 (0 ~ 1)

// LERP 渲染平滑插值变量
let renderValues = {
    pPercent: 40.0,
    angle: 72.0,
    // 场景1/2 长度读数
    ad: 0.0,
    dp: 0.0,
    pe: 0.0,
    eb: 0.0,
    // 场景3 长度读数
    ab: 0.0,
    bp: 0.0,
    pc: 0.0,
    cq: 0.0,
    // 动画专用插值坐标 (用于平滑绘制过渡三角形)
    animAx: 0, animAy: 0,
    animDx: 0, animDy: 0,
    animPx: 0, animPy: 0
};

// 坐标系统常量
const centerY = 330;                // 底线 L 垂直 Y 坐标 (留出充足空间给三角形)
const startX = 180;                 // 底线起点 (居中对齐)
const endX = 420;                   // 底线终点
const baseLength = endX - startX;   // 底线总长度 (240px)

// DOM 元素引用
const sandboxWrapper = document.getElementById("sandbox-wrapper");
const sandboxSvg = document.getElementById("sandbox-svg");
const htmlOverlay = document.getElementById("html-overlay");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const hudPanel = document.getElementById("hud-chalkboard-panel");
const hudToggleBtn = document.getElementById("hud-toggle-btn");

const sliderEqualAngle = document.getElementById("slider-equal-angle");
const sliderPPos = document.getElementById("slider-p-pos");
const valEqualAngle = document.getElementById("val-equal-angle");
const valPPos = document.getElementById("val-p-pos");

const btnPlayRotation = document.getElementById("btn-play-rotation");
const btnResetState = document.getElementById("btn-reset-state");
const btnTeachDemo = document.getElementById("btn-teach-demo");
const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const modalHelp = document.getElementById("modal-help");

const theoryTitle = document.getElementById("theory-title");
const theoryText = document.getElementById("theory-text");

// ==========================================================================
// 粒子碰撞火花系统 (HTML5 Canvas Overlay)
// ==========================================================================
const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
let particlesAnimationId = null;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2.0; // 向上喷射
        this.radius = Math.random() * 3.0 + 1.5;
        this.color = color;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // 模拟重力下坠
        this.alpha -= this.decay;
    }
    draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowBlur = 6;
        c.shadowColor = this.color;
        c.fill();
        c.restore();
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", () => {
    resizeCanvas();
    centerModel();
});
resizeCanvas();

function triggerExplosion(x, y, colors, count = 35) {
    for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, color));
    }
    if (!particlesAnimationId) {
        tickParticles();
    }
}

function tickParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            p.draw(ctx);
        }
    }
    
    if (particles.length > 0) {
        particlesAnimationId = requestAnimationFrame(tickParticles);
    } else {
        particlesAnimationId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ==========================================================================
// 几何算法与坐标解算器 (Geometric Mathematics Solvers)
// ==========================================================================

// 极坐标转直角坐标
function polarToCartesian(cx, cy, angleDeg, r) {
    const angleRad = (angleDeg * Math.PI) / 180.0;
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy - r * Math.sin(angleRad) // 屏幕Y坐标向下
    };
}

function pointAngleDeg(cx, cy, x, y) {
    return -Math.atan2(y - cy, x - cx) * 180.0 / Math.PI;
}

function normalizeAngleDeg(angle) {
    let value = angle % 360;
    if (value < 0) value += 360;
    return value;
}

function signedAngleDelta(startAngle, endAngle) {
    let delta = normalizeAngleDeg(endAngle - startAngle);
    if (delta > 180) delta -= 360;
    return delta;
}

function angleLabelPoint(cx, cy, startAngle, endAngle, r) {
    const delta = signedAngleDelta(startAngle, endAngle);
    return polarToCartesian(cx, cy, startAngle + delta / 2, r);
}

function angleLabelBetween(vertex, sideStart, sideEnd, r) {
    return angleLabelPoint(
        vertex.x,
        vertex.y,
        pointAngleDeg(vertex.x, vertex.y, sideStart.x, sideStart.y),
        pointAngleDeg(vertex.x, vertex.y, sideEnd.x, sideEnd.y),
        r
    );
}

function drawAngleBetween(id, vertex, sideStart, sideEnd, r) {
    drawAngleArc(
        id,
        vertex.x,
        vertex.y,
        pointAngleDeg(vertex.x, vertex.y, sideStart.x, sideStart.y),
        pointAngleDeg(vertex.x, vertex.y, sideEnd.x, sideEnd.y),
        r
    );
}

// 三直角 (K形全等) 场景坐标求解
function solveCongruent(px) {
    // D(startX, centerY), E(endX, centerY)
    // AP = PB, AP ⊥ PB, 从而 AD = PE, EB = DP
    const dp = px - startX;
    const pe = endX - px;
    
    const ad = pe; // 全等关系
    const eb = dp;
    
    return {
        ax: startX,
        ay: centerY - ad,
        dx: startX,
        dy: centerY,
        px: px,
        py: centerY,
        ex: endX,
        ey: centerY,
        bx: endX,
        by: centerY - eb,
        ad: ad / 40.0, // 化为逻辑厘米单位
        dp: dp / 40.0,
        pe: pe / 40.0,
        eb: eb / 40.0
    };
}

// 一般三等角 (K形相似) 场景坐标求解
function solveSimilarity(px, alphaDeg) {
    const dp = px - startX;
    const pe = endX - px;
    const rad = (alphaDeg * Math.PI) / 180.0;
    
    // 为了展现相似 (不同大小)，让左侧三角形高度与右侧宽度呈相似比 (0.75倍)
    // 使得 AD != PE，避免直接全等
    const ad = pe * 0.75; 
    const eb = (dp * pe) / ad; // 由 AD * EB = DP * PE 解出 EB
    
    // A、B 必须在 D/E 向内侧发出的等角射线上，才能保证 ∠ADP = ∠APB = ∠PEB。
    const ax = startX + ad * Math.cos(rad);
    const ay = centerY - ad * Math.sin(rad);
    
    const bx = endX - eb * Math.cos(rad);
    const by = centerY - eb * Math.sin(rad);
    
    return {
        ax: ax,
        ay: ay,
        dx: startX,
        dy: centerY,
        px: px,
        py: centerY,
        ex: endX,
        ey: centerY,
        bx: bx,
        by: by,
        ad: ad / 40.0,
        dp: dp / 40.0,
        pe: pe / 40.0,
        eb: eb / 40.0
    };
}

// 等边三角形内折 (场景3) 场景坐标求解
function solveTriangleFold(px) {
    // 设等边三角形底边为 BC，B(startX), C(endX)，长度与底边一致
    const bx = startX;
    const cx = endX;
    const trBase = cx - bx; // 300
    
    // 等边三角形顶点 A
    const ax = (bx + cx) / 2; // 300
    const ay = centerY - trBase * Math.sin(60 * Math.PI / 180); // 320 - 360 * 0.866 = 8.2
    
    // 动点 P 限制在 BC 上
    // P 夹角 APQ = 60度，射线 PQ 与 AC 相交于 Q
    // 向量 PA
    const dx = ax - px;
    const dy = ay - centerY;
    
    // 顺时针旋转 60度 得到 PQ 射线向量 u (屏幕坐标系下顺时针为正)
    const beta = 60 * Math.PI / 180;
    const ux = dx * Math.cos(beta) - dy * Math.sin(beta);
    const uy = dx * Math.sin(beta) + dy * Math.cos(beta);
    
    // AC 边的方向向量 v = A - C
    const vx = ax - cx;
    const vy = ay - centerY;
    
    // 直线交点参数 t
    const denominator = ux * vy - uy * vx;
    let qx = cx;
    let qy = centerY;
    if (Math.abs(denominator) > 0.001) {
        const t = ((cx - px) * vy - (centerY - centerY) * vx) / denominator;
        qx = px + t * ux;
        qy = centerY + t * uy;
    }
    
    // 计算各段线段长度
    const lenAB = trBase / 40.0; // 等边三角形边长
    const lenBP = (px - bx) / 40.0;
    const lenPC = (cx - px) / 40.0;
    
    // CQ 长度
    const lenCQ = Math.sqrt((qx - cx)**2 + (qy - centerY)**2) / 40.0;
    
    return {
        ax: ax, ay: ay,
        bx: bx, by: centerY,
        cx: cx, cy: centerY,
        px: px, py: centerY,
        qx: qx, qy: qy,
        ab: lenAB,
        bp: lenBP,
        pc: lenPC,
        cq: lenCQ
    };
}

// 根据当前状态求解全部几何坐标
function getCurrentGeometry() {
    const px = startX + (pPosPercent / 100.0) * baseLength;
    if (currentScene === "congruent") {
        return solveCongruent(px);
    } else if (currentScene === "similarity") {
        return solveSimilarity(px, equalAngle);
    } else {
        return solveTriangleFold(px);
    }
}

// ==========================================================================
// LERP 循环引擎，处理数值平滑读数
// ==========================================================================
function runLerpLoop() {
    const geom = getCurrentGeometry();
    sandboxWrapper.dataset.scene = currentScene;
    sandboxWrapper.dataset.step = teachingStep;
    
    const target = {
        pPercent: pPosPercent,
        angle: equalAngle,
        ad: geom.ad || 0,
        dp: geom.dp || 0,
        pe: geom.pe || 0,
        eb: geom.eb || 0,
        ab: geom.ab || 0,
        bp: geom.bp || 0,
        pc: geom.pc || 0,
        cq: geom.cq || 0
    };
    
    let isChanged = false;
    const k = 0.15; // 缓动阻尼率
    
    for (let key in target) {
        const diff = target[key] - renderValues[key];
        if (Math.abs(diff) > 0.01) {
            renderValues[key] += diff * k;
            isChanged = true;
        } else {
            renderValues[key] = target[key];
        }
    }
    
    // 渲染几何画板
    renderGeometry(geom);
    // 刷新板书和飘浮卡片标签
    updateHTMLOverlayAndHUD(geom);
    
    if (isChanged || isAnimating) {
        requestAnimationFrame(runLerpLoop);
    }
}

// ==========================================================================
// SVG 渲染与 DOM 生成 (SVG Drawing & Dynamic Overlays)
// ==========================================================================

// 创建 SVG 射线
function drawRay(id, x1, y1, x2, y2, className) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", id);
    line.setAttribute("x1", `${x1}`);
    line.setAttribute("y1", `${y1}`);
    line.setAttribute("x2", `${x2}`);
    line.setAttribute("y2", `${y2}`);
    line.setAttribute("class", `geo-line-seg ${className}`);
    sandboxSvg.appendChild(line);
}

function drawSegment(id, x1, y1, x2, y2, className, extraClass = "") {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", id);
    line.setAttribute("x1", `${x1}`);
    line.setAttribute("y1", `${y1}`);
    line.setAttribute("x2", `${x2}`);
    line.setAttribute("y2", `${y2}`);
    line.setAttribute("class", `geo-line-seg ${className} ${extraClass}`.trim());
    sandboxSvg.appendChild(line);
    return line;
}

function drawTriangleFace(id, points, className) {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("id", id);
    polygon.setAttribute("points", points.map(point => `${point.x},${point.y}`).join(" "));
    polygon.setAttribute("class", `geo-triangle-face ${className}`);
    sandboxSvg.appendChild(polygon);
    return polygon;
}

// 创建 SVG 骨架虚线
function drawSkeleton(id, x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", id);
    line.setAttribute("x1", `${x1}`);
    line.setAttribute("y1", `${y1}`);
    line.setAttribute("x2", `${x2}`);
    line.setAttribute("y2", `${y2}`);
    line.setAttribute("class", "geo-line-skeleton");
    sandboxSvg.appendChild(line);
}

// 绘制等角扇形弧线
function drawAngleArc(id, cx, cy, startAngle, endAngle, r) {
    const delta = signedAngleDelta(startAngle, endAngle);
    const steps = Math.max(10, Math.ceil(Math.abs(delta) / 5));
    const points = [];
    for (let i = 0; i <= steps; i++) {
        points.push(polarToCartesian(cx, cy, startAngle + delta * (i / steps), r));
    }
    
    // 绘制扇形背景
    const pathDec = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathDec.setAttribute("d", `M ${cx} ${cy} L ${points.map(point => `${point.x} ${point.y}`).join(" L ")} Z`);
    pathDec.setAttribute("class", "geo-angle-sector");
    sandboxSvg.appendChild(pathDec);
    
    // 绘制圆弧描边
    const pathArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathArc.setAttribute("id", id);
    pathArc.setAttribute("d", `M ${points.map(point => `${point.x} ${point.y}`).join(" L ")}`);
    pathArc.setAttribute("class", `geo-angle-arc ${teachingStep === "angles" || teachingStep === "judge" ? "focus-angle" : ""}`.trim());
    sandboxSvg.appendChild(pathArc);
}

// 创建 HTML 浮动文字卡片标签
function createHTMLBraceLabel(id, x, y, text, className = "") {
    const label = document.createElement("div");
    label.setAttribute("id", id);
    label.setAttribute("class", `brace-label ${className}`);
    label.dataset.localX = String(x);
    label.dataset.localY = String(y);
    const screen = localToScreen(x, y);
    label.style.left = `${screen.x}px`;
    label.style.top = `${screen.y}px`;
    label.textContent = text;
    htmlOverlay.appendChild(label);
}

function createHTMLInfoCard(id, x, y, html, className = "") {
    const card = document.createElement("div");
    card.setAttribute("id", id);
    card.setAttribute("class", `canvas-info-card ${className}`);
    card.dataset.localX = String(x);
    card.dataset.localY = String(y);
    const screen = localToScreen(x, y);
    card.style.left = `${screen.x}px`;
    card.style.top = `${screen.y}px`;
    card.innerHTML = html;
    htmlOverlay.appendChild(card);
}

function createJudgeInfoCard(id, geom, html, className = "") {
    sandboxWrapper.querySelector(`#${id}`)?.remove();

    const card = document.createElement("div");
    card.setAttribute("id", id);
    card.setAttribute("class", `canvas-info-card ${className} fixed-corner`.trim());
    card.innerHTML = html;
    sandboxWrapper.appendChild(card);
}

// 辅助绘制几何端点和文字
function drawPoint(name, x, y, isDraggable, type = "p") {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `geo-point-wrapper ${isDraggable ? 'draggable' : ''}`);
    
    if (isDraggable) {
        group.setAttribute("id", `draggable-point-${type}`);
        
        // 隐形超大鼠标/触控捕获热区，触屏下更容易抓住 P 点。
        const capture = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        capture.setAttribute("cx", `${x}`);
        capture.setAttribute("cy", `${y}`);
        capture.setAttribute("r", "46");
        capture.setAttribute("class", "geo-point-hit");
        capture.setAttribute("fill", "transparent");
        capture.setAttribute("style", "pointer-events: all; cursor: grab; touch-action: none;");
        group.appendChild(capture);
    }
    
    // 呼吸灯光晕
    const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    halo.setAttribute("cx", `${x}`);
    halo.setAttribute("cy", `${y}`);
    halo.setAttribute("r", "15");
    halo.setAttribute("class", "geo-point-halo");
    group.appendChild(halo);
    
    // 实心核心圆
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", `${x}`);
    dot.setAttribute("cy", `${y}`);
    dot.setAttribute("r", `${isDraggable ? 7.5 : 6}`);
    dot.setAttribute("class", "geo-point");
    group.appendChild(dot);
    
    // 字母文本标签
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    if (name === "P") {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y + 24}`); // P 点在轴线正下方
        txt.setAttribute("style", "text-anchor: middle;");
    } else if (name === "D" || name === "B") {
        txt.setAttribute("x", `${x - 12}`);
        txt.setAttribute("y", `${y + 18}`);
        txt.setAttribute("style", "text-anchor: end;");
    } else if (name === "E" || name === "C") {
        txt.setAttribute("x", `${x + 12}`);
        txt.setAttribute("y", `${y + 18}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else {
        // A, Q 等顶点在上方
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y - 14}`);
        txt.setAttribute("style", "text-anchor: middle;");
    }
    txt.setAttribute("class", `geo-label ${isDraggable ? 'draggable' : ''}`);
    txt.textContent = name;
    group.appendChild(txt);
    
    sandboxSvg.appendChild(group);
    
    if (isDraggable) {
        bindPointDragEvents(group, type);
    }
}

// 绘制主几何图形
function renderGeometry(geom) {
    sandboxSvg.innerHTML = "";
    
    // 1. 绘制水平底线 L
    const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseLine.setAttribute("x1", `${startX - 40}`);
    baseLine.setAttribute("y1", `${centerY}`);
    baseLine.setAttribute("x2", `${endX + 40}`);
    baseLine.setAttribute("y2", `${centerY}`);
    baseLine.setAttribute("class", `geo-line-base ${teachingStep === "line" ? "focus-base" : ""}`.trim());
    sandboxSvg.appendChild(baseLine);
    
    if (isAnimating) {
        // 动画演示时，由动画渲染器绘制过渡态，此静态绘制退出
        return;
    }
    
    // 2. 根据场景渲染
    if (currentScene === "congruent" || currentScene === "similarity") {
        const ang = currentScene === "congruent" ? 90.0 : equalAngle;

        drawTriangleFace("face-left", [
            { x: geom.dx, y: geom.dy },
            { x: geom.ax, y: geom.ay },
            { x: geom.px, y: geom.py }
        ], "face-left");
        drawTriangleFace("face-right", [
            { x: geom.px, y: geom.py },
            { x: geom.ex, y: geom.ey },
            { x: geom.bx, y: geom.by }
        ], "face-right");

        drawAngleBetween(
            "arc-d",
            { x: geom.dx, y: geom.dy },
            { x: geom.px, y: geom.py },
            { x: geom.ax, y: geom.ay },
            28
        );
        drawAngleBetween(
            "arc-e",
            { x: geom.ex, y: geom.ey },
            { x: geom.bx, y: geom.by },
            { x: geom.px, y: geom.py },
            28
        );
        drawAngleBetween(
            "arc-p",
            { x: geom.px, y: geom.py },
            { x: geom.bx, y: geom.by },
            { x: geom.ax, y: geom.ay },
            34
        );

        drawSegment("ray-da", geom.dx, geom.dy, geom.ax, geom.ay, "seg-a", "left-model-edge");
        drawSegment("ray-eb", geom.ex, geom.ey, geom.bx, geom.by, "seg-b", "right-model-edge");
        drawSegment("line-ap", geom.ax, geom.ay, geom.px, geom.py, "seg-a", "left-model-edge");
        drawSegment("line-pb", geom.px, geom.py, geom.bx, geom.by, "seg-b", "right-model-edge");
        drawSegment("seg-dp", geom.dx, geom.dy, geom.px, geom.py, "seg-c", "baseline-part left-base-part");
        drawSegment("seg-pe", geom.px, geom.py, geom.ex, geom.ey, "seg-c", "baseline-part right-base-part");
        
        // 绘制各顶点端点
        drawPoint("D", geom.dx, geom.dy, false);
        drawPoint("E", geom.ex, geom.ey, false);
        drawPoint("P", geom.px, geom.py, true, "p"); // P 可拖动
        drawPoint("A", geom.ax, geom.ay, false);
        drawPoint("B", geom.bx, geom.by, false);
        
    } else {
        // 等边三角形内折场景
        
        drawTriangleFace("face-fold-left", [
            { x: geom.ax, y: geom.ay },
            { x: geom.bx, y: geom.by },
            { x: geom.px, y: geom.py }
        ], "face-left");
        drawTriangleFace("face-fold-right", [
            { x: geom.px, y: geom.py },
            { x: geom.cx, y: geom.cy },
            { x: geom.qx, y: geom.qy }
        ], "face-right");

        // 绘制等边三角形 ABC 骨架 (细灰线)
        drawSkeleton("skel-ab", geom.bx, geom.by, geom.ax, geom.ay);
        drawSkeleton("skel-ac", geom.ax, geom.ay, geom.cx, geom.cy);
        
        drawAngleBetween(
            "arc-b",
            { x: geom.bx, y: geom.by },
            { x: geom.px, y: geom.py },
            { x: geom.ax, y: geom.ay },
            28
        );
        drawAngleBetween(
            "arc-c",
            { x: geom.cx, y: geom.cy },
            { x: geom.qx, y: geom.qy },
            { x: geom.px, y: geom.py },
            28
        );
        drawAngleBetween(
            "arc-p-60",
            { x: geom.px, y: geom.py },
            { x: geom.qx, y: geom.qy },
            { x: geom.ax, y: geom.ay },
            32
        );
        
        drawSegment("line-ap", geom.ax, geom.ay, geom.px, geom.py, "seg-a", "left-model-edge");
        drawSegment("line-pq", geom.px, geom.py, geom.qx, geom.qy, "seg-b", "right-model-edge");
        drawSegment("seg-bp", geom.bx, geom.by, geom.px, geom.py, "seg-c", "baseline-part left-base-part");
        drawSegment("seg-pc", geom.px, geom.py, geom.cx, geom.cy, "seg-c", "baseline-part right-base-part");
        drawSegment("seg-cq", geom.cx, geom.cy, geom.qx, geom.qy, "seg-b", "right-model-edge");
        drawSkeleton("skel-qa", geom.qx, geom.qy, geom.ax, geom.ay);
        
        // 端点
        drawPoint("B", geom.bx, geom.by, false);
        drawPoint("C", geom.cx, geom.cy, false);
        drawPoint("P", geom.px, geom.py, true, "p"); // P 可拖动
        drawPoint("A", geom.ax, geom.ay, false);
        drawPoint("Q", geom.qx, geom.qy, false);
    }
}

// 刷新浮动 HTML 数值标签与 HUD 板书内容
function updateHTMLOverlayAndHUD(geom) {
    htmlOverlay.innerHTML = "";
    sandboxWrapper.querySelector("#card-conclusion")?.remove();
    
    if (isAnimating) {
        // 动画进行时，由动画器接管 HUD 和 HTML Overlay
        return;
    }
    
    if (currentScene === "congruent" || currentScene === "similarity") {
        if (teachingStep === "line") {
            createHTMLBraceLabel("lbl-line", (geom.dx + geom.ex) / 2, geom.dy + 34, "D、P、E 在同一直线上", "line-tag");
        }

        if (teachingStep === "angles") {
            const angleText = currentScene === "congruent" ? "90°" : "α";
            const ptArcD = angleLabelBetween(
                { x: geom.dx, y: geom.dy },
                { x: geom.px, y: geom.py },
                { x: geom.ax, y: geom.ay },
                48
            );
            createHTMLBraceLabel("lbl-arc-d", ptArcD.x - 10, ptArcD.y - 10, angleText, "sub angle-tag");

            const ptArcE = angleLabelBetween(
                { x: geom.ex, y: geom.ey },
                { x: geom.bx, y: geom.by },
                { x: geom.px, y: geom.py },
                48
            );
            createHTMLBraceLabel("lbl-arc-e", ptArcE.x + 10, ptArcE.y - 10, angleText, "sub angle-tag");

            const ptArcP = angleLabelBetween(
                { x: geom.px, y: geom.py },
                { x: geom.bx, y: geom.by },
                { x: geom.ax, y: geom.ay },
                58
            );
            createHTMLBraceLabel("lbl-arc-p", ptArcP.x, ptArcP.y - 12, angleText, "sub angle-tag strong");
        }

        if (teachingStep === "extract") {
            createHTMLBraceLabel("lbl-left-triangle", (geom.dx + geom.ax + geom.px) / 3 - 10, (geom.dy + geom.ay + geom.py) / 3 - 14, "△ADP", "triangle-tag left-tag");
            createHTMLBraceLabel("lbl-right-triangle", (geom.px + geom.ex + geom.bx) / 3 + 10, (geom.py + geom.ey + geom.by) / 3 - 14, "△PEB", "triangle-tag right-tag");
        }

        if (teachingStep === "judge") {
            const prodLeft = renderValues.ad * renderValues.eb;
            const prodRight = renderValues.dp * renderValues.pe;
            const conclusion = currentScene === "congruent"
                ? `<b>△ADP ≅ △PEB</b><span>AD = PE，DP = EB</span>`
                : `<b>△ADP ∽ △PEB</b><span>AD × EB = DP × PE</span>`;
            const values = currentScene === "congruent"
                ? `${renderValues.ad.toFixed(1)} = ${renderValues.pe.toFixed(1)} ｜ ${renderValues.dp.toFixed(1)} = ${renderValues.eb.toFixed(1)}`
                : `${prodLeft.toFixed(2)} ≈ ${prodRight.toFixed(2)}`;
            createJudgeInfoCard("card-conclusion", geom, `${conclusion}<em>${values}</em>`, "judge-card compact");
        }
        
    } else {
        if (teachingStep === "line") {
            createHTMLBraceLabel("lbl-line", (geom.bx + geom.cx) / 2, geom.by + 34, "B、P、C 在同一直线上", "line-tag");
        }

        if (teachingStep === "angles") {
            const ptArcB = angleLabelBetween(
                { x: geom.bx, y: geom.by },
                { x: geom.px, y: geom.py },
                { x: geom.ax, y: geom.ay },
                48
            );
            createHTMLBraceLabel("lbl-arc-b", ptArcB.x - 8, ptArcB.y - 10, `60°`, "sub angle-tag");

            const ptArcC = angleLabelBetween(
                { x: geom.cx, y: geom.cy },
                { x: geom.qx, y: geom.qy },
                { x: geom.px, y: geom.py },
                48
            );
            createHTMLBraceLabel("lbl-arc-c", ptArcC.x + 8, ptArcC.y - 10, `60°`, "sub angle-tag");

            const ptArcP = angleLabelBetween(
                { x: geom.px, y: geom.py },
                { x: geom.qx, y: geom.qy },
                { x: geom.ax, y: geom.ay },
                58
            );
            createHTMLBraceLabel("lbl-arc-p-60", ptArcP.x, ptArcP.y - 12, `60°`, "sub angle-tag strong");
        }

        if (teachingStep === "extract") {
            createHTMLBraceLabel("lbl-left-triangle", (geom.ax + geom.bx + geom.px) / 3 - 10, (geom.ay + geom.by + geom.py) / 3 - 12, "△ABP", "triangle-tag left-tag");
            createHTMLBraceLabel("lbl-right-triangle", (geom.px + geom.cx + geom.qx) / 3 + 12, (geom.py + geom.cy + geom.qy) / 3 - 12, "△PCQ", "triangle-tag right-tag");
        }

        if (teachingStep === "judge") {
            const prodLeft = renderValues.ab * renderValues.cq;
            const prodRight = renderValues.bp * renderValues.pc;
            createJudgeInfoCard("card-conclusion", geom, `<b>△ABP ∽ △PCQ</b><span>AB × CQ = BP × PC</span><em>${prodLeft.toFixed(2)} ≈ ${prodRight.toFixed(2)}</em>`, "judge-card compact");
        }
    }
    
    // 3. 动态刷新 HUD 板书内容
    updateChalkboardHUD();
}

// 刷新 HUD 板书算式
function updateChalkboardHUD() {
    let html = "";
    
    if (currentScene === "congruent") {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">已知条件</div>
                <div class="hud-row-val">
                    直线 L 上有等角：
                    <span class="math-seg seg-a">∠ADP</span> = 
                    <span class="math-seg seg-a">∠APB</span> = 
                    <span class="math-seg seg-a">∠PEB</span> = 90°
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">余角互余推导</div>
                <div class="hud-row-val">
                    ∵ ∠APD + ∠APB + ∠BPE = 180°，∠APB = 90°<br>
                    &rArr; ∠APD + ∠BPE = 90°<br>
                    ∵ 在 Rt△ADP 中，∠DAP + ∠APD = 90°<br>
                    &rArr; <span style="color:var(--purple); font-weight:700;">∠DAP = ∠BPE</span>
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">全等判定与对应边</div>
                <div class="hud-row-val">
                    在 △ADP 和 △PEB 中：∠ADP = ∠PEB = 90°，∠DAP = ∠BPE，且 AP = PB<br>
                    &rArr; <strong>△ADP ≅ △PEB (AAS)</strong>
                </div>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">全等对应边相等恒等式</div>
                <div class="formula">
                    <span>AD = PE &rArr; <span class="math-num">${renderValues.ad.toFixed(1)}</span> = <span class="math-num">${renderValues.pe.toFixed(1)}</span></span>
                    <span>DP = EB &rArr; <span class="math-num">${renderValues.dp.toFixed(1)}</span> = <span class="math-num">${renderValues.eb.toFixed(1)}</span></span>
                </div>
            </div>
        `;
    } else if (currentScene === "similarity") {
        const prodLeft = renderValues.ad * renderValues.eb;
        const prodRight = renderValues.dp * renderValues.pe;
        
        html = `
            <div class="hud-row">
                <div class="hud-row-label">已知条件</div>
                <div class="hud-row-val">
                    直线 L 上有等角：
                    <span class="math-seg seg-a">∠ADP</span> = 
                    <span class="math-seg seg-a">∠APB</span> = 
                    <span class="math-seg seg-a">∠PEB</span> = 
                    <span class="math-num">${renderValues.angle.toFixed(0)}°</span>
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">相似证明步骤</div>
                <div class="hud-row-val">
                    ∵ ∠APD + ∠BPE = 180° - ∠APB = 180° - α<br>
                    ∵ 在 △ADP 中，∠DAP + ∠APD = 180° - α<br>
                    &rArr; <span style="color:var(--purple); font-weight:700;">∠DAP = ∠BPE</span> 且 ∠ADP = ∠PEB = α<br>
                    &rArr; <strong>△ADP ∽ △PEB (两角对应相等)</strong>
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">相似对应边比例式</div>
                <div class="hud-row-val">
                    AD : PE = DP : EB &nbsp;&rArr;&nbsp; 
                    <span class="math-seg seg-a">AD</span> &times; <span class="math-seg seg-b">EB</span> = 
                    <span class="math-seg seg-c">DP</span> &times; <span class="math-seg seg-c">PE</span>
                </div>
            </div>
            <div class="hud-equation-box">
                <div class="title">相似乘积守恒等式</div>
                <div class="formula">
                    <span>AD &times; EB = <span class="math-num">${renderValues.ad.toFixed(1)}</span> &times; <span class="math-num">${renderValues.eb.toFixed(1)}</span> = <span class="math-num highlight">${prodLeft.toFixed(2)}</span></span>
                    <span>DP &times; PE = <span class="math-num">${renderValues.dp.toFixed(1)}</span> &times; <span class="math-num">${renderValues.pe.toFixed(1)}</span> = <span class="math-num highlight">${prodRight.toFixed(2)}</span></span>
                </div>
            </div>
        `;
    } else {
        // 等边三角形内折相似
        const prodLeft = renderValues.ab * renderValues.cq; // AB * CQ
        const prodRight = renderValues.bp * renderValues.pc; // BP * PC
        
        html = `
            <div class="hud-row">
                <div class="hud-row-label">等边内折已知</div>
                <div class="hud-row-val">
                    等边 △ABC 中，∠B = ∠C = ∠APQ = 60°，P 在 BC 上滑动
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">相似推导过程</div>
                <div class="hud-row-val">
                    ∵ ∠APB + ∠APC = 180° &rArr; ∠APB + ∠CPQ = 120°<br>
                    ∵ 在 △ABP 中，∠BAP + ∠APB = 120°<br>
                    &rArr; <span style="color:var(--purple); font-weight:700;">∠BAP = ∠CPQ</span> 且 ∠B = ∠C = 60°<br>
                    &rArr; <strong>△ABP ∽ △PCQ (两角对应相等)</strong>
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">相似对应边比例</div>
                <div class="hud-row-val">
                    AB : PC = BP : CQ &nbsp;&rArr;&nbsp; 
                    <span class="math-seg seg-a">AB</span> &times; <span class="math-seg seg-a">CQ</span> = 
                    <span class="math-seg seg-b">BP</span> &times; <span class="math-seg seg-b">PC</span>
                </div>
            </div>
            <div class="hud-equation-box">
                <div class="title">内折相似乘积等式</div>
                <div class="formula">
                    <span>AB &times; CQ = <span class="math-num">${renderValues.ab.toFixed(1)}</span> &times; <span class="math-num">${renderValues.cq.toFixed(1)}</span> = <span class="math-num highlight">${prodLeft.toFixed(2)}</span></span>
                    <span>BP &times; PC = <span class="math-num">${renderValues.bp.toFixed(1)}</span> &times; <span class="math-num">${renderValues.pc.toFixed(1)}</span> = <span class="math-num highlight">${prodRight.toFixed(2)}</span></span>
                </div>
            </div>
        `;
    }
    
    stepsChalkboard.innerHTML = html;
}

// ==========================================================================
// 拖动交互处理器 (Point Drag Manager)
// ==========================================================================
function bindPointDragEvents(group, type) {
    let isDragging = false;
    let activePointerId = null;
    let lastPointerType = "mouse";
    
    function getClient(e) {
        const touch = e.touches?.[0] || e.changedTouches?.[0];
        return {
            x: touch ? touch.clientX : e.clientX,
            y: touch ? touch.clientY : e.clientY
        };
    }

    function beginDrag(pointerType = "mouse") {
        isDragging = true;
        lastPointerType = pointerType;
        group.classList.add("is-dragging");
        sandboxWrapper.classList.add("point-dragging");
    }

    function applyDrag(clientX, pointerType = "mouse") {
        const rect = sandboxWrapper.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        
        // 缩放/平移状态下的坐标反算
        let newX = (mouseX - panX) / zoomScale;
        if (newX < startX + 0.15 * baseLength) newX = startX + 0.15 * baseLength;
        if (newX > startX + 0.85 * baseLength) newX = startX + 0.85 * baseLength;
        
        // 鼠标保留磁吸读数；触屏/手写笔自由拖动，避免平板上出现“拖不动”的卡顿感。
        if (pointerType === "mouse") {
            const snap = 10;
            const relativeX = newX - startX;
            const snappedRel = Math.round(relativeX / snap) * snap;
            newX = startX + snappedRel;
        }
        
        // 反算百分比
        pPosPercent = (newX - startX) / baseLength * 100;
        sliderPPos.value = pPosPercent;
        valPPos.textContent = `${pPosPercent.toFixed(0)}%`;
        
        // 触发 LERP 平滑更新
        runLerpLoop();
    }

    function finishDrag() {
        if (!isDragging) return;
        isDragging = false;
        activePointerId = null;
        group.classList.remove("is-dragging");
        sandboxWrapper.classList.remove("point-dragging");
        runLerpLoop();
    }

    if (window.PointerEvent) {
        function onPointerStart(e) {
            if (isAnimating || (typeof e.button === "number" && e.button !== 0)) return;
            activePointerId = e.pointerId;
            beginDrag(e.pointerType || "mouse");
            try {
                group.setPointerCapture?.(e.pointerId);
            } catch (error) {
                // 部分内嵌浏览器在 SVG 重绘时会拒绝捕获，document 监听兜底。
            }
            document.addEventListener("pointermove", onPointerMove, { passive: false });
            document.addEventListener("pointerup", onPointerEnd);
            document.addEventListener("pointercancel", onPointerEnd);
            e.preventDefault();
            e.stopPropagation();
        }

        function onPointerMove(e) {
            if (!isDragging || isAnimating || e.pointerId !== activePointerId) return;
            applyDrag(e.clientX, e.pointerType || lastPointerType);
            e.preventDefault();
            e.stopPropagation();
        }

        function onPointerEnd(e) {
            if (activePointerId !== null && e.pointerId !== activePointerId) return;
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerEnd);
            document.removeEventListener("pointercancel", onPointerEnd);
            try {
                group.releasePointerCapture?.(e.pointerId);
            } catch (error) {
                // 节点可能已随 SVG 重绘移除，忽略释放失败。
            }
            finishDrag();
        }

        group.addEventListener("pointerdown", onPointerStart, { passive: false });
        return;
    }
    
    function onStart(e) {
        if (isAnimating) return;
        beginDrag(e.touches ? "touch" : "mouse");
        
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
        document.addEventListener("touchcancel", onEnd);
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    function onMove(e) {
        if (!isDragging || isAnimating) return;
        const client = getClient(e);
        applyDrag(client.x, e.touches ? "touch" : "mouse");
        e.preventDefault();
        e.stopPropagation();
    }
    
    function onEnd() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
        document.removeEventListener("touchcancel", onEnd);
        finishDrag();
    }
    
    group.addEventListener("mousedown", onStart);
    group.addEventListener("touchstart", onStart, { passive: false });
}

// ==========================================================================
// 旋转全等与翻叠动画播放器 (Rotation & Fold Congruent Animation)
// ==========================================================================
function playCongruentAnimation() {
    if (isAnimating || currentScene !== "congruent") return;
    isAnimating = true;
    disableControls(true);
    
    const geom = solveCongruent(startX + (pPosPercent / 100.0) * baseLength);
    const duration = 1500; // 动画时长 1.5 秒
    const startTime = performance.now();
    
    // 旋转目标：左侧三角形 △ADP 以 P 为中心旋转重合到右侧 △PEB
    // 终点状态：A -> P, D -> E, P -> B
    // 旋转前的初始位置 (D, A, P)
    const initA = { x: geom.ax, y: geom.ay };
    const initD = { x: geom.dx, y: geom.dy };
    const initP = { x: geom.px, y: geom.py };
    
    // 终点位置
    const destA = { x: geom.px, y: geom.py }; // A 移至 P
    const destD = { x: geom.ex, y: geom.ey }; // D 移至 E
    const destP = { x: geom.bx, y: geom.by }; // P 移至 B
    
    function animate(now) {
        const elapsed = now - startTime;
        let progress = Math.min(1.0, elapsed / duration);
        
        // EaseInOutCubic 缓动函数
        progress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // 计算过渡态的三个顶点坐标 (线性插值插出完美重合动画)
        const curAx = initA.x + (destA.x - initA.x) * progress;
        const curAy = initA.y + (destA.y - initA.y) * progress;
        
        const curDx = initD.x + (destD.x - initD.x) * progress;
        const curDy = initD.y + (destD.y - initD.y) * progress;
        
        const curPx = initP.x + (destP.x - initP.x) * progress;
        const curPy = initP.y + (destP.y - initP.y) * progress;
        
        // 渲染过渡态
        renderAnimationStep(geom, curAx, curAy, curDx, curDy, curPx, curPy, progress);
        
        if (progress < 1.0) {
            requestAnimationFrame(animate);
        } else {
            // 重合瞬间，在 E 点和 B 点引爆粒子火花
            const rect = sandboxWrapper.getBoundingClientRect();
            const expEX = rect.left + panX + geom.ex * zoomScale;
            const expEY = rect.top + panY + geom.ey * zoomScale;
            const expBX = rect.left + panX + geom.bx * zoomScale;
            const expBY = rect.top + panY + geom.by * zoomScale;
            triggerExplosion(expEX, expEY, ["#3b82f6", "#10b981", "#ffffff"], 35);
            triggerExplosion(expBX, expBY, ["#3b82f6", "#10b981", "#ffffff"], 30);
            
            // 保持高亮重合 600ms，然后恢复静态状态
            setTimeout(() => {
                isAnimating = false;
                disableControls(false);
                runLerpLoop();
            }, 600);
        }
    }
    
    requestAnimationFrame(animate);
}

// 渲染动画单帧
function renderAnimationStep(geom, curAx, curAy, curDx, curDy, curPx, curPy, progress) {
    sandboxSvg.innerHTML = "";
    htmlOverlay.innerHTML = "";
    
    // 1. 绘制水平底线 L
    const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseLine.setAttribute("x1", `${startX - 40}`);
    baseLine.setAttribute("y1", `${centerY}`);
    baseLine.setAttribute("x2", `${endX + 40}`);
    baseLine.setAttribute("y2", `${centerY}`);
    baseLine.setAttribute("class", "geo-line-base");
    sandboxSvg.appendChild(baseLine);
    
    // 2. 绘制右侧目标三角形 △PEB 虚线骨架 (表明重合目的地)
    drawSkeleton("dest-pe", geom.px, geom.py, geom.ex, geom.ey);
    drawSkeleton("dest-eb", geom.ex, geom.ey, geom.bx, geom.by);
    drawSkeleton("dest-bp", geom.bx, geom.by, geom.px, geom.py);
    
    // 3. 绘制左侧原位置虚线骨架
    drawSkeleton("orig-da", geom.dx, geom.dy, geom.ax, geom.ay);
    drawSkeleton("orig-ap", geom.ax, geom.ay, geom.px, geom.py);
    drawSkeleton("orig-pd", geom.px, geom.py, geom.dx, geom.dy);
    
    // 4. 绘制运动中的过渡三角形 (发光霓虹特效，突出全等变换)
    // 绘制直角弧线 (在过渡直角顶点 curD 处)
    // 计算向量 DA 和 DP 的旋转角以动态画出直角标志
    const angDA = Math.atan2(curAy - curDy, curAx - curDx) * 180.0 / Math.PI;
    const angDP = Math.atan2(curPy - curDy, curPx - curDx) * 180.0 / Math.PI;
    drawAngleArc("arc-rot-d", curDx, curDy, -angDP, -angDA, 18);
    
    // 绘制过渡三角形的三条边
    const gLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine1.setAttribute("x1", `${curDx}`); gLine1.setAttribute("y1", `${curDy}`);
    gLine1.setAttribute("x2", `${curAx}`); gLine1.setAttribute("y2", `${curAy}`);
    gLine1.setAttribute("class", "geo-line-seg seg-a");
    gLine1.setAttribute("style", "stroke-width: 4px; filter: drop-shadow(0 0 6px var(--primary));");
    sandboxSvg.appendChild(gLine1);
    
    const gLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine2.setAttribute("x1", `${curDx}`); gLine2.setAttribute("y1", `${curDy}`);
    gLine2.setAttribute("x2", `${curPx}`); gLine2.setAttribute("y2", `${curPy}`);
    gLine2.setAttribute("class", "geo-line-seg seg-c");
    gLine2.setAttribute("style", "stroke-dasharray: none; stroke-width: 4px;");
    sandboxSvg.appendChild(gLine2);
    
    const gLine3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine3.setAttribute("x1", `${curAx}`); gLine3.setAttribute("y1", `${curAy}`);
    gLine3.setAttribute("x2", `${curPx}`); gLine3.setAttribute("y2", `${curPy}`);
    gLine3.setAttribute("class", "geo-line-seg");
    gLine3.setAttribute("style", "stroke: var(--purple); stroke-width: 4.5px; filter: drop-shadow(0 0 6px var(--purple));");
    sandboxSvg.appendChild(gLine3);
    
    // 5. 绘制三个过渡顶点
    drawPoint("A", curAx, curAy, false);
    drawPoint("D", curDx, curDy, false);
    drawPoint("P", curPx, curPy, false);
    
    // 6. 实时刷新 HUD 和过渡标签内容
    createHTMLBraceLabel("lbl-anim", (curAx + curPx)/2, (curAy + curPy)/2 - 16, `重合: ${(progress * 100).toFixed(0)}%`, "main");
    
    // 刷新临时 HUD 板书
    stepsChalkboard.innerHTML = `
        <div class="hud-row">
            <div class="hud-row-label">全等变换演示中</div>
            <div class="hud-row-val" style="color:var(--primary); font-weight:700;">
                正在将 △ADP 绕点 P 顺时针旋转 90° 并平移...
            </div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">顶点重合匹配</div>
            <div class="hud-row-val">
                斜边 AP &rArr; BP (完全重合)<br>
                直角边 AD &rArr; PE (完全贴合)<br>
                直角边 DP &rArr; EB (完全贴合)
            </div>
        </div>
        <div class="hud-equation-box success-box">
            <div class="title">动画进度</div>
            <div class="formula">
                <span>旋转重合度：<span class="math-num">${(progress * 100).toFixed(0)}%</span></span>
            </div>
        </div>
    `;
}

// ==========================================================================
// 画布缩放与平移控制核心 (Zoom & Pan Core Engine)
// ==========================================================================
function getSandboxSize() {
    const rect = sandboxWrapper.getBoundingClientRect();
    return {
        w: rect.width || sandboxWrapper.clientWidth || 800,
        h: rect.height || sandboxWrapper.clientHeight || 600
    };
}

function snapCssPixel(value) {
    const ratio = window.devicePixelRatio || 1;
    return Math.round(value * ratio) / ratio;
}

function localToScreen(x, y) {
    return {
        x: snapCssPixel(x * zoomScale + panX),
        y: snapCssPixel(y * zoomScale + panY)
    };
}

function updateSvgViewport() {
    const { w, h } = getSandboxSize();
    const scale = Math.max(0.001, zoomScale);
    sandboxSvg.setAttribute("viewBox", `${-panX / scale} ${-panY / scale} ${w / scale} ${h / scale}`);
    sandboxSvg.style.transform = "";
    htmlOverlay.style.transform = "";
}

function positionOverlayLabels() {
    htmlOverlay.querySelectorAll("[data-local-x][data-local-y]").forEach((el) => {
        const x = Number(el.dataset.localX);
        const y = Number(el.dataset.localY);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const screen = localToScreen(x, y);
        el.style.left = `${screen.x}px`;
        el.style.top = `${screen.y}px`;
    });
}

function applyTransform() {
    updateSvgViewport();
    positionOverlayLabels();
}

function centerModel(forceScale = null) {
    const rect = sandboxWrapper.getBoundingClientRect();
    const W = rect.width || 800;
    const H = rect.height || 600;
    
    // 模型内部坐标中心点及尺寸
    const modelCX = 300;
    const modelCY = currentScene === "triangle-fold" ? 205 : 245;
    
    if (forceScale !== null) {
        zoomScale = forceScale;
    } else {
        // 自适应最佳缩放大小
        const modelW = currentScene === "triangle-fold" ? 380 : 420;
        const modelH = currentScene === "triangle-fold" ? 350 : 300;
        const scaleX = W / modelW;
        const scaleY = H / modelH;
        zoomScale = Math.min(scaleX, scaleY);
        // 限制自适应的缩放范围
        if (zoomScale < 0.65) zoomScale = 0.65;
        if (zoomScale > 1.48) zoomScale = 1.48;
    }
    
    panX = W / 2 - modelCX * zoomScale;
    panY = H / 2 - modelCY * zoomScale;
    
    applyTransform();
}

function zoomAtCenter(factor) {
    const rect = sandboxWrapper.getBoundingClientRect();
    const W = rect.width || 800;
    const H = rect.height || 600;
    const midX = W / 2;
    const midY = H / 2;
    
    const internalX = (midX - panX) / zoomScale;
    const internalY = (midY - panY) / zoomScale;
    
    zoomScale *= factor;
    if (zoomScale < 0.4) zoomScale = 0.4;
    if (zoomScale > 4.0) zoomScale = 4.0;
    
    panX = midX - internalX * zoomScale;
    panY = midY - internalY * zoomScale;
    
    applyTransform();
}

function bindCanvasZoomEvents() {
    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const rect = sandboxWrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const internalX = (mouseX - panX) / zoomScale;
        const internalY = (mouseY - panY) / zoomScale;
        
        const zoomFactor = 1.1;
        if (e.deltaY < 0) {
            zoomScale *= zoomFactor;
        } else {
            zoomScale /= zoomFactor;
        }
        
        if (zoomScale < 0.4) zoomScale = 0.4;
        if (zoomScale > 4.0) zoomScale = 4.0;
        
        panX = mouseX - internalX * zoomScale;
        panY = mouseY - internalY * zoomScale;
        
        applyTransform();
    }, { passive: false });
}

function bindCanvasPanEvents() {
    sandboxWrapper.addEventListener("mousedown", onPanStart);
    sandboxWrapper.addEventListener("touchstart", onPanStart, { passive: false });
}

function onPanStart(e) {
    if (isAnimating) return;
    // 如果点击在几何点、按钮或HUD面板上，不触发画布拖拽平移
    if (e.target.closest(".draggable") || e.target.closest(".btn-zoom") || e.target.closest(".hud-panel") || e.target.closest(".btn-icon")) {
        return;
    }
    
    // 双指手势判断 (移动端)
    if (e.touches && e.touches.length === 2) {
        isPanning = false;
        isPinchZooming = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
        e.preventDefault();
        return;
    }
    
    isPanning = true;
    sandboxWrapper.classList.add("panning");
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startPanMouseX = clientX;
    startPanMouseY = clientY;
    startPanX = panX;
    startPanY = panY;
    
    document.addEventListener("mousemove", onPanMove);
    document.addEventListener("mouseup", onPanEnd);
    document.addEventListener("touchmove", onPanMove, { passive: false });
    document.addEventListener("touchend", onPanEnd);
    
    e.preventDefault();
}

function onPanMove(e) {
    // 移动端捏合缩放
    if (isPinchZooming && e.touches && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (lastTouchDist > 0) {
            const ratio = dist / lastTouchDist;
            const rect = sandboxWrapper.getBoundingClientRect();
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            
            const internalX = (midX - panX) / zoomScale;
            const internalY = (midY - panY) / zoomScale;
            
            zoomScale *= ratio;
            if (zoomScale < 0.4) zoomScale = 0.4;
            if (zoomScale > 4.0) zoomScale = 4.0;
            
            panX = midX - internalX * zoomScale;
            panY = midY - internalY * zoomScale;
            
            applyTransform();
        }
        lastTouchDist = dist;
        e.preventDefault();
        return;
    }
    
    if (!isPanning) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - startPanMouseX;
    const dy = clientY - startPanMouseY;
    
    panX = startPanX + dx;
    panY = startPanY + dy;
    
    applyTransform();
    e.preventDefault();
}

function onPanEnd() {
    isPanning = false;
    isPinchZooming = false;
    lastTouchDist = 0;
    sandboxWrapper.classList.remove("panning");
    
    document.removeEventListener("mousemove", onPanMove);
    document.removeEventListener("mouseup", onPanEnd);
    document.removeEventListener("touchmove", onPanMove);
    document.removeEventListener("touchend", onPanEnd);
}

// ==========================================================================
// 状态管理与事件绑定 (State Control & Event Bindings)
// ==========================================================================

// 场景切换载入器
function loadScene(scene) {
    if (isAnimating) return;
    currentScene = scene;
    sandboxWrapper.dataset.scene = scene;
    
    // 更新 Preset Tab 样式
    document.querySelectorAll(".btn-preset").forEach(btn => {
        if (btn.getAttribute("data-scene") === scene) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // 显隐滑块与操作按钮
    if (scene === "congruent") {
        sliderEqualAngle.parentElement.style.display = "none";
        btnPlayRotation.style.display = "inline-flex";
    } else if (scene === "similarity") {
        sliderEqualAngle.parentElement.style.display = "flex";
        btnPlayRotation.style.display = "none";
    } else {
        // 等边三角形内折
        sliderEqualAngle.parentElement.style.display = "none";
        btnPlayRotation.style.display = "none";
    }
    
    // 重置滑块范围限制
    if (scene === "triangle-fold") {
        sliderPPos.min = 15;
        sliderPPos.max = 85;
    } else {
        sliderPPos.min = 15;
        sliderPPos.max = 85;
    }
    
    // 定理卡片文本更新
    updateTheoryCard(scene);
    
    // 重新运行 LERP 引擎
    runLerpLoop();
    // 场景切换时自动执行居中对齐
    centerModel();
}

function setTeachingStep(step) {
    if (!["line", "angles", "extract", "judge"].includes(step)) return;
    teachingStep = step;
    sandboxWrapper.dataset.step = step;
    document.querySelectorAll(".btn-step").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-step") === step);
    });
    updateTheoryCard(currentScene);
    runLerpLoop();
}

function playTeachingDemo() {
    if (isAnimating || isTeachingDemo) return;
    isTeachingDemo = true;
    const steps = ["line", "angles", "extract", "judge"];
    let index = 0;
    btnTeachDemo.disabled = true;
    btnTeachDemo.classList.add("is-running");
    btnTeachDemo.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,7H13V13H11V7M11,15H13V17H11V15Z"/></svg>
        演示中
    `;

    function nextStep() {
        setTeachingStep(steps[index]);
        index += 1;
        if (index < steps.length) {
            setTimeout(nextStep, index === 1 ? 900 : 1150);
            return;
        }
        setTimeout(() => {
            isTeachingDemo = false;
            btnTeachDemo.disabled = false;
            btnTeachDemo.classList.remove("is-running");
            btnTeachDemo.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
                自动演示一遍
            `;
        }, 1450);
    }

    nextStep();
}

// 讲解卡片文本
function updateTheoryCard(scene) {
    const sceneMeta = {
        congruent: {
            title: "三直角全等",
            triangles: "△ADP 与 △PEB",
            condition: "∠ADP = ∠APB = ∠PEB = 90°",
            judge: "AAS 判定全等",
            conclusion: "AD = PE，DP = EB",
            note: "这是一般三等角模型的直角特例。"
        },
        similarity: {
            title: "一般三等角",
            triangles: "△ADP 与 △PEB",
            condition: "∠ADP = ∠APB = ∠PEB = α",
            judge: "AA 判定相似",
            conclusion: "AD × EB = DP × PE",
            note: "先看相似，再把 90° 看成特例。"
        },
        "triangle-fold": {
            title: "等边内折",
            triangles: "△ABP 与 △PCQ",
            condition: "∠B = ∠APQ = ∠C = 60°",
            judge: "AA 判定相似",
            conclusion: "AB × CQ = BP × PC",
            note: "等边三角形里的一线三等角变式。"
        }
    };
    const stepMeta = {
        line: ["找一线", "先确认三个关键点共线，这是模型能启动的底座。"],
        angles: ["标等角", "只抓三个相等角，不急着看边长和结论。"],
        extract: ["抽模型", "把左右两个对应三角形从大图里抽出来。"],
        judge: ["判定", "用 AA 相似或特殊全等推出边的关系。"]
    };
    const meta = sceneMeta[scene];
    const step = stepMeta[teachingStep];

    theoryTitle.innerHTML = `${meta.title}｜${step[0]}`;
    theoryText.innerHTML = `
        <div class="theory-mini-card">
            <span>看哪两个</span>
            <strong>${meta.triangles}</strong>
        </div>
        <div class="theory-mini-card">
            <span>已知等角</span>
            <strong>${meta.condition}</strong>
        </div>
        <div class="theory-mini-card">
            <span>判定方法</span>
            <strong>${meta.judge}</strong>
        </div>
        <div class="theory-result-card">
            <span>结论</span>
            <strong>${meta.conclusion}</strong>
        </div>
        <p class="theory-step-note">${step[1]}</p>
        <p class="theory-step-note muted">${meta.note}</p>
    `;
}

// 禁用/解除控制栏
function disableControls(disable) {
    sliderPPos.disabled = disable;
    sliderEqualAngle.disabled = disable;
    btnPlayRotation.disabled = disable;
    btnResetState.disabled = disable;
    btnTeachDemo.disabled = disable;
    
    document.querySelectorAll(".btn-preset, .btn-step").forEach(btn => {
        btn.disabled = disable;
        if (disable) {
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
        } else {
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    });
}

// 重置状态
function resetState() {
    if (isAnimating) return;
    pPosPercent = 40.0;
    equalAngle = 72.0;
    
    sliderPPos.value = 40;
    valPPos.textContent = "40%";
    
    sliderEqualAngle.value = 72;
    valEqualAngle.textContent = "72°";
    setTeachingStep(currentScene === "congruent" ? "judge" : "angles");
    
    runLerpLoop();
}

function bindHudScrollIsolation() {
    if (!hudPanel) return;

    const stopCanvasGesture = (event) => {
        event.stopPropagation();
    };

    hudPanel.addEventListener("touchstart", stopCanvasGesture, { passive: true });
    hudPanel.addEventListener("touchmove", stopCanvasGesture, { passive: true });
    hudPanel.addEventListener("wheel", stopCanvasGesture, { passive: true });
}

// ==========================================================================
// 初始化与事件绑定 (Initialization & Setup)
// ==========================================================================
function init() {
    // 1. Preset 场景切换绑定
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadScene(btn.getAttribute("data-scene"));
        });
    });

    document.querySelectorAll(".btn-step").forEach(btn => {
        btn.addEventListener("click", () => {
            setTeachingStep(btn.getAttribute("data-step"));
        });
    });
    
    // 2. 滑块事件绑定
    sliderPPos.addEventListener("input", (e) => {
        pPosPercent = parseFloat(e.target.value);
        valPPos.textContent = `${pPosPercent.toFixed(0)}%`;
        runLerpLoop();
    });
    
    sliderEqualAngle.addEventListener("input", (e) => {
        equalAngle = parseFloat(e.target.value);
        valEqualAngle.textContent = `${equalAngle.toFixed(0)}°`;
        runLerpLoop();
    });
    
    // 3. 动画与重置按钮绑定
    btnPlayRotation.addEventListener("click", playCongruentAnimation);
    btnResetState.addEventListener("click", resetState);
    btnTeachDemo.addEventListener("click", playTeachingDemo);
    
    // 4. 帮助弹窗绑定
    btnShowHelp.addEventListener("click", () => {
        modalHelp.classList.add("active");
    });
    btnCloseHelp.addEventListener("click", () => {
        modalHelp.classList.remove("active");
    });
    
    // 5. Collapsible HUD 展开与折叠绑定
    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
            hudPanel.classList.add("expanded");
        } else {
            hudPanel.classList.remove("expanded");
            hudPanel.classList.add("collapsed");
        }
    });
    bindHudScrollIsolation();
    
    // 6. 全局测试状态接口封装 (供 headless 自动化测试读取)
    window.appState = {
        get currentScene() { return currentScene; },
        get pPosPercent() { return pPosPercent; },
        get equalAngle() { return equalAngle; },
        get teachingStep() { return teachingStep; },
        get isAnimating() { return isAnimating; },
        get isHudExpanded() { return isHudExpanded; },
        get zoomScale() { return zoomScale; },
        get panX() { return panX; },
        get panY() { return panY; },
        get renderValues() {
            return {
                ad: renderValues.ad,
                dp: renderValues.dp,
                pe: renderValues.pe,
                eb: renderValues.eb,
                ab: renderValues.ab,
                bp: renderValues.bp,
                pc: renderValues.pc,
                cq: renderValues.cq
            };
        }
    };
    
    // 7. 画布缩放与平移拖拽事件绑定
    bindCanvasZoomEvents();
    bindCanvasPanEvents();
    
    // 8. 快捷缩放按钮事件绑定
    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());
    
    // 9. 载入初始场景
    setTeachingStep("angles");
    loadScene("similarity");
}

document.addEventListener("DOMContentLoaded", init);

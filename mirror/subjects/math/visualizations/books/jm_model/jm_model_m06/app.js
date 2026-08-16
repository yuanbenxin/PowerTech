/**
 * 截长补短模型演示仪 - 交互逻辑 (app.js)
 * 1. 几何坐标解算 (A点, D点, E点, E'点在各角度下的联动)
 * 2. 绕角平分线 AD 进行 3D 投影翻折动画 + Canvas 粒子碰撞火花
 * 3. LERP 缓动渲染与 HTML 浮动面板同步
 * 4. 画布自由缩放、平移与模型居中系统
 */

// ==========================================================================
// 全局状态与配置
// ==========================================================================
let currentScene = "cut-long";        // 当前场景: "cut-long" | "add-short" | "exploration"
let isAnimating = false;            // 是否在播放动画
let angleC = 30.0;                  // 角度 C (20 ~ 50)
let isHudExpanded = false;           // HUD 默认收起

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
    angleC: 30.0,
    ab: 0.0,
    ac: 0.0,
    bd: 0.0,
    cd: 0.0,
    ad: 0.0,
    ae: 0.0,
    ec: 0.0,
    de: 0.0,
    be: 0.0,
    aePrime: 0.0,
    abPlusBd: 0.0
};

// 静态几何基准点 B 和 C
const bx = 180; const by = 390;     // B 点
const cx = 540; const cy = 390;     // C 点

// DOM 元素引用
const sandboxWrapper = document.getElementById("sandbox-wrapper");
const sandboxSvg = document.getElementById("sandbox-svg");
const htmlOverlay = document.getElementById("html-overlay");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const hudPanel = document.getElementById("hud-chalkboard-panel");
const hudToggleBtn = document.getElementById("hud-toggle-btn");

const sliderCAngle = document.getElementById("slider-c-angle");
const valCAngle = document.getElementById("val-c-angle");

const btnPlayFolding = document.getElementById("btn-play-folding");
const btnResetState = document.getElementById("btn-reset-state");
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
        this.vy += 0.15; // 重力
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
    const rect = sandboxWrapper?.getBoundingClientRect?.();
    canvas.width = Math.max(1, Math.round(rect?.width || window.innerWidth));
    canvas.height = Math.max(1, Math.round(rect?.height || window.innerHeight));
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

// 依据角 C 的度数解算完整的三角形坐标及线段物理长度 (40px = 1cm)
function solveGeometry(degC) {
    const theta = degC * Math.PI / 180.0;
    const phi = 2.0 * theta; // B 角是 C 角的 2 倍
    
    // 直线 AB 斜率为 -tan(2C)，直线 AC 斜率为 -tan(C)
    // 根据解析几何公式计算 A 点坐标
    const t1 = Math.tan(phi);
    const t2 = Math.tan(theta);
    
    const ax = (bx * t1 + cx * t2) / (t1 + t2);
    const ay = by - t2 * (cx - ax);
    
    // 线段长度计算
    const lenAB = Math.sqrt((ax - bx)**2 + (ay - by)**2);
    const lenAC = Math.sqrt((ax - cx)**2 + (ay - cy)**2);
    
    // 角平分线 D 点解算 (角平分线定理：BD / CD = AB / AC)
    const ratio = lenAB / lenAC;
    const dx = (bx + ratio * cx) / (1.0 + ratio);
    const dy = by;
    
    const lenBD = dx - bx;
    const lenCD = cx - dx;
    const lenAD = Math.sqrt((ax - dx)**2 + (ay - dy)**2);
    
    // 截长点 E (在 AC 上，AE = AB)
    const ex = ax + (cx - ax) * (lenAB / lenAC);
    const ey = ay + (cy - ay) * (lenAB / lenAC);
    const lenAE = lenAB;
    const lenEC = lenAC - lenAE;
    const lenDE = Math.sqrt((ex - dx)**2 + (ey - dy)**2);
    
    // 补短点 E' (在 AB 延长线上，BE' = BD)
    const exPrime = ax + (bx - ax) * ((lenAB + lenBD) / lenAB);
    const eyPrime = ay + (by - ay) * ((lenAB + lenBD) / lenAB);
    const lenBEPrime = lenBD;
    const lenAEPrime = lenAB + lenBD;
    
    return {
        ax, ay, bx, by, cx, cy, dx, dy,
        ex, ey,
        exPrime, eyPrime,
        ab: lenAB / 40.0,
        ac: lenAC / 40.0,
        bd: lenBD / 40.0,
        cd: lenCD / 40.0,
        ad: lenAD / 40.0,
        ae: lenAE / 40.0,
        ec: lenEC / 40.0,
        de: lenDE / 40.0,
        be: lenBEPrime / 40.0,
        aePrime: lenAEPrime / 40.0,
        abPlusBd: (lenAB + lenBD) / 40.0
    };
}

function getCurrentGeometry() {
    return solveGeometry(angleC);
}

// ==========================================================================
// 3D 翻折过渡变换 (3D Projective Folding Engine)
// ==========================================================================
// 绕平分线 AD 翻折点 P(x,y)，progress 在 0 ~ 1 之间
function getFoldedPoint(x, y, ax, ay, dx, dy, progress) {
    // 1. AD 向量与归一化
    const ux = dx - ax;
    const uy = dy - ay;
    const uLen = Math.sqrt(ux * ux + uy * uy);
    const nx = ux / uLen;
    const ny = uy / uLen;
    
    // 2. 投影点
    const wx = x - ax;
    const wy = y - ay;
    const projDist = wx * nx + wy * ny;
    const px = ax + projDist * nx;
    const py = ay + projDist * ny;
    
    // 3. 垂直分量
    const vx = x - px;
    const vy = y - py;
    
    // 4. 绕 AD 旋转 progress * pi
    const cosAngle = Math.cos(progress * Math.PI);
    
    // 投影回 2D 坐标
    return {
        x: px + vx * cosAngle,
        y: py + vy * cosAngle
    };
}

// ==========================================================================
// LERP 循环引擎，处理数值平滑读数
// ==========================================================================
function runLerpLoop() {
    const geom = getCurrentGeometry();
    const target = {
        angleC: angleC,
        ab: geom.ab,
        ac: geom.ac,
        bd: geom.bd,
        cd: geom.cd,
        ad: geom.ad,
        ae: geom.ae,
        ec: geom.ec,
        de: geom.de,
        be: geom.be,
        aePrime: geom.aePrime,
        abPlusBd: geom.abPlusBd
    };
    
    let isChanged = false;
    const k = 0.15; // LERP 缓动系数
    
    for (let key in target) {
        const diff = target[key] - renderValues[key];
        if (Math.abs(diff) > 0.01) {
            renderValues[key] += diff * k;
            isChanged = true;
        } else {
            renderValues[key] = target[key];
        }
    }
    
    renderGeometry(geom);
    updateHTMLOverlayAndHUD(geom);
    
    if (isChanged || isAnimating) {
        requestAnimationFrame(runLerpLoop);
    }
}

// ==========================================================================
// SVG 渲染与 DOM 生成 (SVG Drawing & Dynamic Overlays)
// ==========================================================================

function drawPolygonFill(pointsPath, className) {
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", pointsPath);
    poly.setAttribute("class", className);
    sandboxSvg.appendChild(poly);
}

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

// 绘制角弧
function drawAngleArc(id, cx, cy, startAngleRad, endAngleRad, r, className = "geo-angle-arc") {
    const startX = cx + r * Math.cos(startAngleRad);
    const startY = cy + r * Math.sin(startAngleRad);
    const endX = cx + r * Math.cos(endAngleRad);
    const endY = cy + r * Math.sin(endAngleRad);
    
    const largeArc = Math.abs(endAngleRad - startAngleRad) <= Math.PI ? "0" : "1";
    const sweepFlag = endAngleRad > startAngleRad ? "1" : "0";
    
    const pathDec = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathDec.setAttribute("d", `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} L ${cx} ${cy} Z`);
    pathDec.setAttribute("class", "geo-angle-sector");
    sandboxSvg.appendChild(pathDec);
    
    const pathArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathArc.setAttribute("id", id);
    pathArc.setAttribute("d", `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`);
    pathArc.setAttribute("class", className);
    sandboxSvg.appendChild(pathArc);
}

function drawEqualTick(id, x1, y1, x2, y2, className = "mark-blue", count = 1, offset = 0) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const nx = -dy / len;
    const ny = dx / len;
    const ux = dx / len;
    const uy = dy / len;
    const spacing = 8;
    const tickLen = 16;

    for (let i = 0; i < count; i += 1) {
        const shift = (i - (count - 1) / 2) * spacing + offset;
        const cxTick = midX + ux * shift;
        const cyTick = midY + uy * shift;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("id", `${id}-${i + 1}`);
        line.setAttribute("x1", `${cxTick - nx * tickLen / 2}`);
        line.setAttribute("y1", `${cyTick - ny * tickLen / 2}`);
        line.setAttribute("x2", `${cxTick + nx * tickLen / 2}`);
        line.setAttribute("y2", `${cyTick + ny * tickLen / 2}`);
        line.setAttribute("class", `geo-equal-tick ${className}`);
        sandboxSvg.appendChild(line);
    }
}

function createHTMLBraceLabel(id, x, y, text, className = "") {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const label = document.createElement("div");
    label.setAttribute("id", id);
    label.setAttribute("class", `brace-label ${className}`.trim());
    label.dataset.localX = String(x);
    label.dataset.localY = String(y);
    const screen = localToScreen(x, y);
    label.style.left = `${screen.x}px`;
    label.style.top = `${screen.y}px`;
    label.textContent = text;
    htmlOverlay.appendChild(label);
}

function createSegmentRelationLabel(id, x1, y1, x2, y2, text, className = "", offsetX = 0, offsetY = 0) {
    createHTMLBraceLabel(
        id,
        (x1 + x2) / 2 + offsetX,
        (y1 + y2) / 2 + offsetY,
        text,
        `compact ${className}`.trim()
    );
}

function getAngleMidpoint(startAngle, endAngle) {
    let delta = endAngle - startAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return startAngle + delta / 2;
}

function drawPoint(name, x, y, styleClass = "a") {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "geo-point-wrapper");
    
    const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    halo.setAttribute("cx", `${x}`);
    halo.setAttribute("cy", `${y}`);
    halo.setAttribute("r", "14");
    halo.setAttribute("class", "geo-point-halo");
    group.appendChild(halo);
    
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", `${x}`);
    dot.setAttribute("dot-y", `${y}`);
    dot.setAttribute("cy", `${y}`);
    dot.setAttribute("r", "6");
    dot.setAttribute("class", "geo-point");
    group.appendChild(dot);
    
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("class", "geo-label");
    txt.textContent = name;
    
    // 智能避让文本标记位置
    if (name === "A") {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y - 12}`);
        txt.setAttribute("style", "text-anchor: middle;");
    } else if (name === "B") {
        txt.setAttribute("x", `${x - 12}`);
        txt.setAttribute("y", `${y + 16}`);
        txt.setAttribute("style", "text-anchor: end;");
    } else if (name === "C") {
        txt.setAttribute("x", `${x + 12}`);
        txt.setAttribute("y", `${y + 16}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else if (name === "D") {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y + 22}`);
        txt.setAttribute("style", "text-anchor: middle;");
    } else if (name === "E") {
        txt.setAttribute("x", `${x + 12}`);
        txt.setAttribute("y", `${y - 8}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else if (name === "E'") {
        txt.setAttribute("x", `${x - 14}`);
        txt.setAttribute("y", `${y + 16}`);
        txt.setAttribute("style", "text-anchor: end;");
    } else if (name === "B'") {
        txt.setAttribute("x", `${x + 14}`);
        txt.setAttribute("y", `${y - 8}`);
        txt.setAttribute("style", "text-anchor: start;");
    }
    
    group.appendChild(txt);
    sandboxSvg.appendChild(group);
}

// 绘制主几何图形
function renderGeometry(geom) {
    sandboxSvg.innerHTML = "";
    
    // 绘制底边线 BC
    const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseLine.setAttribute("x1", `${bx - 30}`);
    baseLine.setAttribute("y1", `${by}`);
    baseLine.setAttribute("x2", `${cx + 30}`);
    baseLine.setAttribute("y2", `${cy}`);
    baseLine.setAttribute("class", "geo-line-seg seg-base");
    sandboxSvg.appendChild(baseLine);
    
    if (isAnimating) {
        return; // 动画更新状态由 renderAnimationStep 完全接管
    }
    
    // 1. 绘制背景填充三角形 ABC
    drawPolygonFill(`${geom.ax},${geom.ay} ${bx},${by} ${cx},${cy}`, "geo-polygon-fill");
    
    // 2. 绘制平分角标记 (角 A 的平分)
    const angB = Math.atan2(by - geom.ay, bx - geom.ax);
    const angC = Math.atan2(cy - geom.ay, cx - geom.ax);
    const angAD = Math.atan2(geom.dy - geom.ay, geom.dx - geom.ax);
    
    drawAngleArc("arc-a1", geom.ax, geom.ay, angB, angAD, 22, "geo-angle-arc");
    drawAngleArc("arc-a2", geom.ax, geom.ay, angAD, angC, 22, "geo-angle-arc");
    
    // 3. 绘制三角形的边 AB, AC, BC, 和平分线 AD
    drawRay("ray-ab", geom.ax, geom.ay, bx, by, "seg-a");
    drawRay("ray-ac", geom.ax, geom.ay, cx, cy, "seg-a");
    drawRay("ray-ad", geom.ax, geom.ay, geom.dx, geom.dy, "seg-d");
    
    if (currentScene === "cut-long") {
        // 截长法：绘制 AE, DE (紫色)
        drawRay("ray-ae", geom.ax, geom.ay, geom.ex, geom.ey, "seg-b");
        drawRay("ray-de", geom.dx, geom.dy, geom.ex, geom.ey, "seg-b");
        drawEqualTick("tick-ab", geom.ax, geom.ay, bx, by, "mark-blue", 1);
        drawEqualTick("tick-ae", geom.ax, geom.ay, geom.ex, geom.ey, "mark-blue", 1);
        drawEqualTick("tick-bd", bx, by, geom.dx, geom.dy, "mark-purple", 2);
        drawEqualTick("tick-de", geom.dx, geom.dy, geom.ex, geom.ey, "mark-purple", 2, -16);
        drawEqualTick("tick-de-ec", geom.dx, geom.dy, geom.ex, geom.ey, "mark-green", 3, 18);
        drawEqualTick("tick-ec", geom.ex, geom.ey, cx, cy, "mark-green", 3);
        
        // 绘制端点
        drawPoint("B", bx, by);
        drawPoint("C", cx, cy);
        drawPoint("D", geom.dx, geom.dy);
        drawPoint("E", geom.ex, geom.ey);
        drawPoint("A", geom.ax, geom.ay);
    } else if (currentScene === "add-short") {
        // 补短法：延长 AB 边到 E' (绘制辅助虚线 AE')
        drawSkeleton("skeleton-ae-prime", geom.ax, geom.ay, geom.exPrime, geom.eyPrime);
        
        // 绘制 BE', DE' (紫色)
        drawRay("ray-be-prime", bx, by, geom.exPrime, geom.eyPrime, "seg-b");
        drawRay("ray-de-prime", geom.dx, geom.dy, geom.exPrime, geom.eyPrime, "seg-b");
        drawEqualTick("tick-bd", bx, by, geom.dx, geom.dy, "mark-purple", 2);
        drawEqualTick("tick-be-prime", bx, by, geom.exPrime, geom.eyPrime, "mark-purple", 2);
        drawEqualTick("tick-ae-prime", geom.ax, geom.ay, geom.exPrime, geom.eyPrime, "mark-blue", 1);
        drawEqualTick("tick-ac", geom.ax, geom.ay, cx, cy, "mark-blue", 1);
        
        // 绘制端点
        drawPoint("B", bx, by);
        drawPoint("C", cx, cy);
        drawPoint("D", geom.dx, geom.dy);
        drawPoint("E'", geom.exPrime, geom.eyPrime);
        drawPoint("A", geom.ax, geom.ay);
    } else {
        // 自由探究：仅绘制基本图形及 D 点
        drawPoint("B", bx, by);
        drawPoint("C", cx, cy);
        drawPoint("D", geom.dx, geom.dy);
        drawPoint("A", geom.ax, geom.ay);
    }
}

// 刷新浮动 HTML 读数标签与 HUD 内容
function updateHTMLOverlayAndHUD(geom) {
    htmlOverlay.innerHTML = "";
    if (isAnimating) return;

    // 画面只保留关键构造关系；完整数值留在 HUD，避免模型标记拥挤。
    if (currentScene === "cut-long") {
        createSegmentRelationLabel("lbl-ae-ab", geom.ax, geom.ay, geom.ex, geom.ey, "AE = AB", "main", 18, -12);
        createSegmentRelationLabel("lbl-de-bd", geom.dx, geom.dy, geom.ex, geom.ey, "DE = BD", "sub", -22, -18);
        createSegmentRelationLabel("lbl-ec-de", geom.ex, geom.ey, cx, cy, "EC = DE", "sub", 26, 8);
    } else if (currentScene === "add-short") {
        createSegmentRelationLabel("lbl-be-bd", bx, by, geom.exPrime, geom.eyPrime, "BE' = BD", "sub", -26, 8);
        createSegmentRelationLabel("lbl-ae-ac", geom.ax, geom.ay, geom.exPrime, geom.eyPrime, "AE' = AC", "main", -30, -10);
    } else {
        createHTMLBraceLabel("lbl-result", (geom.ax + cx) / 2 + 36, (geom.ay + cy) / 2 - 24, "AB + BD = AC", "relation compact");
    }

    // 标出角 A1 和 A2 标识
    const angB = Math.atan2(by - geom.ay, bx - geom.ax);
    const angC = Math.atan2(cy - geom.ay, cx - geom.ax);
    const angAD = Math.atan2(geom.dy - geom.ay, geom.dx - geom.ax);
    const labelAngle1 = getAngleMidpoint(angB, angAD);
    const labelAngle2 = getAngleMidpoint(angAD, angC);
    const ptA1 = { x: geom.ax + 38 * Math.cos(labelAngle1), y: geom.ay + 38 * Math.sin(labelAngle1) };
    const ptA2 = { x: geom.ax + 38 * Math.cos(labelAngle2), y: geom.ay + 38 * Math.sin(labelAngle2) };
    createHTMLBraceLabel("lbl-a1", ptA1.x, ptA1.y, "1", "angle");
    createHTMLBraceLabel("lbl-a2", ptA2.x, ptA2.y, "2", "angle");

    updateChalkboardHUD();
}

// 渲染板书内容
function updateChalkboardHUD() {
    let html = "";
    
    if (currentScene === "cut-long") {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">条件</div>
                <div class="hud-row-val">
                    ∠B = 2∠C = ${(renderValues.angleC * 2).toFixed(0)}°，∠1 = ∠2
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">截长构造</div>
                <div class="hud-row-val">
                    AC 上取 <span class="math-seg seg-b">AE = AB</span>，连 DE。
                </div>
            </div>
            <div class="hud-proof-line">
                △ABD ≅ △AED <span>SAS</span> ⇒ <b>DE = BD</b>
            </div>
            <div class="hud-proof-line">
                ∠AED = 2∠C ⇒ ∠EDC = ∠C ⇒ <b>EC = DE</b>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">结论</div>
                <div class="formula">
                    <span>AC = AE + EC = AB + BD</span>
                    <span><span class="math-num">${renderValues.ac.toFixed(1)}</span> = <span class="math-num">${renderValues.ab.toFixed(1)}</span> + <span class="math-num">${renderValues.bd.toFixed(1)}</span></span>
                </div>
            </div>
        `;
    } else if (currentScene === "add-short") {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">条件</div>
                <div class="hud-row-val">
                    ∠B = 2∠C = ${(renderValues.angleC * 2).toFixed(0)}°，∠1 = ∠2
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">补短构造</div>
                <div class="hud-row-val">
                    延长 AB 到 E'，使 <span class="math-seg seg-b">BE' = BD</span>，连 DE'。
                </div>
            </div>
            <div class="hud-proof-line">
                BE' = BD ⇒ ∠E' = ∠BDE' ⇒ <b>∠E' = ∠C</b>
            </div>
            <div class="hud-proof-line">
                △ADE' ≅ △ADC <span>AAS</span> ⇒ <b>AE' = AC</b>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">结论</div>
                <div class="formula">
                    <span>AC = AE' = AB + BE' = AB + BD</span>
                    <span><span class="math-num">${renderValues.ac.toFixed(1)}</span> = <span class="math-num">${renderValues.ab.toFixed(1)}</span> + <span class="math-num">${renderValues.bd.toFixed(1)}</span></span>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">自由参数探究</div>
                <div class="hud-row-val">
                    拖动右侧 Slider 改变 ∠C；始终保持 ∠B = 2∠C。
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">实时度量</div>
                <div class="hud-row-val">
                    AB = <span class="math-num">${renderValues.ab.toFixed(2)}</span>，
                    BD = <span class="math-num">${renderValues.bd.toFixed(2)}</span>，
                    AC = <span class="math-num">${renderValues.ac.toFixed(2)}</span>
                </div>
            </div>
            <div class="hud-equation-box">
                <div class="title">恒等关系</div>
                <div class="formula">
                    <span>AB + BD = AC</span>
                    <span><span class="math-num">${renderValues.ab.toFixed(2)}</span> + <span class="math-num">${renderValues.bd.toFixed(2)}</span> = <span class="math-num highlight">${(renderValues.ab + renderValues.bd).toFixed(2)}</span></span>
                </div>
            </div>
        `;
    }
    stepsChalkboard.innerHTML = html;
}

// ==========================================================================
// 旋转翻折动画播放器 (Folding Simulation Transition)
// ==========================================================================
function playFoldingAnimation() {
    if (isAnimating || currentScene === "exploration") return;
    isAnimating = true;
    disableControls(true);
    
    const geom = solveGeometry(angleC);
    const duration = 1600; // 1.6s
    const startTime = performance.now();
    
    function animate(now) {
        const elapsed = now - startTime;
        let progress = Math.min(1.0, elapsed / duration);
        
        // 缓动函数 EaseInOutCubic
        progress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        renderAnimationStep(geom, progress);
        
        if (progress < 1.0) {
            requestAnimationFrame(animate);
        } else {
            // 翻折重合瞬间，在交点处引爆碰撞微粒火花
            const rect = sandboxWrapper.getBoundingClientRect();
            if (currentScene === "cut-long") {
                // 截长法：B点重合到 E点，在 E点引爆
                const expEX = rect.left + panX + geom.ex * zoomScale;
                const expEY = rect.top + panY + geom.ey * zoomScale;
                triggerExplosion(expEX, expEY, ["#8b5cf6", "#3b82f6", "#ffffff"], 35);
            } else if (currentScene === "add-short") {
                // 补短法：E'点重合到 C点，在 C点引爆
                const expCX = rect.left + panX + geom.cx * zoomScale;
                const expCY = rect.top + panY + geom.cy * zoomScale;
                triggerExplosion(expCX, expCY, ["#8b5cf6", "#3b82f6", "#ffffff"], 35);
            }
            
            setTimeout(() => {
                isAnimating = false;
                disableControls(false);
                runLerpLoop();
            }, 600);
        }
    }
    requestAnimationFrame(animate);
}

// 渲染翻折过渡帧
function renderAnimationStep(geom, progress) {
    sandboxSvg.innerHTML = "";
    htmlOverlay.innerHTML = "";
    
    // 绘制底边 BC 辅线
    const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseLine.setAttribute("x1", `${bx - 30}`);
    baseLine.setAttribute("y1", `${by}`);
    baseLine.setAttribute("x2", `${cx + 30}`);
    baseLine.setAttribute("y2", `${cy}`);
    baseLine.setAttribute("class", "geo-line-seg seg-base");
    sandboxSvg.appendChild(baseLine);
    
    // 绘制静态角 A1 和 A2 弧
    const angB = Math.atan2(by - geom.ay, bx - geom.ax);
    const angC = Math.atan2(cy - geom.ay, cx - geom.ax);
    const angAD = Math.atan2(geom.dy - geom.ay, geom.dx - geom.ax);
    drawAngleArc("arc-a1", geom.ax, geom.ay, angB, angAD, 22);
    drawAngleArc("arc-a2", geom.ax, geom.ay, angAD, angC, 22);
    
    // 绘制不动的三条主线：AC(骨架), AD, BC
    drawSkeleton("skeleton-ac", geom.ax, geom.ay, cx, cy);
    drawRay("ray-ad", geom.ax, geom.ay, geom.dx, geom.dy, "seg-d");
    drawRay("ray-bc", bx, by, cx, cy, "seg-base");
    
    if (currentScene === "cut-long") {
        // 截长法：翻折 △ABD 绕 AD 投影翻转，B 点变化，A和D不动
        // 计算旋转过渡态 B' 坐标
        const bPrime = getFoldedPoint(bx, by, geom.ax, geom.ay, geom.dx, geom.dy, progress);
        
        // 绘制折纸三角形 △AB'D
        drawRay("ray-ab-prime", geom.ax, geom.ay, bPrime.x, bPrime.y, "seg-b");
        drawRay("ray-db-prime", geom.dx, geom.dy, bPrime.x, bPrime.y, "seg-b");
        
        // 绘制原三角形的骨架
        drawSkeleton("skeleton-ab", geom.ax, geom.ay, bx, by);
        drawSkeleton("skeleton-bd", bx, by, geom.dx, geom.dy);
        
        // 绘制目的地 E 点骨架
        drawSkeleton("skeleton-de", geom.dx, geom.dy, geom.ex, geom.ey);
        
        // 绘制端点
        drawPoint("B", bx, by);
        drawPoint("C", cx, cy);
        drawPoint("D", geom.dx, geom.dy);
        drawPoint("E", geom.ex, geom.ey);
        drawPoint("B'", bPrime.x, bPrime.y);
        drawPoint("A", geom.ax, geom.ay);
        
        createHTMLBraceLabel("lbl-anim", (bPrime.x + geom.ax)/2, (bPrime.y + geom.ay)/2 - 16, `对折中: ${(progress*100).toFixed(0)}%`, "main");
        
        stepsChalkboard.innerHTML = `
            <div class="hud-row">
                <div class="hud-row-label">“截长”法对折翻转中</div>
                <div class="hud-row-val" style="color:var(--primary); font-weight:700;">
                    正在将 △ABD 绕角平分线 AD 翻折 180°...
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">对称顶点对应</div>
                <div class="hud-row-val">
                    顶点 B &rArr; B' (落向较长边 AC)<br>
                    辅助线 BD &rArr; DE (全等代换线)<br>
                    折叠重合度：<strong>${(progress * 100).toFixed(0)}%</strong>
                </div>
            </div>
        `;
    } else if (currentScene === "add-short") {
        // 补短法：翻折 △ADE' 绕 AD 投影翻转，E'点变化，A和D不动
        // 计算旋转过渡态 E' 坐标变化
        const ePrimeRot = getFoldedPoint(geom.exPrime, geom.eyPrime, geom.ax, geom.ay, geom.dx, geom.dy, progress);
        
        // 绘制折纸三角形 △ADE'(rot)
        drawRay("ray-ae-rot", geom.ax, geom.ay, ePrimeRot.x, ePrimeRot.y, "seg-b");
        drawRay("ray-de-rot", geom.dx, geom.dy, ePrimeRot.x, ePrimeRot.y, "seg-b");
        
        // 绘制原三角形的骨架 (含补足延长线)
        drawSkeleton("skeleton-ab", geom.ax, geom.ay, bx, by);
        drawSkeleton("skeleton-be-prime", bx, by, geom.exPrime, geom.eyPrime);
        drawSkeleton("skeleton-de-prime", geom.dx, geom.dy, geom.exPrime, geom.eyPrime);
        
        // 绘制端点
        drawPoint("B", bx, by);
        drawPoint("C", cx, cy);
        drawPoint("D", geom.dx, geom.dy);
        drawPoint("E'", geom.exPrime, geom.eyPrime);
        drawPoint("E' (折)", ePrimeRot.x, ePrimeRot.y);
        drawPoint("A", geom.ax, geom.ay);
        
        createHTMLBraceLabel("lbl-anim", (ePrimeRot.x + geom.ax)/2, (ePrimeRot.y + geom.ay)/2 - 16, `对折中: ${(progress*100).toFixed(0)}%`, "main");
        
        stepsChalkboard.innerHTML = `
            <div class="hud-row">
                <div class="hud-row-label">“补短”法对折翻转中</div>
                <div class="hud-row-val" style="color:var(--primary); font-weight:700;">
                    正在将 △ADE' 绕角平分线 AD 翻折 180°...
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">对称顶点对应</div>
                <div class="hud-row-val">
                    延长点 E' &rArr; E' (落向长边 AC)<br>
                    折叠重合度：<strong>${(progress * 100).toFixed(0)}%</strong>
                </div>
            </div>
        `;
    }
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
    
    // 模型内部中心坐标 (三角形底边 BC 在 180~540 间，中点在 360, 270 附近)
    const modelCX = 360;
    const modelCY = 270;
    
    if (forceScale !== null) {
        zoomScale = forceScale;
    } else {
        // 自适应最佳尺寸
        const modelW = 420;
        const modelH = 360;
        const scaleX = W / modelW;
        const scaleY = H / modelH;
        zoomScale = Math.min(scaleX, scaleY);
        if (zoomScale < 0.6) zoomScale = 0.6;
        if (zoomScale > 1.3) zoomScale = 1.3;
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
    if (window.PointerEvent) {
        bindPointerCanvasPanEvents();
        return;
    }
    sandboxWrapper.addEventListener("mousedown", onPanStart);
    sandboxWrapper.addEventListener("touchstart", onPanStart, { passive: false });
}

function bindPointerCanvasPanEvents() {
    const pointers = new Map();
    let activePointerId = null;

    const getPoint = (event) => ({ x: event.clientX, y: event.clientY });
    const getTwoPoints = () => Array.from(pointers.values()).slice(0, 2);

    const beginPan = (point, pointerId) => {
        activePointerId = pointerId;
        isPanning = true;
        isPinchZooming = false;
        startPanMouseX = point.x;
        startPanMouseY = point.y;
        startPanX = panX;
        startPanY = panY;
        sandboxWrapper.classList.add("panning");
    };

    const beginPinch = () => {
        const [first, second] = getTwoPoints();
        if (!first || !second) return;
        isPanning = false;
        isPinchZooming = true;
        activePointerId = null;
        lastTouchDist = Math.hypot(first.x - second.x, first.y - second.y);
        sandboxWrapper.classList.add("panning");
    };

    const updatePinch = () => {
        const [first, second] = getTwoPoints();
        if (!first || !second) return;

        const dist = Math.hypot(first.x - second.x, first.y - second.y);
        if (lastTouchDist <= 0) {
            lastTouchDist = dist;
            return;
        }

        const rect = sandboxWrapper.getBoundingClientRect();
        const midX = (first.x + second.x) / 2 - rect.left;
        const midY = (first.y + second.y) / 2 - rect.top;
        const internalX = (midX - panX) / zoomScale;
        const internalY = (midY - panY) / zoomScale;

        zoomScale = Math.max(0.4, Math.min(4.0, zoomScale * (dist / lastTouchDist)));
        panX = midX - internalX * zoomScale;
        panY = midY - internalY * zoomScale;
        lastTouchDist = dist;
        applyTransform();
    };

    const endPointer = (event) => {
        if (!pointers.has(event.pointerId)) return;
        pointers.delete(event.pointerId);

        if (pointers.size >= 2) {
            beginPinch();
            return;
        }

        if (pointers.size === 1) {
            const [pointerId, point] = Array.from(pointers.entries())[0];
            beginPan(point, pointerId);
            return;
        }

        activePointerId = null;
        isPanning = false;
        isPinchZooming = false;
        lastTouchDist = 0;
        sandboxWrapper.classList.remove("panning");
    };

    sandboxWrapper.addEventListener("pointerdown", (event) => {
        if (isAnimating || (event.pointerType === "mouse" && event.button !== 0)) return;
        if (event.target.closest(".btn-zoom, .hud-panel, .btn-icon")) return;

        pointers.set(event.pointerId, getPoint(event));
        sandboxWrapper.setPointerCapture?.(event.pointerId);
        if (pointers.size >= 2) {
            beginPinch();
        } else {
            beginPan(getPoint(event), event.pointerId);
        }
        event.preventDefault();
    }, { passive: false });

    sandboxWrapper.addEventListener("pointermove", (event) => {
        if (!pointers.has(event.pointerId)) return;
        const point = getPoint(event);
        pointers.set(event.pointerId, point);

        if (pointers.size >= 2) {
            updatePinch();
        } else if (isPanning && activePointerId === event.pointerId) {
            panX = startPanX + point.x - startPanMouseX;
            panY = startPanY + point.y - startPanMouseY;
            applyTransform();
        }
        event.preventDefault();
    }, { passive: false });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
        sandboxWrapper.addEventListener(type, endPointer);
    });
}

function bindTouchSafety() {
    ["contextmenu", "selectstart", "dragstart", "copy", "cut", "paste"].forEach((type) => {
        sandboxWrapper.addEventListener(type, (event) => event.preventDefault());
    });
}

function bindHudScrollIsolation() {
    if (!hudPanel || !stepsChalkboard) return;

    ["wheel", "touchstart", "touchmove", "touchend", "touchcancel", "mousedown", "mousemove", "pointerdown", "pointermove"].forEach((type) => {
        hudPanel.addEventListener(type, (event) => event.stopPropagation());
    });
}

function onPanStart(e) {
    if (isAnimating) return;
    if (e.target.closest(".btn-zoom") || e.target.closest(".hud-panel") || e.target.closest(".btn-icon")) {
        return;
    }
    
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
    document.addEventListener("touchcancel", onPanEnd);
    
    e.preventDefault();
}

function onPanMove(e) {
    // 触控双指捏合缩放
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
    document.removeEventListener("touchcancel", onPanEnd);
}

// ==========================================================================
// 状态管理与事件绑定 (State Control & Event Bindings)
// ==========================================================================

function loadScene(scene) {
    if (isAnimating) return;
    currentScene = scene;
    
    document.querySelectorAll(".btn-preset").forEach(btn => {
        if (btn.getAttribute("data-scene") === scene) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    if (scene === "exploration") {
        btnPlayFolding.style.display = "none";
    } else {
        btnPlayFolding.style.display = "inline-flex";
    }
    
    updateTheoryCard(scene);
    runLerpLoop();
    centerModel();
}

function updateTheoryCard(scene) {
    if (scene === "cut-long") {
        theoryTitle.innerHTML = "“截长”辅助线推导";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>构造</span><strong>在 AC 上取 AE = AB，连接 DE。</strong></div>
                <div class="proof-chip"><span>全等</span><strong>AB = AE，∠1 = ∠2，AD 公共，所以 △ABD ≅ △AED。</strong></div>
                <div class="proof-chip"><span>对应</span><strong>由全等得 DE = BD，并且 ∠AED = ∠B = 2∠C。</strong></div>
                <div class="proof-chip"><span>等腰</span><strong>外角关系推出 ∠EDC = ∠C，所以 EC = DE。</strong></div>
                <div class="proof-result"><span>结论</span><strong>AC = AE + EC = AB + BD</strong></div>
            </div>
        `;
    } else if (scene === "add-short") {
        theoryTitle.innerHTML = "“补短”辅助线推导";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>构造</span><strong>延长 AB 到 E'，使 BE' = BD，连接 DE'。</strong></div>
                <div class="proof-chip"><span>等腰</span><strong>BE' = BD，所以 ∠E' = ∠BDE'。</strong></div>
                <div class="proof-chip"><span>代换</span><strong>∠B = 2∠C 且 ∠B = 2∠E'，所以 ∠E' = ∠C。</strong></div>
                <div class="proof-chip"><span>全等</span><strong>∠1 = ∠2，∠E' = ∠C，AD 公共，所以 △ADE' ≅ △ADC。</strong></div>
                <div class="proof-result"><span>结论</span><strong>AC = AE' = AB + BE' = AB + BD</strong></div>
            </div>
        `;
    } else {
        theoryTitle.innerHTML = "线段和差探究";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>条件</span><strong>保持 ∠B = 2∠C，AD 为角平分线。</strong></div>
                <div class="proof-chip"><span>观察</span><strong>拖动角度滑块，AB、BD、AC 会同步变化。</strong></div>
                <div class="proof-chip"><span>不变</span><strong>无论三角形形态如何变化，AB + BD 与 AC 始终相等。</strong></div>
                <div class="proof-result"><span>模型</span><strong>看到线段和差，优先尝试截长或补短构造。</strong></div>
            </div>
        `;
    }
}

function disableControls(disable) {
    sliderCAngle.disabled = disable;
    btnPlayFolding.disabled = disable;
    btnResetState.disabled = disable;
    document.querySelectorAll(".btn-preset").forEach(btn => {
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

function resetState() {
    if (isAnimating) return;
    angleC = 30.0;
    sliderCAngle.value = 30;
    valCAngle.textContent = "30 °";
    
    runLerpLoop();
    centerModel();
}

// ==========================================================================
// 初始化与事件绑定 (Initialization & Setup)
// ==========================================================================
function init() {
    // 1. Preset 场景切换
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadScene(btn.getAttribute("data-scene"));
        });
    });
    
    // 2. 角度调节 Slider
    sliderCAngle.addEventListener("input", (e) => {
        angleC = parseFloat(e.target.value);
        valCAngle.textContent = `${angleC.toFixed(0)} °`;
        runLerpLoop();
    });
    
    // 3. 按钮动作
    btnPlayFolding.addEventListener("click", playFoldingAnimation);
    btnResetState.addEventListener("click", resetState);
    
    // 4. 帮助弹窗
    btnShowHelp.addEventListener("click", () => {
        modalHelp.classList.add("active");
    });
    btnCloseHelp.addEventListener("click", () => {
        modalHelp.classList.remove("active");
    });
    
    isHudExpanded = false;
    hudPanel.classList.remove("expanded");
    hudPanel.classList.add("collapsed");

    // 5. HUD 可折叠，进入课件默认收起，点击后展开
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
    
    // 6. 暴露全局测试接口 window.appState
    window.appState = {
        get currentScene() { return currentScene; },
        get angleC() { return angleC; },
        get isAnimating() { return isAnimating; },
        get isHudExpanded() { return isHudExpanded; },
        get zoomScale() { return zoomScale; },
        get panX() { return panX; },
        get panY() { return panY; },
        get renderValues() {
            return {
                angleC: renderValues.angleC,
                ab: renderValues.ab,
                ac: renderValues.ac,
                bd: renderValues.bd,
                cd: renderValues.cd,
                ad: renderValues.ad,
                ae: renderValues.ae,
                ec: renderValues.ec,
                de: renderValues.de,
                be: renderValues.be,
                abPlusBd: renderValues.abPlusBd
            };
        },
        resetState,
        loadScene
    };
    
    // 7. 绑定平移与缩放手势
    bindTouchSafety();
    bindHudScrollIsolation();
    bindCanvasZoomEvents();
    bindCanvasPanEvents();
    
    // 8. 快捷缩放按钮
    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());
    
    // 9. 载入初始场景
    loadScene("cut-long");
}

document.addEventListener("DOMContentLoaded", init);

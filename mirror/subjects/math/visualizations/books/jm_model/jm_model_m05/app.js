/**
 * 倍长中线模型演示仪 - 交互逻辑 (app.js)
 * 1. 几何中线与倍长端点联动解算 (D为中点, E = 2*D - A)
 * 2. 绕中点 D 旋转 180° 全等对折过渡动画 + Canvas 物理碰撞火花
 * 3. 一阶低通滤波 LERP 缓动渲染引擎
 * 4. 可折叠半透明 HUD 几何板书公式动态同步 (中线不等式范围)
 * 5. 画布自适应缩放、平移与居中系统
 */

// ==========================================================================
// 全局状态与配置
// ==========================================================================
let currentScene = "congruence";     // 当前场景: "congruence" | "inequality" | "parallelogram"
let isAnimating = false;            // 是否在播放动画
let aX = 240.0;                     // 动点 A 内部 X 坐标
let aY = 210.0;                     // 动点 A 内部 Y 坐标
let isHudExpanded = false;           // HUD 默认收起
let labelMode = "key";              // 图上标记模式: "key" | "all" | "none"
let isPointDragging = false;         // 拖拽时临时收起低优先级标签

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
    ax: 240.0,
    ay: 210.0,
    ab: 0.0,
    ac: 0.0,
    ad: 0.0,
    be: 0.0,
    ae: 0.0,
    sumHalf: 0.0,
    diffHalf: 0.0
};

// 静态几何点 B 和 C
const bx = 180; const by = 390;     // B 点
const cx = 420; const cy = 390;     // C 点
const dx = 300; const dy = 390;     // D 中点

// DOM 元素引用
const sandboxWrapper = document.getElementById("sandbox-wrapper");
const sandboxSvg = document.getElementById("sandbox-svg");
const htmlOverlay = document.getElementById("html-overlay");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const hudPanel = document.getElementById("hud-chalkboard-panel");
const hudToggleBtn = document.getElementById("hud-toggle-btn");

const sliderAX = document.getElementById("slider-a-x");
const sliderAY = document.getElementById("slider-a-y");
const valAX = document.getElementById("val-a-x");
const valAY = document.getElementById("val-a-y");

const btnPlayRotation = document.getElementById("btn-play-rotation");
const btnResetState = document.getElementById("btn-reset-state");
const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const modalHelp = document.getElementById("modal-help");

const theoryTitle = document.getElementById("theory-title");
const theoryText = document.getElementById("theory-text");
const markModeButtons = document.querySelectorAll(".btn-mark-mode");

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
        this.vy += 0.15;
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

// 根据 A 点内部坐标解算 E 点及各个线段逻辑长度
function solveGeometry(ax_in, ay_in) {
    // E 为 AD 延长一倍： AE = 2*AD => ex = 2*dx - ax
    const ex = 600 - ax_in;
    const ey = 780 - ay_in;
    
    // 计算线段实际像素长度并换算为逻辑单位 (40px = 1cm)
    const valAB = Math.sqrt((ax_in - bx)**2 + (ay_in - by)**2) / 40.0;
    const valAC = Math.sqrt((ax_in - cx)**2 + (ay_in - cy)**2) / 40.0;
    const valAD = Math.sqrt((ax_in - dx)**2 + (ay_in - dy)**2) / 40.0;
    const valAE = valAD * 2;
    const valBE = valAC; // 全等对应边
    const valCE = valAB; // 全等对应边
    
    const sumHalf = 0.5 * (valAB + valAC);
    const diffHalf = 0.5 * Math.abs(valAB - valAC);
    
    return {
        ax: ax_in, ay: ay_in,
        bx, by, cx, cy, dx, dy,
        ex, ey,
        ab: valAB,
        ac: valAC,
        ad: valAD,
        ae: valAE,
        be: valBE,
        ce: valCE,
        sumHalf,
        diffHalf
    };
}

function getCurrentGeometry() {
    return solveGeometry(aX, aY);
}

// ==========================================================================
// LERP 循环引擎，处理数值平滑读数
// ==========================================================================
function runLerpLoop() {
    const geom = getCurrentGeometry();
    const target = {
        ax: aX,
        ay: aY,
        ab: geom.ab,
        ac: geom.ac,
        ad: geom.ad,
        be: geom.be,
        ae: geom.ae,
        sumHalf: geom.sumHalf,
        diffHalf: geom.diffHalf
    };
    
    let isChanged = false;
    const k = 0.15; // LERP 阻尼
    
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

function drawEqualityTicks(id, x1, y1, x2, y2, count, className, fraction = 0.5) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len < 1) return;
    const ux = vx / len;
    const uy = vy / len;
    const px = -uy;
    const py = ux;
    const offsets = count === 1 ? [0] : count === 2 ? [-5, 5] : [-8, 0, 8];
    const tickLen = 13;
    const cx0 = x1 + vx * fraction;
    const cy0 = y1 + vy * fraction;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", id);
    group.setAttribute("class", `geo-equality-tick ${className}`);
    offsets.forEach((offset) => {
        const cxTick = cx0 + ux * offset;
        const cyTick = cy0 + uy * offset;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${cxTick - px * tickLen / 2}`);
        line.setAttribute("y1", `${cyTick - py * tickLen / 2}`);
        line.setAttribute("x2", `${cxTick + px * tickLen / 2}`);
        line.setAttribute("y2", `${cyTick + py * tickLen / 2}`);
        group.appendChild(line);
    });
    sandboxSvg.appendChild(group);
}

function drawOpenArc(id, cx0, cy0, startAngleRad, endAngleRad, r, className) {
    const startX = cx0 + r * Math.cos(startAngleRad);
    const startY = cy0 + r * Math.sin(startAngleRad);
    const endX = cx0 + r * Math.cos(endAngleRad);
    const endY = cy0 + r * Math.sin(endAngleRad);
    const largeArc = Math.abs(endAngleRad - startAngleRad) <= Math.PI ? "0" : "1";
    const sweepFlag = endAngleRad > startAngleRad ? "1" : "0";
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", id);
    path.setAttribute("d", `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`);
    path.setAttribute("class", className);
    sandboxSvg.appendChild(path);
}

// 绘制角弧
function drawAngleArc(id, cx, cy, startAngleRad, endAngleRad, r) {
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
    pathArc.setAttribute("class", "geo-angle-arc");
    sandboxSvg.appendChild(pathArc);
}

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

function drawPoint(name, x, y, isDraggable, type = "a") {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `geo-point-wrapper ${isDraggable ? 'draggable' : ''}`);
    
    if (isDraggable) {
        group.setAttribute("id", `draggable-point-${type}`);
        const capture = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        capture.setAttribute("cx", `${x}`);
        capture.setAttribute("cy", `${y}`);
        capture.setAttribute("r", "46");
        capture.setAttribute("class", "geo-point-hit");
        capture.setAttribute("fill", "transparent");
        capture.setAttribute("style", "pointer-events: all; cursor: grab; touch-action: none;");
        group.appendChild(capture);
    }
    
    const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    halo.setAttribute("cx", `${x}`);
    halo.setAttribute("cy", `${y}`);
    halo.setAttribute("r", "15");
    halo.setAttribute("class", "geo-point-halo");
    group.appendChild(halo);
    
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", `${x}`);
    dot.setAttribute("cy", `${y}`);
    dot.setAttribute("r", `${isDraggable ? 7.5 : 6}`);
    dot.setAttribute("class", "geo-point");
    group.appendChild(dot);
    
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("class", `geo-label ${isDraggable ? 'draggable' : ''}`);
    txt.textContent = name;
    
    // 端点文字偏移避让
    if (name === "A") {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y - 14}`);
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
        txt.setAttribute("y", `${y + 24}`);
        txt.setAttribute("style", "text-anchor: middle;");
    } else if (name === "E") {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y + 26}`);
        txt.setAttribute("style", "text-anchor: middle;");
    }
    
    group.appendChild(txt);
    sandboxSvg.appendChild(group);
    
    if (isDraggable) {
        bindPointDragEvents(group, type);
    }
}

// 绘制主几何图形
function renderGeometry(geom) {
    sandboxSvg.innerHTML = "";
    
    // 绘制底边线段 BC
    const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseLine.setAttribute("x1", `${bx - 30}`);
    baseLine.setAttribute("y1", `${by}`);
    baseLine.setAttribute("x2", `${cx + 30}`);
    baseLine.setAttribute("y2", `${cy}`);
    baseLine.setAttribute("class", "geo-line-seg seg-base");
    sandboxSvg.appendChild(baseLine);
    
    if (isAnimating) {
        return; // 动画状态完全接管
    }
    
    // 1. 绘制背景填充三角形
    drawPolygonFill(`${geom.ax},${geom.ay} ${bx},${by} ${cx},${cy}`, "geo-polygon-fill");
    
    if (currentScene === "congruence") {
        drawPolygonFill(`${geom.ax},${geom.ay} ${dx},${dy} ${cx},${cy}`, "geo-triangle-patch patch-main");
        drawPolygonFill(`${geom.ex},${geom.ey} ${dx},${dy} ${bx},${by}`, "geo-triangle-patch patch-rotated");
        // 绘制对顶角弧线展示 ∠ADC ≅ ∠EDB
        const angADC = Math.atan2(geom.ay - dy, geom.ax - dx);
        drawAngleArc("arc-d1", dx, dy, angADC, 0, 24);
        drawAngleArc("arc-d2", dx, dy, -Math.PI, angADC + Math.PI, 24);
    } else if (currentScene === "inequality") {
        drawPolygonFill(`${geom.ax},${geom.ay} ${bx},${by} ${geom.ex},${geom.ey}`, "geo-triangle-patch patch-inequality");
    } else if (currentScene === "parallelogram") {
        drawPolygonFill(`${geom.ax},${geom.ay} ${bx},${by} ${geom.ex},${geom.ey} ${cx},${cy}`, "geo-quadrilateral-fill");
    }
    
    // 2. 绘制三角形 ABC 的各边
    drawRay("ray-ab", geom.ax, geom.ay, bx, by, "seg-gray");
    drawRay("ray-ac", geom.ax, geom.ay, cx, cy, "seg-gray");
    
    // 3. 绘制中线 AD (亮蓝)
    const lineAD = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineAD.setAttribute("x1", `${geom.ax}`);
    lineAD.setAttribute("y1", `${geom.ay}`);
    lineAD.setAttribute("x2", `${dx}`);
    lineAD.setAttribute("y2", `${dy}`);
    lineAD.setAttribute("class", "geo-line-seg seg-a");
    lineAD.setAttribute("style", "stroke-width: 4px; filter: drop-shadow(0 0 6px var(--primary));");
    sandboxSvg.appendChild(lineAD);
    
    // 4. 绘制延长线段 DE (亮蓝)
    const lineDE = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineDE.setAttribute("x1", `${dx}`);
    lineDE.setAttribute("y1", `${dy}`);
    lineDE.setAttribute("x2", `${geom.ex}`);
    lineDE.setAttribute("y2", `${geom.ey}`);
    lineDE.setAttribute("class", "geo-line-seg seg-a");
    lineDE.setAttribute("style", "stroke-width: 4px;");
    sandboxSvg.appendChild(lineDE);
    
    // 5. 绘制对应连接边 BE (全等/不等式高亮边 - 紫色)
    drawRay("ray-be", bx, by, geom.ex, geom.ey, "seg-b");
    
    // 6. 如果是平行四边形场景，绘制补全线段 CE (灰色)
    if (currentScene === "parallelogram") {
        drawRay("ray-ce", cx, cy, geom.ex, geom.ey, "seg-gray");
    }
    
    // 7. 绘制底等分线段 BD 和 DC (绿色)
    drawRay("seg-bd", bx, by, dx, dy, "seg-c");
    drawRay("seg-dc", dx, dy, cx, cy, "seg-c");

    drawEqualityTicks("tick-bd", bx, by, dx, dy, 1, "tick-midpoint");
    drawEqualityTicks("tick-dc", dx, dy, cx, cy, 1, "tick-midpoint");
    drawEqualityTicks("tick-ad", geom.ax, geom.ay, dx, dy, 2, "tick-median");
    drawEqualityTicks("tick-de", dx, dy, geom.ex, geom.ey, 2, "tick-median");
    drawEqualityTicks("tick-ac", geom.ax, geom.ay, cx, cy, 3, "tick-corresponding");
    drawEqualityTicks("tick-be", bx, by, geom.ex, geom.ey, 3, "tick-corresponding");
    
    // 8. 绘制端点
    drawPoint("B", bx, by, false);
    drawPoint("C", cx, cy, false);
    drawPoint("D", dx, dy, false);
    drawPoint("E", geom.ex, geom.ey, false);
    drawPoint("A", geom.ax, geom.ay, true, "a"); // A 点可拖拽
}

// 刷新浮动 HTML 数值标签与 HUD 板书内容
function updateHTMLOverlayAndHUD(geom) {
    htmlOverlay.innerHTML = "";
    if (isAnimating) return;
    const effectiveLabelMode = isPointDragging && labelMode === "all" ? "key" : labelMode;
    if (effectiveLabelMode === "none") {
        updateChalkboardHUD();
        return;
    }

    if (effectiveLabelMode === "key") {
        if (currentScene === "congruence") {
            createHTMLBraceLabel("lbl-key-mid", dx + 4, dy + 42, "BD = DC", "sub relation-tag");
            createHTMLBraceLabel("lbl-key-med", dx - 42, dy - 82, "AD = DE", "main relation-tag");
            createHTMLBraceLabel("lbl-key-side", dx + 124, dy - 100, "AC = BE", "match relation-tag");
        } else if (currentScene === "inequality") {
            createHTMLBraceLabel("lbl-key-side", dx + 118, dy - 94, "BE = AC", "match relation-tag");
            createHTMLBraceLabel("lbl-key-ae", dx - 58, dy - 84, "AE = 2AD", "main relation-tag");
            createHTMLBraceLabel("lbl-key-range", dx + 34, dy + 48, "中线范围", "sub relation-tag");
        } else {
            createHTMLBraceLabel("lbl-key-diag", dx + 24, dy - 54, "对角线互相平分", "main relation-tag wide");
            createHTMLBraceLabel("lbl-key-para", dx + 116, dy + 44, "ABEC 平行四边形", "match relation-tag wide");
        }
        updateChalkboardHUD();
        return;
    }
    
    // 1. 底边等分标签错层排布，给中心 D 点和角标留出空间
    createHTMLBraceLabel("lbl-bd", (bx + dx)/2 - 18, by + 20, `BD = ${geom.ab > 0 ? (120/40).toFixed(1) : "3.0"}`, "sub compact");
    createHTMLBraceLabel("lbl-dc", (dx + cx)/2 + 18, dy + 20, `DC = ${geom.ab > 0 ? (120/40).toFixed(1) : "3.0"}`, "sub compact");
    
    // 2. 各线段读数尽量放到线段外侧，避免集中压在 D 点附近
    createHTMLBraceLabel("lbl-ab", (renderValues.ax + bx)/2 - 68, (renderValues.ay + by)/2 - 34, `AB = ${renderValues.ab.toFixed(1)}`);
    createHTMLBraceLabel("lbl-ac", (renderValues.ax + cx)/2 + 42, (renderValues.ay + cy)/2 - 28, `AC = ${renderValues.ac.toFixed(1)}`);
    createHTMLBraceLabel("lbl-ad", (renderValues.ax + dx)/2 - 20, (renderValues.ay + dy)/2 - 34, `AD = ${renderValues.ad.toFixed(1)}`, "main");
    createHTMLBraceLabel("lbl-be", (bx + geom.ex)/2 - 44, (by + geom.ey)/2 + 20, `BE = ${renderValues.be.toFixed(1)}`, "sub");
    createHTMLBraceLabel("lbl-ae", (renderValues.ax + geom.ex)/2 + 38, (renderValues.ay + geom.ey)/2 - 30, `AE = ${renderValues.ae.toFixed(1)}`, "main");
    
    if (currentScene === "congruence") {
        const angADC = Math.atan2(geom.ay - dy, geom.ax - dx);
        const ptArc1 = { x: dx + 54 * Math.cos(angADC / 2) + 14, y: dy + 54 * Math.sin(angADC / 2) - 22 };
        const ptArc2 = { x: dx - 54 * Math.cos(angADC / 2) - 8, y: dy - 54 * Math.sin(angADC / 2) + 12 };
        createHTMLBraceLabel("lbl-arc1", ptArc1.x, ptArc1.y, `1`, "sub angle-tag");
        createHTMLBraceLabel("lbl-arc2", ptArc2.x, ptArc2.y, `2`, "sub angle-tag");
    }
    
    updateChalkboardHUD();
}

// 刷新 HUD 板书算式
function updateChalkboardHUD() {
    let html = "";
    
    if (currentScene === "congruence") {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">已知条件</div>
                <div class="hud-row-val">
                    AD 是 △ABC 的中线，D 是 BC 的中点：<br>
                    &rArr; <span style="color:var(--success); font-weight:700;">BD = CD</span> = 3.0
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">辅助线延长全等证明</div>
                <div class="hud-row-val">
                    延长 AD 到 E，使得 <span class="math-seg seg-a">DE = AD</span><br>
                    在 △ADC 和 △EDB 中：<br>
                    CD = BD (中点等分), <br>
                    ∠ADC = ∠EDB (对顶角相等), <br>
                    AD = ED (倍长中线辅助线)<br>
                    &rArr; <strong>△ADC ≅ △EDB (SAS)</strong>
                </div>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">全等对应线段相等</div>
                <div class="formula">
                    <span>EB = AC</span>
                    <span><span class="math-num">${renderValues.be.toFixed(1)}</span> = <span class="math-num">${renderValues.ac.toFixed(1)}</span></span>
                </div>
            </div>
        `;
    } else if (currentScene === "inequality") {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">全等代换已知</div>
                <div class="hud-row-val">
                    由旋转全等得：<br>
                    <span style="color:var(--purple); font-weight:700;">BE = AC</span> = ${renderValues.be.toFixed(1)}, <br>
                    <span style="color:var(--primary); font-weight:700;">AE = 2 &times; AD</span> = ${renderValues.ae.toFixed(1)}
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">在 △ABE 中应用三边关系</div>
                <div class="hud-row-val">
                    AB + BE > AE &rArr; AB + AC > 2 &times; AD<br>
                    |AB - BE| < AE &rArr; |AB - AC| < 2 &times; AD
                </div>
            </div>
            <div class="hud-equation-box">
                <div class="title">中线取值范围不等式</div>
                <div class="formula" style="font-size:11px;">
                    <span>1/2|AB-AC| &lt; AD &lt; 1/2(AB+AC)</span>
                    <span><span class="math-num">${renderValues.diffHalf.toFixed(2)}</span> &lt; <span class="math-num highlight">${renderValues.ad.toFixed(1)}</span> &lt; <span class="math-num">${renderValues.sumHalf.toFixed(2)}</span></span>
                </div>
            </div>
        `;
    } else {
        // parallelogram
        html = `
            <div class="hud-row">
                <div class="hud-row-label">几何图形分析</div>
                <div class="hud-row-val">
                    构造四边形 ABEC。
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">平行四边形性质推导</div>
                <div class="hud-row-val">
                    ∵ BD = CD (中点判定), <br>
                    ∵ AD = ED (对角线倍长辅助线)<br>
                    &rArr; 对角线 AE 和 BC 互相平分于点 D<br>
                    &rArr; <strong>四边形 ABEC 是平行四边形</strong><br>
                    &rArr; 对边平行且相等：<br>
                    AB &parallel; CE 且 AC &parallel; BE
                </div>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">平行四边形性质</div>
                <div class="formula">
                    <span>AC = BE = <span class="math-num">${renderValues.ac.toFixed(1)}</span></span>
                    <span>AB = CE = <span class="math-num">${renderValues.ab.toFixed(1)}</span></span>
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
        isPointDragging = true;
        group.classList.add("is-dragging");
        sandboxWrapper.classList.add("point-dragging");
    }
    
    function applyDrag(clientX, clientY, pointerType = "mouse") {
        const rect = sandboxWrapper.getBoundingClientRect();
        
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        // 缩放/平移状态下的坐标反算
        let newX = (mouseX - panX) / zoomScale;
        let newY = (mouseY - panY) / zoomScale;
        
        // 限制拖拽区域以防三角形退化
        if (newX < 120) newX = 120;
        if (newX > 480) newX = 480;
        if (newY < 100) newY = 100;
        if (newY > 330) newY = 330;
        
        // 鼠标保留磁吸读数；触屏/手写笔自由拖动，避免平板上出现“拖不动”的卡顿感。
        if (pointerType === "mouse") {
            const snap = 12;
            newX = Math.round(newX / snap) * snap;
            newY = Math.round(newY / snap) * snap;
        }
        
        // 更新全局状态变量
        aX = newX;
        aY = newY;
        
        // 同步滑动条
        sliderAX.value = aX;
        sliderAY.value = 390 - aY;
        valAX.textContent = `${aX.toFixed(0)} px`;
        valAY.textContent = `${(390 - aY).toFixed(0)} px`;
        
        runLerpLoop();
    }
    
    function finishDrag() {
        if (!isDragging) return;
        isDragging = false;
        activePointerId = null;
        isPointDragging = false;
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
            applyDrag(e.clientX, e.clientY, e.pointerType || lastPointerType);
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
        applyDrag(client.x, client.y, e.touches ? "touch" : "mouse");
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
// 旋转全等动画播放器 (Rotation Congruent Animation)
// ==========================================================================
function playCongruentAnimation() {
    if (isAnimating || currentScene !== "congruence") return;
    isAnimating = true;
    disableControls(true);
    
    const geom = solveGeometry(aX, aY);
    const duration = 2300; // 分阶段证明演示
    const startTime = performance.now();
    
    // 旋转目标：右侧 △ADC 绕中点 D(300, 390) 旋转 180度 变为 △EDB
    const initA = { x: geom.ax, y: geom.ay };
    const initC = { x: geom.cx, y: geom.cy };
    
    function animate(now) {
        const elapsed = now - startTime;
        let progress = Math.min(1.0, elapsed / duration);
        
        // EaseInOutCubic
        progress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // 旋转角度 (逆时针旋转 180度，即 -progress * 180)
        const alpha = -progress * Math.PI;
        
        // 旋转后的过渡顶点坐标 C' 和 A'
        const curCx = dx + (initC.x - dx) * Math.cos(alpha) - (initC.y - dy) * Math.sin(alpha);
        const curCy = dy + (initC.x - dx) * Math.sin(alpha) + (initC.y - dy) * Math.cos(alpha);
        
        const curAx = dx + (initA.x - dx) * Math.cos(alpha) - (initA.y - dy) * Math.sin(alpha);
        const curAy = dy + (initA.x - dx) * Math.sin(alpha) + (initA.y - dy) * Math.cos(alpha);
        
        renderAnimationStep(geom, curCx, curCy, curAx, curAy, progress);
        
        if (progress < 1.0) {
            requestAnimationFrame(animate);
        } else {
            // 瞬间，在 B 点和 E 点引爆碰撞火花
            const rect = sandboxWrapper.getBoundingClientRect();
            const expBX = rect.left + panX + bx * zoomScale;
            const expBY = rect.top + panY + by * zoomScale;
            const expEX = rect.left + panX + geom.ex * zoomScale;
            const expEY = rect.top + panY + geom.ey * zoomScale;
            
            triggerExplosion(expBX, expBY, ["#8b5cf6", "#3b82f6", "#ffffff"], 35);
            triggerExplosion(expEX, expEY, ["#8b5cf6", "#3b82f6", "#ffffff"], 30);
            
            setTimeout(() => {
                isAnimating = false;
                disableControls(false);
                runLerpLoop();
            }, 600);
        }
    }
    requestAnimationFrame(animate);
}

// 动画过程渲染
function renderAnimationStep(geom, curCx, curCy, curAx, curAy, progress) {
    sandboxSvg.innerHTML = "";
    htmlOverlay.innerHTML = "";
    
    // 绘制底边线段 BC
    const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseLine.setAttribute("x1", `${bx - 30}`);
    baseLine.setAttribute("y1", `${by}`);
    baseLine.setAttribute("x2", `${cx + 30}`);
    baseLine.setAttribute("y2", `${cy}`);
    baseLine.setAttribute("class", "geo-line-seg seg-base");
    sandboxSvg.appendChild(baseLine);
    
    // 绘制三角形 ABC (骨架)
    drawSkeleton("orig-ab", geom.ax, geom.ay, bx, by);
    drawSkeleton("orig-ac", geom.ax, geom.ay, geom.cx, geom.cy);
    drawSkeleton("orig-ad", geom.ax, geom.ay, dx, dy);
    drawPolygonFill(`${geom.ax},${geom.ay} ${dx},${dy} ${cx},${cy}`, "geo-triangle-patch patch-main ghost");
    drawPolygonFill(`${geom.ex},${geom.ey} ${dx},${dy} ${bx},${by}`, "geo-triangle-patch patch-rotated ghost");
    
    // 绘制等分线段
    drawRay("seg-bd", bx, by, dx, dy, "seg-c");
    drawRay("seg-dc", dx, dy, cx, cy, "seg-c");
    drawEqualityTicks("tick-anim-bd", bx, by, dx, dy, 1, "tick-midpoint");
    drawEqualityTicks("tick-anim-dc", dx, dy, cx, cy, 1, "tick-midpoint");
    drawEqualityTicks("tick-anim-ad", geom.ax, geom.ay, dx, dy, 2, "tick-median");
    drawEqualityTicks("tick-anim-de", dx, dy, geom.ex, geom.ey, 2, "tick-median");
    
    // 绘制延长目的地虚线骨架 (△EDB)
    drawSkeleton("dest-eb", geom.ex, geom.ey, bx, by);
    drawSkeleton("dest-ed", geom.ex, geom.ey, dx, dy);
    
    // 绘制对顶角弧线
    const angADC = Math.atan2(geom.ay - dy, geom.ax - dx);
    const alpha = -progress * Math.PI;
    drawAngleArc("arc-rot-d1", dx, dy, angADC + alpha, alpha, 24);
    drawAngleArc("arc-rot-d2", dx, dy, -Math.PI + alpha, angADC + Math.PI + alpha, 24);
    drawOpenArc("arc-motion-guide", dx, dy, 0.08, -Math.PI + 0.08, 58, "geo-rotation-guide");
    
    // 绘制旋转过渡中的三角形 (发光霓虹)
    // 边1: D -> curCx (对应 DC)
    const gLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine1.setAttribute("x1", `${dx}`); gLine1.setAttribute("y1", `${dy}`);
    gLine1.setAttribute("x2", `${curCx}`); gLine1.setAttribute("y2", `${curCy}`);
    gLine1.setAttribute("class", "geo-line-seg seg-c");
    gLine1.setAttribute("style", "stroke-width: 4px;");
    sandboxSvg.appendChild(gLine1);
    
    // 边2: curCx -> curAx (对应 CA)
    const gLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine2.setAttribute("x1", `${curCx}`); gLine2.setAttribute("y1", `${curCy}`);
    gLine2.setAttribute("x2", `${curAx}`); gLine2.setAttribute("y2", `${curAy}`);
    gLine2.setAttribute("class", "geo-line-seg seg-b");
    gLine2.setAttribute("style", "stroke-width: 4px; filter: drop-shadow(0 0 6px var(--purple));");
    sandboxSvg.appendChild(gLine2);
    
    // 边3: curAx -> D (对应 AD)
    const gLine3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine3.setAttribute("x1", `${curAx}`); gLine3.setAttribute("y1", `${curAy}`);
    gLine3.setAttribute("x2", `${dx}`); gLine3.setAttribute("y2", `${dy}`);
    gLine3.setAttribute("class", "geo-line-seg seg-a");
    gLine3.setAttribute("style", "stroke-width: 4.5px; filter: drop-shadow(0 0 6px var(--primary));");
    sandboxSvg.appendChild(gLine3);
    drawEqualityTicks("tick-spin-side", curCx, curCy, curAx, curAy, 3, "tick-corresponding");
    
    // 绘制顶点
    drawPoint("B", bx, by, false);
    drawPoint("D", dx, dy, false);
    drawPoint("C'", curCx, curCy, false);
    drawPoint("A'", curAx, curAy, false);
    
    const phase = progress < 0.18
        ? { name: "1  找中心", detail: "D 是旋转中心，BD = DC，AD = DE" }
        : progress < 0.72
            ? { name: "2  转三角形", detail: "△ADC 绕 D 旋转 180°，C 对应到 B，A 对应到 E" }
            : progress < 0.92
                ? { name: "3  看重合", detail: "△ADC 与 △EDB 重合，得到对应边 AC 与 BE" }
                : { name: "4  得结论", detail: "△ADC ≅ △EDB，所以 BE = AC" };
    createHTMLBraceLabel("lbl-anim", (curAx + curCx)/2, (curAy + curCy)/2 - 18, phase.name, "main relation-tag");
    if (progress > 0.86) {
        createHTMLBraceLabel("lbl-anim-result", dx + 126, dy - 104, "BE = AC", "match relation-tag");
    }
    
    stepsChalkboard.innerHTML = `
        <div class="hud-row">
            <div class="hud-row-label">${phase.name}</div>
            <div class="hud-row-val" style="color:var(--primary); font-weight:700;">
                ${phase.detail}
            </div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">顶点旋转对应</div>
            <div class="hud-row-val">
                顶点 C &rArr; B（BD = DC）<br>
                顶点 A &rArr; E（AD = ED）<br>
                对应边 AC &rArr; BE (全等重合)
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
    
    // 模型内部坐标中心点 (中点 D 在 300, 390，三角形主体在 Y 轴 100 ~ 680)
    const modelCX = 300;
    const modelCY = 390;
    
    if (forceScale !== null) {
        zoomScale = forceScale;
    } else {
        const modelW = 380;
        const modelH = 460;
        const scaleX = W / modelW;
        const scaleY = H / modelH;
        zoomScale = Math.min(scaleX, scaleY);
        if (zoomScale < 0.5) zoomScale = 0.5;
        if (zoomScale > 1.2) zoomScale = 1.2;
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

function bindTouchSafety() {
    ["contextmenu", "selectstart", "dragstart", "copy", "cut", "paste"].forEach((type) => {
        sandboxWrapper.addEventListener(type, (event) => event.preventDefault());
    });
}

function bindHudScrollIsolation() {
    const stopCanvasGesture = (event) => event.stopPropagation();
    hudPanel.addEventListener("wheel", stopCanvasGesture, { passive: true });
    hudPanel.addEventListener("touchstart", stopCanvasGesture, { passive: true });
    hudPanel.addEventListener("touchmove", stopCanvasGesture, { passive: true });
}

function onPanStart(e) {
    if (isAnimating) return;
    if (e.target.closest(".draggable") || e.target.closest(".btn-zoom") || e.target.closest(".hud-panel") || e.target.closest(".btn-icon")) {
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
    
    e.preventDefault();
}

function onPanMove(e) {
    // 移动端双指缩放
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
    
    if (scene === "congruence") {
        btnPlayRotation.style.display = "inline-flex";
    } else {
        btnPlayRotation.style.display = "none";
    }
    
    updateTheoryCard(scene);
    runLerpLoop();
    centerModel();
}

function setLabelMode(mode) {
    if (!["key", "all", "none"].includes(mode)) return;
    labelMode = mode;
    markModeButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-label-mode") === mode);
    });
    runLerpLoop();
}

function updateTheoryCard(scene) {
    if (scene === "congruence") {
        theoryTitle.innerHTML = "💡 倍长中线全等性质";
        theoryText.innerHTML = `
            <p><strong>倍长中线模型</strong>是初中几何处理中线问题最核心、最经典的手法：</p>
            <p>1. <strong>构造辅助线</strong>：延长中线 AD 到点 E，使 DE = AD。连接 BE 构造辅助三角形。</p>
            <p>2. <strong>对折旋转全等</strong>：将右侧 △ADC 绕中点 D 逆时针旋转 180°，会与 △EDB 完美重合（因为对顶角相等，中线等分底边）。</p>
            <p>3. <strong>全等映射</strong>：根据 SAS 可轻松判定 <strong>△ADC ≅ △EDB</strong>。由全等三角形对应边相等性质，立即推导出：
            <strong>BE = AC</strong></p>
        `;
    } else if (scene === "inequality") {
        theoryTitle.innerHTML = "💡 三角形中线不等式关系";
        theoryText.innerHTML = `
            <p>中线长度范围的判定，是中考几何不等式问题的常客：</p>
            <p>1. <strong>三边关系代换</strong>：在 △ABE 中，根据三角形三边关系，任意两边之和大于第三边，两边之差小于第三边：
            <strong>AB + BE > AE，|AB - BE| < AE</strong></p>
            <p>2. <strong>等量代换推导</strong>：用 BE = AC 和 AE = 2 × AD 代入，即可化简得出：
            <strong>1/2|AB - AC| < AD < 1/2(AB + AC)</strong></p>
            <p>3. <strong>数学探究</strong>：教师拖拽 A 点，可以看到不等式左右两端和中线 AD 大小的动态互补，但不等式关系恒定绝对成立。</p>
        `;
    } else {
        theoryTitle.innerHTML = "💡 构造平行四边形性质";
        theoryText.innerHTML = `
            <p>倍长中线的几何本质，是通过平分对角线构造平行四边形：</p>
            <p>1. <strong>对角线平分判定</strong>：在四边形 ABEC 中，对角线 AE 与 BC 互相平分于点 D（BD = CD，AD = ED）。</p>
            <p>2. <strong>平行四边形判定</strong>：对角线互相平分的四边形是<strong>平行四边形 ABEC</strong>。</p>
            <p>3. <strong>几何边角性质</strong>：平行四边形的对边不仅平行且相等，因此有 AB ∥ CE、AC ∥ BE，且 AB = CE、AC = BE。这使多边形综合转换更为便利。</p>
        `;
    }
}

function disableControls(disable) {
    sliderAX.disabled = disable;
    sliderAY.disabled = disable;
    btnPlayRotation.disabled = disable;
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
    markModeButtons.forEach(btn => {
        btn.disabled = disable;
        btn.style.opacity = disable ? "0.5" : "1";
        btn.style.cursor = disable ? "not-allowed" : "pointer";
    });
}

function resetState() {
    if (isAnimating) return;
    aX = 240.0;
    aY = 210.0;
    
    sliderAX.value = 240;
    sliderAY.value = 390 - 210;
    valAX.textContent = "240 px";
    valAY.textContent = "180 px";
    
    runLerpLoop();
    centerModel();
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
    markModeButtons.forEach(btn => {
        btn.addEventListener("click", () => setLabelMode(btn.getAttribute("data-label-mode")));
    });
    
    // 2. 滑动条事件
    sliderAX.addEventListener("input", (e) => {
        aX = parseFloat(e.target.value);
        valAX.textContent = `${aX.toFixed(0)} px`;
        runLerpLoop();
    });
    
    sliderAY.addEventListener("input", (e) => {
        // height = 390 - ay => ay = 390 - height
        const height = parseFloat(e.target.value);
        aY = 390 - height;
        valAY.textContent = `${height.toFixed(0)} px`;
        runLerpLoop();
    });
    
    // 3. 按钮事件
    btnPlayRotation.addEventListener("click", playCongruentAnimation);
    btnResetState.addEventListener("click", resetState);
    
    // 4. 帮助弹窗
    btnShowHelp.addEventListener("click", () => {
        modalHelp.classList.add("active");
    });
    btnCloseHelp.addEventListener("click", () => {
        modalHelp.classList.remove("active");
    });
    
    // 5. Collapsible HUD
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
    
    // 6. 全局测试状态接口封装 (供 headless 自动化测试读取)
    window.appState = {
        get currentScene() { return currentScene; },
        get aX() { return aX; },
        get aY() { return aY; },
        get isAnimating() { return isAnimating; },
        get isHudExpanded() { return isHudExpanded; },
        get labelMode() { return labelMode; },
        get zoomScale() { return zoomScale; },
        get panX() { return panX; },
        get panY() { return panY; },
        get renderValues() {
            return {
                ax: renderValues.ax,
                ay: renderValues.ay,
                ab: renderValues.ab,
                ac: renderValues.ac,
                ad: renderValues.ad,
                be: renderValues.be,
                ae: renderValues.ae,
                sumHalf: renderValues.sumHalf,
                diffHalf: renderValues.diffHalf
            };
        }
    };
    
    // 7. 画布缩放与平移拖拽事件绑定
    bindTouchSafety();
    bindHudScrollIsolation();
    bindCanvasZoomEvents();
    bindCanvasPanEvents();
    
    // 8. 快捷缩放按钮事件绑定
    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());
    
    // 9. 载入初始场景
    setLabelMode("key");
    loadScene("congruence");
}

document.addEventListener("DOMContentLoaded", init);

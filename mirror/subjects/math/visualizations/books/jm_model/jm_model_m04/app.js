/**
 * 正方形 45° 半角模型演示仪 - 交互逻辑 (app.js)
 * 1. 几何坐标精密联动（旋转半角模型）
 * 2. 逆时针旋转全等过渡动画 + Canvas 物理碰撞火花
 * 3. 一阶低通滤波 LERP 缓动渲染引擎
 * 4. 可折叠半透明 HUD 板书公式动态同步
 * 5. 画布自由缩放、平移与模型居中系统
 */

// ==========================================================================
// 全局状态与配置
// ==========================================================================
let currentScene = "congruence";     // 当前场景: "congruence" | "perimeter" | "altitude"
let isAnimating = false;            // 是否在播放动画
let ePosPercent = 40.0;             // E点位置百分比 (5 ~ 95)
let isHudExpanded = false;          // HUD 默认收起
let demoPhase = "idle";             // 自动演示阶段: idle | angle | rotate | congruent | conclusion

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
    ePercent: 40.0,
    be: 0.0,
    df: 0.0,
    ef: 0.0,
    ce: 0.0,
    cf: 0.0,
    perimeter: 0.0,
    ah: 6.0
};

// 正方形顶点坐标常量
const ax = 180; const ay = 150;     // A 点
const bx = 180; const by = 390;     // B 点
const cx = 420; const cy = 390;     // C 点
const dx = 420; const dy = 150;     // D 点
const sideLength = 240;            // 边长

// DOM 元素引用
const sandboxWrapper = document.getElementById("sandbox-wrapper");
const sandboxSvg = document.getElementById("sandbox-svg");
const htmlOverlay = document.getElementById("html-overlay");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const hudPanel = document.getElementById("hud-chalkboard-panel");
const hudToggleBtn = document.getElementById("hud-toggle-btn");

const sliderEPos = document.getElementById("slider-e-pos");
const valEPos = document.getElementById("val-e-pos");

const btnPlayRotation = document.getElementById("btn-play-rotation");
const btnResetState = document.getElementById("btn-reset-state");
const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const modalHelp = document.getElementById("modal-help");

const theoryTitle = document.getElementById("theory-title");
const theoryText = document.getElementById("theory-text");
const teachingStatusCard = document.getElementById("teaching-status-card");
const statusTitle = document.getElementById("status-title");
const statusDetail = document.getElementById("status-detail");

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

// 根据 E 点位置百分比，计算所有几何关联坐标与读数
function solveGeometry(percent) {
    // E 点在 BC 上
    const ex = bx + (percent / 100.0) * sideLength;
    const ey = by;
    
    // 设 ∠BAE = theta
    const theta = Math.atan2(ex - ax, by - ay); // (ex - 180, 240)
    
    // 为了使 ∠EAF = 45度，且 F 在 CD 上，设 ∠DAF = phi = 45° - theta
    const phi = (45 * Math.PI / 180) - theta;
    
    // DF 长度
    const distDF = sideLength * Math.tan(phi);
    
    // F 点在 CD 上
    const fx = cx;
    const fy = dy + distDF; // (420, 150 + DF)
    
    // 计算 H 点 (A点到 EF 边的垂足)
    // 向量 v = F - E
    const vx = fx - ex;
    const vy = fy - ey;
    // 向量 w = A - E
    const wx = ax - ex;
    const wy = ay - ey;
    const lenSq = vx * vx + vy * vy;
    const t = (wx * vx + wy * vy) / lenSq;
    const hx = ex + t * vx;
    const hy = ey + t * vy;
    
    // 计算实际长度并转换为逻辑厘米单位 (40px = 1cm)
    const valBE = (ex - bx) / 40.0;
    const valDF = (fy - dy) / 40.0;
    const valCE = (cx - ex) / 40.0;
    const valCF = (cy - fy) / 40.0;
    const valEF = Math.sqrt((fx - ex)**2 + (fy - ey)**2) / 40.0;
    const valAH = Math.sqrt((hx - ax)**2 + (hy - ay)**2) / 40.0;
    const valPerimeter = valCE + valCF + valEF;
    
    return {
        ax, ay, bx, by, cx, cy, dx, dy,
        ex, ey, fx, fy, hx, hy,
        be: valBE,
        df: valDF,
        ce: valCE,
        cf: valCF,
        ef: valEF,
        ah: valAH,
        perimeter: valPerimeter
    };
}

function getCurrentGeometry() {
    return solveGeometry(ePosPercent);
}

// ==========================================================================
// LERP 循环引擎，处理数值平滑读数
// ==========================================================================
function runLerpLoop() {
    const geom = getCurrentGeometry();
    const target = {
        ePercent: ePosPercent,
        be: geom.be,
        df: geom.df,
        ef: geom.ef,
        ce: geom.ce,
        cf: geom.cf,
        perimeter: geom.perimeter,
        ah: geom.ah
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
    
    renderGeometry(geom);
    updateHTMLOverlayAndHUD(geom);
    
    if (isChanged || isAnimating) {
        requestAnimationFrame(runLerpLoop);
    }
}

// ==========================================================================
// SVG 渲染与 DOM 生成 (SVG Drawing & Dynamic Overlays)
// ==========================================================================

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

function drawConstructionSegment(id, x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", id);
    line.setAttribute("x1", `${x1}`);
    line.setAttribute("y1", `${y1}`);
    line.setAttribute("x2", `${x2}`);
    line.setAttribute("y2", `${y2}`);
    line.setAttribute("class", "geo-line-construction");
    sandboxSvg.appendChild(line);
}

function drawTrianglePatch(points, className) {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
    polygon.setAttribute("class", `geo-triangle-patch ${className}`);
    sandboxSvg.appendChild(polygon);
}

function drawConstructionPoint(name, x, y) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "geo-construction-point");

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", `${x}`);
    dot.setAttribute("cy", `${y}`);
    dot.setAttribute("r", "5");
    group.appendChild(dot);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", `${x + 12}`);
    txt.setAttribute("y", `${y - 8}`);
    txt.textContent = name;
    group.appendChild(txt);

    sandboxSvg.appendChild(group);
}

// 绘制角度圆弧
function drawAngleArc(id, cx, cy, startAngleRad, endAngleRad, r) {
    const startX = cx + r * Math.cos(startAngleRad);
    const startY = cy + r * Math.sin(startAngleRad);
    const endX = cx + r * Math.cos(endAngleRad);
    const endY = cy + r * Math.sin(endAngleRad);
    
    const largeArc = Math.abs(endAngleRad - startAngleRad) <= Math.PI ? "0" : "1";
    const sweepFlag = endAngleRad > startAngleRad ? "1" : "0";
    
    // 绘制填充扇形
    const pathDec = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathDec.setAttribute("d", `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${endX} ${endY} L ${cx} ${cy} Z`);
    pathDec.setAttribute("class", "geo-angle-sector");
    sandboxSvg.appendChild(pathDec);
    
    // 绘制圆弧描边
    const pathArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathArc.setAttribute("id", id);
    pathArc.setAttribute("d", `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`);
    pathArc.setAttribute("class", "geo-angle-arc");
    sandboxSvg.appendChild(pathArc);
}

// 绘制垂足直角标记
function drawRightAngleSymbol(cx, cy, ux, uy, vx, vy, s = 8) {
    const p1x = cx + s * ux;
    const p1y = cy + s * uy;
    const p2x = cx + s * ux + s * vx;
    const p2y = cy + s * uy + s * vy;
    const p3x = cx + s * vx;
    const p3y = cy + s * vy;
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y}`);
    path.setAttribute("class", "geo-right-angle");
    sandboxSvg.appendChild(path);
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

function segmentLabelPoint(x1, y1, x2, y2, t, offset, flip = 1) {
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    const vx = x2 - x1;
    const vy = y2 - y1;
    const len = Math.max(1, Math.hypot(vx, vy));
    const nx = -vy / len;
    const ny = vx / len;
    return {
        x: px + nx * offset * flip,
        y: py + ny * offset * flip
    };
}

function clampOverlayPoint(point) {
    return {
        x: Math.max(92, Math.min(508, point.x)),
        y: Math.max(80, Math.min(462, point.y))
    };
}

function setTeachingStatus(eyebrow, title, detail, mode = "") {
    if (!teachingStatusCard) return;
    teachingStatusCard.className = `teaching-status-card ${mode}`.trim();
    const eyebrowNode = teachingStatusCard.querySelector(".status-eyebrow");
    if (eyebrowNode) eyebrowNode.textContent = eyebrow;
    if (statusTitle) statusTitle.textContent = title;
    if (statusDetail) statusDetail.textContent = detail;
}

function updateTeachingStatus(geom) {
    if (demoPhase === "angle") {
        setTeachingStatus("第 1 步", "找到 45° 半角", "45° 是正方形 90° 的一半", "is-demo");
        return;
    }
    if (demoPhase === "rotate") {
        setTeachingStatus("第 2 步", "旋转 △ABE", "绕 A 旋转 90°，补出 △ADG", "is-demo");
        return;
    }
    if (demoPhase === "congruent") {
        setTeachingStatus("第 3 步", "△AEF ≅ △AGF", "SAS：AE=AG，夹角相等，AF 公共", "is-proof");
        return;
    }
    if (demoPhase === "conclusion") {
        setTeachingStatus("结论", "EF = BE + DF", `${renderValues.ef.toFixed(1)} = ${renderValues.be.toFixed(1)} + ${renderValues.df.toFixed(1)}`, "is-result");
        return;
    }

    if (currentScene === "perimeter") {
        setTeachingStatus("周长恒定", "CE+CF+EF = 12.0", `${renderValues.perimeter.toFixed(2)} ≈ 2 × 边长`, "is-result");
    } else if (currentScene === "altitude") {
        setTeachingStatus("高线恒定", "AH = AB = 6.0", `当前 AH = ${renderValues.ah.toFixed(1)}`, "is-result");
    } else {
        setTeachingStatus("旋转全等", "EF = BE + DF", `${renderValues.ef.toFixed(1)} = ${renderValues.be.toFixed(1)} + ${renderValues.df.toFixed(1)}`, "is-result");
    }
}

function interpolatePoint(p1, p2, t, ox = 0, oy = 0) {
    return {
        x: p1.x + (p2.x - p1.x) * t + ox,
        y: p1.y + (p2.y - p1.y) * t + oy
    };
}

function drawPoint(name, x, y, isDraggable, type = "e") {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `geo-point-wrapper ${isDraggable ? 'draggable' : ''}`);
    
    if (isDraggable) {
        group.setAttribute("id", `draggable-point-${type}`);
        // 隐形超大鼠标/触控捕获热区，平板下更容易抓住 E 点。
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
    
    if (name === "A") {
        txt.setAttribute("x", `${x - 14}`);
        txt.setAttribute("y", `${y - 6}`);
        txt.setAttribute("style", "text-anchor: end;");
    } else if (name === "B") {
        txt.setAttribute("x", `${x - 12}`);
        txt.setAttribute("y", `${y + 16}`);
        txt.setAttribute("style", "text-anchor: end;");
    } else if (name === "C") {
        txt.setAttribute("x", `${x + 12}`);
        txt.setAttribute("y", `${y + 16}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else if (name === "D") {
        txt.setAttribute("x", `${x + 12}`);
        txt.setAttribute("y", `${y - 12}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else if (name === "E") {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y + 24}`);
        txt.setAttribute("style", "text-anchor: middle;");
    } else if (name === "F") {
        txt.setAttribute("x", `${x + 18}`);
        txt.setAttribute("y", `${y + 6}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else if (name === "H") {
        // H 垂足，偏移方向朝向角 A 的反方向
        const dx = x - ax;
        const dy = y - ay;
        const len = Math.sqrt(dx*dx + dy*dy);
        txt.setAttribute("x", `${x + (dx / len) * 16}`);
        txt.setAttribute("y", `${y + (dy / len) * 16 + 4}`);
        txt.setAttribute("style", "text-anchor: middle;");
    } else {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y - 12}`);
        txt.setAttribute("style", "text-anchor: middle;");
    }
    
    group.appendChild(txt);
    sandboxSvg.appendChild(group);
    
    if (isDraggable) {
        bindPointDragEvents(group, type);
    }
}

// 绘制几何图形
function renderGeometry(geom) {
    sandboxSvg.innerHTML = "";
    
    // 绘制正方形背景外框
    const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    square.setAttribute("x", `${ax}`);
    square.setAttribute("y", `${ay}`);
    square.setAttribute("width", `${sideLength}`);
    square.setAttribute("height", `${sideLength}`);
    square.setAttribute("class", "geo-square-base");
    sandboxSvg.appendChild(square);
    
    if (isAnimating && demoPhase !== "angle") {
        return; // 动画过程完全由动画渲染器接管
    }
    
    // 绘制 45° 半角扇形
    const angE = Math.atan2(geom.ex - ax, geom.ey - ay);
    const angF = Math.atan2(geom.fx - ax, geom.fy - ay);
    // Y轴向下，正X向右。旋转起止角（以X正向即正右方为0）
    const radE = Math.PI/2 - angE; // 向量 AE 的极角 (Y轴是向下的，所以在屏幕坐标中：AE的X偏移是 ex-180, Y偏移是 240)
    // 实际上直接用 atan2 在屏幕坐标系下计算
    const saE = Math.atan2(geom.ey - ay, geom.ex - ax);
    const saF = Math.atan2(geom.fy - ay, geom.fx - ax);
    drawAngleArc("arc-45", ax, ay, saF, saE, 32);
    
    // 绘制半角射线 AE 和 AF (亮蓝)
    drawRay("ray-ae", ax, ay, geom.ex, geom.ey, "seg-a");
    drawRay("ray-af", ax, ay, geom.fx, geom.fy, "seg-a");
    
    // 绘制折线 EF (橙色)
    const lineEF = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineEF.setAttribute("x1", `${geom.ex}`);
    lineEF.setAttribute("y1", `${geom.ey}`);
    lineEF.setAttribute("x2", `${geom.fx}`);
    lineEF.setAttribute("y2", `${geom.fy}`);
    lineEF.setAttribute("class", "geo-line-seg seg-c");
    lineEF.setAttribute("style", "stroke-width: 4px; filter: drop-shadow(0 0 6px var(--warning));");
    sandboxSvg.appendChild(lineEF);
    
    // 绘制线段 BE 和 DF (紫色)
    drawRay("seg-be", bx, by, geom.ex, geom.ey, "seg-b");
    drawRay("seg-df", dx, dy, geom.fx, geom.fy, "seg-b");
    
    // 如果是场景 3：绘制高线 AH 及垂足 H
    if (currentScene === "altitude") {
        const lineAH = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineAH.setAttribute("x1", `${ax}`);
        lineAH.setAttribute("y1", `${ay}`);
        lineAH.setAttribute("x2", `${geom.hx}`);
        lineAH.setAttribute("y2", `${geom.hy}`);
        lineAH.setAttribute("class", "geo-line-skeleton");
        lineAH.setAttribute("style", "stroke: var(--warning); stroke-width: 2.5px;");
        sandboxSvg.appendChild(lineAH);
        
        // 绘制 H 处的直角标记
        // 垂线向量 u (H -> A)
        const uLen = Math.sqrt((ax - geom.hx)**2 + (ay - geom.hy)**2);
        const ux = (ax - geom.hx) / uLen;
        const uy = (ay - geom.hy) / uLen;
        // 切线向量 v (H -> E)
        const vLen = Math.sqrt((geom.ex - geom.hx)**2 + (geom.ey - geom.hy)**2);
        const vx = (geom.ex - geom.hx) / vLen;
        const vy = (geom.ey - geom.hy) / vLen;
        drawRightAngleSymbol(geom.hx, geom.hy, ux, uy, vx, vy, 10);
        
        // 绘制垂足 H
        drawPoint("H", geom.hx, geom.hy, false);
    }
    
    // 绘制顶点
    drawPoint("A", ax, ay, false);
    drawPoint("B", bx, by, false);
    drawPoint("C", cx, cy, false);
    drawPoint("D", dx, dy, false);
    drawPoint("F", geom.fx, geom.fy, false);
    drawPoint("E", geom.ex, geom.ey, true, "e"); // E 点可拖动
}

// 刷新浮动 HTML 数值标签与 HUD 板书内容
function updateHTMLOverlayAndHUD(geom) {
    htmlOverlay.innerHTML = "";
    if (isAnimating && demoPhase !== "angle") {
        updateTeachingStatus(geom);
        return;
    }
    
    const saE = Math.atan2(geom.ey - ay, geom.ex - ax);
    const saF = Math.atan2(geom.fy - ay, geom.fx - ax);
    const midAngle = (saE + saF) / 2;
    const labelPos = {
        x: ax + 66 * Math.cos(midAngle),
        y: ay + 66 * Math.sin(midAngle)
    };

    createHTMLBraceLabel("lbl-ang-45", labelPos.x, labelPos.y, "45°", "angle");

    const efLabel = clampOverlayPoint(segmentLabelPoint(geom.ex, geom.ey, geom.fx, geom.fy, 0.5, -30));
    createHTMLBraceLabel("lbl-ef", efLabel.x, efLabel.y, `EF ${renderValues.ef.toFixed(1)}`, "main");

    if (currentScene === "congruence") {
        createHTMLBraceLabel("lbl-be", (bx + geom.ex) / 2, by + 34, `BE ${renderValues.be.toFixed(1)}`, "sub");
        createHTMLBraceLabel("lbl-df", dx + 38, (dy + geom.fy) / 2, `DF ${renderValues.df.toFixed(1)}`, "sub");
    }

    if (currentScene === "perimeter") {
        createHTMLBraceLabel("lbl-ce", (geom.ex + cx) / 2, cy + 34, `CE ${renderValues.ce.toFixed(1)}`, "sub");
        createHTMLBraceLabel("lbl-cf", cx + 38, (geom.fy + cy) / 2, `CF ${renderValues.cf.toFixed(1)}`, "sub");
    } else if (currentScene === "altitude") {
        const ahLabel = clampOverlayPoint(segmentLabelPoint(ax, ay, geom.hx, geom.hy, 0.54, 26));
        createHTMLBraceLabel("lbl-ah", ahLabel.x, ahLabel.y, `AH ${renderValues.ah.toFixed(1)}`, "main");
    }
    
    updateChalkboardHUD();
    updateTeachingStatus(geom);
}

// 刷新 HUD 板书算式
function updateChalkboardHUD() {
    let html = "";
    
    if (currentScene === "congruence") {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">已知</div>
                <div class="hud-row-val">正方形 ABCD，∠EAF = 45°</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">构造</div>
                <div class="hud-row-val">△ABE 绕 A 旋转 90°，得到 △ADG</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">判定</div>
                <div class="hud-row-val">AE = AG，∠EAF = ∠GAF，AF 公共</div>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">结论</div>
                <div class="formula">
                    <span>△AEF ≅ △AGF</span>
                    <span>EF = BE + DF</span>
                </div>
            </div>
        `;
    } else if (currentScene === "perimeter") {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">代换</div>
                <div class="hud-row-val">EF = BE + DF</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">整理</div>
                <div class="hud-row-val">CE + CF + EF = (CE+BE) + (CF+DF)</div>
            </div>
            <div class="hud-equation-box">
                <div class="title">结论</div>
                <div class="formula">
                    <span>CE+CF+EF = BC+CD</span>
                    <span><span class="math-num highlight">${renderValues.perimeter.toFixed(2)}</span> = 12.00</span>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">作高</div>
                <div class="hud-row-val">AH ⟂ EF，H 在 EF 上</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">对应</div>
                <div class="hud-row-val">△AEF ≅ △AGF，对应高相等</div>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">结论</div>
                <div class="formula">
                    <span>AH = AB</span>
                    <span><span class="math-num">${renderValues.ah.toFixed(1)}</span> = <span class="math-num highlight">6.0</span></span>
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
        
        // 限制在 BC 边内 (5% ~ 95%)
        const minLimitX = bx + 0.05 * sideLength;
        const maxLimitX = bx + 0.95 * sideLength;
        if (newX < minLimitX) newX = minLimitX;
        if (newX > maxLimitX) newX = maxLimitX;
        
        // 鼠标保留磁吸读数；触屏/手写笔自由拖动，避免平板上出现“拖不动”的卡顿感。
        if (pointerType === "mouse") {
            const snap = 12;
            const relativeX = newX - bx;
            const snappedRel = Math.round(relativeX / snap) * snap;
            newX = bx + snappedRel;
        }
        
        // 反算百分比
        ePosPercent = (newX - bx) / sideLength * 100;
        sliderEPos.value = ePosPercent;
        valEPos.textContent = `${ePosPercent.toFixed(0)}%`;
        
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
// 旋转全等动画播放器 (Rotation Congruent Animation)
// ==========================================================================
function playCongruentAnimation() {
    if (isAnimating || currentScene !== "congruence") return;
    isAnimating = true;
    demoPhase = "angle";
    disableControls(true);
    
    const geom = solveGeometry(ePosPercent);
    const initB = { x: bx, y: by };
    const initE = { x: geom.ex, y: geom.ey };

    renderGeometry(geom);
    updateHTMLOverlayAndHUD(geom);
    updateChalkboardHUD();

    setTimeout(() => {
        if (!isAnimating) return;
        demoPhase = "rotate";
        const duration = 1450;
        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            let progress = Math.min(1.0, elapsed / duration);
            progress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const alpha = -progress * Math.PI / 2;
            const curBx = ax + (initB.x - ax) * Math.cos(alpha) - (initB.y - ay) * Math.sin(alpha);
            const curBy = ay + (initB.x - ax) * Math.sin(alpha) + (initB.y - ay) * Math.cos(alpha);
            const curEx = ax + (initE.x - ax) * Math.cos(alpha) - (initE.y - ay) * Math.sin(alpha);
            const curEy = ay + (initE.x - ax) * Math.sin(alpha) + (initE.y - ay) * Math.cos(alpha);

            renderAnimationStep(geom, curBx, curBy, curEx, curEy, progress);

            if (progress < 1.0) {
                requestAnimationFrame(animate);
                return;
            }

            const rect = sandboxWrapper.getBoundingClientRect();
            const gx = dx;
            const gy = dy - (geom.ex - bx);
            const expDX = rect.left + panX + dx * zoomScale;
            const expDY = rect.top + panY + dy * zoomScale;
            const expGX = rect.left + panX + gx * zoomScale;
            const expGY = rect.top + panY + gy * zoomScale;
            
            triggerExplosion(expDX, expDY, ["#8b5cf6", "#3b82f6", "#ffffff"], 26);
            triggerExplosion(expGX, expGY, ["#8b5cf6", "#3b82f6", "#ffffff"], 22);

            demoPhase = "congruent";
            renderAnimationStep(geom, dx, dy, gx, gy, 1);

            setTimeout(() => {
                if (!isAnimating) return;
                demoPhase = "conclusion";
                renderAnimationStep(geom, dx, dy, gx, gy, 1);

                setTimeout(() => {
                    if (!isAnimating) return;
                    demoPhase = "idle";
                    isAnimating = false;
                    disableControls(false);
                    runLerpLoop();
                }, 1100);
            }, 950);
        }

        requestAnimationFrame(animate);
    }, 850);
}

// 动画过程渲染
function renderAnimationStep(geom, curBx, curBy, curEx, curEy, progress) {
    sandboxSvg.innerHTML = "";
    htmlOverlay.innerHTML = "";
    updateTeachingStatus(geom);
    
    // 正方形外框
    const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    square.setAttribute("x", `${ax}`);
    square.setAttribute("y", `${ay}`);
    square.setAttribute("width", `${sideLength}`);
    square.setAttribute("height", `${sideLength}`);
    square.setAttribute("class", "geo-square-base");
    sandboxSvg.appendChild(square);
    
    // 绘制目标旋转位置虚线骨架 (△ADG)
    const gx = dx;
    const gy = dy - (geom.ex - bx);
    drawSkeleton("dest-ad", ax, ay, dx, dy);
    drawSkeleton("dest-dg", dx, dy, gx, gy);
    drawSkeleton("dest-ga", gx, gy, ax, ay);
    
    // 绘制原三角形虚线骨架
    drawSkeleton("orig-ab", ax, ay, bx, by);
    drawSkeleton("orig-be", bx, by, geom.ex, geom.ey);
    drawSkeleton("orig-ea", geom.ex, geom.ey, ax, ay);

    if (progress > 0.92) {
        drawTrianglePatch([
            { x: ax, y: ay },
            { x: geom.ex, y: geom.ey },
            { x: geom.fx, y: geom.fy }
        ], "patch-main");
        drawTrianglePatch([
            { x: ax, y: ay },
            { x: gx, y: gy },
            { x: geom.fx, y: geom.fy }
        ], "patch-rotated");
        drawConstructionSegment("line-gf", gx, gy, geom.fx, geom.fy);
    }
    
    // 绘制折边 F 点
    drawPoint("F", geom.fx, geom.fy, false);
    drawRay("ray-af", ax, ay, geom.fx, geom.fy, "seg-a");
    const lineEF = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineEF.setAttribute("x1", `${geom.ex}`);
    lineEF.setAttribute("y1", `${geom.ey}`);
    lineEF.setAttribute("x2", `${geom.fx}`);
    lineEF.setAttribute("y2", `${geom.fy}`);
    lineEF.setAttribute("class", progress > 0.92 ? "geo-line-seg seg-c" : "geo-line-skeleton");
    sandboxSvg.appendChild(lineEF);
    
    // 绘制旋转过渡中的三角形 (发光霓虹)
    const gLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine1.setAttribute("x1", `${ax}`); gLine1.setAttribute("y1", `${ay}`);
    gLine1.setAttribute("x2", `${curBx}`); gLine1.setAttribute("y2", `${curBy}`);
    gLine1.setAttribute("class", "geo-line-seg seg-a");
    gLine1.setAttribute("style", "stroke-width: 4px; filter: drop-shadow(0 0 6px var(--primary));");
    sandboxSvg.appendChild(gLine1);
    
    const gLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine2.setAttribute("x1", `${curBx}`); gLine2.setAttribute("y1", `${curBy}`);
    gLine2.setAttribute("x2", `${curEx}`); gLine2.setAttribute("y2", `${curEy}`);
    gLine2.setAttribute("class", "geo-line-seg seg-b");
    gLine2.setAttribute("style", "stroke-width: 4px; filter: drop-shadow(0 0 6px var(--purple));");
    sandboxSvg.appendChild(gLine2);
    
    const gLine3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gLine3.setAttribute("x1", `${curEx}`); gLine3.setAttribute("y1", `${curEy}`);
    gLine3.setAttribute("x2", `${ax}`); gLine3.setAttribute("y2", `${ay}`);
    gLine3.setAttribute("class", "geo-line-seg seg-a");
    gLine3.setAttribute("style", "stroke-width: 4px;");
    sandboxSvg.appendChild(gLine3);
    
    // 过渡顶点
    drawPoint("A", ax, ay, false);
    if (progress < 0.98) {
        drawPoint("B'", curBx, curBy, false);
        drawPoint("E'", curEx, curEy, false);
    } else {
        drawPoint("D", dx, dy, false);
        drawConstructionPoint("G", gx, gy);
        drawPoint("E", geom.ex, geom.ey, false);
    }
    
    if (progress < 0.98) {
        createHTMLBraceLabel("lbl-anim", (curEx + ax) / 2, (curEy + ay) / 2 - 24, `旋转 ${(progress * 100).toFixed(0)}%`, "main");
    } else if (demoPhase === "congruent") {
        createHTMLBraceLabel("lbl-match", (ax + geom.fx) / 2 + 12, (ay + geom.fy) / 2 - 34, "△AEF ≅ △AGF", "main");
    } else if (demoPhase === "conclusion") {
        createHTMLBraceLabel("lbl-finish", (geom.ex + geom.fx) / 2 - 22, (geom.ey + geom.fy) / 2 - 26, "EF = BE + DF", "main");
    }
    
    stepsChalkboard.innerHTML = `
        <div class="hud-row">
            <div class="hud-row-label">构造</div>
            <div class="hud-row-val">△ABE 绕 A 旋转 90° → △ADG</div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">对应</div>
            <div class="hud-row-val">
                AB → AD，BE → DG，AE → AG
            </div>
        </div>
        <div class="hud-equation-box success-box">
            <div class="title">教学停顿</div>
            <div class="formula">
                <span>${progress < 0.98 ? "旋转中" : "全等成立"}</span>
                <span><span class="math-num">${(progress * 100).toFixed(0)}%</span></span>
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
    
    // 模型内部坐标中心点 (正方形中心大约在 300, 270)
    const modelCX = 300;
    const modelCY = 270;
    
    if (forceScale !== null) {
        zoomScale = forceScale;
    } else {
        // 自适应最佳大小
        const modelW = 380;
        const modelH = 340;
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
    demoPhase = "idle";
    
    document.querySelectorAll(".btn-preset").forEach(btn => {
        if (btn.getAttribute("data-scene") === scene) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // 控制按钮显隐
    if (scene === "congruence") {
        btnPlayRotation.style.display = "inline-flex";
    } else {
        btnPlayRotation.style.display = "none";
    }
    
    updateTheoryCard(scene);
    runLerpLoop();
    centerModel();
}

function updateTheoryCard(scene) {
    if (scene === "congruence") {
        theoryTitle.innerHTML = "半角旋转全等";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>已知</span><strong>正方形 ABCD，∠EAF=45°</strong></div>
                <div class="proof-chip"><span>构造</span><strong>△ABE 绕 A 旋转 90°</strong></div>
                <div class="proof-chip"><span>判定</span><strong>△AEF ≅ △AGF（SAS）</strong></div>
                <div class="proof-result"><span>结论</span><strong>EF = BE + DF</strong></div>
            </div>
        `;
    } else if (scene === "perimeter") {
        theoryTitle.innerHTML = "CEF 周长恒定";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>入口</span><strong>EF = BE + DF</strong></div>
                <div class="proof-chip"><span>代换</span><strong>CE+CF+EF = (CE+BE)+(CF+DF)</strong></div>
                <div class="proof-chip"><span>归边</span><strong>CE+BE=BC，CF+DF=CD</strong></div>
                <div class="proof-result"><span>结论</span><strong>周长 = BC+CD = 12</strong></div>
            </div>
        `;
    } else {
        theoryTitle.innerHTML = "高线等于边长";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>作图</span><strong>AH ⟂ EF</strong></div>
                <div class="proof-chip"><span>对应</span><strong>全等三角形对应高相等</strong></div>
                <div class="proof-chip"><span>转化</span><strong>A 到 GF 的高就是 AD</strong></div>
                <div class="proof-result"><span>结论</span><strong>AH = AD = AB = 6</strong></div>
            </div>
        `;
    }
}

function disableControls(disable) {
    sliderEPos.disabled = disable;
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
}

function resetState() {
    if (isAnimating) return;
    demoPhase = "idle";
    ePosPercent = 40.0;
    sliderEPos.value = 40;
    valEPos.textContent = "40%";
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
    
    // 2. 滑动条事件
    sliderEPos.addEventListener("input", (e) => {
        ePosPercent = parseFloat(e.target.value);
        valEPos.textContent = `${ePosPercent.toFixed(0)}%`;
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
        get ePosPercent() { return ePosPercent; },
        get isAnimating() { return isAnimating; },
        get isHudExpanded() { return isHudExpanded; },
        get zoomScale() { return zoomScale; },
        get panX() { return panX; },
        get panY() { return panY; },
        get renderValues() {
            return {
                be: renderValues.be,
                df: renderValues.df,
                ef: renderValues.ef,
                ce: renderValues.ce,
                cf: renderValues.cf,
                perimeter: renderValues.perimeter,
                ah: renderValues.ah
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
    loadScene("congruence");
}

document.addEventListener("DOMContentLoaded", init);

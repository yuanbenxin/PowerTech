/**
 * 角平分线双垂线模型演示仪 - 交互逻辑 (app.js)
 * 1. 几何坐标解算 (A点, P点, D点, E点, M点, N点, 以及场景 2 的面积与定理联动)
 * 2. 绕角平分线 AP 进行 3D 投影翻折动画 + Canvas 粒子碰撞火花
 * 3. LERP 缓动渲染与 HTML 浮动面板同步
 * 4. 画布自由缩放、平移与模型居中系统
 */

// ==========================================================================
// 全局状态与配置
// ==========================================================================
let currentScene = "perpendicular-fold"; // 当前场景: "perpendicular-fold" | "area-theorem" | "isosceles-construct"
let isAnimating = false;                 // 是否在播放动画
let angleA = 60.0;                       // 顶角 A 的大小 (度，30 ~ 110)
let distAP = 8.0;                        // 点 P 在平分线上的距离 (cm, 5 ~ 12)
let lenAB = 7.5;                         // 侧边 AB 长度 (场景 2 专用, cm, 4 ~ 12)
let lenAC = 10.0;                        // 侧边 AC 长度 (场景 2 专用, cm, 4 ~ 12)
let isHudExpanded = false;               // HUD 板书默认收起

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
let animationProgress = 0.0;             // 动画进度 (0 ~ 1)
let demoPhase = "idle";                  // 自动演示当前教学阶段

// LERP 渲染平滑插值变量
let renderValues = {
    angleA: 60.0,
    distAP: 8.0,
    lenAB: 7.5,
    lenAC: 10.0,
    // 场景 1 派生长度
    ad: 0.0,
    ae: 0.0,
    pd: 0.0,
    pe: 0.0,
    // 场景 2 派生长度与面积
    bd: 0.0,
    cd: 0.0,
    de: 0.0,
    df: 0.0,
    areaABD: 0.0,
    areaACD: 0.0,
    // 场景 3 派生长度
    am: 0.0,
    an: 0.0,
    pm: 0.0,
    pn: 0.0
};

// DOM 元素引用
const sandboxWrapper = document.getElementById("sandbox-wrapper");
const sandboxSvg = document.getElementById("sandbox-svg");
const htmlOverlay = document.getElementById("html-overlay");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const hudPanel = document.getElementById("hud-chalkboard-panel");
const hudToggleBtn = document.getElementById("hud-toggle-btn");

const sliderAngleA = document.getElementById("slider-angle-a");
const valAngleA = document.getElementById("val-angle-a");
const sliderDistP = document.getElementById("slider-dist-p");
const valDistP = document.getElementById("val-dist-p");
const sliderLenAB = document.getElementById("slider-len-ab");
const valLenAB = document.getElementById("val-len-ab");
const sliderLenAC = document.getElementById("slider-len-ac");
const valLenAC = document.getElementById("val-len-ac");

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
        this.vy = (Math.random() - 0.5) * 8 - 2.5; // 向上喷射
        this.radius = Math.random() * 3.0 + 1.5;
        this.color = color;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.025 + 0.015;
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

// 依据状态解算完整的几何坐标与线段长度 (40px = 1 logic cm)
function solveGeometry(degA, distP_cm, lenAB_cm, lenAC_cm) {
    const alpha = degA * Math.PI / 180.0;
    const halfAlpha = alpha / 2.0;

    if (currentScene === "perpendicular-fold" || currentScene === "isosceles-construct") {
        // 场景 1 & 3: 顶角 A 在左侧 (120, 270)，角平分线水平向右
        const ax = 120;
        const ay = 270;
        const distP_px = distP_cm * 40.0;
        const px = ax + distP_px;
        const py = ay;

        // D 点 (P 到 AB 的垂足)
        const lenAD_px = distP_px * Math.cos(halfAlpha);
        const dx = ax + lenAD_px * Math.cos(halfAlpha);
        const dy = ay - lenAD_px * Math.sin(halfAlpha);

        // E 点 (P 到 AC 的垂足)
        const lenAE_px = lenAD_px;
        const ex = ax + lenAE_px * Math.cos(halfAlpha);
        const ey = ay + lenAE_px * Math.sin(halfAlpha);

        const lenPD_px = distP_px * Math.sin(halfAlpha);
        const lenPE_px = lenPD_px;

        // M, N 点 (垂直于平分线的线与两边的交点，场景 3 适用)
        const mx = px;
        const my = ay - distP_px * Math.tan(halfAlpha);
        const nx = px;
        const ny = ay + distP_px * Math.tan(halfAlpha);

        const lenAM_px = distP_px / Math.cos(halfAlpha);
        const lenAN_px = lenAM_px;
        const lenPM_px = distP_px * Math.tan(halfAlpha);
        const lenPN_px = lenPM_px;

        return {
            ax, ay, px, py, dx, dy, ex, ey, mx, my, nx, ny,
            ad: lenAD_px / 40.0,
            ae: lenAE_px / 40.0,
            pd: lenPD_px / 40.0,
            pe: lenPE_px / 40.0,
            am: lenAM_px / 40.0,
            an: lenAN_px / 40.0,
            pm: lenPM_px / 40.0,
            pn: lenPN_px / 40.0
        };
    } else {
        // 场景 2: 顶角 A 在上方中央 (320, 140)，角平分线垂直向下
        const ax = 320;
        const ay = 140;

        const ab_px = lenAB_cm * 40.0;
        const ac_px = lenAC_cm * 40.0;

        // B, C 点坐标
        const bx = ax - ab_px * Math.sin(halfAlpha);
        const by = ay + ab_px * Math.cos(halfAlpha);

        const cx = ax + ac_px * Math.sin(halfAlpha);
        const cy = ay + ac_px * Math.cos(halfAlpha);

        // D 点 (角 A 的平分线与 BC 的交点。由于平分线垂直向下，D 的 x 坐标必为 ax)
        // 求直线 BC 的方程: y - by = k * (x - bx)
        // 得到 x = ax 时，y = by + (cy - by)/(cx - bx) * (ax - bx)
        const dx = ax;
        let dy = by;
        if (Math.abs(cx - bx) > 0.001) {
            dy = by + (cy - by) / (cx - bx) * (ax - bx);
        }

        const lenBD_px = Math.sqrt((dx - bx) ** 2 + (dy - by) ** 2);
        const lenCD_px = Math.sqrt((cx - dx) ** 2 + (cy - dy) ** 2);

        // D 到 AB 的垂足 E
        const ux_b = bx - ax;
        const uy_b = by - ay;
        const lenAB_sq = ux_b * ux_b + uy_b * uy_b;
        const proj_b = ((dx - ax) * ux_b + (dy - ay) * uy_b) / lenAB_sq;
        const ex = ax + proj_b * ux_b;
        const ey = ay + proj_b * uy_b;

        // D 到 AC 的垂足 F
        const ux_c = cx - ax;
        const uy_c = cy - ay;
        const lenAC_sq = ux_c * ux_c + uy_c * uy_c;
        const proj_c = ((dx - ax) * ux_c + (dy - ay) * uy_c) / lenAC_sq;
        const fx = ax + proj_c * ux_c;
        const fy = ay + proj_c * uy_c;

        const lenDE_px = Math.sqrt((dx - ex) ** 2 + (dy - ey) ** 2);
        const lenDF_px = Math.sqrt((dx - fx) ** 2 + (dy - fy) ** 2);

        // 派生面积计算
        const areaABD = 0.5 * lenAB_cm * (lenDE_px / 40.0);
        const areaACD = 0.5 * lenAC_cm * (lenDF_px / 40.0);

        return {
            ax, ay, bx, by, cx, cy, dx, dy, ex, ey, fx, fy,
            bd: lenBD_px / 40.0,
            cd: lenCD_px / 40.0,
            de: lenDE_px / 40.0,
            df: lenDF_px / 40.0,
            areaABD,
            areaACD
        };
    }
}

function getCurrentGeometry() {
    return solveGeometry(angleA, distAP, lenAB, lenAC);
}

// ==========================================================================
// 3D 翻折过渡变换 (3D Projective Folding Engine)
// ==========================================================================
// 绕水平平分线 y = ay 轴折叠点 P(x, y)，progress 在 0 ~ 1 之间
// 仅改变 y 坐标: y_folded = ay + (y - ay) * cos(progress * pi)
function getFoldedPoint(x, y, ay, progress) {
    const cosAngle = Math.cos(progress * Math.PI);
    return {
        x: x,
        y: ay + (y - ay) * cosAngle
    };
}

// ==========================================================================
// LERP 循环引擎，处理数值平滑读数
// ==========================================================================
let lerpAnimationId = null;

function runLerpLoop() {
    const geom = getCurrentGeometry();
    const target = {
        angleA: angleA,
        distAP: distAP,
        lenAB: lenAB,
        lenAC: lenAC,
        ad: geom.ad || 0,
        ae: geom.ae || 0,
        pd: geom.pd || 0,
        pe: geom.pe || 0,
        bd: geom.bd || 0,
        cd: geom.cd || 0,
        de: geom.de || 0,
        df: geom.df || 0,
        areaABD: geom.areaABD || 0,
        areaACD: geom.areaACD || 0,
        am: geom.am || 0,
        an: geom.an || 0,
        pm: geom.pm || 0,
        pn: geom.pn || 0
    };

    let isChanged = false;
    const k = 0.16; // LERP 缓动系数

    for (let key in target) {
        const diff = target[key] - renderValues[key];
        if (Math.abs(diff) > 0.005) {
            renderValues[key] += diff * k;
            isChanged = true;
        } else {
            renderValues[key] = target[key];
        }
    }

    renderGeometry(geom);
    updateHTMLOverlayAndHUD(geom);

    if (isChanged || isAnimating) {
        lerpAnimationId = requestAnimationFrame(runLerpLoop);
    } else {
        lerpAnimationId = null;
    }
}

function startLerpLoop() {
    if (!lerpAnimationId && !isAnimating) {
        runLerpLoop();
    }
}

// ==========================================================================
// SVG 辅助绘图函数
// ==========================================================================
function drawPolygonFill(pointsPath, className) {
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", pointsPath);
    poly.setAttribute("class", className);
    sandboxSvg.appendChild(poly);
}

function drawLineSeg(id, x1, y1, x2, y2, className) {
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

// 绘制等长刻痕：同一组线段用相同颜色与相同刻痕数量标识
function drawEqualTickMarks(x1, y1, x2, y2, className = "mark-blue", count = 1, spread = 8) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const tickLength = count > 1 ? 14 : 16;
    const offsets = count === 1
        ? [0]
        : Array.from({ length: count }, (_, index) => (index - (count - 1) / 2) * spread);

    offsets.forEach(offset => {
        const cx = midX + ux * offset;
        const cy = midY + uy * offset;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${cx - nx * tickLength / 2}`);
        line.setAttribute("y1", `${cy - ny * tickLength / 2}`);
        line.setAttribute("x2", `${cx + nx * tickLength / 2}`);
        line.setAttribute("y2", `${cy + ny * tickLength / 2}`);
        line.setAttribute("class", `geo-equal-tick ${className}`);
        sandboxSvg.appendChild(line);
    });
}

// 绘制直角符号
function drawRightAngle(xFoot, yFoot, xApex, yApex, xPoint, yPoint, size = 12) {
    // 向量 1: 从 Foot 指向 Apex
    const dx1 = xApex - xFoot;
    const dy1 = yApex - yFoot;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const ux1 = dx1 / len1;
    const uy1 = dy1 / len1;

    // 向量 2: 从 Foot 指向 Point
    const dx2 = xPoint - xFoot;
    const dy2 = yPoint - yFoot;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const ux2 = dx2 / len2;
    const uy2 = dy2 / len2;

    const p1x = xFoot + size * ux1;
    const p1y = yFoot + size * uy1;
    const p2x = xFoot + size * (ux1 + ux2);
    const p2y = yFoot + size * (uy1 + uy2);
    const p3x = xFoot + size * ux2;
    const p3y = yFoot + size * uy2;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y}`);
    path.setAttribute("class", "geo-right-angle");
    sandboxSvg.appendChild(path);
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

function drawPoint(name, x, y) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const cleanName = String(name).replace(/\s*\(.+\)$/, "");
    const draggableNames = ["P", "D", "E", "M", "N", "B", "C"];
    group.setAttribute("class", `geo-point-wrapper${draggableNames.includes(cleanName) ? " draggable" : ""}`);
    group.setAttribute("data-name", name);
    
    const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    halo.setAttribute("cx", `${x}`);
    halo.setAttribute("cy", `${y}`);
    halo.setAttribute("r", draggableNames.includes(cleanName) ? "30" : "22");
    halo.setAttribute("class", "geo-point-halo");
    group.appendChild(halo);
    
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", `${x}`);
    dot.setAttribute("cy", `${y}`);
    dot.setAttribute("r", "6");
    dot.setAttribute("class", "geo-point");
    group.appendChild(dot);
    
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("class", "geo-label");
    txt.textContent = name;
    
    // 文本避让定位
    if (name === "A") {
        if (currentScene === "area-theorem") {
            txt.setAttribute("x", `${x}`);
            txt.setAttribute("y", `${y - 12}`);
            txt.setAttribute("style", "text-anchor: middle;");
        } else {
            txt.setAttribute("x", `${x - 12}`);
            txt.setAttribute("y", `${y + 5}`);
            txt.setAttribute("style", "text-anchor: end;");
        }
    } else if (name === "B") {
        txt.setAttribute("x", `${x - 12}`);
        txt.setAttribute("y", `${y + 14}`);
        txt.setAttribute("style", "text-anchor: end;");
    } else if (name === "C") {
        txt.setAttribute("x", `${x + 12}`);
        txt.setAttribute("y", `${y + 14}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else if (name === "D" || name === "D (折)") {
        if (currentScene === "area-theorem") {
            txt.setAttribute("x", `${x}`);
            txt.setAttribute("y", `${y + 22}`);
            txt.setAttribute("style", "text-anchor: middle;");
        } else {
            txt.setAttribute("x", `${x + 6}`);
            txt.setAttribute("y", `${y - 12}`);
            txt.setAttribute("style", "text-anchor: middle;");
        }
    } else if (name === "E") {
        if (currentScene === "area-theorem") {
            txt.setAttribute("x", `${x - 12}`);
            txt.setAttribute("y", `${y - 4}`);
            txt.setAttribute("style", "text-anchor: end;");
        } else {
            txt.setAttribute("x", `${x + 6}`);
            txt.setAttribute("y", `${y + 22}`);
            txt.setAttribute("style", "text-anchor: middle;");
        }
    } else if (name === "F") {
        txt.setAttribute("x", `${x + 12}`);
        txt.setAttribute("y", `${y - 4}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else if (name === "P") {
        txt.setAttribute("x", `${x + 14}`);
        txt.setAttribute("y", `${y + 5}`);
        txt.setAttribute("style", "text-anchor: start;");
    } else if (name === "M" || name === "M (折)") {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y - 12}`);
        txt.setAttribute("style", "text-anchor: middle;");
    } else if (name === "N") {
        txt.setAttribute("x", `${x}`);
        txt.setAttribute("y", `${y + 22}`);
        txt.setAttribute("style", "text-anchor: middle;");
    } else {
        txt.setAttribute("x", `${x + 12}`);
        txt.setAttribute("y", `${y + 12}`);
    }
    
    group.appendChild(txt);
    sandboxSvg.appendChild(group);
}

// ==========================================================================
// 主几何图形绘制
// ==========================================================================
function renderGeometry(geom) {
    sandboxSvg.innerHTML = "";
    if (isAnimating) return; // 动画帧完全由 renderAnimationStep 接管

    const halfAlpha = (angleA * Math.PI / 180.0) / 2.0;

    if (currentScene === "perpendicular-fold") {
        // 场景 1: 双垂线对折
        // 1. 绘制背景填充角区域
        drawPolygonFill(`${geom.ax},${geom.ay} ${geom.dx},${geom.dy} ${geom.px},${geom.py} ${geom.ex},${geom.ey}`, "geo-polygon-fill");

        // 2. 绘制角弧
        drawAngleArc("arc-a1", geom.ax, geom.ay, -halfAlpha, 0.0, 24);
        drawAngleArc("arc-a2", geom.ax, geom.ay, 0.0, halfAlpha, 24);

        // 3. 绘制角两边线 AB、AC (延伸线)
        const rayLen = 420;
        drawLineSeg("ray-ab", geom.ax, geom.ay, geom.ax + rayLen * Math.cos(-halfAlpha), geom.ay + rayLen * Math.sin(-halfAlpha), "seg-a");
        drawLineSeg("ray-ac", geom.ax, geom.ay, geom.ax + rayLen * Math.cos(halfAlpha), geom.ay + rayLen * Math.sin(halfAlpha), "seg-a");

        // 4. 绘制平分线 AP
        drawLineSeg("ray-ap", geom.ax, geom.ay, geom.px + 40, geom.ay, "seg-d");

        // 5. 绘制双垂线 PD, PE (紫色虚线)
        drawLineSeg("seg-pd", geom.px, geom.py, geom.dx, geom.dy, "seg-b");
        drawLineSeg("seg-pe", geom.px, geom.py, geom.ex, geom.ey, "seg-b");

        // 6. 用刻痕直接标出两组等长关系
        drawEqualTickMarks(geom.px, geom.py, geom.dx, geom.dy, "mark-blue", 1);
        drawEqualTickMarks(geom.px, geom.py, geom.ex, geom.ey, "mark-blue", 1);
        drawEqualTickMarks(geom.ax, geom.ay, geom.dx, geom.dy, "mark-green", 2);
        drawEqualTickMarks(geom.ax, geom.ay, geom.ex, geom.ey, "mark-green", 2);

        // 7. 绘制直角符号
        drawRightAngle(geom.dx, geom.dy, geom.ax, geom.ay, geom.px, geom.py, 12);
        drawRightAngle(geom.ex, geom.ey, geom.ax, geom.ay, geom.px, geom.py, 12);

        // 8. 绘制关键顶点
        drawPoint("A", geom.ax, geom.ay);
        drawPoint("P", geom.px, geom.py);
        drawPoint("D", geom.dx, geom.dy);
        drawPoint("E", geom.ex, geom.ey);

    } else if (currentScene === "area-theorem") {
        // 场景 2: 面积比证明角平分线定理
        // 1. 绘制背景填充三角形 ABD, ACD
        drawPolygonFill(`${geom.ax},${geom.ay} ${geom.bx},${geom.by} ${geom.dx},${geom.dy}`, "geo-polygon-fill highlight-fill-1");
        drawPolygonFill(`${geom.ax},${geom.ay} ${geom.cx},${geom.cy} ${geom.dx},${geom.dy}`, "geo-polygon-fill highlight-fill-2");

        // 2. 绘制角弧
        drawAngleArc("arc-a1", geom.ax, geom.ay, Math.PI / 2.0 - halfAlpha, Math.PI / 2.0, 24);
        drawAngleArc("arc-a2", geom.ax, geom.ay, Math.PI / 2.0, Math.PI / 2.0 + halfAlpha, 24);

        // 3. 绘制三角形三边
        drawLineSeg("side-ab", geom.ax, geom.ay, geom.bx, geom.by, "seg-a");
        drawLineSeg("side-ac", geom.ax, geom.ay, geom.cx, geom.cy, "seg-a");
        drawLineSeg("side-bc", geom.bx, geom.by, geom.cx, geom.cy, "seg-base");

        // 4. 绘制角平分线 AD
        drawLineSeg("side-ad", geom.ax, geom.ay, geom.dx, geom.dy, "seg-d");

        // 5. 绘制两垂线 DE, DF
        drawLineSeg("seg-de", geom.dx, geom.dy, geom.ex, geom.ey, "seg-b");
        drawLineSeg("seg-df", geom.dx, geom.dy, geom.fx, geom.fy, "seg-b");

        // 6. 等高刻痕：D 在角平分线上，所以到两边距离相等
        drawEqualTickMarks(geom.dx, geom.dy, geom.ex, geom.ey, "mark-blue", 1);
        drawEqualTickMarks(geom.dx, geom.dy, geom.fx, geom.fy, "mark-blue", 1);

        // 7. 绘制直角符号
        drawRightAngle(geom.ex, geom.ey, geom.ax, geom.ay, geom.dx, geom.dy, 12);
        drawRightAngle(geom.fx, geom.fy, geom.ax, geom.ay, geom.dx, geom.dy, 12);

        // 8. 绘制关键点
        drawPoint("A", geom.ax, geom.ay);
        drawPoint("B", geom.bx, geom.by);
        drawPoint("C", geom.cx, geom.cy);
        drawPoint("D", geom.dx, geom.dy);
        drawPoint("E", geom.ex, geom.ey);
        drawPoint("F", geom.fx, geom.fy);

    } else {
        // 场景 3: 垂线构造等腰
        // 1. 绘制背景填充等腰三角形 AMN
        drawPolygonFill(`${geom.ax},${geom.ay} ${geom.mx},${geom.my} ${geom.nx},${geom.ny}`, "geo-polygon-fill");

        // 2. 绘制角弧
        drawAngleArc("arc-a1", geom.ax, geom.ay, -halfAlpha, 0.0, 24);
        drawAngleArc("arc-a2", geom.ax, geom.ay, 0.0, halfAlpha, 24);

        // 3. 绘制射线 AB, AC
        const rayLen = 420;
        drawLineSeg("ray-ab", geom.ax, geom.ay, geom.ax + rayLen * Math.cos(-halfAlpha), geom.ay + rayLen * Math.sin(-halfAlpha), "seg-a");
        drawLineSeg("ray-ac", geom.ax, geom.ay, geom.ax + rayLen * Math.cos(halfAlpha), geom.ay + rayLen * Math.sin(halfAlpha), "seg-a");

        // 4. 绘制平分线 AP
        drawLineSeg("ray-ap", geom.ax, geom.ay, geom.px + 40, geom.ay, "seg-d");

        // 5. 绘制垂直于平分线的割线 MN (紫色实线)
        drawLineSeg("seg-mn", geom.mx, geom.my, geom.nx, geom.ny, "seg-b-solid");

        // 6. 用刻痕显示等腰边和底边中点关系
        drawEqualTickMarks(geom.ax, geom.ay, geom.mx, geom.my, "mark-green", 2);
        drawEqualTickMarks(geom.ax, geom.ay, geom.nx, geom.ny, "mark-green", 2);
        drawEqualTickMarks(geom.px, geom.py, geom.mx, geom.my, "mark-blue", 1);
        drawEqualTickMarks(geom.px, geom.py, geom.nx, geom.ny, "mark-blue", 1);

        // 7. 绘制 P 处直角符号
        drawRightAngle(geom.px, geom.py, geom.ax, geom.ay, geom.mx, geom.my, 12);

        // 8. 绘制点
        drawPoint("A", geom.ax, geom.ay);
        drawPoint("P", geom.px, geom.py);
        drawPoint("M", geom.mx, geom.my);
        drawPoint("N", geom.nx, geom.ny);
    }
}

// ==========================================================================
// 刷新浮动 HTML 标签与 HUD 折叠板书
// ==========================================================================
function updateHTMLOverlayAndHUD(geom) {
    htmlOverlay.innerHTML = "";
    if (isAnimating) return;

    if (currentScene === "perpendicular-fold") {
        createHTMLBraceLabel("lbl-pdpe", geom.px - 44, geom.py - 42, `PD = PE = ${renderValues.pd.toFixed(1)}`, "sub relation");
        createHTMLBraceLabel("lbl-adae", geom.ax + 136, geom.ay + 38, `AD = AE = ${renderValues.ad.toFixed(1)}`, "relation");

        // 角 1, 2
        createHTMLBraceLabel("lbl-a1", geom.ax + 35, geom.ay - 10, "1", "angle");
        createHTMLBraceLabel("lbl-a2", geom.ax + 35, geom.ay + 10, "2", "angle");
    } else if (currentScene === "area-theorem") {
        // 标注
        createHTMLBraceLabel("lbl-ab", (geom.ax + geom.bx) / 2 - 18, (geom.ay + geom.by) / 2, `AB = ${renderValues.lenAB.toFixed(1)}`, "main");
        createHTMLBraceLabel("lbl-ac", (geom.ax + geom.cx) / 2 + 18, (geom.ay + geom.cy) / 2, `AC = ${renderValues.lenAC.toFixed(1)}`, "main");
        
        createHTMLBraceLabel("lbl-dedf", geom.dx + 44, geom.dy - 34, `DE = DF = ${renderValues.de.toFixed(1)}`, "sub relation");
        
        createHTMLBraceLabel("lbl-bd", (geom.bx + geom.dx) / 2, geom.by + 14, `BD = ${renderValues.bd.toFixed(1)}`);
        createHTMLBraceLabel("lbl-cd", (geom.dx + geom.cx) / 2, geom.cy + 14, `CD = ${renderValues.cd.toFixed(1)}`);

        createHTMLBraceLabel("lbl-a1", geom.ax - 10, geom.ay + 35, "1", "angle");
        createHTMLBraceLabel("lbl-a2", geom.ax + 10, geom.ay + 35, "2", "angle");
    } else {
        // 场景 3: 构造等腰
        createHTMLBraceLabel("lbl-aman", geom.ax + 150, geom.ay + 38, `AM = AN = ${renderValues.am.toFixed(1)}`, "relation");
        createHTMLBraceLabel("lbl-pmpn", geom.px + 42, geom.py, `PM = PN = ${renderValues.pm.toFixed(1)}`, "sub relation");

        createHTMLBraceLabel("lbl-a1", geom.ax + 35, geom.ay - 10, "1", "angle");
        createHTMLBraceLabel("lbl-a2", geom.ax + 35, geom.ay + 10, "2", "angle");
    }

    updateChalkboardHUD();
}

// 渲染板书
function updateChalkboardHUD() {
    let html = "";

    if (currentScene === "perpendicular-fold") {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">条件</div>
                <div class="hud-row-val">
                    AP 平分 ∠BAC，PD ⊥ AB，PE ⊥ AC。
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">判定</div>
                <div class="hud-row-val">
                    ∠1=∠2，∠ADP=∠AEP=90°，AP 为公共边。<br>
                    <strong>△ADP ≅ △AEP</strong>
                </div>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">结论</div>
                <div class="formula">
                    <span>PD = PE</span>
                    <span>AD = AE</span>
                </div>
            </div>
        `;
    } else if (currentScene === "area-theorem") {
        const ratioSides = renderValues.lenAB / renderValues.lenAC;
        const ratioSegs = renderValues.bd / renderValues.cd;

        html = `
            <div class="hud-row">
                <div class="hud-row-label">条件</div>
                <div class="hud-row-val">
                    AD 平分 ∠BAC，DE ⊥ AB，DF ⊥ AC。
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">面积关系</div>
                <div class="hud-row-val">
                    DE=DF，所以面积比可由邻边比表示；同高时面积比也等于底边比。
                </div>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">结论</div>
                <div class="formula">
                    <span>BD / CD = AB / AC</span>
                    <span><span class="math-num">${ratioSegs.toFixed(2)}</span> = <span class="math-num">${ratioSides.toFixed(2)}</span></span>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="hud-row">
                <div class="hud-row-label">条件</div>
                <div class="hud-row-val">
                    AP 平分 ∠BAC，MN ⊥ AP，M、N 在角两边。
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">判定</div>
                <div class="hud-row-val">
                    ∠1=∠2，∠APM=∠APN=90°，AP 为公共边。<br>
                    <strong>△AMP ≅ △ANP</strong>
                </div>
            </div>
            <div class="hud-equation-box success-box">
                <div class="title">结论</div>
                <div class="formula">
                    <span>AM = AN</span>
                    <span>PM = PN</span>
                </div>
            </div>
        `;
    }
    stepsChalkboard.innerHTML = html;
}

function easeInOutCubic(t) {
    const value = clampValue(t, 0, 1);
    return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getFoldingDemoStep(rawProgress) {
    const raw = clampValue(rawProgress, 0, 1);
    let phase = "condition";
    let foldProgress = 0;

    if (raw < 0.18) {
        phase = "condition";
    } else if (raw < 0.34) {
        phase = "perpendicular";
    } else if (raw < 0.74) {
        phase = "folding";
        foldProgress = easeInOutCubic((raw - 0.34) / 0.40);
    } else if (raw < 0.88) {
        phase = "overlap";
        foldProgress = 1;
    } else {
        phase = "result";
        foldProgress = 1;
    }

    return { phase, foldProgress, raw };
}

function getDemoCopy(phase, foldProgress) {
    const percent = `${Math.round(foldProgress * 100)}%`;
    const isPerpendicularFold = currentScene === "perpendicular-fold";

    const copies = isPerpendicularFold ? {
        condition: ["第 1 步", "锁定平分线", "AP 是翻折轴，∠1 = ∠2。"],
        perpendicular: ["第 2 步", "标出双垂线", "PD ⊥ AB，PE ⊥ AC，两个直角对应。"],
        folding: ["第 3 步", "沿 AP 翻折", `D 正在贴向 E，重合度 ${percent}。`],
        overlap: ["第 4 步", "三角形重合", "△ADP 与 △AEP 完全对上。"],
        result: ["第 5 步", "读结论", "PD=PE，AD=AE。"]
    } : {
        condition: ["第 1 步", "锁定平分线", "AP 平分 ∠MAN，∠1 = ∠2。"],
        perpendicular: ["第 2 步", "作垂直割线", "MN ⊥ AP，P 处两个直角对应。"],
        folding: ["第 3 步", "沿 AP 翻折", `M 正在贴向 N，重合度 ${percent}。`],
        overlap: ["第 4 步", "三角形重合", "△AMP 与 △ANP 完全对上。"],
        result: ["第 5 步", "读结论", "AM=AN，PM=PN。"]
    };

    return copies[phase] || copies.condition;
}

function renderDemoHUD(step, foldProgress) {
    const [label, title, detail] = getDemoCopy(step.phase, foldProgress);
    const resultLine = currentScene === "perpendicular-fold"
        ? "△ADP≅△AEP"
        : "△AMP≅△ANP";

    stepsChalkboard.innerHTML = `
        <div class="hud-row">
            <div class="hud-row-label">${label}</div>
            <div class="hud-row-val"><strong>${title}</strong></div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">观察</div>
            <div class="hud-row-val">${detail}</div>
        </div>
        <div class="hud-equation-box success-box">
            <div class="title">${step.phase === "result" ? "最终结论" : "目标"}</div>
            <div class="formula">
                <span>${resultLine}</span>
                <span>${Math.round(foldProgress * 100)}%</span>
            </div>
        </div>
    `;
}

// ==========================================================================
// 3D 旋转对折动画播放器
// ==========================================================================
function playFoldingAnimation() {
    if (isAnimating || currentScene === "area-theorem") return;
    isAnimating = true;
    demoPhase = "condition";
    disableControls(true);

    const geom = getCurrentGeometry();
    const duration = 4200; // 一次完整教学演示，包含关键点停顿
    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const rawProgress = Math.min(1.0, elapsed / duration);
        const step = getFoldingDemoStep(rawProgress);
        demoPhase = step.phase;

        renderAnimationStep(geom, step.foldProgress, step);

        if (rawProgress < 1.0) {
            requestAnimationFrame(animate);
        } else {
            // 对折重合瞬间引爆粒子特效
            const rect = sandboxWrapper.getBoundingClientRect();
            if (currentScene === "perpendicular-fold") {
                // 场景 1: D 重合到 E，在 E 处引爆
                const expEX = rect.left + panX + geom.ex * zoomScale;
                const expEY = rect.top + panY + geom.ey * zoomScale;
                triggerExplosion(expEX, expEY, ["#8b5cf6", "#3b82f6", "#ffffff"], 35);
            } else if (currentScene === "isosceles-construct") {
                // 场景 3: M 重合到 N，在 N 处引爆
                const expNX = rect.left + panX + geom.nx * zoomScale;
                const expNY = rect.top + panY + geom.ny * zoomScale;
                triggerExplosion(expNX, expNY, ["#8b5cf6", "#3b82f6", "#ffffff"], 35);
            }

            setTimeout(() => {
                isAnimating = false;
                demoPhase = "idle";
                disableControls(false);
                startLerpLoop();
            }, 900);
        }
    }
    requestAnimationFrame(animate);
}

// 绘制对折动画帧
function renderAnimationStep(geom, progress, step = { phase: demoPhase, foldProgress: progress }) {
    sandboxSvg.innerHTML = "";
    htmlOverlay.innerHTML = "";

    const halfAlpha = (angleA * Math.PI / 180.0) / 2.0;

    if (currentScene === "perpendicular-fold") {
        // 场景 1: 双垂线对折 (△ADP 绕 AP 轴折叠，A 和 P 不动，D 折叠到 D')
        const dRot = getFoldedPoint(geom.dx, geom.dy, geom.ay, progress);

        // 不动的三条线: AC(骨架), AP, PE
        drawSkeleton("skeleton-ac", geom.ax, geom.ay, geom.ax + 420 * Math.cos(halfAlpha), geom.ay + 420 * Math.sin(halfAlpha));
        drawLineSeg("side-ap", geom.ax, geom.ay, geom.px + 40, geom.ay, "seg-d");
        drawPolygonFill(`${geom.ax},${geom.ay} ${geom.ex},${geom.ey} ${geom.px},${geom.py}`, "geo-polygon-fill highlight-fill-1 target-fill");
        drawLineSeg("ray-ae-target", geom.ax, geom.ay, geom.ex, geom.ey, "seg-a");
        drawLineSeg("seg-pe", geom.px, geom.py, geom.ex, geom.ey, "seg-b");

        // 绘制原 △ADP 的骨架
        drawSkeleton("skeleton-ab", geom.ax, geom.ay, geom.dx, geom.dy);
        drawSkeleton("skeleton-pd", geom.px, geom.py, geom.dx, geom.dy);

        // 绘制折纸三角形 △AD'P (紫色)
        drawPolygonFill(`${geom.ax},${geom.ay} ${dRot.x},${dRot.y} ${geom.px},${geom.py}`, "geo-polygon-fill highlight-fill-2");
        drawLineSeg("ray-ad-rot", geom.ax, geom.ay, dRot.x, dRot.y, "seg-b-solid");
        drawLineSeg("seg-pd-rot", geom.px, geom.py, dRot.x, dRot.y, "seg-b-solid");
        drawEqualTickMarks(geom.px, geom.py, geom.ex, geom.ey, "mark-blue", 1);
        drawEqualTickMarks(geom.px, geom.py, dRot.x, dRot.y, "mark-blue", 1);
        drawEqualTickMarks(geom.ax, geom.ay, geom.ex, geom.ey, "mark-green", 2);
        drawEqualTickMarks(geom.ax, geom.ay, dRot.x, dRot.y, "mark-green", 2);

        // 绘制直角符号 (仅绘制未折叠侧)
        drawRightAngle(geom.ex, geom.ey, geom.ax, geom.ay, geom.px, geom.py, 12);

        // 绘制端点
        drawPoint("A", geom.ax, geom.ay);
        drawPoint("P", geom.px, geom.py);
        drawPoint("E", geom.ex, geom.ey);
        drawPoint("D (折)", dRot.x, dRot.y);

        createHTMLBraceLabel("lbl-anim", (dRot.x + geom.ex) / 2 + 28, (dRot.y + geom.ey) / 2, step.phase === "result" ? "D 与 E 重合" : `D → E ${Math.round(progress * 100)}%`, "main");
        renderDemoHUD(step, progress);

    } else if (currentScene === "isosceles-construct") {
        // 场景 3: 垂线等腰折叠 (△AMP 绕 AP 轴折叠，A 和 P 不动，M 折叠到 M')
        const mRot = getFoldedPoint(geom.mx, geom.my, geom.ay, progress);

        // 不动线
        drawSkeleton("skeleton-ac", geom.ax, geom.ay, geom.ax + 420 * Math.cos(halfAlpha), geom.ay + 420 * Math.sin(halfAlpha));
        drawLineSeg("side-ap", geom.ax, geom.ay, geom.px + 40, geom.ay, "seg-d");
        drawPolygonFill(`${geom.ax},${geom.ay} ${geom.nx},${geom.ny} ${geom.px},${geom.py}`, "geo-polygon-fill highlight-fill-1 target-fill");
        drawLineSeg("ray-an-target", geom.ax, geom.ay, geom.nx, geom.ny, "seg-a");
        drawLineSeg("seg-pn", geom.px, geom.py, geom.nx, geom.ny, "seg-b-solid");

        // 骨架线
        drawSkeleton("skeleton-ab", geom.ax, geom.ay, geom.mx, geom.my);
        drawSkeleton("skeleton-pm", geom.px, geom.py, geom.mx, geom.my);

        // 折纸三角形
        drawPolygonFill(`${geom.ax},${geom.ay} ${mRot.x},${mRot.y} ${geom.px},${geom.py}`, "geo-polygon-fill highlight-fill-2");
        drawLineSeg("ray-am-rot", geom.ax, geom.ay, mRot.x, mRot.y, "seg-b-solid");
        drawLineSeg("seg-pm-rot", geom.px, geom.py, mRot.x, mRot.y, "seg-b-solid");
        drawEqualTickMarks(geom.ax, geom.ay, geom.nx, geom.ny, "mark-green", 2);
        drawEqualTickMarks(geom.ax, geom.ay, mRot.x, mRot.y, "mark-green", 2);
        drawEqualTickMarks(geom.px, geom.py, geom.nx, geom.ny, "mark-blue", 1);
        drawEqualTickMarks(geom.px, geom.py, mRot.x, mRot.y, "mark-blue", 1);

        // 绘制端点
        drawPoint("A", geom.ax, geom.ay);
        drawPoint("P", geom.px, geom.py);
        drawPoint("N", geom.nx, geom.ny);
        drawPoint("M (折)", mRot.x, mRot.y);

        createHTMLBraceLabel("lbl-anim", (mRot.x + geom.nx) / 2 + 28, (mRot.y + geom.ny) / 2, step.phase === "result" ? "M 与 N 重合" : `M → N ${Math.round(progress * 100)}%`, "main");
        renderDemoHUD(step, progress);
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

    let modelCX = 320;
    let modelCY = 270;

    if (currentScene === "area-theorem") {
        modelCX = 320;
        modelCY = 280;
    }

    const hudW = isHudExpanded ? 370 : 200;
    const isDesktop = W > 600;

    if (forceScale !== null) {
        zoomScale = forceScale;
    } else {
        // 自适应居中比例 (使用避让 HUD 后的可用宽度)
        const visibleW = isDesktop ? (W - hudW) : W;
        const modelW = 440;
        const modelH = 340;
        const scaleX = visibleW / modelW;
        const scaleY = H / modelH;
        zoomScale = Math.min(scaleX, scaleY);
        if (zoomScale < 0.6) zoomScale = 0.6;
        if (zoomScale > 1.3) zoomScale = 1.3;
    }

    let centerX = W / 2;
    if (isDesktop) {
        centerX = hudW + (W - hudW) / 2;
    }
    panX = centerX - modelCX * zoomScale;
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

        const zoomFactor = 1.15;
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
        bindPointerCanvasInteractions();
        return;
    }
    sandboxWrapper.addEventListener("mousedown", onPanStart);
    sandboxWrapper.addEventListener("touchstart", onPanStart, { passive: false });
}

let activePointDrag = null;

function bindPointDragEvents() {
    if (window.PointerEvent) return;
    sandboxSvg.addEventListener("mousedown", onPointDragStart, { passive: false });
    sandboxSvg.addEventListener("touchstart", onPointDragStart, { passive: false });
}

function bindPointerCanvasInteractions() {
    const pointers = new Map();
    let activePointerId = null;
    let pointPointerId = null;

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

    const clearPointDrag = () => {
        if (!activePointDrag) return;
        onPointDragEnd();
        pointPointerId = null;
    };

    const endPointer = (event) => {
        if (!pointers.has(event.pointerId)) return;
        if (pointPointerId === event.pointerId) clearPointDrag();
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
        if (event.target.closest(".btn-zoom, .hud-panel, button, input, select, textarea, a, .modal-overlay")) return;

        pointers.set(event.pointerId, getPoint(event));
        sandboxWrapper.setPointerCapture?.(event.pointerId);
        const pointWrapper = event.target.closest(".geo-point-wrapper.draggable");

        if (pointers.size === 1 && pointWrapper) {
            const name = String(pointWrapper.getAttribute("data-name") || "").replace(/\s*\(.+\)$/, "");
            activePointDrag = { name };
            pointPointerId = event.pointerId;
            sandboxWrapper.classList.add("dragging-point");
            onPointDragMove(event);
        } else if (pointers.size >= 2) {
            clearPointDrag();
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

        if (pointPointerId === event.pointerId && activePointDrag) {
            onPointDragMove(event);
        } else if (pointers.size >= 2) {
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

function clampValue(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getModelPointFromEvent(e) {
    const source = e.touches ? e.touches[0] : e;
    const rect = sandboxWrapper.getBoundingClientRect();
    return {
        x: (source.clientX - rect.left - panX) / zoomScale,
        y: (source.clientY - rect.top - panY) / zoomScale
    };
}

function syncControlReadouts() {
    sliderAngleA.value = String(angleA);
    valAngleA.textContent = `${angleA.toFixed(0)} °`;
    sliderDistP.value = String(distAP);
    valDistP.textContent = `${distAP.toFixed(1)} cm`;
    sliderLenAB.value = String(lenAB);
    valLenAB.textContent = `${lenAB.toFixed(1)} cm`;
    sliderLenAC.value = String(lenAC);
    valLenAC.textContent = `${lenAC.toFixed(1)} cm`;
}

function onPointDragStart(e) {
    if (isAnimating) return;
    if (e.touches && e.touches.length > 1) return;
    const wrapper = e.target.closest && e.target.closest(".geo-point-wrapper.draggable");
    if (!wrapper) return;

    const name = String(wrapper.getAttribute("data-name") || "").replace(/\s*\(.+\)$/, "");
    activePointDrag = { name };
    sandboxWrapper.classList.add("dragging-point");

    document.addEventListener("mousemove", onPointDragMove);
    document.addEventListener("mouseup", onPointDragEnd);
    document.addEventListener("touchmove", onPointDragMove, { passive: false });
    document.addEventListener("touchend", onPointDragEnd);

    onPointDragMove(e);
    e.stopPropagation();
    e.preventDefault();
}

function onPointDragMove(e) {
    if (!activePointDrag) return;

    const p = getModelPointFromEvent(e);
    const geom = getCurrentGeometry();
    const dx = p.x - geom.ax;
    const dy = p.y - geom.ay;

    if (activePointDrag.name === "P") {
        distAP = clampValue(dx / 40.0, 5.0, 12.0);
    } else if (currentScene === "area-theorem" && (activePointDrag.name === "B" || activePointDrag.name === "C")) {
        const sideLen = Math.sqrt(dx * dx + dy * dy) / 40.0;
        if (activePointDrag.name === "B") {
            lenAB = clampValue(sideLen, 4.0, 12.0);
        } else {
            lenAC = clampValue(sideLen, 4.0, 12.0);
        }
        if (dy > 18) {
            angleA = clampValue((Math.atan2(Math.abs(dx), dy) * 2 * 180) / Math.PI, 30.0, 110.0);
        }
    } else if (["D", "E", "M", "N"].includes(activePointDrag.name) && dx > 18) {
        angleA = clampValue((Math.atan2(Math.abs(dy), dx) * 2 * 180) / Math.PI, 30.0, 110.0);
    }

    syncControlReadouts();
    startLerpLoop();
    e.stopPropagation();
    e.preventDefault();
}

function onPointDragEnd() {
    activePointDrag = null;
    sandboxWrapper.classList.remove("dragging-point");

    document.removeEventListener("mousemove", onPointDragMove);
    document.removeEventListener("mouseup", onPointDragEnd);
    document.removeEventListener("touchmove", onPointDragMove);
    document.removeEventListener("touchend", onPointDragEnd);
}

function isCanvasControlTarget(target) {
    return !!(target && target.closest && target.closest(".btn-zoom, .hud-panel, .geo-point-wrapper, button, input, select, textarea, a, .modal-overlay"));
}

function onPanStart(e) {
    if (isAnimating) return;
    if (isCanvasControlTarget(e.target)) {
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
// 状态管理与事件绑定
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

    // 联动控制滑块的显示与隐藏
    if (scene === "area-theorem") {
        document.getElementById("control-group-dist-p").style.display = "none";
        document.getElementById("control-group-len-ab").style.display = "block";
        document.getElementById("control-group-len-ac").style.display = "block";
        btnPlayFolding.style.display = "none"; // 场景 2 不需要对折动画
    } else {
        document.getElementById("control-group-dist-p").style.display = "block";
        document.getElementById("control-group-len-ab").style.display = "none";
        document.getElementById("control-group-len-ac").style.display = "none";
        btnPlayFolding.style.display = "inline-flex";
    }

    updateTheoryCard(scene);
    startLerpLoop();
    centerModel();
}

function updateTheoryCard(scene) {
    if (scene === "perpendicular-fold") {
        theoryTitle.innerHTML = "模型证明";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>轴</span><strong>AP 平分 ∠BAC，是翻折对称轴。</strong></div>
                <div class="proof-chip"><span>垂</span><strong>PD ⊥ AB、PE ⊥ AC，对应直角相等。</strong></div>
                <div class="proof-chip"><span>AAS</span><strong>∠DAP=∠PAE，∠ADP=∠AEP，AP 公共。</strong></div>
                <div class="proof-result"><span>结论</span><strong>△ADP≅△AEP，PD=PE，AD=AE。</strong></div>
            </div>
        `;
    } else if (scene === "area-theorem") {
        theoryTitle.innerHTML = "面积转化";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>等高</span><strong>D 在角平分线上，所以 DE=DF。</strong></div>
                <div class="proof-chip"><span>邻边</span><strong>用 AB、AC 作底，面积比等于 AB/AC。</strong></div>
                <div class="proof-chip"><span>同高</span><strong>对 BC 看，面积比又等于 BD/CD。</strong></div>
                <div class="proof-result"><span>结论</span><strong>BD / CD = AB / AC。</strong></div>
            </div>
        `;
    } else {
        theoryTitle.innerHTML = "等腰构造";
        theoryText.innerHTML = `
            <div class="proof-flow">
                <div class="proof-chip"><span>作线</span><strong>过 P 作 MN ⊥ AP，M、N 落在角两边。</strong></div>
                <div class="proof-chip"><span>ASA</span><strong>∠MAP=∠PAN，∠APM=∠APN，AP 公共。</strong></div>
                <div class="proof-chip"><span>全等</span><strong>△AMP≅△ANP，图上用双刻痕对应。</strong></div>
                <div class="proof-result"><span>结论</span><strong>AM=AN，PM=PN，△AMN 为等腰三角形。</strong></div>
            </div>
        `;
    }
}

function disableControls(disable) {
    sliderAngleA.disabled = disable;
    sliderDistP.disabled = disable;
    sliderLenAB.disabled = disable;
    sliderLenAC.disabled = disable;
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
    angleA = 60.0;
    distAP = 8.0;
    lenAB = 7.5;
    lenAC = 10.0;

    sliderAngleA.value = 60;
    valAngleA.textContent = "60 °";
    sliderDistP.value = 8.0;
    valDistP.textContent = "8.0 cm";
    sliderLenAB.value = 7.5;
    valLenAB.textContent = "7.5 cm";
    sliderLenAC.value = 10.0;
    valLenAC.textContent = "10.0 cm";

    startLerpLoop();
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
    sliderAngleA.addEventListener("input", (e) => {
        angleA = parseFloat(e.target.value);
        valAngleA.textContent = `${angleA.toFixed(0)} °`;
        startLerpLoop();
    });

    // 3. 点 P 距离 Slider
    sliderDistP.addEventListener("input", (e) => {
        distAP = parseFloat(e.target.value);
        valDistP.textContent = `${distAP.toFixed(1)} cm`;
        startLerpLoop();
    });

    // 4. AB, AC 长度 Slider
    sliderLenAB.addEventListener("input", (e) => {
        lenAB = parseFloat(e.target.value);
        valLenAB.textContent = `${lenAB.toFixed(1)} cm`;
        startLerpLoop();
    });
    sliderLenAC.addEventListener("input", (e) => {
        lenAC = parseFloat(e.target.value);
        valLenAC.textContent = `${lenAC.toFixed(1)} cm`;
        startLerpLoop();
    });

    // 5. 动作按钮
    btnPlayFolding.addEventListener("click", playFoldingAnimation);
    btnResetState.addEventListener("click", resetState);

    // 6. 帮助弹窗
    btnShowHelp.addEventListener("click", () => {
        modalHelp.classList.add("active");
    });
    btnCloseHelp.addEventListener("click", () => {
        modalHelp.classList.remove("active");
    });

    // 7. Collapsible HUD 折叠
    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
            hudPanel.classList.add("expanded");
        } else {
            hudPanel.classList.remove("expanded");
            hudPanel.classList.add("collapsed");
        }
        centerModel();
    });

    // 8. 暴露全局测试接口 window.appState
    window.appState = {
        get currentScene() { return currentScene; },
        get angleA() { return angleA; },
        get distAP() { return distAP; },
        get lenAB() { return lenAB; },
        get lenAC() { return lenAC; },
        get isAnimating() { return isAnimating; },
        get isHudExpanded() { return isHudExpanded; },
        get zoomScale() { return zoomScale; },
        get panX() { return panX; },
        get panY() { return panY; },
        get renderValues() {
            return {
                angleA: renderValues.angleA,
                distAP: renderValues.distAP,
                lenAB: renderValues.lenAB,
                lenAC: renderValues.lenAC,
                ad: renderValues.ad,
                ae: renderValues.ae,
                pd: renderValues.pd,
                pe: renderValues.pe,
                bd: renderValues.bd,
                cd: renderValues.cd,
                de: renderValues.de,
                df: renderValues.df,
                areaABD: renderValues.areaABD,
                areaACD: renderValues.areaACD,
                am: renderValues.am,
                an: renderValues.an,
                pm: renderValues.pm,
                pn: renderValues.pn
            };
        },
        resetState,
        loadScene
    };

    // 9. 绑定点拖拽、平移与缩放
    bindPointDragEvents();
    bindCanvasZoomEvents();
    bindCanvasPanEvents();

    // 10. 快捷缩放按钮
    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());

    // 双击背景自适应重置
    sandboxWrapper.parentNode.addEventListener("dblclick", (e) => {
        if (isCanvasControlTarget(e.target)) return;
        centerModel();
    });

    // 11. 载入初始场景
    loadScene("perpendicular-fold");
}

document.addEventListener("DOMContentLoaded", init);

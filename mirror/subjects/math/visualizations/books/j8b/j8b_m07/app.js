/**
 * 勾股定理逆定理判定实验室 - 核心逻辑 (app.js)
 * 1. 几何解析几何构建引擎：基于三边长计算顶点 A(x, y) 坐标，处理不满足三角形不等式时的断裂状态
 * 2. 数学网格背景：以顶点 C 为基准对齐的每格为 1 几何单位的坐标网格
 * 3. 角度数值实时渲染：利用余弦定理计算斜边所对角度，并利用角平分线向量算法完美将角度标注绘制在角内侧
 * 4. 经典整数勾股数检测：自动检测并高亮提示常考的整数勾股数
 * 5. 经典勾股数插值动画：平滑过渡三边尺寸
 * 6. 顶点拖拽逆向解算器：允许用户直接拖拽顶点并动态反馈修改三边值
 */

// ==========================================================================
// 1. 全局状态与配置
// ==========================================================================
let sideA = 6.0; // 边 a (BC)
let sideB = 8.0; // 边 b (AC)
let sideC = 10.0; // 边 c (AB) - 长边

// 动画插值目标值
let targetA = 6.0;
let targetB = 8.0;
let targetC = 10.0;
let isAnimating = false;

// 交互拖拽控制
let activeVertex = null; // 'A', 'B', 'C'
let scale = 25.0; // 像素与几何单位缩放比 (1单位 = 25像素)
const TOUCH_HIT_RADIUS = 30;
const MODEL_VIEW_MIN_ZOOM = 0.58;
const MODEL_VIEW_MAX_ZOOM = 2.6;
let modelView = { x: 0, y: 0, zoom: 1 };
let activeCanvasGesture = null; // vertex | pan | pinch
let panStart = null;
let pinchStart = null;
let thresholdDemoTimer = null;
let thresholdDemoState = { running: false, paused: false, index: 0 };
let activeChallengeKey = null;
let shouldAutoFitModel = true;
let isTouchManipulating = false;
let activePanelTab = "adjust";
let currentTrainingQuestion = null;
let trainingScore = { correct: 0, total: 0 };
const activePointers = new Map();

// 顶点屏幕坐标暂存
let vertexA = { x: 0, y: 0 };
let vertexB = { x: 0, y: 0 };
let vertexC = { x: 0, y: 0 };
let vertexA_alt = { x: 0, y: 0 }; // 断裂态下 AB 的张角端点

// DOM 元素引用
const canvasContainer = document.querySelector(".canvas-container-wrapper");
const canvas = document.getElementById("geometry-canvas");
const ctx = canvas.getContext("2d");

const rangeA = document.getElementById("range-a");
const rangeB = document.getElementById("range-b");
const rangeC = document.getElementById("range-c");

const lblA = document.getElementById("val-a-lbl");
const lblB = document.getElementById("val-b-lbl");
const lblC = document.getElementById("val-c-lbl");

const statusHeader = document.getElementById("status-header-container");
const statusDot = document.getElementById("verdict-status-dot");
const statusText = document.getElementById("verdict-status-text");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const judgementFeedbackPanel = document.getElementById("judgement-feedback-panel");
const judgementFeedbackBody = document.getElementById("judgement-feedback-body");
const classroomTaskPanel = document.getElementById("classroom-task-panel");
const challengePanel = document.getElementById("challenge-panel");
const reasoningLadderBody = document.getElementById("reasoning-ladder-body");
const btnThresholdDemo = document.getElementById("btn-threshold-demo");
const btnThresholdStop = document.getElementById("btn-threshold-stop");
const btnResetView = document.getElementById("btn-reset-view");
const trainingQuestion = document.getElementById("training-question");
const trainingFeedback = document.getElementById("training-feedback");
const trainingScoreNode = document.getElementById("training-score");
const btnNewTraining = document.getElementById("btn-new-training");

const modalHelp = document.getElementById("modal-help");
const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");

// ==========================================================================
// 2. 粒子爆开发光特效系统
// ==========================================================================
const particlesCanvas = document.getElementById("particles-canvas");
const pCtx = particlesCanvas.getContext("2d");
let particles = [];
let animId = null;

class SparkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 2.5 + 1;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.alpha -= this.decay;
    }
    draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowBlur = 8;
        c.shadowColor = this.color;
        c.fill();
        c.restore();
    }
}

function resizeParticlesCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeParticlesCanvas);
resizeParticlesCanvas();

function triggerSuccessSparks(x, y, color) {
    for (let i = 0; i < 35; i++) {
        particles.push(new SparkParticle(x, y, color));
    }
    if (!animId) {
        tickParticles();
    }
}

function tickParticles() {
    pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            p.draw(pCtx);
        }
    }
    if (particles.length > 0) {
        animId = requestAnimationFrame(tickParticles);
    } else {
        animId = null;
    }
}

// ==========================================================================
// 3. 几何运算与核心构建引擎 (Geometry Builder)
// ==========================================================================
// 验证是否满足三角形存在性定理
function checkTriangleValidity(a, b, c) {
    return (a + b > c) && (a + c > b) && (b + c > a);
}

// 计算三角形顶点坐标，并处理不合法的断裂形态
function computeVertices(W, H) {
    // 反应中心与安全基线 Y
    const rx = W / 2;
    const ry = H / 2 + 15;
    
    // 边 a (BC) 水平横放，位于底部
    // C 在左侧，B 在右侧
    vertexC.x = rx - (sideA * scale) / 2;
    vertexC.y = ry;
    
    vertexB.x = rx + (sideA * scale) / 2;
    vertexB.y = ry;

    const isValid = checkTriangleValidity(sideA, sideB, sideC);

    if (isValid) {
        // 利用解析几何交点公式求解 A(x, y)
        // 以 C 为原点，C 到 B 为 x 轴
        const x = (sideA * sideA + sideB * sideB - sideC * sideC) / (2 * sideA);
        const y = Math.sqrt(Math.max(0, sideB * sideB - x * x));

        // 映射到屏幕坐标系（Y轴向上为负）
        vertexA.x = vertexC.x + x * scale;
        vertexA.y = vertexC.y - y * scale;
    } else {
        // 三角形断裂态：AC(边b) 与 AB(边c) 无法触及
        // 我们让 AC 以 125° 向上伸展，AB 以 55° 向上伸展，呈现张开的裂缝
        vertexA.x = vertexC.x + Math.cos(Math.PI * 0.7) * (sideB * scale);
        vertexA.y = vertexC.y - Math.sin(Math.PI * 0.7) * (sideB * scale);
        
        vertexA_alt.x = vertexB.x + Math.cos(Math.PI * 0.3) * (sideC * scale);
        vertexA_alt.y = vertexB.y - Math.sin(Math.PI * 0.3) * (sideC * scale);
    }
}

// 绘制三边外侧正方形
function drawOuterSquare(p1, p2, color, fillStyle, label, val) {
    // 边向量 v
    const vx = p2.x - p1.x;
    const vy = p2.y - p1.y;
    
    // 向外法向向量 n (顺时针旋转90°指向外部)
    const nx = vy;
    const ny = -vx;
    
    // 正方形外侧两顶点
    const p3 = { x: p2.x + nx, y: p2.y + ny };
    const p4 = { x: p1.x + nx, y: p1.y + ny };

    // 绘制并填充发光正方形
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!shouldHideFineLabels()) {
        ctx.strokeStyle = "rgba(71, 85, 105, 0.20)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.restore();

    if (shouldHideFineLabels()) return;

    // 绘制中心面积文字
    const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
    const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
    
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px var(--font-math)";
    ctx.strokeText(`${label}² = ${(val * val).toFixed(1)}`, cx, cy);
    ctx.fillText(`${label}² = ${(val * val).toFixed(1)}`, cx, cy);
    ctx.restore();
}

// 绘制数学本网格背景 (每格间距等于 scale，顶点 C 始终锚定在格点上)
function drawGridPaper(W, H) {
    ctx.save();
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(37, 99, 235, 0.12)";
    ctx.lineWidth = 1;

    // 垂直网格线 (以 C 点的 x 坐标为基准对齐)
    const startX = vertexC.x % scale;
    for (let x = startX; x < W; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }

    // 水平网格线 (以 C 点的 y 坐标为基准对齐)
    const startY = vertexC.y % scale;
    for (let y = startY; y < H; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(14, 165, 233, 0.16)";
    const dotGap = Math.max(18, Math.round(scale / 1.4));
    const dotStartX = ((vertexC.x % dotGap) + dotGap) % dotGap;
    const dotStartY = ((vertexC.y % dotGap) + dotGap) % dotGap;
    for (let x = dotStartX; x < W; x += dotGap) {
        for (let y = dotStartY; y < H; y += dotGap) {
            ctx.beginPath();
            ctx.arc(x, y, 1.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function clampModelZoom(value) {
    return clamp(value, MODEL_VIEW_MIN_ZOOM, MODEL_VIEW_MAX_ZOOM);
}

function withModelView(drawFn) {
    ctx.save();
    ctx.translate(modelView.x, modelView.y);
    ctx.scale(modelView.zoom, modelView.zoom);
    drawFn();
    ctx.restore();
}

function screenToModelPoint(point) {
    return {
        x: (point.x - modelView.x) / modelView.zoom,
        y: (point.y - modelView.y) / modelView.zoom
    };
}

function modelToScreenPoint(point) {
    return {
        x: point.x * modelView.zoom + modelView.x,
        y: point.y * modelView.zoom + modelView.y
    };
}

function includePoint(bounds, point) {
    bounds.minX = Math.min(bounds.minX, point.x);
    bounds.minY = Math.min(bounds.minY, point.y);
    bounds.maxX = Math.max(bounds.maxX, point.x);
    bounds.maxY = Math.max(bounds.maxY, point.y);
}

function includeOuterSquareBounds(bounds, p1, p2) {
    const vx = p2.x - p1.x;
    const vy = p2.y - p1.y;
    const nx = vy;
    const ny = -vx;
    includePoint(bounds, p1);
    includePoint(bounds, p2);
    includePoint(bounds, { x: p2.x + nx, y: p2.y + ny });
    includePoint(bounds, { x: p1.x + nx, y: p1.y + ny });
}

function getModelContentBounds(isValid) {
    const bounds = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
    includePoint(bounds, vertexA);
    includePoint(bounds, vertexB);
    includePoint(bounds, vertexC);

    if (isValid) {
        includeOuterSquareBounds(bounds, vertexB, vertexC);
        includeOuterSquareBounds(bounds, vertexC, vertexA);
        includeOuterSquareBounds(bounds, vertexA, vertexB);
    } else {
        includePoint(bounds, vertexA_alt);
    }

    bounds.minX -= 42;
    bounds.minY -= 46;
    bounds.maxX += 42;
    bounds.maxY += 96;
    return bounds;
}

function fitModelToView(W, H, isValid) {
    const bounds = getModelContentBounds(isValid);
    const boundsW = Math.max(1, bounds.maxX - bounds.minX);
    const boundsH = Math.max(1, bounds.maxY - bounds.minY);
    const reserveLeft = 22;
    const reserveRight = 22;
    const reserveTop = 54;
    const reserveBottom = 126;
    const availableW = Math.max(120, W - reserveLeft - reserveRight);
    const availableH = Math.max(120, H - reserveTop - reserveBottom);
    const fitZoom = clamp(0.95 * Math.min(availableW / boundsW, availableH / boundsH), MODEL_VIEW_MIN_ZOOM, MODEL_VIEW_MAX_ZOOM);
    const contentCenterX = (bounds.minX + bounds.maxX) / 2;
    const contentCenterY = (bounds.minY + bounds.maxY) / 2;
    const targetCenterX = reserveLeft + availableW / 2;
    const targetCenterY = reserveTop + availableH / 2;
    modelView = {
        x: targetCenterX - contentCenterX * fitZoom,
        y: targetCenterY - contentCenterY * fitZoom,
        zoom: fitZoom
    };
    publishModelView();
}

function scheduleModelAutoFit() {
    shouldAutoFitModel = true;
}

function publishModelView() {
    canvas.dataset.viewX = modelView.x.toFixed(1);
    canvas.dataset.viewY = modelView.y.toFixed(1);
    canvas.dataset.zoom = modelView.zoom.toFixed(2);
}

function zoomModelAt(screenPoint, nextZoom) {
    const currentZoom = modelView.zoom;
    const zoom = clampModelZoom(nextZoom);
    if (Math.abs(zoom - currentZoom) < 0.001) return;
    const before = screenToModelPoint(screenPoint);
    modelView.zoom = zoom;
    modelView.x = screenPoint.x - before.x * zoom;
    modelView.y = screenPoint.y - before.y * zoom;
    shouldAutoFitModel = false;
    publishModelView();
    drawSandbox();
}

function resetModelView() {
    scheduleModelAutoFit();
    drawSandbox();
}

function getPointerDistance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function getPointerCenter(p1, p2) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function getActivePointerPair() {
    const values = Array.from(activePointers.values());
    return values.length >= 2 ? [values[0], values[1]] : null;
}

function startPinchGesture() {
    const pair = getActivePointerPair();
    if (!pair) return;
    const [p1, p2] = pair;
    pinchStart = {
        distance: getPointerDistance(p1, p2),
        center: getPointerCenter(p1, p2),
        zoom: modelView.zoom,
        viewX: modelView.x,
        viewY: modelView.y
    };
    activeCanvasGesture = "pinch";
}

function updatePinchGesture() {
    const pair = getActivePointerPair();
    if (!pair || !pinchStart || pinchStart.distance < 1) return;
    const [p1, p2] = pair;
    const center = getPointerCenter(p1, p2);
    const nextZoom = clampModelZoom(pinchStart.zoom * (getPointerDistance(p1, p2) / pinchStart.distance));
    const anchor = {
        x: (pinchStart.center.x - pinchStart.viewX) / pinchStart.zoom,
        y: (pinchStart.center.y - pinchStart.viewY) / pinchStart.zoom
    };
    modelView.zoom = nextZoom;
    modelView.x = center.x - anchor.x * nextZoom;
    modelView.y = center.y - anchor.y * nextZoom;
    publishModelView();
    drawSandbox();
}

function getSideEndpoints(name) {
    if (name === "a") return [vertexC, vertexB];
    if (name === "b") return [vertexC, vertexA];
    return [vertexA, vertexB];
}

function drawLongestSideBadge(sHyp) {
    const [p1, p2] = getSideEndpoints(sHyp.name);
    const x = (p1.x + p2.x) / 2;
    const y = (p1.y + p2.y) / 2;
    ctx.save();
    ctx.font = "bold 12px var(--font-sans)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = `最长边 ${sHyp.name}=${sHyp.val.toFixed(1)}`;
    const width = ctx.measureText(text).width + 18;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.strokeStyle = "rgba(15, 23, 42, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - 34, width, 24, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.fillText(text, x, y - 22);
    ctx.restore();
}

function shouldHideFineLabels() {
    return isTouchManipulating || activeCanvasGesture === "vertex" || activeCanvasGesture === "pan" || activeCanvasGesture === "pinch";
}

function getTriangleStateClass(isValid, sqSum, sqHyp, diff) {
    if (!isValid) return "error";
    if (diff < 0.05) return "right";
    return sqSum > sqHyp ? "acute" : "obtuse";
}

function getTriangleStateName(stateClass) {
    return {
        right: "直角三角形",
        acute: "锐角三角形",
        obtuse: "钝角三角形",
        error: "不能成三角形"
    }[stateClass] || "待判定";
}

function getMathSymbol(stateClass) {
    if (stateClass === "right") return "=";
    if (stateClass === "acute") return ">";
    if (stateClass === "obtuse") return "<";
    return "";
}

function getLongestSideWarning(sHyp) {
    if (sHyp.name === "c") return "";
    return `最长边不是固定的 c，本题应先把 ${sHyp.name} 当作待比较的最长边。`;
}

function renderReasoningLadder(isValid, s1, s2, sHyp, sqSum, sqHyp, diff, stateClass, stateName, mathSymbol) {
    if (!reasoningLadderBody) return;
    const warning = getLongestSideWarning(sHyp);
    const t1 = s1.label.charAt(0);
    const t2 = s2.label.charAt(0);
    const tHyp = sHyp.label.charAt(0);
    const rows = isValid ? [
        ["1", "先找最长边", `${sHyp.name} = ${sHyp.val.toFixed(1)}${warning ? "，不是固定的 c" : ""}`],
        ["2", "比较平方", `${t1}² + ${t2}² = ${sqSum.toFixed(1)}，${tHyp}² = ${sqHyp.toFixed(1)}`],
        ["3", "判断关系", `${t1}² + ${t2}² ${mathSymbol} ${tHyp}²`],
        ["4", "得到结论", stateName]
    ] : [
        ["1", "先验三边", "任意两边之和必须大于第三边"],
        ["2", "当前失败", `${sideA.toFixed(1)}、${sideB.toFixed(1)}、${sideC.toFixed(1)} 不能闭合`],
        ["3", "不能判角", "先调整成三角形再比较平方"],
        ["4", "得到结论", "不能成三角形"]
    ];
    reasoningLadderBody.innerHTML = `
        ${warning ? `<div class="longest-warning">${warning}</div>` : ""}
        ${rows.map(([num, label, value]) => `
            <div class="reasoning-step state-${stateClass}">
                <b>${num}</b>
                <span>${label}</span>
                <strong>${value}</strong>
            </div>
        `).join("")}
    `;
}

function renderAngleTypeBand(W, H, isValid, stateClass, stateName, s1, s2, sHyp, sqSum, sqHyp, diff) {
    const boxW = Math.min(320, W - 36);
    const preferredX = W > 820 ? 430 : W / 2 - boxW / 2;
    const x = clamp(preferredX, 18, W - boxW - 18);
    const y = 18;
    const color = stateClass === "right" ? "#10b981" : stateClass === "acute" ? "#2563eb" : stateClass === "obtuse" ? "#f59e0b" : "#ef4444";
    const progress = !isValid ? 0.5 : clamp(sqSum / Math.max(sqHyp, 1), 0, 2) / 2;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.36)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, 58, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 13px var(--font-sans)";
    ctx.textAlign = "left";
    ctx.fillText(isValid ? `${s1.name}² + ${s2.name}² ${getMathSymbol(stateClass)} ${sHyp.name}²` : "三边不能闭合", x + 12, y + 18);
    ctx.fillStyle = color;
    ctx.font = "800 12px var(--font-sans)";
    ctx.fillText(stateName, x + boxW - 92, y + 18);
    ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 34, boxW - 24, 8, 999);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 34, (boxW - 24) * progress, 8, 999);
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.font = "700 10px var(--font-sans)";
    ctx.textAlign = "center";
    ctx.fillText("锐", x + 35, y + 52);
    ctx.fillText("直", x + boxW / 2, y + 52);
    ctx.fillText("钝", x + boxW - 35, y + 52);
    ctx.restore();
}

function renderBalanceScale(W, H, isValid, s1, s2, sHyp, sqSum, sqHyp, diff) {
    const boxW = Math.min(270, W - 34);
    const boxH = 86;
    const x = Math.max(18, W - boxW - 18);
    const y = Math.max(72, H - boxH - 18);
    const stateColor = !isValid ? "#ef4444" : diff < 0.05 ? "#10b981" : sqSum > sqHyp ? "#2563eb" : "#f59e0b";
    const tilt = !isValid ? 0 : clamp((sqHyp - sqSum) / Math.max(sqSum, sqHyp, 1), -0.18, 0.18);

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px var(--font-sans)";
    ctx.textAlign = "left";
    ctx.fillText("面积天平", x + 12, y + 17);

    const cx = x + boxW / 2;
    const cy = y + 48;
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 88, cy + tilt * 70);
    ctx.lineTo(cx + 88, cy - tilt * 70);
    ctx.stroke();

    ctx.strokeStyle = "rgba(15, 23, 42, 0.34)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx, y + boxH - 14);
    ctx.moveTo(cx - 24, y + boxH - 14);
    ctx.lineTo(cx + 24, y + boxH - 14);
    ctx.stroke();

    ctx.font = "700 11px var(--font-sans)";
    ctx.fillStyle = "#334155";
    ctx.textAlign = "center";
    ctx.fillText(`${s1.name}²+${s2.name}²`, cx - 88, cy + 22);
    ctx.fillText(`${sHyp.name}²`, cx + 88, cy + 22);
    ctx.font = "800 12px var(--font-sans)";
    ctx.fillStyle = stateColor;
    ctx.fillText(isValid ? `${sqSum.toFixed(1)} / ${sqHyp.toFixed(1)}` : "三边未闭合", cx, y + boxH - 10);
    ctx.restore();
}

// ==========================================================================
// 4. 画布主渲染循环 (Draw Sandbox)
// ==========================================================================
function drawSandbox() {
    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, W, H);

    // 1. 自动对三边进行排序以识别最长斜边 (对逆定理而言)
    const sideArr = [
        { name: 'a', val: sideA, label: 'a (BC)' },
        { name: 'b', val: sideB, label: 'b (AC)' },
        { name: 'c', val: sideC, label: 'c (AB)' }
    ].sort((x, y) => x.val - y.val);

    const s1 = sideArr[0]; // 短直角边1
    const s2 = sideArr[1]; // 短直角边2
    const sHyp = sideArr[2]; // 判定斜边

    const sqSum = s1.val * s1.val + s2.val * s2.val;
    const sqHyp = sHyp.val * sHyp.val;
    const diff = Math.abs(sqSum - sqHyp);

    // 计算三维坐标以确保网格绘制时对齐基准点
    computeVertices(W, H);

    // 2. 绘制网格背景
    drawGridPaper(W, H);

    const isValid = checkTriangleValidity(sideA, sideB, sideC);
    const stateClass = getTriangleStateClass(isValid, sqSum, sqHyp, diff);
    const stateName = getTriangleStateName(stateClass);

    if (shouldAutoFitModel) {
        fitModelToView(W, H, isValid);
        shouldAutoFitModel = false;
    }
    
    // 3. 根据代数比对渲染判定状态与状态栏霓虹色
    updateUIAndStatus(isValid, s1, s2, sHyp, sqSum, sqHyp, diff);

    withModelView(() => {
        // 4. 绘制投影正方形 (仅在三角形合法时绘制)
        if (isValid) {
            // 正方形 a (BC): 红色
            drawOuterSquare(vertexB, vertexC, "rgba(244, 63, 94, 0.8)", "rgba(244, 63, 94, 0.12)", "a", sideA);
            // 正方形 b (AC): 蓝色
            drawOuterSquare(vertexC, vertexA, "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.12)", "b", sideB);
            // 正方形 c (AB): 橙黄色
            drawOuterSquare(vertexA, vertexB, "rgba(245, 158, 11, 0.8)", "rgba(245, 158, 11, 0.12)", "c", sideC);
            
            // 5. 绘制三角形本体三边杆件
            ctx.save();
            ctx.lineWidth = 3.5;
            
            // 边 a (红色)
            ctx.strokeStyle = "#f43f5e";
            ctx.beginPath(); ctx.moveTo(vertexC.x, vertexC.y); ctx.lineTo(vertexB.x, vertexB.y); ctx.stroke();
            
            // 边 b (蓝色)
            ctx.strokeStyle = "#3b82f6";
            ctx.beginPath(); ctx.moveTo(vertexC.x, vertexC.y); ctx.lineTo(vertexA.x, vertexA.y); ctx.stroke();
            
            // 边 c (橙色)
            ctx.strokeStyle = "#f59e0b";
            ctx.beginPath(); ctx.moveTo(vertexA.x, vertexA.y); ctx.lineTo(vertexB.x, vertexB.y); ctx.stroke();
            ctx.restore();

            drawLongestSideBadge(sHyp);

            // 6. 绘制直角/锐角/钝角角标与度数文字
            drawAngleLabel(diff, sHyp, s1, s2, sqSum, sqHyp);

        } else {
            // 绘制断开状态的红色虚线与断开提示
            ctx.save();
            ctx.lineWidth = 3;
            
            // 边 a (红色)
            ctx.strokeStyle = "#f43f5e";
            ctx.beginPath(); ctx.moveTo(vertexC.x, vertexC.y); ctx.lineTo(vertexB.x, vertexB.y); ctx.stroke();
            
            // 边 b (断开, 蓝色)
            ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
            ctx.beginPath(); ctx.moveTo(vertexC.x, vertexC.y); ctx.lineTo(vertexA.x, vertexA.y); ctx.stroke();
            
            // 边 c (断开, 橙色)
            ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
            ctx.beginPath(); ctx.moveTo(vertexB.x, vertexB.y); ctx.lineTo(vertexA_alt.x, vertexA_alt.y); ctx.stroke();

            // 两断开顶点之间的拉扯红虚线
            ctx.strokeStyle = "#f43f5e";
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(vertexA.x, vertexA.y);
            ctx.lineTo(vertexA_alt.x, vertexA_alt.y);
            ctx.stroke();
            ctx.restore();

            // 绘制断开红色感叹号
            const midGapX = (vertexA.x + vertexA_alt.x) / 2;
            const midGapY = (vertexA.y + vertexA_alt.y) / 2;
            ctx.save();
            ctx.fillStyle = "#f43f5e";
            ctx.font = "bold 18px var(--font-sans)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⚠️ 无法闭合", midGapX, midGapY - 20);
            ctx.restore();
        }

        // 7. 绘制顶点交互圆圈
        drawVertexNode("A", vertexA);
        drawVertexNode("B", vertexB);
        drawVertexNode("C", vertexC);
    });

    renderAngleTypeBand(W, H, isValid, stateClass, stateName, s1, s2, sHyp, sqSum, sqHyp, diff);
    renderBalanceScale(W, H, isValid, s1, s2, sHyp, sqSum, sqHyp, diff);
}

// 绘制可拖拽顶点
function drawVertexNode(label, pos) {
    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#ffffff";
    
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (activeVertex === label) {
        ctx.strokeStyle = "rgba(8, 145, 178, 0.72)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px var(--font-sans)";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.shadowBlur = 0;
    
    // 根据顶点类型轻微偏移标签，防止遮挡
    let ox = 0, oy = 0;
    if (label === "A") { ox = -14; oy = -14; }
    else if (label === "B") { ox = 12; oy = 14; }
    else { ox = -20; oy = 14; }
    
    ctx.strokeText(label, pos.x + ox, pos.y + oy);
    ctx.fillText(label, pos.x + ox, pos.y + oy);
    ctx.restore();
}

// 绘制直角角标、弧线角标以及精确角度度数渲染
function drawAngleLabel(diff, sHyp, s1, s2, sqSum, sqHyp) {
    // 找到最长边对应的角顶点 (边对角关系)
    let targetVertex = vertexC;
    let vLeft = vertexA;
    let vRight = vertexB;
    let targetAngleLabel = "C";
    
    if (sHyp.name === 'b') {
        targetVertex = vertexB; vLeft = vertexC; vRight = vertexA; targetAngleLabel = "B";
    } else if (sHyp.name === 'a') {
        targetVertex = vertexA; vLeft = vertexB; vRight = vertexC; targetAngleLabel = "A";
    }

    // 向量法计算角两边夹角方向
    const d1x = vLeft.x - targetVertex.x;
    const d1y = vLeft.y - targetVertex.y;
    const d2x = vRight.x - targetVertex.x;
    const d2y = vRight.y - targetVertex.y;

    const angle1 = Math.atan2(d1y, d1x);
    const angle2 = Math.atan2(d2y, d2x);

    // 余弦定理计算精确夹角角度值
    const cosVal = Math.min(1.0, Math.max(-1.0, (s1.val * s1.val + s2.val * s2.val - sHyp.val * sHyp.val) / (2 * s1.val * s2.val)));
    const angleRad = Math.acos(cosVal);
    const angleDeg = angleRad * 180 / Math.PI;

    ctx.save();
    if (diff < 0.05) {
        // 直角：绘制粉绿霓虹直角折线
        ctx.strokeStyle = "rgba(16, 185, 129, 0.9)";
        ctx.lineWidth = 2.2;
        const size = 15;
        
        // 两个方向的单位向量
        const len1 = Math.hypot(d1x, d1y);
        const len2 = Math.hypot(d2x, d2y);
        const u1x = d1x / len1 * size;
        const u1y = d1y / len1 * size;
        const u2x = d2x / len2 * size;
        const u2y = d2y / len2 * size;

        ctx.beginPath();
        ctx.moveTo(targetVertex.x + u1x, targetVertex.y + u1y);
        ctx.lineTo(targetVertex.x + u1x + u2x, targetVertex.y + u1y + u2y);
        ctx.lineTo(targetVertex.x + u2x, targetVertex.y + u2y);
        ctx.stroke();
        
        // 粒子成功爆开 (只在刚刚达成直角的一刹那触发)
        if (btnShowHelp.getAttribute("data-right-sparked") !== "true") {
            const canvasLeft = canvas.getBoundingClientRect().left;
            const canvasTop = canvas.getBoundingClientRect().top;
            const sparkPoint = modelToScreenPoint(targetVertex);
            triggerSuccessSparks(canvasLeft + sparkPoint.x, canvasTop + sparkPoint.y, "#10b981");
            playPerfectChord(); // 清脆直角和弦
            btnShowHelp.setAttribute("data-right-sparked", "true");
        }
    } else {
        // 锐角或钝角：绘制虚线弧线角标
        btnShowHelp.setAttribute("data-right-sparked", "false");
        
        ctx.strokeStyle = sqSum < sqHyp ? "rgba(245, 158, 11, 0.7)" : "rgba(59, 130, 246, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        
        const startRad = Math.min(angle1, angle2);
        const endRad = Math.max(angle1, angle2);
        
        ctx.arc(targetVertex.x, targetVertex.y, 22, startRad, endRad);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 向量角平分线定位法：将夹角角度度数画在角内侧
    const len1 = Math.hypot(d1x, d1y);
    const len2 = Math.hypot(d2x, d2y);
    if (len1 > 0 && len2 > 0) {
        const bx = d1x / len1 + d2x / len2;
        const by = d1y / len1 + d2y / len2;
        const blen = Math.hypot(bx, by);
        
        if (blen > 0) {
            // 向角内侧偏移约 35 像素
            const labelX = targetVertex.x + (bx / blen) * 35;
            const labelY = targetVertex.y + (by / blen) * 35;

            ctx.fillStyle = diff < 0.05 ? "var(--color-right)" : (sqSum < sqHyp ? "var(--color-obtuse)" : "var(--color-acute)");
            ctx.font = "bold 11.5px var(--font-math)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`∠${targetAngleLabel}=${angleDeg.toFixed(1)}°`, labelX, labelY);
        }
    }

    ctx.restore();
}

function renderJudgementFeedback(isValid, s1, s2, sHyp, sqSum, sqHyp, diff, stateClass, stateName, mathSymbol) {
    if (!judgementFeedbackBody) return;
    if (!isValid) {
        judgementFeedbackBody.innerHTML = `
            <div class="feedback-card state-error">
                <div class="feedback-main">三边不能闭合</div>
                <div class="feedback-formula">${sideA.toFixed(1)}、${sideB.toFixed(1)}、${sideC.toFixed(1)}</div>
            </div>
        `;
        return;
    }

    const t1 = s1.label.charAt(0);
    const t2 = s2.label.charAt(0);
    const tHyp = sHyp.label.charAt(0);
    const deltaText = diff < 0.05 ? "0.0" : diff.toFixed(1);
    judgementFeedbackBody.innerHTML = `
        <div class="feedback-card state-${stateClass}">
            <div class="feedback-main">${stateName}</div>
            <div class="feedback-formula">${t1}² + ${t2}² ${mathSymbol} ${tHyp}²</div>
        </div>
        <div class="metric-grid">
            <div class="metric-item">
                <span>最长边</span>
                <strong>${sHyp.name} = ${sHyp.val.toFixed(1)}</strong>
            </div>
            <div class="metric-item">
                <span>较短边平方和</span>
                <strong>${sqSum.toFixed(1)}</strong>
            </div>
            <div class="metric-item">
                <span>最长边平方</span>
                <strong>${sqHyp.toFixed(1)}</strong>
            </div>
            <div class="metric-item">
                <span>差值</span>
                <strong>${deltaText}</strong>
            </div>
        </div>
    `;
}

function renderTeachingTasks(isValid, sHyp, sqSum, sqHyp, diff, stateClass) {
    if (!classroomTaskPanel) return;
    const tasks = [
        { key: "right", done: isValid && diff < 0.05 },
        { key: "acute", done: isValid && stateClass === "acute" },
        { key: "obtuse", done: isValid && stateClass === "obtuse" },
        { key: "longest", done: isValid && sHyp.name !== "c" }
    ];
    for (const task of tasks) {
        const button = classroomTaskPanel.querySelector(`[data-task-preset="${task.key}"]`);
        if (!button) continue;
        button.classList.toggle("is-done", task.done);
        const flag = button.querySelector(".task-flag");
        if (flag) flag.textContent = task.done ? "已达成" : "挑战";
    }
}

function getThresholdSequence() {
    return [
        { a: 6, b: 8, c: 9.2, label: "锐角区：c² 小于 6²+8²" },
        { a: 6, b: 8, c: 9.7, label: "接近临界：继续观察 c²" },
        { a: 6, b: 8, c: 10, label: "临界直角：6²+8² = 10²" },
        { a: 6, b: 8, c: 10.4, label: "越过临界：开始变钝" },
        { a: 6, b: 8, c: 10.8, label: "钝角区：c² 大于 6²+8²" }
    ];
}

function updateThresholdButtons() {
    if (btnThresholdDemo) {
        btnThresholdDemo.textContent = thresholdDemoState.running ? "播放中..." : "临界演示";
        btnThresholdDemo.classList.toggle("is-active", thresholdDemoState.running);
    }
    if (btnThresholdStop) {
        btnThresholdStop.textContent = thresholdDemoState.running ? "暂停演示" : "停止演示";
    }
}

function stopThresholdDemo() {
    clearTimeout(thresholdDemoTimer);
    thresholdDemoTimer = null;
    thresholdDemoState.running = false;
    thresholdDemoState.paused = true;
    updateThresholdButtons();
}

function runThresholdDemo() {
    clearTimeout(thresholdDemoTimer);
    thresholdDemoState.running = true;
    thresholdDemoState.paused = false;
    updateThresholdButtons();
    const sequence = getThresholdSequence();
    const next = () => {
        if (!thresholdDemoState.running || thresholdDemoState.paused) return;
        const item = sequence[thresholdDemoState.index];
        if (!item) {
            thresholdDemoState.index = 0;
            thresholdDemoState.running = false;
            updateThresholdButtons();
            return;
        }
        startTweenTo(item.a, item.b, item.c);
        if (trainingFeedback) trainingFeedback.textContent = item.label;
        thresholdDemoState.index += 1;
        thresholdDemoTimer = setTimeout(next, item.c === 10 ? 1400 : 980);
    };
    next();
}

function toggleThresholdDemo() {
    if (thresholdDemoState.running) {
        stopThresholdDemo();
        return;
    }
    thresholdDemoState.index = 0;
    runThresholdDemo();
}

function applyChallengePreset(key) {
    activeChallengeKey = key;
    const presetMap = {
        visualRightNot: { a: 6, b: 8, c: 10.3 },
        near345: { a: 3.1, b: 4, c: 5 },
        longestNotC: { a: 10, b: 6, c: 8 },
        invalid: { a: 4, b: 5, c: 12 }
    };
    const preset = presetMap[key];
    if (!preset) return;
    startTweenTo(preset.a, preset.b, preset.c);
    if (challengePanel) {
        challengePanel.querySelectorAll(".btn-challenge").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.challenge === key);
        });
    }
}

function classifySides(a, b, c) {
    const arr = [
        { name: "a", val: a },
        { name: "b", val: b },
        { name: "c", val: c }
    ].sort((x, y) => x.val - y.val);
    if (!checkTriangleValidity(a, b, c)) {
        return { answer: "invalid", reason: "错因：先判断三边能否闭合，不能直接套平方公式。", arr };
    }
    const sqSum = arr[0].val ** 2 + arr[1].val ** 2;
    const sqHyp = arr[2].val ** 2;
    const diff = Math.abs(sqSum - sqHyp);
    if (diff < 0.05) {
        return { answer: "right", reason: "错因：直角要满足较短两边平方和等于最长边平方。", arr };
    }
    if (sqSum > sqHyp) {
        return { answer: "acute", reason: "错因：较短两边平方和大于最长边平方，对应锐角。", arr };
    }
    return { answer: "obtuse", reason: "错因：较短两边平方和小于最长边平方，对应钝角。", arr };
}

function generateTrainingQuestion() {
    const pool = [
        { a: 6, b: 8, c: 10 },
        { a: 6, b: 8, c: 9.4 },
        { a: 6, b: 8, c: 10.7 },
        { a: 10, b: 6, c: 8 },
        { a: 5, b: 7, c: 9 },
        { a: 4, b: 5, c: 12 },
        { a: 7, b: 24, c: 25 },
        { a: 9, b: 12, c: 14.5 }
    ];
    currentTrainingQuestion = pool[Math.floor(Math.random() * pool.length)];
    const { a, b, c } = currentTrainingQuestion;
    const classified = classifySides(a, b, c);
    currentTrainingQuestion.answer = classified.answer;
    currentTrainingQuestion.reason = classified.reason;
    if (trainingQuestion) trainingQuestion.textContent = `判断三边：${a}、${b}、${c}`;
    if (trainingFeedback) trainingFeedback.textContent = "先找最长边，再比较平方。";
    document.querySelectorAll(".training-choice").forEach(btn => btn.classList.remove("is-right", "is-wrong"));
    startTweenTo(a, b, c);
    setPanelTab("challenge");
}

function updateTrainingScore() {
    if (trainingScoreNode) {
        trainingScoreNode.textContent = `${trainingScore.correct} / ${trainingScore.total}`;
    }
}

function submitTrainingAnswer(answer, button) {
    if (!currentTrainingQuestion) generateTrainingQuestion();
    if (!currentTrainingQuestion) return;
    trainingScore.total += 1;
    const ok = answer === currentTrainingQuestion.answer;
    if (ok) trainingScore.correct += 1;
    document.querySelectorAll(".training-choice").forEach(btn => {
        btn.classList.toggle("is-right", btn.dataset.answer === currentTrainingQuestion.answer);
        btn.classList.toggle("is-wrong", btn === button && !ok);
    });
    const labelMap = { right: "直角", acute: "锐角", obtuse: "钝角", invalid: "不能成三角形" };
    if (trainingFeedback) {
        trainingFeedback.textContent = ok
            ? `判断正确：${labelMap[currentTrainingQuestion.answer]}。`
            : `${currentTrainingQuestion.reason} 正确答案：${labelMap[currentTrainingQuestion.answer]}。`;
    }
    updateTrainingScore();
}

function setPanelTab(tab) {
    activePanelTab = tab;
    document.querySelectorAll("[data-panel-tab]").forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.panelTab === tab);
    });
    document.querySelectorAll("[data-panel-view]").forEach(section => {
        section.classList.toggle("is-hidden", section.dataset.panelView !== tab);
    });
}

function adjustSide(side, delta) {
    if (side === "a") sideA = clamp(sideA + delta, 3, 15);
    if (side === "b") sideB = clamp(sideB + delta, 3, 15);
    if (side === "c") sideC = clamp(sideC + delta, 3, 20);
    activeChallengeKey = null;
    scheduleModelAutoFit();
    drawSandbox();
}

// ==========================================================================
// 5. HUD 代数步骤与 UI 联动 (HUD & UI Updater)
// ==========================================================================
function updateUIAndStatus(isValid, s1, s2, sHyp, sqSum, sqHyp, diff) {
    // 渲染滑块数值显示
    lblA.innerHTML = sideA.toFixed(1);
    lblB.innerHTML = sideB.toFixed(1);
    lblC.innerHTML = sideC.toFixed(1);

    if (!isAnimating) {
        rangeA.value = sideA;
        rangeB.value = sideB;
        rangeC.value = sideC;
    }

    if (!isValid) {
        statusHeader.className = "chamber-status-header error";
        statusText.innerHTML = "❌ 无法构成三角形！任意两边之和必须大于第三边（即三边需满足两边之和大于第三边）。";
        renderJudgementFeedback(false, s1, s2, sHyp, sqSum, sqHyp, diff, "error", "无法构成三角形", "");
        renderTeachingTasks(false, sHyp, sqSum, sqHyp, diff, "error");
        renderReasoningLadder(false, s1, s2, sHyp, sqSum, sqHyp, diff, "error", "不能成三角形", "");
        stepsChalkboard.innerHTML = `
            <div class="hud-row">
                <div class="hud-row-label">三边关系</div>
                <div class="hud-row-val glow-text-red">
                    ${sideA.toFixed(1)} + ${sideB.toFixed(1)} &le; ${sideC.toFixed(1)} (不成立)
                </div>
            </div>
            <div class="verdict-box">
                <div class="verdict-title glow-text-red">构造失败：</div>
                <div class="verdict-desc">无法用当前的木棒长度搭建成封闭的三边形。</div>
            </div>
        `;
        return;
    }

    let stateClass = "";
    let stateName = "";
    let mathSymbol = "";
    let glowClass = "";

    if (diff < 0.05) {
        stateClass = "right";
        stateName = "直角三角形";
        mathSymbol = "=";
        glowClass = "glow-text-green";
    } else if (sqSum > sqHyp) {
        stateClass = "acute";
        stateName = "锐角三角形";
        mathSymbol = "&gt;";
        glowClass = "glow-text-blue";
    } else {
        stateClass = "obtuse";
        stateName = "钝角三角形";
        mathSymbol = "&lt;";
        glowClass = "glow-text-orange";
    }

    // 更新判定大条
    statusHeader.className = `chamber-status-header ${stateClass}`;
    statusText.innerHTML = `✨ 判定结果：该三边长构成 <strong>${stateName}</strong>`;

    // 渲染黑板板书
    const t1 = s1.label.charAt(0);
    const t2 = s2.label.charAt(0);
    const tHyp = sHyp.label.charAt(0);
    renderJudgementFeedback(true, s1, s2, sHyp, sqSum, sqHyp, diff, stateClass, stateName, mathSymbol);
    renderTeachingTasks(true, sHyp, sqSum, sqHyp, diff, stateClass);
    renderReasoningLadder(true, s1, s2, sHyp, sqSum, sqHyp, diff, stateClass, stateName, mathSymbol.replace("&gt;", ">").replace("&lt;", "<"));

    // 计算精确角度以用于板书
    const cosVal = Math.min(1.0, Math.max(-1.0, (s1.val * s1.val + s2.val * s2.val - sHyp.val * sHyp.val) / (2 * s1.val * s2.val)));
    const angleDeg = Math.acos(cosVal) * 180 / Math.PI;

    // 检查是否是经典整数勾股数组
    const isAInt = Math.abs(sideA - Math.round(sideA)) < 0.01;
    const isBInt = Math.abs(sideB - Math.round(sideB)) < 0.01;
    const isCInt = Math.abs(sideC - Math.round(sideC)) < 0.01;
    let pyTripleBadgeHTML = "";
    if (isAInt && isBInt && isCInt && diff < 0.05) {
        const sortedInts = [Math.round(sideA), Math.round(sideB), Math.round(sideC)].sort((x, y) => x - y);
        pyTripleBadgeHTML = `
            <div class="py-triple-badge">
                🏆 经典整数勾股数: (${sortedInts[0]}, ${sortedInts[1]}, ${sortedInts[2]})
            </div>
        `;
    }

    const longestWarning = getLongestSideWarning(sHyp);
    let html = `
        ${longestWarning ? `
        <div class="hud-row">
            <div class="hud-row-label">易错提醒</div>
            <div class="hud-row-val glow-text-orange">${longestWarning}</div>
        </div>` : ""}
        <div class="hud-row">
            <div class="hud-row-label">1. 先找最长边</div>
            <div class="hud-row-val">
                ${sHyp.name} = <span class="${glowClass}">${sHyp.val.toFixed(1)}</span>
            </div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">2. 较短两边平方和</div>
            <div class="hud-row-val">
                ${t1}² + ${t2}² = <span class="${glowClass}">${sqSum.toFixed(1)}</span>
            </div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">3. 最长边平方</div>
            <div class="hud-row-val">
                ${tHyp}² = <span class="${glowClass}">${sqHyp.toFixed(1)}</span>
            </div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">4. 判定</div>
            <div class="hud-row-val">
                ${t1}² + ${t2}² ${mathSymbol} ${tHyp}² &rArr; ${stateName}
            </div>
        </div>
    `;

    if (diff < 0.05) {
        html += `
            <div class="verdict-box">
                <div class="verdict-title glow-text-green">逆定理吻合：</div>
                <div class="verdict-desc">
                    对应角：<strong>∠${tHyp.toUpperCase()} = ${angleDeg.toFixed(1)}°</strong>
                    ${pyTripleBadgeHTML}
                </div>
            </div>
        `;
    } else {
        const typeDesc = sqSum > sqHyp ? "锐角三角形" : "钝角三角形";
        const relationDesc = sqSum > sqHyp ? "大于最长斜边平方，所对角为锐角" : "小于最长斜边平方，所对角为钝角";
        html += `
            <div class="verdict-box">
                <div class="verdict-title ${glowClass}">${typeDesc}：</div>
                <div class="verdict-desc">
                    ∠${tHyp.toUpperCase()} = ${angleDeg.toFixed(1)}°，${relationDesc}。
                </div>
            </div>
        `;
    }

    stepsChalkboard.innerHTML = html;
}

// ==========================================================================
// 6. 三边平滑变动插值动画 (Morph Animation)
// ==========================================================================
function updateTweenAnimation() {
    if (!isAnimating) return;

    // 平滑缓动插值
    const ease = 0.15;
    let distA = targetA - sideA;
    let distB = targetB - sideB;
    let distC = targetC - sideC;

    if (Math.abs(distA) < 0.01 && Math.abs(distB) < 0.01 && Math.abs(distC) < 0.01) {
        sideA = targetA;
        sideB = targetB;
        sideC = targetC;
        isAnimating = false;
    } else {
        sideA += distA * ease;
        sideB += distB * ease;
        sideC += distC * ease;
    }

    drawSandbox();

    if (isAnimating) {
        requestAnimationFrame(updateTweenAnimation);
    }
}

function startTweenTo(a, b, c) {
    targetA = a;
    targetB = b;
    targetC = c;
    scheduleModelAutoFit();
    
    if (!isAnimating) {
        isAnimating = true;
        updateTweenAnimation();
    }
}

// ==========================================================================
// 7. 手动拖拽顶点逆向计算 (Drag Vertices Math Solver)
// ==========================================================================
function initCanvasDragEvents() {
    const getCanvasPoint = (e) => {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const findHitVertex = (point) => {
        const candidates = [
            { key: "A", point: vertexA },
            { key: "B", point: vertexB },
            { key: "C", point: vertexC }
        ];
        for (const item of candidates) {
            const screenPoint = modelToScreenPoint(item.point);
            if (Math.hypot(point.x - screenPoint.x, point.y - screenPoint.y) <= TOUCH_HIT_RADIUS) {
                return item.key;
            }
        }
        return null;
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        isTouchManipulating = true;
        const point = getCanvasPoint(e);
        activePointers.set(e.pointerId, point);
        canvas.setPointerCapture(e.pointerId);

        if (activePointers.size >= 2) {
            activeVertex = null;
            startPinchGesture();
            return;
        }

        // 检查用户点中了哪个顶点
        const hitVertex = findHitVertex(point);
        if (hitVertex) {
            activeVertex = hitVertex;
            activeCanvasGesture = "vertex";
            drawSandbox();
        } else {
            activeVertex = null;
            activeCanvasGesture = "pan";
            panStart = {
                x: point.x,
                y: point.y,
                viewX: modelView.x,
                viewY: modelView.y
            };
        }
    };

    const handlePointerMove = (e) => {
        if (!activePointers.has(e.pointerId)) return;
        e.preventDefault();
        const point = getCanvasPoint(e);
        activePointers.set(e.pointerId, point);

        if (activeCanvasGesture === "pinch" || activePointers.size >= 2) {
            shouldAutoFitModel = false;
            updatePinchGesture();
            return;
        }

        if (activeCanvasGesture === "pan" && panStart) {
            modelView.x = panStart.viewX + point.x - panStart.x;
            modelView.y = panStart.viewY + point.y - panStart.y;
            shouldAutoFitModel = false;
            publishModelView();
            drawSandbox();
            return;
        }

        if (!activeVertex) return;
        const modelPoint = screenToModelPoint(point);
        const mx = modelPoint.x;
        const my = modelPoint.y;

        // 根据拖拽的目标点，逆推计算出三边最新物理长度
        if (activeVertex === 'A') {
            // A 点可自由拖动，重新计算边 b(AC) 和 边 c(AB)
            const newB = Math.hypot(mx - vertexC.x, my - vertexC.y) / scale;
            const newC = Math.hypot(mx - vertexB.x, my - vertexB.y) / scale;
            
            // 夹在滑块限制内
            sideB = Math.min(15, Math.max(3, newB));
            sideC = Math.min(20, Math.max(3, newC));
        } 
        else if (activeVertex === 'B') {
            // B 点只允许水平移动（受限于边a底线），重新计算边 a(BC) 与 边 c(AB)
            const newA = Math.hypot(mx - vertexC.x, vertexC.y - vertexC.y) / scale;
            const newC = Math.hypot(vertexA.x - mx, vertexA.y - vertexB.y) / scale;

            sideA = Math.min(15, Math.max(3, newA));
            sideC = Math.min(20, Math.max(3, newC));
        } 
        else if (activeVertex === 'C') {
            // C 点同理
            const newA = Math.hypot(vertexB.x - mx, vertexB.y - vertexB.y) / scale;
            const newB = Math.hypot(vertexA.x - mx, vertexA.y - vertexC.y) / scale;

            sideA = Math.min(15, Math.max(3, newA));
            sideB = Math.min(15, Math.max(3, newB));
        }

        shouldAutoFitModel = false;
        drawSandbox();
    };

    const handlePointerUp = (e) => {
        activePointers.delete(e.pointerId);
        if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
        }
        if (activePointers.size === 1 && activeCanvasGesture === "pinch") {
            const remaining = Array.from(activePointers.values())[0];
            activeCanvasGesture = "pan";
            panStart = {
                x: remaining.x,
                y: remaining.y,
                viewX: modelView.x,
                viewY: modelView.y
            };
            pinchStart = null;
            return;
        }
        activeVertex = null;
        activeCanvasGesture = null;
        panStart = null;
        pinchStart = null;
        isTouchManipulating = activePointers.size > 0;
        drawSandbox();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("selectstart", (e) => e.preventDefault());
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const point = getCanvasPoint(e);
        const factor = e.deltaY > 0 ? 0.92 : 1.08;
        zoomModelAt(point, modelView.zoom * factor);
    }, { passive: false });
}

// ==========================================================================
// 8. 辅助音频与页面加载初始化 (Web Audio & Initializer)
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playPerfectChord() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [329.63, 392.00, 523.25]; // E4, G4, C5 (C Major Chord)
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.07, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + idx * 0.05 + 0.2);
    });
}

function handleResize() {
    const rect = canvasContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    scale = Math.min(rect.width, rect.height) / 28;
    scheduleModelAutoFit();
    drawSandbox();
}
window.addEventListener("resize", handleResize);

function init() {
    const rect = canvasContainer.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    scale = Math.min(rect.width, rect.height) / 28;
    scheduleModelAutoFit();

    initCanvasDragEvents();

    const onRangeInput = () => {
        sideA = parseFloat(rangeA.value);
        sideB = parseFloat(rangeB.value);
        sideC = parseFloat(rangeC.value);
        activeChallengeKey = null;
        scheduleModelAutoFit();
        drawSandbox();
    };

    rangeA.addEventListener("input", onRangeInput);
    rangeB.addEventListener("input", onRangeInput);
    rangeC.addEventListener("input", onRangeInput);

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const a = parseFloat(btn.getAttribute("data-a"));
            const b = parseFloat(btn.getAttribute("data-b"));
            const c = parseFloat(btn.getAttribute("data-c"));
            activeChallengeKey = null;
            playClickSound();
            startTweenTo(a, b, c);
        });
    });

    document.querySelectorAll("[data-step-side]").forEach(btn => {
        btn.addEventListener("click", () => {
            playClickSound();
            adjustSide(btn.dataset.stepSide, parseFloat(btn.dataset.stepDelta));
        });
    });

    document.querySelectorAll("[data-task-preset]").forEach(btn => {
        btn.addEventListener("click", () => {
            playClickSound();
            const key = btn.dataset.taskPreset;
            if (key === "right") startTweenTo(6, 8, 10);
            if (key === "acute") startTweenTo(6, 8, 9.4);
            if (key === "obtuse") startTweenTo(6, 8, 10.7);
            if (key === "longest") startTweenTo(10, 6, 8);
        });
    });

    document.querySelectorAll("[data-challenge]").forEach(btn => {
        btn.addEventListener("click", () => {
            playClickSound();
            applyChallengePreset(btn.dataset.challenge);
        });
    });

    if (btnThresholdDemo) {
        btnThresholdDemo.addEventListener("click", () => {
            playClickSound();
            toggleThresholdDemo();
        });
    }

    if (btnThresholdStop) {
        btnThresholdStop.addEventListener("click", () => {
            playClickSound();
            stopThresholdDemo();
        });
    }

    if (btnResetView) {
        btnResetView.addEventListener("click", () => {
            playClickSound();
            resetModelView();
        });
    }

    document.querySelectorAll("[data-panel-tab]").forEach(btn => {
        btn.addEventListener("click", () => {
            playClickSound();
            setPanelTab(btn.dataset.panelTab);
        });
    });

    if (btnNewTraining) {
        btnNewTraining.addEventListener("click", () => {
            playClickSound();
            generateTrainingQuestion();
        });
    }

    document.querySelectorAll(".training-choice").forEach(btn => {
        btn.addEventListener("click", () => {
            playClickSound();
            submitTrainingAnswer(btn.dataset.answer, btn);
        });
    });

    document.addEventListener("contextmenu", (e) => {
        if (e.target.closest(".math-source-scene-j8b_m07, .math-source-panel-j8b_m07")) e.preventDefault();
    });
    document.addEventListener("selectstart", (e) => {
        if (e.target.closest(".math-source-scene-j8b_m07, .math-source-panel-j8b_m07")) e.preventDefault();
    });
    document.addEventListener("dragstart", (e) => {
        if (e.target.closest(".math-source-scene-j8b_m07, .math-source-panel-j8b_m07")) e.preventDefault();
    });

    btnShowHelp.addEventListener("click", () => {
        modalHelp.classList.add("active");
    });
    btnCloseHelp.addEventListener("click", () => {
        modalHelp.classList.remove("active");
    });

    document.getElementById("hud-toggle-btn").addEventListener("click", () => {
        const hud = document.getElementById("hud-chalkboard-panel");
        hud.classList.toggle("collapsed");
    });

    publishModelView();
    setPanelTab(activePanelTab);
    updateTrainingScore();
    drawSandbox();
}

document.addEventListener("DOMContentLoaded", init);

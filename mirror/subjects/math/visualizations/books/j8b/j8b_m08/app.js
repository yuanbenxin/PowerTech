/**
 * 平行四边形判定实验室 - 核心逻辑 (app.js)
 * 1. 探究模式管理：双模式切换（连杆剪切模式 vs 对角线剪刀模式）
 * 2. 几何数学引擎：
 *    - 连杆模式：利用圆与圆交点算法构建四杆机构，处理无法闭合的断裂状态
 *    - 对角线模式：利用对角线分段投影和夹角几何构建
 * 3. 几何判定器：实时利用向量叉乘、距离比对和中点重合度核对 5 大判定特征
 * 4. 顶点拖拽物理交互与一键注入
 */

// ==========================================================================
// 1. 全局状态与配置
// ==========================================================================
let currentMode = "linkage"; // "linkage" 或 "diagonals"

// Mode 1: 连杆模式变量
let sideAB = 6.0; // AB
let sideBC = 9.0; // BC
let sideCD = 6.0; // CD
let sideDA = 9.0; // DA
let shearingAngle = Math.PI * 0.35; // 连杆的剪切角 (AB 边与水平线的夹角，弧度)

// Mode 2: 对角线模式变量
let lenOA = 5.0;
let lenOC = 5.0;
let lenOB = 4.0;
let lenOD = 4.0;
let diagAngleDeg = 70; // 夹角 ∠AOB，度数

// 动画插值目标值
let targetLinkage = { ab: 6, bc: 9, cd: 6, da: 9, angle: Math.PI * 0.35 };
let targetDiagonals = { oa: 5, oc: 5, ob: 4, od: 4, angleDeg: 70 };
let isAnimating = false;

// 探究任务卡状态
let completedQuests = { 1: false, 2: false, 3: false };
let activeScenarioKey = "edge-equal";
let autoDemoTimer = null;
let autoDemoRunning = false;

const TOUCH_HIT_RADIUS = 24;

const annotationOptions = {
    showAngles: true,
    showDiagonals: true,
    showMarkers: true
};

const EVIDENCE_RULES = [
    {
        key: "parallelAll",
        name: "两组对边分别平行",
        formula: "AB // CD，AD // BC",
        proof: "因为 AB // CD，AD // BC，所以四边形 ABCD 是平行四边形。",
        hint: "画布上两组对边会出现同组平行箭头。"
    },
    {
        key: "eqSides",
        name: "两组对边分别相等",
        formula: "AB = CD，AD = BC",
        proof: "因为 AB = CD，AD = BC，所以四边形 ABCD 是平行四边形。",
        hint: "画布上两组对边会出现同组等长刻痕。"
    },
    {
        key: "oneParallelEqual",
        name: "一组对边平行且相等",
        formula: "AB // CD 且 AB = CD，或 AD // BC 且 AD = BC",
        proof: "因为一组对边平行且相等，所以四边形 ABCD 是平行四边形。",
        hint: "同一组对边同时出现平行箭头和等长刻痕时，已经足够判定。"
    },
    {
        key: "diagBisect",
        name: "对角线互相平分",
        formula: "OA = OC，OB = OD",
        proof: "因为 OA = OC，OB = OD，所以四边形 ABCD 是平行四边形。",
        hint: "交点 O 同时是两条对角线的中点。"
    }
];

const SCENARIO_PRESETS = {
    "edge-equal": {
        mode: "linkage",
        linkage: [6, 9, 6, 9],
        angle: Math.PI * 0.35,
        label: "两组对边相等",
        summary: "两组对边分别相等，可作为充分判定条件。"
    },
    "diagonal-bisect": {
        mode: "diagonals",
        diagonals: [5, 5, 4, 4, 70],
        label: "对角线互相平分",
        summary: "O 同时平分 AC 与 BD，可直接判定为平行四边形。"
    },
    "one-pair-equal": {
        mode: "linkage",
        linkage: [6, 9, 6, 7.2],
        angle: Math.PI * 0.38,
        label: "反例：只有一组对边相等",
        summary: "只有 AB = CD 不够，另一组边或平行关系不足时不能判定。"
    },
    "diagonal-not-bisect": {
        mode: "diagonals",
        diagonals: [6, 4, 5, 3, 70],
        label: "反例：对角线没有平分",
        summary: "对角线只是相交不够，必须互相平分才是充分条件。"
    }
};

// 交互拖拽
let activeVertex = null; // 'A', 'B', 'C', 'D'
let scale = 22.0; // 缩放比
let activeCanvasGesture = null; // "vertex" | "pan" | "pinch"
let panStart = null;
let pinchStart = null;
const activePointers = new Map();
const MODEL_VIEW_MIN_ZOOM = 0.55;
const MODEL_VIEW_MAX_ZOOM = 2.8;
let modelView = { x: 0, y: 0, zoom: 1 };

// 顶点屏幕坐标
let vertexA = { x: 0, y: 0 };
let vertexB = { x: 0, y: 0 };
let vertexC = { x: 0, y: 0 };
let vertexD = { x: 0, y: 0 };
let centerO = { x: 0, y: 0 }; // 对角线交点

// DOM 元素引用
const canvasContainer = document.querySelector(".canvas-container-wrapper");
const canvas = document.getElementById("geometry-canvas");
const ctx = canvas.getContext("2d");

// 连杆滑块
const rangeAB = document.getElementById("range-ab");
const rangeBC = document.getElementById("range-bc");
const rangeCD = document.getElementById("range-cd");
const rangeDA = document.getElementById("range-da");
const lblAB = document.getElementById("val-ab-lbl");
const lblBC = document.getElementById("val-bc-lbl");
const lblCD = document.getElementById("val-cd-lbl");
const lblDA = document.getElementById("val-da-lbl");

// 对角线滑块
const rangeOA = document.getElementById("range-oa");
const rangeOC = document.getElementById("range-oc");
const rangeOB = document.getElementById("range-ob");
const rangeOD = document.getElementById("range-od");
const rangeAngle = document.getElementById("range-angle");
const lblOA = document.getElementById("val-oa-lbl");
const lblOC = document.getElementById("val-oc-lbl");
const lblOB = document.getElementById("val-ob-lbl");
const lblOD = document.getElementById("val-od-lbl");
const lblAngle = document.getElementById("val-angle-lbl");

// 状态大条
const statusHeader = document.getElementById("status-header-container");
const statusDot = document.getElementById("verdict-status-dot");
const statusText = document.getElementById("verdict-status-text");
const checklistBody = document.getElementById("checklist-hud-body");

const modalHelp = document.getElementById("modal-help");
const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const evidenceSummary = document.getElementById("evidence-summary");
const proofSentence = document.getElementById("proof-sentence");
const proofHint = document.getElementById("proof-hint");
const btnAutoDemo = document.getElementById("btn-auto-demo");

// ==========================================================================
// 2. 粒子成功特效系统
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
        const speed = Math.random() * 4 + 2.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 2 + 1;
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
        c.shadowBlur = 6;
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
    for (let i = 0; i < 30; i++) {
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
// 3. 几何构建引擎 (Geometry Engine)
// ==========================================================================
// 连杆合法性检查： longest side < sum of other three sides
function checkLinkageValidity(a, b, c, d) {
    const sides = [a, b, c, d];
    const maxVal = Math.max(...sides);
    const sumVal = sides.reduce((sum, val) => sum + val, 0) - maxVal;
    return maxVal < sumVal;
}

function computeVertices(W, H) {
    const rx = W / 2;
    const ry = H / 2;
    centerO.x = rx;
    centerO.y = ry;

    if (currentMode === "linkage") {
        // 连杆模式下，固定 A 点在左下方，DA (底边)水平横放
        // A 点在底线的左侧，D 点在底线的右侧
        const baseOffset = 50;
        vertexA.x = rx - (sideDA * scale) / 2;
        vertexA.y = ry + baseOffset;
        
        vertexD.x = rx + (sideDA * scale) / 2;
        vertexD.y = ry + baseOffset;

        const isValid = checkLinkageValidity(sideAB, sideBC, sideCD, sideDA);

        if (isValid) {
            // 计算 B 点屏幕坐标 (基于当前的剪切角 shearingAngle)
            vertexB.x = vertexA.x + sideAB * scale * Math.cos(shearingAngle);
            vertexB.y = vertexA.y - sideAB * scale * Math.sin(shearingAngle);

            // C 点为圆 B (半径 sideBC) 与 圆 D (半径 sideCD) 的交点
            const r1 = sideBC * scale;
            const r2 = sideCD * scale;
            
            const dx = vertexD.x - vertexB.x;
            const dy = vertexD.y - vertexB.y;
            const d = Math.hypot(dx, dy);

            if (d <= r1 + r2 && d >= Math.abs(r1 - r2)) {
                // 两圆有交点，选择上方/前方的交点
                const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
                const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

                // 连线方向单位向量
                const ux = dx / d;
                const uy = dy / d;
                
                // 垂直向量 (顺时针旋转90°指向下方，这里取负值指向上方)
                const vx = -uy;
                const vy = ux;

                // 求解 C 坐标
                vertexC.x = vertexB.x + a * ux - h * vx;
                vertexC.y = vertexB.y + a * uy - h * vy;
            } else {
                // 几何退化/拉伸过度：临时绘制成断裂线段
                vertexC.x = vertexD.x + Math.cos(Math.PI * 0.75) * r2;
                vertexC.y = vertexD.y - Math.sin(Math.PI * 0.75) * r2;
            }
        } else {
            // 完全非法状态下，连杆松散
            vertexB.x = vertexA.x + sideAB * scale * Math.cos(Math.PI * 0.75);
            vertexB.y = vertexA.y - sideAB * scale * Math.sin(Math.PI * 0.75);
            vertexC.x = vertexD.x + Math.cos(Math.PI * 0.25) * (sideCD * scale);
            vertexC.y = vertexD.y - Math.sin(Math.PI * 0.25) * (sideCD * scale);
        }
    } 
    else {
        // 对角线模式下，相交点 O 定位于画布中心
        const theta0 = -15 * Math.PI / 180; // 对角线 AC 的倾斜底角 (稍倾斜看起更自然)
        const alpha = diagAngleDeg * Math.PI / 180; // 夹角 ∠AOB

        // 求解对角线 AC 端点
        // A 点在左下方，C 点在右上方
        vertexA.x = rx - lenOA * scale * Math.cos(theta0);
        vertexA.y = ry - lenOA * scale * Math.sin(theta0);

        vertexC.x = rx + lenOC * scale * Math.cos(theta0);
        vertexC.y = ry + lenOC * scale * Math.sin(theta0);

        // 求解对角线 BD 端点
        // B 在右上方，D 在左下方
        vertexB.x = rx + lenOB * scale * Math.cos(theta0 + alpha);
        vertexB.y = ry + lenOB * scale * Math.sin(theta0 + alpha);

        vertexD.x = rx - lenOD * scale * Math.cos(theta0 + alpha);
        vertexD.y = ry - lenOD * scale * Math.sin(theta0 + alpha);
    }
}

function clampModelZoom(value) {
    return Math.max(MODEL_VIEW_MIN_ZOOM, Math.min(MODEL_VIEW_MAX_ZOOM, value));
}

function screenToModelPoint(x, y) {
    return {
        x: (x - modelView.x) / modelView.zoom,
        y: (y - modelView.y) / modelView.zoom
    };
}

function withModelView(drawFn) {
    ctx.save();
    ctx.translate(modelView.x, modelView.y);
    ctx.scale(modelView.zoom, modelView.zoom);
    drawFn();
    ctx.restore();
}

function publishModelView() {
    const snapshot = { ...modelView };
    window.__j8b_m08_modelView = snapshot;
    globalThis.__j8b_m08_modelView = snapshot;
}

function zoomModelAt(screenX, screenY, nextZoom) {
    const before = screenToModelPoint(screenX, screenY);
    modelView.zoom = clampModelZoom(nextZoom);
    modelView.x = screenX - before.x * modelView.zoom;
    modelView.y = screenY - before.y * modelView.zoom;
    publishModelView();
    drawSandbox();
}

function getPointerDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function getPointerCenter(a, b) {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
    };
}

function getActivePointerPair() {
    return Array.from(activePointers.values()).slice(0, 2);
}

function startPinchGesture() {
    const [first, second] = getActivePointerPair();
    if (!first || !second) return;
    activeCanvasGesture = "pinch";
    activeVertex = null;
    const center = getPointerCenter(first, second);
    pinchStart = {
        distance: Math.max(1, getPointerDistance(first, second)),
        center,
        view: { ...modelView },
        modelPoint: screenToModelPoint(center.x, center.y)
    };
}

function updatePinchGesture() {
    if (!pinchStart || activePointers.size < 2) return;
    const [first, second] = getActivePointerPair();
    if (!first || !second) return;

    const center = getPointerCenter(first, second);
    const distance = Math.max(1, getPointerDistance(first, second));
    modelView.zoom = clampModelZoom(pinchStart.view.zoom * (distance / pinchStart.distance));
    modelView.x = center.x - pinchStart.modelPoint.x * modelView.zoom;
    modelView.y = center.y - pinchStart.modelPoint.y * modelView.zoom;
    publishModelView();
    drawSandbox();
}

// 绘制数学本网格背景
function drawGridPaper(W, H) {
    ctx.save();
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(37, 99, 235, 0.12)";
    ctx.lineWidth = 1;

    // 对角线模式以交点 O 对齐；连杆模式以 A 点对齐
    const alignX = currentMode === "linkage" ? vertexA.x : centerO.x;
    const alignY = currentMode === "linkage" ? vertexA.y : centerO.y;

    const startX = alignX % scale;
    for (let x = startX; x < W; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }

    const startY = alignY % scale;
    for (let y = startY; y < H; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(14, 165, 233, 0.18)";
    const dotGap = Math.max(18, Math.round(scale / 1.4));
    const dotStartX = ((alignX % dotGap) + dotGap) % dotGap;
    const dotStartY = ((alignY % dotGap) + dotGap) % dotGap;
    for (let x = dotStartX; x < W; x += dotGap) {
        for (let y = dotStartY; y < H; y += dotGap) {
            ctx.beginPath();
            ctx.arc(x, y, 1.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

// ==========================================================================
// 4. 画布主渲染与判定器算法 (Chamber Render Loop)
// ==========================================================================
function drawSandbox() {
    const dpr = canvas.__dpr || window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    ctx.clearRect(0, 0, W, H);

    // 计算三维坐标以确保网格对齐
    computeVertices(W, H);
    publishModelView();

    // 1. 绘制网格
    drawGridPaper(W, H);

    // 2. 向量数学特征解算
    const dAB = Math.hypot(vertexB.x - vertexA.x, vertexB.y - vertexA.y) / scale;
    const dBC = Math.hypot(vertexC.x - vertexB.x, vertexC.y - vertexB.y) / scale;
    const dCD = Math.hypot(vertexD.x - vertexC.x, vertexD.y - vertexC.y) / scale;
    const dDA = Math.hypot(vertexA.x - vertexD.x, vertexA.y - vertexD.y) / scale;

    // 对边平行度检测：计算向量叉乘
    const vAB = { x: vertexB.x - vertexA.x, y: vertexB.y - vertexA.y };
    const vDC = { x: vertexC.x - vertexD.x, y: vertexC.y - vertexD.y };
    const vAD = { x: vertexD.x - vertexA.x, y: vertexD.y - vertexA.y };
    const vBC = { x: vertexC.x - vertexB.x, y: vertexC.y - vertexB.y };

    const lenAB = Math.hypot(vAB.x, vAB.y);
    const lenDC = Math.hypot(vDC.x, vDC.y);
    const lenAD = Math.hypot(vAD.x, vAD.y);
    const lenBC = Math.hypot(vBC.x, vBC.y);

    // 叉乘
    const cross_AB_CD = Math.abs(vAB.x * vDC.y - vAB.y * vDC.x) / (lenAB * lenDC || 1);
    const cross_AD_BC = Math.abs(vAD.x * vBC.y - vAD.y * vBC.x) / (lenAD * lenBC || 1);

    const isParallel_AB_CD = cross_AB_CD < 0.005;
    const isParallel_AD_BC = cross_AD_BC < 0.005;

    // 对角平分度检测 (O 到端点中点对齐度)
    // 算出 AC 的中点和 BD 的中点
    const midAC = { x: (vertexA.x + vertexC.x) / 2, y: (vertexA.y + vertexC.y) / 2 };
    const midBD = { x: (vertexB.x + vertexD.x) / 2, y: (vertexB.y + vertexD.y) / 2 };
    const midDist = Math.hypot(midAC.x - midBD.x, midAC.y - midBD.y) / scale;
    const isBisect = midDist < 0.05;

    // 是否满足四边形构造
    const isValid = currentMode === "linkage" 
        ? checkLinkageValidity(sideAB, sideBC, sideCD, sideDA)
        : true;

    // 3. 实时代数核对并渲染 HUD 面板
    const verdict = updateChecklistAndStatus(isValid, dAB, dBC, dCD, dDA, isParallel_AB_CD, isParallel_AD_BC, isBisect, midDist);

    withModelView(() => {
    // 4. 绘制对角线 (在对角线模式下突出绘制，连杆模式弱化虚线绘制)
    if (isValid) {
        ctx.save();
        if (currentMode === "diagonals" && annotationOptions.showDiagonals) {
            // 对角线 AC (紫色)
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#a855f7";
            ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(vertexA.x, vertexA.y); ctx.lineTo(vertexC.x, vertexC.y); ctx.stroke();
            ctx.restore();

            // 对角线 BD (青色)
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#14b8a6";
            ctx.strokeStyle = "rgba(20, 184, 166, 0.85)";
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(vertexB.x, vertexB.y); ctx.lineTo(vertexD.x, vertexD.y); ctx.stroke();
            ctx.restore();

            // 相交点 O 标记
            ctx.fillStyle = "#ffffff";
            ctx.beginPath(); ctx.arc(centerO.x, centerO.y, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#a855f7";
            ctx.font = "bold 12px var(--font-sans)";
            ctx.fillText("O", centerO.x - 4, centerO.y - 8);
        } else if (annotationOptions.showDiagonals) {
            // 连杆模式下画细虚线对角线作为参考辅助
            ctx.strokeStyle = "rgba(71, 85, 105, 0.28)";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(vertexA.x, vertexA.y); ctx.lineTo(vertexC.x, vertexC.y);
            ctx.moveTo(vertexB.x, vertexB.y); ctx.lineTo(vertexD.x, vertexD.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.restore();

        // 5. 绘制四边形轮廓
        ctx.save();
        ctx.lineWidth = 3.5;
        
        // 绘制填充色 (平行四边形达成时为淡绿色，一般四边形为淡蓝色)
        ctx.fillStyle = verdict.isParallelogram 
            ? "rgba(16, 185, 129, 0.08)" 
            : "rgba(59, 130, 246, 0.04)";
        ctx.beginPath();
        ctx.moveTo(vertexA.x, vertexA.y);
        ctx.lineTo(vertexB.x, vertexB.y);
        ctx.lineTo(vertexC.x, vertexC.y);
        ctx.lineTo(vertexD.x, vertexD.y);
        ctx.closePath();
        ctx.fill();

        // 视觉优化：状态感应霓虹发光外框
        if (verdict.isParallelogram) {
            ctx.save();
            ctx.lineWidth = 5;
            let glowColor = "#10b981"; // 平行四边形 (翡翠绿)
            
            // 获取特殊形状状态以匹配对应颜色
            const specialBadge = document.querySelector(".hud-badge-card");
            if (specialBadge) {
                const text = specialBadge.innerText;
                if (text.includes("正方形")) {
                    glowColor = "#eab308"; // 正方形 (金色)
                } else if (text.includes("菱形")) {
                    glowColor = "#14b8a6"; // 菱形 (青色)
                } else if (text.includes("矩形")) {
                    glowColor = "#f43f5e"; // 矩形 (红色)
                }
            }
            
            ctx.strokeStyle = glowColor;
            ctx.shadowColor = glowColor;
            // 通过 performance.now() 实现平滑呼吸发光
            const pulse = 8 + 4 * Math.sin(performance.now() / 150);
            ctx.shadowBlur = pulse;
            
            ctx.beginPath();
            ctx.moveTo(vertexA.x, vertexA.y);
            ctx.lineTo(vertexB.x, vertexB.y);
            ctx.lineTo(vertexC.x, vertexC.y);
            ctx.lineTo(vertexD.x, vertexD.y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        // 边 AB (红色)
        ctx.strokeStyle = "#f43f5e";
        ctx.beginPath(); ctx.moveTo(vertexA.x, vertexA.y); ctx.lineTo(vertexB.x, vertexB.y); ctx.stroke();

        // 边 BC (蓝色)
        ctx.strokeStyle = "#3b82f6";
        ctx.beginPath(); ctx.moveTo(vertexB.x, vertexB.y); ctx.lineTo(vertexC.x, vertexC.y); ctx.stroke();

        // 边 CD (绿色)
        ctx.strokeStyle = "#10b981";
        ctx.beginPath(); ctx.moveTo(vertexC.x, vertexC.y); ctx.lineTo(vertexD.x, vertexD.y); ctx.stroke();

        // 边 DA (黄色)
        ctx.strokeStyle = "#eab308";
        ctx.beginPath(); ctx.moveTo(vertexD.x, vertexD.y); ctx.lineTo(vertexA.x, vertexA.y); ctx.stroke();
        ctx.restore();

        // 绘制夹角弧度 (仅对角线模式下标注夹角 ∠AOB)
        if (currentMode === "diagonals" && annotationOptions.showAngles) {
            drawAngleArc();
        }

        // 教学优化：绘制四个顶角角度标注
        if (annotationOptions.showAngles) {
            drawCornerAngle("A", vertexA, vertexB, vertexD);
            drawCornerAngle("B", vertexB, vertexC, vertexA);
            drawCornerAngle("C", vertexC, vertexD, vertexB);
            drawCornerAngle("D", vertexD, vertexA, vertexC);
        }

        // 教学优化：绘制平行与等长标注
        if (annotationOptions.showMarkers) {
            drawTextbookAnnotations(isParallel_AB_CD, isParallel_AD_BC, dAB, dBC, dCD, dDA);
        }

    } else {
        // 绘制无法闭合的红色裂开提示
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(244, 63, 94, 0.3)";
        ctx.beginPath();
        ctx.moveTo(vertexA.x, vertexA.y);
        ctx.lineTo(vertexB.x, vertexB.y);
        ctx.moveTo(vertexD.x, vertexD.y);
        ctx.lineTo(vertexC.x, vertexC.y);
        ctx.stroke();

        // 底部水平边仍实线画
        ctx.strokeStyle = "#eab308";
        ctx.beginPath(); ctx.moveTo(vertexA.x, vertexA.y); ctx.lineTo(vertexD.x, vertexD.y); ctx.stroke();

        // 顶底断开提示
        ctx.strokeStyle = "#f43f5e";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(vertexB.x, vertexB.y);
        ctx.lineTo(vertexC.x, vertexC.y);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 15px var(--font-sans)";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ 连杆过短，无法闭合四边形", W / 2, ry - 30);
    }

    // 6. 绘制顶点
    drawVertexNode("A", vertexA);
    drawVertexNode("B", vertexB);
    drawVertexNode("C", vertexC);
    drawVertexNode("D", vertexD);
    });
}

function drawVertexNode(label, pos) {
    let color = "#3b82f6";
    if (label === "A") color = "#f43f5e";
    else if (label === "B") color = "#3b82f6";
    else if (label === "C") color = "#10b981";
    else if (label === "D") color = "#eab308";

    const isActive = (activeVertex === label);
    const outerRad = isActive ? 12 : 9;
    const innerRad = isActive ? 5.5 : 4.5;

    ctx.save();
    // 1. 外层半透光光晕环 (Translucent Outer Glow Ring)
    ctx.shadowBlur = isActive ? 12 : 6;
    ctx.shadowColor = color;
    ctx.fillStyle = color + "40"; // 25% 不透明度
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, outerRad, 0, Math.PI * 2);
    ctx.fill();

    // 2. 内层高亮白芯 (White Core)
    ctx.shadowBlur = isActive ? 10 : 4;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0b0f19";
    ctx.lineWidth = isActive ? 2.5 : 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, innerRad, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. 绘制字母标签 A, B, C, D
    ctx.save();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px var(--font-sans)";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 0;

    let ox = 0, oy = 0;
    if (label === "A") { ox = -14; oy = 14; }
    else if (label === "B") { ox = -14; oy = -10; }
    else if (label === "C") { ox = 12; oy = -10; }
    else { ox = 12; oy = 14; }

    ctx.strokeText(label, pos.x + ox, pos.y + oy);
    ctx.fillText(label, pos.x + ox, pos.y + oy);
    ctx.restore();
}

// 绘制 ∠AOB 的夹角弧度
function drawAngleArc() {
    const theta0 = -15 * Math.PI / 180;
    const alpha = diagAngleDeg * Math.PI / 180;
    ctx.save();
    ctx.strokeStyle = "rgba(51, 65, 85, 0.46)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    // 绘制以 O 为圆心的夹角弧度，B 侧弧度为 theta0+alpha， A 侧弧度为 theta0+Math.PI
    const startRad = theta0 + alpha;
    const endRad = theta0 + Math.PI;
    ctx.arc(centerO.x, centerO.y, 25, Math.min(startRad, endRad), Math.max(startRad, endRad));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

// 教学优化：绘制平行四边形四个顶角的角度数值及刻度
function drawCornerAngle(label, pA, pPrev, pNext) {
    const vPrev = { x: pPrev.x - pA.x, y: pPrev.y - pA.y };
    const vNext = { x: pNext.x - pA.x, y: pNext.y - pA.y };
    const lenPrev = Math.hypot(vPrev.x, vPrev.y);
    const lenNext = Math.hypot(vNext.x, vNext.y);
    if (lenPrev < 5 || lenNext < 5) return;

    const uPrev = { x: vPrev.x / lenPrev, y: vPrev.y / lenPrev };
    const uNext = { x: vNext.x / lenNext, y: vNext.y / lenNext };

    const cosAngle = Math.max(-1, Math.min(1, (uPrev.x * uNext.x + uPrev.y * uNext.y)));
    const angleRad = Math.acos(cosAngle);
    const angleDeg = angleRad * 180 / Math.PI;

    let bisectX = uPrev.x + uNext.x;
    let bisectY = uPrev.y + uNext.y;
    let lenB = Math.hypot(bisectX, bisectY);
    if (lenB < 0.01) {
        bisectX = -uPrev.y;
        bisectY = uPrev.x;
        lenB = 1;
    }
    const bx = bisectX / lenB;
    const by = bisectY / lenB;

    ctx.save();
    // 画一个小弧度
    ctx.strokeStyle = "rgba(51, 65, 85, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const startAngle = Math.atan2(uPrev.y, uPrev.x);
    const endAngle = Math.atan2(uNext.y, uNext.x);
    let diff = endAngle - startAngle;
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    
    if (diff > 0) {
        ctx.arc(pA.x, pA.y, 14, startAngle, endAngle);
    } else {
        ctx.arc(pA.x, pA.y, 14, endAngle, startAngle);
    }
    ctx.stroke();

    // 绘制角度文字
    const tx = pA.x + 26 * bx;
    const ty = pA.y + 26 * by;

    let color = "rgba(51, 65, 85, 0.72)";
    if (label === "A" || label === "C") {
        color = "#1e293b";
    } else {
        color = "#334155";
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 3;
    ctx.font = "9px var(--font-math)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(`${Math.round(angleDeg)}°`, tx, ty);
    ctx.fillText(`${Math.round(angleDeg)}°`, tx, ty);
    ctx.restore();
}

// 教学优化：绘制教科书级平行箭头和等长刻度线
function drawTextbookAnnotations(isParallel_AB, isParallel_AD, dAB, dBC, dCD, dDA) {
    if (Math.abs(dAB - dCD) < 0.05) {
        drawTickMarks(vertexA, vertexB, 1);
        drawTickMarks(vertexD, vertexC, 1);
    }
    if (Math.abs(dBC - dDA) < 0.05) {
        drawTickMarks(vertexB, vertexC, 2);
        drawTickMarks(vertexA, vertexD, 2);
    }

    if (isParallel_AB) {
        drawParallelArrow(vertexA, vertexB, 1);
        drawParallelArrow(vertexD, vertexC, 1);
    }
    if (isParallel_AD) {
        drawParallelArrow(vertexA, vertexD, 2);
        drawParallelArrow(vertexB, vertexC, 2);
    }

    if (currentMode === "diagonals" && Math.abs(diagAngleDeg - 90) < 0.5) {
        drawCenterRightAngle();
    }
}

function drawParallelArrow(p1, p2, num) {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 10) return;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.2;

    const size = 5.5;
    const drawArrowhead = (cx, cy) => {
        ctx.beginPath();
        ctx.moveTo(cx + size * ux, cy + size * uy);
        ctx.lineTo(cx - size * ux + size * 0.8 * nx, cy - size * uy + size * 0.8 * ny);
        ctx.lineTo(cx - size * 0.4 * ux, cy - size * 0.4 * uy);
        ctx.lineTo(cx - size * ux - size * 0.8 * nx, cy - size * uy - size * 0.8 * ny);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    if (num === 1) {
        drawArrowhead(mx, my);
    } else {
        drawArrowhead(mx - 4 * ux, my - 4 * uy);
        drawArrowhead(mx + 4 * ux, my + 4 * uy);
    }
    ctx.restore();
}

function drawTickMarks(p1, p2, num) {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 10) return;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    ctx.save();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 2;
    ctx.shadowColor = "rgba(255,255,255,0.9)";

    const tLen = 4.5;
    if (num === 1) {
        ctx.beginPath();
        ctx.moveTo(mx - tLen * nx, my - tLen * ny);
        ctx.lineTo(mx + tLen * nx, my + tLen * ny);
        ctx.stroke();
    } else {
        const m1x = mx - 2.5 * ux;
        const m1y = my - 2.5 * uy;
        const m2x = mx + 2.5 * ux;
        const m2y = my + 2.5 * uy;

        ctx.beginPath();
        ctx.moveTo(m1x - tLen * nx, m1y - tLen * ny);
        ctx.lineTo(m1x + tLen * nx, m1y + tLen * ny);
        ctx.moveTo(m2x - tLen * nx, m2y - tLen * ny);
        ctx.lineTo(m2x + tLen * nx, m2y + tLen * ny);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCenterRightAngle() {
    const theta0 = -15 * Math.PI / 180;
    const alpha = diagAngleDeg * Math.PI / 180;
    
    const uAC = { x: Math.cos(theta0), y: Math.sin(theta0) };
    const uBD = { x: Math.cos(theta0 + alpha), y: Math.sin(theta0 + alpha) };

    const size = 9;
    const p1 = { x: centerO.x + size * uAC.x, y: centerO.y + size * uAC.y };
    const p2 = { x: centerO.x + size * uBD.x, y: centerO.y + size * uBD.y };
    const p3 = { x: centerO.x + size * uAC.x + size * uBD.x, y: centerO.y + size * uAC.y + size * uBD.y };

    ctx.save();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
}

function getActiveEvidenceRules(evidence) {
    return EVIDENCE_RULES.filter(rule => evidence[rule.key]);
}

function getPrimaryEvidenceRule(evidence) {
    const preferredByScenario = {
        "edge-equal": "eqSides",
        "diagonal-bisect": "diagBisect"
    };
    const preferredKey = preferredByScenario[activeScenarioKey] || (currentMode === "diagonals" ? "diagBisect" : null);
    if (preferredKey && evidence[preferredKey]) {
        return EVIDENCE_RULES.find(rule => rule.key === preferredKey) || null;
    }
    const activeRules = getActiveEvidenceRules(evidence);
    return activeRules[0] || null;
}

function renderEvidenceChain(evidence, specialBadgeHTML) {
    const primary = getPrimaryEvidenceRule(evidence);
    checklistBody.innerHTML = EVIDENCE_RULES.map(rule => {
        const active = Boolean(evidence[rule.key]);
        const primaryClass = primary && primary.key === rule.key ? " primary-evidence" : "";
        return `
            <div class="checklist-item ${active ? 'active' : ''}${primaryClass}" data-evidence="${rule.key}">
                <div class="checker-light"></div>
                <div class="checklist-content">
                    <div class="checklist-name">${rule.name}</div>
                    <div class="checklist-math">${rule.formula}</div>
                    <div class="evidence-tag">${active ? rule.hint : '暂未形成充分证据'}</div>
                </div>
            </div>
        `;
    }).join("") + specialBadgeHTML;
}

function renderProofCoach(evidence, isValid, isParallelogram, shapeName, scenarioSummary) {
    if (!evidenceSummary || !proofSentence || !proofHint) return;

    const primary = getPrimaryEvidenceRule(evidence);
    if (!isValid) {
        evidenceSummary.textContent = "连杆长度无法闭合，先保证能构成四边形。";
        proofSentence.textContent = "当前不能构成四边形，不能判定为平行四边形。";
        proofHint.textContent = "调整任意一边，使最长边小于其余三边之和。";
        return;
    }

    if (isParallelogram && primary) {
        evidenceSummary.textContent = scenarioSummary || `当前证据：${primary.name}`;
        proofSentence.textContent = primary.proof;
        proofHint.textContent = `结论：四边形 ABCD 是${shapeName.replace(/\s*\([^)]*\)/g, "")}。`;
        return;
    }

    const missingHint = currentMode === "diagonals"
        ? "让 OA=OC 且 OB=OD，或切回连杆模式构造对边条件。"
        : "只有一组相等或一组平行都不够，至少形成一条充分判定。";
    evidenceSummary.textContent = scenarioSummary || "当前只有局部特征，还没有足够的判定证据。";
    proofSentence.textContent = "当前条件不足，不能判定为平行四边形。";
    proofHint.textContent = missingHint;
}

// ==========================================================================
// 5. HUD 判定指示灯逻辑 (Checklist Logic)
// ==========================================================================
function updateChecklistAndStatus(isValid, dAB, dBC, dCD, dDA, isParallel_AB_CD, isParallel_AD_BC, isBisect, midDist) {
    // 1. 同步输入数值显示
    if (currentMode === "linkage") {
        lblAB.innerHTML = sideAB.toFixed(1);
        lblBC.innerHTML = sideBC.toFixed(1);
        lblCD.innerHTML = sideCD.toFixed(1);
        lblDA.innerHTML = sideDA.toFixed(1);
        if (!isAnimating) {
            rangeAB.value = sideAB;
            rangeBC.value = sideBC;
            rangeCD.value = sideCD;
            rangeDA.value = sideDA;
        }
    } else {
        lblOA.innerHTML = lenOA.toFixed(1);
        lblOC.innerHTML = lenOC.toFixed(1);
        lblOB.innerHTML = lenOB.toFixed(1);
        lblOD.innerHTML = lenOD.toFixed(1);
        lblAngle.innerHTML = diagAngleDeg + "°";
        if (!isAnimating) {
            rangeOA.value = lenOA;
            rangeOC.value = lenOC;
            rangeOB.value = lenOB;
            rangeOD.value = lenOD;
            rangeAngle.value = diagAngleDeg;
        }
    }

    if (!isValid) {
        statusHeader.className = "chamber-status-header error";
        statusText.innerHTML = "❌ 无法构成四边形！任意一边的长度必须小于其余三边之和。";
        const invalidEvidence = { parallelAll: false, eqSides: false, oneParallelEqual: false, diagBisect: false };
        checklistBody.innerHTML = `
            <div class="checklist-item">
                <div class="checker-light"></div>
                <div class="checklist-content">
                    <div class="checklist-name">连杆闭合定理不成立</div>
                    <div class="checklist-math">${sideAB.toFixed(1)} + ${sideBC.toFixed(1)} + ${sideCD.toFixed(1)} &le; ${sideDA.toFixed(1)}</div>
                </div>
            </div>
        `;
        renderProofCoach(invalidEvidence, false, false, "一般四边形", SCENARIO_PRESETS[activeScenarioKey]?.summary);
        return { isParallelogram: false };
    }

    // 2. 五大判定特征核对
    const eqSides = Math.abs(dAB - dCD) < 0.05 && Math.abs(dBC - dDA) < 0.05;
    const parallelAll = isParallel_AB_CD && isParallel_AD_BC;
    const oneParallelEqual = (isParallel_AB_CD && Math.abs(dAB - dCD) < 0.05) || (isParallel_AD_BC && Math.abs(dBC - dDA) < 0.05);
    const diagBisect = isBisect;
    const evidence = { parallelAll, eqSides, oneParallelEqual, diagBisect };

    // 是否满足平行四边形 (任意一个判定定理满足即可)
    const isParallelogram = parallelAll || eqSides || oneParallelEqual || diagBisect;

    // 特殊形状判断
    let shapeName = "一般四边形";
    let isSpecial = false;
    let specialBadgeHTML = "";

    if (isParallelogram) {
        // 对角线相等 -> 矩形 (矩形判定：对角线相等且是平行四边形)
        const totalAC = lenOA + lenOC;
        const totalBD = lenOB + lenOD;
        const eqDiag = Math.abs(totalAC - totalBD) < 0.08 || currentMode === "linkage" && Math.abs(Math.hypot(vertexC.x - vertexA.x, vertexC.y - vertexA.y) - Math.hypot(vertexD.x - vertexB.x, vertexD.y - vertexB.y)) < 2;

        // 对角线垂直 -> 菱形
        const isPerp = Math.abs(diagAngleDeg - 90) < 1 || currentMode === "linkage" && Math.abs((vertexC.x - vertexA.x) * (vertexD.x - vertexB.x) + (vertexC.y - vertexA.y) * (vertexD.y - vertexB.y)) < 100;

        if (eqDiag && isPerp) {
            shapeName = "正方形";
            isSpecial = true;
            specialBadgeHTML = `<div class="special-verdict-box"><span class="tip-icon">★</span><span class="special-verdict-title">拓展发现：对角线相等且互相垂直的平行四边形是正方形。</span></div>`;
        } else if (eqDiag) {
            shapeName = "矩形";
            isSpecial = true;
            specialBadgeHTML = `<div class="special-verdict-box"><span class="tip-icon">拓展</span><span class="special-verdict-title">对角线相等的平行四边形是矩形。</span></div>`;
        } else if (isPerp) {
            shapeName = "菱形";
            isSpecial = true;
            specialBadgeHTML = `<div class="special-verdict-box"><span class="tip-icon">拓展</span><span class="special-verdict-title">对角线互相垂直的平行四边形是菱形。</span></div>`;
        } else {
            shapeName = "平行四边形";
        }
    }

    // 3. 更新状态大条
    if (isParallelogram) {
        statusHeader.className = isSpecial ? "chamber-status-header special" : "chamber-status-header success";
        statusText.innerHTML = `✨ 判定结论：<strong>${shapeName}</strong>`;
        
        // 成功时在交点爆开粒子
        if (btnShowHelp.getAttribute("data-success-sparked") !== "true") {
            const rect = canvas.getBoundingClientRect();
            const px = rect.left + (vertexA.x + vertexB.x + vertexC.x + vertexD.x) / 4;
            const py = rect.top + (vertexA.y + vertexB.y + vertexC.y + vertexD.y) / 4;
            triggerSuccessSparks(px, py, isSpecial ? "#f59e0b" : "#10b981");
            playSuccessChord();
            btnShowHelp.setAttribute("data-success-sparked", "true");
        }
    } else {
        statusHeader.className = "chamber-status-header";
        statusText.innerHTML = `🔷 当前形状：${shapeName} (不满足平行四边形判定条件)`;
        btnShowHelp.setAttribute("data-success-sparked", "false");
    }

    // 4. 渲染 HUD 证据链与右侧证明句式
    renderEvidenceChain(evidence, specialBadgeHTML);
    renderProofCoach(evidence, true, isParallelogram, shapeName, SCENARIO_PRESETS[activeScenarioKey]?.summary);

    if (isSpecial) {
        setTimeout(() => {
            checklistBody.scrollTop = checklistBody.scrollHeight;
        }, 0);
    }

    checkQuestCompletion(isParallelogram, eqSides, diagBisect, shapeName);

    return { isParallelogram, evidence, shapeName };
}

// 教学优化：探究任务系统状态核对与判定
function checkQuestCompletion(isParallelogram, eqSides, diagBisect, shapeName) {
    // 任务一：两组对边相等且为平行四边形
    if (currentMode === "linkage" && eqSides && isParallelogram) {
        if (!completedQuests[1]) {
            completedQuests[1] = true;
            markQuestCompleted(1);
        }
    }
    
    // 任务二：对角线模式下，对角线平分且为平行四边形
    if (currentMode === "diagonals" && diagBisect && isParallelogram) {
        if (!completedQuests[2]) {
            completedQuests[2] = true;
            markQuestCompleted(2);
        }
    }

    // 任务三：正方形达成
    if (currentMode === "diagonals" && shapeName.includes("正方形")) {
        if (!completedQuests[3]) {
            completedQuests[3] = true;
            markQuestCompleted(3);
        }
    }
}

function markQuestCompleted(id) {
    const card = document.getElementById(`quest-card-${id}`);
    if (card) {
        card.classList.add("completed");
        card.classList.remove("active-quest");
        const badge = card.querySelector(".quest-status-badge");
        if (badge) badge.innerHTML = "🏆 已完成";
        
        // 播放成功特效！
        const rect = canvas.getBoundingClientRect();
        const px = rect.left + rect.width / 2;
        const py = rect.top + rect.height / 2;
        triggerSuccessSparks(px, py, "#10b981");
        playSuccessChord();
    }
}

function setActiveQuestVisual(id) {
    document.querySelectorAll(".quest-card").forEach(card => card.classList.remove("active-quest"));
    const card = document.getElementById(`quest-card-${id}`);
    if (card) {
        card.classList.add("active-quest");
        const badge = card.querySelector(".quest-status-badge");
        if (badge && !completedQuests[id]) {
            badge.innerHTML = "进行中";
        }
    }
}

// ==========================================================================
// 6. 三边平滑变动插值动画 (Morph Animation)
// ==========================================================================
function updateTweenAnimation() {
    if (!isAnimating) return;

    const ease = 0.15;
    if (currentMode === "linkage") {
        let distAB = targetLinkage.ab - sideAB;
        let distBC = targetLinkage.bc - sideBC;
        let distCD = targetLinkage.cd - sideCD;
        let distDA = targetLinkage.da - sideDA;
        let distAngle = targetLinkage.angle - shearingAngle;

        if (Math.abs(distAB) < 0.01 && Math.abs(distBC) < 0.01 && Math.abs(distCD) < 0.01 && Math.abs(distDA) < 0.01 && Math.abs(distAngle) < 0.002) {
            sideAB = targetLinkage.ab;
            sideBC = targetLinkage.bc;
            sideCD = targetLinkage.cd;
            sideDA = targetLinkage.da;
            shearingAngle = targetLinkage.angle;
            isAnimating = false;
        } else {
            sideAB += distAB * ease;
            sideBC += distBC * ease;
            sideCD += distCD * ease;
            sideDA += distDA * ease;
            shearingAngle += distAngle * ease;
        }
    } else {
        let distOA = targetDiagonals.oa - lenOA;
        let distOC = targetDiagonals.oc - lenOC;
        let distOB = targetDiagonals.ob - lenOB;
        let distOD = targetDiagonals.od - lenOD;
        let distAng = targetDiagonals.angleDeg - diagAngleDeg;

        if (Math.abs(distOA) < 0.01 && Math.abs(distOC) < 0.01 && Math.abs(distOB) < 0.01 && Math.abs(distOD) < 0.01 && Math.abs(distAng) < 0.1) {
            lenOA = targetDiagonals.oa;
            lenOC = targetDiagonals.oc;
            lenOB = targetDiagonals.ob;
            lenOD = targetDiagonals.od;
            diagAngleDeg = targetDiagonals.angleDeg;
            isAnimating = false;
        } else {
            lenOA += distOA * ease;
            lenOC += distOC * ease;
            lenOB += distOB * ease;
            lenOD += distOD * ease;
            diagAngleDeg += distAng * ease;
        }
    }

    drawSandbox();

    if (isAnimating) {
        requestAnimationFrame(updateTweenAnimation);
    }
}

function startTweenToLinkage(ab, bc, cd, da, angle = shearingAngle) {
    targetLinkage.ab = ab;
    targetLinkage.bc = bc;
    targetLinkage.cd = cd;
    targetLinkage.da = da;
    targetLinkage.angle = angle;
    if (!isAnimating) {
        isAnimating = true;
        updateTweenAnimation();
    }
}

function startTweenToDiagonals(oa, oc, ob, od, ang) {
    targetDiagonals.oa = oa;
    targetDiagonals.oc = oc;
    targetDiagonals.ob = ob;
    targetDiagonals.od = od;
    targetDiagonals.angleDeg = ang;
    if (!isAnimating) {
        isAnimating = true;
        updateTweenAnimation();
    }
}

// ==========================================================================
// 7. 手动拖拽几何顶点逆推 (Drag Vertices Solver)
// ==========================================================================
function initCanvasDragEvents() {
    const toCanvasPoint = (e) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const findHitVertex = (point) => {
        const detectRadius = Math.max(12, TOUCH_HIT_RADIUS / modelView.zoom);
        if (Math.hypot(point.x - vertexA.x, point.y - vertexA.y) < detectRadius) return "A";
        if (Math.hypot(point.x - vertexB.x, point.y - vertexB.y) < detectRadius) return "B";
        if (Math.hypot(point.x - vertexC.x, point.y - vertexC.y) < detectRadius) return "C";
        if (Math.hypot(point.x - vertexD.x, point.y - vertexD.y) < detectRadius) return "D";
        return null;
    };

    const releasePointer = (pointerId) => {
        if (canvas.hasPointerCapture?.(pointerId)) {
            canvas.releasePointerCapture(pointerId);
        }
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        const point = toCanvasPoint(e);
        activePointers.set(e.pointerId, point);
        canvas.setPointerCapture(e.pointerId);

        if (activePointers.size >= 2) {
            startPinchGesture();
            return;
        }

        const modelPoint = screenToModelPoint(point.x, point.y);
        activeVertex = findHitVertex(modelPoint);
        if (activeVertex) {
            activeCanvasGesture = "vertex";
            panStart = null;
            return;
        }

        activeCanvasGesture = "pan";
        panStart = { x: point.x, y: point.y };
    };

    const handlePointerMove = (e) => {
        if (!activePointers.has(e.pointerId)) return;
        e.preventDefault();
        const point = toCanvasPoint(e);
        activePointers.set(e.pointerId, point);

        if (activePointers.size >= 2) {
            if (activeCanvasGesture !== "pinch") {
                startPinchGesture();
            }
            updatePinchGesture();
            return;
        }

        if (activeCanvasGesture === "pan" && panStart) {
            modelView.x += point.x - panStart.x;
            modelView.y += point.y - panStart.y;
            panStart = { x: point.x, y: point.y };
            publishModelView();
            drawSandbox();
            return;
        }

        if (activeCanvasGesture !== "vertex" || !activeVertex) return;
        const modelPoint = screenToModelPoint(point.x, point.y);
        const mx = modelPoint.x;
        const my = modelPoint.y;

        if (currentMode === "linkage") {
            // 连杆模式下，拖动顶点主要是拖拽角度 shearingAngle
            if (activeVertex === 'B') {
                const angle = Math.atan2(vertexA.y - my, mx - vertexA.x);
                shearingAngle = Math.min(Math.PI * 0.85, Math.max(Math.PI * 0.15, angle));
            } 
            else if (activeVertex === 'C') {
                // 拖动 C 时重新计算角度
                const angle = Math.atan2(vertexD.y - my, mx - vertexD.x);
                shearingAngle = Math.min(Math.PI * 0.85, Math.max(Math.PI * 0.15, angle));
            }
        } 
        else {
            // 对角线模式下，拖拽顶点不仅更新分段长度，还能拖拽夹角 diagAngleDeg
            const dx = mx - centerO.x;
            const dy = my - centerO.y;
            const dist = Math.hypot(dx, dy) / scale;

            if (activeVertex === 'A') {
                lenOA = Math.min(10, Math.max(2, dist));
            } else if (activeVertex === 'C') {
                lenOC = Math.min(10, Math.max(2, dist));
            } else if (activeVertex === 'B') {
                lenOB = Math.min(10, Math.max(2, dist));
                // 同时旋转夹角
                const theta0 = -15 * Math.PI / 180;
                let angle = Math.atan2(dy, dx) - theta0;
                if (angle < 0) angle += Math.PI * 2;
                if (angle > Math.PI) angle -= Math.PI; // 限制在半圆
                diagAngleDeg = Math.min(150, Math.max(30, Math.round(angle * 180 / Math.PI)));
            } else if (activeVertex === 'D') {
                lenOD = Math.min(10, Math.max(2, dist));
                const theta0 = -15 * Math.PI / 180;
                let angle = Math.atan2(-dy, -dx) - theta0;
                if (angle < 0) angle += Math.PI * 2;
                if (angle > Math.PI) angle -= Math.PI;
                diagAngleDeg = Math.min(150, Math.max(30, Math.round(angle * 180 / Math.PI)));
            }
        }

        drawSandbox();
    };

    const handlePointerUp = (e) => {
        if (!activePointers.has(e.pointerId)) return;
        e.preventDefault();
        activePointers.delete(e.pointerId);
        releasePointer(e.pointerId);

        if (activePointers.size === 0) {
            activeVertex = null;
            activeCanvasGesture = null;
            panStart = null;
            pinchStart = null;
            return;
        }

        if (activeCanvasGesture === "pinch" && activePointers.size === 1) {
            const remaining = Array.from(activePointers.values())[0];
            activeCanvasGesture = "pan";
            panStart = { x: remaining.x, y: remaining.y };
            pinchStart = null;
            activeVertex = null;
        }
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const point = toCanvasPoint(e);
        const modeMultiplier = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 120 : 1;
        const zoomFactor = Math.exp(-e.deltaY * modeMultiplier * 0.0015);
        zoomModelAt(point.x, point.y, modelView.zoom * zoomFactor);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("lostpointercapture", handlePointerUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
}

// ==========================================================================
// 8. 辅助音频与页面初始化 (Web Audio & Initializer)
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playSuccessChord() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (C Major Chord)
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.06, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + idx * 0.06 + 0.25);
    });
}

function handleResize() {
    const rect = canvasContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.__dpr = dpr;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    scale = Math.min(rect.width, rect.height) / 24;
    drawSandbox();
}
window.addEventListener("resize", handleResize);

function switchMode(mode) {
    const tabLinkage = document.getElementById("tab-linkage");
    const tabDiagonals = document.getElementById("tab-diagonals");
    const btnPanelLinkage = document.getElementById("btn-mode-linkage-panel");
    const btnPanelDiagonals = document.getElementById("btn-mode-diagonals-panel");
    const panelLinkage = document.getElementById("panel-linkage-controls");
    const panelDiagonals = document.getElementById("panel-diagonals-controls");
    const tipDesc = document.getElementById("tip-desc-mode");

    currentMode = mode;
    const isLinkage = mode === "linkage";
    tabLinkage?.classList.toggle("active", isLinkage);
    tabDiagonals?.classList.toggle("active", !isLinkage);
    btnPanelLinkage?.classList.toggle("active", isLinkage);
    btnPanelDiagonals?.classList.toggle("active", !isLinkage);
    panelLinkage?.classList.toggle("hidden", !isLinkage);
    panelDiagonals?.classList.toggle("hidden", isLinkage);
    if (tipDesc) {
        tipDesc.innerHTML = isLinkage
            ? "拖拽顶点 B 或 C 改变倾斜角，观察对边相等和平行如何一起出现。"
            : "拖拽对角线端点，观察 O 是否同时成为两条对角线的中点。";
    }
}

function syncScenarioButtons() {
    document.querySelectorAll(".btn-scenario").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-scenario") === activeScenarioKey);
    });
}

function applyScenarioPreset(key) {
    const preset = SCENARIO_PRESETS[key];
    if (!preset) return;
    activeScenarioKey = key;
    syncScenarioButtons();
    switchMode(preset.mode);
    playClickSound();

    if (preset.mode === "linkage") {
        const [ab, bc, cd, da] = preset.linkage;
        startTweenToLinkage(ab, bc, cd, da, preset.angle);
    } else {
        const [oa, oc, ob, od, angle] = preset.diagonals;
        startTweenToDiagonals(oa, oc, ob, od, angle);
    }
}

function syncAnnotationControls() {
    const bind = (id, key) => {
        const checkbox = document.getElementById(id);
        if (!checkbox) return;
        checkbox.checked = annotationOptions[key];
        checkbox.addEventListener("change", () => {
            annotationOptions[key] = checkbox.checked;
            drawSandbox();
        });
    };
    bind("chk-show-angles", "showAngles");
    bind("chk-show-diagonals", "showDiagonals");
    bind("chk-show-markers", "showMarkers");
}

function runAutoDemo() {
    if (autoDemoRunning) return;
    const steps = ["one-pair-equal", "edge-equal", "diagonal-not-bisect", "diagonal-bisect"];
    let index = 0;
    autoDemoRunning = true;
    btnAutoDemo?.classList.add("is-running");
    if (btnAutoDemo) btnAutoDemo.textContent = "演示中...";

    const next = () => {
        if (index >= steps.length) {
            autoDemoRunning = false;
            btnAutoDemo?.classList.remove("is-running");
            if (btnAutoDemo) btnAutoDemo.textContent = "演示判定过程";
            autoDemoTimer = null;
            return;
        }
        applyScenarioPreset(steps[index]);
        index += 1;
        autoDemoTimer = setTimeout(next, 1800);
    };
    next();
}

function init() {
    // 模式 Tab 切换
    const tabLinkage = document.getElementById("tab-linkage");
    const tabDiagonals = document.getElementById("tab-diagonals");
    const panelLinkage = document.getElementById("panel-linkage-controls");
    const panelDiagonals = document.getElementById("panel-diagonals-controls");
    const tipDesc = document.getElementById("tip-desc-mode");

    tabLinkage.addEventListener("click", () => {
        if (currentMode === "linkage") return;
        switchMode("linkage");
        playClickSound();
        drawSandbox();
    });

    tabDiagonals.addEventListener("click", () => {
        if (currentMode === "diagonals") return;
        switchMode("diagonals");
        playClickSound();
        drawSandbox();
    });

    document.getElementById("btn-mode-linkage-panel")?.addEventListener("click", () => {
        if (currentMode === "linkage") return;
        switchMode("linkage");
        playClickSound();
        drawSandbox();
    });

    document.getElementById("btn-mode-diagonals-panel")?.addEventListener("click", () => {
        if (currentMode === "diagonals") return;
        switchMode("diagonals");
        playClickSound();
        drawSandbox();
    });

    // 绑定连杆滑块
    const onLinkageInput = () => {
        sideAB = parseFloat(rangeAB.value);
        sideBC = parseFloat(rangeBC.value);
        sideCD = parseFloat(rangeCD.value);
        sideDA = parseFloat(rangeDA.value);
        drawSandbox();
    };
    rangeAB.addEventListener("input", onLinkageInput);
    rangeBC.addEventListener("input", onLinkageInput);
    rangeCD.addEventListener("input", onLinkageInput);
    rangeDA.addEventListener("input", onLinkageInput);

    // 绑定对角线滑块
    const onDiagonalsInput = () => {
        lenOA = parseFloat(rangeOA.value);
        lenOC = parseFloat(rangeOC.value);
        lenOB = parseFloat(rangeOB.value);
        lenOD = parseFloat(rangeOD.value);
        diagAngleDeg = parseInt(rangeAngle.value);
        drawSandbox();
    };
    rangeOA.addEventListener("input", onDiagonalsInput);
    rangeOC.addEventListener("input", onDiagonalsInput);
    rangeOB.addEventListener("input", onDiagonalsInput);
    rangeOD.addEventListener("input", onDiagonalsInput);
    rangeAngle.addEventListener("input", onDiagonalsInput);

    // 绑定一键预设按钮
    document.querySelectorAll(".btn-sub-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const ab = parseFloat(btn.getAttribute("data-ab"));
            const bc = parseFloat(btn.getAttribute("data-bc"));
            const cd = parseFloat(btn.getAttribute("data-cd"));
            const da = parseFloat(btn.getAttribute("data-da"));
            playClickSound();
            activeScenarioKey = "edge-equal";
            syncScenarioButtons();
            startTweenToLinkage(ab, bc, cd, da);
        });
    });

    document.querySelectorAll(".btn-sub-preset-diag").forEach(btn => {
        btn.addEventListener("click", () => {
            const oa = parseFloat(btn.getAttribute("data-oa"));
            const oc = parseFloat(btn.getAttribute("data-oc"));
            const ob = parseFloat(btn.getAttribute("data-ob"));
            const od = parseFloat(btn.getAttribute("data-od"));
            const ang = parseInt(btn.getAttribute("data-ang"));
            playClickSound();
            activeScenarioKey = "diagonal-bisect";
            syncScenarioButtons();
            startTweenToDiagonals(oa, oc, ob, od, ang);
        });
    });

    document.querySelectorAll(".btn-scenario").forEach(btn => {
        btn.addEventListener("click", () => {
            applyScenarioPreset(btn.getAttribute("data-scenario"));
        });
    });

    syncAnnotationControls();
    btnAutoDemo?.addEventListener("click", runAutoDemo);

    // 弹窗控制
    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));

    // Collapsible HUD & Quests
    document.getElementById("hud-toggle-btn").addEventListener("click", () => {
        document.getElementById("hud-checklist-panel").classList.toggle("collapsed");
    });

    document.getElementById("quest-toggle-btn").addEventListener("click", () => {
        document.getElementById("panel-quests-section").classList.toggle("collapsed");
    });

    // 探究任务按钮绑定
    document.getElementById("btn-quest-1").addEventListener("click", (e) => {
        e.stopPropagation();
        switchMode("linkage");
        activeScenarioKey = "edge-equal";
        syncScenarioButtons();
        playClickSound();
        startTweenToLinkage(6.0, 9.0, 6.0, 9.0, Math.PI * 0.35);
        setActiveQuestVisual(1);
    });

    document.getElementById("btn-quest-2").addEventListener("click", (e) => {
        e.stopPropagation();
        switchMode("diagonals");
        activeScenarioKey = "diagonal-bisect";
        syncScenarioButtons();
        playClickSound();
        startTweenToDiagonals(5.0, 5.0, 4.0, 4.0, 70);
        setActiveQuestVisual(2);
    });

    document.getElementById("btn-quest-3").addEventListener("click", (e) => {
        e.stopPropagation();
        switchMode("diagonals");
        activeScenarioKey = "diagonal-bisect";
        syncScenarioButtons();
        playClickSound();
        startTweenToDiagonals(5.0, 5.0, 5.0, 5.0, 90);
        setActiveQuestVisual(3);
    });

    // 默认点亮任务一
    setActiveQuestVisual(1);
    switchMode("linkage");
    syncScenarioButtons();

    initCanvasDragEvents();
    handleResize();

    // 启动持续渲染循环以支持边缘和对角线霓虹呼吸特效
    function runRenderLoop() {
        drawSandbox();
        requestAnimationFrame(runRenderLoop);
    }
    runRenderLoop();
}

document.addEventListener("DOMContentLoaded", init);

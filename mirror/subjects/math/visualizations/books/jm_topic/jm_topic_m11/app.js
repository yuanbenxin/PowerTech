/**
 * 《全等证明链金牌实验室》核心控制脚本 (app.js)
 * 功能：管理蝴蝶模型、公共边模型、直角风筝模型三个几何关卡，拼图插槽交互逻辑，双向联动高亮，及一键逻辑链验证。
 */

// ==========================================================================
// 1. 初始化全局元素与状态
// ==========================================================================
const svg = document.getElementById("geometry-svg");
const gridLayer = document.getElementById("svg-grid-layer");
const drawingLayer = document.getElementById("geometry-drawing-layer");
const controlsLayer = document.getElementById("geometry-controls-layer");
const hudContent = document.getElementById("hud-content-body");
const cardBankGrid = document.getElementById("card-bank-grid");
const stepGuideIndicator = document.getElementById("step-guide-indicator");
const resultStatusCard = document.getElementById("result-status-card");
const resultStatusIcon = document.getElementById("result-status-icon");
const resultStatusText = document.getElementById("result-status-text");
const btnResetPuzzle = document.getElementById("btn-reset-puzzle");
const btnVerifyPuzzle = document.getElementById("btn-verify-puzzle");
const btnHudToggle = document.getElementById("btn-hud-toggle");
const hudCard = document.getElementById("analysis-hud-card");
const flowSvg = document.getElementById("flow-svg");
const lessonGoalTitle = document.getElementById("lesson-goal-title");
const lessonGoalText = document.getElementById("lesson-goal-text");
const proofCoachText = document.getElementById("proof-coach-text");
const chainRouteLabel = document.getElementById("chain-route-label");
const feedbackDetailList = document.getElementById("feedback-detail-list");

let activeTab = "butterfly"; // "butterfly" | "common-side" | "kite-hl"
let activeDragId = null;
let dragOffset = null;
let activeSlotId = null; // 当前点击选中的插槽，支持触屏点击式填充

// 拼图插槽填充状态模型
let slots = {
    "slot-cond-1": null,
    "slot-cond-2": null,
    "slot-cond-3": null,
    "slot-postulate": null,
    "slot-conclusion": null,
    "slot-deduction": null
};

// 联动高亮状态
let hoveredTerm = null;
let activeFeedbackTerms = [];

// 教学演示动画与流程图渐进连线状态变量
let isAnimatingOverlap = false;
let overlapProgress = 0.0;
let overlapTimerId = null;
let laserStep = 0; // 0:未验证, 1:条件亮起并连接定理, 2:定理亮起并连接结论, 3:结论亮起并连接推导, 4:完全通关
let laserTimerIds = [];

// 音频上下文
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 1.1 几何模型状态数据
const state = {
    // 蝴蝶模型 (SAS)
    butterfly: {
        O: { x: 300, y: 210 },
        // 两条直线的方向向量
        u1: { x: 0.866, y: 0.5 }, // 30度角
        u2: { x: 0.866, y: -0.5 }, // -30度角
        lenA: 110,
        lenB: 120
    },
    // 公共边模型 (SSS/SAS/ASA)
    commonSide: {
        A: { x: 200, y: 270 },
        B: { x: 400, y: 270 },
        C: { x: 250, y: 130 } // C点可被拖拽，D点对称生成
    },
    // 直角风筝模型 (HL)
    kiteHl: {
        O: { x: 180, y: 210 },
        P: { x: 420, y: 210 },
        theta: -60 // A点的圆周角度数，B点对称生成
    }
};

// ==========================================================================
// 2. 辅助数学计算与几何解算
// ==========================================================================
function getDistance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

function radToDeg(rad) {
    let deg = (rad * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
}

// 绘制角标记
function getAngleArcPath(center, pt1, pt2, radius) {
    const ang1 = Math.atan2(pt1.y - center.y, pt1.x - center.x);
    const ang2 = Math.atan2(pt2.y - center.y, pt2.x - center.x);
    let diff = ang2 - ang1;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    const sweepFlag = diff > 0 ? 1 : 0;
    const p1 = { x: center.x + radius * Math.cos(ang1), y: center.y + radius * Math.sin(ang1) };
    const p2 = { x: center.x + radius * Math.cos(ang2), y: center.y + radius * Math.sin(ang2) };
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${p2.x} ${p2.y}`;
}

// 绘制直角符号
function drawRightAngle(foot, basePt, perpSourcePt, targetLength = 6) {
    const dyN = perpSourcePt.y - foot.y;
    const dxN = perpSourcePt.x - foot.x;
    const lenN = Math.sqrt(dxN * dxN + dyN * dyN) || 1;
    const nx = dxN / lenN;
    const ny = dyN / lenN;

    const dyD = basePt.y - foot.y;
    const dxD = basePt.x - foot.x;
    const lenD = Math.sqrt(dxD * dxD + dyD * dyD) || 1;
    const dx = dxD / lenD;
    const dy = dyD / lenD;

    const p1 = { x: foot.x + dx * targetLength, y: foot.y + dy * targetLength };
    const p3 = { x: foot.x + nx * targetLength, y: foot.y + ny * targetLength };
    const p2 = { x: p1.x + nx * targetLength, y: p1.y + ny * targetLength };

    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;
}

function createSVGNode(tag, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (let key in attrs) {
        node.setAttribute(key, attrs[key]);
    }
    return node;
}

// ==========================================================================
// 3. 几何渲染核心函数
// ==========================================================================

// --------------------------------------------------------------------------
// 3.1 蝴蝶模型渲染 (SAS)
// --------------------------------------------------------------------------
function renderButterfly() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.butterfly;
    // 计算四个端点坐标
    const A = { x: data.O.x - data.u1.x * data.lenA, y: data.O.y - data.u1.y * data.lenA };
    const D = { x: data.O.x + data.u1.x * data.lenA, y: data.O.y + data.u1.y * data.lenA };
    const B = { x: data.O.x - data.u2.x * data.lenB, y: data.O.y - data.u2.y * data.lenB };
    const C = { x: data.O.x + data.u2.x * data.lenB, y: data.O.y + data.u2.y * data.lenB };

    // 检查联动与卡槽常亮高亮
    const activeConditions = [slots["slot-cond-1"]?.text, slots["slot-cond-2"]?.text, slots["slot-cond-3"]?.text];
    const isOA = hoveredTerm === "OA=OD" || activeConditions.includes("OA=OD");
    const isOB = hoveredTerm === "OB=OC" || activeConditions.includes("OB=OC");
    const isAngle = hoveredTerm === "∠AOB=∠DOC" || activeConditions.includes("∠AOB=∠DOC");
    const isAB = hoveredTerm === "AB=CD" || slots["slot-deduction"]?.text === "AB=CD";
    const isAngleA = hoveredTerm === "∠A=∠D" || slots["slot-deduction"]?.text === "∠A=∠D";

    // 绘制填充三角形 OAB / ODC
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.O.x},${data.O.y} ${A.x},${A.y} ${B.x},${B.y}`,
        fill: "rgba(59, 130, 246, 0.03)", stroke: "none"
    }));
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.O.x},${data.O.y} ${D.x},${D.y} ${C.x},${C.y}`,
        fill: "rgba(139, 92, 246, 0.03)", stroke: "none"
    }));

    // 绘制直线 AD, BC
    drawingLayer.appendChild(createSVGNode("line", {
        x1: A.x, y1: A.y, x2: D.x, y2: D.y,
        class: "geo-line", stroke: "#cbd5e1", "stroke-width": 1.2
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: B.x, y1: B.y, x2: C.x, y2: C.y,
        class: "geo-line", stroke: "#cbd5e1", "stroke-width": 1.2
    }));

    // 绘制线段 OA, OD (红色/高亮蓝色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: A.x, y1: A.y, x2: data.O.x, y2: data.O.y,
        class: `geo-line blue ${isOA ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: D.x, y1: D.y, x2: data.O.x, y2: data.O.y,
        class: `geo-line blue ${isOA ? 'highlight-pulse' : ''}`
    }));

    // 绘制线段 OB, OC (紫色/高亮紫色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: B.x, y1: B.y, x2: data.O.x, y2: data.O.y,
        class: `geo-line purple ${isOB ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: C.x, y1: C.y, x2: data.O.x, y2: data.O.y,
        class: `geo-line purple ${isOB ? 'highlight-pulse' : ''}`
    }));

    // 绘制弦底边 AB, CD (橙色/高亮橙色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: A.x, y1: A.y, x2: B.x, y2: B.y,
        class: `geo-line orange ${isAB ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: C.x, y1: C.y, x2: D.x, y2: D.y,
        class: `geo-line orange ${isAB ? 'highlight-pulse' : ''}`
    }));

    // 绘制对顶角 ∠AOB / ∠DOC 弧线
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.O, B, A, 18),
        fill: "none", stroke: "var(--color-red)", "stroke-width": 1.5,
        filter: isAngle ? "url(#neon-glow)" : ""
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.O, C, D, 18),
        fill: "none", stroke: "var(--color-red)", "stroke-width": 1.5,
        filter: isAngle ? "url(#neon-glow)" : ""
    }));

    // 绘制对应角 ∠A / ∠D 弧线
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(A, data.O, B, 14),
        fill: "none", stroke: "var(--color-green)", "stroke-width": 1.2,
        filter: isAngleA ? "url(#neon-glow)" : "",
        opacity: isAngleA ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(D, C, data.O, 14),
        fill: "none", stroke: "var(--color-green)", "stroke-width": 1.2,
        filter: isAngleA ? "url(#neon-glow)" : "",
        opacity: isAngleA ? 1.0 : 0.4
    }));

    // 标线刻度 (Tick marks)
    const drawTicksOnSegment = (pStart, pEnd, count, spacing = 4) => {
        const midX = (pStart.x + pEnd.x) / 2;
        const midY = (pStart.y + pEnd.y) / 2;
        const dx = pEnd.x - pStart.x;
        const dy = pEnd.y - pStart.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const perpX = -dy / len;
        const perpY = dx / len;

        for (let i = 0; i < count; i++) {
            const shift = (i - (count-1)/2) * spacing;
            const startX = midX + shift * (dx/len) - 5 * perpX;
            const startY = midY + shift * (dy/len) - 5 * perpY;
            const endX = midX + shift * (dx/len) + 5 * perpX;
            const endY = midY + shift * (dy/len) + 5 * perpY;
            drawingLayer.appendChild(createSVGNode("line", {
                x1: startX, y1: startY, x2: endX, y2: endY,
                stroke: "var(--color-blue)", "stroke-width": 1.2
            }));
        }
    };
    // OA/OD 单刻度线
    drawTicksOnSegment(A, data.O, 1);
    drawTicksOnSegment(D, data.O, 1);
    // OB/OC 双刻度线
    drawTicksOnSegment(B, data.O, 2);
    drawTicksOnSegment(C, data.O, 2);

    // 文字标号
    drawingLayer.appendChild(createSVGNode("text", { x: data.O.x - 8, y: data.O.y - 12, class: "geo-text" })).textContent = "O";
    drawingLayer.appendChild(createSVGNode("text", { x: A.x - 14, y: A.y + 4, class: "geo-text blue" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: B.x - 14, y: B.y + 4, class: "geo-text purple" })).textContent = "B";
    drawingLayer.appendChild(createSVGNode("text", { x: C.x + 8, y: C.y + 4, class: "geo-text purple" })).textContent = "C";
    drawingLayer.appendChild(createSVGNode("text", { x: D.x + 8, y: D.y + 4, class: "geo-text blue" })).textContent = "D";

    // 3.1.99 绘制全等合体克隆三角形 (Rotation overlap animation)
    if (isAnimatingOverlap && overlapProgress > 0) {
        const phi = overlapProgress * Math.PI; // 0 to 180 degrees
        const rotatePoint = (pt) => {
            const dx = pt.x - data.O.x;
            const dy = pt.y - data.O.y;
            return {
                x: data.O.x + dx * Math.cos(phi) - dy * Math.sin(phi),
                y: data.O.y + dx * Math.sin(phi) + dy * Math.cos(phi)
            };
        };
        const rotA = rotatePoint(A);
        const rotB = rotatePoint(B);

        // 绘制半透明金色合体三角形
        drawingLayer.appendChild(createSVGNode("polygon", {
            points: `${data.O.x},${data.O.y} ${rotA.x},${rotA.y} ${rotB.x},${rotB.y}`,
            fill: "rgba(245, 158, 11, 0.4)", stroke: "var(--color-orange)", "stroke-width": 1.8,
            filter: "url(#neon-glow)"
        }));

        // 绘制随动字母标签
        drawingLayer.appendChild(createSVGNode("text", { x: rotA.x - 14, y: rotA.y + 4, class: "geo-text orange geo-text-pulse" })).textContent = "A'";
        drawingLayer.appendChild(createSVGNode("text", { x: rotB.x - 14, y: rotB.y + 4, class: "geo-text orange geo-text-pulse" })).textContent = "B'";
    }

    // 交互拖拽点 A, B
    createDragPoint(A.x, A.y, "drag-A");
    createDragPoint(B.x, B.y, "drag-B");
}

// --------------------------------------------------------------------------
// 3.2 公共边模型渲染 (ASA / AAS / SSS)
// --------------------------------------------------------------------------
function renderCommonSide() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.commonSide;
    // 计算对称的D点
    const D = {
        x: 600 - data.C.x,
        y: data.C.y
    };

    // 检查联动与卡槽常亮高亮
    const activeConditions = [slots["slot-cond-1"]?.text, slots["slot-cond-2"]?.text, slots["slot-cond-3"]?.text];
    const isAC = hoveredTerm === "AC=BD" || activeConditions.includes("AC=BD");
    const isBC = hoveredTerm === "BC=AD" || activeConditions.includes("BC=AD");
    const isCommon = hoveredTerm === "公共边 AB=BA" || activeConditions.includes("公共边 AB=BA");
    const isAngleCAB = hoveredTerm === "∠CAB=∠DBA" || activeConditions.includes("∠CAB=∠DBA");
    const isAngleCBA = hoveredTerm === "∠CBA=∠DAB" || activeConditions.includes("∠CBA=∠DAB");
    const isAngleC = hoveredTerm === "∠C=∠D" || slots["slot-deduction"]?.text === "∠C=∠D";

    // 绘制填充三角形 ABC / BAD
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.A.x},${data.A.y} ${data.B.x},${data.B.y} ${data.C.x},${data.C.y}`,
        fill: "rgba(59, 130, 246, 0.02)", stroke: "none"
    }));
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.A.x},${data.A.y} ${data.B.x},${data.B.y} ${D.x},${D.y}`,
        fill: "rgba(16, 185, 129, 0.02)", stroke: "none"
    }));

    // 绘制底边公共边 AB (粗红色/高亮红色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.A.x, y1: data.A.y, x2: data.B.x, y2: data.B.y,
        class: `geo-line red ${isCommon ? 'highlight-pulse' : ''}`, "stroke-width": 3.0
    }));

    // 绘制侧边 AC, BD (蓝色/高亮蓝色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.A.x, y1: data.A.y, x2: data.C.x, y2: data.C.y,
        class: `geo-line blue ${isAC ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.B.x, y1: data.B.y, x2: D.x, y2: D.y,
        class: `geo-line blue ${isAC ? 'highlight-pulse' : ''}`
    }));

    // 绘制对角线 BC, AD (橘色/高亮橘色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.B.x, y1: data.B.y, x2: data.C.x, y2: data.C.y,
        class: `geo-line orange ${isBC ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.A.x, y1: data.A.y, x2: D.x, y2: D.y,
        class: `geo-line orange ${isBC ? 'highlight-pulse' : ''}`
    }));

    // 绘制角度弧标记
    // 1. ∠CAB 和 ∠DBA
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.A, D, data.C, 24),
        fill: "none", stroke: "var(--color-purple)", "stroke-width": 1.5,
        filter: isAngleCAB ? "url(#neon-glow)" : ""
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.B, D, data.C, 24),
        fill: "none", stroke: "var(--color-purple)", "stroke-width": 1.5,
        filter: isAngleCAB ? "url(#neon-glow)" : ""
    }));

    // 2. ∠CBA 和 ∠DAB
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.A, data.B, D, 16),
        fill: "none", stroke: "var(--color-orange)", "stroke-width": 1.5,
        filter: isAngleCBA ? "url(#neon-glow)" : ""
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.B, data.A, data.C, 16),
        fill: "none", stroke: "var(--color-orange)", "stroke-width": 1.5,
        filter: isAngleCBA ? "url(#neon-glow)" : ""
    }));

    // 3. 顶角 ∠C 和 ∠D
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.C, data.A, data.B, 18),
        fill: "none", stroke: "var(--color-green)", "stroke-width": 1.2,
        filter: isAngleC ? "url(#neon-glow)" : "",
        opacity: isAngleC ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(D, data.A, data.B, 18),
        fill: "none", stroke: "var(--color-green)", "stroke-width": 1.2,
        filter: isAngleC ? "url(#neon-glow)" : "",
        opacity: isAngleC ? 1.0 : 0.4
    }));

    // 文字标号
    drawingLayer.appendChild(createSVGNode("text", { x: data.A.x - 14, y: data.A.y + 14, class: "geo-text" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: data.B.x + 6, y: data.B.y + 14, class: "geo-text" })).textContent = "B";
    drawingLayer.appendChild(createSVGNode("text", { x: data.C.x - 4, y: data.C.y - 10, class: "geo-text blue" })).textContent = "C";
    drawingLayer.appendChild(createSVGNode("text", { x: D.x - 4, y: D.y - 10, class: "geo-text blue" })).textContent = "D";

    // 3.2.99 绘制全等合体克隆三角形 (Reflection overlap animation)
    if (isAnimatingOverlap && overlapProgress > 0) {
        const scaleS = 1.0 - 2.0 * overlapProgress;
        const foldPoint = (pt) => {
            const dx = pt.x - 300; // Axis of symmetry is x=300
            return {
                x: 300 + dx * scaleS,
                y: pt.y
            };
        };
        const fA = foldPoint(data.A);
        const fB = foldPoint(data.B);
        const fC = foldPoint(data.C);

        drawingLayer.appendChild(createSVGNode("polygon", {
            points: `${fA.x},${fA.y} ${fB.x},${fB.y} ${fC.x},${fC.y}`,
            fill: "rgba(245, 158, 11, 0.4)", stroke: "var(--color-orange)", "stroke-width": 1.8,
            filter: "url(#neon-glow)"
        }));

        drawingLayer.appendChild(createSVGNode("text", { x: fC.x - 4, y: fC.y - 10, class: "geo-text orange geo-text-pulse" })).textContent = "C'";
    }

    // 交互拖拽点 C (对称更新 D)
    createDragPoint(data.C.x, data.C.y, "drag-C");
}

// --------------------------------------------------------------------------
// 3.3 直角风筝模型渲染 (HL)
// --------------------------------------------------------------------------
function renderKiteHl() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.kiteHl;
    const rad = degToRad(data.theta);
    const R_dia = getDistance(data.O, data.P) / 2;
    const centerM = { x: (data.O.x + data.P.x)/2, y: (data.O.y + data.P.y)/2 };

    // A 点在以 OP 为直径的圆周上
    const A = {
        x: centerM.x + R_dia * Math.cos(rad),
        y: centerM.y + R_dia * Math.sin(rad)
    };
    // B 点关于轴线 OP 对称
    const B = {
        x: A.x,
        y: 420 - A.y
    };

    // 检查联动与卡槽常亮高亮
    const activeConditions = [slots["slot-cond-1"]?.text, slots["slot-cond-2"]?.text, slots["slot-cond-3"]?.text];
    const isOP = hoveredTerm === "公共斜边 OP=OP" || activeConditions.includes("公共斜边 OP=OP");
    const isOA = hoveredTerm === "直角边 OA=OB" || activeConditions.includes("直角边 OA=OB") || slots["slot-deduction"]?.text === "直角边 OA=OB";
    const isPA = hoveredTerm === "对应直角边 PA=PB" || activeConditions.includes("对应直角边 PA=PB") || slots["slot-deduction"]?.text === "对应直角边 PA=PB";
    const isRightAngle = hoveredTerm === "直角 ∠OAP=∠OBP=90°" || activeConditions.includes("直角 ∠OAP=∠OBP=90°");
    const isAngleBisect = hoveredTerm === "角平分线 ∠AOP=∠BOP" || slots["slot-deduction"]?.text === "角平分线 ∠AOP=∠BOP";

    // 绘制填充直角三角形 OAP / OBP
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.O.x},${data.O.y} ${A.x},${A.y} ${data.P.x},${data.P.y}`,
        fill: "rgba(139, 92, 246, 0.03)", stroke: "none"
    }));
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.O.x},${data.O.y} ${B.x},${B.y} ${data.P.x},${data.P.y}`,
        fill: "rgba(16, 185, 129, 0.03)", stroke: "none"
    }));

    // 1. 绘制斜边公共边 OP (粗紫色/高亮紫色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: data.P.x, y2: data.P.y,
        class: `geo-line purple dashed common-hypotenuse ${isOP ? 'common-hypotenuse-active' : ''}`, "stroke-width": 2.5
    }));

    // 2. 绘制直角边 OA, OB (蓝色/高亮蓝色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: A.x, y2: A.y,
        class: `geo-line blue ${isOA ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: B.x, y2: B.y,
        class: `geo-line blue ${isOA ? 'highlight-pulse' : ''}`
    }));

    // 3. 绘制直角边 PA, PB (橙色/高亮橙色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.P.x, y1: data.P.y, x2: A.x, y2: A.y,
        class: `geo-line orange ${isPA ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.P.x, y1: data.P.y, x2: B.x, y2: B.y,
        class: `geo-line orange ${isPA ? 'highlight-pulse' : ''}`
    }));

    // 4. 绘制直角标志符号 (在 A 和 B 处)
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(A, data.P, data.O, 8),
        class: `right-angle-marker ${isRightAngle ? 'right-angle-active' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(B, data.P, data.O, 8),
        class: `right-angle-marker ${isRightAngle ? 'right-angle-active' : ''}`
    }));

    // 5. 绘制角平分线 ∠AOP / ∠BOP
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.O, data.P, A, 18),
        fill: "none", stroke: "var(--color-red)", "stroke-width": 1.2,
        filter: isAngleBisect ? "url(#neon-glow)" : "",
        opacity: isAngleBisect ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.O, B, data.P, 18),
        fill: "none", stroke: "var(--color-red)", "stroke-width": 1.2,
        filter: isAngleBisect ? "url(#neon-glow)" : "",
        opacity: isAngleBisect ? 1.0 : 0.4
    }));

    // 文字标号
    drawingLayer.appendChild(createSVGNode("text", { x: data.O.x - 14, y: data.O.y + 4, class: "geo-text" })).textContent = "O";
    drawingLayer.appendChild(createSVGNode("text", { x: data.P.x + 8, y: data.P.y + 4, class: "geo-text" })).textContent = "P";
    drawingLayer.appendChild(createSVGNode("text", { x: A.x - 4, y: A.y - 12, class: "geo-text blue" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: B.x - 4, y: B.y + 18, class: "geo-text blue" })).textContent = "B";

    // 3.3.99 绘制全等合体克隆三角形 (Reflection fold animation)
    if (isAnimatingOverlap && overlapProgress > 0) {
        const scaleS = 1.0 - 2.0 * overlapProgress;
        const foldPoint = (pt) => {
            const dy = pt.y - 210; // Axis of symmetry is y=210
            return {
                x: pt.x,
                y: 210 + dy * scaleS
            };
        };
        const fA = foldPoint(A);

        drawingLayer.appendChild(createSVGNode("polygon", {
            points: `${data.O.x},${data.O.y} ${fA.x},${fA.y} ${data.P.x},${data.P.y}`,
            fill: "rgba(245, 158, 11, 0.4)", stroke: "var(--color-orange)", "stroke-width": 1.8,
            filter: "url(#neon-glow)"
        }));

        drawingLayer.appendChild(createSVGNode("text", { x: fA.x - 4, y: fA.y - 12, class: "geo-text orange geo-text-pulse" })).textContent = "A'";
    }

    // 拖拽控制点 A (沿圆弧运动)
    createDragPoint(A.x, A.y, "drag-A");
}

function createDragPoint(cx, cy, id) {
    const g = createSVGNode("g", { class: "drag-point", id: id });
    g.appendChild(createSVGNode("circle", { cx: cx, cy: cy, r: 8, class: "drag-point-outer" }));
    g.appendChild(createSVGNode("circle", { cx: cx, cy: cy, r: 3.5, class: "drag-point-inner" }));
    controlsLayer.appendChild(g);
}

function drawGrid() {
    gridLayer.innerHTML = "";
    gridLayer.appendChild(createSVGNode("rect", {
        width: "100%", height: "100%", fill: "url(#grid-dots)"
    }));
}

// ==========================================================================
// 4. 卡片仓库与插槽拼图引擎 (Puzzle Engine)
// ==========================================================================

const levelsData = {
    butterfly: {
        cards: [
            { text: "OA=OD", type: "cond" },
            { text: "OB=OC", type: "cond" },
            { text: "∠AOB=∠DOC", type: "cond" },
            { text: "AB=CD", type: "deduct" },
            { text: "∠A=∠D", type: "deduct" },
            { text: "SAS", type: "post" },
            { text: "ASA", type: "post" },
            { text: "SSS", type: "post" },
            { text: "△OAB ≅ △ODC", type: "conc" },
            { text: "△OAB ≅ △OCD", type: "conc" } // 干扰项（字母顺序错）
        ],
        hint: `
            <h3>蝴蝶模型 (SAS) 证明思路</h3>
            <p>1. <strong>对顶角相等</strong>：两条相交直线 AD 和 BC 形成对顶角 <span class="hud-math-inline">∠AOB = ∠DOC</span>。</p>
            <p>2. <strong>两边对应相等</strong>：已知两组夹角边分别相等。</p>
            <div class="hud-formula-line">
                <span class="hud-math-inline">OA = OD</span>
                <span class="hud-math-inline">OB = OC</span>
            </div>
            <p>3. <strong>全等判定</strong>：两边及其夹角对应相等的两个三角形全等 (SAS)。</p>
            <div class="hud-formula-line">
                <span class="hud-math-inline">△OAB ≅ △ODC</span>
            </div>
            <p>4. <strong>性质推导</strong>：全等三角形的对应边相等 <span class="hud-math-inline">AB = CD</span>，对应角相等 <span class="hud-math-inline">∠A = ∠D</span>。</p>
        `
    },
    "common-side": {
        cards: [
            { text: "AC=BD", type: "cond" },
            { text: "BC=AD", type: "cond" },
            { text: "公共边 AB=BA", type: "cond" },
            { text: "∠CAB=∠DBA", type: "cond" },
            { text: "∠CBA=∠DAB", type: "cond" },
            { text: "SSS", type: "post" },
            { text: "SAS", type: "post" },
            { text: "ASA", type: "post" },
            { text: "AAS", type: "post" },
            { text: "∠C=∠D", type: "deduct" },
            { text: "△ABC ≅ △BAD", type: "conc" },
            { text: "△ABC ≅ △ABD", type: "conc" } // 干扰项
        ],
        hint: `
            <h3>公共边模型证明思路</h3>
            <p>本关支持 <strong>三种不同的证明链条</strong>！您可以任选一种拼装：</p>
            <ul>
                <li><strong>SSS 链</strong><div class="hud-formula-line"><span class="hud-math-inline">AC = BD</span><span class="hud-math-inline">BC = AD</span><span class="hud-math-inline">AB = BA</span><span class="hud-math-inline">⇒ SSS ⇒ △ABC ≅ △BAD</span></div></li>
                <li><strong>SAS 链</strong><div class="hud-formula-line"><span class="hud-math-inline">AC = BD</span><span class="hud-math-inline">∠CAB = ∠DBA</span><span class="hud-math-inline">AB = BA</span><span class="hud-math-inline">⇒ SAS ⇒ △ABC ≅ △BAD</span></div></li>
                <li><strong>ASA 链</strong><div class="hud-formula-line"><span class="hud-math-inline">∠CAB = ∠DBA</span><span class="hud-math-inline">∠CBA = ∠DAB</span><span class="hud-math-inline">AB = BA</span><span class="hud-math-inline">⇒ ASA ⇒ △ABC ≅ △BAD</span></div></li>
            </ul>
        `
    },
    "kite-hl": {
        cards: [
            { text: "公共斜边 OP=OP", type: "cond" },
            { text: "直角边 OA=OB", type: "cond" },
            { text: "对应直角边 PA=PB", type: "cond" },
            { text: "直角 ∠OAP=∠OBP=90°", type: "cond" },
            { text: "HL", type: "post" },
            { text: "SAS", type: "post" },
            { text: "ASA", type: "post" },
            { text: "对应直角边 PA=PB", type: "deduct" },
            { text: "角平分线 ∠AOP=∠BOP", type: "deduct" },
            { text: "△OAP ≅ △OBP", type: "conc" }
        ],
        hint: `
            <h3>直角斜边 HL 证明思路</h3>
            <p>1. <strong>直角三角形条件</strong>：已知 <span class="hud-math-inline">∠OAP = ∠OBP = 90°</span>，两个三角形都是直角三角形。</p>
            <p>2. <strong>斜边公共</strong>：直角三角形的斜边 <span class="hud-math-inline">OP = OP</span> 共享公共边。</p>
            <p>3. <strong>直角边相等</strong>：对应直角边 <span class="hud-math-inline">OA = OB</span>（或 <span class="hud-math-inline">PA = PB</span>）。</p>
            <p>4. <strong>全等判定</strong>：斜边与一条直角边对应相等的两个直角三角形全等 (HL)。</p>
            <div class="hud-formula-line">
                <span class="hud-math-inline">Rt△OAP ≅ Rt△OBP</span>
            </div>
        `
    }
};

const levelPanelMeta = {
    butterfly: {
        route: "SAS 证明链",
        title: "蝴蝶模型：找出两边及夹角",
        goal: "先从图形中锁定两组对应边，再用对顶角形成 SAS 判定。",
        coach: "建议顺序：OA=OD、OB=OC、∠AOB=∠DOC → SAS → △OAB ≅ △ODC → 对应边角相等。"
    },
    "common-side": {
        route: "SSS / SAS / ASA 多链",
        title: "公共边模型：选择一条完整证明路线",
        goal: "公共边 AB=BA 是三条路线的共同入口，条件组必须和判定定理成套匹配。",
        coach: "可走 SSS、SAS 或 ASA。先确定你选的是哪条路线，再填入同一组条件。"
    },
    "kite-hl": {
        route: "HL 证明链",
        title: "直角风筝：抓住直角、斜边和一条直角边",
        goal: "先证明两个三角形都是直角三角形，再用公共斜边 OP 和一条对应直角边完成 HL。",
        coach: "HL 需要直角条件、公共斜边和一条直角边；性质推导要和已知条件错开。"
    }
};

const slotDefaultTexts = {
    "slot-cond-1": "条件1",
    "slot-cond-2": "条件2",
    "slot-cond-3": "条件3",
    "slot-postulate": "选择定理",
    "slot-conclusion": "全等结论",
    "slot-deduction": "性质推导"
};

const cardGroupLabels = {
    cond: "条件卡",
    post: "判定卡",
    conc: "结论卡",
    deduct: "推导卡"
};

function collectActiveTerms() {
    const terms = new Set(activeFeedbackTerms);
    if (hoveredTerm) terms.add(hoveredTerm);
    Object.values(slots).forEach(slotCard => {
        if (slotCard?.text) terms.add(slotCard.text);
    });
    return terms;
}

function updateLinkedUi() {
    const terms = collectActiveTerms();
    document.querySelectorAll(".proof-card").forEach(card => {
        card.classList.toggle("linked", terms.has(card.getAttribute("data-term")));
    });
    document.querySelectorAll(".drop-zone").forEach(slot => {
        slot.classList.toggle("linked", terms.has(slot.getAttribute("data-term")));
    });
}

function setCoachFeedback(mode, message, details = []) {
    if (proofCoachText) proofCoachText.textContent = message;
    if (feedbackDetailList) {
        feedbackDetailList.innerHTML = details.map(item => `<li>${item}</li>`).join("");
    }
    resultStatusCard.classList.toggle("success", mode === "success");
    resultStatusCard.classList.toggle("fail", mode === "fail");
}

function updateLessonGoal() {
    const meta = levelPanelMeta[activeTab];
    if (!meta) return;
    if (lessonGoalTitle) lessonGoalTitle.textContent = meta.title;
    if (lessonGoalText) lessonGoalText.textContent = meta.goal;
    if (proofCoachText) proofCoachText.textContent = meta.coach;
    if (chainRouteLabel) chainRouteLabel.textContent = meta.route;
    if (feedbackDetailList) {
        feedbackDetailList.innerHTML = "<li>条件断点：先让三个已知条件能组成同一个判定定理。</li>";
    }
}

function applyPlatformPanelCompaction() {
    const panel = document.querySelector(".math-source-panel-jm_topic_m11, .control-panel");
    if (!panel) return;

    const setImportant = (selector, property, value) => {
        panel.querySelectorAll(selector).forEach(el => {
            el.style.setProperty(property, value, "important");
        });
    };

    setImportant(".tab-grid", "grid-template-columns", "repeat(3, minmax(0, 1fr))");
    setImportant(".tab-grid", "gap", "6px");
    setImportant(".tab-btn", "min-height", "34px");
    setImportant(".tab-btn", "padding", "5px 6px");
    setImportant(".tab-btn", "font-size", "11px");

    setImportant("#proof-coach-text", "display", "none");
    setImportant(".flow-workspace-container", "min-height", "226px");
    setImportant(".flow-workspace-container", "padding", "8px");
    setImportant(".flow-workspace", "min-height", "190px");
    setImportant(".flow-workspace", "padding", "8px 6px");
    setImportant(".flow-workspace", "gap", "10px");
    setImportant(".proof-stage-label", "display", "none");
    setImportant(".flow-row", "min-height", "36px");
    setImportant(".flow-row", "gap", "8px");
    setImportant(".drop-zone", "min-height", "34px");
    setImportant(".drop-zone", "padding", "5px 20px 5px 7px");
    setImportant(".drop-zone", "font-size", "10px");
    setImportant(".drop-zone.filled", "background", "rgba(15, 23, 42, 0.96)");
    setImportant(".drop-zone.filled", "border-color", "rgba(45, 212, 191, 0.62)");

    setImportant(".card-group", "background", "rgba(15, 23, 42, 0.72)");
    setImportant(".card-group", "border-color", "rgba(148, 163, 184, 0.22)");
    setImportant(".card-group", "display", "grid");
    setImportant(".card-group", "grid-template-columns", "58px minmax(0, 1fr)");
    setImportant(".card-group", "align-items", "start");
    setImportant(".card-group", "gap", "6px");
    setImportant(".card-group", "padding", "6px");
    setImportant(".card-group-title", "color", "#e2e8f0");
    setImportant(".card-group-title", "margin-bottom", "0");
    setImportant(".card-group-title", "line-height", "1.25");
    setImportant(".proof-card", "background", "rgba(30, 41, 59, 0.88)");
    setImportant(".proof-card", "color", "#f8fafc");
    setImportant(".proof-card", "min-height", "28px");
    setImportant(".proof-card", "padding", "4px 7px");
    setImportant(".proof-card.used", "opacity", "0.62");
    setImportant(".proof-card.used", "background", "rgba(71, 85, 105, 0.7)");
    setImportant(".result-status-card", "background", "rgba(15, 23, 42, 0.72)");
    setImportant(".result-status-card", "color", "#e2e8f0");
}

// 重新加载卡片仓库
function loadCardBank() {
    const currentLevel = levelsData[activeTab];
    if (!currentLevel) return;

    ["cond", "post", "conc", "deduct"].forEach(type => {
        renderCardGroup(type, currentLevel.cards.filter(card => card.type === type));
    });
    updateLinkedUi();
    applyPlatformPanelCompaction();
}

function renderCardGroup(type, cards) {
    const group = document.getElementById(`card-group-${type}`);
    if (!group) return;
    const body = group.querySelector(".card-group-body");
    if (!body) return;

    group.querySelector(".card-group-title").textContent = cardGroupLabels[type];
    body.innerHTML = "";

    cards.forEach((cardData) => {
        const idx = levelsData[activeTab].cards.indexOf(cardData);
        // 检查该卡片是否已被放入任何槽中，已被放入的卡片置灰不可再次使用
        const isUsed = Object.values(slots).some(slotCard => slotCard && slotCard.text === cardData.text);

        const card = document.createElement("div");
        card.className = "proof-card";
        card.setAttribute("draggable", !isUsed);
        card.setAttribute("data-index", idx);
        card.setAttribute("data-type", cardData.type);
        card.setAttribute("data-term", cardData.text);
        card.innerHTML = cardData.text;

        if (isUsed) {
            card.classList.add("used");
            card.setAttribute("aria-disabled", "true");
        }

        // 双向联动高亮事件
        card.addEventListener("mouseenter", () => {
            hoveredTerm = cardData.text;
            renderActiveTab();
            updateLinkedUi();
        });
        card.addEventListener("mouseleave", () => {
            hoveredTerm = null;
            renderActiveTab();
            updateLinkedUi();
        });

        // 触屏点击/多媒体白板式交互：点击卡片放入当前选中的插槽
        card.addEventListener("click", () => {
            if (isUsed) return;
            handleCardPick(cardData);
        });

        // 拖拽事件
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", JSON.stringify({ index: idx, tab: activeTab }));
            card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
        });

        body.appendChild(card);
    });
}

function findNextCompatibleSlot(type) {
    if (type === "cond") {
        if (!slots["slot-cond-1"]) return "slot-cond-1";
        if (!slots["slot-cond-2"]) return "slot-cond-2";
        if (!slots["slot-cond-3"]) return "slot-cond-3";
    } else if (type === "post") {
        if (!slots["slot-postulate"]) return "slot-postulate";
    } else if (type === "conc") {
        if (!slots["slot-conclusion"]) return "slot-conclusion";
    } else if (type === "deduct") {
        if (!slots["slot-deduction"]) return "slot-deduction";
    }
    return null;
}

function handleCardPick(cardData) {
    const selectedSlotType = activeSlotId ? document.getElementById(activeSlotId)?.getAttribute("data-slot-type") : null;

    if (activeSlotId && selectedSlotType === cardData.type) {
        fillSlot(activeSlotId, cardData);
        activeSlotId = null;
        updateSlotHighlights();
        return;
    }

    if (activeSlotId && selectedSlotType !== cardData.type) {
        document.getElementById(activeSlotId)?.classList.add("error");
        setCoachFeedback("fail", "当前卡片类型和选中的卡槽不匹配。", [
            `条件断点：${cardData.text} 不能放入当前类型的卡槽。`,
            "请重新点击同类型空槽，或直接点击卡片让系统自动填入。"
        ]);
        playErrorSound();
        setTimeout(() => document.getElementById(activeSlotId)?.classList.remove("error"), 350);
        return;
    }

    const emptySlotId = findNextCompatibleSlot(cardData.type);
    if (emptySlotId) {
        fillSlot(emptySlotId, cardData);
        return;
    }

    hoveredTerm = cardData.text;
    activeFeedbackTerms = [cardData.text];
    setCoachFeedback("neutral", "这一类卡槽已经填满，可以先删除同类卡槽中的卡片再替换。", [
        `条件断点：${cardData.text} 当前只做图形高亮，不会覆盖已有卡槽。`
    ]);
    renderActiveTab();
    updateLinkedUi();
}

// 填充插槽
function fillSlot(slotId, cardData) {
    slots[slotId] = cardData;
    playClickSound();
    
    const slotEl = document.getElementById(slotId);
    slotEl.classList.add("filled");
    slotEl.classList.remove("error", "correct");
    slotEl.setAttribute("data-term", cardData.text);
    slotEl.innerHTML = `<span class="slot-text">${cardData.text}</span><button class="slot-remove-btn" type="button" aria-label="移除 ${cardData.text}"><i class="fa-solid fa-xmark"></i></button>`;

    // 绑定槽内删除卡片的点击事件
    slotEl.querySelector(".slot-remove-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        removeSlotContent(slotId);
    });

    hoveredTerm = cardData.text;
    activeFeedbackTerms = [cardData.text];
    loadCardBank();
    drawFlowLines();
    resetStatusBar();
    renderActiveTab();
    updateLinkedUi();
}

// 移除插槽内的内容
function removeSlotContent(slotId) {
    slots[slotId] = null;
    playClickSound();
    
    const slotEl = document.getElementById(slotId);
    slotEl.classList.remove("filled", "correct", "error");
    slotEl.removeAttribute("data-term");
    
    // 恢复默认提示文本
    slotEl.innerHTML = slotDefaultTexts[slotId];

    loadCardBank();
    drawFlowLines();
    resetStatusBar();
    renderActiveTab();
    updateLinkedUi();
}

function resetStatusBar() {
    resultStatusCard.className = "result-status-card";
    resultStatusIcon.className = "fa-solid fa-circle-question";
    resultStatusText.innerHTML = "请将卡片填入上方插槽中以构建几何全等证明链";
    setCoachFeedback("neutral", levelPanelMeta[activeTab]?.coach || "继续补全证明链。", [
        "条件断点：先让三个已知条件能组成同一个判定定理。"
    ]);
}

function updateSlotHighlights() {
    document.querySelectorAll(".drop-zone").forEach(slot => {
        slot.classList.toggle("selected", slot.id === activeSlotId);
    });
    loadCardBank();
}

// --------------------------------------------------------------------------
// 4.1 初始化插槽拖拽事件
// --------------------------------------------------------------------------
function initSlotsDragEvents() {
    document.querySelectorAll(".drop-zone").forEach(slot => {
        // 点击插槽高亮，准备接收下方点击的卡片
        slot.addEventListener("click", (e) => {
            if (slots[slot.id]) return; // 已有内容先删再填
            activeSlotId = (activeSlotId === slot.id) ? null : slot.id;
            playClickSound();
            updateSlotHighlights();
        });

        slot.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (!slots[slot.id]) {
                slot.classList.add("hover");
            }
        });

        slot.addEventListener("dragleave", () => {
            slot.classList.remove("hover");
        });

        slot.addEventListener("drop", (e) => {
            slot.classList.remove("hover");
            e.preventDefault();
            
            try {
                const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
                if (dragData.tab !== activeTab) return; // 必须是当前关卡的卡片

                const cardData = levelsData[activeTab].cards[dragData.index];
                
                // 校验卡片与插槽类型是否匹配
                const slotType = slot.getAttribute("data-slot-type");
                if (cardData.type === slotType) {
                    fillSlot(slot.id, cardData);
                } else {
                    // 类型不符震颤警告
                    slot.classList.add("error");
                    setCoachFeedback("fail", "当前卡片类型和卡槽不匹配。", [
                        `条件断点：${cardData.text} 不能放入这个证明环节。`,
                        "请观察卡槽标题，选择同类型的条件、判定、结论或推导卡。"
                    ]);
                    playErrorSound();
                    setTimeout(() => slot.classList.remove("error"), 300);
                }
            } catch (err) {
                console.error("Drop error", err);
            }
        });
    });
}

function buildFailureDetails(errorSlots, condList, post, conc, deduct) {
    const details = [];
    if (errorSlots.some(slot => slot.startsWith("slot-cond"))) {
        details.push(`条件断点：当前条件组「${condList.join("、")}」不能组成当前关卡的一条完整全等判定链。`);
    }
    if (errorSlots.includes("slot-postulate")) {
        details.push(`判定断点：所选判定定理「${post}」与已知条件组不匹配。`);
    }
    if (errorSlots.includes("slot-conclusion")) {
        details.push(`结论断点：全等结论「${conc}」的三角形字母顺序没有对齐对应顶点。`);
    }
    if (errorSlots.includes("slot-deduction")) {
        details.push(`性质断点：性质推导「${deduct}」必须来自已经证明的全等三角形对应边角。`);
    }
    return details.length ? details : ["条件断点：证明链仍有未定位的断点，请从已知条件重新核对对应关系。"];
}

// --------------------------------------------------------------------------
// 4.2 逻辑证明链验证核心判定逻辑 (Verify Chain)
// --------------------------------------------------------------------------
function verifyProofChain() {
    let hasEmpty = Object.values(slots).some(slot => slot === null);
    if (hasEmpty) {
        resultStatusCard.className = "result-status-card fail";
        resultStatusIcon.className = "fa-solid fa-triangle-exclamation";
        resultStatusText.innerHTML = "❌ 验证失败：证明链插槽尚未填满，请先补全空位。";
        setCoachFeedback("fail", "证明链还没有闭合，先补齐所有空槽。", [
            "条件断点：三个已知条件必须先填满。",
            "判定断点：判定定理、全等结论和性质推导也要完整。"
        ]);
        playErrorSound();
        return;
    }

    const c1 = slots["slot-cond-1"].text;
    const c2 = slots["slot-cond-2"].text;
    const c3 = slots["slot-cond-3"].text;
    const condList = [c1, c2, c3];

    const post = slots["slot-postulate"].text;
    const conc = slots["slot-conclusion"].text;
    const deduct = slots["slot-deduction"].text;

    let isCorrect = false;
    let errorSlots = [];

    if (activeTab === "butterfly") {
        // 蝴蝶模型判定 (SAS)
        const hasOA = condList.includes("OA=OD");
        const hasOB = condList.includes("OB=OC");
        const hasAngle = condList.includes("∠AOB=∠DOC");

        const condsValid = hasOA && hasOB && hasAngle;
        const postValid = post === "SAS";
        const concValid = conc === "△OAB ≅ △ODC"; // 严格检查字母序列
        const deductValid = deduct === "AB=CD" || deduct === "∠A=∠D";

        if (condsValid && postValid && concValid && deductValid) {
            isCorrect = true;
        } else {
            if (!condsValid) errorSlots.push("slot-cond-1", "slot-cond-2", "slot-cond-3");
            if (!postValid) errorSlots.push("slot-postulate");
            if (!concValid) errorSlots.push("slot-conclusion");
            if (!deductValid) errorSlots.push("slot-deduction");
        }
    } 
    else if (activeTab === "common-side") {
        // 公共边模型：支持三条推理线 (SSS / SAS / ASA)
        const hasCommon = condList.includes("公共边 AB=BA");
        
        // 1. SSS 判定线
        const isSSS_Cond = hasCommon && condList.includes("AC=BD") && condList.includes("BC=AD");
        const isSSS_Chain = isSSS_Cond && post === "SSS";

        // 2. SAS 判定线
        const isSAS_Cond = hasCommon && condList.includes("AC=BD") && condList.includes("∠CAB=∠DBA");
        const isSAS_Chain = isSAS_Cond && post === "SAS";

        // 3. ASA 判定线
        const isASA_Cond = hasCommon && condList.includes("∠CAB=∠DBA") && condList.includes("∠CBA=∠DAB");
        const isASA_Chain = isASA_Cond && post === "ASA";

        const concValid = conc === "△ABC ≅ △BAD";
        const deductValid = deduct === "∠C=∠D";

        if ((isSSS_Chain || isSAS_Chain || isASA_Chain) && concValid && deductValid) {
            isCorrect = true;
        } else {
            // 条件与定理是否成套匹配检查
            const condsValid = isSSS_Cond || isSAS_Cond || isASA_Cond;
            const postValid = (isSSS_Cond && post === "SSS") || (isSAS_Cond && post === "SAS") || (isASA_Cond && post === "ASA");
            
            if (!condsValid) errorSlots.push("slot-cond-1", "slot-cond-2", "slot-cond-3");
            if (!postValid) errorSlots.push("slot-postulate");
            if (!concValid) errorSlots.push("slot-conclusion");
            if (!deductValid) errorSlots.push("slot-deduction");
        }
    } 
    else if (activeTab === "kite-hl") {
        // 直角风筝模型判定 (HL)
        const hasOP = condList.includes("公共斜边 OP=OP");
        const hasLeg = condList.includes("直角边 OA=OB") || condList.includes("对应直角边 PA=PB");
        const hasRight = condList.includes("直角 ∠OAP=∠OBP=90°");

        const condsValid = hasOP && hasLeg && hasRight;
        const postValid = post === "HL";
        const concValid = conc === "△OAP ≅ △OBP";
        
        // 性质推导：如果已知条件用了 OA=OB，则推导只能用 PA=PB；反之亦然。还有角平分线可选。
        let deductValid = deduct === "角平分线 ∠AOP=∠BOP";
        if (condList.includes("直角边 OA=OB") && deduct === "对应直角边 PA=PB") deductValid = true;
        if (condList.includes("对应直角边 PA=PB") && deduct === "直角边 OA=OB") deductValid = true;

        if (condsValid && postValid && concValid && deductValid) {
            isCorrect = true;
        } else {
            if (!condsValid) errorSlots.push("slot-cond-1", "slot-cond-2", "slot-cond-3");
            if (!postValid) errorSlots.push("slot-postulate");
            if (!concValid) errorSlots.push("slot-conclusion");
            if (!deductValid) errorSlots.push("slot-deduction");
        }
    }

    if (isCorrect) {
        resultStatusCard.className = "result-status-card success";
        resultStatusIcon.className = "fa-solid fa-circle-check";
        resultStatusText.innerHTML = "🎉 逻辑闭环成功！已知条件已形成电网连通，全等证明完全成立！";
        setCoachFeedback("success", "证明链闭合成功：条件、判定、结论和性质推导已经连成一条完整路径。", [
            "条件断点：已消除，三个条件能组成当前判定。",
            `判定断点：已消除，${post} 与条件组匹配。`,
            "结论断点：已消除，三角形对应顺序正确。",
            "性质断点：已消除，推导来自全等三角形对应边角。"
        ]);

        // 清理原有定时器
        laserTimerIds.forEach(id => clearTimeout(id));
        laserTimerIds = [];

        // 渐进连线点亮动画 (Sequential Laser Flow)
        document.querySelectorAll(".drop-zone").forEach(slot => {
            slot.classList.remove("error", "correct");
        });

        // 1. 条件点亮
        laserStep = 1;
        document.getElementById("slot-cond-1").classList.add("correct");
        document.getElementById("slot-cond-2").classList.add("correct");
        document.getElementById("slot-cond-3").classList.add("correct");
        drawFlowLines(false);
        playClickSound();

        // 2. 定理点亮 (600ms后)
        laserTimerIds.push(setTimeout(() => {
            laserStep = 2;
            document.getElementById("slot-postulate").classList.add("correct");
            drawFlowLines(false);
            playClickSound();
        }, 600));

        // 3. 结论点亮 (1200ms后)
        laserTimerIds.push(setTimeout(() => {
            laserStep = 3;
            document.getElementById("slot-conclusion").classList.add("correct");
            drawFlowLines(false);
            playClickSound();
        }, 1200));

        // 4. 性质推导点亮 (1800ms后)
        laserTimerIds.push(setTimeout(() => {
            laserStep = 4;
            document.getElementById("slot-deduction").classList.add("correct");
            drawFlowLines(true);
            playSuccessSound();
            // 显示全等合体演示按钮
            document.getElementById("btn-play-overlap").style.display = "flex";
        }, 1800));
    } else {
        resultStatusCard.className = "result-status-card fail";
        resultStatusIcon.className = "fa-solid fa-circle-xmark";
        resultStatusText.innerHTML = "❌ 证明链存在断点，请根据下方提示逐环修正。";
        setCoachFeedback("fail", "证明链存在断点，优先修正红色卡槽对应的证明环节。", buildFailureDetails(errorSlots, condList, post, conc, deduct));
        playErrorSound();

        // 标记错误卡槽
        document.querySelectorAll(".drop-zone").forEach(slot => {
            if (errorSlots.includes(slot.id)) {
                slot.classList.add("error");
            } else {
                slot.classList.add("correct");
            }
        });
        drawFlowLines(false, errorSlots);
    }
}

// --------------------------------------------------------------------------
// 4.3 动态流程引线绘制引擎 (Flow Chart Connection Lines)
// --------------------------------------------------------------------------
function drawFlowLines(isSuccess = false, errorSlots = []) {
    flowSvg.innerHTML = "";
    const workspaceRect = document.getElementById("flow-workspace").getBoundingClientRect();

    const getCenterOfElement = (elId, position = "center") => {
        const el = document.getElementById(elId);
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        
        const relativeX = rect.left - workspaceRect.left;
        const relativeY = rect.top - workspaceRect.top;

        if (position === "bottom") {
            return { x: relativeX + rect.width / 2, y: relativeY + rect.height };
        } else if (position === "top") {
            return { x: relativeX + rect.width / 2, y: relativeY };
        }
        return { x: relativeX + rect.width / 2, y: relativeY + rect.height / 2 };
    };

    const drawLine = (fromId, toId, fromPos, toPos, isActive, isErr) => {
        const p1 = getCenterOfElement(fromId, fromPos);
        const p2 = getCenterOfElement(toId, toPos);

        // 采用贝塞尔曲线，画出科技感的弧线
        const midY = (p1.y + p2.y) / 2;
        const pathData = `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;

        // 1. 底层大光晕线
        let glowClass = "flow-line-glow";
        if (isActive) glowClass += " active";
        if (isErr) glowClass += " error";
        flowSvg.appendChild(createSVGNode("path", {
            d: pathData,
            class: glowClass
        }));

        // 2. 表层纤细高能流光芯线
        let coreClass = "flow-line-core";
        if (isActive) coreClass += " active";
        if (isErr) coreClass += " error";
        flowSvg.appendChild(createSVGNode("path", {
            d: pathData,
            class: coreClass
        }));
    };

    const condSlots = ["slot-cond-1", "slot-cond-2", "slot-cond-3"];
    const postSlot = "slot-postulate";
    const concSlot = "slot-conclusion";
    const deductSlot = "slot-deduction";

    // 1. 已知条件 连线 -> 判定方法
    condSlots.forEach(condId => {
        const isFilled = slots[condId] && slots[postSlot];
        const isErr = errorSlots.includes(condId) || errorSlots.includes(postSlot);
        const isActive = isSuccess || (laserStep >= 1) || (isFilled && !isErr);
        drawLine(condId, postSlot, "bottom", "top", isActive, isErr);
    });

    // 2. 判定方法 连线 -> 全等结论
    const isPostConcFilled = slots[postSlot] && slots[concSlot];
    const isPostConcErr = errorSlots.includes(postSlot) || errorSlots.includes(concSlot);
    const isPostConcActive = isSuccess || (laserStep >= 2) || (isPostConcFilled && !isPostConcErr);
    drawLine(postSlot, concSlot, "bottom", "top", isPostConcActive, isPostConcErr);

    // 3. 全等结论 连线 -> 性质导出
    const isConcDeductFilled = slots[concSlot] && slots[deductSlot];
    const isConcDeductErr = errorSlots.includes(concSlot) || errorSlots.includes(deductSlot);
    const isConcDeductActive = isSuccess || (laserStep >= 3) || (isConcDeductFilled && !isConcDeductErr);
    drawLine(concSlot, deductSlot, "bottom", "top", isConcDeductActive, isConcDeductErr);
}

function resetPuzzle() {
    hoveredTerm = null;
    activeFeedbackTerms = [];
    activeSlotId = null;
    Object.keys(slots).forEach(slotId => {
        removeSlotContent(slotId);
    });
    
    // 重置并隐藏全等合体演示按钮
    if (overlapTimerId) {
        clearInterval(overlapTimerId);
        overlapTimerId = null;
    }
    isAnimatingOverlap = false;
    overlapProgress = 0.0;
    
    const playOverlapBtn = document.getElementById("btn-play-overlap");
    if (playOverlapBtn) {
        playOverlapBtn.style.display = "none";
        playOverlapBtn.innerHTML = `<i class="fa-solid fa-play"></i> 🎬 演示全等合体重叠`;
    }

    resetStatusBar();
    drawFlowLines();
    updateSlotHighlights();
    updateLinkedUi();
}

// ==========================================================================
// 5. 拖拽几何控制点解算限幅逻辑
// ==========================================================================
function initDragEvents() {
    let activePointerId = null;

    function getSvgPointFromEvent(e) {
        const point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const matrix = svg.getScreenCTM();
        if (!matrix) return { x: 0, y: 0 };
        return point.matrixTransform(matrix.inverse());
    }

    function getCurrentDragPointPosition(id) {
        const outer = document.querySelector(`#${id} .drag-point-outer`);
        if (!outer) return null;
        return {
            x: Number(outer.getAttribute("cx")),
            y: Number(outer.getAttribute("cy"))
        };
    }

    function updateDragPosition(pos) {
        const dragPos = dragOffset ? {
            x: pos.x + dragOffset.x,
            y: pos.y + dragOffset.y
        } : pos;

        if (activeTab === "butterfly") {
            const data = state.butterfly;
            if (activeDragId === "drag-A") {
                // 计算 A 到 O 的方向向量与长度
                const dx = dragPos.x - data.O.x;
                const dy = dragPos.y - data.O.y;
                const len = Math.max(50, Math.min(180, Math.sqrt(dx*dx + dy*dy)));
                data.u1 = { x: -dx / len, y: -dy / len };
                data.lenA = len;
                renderButterfly();
            } else if (activeDragId === "drag-B") {
                const dx = dragPos.x - data.O.x;
                const dy = dragPos.y - data.O.y;
                const len = Math.max(50, Math.min(180, Math.sqrt(dx*dx + dy*dy)));
                data.u2 = { x: -dx / len, y: -dy / len };
                data.lenB = len;
                renderButterfly();
            }
        } 
        else if (activeTab === "common-side" && activeDragId === "drag-C") {
            const data = state.commonSide;
            // 限幅 C.x 在对称中轴左侧 (200 到 295)
            data.C.x = Math.max(160, Math.min(295, dragPos.x));
            data.C.y = Math.max(80, Math.min(220, dragPos.y));
            renderCommonSide();
        } 
        else if (activeTab === "kite-hl" && activeDragId === "drag-A") {
            const data = state.kiteHl;
            const centerM = { x: (data.O.x + data.P.x)/2, y: (data.O.y + data.P.y)/2 };
            // 计算角度 theta (限制在上方半圆内)
            const rad = Math.atan2(dragPos.y - centerM.y, dragPos.x - centerM.x);
            let deg = radToDeg(rad);
            if (deg > 180) deg -= 360;
            // 限幅在 -155 到 -25 之间
            data.theta = Math.max(-155, Math.min(-25, deg));
            renderKiteHl();
        }
    }

    svg.addEventListener("pointerdown", (e) => {
        const target = e.target.closest(".drag-point");
        if (!target) return;
        e.preventDefault();
        activeDragId = target.id;
        activePointerId = e.pointerId;
        svg.setPointerCapture?.(e.pointerId);
        const pointerPos = getSvgPointFromEvent(e);
        const currentPos = getCurrentDragPointPosition(activeDragId);
        dragOffset = currentPos ? {
            x: currentPos.x - pointerPos.x,
            y: currentPos.y - pointerPos.y
        } : null;
        playClickSound();
    });

    svg.addEventListener("pointermove", (e) => {
        if (!activeDragId || activePointerId !== e.pointerId) return;
        e.preventDefault();
        updateDragPosition(getSvgPointFromEvent(e));
    });

    const endPointerDrag = (e) => {
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        if (activePointerId !== null) svg.releasePointerCapture?.(activePointerId);
        activeDragId = null;
        activePointerId = null;
        dragOffset = null;
    };

    svg.addEventListener("pointerup", endPointerDrag);
    svg.addEventListener("pointercancel", endPointerDrag);
}

// ==========================================================================
// 6. 音频与反馈系统
// ==========================================================================
function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playSuccessSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // 双音和弦，清脆悦耳
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.35);
    osc2.stop(audioCtx.currentTime + 0.35);
}

function playErrorSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime); // 低音
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
}

// ==========================================================================
// 7. 初始化与关卡切换
// ==========================================================================
function renderActiveTab() {
    if (activeTab === "butterfly") {
        renderButterfly();
    } else if (activeTab === "common-side") {
        renderCommonSide();
    } else if (activeTab === "kite-hl") {
        renderKiteHl();
    }
}

function switchTab(tabId) {
    activeTab = tabId;
    hoveredTerm = null;
    activeFeedbackTerms = [];
    activeSlotId = null;

    // 清除运行中的动画与渐进电线定时器
    if (overlapTimerId) {
        clearInterval(overlapTimerId);
        overlapTimerId = null;
    }
    isAnimatingOverlap = false;
    overlapProgress = 0.0;

    laserTimerIds.forEach(id => clearTimeout(id));
    laserTimerIds = [];
    laserStep = 0;

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        }
    });

    const levelGuideTexts = {
        "butterfly": "💡 当前探索：关卡 1 - 蝴蝶对顶角全等模型 (SAS)",
        "common-side": "💡 当前探索：关卡 2 - 叠合公共边全等模型 (ASA/AAS/SSS)",
        "kite-hl": "💡 当前探索：关卡 3 - 直角风筝全等模型 (HL)"
    };
    stepGuideIndicator.innerHTML = levelGuideTexts[tabId];

    // 重置推理槽
    resetPuzzle();
    updateLessonGoal();
    // 加载卡片与思维说明
    loadCardBank();
    renderActiveTab();
    hudContent.innerHTML = levelsData[tabId].hint;
    
    // 强制重绘连线确保插槽相对位置被精确捕获
    setTimeout(() => drawFlowLines(), 100);
    setTimeout(() => applyPlatformPanelCompaction(), 120);
}

function init() {
    document.addEventListener("contextmenu", (e) => {
        if (e.target.closest(".control-panel, .sandbox-area")) e.preventDefault();
    });
    document.addEventListener("selectstart", (e) => {
        if (e.target.closest(".control-panel, .sandbox-area")) e.preventDefault();
    });
    document.addEventListener("dragstart", (e) => {
        if (e.target.closest(".control-panel, .sandbox-area") && !e.target.closest(".proof-card")) {
            e.preventDefault();
        }
    });

    btnHudToggle.addEventListener("click", () => {
        hudCard.classList.toggle("collapsed");
        playClickSound();
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const tab = e.target.getAttribute("data-tab");
            playClickSound();
            switchTab(tab);
        });
    });

    // 绑定重置与验证按钮
    btnResetPuzzle.addEventListener("click", () => {
        playClickSound();
        resetPuzzle();
    });
    btnVerifyPuzzle.addEventListener("click", () => {
        playClickSound();
        verifyProofChain();
    });

    // 绑定全等合体演示按钮
    document.getElementById("btn-play-overlap").addEventListener("click", () => {
        isAnimatingOverlap = !isAnimatingOverlap;
        playClickSound();

        const btn = document.getElementById("btn-play-overlap");
        if (isAnimatingOverlap) {
            btn.innerHTML = `<i class="fa-solid fa-stop"></i> 🎬 停止全等合体`;
            btn.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
            btn.style.borderColor = "var(--color-red)";

            overlapProgress = 0.0;
            let dir = 1;
            overlapTimerId = setInterval(() => {
                overlapProgress += 0.015 * dir;
                if (overlapProgress >= 1.0) {
                    overlapProgress = 1.0;
                    dir = -1; // 往复
                } else if (overlapProgress <= 0.0) {
                    overlapProgress = 0.0;
                    dir = 1; // forward
                }
                renderActiveTab();
            }, 20);
        } else {
            if (overlapTimerId) {
                clearInterval(overlapTimerId);
                overlapTimerId = null;
            }
            overlapProgress = 0.0;
            btn.innerHTML = `<i class="fa-solid fa-play"></i> 🎬 演示全等合体重叠`;
            btn.style.backgroundColor = "rgba(245, 158, 11, 0.08)";
            btn.style.borderColor = "var(--color-orange)";
            renderActiveTab();
        }
    });

    drawGrid();
    initDragEvents();
    initSlotsDragEvents();
    switchTab("butterfly");
    applyPlatformPanelCompaction();

    // 窗口尺寸变化时自适应重绘连线
    window.addEventListener("resize", () => {
        drawFlowLines();
        applyPlatformPanelCompaction();
    });
}

document.addEventListener("DOMContentLoaded", init);

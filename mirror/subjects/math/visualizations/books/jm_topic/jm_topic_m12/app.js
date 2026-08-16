// ==========================================================================
// 相似证明链金牌实验室 - 核心控制引擎 (app.js)
// ==========================================================================

// 1. 全局配置与状态数据
const svg = document.getElementById("geometry-svg");
const drawingLayer = document.getElementById("geometry-drawing-layer");
const controlsLayer = document.getElementById("geometry-controls-layer");
const gridLayer = document.getElementById("svg-grid-layer");

const hudCard = document.getElementById("analysis-hud-card");
const btnHudToggle = document.getElementById("btn-hud-toggle");
const hudContent = document.getElementById("hud-content-body");

const tabContainer = document.querySelector(".tab-grid");
const stepGuideIndicator = document.getElementById("step-guide-indicator");

const cardBankGrid = document.getElementById("card-bank-grid");
const flowSvg = document.getElementById("flow-svg");

const resultStatusCard = document.getElementById("result-status-card");
const resultStatusIcon = document.getElementById("result-status-icon");
const resultStatusText = document.getElementById("result-status-text");
const proofHintText = document.getElementById("proof-hint-text");

const btnVerifyPuzzle = document.getElementById("btn-verify-puzzle");
const btnResetPuzzle = document.getElementById("btn-reset-puzzle");
const btnPlayOverlap = document.getElementById("btn-play-overlap");

let activeTab = "parallel"; // "parallel" | "projection" | "k-shape"
let activeDragId = null;
let dragOffset = { x: 0, y: 0 };
let activeSlotId = null; // 当前点击选中的插槽，支持触屏点击式填充
let currentHintLevel = 0;
let lastTouchDragStartedAt = 0;

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
    // 平行线A字相似模型 (A-Shape)
    parallel: {
        A: { x: 300, y: 70 },
        B: { x: 150, y: 350 },
        C: { x: 450, y: 350 },
        t: 0.55 // 截线 DE 的高度比例 [0.25, 0.9]
    },
    // 双直角射影定理模型 (Projection)
    projection: {
        O: { x: 140, y: 330 }, // 斜边端点 A
        P: { x: 460, y: 330 }, // 斜边端点 B
        theta: -65 // 顶点 C 的圆心夹角，保证 ACB 永远是精确的直角 (在 -165 到 -15 度之间)
    },
    // 一线三等角K字相似模型 (K-Shape)
    kShape: {
        A: { x: 120, y: 330 }, // 左直角顶点
        B: { x: 480, y: 330 }, // 右直角顶点
        P: { x: 260, y: 330 }, // 基线上转折点
        hE: 140 // 左侧 E 高度 (E.y = A.y - hE)
    }
};

// 1.2 关卡条件数据库与文案设计 (含 KaTeX 语法支撑)
const levelsData = {
    parallel: {
        title: "A字/平行相似模型",
        hint: `
            <h3>A 字平行相似解题板书</h3>
            <p><strong>性质概要：</strong>在 △ABC 中，若 DE∥BC，则小三角形 △ADE 与大三角形 △ABC 保持对应角相等、对应边成比例。</p>
            <p><strong>判定路径：</strong>先抓平行线给出的同位角，再配合公共角，用 AA 判定完成相似。</p>
            <p><strong>证明关键：</strong></p>
            <ul>
                <li><strong>角关系</strong>：DE∥BC，所以 ∠ADE = ∠B，∠AED = ∠C。</li>
                <li><strong>公共角</strong>：∠A = ∠A，和任意一组同位角即可组成 AA。</li>
                <li><strong>核心结论</strong>：△ADE ∽ △ABC，对应边 AD / AB = AE / AC = DE / BC。</li>
            </ul>
        `,
        cards: [
            { type: "cond", text: "平行条件 DE∥BC", term: "DE∥BC" },
            { type: "cond", text: "同位角相等 ∠ADE=∠B", term: "∠ADE=∠B" },
            { type: "cond", text: "同位角相等 ∠AED=∠C", term: "∠AED=∠C" },
            { type: "cond", text: "公共角 ∠A=∠A", term: "∠A=∠A" },
            { type: "post", text: "平行相似定理", term: "平行相似定理" },
            { type: "post", text: "AA 相似判定", term: "AA相似" },
            { type: "post", text: "SAS 相似判定", term: "SAS相似" },
            { type: "conc", text: "相似结论 △ADE ∽ △ABC", term: "△ADE ∽ △ABC" },
            { type: "deduct", text: "比例边 AD/AB = AE/AC = DE/BC", term: "比例三边" },
            { type: "deduct", text: "比例截线 AD/DB = AE/EC", term: "比例截线" }
        ]
    },
    projection: {
        title: "双直角射影定理模型",
        hint: `
            <h3>双直角射影定理解题板书</h3>
            <p><strong>性质概要：</strong>直角三角形作斜边上的高，会把原三角形分成两个小直角三角形，三个三角形两两相似。</p>
            <p><strong>判定路径：</strong>优先找公共直角，再用余角相等或公共锐角补齐第二组等角，最后用 AA 判定。</p>
            <p><strong>证明关键：</strong></p>
            <ul>
                <li><strong>左侧相似</strong>：∠ADC = ∠ACB = 90°，再配合 ∠A = ∠A，可得 △ACD ∽ △ABC。</li>
                <li><strong>右侧相似</strong>：∠CDB = ∠ACB = 90°，再配合 ∠B = ∠B，可得 △CBD ∽ △ABC。</li>
                <li><strong>核心结论</strong>：△ACD ∽ △CBD ∽ △ABC，常用乘积式为 CD² = AD × BD。</li>
            </ul>
        `,
        cards: [
            { type: "cond", text: "直角 ∠ACB=90°", term: "∠ACB=90°" },
            { type: "cond", text: "垂线高 CD⊥AB", term: "CD⊥AB" },
            { type: "cond", text: "余角转换 ∠ACD=∠B", term: "∠ACD=∠B" },
            { type: "cond", text: "等角 ∠A=∠BCD", term: "∠A=∠BCD" },
            { type: "post", text: "AA 相似判定", term: "AA相似" },
            { type: "conc", text: "高分割相似 △ACD ∽ △CBD", term: "△ACD ∽ △CBD" },
            { type: "conc", text: "左侧相似 △ACD ∽ △ABC", term: "△ACD ∽ △ABC" },
            { type: "conc", text: "右侧相似 △CBD ∽ △ABC", term: "△CBD ∽ △ABC" },
            { type: "deduct", text: "射影高 CD² = AD·BD", term: "CD² = AD·BD" },
            { type: "deduct", text: "射影左边 AC² = AD·AB", term: "AC² = AD·AB" },
            { type: "deduct", text: "射影右边 BC² = BD·AB", term: "BC² = BD·AB" }
        ]
    },
    "k-shape": {
        title: "一线三等角K字型相似",
        hint: `
            <h3>K 字型相似解题板书</h3>
            <p><strong>性质概要：</strong>A、P、B 在同一直线上，AE、BD 都垂直于底线，且 EP⊥DP，图形形成一组对应边方向明确的直角三角形。</p>
            <p><strong>判定路径：</strong>先锁定 ∠A = ∠B = 90°，再利用两角的两边分别垂直推出第二组锐角相等，最后用 AA 判定。</p>
            <p><strong>证明关键：</strong></p>
            <ul>
                <li><strong>直角条件</strong>：∠A = ∠B = 90°；构造中还有 ∠EPD = 90°。</li>
                <li><strong>等角转化</strong>：EA⊥PB，EP⊥PD，所以 ∠AEP = ∠BPD。</li>
                <li><strong>核心结论</strong>：△AEP ∽ △BPD，对应边 AE / BP = AP / BD，等价于 AP × BP = AE × BD。</li>
            </ul>
        `,
        cards: [
            { type: "cond", text: "底线双直角 ∠A=∠B=90°", term: "∠A=∠B=90°" },
            { type: "cond", text: "平角中直角 ∠EPD=90°", term: "∠EPD=90°" },
            { type: "cond", text: "垂直转角 ∠AEP=∠BPD", term: "∠AEP=∠BPD" },
            { type: "cond", text: "垂直转角 ∠APE=∠BDP", term: "∠APE=∠BDP" },
            { type: "post", text: "AA 相似判定", term: "AA相似" },
            { type: "conc", text: "K型相似 △AEP ∽ △BPD", term: "△AEP ∽ △BPD" },
            { type: "deduct", text: "比例式 AE/BP = AP/BD", term: "AE/BP = AP/BD" },
            { type: "deduct", text: "乘积式 AP·BP = AE·BD", term: "AP·BP = AE·BD" }
        ]
    }
};

const proofHintSteps = {
    parallel: [
        "先看 DE 是否平行 BC：平行能直接给出对应角或平行相似。",
        "两条路任选一条：DE∥BC + 平行相似定理，或两组等角 + AA 相似。",
        "完整链路示例：DE∥BC → 平行相似定理 → △ADE ∽ △ABC → AD/AB = AE/AC = DE/BC。"
    ],
    projection: [
        "先找三个直角三角形：大三角形和斜边高分出的两个小三角形。",
        "射影模型靠 AA：直角相等，再用余角关系补第二组角。",
        "完整链路示例：∠ACB=90°、CD⊥AB、∠ACD=∠B → AA → △ACD ∽ △CBD → CD² = AD·BD。"
    ],
    "k-shape": [
        "先看底线两端的直角，再观察构造出的 ∠EPD=90°。",
        "EA⊥PB、EP⊥PD，所以 ∠AEP 与 ∠BPD 的两边分别垂直，从而两角相等。",
        "完整链路示例：∠A=∠B=90°、∠EPD=90°、∠AEP=∠BPD → AA → △AEP ∽ △BPD → AE/BP = AP/BD。"
    ]
};

// ==========================================================================
// 2. 几何数学算子辅助
// ==========================================================================
function getDistance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

// 绘制自适应夹角弧线扫掠判定 (Prevent flip sweep-flag)
function getAngleArcPath(center, pt1, pt2, radius) {
    const angle1 = Math.atan2(pt1.y - center.y, pt1.x - center.x);
    const angle2 = Math.atan2(pt2.y - center.y, pt2.x - center.x);

    let diff = angle2 - angle1;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    const startX = center.x + radius * Math.cos(angle1);
    const startY = center.y + radius * Math.sin(angle1);
    const endX = center.x + radius * Math.cos(angle1 + diff);
    const endY = center.y + radius * Math.sin(angle1 + diff);

    const sweepFlag = diff > 0 ? 1 : 0;
    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweepFlag} ${endX} ${endY}`;
}

// 绘制精准的直角标志
function drawRightAngle(corner, pt1, pt2, size = 10) {
    const getUnitVector = (from, to) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        return { x: dx / len, y: dy / len };
    };

    const u1 = getUnitVector(corner, pt1);
    const u2 = getUnitVector(corner, pt2);

    const p1 = { x: corner.x + u1.x * size, y: corner.y + u1.y * size };
    const p2 = { x: p1.x + u2.x * size, y: p1.y + u2.y * size };
    const p3 = { x: corner.x + u2.x * size, y: corner.y + u2.y * size };

    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;
}

function createSVGNode(type, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
}

function getFilledTerms() {
    return Object.values(slots)
        .filter(Boolean)
        .map(card => card.term || card.text)
        .filter(Boolean);
}

function isLinkedTerm(...terms) {
    const filledTerms = getFilledTerms();
    return terms.some(term => term && (
        hoveredTerm === term ||
        activeFeedbackTerms.includes(term) ||
        filledTerms.includes(term)
    ));
}

function setActiveFeedbackTerms(terms = []) {
    activeFeedbackTerms = Array.from(new Set(terms.filter(Boolean)));
    syncLinkedHighlights();
    renderActiveTab();
}

function getSlotTerm(slotId) {
    return slots[slotId]?.term || slots[slotId]?.text || "";
}

function syncLinkedHighlights() {
    const activeSet = new Set([hoveredTerm, ...activeFeedbackTerms, ...getFilledTerms()].filter(Boolean));
    document.querySelectorAll(".proof-card").forEach(card => {
        const isLinked = activeSet.has(card.getAttribute("data-term")) || activeSet.has(card.textContent.trim());
        card.classList.toggle("linked", isLinked);
    });
    document.querySelectorAll(".drop-zone").forEach(slot => {
        const term = slot.getAttribute("data-term") || "";
        slot.classList.toggle("linked", activeSet.has(term) || activeSet.has(slot.textContent.trim()));
    });
}

function renderHintPanel(level = 0) {
    const hints = proofHintSteps[activeTab] || [];
    const normalizedLevel = Math.max(0, Math.min(hints.length, Number(level) || 0));
    currentHintLevel = normalizedLevel;
    document.querySelectorAll(".hint-step-btn").forEach(btn => {
        btn.classList.toggle("active", Number(btn.getAttribute("data-hint-level")) === normalizedLevel);
    });
    if (!proofHintText) return;
    if (normalizedLevel === 0) {
        proofHintText.textContent = "先独立拼证明链；卡住时按 1-2-3 逐级打开提示。";
        setActiveFeedbackTerms([]);
        return;
    }
    proofHintText.textContent = hints[normalizedLevel - 1] || "";
    const hintTerms = {
        parallel: [
            ["DE∥BC"],
            ["DE∥BC", "∠A=∠A", "∠ADE=∠B", "AA相似", "平行相似定理"],
            ["DE∥BC", "平行相似定理", "△ADE ∽ △ABC", "比例三边"]
        ],
        projection: [
            ["∠ACB=90°", "CD⊥AB"],
            ["∠ACB=90°", "CD⊥AB", "∠ACD=∠B", "AA相似"],
            ["∠ACB=90°", "CD⊥AB", "∠ACD=∠B", "AA相似", "△ACD ∽ △CBD", "CD² = AD·BD"]
        ],
        "k-shape": [
            ["∠A=∠B=90°", "∠EPD=90°"],
            ["∠A=∠B=90°", "∠EPD=90°", "∠AEP=∠BPD", "AA相似"],
            ["∠A=∠B=90°", "∠EPD=90°", "∠AEP=∠BPD", "AA相似", "△AEP ∽ △BPD", "AE/BP = AP/BD"]
        ]
    };
    setActiveFeedbackTerms(hintTerms[activeTab]?.[normalizedLevel - 1] || []);
}

// 2.2 可视化教学辅助渲染函数
function drawAngleRipples(vertex, color = "var(--color-purple)") {
    for (let i = 0; i < 3; i++) {
        drawingLayer.appendChild(createSVGNode("circle", {
            cx: vertex.x, cy: vertex.y,
            class: "angle-ripple",
            stroke: color,
            style: `animation-delay: ${i * 0.6}s`
        }));
    }
}

function drawLengthBubble(p1, p2, text) {
    const mid = { x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2 };
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const offset = 18;
    const perp = { x: -dy / len * offset, y: dx / len * offset };
    
    const x = mid.x + perp.x;
    const y = mid.y + perp.y;

    const w = text.length * 7 + 12;
    const h = 18;

    drawingLayer.appendChild(createSVGNode("rect", {
        x: x - w/2, y: y - h/2,
        width: w, height: h,
        class: "length-bubble-bg"
    }));
    const textNode = createSVGNode("text", {
        x: x, y: y,
        class: "length-bubble-text"
    });
    textNode.textContent = text;
    drawingLayer.appendChild(textNode);
}

function drawSimilarityRatioRuler(k, currentK = null) {
    return;
}
function drawLiveCalculator(formulas, statusText = "数值乘积恒定守恒") {
    // 平台画布在窄布局下会裁切 SVG 的最右侧，保持计算器在安全可见区内。
    const x = 348;
    const y = 24;
    const w = 174;
    const h = 100;

    drawingLayer.appendChild(createSVGNode("rect", {
        x: x, y: y, width: w, height: h,
        class: "calc-hud-bg"
    }));

    const title = createSVGNode("text", { x: x + 12, y: y + 18, class: "calc-hud-title" });
    title.textContent = "比例/乘积守恒";
    drawingLayer.appendChild(title);

    formulas.forEach((formula, idx) => {
        const valText = createSVGNode("text", {
            x: x + 12,
            y: y + 43 + idx * 20,
            class: "calc-hud-value",
            textLength: w - 24,
            lengthAdjust: "spacingAndGlyphs"
        });
        valText.textContent = formula;
        drawingLayer.appendChild(valText);
    });

    const status = createSVGNode("text", {
        x: x + 12,
        y: y + h - 13,
        class: "calc-hud-status",
        textLength: w - 24,
        lengthAdjust: "spacingAndGlyphs"
    });
    status.textContent = statusText;
    drawingLayer.appendChild(status);
}

function drawActiveTermBadge() {
    const term = hoveredTerm || (activeFeedbackTerms.length === 1 ? activeFeedbackTerms[0] : "");
    if (!term) return;
    const text = `已选：${String(term).slice(0, 30)}`;
    const width = Math.min(286, Math.max(132, text.length * 8 + 22));
    const x = 16;
    const y = 380;

    drawingLayer.appendChild(createSVGNode("rect", {
        x, y, width, height: 26, rx: 7,
        fill: "rgba(15, 23, 42, 0.88)",
        stroke: "rgba(250, 204, 21, 0.86)",
        "stroke-width": 1.2
    }));
    const label = createSVGNode("text", {
        x: x + 10, y: y + 17,
        fill: "#fef3c7",
        "font-size": "11px",
        "font-weight": "800"
    });
    label.textContent = text;
    drawingLayer.appendChild(label);
}

// ==========================================================================
// 3. 几何渲染核心函数
// ==========================================================================

// 3.1 A字平行相似模型渲染 (Parallel Lines)
function renderParallel() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.parallel;
    // 计算截线端点 D, E 坐标 (根据比例 t)
    const D = {
        x: data.A.x + (data.B.x - data.A.x) * data.t,
        y: data.A.y + (data.B.y - data.A.y) * data.t
    };
    const E = {
        x: data.A.x + (data.C.x - data.A.x) * data.t,
        y: data.A.y + (data.C.y - data.A.y) * data.t
    };

    // 检查联动与卡槽常亮高亮
    const activeConditions = [slots["slot-cond-1"]?.text, slots["slot-cond-2"]?.text, slots["slot-cond-3"]?.text];
    const isSimilarity = isLinkedTerm("平行相似定理", "AA相似", "△ADE ∽ △ABC", "相似结论 △ADE ∽ △ABC");
    const isParallel = isSimilarity || isLinkedTerm("DE∥BC", "平行条件 DE∥BC") || activeConditions.includes("平行条件 DE∥BC");
    const isAngleADE = isSimilarity || isLinkedTerm("∠ADE=∠B", "同位角相等 ∠ADE=∠B") || activeConditions.includes("同位角相等 ∠ADE=∠B");
    const isAngleAED = isSimilarity || isLinkedTerm("∠AED=∠C", "同位角相等 ∠AED=∠C") || activeConditions.includes("同位角相等 ∠AED=∠C");
    const isAngleA = isSimilarity || isLinkedTerm("∠A=∠A", "公共角 ∠A=∠A") || activeConditions.includes("公共角 ∠A=∠A");
    const isDeductRatio = isLinkedTerm("比例三边", "比例边 AD/AB = AE/AC = DE/BC") || slots["slot-deduction"]?.text === "比例边 AD/AB = AE/AC = DE/BC";
    const isDeductLine = isLinkedTerm("比例截线", "比例截线 AD/DB = AE/EC") || slots["slot-deduction"]?.text === "比例截线 AD/DB = AE/EC";
    // 选中比例性质时，DE 与 BC 必须以实体线显示，不能只依赖可能被适配器裁切的通用脉冲效果。
    const showParallelPair = isParallel || isDeductRatio || isDeductLine;

    // 绘制填充三角形 ADE 和 ABC (底层颜色)
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.A.x},${data.A.y} ${D.x},${D.y} ${E.x},${E.y}`,
        fill: "rgba(59, 130, 246, 0.03)", stroke: "none"
    }));
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${D.x},${D.y} ${data.B.x},${data.B.y} ${data.C.x},${data.C.y} ${E.x},${E.y}`,
        fill: "rgba(16, 185, 129, 0.01)", stroke: "none"
    }));

    // 绘制三角形外框线 (ABC)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.A.x, y1: data.A.y, x2: data.B.x, y2: data.B.y,
        class: `geo-line model-outline ${isDeductLine || isDeductRatio ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.A.x, y1: data.A.y, x2: data.C.x, y2: data.C.y,
        class: `geo-line model-outline ${isDeductLine || isDeductRatio ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.B.x, y1: data.B.y, x2: data.C.x, y2: data.C.y,
        class: `geo-line ${showParallelPair ? 'blue parallel-relation-active' : ''}`,
        stroke: showParallelPair ? "var(--color-blue)" : "#94a3b8",
        "stroke-width": showParallelPair ? 3.0 : 1.5
    }));

    // 绘制平行截线 DE (蓝色/高亮蓝色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: D.x, y1: D.y, x2: E.x, y2: E.y,
        class: `geo-line blue ${showParallelPair ? 'parallel-relation-active' : ''}`, "stroke-width": showParallelPair ? 3.4 : 2.2
    }));

    // 绘制平行符号双向箭头 (在 DE 和 BC 居中位置)
    const drawArrow = (p1, p2, color = "var(--color-blue)") => {
        const mid = { x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2 };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const u = { x: dx/len, y: dy/len };
        const perp = { x: -dy/len, y: dx/len };

        drawingLayer.appendChild(createSVGNode("path", {
            d: `M ${mid.x - u.x*6 - perp.x*4} ${mid.y - u.y*6 - perp.y*4} L ${mid.x + u.x*2} ${mid.y + u.y*2} L ${mid.x - u.x*6 + perp.x*4} ${mid.y - u.y*6 + perp.y*4}`,
            fill: "none", stroke: color, "stroke-width": 1.8
        }));
    };
    if (showParallelPair) {
        drawArrow(D, E, "var(--color-blue)");
        drawArrow(data.B, data.C, "var(--color-blue)");
        const midDE = { x: (D.x + E.x) / 2, y: (D.y + E.y) / 2 };
        const midBC = { x: (data.B.x + data.C.x) / 2, y: (data.B.y + data.C.y) / 2 };
        const label = { x: (midDE.x + midBC.x) / 2, y: (midDE.y + midBC.y) / 2 };
        drawingLayer.appendChild(createSVGNode("rect", {
            x: label.x - 34, y: label.y - 14, width: 68, height: 24,
            class: "parallel-relation-label-bg"
        }));
        const parallelText = createSVGNode("text", {
            x: label.x, y: label.y + 3,
            class: "parallel-relation-label",
            "text-anchor": "middle"
        });
        parallelText.textContent = "DE ∥ BC";
        drawingLayer.appendChild(parallelText);
    }

    // 绘制对应同位角弧度
    // 1. ∠ADE 和 ∠B (紫色)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(D, E, data.A, 16),
        fill: "none", stroke: "var(--color-purple)", "stroke-width": 1.5,
        filter: isAngleADE ? "url(#neon-glow)" : "",
        opacity: isAngleADE ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.B, data.C, data.A, 16),
        fill: "none", stroke: "var(--color-purple)", "stroke-width": 1.5,
        filter: isAngleADE ? "url(#neon-glow)" : "",
        opacity: isAngleADE ? 1.0 : 0.4
    }));

    // 2. ∠AED 和 ∠C (橙色)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(E, data.A, D, 16),
        fill: "none", stroke: "var(--color-orange)", "stroke-width": 1.5,
        filter: isAngleAED ? "url(#neon-glow)" : "",
        opacity: isAngleAED ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.C, data.A, data.B, 16),
        fill: "none", stroke: "var(--color-orange)", "stroke-width": 1.5,
        filter: isAngleAED ? "url(#neon-glow)" : "",
        opacity: isAngleAED ? 1.0 : 0.4
    }));

    // 3. 公共角 ∠A (绿色)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.A, data.B, data.C, 18),
        fill: "none", stroke: "var(--color-green)", "stroke-width": 1.5,
        filter: isAngleA ? "url(#neon-glow)" : "",
        opacity: isAngleA ? 1.0 : 0.3
    }));

    // 绘制等角微波纹动画
    if (isAngleADE) {
        drawAngleRipples(D, "var(--color-purple)");
        drawAngleRipples(data.B, "var(--color-purple)");
    }
    if (isAngleAED) {
        drawAngleRipples(E, "var(--color-orange)");
        drawAngleRipples(data.C, "var(--color-orange)");
    }
    if (isAngleA) {
        drawAngleRipples(data.A, "var(--color-green)");
    }

    // 绘制文字标号
    drawingLayer.appendChild(createSVGNode("text", { x: data.A.x - 6, y: data.A.y - 10, class: "geo-text" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: data.B.x - 14, y: data.B.y + 14, class: "geo-text" })).textContent = "B";
    drawingLayer.appendChild(createSVGNode("text", { x: data.C.x + 6, y: data.C.y + 14, class: "geo-text" })).textContent = "C";
    drawingLayer.appendChild(createSVGNode("text", { x: D.x - 14, y: D.y + 4, class: "geo-text blue" })).textContent = "D";
    drawingLayer.appendChild(createSVGNode("text", { x: E.x + 6, y: E.y + 4, class: "geo-text blue" })).textContent = "E";

    // 3.1.99 绘制全等/相似合体克隆三角形 (Similarity Dilation /位似放大动画)
    let currentScale = null;
    if (isAnimatingOverlap && overlapProgress > 0) {
        // 放缩因子 s: 从 1.0 (ADE尺寸) 渐变到 1.0/t (ABC尺寸)
        const targetScale = 1.0 / data.t;
        const s = 1.0 + (targetScale - 1.0) * overlapProgress;
        currentScale = s * data.t; // 反映当前缩放对齐的相似比

        const scalePoint = (pt) => {
            const dx = pt.x - data.A.x;
            const dy = pt.y - data.A.y;
            return {
                x: data.A.x + dx * s,
                y: data.A.y + dy * s
            };
        };

        const dilD = scalePoint(D);
        const dilE = scalePoint(E);

        // 绘制金橙色半透明位似放大三角形
        drawingLayer.appendChild(createSVGNode("polygon", {
            points: `${data.A.x},${data.A.y} ${dilD.x},${dilD.y} ${dilE.x},${dilE.y}`,
            fill: "rgba(245, 158, 11, 0.4)", stroke: "var(--color-orange)", "stroke-width": 1.8,
            filter: "url(#neon-glow)"
        }));

        drawingLayer.appendChild(createSVGNode("text", { x: dilD.x - 14, y: dilD.y + 4, class: "geo-text orange geo-text-pulse" })).textContent = "D'";
        drawingLayer.appendChild(createSVGNode("text", { x: dilE.x + 6, y: dilE.y + 4, class: "geo-text orange geo-text-pulse" })).textContent = "E'";
    }

    // 渲染相似比动态量尺板
    drawSimilarityRatioRuler(data.t, currentScale);

    // 渲染性质推导长度与动态计算器
    const lenAD = getDistance(data.A, D);
    const lenAB = getDistance(data.A, data.B);
    const lenAE = getDistance(data.A, E);
    const lenAC = getDistance(data.A, data.C);
    const lenDE = getDistance(D, E);
    const lenBC = getDistance(data.B, data.C);
    const lenDB = getDistance(D, data.B);
    const lenEC = getDistance(E, data.C);

    if (isDeductRatio) {
        drawLengthBubble(data.A, D, `AD=${(lenAD/50).toFixed(1)}`);
        drawLengthBubble(data.A, data.B, `AB=${(lenAB/50).toFixed(1)}`);
        drawLengthBubble(D, E, `DE=${(lenDE/50).toFixed(1)}`);
        drawLengthBubble(data.B, data.C, `BC=${(lenBC/50).toFixed(1)}`);

        const r1 = (lenAD / lenAB).toFixed(2);
        const r2 = (lenDE / lenBC).toFixed(2);
        drawLiveCalculator([
            `AD / AB = ${(lenAD/50).toFixed(1)} / ${(lenAB/50).toFixed(1)} = ${r1}`,
            `DE / BC = ${(lenDE/50).toFixed(1)} / ${(lenBC/50).toFixed(1)} = ${r2}`
        ], "比例值恒定守恒相等");
    } else if (isDeductLine) {
        drawLengthBubble(data.A, D, `AD=${(lenAD/50).toFixed(1)}`);
        drawLengthBubble(D, data.B, `DB=${(lenDB/50).toFixed(1)}`);
        drawLengthBubble(data.A, E, `AE=${(lenAE/50).toFixed(1)}`);
        drawLengthBubble(E, data.C, `EC=${(lenEC/50).toFixed(1)}`);

        const r1 = (lenAD / lenDB).toFixed(2);
        const r2 = (lenAE / lenEC).toFixed(2);
        drawLiveCalculator([
            `AD / DB = ${(lenAD/50).toFixed(1)} / ${(lenDB/50).toFixed(1)} = ${r1}`,
            `AE / EC = ${(lenAE/50).toFixed(1)} / ${(lenEC/50).toFixed(1)} = ${r2}`
        ], "平行线截线比例守恒");
    }

    // 交互拖拽控制点 A (自由移动), D (沿 AB 截线滑动也就是修改比例 t)
    createDragPoint(data.A.x, data.A.y, "drag-A");
    createDragPoint(D.x, D.y, "drag-D");
    drawActiveTermBadge();
}

// 3.2 双直角射影定理模型渲染 (Projection)
function renderProjection() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.projection;
    const rad = degToRad(data.theta);
    const R_dia = getDistance(data.O, data.P) / 2;
    const centerM = { x: (data.O.x + data.P.x)/2, y: (data.O.y + data.P.y)/2 };

    // C 坐标约束在斜边 AB 为直径的下半圆 (以 y 轴负方向为主以防止干扰文字)
    const C = {
        x: centerM.x + R_dia * Math.cos(rad),
        y: centerM.y + R_dia * Math.sin(rad)
    };
    // 垂足 D 为正投影
    const D = {
        x: C.x,
        y: data.O.y
    };

    // 检查联动与卡槽常亮高亮
    const activeConditions = [slots["slot-cond-1"]?.text, slots["slot-cond-2"]?.text, slots["slot-cond-3"]?.text];
    const isSimilarity = isLinkedTerm(
        "AA相似",
        "△ACD ∽ △CBD",
        "△ACD ∽ △ABC",
        "△CBD ∽ △ABC",
        "高分割相似 △ACD ∽ △CBD",
        "左侧相似 △ACD ∽ △ABC",
        "右侧相似 △CBD ∽ △ABC"
    );
    const isRightC = isSimilarity || isLinkedTerm("∠ACB=90°", "直角 ∠ACB=90°") || activeConditions.includes("直角 ∠ACB=90°");
    const isHeightD = isSimilarity || isLinkedTerm("CD⊥AB", "垂线高 CD⊥AB") || activeConditions.includes("垂线高 CD⊥AB");
    const isAngleACD = isSimilarity || isLinkedTerm("∠ACD=∠B", "余角转换 ∠ACD=∠B") || activeConditions.includes("余角转换 ∠ACD=∠B");
    const isAngleBCD = isSimilarity || isLinkedTerm("∠A=∠BCD", "等角 ∠A=∠BCD") || activeConditions.includes("等角 ∠A=∠BCD");

    // 结论与性质
    const conclusion = slots["slot-conclusion"]?.text;
    const deduction = slots["slot-deduction"]?.text;
    const isSimACD_CBD = conclusion === "高分割相似 △ACD ∽ △CBD" || isLinkedTerm("△ACD ∽ △CBD", "高分割相似 △ACD ∽ △CBD");
    const isSimACD_ABC = conclusion === "左侧相似 △ACD ∽ △ABC" || isLinkedTerm("△ACD ∽ △ABC", "左侧相似 △ACD ∽ △ABC");
    const isSimCBD_ABC = conclusion === "右侧相似 △CBD ∽ △ABC" || isLinkedTerm("△CBD ∽ △ABC", "右侧相似 △CBD ∽ △ABC");

    const isDeductH = deduction === "射影高 CD² = AD·BD" || isLinkedTerm("CD² = AD·BD", "射影高 CD² = AD·BD");
    const isDeductL = deduction === "射影左边 AC² = AD·AB" || isLinkedTerm("AC² = AD·AB", "射影左边 AC² = AD·AB");
    const isDeductR = deduction === "射影右边 BC² = BD·AB" || isLinkedTerm("BC² = BD·AB", "射影右边 BC² = BD·AB");

    // 绘制大直角三角形背景 (ABC)
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.O.x},${data.O.y} ${data.P.x},${data.P.y} ${C.x},${C.y}`,
        fill: "rgba(59, 130, 246, 0.02)", stroke: "none"
    }));

    // 绘制辅助直径虚圆 (体现 C 的严格直角约束轨迹)
    drawingLayer.appendChild(createSVGNode("path", {
        d: `M ${data.O.x} ${data.O.y} A ${R_dia} ${R_dia} 0 0 0 ${data.P.x} ${data.P.y}`,
        fill: "none", stroke: "#cbd5e1", "stroke-width": 1.0, "stroke-dasharray": "4, 4"
    }));

    // 绘制三条边 AC, BC, AB
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: C.x, y2: C.y,
        class: `geo-line blue ${isDeductL ? 'highlight-pulse' : ''}`
    }));
     // 绘制等角波纹涟漪
    if (isAngleACD) {
        drawAngleRipples(C, "var(--color-purple)");
        drawAngleRipples(data.P, "var(--color-purple)");
    }
    if (isAngleBCD) {
        drawAngleRipples(data.O, "var(--color-orange)");
        drawAngleRipples(C, "var(--color-orange)");
    }

    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.P.x, y1: data.P.y, x2: C.x, y2: C.y,
        class: `geo-line blue ${isDeductR ? 'highlight-pulse' : ''}`
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: data.P.x, y2: data.P.y,
        class: `geo-line purple projection-base ${isDeductH || isDeductL || isDeductR ? 'projection-base-active' : ''}`, "stroke-width": 2.5
    }));

    // 绘制高 CD (绿色)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: C.x, y1: C.y, x2: D.x, y2: D.y,
        class: `geo-line green ${isHeightD || isDeductH ? 'highlight-pulse' : ''}`, "stroke-width": 2.0
    }));

    // 绘制直角符号
    // 1. C 点的直角 ∠ACB (在 C 处)
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(C, data.O, data.P, 8),
        class: "right-angle-marker",
        filter: isRightC ? "url(#neon-glow)" : "",
        stroke: isRightC ? "var(--color-blue)" : "#64748b"
    }));
    // 2. D 点的直角 ∠CDA 和 ∠CDB
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(D, C, data.O, 8),
        class: "right-angle-marker",
        filter: isHeightD ? "url(#neon-glow)" : "",
        stroke: isHeightD ? "var(--color-green)" : "#64748b"
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(D, C, data.P, 8),
        class: "right-angle-marker",
        filter: isHeightD ? "url(#neon-glow)" : "",
        stroke: isHeightD ? "var(--color-green)" : "#64748b"
    }));

    // 绘制角标记
    // 1. ∠ACD = ∠B (紫色弧)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(C, data.O, D, 15),
        fill: "none", stroke: "var(--color-purple)", "stroke-width": 1.5,
        filter: isAngleACD ? "url(#neon-glow)" : "",
        opacity: isAngleACD ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.P, C, data.O, 15),
        fill: "none", stroke: "var(--color-purple)", "stroke-width": 1.5,
        filter: isAngleACD ? "url(#neon-glow)" : "",
        opacity: isAngleACD ? 1.0 : 0.4
    }));

    // 2. ∠A = ∠BCD (橙色弧)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.O, C, data.P, 15),
        fill: "none", stroke: "var(--color-orange)", "stroke-width": 1.5,
        filter: isAngleBCD ? "url(#neon-glow)" : "",
        opacity: isAngleBCD ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(C, D, data.P, 15),
        fill: "none", stroke: "var(--color-orange)", "stroke-width": 1.5,
        filter: isAngleBCD ? "url(#neon-glow)" : "",
        opacity: isAngleBCD ? 1.0 : 0.4
    }));

    // 文字标号
    drawingLayer.appendChild(createSVGNode("text", { x: data.O.x - 14, y: data.O.y + 14, class: "geo-text" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: data.P.x + 6, y: data.P.y + 14, class: "geo-text" })).textContent = "B";
    drawingLayer.appendChild(createSVGNode("text", { x: C.x - 4, y: C.y - 12, class: "geo-text blue" })).textContent = "C";
    drawingLayer.appendChild(createSVGNode("text", { x: D.x - 4, y: D.y + 14, class: "geo-text green" })).textContent = "D";

    const lenAC = getDistance(data.O, C);
    const lenBC = getDistance(data.P, C);
    const lenAB = getDistance(data.O, data.P);
    const lenCD = getDistance(C, D);
    const lenAD = getDistance(data.O, D);
    const lenBD = getDistance(D, data.P);

    // 计算当前相似比 (AC / BC)
    const baseK = lenAC / lenBC;
    let currentScale = null;

    // 3.2.99 绘制相似合体重叠动画 (Sliding, Rotating, and Scaling Overlap Animation)
    if (isAnimatingOverlap && overlapProgress > 0) {
        let pts = []; // 克隆三角形的动点
        currentScale = baseK + (1.0 - baseK) * overlapProgress; // 渐变至1.0

        if (isSimACD_CBD) {
            // △ACD ∽ △CBD: C->B, A->C, D->D
            const v1 = { x: C.x + (data.P.x - C.x)*overlapProgress, y: C.y + (data.P.y - C.y)*overlapProgress }; // C->B
            const v2 = { x: data.O.x + (C.x - data.O.x)*overlapProgress, y: data.O.y + (C.y - data.O.y)*overlapProgress }; // A->C
            const v3 = D; // D->D (固定)
            pts = [v3, v2, v1];
        } 
        else if (isSimACD_ABC) {
            // △ACD ∽ △ABC: A->A, C->B, D->C
            const v1 = data.O.x; // A->A (固定)
            const v2 = { x: C.x + (data.P.x - C.x)*overlapProgress, y: C.y + (data.P.y - C.y)*overlapProgress }; // C->B
            const v3 = { x: D.x + (C.x - D.x)*overlapProgress, y: D.y + (C.y - D.y)*overlapProgress }; // D->C
            pts = [{ x: v1, y: data.O.y }, v2, v3];
        }
        else if (isSimCBD_ABC) {
            // △CBD ∽ △ABC: C->A, B->B, D->C
            const v1 = { x: C.x + (data.O.x - C.x)*overlapProgress, y: C.y + (data.O.y - C.y)*overlapProgress }; // C->A
            const v2 = data.P; // B->B (固定)
            const v3 = { x: D.x + (C.x - D.x)*overlapProgress, y: D.y + (C.y - D.y)*overlapProgress }; // D->C
            pts = [v1, v2, v3];
        }

        if (pts.length === 3) {
            drawingLayer.appendChild(createSVGNode("polygon", {
                points: `${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y}`,
                fill: "rgba(245, 158, 11, 0.45)", stroke: "var(--color-orange)", "stroke-width": 1.8,
                filter: "url(#neon-glow)"
            }));
            drawingLayer.appendChild(createSVGNode("text", { x: pts[0].x - 4, y: pts[0].y - 12, class: "geo-text orange geo-text-pulse" })).textContent = "C'";
        }
    }

    // 渲染相似比动态量尺板
    drawSimilarityRatioRuler(baseK, currentScale);

    // 渲染性质推导长度与动态计算器
    if (isDeductH) {
        drawLengthBubble(C, D, `CD=${(lenCD/50).toFixed(1)}`);
        drawLengthBubble(data.O, D, `AD=${(lenAD/50).toFixed(1)}`);
        drawLengthBubble(D, data.P, `BD=${(lenBD/50).toFixed(1)}`);

        const valH = (lenCD/50) * (lenCD/50);
        const valP = (lenAD/50) * (lenBD/50);
        drawLiveCalculator([
            `CD² = (${(lenCD/50).toFixed(1)})² = ${valH.toFixed(2)}`,
            `AD · BD = ${(lenAD/50).toFixed(1)} × ${(lenBD/50).toFixed(1)} = ${valP.toFixed(2)}`
        ], "射影高乘积守恒");
    } else if (isDeductL) {
        drawLengthBubble(data.O, C, `AC=${(lenAC/50).toFixed(1)}`);
        drawLengthBubble(data.O, D, `AD=${(lenAD/50).toFixed(1)}`);
        drawLengthBubble(data.O, data.P, `AB=${(lenAB/50).toFixed(1)}`);

        const valL = (lenAC/50) * (lenAC/50);
        const valP = (lenAD/50) * (lenAB/50);
        drawLiveCalculator([
            `AC² = (${(lenAC/50).toFixed(1)})² = ${valL.toFixed(2)}`,
            `AD · AB = ${(lenAD/50).toFixed(1)} × ${(lenAB/50).toFixed(1)} = ${valP.toFixed(2)}`
        ], "射影左边边长乘积守恒");
    } else if (isDeductR) {
        drawLengthBubble(data.P, C, `BC=${(lenBC/50).toFixed(1)}`);
        drawLengthBubble(D, data.P, `BD=${(lenBD/50).toFixed(1)}`);
        drawLengthBubble(data.O, data.P, `AB=${(lenAB/50).toFixed(1)}`);

        const valR = (lenBC/50) * (lenBC/50);
        const valP = (lenBD/50) * (lenAB/50);
        drawLiveCalculator([
            `BC² = (${(lenBC/50).toFixed(1)})² = ${valR.toFixed(2)}`,
            `BD · AB = ${(lenBD/50).toFixed(1)} × ${(lenAB/50).toFixed(1)} = ${valP.toFixed(2)}`
        ], "射影右边边长乘积守恒");
    }

    // 交互控制点 C (沿下半圆拖动)
    createDragPoint(C.x, C.y, "drag-C");
    drawActiveTermBadge();
}

// 3.3 一线三等角K字相似模型渲染 (K-Shape)
function renderKShape() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.kShape;
    const E = { x: data.A.x, y: data.A.y - data.hE };
    const AP = data.P.x - data.A.x;
    const PB = data.B.x - data.P.x;

    // 根据 AP*PB = AE*BD 解算相似高度 BD，从而锁定 ∠EPD 恒为直角
    const hD = (AP * PB) / data.hE;
    const D = { x: data.B.x, y: data.B.y - hD };

    // 检查联动与卡槽常亮高亮
    const activeConditions = [slots["slot-cond-1"]?.text, slots["slot-cond-2"]?.text, slots["slot-cond-3"]?.text];
    const isSimilarity = isLinkedTerm("AA相似", "△AEP ∽ △BPD", "K型相似 △AEP ∽ △BPD");
    const isAngleAB = isSimilarity || isLinkedTerm("∠A=∠B=90°", "底线双直角 ∠A=∠B=90°") || activeConditions.includes("底线双直角 ∠A=∠B=90°");
    const isAngleEPD = isSimilarity || isLinkedTerm("∠EPD=90°", "平角中直角 ∠EPD=90°") || activeConditions.includes("平角中直角 ∠EPD=90°");
    const isAngleAEP = isSimilarity || isLinkedTerm("∠AEP=∠BPD", "垂直转角 ∠AEP=∠BPD") || activeConditions.includes("垂直转角 ∠AEP=∠BPD");
    const isAngleAPE = isSimilarity || isLinkedTerm("∠APE=∠BDP", "垂直转角 ∠APE=∠BDP") || activeConditions.includes("垂直转角 ∠APE=∠BDP");
    const isDeductRatio = isLinkedTerm("AE/BP = AP/BD", "比例式 AE/BP = AP/BD") || slots["slot-deduction"]?.text === "比例式 AE/BP = AP/BD";
    const isDeductMul = isLinkedTerm("AP·BP = AE·BD", "乘积式 AP·BP = AE·BD") || slots["slot-deduction"]?.text === "乘积式 AP·BP = AE·BD";

    // 绘制三角形填充颜色
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.A.x},${data.A.y} ${E.x},${E.y} ${data.P.x},${data.P.y}`,
        fill: "rgba(139, 92, 246, 0.02)", stroke: "none"
    }));
    // 绘制等角波纹涟漪
    if (isAngleAEP) {
        drawAngleRipples(E, "var(--color-orange)");
        drawAngleRipples(data.P, "var(--color-orange)");
    }
    if (isAngleAPE) {
        drawAngleRipples(data.P, "var(--color-green)");
        drawAngleRipples(D, "var(--color-green)");
    }

    // 绘制底平线 AB
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.A.x - 30, y1: data.A.y, x2: data.B.x + 30, y2: data.B.y,
        class: "geo-line", stroke: "#94a3b8", "stroke-width": 1.5
    }));

    // 比例卡片选中时，把公式的四段对应对象全部实体化显示。
    if (isDeductRatio || isDeductMul) {
        const ratioClass = isDeductRatio ? "k-ratio-pair-two" : "k-product-active";
        const productClass = isDeductRatio ? "k-ratio-pair-one" : "k-product-active";
        drawingLayer.appendChild(createSVGNode("line", {
            x1: data.A.x, y1: data.A.y, x2: data.P.x, y2: data.P.y,
            class: `geo-line k-base-segment ${ratioClass}`
        }));
        drawingLayer.appendChild(createSVGNode("line", {
            x1: data.P.x, y1: data.P.y, x2: data.B.x, y2: data.B.y,
            class: `geo-line k-base-segment ${productClass}`
        }));
    }

    // 绘制直角边 AE, BD
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.A.x, y1: data.A.y, x2: E.x, y2: E.y,
        class: `geo-line k-leg ${isDeductRatio ? 'k-ratio-pair-one' : (isDeductMul ? 'k-product-active' : '')}`,
        stroke: "#0284c7"
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.B.x, y1: data.B.y, x2: D.x, y2: D.y,
        class: `geo-line k-leg ${isDeductRatio ? 'k-ratio-pair-two' : (isDeductMul ? 'k-product-active' : '')}`,
        stroke: "#0284c7"
    }));

    // 绘制斜边 EP, DP
    drawingLayer.appendChild(createSVGNode("line", {
        x1: E.x, y1: E.y, x2: data.P.x, y2: data.P.y,
        class: "geo-line purple"
    }));
    drawingLayer.appendChild(createSVGNode("line", {
        x1: D.x, y1: D.y, x2: data.P.x, y2: data.P.y,
        class: "geo-line purple"
    }));

    // 绘制直角符号
    // 1. 底角 A 和 B
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(data.A, E, data.P, 8),
        class: "right-angle-marker",
        filter: isAngleAB ? "url(#neon-glow)" : "",
        stroke: isAngleAB ? "var(--color-blue)" : "#64748b"
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(data.B, D, data.P, 8),
        class: "right-angle-marker",
        filter: isAngleAB ? "url(#neon-glow)" : "",
        stroke: isAngleAB ? "var(--color-blue)" : "#64748b"
    }));
    // 2. 转折点处的直角 ∠EPD
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(data.P, E, D, 8),
        class: "right-angle-marker",
        filter: isAngleEPD ? "url(#neon-glow)" : "",
        stroke: isAngleEPD ? "var(--color-red)" : "#64748b"
    }));

    // 绘制角弧
    // 1. ∠AEP = ∠BPD (橙色)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(E, data.P, data.A, 14),
        fill: "none", stroke: "var(--color-orange)", "stroke-width": 1.5,
        filter: isAngleAEP ? "url(#neon-glow)" : "",
        opacity: isAngleAEP ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.P, D, data.A, 14),
        fill: "none", stroke: "var(--color-orange)", "stroke-width": 1.5,
        filter: isAngleAEP ? "url(#neon-glow)" : "",
        opacity: isAngleAEP ? 1.0 : 0.4
    }));

    // 2. ∠APE = ∠BDP (绿色)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.P, E, data.B, 14),
        fill: "none", stroke: "var(--color-green)", "stroke-width": 1.5,
        filter: isAngleAPE ? "url(#neon-glow)" : "",
        opacity: isAngleAPE ? 1.0 : 0.4
    }));
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(D, data.P, data.B, 14),
        fill: "none", stroke: "var(--color-green)", "stroke-width": 1.5,
        filter: isAngleAPE ? "url(#neon-glow)" : "",
        opacity: isAngleAPE ? 1.0 : 0.4
    }));

    // 文字标号
    drawingLayer.appendChild(createSVGNode("text", { x: data.A.x - 14, y: data.A.y + 14, class: "geo-text" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: data.B.x + 6, y: data.B.y + 14, class: "geo-text" })).textContent = "B";
    drawingLayer.appendChild(createSVGNode("text", { x: data.P.x - 4, y: data.P.y + 14, class: "geo-text blue" })).textContent = "P";
    drawingLayer.appendChild(createSVGNode("text", { x: E.x - 12, y: E.y - 8, class: "geo-text purple" })).textContent = "E";
    drawingLayer.appendChild(createSVGNode("text", { x: D.x + 6, y: D.y - 8, class: "geo-text purple" })).textContent = "D";

    // 3.3.99 旋转放缩合体动画: △AEP ∽ △BPD (A->B, E->P, P->D)
    if (isAnimatingOverlap && overlapProgress > 0) {
        const v1 = { x: data.A.x + (data.B.x - data.A.x)*overlapProgress, y: data.A.y }; // A->B
        const v2 = { x: E.x + (data.P.x - E.x)*overlapProgress, y: E.y + (data.P.y - E.y)*overlapProgress }; // E->P
        const v3 = { x: data.P.x + (D.x - data.P.x)*overlapProgress, y: data.P.y + (D.y - data.P.y)*overlapProgress }; // P->D

        drawingLayer.appendChild(createSVGNode("polygon", {
            points: `${v1.x},${v1.y} ${v2.x},${v2.y} ${v3.x},${v3.y}`,
            fill: "rgba(245, 158, 11, 0.45)", stroke: "var(--color-orange)", "stroke-width": 1.8,
            filter: "url(#neon-glow)"
        }));

        drawingLayer.appendChild(createSVGNode("text", { x: v2.x - 12, y: v2.y - 8, class: "geo-text orange geo-text-pulse" })).textContent = "E'";
    }

    const lenAE = data.hE;
    const lenBP = PB;
    const lenAP = AP;
    const lenBD = hD;

    // 计算当前相似比 (AE / BP)
    const baseK = lenAE / lenBP;
    let currentScale = null;

    if (isAnimatingOverlap && overlapProgress > 0) {
        currentScale = baseK + (1.0 - baseK) * overlapProgress;
    }

    // 渲染相似比动态量尺板
    drawSimilarityRatioRuler(baseK, currentScale);

    // 渲染性质推导长度与动态计算器
    if (isDeductRatio || isDeductMul) {
        drawLengthBubble(data.A, E, `AE=${(lenAE/50).toFixed(1)}`);
        drawLengthBubble(data.P, data.B, `BP=${(lenBP/50).toFixed(1)}`);
        drawLengthBubble(data.A, data.P, `AP=${(lenAP/50).toFixed(1)}`);
        drawLengthBubble(data.B, D, `BD=${(lenBD/50).toFixed(1)}`);

        if (isDeductRatio) {
            const val1 = (lenAE / lenBP).toFixed(2);
            const val2 = (lenAP / lenBD).toFixed(2);
            drawLiveCalculator([
                `AE / BP = ${(lenAE/50).toFixed(1)} / ${(lenBP/50).toFixed(1)} = ${val1}`,
                `AP / BD = ${(lenAP/50).toFixed(1)} / ${(lenBD/50).toFixed(1)} = ${val2}`
            ], "比例值恒定守恒相等");
        } else {
            const valL = (lenAP/50) * (lenBP/50);
            const valR = (lenAE/50) * (lenBD/50);
            drawLiveCalculator([
                `AP · BP = ${(lenAP/50).toFixed(1)} × ${(lenBP/50).toFixed(1)} = ${valL.toFixed(2)}`,
                `AE · BD = ${(lenAE/50).toFixed(1)} × ${(lenBD/50).toFixed(1)} = ${valR.toFixed(2)}`
            ], "K型乘积守恒");
        }
    }

    // 交互拖拽控制点 E (垂直拉伸), P (水平拖动)
    createDragPoint(E.x, E.y, "drag-E");
    createDragPoint(data.P.x, data.P.y, "drag-P");
    drawActiveTermBadge();
}

function createDragPoint(cx, cy, id) {
    const g = createSVGNode("g", { class: "drag-point", id: id });
    g.appendChild(createSVGNode("circle", { cx: cx, cy: cy, r: 24, class: "drag-point-hit" }));
    g.appendChild(createSVGNode("circle", { cx: cx, cy: cy, r: 8, class: "drag-point-outer" }));
    g.appendChild(createSVGNode("circle", { cx: cx, cy: cy, r: 3.5, class: "drag-point-inner" }));
    controlsLayer.appendChild(g);
}

function drawGrid() {
    gridLayer.innerHTML = "";
}

// ==========================================================================
// 4. 卡片仓库与插槽拼图引擎 (Puzzle Engine)
// ==========================================================================
function findNextCompatibleSlot(type) {
    if (type === "cond") {
        return ["slot-cond-1", "slot-cond-2", "slot-cond-3"].find(slotId => !slots[slotId]) || null;
    }
    const slotByType = {
        post: "slot-postulate",
        conc: "slot-conclusion",
        deduct: "slot-deduction"
    };
    const slotId = slotByType[type];
    return slotId && !slots[slotId] ? slotId : null;
}

function loadCardBank() {
    cardBankGrid.innerHTML = "";
    const level = levelsData[activeTab];

    level.cards.forEach((card, index) => {
        const div = document.createElement("div");
        div.className = "proof-card";
        div.setAttribute("draggable", "true");
        div.setAttribute("data-type", card.type);
        div.setAttribute("data-term", card.term || card.text);
        div.id = `card-${activeTab}-${index}`;

        // 包含 KaTeX 内容渲染支持
        const inlineMathSpan = document.createElement("span");
        inlineMathSpan.className = "card-math-content";
        inlineMathSpan.textContent = card.text;
        div.appendChild(inlineMathSpan);

        // 双向联动悬停绑定
        div.addEventListener("mouseenter", () => {
            hoveredTerm = card.term || card.text;
            syncLinkedHighlights();
            renderActiveTab();
        });
        div.addEventListener("mouseleave", () => {
            hoveredTerm = null;
            syncLinkedHighlights();
            renderActiveTab();
        });

        // 触拖拽支持 (Drag and Drop)
        div.addEventListener("dragstart", (e) => {
            div.classList.add("dragging");
            e.dataTransfer.setData("text/plain", JSON.stringify({ tab: activeTab, index: index }));
        });
        div.addEventListener("dragend", () => {
            div.classList.remove("dragging");
        });

        // 点击支持（点击仓库卡片 -> 置入当前选中的卡槽）
        div.addEventListener("click", () => {
            if (activeSlotId) {
                const slot = document.getElementById(activeSlotId);
                const slotType = slot.getAttribute("data-slot-type");
                if (card.type === slotType) {
                    fillSlot(activeSlotId, card);
                    // 清除插槽选中状态
                    slot.classList.remove("hover");
                    activeSlotId = null;
                } else {
                    // 类型不匹配抖动
                    slot.classList.add("error");
                    playErrorSound();
                    setTimeout(() => slot.classList.remove("error"), 300);
                }
            } else {
                const nextSlotId = findNextCompatibleSlot(card.type);
                if (nextSlotId) {
                    fillSlot(nextSlotId, card);
                    resultStatusText.innerHTML = "已自动填入下一个同类型卡槽；需要指定位置时可先点击目标卡槽。";
                } else {
                    setActiveFeedbackTerms([card.term || card.text]);
                    resultStatusText.innerHTML = "这一类卡槽已填满；可先移除已有卡片，或点击目标空槽后再选择卡片。";
                }
            }
        });

        cardBankGrid.appendChild(div);
    });
    syncLinkedHighlights();
}

function fillSlot(slotId, cardData) {
    const slot = document.getElementById(slotId);
    slots[slotId] = cardData;

    slot.innerHTML = `<span class="slot-text">${cardData.text}</span><button class="card-delete-btn" type="button" aria-label="移除 ${cardData.text}"><i class="fa-solid fa-xmark"></i></button>`;
    slot.setAttribute("data-term", cardData.term || cardData.text);
    slot.classList.add("filled");
    slot.classList.remove("correct", "error");
    slot.onmouseenter = () => {
        hoveredTerm = cardData.term || cardData.text;
        syncLinkedHighlights();
        renderActiveTab();
    };
    slot.onmouseleave = () => {
        hoveredTerm = null;
        syncLinkedHighlights();
        renderActiveTab();
    };
    slot.querySelector(".card-delete-btn")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        removeSlotContent(slotId);
    });

    resetStatusBar();
    setActiveFeedbackTerms([cardData.term || cardData.text]);
    playClickSound();
    drawFlowLines();
    renderActiveTab();
}

function removeSlotContent(slotId) {
    const slot = document.getElementById(slotId);
    slots[slotId] = null;
    if (activeSlotId === slotId) activeSlotId = null;

    const defaultTexts = {
        "slot-cond-1": "条件1",
        "slot-cond-2": "条件2",
        "slot-cond-3": "条件3",
        "slot-postulate": "选择相似判定定理",
        "slot-conclusion": "相似结论",
        "slot-deduction": "对应边比/乘积结论"
    };

    slot.innerHTML = defaultTexts[slotId];
    slot.removeAttribute("data-term");
    slot.onmouseenter = null;
    slot.onmouseleave = null;
    slot.classList.remove("filled", "correct", "error");

    playClickSound();
    resetStatusBar();
    drawFlowLines();
    renderActiveTab();
}

function resetStatusBar() {
    resultStatusCard.className = "result-status-card";
    resultStatusIcon.className = "fa-solid fa-circle-question";
    resultStatusText.innerHTML = "请将左侧图形条件卡片移入槽中以构建相似证明链";
    if (currentHintLevel > 0) {
        renderHintPanel(currentHintLevel);
    } else {
        activeFeedbackTerms = [];
        syncLinkedHighlights();
    }
    // 隐藏演示按钮
    const playOverlapBtn = document.getElementById("btn-play-overlap");
    if (playOverlapBtn) {
        playOverlapBtn.style.display = "none";
        playOverlapBtn.innerHTML = `<i class="fa-solid fa-play"></i> 🎬 演示相似合体重叠`;
    }
}

function initSlotsDragEvents() {
    document.querySelectorAll(".drop-zone").forEach(slot => {
        // 点击选择填充插槽
        slot.addEventListener("click", () => {
            playClickSound();
            document.querySelectorAll(".drop-zone").forEach(s => s.classList.remove("hover"));
            if (activeSlotId === slot.id) {
                activeSlotId = null;
            } else {
                activeSlotId = slot.id;
                slot.classList.add("hover");
            }
        });

        slot.addEventListener("dragover", (e) => {
            e.preventDefault();
            slot.classList.add("hover");
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
                    playErrorSound();
                    setTimeout(() => slot.classList.remove("error"), 300);
                }
            } catch (err) {
                console.error("Drop error", err);
            }
        });
    });
}

// --------------------------------------------------------------------------
// 4.2 逻辑证明链验证核心判定逻辑 (Verify Chain)
// --------------------------------------------------------------------------
const slotLabels = {
    "slot-cond-1": "条件1",
    "slot-cond-2": "条件2",
    "slot-cond-3": "条件3",
    "slot-postulate": "相似判定",
    "slot-conclusion": "相似结论",
    "slot-deduction": "性质推导"
};

function collectTermsFromSlots(slotIds) {
    return slotIds.map(getSlotTerm).filter(Boolean);
}

function markProofFailure(messages, errorSlots, feedbackTerms = []) {
    const uniqueErrorSlots = Array.from(new Set(errorSlots));
    const uniqueTerms = Array.from(new Set([...feedbackTerms, ...collectTermsFromSlots(uniqueErrorSlots)].filter(Boolean)));

    resultStatusCard.className = "result-status-card fail";
    resultStatusIcon.className = "fa-solid fa-circle-xmark";
    resultStatusText.innerHTML = `❌ ${messages.slice(0, 3).join("；")}`;
    playErrorSound();

    document.querySelectorAll(".drop-zone").forEach(slot => {
        slot.classList.remove("correct", "error");
        if (uniqueErrorSlots.includes(slot.id)) {
            slot.classList.add("error");
        } else if (slots[slot.id]) {
            slot.classList.add("correct");
        }
    });

    setActiveFeedbackTerms(uniqueTerms);
    drawFlowLines(false, uniqueErrorSlots);
}

function verifyProofChain() {
    // 检查条件：A字平行相似可以只需要两个条件（例如平行条件，此时只需填满1个或2个条件即可）
    // 为了灵活性，我们允许未填满全部条件槽，但定理、结论和性质槽必须全填
    if (!slots["slot-postulate"] || !slots["slot-conclusion"] || !slots["slot-deduction"]) {
        const missingSlots = ["slot-postulate", "slot-conclusion", "slot-deduction"].filter(slotId => !slots[slotId]);
        markProofFailure(
            [`缺少${missingSlots.map(slotId => slotLabels[slotId]).join("、")}，证明链还没有闭合`],
            missingSlots,
            []
        );
        return;
    }

    const c1 = slots["slot-cond-1"]?.text;
    const c2 = slots["slot-cond-2"]?.text;
    const c3 = slots["slot-cond-3"]?.text;
    const condList = [c1, c2, c3].filter(c => c !== undefined && c !== null);

    const post = slots["slot-postulate"].text;
    const conc = slots["slot-conclusion"].text;
    const deduct = slots["slot-deduction"].text;

    let isCorrect = false;
    let errorSlots = [];
    let failureMessages = [];
    let feedbackTerms = [];

    if (activeTab === "parallel") {
        // 平行线A字相似判定 (AA, 平行定理, SAS)
        const hasParallel = condList.includes("平行条件 DE∥BC");
        const hasAngleA = condList.includes("公共角 ∠A=∠A");
        const hasAngleADE = condList.includes("同位角相等 ∠ADE=∠B");
        const hasAngleAED = condList.includes("同位角相等 ∠AED=∠C");

        // 路径 1: 平行判定
        const isParallel_Chain = hasParallel && post === "平行相似定理";
        // 路径 2: AA 判定
        const isAA_Cond = (hasAngleA && hasAngleADE) || (hasAngleA && hasAngleAED) || (hasAngleADE && hasAngleAED);
        const isAA_Chain = isAA_Cond && post === "AA 相似判定";

        const concValid = conc === "相似结论 △ADE ∽ △ABC";
        const deductValid = deduct === "比例边 AD/AB = AE/AC = DE/BC" || deduct === "比例截线 AD/DB = AE/EC";

        if ((isParallel_Chain || isAA_Chain) && concValid && deductValid) {
            isCorrect = true;
        } else {
            const condsValid = hasParallel || isAA_Cond;
            const postValid = (hasParallel && post === "平行相似定理") || (isAA_Cond && post === "AA 相似判定");
            if (!condsValid) {
                errorSlots.push("slot-cond-1", "slot-cond-2", "slot-cond-3");
                failureMessages.push("条件断点：平行路径需要 DE∥BC；AA 路径至少需要两组等角");
                feedbackTerms.push("DE∥BC", "∠A=∠A", "∠ADE=∠B", "∠AED=∠C");
            }
            if (!postValid) {
                errorSlots.push("slot-postulate");
                failureMessages.push(hasParallel ? "判定断点：已有平行条件时应选“平行相似定理”" : "判定断点：等角条件成立时应选“AA 相似判定”");
                feedbackTerms.push(hasParallel ? "平行相似定理" : "AA相似");
            }
            if (!concValid) {
                errorSlots.push("slot-conclusion");
                failureMessages.push("结论断点：本模型目标应是 △ADE ∽ △ABC");
                feedbackTerms.push("△ADE ∽ △ABC");
            }
            if (!deductValid) {
                errorSlots.push("slot-deduction");
                failureMessages.push("性质断点：相似后应推出对应边比例或截线比例");
                feedbackTerms.push("比例三边", "比例截线");
            }
        }
    } 
    else if (activeTab === "projection") {
        // 射影定理判定 (AA相似)
        const hasRightC = condList.includes("直角 ∠ACB=90°");
        const hasHeightD = condList.includes("垂线高 CD⊥AB");
        const hasAngleACD = condList.includes("余角转换 ∠ACD=∠B");
        const hasAngleBCD = condList.includes("等角 ∠A=∠BCD");

        const condsValid = hasRightC && hasHeightD && (hasAngleACD || hasAngleBCD);
        const postValid = post === "AA 相似判定";
        
        let concValid = false;
        let deductValid = false;

        // 匹配三条射影相似线
        if (conc === "高分割相似 △ACD ∽ △CBD" && deduct === "射影高 CD² = AD·BD") {
            concValid = true; deductValid = true;
        }
        if (conc === "左侧相似 △ACD ∽ △ABC" && deduct === "射影左边 AC² = AD·AB") {
            concValid = true; deductValid = true;
        }
        if (conc === "右侧相似 △CBD ∽ △ABC" && deduct === "射影右边 BC² = BD·AB") {
            concValid = true; deductValid = true;
        }

        if (condsValid && postValid && concValid && deductValid) {
            isCorrect = true;
        } else {
            if (!condsValid) {
                errorSlots.push("slot-cond-1", "slot-cond-2", "slot-cond-3");
                failureMessages.push("条件断点：射影模型必须先有直角、斜边高，再补一组余角等量");
                feedbackTerms.push("∠ACB=90°", "CD⊥AB", "∠ACD=∠B", "∠A=∠BCD");
            }
            if (!postValid) {
                errorSlots.push("slot-postulate");
                failureMessages.push("判定断点：射影三角形相似应使用 AA 相似判定");
                feedbackTerms.push("AA相似");
            }
            if (!concValid) {
                errorSlots.push("slot-conclusion");
                failureMessages.push("结论断点：相似结论要和后面的射影公式对应");
                feedbackTerms.push("△ACD ∽ △CBD", "△ACD ∽ △ABC", "△CBD ∽ △ABC");
            }
            if (!deductValid) {
                errorSlots.push("slot-deduction");
                failureMessages.push("性质断点：公式需匹配所选相似结论");
                feedbackTerms.push("CD² = AD·BD", "AC² = AD·AB", "BC² = BD·AB");
            }
        }
    } 
    else if (activeTab === "k-shape") {
        // 一线三等角相似判定
        const hasRightAB = condList.includes("底线双直角 ∠A=∠B=90°");
        const hasRightEPD = condList.includes("平角中直角 ∠EPD=90°");
        const hasAEP = condList.includes("垂直转角 ∠AEP=∠BPD");
        const hasAPE = condList.includes("垂直转角 ∠APE=∠BDP");

        const condsValid = hasRightAB && hasRightEPD && (hasAEP || hasAPE);
        const postValid = post === "AA 相似判定";
        const concValid = conc === "K型相似 △AEP ∽ △BPD";
        const deductValid = deduct === "比例式 AE/BP = AP/BD" || deduct === "乘积式 AP·BP = AE·BD";

        if (condsValid && postValid && concValid && deductValid) {
            isCorrect = true;
        } else {
            if (!condsValid) {
                errorSlots.push("slot-cond-1", "slot-cond-2", "slot-cond-3");
                failureMessages.push("条件断点：K 字型需要两处直角，再由互余推出一组锐角相等");
                feedbackTerms.push("∠A=∠B=90°", "∠EPD=90°", "∠AEP=∠BPD", "∠APE=∠BDP");
            }
            if (!postValid) {
                errorSlots.push("slot-postulate");
                failureMessages.push("判定断点：K 字型本质是两角对应相等，应选 AA 相似判定");
                feedbackTerms.push("AA相似");
            }
            if (!concValid) {
                errorSlots.push("slot-conclusion");
                failureMessages.push("结论断点：目标相似三角形应是 △AEP ∽ △BPD");
                feedbackTerms.push("△AEP ∽ △BPD");
            }
            if (!deductValid) {
                errorSlots.push("slot-deduction");
                failureMessages.push("性质断点：由 △AEP ∽ △BPD 推比例式或乘积式");
                feedbackTerms.push("AE/BP = AP/BD", "AP·BP = AE·BD");
            }
        }
    }

    if (isCorrect) {
        resultStatusCard.className = "result-status-card success";
        resultStatusIcon.className = "fa-solid fa-circle-check";
        resultStatusText.innerHTML = "🎉 相似逻辑闭环成功！已知条件已形成电网连通，相似证明完全成立！";
        setActiveFeedbackTerms([
            ...condList,
            slots["slot-postulate"]?.term,
            slots["slot-conclusion"]?.term,
            slots["slot-deduction"]?.term
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
        if (slots["slot-cond-1"]) document.getElementById("slot-cond-1").classList.add("correct");
        if (slots["slot-cond-2"]) document.getElementById("slot-cond-2").classList.add("correct");
        if (slots["slot-cond-3"]) document.getElementById("slot-cond-3").classList.add("correct");
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
            // 显示相似合体演示按钮
            document.getElementById("btn-play-overlap").style.display = "flex";
        }, 1800));
    } else {
        markProofFailure(
            failureMessages.length ? failureMessages : ["相似证明逻辑有断裂，请检查红圈标记的卡槽匹配顺序"],
            errorSlots,
            feedbackTerms
        );
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

    // 2. 判定方法 连线 -> 相似结论
    const isPostConcFilled = slots[postSlot] && slots[concSlot];
    const isPostConcErr = errorSlots.includes(postSlot) || errorSlots.includes(concSlot);
    const isPostConcActive = isSuccess || (laserStep >= 2) || (isPostConcFilled && !isPostConcErr);
    drawLine(postSlot, concSlot, "bottom", "top", isPostConcActive, isPostConcErr);

    // 3. 相似结论 连线 -> 性质导出
    const isConcDeductFilled = slots[concSlot] && slots[deductSlot];
    const isConcDeductErr = errorSlots.includes(concSlot) || errorSlots.includes(deductSlot);
    const isConcDeductActive = isSuccess || (laserStep >= 3) || (isConcDeductFilled && !isConcDeductErr);
    drawLine(concSlot, deductSlot, "bottom", "top", isConcDeductActive, isConcDeductErr);
}

function resetPuzzle() {
    Object.keys(slots).forEach(slotId => {
        removeSlotContent(slotId);
    });

    // 重置并隐藏相似合体演示按钮
    if (overlapTimerId) {
        clearInterval(overlapTimerId);
        overlapTimerId = null;
    }
    isAnimatingOverlap = false;
    overlapProgress = 0.0;

    const playOverlapBtn = document.getElementById("btn-play-overlap");
    if (playOverlapBtn) {
        playOverlapBtn.style.display = "none";
        playOverlapBtn.innerHTML = `<i class="fa-solid fa-play"></i> 🎬 演示相似合体重叠`;
    }

    resetStatusBar();
    drawFlowLines();
}

// ==========================================================================
// 5. 拖拽几何控制点解算限幅逻辑
// ==========================================================================
function initDragEvents() {
    const getMousePosition = (e) => {
        const point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const matrix = svg.getScreenCTM();
        if (!matrix) return { x: 0, y: 0 };
        const svgPoint = point.matrixTransform(matrix.inverse());
        return { x: svgPoint.x, y: svgPoint.y };
    };

    const getDragAnchor = (target) => {
        const outer = target.querySelector(".drag-point-outer") || target.querySelector("circle");
        return {
            x: Number(outer?.getAttribute("cx") || 0),
            y: Number(outer?.getAttribute("cy") || 0)
        };
    };

    const beginDrag = (target, event) => {
        activeDragId = target.id;
        const pos = getMousePosition(event);
        const anchor = getDragAnchor(target);
        dragOffset = { x: pos.x - anchor.x, y: pos.y - anchor.y };
        target.classList.add("is-dragging");
        playClickSound();
    };

    const getAdjustedDragPosition = (event) => {
        const pos = getMousePosition(event);
        return {
            x: pos.x - dragOffset.x,
            y: pos.y - dragOffset.y
        };
    };

    const handleDragMove = (event) => {
        if (!activeDragId) return;
        const pos = getAdjustedDragPosition(event);

        if (activeTab === "parallel") {
            const data = state.parallel;
            if (activeDragId === "drag-A") {
                data.A.x = Math.max(100, Math.min(500, pos.x));
                data.A.y = Math.max(30, Math.min(180, pos.y));
                renderParallel();
            } else if (activeDragId === "drag-D") {
                const dxB = data.B.x - data.A.x;
                const dyB = data.B.y - data.A.y;
                const lenB = Math.sqrt(dxB*dxB + dyB*dyB) || 1;
                const dxDrag = pos.x - data.A.x;
                const dyDrag = pos.y - data.A.y;
                const proj = (dxDrag * dxB + dyDrag * dyB) / lenB;
                data.t = Math.max(0.25, Math.min(0.92, proj / lenB));
                renderParallel();
            }
        }
        else if (activeTab === "projection" && activeDragId === "drag-C") {
            const data = state.projection;
            const centerM = { x: (data.O.x + data.P.x)/2, y: (data.O.y + data.P.y)/2 };
            const rad = Math.atan2(pos.y - centerM.y, pos.x - centerM.x);
            let deg = radToDeg(rad);
            if (deg > 180) deg -= 360;
            data.theta = Math.max(-168, Math.min(-12, deg));
            renderProjection();
        }
        else if (activeTab === "k-shape") {
            const data = state.kShape;
            if (activeDragId === "drag-P") {
                data.P.x = Math.max(data.A.x + 30, Math.min(data.B.x - 30, pos.x));
                renderKShape();
            } else if (activeDragId === "drag-E") {
                data.hE = Math.max(40, Math.min(240, data.A.y - pos.y));
                renderKShape();
            }
        }
    };

    svg.addEventListener("mousedown", (e) => {
        if (Date.now() - lastTouchDragStartedAt < 700) return;
        const target = e.target.closest(".drag-point");
        if (!target) return;
        beginDrag(target, e);
    });

    svg.addEventListener("mousemove", (e) => {
        if (!activeDragId) return;
        handleDragMove(e);
        e.preventDefault();
    }, { passive: false });

    const handleRelease = () => {
        if (activeDragId) {
            const current = document.getElementById(activeDragId);
            current?.classList.remove("is-dragging");
            activeDragId = null;
            dragOffset = { x: 0, y: 0 };
        }
    };
    svg.addEventListener("mouseup", handleRelease);
    svg.addEventListener("mouseleave", handleRelease);

    // 触屏支持
    svg.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const target = touch.target.closest(".drag-point");
            if (target) {
                lastTouchDragStartedAt = Date.now();
                beginDrag(target, touch);
                e.preventDefault();
            }
        }
    }, { passive: false });

    svg.addEventListener("touchmove", (e) => {
        if (!activeDragId || e.touches.length !== 1) return;
        const touch = e.touches[0];
        handleDragMove(touch);
        e.preventDefault();
    }, { passive: false });

    window.addEventListener("touchend", handleRelease);
    window.addEventListener("touchcancel", handleRelease);
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
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
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
    if (activeTab === "parallel") {
        renderParallel();
    } else if (activeTab === "projection") {
        renderProjection();
    } else if (activeTab === "k-shape") {
        renderKShape();
    }
}

function switchTab(tabId) {
    activeTab = tabId;
    hoveredTerm = null;
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
        "parallel": "💡 当前探索：关卡 1 - 平行线A字型相似 (AA/SAS/平行相似)",
        "projection": "💡 当前探索：关卡 2 - 双直角射影定理相似 (AA)",
        "k-shape": "💡 当前探索：关卡 3 - 一线三等角K字相似 (AA)"
    };
    stepGuideIndicator.innerHTML = levelGuideTexts[tabId];

    // 重置推理槽
    resetPuzzle();
    // 加载卡片与思维说明
    loadCardBank();
    renderHintPanel(0);
    renderActiveTab();
    hudContent.innerHTML = levelsData[tabId].hint;
    
    // 强制重绘连线
    setTimeout(() => drawFlowLines(), 100);
}

function init() {
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

    document.querySelectorAll(".hint-step-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            playClickSound();
            renderHintPanel(Number(btn.getAttribute("data-hint-level")));
        });
    });

    // 绑定重置与验证按钮
    btnResetPuzzle.addEventListener("click", () => {
        playClickSound();
        resetPuzzle();
        renderHintPanel(0);
    });
    btnVerifyPuzzle.addEventListener("click", () => {
        playClickSound();
        verifyProofChain();
    });

    // 绑定全等/相似合体演示按钮
    document.getElementById("btn-play-overlap").addEventListener("click", () => {
        isAnimatingOverlap = !isAnimatingOverlap;
        playClickSound();

        const btn = document.getElementById("btn-play-overlap");
        if (isAnimatingOverlap) {
            btn.innerHTML = `<i class="fa-solid fa-stop"></i> 🎬 停止相似合体`;
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
            btn.innerHTML = `<i class="fa-solid fa-play"></i> 🎬 演示相似合体重叠`;
            btn.style.backgroundColor = "rgba(245, 158, 11, 0.08)";
            btn.style.borderColor = "var(--color-orange)";
            renderActiveTab();
        }
    });

    drawGrid();
    initDragEvents();
    initSlotsDragEvents();
    switchTab("parallel");

    // 窗口尺寸变化时自适应重绘连线
    window.addEventListener("resize", () => drawFlowLines());
}

document.addEventListener("DOMContentLoaded", init);

// ==========================================================================
// 几何辅助线构造专题课件 JavaScript Core Logic (视觉&交互增强全息沙盒版)
// ==========================================================================

// --- Web Audio 声音合成器 ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSynthSound(freq, duration = 0.08, type = "sine") {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.error(e);
    }
}

// 动态调制拖拽音高反馈 (防抖/节流及灵敏度优化，防止音频阻塞主线程导致抖动)
let lastSoundTime = 0;
let lastSoundY = 0;
function playModulatedDragSound(x, y) {
    const now = performance.now();
    if (now - lastSoundTime > 60 && Math.abs(y - lastSoundY) > 10) {
        const freq = Math.max(280, Math.min(1000, 880 - y * 1.6));
        playSynthSound(freq, 0.03, "sine");
        lastSoundY = y;
        lastSoundTime = now;
    }
}

// --- 全局几何坐标与状态状态机 ---
let state = {
    activeTab: "double-median",
    doubleMedian: {
        extendPercent: 0,
        isRotated: false,
        A: { x: 280, y: 80 },
        B: { x: 210, y: 200 },
        C: { x: 470, y: 200 }
    },
    bisectorPerp: {
        extendPercent: 0,
        isFolded: false,
        foldPercent: 0,
        A: { x: 350, y: 60 },
        B: { x: 230, y: 240 },
        C: { x: 518, y: 312 }
    },
    halfAngle: {
        isRotated: false,
        isCongruentShown: false,
        E_x: 350
    },
    kModel: {
        isCongruentLocked: true,
        isHighlightActive: false,
        A: { x: 180, y: 120 },
        P: { x: 280, y: 260 },
        dist_PB: 130
    }
};

// --- DOM 元素绑定 ---
const tabBtns = document.querySelectorAll(".tab-btn");
const ctrlGroups = document.querySelectorAll(".ctrl-group");
const whiteboardTitleText = document.getElementById("whiteboard-title-text");
const controlCardTitle = document.getElementById("control-card-title");
const hintTitle = document.getElementById("hint-title");
const hintContent = document.getElementById("hint-content");
const hudContent = document.getElementById("hud-content");
const strategyBtns = document.querySelectorAll(".strategy-step");
const stateJudgeText = document.getElementById("state-judge-text");
const btnAutoDemo = document.getElementById("btn-auto-demo");
const btnStepForward = document.getElementById("btn-step-forward");
const btnViewReset = document.getElementById("btn-view-reset");

const STRATEGY_LESSONS = {
    "double-median": {
        target: "证明 AB + AC > 2AD",
        construct: "延长中线 AD 到 E，使 DE = AD，再连接 BE。",
        reason: "中点 BD = CD，倍长 AD = ED，对顶角相等，触发 SAS 全等。"
    },
    "bisector-perp": {
        target: "把角平分线问题转成等距与全等",
        construct: "从 B 向角平分线作垂线并延长到 E，形成可折叠结构。",
        reason: "角平分线带来镜面对称，垂线折叠后可锁定等距关系。"
    },
    "half-angle": {
        target: "解释半角条件为什么能拼出全等",
        construct: "旋转 △ABE 到外侧，让分散线段进入同一构型。",
        reason: "正方形直角与半角共同触发旋转全等，再推出线段和差。"
    },
    "k-model": {
        target: "识别一线三等角中的相似或全等",
        construct: "拖动 A、P 点，比较两侧直角三角形的边长比例。",
        reason: "同角的余角相等形成角角相似；等腰锁定时升级为全等。"
    }
};

// HUD 折叠绑定
const hudPanel = document.getElementById("hud-panel");
const hudToggle = document.getElementById("hud-toggle");
hudToggle.addEventListener("click", () => {
    playSynthSound(480, 0.04);
    hudPanel.classList.toggle("collapsed");
});

function getStrategyProgress(tabId = state.activeTab) {
    if (tabId === "double-median") {
        if (state.doubleMedian.isRotated) return { label: "已证明", complete: true, judge: "倍长与旋转已完成，可在 △ABE 中代换 BE = AC。" };
        if (state.doubleMedian.extendPercent >= 100) return { label: "待旋转", complete: false, judge: "AD 已倍长，下一步旋转 △ADC 对齐。" };
        if (state.doubleMedian.extendPercent > 0) return { label: "构造中", complete: false, judge: `AD 正在延长：${state.doubleMedian.extendPercent}%` };
        return { label: "待构造", complete: false, judge: "先拖动滑块，把 AD 延长为 2AD。" };
    }
    if (tabId === "bisector-perp") {
        if (state.bisectorPerp.isFolded && state.bisectorPerp.foldPercent >= 100) return { label: "已折叠", complete: true, judge: "折叠已完成，可观察等距与全等对应边。" };
        if (state.bisectorPerp.extendPercent >= 100) return { label: "待折叠", complete: false, judge: "垂线已延长，下一步做对称翻折。" };
        if (state.bisectorPerp.extendPercent > 0) return { label: "构造中", complete: false, judge: `垂线构造进度：${state.bisectorPerp.extendPercent}%` };
        return { label: "待构造", complete: false, judge: "先构造从 B 到角平分线的垂线。" };
    }
    if (tabId === "half-angle") {
        if (state.halfAngle.isCongruentShown) return { label: "已证明", complete: true, judge: "二次全等关系已触发，可比较 BE + DF 与 EF。" };
        if (state.halfAngle.isRotated) return { label: "待全等", complete: false, judge: "旋转拼接已完成，下一步触发二次全等。" };
        return { label: "待旋转", complete: false, judge: "先旋转 △ABE，把半角结构拼到外侧。" };
    }
    if (tabId === "k-model") {
        if (state.kModel.isHighlightActive) return { label: "已高亮", complete: true, judge: "等角与比例关系已高亮，拖动点可验证比例稳定。" };
        if (state.kModel.isCongruentLocked) return { label: "全等态", complete: false, judge: "AP = BP 已锁定，点击高亮查看对应边相等。" };
        return { label: "相似态", complete: false, judge: "AP 与 BP 不等时保持相似比例，适合观察比例变化。" };
    }
    return { label: "观察中", complete: false, judge: "选择一种辅助线策略开始。" };
}

function updateStrategyMap() {
    strategyBtns.forEach(btn => {
        const tabId = btn.getAttribute("data-tab");
        const progress = getStrategyProgress(tabId);
        btn.classList.toggle("active", tabId === state.activeTab);
        btn.classList.toggle("complete", progress.complete);
        const stateNode = btn.querySelector(".strategy-state");
        if (stateNode) stateNode.textContent = progress.label;
    });
    if (stateJudgeText) stateJudgeText.textContent = getStrategyProgress().judge;
}

function compactHudStepHtml(stepHtml) {
    const template = document.createElement("template");
    template.innerHTML = stepHtml || "";
    const cards = Array.from(template.content.querySelectorAll(".proof-step-card"));
    const latestCard = cards[cards.length - 1]?.outerHTML || "";
    const notices = Array.from(template.content.querySelectorAll(".hud-hint-card"))
        .map(node => node.outerHTML)
        .join("");
    return `${latestCard}${notices}`;
}

function renderHudContent(stepHtml) {
    const lesson = STRATEGY_LESSONS[state.activeTab] || STRATEGY_LESSONS["double-median"];
    const lessonHtml = `
        <div class="hud-lesson-grid">
            <div class="hud-lesson-card"><b>目标</b><span>${lesson.target}</span></div>
            <div class="hud-lesson-card"><b>构造</b><span>${lesson.construct}</span></div>
            <div class="hud-lesson-card"><b>依据</b><span>${lesson.reason}</span></div>
        </div>
    `;
    hudContent.innerHTML = `${lessonHtml}${compactHudStepHtml(stepHtml)}`;
    updateStrategyMap();
}

function showPanelNotice(message) {
    const currentSteps = Array.from(hudContent?.querySelectorAll(".proof-step-card") || [])
        .map(node => node.outerHTML)
        .join("");
    renderHudContent(`${currentSteps}<div class="hud-hint-card"><b class="hud-hint-title">操作提示</b><div class="hud-hint-body">${message}</div></div>`);
}

// SVG 图层
const geometrySvg = document.getElementById("geometry-svg");
const drawLayerGrid = document.getElementById("draw-layer-grid");
const drawLayerLines = document.getElementById("draw-layer-lines");
const drawLayerRipples = document.getElementById("draw-layer-ripples");
const drawLayerPoints = document.getElementById("draw-layer-points");

let geometryView = document.getElementById("geometry-view");
if (!geometryView) {
    geometryView = document.createElementNS("http://www.w3.org/2000/svg", "g");
    geometryView.setAttribute("id", "geometry-view");
    geometrySvg.appendChild(geometryView);
    [drawLayerGrid, drawLayerLines, drawLayerRipples, drawLayerPoints].forEach(layer => {
        if (layer) geometryView.appendChild(layer);
    });
}

const geometryViewState = {
    x: 0,
    y: 0,
    zoom: 1,
    minZoom: 0.55,
    maxZoom: 2.5
};
const geometryViewPointers = new Map();
let isPanningGeometryView = false;
let viewPanStart = { x: 0, y: 0 };
let viewPointerStart = { x: 0, y: 0 };
let viewPinchStartDistance = 0;
let viewPinchStartZoom = 1;
let viewPinchAnchor = { x: 300, y: 170 };

// 关卡 1 控件
const sliderMedianExtend = document.getElementById("slider-median-extend");
const valMedianExtend = document.getElementById("val-median-extend");
const btnMedianAnimate = document.getElementById("btn-median-animate");
const btnMedianReset = document.getElementById("btn-median-reset");

// 关卡 2 控件
const sliderPerpExtend = document.getElementById("slider-perp-extend");
const valPerpExtend = document.getElementById("val-perp-extend");
const btnPerpFold = document.getElementById("btn-perp-fold");
const btnPerpReset = document.getElementById("btn-perp-reset");

// 关卡 3 控件
const btnHalfRotate = document.getElementById("btn-half-rotate");
const btnHalfCongruent = document.getElementById("btn-half-congruent");
const btnHalfReset = document.getElementById("btn-half-reset");

// 关卡 4 控件
const btnKCongruent = document.getElementById("btn-k-congruent");
const btnKHighlight = document.getElementById("btn-k-highlight");
const btnKReset = document.getElementById("btn-k-reset");

// --- 全息背景网格生成器 ---
function drawHologramGrid() {
    drawLayerGrid.innerHTML = "";
    const spacing = 20; // 20px 间距
    for (let y = spacing; y < 340; y += spacing) {
        const line = createSVGNode("line", {
            x1: 0, y1: y, x2: 600, y2: y,
            class: "geo-grid-line"
        });
        drawLayerGrid.appendChild(line);
    }
    for (let x = spacing; x < 600; x += spacing) {
        const line = createSVGNode("line", {
            x1: x, y1: 0, x2: x, y2: 340,
            class: "geo-grid-line"
        });
        drawLayerGrid.appendChild(line);
    }
}

// --- 通用 SVG 创建工具 ---
function createSVGNode(type, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getSvgPoint(clientX, clientY) {
    const rect = geometrySvg.getBoundingClientRect();
    return {
        x: rect.width ? ((clientX - rect.left) / rect.width) * 600 : 0,
        y: rect.height ? ((clientY - rect.top) / rect.height) * 340 : 0
    };
}

function getSvgDelta(deltaX, deltaY) {
    const rect = geometrySvg.getBoundingClientRect();
    return {
        x: rect.width ? (deltaX / rect.width) * 600 : 0,
        y: rect.height ? (deltaY / rect.height) * 340 : 0
    };
}

function getGeometryModelPoint(clientX, clientY) {
    const point = getSvgPoint(clientX, clientY);
    return {
        x: (point.x - geometryViewState.x) / geometryViewState.zoom,
        y: (point.y - geometryViewState.y) / geometryViewState.zoom
    };
}

function applyGeometryViewTransform() {
    geometryView.setAttribute(
        "transform",
        `translate(${geometryViewState.x.toFixed(2)} ${geometryViewState.y.toFixed(2)}) scale(${geometryViewState.zoom.toFixed(4)})`
    );
}

function setGeometryViewZoom(nextZoom, anchorPoint = { x: 300, y: 170 }) {
    const zoom = clamp(nextZoom, geometryViewState.minZoom, geometryViewState.maxZoom);
    const before = {
        x: (anchorPoint.x - geometryViewState.x) / geometryViewState.zoom,
        y: (anchorPoint.y - geometryViewState.y) / geometryViewState.zoom
    };
    geometryViewState.zoom = zoom;
    geometryViewState.x = anchorPoint.x - before.x * zoom;
    geometryViewState.y = anchorPoint.y - before.y * zoom;
    applyGeometryViewTransform();
}

function resetGeometryView(playSound = true) {
    geometryViewState.x = 0;
    geometryViewState.y = 0;
    geometryViewState.zoom = 1;
    geometryViewPointers.clear();
    isPanningGeometryView = false;
    viewPinchStartDistance = 0;
    applyGeometryViewTransform();
    if (playSound) playSynthSound(420, 0.05);
}

function getGeometryPointerDistance() {
    const points = Array.from(geometryViewPointers.values());
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function getGeometryPointerAnchor() {
    const points = Array.from(geometryViewPointers.values());
    if (!points.length) return { x: 300, y: 170 };
    const avg = points.reduce((sum, point) => ({
        x: sum.x + point.x,
        y: sum.y + point.y
    }), { x: 0, y: 0 });
    return getSvgPoint(avg.x / points.length, avg.y / points.length);
}

function beginGeometryPinchZoom() {
    viewPinchStartDistance = getGeometryPointerDistance();
    viewPinchStartZoom = geometryViewState.zoom;
    viewPinchAnchor = getGeometryPointerAnchor();
}

window.getGeometryAuxiliaryViewZoom = () => geometryViewState.zoom;
window.setGeometryAuxiliaryViewZoom = zoom => setGeometryViewZoom(Number(zoom) || 1);
window.resetGeometryAuxiliaryView = () => resetGeometryView(true);

function drawLine(x1, y1, x2, y2, className = "geo-line", extraAttrs = {}) {
    const attrs = { x1, y1, x2, y2, class: className, ...extraAttrs };
    const line = createSVGNode("line", attrs);
    drawLayerLines.appendChild(line);
    return line;
}

// --- 增量渲染顶点策略 (防止销毁 DOM 导致拖拽断开与抖动) ---
let renderedPoints = new Set();

function drawPoint(x, y, label, labelPos = "top", colorClass = "", dragPointId = null) {
    const pointId = `point-group-${label}`;
    renderedPoints.add(pointId);

    let dx = 0, dy = 0;
    if (labelPos === "top") { dx = -4; dy = -11; }
    else if (labelPos === "bottom") { dx = -4; dy = 19; }
    else if (labelPos === "left") { dx = -19; dy = 4; }
    else if (labelPos === "right") { dx = 11; dy = 4; }

    let g = document.getElementById(pointId);
    if (g) {
        // 如果顶点元素已经存在，仅更新 cx/cy 和文本坐标，完美解决重绘闪烁与失焦
        const circle = g.querySelector("circle");
        if (circle) {
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
        }
        const text = g.querySelector("text");
        if (text) {
            text.setAttribute("x", x + dx);
            text.setAttribute("y", y + dy);
        }
        return g;
    }

    // 首次渲染时创建 DOM 节点
    g = createSVGNode("g", { id: pointId, class: `geo-point-group ${colorClass} ${dragPointId ? 'draggable' : ''}` });
    const circle = createSVGNode("circle", { cx: x, cy: y, r: 6 });
    g.appendChild(circle);

    const text = createSVGNode("text", { class: "geo-text" });
    text.setAttribute("x", x + dx);
    text.setAttribute("y", y + dy);
    text.textContent = label;
    g.appendChild(text);

    if (dragPointId) {
        g.addEventListener("pointerdown", (e) => onDragStart(e, dragPointId), { passive: false });
        g.addEventListener("mousedown", (e) => onDragStart(e, dragPointId));
        g.addEventListener("touchstart", (e) => onDragStart(e, dragPointId), { passive: false });
        g.setAttribute("style", "cursor: grab; pointer-events: all;");
        circle.addEventListener("pointerdown", (e) => onDragStart(e, dragPointId), { passive: false });
        circle.addEventListener("mousedown", (e) => onDragStart(e, dragPointId));
        circle.addEventListener("touchstart", (e) => onDragStart(e, dragPointId), { passive: false });
        circle.setAttribute("style", "cursor: grab; pointer-events: all;");
    }

    drawLayerPoints.appendChild(g);
    return g;
}

// 移除当前帧未绘制的临时辅助顶点
function pruneUnusedPoints() {
    const children = Array.from(drawLayerPoints.children);
    children.forEach(child => {
        if (!renderedPoints.has(child.id)) {
            drawLayerPoints.removeChild(child);
        }
    });
}

function drawAngleArc(cx, cy, r, startAngle, endAngle, label = "", colorClass = "angle-arc") {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    const pathD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    const arc = createSVGNode("path", { d: pathD, class: colorClass });
    drawLayerRipples.appendChild(arc);

    if (label) {
        const midAngle = (startAngle + endAngle) / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const tx = cx + (r + 8) * Math.cos(midRad);
        const ty = cy + (r + 8) * Math.sin(midRad);
        const text = createSVGNode("text", {
            x: tx - 4, y: ty + 3,
            class: "angle-text",
            style: `fill: ${colorClass === "angle-arc-orange" ? "var(--color-orange)" : "var(--color-green)"}`
        });
        text.textContent = label;
        drawLayerRipples.appendChild(text);
    }
}

// --- 统一拖拽处理系统 ---
let activeDragPoint = null;

function setupDragging() {
    document.addEventListener("pointermove", onDragMove, { passive: false });
    document.addEventListener("pointerup", onDragEnd);
    document.addEventListener("pointercancel", onDragEnd);
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchmove", onDragMove, { passive: false });
    document.addEventListener("touchend", onDragEnd);
    window.addEventListener("pointermove", onDragMove, { passive: false });
    window.addEventListener("pointerup", onDragEnd);
    window.addEventListener("pointercancel", onDragEnd);
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);
}

function onDragStart(e, pointId) {
    e.preventDefault();
    e.stopPropagation();
    activeDragPoint = pointId;
    playSynthSound(440, 0.03);
    document.body.style.cursor = "grabbing";
}

function onDragEnd() {
    if (activeDragPoint) {
        activeDragPoint = null;
        playSynthSound(520, 0.04);
        document.body.style.cursor = "";
    }
}

function onDragMove(e) {
    if (!activeDragPoint) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const point = getGeometryModelPoint(clientX, clientY);

    playModulatedDragSound(point.x, point.y);

    updatePointPosition(activeDragPoint, point.x, point.y);
}

function getDragPointIdFromClient(clientX, clientY) {
    const candidates = Array.from(drawLayerPoints.querySelectorAll(".geo-point-group.draggable"));
    const modelPoint = getGeometryModelPoint(clientX, clientY);
    const hitRadius = Math.max(10, 24 / geometryViewState.zoom);
    let best = null;
    candidates.forEach(group => {
        const circle = group.querySelector("circle");
        if (!circle) return;
        const centerX = Number(circle.getAttribute("cx"));
        const centerY = Number(circle.getAttribute("cy"));
        const distance = Math.hypot(modelPoint.x - centerX, modelPoint.y - centerY);
        if (distance <= hitRadius && (!best || distance < best.distance)) {
            best = {
                id: group.id.replace(/^point-group-/, ""),
                distance
            };
        }
    });
    return best?.id || null;
}

function setupGeometryViewGestures() {
    const shouldPanView = event => {
        if (!geometrySvg.contains(event.target)) return false;
        if (event.target.closest?.(".hud-panel")) return false;
        if (event.target.closest?.(".geo-point-group")) return false;
        return true;
    };

    const onPointerDown = event => {
        const dragPointId = getDragPointIdFromClient(event.clientX, event.clientY);
        if (dragPointId) {
            onDragStart(event, dragPointId);
            return;
        }
        if (!shouldPanView(event)) return;
        geometryViewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        geometrySvg.setPointerCapture?.(event.pointerId);
        if (geometryViewPointers.size >= 2) {
            isPanningGeometryView = false;
            beginGeometryPinchZoom();
        } else {
            isPanningGeometryView = true;
            viewPointerStart = { x: event.clientX, y: event.clientY };
            viewPanStart = { x: geometryViewState.x, y: geometryViewState.y };
            geometrySvg.classList.add("is-panning");
        }
        event.preventDefault();
    };

    const onPointerMove = event => {
        if (!geometryViewPointers.has(event.pointerId)) return;
        geometryViewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (geometryViewPointers.size >= 2 && viewPinchStartDistance) {
            const nextDistance = getGeometryPointerDistance();
            if (nextDistance > 0) {
                setGeometryViewZoom(viewPinchStartZoom * (nextDistance / viewPinchStartDistance), viewPinchAnchor);
            }
            event.preventDefault();
            return;
        }
        if (isPanningGeometryView) {
            const delta = getSvgDelta(event.clientX - viewPointerStart.x, event.clientY - viewPointerStart.y);
            geometryViewState.x = viewPanStart.x + delta.x;
            geometryViewState.y = viewPanStart.y + delta.y;
            applyGeometryViewTransform();
            event.preventDefault();
        }
    };

    const onPointerUp = event => {
        if (!geometryViewPointers.has(event.pointerId)) return;
        geometryViewPointers.delete(event.pointerId);
        geometrySvg.releasePointerCapture?.(event.pointerId);
        if (geometryViewPointers.size >= 2) {
            beginGeometryPinchZoom();
        } else {
            isPanningGeometryView = false;
            viewPinchStartDistance = 0;
            geometrySvg.classList.remove("is-panning");
        }
        event.preventDefault();
    };

    const onWheel = event => {
        const anchor = getSvgPoint(event.clientX, event.clientY);
        const factor = Math.exp(-event.deltaY * 0.0018);
        setGeometryViewZoom(geometryViewState.zoom * factor, anchor);
        event.preventDefault();
    };

    geometrySvg.addEventListener("pointerdown", onPointerDown, { passive: false });
    geometrySvg.addEventListener("pointermove", onPointerMove, { passive: false });
    geometrySvg.addEventListener("pointerup", onPointerUp, { passive: false });
    geometrySvg.addEventListener("pointercancel", onPointerUp, { passive: false });
    geometrySvg.addEventListener("wheel", onWheel, { passive: false });
    geometrySvg.addEventListener("dblclick", () => resetGeometryView(true));
}

function updatePointPosition(pointId, x, y) {
    if (state.activeTab === "double-median") {
        const dm = state.doubleMedian;
        if (pointId === "A") {
            dm.A.x = Math.max(120, Math.min(480, x));
            dm.A.y = Math.max(40, Math.min(160, y));
        } else if (pointId === "B") {
            dm.B.x = Math.max(100, Math.min(dm.C.x - 60, x));
        } else if (pointId === "C") {
            dm.C.x = Math.max(dm.B.x + 60, Math.min(560, x));
        }
        renderDoubleMedian();
    } else if (state.activeTab === "bisector-perp") {
        const bp = state.bisectorPerp;
        if (pointId === "A") {
            bp.A.x = Math.max(220, Math.min(480, x));
            bp.A.y = Math.max(40, Math.min(120, y));
        } else if (pointId === "B") {
            bp.B.x = Math.max(80, Math.min(bp.A.x - 30, x));
            bp.B.y = Math.max(140, Math.min(300, y));
        } else if (pointId === "C") {
            bp.C.x = Math.max(bp.A.x + 30, Math.min(560, x));
            bp.C.y = Math.max(140, Math.min(300, y));
        }
        renderBisectorPerp();
    } else if (state.activeTab === "half-angle") {
        if (pointId === "E") {
            state.halfAngle.E_x = Math.max(310, Math.min(410, x));
        }
        renderHalfAngle();
    } else if (state.activeTab === "k-model") {
        const km = state.kModel;
        if (pointId === "A") {
            km.A.x = Math.max(100, Math.min(km.P.x - 40, x));
            km.A.y = Math.max(40, Math.min(220, y));
        } else if (pointId === "P") {
            km.P.x = Math.max(160, Math.min(440, x));
        } else if (pointId === "B") {
            const dx = x - km.P.x;
            const dy = y - 260;

            const L_AP = Math.sqrt((km.P.x - km.A.x) * (km.P.x - km.A.x) + (260 - km.A.y) * (260 - km.A.y));
            const u_perp_x = (260 - km.A.y) / L_AP;
            const u_perp_y = -(km.P.x - km.A.x) / L_AP;

            const dist = dx * u_perp_x + dy * u_perp_y;
            km.dist_PB = Math.max(60, Math.min(220, dist));

            if (km.isCongruentLocked) {
                km.isCongruentLocked = false;
                btnKCongruent.classList.remove("active");
            }
        }
        renderKModel();
    }
}

// --- 各关卡渲染与逻辑 ---

// === 关卡 1：倍长中线 ===
function renderDoubleMedian() {
    renderedPoints.clear();
    drawLayerLines.innerHTML = "";
    drawLayerRipples.innerHTML = "";

    const dm = state.doubleMedian;
    const A = dm.A;
    const B = dm.B;
    const C = dm.C;

    const D = { x: (B.x + C.x) / 2, y: 200 };
    const E = { x: 2 * D.x - A.x, y: 2 * D.y - A.y };

    drawLine(A.x, A.y, B.x, B.y);
    drawLine(B.x, B.y, C.x, C.y);
    drawLine(C.x, C.y, A.x, A.y);

    drawLine(A.x, A.y, D.x, D.y, "geo-line highlight-purple");

    const midBD = (B.x + D.x) / 2;
    const midCD = (C.x + D.x) / 2;
    drawLine(midBD - 2, 195, midBD + 3, 205);
    drawLine(midCD - 2, 195, midCD + 3, 205);

    const percent = dm.extendPercent;
    if (percent > 0) {
        const currentE = {
            x: D.x + (percent / 100) * (E.x - D.x),
            y: D.y + (percent / 100) * (E.y - D.y)
        };
        drawLine(D.x, D.y, currentE.x, currentE.y, "geo-line auxiliary");
        drawLine(B.x, B.y, currentE.x, currentE.y, "geo-line auxiliary");

        if (percent === 100) {
            drawPoint(E.x, E.y, "E", "bottom");
        } else {
            drawPoint(currentE.x, currentE.y, "E'", "bottom");
        }
    }

    const groupADC = createSVGNode("g", {
        id: "rotating-triangle-adc",
        style: `transform-origin: ${D.x}px ${D.y}px;`
    });

    if (dm.isRotated) {
        groupADC.style.transform = "rotate(180deg)";
        drawAngleArc(D.x, D.y, 12, 180, 243, "1");
        drawAngleArc(D.x, D.y, 12, 0, 63, "2");
        drawLine(B.x, B.y, E.x, E.y, "geo-line highlight");
        drawLine(A.x, A.y, C.x, C.y, "geo-line highlight");
    }

    const pathADC = createSVGNode("polygon", {
        points: `${A.x},${A.y} ${D.x},${D.y} ${C.x},${C.y}`,
        fill: "rgba(168, 85, 247, 0.08)",
        stroke: "var(--color-purple)",
        "stroke-width": 1.2,
        "stroke-dasharray": dm.isRotated ? "none" : "3, 3"
    });
    groupADC.appendChild(pathADC);
    drawLayerLines.appendChild(groupADC);

    drawPoint(A.x, A.y, "A", "top", "draggable", "A");
    drawPoint(B.x, B.y, "B", "left", "draggable", "B");
    drawPoint(C.x, C.y, "C", "right", "draggable", "C");
    drawPoint(D.x, D.y, "D", "top");

    pruneUnusedPoints();
    updateDoubleMedianHUD();
}

function updateDoubleMedianHUD() {
    const dm = state.doubleMedian;
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>第一步：观察目标</b><br>
            需证 AB + AC > 2AD。中线 AD 在原三角形中无法与其他线段直接组合成三角形关系。
        </div>
    `;

    if (dm.extendPercent > 0) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>第二步：倍长中线辅助线 (构造 DE = AD)</b><br>
                延长 AD 到 E，使 DE = AD。连接 BE。此时辅助线 AE = 2AD 构造完成！
            </div>
        `;
    } else {
        stepHtml += `
            <div class="proof-step-card">
                <b>提示：</b> 拖动右侧的滑块，拉长中线以注入新的几何元素。也可任意拉扯三角形顶点进行探索。
            </div>
        `;
    }

    if (dm.isRotated) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>第三步：全等转换 (△ADC ≅ △EDB)</b><br>
                由 BD = CD（中点），AD = ED（倍长构造），∠ADC = ∠EDB（对顶角）<br>
                根据 <b>SAS</b> 判定得 △ADC ≅ △EDB。<br>
                得对应边相等：<b>AC = BE</b>！
            </div>
            <div class="proof-step-card success" style="border-left-color: var(--color-orange)">
                <b>第四步：三角形三边关系觉醒</b><br>
                在 △ABE 中，根据三角形三边关系：<br>
                <b>AB + BE > AE</b><br>
                将 BE = AC，AE = 2AD 代入，即可证出：<br>
                <b style="color: var(--color-orange); font-size: 12px;">AB + AC > 2AD</b>！证明完毕。
            </div>
        `;
    }

    renderHudContent(stepHtml);
}

// === 关卡 2：角平分线+垂线 ===
function renderBisectorPerp() {
    renderedPoints.clear();
    drawLayerLines.innerHTML = "";
    drawLayerRipples.innerHTML = "";

    const bp = state.bisectorPerp;
    const A = bp.A;
    const B = bp.B;
    const C = bp.C;

    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AC = { x: C.x - A.x, y: C.y - A.y };
    const L_AB = Math.sqrt(AB.x * AB.x + AB.y * AB.y);
    const L_AC = Math.sqrt(AC.x * AC.x + AC.y * AC.y);

    const u_AB = { x: AB.x / L_AB, y: AB.y / L_AB };
    const u_AC = { x: AC.x / L_AC, y: AC.y / L_AC };

    const bisectDir = { x: u_AB.x + u_AC.x, y: u_AB.y + u_AC.y };
    const L_bisect = Math.sqrt(bisectDir.x * bisectDir.x + bisectDir.y * bisectDir.y);
    const u_bisect = { x: bisectDir.x / L_bisect, y: bisectDir.y / L_bisect };

    drawLine(A.x, A.y, B.x, B.y);
    drawLine(B.x, B.y, C.x, C.y);
    drawLine(C.x, C.y, A.x, A.y);

    const D = { x: A.x + 250 * u_bisect.x, y: A.y + 250 * u_bisect.y };
    drawLine(A.x, A.y, D.x, D.y, "geo-line highlight-purple");

    const projLength = AB.x * u_bisect.x + AB.y * u_bisect.y;
    const H = { x: A.x + projLength * u_bisect.x, y: A.y + projLength * u_bisect.y };
    const E = { x: 2 * H.x - B.x, y: 2 * H.y - B.y };

    const startAngleAB = Math.atan2(u_AB.y, u_AB.x) * 180 / Math.PI;
    const startAngleAC = Math.atan2(u_AC.y, u_AC.x) * 180 / Math.PI;
    const bisectAngle = Math.atan2(u_bisect.y, u_bisect.x) * 180 / Math.PI;
    drawAngleArc(A.x, A.y, 20, Math.min(startAngleAB, bisectAngle), Math.max(startAngleAB, bisectAngle));
    drawAngleArc(A.x, A.y, 20, Math.min(bisectAngle, startAngleAC), Math.max(bisectAngle, startAngleAC));

    const percent = bp.extendPercent;
    if (percent > 0) {
        let currentFoot = { x: B.x, y: B.y };
        if (percent <= 50) {
            currentFoot.x = B.x + (percent / 50) * (H.x - B.x);
            currentFoot.y = B.y + (percent / 50) * (H.y - B.y);
        } else {
            currentFoot.x = H.x + ((percent - 50) / 50) * (E.x - H.x);
            currentFoot.y = H.y + ((percent - 50) / 50) * (E.y - H.y);
        }

        drawLine(B.x, B.y, currentFoot.x, currentFoot.y, "geo-line auxiliary");

        if (percent >= 50) {
            drawPoint(H.x, H.y, "H", "top");
            const bhVec = { x: H.x - B.x, y: H.y - B.y };
            const bhLen = Math.sqrt(bhVec.x * bhVec.x + bhVec.y * bhVec.y);
            const u_bh = { x: bhVec.x / bhLen, y: bhVec.y / bhLen };
            const u_perp = { x: -u_bh.y, y: u_bh.x };

            const rSize = 7;
            const p1 = { x: H.x - rSize * u_bh.x, y: H.y - rSize * u_bh.y };
            const p2 = { x: p1.x - rSize * u_perp.x, y: p1.y - rSize * u_perp.y };
            const p3 = { x: H.x - rSize * u_perp.x, y: H.y - rSize * u_perp.y };

            drawLine(H.x, H.y, p1.x, p1.y, "right-angle-marker");
            drawLine(p1.x, p1.y, p2.x, p2.y, "right-angle-marker");
            drawLine(p2.x, p2.y, p3.x, p3.y, "right-angle-marker");
        }
        if (percent === 100) {
            drawPoint(E.x, E.y, "E", "right");
        }
    }

    const foldPct = bp.foldPercent;
    if (foldPct > 0) {
        const phi = (foldPct / 100) * Math.PI;
        const v = { x: B.x - A.x, y: B.y - A.y };
        const dotProduct = v.x * u_bisect.x + v.y * u_bisect.y;

        const B_rot = {
            x: A.x + v.x * Math.cos(phi) + u_bisect.x * dotProduct * (1 - Math.cos(phi)),
            y: A.y + v.y * Math.cos(phi) + u_bisect.y * dotProduct * (1 - Math.cos(phi))
        };

        const pathFolding = createSVGNode("polygon", {
            points: `${A.x},${A.y} ${B_rot.x},${B_rot.y} ${H.x},${H.y}`,
            fill: "rgba(6, 182, 212, 0.15)",
            stroke: "var(--color-cyan)",
            "stroke-width": 2,
            "stroke-dasharray": foldPct === 100 ? "none" : "3, 1"
        });
        drawLayerLines.appendChild(pathFolding);
        drawPoint(B_rot.x, B_rot.y, foldPct === 100 ? "E" : "B'", "right", "draggable");

        if (foldPct === 100) {
            drawLine(A.x, A.y, E.x, E.y, "geo-line highlight");
            drawLine(A.x, A.y, B.x, B.y, "geo-line highlight");
        }
    } else {
        const pathABH = createSVGNode("polygon", {
            points: `${A.x},${A.y} ${B.x},${B.y} ${H.x},${H.y}`,
            fill: "rgba(6, 182, 212, 0.05)",
            stroke: "var(--color-cyan)",
            "stroke-width": 1.0,
            "stroke-dasharray": "3, 3"
        });
        drawLayerLines.appendChild(pathABH);
    }

    drawPoint(A.x, A.y, "A", "top", "draggable", "A");
    drawPoint(B.x, B.y, "B", "left", "draggable", "B");
    drawPoint(C.x, C.y, "C", "right", "draggable", "C");

    pruneUnusedPoints();
    updateBisectorPerpHUD();
}

function updateBisectorPerpHUD() {
    const bp = state.bisectorPerp;
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>第一步：观察条件</b><br>
            AD 是 ∠BAC 的平分线。若要构造等腰三角形，我们需要借助角平分线的对称轴性质。
        </div>
    `;

    if (bp.extendPercent > 0) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>第二步：引垂线并延长 (构造 BE ⊥ AD)</b><br>
                过点 B 作 BH ⊥ AD 于 H，延长交 AC 于 E。此时直角与角平分线形成强力化学反应！
            </div>
        `;
    }

    if (bp.isFolded) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>第三步：对称折叠全等证明 (△ABH ≅ △AEH)</b><br>
                在 △ABH 与 △AEH 中：<br>
                ∠BAH = ∠EAH（角平分线），AH 为公共边，∠AHB = ∠AHE = 90°（垂直）<br>
                根据 <b>ASA</b> 判定得两三角形全等！
            </div>
            <div class="proof-step-card success" style="border-left-color: var(--color-orange)">
                <b>第四步：等腰三角形性质觉醒</b><br>
                全等得出：<b>AB = AE</b> 且 <b>BH = EH</b>。<br>
                由 AB = AE 可知 △ABE 是<b>等腰三角形</b>！<br>
                由 BH = EH 可知垂线段 AD 上的点 H 恰为底边 BE 的<b>中点</b>（三线合一）！
            </div>
        `;
    }

    renderHudContent(stepHtml);
}

// === 关卡 3：正方形半角模型旋转 ===
function renderHalfAngle() {
    renderedPoints.clear();
    drawLayerLines.innerHTML = "";
    drawLayerRipples.innerHTML = "";

    const ha = state.halfAngle;

    const A = { x: 310, y: 120 };
    const B = { x: 310, y: 260 };
    const C = { x: 450, y: 260 };
    const D = { x: 450, y: 120 };

    const sideLen = 140;

    const E_x = ha.E_x;
    const E = { x: E_x, y: 260 };

    const BE = E_x - 310;
    const theta_E = Math.atan2(BE, sideLen);

    const theta_F = (45 * Math.PI / 180) - theta_E;
    const DF = sideLen * Math.tan(theta_F);

    const F = { x: 450, y: 120 + DF };
    const G = { x: 450, y: 120 - BE };

    drawLine(A.x, A.y, B.x, B.y);
    drawLine(B.x, B.y, C.x, C.y);
    drawLine(C.x, C.y, D.x, D.y);
    drawLine(D.x, D.y, A.x, A.y);

    drawLine(A.x, A.y, E.x, E.y, "geo-line highlight-purple");
    drawLine(A.x, A.y, F.x, F.y, HaCongruentClass("var(--color-purple)"));
    drawLine(E.x, E.y, F.x, F.y, HaCongruentClass("var(--color-orange)"));

    const degE = theta_E * 180 / Math.PI;
    drawAngleArc(A.x, A.y, 25, 90 - degE - 45, 90 - degE, "45°");

    const groupABE = createSVGNode("g", {
        id: "rotating-triangle-abe",
        style: `transform-origin: ${A.x}px ${A.y}px;`
    });

    if (ha.isRotated) {
        groupABE.style.transform = "rotate(90deg)";
        drawPoint(G.x, G.y, "G", "right");
        drawLine(A.x, A.y, G.x, G.y, "geo-line auxiliary");
        drawLine(G.x, G.y, F.x, F.y, "geo-line auxiliary");
    }

    const pathABE = createSVGNode("polygon", {
        points: `${A.x},${A.y} ${B.x},${B.y} ${E.x},${E.y}`,
        fill: "rgba(245, 158, 11, 0.08)",
        stroke: "var(--color-orange)",
        "stroke-width": 1.2,
        "stroke-dasharray": ha.isRotated ? "none" : "3, 3"
    });
    groupABE.appendChild(pathABE);
    drawLayerLines.appendChild(groupABE);

    if (ha.isCongruentShown) {
        const polyAEF = createSVGNode("polygon", {
            points: `${A.x},${A.y} ${E.x},${E.y} ${F.x},${F.y}`,
            fill: "rgba(16, 185, 129, 0.12)",
            class: "geo-congruent-highlight",
            stroke: "var(--color-green)",
            "stroke-width": 2
        });
        const polyAGF = createSVGNode("polygon", {
            points: `${A.x},${A.y} ${G.x},${G.y} ${F.x},${F.y}`,
            fill: "rgba(16, 185, 129, 0.12)",
            class: "geo-congruent-highlight",
            stroke: "var(--color-green)",
            "stroke-width": 2
        });
        drawLayerLines.appendChild(polyAEF);
        drawLayerLines.appendChild(polyAGF);

        drawLine(E.x, E.y, F.x, F.y, "geo-line highlight");
        drawLine(G.x, G.y, F.x, F.y, "geo-line highlight");
    }

    drawPoint(A.x, A.y, "A", "left");
    drawPoint(B.x, B.y, "B", "left");
    drawPoint(C.x, C.y, "C", "right");
    drawPoint(D.x, D.y, "D", "right");
    drawPoint(E.x, E.y, "E", "bottom", "draggable", "E");
    drawPoint(F.x, F.y, "F", "right");

    const actualEF = Math.sqrt((E.x - F.x) * (E.x - F.x) + (E.y - F.y) * (E.y - F.y));
    document.getElementById("monitor-be").textContent = BE.toFixed(1);
    document.getElementById("monitor-df").textContent = DF.toFixed(1);
    document.getElementById("monitor-be-df").textContent = (BE + DF).toFixed(1);
    document.getElementById("monitor-ef").textContent = actualEF.toFixed(1);

    pruneUnusedPoints();
    updateHalfAngleHUD();
}

function HaCongruentClass(defaultColor) {
    return state.halfAngle.isCongruentShown ? "geo-line highlight" : "geo-line";
}

function updateHalfAngleHUD() {
    const ha = state.halfAngle;
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>第一步：观察几何图形</b><br>
            正方形 ABCD 中，∠EAF = 45°。要求证 EF = BE + DF。<br>
            由于 BE 和 DF 相互分离，不能直接求和，我们使用<b>旋转法</b>将它们挪到一条直线上。
        </div>
    `;

    if (ha.isRotated) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>第二步：旋转拼接变换 (△ABE → △ADG)</b><br>
                将 △ABE 绕顶点 A 顺时针旋转 90°。此时，直角边 AB 与 AD 重合，点 E 旋转落在 CD 的延长线 G 点上。<br>
                由于 △ABE ≅ △ADG，得出对应边对应角相等：<br>
                <b>AE = AG</b>，<b>BE = DG</b>，且 ∠BAE = ∠DAG。
            </div>
        `;
    }

    if (ha.isCongruentShown) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>第三步：拼角推导证明 ∠GAF = 45°</b><br>
                因为 ∠BAE + ∠DAF = 90° - ∠EAF = 45°，<br>
                so ∠GAF = ∠DAG + ∠DAF = ∠BAE + ∠DAF = 45°。<br>
                即：<b>∠GAF = ∠EAF = 45°</b>！
            </div>
            <div class="proof-step-card success" style="border-left-color: var(--color-orange)">
                <b>第四步：二次全等觉醒 (△AEF ≅ △AGF)</b><br>
                在 △AEF 与 △AGF 中：<br>
                AE = AG（旋转相等），∠EAF = ∠GAF = 45°，AF 为公共边。<br>
                根据 <b>SAS</b> 判定两个绿色大三角形全等！<br>
                得出对应边相等：<b>EF = GF</b>！<br>
                由于点 G, D, F 在同一条直线上，且 D 为中介，故：<br>
                <b>GF = GD + DF = BE + DF</b>。<br>
                代入可证：<b style="color: var(--color-orange); font-size: 12px;">EF = BE + DF</b>！
            </div>
        `;
    }

    renderHudContent(stepHtml);
}

// === 关卡 4：一线三等角 ===
function renderKModel() {
    renderedPoints.clear();
    drawLayerLines.innerHTML = "";
    drawLayerRipples.innerHTML = "";

    const km = state.kModel;
    const A = km.A;
    const P = km.P;

    const baseLineY = 260;
    const C = { x: A.x, y: baseLineY };

    const AP = { x: P.x - A.x, y: baseLineY - A.y };
    const L_AP = Math.sqrt(AP.x * AP.x + AP.y * AP.y);

    const u_perp = {
        x: (baseLineY - A.y) / L_AP,
        y: -(P.x - A.x) / L_AP
    };

    let dist = km.dist_PB;
    if (km.isCongruentLocked) {
        dist = L_AP;
        km.dist_PB = L_AP;
    }
    const B = {
        x: P.x + dist * u_perp.x,
        y: baseLineY + dist * u_perp.y
    };

    const D = { x: B.x, y: baseLineY };

    drawLine(Math.min(C.x, D.x) - 40, baseLineY, Math.max(C.x, D.x) + 40, baseLineY, "geo-line highlight-purple");

    drawLine(A.x, A.y, C.x, C.y, "geo-line auxiliary");
    drawLine(B.x, B.y, D.x, D.y, "geo-line auxiliary");

    drawLine(A.x, A.y, P.x, P.y, km.isHighlightActive ? "geo-line highlight" : "geo-line");
    drawLine(B.x, B.y, P.x, P.y, km.isHighlightActive ? "geo-line highlight" : "geo-line");

    drawLine(C.x, C.y - 7, C.x + (P.x > A.x ? 7 : -7), C.y - 7, "right-angle-marker");
    drawLine(C.x + (P.x > A.x ? 7 : -7), C.y - 7, C.x + (P.x > A.x ? 7 : -7), C.y, "right-angle-marker");

    drawLine(D.x, D.y - 7, D.x + (P.x > B.x ? 7 : -7), D.y - 7, "right-angle-marker");
    drawLine(D.x + (P.x > B.x ? 7 : -7), D.y - 7, D.x + (P.x > B.x ? 7 : -7), D.y, "right-angle-marker");

    const u_PA = { x: (A.x - P.x) / L_AP, y: (A.y - baseLineY) / L_AP };
    const rSize = 8;
    const p1 = { x: P.x + rSize * u_PA.x, y: P.y + rSize * u_PA.y };
    const p2 = { x: p1.x + rSize * u_perp.x, y: p1.y + rSize * u_perp.y };
    const p3 = { x: P.x + rSize * u_perp.x, y: P.y + rSize * u_perp.y };
    drawLine(p1.x, p1.y, p2.x, p2.y, "right-angle-marker");
    drawLine(p2.x, p2.y, p3.x, p3.y, "right-angle-marker");

    const theta_PA = Math.atan2(A.y - P.y, A.x - P.x) * 180 / Math.PI;
    const theta_BP = Math.atan2(B.y - P.y, B.x - P.x) * 180 / Math.PI;

    if (km.isHighlightActive) {
        drawAngleArc(P.x, P.y, 14, -180, theta_PA, "1", "angle-arc-green");
        drawAngleArc(B.x, B.y, 14, 90, theta_BP + 90, "1", "angle-arc-green");

        drawAngleArc(A.x, A.y, 14, 90, theta_PA - 90, "2", "angle-arc-orange");
        drawAngleArc(P.x, P.y, 14, theta_PA + 90, 0, "2", "angle-arc-orange");

        if (km.isCongruentLocked) {
            drawLine(A.x, A.y, C.x, C.y, "geo-line highlight-green");
            drawLine(P.x, P.y, D.x, D.y, "geo-line highlight-green");
            drawLine(P.x, P.y, C.x, C.y, "geo-line highlight-orange");
            drawLine(B.x, B.y, D.x, D.y, "geo-line highlight-orange");
        }
    }

    drawPoint(A.x, A.y, "A", "top", "draggable", "A");
    drawPoint(P.x, P.y, "P", "bottom", "draggable", "P");
    drawPoint(B.x, B.y, "B", "right", "draggable", "B");
    drawPoint(C.x, C.y, "C", "bottom");
    drawPoint(D.x, D.y, "D", "bottom");

    const AC = baseLineY - A.y;
    const PC = P.x - A.x;
    const BD = baseLineY - B.y;
    const PD = B.x - P.x;

    document.getElementById("monitor-k-ac").textContent = AC.toFixed(1);
    document.getElementById("monitor-k-pd").textContent = PD.toFixed(1);
    document.getElementById("monitor-k-pc").textContent = PC.toFixed(1);
    document.getElementById("monitor-k-bd").textContent = BD.toFixed(1);

    const ratio1 = AC / PD;
    const ratio2 = PC / BD;
    document.getElementById("monitor-k-ratio1").textContent = ratio1.toFixed(2);
    document.getElementById("monitor-k-ratio2").textContent = ratio2.toFixed(2);

    pruneUnusedPoints();
    updateKModelHUD();
}

function updateKModelHUD() {
    const km = state.kModel;
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>第一步：观察图形基础</b><br>
            基线上有三个直角：<b>∠ACP = ∠BDP = ∠APB = 90°</b>。<br>
            这三个等角整齐排列在一条直线上，俗称“一线三直角”或“K字模型”。
        </div>
    `;

    if (km.isHighlightActive) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>第二步：推导角等量关系 (同角的余角相等)</b><br>
                由于 ∠APC + ∠APB + ∠BPD = 180°，且 ∠APB = 90°，<br>
                得出：<b>∠APC + ∠BPD = 90°</b>。<br>
                在直角 △APC 中，<b>∠APC + ∠PAC = 90°</b>。<br>
                所以：<b style="color: var(--color-orange)">∠PAC = ∠BPD (橙色角等)</b>。<br>
                同理可证：<b style="color: var(--color-green)">∠APC = ∠PBD (绿色角等)</b>。
            </div>
            <div class="proof-step-card success">
                <b>第三步：两三角形相似判定 (AA 相似)</b><br>
                在 △APC 与 △PBD 中，两组角对应相等，得出两三角形<b>相似</b>：<br>
                <b style="color: var(--color-cyan)">△APC ∽ △PBD</b>。<br>
                得出对应边成比例：<b>AC / PD = PC / BD</b>。<br>
                拖动顶点，可以看到下方的相似比例始终完全相等！
            </div>
        `;

        if (km.isCongruentLocked) {
            stepHtml += `
                <div class="proof-step-card success" style="border-left-color: var(--color-orange)">
                    <b>第四步：锁定等腰判定全等 (ASA 全等)</b><br>
                    当斜线 <b>AP = BP</b>（等腰直角三角形 APB）时，<br>
                    因为相似比为 1，根据 <b>ASA</b> 判定两个直角三角形全等：<br>
                    <b style="color: var(--color-orange)">△APC ≅ △PBD</b>！<br>
                    得出对应边相等：<b style="color: var(--color-green)">AC = PD</b> 且 <b style="color: var(--color-purple)">PC = BD</b>。
                </div>
            `;
        }
    } else {
        stepHtml += `
            <div class="proof-step-card">
                <b>提示：</b> 点击右侧“高亮等量关系”即可看到相等角的高光动画，并能动态拉扯验证相似比例恒等！
            </div>
        `;
    }

    renderHudContent(stepHtml);
}

// --- 关关卡切换控制器 ---
function switchTab(tabId) {
    state.activeTab = tabId;
    resetGeometryView(false);

    tabBtns.forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    ctrlGroups.forEach(group => {
        group.classList.toggle("active", group.id === `ctrl-${tabId}`);
    });

    // 每次切换 tab 时彻底清空 DOM 点，以保证下一关加载时重新绑定事件
    drawLayerLines.innerHTML = "";
    drawLayerRipples.innerHTML = "";
    drawLayerPoints.innerHTML = "";

    if (tabId === "double-median") {
        whiteboardTitleText.textContent = "倍长中线几何白板";
        controlCardTitle.textContent = "倍长中线控制台";
        hintTitle.textContent = "中线构造秘籍";
        hintContent.innerHTML = `
            <h3>何时需要倍长中线？</h3>
            <ul>
                <li>已知条件包含“中线”、“中点”时。</li>
                <li>结论需要论证“线段的和、差、倍、半”关系时。</li>
                <li><b>核心套路</b>：延长中线一倍以构造中心对称的全等判定，从而转移线段。</li>
            </ul>
        `;
        renderDoubleMedian();
    } else if (tabId === "bisector-perp") {
        whiteboardTitleText.textContent = "角平分线加垂线白板";
        controlCardTitle.textContent = "角平分线垂线控制";
        hintTitle.textContent = "平分线垂线法则";
        hintContent.innerHTML = `
            <h3>何时引入平分线垂线？</h3>
            <ul>
                <li>已知包含“角平分线”以及“过底角向平分线的垂线”时。</li>
                <li><b>核心套路</b>：延长垂线使其与另一边相交，利用平分线的“镜面对称性”折叠全等三角形，唤醒<b>等腰三角形三线合一</b>。</li>
            </ul>
        `;
        renderBisectorPerp();
    } else if (tabId === "half-angle") {
        whiteboardTitleText.textContent = "正方形半角模型旋转白板";
        controlCardTitle.textContent = "半角模型操作台";
        hintTitle.textContent = "半角旋转法门";
        hintContent.innerHTML = `
            <h3>半角模型旋转窍门</h3>
            <ul>
                <li>常见于正方形（直角）、等边三角形等高对称几何图形。</li>
                <li>夹角为顶点角的一半（如 90° 中的 45°，120° 中的 60°）。</li>
                <li><b>核心套路</b>：将两端分离的直角三角形通过<b>绕顶点旋转 90°（或 120°）</b>拼在一起，创造拼接对称轴以诱导二次全等。</li>
            </ul>
        `;
        renderHalfAngle();
    } else if (tabId === "k-model") {
        whiteboardTitleText.textContent = "一线三等角 (K字模型) 几何白板";
        controlCardTitle.textContent = "一线三等角操作台";
        hintTitle.textContent = "三等角构造法门";
        hintContent.innerHTML = `
            <h3>一线三等角的核心要点</h3>
            <ul>
                <li><b>判定前提</b>：一条直线上有三个等角（通常为三个直角，也可以是等边三角形的 60° 角）。</li>
                <li><b>辅助线套路</b>：过两端顶点向基线引垂线，利用“同角的余角相等”实现角转移。</li>
                <li><b>全等与相似</b>：
                    <ul>
                        <li>当斜线段相等 ($AP=BP$) 时，两端三角形<b>全等</b> ($AC=PD$, $PC=BD$)。</li>
                        <li>当斜线段不等时，两端三角形<b>相似</b> ($AC/PD = PC/BD$)。</li>
                    </ul>
                </li>
            </ul>
        `;
        renderKModel();
    }
}

// --- 折叠动画控制器 ---
let foldAnimId = null;
function triggerFoldAnimation() {
    if (foldAnimId) cancelAnimationFrame(foldAnimId);

    state.bisectorPerp.isFolded = !state.bisectorPerp.isFolded;
    btnPerpFold.classList.toggle("active", state.bisectorPerp.isFolded);

    const targetPercent = state.bisectorPerp.isFolded ? 100 : 0;
    const duration = 800; // ms
    let startTime = null;
    const startPercent = state.bisectorPerp.foldPercent;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const ease = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        state.bisectorPerp.foldPercent = startPercent + ease * (targetPercent - startPercent);
        renderBisectorPerp();

        if (progress < 1) {
            foldAnimId = requestAnimationFrame(step);
        } else {
            state.bisectorPerp.foldPercent = targetPercent;
            renderBisectorPerp();
            foldAnimId = null;
        }
    }
    playSynthSound(600, 0.12);
    foldAnimId = requestAnimationFrame(step);
}

function setRangeValue(slider, value) {
    if (!slider) return;
    slider.value = String(value);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
}

function clickControl(control) {
    if (control && typeof control.click === "function") control.click();
}

function stepCurrentStrategy() {
    if (state.activeTab === "double-median") {
        if (state.doubleMedian.extendPercent < 100) {
            setRangeValue(sliderMedianExtend, 100);
        } else {
            clickControl(btnMedianAnimate);
        }
        return;
    }
    if (state.activeTab === "bisector-perp") {
        if (state.bisectorPerp.extendPercent < 100) {
            setRangeValue(sliderPerpExtend, 100);
        } else {
            clickControl(btnPerpFold);
        }
        return;
    }
    if (state.activeTab === "half-angle") {
        if (!state.halfAngle.isRotated) {
            clickControl(btnHalfRotate);
        } else {
            clickControl(btnHalfCongruent);
        }
        return;
    }
    if (state.activeTab === "k-model") {
        if (!state.kModel.isHighlightActive) {
            clickControl(btnKHighlight);
        } else {
            clickControl(btnKCongruent);
        }
    }
}

function runAutoDemo() {
    const tabId = state.activeTab;
    if (btnAutoDemo) btnAutoDemo.disabled = true;
    const actions = {
        "double-median": [
            () => setRangeValue(sliderMedianExtend, 100),
            () => { if (!state.doubleMedian.isRotated) clickControl(btnMedianAnimate); }
        ],
        "bisector-perp": [
            () => setRangeValue(sliderPerpExtend, 100),
            () => { if (!state.bisectorPerp.isFolded) clickControl(btnPerpFold); }
        ],
        "half-angle": [
            () => { if (!state.halfAngle.isRotated) clickControl(btnHalfRotate); },
            () => { if (!state.halfAngle.isCongruentShown) clickControl(btnHalfCongruent); }
        ],
        "k-model": [
            () => { if (!state.kModel.isCongruentLocked) clickControl(btnKCongruent); },
            () => { if (!state.kModel.isHighlightActive) clickControl(btnKHighlight); }
        ]
    }[tabId] || [];
    actions.forEach((action, index) => {
        setTimeout(() => {
            action();
            if (index === actions.length - 1 && btnAutoDemo) btnAutoDemo.disabled = false;
        }, index * 620);
    });
    if (!actions.length && btnAutoDemo) btnAutoDemo.disabled = false;
}

// --- 事件监听绑定 ---
function initEventBindings() {
    strategyBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-tab");
            if (tabId && tabId !== state.activeTab) {
                playSynthSound(500, 0.05);
                switchTab(tabId);
            }
        });
    });

    btnAutoDemo?.addEventListener("click", runAutoDemo);
    btnStepForward?.addEventListener("click", stepCurrentStrategy);
    btnViewReset?.addEventListener("click", () => resetGeometryView(true));

    [geometrySvg, document.querySelector(".control-panel")].forEach(target => {
        target?.addEventListener("contextmenu", event => event.preventDefault());
    });

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound(500, 0.05);
            switchTab(btn.getAttribute("data-tab"));
        });
    });

    // ==========================================
    // 关关卡 1 事件
    // ==========================================
    sliderMedianExtend.addEventListener("input", () => {
        state.doubleMedian.extendPercent = parseInt(sliderMedianExtend.value);
        valMedianExtend.textContent = `${sliderMedianExtend.value}%`;

        if (state.doubleMedian.extendPercent % 10 === 0) {
            playSynthSound(300 + state.doubleMedian.extendPercent * 2, 0.02);
        }
        renderDoubleMedian();
    });

    btnMedianAnimate.addEventListener("click", () => {
        if (state.doubleMedian.extendPercent < 100) {
            playSynthSound(220, 0.15, "triangle");
            showPanelNotice("先把 AD 延长到 100%，再旋转对齐。");
            return;
        }

        playSynthSound(600, 0.15);
        state.doubleMedian.isRotated = !state.doubleMedian.isRotated;
        btnMedianAnimate.classList.toggle("active", state.doubleMedian.isRotated);
        renderDoubleMedian();

        if (state.doubleMedian.isRotated) {
            setTimeout(() => {
                playSynthSound(880, 0.2, "sine");
            }, 600);
        }
    });

    btnMedianReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        state.doubleMedian.extendPercent = 0;
        state.doubleMedian.isRotated = false;
        sliderMedianExtend.value = 0;
        valMedianExtend.textContent = "0%";
        btnMedianAnimate.classList.remove("active");
        renderDoubleMedian();
    });

    // ==========================================
    // 关关卡 2 事件
    // ==========================================
    sliderPerpExtend.addEventListener("input", () => {
        state.bisectorPerp.extendPercent = parseInt(sliderPerpExtend.value);
        valPerpExtend.textContent = `${sliderPerpExtend.value}%`;

        if (state.bisectorPerp.extendPercent % 10 === 0) {
            playSynthSound(300 + state.bisectorPerp.extendPercent * 2, 0.02);
        }
        renderBisectorPerp();
    });

    btnPerpFold.addEventListener("click", triggerFoldAnimation);

    btnPerpReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        state.bisectorPerp.extendPercent = 0;
        state.bisectorPerp.isFolded = false;
        state.bisectorPerp.foldPercent = 0;
        sliderPerpExtend.value = 0;
        valPerpExtend.textContent = "0%";
        btnPerpFold.classList.remove("active");
        renderBisectorPerp();
    });

    // ==========================================
    // 关关卡 3 事件
    // ==========================================
    btnHalfRotate.addEventListener("click", () => {
        playSynthSound(600, 0.12);
        state.halfAngle.isRotated = !state.halfAngle.isRotated;
        btnHalfRotate.classList.toggle("active", state.halfAngle.isRotated);

        state.halfAngle.isCongruentShown = false;
        btnHalfCongruent.classList.remove("active");

        renderHalfAngle();

        if (state.halfAngle.isRotated) {
            setTimeout(() => {
                playSynthSound(750, 0.15, "sine");
            }, 600);
        }
    });

    btnHalfCongruent.addEventListener("click", () => {
        if (!state.halfAngle.isRotated) {
            playSynthSound(220, 0.15, "triangle");
            showPanelNotice("先点击旋转拼接，把 △ABE 转到外侧，再触发全等。");
            return;
        }

        playSynthSound(660, 0.18, "triangle");
        state.halfAngle.isCongruentShown = !state.halfAngle.isCongruentShown;
        btnHalfCongruent.classList.toggle("active", state.halfAngle.isCongruentShown);
        renderHalfAngle();

        if (state.halfAngle.isCongruentShown) {
            setTimeout(() => {
                playSynthSound(980, 0.25, "sine");
            }, 500);
        }
    });

    btnHalfReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        state.halfAngle.isRotated = false;
        state.halfAngle.isCongruentShown = false;
        btnHalfRotate.classList.remove("active");
        btnHalfCongruent.classList.remove("active");
        renderHalfAngle();
    });

    // ==========================================
    // 关关卡 4 事件
    // ==========================================
    btnKCongruent.addEventListener("click", () => {
        playSynthSound(600, 0.1);
        state.kModel.isCongruentLocked = !state.kModel.isCongruentLocked;
        btnKCongruent.classList.toggle("active", state.kModel.isCongruentLocked);
        renderKModel();
    });

    btnKHighlight.addEventListener("click", () => {
        playSynthSound(650, 0.12, "triangle");
        state.kModel.isHighlightActive = !state.kModel.isHighlightActive;
        btnKHighlight.classList.toggle("active", state.kModel.isHighlightActive);
        renderKModel();
    });

    btnKReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        state.kModel.isCongruentLocked = true;
        state.kModel.isHighlightActive = false;
        state.kModel.A = { x: 180, y: 120 };
        state.kModel.P = { x: 280, y: 260 };
        state.kModel.dist_PB = 130;

        btnKCongruent.classList.add("active");
        btnKHighlight.classList.remove("active");
        renderKModel();
    });
}

// --- 初始化入口 ---
function init() {
    drawHologramGrid(); // 绘制全息物理定位点阵网格
    switchTab("double-median");
    initEventBindings();
    setupDragging();
    setupGeometryViewGestures();
}

document.addEventListener("DOMContentLoaded", init);

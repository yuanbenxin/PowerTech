// ==========================================================================
// 不等式与区间金牌实验室 Core JavaScript Logic (app.js)
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

// 动态调制拖拽音高反馈 (节流)
let lastSoundTime = 0;
let lastSoundValue = 0;
function playModulatedDragSound(val) {
    const now = performance.now();
    if (now - lastSoundTime > 60 && Math.abs(val - lastSoundValue) > 0.1) {
        const freq = Math.max(260, Math.min(900, 500 + val * 40));
        playSynthSound(freq, 0.03, "sine");
        lastSoundValue = val;
        lastSoundTime = now;
    }
}

// --- 坐标系统投影转换 (数轴 X Spanning: 50-550, Y=170, 0在300, 1单位=25px) ---
const originX = 300;
const originY = 170;
const scaleUnit = 25;

function toSvgCoords1D(x) {
    return {
        x: originX + x * scaleUnit,
        y: originY
    };
}

function toMathCoords1D(svgX) {
    return (svgX - originX) / scaleUnit;
}

// --- 关卡 3 (货车可行域) 坐标投影 ---
// 右侧二维可行域：原点在 (360, 290), h轴(横轴)单位 = 30px (0-6m), w轴(纵轴)单位 = 9.5px (0-25t)
const feasibleOriginX = 360;
const feasibleOriginY = 290;
const feasibleScaleH = 30;
const feasibleScaleW = 9.5;

function toSvgFeasible(h, w) {
    return {
        x: feasibleOriginX + h * feasibleScaleH,
        y: feasibleOriginY - w * feasibleScaleW
    };
}

// --- 全局状态机 ---
let state = {
    activeTab: "ineq-single", // ineq-single, ineq-system, ineq-bridge
    single: {
        op: "gt", // gt (>), gte (≥), lt (<), lte (≤)
        a: 2.0
    },
    system: {
        op1: "gt", // gt (>), lt (<)
        op2: "lt",
        a: -2.0,
        b: 3.0
    },
    bridge: {
        h: 3.0, // 货车高度 (0.5m - 6.0m)
        w: 10.0 // 货车重量 (1.0t - 25.0t)
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

// HUD 折叠
const hudPanel = document.getElementById("hud-panel");
const hudToggle = document.getElementById("hud-toggle");
hudToggle.addEventListener("click", () => {
    playSynthSound(480, 0.04);
    hudPanel.classList.toggle("collapsed");
});

// SVG 图层
const drawLayerGrid = document.getElementById("draw-layer-grid");
const drawLayerBackground = document.getElementById("draw-layer-background");
const drawLayerAxes = document.getElementById("draw-layer-axes");
const drawLayerCurves = document.getElementById("draw-layer-curves");
const drawLayerMarkers = document.getElementById("draw-layer-markers");
const drawLayerPoints = document.getElementById("draw-layer-points");
const drawLayerShading = document.getElementById("draw-layer-shading");
const drawLayerTrace = document.getElementById("draw-layer-trace");

// 关卡 1 控件
const ineqBtns = document.querySelectorAll("#ctrl-ineq-single .ineq-btn-group button");
const sliderSingleA = document.getElementById("slider-single-a");
const valSingleA = document.getElementById("val-single-a");

// 关卡 2 控件
const sliderSysA = document.getElementById("slider-sys-a");
const valSysA = document.getElementById("val-sys-a");
const sliderSysB = document.getElementById("slider-sys-b");
const valSysB = document.getElementById("val-sys-b");
const btnSysOp1Gt = document.getElementById("btn-sys-op1-gt");
const btnSysOp1Lt = document.getElementById("btn-sys-op1-lt");
const btnSysOp2Gt = document.getElementById("btn-sys-op2-gt");
const btnSysOp2Lt = document.getElementById("btn-sys-op2-lt");

// 关卡 3 控件
const sliderBridgeH = document.getElementById("slider-bridge-h");
const valBridgeH = document.getElementById("val-bridge-h");
const sliderBridgeW = document.getElementById("slider-bridge-w");
const valBridgeW = document.getElementById("val-bridge-w");

// --- 通用 SVG 创建工具 ---
function createSVGNode(type, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
}

// 绘制一维/二维坐标系/数轴
function drawCoordinateSystem() {
    drawLayerGrid.innerHTML = "";
    drawLayerAxes.innerHTML = "";

    if (state.activeTab === "ineq-bridge") {
        // --- 关卡 3：分屏 二维可行域设计 ---
        // 1. 绘制分屏中线
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: 300, y1: 0, x2: 300, y2: 340,
            class: "split-divider"
        }));

        // 2. 左侧物理视口网格 (0 - 300)
        const gridUnit = 15;
        for (let x = gridUnit; x < 300; x += gridUnit) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: x, y1: 0, x2: x, y2: 340, class: "geo-grid-line" }));
        }
        for (let y = gridUnit; y < 340; y += gridUnit) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: 0, y1: y, x2: 300, y2: y, class: "geo-grid-line" }));
        }

        // 3. 右侧可行域二维网格 (300 - 600)
        // h轴 (0 - 6m)
        for (let h = 1; h <= 6; h++) {
            const pt = toSvgFeasible(h, 0);
            drawLayerGrid.appendChild(createSVGNode("line", { x1: pt.x, y1: 0, x2: pt.x, y2: 340, class: "geo-grid-line" }));
        }
        // w轴 (0 - 25t)
        for (let w = 5; w <= 25; w += 5) {
            const pt = toSvgFeasible(0, w);
            drawLayerGrid.appendChild(createSVGNode("line", { x1: 300, y1: pt.y, x2: 600, y2: pt.y, class: "geo-grid-line" }));
        }

        // 4. 右侧二维坐标轴
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: feasibleOriginX - 15, y1: feasibleOriginY, x2: 585, y2: feasibleOriginY,
            class: "geo-grid-axis"
        }));
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: feasibleOriginX, y1: 15, x2: feasibleOriginX, y2: feasibleOriginY + 15,
            class: "geo-grid-axis"
        }));

        // 轴箭头
        drawLayerAxes.appendChild(createSVGNode("polygon", { points: `585,${feasibleOriginY-4} 595,${feasibleOriginY} 585,${feasibleOriginY+4}`, class: "geo-axis-arrow" }));
        drawLayerAxes.appendChild(createSVGNode("polygon", { points: `${feasibleOriginX-4},15 ${feasibleOriginX},5 ${feasibleOriginX+4},15`, class: "geo-axis-arrow" }));

        // 轴标签
        const labelH = createSVGNode("text", { x: 580, y: feasibleOriginY + 14, class: "geo-tick-label" });
        labelH.textContent = "h (m)";
        const labelW = createSVGNode("text", { x: feasibleOriginX - 18, y: 15, class: "geo-tick-label" });
        labelW.textContent = "w (t)";
        drawLayerAxes.appendChild(labelH);
        drawLayerAxes.appendChild(labelW);

        // h轴刻度标签
        for (let h = 1; h <= 6; h++) {
            const pt = toSvgFeasible(h, 0);
            drawLayerAxes.appendChild(createSVGNode("line", { x1: pt.x, y1: feasibleOriginY - 3, x2: pt.x, y2: feasibleOriginY + 3, class: "geo-tick-line" }));
            const text = createSVGNode("text", { x: pt.x, y: feasibleOriginY + 12, class: "geo-tick-label" });
            text.textContent = h;
            drawLayerAxes.appendChild(text);
        }

        // w轴刻度标签 (5, 10, 15, 20, 25)
        for (let w = 5; w <= 25; w += 5) {
            const pt = toSvgFeasible(0, w);
            drawLayerAxes.appendChild(createSVGNode("line", { x1: feasibleOriginX - 3, y1: pt.y, x2: feasibleOriginX + 3, y2: pt.y, class: "geo-tick-line" }));
            const text = createSVGNode("text", { x: feasibleOriginX - 14, y: pt.y + 3, class: "geo-tick-label" });
            text.textContent = w;
            drawLayerAxes.appendChild(text);
        }

        // 原点 0
        const oText = createSVGNode("text", { x: feasibleOriginX - 8, y: feasibleOriginY + 10, class: "geo-tick-label" });
        oText.textContent = "0";
        drawLayerAxes.appendChild(oText);

    } else {
        // --- 关卡 1 & 2：一维数轴设计 (Y = 200 为数轴，避开上方 120-150 的辅助投影层) ---
        const axisY = 200;
        
        // 1. 绘制浅色背景格子纸
        const gridSpacing = scaleUnit;
        for (let x = gridSpacing; x < 600; x += gridSpacing) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: x, y1: 0, x2: x, y2: 340, class: "geo-grid-line" }));
        }
        for (let y = gridSpacing; y < 340; y += gridSpacing) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: 0, y1: y, x2: 600, y2: y, class: "geo-grid-line" }));
        }

        // 2. 数轴主体线 (从 X = 30 到 570)
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: 30, y1: axisY, x2: 570, y2: axisY,
            class: "geo-grid-axis number-line"
        }));

        // 轴双向/单向箭头 (数轴右端箭头)
        drawLayerAxes.appendChild(createSVGNode("polygon", {
            points: `570,${axisY-4} 580,${axisY} 570,${axisY+4}`,
            class: "geo-axis-arrow"
        }));

        // x轴标签
        const labelX = createSVGNode("text", { x: 575, y: axisY + 16, class: "geo-tick-label", style: "font-size: 10px;" });
        labelX.textContent = "x";
        drawLayerAxes.appendChild(labelX);

        // 数轴刻度标签 (-8 到 8)
        for (let xm = -8; xm <= 8; xm++) {
            const px = originX + xm * scaleUnit;
            drawLayerAxes.appendChild(createSVGNode("line", {
                x1: px, y1: axisY - 4, x2: px, y2: axisY + 4,
                class: "geo-tick-line"
            }));
            const labelText = createSVGNode("text", {
                x: px, y: axisY + 14,
                class: "geo-tick-label"
            });
            labelText.textContent = xm;
            drawLayerAxes.appendChild(labelText);
        }
    }
}

// --- 增量点绘制策略 ---
let renderedPoints = new Set();

function drawPoint(x, y, label, labelPos = "top", colorClass = "", dragPointId = null, coordinateType = "normal") {
    const pointId = `point-group-${label.replace(/[\s\(\),]/g, '-')}-${coordinateType}`;
    renderedPoints.add(pointId);

    let dx = 0, dy = 0;
    if (labelPos === "top") { dx = -4; dy = -11; }
    else if (labelPos === "bottom") { dx = -4; dy = 19; }
    else if (labelPos === "left") { dx = -19; dy = 4; }
    else if (labelPos === "right") { dx = 11; dy = 4; }

    let svgPt;
    if (coordinateType === "1d-main") {
        svgPt = { x: originX + x * scaleUnit, y: 200 };
    } else if (coordinateType === "1d-辅助-a") {
        svgPt = { x: originX + x * scaleUnit, y: 150 };
    } else if (coordinateType === "1d-辅助-b") {
        svgPt = { x: originX + x * scaleUnit, y: 120 };
    } else if (coordinateType === "feasible-region") {
        svgPt = toSvgFeasible(x, y);
    } else {
        svgPt = toSvgCoords1D(x);
    }

    let g = document.getElementById(pointId);
    if (g) {
        const circle = g.querySelector("circle");
        if (circle) {
            circle.setAttribute("cx", svgPt.x);
            circle.setAttribute("cy", svgPt.y);
        }
        const text = g.querySelector("text");
        if (text) {
            text.setAttribute("x", svgPt.x + dx);
            text.setAttribute("y", svgPt.y + dy);
        }
        return g;
    }

    g = createSVGNode("g", { id: pointId, class: `geo-point-group ${colorClass} ${dragPointId ? 'draggable' : ''}` });
    const circle = createSVGNode("circle", { cx: svgPt.x, cy: svgPt.y, r: 6 });
    g.appendChild(circle);
    
    const text = createSVGNode("text", { class: "geo-text" });
    text.setAttribute("x", svgPt.x + dx);
    text.setAttribute("y", svgPt.y + dy);
    text.textContent = label;
    g.appendChild(text);
    
    if (dragPointId) {
        circle.addEventListener("mousedown", (e) => onDragStart(e, dragPointId));
        circle.addEventListener("touchstart", (e) => onDragStart(e, dragPointId), { passive: false });
        circle.setAttribute("style", "cursor: grab; pointer-events: all;");
    }
    
    drawLayerPoints.appendChild(g);
    return g;
}

function pruneUnusedPoints() {
    const children = Array.from(drawLayerPoints.children);
    children.forEach(child => {
        if (!renderedPoints.has(child.id)) {
            drawLayerPoints.removeChild(child);
        }
    });
}

// 绘制一维解集射线
function drawRayCurve(startVal, direction, hasEqual, colorClass = "shading-blue", targetY = 200) {
    const pxStart = originX + startVal * scaleUnit;
    const pxEnd = direction === "right" ? 570 : 30;
    
    // 1. 绘制水平折射横线
    const line = createSVGNode("line", {
        x1: pxStart, y1: targetY, x2: pxEnd, y2: targetY,
        class: `geo-curve ${colorClass}`
    });
    drawLayerCurves.appendChild(line);

    // 2. 绘制端点朝上的垂直辅助折线 (如果 targetY 不在主轴 200 上)
    if (targetY !== 200) {
        const verticalSupport = createSVGNode("line", {
            x1: pxStart, y1: 200, x2: pxStart, y2: targetY,
            class: "geo-indicator-line"
        });
        drawLayerMarkers.appendChild(verticalSupport);
    }

    // 3. 绘制端点的空心/实心点
    const pointClass = hasEqual ? "solid-point" : "hollow-point";
    const label = `${startVal.toFixed(1)}`;
    
    const coordinateTypeAttr = targetY === 200 ? "1d-main" : (targetY === 150 ? "1d-辅助-a" : "1d-辅助-b");
    const circleColor = colorClass.includes("purple") ? "point-purple" : "point-blue";
    
    drawPoint(startVal, 0, label, "bottom", `${pointClass} ${circleColor}`, null, coordinateTypeAttr);
}

// 绘制指示虚线
function drawDottedIndicator(fromMath, toMath, coordinateType = "normal") {
    const fromSvg = (coordinateType === "feasible-region")
        ? toSvgFeasible(fromMath.x, fromMath.y)
        : toSvgCoords1D(fromMath.x);
    const toSvg = (coordinateType === "feasible-region")
        ? toSvgFeasible(toMath.x, toMath.y)
        : toSvgCoords1D(toMath.x);
    
    const line = createSVGNode("line", {
        x1: fromSvg.x, y1: fromSvg.y, x2: toSvg.x, y2: toSvg.y,
        class: "geo-indicator-line"
    });
    drawLayerMarkers.appendChild(line);
}

// 轨迹粒子生成器
function createTraceDot(x, y, color = "purple") {
    const dot = createSVGNode("circle", {
        cx: x, cy: y, r: 3.5,
        class: `trace-dot ${color === 'green' ? 'green' : ''}`
    });
    drawLayerTrace.appendChild(dot);
    
    setTimeout(() => {
        if (dot.parentNode === drawLayerTrace) {
            drawLayerTrace.removeChild(dot);
        }
    }, 1000);
}

// --- 统一拖拽控制 ---
let activeDragPoint = null;

function setupDragging() {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);
}

function onDragStart(e, pointId) {
    e.preventDefault();
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
    
    const svg = document.getElementById("geometry-svg");
    const rect = svg.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const svgX = ((clientX - rect.left) / rect.width) * 600;
    const svgY = ((clientY - rect.top) / rect.height) * 340;
    
    // 生成轨迹尾迹粒子
    createTraceDot(svgX, svgY, state.activeTab === "ineq-system" ? "green" : "purple");

    if (state.activeTab === "ineq-bridge") {
        // 二维坐标反投影
        const mathH = Math.max(0.5, Math.min(6.0, (svgX - feasibleOriginX) / feasibleScaleH));
        const mathW = Math.max(1.0, Math.min(25.0, (feasibleOriginY - svgY) / feasibleScaleW));
        playModulatedDragSound(mathH);
        updatePointPosition(activeDragPoint, mathH, mathW);
    } else {
        const mathX = toMathCoords1D(svgX);
        const constrainedX = Math.max(-8.0, Math.min(8.0, mathX));
        playModulatedDragSound(constrainedX);
        updatePointPosition(activeDragPoint, constrainedX, 0);
    }
}

function updatePointPosition(pointId, mx, my) {
    if (state.activeTab === "ineq-single") {
        if (pointId === "Single_A_Dragger") {
            state.single.a = mx;
            sliderSingleA.value = Math.round(mx * 10);
            valSingleA.textContent = mx.toFixed(1);
            renderSingle();
        }
    } else if (state.activeTab === "ineq-system") {
        if (pointId === "System_A_Dragger") {
            state.system.a = mx;
            sliderSysA.value = Math.round(mx * 10);
            valSysA.textContent = mx.toFixed(1);
            renderSystem();
        } else if (pointId === "System_B_Dragger") {
            state.system.b = mx;
            sliderSysB.value = Math.round(mx * 10);
            valSysB.textContent = mx.toFixed(1);
            renderSystem();
        }
    } else if (state.activeTab === "ineq-bridge") {
        if (pointId === "Bridge_P_Feasible") {
            state.bridge.h = mx;
            state.bridge.w = my;
            
            sliderBridgeH.value = Math.round(mx * 10);
            sliderBridgeW.value = Math.round(my * 10);
            valBridgeH.textContent = `${mx.toFixed(1)} m`;
            valBridgeW.textContent = `${my.toFixed(1)} t`;
            
            renderBridge();
        }
    }
}

// === 各关卡渲染与逻辑 ===

// === 关卡 1：单不等式数轴与区间 ===
function renderSingle() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";
    drawLayerBackground.innerHTML = "";

    const op = state.single.op;
    const a = state.single.a;

    // 1. 判断方向与是否包含等号
    const direction = (op === "gt" || op === "gte") ? "right" : "left";
    const hasEqual = (op === "gte" || op === "lte");

    // 2. 绘制解集射线
    drawRayCurve(a, direction, hasEqual, "shading-blue", 200);

    // 3. 绘制主控制拉环
    drawPoint(a, 0, "拉动边界值 A", "top", "dragger-blue draggable", "Single_A_Dragger", "1d-main");

    // 4. 计算代数公式与区间符号
    let algebraText = "";
    let intervalText = "";
    
    if (op === "gt") {
        algebraText = `x > ${a.toFixed(1)}`;
        intervalText = `(${a.toFixed(1)}, +∞)`;
    } else if (op === "gte") {
        algebraText = `x ≥ ${a.toFixed(1)}`;
        intervalText = `[${a.toFixed(1)}, +∞)`;
    } else if (op === "lt") {
        algebraText = `x < ${a.toFixed(1)}`;
        intervalText = `(-∞, ${a.toFixed(1)})`;
    } else if (op === "lte") {
        algebraText = `x ≤ ${a.toFixed(1)}`;
        intervalText = `(-∞, ${a.toFixed(1)}]`;
    }

    document.getElementById("monitor-single-algebra").textContent = algebraText;
    document.getElementById("monitor-single-interval").textContent = intervalText;

    pruneUnusedPoints();
    updateSingleHUD(a, op, intervalText);
}

function updateSingleHUD(a, op, intervalText) {
    let stepHtml = "";
    const ineqSign = op === "gt" ? ">" : (op === "gte" ? "≥" : (op === "lt" ? "<" : "≤"));
    const isSolid = (op === "gte" || op === "lte");

    stepHtml += `
        <div class="proof-step-card">
            <b>1. 不等号与点形映射法则</b><br>
            当前不等式：<b>x ${ineqSign} ${a.toFixed(1)}</b>。<br>
            * <b>${isSolid ? '实心点' : '空心圆'}</b>：含有等号时（≥/≤），端点属于解集，画为实心点；不含等号时（&gt;/&lt;），端点不属于解集，画为空心点。
        </div>
        <div class="proof-step-card success">
            <b>2. 射线方向法则</b><br>
            * 大于向右延伸（&gt;/≥），小于向左延伸（&lt;/≤）。<br>
            当前射线朝<b>${(op === 'gt' || op === 'gte') ? '右' : '左'}</b>画出。
        </div>
        <div class="proof-step-card success" style="border-left-color: var(--color-purple)">
            <b>3. 区间表示法规则</b><br>
            解区间：<b>${intervalText}</b>。<br>
            * <b>圆括号 ( / )</b> 表示不包含端点（开区间）。<br>
            * <b>方括号 [ / ]</b> 表示包含端点（闭区间）。<br>
            * 无穷大符号（+∞ / -∞）端永远使用圆括号。
        </div>
    `;

    hudContent.innerHTML = stepHtml;
}

// === 关卡 2：不等式组与口诀 ===
function renderSystem() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";
    drawLayerBackground.innerHTML = "";

    const op1 = state.system.op1; // gt, lt
    const op2 = state.system.op2; // gt, lt
    const a = state.system.a;
    const b = state.system.b;

    // 1. 绘制两条辅助不等式射线 (Y = 150 与 Y = 120)
    const dir1 = op1 === "gt" ? "right" : "left";
    const dir2 = op2 === "gt" ? "right" : "left";

    // 关卡 2 统一为开区间（空心点，初中教学口诀通常以开区间为主，更加清晰）
    drawRayCurve(a, dir1, false, "shading-blue", 150);
    drawRayCurve(b, dir2, false, "shading-purple", 120);

    // 2. 在主数轴 (Y = 200) 上绘制控制拉环
    drawPoint(a, 0, "拉动边界 a", "top", "dragger-blue draggable", "System_A_Dragger", "1d-main");
    drawPoint(b, 0, "拉动边界 b", "top", "dragger-purple draggable", "System_B_Dragger", "1d-main");

    // 3. 计算公共交集并进行高亮
    // 我们找出 a 和 b 射线的交集范围
    // 条件1: x > a (若gt) 且 x > b (若gt)
    // 根据 op1, op2, a, b 的值判断重叠
    const isGt1 = op1 === "gt";
    const isGt2 = op2 === "gt";

    let hasIntersection = false;
    let intersectStart = -Infinity;
    let intersectEnd = Infinity;
    let mnemonic = "";
    let intervalText = "";

    if (isGt1 && isGt2) {
        // 同大取大
        hasIntersection = true;
        intersectStart = Math.max(a, b);
        intersectEnd = Infinity;
        mnemonic = "同大取大";
        intervalText = `(${intersectStart.toFixed(1)}, +∞)`;
    } else if (!isGt1 && !isGt2) {
        // 同小取小
        hasIntersection = true;
        intersectStart = -Infinity;
        intersectEnd = Math.min(a, b);
        mnemonic = "同小取小";
        intervalText = `(-∞, ${intersectEnd.toFixed(1)})`;
    } else {
        // 一大一小
        // 假设形式是 x > min(a,b) 且 x < max(a,b)
        // 也就是大的向左，小的向右，那就是中间找
        // 比如 x > a 且 x < b. 如果 a < b, 则是 (a, b)
        // 比如 x < a 且 x > b. 如果 b < a, 则是 (b, a)
        const gtVal = isGt1 ? a : b;
        const ltVal = isGt1 ? b : a;

        if (gtVal < ltVal) {
            hasIntersection = true;
            intersectStart = gtVal;
            intersectEnd = ltVal;
            mnemonic = "大小小大中间找";
            intervalText = `(${intersectStart.toFixed(1)}, ${intersectEnd.toFixed(1)})`;
        } else {
            hasIntersection = false;
            mnemonic = "大大小小找不到 (无解)";
            intervalText = "∅ (空集)";
        }
    }

    // 4. 在主轴高亮绘制交集线段 (绿色粗发光线)
    if (hasIntersection) {
        const pxS = intersectStart === -Infinity ? 30 : (originX + intersectStart * scaleUnit);
        const pxE = intersectEnd === Infinity ? 570 : (originX + intersectEnd * scaleUnit);
        
        const shadingLine = createSVGNode("line", {
            x1: pxS, y1: 200, x2: pxE, y2: 200,
            class: "shading-green"
        });
        drawLayerShading.appendChild(shadingLine);

        // 如果是有限闭合区间, 绘制两端空心点投影
        if (intersectStart !== -Infinity) {
            drawPoint(intersectStart, 0, `交界 ${intersectStart.toFixed(1)}`, "bottom", "hollow-point point-blue", null, "1d-main");
        }
        if (intersectEnd !== -Infinity) {
            drawPoint(intersectEnd, 0, `交界 ${intersectEnd.toFixed(1)}`, "bottom", "hollow-point point-purple", null, "1d-main");
        }
    }

    // 5. 更新右侧控制面板
    const exprText = `x ${isGt1 ? '>' : '<'} ${a.toFixed(1)} 且 x ${isGt2 ? '>' : '<'} ${b.toFixed(1)}`;
    document.getElementById("monitor-sys-expr").textContent = exprText;
    document.getElementById("monitor-sys-mnemonic").textContent = mnemonic;
    document.getElementById("monitor-sys-interval").textContent = intervalText;

    pruneUnusedPoints();
    updateSystemHUD(a, b, op1, op2, mnemonic, intervalText);
}

function updateSystemHUD(a, b, op1, op2, mnemonic, intervalText) {
    let stepHtml = "";
    const isGt1 = op1 === "gt";
    const isGt2 = op2 === "gt";

    stepHtml += `
        <div class="proof-step-card">
            <b>1. 双不等式辅助排布</b><br>
            * 蓝线代表 x ${isGt1 ? '&gt;' : '&lt;'} a = <b>${a.toFixed(1)}</b>；<br>
            * 紫线代表 x ${isGt2 ? '&gt;' : '&lt;'} b = <b>${b.toFixed(1)}</b>。<br>
            两根线分别在其辅助数轴高度平行拉开，投射到主轴。
        </div>
        <div class="proof-step-card success">
            <b>2. 公共解集（绿色流光）</b><br>
            不等式组的解集为两个不等式解的<b>交集（重叠部分）</b>。<br>
            当前解集区间为：<b>${intervalText}</b>。
        </div>
    `;

    if (mnemonic.includes("同大")) {
        stepHtml += `
            <div class="proof-step-card success" style="border-left-color: var(--color-purple)">
                <b>3. 🌟 口诀判定：同大取大</b><br>
                两射线都朝右。重叠区间自然在更右边（更大值）的右侧：<b>x &gt; ${Math.max(a, b).toFixed(1)}</b>。
            </div>
        `;
    } else if (mnemonic.includes("同小")) {
        stepHtml += `
            <div class="proof-step-card success" style="border-left-color: var(--color-purple)">
                <b>3. 🌟 口诀判定：同小取小</b><br>
                两射线都朝左。重叠区间在更左边（更小值）的左侧：<b>x &lt; ${Math.min(a, b).toFixed(1)}</b>。
            </div>
        `;
    } else if (mnemonic.includes("中间找")) {
        stepHtml += `
            <div class="proof-step-card success" style="border-left-color: var(--color-purple)">
                <b>3. 🌟 口诀判定：大小小大中间找</b><br>
                一朝左一朝右，且相互交叉。解集被夹在两边界点中间。
            </div>
        `;
    } else {
        stepHtml += `
            <div class="proof-step-card warning" style="border-left-color: var(--color-red)">
                <b>3. ⚠️ 极限冲突：大大小小找不到</b><br>
                两射线背道而驰，无任何重叠交集！此时<b>不等式组无解</b>，解区间为空集 ∅。
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 关卡 3：货车过桥可行域 ===
function renderBridge() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";
    drawLayerBackground.innerHTML = "";

    const h = state.bridge.h; // 高度
    const w = state.bridge.w; // 重量

    const isHeightSafe = h <= 4.2;
    const isWeightSafe = w <= 15.0;

    // === 左侧子画面 (0 - 300) 货车过桥物理画面 ===
    // 1. 绘制桥梁拱形支撑体
    const arch = createSVGNode("path", {
        d: "M 130,250 C 150,280 280,280 300,250 L 300,300 L 130,300 Z",
        class: "bridge-arch"
    });
    drawLayerBackground.appendChild(arch);

    // 2. 绘制桥面线 (Y = 250)
    // 根据重量 w 是否超载决定是否 sagging (超重塌陷)
    const bridgePath = createSVGNode("path", {
        d: isWeightSafe ? "M 130,250 Q 215,250 300,250" : "M 130,250 Q 215,268 300,250",
        class: `bridge-deck ${isWeightSafe ? '' : 'sagging'}`
    });
    drawLayerMarkers.appendChild(bridgePath);

    // 3. 绘制限高架 (X = 200. 4.2m ⟹ Y = 250 - 4.2 * 25 = 145)
    // 立柱
    drawLayerMarkers.appendChild(createSVGNode("line", { x1: 200, y1: 250, x2: 200, y2: 140, class: "height-limit-bar" }));
    // 横栏杆
    drawLayerMarkers.appendChild(createSVGNode("line", { x1: 180, y1: 145, x2: 220, y2: 145, class: "height-limit-bar" }));
    drawLayerMarkers.appendChild(createSVGNode("line", { x1: 182, y1: 145, x2: 218, y2: 145, class: "height-limit-stripe" }));
    // 限高标志牌
    const signCircle = createSVGNode("circle", { cx: 200, cy: 125, r: 10, stroke: "red", "stroke-width": "1.5px", fill: "white" });
    const signText = createSVGNode("text", { x: 200, y: 128, class: "geo-text", style: "text-anchor:middle; font-size:7px; fill:black;" });
    signText.textContent = "4.2m";
    drawLayerMarkers.appendChild(signCircle);
    drawLayerMarkers.appendChild(signText);

    // 4. 绘制货车本体 (放置在 X = 140)
    const cabHeight = 35; // 车头高度固定
    const truckY = 250;
    
    // 车底盘和轮子
    drawLayerMarkers.appendChild(createSVGNode("rect", { x: 120, y: truckY - 10, width: 70, height: 10, fill: "#334155" }));
    drawLayerMarkers.appendChild(createSVGNode("circle", { cx: 135, cy: truckY, r: 8, class: "truck-wheel" }));
    drawLayerMarkers.appendChild(createSVGNode("circle", { cx: 175, cy: truckY, r: 8, class: "truck-wheel" }));
    
    // 车头 (Cab)
    drawLayerMarkers.appendChild(createSVGNode("rect", { x: 165, y: truckY - cabHeight, width: 20, height: cabHeight - 10, class: "truck-cab" }));
    
    // 车尾货箱
    // 货箱高度由 h 决定。比例尺 1m = 25px
    const pxTruckH = h * 25;
    drawLayerMarkers.appendChild(createSVGNode("rect", {
        x: 120, y: truckY - pxTruckH, width: 45, height: pxTruckH - 10,
        class: `truck-cargo ${w > 15 ? 'heavy' : ''}`
    }));

    // 5. 危险动效绘制
    if (!isHeightSafe) {
        // 撞限高架！绘制爆炸星
        const expStar = createSVGNode("polygon", {
            points: "180,145 183,135 193,138 186,146 190,156 180,150 170,156 174,146 167,138 177,135",
            class: "explosion-star"
        });
        drawLayerMarkers.appendChild(expStar);
        
        const collisionText = createSVGNode("text", {
            x: 205, y: 90,
            class: "geo-text",
            style: "fill: var(--color-red); font-size:11px; font-weight:800; text-anchor:middle;"
        });
        collisionText.textContent = "💥 撞击警告：高度超限！";
        drawLayerMarkers.appendChild(collisionText);
    }
    
    if (!isWeightSafe) {
        const crashText = createSVGNode("text", {
            x: 215, y: 285,
            class: "geo-text",
            style: "fill: var(--color-red); font-size:11px; font-weight:800; text-anchor:middle;"
        });
        crashText.textContent = "⚠️ 桥梁崩塌警报：重量超载！";
        drawLayerMarkers.appendChild(crashText);
    }

    // === 右侧子画面 (300 - 600) 二维可行域图 ===
    // 1. 绘制矩形安全可行域：[0, 4.2] x [0, 15]
    // width: 4.2 * 30 = 126px, height: 15 * 9.5 = 142.5px
    const rectW = 4.2 * feasibleScaleH;
    const rectH = 15.0 * feasibleScaleW;
    const rectY = feasibleOriginY - rectH;

    const safeRect = createSVGNode("rect", {
        x: feasibleOriginX, y: rectY, width: rectW, height: rectH,
        class: "feasible-region"
    });
    drawLayerShading.appendChild(safeRect);

    // 标记限制线
    // 垂直限高线 h = 4.2
    const lineLimitH = createSVGNode("line", {
        x1: feasibleOriginX + rectW, y1: feasibleOriginY, x2: feasibleOriginX + rectW, y2: 15,
        class: "geo-indicator-line",
        style: "stroke: var(--color-red); stroke-width: 1.2px;"
    });
    drawLayerMarkers.appendChild(lineLimitH);
    
    // 水平限重线 w = 15
    const lineLimitW = createSVGNode("line", {
        x1: feasibleOriginX, y1: rectY, x2: 585, y2: rectY,
        class: "geo-indicator-line",
        style: "stroke: var(--color-red); stroke-width: 1.2px;"
    });
    drawLayerMarkers.appendChild(lineLimitW);

    // 2. 绘制当前状态点 P(h, w)
    const isSafe = isHeightSafe && isWeightSafe;
    drawPoint(h, w, `P(${h.toFixed(1)}m, ${w.toFixed(1)}t)`, "top", `feasible-pointer ${isSafe ? '' : 'danger'} draggable`, "Bridge_P_Feasible", "feasible-region");
    
    // 投影虚线
    drawDottedIndicator({ x: h, y: w }, { x: h, y: 0 }, "feasible-region");
    drawDottedIndicator({ x: h, y: w }, { x: 0, y: w }, "feasible-region");

    // 3. 更新面板监控卡文字
    document.getElementById("monitor-bridge-h-status").textContent = isHeightSafe ? "安全通关" : "高度超限！";
    document.getElementById("monitor-bridge-h-status").style.color = isHeightSafe ? "var(--color-green)" : "var(--color-red)";
    
    document.getElementById("monitor-bridge-w-status").textContent = isWeightSafe ? "安全通行" : "重量超载！";
    document.getElementById("monitor-bridge-w-status").style.color = isWeightSafe ? "var(--color-green)" : "var(--color-red)";

    const summaryEl = document.getElementById("monitor-bridge-summary");
    if (isSafe) {
        summaryEl.textContent = "🟢 安全放行";
        summaryEl.style.color = "var(--color-green)";
    } else {
        summaryEl.textContent = "🔴 危险禁止！";
        summaryEl.style.color = "var(--color-red)";
    }

    pruneUnusedPoints();
    updateBridgeHUD(h, w, isSafe, isHeightSafe, isWeightSafe);
}

function updateBridgeHUD(h, w, isSafe, isHeightSafe, isWeightSafe) {
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>1. 实际不等式建模限制</b><br>
            公路过桥面临两个物理约束条件：<br>
            * 高度限制：<b>h ≤ 4.2 米</b>（限高架防撞）；<br>
            * 重量限制：<b>w ≤ 15.0 吨</b>（桥梁承载）。
        </div>
        <div class="proof-step-card">
            <b>2. 二维可行域（绿色网格矩形）</b><br>
            二元一次不等式组：<br>
            { h ≤ 4.2, w ≤ 15.0 }<br>
            所包围的重叠区域，即为**安全可行域**！
        </div>
    `;

    if (isSafe) {
        stepHtml += `
            <div class="proof-step-card success" style="border-left-color: var(--color-green)">
                <b>3. 🌟 安全绿灯通关中</b><br>
                当前货车高 <b>${h.toFixed(1)}米</b>，重 <b>${w.toFixed(1)}吨</b>。两项参数均在可行域矩形内部，货车可以安全过桥。
            </div>
        `;
    } else {
        let violationDesc = [];
        if (!isHeightSafe) violationDesc.push("高度超限导致撞击限高栏");
        if (!isWeightSafe) violationDesc.push("重量超载引起桥梁塌陷");
        
        stepHtml += `
            <div class="proof-step-card warning" style="border-left-color: var(--color-red)">
                <b>3. 🔴 警报：可行域越界！</b><br>
                当前状态点 P 越出了安全可行域边界，进入红色警戒区！<br>
                * 触发事件：<b>${violationDesc.join(" & ")}</b>。<br>
                <i>提示：请拉动可行域中的点 P 回到绿色矩形内，以恢复安全放行状态。</i>
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 关卡切换控制 ===
function switchTab(tabId) {
    state.activeTab = tabId;

    tabBtns.forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    ctrlGroups.forEach(group => {
        group.classList.toggle("active", group.id === `ctrl-${tabId}`);
    });

    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerPoints.innerHTML = "";
    drawLayerShading.innerHTML = "";
    drawLayerTrace.innerHTML = "";
    drawLayerBackground.innerHTML = "";

    drawCoordinateSystem();

    if (tabId === "ineq-single") {
        whiteboardTitleText.textContent = "一元一次不等式解集与区间";
        controlCardTitle.textContent = "不等号与界点控制台";
        hintTitle.textContent = "不等式与数轴秘籍";
        hintContent.innerHTML = `
            <h3>端点与方向的对应法则</h3>
            <ul>
                <li><b>空心还是实心？</b>：大于号(>)与小于号(<)画空心圈；大于等于号(≥)与小于等于号(≤)画实心点。</li>
                <li><b>向左还是向右？</b>：大于号(>/≥)代表解在右侧，向右画；小于号(</≤)代表解在左侧，向左画。</li>
                <li><b>括号的法则</b>：开区间用圆括号 ( )；闭区间用方括号 [ ]。</li>
            </ul>
        `;
        renderSingle();
    } else if (tabId === "ineq-system") {
        whiteboardTitleText.textContent = "一元一次不等式组经典判定";
        controlCardTitle.textContent = "双不等式条件控制台";
        hintTitle.textContent = "解集速记判定口诀";
        hintContent.innerHTML = `
            <h3>中考解集经典口诀</h3>
            <ul>
                <li><b>同大取大</b>：当两个条件都朝右(x > a 且 x > b)，公共部分取较大边界值的右侧。</li>
                <li><b>同小取小</b>：当两个条件都朝左(x < a 且 x < b)，公共部分取较小边界值的左侧。</li>
                <li><b>大小小大中间找</b>：当一朝左一朝右且交叉，公共解集被夹在它们中间。</li>
                <li><b>大大小小找不到</b>：两射线无重合交叉，说明该不等式组无解(空集 ∅)。</li>
            </ul>
        `;
        renderSystem();
    } else if (tabId === "ineq-bridge") {
        whiteboardTitleText.textContent = "货车过桥实际可行域二元不等式";
        controlCardTitle.textContent = "物理限制与状态控制台";
        hintTitle.textContent = "可行域代数建模";
        hintContent.innerHTML = `
            <h3>可行域与多边界限制</h3>
            <ul>
                <li><b>二元不等式约束</b>：当自变量有多个时，所有的约束不等式在二维空间中切割出一个共同重叠的**安全可行域**。</li>
                <li><b>物理事件联动</b>：在本关中，高度和重量被同时限制。一旦状态点进入红色超限区，货车就会撞上限高架或压垮拱桥。</li>
            </ul>
        `;
        renderBridge();
    }
}

// === 事件监听绑定 ===
function initEventBindings() {
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound(500, 0.05);
            switchTab(btn.getAttribute("data-tab"));
        });
    });

    // ==========================================
    // 关卡 1 不等号按钮切换
    // ==========================================
    ineqBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound(600, 0.05);
            ineqBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.single.op = btn.getAttribute("data-op");
            renderSingle();
        });
    });

    sliderSingleA.addEventListener("input", () => {
        state.single.a = parseInt(sliderSingleA.value) / 10;
        valSingleA.textContent = state.single.a.toFixed(1);
        renderSingle();
    });

    // ==========================================
    // 关卡 2 双条件不等号切换
    // ==========================================
    btnSysOp1Gt.addEventListener("click", () => {
        playSynthSound(600, 0.05);
        btnSysOp1Gt.classList.add("active");
        btnSysOp1Lt.classList.remove("active");
        state.system.op1 = "gt";
        renderSystem();
    });
    btnSysOp1Lt.addEventListener("click", () => {
        playSynthSound(600, 0.05);
        btnSysOp1Lt.classList.add("active");
        btnSysOp1Gt.classList.remove("active");
        state.system.op1 = "lt";
        renderSystem();
    });

    btnSysOp2Gt.addEventListener("click", () => {
        playSynthSound(600, 0.05);
        btnSysOp2Gt.classList.add("active");
        btnSysOp2Lt.classList.remove("active");
        state.system.op2 = "gt";
        renderSystem();
    });
    btnSysOp2Lt.addEventListener("click", () => {
        playSynthSound(600, 0.05);
        btnSysOp2Lt.classList.add("active");
        btnSysOp2Gt.classList.remove("active");
        state.system.op2 = "lt";
        renderSystem();
    });

    sliderSysA.addEventListener("input", () => {
        state.system.a = parseInt(sliderSysA.value) / 10;
        valSysA.textContent = state.system.a.toFixed(1);
        renderSystem();
    });

    sliderSysB.addEventListener("input", () => {
        state.system.b = parseInt(sliderSysB.value) / 10;
        valSysB.textContent = state.system.b.toFixed(1);
        renderSystem();
    });

    // ==========================================
    // 关卡 3 货车可行域滑块
    // ==========================================
    sliderBridgeH.addEventListener("input", () => {
        state.bridge.h = parseInt(sliderBridgeH.value) / 10;
        valBridgeH.textContent = `${state.bridge.h.toFixed(1)} m`;
        renderBridge();
    });

    sliderBridgeW.addEventListener("input", () => {
        state.bridge.w = parseInt(sliderBridgeW.value) / 10;
        valBridgeW.textContent = `${state.bridge.w.toFixed(1)} t`;
        renderBridge();
    });
}

// --- 初始化入口 ---
function init() {
    switchTab("ineq-single");
    initEventBindings();
    setupDragging();
}

document.addEventListener("DOMContentLoaded", init);

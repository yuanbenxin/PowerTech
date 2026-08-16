// ==========================================================================
// 二次函数金牌实验室 Core JavaScript Logic (app.js)
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
let lastSoundY = 0;
function playModulatedDragSound(x, y) {
    const now = performance.now();
    if (now - lastSoundTime > 60 && Math.abs(y - lastSoundY) > 8) {
        const freq = Math.max(260, Math.min(900, 780 - y * 1.5));
        playSynthSound(freq, 0.03, "sine");
        lastSoundY = y;
        lastSoundTime = now;
    }
}

// --- 坐标系统投影转换 (1单位 = 20px, 中心 300, 170 为原点) ---
const originX = 300;
const originY = 170;
const scaleUnit = 20;

function toSvgCoords(x, y) {
    return {
        x: originX + x * scaleUnit,
        y: originY - y * scaleUnit
    };
}

function toMathCoords(svgX, svgY) {
    return {
        x: (svgX - originX) / scaleUnit,
        y: (originY - svgY) / scaleUnit
    };
}

// --- 关卡 2 (最值围栏) 独立坐标映射 (左侧围栏, 右侧曲线) ---
// 右侧曲线：原点在 (380, 290), x轴单位 = 18px (0-10米), y轴(面积)单位 = 4.2px (0-50平方米)
const maxminOriginX = 380;
const maxminOriginY = 290;
const maxminScaleX = 18;
const maxminScaleS = 4.2;

function toSvgMaxmin(x, S) {
    return {
        x: maxminOriginX + x * maxminScaleX,
        y: maxminOriginY - S * maxminScaleS
    };
}

function toMathMaxmin(svgX, svgY) {
    return {
        x: Math.max(0.1, Math.min(9.9, (svgX - maxminOriginX) / maxminScaleX)),
        S: (maxminOriginY - svgY) / maxminScaleS
    };
}

// --- 全局状态机 ---
let state = {
    activeTab: "quad-forms", // quad-forms, quad-maxmin, quad-transform
    forms: {
        type: "general", // general, vertex, factored
        a: 1.0,
        // 一般式
        b: 0.0,
        c: 0.0,
        // 顶点式
        h: 0.0,
        k: 0.0,
        // 交点式
        x1: -2.0,
        x2: 2.0
    },
    maxmin: {
        x: 3.5, // 围栏宽度
        isAutoPlaying: false
    },
    transform: {
        a: 1.0, // 基础系数
        dx: 0.0, // 水平平移
        dy: 0.0, // 垂直平移
        scaleX: 1.0, // 轴对称反射 X
        scaleY: 1.0, // 轴对称反射 Y
        isAbsoluteFolded: false // 绝对值翻折
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
const drawLayerAxes = document.getElementById("draw-layer-axes");
const drawLayerCurves = document.getElementById("draw-layer-curves");
const drawLayerMarkers = document.getElementById("draw-layer-markers");
const drawLayerPoints = document.getElementById("draw-layer-points");
const drawLayerShading = document.getElementById("draw-layer-shading");
const drawLayerTrace = document.getElementById("draw-layer-trace");

// 关卡 1 控件
const selectorBtns = document.querySelectorAll(".selector-btn");
const sliderGroups = document.querySelectorAll(".slider-group");
const sliderGenA = document.getElementById("slider-gen-a");
const valGenA = document.getElementById("val-gen-a");
const sliderGenB = document.getElementById("slider-gen-b");
const valGenB = document.getElementById("val-gen-b");
const sliderGenC = document.getElementById("slider-gen-c");
const valGenC = document.getElementById("val-gen-c");

const sliderVtxA = document.getElementById("slider-vtx-a");
const valVtxA = document.getElementById("val-vtx-a");
const sliderVtxH = document.getElementById("slider-vtx-h");
const valVtxH = document.getElementById("val-vtx-h");
const sliderVtxK = document.getElementById("slider-vtx-k");
const valVtxK = document.getElementById("val-vtx-k");

const sliderFacA = document.getElementById("slider-fac-a");
const valFacA = document.getElementById("val-fac-a");
const sliderFacX1 = document.getElementById("slider-fac-x1");
const valFacX1 = document.getElementById("val-fac-x1");
const sliderFacX2 = document.getElementById("slider-fac-x2");
const valFacX2 = document.getElementById("val-fac-x2");

// 关卡 2 控件
const sliderMaxminX = document.getElementById("slider-maxmin-x");
const valMaxminX = document.getElementById("val-maxmin-x");
const btnMaxminPlay = document.getElementById("btn-maxmin-play");
const btnMaxminReset = document.getElementById("btn-maxmin-reset");

// 关卡 3 控件
const btnTransLeft = document.getElementById("btn-trans-left");
const btnTransRight = document.getElementById("btn-trans-right");
const btnTransUp = document.getElementById("btn-trans-up");
const btnTransDown = document.getElementById("btn-trans-down");
const btnTransRefX = document.getElementById("btn-trans-refx");
const btnTransRefY = document.getElementById("btn-trans-refy");
const btnTransRefO = document.getElementById("btn-trans-refo");
const btnTransAbs = document.getElementById("btn-trans-abs");
const btnTransReset = document.getElementById("btn-trans-reset");

// --- 通用 SVG 创建工具 ---
function createSVGNode(type, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
}

// 绘制坐标系背景
function drawCoordinateSystem() {
    drawLayerGrid.innerHTML = "";
    drawLayerAxes.innerHTML = "";

    if (state.activeTab === "quad-maxmin") {
        // --- 关卡 2：双子画面分屏网格 ---
        // 1. 绘制中间分割虚线
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: 300, y1: 0, x2: 300, y2: 340,
            class: "split-divider"
        }));

        // 2. 绘制左侧几何区背景纸
        const gridUnit = 15;
        // 绘制局部的格子背景 (0 - 300)
        for (let x = gridUnit; x < 300; x += gridUnit) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: x, y1: 0, x2: x, y2: 340, class: "geo-grid-line" }));
        }
        for (let y = gridUnit; y < 340; y += gridUnit) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: 0, y1: y, x2: 300, y2: y, class: "geo-grid-line" }));
        }

        // 3. 绘制右侧函数区网格
        for (let x = 300 + maxminScaleX; x < 600; x += maxminScaleX) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: x, y1: 0, x2: x, y2: 340, class: "geo-grid-line" }));
        }
        for (let y = 10; y < 340; y += 21) { // 约 5 个面积刻度
            drawLayerGrid.appendChild(createSVGNode("line", { x1: 300, y1: y, x2: 600, y2: y, class: "geo-grid-line" }));
        }

        // 4. 右侧函数区的坐标轴
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: maxminOriginX - 15, y1: maxminOriginY, x2: 585, y2: maxminOriginY,
            class: "geo-grid-axis"
        }));
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: maxminOriginX, y1: 15, x2: maxminOriginX, y2: maxminOriginY + 15,
            class: "geo-grid-axis"
        }));

        // 轴箭头
        drawLayerAxes.appendChild(createSVGNode("polygon", { points: `585,${maxminOriginY-4} 595,${maxminOriginY} 585,${maxminOriginY+4}`, class: "geo-axis-arrow" }));
        drawLayerAxes.appendChild(createSVGNode("polygon", { points: `${maxminOriginX-4},15 ${maxminOriginX},5 ${maxminOriginX+4},15`, class: "geo-axis-arrow" }));

        // 轴标签
        const labelX = createSVGNode("text", { x: 585, y: maxminOriginY + 14, class: "geo-tick-label" });
        labelX.textContent = "x (m)";
        const labelY = createSVGNode("text", { x: maxminOriginX - 16, y: 15, class: "geo-tick-label" });
        labelY.textContent = "S (㎡)";
        drawLayerAxes.appendChild(labelX);
        drawLayerAxes.appendChild(labelY);

        // 右侧刻度数字 (x轴: 2, 4, 6, 8, 10)
        for (let x = 2; x <= 10; x += 2) {
            const pt = toSvgMaxmin(x, 0);
            drawLayerAxes.appendChild(createSVGNode("line", { x1: pt.x, y1: maxminOriginY - 3, x2: pt.x, y2: maxminOriginY + 3, class: "geo-tick-line" }));
            const text = createSVGNode("text", { x: pt.x, y: maxminOriginY + 12, class: "geo-tick-label" });
            text.textContent = x;
            drawLayerAxes.appendChild(text);
        }

        // 右侧刻度数字 (S轴: 10, 20, 30, 40, 50)
        for (let S = 10; S <= 50; S += 10) {
            const pt = toSvgMaxmin(0, S);
            drawLayerAxes.appendChild(createSVGNode("line", { x1: maxminOriginX - 3, y1: pt.y, x2: maxminOriginX + 3, y2: pt.y, class: "geo-tick-line" }));
            const text = createSVGNode("text", { x: maxminOriginX - 14, y: pt.y + 3, class: "geo-tick-label" });
            text.textContent = S;
            drawLayerAxes.appendChild(text);
        }

        // 原点 0
        const oText = createSVGNode("text", { x: maxminOriginX - 8, y: maxminOriginY + 10, class: "geo-tick-label" });
        oText.textContent = "0";
        drawLayerAxes.appendChild(oText);

    } else {
        // --- 关卡 1 & 3：常规单坐标系背景 ---
        const spacing = scaleUnit;
        for (let x = spacing; x < 600; x += spacing) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: x, y1: 0, x2: x, y2: 340, class: "geo-grid-line" }));
        }
        for (let y = spacing; y < 340; y += spacing) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: 0, y1: y, x2: 600, y2: y, class: "geo-grid-line" }));
        }

        // X和Y轴线
        drawLayerAxes.appendChild(createSVGNode("line", { x1: 15, y1: originY, x2: 585, y2: originY, class: "geo-grid-axis" }));
        drawLayerAxes.appendChild(createSVGNode("line", { x1: originX, y1: 15, x2: originX, y2: 325, class: "geo-grid-axis" }));

        // 箭头
        drawLayerAxes.appendChild(createSVGNode("polygon", { points: `585,${originY-4} 595,${originY} 585,${originY+4}`, class: "geo-axis-arrow" }));
        drawLayerAxes.appendChild(createSVGNode("polygon", { points: `${originX-4},15 ${originX},5 ${originX+4},15`, class: "geo-axis-arrow" }));

        // 轴标签
        const labelX = createSVGNode("text", { x: 585, y: originY + 16, class: "geo-tick-label", style: "font-size: 10px;" });
        labelX.textContent = "x";
        const labelY = createSVGNode("text", { x: originX - 14, y: 15, class: "geo-tick-label", style: "font-size: 10px;" });
        labelY.textContent = "y";
        drawLayerAxes.appendChild(labelX);
        drawLayerAxes.appendChild(labelY);

        // 刻度
        for (let xMath = -14; xMath <= 14; xMath++) {
            if (xMath === 0) continue;
            const pt = toSvgCoords(xMath, 0);
            drawLayerAxes.appendChild(createSVGNode("line", { x1: pt.x, y1: originY - 3, x2: pt.x, y2: originY + 3, class: "geo-tick-line" }));
            if (xMath % 2 === 0) {
                const text = createSVGNode("text", { x: pt.x, y: originY + 12, class: "geo-tick-label" });
                text.textContent = xMath;
                drawLayerAxes.appendChild(text);
            }
        }

        for (let yMath = -8; yMath <= 8; yMath++) {
            if (yMath === 0) continue;
            const pt = toSvgCoords(0, yMath);
            drawLayerAxes.appendChild(createSVGNode("line", { x1: originX - 3, y1: pt.y, x2: originX + 3, y2: pt.y, class: "geo-tick-line" }));
            if (yMath % 2 === 0) {
                const text = createSVGNode("text", { x: originX - 14, y: pt.y + 3, class: "geo-tick-label" });
                text.textContent = yMath;
                drawLayerAxes.appendChild(text);
            }
        }

        // 原点
        const originLabel = createSVGNode("text", { x: originX - 10, y: originY + 10, class: "geo-tick-label" });
        originLabel.textContent = "0";
        drawLayerAxes.appendChild(originLabel);
    }
}

// --- 增量渲染顶点策略 ---
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
    if (coordinateType === "maxmin") {
        svgPt = toSvgMaxmin(x, y);
    } else if (coordinateType === "fence") {
        svgPt = { x: 210 + x * 8, y: 170 };
    } else {
        svgPt = toSvgCoords(x, y);
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

// 绘制抛物线
function drawParabolaCurve(a, b, c, isFolded = false) {
    let pathD = "";
    let start = true;

    for (let xMath = -14; xMath <= 14; xMath += 0.05) {
        let yMath = a * xMath * xMath + b * xMath + c;
        if (isFolded) {
            yMath = Math.abs(yMath);
        }
        const pt = toSvgCoords(xMath, yMath);
        if (pt.y >= -150 && pt.y <= 490) {
            if (start) {
                pathD = `M ${pt.x} ${pt.y}`;
                start = false;
            } else {
                pathD += ` L ${pt.x} ${pt.y}`;
            }
        }
    }

    const path = createSVGNode("path", {
        d: pathD,
        class: `geo-curve parabola ${isFolded ? 'absolute-folded' : ''}`
    });
    drawLayerCurves.appendChild(path);
}

// 绘制指示线
function drawDottedIndicator(fromMath, toMath, coordinateType = "normal") {
    const fromSvg = (coordinateType === "maxmin") ? toSvgMaxmin(fromMath.x, fromMath.y) : toSvgCoords(fromMath.x, fromMath.y);
    const toSvg = (coordinateType === "maxmin") ? toSvgMaxmin(toMath.x, toMath.y) : toSvgCoords(toMath.x, toMath.y);
    
    const line = createSVGNode("line", {
        x1: fromSvg.x, y1: fromSvg.y, x2: toSvg.x, y2: toSvg.y,
        class: "geo-indicator-line"
    });
    drawLayerMarkers.appendChild(line);
}

// 轨迹尾迹粒子生成器
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
    createTraceDot(svgX, svgY, state.activeTab === "quad-maxmin" ? "green" : "purple");

    playModulatedDragSound(svgX, svgY);

    if (state.activeTab === "quad-maxmin") {
        // 篱笆围栏模式下使用 maxmin 坐标
        const mathPt = toMathCoordsMaxminLeft(svgX, svgY); // 几何区长宽
        updatePointPosition(activeDragPoint, mathPt.x, 0);
    } else {
        const mathPt = toMathCoords(svgX, svgY);
        updatePointPosition(activeDragPoint, mathPt.x, mathPt.y);
    }
}

// 围栏几何区的特殊拖动逆解算
function toMathCoordsMaxminLeft(svgX, svgY) {
    // 围栏宽度 x 范围 0.5 到 9.5
    // 几何区起点为 x_start = 210. 1个单位 = 8px
    const mathX = (svgX - 210) / 8;
    return {
        x: Math.max(0.5, Math.min(9.5, mathX))
    };
}

function updatePointPosition(pointId, mx, my) {
    if (state.activeTab === "quad-forms") {
        const type = state.forms.type;
        const a = state.forms.a;

        if (type === "general") {
            if (pointId === "Forms_Gen_C") {
                // 拖拽 Y 轴交点 (0, c)
                const c = Math.max(-6.0, Math.min(6.0, my));
                state.forms.c = c;
                sliderGenC.value = Math.round(c * 10);
                valGenC.textContent = c.toFixed(1);
                renderForms();
            } else if (pointId === "Forms_Gen_Vtx") {
                // 拖拽一般式的顶点 V(-b/2a, (4ac - b²)/4a)
                // x_vtx = -b/2a => b = -2a * x_vtx
                const newXVtx = Math.max(-8.0, Math.min(8.0, mx));
                const b = -2 * a * newXVtx;
                state.forms.b = b;
                sliderGenB.value = Math.round(b * 10);
                valGenB.textContent = b.toFixed(1);
                renderForms();
            }
        } else if (type === "vertex") {
            if (pointId === "Forms_Vtx_Vtx") {
                // 直接拖拽顶点 V(h, k)
                const h = Math.max(-8.0, Math.min(8.0, mx));
                const k = Math.max(-6.0, Math.min(6.0, my));
                state.forms.h = h;
                state.forms.k = k;
                
                sliderVtxH.value = Math.round(h * 10);
                sliderVtxK.value = Math.round(k * 10);
                valVtxH.textContent = h.toFixed(1);
                valVtxK.textContent = k.toFixed(1);
                
                renderForms();
            }
        } else if (type === "factored") {
            if (pointId === "Forms_Fac_X1") {
                // 直接拖拽左零点 x1
                const x1 = Math.max(-9.0, Math.min(9.0, mx));
                state.forms.x1 = x1;
                sliderFacX1.value = Math.round(x1 * 10);
                valFacX1.textContent = x1.toFixed(1);
                renderForms();
            } else if (pointId === "Forms_Fac_X2") {
                // 直接拖拽右零点 x2
                const x2 = Math.max(-9.0, Math.min(9.0, mx));
                state.forms.x2 = x2;
                sliderFacX2.value = Math.round(x2 * 10);
                valFacX2.textContent = x2.toFixed(1);
                renderForms();
            }
        }
    } else if (state.activeTab === "quad-maxmin") {
        if (pointId === "Maxmin_Fence_Dragger") {
            state.maxmin.x = Math.max(0.5, Math.min(9.5, mx));
            sliderMaxminX.value = Math.round(state.maxmin.x * 10);
            valMaxminX.textContent = state.maxmin.x.toFixed(1);
            renderMaxmin();
        }
    }
}

// === 各关卡渲染与逻辑 ===

// === 关卡 1：解析式系数与性质 ===
function renderForms() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";

    const type = state.forms.type;
    const a = state.forms.a;

    let b = 0, c = 0, h = 0, k = 0, x1 = 0, x2 = 0;

    if (type === "general") {
        b = state.forms.b;
        c = state.forms.c;
        h = -b / (2 * a);
        k = c - (b * b) / (4 * a);
        
        // 1. 绘制曲线
        drawParabolaCurve(a, b, c);

        // 2. 绘制对称轴虚线
        drawDottedIndicator({ x: h, y: -10 }, { x: h, y: 10 });

        // 3. 绘制顶点与截距点
        drawPoint(h, k, `顶点 V(${h.toFixed(1)}, ${k.toFixed(1)})`, "top", "draggable", "Forms_Gen_Vtx");
        drawPoint(0, c, `Y轴交点 C(0, ${c.toFixed(1)})`, "right", "draggable", "Forms_Gen_C");
    } else if (type === "vertex") {
        h = state.forms.h;
        k = state.forms.k;
        // 代数还原为一般式参数
        b = -2 * a * h;
        c = a * h * h + k;

        // 1. 绘制曲线
        drawParabolaCurve(a, b, c);

        // 2. 绘制对称轴虚线
        drawDottedIndicator({ x: h, y: -10 }, { x: h, y: 10 });
        // 绘制辅助线投影到 Y 轴
        drawDottedIndicator({ x: h, y: k }, { x: 0, y: k });

        // 3. 绘制顶点
        drawPoint(h, k, `顶点 V(${h.toFixed(1)}, ${k.toFixed(1)})`, "top", "draggable", "Forms_Vtx_Vtx");
    } else if (type === "factored") {
        x1 = state.forms.x1;
        x2 = state.forms.x2;
        // 代数还原为一般式参数
        b = -a * (x1 + x2);
        c = a * x1 * x2;
        h = (x1 + x2) / 2;
        k = a * (h - x1) * (h - x2);

        // 1. 绘制曲线
        drawParabolaCurve(a, b, c);

        // 2. 绘制零点点与顶点
        drawPoint(x1, 0, `x₁(${x1.toFixed(1)}, 0)`, "bottom", "zero-point draggable", "Forms_Fac_X1");
        drawPoint(x2, 0, `x₂(${x2.toFixed(1)}, 0)`, "bottom", "zero-point draggable", "Forms_Fac_X2");
        drawPoint(h, k, `V(${h.toFixed(1)}, ${k.toFixed(1)})`, "top");
    }

    // 4. 实时更新右侧监控面板数据
    let funcText = "";
    if (type === "general") {
        funcText = `y = ${a.toFixed(1)}x² ${b >= 0 ? '+' : ''}${b.toFixed(1)}x ${c >= 0 ? '+' : ''}${c.toFixed(1)}`;
    } else if (type === "vertex") {
        funcText = `y = ${a.toFixed(1)}(x ${h >= 0 ? '-' : '+'}${Math.abs(h).toFixed(1)})² ${k >= 0 ? '+' : ''}${k.toFixed(1)}`;
    } else if (type === "factored") {
        funcText = `y = ${a.toFixed(1)}(x ${x1 >= 0 ? '-' : '+'}${Math.abs(x1).toFixed(1)})(x ${x2 >= 0 ? '-' : '+'}${Math.abs(x2).toFixed(1)})`;
    }
    document.getElementById("monitor-forms-func").textContent = funcText;
    document.getElementById("monitor-forms-dir").textContent = a > 0 ? "开口向上" : "开口向下";
    document.getElementById("monitor-forms-axis").textContent = `x = ${h.toFixed(2)}`;
    document.getElementById("monitor-forms-vtx").textContent = `(${h.toFixed(2)}, ${k.toFixed(2)})`;
    document.getElementById("monitor-forms-yint").textContent = `(0, ${c.toFixed(2)})`;

    pruneUnusedPoints();
    updateFormsHUD(a, b, c, h, k, x1, x2);
}

function updateFormsHUD(a, b, c, h, k, x1, x2) {
    const type = state.forms.type;
    let stepHtml = "";

    if (type === "general") {
        stepHtml += `
            <div class="proof-step-card">
                <b>1. 解析式一般形式</b><br>
                y = ax² + bx + c = <b>${a.toFixed(1)}x² ${b >= 0 ? '+' : ''}${b.toFixed(1)}x ${c >= 0 ? '+' : ''}${c.toFixed(1)}</b>。<br>
                * 开口系数 <b>a = ${a.toFixed(1)}</b> 控制弧度，a > 0 开口向上，a < 0 开口向下。
            </div>
            <div class="proof-step-card success">
                <b>2. 对称轴与顶点解算</b><br>
                对称轴公式 x = -b/2a = <b>${h.toFixed(2)}</b>。<br>
                顶点坐标 (-b/2a, (4ac-b²)/4a) = <b>(${h.toFixed(2)}, ${k.toFixed(2)})</b>。
            </div>
            <div class="proof-step-card success" style="border-left-color: var(--color-purple)">
                <b>3. 截距性质</b><br>
                当 x = 0 时，y = c = <b>${c.toFixed(2)}</b>。说明抛物线永远与 Y 轴交于点 (0, c)。
            </div>
        `;
    } else if (type === "vertex") {
        stepHtml += `
            <div class="proof-step-card">
                <b>1. 解析式顶点形式</b><br>
                y = a(x - h)² + k。<br>
                可以直接读出顶点坐标 <b>V(h, k) = (${h.toFixed(1)}, ${k.toFixed(1)})</b>！
            </div>
            <div class="proof-step-card success">
                <b>2. 平移轨迹分析</b><br>
                顶点自 (0,0) 开始，向${h >= 0 ? '右' : '左'}平移了 <b>${Math.abs(h).toFixed(1)}</b> 米，向${k >= 0 ? '上' : '下'}平移了 <b>${Math.abs(k).toFixed(1)}</b> 米。
            </div>
        `;
    } else if (type === "factored") {
        stepHtml += `
            <div class="proof-step-card">
                <b>1. 解析式交点(两根)形式</b><br>
                y = a(x - x₁)(x - x₂)。<br>
                可以直观得知抛物线与 X 轴交点为：<br>
                <b>(${x1.toFixed(1)}, 0)</b> 与 <b>(${x2.toFixed(1)}, 0)</b>。
            </div>
            <div class="proof-step-card success">
                <b>2. 对称轴与中点性质</b><br>
                对称轴恰好在两零点的中点处：<br>
                x = (x₁ + x₂)/2 = <b>${h.toFixed(2)}</b>。
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 关卡 2：围栏面积最大值 ===
function renderMaxmin() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";

    const x = state.maxmin.x;
    const y = 20 - 2 * x; // 篱笆长度
    const S = x * y; // 围栏面积

    // === 左半侧几何围栏绘制 (0 - 300) ===
    // 1. 绘制砖墙 (X = 210)
    const wall = createSVGNode("line", {
        x1: 210, y1: 80, x2: 210, y2: 260,
        class: "geo-wall"
    });
    drawLayerMarkers.appendChild(wall);

    // 2. 绘制三面篱笆
    // 比例尺：1米宽 = 8px; 1米长 = 8px
    const pxW = x * 8;
    const pxH = y * 8;
    const fenceTopY = 170 - pxH / 2;
    const fenceBottomY = 170 + pxH / 2;

    const fenceRect = createSVGNode("polygon", {
        points: `210,${fenceTopY} ${210 + pxW},${fenceTopY} ${210 + pxW},${fenceBottomY} 210,${fenceBottomY}`,
        class: "geo-shading fence"
    });
    drawLayerShading.appendChild(fenceRect);

    // 3. 绘制尺寸标签
    // 宽度 x 标签
    const labelW = createSVGNode("text", {
        x: 210 + pxW / 2, y: fenceTopY - 8,
        class: "geo-text",
        style: "text-anchor: middle;"
    });
    labelW.textContent = `宽 x = ${x.toFixed(1)} 米`;
    drawLayerMarkers.appendChild(labelW);

    // 长度 20 - 2x 标签
    const labelL = createSVGNode("text", {
        x: 215 + pxW, y: 174,
        class: "geo-text"
    });
    labelL.textContent = `长 = ${y.toFixed(1)} 米`;
    drawLayerMarkers.appendChild(labelL);

    // 内部面积 S 标签
    const labelArea = createSVGNode("text", {
        x: 210 + pxW / 2, y: 174,
        class: "geo-text",
        style: "text-anchor: middle; font-size: 11px; fill: var(--color-blue);"
    });
    labelArea.textContent = `S = ${S.toFixed(1)} ㎡`;
    drawLayerMarkers.appendChild(labelArea);

    // 4. 绘制围栏拉伸的 draggable 控制点 (放在右侧围栏中点)
    drawPoint(x, 0, "拉动调节围栏", "top", "fence-dragger draggable", "Maxmin_Fence_Dragger", "fence");

    // === 右半侧二次函数最值抛物线绘制 (300 - 600) ===
    // 绘制 S = x(20 - 2x) 抛物线轨迹. x 从 0.2 到 9.8
    let pathD = "";
    let start = true;
    for (let xm = 0; xm <= 10.0; xm += 0.1) {
        const sm = xm * (20 - 2 * xm);
        const pt = toSvgMaxmin(xm, sm);
        if (start) {
            pathD = `M ${pt.x} ${pt.y}`;
            start = false;
        } else {
            pathD += ` L ${pt.x} ${pt.y}`;
        }
    }
    const path = createSVGNode("path", {
        d: pathD,
        class: "geo-curve parabola",
        style: "stroke: var(--color-green);"
    });
    drawLayerCurves.appendChild(path);

    // 绘制当前滑动点 P 在抛物线上的位置
    drawPoint(x, S, `P(${x.toFixed(2)}, ${S.toFixed(2)})`, "top", "zero-point", null, "maxmin");
    // 绘制虚线指示到两轴
    drawDottedIndicator({ x: x, y: S }, { x: x, y: 0 }, "maxmin");
    drawDottedIndicator({ x: x, y: S }, { x: 0, y: S }, "maxmin");

    // 顶点高亮 (最值: 5, 50)
    if (Math.abs(x - 5.0) < 0.15) {
        drawPoint(5, 50, "顶点最值 S_max = 50", "bottom", "draggable", null, "maxmin");
    }

    // === 更新面板数字 ===
    document.getElementById("monitor-maxmin-w").textContent = `${x.toFixed(2)} 米`;
    document.getElementById("monitor-maxmin-l").textContent = `${y.toFixed(2)} 米`;
    document.getElementById("monitor-maxmin-area").textContent = `${S.toFixed(2)} ㎡`;
    
    pruneUnusedPoints();
    updateMaxminHUD(x, y, S);
}

function updateMaxminHUD(x, y, S) {
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>1. 代数几何建模</b><br>
            一面靠墙，三边用总长 20 米的篱笆围成。<br>
            设宽度为 <b>x</b> 米，则围栏长度为 <b>20 - 2x</b> 米。
        </div>
        <div class="proof-step-card">
            <b>2. 面积二次函数推导</b><br>
            S = 宽 × 长 = x(20 - 2x) = <b>-2x² + 20x</b>。<br>
            开口系数 a = -2 < 0，开口向下，说明**函数存在最大值**！
        </div>
    `;

    if (Math.abs(x - 5.0) < 0.15) {
        stepHtml += `
            <div class="proof-step-card success" style="border-left-color: var(--color-purple); animation: pulse 0.8s infinite;">
                <b>3. 🌟 顶点最值达到！(S = 50.00)</b><br>
                对称轴 x = -b/2a = -20/(-4) = <b>5.00 米</b>。<br>
                此时面积达到最大值：<b>S = 50 ㎡</b>！长宽比为 10 : 5 = 2 : 1 时最合理。
            </div>
        `;
    } else {
        stepHtml += `
            <div class="proof-step-card success">
                <b>3. 动态寻找最值</b><br>
                当前宽 x = ${x.toFixed(2)} 米，面积 S = ${S.toFixed(2)} ㎡。<br>
                <i>提示：请试着将宽度拖动到 5.0 米以解锁最大面积！</i>
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 关卡 3：几何平移与对称变换 ===
function renderTransform() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";

    const a = state.transform.a;
    const dx = state.transform.dx;
    const dy = state.transform.dy;
    const sx = state.transform.scaleX;
    const sy = state.transform.scaleY;
    const isFolded = state.transform.isAbsoluteFolded;

    // 1. 绘制初始基准曲线 (y = x²) 以淡灰色绘制作为对比
    let refD = "";
    let refStart = true;
    for (let xMath = -14; xMath <= 14; xMath += 0.1) {
        const yMath = xMath * xMath;
        const pt = toSvgCoords(xMath, yMath);
        if (pt.y >= -150 && pt.y <= 490) {
            if (refStart) {
                refD = `M ${pt.x} ${pt.y}`;
                refStart = false;
            } else {
                refD += ` L ${pt.x} ${pt.y}`;
            }
        }
    }
    drawLayerCurves.appendChild(createSVGNode("path", {
        d: refD,
        class: "geo-curve transformed",
        style: "stroke: rgba(100, 116, 139, 0.3);"
    }));

    // 2. 绘制当前的变换后抛物线曲线
    let pathD = "";
    let start = true;
    for (let xMath = -14; xMath <= 14; xMath += 0.05) {
        // 自变量受到 Y轴反射（x -> -x）与 水平平移（x -> x - dx）的影响
        let tx = xMath * sy - dx;
        // 纵轴受到 X轴反射（y -> -y）与 垂直平移（y -> y + dy）的影响
        let yMath = sx * a * tx * tx + dy;
        
        if (isFolded) {
            yMath = Math.abs(yMath);
        }
        
        const pt = toSvgCoords(xMath, yMath);
        if (pt.y >= -150 && pt.y <= 490) {
            if (start) {
                pathD = `M ${pt.x} ${pt.y}`;
                start = false;
            } else {
                pathD += ` L ${pt.x} ${pt.y}`;
            }
        }
    }
    
    const path = createSVGNode("path", {
        d: pathD,
        class: `geo-curve ${isFolded ? 'absolute-folded' : 'parabola'}`
    });
    if (!isFolded) {
        path.setAttribute("style", "stroke: var(--color-purple);");
    }
    drawLayerCurves.appendChild(path);

    // 3. 标记变换后顶点位置
    // 对称变换下顶点坐标的变化
    const h = dx * sy;
    const k = dy * sx;
    if (isFolded) {
        // 如果是绝对值翻折，可能有两个折点
        // 折点即 yMath = 0 的地方：a(x - dx)^2 + dy = 0 => x = dx ± √(-dy/a)
        const rootTerm = -dy / a;
        if (rootTerm > 0) {
            const r1 = h - Math.sqrt(rootTerm) * sy;
            const r2 = h + Math.sqrt(rootTerm) * sy;
            drawPoint(r1, 0, `折点(${r1.toFixed(1)}, 0)`, "bottom", "zero-point");
            drawPoint(r2, 0, `折点(${r2.toFixed(1)}, 0)`, "bottom", "zero-point");
        }
        drawPoint(h, Math.abs(k), `顶点 V'(${h.toFixed(1)}, ${Math.abs(k).toFixed(1)})`, "top");
    } else {
        drawPoint(h, k, `顶点 V'(${h.toFixed(1)}, ${k.toFixed(1)})`, k >= 0 ? "top" : "bottom");
        // 初始顶点 V(0,0) 作为对比
        drawPoint(0, 0, "初态顶点 V(0, 0)", "bottom");
        // 虚线连接
        drawDottedIndicator({ x: 0, y: 0 }, { x: h, y: k });
    }

    // 4. 更新面板解析式
    // 计算一般式参数
    const ta = a * sx;
    const tb = -2 * a * dx * sy * sx;
    const tc = (a * dx * dx + dy) * sx;

    let eqText = "";
    if (isFolded) {
        eqText = `y = |${ta.toFixed(1)}x² ${tb >= 0 ? '+' : ''}${tb.toFixed(1)}x ${tc >= 0 ? '+' : ''}${tc.toFixed(1)}|`;
    } else {
        eqText = `y = ${ta.toFixed(1)}x² ${tb >= 0 ? '+' : ''}${tb.toFixed(1)}x ${tc >= 0 ? '+' : ''}${tc.toFixed(1)}`;
    }
    document.getElementById("monitor-forms-func").textContent = eqText;

    pruneUnusedPoints();
    updateTransformHUD(a, dx, dy, sx, sy, isFolded, h, k);
}

function updateTransformHUD(a, dx, dy, sx, sy, isFolded, h, k) {
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>1. 初始函数状态</b><br>
            原函数为 y = x²，顶点在 (0,0)，开口向上。
        </div>
    `;

    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>2. 平移变换 (左加右减，上加下减)</b><br>
                当前对称轴 x = <b>${h.toFixed(1)}</b>，垂直位移 y = <b>${k.toFixed(1)}</b>。<br>
                解析式：<b>y = (x ${-h >= 0 ? '-' : '+'}${Math.abs(h).toFixed(1)})² ${k >= 0 ? '+' : ''}${k.toFixed(1)}</b>。
            </div>
        `;
    }

    if (sx < 0 || sy < 0) {
        let symDesc = [];
        if (sx < 0 && sy > 0) symDesc.push("关于 X 轴翻转");
        if (sy < 0 && sx > 0) symDesc.push("关于 Y 轴翻转");
        if (sx < 0 && sy < 0) symDesc.push("关于原点中心翻转");
        
        stepHtml += `
            <div class="proof-step-card success" style="border-left-color: var(--color-purple);">
                <b>3. 对称反射变换</b><br>
                已触发 **${symDesc.join(" & ")}**。<br>
                * x → -x，y → -y 发生自变量与函数值镜像。
            </div>
        `;
    }

    if (isFolded) {
        stepHtml += `
            <div class="proof-step-card warning" style="border-left-color: var(--color-orange);">
                <b>4. 整体绝对值翻折 y = |f(x)|</b><br>
                * X 轴下方的负数高度全部乘以 -1，翻折折射到轴上方。<br>
                * 在与 X 轴的交点处形成锐利的“折射零点”，呈现猫耳或双峰形态。
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 自动演示最值动画 ===
let maxminAnimId = null;
let maxminStartTime = 0;
function toggleMaxminAutoPlay() {
    if (state.maxmin.isAutoPlaying) {
        state.maxmin.isAutoPlaying = false;
        btnMaxminPlay.innerHTML = `<i class="fa-solid fa-play"></i> 自动滑动演示最值变化`;
        btnMaxminPlay.classList.remove("primary");
        if (maxminAnimId) cancelAnimationFrame(maxminAnimId);
    } else {
        state.maxmin.isAutoPlaying = true;
        btnMaxminPlay.innerHTML = `<i class="fa-solid fa-pause"></i> 停止滑动`;
        btnMaxminPlay.classList.add("primary");
        playSynthSound(600, 0.15);
        maxminStartTime = performance.now();

        function step(timestamp) {
            if (!state.maxmin.isAutoPlaying) return;
            const elapsed = timestamp - maxminStartTime;

            // 让宽度 x 在 1.0 到 9.0 之间做平滑正弦循环
            const cycleX = 5.0 + 4.0 * Math.sin(elapsed / 1200);
            state.maxmin.x = cycleX;
            sliderMaxminX.value = Math.round(cycleX * 10);
            valMaxminX.textContent = cycleX.toFixed(1);
            renderMaxmin();

            maxminAnimId = requestAnimationFrame(step);
        }
        maxminAnimId = requestAnimationFrame(step);
    }
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

    drawCoordinateSystem();

    if (tabId === "quad-forms") {
        whiteboardTitleText.textContent = "二次函数解析式与系数三变";
        controlCardTitle.textContent = "系数与解析式控制台";
        hintTitle.textContent = "解析式几何秘籍";
        hintContent.innerHTML = `
            <h3>抛物线系数判定法则</h3>
            <ul>
                <li><b>a 的正负与开口</b>：a > 0 口向上；a < 0 口向下。|a| 越大，抛物线开口越窄。</li>
                <li><b>b 的对称轴定位</b>：对称轴为 x = -b/2a。当 a、b 同号时，轴在 Y 轴左侧；异号时在右侧（左同右异）。</li>
                <li><b>c 的截距定位</b>：常数 c 确定了抛物线与 Y 轴交点为 (0, c)。</li>
            </ul>
        `;
        renderForms();
    } else if (tabId === "quad-maxmin") {
        whiteboardTitleText.textContent = "围栏面积最值二次函数模型";
        controlCardTitle.textContent = "几何围栏最值控制台";
        hintTitle.textContent = "最值建模黄金法则";
        hintContent.innerHTML = `
            <h3>面积极值探究</h3>
            <ul>
                <li><b>顶点公式法</b>：对于 y = ax² + bx + c，极值点在 x = -b/2a 取得，最大值为 (4ac - b²)/4a。</li>
                <li><b>对称均值原理</b>：矩形周长固定时，当宽与长最接近正方形比例（或三边为 2:1）时，面积达到数学最大值。</li>
            </ul>
        `;
        renderMaxmin();
    } else if (tabId === "quad-transform") {
        whiteboardTitleText.textContent = "二次函数刚体几何变换";
        controlCardTitle.textContent = "平移对称变换控制台";
        hintTitle.textContent = "几何变换法则";
        hintContent.innerHTML = `
            <h3>平移与对称几何定律</h3>
            <ul>
                <li><b>平移法则 (左加右减)</b>：y = f(x ± d) 实现 X 轴左右移动；y = f(x) ± d 实现 Y 轴上下移动。</li>
                <li><b>对称翻转</b>：
                    <ul>
                        <li>关于 X 轴对称 ⟹ y = -f(x)</li>
                        <li>关于 Y 轴对称 ⟹ y = f(-x)</li>
                    </ul>
                </li>
            </ul>
        `;
        renderTransform();
    }
}

// === 事件监听绑定 ===
function initEventBindings() {
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (state.maxmin.isAutoPlaying) toggleMaxminAutoPlay();
            playSynthSound(500, 0.05);
            switchTab(btn.getAttribute("data-tab"));
        });
    });

    // 解析式选项切换 (一般式/顶点式/交点式)
    selectorBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound(600, 0.05);
            selectorBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const formType = btn.getAttribute("data-form");
            state.forms.type = formType;

            sliderGroups.forEach(g => {
                g.classList.toggle("active", g.id === `sliders-${formType}`);
            });

            renderForms();
        });
    });

    // ==========================================
    // 关卡 1 事件
    // ==========================================
    // 一般式
    sliderGenA.addEventListener("input", () => {
        let a = parseInt(sliderGenA.value) / 10;
        if (Math.abs(a) < 0.1) a = a >= 0 ? 0.1 : -0.1; // 避免 a = 0
        state.forms.a = a;
        valGenA.textContent = a.toFixed(1);
        renderForms();
    });
    sliderGenB.addEventListener("input", () => {
        state.forms.b = parseInt(sliderGenB.value) / 10;
        valGenB.textContent = state.forms.b.toFixed(1);
        renderForms();
    });
    sliderGenC.addEventListener("input", () => {
        state.forms.c = parseInt(sliderGenC.value) / 10;
        valGenC.textContent = state.forms.c.toFixed(1);
        renderForms();
    });

    // 顶点式
    sliderVtxA.addEventListener("input", () => {
        let a = parseInt(sliderVtxA.value) / 10;
        if (Math.abs(a) < 0.1) a = a >= 0 ? 0.1 : -0.1;
        state.forms.a = a;
        valVtxA.textContent = a.toFixed(1);
        renderForms();
    });
    sliderVtxH.addEventListener("input", () => {
        state.forms.h = parseInt(sliderVtxH.value) / 10;
        valVtxH.textContent = state.forms.h.toFixed(1);
        renderForms();
    });
    sliderVtxK.addEventListener("input", () => {
        state.forms.k = parseInt(sliderVtxK.value) / 10;
        valVtxK.textContent = state.forms.k.toFixed(1);
        renderForms();
    });

    // 交点式
    sliderFacA.addEventListener("input", () => {
        let a = parseInt(sliderFacA.value) / 10;
        if (Math.abs(a) < 0.1) a = a >= 0 ? 0.1 : -0.1;
        state.forms.a = a;
        valFacA.textContent = a.toFixed(1);
        renderForms();
    });
    sliderFacX1.addEventListener("input", () => {
        state.forms.x1 = parseInt(sliderFacX1.value) / 10;
        valFacX1.textContent = state.forms.x1.toFixed(1);
        renderForms();
    });
    sliderFacX2.addEventListener("input", () => {
        state.forms.x2 = parseInt(sliderFacX2.value) / 10;
        valFacX2.textContent = state.forms.x2.toFixed(1);
        renderForms();
    });

    // ==========================================
    // 关卡 2 事件
    // ==========================================
    sliderMaxminX.addEventListener("input", () => {
        state.maxmin.x = parseInt(sliderMaxminX.value) / 10;
        valMaxminX.textContent = state.maxmin.x.toFixed(1);
        renderMaxmin();
    });

    btnMaxminPlay.addEventListener("click", toggleMaxminAutoPlay);
    btnMaxminReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        if (state.maxmin.isAutoPlaying) toggleMaxminAutoPlay();
        state.maxmin.x = 2.0;
        sliderMaxminX.value = 20;
        valMaxminX.textContent = "2.0";
        renderMaxmin();
    });

    // ==========================================
    // 关卡 3 事件
    // ==========================================
    btnTransLeft.addEventListener("click", () => {
        playSynthSound(580, 0.08);
        state.transform.dx -= 2.0;
        renderTransform();
    });
    btnTransRight.addEventListener("click", () => {
        playSynthSound(580, 0.08);
        state.transform.dx += 2.0;
        renderTransform();
    });
    btnTransUp.addEventListener("click", () => {
        playSynthSound(680, 0.08);
        state.transform.dy += 2.0;
        renderTransform();
    });
    btnTransDown.addEventListener("click", () => {
        playSynthSound(680, 0.08);
        state.transform.dy -= 2.0;
        renderTransform();
    });

    btnTransRefX.addEventListener("click", () => {
        playSynthSound(700, 0.15, "triangle");
        state.transform.scaleX *= -1.0;
        renderTransform();
    });
    btnTransRefY.addEventListener("click", () => {
        playSynthSound(700, 0.15, "triangle");
        state.transform.scaleY *= -1.0;
        renderTransform();
    });
    btnTransRefO.addEventListener("click", () => {
        playSynthSound(800, 0.18, "triangle");
        state.transform.scaleX *= -1.0;
        state.transform.scaleY *= -1.0;
        renderTransform();
    });
    btnTransAbs.addEventListener("click", () => {
        playSynthSound(750, 0.1, "sine");
        state.transform.isAbsoluteFolded = !state.transform.isAbsoluteFolded;
        btnTransAbs.classList.toggle("active", state.transform.isAbsoluteFolded);
        renderTransform();
    });

    btnTransReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        state.transform.dx = 0.0;
        state.transform.dy = 0.0;
        state.transform.scaleX = 1.0;
        state.transform.scaleY = 1.0;
        state.transform.isAbsoluteFolded = false;
        btnTransAbs.classList.remove("active");
        renderTransform();
    });
}

// --- 初始化入口 ---
function init() {
    switchTab("quad-forms");
    initEventBindings();
    setupDragging();
}

document.addEventListener("DOMContentLoaded", init);

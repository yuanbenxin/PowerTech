// ==========================================================================
// 一次函数金牌实验室 Core JavaScript Logic (app.js)
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

// --- 关卡 2 (分段行程) 独立坐标映射 ---
// 右侧 s-t 图像原点在 (360, 290), t轴单位 = 25px (0-8小时), s轴单位 = 23px (0-9km)
const travelOriginX = 360;
const travelOriginY = 290;
const travelScaleT = 25;
const travelScaleS = 23;

function toSvgTravel(t, s) {
    return {
        x: travelOriginX + t * travelScaleT,
        y: travelOriginY - s * travelScaleS
    };
}

// --- 全局状态机 ---
let state = {
    activeTab: "linear-coef", // linear-coef, linear-travel, linear-relation
    coef: {
        k: 1.0,
        b: 0.0,
        // 直线上的两个控制拖拽点 A(-3, y1) 与 B(3, y2)
        ax: -4.0,
        ay: -4.0,
        bx: 4.0,
        by: 4.0
    },
    travel: {
        t: 0.0, // 时间 (0 - 8小时)
        isAutoPlaying: false
    },
    relation: {
        lockMode: "none", // none, parallel, perpendicular
        k1: 1.0,
        b1: 2.0,
        k2: -0.5,
        b2: -2.0,
        // 两条直线的控制点坐标
        l1_ax: -4.0,
        l1_ay: -2.0,
        l1_bx: 4.0,
        l1_by: 6.0,
        
        l2_ax: -4.0,
        l2_ay: 0.0,
        l2_bx: 4.0,
        l2_by: -4.0
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
const drawLayerQuadrants = document.getElementById("draw-layer-quadrants");
const drawLayerAxes = document.getElementById("draw-layer-axes");
const drawLayerCurves = document.getElementById("draw-layer-curves");
const drawLayerMarkers = document.getElementById("draw-layer-markers");
const drawLayerPoints = document.getElementById("draw-layer-points");
const drawLayerShading = document.getElementById("draw-layer-shading");
const drawLayerTrace = document.getElementById("draw-layer-trace");

// 关卡 1 控件
const sliderCoefK = document.getElementById("slider-coef-k");
const valCoefK = document.getElementById("val-coef-k");
const sliderCoefB = document.getElementById("slider-coef-b");
const valCoefB = document.getElementById("val-coef-b");
const btnCoefDirect = document.getElementById("btn-coef-direct");
const btnCoefNeg = document.getElementById("btn-coef-neg");

// 关卡 2 控件
const sliderTravelT = document.getElementById("slider-travel-t");
const valTravelT = document.getElementById("val-travel-t");
const btnTravelPlay = document.getElementById("btn-travel-play");
const btnTravelReset = document.getElementById("btn-travel-reset");

// 关卡 3 控件
const btnRelLockNone = document.getElementById("btn-rel-locknone");
const btnRelLockPara = document.getElementById("btn-rel-lockpara");
const btnRelLockPerp = document.getElementById("btn-rel-lockperp");
const sliderRelK1 = document.getElementById("slider-rel-k1");
const valRelK1 = document.getElementById("val-rel-k1");
const sliderRelK2 = document.getElementById("slider-rel-k2");
const valRelK2 = document.getElementById("val-rel-k2");

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

    if (state.activeTab === "linear-travel") {
        // --- 关卡 2：双子画面分屏网格 ---
        // 1. 中间分割线
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: 300, y1: 0, x2: 300, y2: 340,
            class: "split-divider"
        }));

        // 2. 左侧路线草纸网格 (0 - 300)
        const gridUnit = 15;
        for (let x = gridUnit; x < 300; x += gridUnit) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: x, y1: 0, x2: x, y2: 340, class: "geo-grid-line" }));
        }
        for (let y = gridUnit; y < 340; y += gridUnit) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: 0, y1: y, x2: 300, y2: y, class: "geo-grid-line" }));
        }

        // 3. 右侧 s-t 图像网格
        for (let x = 300 + travelScaleT; x < 600; x += travelScaleT) {
            drawLayerGrid.appendChild(createSVGNode("line", { x1: x, y1: 0, x2: x, y2: 340, class: "geo-grid-line" }));
        }
        for (let y = 14; y < 340; y += 23) { // 面积刻度
            drawLayerGrid.appendChild(createSVGNode("line", { x1: 300, y1: y, x2: 600, y2: y, class: "geo-grid-line" }));
        }

        // 4. 右侧函数区的坐标轴
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: travelOriginX - 15, y1: travelOriginY, x2: 585, y2: travelOriginY,
            class: "geo-grid-axis"
        }));
        drawLayerAxes.appendChild(createSVGNode("line", {
            x1: travelOriginX, y1: 15, x2: travelOriginX, y2: travelOriginY + 15,
            class: "geo-grid-axis"
        }));

        // 轴箭头
        drawLayerAxes.appendChild(createSVGNode("polygon", { points: `585,${travelOriginY-4} 595,${travelOriginY} 585,${travelOriginY+4}`, class: "geo-axis-arrow" }));
        drawLayerAxes.appendChild(createSVGNode("polygon", { points: `${travelOriginX-4},15 ${travelOriginX},5 ${travelOriginX+4},15`, class: "geo-axis-arrow" }));

        // 轴标签
        const labelX = createSVGNode("text", { x: 585, y: travelOriginY + 14, class: "geo-tick-label" });
        labelX.textContent = "t (h)";
        const labelY = createSVGNode("text", { x: travelOriginX - 16, y: 15, class: "geo-tick-label" });
        labelY.textContent = "s (km)";
        drawLayerAxes.appendChild(labelX);
        drawLayerAxes.appendChild(labelY);

        // x轴时间刻度 (t = 2, 4, 6, 8)
        for (let t = 2; t <= 8; t += 2) {
            const pt = toSvgTravel(t, 0);
            drawLayerAxes.appendChild(createSVGNode("line", { x1: pt.x, y1: travelOriginY - 3, x2: pt.x, y2: travelOriginY + 3, class: "geo-tick-line" }));
            const text = createSVGNode("text", { x: pt.x, y: travelOriginY + 12, class: "geo-tick-label" });
            text.textContent = t;
            drawLayerAxes.appendChild(text);
        }

        // s轴路程刻度 (s = 2, 4, 6, 8)
        for (let s = 2; s <= 8; s += 2) {
            const pt = toSvgTravel(0, s);
            drawLayerAxes.appendChild(createSVGNode("line", { x1: travelOriginX - 3, y1: pt.y, x2: travelOriginX + 3, y2: pt.y, class: "geo-tick-line" }));
            const text = createSVGNode("text", { x: travelOriginX - 14, y: pt.y + 3, class: "geo-tick-label" });
            text.textContent = s;
            drawLayerAxes.appendChild(text);
        }

        // 原点 0
        const oText = createSVGNode("text", { x: travelOriginX - 8, y: travelOriginY + 10, class: "geo-tick-label" });
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
    if (coordinateType === "travel-s") {
        svgPt = toSvgTravel(x, y);
    } else if (coordinateType === "travel-route") {
        svgPt = { x: 30 + x * 26.6, y: 170 }; // 左侧物理路线 s -> X投影
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

// 绘制直线
function drawLineCurve(k, b, colorClass = "line-blue") {
    // 绘制 x 从 -14 到 14 的线段
    const ptLeft = toSvgCoords(-14, -14 * k + b);
    const ptRight = toSvgCoords(14, 14 * k + b);
    
    // 裁剪边界
    const line = createSVGNode("line", {
        x1: ptLeft.x, y1: ptLeft.y, x2: ptRight.x, y2: ptRight.y,
        class: `geo-curve ${colorClass}`
    });
    drawLayerCurves.appendChild(line);
}

// 绘制指示线
function drawDottedIndicator(fromMath, toMath, coordinateType = "normal") {
    const fromSvg = (coordinateType === "travel-s") ? toSvgTravel(fromMath.x, fromMath.y) : toSvgCoords(fromMath.x, fromMath.y);
    const toSvg = (coordinateType === "travel-s") ? toSvgTravel(toMath.x, toMath.y) : toSvgCoords(toMath.x, toMath.y);
    
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
    createTraceDot(svgX, svgY, state.activeTab === "linear-relation" ? "green" : "purple");

    playModulatedDragSound(svgX, svgY);

    const mathPt = toMathCoords(svgX, svgY);
    updatePointPosition(activeDragPoint, mathPt.x, mathPt.y);
}

function updatePointPosition(pointId, mx, my) {
    if (state.activeTab === "linear-coef") {
        if (pointId === "Coef_Line_A") {
            const bx = state.coef.bx;
            const by = state.coef.by;
            let ax = Math.max(-9.0, Math.min(-1.0, mx));
            let ay = Math.max(-8.0, Math.min(8.0, my));
            
            // 重新解算 k 与 b
            // k = (by - ay) / (bx - ax)
            // b = ay - k * ax
            if (Math.abs(bx - ax) > 0.1) {
                let k = (by - ay) / (bx - ax);
                let b = ay - k * ax;
                k = Math.max(-3.0, Math.min(3.0, k));
                b = Math.max(-6.0, Math.min(6.0, b));
                
                state.coef.k = k;
                state.coef.b = b;
                state.coef.ax = ax;
                state.coef.ay = ay;
                
                // 同步滑块
                sliderCoefK.value = Math.round(k * 10);
                sliderCoefB.value = Math.round(b * 10);
                valCoefK.textContent = k.toFixed(1);
                valCoefB.textContent = b.toFixed(1);
                
                renderCoef();
            }
        } else if (pointId === "Coef_Line_B") {
            const ax = state.coef.ax;
            const ay = state.coef.ay;
            let bx = Math.max(1.0, Math.min(9.0, mx));
            let by = Math.max(-8.0, Math.min(8.0, my));
            
            if (Math.abs(bx - ax) > 0.1) {
                let k = (by - ay) / (bx - ax);
                let b = ay - k * ax;
                k = Math.max(-3.0, Math.min(3.0, k));
                b = Math.max(-6.0, Math.min(6.0, b));
                
                state.coef.k = k;
                state.coef.b = b;
                state.coef.bx = bx;
                state.coef.by = by;
                
                sliderCoefK.value = Math.round(k * 10);
                sliderCoefB.value = Math.round(b * 10);
                valCoefK.textContent = k.toFixed(1);
                valCoefB.textContent = b.toFixed(1);
                
                renderCoef();
            }
        }
    } else if (state.activeTab === "linear-relation") {
        // 两直线控制点拖动
        if (pointId === "Rel_Line1_A") {
            let ax = Math.max(-9.0, Math.min(-1.0, mx));
            let ay = Math.max(-8.0, Math.min(8.0, my));
            state.relation.l1_ax = ax;
            state.relation.l1_ay = ay;
            solveRelationParams("line1");
        } else if (pointId === "Rel_Line1_B") {
            let bx = Math.max(1.0, Math.min(9.0, mx));
            let by = Math.max(-8.0, Math.min(8.0, my));
            state.relation.l1_bx = bx;
            state.relation.l1_by = by;
            solveRelationParams("line1");
        } else if (pointId === "Rel_Line2_A") {
            let ax = Math.max(-9.0, Math.min(-1.0, mx));
            let ay = Math.max(-8.0, Math.min(8.0, my));
            state.relation.l2_ax = ax;
            state.relation.l2_ay = ay;
            solveRelationParams("line2");
        } else if (pointId === "Rel_Line2_B") {
            let bx = Math.max(1.0, Math.min(9.0, mx));
            let by = Math.max(-8.0, Math.min(8.0, my));
            state.relation.l2_bx = bx;
            state.relation.l2_by = by;
            solveRelationParams("line2");
        }
    }
}

// 联立求解直线 3 几何系数
function solveRelationParams(activeLineId) {
    if (activeLineId === "line1") {
        const ax = state.relation.l1_ax;
        const ay = state.relation.l1_ay;
        const bx = state.relation.l1_bx;
        const by = state.relation.l1_by;
        if (Math.abs(bx - ax) > 0.1) {
            let k1 = (by - ay) / (bx - ax);
            let b1 = ay - k1 * ax;
            k1 = Math.max(-3.0, Math.min(3.0, k1));
            b1 = Math.max(-6.0, Math.min(6.0, b1));
            state.relation.k1 = k1;
            state.relation.b1 = b1;

            sliderRelK1.value = Math.round(k1 * 10);
            valRelK1.textContent = k1.toFixed(1);

            // 如果锁定平行或垂直，需要动态更新直线 2
            if (state.relation.lockMode === "parallel") {
                state.relation.k2 = k1;
                sliderRelK2.value = Math.round(k1 * 10);
                valRelK2.textContent = k1.toFixed(1);
                // 重新对齐直线 2 的控制点高度
                state.relation.l2_ay = -4 * k1 + state.relation.b2;
                state.relation.l2_by = 4 * k1 + state.relation.b2;
            } else if (state.relation.lockMode === "perpendicular") {
                let k2 = Math.abs(k1) < 0.1 ? -10.0 : -1.0 / k1;
                k2 = Math.max(-3.0, Math.min(3.0, k2));
                state.relation.k2 = k2;
                sliderRelK2.value = Math.round(k2 * 10);
                valRelK2.textContent = k2.toFixed(1);
                state.relation.l2_ay = -4 * k2 + state.relation.b2;
                state.relation.l2_by = 4 * k2 + state.relation.b2;
            }
        }
    } else if (activeLineId === "line2") {
        const ax = state.relation.l2_ax;
        const ay = state.relation.l2_ay;
        const bx = state.relation.l2_bx;
        const by = state.relation.l2_by;
        if (Math.abs(bx - ax) > 0.1) {
            let k2 = (by - ay) / (bx - ax);
            let b2 = ay - k2 * ax;
            k2 = Math.max(-3.0, Math.min(3.0, k2));
            b2 = Math.max(-6.0, Math.min(6.0, b2));
            state.relation.k2 = k2;
            state.relation.b2 = b2;

            sliderRelK2.value = Math.round(k2 * 10);
            valRelK2.textContent = k2.toFixed(1);

            if (state.relation.lockMode === "parallel") {
                state.relation.k1 = k2;
                sliderRelK1.value = Math.round(k2 * 10);
                valRelK1.textContent = k2.toFixed(1);
                state.relation.l1_ay = -4 * k2 + state.relation.b1;
                state.relation.l1_by = 4 * k2 + state.relation.b1;
            } else if (state.relation.lockMode === "perpendicular") {
                let k1 = Math.abs(k2) < 0.1 ? -10.0 : -1.0 / k2;
                k1 = Math.max(-3.0, Math.min(3.0, k1));
                state.relation.k1 = k1;
                sliderRelK1.value = Math.round(k1 * 10);
                valRelK1.textContent = k1.toFixed(1);
                state.relation.l1_ay = -4 * k1 + state.relation.b1;
                state.relation.l1_by = 4 * k1 + state.relation.b1;
            }
        }
    }
    renderRelation();
}

// === 各关卡渲染与逻辑 ===

// === 关卡 1：解析式与系数性质 ===
function renderCoef() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";
    drawLayerQuadrants.innerHTML = "";

    const k = state.coef.k;
    const b = state.coef.b;

    // 1. 计算控制点以拟合当前滑块 k, b (若非直接拖动触发)
    // 固定 ax = -4.0, bx = 4.0
    state.coef.ax = -4.0;
    state.coef.ay = -4.0 * k + b;
    state.coef.bx = 4.0;
    state.coef.by = 4.0 * k + b;

    // 2. 绘制一次函数直线
    drawLineCurve(k, b, "line-blue");

    // 3. 计算经过的象限
    // 象限判断：
    // I: x > 0, y > 0
    // II: x < 0, y > 0
    // III: x < 0, y < 0
    // IV: x > 0, y < 0
    let quads = [];
    if (k === 0) {
        if (b > 0) quads = [1, 2];
        else if (b < 0) quads = [3, 4];
        else quads = [1, 2, 3, 4]; // 在轴上
    } else {
        // 求 X 轴截距 r = -b/k
        const r = -b / k;
        if (k > 0) {
            if (b > 0) quads = [1, 2, 3];
            else if (b < 0) quads = [1, 3, 4];
            else quads = [1, 3];
        } else {
            if (b > 0) quads = [1, 2, 4];
            else if (b < 0) quads = [2, 3, 4];
            else quads = [2, 4];
        }
    }

    // 4. 象限高亮绘制
    // 绘制象限浅色背景纸盖在底层
    quads.forEach(q => {
        let rx = 0, ry = 0;
        if (q === 1) { rx = 300; ry = 0; }
        else if (q === 2) { rx = 0; ry = 0; }
        else if (q === 3) { rx = 0; ry = 170; }
        else if (q === 4) { rx = 300; ry = 170; }

        const rect = createSVGNode("rect", {
            x: rx, y: ry, width: 300, height: 170,
            class: "quadrant-highlight"
        });
        drawLayerQuadrants.appendChild(rect);
        
        // 象限名字标记
        let labelName = "";
        if (q === 1) labelName = "第一象限";
        else if (q === 2) labelName = "第二象限";
        else if (q === 3) labelName = "第三象限";
        else if (q === 4) labelName = "第四象限";
        
        const qText = createSVGNode("text", {
            x: rx + 150, y: ry + 85,
            class: "geo-tick-label",
            style: "font-size:9.5px; fill: rgba(37,99,235,0.18); font-weight:800;"
        });
        qText.textContent = labelName;
        drawLayerQuadrants.appendChild(qText);
    });

    // 5. 绘制 Y 轴截距交点标红
    drawPoint(0, b, `Y轴截距 (0, ${b.toFixed(1)})`, "right");
    // 绘制 X 轴交点
    if (k !== 0) {
        const root = -b / k;
        drawPoint(root, 0, `X轴交点 (${root.toFixed(1)}, 0)`, "bottom");
    }

    // 6. 绘制直线上两个紫色拖拽把手
    drawPoint(state.coef.ax, state.coef.ay, "A (拖动旋转)", "left", "line-dragger line1 draggable", "Coef_Line_A");
    drawPoint(state.coef.bx, state.coef.by, "B (拖动旋转)", "right", "line-dragger line1 draggable", "Coef_Line_B");

    // 7. 更新监控面板
    const eqText = `y = ${k.toFixed(1)}x ${b >= 0 ? '+' : ''}${b.toFixed(1)}`;
    document.getElementById("monitor-coef-func").textContent = eqText;
    
    // 象限名字拼合中文
    const quadNames = quads.map(q => {
        if (q === 1) return "一";
        if (q === 2) return "二";
        if (q === 3) return "三";
        if (q === 4) return "四";
    });
    document.getElementById("monitor-coef-quads").textContent = `第 ${quadNames.join("、")} 象限`;

    pruneUnusedPoints();
    updateCoefHUD(k, b, quads);
}

function updateCoefHUD(k, b, quads) {
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>1. 斜率系数 k 的方向意义 (k = ${k.toFixed(1)})</b><br>
            * k > 0 ⟹ 直线从左下到右上倾斜，函数值随 x 增大而<b>增大 (增函数)</b>。<br>
            * k < 0 ⟹ 直线从左上到右下倾斜，函数值随 x 增大而<b>减小 (减函数)</b>。
        </div>
        <div class="proof-step-card success">
            <b>2. Y轴截距 b 的位移意义 (b = ${b.toFixed(1)})</b><br>
            直线与 Y 轴交点为 (0, b) = <b>(0, ${b.toFixed(1)})</b>。<br>
            * b > 0 直线整体向上浮动；b < 0 直线整体向下沉底。
        </div>
        <div class="proof-step-card success" style="border-left-color: var(--color-purple)">
            <b>3. 象限穿越律发现</b><br>
            当前直线所经象限：<b>第 ${quads.join("、")} 象限</b>。<br>
            随着你拖拽直线旋转，底色高亮会自动更新，帮助你直观领会中考象限方程的判断规律。
        </div>
    `;

    hudContent.innerHTML = stepHtml;
}

// === 关卡 2：分段行程应用 ===
function renderTravel() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";

    const t = state.travel.t;
    
    // 算路程 s 物理分段
    // 段 1: 0 - 3h. s = 2t. v = 2 km/h
    // 段 2: 3 - 6h. s = 6.  v = 0 km/h (静止在图书馆)
    // 段 3: 6 - 8h. s = 6 - 3*(t - 6). v = -3 km/h (骑自行车回家)
    let s = 0.0;
    let v = 0.0;
    let desc = "";
    let formulaText = "";

    if (t <= 3.0) {
        s = 2 * t;
        v = 2.0;
        desc = "小明去图书馆中";
        formulaText = `s = 2.0t (0 ≤ t < 3)`;
    } else if (t <= 6.0) {
        s = 6.0;
        v = 0.0;
        desc = "小明在图书馆看书";
        formulaText = `s = 6.0 (3 ≤ t < 6)`;
    } else {
        s = 6.0 - 3.0 * (t - 6.0);
        v = -3.0;
        desc = "小明骑车回家中";
        formulaText = `s = 6.0 - 3.0(t - 6) (6 ≤ t ≤ 8)`;
    }

    // === 左半侧行程物理动画区 (0 - 300) ===
    // 1. 绘制水平路线轴线 (Y = 170)
    const route = createSVGNode("line", {
        x1: 30, y1: 170, x2: 270, y2: 170,
        class: "travel-route-line"
    });
    drawLayerMarkers.appendChild(route);

    // 2. 绘制各个标记站点
    // 家 (s=0 ⟹ X=30)
    const homeCircle = createSVGNode("circle", { cx: 30, cy: 170, r: 5, class: "travel-route-station" });
    drawLayerMarkers.appendChild(homeCircle);
    const homeText = createSVGNode("text", { x: 30, y: 190, class: "geo-text", style: "text-anchor:middle;" });
    homeText.textContent = "家 (0km)";
    drawLayerMarkers.appendChild(homeText);

    // 图书馆 (s=6 ⟹ X=30 + 6 * 26.6 = 190)
    const libCircle = createSVGNode("circle", { cx: 190, cy: 170, r: 5, class: "travel-route-station" });
    drawLayerMarkers.appendChild(libCircle);
    const libText = createSVGNode("text", { x: 190, y: 190, class: "geo-text", style: "text-anchor:middle;" });
    libText.textContent = "图书馆 (6km)";
    drawLayerMarkers.appendChild(libText);

    // 公园 (s=9 ⟹ X=30 + 9 * 26.6 = 270)
    const parkCircle = createSVGNode("circle", { cx: 270, cy: 170, r: 5, class: "travel-route-station" });
    drawLayerMarkers.appendChild(parkCircle);
    const parkText = createSVGNode("text", { x: 270, y: 190, class: "geo-text", style: "text-anchor:middle;" });
    parkText.textContent = "公园 (9km)";
    drawLayerMarkers.appendChild(parkText);

    // 3. 绘制运动小明
    drawPoint(s, 0, "小明", "top", "fence-dragger", null, "travel-route");

    // === 右半侧折线图形区 (300 - 600) ===
    // 绘制三段直线折线图
    let pathD = "";
    // 点 0 (0, 0)
    const p0 = toSvgTravel(0, 0);
    // 点 1 (3, 6)
    const p1 = toSvgTravel(3, 6);
    // 点 2 (6, 6)
    const p2 = toSvgTravel(6, 6);
    // 点 3 (8, 0)
    const p3 = toSvgTravel(8, 0);

    pathD = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;

    const path = createSVGNode("path", {
        d: pathD,
        class: "geo-curve line-green"
    });
    drawLayerCurves.appendChild(path);

    // 绘制右侧当前动点 P(t, s)
    drawPoint(t, s, `P(${t.toFixed(1)}h, ${s.toFixed(1)}km)`, "top", "zero-point", null, "travel-s");
    drawDottedIndicator({ x: t, y: s }, { x: t, y: 0 }, "travel-s");
    drawDottedIndicator({ x: t, y: s }, { x: 0, y: s }, "travel-s");

    // === 更新控制面板指标 ===
    document.getElementById("monitor-travel-formula").textContent = formulaText;
    document.getElementById("monitor-travel-t").textContent = `${t.toFixed(2)} h`;
    document.getElementById("monitor-travel-s").textContent = `${s.toFixed(2)} km`;
    document.getElementById("monitor-travel-v").textContent = `${Math.abs(v).toFixed(2)} km/h`;
    document.getElementById("monitor-travel-pos").textContent = desc;

    pruneUnusedPoints();
    updateTravelHUD(t, s, v, desc);
}

function updateTravelHUD(t, s, v, desc) {
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>1. 分段行程物理模型</b><br>
            * 去程：0h 到 3h，路程 <b>s = 2t</b>，以速度 2km/h 匀速前进。<br>
            * 停歇：3h 到 6h，路程 <b>s = 6</b> 保持不变，小明在图书馆看书。<br>
            * 回程：6h 到 8h，路程 <b>s = 24 - 3t</b>，以速度 3km/h 骑车返回家中。
        </div>
    `;

    if (t > 0.05) {
        stepHtml += `
            <div class="proof-step-card success">
                <b>2. 斜率即速度变化率</b><br>
                一次函数的斜率 k 代表着路程的变化率（即**物理速度 v**）！<br>
                * 去程斜率 k = +2 (速度正，前行)；<br>
                * 读书段斜率 k = 0 (速度为零，静止)；<br>
                * 回程斜率 k = -3 (负斜率，返回；倾斜更陡，速度更快)。
            </div>
            <div class="proof-step-card success" style="border-left-color: var(--color-purple)">
                <b>3. 动态时间轴指示</b><br>
                当前时刻 <b>t = ${t.toFixed(1)}</b> 小时，小明距离家 <b>${s.toFixed(1)}</b> km。<br>
                小明当前的运动状态：<b>${desc}</b>。
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 关卡 3：两直线位置关系 ===
function renderRelation() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";
    drawLayerShading.innerHTML = "";

    const k1 = state.relation.k1;
    const b1 = state.relation.b1;
    const k2 = state.relation.k2;
    const b2 = state.relation.b2;
    const lockMode = state.relation.lockMode;

    // 1. 绘制直线 L1 与 L2
    drawLineCurve(k1, b1, "line-blue");
    drawLineCurve(k2, b2, "line-purple");

    // 2. 绘制直线控制把手
    // 直线 1 控制点
    state.relation.l1_ax = -4.0;
    state.relation.l1_ay = -4.0 * k1 + b1;
    state.relation.l1_bx = 4.0;
    state.relation.l1_by = 4.0 * k1 + b1;
    drawPoint(state.relation.l1_ax, state.relation.l1_ay, "L₁_A", "left", "line-dragger line1 draggable", "Rel_Line1_A");
    drawPoint(state.relation.l1_bx, state.relation.l1_by, "L₁_B", "right", "line-dragger line1 draggable", "Rel_Line1_B");

    // 直线 2 控制点
    state.relation.l2_ax = -4.0;
    state.relation.l2_ay = -4.0 * k2 + b2;
    state.relation.l2_bx = 4.0;
    state.relation.l2_by = 4.0 * k2 + b2;
    drawPoint(state.relation.l2_ax, state.relation.l2_ay, "L₂_A", "left", "line-dragger line2 draggable", "Rel_Line2_A");
    drawPoint(state.relation.l2_bx, state.relation.l2_by, "L₂_B", "right", "line-dragger line2 draggable", "Rel_Line2_B");

    // 3. 计算两直线交点
    // k1 * x + b1 = k2 * x + b2 => x = (b2 - b1) / (k1 - k2)
    let statusText = "普通相交";
    let angleVal = 0.0;

    if (Math.abs(k1 - k2) < 0.02) {
        if (Math.abs(b1 - b2) < 0.1) {
            statusText = "重合";
        } else {
            statusText = "平行";
        }
    } else if (Math.abs(k1 * k2 + 1.0) < 0.02) {
        statusText = "垂直相交";
    }

    if (statusText === "平行" || statusText === "重合") {
        document.getElementById("monitor-rel-intersect").textContent = "无交点 (平行/重合)";
        document.getElementById("monitor-rel-angle").textContent = "0.0°";
    } else {
        const ix = (b2 - b1) / (k1 - k2);
        const iy = k1 * ix + b1;
        
        drawPoint(ix, iy, "I (交点)", "top", "intersection");
        document.getElementById("monitor-rel-intersect").textContent = `(${ix.toFixed(2)}, ${iy.toFixed(2)})`;

        // 计算夹角 theta = atan(|(k1-k2)/(1+k1*k2)|)
        const denominator = 1.0 + k1 * k2;
        if (Math.abs(denominator) < 0.001) {
            angleVal = 90.0;
        } else {
            angleVal = Math.atan(Math.abs((k1 - k2) / denominator)) * (180.0 / Math.PI);
        }
        document.getElementById("monitor-rel-angle").textContent = `${angleVal.toFixed(1)}°`;

        // 4. 垂直锁定下高亮直角标志
        if (statusText === "垂直相交") {
            const ptI = toSvgCoords(ix, iy);
            // 得到两直线的方向单位向量
            const len1 = Math.sqrt(1 + k1 * k1);
            const dx1 = 1 / len1;
            const dy1 = k1 / len1;

            const len2 = Math.sqrt(1 + k2 * k2);
            const dx2 = 1 / len2;
            const dy2 = k2 / len2;

            // 绘制直角符号正交点, 边长 10px
            const d = 11.0;
            const p1x = ptI.x + dx1 * d;
            const p1y = ptI.y - dy1 * d; // SVG Y坐标反向
            
            const p2x = ptI.x + dx2 * d;
            const p2y = ptI.y - dy2 * d;

            const p3x = ptI.x + (dx1 + dx2) * d;
            const p3y = ptI.y - (dy1 + dy2) * d;

            const perpPoly = createSVGNode("polygon", {
                points: `${ptI.x},${ptI.y} ${p1x},${p1y} ${p3x},${p3y} ${p2x},${p2y}`,
                class: "perp-angle-marker"
            });
            drawLayerShading.appendChild(perpPoly);
        }
    }

    // 5. 更新指标
    document.getElementById("monitor-rel-func1").textContent = `y = ${k1.toFixed(1)}x ${b1 >= 0 ? '+' : ''}${b1.toFixed(1)}`;
    document.getElementById("monitor-rel-func2").textContent = `y = ${k2.toFixed(1)}x ${b2 >= 0 ? '+' : ''}${b2.toFixed(1)}`;
    document.getElementById("monitor-rel-status").textContent = statusText;

    pruneUnusedPoints();
    updateRelationHUD(k1, b1, k2, b2, statusText, angleVal);
}

function updateRelationHUD(k1, b1, k2, b2, statusText, angleVal) {
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>1. 直线关系与方程组对应</b><br>
            两直线相交于点 I，交点坐标就是联立方程组的唯一解。
        </div>
    `;

    if (statusText === "平行") {
        stepHtml += `
            <div class="proof-step-card warning" style="border-left-color: var(--color-orange);">
                <b>2. 平行定律 (k₁ = k₂ 且 b₁ ≠ b₂)</b><br>
                两斜率相等 <b>k₁ = k₂ = ${k1.toFixed(1)}</b>，倾斜度相同，说明直线平行，方程组无解。
            </div>
        `;
    } else if (statusText === "垂直相交") {
        stepHtml += `
            <div class="proof-step-card success" style="border-left-color: var(--color-red); animation: pulse 0.8s infinite;">
                <b>2. 垂直定律 (k₁ × k₂ = -1)</b><br>
                两斜率乘积 <b>k₁ × k₂ = ${k1.toFixed(1)} × ${k2.toFixed(1)} = -1.00</b>！<br>
                在交点处可见直角红色标记，两直线夹角精确保持在 90.0°。
            </div>
        `;
    } else {
        stepHtml += `
            <div class="proof-step-card success">
                <b>2. 相交夹角性质</b><br>
                当斜率不相等时两直线相交，当前夹角 θ = <b>${angleVal.toFixed(1)}°</b>。<br>
                尝试点击上方“一键垂直”或“一键平行”来锁定它们的相对姿态。
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 自动演示行程动画 ===
let travelAnimId = null;
let travelStartTime = 0;
function toggleTravelAutoPlay() {
    if (state.travel.isAutoPlaying) {
        state.travel.isAutoPlaying = false;
        btnTravelPlay.innerHTML = `<i class="fa-solid fa-play"></i> 播放行程动画`;
        btnTravelPlay.classList.remove("primary");
        if (travelAnimId) cancelAnimationFrame(travelAnimId);
    } else {
        state.travel.isAutoPlaying = true;
        btnTravelPlay.innerHTML = `<i class="fa-solid fa-pause"></i> 停止播放`;
        btnTravelPlay.classList.add("primary");
        playSynthSound(600, 0.15);
        travelStartTime = performance.now();

        function step(timestamp) {
            if (!state.travel.isAutoPlaying) return;
            const elapsed = timestamp - travelStartTime;

            // 让时间从 0 到 8.0 小时循环
            const duration = 12000; // 12秒播完一轮
            let t = (elapsed % duration) / duration * 8.0;
            state.travel.t = t;
            
            sliderTravelT.value = Math.round(t * 10);
            valTravelT.textContent = t.toFixed(1);
            renderTravel();

            travelAnimId = requestAnimationFrame(step);
        }
        travelAnimId = requestAnimationFrame(step);
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
    drawLayerQuadrants.innerHTML = "";

    drawCoordinateSystem();

    if (tabId === "linear-coef") {
        whiteboardTitleText.textContent = "一次函数解析式与系数性质";
        controlCardTitle.textContent = "斜率与截距控制台";
        hintTitle.textContent = "一次函数秘籍";
        hintContent.innerHTML = `
            <h3>斜率与截距的数形规律</h3>
            <ul>
                <li><b>k 决定增减性</b>：k > 0 随自变量增大而增大；k < 0 随自变量增大而减小。</li>
                <li><b>b 决定平移</b>：直线整体向上/下平移 |b| 单位。</li>
                <li><b>象限穿越</b>：斜率与截距联合决定直线穿过哪些象限（例如 k > 0, b < 0 穿过一、三、四象限）。</li>
            </ul>
        `;
        renderCoef();
    } else if (tabId === "linear-travel") {
        whiteboardTitleText.textContent = "行程分段一次函数物理模型";
        controlCardTitle.textContent = "分段行程控制台";
        hintTitle.textContent = "行程问题秘籍";
        hintContent.innerHTML = `
            <h3>分段解析与斜率意义</h3>
            <ul>
                <li><b>斜率即速度</b>：路程-时间折线图中，折线段倾斜越陡，说明速度值越大。</li>
                <li><b>水平静止</b>：直线平行于 X 轴说明路程不发生变化（小明在图书馆静止停留）。</li>
                <li><b>负斜率回程</b>：斜率为负数说明小明正从图书馆骑车折返家中。</li>
            </ul>
        `;
        renderTravel();
    } else if (tabId === "linear-relation") {
        whiteboardTitleText.textContent = "两直线位置关系与联立方程";
        controlCardTitle.textContent = "两直线关系控制台";
        hintTitle.textContent = "平行与垂直秘籍";
        hintContent.innerHTML = `
            <h3>位置关系与系数乘积</h3>
            <ul>
                <li><b>平行法则 (k₁ = k₂)</b>：当两斜率相等且截距不等时，两直线平行，无交点。</li>
                <li><b>垂直法则 (k₁ × k₂ = -1)</b>：当两斜率乘积为 -1 时，两直线正交，交角恒为 90°。</li>
                <li><b>重合法则</b>：斜率与截距均相等。</li>
            </ul>
        `;
        renderRelation();
    }
}

// === 事件监听绑定 ===
function initEventBindings() {
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (state.travel.isAutoPlaying) toggleTravelAutoPlay();
            playSynthSound(500, 0.05);
            switchTab(btn.getAttribute("data-tab"));
        });
    });

    // ==========================================
    // 关卡 1 事件
    // ==========================================
    sliderCoefK.addEventListener("input", () => {
        state.coef.k = parseInt(sliderCoefK.value) / 10;
        valCoefK.textContent = state.coef.k.toFixed(1);
        renderCoef();
    });
    sliderCoefB.addEventListener("input", () => {
        state.coef.b = parseInt(sliderCoefB.value) / 10;
        valCoefB.textContent = state.coef.b.toFixed(1);
        renderCoef();
    });

    btnCoefDirect.addEventListener("click", () => {
        playSynthSound(600, 0.08);
        state.coef.b = 0.0;
        sliderCoefB.value = 0;
        valCoefB.textContent = "0.0";
        renderCoef();
    });

    btnCoefNeg.addEventListener("click", () => {
        playSynthSound(600, 0.08);
        state.coef.k = -1.0;
        sliderCoefK.value = -10;
        valCoefK.textContent = "-1.0";
        renderCoef();
    });

    // ==========================================
    // 关卡 2 事件
    // ==========================================
    sliderTravelT.addEventListener("input", () => {
        state.travel.t = parseInt(sliderTravelT.value) / 10;
        valTravelT.textContent = state.travel.t.toFixed(1);
        renderTravel();
    });

    btnTravelPlay.addEventListener("click", toggleTravelAutoPlay);
    btnTravelReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        if (state.travel.isAutoPlaying) toggleTravelAutoPlay();
        state.travel.t = 0.0;
        sliderTravelT.value = 0;
        valTravelT.textContent = "0.0";
        renderTravel();
    });

    // ==========================================
    // 关卡 3 事件
    // ==========================================
    const relBtns = [btnRelLockNone, btnRelLockPara, btnRelLockPerp];
    
    function setLockMode(mode, activeBtn) {
        playSynthSound(600, 0.1);
        state.relation.lockMode = mode;
        relBtns.forEach(b => b.classList.remove("active"));
        activeBtn.classList.add("active");

        if (mode === "parallel") {
            // 直线 2 的斜率强制等于直线 1
            state.relation.k2 = state.relation.k1;
            sliderRelK2.value = sliderRelK1.value;
            valRelK2.textContent = valRelK1.textContent;
            sliderRelK2.disabled = true; // 平行模式下禁用 L2 滑块，直接联动！
        } else if (mode === "perpendicular") {
            // 直线 2 的斜率强制为 -1/k1
            let k2 = Math.abs(state.relation.k1) < 0.1 ? -10.0 : -1.0 / state.relation.k1;
            k2 = Math.max(-3.0, Math.min(3.0, k2));
            state.relation.k2 = k2;
            sliderRelK2.value = Math.round(k2 * 10);
            valRelK2.textContent = k2.toFixed(1);
            sliderRelK2.disabled = true; // 垂直模式下禁用 L2 滑块
        } else {
            sliderRelK2.disabled = false;
        }
        renderRelation();
    }

    btnRelLockNone.addEventListener("click", () => setLockMode("none", btnRelLockNone));
    btnRelLockPara.addEventListener("click", () => setLockMode("parallel", btnRelLockPara));
    btnRelLockPerp.addEventListener("click", () => setLockMode("perpendicular", btnRelLockPerp));

    sliderRelK1.addEventListener("input", () => {
        state.relation.k1 = parseInt(sliderRelK1.value) / 10;
        valRelK1.textContent = state.relation.k1.toFixed(1);
        
        if (state.relation.lockMode === "parallel") {
            state.relation.k2 = state.relation.k1;
            valRelK2.textContent = state.relation.k1.toFixed(1);
            sliderRelK2.value = sliderRelK1.value;
        } else if (state.relation.lockMode === "perpendicular") {
            let k2 = Math.abs(state.relation.k1) < 0.1 ? -10.0 : -1.0 / state.relation.k1;
            k2 = Math.max(-3.0, Math.min(3.0, k2));
            state.relation.k2 = k2;
            valRelK2.textContent = k2.toFixed(1);
            sliderRelK2.value = Math.round(k2 * 10);
        }
        renderRelation();
    });

    sliderRelK2.addEventListener("input", () => {
        if (state.relation.lockMode !== "none") return;
        state.relation.k2 = parseInt(sliderRelK2.value) / 10;
        valRelK2.textContent = state.relation.k2.toFixed(1);
        renderRelation();
    });
}

// --- 初始化入口 ---
function init() {
    switchTab("linear-coef");
    initEventBindings();
    setupDragging();
}

document.addEventListener("DOMContentLoaded", init);

// ==========================================================================
// 函数与方程交点金牌实验室 Core JavaScript Logic
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
        const freq = Math.max(280, Math.min(1000, 880 - y * 1.6));
        playSynthSound(freq, 0.03, "sine");
        lastSoundY = y;
        lastSoundTime = now;
    }
}

// --- 坐标投影数学转换 (1单位 = 20px, 中心 300, 170 为原点) ---
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

// --- 全局状态状态机 ---
let state = {
    activeTab: "linear-eq",
    linear: {
        k: 1.0,
        b: 0.0
    },
    system: {
        k1: 1.0,
        b1: 2.0,
        k2: -1.0,
        b2: -2.0
    },
    quadratic: {
        a: 0.5,
        b: 0.0,
        c: -2.0,
        isAutoPlaying: false
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

// 关卡 1 控件
const sliderLinearK = document.getElementById("slider-linear-k");
const valLinearK = document.getElementById("val-linear-k");
const sliderLinearB = document.getElementById("slider-linear-b");
const valLinearB = document.getElementById("val-linear-b");
const btnLinearReset = document.getElementById("btn-linear-reset");

// 关卡 2 控件
const sliderSysK1 = document.getElementById("slider-sys-k1");
const valSysK1 = document.getElementById("val-sys-k1");
const sliderSysB1 = document.getElementById("slider-sys-b1");
const valSysB1 = document.getElementById("val-sys-b1");
const sliderSysK2 = document.getElementById("slider-sys-k2");
const valSysK2 = document.getElementById("val-sys-k2");
const sliderSysB2 = document.getElementById("slider-sys-b2");
const valSysB2 = document.getElementById("val-sys-b2");
const btnSysReset = document.getElementById("btn-sys-reset");

// 关卡 3 控件
const sliderQuadA = document.getElementById("slider-quad-a");
const valQuadA = document.getElementById("val-quad-a");
const sliderQuadB = document.getElementById("slider-quad-b");
const valQuadB = document.getElementById("val-quad-b");
const sliderQuadC = document.getElementById("slider-quad-c");
const valQuadC = document.getElementById("val-quad-c");
const btnQuadAuto = document.getElementById("btn-quad-auto");
const btnQuadReset = document.getElementById("btn-quad-reset");

// --- 通用 SVG 创建工具 ---
function createSVGNode(type, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
}

// 绘制网格与坐标轴 (一次性绘制)
function drawCoordinateSystem() {
    drawLayerGrid.innerHTML = "";
    drawLayerAxes.innerHTML = "";

    // 1. 绘制网格线
    const spacing = scaleUnit;
    for (let x = spacing; x < 600; x += spacing) {
        const line = createSVGNode("line", {
            x1: x, y1: 0, x2: x, y2: 340,
            class: "geo-grid-line"
        });
        drawLayerGrid.appendChild(line);
    }
    for (let y = spacing; y < 340; y += spacing) {
        const line = createSVGNode("line", {
            x1: 0, y1: y, x2: 600, y2: y,
            class: "geo-grid-line"
        });
        drawLayerGrid.appendChild(line);
    }

    // 2. 绘制 X 和 Y 坐标轴线
    const xAxis = createSVGNode("line", {
        x1: 15, y1: originY, x2: 585, y2: originY,
        class: "geo-grid-axis"
    });
    const yAxis = createSVGNode("line", {
        x1: originX, y1: 15, x2: originX, y2: 325,
        class: "geo-grid-axis"
    });
    drawLayerAxes.appendChild(xAxis);
    drawLayerAxes.appendChild(yAxis);

    // 轴端箭头
    const arrowX = createSVGNode("polygon", {
        points: `585,${originY-4} 595,${originY} 585,${originY+4}`,
        class: "geo-axis-arrow"
    });
    const arrowY = createSVGNode("polygon", {
        points: `${originX-4},15 ${originX},5 ${originX+4},15`,
        class: "geo-axis-arrow"
    });
    drawLayerAxes.appendChild(arrowX);
    drawLayerAxes.appendChild(arrowY);

    // 轴标签
    const labelX = createSVGNode("text", {
        x: 585, y: originY + 16,
        class: "geo-tick-label",
        style: "font-size: 10px;"
    });
    labelX.textContent = "x";
    const labelY = createSVGNode("text", {
        x: originX - 14, y: 15,
        class: "geo-tick-label",
        style: "font-size: 10px;"
    });
    labelY.textContent = "y";
    drawLayerAxes.appendChild(labelX);
    drawLayerAxes.appendChild(labelY);

    // 3. 绘制刻度和数字 (隔2个单位标一个数字)
    for (let xMath = -14; xMath <= 14; xMath++) {
        if (xMath === 0) continue;
        const pt = toSvgCoords(xMath, 0);
        const tick = createSVGNode("line", {
            x1: pt.x, y1: originY - 3, x2: pt.x, y2: originY + 3,
            class: "geo-tick-line"
        });
        drawLayerAxes.appendChild(tick);

        if (xMath % 2 === 0) {
            const text = createSVGNode("text", {
                x: pt.x - 3, y: originY + 12,
                class: "geo-tick-label"
            });
            text.textContent = xMath;
            drawLayerAxes.appendChild(text);
        }
    }

    for (let yMath = -8; yMath <= 8; yMath++) {
        if (yMath === 0) continue;
        const pt = toSvgCoords(0, yMath);
        const tick = createSVGNode("line", {
            x1: originX - 3, y1: pt.y, x2: originX + 3, y2: pt.y,
            class: "geo-tick-line"
        });
        drawLayerAxes.appendChild(tick);

        if (yMath % 2 === 0) {
            const text = createSVGNode("text", {
                x: originX - 14, y: pt.y + 3,
                class: "geo-tick-label"
            });
            text.textContent = yMath;
            drawLayerAxes.appendChild(text);
        }
    }

    // 原点 0
    const originLabel = createSVGNode("text", {
        x: originX - 10, y: originY + 10,
        class: "geo-tick-label"
    });
    originLabel.textContent = "0";
    drawLayerAxes.appendChild(originLabel);
}

// --- 增量渲染顶点策略 (防止销毁 DOM 导致拖拽断开与抖动) ---
let renderedPoints = new Set();

function drawPoint(x, y, label, labelPos = "top", colorClass = "", dragPointId = null) {
    const pointId = `point-group-${label}`;
    renderedPoints.add(pointId);

    let dx = 0, dy = 0;
    if (labelPos === "top") { dx = -4; dy = -11; }
    else if (labelPos === "bottom") { dx = -4; dy = 19; }
    else if (labelPos === "bottom-far") { dx = -4; dy = 32; }
    else if (labelPos === "left") { dx = -19; dy = 4; }
    else if (labelPos === "right") { dx = 11; dy = 4; }

    const svgPt = toSvgCoords(x, y);

    let g = document.getElementById(pointId);
    if (g) {
        g.querySelectorAll("circle").forEach(circle => {
            circle.setAttribute("cx", svgPt.x);
            circle.setAttribute("cy", svgPt.y);
        });
        const text = g.querySelector("text");
        if (text) {
            text.setAttribute("x", svgPt.x + dx);
            text.setAttribute("y", svgPt.y + dy);
        }
        return g;
    }

    g = createSVGNode("g", { id: pointId, class: `geo-point-group ${colorClass} ${dragPointId ? 'draggable' : ''}` });
    if (colorClass.includes("intersection")) {
        const halo = createSVGNode("circle", { cx: svgPt.x, cy: svgPt.y, r: 12, class: "intersection-halo" });
        g.appendChild(halo);
    }
    const circle = createSVGNode("circle", { cx: svgPt.x, cy: svgPt.y, r: 6, class: "geo-point-core" });
    g.appendChild(circle);
    
    const text = createSVGNode("text", { class: "geo-text" });
    text.setAttribute("x", svgPt.x + dx);
    text.setAttribute("y", svgPt.y + dy);
    text.textContent = label;
    g.appendChild(text);
    
    if (dragPointId) {
        const touchTarget = createSVGNode("circle", { cx: svgPt.x, cy: svgPt.y, r: 26, class: "geo-point-touch-target" });
        g.insertBefore(touchTarget, text);
        [circle, touchTarget].forEach(target => {
            target.addEventListener("mousedown", (e) => onDragStart(e, dragPointId));
            target.addEventListener("touchstart", (e) => onDragStart(e, dragPointId), { passive: false });
            target.addEventListener("pointerdown", (e) => {
                if (e.pointerType === "pen") onDragStart(e, dragPointId);
            });
        });
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

function drawLineByEquation(k, b, className = "geo-curve") {
    // 求解边界点绘制直线
    const ptLeft = toSvgCoords(-15, -15 * k + b);
    const ptRight = toSvgCoords(15, 15 * k + b);
    
    const line = createSVGNode("line", {
        x1: ptLeft.x, y1: ptLeft.y, x2: ptRight.x, y2: ptRight.y,
        class: className
    });
    drawLayerCurves.appendChild(line);
    return line;
}

function drawDottedIndicator(fromMath, toMath) {
    const fromSvg = toSvgCoords(fromMath.x, fromMath.y);
    const toSvg = toSvgCoords(toMath.x, toMath.y);
    
    const line = createSVGNode("line", {
        x1: fromSvg.x, y1: fromSvg.y, x2: toSvg.x, y2: toSvg.y,
        class: "geo-indicator-line"
    });
    drawLayerMarkers.appendChild(line);
}

// --- 统一拖拽处理系统 ---
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
    
    // 转换为数学坐标
    const mathPt = toMathCoords(svgX, svgY);
    
    playModulatedDragSound(svgX, svgY);
    
    updatePointPosition(activeDragPoint, mathPt.x, mathPt.y);
}

function updatePointPosition(pointId, mx, my) {
    if (state.activeTab === "linear-eq") {
        if (pointId === "A") {
            // A 点在 Y 轴上，拖拽改变截距 b
            state.linear.b = Math.max(-8, Math.min(8, my));
            sliderLinearB.value = Math.round(state.linear.b * 10);
            valLinearB.textContent = state.linear.b.toFixed(1);
        } else if (pointId === "B") {
            // B 点的横坐标固定为 3，拖拽其高度来改变斜率 k
            const b = state.linear.b;
            const targetY = Math.max(-10, Math.min(10, my));
            // y_B = 3k + b => k = (y_B - b) / 3
            state.linear.k = (targetY - b) / 3;
            sliderLinearK.value = Math.round(state.linear.k * 10);
            valLinearK.textContent = state.linear.k.toFixed(1);
        }
        renderLinearEq();
    } else if (state.activeTab === "system-eq") {
        if (pointId === "A1") {
            state.system.b1 = Math.max(-6, Math.min(6, my));
            sliderSysB1.value = Math.round(state.system.b1 * 10);
            valSysB1.textContent = state.system.b1.toFixed(1);
        } else if (pointId === "B1") {
            const b1 = state.system.b1;
            const targetY = Math.max(-8, Math.min(8, my));
            state.system.k1 = (targetY - b1) / 3;
            sliderSysK1.value = Math.round(state.system.k1 * 10);
            valSysK1.textContent = state.system.k1.toFixed(1);
        } else if (pointId === "A2") {
            state.system.b2 = Math.max(-6, Math.min(6, my));
            sliderSysB2.value = Math.round(state.system.b2 * 10);
            valSysB2.textContent = state.system.b2.toFixed(1);
        } else if (pointId === "B2") {
            const b2 = state.system.b2;
            const targetY = Math.max(-8, Math.min(8, my));
            // y_B2 = -3k2 + b2 => k2 = (b2 - y_B2) / 3
            state.system.k2 = (b2 - targetY) / 3;
            sliderSysK2.value = Math.round(state.system.k2 * 10);
            valSysK2.textContent = state.system.k2.toFixed(1);
        }
        renderSystemEq();
    }
}

// --- 各关卡渲染与逻辑 ---

// === 关卡 1：一次函数与一元一次方程 ===
function renderLinearEq() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";

    const k = state.linear.k;
    const b = state.linear.b;

    // 1. 绘制直线 y = kx + b
    drawLineByEquation(k, b, "geo-curve line-1");

    // 2. 绘制控制点 A (0, b) 和 B (3, 3k + b)
    const interceptLabelPos = Math.abs(b) < 0.8 ? "top" : "left";
    drawPoint(0, b, "A (截距)", interceptLabelPos, "draggable", "A");
    drawPoint(3, 3 * k + b, "B (斜率控制)", "right", "draggable", "B");

    // 3. 求解与 X 轴交点
    let funcText = `y = ${k.toFixed(1)}x ${b >= 0 ? '+' : ''}${b.toFixed(1)}`;
    let eqText = `${k.toFixed(1)}x ${b >= 0 ? '+' : ''}${b.toFixed(1)} = 0`;
    
    document.getElementById("monitor-linear-func").textContent = funcText;
    document.getElementById("monitor-linear-eq").textContent = eqText;

    if (Math.abs(k) < 0.01) {
        // 平行于 X 轴
        if (Math.abs(b) < 0.01) {
            document.getElementById("monitor-linear-intersection").textContent = "重合 (无穷交点)";
            document.getElementById("monitor-linear-root").textContent = "无数解";
        } else {
            document.getElementById("monitor-linear-intersection").textContent = "无交点";
            document.getElementById("monitor-linear-root").textContent = "无解";
        }
    } else {
        const rootX = -b / k;
        document.getElementById("monitor-linear-intersection").textContent = `(${rootX.toFixed(2)}, 0.00)`;
        document.getElementById("monitor-linear-root").textContent = `x = ${rootX.toFixed(2)}`;

        // 绘制交点标示球及虚线投影
        drawPoint(rootX, 0, "交点", Math.abs(rootX) < 1.2 ? "bottom-far" : "bottom", "intersection");
        drawDottedIndicator({ x: rootX, y: 0 }, { x: rootX, y: 2 }); // 画一小段垂直指引线
    }

    pruneUnusedPoints();
    updateLinearHUD();
}

function updateLinearHUD() {
    const k = state.linear.k;
    const b = state.linear.b;
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>第一步：从“形”上看</b><br>
            直线 <b>y = ${k.toFixed(1)}x ${b >= 0 ? '+' : ''}${b.toFixed(1)}</b> 的图像与 X 轴交点的纵坐标恒为 y = 0。
        </div>
    `;

    if (Math.abs(k) < 0.01) {
        if (Math.abs(b) < 0.01) {
            stepHtml += `
                <div class="proof-step-card warning">
                    <b>特例：直线与 X 轴重合</b><br>
                    此时斜率 k = 0 且 b = 0。直线本身就是 X 轴，交点有无数个，方程 0x = 0 有无数个实数解！
                </div>
            `;
        } else {
            stepHtml += `
                <div class="proof-step-card warning">
                    <b>特例：直线平行于 X 轴</b><br>
                    此时斜率 k = 0 且 b = ${b.toFixed(1)}。直线永远不与 X 轴相交，方程 0x = ${-b.toFixed(1)} 无实数解！
                </div>
            `;
        }
    } else {
        const x0 = -b / k;
        stepHtml += `
            <div class="proof-step-card success">
                <b>第二步：从“数”上求</b><br>
                令函数值 y = 0，得到对应方程：<br>
                <b>${k.toFixed(1)}x ${b >= 0 ? '+' : ''}${b.toFixed(1)} = 0</b>。<br>
                解得该方程的根为：<b>x = ${x0.toFixed(2)}</b>。
            </div>
            <div class="proof-step-card success" style="border-left-color: var(--color-green)">
                <b>结论结合：</b><br>
                函数图像与 X 轴交点坐标为 <b>(${x0.toFixed(2)}, 0)</b>，其横坐标恰好是对应方程的<b>实数根</b>！
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 关卡 2：一次函数与二元一次方程组 ===
function renderSystemEq() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";

    const k1 = state.system.k1;
    const b1 = state.system.b1;
    const k2 = state.system.k2;
    const b2 = state.system.b2;

    // 1. 绘制两条直线
    drawLineByEquation(k1, b1, "geo-curve line-1");
    drawLineByEquation(k2, b2, "geo-curve line-2");

    // 2. 绘制直线 1 的控制点
    drawPoint(0, b1, "A1 (截距)", "left", "draggable", "A1");
    drawPoint(3, 3 * k1 + b1, "B1 (斜率)", "right", "draggable", "B1");

    // 3. 绘制直线 2 的控制点
    drawPoint(0, b2, "A2 (截距)", "left", "draggable", "A2");
    drawPoint(-3, -3 * k2 + b2, "B2 (斜率)", "left", "draggable", "B2");

    // 4. 解算方程组交点
    const denom = k1 - k2;
    if (Math.abs(denom) < 0.01) {
        // 斜率相同，平行或重合
        if (Math.abs(b1 - b2) < 0.01) {
            document.getElementById("monitor-sys-intersection").textContent = "两线重合";
            document.getElementById("monitor-sys-status").textContent = "无数个解";
            document.getElementById("monitor-sys-solution").innerHTML = "重合 ⟹ 无数解";
        } else {
            document.getElementById("monitor-sys-intersection").textContent = "无交点 (平行)";
            document.getElementById("monitor-sys-status").textContent = "无解";
            document.getElementById("monitor-sys-solution").innerHTML = "平行 ⟹ 方程组无解";
        }
    } else {
        const xPt = (b2 - b1) / denom;
        const yPt = k1 * xPt + b1;

        document.getElementById("monitor-sys-intersection").textContent = `(${xPt.toFixed(2)}, ${yPt.toFixed(2)})`;
        document.getElementById("monitor-sys-status").textContent = "唯一解";
        document.getElementById("monitor-sys-solution").textContent = `x = ${xPt.toFixed(2)}, y = ${yPt.toFixed(2)}`;

        // 绘制交点标示球及虚线投影到 X 轴与 Y 轴
        drawPoint(xPt, yPt, "P (交点)", "top", "intersection");
        drawDottedIndicator({ x: xPt, y: yPt }, { x: xPt, y: 0 }); // X 轴投影
        drawDottedIndicator({ x: xPt, y: yPt }, { x: 0, y: yPt }); // Y 轴投影
    }

    pruneUnusedPoints();
    updateSystemHUD();
}

function updateSystemHUD() {
    const k1 = state.system.k1;
    const b1 = state.system.b1;
    const k2 = state.system.k2;
    const b2 = state.system.b2;
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>第一步：函数解析式联立</b><br>
            直线 L₁: y = ${k1.toFixed(1)}x ${b1 >= 0 ? '+' : ''}${b1.toFixed(1)}<br>
            直线 L₂: y = ${k2.toFixed(1)}x ${b2 >= 0 ? '+' : ''}${b2.toFixed(1)}<br>
            寻找两直线交点，即意味着寻找一个同时满足这两条直线的坐标点 (x, y)。
        </div>
    `;

    const denom = k1 - k2;
    if (Math.abs(denom) < 0.01) {
        if (Math.abs(b1 - b2) < 0.01) {
            stepHtml += `
                <div class="proof-step-card warning">
                    <b>第二步：重合特例解析</b><br>
                    两直线斜率和截距全部相等。图像无限重合，拥有无数个交点，方程组有**无数个解**！
                </div>
            `;
        } else {
            stepHtml += `
                <div class="proof-step-card warning">
                    <b>第二步：平行特例解析</b><br>
                    两直线斜率相等但截距不等。在空间中平行，没有交点，方程组**无解**！
                </div>
            `;
        }
    } else {
        const xPt = (b2 - b1) / denom;
        const yPt = k1 * xPt + b1;
        stepHtml += `
            <div class="proof-step-card success">
                <b>第二步：求解联立方程组</b><br>
                令 y 值相等：${k1.toFixed(1)}x ${b1 >= 0 ? '+' : ''}${b1.toFixed(1)} = ${k2.toFixed(1)}x ${b2 >= 0 ? '+' : ''}${b2.toFixed(1)}，<br>
                解得：<b>x = ${xPt.toFixed(2)}</b>，带入求得 <b>y = ${yPt.toFixed(2)}</b>。
            </div>
            <div class="proof-step-card success" style="border-left-color: var(--color-green)">
                <b>第三步：交点坐标与方程组解的统一</b><br>
                方程组的唯一解 x = ${xPt.toFixed(2)}, y = ${yPt.toFixed(2)} 恰好就是两直线的几何交点坐标 <b>P(${xPt.toFixed(2)}, ${yPt.toFixed(2)})</b>！
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 关卡 3：二次函数与一元二次方程 ===
function renderQuadraticEq() {
    renderedPoints.clear();
    drawLayerCurves.innerHTML = "";
    drawLayerMarkers.innerHTML = "";

    const a = state.quadratic.a;
    const b = state.quadratic.b;
    const c = state.quadratic.c;

    // 1. 绘制抛物线 (x 范围从 -15 到 15，步长 0.1)
    let pathD = "";
    for (let x = -15; x <= 15; x += 0.1) {
        const y = a * x * x + b * x + c;
        const pt = toSvgCoords(x, y);
        
        // 限制在视口内绘制，超出太多会被浏览器裁切
        if (pt.y >= -100 && pt.y <= 440) {
            if (pathD === "") {
                pathD = `M ${pt.x} ${pt.y}`;
            } else {
                pathD += ` L ${pt.x} ${pt.y}`;
            }
        }
    }
    const parabolaPath = createSVGNode("path", {
        d: pathD,
        class: "geo-curve parabola"
    });
    drawLayerCurves.appendChild(parabolaPath);

    // 2. 解算判别式与交点
    const delta = b * b - 4 * a * c;
    document.getElementById("monitor-quad-func").textContent = `y = ${a.toFixed(2)}x² ${b >= 0 ? '+' : ''}${b.toFixed(1)}x ${c >= 0 ? '+' : ''}${c.toFixed(1)}`;
    document.getElementById("monitor-quad-delta").textContent = delta.toFixed(2);

    if (delta > 0.001) {
        // 两个交点
        const root1 = (-b - Math.sqrt(delta)) / (2 * a);
        const root2 = (-b + Math.sqrt(delta)) / (2 * a);
        
        document.getElementById("monitor-quad-count").textContent = "2 个";
        document.getElementById("monitor-quad-roots").textContent = `x1 = ${root1.toFixed(2)}, x2 = ${root2.toFixed(2)}`;
        
        drawPoint(root1, 0, "x1", Math.abs(root1) < 1.2 ? "bottom-far" : "bottom", "intersection");
        drawPoint(root2, 0, "x2", Math.abs(root2) < 1.2 ? "bottom-far" : "bottom", "intersection");
        drawDottedIndicator({ x: root1, y: 0 }, { x: root1, y: 2 });
        drawDottedIndicator({ x: root2, y: 0 }, { x: root2, y: 2 });
    } else if (Math.abs(delta) <= 0.001) {
        // 一个切点
        const root0 = -b / (2 * a);
        document.getElementById("monitor-quad-count").textContent = "1 个 (相切)";
        document.getElementById("monitor-quad-roots").textContent = `x1 = x2 = ${root0.toFixed(2)}`;
        
        drawPoint(root0, 0, "重根 x₀", Math.abs(root0) < 1.2 ? "bottom-far" : "bottom", "intersection");
        drawDottedIndicator({ x: root0, y: 0 }, { x: root0, y: 2 });
    } else {
        // 无实根
        document.getElementById("monitor-quad-count").textContent = "0 个";
        document.getElementById("monitor-quad-roots").textContent = "无实根";
    }

    pruneUnusedPoints();
    updateQuadraticHUD();
}

function updateQuadraticHUD() {
    const a = state.quadratic.a;
    const b = state.quadratic.b;
    const c = state.quadratic.c;
    const delta = b * b - 4 * a * c;
    let stepHtml = "";

    stepHtml += `
        <div class="proof-step-card">
            <b>第一步：建立二次函数与方程的关系</b><br>
            二次函数 y = ${a.toFixed(2)}x² ${b >= 0 ? '+' : ''}${b.toFixed(1)}x ${c >= 0 ? '+' : ''}${c.toFixed(1)} 与 X 轴交点即 y = 0 的位置。<br>
            这等价于求解方程：<br>
            <b>${a.toFixed(2)}x² ${b >= 0 ? '+' : ''}${b.toFixed(1)}x ${c >= 0 ? '+' : ''}${c.toFixed(1)} = 0</b>。
        </div>
    `;

    if (delta > 0.001) {
        const r1 = (-b - Math.sqrt(delta)) / (2 * a);
        const r2 = (-b + Math.sqrt(delta)) / (2 * a);
        stepHtml += `
            <div class="proof-step-card success">
                <b>第二步：判别式 Δ > 0 (Δ = ${delta.toFixed(2)})</b><br>
                由于判别式 b² - 4ac > 0，方程有**两个不等的实数根**：<br>
                x = (-b ± √Δ) / 2a = ${r1.toFixed(2)} 和 ${r2.toFixed(2)}。<br>
                几何上，抛物线与 X 轴相交于 <b>2 个不同交点</b>。
            </div>
        `;
    } else if (Math.abs(delta) <= 0.001) {
        stepHtml += `
            <div class="proof-step-card success" style="border-left-color: var(--color-orange)">
                <b>第二步：判别式 Δ = 0 (Δ = 0.00)</b><br>
                由于判别式 b² - 4ac = 0，方程有**两个相等的实数根** (重根)：<br>
                x₁ = x₂ = ${(-b / (2 * a)).toFixed(2)}。<br>
                几何上，抛物线顶点紧贴 X 轴，有 <b>1 个相切交点</b>。
            </div>
        `;
    } else {
        stepHtml += `
            <div class="proof-step-card warning">
                <b>第二步：判别式 Δ < 0 (Δ = ${delta.toFixed(2)})</b><br>
                由于判别式 b² - 4ac < 0，方程在实数范围内**没有实数根**。<br>
                几何上，抛物线完全悬空，与 X 轴有 <b>0 个交点</b>。
            </div>
        `;
    }

    hudContent.innerHTML = stepHtml;
}

// === 关卡切换控制器 ===
function switchTab(tabId) {
    state.activeTab = tabId;

    tabBtns.forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    ctrlGroups.forEach(group => {
        group.classList.toggle("active", group.id === `ctrl-${tabId}`);
    });

    drawLayerCurves.innerHTML = "";
    drawLayerPoints.innerHTML = "";
    drawLayerMarkers.innerHTML = "";

    // 切换 Tab 时重制网格轴
    drawCoordinateSystem();

    if (tabId === "linear-eq") {
        whiteboardTitleText.textContent = "一次函数与一元一次方程";
        controlCardTitle.textContent = "一次函数控制台";
        hintTitle.textContent = "一元一次方程交点秘籍";
        hintContent.innerHTML = `
            <h3>一次函数与一元一次方程</h3>
            <ul>
                <li><b>函数交点</b>：直线 $y = kx + b$ 与 $X$ 轴的交点是 $(x_0, 0)$。</li>
                <li><b>方程实根</b>：将 $y = 0$ 得到一元一次方程 $kx + b = 0$。</li>
                <li><b>数形结合</b>：交点的横坐标 $x_0$ 也就是方程的解。可以用鼠标拖动直线中的端点直接体验。</li>
            </ul>
        `;
        renderLinearEq();
    } else if (tabId === "system-eq") {
        whiteboardTitleText.textContent = "二元一次方程组与交点";
        controlCardTitle.textContent = "方程组联立控制台";
        hintTitle.textContent = "方程组交点法则";
        hintContent.innerHTML = `
            <h3>直线交点与二元一次方程组</h3>
            <ul>
                <li><b>几何交点</b>：两直线的交点 $P(x_0, y_0)$ 同时满足两条直线的关系。</li>
                <li><b>方程组解</b>：两函数联立构成的方程组的解就是交点坐标。</li>
                <li><b>无解与平行</b>：当两直线平行（斜率相等）时，无交点 ⟹ 方程组无解。可以直接拖动两条直线验证平行！</li>
            </ul>
        `;
        renderSystemEq();
    } else if (tabId === "quadratic-eq") {
        whiteboardTitleText.textContent = "二次函数与一元二次方程";
        controlCardTitle.textContent = "二次函数控制台";
        hintTitle.textContent = "根的判别式法门";
        hintContent.innerHTML = `
            <h3>根的判别式与交点数</h3>
            <ul>
                <li><b>交点个数与Δ</b>：
                    <ul>
                        <li><b>Δ > 0</b>：2 个交点 ⟹ 2 个不等实数根。</li>
                        <li><b>Δ = 0</b>：1 个切点 ⟹ 2 个相等实数根（重根）。</li>
                        <li><b>Δ < 0</b>：0 个交点 ⟹ 无实数根。</li>
                    </ul>
                </li>
                <li><b>动态升降演示</b>：点击“自动垂直升降演示”，让抛物线做平滑的正弦波上下滑动，直观看到 Δ 从正到零再到负的连续转变。</li>
            </ul>
        `;
        renderQuadraticEq();
    }
}

// --- 二次函数自动垂直升降动画逻辑 ---
let autoAnimId = null;
let animStartTime = 0;
function toggleQuadAutoPlay() {
    if (state.quadratic.isAutoPlaying) {
        // 停止
        state.quadratic.isAutoPlaying = false;
        btnQuadAuto.innerHTML = `<i class="fa-solid fa-play"></i> 自动垂直升降演示`;
        btnQuadAuto.classList.remove("primary");
        if (autoAnimId) cancelAnimationFrame(autoAnimId);
    } else {
        // 播放
        state.quadratic.isAutoPlaying = true;
        btnQuadAuto.innerHTML = `<i class="fa-solid fa-pause"></i> 停止升降`;
        btnQuadAuto.classList.add("primary");
        playSynthSound(600, 0.15);
        animStartTime = performance.now();
        
        const initialC = state.quadratic.c;
        
        function step(timestamp) {
            if (!state.quadratic.isAutoPlaying) return;
            const elapsed = timestamp - animStartTime;
            
            // 使用正弦波函数控制 c 的升降波动，范围在 -4.5 到 2.5
            state.quadratic.c = -1.0 + 3.5 * Math.sin(elapsed / 1000);
            
            sliderQuadC.value = Math.round(state.quadratic.c * 10);
            valQuadC.textContent = state.quadratic.c.toFixed(1);
            
            renderQuadraticEq();
            autoAnimId = requestAnimationFrame(step);
        }
        autoAnimId = requestAnimationFrame(step);
    }
}

// --- 事件监听绑定 ---
function initEventBindings() {
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (state.quadratic.isAutoPlaying) toggleQuadAutoPlay(); // 切换 Tab 时自动停止动画
            playSynthSound(500, 0.05);
            switchTab(btn.getAttribute("data-tab"));
        });
    });

    // ==========================================
    // 关卡 1 事件
    // ==========================================
    sliderLinearK.addEventListener("input", () => {
        state.linear.k = parseInt(sliderLinearK.value) / 10;
        valLinearK.textContent = state.linear.k.toFixed(1);
        renderLinearEq();
    });

    sliderLinearB.addEventListener("input", () => {
        state.linear.b = parseInt(sliderLinearB.value) / 10;
        valLinearB.textContent = state.linear.b.toFixed(1);
        renderLinearEq();
    });

    btnLinearReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        state.linear.k = 1.0;
        state.linear.b = 0.0;
        sliderLinearK.value = 10;
        valLinearK.textContent = "1.0";
        sliderLinearB.value = 0;
        valLinearB.textContent = "0.0";
        renderLinearEq();
    });

    // ==========================================
    // 关卡 2 事件
    // ==========================================
    sliderSysK1.addEventListener("input", () => {
        state.system.k1 = parseInt(sliderSysK1.value) / 10;
        valSysK1.textContent = state.system.k1.toFixed(1);
        renderSystemEq();
    });
    sliderSysB1.addEventListener("input", () => {
        state.system.b1 = parseInt(sliderSysB1.value) / 10;
        valSysB1.textContent = state.system.b1.toFixed(1);
        renderSystemEq();
    });
    sliderSysK2.addEventListener("input", () => {
        state.system.k2 = parseInt(sliderSysK2.value) / 10;
        valSysK2.textContent = state.system.k2.toFixed(1);
        renderSystemEq();
    });
    sliderSysB2.addEventListener("input", () => {
        state.system.b2 = parseInt(sliderSysB2.value) / 10;
        valSysB2.textContent = state.system.b2.toFixed(1);
        renderSystemEq();
    });

    btnSysReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        state.system.k1 = 1.0;
        state.system.b1 = 2.0;
        state.system.k2 = -1.0;
        state.system.b2 = -2.0;
        
        sliderSysK1.value = 10;
        sliderSysB1.value = 20;
        sliderSysK2.value = -10;
        sliderSysB2.value = -20;
        
        valSysK1.textContent = "1.0";
        valSysB1.textContent = "2.0";
        valSysK2.textContent = "-1.0";
        valSysB2.textContent = "-2.0";
        
        renderSystemEq();
    });

    // ==========================================
    // 关卡 3 事件
    // ==========================================
    sliderQuadA.addEventListener("input", () => {
        state.quadratic.a = parseInt(sliderQuadA.value) / 10;
        if (Math.abs(state.quadratic.a) < 0.01) {
            state.quadratic.a = 0.1; // 避免 a = 0 退化为一次函数
        }
        valQuadA.textContent = state.quadratic.a.toFixed(1);
        renderQuadraticEq();
    });
    sliderQuadB.addEventListener("input", () => {
        state.quadratic.b = parseInt(sliderQuadB.value) / 10;
        valQuadB.textContent = state.quadratic.b.toFixed(1);
        renderQuadraticEq();
    });
    sliderQuadC.addEventListener("input", () => {
        state.quadratic.c = parseInt(sliderQuadC.value) / 10;
        valQuadC.textContent = state.quadratic.c.toFixed(1);
        renderQuadraticEq();
    });

    btnQuadAuto.addEventListener("click", toggleQuadAutoPlay);

    btnQuadReset.addEventListener("click", () => {
        playSynthSound(350, 0.08);
        if (state.quadratic.isAutoPlaying) toggleQuadAutoPlay();
        state.quadratic.a = 0.5;
        state.quadratic.b = 0.0;
        state.quadratic.c = -2.0;
        
        sliderQuadA.value = 5;
        sliderQuadB.value = 0;
        sliderQuadC.value = -20;
        
        valQuadA.textContent = "0.5";
        valQuadB.textContent = "0.0";
        valQuadC.textContent = "-2.0";
        
        renderQuadraticEq();
    });
}

// --- 教师优先课堂演示、学生任务与触屏视图增强 ---
const geometrySvg = document.getElementById("geometry-svg");
const geometryView = document.getElementById("geometry-view");
const drawLayerHistory = document.getElementById("draw-layer-history");
const hudTitleText = document.getElementById("hud-title-text");
const lessonPrompt = document.getElementById("lesson-prompt");
const presetGrid = document.getElementById("preset-grid");
const viewZoomValue = document.getElementById("view-zoom-value");
const studentTaskSection = document.getElementById("student-task-section");
const studentTaskText = document.getElementById("student-task-text");
const studentTaskStatus = document.getElementById("student-task-status");
const btnStudentTask = document.getElementById("btn-student-task");
const btnNextTask = document.getElementById("btn-next-task");

state.teacher = {
    phase: "question",
    revealAnswers: false,
    showGrid: true,
    showPoints: true,
    showProjections: true,
    focusIntersection: false,
    comparisonSaved: false,
    task: {
        active: false,
        success: false,
        indexByTab: {
            "linear-eq": 0,
            "system-eq": 0,
            "quadratic-eq": 0
        }
    }
};

const TOPIC_META = {
    "linear-eq": {
        hudTitle: "一次函数：交点与根",
        prompts: {
            question: "观察直线与 X 轴的交点，思考交点横坐标与方程的关系。",
            observe: "拖动截距点或斜率控制点，观察交点怎样沿 X 轴移动。",
            result: "对照交点横坐标和方程的根，检查两个数是否相同。",
            conclusion: "函数图像与 X 轴交点的横坐标，就是对应方程的实数根。"
        }
    },
    "system-eq": {
        hudTitle: "方程组：交点与解",
        prompts: {
            question: "两条直线有几个公共点，方程组就有几个解吗？",
            observe: "分别拖动两条直线，观察相交、平行和重合三种状态。",
            result: "对照交点坐标和联立方程组的解。",
            conclusion: "两直线交点坐标就是方程组的解；平行无解，重合有无数解。"
        }
    },
    "quadratic-eq": {
        hudTitle: "二次函数：交点数与判别式",
        prompts: {
            question: "只看抛物线与 X 轴的位置，能判断方程有几个实根吗？",
            observe: "调节 a、b、c，观察两个交点如何合并并最终消失。",
            result: "对照 X 轴交点个数、判别式符号和实根个数。",
            conclusion: "Δ>0 有两个实根，Δ=0 有重根，Δ<0 没有实根。"
        }
    }
};

const TOPIC_PRESETS = {
    "linear-eq": [
        { label: "一个实根", values: { k: 1, b: -2 } },
        { label: "无解", values: { k: 0, b: 2 } },
        { label: "无数解", values: { k: 0, b: 0 } },
        { label: "正比例函数", values: { k: 1.5, b: 0 } }
    ],
    "system-eq": [
        { label: "唯一解", values: { k1: 1, b1: 1, k2: -1, b2: 3 } },
        { label: "平行无解", values: { k1: 1, b1: 2, k2: 1, b2: -2 } },
        { label: "重合无数解", values: { k1: 1, b1: 1, k2: 1, b2: 1 } },
        { label: "整数交点", values: { k1: 1, b1: 1, k2: -1, b2: 3 } }
    ],
    "quadratic-eq": [
        { label: "两个实根", values: { a: 0.5, b: 0, c: -2 } },
        { label: "一个重根", values: { a: 0.5, b: 0, c: 0 } },
        { label: "没有实根", values: { a: 0.5, b: 0, c: 2 } },
        { label: "顶点在 X 轴", values: { a: 1, b: -2, c: 1 } }
    ]
};

const STUDENT_TASKS = {
    "linear-eq": [
        { text: "调节参数，使一次函数的方程根为 x = 2。", check: () => Math.abs(state.linear.k) > 0.05 && Math.abs((-state.linear.b / state.linear.k) - 2) < 0.08 },
        { text: "调节参数，使方程在实数范围内无解。", check: () => Math.abs(state.linear.k) < 0.05 && Math.abs(state.linear.b) > 0.05 },
        { text: "调节参数，使一次函数的方程根为 x = -3。", check: () => Math.abs(state.linear.k) > 0.05 && Math.abs((-state.linear.b / state.linear.k) + 3) < 0.08 }
    ],
    "system-eq": [
        { text: "调节两条直线，使方程组无解。", check: () => Math.abs(state.system.k1 - state.system.k2) < 0.05 && Math.abs(state.system.b1 - state.system.b2) > 0.05 },
        { text: "调节两条直线，使方程组有无数个解。", check: () => Math.abs(state.system.k1 - state.system.k2) < 0.05 && Math.abs(state.system.b1 - state.system.b2) < 0.05 },
        { text: "调节两条直线，使交点为 P(1,2)。", check: () => {
            const d = state.system.k1 - state.system.k2;
            if (Math.abs(d) < 0.05) return false;
            const x = (state.system.b2 - state.system.b1) / d;
            const y = state.system.k1 * x + state.system.b1;
            return Math.abs(x - 1) < 0.08 && Math.abs(y - 2) < 0.08;
        } }
    ],
    "quadratic-eq": [
        { text: "调节抛物线，使它与 X 轴恰好相切。", check: () => Math.abs(state.quadratic.b ** 2 - 4 * state.quadratic.a * state.quadratic.c) < 0.08 },
        { text: "调节抛物线，使方程有两个不等实根。", check: () => state.quadratic.b ** 2 - 4 * state.quadratic.a * state.quadratic.c > 0.2 },
        { text: "调节抛物线，使方程没有实数根。", check: () => state.quadratic.b ** 2 - 4 * state.quadratic.a * state.quadratic.c < -0.2 }
    ]
};

const teachingView = { scale: 1, x: 0, y: 0 };
const activeViewPointers = new Map();
let pinchSnapshot = null;
let singlePanSnapshot = null;
const fullFrameGridHost = geometrySvg.closest(".math-source-scene-jm_topic_m09");
let fullFrameGridResizeObserver = null;

function syncFullFrameGrid() {
    if (!fullFrameGridHost) return;
    const rect = geometrySvg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const svgScale = Math.min(rect.width / 600, rect.height / 340);
    const gridStep = scaleUnit * teachingView.scale * svgScale;
    const gridOffsetX = (teachingView.x + originX * (teachingView.scale - 1)) * svgScale;
    const gridOffsetY = (teachingView.y + originY * (teachingView.scale - 1)) * svgScale;

    fullFrameGridHost.style.setProperty("--full-frame-grid-step", `${gridStep.toFixed(2)}px`);
    fullFrameGridHost.style.setProperty("--full-frame-grid-offset-x", `${gridOffsetX.toFixed(2)}px`);
    fullFrameGridHost.style.setProperty("--full-frame-grid-offset-y", `${gridOffsetY.toFixed(2)}px`);
}

function shouldRevealAnswers() {
    if (state.teacher.task.active && !state.teacher.task.success) return false;
    return state.teacher.revealAnswers || state.teacher.phase === "result" || state.teacher.phase === "conclusion";
}

function hudCard(label, value, className = "") {
    return `<div class="hud-stage-card ${className}"><span class="hud-stage-label">${label}</span><span class="hud-stage-value">${value}</span></div>`;
}

function formatLinearRelationship(k, b, prefix = "") {
    const signedB = `${b >= 0 ? "+" : "−"} ${Math.abs(b).toFixed(1)}`;
    return `${prefix}y = ${k.toFixed(1)}x ${signedB}`;
}

function renderTeachingHud(data) {
    const meta = TOPIC_META[state.activeTab];
    hudTitleText.textContent = meta.hudTitle;

    if (state.teacher.task.active) {
        const task = getCurrentStudentTask();
        hudContent.innerHTML = hudCard("学生任务", task.text, "question") +
            hudCard("当前关系", data.expression) +
            hudCard("当前反馈", state.teacher.task.success ? "完成，图形与代数条件均已满足。" : "继续调节参数，并用图形特征检查结果。", state.teacher.task.success ? "result" : "");
        return;
    }

    const phase = state.teacher.phase;
    if (phase === "question") {
        hudContent.innerHTML = hudCard("课堂问题", meta.prompts.question, "question") + hudCard("当前关系", data.expression);
    } else if (phase === "observe") {
        hudContent.innerHTML = hudCard("当前关系", data.expression) + hudCard("观察", data.observation) + hudCard("操作提示", meta.prompts.observe);
    } else if (phase === "result") {
        hudContent.innerHTML = hudCard("当前关系", data.expression) + hudCard("图形", data.visualResult) + hudCard("代数", data.algebraResult, "result");
    } else {
        hudContent.innerHTML = hudCard("归纳结论", data.conclusion, "result") + hudCard("当前关系", data.expression) + hudCard("当前验证", data.visualResult);
    }
}

updateLinearHUD = function() {
    const { k, b } = state.linear;
    let visualResult;
    let algebraResult;
    if (Math.abs(k) < 0.01 && Math.abs(b) < 0.01) {
        visualResult = "直线与 X 轴重合，有无数个交点。";
        algebraResult = "0x = 0，有无数个实数解。";
    } else if (Math.abs(k) < 0.01) {
        visualResult = "直线与 X 轴平行，没有交点。";
        algebraResult = `0x ${b >= 0 ? "+" : ""}${b.toFixed(1)} = 0，无解。`;
    } else {
        const root = -b / k;
        visualResult = `直线与 X 轴交于 P(${root.toFixed(2)}, 0)。`;
        algebraResult = `${k.toFixed(1)}x ${b >= 0 ? "+" : ""}${b.toFixed(1)} = 0，x = ${root.toFixed(2)}。`;
    }
    const functionText = formatLinearRelationship(k, b, "函数 ");
    const equationText = `${k.toFixed(1)}x ${b >= 0 ? "+" : "−"} ${Math.abs(b).toFixed(1)} = 0`;
    renderTeachingHud({
        expression: `${functionText}；对应方程 ${equationText}`,
        observation: "拖动 A 改变截距，拖动 B 改变斜率；注意交点沿 X 轴移动。",
        visualResult,
        algebraResult,
        conclusion: "函数图像与 X 轴交点的横坐标，就是对应一元方程的实数根。"
    });
};

updateSystemHUD = function() {
    const { k1, b1, k2, b2 } = state.system;
    const d = k1 - k2;
    let visualResult;
    let algebraResult;
    if (Math.abs(d) < 0.01 && Math.abs(b1 - b2) < 0.01) {
        visualResult = "两条直线重合，有无数个公共点。";
        algebraResult = "两个方程等价，方程组有无数个解。";
    } else if (Math.abs(d) < 0.01) {
        visualResult = "两条直线平行，没有公共点。";
        algebraResult = "方程组无解。";
    } else {
        const x = (b2 - b1) / d;
        const y = k1 * x + b1;
        visualResult = `两直线交于 P(${x.toFixed(2)}, ${y.toFixed(2)})。`;
        algebraResult = `方程组唯一解为 x=${x.toFixed(2)}, y=${y.toFixed(2)}。`;
    }
    renderTeachingHud({
        expression: `${formatLinearRelationship(k1, b1, "L1：")}；<br>${formatLinearRelationship(k2, b2, "L2：")}`,
        observation: "分别拖动两条直线，比较它们相交、平行和重合时的公共点。",
        visualResult,
        algebraResult,
        conclusion: "两直线交点坐标就是方程组的解；平行无解，重合有无数解。"
    });
};

updateQuadraticHUD = function() {
    const { a, b, c } = state.quadratic;
    const delta = b * b - 4 * a * c;
    let visualResult;
    let algebraResult;
    if (delta > 0.001) {
        const r1 = (-b - Math.sqrt(delta)) / (2 * a);
        const r2 = (-b + Math.sqrt(delta)) / (2 * a);
        visualResult = `抛物线与 X 轴有两个交点：x=${r1.toFixed(2)}、${r2.toFixed(2)}。`;
        algebraResult = `Δ=${delta.toFixed(2)}>0，方程有两个不等实根。`;
    } else if (Math.abs(delta) <= 0.001) {
        const root = -b / (2 * a);
        visualResult = `抛物线与 X 轴相切于 x=${root.toFixed(2)}。`;
        algebraResult = "Δ=0，方程有两个相等实根。";
    } else {
        visualResult = "抛物线与 X 轴没有交点。";
        algebraResult = `Δ=${delta.toFixed(2)}<0，方程没有实数根。`;
    }
    renderTeachingHud({
        expression: `函数 y = ${a.toFixed(1)}x² ${b >= 0 ? "+" : "−"} ${Math.abs(b).toFixed(1)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c).toFixed(1)}；判别式 Δ = b² − 4ac`,
        observation: "调节 a、b、c，观察两个交点如何靠近、合并并消失。",
        visualResult,
        algebraResult,
        conclusion: "X 轴交点个数与实根个数一致，并由判别式 Δ 的符号决定。"
    });
};

function renderCurrentTopic() {
    if (state.activeTab === "linear-eq") renderLinearEq();
    else if (state.activeTab === "system-eq") renderSystemEq();
    else renderQuadraticEq();
}

function syncAllControls() {
    sliderLinearK.value = Math.round(state.linear.k * 10);
    sliderLinearB.value = Math.round(state.linear.b * 10);
    valLinearK.textContent = state.linear.k.toFixed(1);
    valLinearB.textContent = state.linear.b.toFixed(1);

    sliderSysK1.value = Math.round(state.system.k1 * 10);
    sliderSysB1.value = Math.round(state.system.b1 * 10);
    sliderSysK2.value = Math.round(state.system.k2 * 10);
    sliderSysB2.value = Math.round(state.system.b2 * 10);
    valSysK1.textContent = state.system.k1.toFixed(1);
    valSysB1.textContent = state.system.b1.toFixed(1);
    valSysK2.textContent = state.system.k2.toFixed(1);
    valSysB2.textContent = state.system.b2.toFixed(1);

    sliderQuadA.value = Math.round(state.quadratic.a * 10);
    sliderQuadB.value = Math.round(state.quadratic.b * 10);
    sliderQuadC.value = Math.round(state.quadratic.c * 10);
    valQuadA.textContent = state.quadratic.a.toFixed(1);
    valQuadB.textContent = state.quadratic.b.toFixed(1);
    valQuadC.textContent = state.quadratic.c.toFixed(1);
}

function renderPresetButtons() {
    presetGrid.innerHTML = "";
    TOPIC_PRESETS[state.activeTab].forEach((preset, index) => {
        const button = document.createElement("button");
        button.className = "preset-btn";
        button.type = "button";
        button.textContent = preset.label;
        button.addEventListener("click", () => applyPreset(index));
        presetGrid.appendChild(button);
    });
}

function applyPreset(index) {
    const preset = TOPIC_PRESETS[state.activeTab][index];
    Object.assign(state[state.activeTab === "linear-eq" ? "linear" : state.activeTab === "system-eq" ? "system" : "quadratic"], preset.values);
    state.teacher.phase = "observe";
    state.teacher.revealAnswers = false;
    state.teacher.task.active = false;
    hudPanel.classList.remove("collapsed");
    syncAllControls();
    renderCurrentTopic();
    playSynthSound(560, 0.06);
}

function setAnswerVisibility() {
    const answerIds = [
        "monitor-linear-intersection", "monitor-linear-root",
        "monitor-sys-intersection", "monitor-sys-status", "monitor-sys-solution",
        "monitor-quad-delta", "monitor-quad-count", "monitor-quad-roots"
    ];
    const reveal = shouldRevealAnswers();
    answerIds.forEach(id => {
        const node = document.getElementById(id);
        if (!node) return;
        if (reveal) {
            if (node.textContent !== "待揭示") node.dataset.actualText = node.textContent;
            else if (node.dataset.actualText) node.textContent = node.dataset.actualText;
            node.classList.remove("is-concealed");
        } else {
            if (node.textContent !== "待揭示") node.dataset.actualText = node.textContent;
            node.textContent = "待揭示";
            node.classList.add("is-concealed");
        }
    });
}

function updateTeacherControls() {
    document.querySelectorAll(".lesson-step-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.phase === state.teacher.phase);
    });
    const meta = TOPIC_META[state.activeTab];
    lessonPrompt.textContent = state.teacher.task.active ? getCurrentStudentTask().text : meta.prompts[state.teacher.phase];

    const answerButton = document.getElementById("btn-toggle-answers");
    answerButton.classList.toggle("active", shouldRevealAnswers());
    answerButton.setAttribute("aria-pressed", String(shouldRevealAnswers()));
    document.getElementById("btn-toggle-points").classList.toggle("active", state.teacher.showPoints);
    document.getElementById("btn-toggle-projections").classList.toggle("active", state.teacher.showProjections);
    document.getElementById("btn-focus-intersection").classList.toggle("active", state.teacher.focusIntersection);
    document.getElementById("btn-toggle-points").setAttribute("aria-pressed", String(state.teacher.showPoints));
    document.getElementById("btn-toggle-projections").setAttribute("aria-pressed", String(state.teacher.showProjections));
    document.getElementById("btn-focus-intersection").setAttribute("aria-pressed", String(state.teacher.focusIntersection));
}

function applyDisplayState() {
    geometrySvg.classList.toggle("hide-grid", !state.teacher.showGrid);
    geometrySvg.classList.toggle("hide-points", !state.teacher.showPoints);
    geometrySvg.classList.toggle("hide-projections", !state.teacher.showProjections);
    geometrySvg.classList.toggle("focus-intersection", state.teacher.focusIntersection || state.teacher.phase === "conclusion");
    geometrySvg.classList.toggle("conceal-intersections", state.teacher.phase === "question" && !state.teacher.task.active);
}

function rectsOverlap(a, b, gap = 4) {
    return !(a.x + a.width + gap < b.x || b.x + b.width + gap < a.x || a.y + a.height + gap < b.y || b.y + b.height + gap < a.y);
}

function resolvePointLabelCollisions() {
    const labels = Array.from(drawLayerPoints.querySelectorAll("text.geo-text"));
    const placed = [];
    labels.forEach(label => {
        let box;
        try { box = label.getBBox(); } catch { return; }
        for (let attempt = 0; attempt < 5 && placed.some(other => rectsOverlap(box, other)); attempt += 1) {
            const nextY = Math.min(326, parseFloat(label.getAttribute("y")) + 16);
            label.setAttribute("y", nextY);
            box = label.getBBox();
        }
        if (box.x < 8) label.setAttribute("x", parseFloat(label.getAttribute("x")) + (8 - box.x));
        if (box.x + box.width > 592) label.setAttribute("x", parseFloat(label.getAttribute("x")) - (box.x + box.width - 592));
        placed.push(label.getBBox());
    });
}

function getCurrentStudentTask() {
    const tasks = STUDENT_TASKS[state.activeTab];
    return tasks[state.teacher.task.indexByTab[state.activeTab] % tasks.length];
}

function updateStudentTaskStatus() {
    const task = getCurrentStudentTask();
    studentTaskText.textContent = task.text;
    studentTaskSection.classList.toggle("task-active", state.teacher.task.active);
    if (!state.teacher.task.active) {
        studentTaskSection.classList.remove("task-success");
        studentTaskStatus.textContent = "教师可发起任务，答案会自动隐藏。";
        btnStudentTask.textContent = "发起";
        return;
    }
    const success = task.check();
    state.teacher.task.success = success;
    studentTaskSection.classList.toggle("task-success", success);
    studentTaskStatus.textContent = success ? "任务完成：图形和代数条件均已满足。" : "任务进行中：继续调节并观察图形。";
    btnStudentTask.textContent = "结束";
}

function finalizeTeachingRender() {
    applyDisplayState();
    updateStudentTaskStatus();
    setAnswerVisibility();
    if (state.teacher.task.active) {
        if (state.activeTab === "linear-eq") updateLinearHUD();
        else if (state.activeTab === "system-eq") updateSystemHUD();
        else updateQuadraticHUD();
    }
    updateTeacherControls();
    refreshRangeProgress();
    requestAnimationFrame(resolvePointLabelCollisions);
}

const baseRenderLinearEq = renderLinearEq;
const baseRenderSystemEq = renderSystemEq;
const baseRenderQuadraticEq = renderQuadraticEq;
renderLinearEq = function() { baseRenderLinearEq(); finalizeTeachingRender(); };
renderSystemEq = function() { baseRenderSystemEq(); finalizeTeachingRender(); };
renderQuadraticEq = function() { baseRenderQuadraticEq(); finalizeTeachingRender(); };

const baseSwitchTab = switchTab;
switchTab = function(tabId) {
    clearComparisonState();
    resetTeachingView();
    state.teacher.task.active = false;
    state.teacher.task.success = false;
    state.teacher.phase = "question";
    state.teacher.revealAnswers = false;
    baseSwitchTab(tabId);
    renderPresetButtons();
    updateStudentTaskStatus();
    updateTeacherControls();
};

function clearComparisonState() {
    if (!drawLayerHistory) return;
    drawLayerHistory.replaceChildren();
    state.teacher.comparisonSaved = false;
}

function toggleComparisonState() {
    if (state.teacher.comparisonSaved) {
        clearComparisonState();
    } else {
        drawLayerHistory.replaceChildren();
        Array.from(drawLayerCurves.children).forEach(curve => {
            const clone = curve.cloneNode(true);
            clone.classList.add("comparison-curve");
            clone.querySelectorAll("*").forEach(node => node.classList.add("comparison-curve"));
            drawLayerHistory.appendChild(clone);
        });
        state.teacher.comparisonSaved = drawLayerHistory.childElementCount > 0;
    }
    updateTeacherControls();
}

function enhanceRangeControls() {
    document.querySelectorAll("input[type='range'].modern-slider").forEach(input => {
        if (input.parentElement?.classList.contains("range-control-row")) return;
        const row = document.createElement("div");
        row.className = "range-control-row";
        const minus = document.createElement("button");
        const plus = document.createElement("button");
        minus.type = plus.type = "button";
        minus.className = plus.className = "range-step-btn";
        minus.textContent = "−";
        plus.textContent = "+";
        minus.setAttribute("aria-label", "减小参数");
        plus.setAttribute("aria-label", "增大参数");
        input.setAttribute("aria-orientation", "horizontal");
        const label = input.closest(".slider-container")?.querySelector(".slider-label-row > span:first-child");
        const value = input.closest(".slider-container")?.querySelector(".slider-val");
        if (label && input.id) {
            label.id = `${input.id}-label`;
            input.setAttribute("aria-labelledby", label.id);
        }
        if (value) value.setAttribute("aria-live", "polite");
        input.parentNode.insertBefore(row, input);
        row.append(minus, input, plus);
        const nudge = direction => {
            const step = Number(input.step || 1);
            const next = Math.min(Number(input.max), Math.max(Number(input.min), Number(input.value) + direction * step));
            input.value = String(next);
            input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        minus.addEventListener("click", () => nudge(-1));
        plus.addEventListener("click", () => nudge(1));
        input.addEventListener("input", () => updateRangeProgress(input));
        updateRangeProgress(input);
    });
}

function updateRangeProgress(input) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value);
    const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty("--range-progress", `${Math.min(100, Math.max(0, progress)).toFixed(2)}%`);
    const visibleValue = input.closest(".slider-container")?.querySelector(".slider-val")?.textContent?.trim();
    if (visibleValue) input.setAttribute("aria-valuetext", visibleValue);
}

function refreshRangeProgress() {
    document.querySelectorAll("input[type='range'].modern-slider").forEach(updateRangeProgress);
}

function clampView() {
    teachingView.scale = Math.min(2.5, Math.max(0.75, teachingView.scale));
    const limitX = 600 * (teachingView.scale - 0.55);
    const limitY = 340 * (teachingView.scale - 0.55);
    teachingView.x = Math.min(limitX, Math.max(-limitX, teachingView.x));
    teachingView.y = Math.min(limitY, Math.max(-limitY, teachingView.y));
}

function applyViewTransform() {
    clampView();
    geometryView.setAttribute("transform", `translate(${teachingView.x.toFixed(2)} ${teachingView.y.toFixed(2)}) scale(${teachingView.scale.toFixed(3)})`);
    viewZoomValue.textContent = `${Math.round(teachingView.scale * 100)}%`;
    syncFullFrameGrid();
}

function getSvgPointFromClient(clientX, clientY) {
    const rect = geometrySvg.getBoundingClientRect();
    return {
        x: ((clientX - rect.left) / rect.width) * 600,
        y: ((clientY - rect.top) / rect.height) * 340
    };
}

function zoomViewAt(nextScale, center = { x: 300, y: 170 }) {
    const oldScale = teachingView.scale;
    const bounded = Math.min(2.5, Math.max(0.75, nextScale));
    const ratio = bounded / oldScale;
    teachingView.x = center.x - (center.x - teachingView.x) * ratio;
    teachingView.y = center.y - (center.y - teachingView.y) * ratio;
    teachingView.scale = bounded;
    applyViewTransform();
}

function resetTeachingView() {
    teachingView.scale = 1;
    teachingView.x = 0;
    teachingView.y = 0;
    applyViewTransform();
}

onDragMove = function(e) {
    if (!activeDragPoint) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const viewPoint = getSvgPointFromClient(clientX, clientY);
    const localX = (viewPoint.x - teachingView.x) / teachingView.scale;
    const localY = (viewPoint.y - teachingView.y) / teachingView.scale;
    const mathPt = toMathCoords(localX, localY);
    playModulatedDragSound(localX, localY);
    updatePointPosition(activeDragPoint, mathPt.x, mathPt.y);
};

function setupViewGestures() {
    geometrySvg.addEventListener("wheel", event => {
        event.preventDefault();
        const center = getSvgPointFromClient(event.clientX, event.clientY);
        zoomViewAt(teachingView.scale * (event.deltaY < 0 ? 1.1 : 0.9), center);
    }, { passive: false });

    geometrySvg.addEventListener("pointerdown", event => {
        if (event.target.closest(".draggable")) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        geometrySvg.setPointerCapture?.(event.pointerId);
        const point = getSvgPointFromClient(event.clientX, event.clientY);
        activeViewPointers.set(event.pointerId, point);
        if (activeViewPointers.size === 1) {
            singlePanSnapshot = {
                pointerId: event.pointerId,
                point,
                x: teachingView.x,
                y: teachingView.y
            };
            geometrySvg.classList.add("is-view-dragging");
        }
        if (activeViewPointers.size === 2) {
            const [a, b] = Array.from(activeViewPointers.values());
            singlePanSnapshot = null;
            pinchSnapshot = {
                distance: Math.hypot(a.x - b.x, a.y - b.y),
                center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
                scale: teachingView.scale,
                x: teachingView.x,
                y: teachingView.y
            };
        }
    });

    geometrySvg.addEventListener("pointermove", event => {
        if (!activeViewPointers.has(event.pointerId)) return;
        const point = getSvgPointFromClient(event.clientX, event.clientY);
        activeViewPointers.set(event.pointerId, point);
        if (activeViewPointers.size === 1 && singlePanSnapshot?.pointerId === event.pointerId) {
            event.preventDefault();
            teachingView.x = singlePanSnapshot.x + point.x - singlePanSnapshot.point.x;
            teachingView.y = singlePanSnapshot.y + point.y - singlePanSnapshot.point.y;
            applyViewTransform();
            return;
        }
        if (activeViewPointers.size !== 2 || !pinchSnapshot) return;
        event.preventDefault();
        const [a, b] = Array.from(activeViewPointers.values());
        const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const nextScale = Math.min(2.5, Math.max(0.75, pinchSnapshot.scale * distance / pinchSnapshot.distance));
        const ratio = nextScale / pinchSnapshot.scale;
        teachingView.scale = nextScale;
        teachingView.x = center.x - (pinchSnapshot.center.x - pinchSnapshot.x) * ratio;
        teachingView.y = center.y - (pinchSnapshot.center.y - pinchSnapshot.y) * ratio;
        applyViewTransform();
    }, { passive: false });

    const releasePointer = event => {
        activeViewPointers.delete(event.pointerId);
        pinchSnapshot = null;
        if (activeViewPointers.size === 1) {
            const [pointerId, point] = Array.from(activeViewPointers.entries())[0];
            singlePanSnapshot = {
                pointerId,
                point,
                x: teachingView.x,
                y: teachingView.y
            };
        } else {
            singlePanSnapshot = null;
            geometrySvg.classList.remove("is-view-dragging");
        }
    };
    geometrySvg.addEventListener("pointerup", releasePointer);
    geometrySvg.addEventListener("pointercancel", releasePointer);
    geometrySvg.addEventListener("lostpointercapture", releasePointer);
    geometrySvg.addEventListener("contextmenu", event => event.preventDefault());
}

function setupTeacherInteractions() {
    document.querySelectorAll(".lesson-step-btn").forEach(button => {
        button.addEventListener("click", () => {
            state.teacher.phase = button.dataset.phase;
            state.teacher.revealAnswers = state.teacher.phase === "result" || state.teacher.phase === "conclusion";
            state.teacher.task.active = false;
            hudPanel.classList.remove("collapsed");
            renderCurrentTopic();
        });
    });

    const bindToggle = (id, key) => {
        document.getElementById(id).addEventListener("click", () => {
            state.teacher[key] = !state.teacher[key];
            renderCurrentTopic();
        });
    };
    bindToggle("btn-toggle-points", "showPoints");
    bindToggle("btn-toggle-projections", "showProjections");
    bindToggle("btn-focus-intersection", "focusIntersection");

    document.getElementById("btn-toggle-answers").addEventListener("click", () => {
        state.teacher.revealAnswers = !state.teacher.revealAnswers;
        if (state.teacher.revealAnswers && state.teacher.phase === "question") state.teacher.phase = "result";
        renderCurrentTopic();
    });
    document.getElementById("btn-view-zoom-out").addEventListener("click", () => zoomViewAt(teachingView.scale - 0.15));
    document.getElementById("btn-view-zoom-in").addEventListener("click", () => zoomViewAt(teachingView.scale + 0.15));
    document.getElementById("btn-view-reset").addEventListener("click", resetTeachingView);

    btnStudentTask.addEventListener("click", () => {
        state.teacher.task.active = !state.teacher.task.active;
        state.teacher.task.success = false;
        state.teacher.phase = "observe";
        state.teacher.revealAnswers = false;
        if (!state.teacher.task.active) state.teacher.phase = "question";
        if (state.teacher.task.active) hudPanel.classList.remove("collapsed");
        renderCurrentTopic();
    });
    btnNextTask.addEventListener("click", () => {
        state.teacher.task.indexByTab[state.activeTab] += 1;
        state.teacher.task.success = false;
        renderCurrentTopic();
    });

    document.addEventListener("contextmenu", event => {
        if (event.target.closest(".control-panel, .geometry-svg-container")) event.preventDefault();
    });
    window.addEventListener("pointermove", event => {
        if (activeDragPoint && event.pointerType === "pen") onDragMove(event);
    });
    window.addEventListener("pointerup", event => {
        if (event.pointerType === "pen") onDragEnd();
    });
}

// --- 初始化入口 ---
function init() {
    enhanceRangeControls();
    initEventBindings();
    setupDragging();
    setupTeacherInteractions();
    setupViewGestures();
    if (typeof ResizeObserver === "function") {
        fullFrameGridResizeObserver = new ResizeObserver(syncFullFrameGrid);
        fullFrameGridResizeObserver.observe(geometrySvg);
    }
    resetTeachingView();
    switchTab("linear-eq");
}

document.addEventListener("DOMContentLoaded", init);

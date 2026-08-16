/**
 * 《圆的性质综合实验室》核心控制脚本 (app.js)
 * 功能：管理 垂径定理、圆周角定理、切线长定理 三个专题的几何模型计算、SVG 绘制、鼠标/触屏拖拽及双向点击高亮锁定
 */

// ==========================================================================
// 1. 初始化全局元素与状态
// ==========================================================================
const svg = document.getElementById("geometry-svg");
const gridLayer = document.getElementById("svg-grid-layer");
const drawingLayer = document.getElementById("geometry-drawing-layer");
const controlsLayer = document.getElementById("geometry-controls-layer");
const hudContent = document.getElementById("hud-content-body");
const liveStats = document.getElementById("live-stats-container");
const formulaBody = document.getElementById("formula-card-body");
const actionButtonsGrid = document.getElementById("action-buttons-grid");
const stepGuideIndicator = document.getElementById("step-guide-indicator");
const btnHudToggle = document.getElementById("btn-hud-toggle");
const hudCard = document.getElementById("analysis-hud-card");

let activeTab = "perpendicular-chord"; // "perpendicular-chord" | "inscribed-angle" | "tangent-properties"
let activeDragId = null;
let dragOffset = { x: 0, y: 0 };

// 教学优化与点击锁定状态变量
let hoveredElement = null; // 当前鼠标悬停的标签名
let lockedElement = null;  // 当前点击锁定的标签名

// 教学优化演示状态变量
let showPythSquares = false;
let isSweeping = false;
let sweepTimerId = null;
let isFolding = false;
let foldProgress = 0.0;
let foldTimerId = null;
let foldDirection = 1;

// 音频上下文
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 1.1 几何模型状态数据
const state = {
    // 垂径定理
    chord: {
        O: { x: 260, y: 210 },
        R: 120,
        D: { x: 260, y: 260 } // 弦心距足 D (可在 O.y + 10 到 O.y + R - 10 之间垂直移动)
    },
    // 圆周角定理
    inscribed: {
        O: { x: 260, y: 210 },
        R: 110,
        angleA: 210, // 弧起点 A 的角度 (度)
        angleB: 330, // 弧终点 B 的角度 (度)
        C: { x: 260, y: 100 } // 顶点 C 的坐标 (随拖动沿圆周运动)
    },
    // 切线长定理
    tangent: {
        O: { x: 200, y: 210 },
        R: 85,
        P: { x: 420, y: 210 } // 圆外一点 P (可自由拖拽，与 O 的距离须 > R + 25)
    }
};

// ==========================================================================
// 2. 辅助数学与几何计算函数
// ==========================================================================

// 计算两点距离
function getDistance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// 角度转弧度
function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

// 弧度转角度
function radToDeg(rad) {
    let deg = (rad * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
}

// 自适应直角符号方向算法 (避开三角形外侧)
function drawRightAngle(foot, basePt, perpSourcePt, targetLength = 7) {
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

// 绘制夹角自适应弧线 (圆心，起点端点，终点端点，半径) - 确保弧线一定在夹角内侧
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

// ==========================================================================
// 3. SVG 绘图辅助函数
// ==========================================================================
function drawGrid() {
    gridLayer.innerHTML = "";
    // 渲染点阵网格，干净高档
    gridLayer.appendChild(createSVGNode("rect", {
        width: "100%", height: "100%", fill: "url(#grid-dots)"
    }));
}

function createSVGNode(tag, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (let key in attrs) {
        node.setAttribute(key, attrs[key]);
    }
    return node;
}

// ==========================================================================
// 4. 三大专题核心渲染渲染函数
// ==========================================================================

// --------------------------------------------------------------------------
// 4.1 Tab 1: 垂径定理 (Perpendicular Chord)
// --------------------------------------------------------------------------
function renderPerpendicularChord() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.chord;
    const dDist = data.D.y - data.O.y; // 弦心距 d
    const halfChord = Math.sqrt(data.R * data.R - dDist * dDist);

    const A = { x: data.O.x - halfChord, y: data.D.y };
    const B = { x: data.O.x + halfChord, y: data.D.y };
    const E = { x: data.O.x, y: data.O.y + data.R }; // 圆心垂直交圆于点 E

    const cmRatio = 25;
    const cmR = data.R / cmRatio;
    const cmd = dDist / cmRatio;
    const cmAB = (halfChord * 2) / cmRatio;

    const activeHighlight = hoveredElement || lockedElement;
    const isRActive = activeHighlight === "r";
    const isDActive = activeHighlight === "d";
    const isChordActive = activeHighlight === "chord";

    // 4.1.1 绘制大圆轮廓
    drawingLayer.appendChild(createSVGNode("circle", {
        cx: data.O.x, cy: data.O.y, r: data.R,
        class: "geo-line", stroke: "#334155"
    }));

    // 4.1.2 绘制高亮辅助直角三角形 (Pulsing neon fill)
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.O.x},${data.O.y} ${data.D.x},${data.D.y} ${B.x},${B.y}`,
        fill: isRActive || isDActive || isChordActive ? "rgba(37, 99, 235, 0.05)" : "none",
        stroke: "none"
    }));

    // 4.1.2.1 绘制勾股三边正方形 (Pythagorean side squares)
    if (showPythSquares) {
        // 1. 弦心距 d 的正方形 (紫色)
        drawingLayer.appendChild(createSVGNode("polygon", {
            points: `${data.O.x},${data.O.y} ${data.D.x},${data.D.y} ${data.D.x - dDist},${data.D.y} ${data.O.x - dDist},${data.O.y}`,
            class: "pyth-square-d"
        }));
        const dSqArea = cmd * cmd;
        drawingLayer.appendChild(createSVGNode("text", {
            x: data.O.x - dDist / 2, y: (data.O.y + data.D.y) / 2 + 4,
            class: "geo-text purple", "font-size": "10px"
        })).textContent = `${dSqArea.toFixed(1)} cm²`;

        // 2. 半弦长 a/2 的正方形 (橙色)
        drawingLayer.appendChild(createSVGNode("polygon", {
            points: `${data.D.x},${data.D.y} ${B.x},${B.y} ${B.x},${data.D.y + halfChord} ${data.D.x},${data.D.y + halfChord}`,
            class: "pyth-square-chord"
        }));
        const chordSqArea = (cmAB/2) * (cmAB/2);
        drawingLayer.appendChild(createSVGNode("text", {
            x: (data.D.x + B.x) / 2, y: data.D.y + halfChord / 2 + 4,
            class: "geo-text orange", "font-size": "10px"
        })).textContent = `${chordSqArea.toFixed(1)} cm²`;

        // 3. 半径 R 的正方形 (蓝色)
        const p3 = { x: B.x + dDist, y: B.y - halfChord };
        const p4 = { x: data.O.x + dDist, y: data.O.y - halfChord };
        drawingLayer.appendChild(createSVGNode("polygon", {
            points: `${data.O.x},${data.O.y} ${B.x},${B.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`,
            class: "pyth-square-r"
        }));
        const rSqArea = cmR * cmR;
        drawingLayer.appendChild(createSVGNode("text", {
            x: (data.O.x + B.x + p3.x + p4.x) / 4, y: (data.O.y + B.y + p3.y + p4.y) / 4 + 4,
            class: "geo-text blue", "font-size": "10px"
        })).textContent = `${rSqArea.toFixed(1)} cm²`;
    }

    // 4.1.3 绘制弦 AB (带双向高亮)
    const chordLine = createSVGNode("line", {
        x1: A.x, y1: A.y, x2: B.x, y2: B.y,
        class: `geo-line orange ${isChordActive ? 'highlight-pulse' : ''}`
    });
    // 绑定图形联动
    bindShapeInteractions(chordLine, "chord");
    drawingLayer.appendChild(chordLine);

    // 4.1.4 绘制垂直高线 OD (弦心距)
    const distanceLine = createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: data.D.x, y2: data.D.y,
        class: `geo-line purple dashed ${isDActive ? 'highlight-pulse' : ''}`
    });
    bindShapeInteractions(distanceLine, "d");
    drawingLayer.appendChild(distanceLine);

    // 4.1.5 绘制高线延伸段 DE 交圆于 E
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.D.x, y1: data.D.y, x2: E.x, y2: E.y,
        class: "geo-line purple dashed", "stroke-width": 1.2
    }));

    // 4.1.6 绘制半径 OB (斜边)
    const radiusLine = createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: B.x, y2: B.y,
        class: `geo-line blue ${isRActive ? 'highlight-pulse' : ''}`
    });
    bindShapeInteractions(radiusLine, "r");
    drawingLayer.appendChild(radiusLine);

    // 4.1.7 自适应直角符号 (OD 垂直于 AB)
    drawingLayer.appendChild(createSVGNode("path", {
        d: drawRightAngle(data.D, B, data.O, 6),
        class: "right-angle-marker"
    }));

    // 4.1.8 标记线段上的平分双横线 (Show chord bisector ticks)
    const drawTick = (midX, midY) => {
        drawingLayer.appendChild(createSVGNode("line", {
            x1: midX - 3, y1: midY - 6, x2: midX + 3, y2: midY + 6,
            stroke: "var(--color-orange)", "stroke-width": 1.5
        }));
    };
    drawTick((A.x + data.D.x) / 2, A.y);
    drawTick((B.x + data.D.x) / 2, B.y);

    // 4.1.9 文字标记
    drawingLayer.appendChild(createSVGNode("text", { x: data.O.x, y: data.O.y - 12, class: "geo-text" })).textContent = "O";
    drawingLayer.appendChild(createSVGNode("text", { x: A.x - 12, y: A.y + 4, class: "geo-text" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: B.x + 12, y: B.y + 4, class: "geo-text" })).textContent = "B";
    drawingLayer.appendChild(createSVGNode("text", { x: data.D.x - 12, y: data.D.y - 6, class: "geo-text purple" })).textContent = "D";
    drawingLayer.appendChild(createSVGNode("text", { x: E.x, y: E.y + 15, class: "geo-text purple" })).textContent = "E";

    // 字母标注
    drawingLayer.appendChild(createSVGNode("text", { x: (data.O.x + B.x)/2 + 10, y: (data.O.y + B.y)/2 - 10, class: `geo-text blue ${isRActive ? 'geo-text-pulse' : ''}` })).textContent = "R";
    drawingLayer.appendChild(createSVGNode("text", { x: data.D.x - 12, y: (data.O.y + data.D.y)/2, class: `geo-text purple ${isDActive ? 'geo-text-pulse' : ''}` })).textContent = "d";
    drawingLayer.appendChild(createSVGNode("text", { x: (B.x + data.D.x)/2, y: B.y + 15, class: `geo-text orange ${isChordActive ? 'geo-text-pulse' : ''}` })).textContent = "a/2";

    // 4.1.10 绘制控制点 (点 D 可垂直滑动)
    const dragD = createSVGNode("g", { class: `drag-point ${activeDragId === "drag-D" ? "is-dragging" : ""}`, id: "drag-D" });
    dragD.appendChild(createSVGNode("circle", { cx: data.D.x, cy: data.D.y, r: 24, class: "drag-point-hit" }));
    dragD.appendChild(createSVGNode("circle", { cx: data.D.x, cy: data.D.y, r: 8, class: "drag-point-outer" }));
    dragD.appendChild(createSVGNode("circle", { cx: data.D.x, cy: data.D.y, r: 3.5, class: "drag-point-inner" }));
    controlsLayer.appendChild(dragD);

    renderChordStats(cmR, cmd, cmAB, activeHighlight);
    renderChordFormula();
    bindHoverTerms();
}

function renderChordStats(r, d, ab, activeHighlight) {
    const isRActive = activeHighlight === "r";
    const isDActive = activeHighlight === "d";
    const isChordActive = activeHighlight === "chord";

    liveStats.innerHTML = `
        <div class="stat-item interactive-shape" style="${isRActive ? 'border-color:var(--color-blue); background:rgba(59,130,246,0.02);' : ''}" onclick="event.stopPropagation(); lockedElement = (lockedElement === 'r') ? null : 'r'; playClickSound(); renderActiveTab();">
            <span class="stat-label">圆半径 R (OB)</span>
            <span class="stat-value" style="color:var(--color-blue);">${r.toFixed(2)} cm</span>
        </div>
        <div class="stat-item interactive-shape" style="${isDActive ? 'border-color:var(--color-purple); background:rgba(139,92,246,0.02);' : ''}" onclick="event.stopPropagation(); lockedElement = (lockedElement === 'd') ? null : 'd'; playClickSound(); renderActiveTab();">
            <span class="stat-label">弦心距 d (OD)</span>
            <span class="stat-value" style="color:var(--color-purple);">${d.toFixed(2)} cm</span>
        </div>
        <div class="stat-item interactive-shape" style="${isChordActive ? 'border-color:var(--color-orange); background:rgba(245,158,11,0.02);' : ''}" onclick="event.stopPropagation(); lockedElement = (lockedElement === 'chord') ? null : 'chord'; playClickSound(); renderActiveTab();">
            <span class="stat-label">半弦长 a/2 (BD)</span>
            <span class="stat-value" style="color:var(--color-orange);">${(ab/2).toFixed(2)} cm</span>
        </div>
        <div class="stat-item" style="border-left: 3px solid #334155; background:#f8fafc;">
            <span class="stat-label">整弦长 AB</span>
            <span class="stat-value">${ab.toFixed(2)} cm</span>
        </div>
    `;
}

function renderChordFormula() {
    formulaBody.innerHTML = `
        <div class="panel-formula-summary">
            <span class="formula-kicker">核心公式</span>
            <div class="formula-line" id="math-eq-chord" style="text-align:center;"></div>
            <div class="formula-chip-row">
                <span class="hover-term" data-term="r">半径 R</span>
                <span class="hover-term" data-term="d">弦心距 d</span>
                <span class="hover-term" data-term="chord">半弦长 a/2</span>
            </div>
        </div>
    `;
    katex.render("R^2 = d^2 + \\left(\\frac{a}{2}\\right)^2 \\implies R = \\sqrt{d^2 + \\left(\\frac{a}{2}\\right)^2}", document.getElementById("math-eq-chord"), { displayMode: true });
}

// --------------------------------------------------------------------------
// 4.2 Tab 2: 圆周角定理 (Inscribed Angle Theorem)
// --------------------------------------------------------------------------
function renderInscribedAngle() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.inscribed;
    const radA = degToRad(data.angleA);
    const radB = degToRad(data.angleB);

    const A = { x: data.O.x + data.R * Math.cos(radA), y: data.O.y + data.R * Math.sin(radA) };
    const B = { x: data.O.x + data.R * Math.cos(radB), y: data.O.y + data.R * Math.sin(radB) };

    const activeHighlight = hoveredElement || lockedElement;
    const isCenterActive = activeHighlight === "angle-center";
    const isInscribedActive = activeHighlight === "angle-inscribed";

    // 4.2.1 绘制圆周轮廓
    drawingLayer.appendChild(createSVGNode("circle", {
        cx: data.O.x, cy: data.O.y, r: data.R,
        class: "geo-line", stroke: "#64748b", "stroke-width": 1.5
    }));

    // 4.2.2 绘制大圆弧 AB (粗深色线表示)
    // 根据大弧还是小弧渲染 path SVG arc
    const largeArcFlag = (data.angleB - data.angleA + 360) % 360 > 180 ? 1 : 0;
    drawingLayer.appendChild(createSVGNode("path", {
        d: `M ${A.x} ${A.y} A ${data.R} ${data.R} 0 ${largeArcFlag} 1 ${B.x} ${B.y}`,
        fill: "none", stroke: "#0f172a", "stroke-width": 3.5, class: "geo-line"
    }));

    // 4.2.2.1 绘制同弧扫掠轨迹虚影 (Ghost trails during animation)
    if (isSweeping) {
        const startAng = data.angleB + 15;
        const endAng = data.angleA + 360 - 15;
        const tValues = [0.22, 0.44, 0.66, 0.88];
        tValues.forEach(tVal => {
            const gAngle = startAng + tVal * (endAng - startAng);
            const radG = degToRad(gAngle);
            const gC = {
                x: data.O.x + data.R * Math.cos(radG),
                y: data.O.y + data.R * Math.sin(radG)
            };
            drawingLayer.appendChild(createSVGNode("line", {
                x1: gC.x, y1: gC.y, x2: A.x, y2: A.y,
                class: "geo-line green ghost-trail"
            }));
            drawingLayer.appendChild(createSVGNode("line", {
                x1: gC.x, y1: gC.y, x2: B.x, y2: B.y,
                class: "geo-line green ghost-trail"
            }));
            drawingLayer.appendChild(createSVGNode("circle", {
                cx: gC.x, cy: gC.y, r: 3.2,
                fill: "#ffffff", stroke: "var(--color-green)", "stroke-width": 1.2,
                opacity: 0.5
            }));
        });
    }

    // 4.2.3 绘制圆心角 OA, OB
    const lineOA = createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: A.x, y2: A.y,
        class: `geo-line red dashed ${isCenterActive ? 'highlight-pulse' : ''}`
    });
    const lineOB = createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: B.x, y2: B.y,
        class: `geo-line red dashed ${isCenterActive ? 'highlight-pulse' : ''}`
    });
    bindShapeInteractions(lineOA, "angle-center");
    bindShapeInteractions(lineOB, "angle-center");
    drawingLayer.appendChild(lineOA);
    drawingLayer.appendChild(lineOB);

    // 4.2.4 绘制圆周角 CA, CB
    const lineCA = createSVGNode("line", {
        x1: data.C.x, y1: data.C.y, x2: A.x, y2: A.y,
        class: `geo-line green ${isInscribedActive ? 'highlight-pulse' : ''}`
    });
    const lineCB = createSVGNode("line", {
        x1: data.C.x, y1: data.C.y, x2: B.x, y2: B.y,
        class: `geo-line green ${isInscribedActive ? 'highlight-pulse' : ''}`
    });
    bindShapeInteractions(lineCA, "angle-inscribed");
    bindShapeInteractions(lineCB, "angle-inscribed");
    drawingLayer.appendChild(lineCA);
    drawingLayer.appendChild(lineCB);

    // 4.2.5 计算角度度数
    let centerAngle = (data.angleB - data.angleA + 360) % 360;
    if (centerAngle > 180) centerAngle = 360 - centerAngle; // 确保是凸角

    // 计算圆周角 ACB
    const angleCA = radToDeg(Math.atan2(A.y - data.C.y, A.x - data.C.x));
    const angleCB = radToDeg(Math.atan2(B.y - data.C.y, B.x - data.C.x));
    let inscribedAngle = Math.abs(angleCA - angleCB);
    if (inscribedAngle > 180) inscribedAngle = 360 - inscribedAngle;

    // 4.2.6 如果是 90 度，绘制直角符号
    if (Math.abs(inscribedAngle - 90) < 0.5) {
        drawingLayer.appendChild(createSVGNode("path", {
            d: drawRightAngle(data.C, A, B, 6),
            class: "right-angle-marker"
        }));
    }

    // 4.2.7 绘制圆心角和圆周角的度数标志弧 (Arc Sector markers)
    // 圆心角弧 (自适应内侧)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.O, A, B, 20),
        fill: "none", stroke: "var(--color-red)", "stroke-width": 1.5,
        filter: isCenterActive ? "url(#neon-glow)" : ""
    }));

    // 圆周角弧 (自适应内侧)
    drawingLayer.appendChild(createSVGNode("path", {
        d: getAngleArcPath(data.C, A, B, 18),
        fill: "none", stroke: "var(--color-green)", "stroke-width": 1.5,
        filter: isInscribedActive ? "url(#neon-glow)" : ""
    }));

    // 4.2.8 文字标注
    drawingLayer.appendChild(createSVGNode("text", { x: data.O.x, y: data.O.y - 10, class: "geo-text" })).textContent = "O";
    drawingLayer.appendChild(createSVGNode("text", { x: A.x - 12, y: A.y + 8, class: "geo-text" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: B.x + 12, y: B.y + 8, class: "geo-text" })).textContent = "B";
    
    // 动态文字定位避开圆周外
    const cLabelOffset = 15;
    const radC = Math.atan2(data.C.y - data.O.y, data.C.x - data.O.x);
    const cLabelX = data.C.x + cLabelOffset * Math.cos(radC);
    const cLabelY = data.C.y + cLabelOffset * Math.sin(radC);
    drawingLayer.appendChild(createSVGNode("text", { x: cLabelX, y: cLabelY + 4, class: "geo-text green" })).textContent = "C";

    // 4.2.9 交互拖拽控制点 (点 C)
    const dragC = createSVGNode("g", { class: `drag-point ${activeDragId === "drag-C" ? "is-dragging" : ""}`, id: "drag-C" });
    dragC.appendChild(createSVGNode("circle", { cx: data.C.x, cy: data.C.y, r: 24, class: "drag-point-hit" }));
    dragC.appendChild(createSVGNode("circle", { cx: data.C.x, cy: data.C.y, r: 8, class: "drag-point-outer" }));
    dragC.appendChild(createSVGNode("circle", { cx: data.C.x, cy: data.C.y, r: 3.5, class: "drag-point-inner" }));
    controlsLayer.appendChild(dragC);

    renderInscribedStats(centerAngle, inscribedAngle, activeHighlight);
    renderInscribedFormula();
    bindHoverTerms();
}

function renderInscribedStats(center, inscribed, activeHighlight) {
    const isCenterActive = activeHighlight === "angle-center";
    const isInscribedActive = activeHighlight === "angle-inscribed";

    liveStats.innerHTML = `
        <div class="stat-item interactive-shape" style="${isCenterActive ? 'border-color:var(--color-red); background:rgba(239,68,68,0.02);' : ''}" onclick="event.stopPropagation(); lockedElement = (lockedElement === 'angle-center') ? null : 'angle-center'; playClickSound(); renderActiveTab();">
            <span class="stat-label">圆心角 ∠AOB</span>
            <span class="stat-value" style="color:var(--color-red);">${center.toFixed(1)}°</span>
        </div>
        <div class="stat-item interactive-shape" style="${isInscribedActive ? 'border-color:var(--color-green); background:rgba(16,185,129,0.02);' : ''}" onclick="event.stopPropagation(); lockedElement = (lockedElement === 'angle-inscribed') ? null : 'angle-inscribed'; playClickSound(); renderActiveTab();">
            <span class="stat-label">圆周角 ∠ACB</span>
            <span class="stat-value" style="color:var(--color-green);">${inscribed.toFixed(1)}°</span>
        </div>
        <div class="stat-item" style="border-left: 3px solid var(--color-purple); grid-column: span 2; background:#faf5ff;">
            <span class="stat-label">两角数量关系比对</span>
            <span class="stat-value" style="color:var(--color-purple); font-size:12.5px;">∠AOB = 2 × ∠ACB (${center.toFixed(1)}° = 2 × ${inscribed.toFixed(1)}°)</span>
        </div>
    `;
}

function renderInscribedFormula() {
    formulaBody.innerHTML = `
        <div class="panel-formula-summary">
            <span class="formula-kicker">核心公式</span>
            <div class="formula-line" id="math-eq-inscribed" style="text-align:center;"></div>
            <div class="formula-chip-row">
                <span class="hover-term" data-term="angle-inscribed">圆周角 ∠ACB</span>
                <span class="hover-term" data-term="angle-center">圆心角 ∠AOB</span>
            </div>
        </div>
    `;
    katex.render("\\angle ACB = \\frac{1}{2} \\angle AOB", document.getElementById("math-eq-inscribed"), { displayMode: true });
}

// --------------------------------------------------------------------------
// 4.3 Tab 3: 切线长定理 (Tangent Length Theorem)
// --------------------------------------------------------------------------
function renderTangentProperties() {
    drawingLayer.innerHTML = "";
    controlsLayer.innerHTML = "";

    const data = state.tangent;
    const dDist = getDistance(data.O, data.P);

    // 计算切点角度
    const alpha = Math.atan2(data.P.y - data.O.y, data.P.x - data.O.x);
    const beta = Math.acos(data.R / dDist); // cos(beta) = R / d

    // 两切点坐标
    const A = {
        x: data.O.x + data.R * Math.cos(alpha - beta),
        y: data.O.y + data.R * Math.sin(alpha - beta)
    };
    const B = {
        x: data.O.x + data.R * Math.cos(alpha + beta),
        y: data.O.y + data.R * Math.sin(alpha + beta)
    };

    // 4.3.0 教学演示：全等沿对称轴 OP 对称折叠投影计算
    let drawA = A;
    if (isFolding) {
        const scaleS = 1.0 - 2.0 * foldProgress;
        const vecU = { x: (data.P.x - data.O.x) / dDist, y: (data.P.y - data.O.y) / dDist };
        const vecVA = { x: A.x - data.O.x, y: A.y - data.O.y };
        const projT = vecVA.x * vecU.x + vecVA.y * vecU.y;
        const H = { x: data.O.x + projT * vecU.x, y: data.O.y + projT * vecU.y };
        const vecW = { x: A.x - H.x, y: A.y - H.y };
        drawA = { x: H.x + vecW.x * scaleS, y: H.y + vecW.y * scaleS };
    }

    const tangentLength = Math.sqrt(dDist * dDist - data.R * data.R);

    const cmRatio = 25;
    const cmR = data.R / cmRatio;
    const cmOP = dDist / cmRatio;
    const cmTangent = tangentLength / cmRatio;

    const angleP = radToDeg(beta) * 2; // 角 APB 的大小

    const activeHighlight = hoveredElement || lockedElement;
    const isTangentActive = activeHighlight === "tangent";
    const isRActive = activeHighlight === "r";

    // 4.3.1 绘制圆
    drawingLayer.appendChild(createSVGNode("circle", {
        cx: data.O.x, cy: data.O.y, r: data.R,
        class: "geo-line", stroke: "#334155"
    }));

    // 4.3.2 绘制全等直角三角形填充
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.O.x},${data.O.y} ${drawA.x},${drawA.y} ${data.P.x},${data.P.y}`,
        fill: isTangentActive ? "rgba(139, 92, 246, 0.05)" : "none",
        stroke: "none"
    }));
    drawingLayer.appendChild(createSVGNode("polygon", {
        points: `${data.O.x},${data.O.y} ${B.x},${B.y} ${data.P.x},${data.P.y}`,
        fill: isTangentActive ? "rgba(139, 92, 246, 0.05)" : "none",
        stroke: "none"
    }));

    // 4.3.3 绘制切线长线段 PA, PB (带流光发光虚线高亮)
    const linePA = createSVGNode("line", {
        x1: data.P.x, y1: data.P.y, x2: drawA.x, y2: drawA.y,
        class: `geo-line orange ${isTangentActive ? 'highlight-pulse' : ''}`
    });
    const linePB = createSVGNode("line", {
        x1: data.P.x, y1: data.P.y, x2: B.x, y2: B.y,
        class: `geo-line orange ${isTangentActive ? 'highlight-pulse' : ''}`
    });
    bindShapeInteractions(linePA, "tangent");
    bindShapeInteractions(linePB, "tangent");
    drawingLayer.appendChild(linePA);
    drawingLayer.appendChild(linePB);

    // 4.3.4 绘制切线引导全息能量虚线 (Flowing laser animation)
    if (isTangentActive) {
        drawingLayer.appendChild(createSVGNode("path", {
            d: `M ${data.P.x} ${data.P.y} L ${drawA.x} ${drawA.y}`,
            stroke: "var(--color-orange)", "stroke-width": 2.0, class: "geo-line dashed flow", fill: "none",
            filter: "url(#neon-glow)"
        }));
        drawingLayer.appendChild(createSVGNode("path", {
            d: `M ${data.P.x} ${data.P.y} L ${B.x} ${B.y}`,
            stroke: "var(--color-orange)", "stroke-width": 2.0, class: "geo-line dashed flow", fill: "none",
            filter: "url(#neon-glow)"
        }));
    }

    // 4.3.5 绘制切点到圆心的半径 OA, OB
    const lineOA = createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: drawA.x, y2: drawA.y,
        class: `geo-line blue ${isRActive ? 'highlight-pulse' : ''}`
    });
    const lineOB = createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: B.x, y2: B.y,
        class: `geo-line blue ${isRActive ? 'highlight-pulse' : ''}`
    });
    bindShapeInteractions(lineOA, "r");
    bindShapeInteractions(lineOB, "r");
    drawingLayer.appendChild(lineOA);
    drawingLayer.appendChild(lineOB);

    // 4.3.6 绘制连线 OP (对称轴)
    drawingLayer.appendChild(createSVGNode("line", {
        x1: data.O.x, y1: data.O.y, x2: data.P.x, y2: data.P.y,
        class: "geo-line purple dashed"
    }));

    // 4.3.7 绘制切角直角符号
    drawingLayer.appendChild(createSVGNode("path", { d: drawRightAngle(drawA, data.P, data.O, 6), class: "right-angle-marker" }));
    drawingLayer.appendChild(createSVGNode("path", { d: drawRightAngle(B, data.P, data.O, 6), class: "right-angle-marker" }));

    // 4.3.8 文字标注
    drawingLayer.appendChild(createSVGNode("text", { x: data.O.x - 12, y: data.O.y + 4, class: "geo-text" })).textContent = "O";
    drawingLayer.appendChild(createSVGNode("text", { x: drawA.x - 6, y: drawA.y - 12, class: "geo-text" })).textContent = "A";
    drawingLayer.appendChild(createSVGNode("text", { x: B.x - 6, y: B.y + 16, class: "geo-text" })).textContent = "B";
    drawingLayer.appendChild(createSVGNode("text", { x: data.P.x + 12, y: data.P.y + 4, class: "geo-text" })).textContent = "P";

    // 字母大小标注
    drawingLayer.appendChild(createSVGNode("text", { x: (drawA.x + data.P.x)/2 + 10, y: (drawA.y + data.P.y)/2 - 12, class: `geo-text orange ${isTangentActive ? 'geo-text-pulse' : ''}` })).textContent = "PA";
    drawingLayer.appendChild(createSVGNode("text", { x: (B.x + data.P.x)/2 + 10, y: (B.y + data.P.y)/2 + 16, class: `geo-text orange ${isTangentActive ? 'geo-text-pulse' : ''}` })).textContent = "PB";

    // 4.3.9 绘制控制点 (点 P)
    const dragP = createSVGNode("g", { class: `drag-point ${activeDragId === "drag-P" ? "is-dragging" : ""}`, id: "drag-P" });
    dragP.appendChild(createSVGNode("circle", { cx: data.P.x, cy: data.P.y, r: 24, class: "drag-point-hit" }));
    dragP.appendChild(createSVGNode("circle", { cx: data.P.x, cy: data.P.y, r: 8, class: "drag-point-outer" }));
    dragP.appendChild(createSVGNode("circle", { cx: data.P.x, cy: data.P.y, r: 3.5, class: "drag-point-inner" }));
    controlsLayer.appendChild(dragP);

    renderTangentStats(cmR, cmOP, cmTangent, angleP, activeHighlight);
    renderTangentFormula();
    bindHoverTerms();
}

function renderTangentStats(r, op, tangent, angleP, activeHighlight) {
    const isTangentActive = activeHighlight === "tangent";
    const isRActive = activeHighlight === "r";

    liveStats.innerHTML = `
        <div class="stat-item interactive-shape" style="${isTangentActive ? 'border-color:var(--color-orange); background:rgba(245,158,11,0.02);' : ''}" onclick="event.stopPropagation(); lockedElement = (lockedElement === 'tangent') ? null : 'tangent'; playClickSound(); renderActiveTab();">
            <span class="stat-label">切线长 PA = PB</span>
            <span class="stat-value" style="color:var(--color-orange);">${tangent.toFixed(2)} cm</span>
        </div>
        <div class="stat-item interactive-shape" style="${isRActive ? 'border-color:var(--color-blue); background:rgba(59,130,246,0.02);' : ''}" onclick="event.stopPropagation(); lockedElement = (lockedElement === 'r') ? null : 'r'; playClickSound(); renderActiveTab();">
            <span class="stat-label">圆半径 R (OA)</span>
            <span class="stat-value" style="color:var(--color-blue);">${r.toFixed(2)} cm</span>
        </div>
        <div class="stat-item" style="border-left: 3px solid var(--color-purple); background:#faf5ff;">
            <span class="stat-label">外点距离 OP</span>
            <span class="stat-value" style="color:var(--color-purple);">${op.toFixed(2)} cm</span>
        </div>
        <div class="stat-item" style="border-left: 3px solid var(--color-green); background:#f0fdf4;">
            <span class="stat-label">夹角 ∠APB 度数</span>
            <span class="stat-value" style="color:var(--color-green);">${angleP.toFixed(1)}°</span>
        </div>
    `;
}

function renderTangentFormula() {
    formulaBody.innerHTML = `
        <div class="panel-formula-summary">
            <span class="formula-kicker">核心公式</span>
            <div class="formula-line" id="math-eq-tangent" style="text-align:center;"></div>
            <div class="formula-chip-row">
                <span class="hover-term" data-term="tangent">PA = PB</span>
                <span class="hover-term" data-term="r">OA ⟂ PA</span>
            </div>
        </div>
    `;
    katex.render("PA = PB = \\sqrt{OP^2 - R^2}", document.getElementById("math-eq-tangent"), { displayMode: true });
}

// ==========================================================================
// 5. 双向交互绑定处理器 (Interaction Handlers)
// ==========================================================================
function bindShapeInteractions(svgNode, termName) {
    svgNode.classList.add("interactive-shape");
    svgNode.addEventListener("mouseenter", () => {
        hoveredElement = termName;
        renderActiveTab();
    });
    svgNode.addEventListener("mouseleave", () => {
        hoveredElement = null;
        renderActiveTab();
    });
    svgNode.addEventListener("click", (e) => {
        e.stopPropagation();
        lockedElement = (lockedElement === termName) ? null : termName;
        playClickSound();
        renderActiveTab();
    });
}

function bindHoverTerms() {
    document.querySelectorAll(".hover-term").forEach(el => {
        const term = el.getAttribute("data-term");

        if (term === lockedElement) {
            el.classList.add("locked-active");
        } else {
            el.classList.remove("locked-active");
        }

        el.addEventListener("mouseenter", () => {
            hoveredElement = term;
            renderActiveTab();
        });
        el.addEventListener("mouseleave", () => {
            hoveredElement = null;
            renderActiveTab();
        });
        el.addEventListener("click", (e) => {
            e.stopPropagation();
            lockedElement = (lockedElement === term) ? null : term;
            playClickSound();
            renderActiveTab();
        });
    });
}

function renderActiveTab() {
    if (activeTab === "perpendicular-chord") {
        renderPerpendicularChord();
    } else if (activeTab === "inscribed-angle") {
        renderInscribedAngle();
    } else if (activeTab === "tangent-properties") {
        renderTangentProperties();
    }
    updateHUDContent();
}

// ==========================================================================
// 6. 拖拽引擎与限幅逻辑 (Drag & Drop Engine)
// ==========================================================================
function initDragEvents() {
    const getMousePosition = (e) => {
        const point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const matrix = svg.getScreenCTM();
        if (!matrix) return { x: 0, y: 0 };
        const transformed = point.matrixTransform(matrix.inverse());
        return {
            x: transformed.x,
            y: transformed.y
        };
    };
    const getDragAnchor = (dragId) => {
        if (activeTab === "perpendicular-chord" && dragId === "drag-D") return state.chord.D;
        if (activeTab === "inscribed-angle" && dragId === "drag-C") return state.inscribed.C;
        if (activeTab === "tangent-properties" && dragId === "drag-P") return state.tangent.P;
        return null;
    };
    const getAdjustedDragPosition = (e) => {
        const pos = getMousePosition(e);
        return {
            x: pos.x - dragOffset.x,
            y: pos.y - dragOffset.y
        };
    };
    const beginDrag = (target, eventPoint) => {
        activeDragId = target.id;
        const anchor = getDragAnchor(activeDragId);
        const pos = getMousePosition(eventPoint);
        dragOffset = anchor ? { x: pos.x - anchor.x, y: pos.y - anchor.y } : { x: 0, y: 0 };
        playClickSound();
        renderActiveTab();
    };
    const endDrag = () => {
        if (!activeDragId) return;
        activeDragId = null;
        dragOffset = { x: 0, y: 0 };
        renderActiveTab();
    };

    const updateDrag = (pos) => {
        if (activeTab === "perpendicular-chord" && activeDragId === "drag-D") {
            const data = state.chord;
            data.D.y = Math.max(data.O.y + 1, Math.min(data.O.y + data.R - 10, pos.y));
            renderPerpendicularChord();
        }
        else if (activeTab === "inscribed-angle" && activeDragId === "drag-C") {
            const data = state.inscribed;
            const rad = Math.atan2(pos.y - data.O.y, pos.x - data.O.x);
            data.C.x = data.O.x + data.R * Math.cos(rad);
            data.C.y = data.O.y + data.R * Math.sin(rad);
            renderInscribedAngle();
        }
        else if (activeTab === "tangent-properties" && activeDragId === "drag-P") {
            const data = state.tangent;
            const dX = pos.x - data.O.x;
            const dY = pos.y - data.O.y;
            const dist = Math.sqrt(dX * dX + dY * dY) || 1;
            if (dist < data.R + 25) {
                const scale = (data.R + 25) / dist;
                data.P.x = data.O.x + dX * scale;
                data.P.y = data.O.y + dY * scale;
            } else {
                data.P.x = Math.max(50, Math.min(550, pos.x));
                data.P.y = Math.max(50, Math.min(370, pos.y));
            }
            renderTangentProperties();
        }
    };

    // 主路径统一采用 Pointer Events：拖拽点在触控屏上捕获指针，避免滚动手势、合成 click 与鼠标分支相互干扰。
    if (window.PointerEvent) {
        let activePointerId = null;

        svg.addEventListener("pointerdown", (e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            const target = e.target.closest(".drag-point");
            if (!target) return;

            activePointerId = e.pointerId;
            svg.setPointerCapture?.(activePointerId);
            beginDrag(target, e);
            e.preventDefault();
        }, { passive: false });

        svg.addEventListener("pointermove", (e) => {
            if (!activeDragId || e.pointerId !== activePointerId) return;
            updateDrag(getAdjustedDragPosition(e));
            e.preventDefault();
        }, { passive: false });

        const finishPointerDrag = (e) => {
            if (activePointerId === null || e.pointerId !== activePointerId) return;
            if (svg.hasPointerCapture?.(activePointerId)) svg.releasePointerCapture(activePointerId);
            activePointerId = null;
            endDrag();
            e.preventDefault();
        };

        svg.addEventListener("pointerup", finishPointerDrag, { passive: false });
        svg.addEventListener("pointercancel", finishPointerDrag, { passive: false });
        svg.addEventListener("lostpointercapture", () => {
            activePointerId = null;
            endDrag();
        });
        return;
    }

    svg.addEventListener("mousedown", (e) => {
        const target = e.target.closest(".drag-point");
        if (!target) return;
        beginDrag(target, e);
    });

    svg.addEventListener("mousemove", (e) => {
        if (!activeDragId) return;

        const pos = getAdjustedDragPosition(e);

        if (activeTab === "perpendicular-chord" && activeDragId === "drag-D") {
            const data = state.chord;
            // 限制点 D 只能沿 y 轴在圆内滑动 (O.y 到 O.y + R - 10)
            data.D.y = Math.max(data.O.y + 1, Math.min(data.O.y + data.R - 10, pos.y));
            renderPerpendicularChord();
        } 
        else if (activeTab === "inscribed-angle" && activeDragId === "drag-C") {
            const data = state.inscribed;
            // 计算鼠标相对于圆心的夹角，使 C 沿圆周滑动
            const rad = Math.atan2(pos.y - data.O.y, pos.x - data.O.x);
            let deg = radToDeg(rad);

            // 防止 C 与弧端点 A, B 重合或越界
            // 设定微小的防重合截断 (5度)
            const pad = 5;
            const degA = (data.angleA + pad) % 360;
            const degB = (data.angleB - pad + 360) % 360;

            // 让 C 平滑滑动在主要圆弧或剩余圆周上
            data.C.x = data.O.x + data.R * Math.cos(rad);
            data.C.y = data.O.y + data.R * Math.sin(rad);
            renderInscribedAngle();
        }
        else if (activeTab === "tangent-properties" && activeDragId === "drag-P") {
            const data = state.tangent;
            // 限制 P 不得进入圆的内侧防重合半径 (O.x 距离 > R + 25)
            const dX = pos.x - data.O.x;
            const dY = pos.y - data.O.y;
            const dist = Math.sqrt(dX * dX + dY * dY);

            if (dist < data.R + 25) {
                // 限制在边界切线外
                const scale = (data.R + 25) / dist;
                data.P.x = data.O.x + dX * scale;
                data.P.y = data.O.y + dY * scale;
            } else {
                data.P.x = Math.max(50, Math.min(550, pos.x));
                data.P.y = Math.max(50, Math.min(370, pos.y));
            }
            renderTangentProperties();
        }
    });

    window.addEventListener("mouseup", endDrag);

    // 移动端 Touch 支持
    svg.addEventListener("touchstart", (e) => {
        if (e.touches.length === 0) return;
        const touch = e.touches[0];
        const target = touch.target.closest(".drag-point");
        if (!target) return;
        beginDrag(target, touch);
        e.preventDefault();
    }, { passive: false });

    svg.addEventListener("touchmove", (e) => {
        if (!activeDragId || e.touches.length === 0) return;
        const touch = e.touches[0];
        const pos = getAdjustedDragPosition(touch);

        if (activeTab === "perpendicular-chord" && activeDragId === "drag-D") {
            const data = state.chord;
            data.D.y = Math.max(data.O.y + 1, Math.min(data.O.y + data.R - 10, pos.y));
            renderPerpendicularChord();
        }
        else if (activeTab === "inscribed-angle" && activeDragId === "drag-C") {
            const data = state.inscribed;
            const rad = Math.atan2(pos.y - data.O.y, pos.x - data.O.x);
            data.C.x = data.O.x + data.R * Math.cos(rad);
            data.C.y = data.O.y + data.R * Math.sin(rad);
            renderInscribedAngle();
        }
        else if (activeTab === "tangent-properties" && activeDragId === "drag-P") {
            const data = state.tangent;
            const dX = pos.x - data.O.x;
            const dY = pos.y - data.O.y;
            const dist = Math.sqrt(dX * dX + dY * dY);
            if (dist < data.R + 25) {
                const scale = (data.R + 25) / dist;
                data.P.x = data.O.x + dX * scale;
                data.P.y = data.O.y + dY * scale;
            } else {
                data.P.x = Math.max(50, Math.min(550, pos.x));
                data.P.y = Math.max(50, Math.min(370, pos.y));
            }
            renderTangentProperties();
        }
        e.preventDefault();
    }, { passive: false });

    window.addEventListener("touchend", endDrag);
    window.addEventListener("touchcancel", endDrag);
}

// ==========================================================================
// 7. HUD 解析与预设按钮初始化
// ==========================================================================
function updateHUDContent() {
    if (activeTab === "perpendicular-chord") {
        hudContent.innerHTML = `
            <h3>垂径定理核心解题秘籍</h3>
            <p><strong>性质概要：</strong>垂直于弦的直径平分弦，且平分弦所对的弧。</p>
            <p><strong>数形演算法则：</strong>CD ⟂ AB ⇒ AD = BD，⌒AE = ⌒BE。</p>
            <p><strong>常考辅助线套路：</strong></p>
            <ul>
                <li><strong>构造直角三角形</strong>：连半径 R，引弦心距 d，弦长一半为直角边，形成解题黄金三角形 △OBD。</li>
                <li><strong>勾股核心公式</strong>：R² = d² + (a/2)²，可知二求一。</li>
                <li>考题通常“知二求一”，例如已知半径和弦长，必先求出弦心距进行定位。</li>
            </ul>
        `;
    } else if (activeTab === "inscribed-angle") {
        hudContent.innerHTML = `
            <h3>圆周角定理核心解题秘籍</h3>
            <p><strong>定理概要：</strong>同弧或等弧所对的圆周角相等，且等于圆心角的一半。</p>
            <p><strong>数形演算法则：</strong>当顶点 C 在同一段圆弧上滑动时，∠ACB 的度数保持由同弧 AB 决定。</p>
            <p><strong>核心几何推论：</strong></p>
            <ul>
                <li><strong>核心公式</strong>：∠ACB = 1/2 ∠AOB。</li>
                <li><strong>直径对直角</strong>：半圆或直径所对的圆周角是直角（90°）。</li>
                <li>反之，90° 的圆周角所对的弦是直径。这是寻找隐形圆、隐形直径的核心几何法则。</li>
                <li><strong>圆内接四边形</strong>：对角互补（和为 180°）。</li>
            </ul>
        `;
    } else if (activeTab === "tangent-properties") {
        hudContent.innerHTML = `
            <h3>切线长定理核心解题秘籍</h3>
            <p><strong>定理概要：</strong>从圆外一点引圆的两条切线，它们的切线长相等，圆心和这一点的连线平分两条切线的夹角。</p>
            <p><strong>数形演算法则：</strong>切线半径垂直于切线，形成两个可用 HL 判定的直角三角形。</p>
            <p><strong>常用结论与证明：</strong></p>
            <ul>
                <li>连接 OA、OB，因为切线性质，有 OA ⟂ PA，OB ⟂ PB。</li>
                <li>在 Rt△OAP 与 Rt△OBP 中，由 OA = OB = R，OP = OP 证出两三角形全等 (HL)。</li>
                <li>因此 PA = PB，∠APO = ∠BPO，∠AOP = ∠BOP。</li>
                <li><strong>核心公式</strong>：PA = PB = √(OP² - R²)。</li>
            </ul>
        `;
    }
}

function initActionButtons() {
    actionButtonsGrid.innerHTML = "";
    if (activeTab === "perpendicular-chord") {
        actionButtonsGrid.innerHTML = `
            <button class="btn-action" id="btn-chord-shallow">📐 浅弦 (大半弦)</button>
            <button class="btn-action" id="btn-chord-deep">📐 深弦 (小弦心距)</button>
            <button class="btn-action" id="btn-chord-pyth" style="background:var(--color-blue-light); border-color:var(--color-blue); color:#000000; grid-column:span 2; font-weight:600;"></button>
        `;
        
        const updatePythBtnText = () => {
            const btn = document.getElementById("btn-chord-pyth");
            btn.innerHTML = showPythSquares ? "🎬 隐藏三边勾股正方形" : "🎬 演示三边勾股正方形";
        };
        updatePythBtnText();

        document.getElementById("btn-chord-shallow").addEventListener("click", () => {
            state.chord.D.y = state.chord.O.y + 90;
            playClickSound();
            renderPerpendicularChord();
        });
        document.getElementById("btn-chord-deep").addEventListener("click", () => {
            state.chord.D.y = state.chord.O.y + 35;
            playClickSound();
            renderPerpendicularChord();
        });
        document.getElementById("btn-chord-pyth").addEventListener("click", () => {
            showPythSquares = !showPythSquares;
            playClickSound();
            updatePythBtnText();
            renderPerpendicularChord();
        });
    } else if (activeTab === "inscribed-angle") {
        actionButtonsGrid.innerHTML = `
            <button class="btn-action" id="btn-inc-diameter">📐 直径所对圆周角 (直角)</button>
            <button class="btn-action" id="btn-inc-acute">📐 锐角圆心角 (70°)</button>
            <button class="btn-action" id="btn-inc-sweep" style="background:var(--color-green-light); border-color:var(--color-green); color:#000000; grid-column:span 2; font-weight:600;"></button>
        `;

        const updateSweepBtnText = () => {
            const btn = document.getElementById("btn-inc-sweep");
            btn.innerHTML = isSweeping ? "🎬 停止同弧扫掠" : "🎬 演示同弧扫掠 (轨迹留影)";
        };
        updateSweepBtnText();

        document.getElementById("btn-inc-diameter").addEventListener("click", () => {
            // 停止扫掠
            if (isSweeping) {
                clearInterval(sweepTimerId);
                isSweeping = false;
                updateSweepBtnText();
            }
            const data = state.inscribed;
            data.angleA = 180;
            data.angleB = 360;
            data.C = { x: data.O.x, y: data.O.y - data.R };
            playClickSound();
            renderInscribedAngle();
        });
        document.getElementById("btn-inc-acute").addEventListener("click", () => {
            if (isSweeping) {
                clearInterval(sweepTimerId);
                isSweeping = false;
                updateSweepBtnText();
            }
            const data = state.inscribed;
            data.angleA = 225;
            data.angleB = 295;
            data.C = { x: data.O.x - data.R * Math.cos(degToRad(30)), y: data.O.y - data.R * Math.sin(degToRad(30)) };
            playClickSound();
            renderInscribedAngle();
        });

        document.getElementById("btn-inc-sweep").addEventListener("click", () => {
            isSweeping = !isSweeping;
            playClickSound();
            updateSweepBtnText();

            if (isSweeping) {
                const startTime = Date.now();
                sweepTimerId = setInterval(() => {
                    const data = state.inscribed;
                    const time = (Date.now() - startTime) / 1000;
                    
                    const startAng = data.angleB + 15;
                    const endAng = data.angleA + 360 - 15;
                    
                    // 用正弦函数产生平滑往复滑动
                    const t = (Math.sin(time * 1.5) + 1) / 2;
                    const angle = startAng + t * (endAng - startAng);
                    
                    data.C.x = data.O.x + data.R * Math.cos(degToRad(angle));
                    data.C.y = data.O.y + data.R * Math.sin(degToRad(angle));
                    renderInscribedAngle();
                }, 30);
            } else {
                clearInterval(sweepTimerId);
                sweepTimerId = null;
                // 复位顶点 C 到大弧顶部
                const data = state.inscribed;
                data.C = { x: data.O.x, y: data.O.y - data.R };
                renderInscribedAngle();
            }
        });
    } else if (activeTab === "tangent-properties") {
        actionButtonsGrid.innerHTML = `
            <button class="btn-action" id="btn-tg-close">📐 迫近切线 (大夹角)</button>
            <button class="btn-action" id="btn-tg-far">📐 远距切线 (小夹角)</button>
            <button class="btn-action" id="btn-tg-fold" style="background:var(--color-purple-light); border-color:var(--color-purple); color:#000000; grid-column:span 2; font-weight:600;"></button>
        `;

        const updateFoldBtnText = () => {
            const btn = document.getElementById("btn-tg-fold");
            btn.innerHTML = isFolding ? "🎬 停止对称折叠" : "🎬 演示沿OP对称翻折全等";
        };
        updateFoldBtnText();

        document.getElementById("btn-tg-close").addEventListener("click", () => {
            if (isFolding) {
                clearInterval(foldTimerId);
                isFolding = false;
                updateFoldBtnText();
            }
            state.tangent.P = { x: 320, y: 210 };
            playClickSound();
            renderTangentProperties();
        });
        document.getElementById("btn-tg-far").addEventListener("click", () => {
            if (isFolding) {
                clearInterval(foldTimerId);
                isFolding = false;
                updateFoldBtnText();
            }
            state.tangent.P = { x: 500, y: 210 };
            playClickSound();
            renderTangentProperties();
        });

        document.getElementById("btn-tg-fold").addEventListener("click", () => {
            isFolding = !isFolding;
            playClickSound();
            updateFoldBtnText();

            if (isFolding) {
                foldProgress = 0.0;
                foldDirection = 1;
                foldTimerId = setInterval(() => {
                    foldProgress += 0.015 * foldDirection;
                    if (foldProgress >= 1.0) {
                        foldProgress = 1.0;
                        foldDirection = -1; // 往回复位
                    } else if (foldProgress <= 0.0) {
                        foldProgress = 0.0;
                        foldDirection = 1; // 重新翻折
                    }
                    renderTangentProperties();
                }, 20);
            } else {
                clearInterval(foldTimerId);
                foldTimerId = null;
                foldProgress = 0.0;
                renderTangentProperties();
            }
        });
    }
}

// ==========================================================================
// 8. 音频反馈系统
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

// ==========================================================================
// 9. 初始化与 Tab 切换机制
// ==========================================================================
function switchTab(tabId) {
    activeTab = tabId;
    hoveredElement = null;
    lockedElement = null;

    // 清除可能在运行的教学演示动画定时器与状态
    if (sweepTimerId) {
        clearInterval(sweepTimerId);
        sweepTimerId = null;
    }
    if (foldTimerId) {
        clearInterval(foldTimerId);
        foldTimerId = null;
    }
    isSweeping = false;
    isFolding = false;
    foldProgress = 0.0;
    showPythSquares = false;

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        }
    });

    if (tabId === "perpendicular-chord") {
        stepGuideIndicator.innerHTML = "💡 当前探索：垂径定理性质";
    } else if (tabId === "inscribed-angle") {
        stepGuideIndicator.innerHTML = "💡 当前探索：圆周角定理性质";
        // 初始化顶点 C 坐标在圆周上
        const data = state.inscribed;
        data.C = { x: data.O.x, y: data.O.y - data.R };
    } else if (tabId === "tangent-properties") {
        stepGuideIndicator.innerHTML = "💡 当前探索：切线长定理与切线性质";
    }

    renderActiveTab();
    updateHUDContent();
    initActionButtons();
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

    // 绑定画布空白处的点击事件进行解锁重置 (Tap-to-Reset)
    svg.addEventListener("click", (e) => {
        if (e.target === svg || e.target.id === "svg-grid-layer" || e.target.tagName === "rect" && e.target.getAttribute("fill") === "url(#grid-dots)") {
            if (lockedElement !== null) {
                lockedElement = null;
                playClickSound();
                renderActiveTab();
            }
        }
    });

    drawGrid();
    initDragEvents();
    switchTab("perpendicular-chord");
}

function resetCurrentTopic() {
    if (isSweeping && sweepTimerId) clearInterval(sweepTimerId);
    if (isFolding && foldTimerId) clearInterval(foldTimerId);
    activeDragId = null;
    dragOffset = { x: 0, y: 0 };
    hoveredElement = null;
    lockedElement = null;
    showPythSquares = false;
    isSweeping = false;
    sweepTimerId = null;
    isFolding = false;
    foldProgress = 0;
    foldTimerId = null;
    foldDirection = 1;
    state.chord = {
        O: { x: 260, y: 210 },
        R: 120,
        D: { x: 260, y: 260 }
    };
    state.inscribed = {
        O: { x: 260, y: 210 },
        R: 110,
        angleA: 210,
        angleB: 330,
        C: { x: 260, y: 100 }
    };
    state.tangent = {
        O: { x: 200, y: 210 },
        R: 85,
        P: { x: 420, y: 210 }
    };
    switchTab(activeTab);
}

window.__MATH_TOPIC_RESET__jm_topic_m13 = resetCurrentTopic;

document.addEventListener("DOMContentLoaded", init);

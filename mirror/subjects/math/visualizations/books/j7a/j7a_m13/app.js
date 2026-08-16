/**
 * 数轴区间与有理数大小比较演示仪 - 课件交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态与参数
    // ==========================================================================
    let currentScene = "point-modeling"; // point-modeling | comparison-modeling | interval-modeling
    let isSnappingEnabled = true;
    let isHudExpanded = false;

    // 数轴物理坐标参数 (在 centerModel 里动态解算)
    let unitWidth = 85;  // 1个刻度单位所占像素宽度
    let O = { x: 500, y: 250 }; // 数轴原点 0 点的屏幕坐标
    const TICK_INTERVAL = 1; // 整数刻度间隔

    // 常用缩放平移
    let zoomScale = 1.0;
    let panX = 0, panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // 场景 1：有理数与点
    let valA = 1.8;

    // 场景 2：有理数大小比较
    let valCompA = -2.5;
    let valCompB = 1.5;

    // 场景 3：数轴区间与不等式
    let intervalMode = "between"; // greater-than | less-than | between | abs-less-than | abs-greater-than
    let valIntA = -2.0; // 区间左端点 a
    let valIntB = 3.0;  // 区间右端点 b
    let isInclusiveA = false; // 端点 a 是否包含 (实心/开闭)
    let isInclusiveB = true;  // 端点 b 是否包含

    // 鼠标/手势拖拽点状态
    let activeDragPoint = null; // "A" | "CompA" | "CompB" | "IntA" | "IntB"
    let dragStartInfo = null;
    let activeDragMoved = false;
    let suppressNextEndpointClick = false;
    const activeTouches = new Map();
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let pinchStartPanX = 0;
    let pinchStartPanY = 0;
    let pinchStartMidpoint = { x: 0, y: 0 };

    // LERP 平滑过渡渲染值 (为参数调节滑块提供视觉平滑过渡)
    const renderValues = {
        valA: 1.8,
        valCompA: -2.5,
        valCompB: 1.5,
        valIntA: -2.0,
        valIntB: 3.0
    };
    let lastSvgDrawHtml = "";
    let lastOverlayHtml = "";
    let lastHudHtml = "";

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");

    const slidersContainer = document.getElementById("sliders-container");
    const presetButtonsContainer = document.getElementById("preset-buttons-container");
    const btnToggleSnap = document.getElementById("btn-toggle-snap");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const modalHelp = document.getElementById("modal-help");
    const btnCloseHelp = document.getElementById("btn-close-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");

    // ==========================================================================
    // 3. 数轴数学映射函数
    // ==========================================================================
    // 数值 -> 屏幕X坐标
    function getPixelX(val) {
        return O.x + val * unitWidth;
    }

    // 屏幕X坐标 -> 数值
    function getMathVal(px) {
        return (px - O.x) / unitWidth;
    }

    // 数值吸附约束
    function snapValue(val) {
        if (!isSnappingEnabled) return val;
        // 吸附到最近的 0.1
        return Math.round(val * 10) / 10;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function computeLabelOffset(x, preferredLevel = 0) {
        const margin = 18;
        const W = sandboxWrapper.clientWidth || 1000;
        const nearLeft = x < margin + 58;
        const nearRight = x > W - margin - 58;
        const verticalLevels = [-28, -56, -84, 32];
        let topOffset = verticalLevels[preferredLevel] ?? -28;
        let xOffset = 0;
        let anchor = "top";

        if (nearLeft) {
            xOffset = 46;
            anchor = "left-edge";
        } else if (nearRight) {
            xOffset = -46;
            anchor = "right-edge";
        }
        if (preferredLevel === 3) anchor = "bottom";

        return { xOffset, topOffset, anchor };
    }

    function makeCoordLabel(id, className, x, y, text, preferredLevel = 0) {
        const offset = computeLabelOffset(x, preferredLevel);
        const left = x + offset.xOffset;
        const top = y + offset.topOffset;
        return `<div class="coord-label-box ${className}" data-label-id="${id}" data-label-anchor="${offset.anchor}" style="left:${left}px; top:${top}px">${text}</div>`;
    }

    function getTeachingStatus() {
        if (currentScene === "point-modeling") {
            const side = valA > 0 ? "原点右侧" : (valA < 0 ? "原点左侧" : "原点");
            return {
                tone: "is-demo",
                title: `A = ${valA.toFixed(1)}`,
                detail: side === "原点" ? "0 既不是正数，也不是负数。" : `点 A 在${side}，到 0 的距离是 ${Math.abs(valA).toFixed(1)}。`
            };
        }
        if (currentScene === "comparison-modeling") {
            const relation = valCompA < valCompB ? "<" : (valCompA > valCompB ? ">" : "=");
            const bigger = valCompA === valCompB ? "A、B 重合" : (valCompA > valCompB ? "A 在右侧" : "B 在右侧");
            return {
                tone: valCompA < 0 && valCompB < 0 ? "is-proof" : "is-result",
                title: `A ${relation} B`,
                detail: `${bigger}。数轴上越靠右，数值越大。`
            };
        }

        let title = "Interval";
        if (intervalMode === "greater-than") title = isInclusiveA ? "x >= a" : "x > a";
        else if (intervalMode === "less-than") title = isInclusiveA ? "x <= a" : "x < a";
        else if (intervalMode === "between") {
            const leftInclusive = valIntA <= valIntB ? isInclusiveA : isInclusiveB;
            const rightInclusive = valIntA <= valIntB ? isInclusiveB : isInclusiveA;
            title = `a ${leftInclusive ? "<=" : "<"} x ${rightInclusive ? "<=" : "<"} b`;
        }
        else if (intervalMode === "abs-less-than") title = `|x| ${isInclusiveA ? "<=" : "<"} ${Math.abs(valIntA).toFixed(1)}`;
        else if (intervalMode === "abs-greater-than") title = `|x| ${isInclusiveA ? ">=" : ">"} ${Math.abs(valIntA).toFixed(1)}`;
        return {
            tone: "is-result",
            title,
            detail: "轻点端点切换开闭，拖动端点改变边界。"
        };
    }

    function getControlHint() {
        if (currentScene === "point-modeling") {
            return "右侧只负责调节点 A 的数值；拖动数轴上的点 A 可以获得同样的效果。开启吸附时，数值按 0.1 刻度变化。";
        }
        if (currentScene === "comparison-modeling") {
            return "右侧 A、B 两个滑杆只用于微调两个点的位置；比较方法、绝对值难点和结论统一放在本板书中查看。";
        }
        if (intervalMode === "between") {
            return "右侧只调节 a、b 两个端点和端点是否包含；区间含义、不等式写法和开闭端点规则统一放在本板书中查看。";
        }
        if (intervalMode === "abs-less-than" || intervalMode === "abs-greater-than") {
            return "右侧只调节绝对值边界 a 和是否包含边界；对称区间的几何意义统一放在本板书中查看。";
        }
        return "右侧只调节端点 a 和是否包含边界；不等式方向、端点开闭和区间含义统一放在本板书中查看。";
    }

    // ==========================================================================
    // 4. LERP 渲染平滑循环
    // ==========================================================================
    function updateLerp() {
        const k = 0.22; // LERP 衰减系数
        const easeValue = (key, target) => {
            const diff = target - renderValues[key];
            if (Math.abs(diff) < 0.001) {
                renderValues[key] = target;
            } else {
                renderValues[key] += diff * k;
            }
        };
        easeValue("valA", valA);
        easeValue("valCompA", valCompA);
        easeValue("valCompB", valCompB);
        easeValue("valIntA", valIntA);
        easeValue("valIntB", valIntB);

        renderSVG();
        updateHTMLOverlayAndHUD();
        requestAnimationFrame(updateLerp);
    }

    // ==========================================================================
    // 5. SVG 路径生成器
    // ==========================================================================
    // 渲染斜线纹理 Pattern 定义 (在 DOM 加载时只定义一次)
    function injectPatternDefs() {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <pattern id="diagonal-stripes" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="var(--color-interval)" stroke-width="3" opacity="0.15" />
            </pattern>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-point-a)" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-point-b)" />
            </marker>
        `;
        sandboxSvg.appendChild(defs);
    }

    // 绘制可拖动点标记 (把手)
    function drawDraggablePoint(id, x, y, colorClass, isSolid = true) {
        const fillStyle = isSolid ? `fill: var(--color-${colorClass});` : `fill: #ffffff; stroke: var(--color-${colorClass}); stroke-width:3px;`;
        const endpointAttr = id === "IntA" || id === "IntB" ? ` data-endpoint-toggle="${id}"` : "";
        return `
            <g class="geo-point-wrapper draggable ${colorClass === 'point-b' ? 'point-b' : (colorClass === 'interval' ? 'point-interval' : '')}" data-point-id="${id}"${endpointAttr}>
                <circle class="geo-point-halo" cx="${x}" cy="${y}" r="15"></circle>
                <circle class="geo-point" style="${fillStyle}" cx="${x}" cy="${y}" r="6.5"></circle>
            </g>
        `;
    }

    // ==========================================================================
    // 6. SVG 主渲染逻辑
    // ==========================================================================
    function renderSVG() {
        let drawHtml = "";
        const axisY = O.y;

        // 1. 绘制基本数轴线 (带正方向箭头)
        const leftLimitX = O.x - 5.8 * unitWidth;
        const rightLimitX = O.x + 5.8 * unitWidth;
        
        drawHtml += `
            <!-- 数轴主干线 -->
            <line class="geo-line-seg axis-line" x1="${leftLimitX}" y1="${axisY}" x2="${rightLimitX}" y2="${axisY}"></line>
            <!-- 正方向箭头 -->
            <path d="M ${rightLimitX} ${axisY} L ${rightLimitX - 12} ${axisY - 6} L ${rightLimitX - 12} ${axisY + 6} Z" fill="#0f172a"></path>
            <text class="geo-label" style="font-weight:700;" x="${rightLimitX + 10}" y="${axisY + 4}">x</text>
        `;

        // 2. 绘制整数刻度线和标记 (-5 到 5)
        for (let i = -5; i <= 5; i++) {
            const tickX = getPixelX(i);
            const isOrigin = i === 0;
            const tickH = isOrigin ? 12 : 7;
            const tickClass = isOrigin ? "origin-tick" : "tick-line";
            const labelClass = isOrigin ? "tick-label origin-label" : "tick-label";

            drawHtml += `
                <!-- 刻度线 -->
                <line class="${tickClass}" x1="${tickX}" y1="${axisY - tickH}" x2="${tickX}" y2="${axisY + tickH}"></line>
                <!-- 刻度文字 -->
                <text class="${labelClass}" x="${tickX}" y="${axisY + 24}" text-anchor="middle">${i}</text>
            `;
        }

        // ==========================================================================
        // 场景 1: 有理数与点
        // ==========================================================================
        if (currentScene === "point-modeling") {
            const curA = renderValues.valA;
            const pxA = getPixelX(curA);

            // 绘制绝对值距离指示 (到原点 O 的投影线段)
            if (Math.abs(curA) > 0.01) {
                const pxOrigin = O.x;
                const pathY = axisY - 14;
                drawHtml += `
                    <!-- 绝对值橙色虚线段 -->
                    <line class="abs-range-line" x1="${pxOrigin}" y1="${pathY}" x2="${pxA}" y2="${pathY}"></line>
                    <!-- 绝对值指示括号 -->
                    <text class="geo-label" style="fill: var(--color-abs); font-weight:700; font-size:12px;" x="${(pxOrigin + pxA)/2}" y="${pathY - 8}" text-anchor="middle">绝对值 |x| = ${Math.abs(curA).toFixed(1)}</text>
                `;
            }

            // 绘制点 A
            drawHtml += drawDraggablePoint("A", pxA, axisY, "point-a", true);
        }

        // ==========================================================================
        // 场景 2: 有理数大小比较
        // ==========================================================================
        else if (currentScene === "comparison-modeling") {
            const curA = renderValues.valCompA;
            const curB = renderValues.valCompB;
            const pxA = getPixelX(curA);
            const pxB = getPixelX(curB);

            // 1. 负负比较时的绝对值特写投影段
            if (curA < 0 && curB < 0) {
                const pxOrigin = O.x;
                const absLabelsAreClose = Math.abs(pxA - pxB) < 120;
                const yA = axisY - (absLabelsAreClose ? 22 : 16);
                const yB = axisY - (absLabelsAreClose ? 48 : 28);
                const labelAX = (pxA + pxOrigin) / 2 - (absLabelsAreClose ? 28 : 0);
                const labelBX = (pxB + pxOrigin) / 2 + (absLabelsAreClose ? 32 : 0);

                drawHtml += `
                    <!-- A 到原点的距离 -->
                    <line class="abs-range-line" style="stroke: var(--color-point-a);" x1="${pxA}" y1="${yA}" x2="${pxOrigin}" y2="${yA}"></line>
                    <text class="geo-label abs-value-label" style="fill: var(--color-point-a); font-size:11px;" x="${labelAX}" y="${yA - 6}" text-anchor="middle">|A| = ${Math.abs(curA).toFixed(1)}</text>
                    
                    <!-- B 到原点的距离 -->
                    <line class="abs-range-line" style="stroke: var(--color-point-b);" x1="${pxB}" y1="${yB}" x2="${pxOrigin}" y2="${yB}"></line>
                    <text class="geo-label abs-value-label" style="fill: var(--color-point-b); font-size:11px;" x="${labelBX}" y="${yB - 6}" text-anchor="middle">|B| = ${Math.abs(curB).toFixed(1)}</text>
                `;
            }

            // 2. 指向右侧（较大数）的对比箭头
            if (Math.abs(curA - curB) > 0.05) {
                const startArrowX = curA < curB ? pxA + 10 : pxA - 10;
                const endArrowX = curA < curB ? pxB - 10 : pxB + 10;
                const arrowY = axisY + 40;
                const colorArrow = curA < curB ? "var(--color-point-b)" : "var(--color-point-a)";

                drawHtml += `
                    <!-- 对比大小指向箭头 -->
                    <line x1="${startArrowX}" y1="${arrowY}" x2="${endArrowX}" y2="${arrowY}" 
                          stroke="${colorArrow}" stroke-width="2" stroke-dasharray="4,2" 
                          marker-end="url(#arrow${curA < curB ? '-blue' : ''})"></line>
                    <text class="geo-label" style="fill: ${colorArrow}; font-size:11px;" x="${(startArrowX + endArrowX)/2}" y="${arrowY + 14}" text-anchor="middle">右侧的数总比左侧的大</text>
                `;
            }

            // 绘制点 A 与 点 B
            drawHtml += drawDraggablePoint("CompA", pxA, axisY, "point-a", true);
            drawHtml += drawDraggablePoint("CompB", pxB, axisY, "point-b", true);
        }

        // ==========================================================================
        // 场景 3: 数轴区间与不等式
        // ==========================================================================
        else if (currentScene === "interval-modeling") {
            const curIntA = renderValues.valIntA;
            const curIntB = renderValues.valIntB;
            const pxIntA = getPixelX(curIntA);
            const pxIntB = getPixelX(curIntB);

            const shH = 14; // 区间高亮条带高度
            const shY = axisY - shH / 2;

            // 渲染半透明有色区间带与斑马线
            if (intervalMode === "greater-than") {
                const w = rightLimitX - pxIntA;
                drawHtml += `
                    <rect class="interval-shading-rect" x="${pxIntA}" y="${shY}" width="${w}" height="${shH}"></rect>
                    <rect class="interval-shading-pattern" x="${pxIntA}" y="${shY}" width="${w}" height="${shH}"></rect>
                `;
            } else if (intervalMode === "less-than") {
                const w = pxIntA - leftLimitX;
                drawHtml += `
                    <rect class="interval-shading-rect" x="${leftLimitX}" y="${shY}" width="${w}" height="${shH}"></rect>
                    <rect class="interval-shading-pattern" x="${leftLimitX}" y="${shY}" width="${w}" height="${shH}"></rect>
                `;
            } else if (intervalMode === "between") {
                // a < x < b。确保 A <= B
                const leftX = Math.min(pxIntA, pxIntB);
                const rightX = Math.max(pxIntA, pxIntB);
                const w = rightX - leftX;
                drawHtml += `
                    <rect class="interval-shading-rect" x="${leftX}" y="${shY}" width="${w}" height="${shH}"></rect>
                    <rect class="interval-shading-pattern" x="${leftX}" y="${shY}" width="${w}" height="${shH}"></rect>
                `;
            } else if (intervalMode === "abs-less-than") {
                // |x| <= a. a 取绝对值后的正数
                const boundary = Math.max(0.1, Math.abs(curIntA));
                const leftX = getPixelX(-boundary);
                const rightX = getPixelX(boundary);
                const w = rightX - leftX;
                drawHtml += `
                    <rect class="interval-shading-rect" x="${leftX}" y="${shY}" width="${w}" height="${shH}"></rect>
                    <rect class="interval-shading-pattern" x="${leftX}" y="${shY}" width="${w}" height="${shH}"></rect>
                `;
            } else if (intervalMode === "abs-greater-than") {
                // |x| > a.
                const boundary = Math.max(0.1, Math.abs(curIntA));
                const leftX = getPixelX(-boundary);
                const rightX = getPixelX(boundary);
                
                const wLeft = leftX - leftLimitX;
                const wRight = rightLimitX - rightX;
                drawHtml += `
                    <!-- 左半区间 -->
                    <rect class="interval-shading-rect" x="${leftLimitX}" y="${shY}" width="${wLeft}" height="${shH}"></rect>
                    <rect class="interval-shading-pattern" x="${leftLimitX}" y="${shY}" width="${wLeft}" height="${shH}"></rect>
                    
                    <!-- 右半区间 -->
                    <rect class="interval-shading-rect" x="${rightX}" y="${shY}" width="${wRight}" height="${shH}"></rect>
                    <rect class="interval-shading-pattern" x="${rightX}" y="${shY}" width="${wRight}" height="${shH}"></rect>
                `;
            }

            // 绘制端点把手
            if (intervalMode === "greater-than" || intervalMode === "less-than") {
                drawHtml += drawDraggablePoint("IntA", pxIntA, axisY, "interval", isInclusiveA);
            } else if (intervalMode === "between") {
                drawHtml += drawDraggablePoint("IntA", pxIntA, axisY, "point-a", isInclusiveA);
                drawHtml += drawDraggablePoint("IntB", pxIntB, axisY, "point-b", isInclusiveB);
            } else if (intervalMode === "abs-less-than" || intervalMode === "abs-greater-than") {
                // 绝对值对称区间，绘制正侧的主可拖拽点，以及负侧的跟随影子点
                const boundary = Math.max(0.1, Math.abs(curIntA));
                const pxPositive = getPixelX(boundary);
                const pxNegative = getPixelX(-boundary);

                drawHtml += drawDraggablePoint("IntA", pxPositive, axisY, "interval", isInclusiveA);
                
                // 影子点 (不标记可拖动)
                const fillShadowStyle = isInclusiveA ? `fill: var(--color-interval); opacity: 0.65;` : `fill: #ffffff; stroke: var(--color-interval); stroke-width:3px; opacity:0.65;`;
                drawHtml += `
                    <g class="shadow-point-wrapper">
                        <circle cx="${pxNegative}" cy="${axisY}" r="6.5" style="${fillShadowStyle}"></circle>
                    </g>
                `;
            }
        }

        if (drawHtml === lastSvgDrawHtml) return;
        lastSvgDrawHtml = drawHtml;
        sandboxSvg.innerHTML = "";
        injectPatternDefs();
        sandboxSvg.insertAdjacentHTML("beforeend", drawHtml);
    }

    // ==========================================================================
    // 7. HTML 飘浮读数渲染与 HUD 板书更新
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        let overlayHtml = "";
        const axisY = O.y;
        const teachingStatus = getTeachingStatus();
        overlayHtml += `
            <div class="teaching-status-card ${teachingStatus.tone}">
                <span class="status-eyebrow">当前结论</span>
                <strong>${teachingStatus.title}</strong>
                <span id="status-detail">${teachingStatus.detail}</span>
            </div>
        `;

        // A. 悬浮点上方数值气泡
        if (currentScene === "point-modeling") {
            const pxA = getPixelX(renderValues.valA);
            const pointLabelLevel = Math.abs(renderValues.valA) > 0.01 ? 1 : 0;
            overlayHtml += makeCoordLabel("A", "lbl-a", pxA, axisY, `A: ${valA.toFixed(1)}`, pointLabelLevel);
        } else if (currentScene === "comparison-modeling") {
            const pxA = getPixelX(renderValues.valCompA);
            const pxB = getPixelX(renderValues.valCompB);
            const labelsAreClose = Math.abs(pxA - pxB) < 92;
            const labelOffsetA = labelsAreClose ? 2 : 0;
            const labelOffsetB = labelsAreClose ? 1 : 0;
            overlayHtml += makeCoordLabel("CompA", "lbl-a", pxA, axisY, `A: ${valCompA.toFixed(1)}`, labelOffsetA);
            overlayHtml += makeCoordLabel("CompB", "lbl-b", pxB, axisY, `B: ${valCompB.toFixed(1)}`, labelOffsetB);
        } else if (currentScene === "interval-modeling") {
            if (intervalMode === "greater-than" || intervalMode === "less-than") {
                const pxIntA = getPixelX(renderValues.valIntA);
                overlayHtml += makeCoordLabel("IntA", "lbl-interval", pxIntA, axisY, `a: ${valIntA.toFixed(1)}`);
            } else if (intervalMode === "between") {
                const pxIntA = getPixelX(renderValues.valIntA);
                const pxIntB = getPixelX(renderValues.valIntB);
                const labelsAreClose = Math.abs(pxIntA - pxIntB) < 92;
                const labelOffsetA = labelsAreClose ? 1 : 0;
                const labelOffsetB = labelsAreClose ? 0 : 0;
                overlayHtml += makeCoordLabel("IntA", "lbl-a", pxIntA, axisY, `a: ${valIntA.toFixed(1)}`, labelOffsetA);
                overlayHtml += makeCoordLabel("IntB", "lbl-b", pxIntB, axisY, `b: ${valIntB.toFixed(1)}`, labelOffsetB);
            } else if (intervalMode === "abs-less-than" || intervalMode === "abs-greater-than") {
                const boundary = Math.max(0.1, Math.abs(valIntA));
                const pxPositive = getPixelX(boundary);
                overlayHtml += makeCoordLabel("IntA", "lbl-interval", pxPositive, axisY, `a: ${boundary.toFixed(1)}`);
            }
        }
        if (overlayHtml !== lastOverlayHtml) {
            htmlOverlay.innerHTML = overlayHtml;
            lastOverlayHtml = overlayHtml;
        }

        // B. 板书 HUD 内容更新
        updateHUDContent();
    }

    function updateHUDContent() {
        let html = "";
        
        // 场景 1：有理数与点
        if (currentScene === "point-modeling") {
            const signText = valA > 0 ? "正有理数" : (valA < 0 ? "负有理数" : "零 (既不是正数也不是负数)");
            const distance = Math.abs(valA);

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">实际应用与题干</div>
                    <div class="hud-row-val" style="font-size:12.5px;">
                        在数轴上绘制出代表有理数 <span class="math-seg seg-a" data-highlight="A">${valA.toFixed(1)}</span> 的点 A。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">操作提示</div>
                    <div class="hud-row-val" style="font-size:12px; line-height:1.45;">
                        ${getControlHint()}
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">数轴表示解析</div>
                    <div class="hud-row-val">
                        点 A 在原点的 <span style="color:var(--color-point-a);">${valA >= 0 ? '右侧' : '左侧'}</span>，对应数值为 ${valA.toFixed(1)}。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">有理数分类</div>
                    <div class="hud-row-val" style="color: var(--color-point-a);">
                        ${signText}
                    </div>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">几何性质：绝对值 (到原点的距离)</div>
                    <div class="formula">
                        |A| = |<span class="math-seg seg-a" data-highlight="A">${valA.toFixed(1)}</span>| = <span style="color: var(--color-abs);">${distance.toFixed(1)}</span>
                    </div>
                </div>
            `;
        } 
        
        // 场景 2：有理数大小比较
        else if (currentScene === "comparison-modeling") {
            const relation = valCompA < valCompB ? "<" : (valCompA > valCompB ? ">" : "=");
            let ruleTitle = "有理数大小比较规则";
            let ruleContent = "";

            if (valCompA >= 0 && valCompB >= 0) {
                ruleTitle = "正数与零的大小比较";
                ruleContent = "正数大于零，零大于负数，正数大于一切负数。两个正数比较，绝对值大的数大。";
            } else if ((valCompA < 0 && valCompB >= 0) || (valCompA >= 0 && valCompB < 0)) {
                ruleTitle = "正负数与零的大小比较";
                ruleContent = "正数总是在原点右侧，负数总是在原点左侧。因此，<strong>正数 > 负数</strong>，<strong>正数 > 0 > 负数</strong>。";
            } else {
                // 两个负数比较
                ruleTitle = "🔥 核心难点：两个负数比较大小";
                ruleContent = `
                    <p style="margin-bottom:4px;">法则：<strong>两个负数比较，绝对值大的反而小</strong>。</p>
                    <p style="font-size:12px; color:var(--text-secondary);">
                        因为绝对值代表到原点的距离。在原点左侧，距离原点越远的负数，其在数轴上的位置越偏左，因此数值越小。
                    </p>
                `;
            }

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">当前数值</div>
                    <div class="hud-row-val" style="font-size:13px;">
                        点 A = <span class="math-seg seg-a" data-highlight="CompA">${valCompA.toFixed(1)}</span> ，
                        点 B = <span class="math-seg seg-b" data-highlight="CompB">${valCompB.toFixed(1)}</span>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">操作提示</div>
                    <div class="hud-row-val" style="font-size:12px; line-height:1.45;">
                        ${getControlHint()}
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">比较性质法则</div>
                    <div class="hud-row-val" style="font-size:12px; line-height:1.4;">
                        ${ruleContent}
                    </div>
                </div>
            `;

            // 如果同为负数，详细列出证明步骤
            if (valCompA < 0 && valCompB < 0) {
                const absA = Math.abs(valCompA);
                const absB = Math.abs(valCompB);
                const absRelation = absA > absB ? ">" : (absA < absB ? "<" : "=");
                
                html += `
                    <div class="hud-equation-box success-box">
                        <div class="title">步骤证明 (负负比较)</div>
                        <div class="formula" style="font-size:14px; line-height:1.6;">
                            <div>1. 求绝对值：|A| = ${absA.toFixed(1)}, |B| = ${absB.toFixed(1)}</div>
                            <div>2. 绝对值大小：|A| ${absRelation} |B|</div>
                            <div>3. 结论反转：A <span style="color:var(--color-abs);">${relation}</span> B</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="hud-equation-box">
                        <div class="title">数轴大小结论</div>
                        <div class="formula">
                            A (${valCompA.toFixed(1)}) <span style="color:var(--color-point-a);">${relation}</span> B (${valCompB.toFixed(1)})
                        </div>
                    </div>
                `;
            }
        } 
        
        // 场景 3：数轴区间与不等式
        else if (currentScene === "interval-modeling") {
            let symbolA = isInclusiveA ? "≥" : "＞";
            let symbolB = isInclusiveB ? "≤" : "＜";
            
            let mathExpression = "";
            let description = "";

            if (intervalMode === "greater-than") {
                mathExpression = `x ${symbolA} a`;
                description = `在数轴上表示为自端点 <span class="math-seg seg-interval" data-highlight="IntA">a = ${valIntA.toFixed(1)}</span> 向右延伸的区域。端点为${isInclusiveA ? '实心点' : '空心点'}，表示${isInclusiveA ? '包含' : '不包含'}该边界。`;
            } else if (intervalMode === "less-than") {
                let sym = isInclusiveA ? "≤" : "＜";
                mathExpression = `x ${sym} a`;
                description = `在数轴上表示为自端点 <span class="math-seg seg-interval" data-highlight="IntA">a = ${valIntA.toFixed(1)}</span> 向左延伸的区域。端点为${isInclusiveA ? '实心点' : '空心点'}，表示${isInclusiveA ? '包含' : '不包含'}该边界。`;
            } else if (intervalMode === "between") {
                // 确保 a < b
                const left = Math.min(valIntA, valIntB);
                const right = Math.max(valIntA, valIntB);
                const symL = valIntA <= valIntB ? (isInclusiveA ? "≤" : "＜") : (isInclusiveB ? "≤" : "＜");
                const symR = valIntA <= valIntB ? (isInclusiveB ? "≤" : "＜") : (isInclusiveA ? "≤" : "＜");

                mathExpression = `${left.toFixed(1)} ${symL} x ${symR} ${right.toFixed(1)}`;
                description = `在数轴上表示在端点 <span class="math-seg seg-a" data-highlight="IntA">${valIntA.toFixed(1)}</span> 与端点 <span class="math-seg seg-b" data-highlight="IntB">${valIntB.toFixed(1)}</span> 之间的线段区域。双击端点把手可直接切换对应开闭。`;
            } else if (intervalMode === "abs-less-than") {
                const boundary = Math.max(0.1, Math.abs(valIntA));
                let sym = isInclusiveA ? "≤" : "＜";
                mathExpression = `|x| ${sym} ${boundary.toFixed(1)}`;
                description = `表示绝对值小于${isInclusiveA ? '或等于' : ''} ${boundary.toFixed(1)} 的所有有理数的集合。几何上表现为数轴上到原点的距离在 ${boundary.toFixed(1)} 以内的区间，即：<br><strong>-${boundary.toFixed(1)} ${sym} x ${sym} ${boundary.toFixed(1)}</strong>`;
            } else if (intervalMode === "abs-greater-than") {
                let sym = isInclusiveA ? "≥" : "＞";
                const boundary = Math.max(0.1, Math.abs(valIntA));
                mathExpression = `|x| ${sym} ${boundary.toFixed(1)}`;
                description = `表示绝对值大于${isInclusiveA ? '或等于' : ''} ${boundary.toFixed(1)} 的所有有理数集合。几何上表现为数轴上到原点距离在 ${boundary.toFixed(1)} 以外的双向区域，即：<br><strong>x ${isInclusiveA ? '≤' : '＜'} -${boundary.toFixed(1)} 或 x ${sym} ${boundary.toFixed(1)}</strong>`;
            }

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">区间解析</div>
                    <div class="hud-row-val" style="font-size:12px; line-height:1.4;">
                        ${description}
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">操作提示</div>
                    <div class="hud-row-val" style="font-size:12px; line-height:1.45;">
                        ${getControlHint()}
                    </div>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">代数不等式表示</div>
                    <div class="formula">
                        ${mathExpression}
                    </div>
                </div>
                <div class="hud-row" style="margin-top: 10px; border-top: 1px dashed rgba(226,232,240,0.8); padding-top:10px;">
                    <div class="hud-row-val" style="font-size:11.5px; font-weight:normal; color:var(--text-secondary);">
                        💡 <strong>小贴士</strong>：双击数轴上的端点把手，即可在 <strong>空心圆(开区间)</strong> 与 <strong>实心圆(闭区间)</strong> 之间来回切换。
                    </div>
                </div>
            `;
        }

        if (html !== lastHudHtml) {
            stepsChalkboard.innerHTML = html;
            lastHudHtml = html;
        }
    }

    // ==========================================================================
    // 8. 右侧控制面板生成器
    // ==========================================================================
    function makeSliderControl({ rowClass = "", token, meta, sliderId, min, max, step = "0.1", value, indicatorId, displayValue = value }) {
        return `
            <div class="slider-row control-value-row ${rowClass}">
                <div class="control-row-head">
                    <span class="control-token">${token}</span>
                    <span class="control-meta">${meta}</span>
                    <span class="slider-val-indicator" id="${indicatorId}">${Number(displayValue).toFixed(1)}</span>
                </div>
                <input type="range" id="${sliderId}" min="${min}" max="${max}" step="${step}" value="${value}">
            </div>
        `;
    }

    function loadSlidersForScene() {
        let html = "";
        
        if (currentScene === "point-modeling") {
            html = makeSliderControl({
                token: "A",
                meta: "位置",
                sliderId: "slider-val-a",
                min: "-5",
                max: "5",
                value: valA,
                indicatorId: "val-indicator-a"
            });
        } else if (currentScene === "comparison-modeling") {
            html = `
                ${makeSliderControl({
                    token: "A",
                    meta: "比较点",
                    sliderId: "slider-comp-a",
                    min: "-5",
                    max: "5",
                    value: valCompA,
                    indicatorId: "val-indicator-comp-a"
                })}
                ${makeSliderControl({
                    rowClass: "slider-row-b",
                    token: "B",
                    meta: "比较点",
                    sliderId: "slider-comp-b",
                    min: "-5",
                    max: "5",
                    value: valCompB,
                    indicatorId: "val-indicator-comp-b"
                })}
            `;
        } else if (currentScene === "interval-modeling") {
            // 区间模式下，滑块取决于当前的区间类型
            if (intervalMode === "greater-than" || intervalMode === "less-than") {
                html = `
                    ${makeSliderControl({
                        token: "a",
                        meta: "端点",
                        sliderId: "slider-int-a",
                        min: "-5",
                        max: "5",
                        value: valIntA,
                        indicatorId: "val-indicator-int-a"
                    })}
                    <div class="btn-group-endpoints">
                        <button class="btn-sub-toggle ${isInclusiveA ? 'active' : ''}" id="btn-toggle-inc-a">包含</button>
                        <button class="btn-sub-toggle ${!isInclusiveA ? 'active' : ''}" id="btn-toggle-exc-a">不含</button>
                    </div>
                `;
            } else if (intervalMode === "between") {
                html = `
                    ${makeSliderControl({
                        token: "a",
                        meta: "左端点",
                        sliderId: "slider-int-a",
                        min: "-5",
                        max: "5",
                        value: valIntA,
                        indicatorId: "val-indicator-int-a"
                    })}
                    ${makeSliderControl({
                        rowClass: "slider-row-b",
                        token: "b",
                        meta: "右端点",
                        sliderId: "slider-int-b",
                        min: "-5",
                        max: "5",
                        value: valIntB,
                        indicatorId: "val-indicator-int-b"
                    })}
                    <div class="btn-group-endpoints">
                        <button class="btn-sub-toggle ${isInclusiveA ? 'active' : ''}" id="btn-toggle-inc-a">a 含</button>
                        <button class="btn-sub-toggle ${isInclusiveB ? 'active' : ''}" id="btn-toggle-inc-b">b 含</button>
                    </div>
                `;
            } else if (intervalMode === "abs-less-than" || intervalMode === "abs-greater-than") {
                const boundary = Math.max(0.1, Math.abs(valIntA));
                html = `
                    ${makeSliderControl({
                        token: "|a|",
                        meta: "边界",
                        sliderId: "slider-int-a",
                        min: "0.1",
                        max: "5",
                        value: boundary,
                        indicatorId: "val-indicator-int-a",
                        displayValue: boundary
                    })}
                    <div class="btn-group-endpoints">
                        <button class="btn-sub-toggle ${isInclusiveA ? 'active' : ''}" id="btn-toggle-inc-a">包含</button>
                        <button class="btn-sub-toggle ${!isInclusiveA ? 'active' : ''}" id="btn-toggle-exc-a">不含</button>
                    </div>
                `;
            }
        }

        slidersContainer.innerHTML = html;
        bindSliderEvents();
    }

    function bindSliderEvents() {
        if (currentScene === "point-modeling") {
            const slider = document.getElementById("slider-val-a");
            if (slider) {
                slider.addEventListener("input", (e) => {
                    let v = parseFloat(e.target.value);
                    valA = snapValue(v);
                    document.getElementById("val-indicator-a").textContent = valA.toFixed(1);
                });
            }
        } else if (currentScene === "comparison-modeling") {
            const sliderA = document.getElementById("slider-comp-a");
            const sliderB = document.getElementById("slider-comp-b");
            if (sliderA && sliderB) {
                sliderA.addEventListener("input", (e) => {
                    let v = parseFloat(e.target.value);
                    valCompA = snapValue(v);
                    document.getElementById("val-indicator-comp-a").textContent = valCompA.toFixed(1);
                });
                sliderB.addEventListener("input", (e) => {
                    let v = parseFloat(e.target.value);
                    valCompB = snapValue(v);
                    document.getElementById("val-indicator-comp-b").textContent = valCompB.toFixed(1);
                });
            }
        } else if (currentScene === "interval-modeling") {
            const sliderA = document.getElementById("slider-int-a");
            const sliderB = document.getElementById("slider-int-b");
            if (sliderA) {
                sliderA.addEventListener("input", (e) => {
                    let v = parseFloat(e.target.value);
                    valIntA = snapValue(v);
                    document.getElementById("val-indicator-int-a").textContent = Math.abs(valIntA).toFixed(1);
                });
            }
            if (sliderB) {
                sliderB.addEventListener("input", (e) => {
                    let v = parseFloat(e.target.value);
                    valIntB = snapValue(v);
                    document.getElementById("val-indicator-int-b").textContent = valIntB.toFixed(1);
                });
            }

            // 开闭端点选择按钮
            const btnIncA = document.getElementById("btn-toggle-inc-a");
            const btnExcA = document.getElementById("btn-toggle-exc-a");
            const btnIncB = document.getElementById("btn-toggle-inc-b");

            if (btnIncA) {
                btnIncA.addEventListener("click", () => {
                    if (!btnExcA) {
                        toggleEndpointInclusion("IntA");
                        return;
                    }
                    isInclusiveA = true;
                    loadSlidersForScene();
                });
            }
            if (btnExcA) {
                btnExcA.addEventListener("click", () => {
                    isInclusiveA = false;
                    loadSlidersForScene();
                });
            }
            if (btnIncB) {
                btnIncB.addEventListener("click", () => {
                    isInclusiveB = !isInclusiveB;
                    loadSlidersForScene();
                });
            }
        }
    }

    // 按场景注入预设问题与解析内容
    function updateScenePresetsAndTheory() {
        let presetHtml = "";
        let theoryTitleText = "💡 概念原理解析";
        let theoryBody = "";

        if (currentScene === "point-modeling") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="pos-dec">正小数 (1.8)</button>
                <button class="btn-preset-problem" data-preset="neg-frac">负有理数 (-2.5)</button>
                <button class="btn-preset-problem" data-preset="zero">原点零 (0)</button>
                <button class="btn-preset-problem" data-preset="neg-dec">负小数 (-4.2)</button>
            `;
            theoryTitleText = "💡 数轴与有理数概念";
            theoryBody = `
                <p><strong>数轴三要素</strong>：数轴是一条规定了<strong>原点</strong>、<strong>正方向</strong>和<strong>单位长度</strong>的直线。</p>
                <p>任何有理数都可以用数轴上的一个点来表示：</p>
                <ul>
                    <li>正数表示在原点的右侧；</li>
                    <li>负数表示在原点的左侧；</li>
                    <li>零点由原点代表。</li>
                </ul>
            `;
        } else if (currentScene === "comparison-modeling") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="neg-neg">负负比较 (-3.5 vs -1.5)</button>
                <button class="btn-preset-problem" data-preset="pos-neg">正负比较 (2.0 vs -4.0)</button>
                <button class="btn-preset-problem" data-preset="zero-neg">零与负数 (0 vs -2.5)</button>
                <button class="btn-preset-problem" data-preset="pos-pos">正正比较 (1.5 vs 4.5)</button>
            `;
            theoryTitleText = "💡 有理数大小比较规律";
            theoryBody = `
                <p><strong>几何大小规律</strong>：在数轴上，表示的两个数，右边的数总是大于左边的数。</p>
                <p><strong>绝对值规律（负负比较）</strong>：</p>
                <p>两个负数比较大小，<strong>绝对值大的反而小</strong>。因为负数在原点左侧，绝对值越大，代表距离原点越远（更偏左），所以在数轴上更靠左边，值越小。</p>
            `;
        } else if (currentScene === "interval-modeling") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="greater">大于 a (x > 1.5)</button>
                <button class="btn-preset-problem" data-preset="less">小于等于 a (x ≤ -1.0)</button>
                <button class="btn-preset-problem" data-preset="between-int">闭区间 (-2 ≤ x ≤ 3)</button>
                <button class="btn-preset-problem" data-preset="abs-less">绝对值小于 (|x| < 2.5)</button>
                <button class="btn-preset-problem" data-preset="abs-greater">绝对值大于 (|x| ≥ 3.0)</button>
            `;
            theoryTitleText = "💡 不等式与区间表示";
            theoryBody = `
                <p>在数轴上画不等式区间时，我们使用<strong>端点圈</strong>和<strong>阴影带</strong>：</p>
                <ul>
                    <li><strong>空心圆圈</strong>：对应“大于” ($\gt$) 或“小于” ($\lt$)，表示该边界值不包含在解集中；</li>
                    <li><strong>实心圆点</strong>：对应“大于等于” ($\ge$) 或“小于等于” ($\le$)，表示该边界值包含在解集中。</li>
                </ul>
            `;
        }

        presetButtonsContainer.innerHTML = presetHtml;
        theoryTitle.innerHTML = theoryTitleText;
        theoryText.innerHTML = theoryBody;

        // 绑定预设点击事件
        document.querySelectorAll(".btn-preset-problem").forEach(btn => {
            btn.addEventListener("click", () => {
                const presetId = btn.getAttribute("data-preset");
                applyPreset(presetId);
            });
        });
    }

    function applyPreset(presetId) {
        if (presetId === "pos-dec") {
            valA = 1.8;
        } else if (presetId === "neg-frac") {
            valA = -2.5;
        } else if (presetId === "zero") {
            valA = 0.0;
        } else if (presetId === "neg-dec") {
            valA = -4.2;
        } 
        
        else if (presetId === "neg-neg") {
            valCompA = -3.5;
            valCompB = -1.5;
        } else if (presetId === "pos-neg") {
            valCompA = 2.0;
            valCompB = -4.0;
        } else if (presetId === "zero-neg") {
            valCompA = 0.0;
            valCompB = -2.5;
        } else if (presetId === "pos-pos") {
            valCompA = 1.5;
            valCompB = 4.5;
        } 
        
        else if (presetId === "greater") {
            intervalMode = "greater-than";
            valIntA = 1.5;
            isInclusiveA = false;
        } else if (presetId === "less") {
            intervalMode = "less-than";
            valIntA = -1.0;
            isInclusiveA = true;
        } else if (presetId === "between-int") {
            intervalMode = "between";
            valIntA = -2.0;
            valIntB = 3.0;
            isInclusiveA = true;
            isInclusiveB = true;
        } else if (presetId === "abs-less") {
            intervalMode = "abs-less-than";
            valIntA = 2.5;
            isInclusiveA = false;
        } else if (presetId === "abs-greater") {
            intervalMode = "abs-greater-than";
            valIntA = 3.0;
            isInclusiveA = true;
        }

        loadSlidersForScene();
    }

    // ==========================================================================
    // 9. 场景加载逻辑
    // ==========================================================================
    function loadScene(sceneId) {
        currentScene = sceneId;
        
        // 激活对应的预设 Tab
        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === sceneId) btn.classList.add("active");
            else btn.classList.remove("active");
        });

        // 重新初始化各场景默认参数
        if (currentScene === "point-modeling") {
            valA = 1.8;
        } else if (currentScene === "comparison-modeling") {
            valCompA = -2.5;
            valCompB = 1.5;
        } else if (currentScene === "interval-modeling") {
            intervalMode = "between";
            valIntA = -2.0;
            valIntB = 3.0;
            isInclusiveA = false;
            isInclusiveB = true;
        }

        // 重构控制面板与预设
        loadSlidersForScene();
        updateScenePresetsAndTheory();
        centerModel();
    }

    // ==========================================================================
    // 10. 页面自适应与右偏居中 (Prevent UI Overlapping)
    // ==========================================================================
    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        zoomScale = 1.0;
        panX = 0;
        panY = 0;

        const isDesktop = W > 800;
        // HUD 展开宽度为 360px，右侧留有 20px 安全间隙 = 380px；折叠时右侧留有 20px = 230px
        const L_min = isDesktop ? (isHudExpanded ? 390 : 235) : 30;
        const R_max = W - 30; // 右侧边缘留有 30px 安全间隙
        const W_avail = R_max - L_min;

        // 刻度范围从 -5 到 +5，总共有 10 个区间，另留 1.2 个单位的空间给箭头和端点把手，共 11.2 个单位
        const maxUnit = 110;
        const minUnit = 42;
        unitWidth = Math.min(maxUnit, Math.max(minUnit, W_avail / 11.2));

        // 原点 O(0) 的坐标，使得 -5.6 个单位点刚好位于 L_min
        O.x = L_min + 5.6 * unitWidth;
        O.y = H / 2;

        updateTransform();
    }

    function updateTransform() {
        sandboxSvg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        htmlOverlay.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    }

    // ==========================================================================
    // 11. 手势与鼠标拖拽数轴端点
    // ==========================================================================
    function zoomAtCenter(factor) {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;
        const targetX = W / 2;
        const targetY = H / 2;

        const oldScale = zoomScale;
        zoomScale = Math.min(Math.max(zoomScale * factor, 0.45), 3.0);

        panX = targetX - (targetX - panX) * (zoomScale / oldScale);
        panY = targetY - (targetY - panY) * (zoomScale / oldScale);

        updateTransform();
    }

    function syncControlValue(pointId, val) {
        const setControl = (sliderId, indicatorId, value, displayValue = value) => {
            const slider = document.getElementById(sliderId);
            if (slider) slider.value = value;
            const indicator = document.getElementById(indicatorId);
            if (indicator) indicator.textContent = displayValue.toFixed(1);
        };

        if (pointId === "A") {
            valA = val;
            setControl("slider-val-a", "val-indicator-a", val);
        } else if (pointId === "CompA") {
            valCompA = val;
            setControl("slider-comp-a", "val-indicator-comp-a", val);
        } else if (pointId === "CompB") {
            valCompB = val;
            setControl("slider-comp-b", "val-indicator-comp-b", val);
        } else if (pointId === "IntA") {
            if (intervalMode === "abs-less-than" || intervalMode === "abs-greater-than") {
                val = Math.max(0.1, Math.abs(val));
            }
            valIntA = val;
            setControl("slider-int-a", "val-indicator-int-a", val, Math.abs(val));
        } else if (pointId === "IntB") {
            valIntB = val;
            setControl("slider-int-b", "val-indicator-int-b", val);
        }
    }

    function updateValueFromDrag(pointId, clientX) {
        const rect = sandboxSvg.getBoundingClientRect();
        const localX = (clientX - rect.left) / zoomScale;
        let val = getMathVal(localX);
        val = clamp(val, -5.0, 5.0);
        val = snapValue(val);
        syncControlValue(pointId, val);
    }

    function beginDrag(pointId, clientX, clientY) {
        activeDragPoint = pointId;
        activeDragMoved = false;
        dragStartInfo = { pointId, x: clientX, y: clientY };
        sandboxWrapper.classList.add("dragging-point");
    }

    function updateDragMovement(clientX, clientY) {
        if (!dragStartInfo) return;
        const dx = clientX - dragStartInfo.x;
        const dy = clientY - dragStartInfo.y;
        if (Math.hypot(dx, dy) > 8) activeDragMoved = true;
    }

    function handlePointerMove(clientX, clientY) {
        if (!activeDragPoint) return false;
        updateDragMovement(clientX, clientY);
        updateValueFromDrag(activeDragPoint, clientX);
        return true;
    }

    function endDrag() {
        if (activeDragMoved) {
            suppressNextEndpointClick = true;
            window.setTimeout(() => {
                suppressNextEndpointClick = false;
            }, 80);
        }
        activeDragPoint = null;
        activeDragMoved = false;
        dragStartInfo = null;
        sandboxWrapper.classList.remove("dragging-point");
    }

    function toggleEndpointInclusion(pointId) {
        if (currentScene !== "interval-modeling") return;
        if (pointId === "IntA") {
            isInclusiveA = !isInclusiveA;
        } else if (pointId === "IntB" && intervalMode === "between") {
            isInclusiveB = !isInclusiveB;
        } else {
            return;
        }
        loadSlidersForScene();
        updateHUDContent();
    }

    function getTouchDistance(touchA, touchB) {
        return Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
    }

    function getTouchMidpoint(touchA, touchB) {
        return {
            x: (touchA.clientX + touchB.clientX) / 2,
            y: (touchA.clientY + touchB.clientY) / 2
        };
    }

    function trackActiveTouches(touches) {
        activeTouches.clear();
        Array.from(touches).forEach(touch => {
            activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
        });
    }

    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        zoomAtCenter(factor);
    }, { passive: false });

    sandboxWrapper.addEventListener("mousedown", (e) => {
        const ptWrapper = e.target.closest(".geo-point-wrapper");
        if (ptWrapper) {
            const ptId = ptWrapper.getAttribute("data-point-id");
            if (["A", "CompA", "CompB", "IntA", "IntB"].includes(ptId)) {
                beginDrag(ptId, e.clientX, e.clientY);
                e.stopPropagation();
                e.preventDefault();
                return;
            }
        }

        if (e.button === 0) {
            isPanning = true;
            sandboxWrapper.classList.add("panning");
            startPanX = e.clientX - panX;
            startPanY = e.clientY - panY;
            e.preventDefault();
        }
    });

    window.addEventListener("mousemove", (e) => {
        if (handlePointerMove(e.clientX, e.clientY)) {
            return;
        }

        if (isPanning) {
            panX = e.clientX - startPanX;
            panY = e.clientY - startPanY;
            updateTransform();
        }
    });

    window.addEventListener("mouseup", () => {
        endDrag();
        if (isPanning) {
            isPanning = false;
            sandboxWrapper.classList.remove("panning");
        }
    });

    // 移动手势支持
    sandboxWrapper.addEventListener("touchstart", (e) => {
        trackActiveTouches(e.touches);
        if (e.touches.length === 2) {
            const touchA = e.touches[0];
            const touchB = e.touches[1];
            pinchStartDistance = getTouchDistance(touchA, touchB);
            pinchStartScale = zoomScale;
            pinchStartPanX = panX;
            pinchStartPanY = panY;
            pinchStartMidpoint = getTouchMidpoint(touchA, touchB);
            endDrag();
            isPanning = false;
            sandboxWrapper.classList.remove("panning");
            e.preventDefault();
            return;
        }

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                if (["A", "CompA", "CompB", "IntA", "IntB"].includes(ptId)) {
                    beginDrag(ptId, touch.clientX, touch.clientY);
                    e.stopPropagation();
                    return;
                }
            }
            isPanning = true;
            sandboxWrapper.classList.add("panning");
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        trackActiveTouches(e.touches);
        if (e.touches.length === 2) {
            const touchA = e.touches[0];
            const touchB = e.touches[1];
            const nextDistance = getTouchDistance(touchA, touchB);
            if (pinchStartDistance > 0) {
                const factor = nextDistance / pinchStartDistance;
                zoomScale = clamp(pinchStartScale * factor, 0.45, 3.0);
                const midpoint = getTouchMidpoint(touchA, touchB);
                panX = pinchStartPanX + (midpoint.x - pinchStartMidpoint.x);
                panY = pinchStartPanY + (midpoint.y - pinchStartMidpoint.y);
                updateTransform();
            }
            e.preventDefault();
            return;
        }

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (handlePointerMove(touch.clientX, touch.clientY)) {
                e.preventDefault();
            } else if (isPanning) {
                panX = touch.clientX - startPanX;
                panY = touch.clientY - startPanY;
                updateTransform();
                e.preventDefault();
            }
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchend", (e) => {
        const endpointCandidate = activeDragPoint;
        const shouldToggleEndpoint = endpointCandidate && !activeDragMoved && (endpointCandidate === "IntA" || endpointCandidate === "IntB");
        endDrag();
        trackActiveTouches(e.touches);
        if (e.touches.length < 2) {
            pinchStartDistance = 0;
        }
        isPanning = false;
        sandboxWrapper.classList.remove("panning");
        if (shouldToggleEndpoint) {
            suppressNextEndpointClick = true;
            window.setTimeout(() => {
                suppressNextEndpointClick = false;
            }, 180);
            toggleEndpointInclusion(endpointCandidate);
            e.preventDefault();
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("click", (e) => {
        const ptWrapper = e.target.closest(".geo-point-wrapper[data-endpoint-toggle]");
        if (!ptWrapper || suppressNextEndpointClick) return;
        const ptId = ptWrapper.getAttribute("data-point-id");
        toggleEndpointInclusion(ptId);
        e.stopPropagation();
    });

    // 双击把手切换开闭端点
    sandboxWrapper.addEventListener("dblclick", (e) => {
        const ptWrapper = e.target.closest(".geo-point-wrapper");
        if (ptWrapper) {
            e.stopPropagation();
        } else {
            // 双击空白处复位数轴
            centerModel();
        }
    });

    // ==========================================================================
    // 12. HUD 悬浮联动高亮
    // ==========================================================================
    function highlightOnCanvas(target, active) {
        if (target === "A") {
            const el = document.querySelector(".geo-point-wrapper[data-point-id='A']");
            if (el) {
                if (active) el.classList.add("active-glow");
                else el.classList.remove("active-glow");
            }
        } else if (target === "CompA") {
            const el = document.querySelector(".geo-point-wrapper[data-point-id='CompA']");
            if (el) {
                if (active) el.classList.add("active-glow");
                else el.classList.remove("active-glow");
            }
        } else if (target === "CompB") {
            const el = document.querySelector(".geo-point-wrapper[data-point-id='CompB']");
            if (el) {
                if (active) el.classList.add("active-glow-b");
                else el.classList.remove("active-glow-b");
            }
        } else if (target === "IntA" || target === "IntB") {
            const elA = document.querySelector(".geo-point-wrapper[data-point-id='IntA']");
            const elB = document.querySelector(".geo-point-wrapper[data-point-id='IntB']");
            if (elA) {
                if (active) elA.classList.add("active-glow-interval");
                else elA.classList.remove("active-glow-interval");
            }
            if (elB) {
                if (active) elB.classList.add("active-glow-b");
                else elB.classList.remove("active-glow-b");
            }
        }
    }

    stepsChalkboard.addEventListener("mouseover", (e) => {
        const mathSeg = e.target.closest(".math-seg");
        if (mathSeg) {
            const highlight = mathSeg.getAttribute("data-highlight");
            if (highlight) highlightOnCanvas(highlight, true);
        }
    });

    stepsChalkboard.addEventListener("mouseout", (e) => {
        const mathSeg = e.target.closest(".math-seg");
        if (mathSeg) {
            const highlight = mathSeg.getAttribute("data-highlight");
            if (highlight) highlightOnCanvas(highlight, false);
        }
    });

    // ==========================================================================
    // 13. 绑定顶部与按钮事件
    // ==========================================================================
    btnToggleSnap.addEventListener("click", () => {
        isSnappingEnabled = !isSnappingEnabled;
        if (isSnappingEnabled) {
            btnToggleSnap.classList.add("active");
            btnToggleSnap.querySelector("span").textContent = "吸附 0.1";
            
            // 立即进行一次吸附校正
            valA = snapValue(valA);
            valCompA = snapValue(valCompA);
            valCompB = snapValue(valCompB);
            valIntA = snapValue(valIntA);
            valIntB = snapValue(valIntB);
            loadSlidersForScene();
        } else {
            btnToggleSnap.classList.remove("active");
            btnToggleSnap.querySelector("span").textContent = "自由取值";
        }
    });

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const sc = btn.getAttribute("data-scene");
            loadScene(sc);
        });
    });

    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
        } else {
            hudPanel.classList.add("collapsed");
        }
        centerModel();
    });

    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());

    btnResetState.addEventListener("click", () => {
        // 重置为当前场景的初始状态
        loadScene(currentScene);
    });

    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (e) => {
        if (e.target === modalHelp) modalHelp.classList.remove("active");
    });

    // 暴露状态接口以便于自动化测试或外接控制
    window.appState = {
        get currentScene() { return currentScene; },
        get valA() { return valA; },
        get valCompA() { return valCompA; },
        get valCompB() { return valCompB; },
        get valIntA() { return valIntA; },
        get valIntB() { return valIntB; },
        get intervalMode() { return intervalMode; },
        set intervalMode(val) {
            intervalMode = val;
            loadSlidersForScene();
            updateScenePresetsAndTheory();
        },
        get isInclusiveA() { return isInclusiveA; },
        set isInclusiveA(val) {
            isInclusiveA = val;
            loadSlidersForScene();
        },
        get isInclusiveB() { return isInclusiveB; },
        set isInclusiveB(val) {
            isInclusiveB = val;
            loadSlidersForScene();
        },
        loadScene,
        applyPreset,
        centerModel
    };

    // 初始化运行
    loadScene("point-modeling");
    requestAnimationFrame(updateLerp);

    // 监听窗口大小改变，重置居中
    window.addEventListener("resize", centerModel);
});

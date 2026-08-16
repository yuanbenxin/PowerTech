/**
 * 平方根与立方根数轴定位演示仪 - 课件交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态与参数
    // ==========================================================================
    let currentScene = "sqrt-construction"; // sqrt-construction | sqrt-bisection | cbrt-volume
    let isHudExpanded = false;
    let currentTheoryTitle = "";
    let currentTheoryBody = "";

    // 数轴物理坐标参数
    let unitWidth = 100; // 1个刻度单位所占像素宽度
    let O = { x: 400, y: 320 }; // 数轴原点 0 点的屏幕坐标
    
    // 平移与缩放 (夹逼场景变焦使用)
    let zoomScale = 1.0;
    let panX = 0, panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // 场景 1：平方根作图参数
    let sqrtTarget = "sqrt2"; // sqrt2 | sqrt3 | sqrt5 | sqrt10
    let animProgress = 0.0;   // 0.0 到 1.0
    let isPlaying = false;
    let animFrameId = null;

    // 场景 2：夹逼估算参数
    let nestLevel = 0; // 0: 整数级 [1, 2] | 1: 十分位级 [1.4, 1.5] | 2: 百分位级 [1.41, 1.42]
    // 逼近数轴的动态左右边界（有理数数值），用于动态变焦镜头
    let viewMathMin = -1.5;
    let viewMathMax = 4.5;
    // 目标 LERP 边界，提供变焦平滑插值
    const targetViewLimits = {
        min: -1.5,
        max: 4.5
    };

    // 场景 3：立方根参数
    let valVolume = 8.0; // 体积 V
    let valSide = 2.0;   // 边长 s = cbrt(V)
    let activeDragPoint = null; // "cbrt-handle"

    // 3D 立方体旋转角度 (Scene 3 专用，提供微小持续旋转，增加动感)
    let cubeRotateAngle = -Math.PI / 6; 

    // LERP 插值渲染值
    const renderValues = {
        animProgress: 0.0,
        viewMathMin: -1.5,
        viewMathMax: 4.5,
        valVolume: 8.0,
        valSide: 2.0
    };
    let lastOverlayHtml = "";
    let lastHudSignature = "";
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
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const modalHelp = document.getElementById("modal-help");
    const btnCloseHelp = document.getElementById("btn-close-help");

    isHudExpanded = !hudPanel.classList.contains("collapsed");

    function getAxisLeftPadding() {
        const W = sandboxWrapper.clientWidth;
        const isDesktop = W > 800;
        return isDesktop ? 56 : 30;
    }

    function applyHudStandard() {
        const collapsed = hudPanel.classList.contains("collapsed");
        isHudExpanded = !collapsed;
        const setHudStyle = (name, value) => hudPanel.style.setProperty(name, value, "important");
        const setChildStyle = (node, name, value) => {
            if (node) node.style.setProperty(name, value, "important");
        };
        const header = hudPanel.querySelector(".hud-header");
        const title = hudPanel.querySelector(".hud-title");
        const control = hudPanel.querySelector(".hud-control-btn");
        const body = hudPanel.querySelector(".hud-body");

        if (window.innerWidth <= 640) {
            setHudStyle("display", "none");
            return;
        }

        hudPanel.setAttribute("aria-expanded", collapsed ? "false" : "true");
        hudToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        hudToggleBtn.setAttribute("title", collapsed ? "展开板书" : "收起板书");

        setHudStyle("display", "flex");
        setHudStyle("position", "absolute");
        setHudStyle("top", "20px");
        setHudStyle("left", "20px");
        setHudStyle("right", "auto");
        setHudStyle("width", collapsed ? "auto" : "360px");
        setHudStyle("min-width", collapsed ? "max-content" : "0");
        setHudStyle("max-width", "calc(100% - 40px)");
        setHudStyle("height", collapsed ? "46px" : "auto");
        setHudStyle("min-height", collapsed ? "46px" : "0");
        setHudStyle("max-height", "none");
        setHudStyle("background", collapsed ? "rgba(255, 255, 255, 0.92)" : "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9))");
        setHudStyle("border", collapsed ? "1px solid rgba(148, 163, 184, 0.28)" : "1px solid rgba(148, 163, 184, 0.24)");
        setHudStyle("border-radius", collapsed ? "999px" : "14px");
        setHudStyle("box-shadow", collapsed ? "0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9)" : "0 18px 42px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06)");
        setHudStyle("color", "#0f172a");
        setHudStyle("z-index", "180");
        setHudStyle("overflow", "hidden");
        setHudStyle("backdrop-filter", "blur(16px)");
        setHudStyle("-webkit-backdrop-filter", "blur(16px)");
        setHudStyle("transform", "translateZ(0)");

        setChildStyle(header, "min-height", "46px");
        setChildStyle(header, "height", "46px");
        setChildStyle(header, "padding", "10px 12px");
        setChildStyle(header, "background", "rgba(248, 250, 252, 0.72)");
        setChildStyle(header, "border-bottom", collapsed ? "0" : "1px solid rgba(226, 232, 240, 0.76)");
        setChildStyle(header, "border-radius", collapsed ? "999px" : "14px 14px 0 0");

        setChildStyle(title, "color", "#0f172a");
        setChildStyle(title, "font-size", "13px");
        setChildStyle(title, "font-weight", "800");
        setChildStyle(title, "white-space", "nowrap");
        setChildStyle(title, "opacity", "1");

        setChildStyle(control, "width", "28px");
        setChildStyle(control, "height", "28px");
        setChildStyle(control, "border-radius", "999px");
        setChildStyle(control, "background", "rgba(245, 158, 11, 0.12)");
        setChildStyle(control, "border", "1px solid rgba(245, 158, 11, 0.18)");
        setChildStyle(control, "color", "#92400e");

        if (body) {
            body.style.setProperty("display", collapsed ? "none" : "block", "important");
            body.style.setProperty("padding", "8px 10px", "important");
            body.style.setProperty("max-height", "none", "important");
            body.style.setProperty("overflow", "visible", "important");
            body.style.setProperty("color", "#334155", "important");
        }
    }

    function scheduleHudStandard() {
        requestAnimationFrame(applyHudStandard);
        window.setTimeout(applyHudStandard, 80);
        window.setTimeout(applyHudStandard, 320);
    }

    scheduleHudStandard();
    new MutationObserver(scheduleHudStandard).observe(hudPanel, {
        attributes: true,
        attributeFilter: ["class"]
    });

    // ==========================================================================
    // 3. 数轴数学与映射算法 (支持局部变焦映射)
    // ==========================================================================
    // 根据当前变焦边界，将有理数值映射为屏幕X坐标
    function getPixelX(val) {
        const curMin = renderValues.viewMathMin;
        const curMax = renderValues.viewMathMax;
        
        const W = sandboxWrapper.clientWidth;
        // 动态排布：左边界 L_min，右边界 R_max
        const L_min = getAxisLeftPadding();
        const R_max = W - 40;
        
        // 线性映射插值
        const pct = (val - curMin) / (curMax - curMin);
        return L_min + pct * (R_max - L_min);
    }

    // 屏幕X坐标 -> 有理数数值
    function getMathVal(px) {
        const curMin = renderValues.viewMathMin;
        const curMax = renderValues.viewMathMax;
        
        const W = sandboxWrapper.clientWidth;
        const L_min = getAxisLeftPadding();
        const R_max = W - 40;

        const pct = (px - L_min) / (R_max - L_min);
        return curMin + pct * (curMax - curMin);
    }

    // 获取特定有理数目标值
    function getTargetIrrationalValue() {
        if (sqrtTarget === "sqrt2") return Math.sqrt(2);
        if (sqrtTarget === "sqrt3") return Math.sqrt(3);
        if (sqrtTarget === "sqrt5") return Math.sqrt(5);
        if (sqrtTarget === "sqrt10") return Math.sqrt(10);
        return Math.sqrt(2);
    }

    function getTargetRadicand() {
        if (sqrtTarget === "sqrt3") return 3;
        if (sqrtTarget === "sqrt5") return 5;
        if (sqrtTarget === "sqrt10") return 10;
        return 2;
    }

    function getTargetLabel() {
        return `√${getTargetRadicand()}`;
    }

    function getConstructionGeometry() {
        if (sqrtTarget === "sqrt3") return { baseLen: Math.sqrt(2), heightLen: 1, baseLabel: "√2", heightLabel: "1" };
        if (sqrtTarget === "sqrt5") return { baseLen: 2, heightLen: 1, baseLabel: "2", heightLabel: "1" };
        if (sqrtTarget === "sqrt10") return { baseLen: 3, heightLen: 1, baseLabel: "3", heightLabel: "1" };
        return { baseLen: 1, heightLen: 1, baseLabel: "1", heightLabel: "1" };
    }

    function getConstructionStep(progress) {
        if (progress < 0.3) return { title: "第1步", body: "在数轴上截取底边" };
        if (progress < 0.5) return { title: "第2步", body: "端点作垂线，高为 1" };
        if (progress < 0.7) return { title: "第3步", body: "连接原点得到斜边" };
        if (progress < 0.96) return { title: "第4步", body: "以原点为圆心旋转斜边" };
        return { title: "定位完成", body: `交点 A 表示 ${getTargetLabel()}` };
    }

    function getBisectionBoundsForLevel(level) {
        const table = {
            sqrt2: [[1.0, 2.0], [1.4, 1.5], [1.41, 1.42]],
            sqrt3: [[1.0, 2.0], [1.7, 1.8], [1.73, 1.74]],
            sqrt5: [[2.0, 3.0], [2.2, 2.3], [2.23, 2.24]],
            sqrt10: [[3.0, 4.0], [3.1, 3.2], [3.16, 3.17]]
        };
        const safeLevel = Math.max(0, Math.min(2, level));
        const [left, right] = table[sqrtTarget][safeLevel] || table.sqrt2[0];
        const radicand = getTargetRadicand();
        const precision = safeLevel === 0 ? "整数级" : (safeLevel === 1 ? "十分位" : "百分位");
        const fixedDigits = safeLevel === 0 ? 0 : safeLevel;
        return {
            left,
            right,
            level: safeLevel,
            leftText: left.toFixed(fixedDigits),
            rightText: right.toFixed(fixedDigits),
            widthText: (right - left).toFixed(fixedDigits),
            precision,
            relation: `${left.toFixed(fixedDigits)}² < ${radicand} < ${right.toFixed(fixedDigits)}² ⇒ ${left.toFixed(fixedDigits)} < ${getTargetLabel()} < ${right.toFixed(fixedDigits)}`
        };
    }

    function getBisectionBounds() {
        return getBisectionBoundsForLevel(nestLevel);
    }

    function renderBisectionLadder() {
        return `
            <div class="bisection-ladder" aria-label="区间逐级收缩轨迹">
                ${[0, 1, 2].map((level) => {
                    const item = getBisectionBoundsForLevel(level);
                    return `
                        <div class="ladder-chip ${level === nestLevel ? "active" : ""}">
                            <span class="ladder-level">${item.precision}</span>
                            <span class="ladder-range">[${item.leftText}, ${item.rightText}]</span>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    // ==========================================================================
    // 4. LERP 渲染平滑循环 & 动画时钟
    // ==========================================================================
    function updateFrame() {
        // A. 作图动画自增
        if (isPlaying && currentScene === "sqrt-construction") {
            animProgress += 0.004;
            if (animProgress >= 1.0) {
                animProgress = 1.0;
                isPlaying = false;
                const playBtn = document.getElementById("btn-play-anim");
                if (playBtn) playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放作图</span>`;
            }
            const timeline = document.getElementById("slider-anim-timeline");
            if (timeline) {
                timeline.value = (animProgress * 100).toFixed(0);
                syncSceneSliderFill(timeline);
            }
            const valInd = document.getElementById("val-indicator-timeline");
            if (valInd) valInd.textContent = (animProgress * 100).toFixed(0) + "%";
        }

        // B. LERP 平滑过渡衰减
        const k = 0.18;
        renderValues.animProgress += (animProgress - renderValues.animProgress) * k;
        renderValues.viewMathMin += (targetViewLimits.min - renderValues.viewMathMin) * k;
        renderValues.viewMathMax += (targetViewLimits.max - renderValues.viewMathMax) * k;
        renderValues.valVolume += (valVolume - renderValues.valVolume) * k;
        renderValues.valSide += (valSide - renderValues.valSide) * k;

        renderSVG();
        updateHTMLOverlayAndHUD();
        requestAnimationFrame(updateFrame);
    }

    // ==========================================================================
    // 5. SVG 绘制几何函数
    // ==========================================================================
    // 注入条带纹理 Defs
    function injectPatternDefs() {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <pattern id="diagonal-stripes" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" style="stroke: var(--color-orange, #f59e0b);" stroke-width="3" opacity="0.15" />
            </pattern>
        `;
        sandboxSvg.appendChild(defs);
    }

    // 绘制数轴刻度与细分刻度
    function drawAxisBase(drawHtml, axisY) {
        const curMin = renderValues.viewMathMin;
        const curMax = renderValues.viewMathMax;
        
        const W = sandboxWrapper.clientWidth;
        const L_min = getAxisLeftPadding();
        const R_max = W - 40;

        // 绘制主干线
        drawHtml += `
            <line class="geo-line-seg axis-line" x1="${L_min}" y1="${axisY}" x2="${R_max}" y2="${axisY}"></line>
            <path d="M ${R_max} ${axisY} L ${R_max - 12} ${axisY - 6} L ${R_max - 12} ${axisY + 6} Z" fill="#0f172a"></path>
            <text class="geo-label" style="font-weight:700;" x="${R_max + 10}" y="${axisY + 4}">x</text>
        `;

        // 确定刻度步长
        let step = 1.0;
        const range = curMax - curMin;
        if (range <= 0.2) step = 0.01;      // 百分位变焦
        else if (range <= 2.0) step = 0.1;  // 十分位变焦

        // 起始刻度计算，并避免小数精度浮点错误
        let startTick = Math.ceil(curMin / step) * step;
        let endTick = Math.floor(curMax / step) * step;
        
        for (let t = startTick; t <= endTick; t += step) {
            // 解决 JS 浮点累加误差 (如 1.4000000002)
            const val = parseFloat(t.toFixed(2));
            const tickX = getPixelX(val);
            const isOrigin = Math.abs(val) < 0.001;

            // 主要刻度高一点，十分位/百分位刻度矮一点
            let isMainTick = true;
            if (step === 0.01 && Math.round(val * 100) % 5 !== 0) isMainTick = false;
            if (step === 0.1 && Math.round(val * 10) % 5 !== 0 && !isOrigin) isMainTick = false;

            const tickH = isOrigin ? 12 : (isMainTick ? 8 : 4);
            const tickClass = isOrigin ? "origin-tick" : "tick-line";
            
            let labelText = val.toString();
            if (step === 0.01) labelText = val.toFixed(2);
            else if (step === 0.1) labelText = val.toFixed(1);

            drawHtml += `
                <line class="${tickClass}" x1="${tickX}" y1="${axisY - tickH}" x2="${tickX}" y2="${axisY + tickH}"></line>
            `;
            
            // 主刻度绘制文本
            if (isMainTick || isOrigin) {
                const labelClass = isOrigin ? "tick-label origin-label" : "tick-label";
                drawHtml += `
                    <text class="${labelClass}" x="${tickX}" y="${axisY + 22}" text-anchor="middle">${labelText}</text>
                `;
            }
        }
        return drawHtml;
    }

    // ==========================================================================
    // 6. SVG 渲染流程
    // ==========================================================================
    function renderSVG() {
        let drawHtml = "";
        const axisY = O.y;

        // 1. 绘制变焦刻度数轴
        drawHtml = drawAxisBase(drawHtml, axisY);

        // ==========================================================================
        // 场景 1: 平方根几何作图
        // ==========================================================================
        if (currentScene === "sqrt-construction") {
            const progress = renderValues.animProgress;
            const geometry = getConstructionGeometry();
            const { baseLen, heightLen, baseLabel, heightLabel } = geometry;
            const targetLabel = getTargetLabel();

            const px0 = getPixelX(0);
            const pxBase = getPixelX(baseLen);
            const targetVal = getTargetIrrationalValue();
            const pxTarget = getPixelX(targetVal);

            // 比例单位对应像素高度 (用于画图垂直高)
            const unitH_px = getPixelX(1) - getPixelX(0);
            const topY = axisY - heightLen * unitH_px;

            // 分阶段渲染作图路径
            // A. 底边路程
            if (progress > 0.01) {
                const drawBaseProgress = Math.min(1.0, progress / 0.3); // 前 30% 绘制底边
                const currentBaseX = px0 + (pxBase - px0) * drawBaseProgress;
                drawHtml += `
                    <!-- 勾股底边 -->
                    <line class="triangle-base" x1="${px0}" y1="${axisY}" x2="${currentBaseX}" y2="${axisY}"></line>
                `;
                if (drawBaseProgress > 0.75) {
                    drawHtml += `<text class="measure-label" x="${(px0 + pxBase) / 2}" y="${axisY - 10}" text-anchor="middle">底边 ${baseLabel}</text>`;
                }
            }

            // B. 垂直高度线
            if (progress > 0.3) {
                const drawHeightProgress = Math.min(1.0, (progress - 0.3) / 0.2); // 30%-50% 绘制高度线
                const hY = axisY - (heightLen * unitH_px) * drawHeightProgress;
                drawHtml += `
                    <!-- 勾股垂直高度 -->
                    <line class="triangle-height" x1="${pxBase}" y1="${axisY}" x2="${pxBase}" y2="${hY}"></line>
                `;

                // 绘制直角标记
                if (drawHeightProgress > 0.95) {
                    const markSize = 10;
                    drawHtml += `
                        <path class="right-angle-mark" d="M ${pxBase} ${axisY - markSize} L ${pxBase - markSize} ${axisY - markSize} L ${pxBase - markSize} ${axisY}"></path>
                        <text class="measure-label" x="${pxBase + 16}" y="${(axisY + topY) / 2 + 4}" text-anchor="start">高 ${heightLabel}</text>
                    `;
                }
            }

            // C. 斜线连线
            if (progress > 0.5) {
                const drawHypotProgress = Math.min(1.0, (progress - 0.5) / 0.2); // 50%-70% 连斜线
                const endX = px0 + (pxBase - px0) * drawHypotProgress;
                const endY = axisY + (topY - axisY) * drawHypotProgress;
                drawHtml += `
                    <!-- 勾股斜边 -->
                    <line class="triangle-hypot" x1="${px0}" y1="${axisY}" x2="${endX}" y2="${endY}"></line>
                `;
                if (drawHypotProgress > 0.82) {
                    drawHtml += `<text class="measure-label hypot-label" x="${(px0 + pxBase) / 2 - 12}" y="${(axisY + topY) / 2 - 10}" text-anchor="middle">斜边 ${targetLabel}</text>`;
                }
            }

            // D. 圆规弧线下旋交数轴
            if (progress > 0.7) {
                const drawArcProgress = Math.min(1.0, (progress - 0.7) / 0.3); // 70%-100% 下旋圆弧
                
                const r_px = Math.hypot(pxBase - px0, topY - axisY);
                const startAngle = Math.atan2(topY - axisY, pxBase - px0); // 负值 (上为负)
                const currentAngle = startAngle + (0 - startAngle) * drawArcProgress;

                // 构造 SVG 弧线路径 (A rx ry x-axis-rotation large-arc-flag sweep-flag x y)
                const arcEndX = px0 + r_px * Math.cos(currentAngle);
                const arcEndY = axisY + r_px * Math.sin(currentAngle);

                drawHtml += `
                    <!-- 几何旋转弧线 -->
                    <path class="compass-arc" d="M ${pxBase} ${topY} A ${r_px} ${r_px} 0 0 1 ${arcEndX} ${arcEndY}"></path>
                    <!-- 旋转斜线 -->
                    <line class="triangle-hypot" style="stroke: var(--color-orange, #f59e0b); stroke-width: 2.5px; opacity:0.74;" x1="${px0}" y1="${axisY}" x2="${arcEndX}" y2="${arcEndY}"></line>
                `;

                if (drawArcProgress > 0.95) {
                    // 精确交点高亮
                    drawHtml += `
                        <circle cx="${pxTarget}" cy="${axisY}" r="6" style="fill: var(--color-orange, #f59e0b); filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.5));"></circle>
                        <text class="geo-label" style="fill: var(--color-orange, #f59e0b); font-weight:800; font-size:13px;" x="${pxTarget}" y="${axisY - 14}" text-anchor="middle">A: ${targetLabel}</text>
                    `;
                }
            }
        }

        // ==========================================================================
        // 场景 2: 平方根夹逼估算
        // ==========================================================================
        else if (currentScene === "sqrt-bisection") {
            const targetVal = getTargetIrrationalValue();
            const pxTarget = getPixelX(targetVal);
            const bounds = getBisectionBounds();

            const pxLeft = getPixelX(bounds.left);
            const pxRight = getPixelX(bounds.right);
            
            const shH = 16;
            const shY = axisY - shH / 2;

            drawHtml += `
                <!-- 逼近区间高亮带 -->
                <rect class="nesting-range-rect" x="${pxLeft}" y="${shY}" width="${pxRight - pxLeft}" height="${shH}"></rect>
                <rect class="nesting-range-pattern" x="${pxLeft}" y="${shY}" width="${pxRight - pxLeft}" height="${shH}"></rect>
                <line class="interval-boundary-line leftBoundary" x1="${pxLeft}" y1="${axisY - 24}" x2="${pxLeft}" y2="${axisY + 18}"></line>
                <line class="interval-boundary-line rightBoundary" x1="${pxRight}" y1="${axisY - 24}" x2="${pxRight}" y2="${axisY + 18}"></line>
                <text class="interval-boundary-label leftBoundary" x="${pxLeft}" y="${axisY - 31}" text-anchor="middle">${bounds.leftText}</text>
                <text class="interval-boundary-label rightBoundary" x="${pxRight}" y="${axisY - 31}" text-anchor="middle">${bounds.rightText}</text>
                
                <!-- 精确有理数目标点 A -->
                <circle cx="${pxTarget}" cy="${axisY}" r="6" style="fill: var(--color-sqrt, #7c3aed); filter: drop-shadow(0 0 5px rgba(124, 58, 237, 0.45));"></circle>
                <text class="geo-label" x="${pxTarget}" y="${axisY + 42}" text-anchor="middle">${getTargetLabel()}</text>
            `;
        }

        // ==========================================================================
        // 场景 3: 立方根体积投影
        // ==========================================================================
        else if (currentScene === "cbrt-volume") {
            const side = renderValues.valSide;
            const px0 = getPixelX(0);
            const pxSide = getPixelX(side);

            // 立方根投影底边线
            drawHtml += `
                <line class="triangle-base cube-axis-guide" style="stroke: var(--color-cbrt, #2563eb); stroke-width: 5px;" x1="${px0}" y1="${axisY}" x2="${pxSide}" y2="${axisY}"></line>
            `;

            // 绘制 3D 旋转立方体线框
            // 定义立方体的 3D 局部空间坐标 (X, Y, Z)。其中 Y 为向上高度，X/Z 在数轴平行面
            const s = side;
            
            const vertices3D = [
                { x: 0, y: 0, z: 0 }, // 0: 后下左
                { x: s, y: 0, z: 0 }, // 1: 后下右
                { x: s, y: s, z: 0 }, // 2: 后上右
                { x: 0, y: s, z: 0 }, // 3: 后上左
                { x: 0, y: 0, z: s }, // 4: 前下左
                { x: s, y: 0, z: s }, // 5: 前下右
                { x: s, y: s, z: s }, // 6: 前上右
                { x: 0, y: s, z: s }  // 7: 前上左
            ];

            // 3D 坐标投影到 2D SVG
            // 利用倾斜斜二侧投影 (Cabinet Projection)
            const angle = cubeRotateAngle; 
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            // 每个单位映射的物理高度
            const unitH = getPixelX(1) - getPixelX(0);

            const project = (v) => {
                // X轴向右，Z轴斜向右下/左上(深度)，Y轴垂直向上
                // 深度折算因子 0.45
                const depthScale = 0.45;
                const projX = getPixelX(v.x) + v.z * unitH * depthScale * cos;
                const projY = axisY - v.y * unitH + v.z * unitH * depthScale * sin;
                return { x: projX, y: projY };
            };

            const pts = vertices3D.map(v => project(v));

            // 立方体面构造 (为保证透明重叠感，先画背面，再画正面)
            const faces = [
                [0, 1, 2, 3], // 后
                [0, 3, 7, 4], // 左
                [0, 1, 5, 4], // 下
                [1, 2, 6, 5], // 右
                [3, 2, 6, 7], // 上
                [4, 5, 6, 7]  // 前
            ];

            // 绘制虚线后边缘
            drawHtml += `
                <line class="cube-edge-dash" x1="${pts[0].x}" y1="${pts[0].y}" x2="${pts[1].x}" y2="${pts[1].y}"></line>
                <line class="cube-edge-dash" x1="${pts[0].x}" y1="${pts[0].y}" x2="${pts[3].x}" y2="${pts[3].y}"></line>
                <line class="cube-edge-dash" x1="${pts[0].x}" y1="${pts[0].y}" x2="${pts[4].x}" y2="${pts[4].y}"></line>
            `;

            // 绘制半透明面和其余实线前边缘
            // 依次画出 6 个面
            faces.forEach(f => {
                // 如果包含点 0 且是下、后、左面，我们让其面颜色较浅，不画实线边，避免遮挡虚线后边缘
                const isBackFace = f.includes(0);
                const dPath = `M ${pts[f[0]].x} ${pts[f[0]].y} L ${pts[f[1]].x} ${pts[f[1]].y} L ${pts[f[2]].x} ${pts[f[2]].y} L ${pts[f[3]].x} ${pts[f[3]].y} Z`;
                
                drawHtml += `
                    <path class="cube-face" d="${dPath}"></path>
                `;
            });

            // 绘制实体前边缘实线
            const frontEdges = [
                [1, 2], [2, 3], [3, 7], [7, 6], [6, 2],
                [6, 5], [5, 1], [5, 4], [4, 7], [5, 6], [4, 5]
            ];
            frontEdges.forEach(e => {
                drawHtml += `
                    <line style="stroke: var(--color-cbrt, #2563eb); stroke-width:1.8px; stroke-linecap:round; fill:none;" x1="${pts[e[0]].x}" y1="${pts[e[0]].y}" x2="${pts[e[1]].x}" y2="${pts[e[1]].y}"></line>
                `;
            });

            // 投影指示虚线 (从立方体底边前下右点 5 投射到数轴)
            drawHtml += `
                <path class="cube-volume-fill" d="M ${pts[4].x} ${pts[4].y} L ${pts[5].x} ${pts[5].y} L ${pts[6].x} ${pts[6].y} L ${pts[7].x} ${pts[7].y} Z"></path>
                <line class="projection-line" x1="${pts[5].x}" y1="${pts[5].y}" x2="${pts[5].x}" y2="${axisY}"></line>
                <line class="projection-line" x1="${pts[6].x}" y1="${pts[6].y}" x2="${pxSide}" y2="${axisY - s * unitH}"></line>
                <text class="cube-volume-label" x="${pts[6].x + 10}" y="${pts[6].y - 8}" text-anchor="start">V = ${renderValues.valVolume.toFixed(1)}</text>
                <text class="cube-side-label" x="${(px0 + pxSide) / 2}" y="${axisY - 12}" text-anchor="middle">边长 s = ${renderValues.valSide.toFixed(2)}</text>
                <g class="cube-root-label" transform="translate(${pxSide} ${axisY + 39})" role="img" aria-label="立方根 V">
                    <text class="cube-root-index" x="-14" y="-7" text-anchor="middle">3</text>
                    <path class="cube-root-radical" d="M -13 -1 H -10 L -7 7 L -3 -9 H 14"></path>
                    <text class="cube-root-radicand" x="5" y="4" text-anchor="middle">V</text>
                </g>
                <path class="cube-projection-chain" d="M ${pts[6].x + 8} ${pts[6].y - 2} C ${pts[6].x + 42} ${pts[6].y + 24}, ${pxSide + 42} ${axisY - 52}, ${pxSide + 8} ${axisY - 10}"></path>
                <text class="cube-formula-tag" x="${pxSide + 14}" y="${axisY - 34}" text-anchor="start">s³ = V</text>
            `;

            // 绘制立方根可拖拽点
            drawHtml += drawDraggablePoint("cbrt-handle", pxSide, axisY, "cbrt", true);
        }

        sandboxSvg.innerHTML = "";
        injectPatternDefs();
        sandboxSvg.innerHTML += drawHtml;
    }

    // 绘制可拖动点把手
    function drawDraggablePoint(id, x, y, colorClass, isSolid = true) {
        const fallback = colorClass === "cbrt" ? "#2563eb" : (colorClass === "sqrt" ? "#7c3aed" : "#059669");
        const fillStyle = isSolid ? `fill: var(--color-${colorClass}, ${fallback});` : `fill: #ffffff; stroke: var(--color-${colorClass}, ${fallback}); stroke-width:3px;`;
        return `
            <g class="geo-point-wrapper ${colorClass === 'cbrt' ? 'point-cbrt' : ''}" data-point-id="${id}">
                <circle class="geo-point-halo" cx="${x}" cy="${y}" r="22"></circle>
                <circle class="geo-point" style="${fillStyle}" cx="${x}" cy="${y}" r="6.5"></circle>
            </g>
        `;
    }

    // ==========================================================================
    // 7. HTML 飘浮读数渲染与 HUD 板书更新
    // ==========================================================================
    function setOverlayHtml(html) {
        if (html === lastOverlayHtml) return;
        lastOverlayHtml = html;
        htmlOverlay.innerHTML = html;
    }

    function updateHTMLOverlayAndHUD() {
        let overlayHtml = "";
        const axisY = O.y;

        if (currentScene === "sqrt-construction") {
            const progress = renderValues.animProgress;
            const step = getConstructionStep(progress);
            overlayHtml += `<div class="construction-step-badge" style="left:${getPixelX(0)}px; top:${axisY - 150}px"><strong>${step.title}</strong><span>${step.body}</span></div>`;
            if (progress > 0.95) {
                const targetVal = getTargetIrrationalValue();
                const pxTarget = getPixelX(targetVal);
                overlayHtml += `<div class="coord-label-box lbl-sqrt construction-value-label" style="left:${pxTarget + 72}px; top:${axisY - 86}px">A = ${getTargetLabel()} ≈ ${targetVal.toFixed(4)}</div>`;
            }
        } 
        
        else if (currentScene === "sqrt-bisection") {
            const targetVal = getTargetIrrationalValue();
            const pxTarget = getPixelX(targetVal);
            // 逼近精度显示
            overlayHtml += `<div class="coord-label-box lbl-sqrt bisection-value-label" style="left:${pxTarget}px; top:${axisY - 72}px">${getTargetLabel()} ≈ ${targetVal.toFixed(4)}</div>`;
        } 
        
        else if (currentScene === "cbrt-volume") {
            const pxSide = getPixelX(renderValues.valSide);
            overlayHtml += `<div class="coord-label-box lbl-cbrt" style="left:${pxSide}px; top:${axisY - 54}px">s = ${valSide.toFixed(3)}</div>`;
        }

        setOverlayHtml(overlayHtml);

        // 更新板书
        updateHUDContent();
    }

    function renderTheoryHudBlock(title, bodyHtml) {
        if (!title || !bodyHtml) return "";
        return `
            <div class="hud-row hud-theory-row">
                <div class="hud-row-label">${title}</div>
                <div class="hud-theory-block">${bodyHtml}</div>
            </div>
        `;
    }

    function updateHUDContent() {
        let html = "";

        if (currentScene === "sqrt-construction") {
            let targetLabel = "√2";
            let eqText = "1² + 1² = c²";
            let stepsDesc = "";

            if (sqrtTarget === "sqrt2") {
                targetLabel = "√2"; eqText = "1² + 1² = c²"; ansText = "c = √2 ≈ 1.414";
                stepsDesc = "直角边为 1 和 1，斜边长为 √2。";
            } else if (sqrtTarget === "sqrt3") {
                targetLabel = "√3"; eqText = "(√2)² + 1² = c²"; ansText = "c = √3 ≈ 1.732";
                stepsDesc = "以底边 √2（前一步所得）和高 1 构造三角形，斜边长为 √3。";
            } else if (sqrtTarget === "sqrt5") {
                targetLabel = "√5"; eqText = "2² + 1² = c²"; ansText = "c = √5 ≈ 2.236";
                stepsDesc = "直角边为 2 和 1，斜边长为 √5。";
            } else if (sqrtTarget === "sqrt10") {
                targetLabel = "√10"; eqText = "3² + 1² = c²"; ansText = "c = √10 ≈ 3.162";
                stepsDesc = "直角边为 3 和 1，斜边长为 √10。";
            }

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">作图目标</div>
                    <div class="hud-row-val" style="font-size:12.5px;">
                        在数轴上精确定位 <span class="math-seg seg-sqrt" data-highlight="sqrt">${targetLabel}</span>。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">当前步骤</div>
                    <div class="hud-row-val" style="font-size:12px; line-height:1.4;">
                        ${getConstructionStep(renderValues.animProgress).body}；${stepsDesc}
                    </div>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">几何原理：勾股定理 (直角三角形)</div>
                    <div class="formula">
                        <div>底边² + 高² = 斜边²</div>
                        <div style="font-size:14px; color:var(--text-secondary); margin-top:2px;">即 ${eqText}</div>
                        <div style="color:var(--color-hypot); margin-top:2px;">得斜边 c = ${targetLabel}</div>
                    </div>
                </div>
                <div class="hud-row" style="margin-top: 10px;">
                    <div class="hud-row-label">定位方法</div>
                    <div class="hud-row-val" style="font-size:12px; color:var(--text-secondary);">
                        以原点 0 为圆心，把斜边作为半径旋转到数轴，交点 A 就是 <strong>${targetLabel}</strong>。
                    </div>
                </div>
            `;
        } 
        
        else if (currentScene === "sqrt-bisection") {
            const targetVal = getTargetIrrationalValue();
            const label = getTargetLabel();
            const bounds = getBisectionBounds();

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">估算目标</div>
                    <div class="hud-row-val">
                        用区间夹逼估算 <span class="math-seg seg-sqrt" data-highlight="sqrt">${label}</span> 的数轴位置。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">当前区间</div>
                    <div class="hud-row-val" style="color:var(--color-orange);">
                        ${bounds.precision}：[${bounds.leftText}, ${bounds.rightText}]，宽度 ${bounds.widthText}
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">缩小轨迹</div>
                    ${renderBisectionLadder()}
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">平方比较得到不等式</div>
                    <div class="formula" style="font-size:15px; font-weight:800;">
                        ${bounds.relation}
                    </div>
                </div>
                <div class="hud-row" style="margin-top:10px;">
                    <div class="hud-row-val" style="font-size:11.5px; font-weight:normal; color:var(--text-secondary);">
                        点击“下一步放大”，数轴镜头会进入更小区间，学生能看到无理数被逐级锁定。
                    </div>
                </div>
            `;
        } 
        
        else if (currentScene === "cbrt-volume") {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">体积条件</div>
                    <div class="hud-row-val" style="font-size:12.5px;">
                        立方体体积 <span class="math-seg seg-cbrt" data-highlight="cbrt">V = ${valVolume.toFixed(1)}</span>。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">空间意义</div>
                    <div class="hud-row-val" style="font-size:12px; line-height:1.4;">
                        体积 V = s³，已知体积求边长就是开立方根。
                    </div>
                </div>
                <div class="hud-equation-box cbrt-box">
                    <div class="title">开立方根代数式</div>
                    <div class="formula">
                        边长 s = ∛<span class="math-seg seg-cbrt" data-highlight="cbrt">${valVolume.toFixed(2)}</span> = <span style="color:var(--color-cbrt);">${valSide.toFixed(4)}</span>
                    </div>
                </div>
                <div class="hud-row" style="margin-top:10px;">
                    <div class="hud-row-val" style="font-size:11.5px; font-weight:normal; color:var(--text-secondary);">
                        立方体边长垂直投影到数轴，拖动蓝色端点即可改变边长和对应体积。
                    </div>
                </div>
            `;
        }

        if (currentTheoryTitle && currentTheoryBody) {
            html += renderTheoryHudBlock(currentTheoryTitle, currentTheoryBody);
        }

        const signature = [
            currentScene,
            sqrtTarget,
            nestLevel,
            valVolume.toFixed(2),
            Math.floor(renderValues.animProgress * 10),
            currentTheoryTitle
        ].join("|");
        if (html === lastHudHtml && signature === lastHudSignature) return;
        lastHudHtml = html;
        lastHudSignature = signature;
        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 右侧滑块生成区
    // ==========================================================================
    function loadSlidersForScene() {
        let html = "";
        const renderTargetOptions = (mode) => `
                <div class="target-option-grid" role="group" aria-label="${mode === "estimate" ? "当前估算目标" : "选择作图目标"}">
                    <button type="button" class="target-option ${sqrtTarget === 'sqrt2' ? 'active' : ''}" data-sqrt-target="sqrt2">√2</button>
                    <button type="button" class="target-option ${sqrtTarget === 'sqrt3' ? 'active' : ''}" data-sqrt-target="sqrt3">√3</button>
                    <button type="button" class="target-option ${sqrtTarget === 'sqrt5' ? 'active' : ''}" data-sqrt-target="sqrt5">√5</button>
                    <button type="button" class="target-option ${sqrtTarget === 'sqrt10' ? 'active' : ''}" data-sqrt-target="sqrt10">√10</button>
                </div>
        `;

        if (currentScene === "sqrt-construction") {
            html = `
                <div class="control-stack-row">
                    <span class="slider-label">作图目标</span>
                    ${renderTargetOptions("construction")}
                </div>
                <div class="control-stack-row">
                    <div class="slider-head">
                        <span class="slider-label">时间轴</span>
                        <span class="slider-val-indicator" id="val-indicator-timeline">${(animProgress * 100).toFixed(0)}%</span>
                    </div>
                    <div class="range-shell">
                        <input type="range" class="scene-range-slider" id="slider-anim-timeline" min="0" max="100" step="1" value="${(animProgress * 100).toFixed(0)}">
                    </div>
                </div>
                <div class="control-action-btn-group">
                    <button class="btn-control-action" id="btn-play-anim">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
                        <span>播放作图</span>
                    </button>
                    <button class="btn-control-action" id="btn-reset-anim">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12H4A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z"/></svg>
                        <span>重置步骤</span>
                    </button>
                </div>
            `;
        } 
        
        else if (currentScene === "sqrt-bisection") {
            html = `
                <div class="control-stack-row">
                    <span class="slider-label">估算目标</span>
                    ${renderTargetOptions("estimate")}
                </div>
                <div class="control-action-btn-group">
                    <button class="btn-control-action active-run" id="btn-nest-next" ${nestLevel >= 2 ? 'disabled' : ''}>
                        下一步放大
                    </button>
                    <button class="btn-control-action" id="btn-nest-prev" ${nestLevel <= 0 ? 'disabled' : ''}>
                        上一步缩小
                    </button>
                </div>
            `;
        } 
        
        else if (currentScene === "cbrt-volume") {
            html = `
                <div class="control-stack-row control-stack-row-cbrt">
                    <div class="slider-head">
                        <span class="slider-label">立方体体积 V</span>
                        <span class="slider-val-indicator" id="val-indicator-volume">${valVolume.toFixed(1)}</span>
                    </div>
                    <div class="range-shell">
                        <input type="range" class="scene-range-slider" id="slider-volume" min="1" max="27" step="0.1" value="${valVolume}">
                    </div>
                </div>
            `;
        }

        slidersContainer.innerHTML = html;
        bindSliderEvents();
        initSceneSliders();
    }

    function syncSceneSliderFill(slider) {
        if (!slider) return;
        const min = Number(slider.min);
        const max = Number(slider.max);
        const val = Number(slider.value);
        const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
        slider.style.setProperty("--slider-pct", pct + "%");
    }

    function initSceneSliders() {
        document.querySelectorAll(".scene-range-slider").forEach(syncSceneSliderFill);
    }

    function bindSliderEvents() {
        // A. 场景 1 事件
        document.querySelectorAll(".target-option[data-sqrt-target]").forEach((btn) => {
            btn.addEventListener("click", () => {
                sqrtTarget = btn.getAttribute("data-sqrt-target");
                animProgress = 0.0;
                isPlaying = false;
                
                const playBtn = document.getElementById("btn-play-anim");
                if (playBtn) playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放作图</span>`;

                if (currentScene === "sqrt-bisection") {
                    nestLevel = 0;
                    applyBisectionViewLimits();
                }

                loadSlidersForScene();
                updateScenePresetsAndTheory();
                centerModel();
            });
        });

        const timeline = document.getElementById("slider-anim-timeline");
        if (timeline) {
            timeline.addEventListener("input", (e) => {
                isPlaying = false;
                animProgress = parseFloat(e.target.value) / 100;
                document.getElementById("val-indicator-timeline").textContent = e.target.value + "%";
                syncSceneSliderFill(e.target);
            });
        }

        const btnPlay = document.getElementById("btn-play-anim");
        if (btnPlay) {
            btnPlay.addEventListener("click", () => {
                isPlaying = !isPlaying;
                if (isPlaying) {
                    if (animProgress >= 0.99) animProgress = 0.0;
                    btnPlay.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M19,16H15V8H19V16M13,16H9V8H13V16Z"/></svg><span>暂停作图</span>`;
                } else {
                    btnPlay.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放作图</span>`;
                }
            });
        }

        const btnReset = document.getElementById("btn-reset-anim");
        if (btnReset) {
            btnReset.addEventListener("click", () => {
                isPlaying = false;
                animProgress = 0.0;
                const playBtn = document.getElementById("btn-play-anim");
                if (playBtn) playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放作图</span>`;
                
                const tl = document.getElementById("slider-anim-timeline");
                if (tl) tl.value = 0;
                document.getElementById("val-indicator-timeline").textContent = "0%";
            });
        }

        // B. 场景 2 事件
        const btnNestNext = document.getElementById("btn-nest-next");
        const btnNestPrev = document.getElementById("btn-nest-prev");
        
        if (btnNestNext) {
            btnNestNext.addEventListener("click", () => {
                if (nestLevel < 2) {
                    nestLevel++;
                    applyBisectionViewLimits();
                    loadSlidersForScene();
                }
            });
        }
        if (btnNestPrev) {
            btnNestPrev.addEventListener("click", () => {
                if (nestLevel > 0) {
                    nestLevel--;
                    applyBisectionViewLimits();
                    loadSlidersForScene();
                }
            });
        }

        // C. 场景 3 事件
        const sliderVolume = document.getElementById("slider-volume");
        if (sliderVolume) {
            sliderVolume.addEventListener("input", (e) => {
                valVolume = parseFloat(e.target.value);
                valSide = Math.cbrt(valVolume);
                document.getElementById("val-indicator-volume").textContent = valVolume.toFixed(1);
                syncSceneSliderFill(e.target);
            });
        }
    }

    function applyBisectionViewLimits() {
        const val = getTargetIrrationalValue();
        if (nestLevel === 0) {
            // 整数级，显示 [-1.5, 4.5]
            targetViewLimits.min = -1.5;
            targetViewLimits.max = 4.5;
        } else if (nestLevel === 1) {
            // 十分位级，左右各展宽约 0.7
            targetViewLimits.min = parseFloat((val - 0.72).toFixed(2));
            targetViewLimits.max = parseFloat((val + 0.68).toFixed(2));
        } else if (nestLevel === 2) {
            // 百分位级，左右各展宽约 0.06
            targetViewLimits.min = parseFloat((val - 0.055).toFixed(3));
            targetViewLimits.max = parseFloat((val + 0.055).toFixed(3));
        }
    }

    // ==========================================================================
    // 9. 预设生成区与理论看板
    // ==========================================================================
    function updateScenePresetsAndTheory() {
        let presetHtml = "";
        currentTheoryTitle = "";
        currentTheoryBody = "";

        if (currentScene === "sqrt-construction") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="sqrt-2">√2</button>
                <button class="btn-preset-problem" data-preset="sqrt-3">√3</button>
                <button class="btn-preset-problem" data-preset="sqrt-5">√5</button>
                <button class="btn-preset-problem" data-preset="sqrt-10">√10</button>
            `;
            currentTheoryTitle = "平方根的几何作图原理";
            currentTheoryBody = `
                <p><strong>勾股定理</strong>把“开平方”转成直角三角形斜边长度。</p>
                <p>再用圆规把斜边长度旋转到数轴，交点就是目标平方根。</p>
            `;
        } else if (currentScene === "sqrt-bisection") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="nest-l0">个位</button>
                <button class="btn-preset-problem" data-preset="nest-l1">十分位</button>
                <button class="btn-preset-problem" data-preset="nest-l2">百分位</button>
            `;
            currentTheoryTitle = "夹逼逼近（区间套）原理";
            currentTheoryBody = `
                <p>比较左右端点的平方，把目标根号数夹在越来越小的区间内。</p>
                <p>区间越窄，数轴上的目标点越确定。</p>
            `;
        } else if (currentScene === "cbrt-volume") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="cbrt-8">V = 8</button>
                <button class="btn-preset-problem" data-preset="cbrt-27">V = 27</button>
                <button class="btn-preset-problem" data-preset="cbrt-2">V = 2</button>
                <button class="btn-preset-problem" data-preset="cbrt-15">V = 15</button>
            `;
            currentTheoryTitle = "立方根的空间意义";
            currentTheoryBody = `
                <p><strong>立方根</strong>就是已知正方体体积 V，反求边长 s。</p>
                <p>边长投影到数轴，原点到端点的距离就是 ∛V。</p>
            `;
        }

        presetButtonsContainer.innerHTML = presetHtml;
        updateHUDContent();

        // 绑定预设点击
        document.querySelectorAll(".btn-preset-problem").forEach(btn => {
            btn.addEventListener("click", () => {
                applyPreset(btn.getAttribute("data-preset"));
            });
        });
    }

    function applyPreset(presetId) {
        if (presetId === "sqrt-2") {
            sqrtTarget = "sqrt2";
            animProgress = 0.0;
            isPlaying = false;
        } else if (presetId === "sqrt-3") {
            sqrtTarget = "sqrt3";
            animProgress = 0.0;
            isPlaying = false;
        } else if (presetId === "sqrt-5") {
            sqrtTarget = "sqrt5";
            animProgress = 0.0;
            isPlaying = false;
        } else if (presetId === "sqrt-10") {
            sqrtTarget = "sqrt10";
            animProgress = 0.0;
            isPlaying = false;
        } 
        
        else if (presetId === "nest-l0") {
            nestLevel = 0;
            applyBisectionViewLimits();
        } else if (presetId === "nest-l1") {
            nestLevel = 1;
            applyBisectionViewLimits();
        } else if (presetId === "nest-l2") {
            nestLevel = 2;
            applyBisectionViewLimits();
        } 
        
        else if (presetId === "cbrt-8") {
            valVolume = 8.0;
            valSide = 2.0;
        } else if (presetId === "cbrt-27") {
            valVolume = 27.0;
            valSide = 3.0;
        } else if (presetId === "cbrt-2") {
            valVolume = 2.0;
            valSide = Math.cbrt(2);
        } else if (presetId === "cbrt-15") {
            valVolume = 15.0;
            valSide = Math.cbrt(15);
        }

        loadSlidersForScene();
    }

    // ==========================================================================
    // 10. 页面自适应与居中布局
    // ==========================================================================
    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        zoomScale = 1.0;
        panX = 0;
        panY = 0;

        // 估算场景和其它场景下数轴的原点 O 的坐标计算
        
        if (currentScene === "sqrt-bisection") {
            // 逼近变焦场景下，由 viewMathMin & viewMathMax 动态做数学投射，不需要修改 O.x 的位置。
            // targetLimits 已经考虑了 L_min 和 R_max 的安全位置
            // 这里只需重置 Y 坐标
            O.y = H * 0.58; 
        } else {
            // 作图与体积场景下：HUD 固定在右上角，不再占用数轴左侧空间。
            const L_min = getAxisLeftPadding();
            const R_max = W - 40;
            const W_avail = R_max - L_min;

            // 数轴刻度最左端为 -1.5，最右端为 5.5（体积最大 27 开立方为 3），总宽 7 个单位
            unitWidth = Math.min(130, Math.max(70, W_avail / 7.2));

            // 原点在数轴上的位置 (保证 -1.5 刚好在 L_min)
            O.x = L_min + 1.6 * unitWidth;
            O.y = H * 0.58;

            // 复位变焦边界限制
            targetViewLimits.min = -1.5;
            targetViewLimits.max = 5.5;
        }

        updateTransform();
    }

    function updateTransform() {
        sandboxSvg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        htmlOverlay.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    }

    // ==========================================================================
    // 11. 鼠标与手势拖动交互
    // ==========================================================================
    sandboxWrapper.style.userSelect = "none";
    sandboxWrapper.style.webkitUserSelect = "none";
    sandboxWrapper.style.webkitTouchCallout = "none";
    sandboxWrapper.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });

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

    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        zoomAtCenter(factor);
    }, { passive: false });

    sandboxWrapper.addEventListener("mousedown", (e) => {
        const ptWrapper = e.target.closest(".geo-point-wrapper");
        if (ptWrapper) {
            const ptId = ptWrapper.getAttribute("data-point-id");
            if (ptId === "cbrt-handle" && currentScene === "cbrt-volume") {
                activeDragPoint = ptId;
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
        if (activeDragPoint === "cbrt-handle" && currentScene === "cbrt-volume") {
            const rect = sandboxSvg.getBoundingClientRect();
            const localX = (e.clientX - rect.left) / zoomScale;
            let val = getMathVal(localX);
            
            // 限制边长在数轴 [1.0, 3.0] 内 (即体积 1 到 27)
            val = Math.min(3.0, Math.max(1.0, val));
            
            // 吸附到 0.01 精度
            valSide = Math.round(val * 100) / 100;
            valVolume = valSide * valSide * valSide;

            const sl = document.getElementById("slider-volume");
            if (sl) sl.value = valVolume;
            const valInd = document.getElementById("val-indicator-volume");
            if (valInd) valInd.textContent = valVolume.toFixed(1);
            return;
        }

        if (isPanning) {
            panX = e.clientX - startPanX;
            panY = e.clientY - startPanY;
            updateTransform();
        }
    });

    window.addEventListener("mouseup", () => {
        activeDragPoint = null;
        if (isPanning) {
            isPanning = false;
            sandboxWrapper.classList.remove("panning");
        }
    });

    // 移动手势支持
    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                if (ptId === "cbrt-handle" && currentScene === "cbrt-volume") {
                    activeDragPoint = ptId;
                    e.stopPropagation();
                    return;
                }
            }
            isPanning = true;
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
        }
    });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (activeDragPoint === "cbrt-handle" && currentScene === "cbrt-volume") {
                const rect = sandboxSvg.getBoundingClientRect();
                const localX = (touch.clientX - rect.left) / zoomScale;
                let val = getMathVal(localX);
                val = Math.min(3.0, Math.max(1.0, val));
                valSide = Math.round(val * 100) / 100;
                valVolume = valSide * valSide * valSide;

                const sl = document.getElementById("slider-volume");
                if (sl) sl.value = valVolume;
                e.preventDefault();
            } else if (isPanning) {
                panX = touch.clientX - startPanX;
                panY = touch.clientY - startPanY;
                updateTransform();
                e.preventDefault();
            }
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchend", () => {
        activeDragPoint = null;
        isPanning = false;
    });

    sandboxWrapper.addEventListener("dblclick", () => {
        centerModel();
    });

    // ==========================================================================
    // 12. HUD 板书与 SVG 联动高亮
    // ==========================================================================
    function highlightOnCanvas(target, active) {
        if (target === "sqrt") {
            const el = document.querySelector(".triangle-hypot");
            const elArc = document.querySelector(".compass-arc");
            if (el) {
                if (active) el.classList.add("active-glow-sqrt");
                else el.classList.remove("active-glow-sqrt");
            }
            if (elArc) {
                if (active) elArc.classList.add("active-glow-sqrt");
                else elArc.classList.remove("active-glow-sqrt");
            }
        } else if (target === "cbrt") {
            const faces = document.querySelectorAll(".cube-face");
            faces.forEach(f => {
                if (active) f.classList.add("active-glow-cbrt");
                else f.classList.remove("active-glow-cbrt");
            });
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
    // 13. 顶部与预设按钮绑定
    // ==========================================================================
    function loadScene(sceneId) {
        currentScene = sceneId;
        
        // 激活对应的预设 Tab
        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === sceneId) btn.classList.add("active");
            else btn.classList.remove("active");
        });

        // 重置基本状态
        isPlaying = false;
        animProgress = 0.0;
        nestLevel = 0;

        if (currentScene === "sqrt-construction") {
            sqrtTarget = "sqrt2";
        } else if (currentScene === "sqrt-bisection") {
            sqrtTarget = "sqrt2";
            applyBisectionViewLimits();
        } else if (currentScene === "cbrt-volume") {
            valVolume = 8.0;
            valSide = 2.0;
        }

        loadSlidersForScene();
        updateScenePresetsAndTheory();
        centerModel();
    }

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadScene(btn.getAttribute("data-scene"));
        });
    });

    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
        } else {
            hudPanel.classList.add("collapsed");
        }
        scheduleHudStandard();
        centerModel();
    });

    btnResetState.addEventListener("click", () => {
        loadScene(currentScene);
    });

    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (e) => {
        if (e.target === modalHelp) modalHelp.classList.remove("active");
    });

    // 暴露状态接口
    window.appState = {
        get currentScene() { return currentScene; },
        get sqrtTarget() { return sqrtTarget; },
        get animProgress() { return animProgress; },
        set animProgress(val) {
            animProgress = val;
        },
        get nestLevel() { return nestLevel; },
        get valVolume() { return valVolume; },
        get valSide() { return valSide; },
        loadScene,
        applyPreset,
        centerModel
    };

    // 初始化运行
    loadScene("sqrt-construction");
    requestAnimationFrame(updateFrame);

    window.addEventListener("resize", () => {
        scheduleHudStandard();
        centerModel();
    });
});

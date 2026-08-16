/**
 * 无理数逼近与根号定位 - 课件交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态与参数
    // ==========================================================================
    let currentScene = "theodorus-spiral"; // theodorus-spiral | decimal-bisection | continued-fraction
    let isHudExpanded = false;
    let currentTheoryTitle = "";
    let currentTheoryBody = "";

    // 数轴原点 0 点的屏幕坐标
    let O = { x: 400, y: 350 };
    let unitWidth = 120; // 1个刻度单位所占像素宽度

    // 常用变焦参数 (LERP 补间使用)
    let zoomScale = 1.0;
    let panX = 0, panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // LERP 渲染平滑值
    const renderValues = {
        animProgress: 0.0,
        viewMathMin: -1.5,
        viewMathMax: 5.5
    };

    // 场景 1：奥多鲁斯螺旋参数
    let spiralTarget = "sqrt5"; // sqrt2 | sqrt3 | sqrt5 | sqrt6 | sqrt7 | sqrt8
    let animProgress = 0.0;   // 0.0 到 1.0
    let isPlaying = false;
    let guessPointValue = 2.18;
    let isDraggingGuessPoint = false;

    // 场景 2：十进制小数夹逼参数
    let bisectionTarget = "pi"; // sqrt2 | sqrt3 | pi
    let nestLevel = 0;          // 0 到 4 级逼近
    let targetViewLimits = { min: -0.5, max: 5.5 };

    // 场景 3：连分数交替逼近参数
    let cfTarget = "pi"; // sqrt2 | pi
    let maxCfSteps = 3;  // 当前展示到第几阶近似
    let cfAnimProgress = 1.0;
    let isCfPlaying = false;

    // 各数值常数定义
    const CONSTANTS = {
        sqrt2: { val: Math.sqrt(2), label: "√2", decimalStr: "1.414213562" },
        sqrt3: { val: Math.sqrt(3), label: "√3", decimalStr: "1.732050807" },
        sqrt5: { val: Math.sqrt(5), label: "√5", decimalStr: "2.236067977" },
        sqrt6: { val: Math.sqrt(6), label: "√6", decimalStr: "2.449489743" },
        sqrt7: { val: Math.sqrt(7), label: "√7", decimalStr: "2.645751311" },
        sqrt8: { val: Math.sqrt(8), label: "√8", decimalStr: "2.828427124" },
        pi: { val: Math.PI, label: "π", decimalStr: "3.1415926535" }
    };

    // 连分数近似值列表 (convergents)
    const CONVERGENTS = {
        sqrt2: [
            { num: 1, den: 1, val: 1.0 },
            { num: 3, den: 2, val: 1.5 },
            { num: 7, den: 5, val: 1.4 },
            { num: 17, den: 12, val: 1.4166667 },
            { num: 41, den: 29, val: 1.4137931 },
            { num: 99, den: 70, val: 1.4142857 }
        ],
        pi: [
            { num: 3, den: 1, val: 3.0, comment: "个位近似" },
            { num: 22, den: 7, val: 3.142857, comment: "祖冲之约率" },
            { num: 333, den: 106, val: 3.1415094, comment: "渐进分数" },
            { num: 355, den: 113, val: 3.1415929, comment: "祖冲之密率 (世界纪录级)" }
        ]
    };

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

    // ==========================================================================
    // 3. 数轴数学映射函数
    // ==========================================================================
    function getPixelX(val) {
        const curMin = renderValues.viewMathMin;
        const curMax = renderValues.viewMathMax;
        
        const W = sandboxWrapper.clientWidth;
        const isDesktop = W > 800;
        // HUD 展开宽度为 360px，右侧留有 20px 安全间隙 = 390px；折叠时右侧留有 20px = 235px
        const L_min = isDesktop ? (isHudExpanded ? 390 : 235) : 30;
        const R_max = W - 40;
        
        const pct = (val - curMin) / (curMax - curMin);
        return L_min + pct * (R_max - L_min);
    }

    function getMathVal(px) {
        const curMin = renderValues.viewMathMin;
        const curMax = renderValues.viewMathMax;
        
        const W = sandboxWrapper.clientWidth;
        const isDesktop = W > 800;
        const L_min = isDesktop ? (isHudExpanded ? 390 : 235) : 30;
        const R_max = W - 40;

        const pct = (px - L_min) / (R_max - L_min);
        return curMin + pct * (curMax - curMin);
    }

    function getAxisOriginX() {
        return getPixelX(0);
    }

    function getAxisUnitWidth() {
        return Math.abs(getPixelX(1) - getPixelX(0));
    }

    // ==========================================================================
    // 4. LERP 渲染平滑循环
    // ==========================================================================
    function updateFrame() {
        // A. 螺旋动画进度
        if (isPlaying && currentScene === "theodorus-spiral") {
            animProgress += 0.0035;
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
            if (valInd) valInd.textContent = getTheodorusStageInfo(animProgress).phase;
        }

        if (isCfPlaying && currentScene === "continued-fraction") {
            const list = CONVERGENTS[cfTarget];
            const maxStepLimit = Math.max(1, list.length - 1);
            cfAnimProgress += 0.006;
            if (cfAnimProgress >= 1) {
                cfAnimProgress = 1;
                isCfPlaying = false;
                const playCfBtn = document.getElementById("btn-play-cf");
                if (playCfBtn) playCfBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放连分数动画</span>`;
            }
            const cfState = getCfAnimationState();
            maxCfSteps = Math.min(maxStepLimit, Math.max(0, cfState.visibleIndex));
            const sliderCF = document.getElementById("slider-cf-steps");
            if (sliderCF) {
                sliderCF.value = String(maxCfSteps);
                syncSceneSliderFill(sliderCF);
            }
            const valInd = document.getElementById("val-indicator-cf");
            if (valInd) valInd.textContent = `第 ${maxCfSteps + 1} 阶`;
        }

        // B. LERP 补间
        const k = 0.18;
        renderValues.animProgress += (animProgress - renderValues.animProgress) * k;
        renderValues.viewMathMin += (targetViewLimits.min - renderValues.viewMathMin) * k;
        renderValues.viewMathMax += (targetViewLimits.max - renderValues.viewMathMax) * k;

        renderSVG();
        updateHTMLOverlayAndHUD();
        requestAnimationFrame(updateFrame);
    }

    // ==========================================================================
    // 5. SVG 路径与数轴刻度绘制
    // ==========================================================================
    function injectPatternDefs() {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <pattern id="diagonal-stripes" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="var(--color-orange)" stroke-width="3" opacity="0.15" />
            </pattern>
        `;
        sandboxSvg.appendChild(defs);
    }

    // 绘制基本数轴与刻度
    function drawAxisBase(drawHtml, axisY) {
        const curMin = renderValues.viewMathMin;
        const curMax = renderValues.viewMathMax;
        
        const W = sandboxWrapper.clientWidth;
        const isDesktop = W > 800;
        const L_min = isDesktop ? (isHudExpanded ? 390 : 235) : 30;
        const R_max = W - 40;

        // 主干线
        drawHtml += `
            <line class="geo-line-seg axis-line" x1="${L_min}" y1="${axisY}" x2="${R_max}" y2="${axisY}"></line>
            <path d="M ${R_max} ${axisY} L ${R_max - 12} ${axisY - 6} L ${R_max - 12} ${axisY + 6} Z" fill="#0f172a"></path>
            <text class="geo-label" style="font-weight:700;" x="${R_max + 10}" y="${axisY + 4}">x</text>
        `;

        // 确定步长
        let step = 1.0;
        const range = curMax - curMin;
        if (range <= 0.02) step = 0.001;
        else if (range <= 0.2) step = 0.01;
        else if (range <= 2.0) step = 0.1;

        let startTick = Math.ceil(curMin / step) * step;
        let endTick = Math.floor(curMax / step) * step;

        for (let t = startTick; t <= endTick; t += step) {
            const val = parseFloat(t.toFixed(4));
            const tickX = getPixelX(val);
            const isOrigin = Math.abs(val) < 0.0001;

            let isMainTick = true;
            if (step === 0.001 && Math.round(val * 1000) % 5 !== 0) isMainTick = false;
            if (step === 0.01 && Math.round(val * 100) % 5 !== 0) isMainTick = false;
            if (step === 0.1 && Math.round(val * 10) % 5 !== 0 && !isOrigin) isMainTick = false;

            const tickH = isOrigin ? 12 : (isMainTick ? 8 : 4);
            const tickClass = isOrigin ? "origin-tick" : "tick-line";

            let labelText = val.toString();
            if (step === 0.001) labelText = val.toFixed(3);
            else if (step === 0.01) labelText = val.toFixed(2);
            else if (step === 0.1) labelText = val.toFixed(1);

            drawHtml += `
                <line class="${tickClass}" x1="${tickX}" y1="${axisY - tickH}" x2="${tickX}" y2="${axisY + tickH}"></line>
            `;

            if (isMainTick || isOrigin) {
                const labelClass = isOrigin ? "tick-label origin-label" : "tick-label";
                drawHtml += `
                    <text class="${labelClass}" x="${tickX}" y="${axisY + 22}" text-anchor="middle">${labelText}</text>
                `;
            }
        }
        return drawHtml;
    }

    // 计算奥多鲁斯螺旋的第 N 个顶点 (极坐标转换为直角坐标)
    // 返回包含 {x, y} 的顶点坐标数组，长度为 N + 2 (包括原点和 (1,0) 起始点)
    function generateTheodorusVertices(maxN) {
        const vertices = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
        let currentTheta = 0;

        for (let i = 1; i <= maxN; i++) {
            const r = Math.sqrt(i + 1);
            const deltaTheta = Math.atan2(1, Math.sqrt(i));
            currentTheta += deltaTheta;
            
            vertices.push({
                x: r * Math.cos(currentTheta),
                y: r * Math.sin(currentTheta)
            });
        }
        return vertices;
    }

    function getSpiralRadicand(target = spiralTarget) {
        return Number(target.replace("sqrt", ""));
    }

    function getSpiralTriangleCount(target = spiralTarget) {
        return Math.max(1, getSpiralRadicand(target) - 1);
    }

    function getTheodorusStageInfo(progress = renderValues.animProgress) {
        const radicand = getSpiralRadicand();
        const targetN = getSpiralTriangleCount();
        const targetLabel = `√${radicand}`;
        if (progress < 0.04) {
            return {
                phase: "起点",
                step: "当前步骤：先观察待构造轮廓",
                detail: `目标是在数轴上定位 ${targetLabel}，先从单位直角三角形出发。`,
                formula: "1² + 1² = 2",
                stageIndex: 0
            };
        }
        if (progress < 0.7) {
            const spiralProgress = Math.min(1, progress / 0.7);
            const currentStep = Math.min(targetN, Math.max(1, Math.ceil(spiralProgress * targetN)));
            const fromRoot = currentStep === 1 ? "1" : `√${currentStep}`;
            const toRoot = `√${currentStep + 1}`;
            return {
                phase: "构造",
                step: `当前步骤：第 ${currentStep} 个直角三角形`,
                detail: `以上一步斜边 ${fromRoot} 为一条直角边，再接单位边 1，得到 ${toRoot}。`,
                formula: currentStep === 1 ? "1² + 1² = 2" : `(√${currentStep})² + 1² = ${currentStep + 1}`,
                stageIndex: 1
            };
        }
        if (progress < 0.96) {
            return {
                phase: "投影",
                step: `当前步骤：把 ${targetLabel} 的长度转到数轴`,
                detail: "用圆弧保持半径不变，将斜边长度旋到 x 轴上。",
                formula: `${targetLabel} ≈ ${Math.sqrt(radicand).toFixed(4)}`,
                stageIndex: 2
            };
        }
        return {
            phase: "定位",
            step: `当前步骤：读出 ${targetLabel} 的数轴位置`,
            detail: `${targetLabel} 落在 ${Math.floor(Math.sqrt(radicand))} 和 ${Math.ceil(Math.sqrt(radicand))} 之间。`,
            formula: `${targetLabel} = ${Math.sqrt(radicand).toFixed(6)}...`,
            stageIndex: 3
        };
    }

    function getCfAnimationState(progress = cfAnimProgress) {
        const list = CONVERGENTS[cfTarget];
        const maxIndex = Math.max(0, list.length - 1);
        const clampedProgress = Math.min(1, Math.max(0, progress));
        const rawStep = clampedProgress * maxIndex;
        const settledIndex = Math.min(maxIndex, Math.floor(rawStep));
        const revealT = Math.min(1, Math.max(0, rawStep - settledIndex));
        const visibleIndex = Math.min(maxIndex, revealT > 0.02 ? settledIndex + 1 : settledIndex);
        const activeIndex = visibleIndex;
        const activeItem = list[activeIndex];
        const exactVal = CONSTANTS[cfTarget].val;
        const error = activeItem.val - exactVal;
        const side = Math.abs(error) < 0.0000005 ? "命中" : (error > 0 ? "右侧偏大" : "左侧偏小");
        const phase = activeIndex === 0 ? "粗定位" : (activeIndex === maxIndex && clampedProgress >= 0.98 ? "高精度收敛" : "左右摆动");
        return { maxIndex, settledIndex, visibleIndex, activeIndex, revealT, activeItem, exactVal, error, side, phase };
    }

    function formatCfValue(value, digits = 8) {
        return Number(value).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
    }

    function getCfVisualPoint(item, index, total, cfState, axisY, exactX) {
        const W = sandboxWrapper.clientWidth;
        const isLeft = item.val < cfState.exactVal;
        const maxSpread = Math.min(270, Math.max(165, W * 0.26));
        const minSpread = 48;
        const spread = Math.max(minSpread, maxSpread * Math.pow(0.58, index));
        const finalX = exactX + (isLeft ? -spread : spread);
        const laneY = index % 2 === 0 ? axisY - 132 + Math.min(index, 4) * 18 : axisY + 112 - Math.min(index, 4) * 15;
        const entering = isCfPlaying && index === cfState.visibleIndex && index > cfState.settledIndex;
        const easeT = entering ? (1 - Math.pow(1 - cfState.revealT, 3)) : 1;
        const previousSpread = Math.max(minSpread, maxSpread * Math.pow(0.58, Math.max(0, index - 1)));
        const launchX = exactX + (isLeft ? -previousSpread * 1.2 : previousSpread * 1.2);
        const launchY = index % 2 === 0 ? axisY - 185 : axisY + 165;
        return {
            x: entering ? launchX + (finalX - launchX) * easeT : finalX,
            y: entering ? launchY + (laneY - launchY) * easeT : laneY,
            targetX: finalX,
            targetY: laneY,
            spread,
            isLeft,
            opacity: entering ? Math.max(0.28, easeT) : 1
        };
    }

    function drawTheodorusGhostGuide(drawHtml, vertices, getSpiralPixel, targetN, progress = 0) {
        const origin = getSpiralPixel(vertices[0]);
        const unitPoint = getSpiralPixel(vertices[1]);
        drawHtml += `
            <line class="theodorus-start-segment" x1="${origin.x}" y1="${origin.y}" x2="${unitPoint.x}" y2="${unitPoint.y}"></line>
            <circle class="theodorus-start-dot" cx="${origin.x}" cy="${origin.y}" r="5"></circle>
            <circle class="theodorus-unit-dot" cx="${unitPoint.x}" cy="${unitPoint.y}" r="4"></circle>
            <text class="theodorus-start-label" x="${origin.x - 6}" y="${origin.y + 38}" text-anchor="middle">从 0 开始</text>
            <text class="theodorus-unit-label" x="${(origin.x + unitPoint.x) / 2}" y="${origin.y - 12}" text-anchor="middle">单位线段 1</text>
        `;
        for (let i = 1; i <= targetN; i++) {
            const pt0 = getSpiralPixel(vertices[0]);
            const pt1 = getSpiralPixel(vertices[i]);
            const pt2 = getSpiralPixel(vertices[i + 1]);
            drawHtml += `
                <polygon class="theodorus-ghost-triangle" points="${pt0.x},${pt0.y} ${pt1.x},${pt1.y} ${pt2.x},${pt2.y}"></polygon>
            `;
        }
        const showGhostLabel = progress < 0.1;
        if (showGhostLabel) {
            const tip = getSpiralPixel(vertices[Math.min(targetN + 1, vertices.length - 1)]);
            drawHtml += `
                <text class="theodorus-ghost-label" x="${tip.x + 18}" y="${tip.y - 12}">待构造轮廓</text>
            `;
        }
        return drawHtml;
    }

    // ==========================================================================
    // 6. SVG 主渲染逻辑
    // ==========================================================================
    function renderSVG() {
        let drawHtml = "";
        const axisY = O.y;

        // 1. 绘制基本变焦数轴
        drawHtml = drawAxisBase(drawHtml, axisY);

        // ==========================================================================
        // 场景 1: 奥多鲁斯螺旋与根号定位
        // ==========================================================================
        if (currentScene === "theodorus-spiral") {
            const progress = renderValues.animProgress;
            
            // 确定螺旋要绘制的三角形上限 N
            const targetN = getSpiralTriangleCount();

            // 极坐标方程计算顶点
            const vertices = generateTheodorusVertices(targetN);

            // 比例单位对应像素大小 (奥多鲁斯螺旋用 O 做中心进行绘制)
            const originX = getAxisOriginX();
            const spiralUnitWidth = getAxisUnitWidth();
            const getSpiralPixel = (pt) => {
                return {
                    x: originX + pt.x * spiralUnitWidth,
                    y: O.y - pt.y * spiralUnitWidth // 垂直翻转
                };
            };

            drawHtml = drawTheodorusGhostGuide(drawHtml, vertices, getSpiralPixel, targetN, progress);

            // 计算动画当前允许渲染的三角形个数
            // 0.0 到 0.7 渲染螺旋展开，0.7 到 1.0 渲染圆规下旋
            const spiralProgress = Math.min(1.0, progress / 0.7);
            const currentTriCount = Math.floor(spiralProgress * targetN);
            const remainderPct = (spiralProgress * targetN) - currentTriCount;

            // 绘制完全展开的三角形
            for (let i = 1; i <= targetN; i++) {
                const pt0 = getSpiralPixel(vertices[0]); // 原点 (0,0)
                const pt1 = getSpiralPixel(vertices[i]);
                const pt2 = getSpiralPixel(vertices[i + 1]);

                // HSL Rainbow 渐变色彩设计
                const colorH = (i * 38) % 360;
                const fillStyle = `fill: hsl(${colorH}, 72%, 58%); stroke: hsl(${colorH}, 75%, 42%);`;

                if (i <= currentTriCount) {
                    const isActiveTri = i === Math.max(1, currentTriCount);
                    drawHtml += `
                        <!-- 三角形填充 -->
                        <polygon class="spiral-triangle-fill ${isActiveTri ? "active-triangle" : ""}" style="${fillStyle}" points="${pt0.x},${pt0.y} ${pt1.x},${pt1.y} ${pt2.x},${pt2.y}"></polygon>
                        <!-- 直角边 1 突出线 -->
                        <line class="spiral-triangle-edge unit-edge" style="stroke: hsl(${colorH}, 75%, 42%);" x1="${pt1.x}" y1="${pt1.y}" x2="${pt2.x}" y2="${pt2.y}"></line>
                        <line class="spiral-radius-guide" x1="${pt0.x}" y1="${pt0.y}" x2="${pt2.x}" y2="${pt2.y}"></line>
                        <!-- 标上 1 -->
                        <text class="geo-label" style="fill: hsl(${colorH}, 80%, 30%); font-size:10px;" x="${(pt1.x + pt2.x)/2 + 6}" y="${(pt1.y + pt2.y)/2 + 3}">1</text>
                    `;
                } else if (i === currentTriCount + 1 && remainderPct > 0.05) {
                    // 绘制正在生长展开的第 i 个三角形
                    // 点 2 沿着直角边 1 生长
                    const growingX = pt1.x + (pt2.x - pt1.x) * remainderPct;
                    const growingY = pt1.y + (pt2.y - pt1.y) * remainderPct;
                    
                    drawHtml += `
                        <polygon class="spiral-triangle-fill" style="${fillStyle} fill-opacity: ${remainderPct * 0.12};" points="${pt0.x},${pt0.y} ${pt1.x},${pt1.y} ${growingX},${growingY}"></polygon>
                        <line class="spiral-triangle-edge" style="stroke: hsl(${colorH}, 75%, 42%);" x1="${pt1.x}" y1="${pt1.y}" x2="${growingX}" y2="${growingY}"></line>
                    `;
                }
            }

            // 绘制最外侧斜线 (斜边)
            if (spiralProgress > 0.65) {
                const pt0 = getSpiralPixel(vertices[0]);
                const ptTarget = getSpiralPixel(vertices[targetN + 1]);
                drawHtml += `
                    <!-- 终点斜边高亮 -->
                    <line class="spiral-hypot" style="stroke: var(--color-sqrt);" x1="${pt0.x}" y1="${pt0.y}" x2="${ptTarget.x}" y2="${ptTarget.y}"></line>
                    <text class="geo-label target-root-label" x="${(pt0.x + ptTarget.x) / 2 + 8}" y="${(pt0.y + ptTarget.y) / 2 - 8}">√${targetN + 1}</text>
                `;
            }

            // 绘制下旋圆弧
            if (progress > 0.7) {
                const arcProgress = Math.min(1.0, (progress - 0.7) / 0.3);
                const ptTarget = getSpiralPixel(vertices[targetN + 1]);
                
                const targetVal = Math.sqrt(targetN + 1);
                const pxTarget = getPixelX(targetVal);

                const r_px = targetVal * spiralUnitWidth;
                const startAngle = Math.atan2(ptTarget.y - O.y, ptTarget.x - originX); // 负值 (在上方)
                const currentAngle = startAngle + (0 - startAngle) * arcProgress;

                const arcEndX = originX + r_px * Math.cos(currentAngle);
                const arcEndY = O.y + r_px * Math.sin(currentAngle);

                drawHtml += `
                    <!-- 下旋圆弧 -->
                    <path class="compass-arc" d="M ${ptTarget.x} ${ptTarget.y} A ${r_px} ${r_px} 0 0 1 ${arcEndX} ${arcEndY}"></path>
                    <!-- 旋转中的橙色射线 -->
                    <line class="spiral-hypot" style="stroke: var(--color-orange); stroke-width:1.5px; opacity:0.5;" x1="${originX}" y1="${O.y}" x2="${arcEndX}" y2="${arcEndY}"></line>
                `;

                if (arcProgress > 0.95) {
                    drawHtml += `
                        <circle cx="${pxTarget}" cy="${axisY}" r="5" fill="var(--color-orange)" filter="drop-shadow(0 0 4px var(--color-orange))"></circle>
                        <line class="final-root-marker" x1="${pxTarget}" y1="${axisY - 28}" x2="${pxTarget}" y2="${axisY + 26}"></line>
                        <text class="geo-label final-root-label" x="${pxTarget}" y="${axisY - 34}" text-anchor="middle">√${targetN + 1} ≈ ${targetVal.toFixed(3)}</text>
                    `;
                }
            }

            const guessX = getPixelX(guessPointValue);
            const targetValue = Math.sqrt(targetN + 1);
            const guessColor = Math.abs(guessPointValue - targetValue) < 0.035 ? "var(--color-green)" : (guessPointValue < targetValue ? "var(--color-blue)" : "var(--color-orange)");
            drawHtml += `
                <g class="guess-point-layer">
                    <line class="guess-point-line" x1="${guessX}" y1="${axisY - 38}" x2="${guessX}" y2="${axisY + 34}"></line>
                    <circle class="guess-point-handle" cx="${guessX}" cy="${axisY}" r="9" style="fill:${guessColor};"></circle>
                    <text class="guess-point-text" x="${guessX}" y="${axisY + 50}" text-anchor="middle">拖动猜测点</text>
                </g>
            `;
        }

        // ==========================================================================
        // 场景 2: 十进制小数夹逼
        // ==========================================================================
        else if (currentScene === "decimal-bisection") {
            const targetVal = CONSTANTS[bisectionTarget].val;
            const pxTarget = getPixelX(targetVal);

            // 获取当前精度区间的左边界和右边界
            let leftB = 1.0;
            let rightB = 2.0;

            if (nestLevel === 0) {
                leftB = Math.floor(targetVal);
                rightB = leftB + 1.0;
            } else {
                const decStr = CONSTANTS[bisectionTarget].decimalStr;
                // 获取前 nestLevel 位小数
                const valStr = decStr.substring(0, decStr.indexOf(".") + 1 + nestLevel);
                leftB = parseFloat(valStr);
                rightB = leftB + Math.pow(10, -nestLevel);
            }

            const pxLeft = getPixelX(leftB);
            const pxRight = getPixelX(rightB);
            
            const shH = 16;
            const shY = axisY - shH / 2;

            drawHtml += `
                <!-- 夹逼网纹条带 -->
                <rect class="nesting-range-rect" x="${pxLeft}" y="${shY}" width="${pxRight - pxLeft}" height="${shH}"></rect>
                <rect class="nesting-range-pattern" x="${pxLeft}" y="${shY}" width="${pxRight - pxLeft}" height="${shH}"></rect>
                
                <!-- 精确目标点 -->
                <circle cx="${pxTarget}" cy="${axisY}" r="6" fill="var(--color-sqrt)" filter="drop-shadow(0 0 5px var(--color-sqrt))"></circle>
            `;
        }

        // ==========================================================================
        // 场景 3: 连分数与交替逼近
        // ==========================================================================
        else if (currentScene === "continued-fraction") {
            const targetVal = CONSTANTS[cfTarget].val;
            const pxTarget = getPixelX(targetVal);
            const cfState = getCfAnimationState();
            const list = CONVERGENTS[cfTarget];
            const activeList = list.slice(0, cfState.visibleIndex + 1);
            const W = sandboxWrapper.clientWidth;
            const bandLeft = Math.max(42, pxTarget - Math.min(315, W * 0.32));
            const bandRight = Math.min(W - 42, pxTarget + Math.min(315, W * 0.32));
            const bandTop = axisY - 185;
            const bandBottom = axisY + 165;

            // 绘制误差放大轨道：横向距离是“可视化放大的误差”，不是原始数轴像素距离。
            drawHtml += `
                <rect class="cf-zoom-band" x="${bandLeft}" y="${bandTop}" width="${bandRight - bandLeft}" height="${bandBottom - bandTop}" rx="18"></rect>
                <line class="exact-line-indicator" x1="${pxTarget}" y1="${bandTop + 18}" x2="${pxTarget}" y2="${bandBottom - 16}"></line>
                <text class="cf-target-label" x="${pxTarget}" y="${bandTop + 6}" text-anchor="middle">${CONSTANTS[cfTarget].label} = ${formatCfValue(targetVal, cfTarget === "pi" ? 9 : 8)}</text>
                <text class="cf-lane-label cf-left-lane" x="${bandLeft + 18}" y="${bandTop + 28}" text-anchor="start">偏小：落在目标左侧</text>
                <text class="cf-lane-label cf-right-lane" x="${bandRight - 18}" y="${bandTop + 28}" text-anchor="end">偏大：落在目标右侧</text>
                <text class="cf-zoom-caption" x="${pxTarget}" y="${bandBottom - 8}" text-anchor="middle">误差放大轨道：越靠近紫色目标线，分数越精确</text>
            `;

            // 绘制连接交替点的阻尼振荡曲线。
            let pathD = "";
            let pointsData = [];

            activeList.forEach((item, index) => {
                const visual = getCfVisualPoint(item, index, list.length, cfState, axisY, pxTarget);
                pointsData.push({
                    ...visual,
                    val: item.val,
                    label: `${item.num}/${item.den}`,
                    valueText: formatCfValue(item.val, item.den > 100 ? 8 : 6),
                    errorText: Math.abs(item.val - targetVal).toExponential(2)
                });

                if (index === 0) {
                    pathD += `M ${visual.x} ${visual.y}`;
                }
                
                // 用贝塞尔曲线连接交替摆动点
                const prevPt = pointsData[index - 1];
                if (prevPt) {
                    const cpX = (prevPt.x + visual.x) / 2;
                    const cpY = index % 2 === 0 ? axisY - 172 : axisY + 150;
                    pathD += ` Q ${cpX} ${cpY} ${visual.x} ${visual.y}`;
                }
            });

            if (activeList.length > 1) {
                drawHtml += `
                    <!-- 振荡收敛虚线 -->
                    <path class="convergence-curve" d="${pathD}"></path>
                `;
            }

            // 绘制近似分数坐标点与垂直指示线
            pointsData.forEach((pt, index) => {
                const ptColor = index % 2 === 0 ? "var(--color-blue)" : "var(--color-orange)";
                const currentClass = index === cfState.activeIndex ? " current" : "";
                const sideText = pt.val > targetVal ? "偏大" : "偏小";
                const labelAnchor = pt.isLeft ? "end" : "start";
                const labelDx = pt.isLeft ? -13 : 13;
                const sideY = pt.y + (index % 2 === 0 ? -24 : 36);
                const errorY = pt.y + (index % 2 === 0 ? 28 : -14);
                drawHtml += `
                    <!-- 指向精确目标线的误差箭头 -->
                    <line class="cf-approx-guide${currentClass}" x1="${pt.x}" y1="${pt.y}" x2="${pxTarget}" y2="${pt.y}" stroke="${ptColor}" stroke-width="1.2" stroke-dasharray="4,4" opacity="${pt.opacity}"></line>
                    <!-- 分数圆点 -->
                    <circle class="convergent-point cf-approx-step${currentClass}" data-motion="pendulum" style="fill:${ptColor}; opacity:${pt.opacity};" cx="${pt.x}" cy="${pt.y}" r="${index === cfState.activeIndex ? 9 : 7}"></circle>
                    ${index === cfState.activeIndex ? `<circle class="cf-landing-pulse" cx="${pt.x}" cy="${pt.y}" r="18"></circle>` : ""}
                    <!-- 分数值文本 -->
                    <text class="geo-label cf-step-label" style="fill:${ptColor}; opacity:${pt.opacity};" x="${pt.x + labelDx}" y="${sideY}" text-anchor="${labelAnchor}">
                        <tspan x="${pt.x + labelDx}" dy="0">${pt.label}</tspan>
                        <tspan x="${pt.x + labelDx}" dy="14">≈ ${pt.valueText}</tspan>
                    </text>
                    <text class="geo-label cf-side-label" style="fill:${ptColor}; opacity:${pt.opacity};" x="${pt.x + labelDx}" y="${errorY}" text-anchor="${labelAnchor}">${sideText} |误差 ${pt.errorText}|</text>
                `;
            });

            // 目标精确点与当前误差读数
            const activePt = pointsData[pointsData.length - 1] || getCfVisualPoint(cfState.activeItem, cfState.activeIndex, list.length, cfState, axisY, pxTarget);
            const errorBarY = axisY + 184;
            const errorBarX = Math.min(activePt.x, pxTarget);
            const errorBarWidth = Math.max(14, Math.abs(activePt.x - pxTarget));
            drawHtml += `
                <circle cx="${pxTarget}" cy="${axisY}" r="6.5" fill="var(--color-sqrt)" filter="drop-shadow(0 0 5px var(--color-sqrt))"></circle>
                <line class="cf-error-bar" x1="${errorBarX}" y1="${errorBarY}" x2="${errorBarX + errorBarWidth}" y2="${errorBarY}"></line>
                <text class="geo-label cf-error-label" x="${(activePt.x + pxTarget) / 2}" y="${errorBarY + 24}" text-anchor="middle">当前误差 |${Math.abs(cfState.error).toExponential(2)}|</text>
            `;
        }

        sandboxSvg.innerHTML = "";
        injectPatternDefs();
        sandboxSvg.innerHTML += drawHtml;
    }

    // ==========================================================================
    // 7. HTML 飘浮读数渲染与 HUD 板书更新
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        let overlayHtml = "";
        const axisY = O.y;

        if (currentScene === "theodorus-spiral") {
            const progress = renderValues.animProgress;
            const radicand = getSpiralRadicand();
            const targetValue = Math.sqrt(radicand);
            const targetX = getPixelX(targetValue);
            const guessX = getPixelX(guessPointValue);
            const diff = guessPointValue - targetValue;
            const guessText = Math.abs(diff) < 0.035 ? "很接近" : (diff < 0 ? "偏左：偏小" : "偏右：偏大");
            overlayHtml += `
                <div class="guess-feedback" style="left:${guessX}px; top:${axisY + 64}px">
                    猜测 ${guessPointValue.toFixed(3)}，${guessText}
                </div>
            `;
            if (progress > 0.98) {
                overlayHtml += `<div class="coord-label-box lbl-sqrt" style="left:${targetX}px; top:${axisY - 24}px">√${radicand}: ${targetValue.toFixed(4)}...</div>`;
            }
        } 
        
        else if (currentScene === "decimal-bisection") {
            const targetVal = CONSTANTS[bisectionTarget].val;
            const pxTarget = getPixelX(targetVal);
            const lbl = CONSTANTS[bisectionTarget].label;
            overlayHtml += `<div class="coord-label-box lbl-orange" style="left:${pxTarget}px; top:${axisY - 24}px">${lbl}: ${targetVal.toFixed(6)}</div>`;
        } 
        
        else if (currentScene === "continued-fraction") {
            overlayHtml += "";
        }

        htmlOverlay.innerHTML = overlayHtml;

        updateHUDContent();
    }

    function renderTheoryHudBlock(title, bodyHtml) {
        if (!title || !bodyHtml) return "";
        return `
            <div class="hud-theory-block">
                <div class="hud-theory-title">${title}</div>
                <div class="hud-theory-body">${bodyHtml}</div>
            </div>
        `;
    }

    function updateHUDContent() {
        let html = "";

        if (currentScene === "theodorus-spiral") {
            let targetLabel = "√5";
            let triChain = "";
            const radicand = getSpiralRadicand();
            const stage = getTheodorusStageInfo();
            const targetValue = Math.sqrt(radicand);
            const diff = guessPointValue - targetValue;
            const guessMessage = Math.abs(diff) < 0.035
                ? "猜测点已贴近真实位置"
                : (diff < 0 ? "猜测点在目标左侧，数值偏小" : "猜测点在目标右侧，数值偏大");

            if (spiralTarget === "sqrt2") { targetLabel = "√2"; triChain = "1个三角形 (直角边 1, 1)"; }
            else if (spiralTarget === "sqrt3") { targetLabel = "√3"; triChain = "2个三角形 (直角边 1, 1 ⇒ 得到 √2 再加高 1)"; }
            else if (spiralTarget === "sqrt5") { targetLabel = "√5"; triChain = "4个三角形依次累加直角边 1 得到"; }
            else if (spiralTarget === "sqrt6") { targetLabel = "√6"; triChain = "5个三角形依次累加直角边 1 得到"; }
            else if (spiralTarget === "sqrt7") { targetLabel = "√7"; triChain = "6个三角形依次累加直角边 1 得到"; }
            else if (spiralTarget === "sqrt8") { targetLabel = "√8"; triChain = "7个三角形依次累加直角边 1 得到"; }

            html = `
                <div class="hud-summary-card">
                    <div class="hud-summary-grid">
                        <div class="hud-chip">定位目标</div>
                        <div class="hud-summary-main">在数轴上绘制 <span class="math-seg seg-sqrt" data-highlight="sqrt">${targetLabel}</span> 的精确点</div>
                    </div>
                    <div class="hud-summary-grid">
                        <div class="hud-chip">构造路径</div>
                        <div class="hud-summary-main">螺旋展开共需 <strong>${triChain}</strong></div>
                    </div>
                    <div class="hud-summary-note">关键想法：用连续直角三角形把根号长度转化为可见的数轴位置。</div>
                </div>
                <div class="hud-current-step">
                    <div class="hud-step-head">
                        <span class="hud-step-pill">作图阶段：${stage.phase}</span>
                        <span class="hud-step-mini">当前步骤</span>
                    </div>
                    <strong>${stage.step}</strong>
                    <p>${stage.detail}</p>
                    <div class="hud-stage-track" aria-hidden="true">
                        ${["起点", "构造", "投影", "定位"].map((name, index) => `<span class="${index <= stage.stageIndex ? "active" : ""}">${name}</span>`).join("")}
                    </div>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">勾股定理螺旋链公式</div>
                    <div class="formula hud-formula-list">
                        <div class="hud-formula-step"><span>1</span><b>1² + 1² = 2</b><em>斜边 = √2</em></div>
                        <div class="hud-formula-step"><span>2</span><b>(√2)² + 1² = 3</b><em>斜边 = √3</em></div>
                        <div class="hud-formula-step"><span>n</span><b>(√n)² + 1² = n+1</b><em>斜边 = √(n+1)</em></div>
                    </div>
                </div>
                <div class="hud-guess-card">
                    <span>拖动猜测点</span>
                    <strong>${guessPointValue.toFixed(3)}</strong>
                    <em>${guessMessage}</em>
                </div>
            `;
        } 
        
        else if (currentScene === "decimal-bisection") {
            const c = CONSTANTS[bisectionTarget];
            const targetVal = c.val;

            // 打字机格式化：把前 nestLevel 位高亮，后面的置灰
            const decStr = c.decimalStr;
            const ptIdx = decStr.indexOf(".");
            const endIdx = ptIdx + 1 + nestLevel;

            const partInteger = decStr.substring(0, ptIdx);
            const partDecimalActive = decStr.substring(ptIdx + 1, endIdx);
            const partDecimalMuted = decStr.substring(endIdx);

            const displayValueHtml = `
                <span style="color:var(--color-orange); font-weight:800;">${partInteger}.${partDecimalActive}</span><span style="color:var(--text-muted); font-weight:normal;">${partDecimalMuted}...</span>
            `;

            // 范围显示
            let leftB = 1.0;
            let rightB = 2.0;
            if (nestLevel === 0) {
                leftB = Math.floor(targetVal);
                rightB = leftB + 1.0;
            } else {
                const valStr = decStr.substring(0, endIdx);
                leftB = parseFloat(valStr);
                rightB = leftB + Math.pow(10, -nestLevel);
            }

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">当前逼近无理数</div>
                    <div class="hud-row-val">
                        ${c.label} = ${displayValueHtml}
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">逼近小数级别</div>
                    <div class="hud-row-val" style="color: var(--color-orange);">
                        ${nestLevel === 0 ? '个位整数级' : `小数第 ${nestLevel} 位 (精度 10⁻${nestLevel})`}
                    </div>
                </div>
                <div class="hud-equation-box orange-box">
                    <div class="title">当前夹逼区间范围</div>
                    <div class="formula" style="font-size:15px; font-weight:800;">
                        ${leftB} < ${c.label} < ${rightB.toFixed(nestLevel)}
                    </div>
                </div>
            `;
        } 
        
        else if (currentScene === "continued-fraction") {
            const list = CONVERGENTS[cfTarget];
            const cfState = getCfAnimationState();
            const currentItem = cfState.activeItem;
            const exactVal = CONSTANTS[cfTarget].val;
            const error = cfState.error;
            const signText = error > 0 ? "比精确值偏大，在目标右侧" : "比精确值偏小，在目标左侧";

            let convergentsListHtml = "";
            list.forEach((item, index) => {
                const isActive = index <= cfState.visibleIndex;
                const isCurrent = index === cfState.activeIndex;
                const activeStyle = isCurrent
                    ? `color:var(--color-orange); font-weight:900;`
                    : (isActive ? `color:var(--color-blue); font-weight:700;` : `color:var(--text-muted);`);
                convergentsListHtml += `
                    <div style="display:flex; justify-content:space-between; ${activeStyle}">
                        <span>${isCurrent ? "▶ " : ""}第 ${index + 1} 阶：${item.num}/${item.den}</span>
                        <span>≈ ${item.val.toFixed(5)}</span>
                    </div>
                `;
            });

            html = `
                <div class="hud-summary-card">
                    <div class="hud-summary-grid">
                        <div class="hud-chip">动画阶段</div>
                        <div class="hud-summary-main">${cfState.phase}：分数从左右两侧交替贴近 ${CONSTANTS[cfTarget].label}</div>
                    </div>
                    <div class="hud-summary-note">看点：蓝点偏小、橙点偏大，误差收敛条会随阶数增加快速变短。</div>
                </div>
                <div class="hud-current-step">
                    <div class="hud-step-head">
                        <span class="hud-step-pill">第 ${cfState.activeIndex + 1} 阶</span>
                        <span class="hud-step-mini">${cfState.side}</span>
                    </div>
                    <strong>${currentItem.num}/${currentItem.den} ≈ ${currentItem.val.toFixed(7)}</strong>
                    <p>${signText}；与精确值的差为 ${error > 0 ? "+" : ""}${error.toExponential(3)}。</p>
                </div>
                <div class="hud-guess-card cf-error-summary">
                    <span>误差收敛条</span>
                    <strong>|${Math.abs(error).toExponential(2)}|</strong>
                    <em>阶数越高，分数点越贴近紫色目标线。</em>
                </div>
                <div class="hud-equation-box blue-box">
                    <div class="title">连分数渐进逼近列表 (Convergents)</div>
                    <div style="font-size:12px; line-height:1.5;">
                        ${convergentsListHtml}
                    </div>
                </div>
            `;
        }

        if (currentTheoryTitle && currentTheoryBody && currentScene !== "theodorus-spiral") {
            html += renderTheoryHudBlock(currentTheoryTitle, currentTheoryBody);
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 右侧滑块生成区
    // ==========================================================================
    function loadSlidersForScene() {
        let html = "";

        if (currentScene === "theodorus-spiral") {
            html = `
                <div class="slider-row">
                    <span class="slider-label">选择定位根号目标：</span>
                    <div class="target-button-grid">
                        ${["sqrt2", "sqrt3", "sqrt5", "sqrt6", "sqrt7", "sqrt8"].map(target => {
                            const n = getSpiralRadicand(target);
                            return `<button class="target-root-btn ${spiralTarget === target ? "active" : ""}" data-spiral-target="${target}">√${n}<small>${n - 1}步</small></button>`;
                        }).join("")}
                    </div>
                </div>
                <div class="slider-row" style="margin-top: 10px;">
                    <div class="slider-head">
                        <span class="slider-label">作图进度：起点 / 构造 / 投影 / 定位</span>
                        <span class="slider-val-indicator" id="val-indicator-timeline">${getTheodorusStageInfo(animProgress).phase}</span>
                    </div>
                    <input type="range" class="scene-range-slider" id="slider-anim-timeline" min="0" max="100" step="1" value="${(animProgress * 100).toFixed(0)}">
                    <div class="timeline-stage-labels" aria-hidden="true">
                        <span>起点</span><span>构造</span><span>投影</span><span>定位</span>
                    </div>
                </div>
                <div class="control-action-btn-group">
                    <button class="btn-control-action active-run" id="btn-play-anim">
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
        
        else if (currentScene === "decimal-bisection") {
            html = `
                <div class="slider-row">
                    <span class="slider-label">选择夹逼无理数：</span>
                    <select id="select-bisection-target" class="btn-control-action" style="padding:8px 12px; font-size:13px; font-weight:600; text-align:left; border-radius:10px; width:100%;">
                        <option value="sqrt2" ${bisectionTarget === 'sqrt2' ? 'selected' : ''}>√2 (1.4142...)</option>
                        <option value="sqrt3" ${bisectionTarget === 'sqrt3' ? 'selected' : ''}>√3 (1.7320...)</option>
                        <option value="pi" ${bisectionTarget === 'pi' ? 'selected' : ''}>圆周率 π (3.14159...)</option>
                    </select>
                </div>
                <div class="slider-row" style="margin-top: 10px;">
                    <span class="slider-label">逼近操作级别：</span>
                    <div class="control-action-btn-group" style="margin-top:4px;">
                        <button class="btn-control-action active-run" id="btn-nest-next" ${nestLevel >= 4 ? 'disabled' : ''}>
                            下一步逼近 (放大)
                        </button>
                        <button class="btn-control-action" id="btn-nest-prev" ${nestLevel <= 0 ? 'disabled' : ''}>
                            上一步 (缩小)
                        </button>
                    </div>
                </div>
            `;
        } 
        
        else if (currentScene === "continued-fraction") {
            const maxStepLimit = CONVERGENTS[cfTarget].length - 1;
            html = `
                <div class="slider-row">
                    <span class="slider-label">选择逼近目标：</span>
                    <select id="select-cf-target" class="btn-control-action" style="padding:8px 12px; font-size:13px; font-weight:600; text-align:left; border-radius:10px; width:100%;">
                        <option value="pi" ${cfTarget === 'pi' ? 'selected' : ''}>圆周率 π (祖冲之密率)</option>
                        <option value="sqrt2" ${cfTarget === 'sqrt2' ? 'selected' : ''}>√2 (渐进有理分数)</option>
                    </select>
                </div>
                <div class="slider-row slider-row-blue" style="margin-top: 10px;">
                    <div class="slider-head">
                        <span class="slider-label">分数逼近阶数 N</span>
                        <span class="slider-val-indicator" id="val-indicator-cf">${maxCfSteps + 1} 阶近似</span>
                    </div>
                    <input type="range" class="scene-range-slider" id="slider-cf-steps" min="0" max="${maxStepLimit}" step="1" value="${maxCfSteps}">
                </div>
                <div class="control-action-btn-group">
                    <button class="btn-control-action active-run" id="btn-play-cf">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="${isCfPlaying ? "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M19,16H15V8H19V16M13,16H9V8H13V16Z" : "M8,5.14V19.14L19,12.14L8,5.14Z"}"/></svg>
                        <span>${isCfPlaying ? "暂停动画" : "播放连分数动画"}</span>
                    </button>
                    <button class="btn-control-action" id="btn-reset-cf">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/></svg>
                        <span>重置动画</span>
                    </button>
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
        document.querySelectorAll("[data-spiral-target]").forEach(btn => {
            btn.addEventListener("click", () => {
                spiralTarget = btn.getAttribute("data-spiral-target");
                animProgress = 0.0;
                isPlaying = false;
                guessPointValue = Math.max(0.8, Math.sqrt(getSpiralRadicand()) - 0.12);
                
                const playBtn = document.getElementById("btn-play-anim");
                if (playBtn) playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放作图</span>`;
                
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
                document.getElementById("val-indicator-timeline").textContent = getTheodorusStageInfo(animProgress).phase;
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
                const val = document.getElementById("val-indicator-timeline");
                if (val) val.textContent = "起点";
            });
        }

        // B. 场景 2 事件
        const selectBisection = document.getElementById("select-bisection-target");
        if (selectBisection) {
            selectBisection.addEventListener("change", (e) => {
                bisectionTarget = e.target.value;
                nestLevel = 0;
                applyBisectionViewLimits();
                loadSlidersForScene();
                updateScenePresetsAndTheory();
                centerModel();
            });
        }

        const btnNestNext = document.getElementById("btn-nest-next");
        const btnNestPrev = document.getElementById("btn-nest-prev");
        
        if (btnNestNext) {
            btnNestNext.addEventListener("click", () => {
                if (nestLevel < 4) {
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
        const selectCF = document.getElementById("select-cf-target");
        if (selectCF) {
            selectCF.addEventListener("change", (e) => {
                cfTarget = e.target.value;
                maxCfSteps = 0;
                cfAnimProgress = 0;
                isCfPlaying = false;
                loadSlidersForScene();
                updateScenePresetsAndTheory();
                centerModel();
            });
        }

        const sliderCF = document.getElementById("slider-cf-steps");
        if (sliderCF) {
            sliderCF.addEventListener("input", (e) => {
                isCfPlaying = false;
                maxCfSteps = parseInt(e.target.value, 10);
                cfAnimProgress = Math.max(0, maxCfSteps) / Math.max(1, CONVERGENTS[cfTarget].length - 1);
                document.getElementById("val-indicator-cf").textContent = (maxCfSteps + 1) + " 阶近似";
                syncSceneSliderFill(e.target);
            });
        }

        const btnPlayCf = document.getElementById("btn-play-cf");
        if (btnPlayCf) {
            btnPlayCf.addEventListener("click", () => {
                isCfPlaying = !isCfPlaying;
                if (isCfPlaying && cfAnimProgress >= 0.99) {
                    cfAnimProgress = 0;
                    maxCfSteps = 0;
                }
                btnPlayCf.innerHTML = isCfPlaying
                    ? `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M19,16H15V8H19V16M13,16H9V8H13V16Z"/></svg><span>暂停动画</span>`
                    : `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放连分数动画</span>`;
            });
        }

        const btnResetCf = document.getElementById("btn-reset-cf");
        if (btnResetCf) {
            btnResetCf.addEventListener("click", () => {
                isCfPlaying = false;
                cfAnimProgress = 0;
                maxCfSteps = 0;
                loadSlidersForScene();
                updateScenePresetsAndTheory();
            });
        }
    }

    function applyBisectionViewLimits() {
        const val = CONSTANTS[bisectionTarget].val;
        if (nestLevel === 0) {
            targetViewLimits.min = -0.5;
            targetViewLimits.max = 5.5;
        } else if (nestLevel === 1) {
            // 十分位级：宽 1.4
            targetViewLimits.min = parseFloat((val - 0.72).toFixed(2));
            targetViewLimits.max = parseFloat((val + 0.68).toFixed(2));
        } else if (nestLevel === 2) {
            // 百分位级：宽 0.14
            targetViewLimits.min = parseFloat((val - 0.075).toFixed(3));
            targetViewLimits.max = parseFloat((val + 0.065).toFixed(3));
        } else if (nestLevel === 3) {
            // 千分位级：宽 0.014
            targetViewLimits.min = parseFloat((val - 0.0075).toFixed(4));
            targetViewLimits.max = parseFloat((val + 0.0065).toFixed(4));
        } else if (nestLevel === 4) {
            // 万分位级：宽 0.0014
            targetViewLimits.min = parseFloat((val - 0.00075).toFixed(5));
            targetViewLimits.max = parseFloat((val + 0.00065).toFixed(5));
        }
    }

    // ==========================================================================
    // 9. 教学预设与原理解析
    // ==========================================================================
    function updateScenePresetsAndTheory() {
        let presetHtml = "";
        currentTheoryTitle = "";
        currentTheoryBody = "";

        if (currentScene === "theodorus-spiral") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="sp-sqrt2">定位 √2 (1阶螺旋)</button>
                <button class="btn-preset-problem" data-preset="sp-sqrt3">定位 √3 (2阶螺旋)</button>
                <button class="btn-preset-problem" data-preset="sp-sqrt5">定位 √5 (4阶螺旋)</button>
                <button class="btn-preset-problem" data-preset="sp-sqrt7">定位 √7 (6阶螺旋)</button>
            `;
            currentTheoryTitle = "奥多鲁斯螺旋";
            currentTheoryBody = `
                <p><strong>起点：</strong>直角边 1 和 1 得到斜边 √2。</p>
                <p><strong>迭代：</strong>在 √n 斜边上再接一条垂直边 1，得到 √(n+1)。</p>
                <p><strong>目的：</strong>把根号长度转成数轴上的可作图位置。</p>
            `;
        } else if (currentScene === "decimal-bisection") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="bi-pi">逼近 π (3.14159...)</button>
                <button class="btn-preset-problem" data-preset="bi-sqrt2">逼近 √2 (1.41421...)</button>
                <button class="btn-preset-problem" data-preset="bi-sqrt3">逼近 √3 (1.73205...)</button>
            `;
            currentTheoryTitle = "无限不循环小数与夹逼";
            currentTheoryBody = `
                <p><strong>特征：</strong>无理数是无限不循环小数。</p>
                <p><strong>方法：</strong>每深入一位小数，区间按 10 倍缩窄。</p>
                <p><strong>观察：</strong>数轴镜头越推近，目标点越稳定。</p>
            `;
        } else if (currentScene === "continued-fraction") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="cf-pi-approx">π 祖冲之密率逼近</button>
                <button class="btn-preset-problem" data-preset="cf-sqrt2-approx">√2 渐进分数逼近</button>
            `;
            currentTheoryTitle = "连分数交替收敛与祖冲之";
            currentTheoryBody = `
                <p><strong>规律：</strong>分数近似在目标左右两侧交替收敛。</p>
                <p><strong>判定：</strong>偏左表示偏小，偏右表示偏大。</p>
                <p><strong>例子：</strong>355/113 是 π 的高精度近似。</p>
            `;
        }

        presetButtonsContainer.innerHTML = presetHtml;
        updateHUDContent();

        document.querySelectorAll(".btn-preset-problem").forEach(btn => {
            btn.addEventListener("click", () => {
                applyPreset(btn.getAttribute("data-preset"));
            });
        });
    }

    function applyPreset(presetId) {
        if (presetId === "sp-sqrt2") {
            spiralTarget = "sqrt2";
            animProgress = 0.0; isPlaying = false;
        } else if (presetId === "sp-sqrt3") {
            spiralTarget = "sqrt3";
            animProgress = 0.0; isPlaying = false;
        } else if (presetId === "sp-sqrt5") {
            spiralTarget = "sqrt5";
            animProgress = 0.0; isPlaying = false;
        } else if (presetId === "sp-sqrt7") {
            spiralTarget = "sqrt7";
            animProgress = 0.0; isPlaying = false;
        } 
        
        else if (presetId === "bi-pi") {
            bisectionTarget = "pi";
            nestLevel = 0;
            applyBisectionViewLimits();
        } else if (presetId === "bi-sqrt2") {
            bisectionTarget = "sqrt2";
            nestLevel = 0;
            applyBisectionViewLimits();
        } else if (presetId === "bi-sqrt3") {
            bisectionTarget = "sqrt3";
            nestLevel = 0;
            applyBisectionViewLimits();
        } 
        
        else if (presetId === "cf-pi-approx") {
            cfTarget = "pi";
            maxCfSteps = 0;
            cfAnimProgress = 0;
            isCfPlaying = true;
        } else if (presetId === "cf-sqrt2-approx") {
            cfTarget = "sqrt2";
            maxCfSteps = 0;
            cfAnimProgress = 0;
            isCfPlaying = true;
        }

        if (presetId.startsWith("sp-")) {
            guessPointValue = Math.max(0.8, Math.sqrt(getSpiralRadicand()) - 0.12);
        }
        if (presetId.startsWith("cf-")) {
            // 切换 π / √2 后同步重算数轴视窗，避免新目标落在旧视窗之外。
            centerModel();
        }

        loadSlidersForScene();
    }

    // ==========================================================================
    // 10. 页面自适应与右偏居中布局 (防止重叠)
    // ==========================================================================
    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        zoomScale = 1.0;
        panX = 0;
        panY = 0;

        const isDesktop = W > 800;

        if (currentScene === "theodorus-spiral") {
            // 螺旋绘图区：原点放置在更安全的中央靠右处
            O.x = isDesktop ? (isHudExpanded ? W * 0.58 : W * 0.50) : W * 0.50;
            O.y = H * 0.62; // 给上方的螺旋留出空间，同时避免数轴贴底

            // 螺旋数轴刻度范围为 [-1.5, 4.5]
            const L_min = isDesktop ? (isHudExpanded ? 390 : 235) : 30;
            const R_max = W - 40;
            const W_avail = R_max - L_min;
            unitWidth = Math.min(150, Math.max(82, W_avail / 5.7));

            // 校正原点位置，保证 -1.5 刚好在 L_min
            O.x = L_min + 1.45 * unitWidth;

            targetViewLimits.min = -1.5;
            targetViewLimits.max = 4.5;
        } 
        
        else if (currentScene === "decimal-bisection") {
            // 夹逼场景下，数轴的原点和比例完全由变焦 boundaries 动态控制
            O.y = H * 0.58;
        } 
        
        else if (currentScene === "continued-fraction") {
            // 连分数场景下
            O.y = H * 0.58;
            const L_min = isDesktop ? (isHudExpanded ? 390 : 235) : 30;
            const R_max = W - 40;
            const W_avail = R_max - L_min;

            if (cfTarget === "pi") {
                // π 场景，数轴范围 [2.7, 3.8] (宽 1.1)
                unitWidth = W_avail / 1.25;
                O.x = L_min - 2.7 * unitWidth;
                targetViewLimits.min = 2.7;
                targetViewLimits.max = 3.8;
            } else {
                // √2 场景，数轴范围 [0.8, 1.8] (宽 1.0)
                unitWidth = W_avail / 1.15;
                O.x = L_min - 0.8 * unitWidth;
                targetViewLimits.min = 0.8;
                targetViewLimits.max = 1.8;
            }
        }

        updateTransform();
    }

    function updateTransform() {
        sandboxSvg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        htmlOverlay.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    }

    // ==========================================================================
    // 11. 手势与鼠标拖拽
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

    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        zoomAtCenter(factor);
    }, { passive: false });

    sandboxWrapper.addEventListener("mousedown", (e) => {
        if (e.target.closest && e.target.closest(".guess-point-handle")) return;
        if (e.button === 0) {
            isPanning = true;
            sandboxWrapper.classList.add("panning");
            startPanX = e.clientX - panX;
            startPanY = e.clientY - panY;
            e.preventDefault();
        }
    });

    window.addEventListener("mousemove", (e) => {
        if (isPanning) {
            panX = e.clientX - startPanX;
            panY = e.clientY - startPanY;
            updateTransform();
        }
    });

    window.addEventListener("mouseup", () => {
        if (isPanning) {
            isPanning = false;
            sandboxWrapper.classList.remove("panning");
        }
    });

    // 移动端手势
    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.target.closest && e.target.closest(".guess-point-handle")) return;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            isPanning = true;
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
        }
    });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 1 && isPanning) {
            const touch = e.touches[0];
            panX = touch.clientX - startPanX;
            panY = touch.clientY - startPanY;
            updateTransform();
            e.preventDefault();
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchend", () => {
        isPanning = false;
    });

    sandboxWrapper.addEventListener("pointerdown", (e) => {
        if (currentScene !== "theodorus-spiral") return;
        const target = e.target.closest && e.target.closest(".guess-point-handle");
        if (!target) return;
        isDraggingGuessPoint = true;
        isPanning = false;
        sandboxWrapper.classList.remove("panning");
        sandboxWrapper.setPointerCapture?.(e.pointerId);
        e.preventDefault();
    });

    sandboxWrapper.addEventListener("pointermove", (e) => {
        if (!isDraggingGuessPoint || currentScene !== "theodorus-spiral") return;
        const rect = sandboxWrapper.getBoundingClientRect();
        const px = (e.clientX - rect.left - panX) / zoomScale;
        const value = getMathVal(px);
        guessPointValue = Math.min(3.1, Math.max(0.8, value));
        e.preventDefault();
    });

    window.addEventListener("pointerup", () => {
        isDraggingGuessPoint = false;
    });

    sandboxWrapper.addEventListener("dblclick", () => {
        centerModel();
    });

    // ==========================================================================
    // 12. HUD 板书与 SVG 联动高亮
    // ==========================================================================
    function highlightOnCanvas(target, active) {
        if (target === "sqrt") {
            const els = document.querySelectorAll(".spiral-hypot, .compass-arc");
            els.forEach(el => {
                if (active) el.classList.add("active-glow-sqrt");
                else el.classList.remove("active-glow-sqrt");
            });
        } else if (target === "orange") {
            const el = document.querySelector(".nesting-range-rect");
            if (el) {
                if (active) el.classList.add("active-glow-orange");
                else el.classList.remove("active-glow-orange");
            }
        } else if (target === "blue") {
            const curve = document.querySelector(".convergence-curve");
            const pts = document.querySelectorAll(".convergent-point");
            if (curve) {
                if (active) curve.classList.add("active-glow-blue");
                else curve.classList.remove("active-glow-blue");
            }
            pts.forEach(p => {
                if (active) p.classList.add("active-glow-blue");
                else p.classList.remove("active-glow-blue");
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
    // 13. 绑定场景选择与事件
    // ==========================================================================
    function loadScene(sceneId) {
        currentScene = sceneId;

        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === sceneId) btn.classList.add("active");
            else btn.classList.remove("active");
        });

        isPlaying = false;
        isCfPlaying = false;
        animProgress = 0.0;
        nestLevel = 0;
        maxCfSteps = cfTarget === "pi" ? 3 : 5;
        cfAnimProgress = 1;

        if (currentScene === "theodorus-spiral") {
            spiralTarget = "sqrt5";
        } else if (currentScene === "decimal-bisection") {
            bisectionTarget = "pi";
            applyBisectionViewLimits();
        } else if (currentScene === "continued-fraction") {
            cfTarget = "pi";
            maxCfSteps = 0;
            cfAnimProgress = 0;
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

    hudToggleBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        isHudExpanded = hudPanel.classList.contains("collapsed");
        hudPanel.classList.toggle("collapsed", !isHudExpanded);
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
        get spiralTarget() { return spiralTarget; },
        get animProgress() { return animProgress; },
        set animProgress(val) { animProgress = val; },
        get nestLevel() { return nestLevel; },
        get maxCfSteps() { return maxCfSteps; },
        loadScene,
        applyPreset,
        centerModel
    };

    // 初始化运行
    loadScene("theodorus-spiral");
    requestAnimationFrame(updateFrame);

    window.addEventListener("resize", centerModel);
});

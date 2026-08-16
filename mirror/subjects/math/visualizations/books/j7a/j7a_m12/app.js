/**
 * 余角、补角与方位角演示仪 - 几何可视化交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态变量与参数
    // ==========================================================================
    let currentScene = "complementary-angles"; // complementary-angles | supplementary-angles | bearings-compass
    let subMode = "free-adjust";               // free-adjust | proof-demo
    let isAnimating = false;
    let isHudExpanded = false;
    let isSnappingEnabled = false;

    // 几何角度参数 (以弧度表示)
    let angleAlpha = 35 * Math.PI / 180;       // OC 与基准线的夹角 (0 - 90 / 0 - 180)
    let targetAngleAlpha = 35 * Math.PI / 180;

    // 方位角参数 (以正北顺时针表示)
    let bearingTheta = 60 * Math.PI / 180;     // 极角 (0 - 360)
    let targetBearingTheta = 60 * Math.PI / 180;
    let bearingDist = 160;                     // 点 A 到 O 的距离
    let targetBearingDist = 160;

    // 叠流动合动画进度
    let animProgress = 0.0;
    let animDirection = 0; // 1: 一次性播放叠合/互逆证明

    // 预设平滑过渡标志
    let isPresetTransitioning = false;

    // LERP 平滑渲染值系统
    const renderValues = {
        angleAlpha: 35 * Math.PI / 180,
        bearingTheta: 60 * Math.PI / 180,
        bearingDist: 160,
        animProgress: 0.0
    };

    // 画布平移与缩放
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // 拖拽点状态
    let activeDragPoint = null;

    const SCALE_CM_TO_PX = 38;

    // 中心点坐标 (自适应更新)
    const O = { x: 400, y: 260 };
    const O1 = { x: 260, y: 260 };
    const O2 = { x: 540, y: 260 };

    const points = {
        O: { x: 400, y: 260 },
        C: { x: 0, y: 0 },
        A: { x: 0, y: 0 }  // 用于方位角场景的目标点 A
    };

    const PROOF_BUTTON_IDLE_HTML = `
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
        自动演示教学过程
    `;

    const PROOF_BUTTON_DONE_HTML = `
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z"/></svg>
        已停在关键结论
    `;

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");

    const sliderAngleAlpha = document.getElementById("slider-angle-alpha");
    const valAngleAlpha = document.getElementById("val-angle-alpha");
    const sliderBearingTheta = document.getElementById("slider-bearing-theta");
    const valBearingTheta = document.getElementById("val-bearing-theta");
    const sliderBearingDist = document.getElementById("slider-bearing-dist");
    const valBearingDist = document.getElementById("val-bearing-dist");

    const subModeContainer = document.getElementById("sub-mode-container");
    const presetButtonsContainer = document.getElementById("preset-buttons-container");

    const btnToggleSnap = document.getElementById("btn-toggle-snap");
    const btnPlayProof = document.getElementById("btn-play-proof");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");

    // ==========================================================================
    // 3. Canvas 物理粒子效果 (重力火花)
    // ==========================================================================
    const canvas = document.getElementById("particles-canvas");
    const ctx = canvas.getContext("2d");
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class SparkParticle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.7) * 9 - 3;
            this.radius = Math.random() * 3 + 2.0;
            this.color = color;
            this.alpha = 1.0;
            this.gravity = 0.22;
            this.life = 1.0;
            this.decay = Math.random() * 0.02 + 0.015;
        }

        update() {
            this.x += this.vx;
            this.vy += this.gravity;
            this.y += this.vy;
            this.alpha -= this.decay;
            this.life -= this.decay;
        }

        draw(c) {
            c.save();
            c.globalAlpha = Math.max(0, this.alpha);
            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            c.fillStyle = this.color;
            c.shadowBlur = 10;
            c.shadowColor = this.color;
            c.fill();
            c.restore();
        }
    }

    function spawnExplosion(x, y, color = "#8b5cf6") {
        for (let i = 0; i < 35; i++) {
            particles.push(new SparkParticle(x, y, color));
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });
        requestAnimationFrame(animateParticles);
    }
    requestAnimationFrame(animateParticles);

    // ==========================================================================
    // 4. 几何核心解算器 (Geometry Solver)
    // ==========================================================================
    function primaryRayLength(maxLen = 170) {
        const minSide = Math.min(sandboxWrapper.clientWidth || 800, sandboxWrapper.clientHeight || 520);
        return Math.min(maxLen, Math.max(118, minSide * 0.34));
    }

    function solveGeometry() {
        const curAlpha = renderValues.angleAlpha;
        const curTheta = renderValues.bearingTheta;
        const curDist = renderValues.bearingDist;

        points.O.x = O.x;
        points.O.y = O.y;

        // 解算射线 OC 终点坐标
        const lineLen = primaryRayLength(170);
        points.C.x = O.x + lineLen * Math.cos(-curAlpha); // 逆时针，在 SVG 中 y 向上为负
        points.C.y = O.y + lineLen * Math.sin(-curAlpha);

        // 解算方位角目标点 A 坐标 (顺时针，以正北 N 向上为 0 度)
        points.A.x = O.x + curDist * Math.sin(curTheta);
        points.A.y = O.y - curDist * Math.cos(curTheta); // 向上为负
    }

    // ==========================================================================
    // 5. 整数角度吸附数学计算器 (Snapping Utility)
    // ==========================================================================
    function snapAngleDeg(rawDeg) {
        if (!isSnappingEnabled) return rawDeg;
        
        let rounded = Math.round(rawDeg);
        const specials = [0, 15, 30, 45, 60, 75, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
        const threshold = 2.0; // 2度阈值强吸附

        for (let spec of specials) {
            if (Math.abs(rounded - spec) <= threshold) {
                return spec;
            }
        }
        return rounded;
    }

    // ==========================================================================
    // 6. SVG 渲染逻辑
    // ==========================================================================
    function drawSVGPoint(id, pt, labelText, offset = { x: 12, y: 6 }, isDraggable = true) {
        let ptClass = "geo-point-wrapper";
        if (isDraggable) ptClass += " draggable-point";

        let html = `
            <g class="${ptClass}" data-point-id="${id}">
                <circle class="geo-point-hitarea" cx="${pt.x}" cy="${pt.y}" r="${isDraggable ? 24 : 16}"></circle>
                <circle class="geo-point-halo" cx="${pt.x}" cy="${pt.y}" r="${isDraggable ? 20 : 15}"></circle>
                <circle class="geo-point" cx="${pt.x}" cy="${pt.y}" r="6"></circle>
            </g>
        `;
        const textX = pt.x + offset.x;
        const textY = pt.y + offset.y;
        html += `<text class="geo-label" x="${textX}" y="${textY}">${labelText}</text>`;
        return html;
    }

    function getAngleArcPath(vertex, p1, p2, radius, isSector = false) {
        const alpha1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        const alpha2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
        
        let diff = alpha2 - alpha1;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        
        const startAngle = alpha1;
        const endAngle = alpha1 + diff;
        
        const x1 = vertex.x + radius * Math.cos(startAngle);
        const y1 = vertex.y + radius * Math.sin(startAngle);
        const x2 = vertex.x + radius * Math.cos(endAngle);
        const y2 = vertex.y + radius * Math.sin(endAngle);
        
        const sweepFlag = diff > 0 ? 1 : 0;
        
        if (isSector) {
            return `M ${vertex.x} ${vertex.y} L ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2} Z`;
        } else {
            return `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2}`;
        }
    }

    function drawCompassRose(center, radius, isSecondary = false) {
        let html = "";
        const axisLen = radius + 15;
        // 坐标轴
        html += `
            <line class="geo-axis-line" x1="${center.x - axisLen}" y1="${center.y}" x2="${center.x + axisLen}" y2="${center.y}"></line>
            <line class="geo-axis-line" x1="${center.x}" y1="${center.y - axisLen}" x2="${center.x}" y2="${center.y + axisLen}"></line>
            
            <!-- 方向箭头 -->
            <path class="geo-axis-arrow" d="M ${center.x} ${center.y - axisLen - 4} L ${center.x - 4} ${center.y - axisLen + 2} L ${center.x + 4} ${center.y - axisLen + 2} Z"></path>
            <path class="geo-axis-arrow" d="M ${center.x + axisLen + 4} ${center.y} L ${center.x + axisLen - 2} ${center.y - 4} L ${center.x + axisLen - 2} ${center.y + 4} Z"></path>
        `;
        // 罗盘刻度虚圆
        html += `
            <circle class="geo-compass-circle" cx="${center.x}" cy="${center.y}" r="${radius}"></circle>
        `;
        // 方向标签
        const fs = isSecondary ? "9px" : "11px";
        const offset = radius + 8;
        html += `
            <text class="geo-compass-marker marker-n" style="font-size: ${fs};" x="${center.x}" y="${center.y - offset}">北</text>
            <text class="geo-compass-marker marker-s" style="font-size: ${fs};" x="${center.x}" y="${center.y + offset}">南</text>
            <text class="geo-compass-marker marker-e" style="font-size: ${fs};" x="${center.x + offset}" y="${center.y}">东</text>
            <text class="geo-compass-marker marker-w" style="font-size: ${fs};" x="${center.x - offset}" y="${center.y}">西</text>
        `;
        return html;
    }

    function renderSVG() {
        const curAlpha = renderValues.angleAlpha;
        const curTheta = renderValues.bearingTheta;
        const curDist = renderValues.bearingDist;
        const t = renderValues.animProgress;
        const compactLabels = sandboxWrapper.clientWidth < 520;

        let drawHtml = "";

        // ==========================================================================
        // 场景 1 & 2: 余角与补角
        // ==========================================================================
        if (currentScene === "complementary-angles" || currentScene === "supplementary-angles") {
            const isComp = currentScene === "complementary-angles";
            const baseAngle = isComp ? Math.PI / 2 : Math.PI;

            if (subMode === "free-adjust") {
                // 绘制基准角线条
                const rayLen = primaryRayLength(175);
                const ptA = { x: O.x + rayLen, y: O.y }; // OA (东)
                const ptB = isComp ? { x: O.x, y: O.y - rayLen } : { x: O.x - rayLen, y: O.y }; // OB (北 / 西)

                // 绘制底板直角/平角
                drawHtml += `
                    <line class="geo-line-seg" style="stroke: #64748b; stroke-width: 3.5px;" x1="${O.x}" y1="${O.y}" x2="${ptA.x}" y2="${ptA.y}"></line>
                    <line class="geo-line-seg" style="stroke: #64748b; stroke-width: 3.5px;" x1="${O.x}" y1="${O.y}" x2="${ptB.x}" y2="${ptB.y}"></line>
                `;

                if (isComp) {
                    // 绘制直角符号
                    drawHtml += `
                        <polyline class="geo-right-angle" points="${O.x + 12},${O.y} ${O.x + 12},${O.y - 12} ${O.x},${O.y - 12}"></polyline>
                    `;
                }

                // 绘制拖拽射线 OC
                drawHtml += `
                    <line class="geo-line-seg seg-ray" x1="${O.x}" y1="${O.y}" x2="${points.C.x}" y2="${points.C.y}"></line>
                `;

                // 绘制角度 1 (alpha) 与角度 2 (beta) 的扇区和弧线
                const radius1 = 45;
                const radius2 = 40;
                const ptC = points.C;

                drawHtml += `
                    <!-- 角 alpha 扇区 (紫色) -->
                    <path class="geo-angle-sector" style="fill: var(--segment-alpha-light);" d="${getAngleArcPath(O, ptA, ptC, radius1, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-alpha);" d="${getAngleArcPath(O, ptA, ptC, radius1)}"></path>
                    
                    <!-- 角 beta 扇区 (蓝色) -->
                    <path class="geo-angle-sector" style="fill: var(--segment-beta-light);" d="${getAngleArcPath(O, ptC, ptB, radius2, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-beta);" d="${getAngleArcPath(O, ptC, ptB, radius2)}"></path>
                `;

                // 绘制交互端点
                drawHtml += drawSVGPoint("C", ptC, compactLabels ? "C" : "C (拖动改变角度)", { x: 12, y: -4 }, true);
                drawHtml += drawSVGPoint("O", O, "O", { x: -16, y: 18 }, false);

            } else if (subMode === "proof-demo") {
                // 性质证明模式: 左右渲染两套相同的直角/平角配置，其中 OC 角度相同
                const rayLen = 120;
                
                // 左侧模型顶点 O1，右侧模型顶点 O2
                const ptA1 = { x: O1.x + rayLen, y: O1.y };
                const ptB1 = isComp ? { x: O1.x, y: O1.y - rayLen } : { x: O1.x - rayLen, y: O1.y };
                const ptC1 = { x: O1.x + rayLen * Math.cos(-curAlpha), y: O1.y + rayLen * Math.sin(-curAlpha) };

                const ptA2 = { x: O2.x + rayLen, y: O2.y };
                const ptB2 = isComp ? { x: O2.x, y: O2.y - rayLen } : { x: O2.x - rayLen, y: O2.y };
                const ptC2 = { x: O2.x + rayLen * Math.cos(-curAlpha), y: O2.y + rayLen * Math.sin(-curAlpha) };

                // 绘制左右两个模型框架
                drawHtml += `
                    <!-- 左模型 -->
                    <line class="geo-line-seg" style="stroke: #94a3b8; stroke-width: 2.5px;" x1="${O1.x}" y1="${O1.y}" x2="${ptA1.x}" y2="${ptA1.y}"></line>
                    <line class="geo-line-seg" style="stroke: #94a3b8; stroke-width: 2.5px;" x1="${O1.x}" y1="${O1.y}" x2="${ptB1.x}" y2="${ptB1.y}"></line>
                    <line class="geo-line-seg seg-ray" style="stroke-width: 3px;" x1="${O1.x}" y1="${O1.y}" x2="${ptC1.x}" y2="${ptC1.y}"></line>
                    
                    <!-- 右模型 -->
                    <line class="geo-line-seg" style="stroke: #94a3b8; stroke-width: 2.5px;" x1="${O2.x}" y1="${O2.y}" x2="${ptA2.x}" y2="${ptA2.y}"></line>
                    <line class="geo-line-seg" style="stroke: #94a3b8; stroke-width: 2.5px;" x1="${O2.x}" y1="${O2.y}" x2="${ptB2.x}" y2="${ptB2.y}"></line>
                    <line class="geo-line-seg seg-ray" style="stroke-width: 3px;" x1="${O2.x}" y1="${O2.y}" x2="${ptC2.x}" y2="${ptC2.y}"></line>
                `;

                if (isComp) {
                    drawHtml += `
                        <polyline class="geo-right-angle" points="${O1.x + 10},${O1.y} ${O1.x + 10},${O1.y - 10} ${O1.x},${O1.y - 10}"></polyline>
                        <polyline class="geo-right-angle" points="${O2.x + 10},${O2.y} ${O2.x + 10},${O2.y - 10} ${O2.x},${O2.y - 10}"></polyline>
                    `;
                }

                // 左右两边的角 alpha 渲染 (保持静止)
                const arcRad = 35;
                drawHtml += `
                    <path class="geo-angle-sector" style="fill: var(--segment-alpha-light);" d="${getAngleArcPath(O1, ptA1, ptC1, arcRad, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-alpha);" d="${getAngleArcPath(O1, ptA1, ptC1, arcRad)}"></path>
                    <text class="geo-label" style="font-size: 10px;" x="${O1.x + 22}" y="${O1.y - 10}">α₁</text>

                    <path class="geo-angle-sector" style="fill: var(--segment-alpha-light);" d="${getAngleArcPath(O2, ptA2, ptC2, arcRad, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-alpha);" d="${getAngleArcPath(O2, ptA2, ptC2, arcRad)}"></path>
                    <text class="geo-label" style="font-size: 10px;" x="${O2.x + 22}" y="${O2.y - 10}">α₂</text>
                `;

                // 左右两边的余角/补角 beta (随动画进度 t 移动重叠)
                // 3D 浮起高光样式
                const lift = Math.sin(t * Math.PI);
                const scaleFactor = 1.0 + 0.05 * lift;
                const shadowDx = 5 * lift;
                const shadowDy = 8 * lift;
                const shadowBlur = 6 * lift;
                const shadowOpacity = 0.15 * lift;
                const filterStyle = lift > 0.01 ? `filter: drop-shadow(${shadowDx}px ${shadowDy}px ${shadowBlur}px rgba(15,23,42,${shadowOpacity}));` : "";

                // 计算重合目标中心 (O 的坐标)
                const targetCenter = O;

                // 弧形 beta1: 从 O1 到 O 的平移插值
                const curCenter1 = {
                    x: O1.x + t * (targetCenter.x - O1.x),
                    y: O1.y + t * (targetCenter.y - O1.y)
                };
                const betaArcPath1 = getAngleArcPath(curCenter1, 
                    { x: curCenter1.x + rayLen * Math.cos(-curAlpha), y: curCenter1.y + rayLen * Math.sin(-curAlpha) },
                    { x: curCenter1.x + rayLen * Math.cos(-baseAngle), y: curCenter1.y + rayLen * Math.sin(-baseAngle) },
                    arcRad * scaleFactor, true
                );

                // 弧形 beta2: 从 O2 到 O 的平移插值
                const curCenter2 = {
                    x: O2.x + t * (targetCenter.x - O2.x),
                    y: O2.y + t * (targetCenter.y - O2.y)
                };
                const betaArcPath2 = getAngleArcPath(curCenter2, 
                    { x: curCenter2.x + rayLen * Math.cos(-curAlpha), y: curCenter2.y + rayLen * Math.sin(-curAlpha) },
                    { x: curCenter2.x + rayLen * Math.cos(-baseAngle), y: curCenter2.y + rayLen * Math.sin(-baseAngle) },
                    arcRad * scaleFactor, true
                );

                drawHtml += `
                    <!-- 浮起的角 beta1 扇区 -->
                    <g style="${filterStyle}">
                        <path class="geo-angle-sector" style="fill: var(--segment-beta-light); fill-opacity: 0.25;" d="${betaArcPath1}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--segment-beta); stroke-width: 2.5px;" d="${getAngleArcPath(curCenter1, 
                            { x: curCenter1.x + rayLen * Math.cos(-curAlpha), y: curCenter1.y + rayLen * Math.sin(-curAlpha) },
                            { x: curCenter1.x + rayLen * Math.cos(-baseAngle), y: curCenter1.y + rayLen * Math.sin(-baseAngle) },
                            arcRad * scaleFactor
                        )}"></path>
                    </g>
                    ${t < 0.9 ? `<text class="geo-label" style="font-size: 11px;" x="${curCenter1.x - 22}" y="${curCenter1.y - 26}">β₁ (余/补角)</text>` : ""}

                    <!-- 浮起的角 beta2 扇区 -->
                    <g style="${filterStyle}">
                        <path class="geo-angle-sector" style="fill: rgba(16, 185, 129, 0.15);" d="${betaArcPath2}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--color-east); stroke-width: 2.5px;" d="${getAngleArcPath(curCenter2, 
                            { x: curCenter2.x + rayLen * Math.cos(-curAlpha), y: curCenter2.y + rayLen * Math.sin(-curAlpha) },
                            { x: curCenter2.x + rayLen * Math.cos(-baseAngle), y: curCenter2.y + rayLen * Math.sin(-baseAngle) },
                            arcRad * scaleFactor
                        )}"></path>
                    </g>
                    ${t < 0.9 ? `<text class="geo-label" style="font-size: 11px;" x="${curCenter2.x + 22}" y="${curCenter2.y - 26}">β₂ (余/补角)</text>` : ""}
                `;

                if (t >= 0.9) {
                    drawHtml += `
                        <text class="geo-label text-glow" style="fill: var(--segment-beta); font-size:12.5px;" x="${O.x}" y="${O.y - 50}" text-anchor="middle">β₁ ≡ β₂ 完全重合 (大小: ${(90 - curAlpha * 180 / Math.PI).toFixed(0)}°)</text>
                    `;
                }

                drawHtml += drawSVGPoint("O1", O1, "O₁", { x: -12, y: 16 }, false);
                drawHtml += drawSVGPoint("O2", O2, "O₂", { x: -12, y: 16 }, false);
            }
        }

        // ==========================================================================
        // 场景 3: 方位角与方向角
        // ==========================================================================
        else if (currentScene === "bearings-compass") {
            const compassRad = 90;
            
            if (subMode === "free-adjust") {
                // 1. 绘制 O 处的罗盘
                drawHtml += drawCompassRose(O, compassRad, false);

                // 2. 绘制 OA 射线线段
                drawHtml += `
                    <line class="geo-line-seg seg-ray" x1="${O.x}" y1="${O.y}" x2="${points.A.x}" y2="${points.A.y}"></line>
                `;

                // 3. 绘制方位角扇区及偏角扇区
                // 方位角：正北顺时针旋转。正北线点为 (O.x, O.y - d)
                const pNorth = { x: O.x, y: O.y - curDist };
                
                // 方向角：南北线偏东/偏西。N-S线点为 (O.x, O.y - d) 或 (O.x, O.y + d)
                const deg = (curTheta * 180 / Math.PI + 360) % 360;
                let compassRefPt = pNorth; // 默认北偏
                let arcColor = "var(--segment-alpha)";
                let sectorLight = "var(--segment-alpha-light)";
                if (deg > 90 && deg <= 270) {
                    compassRefPt = { x: O.x, y: O.y + curDist }; // 南偏
                    arcColor = "var(--segment-beta)";
                    sectorLight = "var(--segment-beta-light)";
                }

                drawHtml += `
                    <!-- 顺时针方位角虚弧线 (灰色) -->
                    <path class="geo-angle-arc" style="stroke: #94a3b8; stroke-dasharray: 4,3;" d="${getAngleArcPath(O, pNorth, points.A, 32)}"></path>
                    
                    <!-- 方向偏角扇区 (彩色) -->
                    <path class="geo-angle-sector" style="fill: ${sectorLight};" d="${getAngleArcPath(O, compassRefPt, points.A, 42, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: ${arcColor};" d="${getAngleArcPath(O, compassRefPt, points.A, 42)}"></path>
                `;

                // 4. 绘制目标点 A 的小型次级十字坐标系 (以展示互逆方位角基础)
                drawHtml += `
                    <line class="geo-axis-line" style="stroke-dasharray: 3,3;" x1="${points.A.x - 30}" y1="${points.A.y}" x2="${points.A.x + 30}" y2="${points.A.y}"></line>
                    <line class="geo-axis-line" style="stroke-dasharray: 3,3;" x1="${points.A.x}" y1="${points.A.y - 30}" x2="${points.A.x}" y2="${points.A.y + 30}"></line>
                    <text class="geo-compass-marker" style="font-size:8px; fill:var(--color-north);" x="${points.A.x}" y="${points.A.y - 36}">北</text>
                `;

                // 绘制端点
                drawHtml += drawSVGPoint("A", points.A, compactLabels ? "A" : "A (拖动目标点)", { x: 12, y: -4 }, true);
                drawHtml += drawSVGPoint("O", O, "O (观测中心)", { x: -16, y: 18 }, false);

            } else if (subMode === "proof-demo") {
                // 互逆方向角证明模式
                // 绘制 O 和 A 两个十字罗盘
                drawHtml += drawCompassRose(O, compassRad, false);
                drawHtml += drawCompassRose(points.A, compassRad - 25, true);

                // 两条平行的南北线高亮，以展示平行线性质
                drawHtml += `
                    <!-- 辅助平行线指示 -->
                    <line class="geo-line-seg" style="stroke: var(--color-north); stroke-width: 1.5px; stroke-dasharray: 8,4;" x1="${O.x}" y1="${O.y - 150}" x2="${O.x}" y2="${O.y + 150}"></line>
                    <line class="geo-line-seg" style="stroke: var(--color-north); stroke-width: 1.5px; stroke-dasharray: 8,4;" x1="${points.A.x}" y1="${points.A.y - 150}" x2="${points.A.x}" y2="${points.A.y + 150}"></line>
                    
                    <!-- OA 割线 -->
                    <line class="geo-line-seg seg-ray" x1="${O.x}" y1="${O.y}" x2="${points.A.x}" y2="${points.A.y}"></line>
                `;

                // 几何夹角解算
                const deg = (curTheta * 180 / Math.PI + 360) % 360;
                const pNorthO = { x: O.x, y: O.y - curDist };
                const pSouthA = { x: points.A.x, y: points.A.y + curDist };

                // 确定偏角基准线 (北偏 / 南偏)
                let refO = pNorthO;
                let refA = { x: points.A.x, y: points.A.y + curDist }; // 南偏
                let arcColor = "var(--segment-alpha)";
                let sectorLight = "var(--segment-alpha-light)";
                
                if (deg > 90 && deg <= 270) {
                    refO = { x: O.x, y: O.y + curDist }; // 南偏
                    refA = { x: points.A.x, y: points.A.y - curDist }; // 北偏
                    arcColor = "var(--segment-beta)";
                    sectorLight = "var(--segment-beta-light)";
                }

                // 在 A 处绘制内错角偏角扇区 (保持静止)
                const arcRadA = 36;
                drawHtml += `
                    <!-- A 处内错角 -->
                    <path class="geo-angle-sector" style="fill: var(--segment-beta-light);" d="${getAngleArcPath(points.A, refA, O, arcRadA, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-beta);" d="${getAngleArcPath(points.A, refA, O, arcRadA)}"></path>
                    <text class="geo-label" style="font-size: 11px;" x="${points.A.x - 12}" y="${points.A.y + (deg <= 180 ? 22 : -22)}">θ₂</text>
                `;

                // 在 O 处绘制原始偏角扇区，随动画 t 浮起并平移旋转至 A 处
                const lift = Math.sin(t * Math.PI);
                const scaleFactor = 1.0 + 0.05 * lift;
                const shadowDx = 5 * lift;
                const shadowDy = 8 * lift;
                const shadowBlur = 6 * lift;
                const shadowOpacity = 0.15 * lift;
                const filterStyle = lift > 0.01 ? `filter: drop-shadow(${shadowDx}px ${shadowDy}px ${shadowBlur}px rgba(15,23,42,${shadowOpacity}));` : "";

                // 平移中心插值
                const curCenter = {
                    x: O.x + t * (points.A.x - O.x),
                    y: O.y + t * (points.A.y - O.y)
                };

                // 计算旋转变换以贴合 A 处角度 (旋转 180 度 = PI)
                const curRotation = t * Math.PI;
                const baseRefVector = { x: refO.x - O.x, y: refO.y - O.y };
                const baseAVector = { x: points.A.x - O.x, y: points.A.y - O.y };

                // 旋转基准矢量
                const rotateVector = (v, rad) => ({
                    x: v.x * Math.cos(rad) - v.y * Math.sin(rad),
                    y: v.x * Math.sin(rad) + v.y * Math.cos(rad)
                });

                const rotRef = rotateVector(baseRefVector, curRotation);
                const rotA = rotateVector(baseAVector, curRotation);

                const tempPt1 = { x: curCenter.x + rotRef.x, y: curCenter.y + rotRef.y };
                const tempPt2 = { x: curCenter.x + rotA.x, y: curCenter.y + rotA.y };

                const flyingSector = getAngleArcPath(curCenter, tempPt1, tempPt2, arcRadA * scaleFactor, true);

                drawHtml += `
                    <!-- 浮起的角 θ1 扇区 -->
                    <g style="${filterStyle}">
                        <path class="geo-angle-sector" style="fill: var(--segment-alpha-light); fill-opacity: 0.25;" d="${flyingSector}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--segment-alpha); stroke-width: 2.5px;" d="${getAngleArcPath(curCenter, tempPt1, tempPt2, arcRadA * scaleFactor)}"></path>
                    </g>
                `;

                if (t < 0.9) {
                    drawHtml += `
                        <text class="geo-label" style="font-size: 11px;" x="${curCenter.x + 12}" y="${curCenter.y - (deg <= 180 ? 22 : -22)}">θ₁ (偏角)</text>
                    `;
                } else {
                    drawHtml += `
                        <text class="geo-label text-glow" style="fill: var(--segment-alpha); font-size:12.5px;" x="${points.A.x}" y="${points.A.y - 45}" text-anchor="middle">θ₁ ≡ θ₂ 完全重合 (内错角相等)</text>
                    `;
                }

                drawHtml += drawSVGPoint("A", points.A, "A", { x: 12, y: -4 }, false);
                drawHtml += drawSVGPoint("O", O, "O", { x: -16, y: 18 }, false);
            }
        }

        sandboxSvg.innerHTML = drawHtml;
    }

    // ==========================================================================
    // 7. HTML 浮动文字标注与板书算式渲染
    // ==========================================================================
    function formatDirectionAngle(thetaDeg) {
        const deg = (thetaDeg + 360) % 360;
        if (deg === 0 || deg === 360) return "正北方向";
        if (deg === 90) return "正东方向";
        if (deg === 180) return "正南方向";
        if (deg === 270) return "正西方向";
        
        if (deg > 0 && deg < 90) {
            return `北偏东 ${deg.toFixed(1)}°`;
        } else if (deg > 90 && deg < 180) {
            return `南偏东 ${(180 - deg).toFixed(1)}°`;
        } else if (deg > 180 && deg < 270) {
            return `南偏西 ${(deg - 180).toFixed(1)}°`;
        } else {
            return `北偏西 ${(360 - deg).toFixed(1)}°`;
        }
    }

    function formatReverseDirectionAngle(thetaDeg) {
        const deg = (thetaDeg + 180) % 360;
        return formatDirectionAngle(deg);
    }

    function clampLabelPosition(pos, width = 86, height = 28) {
        const pad = 14;
        const maxX = Math.max(pad, sandboxWrapper.clientWidth - width - pad);
        const maxY = Math.max(pad, sandboxWrapper.clientHeight - height - pad);
        return {
            x: Math.min(maxX, Math.max(pad + width / 2, pos.x)),
            y: Math.min(maxY, Math.max(pad + height / 2, pos.y))
        };
    }

    function updateHTMLOverlayAndHUD() {
        let overlayHtml = "";

        // 当没有播放重合性质动画时，在画布上渲染出浮动读数标注
        if (renderValues.animProgress < 0.01) {
            if (currentScene === "complementary-angles" || currentScene === "supplementary-angles") {
                const isComp = currentScene === "complementary-angles";
                const baseAngle = isComp ? Math.PI / 2 : Math.PI;

                if (subMode === "free-adjust") {
                    const alphaDeg = (renderValues.angleAlpha * 180 / Math.PI).toFixed(1);
                    const betaDeg = ((baseAngle - renderValues.angleAlpha) * 180 / Math.PI).toFixed(1);

                    // 计算标注坐标位置 (在夹角中段线上)
                    const midAlpha = -renderValues.angleAlpha / 2;
                    const midBeta = -renderValues.angleAlpha - (baseAngle - renderValues.angleAlpha) / 2;

                    const lblRad1 = 80;
                    const lblRad2 = 90;

                    const pos1 = clampLabelPosition({ x: O.x + lblRad1 * Math.cos(midAlpha), y: O.y + lblRad1 * Math.sin(midAlpha) });
                    const pos2Raw = { x: O.x + lblRad2 * Math.cos(midBeta), y: O.y + lblRad2 * Math.sin(midBeta) };
                    const pos2 = clampLabelPosition({
                        x: pos2Raw.x,
                        y: Math.abs(pos2Raw.y - pos1.y) < 24 ? pos2Raw.y - 26 : pos2Raw.y
                    });

                    overlayHtml += `
                        <div class="brace-label lbl-alpha" style="left:${pos1.x}px; top:${pos1.y}px">α = ${alphaDeg}°</div>
                        <div class="brace-label lbl-beta" style="left:${pos2.x}px; top:${pos2.y}px">β = ${betaDeg}°</div>
                    `;
                }
            } else if (currentScene === "bearings-compass") {
                if (subMode === "free-adjust") {
                    const thetaDeg = renderValues.bearingTheta * 180 / Math.PI;
                    const dirStr = formatDirectionAngle(thetaDeg);
                    const distCm = (renderValues.bearingDist / SCALE_CM_TO_PX).toFixed(1);

                    // 放置在射线中点处偏侧
                    const midAngle = renderValues.bearingTheta - Math.PI/2;
                    const pos = clampLabelPosition({
                        x: O.x + (renderValues.bearingDist / 2 + 10) * Math.cos(midAngle),
                        y: O.y + (renderValues.bearingDist / 2 + 10) * Math.sin(midAngle)
                    }, 160, 30);

                    overlayHtml += `
                        <div class="brace-label lbl-alpha" style="left:${pos.x}px; top:${pos.y}px; border-left:3px solid var(--segment-alpha);">${dirStr} (${distCm} cm)</div>
                    `;
                }
            }
        }

        htmlOverlay.innerHTML = overlayHtml;
        updateChalkboardHUD();
    }

    function updateChalkboardHUD() {
        let html = "";
        const hudTitle = hudPanel.querySelector(".hud-title");

        const alpha = renderValues.angleAlpha * 180 / Math.PI;
        const bearing = (renderValues.bearingTheta * 180 / Math.PI + 360) % 360;

        const tagAlpha = `<span class="math-seg seg-alpha" data-highlight="alpha">${alpha.toFixed(1)}°</span>`;
        const tagBeta = (isComp) => {
            const val = isComp ? (90 - alpha) : (180 - alpha);
            return `<span class="math-seg seg-beta" data-highlight="beta">${val.toFixed(1)}°</span>`;
        };

        if (currentScene === "complementary-angles") {
            if (hudTitle) hudTitle.textContent = "余角关系板书";
            const beta = 90 - alpha;
            html = `
                <div class="hud-board-title">余角关系板书</div>
                <div class="hud-equation-line"><span>α</span><strong>${alpha.toFixed(1)}°</strong><span>β</span><strong>${beta.toFixed(1)}°</strong></div>
                <div class="hud-equation-box success-box">
                    <div class="formula">α + β = ${alpha.toFixed(1)}° + ${beta.toFixed(1)}° = <span class="highlight">90°</span></div>
                </div>
                ${subMode === "proof-demo" ? `
                    <div class="hud-proof-line">α₁ = α₂ ⇒ β₁ = β₂</div>
                    <div class="hud-conclusion">等角的余角相等</div>
                ` : `
                    <div class="hud-proof-line">β = 90° - α</div>
                `}
            `;
        } else if (currentScene === "supplementary-angles") {
            if (hudTitle) hudTitle.textContent = "补角关系板书";
            const beta = 180 - alpha;
            html = `
                <div class="hud-board-title">补角关系板书</div>
                <div class="hud-equation-line"><span>α</span><strong>${alpha.toFixed(1)}°</strong><span>β</span><strong>${beta.toFixed(1)}°</strong></div>
                <div class="hud-equation-box success-box">
                    <div class="formula">α + β = ${alpha.toFixed(1)}° + ${beta.toFixed(1)}° = <span class="highlight">180°</span></div>
                </div>
                ${subMode === "proof-demo" ? `
                    <div class="hud-proof-line">α₁ = α₂ ⇒ β₁ = β₂</div>
                    <div class="hud-conclusion">等角的补角相等</div>
                ` : `
                    <div class="hud-proof-line">β = 180° - α</div>
                `}
            `;
        } else if (currentScene === "bearings-compass") {
            if (hudTitle) hudTitle.textContent = "方位角板书";
            const dirStr = formatDirectionAngle(bearing);
            const revDirStr = formatReverseDirectionAngle(bearing);
            html = `
                <div class="hud-board-title">方位角板书</div>
                <div class="hud-proof-line">方位角：正北顺时针</div>
                <div class="hud-equation-line"><span>方位角</span><strong>${bearing.toFixed(0).padStart(3, '0')}°</strong></div>
                <div class="hud-conclusion">${dirStr}</div>
                <div class="hud-equation-box success-box">
                    <div class="formula formula-stack">
                        <div>A 在 O：<strong>${dirStr}</strong></div>
                        <div>O 在 A：<strong style="color: var(--segment-beta);">${revDirStr}</strong></div>
                    </div>
                </div>
                ${subMode === "proof-demo" ? `
                    <div class="hud-proof-line">南北线平行 ⇒ 内错角相等</div>
                ` : ""}
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 定理深度解析 (卡片更新)
    // ==========================================================================
    function updateTheoryContent() {
        if (currentScene === "complementary-angles") {
            theoryTitle.innerHTML = "💡 互为余角与性质";
            theoryText.innerHTML = `
                <p><strong>核心关系</strong>：α + β = 90°，两个角互为余角。</p>
                <ul>
                    <li>一个角确定，另一个角就是 90° 减去它。</li>
                    <li>同角或等角的余角相等。</li>
                    <li>常用于直角三角形、垂线、相似证明中的角度转换。</li>
                </ul>
                <p>“自动演示教学过程”会演示一次，并停在关键结论。</p>
            `;
        } else if (currentScene === "supplementary-angles") {
            theoryTitle.innerHTML = "💡 互为补角与性质";
            theoryText.innerHTML = `
                <p><strong>核心关系</strong>：α + β = 180°，两个角互为补角。</p>
                <ul>
                    <li>一个角确定，另一个角就是 180° 减去它。</li>
                    <li>同角或等角的补角相等。</li>
                    <li>常用于平角、邻补角、平行线同旁内角等模型。</li>
                </ul>
                <p>“自动演示教学过程”会把等角对应的补角叠合到结论位置。</p>
            `;
        } else if (currentScene === "bearings-compass") {
            theoryTitle.innerHTML = "💡 方向角、方位角与互逆方向";
            theoryText.innerHTML = `
                <p><strong>读数规则</strong>：方位角从正北开始，按顺时针方向读数。</p>
                <ul>
                    <li>方向角用“北偏东、南偏西”等形式表达。</li>
                    <li>两地南北线平行，视线作截线，偏角大小相等。</li>
                    <li>A 在 O 的方向与 O 在 A 的方向互逆：南北互换，东西互换。</li>
                </ul>
            `;
        }
    }

    // ==========================================================================
    // 9. LERP 平滑渲染循环与动画处理
    // ==========================================================================
    function updateLerp() {
        const k = 0.15;

        if (isPresetTransitioning) {
            const k_p = 0.12;
            angleAlpha += (targetAngleAlpha - angleAlpha) * k_p;
            bearingTheta += (targetBearingTheta - bearingTheta) * k_p;
            bearingDist += (targetBearingDist - bearingDist) * k_p;

            // 同步反馈滑块
            sliderAngleAlpha.value = (angleAlpha * 180 / Math.PI).toFixed(1);
            valAngleAlpha.textContent = (angleAlpha * 180 / Math.PI).toFixed(1) + "°";
            sliderBearingTheta.value = (bearingTheta * 180 / Math.PI).toFixed(1);
            valBearingTheta.textContent = (bearingTheta * 180 / Math.PI).toFixed(1) + "°";
            sliderBearingDist.value = bearingDist;
            valBearingDist.textContent = bearingDist + " px";

            const dAlpha = Math.abs(angleAlpha - targetAngleAlpha);
            const dTheta = Math.abs(bearingTheta - targetBearingTheta);
            const dDist = Math.abs(bearingDist - targetBearingDist);

            if (dAlpha < 1e-3 && dTheta < 1e-3 && dDist < 0.2) {
                angleAlpha = targetAngleAlpha;
                bearingTheta = targetBearingTheta;
                bearingDist = targetBearingDist;
                isPresetTransitioning = false;
            }
        }

        renderValues.angleAlpha += (angleAlpha - renderValues.angleAlpha) * k;
        renderValues.bearingTheta += (bearingTheta - renderValues.bearingTheta) * k;
        renderValues.bearingDist += (bearingDist - renderValues.bearingDist) * k;

        // 叠合性质证明动画
        if (animDirection !== 0) {
            animProgress += animDirection * 0.02;
            if (animProgress >= 1.0) {
                animProgress = 1.0;
                animDirection = 0;
                isAnimating = false;
                btnPlayProof.innerHTML = PROOF_BUTTON_DONE_HTML;

                // 在重合交点上爆发花火
                const rect = sandboxSvg.getBoundingClientRect();
                const sparkX = rect.left + O.x * zoomScale;
                const sparkY = rect.top + O.y * zoomScale;

                if (currentScene === "bearings-compass") {
                    const sparkAX = rect.left + points.A.x * zoomScale;
                    const sparkAY = rect.top + points.A.y * zoomScale;
                    spawnExplosion(sparkAX, sparkAY, "var(--segment-alpha)");
                } else {
                    spawnExplosion(sparkX, sparkY, "var(--segment-beta)");
                }
            }
        }
        renderValues.animProgress += (animProgress - renderValues.animProgress) * 0.25;

        solveGeometry();
        renderSVG();
        updateHTMLOverlayAndHUD();
    }

    let lerpId = null;
    function startLerpLoop() {
        function loop() {
            updateLerp();
            lerpId = requestAnimationFrame(loop);
        }
        if (!lerpId) loop();
    }
    startLerpLoop();

    function playProofAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        animProgress = 0.0;
        renderValues.animProgress = 0.0;
        animDirection = 1;
        btnPlayProof.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
            正在演示...
        `;
    }

    // ==========================================================================
    // 10. 场景切换与动态选项加载
    // ==========================================================================
    function loadScene(scene) {
        currentScene = scene;
        animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;

        btnPlayProof.innerHTML = PROOF_BUTTON_IDLE_HTML;

        // 1. 切换 presets 样式高亮
        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === scene) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // 2. 动态调节 sliders 显示
        if (scene === "bearings-compass") {
            document.getElementById("row-angle-alpha").style.display = "none";
            document.getElementById("row-bearing-theta").style.display = "flex";
            document.getElementById("row-bearing-dist").style.display = "flex";
            
            // 加载方位角特有的 submode
            subMode = "free-adjust";
            subModeContainer.innerHTML = `
                <button class="btn-secondary flex-btn btn-sub-mode active" data-sub="free-adjust">方向观测自由调整</button>
                <button class="btn-secondary flex-btn btn-sub-mode" data-sub="proof-demo">性质证明：互逆方位角</button>
            `;
            // 加载方位角常用预设
            presetButtonsContainer.innerHTML = `
                <button class="btn-secondary flex-btn btn-shape-preset" data-preset="bearing-30" style="padding: 10px 4px; font-size: 11px;">北偏东 30°</button>
                <button class="btn-secondary flex-btn btn-shape-preset" data-preset="bearing-135" style="padding: 10px 4px; font-size: 11px;">南偏东 45°</button>
                <button class="btn-secondary flex-btn btn-shape-preset" data-preset="bearing-240" style="padding: 10px 4px; font-size: 11px;">南偏西 60°</button>
                <button class="btn-secondary flex-btn btn-shape-preset" data-preset="bearing-315" style="padding: 10px 4px; font-size: 11px;">北偏西 45°</button>
            `;
            document.getElementById("section-demo-controls").style.display = "none"; // 初始自由调整不需要证明控制
        } else {
            document.getElementById("row-angle-alpha").style.display = "flex";
            document.getElementById("row-bearing-theta").style.display = "none";
            document.getElementById("row-bearing-dist").style.display = "none";

            const isComp = scene === "complementary-angles";
            sliderAngleAlpha.max = isComp ? 90 : 180;
            if (angleAlpha > (isComp ? Math.PI/2 : Math.PI)) {
                angleAlpha = isComp ? Math.PI/4 : Math.PI/2;
            }

            subMode = "free-adjust";
            subModeContainer.innerHTML = `
                <button class="btn-secondary flex-btn btn-sub-mode active" data-sub="free-adjust">角度自由调整</button>
                <button class="btn-secondary flex-btn btn-sub-mode" data-sub="proof-demo">性质证明：等量性质</button>
            `;

            if (isComp) {
                presetButtonsContainer.innerHTML = `
                    <button class="btn-secondary flex-btn btn-shape-preset" data-preset="comp-30-60" style="padding: 10px 4px; font-size: 11px;">30° 与 60°</button>
                    <button class="btn-secondary flex-btn btn-shape-preset" data-preset="comp-45-45" style="padding: 10px 4px; font-size: 11px;">45° 与 45°</button>
                    <button class="btn-secondary flex-btn btn-shape-preset" data-preset="comp-60-30" style="padding: 10px 4px; font-size: 11px;">60° 与 30°</button>
                `;
            } else {
                presetButtonsContainer.innerHTML = `
                    <button class="btn-secondary flex-btn btn-shape-preset" data-preset="supp-30-150" style="padding: 10px 4px; font-size: 11px;">30° 与 150°</button>
                    <button class="btn-secondary flex-btn btn-shape-preset" data-preset="supp-90-90" style="padding: 10px 4px; font-size: 11px;">90° 与 90°</button>
                    <button class="btn-secondary flex-btn btn-shape-preset" data-preset="supp-60-120" style="padding: 10px 4px; font-size: 11px;">60° 与 120°</button>
                `;
            }
            document.getElementById("section-demo-controls").style.display = "none";
        }

        // 绑定 sub-mode 按钮事件
        document.querySelectorAll(".btn-sub-mode").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".btn-sub-mode").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                subMode = btn.getAttribute("data-sub");
                animProgress = 0.0;
                animDirection = 0;
                isAnimating = false;
                btnPlayProof.innerHTML = PROOF_BUTTON_IDLE_HTML;

                if (subMode === "proof-demo") {
                    document.getElementById("section-demo-controls").style.display = "block";
                } else {
                    document.getElementById("section-demo-controls").style.display = "none";
                }
                solveGeometry();
            });
        });

        // 绑定预设按钮事件
        document.querySelectorAll(".btn-shape-preset").forEach(btn => {
            btn.addEventListener("click", () => {
                const pr = btn.getAttribute("data-preset");
                triggerPreset(pr);
            });
        });

        // 反馈滑块值
        sliderAngleAlpha.value = (angleAlpha * 180 / Math.PI).toFixed(1);
        valAngleAlpha.textContent = (angleAlpha * 180 / Math.PI).toFixed(1) + "°";
        sliderBearingTheta.value = (bearingTheta * 180 / Math.PI).toFixed(1);
        valBearingTheta.textContent = (bearingTheta * 180 / Math.PI).toFixed(1) + "°";
        sliderBearingDist.value = bearingDist;
        valBearingDist.textContent = bearingDist + " px";

        updateTheoryContent();
        if (!isPresetTransitioning) {
            centerModel();
        }
        solveGeometry();
    }

    function triggerPreset(presetName) {
        isPresetTransitioning = true;

        if (presetName === "comp-30-60") {
            targetAngleAlpha = 30 * Math.PI / 180;
        } else if (presetName === "comp-45-45") {
            targetAngleAlpha = 45 * Math.PI / 180;
        } else if (presetName === "comp-60-30") {
            targetAngleAlpha = 60 * Math.PI / 180;
        } else if (presetName === "supp-30-150") {
            targetAngleAlpha = 30 * Math.PI / 180;
        } else if (presetName === "supp-60-120") {
            targetAngleAlpha = 60 * Math.PI / 180;
        } else if (presetName === "supp-90-90") {
            targetAngleAlpha = 90 * Math.PI / 180;
        } else if (presetName === "bearing-30") {
            targetBearingTheta = 30 * Math.PI / 180;
            targetBearingDist = 160;
        } else if (presetName === "bearing-135") {
            targetBearingTheta = 135 * Math.PI / 180;
            targetBearingDist = 160;
        } else if (presetName === "bearing-240") {
            targetBearingTheta = 240 * Math.PI / 180;
            targetBearingDist = 160;
        } else if (presetName === "bearing-315") {
            targetBearingTheta = 315 * Math.PI / 180;
            targetBearingDist = 160;
        }
    }

    function resetState() {
        isPresetTransitioning = false;
        animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;

        angleAlpha = 35 * Math.PI / 180;
        targetAngleAlpha = 35 * Math.PI / 180;
        bearingTheta = 60 * Math.PI / 180;
        targetBearingTheta = 60 * Math.PI / 180;
        bearingDist = 160;
        targetBearingDist = 160;

        loadScene(currentScene);
        centerModel();
    }

    // 自适应居中 (动态右偏防重叠)
    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        zoomScale = 1.0;
        panX = 0;
        panY = 0;

        const isDesktop = W > 800;
        const offsetPct = isDesktop ? (isHudExpanded ? 0.62 : 0.56) : 0.5;

        O.x = W * offsetPct;
        O.y = H / 2;

        O1.x = W * (offsetPct - 0.16);
        O1.y = H / 2;
        O2.x = W * (offsetPct + 0.16);
        O2.y = H / 2;

        updateTransform();
    }

    function updateTransform() {
        sandboxSvg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        htmlOverlay.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    }

    function getLocalPoint(clientX, clientY) {
        const rect = sandboxWrapper.getBoundingClientRect();
        return {
            x: (clientX - rect.left - panX) / zoomScale,
            y: (clientY - rect.top - panY) / zoomScale
        };
    }

    function updateDraggedGeometry(localX, localY) {
        if (activeDragPoint === "C") {
            let angle = Math.atan2(O.y - localY, localX - O.x);
            if (angle < 0) angle += 2 * Math.PI;

            const isComp = currentScene === "complementary-angles";
            const maxRad = isComp ? Math.PI / 2 : Math.PI;
            angle = Math.min(maxRad, Math.max(0, angle));

            let deg = angle * 180 / Math.PI;
            if (isSnappingEnabled) {
                deg = snapAngleDeg(deg);
                angle = deg * Math.PI / 180;
            }

            angleAlpha = angle;
            targetAngleAlpha = angle;
            sliderAngleAlpha.value = deg.toFixed(1);
            valAngleAlpha.textContent = deg.toFixed(1) + "°";
            return;
        }

        if (activeDragPoint === "A") {
            const dx = localX - O.x;
            const dy = O.y - localY;

            let angle = Math.atan2(dx, dy);
            if (angle < 0) angle += 2 * Math.PI;

            let deg = angle * 180 / Math.PI;
            if (isSnappingEnabled) {
                deg = snapAngleDeg(deg);
                angle = deg * Math.PI / 180;
            }

            const d = Math.min(230, Math.max(100, Math.hypot(dx, dy)));
            bearingTheta = angle;
            targetBearingTheta = angle;
            bearingDist = d;
            targetBearingDist = d;

            sliderBearingTheta.value = deg.toFixed(1);
            valBearingTheta.textContent = deg.toFixed(1) + "°";
            sliderBearingDist.value = d.toFixed(0);
            valBearingDist.textContent = d.toFixed(0) + " px";
        }
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

    ["contextmenu", "selectstart", "dragstart"].forEach(eventName => {
        sandboxWrapper.addEventListener(eventName, (e) => {
            e.preventDefault();
        });
    });

    // 统一指针模型：同一状态机处理鼠标、触笔与触屏，避免触摸后合成鼠标事件重复触发。
    const activePointers = new Map();
    let activePointerId = null;
    let initialPinchDistance = 0;
    let initialPinchScale = 1.0;

    function getDraggablePointId(target) {
        const pointWrapper = target?.closest?.(".geo-point-wrapper");
        const pointId = pointWrapper?.getAttribute("data-point-id");
        return ["C", "A"].includes(pointId) ? pointId : null;
    }

    function getPinchDistance() {
        const [first, second] = Array.from(activePointers.values());
        return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0;
    }

    function resetPointerGesture() {
        activeDragPoint = null;
        activePointerId = null;
        isPanning = false;
        initialPinchDistance = 0;
        sandboxWrapper.classList.remove("panning");
    }

    function startPan(pointer) {
        activeDragPoint = null;
        isPanning = true;
        startPanX = pointer.x - panX;
        startPanY = pointer.y - panY;
        sandboxWrapper.classList.add("panning");
    }

    function onPointerDown(event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (event.target.closest?.("#hud-chalkboard-panel, .canvas-controls, .teaching-status-card")) return;

        const pointer = { x: event.clientX, y: event.clientY };
        activePointers.set(event.pointerId, pointer);
        sandboxWrapper.setPointerCapture?.(event.pointerId);

        if (activePointers.size >= 2) {
            activeDragPoint = null;
            isPanning = false;
            sandboxWrapper.classList.remove("panning");
            initialPinchDistance = getPinchDistance();
            initialPinchScale = zoomScale;
        } else {
            activePointerId = event.pointerId;
            const pointId = getDraggablePointId(event.target);
            if (pointId) {
                activeDragPoint = pointId;
                isPresetTransitioning = false;
            } else {
                startPan(pointer);
            }
        }
        event.preventDefault();
    }

    function onPointerMove(event) {
        if (!activePointers.has(event.pointerId)) return;
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (activePointers.size >= 2 && initialPinchDistance > 0) {
            const factor = getPinchDistance() / initialPinchDistance;
            zoomScale = Math.min(Math.max(initialPinchScale * factor, 0.45), 3.0);
            updateTransform();
            event.preventDefault();
            return;
        }

        if (event.pointerId !== activePointerId) return;
        if (activeDragPoint) {
            const local = getLocalPoint(event.clientX, event.clientY);
            updateDraggedGeometry(local.x, local.y);
        } else if (isPanning) {
            panX = event.clientX - startPanX;
            panY = event.clientY - startPanY;
            updateTransform();
        }
        event.preventDefault();
    }

    function onPointerEnd(event) {
        activePointers.delete(event.pointerId);
        if (sandboxWrapper.hasPointerCapture?.(event.pointerId)) {
            sandboxWrapper.releasePointerCapture(event.pointerId);
        }

        if (activePointers.size === 1) {
            const [remainingId, remainingPointer] = activePointers.entries().next().value;
            activePointerId = remainingId;
            initialPinchDistance = 0;
            startPan(remainingPointer);
        } else if (activePointers.size === 0) {
            resetPointerGesture();
        }
    }

    sandboxWrapper.addEventListener("pointerdown", onPointerDown, { passive: false });
    sandboxWrapper.addEventListener("pointermove", onPointerMove, { passive: false });
    sandboxWrapper.addEventListener("pointerup", onPointerEnd);
    sandboxWrapper.addEventListener("pointercancel", onPointerEnd);

    // HUD 文字 Hover 发光联动
    function highlightOnCanvas(segId, active) {
        if (segId === "alpha") {
            const el = document.querySelector(".geo-angle-arc[style*='stroke: var(--segment-alpha)']");
            if (el) {
                if (active) el.classList.add("active-glow");
                else el.classList.remove("active-glow");
            }
        } else if (segId === "beta") {
            const el = document.querySelector(".geo-angle-arc[style*='stroke: var(--segment-beta)']");
            if (el) {
                if (active) el.classList.add("active-glow");
                else el.classList.remove("active-glow");
            }
        }
    }

    stepsChalkboard.addEventListener("mouseover", (e) => {
        const mathSeg = e.target.closest(".math-seg");
        if (mathSeg) {
            const highlight = mathSeg.getAttribute("data-highlight");
            if (highlight) {
                highlightOnCanvas(highlight, true);
            }
        }
    });

    stepsChalkboard.addEventListener("mouseout", (e) => {
        const mathSeg = e.target.closest(".math-seg");
        if (mathSeg) {
            const highlight = mathSeg.getAttribute("data-highlight");
            if (highlight) {
                highlightOnCanvas(highlight, false);
            }
        }
    });

    // ==========================================================================
    // 12. 页面按钮绑定与初始化
    // ==========================================================================
    btnToggleSnap.addEventListener("click", () => {
        isSnappingEnabled = !isSnappingEnabled;
        if (isSnappingEnabled) {
            btnToggleSnap.classList.add("active");
            btnToggleSnap.querySelector("span").textContent = "已开启角度整数吸附";
            // 立即进行一次吸附校准
            let degAlpha = snapAngleDeg(angleAlpha * 180 / Math.PI);
            angleAlpha = degAlpha * Math.PI / 180;
            targetAngleAlpha = angleAlpha;
            let degTheta = snapAngleDeg(bearingTheta * 180 / Math.PI);
            bearingTheta = degTheta * Math.PI / 180;
            targetBearingTheta = bearingTheta;
        } else {
            btnToggleSnap.classList.remove("active");
            btnToggleSnap.querySelector("span").textContent = "开启角度整数吸附";
        }
        solveGeometry();
    });

    sliderAngleAlpha.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        let deg = parseFloat(e.target.value);
        if (isSnappingEnabled) {
            deg = snapAngleDeg(deg);
        }
        angleAlpha = deg * Math.PI / 180;
        targetAngleAlpha = angleAlpha;
        valAngleAlpha.textContent = deg.toFixed(1) + "°";
    });

    sliderBearingTheta.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        let deg = parseFloat(e.target.value);
        if (isSnappingEnabled) {
            deg = snapAngleDeg(deg);
        }
        bearingTheta = deg * Math.PI / 180;
        targetBearingTheta = bearingTheta;
        valBearingTheta.textContent = deg.toFixed(1) + "°";
    });

    sliderBearingDist.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        bearingDist = parseFloat(e.target.value);
        targetBearingDist = bearingDist;
        valBearingDist.textContent = bearingDist.toFixed(0) + " px";
    });

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const sc = btn.getAttribute("data-scene");
            loadScene(sc);
        });
    });

    btnPlayProof.addEventListener("click", playProofAnimation);
    btnResetState.addEventListener("click", resetState);

    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));

    if (hudToggleBtn) {
        hudToggleBtn.addEventListener("click", () => {
            isHudExpanded = !isHudExpanded;
            if (isHudExpanded) {
                hudPanel.classList.remove("collapsed");
            } else {
                hudPanel.classList.add("collapsed");
            }
            centerModel();
        });
    }

    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());

    sandboxWrapper.parentNode.addEventListener("dblclick", (e) => {
        if (e.target.closest(".btn-zoom") || e.target.closest(".control-column") || e.target.closest(".btn-shape-preset")) return;
        centerModel();
    });

    // 暴露状态接口
    window.appState = {
        get currentScene() { return currentScene; },
        get subMode() { return subMode; },
        get angleAlpha() { return angleAlpha; },
        get bearingTheta() { return bearingTheta; },
        get bearingDist() { return bearingDist; },
        get points() { return points; },
        get isSnappingEnabled() { return isSnappingEnabled; },
        set isSnappingEnabled(val) {
            isSnappingEnabled = val;
            if (isSnappingEnabled) {
                btnToggleSnap.classList.add("active");
                btnToggleSnap.querySelector("span").textContent = "已开启角度整数吸附";
            } else {
                btnToggleSnap.classList.remove("active");
                btnToggleSnap.querySelector("span").textContent = "开启角度整数吸附";
            }
            solveGeometry();
        },
        resetState,
        loadScene,
        triggerPreset,
        get renderValues() {
            return {
                angleAlpha: renderValues.angleAlpha,
                bearingTheta: renderValues.bearingTheta,
                bearingDist: renderValues.bearingDist,
                animProgress: renderValues.animProgress
            };
        }
    };

    resetState();
});

/**
 * 一元一次方程应用题线段图演示仪 - 课件交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态与参数
    // ==========================================================================
    let currentScene = "meeting-problem"; // meeting-problem | chasing-problem | ratio-problem
    let isAnimating = false;
    let animationProgress = 0.0; // 0.0 至 1.0
    let isSnappingEnabled = true;
    let isHudExpanded = false;

    // 常用物理与缩放比例
    let SCALE_PX = 1.4; // 1公里对应多少像素
    let BASE_X = 180;   // 线段起点的 X 坐标
    let BASE_Y = 240;   // 线段起点的 Y 坐标

    // 场景 1：相遇问题参数
    let meetDistance = 360;  // 总路程 S (km)
    let meetSpeed1 = 70;     // 甲车速度 v1 (km/h)
    let meetSpeed2 = 50;     // 乙车速度 v2 (km/h)

    // 场景 2：追及问题参数
    let chaseStartDist = 80; // 初始相距 S (km)
    let chaseSpeed1 = 80;    // 追赶者甲速度 v1 (km/h)
    let chaseSpeed2 = 40;    // 被追者乙速度 v2 (km/h)，要求 v1 > v2

    // 场景 3：和差倍数与分配参数
    let ratioW = 100;        // 总量 W
    let ratioK = 2;          // 倍数 k（乙含 k 份 x）
    let ratioB = 10;         // 常数偏移量 b (-30 至 30)

    // LERP 平滑过渡系统
    const renderValues = {
        meetDistance: 360,
        meetSpeed1: 70,
        meetSpeed2: 50,
        chaseStartDist: 80,
        chaseSpeed1: 80,
        chaseSpeed2: 40,
        ratioW: 100,
        ratioK: 2,
        ratioB: 10,
        animationProgress: 0.0
    };

    // 画布缩放与平移
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;
    let lastPinchDistance = 0;
    const TOUCH_POINT_HIT_RADIUS = 24;
    const TOUCH_PAN_THRESHOLD = 6;
    let isTouchDraggingPoint = false;
    let touchPanStarted = false;
    let touchStartClientX = 0;
    let touchStartClientY = 0;

    // 鼠标拖拽点状态
    let activeDragNode = null;

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");

    const btnToggleMotion = document.getElementById("btn-toggle-motion");
    const btnResetMotion = document.getElementById("btn-reset-motion");
    const sliderTimeline = document.getElementById("slider-timeline");
    const valTimeline = document.getElementById("val-timeline");

    const slidersContainer = document.getElementById("sliders-container");
    const presetButtonsContainer = document.getElementById("preset-buttons-container");
    const btnToggleSnap = document.getElementById("btn-toggle-snap");
    const btnResetApp = document.getElementById("btn-reset-app");
    const btnShowHelp = document.getElementById("btn-show-help");
    const modalHelp = document.getElementById("modal-help");
    const btnCloseHelp = document.getElementById("btn-close-help");

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
    // 4. 整数解强吸附算法 (Integer Snapping Engine)
    // ==========================================================================
    function snapMeetingParameters(triggerSource) {
        if (!isSnappingEnabled) return;

        let t = meetDistance / (meetSpeed1 + meetSpeed2);
        // 吸附时间 t 到最接近的干净的分数/整数
        let tSnap = Math.round(t * 2) / 2;
        if (tSnap < 0.5) tSnap = 0.5;

        if (triggerSource === "speed2" || triggerSource === "speed1") {
            // 通过微调 speed2 贴合
            let newV2 = Math.round(meetDistance / tSnap - meetSpeed1);
            if (newV2 >= 20 && newV2 <= 120) {
                meetSpeed2 = newV2;
            } else {
                // 如果 speed2 超出范围，转而微调总路程 distance
                let newS = tSnap * (meetSpeed1 + meetSpeed2);
                if (newS >= 150 && newS <= 600) {
                    meetDistance = newS;
                }
            }
        } else {
            // 通过微调总路程 S 来贴合
            let newS = tSnap * (meetSpeed1 + meetSpeed2);
            if (newS >= 150 && newS <= 600) {
                meetDistance = newS;
            }
        }
    }

    function snapChasingParameters(triggerSource) {
        if (!isSnappingEnabled) return;

        if (chaseSpeed1 <= chaseSpeed2) {
            chaseSpeed1 = chaseSpeed2 + 10;
        }

        let t = chaseStartDist / (chaseSpeed1 - chaseSpeed2);
        let tSnap = Math.round(t * 2) / 2;
        if (tSnap < 0.5) tSnap = 0.5;

        if (triggerSource === "speed1" || triggerSource === "speed2") {
            let newV1 = Math.round(chaseStartDist / tSnap + chaseSpeed2);
            if (newV1 >= 40 && newV1 <= 150) {
                chaseSpeed1 = newV1;
            } else {
                let newS = tSnap * (chaseSpeed1 - chaseSpeed2);
                if (newS >= 40 && newS <= 200) {
                    chaseStartDist = newS;
                }
            }
        } else {
            let newS = tSnap * (chaseSpeed1 - chaseSpeed2);
            if (newS >= 40 && newS <= 200) {
                chaseStartDist = newS;
            }
        }
    }

    function getRatioModel() {
        const coefficient = ratioK + 1;
        const x = (ratioW - ratioB) / coefficient;
        const secondAmount = ratioK * x + ratioB;

        return {
            W: ratioW,
            k: ratioK,
            b: ratioB,
            coefficient,
            x,
            secondAmount
        };
    }

    function formatRatioNumber(value) {
        return Number.isInteger(value) ? value.toFixed(0) : Number(value.toFixed(2)).toString();
    }

    function formatRatioTerm(k, b) {
        const multiple = k === 1 ? "x" : `${k}x`;
        if (b === 0) return multiple;
        return `${multiple} ${b > 0 ? "+" : "-"} ${Math.abs(b).toFixed(0)}`;
    }

    function snapRatioParameters() {
        if (!isSnappingEnabled) return;

        // 总量滑块以 5 为步长。直接枚举可选总量，避免边界夹逼后再次得到非整数解。
        const divisor = ratioK + 1;
        let bestTotal = ratioW;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (let candidate = 40; candidate <= 250; candidate += 5) {
            if ((candidate - ratioB) % divisor !== 0) continue;

            const distance = Math.abs(candidate - ratioW);
            if (distance < bestDistance || (distance === bestDistance && candidate < bestTotal)) {
                bestTotal = candidate;
                bestDistance = distance;
            }
        }

        ratioW = bestTotal;
    }

    // ==========================================================================
    // 5. SVG 路径生成器 (括号及线段)
    // ==========================================================================
    function getHorizontalBracePath(x1, x2, y, isUpward = true) {
        const h = 12; // 括号高度
        const r = 6;  // 倒角半径
        const mid = (x1 + x2) / 2;
        const dir = isUpward ? -1 : 1;
        
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);
        
        return `M ${startX} ${y} 
                Q ${startX + r} ${y + dir * h * 0.1} ${startX + r} ${y + dir * h * 0.5}
                L ${mid - r} ${y + dir * h * 0.5}
                Q ${mid} ${y + dir * h * 0.6} ${mid} ${y + dir * h}
                Q ${mid} ${y + dir * h * 0.6} ${mid + r} ${y + dir * h * 0.5}
                L ${endX - r} ${y + dir * h * 0.5}
                Q ${endX - r} ${y + dir * h * 0.1} ${endX} ${y}`;
    }

    function drawSVGPoint(id, x, y, labelText, offset = { x: 0, y: 16 }, isDraggable = true) {
        let ptClass = "geo-point-wrapper";
        if (isDraggable) ptClass += " draggable-point";

        let html = `
            <g class="${ptClass}" data-point-id="${id}">
                <circle class="touch-hit-target" cx="${x}" cy="${y}" r="${TOUCH_POINT_HIT_RADIUS}"></circle>
                <circle class="geo-point-halo" cx="${x}" cy="${y}" r="15"></circle>
                <circle class="geo-point" cx="${x}" cy="${y}" r="6"></circle>
            </g>
        `;
        if (labelText) {
            html += `<text class="geo-label" x="${x + offset.x}" y="${y + offset.y}" text-anchor="middle">${labelText}</text>`;
        }
        return html;
    }

    function drawRunner(label, x, y, color) {
        return `
            <g class="runner-marker" transform="translate(${x}, ${y})">
                <circle class="runner-circle" cx="0" cy="0" r="11" fill="${color}"></circle>
                <text class="runner-label" x="0" y="0">${label}</text>
            </g>
        `;
    }

    function drawModelFlowBadge(x, y, title, relation, equation) {
        return `
            <foreignObject class="model-flow-badge" x="${x}" y="${y}" width="360" height="86">
                <div xmlns="http://www.w3.org/1999/xhtml" class="relation-summary-card">
                    <div class="relation-title">${title}</div>
                    <div class="relation-line">${relation}</div>
                    <div class="relation-equation">${equation}</div>
                </div>
            </foreignObject>
        `;
    }

    // ==========================================================================
    // 6. SVG 渲染逻辑
    // ==========================================================================
    function renderSVG() {
        let drawHtml = "";

        const progress = renderValues.animationProgress;

        // ==========================================================================
        // 场景 1: 相遇问题
        // ==========================================================================
        if (currentScene === "meeting-problem") {
            const dist = renderValues.meetDistance;
            const v1 = renderValues.meetSpeed1;
            const v2 = renderValues.meetSpeed2;

            const t_meet = dist / (v1 + v2);
            
            const pxTotal = dist * SCALE_PX;
            const startX = BASE_X;
            const endX = startX + pxTotal;
            const y = BASE_Y;

            // 算出相遇点 M 的位置
            const pxM = (v1 * t_meet) * SCALE_PX;
            const mX = startX + pxM;

            // 1. 基准背景虚线
            drawHtml += `
                <line class="geo-line-seg seg-base" x1="${startX}" y1="${y}" x2="${endX}" y2="${y}"></line>
            `;

            // 2. 运动轨迹绘制 (随 progress 行进)
            const curT = t_meet * progress;
            const pxCar1 = (v1 * curT) * SCALE_PX;
            const pxCar2 = (v2 * curT) * SCALE_PX;

            const car1X = startX + pxCar1;
            const car2X = endX - pxCar2;

            // 绘制行驶过的路程线段
            if (progress > 0.001) {
                drawHtml += `
                    <line class="geo-line-seg seg-alpha" x1="${startX}" y1="${y}" x2="${car1X}" y2="${y}"></line>
                    <line class="geo-line-seg seg-beta" x1="${car2X}" y1="${y}" x2="${endX}" y2="${y}"></line>
                `;
            }

            // 3. 绘制辅助刻度线与端点
            drawHtml += `
                <line class="geo-line-seg dashed-line" x1="${startX}" y1="${y - 45}" x2="${startX}" y2="${y + 45}"></line>
                <line class="geo-line-seg dashed-line" x1="${endX}" y1="${y - 45}" x2="${endX}" y2="${y + 45}"></line>
                <line class="geo-line-seg dashed-line" x1="${mX}" y1="${y - 10}" x2="${mX}" y2="${y + 45}"></line>
            `;

            // 4. 绘制括号和标签
            // 总括号 (在上方)
            drawHtml += `
                <path class="geo-brace-path" d="${getHorizontalBracePath(startX, endX, y - 25, true)}"></path>
                <text class="geo-label" x="${(startX + endX)/2}" y="${y - 42}" text-anchor="middle">总路程 S = ${dist.toFixed(0)} km</text>
            `;

            // 子路程括号 (在下方)
            drawHtml += `
                <path class="geo-brace-path" d="${getHorizontalBracePath(startX, mX, y + 20, false)}"></path>
                <text class="geo-label" style="fill: var(--segment-alpha);" x="${(startX + mX)/2}" y="${y + 48}" text-anchor="middle">甲路程: v₁t = ${v1.toFixed(0)} × t</text>
                
                <path class="geo-brace-path" d="${getHorizontalBracePath(mX, endX, y + 20, false)}"></path>
                <text class="geo-label" style="fill: var(--segment-beta);" x="${(mX + endX)/2}" y="${y + 48}" text-anchor="middle">乙路程: v₂t = ${v2.toFixed(0)} × t</text>
            `;

            // 5. 绘制小车标记
            drawHtml += drawRunner("甲", car1X, y - 12, "var(--segment-alpha)");
            drawHtml += drawRunner("乙", car2X, y - 12, "var(--segment-beta)");

            // 6. 绘制可拖动相遇把手
            drawHtml += drawSVGPoint("M", mX, y, "相遇点 M", { x: 0, y: -16 }, true);
            drawHtml += drawSVGPoint("Start", startX, y, "甲地", { x: -22, y: 16 }, false);
            drawHtml += drawSVGPoint("End", endX, y, "乙地", { x: 22, y: 16 }, false);
            drawHtml += drawModelFlowBadge(startX, y - 224, "相遇建模", "甲路程 + 乙路程 = 总路程", `${v1.toFixed(0)}x + ${v2.toFixed(0)}x = ${dist.toFixed(0)}`);
        }

        // ==========================================================================
        // 场景 2: 追及问题
        // ==========================================================================
        else if (currentScene === "chasing-problem") {
            const S = renderValues.chaseStartDist;
            const v1 = renderValues.chaseSpeed1;
            const v2 = renderValues.chaseSpeed2;

            const t_chase = S / (v1 - v2);
            const pxS = S * SCALE_PX;
            const pxTotal = (v1 * t_chase) * SCALE_PX;

            const startX = BASE_X;
            const y1 = BASE_Y - 58; // 甲路线 Y 坐标
            const y2 = BASE_Y + 58; // 乙路线 Y 坐标

            const chaseX = startX + pxTotal;
            const startX_乙 = startX + pxS;

            const curT = t_chase * progress;
            const pxCar1 = (v1 * curT) * SCALE_PX;
            const pxCar2 = (v2 * curT) * SCALE_PX;

            const car1X = startX + pxCar1;
            const car2X = startX_乙 + pxCar2;

            // 1. 关系色带：先把核心等量关系铺在底层，再叠加轨道和标记
            drawHtml += `
                <line class="relation-band relation-alpha" x1="${startX}" y1="${y1}" x2="${chaseX}" y2="${y1}"></line>
                <line class="relation-band relation-offset" x1="${startX}" y1="${BASE_Y}" x2="${startX_乙}" y2="${BASE_Y}"></line>
                <line class="relation-band relation-beta" x1="${startX_乙}" y1="${y2}" x2="${chaseX}" y2="${y2}"></line>
                <!-- 甲车轨道 -->
                <line class="geo-line-seg seg-base" x1="${startX}" y1="${y1}" x2="${chaseX}" y2="${y1}"></line>
                <!-- 乙车轨道 -->
                <line class="geo-line-seg seg-base" x1="${startX_乙}" y1="${y2}" x2="${chaseX}" y2="${y2}"></line>
            `;

            // 2. 运动轨迹绘制
            if (progress > 0.001) {
                drawHtml += `
                    <!-- 甲车轨迹线 -->
                    <line class="geo-line-seg seg-alpha" x1="${startX}" y1="${y1}" x2="${car1X}" y2="${y1}"></line>
                    <!-- 乙车轨迹线 -->
                    <line class="geo-line-seg seg-beta" x1="${startX_乙}" y1="${y2}" x2="${car2X}" y2="${y2}"></line>
                `;
            }

            // 3. 辅助剖分虚线
            drawHtml += `
                <line class="geo-line-seg dashed-line" x1="${startX}" y1="${y1 - 20}" x2="${startX}" y2="${y2 + 20}"></line>
                <line class="geo-line-seg dashed-line" x1="${startX_乙}" y1="${y1 - 20}" x2="${startX_乙}" y2="${y2 + 20}"></line>
                <line class="geo-line-seg dashed-line" x1="${chaseX}" y1="${y1 - 20}" x2="${chaseX}" y2="${y2 + 20}"></line>
            `;

            // 4. 括号和段标识
            // 甲总路程 (上方)
            drawHtml += `
                <path class="geo-brace-path" d="${getHorizontalBracePath(startX, chaseX, y1 - 20, true)}"></path>
                <text class="geo-label" style="fill: var(--segment-alpha);" x="${(startX + chaseX)/2}" y="${y1 - 46}" text-anchor="middle">甲行驶路程: v₁t = ${v1.toFixed(0)} × t</text>
            `;

            // 初始距离 S (下左上方)
            drawHtml += `
                <path class="geo-brace-path" d="${getHorizontalBracePath(startX, startX_乙, y2 - 20, true)}"></path>
                <text class="geo-label" style="fill: var(--segment-grey);" x="${(startX + startX_乙)/2}" y="${BASE_Y + 4}" text-anchor="middle">初始距离 S = ${S.toFixed(0)} km</text>
            `;

            // 乙行驶路程 (下右下方)
            drawHtml += `
                <path class="geo-brace-path" d="${getHorizontalBracePath(startX_乙, chaseX, y2 + 20, false)}"></path>
                <text class="geo-label" style="fill: var(--segment-beta);" x="${(startX_乙 + chaseX)/2}" y="${y2 + 42}" text-anchor="middle">乙行驶路程: v₂t = ${v2.toFixed(0)} × t</text>
            `;

            // 5. 绘制小车标记
            drawHtml += drawRunner("甲", car1X, y1 - 28, "var(--segment-alpha)");
            drawHtml += drawRunner("乙", car2X, y2 + 28, "var(--segment-beta)");

            // 6. 绘制可拖动起点与终点把手
            drawHtml += drawSVGPoint("S", startX_乙, y2, "乙起点", { x: 0, y: -20 }, true);
            drawHtml += drawSVGPoint("O", startX, y1, "甲起点", { x: -30, y: 24 }, false);
            drawHtml += drawSVGPoint("C", chaseX, y1, "追及点 C", { x: 26, y: -18 }, false);
            drawHtml += drawModelFlowBadge(startX, y1 - 188, "追及建模", "甲路程 - 乙路程 = 初始间隔", `${v1.toFixed(0)}x - ${v2.toFixed(0)}x = ${S.toFixed(0)}`);
        }

        // ==========================================================================
        // 场景 3: 和差倍与分配问题
        // ==========================================================================
        else if (currentScene === "ratio-problem") {
            // 倍数是离散的整数块，不能随动画插值。图形、方程和 HUD 均取同一份精确状态。
            const { W, k, b, coefficient, x, secondAmount } = getRatioModel();
            const blockScale = 1.35 * (SCALE_PX / 1.4); // 像素宽度比率
            const blockW = x * blockScale;
            const blockH = 34;

            const startX = BASE_X;
            
            // 甲条形图基准位置，乙条形图基准位置
            const y1_stacked = BASE_Y - 50;
            const y2_stacked = BASE_Y + 15;

            // 动画进度控制 Y 轴平移与 X 轴并排合并
            // progress = 0: 完全堆叠 (stacked)
            // progress = 1: 完全并排合并为单线段 (merged)
            const y1 = y1_stacked + progress * 50; // 合并到 Y = BASE_Y
            const y2 = y2_stacked - progress * 15; // 合并到 Y = BASE_Y

            // 1. 绘制甲的块 (1 个 x 块)
            drawHtml += `
                <rect class="geo-rect-block block-alpha" x="${startX}" y="${y1}" width="${blockW}" height="${blockH}"></rect>
                <text class="geo-label" style="fill: var(--segment-alpha);" x="${startX + blockW/2}" y="${y1 + blockH/2 + 5}" text-anchor="middle">甲 (x)</text>
            `;

            // 2. 乙由 k 个完整 x 块和一个独立的补差/减差块组成。
            for (let i = 0; i < k; i++) {
                // 合并时乙的每一块都整体右移一个 x，依次接在甲的 x 后面，不能相互重叠。
                const xStart = startX + (i + progress) * blockW;
                drawHtml += `
                    <rect class="geo-rect-block block-beta" x="${xStart}" y="${y2}" width="${blockW}" height="${blockH}"></rect>
                    <text class="geo-label" style="fill: var(--segment-beta);" x="${xStart + blockW/2}" y="${y2 + blockH/2 + 5}" text-anchor="middle">x</text>
                `;
            }

            // 3. b>0 是乙多出的补差段；b<0 是从乙末端扣除的减差段。
            const bWidth = Math.abs(b) * blockScale;
            if (Math.abs(b) > 0.01) {
                const betaStartX = startX + progress * blockW;
                const xStartB = b > 0
                    ? betaStartX + k * blockW
                    : betaStartX + k * blockW - bWidth;
                const blockClass = b > 0 ? "block-offset" : "block-offset block-offset-negative";
                const labelText = b > 0 ? `+${b.toFixed(0)}` : `-${Math.abs(b).toFixed(0)}`;
                const labelColor = b > 0 ? "var(--segment-offset)" : "#64748b";
                const labelY = b > 0 ? y2 + blockH / 2 + 4 : y2 - 8;

                drawHtml += `
                    <rect class="geo-rect-block ${blockClass}" x="${xStartB}" y="${y2}" width="${bWidth}" height="${blockH}"></rect>
                    <text class="geo-label" style="fill: ${labelColor}; font-size:11px;" x="${xStartB + bWidth/2}" y="${labelY}" text-anchor="middle">${labelText}</text>
                `;
            }

            // 4. 合并后再呈现总量括号；堆叠态不让总括号错误地跨越乙的单行。
            const totalWidth = W * blockScale;
            const endTotalX = startX + totalWidth;
            const braceY = y2 + blockH + 18;

            drawHtml += `
                <path class="geo-brace-path" style="opacity:${Math.max(0.18, progress)}" d="${getHorizontalBracePath(startX, endTotalX, braceY, false)}"></path>
                <text class="geo-label" style="opacity:${Math.max(0.38, progress)}" x="${(startX + endTotalX)/2}" y="${braceY + 28}" text-anchor="middle">合并总量 W = ${W.toFixed(0)}</text>
            `;

            // 在上方绘制表示未知数 x 的基本括号
            drawHtml += `
                <path class="geo-brace-path" d="${getHorizontalBracePath(startX, startX + blockW, y1 - 10, true)}"></path>
                <text class="geo-label" x="${startX + blockW/2}" y="${y1 - 25}" text-anchor="middle">x = ${formatRatioNumber(x)}</text>
            `;

            // 乙的整体侧面标签
            if (progress < 0.2) {
                const y2_mid = y2 + blockH / 2;
                drawHtml += `
                    <text class="geo-label" style="fill: var(--segment-beta);" x="${startX - 15}" y="${y2_mid + 5}" text-anchor="end">乙 : ${formatRatioTerm(k, b)} = ${formatRatioNumber(secondAmount)}</text>
                `;
            }
            const combinedEquation = b === 0
                ? `${coefficient}x = ${W.toFixed(0)}`
                : `${coefficient}x ${b > 0 ? "+" : "-"} ${Math.abs(b).toFixed(0)} = ${W.toFixed(0)}`;
            drawHtml += drawModelFlowBadge(startX, BASE_Y - 200, "和差倍建模", "甲数量 + 乙数量 = 总量", `x + (${formatRatioTerm(k, b)}) = ${W.toFixed(0)}，${combinedEquation}`);
        }

        sandboxSvg.innerHTML = drawHtml;
    }

    // ==========================================================================
    // 7. HUD 板书算式更新
    // ==========================================================================
    function updateChalkboardHUD() {
        let html = "";

        if (currentScene === "meeting-problem") {
            const S = meetDistance;
            const v1 = meetSpeed1;
            const v2 = meetSpeed2;
            const t = S / (v1 + v2);

            html = `
                <div class="hud-question-box compact">
                    <strong>相遇问题</strong><span>两车相向，路程相加。</span>
                </div>
                <div class="hud-known-grid">
                    <div><span>总路程 S</span><strong>${S.toFixed(0)} km</strong></div>
                    <div><span>甲速度 v₁</span><strong>${v1.toFixed(0)} km/h</strong></div>
                    <div><span>乙速度 v₂</span><strong>${v2.toFixed(0)} km/h</strong></div>
                </div>
                <div class="hud-row relation-row">
                    <div class="hud-row-label">等量关系</div>
                    <div class="hud-row-val">甲路程 + 乙路程 = 总路程</div>
                </div>
                <div class="teaching-steps">
                    <span>读题</span><span>画线段</span><span>找等量</span><span>列方程</span>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">列方程并求解</div>
                    <div class="formula">
                        <div><span class="math-seg seg-alpha" data-highlight="alpha">${v1.toFixed(0)}x</span> + <span class="math-seg seg-beta" data-highlight="beta">${v2.toFixed(0)}x</span> = <span class="math-seg seg-grey" data-highlight="grey">${S.toFixed(0)}</span></div>
                        <div>${(v1 + v2).toFixed(0)}x = ${S.toFixed(0)}，x = <span class="highlight">${t.toFixed(2)} 小时</span></div>
                        <div class="formula-check">检验：${(v1 * t).toFixed(0)} + ${(v2 * t).toFixed(0)} = ${S.toFixed(0)}</div>
                    </div>
                </div>
            `;
        } else if (currentScene === "chasing-problem") {
            const S = chaseStartDist;
            const v1 = chaseSpeed1;
            const v2 = chaseSpeed2;
            const t = S / (v1 - v2);

            html = `
                <div class="hud-question-box compact">
                    <strong>追及问题</strong><span>同向追赶，多走的路程就是间隔。</span>
                </div>
                <div class="hud-known-grid">
                    <div><span>初始间隔 S</span><strong>${S.toFixed(0)} km</strong></div>
                    <div><span>甲速度 v₁</span><strong>${v1.toFixed(0)} km/h</strong></div>
                    <div><span>乙速度 v₂</span><strong>${v2.toFixed(0)} km/h</strong></div>
                </div>
                <div class="hud-row relation-row">
                    <div class="hud-row-label">等量关系</div>
                    <div class="hud-row-val">甲路程 - 乙路程 = 初始间隔</div>
                </div>
                <div class="teaching-steps">
                    <span>读题</span><span>画线段</span><span>找等量</span><span>列方程</span>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">列方程并求解</div>
                    <div class="formula">
                        <div><span class="math-seg seg-alpha" data-highlight="alpha">${v1.toFixed(0)}x</span> - <span class="math-seg seg-beta" data-highlight="beta">${v2.toFixed(0)}x</span> = <span class="math-seg seg-grey" data-highlight="grey">${S.toFixed(0)}</span></div>
                        <div>${(v1 - v2).toFixed(0)}x = ${S.toFixed(0)}，x = <span class="highlight">${t.toFixed(2)} 小时</span></div>
                        <div class="formula-check">检验：${(v1 * t).toFixed(0)} - ${(v2 * t).toFixed(0)} = ${S.toFixed(0)}</div>
                    </div>
                </div>
            `;
        } else if (currentScene === "ratio-problem") {
            const { W, k, b, coefficient, x, secondAmount } = getRatioModel();
            const offsetTerm = b === 0 ? "" : ` ${b > 0 ? "+" : "-"} ${Math.abs(b).toFixed(0)}`;

            html = `
                <div class="hud-question-box compact">
                    <strong>和差倍与分配</strong><span>先设甲为 x，乙由 k 份 x 和补差 b 组成。</span>
                </div>
                <div class="hud-known-grid">
                    <div><span>总量 W</span><strong>${W.toFixed(0)} 本</strong></div>
                    <div><span>乙含 x 块</span><strong>${k} 份</strong></div>
                    <div><span>偏移 b</span><strong>${b >= 0 ? '+' : ''}${b.toFixed(0)} 本</strong></div>
                </div>
                <div class="hud-row relation-row">
                    <div class="hud-row-label">等量关系</div>
                    <div class="hud-row-val">甲数量 + 乙数量 = 总量</div>
                </div>
                <div class="teaching-steps">
                    <span>读题</span><span>画条形</span><span>合并</span><span>列方程</span>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">列方程并求解</div>
                    <div class="formula">
                        <div><span class="math-seg seg-alpha" data-highlight="alpha">x</span> + (<span class="math-seg seg-beta" data-highlight="beta">${k}x</span><span class="math-seg seg-offset" data-highlight="offset">${offsetTerm}</span>) = <span class="math-seg seg-grey" data-highlight="grey">${W.toFixed(0)}</span></div>
                        <div>(1 + ${k})x = ${coefficient}x = ${(W - b).toFixed(0)}</div>
                        <div>x = <span class="highlight">${formatRatioNumber(x)} 本</span>，乙 = ${formatRatioNumber(secondAmount)} 本</div>
                        <div class="formula-check">检验：${formatRatioNumber(x)} + ${formatRatioNumber(secondAmount)} = ${W.toFixed(0)}</div>
                    </div>
                </div>
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 右侧滑块生成器与卡片更新
    // ==========================================================================
    function loadSlidersForScene() {
        let html = "";
        if (currentScene === "meeting-problem") {
            html = `
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">总路程 S</span>
                        <span class="slider-val-indicator" id="val-meet-dist">${meetDistance} km</span>
                    </div>
                    <input type="range" id="slider-meet-dist" min="150" max="600" step="10" value="${meetDistance}">
                </div>
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">甲速度 v₁</span>
                        <span class="slider-val-indicator" id="val-meet-v1">${meetSpeed1} km/h</span>
                    </div>
                    <input type="range" id="slider-meet-v1" min="20" max="120" step="5" value="${meetSpeed1}">
                </div>
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">乙速度 v₂</span>
                        <span class="slider-val-indicator" id="val-meet-v2">${meetSpeed2} km/h</span>
                    </div>
                    <input type="range" id="slider-meet-v2" min="20" max="120" step="5" value="${meetSpeed2}">
                </div>
            `;
        } else if (currentScene === "chasing-problem") {
            html = `
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">初始间隔 S</span>
                        <span class="slider-val-indicator" id="val-chase-dist">${chaseStartDist} km</span>
                    </div>
                    <input type="range" id="slider-chase-dist" min="40" max="200" step="10" value="${chaseStartDist}">
                </div>
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">甲速度 v₁</span>
                        <span class="slider-val-indicator" id="val-chase-v1">${chaseSpeed1} km/h</span>
                    </div>
                    <input type="range" id="slider-chase-v1" min="50" max="150" step="5" value="${chaseSpeed1}">
                </div>
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">乙速度 v₂</span>
                        <span class="slider-val-indicator" id="val-chase-v2">${chaseSpeed2} km/h</span>
                    </div>
                    <input type="range" id="slider-chase-v2" min="20" max="100" step="5" value="${chaseSpeed2}">
                </div>
            `;
        } else if (currentScene === "ratio-problem") {
            html = `
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">总量 W</span>
                        <span class="slider-val-indicator" id="val-ratio-w">${ratioW} 本</span>
                    </div>
                    <input type="range" id="slider-ratio-w" min="40" max="250" step="5" value="${ratioW}">
                </div>
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">乙的倍数 k</span>
                        <span class="slider-val-indicator" id="val-ratio-k">${ratioK} 份 x</span>
                    </div>
                    <input type="range" id="slider-ratio-k" min="2" max="5" step="1" value="${ratioK}">
                </div>
                <div class="slider-row">
                    <div class="slider-head">
                        <span class="slider-label">偏移 b</span>
                        <span class="slider-val-indicator" id="val-ratio-b">${ratioB >= 0 ? '+' : ''}${ratioB} 本</span>
                    </div>
                    <input type="range" id="slider-ratio-b" min="-30" max="30" step="5" value="${ratioB}">
                </div>
            `;
        }

        slidersContainer.innerHTML = html;
        bindSliderEvents();
        updateAllRangeFills();
    }

    function updateRangeFill(input) {
        if (!input) return;
        const min = parseFloat(input.min || "0");
        const max = parseFloat(input.max || "100");
        const value = parseFloat(input.value || "0");
        const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
        input.style.setProperty("--range-pct", `${Math.min(100, Math.max(0, pct))}%`);
    }

    function updateAllRangeFills() {
        document.querySelectorAll('input[type="range"]').forEach(updateRangeFill);
    }

    function bindSliderEvents() {
        if (currentScene === "meeting-problem") {
            const sMeetDist = document.getElementById("slider-meet-dist");
            const sMeetV1 = document.getElementById("slider-meet-v1");
            const sMeetV2 = document.getElementById("slider-meet-v2");

            sMeetDist.addEventListener("input", (e) => {
                meetDistance = parseFloat(e.target.value);
                snapMeetingParameters("dist");
                updateSliderTextIndicators();
            });
            sMeetV1.addEventListener("input", (e) => {
                meetSpeed1 = parseFloat(e.target.value);
                snapMeetingParameters("speed1");
                updateSliderTextIndicators();
            });
            sMeetV2.addEventListener("input", (e) => {
                meetSpeed2 = parseFloat(e.target.value);
                snapMeetingParameters("speed2");
                updateSliderTextIndicators();
            });
        } else if (currentScene === "chasing-problem") {
            const sChaseDist = document.getElementById("slider-chase-dist");
            const sChaseV1 = document.getElementById("slider-chase-v1");
            const sChaseV2 = document.getElementById("slider-chase-v2");

            sChaseDist.addEventListener("input", (e) => {
                chaseStartDist = parseFloat(e.target.value);
                snapChasingParameters("dist");
                updateSliderTextIndicators();
            });
            sChaseV1.addEventListener("input", (e) => {
                chaseSpeed1 = parseFloat(e.target.value);
                snapChasingParameters("speed1");
                updateSliderTextIndicators();
            });
            sChaseV2.addEventListener("input", (e) => {
                chaseSpeed2 = parseFloat(e.target.value);
                snapChasingParameters("speed2");
                updateSliderTextIndicators();
            });
        } else if (currentScene === "ratio-problem") {
            const sRatioW = document.getElementById("slider-ratio-w");
            const sRatioK = document.getElementById("slider-ratio-k");
            const sRatioB = document.getElementById("slider-ratio-b");

            sRatioW.addEventListener("input", (e) => {
                ratioW = parseFloat(e.target.value);
                snapRatioParameters();
                updateSliderTextIndicators();
            });
            sRatioK.addEventListener("input", (e) => {
                ratioK = parseInt(e.target.value);
                snapRatioParameters();
                updateSliderTextIndicators();
            });
            sRatioB.addEventListener("input", (e) => {
                ratioB = parseFloat(e.target.value);
                snapRatioParameters();
                updateSliderTextIndicators();
            });
        }
    }

    function updateSliderTextIndicators() {
        if (currentScene === "meeting-problem") {
            document.getElementById("slider-meet-dist").value = meetDistance;
            document.getElementById("val-meet-dist").textContent = meetDistance.toFixed(0) + " km";
            document.getElementById("slider-meet-v1").value = meetSpeed1;
            document.getElementById("val-meet-v1").textContent = meetSpeed1.toFixed(0) + " km/h";
            document.getElementById("slider-meet-v2").value = meetSpeed2;
            document.getElementById("val-meet-v2").textContent = meetSpeed2.toFixed(0) + " km/h";
        } else if (currentScene === "chasing-problem") {
            document.getElementById("slider-chase-dist").value = chaseStartDist;
            document.getElementById("val-chase-dist").textContent = chaseStartDist.toFixed(0) + " km";
            document.getElementById("slider-chase-v1").value = chaseSpeed1;
            document.getElementById("val-chase-v1").textContent = chaseSpeed1.toFixed(0) + " km/h";
            document.getElementById("slider-chase-v2").value = chaseSpeed2;
            document.getElementById("val-chase-v2").textContent = chaseSpeed2.toFixed(0) + " km/h";
        } else if (currentScene === "ratio-problem") {
            document.getElementById("slider-ratio-w").value = ratioW;
            document.getElementById("val-ratio-w").textContent = ratioW.toFixed(0) + " 本";
            document.getElementById("slider-ratio-k").value = ratioK;
            document.getElementById("val-ratio-k").textContent = ratioK.toFixed(0) + " 份 x";
            document.getElementById("slider-ratio-b").value = ratioB;
            document.getElementById("val-ratio-b").textContent = (ratioB >= 0 ? '+' : '') + ratioB.toFixed(0) + " 本";
        }
        updateAllRangeFills();
    }

    function loadPresetsForScene() {
        if (currentScene === "meeting-problem") {
            presetButtonsContainer.innerHTML = `
                <button class="btn-secondary flex-btn btn-app-preset" data-preset="meet-easy" style="padding:10px 4px; font-size:11px;">相向而行 (t=3小时)</button>
                <button class="btn-secondary flex-btn btn-app-preset" data-preset="meet-fast" style="padding:10px 4px; font-size:11px;">特快与慢车 (t=2.5h)</button>
            `;
            btnToggleMotion.querySelector("span").textContent = "开始运动模拟";
            document.getElementById("section-motion-controls").style.display = "block";
        } else if (currentScene === "chasing-problem") {
            presetButtonsContainer.innerHTML = `
                <button class="btn-secondary flex-btn btn-app-preset" data-preset="chase-easy" style="padding:10px 4px; font-size:11px;">同向追及 (t=2小时)</button>
                <button class="btn-secondary flex-btn btn-app-preset" data-preset="chase-hard" style="padding:10px 4px; font-size:11px;">长距缓追 (t=4小时)</button>
            `;
            btnToggleMotion.querySelector("span").textContent = "开始运动模拟";
            document.getElementById("section-motion-controls").style.display = "block";
        } else if (currentScene === "ratio-problem") {
            presetButtonsContainer.innerHTML = `
                <button class="btn-secondary flex-btn btn-app-preset" data-preset="ratio-sum-easy" style="padding:10px 4px; font-size:11px;">和倍问题 (k=2, b=10)</button>
                <button class="btn-secondary flex-btn btn-app-preset" data-preset="ratio-diff" style="padding:10px 4px; font-size:11px;">差倍分配 (k=3, b=-20)</button>
            `;
            btnToggleMotion.querySelector("span").textContent = "开始并排合并";
            document.getElementById("section-motion-controls").style.display = "block";
        }

        document.querySelectorAll(".btn-app-preset").forEach(btn => {
            btn.addEventListener("click", () => {
                const pr = btn.getAttribute("data-preset");
                triggerPreset(pr);
            });
        });
    }

    function triggerPreset(presetName) {
        if (presetName === "meet-easy") {
            meetDistance = 360;
            meetSpeed1 = 70;
            meetSpeed2 = 50; // t = 3.0h
        } else if (presetName === "meet-fast") {
            meetDistance = 300;
            meetSpeed1 = 80;
            meetSpeed2 = 40; // t = 2.5h
        } else if (presetName === "chase-easy") {
            chaseStartDist = 80;
            chaseSpeed1 = 80;
            chaseSpeed2 = 40; // t = 2.0h
        } else if (presetName === "chase-hard") {
            chaseStartDist = 120;
            chaseSpeed1 = 70;
            chaseSpeed2 = 40; // t = 4.0h
        } else if (presetName === "ratio-sum-easy") {
            ratioW = 100;
            ratioK = 2;
            ratioB = 10; // x = 30
        } else if (presetName === "ratio-diff") {
            ratioW = 140;
            ratioK = 3;
            ratioB = -20; // x = 40
        }
        updateSliderTextIndicators();
        animationProgress = 0.0;
        sliderTimeline.value = 0;
        valTimeline.textContent = "0%";
        updateRangeFill(sliderTimeline);
    }

    function updateTheoryContent() {
        if (currentScene === "meeting-problem") {
            theoryTitle.innerHTML = "💡 相遇问题建模流程";
            theoryText.innerHTML = `
                <div class="teaching-flow-card">
                    <div class="teaching-flow-step"><b>1 读题</b><span>相向而行，同一时间相遇。</span></div>
                    <div class="teaching-flow-step"><b>2 画线段</b><span>甲、乙两段从两端向中间填满。</span></div>
                    <div class="teaching-flow-step"><b>3 找等量</b><span>甲路程 + 乙路程 = 总路程。</span></div>
                    <div class="teaching-flow-step"><b>4 列方程</b><span>v₁x + v₂x = S。</span></div>
                </div>
            `;
        } else if (currentScene === "chasing-problem") {
            theoryTitle.innerHTML = "💡 追及问题建模流程";
            theoryText.innerHTML = `
                <div class="teaching-flow-card">
                    <div class="teaching-flow-step"><b>1 读题</b><span>甲在后、乙在前，同时同向。</span></div>
                    <div class="teaching-flow-step"><b>2 画线段</b><span>甲的总路程覆盖乙路程和初始间隔。</span></div>
                    <div class="teaching-flow-step"><b>3 找等量</b><span>甲路程 - 乙路程 = 初始间隔。</span></div>
                    <div class="teaching-flow-step"><b>4 列方程</b><span>v₁x - v₂x = S。</span></div>
                </div>
            `;
        } else if (currentScene === "ratio-problem") {
            theoryTitle.innerHTML = "💡 和差倍分配建模流程";
            theoryText.innerHTML = `
                <div class="teaching-flow-card">
                    <div class="teaching-flow-step"><b>1 设一份</b><span>把较小量或基础量设为 x。</span></div>
                    <div class="teaching-flow-step"><b>2 画条形</b><span>用倍数块和补差块表示另一个量。</span></div>
                    <div class="teaching-flow-step"><b>3 合并</b><span>把所有部分拼成总量 W。</span></div>
                    <div class="teaching-flow-step"><b>4 列方程</b><span>x + (kx + b) = W。</span></div>
                </div>
            `;
        }
    }

    // ==========================================================================
    // 9. LERP 渲染循环与时钟运动
    // ==========================================================================
    function updateLerp() {
        const k = 0.16;

        renderValues.meetDistance += (meetDistance - renderValues.meetDistance) * k;
        renderValues.meetSpeed1 += (meetSpeed1 - renderValues.meetSpeed1) * k;
        renderValues.meetSpeed2 += (meetSpeed2 - renderValues.meetSpeed2) * k;

        renderValues.chaseStartDist += (chaseStartDist - renderValues.chaseStartDist) * k;
        renderValues.chaseSpeed1 += (chaseSpeed1 - renderValues.chaseSpeed1) * k;
        renderValues.chaseSpeed2 += (chaseSpeed2 - renderValues.chaseSpeed2) * k;

        renderValues.ratioW += (ratioW - renderValues.ratioW) * k;
        renderValues.ratioK += (ratioK - renderValues.ratioK) * k;
        renderValues.ratioB += (ratioB - renderValues.ratioB) * k;

        // 运动时钟更新
        if (isAnimating) {
            animationProgress += 0.007; // 动画速率
            if (animationProgress >= 1.0) {
                animationProgress = 1.0;
                isAnimating = false;
                btnToggleMotion.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
                    <span>重新模拟</span>
                `;

                // 终点散花粒子效果
                const rect = sandboxSvg.getBoundingClientRect();
                if (currentScene === "meeting-problem") {
                    const t = meetDistance / (meetSpeed1 + meetSpeed2);
                    const mX = BASE_X + (meetSpeed1 * t) * SCALE_PX;
                    spawnExplosion(rect.left + mX * zoomScale, rect.top + BASE_Y * zoomScale, "var(--segment-alpha)");
                } else if (currentScene === "chasing-problem") {
                    const t = chaseStartDist / (chaseSpeed1 - chaseSpeed2);
                    const cX = BASE_X + (chaseSpeed1 * t) * SCALE_PX;
                    spawnExplosion(rect.left + cX * zoomScale, rect.top + (BASE_Y - 40) * zoomScale, "var(--segment-beta)");
                } else if (currentScene === "ratio-problem") {
                    const totalWidth = ratioW * 1.35;
                    const cX = BASE_X + totalWidth;
                    spawnExplosion(rect.left + cX * zoomScale, rect.top + (BASE_Y + 15) * zoomScale, "var(--segment-offset)");
                }
            }
            sliderTimeline.value = (animationProgress * 100).toFixed(0);
            valTimeline.textContent = (animationProgress * 100).toFixed(0) + "%";
            updateRangeFill(sliderTimeline);
        }

        renderValues.animationProgress += (animationProgress - renderValues.animationProgress) * 0.25;

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

    // ==========================================================================
    // 10. HTML 飘浮读数渲染
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        let overlayHtml = "";

        // 当动画未播放完或在自由调整时，显示浮动路程值
        if (renderValues.animationProgress < 0.05) {
            if (currentScene === "meeting-problem") {
                const dist = renderValues.meetDistance;
                const v1 = renderValues.meetSpeed1;
                const v2 = renderValues.meetSpeed2;
                const t = dist / (v1 + v2);

                const s1X = BASE_X + (v1 * t * SCALE_PX) / 2;
                const s2X = BASE_X + (v1 * t * SCALE_PX) + (v2 * t * SCALE_PX) / 2;

                overlayHtml += `
                    <div class="brace-label lbl-alpha" style="left:${s1X}px; top:${BASE_Y + 82}px">甲路程: ${(v1 * t).toFixed(0)} km</div>
                    <div class="brace-label lbl-beta" style="left:${s2X}px; top:${BASE_Y + 82}px">乙路程: ${(v2 * t).toFixed(0)} km</div>
                `;
            } else if (currentScene === "chasing-problem") {
                const S = renderValues.chaseStartDist;
                const v1 = renderValues.chaseSpeed1;
                const v2 = renderValues.chaseSpeed2;
                const t = S / (v1 - v2);

                const s1X = BASE_X + (v1 * t * SCALE_PX) / 2;
                const s2X = BASE_X + S * SCALE_PX + (v2 * t * SCALE_PX) / 2;

                overlayHtml += `
                    <div class="brace-label lbl-alpha" style="left:${s1X}px; top:${BASE_Y - 78}px; border-left:3px solid var(--segment-alpha);">甲总路程: ${(v1 * t).toFixed(0)} km</div>
                    <div class="brace-label lbl-beta" style="left:${s2X}px; top:${BASE_Y + 132}px; border-left:3px solid var(--segment-beta);">乙行驶: ${(v2 * t).toFixed(0)} km</div>
                `;
            }
        }

        htmlOverlay.innerHTML = overlayHtml;
        updateChalkboardHUD();
    }

    // ==========================================================================
    // 11. 手势与鼠标拖动线段端点
    // ==========================================================================
    function getModelSpanUnits() {
        if (currentScene === "meeting-problem") {
            return Math.max(180, meetDistance);
        }
        if (currentScene === "chasing-problem") {
            const speedGap = Math.max(1, chaseSpeed1 - chaseSpeed2);
            const t = chaseStartDist / speedGap;
            return Math.max(120, chaseSpeed1 * t);
        }
        return Math.max(80, ratioW);
    }

    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        zoomScale = 1.0;
        panX = 0;
        panY = 0;

        // 动态右偏起跑线 BASE_X：HUD 展开时让位，收起时尽量用满模拟框
        const isDesktop = W > 800;
        const baseMargin = isDesktop ? (isHudExpanded ? Math.min(390, W * 0.4) : Math.max(72, W * 0.08)) : 42;
        if (isDesktop) {
            BASE_X = baseMargin;
        } else {
            BASE_X = baseMargin;
        }
        BASE_Y = H / 2;

        // 按当前题型的真实跨度适配比例尺，避免默认图形偏小
        const modelSpan = getModelSpanUnits();
        const availableWidth = Math.max(260, W - BASE_X - 72);
        const maxScale = currentScene === "chasing-problem" ? 3.2 : 2.08;
        SCALE_PX = Math.min(maxScale, Math.max(0.42, availableWidth / modelSpan));

        if (!isHudExpanded) {
            const modelWidth = modelSpan * SCALE_PX;
            BASE_X = Math.max(baseMargin, (W - modelWidth) / 2);
        }

        updateTransform();
    }

    function updateTransform() {
        sandboxSvg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        htmlOverlay.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    }

    function clampZoom(value) {
        return Math.min(3.2, Math.max(0.42, value));
    }

    function setZoomAtClientPoint(nextZoom, clientX, clientY) {
        const rect = sandboxWrapper.getBoundingClientRect();
        const oldZoom = zoomScale;
        const newZoom = clampZoom(nextZoom);
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        const contentX = (localX - panX) / oldZoom;
        const contentY = (localY - panY) / oldZoom;

        zoomScale = newZoom;
        panX = localX - contentX * newZoom;
        panY = localY - contentY * newZoom;
        updateTransform();
    }

    function getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    function getTouchDistance(touches) {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }

    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        setZoomAtClientPoint(zoomScale * factor, e.clientX, e.clientY);
    }, { passive: false });

    sandboxWrapper.addEventListener("mousedown", (e) => {
        const ptWrapper = e.target.closest(".geo-point-wrapper");
        if (ptWrapper) {
            const ptId = ptWrapper.getAttribute("data-point-id");
            if (["M", "S"].includes(ptId)) {
                activeDragNode = ptId;
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
        if (activeDragNode) {
            const rect = sandboxSvg.getBoundingClientRect();
            const localX = (e.clientX - rect.left) / zoomScale;

            if (activeDragNode === "M" && currentScene === "meeting-problem") {
                // 拖动相遇点，改变两车路程分配，重算速度比率
                let pxOffset = localX - BASE_X;
                pxOffset = Math.min(meetDistance * SCALE_PX - 20, Math.max(20, pxOffset));

                const t = meetDistance / (meetSpeed1 + meetSpeed2);
                let newV1 = Math.round((pxOffset / SCALE_PX) / t);
                newV1 = Math.min(120, Math.max(20, newV1));

                meetSpeed1 = newV1;
                snapMeetingParameters("speed1");
                updateSliderTextIndicators();
            } else if (activeDragNode === "S" && currentScene === "chasing-problem") {
                // 拖动乙起点，改变初始距离 S
                let pxOffset = localX - BASE_X;
                let newS = Math.round(pxOffset / SCALE_PX);
                newS = Math.min(200, Math.max(40, newS));

                chaseStartDist = newS;
                snapChasingParameters("dist");
                updateSliderTextIndicators();
            }
            return;
        }

        if (isPanning) {
            panX = e.clientX - startPanX;
            panY = e.clientY - startPanY;
            updateTransform();
        }
    });

    window.addEventListener("mouseup", () => {
        activeDragNode = null;
        if (isPanning) {
            isPanning = false;
            sandboxWrapper.classList.remove("panning");
        }
    });

    // 移动手势
    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            activeDragNode = null;
            isPanning = false;
            isTouchDraggingPoint = false;
            touchPanStarted = false;
            sandboxWrapper.classList.remove("panning");
            lastPinchDistance = getTouchDistance(e.touches);
            e.preventDefault();
            return;
        }

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                if (["M", "S"].includes(ptId)) {
                    activeDragNode = ptId;
                    isTouchDraggingPoint = true;
                    isPanning = false;
                    touchPanStarted = false;
                    sandboxWrapper.classList.remove("panning");
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
            }
            isTouchDraggingPoint = false;
            isPanning = true;
            touchPanStarted = false;
            touchStartClientX = touch.clientX;
            touchStartClientY = touch.clientY;
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
        }
    });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2) {
            const distance = getTouchDistance(e.touches);
            if (lastPinchDistance > 0) {
                const center = getTouchCenter(e.touches);
                setZoomAtClientPoint(zoomScale * (distance / lastPinchDistance), center.x, center.y);
            }
            lastPinchDistance = distance;
            e.preventDefault();
            return;
        }

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (activeDragNode) {
                const rect = sandboxSvg.getBoundingClientRect();
                const localX = (touch.clientX - rect.left) / zoomScale;

                if (activeDragNode === "M" && currentScene === "meeting-problem") {
                    let pxOffset = localX - BASE_X;
                    pxOffset = Math.min(meetDistance * SCALE_PX - 20, Math.max(20, pxOffset));
                    const t = meetDistance / (meetSpeed1 + meetSpeed2);
                    let newV1 = Math.round((pxOffset / SCALE_PX) / t);
                    newV1 = Math.min(120, Math.max(20, newV1));
                    meetSpeed1 = newV1;
                    snapMeetingParameters("speed1");
                    updateSliderTextIndicators();
                } else if (activeDragNode === "S" && currentScene === "chasing-problem") {
                    let pxOffset = localX - BASE_X;
                    let newS = Math.round(pxOffset / SCALE_PX);
                    newS = Math.min(200, Math.max(40, newS));
                    chaseStartDist = newS;
                    snapChasingParameters("dist");
                    updateSliderTextIndicators();
                }
                e.preventDefault();
            } else if (isPanning && !isTouchDraggingPoint) {
                if (!touchPanStarted) {
                    const dx = touch.clientX - touchStartClientX;
                    const dy = touch.clientY - touchStartClientY;
                    if (Math.hypot(dx, dy) < TOUCH_PAN_THRESHOLD) {
                        e.preventDefault();
                        return;
                    }
                    touchPanStarted = true;
                    sandboxWrapper.classList.add("panning");
                }
                panX = touch.clientX - startPanX;
                panY = touch.clientY - startPanY;
                updateTransform();
                e.preventDefault();
            }
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchend", () => {
        activeDragNode = null;
        isPanning = false;
        isTouchDraggingPoint = false;
        touchPanStarted = false;
        lastPinchDistance = 0;
        sandboxWrapper.classList.remove("panning");
    });

    sandboxWrapper.addEventListener("touchcancel", () => {
        activeDragNode = null;
        isPanning = false;
        isTouchDraggingPoint = false;
        touchPanStarted = false;
        lastPinchDistance = 0;
        sandboxWrapper.classList.remove("panning");
    });

    // ==========================================================================
    // 12. HUD Hover 联动高亮
    // ==========================================================================
    function highlightSVGLine(tag, active) {
        if (tag === "alpha") {
            const el = document.querySelector(".geo-line-seg.seg-alpha, .geo-rect-block.block-alpha");
            if (el) {
                if (active) el.classList.add("active-glow");
                else el.classList.remove("active-glow");
            }
        } else if (tag === "beta") {
            const el = document.querySelector(".geo-line-seg.seg-beta, .geo-rect-block.block-beta");
            if (el) {
                if (active) el.classList.add("active-glow");
                else el.classList.remove("active-glow");
            }
        } else if (tag === "offset") {
            const el = document.querySelector(".geo-rect-block.block-offset");
            if (el) {
                if (active) el.classList.add("active-glow");
                else el.classList.remove("active-glow");
            }
        } else if (tag === "grey") {
            const el = document.querySelector(".geo-line-seg.seg-grey");
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
            if (highlight) highlightSVGLine(highlight, true);
        }
    });

    stepsChalkboard.addEventListener("mouseout", (e) => {
        const mathSeg = e.target.closest(".math-seg");
        if (mathSeg) {
            const highlight = mathSeg.getAttribute("data-highlight");
            if (highlight) highlightSVGLine(highlight, false);
        }
    });

    // ==========================================================================
    // 13. 场景切换与初始化
    // ==========================================================================
    function loadScene(scene) {
        currentScene = scene;
        isAnimating = false;
        animationProgress = 0.0;

        sliderTimeline.value = 0;
        valTimeline.textContent = "0%";
        updateRangeFill(sliderTimeline);

        btnToggleMotion.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
            <span>开始运动模拟</span>
        `;

        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === scene) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        loadSlidersForScene();
        loadPresetsForScene();
        updateTheoryContent();
        centerModel();
    }

    function resetApp() {
        meetDistance = 360;
        meetSpeed1 = 70;
        meetSpeed2 = 50;

        chaseStartDist = 80;
        chaseSpeed1 = 80;
        chaseSpeed2 = 40;

        ratioW = 100;
        ratioK = 2;
        ratioB = 10;

        animationProgress = 0.0;
        isAnimating = false;

        loadScene(currentScene);
    }

    // ==========================================================================
    // 14. 页面按钮与交互动作绑定
    // ==========================================================================
    btnToggleMotion.addEventListener("click", () => {
        if (animationProgress >= 0.99) {
            animationProgress = 0.0;
            sliderTimeline.value = 0;
            valTimeline.textContent = "0%";
            updateRangeFill(sliderTimeline);
        }

        isAnimating = !isAnimating;
        if (isAnimating) {
            const word = currentScene === "ratio-problem" ? "并排合并" : "运动模拟";
            btnToggleMotion.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z"/></svg>
                <span>暂停${word}</span>
            `;
        } else {
            const word = currentScene === "ratio-problem" ? "并排合并" : "运动模拟";
            btnToggleMotion.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
                <span>开始${word}</span>
            `;
        }
    });

    btnResetMotion.addEventListener("click", () => {
        isAnimating = false;
        animationProgress = 0.0;
        sliderTimeline.value = 0;
        valTimeline.textContent = "0%";
        updateRangeFill(sliderTimeline);
        const word = currentScene === "ratio-problem" ? "并排合并" : "运动模拟";
        btnToggleMotion.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
            <span>开始${word}</span>
        `;
    });

    sliderTimeline.addEventListener("input", (e) => {
        isAnimating = false;
        animationProgress = parseFloat(e.target.value) / 100;
        valTimeline.textContent = e.target.value + "%";
        updateRangeFill(sliderTimeline);
        const word = currentScene === "ratio-problem" ? "并排合并" : "运动模拟";
        btnToggleMotion.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
            <span>开始${word}</span>
        `;
    });

    btnToggleSnap.addEventListener("click", () => {
        isSnappingEnabled = !isSnappingEnabled;
        if (isSnappingEnabled) {
            btnToggleSnap.classList.add("active");
            btnToggleSnap.querySelector("span").textContent = "已开启整数解吸附";
            // 立即触发一次吸附校准
            if (currentScene === "meeting-problem") snapMeetingParameters("dist");
            else if (currentScene === "chasing-problem") snapChasingParameters("dist");
            else if (currentScene === "ratio-problem") snapRatioParameters();
            updateSliderTextIndicators();
        } else {
            btnToggleSnap.classList.remove("active");
            btnToggleSnap.querySelector("span").textContent = "开启整数解吸附";
        }
    });

    btnResetApp.addEventListener("click", resetApp);
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

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const sc = btn.getAttribute("data-scene");
            loadScene(sc);
        });
    });

    // 暴露状态接口
    window.appState = {
        get currentScene() { return currentScene; },
        get renderValues() {
            return {
                meetDistance: renderValues.meetDistance,
                meetSpeed1: renderValues.meetSpeed1,
                meetSpeed2: renderValues.meetSpeed2,
                chaseStartDist: renderValues.chaseStartDist,
                chaseSpeed1: renderValues.chaseSpeed1,
                chaseSpeed2: renderValues.chaseSpeed2,
                ratioW: renderValues.ratioW,
                ratioK: renderValues.ratioK,
                ratioB: renderValues.ratioB,
                animationProgress: renderValues.animationProgress
            };
        },
        loadScene,
        triggerPreset,
        resetApp
    };

    if (hudPanel) hudPanel.classList.add("collapsed");
    resetApp();
});

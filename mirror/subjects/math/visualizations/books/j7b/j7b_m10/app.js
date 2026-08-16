/**
 * 优化升级版点到直线距离与垂线段 - 课件交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态与参数
    // ==========================================================================
    let currentScene = "radar-sweep"; // radar-sweep | square-construction | ripple-wavefront
    let isHudExpanded = false;
    const baseBoard = { width: 960, height: 560 };

    // 几何基础定义 (原点偏右, 水平基准线 Y = 400)
    let P = { x: 500, y: 160 }; // 外部点 P
    let Q = { x: 300, y: 400 }; // 线上滑动点 Q
    const lineY = 400;          // 直线 L 的 Y 轴坐标
    const lineXMin = 150;
    const lineXMax = 780;
    const VIS = {
        p: "#7c3aed",
        q: "#f59e0b",
        d: "#059669",
        base: "#0f172a",
        guide: "#94a3b8",
        route: "#0f766e",
        wave: "#2563eb"
    };

    // 常用画板变换变量 (用于 zoom/pan)
    let zoomScale = 1.0;
    let panX = 0, panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // 拖拽控制
    let activeDragNode = null; // "P" | "Q" | "Q_rescue"

    // 场景 1：雷达扫掠与极值函数
    let isSweepPlaying = false;
    let sweepSpeed = 2.0;

    // 场景 1 留痕数据 (最多记录 5 条)
    let recordedPaths = [];

    // 场景 2：三角板滑动尺规作图
    let constProgress = 0.0; // 0.0 - 1.0 之间
    let isConstPlaying = false;

    // 场景 3：同心圆涟漪与最短路径
    let rippleRadius = 0.0;
    let isRipplePlaying = false;
    let isRunnerRunning = false;
    let runnerProgress = 0.0;
    let rescueTargetX = 300; // 直线上比较点 Q 坐标

    // 实时极值图表的 Canvas 句柄
    const chartCanvas = document.getElementById("distance-canvas");
    const chartCtx = chartCanvas ? chartCanvas.getContext("2d") : null;

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");

    const rulerToolLayer = document.getElementById("ruler-tool-layer");
    const slidersContainer = document.getElementById("sliders-container");
    const presetButtonsContainer = document.getElementById("preset-buttons-container");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const modalHelp = document.getElementById("modal-help");
    const btnCloseHelp = document.getElementById("btn-close-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");
    const theoryPanel = theoryTitle ? theoryTitle.closest(".theory-panel") : null;
    if (theoryPanel) {
        theoryPanel.style.display = "none";
    }

    const hudTheoryBlocks = {
        "radar-sweep": {
            title: "垂线段最短原理",
            body: "以 P 为圆心扫掠半径，Q 越靠近垂足 D，|PQ| 越小；当圆与直线 L 相切时，切点就是垂足，距离达到最小。"
        },
        "square-construction": {
            title: "尺规构造垂线",
            body: "直尺贴住已知直线，三角板沿直尺平移，另一条直角边经过 P 时画出的线段就是点 P 到直线 L 的垂线段。"
        },
        "ripple-wavefront": {
            title: "波前解释最短路径",
            body: "水波从 P 等速向外扩散，最先碰到直线 L 的位置必然是圆与直线的切点，也就是垂足 D。"
        }
    };

    function renderTheoryHudBlock(title, body) {
        return `
            <div class="hud-equation-box blue-box hud-theory-box">
                <div class="title">${title}</div>
                <div class="formula" style="font-size:12.5px; font-weight:normal; line-height:1.55;">${body}</div>
            </div>
        `;
    }

    // ==========================================================================
    // 3. 计算与插值辅助函数
    // ==========================================================================
    function getFootPoint() {
        return { x: P.x, y: lineY };
    }

    function getDistance(pt1, pt2) {
        return Math.sqrt((pt1.x - pt2.x) ** 2 + (pt1.y - pt2.y) ** 2);
    }

    function getVisibleLineRange() {
        if (currentScene !== "ripple-wavefront") {
            return { min: lineXMin, max: lineXMax };
        }
        const centerMin = Math.min(P.x, rescueTargetX);
        const centerMax = Math.max(P.x, rescueTargetX);
        return {
            min: Math.max(lineXMin, centerMin - 118),
            max: Math.min(lineXMax, centerMax + 118)
        };
    }

    // 线性颜色插值 (十六进制 RGB 之间)
    function lerpColor(color1, color2, factor) {
        const c1 = parseInt(color1.substring(1), 16);
        const c2 = parseInt(color2.substring(1), 16);

        const r1 = (c1 >> 16) & 255;
        const g1 = (c1 >> 8) & 255;
        const b1 = c1 & 255;

        const r2 = (c2 >> 16) & 255;
        const g2 = (c2 >> 8) & 255;
        const b2 = c2 & 255;

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // 记录当前路径
    function recordCurrentPath() {
        const D = getFootPoint();
        const dist = getDistance(P, Q);
        const isMin = Math.abs(Q.x - D.x) < 2.0;

        // 重复检测
        if (recordedPaths.some(p => Math.abs(p.x - Q.x) < 3.0)) return;

        recordedPaths.push({
            x: Q.x,
            length: dist,
            isMin: isMin,
            color: isMin ? "#10b981" : ["#8b5cf6", "#3b82f6", "#f59e0b", "#ec4899"][recordedPaths.length % 4]
        });

        // 按长度升序排序
        recordedPaths.sort((a, b) => a.length - b.length);

        if (recordedPaths.length > 5) {
            recordedPaths.pop(); // 踢出最长的
        }
        render();
    }

    function clearRecordedPaths() {
        recordedPaths = [];
        render();
    }

    // ==========================================================================
    // 4. 全局 Ticker 帧更新
    // ==========================================================================
    function updateFrame() {
        // A. 场景 1：雷达扫掠 Q 点运动
        if (isSweepPlaying && currentScene === "radar-sweep") {
            Q.x += sweepSpeed;
            if (Q.x > lineXMax) {
                Q.x = lineXMin;
            }
        }

        // B. 场景 2：作图步骤动画
        if (isConstPlaying && currentScene === "square-construction") {
            constProgress += 0.0035;
            if (constProgress >= 1.0) {
                constProgress = 1.0;
                isConstPlaying = false;
                const playBtn = document.getElementById("btn-play-const");
                if (playBtn) playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放作图动画</span>`;
            }
        }

        // C. 场景 3：水波同心圆扩展
        if (isRipplePlaying && currentScene === "ripple-wavefront") {
            rippleRadius += 1.8;
            const maxRadius = getDistance(P, { x: lineXMax, y: lineY });
            if (rippleRadius > maxRadius) {
                rippleRadius = 0;
            }
        }

        // D. 场景 3：路径比较演示
        if (isRunnerRunning && currentScene === "ripple-wavefront") {
            runnerProgress += 0.008;
            if (runnerProgress >= 1.0) {
                runnerProgress = 1.0;
                isRunnerRunning = false;
                const runBtn = document.getElementById("btn-start-rescue");
                if (runBtn) runBtn.textContent = "重新演示路径";
            }
            const tVal = document.getElementById("val-rescue-time");
            if (tVal) {
                const speed = 5.0;
                const dist = getDistance(P, { x: rescueTargetX, y: lineY });
                tVal.textContent = (runnerProgress * (dist / speed) / 10).toFixed(2) + " 秒";
            }
        }

        render();
        requestAnimationFrame(updateFrame);
    }

    // ==========================================================================
    // 5. SVG 渲染逻辑 (融合高阶可视化方案)
    // ==========================================================================
    function renderSVG() {
        let drawHtml = "";
        const D = getFootPoint();
        const distPQ = getDistance(P, Q);
        const distPD = getDistance(P, D);

        // A. 动态渐变光谱带定义 Defs
        const visibleLine = getVisibleLineRange();
        const totalW = visibleLine.max - visibleLine.min;
        const pctD = (D.x - visibleLine.min) / totalW;

        // 限制百分比，避免超出 [0, 1]
        const pGreen = Math.max(0, Math.min(1.0, pctD));
        const pYellowLeft = Math.max(0, pGreen - 0.22);
        const pYellowRight = Math.min(1.0, pGreen + 0.22);

        drawHtml += `
            <defs>
                <linearGradient id="heatmap-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8"></stop>
                    <stop offset="${(pYellowLeft * 100).toFixed(1)}%" stop-color="#f59e0b" stop-opacity="0.8"></stop>
                    <stop offset="${(pGreen * 100).toFixed(1)}%" stop-color="#10b981" stop-opacity="0.9"></stop>
                    <stop offset="${(pYellowRight * 100).toFixed(1)}%" stop-color="#f59e0b" stop-opacity="0.8"></stop>
                    <stop offset="100%" stop-color="#ef4444" stop-opacity="0.8"></stop>
                </linearGradient>
            </defs>
        `;

        // 1. 渐变光谱带绘制
        drawHtml += `
            <rect x="${visibleLine.min}" y="${lineY + 3}" width="${totalW}" height="6" rx="3" fill="url(#heatmap-gradient)"></rect>
            <line class="geo-base-line" x1="${visibleLine.min}" y1="${lineY}" x2="${visibleLine.max}" y2="${lineY}"></line>
            <text class="geo-label" style="font-weight:700; fill:#0f172a;" x="${visibleLine.max + 10}" y="${lineY + 5}">L</text>
        `;

        // 2. 绘制已经记录留痕的虚线路径
        if (currentScene === "radar-sweep") {
            recordedPaths.forEach(path => {
                drawHtml += `
                    <line x1="${P.x}" y1="${P.y}" x2="${path.x}" y2="${lineY}" stroke="${path.color}" stroke-dasharray="3,3" stroke-width="1.8" opacity="0.65"></line>
                    <circle cx="${path.x}" cy="${lineY}" r="4" fill="${path.color}" opacity="0.8"></circle>
                `;
            });
        }

        // ==========================================================================
        // 场景 1: 半径比较与垂线段最短
        // ==========================================================================
        if (currentScene === "radar-sweep") {
            const ratio = distPD / Math.max(distPQ, 1);
            const strokeW = 2.2 + 3.0 * ratio;
            const bandColor = lerpColor("#f59e0b", "#059669", ratio);
            const deltaPQPD = Math.max(0, distPQ - distPD);
            const isAtShortest = deltaPQPD < 1.2;
            const qLabelX = Math.abs(Q.x - D.x) < 76 ? Q.x - 92 : Q.x;
            const pqLabelX = (P.x + Q.x) / 2 - 18;
            const pqLabelY = (P.y + Q.y) / 2 + 28;
            const pdLabelX = D.x + 54;
            const pdLabelY = (P.y + D.y) / 2 + 4;
            const statusChipText = isAtShortest ? "最短：Q 与 D 重合" : `比垂线段多出 ${deltaPQPD.toFixed(1)}`;
            const statusChipColor = isAtShortest ? VIS.d : VIS.q;

            // ① 只保留与直线相切的下半圆弧，避免巨大的全圆压住模拟框。
            drawHtml += `
                <rect class="shortest-target-zone ${isAtShortest ? "is-active" : ""}" x="${D.x - 34}" y="${lineY - 18}" width="68" height="36" rx="18"></rect>
                <path class="radar-envelope-circle"
                      d="M ${P.x - distPD} ${lineY} A ${distPD} ${distPD} 0 0 1 ${P.x + distPD} ${lineY}"
                      stroke="${VIS.p}" fill="none"></path>
                <polygon points="${P.x},${P.y} ${D.x},${D.y} ${Q.x},${Q.y}" fill="rgba(124, 58, 237, 0.045)" stroke="rgba(124, 58, 237, 0.18)" stroke-width="1.2" stroke-dasharray="4,4"></polygon>
            `;

            // ② 在 PQ 上截出与 |PD| 等长的 Q'，多出来的 Q'Q 就是斜线多出的长度。
            const r = distPD;
            const L = distPQ;
            const dx = (Q.x - P.x) / L;
            const dy = (Q.y - P.y) / L;

            // Q' 坐标 (投影截断点)
            const Qp = {
                x: P.x + r * dx,
                y: P.y + r * dy
            };
            const deltaMidX = (Qp.x + Q.x) / 2;
            const deltaMidY = Math.min(Qp.y, Q.y) - 18;

            if (distPQ > distPD + 2) {
                const sweepFlag = Q.x >= P.x ? 0 : 1;
                drawHtml += `
                    <path d="M ${D.x} ${D.y} A ${r} ${r} 0 0 ${sweepFlag} ${Qp.x} ${Qp.y}" fill="none" stroke="${VIS.p}" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.72"></path>
                    <circle cx="${Qp.x}" cy="${Qp.y}" r="4" fill="#ffffff" stroke="${VIS.p}" stroke-width="2"></circle>
                    <line x1="${Qp.x}" y1="${Qp.y}" x2="${Q.x}" y2="${Q.y}" stroke="${VIS.q}" stroke-width="4.2" stroke-linecap="round" class="active-glow-orange"></line>
                    <text class="geo-label label-chip" x="${deltaMidX}" y="${deltaMidY}" text-anchor="middle" fill="${VIS.q}">|PQ| - |PD| = ${deltaPQPD.toFixed(1)}</text>
                `;
            }

            // ③ 比较路径 PQ 与垂线段 PD。
            drawHtml += `
                <line class="geo-line-segment segment-comparison" x1="${P.x}" y1="${P.y}" x2="${Q.x}" y2="${Q.y}" stroke="${bandColor}" stroke-width="${strokeW}"></line>
                <line class="radar-sweep-line" x1="${P.x}" y1="${P.y}" x2="${Q.x}" y2="${Q.y}" stroke="${VIS.p}"></line>
                <line class="geo-line-segment segment-shortest" x1="${P.x}" y1="${P.y}" x2="${D.x}" y2="${D.y}" stroke="${VIS.d}"></line>
                <path class="right-angle-marker" d="M ${D.x - 14} ${D.y} L ${D.x - 14} ${D.y - 14} L ${D.x} ${D.y - 14} Z" stroke="${VIS.d}" fill="rgba(5,150,105,0.16)"></path>
                <text class="geo-label label-chip" x="${pqLabelX}" y="${pqLabelY}" text-anchor="middle" fill="${bandColor}">|PQ| = ${distPQ.toFixed(1)}</text>
                <text class="geo-label label-chip" x="${pdLabelX}" y="${pdLabelY}" text-anchor="start" fill="${VIS.d}">|PD| = ${distPD.toFixed(1)}</text>
                <text class="geo-label shortest-status-chip" x="${D.x}" y="${lineY - 38}" text-anchor="middle" fill="${statusChipColor}">${statusChipText}</text>
                <circle cx="${D.x}" cy="${D.y}" r="5.2" class="node-d" fill="${VIS.d}" stroke="#ffffff" stroke-width="2.2"></circle>
                <text class="geo-label" x="${D.x + 24}" y="${D.y - 12}" text-anchor="start" fill="${VIS.d}">D 垂足</text>
                <circle class="touch-target touch-target-q" cx="${Q.x}" cy="${Q.y}" r="34" data-node="Q"></circle>
                <circle cx="${Q.x}" cy="${Q.y}" r="8" class="draggable-node node-q" id="node-q-svg" fill="${VIS.q}" stroke="#ffffff" stroke-width="2.6"></circle>
                <text class="geo-label" x="${qLabelX}" y="${Q.y + 34}" text-anchor="middle" fill="${VIS.q}">Q 动点</text>
                <circle class="touch-target touch-target-p" cx="${P.x}" cy="${P.y}" r="34" data-node="P"></circle>
                <circle cx="${P.x}" cy="${P.y}" r="8.5" class="draggable-node node-p" id="node-p-svg" fill="${VIS.p}" stroke="#ffffff" stroke-width="2.8"></circle>
                <text class="geo-label" x="${P.x}" y="${P.y - 16}" text-anchor="middle" fill="${VIS.p}">P</text>
            `;
        }

        // ==========================================================================
        // 场景 2: 三角板滑动尺规作图
        // ==========================================================================
        else if (currentScene === "square-construction") {
            const previewOpacity = Math.max(0.28, Math.min(0.72, constProgress + 0.22));
            drawHtml += `
                <line class="construction-guide-line" x1="${P.x}" y1="${P.y}" x2="${D.x}" y2="${D.y}" opacity="${previewOpacity}"></line>
                <path class="right-angle-marker construction-preview-angle" d="M ${D.x - 14} ${D.y} L ${D.x - 14} ${D.y - 14} L ${D.x} ${D.y - 14} Z" opacity="${previewOpacity}"></path>
                <circle cx="${D.x}" cy="${D.y}" r="5" class="node-d construction-foot-preview" opacity="${previewOpacity}"></circle>
                <text class="geo-label" x="${D.x + 24}" y="${D.y - 12}" text-anchor="start" fill="${VIS.d}" opacity="${previewOpacity}">目标垂足 D</text>
            `;

            // 在第四步绘制出正在生成的垂线段
            if (constProgress > 0.75) {
                const drawPct = (constProgress - 0.75) / 0.25;
                const currentY = P.y + (D.y - P.y) * drawPct;
                drawHtml += `
                    <line class="geo-line-segment segment-shortest" x1="${P.x}" y1="${P.y}" x2="${D.x}" y2="${currentY}" stroke="${VIS.d}"></line>
                `;
            }

            if (constProgress > 0.98) {
                drawHtml += `
                    <!-- 直角标记 -->
                    <path class="right-angle-marker" d="M ${D.x - 14} ${D.y} L ${D.x - 14} ${D.y - 14} L ${D.x} ${D.y - 14} Z" stroke="${VIS.d}" fill="rgba(5,150,105,0.16)"></path>
                    <circle cx="${D.x}" cy="${D.y}" r="5.2" class="node-d" fill="${VIS.d}" stroke="#ffffff" stroke-width="2.2"></circle>
                `;
            }

            drawHtml += `
                <!-- 定点 P -->
                <circle class="touch-target touch-target-p" cx="${P.x}" cy="${P.y}" r="34" data-node="P"></circle>
                <circle cx="${P.x}" cy="${P.y}" r="8.5" class="draggable-node node-p" id="node-p-svg" fill="${VIS.p}" stroke="#ffffff" stroke-width="2.8"></circle>
                <text class="geo-label" x="${P.x}" y="${P.y - 16}" text-anchor="middle" fill="${VIS.p}">P</text>
            `;
        }

        // ==========================================================================
        // 场景 3: 波前圆与直线相切
        // ==========================================================================
        else if (currentScene === "ripple-wavefront") {
            const dPerp = lineY - P.y;
            const Qr = { x: rescueTargetX, y: lineY };
            const distPQr = getDistance(P, Qr);
            const isShortest = Math.abs(rescueTargetX - P.x) < 4.0;
            const routeColor = isShortest ? VIS.d : VIS.q;
            const runEndX = P.x + (rescueTargetX - P.x) * runnerProgress;
            const runEndY = P.y + (lineY - P.y) * runnerProgress;
            const pdRippleLabelX = D.x - 58;
            const pdRippleLabelY = (P.y + D.y) / 2 + 8;

            drawHtml += `
                <line class="construction-guide-line" x1="${P.x}" y1="${P.y}" x2="${D.x}" y2="${D.y}" opacity="0.55"></line>
                <line class="geo-line-segment segment-shortest" x1="${P.x}" y1="${P.y}" x2="${D.x}" y2="${D.y}" stroke="${VIS.d}" opacity="0.92"></line>
                <line class="geo-line-segment segment-comparison" x1="${P.x}" y1="${P.y}" x2="${Qr.x}" y2="${Qr.y}" stroke="${routeColor}" stroke-width="${isShortest ? 5 : 3.2}" opacity="0.94"></line>
                <path class="right-angle-marker" d="M ${D.x - 14} ${D.y} L ${D.x - 14} ${D.y - 14} L ${D.x} ${D.y - 14} Z" stroke="${VIS.d}" fill="rgba(5,150,105,0.16)"></path>
            `;

            // 绘制同心圆水波
            if (rippleRadius > 0) {
                const maxRadius = getDistance(P, { x: lineXMax, y: lineY });
                const opacity = Math.max(0.18, 1.0 - (rippleRadius / maxRadius));
                
                const isContacting = Math.abs(rippleRadius - dPerp) < 4.0;
                const strokeColor = isContacting ? VIS.d : VIS.wave;
                const strokeW = isContacting ? "3.2px" : "2px";

                drawHtml += `
                    <circle class="water-ripple" cx="${P.x}" cy="${P.y}" r="${rippleRadius}" style="stroke:${strokeColor}; stroke-width:${strokeW}; opacity:${opacity};"></circle>
                `;

                if (isContacting) {
                    drawHtml += `
                        <!-- 瞬间接触光环 -->
                        <circle cx="${D.x}" cy="${D.y}" r="11" fill="none" stroke="${VIS.d}" stroke-width="2.4" class="active-glow-sqrt"></circle>
                    `;
                }
            }

            drawHtml += `
                <line x1="${P.x}" y1="${P.y}" x2="${runEndX}" y2="${runEndY}" stroke="${routeColor}" stroke-width="2.5" stroke-dasharray="4,4" opacity="0.88"></line>
                <circle cx="${runEndX}" cy="${runEndY}" r="6.5" fill="${routeColor}" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"></circle>
                <circle cx="${D.x}" cy="${D.y}" r="5.2" class="node-d" fill="${VIS.d}" stroke="#ffffff" stroke-width="2.2"></circle>
                <text class="geo-label" x="${D.x + 28}" y="${D.y - 28}" text-anchor="start" fill="${VIS.d}">D：首次相切点 / 垂足</text>
                <text class="geo-label label-chip" x="${D.x + 42}" y="${D.y + 25}" text-anchor="start" fill="${VIS.d}">到 D：最先到达</text>
                <circle class="touch-target touch-target-q" cx="${rescueTargetX}" cy="${lineY}" r="34" data-node="Q_rescue"></circle>
                <circle cx="${rescueTargetX}" cy="${lineY}" r="8" class="draggable-node node-q" id="node-q-rescue" fill="${VIS.q}" stroke="#ffffff" stroke-width="2.6"></circle>
                <text class="geo-label" x="${rescueTargetX}" y="${lineY + 34}" text-anchor="middle" fill="${VIS.q}">Q 比较点</text>
                <text class="geo-label label-chip" x="${rescueTargetX + 18}" y="${lineY - 22}" text-anchor="start" fill="${routeColor}">到 Q：更晚到达</text>
                <circle class="touch-target touch-target-p" cx="${P.x}" cy="${P.y}" r="34" data-node="P"></circle>
                <circle cx="${P.x}" cy="${P.y}" r="8.5" class="draggable-node node-p" id="node-p-svg" fill="${VIS.p}" stroke="#ffffff" stroke-width="2.8"></circle>
                <text class="geo-label" x="${P.x}" y="${P.y - 16}" text-anchor="middle" fill="${VIS.p}">P</text>
                <text class="geo-label label-chip" x="${(P.x + Qr.x) / 2}" y="${(P.y + Qr.y) / 2 - 18}" text-anchor="middle" fill="${routeColor}">|PQ| = ${distPQr.toFixed(1)}</text>
                <text class="geo-label label-chip" x="${pdRippleLabelX}" y="${pdRippleLabelY}" text-anchor="end" fill="${VIS.d}">|PD| = ${dPerp.toFixed(1)}</text>
            `;
        }

        sandboxSvg.innerHTML = drawHtml;

        // 渲染极值函数曲线 (Scene 1 下)
        if (currentScene === "radar-sweep") {
            drawDistanceCurve();
        }
    }

    // ==========================================================================
    // 6. 拟真三角板与直尺手绘作图渲染
    // ==========================================================================
    function renderRulerTools() {
        if (currentScene !== "square-construction") {
            rulerToolLayer.innerHTML = "";
            return;
        }

        let rulerHtml = "";
        const rulerW = 660;
        const rulerH = 18;
        const rulerX = P.x - rulerW / 2;
        const rulerY = lineY + 18;
        const setSquareTop = Math.max(42, P.y - 34);
        const setSquareBottom = rulerY;
        const setSquareH = setSquareBottom - setSquareTop;
        const setSquareW = Math.min(210, Math.max(160, setSquareH * 0.72));
        const startSlideX = Math.max(lineXMin + 72, P.x - 285);
        let slideX = startSlideX;
        if (constProgress >= 0.50 && constProgress < 0.75) {
            const pct = (constProgress - 0.50) / 0.25;
            slideX = startSlideX + (P.x - startSlideX) * pct;
        } else if (constProgress >= 0.75) {
            slideX = P.x;
        }

        // 阶段 1：直尺放在直线 L 的下侧，只用上边缘作为平移导轨，避免遮挡模型。
        if (constProgress >= 0.05) {
            let ry = rulerY + 56;
            let opacity = 0.0;
            if (constProgress >= 0.05 && constProgress < 0.25) {
                const pct = (constProgress - 0.05) / 0.20;
                ry = (rulerY + 56) - 56 * pct;
                opacity = pct;
            } else {
                ry = rulerY;
                opacity = 1.0;
            }

            rulerHtml += `
                <div class="sim-ruler" style="left:${rulerX}px; top:${ry}px; width:${rulerW}px; height:${rulerH}px; opacity:${opacity};">
                    <div class="sim-ruler-scale"></div>
                    <div class="sim-ruler-edge"></div>
                </div>
            `;
        }

        // 阶段 2/3/4：三角板沿直尺平移，竖直直角边经过 P 时才能画垂线。
        if (constProgress >= 0.25) {
            let toolTopY = setSquareTop;
            let opacity = 0.0;

            if (constProgress >= 0.25 && constProgress < 0.50) {
                const pct = (constProgress - 0.25) / 0.25;
                toolTopY = setSquareTop + 46 * (1 - pct);
                opacity = pct;
            } else {
                toolTopY = setSquareTop;
                opacity = 1.0;
            }

            const left = slideX - setSquareW;
            const top = toolTopY;
            const viewBox = `0 0 ${setSquareW} ${setSquareH}`;
            const rightAngleY = setSquareH - 24;
            rulerHtml += `
                <svg class="sim-set-square-svg" viewBox="${viewBox}" style="left:${left}px; top:${top}px; width:${setSquareW}px; height:${setSquareH}px; --set-square-w:${setSquareW}px; --set-square-h:${setSquareH}px; opacity:${opacity};">
                    <polygon class="set-square-body" points="${setSquareW},0 ${setSquareW},${setSquareH} 0,${setSquareH}"></polygon>
                    <line class="set-square-edge set-square-vertical-edge" x1="${setSquareW}" y1="0" x2="${setSquareW}" y2="${setSquareH}"></line>
                    <line class="set-square-edge set-square-base-edge" x1="0" y1="${setSquareH}" x2="${setSquareW}" y2="${setSquareH}"></line>
                    <line class="set-square-edge" x1="0" y1="${setSquareH}" x2="${setSquareW}" y2="0"></line>
                    <path class="set-square-right-angle" d="M ${setSquareW} ${rightAngleY} L ${setSquareW - 24} ${rightAngleY} L ${setSquareW - 24} ${setSquareH}"></path>
                    <line class="set-square-through-p" x1="${setSquareW - 34}" y1="${P.y - setSquareTop}" x2="${setSquareW}" y2="${P.y - setSquareTop}"></line>
                    <text class="set-square-label" x="${setSquareW - 60}" y="${setSquareH - 13}">90°</text>
                </svg>
            `;
        }

        // 阶段 4：沿三角板竖直边落笔，从 P 画到垂足 D。
        if (constProgress >= 0.75) {
            const drawPct = (constProgress - 0.75) / 0.25;
            const cy = P.y + (lineY - P.y) * drawPct;
            rulerHtml += `
                <div class="sim-pencil" style="left:${P.x - 5}px; top:${cy - 14}px;"></div>
            `;
        }

        rulerToolLayer.innerHTML = rulerHtml;
    }

    // ==========================================================================
    // 7. HTML 读数气泡渲染与 HUD 更新 (合并路径排行榜)
    // ==========================================================================
    function renderHTMLOverlay() {
        let html = "";
        // 读数标签全部放在 SVG 坐标系内，避免平台嵌入后 HTML overlay 与模型缩放不同步。
        htmlOverlay.innerHTML = html;

        updateHUDContent();
    }

    function updateHUDContent() {
        let html = "";
        const D = getFootPoint();
        const distPQ = getDistance(P, Q);
        const distPD = getDistance(P, D);

        if (currentScene === "radar-sweep") {
            const isShortest = Math.abs(Q.x - D.x) < 2.0;

            // 生成多路径排行榜
            let leaderboardHtml = "";
            if (recordedPaths.length > 0) {
                leaderboardHtml += `<div class="leaderboard-container">`;
                recordedPaths.forEach((path, idx) => {
                    const pct = Math.min(100, (path.length / 450) * 100);
                    leaderboardHtml += `
                        <div class="leaderboard-item">
                            <div class="leaderboard-info-row">
                                <span>路径 ${idx+1} (X:${Math.round(path.x)})</span>
                                <strong>${path.length.toFixed(1)} ${path.isMin ? '🏆 (最短)' : ''}</strong>
                            </div>
                            <div class="leaderboard-bar-bg">
                                <div class="leaderboard-bar-fill" style="width:${pct}%; background:${path.color};"></div>
                            </div>
                        </div>
                    `;
                });
                leaderboardHtml += `</div>`;
            } else {
                leaderboardHtml = `<div style="font-size:11.5px; color:var(--text-muted); text-align:center; padding:10px 0;">暂无记录路径，请点击右侧“记录当前路径”按钮</div>`;
            }

            const deltaPQPD = Math.max(0, distPQ - distPD);
            const feedbackText = isShortest
                ? "恰好到达垂足 D，当前就是最短路径。"
                : `Q 偏离垂足 D，斜线段比垂线段多出 ${deltaPQPD.toFixed(1)} 像素。`;

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">当前动线段长度 |PQ|</div>
                    <div class="hud-row-val" style="font-size:15px; font-weight:800; color:var(--color-construction);">
                        ${distPQ.toFixed(2)} 像素
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">正交垂线段长度 |PD|</div>
                    <div class="hud-row-val" style="font-size:15px; font-weight:800; color:var(--color-green);">
                        ${distPD.toFixed(2)} 像素
                    </div>
                </div>
                <div class="hud-equation-box success-box" style="margin-bottom: 12px;">
                    <div class="title">垂线段最短定理判定</div>
                    <div class="formula" style="font-size:13px; line-height:1.5;">
                        <div>动线段 |PQ| ≥ 垂线段 |PD|</div>
                        <div style="font-size:14.5px; font-weight:800; margin-top:2px;">
                            |PQ| - |PD| = ${deltaPQPD.toFixed(1)}
                        </div>
                        <div class="hud-feedback-line">${feedbackText}</div>
                    </div>
                </div>
                <div class="hud-row" style="border-bottom:none;">
                    <div class="hud-row-label">📊 路径长度留痕对比排行榜</div>
                    ${leaderboardHtml}
                </div>
            `;
        } 
        
        else if (currentScene === "square-construction") {
            let stepText = "";
            if (constProgress < 0.25) stepText = "步骤 1：贴直尺。将直尺边缘对准已知直线 L 靠拢贴紧。";
            else if (constProgress < 0.50) stepText = "步骤 2：靠三角板。将直角三角板的一条直角边紧靠在直尺边缘。";
            else if (constProgress < 0.75) stepText = "步骤 3：滑动平移。沿着直尺边缘滑动三角板，直到另一条直角边穿过外部点 P。";
            else stepText = "步骤 4：画垂线段。沿着三角板的边缘从 P 向下画线，垂线与直线相交于垂足 D。";
            const activeStep = constProgress < 0.25 ? 1 : constProgress < 0.50 ? 2 : constProgress < 0.75 ? 3 : 4;
            const constructionSteps = ["贴直尺", "靠三角板", "平移过 P", "落笔画 PD"];

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">当前作图步骤</div>
                    <div class="hud-row-val" style="color:var(--color-construction);">
                        第 ${activeStep} 步 / 4 步，进度 ${(constProgress * 100).toFixed(0)}%
                    </div>
                </div>
                <div class="construction-step-list">
                    ${constructionSteps.map((name, idx) => `
                        <div class="construction-step ${idx + 1 === activeStep ? "active" : idx + 1 < activeStep ? "done" : ""}">
                            <span>${idx + 1}</span><strong>${name}</strong>
                        </div>
                    `).join("")}
                </div>
                <div class="hud-equation-box orange-box">
                    <div class="title">三角板尺规作图规范</div>
                    <div class="formula" style="font-size:12.5px; font-weight:normal; line-height:1.5;">
                        ${stepText}
                    </div>
                </div>
            `;
        } 
        
        else if (currentScene === "ripple-wavefront") {
            const isShortest = Math.abs(rescueTargetX - P.x) < 4.0;
            const dist = getDistance(P, { x: rescueTargetX, y: lineY });
            const dDist = lineY - P.y;
            const timeGap = Math.max(0, dist - dDist) / 5.0;
            
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">已知直线 L 与外部点 P</div>
                    <div class="hud-row-val" style="font-size:12px; line-height:1.45;">
                        直线 L 位于 Y = ${lineY}，点 P 不在直线上。拖动 Q 比较不同斜线段的长度。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">比较线段长度</div>
                    <div class="hud-row-val" style="color: ${isShortest ? 'var(--color-green)' : 'var(--color-construction)'};">
                        |PQ| = ${dist.toFixed(1)} 像素，|PD| = ${dDist.toFixed(1)} 像素，时间差约 ${timeGap.toFixed(1)}
                    </div>
                </div>
                <div class="hud-equation-box blue-box">
                    <div class="title">波前圆与切线原理</div>
                    <div class="formula" style="font-size:12px; font-weight:normal; line-height:1.5;">
                        以 P 为圆心的波前圆不断扩大，第一次碰到直线 L 时只能在切点 D 接触。到 D：最先到达；到 Q：更晚到达。半径 PD 垂直于切线 L，所以 <strong>|PD| 是点 P 到直线 L 的最短距离</strong>。
                    </div>
                </div>
            `;
        }

        const theory = hudTheoryBlocks[currentScene];
        if (theory) {
            html += renderTheoryHudBlock(theory.title, theory.body);
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 实时极值距离折线图表 (Canvas 绘制)
    // ==========================================================================
    function drawDistanceCurve() {
        if (!chartCtx) return;

        chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

        chartCtx.strokeStyle = "rgba(226, 232, 240, 0.6)";
        chartCtx.lineWidth = 1;
        for (let i = 20; i < chartCanvas.width; i += 20) {
            chartCtx.beginPath();
            chartCtx.moveTo(i, 0);
            chartCtx.lineTo(i, chartCanvas.height);
            chartCtx.stroke();
        }
        for (let j = 20; j < chartCanvas.height; j += 20) {
            chartCtx.beginPath();
            chartCtx.moveTo(0, j);
            chartCtx.lineTo(chartCanvas.width, j);
            chartCtx.stroke();
        }

        const axisX = 20;
        const axisY = chartCanvas.height - 20;

        chartCtx.strokeStyle = "#475569";
        chartCtx.lineWidth = 1.5;
        chartCtx.beginPath();
        chartCtx.moveTo(axisX, axisY);
        chartCtx.lineTo(chartCanvas.width - 10, axisY);
        chartCtx.moveTo(axisX, axisY);
        chartCtx.lineTo(axisX, 10);
        chartCtx.stroke();

        const plotXMin = axisX + 10;
        const plotXMax = chartCanvas.width - 15;
        const plotYMin = 20;
        const plotYMax = axisY - 10;

        const getPlotX = (qx) => {
            const pct = (qx - lineXMin) / (lineXMax - lineXMin);
            return plotXMin + pct * (plotXMax - plotXMin);
        };

        const getPlotY = (dist) => {
            const maxD = getDistance(P, { x: lineXMax, y: lineY });
            const minD = lineY - P.y;
            const pct = (dist - minD) / (maxD - minD + 1);
            return plotYMax - pct * (plotYMax - plotYMin);
        };

        chartCtx.strokeStyle = "var(--color-radar)";
        chartCtx.lineWidth = 2;
        chartCtx.beginPath();

        for (let qx = lineXMin; qx <= lineXMax; qx += 5) {
            const dist = Math.sqrt((qx - P.x) ** 2 + (lineY - P.y) ** 2);
            const px = getPlotX(qx);
            const py = getPlotY(dist);

            if (qx === lineXMin) {
                chartCtx.moveTo(px, py);
            } else {
                chartCtx.lineTo(px, py);
            }
        }
        chartCtx.stroke();

        // 绘制垂足 D 处的最低点 (极小值点)
        const dX = getPlotX(P.x);
        const dY = getPlotY(lineY - P.y);
        chartCtx.fillStyle = "var(--color-green)";
        chartCtx.beginPath();
        chartCtx.arc(dX, dY, 4, 0, Math.PI * 2);
        chartCtx.fill();

        // 绘制当前动点 Q
        const currentDist = getDistance(P, Q);
        const qX = getPlotX(Q.x);
        const qY = getPlotY(currentDist);

        chartCtx.fillStyle = "var(--color-construction)";
        chartCtx.beginPath();
        chartCtx.arc(qX, qY, 5.5, 0, Math.PI * 2);
        chartCtx.fill();

        chartCtx.fillStyle = "var(--color-green)";
        chartCtx.font = "bold 9px sans-serif";
        chartCtx.fillText("最小值 |PD|", dX - 30, dY - 8);
    }

    // ==========================================================================
    // 9. 右侧滑块面板动态注入
    // ==========================================================================
    function loadSlidersForScene() {
        let html = "";

        if (currentScene === "radar-sweep") {
            html = `
                <div class="slider-row">
                    <span class="slider-label">动点 Q 线上位置：</span>
                    <input type="range" id="slider-sweep-pos" min="${lineXMin}" max="${lineXMax}" step="1" value="${Math.round(Q.x)}">
                    <span class="slider-val-indicator" id="val-indicator-sweep">${Math.round(Q.x)}</span>
                </div>
                <div class="slider-row" style="margin-top: 10px;">
                    <span class="slider-label">雷达扫掠滚动速度：</span>
                    <input type="range" id="slider-sweep-speed" min="0.5" max="5.0" step="0.5" value="${sweepSpeed}">
                    <span class="slider-val-indicator" id="val-indicator-speed">${sweepSpeed.toFixed(1)} px/f</span>
                </div>
                <div class="control-action-btn-group">
                    <button class="btn-control-action active-run" id="btn-toggle-sweep">
                        <span>自动扫掠演示</span>
                    </button>
                    <button class="btn-control-action active-orange" id="btn-record-path">
                        <span>记录当前路径 PQ</span>
                    </button>
                    <button class="btn-control-action" id="btn-clear-paths">
                        <span>清空已存路径</span>
                    </button>
                </div>
            `;
        } 
        
        else if (currentScene === "square-construction") {
            html = `
                <div class="slider-row slider-row-orange">
                    <span class="slider-label">尺规作图时间进度：</span>
                    <input type="range" id="slider-const-progress" min="0" max="100" step="1" value="${(constProgress * 100).toFixed(0)}">
                    <span class="slider-val-indicator" id="val-indicator-const">${(constProgress * 100).toFixed(0)}%</span>
                </div>
                <div class="control-action-btn-group" style="margin-top: 10px;">
                    <button class="btn-control-action active-orange" id="btn-play-const">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
                        <span>播放作图动画</span>
                    </button>
                </div>
            `;
        } 
        
        else if (currentScene === "ripple-wavefront") {
            html = `
                <div class="slider-row slider-row-blue">
                    <span class="slider-label">水波涟漪扩散半径：</span>
                    <input type="range" id="slider-ripple-radius" min="0" max="450" step="1" value="${rippleRadius.toFixed(0)}">
                    <span class="slider-val-indicator" id="val-indicator-radius">${rippleRadius.toFixed(0)} px</span>
                </div>
                <div class="control-action-btn-group" style="margin-top: 10px;">
                    <button class="btn-control-action active-blue" id="btn-toggle-ripple">
                        <span>开启水波同心圆</span>
                    </button>
                </div>
                <div style="height:1px; background:#e2e8f0; margin:10px 0;"></div>
                <div class="slider-row slider-row-orange">
                    <span class="slider-label">直线上比较点 Q.x：</span>
                    <input type="range" id="slider-rescue-target" min="${lineXMin}" max="${lineXMax}" step="1" value="${rescueTargetX}">
                    <span class="slider-val-indicator" id="val-indicator-rescue">${rescueTargetX}</span>
                </div>
                <div class="control-action-btn-group">
                    <button class="btn-control-action active-orange" id="btn-start-rescue">
                        <span>演示从 P 到 Q</span>
                    </button>
                    <div style="margin-top:6px; font-size:12.5px; color:var(--text-secondary); text-align:center;">
                        路径比较用时：<strong id="val-rescue-time" style="color:var(--color-green);">0.00 秒</strong>
                    </div>
                </div>
            `;
        }

        slidersContainer.innerHTML = html;
        bindSliderEvents();
    }

    // ==========================================================================
    // 10. 事件处理器绑定
    // ==========================================================================
    function bindSliderEvents() {
        const sliderSweep = document.getElementById("slider-sweep-pos");
        if (sliderSweep) {
            sliderSweep.addEventListener("input", (e) => {
                isSweepPlaying = false;
                Q.x = parseFloat(e.target.value);
            });
        }

        const sliderSpeed = document.getElementById("slider-sweep-speed");
        if (sliderSpeed) {
            sliderSpeed.addEventListener("input", (e) => {
                sweepSpeed = parseFloat(e.target.value);
            });
        }

        const btnToggleSweep = document.getElementById("btn-toggle-sweep");
        if (btnToggleSweep) {
            btnToggleSweep.addEventListener("click", () => {
                isSweepPlaying = !isSweepPlaying;
                if (isSweepPlaying) {
                    btnToggleSweep.innerHTML = `<span>暂停扫掠演示</span>`;
                    btnToggleSweep.classList.remove("active-run");
                } else {
                    btnToggleSweep.innerHTML = `<span>自动扫掠演示</span>`;
                    btnToggleSweep.classList.add("active-run");
                }
            });
        }

        const btnRecordPath = document.getElementById("btn-record-path");
        if (btnRecordPath) {
            btnRecordPath.addEventListener("click", () => {
                recordCurrentPath();
            });
        }

        const btnClearPaths = document.getElementById("btn-clear-paths");
        if (btnClearPaths) {
            btnClearPaths.addEventListener("click", () => {
                clearRecordedPaths();
            });
        }

        const sliderConst = document.getElementById("slider-const-progress");
        if (sliderConst) {
            sliderConst.addEventListener("input", (e) => {
                isConstPlaying = false;
                constProgress = parseFloat(e.target.value) / 100;
                renderRulerTools();
            });
        }

        const btnPlayConst = document.getElementById("btn-play-const");
        if (btnPlayConst) {
            btnPlayConst.addEventListener("click", () => {
                isConstPlaying = !isConstPlaying;
                if (isConstPlaying) {
                    if (constProgress >= 0.99) constProgress = 0.0;
                    btnPlayConst.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M19,16H15V8H19V16M13,16H9V8H13V16Z"/></svg><span>暂停作图</span>`;
                } else {
                    btnPlayConst.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg><span>播放作图动画</span>`;
                }
            });
        }

        const sliderRipple = document.getElementById("slider-ripple-radius");
        if (sliderRipple) {
            sliderRipple.addEventListener("input", (e) => {
                isRipplePlaying = false;
                rippleRadius = parseFloat(e.target.value);
            });
        }

        const btnToggleRipple = document.getElementById("btn-toggle-ripple");
        if (btnToggleRipple) {
            btnToggleRipple.addEventListener("click", () => {
                isRipplePlaying = !isRipplePlaying;
                if (isRipplePlaying) {
                    btnToggleRipple.textContent = "关闭水波圆";
                } else {
                    btnToggleRipple.textContent = "开启水波同心圆";
                }
            });
        }

        const sliderRescue = document.getElementById("slider-rescue-target");
        if (sliderRescue) {
            sliderRescue.addEventListener("input", (e) => {
                rescueTargetX = parseFloat(e.target.value);
            });
        }

        const btnStartRescue = document.getElementById("btn-start-rescue");
        if (btnStartRescue) {
            btnStartRescue.addEventListener("click", () => {
                isRunnerRunning = !isRunnerRunning;
                if (isRunnerRunning) {
                    runnerProgress = 0.0;
                    btnStartRescue.textContent = "暂停路径演示";
                } else {
                    btnStartRescue.textContent = "演示从 P 到 Q";
                }
            });
        }
    }

    // ==========================================================================
    // 11. 问题快速预设
    // ==========================================================================
    function updateScenePresetsAndTheory() {
        let presetHtml = "";
        let theoryTitleText = "💡 概念原理解析";
        let theoryBody = "";

        if (currentScene === "radar-sweep") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="sw-closest">定位到垂足位置 (最小值)</button>
                <button class="btn-preset-problem" data-preset="sw-diagonal">拉到右侧边界位置</button>
            `;
            theoryTitleText = "💡 垂线段最短原理";
            theoryBody = `
                <p>在雷达扫掠中，我们以 P 为中心画圆，圆圈的半径就是 PQ 的长度：</p>
                <p>当 Q 靠近垂足 D 时，圆圈不断收缩，在正交点与直线 L 相切达到极小值。此时，直线上除了垂足外所有点都在圆圈外部。</p>
            `;
        } else if (currentScene === "square-construction") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="cs-step-slide">平移平直滑轨阶段 (步骤3)</button>
                <button class="btn-preset-problem" data-preset="cs-step-draw">落笔画线阶段 (步骤4)</button>
            `;
            theoryTitleText = "💡 尺规绘制垂直";
            theoryBody = `
                <p>在平面几何中，借助三角板的 <strong>$90^\\circ$ 直角</strong> 和直尺的导轨，我们可以轻松完成垂直投影的绘制：</p>
                <p>“贴直尺”确保了导轨的平行；“靠三角板并滑动”确保了垂足和定点 P 精准契合；“画垂线”直接输出最短路径段。</p>
            `;
        } else if (currentScene === "ripple-wavefront") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="rp-contact">观察波纹第一次碰地 (切点)</button>
                <button class="btn-preset-problem" data-preset="rp-target-closest">选择垂足 D 作为比较点 (最短)</button>
                <button class="btn-preset-problem" data-preset="rp-target-far">选择偏离垂足的比较点 (更长)</button>
            `;
            theoryTitleText = "💡 最短路径的物理涟漪解释";
            theoryBody = `
                <p><strong>水波同心圆</strong>的扩散代表了点 P 向四面八方等速行进的“波前”（Wavefront）：</p>
                <p>最先遇到直线 L 的位置一定是唯一的切点。这用物理学和几何学的双重角度形象地解释了垂线段的特殊性。</p>
            `;
        }

        if (presetButtonsContainer) {
            presetButtonsContainer.innerHTML = presetHtml;
        }
        if (theoryTitle && theoryText) {
            theoryTitle.innerHTML = theoryTitleText;
            theoryText.innerHTML = theoryBody;
        }

        if (presetButtonsContainer) {
            presetButtonsContainer.querySelectorAll(".btn-preset-problem").forEach(btn => {
                btn.addEventListener("click", () => {
                    applyPreset(btn.getAttribute("data-preset"));
                });
            });
        }
    }

    function applyPreset(presetId) {
        if (presetId === "sw-closest") {
            Q.x = P.x;
            isSweepPlaying = false;
        } else if (presetId === "sw-diagonal") {
            Q.x = lineXMax - 40;
            isSweepPlaying = false;
        } 
        
        else if (presetId === "cs-step-slide") {
            constProgress = 0.60;
            isConstPlaying = false;
            renderRulerTools();
        } else if (presetId === "cs-step-draw") {
            constProgress = 0.85;
            isConstPlaying = false;
            renderRulerTools();
        } 
        
        else if (presetId === "rp-contact") {
            rippleRadius = lineY - P.y;
            isRipplePlaying = false;
        } else if (presetId === "rp-target-closest") {
            rescueTargetX = P.x;
            isRunnerRunning = false;
        } else if (presetId === "rp-target-far") {
            rescueTargetX = P.x + 220;
            isRunnerRunning = false;
        }

        render();
    }

    // ==========================================================================
    // 12. 场景载入与重置
    // ==========================================================================
    function loadScene(sceneId) {
        currentScene = sceneId;

        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === sceneId) btn.classList.add("active");
            else btn.classList.remove("active");
        });

        const chartBox = document.getElementById("distance-chart-box");
        if (chartBox) {
            chartBox.style.display = currentScene === "radar-sweep" ? "flex" : "none";
        }

        isSweepPlaying = false;
        isConstPlaying = false;
        isRipplePlaying = false;
        isRunnerRunning = false;

        recordedPaths = [];

        if (currentScene === "radar-sweep") {
            P = { x: 500, y: 160 };
            Q = { x: 300, y: 400 };
        } else if (currentScene === "square-construction") {
            P = { x: 500, y: 180 };
            constProgress = 0.0;
            renderRulerTools();
        } else if (currentScene === "ripple-wavefront") {
            P = { x: 500, y: 170 };
            rescueTargetX = P.x + 150;
            rippleRadius = lineY - P.y;
        }

        loadSlidersForScene();
        updateScenePresetsAndTheory();
        fitStageToFrame();
        render();
    }

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadScene(btn.getAttribute("data-scene"));
        });
    });

    const usePlatformHudToggle = !!hudPanel.closest(".math-source-scene") ||
        document.documentElement.classList.contains("math-platform-embed") ||
        !!document.querySelector("[data-source-card-id]");
    if (!usePlatformHudToggle) hudToggleBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        isHudExpanded = hudPanel.classList.contains("collapsed");
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
        } else {
            hudPanel.classList.add("collapsed");
        }
        render();
    });

    btnResetState.addEventListener("click", () => {
        loadScene(currentScene);
    });

    // ==========================================================================
    // 13. 鼠标与触屏拖拽逻辑
    // ==========================================================================
    const pointerHitRadius = 34;
    const touchHitRadius = 42;

    sandboxWrapper.addEventListener("mousedown", (e) => {
        if (isPanning) return;

        const point = getBoardPointFromEvent(e.clientX, e.clientY);
        const mX = point.x;
        const mY = point.y;

        if (currentScene === "radar-sweep") {
            const distToP = Math.sqrt((mX - P.x) ** 2 + (mY - P.y) ** 2);
            const distToQ = Math.sqrt((mX - Q.x) ** 2 + (mY - Q.y) ** 2);

            if (distToP < pointerHitRadius) {
                activeDragNode = "P";
                e.preventDefault();
            } else if (distToQ < pointerHitRadius) {
                activeDragNode = "Q";
                e.preventDefault();
            }
        } 
        else if (currentScene === "ripple-wavefront") {
            const distToP = Math.sqrt((mX - P.x) ** 2 + (mY - P.y) ** 2);
            const distToQ = Math.sqrt((mX - rescueTargetX) ** 2 + (mY - lineY) ** 2);

            if (distToP < pointerHitRadius) {
                activeDragNode = "P";
                e.preventDefault();
            } else if (distToQ < pointerHitRadius) {
                activeDragNode = "Q_rescue";
                e.preventDefault();
            }
        }
    });

    window.addEventListener("mousemove", (e) => {
        if (!activeDragNode) return;

        const point = getBoardPointFromEvent(e.clientX, e.clientY);
        const mX = point.x;
        const mY = point.y;

        if (activeDragNode === "P") {
            P.x = Math.max(160, Math.min(760, mX));
            P.y = Math.max(60, Math.min(320, mY));
        } else if (activeDragNode === "Q") {
            Q.x = Math.max(lineXMin, Math.min(lineXMax, mX));
        } else if (activeDragNode === "Q_rescue") {
            rescueTargetX = Math.max(lineXMin, Math.min(lineXMax, mX));
        }

        render();
    });

    window.addEventListener("mouseup", () => {
        activeDragNode = null;
    });

    // Touch events for mobile
    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const point = getBoardPointFromEvent(touch.clientX, touch.clientY);
            const mX = point.x;
            const mY = point.y;

            if (currentScene === "radar-sweep") {
                const distToP = Math.sqrt((mX - P.x) ** 2 + (mY - P.y) ** 2);
                const distToQ = Math.sqrt((mX - Q.x) ** 2 + (mY - Q.y) ** 2);

                if (distToP < touchHitRadius) activeDragNode = "P";
                else if (distToQ < touchHitRadius) activeDragNode = "Q";
            } else if (currentScene === "ripple-wavefront") {
                const distToP = Math.sqrt((mX - P.x) ** 2 + (mY - P.y) ** 2);
                const distToQ = Math.sqrt((mX - rescueTargetX) ** 2 + (mY - lineY) ** 2);

                if (distToP < touchHitRadius) activeDragNode = "P";
                else if (distToQ < touchHitRadius) activeDragNode = "Q_rescue";
            }
        }
    });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (activeDragNode && e.touches.length === 1) {
            const touch = e.touches[0];
            const point = getBoardPointFromEvent(touch.clientX, touch.clientY);
            const mX = point.x;
            const mY = point.y;

            if (activeDragNode === "P") {
                P.x = Math.max(160, Math.min(760, mX));
                P.y = Math.max(60, Math.min(320, mY));
            } else if (activeDragNode === "Q") {
                Q.x = Math.max(lineXMin, Math.min(lineXMax, mX));
            } else if (activeDragNode === "Q_rescue") {
                rescueTargetX = Math.max(lineXMin, Math.min(lineXMax, mX));
            }
            render();
            e.preventDefault();
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchend", () => {
        activeDragNode = null;
    });

    // ==========================================================================
    // 14. 缩放平移控制
    // ==========================================================================
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");
    const btnZoomReset = document.getElementById("btn-zoom-reset");

    if (btnZoomIn) btnZoomIn.addEventListener("click", () => {
        zoomScale = Math.min(zoomScale * 1.15, 3.0);
        updateTransform();
    });
    if (btnZoomOut) btnZoomOut.addEventListener("click", () => {
        zoomScale = Math.max(zoomScale / 1.15, 0.45);
        updateTransform();
    });
    if (btnZoomReset) btnZoomReset.addEventListener("click", () => {
        fitStageToFrame();
        render();
    });

    function getSceneFocusBounds() {
        const visibleLine = getVisibleLineRange();
        const pad = currentScene === "ripple-wavefront" ? 46 : 78;
        let minX = visibleLine.min - pad;
        let maxX = visibleLine.max + pad;
        let minY = Math.min(P.y, lineY) - pad;
        let maxY = lineY + pad;

        if (currentScene === "ripple-wavefront") {
            const baseRadius = lineY - P.y;
            const visibleRipple = Math.max(baseRadius, Math.min(rippleRadius || 0, baseRadius + 70));
            minX = Math.min(visibleLine.min, rescueTargetX, P.x - visibleRipple) - 36;
            maxX = Math.max(visibleLine.max, rescueTargetX, P.x + visibleRipple) + 48;
            minY = P.y - visibleRipple - 36;
            maxY = Math.max(lineY + 58, P.y + visibleRipple + 36);
        } else if (currentScene === "square-construction") {
            minY = Math.min(minY, P.y - 95);
            maxY = Math.max(maxY, lineY + 76);
        } else {
            minY = Math.min(minY, P.y - 80);
            maxY = Math.max(maxY, lineY + 82);
        }

        if (currentScene === "ripple-wavefront") {
            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }

        return {
            x: Math.max(0, minX),
            y: Math.max(0, minY),
            width: Math.min(baseBoard.width, maxX) - Math.max(0, minX),
            height: Math.min(baseBoard.height, maxY) - Math.max(0, minY)
        };
    }

    function fitStageToFrame() {
        const rect = sandboxWrapper.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const bounds = getSceneFocusBounds();
        const isRipple = currentScene === "ripple-wavefront";
        const safeX = rect.width < 760 ? 34 : (isRipple ? 58 : 48);
        const safeTop = rect.height < 560 ? 44 : (isRipple ? 38 : 52);
        const safeBottom = rect.height < 560 ? 28 : (isRipple ? 52 : 68);
        const innerW = Math.max(280, rect.width - safeX * 2);
        const innerH = Math.max(260, rect.height - safeTop - safeBottom);
        const scaleX = innerW / bounds.width;
        const scaleY = innerH / bounds.height;
        zoomScale = Math.min(scaleX, scaleY) * (isRipple ? 0.94 : 0.96);
        zoomScale = Math.max(0.88, Math.min(isRipple ? 1.42 : 1.72, zoomScale));
        panX = Math.round(safeX + (innerW - bounds.width * zoomScale) / 2 - bounds.x * zoomScale);
        panY = Math.round(safeTop + (innerH - bounds.height * zoomScale) * 0.5 - bounds.y * zoomScale);
        updateTransform();
    }

    function getBoardPointFromEvent(clientX, clientY) {
        const rect = sandboxWrapper.getBoundingClientRect();
        return {
            x: (clientX - rect.left - panX) / zoomScale,
            y: (clientY - rect.top - panY) / zoomScale
        };
    }

    function updateTransform() {
        sandboxSvg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        htmlOverlay.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        rulerToolLayer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        sandboxSvg.setAttribute("viewBox", `0 0 ${baseBoard.width} ${baseBoard.height}`);
    }

    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (e) => {
        if (e.target === modalHelp) modalHelp.classList.remove("active");
    });

    // 暴露状态接口
    window.appState = {
        get currentScene() { return currentScene; },
        get constProgress() { return constProgress; },
        set constProgress(val) { constProgress = val; },
        loadScene,
        applyPreset,
        render
    };

    function syncSliders() {
        const sliderSweep = document.getElementById("slider-sweep-pos");
        if (sliderSweep) {
            sliderSweep.value = Math.round(Q.x);
            const valInd = document.getElementById("val-indicator-sweep");
            if (valInd) valInd.textContent = Math.round(Q.x);
        }
        const sliderConst = document.getElementById("slider-const-progress");
        if (sliderConst) {
            sliderConst.value = (constProgress * 100).toFixed(0);
            const valInd = document.getElementById("val-indicator-const");
            if (valInd) valInd.textContent = (constProgress * 100).toFixed(0) + "%";
        }
        const sliderRipple = document.getElementById("slider-ripple-radius");
        if (sliderRipple) {
            sliderRipple.value = rippleRadius.toFixed(0);
            const valInd = document.getElementById("val-indicator-radius");
            if (valInd) valInd.textContent = Math.round(rippleRadius) + " px";
        }
        const sliderRescue = document.getElementById("slider-rescue-target");
        if (sliderRescue) {
            sliderRescue.value = Math.round(rescueTargetX);
            const valInd = document.getElementById("val-indicator-rescue");
            if (valInd) valInd.textContent = Math.round(rescueTargetX);
        }
    }

    function render() {
        renderSVG();
        renderRulerTools();
        renderHTMLOverlay();
        drawDistanceCurve();
        syncSliders();
    }

    // 初始化场景并启动循环
    loadScene("radar-sweep");
    fitStageToFrame();
    render();
    requestAnimationFrame(updateFrame);

    window.addEventListener("resize", () => {
        fitStageToFrame();
        render();
    });
});

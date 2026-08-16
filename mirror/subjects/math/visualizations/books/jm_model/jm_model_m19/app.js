document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper") || document.querySelector("#sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg") || document.querySelector("#sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay") || document.querySelector("#html-overlay");
    const floatTip = document.getElementById("float-tip") || document.querySelector("#float-tip");
    const hudPanel = document.getElementById("hud-panel") || document.querySelector("#hud-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn") || document.querySelector("#hud-toggle-btn");
    const stepsChalkboard = document.getElementById("steps-chalkboard") || document.querySelector("#steps-chalkboard");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");

    // 控制面板元素
    const slideK = document.getElementById("slide-k");
    const kValIndicator = document.getElementById("k-val-indicator");
    const alphaValIndicator = document.getElementById("alpha-val-indicator");
    const panelTotalValue = document.getElementById("val-panel-total");
    const panelMinValue = document.getElementById("val-panel-min");
    const panelDiffValue = document.getElementById("val-panel-diff");
    const routeStatus = document.getElementById("route-status");
    const btnProofPrev = document.getElementById("btn-proof-prev");
    const btnProofNext = document.getElementById("btn-proof-next");
    const btnAutoDemo = document.getElementById("btn-auto-demo");
    const proofStepIndicator = document.getElementById("proof-step-indicator");
    const presetButtonsContainer = document.getElementById("preset-buttons");
    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");

    // ==========================================================================
    // 2. 状态变量与几何参数
    // ==========================================================================
    let currentScene = "standard"; // standard
    let zoomScale = 1.0;
    let isHudExpanded = false;
    let proofStep = 0;       // 0: 自由探索, 1: 辅助角, 2: 垂线段PH, 3: 直线AH0最值
    
    // 速度比例参数
    let speedRatioK = 0.50;  // k = v1 / v2

    // 几何顶点状态 (物理像素坐标)
    let ptA = { ...getLayoutMetrics().startA }; // 沙地起点
    let ptB = { ...getLayoutMetrics().startB }; // 公路终点
    let ptP = { ...getLayoutMetrics().startP }; // 动点折返点

    // 拖拽相关
    let activeNode = null;
    let activeHandleElement = null;
    let dragOffset = { x: 0, y: 0 };
    let initialRenderRaf = 0;
    let isAutoDemoRunning = false;
    let autoDemoFrame = 0;
    let autoDemoTimers = [];
    let wrapperResizeObserver = null;

    function getLayoutMetrics() {
        const width = Math.max(1, sandboxWrapper?.clientWidth || 0);
        const height = Math.max(1, sandboxWrapper?.clientHeight || 0);
        const horizontalPad = Math.max(32, Math.round(width * 0.06));
        const roadPad = Math.max(48, Math.round(width * 0.08));
        const roadY = Math.round(height * 0.58);
        return {
            width,
            height,
            roadY,
            left: horizontalPad,
            right: Math.max(horizontalPad + 120, width - horizontalPad),
            roadLeft: roadPad,
            roadRight: Math.max(roadPad + 120, width - roadPad),
            startA: { x: Math.round(width * 0.28), y: Math.max(Math.max(48, Math.round(height * 0.08)), roadY - Math.min(220, Math.round(height * 0.26))) },
            startB: { x: Math.round(width * 0.74), y: roadY },
            startP: { x: Math.round(width * 0.52), y: roadY }
        };
    }

    function makeGeometryFromLayout(layout = getLayoutMetrics()) {
        return {
            ptA: { ...layout.startA },
            ptB: { ...layout.startB },
            ptP: { ...layout.startP }
        };
    }

    function resetGeometryToLayout(layout = getLayoutMetrics()) {
        const geometry = makeGeometryFromLayout(layout);
        ptA = geometry.ptA;
        ptB = geometry.ptB;
        ptP = geometry.ptP;
        return geometry;
    }

    // ==========================================================================
    // 3. 几何运算辅助函数
    // ==========================================================================
    function dist(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    // 获取画布参考中心点偏置
    function getCenterPosition() {
        return { x: sandboxWrapper.clientWidth / 2, y: sandboxWrapper.clientHeight / 2 };
    }

    function isLayoutReady() {
        return (sandboxWrapper?.clientWidth || 0) > 40 && (sandboxWrapper?.clientHeight || 0) > 40;
    }

    function scheduleInitialRender(attempt = 0) {
        if (initialRenderRaf) {
            window.cancelAnimationFrame(initialRenderRaf);
            initialRenderRaf = 0;
        }
        initialRenderRaf = window.requestAnimationFrame(() => {
            initialRenderRaf = 0;
            if (!isLayoutReady()) {
                if (attempt < 60) scheduleInitialRender(attempt + 1);
                return;
            }
            render();
        });
    }

    // 绘制角弧度及度数标记
    function drawAngleArc(center, rAngleRad, startXOffset, radius, strokeColor, labelText) {
        // center: B点, rAngleRad: 夹角弧度
        // 在 B 点绘制从公路(水平向左或向右)偏转的弧线
        const dir = startXOffset < 0 ? -1 : 1;
        const startAngle = dir === -1 ? Math.PI : 0;
        const endAngle = dir === -1 ? Math.PI - rAngleRad : rAngleRad; // SVG坐标系中Y轴向下，由此向下偏转

        const x1 = center.x + radius * Math.cos(startAngle);
        const y1 = center.y + radius * Math.sin(startAngle);
        const x2 = center.x + radius * Math.cos(endAngle);
        const y2 = center.y + radius * Math.sin(endAngle);

        // dir === -1 为逆时针(0)，dir === 1 为顺时针(1)
        const sweepFlag = dir === -1 ? 0 : 1;
        const d = `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2}`;

        const midAngle = (startAngle + endAngle) / 2;
        const lx = center.x + (radius + 15) * Math.cos(midAngle);
        const ly = center.y + (radius + 15) * Math.sin(midAngle);

        let labelHtml = "";
        if (labelText) {
            labelHtml = `<text x="${lx}" y="${ly}" font-size="11px" font-weight="700" fill="${strokeColor}" text-anchor="middle" dominant-baseline="middle">${labelText}</text>`;
        }

        return `
            <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="1.8" class="angle-arc-path"></path>
            ${labelHtml}
        `;
    }

    // 黄金路径碰撞粒子特效
    let lastSparkleTime = 0;
    function createSparkles(x, y) {
        const now = Date.now();
        if (now - lastSparkleTime < 1200) return;
        lastSparkleTime = now;

        // 浮动章
        const badge = document.createElement("div");
        badge.className = "perfect-ratio-badge";
        badge.textContent = "🏆 最省时折返点 (时间最短)";
        badge.style.left = `${x}px`;
        badge.style.top = `${y - 15}px`;
        sandboxWrapper.appendChild(badge);
        setTimeout(() => badge.remove(), 1200);

        // 星星扩散粒子
        for (let i = 0; i < 15; i++) {
            const p = document.createElement("div");
            p.className = "sparkle-particle";
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;

            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 55;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const rot = 180 + Math.random() * 360;

            p.style.setProperty("--dx", `${dx}px`);
            p.style.setProperty("--dy", `${dy}px`);
            p.style.setProperty("--rot", `${rot}deg`);

            sandboxWrapper.appendChild(p);
            setTimeout(() => p.remove(), 800);
        }
    }

    let sparkleTimer = null;
    function checkOptimalAndSparkle(px, py, targetX) {
        if (Math.abs(px - targetX) < 3.5) {
            if (sparkleTimer) return;
            sparkleTimer = setTimeout(() => {
                createSparkles(px, py);
                sparkleTimer = null;
            }, 120);
        }
    }

    // ==========================================================================
    // 4. 数学解析计算 (胡不归核心投影与最值求解)
    // ==========================================================================
    function calculateHuBugui() {
        const layout = getLayoutMetrics();
        const RoadY = layout.roadY;
        const alpha = Math.asin(speedRatioK); // sin(alpha) = k
        const dir = ptA.x < ptB.x ? -1 : 1;   // A 偏左时，辅助射线朝左偏；A 偏右时，朝右偏

        // 辅助射线 L2 的方向向量
        const u = {
            x: dir * Math.cos(alpha),
            y: Math.sin(alpha) // 向下偏 (y > RoadY)
        };

        // 终点 B 的位置
        const B = { x: ptB.x, y: ptB.y };

        // 动点 P 投影到射线 L2 得到点 H (使用标准的向量投影算法以确保 PH 与 L2 垂直)
        const BP = { x: ptP.x - B.x, y: ptP.y - B.y };
        const t_P = BP.x * u.x + BP.y * u.y;
        const H = {
            x: B.x + t_P * u.x,
            y: B.y + t_P * u.y
        };

        // 垂足 H0：起点 A 投影到射线 L2
        // 向量 BA
        const BA = { x: ptA.x - B.x, y: ptA.y - B.y };
        // BA 在 u 方向上的投影长度
        const t_proj = BA.x * u.x + BA.y * u.y;
        const H0 = {
            x: B.x + t_proj * u.x,
            y: B.y + t_proj * u.y
        };

        // 理论最值点 P0 是直垂线 AH0 与公路线 y = RoadY 的交点
        // 直线 AH0 满足 y - y_a = slope * (x - x_a) => x = x_a + (y - y_a) / slope
        // slope = (y_h0 - y_a) / (x_h0 - x_a)
        let P0_x = ptA.x;
        if (Math.abs(H0.x - ptA.x) > 1e-4) {
            const slope = (H0.y - ptA.y) / (H0.x - ptA.x);
            P0_x = ptA.x + (RoadY - ptA.y) / slope;
        }

        // 限制 P0_x 在合理展示区间内
        P0_x = Math.max(layout.roadLeft, Math.min(layout.roadRight, P0_x));
        const P0 = { x: P0_x, y: RoadY };

        // 计算 H0 的垂直对应点 (若 P = P0，H 应为 H0)
        // 实际行程用时 (等效距离) = AP + k * PB
        const valAP = dist(ptA, ptP);
        const valPB = dist(ptP, B);
        const valKPB = speedRatioK * valPB;
        const valTotal = valAP + valKPB;

        // 理论最短用时 = AH0 的长度 (因为 AP0 + P0H0 = AH0)
        const valMin = dist(ptA, H0);

        return {
            alpha,
            dir,
            u,
            H,
            H0,
            P0,
            valAP,
            valPB,
            valKPB,
            valTotal,
            valMin
        };
    }

    // ==========================================================================
    // 5. SVG 渲染逻辑
    // ==========================================================================
    function renderSVG() {
        const layout = getLayoutMetrics();
        const RoadY = layout.roadY;
        const svgWidth = layout.width;
        const svgHeight = layout.height;
        sandboxSvg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
        sandboxSvg.setAttribute("preserveAspectRatio", "none");
        const res = calculateHuBugui();
        const optimalDeltaPx = Math.abs(ptP.x - res.P0.x);
        const isNearOptimal = optimalDeltaPx < 4;
        let drawHtml = "";

        // 样式淡出层控制
        const isStep0 = proofStep === 0;
        const isStep1 = proofStep === 1;
        const isStep2 = proofStep === 2;
        const isStep3 = proofStep === 3;

        // 证明步骤的元素显隐类
        let clsAP = "";
        let clsPB = "";
        let clsL2 = "step-inactive-shape";
        let clsPH = "hidden";
        let clsAH0 = "hidden";
        let clsPtA = "";
        let clsPtB = "";
        let clsPtP = "";

        if (isStep1) {
            clsAP = "step-inactive-shape";
            clsPB = "step-inactive-shape";
            clsPtA = "step-inactive-shape";
            clsPtP = "step-inactive-shape";
            clsL2 = ""; // 高亮显示 L2
        } else if (isStep2) {
            clsAP = "step-inactive-shape";
            clsPtA = "step-inactive-shape";
            clsPB = "congruent-pulse-highlight"; // 闪烁高亮段 PB
            clsL2 = "";
            clsPH = ""; // 显现垂线段 PH
        } else if (isStep3) {
            clsAP = "step-inactive-shape";
            clsPB = "step-inactive-shape";
            clsL2 = "";
            clsPH = "";
            clsAH0 = ""; // 显现垂足最值线 AH0
        }

        // 注入渐变定义
        drawHtml += `
            <defs>
                <!-- 沙地沙黄渐变 -->
                <linearGradient id="sand-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#241f17" />
                    <stop offset="100%" stop-color="#19150f" />
                </linearGradient>
                <!-- 水泥路面深灰渐变 -->
                <linearGradient id="road-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#111827" />
                    <stop offset="100%" stop-color="#0f172a" />
                </linearGradient>
            </defs>
        `;

        // 1. 绘制背景划分：上方为沙地，下方为公路
        drawHtml += `
            <!-- 泥泞沙地背景区域 -->
            <rect x="0" y="0" width="${svgWidth}" height="${RoadY}" fill="url(#sand-grad)"></rect>
            
            <!-- 水泥路面背景区域 -->
            <rect x="0" y="${RoadY}" width="${svgWidth}" height="${Math.max(0, svgHeight - RoadY)}" fill="url(#road-grad)"></rect>
            <line x1="0" y1="${RoadY}" x2="${svgWidth}" y2="${RoadY}" class="concrete-road-border"></line>
        `;

        // 绘制物理脚印与公路风线纹理
        drawHtml += `
            <!-- 沙地区小乌龟足迹纹理 -->
            <path d="M ${Math.max(20, Math.round(svgWidth * 0.06))} ${Math.max(30, RoadY - 170)} Q ${Math.round(svgWidth * 0.18)} ${Math.max(50, RoadY - 105)} ${Math.round(svgWidth * 0.34)} ${Math.max(70, RoadY - 120)} Q ${Math.round(svgWidth * 0.46)} ${Math.max(40, RoadY - 150)} ${Math.round(svgWidth * 0.58)} ${Math.max(60, RoadY - 70)}" fill="none" class="footprint-path"></path>
            <path d="M ${Math.round(svgWidth * 0.08)} ${Math.max(20, RoadY - 250)} Q ${Math.round(svgWidth * 0.24)} ${Math.max(45, RoadY - 190)} ${Math.round(svgWidth * 0.4)} ${Math.max(35, RoadY - 210)} Q ${Math.round(svgWidth * 0.58)} ${Math.max(20, RoadY - 240)} ${Math.round(svgWidth * 0.76)} ${Math.max(55, RoadY - 120)}" fill="none" class="footprint-path"></path>
            
            <!-- 水泥公路水平疾驰风线 -->
            <line x1="${Math.round(svgWidth * 0.12)}" y1="${RoadY + 45}" x2="${Math.round(svgWidth * 0.32)}" y2="${RoadY + 45}" class="wind-speed-line"></line>
            <line x1="${Math.round(svgWidth * 0.42)}" y1="${RoadY + 55}" x2="${Math.round(svgWidth * 0.6)}" y2="${RoadY + 55}" class="wind-speed-line"></line>
            <line x1="${Math.round(svgWidth * 0.66)}" y1="${RoadY + 45}" x2="${Math.round(svgWidth * 0.88)}" y2="${RoadY + 45}" class="wind-speed-line"></line>
        `;

        // 2. 绘制辅助射线 L2 (sin alpha = k)
        if (proofStep >= 1) {
            const extLen = Math.max(180, Math.min(420, svgWidth * 0.32)); // 射线延长长度
            const endX = ptB.x + extLen * res.u.x;
            const endY = ptB.y + extLen * res.u.y;

            drawHtml += `
                <!-- 辅助射线 L2 -->
                <line x1="${ptB.x}" y1="${ptB.y}" x2="${endX}" y2="${endY}" stroke="var(--color-gold)" stroke-width="2.2" stroke-dasharray="6,4" class="${clsL2}"></line>
                
                <!-- 角度 α 弧线 -->
                <g class="${clsL2}">
                    ${drawAngleArc(ptB, res.alpha, res.dir, 45, "var(--color-gold)", "α")}
                </g>
            `;
        }

        // 3. 绘制垂线段 PH
        if (proofStep >= 2) {
            drawHtml += `
                <!-- 垂线段 PH -->
                <line x1="${ptP.x}" y1="${ptP.y}" x2="${res.H.x}" y2="${res.H.y}" class="aux-perp-line ${clsPH}" stroke-dasharray="2,2"></line>
                
                <!-- 点 H 标记 -->
                <circle cx="${res.H.x}" cy="${res.H.y}" r="3.5" fill="var(--color-purple)" class="${clsPH}"></circle>
            `;

            // 绘制直角符号在 H 处
            const sz = 8;
            const vH_P = { x: ptP.x - res.H.x, y: ptP.y - res.H.y };
            const lenH_P = dist(ptP, res.H);
            if (lenH_P > 1) {
                const uH_P = { x: vH_P.x / lenH_P, y: vH_P.y / lenH_P };
                const uL2 = res.u; // L2 射线单位向量
                
                const r1 = { x: res.H.x + sz * uL2.x, y: res.H.y + sz * uL2.y };
                const r2 = { x: res.H.x + sz * uL2.x + sz * uH_P.x, y: res.H.y + sz * uL2.y + sz * uH_P.y };
                const r3 = { x: res.H.x + sz * uH_P.x, y: res.H.y + sz * uH_P.y };

                drawHtml += `
                    <polygon points="${res.H.x},${res.H.y} ${r1.x},${r1.y} ${r2.x},${r2.y} ${r3.x},${r3.y}" class="perp-symbol ${clsPH}"></polygon>
                `;
            }
        }

        // 4. 绘制直线 AH0 及最值点 P0
        if (proofStep >= 3) {
            drawHtml += `
                <!-- 直直穿过公路到达 L2 的直线 AH0 -->
                <line x1="${ptA.x}" y1="${ptA.y}" x2="${res.H0.x}" y2="${res.H0.y}" class="optimal-highlight-line ${clsAH0}" stroke-dasharray="4,3" stroke-opacity="0.9"></line>
                
                <!-- 垂直足点 H0 -->
                <circle cx="${res.H0.x}" cy="${res.H0.y}" r="4.5" fill="var(--color-safe)" stroke="#ffffff" stroke-width="1" class="${clsAH0}"></circle>
                
                <!-- 理论最优折返点 P0 -->
                <circle cx="${res.P0.x}" cy="${res.P0.y}" r="6.5" fill="var(--color-safe)" class="drag-handle ${clsAH0}" stroke="#ffffff" stroke-width="1.8" title="理论最快折返位置"></circle>
            `;

            // 绘制直角符号在 H0 处
            const sz = 8;
            const vH0_A = { x: ptA.x - res.H0.x, y: ptA.y - res.H0.y };
            const lenH0_A = dist(ptA, res.H0);
            if (lenH0_A > 1) {
                const uH0_A = { x: vH0_A.x / lenH0_A, y: vH0_A.y / lenH0_A };
                const uL2 = res.u;
                
                const r1 = { x: res.H0.x + sz * uL2.x, y: res.H0.y + sz * uL2.y };
                const r2 = { x: res.H0.x + sz * uL2.x + sz * uH0_A.x, y: res.H0.y + sz * uL2.y + sz * uH0_A.y };
                const r3 = { x: res.H0.x + sz * uH0_A.x, y: res.H0.y + sz * uH0_A.y };

                drawHtml += `
                    <polygon points="${res.H0.x},${res.H0.y} ${r1.x},${r1.y} ${r2.x},${r2.y} ${r3.x},${r3.y}" class="perp-symbol ${clsAH0}"></polygon>
                `;
            }
        }

        if (proofStep === 0) {
            drawHtml += `
                <line x1="${res.P0.x}" y1="${RoadY - 18}" x2="${res.P0.x}" y2="${RoadY + 18}" class="p0-guide-line"></line>
                <circle cx="${res.P0.x}" cy="${res.P0.y}" r="5.5" class="p0-guide-marker"></circle>
            `;
        }

        // 5. 绘制行程折线：AP (在沙地里)
        drawHtml += `
            <line x1="${ptA.x}" y1="${ptA.y}" x2="${ptP.x}" y2="${ptP.y}" class="path-line-ap ${clsAP} ${isNearOptimal ? 'optimal-current-line' : ''}" stroke-width="${isStep1 ? 1.5 : 3}"></line>
        `;

        // 6. 绘制行程折线：PB (在水泥路上)
        drawHtml += `
            <line x1="${ptP.x}" y1="${ptP.y}" x2="${ptB.x}" y2="${ptB.y}" class="path-line-pb ${clsPB} ${isNearOptimal ? 'optimal-current-line' : ''}" stroke-width="${isStep1 ? 1.5 : 3}"></line>
        `;

        // 7. 绘制可拖拽顶点
        drawHtml += `
            <circle cx="${ptA.x}" cy="${ptA.y}" r="26" class="drag-hit-area ${clsPtA}" data-point="A"></circle>
            <circle cx="${ptB.x}" cy="${ptB.y}" r="26" class="drag-hit-area ${clsPtB}" data-point="B"></circle>
            <circle cx="${ptP.x}" cy="${ptP.y}" r="30" class="drag-hit-area ${clsPtP}" data-point="P"></circle>

            <!-- 起点 A (沙地里) -->
            <circle cx="${ptA.x}" cy="${ptA.y}" r="10" class="drag-handle drag-handle-danger ${clsPtA}" data-point="A" title="拖动起点位置"></circle>
            
            <!-- 终点 B (水泥路上) -->
            <circle cx="${ptB.x}" cy="${ptB.y}" r="10" class="drag-handle drag-handle-blue ${clsPtB}" data-point="B" title="拖动终点位置"></circle>
            
            <!-- 动折返点 P (水泥路上滑行) -->
            <circle cx="${ptP.x}" cy="${ptP.y}" r="12" class="drag-handle drag-handle-blue ${clsPtP} ${isNearOptimal ? 'optimal-current-point' : ''}" data-point="P" stroke-width="2.5" title="左右拖动折返点 P"></circle>
        `;

        sandboxSvg.innerHTML = drawHtml;
        bindHandleEvents();

        // 检验是否碰撞到最优解点 P0，如果碰撞则触发星星粒子特效
        if (proofStep >= 3 || isStep0) {
            checkOptimalAndSparkle(ptP.x, ptP.y, res.P0.x);
        }
    }

    // ==========================================================================
    // 6. HTML 覆面渲染 (数据标签与度数)
    // ==========================================================================
    function renderHTMLOverlay() {
        const res = calculateHuBugui();
        const layout = getLayoutMetrics();
        let html = "";

        const k = speedRatioK;
        
        // 样式类控制
        const isStep1 = proofStep === 1;
        const isStep2 = proofStep === 2;
        const isStep3 = proofStep === 3;

        const clsA = (isStep1 || isStep2) ? "step-inactive-shape" : "";
        const clsP = isStep1 ? "step-inactive-shape" : "";
        const clsB = ""; 

        // 物理速度意象
        const areaLabelLeft = Math.max(26, Math.round(layout.width * 0.05));
        const sandLabelTop = Math.max(22, Math.min(42, layout.roadY - 96));
        const roadLabelTop = Math.min(layout.height - 42, layout.roadY + 16);
        html += `<div class="speed-entity-label sand-label ${isStep1 ? 'step-inactive-shape' : ''}" style="left:${areaLabelLeft}px; top:${sandLabelTop}px;">🐢 沙地慢速区 (v₁ = ${(10*k).toFixed(1)} km/h)</div>`;
        html += `<div class="speed-entity-label road-label ${isStep1 ? 'step-inactive-shape' : ''}" style="left:${areaLabelLeft}px; top:${roadLabelTop}px;">🏃 公路快速区 (v₂ = 10.0 km/h)</div>`;

        // 起点 A 标签
        html += `<div class="floating-label ${clsA}" style="left:${ptA.x}px; top:${ptA.y - 18}px;">A (沙地)</div>`;
        // 终点 B 标签
        html += `<div class="floating-label ${clsB}" style="left:${ptB.x}px; top:${ptB.y + 18}px;">B (家)</div>`;
        // 折返点 P 标签
        html += `<div class="floating-label ${clsP}" style="left:${ptP.x}px; top:${ptP.y - 18}px; color:var(--color-blue);">P</div>`;

        if (proofStep >= 2) {
            html += `<div class="floating-label" style="left:${res.H.x}px; top:${res.H.y + 16}px; color:var(--color-purple);">H</div>`;
        }

        if (proofStep >= 3) {
            html += `<div class="floating-label" style="left:${res.H0.x}px; top:${res.H0.y + 16}px; color:var(--color-safe);">H₀</div>`;
            html += `<div class="floating-label" style="left:${res.P0.x}px; top:${res.P0.y + 18}px; color:var(--color-safe);">P₀</div>`;
        }

        // 数据测量标签 (厘米 cm：物理像素 / 10)
        const valAP_cm = (res.valAP / 10).toFixed(1);
        const valPB_cm = (res.valPB / 10).toFixed(1);
        const valKPB_cm = (res.valKPB / 10).toFixed(1);

        // AP 线段中点气泡
        html += `<div class="floating-text-badge color-blue ${clsA}" style="left:${(ptA.x + ptP.x)/2}px; top:${(ptA.y + ptP.y)/2}px;">AP = ${valAP_cm}</div>`;

        if (proofStep === 0 || proofStep === 1) {
            // PB 线段中点气泡
            html += `<div class="floating-text-badge color-red ${clsP}" style="left:${(ptP.x + ptB.x)/2}px; top:${ptP.y + 16}px;">PB = ${valPB_cm}</div>`;
        } else {
            // 步骤 2 以上渲染折线 PH
            const valPH_cm = (dist(ptP, res.H) / 10).toFixed(1);
            html += `<div class="floating-text-badge color-purple" style="left:${(ptP.x + res.H.x)/2}px; top:${(ptP.y + res.H.y)/2 - 12}px;">PH = k·PB = ${valPH_cm}</div>`;
        }

        htmlOverlay.innerHTML = html;

        // 更新仪表盘用时指标
        const currentScore = (res.valTotal / 10);
        const minScore = (res.valMin / 10);
        const diffScore = Math.max(0, currentScore - minScore);
        
        const totalTimeEl = document.getElementById("val-total-time") || document.querySelector("#val-total-time");
        const minTimeEl = document.getElementById("val-min-time") || document.querySelector("#val-min-time");
        if (totalTimeEl) totalTimeEl.textContent = currentScore.toFixed(2);
        if (minTimeEl) minTimeEl.textContent = minScore.toFixed(2);

        // 差值比例
        const diffPercent = ((currentScore - minScore) / minScore * 100);
        const effText = document.getElementById("val-efficiency") || document.querySelector("#val-efficiency");
        if (panelTotalValue) panelTotalValue.textContent = currentScore.toFixed(2);
        if (panelMinValue) panelMinValue.textContent = minScore.toFixed(2);
        if (panelDiffValue) panelDiffValue.textContent = `+${diffScore.toFixed(2)}`;
        if (routeStatus) {
            routeStatus.textContent = diffPercent < 0.2 ? "P 已对齐 P₀，当前为最短路线" : `把 P 向 P₀ 移动，还可减少 ${diffScore.toFixed(2)} cm`;
            routeStatus.classList.toggle("is-optimal", diffPercent < 0.2);
        }

        if (diffPercent < 0.2) {
            if (effText) {
            effText.textContent = "已达最优路线！";
            effText.style.color = "var(--color-safe)";
            }
            if (floatTip) {
                floatTip.classList.remove("hidden");
                floatTip.style.left = `${ptP.x}px`;
                floatTip.style.top = `${ptP.y}px`;
            }
        } else {
            if (effText) {
            effText.textContent = `超额用时: +${diffPercent.toFixed(1)}%`;
            effText.style.color = "var(--color-purple)";
            }
            if (floatTip) floatTip.classList.add("hidden");
        }

        // 进度条位置更新 (限制最大量程 2.0 倍 minScore)
        const gaugeCurrent = document.getElementById("gauge-current") || document.querySelector("#gauge-current");
        const gaugeMin = document.getElementById("gauge-min") || document.querySelector("#gauge-min");
        
        const ratioCurrent = Math.min(100, (currentScore / (minScore * 1.6)) * 100);
        const ratioMin = (minScore / (minScore * 1.6)) * 100;

        if (gaugeCurrent) gaugeCurrent.style.width = `${ratioCurrent}%`;
        if (gaugeMin) gaugeMin.style.left = `${ratioMin}%`;
    }

    // ==========================================================================
    // 7. HUD 板书推导与步骤渲染
    // ==========================================================================
    function renderHUDChalkboard() {
        if (!stepsChalkboard) return;
        const res = calculateHuBugui();
        const k = speedRatioK.toFixed(2);
        const valAP = (res.valAP / 10).toFixed(2);
        const valPB = (res.valPB / 10).toFixed(2);
        const valKPB = (res.valKPB / 10).toFixed(2);
        const valTotal = (res.valTotal / 10).toFixed(2);
        const valMin = (res.valMin / 10).toFixed(2);
        let html = "";

        if (proofStep === 0) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">💡 胡不归最值</div>
                    <div class="hud-mini-list">
                        <div>目标：<strong>AP + k·PB</strong> 最小</div>
                        <div>A 在沙地，B 在公路</div>
                        <div>拖动 <strong>P</strong> 找最优点</div>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">📊 当前测算</div>
                    <div class="hud-formula-block">
                        AP = <strong>${valAP}</strong> cm<br>
                        PB = <strong>${valPB}</strong> cm<br>
                        <strong>k·PB</strong> = ${k} × ${valPB} = <strong>${valKPB}</strong> cm<br>
                        总量 = <strong>${valTotal}</strong> cm
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">🎯 结论</div>
                    <div class="hud-mini-note">把 <strong>P</strong> 拖到最短点，等效距离最小。</div>
                </div>
            `;
        } else if (proofStep === 1) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-gold);">步骤 1/3：构造辅助角</div>
                    <div class="hud-formula-block">
                        sin α = k = <strong>${k}</strong><br>
                        α ≈ <strong>${(res.alpha * 180 / Math.PI).toFixed(1)}°</strong>
                    </div>
                    <div class="hud-mini-note">过 <strong>B</strong> 作射线 <strong>L₂</strong>，令 <strong>sin α = k</strong>。</div>
                </div>
            `;
        } else if (proofStep === 2) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-gold);">步骤 2/3：等量替换</div>
                    <div class="hud-formula-block">
                        在直角三角形 <strong>PBH</strong> 中，∠PBH = α<br>
                        sin α = PH / PB = k<br>
                        <strong>PH = k·PB</strong><br>
                        <strong>AP + k·PB = AP + PH</strong>
                    </div>
                    <div class="hud-mini-note">把加权项换成垂线段，转成最短线段问题。</div>
                </div>
            `;
        } else if (proofStep === 3) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-gold);">步骤 3/3：最短路径</div>
                    <div class="hud-formula-block">
                        过 <strong>A</strong> 向 <strong>L₂</strong> 作垂线，垂足为 <strong>H₀</strong><br>
                        直线 <strong>AH₀</strong> 与公路交于 <strong>P₀</strong><br>
                        AP + PH &ge; AH₀ = <strong>${valMin}</strong> cm
                    </div>
                    <div class="hud-mini-note">当 <strong>P = P₀</strong> 时，等效距离最小。</div>
                </div>
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 拖拽与交互处理
    // ==========================================================================
    function bindHandleEvents() {
        const handles = sandboxSvg.querySelectorAll(".drag-handle[data-point], .drag-hit-area[data-point]");
        handles.forEach(handle => {
            handle.addEventListener("mousedown", onDragStart);
            handle.addEventListener("touchstart", onDragStart, { passive: false });
        });
    }

    function onDragStart(e) {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const pointName = e.currentTarget?.getAttribute("data-point") || e.target?.getAttribute?.("data-point");
        if (!pointName) return;
        stopAutoDemo();
        activeNode = pointName;
        activeHandleElement = e.currentTarget;

        const rect = sandboxSvg.getBoundingClientRect();
        const mouseX = (clientX - rect.left) / zoomScale;
        const mouseY = (clientY - rect.top) / zoomScale;

        // 计算偏移量
        if (pointName === "A") {
            dragOffset.x = mouseX - ptA.x;
            dragOffset.y = mouseY - ptA.y;
        } else if (pointName === "B") {
            dragOffset.x = mouseX - ptB.x;
            dragOffset.y = 0; // B 点锁死在公路 y = 320 上
        } else if (pointName === "P") {
            dragOffset.x = mouseX - ptP.x;
            dragOffset.y = 0; // P 点锁死在公路 y = 320 上
        }

        e.currentTarget.classList.add("active");
        const visibleHandle = sandboxSvg.querySelector(`.drag-handle[data-point="${pointName}"]`);
        if (visibleHandle) visibleHandle.classList.add("active");

        window.addEventListener("mousemove", onDragging);
        window.addEventListener("touchmove", onDragging, { passive: false });
        window.addEventListener("mouseup", onDragEnd);
        window.addEventListener("touchend", onDragEnd);
        window.addEventListener("touchcancel", onDragEnd);
    }

    function onDragging(e) {
        if (!activeNode) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const rect = sandboxSvg.getBoundingClientRect();
        const mouseX = (clientX - rect.left) / zoomScale;
        const mouseY = (clientY - rect.top) / zoomScale;
        const layout = getLayoutMetrics();

        if (activeNode === "A") {
            ptA.x = Math.max(layout.left, Math.min(layout.right, mouseX - dragOffset.x));
            // A 点必须在沙地中（RoadY 上方），留出 20px 安全边界
            ptA.y = Math.max(Math.max(36, Math.round(layout.height * 0.06)), Math.min(layout.roadY - 20, mouseY - dragOffset.y));
        } else if (activeNode === "B") {
            // B 点在公路上移动，限制 x 范围
            ptB.x = Math.max(layout.roadLeft, Math.min(layout.roadRight, mouseX - dragOffset.x));
        } else if (activeNode === "P") {
            // P 点在公路滑动
            const bounds = getFoldPointBounds(layout);
            ptP.x = Math.max(bounds.min, Math.min(bounds.max, mouseX - dragOffset.x));
        }

        constrainGeometry();
        render();
    }

    function getFoldPointBounds(layout = getLayoutMetrics()) {
        if (ptA.x <= ptB.x) {
            return {
                min: layout.roadLeft,
                max: Math.max(layout.roadLeft, ptB.x)
            };
        }
        return {
            min: Math.min(layout.roadRight, ptB.x),
            max: layout.roadRight
        };
    }

    function constrainGeometry() {
        const layout = getLayoutMetrics();
        const h = layout.roadY - ptA.y;
        // 保证 L2 射线投影足 H0 在公路下侧，即 A-P0-H0 成立的最小 X 间距
        const minDX = h * speedRatioK / Math.sqrt(Math.max(0.0001, 1 - speedRatioK * speedRatioK)) + 15;
        if (ptA.x < ptB.x) {
            if (ptB.x - ptA.x < minDX) {
                if (activeNode === "A") {
                    ptA.x = ptB.x - minDX;
                } else {
                    ptB.x = ptA.x + minDX;
                }
            }
        } else {
            if (ptA.x - ptB.x < minDX) {
                if (activeNode === "A") {
                    ptA.x = ptB.x + minDX;
                } else {
                    ptB.x = ptA.x - minDX;
                }
            }
        }
        ptA.x = Math.max(layout.left, Math.min(layout.right, ptA.x));
        ptB.x = Math.max(layout.roadLeft, Math.min(layout.roadRight, ptB.x));
        const foldBounds = getFoldPointBounds(layout);
        ptP.x = Math.max(foldBounds.min, Math.min(foldBounds.max, ptP.x));
        ptP.y = layout.roadY;
    }

    function onDragEnd() {
        if (!activeNode) return;
        const handle = sandboxSvg.querySelector(`.drag-handle[data-point="${activeNode}"]`);
        if (handle) handle.classList.remove("active");
        if (activeHandleElement) activeHandleElement.classList.remove("active");

        activeNode = null;
        activeHandleElement = null;
        window.removeEventListener("mousemove", onDragging);
        window.removeEventListener("touchmove", onDragging);
        window.removeEventListener("mouseup", onDragEnd);
        window.removeEventListener("touchend", onDragEnd);
        window.removeEventListener("touchcancel", onDragEnd);
    }

    // ==========================================================================
    // 9. 预设场景加载与理论更新
    // ==========================================================================
    function updateScenePresetsAndTheory() {
        let presetHtml = `
            <button class="btn-preset-problem" data-preset="mud-swamp">泥沼 k=0.50</button>
            <button class="btn-preset-problem" data-preset="fast-highway">快路 k=0.35</button>
            <button class="btn-preset-problem" data-preset="deep-desert">深沙 k=0.70</button>
        `;
        let theoryTitleText = "📌 关键结论";
        let theoryBody = `
            <div class="theory-short-row"><strong>1.</strong> 目标：<strong>AP + k·PB</strong> 最小</div>
            <div class="theory-short-row"><strong>2.</strong> 构造：<strong>sin α = k</strong></div>
            <div class="theory-short-row"><strong>3.</strong> 结论：<strong>P = P₀</strong> 时最短</div>
        `;

        if (presetButtonsContainer) presetButtonsContainer.innerHTML = presetHtml;
        if (theoryTitle) theoryTitle.textContent = theoryTitleText;
        if (theoryText) theoryText.innerHTML = theoryBody;

        // 缁戝畾鐐瑰嚮
        document.querySelectorAll(".btn-preset-problem").forEach(btn => {
            btn.addEventListener("click", () => {
                applyPreset(btn.getAttribute("data-preset"));
            });
        });
    }

    function applyPreset(presetId) {
        stopAutoDemo();
        const layout = getLayoutMetrics();
        if (presetId === "mud-swamp") {
            speedRatioK = 0.50;
            ptA = { ...layout.startA };
            ptB = { ...layout.startB };
            ptP = { x: Math.round(layout.width * 0.48), y: layout.roadY };
        } else if (presetId === "fast-highway") {
            // 公路速度极快，k = 0.35，α = 20.5°
            speedRatioK = 0.35;
            ptA = { x: Math.round(layout.width * 0.26), y: Math.max(48, layout.roadY - Math.round(layout.height * 0.30)) };
            ptB = { x: Math.round(layout.width * 0.78), y: layout.roadY };
            ptP = { x: Math.round(layout.width * 0.44), y: layout.roadY };
        } else if (presetId === "deep-desert") {
            // 沙地泥泞，k = 0.70，α = 44.4°
            speedRatioK = 0.70;
            ptA = { x: Math.round(layout.width * 0.32), y: Math.max(48, layout.roadY - Math.round(layout.height * 0.22)) };
            ptB = { x: Math.round(layout.width * 0.68), y: layout.roadY };
            ptP = { x: Math.round(layout.width * 0.54), y: layout.roadY };
        }

        constrainGeometry();

        // 更新滑块
        if (slideK) {
            slideK.value = speedRatioK;
            kValIndicator.textContent = speedRatioK.toFixed(2);
            const alphaDeg = (Math.asin(speedRatioK) * 180 / Math.PI).toFixed(0);
            alphaValIndicator.textContent = alphaDeg;
        }

        proofStep = 0;
        updateProofStepUI();
        render();
    }

    function scheduleAutoDemo(fn, delay) {
        const timer = window.setTimeout(() => {
            autoDemoTimers = autoDemoTimers.filter(id => id !== timer);
            if (isAutoDemoRunning) fn();
        }, delay);
        autoDemoTimers.push(timer);
        return timer;
    }

    function stopAutoDemo() {
        if (!isAutoDemoRunning && autoDemoTimers.length === 0 && !autoDemoFrame) return;
        isAutoDemoRunning = false;
        autoDemoTimers.forEach(timer => window.clearTimeout(timer));
        autoDemoTimers = [];
        if (autoDemoFrame) {
            window.cancelAnimationFrame(autoDemoFrame);
            autoDemoFrame = 0;
        }
        if (btnAutoDemo) {
            btnAutoDemo.disabled = false;
            btnAutoDemo.textContent = "自动演示";
        }
    }

    function setDemoStep(step) {
        proofStep = step;
        updateProofStepUI();
        render();
    }

    function movePToOptimal(duration = 1200, onDone) {
        const startX = ptP.x;
        const targetX = calculateHuBugui().P0.x;
        const startedAt = performance.now();

        const tick = now => {
            if (!isAutoDemoRunning) return;
            const t = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const layout = getLayoutMetrics();
            ptP.x = Math.max(layout.roadLeft, Math.min(layout.roadRight, startX + (targetX - startX) * eased));
            ptP.y = layout.roadY;
            render();

            if (t < 1) {
                autoDemoFrame = window.requestAnimationFrame(tick);
            } else {
                autoDemoFrame = 0;
                if (onDone) onDone();
            }
        };

        autoDemoFrame = window.requestAnimationFrame(tick);
    }

    function runAutoDemo() {
        stopAutoDemo();
        isAutoDemoRunning = true;
        if (btnAutoDemo) {
            btnAutoDemo.disabled = true;
            btnAutoDemo.textContent = "演示中...";
        }

        const layout = getLayoutMetrics();
        const optimalX = calculateHuBugui().P0.x;
        const offset = Math.max(90, Math.round(layout.width * 0.16));
        const demoStartX = optimalX + offset < layout.roadRight ? optimalX + offset : optimalX - offset;
        ptP = { x: Math.max(layout.roadLeft, Math.min(layout.roadRight, demoStartX)), y: layout.roadY };

        setDemoStep(0);
        scheduleAutoDemo(() => setDemoStep(1), 700);
        scheduleAutoDemo(() => setDemoStep(2), 1650);
        scheduleAutoDemo(() => {
            setDemoStep(3);
            movePToOptimal(1350, () => {
                isAutoDemoRunning = false;
                if (btnAutoDemo) {
                    btnAutoDemo.disabled = false;
                    btnAutoDemo.textContent = "自动演示";
                }
                render();
            });
        }, 2700);
    }

    function updateProofStepUI() {
        if (!proofStepIndicator) return;
        if (proofStep === 0) {
            proofStepIndicator.textContent = "自由探索模式";
            proofStepIndicator.style.color = "var(--text-secondary)";
        } else {
            proofStepIndicator.textContent = `证明步骤 ${proofStep} / 3`;
            proofStepIndicator.style.color = "var(--color-purple)";
        }
    }

    // ==========================================================================
    // 10. 事件处理器绑定与初始化
    // ==========================================================================
    // 监听 k 比率滑块变化
    if (slideK) {
        slideK.addEventListener("input", (e) => {
            stopAutoDemo();
            speedRatioK = parseFloat(e.target.value);
            kValIndicator.textContent = speedRatioK.toFixed(2);
            
            // 实时更新辅助角 α 的度数值
            const alphaDeg = (Math.asin(speedRatioK) * 180 / Math.PI).toFixed(0);
            alphaValIndicator.textContent = alphaDeg;
            
            constrainGeometry();
            render();
        });
    }

    // 监听分步讲解按钮
    if (btnProofPrev && btnProofNext) {
        btnProofPrev.addEventListener("click", () => {
            stopAutoDemo();
            proofStep = (proofStep - 1 + 4) % 4;
            updateProofStepUI();
            render();
        });

        btnProofNext.addEventListener("click", () => {
            stopAutoDemo();
            proofStep = (proofStep + 1) % 4;
            updateProofStepUI();
            render();
        });
    }

    if (btnAutoDemo) {
        btnAutoDemo.addEventListener("click", runAutoDemo);
    }

    function updateTransform() {
        sandboxSvg.style.transform = `scale(${zoomScale})`;
        htmlOverlay.style.transform = `scale(${zoomScale})`;
    }

    // 恢复状态按键
    if (btnResetState) btnResetState.addEventListener("click", () => {
        stopAutoDemo();
        zoomScale = 1.0;
        updateTransform();
        
        speedRatioK = 0.50;
        if (slideK) {
            slideK.value = 0.50;
            kValIndicator.textContent = "0.50";
            alphaValIndicator.textContent = "30";
        }

        const layout = getLayoutMetrics();
        ptA = { ...layout.startA };
        ptB = { ...layout.startB };
        ptP = { ...layout.startP };

        proofStep = 0;
        updateProofStepUI();

        if (floatTip) floatTip.classList.add("hidden");
        render();
    });

    // 看板折叠
    if (hudPanel && hudToggleBtn) hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
            hudToggleBtn.textContent = "◀";
        } else {
            hudPanel.classList.add("collapsed");
            hudToggleBtn.textContent = "▶";
        }
        // 重绘以适配新宽度
        setTimeout(render, 350);
    });

    // 帮助说明遮罩层
    // 外部调试接口暴露
    window.appState = {
        get currentScene() { return currentScene; },
        applyPreset,
        render
    };

    function render() {
        renderSVG();
        renderHTMLOverlay();
        renderHUDChalkboard();
    }

    // 初始化运行
    updateScenePresetsAndTheory();
    updateProofStepUI();
    render();

    window.addEventListener("resize", () => {
        render();
    });
});

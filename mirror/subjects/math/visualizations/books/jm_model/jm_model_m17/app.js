document.addEventListener("DOMContentLoaded", () => {
    function preventTouchCallout(event) {
        const target = event.target;
        const interactive = target?.closest?.("button, input, label, .math-source-panel-scroll, .math-source-panel-content");
        if (interactive && event.type === "contextmenu") return;
        event.preventDefault();
    }

    document.addEventListener("contextmenu", preventTouchCallout);
    document.addEventListener("selectstart", preventTouchCallout);
    document.addEventListener("dragstart", preventTouchCallout);

    // ==========================================================================
    // 1. DOM 元素获取与配置
    // ==========================================================================
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const badgeContainer = document.getElementById("badge-container") || document.body;
    
    const slideBA = document.getElementById("slide-ba");
    const slideAB = document.getElementById("slide-ab");
    const valBA = document.getElementById("val-ba");
    const valABIndicator = document.getElementById("val-ab-indicator");
    const btnAutoplay = document.getElementById("btn-autoplay");
    const switchShowBisector = document.getElementById("switch-show-bisector");
    const switchLockRight = document.getElementById("switch-lock-right");
    
    // 教学优化控制
    const slideTheta = document.getElementById("slide-theta");
    const valThetaIndicator = document.getElementById("val-theta-indicator");
    const switchShowSimilarity = document.getElementById("switch-show-similarity");
    const switchShowEnvelope = document.getElementById("switch-show-envelope");
    const btnClearEnvelope = document.getElementById("btn-clear-envelope");
    
    const btnProofPrev = document.getElementById("btn-proof-prev");
    const btnProofNext = document.getElementById("btn-proof-next");
    const proofStepIndicator = document.getElementById("proof-step-indicator");
    const currentConclusionText = document.getElementById("current-conclusion-text");
    const stepsChalkboard = document.getElementById("steps-chalkboard");

    // 勾股定理数值看板
    const valBE2 = document.getElementById("val-be2");
    const valBA2 = document.getElementById("val-ba2");
    const valLeftSum = document.getElementById("val-left-sum");
    const valAE2 = document.getElementById("val-ae2");

    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");
    const btnZoomReset = document.getElementById("btn-zoom-reset");
    const btnResetState = document.getElementById("btn-reset-state");

    // ==========================================================================
    // 2. 状态变量与几何参数
    // ==========================================================================
    function getResponsiveZoomScale() {
        const width = document.documentElement?.clientWidth || window.innerWidth || 1024;
        return width <= 520 ? 0.78 : 1.0;
    }

    function getResponsivePanX() {
        const width = document.documentElement?.clientWidth || window.innerWidth || 1024;
        return width <= 520 ? -230 : 0;
    }

    let zoomScale = getResponsiveZoomScale();
    let hasManualZoom = false;
    let proofStep = 0;       // 0: 自由探索, 1: 对称本源, 2: 勾股方程, 3: 实战求解
    let abLength = 240;      // 纸张高度 a
    let bcLength = 400;      // 纸张宽度 b (固定为 400)
    let baLength = 120;      // 拖拽变量 x (落点 A' 距 B 的距离)
    let foldTheta = 180;     // 折叠角度 θ (0 到 180 度)
    let envelopeLines = [];  // 折痕历史轨迹包络线数组
    
    let isAutoplay = false;
    let autoplayFrame = null;
    let activeNode = null;
    let dragOffset = { x: 0, y: 0 };

    // 视口坐标系原点 B
    const originB = { x: 260, y: 440 };

    // ==========================================================================
    // 3. 几何解算辅助函数
    // ==========================================================================
    function dist(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    // 镜像反射一个点
    function reflectPoint(p, m, n) {
        const len = Math.hypot(n.x, n.y);
        if (len < 0.001) return { x: p.x, y: p.y };
        const ux = n.x / len;
        const uy = n.y / len;
        const dx = p.x - m.x;
        const dy = p.y - m.y;
        const dot = dx * ux + dy * uy;
        return {
            x: p.x - 2 * dot * ux,
            y: p.y - 2 * dot * uy
        };
    }

    // 向量夹角弧线绘制函数
    function drawArcBetweenVectors(pCenter, v1, v2, radius, color, labelText) {
        const a1 = Math.atan2(v1.y, v1.x);
        const a2 = Math.atan2(v2.y, v2.x);
        let diff = a2 - a1;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
        const sweep = diff > 0 ? 1 : 0;

        const x1 = pCenter.x + radius * Math.cos(a1);
        const y1 = pCenter.y + radius * Math.sin(a1);
        const x2 = pCenter.x + radius * Math.cos(a2);
        const y2 = pCenter.y + radius * Math.sin(a2);

        let path = `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="1.8" class="angle-arc"></path>`;

        if (labelText) {
            const bisectAngle = a1 + diff / 2;
            const tx = pCenter.x + (radius + 11) * Math.cos(bisectAngle);
            const ty = pCenter.y + (radius + 11) * Math.sin(bisectAngle);
            path += `<text x="${tx}" y="${ty + 4}" fill="${color}" class="angle-label" text-anchor="middle">${labelText}</text>`;
        }
        return path;
    }

    // 求解折纸参数 (带 3D 旋转角度及投影结算)
    function calculateFolding() {
        const a = abLength;
        const b = bcLength;
        const x = baLength;

        // 顶点纸张坐标 (以 B 为原点)
        const pB = { x: 0, y: 0 };
        const pA = { x: 0, y: a };
        const pC = { x: b, y: 0 };
        const pD = { x: b, y: a };
        const pAPrime = { x: x, y: 0 };

        const pM = { x: x / 2, y: a / 2 };
        const normal = { x: x, y: -a };

        const yE = (a * a - x * x) / (2 * a);
        const pE = { x: 0, y: yE };

        const xF = (a * a + x * x) / (2 * x);

        let pF = { x: 0, y: 0 };
        let isFOnCD = false;
        let pFPrimeOnCD = { x: 0, y: 0 };
        let pDReflected = { x: 0, y: 0 };

        if (xF <= b) {
            pF = { x: xF, y: a };
        } else {
            isFOnCD = true;
            const yF2 = (b * x + (a * a - x * x) / 2) / a;
            pFPrimeOnCD = { x: b, y: yF2 };
            pDReflected = reflectPoint(pD, pM, normal);
        }

        // 计算相似辅助交点 G (纸张坐标)
        let pG = { x: 0, y: 0 };
        let hasSimilarity = false;
        if (isFOnCD) {
            pG = { x: b, y: pFPrimeOnCD.y };
            hasSimilarity = true;
        } else {
            if (Math.abs(xF - x) > 0.01) {
                const yG = (a / (xF - x)) * (b - x);
                if (yG <= a && yG >= 0) {
                    pG = { x: b, y: yG };
                    hasSimilarity = true;
                }
            }
        }

        const toCanvas = (p) => ({
            x: originB.x + p.x,
            y: originB.y - p.y
        });

        const canvasA = toCanvas(pA);
        const canvasAPrime = toCanvas(pAPrime);
        const canvasE = toCanvas(pE);
        const canvasF = isFOnCD ? toCanvas(pFPrimeOnCD) : toCanvas(pF);
        const canvasD = toCanvas(pD);
        const canvasDPrime = toCanvas(pDReflected);
        const canvasM = toCanvas(pM);
        const canvasG = toCanvas(pG);

        // Project A onto EF axis in canvas coords
        const vAxis = { x: canvasF.x - canvasE.x, y: canvasF.y - canvasE.y };
        const lenSq = vAxis.x * vAxis.x + vAxis.y * vAxis.y;
        
        let canvasAPrimeRot = { ...canvasAPrime };
        let canvasDPrimeRot = { ...canvasDPrime };
        let shadowA = { ...canvasAPrime };
        let shadowD = { ...canvasDPrime };

        if (lenSq > 0.01) {
            // A projection
            const tA = ((canvasA.x - canvasE.x) * vAxis.x + (canvasA.y - canvasE.y) * vAxis.y) / lenSq;
            const projA = { x: canvasE.x + tA * vAxis.x, y: canvasE.y + tA * vAxis.y };
            const vAPrime = { x: canvasAPrime.x - projA.x, y: canvasAPrime.y - projA.y };
            
            // D projection
            const tD = ((canvasD.x - canvasE.x) * vAxis.x + (canvasD.y - canvasE.y) * vAxis.y) / lenSq;
            const projD = { x: canvasE.x + tD * vAxis.x, y: canvasE.y + tD * vAxis.y };
            const vDPrime = { x: canvasDPrime.x - projD.x, y: canvasDPrime.y - projD.y };

            // Rotate by theta
            const rad = foldTheta * Math.PI / 180;
            const cosVal = Math.cos(rad);
            const sinVal = Math.sin(rad); // 3D z height
            
            canvasAPrimeRot.x = projA.x - cosVal * vAPrime.x;
            canvasAPrimeRot.y = projA.y - cosVal * vAPrime.y;

            canvasDPrimeRot.x = projD.x - cosVal * vDPrime.x;
            canvasDPrimeRot.y = projD.y - cosVal * vDPrime.y;

            // Shadow offset
            const shadowOffset = sinVal * 16;
            shadowA.x = canvasAPrimeRot.x + shadowOffset * 0.8;
            shadowA.y = canvasAPrimeRot.y + shadowOffset * 0.5;
            shadowD.x = canvasDPrimeRot.x + shadowOffset * 0.8;
            shadowD.y = canvasDPrimeRot.y + shadowOffset * 0.5;
        }

        return {
            A: canvasA,
            B: toCanvas(pB),
            C: toCanvas(pC),
            D: canvasD,
            APrime: canvasAPrime,
            APrimeRot: canvasAPrimeRot,
            E: canvasE,
            F: canvasF,
            DPrime: canvasDPrime,
            DPrimeRot: canvasDPrimeRot,
            shadowA: shadowA,
            shadowD: shadowD,
            M: canvasM,
            G: canvasG,
            hasSimilarity,
            isFOnCD,
            yE,
            xF
        };
    }

    // ==========================================================================
    // 4. 矢量图形渲染 (SVG)
    // ==========================================================================
    function renderSVG() {
        const fold = calculateFolding();
        let drawHtml = "";

        const isStep0 = proofStep === 0;
        const isStep1 = proofStep === 1;
        const isStep2 = proofStep === 2;
        const isStep3 = proofStep === 3;

        // 注入模糊投影滤镜
        drawHtml += `<defs><filter id="shadow-blur"><feGaussianBlur stdDeviation="5" /></filter></defs>`;

        // 1. 绘制背景网格
        for (let i = 40; i < 800; i += 40) {
            drawHtml += `<line x1="${i}" y1="0" x2="${i}" y2="600" class="grid-line"></line>`;
            drawHtml += `<line x1="0" y1="${i}" x2="800" y2="${i}" class="grid-line"></line>`;
        }

        // 1.5 绘制折痕历史包络线
        if (switchShowEnvelope && switchShowEnvelope.checked && envelopeLines.length > 0) {
            envelopeLines.forEach(line => {
                drawHtml += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" class="envelope-trace-line"></line>`;
            });
        }

        // 2. 绘制原始矩形纸片底色 (半透明蓝色)
        const clsBase = isStep1 ? "step-inactive-shape" : "";
        drawHtml += `
            <polygon points="${fold.A.x},${fold.A.y} ${fold.D.x},${fold.D.y} ${fold.C.x},${fold.C.y} ${fold.B.x},${fold.B.y}" class="paper-base ${clsBase}"></polygon>
        `;

        // 3. 绘制折纸被掏空遗留下的区域 (白色背景虚线)
        let holePoints = "";
        if (!fold.isFOnCD) {
            holePoints = `${fold.E.x},${fold.E.y} ${fold.A.x},${fold.A.y} ${fold.F.x},${fold.F.y}`;
        } else {
            holePoints = `${fold.E.x},${fold.E.y} ${fold.A.x},${fold.A.y} ${fold.D.x},${fold.D.y} ${fold.F.x},${fold.F.y}`;
        }
        drawHtml += `
            <polygon points="${holePoints}" class="folded-hole"></polygon>
        `;

        // 3.5 绘制折纸的 3D 浮空阴影 (由 sinθ 决定模糊和偏移度)
        const rad = foldTheta * Math.PI / 180;
        const sinVal = Math.sin(rad);
        if (sinVal > 0.001) {
            let shadowPoints = "";
            if (!fold.isFOnCD) {
                shadowPoints = `${fold.E.x},${fold.E.y} ${fold.shadowA.x},${fold.shadowA.y} ${fold.F.x},${fold.F.y}`;
            } else {
                shadowPoints = `${fold.E.x},${fold.E.y} ${fold.shadowA.x},${fold.shadowA.y} ${fold.shadowD.x},${fold.shadowD.y} ${fold.F.x},${fold.F.y}`;
            }
            const shadowOpacity = 0.15 * (1.0 - sinVal * 0.4);
            drawHtml += `
                <polygon points="${shadowPoints}" fill="rgba(15, 23, 42, ${shadowOpacity})" filter="url(#shadow-blur)" pointer-events="none"></polygon>
            `;
        }

        // 4. 绘制折叠翻转后的卡纸部分 (拟真黄色且带 3D 旋转及光影遮蔽样式)
        let foldPoints = "";
        if (!fold.isFOnCD) {
            foldPoints = `${fold.E.x},${fold.E.y} ${fold.APrimeRot.x},${fold.APrimeRot.y} ${fold.F.x},${fold.F.y}`;
        } else {
            foldPoints = `${fold.E.x},${fold.E.y} ${fold.APrimeRot.x},${fold.APrimeRot.y} ${fold.DPrimeRot.x},${fold.DPrimeRot.y} ${fold.F.x},${fold.F.y}`;
        }
        
        // 光影渲染：当折纸拎起(θ接近90度)时，模拟背面阴影让颜色变暗
        const shade = Math.floor(254 - 24 * sinVal);
        const shadeG = Math.floor(243 - 22 * sinVal);
        const shadeB = Math.floor(199 - 18 * sinVal);
        const dynamicFill = `rgb(${shade}, ${shadeG}, ${shadeB})`;

        const clsFoldPaper = isStep2 ? "step-inactive-shape" : "";
        drawHtml += `
            <polygon points="${foldPoints}" class="folded-paper ${clsFoldPaper}" style="fill: ${dynamicFill};"></polygon>
        `;

        // 5. 绘制折痕线段 EF (紫色粗虚线)
        drawHtml += `
            <line x1="${fold.E.x}" y1="${fold.E.y}" x2="${fold.F.x}" y2="${fold.F.y}" class="bisector-halo"></line>
            <line x1="${fold.E.x}" y1="${fold.E.y}" x2="${fold.F.x}" y2="${fold.F.y}" class="crease-line"></line>
        `;

        // 6. 辅助线：连接 A 和 A' 及其垂直平分辅助
        if (switchShowBisector.checked) {
            // 自由探索和第 1 步都需要完整呈现垂直平分关系，不能被聚焦淡化。
            const clsHelper = proofStep >= 2 ? "step-inactive-shape" : "";
            const creaseDx = fold.F.x - fold.E.x;
            const creaseDy = fold.F.y - fold.E.y;
            const creaseLength = Math.hypot(creaseDx, creaseDy);
            drawHtml += `
                <!-- 连线 AA' -->
                <line x1="${fold.A.x}" y1="${fold.A.y}" x2="${fold.APrime.x}" y2="${fold.APrime.y}" class="helper-line ${clsHelper}"></line>
                <!-- 突出折痕 EF 的两个端点，使垂直平分线范围一目了然 -->
                <circle cx="${fold.E.x}" cy="${fold.E.y}" r="5.5" class="bisector-endpoint ${clsHelper}"></circle>
                <circle cx="${fold.F.x}" cy="${fold.F.y}" r="5.5" class="bisector-endpoint ${clsHelper}"></circle>
                <!-- 中点 M -->
                <circle cx="${fold.M.x}" cy="${fold.M.y}" r="6" class="bisector-midpoint ${clsHelper}"></circle>
                <text x="${fold.M.x + 14}" y="${fold.M.y - 12}" class="bisector-label ${clsHelper}">M</text>
            `;

            if (creaseLength > 1) {
                let normalX = -creaseDy / creaseLength;
                let normalY = creaseDx / creaseLength;
                // 标签优先落在折痕上方，避开折起的纸面和主图形。
                if (normalY > 0) {
                    normalX *= -1;
                    normalY *= -1;
                }
                const captionX = fold.M.x + normalX * 30;
                const captionY = fold.M.y + normalY * 30;
                drawHtml += `
                    <g class="bisector-caption ${clsHelper}" transform="translate(${captionX} ${captionY})">
                        <rect x="-44" y="-14" width="88" height="24" rx="8" class="bisector-caption-bg"></rect>
                        <text x="0" y="2" text-anchor="middle" class="bisector-caption-text">EF ⟂ AA'</text>
                    </g>
                `;
            }
            
            // 绘制 M 处的直角符号
            const sz = 11;
            const dx = fold.APrime.x - fold.A.x;
            const dy = fold.APrime.y - fold.A.y;
            const len = Math.hypot(dx, dy);
            if (len > 1) {
                const ux = dx / len;
                const uy = dy / len;
                const vx = -uy;
                const vy = ux;
                const r1 = { x: fold.M.x + sz * ux, y: fold.M.y + sz * uy };
                const r2 = { x: fold.M.x + sz * ux + sz * vx, y: fold.M.y + sz * uy + sz * vy };
                const r3 = { x: fold.M.x + sz * vx, y: fold.M.y + sz * vy };
                drawHtml += `
                    <polygon points="${fold.M.x},${fold.M.y} ${r1.x},${r1.y} ${r2.x},${r2.y} ${r3.x},${r3.y}" class="perp-symbol bisector-perp-symbol ${clsHelper}"></polygon>
                `;
            }
        }

        // 7. 步骤 2 聚焦高亮：Rt△A'BE (如果未勾选相似三角形则照常画)
        if (proofStep >= 2 && (!switchShowSimilarity || !switchShowSimilarity.checked)) {
            const clsStep2 = isStep2 ? "" : "step-inactive-shape";
            drawHtml += `
                <polygon points="${fold.B.x},${fold.B.y} ${fold.APrime.x},${fold.APrime.y} ${fold.E.x},${fold.E.y}" fill="rgba(220, 38, 38, 0.05)" stroke="var(--color-red)" stroke-width="1.8" class="${clsStep2}"></polygon>
            `;
            const sz = 10;
            drawHtml += `
                <polygon points="${fold.B.x},${fold.B.y} ${fold.B.x},${fold.B.y - sz} ${fold.B.x + sz},${fold.B.y - sz} ${fold.B.x + sz},${fold.B.y}" class="perp-symbol ${clsStep2}"></polygon>
            `;
        }

        // 7.5 教学优化：高亮“一线三等角”相似三角形并标定角度
        if (switchShowSimilarity && switchShowSimilarity.checked && foldTheta >= 150) {
            // 左相似三角形 EBA' (蓝色)
            drawHtml += `
                <polygon points="${fold.B.x},${fold.B.y} ${fold.APrime.x},${fold.APrime.y} ${fold.E.x},${fold.E.y}" class="sim-triangle-left"></polygon>
            `;
            const sz = 10;
            drawHtml += `
                <polygon points="${fold.B.x},${fold.B.y} ${fold.B.x},${fold.B.y - sz} ${fold.B.x + sz},${fold.B.y - sz} ${fold.B.x + sz},${fold.B.y}" class="perp-symbol"></polygon>
            `;

            // 右相似三角形 A'CG (金色)
            if (fold.hasSimilarity) {
                drawHtml += `
                    <polygon points="${fold.APrime.x},${fold.APrime.y} ${fold.C.x},${fold.C.y} ${fold.G.x},${fold.G.y}" class="sim-triangle-right"></polygon>
                `;
                drawHtml += `
                    <polygon points="${fold.C.x},${fold.C.y} ${fold.C.x},${fold.C.y - sz} ${fold.C.x - sz},${fold.C.y - sz} ${fold.C.x - sz},${fold.C.y}" class="perp-symbol"></polygon>
                `;
            }

            // 绘制相似角弧线 
            // 角 1 (BEA')
            const vEA = { x: fold.APrime.x - fold.E.x, y: fold.APrime.y - fold.E.y };
            const vEB = { x: fold.B.x - fold.E.x, y: fold.B.y - fold.E.y };
            drawHtml += drawArcBetweenVectors(fold.E, vEA, vEB, 20, "var(--color-purple)", "1");

            // 角 2 (CA'G)
            if (fold.hasSimilarity) {
                const vA_G = { x: fold.G.x - fold.APrime.x, y: fold.G.y - fold.APrime.y };
                const vA_C = { x: fold.C.x - fold.APrime.x, y: fold.C.y - fold.APrime.y };
                drawHtml += drawArcBetweenVectors(fold.APrime, vA_G, vA_C, 20, "var(--color-purple)", "2");
            }

            // 角 3 (EA'F) - 对折过去的直角
            const vA_E = { x: fold.E.x - fold.APrime.x, y: fold.E.y - fold.APrime.y };
            const vA_F = { x: fold.F.x - fold.APrime.x, y: fold.F.y - fold.APrime.y };
            drawHtml += drawArcBetweenVectors(fold.APrime, vA_E, vA_F, 24, "var(--color-gold)", "90°");
        }

        // 8. 绘制折线折射后的 D' 直角 (如果已对折)
        if (fold.isFOnCD) {
            const sz = 9;
            const rx = fold.DPrimeRot.x + sz * (fold.APrimeRot.x - fold.DPrimeRot.x) / dist(fold.APrimeRot, fold.DPrimeRot);
            const ry = fold.DPrimeRot.y + sz * (fold.APrimeRot.y - fold.DPrimeRot.y) / dist(fold.APrimeRot, fold.DPrimeRot);
            const vx = -(fold.F.y - fold.DPrimeRot.y) / dist(fold.F, fold.DPrimeRot);
            const vy = (fold.F.x - fold.DPrimeRot.x) / dist(fold.F, fold.DPrimeRot);
            const rx2 = rx + sz * vx;
            const ry2 = ry + sz * vy;
            const rx3 = fold.DPrimeRot.x + sz * vx;
            const ry3 = fold.DPrimeRot.y + sz * vy;
            drawHtml += `
                <polygon points="${fold.DPrimeRot.x},${fold.DPrimeRot.y} ${rx},${ry} ${rx2},${ry2} ${rx3},${ry3}" class="perp-symbol-gold"></polygon>
            `;
        }

        // 9. 绘制控制顶点 (只在 theta 接近 180度时可以精确拖拽，避免 3D 状态拖拽混淆)
        if (foldTheta >= 150) {
            drawHtml += `
                <!-- 可拖动的落点 A' -->
                <circle cx="${fold.APrime.x}" cy="${fold.APrime.y}" r="24" class="drag-handle drag-handle-hit-area" data-point="APrime" aria-label="拖动落点 A'"></circle>
                <circle cx="${fold.APrime.x}" cy="${fold.APrime.y}" r="8.5" class="drag-handle drag-handle-gold" data-point="APrime" title="沿底边拖动落点 A'"></circle>
            `;
        }

        sandboxSvg.innerHTML = drawHtml;
        bindHandleEvents();
    }

    // ==========================================================================
    // 5. HTML 标签渲染 (顶点字母、刻度测量气泡)
    // ==========================================================================
    function renderHTMLOverlay() {
        const fold = calculateFolding();
        let html = "";

        const isStep1 = proofStep === 1;
        const isStep2 = proofStep === 2;
        const isStep3 = proofStep === 3;

        // 顶点字母标签
        html += `<div class="floating-label" style="left:${fold.B.x}px; top:${fold.B.y + 16}px; color:var(--text-primary);">B</div>`;
        html += `<div class="floating-label" style="left:${fold.C.x}px; top:${fold.C.y + 16}px; color:var(--text-primary);">C</div>`;
        
        const clsA = isStep1 ? "" : "step-inactive-label";
        html += `<div class="floating-label ${clsA}" style="left:${fold.A.x}px; top:${fold.A.y - 16}px; color:var(--text-secondary);">A</div>`;
        
        html += `<div class="floating-label" style="left:${fold.D.x}px; top:${fold.D.y - 16}px; color:var(--text-secondary);">D</div>`;
        html += `<div class="floating-label" style="left:${fold.E.x}px; top:${fold.E.y}px; color:var(--color-purple);">E</div>`;
        
        const labelF = fold.isFOnCD ? "F(CD上)" : "F";
        html += `<div class="floating-label" style="left:${fold.F.x}px; top:${fold.F.y - 16}px; color:var(--color-purple);">${labelF}</div>`;
        
        // 字母 A' 与 D' 随 3D 旋转运动
        html += `<div class="floating-label" style="left:${fold.APrimeRot.x}px; top:${fold.APrimeRot.y - 18}px; color:var(--color-gold);">A'</div>`;

        if (fold.isFOnCD) {
            html += `<div class="floating-label" style="left:${fold.DPrimeRot.x}px; top:${fold.DPrimeRot.y - 16}px; color:var(--color-gold);">D'</div>`;
        }

        // 相似 G 标签
        if (switchShowSimilarity && switchShowSimilarity.checked && fold.hasSimilarity && foldTheta >= 150) {
            html += `<div class="floating-label" style="left:${fold.G.x + 14}px; top:${fold.G.y}px; color:var(--color-gold);">G</div>`;
        }

        if (switchShowBisector.checked) {
            const clsHelper = proofStep >= 2 ? "step-inactive-label" : "";
            html += `<div class="floating-label ${clsHelper}" style="left:${fold.M.x + 12}px; top:${fold.M.y}px; color:#475569; font-size:11px;">M</div>`;
        }

        // 几何数据看板数据计算
        const beVal = fold.yE;
        const baVal = baLength;
        const aeVal = abLength - fold.yE;

        // 更新控制面板上的数值
        valBA.textContent = baVal.toFixed(1);
        valABIndicator.textContent = `${abLength} px`;

        // 渲染勾股定理实时计算数据
        const be2 = beVal * beVal;
        const ba2 = baVal * baVal;
        const ae2 = aeVal * aeVal;
        
        valBE2.textContent = be2.toFixed(0);
        valBA2.textContent = ba2.toFixed(0);
        valLeftSum.textContent = (be2 + ba2).toFixed(0);
        valAE2.textContent = ae2.toFixed(0);

        // 绘制气泡测量刻度 (步骤 2 聚焦高亮)
        if (proofStep >= 2) {
            const clsStep2 = isStep2 ? "" : "step-inactive-label";
            html += `<div class="floating-text-badge color-red ${clsStep2}" style="left:${(fold.B.x + fold.APrime.x)/2}px; top:${(fold.B.y + fold.APrime.y)/2 + 15}px;">BA' = ${baVal.toFixed(0)}</div>`;
            html += `<div class="floating-text-badge color-red ${clsStep2}" style="left:${fold.B.x - 40}px; top:${(fold.B.y + fold.E.y)/2}px;">BE = ${beVal.toFixed(0)}</div>`;
            html += `<div class="floating-text-badge color-blue ${clsStep2}" style="left:${(fold.E.x + fold.APrime.x)/2 + 15}px; top:${(fold.E.y + fold.APrime.y)/2 - 15}px;">A'E = AE = ${(aeVal).toFixed(0)}</div>`;
        }

        htmlOverlay.innerHTML = html;
    }

    // ==========================================================================
    // 6. HUD 黑板步骤说明
    // ==========================================================================
    function renderHUDChalkboard() {
        let html = "";
        const a = abLength;
        const x = baLength;
        
        // 实时求出 AE
        const yE = (a*a - x*x) / (2*a);
        const ae = a - yE;

        if (proofStep === 0) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">💡 矩形折叠重合模型</div>
                    <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">
                        折叠的本质是<strong>轴对称翻折</strong>。折痕线段 EF 是连接“折叠前顶点 A”与“折叠后落点 A'”所成线段 <strong>AA' 的垂直平分线</strong>。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">🎮 交互指南</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        1. 拖动金色滑块 <strong>A'</strong>，观察折痕 EF 及重叠区域的动态改变。<br>
                        2. 调整高度 <strong>AB (a)</strong> 查看不同尺寸纸张折叠。<br>
                        3. 点击 <strong>“下一步”</strong>，进入中考经典的勾股方程推导流程！
                    </div>
                </div>
            `;
        } else if (proofStep === 1) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-purple);">步骤 1/3：折叠对称本源性质</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        折叠使得 &triangle;AEF 与 &triangle;A'EF 关于折痕 EF 轴对称：
                    </div>
                    <div class="hud-formula-block" style="font-size:12px;">
                        • 对应线段全等相等：<strong>A'E = AE</strong>，<strong>A'F = AF</strong><br>
                        • 折痕 EF &perp; AA' 且平分 AA' (中点为 M)
                    </div>
                    <div class="success-chalk-box">
                        📌 <strong>定理运用</strong>：<br>
                        我们在列折叠代数方程时，关键条件是利用 <strong>A'E = AE</strong> 来进行线段转移。
                    </div>
                </div>
            `;
        } else if (proofStep === 2) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-red);">步骤 2/3：锁定直角三角形 Rt△A'BE</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        寻找含未知线段与已知线段的直角三角形进行求解：
                    </div>
                    <div class="hud-formula-block" style="font-size:12px;">
                        在 Rt&triangle;A'BE 中，直角 &ang;B = 90&deg;：<br>
                        三边分别为：<strong>BE</strong>, <strong>BA'</strong>, 斜边 <strong>A'E</strong>
                    </div>
                    <div class="success-chalk-box">
                        📌 <strong>勾股公式</strong>：<br>
                        列出勾股等式：<strong>BE² + BA'² = A'E²</strong>。<br>
                        上方数值看板已同步将当前的测量长度带入验算，等式始终完美契合！
                    </div>
                </div>
            `;
        } else if (proofStep === 3) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-safe);">步骤 3/3：一线三等角与方程转化</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        折痕、底边与翻折边形成可追踪的等角关系；落到解题时，仍要回到 Rt△A'BE 建立方程：
                    </div>
                    <div class="hud-formula-block" style="font-size:12px; font-family:var(--font-mono); line-height:1.55;">
                        设高度 AB = a (当前 ${a})，落点 BA' = x (当前 ${x})<br>
                        设 AE = y，则 <strong>A'E = y</strong><br>
                        线段 <strong>BE = a - y</strong> (当前 ${(a - ae).toFixed(0)})<br><br>
                        代入勾股定理：<br>
                        (a - y)² + x² = y²<br>
                        a² - 2ay + y² + x² = y² &rArr; <strong>2ay = a² + x²</strong><br>
                        解出：<strong>y = (a² + x²) / 2a</strong> (当前 ${ae.toFixed(0)})
                    </div>
                    <div class="success-chalk-box" style="border-color:var(--color-safe); color:#065f46;">
                        <strong>命题抓手</strong>：先找折叠全等，再找直角三角形，最后用相似/勾股把线段转成方程。
                    </div>
                </div>
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 7. 交互手柄拖拽绑定
    // ==========================================================================
    function bindHandleEvents() {
        document.querySelectorAll(".drag-handle").forEach(handle => {
            handle.addEventListener("mousedown", onDragStart);
            handle.addEventListener("touchstart", onDragStart, { passive: false });
        });
    }

    function onDragStart(e) {
        if (e.touches?.length > 1) return;
        e.preventDefault();
        e.stopPropagation();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = sandboxSvg.getBoundingClientRect();
        const mouseX = (clientX - rect.left) / zoomScale;
        const mouseY = (clientY - rect.top) / zoomScale;

        const pointName = e.target.getAttribute("data-point");
        activeNode = pointName;

        const fold = calculateFolding();
        if (pointName === "APrime") {
            dragOffset.x = mouseX - fold.APrime.x;
            dragOffset.y = mouseY - fold.APrime.y;
        }

        e.currentTarget.classList.add("active");

        window.addEventListener("mousemove", onDragging);
        window.addEventListener("touchmove", onDragging, { passive: false });
        window.addEventListener("mouseup", onDragEnd);
        window.addEventListener("touchend", onDragEnd);
        window.addEventListener("touchcancel", onDragEnd);
        window.addEventListener("blur", onDragEnd);
    }

    function onDragging(e) {
        if (!activeNode) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = sandboxSvg.getBoundingClientRect();
        const mouseX = (clientX - rect.left) / zoomScale;

        if (activeNode === "APrime") {
            // A' 只能在底边 BC 上滑动 (X coordinate from 30px to 250px)
            const relativeX = mouseX - dragOffset.x - originB.x;
            // 设定安全物理上限，防止 A' 跑到矩形外部或导致折痕溢出 AB 范围之外
            const maxDragX = abLength - 10;
            baLength = Math.max(20, Math.min(maxDragX, relativeX));
            slideBA.value = baLength;
        }

        render();
    }

    function onDragEnd() {
        if (!activeNode) return;
        sandboxSvg.querySelectorAll(`.drag-handle[data-point="${activeNode}"]`).forEach(handle => handle.classList.remove("active"));

        activeNode = null;
        window.removeEventListener("mousemove", onDragging);
        window.removeEventListener("touchmove", onDragging);
        window.removeEventListener("mouseup", onDragEnd);
        window.removeEventListener("touchend", onDragEnd);
        window.removeEventListener("touchcancel", onDragEnd);
        window.removeEventListener("blur", onDragEnd);
    }

    // ==========================================================================
    // 8. 右侧滑块与按钮操作绑定
    // ==========================================================================
    function pushEnvelopeLine() {
        if (switchShowEnvelope && switchShowEnvelope.checked && foldTheta >= 150) {
            const fold = calculateFolding();
            // 避免完全重合的线段重复推入
            const currentLine = { x1: fold.E.x, y1: fold.E.y, x2: fold.F.x, y2: fold.F.y };
            if (envelopeLines.length === 0) {
                envelopeLines.push(currentLine);
            } else {
                const last = envelopeLines[envelopeLines.length - 1];
                const d1 = Math.hypot(last.x1 - currentLine.x1, last.y1 - currentLine.y1);
                const d2 = Math.hypot(last.x2 - currentLine.x2, last.y2 - currentLine.y2);
                if (d1 > 1.5 || d2 > 1.5) {
                    envelopeLines.push(currentLine);
                    if (envelopeLines.length > 150) {
                        envelopeLines.shift();
                    }
                }
            }
        }
    }

    if (slideBA) {
        slideBA.addEventListener("input", (e) => {
            baLength = parseFloat(e.target.value);
            pushEnvelopeLine();
            render();
        });
    }

    if (slideAB) {
        slideAB.addEventListener("input", (e) => {
            abLength = parseFloat(e.target.value);
            const maxVal = abLength - 10;
            slideBA.max = maxVal;
            if (baLength > maxVal) {
                baLength = maxVal;
                slideBA.value = baLength;
            }
            pushEnvelopeLine();
            render();
        });
    }

    // 3D 旋转折角滑动监听
    if (slideTheta) {
        slideTheta.addEventListener("input", (e) => {
            foldTheta = parseFloat(e.target.value);
            if (valThetaIndicator) {
                valThetaIndicator.textContent = `${foldTheta}°`;
            }
            render();
        });
    }

    if (switchShowSimilarity) {
        switchShowSimilarity.addEventListener("change", () => render());
    }

    if (switchShowEnvelope) {
        switchShowEnvelope.addEventListener("change", (e) => {
            if (!e.target.checked) {
                envelopeLines = [];
            } else {
                pushEnvelopeLine();
            }
            render();
        });
    }

    if (btnClearEnvelope) {
        btnClearEnvelope.addEventListener("click", () => {
            envelopeLines = [];
            render();
        });
    }

    function stopAutoplayDemo(label = "播放折叠过程") {
        isAutoplay = false;
        if (autoplayFrame) {
            cancelAnimationFrame(autoplayFrame);
            autoplayFrame = null;
        }
        if (btnAutoplay) {
            btnAutoplay.textContent = label;
            btnAutoplay.style.color = "";
        }
    }

    function finishAutoplayDemo() {
        stopAutoplayDemo("再播放折叠过程");
        foldTheta = 180;
        if (slideTheta) slideTheta.value = 180;
        if (valThetaIndicator) valThetaIndicator.textContent = "180°";
        render();
    }

    function startAutoplayDemo() {
        stopAutoplayDemo("播放折叠过程");
        isAutoplay = true;
        const startTheta = 12;
        const endTheta = 180;
        const duration = 1400;
        let startedAt = 0;
        foldTheta = startTheta;
        if (slideTheta) slideTheta.value = startTheta;
        if (valThetaIndicator) valThetaIndicator.textContent = `${startTheta}°`;
        if (btnAutoplay) btnAutoplay.textContent = "停止播放";

        const tick = timestamp => {
            if (!isAutoplay) return;
            if (!startedAt) startedAt = timestamp;
            const progress = Math.min((timestamp - startedAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            foldTheta = Math.round(startTheta + (endTheta - startTheta) * eased);
            if (slideTheta) slideTheta.value = foldTheta;
            if (valThetaIndicator) valThetaIndicator.textContent = `${foldTheta}°`;
            pushEnvelopeLine();
            render();
            if (progress < 1) {
                autoplayFrame = requestAnimationFrame(tick);
            } else {
                finishAutoplayDemo();
            }
        };

        render();
        autoplayFrame = requestAnimationFrame(tick);
    }

    // 自动播放一次折叠过程
    if (btnAutoplay) {
        btnAutoplay.addEventListener("click", () => {
            if (isAutoplay) {
                stopAutoplayDemo("播放折叠过程");
            } else {
                startAutoplayDemo();
            }
        });
    }

    switchShowBisector.addEventListener("change", () => render());
    switchLockRight.addEventListener("change", () => render());

    // 分步引导
    if (btnProofPrev && btnProofNext) {
        btnProofPrev.addEventListener("click", () => {
            proofStep = Math.max(0, proofStep - 1);
            updateProofStepUI();
            render();
        });

        btnProofNext.addEventListener("click", () => {
            proofStep = Math.min(3, proofStep + 1);
            updateProofStepUI();
            render();
        });
    }

    function updateProofStepUI() {
        if (!proofStepIndicator) return;
        document.querySelectorAll("[data-step-pill]").forEach(node => {
            node.classList.toggle("active", node.dataset.stepPill === String(proofStep));
        });
        if (proofStep === 0) {
            proofStepIndicator.textContent = "观察折叠关系";
            proofStepIndicator.style.color = "var(--text-secondary)";
            btnProofPrev.disabled = true;
            btnProofNext.disabled = false;
        } else {
            const titles = {
                1: "折痕 EF 是 AA' 的垂直平分线",
                2: "锁定 Rt△A'BE 并列勾股方程",
                3: "一线三等角辅助相似与方程转化",
            };
            proofStepIndicator.textContent = titles[proofStep];
            proofStepIndicator.style.color = "var(--color-purple)";
            btnProofPrev.disabled = false;
            btnProofNext.disabled = proofStep === 3;
        }
        updateCurrentConclusion();
    }

    function updateCurrentConclusion() {
        if (!currentConclusionText) return;
        const conclusions = {
            0: "拖动 A'，观察折痕变化与 A、A' 的对称关系。",
            1: "折痕 EF 是 AA' 的垂直平分线，A'E = AE，A'F = AF。",
            2: "在 Rt△A'BE 中，BE² + BA'² = A'E²，可把折叠关系转成方程。",
            3: "一线三等角用于识别相似结构，解题仍回到全等、相似与勾股方程。",
        };
        currentConclusionText.textContent = conclusions[proofStep] || conclusions[0];
    }

    // 视口缩放与工具条
    btnZoomIn.addEventListener("click", () => {
        hasManualZoom = true;
        zoomScale = Math.min(zoomScale * 1.15, 3.0);
        updateTransform();
    });
    
    btnZoomOut.addEventListener("click", () => {
        hasManualZoom = true;
        zoomScale = Math.max(zoomScale / 1.15, 0.45);
        updateTransform();
    });
    
    btnZoomReset.addEventListener("click", () => {
        hasManualZoom = false;
        zoomScale = getResponsiveZoomScale();
        updateTransform();
    });

    btnResetState.addEventListener("click", () => {
        hasManualZoom = false;
        zoomScale = getResponsiveZoomScale();
        proofStep = 0;
        abLength = 240;
        baLength = 120;
        foldTheta = 180;
        envelopeLines = [];
        
        if (slideBA) {
            slideBA.max = 230;
            slideBA.value = 120;
        }
        if (slideAB) {
            slideAB.value = 240;
        }
        if (slideTheta) {
            slideTheta.value = 180;
        }
        if (valThetaIndicator) {
            valThetaIndicator.textContent = "180°";
        }
        if (switchShowSimilarity) {
            switchShowSimilarity.checked = false;
        }
        if (switchShowEnvelope) {
            switchShowEnvelope.checked = false;
        }
        
        switchShowBisector.checked = true;
        switchLockRight.checked = true;
        
        if (isAutoplay) {
            stopAutoplayDemo("播放折叠过程");
        }

        updateTransform();
        updateProofStepUI();
        render();
    });

    function updateTransform() {
        const panX = getResponsivePanX();
        const transform = panX ? `translateX(${panX}px) scale(${zoomScale})` : `scale(${zoomScale})`;
        sandboxSvg.style.transform = transform;
        htmlOverlay.style.transform = transform;
    }

    window.addEventListener("resize", () => {
        if (hasManualZoom) return;
        zoomScale = getResponsiveZoomScale();
        updateTransform();
    });

    // 可收起 HUD 面板折叠
    const hudPanel = document.getElementById("hud-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");
    const hudRestoreBtn = document.getElementById("hud-restore-btn");

    if (hudToggleBtn && hudPanel) {
        const syncHudState = (collapsed) => {
            hudPanel.classList.toggle("collapsed", collapsed);
            hudPanel.setAttribute("aria-expanded", String(!collapsed));
            hudToggleBtn.textContent = collapsed ? "+" : "−";
            hudToggleBtn.setAttribute("aria-expanded", String(!collapsed));
            if (hudRestoreBtn) {
                hudRestoreBtn.classList.add("hidden");
                hudRestoreBtn.setAttribute("aria-hidden", "true");
            }
        };

        let lastHudToggleAt = 0;
        const handleHudToggle = (event) => {
            if (!event.target?.closest?.(".hud-header,#hud-toggle-btn,.btn-hud-toggle")) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const now = Date.now();
            if (now - lastHudToggleAt < 320) return;
            lastHudToggleAt = now;
            syncHudState(!hudPanel.classList.contains("collapsed"));
        };

        hudPanel.addEventListener("click", handleHudToggle, { capture: true });
        hudPanel.addEventListener("touchend", handleHudToggle, { passive: false, capture: true });

        if (hudRestoreBtn) {
            hudRestoreBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                syncHudState(false);
            });
        }

        syncHudState(hudPanel.classList.contains("collapsed"));
    }

    // ==========================================================================
    // 9. 初始化与入口
    // ==========================================================================
    function render() {
        renderSVG();
        renderHTMLOverlay();
        renderHUDChalkboard();
        updateCurrentConclusion();
    }

    // 运行
    updateProofStepUI();
    updateTransform();
    render();
});

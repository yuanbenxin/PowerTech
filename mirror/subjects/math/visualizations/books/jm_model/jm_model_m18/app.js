document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-chalkboard");
    const badgeContainer = document.getElementById("badge-container");
    
    const slideK = document.getElementById("slide-k");
    const kValIndicator = document.getElementById("k-val-indicator");
    const alphaValIndicator = document.getElementById("alpha-val-indicator");
    const btnProofPrev = document.getElementById("btn-proof-prev");
    const btnProofNext = document.getElementById("btn-proof-next");
    const proofStepIndicator = document.getElementById("proof-step-indicator");
    
    const switchLockLocus = document.getElementById("switch-lock-locus");
    const switchShowDE = document.getElementById("switch-show-de");
    const switchShowProofHelper = document.getElementById("switch-show-proof-helper");
    const switchShowExamLine = document.getElementById("switch-show-exam-line");
    const switchTraceMode = document.getElementById("switch-trace-mode");
    const btnClearTrace = document.getElementById("btn-clear-trace");
    
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");
    const btnZoomReset = document.getElementById("btn-zoom-reset");
    const btnResetState = document.getElementById("btn-reset-state");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");

    // ==========================================================================
    // 2. 状态变量与几何参数
    // ==========================================================================
    let zoomScale = 1.0;
    let panOffset = { x: 0, y: 0 };
    const VIEW_MIN_SCALE = 0.08;
    const VIEW_MAX_SCALE = 4.0;
    const VIEW_FIT_PADDING = 72;
    let viewportDrag = null;
    let pinchState = null;
    let proofStep = 0;       // 0: 自由探索, 1: 内角平分线D, 2: 外角平分线E, 3: 垂直夹角, 4: 直径轨迹圆
    let ratioK = 1.50;       // PA / PB = k
    let isPClosed = false;
    let tracePoints = [];    // 手工描绘的点迹数组

    // 几何顶点状态 (默认物理像素坐标)
    let ptA = { x: 260, y: 300 }; // 定点 A
    let ptB = { x: 440, y: 300 }; // 定点 B
    let ptP = { x: 320, y: 180 }; // 动点 P

    let activeNode = null;
    let dragOffset = { x: 0, y: 0 };

    // ==========================================================================
    // 3. 几何数学解算
    // ==========================================================================
    function dist(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    // 计算阿波罗尼斯圆的圆心和半径
    function calculateApollonius() {
        const dAB = dist(ptA, ptB);
        
        // 极限情况：k = 1 时轨迹是一条垂直平分线
        if (Math.abs(ratioK - 1.0) < 0.001) {
            const mid = { x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2 };
            // 方向向量
            const dx = ptB.x - ptA.x;
            const dy = ptB.y - ptA.y;
            const len = Math.hypot(dx, dy);
            // 垂直单位方向
            const perp = { x: -dy / len, y: dx / len };
            return {
                isLine: true,
                mid,
                perp,
                D: mid,
                E: null
            };
        }

        const k2 = ratioK * ratioK;
        const denom = 1 - k2;

        // 圆心坐标
        const cx = (ptA.x - k2 * ptB.x) / denom;
        const cy = (ptA.y - k2 * ptB.y) / denom;
        const center = { x: cx, y: cy };

        // 半径
        const radius = (ratioK * dAB) / Math.abs(denom);

        // 内分点 D: (A + kB) / (1 + k)
        const D = {
            x: (ptA.x + ratioK * ptB.x) / (1 + ratioK),
            y: (ptA.y + ratioK * ptB.y) / (1 + ratioK)
        };

        // 外分点 E: (A - kB) / (1 - k)
        const E = {
            x: (ptA.x - ratioK * ptB.x) / (1 - ratioK),
            y: (ptA.y - ratioK * ptB.y) / (1 - ratioK)
        };

        return {
            isLine: false,
            center,
            radius,
            D,
            E
        };
    }

    // 将 P 限制在轨迹上
    function getClosestPointOnLocus(target) {
        const ap = calculateApollonius();
        if (ap.isLine) {
            // 投影到中垂线上
            const v = { x: target.x - ap.mid.x, y: target.y - ap.mid.y };
            const dot = v.x * ap.perp.x + v.y * ap.perp.y;
            return {
                x: ap.mid.x + dot * ap.perp.x,
                y: ap.mid.y + dot * ap.perp.y
            };
        } else {
            // 投影到圆周上
            const dx = target.x - ap.center.x;
            const dy = target.y - ap.center.y;
            const len = Math.hypot(dx, dy);
            if (len < 0.1) {
                return { x: ap.center.x + ap.radius, y: ap.center.y };
            }
            return {
                x: ap.center.x + (dx / len) * ap.radius,
                y: ap.center.y + (dy / len) * ap.radius
            };
        }
    }

    function includePoint(bounds, point) {
        bounds.minX = Math.min(bounds.minX, point.x);
        bounds.maxX = Math.max(bounds.maxX, point.x);
        bounds.minY = Math.min(bounds.minY, point.y);
        bounds.maxY = Math.max(bounds.maxY, point.y);
    }

    function getLocusBounds() {
        const ap = calculateApollonius();
        const bounds = {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        };

        [ptA, ptB, ptP].forEach(point => includePoint(bounds, point));

        if (ap.isLine) {
            includePoint(bounds, {
                x: ap.mid.x - ap.perp.x * 320,
                y: ap.mid.y - ap.perp.y * 320
            });
            includePoint(bounds, {
                x: ap.mid.x + ap.perp.x * 320,
                y: ap.mid.y + ap.perp.y * 320
            });
        } else {
            includePoint(bounds, {
                x: ap.center.x - ap.radius,
                y: ap.center.y - ap.radius
            });
            includePoint(bounds, {
                x: ap.center.x + ap.radius,
                y: ap.center.y + ap.radius
            });
            includePoint(bounds, ap.D);
            includePoint(bounds, ap.E);
        }

        return bounds;
    }

    function fitLocusView() {
        const width = sandboxWrapper.clientWidth || 800;
        const height = sandboxWrapper.clientHeight || 600;
        const safeWidth = Math.max(240, width - VIEW_FIT_PADDING * 2);
        const safeHeight = Math.max(220, height - VIEW_FIT_PADDING * 2);
        const bounds = getLocusBounds();
        const boundsWidth = Math.max(1, bounds.maxX - bounds.minX);
        const boundsHeight = Math.max(1, bounds.maxY - bounds.minY);
        const nextScale = Math.max(
            VIEW_MIN_SCALE,
            Math.min(1, safeWidth / boundsWidth, safeHeight / boundsHeight)
        );
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        zoomScale = nextScale;
        panOffset = {
            x: width / 2 - centerX * nextScale,
            y: height / 2 - centerY * nextScale
        };
        updateTransform();
    }

    // ==========================================================================
    // 4. 辅助绘图渲染函数
    // ==========================================================================
    
    // 绘制角弧度辅助路径
    function drawArcBetweenVectors(center, v1, v2, radius, color, label) {
        const a1 = Math.atan2(v1.y, v1.x);
        let a2 = Math.atan2(v2.y, v2.x);
        
        let diff = a2 - a1;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        a2 = a1 + diff;
        
        const x1 = center.x + radius * Math.cos(a1);
        const y1 = center.y + radius * Math.sin(a1);
        const x2 = center.x + radius * Math.cos(a2);
        const y2 = center.y + radius * Math.sin(a2);
        
        const sweepFlag = diff > 0 ? 1 : 0;
        const d = `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2}`;
        
        const midA = a1 + diff / 2;
        const lx = center.x + (radius + 10) * Math.cos(midA);
        const ly = center.y + (radius + 10) * Math.sin(midA);
        
        let labelHtml = "";
        if (label) {
            labelHtml = `<text x="${lx}" y="${ly}" font-size="10px" font-weight="800" fill="${color}" text-anchor="middle" dominant-baseline="middle">${label}</text>`;
        }
        return `
            <path d="${d}" fill="none" stroke="${color}" stroke-width="1.3" stroke-dasharray="2,2"></path>
            ${labelHtml}
        `;
    }

    // ==========================================================================
    // 5. SVG 画布主重绘逻辑
    // ==========================================================================
    function renderSVG() {
        const ap = calculateApollonius();
        let drawHtml = "";

        // 步骤聚焦显隐样式
        const isStep0 = proofStep === 0;
        const isStep1 = proofStep === 1;
        const isStep2 = proofStep === 2;
        const isStep3 = proofStep === 3;
        const isStep4 = proofStep === 4;
        const showDE = !switchShowDE || switchShowDE.checked;

        // 1. 背景细格线网格
        for (let i = 40; i < 800; i += 40) {
            drawHtml += `<line x1="${i}" y1="0" x2="${i}" y2="600" class="grid-line"></line>`;
            drawHtml += `<line x1="0" y1="${i}" x2="800" y2="${i}" class="grid-line"></line>`;
        }

        // 1.5 绘制手工发现法留下的历史点迹
        if (tracePoints.length > 0) {
            tracePoints.forEach(pt => {
                drawHtml += `<circle cx="${pt.x}" cy="${pt.y}" r="3.5" class="trace-dot"></circle>`;
            });
        }

        // 1.8 引入中考考点直线 L
        if (switchShowExamLine && switchShowExamLine.checked) {
            const LineY = 380;
            drawHtml += `
                <!-- 中考直线 L 阴影霓虹 -->
                <line x1="0" y1="${LineY}" x2="800" y2="${LineY}" class="exam-straight-line-glow"></line>
                <!-- 直线 L 实体 -->
                <line x1="0" y1="${LineY}" x2="800" y2="${LineY}" class="exam-straight-line"></line>
                <!-- 文本 L 标识 -->
                <text x="750" y="${LineY - 8}" font-size="11px" font-weight="700" fill="#475569">直线 L</text>
            `;
        }

        // 2. 绘制基准线段 AB
        drawHtml += `
            <line x1="${ptA.x}" y1="${ptA.y}" x2="${ptB.x}" y2="${ptB.y}" stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="4,4"></line>
        `;

        // 3. 绘制动点 P 到 A、B 的连线
        drawHtml += `
            <line x1="${ptP.x}" y1="${ptP.y}" x2="${ptA.x}" y2="${ptA.y}" class="path-line-pa"></line>
            <line x1="${ptP.x}" y1="${ptP.y}" x2="${ptB.x}" y2="${ptB.y}" class="path-line-pb"></line>
        `;

        // 4. 绘制轨迹线 (如果是直线则绘制穿透线，否则绘制圆)
        const showCircle = isStep0 || isStep4;
        const clsCircle = showCircle ? "" : "step-inactive-shape";
        
        if (ap.isLine) {
            const startX = ap.mid.x - ap.perp.x * 500;
            const startY = ap.mid.y - ap.perp.y * 500;
            const endX = ap.mid.x + ap.perp.x * 500;
            const endY = ap.mid.y + ap.perp.y * 500;
            drawHtml += `
                <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" class="trajectory-circle ${clsCircle}"></line>
            `;
        } else {
            drawHtml += `
                <circle cx="${ap.center.x}" cy="${ap.center.y}" r="${ap.radius}" class="trajectory-circle ${clsCircle}"></circle>
            `;
        }

        // 5. 步骤 1：内角平分线及内分点 D
        if (proofStep >= 1 && !ap.isLine && showDE) {
            const clsPD = proofStep === 1 ? "" : "step-inactive-shape";
            drawHtml += `
                <!-- 内角平分线 PD -->
                <line x1="${ptP.x}" y1="${ptP.y}" x2="${ap.D.x}" y2="${ap.D.y}" class="bisector-line ${clsPD}"></line>
                <!-- 内分点 D -->
                <circle cx="${ap.D.x}" cy="${ap.D.y}" r="5.5" fill="var(--color-purple)"></circle>
            `;

            // 绘制角 1 和 角 2 弧线指示
            const vPA = { x: ptA.x - ptP.x, y: ptA.y - ptP.y };
            const vPD = { x: ap.D.x - ptP.x, y: ap.D.y - ptP.y };
            const vPB = { x: ptB.x - ptP.x, y: ptB.y - ptP.y };
            drawHtml += `
                <g class="${clsPD}">
                    ${drawArcBetweenVectors(ptP, vPA, vPD, 24, "var(--color-purple)", "1")}
                    ${drawArcBetweenVectors(ptP, vPD, vPB, 24, "var(--color-purple)", "2")}
                </g>
            `;

            // 相似辅助线证明
            if (switchShowProofHelper && switchShowProofHelper.checked && proofStep === 1) {
                const vAP_dir = { x: ptP.x - ptA.x, y: ptP.y - ptA.y };
                const bdx = ptB.x - ptP.x, bdy = ptB.y - ptP.y;
                const det = -vPD.x * vAP_dir.y + vPD.y * vAP_dir.x;
                if (Math.abs(det) > 0.01) {
                    const t = (-bdx * vAP_dir.y + bdy * vAP_dir.x) / det;
                    const K = { x: ptP.x + t * vPD.x, y: ptP.y + t * vPD.y };
                    drawHtml += `
                        <!-- BK // AP -->
                        <line x1="${ptB.x}" y1="${ptB.y}" x2="${K.x}" y2="${K.y}" class="proof-parallel-line"></line>
                        <!-- 延长线 DK -->
                        <line x1="${ap.D.x}" y1="${ap.D.y}" x2="${K.x}" y2="${K.y}" class="proof-parallel-line"></line>
                        <!-- 辅助交点 K -->
                        <circle cx="${K.x}" cy="${K.y}" r="4.5" fill="var(--color-purple)" stroke="#ffffff" stroke-width="1.2"></circle>
                        <text x="${K.x + 12}" y="${K.y + 4}" font-size="11px" font-weight="700" fill="var(--color-purple)">K (BK // AP)</text>
                    `;
                }
            }
        }

        // 6. 步骤 2：外角平分线及外分点 E
        if (proofStep >= 2 && !ap.isLine && showDE) {
            const clsPE = proofStep === 2 ? "" : "step-inactive-shape";
            drawHtml += `
                <!-- 外角平分线 PE -->
                <line x1="${ptP.x}" y1="${ptP.y}" x2="${ap.E.x}" y2="${ap.E.y}" class="bisector-line ${clsPE}"></line>
                <!-- 外分点 E -->
                <circle cx="${ap.E.x}" cy="${ap.E.y}" r="5.5" fill="var(--color-purple)"></circle>
            `;

            // 绘制外角平分线指示弧线
            const vPA = { x: ptA.x - ptP.x, y: ptA.y - ptP.y };
            const vPE = { x: ap.E.x - ptP.x, y: ap.E.y - ptP.y };
            const vPA_opp = { x: -vPA.x, y: -vPA.y };
            const vPB = { x: ptB.x - ptP.x, y: ptB.y - ptP.y };

            drawHtml += `
                <g class="${clsPE}">
                    <line x1="${ptP.x}" y1="${ptP.y}" x2="${ptP.x + vPA_opp.x*0.25}" y2="${ptP.y + vPA_opp.y*0.25}" stroke="var(--text-muted)" stroke-width="1.2" stroke-dasharray="3,3"></line>
                    ${drawArcBetweenVectors(ptP, vPB, vPE, 20, "var(--color-purple)", "3")}
                    ${drawArcBetweenVectors(ptP, vPE, vPA_opp, 20, "var(--color-purple)", "4")}
                </g>
            `;

            // 相似辅助线证明 (外角)
            if (switchShowProofHelper && switchShowProofHelper.checked && proofStep === 2) {
                const vAP_dir = { x: ptP.x - ptA.x, y: ptP.y - ptA.y };
                const bdx = ptB.x - ptP.x, bdy = ptB.y - ptP.y;
                const det = -vPE.x * vAP_dir.y + vPE.y * vAP_dir.x;
                if (Math.abs(det) > 0.01) {
                    const t = (-bdx * vAP_dir.y + bdy * vAP_dir.x) / det;
                    const K = { x: ptP.x + t * vPE.x, y: ptP.y + t * vPE.y };
                    drawHtml += `
                        <!-- BK // AP -->
                        <line x1="${ptB.x}" y1="${ptB.y}" x2="${K.x}" y2="${K.y}" class="proof-parallel-line"></line>
                        <!-- 延长线 EK -->
                        <line x1="${ap.E.x}" y1="${ap.E.y}" x2="${K.x}" y2="${K.y}" class="proof-parallel-line"></line>
                        <!-- 辅助交点 K -->
                        <circle cx="${K.x}" cy="${K.y}" r="4.5" fill="var(--color-purple)" stroke="#ffffff" stroke-width="1.2"></circle>
                        <text x="${K.x + 12}" y="${K.y + 4}" font-size="11px" font-weight="700" fill="var(--color-purple)">K (BK // AP)</text>
                    `;
                }
            }
        }

        // 7. 步骤 3：直角夹角 DPE = 90 度
        if (proofStep >= 3 && !ap.isLine && showDE) {
            const clsStep3 = isStep3 ? "" : "step-inactive-shape";

            // 绘制直角符号
            const sz = 10;
            const vPD = { x: ap.D.x - ptP.x, y: ap.D.y - ptP.y };
            const lenPD = Math.hypot(vPD.x, vPD.y);
            const vPE = { x: ap.E.x - ptP.x, y: ap.E.y - ptP.y };
            const lenPE = Math.hypot(vPE.x, vPE.y);

            if (lenPD > 1 && lenPE > 1) {
                const uPD = { x: vPD.x / lenPD, y: vPD.y / lenPD };
                const uPE = { x: vPE.x / lenPE, y: vPE.y / lenPE };

                const r1 = { x: ptP.x + sz * uPD.x, y: ptP.y + sz * uPD.y };
                const r2 = { x: ptP.x + sz * uPD.x + sz * uPE.x, y: ptP.y + sz * uPD.y + sz * uPE.y };
                const r3 = { x: ptP.x + sz * uPE.x, y: ptP.y + sz * uPE.y };

                drawHtml += `
                    <polygon points="${ptP.x},${ptP.y} ${r1.x},${r1.y} ${r2.x},${r2.y} ${r3.x},${r3.y}" class="perp-symbol ${clsStep3}"></polygon>
                `;
            }

            // 连线 DE 用于提示直径
            const clsDE = (isStep3 || isStep4) ? "" : "step-inactive-shape";
            drawHtml += `
                <line x1="${ap.D.x}" y1="${ap.D.y}" x2="${ap.E.x}" y2="${ap.E.y}" stroke="var(--color-purple)" stroke-width="1.8" stroke-dasharray="6,4" class="${clsDE}"></line>
            `;
        }

        // 8. 步骤 4：以 DE 为直径的轨迹圆
        if (proofStep >= 4 && !ap.isLine && showDE) {
            drawHtml += `
                <!-- 辅助直径指示圆 -->
                <circle cx="${ap.center.x}" cy="${ap.center.y}" r="${ap.radius}" fill="none" stroke="var(--color-gold)" stroke-width="1.5" stroke-dasharray="5,5" stroke-opacity="0.6"></circle>
                <!-- 圆心中心点 -->
                <circle cx="${ap.center.x}" cy="${ap.center.y}" r="3.5" fill="var(--color-gold)"></circle>
                <!-- 圆心 C 辅助线 -->
                <line x1="${ap.center.x}" y1="${ap.center.y}" x2="${ptP.x}" y2="${ptP.y}" stroke="var(--color-gold)" stroke-opacity="0.5" stroke-width="1.2" stroke-dasharray="3,2"></line>
            `;
        }

        // 8.5 计算并高亮直线 L 的两个中考交点
        if (switchShowExamLine && switchShowExamLine.checked) {
            const LineY = 380;
            if (ap.isLine) {
                if (Math.abs(ap.perp.y) > 0.001) {
                    const s = (LineY - ap.mid.y) / ap.perp.y;
                    const ix = ap.mid.x + s * ap.perp.x;
                    drawHtml += `
                        <circle cx="${ix}" cy="${LineY}" r="7.5" class="intersection-point"></circle>
                        <text x="${ix}" y="${LineY - 14}" font-size="10.5px" font-weight="800" fill="var(--color-safe)" text-anchor="middle">交点 P₁</text>
                    `;
                }
            } else {
                const D_sq = ap.radius * ap.radius - (LineY - ap.center.y) * (LineY - ap.center.y);
                if (D_sq >= 0) {
                    const x1 = ap.center.x + Math.sqrt(D_sq);
                    const x2 = ap.center.x - Math.sqrt(D_sq);
                    drawHtml += `
                        <circle cx="${x1}" cy="${LineY}" r="7.5" class="intersection-point"></circle>
                        <text x="${x1}" y="${LineY - 14}" font-size="10.5px" font-weight="800" fill="var(--color-safe)" text-anchor="middle">交点 P₁</text>
                        
                        <circle cx="${x2}" cy="${LineY}" r="7.5" class="intersection-point"></circle>
                        <text x="${x2}" y="${LineY - 14}" font-size="10.5px" font-weight="800" fill="var(--color-safe)" text-anchor="middle">交点 P₂</text>
                    `;
                }
            }
        }

        // 9. 绘制顶点
        drawHtml += `
            <!-- 定点 A -->
            <circle cx="${ptA.x}" cy="${ptA.y}" r="8" class="drag-handle drag-handle-blue" data-point="A" title="拖动顶点 A"></circle>
            <!-- 定点 B -->
            <circle cx="${ptB.x}" cy="${ptB.y}" r="8" class="drag-handle drag-handle-danger" data-point="B" title="拖动顶点 B"></circle>
            <!-- 动点 P -->
            <circle cx="${ptP.x}" cy="${ptP.y}" r="9" class="drag-handle drag-handle-gold" data-point="P" title="拖动动点 P"></circle>
        `;

        sandboxSvg.innerHTML = `<g id="svg-world-layer">${drawHtml}</g>`;
        updateTransform();
        bindHandleEvents();
    }

    // ==========================================================================
    // 6. HTML 覆盖图层渲染 (文字标签与悬浮刻度)
    // ==========================================================================
    function renderHTMLOverlay() {
        const ap = calculateApollonius();
        let html = "";

        const isStep1 = proofStep === 1;
        const isStep2 = proofStep === 2;
        const isStep3 = proofStep === 3;
        const isStep4 = proofStep === 4;
        const showDE = !switchShowDE || switchShowDE.checked;

        // 顶点标签
        html += `<div class="floating-label" style="left:${ptA.x}px; top:${ptA.y - 18}px; color:#60a5fa;">A</div>`;
        html += `<div class="floating-label" style="left:${ptB.x}px; top:${ptB.y + 18}px; color:#f87171;">B</div>`;
        html += `<div class="floating-label" style="left:${ptP.x}px; top:${ptP.y - 18}px; color:var(--color-gold);">P</div>`;

        if (proofStep >= 1 && !ap.isLine && showDE) {
            html += `<div class="floating-label" style="left:${ap.D.x}px; top:${ap.D.y + 16}px; color:var(--color-purple);">D</div>`;
        }

        if (proofStep >= 2 && !ap.isLine && showDE) {
            html += `<div class="floating-label" style="left:${ap.E.x}px; top:${ap.E.y + 18}px; color:var(--color-purple);">E</div>`;
        }

        if (proofStep >= 4 && !ap.isLine && showDE) {
            html += `<div class="floating-label" style="left:${ap.center.x}px; top:${ap.center.y - 16}px; color:var(--color-gold);">C</div>`;
        }

        // 数值测量标签
        const valPANumber = dist(ptP, ptA) / 10;
        const valPBNumber = dist(ptP, ptB) / 10;
        const valPA = valPANumber.toFixed(1);
        const valPB = valPBNumber.toFixed(1);
        const currentRatioNumber = valPBNumber > 0.0001 ? valPANumber / valPBNumber : NaN;
        const currentRatio = Number.isFinite(currentRatioNumber) ? currentRatioNumber.toFixed(2) : "未定义";

        // 更新左侧面板的实时数据
        document.getElementById("val-pa").textContent = valPA;
        document.getElementById("val-pb").textContent = valPB;
        document.getElementById("val-current-ratio").textContent = currentRatio;

        // 在线段中点处浮动气泡
        html += `<div class="floating-text-badge color-blue" style="left:${(ptP.x + ptA.x)/2}px; top:${(ptP.y + ptA.y)/2}px;">PA = ${valPA}</div>`;
        html += `<div class="floating-text-badge color-red" style="left:${(ptP.x + ptB.x)/2}px; top:${(ptP.y + ptB.y)/2}px;">PB = ${valPB}</div>`;

        htmlOverlay.innerHTML = html;

        // 若比率偏差极其微小，触发金色星光
        const diffRatio = Math.abs(currentRatioNumber - ratioK);
        if (Number.isFinite(diffRatio) && diffRatio < 0.02 && !isPClosed) {
            createClosingSparkles();
        }
    }

    // 手动描迹产生的微量星光
    function spawnTraceSparkle(x, y) {
        for (let i = 0; i < 6; i++) {
            const p = document.createElement("div");
            p.className = "particle";
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            const angle = Math.random() * Math.PI * 2;
            const speed = 15 + Math.random() * 20;
            p.style.setProperty("--dx", `${Math.cos(angle) * speed}px`);
            p.style.setProperty("--dy", `${Math.sin(angle) * speed}px`);
            badgeContainer.appendChild(p);
            setTimeout(() => p.remove(), 1000);
        }
    }

    // 达成完美比率的粒子飞散与奖杯章
    function createClosingSparkles() {
        isPClosed = true;
        const rect = ptP;
        
        // 创建浮动徽章
        const badge = document.createElement("div");
        badge.className = "perfect-ratio-badge";
        badge.innerHTML = `🏆 契合轨迹比 k = ${ratioK.toFixed(2)}`;
        badge.style.left = `${rect.x}px`;
        badge.style.top = `${rect.y - 45}px`;
        badgeContainer.appendChild(badge);
        
        // 星光粒子
        for (let i = 0; i < 20; i++) {
            const p = document.createElement("div");
            p.className = "particle";
            p.style.left = `${rect.x}px`;
            p.style.top = `${rect.y}px`;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 80;
            p.style.setProperty("--dx", `${Math.cos(angle) * speed}px`);
            p.style.setProperty("--dy", `${Math.sin(angle) * speed}px`);
            
            badgeContainer.appendChild(p);
            setTimeout(() => p.remove(), 1000);
        }
        
        setTimeout(() => badge.remove(), 1200);
    }

    // ==========================================================================
    // 7. HUD 板书推导与分步渲染
    // ==========================================================================
    function renderHUDChalkboard() {
        let html = "";
        const k = ratioK.toFixed(2);
        const ap = calculateApollonius();

        if (ap.isLine && proofStep > 0) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-purple);">中垂线特例证明</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        当 <strong>k = 1</strong> 时，PA/PB = 1，即 <strong>PA = PB</strong>。
                    </div>
                    <div class="hud-formula-block" style="font-size:12px;">
                        到两个定点 A、B 距离相等的点，在线段 AB 的垂直平分线上。<br>
                        反过来，中垂线上的任意点到 A、B 的距离也相等。
                    </div>
                    <div class="success-chalk-box">
                        📌 <strong>结论</strong>：<br>
                        k = 1 的轨迹是 <strong>AB 的垂直平分线</strong>，不是以 DE 为直径的阿波罗尼斯圆。
                    </div>
                </div>
            `;
            stepsChalkboard.innerHTML = html;
            return;
        }

        if (proofStep === 0) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">💡 动点轨迹与阿氏圆</div>
                    <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">
                        在平面内，到两个定点 A、B 的距离之比等于常数 k (k &ne; 1) 的动点 P 的轨迹是圆。此圆即为<strong>阿波罗尼斯圆</strong>。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">🎮 交互探索说明</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        1. 任意拖拽定点 <strong>A</strong>、<strong>B</strong> 改变基础焦段。<br>
                        2. 拖拽动点 <strong>P</strong> 运行轨迹。当开启“锁定轨迹”时，P 将被吸附在黄金轨迹圆周上；解锁后，您可以自由探索平面上比值为 k 的点！
                    </div>
                </div>
                <div class="hud-row" style="opacity:0.85; font-size:11.5px;">
                    💡 <strong>提示</strong>：点击右侧“下一步”开始分步推导证明！
                </div>
            `;
        } else if (proofStep === 1) {
            let helperText = "";
            if (switchShowProofHelper && switchShowProofHelper.checked) {
                helperText = `
                    <div style="font-size:11px; color:var(--color-purple); margin-top:5px; border-top:1px dashed rgba(0,0,0,0.08); padding-top:5px; line-height:1.45;">
                        📖 <strong>相似辅助证明法</strong>：<br>
                        过 B 作 BK // AP 交 PD 延长线于 K。<br>
                        因 BK // AP，故 &ang;APK = &ang;BKP。<br>
                        又 PD 为平分线 &ang;APK = &ang;BPK，故 &ang;BKP = &ang;BPK &rArr; BK = BP (等腰)。<br>
                        根据 &triangle;APD &sim; &triangle;BKD：AD/DB = AP/BK = AP/BP = k。证毕！
                    </div>
                `;
            }
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-purple);">步骤 1/4：内角平分线与内分点 D</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        连接 PA、PB。作 &ang;APB 的角平分线 PD 交 AB 于 D：
                    </div>
                    <div class="hud-formula-block" style="font-size:12px;">
                        由角平分线定理：<br>
                        AD / DB = PA / PB = k = <strong>${k}</strong>
                    </div>
                    <div class="success-chalk-box">
                        📌 <strong>D 是定点</strong>：<br>
                        因为 A、B 是定点，且比值 k 固定，因此分点 D 在线段 AB 上的位置是唯一确定的！
                        ${helperText}
                    </div>
                </div>
            `;
        } else if (proofStep === 2) {
            let helperText = "";
            if (switchShowProofHelper && switchShowProofHelper.checked) {
                helperText = `
                    <div style="font-size:11px; color:var(--color-purple); margin-top:5px; border-top:1px dashed rgba(0,0,0,0.08); padding-top:5px; line-height:1.45;">
                        📖 <strong>相似辅助证明法</strong>：<br>
                        过 B 作 BK // AP 交 PE 延长线于 K。<br>
                        同理可证 BK = BP (等腰)，且 &triangle;EAP &sim; &triangle;EBK。<br>
                        根据相似比例得：AE/EB = AP/BK = AP/BP = k。证毕！
                    </div>
                `;
            }
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-purple);">步骤 2/4：外角平分线与外分点 E</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        作 &ang;APB 的外角平分线 PE 交 AB 的延长线于 E：
                    </div>
                    <div class="hud-formula-block" style="font-size:12px;">
                        由外角平分线定理：<br>
                        AE / EB = PA / PB = k = <strong>${k}</strong>
                    </div>
                    <div class="success-chalk-box">
                        📌 <strong>E 也是定点</strong>：<br>
                        同理，外分点 E 在直线 AB 上的位置也是唯一确定的！
                        ${helperText}
                    </div>
                </div>
            `;
        } else if (proofStep === 3) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-purple);">步骤 3/4：夹角直角定理</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        内角平分线 PD 与外角平分线 PE 是邻补角的平分线。根据补角平分线定理：
                    </div>
                    <div class="hud-formula-block" style="font-size:12.5px; font-family:var(--font-mono);">
                        &ang;DPE = &ang;DPB + &ang;BPE<br>
                        &ang;DPE = 1/2 &ang;APB + 1/2 &ang;BP(A延长)<br>
                        &ang;DPE &equiv; 90&deg;
                    </div>
                    <div class="success-chalk-box" style="border-color:var(--color-purple); color:#e9d5ff;">
                        ⚡ <strong>夹角直角恒成立</strong>：<br>
                        无论动点 P 运动到何处，在满足 PA/PB = k 的条件下，<strong>&ang;DPE 始终等于 90&deg;</strong>！
                    </div>
                </div>
            `;
        } else if (proofStep === 4) {
            html = `
                <div class="hud-row">
                    <div class="hud-row-label" style="color:var(--color-gold);">步骤 4/4：直径圆几何论证</div>
                    <div style="font-size:12px; line-height:1.6; color:var(--text-secondary);">
                        由于点 D 与 E 是两个不变的定点：
                    </div>
                    <div class="hud-formula-block" style="font-size:12px;">
                        线段 DE 是固定的。<br>
                        动点 P 对定线段 DE 的张角 &ang;DPE 恒等于 90&deg;。<br>
                        圆心 C 即为 DE 的中点，半径 R = DE / 2
                    </div>
                    <div class="success-chalk-box" style="border-color:var(--color-safe); color:#a7f3d0;">
                        🎉 <strong>得出结论</strong>：<br>
                        根据“直角所对的弦是直径”，动点 P 的运动轨迹是以 <strong>DE</strong> 为直径的圆！此圆即为阿波罗尼斯圆！
                    </div>
                </div>
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    function updateTheoryPanel() {
        theoryTitle.innerHTML = `💡 阿波罗尼斯圆的来历`;
        theoryText.innerHTML = `
            <p>阿波罗尼斯（Apollonius，约公元前262年-前190年）是古希腊伟大的几何学家，与阿基米德、欧几里得并称为“亚历山大时期的三巨头”。</p>
            <p style="margin-top:6px;">他在著作《圆锥曲线论》中系统研究了圆及二次曲线，并提出了这个经典的距离之比动点轨迹模型。</p>
            <p style="margin-top:6px;"><strong>应用场景</strong>：在现代GPS定位、无线电雷达多点交会测距（TDOA技术）以及初中几何最值压轴题（“隐形圆模型”）中，阿氏圆都有极其广泛的应用。</p>
        `;
    }

    // ==========================================================================
    // 8. 拖拽与交互控制事件处理
    // ==========================================================================
    function bindHandleEvents() {
        const handles = sandboxSvg.querySelectorAll(".drag-handle");
        handles.forEach(handle => {
            handle.addEventListener("mousedown", onDragStart);
            handle.addEventListener("touchstart", onDragStart, { passive: false });
        });
    }

    function getEventClient(e) {
        const point = e.touches ? e.touches[0] : e;
        return { x: point.clientX, y: point.clientY };
    }

    function getScenePoint(clientX, clientY) {
        const rect = sandboxWrapper.getBoundingClientRect();
        return {
            x: (clientX - rect.left - panOffset.x) / zoomScale,
            y: (clientY - rect.top - panOffset.y) / zoomScale
        };
    }

    function onDragStart(e) {
        e.preventDefault();
        e.stopPropagation();
        const { x: clientX, y: clientY } = getEventClient(e);

        const pointName = e.target.getAttribute("data-point");
        activeNode = pointName;

        const { x: mouseX, y: mouseY } = getScenePoint(clientX, clientY);

        if (pointName === "A") {
            dragOffset.x = mouseX - ptA.x;
            dragOffset.y = mouseY - ptA.y;
        } else if (pointName === "B") {
            dragOffset.x = mouseX - ptB.x;
            dragOffset.y = mouseY - ptB.y;
        } else if (pointName === "P") {
            dragOffset.x = mouseX - ptP.x;
            dragOffset.y = mouseY - ptP.y;
        }

        e.target.classList.add("active");

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

        const { x: clientX, y: clientY } = getEventClient(e);
        const { x: mouseX, y: mouseY } = getScenePoint(clientX, clientY);

        if (activeNode === "A") {
            ptA.x = Math.max(50, Math.min(750, mouseX - dragOffset.x));
            ptA.y = Math.max(50, Math.min(550, mouseY - dragOffset.y));
            // 防止 A 与 B 重合
            if (dist(ptA, ptB) < 30) {
                const angle = Math.atan2(ptA.y - ptB.y, ptA.x - ptB.x);
                ptA.x = ptB.x + 30 * Math.cos(angle);
                ptA.y = ptB.y + 30 * Math.sin(angle);
            }
            // A 点改变时，若开启了锁轨迹，动点 P 应吸附过去
            if (switchLockLocus.checked) {
                ptP = getClosestPointOnLocus(ptP);
            }
        } else if (activeNode === "B") {
            ptB.x = Math.max(50, Math.min(750, mouseX - dragOffset.x));
            ptB.y = Math.max(50, Math.min(550, mouseY - dragOffset.y));
            if (dist(ptA, ptB) < 30) {
                const angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x);
                ptB.x = ptA.x + 30 * Math.cos(angle);
                ptB.y = ptA.y + 30 * Math.sin(angle);
            }
            if (switchLockLocus.checked) {
                ptP = getClosestPointOnLocus(ptP);
            }
        } else if (activeNode === "P") {
            const rawP = {
                x: Math.max(30, Math.min(770, mouseX - dragOffset.x)),
                y: Math.max(30, Math.min(570, mouseY - dragOffset.y))
            };
            if (switchLockLocus.checked) {
                ptP = getClosestPointOnLocus(rawP);
            } else {
                ptP = rawP;
                if (switchTraceMode && switchTraceMode.checked) {
                    const valPA = dist(ptP, ptA) / 10;
                    const valPB = dist(ptP, ptB) / 10;
                    if (valPB > 0.1) {
                        const currentRatio = valPA / valPB;
                        if (Math.abs(currentRatio - ratioK) < 0.04) {
                            const tooClose = tracePoints.some(pt => Math.hypot(pt.x - ptP.x, pt.y - ptP.y) < 14);
                            if (!tooClose) {
                                tracePoints.push({ x: ptP.x, y: ptP.y });
                                spawnTraceSparkle(ptP.x, ptP.y);
                            }
                        }
                    }
                }
            }
        }

        render();
    }

    function onDragEnd() {
        if (!activeNode) return;
        const handle = sandboxSvg.querySelector(`.drag-handle[data-point="${activeNode}"]`);
        if (handle) handle.classList.remove("active");

        activeNode = null;
        window.removeEventListener("mousemove", onDragging);
        window.removeEventListener("touchmove", onDragging);
        window.removeEventListener("mouseup", onDragEnd);
        window.removeEventListener("touchend", onDragEnd);
        window.removeEventListener("touchcancel", onDragEnd);
        window.removeEventListener("blur", onDragEnd);
        
        isPClosed = false; // 解锁下一次星光碰撞
    }

    function shouldIgnoreViewportMove(target) {
        return !!target.closest(".drag-handle, .collapsible-hud, .canvas-toolbar, button, input, label, textarea, select");
    }

    function onViewportWheel(e) {
        if (shouldIgnoreViewportMove(e.target)) return;
        e.preventDefault();
        const rect = sandboxWrapper.getBoundingClientRect();
        const scenePoint = getScenePoint(e.clientX, e.clientY);
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const nextZoom = Math.max(VIEW_MIN_SCALE, Math.min(VIEW_MAX_SCALE, zoomScale * factor));
        if (nextZoom === zoomScale) return;
        panOffset.x = e.clientX - rect.left - scenePoint.x * nextZoom;
        panOffset.y = e.clientY - rect.top - scenePoint.y * nextZoom;
        zoomScale = nextZoom;
        updateTransform();
    }

    function onViewportPanStart(e) {
        if (shouldIgnoreViewportMove(e.target)) return;
        if (e.touches?.length > 1) return;
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        const { x, y } = getEventClient(e);
        viewportDrag = {
            startX: x,
            startY: y,
            originX: panOffset.x,
            originY: panOffset.y
        };
        sandboxWrapper.classList.add("is-panning");
        window.addEventListener("mousemove", onViewportPanning);
        window.addEventListener("touchmove", onViewportPanning, { passive: false });
        window.addEventListener("mouseup", onViewportPanEnd);
        window.addEventListener("touchend", onViewportPanEnd);
        window.addEventListener("touchcancel", onViewportPanEnd);
        window.addEventListener("blur", onViewportPanEnd);
    }

    function onViewportPanning(e) {
        if (!viewportDrag) return;
        e.preventDefault();
        const { x, y } = getEventClient(e);
        panOffset.x = viewportDrag.originX + x - viewportDrag.startX;
        panOffset.y = viewportDrag.originY + y - viewportDrag.startY;
        updateTransform();
    }

    function onViewportPanEnd() {
        viewportDrag = null;
        sandboxWrapper.classList.remove("is-panning");
        window.removeEventListener("mousemove", onViewportPanning);
        window.removeEventListener("touchmove", onViewportPanning);
        window.removeEventListener("mouseup", onViewportPanEnd);
        window.removeEventListener("touchend", onViewportPanEnd);
        window.removeEventListener("touchcancel", onViewportPanEnd);
        window.removeEventListener("blur", onViewportPanEnd);
    }

    function beginViewportPinch(event) {
        if (event.touches.length !== 2 || shouldIgnoreViewportMove(event.target)) return;
        event.preventDefault();
        onViewportPanEnd();
        const [first, second] = event.touches;
        const rect = sandboxWrapper.getBoundingClientRect();
        const centerX = (first.clientX + second.clientX) / 2 - rect.left;
        const centerY = (first.clientY + second.clientY) / 2 - rect.top;
        pinchState = {
            distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
            scale: zoomScale,
            worldX: (centerX - panOffset.x) / zoomScale,
            worldY: (centerY - panOffset.y) / zoomScale
        };
    }

    function moveViewportPinch(event) {
        if (!pinchState || event.touches.length !== 2) return;
        event.preventDefault();
        const [first, second] = event.touches;
        const rect = sandboxWrapper.getBoundingClientRect();
        const centerX = (first.clientX + second.clientX) / 2 - rect.left;
        const centerY = (first.clientY + second.clientY) / 2 - rect.top;
        const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
        zoomScale = Math.max(VIEW_MIN_SCALE, Math.min(VIEW_MAX_SCALE, pinchState.scale * distance / Math.max(1, pinchState.distance)));
        panOffset.x = centerX - pinchState.worldX * zoomScale;
        panOffset.y = centerY - pinchState.worldY * zoomScale;
        updateTransform();
    }

    function endViewportPinch(event) {
        if (event.touches.length < 2) pinchState = null;
    }

    // ==========================================================================
    // 9. 按钮与交互参数控制
    // ==========================================================================
    if (slideK) {
        slideK.addEventListener("input", (e) => {
            ratioK = parseFloat(e.target.value);
            // 实时显示
            kValIndicator.textContent = ratioK.toFixed(2);
            
            // 当 k 改变，若锁轨迹，重定位 P
            if (switchLockLocus.checked) {
                ptP = getClosestPointOnLocus(ptP);
            }
            fitLocusView();
            updateProofStepUI();
            render();
        });
    }

    // 经典场景预设
    document.querySelectorAll(".btn-preset[data-preset]").forEach(btn => {
        btn.addEventListener("click", () => {
            const preset = btn.getAttribute("data-preset");
            if (preset === "half-ratio") {
                ratioK = 0.50;
                ptA = { x: 280, y: 300 };
                ptB = { x: 500, y: 300 };
                ptP = { x: 206, y: 300 }; // 锁在左侧外分点处附近
            } else if (preset === "equal-ratio") {
                ratioK = 1.00;
                ptA = { x: 260, y: 300 };
                ptB = { x: 440, y: 300 };
                ptP = { x: 350, y: 180 };
            } else if (preset === "double-ratio") {
                ratioK = 2.00;
                ptA = { x: 220, y: 300 };
                ptB = { x: 460, y: 300 };
                ptP = { x: 540, y: 300 };
            }

            if (slideK) {
                slideK.value = ratioK;
                kValIndicator.textContent = ratioK.toFixed(2);
            }

            if (switchLockLocus.checked) {
                ptP = getClosestPointOnLocus(ptP);
            }

            proofStep = 0;
            fitLocusView();
            updateProofStepUI();
            render();
        });
    });

    // 辅助参数及步骤按钮控制
    if (btnProofPrev && btnProofNext) {
        btnProofPrev.addEventListener("click", () => {
            proofStep = Math.max(0, proofStep - 1);
            updateProofStepUI();
            render();
        });

        btnProofNext.addEventListener("click", () => {
            proofStep = Math.min(getMaxProofStep(), proofStep + 1);
            updateProofStepUI();
            render();
        });
    }

    function getMaxProofStep() {
        return calculateApollonius().isLine ? 1 : 4;
    }

    function updateProofStepUI() {
        if (!proofStepIndicator) return;
        const maxProofStep = getMaxProofStep();
        proofStep = Math.min(proofStep, maxProofStep);
        if (proofStep === 0) {
            proofStepIndicator.textContent = "自由探索模式";
            proofStepIndicator.style.color = "var(--text-secondary)";
            btnProofPrev.disabled = true;
            btnProofNext.disabled = false;
        } else if (maxProofStep === 1) {
            proofStepIndicator.textContent = "中垂线特例证明";
            proofStepIndicator.style.color = "var(--color-purple)";
            btnProofPrev.disabled = false;
            btnProofNext.disabled = true;
        } else {
            proofStepIndicator.textContent = `证明步骤 ${proofStep} / 4`;
            proofStepIndicator.style.color = "var(--color-purple)";
            btnProofPrev.disabled = false;
            btnProofNext.disabled = proofStep === maxProofStep;
        }
    }

    // 缩放视口操作
    btnZoomIn.addEventListener("click", () => {
        zoomScale = Math.min(zoomScale * 1.15, VIEW_MAX_SCALE);
        updateTransform();
    });
    btnZoomOut.addEventListener("click", () => {
        zoomScale = Math.max(zoomScale / 1.15, VIEW_MIN_SCALE);
        updateTransform();
    });
    btnZoomReset.addEventListener("click", () => {
        fitLocusView();
    });

    btnResetState.addEventListener("click", () => {
        proofStep = 0;
        ratioK = 1.50;
        ptA = { x: 260, y: 300 };
        ptB = { x: 440, y: 300 };
        ptP = { x: 320, y: 180 };
        tracePoints = [];
        
        if (slideK) {
            slideK.value = 1.50;
            kValIndicator.textContent = "1.50";
        }
        switchLockLocus.checked = true;
        switchShowDE.checked = true;
        if (switchShowProofHelper) switchShowProofHelper.checked = true;
        if (switchShowExamLine) switchShowExamLine.checked = false;
        if (switchTraceMode) switchTraceMode.checked = false;

        ptP = getClosestPointOnLocus(ptP);
        fitLocusView();
        updateProofStepUI();
        render();
    });

    function updateTransform() {
        const transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`;
        const svgWorldLayer = sandboxSvg.querySelector("#svg-world-layer");
        if (svgWorldLayer) {
            svgWorldLayer.setAttribute("transform", `translate(${panOffset.x} ${panOffset.y}) scale(${zoomScale})`);
        }
        sandboxSvg.style.transform = "";
        sandboxSvg.style.transformOrigin = "";
        [htmlOverlay, badgeContainer].forEach(layer => {
            if (!layer) return;
            layer.style.transform = transform;
            layer.style.transformOrigin = "0 0";
        });
    }

    sandboxWrapper.addEventListener("wheel", onViewportWheel, { passive: false });
    sandboxWrapper.addEventListener("mousedown", onViewportPanStart);
    sandboxWrapper.addEventListener("touchstart", onViewportPanStart, { passive: false });
    sandboxWrapper.addEventListener("touchstart", beginViewportPinch, { passive: false });
    sandboxWrapper.addEventListener("touchmove", moveViewportPinch, { passive: false });
    sandboxWrapper.addEventListener("touchend", endViewportPinch, { passive: false });
    sandboxWrapper.addEventListener("touchcancel", endViewportPinch, { passive: false });

    // 注册切换控制
    switchLockLocus.addEventListener("change", () => {
        if (switchLockLocus.checked) {
            // 锁定轨迹时，自动关掉手动描点探究模式，以防冲突
            if (switchTraceMode) switchTraceMode.checked = false;
            ptP = getClosestPointOnLocus(ptP);
            render();
        }
    });

    switchShowDE.addEventListener("change", () => {
        render();
    });

    if (switchShowProofHelper) {
        switchShowProofHelper.addEventListener("change", () => {
            render();
        });
    }

    if (switchShowExamLine) {
        switchShowExamLine.addEventListener("change", () => {
            render();
        });
    }

    if (switchTraceMode) {
        switchTraceMode.addEventListener("change", () => {
            if (switchTraceMode.checked) {
                // 开启手工描点探究时，必须关掉轨迹锁定，让用户能自由滑点
                switchLockLocus.checked = false;
            }
            render();
        });
    }

    if (btnClearTrace) {
        btnClearTrace.addEventListener("click", () => {
            tracePoints = [];
            render();
        });
    }

    // ==========================================================================
    // 9.5 可收起 HUD 面板交互
    // ==========================================================================
    const hudPanel = document.getElementById("hud-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");
    const hudRestoreBtn = document.getElementById("hud-restore-btn");

    if (hudToggleBtn && hudPanel) {
        const syncHudState = (collapsed) => {
            hudPanel.classList.toggle("collapsed", collapsed);
            hudToggleBtn.textContent = collapsed ? "+" : "−";
            hudToggleBtn.setAttribute("aria-expanded", String(!collapsed));
            if (hudRestoreBtn) hudRestoreBtn.classList.add("hidden");
        };

        hudToggleBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            syncHudState(!hudPanel.classList.contains("collapsed"));
        });

        syncHudState(hudPanel.classList.contains("collapsed"));
    }

    // ==========================================================================
    // 10. 初始化与入口
    // ==========================================================================
    function render() {
        renderSVG();
        renderHTMLOverlay();
        renderHUDChalkboard();
    }

    // 初始化运行
    ptP = getClosestPointOnLocus(ptP);
    fitLocusView();
    if (typeof ResizeObserver !== "undefined") {
        const resizeObserver = new ResizeObserver(() => {
            if (!activeNode && !viewportDrag) {
                fitLocusView();
            }
        });
        resizeObserver.observe(sandboxWrapper);
    } else {
        window.addEventListener("resize", fitLocusView);
    }
    updateTheoryPanel();
    updateProofStepUI();
    render();
    requestAnimationFrame(fitLocusView);
});

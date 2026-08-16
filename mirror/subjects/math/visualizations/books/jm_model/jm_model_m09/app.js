/**
 * A字型相似模型演示仪 - 几何可视化交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态变量与参数
    // ==========================================================================
    let currentScene = "parallel-similarity"; // parallel-similarity | intercept-theorem | rotated-similarity
    let isAnimating = false;
    let isHudExpanded = false; // HUD 默认收起

    // 几何比例值 (D点在AB上的比值，范围为 0.25 到 0.80)
    let ratioDE = 0.55;

    // LERP 数值平滑系统
    const renderValues = {
        ratioDE: 0.55,
        animProgress: 0.0,
        // 各线段的测量值 (单位: 厘米)
        ad: 0.0, db: 0.0, ab: 0.0,
        ae: 0.0, ec: 0.0, ac: 0.0,
        de: 0.0, bc: 0.0
    };

    // 画布缩放与平移状态
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // 拖拽几何点状态
    let activeDragPoint = null;

    // 动画进度控制
    let animProgress = 0.0; // 0.0 ~ 1.0
    let animDirection = 0;  // 1: 播放重合, -1: 展开回弹
    let autoDemoHoldTimer = null;
    const PLAY_ICON = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>`;

    // ==========================================================================
    // 2. 几何点坐标定义
    // ==========================================================================
    const SCALE_CM_TO_PX = 45; // 坐标尺标常数 (45像素代表1厘米)

    let centerX = 400;
    let centerY = 300;

    // 三角形顶点坐标 (像素坐标系)
    const points = {
        A: { x: 400, y: 120 },
        B: { x: 230, y: 440 },
        C: { x: 570, y: 440 },
        // 截断点 D 和 E 的实时位置
        D: { x: 300, y: 300 },
        E: { x: 500, y: 300 }
    };

    // ==========================================================================
    // 3. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");

    const sliderRatioDE = document.getElementById("slider-ratio-de");
    const valRatioDE = document.getElementById("val-ratio-de");

    const btnPlayFolding = document.getElementById("btn-play-folding");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");
    const teachingStatusCard = document.createElement("div");
    teachingStatusCard.id = "teaching-status-card";
    teachingStatusCard.className = "teaching-status-card is-proof";
    sandboxWrapper.appendChild(teachingStatusCard);

    // ==========================================================================
    // 4. Canvas 物理粒子效果 (Spark Fireworks)
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
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.75) * 12 - 4;
            this.radius = Math.random() * 4 + 2.5;
            this.color = color;
            this.alpha = 1.0;
            this.gravity = 0.3;
            this.life = 1.0;
            this.decay = Math.random() * 0.02 + 0.012;
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
            c.shadowBlur = 12;
            c.shadowColor = this.color;
            c.fill();
            c.restore();
        }
    }

    function spawnExplosion(x, y, color = "#10b981") {
        for (let i = 0; i < 45; i++) {
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
    // 5. 几何核心解算器 (Analytic Geometry Solver)
    // ==========================================================================
    
    // 验证三角形的合理性，防止拉成一条直线或交错
    function validateTriangle() {
        const area = Math.abs(
            points.A.x * (points.B.y - points.C.y) +
            points.B.x * (points.C.y - points.A.y) +
            points.C.x * (points.A.y - points.B.y)
        ) / 2;
        return area > 2000; 
    }

    function solveGeometry() {
        const A = points.A;
        const B = points.B;
        const C = points.C;

        const AB_vec = { x: B.x - A.x, y: B.y - A.y };
        const AC_vec = { x: C.x - A.x, y: C.y - A.y };

        const lenAB = Math.hypot(AB_vec.x, AB_vec.y);
        const lenAC = Math.hypot(AC_vec.x, AC_vec.y);

        // 使用 LERP 后的平滑比例值进行实际坐标渲染计算
        const r = renderValues.ratioDE;

        if (currentScene === "parallel-similarity" || currentScene === "intercept-theorem") {
            // 平行截线：D 和 E 分别在 AB 和 AC 的 r 比例处
            points.D.x = A.x + r * AB_vec.x;
            points.D.y = A.y + r * AB_vec.y;
            points.E.x = A.x + r * AC_vec.x;
            points.E.y = A.y + r * AC_vec.y;
        } else if (currentScene === "rotated-similarity") {
            // 旋转相似：满足 △ADE ∽ △ACB => AD / AC = AE / AB
            // 故 AE = AD * AB / AC => AE / AC = (AD / AB) * (AB^2 / AC^2) = r * (AB^2 / AC^2)
            // 为防止 E 超出 AC 太多导致变形，对 E 的比例进行上限约束
            const maxRForD = 0.95 * (lenAC * lenAC) / (lenAB * lenAB);
            const r_render = Math.min(r, maxRForD);

            points.D.x = A.x + r_render * AB_vec.x;
            points.D.y = A.y + r_render * AB_vec.y;

            const w = r_render * (lenAB * lenAB) / (lenAC * lenAC);
            points.E.x = A.x + w * AC_vec.x;
            points.E.y = A.y + w * AC_vec.y;
        }

        // 更新测量值 (像素转换为厘米展示，除以比例常数)
        const scale = SCALE_CM_TO_PX;
        const D = points.D;
        const E = points.E;

        renderValues.ad = Math.hypot(D.x - A.x, D.y - A.y) / scale;
        renderValues.db = Math.hypot(B.x - D.x, B.y - D.y) / scale;
        renderValues.ab = Math.hypot(B.x - A.x, B.y - A.y) / scale;

        renderValues.ae = Math.hypot(E.x - A.x, E.y - A.y) / scale;
        renderValues.ec = Math.hypot(C.x - E.x, C.y - E.y) / scale;
        renderValues.ac = Math.hypot(C.x - A.x, C.y - A.y) / scale;

        renderValues.de = Math.hypot(E.x - D.x, E.y - D.y) / scale;
        renderValues.bc = Math.hypot(C.x - B.x, C.y - B.y) / scale;
    }

    // 辅助：获取夹角圆弧的 SVG Path (M x y A r r ...)
    function getAngleArcPath(vertex, p1, p2, radius, isSector = false) {
        const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
        const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
        const len1 = Math.hypot(v1.x, v1.y);
        const len2 = Math.hypot(v2.x, v2.y);
        if (len1 < 1e-3 || len2 < 1e-3) return "";

        const a1 = Math.atan2(v1.y, v1.x);
        const a2 = Math.atan2(v2.y, v2.x);

        let diff = a2 - a1;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;

        const sweep = diff > 0 ? 1 : 0;
        const sX = vertex.x + radius * Math.cos(a1);
        const sY = vertex.y + radius * Math.sin(a1);
        const eX = vertex.x + radius * Math.cos(a2);
        const eY = vertex.y + radius * Math.sin(a2);

        if (isSector) {
            return `M ${vertex.x} ${vertex.y} L ${sX} ${sY} A ${radius} ${radius} 0 0 ${sweep} ${eX} ${eY} Z`;
        } else {
            return `M ${sX} ${sY} A ${radius} ${radius} 0 0 ${sweep} ${eX} ${eY}`;
        }
    }

    function getDemoStep() {
        const t = renderValues.animProgress;
        if (!isAnimating && t < 0.01) return 0;
        if (t < 0.18) return 1;
        if (t < 0.38) return 2;
        if (t < 0.72) return 3;
        return 4;
    }

    function pointOnSegment(p1, p2, t) {
        return {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        };
    }

    function drawTrianglePatch(p1, p2, p3, className) {
        return `<polygon class="geo-triangle-patch ${className}" points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}"></polygon>`;
    }

    function drawTickMark(p1, p2, className = "mark-blue", count = 1, t = 0.5) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len < 1e-3) return "";
        const nx = -dy / len;
        const ny = dx / len;
        const cx = p1.x + dx * t;
        const cy = p1.y + dy * t;
        const gap = count === 1 ? 0 : 7;
        let html = "";
        for (let i = 0; i < count; i++) {
            const shift = (i - (count - 1) / 2) * gap;
            const sx = cx + (dx / len) * shift;
            const sy = cy + (dy / len) * shift;
            html += `<line class="geo-equal-tick ${className}" x1="${sx - nx * 7}" y1="${sy - ny * 7}" x2="${sx + nx * 7}" y2="${sy + ny * 7}"></line>`;
        }
        return html;
    }

    function drawAngleBadge(pt, text, className, offset = { x: 0, y: 0 }) {
        return `<text class="geo-angle-badge ${className}" x="${pt.x + offset.x}" y="${pt.y + offset.y}">${text}</text>`;
    }

    // ==========================================================================
    // 6. SVG 渲染逻辑
    // ==========================================================================
    function drawSVGPoint(id, pt, labelText, offset = { x: 12, y: 6 }, isDraggable = false) {
        let ptClass = "geo-point-wrapper";
        if (isDraggable) ptClass += " draggable-point";

        let html = `
            <g class="${ptClass}" data-point-id="${id}">
                <circle class="geo-point-halo" cx="${pt.x}" cy="${pt.y}" r="${isDraggable ? 34 : 18}"></circle>
                <circle class="geo-point" cx="${pt.x}" cy="${pt.y}" r="6"></circle>
            </g>
        `;
        const textX = pt.x + offset.x;
        const textY = pt.y + offset.y;
        html += `<text class="geo-label" x="${textX}" y="${textY}">${labelText}</text>`;
        return html;
    }

    function renderSVG() {
        const A = points.A;
        const B = points.B;
        const C = points.C;
        const D = points.D;
        const E = points.E;
        const demoStep = getDemoStep();

        let drawHtml = "";
        let angleBadgeHtml = "";

        // 1. 三角形层级：大三角做底，小三角做重点
        drawHtml += drawTrianglePatch(A, B, C, currentScene === "rotated-similarity" ? "patch-main rotated-target" : "patch-main");
        if (currentScene === "parallel-similarity" || currentScene === "rotated-similarity") {
            drawHtml += drawTrianglePatch(A, D, E, currentScene === "rotated-similarity" ? "patch-inner patch-rotated" : "patch-inner");
        }

        // 2. 角度标记渲染 (增强几何直观感)
        if (currentScene === "parallel-similarity") {
            // 平行相似: ∠ADE = ∠B, ∠AED = ∠C
            const angleClass = demoStep === 2 ? " demo-hot" : "";
            drawHtml += `<path class="geo-angle-sector${angleClass}" d="${getAngleArcPath(D, A, E, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${angleClass}" d="${getAngleArcPath(D, A, E, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector${angleClass}" d="${getAngleArcPath(B, A, C, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${angleClass}" d="${getAngleArcPath(B, A, C, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector sector-warning${angleClass}" d="${getAngleArcPath(E, A, D, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc arc-warning${angleClass}" d="${getAngleArcPath(E, A, D, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector sector-warning${angleClass}" d="${getAngleArcPath(C, A, B, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc arc-warning${angleClass}" d="${getAngleArcPath(C, A, B, 22)}"></path>`;
            angleBadgeHtml += drawAngleBadge(D, "1", "pair-blue", { x: -18, y: 26 });
            angleBadgeHtml += drawAngleBadge(B, "1", "pair-blue", { x: 20, y: -12 });
            angleBadgeHtml += drawAngleBadge(E, "2", "pair-orange", { x: 18, y: 26 });
            angleBadgeHtml += drawAngleBadge(C, "2", "pair-orange", { x: -28, y: -12 });
            angleBadgeHtml += drawAngleBadge(A, "公共角", "pair-common", { x: -28, y: 34 });
        } else if (currentScene === "rotated-similarity") {
            // 反平行相似: ∠ADE = ∠C, ∠AED = ∠B
            const angleClass = demoStep === 2 ? " demo-hot" : "";
            drawHtml += `<path class="geo-angle-sector${angleClass}" d="${getAngleArcPath(D, A, E, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${angleClass}" d="${getAngleArcPath(D, A, E, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector${angleClass}" d="${getAngleArcPath(C, A, B, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${angleClass}" d="${getAngleArcPath(C, A, B, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector sector-warning${angleClass}" d="${getAngleArcPath(E, A, D, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc arc-warning${angleClass}" d="${getAngleArcPath(E, A, D, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector sector-warning${angleClass}" d="${getAngleArcPath(B, A, C, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc arc-warning${angleClass}" d="${getAngleArcPath(B, A, C, 22)}"></path>`;
            angleBadgeHtml += drawAngleBadge(D, "1", "pair-blue", { x: -18, y: 26 });
            angleBadgeHtml += drawAngleBadge(C, "1", "pair-blue", { x: -28, y: -12 });
            angleBadgeHtml += drawAngleBadge(E, "2", "pair-orange", { x: 18, y: 26 });
            angleBadgeHtml += drawAngleBadge(B, "2", "pair-orange", { x: 20, y: -12 });
            angleBadgeHtml += drawAngleBadge(A, "公共角", "pair-common", { x: -28, y: 34 });

            // 画角 A 的平分线 (虚线辅助线)
            const dxB = B.x - A.x, dyB = B.y - A.y;
            const lenB = Math.hypot(dxB, dyB);
            const dxC = C.x - A.x, dyC = C.y - A.y;
            const lenC = Math.hypot(dxC, dyC);

            let bisectX = (dxB / lenB) + (dxC / lenC);
            let bisectY = (dyB / lenB) + (dyC / lenC);
            const lenBisect = Math.hypot(bisectX, bisectY);
            if (lenBisect > 1e-4) {
                bisectX = (bisectX / lenBisect) * Math.max(lenB, lenC) * 0.9;
                bisectY = (bisectY / lenBisect) * Math.max(lenB, lenC) * 0.9;
                drawHtml += `<line class="geo-line-construction" x1="${A.x}" y1="${A.y}" x2="${A.x + bisectX}" y2="${A.y + bisectY}"></line>`;
            }
        }

        // 3. 线段绘制
        if (currentScene === "parallel-similarity" || currentScene === "rotated-similarity") {
            // 场景 1 和 3：绘制基础的三角形边线
            drawHtml += `
                <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#0f172a" stroke-width="3"></line>
                <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}" stroke="#0f172a" stroke-width="3"></line>
                <line class="geo-line-seg" x1="${B.x}" y1="${B.y}" x2="${C.x}" y2="${C.y}" stroke="#0f172a" stroke-dasharray="3 3" stroke-width="2.5"></line>
                <line class="geo-line-seg seg-base" x1="${B.x}" y1="${B.y}" x2="${C.x}" y2="${C.y}"></line>
            `;
            // 绘制截线 DE
            const deClass = currentScene === "parallel-similarity" ? "seg-de" : "seg-de-rotated";
            drawHtml += `<line class="geo-line-seg ${deClass}" x1="${D.x}" y1="${D.y}" x2="${E.x}" y2="${E.y}"></line>`;

            if (currentScene === "parallel-similarity") {
                const hot = demoStep === 3 || demoStep === 4 ? " demo-hot" : "";
                drawHtml += drawTickMark(A, D, `mark-blue${hot}`, 1, 0.54);
                drawHtml += drawTickMark(A, B, `mark-blue${hot}`, 1, 0.72);
                drawHtml += drawTickMark(A, E, `mark-green${hot}`, 2, 0.54);
                drawHtml += drawTickMark(A, C, `mark-green${hot}`, 2, 0.72);
                drawHtml += drawTickMark(D, E, `mark-orange${hot}`, 3, 0.50);
                drawHtml += drawTickMark(B, C, `mark-orange${hot}`, 3, 0.50);
            } else {
                const hot = demoStep === 3 || demoStep === 4 ? " demo-hot" : "";
                drawHtml += drawTickMark(A, D, `mark-purple${hot}`, 1, 0.54);
                drawHtml += drawTickMark(A, C, `mark-purple${hot}`, 1, 0.72);
                drawHtml += drawTickMark(A, E, `mark-green${hot}`, 2, 0.54);
                drawHtml += drawTickMark(A, B, `mark-green${hot}`, 2, 0.72);
                drawHtml += drawTickMark(D, E, `mark-orange${hot}`, 3, 0.50);
                drawHtml += drawTickMark(B, C, `mark-orange${hot}`, 3, 0.50);
            }

        } else if (currentScene === "intercept-theorem") {
            // 场景 2 (成比例截线段): 高亮分段线段 AD, DB, AE, EC (配合 CSS 配色)
            drawHtml += `
                <line class="geo-line-seg seg-ad" x1="${A.x}" y1="${A.y}" x2="${D.x}" y2="${D.y}"></line>
                <line class="geo-line-seg seg-db" x1="${D.x}" y1="${D.y}" x2="${B.x}" y2="${B.y}"></line>
                <line class="geo-line-seg seg-ae" x1="${A.x}" y1="${A.y}" x2="${E.x}" y2="${E.y}"></line>
                <line class="geo-line-seg seg-ec" x1="${E.x}" y1="${E.y}" x2="${C.x}" y2="${C.y}"></line>
                <line class="geo-line-seg seg-base" x1="${B.x}" y1="${B.y}" x2="${C.x}" y2="${C.y}"></line>
                <line class="geo-line-seg" x1="${D.x}" y1="${D.y}" x2="${E.x}" y2="${E.y}" stroke="var(--text-muted)" stroke-dasharray="5 4" stroke-width="3"></line>
            `;
            drawHtml += drawTickMark(A, D, "mark-blue", 1, 0.52);
            drawHtml += drawTickMark(D, B, "mark-purple", 2, 0.48);
            drawHtml += drawTickMark(A, E, "mark-green", 1, 0.52);
            drawHtml += drawTickMark(E, C, "mark-orange", 2, 0.48);
        }

        // 4. 重合动画叠加图层绘制 (当处于播放状态时)
        const t = renderValues.animProgress;
        if (t > 0.001) {
            if (currentScene === "parallel-similarity") {
                // 平行 A 字相似动画：较小的 △ADE 从 A 点以 (1 + t * (1/r - 1)) 的倍数沿着射线放大并向下平移覆盖 △ABC
                const scaleFactor = 1.0 + t * (1.0 / renderValues.ratioDE - 1.0);
                
                // 缩放后的顶点 (以 A 为原点缩放)
                const animD = {
                    x: A.x + scaleFactor * (D.x - A.x),
                    y: A.y + scaleFactor * (D.y - A.y)
                };
                const animE = {
                    x: A.x + scaleFactor * (E.x - A.x),
                    y: A.y + scaleFactor * (E.y - A.y)
                };

                drawHtml += `
                    <!-- 放大叠放的相似三角形 -->
                    <polygon class="geo-polygon-fill highlight-fill-1" points="${A.x},${A.y} ${animD.x},${animD.y} ${animE.x},${animE.y}"></polygon>
                    <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${animD.x}" y2="${animD.y}" stroke="var(--primary)" stroke-width="5.5"></line>
                    <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${animE.x}" y2="${animE.y}" stroke="var(--success)" stroke-width="5.5"></line>
                    <line class="geo-line-seg seg-de" x1="${animD.x}" y1="${animD.y}" x2="${animE.x}" y2="${animE.y}" stroke-width="6"></line>
                    
                    <!-- 闪烁动画的端点 A', D', E' -->
                    <circle cx="${A.x}" cy="${A.y}" r="8" fill="var(--primary)" opacity="0.85"></circle>
                    <circle cx="${animD.x}" cy="${animD.y}" r="8" fill="var(--primary)" opacity="0.85"></circle>
                    <circle cx="${animE.x}" cy="${animE.y}" r="8" fill="var(--success)" opacity="0.85"></circle>
                `;
            } else if (currentScene === "rotated-similarity") {
                // 旋转 A 字相似动画：绕 A 角平分线轴在三维空间翻转 180度 并放大重合到 △ACB
                const lenAB = Math.hypot(B.x - A.x, B.y - A.y);
                const lenAC = Math.hypot(C.x - A.x, C.y - A.y);
                
                // 相似比 scale，使得放大后 animD.x 落在 C，animE.x 落在 B
                const r_render = Math.min(ratioDE, 0.95 * (lenAC * lenAC) / (lenAB * lenAB));
                const targetScale = lenAC / (r_render * lenAB);
                
                const currentScale = 1.0 + t * (targetScale - 1.0);
                const cosFold = Math.cos(t * Math.PI); // 翻折物理投影因子

                // 计算角平分线单位向量
                const dxB = B.x - A.x, dyB = B.y - A.y;
                const lenB = Math.hypot(dxB, dyB);
                const dxC = C.x - A.x, dyC = C.y - A.y;
                const lenC = Math.hypot(dxC, dyC);

                let bx = (dxB / lenB) + (dxC / lenC);
                let by = (dyB / lenB) + (dyC / lenC);
                const lenBisect = Math.hypot(bx, by);
                if (lenBisect > 1e-4) {
                    bx /= lenBisect;
                    by /= lenBisect;
                } else {
                    bx = -dyB / lenB;
                    by = dxB / lenB;
                }

                // 垂直于平分线的法向量
                const nx = -by;
                const ny = bx;

                // 辅助函数: 计算翻折缩放后的点
                const getFoldedPoint = (pt) => {
                    const dx = pt.x - A.x;
                    const dy = pt.y - A.y;
                    
                    // 投影到角平分线方向
                    const proj = dx * bx + dy * by;
                    // 分解向量
                    const px = proj * bx;
                    const py = proj * by;
                    const qx = dx - px;
                    const qy = dy - py;

                    // 翻折动画：平分线方向的分量 px 不变，垂直方向的分量 qx 乘以 cos(t * PI)
                    const animX = A.x + currentScale * (px + qx * cosFold);
                    const animY = A.y + currentScale * (py + qy * cosFold);
                    return { x: animX, y: animY };
                };

                const animD = getFoldedPoint(D);
                const animE = getFoldedPoint(E);

                drawHtml += `
                    <!-- 3D 翻转缩放中的相似三角形 -->
                    <polygon class="geo-polygon-fill highlight-fill-3" points="${A.x},${A.y} ${animD.x},${animD.y} ${animE.x},${animE.y}"></polygon>
                    <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${animD.x}" y2="${animD.y}" stroke="var(--purple)" stroke-width="5"></line>
                    <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${animE.x}" y2="${animE.y}" stroke="var(--success)" stroke-width="5"></line>
                    <line class="geo-line-seg seg-de-rotated" x1="${animD.x}" y1="${animD.y}" x2="${animE.x}" y2="${animE.y}" stroke-width="5.5"></line>

                    <!-- 翻折相似点标记 -->
                    <circle cx="${A.x}" cy="${A.y}" r="7.5" fill="var(--purple)" opacity="0.85"></circle>
                    <circle cx="${animD.x}" cy="${animD.y}" r="7.5" fill="var(--purple)" opacity="0.85"></circle>
                    <circle cx="${animE.x}" cy="${animE.y}" r="7.5" fill="var(--success)" opacity="0.85"></circle>
                `;
            }
        }

        // 5. 角标、端点与标注绘制 (保证教学标记置于线段上层)
        drawHtml += angleBadgeHtml;
        drawHtml += drawSVGPoint("A", A, "A", { x: -6, y: -16 }, true);
        drawHtml += drawSVGPoint("B", B, "B", { x: -16, y: 22 }, true);
        drawHtml += drawSVGPoint("C", C, "C", { x: 10, y: 22 }, true);
        
        // 截断点 D 和 E 的拖拽交互端点
        drawHtml += drawSVGPoint("D", D, "D", { x: -16, y: -10 }, true);
        drawHtml += drawSVGPoint("E", E, "E", { x: 12, y: -10 }, true);

        sandboxSvg.innerHTML = drawHtml;
    }

    // ==========================================================================
    // 7. HTML 浮动文本读数与板书算式渲染 (HUD Layout)
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        const A = points.A;
        const B = points.B;
        const C = points.C;
        const D = points.D;
        const E = points.E;
        const demoStep = getDemoStep();

        let overlayHtml = "";

        // 辅助：获取两点中点
        const getMidpoint = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

        if (currentScene === "parallel-similarity" || currentScene === "rotated-similarity") {
            // 正常场景: 显示主线段长度
            const midAD = getMidpoint(A, D);
            const midAE = getMidpoint(A, E);
            const midDE = getMidpoint(D, E);
            const midBC = getMidpoint(B, C);

            // 当没有在播放动画时，在画布上渲染几何长度读数
            if (renderValues.animProgress < 0.01) {
                overlayHtml += `
                    <div class="brace-label sub" style="left:${midAD.x - 14}px; top:${midAD.y}px">AD</div>
                    <div class="brace-label sub" style="left:${midAE.x + 14}px; top:${midAE.y}px">AE</div>
                    <div class="brace-label warning-lbl" style="left:${midDE.x}px; top:${midDE.y - 14}px">DE ∥ BC</div>
                    <div class="brace-label success-lbl" style="left:${midBC.x}px; top:${midBC.y + 18}px">${currentScene === "rotated-similarity" ? "目标边 BC" : "底边 BC"}</div>
                `;
            } else if (demoStep >= 3) {
                const label = currentScene === "rotated-similarity" ? "△ADE → △ACB" : "△ADE → △ABC";
                overlayHtml += `<div class="brace-label relation demo-label" style="left:${A.x}px; top:${A.y - 42}px">${label}</div>`;
            }
        } else if (currentScene === "intercept-theorem") {
            // 场景 2 (比例段截取): 突出 AD, DB, AE, EC 四大成比例分段
            const midAD = getMidpoint(A, D);
            const midDB = getMidpoint(D, B);
            const midAE = getMidpoint(A, E);
            const midEC = getMidpoint(E, C);

            overlayHtml += `
                <div class="brace-label main" style="left:${midAD.x - 12}px; top:${midAD.y}px">AD</div>
                <div class="brace-label sub" style="left:${midDB.x - 12}px; top:${midDB.y}px">DB</div>
                <div class="brace-label success-lbl" style="left:${midAE.x + 12}px; top:${midAE.y}px">AE</div>
                <div class="brace-label warning-lbl" style="left:${midEC.x + 12}px; top:${midEC.y}px">EC</div>
            `;
        }

        if (activeDragPoint === "D" || activeDragPoint === "E") {
            const pt = activeDragPoint === "D" ? D : E;
            overlayHtml += `<div class="brace-label drag-hint" style="left:${pt.x}px; top:${pt.y - 34}px">沿边滑动</div>`;
        }

        htmlOverlay.innerHTML = overlayHtml;
        positionOverlayLabels();
        updateChalkboardHUD();
        updateTeachingStatus();
    }

    function updateChalkboardHUD() {
        let html = "";
        
        const rVal = renderValues.ratioDE;
        const ad = renderValues.ad;
        const ab = renderValues.ab;
        const ae = renderValues.ae;
        const ac = renderValues.ac;
        const de = renderValues.de;
        const bc = renderValues.bc;
        const db = renderValues.db;
        const ec = renderValues.ec;
        const ratioText = (num, den) => Number.isFinite(num / den) ? (num / den).toFixed(3) : "--";

        if (currentScene === "parallel-similarity") {
            html = `
                <div class="hud-proof-line"><span>条件</span><b>DE ∥ BC</b></div>
                <div class="hud-proof-line"><span>判定</span>∠ADE=∠B，∠AED=∠C</div>
                <div class="hud-proof-line"><span>结论</span><b>△ADE ∽ △ABC</b></div>
                <div class="hud-equation-box success-box">
                    <div class="title">对应边成比例</div>
                    <div class="formula compact-formula">
                        <div>AD/AB = ${ratioText(ad, ab)}</div>
                        <div>AE/AC = ${ratioText(ae, ac)}</div>
                        <div>DE/BC = ${ratioText(de, bc)}</div>
                    </div>
                </div>
            `;
        } else if (currentScene === "intercept-theorem") {
            html = `
                <div class="hud-proof-line"><span>条件</span><b>DE ∥ BC</b></div>
                <div class="hud-proof-line"><span>相似</span>△ADE ∽ △ABC</div>
                <div class="hud-proof-line"><span>分段</span><b>AD/DB = AE/EC</b></div>
                <div class="hud-equation-box success-box">
                    <div class="title">两侧分段同步变化</div>
                    <div class="formula compact-formula">
                        <div>AD/DB = ${ratioText(ad, db)}</div>
                        <div>AE/EC = ${ratioText(ae, ec)}</div>
                    </div>
                </div>
            `;
        } else if (currentScene === "rotated-similarity") {
            html = `
                <div class="hud-proof-line"><span>条件</span>∠ADE=∠C，∠AED=∠B</div>
                <div class="hud-proof-line"><span>判定</span><b>△ADE ∽ △ACB</b></div>
                <div class="hud-proof-line"><span>对应</span>D ↔ C，E ↔ B</div>
                <div class="hud-equation-box success-box">
                    <div class="title">交叉对应边成比例</div>
                    <div class="formula compact-formula">
                        <div>AD/AC = ${ratioText(ad, ac)}</div>
                        <div>AE/AB = ${ratioText(ae, ab)}</div>
                        <div>DE/BC = ${ratioText(de, bc)}</div>
                    </div>
                </div>
            `;
        }
        stepsChalkboard.innerHTML = html;
    }

    function updateTeachingStatus() {
        const step = getDemoStep();
        let statusClass = "is-proof";
        let title = "看对应关系";
        let detail = "";

        if (currentScene === "parallel-similarity") {
            if (step === 0) {
                title = "平行 A 字";
                detail = `拖动 D/E 改变截位比 r=${renderValues.ratioDE.toFixed(2)}`;
            } else if (step === 1) {
                statusClass = "is-demo";
                title = "先看平行";
                detail = "DE 与 BC 保持平行，产生两组对应角。";
            } else if (step === 2) {
                statusClass = "is-proof";
                title = "角对应";
                detail = "1 对 1，2 对 2，公共角 A 不变。";
            } else if (step === 3) {
                statusClass = "is-demo";
                title = "等比放大";
                detail = "△ADE 沿两条边放大，套到 △ABC。";
            } else {
                statusClass = "is-result";
                title = "得到比例";
                detail = "AD/AB = AE/AC = DE/BC。";
            }
        } else if (currentScene === "intercept-theorem") {
            statusClass = "is-result";
            title = "分段成比例";
            detail = `AD/DB 与 AE/EC 同步变化，当前比值 ${ratioTextSafe(renderValues.ad, renderValues.db)}。`;
        } else {
            if (step === 0) {
                title = "反 A 字";
                detail = "重点看交叉对应：D 对 C，E 对 B。";
            } else if (step === 1) {
                statusClass = "is-demo";
                title = "交叉角";
                detail = "∠ADE 对 ∠C，∠AED 对 ∠B。";
            } else if (step === 2) {
                statusClass = "is-proof";
                title = "对应换位";
                detail = "相似顺序是 △ADE ∽ △ACB。";
            } else if (step === 3) {
                statusClass = "is-demo";
                title = "翻折套合";
                detail = "小三角翻折放大后贴合大三角。";
            } else {
                statusClass = "is-result";
                title = "交叉比例";
                detail = "AD/AC = AE/AB = DE/BC。";
            }
        }

        teachingStatusCard.className = `teaching-status-card ${statusClass}`;
        teachingStatusCard.innerHTML = `
            <span class="status-eyebrow">模型状态</span>
            <strong>${title}</strong>
            <span id="status-detail">${detail}</span>
        `;
    }

    function ratioTextSafe(num, den) {
        return Number.isFinite(num / den) ? (num / den).toFixed(3) : "--";
    }

    // ==========================================================================
    // 8. 右栏定理卡片解析内容更新
    // ==========================================================================
    function updateTheoryContent() {
        if (currentScene === "parallel-similarity") {
            theoryTitle.innerHTML = "💡 平行A字型相似模型";
            theoryText.innerHTML = `
                <div class="proof-flow">
                    <div class="proof-chip"><span>结构</span><strong>DE ∥ BC，小 A 套在大 A 内。</strong></div>
                    <div class="proof-chip"><span>角</span><strong>∠ADE=∠B，∠AED=∠C。</strong></div>
                    <div class="proof-chip"><span>相似</span><strong>△ADE ∽ △ABC。</strong></div>
                    <div class="proof-result"><span>比例</span><strong>AD/AB = AE/AC = DE/BC。</strong></div>
                </div>
            `;
        } else if (currentScene === "intercept-theorem") {
            theoryTitle.innerHTML = "💡 平行线分线段成比例定理";
            theoryText.innerHTML = `
                <div class="proof-flow">
                    <div class="proof-chip"><span>结构</span><strong>DE ∥ BC，左右两边被同步截断。</strong></div>
                    <div class="proof-chip"><span>相似</span><strong>△ADE ∽ △ABC。</strong></div>
                    <div class="proof-chip"><span>变形</span><strong>AD/AB = AE/AC，且 AB=AD+DB。</strong></div>
                    <div class="proof-result"><span>结论</span><strong>AD/DB = AE/EC。</strong></div>
                </div>
            `;
        } else if (currentScene === "rotated-similarity") {
            theoryTitle.innerHTML = "💡 旋转/反A字型相似";
            theoryText.innerHTML = `
                <div class="proof-flow">
                    <div class="proof-chip"><span>结构</span><strong>不要求 DE ∥ BC，看交叉角。</strong></div>
                    <div class="proof-chip"><span>角</span><strong>∠ADE=∠C，∠AED=∠B。</strong></div>
                    <div class="proof-chip"><span>相似</span><strong>△ADE ∽ △ACB，顶点顺序翻转。</strong></div>
                    <div class="proof-result"><span>比例</span><strong>AD/AC = AE/AB = DE/BC。</strong></div>
                </div>
            `;
        }
    }

    // ==========================================================================
    // 9. LERP 平滑渲染循环与动画处理
    // ==========================================================================
    function updateLerp() {
        const k = 0.16; // LERP 平滑系数

        // 对截线位置比例进行平滑缓动
        renderValues.ratioDE += (ratioDE - renderValues.ratioDE) * k;

        // 平滑过渡折叠/重合动画进度
        if (animDirection !== 0) {
            animProgress += animDirection * 0.024;
            if (animProgress >= 1.0) {
                animProgress = 1.0;
                animDirection = 0;
                
                // 相似重叠瞬间，在顶点 B 和 C 上引爆粒子烟花
                const rect = sandboxSvg.getBoundingClientRect();
                const sB = { x: rect.left + points.B.x * zoomScale, y: rect.top + points.B.y * zoomScale };
                const sC = { x: rect.left + points.C.x * zoomScale, y: rect.top + points.C.y * zoomScale };
                
                spawnExplosion(sB.x, sB.y, currentScene === "rotated-similarity" ? "#8b5cf6" : "#3b82f6");
                spawnExplosion(sC.x, sC.y, "#10b981");

                autoDemoHoldTimer = setTimeout(() => {
                    autoDemoHoldTimer = null;
                    animDirection = -1;
                }, 900);
            } else if (animProgress <= 0.0) {
                animProgress = 0.0;
                animDirection = 0;
                isAnimating = false;
                btnPlayFolding.disabled = false;
                btnPlayFolding.innerHTML = `${PLAY_ICON} 自动演示一遍`;
            }
        }
        renderValues.animProgress += (animProgress - renderValues.animProgress) * 0.3; // 进一步平滑动画过渡

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
        if (!lerpId) {
            loop();
        }
    }
    startLerpLoop();

    // 播放相似折叠与缩放动画
    function playFoldingAnimation() {
        if (isAnimating) return;
        if (autoDemoHoldTimer) {
            clearTimeout(autoDemoHoldTimer);
            autoDemoHoldTimer = null;
        }
        isAnimating = true;
        animProgress = 0.0;
        renderValues.animProgress = 0.0;
        animDirection = 1;
        btnPlayFolding.disabled = true;
        btnPlayFolding.innerHTML = `${PLAY_ICON} 演示中...`;
    }

    // ==========================================================================
    // 10. 交互场景切换
    // ==========================================================================
    function loadScene(scene) {
        currentScene = scene;
        if (autoDemoHoldTimer) {
            clearTimeout(autoDemoHoldTimer);
            autoDemoHoldTimer = null;
        }
        animProgress = 0.0;
        renderValues.animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;

        // 按钮文本重置
        btnPlayFolding.disabled = false;
        btnPlayFolding.innerHTML = `${PLAY_ICON} 自动演示一遍`;

        // 1. 高亮 Presets 按钮
        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === scene) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // 2. 根据场景选择性隐藏动画播放区域
        const groupDemoControls = document.getElementById("section-demo-controls");
        if (scene === "intercept-theorem") {
            // 平行线分段比例主要作拖拽分析，隐藏对折重合动画按钮
            groupDemoControls.style.display = "none";
        } else {
            groupDemoControls.style.display = "block";
        }

        updateTheoryContent();
        centerModel();
    }

    function resetState() {
        ratioDE = 0.55;
        if (autoDemoHoldTimer) {
            clearTimeout(autoDemoHoldTimer);
            autoDemoHoldTimer = null;
        }
        sliderRatioDE.value = 0.55;
        valRatioDE.textContent = "0.55";

        animProgress = 0.0;
        renderValues.animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;

        btnPlayFolding.disabled = false;
        btnPlayFolding.innerHTML = `${PLAY_ICON} 自动演示一遍`;

        centerModel();
    }

    const MIN_ZOOM = 0.55;
    const MAX_ZOOM = 3.0;

    function getPanBounds(scale = zoomScale) {
        const { w: W, h: H } = getSandboxSize();
        // 缩小画布时先把原始视口重新置中；放大时保留有限平移余量，避免把模型拖出画面。
        const centerPanX = (W - W * scale) / 2;
        const centerPanY = (H - H * scale) / 2;
        const travelX = Math.max(36, Math.abs(W * (scale - 1)) / 2 + 44);
        const travelY = Math.max(36, Math.abs(H * (scale - 1)) / 2 + 44);
        return {
            minX: centerPanX - travelX,
            maxX: centerPanX + travelX,
            minY: centerPanY - travelY,
            maxY: centerPanY + travelY
        };
    }

    function clampPanToViewport() {
        const bounds = getPanBounds();
        panX = Math.min(Math.max(panX, bounds.minX), bounds.maxX);
        panY = Math.min(Math.max(panY, bounds.minY), bounds.maxY);
    }

    // 自适应居中与三角形自适应重新排布
    function centerModel() {
        const { w: W, h: H } = getSandboxSize();
        const isCompact = W <= 760 || H <= 520;
        const sideInset = Math.max(30, Math.min(76, W * 0.12));
        const topInset = isCompact ? (isHudExpanded ? 168 : 132) : 78;
        const bottomInset = isCompact ? 104 : 76;
        const availableHeight = Math.max(116, H - topInset - bottomInset);
        const triangleHeight = Math.min(isCompact ? 210 : 240, availableHeight);
        const halfBase = Math.min(
            isCompact ? 150 : 160,
            Math.max(72, (W - sideInset * 2) * 0.46),
            Math.max(72, W / 2 - (isCompact ? 78 : sideInset)),
            triangleHeight * 0.9
        );
        const apexY = Math.max(topInset, (H - triangleHeight) / 2);
        const baseY = Math.min(H - bottomInset, apexY + triangleHeight);

        zoomScale = 1.0;
        panX = 0;
        panY = 0;

        centerX = W / 2;
        centerY = (apexY + baseY) / 2;

        // 依据真实画布尺寸排布，保证窄屏、横屏和展开 HUD 后都不会把顶点挤出可见区域。
        points.A = { x: centerX, y: apexY };
        points.B = { x: centerX - halfBase, y: baseY };
        points.C = { x: centerX + halfBase, y: baseY };

        updateTransform();
    }

    function getSandboxSize() {
        return {
            w: sandboxWrapper.clientWidth || 800,
            h: sandboxWrapper.clientHeight || 600
        };
    }

    function snapCssPixel(value) {
        const ratio = window.devicePixelRatio || 1;
        return Math.round(value * ratio) / ratio;
    }

    function localToScreen(x, y) {
        return {
            x: snapCssPixel(x * zoomScale + panX),
            y: snapCssPixel(y * zoomScale + panY)
        };
    }

    function clientToLocal(clientX, clientY) {
        const rect = sandboxWrapper.getBoundingClientRect();
        return {
            x: (clientX - rect.left - panX) / zoomScale,
            y: (clientY - rect.top - panY) / zoomScale
        };
    }

    function updateSvgViewport() {
        const { w, h } = getSandboxSize();
        const scale = Math.max(0.001, zoomScale);
        sandboxSvg.setAttribute("viewBox", `${-panX / scale} ${-panY / scale} ${w / scale} ${h / scale}`);
        sandboxSvg.style.transform = "";
        htmlOverlay.style.transform = "";
    }

    function positionOverlayLabels() {
        htmlOverlay.querySelectorAll(".brace-label").forEach((label) => {
            if (!label.dataset.localX || !label.dataset.localY) {
                const x = parseFloat(label.style.left);
                const y = parseFloat(label.style.top);
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    label.dataset.localX = String(x);
                    label.dataset.localY = String(y);
                }
            }
            const x = Number(label.dataset.localX);
            const y = Number(label.dataset.localY);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            const screen = localToScreen(x, y);
            label.style.left = `${screen.x}px`;
            label.style.top = `${screen.y}px`;
        });
    }

    function updateTransform() {
        clampPanToViewport();
        updateSvgViewport();
        positionOverlayLabels();
    }

    // ==========================================================================
    // 11. 拖拽、平移、缩放手势控制
    // ==========================================================================
    function zoomAt(factor, targetX, targetY) {
        const oldScale = zoomScale;
        const nextScale = Math.min(Math.max(oldScale * factor, MIN_ZOOM), MAX_ZOOM);
        if (Math.abs(nextScale - oldScale) < 0.0001) return;
        const localX = (targetX - panX) / oldScale;
        const localY = (targetY - panY) / oldScale;
        zoomScale = nextScale;
        panX = targetX - localX * zoomScale;
        panY = targetY - localY * zoomScale;
        updateTransform();
    }

    function zoomAtCenter(factor) {
        const { w: W, h: H } = getSandboxSize();
        zoomAt(factor, W / 2, H / 2);
    }

    // 鼠标滚轮缩放
    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        const rect = sandboxWrapper.getBoundingClientRect();
        zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    function isCanvasUiTarget(target) {
        return Boolean(target?.closest?.("button, input, select, textarea, .hud-panel, .canvas-controls, .teaching-status-card"));
    }

    function stopPointDrag() {
        activeDragPoint = null;
        sandboxWrapper.classList.remove("dragging-point");
    }

    function stopPanning() {
        isPanning = false;
        sandboxWrapper.classList.remove("panning");
    }

    // 鼠标按下：判定是拖拽端点还是平移画布
    sandboxWrapper.addEventListener("mousedown", (e) => {
        if (isCanvasUiTarget(e.target)) return;
        const pointWrapper = e.target.closest(".geo-point-wrapper");
        if (pointWrapper) {
            const pointId = pointWrapper.getAttribute("data-point-id");
            if (["A", "B", "C", "D", "E"].includes(pointId)) {
                activeDragPoint = pointId;
                sandboxWrapper.classList.add("dragging-point");
                e.stopPropagation();
                e.preventDefault();
                return;
            }
        }

        if (e.button === 0) { // 鼠标左键按下平移
            isPanning = true;
            sandboxWrapper.classList.add("panning");
            startPanX = e.clientX - panX;
            startPanY = e.clientY - panY;
            e.preventDefault();
        }
    });

    window.addEventListener("mousemove", (e) => {
        if (activeDragPoint) {
            const { x: localX, y: localY } = clientToLocal(e.clientX, e.clientY);

            if (["A", "B", "C"].includes(activeDragPoint)) {
                // 拖动三角形主顶点
                const prevPt = { ...points[activeDragPoint] };
                points[activeDragPoint].x = Math.min(Math.max(localX, 50), 750);
                points[activeDragPoint].y = Math.min(Math.max(localY, 40), 560);

                // 检验是否破坏了三角形的合法几何结构，若破坏则回滚
                if (!validateTriangle()) {
                    points[activeDragPoint] = prevPt;
                }
            } else if (activeDragPoint === "D") {
                // 限制在边 AB 上滑动
                const v = { x: points.B.x - points.A.x, y: points.B.y - points.A.y };
                const u = { x: localX - points.A.x, y: localY - points.A.y };
                const dot = u.x * v.x + u.y * v.y;
                const lenSq = v.x * v.x + v.y * v.y;
                let t = lenSq > 1e-4 ? dot / lenSq : 0.5;

                ratioDE = Math.min(Math.max(t, 0.25), 0.80);
                sliderRatioDE.value = ratioDE;
                valRatioDE.textContent = ratioDE.toFixed(2);
            } else if (activeDragPoint === "E") {
                // 限制在边 AC 上滑动
                const v = { x: points.C.x - points.A.x, y: points.C.y - points.A.y };
                const u = { x: localX - points.A.x, y: localY - points.A.y };
                const dot = u.x * v.x + u.y * v.y;
                const lenSq = v.x * v.x + v.y * v.y;
                let t = lenSq > 1e-4 ? dot / lenSq : 0.5;

                if (currentScene === "rotated-similarity") {
                    // 反A型相似滑动中：w = r * lenAB^2 / lenAC^2 => r = w * lenAC^2 / lenAB^2
                    const lenAB = Math.hypot(points.B.x - points.A.x, points.B.y - points.A.y);
                    const lenAC = Math.hypot(points.C.x - points.A.x, points.C.y - points.A.y);
                    const r = t * (lenAC * lenAC) / (lenAB * lenAB);
                    ratioDE = Math.min(Math.max(r, 0.25), 0.80);
                } else {
                    ratioDE = Math.min(Math.max(t, 0.25), 0.80);
                }
                sliderRatioDE.value = ratioDE;
                valRatioDE.textContent = ratioDE.toFixed(2);
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
        stopPointDrag();
        stopPanning();
    });

    // 移动端双指多点触控与单指拖拽支持
    let initialTouchDist = 0;
    let initialTouchScale = 1.0;
    let initialTouchCenter = { x: 0, y: 0 };
    let initialTouchPan = { x: 0, y: 0 };

    function getTouchCenter(touches) {
        const rect = sandboxWrapper.getBoundingClientRect();
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
            y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top
        };
    }

    function startPinch(touches) {
        stopPointDrag();
        stopPanning();
        initialTouchDist = Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
        initialTouchScale = zoomScale;
        initialTouchCenter = getTouchCenter(touches);
        initialTouchPan = { x: panX, y: panY };
    }

    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            if (isCanvasUiTarget(e.target)) return;
            startPinch(e.touches);
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (isCanvasUiTarget(e.target)) return;
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                if (["A", "B", "C", "D", "E"].includes(ptId)) {
                    activeDragPoint = ptId;
                    sandboxWrapper.classList.add("dragging-point");
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
            }
            isPanning = true;
            sandboxWrapper.classList.add("panning");
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
            e.preventDefault();
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && initialTouchDist > 0) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = dist / initialTouchDist;
            const touchCenter = getTouchCenter(e.touches);
            zoomScale = Math.min(Math.max(initialTouchScale * factor, MIN_ZOOM), MAX_ZOOM);
            const anchorX = (initialTouchCenter.x - initialTouchPan.x) / initialTouchScale;
            const anchorY = (initialTouchCenter.y - initialTouchPan.y) / initialTouchScale;
            panX = touchCenter.x - anchorX * zoomScale;
            panY = touchCenter.y - anchorY * zoomScale;
            updateTransform();
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const { x: localX, y: localY } = clientToLocal(touch.clientX, touch.clientY);

            if (activeDragPoint) {
                if (["A", "B", "C"].includes(activeDragPoint)) {
                    const prevPt = { ...points[activeDragPoint] };
                    points[activeDragPoint].x = Math.min(Math.max(localX, 50), 750);
                    points[activeDragPoint].y = Math.min(Math.max(localY, 40), 560);
                    if (!validateTriangle()) {
                        points[activeDragPoint] = prevPt;
                    }
                } else if (activeDragPoint === "D") {
                    const v = { x: points.B.x - points.A.x, y: points.B.y - points.A.y };
                    const u = { x: localX - points.A.x, y: localY - points.A.y };
                    const dot = u.x * v.x + u.y * v.y;
                    const lenSq = v.x * v.x + v.y * v.y;
                    let t = lenSq > 1e-4 ? dot / lenSq : 0.5;

                    ratioDE = Math.min(Math.max(t, 0.25), 0.80);
                    sliderRatioDE.value = ratioDE;
                    valRatioDE.textContent = ratioDE.toFixed(2);
                } else if (activeDragPoint === "E") {
                    const v = { x: points.C.x - points.A.x, y: points.C.y - points.A.y };
                    const u = { x: localX - points.A.x, y: localY - points.A.y };
                    const dot = u.x * v.x + u.y * v.y;
                    const lenSq = v.x * v.x + v.y * v.y;
                    let t = lenSq > 1e-4 ? dot / lenSq : 0.5;

                    if (currentScene === "rotated-similarity") {
                        const lenAB = Math.hypot(points.B.x - points.A.x, points.B.y - points.A.y);
                        const lenAC = Math.hypot(points.C.x - points.A.x, points.C.y - points.A.y);
                        const r = t * (lenAC * lenAC) / (lenAB * lenAB);
                        ratioDE = Math.min(Math.max(r, 0.25), 0.80);
                    } else {
                        ratioDE = Math.min(Math.max(t, 0.25), 0.80);
                    }
                    sliderRatioDE.value = ratioDE;
                    valRatioDE.textContent = ratioDE.toFixed(2);
                }
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
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            stopPointDrag();
            initialTouchDist = 0;
            isPanning = true;
            sandboxWrapper.classList.add("panning");
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
            return;
        }
        stopPointDrag();
        stopPanning();
        initialTouchDist = 0;
    });

    sandboxWrapper.addEventListener("touchcancel", () => {
        stopPointDrag();
        stopPanning();
        initialTouchDist = 0;
    });

    // ==========================================================================
    // 12. 交互控件的事件绑定与初始化
    // ==========================================================================
    
    // 滑块监听
    sliderRatioDE.addEventListener("input", (e) => {
        ratioDE = parseFloat(e.target.value);
        valRatioDE.textContent = ratioDE.toFixed(2);
    });

    // 预设场景切换按钮
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const sc = btn.getAttribute("data-scene");
            loadScene(sc);
        });
    });

    // 动作控制按钮
    btnPlayFolding.addEventListener("click", playFoldingAnimation);
    btnResetState.addEventListener("click", resetState);

    // 帮助说明弹窗展开与收起
    btnShowHelp.addEventListener("click", () => {
        modalHelp.classList.add("active");
    });
    btnCloseHelp.addEventListener("click", () => {
        modalHelp.classList.remove("active");
    });

    // HUD 板书控制面板折叠/展开
    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
            hudPanel.classList.add("expanded");
        } else {
            hudPanel.classList.remove("expanded");
            hudPanel.classList.add("collapsed");
        }
        centerModel();
    });

    // 画布快捷缩放重置
    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());

    // 双击空白画布重置自适应居中
    sandboxWrapper.parentNode.addEventListener("dblclick", (e) => {
        if (e.target.closest(".btn-zoom") || e.target.closest(".control-column")) return;
        centerModel();
    });

    // 横竖屏切换、分屏和容器尺寸变化后重新按真实画布尺寸居中，避免沿用旧尺寸导致偏移或裁切。
    let layoutTimer = null;
    function scheduleResponsiveCenter() {
        if (layoutTimer) clearTimeout(layoutTimer);
        layoutTimer = setTimeout(() => {
            layoutTimer = null;
            centerModel();
        }, 80);
    }
    window.addEventListener("resize", scheduleResponsiveCenter);
    window.visualViewport?.addEventListener?.("resize", scheduleResponsiveCenter);

    // 暴露 window.appState 给测试框架或控制台
    window.appState = {
        get currentScene() { return currentScene; },
        get ratioDE() { return ratioDE; },
        get isAnimating() { return isAnimating; },
        get isHudExpanded() { return isHudExpanded; },
        get zoomScale() { return zoomScale; },
        get panX() { return panX; },
        get panY() { return panY; },
        get renderValues() {
            return {
                ratioDE: renderValues.ratioDE,
                animProgress: renderValues.animProgress,
                ad: renderValues.ad,
                db: renderValues.db,
                ab: renderValues.ab,
                ae: renderValues.ae,
                ec: renderValues.ec,
                ac: renderValues.ac,
                de: renderValues.de,
                bc: renderValues.bc
            };
        },
        resetState,
        loadScene
    };

    // 初始化加载平行A字相似场景
    loadScene("parallel-similarity");
});

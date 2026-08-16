/**
 * 三角形三边关系实验室 - 几何定理可视化交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态变量与参数
    // ==========================================================================
    let sideA = 6.0;                         // 侧边 a 长度 (cm)
    let sideB = 6.0;                         // 侧边 b 长度 (cm)
    let sideC = 6.0;                         // 底边 c 长度 (cm)
    let snapProgress = 0.0;                  // 合拢进度 0.0 ~ 1.0 (对应 0% ~ 100%)
    
    let isAnimating = false;
    let isHudExpanded = false;               // HUD 默认收起
    let activeDragPoint = null;
    let dragStartPos = { x: 0, y: 0 };
    
    // LERP 数值平滑系统
    const renderValues = {
        sideA: 6.0,
        sideB: 6.0,
        sideC: 6.0,
        snapProgress: 0.0
    };

    // 画布缩放与平移状态
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    const SCALE_CM_TO_PX = 48;               // 1 cm = 48 像素，充分利用模拟框空间
    let centerX = 400;
    let centerY = 340;

    // 关键几何点坐标 (像素)
    const ptA = { x: 280, y: 320 };
    const ptB = { x: 520, y: 320 };
    const ptC = { x: 400, y: 180 };          // 拼合交点 (仅在可以构成三角形且 100% 合拢时)
    const ptCb = { x: 280, y: 320 };         // 木棒 b 尖端
    const ptCa = { x: 520, y: 320 };         // 木棒 a 尖端

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const fixedOverlay = document.createElement("div");
    fixedOverlay.className = "fixed-overlay-layer";
    sandboxWrapper.appendChild(fixedOverlay);
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");

    const sliderSideA = document.getElementById("slider-side-a");
    const valSideA = document.getElementById("val-side-a");
    const sliderSideB = document.getElementById("slider-side-b");
    const valSideB = document.getElementById("val-side-b");
    const sliderSideC = document.getElementById("slider-side-c");
    const valSideC = document.getElementById("val-side-c");
    const sliderSnapProgress = document.getElementById("slider-snap-progress");
    const valSnapProgress = document.getElementById("val-snap-progress");

    const btnPlaySnap = document.getElementById("btn-play-snap");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");

    function applyHudStandard() {
        if (!hudPanel || !hudToggleBtn) return;
        const collapsed = hudPanel.classList.contains("collapsed");
        isHudExpanded = !collapsed;
        const setHudStyle = (name, value) => hudPanel.style.setProperty(name, value, "important");
        const setChildStyle = (node, name, value) => {
            if (node) node.style.setProperty(name, value, "important");
        };
        const header = hudPanel.querySelector(".hud-header");
        const title = hudPanel.querySelector(".hud-title");
        const button = hudPanel.querySelector(".hud-control-btn");
        const arrow = hudPanel.querySelector(".hud-arrow-icon");
        const body = hudPanel.querySelector(".hud-body");

        if (window.innerWidth <= 640) {
            setHudStyle("display", "none");
            return;
        }

        hudPanel.setAttribute("aria-expanded", collapsed ? "false" : "true");
        hudToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        hudToggleBtn.setAttribute("title", collapsed ? "展开板书" : "收起板书");

        setHudStyle("display", "flex");
        setHudStyle("flex-direction", "column");
        setHudStyle("position", "absolute");
        setHudStyle("top", collapsed ? "18px" : "12px");
        setHudStyle("left", collapsed ? "18px" : "12px");
        setHudStyle("right", "auto");
        setHudStyle("width", collapsed ? "auto" : "300px");
        setHudStyle("min-width", collapsed ? "max-content" : "0");
        setHudStyle("max-width", "calc(100% - 36px)");
        setHudStyle("height", collapsed ? "42px" : "auto");
        setHudStyle("min-height", collapsed ? "42px" : "0");
        setHudStyle("max-height", "none");
        setHudStyle("background", "rgba(255, 255, 255, 0.96)");
        setHudStyle("border", "1px solid rgba(148, 163, 184, 0.35)");
        setHudStyle("border-radius", collapsed ? "999px" : "12px");
        setHudStyle("box-shadow", collapsed
            ? "0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
            : "0 14px 34px rgba(15, 23, 42, 0.12)");
        setHudStyle("color", "#0f172a");
        setHudStyle("z-index", "120");
        setHudStyle("overflow", "hidden");
        setHudStyle("backdrop-filter", "none");
        setHudStyle("-webkit-backdrop-filter", "none");

        setChildStyle(header, "height", collapsed ? "42px" : "41px");
        setChildStyle(header, "min-height", collapsed ? "42px" : "41px");
        setChildStyle(header, "padding", collapsed ? "6px 8px 6px 14px" : "7px 12px");
        setChildStyle(header, "background", collapsed ? "transparent" : "rgba(248, 250, 252, 0.72)");
        setChildStyle(header, "border-bottom", "0");
        setChildStyle(header, "border-radius", collapsed ? "999px" : "0");
        setChildStyle(header, "gap", "8px");
        setChildStyle(title, "color", "#0f172a");
        setChildStyle(title, "font-size", "13px");
        setChildStyle(title, "font-weight", "800");
        setChildStyle(title, "white-space", "nowrap");
        setChildStyle(title, "display", "flex");
        setChildStyle(button, "width", "26px");
        setChildStyle(button, "height", "26px");
        setChildStyle(button, "border-radius", "999px");
        setChildStyle(button, "background", "rgba(245, 158, 11, 0.16)");
        setChildStyle(button, "border", "0");
        setChildStyle(button, "color", "#92400e");
        setChildStyle(button, "display", "inline-flex");
        setChildStyle(button, "align-items", "center");
        setChildStyle(button, "justify-content", "center");
        setChildStyle(arrow, "width", "18px");
        setChildStyle(arrow, "height", "18px");
        setChildStyle(arrow, "background", "transparent");
        setChildStyle(arrow, "border", "0");
        setChildStyle(arrow, "color", "#92400e");

        if (body) {
            body.style.setProperty("display", collapsed ? "none" : "grid", "important");
            body.style.setProperty("gap", "8px", "important");
            body.style.setProperty("padding", "0 12px 12px", "important");
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

    const hudClassObserver = new MutationObserver(scheduleHudStandard);
    hudClassObserver.observe(hudPanel, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", scheduleHudStandard);
    sandboxWrapper.style.setProperty("touch-action", "none");
    sandboxWrapper.style.setProperty("-webkit-user-select", "none");
    sandboxWrapper.style.setProperty("user-select", "none");

    // ==========================================================================
    // 3. Canvas 物理粒子系统 (用于拼合成功时的烟花特效)
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
            this.vy = (Math.random() - 0.7) * 10 - 4;
            this.radius = Math.random() * 4 + 2;
            this.color = color;
            this.alpha = 1.0;
            this.gravity = 0.28;
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
    // 4. 核心几何逻辑与拼合旋转求解器
    // ==========================================================================
    function checkTriangleValidity(a, b, c) {
        const cond1 = (a + b > c);
        const cond2 = (a + c > b);
        const cond3 = (b + c > a);
        const diff1 = Math.abs(a - b) < c;
        const diff2 = Math.abs(a - c) < b;
        const diff3 = Math.abs(b - c) < a;
        
        return {
            isValid: cond1 && cond2 && cond3,
            sumOK: cond1 && cond2 && cond3,
            diffOK: diff1 && diff2 && diff3,
            cond1,
            cond2,
            cond3,
            diff1,
            diff2,
            diff3
        };
    }

    function classifyTriangleState(a, b, c) {
        const EPS = 0.001;
        const pairs = [
            { sum: a + b, third: c, formula: "a + b", thirdName: "c", relation: "a + b 与 c", failure: "gap", detail: `a + b = ${(a + b).toFixed(1)}，小于 c = ${c.toFixed(1)}` },
            { sum: a + c, third: b, formula: "a + c", thirdName: "b", relation: "a + c 与 b", failure: "long-b", detail: `a + c = ${(a + c).toFixed(1)}，小于 b = ${b.toFixed(1)}` },
            { sum: b + c, third: a, formula: "b + c", thirdName: "a", relation: "b + c 与 a", failure: "long-a", detail: `b + c = ${(b + c).toFixed(1)}，小于 a = ${a.toFixed(1)}` }
        ];
        const equal = pairs.find(item => Math.abs(item.sum - item.third) <= EPS);
        if (equal) {
            return {
                type: "degenerate",
                tone: "warning",
                title: "临界退化",
                summary: `${equal.formula} = ${equal.thirdName}，三点被压成一条线段`,
                insight: "这是三角形存在的边界，面积为 0，不能算真正三角形。",
                prompt: "拖动任意短边稍微变长，观察两个端点如何从共线变成相交。"
            };
        }
        const fail = pairs.find(item => item.sum < item.third);
        if (fail) {
            return {
                type: fail.failure,
                tone: "danger",
                title: fail.failure === "gap" ? "短边够不到" : "长边压倒其他边",
                summary: fail.detail,
                insight: fail.failure === "gap"
                    ? "两根侧棒绕到极限也碰不到，画面中会留下红色缺口。"
                    : "最长木棒超过另外两根之和，合拢时端点会越过可达范围。",
                prompt: "把最长边调短，或把另外两边调长，直到三组判定条全部变绿。"
            };
        }
        return {
            type: "valid",
            tone: "success",
            title: "可以构成三角形",
            summary: "三组两边之和都大于第三边",
            insight: "以 A、B 为圆心的两条轨迹圆弧存在公共交点 C。",
            prompt: "播放合拢动画，观察两根侧棒如何同时转到交点 C。"
        };
    }

    function getFinalPoseAngles() {
        const check = checkTriangleValidity(sideA, sideB, sideC);
        let alphaFinal = 0.0;
        let betaFinal = 0.0;

        if (check.isValid) {
            const cosA = Math.min(Math.max((sideB * sideB + sideC * sideC - sideA * sideA) / (2 * sideB * sideC), -1), 1);
            const cosB = Math.min(Math.max((sideA * sideA + sideC * sideC - sideB * sideB) / (2 * sideA * sideC), -1), 1);
            alphaFinal = Math.acos(cosA);
            betaFinal = Math.acos(cosB);
        } else if (sideA + sideB <= sideC) {
            alphaFinal = 0.0;
            betaFinal = 0.0;
        } else if (sideB >= sideA + sideC) {
            alphaFinal = 0.0;
            betaFinal = Math.PI;
        } else if (sideA >= sideB + sideC) {
            alphaFinal = Math.PI;
            betaFinal = 0.0;
        }

        return { alphaFinal, betaFinal, check };
    }

    function getStartPoseAngles(alphaFinal, betaFinal) {
        const lowOpen = -16 * Math.PI / 180;
        const liftedOpen = 42 * Math.PI / 180;
        const reverseOpen = 132 * Math.PI / 180;
        const nearFlat = 20 * Math.PI / 180;
        const nearReverse = 150 * Math.PI / 180;
        const pickStart = (finalAngle) => {
            if (finalAngle < nearFlat) return liftedOpen;
            if (finalAngle > nearReverse) return reverseOpen;
            return lowOpen;
        };
        return {
            alphaStart: pickStart(alphaFinal),
            betaStart: pickStart(betaFinal)
        };
    }

    function arcPolylinePoints(cx, cy, radius, startAngle, endAngle, mirrorX = false) {
        const steps = 22;
        const points = [];
        for (let i = 0; i <= steps; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / steps);
            const x = mirrorX ? cx - radius * Math.cos(angle) : cx + radius * Math.cos(angle);
            const y = cy - radius * Math.sin(angle);
            points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        return points.join(" ");
    }

    function edgeBadgeStyle(from, to, side, distance = 34) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        let nx = -dy / length;
        let ny = dx / length;
        if (side === "c") {
            nx = 0;
            ny = 1;
        }
        if (side === "a") nx *= -1;
        const extraX = side === "a" ? 72 : 0;
        const extraY = side === "a" && Math.abs(dy) < 18 ? -30 : 0;
        const x = Math.min(Math.max(midX + nx * distance + extraX, 58), 742);
        const y = Math.min(Math.max(midY + ny * distance + extraY, 42), 586);
        return `left:${x}px; top:${y}px`;
    }

    function endpointLabelStyle(point, role, isFailureClosed = false) {
        const horizontal = role === "Cb" ? -22 : 22;
        const vertical = isFailureClosed ? -68 : -34;
        const x = Math.min(Math.max(point.x + horizontal, 32), 768);
        const y = Math.min(Math.max(point.y + vertical, 34), 566);
        return `left:${x}px; top:${y}px`;
    }

    function pointLabelText(role) {
        if (role === "Cb") return "C<sub>b</sub>";
        if (role === "Ca") return "C<sub>a</sub>";
        return role;
    }

    function solveGeometry() {
        const scale = SCALE_CM_TO_PX;
        const a = renderValues.sideA;
        const b = renderValues.sideB;
        const c = renderValues.sideC;
        const t = renderValues.snapProgress;

        // 1. 底边 A 和 B 居中定位
        ptA.x = centerX - (c * scale) / 2;
        ptA.y = centerY;
        ptB.x = centerX + (c * scale) / 2;
        ptB.y = centerY;

        // 2. 检查当前边长是否可构成三角形 (使用目标精确值进行判定，防止 LERP 延迟产生数值临界偏差)
        const check = checkTriangleValidity(sideA, sideB, sideC);

        // 3. 计算最终合拢角与清晰可见的起始姿态
        const { alphaFinal, betaFinal } = getFinalPoseAngles();
        const { alphaStart, betaStart } = getStartPoseAngles(alphaFinal, betaFinal);

        const currentAlpha = (1 - t) * alphaStart + t * alphaFinal;
        const currentBeta = (1 - t) * betaStart + t * betaFinal;

        // 5. 根据当前角度计算木棒尖端 C_b 和 C_a 的位置
        // 木棒 b 绕 A 逆时针向上旋转 (在 SVG 坐标系中 y 减小)
        ptCb.x = ptA.x + b * scale * Math.cos(currentAlpha);
        ptCb.y = ptA.y - b * scale * Math.sin(currentAlpha);

        // 木棒 a 绕 B 顺时针向上旋转 (在 SVG 坐标系中 y 减小，x 向左减少)
        ptCa.x = ptB.x - a * scale * Math.cos(currentBeta);
        ptCa.y = ptB.y - a * scale * Math.sin(currentBeta);

        // 6. 如果已经 100% 合拢且可以构成三角形，C_b 与 C_a 重合为 C 点
        if (check.isValid && t > 0.999) {
            ptC.x = ptCb.x;
            ptC.y = ptCb.y;
        } else {
            // 否则 C 点放置在平均位置
            ptC.x = (ptCb.x + ptCa.x) / 2;
            ptC.y = (ptCb.y + ptCa.y) / 2;
        }
    }

    // ==========================================================================
    // 5. SVG 渲染逻辑
    // ==========================================================================
    function drawSVGPoint(id, pt, labelText, offset = { x: 12, y: 6 }, isDraggable = false) {
        let ptClass = "geo-point-wrapper";
        
        let html = `
            <g class="${ptClass}" data-point-id="${id}">
                <circle class="geo-point-halo" cx="${pt.x}" cy="${pt.y}" r="14"></circle>
                <circle class="geo-point" cx="${pt.x}" cy="${pt.y}" r="6.5"></circle>
            </g>
        `;
        return html;
    }

    function renderSVG() {
        const scale = SCALE_CM_TO_PX;
        const a = renderValues.sideA;
        const b = renderValues.sideB;
        const c = renderValues.sideC;
        const t = renderValues.snapProgress;
        
        const check = checkTriangleValidity(sideA, sideB, sideC);
        const state = classifyTriangleState(sideA, sideB, sideC);
        const isClosed = t > 0.999;
        
        let drawHtml = "";

        // 1. 绘制背景网格线 (自适应平移与缩放)
        for (let i = 40; i < 800; i += 40) {
            drawHtml += `<line x1="${i}" y1="0" x2="${i}" y2="600" stroke="#f1f5f9" stroke-width="1.2px"></line>`;
            drawHtml += `<line x1="0" y1="${i}" x2="800" y2="${i}" stroke="#f1f5f9" stroke-width="1.2px"></line>`;
        }

        // 1.5 教学优化：绘制尺规轨迹线 (Locus Circles) - 模拟圆规寻交点过程
        drawHtml += `
            <circle class="geo-circle-locus locus-b" cx="${ptA.x}" cy="${ptA.y}" r="${b*scale}"></circle>
            <circle class="geo-circle-locus locus-a" cx="${ptB.x}" cy="${ptB.y}" r="${a*scale}"></circle>
        `;

        // 2. 绘制旋转扫过的虚线引导圆弧 (AC 绕 A，BC 绕 B)
        if (t > 0.01) {
            const { alphaFinal, betaFinal } = getFinalPoseAngles();
            const { alphaStart, betaStart } = getStartPoseAngles(alphaFinal, betaFinal);
            // 弧 b (AC 旋转弧线)
            drawHtml += `
                <polyline class="geo-arc-guide geo-arc-b" points="${arcPolylinePoints(ptA.x, ptA.y, b * scale, alphaStart, alphaFinal)}"></polyline>
            `;
            // 弧 a (BC 旋转弧线)
            drawHtml += `
                <polyline class="geo-arc-guide geo-arc-a" points="${arcPolylinePoints(ptB.x, ptB.y, a * scale, betaStart, betaFinal, true)}"></polyline>
            `;
        }

        // 2.5 教学优化：如果符合三角形定理，提前标出两圆交点 C，并画出绿色呼吸指示圈
        if (check.isValid && t < 0.99) {
            const x = (sideB * sideB - sideA * sideA + sideC * sideC) / (2 * sideC);
            const y = Math.sqrt(Math.max(0, sideB * sideB - x * x));
            const ptIntersect = {
                x: ptA.x + x * scale,
                y: ptA.y - y * scale
            };
            
            drawHtml += `
                <circle cx="${ptIntersect.x}" cy="${ptIntersect.y}" r="${8 + 3 * Math.sin(Date.now() / 150)}" fill="none" stroke="var(--success)" stroke-width="1.5px" opacity="0.6"></circle>
                <circle cx="${ptIntersect.x}" cy="${ptIntersect.y}" r="3.5" fill="var(--success)"></circle>
            `;
        }

        // 3. 绘制三角形填充面 (仅在拼合成功且合拢时)
        if (check.isValid && isClosed) {
            drawHtml += `
                <polygon class="geo-triangle-fill valid" points="${ptA.x},${ptA.y} ${ptB.x},${ptB.y} ${ptC.x},${ptC.y}"></polygon>
            `;
        } else if (check.isValid) {
            // 未合拢但可以构成的虚线三角形骨架
            // 计算最终 C 点位置
            const cosA = Math.min(Math.max((sideB * sideB + sideC * sideC - sideA * sideA) / (2 * sideB * sideC), -1), 1);
            const alphaFinal = Math.acos(cosA);
            const ptCFinal = {
                x: ptA.x + b * scale * Math.cos(alphaFinal),
                y: ptA.y - b * scale * Math.sin(alphaFinal)
            };
            drawHtml += `
                <polygon points="${ptA.x},${ptA.y} ${ptB.x},${ptB.y} ${ptCFinal.x},${ptCFinal.y}" fill="rgba(15,23,42,0.01)" stroke="#cbd5e1" stroke-dasharray="3,3" stroke-width="1.2px"></polygon>
            `;
        }

        // 4. 绘制三条木棒 (底边 c, 侧边 b, 侧边 a) 并附加 3D 浮升阴影 (t 越小表示升起越高，阴影偏移越大)
        // 底边 c
        drawHtml += `<line class="geo-line-c" x1="${ptA.x}" y1="${ptA.y}" x2="${ptB.x}" y2="${ptB.y}" stroke="#2563eb"></line>`;
        
        // 侧边 b (从 A 到 C_b)
        drawHtml += `<line class="geo-line-b" x1="${ptA.x}" y1="${ptA.y}" x2="${ptCb.x}" y2="${ptCb.y}" stroke="#7c3aed" style="filter: drop-shadow(0 ${4 * (1 - t)}px ${3 * (1 - t)}px rgba(15, 23, 42, ${0.15 * (1 - t)}));"></line>`;
        
        // 侧边 a (从 B 到 C_a)
        drawHtml += `<line class="geo-line-a" x1="${ptB.x}" y1="${ptB.y}" x2="${ptCa.x}" y2="${ptCa.y}" stroke="#dc2626" style="filter: drop-shadow(0 ${4 * (1 - t)}px ${3 * (1 - t)}px rgba(15, 23, 42, ${0.15 * (1 - t)}));"></line>`;

        if (state.type === "degenerate") {
            drawHtml += `
                <line class="degenerate-line" x1="${ptA.x}" y1="${ptA.y}" x2="${ptB.x}" y2="${ptB.y}"></line>
            `;
        }

        if (!check.isValid) {
            const zoneX = (ptCb.x + ptCa.x) / 2;
            const zoneY = (ptCb.y + ptCa.y) / 2;
            const zoneW = Math.max(30, Math.min(130, Math.hypot(ptCb.x - ptCa.x, ptCb.y - ptCa.y)));
            drawHtml += `
                <ellipse class="unreachable-zone" cx="${zoneX}" cy="${zoneY}" rx="${zoneW / 2}" ry="18"></ellipse>
            `;
        }

        // 5. 绘制未成功拼合时的“断开”红色辅助连线 (指示缺口)
        if (isClosed && !check.isValid) {
            drawHtml += `
                <line class="gap-line" x1="${ptCb.x}" y1="${ptCb.y}" x2="${ptCa.x}" y2="${ptCa.y}"></line>
                <circle cx="${(ptCb.x + ptCa.x)/2}" cy="${(ptCb.y + ptCa.y)/2}" r="3" fill="var(--danger)"></circle>
            `;
        }

        // 6. 绘制顶点
        drawHtml += drawSVGPoint("A", ptA, "A", { x: -16, y: 18 });
        drawHtml += drawSVGPoint("B", ptB, "B", { x: 10, y: 18 });
        
        if (check.isValid && isClosed) {
            // 合拢成功只显示 C 点
            drawHtml += drawSVGPoint("C", ptC, "C (可拖拽)", { x: 10, y: -10 }, true);
        } else {
            // 未合拢状态展示 C_b 和 C_a 两个活动端点
            drawHtml += drawSVGPoint("Cb", ptCb, "C_b", { x: -12, y: -12 });
            drawHtml += drawSVGPoint("Ca", ptCa, "C_a", { x: 10, y: -12 });
        }

        sandboxSvg.innerHTML = drawHtml;
    }

    // ==========================================================================
    // 6. HTML 文字标签与 HUD 板书更新
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        const scale = SCALE_CM_TO_PX;
        const a = renderValues.sideA;
        const b = renderValues.sideB;
        const c = renderValues.sideC;
        const t = renderValues.snapProgress;
        
        const check = checkTriangleValidity(sideA, sideB, sideC);
        const state = classifyTriangleState(sideA, sideB, sideC);
        const isClosed = t > 0.999;
        const invalidClosed = isClosed && !check.isValid;
        
        let fixedHtml = "";
        let labelHtml = "";

        fixedHtml += `
            <div class="state-ribbon ${state.tone}">
                <span class="state-ribbon-kicker">${isClosed ? "合拢判定" : "实验预判"}</span>
                <strong>${state.title}</strong>
                <span>${state.summary}</span>
            </div>
        `;

        // 1. 飘浮线段长度测量标签：放在边的外侧，避免和端点字母/缺口提示互相遮挡
        labelHtml += `<div class="floating-badge side-c" style="${edgeBadgeStyle(ptA, ptB, "c", invalidClosed ? 78 : 48)}">c = ${c.toFixed(1)} cm</div>`;
        labelHtml += `<div class="floating-badge side-b" style="${edgeBadgeStyle(ptA, ptCb, "b", invalidClosed ? 72 : 50)}">b = ${b.toFixed(1)} cm</div>`;
        labelHtml += `<div class="floating-badge side-a" style="${edgeBadgeStyle(ptB, ptCa, "a", invalidClosed ? 104 : 78)}">a = ${a.toFixed(1)} cm</div>`;

        // 2. 顶点字母标注
        labelHtml += `<div class="floating-label-pt" style="left:${ptA.x}px; top:${ptA.y + 18}px; color: var(--color-side-c);">A</div>`;
        labelHtml += `<div class="floating-label-pt" style="left:${ptB.x}px; top:${ptB.y + 18}px; color: var(--color-side-c);">B</div>`;
        
        if (check.isValid && isClosed) {
            labelHtml += `<div class="floating-label-pt" style="left:${ptC.x}px; top:${ptC.y - 18}px; color: var(--text-primary);">C</div>`;
        } else if (invalidClosed) {
            const endpointGap = Math.hypot(ptCb.x - ptCa.x, ptCb.y - ptCa.y);
            if (endpointGap < 28) {
                labelHtml += `<div class="floating-label-pt combined-endpoint-label" style="left:${(ptCb.x + ptCa.x) / 2}px; top:${Math.min(ptCb.y, ptCa.y) - 56}px;">C<sub>b</sub> / C<sub>a</sub></div>`;
            } else {
                labelHtml += `<div class="floating-label-pt" style="${endpointLabelStyle(ptCb, "Cb", true)}; color: var(--color-side-b);">${pointLabelText("Cb")}</div>`;
                labelHtml += `<div class="floating-label-pt" style="${endpointLabelStyle(ptCa, "Ca", true)}; color: var(--color-side-a);">${pointLabelText("Ca")}</div>`;
            }
        } else {
            const endpointGap = Math.hypot(ptCb.x - ptCa.x, ptCb.y - ptCa.y);
            if (endpointGap < 28) {
                labelHtml += `<div class="floating-label-pt combined-endpoint-label" style="left:${(ptCb.x + ptCa.x) / 2}px; top:${Math.min(ptCb.y, ptCa.y) - 22}px;">C<sub>b</sub> / C<sub>a</sub></div>`;
            } else {
                labelHtml += `<div class="floating-label-pt" style="${endpointLabelStyle(ptCb, "Cb")}; color: var(--color-side-b);">${pointLabelText("Cb")}</div>`;
                labelHtml += `<div class="floating-label-pt" style="${endpointLabelStyle(ptCa, "Ca")}; color: var(--color-side-a);">${pointLabelText("Ca")}</div>`;
            }
        }

        // 3. 缺口或重叠读数警告
        if (isClosed && !check.isValid && state.type !== "degenerate") {
            const gapDist = Math.abs(c - (a + b));
            const midGap = { x: (ptCb.x + ptCa.x)/2, y: (ptCb.y + ptCa.y)/2 };
            
            if (a + b <= c) {
                labelHtml += `
                    <div class="floating-badge gap-badge" style="left:${midGap.x}px; top:${midGap.y + 38}px; color:var(--danger); border-color:rgba(239,68,68,0.3); background:#fff5f5;">
                        ⚠️ 缺口：${gapDist.toFixed(1)} cm
                    </div>
                `;
            } else {
                // 两边之差太大的重叠
                labelHtml += `
                    <div class="floating-badge gap-badge" style="left:${midGap.x}px; top:${midGap.y + 38}px; color:var(--warning); border-color:rgba(245,158,11,0.3); background:#fffbeb;">
                        ⚠️ 无法合拢 (重叠)
                    </div>
                `;
            }
        }

        fixedOverlay.innerHTML = fixedHtml;
        htmlOverlay.innerHTML = labelHtml;

        // 4. 更新右侧控制栏文字读数
        valSideA.textContent = `${sideA.toFixed(1)} cm`;
        valSideB.textContent = `${sideB.toFixed(1)} cm`;
        valSideC.textContent = `${sideC.toFixed(1)} cm`;
        valSnapProgress.textContent = `${Math.round(snapProgress * 100)} %`;
        
        sliderSideA.value = sideA;
        sliderSideB.value = sideB;
        sliderSideC.value = sideC;
        sliderSnapProgress.value = Math.round(snapProgress * 100);

        // 5. 更新左侧 HUD 算式板书 (统一使用 target 边长侧值)
        updateChalkboardHUD(sideA, sideB, sideC, check, isClosed);
    }

    function renderInequalityMeter(label, leftValue, rightValue, isTrue) {
        const EPS = 0.001;
        const maxValue = Math.max(leftValue, rightValue, 1);
        const leftWidth = Math.max(8, Math.min(100, leftValue / maxValue * 100));
        const rightWidth = Math.max(8, Math.min(100, rightValue / maxValue * 100));
        const relation = Math.abs(leftValue - rightValue) <= EPS ? "=" : (leftValue > rightValue ? ">" : "<");
        const tone = isTrue ? "true" : (relation === "=" ? "equal" : "false");
        return `
            <div class="inequality-meter ${tone}">
                <div class="meter-head">
                    <span>${label}</span>
                    <strong>${leftValue.toFixed(1)} ${relation} ${rightValue.toFixed(1)}</strong>
                </div>
                <div class="meter-bars">
                    <span class="meter-bar sum" style="width:${leftWidth}%"></span>
                    <span class="meter-bar third" style="width:${rightWidth}%"></span>
                </div>
            </div>
        `;
    }

    function updateChalkboardHUD(a, b, c, check, isClosed) {
        const state = classifyTriangleState(a, b, c);
        const statusLabel = isClosed ? "当前合拢结果" : "当前实验预判";

        const html = `
            <div class="teaching-panel ${state.tone}">
                <div class="teaching-panel-kicker">${statusLabel}</div>
                <div class="teaching-panel-title">${state.title}</div>
                <div class="teaching-panel-desc">${state.summary}</div>
            </div>

            <div class="hud-row compact-values">
                <div class="hud-row-label">三根木棒长度</div>
                <div class="hud-row-val">a = ${a.toFixed(1)} cm　b = ${b.toFixed(1)} cm　c = ${c.toFixed(1)} cm</div>
            </div>

            <div class="hud-row">
                <div class="hud-row-label">两边之和判定</div>
                ${renderInequalityMeter("a + b 与 c", a + b, c, check.cond1)}
                ${renderInequalityMeter("a + c 与 b", a + c, b, check.cond2)}
                ${renderInequalityMeter("b + c 与 a", b + c, a, check.cond3)}
            </div>

            <div class="hud-verdict-box ${state.tone}">
                <div class="verdict-title">${state.insight}</div>
                <div class="verdict-desc">${state.prompt}</div>
            </div>
        `;

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 7. 右侧卡片文字更新
    // ==========================================================================
    function updateTheoryContent() {
        const check = checkTriangleValidity(sideA, sideB, sideC);
        
        theoryTitle.innerHTML = "💡 三角形三边不等式定理";
        let text = `
            <p><strong>三边不等式定理</strong>：三角形的任意两边之和大于第三边。</p>
            <p><strong>定理推论</strong>：三角形的任意两边之差小于第三边。</p>
            <p><strong>代数形式</strong>：对于任意三角形，必须同时满足：<br>
            • a + b > c (推论：|a - b| < c)<br>
            • a + c > b (推论：|a - c| < b)<br>
            • b + c > a (推论：|b - c| < a)</p>
        `;
        
        if (check.isValid) {
            text += `
                <p style="color:var(--success); font-weight:700;">✅ 当前数据符合定理！三条木棒的转动圆弧在上方产生交点 C。</p>
            `;
        } else {
            text += `
                <p style="color:var(--danger); font-weight:700;">⚠️ 当前数据违背定理！圆弧无法产生交点，导致木棒躺平后无法闭合。</p>
            `;
        }
        theoryText.innerHTML = text;
    }

    // ==========================================================================
    // 8. LERP 数值平滑系统
    // ==========================================================================
    let lerpLoopId = null;
    function updateLerp() {
        const k = 0.16; // 平滑系数

        renderValues.sideA += (sideA - renderValues.sideA) * k;
        renderValues.sideB += (sideB - renderValues.sideB) * k;
        renderValues.sideC += (sideC - renderValues.sideC) * k;
        
        const oldProgress = renderValues.snapProgress;
        renderValues.snapProgress += (snapProgress - renderValues.snapProgress) * k;

        solveGeometry();
        renderSVG();
        updateHTMLOverlayAndHUD();

        // 动效爆破触发：当刚刚合拢 (progress 从小于 0.99 变为大于 0.99)
        if (oldProgress < 0.99 && renderValues.snapProgress >= 0.99) {
            const check = checkTriangleValidity(sideA, sideB, sideC);
            if (check.isValid) {
                // 拼合成功，触发烟花粒子特效
                const rect = canvas.getBoundingClientRect();
                // 转换 SVG 点 C 到浏览器屏幕坐标
                const screenX = ptC.x * zoomScale + panX + rect.left;
                const screenY = ptC.y * zoomScale + panY + rect.top;
                spawnExplosion(screenX, screenY, "#10b981");
            }
        }
    }

    function finalizeSnapProgress() {
        snapProgress = 1.0;
        renderValues.sideA = sideA;
        renderValues.sideB = sideB;
        renderValues.sideC = sideC;
        renderValues.snapProgress = 1.0;
        solveGeometry();
        renderSVG();
        updateHTMLOverlayAndHUD();
    }

    function startLerpLoop() {
        function loop() {
            updateLerp();
            lerpLoopId = requestAnimationFrame(loop);
        }
        if (!lerpLoopId) loop();
    }
    startLerpLoop();

    // ==========================================================================
    // 9. 拼合动画播放逻辑
    // ==========================================================================
    let animationTimer = null;
    function playSnapAnimation() {
        if (isAnimating) {
            // 正在播放则暂停
            clearInterval(animationTimer);
            isAnimating = false;
            btnPlaySnap.querySelector("span").textContent = "播放拼合动画";
            return;
        }

        isAnimating = true;
        btnPlaySnap.querySelector("span").textContent = "暂停动画";

        // 如果已经合拢，从头播放
        if (snapProgress > 0.95) {
            snapProgress = 0.0;
        }

        animationTimer = setInterval(() => {
            snapProgress += 0.02;
            if (snapProgress >= 1.0) {
                finalizeSnapProgress();
                clearInterval(animationTimer);
                isAnimating = false;
                btnPlaySnap.querySelector("span").textContent = "播放拼合动画";
            }
        }, 20);
    }

    // ==========================================================================
    // 10. 交互场景与预设绑定
    // ==========================================================================
    const presets = {
        equilateral: { a: 6.0, b: 6.0, c: 6.0 },
        right: { a: 3.0, b: 4.0, c: 5.0 },
        critical: { a: 4.0, b: 4.0, c: 8.0 },
        impossible: { a: 3.0, b: 3.0, c: 8.0 },
        "diff-fail": { a: 2.0, b: 9.0, c: 5.0 }
    };

    function loadPreset(presetName) {
        const p = presets[presetName];
        if (!p) return;
        
        // 载入参数
        sideA = p.a;
        sideB = p.b;
        sideC = p.c;
        snapProgress = 0.0; // 默认拉开

        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-preset") === presetName) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // 停止动画
        if (isAnimating) {
            clearInterval(animationTimer);
            isAnimating = false;
            btnPlaySnap.querySelector("span").textContent = "播放拼合动画";
        }

        updateTheoryContent();
        centerModel();
    }

    // 重置状态
    function resetState() {
        sideA = 6.0;
        sideB = 6.0;
        sideC = 6.0;
        snapProgress = 0.0;
        
        if (isAnimating) {
            clearInterval(animationTimer);
            isAnimating = false;
            btnPlaySnap.querySelector("span").textContent = "播放拼合动画";
        }

        loadPreset("equilateral");
    }

    // ==========================================================================
    // 11. 画布缩放、平移与自适应居中
    // ==========================================================================
    function updateTransform() {
        sandboxSvg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
        htmlOverlay.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    }

    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;
        
        zoomScale = 1.0;
        panX = 0;
        panY = 0;

        centerX = W / 2;
        centerY = H / 2 + 18;

        updateTransform();
    }

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

    // ==========================================================================
    // 12. 交互事件绑定 (Mouse & Touch Events)
    // ==========================================================================
    
    // 滑块滑动事件
    sliderSideA.addEventListener("input", (e) => {
        sideA = parseFloat(e.target.value);
        updateTheoryContent();
    });
    sliderSideB.addEventListener("input", (e) => {
        sideB = parseFloat(e.target.value);
        updateTheoryContent();
    });
    sliderSideC.addEventListener("input", (e) => {
        sideC = parseFloat(e.target.value);
        updateTheoryContent();
    });
    sliderSnapProgress.addEventListener("input", (e) => {
        snapProgress = parseFloat(e.target.value) / 100;
    });

    // 预设按钮事件
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadPreset(btn.getAttribute("data-preset"));
        });
    });

    // 控制按钮事件
    btnPlaySnap.addEventListener("click", playSnapAnimation);
    btnResetState.addEventListener("click", resetState);

    // 缩放控制
    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", centerModel);

    // 帮助模态框
    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (e) => {
        if (e.target === modalHelp) modalHelp.classList.remove("active");
    });

    // HUD 收起折叠
    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
        } else {
            hudPanel.classList.add("collapsed");
        }
        scheduleHudStandard();
    });

    // 滚轮缩放画板
    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        zoomAtCenter(factor);
    }, { passive: false });

    // 拖拽与平移事件定义
    sandboxWrapper.addEventListener("mousedown", (e) => {
        const ptWrapper = e.target.closest(".geo-point-wrapper");
        if (ptWrapper) {
            const ptId = ptWrapper.getAttribute("data-point-id");
            const check = checkTriangleValidity(sideA, sideB, sideC);
            
            // 仅在 100% 合拢且可以构成三角形时允许拖拽 C 点
            if (ptId === "C" && check.isValid && snapProgress > 0.99) {
                activeDragPoint = "C";
            }
            if (activeDragPoint) {
                e.stopPropagation();
                return;
            }
        }

        // 否则为平移画板
        if (e.button === 0) {
            isPanning = true;
            sandboxWrapper.style.cursor = "grabbing";
            startPanX = e.clientX - panX;
            startPanY = e.clientY - panY;
            e.preventDefault();
        }
    });

    window.addEventListener("mousemove", (e) => {
        if (activeDragPoint) {
            const rect = sandboxSvg.getBoundingClientRect();
            // 转为 SVG 局部坐标
            const localX = (e.clientX - rect.left) / zoomScale;
            const localY = (e.clientY - rect.top) / zoomScale;
            const scale = SCALE_CM_TO_PX;

            if (activeDragPoint === "C") {
                // 拖拽顶点 C 时，动态反算出 b 和 a 的长度
                const distCA = Math.hypot(localX - ptA.x, localY - ptA.y) / scale;
                const distCB = Math.hypot(localX - ptB.x, localY - ptB.y) / scale;

                // 限制侧边在合理范围 1.0 ~ 10.0 cm 之间
                sideB = Math.max(1.0, Math.min(10.0, distCA));
                sideA = Math.max(1.0, Math.min(10.0, distCB));
                
                updateTheoryContent();
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
        activeDragPoint = null;
        if (isPanning) {
            isPanning = false;
            sandboxWrapper.style.cursor = "grab";
        }
    });

    // 移动端 Touch 支持
    let touchStartDist = 0;
    let touchStartScale = 1.0;

    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            touchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartScale = zoomScale;
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                const check = checkTriangleValidity(sideA, sideB, sideC);
                if (ptId === "C" && check.isValid && snapProgress > 0.99) {
                    activeDragPoint = "C";
                }
                if (activeDragPoint) return;
            }
            isPanning = true;
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
        }
    });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && touchStartDist > 0) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = dist / touchStartDist;
            zoomScale = Math.min(Math.max(touchStartScale * factor, 0.45), 3.0);
            updateTransform();
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = sandboxSvg.getBoundingClientRect();
            const localX = (touch.clientX - rect.left) / zoomScale;
            const localY = (touch.clientY - rect.top) / zoomScale;
            const scale = SCALE_CM_TO_PX;

            if (activeDragPoint === "C") {
                const distCA = Math.hypot(localX - ptA.x, localY - ptA.y) / scale;
                const distCB = Math.hypot(localX - ptB.x, localY - ptB.y) / scale;
                sideB = Math.max(1.0, Math.min(10.0, distCA));
                sideA = Math.max(1.0, Math.min(10.0, distCB));
                updateTheoryContent();
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
        touchStartDist = 0;
    });

    // ==========================================================================
    // 13. 初始化与自适应加载
    // ==========================================================================
    window.addEventListener("resize", centerModel);
    
    // 初始化自适应居中与默认预设场景
    setTimeout(() => {
        hudPanel.classList.add("collapsed");
        scheduleHudStandard();
        centerModel();
        loadPreset("equilateral");
        scheduleHudStandard();
    }, 100);
});

/**
 * 等腰三角形性质与判定实验室 - 几何计算与交互引擎脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态变量与参数
    // ==========================================================================
    let currentScene = "prop-angle";         // 当前场景 (prop-angle, prop-lines, detect-angle)
    let foldProgress = 0.0;                 // 场景 1 的翻折进度 0.0 ~ 1.0
    
    // 辅助线显示开关
    let showHeight = true;
    let showMedian = true;
    let showBisector = true;

    let isAnimating = false;
    let isHudExpanded = false;
    let activeDragPoint = null;
    let animationTimer = null;

    // LERP 数值平滑系统
    const renderValues = {
        foldProgress: 0.0,
        ax: 400, ay: 180,
        bx: 270, by: 380,
        cx: 530, cy: 380
    };

    // 画布尺寸与基本中心
    let centerX = 400;
    let centerY = 300;
    
    // 几何端点原始坐标
    let pointA = { x: 400, y: 180 };
    let pointB = { x: 270, y: 380 };
    let pointC = { x: 530, y: 380 };

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");
    hudPanel?.classList.add("collapsed");
    if (hudPanel) hudPanel.dataset.hudExpanded = "false";

    // 控制面板元素
    const sliderFold = document.getElementById("slider-fold-progress");
    const valFold = document.getElementById("val-fold-progress");
    const btnPlayFold = document.getElementById("btn-play-fold");
    const btnResetFold = document.getElementById("btn-reset-fold");

    const chkHeight = document.getElementById("chk-height-line");
    const chkMedian = document.getElementById("chk-median-line");
    const chkBisector = document.getElementById("chk-bisector-line");
    const btnAlignIsosceles = document.getElementById("btn-align-isosceles");

    const btnSnapDetect = document.getElementById("btn-snap-detect");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");
    const taskFlowBody = document.getElementById("task-flow-body");
    const sceneFeedbackBody = document.getElementById("scene-feedback-body");
    const proofTemplateBody = document.getElementById("proof-template-body");

    const secScene1 = document.getElementById("section-scene1-control");
    const secScene2 = document.getElementById("section-scene2-control");
    const secScene3 = document.getElementById("section-scene3-control");

    let systemStandardFrame = 0;

    function applySystemStandard() {
        const set = (node, name, value) => node?.style?.setProperty(name, value, "important");
        const compactLayout = document.documentElement.clientWidth <= 640;
        if (hudPanel) {
            const expanded = hudPanel.dataset.hudExpanded === "true";
            const collapsed = !expanded;
            isHudExpanded = expanded;
            hudPanel.classList.toggle("collapsed", collapsed);
            set(hudPanel, "position", "absolute");
            set(hudPanel, "top", "18px");
            set(hudPanel, "left", "18px");
            set(hudPanel, "right", "auto");
            set(hudPanel, "z-index", "120");
            set(hudPanel, "width", collapsed ? "206px" : "360px");
            set(hudPanel, "max-width", collapsed ? "min(300px, calc(100% - 36px))" : "min(360px, calc(100% - 36px))");
            set(hudPanel, "height", collapsed ? "42px" : "auto");
            set(hudPanel, "max-height", collapsed ? "42px" : "none");
            set(hudPanel, "overflow", collapsed ? "hidden" : "visible");
            set(hudPanel, "border-radius", collapsed ? "999px" : "12px");
            set(hudPanel, "background", collapsed ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.94)");
            set(hudPanel, "border", "1px solid rgba(148, 163, 184, 0.36)");
            set(hudPanel, "box-shadow", "0 12px 28px rgba(15, 23, 42, 0.14)");
            set(hudPanel, "color", "#0f172a");
            set(hudPanel.querySelector(".hud-header"), "height", "42px");
            set(hudPanel.querySelector(".hud-header"), "min-height", "42px");
            set(hudPanel.querySelector(".hud-header"), "padding", "0 6px 0 12px");
            set(hudPanel.querySelector(".hud-header"), "display", "flex");
            set(hudPanel.querySelector(".hud-header"), "align-items", "center");
            set(hudPanel.querySelector(".hud-header"), "justify-content", "flex-start");
            set(hudPanel.querySelector(".hud-header"), "gap", "8px");
            set(hudPanel.querySelector(".hud-header"), "border-bottom", collapsed ? "0" : "1px solid rgba(148, 163, 184, 0.24)");
            set(hudPanel.querySelector(".hud-title-icon"), "width", "13px");
            set(hudPanel.querySelector(".hud-title-icon"), "height", "13px");
            set(hudPanel.querySelector(".hud-title-icon"), "flex", "0 0 13px");
            set(hudPanel.querySelector(".hud-title"), "font-size", "13px");
            set(hudPanel.querySelector(".hud-title"), "font-weight", "800");
            set(hudPanel.querySelector(".hud-title"), "white-space", "nowrap");
            set(hudPanel.querySelector(".hud-title"), "letter-spacing", "0");
            set(hudPanel.querySelector(".hud-control-btn"), "width", "28px");
            set(hudPanel.querySelector(".hud-control-btn"), "height", "28px");
            set(hudPanel.querySelector(".hud-control-btn"), "min-width", "28px");
            set(hudPanel.querySelector(".hud-control-btn"), "padding", "0");
            set(hudPanel.querySelector(".hud-control-btn"), "border-radius", "999px");
            set(hudPanel.querySelector(".hud-control-btn"), "background", "#fff0d6");
            set(hudPanel.querySelector(".hud-control-btn"), "color", "#b7791f");
            set(hudPanel.querySelector(".hud-control-btn"), "display", "flex");
            set(hudPanel.querySelector(".hud-control-btn"), "align-items", "center");
            set(hudPanel.querySelector(".hud-control-btn"), "justify-content", "center");
            set(hudPanel.querySelector(".hud-body"), "display", collapsed ? "none" : "flex");
            set(hudPanel.querySelector(".hud-body"), "padding", "9px");
            set(hudPanel.querySelector(".hud-body"), "overflow", "visible");
            set(hudPanel.querySelector(".hud-body"), "max-height", "none");
        }

        document.querySelectorAll(".panel-section").forEach(section => {
            set(section, "padding", "12px");
            set(section, "border-radius", "8px");
            set(section, "background", "rgba(15, 23, 42, 0.64)");
            set(section, "border", "1px solid rgba(148, 163, 184, 0.24)");
            set(section, "box-shadow", "none");
            set(section, "color", "rgba(248, 250, 252, 0.94)");
        });

        document.querySelectorAll(".panel-section h3").forEach(title => {
            set(title, "margin", "0 0 10px");
            set(title, "font-size", "13px");
            set(title, "font-weight", "800");
            set(title, "color", "#f8fafc");
        });

        document.querySelectorAll(".app-header,.logo-area,.header-actions,.badge-stage,.logo-area h1").forEach(header => set(header, "display", "none"));
        document.querySelectorAll(".app-container").forEach(container => {
            set(container, "height", "100%");
            set(container, "padding", "0");
            set(container, "gap", "0");
        });
        document.querySelectorAll(".main-layout").forEach(layout => {
            set(layout, "height", "100%");
            set(layout, "gap", "0");
        });
        document.querySelectorAll(".simulation-column").forEach(column => {
            set(column, "height", "100%");
            set(column, "min-height", "0");
            set(column, "border-radius", "24px");
        });

        document.querySelectorAll(".btn-preset").forEach(btn => {
            const active = btn.classList.contains("active");
            set(btn, "display", "grid");
            set(btn, "grid-template-columns", "28px minmax(0, 1fr)");
            set(btn, "align-items", "center");
            set(btn, "min-height", "44px");
            set(btn, "padding", "8px 10px");
            set(btn, "border-radius", "8px");
            set(btn, "background", active ? "rgba(37, 99, 235, 0.20)" : "rgba(2, 6, 23, 0.36)");
            set(btn, "border", active ? "1px solid rgba(96, 165, 250, 0.64)" : "1px solid rgba(148, 163, 184, 0.18)");
            set(btn, "color", "rgba(241, 245, 249, 0.92)");
        });

        document.querySelectorAll(".preset-num").forEach(node => {
            set(node, "display", "grid");
            set(node, "place-items", "center");
            set(node, "width", "28px");
            set(node, "height", "28px");
            set(node, "border-radius", "8px");
            set(node, "background", "rgba(148, 163, 184, 0.16)");
            set(node, "color", "rgba(226, 232, 240, 0.9)");
        });

        document.querySelectorAll(".btn-preset.active .preset-num").forEach(node => {
            set(node, "background", "#facc15");
            set(node, "color", "#0f172a");
        });

        document.querySelectorAll(".preset-name").forEach(node => {
            set(node, "color", "#f8fafc");
            set(node, "min-width", "0");
            set(node, "width", "100%");
            set(node, "white-space", "nowrap");
            set(node, "overflow", "hidden");
            set(node, "text-overflow", "ellipsis");
            set(node, "font-size", "13px");
            set(node, "font-weight", "800");
            set(node, "line-height", "1.2");
        });

        document.querySelectorAll(".preset-desc").forEach(node => {
            set(node, "display", "none");
        });

        document.querySelectorAll(".slider-group").forEach(group => {
            set(group, "display", "flex");
            set(group, "flex-direction", "column");
            set(group, "gap", "8px");
            set(group, "padding", "0");
            set(group, "background", "transparent");
            set(group, "border", "0");
        });

        document.querySelectorAll(".slider-row").forEach(row => {
            set(row, "display", "flex");
            set(row, "grid-template-columns", "none");
            set(row, "flex-direction", "column");
            set(row, "gap", "8px");
            set(row, "width", "100%");
            set(row, "min-height", "0");
            set(row, "padding", compactLayout ? "10px" : "9px");
            set(row, "border-radius", "8px");
            set(row, "background", "rgba(2, 6, 23, 0.34)");
            set(row, "border", "1px solid rgba(148, 163, 184, 0.18)");
        });

        document.querySelectorAll(".slider-label-row").forEach(row => {
            set(row, "display", "flex");
            set(row, "align-items", "center");
            set(row, "justify-content", "space-between");
            set(row, "gap", "12px");
            set(row, "width", "100%");
            set(row, "height", "auto");
            set(row, "min-height", "0");
        });

        document.querySelectorAll(".slider-label").forEach(node => {
            set(node, "color", "rgba(203, 213, 225, 0.82)");
            set(node, "width", "auto");
            set(node, "white-space", "nowrap");
            set(node, "overflow-wrap", "normal");
            set(node, "word-break", "normal");
            set(node, "line-height", "1.25");
        });
        document.querySelectorAll(".slider-val").forEach(node => set(node, "color", "#f8fafc"));
        document.querySelectorAll("input[type=\"range\"]").forEach(input => {
            set(input, "-webkit-appearance", "none");
            set(input, "appearance", "none");
            set(input, "display", "block");
            set(input, "width", "100%");
            set(input, "height", compactLayout ? "32px" : "6px");
            set(input, "min-height", compactLayout ? "32px" : "6px");
            set(input, "max-height", compactLayout ? "32px" : "6px");
            set(input, "padding", "0");
            set(input, "margin", "5px 0 2px");
            set(input, "border", "0");
            set(input, "border-radius", "999px");
            set(input, "background", compactLayout
                ? "linear-gradient(90deg, rgba(56, 189, 248, 0.9), rgba(226, 232, 240, 0.28)) center / 100% 8px no-repeat"
                : "linear-gradient(90deg, rgba(56, 189, 248, 0.9), rgba(226, 232, 240, 0.28))");
            set(input, "box-shadow", compactLayout ? "none" : "inset 0 0 0 1px rgba(148, 163, 184, 0.16)");
            set(input, "accent-color", "#38bdf8");
        });

        document.querySelectorAll(".toggle-group").forEach(group => {
            set(group, "display", "flex");
            set(group, "grid-template-columns", "none");
            set(group, "flex-direction", "column");
            set(group, "gap", compactLayout ? "9px" : "8px");
            set(group, "width", "100%");
            set(group, "padding", compactLayout ? "10px" : "9px");
            set(group, "border-radius", "8px");
            set(group, "background", "rgba(2, 6, 23, 0.34)");
            set(group, "border", "1px solid rgba(148, 163, 184, 0.18)");
        });

        document.querySelectorAll(".toggle-item").forEach(item => {
            set(item, "display", "grid");
            set(item, "grid-template-columns", "26px minmax(0, 1fr)");
            set(item, "align-items", "center");
            set(item, "gap", "10px");
            set(item, "width", "100%");
            set(item, "min-height", compactLayout ? "48px" : "44px");
            set(item, "padding", compactLayout ? "8px 10px" : "7px 9px");
            set(item, "cursor", "pointer");
            set(item, "white-space", "normal");
        });

        document.querySelectorAll(".toggle-box").forEach(box => {
            set(box, "position", "relative");
            set(box, "display", "block");
            set(box, "width", "24px");
            set(box, "height", "24px");
            set(box, "min-width", "24px");
            set(box, "min-height", "24px");
            set(box, "flex", "0 0 24px");
            set(box, "border-radius", "7px");
        });

        document.querySelectorAll(".toggle-label").forEach(label => {
            set(label, "display", "block");
            set(label, "min-width", "0");
            set(label, "width", "100%");
            set(label, "font-size", compactLayout ? "13px" : "12px");
            set(label, "font-weight", "800");
            set(label, "line-height", compactLayout ? "1.4" : "1.35");
            set(label, "white-space", "normal");
            set(label, "word-break", "keep-all");
            set(label, "overflow-wrap", "normal");
        });

        document.querySelectorAll(".controls-row").forEach(row => {
            set(row, "display", "grid");
            set(row, "grid-template-columns", "repeat(2, minmax(0, 1fr))");
            set(row, "gap", compactLayout ? "10px" : "8px");
        });

        document.querySelectorAll(".flex-btn").forEach(btn => {
            set(btn, "min-height", compactLayout ? "48px" : "42px");
            set(btn, "border-radius", "8px");
            set(btn, "white-space", compactLayout ? "normal" : "nowrap");
            set(btn, "line-height", compactLayout ? "1.25" : "normal");
        });

        document.querySelectorAll(".floating-label-pt").forEach(label => {
            set(label, "color", "#0f172a");
            set(label, "font-weight", "900");
            set(label, "text-shadow", "0 1px 0 rgba(255,255,255,0.92), 0 0 6px rgba(255,255,255,0.88)");
        });

        document.querySelectorAll(".floating-badge").forEach(badge => {
            set(badge, "background", "rgba(255,255,255,0.96)");
            set(badge, "border", "1px solid rgba(148, 163, 184, 0.42)");
            set(badge, "color", "#0f172a");
            set(badge, "box-shadow", "0 4px 12px rgba(15, 23, 42, 0.12)");
        });
    }

    function scheduleSystemStandard() {
        cancelAnimationFrame(systemStandardFrame);
        systemStandardFrame = requestAnimationFrame(applySystemStandard);
    }

    function setHudExpanded(expanded) {
        if (!hudPanel) return;
        isHudExpanded = Boolean(expanded);
        hudPanel.dataset.hudExpanded = isHudExpanded ? "true" : "false";
        hudPanel.classList.toggle("collapsed", !isHudExpanded);
        hudPanel.classList.toggle("expanded", isHudExpanded);
        hudToggleBtn?.setAttribute("aria-expanded", isHudExpanded ? "true" : "false");
        hudToggleBtn?.setAttribute("title", isHudExpanded ? "收起板书" : "展开板书");
        scheduleSystemStandard();
    }

    function toggleHudPanel(event) {
        if (event?.__j8aM07HudHandled) return;
        if (event) event.__j8aM07HudHandled = true;
        event?.preventDefault?.();
        event?.stopPropagation?.();
        event?.stopImmediatePropagation?.();
        setHudExpanded(!(hudPanel?.dataset.hudExpanded === "true"));
    }

    function handleHudToggleClick(event) {
        if (!event?.target?.closest) return;
        if (!event.target.closest("#hud-toggle-btn")) return;
        toggleHudPanel(event);
    }

    document.addEventListener("click", handleHudToggleClick, true);

    // ==========================================================================
    // 3. Canvas 粒子特效系统
    // ==========================================================================
    const canvas = document.getElementById("particles-canvas");
    const ctx = canvas.getContext("2d");
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        resetTriangle(currentScene);
        scheduleSystemStandard();
    }
    window.addEventListener("resize", resizeCanvas);

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.7) * 8 - 3;
            this.radius = Math.random() * 3 + 2;
            this.color = color;
            this.alpha = 1.0;
            this.gravity = 0.25;
            this.decay = Math.random() * 0.02 + 0.015;
        }
        update() {
            this.x += this.vx;
            this.vy += this.gravity;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        draw(c) {
            c.save();
            c.globalAlpha = Math.max(0, this.alpha);
            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            c.fillStyle = this.color;
            c.fill();
            c.restore();
        }
    }

    function triggerCelebration(x, y) {
        const rect = canvas.getBoundingClientRect();
        const screenX = x + rect.left;
        const screenY = y + rect.top;
        const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];
        
        for (let i = 0; i < 40; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Particle(screenX, screenY, color));
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles = particles.filter(p => p.alpha > 0);
        particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });
        requestAnimationFrame(animateParticles);
    }
    requestAnimationFrame(animateParticles);

    // ==========================================================================
    // 4. 几何计算辅助函数
    // ==========================================================================
    function getDistance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    // 计算三个内角的弧度值值
    function getAngles() {
        const a = getDistance(pointB, pointC); // BC
        const b = getDistance(pointA, pointC); // AC
        const c = getDistance(pointA, pointB); // AB
        
        // 余弦定理
        const angleA = Math.acos(Math.min(1, Math.max(-1, (b*b + c*c - a*a) / (2*b*c))));
        const angleB = Math.acos(Math.min(1, Math.max(-1, (a*a + c*c - b*b) / (2*a*c))));
        const angleC = Math.acos(Math.min(1, Math.max(-1, (a*a + b*b - c*c) / (2*a*b))));
        
        return {
            A: angleA * 180 / Math.PI,
            B: angleB * 180 / Math.PI,
            C: angleC * 180 / Math.PI
        };
    }

    // 绘制内角圆弧路径 (SVG Wedge 扇形)
    function getAngleArcPath(center, pt1, pt2, radius) {
        const theta1 = Math.atan2(pt1.y - center.y, pt1.x - center.x);
        const theta2 = Math.atan2(pt2.y - center.y, pt2.x - center.x);
        
        let diff = theta2 - theta1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        
        const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;
        const sweepFlag = diff > 0 ? 1 : 0;
        
        const x1 = center.x + radius * Math.cos(theta1);
        const y1 = center.y + radius * Math.sin(theta1);
        const x2 = center.x + radius * Math.cos(theta2);
        const y2 = center.y + radius * Math.sin(theta2);
        
        return `M ${center.x} ${center.y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2} Z`;
    }

    // ==========================================================================
    // 5. SVG 渲染逻辑
    // ==========================================================================
    function renderSVG() {
        const progress = renderValues.foldProgress;
        
        let drawHtml = "";
        
        // 1. 绘制网格线
        for (let i = 40; i < 800; i += 40) {
            drawHtml += `<line x1="${i}" y1="0" x2="${i}" y2="600" stroke="#f1f5f9" stroke-width="1.2px"></line>`;
            drawHtml += `<line x1="0" y1="${i}" x2="800" y2="${i}" stroke="#f1f5f9" stroke-width="1.2px"></line>`;
        }

        // 2. 场景特有几何体绘制
        const A = pointA;
        const B = pointB;
        const C = pointC;
        const midBaseX = (B.x + C.x) / 2;
        const midBaseY = (B.y + C.y) / 2;

        if (currentScene === "prop-angle") {
            // 场景 1：等边对等角翻折性质
            // 绘制底色三角形 (即右半侧及折痕线)
            drawHtml += `
                <polygon class="geo-triangle-fill" points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}"></polygon>
                <!-- 对称轴/折痕线 AD -->
                <line class="geo-symmetry-line" x1="${A.x}" y1="${A.y}" x2="${midBaseX}" y2="${midBaseY}"></line>
            `;

            // 绘制底角角弧 (始终保留 C 的角弧以作重合比对)
            const arcC = getAngleArcPath(C, A, B, 26);
            drawHtml += `<path class="geo-angle-arc equal-base" d="${arcC}"></path>`;

            // 绘制右半部分以支撑重合效果
            drawHtml += `
                <polygon points="${A.x},${A.y} ${midBaseX},${midBaseY} ${C.x},${C.y}" fill="rgba(37, 99, 235, 0.22)" stroke="#2563eb" stroke-width="2.2px" stroke-dasharray="4,3" opacity="0.92"></polygon>
            `;

            // 教学优化：使用 3D 拟真翻折纸张组 <g>
            const cosVal = Math.cos(progress * Math.PI);
            const sinVal = Math.sin(progress * Math.PI);
            const shadowOffsetX = -25 * sinVal * cosVal;
            const shadowOffsetY = 15 * sinVal;
            const shadowBlur = 8 + 15 * sinVal;
            const shadowOpacity = 0.16 * sinVal;
            const brightness = 1.0 - 0.22 * sinVal;

            // 左半侧翻折三角形几何及底角角弧 (利用 scaleX 进行完美的物理投射翻转)
            drawHtml += `
                <g style="transform-origin: ${midBaseX}px ${midBaseY}px; transform: scaleX(${cosVal}); filter: brightness(${brightness}) drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(15,23,42,${shadowOpacity}));">
                    <!-- 左侧纸片 ABD -->
                    <polygon class="geo-triangle-fill-fold" points="${A.x},${A.y} ${B.x},${B.y} ${midBaseX},${midBaseY}"></polygon>
                    <!-- 左底角 B 弧线 -->
                    <path class="geo-angle-arc equal-base" d="${getAngleArcPath(B, A, {x: midBaseX, y: midBaseY}, 26)}"></path>
                </g>
            `;

            // 绘制足点 D (折痕底端点)
            drawHtml += `
                <circle cx="${midBaseX}" cy="${midBaseY}" r="4.5" fill="#ffffff" stroke="var(--text-primary)" stroke-width="2px"></circle>
            `;

        } else if (currentScene === "prop-lines") {
            // 场景 2：三线合一性质 (三色辅助线)
            drawHtml += `
                <polygon class="geo-triangle-fill" points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}"></polygon>
            `;

            // 1. 底边高线 (Altitude) Foot D3
            const d3 = { x: A.x, y: B.y };
            
            // 2. 底边中线 (Median) Foot D2
            const d2 = { x: midBaseX, y: midBaseY };

            // 3. 角平分线 (Angle Bisector) Foot D1
            // 算腰长
            const lenAB = getDistance(A, B);
            const lenAC = getDistance(A, C);
            const d1x = (lenAC * B.x + lenAB * C.x) / (lenAB + lenAC);
            const d1 = { x: d1x, y: B.y };

            const isMerged = Math.abs(A.x - midBaseX) < 1.0;

            // 绘制辅助线
            if (showHeight) {
                drawHtml += `
                    <line class="geo-height-line" x1="${A.x}" y1="${A.y}" x2="${d3.x}" y2="${d3.y}" stroke-width="3px"></line>
                    <!-- 直角标记 -->
                    <path d="M ${d3.x + (A.x > d3.x ? 12 : -12)} ${d3.y} L ${d3.x + (A.x > d3.x ? 12 : -12)} ${d3.y - 12} L ${d3.x} ${d3.y - 12}" fill="none" stroke="var(--success)" stroke-width="1.5px"></path>
                    <circle cx="${d3.x}" cy="${d3.y}" r="4.5" fill="var(--success)" stroke="#ffffff" stroke-width="1.5px"></circle>
                `;
            }
            if (showMedian) {
                drawHtml += `
                    <line class="geo-median-line" x1="${A.x}" y1="${A.y}" x2="${d2.x}" y2="${d2.y}" stroke-width="2.2px"></line>
                    <circle cx="${d2.x}" cy="${d2.y}" r="4.5" fill="var(--primary)" stroke="#ffffff" stroke-width="1.5px"></circle>
                `;
            }
            if (showBisector) {
                drawHtml += `
                    <line class="geo-bisector-line" x1="${A.x}" y1="${A.y}" x2="${d1.x}" y2="${d1.y}" stroke-width="1.8px"></line>
                    <circle cx="${d1.x}" cy="${d1.y}" r="4.5" fill="var(--purple)" stroke="#ffffff" stroke-width="1.5px"></circle>
                `;
            }

            // 教学优化：合并状态下在底边交点处绘制绿色磁吸脉冲圆环
            if (isMerged) {
                drawHtml += `
                    <circle class="geo-pulse-ring" cx="${d2.x}" cy="${d2.y}" r="15"></circle>
                `;
            }

        } else if (currentScene === "detect-angle") {
            // 场景 3：等角对等边判定
            drawHtml += `
                <polygon class="geo-triangle-fill" points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}"></polygon>
            `;

            // 绘制两个底角的弧线（如果相等，绿色高亮；如果不等，橘黄色警告）
            const angleDiff = Math.abs(getAngles().B - getAngles().C);
            const isIsosceles = angleDiff < 0.2;
            const arcClass = isIsosceles ? "equal-base" : "unequal-base";

            const arcB = getAngleArcPath(B, A, C, 26);
            const arcC = getAngleArcPath(C, A, B, 26);

            drawHtml += `
                <path class="geo-angle-arc ${arcClass}" d="${arcB}"></path>
                <path class="geo-angle-arc ${arcClass}" d="${arcC}"></path>
            `;

            // 教学优化：判定等腰成功后，在中垂线位置绘制金色对称轴虚线及两极脉冲波纹
            if (isIsosceles) {
                drawHtml += `
                    <line class="geo-symmetry-line" x1="${midBaseX}" y1="${A.y - 30}" x2="${midBaseX}" y2="${midBaseY + 20}" stroke="var(--success)" stroke-width="1.8px"></line>
                    <circle class="geo-pulse-ring" cx="${A.x}" cy="${A.y}" r="15"></circle>
                    <circle class="geo-pulse-ring" cx="${midBaseX}" cy="${midBaseY}" r="15"></circle>
                `;
            } else {
                // 不等时提供淡淡的对齐中垂引导线
                drawHtml += `
                    <line class="geo-symmetry-line" x1="${midBaseX}" y1="${A.y - 30}" x2="${midBaseX}" y2="${midBaseY + 20}" opacity="0.3"></line>
                `;
            }
        }

        // 3. 绘制外部三个可拖拽端点
        // A 点
        drawHtml += drawSVGPoint("A", A);
        
        // B 点 与 C 点
        drawHtml += drawSVGPoint("B", B);
        drawHtml += drawSVGPoint("C", C);

        sandboxSvg.innerHTML = drawHtml;
    }

    function drawSVGPoint(id, pt) {
        const haloRadius = document.documentElement.clientWidth <= 640 ? 24 : 18;
        return `
            <g class="geo-point-wrapper" data-point-id="${id}">
                <circle class="geo-point-halo" cx="${pt.x}" cy="${pt.y}" r="${haloRadius}"></circle>
                <circle class="geo-point" cx="${pt.x}" cy="${pt.y}" r="6.5"></circle>
            </g>
        `;
    }

    // ==========================================================================
    // 6. HTML Labels & HUD 看板更新
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        const progress = renderValues.foldProgress;
        
        let labelHtml = "";
        
        const A = pointA;
        const B = pointB;
        const C = pointC;
        const midBaseX = (B.x + C.x) / 2;
        const midBaseY = (B.y + C.y) / 2;

        const angles = getAngles();
        const lenAB = getDistance(A, B) / 30; // 换算厘米
        const lenAC = getDistance(A, C) / 30;
        const lenBC = getDistance(B, C) / 30;

        // 1. 绘制顶点的字母标注 (A, B, C)
        labelHtml += `<div class="floating-label-pt" style="left:${A.x}px; top:${A.y - 18}px">A</div>`;
        labelHtml += `<div class="floating-label-pt" style="left:${C.x + 14}px; top:${C.y}px">C</div>`;

        // 场景 1 翻折顶角标注
        if (currentScene === "prop-angle") {
            const cosVal = Math.cos(progress * Math.PI);
            const foldedBx = midBaseX + (B.x - midBaseX) * cosVal;
            const labelX = foldedBx - 14;
            const labelY = B.y;
            labelHtml += `<div class="floating-label-pt" style="left:${labelX}px; top:${labelY}px; color:var(--primary)">B'</div>`;
            labelHtml += `<div class="drag-hint-chip" style="left:${A.x + 22}px; top:${A.y - 48}px">拖动 A 改变等腰三角形胖瘦</div>`;
            
            // 绘制底足点 D 标注
            labelHtml += `<div class="floating-label-pt" style="left:${midBaseX}px; top:${midBaseY + 16}px">D</div>`;
            
            // 腰长测量挂泡 (AB 与 AC)
            if (progress < 0.05) {
                const mapAB = { x: (A.x + B.x)/2 - 25, y: (A.y + B.y)/2 };
                const mapAC = { x: (A.x + C.x)/2 + 25, y: (A.y + C.y)/2 };
                labelHtml += `<div class="floating-badge" style="left:${mapAB.x}px; top:${mapAB.y}px">AB = ${lenAB.toFixed(1)} cm</div>`;
                labelHtml += `<div class="floating-badge" style="left:${mapAC.x}px; top:${mapAC.y}px">AC = ${lenAC.toFixed(1)} cm</div>`;
            }
        } else {
            labelHtml += `<div class="floating-label-pt" style="left:${B.x - 14}px; top:${B.y}px">B</div>`;
        }

        // 场景 2 三足点标签
        if (currentScene === "prop-lines") {
            const d3 = { x: A.x, y: B.y };
            const d2 = { x: midBaseX, y: midBaseY };
            const lenAB_val = getDistance(A, B);
            const lenAC_val = getDistance(A, C);
            const d1 = { x: (lenAC_val * B.x + lenAB_val * C.x) / (lenAB_val + lenAC_val), y: B.y };

            const isMerged = Math.abs(A.x - midBaseX) < 1.5;

            if (isMerged) {
                labelHtml += `<div class="floating-label-pt" style="left:${midBaseX}px; top:${midBaseY + 18}px; color:var(--success); font-weight:800;">D₁/D₂/D₃</div>`;
                labelHtml += `<div class="drag-hint-chip success" style="left:${midBaseX + 22}px; top:${midBaseY - 34}px">三线已重合</div>`;
            } else {
                if (showHeight) labelHtml += `<div class="floating-label-pt" style="left:${d3.x}px; top:${d3.y + 18}px; color:var(--success)">D₃</div>`;
                if (showMedian) labelHtml += `<div class="floating-label-pt" style="left:${d2.x}px; top:${d2.y + 18}px; color:var(--primary)">D₂</div>`;
                if (showBisector) labelHtml += `<div class="floating-label-pt" style="left:${d1.x}px; top:${d1.y + 18}px; color:var(--purple)">D₁</div>`;
                labelHtml += `<div class="drag-hint-chip" style="left:${midBaseX + 22}px; top:${midBaseY - 34}px">把 A 拖回中垂线</div>`;
            }
        } else if (currentScene === "detect-angle") {
            const angleDiff = Math.abs(angles.B - angles.C);
            const isIsosceles = angleDiff < 0.2;
            labelHtml += `<div class="drag-hint-chip ${isIsosceles ? "success" : ""}" style="left:${A.x + 22}px; top:${A.y - 48}px">${isIsosceles ? "底角相等，判定成立" : `拖动 A，让角差接近 0°`}</div>`;
        }

        htmlOverlay.innerHTML = labelHtml;

        // 2. 更新右侧面板读数
        valFold.textContent = `${Math.round(foldProgress * 100)} %`;
        sliderFold.value = Math.round(foldProgress * 100);

        // 3. 更新板书 HUD
        updateChalkboardHUD(angles, lenAB, lenAC, lenBC);
        updateTeachingPanels(angles, lenAB, lenAC, lenBC);
    }

    function getSceneTeachingState(angles, lenAB, lenAC, lenBC) {
        const midBaseX = (pointB.x + pointC.x) / 2;
        const angleDiff = Math.abs(angles.B - angles.C);
        const sideDiff = Math.abs(lenAB - lenAC);
        const lineGap = Math.abs(pointA.x - midBaseX);
        if (currentScene === "prop-angle") {
            const progressPct = Math.round(renderValues.foldProgress * 100);
            return {
                sceneIndex: "1/3",
                taskTitle: "等边对等角",
                objective: "验证 AB = AC 时两个底角是否相等。",
                action: "拖动 A 改变等腰三角形胖瘦，再拖动翻折滑块观察重合。",
                conclusion: "折叠重合说明 ∠B = ∠C。",
                meterValue: progressPct,
                meterLabel: `翻折重合 ${progressPct}%`,
                feedbackTitle: progressPct >= 98 ? "重合验证完成" : "等待翻折验证",
                feedbackDesc: progressPct >= 98 ? "B 点落到 C 点附近，底角重合成立。" : "继续拖动翻折滑块，观察两个底角是否完全重合。",
                feedbackTone: progressPct >= 98 ? "success" : "info",
                proofLines: ["∵ AB = AC", "∴ ∠B = ∠C", "等腰三角形的两个底角相等。"]
            };
        }
        if (currentScene === "prop-lines") {
            const merged = lineGap < 1.5;
            const meter = Math.max(0, Math.min(100, Math.round(100 - lineGap * 1.2)));
            return {
                sceneIndex: "2/3",
                taskTitle: "三线合一",
                objective: "观察高线、中线、顶角平分线什么时候重合。",
                action: "拖动 A 偏离或靠近底边中点正上方，比较 D₁/D₂/D₃ 的位置。",
                conclusion: "当 AB = AC 时，三条辅助线重合为同一条对称轴。",
                meterValue: meter,
                meterLabel: merged ? "三线重合" : `偏离中垂线 ${Math.round(lineGap)} px`,
                feedbackTitle: merged ? "三线合一成立" : "三线仍然分立",
                feedbackDesc: merged ? "高线、中线、角平分线已经收敛到同一足点。" : "把 A 拖回底边中点正上方，或点击一键合拢。",
                feedbackTone: merged ? "success" : "warn",
                proofLines: ["∵ AB = AC", "∴ AD 既是顶角平分线，也是底边中线和底边高线", "等腰三角形顶角平分线、底边中线、底边高线三线合一。"]
            };
        }
        const ready = angleDiff < 0.2;
        const meter = Math.max(0, Math.min(100, Math.round(100 - angleDiff * 18)));
        return {
            sceneIndex: "3/3",
            taskTitle: "等角对等边",
            objective: "验证两个底角相等时，对边是否相等。",
            action: "拖动 A，观察角差和腰长差如何同步变化。",
            conclusion: "当 ∠B = ∠C 时，AB = AC，三角形为等腰三角形。",
            meterValue: meter,
            meterLabel: ready ? "判定成立" : `角差 ${angleDiff.toFixed(1)}°`,
            feedbackTitle: ready ? "等角对等边成立" : "继续寻找底角相等",
            feedbackDesc: ready ? `∠B 与 ∠C 相等，AB 与 AC 的差约 ${sideDiff.toFixed(1)} cm。` : "拖动 A 靠近中垂线，系统会在底角接近相等时吸附。",
            feedbackTone: ready ? "success" : "warn",
            proofLines: ["∵ ∠B = ∠C", "∴ AB = AC", "有两个角相等的三角形是等腰三角形。"]
        };
    }

    function updateTeachingPanels(angles, lenAB, lenAC, lenBC) {
        const state = getSceneTeachingState(angles, lenAB, lenAC, lenBC);
        if (taskFlowBody) {
            taskFlowBody.innerHTML = `
                <div class="task-kicker">当前任务 ${state.sceneIndex}</div>
                <div class="task-title">${state.taskTitle}</div>
                <div class="task-step"><span>目标</span><p>${state.objective}</p></div>
                <div class="task-step"><span>操作</span><p>${state.action}</p></div>
                <div class="task-step"><span>归纳</span><p>${state.conclusion}</p></div>
            `;
        }
        if (sceneFeedbackBody) {
            sceneFeedbackBody.innerHTML = `
                <div class="feedback-head ${state.feedbackTone}">
                    <strong>${state.feedbackTitle}</strong>
                    <span>${state.meterLabel}</span>
                </div>
                <div class="condition-meter" aria-label="${state.meterLabel}">
                    <div class="condition-meter-fill ${state.feedbackTone}" style="width:${state.meterValue}%"></div>
                </div>
                <p>${state.feedbackDesc}</p>
            `;
        }
        if (proofTemplateBody) {
            proofTemplateBody.innerHTML = state.proofLines
                .map((line, index) => `<div class="proof-line"><span>${index + 1}</span><code>${line}</code></div>`)
                .join("");
        }
    }

    function updateChalkboardHUD(angles, lenAB, lenAC, lenBC) {
        let html = "";
        const progress = renderValues.foldProgress;

        if (currentScene === "prop-angle") {
            const isFolded = progress > 0.98;
            html += `
                <div class="hud-row">
                    <div class="hud-row-label">两腰与底角</div>
                    <div class="expr-row">
                        <span class="expr-formula">AB = ${lenAB.toFixed(1)} cm</span>
                        <span class="expr-formula">AC = ${lenAC.toFixed(1)} cm</span>
                        <span class="expr-badge true">AB = AC</span>
                    </div>
                </div>
                
                <div class="hud-row">
                    <div class="hud-row-label">底角与翻折</div>
                    <div class="expr-row">
                        <span class="expr-formula">∠B = ∠C = ${angles.B.toFixed(1)}°</span>
                        <span class="expr-badge true">${Math.round(progress*100)} %</span>
                    </div>
                </div>
                
                <div class="hud-verdict-box success">
                    <div class="verdict-title">底角相等：&angle;B = &angle;C</div>
                    <div class="verdict-desc">${isFolded ? "重合验证完成：等腰三角形的两个底角相等！" : "滑动下方翻折滑块，查看两底角物理重合效果"}</div>
                </div>
            `;
        } else if (currentScene === "prop-lines") {
            const isMerged = Math.abs(pointA.x - (pointB.x + pointC.x)/2) < 1.0;
            const diff腰 = Math.abs(lenAB - lenAC);

            html += `
                <div class="hud-row">
                    <div class="hud-row-label">两腰关系</div>
                    <div class="expr-row">
                        <span class="expr-formula">AB = ${lenAB.toFixed(1)} cm</span>
                        <span class="expr-formula">AC = ${lenAC.toFixed(1)} cm</span>
                        <span class="expr-badge ${isMerged ? 'true' : 'false'}">${isMerged ? 'AB = AC' : 'AB &ne; AC'}</span>
                    </div>
                </div>

                <div class="hud-row">
                    <div class="hud-row-label">底边三足点 x 坐标</div>
                    <div class="expr-row">
                        <span class="expr-formula">D₃ ${pointA.x.toFixed(0)} · D₂ ${((pointB.x + pointC.x)/2).toFixed(0)} · D₁ ${((lenAC*pointB.x + lenAB*pointC.x)/(lenAB+lenAC)).toFixed(0)}</span>
                    </div>
                </div>
                
                <div class="hud-verdict-box ${isMerged ? 'success' : 'danger'}">
                    <div class="verdict-title">${isMerged ? '🎉 三线合一！' : '三线分立'}</div>
                    <div class="verdict-desc">${isMerged ? '等腰三角形底边上的高、中线与顶角平分线重合为一线！' : '拖动顶点 A 回到正上方，即可触发磁力吸附与三线合一！'}</div>
                </div>
            `;
        } else if (currentScene === "detect-angle") {
            const angleDiff = Math.abs(angles.B - angles.C);
            const isIsosceles = angleDiff < 0.2;

            html += `
                <div class="hud-row">
                    <div class="hud-row-label">底角关系</div>
                    <div class="expr-row">
                        <span class="expr-formula">&angle;B = ${angles.B.toFixed(1)}&deg;</span>
                        <span class="expr-formula">&angle;C = ${angles.C.toFixed(1)}&deg;</span>
                        <span class="expr-badge ${isIsosceles ? 'true' : 'false'}">${isIsosceles ? '相等' : '不等'}</span>
                    </div>
                </div>

                <div class="hud-row">
                    <div class="hud-row-label">对应腰长</div>
                    <div class="expr-row">
                        <span class="expr-formula">AB = ${lenAB.toFixed(1)} cm</span>
                        <span class="expr-formula">AC = ${lenAC.toFixed(1)} cm</span>
                        <span class="expr-badge ${isIsosceles ? 'true' : 'false'}">${isIsosceles ? 'AB = AC' : 'AB &ne; AC'}</span>
                    </div>
                </div>
                
                <div class="hud-verdict-box ${isIsosceles ? 'success' : 'danger'}">
                    <div class="verdict-title">${isIsosceles ? '判定成功：等角对等边！' : '寻找底角相等'}</div>
                    <div class="verdict-desc">${isIsosceles ? '如果有两个角相等，那么它们所对的边也相等（是等腰三角形）' : '拖动顶点 A，当两底角角度偏差小于 1° 时，将自动吸附为等腰三角形！'}</div>
                </div>
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 7. 右侧说明卡片内容刷新
    // ==========================================================================
    function updateTheoryContent() {
        let title = "";
        let text = "";

        if (currentScene === "prop-angle") {
            title = "💡 等腰三角形性质 1";
            text = `
                <p><strong>定理：</strong>等腰三角形的两个底角相等。</p>
            `;
        } else if (currentScene === "prop-lines") {
            title = "💡 等腰三角形性质 2";
            text = `
                <p><strong>定理：</strong>顶角平分线、底边中线和高线互相重合。</p>
            `;
        } else if (currentScene === "detect-angle") {
            title = "💡 等腰三角形判定定理";
            text = `
                <p><strong>判定：</strong>两个角相等，对边相等，三角形为等腰三角形。</p>
            `;
        }

        theoryTitle.innerHTML = title;
        theoryText.innerHTML = text;
    }

    // ==========================================================================
    // 8. LERP 回路系统 (用于插值平滑)
    // ==========================================================================
    let lerpLoopId = null;
    function updateLerp() {
        const k = 0.16;

        renderValues.foldProgress += (foldProgress - renderValues.foldProgress) * k;
        renderValues.ax += (pointA.x - renderValues.ax) * k;
        renderValues.ay += (pointA.y - renderValues.ay) * k;
        renderValues.bx += (pointB.x - renderValues.bx) * k;
        renderValues.by += (pointB.y - renderValues.by) * k;
        renderValues.cx += (pointC.x - renderValues.cx) * k;
        renderValues.cy += (pointC.y - renderValues.cy) * k;

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
    // 9. 翻折动画播放器
    // ==========================================================================
    function playFoldingAnimation() {
        if (isAnimating) {
            clearInterval(animationTimer);
            isAnimating = false;
            btnPlayFold.querySelector("span").textContent = "播放翻折动画";
            return;
        }

        isAnimating = true;
        btnPlayFold.querySelector("span").textContent = "暂停动画";

        if (foldProgress > 0.98) {
            foldProgress = 0.0;
        }

        animationTimer = setInterval(() => {
            foldProgress += 0.02;
            if (foldProgress >= 1.0) {
                foldProgress = 1.0;
                clearInterval(animationTimer);
                isAnimating = false;
                btnPlayFold.querySelector("span").textContent = "播放翻折动画";
                
                // 翻折重合成功后释放粒子庆祝
                triggerCelebration(pointC.x, pointC.y);
            }
        }, 25);
    }

    // ==========================================================================
    // 10. 几何控制与拖拽限位
    // ==========================================================================
    function syncRenderValuesToPoints() {
        renderValues.ax = pointA.x;
        renderValues.ay = pointA.y;
        renderValues.bx = pointB.x;
        renderValues.by = pointB.y;
        renderValues.cx = pointC.x;
        renderValues.cy = pointC.y;
        renderValues.foldProgress = foldProgress;
    }

    function resetTriangle(scene) {
        const rect = sandboxSvg?.getBoundingClientRect?.();
        centerX = rect?.width ? rect.width / 2 : 400;
        centerY = rect?.height ? rect.height / 2 : 300;
        const halfBase = 130;
        const height = 200;

        // 重置为标准等腰三角形
        pointA.x = centerX; pointA.y = centerY - height / 2;
        pointB.x = centerX - halfBase; pointB.y = centerY + height / 2;
        pointC.x = centerX + halfBase; pointC.y = centerY + height / 2;
        foldProgress = 0.0;
        syncRenderValuesToPoints();
        
        if (isAnimating) {
            clearInterval(animationTimer);
            isAnimating = false;
            btnPlayFold.querySelector("span").textContent = "播放翻折动画";
        }
        
        updateTheoryContent();
    }

    // ==========================================================================
    // 11. 事件监听与绑定 (Tabs, Sliders, Checkboxes)
    // ==========================================================================
    
    // 场景选项卡切换
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            currentScene = btn.getAttribute("data-scene");
            document.querySelectorAll(".btn-preset").forEach(b => {
                if (b === btn) b.classList.add("active");
                else b.classList.remove("active");
            });

            // 切换特定面板显隐
            secScene1.style.display = currentScene === "prop-angle" ? "block" : "none";
            secScene2.style.display = currentScene === "prop-lines" ? "block" : "none";
            secScene3.style.display = currentScene === "detect-angle" ? "block" : "none";

            resetTriangle(currentScene);
            scheduleSystemStandard();
        });
    });

    // 专题 1 折纸滑块
    sliderFold.addEventListener("input", (e) => {
        foldProgress = parseFloat(e.target.value) / 100;
    });

    btnPlayFold.addEventListener("click", playFoldingAnimation);
    btnResetFold.addEventListener("click", () => {
        foldProgress = 0.0;
        if (isAnimating) {
            clearInterval(animationTimer);
            isAnimating = false;
            btnPlayFold.querySelector("span").textContent = "播放翻折动画";
        }
    });

    // 专题 2 辅助线显示开关
    chkHeight.addEventListener("change", (e) => {
        showHeight = e.target.checked;
        scheduleSystemStandard();
    });
    chkMedian.addEventListener("change", (e) => {
        showMedian = e.target.checked;
        scheduleSystemStandard();
    });
    chkBisector.addEventListener("change", (e) => {
        showBisector = e.target.checked;
        scheduleSystemStandard();
    });

    btnAlignIsosceles.addEventListener("click", () => {
        // 一键把 A 对齐到中线 (触发合拢庆祝)
        pointA.x = (pointB.x + pointC.x) / 2;
        triggerCelebration(pointA.x, pointB.y);
    });

    // 专题 3 判定一键 Snap
    btnSnapDetect.addEventListener("click", () => {
        pointA.x = (pointB.x + pointC.x) / 2;
        triggerCelebration(pointA.x, pointA.y);
    });

    // 帮助模态窗
    document.getElementById("btn-show-help").addEventListener("click", () => document.getElementById("modal-help").classList.add("active"));
    document.getElementById("btn-close-help").addEventListener("click", () => document.getElementById("modal-help").classList.remove("active"));
    document.getElementById("modal-help").addEventListener("click", (e) => {
        if (e.target === document.getElementById("modal-help")) document.getElementById("modal-help").classList.remove("active");
    });

    // 折叠 HUD：保留直接监听作为兜底，同一事件由标记避免二次反转。
    hudToggleBtn.addEventListener("click", toggleHudPanel);

    // 鼠标与触控拖拽逻辑
    sandboxWrapper.addEventListener("mousedown", (e) => {
        const ptWrapper = e.target.closest(".geo-point-wrapper");
        if (ptWrapper) {
            const ptId = ptWrapper.getAttribute("data-point-id");
            activeDragPoint = ptId;
            e.stopPropagation();
        }
    });

    window.addEventListener("mousemove", (e) => {
        if (activeDragPoint) {
            const rect = sandboxSvg.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;

            const midBaseX = (pointB.x + pointC.x) / 2;

            if (activeDragPoint === "A") {
                if (currentScene === "prop-angle") {
                    // 场景 1：等腰锁定，A 只能上下垂直移动改变高度 (x 锁定在底边中线)
                    pointA.y = Math.min(pointB.y - 60, Math.max(80, localY));
                } else {
                    // 场景 2 和 3：A 可以自由在 2D 平面拖拽
                    pointA.x = Math.min(pointC.x - 20, Math.max(pointB.x + 20, localX));
                    pointA.y = Math.min(pointB.y - 60, Math.max(80, localY));

                    // 场景 2/3 的磁力吸附机制
                    const distToCenter = Math.abs(pointA.x - midBaseX);
                    if (distToCenter < 6) {
                        pointA.x = midBaseX; // 磁力扣合
                        // 播放磁力扣合庆祝特效
                        if (distToCenter > 0.5) {
                            triggerCelebration(pointA.x, pointA.y);
                        }
                    }
                }
            } else if (activeDragPoint === "B") {
                // B 仅允许水平拖拽
                pointB.x = Math.min(pointA.x - 30, Math.max(50, localX));
                
                if (currentScene === "prop-angle") {
                    // 场景 1 等腰约束下，B 的挪动对称映射到 C
                    const dx = pointA.x - pointB.x;
                    pointC.x = pointA.x + dx;
                }
            } else if (activeDragPoint === "C") {
                // C 仅允许水平拖拽
                pointC.x = Math.max(pointA.x + 30, Math.min(750, localX));
                
                if (currentScene === "prop-angle") {
                    // 场景 1 等腰约束下，C 的挪动对称映射到 B
                    const dx = pointC.x - pointA.x;
                    pointB.x = pointA.x - dx;
                }
            }
        }
    });

    window.addEventListener("mouseup", () => {
        activeDragPoint = null;
    });

    // 移动端 Touch 支持
    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                activeDragPoint = ptId;
                e.stopPropagation();
            }
        }
    });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (activeDragPoint && e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = sandboxSvg.getBoundingClientRect();
            const localX = touch.clientX - rect.left;
            const localY = touch.clientY - rect.top;

            const midBaseX = (pointB.x + pointC.x) / 2;

            if (activeDragPoint === "A") {
                if (currentScene === "prop-angle") {
                    pointA.y = Math.min(pointB.y - 60, Math.max(80, localY));
                } else {
                    pointA.x = Math.min(pointC.x - 20, Math.max(pointB.x + 20, localX));
                    pointA.y = Math.min(pointB.y - 60, Math.max(80, localY));

                    const distToCenter = Math.abs(pointA.x - midBaseX);
                    if (distToCenter < 6) {
                        pointA.x = midBaseX;
                        if (distToCenter > 0.5) triggerCelebration(pointA.x, pointA.y);
                    }
                }
            } else if (activeDragPoint === "B") {
                pointB.x = Math.min(pointA.x - 30, Math.max(50, localX));
                if (currentScene === "prop-angle") {
                    const dx = pointA.x - pointB.x;
                    pointC.x = pointA.x + dx;
                }
            } else if (activeDragPoint === "C") {
                pointC.x = Math.max(pointA.x + 30, Math.min(750, localX));
                if (currentScene === "prop-angle") {
                    const dx = pointC.x - pointA.x;
                    pointB.x = pointA.x - dx;
                }
            }
            e.preventDefault();
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchend", () => {
        activeDragPoint = null;
    });

    // ==========================================================================
    // 12. 页面视口初始化
    // ==========================================================================
    setTimeout(() => {
        resizeCanvas();
        resetTriangle("prop-angle");
        scheduleSystemStandard();
    }, 100);

    window.addEventListener("resize", scheduleSystemStandard, { passive: true });
});

/**
 * 三角形与多边形内角和拆分实验室 - 几何计算与动画控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态变量与参数
    // ==========================================================================
    let sideN = 5;                           // 默认五边形
    let currentMethod = "vertex";            // 默认顶点拆分法 (vertex, interior, edge)
    let explodeProgress = 0.0;               // 分离进度 0.0 ~ 1.0
    
    let isAnimating = false;
    let isHudExpanded = false;
    let activeDragPoint = null;
    let dragStartPos = { x: 0, y: 0 };
    
    // LERP 数值平滑系统
    const renderValues = {
        sideN: 5,
        explodeProgress: 0.0
    };

    // 画布缩放平移
    let zoomScale = 1.0;
    let panX = 0, panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    let centerX = 400;
    let centerY = 300;
    const POLY_RADIUS = 140;
    const TEACHING_STAGES = [
        { key: "observe", label: "原图", hint: "先观察 n 边形的所有内角" },
        { key: "draw", label: "画线", hint: "画出拆分辅助线" },
        { key: "count", label: "数三角形", hint: "把图形转化为若干个三角形" },
        { key: "deduct", label: "扣多余角", hint: "识别被多算的周角或平角" },
        { key: "formula", label: "得公式", hint: "合成内角和公式" }
    ];

    const TRIANGLE_PALETTE = [
        { fill: "rgba(96, 165, 250, 0.74)", stroke: "#1d4ed8" },
        { fill: "rgba(52, 211, 153, 0.72)", stroke: "#047857" },
        { fill: "rgba(251, 191, 36, 0.76)", stroke: "#b45309" },
        { fill: "rgba(167, 139, 250, 0.72)", stroke: "#6d28d9" },
        { fill: "rgba(244, 114, 182, 0.70)", stroke: "#be185d" },
        { fill: "rgba(45, 212, 191, 0.70)", stroke: "#0f766e" },
        { fill: "rgba(251, 146, 60, 0.72)", stroke: "#c2410c" },
        { fill: "rgba(125, 211, 252, 0.72)", stroke: "#0369a1" }
    ];

    // 多边形顶点数组: { x, y, regularAngle }
    let vertices = [];
    
    // 方法 B 的内部中心点 O
    let pointO = { x: 400, y: 300 };
    
    // 方法 C 的边上点 P，表示在边 V_0 V_1 上的插值比例 u (0.1 ~ 0.9)
    let edgeU = 0.5;
    let pointP = { x: 400, y: 300 };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getTriangleStyle(index) {
        return TRIANGLE_PALETTE[index % TRIANGLE_PALETTE.length];
    }

    function getTeachingStage(progress = explodeProgress) {
        if (progress < 0.18) return 0;
        if (progress < 0.40) return 1;
        if (progress < 0.62) return 2;
        if (progress < 0.84) return 3;
        return 4;
    }

    function getStageFactor(start, end, progress = renderValues.explodeProgress) {
        if (progress <= start) return 0;
        if (progress >= end) return 1;
        return (progress - start) / (end - start);
    }

    function getMethodMeta() {
        const n = sideN;
        const finalSum = (n - 2) * 180;
        if (currentMethod === "interior") {
            return {
                key: "interior",
                code: "B",
                name: "内部点拆分法",
                sourceLabel: "内部点 O",
                triangleCount: n,
                countExpr: `${n} 个三角形`,
                rawExpr: `${n} × 180° = ${n * 180}°`,
                redundantAngle: 360,
                redundantLabel: "中心周角 360°",
                formula: `${n} × 180° - 360° = ${finalSum}°`,
                generalFormula: "n × 180° - 360° = (n - 2) × 180°",
                correction: "不是 n × 180°，内部点 O 周围一整圈被多算了。"
            };
        }
        if (currentMethod === "edge") {
            return {
                key: "edge",
                code: "C",
                name: "边上点拆分法",
                sourceLabel: "边上点 P",
                triangleCount: n - 1,
                countExpr: `${n - 1} 个三角形`,
                rawExpr: `(${n} - 1) × 180° = ${(n - 1) * 180}°`,
                redundantAngle: 180,
                redundantLabel: "边上平角 180°",
                formula: `(${n} - 1) × 180° - 180° = ${finalSum}°`,
                generalFormula: "(n - 1) × 180° - 180° = (n - 2) × 180°",
                correction: "点 P 在边上，多算的是一个平角，不是完整周角。"
            };
        }
        return {
            key: "vertex",
            code: "A",
            name: "顶点拆分法",
            sourceLabel: "从 V1 出发",
            triangleCount: n - 2,
            countExpr: `${n} - 2 = ${n - 2} 个三角形`,
            rawExpr: `(${n} - 2) × 180° = ${finalSum}°`,
            redundantAngle: 0,
            redundantLabel: "无多余角",
            formula: `(${n} - 2) × 180° = ${finalSum}°`,
            generalFormula: "(n - 2) × 180°",
            correction: "从一个顶点引对角线，拆出的三角形正好拼成所有内角。"
        };
    }

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");
    const hudTitle = hudPanel?.querySelector(".hud-title");
    hudPanel?.classList.add("collapsed");
    hudPanel?.classList.add("hud-screen-fit");
    if (hudTitle) hudTitle.textContent = "割补板书推理";

    const sliderSideN = document.getElementById("slider-side-n");
    const valSideN = document.getElementById("val-side-n");
    const sliderExplode = document.getElementById("slider-explode-progress");
    const valExplode = document.getElementById("val-explode-progress");
    const labelExplode = sliderExplode?.closest(".slider-row")?.querySelector(".slider-label");

    const btnPlayExplode = document.getElementById("btn-play-explode");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");
    const dynamicPointTip = document.getElementById("dynamic-point-tip");
    if (labelExplode) labelExplode.textContent = "推导进度：";
    btnPlayExplode?.querySelector("span") && (btnPlayExplode.querySelector("span").textContent = "播放推导动画");

    let standardScheduled = false;
    let applyingStandard = false;

    function installHudAndTouchStyles() {
        if (document.getElementById("j8a-m06-hud-touch-style")) return;

        const style = document.createElement("style");
        style.id = "j8a-m06-hud-touch-style";
        style.textContent = String.raw`
            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .hud-body {
                display: flex !important;
                flex: 0 0 auto !important;
                gap: 5px !important;
                max-height: none !important;
                overflow: visible !important;
                padding: 8px !important;
            }

            .math-source-scene-j8a_m06 #hud-chalkboard-panel.hud-screen-fit,
            .math-source-scene-j8a_m06 #hud-chalkboard-panel.hud-screen-fit .hud-body {
                max-height: none !important;
                overflow: visible !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .stage-panel {
                gap: 4px !important;
                padding: 6px 8px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .stage-panel-head {
                min-height: 15px !important;
                font-size: 10.5px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .stage-track {
                gap: 3px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .stage-dot {
                min-height: 28px !important;
                padding: 2px 1px !important;
                border-radius: 6px !important;
                font-size: 8px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .stage-dot span {
                width: 14px !important;
                height: 14px !important;
                font-size: 8px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .stage-panel p {
                overflow: hidden !important;
                margin: 0 !important;
                font-size: 10px !important;
                line-height: 1.25 !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .hud-row {
                gap: 3px !important;
                padding: 6px 8px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .hud-row-label {
                font-size: 10.5px !important;
                line-height: 1.2 !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .expr-row {
                gap: 6px !important;
                min-height: 16px !important;
                padding: 2px 0 !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .expr-formula {
                font-size: 10.5px !important;
                line-height: 1.25 !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .expr-badge {
                flex: 0 0 auto !important;
                padding: 1px 5px !important;
                font-size: 9px !important;
                line-height: 1.2 !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .triangle-chip-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                gap: 4px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .triangle-chip {
                min-height: 23px !important;
                padding: 3px 5px !important;
                font-size: 10px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .triangle-chip span {
                width: 8px !important;
                height: 8px !important;
                flex-basis: 8px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .hud-verdict-box {
                margin-top: 0 !important;
                padding: 6px 8px !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .verdict-title {
                margin-bottom: 2px !important;
                font-size: 12px !important;
                line-height: 1.2 !important;
            }

            .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit .verdict-desc {
                display: -webkit-box !important;
                overflow: hidden !important;
                font-size: 10px !important;
                line-height: 1.25 !important;
                -webkit-box-orient: vertical !important;
                -webkit-line-clamp: 2 !important;
            }

            @media (max-width: 640px) {
                .math-source-scene-j8a_m06 .hud-panel.hud-screen-fit {
                    width: min(300px, calc(100% - 36px)) !important;
                    max-width: calc(100% - 36px) !important;
                }

                .math-source-scene-j8a_m06 .geo-point-halo {
                    r: 26px !important;
                    opacity: 0.14 !important;
                }

                .math-source-scene-j8a_m06 .geo-point {
                    r: 8px !important;
                }

                .math-source-panel-j8a_m06 .math-source-panel-scroll {
                    padding: 8px 10px 12px !important;
                    overscroll-behavior: contain !important;
                    scroll-snap-type: y proximity !important;
                }

                .math-source-panel-j8a_m06 .math-source-panel-content,
                .math-source-panel-j8a_m06 .control-column {
                    gap: 10px !important;
                    width: 100% !important;
                }

                .math-source-panel-j8a_m06 .panel-section {
                    width: 100% !important;
                    min-width: 0 !important;
                    padding: 12px !important;
                    scroll-snap-align: start !important;
                }

                .math-source-panel-j8a_m06 .presets-grid {
                    display: flex !important;
                    flex-direction: row !important;
                    flex-wrap: nowrap !important;
                    gap: 9px !important;
                    overflow-x: auto !important;
                    overflow-y: hidden !important;
                    padding: 2px 1px 6px !important;
                    scroll-snap-type: x mandatory !important;
                    scrollbar-width: none !important;
                    -webkit-overflow-scrolling: touch !important;
                }

                .math-source-panel-j8a_m06 .presets-grid::-webkit-scrollbar {
                    display: none !important;
                }

                .math-source-panel-j8a_m06 .btn-preset {
                    flex: 0 0 min(164px, 52vw) !important;
                    min-height: 76px !important;
                    padding: 10px !important;
                    scroll-snap-align: start !important;
                }

                .math-source-panel-j8a_m06 .preset-num {
                    grid-row: 1 / span 2 !important;
                }

                .math-source-panel-j8a_m06 .preset-name,
                .math-source-panel-j8a_m06 .preset-desc {
                    min-width: 0 !important;
                    white-space: normal !important;
                }

                .math-source-panel-j8a_m06 .preset-desc {
                    display: -webkit-box !important;
                    overflow: hidden !important;
                    line-height: 1.28 !important;
                    -webkit-box-orient: vertical !important;
                    -webkit-line-clamp: 2 !important;
                }

                .math-source-panel-j8a_m06 .slider-row input[type="range"] {
                    height: 32px !important;
                    min-height: 32px !important;
                    max-height: 32px !important;
                    margin: 0 !important;
                }

                .math-source-panel-j8a_m06 input[type="range"]::-webkit-slider-runnable-track {
                    height: 8px !important;
                }

                .math-source-panel-j8a_m06 input[type="range"]::-webkit-slider-thumb {
                    width: 24px !important;
                    height: 24px !important;
                    margin-top: -8px !important;
                }

                .math-source-panel-j8a_m06 input[type="range"]::-moz-range-track {
                    height: 8px !important;
                }

                .math-source-panel-j8a_m06 input[type="range"]::-moz-range-thumb {
                    width: 24px !important;
                    height: 24px !important;
                }

                .math-source-panel-j8a_m06 .controls-row {
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    gap: 10px !important;
                }

                .math-source-panel-j8a_m06 .flex-btn {
                    min-height: 44px !important;
                    padding: 10px 8px !important;
                    font-size: 12.5px !important;
                    white-space: nowrap !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function applySystemStandard() {
        if (!hudPanel) return;
        applyingStandard = true;
        try {
            const collapsed = hudPanel.classList.contains("collapsed");
            const isNarrowTouch = window.innerWidth <= 640;
            isHudExpanded = !collapsed;
            const set = (node, name, value) => node?.style.setProperty(name, value, "important");

            hudPanel.classList.add("hud-screen-fit");
            hudPanel.classList.toggle("touch-layout", isNarrowTouch);
            document.querySelector(".control-column")?.classList.toggle("touch-layout", isNarrowTouch);
            document.querySelector(".simulation-column")?.classList.toggle("touch-layout", isNarrowTouch);
            set(hudPanel, "display", "flex");
            set(hudPanel, "flex-direction", "column");
            set(hudPanel, "position", "absolute");
            set(hudPanel, "top", "18px");
            set(hudPanel, "left", "18px");
            set(hudPanel, "right", "auto");
            set(hudPanel, "z-index", "120");
            set(hudPanel, "width", collapsed ? "auto" : "300px");
            set(hudPanel, "max-width", collapsed ? "min(300px, calc(100% - 36px))" : "300px");
            set(hudPanel, "height", collapsed ? "42px" : "auto");
            set(hudPanel, "max-height", "none");
            set(hudPanel, "overflow", collapsed ? "hidden" : "visible");
            set(hudPanel, "border-radius", collapsed ? "999px" : "8px");
            set(hudPanel, "background", "rgba(255, 255, 255, 0.94)");
            set(hudPanel, "border", "1px solid rgba(148, 163, 184, 0.36)");
            set(hudPanel, "box-shadow", "0 12px 28px rgba(15, 23, 42, 0.14)");
            set(hudPanel, "color", "#0f172a");

            const header = hudPanel.querySelector(".hud-header");
            const body = hudPanel.querySelector(".hud-body");
            set(header, "height", "42px");
            set(header, "min-height", "42px");
            set(header, "padding", "0 12px 0 14px");
            set(header, "border-bottom", collapsed ? "0" : "1px solid rgba(148, 163, 184, 0.24)");
            set(body, "display", collapsed ? "none" : "flex");
            set(body, "padding", "12px");
            set(body, "gap", "8px");
            set(body, "max-height", "none");
            set(body, "overflow", "visible");

            document.querySelectorAll(".panel-section").forEach(section => {
                set(section, "padding", "12px");
                set(section, "border-radius", "8px");
                set(section, "background", "rgba(15, 23, 42, 0.64)");
                set(section, "border", "1px solid rgba(148, 163, 184, 0.24)");
                set(section, "box-shadow", "none");
                set(section, "color", "rgba(248, 250, 252, 0.94)");
            });

            document.querySelectorAll(".btn-preset").forEach(btn => {
                const active = btn.classList.contains("active");
                set(btn, "display", "grid");
                set(btn, "grid-template-columns", "28px minmax(82px, max-content) minmax(0, 1fr)");
                if (isNarrowTouch) set(btn, "grid-template-columns", "28px minmax(0, 1fr)");
                set(btn, "grid-template-rows", isNarrowTouch ? "auto auto" : "none");
                set(btn, "min-height", isNarrowTouch ? "76px" : "48px");
                set(btn, "align-items", "center");
                set(btn, "border-radius", "8px");
                set(btn, "background", active ? "rgba(37, 99, 235, 0.20)" : "rgba(2, 6, 23, 0.36)");
                set(btn, "border", active ? "1px solid rgba(96, 165, 250, 0.64)" : "1px solid rgba(148, 163, 184, 0.18)");
                set(btn, "color", "rgba(241, 245, 249, 0.92)");
            });

            document.querySelectorAll(".preset-name").forEach(node => {
                set(node, "color", "#f8fafc");
                set(node, "min-width", "82px");
                set(node, "white-space", "nowrap");
                if (isNarrowTouch) {
                    set(node, "min-width", "0");
                    set(node, "white-space", "normal");
                }
                set(node, "line-height", "1.2");
            });
            document.querySelectorAll(".preset-desc").forEach(node => {
                set(node, "color", "rgba(203, 213, 225, 0.82)");
                set(node, "min-width", "0");
                set(node, "line-height", "1.35");
                set(node, "text-align", "left");
                set(node, "word-break", "normal");
                set(node, "overflow-wrap", "normal");
            });
            document.querySelectorAll(".slider-label").forEach(node => set(node, "color", "rgba(203, 213, 225, 0.82)"));
            document.querySelectorAll(".slider-val").forEach(node => set(node, "color", "#f8fafc"));
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
                set(row, "flex-direction", "column");
                set(row, "gap", "8px");
                set(row, "width", "100%");
                set(row, "min-height", "0");
                set(row, "padding", "9px");
                set(row, "border-radius", "8px");
                set(row, "background", "rgba(2, 6, 23, 0.34)");
                set(row, "border", "1px solid rgba(148, 163, 184, 0.18)");
            });
            document.querySelectorAll(".slider-label-row").forEach(row => {
                set(row, "display", "flex");
                set(row, "align-items", "center");
                set(row, "justify-content", "space-between");
                set(row, "width", "100%");
                set(row, "height", "auto");
                set(row, "min-height", "0");
            });
            document.querySelectorAll("input[type=\"range\"]").forEach(input => {
                set(input, "-webkit-appearance", "none");
                set(input, "appearance", "none");
                set(input, "display", "block");
                set(input, "width", "100%");
                set(input, "height", isNarrowTouch ? "32px" : "6px");
                set(input, "min-height", isNarrowTouch ? "32px" : "6px");
                set(input, "max-height", isNarrowTouch ? "32px" : "6px");
                set(input, "padding", "0");
                set(input, "margin", isNarrowTouch ? "0" : "5px 0 2px");
                set(input, "border", "0");
                set(input, "border-radius", "999px");
                set(input, "background", "linear-gradient(90deg, rgba(96, 165, 250, 0.88), rgba(226, 232, 240, 0.28))");
                set(input, "box-shadow", "inset 0 0 0 1px rgba(148, 163, 184, 0.16)");
                set(input, "align-self", "stretch");
            });
            document.querySelectorAll(".theory-card, .dynamic-tip-box").forEach(node => set(node, "display", "none"));
        } finally {
            applyingStandard = false;
        }
    }

    function scheduleSystemStandard() {
        if (applyingStandard || standardScheduled) return;
        standardScheduled = true;
        requestAnimationFrame(() => {
            standardScheduled = false;
            applySystemStandard();
        });
    }

    function isValidObserverRoot(root) {
        return root && typeof root.nodeType === "number" && typeof root.addEventListener === "function";
    }

    function installSystemStandardObserver() {
        const observerRoot = isValidObserverRoot(document.body)
            ? document.body
            : (isValidObserverRoot(document.documentElement) ? document.documentElement : null);

        if (!observerRoot) {
            requestAnimationFrame(installSystemStandardObserver);
            return;
        }

        try {
            const observer = new MutationObserver(() => {
                if (!applyingStandard) scheduleSystemStandard();
            });
            observer.observe(observerRoot, {
                attributes: true,
                childList: true,
                subtree: true,
                attributeFilter: ["class", "style"]
            });
        } catch (error) {
            // The platform adapter can expose DOM-like roots that MutationObserver rejects.
            for (let i = 1; i <= 6; i += 1) {
                setTimeout(scheduleSystemStandard, i * 120);
            }
        }
        scheduleSystemStandard();
    }
    window.addEventListener("resize", scheduleSystemStandard);
    installSystemStandardObserver();

    // ==========================================================================
    // 3. Canvas 烟花粒子系统
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

    function triggerAssemblyParticles() {
        // 在中心点释放一圈庆祝粒子
        const rect = canvas.getBoundingClientRect();
        const screenX = centerX * zoomScale + panX + rect.left;
        const screenY = centerY * zoomScale + panY + rect.top;
        const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];
        
        for (let i = 0; i < 50; i++) {
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
    // 4. 多边形几何顶点生成与限制
    // ==========================================================================
    function generateRegularPolygon(n) {
        vertices = [];
        const startAngle = -Math.PI / 2; // 第一个点指向上方
        for (let i = 0; i < n; i++) {
            const angle = startAngle + (2 * Math.PI * i) / n;
            vertices.push({
                x: centerX + POLY_RADIUS * Math.cos(angle),
                y: centerY + POLY_RADIUS * Math.sin(angle),
                regularAngle: angle,
                name: `V${i + 1}`
            });
        }
        
        // 重置内部点 O 居中
        pointO.x = centerX;
        pointO.y = centerY;
        
        // 重置边上点 P 到 V_0 与 V_1 的中点
        edgeU = 0.5;
        updateEdgePointP();
    }

    function updateEdgePointP() {
        if (vertices.length < 2) return;
        const v0 = vertices[0];
        const v1 = vertices[1];
        pointP.x = (1 - edgeU) * v0.x + edgeU * v1.x;
        pointP.y = (1 - edgeU) * v0.y + edgeU * v1.y;
    }

    // 计算多边形质心
    function getPolygonCentroid() {
        let sumX = 0, sumY = 0;
        vertices.forEach(v => {
            sumX += v.x;
            sumY += v.y;
        });
        return {
            x: sumX / vertices.length,
            y: sumY / vertices.length
        };
    }

    function clampLabelPosition(x, y) {
        const W = sandboxWrapper?.clientWidth || 800;
        const H = sandboxWrapper?.clientHeight || 600;
        let lx = clamp(x, 18, W - 18);
        let ly = clamp(y, 18, H - 18);

        if (isHudExpanded && lx < 330 && ly < 560) {
            lx = 330;
        }

        return { x: lx, y: ly };
    }

    // ==========================================================================
    // 5. 三角形拆分计算与动画平移 (Explosion)
    // ==========================================================================
    function getTriangles() {
        const tris = [];
        const n = vertices.length;
        if (n < 3) return tris;

        if (currentMethod === "vertex") {
            // 方法 A：顶点拆分，从 V0 (即 vertices[0]) 拆分
            const v0 = vertices[0];
            for (let i = 1; i < n - 1; i++) {
                tris.push({
                    pts: [v0, vertices[i], vertices[i + 1]],
                    indices: [0, i, i + 1],
                    // 角标记：定义每个端点在分割三角形中的“角”是否属于原多边形内角
                    // 顶点拆分法中，所有分割出的小三角形内角最终都拼成多边形内角！
                    isRedundant: [false, false, false]
                });
            }
        } else if (currentMethod === "interior") {
            // 方法 B：内部点拆分，以 pointO 为源点
            for (let i = 0; i < n; i++) {
                const nextIdx = (i + 1) % n;
                tris.push({
                    pts: [pointO, vertices[i], vertices[nextIdx]],
                    indices: [-1, i, nextIdx], // -1 表示内部点 O
                    // 仅有在内部点 O 处的角是多余的，其余两顶点处的角属于多边形内角
                    isRedundant: [true, false, false]
                });
            }
        } else if (currentMethod === "edge") {
            // 方法 C：边上点拆分，以 pointP (位于边 V0-V1 上) 为源点
            // 分割出 (n-1) 个三角形
            // 1. 三角形 P - V1 - V2
            tris.push({
                pts: [pointP, vertices[1], vertices[2]],
                indices: [-2, 1, 2], // -2 表示边上点 P
                isRedundant: [true, false, false]
            });
            // 2. 三角形 P - Vi - Vi+1 (i = 2 .. n-2)
            for (let i = 2; i < n - 1; i++) {
                tris.push({
                    pts: [pointP, vertices[i], vertices[i + 1]],
                    indices: [-2, i, i + 1],
                    isRedundant: [true, false, false]
                });
            }
            // 3. 三角形 P - V_n-1 - V0
            tris.push({
                pts: [pointP, vertices[n - 1], vertices[0]],
                indices: [-2, n - 1, 0],
                isRedundant: [true, false, false]
            });
        }
        return tris;
    }

    // ==========================================================================
    // 6. SVG 渲染逻辑
    // ==========================================================================
    
    // 绘制内角圆弧扇形 (Wedge) 的核心数学函数
    function getAngleArcPath(center, pt1, pt2, radius, isRedundant) {
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

    function renderSVG() {
        const scale = zoomScale;
        const progress = renderValues.explodeProgress;
        const teachingStage = getTeachingStage(progress);
        const lineOpacity = getStageFactor(0.10, 0.32, progress);
        const numberOpacity = getStageFactor(0.34, 0.54, progress);
        const separateFactor = getStageFactor(0.52, 0.78, progress);
        const redundantHaloOpacity = getStageFactor(0.66, 0.88, progress);
        
        let drawHtml = "";
        
        // 1. 背景纸张网格
        for (let i = 40; i < 800; i += 40) {
            drawHtml += `<line x1="${i}" y1="0" x2="${i}" y2="600" stroke="#f1f5f9" stroke-width="1.2px"></line>`;
            drawHtml += `<line x1="0" y1="${i}" x2="800" y2="${i}" stroke="#f1f5f9" stroke-width="1.2px"></line>`;
        }

        const polyCentroid = getPolygonCentroid();

        // 1.5 教学优化：绘制拖拽源点的活动范围指南 (仅在拼合状态 progress < 0.05 时引导)
        if (currentMethod === "interior" && progress < 0.05) {
            drawHtml += `
                <circle cx="${polyCentroid.x}" cy="${polyCentroid.y}" r="55" fill="none" stroke="var(--warning)" stroke-width="1.2px" stroke-dasharray="3,3" opacity="0.45" pointer-events="none"></circle>
            `;
        } else if (currentMethod === "edge" && progress < 0.05) {
            const v0 = vertices[0];
            const v1 = vertices[1];
            drawHtml += `
                <line x1="${v0.x}" y1="${v0.y}" x2="${v1.x}" y2="${v1.y}" stroke="var(--warning)" stroke-width="3.5px" stroke-linecap="round" opacity="0.5" pointer-events="none"></line>
            `;
        }

        // 2. 多边形底色骨架虚线 (当分离时显示，以对比位置)
        if (progress > 0.02) {
            let ptsStr = vertices.map(v => `${v.x},${v.y}`).join(" ");
            drawHtml += `
                <polygon points="${ptsStr}" fill="none" stroke="#94a3b8" stroke-width="2.2px" stroke-dasharray="4,4" opacity="${0.34 + 0.38 * separateFactor}"></polygon>
            `;
        }

        // 3. 获取所有分割出的三角形并进行爆炸位移计算
        const tris = getTriangles();
        const pushDistance = isHudExpanded ? 30 : 42; // HUD 展开时收敛位移，减少遮挡

        tris.forEach((tri, index) => {
            const p1 = tri.pts[0];
            const p2 = tri.pts[1];
            const p3 = tri.pts[2];
            
            // 计算三角形重心
            const triCentroid = {
                x: (p1.x + p2.x + p3.x) / 3,
                y: (p1.y + p2.y + p3.y) / 3
            };
            
            // 爆炸推开的单位向量
            const dx = triCentroid.x - polyCentroid.x;
            const dy = triCentroid.y - polyCentroid.y;
            const len = Math.hypot(dx, dy) || 1;
            
            // 当前进度下的偏移像素
            const tx = (dx / len) * pushDistance * separateFactor;
            const ty = (dy / len) * pushDistance * separateFactor;
            
            // Explicit SVG colors avoid platform CSS-variable fallback making pieces look black/white.
            const triStyle = getTriangleStyle(index);
            const colorClass = triStyle.fill;
            const strokeColor = triStyle.stroke;

            // 绘制该三角形组合 (附加 3D 深度角效果，tx, ty 随进度拉开)
            drawHtml += `<g transform="translate(${tx}, ${ty})" style="filter: drop-shadow(0 ${5 * separateFactor}px ${4 * separateFactor}px rgba(15, 23, 42, ${0.16 * separateFactor}));">`;
            
            // 三角形面
            drawHtml += `
                <polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}" fill="${colorClass}" stroke="${strokeColor}" stroke-width="2.4px" stroke-linejoin="round" opacity="${0.90 + 0.10 * numberOpacity}"></polygon>
            `;
            
            // 教学优化：在分割的三角形重心处绘制带圈的序号 (比如 ①, ②...)，淡入淡出
            if (numberOpacity > 0.01) {
                const numberChar = String.fromCharCode(9312 + index);
                drawHtml += `
                    <text x="${triCentroid.x}" y="${triCentroid.y + 4.5}" class="triangle-index-label" font-family="var(--font-sans)" font-size="12px" font-weight="800" fill="#0f172a" text-anchor="middle" pointer-events="none" user-select="none" opacity="${numberOpacity}">${numberChar}</text>
                `;
            }
            
            // 绘制三角形的三个内角圆弧扇形
            // 弧 1: 在 p1 处 (端点 1)
            const arcPath1 = getAngleArcPath(p1, p2, p3, 20, tri.isRedundant[0]);
            const fill1 = tri.isRedundant[0] ? "var(--danger)" : "var(--primary)";
            drawHtml += `<path class="geo-angle-arc ${tri.isRedundant[0] ? "geo-redundant-angle" : ""}" d="${arcPath1}" fill="${fill1}" fill-opacity="${tri.isRedundant[0] ? 0.34 * redundantHaloOpacity : 0.12 + 0.18 * numberOpacity}" opacity="${tri.isRedundant[0] ? redundantHaloOpacity : Math.max(0.22, numberOpacity)}"></path>`;
            
            // 弧 2: 在 p2 处 (端点 2)
            const arcPath2 = getAngleArcPath(p2, p3, p1, 20, tri.isRedundant[1]);
            const fill2 = tri.isRedundant[1] ? "var(--danger)" : "var(--primary)";
            drawHtml += `<path class="geo-angle-arc ${tri.isRedundant[1] ? "geo-redundant-angle" : ""}" d="${arcPath2}" fill="${fill2}" fill-opacity="${tri.isRedundant[1] ? 0.34 * redundantHaloOpacity : 0.12 + 0.18 * numberOpacity}" opacity="${tri.isRedundant[1] ? redundantHaloOpacity : Math.max(0.22, numberOpacity)}"></path>`;
            
            // 弧 3: 在 p3 处 (端点 3)
            const arcPath3 = getAngleArcPath(p3, p1, p2, 20, tri.isRedundant[2]);
            const fill3 = tri.isRedundant[2] ? "var(--danger)" : "var(--primary)";
            drawHtml += `<path class="geo-angle-arc ${tri.isRedundant[2] ? "geo-redundant-angle" : ""}" d="${arcPath3}" fill="${fill3}" fill-opacity="${tri.isRedundant[2] ? 0.34 * redundantHaloOpacity : 0.12 + 0.18 * numberOpacity}" opacity="${tri.isRedundant[2] ? redundantHaloOpacity : Math.max(0.22, numberOpacity)}"></path>`;

            drawHtml += `</g>`;
        });

        // 4. 绘制用于交互的多边形轮廓与顶点 (仅在未完全拆分分离时绘制或允许拖拽)
        // 边线与虚线
        if (progress < 0.99 && lineOpacity > 0.01) {
            // 绘制拆分辅助内线
            if (currentMethod === "vertex") {
                const v0 = vertices[0];
                for (let i = 2; i < vertices.length - 1; i++) {
                    drawHtml += `<line class="geo-split-line" x1="${v0.x}" y1="${v0.y}" x2="${vertices[i].x}" y2="${vertices[i].y}" opacity="${lineOpacity}"></line>`;
                }
            } else if (currentMethod === "interior") {
                vertices.forEach(v => {
                    drawHtml += `<line class="geo-split-line" x1="${pointO.x}" y1="${pointO.y}" x2="${v.x}" y2="${v.y}" opacity="${lineOpacity}"></line>`;
                });
            } else if (currentMethod === "edge") {
                for (let i = 1; i < vertices.length; i++) {
                    drawHtml += `<line class="geo-split-line" x1="${pointP.x}" y1="${pointP.y}" x2="${vertices[i].x}" y2="${vertices[i].y}" opacity="${lineOpacity}"></line>`;
                }
            }
        }

        // 5. 绘制所有的拖拽点
        // 外部顶点 V1..Vn
        vertices.forEach((v, idx) => {
            drawHtml += drawSVGPoint(v.name, v, v.name, { x: -6, y: -14 });
        });

        // 方法 B 的内部中心点 O (黄橙色高亮)
        if (currentMethod === "interior") {
            drawHtml += drawSVGPoint("O", pointO, "O (拆分源点)", { x: 12, y: 5 }, false, true);
        }
        
        // 方法 C 的边上点 P (黄橙色高亮)
        if (currentMethod === "edge") {
            drawHtml += drawSVGPoint("P", pointP, "P (拆分源点)", { x: 12, y: 5 }, false, true);
        }

        sandboxSvg.innerHTML = drawHtml;
    }

    function drawSVGPoint(id, pt, labelText, offset = { x: 12, y: 6 }, isRegular = true, isSource = false) {
        let groupClass = "geo-point-wrapper";
        if (isSource) groupClass += " source-point";
        
        let html = `
            <g class="${groupClass}" data-point-id="${id}">
                <circle class="geo-point-halo" cx="${pt.x}" cy="${pt.y}" r="20"></circle>
                <circle class="geo-point" cx="${pt.x}" cy="${pt.y}" r="6.5"></circle>
            </g>
        `;
        
        // 顶点标注字母在 HTML Overlay 中绘制
        return html;
    }

    // ==========================================================================
    // 7. HTML 文字标签与 HUD 割补板书更新
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        const scale = zoomScale;
        const progress = renderValues.explodeProgress;
        
        let labelHtml = "";

        // 1. 浮动渲染顶点字母 (跟随顶点位置，并支持爆炸位移，此处保持绑定在原位即可)
        vertices.forEach((v) => {
            // 计算标签位置偏置
            const dx = v.x - centerX;
            const dy = v.y - centerY;
            const len = Math.hypot(dx, dy) || 1;
            const labelDist = 18;
            const labelPos = clampLabelPosition(
                v.x + (dx / len) * labelDist,
                v.y + (dy / len) * labelDist
            );
            
            labelHtml += `<div class="floating-label-pt" style="left:${labelPos.x}px; top:${labelPos.y}px">${v.name}</div>`;
        });

        if (currentMethod === "interior") {
            const pos = clampLabelPosition(pointO.x, pointO.y - 18);
            labelHtml += `<div class="floating-label-pt source-label" style="left:${pos.x}px; top:${pos.y}px;">O</div>`;
        } else if (currentMethod === "edge") {
            const pos = clampLabelPosition(pointP.x, pointP.y - 18);
            labelHtml += `<div class="floating-label-pt source-label" style="left:${pos.x}px; top:${pos.y}px;">P</div>`;
        }

        htmlOverlay.innerHTML = labelHtml;

        // 2. 更新右栏操作板文字读数
        valSideN.textContent = `${sideN} 边形`;
        const currentStage = TEACHING_STAGES[getTeachingStage(renderValues.explodeProgress)];
        valExplode.textContent = `${Math.round(explodeProgress * 100)}% · ${currentStage.label}`;
        
        sliderSideN.value = sideN;
        sliderExplode.value = Math.round(explodeProgress * 100);

        // 3. 更新左上角板书 HUD
        updateChalkboardHUD();
    }

    function updateChalkboardHUD() {
        let html = "";
        const n = sideN;

        if (currentMethod === "vertex") {
            const numTris = n - 2;
            const sumAngles = numTris * 180;
            
            // 教学优化：拼接分割出的三角形彩色列表与内角和
            let triListHtml = "";
            for (let i = 0; i < numTris; i++) {
                const color = `var(--color-split-${i % 8})`;
                triListHtml += `
                    <div style="display:flex; align-items:center; font-size:11.5px; font-family:var(--font-sans); color:var(--text-secondary);">
                        <span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:2.5px; margin-right:6px;"></span>
                        三角形 ${String.fromCharCode(9312 + i)} 内角和 = 180&deg;
                    </div>
                `;
            }
            
            html += `
                <div class="hud-row">
                    <div class="hud-row-label">分割三角形列表</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin: 3px 0;">
                        ${triListHtml}
                    </div>
                </div>

                <div class="hud-row">
                    <div class="hud-row-label">拆分三角形个数 (n - 2)</div>
                    <div class="expr-row">
                        <span class="expr-formula">${n} - 2 = ${numTris} 个三角形</span>
                        <span class="expr-badge info">无冗余角</span>
                    </div>
                </div>
                
                <div class="hud-row">
                    <div class="hud-row-label">内角和代数推导过程</div>
                    <div class="expr-row">
                        <span class="expr-formula">S = (${n} - 2) &times; 180&deg;</span>
                    </div>
                    <div class="expr-row">
                        <span class="expr-formula">S = ${numTris} &times; 180&deg; = ${sumAngles}&deg;</span>
                    </div>
                </div>
                
                <div class="hud-verdict-box">
                    <div class="verdict-title">S = (${n} - 2) &times; 180&deg; = ${sumAngles}&deg;</div>
                    <div class="verdict-desc">从 1 个顶点引出对角线，内角和无多余角需扣除</div>
                </div>
            `;
        } else if (currentMethod === "interior") {
            const numTris = n;
            const totalAngles = numTris * 180;
            const redundant = 360;
            const finalSum = totalAngles - redundant;
            
            // 教学优化：拼接分割出的三角形彩色列表与内角和
            let triListHtml = "";
            for (let i = 0; i < numTris; i++) {
                const color = `var(--color-split-${i % 8})`;
                triListHtml += `
                    <div style="display:flex; align-items:center; font-size:11.5px; font-family:var(--font-sans); color:var(--text-secondary);">
                        <span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:2.5px; margin-right:6px;"></span>
                        三角形 ${String.fromCharCode(9312 + i)} = 180&deg;
                    </div>
                `;
            }

            html += `
                <div class="hud-row">
                    <div class="hud-row-label">分割三角形列表</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin: 3px 0;">
                        ${triListHtml}
                    </div>
                </div>

                <div class="hud-row">
                    <div class="hud-row-label">拆分三角形个数 (n)</div>
                    <div class="expr-row">
                        <span class="expr-formula">${n} 个三角形</span>
                        <span class="expr-badge info">内部点 O</span>
                    </div>
                </div>
                
                <div class="hud-row">
                    <div class="hud-row-label">内角和代数推导与扣除</div>
                    <div class="expr-row">
                        <span class="expr-formula">三角形内角总和：${n} &times; 180&deg; = ${totalAngles}&deg;</span>
                    </div>
                    <div class="expr-row" style="color:var(--danger)">
                        <span class="expr-formula">扣除内部多余周角：- 360&deg; (圆角O)</span>
                        <span class="expr-badge warning">-360&deg;</span>
                    </div>
                    <div class="expr-row">
                        <span class="expr-formula">S = ${totalAngles}&deg; - 360&deg; = ${finalSum}&deg;</span>
                    </div>
                </div>
                
                <div class="hud-verdict-box">
                    <div class="verdict-title">S = ${n} &times; 180&deg; - 360&deg; = ${finalSum}&deg;</div>
                    <div class="verdict-desc">内部点 O 汇聚了一圈 360&deg; 的多余角，需要扣除</div>
                </div>
            `;
        } else if (currentMethod === "edge") {
            const numTris = n - 1;
            const totalAngles = numTris * 180;
            const redundant = 180;
            const finalSum = totalAngles - redundant;
            
            // 教学优化：拼接分割出的三角形彩色列表与内角和
            let triListHtml = "";
            for (let i = 0; i < numTris; i++) {
                const color = `var(--color-split-${i % 8})`;
                triListHtml += `
                    <div style="display:flex; align-items:center; font-size:11.5px; font-family:var(--font-sans); color:var(--text-secondary);">
                        <span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:2.5px; margin-right:6px;"></span>
                        三角形 ${String.fromCharCode(9312 + i)} = 180&deg;
                    </div>
                `;
            }

            html += `
                <div class="hud-row">
                    <div class="hud-row-label">分割三角形列表</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin: 3px 0;">
                        ${triListHtml}
                    </div>
                </div>

                <div class="hud-row">
                    <div class="hud-row-label">拆分三角形个数 (n - 1)</div>
                    <div class="expr-row">
                        <span class="expr-formula">${n} - 1 = ${numTris} 个三角形</span>
                        <span class="expr-badge info">边上点 P</span>
                    </div>
                </div>
                
                <div class="hud-row">
                    <div class="hud-row-label">内角和代数推导与扣除</div>
                    <div class="expr-row">
                        <span class="expr-formula">三角形内角总和：${numTris} &times; 180&deg; = ${totalAngles}&deg;</span>
                    </div>
                    <div class="expr-row" style="color:var(--danger)">
                        <span class="expr-formula">扣除边上多余平角：- 180&deg; (平角P)</span>
                        <span class="expr-badge warning">-180&deg;</span>
                    </div>
                    <div class="expr-row">
                        <span class="expr-formula">S = ${totalAngles}&deg; - 180&deg; = ${finalSum}&deg;</span>
                    </div>
                </div>
                
                <div class="hud-verdict-box">
                    <div class="verdict-title">S = (${n}-1) &times; 180&deg; - 180&deg; = ${finalSum}&deg;</div>
                    <div class="verdict-desc">边上的点 P 汇聚了一个 180&deg; 的多余平角，需要扣除</div>
                </div>
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    function updateChalkboardHUD() {
        const meta = getMethodMeta();
        const activeStage = getTeachingStage(renderValues.explodeProgress);
        const n = sideN;
        const finalSum = (n - 2) * 180;
        const stageDots = TEACHING_STAGES.map((stage, index) => `
            <span class="stage-dot ${index <= activeStage ? "active" : ""}" title="${stage.hint}">
                <span>${index + 1}</span>${stage.label}
            </span>
        `).join("");
        const triListHtml = Array.from({ length: meta.triangleCount }, (_, index) => {
            const color = `var(--color-split-${index % 8})`;
            return `
                <div class="triangle-chip">
                    <span style="background:${color};"></span>
                    <strong>${String.fromCharCode(9312 + index)}</strong>
                    <em>180°</em>
                </div>
            `;
        }).join("");
        const correctionText = meta.redundantAngle
            ? `扣 ${meta.redundantLabel} ${meta.redundantAngle}°`
            : "无需扣角";

        stepsChalkboard.innerHTML = `
            <div class="hud-single-screen">
                <div class="stage-panel">
                    <div class="stage-panel-head">
                        <span>${meta.code} · ${meta.name}</span>
                        <strong>${TEACHING_STAGES[activeStage].label}</strong>
                    </div>
                    <div class="stage-track">${stageDots}</div>
                </div>

                <div class="hud-compact-grid">
                    <div class="hud-compact-card">
                        <span class="hud-compact-label">拆分源点</span>
                        <strong>${meta.sourceLabel}</strong>
                        <span class="hud-compact-label" style="margin-top:5px;">拆分数量</span>
                        <strong>${meta.countExpr}</strong>
                    </div>
                    <div class="hud-compact-card">
                        <span class="hud-compact-label">三角形内角和</span>
                        <div class="triangle-chip-grid">${triListHtml}</div>
                    </div>
                </div>

                <div class="hud-compact-equation">
                    <span>三角形合计：${meta.rawExpr}</span>
                    <span>${correctionText}</span>
                    <strong>S = ${meta.generalFormula} = ${finalSum}°</strong>
                </div>
            </div>
        `;
        const stageTrack = stepsChalkboard.querySelector(".stage-track");
        if (stageTrack) {
            stageTrack.style.setProperty("display", "grid", "important");
            stageTrack.style.setProperty("grid-template-columns", "repeat(5, minmax(0, 1fr))", "important");
            stageTrack.style.setProperty("gap", "4px", "important");
            stageTrack.style.setProperty("width", "100%", "important");
            stageTrack.style.setProperty("overflow", "hidden", "important");
            stageTrack.querySelectorAll(".stage-dot").forEach(dot => {
                dot.style.setProperty("min-width", "0", "important");
                dot.style.setProperty("font-size", "0", "important");
                dot.querySelector("span")?.style.setProperty("font-size", "9px", "important");
            });
        }
    }

    // ==========================================================================
    // 8. 右栏说明面板内容更新
    // ==========================================================================
    function updateTheoryContent() {
        const n = sideN;
        const sumAngles = (n - 2) * 180;
        
        let text = `<p>推导说明已移入左上 HUD，右侧仅保留可操作控件。</p>`;
        
        theoryText.innerHTML = text;
        
        // 右侧只保留操作控件，解释信息统一放入 HUD。
        dynamicPointTip.style.display = "none";
    }

    // ==========================================================================
    // 9. LERP 平滑迭代回路
    // ==========================================================================
    let lerpLoopId = null;
    function updateLerp() {
        const k = 0.16;

        renderValues.sideN += (sideN - renderValues.sideN) * k;
        
        const oldProgress = renderValues.explodeProgress;
        renderValues.explodeProgress += (explodeProgress - renderValues.explodeProgress) * k;

        // 如果边数发生实际变化，重新生成正多边形
        if (Math.abs(renderValues.sideN - sideN) > 0.05) {
            // 防止高频重置
            // 采用离散值
        }

        renderSVG();
        updateHTMLOverlayAndHUD();

        // 当刚刚完美合拢（explodeProgress 归 0），触发庆祝烟花
        if (oldProgress > 0.01 && renderValues.explodeProgress <= 0.01) {
            triggerAssemblyParticles();
        }
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
    // 10. 拆解动画播放器
    // ==========================================================================
    let animationTimer = null;
    function playExplodeAnimation() {
        if (isAnimating) {
            clearInterval(animationTimer);
            isAnimating = false;
            btnPlayExplode.querySelector("span").textContent = "播放推导动画";
            return;
        }

        isAnimating = true;
        btnPlayExplode.querySelector("span").textContent = "暂停推导";

        if (explodeProgress > 0.95) {
            explodeProgress = 0.0;
        }

        animationTimer = setInterval(() => {
            explodeProgress += 0.018;
            if (explodeProgress >= 1.0) {
                explodeProgress = 1.0;
                clearInterval(animationTimer);
                isAnimating = false;
                btnPlayExplode.querySelector("span").textContent = "播放推导动画";
            }
        }, 25);
    }

    // ==========================================================================
    // 11. 画布缩放、平移与居中自适应
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
        centerY = H / 2;

        // 更新图形顶点与控制点
        generateRegularPolygon(sideN);
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
    // 12. 事件监听与绑定 (Mouse & Touch Events)
    // ==========================================================================
    
    // 边数 n 调节
    sliderSideN.addEventListener("input", (e) => {
        sideN = parseInt(e.target.value);
        generateRegularPolygon(sideN);
        updateTheoryContent();
    });

    // 推导进度滑块
    sliderExplode.addEventListener("input", (e) => {
        explodeProgress = parseFloat(e.target.value) / 100;
    });

    // 方法选择按钮
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            currentMethod = btn.getAttribute("data-method");
            document.querySelectorAll(".btn-preset").forEach(b => {
                if (b === btn) b.classList.add("active");
                else b.classList.remove("active");
            });
            explodeProgress = 0.0; // 默认还原
            updateTheoryContent();
            scheduleSystemStandard();
        });
    });

    // 控制按钮
    btnPlayExplode.addEventListener("click", playExplodeAnimation);
    btnResetState.addEventListener("click", () => {
        explodeProgress = 0.0;
        if (isAnimating) {
            clearInterval(animationTimer);
            isAnimating = false;
            btnPlayExplode.querySelector("span").textContent = "播放推导动画";
        }
        generateRegularPolygon(sideN);
        scheduleSystemStandard();
    });

    // 说明弹窗
    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (e) => {
        if (e.target === modalHelp) modalHelp.classList.remove("active");
    });

    // HUD 收缩
    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
        } else {
            hudPanel.classList.add("collapsed");
        }
        scheduleSystemStandard();
    });

    // 鼠标滚轮缩放
    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        zoomAtCenter(factor);
    }, { passive: false });

    // 鼠标拖拽平移及几何操作
    sandboxWrapper.addEventListener("mousedown", (e) => {
        const ptWrapper = e.target.closest(".geo-point-wrapper");
        if (ptWrapper && explodeProgress < 0.02) {
            // 仅在拼合状态下允许操作几何顶点或源点
            const ptId = ptWrapper.getAttribute("data-point-id");
            activeDragPoint = ptId;
            e.stopPropagation();
            return;
        }

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

            if (activeDragPoint.startsWith("V")) {
                // 拖拽多边形外部顶点 V_i
                const vIdx = parseInt(activeDragPoint.substring(1)) - 1;
                const v = vertices[vIdx];
                if (v) {
                    // 教学优化：限制顶点的角偏差和半径，确保多边形始终维持完美凸多边形形态
                    const baseAngle = v.regularAngle;
                    let dragAngle = Math.atan2(localY - centerY, localX - centerX);
                    
                    // 规整至 baseAngle 邻域以防跳跃
                    let diffAngle = dragAngle - baseAngle;
                    while (diffAngle > Math.PI) diffAngle -= 2 * Math.PI;
                    while (diffAngle < -Math.PI) diffAngle += 2 * Math.PI;

                    // 限制最大旋转夹角范围为 ±18 度 (确保凸多边形)
                    const maxDev = 18 * Math.PI / 180;
                    const finalAngle = baseAngle + Math.max(-maxDev, Math.min(maxDev, diffAngle));

                    // 限制半径大小在 80 到 200 像素之间
                    const dragRadius = Math.max(80, Math.min(200, Math.hypot(localX - centerX, localY - centerY)));

                    v.x = centerX + dragRadius * Math.cos(finalAngle);
                    v.y = centerY + dragRadius * Math.sin(finalAngle);
                    
                    // 同步更新边上的点 P
                    updateEdgePointP();
                }
            } else if (activeDragPoint === "O") {
                // 拖拽内部点 O (限制其距离质心不要太远，以防溢出多边形)
                const polyCentroid = getPolygonCentroid();
                const dist = Math.hypot(localX - polyCentroid.x, localY - polyCentroid.y);
                const maxDist = 55; // 限制拖动半径 55px

                if (dist <= maxDist) {
                    pointO.x = localX;
                    pointO.y = localY;
                } else {
                    pointO.x = polyCentroid.x + (localX - polyCentroid.x) * (maxDist / dist);
                    pointO.y = polyCentroid.y + (localY - polyCentroid.y) * (maxDist / dist);
                }
            } else if (activeDragPoint === "P") {
                // 拖拽边上的点 P，需要投影鼠标位置到边 V0-V1 上
                const v0 = vertices[0];
                const v1 = vertices[1];
                
                // 线段向量
                const dx = v1.x - v0.x;
                const dy = v1.y - v0.y;
                const lenSq = dx * dx + dy * dy;

                if (lenSq > 10) {
                    // 点到线段投影公式算 u
                    let u = ((localX - v0.x) * dx + (localY - v0.y) * dy) / lenSq;
                    // 限制 u 在 0.15 ~ 0.85 之间以防与顶点 V0, V1 重叠导致图形退化
                    edgeU = Math.max(0.15, Math.min(0.85, u));
                    updateEdgePointP();
                }
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

    // 移动端多触点支持
    let touchStartDist = 0;
    let touchStartScale = 1.0;

    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            touchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartScale = zoomScale;
        } else if (e.touches.length === 1 && explodeProgress < 0.02) {
            const touch = e.touches[0];
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                activeDragPoint = ptId;
                e.stopPropagation();
                return;
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

            if (activeDragPoint) {
                if (activeDragPoint.startsWith("V")) {
                    const vIdx = parseInt(activeDragPoint.substring(1)) - 1;
                    const v = vertices[vIdx];
                    if (v) {
                        const baseAngle = v.regularAngle;
                        let dragAngle = Math.atan2(localY - centerY, localX - centerX);
                        let diffAngle = dragAngle - baseAngle;
                        while (diffAngle > Math.PI) diffAngle -= 2 * Math.PI;
                        while (diffAngle < -Math.PI) diffAngle += 2 * Math.PI;

                        const maxDev = 18 * Math.PI / 180;
                        const finalAngle = baseAngle + Math.max(-maxDev, Math.min(maxDev, diffAngle));
                        const dragRadius = Math.max(80, Math.min(200, Math.hypot(localX - centerX, localY - centerY)));

                        v.x = centerX + dragRadius * Math.cos(finalAngle);
                        v.y = centerY + dragRadius * Math.sin(finalAngle);
                        updateEdgePointP();
                    }
                } else if (activeDragPoint === "O") {
                    const polyCentroid = getPolygonCentroid();
                    const dist = Math.hypot(localX - polyCentroid.x, localY - polyCentroid.y);
                    const maxDist = 55;
                    if (dist <= maxDist) {
                        pointO.x = localX;
                        pointO.y = localY;
                    } else {
                        pointO.x = polyCentroid.x + (localX - polyCentroid.x) * (maxDist / dist);
                        pointO.y = polyCentroid.y + (localY - polyCentroid.y) * (maxDist / dist);
                    }
                } else if (activeDragPoint === "P") {
                    const v0 = vertices[0];
                    const v1 = vertices[1];
                    const dx = v1.x - v0.x;
                    const dy = v1.y - v0.y;
                    const lenSq = dx * dx + dy * dy;
                    if (lenSq > 10) {
                        let u = ((localX - v0.x) * dx + (localY - v0.y) * dy) / lenSq;
                        edgeU = Math.max(0.15, Math.min(0.85, u));
                        updateEdgePointP();
                    }
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

    sandboxWrapper.addEventListener("touchend", () => {
        activeDragPoint = null;
        isPanning = false;
        touchStartDist = 0;
    });

    // ==========================================================================
    // 13. 初始化加载自适应居中
    // ==========================================================================
    window.addEventListener("resize", centerModel);
    
    setTimeout(() => {
        centerModel();
        updateTheoryContent();
    }, 100);
});

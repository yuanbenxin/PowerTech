document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. DOM 节点引用
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-chalkboard");
    const slidersContainer = document.getElementById("sliders-container");
    const presetButtonsContainer = document.getElementById("preset-buttons");
    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");
    const btnResetState = document.getElementById("btn-reset-state");
    const hudToggleBtn = document.getElementById("btn-hud-toggle");
    const hudPanel = document.getElementById("hud-panel");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");
    const butterflyModeSelector = document.getElementById("butterfly-mode-selector");
    const areaLabel = name => `S<sub>${name}</sub>`;
    const heightLabel = name => `H<sub>${name}</sub>`;
    const smallHeightLabel = name => `h<sub>${name}</sub>`;
    const squareUnit = `px<sup>2</sup>`;

    // ==========================================================================
    // 2. 状态变量与新交互选项
    // ==========================================================================
    let currentScene = "swallowtail"; // swallowtail | butterfly
    let butterflyType = "trapezoid";   // trapezoid | general
    let zoomScale = 1.0;
    let isHudExpanded = false;
    let flowOffset = 0; // 动画偏移，用于蝴蝶翅膀呼吸

    // 教学辅助状态
    let showHeights = false;
    let proofStep = 0; // 0: 自由探索, 1, 2, 3: 分步引导步骤
    let autoDemoTimer = null;
    let autoDemoIndex = 0;
    let lastTriggeredRatio = null; // 防抖，用于金币/完美比例粒子触发

    // 拖拽相关
    let activeNode = null;
    let dragOffset = { x: 0, y: 0 };

    // 几何顶点状态 (初始化会在 render 之前被 getCenterPosition 校正)
    let points = {
        // 燕尾点
        swallowtail: {
            A: { x: 0, y: 0 },
            B: { x: 0, y: 0 },
            C: { x: 0, y: 0 },
            P: { x: 0, y: 0 }
        },
        // 蝴蝶点
        butterfly: {
            A: { x: 0, y: 0 },
            B: { x: 0, y: 0 },
            C: { x: 0, y: 0 },
            D: { x: 0, y: 0 }
        }
    };

    // ==========================================================================
    // 3. 几何运算辅助函数
    // ==========================================================================
    
    // 计算点 P 到线段 a-b 的投影足点 (用于垂线绘制)
    function getProjectionPoint(p, a, b) {
        const ab = { x: b.x - a.x, y: b.y - a.y };
        const ap = { x: p.x - a.x, y: p.y - a.y };
        const abLenSq = ab.x * ab.x + ab.y * ab.y;
        if (abLenSq < 1e-4) return a;
        const t = (ap.x * ab.x + ap.y * ab.y) / abLenSq;
        return { x: a.x + t * ab.x, y: a.y + t * ab.y };
    }
    
    // 两点间距离
    function dist(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    // 两条线段 (p1-p2) 与 (q1-q2) 求交点
    function getLineIntersection(p1, p2, q1, q2) {
        const denom = (p1.x - p2.x) * (q1.y - q2.y) - (p1.y - p2.y) * (q1.x - q2.x);
        if (Math.abs(denom) < 1e-5) return null; // 平行或共线
        
        const px = ((p1.x * p2.y - p1.y * p2.x) * (q1.x - q2.x) - (p1.x - p2.x) * (q1.x * q2.y - q1.y * q2.x)) / denom;
        const py = ((p1.x * p2.y - p1.y * p2.x) * (q1.y - q2.y) - (p1.y - p2.y) * (q1.x * q2.y - q1.y * q2.x)) / denom;
        return { x: px, y: py };
    }

    // 鞋带公式计算三角形面积 (S)
    function getTriangleArea(p1, p2, p3) {
        return 0.5 * Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
    }

    // 限制动点 P 必须在三角形 A-B-C 内部 (重心坐标约束)
    function clampPInsideTriangle(p, a, b, c) {
        const denom = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        if (Math.abs(denom) < 1e-4) return p;

        let u = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / denom;
        let v = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / denom;
        let w = 1 - u - v;

        // 设定边界安全距离 (5% 缓冲，防止拉到顶点或者边上导致除以 0)
        const margin = 0.05;
        let changed = false;
        
        if (u < margin) { u = margin; changed = true; }
        if (v < margin) { v = margin; changed = true; }
        if (w < margin) { w = margin; changed = true; }

        if (changed) {
            const sum = u + v + w;
            u /= sum;
            v /= sum;
            w /= sum;
            return {
                x: u * a.x + v * b.x + w * c.x,
                y: u * a.y + v * b.y + w * c.y
            };
        }
        return p;
    }

    // 获取画布参考中心点
    function getCenterPosition() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;
        const safeCenterX = W * 0.50;
        const safeCenterY = H * 0.50;

        return { x: safeCenterX, y: safeCenterY };
    }

    // 初始化/重置点位数据
    function initPoints(scene) {
        const center = getCenterPosition();
        
        if (scene === "swallowtail") {
            points.swallowtail.A = { x: center.x, y: center.y - 140 };
            points.swallowtail.B = { x: center.x - 170, y: center.y + 110 };
            points.swallowtail.C = { x: center.x + 170, y: center.y + 110 };
            points.swallowtail.P = { x: center.x + 15, y: center.y + 20 };
        } else if (scene === "butterfly") {
            // 对称梯形初始化
            points.butterfly.A = { x: center.x - 100, y: center.y - 100 };
            points.butterfly.D = { x: center.x + 100, y: center.y - 100 };
            points.butterfly.B = { x: center.x - 170, y: center.y + 110 };
            points.butterfly.C = { x: center.x + 170, y: center.y + 110 };
        }
    }

    // 黄金比例粒子星花生成器
    function createSparkles(x, y) {
        const rect = sandboxSvg.getBoundingClientRect();
        const wrapperRect = sandboxWrapper.getBoundingClientRect();
        // 缩放坐标换算到 wrapper 空间
        const px = x * zoomScale + rect.left - wrapperRect.left;
        const py = y * zoomScale + rect.top - wrapperRect.top;

        for (let i = 0; i < 15; i++) {
            const p = document.createElement("div");
            p.className = "sparkle-particle";
            p.style.left = `${px}px`;
            p.style.top = `${py}px`;
            const angle = Math.random() * 2 * Math.PI;
            const speed = 25 + Math.random() * 70;
            p.style.setProperty("--dx", `${Math.cos(angle) * speed}px`);
            p.style.setProperty("--dy", `${Math.sin(angle) * speed}px`);
            sandboxWrapper.appendChild(p);
            setTimeout(() => p.remove(), 800);
        }
    }

    // 检查完美比例并触发粒子 (防抖机制)
    function checkPerfectRatioAndSparkle(ratio, cx, cy) {
        const perfects = [
            { val: 1.0, text: "1:1 对称比" },
            { val: 0.5, text: "1:2 比例" },
            { val: 2.0, text: "2:1 比例" },
            { val: 1.5, text: "3:2 比例" },
            { val: 0.6667, text: "2:3 比例" },
            { val: 3.0, text: "3:1 比例" },
            { val: 0.3333, text: "1:3 比例" }
        ];
        
        for (let pref of perfects) {
            if (Math.abs(ratio - pref.val) < 0.015) {
                if (lastTriggeredRatio !== pref.text) {
                    lastTriggeredRatio = pref.text;
                    createSparkles(cx, cy);
                }
                return pref.text;
            }
        }
        lastTriggeredRatio = null;
        return null;
    }

    // ==========================================================================
    // 4. 全局 Ticker 粒子流动循环
    // ==========================================================================
    function updateFrame() {
        flowOffset = (flowOffset + 1.2) % 60;
        
        // 蝴蝶定理下实时渲染翅膀微微震颤动效
        if (currentScene === "butterfly") {
            const wings = document.querySelector(".butterfly-wing-path");
            if (wings) {
                const isTrapezoid = butterflyType === "trapezoid";
                // 梯形模式下翅膀震动频率稍有不同
                const flapSpeed = isTrapezoid ? 0.08 : 0.05;
                const scaleX = 1 - Math.abs(Math.sin(flowOffset * flapSpeed)) * 0.24;
                const scaleY = 1 - Math.abs(Math.cos(flowOffset * flapSpeed)) * 0.06;
                wings.style.transform = `scale(${scaleX}, ${scaleY})`;
            }
        }
        requestAnimationFrame(updateFrame);
    }

    // ==========================================================================
    // 5. SVG 渲染逻辑 (注入步骤高亮与辅助线)
    // ==========================================================================
    function renderSVG() {
        let drawHtml = "";
        
        // 注入渐变和滤镜定义
        drawHtml += `
            <defs>
                <!-- 蝴蝶黄铜高光渐变 -->
                <linearGradient id="brass-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="50%" stop-color="#fbbf24" />
                    <stop offset="100%" stop-color="#b45309" />
                </linearGradient>
                <!-- 天蓝渐变 (底/下侧) -->
                <linearGradient id="blue-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#a5f3fc" stop-opacity="0.68" />
                    <stop offset="52%" stop-color="#38bdf8" stop-opacity="0.48" />
                    <stop offset="100%" stop-color="#2563eb" stop-opacity="0.26" />
                </linearGradient>
                <!-- 珊瑚红渐变 (上/侧翼) -->
                <linearGradient id="red-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#fda4af" stop-opacity="0.66" />
                    <stop offset="52%" stop-color="#fb7185" stop-opacity="0.48" />
                    <stop offset="100%" stop-color="#e11d48" stop-opacity="0.24" />
                </linearGradient>
                <linearGradient id="green-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#6ee7b7" stop-opacity="0.66" />
                    <stop offset="52%" stop-color="#10b981" stop-opacity="0.48" />
                    <stop offset="100%" stop-color="#047857" stop-opacity="0.24" />
                </linearGradient>
                <linearGradient id="amber-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#fde68a" stop-opacity="0.72" />
                    <stop offset="52%" stop-color="#f59e0b" stop-opacity="0.5" />
                    <stop offset="100%" stop-color="#b45309" stop-opacity="0.28" />
                </linearGradient>
            </defs>
        `;

        if (currentScene === "swallowtail") {
            const { A, B, C, P } = points.swallowtail;

            // 计算交点 D, E, F
            const D = getLineIntersection(A, P, B, C); // AP 延长交 BC
            const E = getLineIntersection(B, P, C, A); // BP 延长交 CA
            const F = getLineIntersection(C, P, A, B); // CP 延长交 AB

            if (D && E && F) {
                // 根据分步证明引导，判断不同色块填充的激活类名
                const clsPAB = (proofStep === 0 || proofStep === 3) ? "" : "step-inactive-shape";
                const clsPAC = (proofStep === 0 || proofStep === 3) ? "" : "step-inactive-shape";
                const clsPBC = (proofStep === 0) ? "" : "step-inactive-shape";

                drawHtml += `
                    <!-- 正常填充 (两翼) -->
                    <polygon points="${P.x},${P.y} ${A.x},${A.y} ${B.x},${B.y}" fill="url(#red-grad)" stroke="#be123c" stroke-width="2.2" stroke-linejoin="round" class="${clsPAB}"></polygon>
                    <polygon points="${P.x},${P.y} ${A.x},${A.y} ${C.x},${C.y}" fill="url(#blue-grad)" stroke="#1d4ed8" stroke-width="2.2" stroke-linejoin="round" class="${clsPAC}"></polygon>
                    <polygon points="${P.x},${P.y} ${B.x},${B.y} ${C.x},${C.y}" fill="url(#green-grad)" fill-opacity="0.42" stroke="#047857" stroke-width="2.2" stroke-linejoin="round" class="${clsPBC}"></polygon>
                `;

                // 注入步骤讲解的高亮覆盖物
                if (proofStep === 1) {
                    // 步骤 1: 探究 S_ABD 与 S_ACD (共高)
                    drawHtml += `
                        <polygon points="${A.x},${A.y} ${B.x},${B.y} ${D.x},${D.y}" class="step-highlight-shape" style="fill:url(#amber-grad) !important; stroke:#b45309 !important;"></polygon>
                        <polygon points="${A.x},${A.y} ${C.x},${C.y} ${D.x},${D.y}" class="step-highlight-shape" style="fill:url(#blue-grad) !important; stroke:#1d4ed8 !important;"></polygon>
                    `;
                } else if (proofStep === 2) {
                    // 步骤 2: 探究 S_PBD 与 S_PCD
                    drawHtml += `
                        <polygon points="${P.x},${P.y} ${B.x},${B.y} ${D.x},${D.y}" class="step-highlight-shape" style="fill:url(#amber-grad) !important; stroke:#b45309 !important;"></polygon>
                        <polygon points="${P.x},${P.y} ${C.x},${C.y} ${D.x},${D.y}" class="step-highlight-shape" style="fill:url(#blue-grad) !important; stroke:#1d4ed8 !important;"></polygon>
                    `;
                } else if (proofStep === 3) {
                    // 步骤 3: 左右作差
                    drawHtml += `
                        <polygon points="${P.x},${P.y} ${A.x},${A.y} ${B.x},${B.y}" class="step-highlight-shape" style="fill:url(#amber-grad) !important; stroke:#b45309 !important; animation-duration: 2.2s;"></polygon>
                        <polygon points="${P.x},${P.y} ${A.x},${A.y} ${C.x},${C.y}" class="step-highlight-shape" style="fill:url(#blue-grad) !important; stroke:#1d4ed8 !important; animation-duration: 2.2s;"></polygon>
                    `;
                }

                // 突出底边分段高光线
                drawHtml += `
                    <line x1="${B.x}" y1="${B.y}" x2="${D.x}" y2="${D.y}" stroke="#e11d48" stroke-width="5" stroke-linecap="round" class="${proofStep === 2 || proofStep === 0 ? '' : 'step-inactive-shape'}"></line>
                    <line x1="${C.x}" y1="${C.y}" x2="${D.x}" y2="${D.y}" stroke="#2563eb" stroke-width="5" stroke-linecap="round" class="${proofStep === 2 || proofStep === 0 ? '' : 'step-inactive-shape'}"></line>
                    
                    <!-- 内部对角射线 -->
                    <line x1="${A.x}" y1="${A.y}" x2="${D.x}" y2="${D.y}" stroke="#94a3b8" stroke-width="2.2" stroke-dasharray="4,4" stroke-linecap="round"></line>
                    <line x1="${B.x}" y1="${B.y}" x2="${E.x}" y2="${E.y}" stroke="#64748b" stroke-width="2.2" stroke-dasharray="4,4" stroke-linecap="round" class="${proofStep === 0 ? '' : 'step-inactive-shape'}"></line>
                    <line x1="${C.x}" y1="${C.y}" x2="${F.x}" y2="${F.y}" stroke="#64748b" stroke-width="2.2" stroke-dasharray="4,4" stroke-linecap="round" class="${proofStep === 0 ? '' : 'step-inactive-shape'}"></line>
                `;

                // 辅助高度垂线
                if (showHeights || proofStep === 2) {
                    const HA = getProjectionPoint(A, B, C);
                    const HP = getProjectionPoint(P, B, C);
                    drawHtml += `
                        <!-- A 到底垂线 -->
                        <line x1="${A.x}" y1="${A.y}" x2="${HA.x}" y2="${HA.y}" stroke="#0f766e" stroke-width="1.9" stroke-dasharray="3,3"></line>
                        <circle cx="${HA.x}" cy="${HA.y}" r="3.5" fill="#0f766e"></circle>
                        <!-- P 到底垂线 -->
                        <line x1="${P.x}" y1="${P.y}" x2="${HP.x}" y2="${HP.y}" stroke="#e11d48" stroke-width="1.9" stroke-dasharray="3,3"></line>
                        <circle cx="${HP.x}" cy="${HP.y}" r="3.5" fill="#e11d48"></circle>
                    `;
                }

                // 交点标记
                drawHtml += `
                    <circle cx="${D.x}" cy="${D.y}" r="5.3" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"></circle>
                    <circle cx="${E.x}" cy="${E.y}" r="5.3" fill="#334155" stroke="#ffffff" stroke-width="1.5" class="${proofStep === 0 ? '' : 'step-inactive-shape'}"></circle>
                    <circle cx="${F.x}" cy="${F.y}" r="5.3" fill="#334155" stroke="#ffffff" stroke-width="1.5" class="${proofStep === 0 ? '' : 'step-inactive-shape'}"></circle>
                `;
            }

            // 大三角形外框
            drawHtml += `
                <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}" fill="none" stroke="#334155" stroke-width="2.5" stroke-linejoin="round"></polygon>
            `;

            // 控制手柄
            drawHtml += `
                <circle cx="${A.x}" cy="${A.y}" r="7.5" class="drag-handle" data-point="A"></circle>
                <circle cx="${B.x}" cy="${B.y}" r="7.5" class="drag-handle" data-point="B"></circle>
                <circle cx="${C.x}" cy="${C.y}" r="7.5" class="drag-handle" data-point="C"></circle>
                <circle cx="${P.x}" cy="${P.y}" r="8.5" class="drag-handle drag-handle-inner" data-point="P"></circle>
            `;

        } else if (currentScene === "butterfly") {
            const { A, B, C, D } = points.butterfly;
            const O = getLineIntersection(A, C, B, D);

            if (O) {
                const s1 = getTriangleArea(A, O, D);
                const s2 = getTriangleArea(A, O, B);
                const s3 = getTriangleArea(B, O, C);
                const s4 = getTriangleArea(C, O, D);

                const isTrapezoid = butterflyType === "trapezoid";
                const isAlmostEqual = Math.abs(s2 - s4) < 1.0;

                // 判断高亮和透明类
                const cls1 = (proofStep === 0 || proofStep === 3) ? "" : "step-inactive-shape";
                const cls3 = (proofStep === 0 || proofStep === 3) ? "" : "step-inactive-shape";
                const cls2 = (proofStep === 0 || proofStep === 2) ? "" : "step-inactive-shape";
                const cls4 = (proofStep === 0 || proofStep === 2) ? "" : "step-inactive-shape";

                drawHtml += `
                    <!-- 正常填充 -->
                    <polygon points="${A.x},${A.y} ${O.x},${O.y} ${D.x},${D.y}" fill="url(#red-grad)" class="${cls1}"></polygon>
                    <polygon points="${B.x},${B.y} ${O.x},${O.y} ${C.x},${C.y}" fill="url(#blue-grad)" class="${cls3}"></polygon>
                    <polygon points="${A.x},${A.y} ${O.x},${O.y} ${B.x},${B.y}" fill="url(#brass-gold)" fill-opacity="0.16" class="${cls2}"></polygon>
                    <polygon points="${C.x},${C.y} ${O.x},${O.y} ${D.x},${D.y}" fill="url(#brass-gold)" fill-opacity="0.16" class="${cls4}"></polygon>
                `;

                // 引导步骤高亮
                if (proofStep === 1) {
                    // 同底等高大三角形 S_ABC 和 S_DBC
                    drawHtml += `
                        <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}" class="step-highlight-shape" style="fill:var(--color-blue-light) !important; stroke:var(--color-blue) !important;"></polygon>
                        <polygon points="${D.x},${D.y} ${B.x},${B.y} ${C.x},${C.y}" class="step-highlight-shape" style="fill:var(--color-gold-light) !important; stroke:var(--color-gold) !important;"></polygon>
                    `;
                } else if (proofStep === 2) {
                    // 两翼相等 S_AOB 与 S_COD
                    drawHtml += `
                        <polygon points="${A.x},${A.y} ${O.x},${O.y} ${B.x},${B.y}" class="step-highlight-shape" style="fill:url(#brass-gold) !important; stroke:var(--color-gold) !important; animation-duration: 2s;"></polygon>
                        <polygon points="${C.x},${C.y} ${O.x},${O.y} ${D.x},${D.y}" class="step-highlight-shape" style="fill:url(#brass-gold) !important; stroke:var(--color-gold) !important; animation-duration: 2s;"></polygon>
                    `;
                } else if (proofStep === 3) {
                    // 对顶相似 S_AOD 与 S_COB
                    drawHtml += `
                        <polygon points="${A.x},${A.y} ${O.x},${O.y} ${D.x},${D.y}" class="step-highlight-shape" style="fill:var(--color-danger-light) !important; stroke:var(--color-danger) !important;"></polygon>
                        <polygon points="${B.x},${B.y} ${O.x},${O.y} ${C.x},${C.y}" class="step-highlight-shape" style="fill:var(--color-blue-light) !important; stroke:var(--color-blue) !important;"></polygon>
                    `;
                }

                // 蝴蝶翅膀图绘覆盖
                const leftWingD = `M ${O.x} ${O.y} C ${A.x - 10} ${A.y + 10} ${B.x - 10} ${B.y - 10} ${O.x} ${O.y}`;
                const rightWingD = `M ${O.x} ${O.y} C ${D.x + 10} ${D.y + 10} ${C.x + 10} ${C.y - 10} ${O.x} ${O.y}`;
                const flapClass = isAlmostEqual ? "butterfly-wing-path butterfly-wing-path-equal" : "butterfly-wing-path";
                const wingOpacity = (proofStep === 0 || proofStep === 2) ? "" : "step-inactive-shape";

                drawHtml += `
                    <g style="transform-origin: ${O.x}px ${O.y}px;" class="${wingOpacity}">
                        <path d="${leftWingD}" class="${flapClass}"></path>
                        <path d="${rightWingD}" class="${flapClass}"></path>
                    </g>
                `;

                // 辅助高度垂线段
                if (showHeights || proofStep === 3) {
                    const H1 = getProjectionPoint(O, A, D);
                    const H2 = getProjectionPoint(O, B, C);
                    drawHtml += `
                        <!-- O 向上高 -->
                        <line x1="${O.x}" y1="${O.y}" x2="${H1.x}" y2="${H1.y}" stroke="var(--color-danger)" stroke-width="1.8" stroke-dasharray="3,3"></line>
                        <circle cx="${H1.x}" cy="${H1.y}" r="3" fill="var(--color-danger)"></circle>
                        <!-- O 向下高 -->
                        <line x1="${O.x}" y1="${O.y}" x2="${H2.x}" y2="${H2.y}" stroke="var(--color-blue)" stroke-width="1.8" stroke-dasharray="3,3"></line>
                        <circle cx="${H2.x}" cy="${H2.y}" r="3" fill="var(--color-blue)"></circle>
                    `;
                }

                // 轮廓和对角线
                drawHtml += `
                <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}" fill="none" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"></polygon>
                <line x1="${A.x}" y1="${A.y}" x2="${D.x}" y2="${D.y}" stroke="${isTrapezoid ? '#10b981' : '#64748b'}" stroke-width="${isTrapezoid ? 4.2 : 2.5}"></line>
                <line x1="${B.x}" y1="${B.y}" x2="${C.x}" y2="${C.y}" stroke="${isTrapezoid ? '#10b981' : '#64748b'}" stroke-width="${isTrapezoid ? 4.2 : 2.5}"></line>
                <line x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}" stroke="#475569" stroke-width="2.1" stroke-dasharray="3,3" class="${proofStep === 0 ? '' : 'step-inactive-shape'}"></line>
                <line x1="${B.x}" y1="${B.y}" x2="${D.x}" y2="${D.y}" stroke="#475569" stroke-width="2.1" stroke-dasharray="3,3" class="${proofStep === 0 ? '' : 'step-inactive-shape'}"></line>
                <circle cx="${O.x}" cy="${O.y}" r="5.8" fill="#b45309" stroke="#ffffff" stroke-width="1.6"></circle>
                `;
            }

            // 控制顶点
            drawHtml += `
                <circle cx="${A.x}" cy="${A.y}" r="7.5" class="drag-handle" data-point="A"></circle>
                <circle cx="${B.x}" cy="${B.y}" r="7.5" class="drag-handle" data-point="B"></circle>
                <circle cx="${C.x}" cy="${C.y}" r="7.5" class="drag-handle" data-point="C"></circle>
                <circle cx="${D.x}" cy="${D.y}" r="7.5" class="drag-handle" data-point="D"></circle>
            `;
        }

        sandboxSvg.innerHTML = drawHtml;
        bindHandleEvents();
    }

    // ==========================================================================
    // 6. HTML 浮动面板与文字覆面渲染
    // ==========================================================================
    function renderHTMLOverlay() {
        let html = "";
        
        if (currentScene === "swallowtail") {
            const { A, B, C, P } = points.swallowtail;
            const D = getLineIntersection(A, P, B, C);
            const E = getLineIntersection(B, P, C, A);
            const F = getLineIntersection(C, P, A, B);

            // 顶点字母标签
            html += `<div class="floating-label vertex-label" style="left:${A.x}px; top:${A.y - 18}px;">A</div>`;
            html += `<div class="floating-label vertex-label" style="left:${B.x - 14}px; top:${B.y}px;">B</div>`;
            html += `<div class="floating-label vertex-label" style="left:${C.x + 14}px; top:${C.y}px;">C</div>`;
            html += `<div class="floating-label vertex-label vertex-danger" style="left:${P.x + 18}px; top:${P.y + 22}px;">P</div>`;

            if (D && E && F) {
                const auxiliaryLabelClass = proofStep === 0 ? "" : " step-inactive-shape";
                html += `<div class="floating-label vertex-label" style="left:${D.x}px; top:${D.y + 16}px;">D</div>`;
                html += `<div class="floating-label vertex-label${auxiliaryLabelClass}" style="left:${E.x + 12}px; top:${E.y - 10}px;">E</div>`;
                html += `<div class="floating-label vertex-label${auxiliaryLabelClass}" style="left:${F.x - 12}px; top:${F.y - 10}px;">F</div>`;

                const sPAB = getTriangleArea(P, A, B);
                const sPAC = getTriangleArea(P, A, C);
                
                const cPAB = { x: (P.x + A.x + B.x)/3, y: (P.y + A.y + B.y)/3 };
                const cPAC = { x: (P.x + A.x + C.x)/3, y: (P.y + A.y + C.y)/3 };

                // 在第 3 步或自由探索时，渲染两翼面积悬浮卡片
                if (proofStep === 0 || proofStep === 3) {
                    html += `<div class="floating-area-value color-a" style="left:${cPAB.x - 20}px; top:${cPAB.y - 16}px;">${areaLabel("PAB")} = ${sPAB.toFixed(0)}</div>`;
                    html += `<div class="floating-area-value color-b" style="left:${cPAC.x + 20}px; top:${cPAC.y - 16}px;">${areaLabel("PAC")} = ${sPAC.toFixed(0)}</div>`;
                }

                // 如果是第 1 步，渲染大底三角形面积
                if (proofStep === 1) {
                    const sABD = getTriangleArea(A, B, D);
                    const sACD = getTriangleArea(A, C, D);
                    const cABD = { x: (A.x + B.x + D.x)/3, y: (A.y + B.y + D.y)/3 };
                    const cACD = { x: (A.x + C.x + D.x)/3, y: (A.y + C.y + D.y)/3 };
                    html += `<div class="floating-area-value color-a" style="left:${cABD.x - 24}px; top:${cABD.y - 12}px;">${areaLabel("ABD")} = ${sABD.toFixed(0)}</div>`;
                    html += `<div class="floating-area-value color-b" style="left:${cACD.x + 24}px; top:${cACD.y - 12}px;">${areaLabel("ACD")} = ${sACD.toFixed(0)}</div>`;
                }

                // 如果是第 2 步，渲染小底座面积
                if (proofStep === 2) {
                    const sPBD = getTriangleArea(P, B, D);
                    const sPCD = getTriangleArea(P, C, D);
                    const cPBD = { x: (P.x + B.x + D.x)/3, y: (P.y + B.y + D.y)/3 };
                    const cPCD = { x: (P.x + C.x + D.x)/3, y: (P.y + C.y + D.y)/3 };
                    html += `<div class="floating-area-value color-a" style="left:${cPBD.x - 22}px; top:${cPBD.y + 14}px;">${areaLabel("PBD")} = ${sPBD.toFixed(0)}</div>`;
                    html += `<div class="floating-area-value color-b" style="left:${cPCD.x + 22}px; top:${cPCD.y + 14}px;">${areaLabel("PCD")} = ${sPCD.toFixed(0)}</div>`;
                }

                // 辅助高数值标注 (厘米制转换：高度/10)
                if (showHeights) {
                    const HA = getProjectionPoint(A, B, C);
                    const HP = getProjectionPoint(P, B, C);
                    const midA = { x: (A.x + HA.x)/2, y: (A.y + HA.y)/2 };
                    const midP = { x: (P.x + HP.x)/2, y: (P.y + HP.y)/2 };
                    const valA = (dist(A, HA) / 10).toFixed(1);
                    const valP = (dist(P, HP) / 10).toFixed(1);
                    html += `<div class="altitude-ruler-tag" style="position:absolute; left:${midA.x + 12}px; top:${midA.y}px; transform:translate(-50%, -50%);">${heightLabel("A")} = ${valA} cm</div>`;
                    html += `<div class="altitude-ruler-tag" style="position:absolute; left:${midP.x - 12}px; top:${midP.y}px; transform:translate(-50%, -50%); background:#b91c1c;">${heightLabel("P")} = ${valP} cm</div>`;
                }

                // 完美比例彩蛋气泡
                const ratio = sPAB / sPAC;
                const matchText = checkPerfectRatioAndSparkle(ratio, P.x, P.y);
                if (matchText) {
                    html += `<div class="perfect-ratio-badge" style="position:absolute; left:${P.x}px; top:${P.y - 36}px; transform:translate(-50%, -50%);">🏆 ${matchText}</div>`;
                }
            }

        } else if (currentScene === "butterfly") {
            const { A, B, C, D } = points.butterfly;
            const O = getLineIntersection(A, C, B, D);

            html += `<div class="floating-label vertex-label" style="left:${A.x}px; top:${A.y - 16}px;">A</div>`;
            html += `<div class="floating-label vertex-label" style="left:${B.x - 14}px; top:${B.y + 8}px;">B</div>`;
            html += `<div class="floating-label vertex-label" style="left:${C.x + 14}px; top:${C.y + 8}px;">C</div>`;
            html += `<div class="floating-label vertex-label" style="left:${D.x}px; top:${D.y - 16}px;">D</div>`;

            if (O) {
                html += `<div class="floating-label vertex-label vertex-gold" style="left:${O.x}px; top:${O.y - 18}px;">O</div>`;

                const s1 = getTriangleArea(A, O, D); // S1
                const s2 = getTriangleArea(A, O, B); // S2
                const s3 = getTriangleArea(B, O, C); // S3
                const s4 = getTriangleArea(C, O, D); // S4

                const c1 = { x: (A.x + O.x + D.x)/3, y: (A.y + O.y + D.y)/3 };
                const c2 = { x: (A.x + O.x + B.x)/3, y: (A.y + O.y + B.y)/3 };
                const c3 = { x: (B.x + O.x + C.x)/3, y: (B.y + O.y + C.y)/3 };
                const c4 = { x: (C.x + O.x + D.x)/3, y: (C.y + O.y + D.y)/3 };

                // 根据步骤高亮渲染对应悬浮卡片
                if (proofStep === 0 || proofStep === 3) {
                    html += `<div class="floating-area-value color-a" style="left:${c1.x - 26}px; top:${c1.y - 18}px;">${areaLabel("1")} = ${s1.toFixed(0)}</div>`;
                    html += `<div class="floating-area-value color-b" style="left:${c3.x + 26}px; top:${c3.y + 18}px;">${areaLabel("3")} = ${s3.toFixed(0)}</div>`;
                }
                if (proofStep === 0 || proofStep === 2) {
                    html += `<div class="floating-area-value color-gold" style="left:${c2.x - 26}px; top:${c2.y + 18}px;">${areaLabel("2")} = ${s2.toFixed(0)}</div>`;
                    html += `<div class="floating-area-value color-gold" style="left:${c4.x + 26}px; top:${c4.y - 18}px;">${areaLabel("4")} = ${s4.toFixed(0)}</div>`;
                }

                // 步骤 1 同底等高面积卡片
                if (proofStep === 1) {
                    const sABC = getTriangleArea(A, B, C);
                    const sDBC = getTriangleArea(D, B, C);
                    const cABC = { x: (A.x + B.x + C.x)/3, y: (A.y + B.y + C.y)/3 };
                    const cDBC = { x: (D.x + B.x + C.x)/3, y: (D.y + B.y + C.y)/3 };
                    html += `<div class="floating-area-value color-b" style="left:${cABC.x - 28}px; top:${cABC.y + 16}px;">${areaLabel("ABC")} = ${sABC.toFixed(0)}</div>`;
                    html += `<div class="floating-area-value color-gold" style="left:${cDBC.x + 28}px; top:${cDBC.y - 16}px;">${areaLabel("DBC")} = ${sDBC.toFixed(0)}</div>`;
                }

                // 辅助高度数值标注
                if (showHeights) {
                    const H1 = getProjectionPoint(O, A, D);
                    const H2 = getProjectionPoint(O, B, C);
                    const mid1 = { x: (O.x + H1.x)/2, y: (O.y + H1.y)/2 };
                    const mid2 = { x: (O.x + H2.x)/2, y: (O.y + H2.y)/2 };
                    const val1 = (dist(O, H1) / 10).toFixed(1);
                    const val2 = (dist(O, H2) / 10).toFixed(1);
                    html += `<div class="altitude-ruler-tag" style="position:absolute; left:${mid1.x + 20}px; top:${mid1.y}px; transform:translate(-50%, -50%);">${smallHeightLabel("1")} = ${val1} cm</div>`;
                    html += `<div class="altitude-ruler-tag" style="position:absolute; left:${mid2.x + 20}px; top:${mid2.y}px; transform:translate(-50%, -50%); background:#1d4ed8;">${smallHeightLabel("2")} = ${val2} cm</div>`;
                }

                // 完美比例彩蛋气泡 (在对角交点 O 正下方悬浮)
                const isTrapezoid = butterflyType === "trapezoid";
                if (isTrapezoid) {
                    const ratio = dist(A, D) / dist(B, C);
                    const matchText = checkPerfectRatioAndSparkle(ratio, O.x, O.y);
                    if (matchText) {
                        html += `<div class="perfect-ratio-badge" style="position:absolute; left:${O.x}px; top:${O.y + 30}px; transform:translate(-50%, -50%);">🏆 底边比 ${matchText}</div>`;
                    }
                }
            }
        }

        htmlOverlay.innerHTML = html;
    }

    // ==========================================================================
    // 7. HUD 板书代数关系渲染 (响应步骤状态机)
    // ==========================================================================
    function ratioText(value) {
        if (!Number.isFinite(value)) return "--";
        return value.toFixed(3);
    }

    function boardSection(title, body, className = "") {
        return `
            <section class="board-section ${className}">
                <div class="board-section-title">${title}</div>
                <div class="board-section-body">${body}</div>
            </section>
        `;
    }

    function boardChips(items) {
        return `<div class="board-chip-row">${items.map(item => `<span class="board-chip">${item}</span>`).join("")}</div>`;
    }

    function getStepTitle(sceneId, step) {
        const titles = {
            swallowtail: ["自由探索", "识别结构", "找同高", "锁定结论"],
            butterfly: ["自由探索", "分区编号", "对顶关系", "模型结论"]
        };
        return (titles[sceneId] || titles.swallowtail)[step] || "自由探索";
    }

    function renderHUDChalkboard() {
        let html = "";
        
        if (currentScene === "swallowtail") {
            const { A, B, C, P } = points.swallowtail;
            const D = getLineIntersection(A, P, B, C);
            const sPAB = getTriangleArea(P, A, B);
            const sPAC = getTriangleArea(P, A, C);
            if (D) {
                const lenBD = dist(B, D);
                const lenCD = dist(C, D);
                const areaRatio = sPAB / sPAC;
                const segmentRatio = lenBD / lenCD;
                const sABD = getTriangleArea(A, B, D);
                const sACD = getTriangleArea(A, C, D);
                const sPBD = getTriangleArea(P, B, D);
                const sPCD = getTriangleArea(P, C, D);
                const stepCopy = [
                    "三角形内点 P，AP 交底边 BC 于 D。",
                    "先看两翼：左翼 △PAB，右翼 △PAC。",
                    "同底线 BC 上作高，面积比转成 BD:CD。",
                    "大三角形同高、小三角形同高，作差后锁定燕尾结论。"
                ][proofStep] || "";

                html = `
                    ${boardSection(`燕尾定理 · ${getStepTitle("swallowtail", proofStep)}`, stepCopy)}
                    ${boardSection("当前结论", `
                        <div class="board-formula">${areaLabel("PAB")} : ${areaLabel("PAC")} = BD : CD</div>
                        ${boardChips([
                            `左翼 ${sPAB.toFixed(0)}`,
                            `右翼 ${sPAC.toFixed(0)}`,
                            `BD/CD ${ratioText(segmentRatio)}`
                        ])}
                    `)}
                    ${boardSection("验证数据", `
                        <div class="board-mini-grid">
                            <span>${areaLabel("ABD")} / ${areaLabel("ACD")}</span><strong>${ratioText(sABD / sACD)}</strong>
                            <span>${areaLabel("PBD")} / ${areaLabel("PCD")}</span><strong>${ratioText(sPBD / sPCD)}</strong>
                            <span>${areaLabel("PAB")} / ${areaLabel("PAC")}</span><strong>${ratioText(areaRatio)}</strong>
                        </div>
                    `, Math.abs(areaRatio - segmentRatio) < 0.01 ? "board-section-ok" : "")}
                `;
            }

        } else if (currentScene === "butterfly") {
            const { A, B, C, D } = points.butterfly;
            const O = getLineIntersection(A, C, B, D);

            if (O) {
                const s1 = getTriangleArea(A, O, D); // S1 上
                const s2 = getTriangleArea(A, O, B); // S2 左
                const s3 = getTriangleArea(B, O, C); // S3 下
                const s4 = getTriangleArea(C, O, D); // S4 右

                const product1 = s1 * s3;
                const product2 = s2 * s4;
                const isTrapezoid = butterflyType === "trapezoid";
                const lenAD = dist(A, D);
                const lenBC = dist(B, C);
                const productDelta = Math.abs(product1 - product2);
                const stepCopy = [
                    "两条对角线交于 O，把图形分成四块面积。",
                    "先给四个小三角形编号，确定 S1、S2、S3、S4。",
                    isTrapezoid ? "梯形中 AD ∥ BC，左右两翼形成等积关系。" : "任意四边形中重点看对角面积乘积。",
                    "用对顶乘积或梯形两翼等积完成模型迁移。"
                ][proofStep] || "";

                html = `
                    ${boardSection(`蝴蝶定理 · ${getStepTitle("butterfly", proofStep)}`, stepCopy)}
                    ${boardSection("当前结论", `
                        <div class="board-formula">${areaLabel("1")} × ${areaLabel("3")} = ${areaLabel("2")} × ${areaLabel("4")}</div>
                        ${isTrapezoid ? `<div class="board-subformula">梯形特例：${areaLabel("2")} = ${areaLabel("4")}，${areaLabel("1")} : ${areaLabel("3")} = AD<sup>2</sup> : BC<sup>2</sup></div>` : ""}
                    `)}
                    ${boardSection("验证数据", `
                        <div class="board-mini-grid">
                            <span>${areaLabel("1")}</span><strong>${s1.toFixed(0)}</strong>
                            <span>${areaLabel("2")}</span><strong>${s2.toFixed(0)}</strong>
                            <span>${areaLabel("3")}</span><strong>${s3.toFixed(0)}</strong>
                            <span>${areaLabel("4")}</span><strong>${s4.toFixed(0)}</strong>
                            <span>AD/BC</span><strong>${ratioText(lenAD / lenBC)}</strong>
                            <span>乘积差</span><strong>${productDelta.toFixed(0)}</strong>
                        </div>
                    `, productDelta < 1 ? "board-section-ok" : "")}
                `;
            }
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 右侧滑块控制条渲染
    // ==========================================================================
    function loadSlidersForScene() {
        let html = "";
        const center = getCenterPosition();

        if (currentScene === "swallowtail") {
            const { A, B, C, P } = points.swallowtail;
            html = `
                <div class="slider-row">
                    <span class="slider-label">顶点 A 左右位置：</span>
                    <input type="range" id="slide-a-x" min="${center.x - 200}" max="${center.x + 200}" step="1" value="${A.x}">
                </div>
                <div class="slider-row">
                    <span class="slider-label">动点 P 左右位置：</span>
                    <input type="range" id="slide-p-x" min="${center.x - 150}" max="${center.x + 150}" step="1" value="${P.x}">
                </div>
                <div class="slider-row">
                    <span class="slider-label">动点 P 上下位置：</span>
                    <input type="range" id="slide-p-y" min="${center.y - 120}" max="${center.y + 100}" step="1" value="${P.y}">
                </div>
            `;
            butterflyModeSelector.classList.add("hidden");
        } else if (currentScene === "butterfly") {
            const { A, D, B, C } = points.butterfly;
            const isTrapezoid = butterflyType === "trapezoid";
            
            html = `
                <div class="slider-row">
                    <span class="slider-label">上底宽度 (A与D间距)：</span>
                    <input type="range" id="slide-top-width" min="40" max="300" step="2" value="${D.x - A.x}">
                </div>
                <div class="slider-row">
                    <span class="slider-label">下底宽度 (B与C间距)：</span>
                    <input type="range" id="slide-bottom-width" min="60" max="360" step="2" value="${C.x - B.x}">
                </div>
                <div class="slider-row">
                    <span class="slider-label">高度 (上下平行底间距)：</span>
                    <input type="range" id="slide-height" min="80" max="260" step="2" value="${B.y - A.y}">
                </div>
            `;
            
            if (!isTrapezoid) {
                // 如果是任意四边形，则改用顶点微调滑块
                html = `
                    <div class="slider-row">
                        <span class="slider-label">顶点 A 左右偏移：</span>
                        <input type="range" id="slide-general-a" min="${center.x - 180}" max="${center.x - 20}" step="1" value="${A.x}">
                    </div>
                    <div class="slider-row">
                        <span class="slider-label">顶点 D 上下偏移：</span>
                        <input type="range" id="slide-general-d" min="${center.y - 160}" max="${center.y - 40}" step="1" value="${D.y}">
                    </div>
                `;
            }
            butterflyModeSelector.classList.remove("hidden");
        }

        slidersContainer.innerHTML = html;
        bindSliderEvents();
    }

    // ==========================================================================
    // 9. 绑定滑块拉动事件
    // ==========================================================================
    function bindSliderEvents() {
        if (currentScene === "swallowtail") {
            const { A, B, C, P } = points.swallowtail;
            
            const sax = document.getElementById("slide-a-x");
            if (sax) {
                sax.addEventListener("input", (e) => {
                    A.x = parseFloat(e.target.value);
                    points.swallowtail.P = clampPInsideTriangle(P, A, B, C);
                    render();
                });
            }
            
            const spx = document.getElementById("slide-p-x");
            const spy = document.getElementById("slide-p-y");
            
            if (spx && spy) {
                spx.addEventListener("input", (e) => {
                    const nextP = { x: parseFloat(e.target.value), y: P.y };
                    points.swallowtail.P = clampPInsideTriangle(nextP, A, B, C);
                    render();
                });
                spy.addEventListener("input", (e) => {
                    const nextP = { x: P.x, y: parseFloat(e.target.value) };
                    points.swallowtail.P = clampPInsideTriangle(nextP, A, B, C);
                    render();
                });
            }
        } else if (currentScene === "butterfly") {
            const { A, B, C, D } = points.butterfly;
            const center = getCenterPosition();

            if (butterflyType === "trapezoid") {
                const sTopW = document.getElementById("slide-top-width");
                const sBotW = document.getElementById("slide-bottom-width");
                const sH = document.getElementById("slide-height");

                if (sTopW) {
                    sTopW.addEventListener("input", (e) => {
                        const topW = parseFloat(e.target.value);
                        A.x = center.x - topW/2;
                        D.x = center.x + topW/2;
                        render();
                    });
                }
                if (sBotW) {
                    sBotW.addEventListener("input", (e) => {
                        const botW = parseFloat(e.target.value);
                        B.x = center.x - botW/2;
                        C.x = center.x + botW/2;
                        render();
                    });
                }
                if (sH) {
                    sH.addEventListener("input", (e) => {
                        const h = parseFloat(e.target.value);
                        A.y = center.y - h/2;
                        D.y = center.y - h/2;
                        B.y = center.y + h/2;
                        C.y = center.y + h/2;
                        render();
                    });
                }
            } else {
                // 任意四边形
                const sGenA = document.getElementById("slide-general-a");
                const sGenD = document.getElementById("slide-general-d");

                if (sGenA) {
                    sGenA.addEventListener("input", (e) => {
                        A.x = parseFloat(e.target.value);
                        render();
                    });
                }
                if (sGenD) {
                    sGenD.addEventListener("input", (e) => {
                        D.y = parseFloat(e.target.value);
                        render();
                    });
                }
            }
        }
    }

    // ==========================================================================
    // 10. 绑定 SVG 手柄拖拽事件 (核心拖拽逻辑)
    // ==========================================================================
    function bindHandleEvents() {
        const handles = sandboxSvg.querySelectorAll(".drag-handle");
        
        handles.forEach(h => {
            h.addEventListener("mousedown", onDragStart);
            h.addEventListener("touchstart", onDragStart, { passive: false });
        });
    }

    function onDragStart(e) {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const target = e.target;
        activeNode = target.getAttribute("data-point");
        
        const pt = currentScene === "swallowtail" ? points.swallowtail[activeNode] : points.butterfly[activeNode];
        
        // 算出点击位置相对顶点的偏移
        const rect = sandboxSvg.getBoundingClientRect();
        const svgX = (clientX - rect.left) / zoomScale;
        const svgY = (clientY - rect.top) / zoomScale;

        dragOffset.x = svgX - pt.x;
        dragOffset.y = svgY - pt.y;

        target.classList.add("active");

        window.addEventListener("mousemove", onDragging);
        window.addEventListener("touchmove", onDragging, { passive: false });
        window.addEventListener("mouseup", onDragEnd);
        window.addEventListener("touchend", onDragEnd);
    }

    function onDragging(e) {
        if (!activeNode) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const rect = sandboxSvg.getBoundingClientRect();
        const svgX = (clientX - rect.left) / zoomScale;
        const svgY = (clientY - rect.top) / zoomScale;

        const targetX = svgX - dragOffset.x;
        const targetY = svgY - dragOffset.y;

        if (currentScene === "swallowtail") {
            const { A, B, C, P } = points.swallowtail;
            
            if (activeNode === "P") {
                points.swallowtail.P = clampPInsideTriangle({ x: targetX, y: targetY }, A, B, C);
            } else {
                points.swallowtail[activeNode].x = targetX;
                points.swallowtail[activeNode].y = targetY;
                // 当顶点 ABC 移动时，自动重整 P 点以确保 P 不会被挤到外面
                points.swallowtail.P = clampPInsideTriangle(P, A, B, C);
            }
        } else if (currentScene === "butterfly") {
            const { A, B, C, D } = points.butterfly;

            if (butterflyType === "trapezoid") {
                // 梯形模式：刚性锁定 Y 坐标，A=D(上底), B=C(下底)
                if (activeNode === "A" || activeNode === "D") {
                    A.y = targetY;
                    D.y = targetY;
                    points.butterfly[activeNode].x = targetX;
                } else if (activeNode === "B" || activeNode === "C") {
                    B.y = targetY;
                    C.y = targetY;
                    points.butterfly[activeNode].x = targetX;
                }
            } else {
                // 任意四边形模式：自由移动
                points.butterfly[activeNode].x = targetX;
                points.butterfly[activeNode].y = targetY;
            }
        }

        render();
        loadSlidersForScene(); // 同步右侧控制滑块的刻度
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
    }

    // ==========================================================================
    // 11. 问题预设加载与概念更新
    // ==========================================================================
    function updateScenePresetsAndTheory() {
        let presetHtml = "";
        let theoryTitleText = "";
        let theoryBody = "";

        if (currentScene === "swallowtail") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="st-symmetry">面积比求线段比</button>
                <button class="btn-preset-problem" data-preset="st-eccentric">线段比求面积比</button>
                <button class="btn-preset-problem" data-preset="st-tall">复杂燕尾压轴型</button>
            `;
            theoryTitleText = "燕尾模型解题入口";
            theoryBody = `
                <p><strong>先找交点 D</strong>，再看左右两翼面积和底边分段。</p>
                <p>核心式：${areaLabel("PAB")} : ${areaLabel("PAC")} = BD : CD。</p>
            `;
        } else if (currentScene === "butterfly") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="bt-isosceles">梯形蝴蝶等积</button>
                <button class="btn-preset-problem" data-preset="bt-slant">面积比平方型</button>
                <button class="btn-preset-problem" data-preset="bt-general">乘积恒等验证</button>
            `;
            theoryTitleText = "蝴蝶模型解题入口";
            theoryBody = `
                <p><strong>先找对角线交点 O</strong>，再给四块面积编号。</p>
                <p>核心式：${areaLabel("1")} × ${areaLabel("3")} = ${areaLabel("2")} × ${areaLabel("4")}。</p>
            `;
        }

        presetButtonsContainer.innerHTML = presetHtml;
        theoryTitle.innerHTML = theoryTitleText;
        theoryText.innerHTML = theoryBody;

        // 重新绑定预设按钮的点击事件
        document.querySelectorAll(".btn-preset-problem").forEach(btn => {
            btn.addEventListener("click", () => {
                applyPreset(btn.getAttribute("data-preset"));
            });
        });
    }

    function applyPreset(presetId) {
        stopAutoDemo();
        const center = getCenterPosition();
        
        if (presetId === "st-symmetry") {
            points.swallowtail.A = { x: center.x, y: center.y - 140 };
            points.swallowtail.B = { x: center.x - 170, y: center.y + 110 };
            points.swallowtail.C = { x: center.x + 170, y: center.y + 110 };
            points.swallowtail.P = { x: center.x, y: center.y + 20 };
        } else if (presetId === "st-eccentric") {
            points.swallowtail.A = { x: center.x + 40, y: center.y - 130 };
            points.swallowtail.B = { x: center.x - 160, y: center.y + 110 };
            points.swallowtail.C = { x: center.x + 180, y: center.y + 110 };
            points.swallowtail.P = { x: center.x + 60, y: center.y + 40 };
        } else if (presetId === "st-tall") {
            points.swallowtail.A = { x: center.x, y: center.y - 170 };
            points.swallowtail.B = { x: center.x - 80, y: center.y + 120 };
            points.swallowtail.C = { x: center.x + 80, y: center.y + 120 };
            points.swallowtail.P = { x: center.x, y: center.y - 10 };
        } 
        
        else if (presetId === "bt-isosceles") {
            butterflyType = "trapezoid";
            setRadioValue("quad-type", "trapezoid");
            points.butterfly.A = { x: center.x - 80, y: center.y - 90 };
            points.butterfly.D = { x: center.x + 80, y: center.y - 90 };
            points.butterfly.B = { x: center.x - 180, y: center.y + 110 };
            points.butterfly.C = { x: center.x + 180, y: center.y + 110 };
        } else if (presetId === "bt-slant") {
            butterflyType = "trapezoid";
            setRadioValue("quad-type", "trapezoid");
            points.butterfly.A = { x: center.x - 140, y: center.y - 90 };
            points.butterfly.D = { x: center.x + 60, y: center.y - 90 };
            points.butterfly.B = { x: center.x - 140, y: center.y + 110 };
            points.butterfly.C = { x: center.x + 180, y: center.y + 110 };
        } else if (presetId === "bt-general") {
            butterflyType = "general";
            setRadioValue("quad-type", "general");
            points.butterfly.A = { x: center.x - 120, y: center.y - 100 };
            points.butterfly.D = { x: center.x + 80, y: center.y - 70 };
            points.butterfly.B = { x: center.x - 170, y: center.y + 90 };
            points.butterfly.C = { x: center.x + 150, y: center.y + 120 };
        }

        render();
        loadSlidersForScene();
    }

    function setRadioValue(name, value) {
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            radio.checked = (radio.value === value);
        });
    }

    // ==========================================================================
    // 12. 页面交互事件绑定
    // ==========================================================================
    // ==========================================================================
    // 12. 页面交互事件绑定
    // ==========================================================================
    const chkShowHeights = document.getElementById("chk-show-heights");
    const btnProofPrev = document.getElementById("btn-proof-prev");
    const btnProofNext = document.getElementById("btn-proof-next");
    const btnAutoDemo = document.getElementById("btn-auto-demo");
    const proofStepIndicator = document.getElementById("proof-step-indicator");

    function stopAutoDemo() {
        if (autoDemoTimer) {
            window.clearInterval(autoDemoTimer);
            autoDemoTimer = null;
        }
        autoDemoIndex = 0;
        if (btnAutoDemo) {
            btnAutoDemo.classList.remove("active");
            btnAutoDemo.textContent = "一键演示教学过程";
        }
    }

    function startAutoDemo() {
        stopAutoDemo();
        const autoDemoQueue = [0, 1, 2, 3];
        if (btnAutoDemo) {
            btnAutoDemo.classList.add("active");
            btnAutoDemo.textContent = "演示中...";
        }
        proofStep = autoDemoQueue[0];
        updateProofStepUI();
        render();
        autoDemoTimer = window.setInterval(() => {
            autoDemoIndex += 1;
            if (autoDemoIndex >= autoDemoQueue.length) {
                stopAutoDemo();
                return;
            }
            proofStep = autoDemoQueue[autoDemoIndex];
            updateProofStepUI();
            render();
        }, 1500);
    }

    function updateProofStepUI() {
        if (!proofStepIndicator) return;
        if (proofStep === 0) {
            proofStepIndicator.textContent = "自由探索";
            proofStepIndicator.style.color = "var(--text-secondary)";
        } else {
            proofStepIndicator.textContent = `${proofStep}/3 ${getStepTitle(currentScene, proofStep)}`;
            proofStepIndicator.style.color = "var(--color-blue)";
        }
        if (btnProofPrev) btnProofPrev.disabled = proofStep <= 0;
        if (btnProofNext) btnProofNext.disabled = proofStep >= 3;
    }

    function loadScene(sceneId) {
        stopAutoDemo();
        currentScene = sceneId;
        proofStep = 0;
        updateProofStepUI();

        document.querySelectorAll(".tab-buttons .btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === sceneId) btn.classList.add("active");
            else btn.classList.remove("active");
        });

        initPoints(sceneId);
        updateScenePresetsAndTheory();
        loadSlidersForScene();
        render();
    }

    document.querySelectorAll(".tab-buttons .btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadScene(btn.getAttribute("data-scene"));
        });
    });

    // 监听蝴蝶定理下“任意四边形”/“梯形”的单选切换
    document.querySelectorAll('input[name="quad-type"]').forEach(radio => {
        radio.addEventListener("change", (e) => {
            stopAutoDemo();
            butterflyType = e.target.value;
            // 切换类型时，若为梯形，直接对齐上底和下底的 Y 坐标使其完美水平平行
            if (butterflyType === "trapezoid") {
                const { A, B, C, D } = points.butterfly;
                const midYTop = (A.y + D.y) / 2;
                const midYBot = (B.y + C.y) / 2;
                A.y = midYTop;
                D.y = midYTop;
                B.y = midYBot;
                C.y = midYBot;
            }
            loadSlidersForScene();
            render();
        });
    });

    // HUD 板书折叠/展开
    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
            hudPanel.classList.add("expanded");
        } else {
            hudPanel.classList.remove("expanded");
            hudPanel.classList.add("collapsed");
        }
        render();
    });

    // 辅助高线开关绑定
    if (chkShowHeights) {
        chkShowHeights.addEventListener("change", (e) => {
            showHeights = e.target.checked;
            render();
        });
    }

    // 分步证明向导按钮绑定
    if (btnProofPrev && btnProofNext) {
        btnProofPrev.addEventListener("click", () => {
            stopAutoDemo();
            proofStep = (proofStep - 1 + 4) % 4; // 0 -> 3 -> 2 -> 1 -> 0
            updateProofStepUI();
            render();
        });
        btnProofNext.addEventListener("click", () => {
            stopAutoDemo();
            proofStep = (proofStep + 1) % 4; // 0 -> 1 -> 2 -> 3 -> 0
            updateProofStepUI();
            render();
        });
    }

    if (btnAutoDemo) {
        btnAutoDemo.addEventListener("click", startAutoDemo);
    }

    btnResetState.addEventListener("click", () => {
        stopAutoDemo();
        initPoints(currentScene);
        proofStep = 0;
        updateProofStepUI();
        showHeights = false;
        if (chkShowHeights) chkShowHeights.checked = false;
        loadSlidersForScene();
        render();
    });

    // 缩放控制
    document.getElementById("btn-zoom-in").addEventListener("click", () => {
        zoomScale = Math.min(zoomScale * 1.15, 3.0);
        updateTransform();
    });
    document.getElementById("btn-zoom-out").addEventListener("click", () => {
        zoomScale = Math.max(zoomScale / 1.15, 0.45);
        updateTransform();
    });
    document.getElementById("btn-zoom-reset").addEventListener("click", () => {
        zoomScale = 1.0;
        updateTransform();
        render();
    });

    function updateTransform() {
        sandboxSvg.style.transform = `scale(${zoomScale})`;
        htmlOverlay.style.transform = `scale(${zoomScale})`;
    }

    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (e) => {
        if (e.target === modalHelp) modalHelp.classList.remove("active");
    });

    // 全局暴露外部接口
    window.appState = {
        get currentScene() { return currentScene; },
        loadScene,
        applyPreset,
        render
    };

    function render() {
        renderSVG();
        renderHTMLOverlay();
        renderHUDChalkboard();
    }

    // 初始化运行
    loadScene("swallowtail");
    requestAnimationFrame(updateFrame);

    window.addEventListener("resize", () => {
        render();
    });
});

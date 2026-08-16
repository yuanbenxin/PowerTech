/**
 * 8字型相似模型演示仪 - 几何可视化交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态变量与参数
    // ==========================================================================
    let currentScene = "parallel-similarity"; // parallel-similarity | intercept-theorem | rotated-similarity | bevel-similarity | double-eight-similarity
    let isAnimating = false;
    let isHudExpanded = false; // HUD 默认收起
    let demoStage = "explore";
    let demoTimers = [];

    // 相似比 (OC/OB 或 OA/OD 等)，对应 slider 的值
    let ratioSim = 0.75;
    let bevelDepth = 0.18;
    let doubleEightSplit = 0.5;
    let lastDoubleEightModel = null;

    // LERP 数值平滑系统
    const renderValues = {
        ratioSim: 0.75,
        animProgress: 0.0,
        // 各线段的测量值 (单位: 厘米)
        oa: 0.0, od: 0.0,
        ob: 0.0, oc: 0.0,
        ab: 0.0, cd: 0.0
    };

    // 画布缩放与平移状态
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // 拖拽几何点与图形对象状态
    let activeDragPoint = null;
    let activeDragObject = null;
    let dragStart = null;
    let interactionMode = "snap"; // free | snap | teach

    // 动画进度
    let animProgress = 0.0;
    let animDirection = 0; // 1: 播放重合, -1: 展开回弹

    // 几何形状预设平滑过渡变量
    let isPresetTransitioning = false;
    const targetPoints = {
        A: { x: 0, y: 0 },
        B: { x: 0, y: 0 }
    };
    let targetRatioSim = 0.75;

    // ==========================================================================
    // 2. 几何点坐标定义
    // ==========================================================================
    const SCALE_CM_TO_PX = 45; // 45像素代表1厘米

    let centerX = 400;
    let centerY = 280; // 略微向上偏置，给板书空出位置

    // 点集坐标 (O是相交中心，A, B在上方，C, D在下方)
    const points = {
        O: { x: 400, y: 280 },
        A: { x: 260, y: 160 },
        B: { x: 540, y: 160 },
        C: { x: 300, y: 370 }, // 动态计算
        D: { x: 500, y: 370 }  // 动态计算
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

    const sliderRatioSim = document.getElementById("slider-ratio-sim");
    const valRatioSim = document.getElementById("val-ratio-sim");
    const labelRatioSim = document.getElementById("label-ratio-sim");
    const controlGroupBevelDepth = document.getElementById("control-group-bevel-depth");
    const sliderBevelDepth = document.getElementById("slider-bevel-depth");
    const valBevelDepth = document.getElementById("val-bevel-depth");

    const btnPlayFolding = document.getElementById("btn-play-folding");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");
    const sectionTheoryCard = document.getElementById("section-theory-card");

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

    function ratioText(value) {
        return Number.isFinite(value) ? value.toFixed(3) : "--";
    }

    function ratioClass(values) {
        const finite = values.filter(Number.isFinite);
        if (finite.length < 2) return "warn";
        const diff = Math.max(...finite) - Math.min(...finite);
        if (diff < 0.008) return "ok";
        if (diff < 0.035) return "near";
        return "warn";
    }

    function ratioWord(cls) {
        if (cls === "ok") return "比例一致";
        if (cls === "near") return "接近一致";
        return "检查对应";
    }

    function clearDemoTimer() {
        demoTimers.forEach(timer => clearTimeout(timer));
        demoTimers = [];
    }

    function queueDemoStep(delay, fn) {
        const timer = setTimeout(fn, delay);
        demoTimers.push(timer);
    }

    function isBevelScene(scene = currentScene) {
        return scene === "bevel-similarity";
    }

    function isDoubleEightScene(scene = currentScene) {
        return scene === "double-eight-similarity";
    }

    function isParallelTeachingScene(scene = currentScene) {
        return scene === "parallel-similarity" || scene === "bevel-similarity";
    }

    function sceneRatio() {
        return Math.min(Math.max(renderValues.ratioSim || ratioSim, 0.45), 1.4);
    }

    function getLabelOffset(id, pt, opts = {}) {
        const cx = opts.cx ?? points.O.x;
        const cy = opts.cy ?? points.O.y;
        const margin = opts.margin ?? 20;
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const sideX = Math.abs(dx) < 16 ? (id === "O" ? 1 : -1) : Math.sign(dx);
        const sideY = Math.abs(dy) < 16 ? (id === "O" ? -1 : 1) : Math.sign(dy);
        let ox = sideX < 0 ? -margin - 8 : margin - 2;
        let oy = sideY < 0 ? -margin + 2 : margin + 10;

        if (id === "O" || id === "O1" || id === "O2") {
            ox = id === "O1" ? -34 : 18;
            oy = Math.abs(dy) < 20 ? 8 : -12;
        }
        if (opts.force) {
            ox = opts.force.x;
            oy = opts.force.y;
        }
        return { x: ox, y: oy };
    }

    function drawPointLabel(id, pt, opts = {}) {
        const offset = getLabelOffset(id, pt, opts);
        const label = opts.label ?? id;
        return `
            <circle class="${opts.nodeClass ?? "double-eight-node"}" cx="${fmt(pt.x)}" cy="${fmt(pt.y)}" r="${opts.r ?? 6}"></circle>
            <text class="geo-label geo-label-chip" x="${fmt(pt.x + offset.x)}" y="${fmt(pt.y + offset.y)}">${label}</text>
        `;
    }

    function setStatus() {}

    function updateSceneStatus() {}

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function distancePx(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }

    function midpoint(p1, p2) {
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    function copyPointMap() {
        return {
            O: { ...points.O },
            A: { ...points.A },
            B: { ...points.B },
            C: { ...points.C },
            D: { ...points.D }
        };
    }

    function lineAngleDeg(p1, p2) {
        let deg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        while (deg < 0) deg += 180;
        while (deg >= 180) deg -= 180;
        return deg;
    }

    function parallelDeltaDeg(p1, p2, p3, p4) {
        const diff = Math.abs(lineAngleDeg(p1, p2) - lineAngleDeg(p3, p4));
        return Math.min(diff, 180 - diff);
    }

    function angleAtDeg(vertex, p1, p2) {
        const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
        const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
        const len1 = Math.hypot(v1.x, v1.y);
        const len2 = Math.hypot(v2.x, v2.y);
        if (len1 < 1e-3 || len2 < 1e-3) return NaN;
        const cos = clamp((v1.x * v2.x + v1.y * v2.y) / (len1 * len2), -1, 1);
        return Math.acos(cos) * 180 / Math.PI;
    }

    function angleDiffDeg(a, b) {
        return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) : Infinity;
    }

    function formatAngleDelta(delta) {
        return Number.isFinite(delta) ? `${delta.toFixed(1)}°` : "--";
    }

    function getParallelAngleState(A, B, O, C, D) {
        const tolerance = 1.2;
        const primaryDelta = angleDiffDeg(angleAtDeg(A, B, O), angleAtDeg(D, C, O));
        const secondaryDelta = angleDiffDeg(angleAtDeg(B, A, O), angleAtDeg(C, D, O));
        const centerDelta = angleDiffDeg(angleAtDeg(O, A, B), angleAtDeg(O, D, C));
        const parallelDelta = parallelDeltaDeg(A, B, C, D);
        const primaryOk = primaryDelta < tolerance;
        const secondaryOk = secondaryDelta < tolerance;
        const centerOk = centerDelta < tolerance;
        const parallelOk = parallelDelta < tolerance;
        const allOk = primaryOk && secondaryOk && centerOk;
        return {
            primaryDelta,
            secondaryDelta,
            centerDelta,
            parallelDelta,
            primaryOk,
            secondaryOk,
            centerOk,
            parallelOk,
            allOk,
            primaryLabel: primaryOk ? "① ∠A = ∠D" : "① ∠A≠∠D",
            secondaryLabel: secondaryOk ? "② ∠B = ∠C" : "② ∠B≠∠C",
            centerLabel: centerOk ? "③ 对顶角" : "③ O点需对齐",
            proofLine: allOk ? "∠A=∠D，∠B=∠C，∠AOB=∠DOC" : `∠A/∠D差${formatAngleDelta(primaryDelta)}，∠B/∠C差${formatAngleDelta(secondaryDelta)}，O点角差${formatAngleDelta(centerDelta)}`,
            guidance: allOk ? "对应角和对顶角成立，可以继续比较比例。" : "角条件未齐，不能直接判相似；先把 AB、CD 与 O 点对齐。"
        };
    }

    function spreadOf(values) {
        const finite = values.filter(Number.isFinite);
        if (finite.length < 2) return NaN;
        return Math.max(...finite) - Math.min(...finite);
    }

    function syncRatioSlider() {
        sliderRatioSim.value = ratioSim;
        valRatioSim.textContent = ratioSim.toFixed(2);
    }

    function syncBevelSlider() {
        sliderBevelDepth.value = bevelDepth;
        valBevelDepth.textContent = `${Math.round(bevelDepth * 100)}%`;
    }

    function setRatioSimValue(value) {
        const min = Number.parseFloat(sliderRatioSim.min) || 0.45;
        const max = Number.parseFloat(sliderRatioSim.max) || 1.40;
        ratioSim = clamp(value, min, max);
        syncRatioSlider();
    }

    function setBevelDepthValue(value) {
        bevelDepth = clamp(value, 0.10, 0.34);
        syncBevelSlider();
    }

    function computeConditionMetrics() {
        if (isDoubleEightScene()) {
            const ratioLeft = lastDoubleEightModel?.ratioLeft ?? (1 / sceneRatio());
            const ratioRight = lastDoubleEightModel?.ratioRight ?? (1 / sceneRatio());
            const ratioSpread = Math.abs(ratioLeft - ratioRight);
            const state = ratioSpread < 0.012 ? "ok" : ratioSpread < 0.045 ? "near" : "warn";
            return {
                state,
                title: state === "ok" ? "双链比例同步" : state === "near" ? "双链接近同步" : "检查共享线段",
                modeLabel: interactionMode === "free" ? "自由探索" : interactionMode === "teach" ? "教师演示" : "吸附验证",
                angleDelta: null,
                ratioSpread,
                ratios: [
                    ["左 8 比", ratioLeft],
                    ["右 8 比", ratioRight]
                ],
                guidance: state === "ok" ? "左右两个 8 字比例链可以串联。" : "拖动共享 BD，让左右两组比例重新靠近。"
            };
        }

        const A = points.A;
        const B = points.B;
        const O = points.O;
        const C = points.C;
        const D = points.D;
        const oa = distancePx(O, A);
        const ob = distancePx(O, B);
        const oc = distancePx(O, C);
        const od = distancePx(O, D);
        const ab = distancePx(A, B);
        const cd = distancePx(C, D);
        const angleDelta = parallelDeltaDeg(A, B, C, D);
        const angleState = isParallelTeachingScene() ? getParallelAngleState(A, B, O, C, D) : null;

        let ratios;
        let guidance;
        if (currentScene === "rotated-similarity") {
            ratios = [
                ["OA/OC", oa / oc],
                ["OB/OD", ob / od],
                ["AB/CD", ab / cd]
            ];
            guidance = "先确认 A↔C、B↔D，再看三组比例是否接近。";
        } else if (currentScene === "intercept-theorem") {
            ratios = [
                ["OA/OD", oa / od],
                ["OB/OC", ob / oc]
            ];
            guidance = "截线比例只看两条截线的对应分段，同时确认 AB ∥ CD。";
        } else {
            ratios = [
                ["OA/OD", oa / od],
                ["OB/OC", ob / oc],
                ["AB/CD", ab / cd]
            ];
            guidance = isBevelScene() ? "拖动倒角线只改变辅助位置，本体仍要回到 8 字相似。" : "平行底边、对顶角和三组比例同时成立。";
        }

        const values = ratios.map(([, value]) => value);
        const ratioSpread = spreadOf(values);
        const ratioState = ratioClass(values);
        const needsParallel = currentScene !== "rotated-similarity";
        const angleOk = angleState ? angleState.allOk : (!needsParallel || angleDelta < 1.2);
        const state = angleOk ? ratioState : "warn";
        if (angleState && !angleState.allOk) {
            guidance = angleState.guidance;
        }

        return {
            state,
            title: state === "ok" ? "条件吻合" : state === "near" ? "接近成立" : "需要调整",
            modeLabel: interactionMode === "free" ? "自由探索" : interactionMode === "teach" ? "教师演示" : "吸附验证",
            angleDelta,
            ratioSpread,
            ratios,
            guidance
        };
    }

    function renderConditionFeedback() {
        const metrics = computeConditionMetrics();
        const angleText = metrics.angleDelta === null ? "双链共享 BD" : `底边夹角差 ${metrics.angleDelta.toFixed(1)}°`;
        const ratioTextLine = Number.isFinite(metrics.ratioSpread) ? `比例差 ${metrics.ratioSpread.toFixed(3)}` : "比例差 --";
        return `
            <div class="condition-feedback ${metrics.state}">
                <div class="condition-feedback-head">
                    <span>${metrics.modeLabel}</span>
                    <strong>${metrics.title}</strong>
                </div>
                <div class="condition-feedback-metrics">
                    <span>${angleText}</span>
                    <span>${ratioTextLine}</span>
                </div>
                <div class="condition-feedback-ratios">
                    ${metrics.ratios.map(([label, value]) => `<span>${label}<b>${ratioText(value)}</b></span>`).join("")}
                </div>
                <p>${metrics.guidance}</p>
            </div>
        `;
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
    function validateGeometry() {
        // 防止 A, B, O 三点共线，或者 A, B 重合
        const area = Math.abs(
            points.A.x * (points.B.y - points.O.y) +
            points.B.x * (points.O.y - points.A.y) +
            points.O.x * (points.A.y - points.B.y)
        ) / 2;
        return area > 1800;
    }

    function solveGeometry() {
        const A = points.A;
        const B = points.B;
        const O = points.O;

        const vecOA = { x: A.x - O.x, y: A.y - O.y };
        const vecOB = { x: B.x - O.x, y: B.y - O.y };

        const lenOA = Math.hypot(vecOA.x, vecOA.y);
        const lenOB = Math.hypot(vecOB.x, vecOB.y);

        // 动态计算并限制相似比，保证 C 和 D 的间距 >= 35px
        const lenAB = Math.hypot(B.x - A.x, B.y - A.y);
        if (currentScene === "rotated-similarity") {
            const maxR = Math.min(1.30, lenAB / 35);
            sliderRatioSim.min = 0.45;
            sliderRatioSim.max = maxR;
            if (ratioSim > maxR) {
                ratioSim = maxR;
                sliderRatioSim.value = maxR;
                valRatioSim.textContent = maxR.toFixed(2);
            }
        } else {
            const minR = Math.max(0.45, 35 / lenAB);
            sliderRatioSim.min = minR;
            sliderRatioSim.max = 1.40;
            if (ratioSim < minR) {
                ratioSim = minR;
                sliderRatioSim.value = minR;
                valRatioSim.textContent = minR.toFixed(2);
            }
        }

        const r = renderValues.ratioSim;

        const shouldSnapGeometry = interactionMode !== "free" || demoStage !== "explore" || isPresetTransitioning;

        if (shouldSnapGeometry && (isParallelTeachingScene() || currentScene === "intercept-theorem")) {
            // 平行8字形相似：AB ∥ CD
            // C 在 BO 延长线上，且 OC = r * OB
            // D 在 AO 延长线上，且 OD = r * OA
            points.C.x = O.x - r * vecOB.x;
            points.C.y = O.y - r * vecOB.y;

            points.D.x = O.x - r * vecOA.x;
            points.D.y = O.y - r * vecOA.y;
        } else if (shouldSnapGeometry && currentScene === "rotated-similarity") {
            // 反平行8字相似：满足 △OAB ∽ △OCD => OA / OC = OB / OD = r
            // 故 OC = OA / r，且 OD = OB / r
            points.C.x = O.x - (lenOA / r) * (vecOB.x / lenOB);
            points.C.y = O.y - (lenOA / r) * (vecOB.y / lenOB);

            points.D.x = O.x - (lenOB / r) * (vecOA.x / lenOA);
            points.D.y = O.y - (lenOB / r) * (vecOA.y / lenOA);
        }

        // 计算线段测量值 (厘米)
        const scale = SCALE_CM_TO_PX;
        const C = points.C;
        const D = points.D;

        renderValues.oa = lenOA / scale;
        renderValues.ob = lenOB / scale;
        renderValues.oc = Math.hypot(C.x - O.x, C.y - O.y) / scale;
        renderValues.od = Math.hypot(D.x - O.x, D.y - O.y) / scale;

        renderValues.ab = lenAB / scale;
        renderValues.cd = Math.hypot(D.x - C.x, D.y - C.y) / scale;
    }

    // 辅助：计算夹角圆弧的 SVG Path
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

    // 向量旋转
    function rotateVector(vec, angleRad) {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        return {
            x: vec.x * cos - vec.y * sin,
            y: vec.x * sin + vec.y * cos
        };
    }

    function fmt(num) {
        return Number(num).toFixed(2);
    }

    function offsetPoint(pt, dx, dy) {
        return { x: pt.x + dx, y: pt.y + dy };
    }

    function getRoundedPolygonPath(vertices, radius = 12) {
        if (!Array.isArray(vertices) || vertices.length < 3) return "";

        const commands = [];
        const rounded = vertices.map((pt, index) => {
            const prev = vertices[(index - 1 + vertices.length) % vertices.length];
            const next = vertices[(index + 1) % vertices.length];
            const toPrev = { x: prev.x - pt.x, y: prev.y - pt.y };
            const toNext = { x: next.x - pt.x, y: next.y - pt.y };
            const lenPrev = Math.hypot(toPrev.x, toPrev.y);
            const lenNext = Math.hypot(toNext.x, toNext.y);
            const r = Math.min(radius, lenPrev * 0.26, lenNext * 0.26);

            if (lenPrev < 1e-3 || lenNext < 1e-3 || r < 0.5) {
                return { start: pt, corner: pt, end: pt };
            }

            return {
                start: {
                    x: pt.x + (toPrev.x / lenPrev) * r,
                    y: pt.y + (toPrev.y / lenPrev) * r
                },
                corner: pt,
                end: {
                    x: pt.x + (toNext.x / lenNext) * r,
                    y: pt.y + (toNext.y / lenNext) * r
                }
            };
        });

        commands.push(`M ${fmt(rounded[0].end.x)} ${fmt(rounded[0].end.y)}`);
        for (let i = 1; i < rounded.length; i++) {
            const part = rounded[i];
            commands.push(`L ${fmt(part.start.x)} ${fmt(part.start.y)}`);
            commands.push(`Q ${fmt(part.corner.x)} ${fmt(part.corner.y)} ${fmt(part.end.x)} ${fmt(part.end.y)}`);
        }
        commands.push(`L ${fmt(rounded[0].start.x)} ${fmt(rounded[0].start.y)}`);
        commands.push(`Q ${fmt(rounded[0].corner.x)} ${fmt(rounded[0].corner.y)} ${fmt(rounded[0].end.x)} ${fmt(rounded[0].end.y)}`);
        commands.push("Z");
        return commands.join(" ");
    }

    function getChamferedTriangle(vertices, depthRatio = 0.18) {
        const ratio = Math.max(0.08, Math.min(0.38, depthRatio));
        const cuts = vertices.map((pt, index) => {
            const prev = vertices[(index - 1 + vertices.length) % vertices.length];
            const next = vertices[(index + 1) % vertices.length];
            const toPrev = { x: prev.x - pt.x, y: prev.y - pt.y };
            const toNext = { x: next.x - pt.x, y: next.y - pt.y };
            return {
                vertex: pt,
                before: { x: pt.x + toPrev.x * ratio, y: pt.y + toPrev.y * ratio },
                after: { x: pt.x + toNext.x * ratio, y: pt.y + toNext.y * ratio }
            };
        });

        return {
            polygon: [
                cuts[0].after,
                cuts[1].before,
                cuts[1].after,
                cuts[2].before,
                cuts[2].after,
                cuts[0].before
            ],
            cuts
        };
    }

    function getPolygonPath(points) {
        if (!points.length) return "";
        const [first, ...rest] = points;
        return `M ${fmt(first.x)} ${fmt(first.y)} ${rest.map(pt => `L ${fmt(pt.x)} ${fmt(pt.y)}`).join(" ")} Z`;
    }

    function getLineIntersection(p1, p2, p3, p4) {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;
        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(den) < 1e-4) return { x: (p1.x + p2.x + p3.x + p4.x) / 4, y: (p1.y + p2.y + p3.y + p4.y) / 4 };
        return {
            x: ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den,
            y: ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den
        };
    }

    function renderAngleFindingOverlay(A, B, O, C, D) {
        const angleHot = demoStage === "angles" || isBevelScene() ? " is-active" : "";
        const angleState = getParallelAngleState(A, B, O, C, D);
        const primaryTone = angleState.primaryOk ? "primary" : "mismatch";
        const secondaryTone = angleState.secondaryOk ? "warning" : "mismatch";
        const centerTone = angleState.centerOk ? "center" : "mismatch";
        return `
            <g class="angle-finding-overlay" data-layer="angle-finding">
                <path class="angle-finder-arc ${primaryTone}${angleHot}" d="${getAngleArcPath(A, B, O, 34)}"></path>
                <path class="angle-finder-arc ${primaryTone}${angleHot}" d="${getAngleArcPath(D, C, O, 34)}"></path>
                <path class="angle-finder-arc ${secondaryTone}${angleHot}" d="${getAngleArcPath(B, A, O, 34)}"></path>
                <path class="angle-finder-arc ${secondaryTone}${angleHot}" d="${getAngleArcPath(C, D, O, 34)}"></path>
                <path class="angle-finder-arc ${centerTone}${angleHot}" d="${getAngleArcPath(O, A, B, 40)}"></path>
                <path class="angle-finder-arc ${centerTone}${angleHot}" d="${getAngleArcPath(O, D, C, 50)}"></path>
                <text class="angle-finder-badge ${primaryTone}" x="${fmt(O.x - 158)}" y="${fmt(O.y - 54)}">${angleState.primaryLabel}</text>
                <text class="angle-finder-badge ${secondaryTone}" x="${fmt(O.x + 62)}" y="${fmt(O.y - 54)}">${angleState.secondaryLabel}</text>
                <text class="angle-finder-badge ${centerTone}" x="${fmt(O.x + 46)}" y="${fmt(O.y + 38)}">${angleState.centerLabel}</text>
                <text class="angle-finder-title" x="${fmt(O.x - 118)}" y="${fmt(Math.max(C.y, D.y) + 58)}">找角顺序：平行线对应角 → 对顶角 → 判相似</text>
            </g>
        `;
    }

    function renderFlatBevelGuides(A, B, O, C, D) {
        const topChamfer = getChamferedTriangle([A, B, O], bevelDepth);
        const bottomChamfer = getChamferedTriangle([C, D, O], bevelDepth);
        const topCut = topChamfer.cuts[2];
        const bottomCut = bottomChamfer.cuts[2];
        const dot = (pt, tone) => `<circle class="flat-bevel-dot ${tone}" cx="${fmt(pt.x)}" cy="${fmt(pt.y)}" r="5"></circle>`;

        return `
            <g class="flat-bevel-guides" data-layer="flat-bevel">
                <line class="flat-bevel-guide main" x1="${fmt(topCut.before.x)}" y1="${fmt(topCut.before.y)}" x2="${fmt(topCut.after.x)}" y2="${fmt(topCut.after.y)}"></line>
                <line class="bevel-drag-handle" data-drag-object="bevel-main" x1="${fmt(topCut.before.x)}" y1="${fmt(topCut.before.y)}" x2="${fmt(topCut.after.x)}" y2="${fmt(topCut.after.y)}"></line>
                <line class="flat-bevel-guide match" x1="${fmt(bottomCut.before.x)}" y1="${fmt(bottomCut.before.y)}" x2="${fmt(bottomCut.after.x)}" y2="${fmt(bottomCut.after.y)}"></line>
                ${dot(topCut.before, "main")}
                ${dot(topCut.after, "main")}
                ${dot(bottomCut.before, "match")}
                ${dot(bottomCut.after, "match")}
                <text class="flat-bevel-note" x="${fmt(O.x - 138)}" y="${fmt(Math.max(C.y, D.y) + 74)}">倒角线 ∥ AB / ∥ CD；倒角量 ${Math.round(bevelDepth * 100)}%</text>
            </g>
        `;
    }

    function renderDoubleEightTeachingOverlay(model) {
        const { A, B, C, D, E, F, O1, O2, cX, bottomY, ratioLeft, ratioRight } = model;
        const showAngles = demoStage === "angles" || demoStage === "explore";
        const showRatios = demoStage === "ratios" || demoStage === "fold" || demoStage === "result";
        const showTransfer = demoStage === "fold" || demoStage === "result";

        return `
            <g class="double-eight-teaching-overlay" data-layer="double-eight-teaching">
                <text class="double-eight-stage-chip left" x="${fmt(O1.x - 70)}" y="${fmt(O1.y - 50)}">拆左 8</text>
                <text class="double-eight-stage-chip right" x="${fmt(O2.x + 22)}" y="${fmt(O2.y - 50)}">拆右 8</text>
                ${showAngles ? `
                    <path class="double-eight-angle-arc left" d="${getAngleArcPath(O1, A, B, 30)}"></path>
                    <path class="double-eight-angle-arc left-match" d="${getAngleArcPath(O1, D, C, 40)}"></path>
                    <path class="double-eight-angle-arc right" d="${getAngleArcPath(O2, B, E, 30)}"></path>
                    <path class="double-eight-angle-arc right-match" d="${getAngleArcPath(O2, D, F, 40)}"></path>
                    <text class="double-eight-angle-label" x="${fmt(O1.x - 84)}" y="${fmt(O1.y + 20)}">左 8 找角</text>
                    <text class="double-eight-angle-label" x="${fmt(O2.x + 20)}" y="${fmt(O2.y + 20)}">右 8 找角</text>
                ` : ""}
                ${showRatios ? `
                    <text class="double-eight-stage-chip ratio" x="${fmt(cX - 132)}" y="${fmt(bottomY + 70)}">AB/CD=${ratioText(ratioLeft)}；BE/DF=${ratioText(ratioRight)}</text>
                ` : ""}
                ${showTransfer ? `
                    <line class="double-eight-transfer-line" x1="${fmt(B.x)}" y1="${fmt(B.y)}" x2="${fmt(D.x)}" y2="${fmt(D.y)}"></line>
                    <text class="double-eight-stage-chip transfer" x="${fmt((B.x + D.x) / 2 + 18)}" y="${fmt((B.y + D.y) / 2)}">共享线段 BD</text>
                ` : ""}
            </g>
        `;
    }

    function renderDoubleEightModel() {
        const W = sandboxWrapper.clientWidth || 760;
        const H = sandboxWrapper.clientHeight || 520;
        const safeLeft = Math.min(430, W * 0.56);
        const safeRight = W - 128;
        const cX = Math.max(W / 2, (safeLeft + safeRight) / 2);
        const cY = H / 2 - 12;
        const r = sceneRatio();
        doubleEightSplit = clamp(doubleEightSplit, 0.40, 0.58);
        const maxGap = Math.max(92, Math.min(safeRight - cX - 6, cX - safeLeft + 24));
        const topGap = Math.min(maxGap, Math.max(96, W * (0.12 + sceneRatio() * 0.035)));
        const bottomGap = Math.min(maxGap, Math.max(80, topGap / r));
        const topY = cY - Math.min(118, Math.max(82, H * 0.18));
        const bottomY = cY + Math.min(112, Math.max(78, H * 0.17));

        const A = { x: cX - topGap, y: topY };
        const B = { x: cX + (doubleEightSplit - 0.5) * topGap, y: topY };
        const E = { x: cX + topGap, y: topY };
        const C = { x: cX - bottomGap, y: bottomY };
        const D = { x: cX + (doubleEightSplit - 0.5) * bottomGap, y: bottomY };
        const F = { x: cX + bottomGap, y: bottomY };
        const O1 = getLineIntersection(A, D, B, C);
        const O2 = getLineIntersection(B, F, E, D);
        const ratioLeft = Math.hypot(A.x - B.x, A.y - B.y) / Math.hypot(C.x - D.x, C.y - D.y);
        const ratioRight = Math.hypot(B.x - E.x, B.y - E.y) / Math.hypot(D.x - F.x, D.y - F.y);
        const hot = demoStage === "ratios" ? " is-hot" : "";
        const angleHot = demoStage === "angles" ? " is-hot" : "";
        lastDoubleEightModel = { A, B, C, D, E, F, O1, O2, cX, cY, topY, bottomY, topGap, bottomGap, ratioLeft, ratioRight };

        return `
            <g class="double-eight-chain" data-layer="double-eight-similarity">
                <rect class="model-spotlight" x="${fmt(cX - topGap - 34)}" y="${fmt(topY - 42)}" width="${fmt(topGap * 2 + 68)}" height="${fmt(bottomY - topY + 86)}" rx="18"></rect>
                <polygon class="double-eight-fill left" points="${fmt(A.x)},${fmt(A.y)} ${fmt(B.x)},${fmt(B.y)} ${fmt(O1.x)},${fmt(O1.y)}"></polygon>
                <polygon class="double-eight-fill left-match" points="${fmt(C.x)},${fmt(C.y)} ${fmt(D.x)},${fmt(D.y)} ${fmt(O1.x)},${fmt(O1.y)}"></polygon>
                <polygon class="double-eight-fill right" points="${fmt(B.x)},${fmt(B.y)} ${fmt(E.x)},${fmt(E.y)} ${fmt(O2.x)},${fmt(O2.y)}"></polygon>
                <polygon class="double-eight-fill right-match" points="${fmt(D.x)},${fmt(D.y)} ${fmt(F.x)},${fmt(F.y)} ${fmt(O2.x)},${fmt(O2.y)}"></polygon>

                <line class="double-eight-base top" x1="${fmt(A.x)}" y1="${fmt(A.y)}" x2="${fmt(E.x)}" y2="${fmt(E.y)}"></line>
                <line class="double-eight-base bottom" x1="${fmt(C.x)}" y1="${fmt(C.y)}" x2="${fmt(F.x)}" y2="${fmt(F.y)}"></line>
                <line class="double-eight-link${hot}" x1="${fmt(A.x)}" y1="${fmt(A.y)}" x2="${fmt(D.x)}" y2="${fmt(D.y)}"></line>
                <line class="double-eight-link${hot}" x1="${fmt(B.x)}" y1="${fmt(B.y)}" x2="${fmt(C.x)}" y2="${fmt(C.y)}"></line>
                <line class="double-eight-link${hot}" x1="${fmt(B.x)}" y1="${fmt(B.y)}" x2="${fmt(F.x)}" y2="${fmt(F.y)}"></line>
                <line class="double-eight-link${hot}" x1="${fmt(E.x)}" y1="${fmt(E.y)}" x2="${fmt(D.x)}" y2="${fmt(D.y)}"></line>
                <line class="double-eight-shared" x1="${fmt(B.x)}" y1="${fmt(B.y)}" x2="${fmt(D.x)}" y2="${fmt(D.y)}"></line>
                <line class="double-eight-drag-handle" data-drag-object="double-shared" x1="${fmt(B.x)}" y1="${fmt(B.y)}" x2="${fmt(D.x)}" y2="${fmt(D.y)}"></line>
                <circle class="double-eight-drag-handle" data-drag-object="double-o1" cx="${fmt(O1.x)}" cy="${fmt(O1.y)}" r="18"></circle>
                <circle class="double-eight-drag-handle" data-drag-object="double-o2" cx="${fmt(O2.x)}" cy="${fmt(O2.y)}" r="18"></circle>

                <text class="double-eight-label${angleHot}" x="${fmt(O1.x - 48)}" y="${fmt(O1.y - 24)}">左 8</text>
                <text class="double-eight-label${angleHot}" x="${fmt(O2.x + 18)}" y="${fmt(O2.y - 24)}">右 8</text>
                <text class="double-eight-ratio double-eight-note" x="${fmt(cX - 164)}" y="${fmt(bottomY + 52)}">双 8 字链：左比 ${ratioText(ratioLeft)}，右比 ${ratioText(ratioRight)}，共享 BD 传递</text>

                ${renderDoubleEightTeachingOverlay({ A, B, C, D, E, F, O1, O2, cX, bottomY, ratioLeft, ratioRight })}

                ${drawPointLabel("A", A, { cx: cX, cy: cY })}
                ${drawPointLabel("B", B, { cx: cX, cy: cY, force: { x: 12, y: -22 } })}
                ${drawPointLabel("E", E, { cx: cX, cy: cY })}
                ${drawPointLabel("C", C, { cx: cX, cy: cY })}
                ${drawPointLabel("D", D, { cx: cX, cy: cY, force: { x: 12, y: 30 } })}
                ${drawPointLabel("F", F, { cx: cX, cy: cY })}
                ${drawPointLabel("O1", O1, { cx: cX, cy: cY, label: "O1" })}
                ${drawPointLabel("O2", O2, { cx: cX, cy: cY, label: "O2" })}
            </g>
        `;
    }

    // ==========================================================================
    // 6. SVG 渲染逻辑
    // ==========================================================================
    function drawSVGPoint(id, pt, labelText, offset = { x: 12, y: 6 }, isDraggable = false) {
        let ptClass = "geo-point-wrapper";
        if (isDraggable) ptClass += " draggable-point draggable";
        const autoOffset = getLabelOffset(id, pt, { force: offset });

        let html = `
            <g class="${ptClass}" data-point-id="${id}">
                <circle class="geo-point-halo" cx="${pt.x}" cy="${pt.y}" r="${isDraggable ? 30 : 18}"></circle>
                <circle class="geo-point" cx="${pt.x}" cy="${pt.y}" r="6"></circle>
            </g>
        `;
        const textX = pt.x + autoOffset.x;
        const textY = pt.y + autoOffset.y;
        html += `<text class="geo-label geo-label-chip" x="${textX}" y="${textY}">${labelText}</text>`;
        return html;
    }

    function renderSVG() {
        const A = points.A;
        const B = points.B;
        const O = points.O;
        const C = points.C;
        const D = points.D;

        let drawHtml = "";

        if (isDoubleEightScene()) {
            drawHtml += renderDoubleEightModel();
            sandboxSvg.innerHTML = drawHtml;
            return;
        }

        // 1. 绘制对顶三角形的背景区域
        drawHtml += `
            <polygon class="geo-polygon-fill triangle-main ${demoStage === "identify" ? "demo-hot-fill" : ""}" points="${A.x},${A.y} ${B.x},${B.y} ${O.x},${O.y}"></polygon>
            <polygon class="geo-polygon-fill triangle-match ${demoStage === "identify" ? "demo-hot-fill" : ""}" points="${C.x},${C.y} ${D.x},${D.y} ${O.x},${O.y}"></polygon>
        `;

        // 2. 角度标记渲染 (内错角相等直观性)
        if (isParallelTeachingScene()) {
            // 平行8字：角标颜色随实时条件变化，避免自由探索时误标相等。
            const angleHot = demoStage === "angles" ? " demo-hot" : "";
            const angleState = getParallelAngleState(A, B, O, C, D);
            const primaryArcClass = angleState.primaryOk ? "" : " mismatch";
            const secondaryArcClass = angleState.secondaryOk ? " sector-warning" : " mismatch";
            const secondaryLineClass = angleState.secondaryOk ? " arc-warning" : " mismatch";
            drawHtml += `<path class="geo-angle-sector${primaryArcClass}${angleHot}" d="${getAngleArcPath(A, B, O, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${primaryArcClass}${angleHot}" d="${getAngleArcPath(A, B, O, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector${primaryArcClass}${angleHot}" d="${getAngleArcPath(D, C, O, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${primaryArcClass}${angleHot}" d="${getAngleArcPath(D, C, O, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector${secondaryArcClass}${angleHot}" d="${getAngleArcPath(B, A, O, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${secondaryLineClass}${angleHot}" d="${getAngleArcPath(B, A, O, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector${secondaryArcClass}${angleHot}" d="${getAngleArcPath(C, D, O, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${secondaryLineClass}${angleHot}" d="${getAngleArcPath(C, D, O, 22)}"></path>`;
            if (isBevelScene()) {
                drawHtml += renderAngleFindingOverlay(A, B, O, C, D);
            }
        } else if (currentScene === "rotated-similarity") {
            // 旋转8字：∠A = ∠C (绿色), ∠B = ∠D (橙色)
            const angleHot = demoStage === "angles" ? " demo-hot" : "";
            drawHtml += `<path class="geo-angle-sector${angleHot}" d="${getAngleArcPath(A, B, O, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${angleHot}" d="${getAngleArcPath(A, B, O, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector${angleHot}" d="${getAngleArcPath(C, D, O, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc${angleHot}" d="${getAngleArcPath(C, D, O, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector sector-warning${angleHot}" d="${getAngleArcPath(B, A, O, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc arc-warning${angleHot}" d="${getAngleArcPath(B, A, O, 22)}"></path>`;

            drawHtml += `<path class="geo-angle-sector sector-warning${angleHot}" d="${getAngleArcPath(D, C, O, 22, true)}"></path>`;
            drawHtml += `<path class="geo-angle-arc arc-warning${angleHot}" d="${getAngleArcPath(D, C, O, 22)}"></path>`;

            // 绘制角 AOC 的平分线辅助线
            const dxA = A.x - O.x, dyA = A.y - O.y;
            const lenA = Math.hypot(dxA, dyA);
            const dxC = C.x - O.x, dyC = C.y - O.y;
            const lenC = Math.hypot(dxC, dyC);

            let bisectX = (dxA / lenA) + (dxC / lenC);
            let bisectY = (dyA / lenA) + (dyC / lenC);
            const lenBisect = Math.hypot(bisectX, bisectY);
            if (lenBisect > 1e-4) {
                bisectX = (bisectX / lenBisect) * Math.max(lenA, lenC) * 0.9;
                bisectY = (bisectY / lenBisect) * Math.max(lenA, lenC) * 0.9;
                
                // 绘制两侧延长虚线，穿过 O 点
                drawHtml += `
                    <line class="geo-line-seg seg-connect" x1="${O.x - bisectX}" y1="${O.y - bisectY}" x2="${O.x + bisectX}" y2="${O.y + bisectY}" stroke-dasharray="4 4"></line>
                `;
            }
        }

        // 3. 线段骨架绘制
        if (isParallelTeachingScene() || currentScene === "rotated-similarity") {
            // 场景 1 和 3：标准 8 字连线
            const sideHot = demoStage === "ratios" ? " demo-hot-line" : "";
            drawHtml += `
                <line class="geo-line-seg seg-oa${sideHot}" x1="${A.x}" y1="${A.y}" x2="${O.x}" y2="${O.y}"></line>
                <line class="geo-line-seg seg-od${sideHot}" x1="${O.x}" y1="${O.y}" x2="${D.x}" y2="${D.y}"></line>
                <line class="geo-line-seg seg-ob${sideHot}" x1="${B.x}" y1="${B.y}" x2="${O.x}" y2="${O.y}"></line>
                <line class="geo-line-seg seg-oc${sideHot}" x1="${O.x}" y1="${O.y}" x2="${C.x}" y2="${C.y}"></line>
            `;
            // 两平行/不平行底边
            drawHtml += `<line class="geo-line-seg seg-ab${sideHot}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"></line>`;
            const cdClass = isParallelTeachingScene() ? "seg-cd" : "seg-cd-rotated";
            drawHtml += `<line class="geo-line-seg ${cdClass}${sideHot}" x1="${C.x}" y1="${C.y}" x2="${D.x}" y2="${D.y}"></line>`;
            drawHtml += `
                <line class="geo-drag-hotline" data-drag-object="segment-AB" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"></line>
                <line class="geo-drag-hotline" data-drag-object="segment-CD" x1="${C.x}" y1="${C.y}" x2="${D.x}" y2="${D.y}"></line>
            `;
        } else if (currentScene === "intercept-theorem") {
            // 场景 2：高亮分段线段 OA, OD, OB, OC (配合 CSS 配色)
            const sideHot = demoStage === "ratios" ? " demo-hot-line" : "";
            drawHtml += `
                <line class="geo-line-seg seg-oa${sideHot}" x1="${A.x}" y1="${A.y}" x2="${O.x}" y2="${O.y}"></line>
                <line class="geo-line-seg seg-od${sideHot}" x1="${O.x}" y1="${O.y}" x2="${D.x}" y2="${D.y}"></line>
                <line class="geo-line-seg seg-ob${sideHot}" x1="${B.x}" y1="${B.y}" x2="${O.x}" y2="${O.y}"></line>
                <line class="geo-line-seg seg-oc${sideHot}" x1="${O.x}" y1="${O.y}" x2="${C.x}" y2="${C.y}"></line>
                <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="var(--text-muted)" stroke-dasharray="4 3" stroke-width="2.5"></line>
                <line class="geo-line-seg" x1="${C.x}" y1="${C.y}" x2="${D.x}" y2="${D.y}" stroke="var(--text-muted)" stroke-dasharray="4 3" stroke-width="2.5"></line>
                <line class="geo-drag-hotline" data-drag-object="segment-AB" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"></line>
                <line class="geo-drag-hotline" data-drag-object="segment-CD" x1="${C.x}" y1="${C.y}" x2="${D.x}" y2="${D.y}"></line>
            `;
        }

        if (isBevelScene()) {
            drawHtml += renderFlatBevelGuides(A, B, O, C, D);
        }

        // 4. 重合动画叠加层绘制
        const t = renderValues.animProgress;
        if (t > 0.001) {
            if (isParallelTeachingScene()) {
                // 平行8字形相似动画：绕 O 旋转 180° (t * PI) 并乘以放大因子 (1 + t * (1/r - 1))
                const rVal = renderValues.ratioSim;
                const scaleFactor = 1.0 + t * (1.0 / rVal - 1.0);
                const rotAngle = t * Math.PI;

                // 旋转放大后的 C, D
                const vecOC = { x: C.x - O.x, y: C.y - O.y };
                const vecOD = { x: D.x - O.x, y: D.y - O.y };

                const rotC = rotateVector(vecOC, rotAngle);
                const rotD = rotateVector(vecOD, rotAngle);

                const animC = { x: O.x + scaleFactor * rotC.x, y: O.y + scaleFactor * rotC.y };
                const animD = { x: O.x + scaleFactor * rotD.x, y: O.y + scaleFactor * rotD.y };

                const animPlatePath = getRoundedPolygonPath([O, animC, animD], isBevelScene() ? 16 : 8);
                drawHtml += `
                    <!-- 旋转放大叠放三角形 -->
                    <polygon class="geo-polygon-fill highlight-fill-1" points="${O.x},${O.y} ${animC.x},${animC.y} ${animD.x},${animD.y}"></polygon>
                    <line class="geo-line-seg" x1="${O.x}" y1="${O.y}" x2="${animC.x}" y2="${animC.y}" stroke="var(--success)" stroke-width="5.5"></line>
                    <line class="geo-line-seg" x1="${O.x}" y1="${O.y}" x2="${animD.x}" y2="${animD.y}" stroke="var(--primary)" stroke-width="5.5"></line>
                    <line class="geo-line-seg seg-cd" x1="${animC.x}" y1="${animC.y}" x2="${animD.x}" y2="${animD.y}" stroke-width="6"></line>

                    <!-- 端点标记 -->
                    <circle cx="${O.x}" cy="${O.y}" r="8" fill="var(--primary)" opacity="0.85"></circle>
                    <circle cx="${animC.x}" cy="${animC.y}" r="8" fill="var(--success)" opacity="0.85"></circle>
                    <circle cx="${animD.x}" cy="${animD.y}" r="8" fill="var(--primary)" opacity="0.85"></circle>
                `;
            } else if (currentScene === "rotated-similarity") {
                // 反平行8字相似动画：绕角 AOC 的平分线轴向镜像翻折 (cosFold)，并等比缩放
                const lenOA = Math.hypot(A.x - O.x, A.y - O.y);
                const lenOC = Math.hypot(C.x - O.x, C.y - O.y);
                
                const targetScale = lenOA / lenOC; // 将 C 的长度拉到 A，也就是相似比
                const currentScale = 1.0 + t * (targetScale - 1.0);
                const cosFold = Math.cos(t * Math.PI);

                // 计算角 AOC 的平分线单位向量
                const dxA = A.x - O.x, dyA = A.y - O.y;
                const lenA = Math.hypot(dxA, dyA);
                const dxC = C.x - O.x, dyC = C.y - O.y;
                const lenC = Math.hypot(dxC, dyC);

                let bx = (dxA / lenA) + (dxC / lenC);
                let by = (dyA / lenA) + (dyC / lenC);
                const lenBisect = Math.hypot(bx, by);
                if (lenBisect > 1e-4) {
                    bx /= lenBisect;
                    by /= lenBisect;
                } else {
                    bx = -dyA / lenA;
                    by = dxA / lenA;
                }

                // 翻折坐标计算
                const getFoldedPoint = (pt) => {
                    const dx = pt.x - O.x;
                    const dy = pt.y - O.y;
                    const proj = dx * bx + dy * by;
                    const px = proj * bx;
                    const py = proj * by;
                    const qx = dx - px;
                    const qy = dy - py;

                    const animX = O.x + currentScale * (px + qx * cosFold);
                    const animY = O.y + currentScale * (py + qy * cosFold);
                    return { x: animX, y: animY };
                };

                const animC = getFoldedPoint(C);
                const animD = getFoldedPoint(D);

                drawHtml += `
                    <!-- 3D 镜像翻转缩放三角形 -->
                    <polygon class="geo-polygon-fill highlight-fill-3" points="${O.x},${O.y} ${animC.x},${animC.y} ${animD.x},${animD.y}"></polygon>
                    <line class="geo-line-seg" x1="${O.x}" y1="${O.y}" x2="${animC.x}" y2="${animC.y}" stroke="var(--success)" stroke-width="5"></line>
                    <line class="geo-line-seg" x1="${O.x}" y1="${O.y}" x2="${animD.x}" y2="${animD.y}" stroke="var(--primary)" stroke-width="5"></line>
                    <line class="geo-line-seg seg-cd-rotated" x1="${animC.x}" y1="${animC.y}" x2="${animD.x}" y2="${animD.y}" stroke-width="5.5"></line>

                    <!-- 端点标记 -->
                    <circle cx="${O.x}" cy="${O.y}" r="8" fill="var(--purple)" opacity="0.85"></circle>
                    <circle cx="${animC.x}" cy="${animC.y}" r="8" fill="var(--success)" opacity="0.85"></circle>
                    <circle cx="${animD.x}" cy="${animD.y}" r="8" fill="var(--primary)" opacity="0.85"></circle>
                `;
            }
        }

        // 5. 几何焦点与拖拽点：O、A、B、C、D 都可直接拖动验证结构变化
        drawHtml += drawSVGPoint("O", O, "O", null, true);
        drawHtml += drawSVGPoint("A", A, "A", null, true);
        drawHtml += drawSVGPoint("B", B, "B", null, true);
        drawHtml += drawSVGPoint("C", C, "C", null, true);
        drawHtml += drawSVGPoint("D", D, "D", null, true);

        sandboxSvg.innerHTML = drawHtml;
    }

    // ==========================================================================
    // 7. HTML 浮动文字标注与板书算式渲染
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        const A = points.A;
        const B = points.B;
        const O = points.O;
        const C = points.C;
        const D = points.D;

        let overlayHtml = "";

        const getMidpoint = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

        if (renderValues.animProgress < 0.01) {
            const midAB = getMidpoint(A, B);
            const midCD = getMidpoint(C, D);
            const midO = { x: O.x + 18, y: O.y - 34 };

            if (isParallelTeachingScene()) {
                const ratioOA_OD = renderValues.oa / renderValues.od;
                const ratioOB_OC = renderValues.ob / renderValues.oc;
                const ratioAB_CD = renderValues.ab / renderValues.cd;

                if (!isBevelScene()) {
                    overlayHtml += `
                        <div class="brace-label relation" style="left:${midAB.x}px; top:${midAB.y - 18}px">AB ∥ CD</div>
                        <div class="brace-label angle" style="left:${midO.x}px; top:${midO.y}px">对顶角</div>
                        <div class="brace-label main" style="left:${midCD.x}px; top:${midCD.y + 18}px">比例 ${ratioText((ratioOA_OD + ratioOB_OC + ratioAB_CD) / 3)}</div>
                    `;
                }
            } else if (currentScene === "rotated-similarity") {
                const ratioOA_OC = renderValues.oa / renderValues.oc;
                const ratioOB_OD = renderValues.ob / renderValues.od;

                overlayHtml += `
                    <div class="brace-label angle" style="left:${midO.x}px; top:${midO.y}px">O↔O</div>
                    <div class="brace-label relation" style="left:${midAB.x}px; top:${midAB.y - 18}px">A↔C，B↔D</div>
                    <div class="brace-label main" style="left:${midCD.x}px; top:${midCD.y + 18}px">交叉比 ${ratioText((ratioOA_OC + ratioOB_OD) / 2)}</div>
                `;
            } else if (currentScene === "intercept-theorem") {
                const ratioOA_OD = renderValues.oa / renderValues.od;
                const ratioOB_OC = renderValues.ob / renderValues.oc;
                const leftMid = {
                    x: O.x + (A.x - O.x) * 0.62,
                    y: O.y + (A.y - O.y) * 0.62 - 4
                };
                const rightMid = {
                    x: O.x + (B.x - O.x) * 0.62,
                    y: O.y + (B.y - O.y) * 0.62 - 4
                };
                const relationPos = { x: O.x, y: O.y - 96 };

                overlayHtml += `
                    <div class="brace-label main ratio-left" style="left:${leftMid.x}px; top:${leftMid.y}px">OA/OD = ${ratioText(ratioOA_OD)}</div>
                    <div class="brace-label success-lbl ratio-right" style="left:${rightMid.x}px; top:${rightMid.y}px">OB/OC = ${ratioText(ratioOB_OC)}</div>
                    <div class="brace-label relation ratio-center" style="left:${relationPos.x}px; top:${relationPos.y}px">成比例</div>
                `;
            }
        }

        overlayHtml += renderConditionFeedback();
        htmlOverlay.innerHTML = overlayHtml;
        positionOverlayLabels();
        updateChalkboardHUD();
    }

    function updateChalkboardHUD() {
        let html = "";

        const oa = renderValues.oa;
        const ob = renderValues.ob;
        const oc = renderValues.oc;
        const od = renderValues.od;
        const ab = renderValues.ab;
        const cd = renderValues.cd;

        if (isParallelTeachingScene()) {
            const ratioOA_OD = oa / od;
            const ratioOB_OC = ob / oc;
            const ratioAB_CD = ab / cd;
            const angleState = getParallelAngleState(points.A, points.B, points.O, points.C, points.D);
            const ratioState = ratioClass([ratioOA_OD, ratioOB_OC, ratioAB_CD]);
            const state = angleState.allOk ? ratioState : "warn";
            const conditionLine = angleState.parallelOk ? "AB ∥ CD，AD 与 BC 交于 O" : `AB 与 CD 夹角差 ${formatAngleDelta(angleState.parallelDelta)}，平行条件未成立`;
            const conclusionLine = angleState.allOk && state !== "warn" ? "<b>△OAB ∽ △ODC</b>" : "角条件未齐，暂不能判相似";

            html = `
                <div class="hud-proof-line"><span>${isBevelScene() ? "找角" : "条件"}</span> ${conditionLine}</div>
                <div class="hud-proof-line"><span>角</span> ${angleState.proofLine}</div>
                <div class="hud-proof-line"><span>结论</span> ${conclusionLine}</div>
                <div class="hud-equation-box ${state}-box">
                    <div class="title">${ratioWord(state)}</div>
                    <div class="formula compact-formula">
                        <div>OA/OD <b>${ratioText(ratioOA_OD)}</b></div>
                        <div>OB/OC <b>${ratioText(ratioOB_OC)}</b></div>
                        <div>AB/CD <b>${ratioText(ratioAB_CD)}</b></div>
                    </div>
                </div>
            `;
        } else if (isDoubleEightScene()) {
            const ratio = 1 / renderValues.ratioSim;
            html = `
                <div class="hud-proof-line"><span>拆解</span> 左右各一个 8 字相似模型</div>
                <div class="hud-proof-line"><span>左 8</span> <b>△O₁AB ∽ △O₁DC</b></div>
                <div class="hud-proof-line"><span>右 8</span> <b>△O₂BE ∽ △O₂FD</b></div>
                <div class="hud-equation-box ok-box">
                    <div class="title">链式比例</div>
                    <div class="formula compact-formula">
                        <div>AB/CD <b>${ratioText(ratio)}</b></div>
                        <div>BE/DF <b>${ratioText(ratio)}</b></div>
                        <div>共享 B/D <b>传递</b></div>
                    </div>
                </div>
            `;
        } else if (currentScene === "intercept-theorem") {
            const ratioOA_OD = oa / od;
            const ratioOB_OC = ob / oc;
            const state = ratioClass([ratioOA_OD, ratioOB_OC]);

            html = `
                <div class="hud-proof-line"><span>截线</span> AB ∥ CD</div>
                <div class="hud-proof-line"><span>定理</span> 两条截线被平行线截，所得对应线段成比例</div>
                <div class="hud-proof-line"><span>结论</span> <b>OA/OD = OB/OC</b></div>
                <div class="hud-equation-box ${state}-box">
                    <div class="title">${ratioWord(state)}</div>
                    <div class="formula compact-formula two-cols">
                        <div>OA/OD <b>${ratioText(ratioOA_OD)}</b></div>
                        <div>OB/OC <b>${ratioText(ratioOB_OC)}</b></div>
                    </div>
                </div>
            `;
        } else if (currentScene === "rotated-similarity") {
            const ratioOA_OC = oa / oc;
            const ratioOB_OD = ob / od;
            const ratioAB_CD = ab / cd;
            const state = ratioClass([ratioOA_OC, ratioOB_OD, ratioAB_CD]);

            html = `
                <div class="hud-proof-line"><span>对应</span> A↔C，B↔D，O↔O</div>
                <div class="hud-proof-line"><span>角</span> ∠A=∠C，∠AOB=∠COD</div>
                <div class="hud-proof-line"><span>结论</span> <b>△OAB ∽ △OCD</b></div>
                <div class="hud-equation-box ${state}-box">
                    <div class="title">${ratioWord(state)}</div>
                    <div class="formula compact-formula">
                        <div>OA/OC <b>${ratioText(ratioOA_OC)}</b></div>
                        <div>OB/OD <b>${ratioText(ratioOB_OD)}</b></div>
                        <div>AB/CD <b>${ratioText(ratioAB_CD)}</b></div>
                    </div>
                </div>
            `;
        }
        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 定理深度解析(卡片文本更新)
    // ==========================================================================
    function getTeachingRoute(scene = currentScene) {
        const routes = {
            "parallel-similarity": {
                title: "平行 8 字教学任务",
                steps: [
                    ["识别", "先圈出 △OAB 与 △ODC，确认它们夹在两条相交线之间。"],
                    ["依据", "用 AB ∥ CD 得到两组对应角，再补对顶角。"],
                    ["比例", "按对应点写 OA/OD = OB/OC = AB/CD。"],
                    ["讲题", "先写相似三角形，再写比例式，最后代数求值。"]
                ],
                alert: "易错提醒：不要把 OD 写成 OC；先定对应点，再写比例。"
            },
            "intercept-theorem": {
                title: "截线比例教学任务",
                steps: [
                    ["识别", "看两条相交截线被 AB、CD 两条平行线截出分段。"],
                    ["依据", "平行线分线段成比例，不需要先证明三角形全等。"],
                    ["比例", "对应写 OA/OD = OB/OC，再与题目数据联立。"],
                    ["讲题", "把未知量放在同一条比例式里，减少跨式换算。"]
                ],
                alert: "易错提醒：这是分段比，不是整条线段比；注意 O 在中间。"
            },
            "rotated-similarity": {
                title: "反 8 字教学任务",
                steps: [
                    ["识别", "先找交叉对应：A 对 C，B 对 D，O 对 O。"],
                    ["依据", "用对顶角和对应角确认 △OAB ∽ △OCD。"],
                    ["比例", "按交叉顺序写 OA/OC = OB/OD = AB/CD。"],
                    ["讲题", "先画对应箭头，再写相似式，避免顺序写反。"]
                ],
                alert: "易错提醒：反 8 字最容易把 A↔D、B↔C 写反。"
            },
            "bevel-similarity": {
                title: "倒角模型教学任务",
                steps: [
                    ["倒角线", "拖动倒角量，观察倒角线 ∥ AB、倒角线 ∥ CD。"],
                    ["找角", "由平行线找 ∠A=∠D、∠B=∠C，再补 O 点对顶角。"],
                    ["比例", "角关系成立后，列 OA/OD = OB/OC = AB/CD。"],
                    ["验证", "播放重合验证，确认倒角变化不改变 8 字相似本质。"]
                ],
                alert: "易错提醒：倒角线是暴露角关系的辅助，最后仍要回到 8 字相似判定。"
            },
            "double-eight-similarity": {
                title: "双 8 字教学任务",
                steps: [
                    ["识别", "把整体拆成左 8：△O₁AB∽△O₁DC；右 8：△O₂BE∽△O₂FD。"],
                    ["依据", "每一侧都先按单 8 字证明相似。"],
                    ["比例", "分别写 AB/CD 与 BE/DF，再通过共享 B/D 串联。"],
                    ["讲题", "综合题先拆模型，再找公共线段或公共比例传递。"]
                ],
                alert: "易错提醒：双 8 字不能一眼写总比例，必须先拆两组。"
            }
        };
        return routes[scene] || routes["parallel-similarity"];
    }

    function renderTeachingRoute(scene = currentScene) {
        const route = getTeachingRoute(scene);
        return `
            <div class="teaching-route-card">
                <div class="teaching-route-title">教学任务</div>
                ${route.steps.map((step, index) => `
                    <div class="teaching-route-step">
                        <span>${index + 1}</span>
                        <div><b>${step[0]}</b><em>${step[1]}</em></div>
                    </div>
                `).join("")}
                <div class="teaching-route-alert"><b>易错提醒</b><span>${route.alert}</span></div>
            </div>
        `;
    }

    function setTheoryPanelContent(titleHtml, bodyHtml) {
        if (theoryTitle) theoryTitle.innerHTML = titleHtml;
        if (theoryText) theoryText.innerHTML = bodyHtml;

        // 系统接入后右侧面板位于独立 ShadowRoot，显式同步一次避免引用停留在源 DOM。
        document.querySelectorAll('[data-card-id="jm_model_m10"]').forEach(host => {
            const root = host.shadowRoot;
            if (!root) return;
            const titleNode = root.querySelector("#theory-title");
            const textNode = root.querySelector("#theory-text");
            if (titleNode) titleNode.innerHTML = titleHtml;
            if (textNode) textNode.innerHTML = bodyHtml;
        });
    }

    function updateTheoryContent() {
        if (sectionTheoryCard) {
            sectionTheoryCard.style.display = isBevelScene() ? "none" : "";
        }
        if (isBevelScene()) {
            updateSceneStatus();
            return;
        }
        if (currentScene === "parallel-similarity") {
            setTheoryPanelContent(getTeachingRoute().title, renderTeachingRoute());
        } else if (isDoubleEightScene()) {
            setTheoryPanelContent(getTeachingRoute().title, renderTeachingRoute());
        } else if (currentScene === "intercept-theorem") {
            setTheoryPanelContent(getTeachingRoute().title, renderTeachingRoute());
        } else if (currentScene === "rotated-similarity") {
            setTheoryPanelContent(getTeachingRoute().title, renderTeachingRoute());
        }
        updateSceneStatus();
    }

    // ==========================================================================
    // 9. LERP 平滑渲染循环与动画处理
    // ==========================================================================
    function updateLerp() {
        const k = 0.16;

        // 特殊形状预设平滑滑动缓动过渡
        if (isPresetTransitioning) {
            const k_p = 0.11; // 预设滑移系数
            points.A.x += (targetPoints.A.x - points.A.x) * k_p;
            points.A.y += (targetPoints.A.y - points.A.y) * k_p;
            points.B.x += (targetPoints.B.x - points.B.x) * k_p;
            points.B.y += (targetPoints.B.y - points.B.y) * k_p;
            ratioSim += (targetRatioSim - ratioSim) * k_p;

            sliderRatioSim.value = ratioSim;
            valRatioSim.textContent = ratioSim.toFixed(2);

            const dA = Math.hypot(points.A.x - targetPoints.A.x, points.A.y - targetPoints.A.y);
            const dB = Math.hypot(points.B.x - targetPoints.B.x, points.B.y - targetPoints.B.y);
            const dR = Math.abs(ratioSim - targetRatioSim);

            if (dA < 0.25 && dB < 0.25 && dR < 0.003) {
                points.A = { ...targetPoints.A };
                points.B = { ...targetPoints.B };
                ratioSim = targetRatioSim;
                isPresetTransitioning = false;
            }
        }

        // 对相似比进行平滑缓动
        renderValues.ratioSim += (ratioSim - renderValues.ratioSim) * k;

        // 平滑过渡重合动画
        if (animDirection !== 0) {
            animProgress += animDirection * 0.018;
            if (animProgress >= 1.0) {
                animProgress = 1.0;
                animDirection = 0;
                isAnimating = false;

                // 重合瞬间，在顶点 A 和 B 处爆发粒子
                const rect = sandboxSvg.getBoundingClientRect();
                const sA = { x: rect.left + points.A.x * zoomScale, y: rect.top + points.A.y * zoomScale };
                const sB = { x: rect.left + points.B.x * zoomScale, y: rect.top + points.B.y * zoomScale };

                spawnExplosion(sA.x, sA.y, "#3b82f6");
                spawnExplosion(sB.x, sB.y, currentScene === "rotated-similarity" ? "#8b5cf6" : "#10b981");
                if (demoStage === "fold") {
                    demoStage = "result";
                    setStatus("结论停留", currentScene === "rotated-similarity" ? "△OAB∽△OCD，交叉比例成立。" : "△OAB∽△ODC，对应比例成立。", "result");
                    btnPlayFolding.disabled = false;
                    btnPlayFolding.innerHTML = `
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
                        再演示一遍
                    `;
                }
            } else if (animProgress <= 0.0) {
                animProgress = 0.0;
                animDirection = 0;
                isAnimating = false;
            }
        }
        renderValues.animProgress += (animProgress - renderValues.animProgress) * 0.3;

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
        if (!lerpId) loop();
    }
    startLerpLoop();

    function playFoldingAnimation() {
        if (isAnimating || currentScene === "intercept-theorem") return;
        clearDemoTimer();
        isAnimating = true;
        btnPlayFolding.disabled = true;
        animProgress = 0;
        animDirection = 0;
        demoStage = "identify";
        setStatus("第 1 步：识别结构", isDoubleEightScene() ? "先把整体拆成左 8 字和右 8 字两组。" : isBevelScene() ? "先看 8 字本体，再看 O 点两侧的倒角线。" : "先把两个交叉三角形看出来：上方一个，下方一个。", "demo");
        btnPlayFolding.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,20A8,8 0 0,1 4,12H2.5L5,9.5L7.5,12H6A6,6 0 0,0 12,18V20M12,4A8,8 0 0,1 20,12H21.5L19,14.5L16.5,12H18A6,6 0 0,0 12,6V4Z"/></svg>
            演示中
        `;

        queueDemoStep(900, () => {
            demoStage = "angles";
            setStatus("第 2 步：找角", currentScene === "rotated-similarity" ? "反 8 字先看 A↔C，再看对顶角 O。" : isDoubleEightScene() ? "分别找 O1、O2 的对顶角和两组平行底边。" : isBevelScene() ? "倒角线暴露平行关系，按 ①∠A=∠D、②∠B=∠C、③对顶角 找角。" : "平行线给出对应角，对顶角在 O 点。", "proof");
        });

        queueDemoStep(1900, () => {
            demoStage = "ratios";
            setStatus("第 3 步：出比例", currentScene === "rotated-similarity" ? "OA/OC、OB/OD、AB/CD 是同一组比例。" : isDoubleEightScene() ? "左 8 和右 8 分别出比例，再用共享 B/D 串联。" : isBevelScene() ? "倒角量只改倒角线位置，不改变 OA/OD、OB/OC、AB/CD 的比例链。" : "OA/OD、OB/OC、AB/CD 是同一组比例。", "proof");
        });

        queueDemoStep(3000, () => {
            demoStage = "fold";
            setStatus("第 4 步：重合验证", currentScene === "rotated-similarity" ? "用翻折和缩放验证对应三角形重合。" : isDoubleEightScene() ? "把两个 8 字比例链合并，得到综合题的传递关系。" : isBevelScene() ? "保持平面图，播放重合验证倒角模型仍回到 8 字相似。" : "绕 O 旋转 180° 并缩放，验证重合。", "demo");
            animDirection = 1;
        });
    }


    // ==========================================================================
    // 10. 交互场景切换与预设形状滑移
    // ==========================================================================
    function loadScene(scene) {
        clearDemoTimer();
        currentScene = scene;
        demoStage = "explore";
        animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;
        btnPlayFolding.disabled = false;

        btnPlayFolding.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
            自动演示
        `;

        // 1. 高亮预设按钮
        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === scene) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // 2. 比例调节名称自适应
        if (scene === "rotated-similarity") {
            labelRatioSim.textContent = "相似比 (OA/OC)：";
            sliderRatioSim.min = 0.45;
            sliderRatioSim.max = 1.30;
        } else {
            labelRatioSim.textContent = "相似比 (OC/OB)：";
            sliderRatioSim.min = 0.45;
            sliderRatioSim.max = 1.40;
        }

        // 3. 场景 2 隐藏重合控制
        const groupDemoControls = document.getElementById("section-demo-controls");
        if (scene === "intercept-theorem") {
            groupDemoControls.style.display = "none";
        } else {
            groupDemoControls.style.display = "block";
        }
        controlGroupBevelDepth.style.display = isBevelScene(scene) ? "grid" : "none";

        updateTheoryContent();
        // 如果不是在特殊形状预设过渡中，则执行常规居中重置
        if (!isPresetTransitioning) {
            centerModel();
        }
        solveGeometry();
    }

    function setInteractionMode(mode) {
        if (!["free", "snap", "teach"].includes(mode)) return;
        interactionMode = mode;
        document.querySelectorAll(".btn-interaction-mode").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-interaction-mode") === mode);
        });

        clearDemoTimer();
        demoStage = mode === "teach" ? "angles" : "explore";
        animProgress = 0;
        animDirection = 0;
        isAnimating = false;
        btnPlayFolding.disabled = false;
        setPlayButtonIdle();

        if (mode !== "free") {
            solveGeometry();
        }

        const modeCopy = {
            free: ["自由探索", "C、D 和整段都可直接拖动，适合构造反例和观察条件变化。"],
            snap: ["吸附验证", "拖动后自动回到 8 字比例链，适合快速验证相似关系。"],
            teach: ["教师演示", "保留吸附验证，并突出角、比例、共享线段这些课堂讲解线索。"]
        }[mode];
        setStatus(modeCopy[0], modeCopy[1], mode === "free" ? "explore" : "proof");
        renderSVG();
        updateHTMLOverlayAndHUD();
    }

    function triggerShapePreset(shape) {
        isPresetTransitioning = true;
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;
        const cX = W / 2;
        const cY = H / 2 - 20;

        points.O.x = cX;
        points.O.y = cY;

        if (shape === "isoc-8") {
            loadScene("parallel-similarity");
            targetPoints.A = { x: cX - 130, y: cY - 100 };
            targetPoints.B = { x: cX + 130, y: cY - 100 };
            targetRatioSim = 0.85;
        } else if (shape === "right-8") {
            loadScene("parallel-similarity");
            targetPoints.A = { x: cX, y: cY - 120 };
            targetPoints.B = { x: cX + 140, y: cY - 120 };
            targetRatioSim = 0.80;
        } else if (shape === "rotated-8") {
            loadScene("rotated-similarity");
            targetPoints.A = { x: cX - 130, y: cY - 100 };
            targetPoints.B = { x: cX + 140, y: cY - 80 };
            targetRatioSim = 0.85;
        }
    }

    function resetState() {
        clearDemoTimer();
        demoStage = "explore";
        ratioSim = 0.75;
        sliderRatioSim.value = 0.75;
        valRatioSim.textContent = "0.75";
        bevelDepth = 0.18;
        sliderBevelDepth.value = bevelDepth;
        valBevelDepth.textContent = "18%";

        animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;
        isPresetTransitioning = false;
        btnPlayFolding.disabled = false;

        btnPlayFolding.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
            自动演示
        `;

        centerModel();
        solveGeometry();
        updateSceneStatus();
    }

    // 自适应居中
    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        const isDesktop = window.innerWidth > 900;
        const hudW = isHudExpanded ? 300 : 130;
        const visibleW = isDesktop ? Math.max(420, W - hudW - 24) : W;

        zoomScale = isDesktop ? Math.min(1.18, Math.max(0.92, visibleW / 680)) : Math.min(1.05, Math.max(0.78, W / 760));
        panX = isDesktop ? hudW + 18 + (visibleW - W) / 2 : 0;
        panY = isDesktop ? 8 : 0;

        centerX = isDesktop ? (W / 2 + hudW * 0.18) : W / 2;
        centerY = H / 2 - 20;

        points.O.x = centerX;
        points.O.y = centerY;
        points.A = { x: centerX - 130, y: centerY - 100 };
        points.B = { x: centerX + 130, y: centerY - 100 };

        updateTransform();
    }

    window.addEventListener("resize", () => window.setTimeout(centerModel, 80));
    window.visualViewport?.addEventListener?.("resize", () => window.setTimeout(centerModel, 80));

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
        updateSvgViewport();
        positionOverlayLabels();
    }

    // ==========================================================================
    // 11. 手势与鼠标拖拽 (含顶点互斥防拥挤机制)
    // ==========================================================================
    function zoomAt(factor, targetX, targetY) {
        const oldScale = zoomScale;
        zoomScale = Math.min(Math.max(zoomScale * factor, 0.55), 3.0);
        const localX = (targetX - panX) / oldScale;
        const localY = (targetY - panY) / oldScale;
        panX = targetX - localX * zoomScale;
        panY = targetY - localY * zoomScale;
        updateTransform();
    }

    function zoomAtCenter(factor) {
        const { w, h } = getSandboxSize();
        zoomAt(factor, w / 2, h / 2);
    }

    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        const rect = sandboxWrapper.getBoundingClientRect();
        zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    function setPlayButtonIdle(label = "自动演示") {
        btnPlayFolding.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
            ${label}
        `;
    }

    function resetDemoForDirectEdit() {
        clearDemoTimer();
        demoStage = "explore";
        animProgress = 0;
        animDirection = 0;
        isAnimating = false;
        btnPlayFolding.disabled = false;
        setPlayButtonIdle();
        isPresetTransitioning = false;
        updateSceneStatus();
    }

    function copyDoubleEightModel(model = lastDoubleEightModel) {
        if (!model) return null;
        return {
            ...model,
            A: { ...model.A },
            B: { ...model.B },
            C: { ...model.C },
            D: { ...model.D },
            E: { ...model.E },
            F: { ...model.F },
            O1: { ...model.O1 },
            O2: { ...model.O2 }
        };
    }

    function clampCanvasPoint(pt, margin = 36) {
        const { w, h } = getSandboxSize();
        return {
            x: clamp(pt.x, margin, Math.max(margin, w - margin)),
            y: clamp(pt.y, margin, Math.max(margin, h - margin))
        };
    }

    function clampDeltaForPoints(startPts, dx, dy, margin = 42) {
        const { w, h } = getSandboxSize();
        let minDx = -Infinity;
        let maxDx = Infinity;
        let minDy = -Infinity;
        let maxDy = Infinity;
        startPts.forEach(pt => {
            minDx = Math.max(minDx, margin - pt.x);
            maxDx = Math.min(maxDx, w - margin - pt.x);
            minDy = Math.max(minDy, margin - pt.y);
            maxDy = Math.min(maxDy, h - margin - pt.y);
        });
        return {
            dx: clamp(dx, minDx, maxDx),
            dy: clamp(dy, minDy, maxDy)
        };
    }

    function setRatioFromProjectedPoint(pointId, localX, localY) {
        const O = points.O;
        if (pointId === "C") {
            const vecOB = { x: points.B.x - O.x, y: points.B.y - O.y };
            const lenOB = Math.hypot(vecOB.x, vecOB.y);
            const vecOCDrag = { x: O.x - localX, y: O.y - localY };
            const lenSq = lenOB * lenOB;
            const t = lenSq > 1e-4 ? (vecOCDrag.x * vecOB.x + vecOCDrag.y * vecOB.y) / lenSq : ratioSim;
            if (currentScene === "rotated-similarity") {
                const lenOA = Math.hypot(points.A.x - O.x, points.A.y - O.y);
                const lenOC = Math.max(1e-2, t * lenOB);
                setRatioSimValue(lenOA / lenOC);
            } else {
                setRatioSimValue(t);
            }
        } else if (pointId === "D") {
            const vecOA = { x: points.A.x - O.x, y: points.A.y - O.y };
            const lenOA = Math.hypot(vecOA.x, vecOA.y);
            const vecODDrag = { x: O.x - localX, y: O.y - localY };
            const lenSq = lenOA * lenOA;
            const t = lenSq > 1e-4 ? (vecODDrag.x * vecOA.x + vecODDrag.y * vecOA.y) / lenSq : ratioSim;
            if (currentScene === "rotated-similarity") {
                const lenOB = Math.hypot(points.B.x - O.x, points.B.y - O.y);
                const lenOD = Math.max(1e-2, t * lenOA);
                setRatioSimValue(lenOB / lenOD);
            } else {
                setRatioSimValue(t);
            }
        }
    }

    function applyDragPoint(pointId, localX, localY) {
        const O = points.O;
        const { w, h } = getSandboxSize();

        if (pointId === "O") {
            const next = clampCanvasPoint({ x: localX, y: localY }, 58);
            const prev = { ...points.O };
            points.O.x = next.x;
            points.O.y = next.y;
            if (!validateGeometry()) points.O = prev;
            return;
        }

        if (pointId === "A" || pointId === "B") {
            const otherPtId = pointId === "A" ? "B" : "A";
            const otherPt = points[otherPtId];
            let tx = clamp(localX, 46, Math.max(46, w - 46));
            let ty = clamp(localY, 36, Math.max(36, Math.min(h - 46, O.y - 45)));

            const dxO = tx - O.x;
            const dyO = ty - O.y;
            const dO = Math.hypot(dxO, dyO);
            if (dO < 80) {
                const fallbackX = pointId === "A" ? -1 : 1;
                const ux = dO > 1 ? dxO / dO : fallbackX;
                const uy = dO > 1 ? dyO / dO : -0.35;
                tx = O.x + ux * 80;
                ty = O.y + uy * 80;
            }

            const minAB = currentScene === "rotated-similarity" ? Math.max(55, 35 * ratioSim) : Math.max(55, 35 / ratioSim);
            const dxOther = tx - otherPt.x;
            const dyOther = ty - otherPt.y;
            const dOther = Math.hypot(dxOther, dyOther);
            if (dOther < minAB) {
                const ux = dOther > 1 ? dxOther / dOther : (pointId === "A" ? -1 : 1);
                const uy = dOther > 1 ? dyOther / dOther : 0;
                tx = otherPt.x + ux * minAB;
                ty = otherPt.y + uy * minAB;
            }

            const prevPt = { ...points[pointId] };
            points[pointId].x = clamp(tx, 46, Math.max(46, w - 46));
            points[pointId].y = clamp(ty, 36, Math.max(36, h - 46));
            if (!validateGeometry()) points[pointId] = prevPt;
            return;
        }

        if (pointId === "C" || pointId === "D") {
            if (interactionMode === "free") {
                const next = clampCanvasPoint({ x: localX, y: localY }, 42);
                points[pointId].x = next.x;
                points[pointId].y = next.y;
            } else {
                setRatioFromProjectedPoint(pointId, localX, localY);
            }
        }
    }

    function applyDragObject(objectId, localX, localY) {
        if (!dragStart) return;
        const dx = localX - dragStart.x;
        const dy = localY - dragStart.y;
        const start = dragStart.points;

        if (objectId === "segment-AB") {
            const delta = clampDeltaForPoints([start.A, start.B], dx, dy);
            points.A = { x: start.A.x + delta.dx, y: start.A.y + delta.dy };
            points.B = { x: start.B.x + delta.dx, y: start.B.y + delta.dy };
            return;
        }

        if (objectId === "segment-CD") {
            if (interactionMode === "free") {
                const delta = clampDeltaForPoints([start.C, start.D], dx, dy);
                points.C = { x: start.C.x + delta.dx, y: start.C.y + delta.dy };
                points.D = { x: start.D.x + delta.dx, y: start.D.y + delta.dy };
            } else {
                setRatioSimValue(dragStart.ratioSim + dy / 220);
            }
            return;
        }

        if (objectId === "bevel-main") {
            setBevelDepthValue(dragStart.bevelDepth + dy / 520 - dx / 1200);
            return;
        }

        if (objectId === "double-shared" || objectId === "double-o1" || objectId === "double-o2") {
            const model = dragStart.model || lastDoubleEightModel;
            if (!model) return;
            doubleEightSplit = clamp(dragStart.doubleEightSplit + dx / Math.max(260, model.topGap * 2.4), 0.40, 0.58);
            setRatioSimValue(dragStart.ratioSim + dy / 260);
        }
    }

    function beginDragPoint(pointId, localX, localY) {
        resetDemoForDirectEdit();
        activeDragPoint = pointId;
        activeDragObject = null;
        dragStart = {
            x: localX,
            y: localY,
            points: copyPointMap(),
            ratioSim,
            bevelDepth,
            doubleEightSplit,
            model: copyDoubleEightModel()
        };
        sandboxWrapper.classList.add("dragging-point");
        sandboxWrapper.classList.remove("panning");
    }

    function beginDragObject(objectId, localX, localY) {
        resetDemoForDirectEdit();
        activeDragObject = objectId;
        activeDragPoint = null;
        dragStart = {
            x: localX,
            y: localY,
            points: copyPointMap(),
            ratioSim,
            bevelDepth,
            doubleEightSplit,
            model: copyDoubleEightModel()
        };
        sandboxWrapper.classList.add("dragging-object");
        sandboxWrapper.classList.remove("panning");
    }

    function endDirectDrag() {
        activeDragPoint = null;
        activeDragObject = null;
        dragStart = null;
        sandboxWrapper.classList.remove("dragging-point", "dragging-object");
    }

    function handleDragMove(clientX, clientY) {
        const { x: localX, y: localY } = clientToLocal(clientX, clientY);
        if (activeDragObject) {
            applyDragObject(activeDragObject, localX, localY);
            return true;
        }
        if (activeDragPoint) {
            applyDragPoint(activeDragPoint, localX, localY);
            return true;
        }
        return false;
    }

    function tryBeginDirectDrag(target, clientX, clientY) {
        if (!target?.closest) return false;
        const { x: localX, y: localY } = clientToLocal(clientX, clientY);
        const dragObject = target.closest("[data-drag-object]");
        if (dragObject) {
            beginDragObject(dragObject.getAttribute("data-drag-object"), localX, localY);
            return true;
        }
        const pointWrapper = target.closest(".geo-point-wrapper");
        if (pointWrapper) {
            const pointId = pointWrapper.getAttribute("data-point-id");
            if (["O", "A", "B", "C", "D"].includes(pointId)) {
                beginDragPoint(pointId, localX, localY);
                return true;
            }
        }
        return false;
    }

    sandboxWrapper.addEventListener("mousedown", (e) => {
        if (e.button === 0 && tryBeginDirectDrag(e.target, e.clientX, e.clientY)) {
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        const pointWrapper = e.target.closest(".geo-point-wrapper");
            if (pointWrapper) {
                const pointId = pointWrapper.getAttribute("data-point-id");
                // O点固定，不允许拖拽
                if (["A", "B", "C", "D"].includes(pointId)) {
                    clearDemoTimer();
                    demoStage = "explore";
                    animProgress = 0;
                    animDirection = 0;
                    isAnimating = false;
                    btnPlayFolding.disabled = false;
                    btnPlayFolding.innerHTML = `
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
                        自动演示
                    `;
                    activeDragPoint = pointId;
                    sandboxWrapper.classList.add("dragging-point");
                    isPresetTransitioning = false; // 用户介入拖拽，立即停止特殊图形预设动画
                    updateSceneStatus();
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
        if (handleDragMove(e.clientX, e.clientY)) {
            e.preventDefault();
            return;
        }

        if (activeDragPoint) {
            const { x: localX, y: localY } = clientToLocal(e.clientX, e.clientY);

            const O = points.O;

            if (activeDragPoint === "A" || activeDragPoint === "B") {
                // 拖拽主顶点 A 或 B
                const otherPtId = activeDragPoint === "A" ? "B" : "A";
                const otherPt = points[otherPtId];
                
                let tx = Math.min(Math.max(localX, 50), 750);
                let ty = Math.min(Math.max(localY, 30), O.y - 45); // 限制在中心点 O 的上方，避免退化
                
                // 1. 互斥约束: 距离交点 O 的距离必须 >= 80px，防止 C 和 D 收缩过小产生拥挤
                const dxO = tx - O.x;
                const dyO = ty - O.y;
                const dO = Math.hypot(dxO, dyO);
                if (dO < 80) {
                    tx = O.x + (dxO / dO) * 80;
                    ty = O.y + (dyO / dO) * 80;
                }
                
                // 2. 互斥约束: 顶点 A 和 B 之间的最小距离必须 >= 55px，且保证 C 和 D 间距 >= 35px
                let minAB = 55;
                if (currentScene === "rotated-similarity") {
                    minAB = Math.max(55, 35 * ratioSim);
                } else {
                    minAB = Math.max(55, 35 / ratioSim);
                }
                const dxOther = tx - otherPt.x;
                const dyOther = ty - otherPt.y;
                const dOther = Math.hypot(dxOther, dyOther);
                if (dOther < minAB) {
                    tx = otherPt.x + (dxOther / dOther) * minAB;
                    ty = otherPt.y + (dyOther / dOther) * minAB;
                }

                // 物理缓冲校验并应用
                const prevPt = { ...points[activeDragPoint] };
                points[activeDragPoint].x = tx;
                points[activeDragPoint].y = ty;

                if (!validateGeometry()) {
                    points[activeDragPoint] = prevPt;
                }
            } else if (activeDragPoint === "C") {
                // C 在 OB 延长线上，拖动它相当于拉长/缩短 OC，改变相似比
                const vecOB = { x: points.B.x - O.x, y: points.B.y - O.y };
                const lenOB = Math.hypot(vecOB.x, vecOB.y);
                const vecOC_drag = { x: O.x - localX, y: O.y - localY };
                
                // 投影
                const dot = vecOC_drag.x * vecOB.x + vecOC_drag.y * vecOB.y;
                const lenSq = lenOB * lenOB;
                let t = lenSq > 1e-4 ? dot / lenSq : 0.75;

                if (currentScene === "rotated-similarity") {
                    // 反8字：OC = OA / r => r = OA / OC
                    const lenOA = Math.hypot(points.A.x - O.x, points.A.y - O.y);
                    const lenOC = t * lenOB;
                    const r = lenOC > 1e-2 ? lenOA / lenOC : 1.0;
                    // 通过限制比值范围，天然满足了 C 点与 O 点、以及 C点与 D点的最小互斥间距
                    ratioSim = Math.min(Math.max(r, 0.45), 1.30);
                } else {
                    // 平行8字：OC = r * OB => r = OC / OB
                    ratioSim = Math.min(Math.max(t, 0.45), 1.40);
                }

                sliderRatioSim.value = ratioSim;
                valRatioSim.textContent = ratioSim.toFixed(2);

            } else if (activeDragPoint === "D") {
                // D 在 OA 延长线上，拖动它相当于拉长/缩短 OD
                const vecOA = { x: points.A.x - O.x, y: points.A.y - O.y };
                const lenOA = Math.hypot(vecOA.x, vecOA.y);
                const vecOD_drag = { x: O.x - localX, y: O.y - localY };

                // 投影
                const dot = vecOD_drag.x * vecOA.x + vecOD_drag.y * vecOA.y;
                const lenSq = lenOA * lenOA;
                let t = lenSq > 1e-4 ? dot / lenSq : 0.75;

                if (currentScene === "rotated-similarity") {
                    // 反8字：OD = OB / r => r = OB / OD
                    const lenOB = Math.hypot(points.B.x - O.x, points.B.y - O.y);
                    const lenOD = t * lenOA;
                    const r = lenOD > 1e-2 ? lenOB / lenOD : 1.0;
                    ratioSim = Math.min(Math.max(r, 0.45), 1.30);
                } else {
                    // 平行8字：OD = r * OA => r = OD / OA
                    ratioSim = Math.min(Math.max(t, 0.45), 1.40);
                }

                sliderRatioSim.value = ratioSim;
                valRatioSim.textContent = ratioSim.toFixed(2);
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
        endDirectDrag();
        activeDragPoint = null;
        sandboxWrapper.classList.remove("dragging-point", "dragging-object");
        if (isPanning) {
            isPanning = false;
            sandboxWrapper.classList.remove("panning");
        }
    });

    // 移动端支持
    let initialTouchDist = 0;
    let initialTouchScale = 1.0;

    function getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    function endTouchInteraction() {
        endDirectDrag();
        activeDragPoint = null;
        isPanning = false;
        initialTouchDist = 0;
        sandboxWrapper.classList.remove("dragging-point", "dragging-object", "panning");
    }

    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            endTouchInteraction();
            initialTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialTouchScale = zoomScale;
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (tryBeginDirectDrag(e.target, touch.clientX, touch.clientY)) {
                e.stopPropagation();
                e.preventDefault();
                return;
            }

            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                if (["A", "B", "C", "D"].includes(ptId)) {
                    clearDemoTimer();
                    demoStage = "explore";
                    animProgress = 0;
                    animDirection = 0;
                    isAnimating = false;
                    btnPlayFolding.disabled = false;
                    btnPlayFolding.innerHTML = `
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
                        自动演示
                    `;
                    activeDragPoint = ptId;
                    sandboxWrapper.classList.add("dragging-point");
                    isPresetTransitioning = false; // 用户介入，立即停止预设滑动
                    updateSceneStatus();
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
            }
            isPanning = true;
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && initialTouchDist > 0) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = dist / initialTouchDist;
            const center = getTouchCenter(e.touches);
            const rect = sandboxWrapper.getBoundingClientRect();
            const targetScale = Math.min(Math.max(initialTouchScale * factor, 0.45), 3.0);
            zoomAt(targetScale / zoomScale, center.x - rect.left, center.y - rect.top);
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (handleDragMove(touch.clientX, touch.clientY)) {
                e.preventDefault();
                return;
            }

            const { x: localX, y: localY } = clientToLocal(touch.clientX, touch.clientY);
            const O = points.O;

            if (activeDragPoint) {
                if (activeDragPoint === "A" || activeDragPoint === "B") {
                    const otherPtId = activeDragPoint === "A" ? "B" : "A";
                    const otherPt = points[otherPtId];
                    
                    let tx = Math.min(Math.max(localX, 50), 750);
                    let ty = Math.min(Math.max(localY, 30), O.y - 45);
                    
                    const dxO = tx - O.x;
                    const dyO = ty - O.y;
                    const dO = Math.hypot(dxO, dyO);
                    if (dO < 80) {
                        tx = O.x + (dxO / dO) * 80;
                        ty = O.y + (dyO / dO) * 80;
                    }
                    
                    let minAB = 55;
                    if (currentScene === "rotated-similarity") {
                        minAB = Math.max(55, 35 * ratioSim);
                    } else {
                        minAB = Math.max(55, 35 / ratioSim);
                    }
                    const dxOther = tx - otherPt.x;
                    const dyOther = ty - otherPt.y;
                    const dOther = Math.hypot(dxOther, dyOther);
                    if (dOther < minAB) {
                        tx = otherPt.x + (dxOther / dOther) * minAB;
                        ty = otherPt.y + (dyOther / dOther) * minAB;
                    }

                    const prevPt = { ...points[activeDragPoint] };
                    points[activeDragPoint].x = tx;
                    points[activeDragPoint].y = ty;

                    if (!validateGeometry()) {
                        points[activeDragPoint] = prevPt;
                    }
                } else if (activeDragPoint === "C") {
                    const vecOB = { x: points.B.x - O.x, y: points.B.y - O.y };
                    const lenOB = Math.hypot(vecOB.x, vecOB.y);
                    const vecOC_drag = { x: O.x - localX, y: O.y - localY };
                    const dot = vecOC_drag.x * vecOB.x + vecOC_drag.y * vecOB.y;
                    const lenSq = lenOB * lenOB;
                    let t = lenSq > 1e-4 ? dot / lenSq : 0.75;

                    if (currentScene === "rotated-similarity") {
                        const lenOA = Math.hypot(points.A.x - O.x, points.A.y - O.y);
                        const r = (t * lenOB) > 1e-2 ? lenOA / (t * lenOB) : 1.0;
                        ratioSim = Math.min(Math.max(r, 0.45), 1.30);
                    } else {
                        ratioSim = Math.min(Math.max(t, 0.45), 1.40);
                    }
                    sliderRatioSim.value = ratioSim;
                    valRatioSim.textContent = ratioSim.toFixed(2);
                } else if (activeDragPoint === "D") {
                    const vecOA = { x: points.A.x - O.x, y: points.A.y - O.y };
                    const lenOA = Math.hypot(vecOA.x, vecOA.y);
                    const vecOD_drag = { x: O.x - localX, y: O.y - localY };
                    const dot = vecOD_drag.x * vecOA.x + vecOD_drag.y * vecOA.y;
                    const lenSq = lenOA * lenOA;
                    let t = lenSq > 1e-4 ? dot / lenSq : 0.75;

                    if (currentScene === "rotated-similarity") {
                        const lenOB = Math.hypot(points.B.x - O.x, points.B.y - O.y);
                        const r = (t * lenOA) > 1e-2 ? lenOB / (t * lenOA) : 1.0;
                        ratioSim = Math.min(Math.max(r, 0.45), 1.30);
                    } else {
                        ratioSim = Math.min(Math.max(t, 0.45), 1.40);
                    }
                    sliderRatioSim.value = ratioSim;
                    valRatioSim.textContent = ratioSim.toFixed(2);
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
        if (e.touches.length >= 2) return;
        endTouchInteraction();
    });

    sandboxWrapper.addEventListener("touchcancel", () => {
        endTouchInteraction();
    });

    // ==========================================================================
    // 12. 页面按钮绑定与初始化
    // ==========================================================================
    sliderRatioSim.addEventListener("input", (e) => {
        ratioSim = parseFloat(e.target.value);
        valRatioSim.textContent = ratioSim.toFixed(2);
    });

    sliderBevelDepth.addEventListener("input", (e) => {
        bevelDepth = parseFloat(e.target.value);
        valBevelDepth.textContent = `${Math.round(bevelDepth * 100)}%`;
        if (isBevelScene()) {
            renderSVG();
            updateHTMLOverlayAndHUD();
        }
    });

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const sc = btn.getAttribute("data-scene");
            loadScene(sc);
        });
    });

    // 特殊几何形状按钮绑定
    document.querySelectorAll(".btn-shape-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const shape = btn.getAttribute("data-shape");
            triggerShapePreset(shape);
        });
    });

    document.querySelectorAll(".btn-interaction-mode").forEach(btn => {
        btn.addEventListener("click", () => {
            setInteractionMode(btn.getAttribute("data-interaction-mode"));
        });
    });

    btnPlayFolding.addEventListener("click", playFoldingAnimation);
    btnResetState.addEventListener("click", resetState);

    btnShowHelp.addEventListener("click", () => {
        modalHelp.classList.add("active");
    });
    btnCloseHelp.addEventListener("click", () => {
        modalHelp.classList.remove("active");
    });

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

    sandboxWrapper.parentNode.addEventListener("dblclick", (e) => {
        if (e.target.closest(".control-column") || e.target.closest(".btn-shape-preset")) return;
        centerModel();
    });

    window.appState = {
        get currentScene() { return currentScene; },
        get ratioSim() { return ratioSim; },
        get interactionMode() { return interactionMode; },
        get doubleEightSplit() { return doubleEightSplit; },
        get points() { return points; },
        get isAnimating() { return isAnimating; },
        get isHudExpanded() { return isHudExpanded; },
        get zoomScale() { return zoomScale; },
        get panX() { return panX; },
        get panY() { return panY; },
        get renderValues() {
            return {
                ratioSim: renderValues.ratioSim,
                animProgress: renderValues.animProgress,
                oa: renderValues.oa,
                od: renderValues.od,
                ob: renderValues.ob,
                oc: renderValues.oc,
                ab: renderValues.ab,
                cd: renderValues.cd
            };
        },
        resetState,
        loadScene,
        triggerShapePreset,
        setInteractionMode
    };

    loadScene("parallel-similarity");
});

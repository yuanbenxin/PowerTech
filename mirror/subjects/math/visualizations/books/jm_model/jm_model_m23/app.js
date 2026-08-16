document.addEventListener("DOMContentLoaded", () => {
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
    const floatTip = document.getElementById("float-tip");
    const rotationSliderContainer = document.getElementById("rotation-slider-container");
    const slideRotateProgress = document.getElementById("slide-rotate-progress");
    const rotationValIndicator = document.getElementById("rotation-val-indicator");
    const traceToggleContainer = document.getElementById("trace-toggle-container");
    const chkShowTrace = document.getElementById("chk-show-trace");
    const chkShowAngles = document.getElementById("chk-show-angles");
    const btnProofPrev = document.getElementById("btn-proof-prev");
    const btnProofNext = document.getElementById("btn-proof-next");
    const proofStepIndicator = document.getElementById("proof-step-indicator");
    let btnAutoDemo = document.getElementById("btn-auto-demo");
    if (!btnAutoDemo && proofStepIndicator) {
        const proofSection = proofStepIndicator.closest(".panel-section") || proofStepIndicator.parentElement;
        btnAutoDemo = document.createElement("button");
        btnAutoDemo.id = "btn-auto-demo";
        btnAutoDemo.className = "btn-secondary btn-auto-demo";
        btnAutoDemo.type = "button";
        btnAutoDemo.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7L8 5Z"/></svg>自动演示一次`;
        proofSection?.appendChild(btnAutoDemo);
    }

    const NS = "http://www.w3.org/2000/svg";
    const COLORS = {
        blue: "#2563eb",
        red: "#dc2626",
        purple: "#7c3aed",
        green: "#059669",
        amber: "#d97706",
        slate: "#334155",
        muted: "#94a3b8"
    };

    let currentScene = "halfangle";
    let zoomScale = 1;
    let viewPan = { x: 0, y: 0 };
    let isHudExpanded = false;
    let rotateProgress = 0;
    let showTrace = false;
    let showAngles = false;
    let proofStep = 0;
    let halfAngleE_t = 0.35;
    let smallSquareAngle = -0.65;
    let activeNode = null;
    let activeHandlePointerId = null;
    let dragOffset = { x: 0, y: 0 };
    let isPanningView = false;
    let panStart = null;
    let pinchState = null;
    let demoTimer = null;
    let currentDemoToken = 0;

    const L_large = 220;
    const L_small = 92;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function radToDeg(value) {
        return value * 180 / Math.PI;
    }

    function degToRad(value) {
        return value * Math.PI / 180;
    }

    function dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function midpoint(a, b) {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    function rotatePoint(pt, center, angle) {
        const dx = pt.x - center.x;
        const dy = pt.y - center.y;
        return {
            x: center.x + dx * Math.cos(angle) - dy * Math.sin(angle),
            y: center.y + dx * Math.sin(angle) + dy * Math.cos(angle)
        };
    }

    function lineIntersection(p1, p2, q1, q2) {
        const denom = (p1.x - p2.x) * (q1.y - q2.y) - (p1.y - p2.y) * (q1.x - q2.x);
        if (Math.abs(denom) < 1e-6) return null;
        return {
            x: ((p1.x * p2.y - p1.y * p2.x) * (q1.x - q2.x) - (p1.x - p2.x) * (q1.x * q2.y - q1.y * q2.x)) / denom,
            y: ((p1.x * p2.y - p1.y * p2.x) * (q1.y - q2.y) - (p1.y - p2.y) * (q1.x * q2.y - q1.y * q2.x)) / denom
        };
    }

    function getCenterPosition() {
        const W = sandboxWrapper.clientWidth || 760;
        const H = sandboxWrapper.clientHeight || 520;
        if (W > 760) {
            return {
                x: W * (currentScene === "doublesquare" ? 0.64 : 0.56),
                y: H * (currentScene === "doublesquare" ? 0.62 : 0.58)
            };
        }
        return {
            x: W * 0.52,
            y: currentScene === "halfangle" ? H * 0.54 : H * 0.53
        };
    }

    function getLargeSquarePoints(center) {
        const half = L_large / 2;
        return {
            A: { x: center.x - half, y: center.y - half },
            B: { x: center.x - half, y: center.y + half },
            C: { x: center.x + half, y: center.y + half },
            D: { x: center.x + half, y: center.y - half }
        };
    }

    function getSmallSquarePoints(A, angle) {
        const E = {
            x: A.x + L_small * Math.cos(angle),
            y: A.y + L_small * Math.sin(angle)
        };
        const G = {
            x: A.x + L_small * Math.sin(angle),
            y: A.y - L_small * Math.cos(angle)
        };
        const F = {
            x: E.x + G.x - A.x,
            y: E.y + G.y - A.y
        };
        return { A, E, F, G };
    }

    function clientToWorld(clientX, clientY) {
        const rect = sandboxWrapper.getBoundingClientRect();
        return {
            x: (clientX - rect.left - viewPan.x) / zoomScale,
            y: (clientY - rect.top - viewPan.y) / zoomScale
        };
    }

    function setZoom(nextZoom, anchorClient) {
        const oldZoom = zoomScale;
        const newZoom = clamp(nextZoom, 0.52, 2.8);
        if (Math.abs(newZoom - oldZoom) < 0.001) return;

        if (anchorClient) {
            const rect = sandboxWrapper.getBoundingClientRect();
            const anchorX = anchorClient.x - rect.left;
            const anchorY = anchorClient.y - rect.top;
            const worldX = (anchorX - viewPan.x) / oldZoom;
            const worldY = (anchorY - viewPan.y) / oldZoom;
            viewPan.x = anchorX - worldX * newZoom;
            viewPan.y = anchorY - worldY * newZoom;
        }

        zoomScale = newZoom;
        updateTransform();
    }

    function updateTransform() {
        const transform = `translate(${viewPan.x}px, ${viewPan.y}px) scale(${zoomScale})`;
        sandboxSvg.style.transform = transform;
        htmlOverlay.style.transform = transform;
    }

    function resetView() {
        zoomScale = 1;
        viewPan = { x: 0, y: 0 };
        updateTransform();
    }

    function svgEl(tag, attrs = {}, children = []) {
        const el = document.createElementNS(NS, tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (value !== undefined && value !== null) el.setAttribute(key, String(value));
        });
        children.forEach(child => el.appendChild(child));
        return el;
    }

    function append(tag, attrs = {}, parent = sandboxSvg) {
        const el = svgEl(tag, attrs);
        parent.appendChild(el);
        return el;
    }

    function pathD(points) {
        return points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ") + " Z";
    }

    function addLabel(text, point, options = {}) {
        const x = point.x + (options.dx || 0);
        const y = point.y + (options.dy || 0);
        const className = options.className || "floating-label";
        const isBadge = className.includes("floating-badge");
        const isAngle = className.includes("floating-angle");
        const tone = className.includes("blue") ? "blue"
            : className.includes("red") ? "red"
                : className.includes("green") ? "green"
                    : className.includes("purple") ? "purple" : "default";
        const palette = {
            default: { fill: "rgba(255,255,255,0.95)", stroke: "rgba(148,163,184,0.45)", text: "#111827" },
            blue: { fill: "rgba(219,234,254,0.97)", stroke: "rgba(37,99,235,0.32)", text: COLORS.blue },
            red: { fill: "rgba(254,226,226,0.97)", stroke: "rgba(220,38,38,0.30)", text: COLORS.red },
            green: { fill: "rgba(209,250,229,0.97)", stroke: "rgba(5,150,105,0.30)", text: COLORS.green },
            purple: { fill: "rgba(237,233,254,0.97)", stroke: "rgba(124,58,237,0.30)", text: COLORS.purple }
        }[tone];
        const fontSize = isBadge ? 11 : isAngle ? 11 : 13;
        const paddingX = isBadge ? 7 : 6;
        const paddingY = isBadge ? 4 : 4;
        const textWidth = Math.max(isBadge ? 28 : 22, String(text).length * fontSize * 0.62 + paddingX * 2);
        const textHeight = fontSize + paddingY * 2;
        const group = append("g", {
            transform: `translate(${x} ${y})`,
            "pointer-events": "none",
            class: "svg-floating-label"
        });
        append("rect", {
            x: -textWidth / 2,
            y: -textHeight / 2,
            width: textWidth,
            height: textHeight,
            rx: isBadge || isAngle ? 8 : 999,
            fill: palette.fill,
            stroke: palette.stroke,
            "stroke-width": 1
        }, group);
        append("text", {
            x: 0,
            y: 0,
            fill: palette.text,
            "font-size": fontSize,
            "font-weight": 900,
            "font-family": isBadge ? "Consolas, 'JetBrains Mono', monospace" : "Microsoft YaHei, Arial, sans-serif",
            "text-anchor": "middle",
            "dominant-baseline": "central"
        }, group).textContent = text;
        return group;
    }

    function drawSegment(a, b, color, width = 2, attrs = {}) {
        append("line", {
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
            stroke: color,
            "stroke-width": width,
            "stroke-linecap": "round",
            ...attrs
        });
    }

    function drawPoint(name, p, tone = "slate", draggable = false) {
        const color = tone === "blue" ? COLORS.blue : tone === "red" ? COLORS.red : tone === "purple" ? COLORS.purple : COLORS.slate;
        append("circle", {
            cx: p.x,
            cy: p.y,
            r: draggable ? 13 : 5.2,
            fill: draggable ? "rgba(255,255,255,0.96)" : color,
            stroke: color,
            "stroke-width": draggable ? 3.2 : 1.4,
            class: draggable ? "drag-handle" : "",
            "data-point": draggable ? name : null
        });
        if (draggable) {
            append("circle", {
                cx: p.x,
                cy: p.y,
                r: 4.2,
                fill: color,
                "pointer-events": "none"
            });
        }
    }

    function drawAngleArc(center, p1, p2, radius, color, label, labelOffset = 14) {
        let a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
        let a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
        let delta = a2 - a1;
        while (delta <= -Math.PI) delta += Math.PI * 2;
        while (delta > Math.PI) delta -= Math.PI * 2;
        a2 = a1 + delta;
        const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
        const sweep = delta >= 0 ? 1 : 0;
        const start = { x: center.x + radius * Math.cos(a1), y: center.y + radius * Math.sin(a1) };
        const end = { x: center.x + radius * Math.cos(a2), y: center.y + radius * Math.sin(a2) };
        append("path", {
            d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`,
            fill: "none",
            stroke: color,
            "stroke-width": 2.2,
            "stroke-linecap": "round"
        });
        if (label) {
            const mid = a1 + delta / 2;
            addLabel(label, {
                x: center.x + (radius + labelOffset) * Math.cos(mid),
                y: center.y + (radius + labelOffset) * Math.sin(mid)
            }, { className: "floating-angle" });
        }
    }

    function drawRightAngleMarker(p, u, v, size = 15, color = COLORS.green) {
        const lenU = Math.hypot(u.x, u.y) || 1;
        const lenV = Math.hypot(v.x, v.y) || 1;
        const ux = { x: u.x / lenU, y: u.y / lenU };
        const vx = { x: v.x / lenV, y: v.y / lenV };
        const p1 = { x: p.x + ux.x * size, y: p.y + ux.y * size };
        const p2 = { x: p1.x + vx.x * size, y: p1.y + vx.y * size };
        const p3 = { x: p.x + vx.x * size, y: p.y + vx.y * size };
        append("polyline", {
            points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
            fill: "none",
            stroke: color,
            "stroke-width": 2.2,
            "stroke-linejoin": "round"
        });
    }

    function addDefs() {
        const defs = append("defs");
        defs.innerHTML = `
            <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.12"/>
            </filter>
            <linearGradient id="large-square-fill" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#f8fafc" stop-opacity="0.92"/>
                <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.68"/>
            </linearGradient>
            <linearGradient id="small-square-fill" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#ede9fe" stop-opacity="0.84"/>
                <stop offset="100%" stop-color="#ddd6fe" stop-opacity="0.42"/>
            </linearGradient>
        `;
    }

    function renderHalfAngle() {
        const center = getCenterPosition();
        const { A, B, C, D } = getLargeSquarePoints(center);
        const E = { x: B.x + halfAngleE_t * L_large, y: B.y };
        const xE = E.x - B.x;
        const yF = L_large * ((L_large - xE) / (L_large + xE));
        const F = { x: D.x, y: D.y + yF };
        const Fp = { x: B.x - yF, y: B.y };
        const k = rotateProgress / 100;
        const Drot = rotatePoint(D, A, degToRad(90) * k);
        const Frot = rotatePoint(F, A, degToRad(90) * k);

        append("rect", {
            x: A.x,
            y: A.y,
            width: L_large,
            height: L_large,
            rx: 4,
            fill: "url(#large-square-fill)",
            stroke: COLORS.slate,
            "stroke-width": 3,
            filter: "url(#soft-shadow)"
        });
        drawSegment(B, { x: Fp.x - 24, y: Fp.y }, COLORS.muted, 1.5, { "stroke-dasharray": "5 5" });
        drawSegment(A, E, "#64748b", 2);
        drawSegment(A, F, "#64748b", 2, { opacity: k > 0.86 ? 0.25 : 0.86 });

        append("path", {
            d: pathD([A, B, E]),
            fill: "rgba(37,99,235,0.17)",
            stroke: COLORS.blue,
            "stroke-width": 2.4,
            "stroke-linejoin": "round"
        });
        append("path", {
            d: pathD([A, D, F]),
            fill: "rgba(220,38,38,0.14)",
            stroke: COLORS.red,
            "stroke-width": 2.2,
            "stroke-linejoin": "round",
            opacity: clamp(1 - k * 0.75, 0.22, 1)
        });
        append("path", {
            d: pathD([A, E, F]),
            fill: "rgba(124,58,237,0.08)",
            stroke: COLORS.purple,
            "stroke-width": 2.2,
            "stroke-linejoin": "round"
        });

        if (k > 0.01) {
            append("path", {
                d: pathD([A, Drot, Frot]),
                fill: "rgba(217,119,6,0.18)",
                stroke: COLORS.amber,
                "stroke-width": 2.5,
                "stroke-linejoin": "round"
            });
            append("path", {
                d: `M ${D.x} ${D.y} A ${L_large} ${L_large} 0 0 1 ${Drot.x} ${Drot.y}`,
                fill: "none",
                stroke: COLORS.amber,
                "stroke-width": 1.8,
                "stroke-dasharray": "5 5"
            });
            append("path", {
                d: `M ${F.x} ${F.y} A ${dist(A, F)} ${dist(A, F)} 0 0 1 ${Frot.x} ${Frot.y}`,
                fill: "none",
                stroke: COLORS.amber,
                "stroke-width": 1.8,
                "stroke-dasharray": "5 5"
            });
        }

        if (k > 0.92 || proofStep >= 2) {
            drawSegment(B, Fp, COLORS.red, 4);
            drawSegment(E, Fp, COLORS.green, 4);
            drawSegment(E, F, COLORS.green, 4, { opacity: 0.72 });
            append("path", {
                d: pathD([A, E, Fp]),
                fill: "rgba(5,150,105,0.12)",
                stroke: COLORS.green,
                "stroke-width": 2.6,
                "stroke-dasharray": "7 4",
                "stroke-linejoin": "round"
            });
            addLabel("F'", Fp, { dx: -17, dy: 15 });
        }

        if (showAngles || proofStep > 0) {
            drawAngleArc(A, B, E, 36, COLORS.blue, `${Math.round(radToDeg(Math.atan(xE / L_large)))}°`);
            drawAngleArc(A, E, F, 52, COLORS.purple, "45°");
            if (k < 0.86) drawAngleArc(A, F, D, 70, COLORS.red, `${Math.round(radToDeg(Math.atan(yF / L_large)))}°`);
        }

        drawPoint("E", E, "blue", true);
        drawPoint("A", A);
        drawPoint("B", B);
        drawPoint("C", C);
        drawPoint("D", D);
        drawPoint("F", F, "red");

        addLabel("A", A, { dx: -17, dy: -17 });
        addLabel("B", B, { dx: -18, dy: 18 });
        addLabel("C", C, { dx: 18, dy: 18 });
        addLabel("D", D, { dx: 18, dy: -18 });
        addLabel("E", E, { dx: 0, dy: 28 });
        addLabel("F", F, { dx: 22, dy: 0 });
        addLabel(`BE=${(xE / 30).toFixed(1)}`, midpoint(B, E), { className: "floating-badge blue", dy: 24 });
        addLabel(`DF=${(yF / 30).toFixed(1)}`, midpoint(D, F), { className: "floating-badge red", dx: 32 });
        if (k > 0.92 || proofStep >= 2) {
            addLabel("EF = BE + DF", midpoint(E, Fp), { className: "floating-badge green", dy: -24 });
        }
    }

    function renderDoubleSquare() {
        const center = getCenterPosition();
        const { A, B, C, D } = getLargeSquarePoints(center);
        const sub = getSmallSquarePoints(A, smallSquareAngle);
        const P = lineIntersection(B, sub.E, D, sub.G);

        append("path", {
            d: pathD([A, B, C, D]),
            fill: "url(#large-square-fill)",
            stroke: COLORS.slate,
            "stroke-width": 3,
            "stroke-linejoin": "round",
            filter: "url(#soft-shadow)"
        });
        append("path", {
            d: pathD([sub.A, sub.E, sub.F, sub.G]),
            fill: "url(#small-square-fill)",
            stroke: COLORS.purple,
            "stroke-width": 3,
            "stroke-linejoin": "round"
        });

        append("path", {
            d: pathD([A, B, sub.E]),
            fill: "rgba(37,99,235,0.18)",
            stroke: COLORS.blue,
            "stroke-width": 2.7,
            "stroke-linejoin": "round"
        });
        append("path", {
            d: pathD([A, D, sub.G]),
            fill: "rgba(220,38,38,0.16)",
            stroke: COLORS.red,
            "stroke-width": 2.7,
            "stroke-linejoin": "round"
        });
        drawSegment(B, sub.E, COLORS.blue, 4);
        drawSegment(D, sub.G, COLORS.red, 4);

        const traceMode = showTrace || proofStep >= 3;
        const denseMode = traceMode || showAngles || proofStep > 0;

        if (traceMode) {
            const cx = (B.x + D.x) / 2;
            const cy = (B.y + D.y) / 2;
            const r = dist(B, D) / 2;
            append("circle", {
                cx,
                cy,
                r,
                fill: "rgba(124,58,237,0.028)",
                stroke: COLORS.purple,
                "stroke-width": 1.6,
                "stroke-dasharray": "7 5"
            });
        }

        if (showAngles || proofStep > 0) {
            drawAngleArc(A, B, sub.E, 34, COLORS.blue, null);
            drawAngleArc(A, D, sub.G, 52, COLORS.red, null);
            drawAngleArc(A, sub.E, sub.G, 70, COLORS.purple, null);
        }

        if (P) {
            append("circle", { cx: P.x, cy: P.y, r: 5.5, fill: COLORS.green, stroke: "#fff", "stroke-width": 2 });
            drawRightAngleMarker(P, { x: B.x - P.x, y: B.y - P.y }, { x: D.x - P.x, y: D.y - P.y }, 14, COLORS.green);
            addLabel("P", P, { dx: 26, dy: 24 });
        }

        drawPoint("E", sub.E, "purple", true);
        drawPoint("A", A);
        drawPoint("B", B);
        drawPoint("C", C);
        drawPoint("D", D);
        drawPoint("G", sub.G, "red");
        drawPoint("F", sub.F, "purple");

        addLabel("A", A, { dx: -30, dy: -22 });
        addLabel("B", B, { dx: -18, dy: 18 });
        addLabel("C", C, { dx: 18, dy: 18 });
        addLabel("D", D, { dx: 24, dy: -18 });
        addLabel("E", sub.E, { dx: 28, dy: -22 });
        addLabel("F", sub.F, { dx: 22, dy: -24 });
        addLabel("G", sub.G, { dx: -28, dy: -6 });
        if (!denseMode) {
            addLabel("△ABE", midpoint(midpoint(A, B), sub.E), { className: "floating-badge blue", dx: -32, dy: 10 });
            addLabel("△ADG", midpoint(midpoint(A, D), sub.G), { className: "floating-badge red", dx: -8, dy: -30 });
            const beLabelPoint = { x: B.x * 0.58 + sub.E.x * 0.42, y: B.y * 0.58 + sub.E.y * 0.42 };
            const dgLabelPoint = { x: D.x * 0.68 + sub.G.x * 0.32, y: D.y * 0.68 + sub.G.y * 0.32 };
            addLabel(`BE=${(dist(B, sub.E) / 30).toFixed(1)}`, beLabelPoint, { className: "floating-badge blue", dx: -32, dy: 12 });
            addLabel(`DG=${(dist(D, sub.G) / 30).toFixed(1)}`, dgLabelPoint, { className: "floating-badge red", dx: 18, dy: -30 });
        }
    }

    function render() {
        sandboxSvg.innerHTML = "";
        htmlOverlay.innerHTML = "";
        addDefs();
        if (currentScene === "halfangle") renderHalfAngle();
        else renderDoubleSquare();
        renderHUD();
        bindHandleEvents();
    }

    function renderHUD() {
        if (currentScene === "halfangle") {
            stepsChalkboard.innerHTML = `
                <div class="hud-card hud-theory-card">
                    <strong>原理</strong>
                    <div class="hud-line">把难比较的 DF 旋转到 B 的左侧，线段关系就变成同一直线上的拼接。</div>
                    <div class="hud-line muted">D 与 B 重合，DF 变成 BF'，所以 EF = BE + DF。</div>
                </div>
                <div class="hud-card">
                    <strong>构造</strong>
                    <div class="hud-line">△ADF 绕 A 旋转 90°，D 与 B 重合，F 转到 F'。</div>
                </div>
                <div class="hud-card">
                    <strong>拼合</strong>
                    <div class="hud-chip-row">
                        <span class="hud-chip blue">BE</span>
                        <span class="hud-chip red">DF = BF'</span>
                        <span class="hud-chip purple">∠EAF = 45°</span>
                    </div>
                </div>
                <div class="hud-card">
                    <strong>结论</strong>
                    <div class="hud-chip-row">
                        <span class="hud-chip green">EF = BE + DF</span>
                    </div>
                </div>
            `;
        } else {
            stepsChalkboard.innerHTML = `
                <div class="hud-card hud-theory-card">
                    <strong>原理</strong>
                    <div class="hud-line">两组对应边来自两个正方形，夹角由共同旋转得到，所以 △ABE ≌ △ADG。</div>
                    <div class="hud-line muted">对应边推出 BE = DG；两条连接线的方向差为 90°，所以 BE ⟂ DG。</div>
                </div>
                <div class="hud-card">
                    <strong>条件</strong>
                    <div class="hud-chip-row">
                        <span class="hud-chip blue">AB = AD</span>
                        <span class="hud-chip red">AE = AG</span>
                        <span class="hud-chip purple">∠BAE = ∠DAG</span>
                    </div>
                </div>
                <div class="hud-card">
                    <strong>全等</strong>
                    <div class="hud-chip-row">
                        <span class="hud-chip blue">△ABE</span>
                        <span class="hud-chip red">△ADG</span>
                        <span class="hud-chip green">SAS</span>
                    </div>
                </div>
                <div class="hud-card">
                    <strong>结论</strong>
                    <div class="hud-chip-row">
                        <span class="hud-chip green">BE = DG</span>
                        <span class="hud-chip green">BE ⟂ DG</span>
                    </div>
                </div>
            `;
        }
    }

    function loadSlidersForScene() {
        if (currentScene === "halfangle") {
            rotationSliderContainer.classList.remove("hidden");
            traceToggleContainer.classList.add("hidden");
            slidersContainer.innerHTML = `
                <div class="slider-row">
                    <span class="slider-label"><span class="square-rotation-label-text">E 点位置</span><span class="slider-val-indicator">${Math.round(halfAngleE_t * 100)}%</span></span>
                    <input id="slide-e-pos" type="range" min="6" max="94" step="1" value="${Math.round(halfAngleE_t * 100)}">
                </div>
            `;
        } else {
            rotationSliderContainer.classList.add("hidden");
            traceToggleContainer.classList.remove("hidden");
            slidersContainer.innerHTML = `
                <div class="slider-row">
                    <span class="slider-label"><span class="square-rotation-label-text">小正方形角度</span><span class="slider-val-indicator">${Math.round(radToDeg(smallSquareAngle))}°</span></span>
                    <input id="slide-rotate-theta" type="range" min="-180" max="180" step="2" value="${Math.round(radToDeg(smallSquareAngle))}">
                </div>
            `;
        }
        bindSliderEvents();
        bindPanelControlIsolation();
    }

    function bindSliderEvents() {
        const eSlider = document.getElementById("slide-e-pos");
        if (eSlider) {
            eSlider.addEventListener("input", (event) => {
                stopDemo();
                halfAngleE_t = Number(event.target.value) / 100;
                const indicator = event.target.closest(".slider-row")?.querySelector(".slider-val-indicator");
                if (indicator) indicator.textContent = `${Math.round(halfAngleE_t * 100)}%`;
                render();
            });
        }
        const thetaSlider = document.getElementById("slide-rotate-theta");
        if (thetaSlider) {
            thetaSlider.addEventListener("input", (event) => {
                stopDemo();
                smallSquareAngle = degToRad(Number(event.target.value));
                const indicator = event.target.closest(".slider-row")?.querySelector(".slider-val-indicator");
                if (indicator) indicator.textContent = `${Math.round(radToDeg(smallSquareAngle))}°`;
                render();
            });
        }
    }

    function bindPanelControlIsolation() {
        const panel = document.getElementById("control-panel") || document.querySelector(".control-panel");
        if (!panel) return;
        const selector = 'input[type="range"], input[type="checkbox"], button, label';
        panel.querySelectorAll(selector).forEach(node => {
            if (node.matches?.('input[type="range"]')) {
                bindRangePointerDrag(node);
            }
            if (node.dataset.squareRotationInputGuarded === "true") return;
            node.dataset.squareRotationInputGuarded = "true";
            ["pointerdown", "pointermove", "mousedown", "mousemove", "touchstart", "touchmove"].forEach(type => {
                node.addEventListener(type, event => event.stopPropagation(), { passive: true });
            });
        });
    }

    function bindRangePointerDrag(range) {
        if (range.dataset.squareRotationRangeDragGuarded === "true") return;
        range.dataset.squareRotationRangeDragGuarded = "true";
        let activePointerId = null;

        const setValueFromClientX = (clientX) => {
            const rect = range.getBoundingClientRect();
            if (!rect.width) return;
            const min = Number(range.min || 0);
            const max = Number(range.max || 100);
            const rawStep = Number(range.step);
            const step = Number.isFinite(rawStep) && rawStep > 0 ? rawStep : 1;
            const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
            const raw = min + (max - min) * ratio;
            const stepped = min + Math.round((raw - min) / step) * step;
            const next = clamp(stepped, min, max);
            if (String(next) === range.value) return;
            range.value = String(next);
            range.dispatchEvent(new Event("input", { bubbles: true }));
        };

        range.addEventListener("pointerdown", (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            activePointerId = event.pointerId;
            range.setPointerCapture?.(event.pointerId);
            event.preventDefault();
            event.stopPropagation();
            setValueFromClientX(event.clientX);
        }, { passive: false });

        range.addEventListener("pointermove", (event) => {
            if (activePointerId !== event.pointerId) return;
            event.preventDefault();
            event.stopPropagation();
            setValueFromClientX(event.clientX);
        }, { passive: false });

        const finish = (event) => {
            if (activePointerId !== null && activePointerId !== event.pointerId) return;
            activePointerId = null;
            range.releasePointerCapture?.(event.pointerId);
            event.stopPropagation();
        };
        range.addEventListener("pointerup", finish);
        range.addEventListener("pointercancel", finish);
    }

    function updatePanelStaticCopy() {
        const setText = (selector, text) => {
            const node = document.querySelector(selector);
            if (node) node.textContent = text;
        };
        setText(".scene-tabs h3", "模型场景");
        setText(".control-sliders h3", "参数调节");
        setText(".proof-guide-section h3", "演示与证明");
        setText(".presets-section h3", "教学预设");
        const angleLabel = chkShowAngles?.closest("label");
        if (angleLabel && !angleLabel.dataset.squareRotationRelabeled) {
            angleLabel.dataset.squareRotationRelabeled = "true";
            angleLabel.replaceChildren(chkShowAngles, document.createTextNode("显示角标与对应边"));
        }
        const traceLabel = chkShowTrace?.closest("label");
        if (traceLabel && !traceLabel.dataset.squareRotationRelabeled) {
            traceLabel.dataset.squareRotationRelabeled = "true";
            traceLabel.replaceChildren(chkShowTrace, document.createTextNode("显示交点 P 轨迹"));
        }
        const rotationLabel = slideRotateProgress?.closest(".slider-row")?.querySelector(".slider-label");
        if (rotationLabel && !rotationLabel.dataset.squareRotationRelabeled) {
            rotationLabel.dataset.squareRotationRelabeled = "true";
            const labelText = document.createElement("span");
            labelText.className = "square-rotation-label-text";
            labelText.textContent = "△ADF 旋转进度";
            rotationLabel.replaceChildren(labelText, rotationValIndicator);
        }
        bindPanelControlIsolation();
    }

    function updateScenePresetsAndTheory() {
        updatePanelStaticCopy();
        if (currentScene === "halfangle") {
            presetButtonsContainer.innerHTML = `
                <button class="btn-preset-problem" data-preset="ha-standard" type="button">标准半角 <span>观察45°</span></button>
                <button class="btn-preset-problem" data-preset="ha-join" type="button">拼合演示 <span>旋转90°</span></button>
                <button class="btn-preset-problem" data-preset="ha-sum" type="button">线段和差 <span>EF=BE+DF</span></button>
            `;
            theoryTitle.textContent = "半角旋转模型";
            theoryText.innerHTML = `
                <p class="key-line">把难比较的 DF 旋转到 B 的左侧，线段关系就变成同一直线上的拼接。</p>
                <p>教学重点不是“转了一圈”，而是看到 D 与 B 重合、DF 变成 BF'，从而得到 EF = BE + DF。</p>
            `;
        } else {
            presetButtonsContainer.innerHTML = `
                <button class="btn-preset-problem" data-preset="ds-standard" type="button">标准手拉手 <span>SAS</span></button>
                <button class="btn-preset-problem" data-preset="ds-oblique" type="button">斜向旋转 <span>保持结论</span></button>
                <button class="btn-preset-problem" data-preset="ds-locus" type="button">交点轨迹 <span>垂直+圆</span></button>
            `;
            theoryTitle.textContent = "双正方形手拉手";
            theoryText.innerHTML = `
                <p class="key-line">两组对应边来自两个正方形，夹角由共同旋转得到，所以 △ABE ≌ △ADG。</p>
                <p>对应边推出 BE = DG；两条连接线的方向差为 90°，所以 BE ⟂ DG，交点 P 形成可观察的轨迹。</p>
            `;
        }
        presetButtonsContainer.querySelectorAll("[data-preset]").forEach(button => {
            button.addEventListener("click", () => {
                stopDemo();
                applyPreset(button.dataset.preset);
            });
        });
    }

    function applyPreset(id) {
        if (id === "ha-standard") {
            halfAngleE_t = 0.35;
            rotateProgress = 0;
            proofStep = 0;
        } else if (id === "ha-join") {
            halfAngleE_t = 0.42;
            rotateProgress = 68;
            proofStep = 1;
        } else if (id === "ha-sum") {
            halfAngleE_t = 0.42;
            rotateProgress = 100;
            proofStep = 3;
        } else if (id === "ds-standard") {
            smallSquareAngle = degToRad(-35);
            showTrace = false;
            proofStep = 1;
        } else if (id === "ds-oblique") {
            smallSquareAngle = degToRad(34);
            showTrace = false;
            proofStep = 2;
        } else if (id === "ds-locus") {
            smallSquareAngle = degToRad(-62);
            showTrace = true;
            proofStep = 3;
        }
        syncControls();
        render();
        loadSlidersForScene();
    }

    function syncControls() {
        if (slideRotateProgress) slideRotateProgress.value = String(rotateProgress);
        if (rotationValIndicator) rotationValIndicator.textContent = `${Math.round(rotateProgress)}%`;
        if (chkShowTrace) chkShowTrace.checked = showTrace;
        if (chkShowAngles) chkShowAngles.checked = showAngles;
        updateProofStepUI();
    }

    function setProofStep(nextStep) {
        proofStep = ((nextStep % 4) + 4) % 4;
        if (currentScene === "halfangle") {
            if (proofStep === 0) rotateProgress = 0;
            if (proofStep === 1) rotateProgress = 35;
            if (proofStep === 2) rotateProgress = 78;
            if (proofStep === 3) rotateProgress = 100;
        } else {
            showAngles = proofStep > 0;
            showTrace = proofStep === 3;
        }
        syncControls();
        render();
        loadSlidersForScene();
    }

    function updateProofStepUI() {
        const labels = ["自由探索", "观察条件", "对应全等", "得到结论"];
        proofStepIndicator.textContent = labels[proofStep] || "自由探索";
        proofStepIndicator.style.color = proofStep ? "var(--color-blue)" : "var(--text-secondary)";
    }

    function loadScene(scene) {
        stopDemo();
        currentScene = scene;
        proofStep = 0;
        rotateProgress = 0;
        showAngles = false;
        showTrace = false;
        resetView();
        document.querySelectorAll(".tab-buttons .btn-preset").forEach(button => {
            button.classList.toggle("active", button.dataset.scene === scene);
        });
        updateScenePresetsAndTheory();
        loadSlidersForScene();
        syncControls();
        render();
    }

    function bindHandleEvents() {
        sandboxSvg.querySelectorAll(".drag-handle").forEach(handle => {
            handle.addEventListener("pointerdown", onHandlePointerDown);
        });
    }

    function onHandlePointerDown(event) {
        if (event.button !== undefined && event.button !== 0) return;
        if (activeHandlePointerId !== null) return;
        event.preventDefault();
        event.stopPropagation();
        stopDemo();
        activeNode = event.currentTarget.dataset.point;
        activeHandlePointerId = event.pointerId;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        const world = clientToWorld(event.clientX, event.clientY);
        const center = getCenterPosition();
        const sq = getLargeSquarePoints(center);
        if (currentScene === "halfangle") {
            const E = { x: sq.B.x + halfAngleE_t * L_large, y: sq.B.y };
            dragOffset = { x: world.x - E.x, y: world.y - E.y };
        } else {
            const sub = getSmallSquarePoints(sq.A, smallSquareAngle);
            dragOffset = { x: world.x - sub.E.x, y: world.y - sub.E.y };
        }
        window.addEventListener("pointermove", onHandlePointerMove);
        window.addEventListener("pointerup", onHandlePointerUp, { once: true });
        window.addEventListener("pointercancel", onHandlePointerUp, { once: true });
    }

    function onHandlePointerMove(event) {
        if (!activeNode || event.pointerId !== activeHandlePointerId) return;
        event.preventDefault();
        const world = clientToWorld(event.clientX, event.clientY);
        const center = getCenterPosition();
        const sq = getLargeSquarePoints(center);
        if (currentScene === "halfangle") {
            const targetX = world.x - dragOffset.x;
            halfAngleE_t = clamp((targetX - sq.B.x) / L_large, 0.06, 0.94);
        } else {
            const target = { x: world.x - dragOffset.x, y: world.y - dragOffset.y };
            smallSquareAngle = Math.atan2(target.y - sq.A.y, target.x - sq.A.x);
        }
        proofStep = 0;
        render();
        loadSlidersForScene();
        syncControls();
    }

    function onHandlePointerUp(event) {
        if (event && event.pointerId !== activeHandlePointerId) return;
        activeNode = null;
        activeHandlePointerId = null;
        window.removeEventListener("pointermove", onHandlePointerMove);
    }

    function bindViewportNavigation() {
        sandboxWrapper.addEventListener("wheel", (event) => {
            event.preventDefault();
            const factor = event.deltaY > 0 ? 0.92 : 1.09;
            setZoom(zoomScale * factor, { x: event.clientX, y: event.clientY });
        }, { passive: false });

        sandboxWrapper.addEventListener("pointerdown", (event) => {
            if (event.pointerType === "touch" && (!event.isPrimary || pinchState)) return;
            if (event.target.closest?.(".hud-panel") || event.target.closest?.(".drag-handle")) return;
            stopDemo();
            isPanningView = true;
            panStart = { x: event.clientX, y: event.clientY, panX: viewPan.x, panY: viewPan.y };
            sandboxWrapper.classList.add("panning");
            sandboxWrapper.setPointerCapture?.(event.pointerId);
        });

        sandboxWrapper.addEventListener("pointermove", (event) => {
            if (pinchState || !isPanningView || !panStart) return;
            event.preventDefault();
            viewPan.x = panStart.panX + event.clientX - panStart.x;
            viewPan.y = panStart.panY + event.clientY - panStart.y;
            updateTransform();
        });

        const endPan = () => {
            isPanningView = false;
            panStart = null;
            sandboxWrapper.classList.remove("panning");
        };
        sandboxWrapper.addEventListener("pointerup", endPan);
        sandboxWrapper.addEventListener("pointercancel", endPan);

        sandboxWrapper.addEventListener("touchstart", (event) => {
            if (event.touches.length === 2) {
                event.preventDefault();
                endPan();
                const [a, b] = event.touches;
                pinchState = {
                    startDistance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
                    startZoom: zoomScale,
                    anchor: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
                };
            }
        }, { passive: false });

        sandboxWrapper.addEventListener("touchmove", (event) => {
            if (!pinchState || event.touches.length !== 2) return;
            event.preventDefault();
            const [a, b] = event.touches;
            const nextDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const anchor = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
            setZoom(pinchState.startZoom * (nextDistance / pinchState.startDistance), anchor);
        }, { passive: false });

        sandboxWrapper.addEventListener("touchend", (event) => {
            if (event.touches.length < 2) pinchState = null;
        });

        sandboxWrapper.addEventListener("touchcancel", () => {
            pinchState = null;
            endPan();
        });
    }

    function showTip(text) {
        floatTip.textContent = text;
        floatTip.classList.remove("hidden");
    }

    function hideTip() {
        floatTip.classList.add("hidden");
    }

    function stopDemo() {
        currentDemoToken += 1;
        if (demoTimer) {
            clearTimeout(demoTimer);
            demoTimer = null;
        }
        btnAutoDemo.disabled = false;
        btnAutoDemo.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7L8 5Z"/></svg>自动演示一次`;
    }

    function delay(ms, token) {
        return new Promise(resolve => {
            demoTimer = setTimeout(() => {
                if (token === currentDemoToken) resolve();
            }, ms);
        });
    }

    async function runTeachingDemo() {
        stopDemo();
        const token = ++currentDemoToken;
        btnAutoDemo.disabled = true;
        btnAutoDemo.textContent = "演示中...";

        if (currentScene === "halfangle") {
            halfAngleE_t = 0.42;
            rotateProgress = 0;
            showAngles = true;
            proofStep = 1;
            syncControls();
            render();
            showTip("先观察 45°半角：BE 与 DF 分散在两条边上。");
            await delay(900, token);
            for (let p = 0; p <= 100 && token === currentDemoToken; p += 5) {
                rotateProgress = p;
                proofStep = p < 45 ? 1 : p < 96 ? 2 : 3;
                syncControls();
                render();
                showTip(p < 96 ? `△ADF 绕 A 旋转：${p}%` : "D 与 B 重合，DF 转成 BF'。");
                await delay(42, token);
            }
            if (token === currentDemoToken) {
                proofStep = 3;
                rotateProgress = 100;
                syncControls();
                render();
                showTip("停在结论：EF = BE + DF。");
            }
        } else {
            showAngles = true;
            showTrace = false;
            proofStep = 1;
            smallSquareAngle = degToRad(-55);
            syncControls();
            render();
            showTip("先看公共顶点 A 和两组正方形边。");
            await delay(850, token);
            proofStep = 2;
            syncControls();
            render();
            showTip("两组三角形满足 SAS：△ABE ≌ △ADG。");
            await delay(900, token);
            for (let a = -55; a <= 36 && token === currentDemoToken; a += 4) {
                smallSquareAngle = degToRad(a);
                syncControls();
                render();
                showTip("旋转小正方形，BE 与 DG 的等长和垂直关系保持不变。");
                await delay(45, token);
            }
            if (token === currentDemoToken) {
                proofStep = 3;
                showTrace = true;
                syncControls();
                render();
                showTip("停在结论：BE = DG，BE ⟂ DG，P 在轨迹圆上。");
            }
        }
        if (token === currentDemoToken) {
            btnAutoDemo.disabled = false;
            btnAutoDemo.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7L8 5Z"/></svg>自动演示一次`;
            demoTimer = setTimeout(hideTip, 2200);
        }
    }

    document.querySelectorAll(".tab-buttons .btn-preset").forEach(button => {
        button.addEventListener("click", () => loadScene(button.dataset.scene));
    });

    slideRotateProgress.addEventListener("input", (event) => {
        stopDemo();
        rotateProgress = Number(event.target.value);
        rotationValIndicator.textContent = `${Math.round(rotateProgress)}%`;
        proofStep = rotateProgress > 92 ? 3 : rotateProgress > 35 ? 2 : rotateProgress > 0 ? 1 : 0;
        updateProofStepUI();
        render();
    });

    chkShowTrace.addEventListener("change", (event) => {
        showTrace = event.target.checked;
        render();
    });

    chkShowAngles.addEventListener("change", (event) => {
        showAngles = event.target.checked;
        render();
    });

    btnProofPrev.addEventListener("click", () => {
        stopDemo();
        setProofStep(proofStep - 1);
    });

    btnProofNext.addEventListener("click", () => {
        stopDemo();
        setProofStep(proofStep + 1);
    });

    btnAutoDemo.addEventListener("click", runTeachingDemo);

    btnResetState.addEventListener("click", () => {
        stopDemo();
        halfAngleE_t = 0.35;
        smallSquareAngle = -0.65;
        rotateProgress = 0;
        showTrace = false;
        showAngles = false;
        proofStep = 0;
        hideTip();
        resetView();
        syncControls();
        loadSlidersForScene();
        render();
    });

    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        hudPanel.classList.toggle("collapsed", !isHudExpanded);
        hudPanel.classList.toggle("expanded", isHudExpanded);
    });

    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (event) => {
        if (event.target === modalHelp) modalHelp.classList.remove("active");
    });

    window.appState = {
        get currentScene() { return currentScene; },
        loadScene,
        applyPreset,
        render,
        setZoom,
        resetView
    };

    bindViewportNavigation();
    loadScene("halfangle");
    window.addEventListener("resize", () => {
        resetView();
        render();
    });
});

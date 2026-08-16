document.addEventListener("DOMContentLoaded", () => {
  const sandboxWrapper = document.getElementById("sandbox-wrapper");
  const sandboxSvg = document.getElementById("sandbox-svg");
  const htmlOverlay = document.getElementById("html-overlay");
  const gridOverlay = document.getElementById("grid-overlay");
  const hudPanel = document.getElementById("hud-chalkboard-panel");
  const hudToggleBtn = document.getElementById("hud-toggle-btn");
  const hudTitle = document.getElementById("hud-title");
  const hudBody = document.getElementById("steps-hud-chalkboard");
  const hudChip = document.getElementById("hud-chip");
  const layerControls = document.getElementById("layer-controls");
  const sliderSize = document.getElementById("slider-size");
  const sliderShape = document.getElementById("slider-shape");
  const valSize = document.getElementById("val-size");
  const valShape = document.getElementById("val-shape");
  const labelShape = document.getElementById("label-shape");
  const btnToggleSnap = document.getElementById("btn-toggle-snap");
  const btnToggleGrid = document.getElementById("btn-toggle-grid");
  const btnPlayDemo = document.getElementById("btn-play-demo");
  const btnResetState = document.getElementById("btn-reset-state");
  const theoryTitle = document.getElementById("theory-title");
  const theoryText = document.getElementById("theory-text");

  const state = {
    scene: "right-angle",
    size: 215,
    shape: 82,
    layers: {
      condition: true,
      circle: true,
      proof: false
    },
    snap: true,
    grid: false,
    hudExpanded: false,
    demoPhase: "idle",
    demoTimers: [],
    points: {},
    lastDragPoint: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    activeDragPoint: null,
    isPanning: false,
    startPanX: 0,
    startPanY: 0,
    initialTouchDist: 0,
    initialTouchScale: 1
  };

  const SCENES = {
    "right-angle": {
      title: "直角定圆",
      formula: "∠APB = 90°  ⇒  A、P、B 共圆，且 AB 为直径",
      note: "中考里常见的隐圆入口：看到直角，先找它斜边对应的直径圆。",
      points: ["A", "B", "P"]
    },
    "equal-angle": {
      title: "同弧同角",
      formula: "∠APB = ∠AQB  ⇒  A、B、P、Q 四点共圆",
      note: "两个角如果同时看同一条弦 AB，就要警觉：这往往是在提示隐藏圆。",
      points: ["A", "B", "P", "Q"]
    },
    "opposite-angle": {
      title: "对角互补",
      formula: "∠A + ∠C = 180°  ⇒  A、B、C、D 四点共圆",
      note: "四边形里一组对角互补，是四点共圆最直接的判定条件之一。",
      points: ["A", "B", "C", "D"]
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clonePoint(p) {
    return { x: p.x, y: p.y };
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function unitVector(from, to) {
    const d = Math.max(0.0001, dist(from, to));
    return { x: (to.x - from.x) / d, y: (to.y - from.y) / d };
  }

  function pointOnCircle(cx, cy, r, deg) {
    const rad = deg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function normalizeAngleRad(angle) {
    while (angle <= -Math.PI) angle += Math.PI * 2;
    while (angle > Math.PI) angle -= Math.PI * 2;
    return angle;
  }

  function angleBetween(a, b, c) {
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    const d1 = Math.hypot(v1.x, v1.y);
    const d2 = Math.hypot(v2.x, v2.y);
    if (d1 < 0.001 || d2 < 0.001) return 0;
    const cosine = clamp((v1.x * v2.x + v1.y * v2.y) / (d1 * d2), -1, 1);
    return Math.acos(cosine) * 180 / Math.PI;
  }

  function signedSide(a, b, p) {
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  }

  function circumcircle(a, b, c) {
    const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    if (Math.abs(d) < 0.001) return null;
    const a2 = a.x * a.x + a.y * a.y;
    const b2 = b.x * b.x + b.y * b.y;
    const c2 = c.x * c.x + c.y * c.y;
    const ux = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
    const uy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
    const center = { x: ux, y: uy };
    return { x: ux, y: uy, r: dist(center, a) };
  }

  function projectToCircle(p, circle) {
    if (!circle || !Number.isFinite(circle.r) || circle.r < 8) return p;
    const dx = p.x - circle.x;
    const dy = p.y - circle.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return { x: circle.x + circle.r, y: circle.y };
    return {
      x: circle.x + dx / len * circle.r,
      y: circle.y + dy / len * circle.r
    };
  }

  function getWrapperSize() {
    return {
      w: Math.max(320, sandboxWrapper.clientWidth || 800),
      h: Math.max(280, sandboxWrapper.clientHeight || 520)
    };
  }

  function snapCssPixel(value) {
    const ratio = window.devicePixelRatio || 1;
    return Math.round(value * ratio) / ratio;
  }

  function localToScreen(x, y) {
    return {
      x: snapCssPixel(x * state.zoom + state.panX),
      y: snapCssPixel(y * state.zoom + state.panY)
    };
  }

  function getModelFrame() {
    const { w, h } = getWrapperSize();
    const margin = Math.min(56, Math.max(30, Math.min(w, h) * 0.07));
    const hudWidth = state.hudExpanded ? Math.min(320, Math.max(220, w * 0.4)) : 140;
    const hudSafeRight = state.hudExpanded ? 18 + hudWidth + 28 : margin;
    const usableLeft = clamp(hudSafeRight, margin, Math.max(margin, w - 250));
    const usableRight = w - margin;
    const usableWidth = Math.max(180, usableRight - usableLeft);
    const maxR = Math.max(82, Math.min(usableWidth / 2.08, (h - margin * 2) / 2.18));
    const r = clamp(state.size, 82, maxR);
    const targetCy = h * 0.57;
    return {
      w,
      h,
      r,
      cx: (usableLeft + usableRight) / 2,
      cy: clamp(targetCy, margin + r + 10, h - margin - r - 10),
      margin
    };
  }

  function clampToBoard(p) {
    const { w, h } = getWrapperSize();
    return {
      x: clamp(p.x, 34, w - 34),
      y: clamp(p.y, 34, h - 34)
    };
  }

  function resetSceneGeometry() {
    const frame = getModelFrame();
    const r = frame.r;
    const cx = frame.cx;
    const cy = frame.cy;
    const shape = state.shape;

    if (state.scene === "right-angle") {
      const theta = clamp(shape, 35, 145);
      state.points = {
        A: { x: cx - r, y: cy + 44 },
        B: { x: cx + r, y: cy + 44 },
        P: pointOnCircle(cx, cy + 44, r, 360 - theta)
      };
      state.points.P.y = Math.min(state.points.P.y, cy - 36);
      return;
    }

    if (state.scene === "equal-angle") {
      const chordSpread = clamp(110 + (shape - 82) * 0.3, 92, 140);
      const qAngle = clamp(118 + (shape - 82) * 0.46, 98, 145);
      state.points = {
        A: pointOnCircle(cx, cy, r, 270 - chordSpread / 2),
        B: pointOnCircle(cx, cy, r, 270 + chordSpread / 2),
        P: pointOnCircle(cx, cy, r, 68),
        Q: pointOnCircle(cx, cy, r, qAngle)
      };
      return;
    }

    const spread = clamp(shape, 55, 135);
    state.points = {
      A: pointOnCircle(cx, cy, r, 225),
      B: pointOnCircle(cx, cy, r, 315),
      C: pointOnCircle(cx, cy, r, 45 + (spread - 82) * 0.16),
      D: pointOnCircle(cx, cy, r, 165 - (spread - 82) * 0.12)
    };
  }

  function getHiddenCircle() {
    const p = state.points;
    if (state.scene === "right-angle") {
      const center = midpoint(p.A, p.B);
      return { x: center.x, y: center.y, r: dist(p.A, p.B) / 2 };
    }

    if (state.scene === "equal-angle") {
      return circumcircle(p.A, p.B, p.P) || circumcircle(p.A, p.B, p.Q);
    }

    return circumcircle(p.A, p.B, p.C) || circumcircle(p.A, p.B, p.D);
  }

  function getCircleThroughOtherPoints(pointId) {
    const p = state.points;
    if (state.scene === "equal-angle") {
      if (pointId === "A") return circumcircle(p.B, p.P, p.Q);
      if (pointId === "B") return circumcircle(p.A, p.P, p.Q);
      if (pointId === "P") return circumcircle(p.A, p.B, p.Q);
      if (pointId === "Q") return circumcircle(p.A, p.B, p.P);
    }

    if (state.scene === "opposite-angle") {
      if (pointId === "A") return circumcircle(p.B, p.C, p.D);
      if (pointId === "B") return circumcircle(p.A, p.C, p.D);
      if (pointId === "C") return circumcircle(p.A, p.B, p.D);
      if (pointId === "D") return circumcircle(p.A, p.B, p.C);
    }

    return null;
  }

  function getMetrics() {
    const p = state.points;
    if (state.scene === "right-angle") {
      const angle = angleBetween(p.A, p.P, p.B);
      const diff = Math.abs(angle - 90);
      return {
        main: `∠APB = ${round(angle)}°`,
        secondary: `距直角 ${round(diff)}°`,
        status: diff <= 1.5 ? "判定成立" : diff <= 6 ? "接近成立" : "条件未满足",
        ok: diff <= 1.5,
        near: diff <= 6,
        proof: "因为 AP ⟂ BP，所以 P 落在以 AB 为直径的圆上。"
      };
    }

    if (state.scene === "equal-angle") {
      const angleP = angleBetween(p.A, p.P, p.B);
      const angleQ = angleBetween(p.A, p.Q, p.B);
      const sameSide = signedSide(p.A, p.B, p.P) * signedSide(p.A, p.B, p.Q) > 0;
      const diff = sameSide ? Math.abs(angleP - angleQ) : Math.abs(angleP + angleQ - 180);
      return {
        main: sameSide
          ? `∠APB = ${round(angleP)}°，∠AQB = ${round(angleQ)}°`
          : `∠APB + ∠AQB = ${round(angleP + angleQ)}°`,
        secondary: sameSide ? `等角偏差 ${round(diff)}°` : `互补偏差 ${round(diff)}°`,
        status: diff <= 1.5 ? "四点共圆" : diff <= 6 ? "接近共圆" : "条件未满足",
        ok: diff <= 1.5,
        near: diff <= 6,
        proof: sameSide ? "P、Q 在弦 AB 同侧时，同弧所对圆周角相等。" : "P、Q 分居弦 AB 两侧时，对应圆周角互补。"
      };
    }

    const angleA = angleBetween(p.D, p.A, p.B);
    const angleC = angleBetween(p.B, p.C, p.D);
    const sum = angleA + angleC;
    const diff = Math.abs(sum - 180);
    return {
      main: `∠DAB + ∠BCD = ${round(sum)}°`,
      secondary: `距 180° 偏差 ${round(diff)}°`,
      status: diff <= 1.5 ? "四点共圆" : diff <= 6 ? "接近共圆" : "条件未满足",
      ok: diff <= 1.5,
      near: diff <= 6,
      proof: "四边形一组对角互补，就可以反推出四个顶点在同一个圆上。"
    };
  }

  function getCorrectionHint() {
    if (state.snap || state.demoPhase !== "idle") return null;
    const p = state.points;
    let pointId = state.lastDragPoint;
    if (state.scene === "right-angle") pointId = "P";
    if (state.scene === "equal-angle" && !["A", "B", "P", "Q"].includes(pointId)) pointId = "Q";
    if (state.scene === "opposite-angle" && !["A", "B", "C", "D"].includes(pointId)) pointId = "C";
    if (!pointId || !p[pointId]) return null;

    const circle = state.scene === "right-angle" ? getHiddenCircle() : getCircleThroughOtherPoints(pointId);
    const target = projectToCircle(p[pointId], circle);
    const offset = dist(p[pointId], target);
    if (!circle || offset < 4) return null;
    return {
      pointId,
      from: p[pointId],
      to: target,
      offset
    };
  }

  function line(a, b, className) {
    return `<line class="${className}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`;
  }

  function polygon(points, className) {
    return `<polygon class="${className}" points="${points.map(p => `${p.x},${p.y}`).join(" ")}"></polygon>`;
  }

  function circleEl(circle, className) {
    if (!circle || !Number.isFinite(circle.r)) return "";
    return `<circle class="${className}" cx="${circle.x}" cy="${circle.y}" r="${Math.max(0, circle.r)}"></circle>`;
  }

  function angleSector(vertex, armA, armB, radius, className) {
    const a1 = Math.atan2(armA.y - vertex.y, armA.x - vertex.x);
    let delta = normalizeAngleRad(Math.atan2(armB.y - vertex.y, armB.x - vertex.x) - a1);
    const end = a1 + delta;
    const startPoint = { x: vertex.x + Math.cos(a1) * radius, y: vertex.y + Math.sin(a1) * radius };
    const endPoint = { x: vertex.x + Math.cos(end) * radius, y: vertex.y + Math.sin(end) * radius };
    const large = Math.abs(delta) > Math.PI ? 1 : 0;
    const sweep = delta >= 0 ? 1 : 0;
    return `<path class="${className}" d="M ${vertex.x} ${vertex.y} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${large} ${sweep} ${endPoint.x} ${endPoint.y} Z"></path>`;
  }

  function rightAngleMark(vertex, armA, armB, size = 20) {
    const u = unitVector(vertex, armA);
    const v = unitVector(vertex, armB);
    const p1 = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
    const p2 = { x: p1.x + v.x * size, y: p1.y + v.y * size };
    const p3 = { x: vertex.x + v.x * size, y: vertex.y + v.y * size };
    return `<path class="right-angle-mark ${state.demoPhase === "condition" ? "demo-pulse" : ""}" d="M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}"></path>`;
  }

  function pointGroup(id, p) {
    const colorClass = id === "P" || id === "Q" ? "p-orange" : id === "C" || id === "D" ? "p-green" : "";
    const activeClass = state.activeDragPoint === id ? "active-drag-point" : "";
    return `
      <g class="geo-point-wrapper ${activeClass}" data-point-id="${id}">
        <circle class="geo-point-hit" cx="${p.x}" cy="${p.y}" r="34"></circle>
        <circle class="geo-point-halo" cx="${p.x}" cy="${p.y}" r="20"></circle>
        <circle class="geo-point ${colorClass}" cx="${p.x}" cy="${p.y}" r="7.5"></circle>
      </g>
    `;
  }

  function labelSvg(id, p) {
    const offsets = {
      A: { x: -22, y: -12 },
      B: { x: 16, y: -12 },
      C: { x: 16, y: 22 },
      D: { x: -24, y: 10 },
      P: { x: 14, y: -14 },
      Q: { x: 15, y: 18 },
      O: { x: 11, y: -12 }
    };
    const o = offsets[id] || { x: 12, y: -12 };
    return `<text class="geo-label" x="${p.x + o.x}" y="${p.y + o.y}">${escapeHtml(id)}</text>`;
  }

  function overlayLabel(items, text, x, y, className = "") {
    const { w, h } = getWrapperSize();
    const hudWidth = state.hudExpanded ? Math.min(320, Math.max(220, w * 0.4)) : 140;
    const hudHeight = state.hudExpanded ? 230 : 54;
    let safeX = clamp(x, 58, w - 58);
    let safeY = clamp(y, 44, h - 44);
    const insideHud = safeX < 18 + hudWidth + 20 && safeY < 18 + hudHeight + 16;
    if (insideHud) {
      safeX = Math.min(w - 58, 18 + hudWidth + 72);
      safeY = Math.max(safeY, 88);
    }
    const screen = localToScreen(safeX, safeY);
    items.push(`<div class="floating-label ${className}" data-local-x="${safeX}" data-local-y="${safeY}" style="left:${screen.x}px;top:${screen.y}px;">${escapeHtml(text)}</div>`);
  }

  function renderCorrectionHint(svgParts, overlayParts) {
    const hint = getCorrectionHint();
    if (!hint) return;
    svgParts.push(line(hint.from, hint.to, "geo-line correction-line"));
    svgParts.push(`
      <g class="correction-target">
        <circle cx="${hint.to.x}" cy="${hint.to.y}" r="18"></circle>
        <circle cx="${hint.to.x}" cy="${hint.to.y}" r="6"></circle>
      </g>
    `);
    const labelPoint = midpoint(hint.from, hint.to);
    overlayLabel(overlayParts, `校准 ${hint.pointId}：${Math.round(hint.offset)}px`, labelPoint.x, labelPoint.y - 18, "violet");
  }

  function renderRightAngle(svgParts, overlayParts, circle) {
    const p = state.points;
    const metrics = getMetrics();
    if (state.layers.circle) {
      svgParts.push(circleEl(circle, `hidden-circle ${state.demoPhase === "circle" ? "demo-hot demo-pulse" : ""}`));
      if (state.layers.proof) {
        const o = { x: circle.x, y: circle.y };
        svgParts.push(line(p.A, p.B, "geo-line aux"));
        svgParts.push(line(o, p.P, "geo-line aux"));
        svgParts.push(`<circle class="geo-point fixed" cx="${o.x}" cy="${o.y}" r="5"></circle>`);
        svgParts.push(labelSvg("O", o));
        overlayLabel(overlayParts, "AB 是直径", circle.x, p.A.y + 28, "blue");
      }
    }
    svgParts.push(polygon([p.A, p.P, p.B], "geo-poly blue"));
    svgParts.push(line(p.A, p.P, "geo-line blue"));
    svgParts.push(line(p.P, p.B, "geo-line orange"));
    svgParts.push(line(p.A, p.B, "geo-line main"));
    if (state.layers.condition) {
      const angle = angleBetween(p.A, p.P, p.B);
      if (Math.abs(angle - 90) <= 8 || state.snap) {
        svgParts.push(rightAngleMark(p.P, p.A, p.B, 20));
      } else {
        svgParts.push(angleSector(p.P, p.A, p.B, 34, `angle-sector orange ${state.demoPhase === "condition" ? "demo-pulse" : ""}`));
      }
      overlayLabel(overlayParts, metrics.main, p.P.x + 16, p.P.y + 38, metrics.ok ? "green" : "orange");
    }
    if (state.layers.proof) {
      overlayLabel(overlayParts, "直角 → 直径圆", circle.x, circle.y - circle.r - 18, "green");
    }
  }

  function renderEqualAngle(svgParts, overlayParts, circle) {
    const p = state.points;
    const metrics = getMetrics();
    if (state.layers.circle) {
      svgParts.push(circleEl(circle, `hidden-circle ${state.demoPhase === "circle" ? "demo-hot demo-pulse" : ""}`));
    }
    svgParts.push(polygon([p.A, p.P, p.B], "geo-poly blue"));
    svgParts.push(polygon([p.A, p.Q, p.B], "geo-poly orange"));
    svgParts.push(line(p.A, p.B, "geo-line main"));
    svgParts.push(line(p.A, p.P, "geo-line blue"));
    svgParts.push(line(p.P, p.B, "geo-line blue"));
    svgParts.push(line(p.A, p.Q, "geo-line orange"));
    svgParts.push(line(p.Q, p.B, "geo-line orange"));
    if (state.layers.condition) {
      const pulseClass = state.demoPhase === "condition" ? " demo-pulse" : "";
      svgParts.push(angleSector(p.P, p.A, p.B, 34, `angle-sector blue${pulseClass}`));
      svgParts.push(angleSector(p.Q, p.A, p.B, 34, `angle-sector orange${pulseClass}`));
      overlayLabel(overlayParts, `∠P ${round(angleBetween(p.A, p.P, p.B))}°`, p.P.x, p.P.y + 42, "blue");
      overlayLabel(overlayParts, `∠Q ${round(angleBetween(p.A, p.Q, p.B))}°`, p.Q.x, p.Q.y + 42, "orange");
    }
    if (state.layers.proof) {
      const mid = midpoint(p.A, p.B);
      svgParts.push(line(mid, p.P, "geo-line aux"));
      svgParts.push(line(mid, p.Q, "geo-line aux"));
      overlayLabel(overlayParts, metrics.proof, mid.x, mid.y - 28, "green");
    }
  }

  function renderOppositeAngle(svgParts, overlayParts, circle) {
    const p = state.points;
    const metrics = getMetrics();
    if (state.layers.circle) {
      svgParts.push(circleEl(circle, `hidden-circle ${state.demoPhase === "circle" ? "demo-hot demo-pulse" : ""}`));
    }
    svgParts.push(polygon([p.A, p.B, p.C, p.D], "geo-poly green"));
    svgParts.push(line(p.A, p.B, "geo-line blue"));
    svgParts.push(line(p.B, p.C, "geo-line green"));
    svgParts.push(line(p.C, p.D, "geo-line orange"));
    svgParts.push(line(p.D, p.A, "geo-line violet"));
    if (state.layers.condition) {
      const pulseClass = state.demoPhase === "condition" ? " demo-pulse" : "";
      svgParts.push(angleSector(p.A, p.D, p.B, 40, `angle-sector blue${pulseClass}`));
      svgParts.push(angleSector(p.C, p.B, p.D, 40, `angle-sector orange${pulseClass}`));
      overlayLabel(overlayParts, `∠A ${round(angleBetween(p.D, p.A, p.B))}°`, p.A.x - 6, p.A.y - 42, "blue");
      overlayLabel(overlayParts, `∠C ${round(angleBetween(p.B, p.C, p.D))}°`, p.C.x + 8, p.C.y + 42, "orange");
    }
    if (state.layers.proof) {
      svgParts.push(line(p.A, p.C, "geo-line aux"));
      svgParts.push(line(p.B, p.D, "geo-line aux"));
      overlayLabel(overlayParts, metrics.main, circle.x, circle.y - circle.r - 18, metrics.ok ? "green" : "orange");
    }
  }

  function render() {
    const { w, h } = getWrapperSize();
    sandboxSvg.setAttribute("width", String(w));
    sandboxSvg.setAttribute("height", String(h));
    updateSvgViewport();

    const circle = getHiddenCircle();
    const svgParts = [];
    const overlayParts = [];

    if (state.scene === "right-angle") renderRightAngle(svgParts, overlayParts, circle);
    if (state.scene === "equal-angle") renderEqualAngle(svgParts, overlayParts, circle);
    if (state.scene === "opposite-angle") renderOppositeAngle(svgParts, overlayParts, circle);
    renderCorrectionHint(svgParts, overlayParts);

    Object.keys(state.points).forEach(id => {
      svgParts.push(pointGroup(id, state.points[id]));
    });
    Object.keys(state.points).forEach(id => {
      svgParts.push(labelSvg(id, state.points[id]));
    });

    sandboxSvg.innerHTML = svgParts.join("");
    htmlOverlay.innerHTML = overlayParts.join("");
    updateHud();
    updatePanelState();
  }

  function updateHud() {
    const metrics = getMetrics();
    const scene = SCENES[state.scene];
    const phaseText = state.demoPhase === "condition" ? "1 看条件"
      : state.demoPhase === "circle" ? "2 补隐圆"
        : state.demoPhase === "proof" ? "3 得结论"
          : state.snap ? "吸附判定" : "自由探索";
    hudChip.textContent = metrics.status;
    hudChip.style.background = metrics.ok ? "rgba(5,150,105,0.12)" : metrics.near ? "rgba(245,158,11,0.14)" : "rgba(225,29,72,0.1)";
    hudChip.style.color = metrics.ok ? "#047857" : metrics.near ? "#92400e" : "#be123c";
    hudBody.innerHTML = `
      <div class="hud-kpi">
        <span>${escapeHtml(scene.title)}</span>
        <strong>${escapeHtml(metrics.main)}</strong>
      </div>
      <div class="hud-mini">
        <div><span>判定反馈</span><b>${escapeHtml(metrics.status)}</b></div>
        <div><span>${escapeHtml(phaseText)}</span><b>${escapeHtml(state.snap ? metrics.secondary : "看紫色校准线")}</b></div>
      </div>
      <div class="hud-proof">${escapeHtml(metrics.proof)}</div>
    `;
  }

  function updateTheory() {
    const scene = SCENES[state.scene];
    let steps = "";
    if (state.scene === "right-angle") {
      steps = `
        <div><b>1</b><span>先找直角顶点 P 与斜边 AB。</span></div>
        <div><b>2</b><span>以 AB 中点为圆心、AB 为直径作圆。</span></div>
        <div><b>3</b><span>P 在圆上，后续可转化为圆周角、弦、切线问题。</span></div>
      `;
    } else if (state.scene === "equal-angle") {
      steps = `
        <div><b>1</b><span>确认两个角都“看”同一条弦 AB。</span></div>
        <div><b>2</b><span>同侧等角或异侧互补，都指向同一个圆。</span></div>
        <div><b>3</b><span>补出隐圆后，可继续使用圆周角关系。</span></div>
      `;
    } else {
      steps = `
        <div><b>1</b><span>锁定四边形中的一组对角。</span></div>
        <div><b>2</b><span>验证对角和是否为 180°。</span></div>
        <div><b>3</b><span>判定四点共圆，再转入圆内角关系。</span></div>
      `;
    }
    theoryTitle.textContent = scene.title;
    theoryText.innerHTML = `
      <div class="theory-formula">${escapeHtml(scene.formula)}</div>
      <div class="proof-steps">${steps}</div>
      <div class="theory-note">${escapeHtml(scene.note)}</div>
    `;
  }

  function updatePanelState() {
    document.querySelectorAll(".btn-preset").forEach(button => {
      button.classList.toggle("active", button.getAttribute("data-scene") === state.scene);
    });
    layerControls.querySelectorAll(".layer-step-btn").forEach(button => {
      const layer = button.getAttribute("data-layer");
      button.classList.toggle("active", !!state.layers[layer]);
    });
    btnToggleSnap.classList.toggle("active", state.snap);
    btnToggleSnap.querySelector("span").textContent = state.snap ? "吸附判定" : "自由拖动";
    btnToggleGrid.classList.toggle("active", state.grid);
    btnToggleGrid.querySelector("span").textContent = state.grid ? "隐藏网格" : "显示网格";
    gridOverlay.classList.toggle("visible", state.grid);
    hudPanel.classList.toggle("collapsed", !state.hudExpanded);
    hudPanel.classList.toggle("expanded", state.hudExpanded);
    hudToggleBtn.setAttribute("aria-expanded", String(state.hudExpanded));
    hudTitle.textContent = "隐圆板书";
    valSize.textContent = `${Math.round(state.size)} px`;
    valShape.textContent = `${Math.round(state.shape)}°`;
    labelShape.textContent = state.scene === "right-angle" ? "P 点位置" : state.scene === "equal-angle" ? "同弧开合" : "四边形开合";
  }

  function updateTransform() {
    updateSvgViewport();
    positionOverlayLabels();
  }

  function updateSvgViewport() {
    const { w, h } = getWrapperSize();
    const viewX = -state.panX / state.zoom;
    const viewY = -state.panY / state.zoom;
    sandboxSvg.setAttribute("viewBox", `${viewX} ${viewY} ${w / state.zoom} ${h / state.zoom}`);
    sandboxSvg.style.transform = "";
    htmlOverlay.style.transform = "";
  }

  function positionOverlayLabels() {
    htmlOverlay.querySelectorAll(".floating-label").forEach(label => {
      const x = Number(label.getAttribute("data-local-x"));
      const y = Number(label.getAttribute("data-local-y"));
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const screen = localToScreen(x, y);
      label.style.left = `${screen.x}px`;
      label.style.top = `${screen.y}px`;
    });
  }

  function centerView() {
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    updateTransform();
  }

  function clientToLocal(clientX, clientY) {
    const rect = sandboxWrapper.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.panX) / state.zoom,
      y: (clientY - rect.top - state.panY) / state.zoom
    };
  }

  function zoomAt(clientX, clientY, nextZoom) {
    const rect = sandboxWrapper.getBoundingClientRect();
    const localX = (clientX - rect.left - state.panX) / state.zoom;
    const localY = (clientY - rect.top - state.panY) / state.zoom;
    state.zoom = clamp(nextZoom, 0.48, 3);
    state.panX = clientX - rect.left - localX * state.zoom;
    state.panY = clientY - rect.top - localY * state.zoom;
    updateTransform();
  }

  function zoomAtCenter(factor) {
    const rect = sandboxWrapper.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, state.zoom * factor);
  }

  function getNearestPoint(clientX, clientY, radius = 48) {
    const local = clientToLocal(clientX, clientY);
    let best = null;
    let bestDistance = radius / state.zoom;
    SCENES[state.scene].points.forEach(id => {
      const p = state.points[id];
      const d = Math.hypot(local.x - p.x, local.y - p.y);
      if (d < bestDistance) {
        best = id;
        bestDistance = d;
      }
    });
    return best;
  }

  function keepRightAngleSnap() {
    const p = state.points;
    const circle = getHiddenCircle();
    if (!circle) return;
    p.P = projectToCircle(p.P, circle);
  }

  function applyPointDrag(id, localX, localY) {
    const next = clampToBoard({ x: localX, y: localY });
    if (!state.points[id]) return;
    state.lastDragPoint = id;

    if (!state.snap) {
      state.points[id] = next;
      render();
      return;
    }

    if (state.scene === "right-angle") {
      state.points[id] = next;
      if (id === "P") {
        state.points.P = projectToCircle(next, getHiddenCircle());
      } else {
        keepRightAngleSnap();
      }
      render();
      return;
    }

    const circle = getCircleThroughOtherPoints(id);
    state.points[id] = circle ? projectToCircle(next, circle) : next;
    render();
  }

  function startDemo() {
    state.demoTimers.forEach(id => clearTimeout(id));
    state.demoTimers = [];
    state.demoPhase = "condition";
    state.layers.condition = true;
    state.layers.circle = false;
    state.layers.proof = false;
    btnPlayDemo.querySelector("span").textContent = "演示中...";
    render();

    state.demoTimers.push(setTimeout(() => {
      state.demoPhase = "circle";
      state.layers.circle = true;
      render();
    }, 1050));

    state.demoTimers.push(setTimeout(() => {
      state.demoPhase = "proof";
      state.layers.proof = true;
      render();
    }, 2150));

    state.demoTimers.push(setTimeout(() => {
      state.demoPhase = "idle";
      btnPlayDemo.querySelector("span").textContent = "自动演示一遍";
      render();
    }, 3450));
  }

  function loadScene(scene) {
    state.demoTimers.forEach(id => clearTimeout(id));
    state.demoTimers = [];
    state.scene = scene;
    state.demoPhase = "idle";
    state.layers.condition = true;
    state.layers.circle = true;
    state.layers.proof = false;
    if (scene === "right-angle") {
      state.size = 215;
      state.shape = 82;
    } else if (scene === "equal-angle") {
      state.size = 200;
      state.shape = 92;
    } else {
      state.size = 190;
      state.shape = 84;
    }
    sliderSize.value = state.size;
    sliderShape.value = state.shape;
    resetSceneGeometry();
    centerView();
    updateTheory();
    render();
  }

  function applyPreset(preset) {
    if (preset === "standard") {
      state.size = state.scene === "right-angle" ? 215 : state.scene === "equal-angle" ? 200 : 190;
      state.shape = state.scene === "equal-angle" ? 92 : 82;
    } else if (preset === "exam") {
      state.size = state.scene === "right-angle" ? 190 : state.scene === "equal-angle" ? 210 : 205;
      state.shape = state.scene === "right-angle" ? 58 : state.scene === "equal-angle" ? 72 : 66;
    } else {
      state.size = state.scene === "right-angle" ? 235 : state.scene === "equal-angle" ? 220 : 210;
      state.shape = state.scene === "right-angle" ? 128 : state.scene === "equal-angle" ? 126 : 122;
    }
    sliderSize.value = state.size;
    sliderShape.value = state.shape;
    resetSceneGeometry();
    render();
  }

  sandboxWrapper.addEventListener("wheel", event => {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, state.zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08));
  }, { passive: false });

  if (window.PointerEvent) {
    const pointers = new Map();
    let activePointerId = null;
    let pointPointerId = null;

    const beginPan = (point, pointerId) => {
      activePointerId = pointerId;
      state.isPanning = true;
      state.initialTouchDist = 0;
      state.startPanX = point.x - state.panX;
      state.startPanY = point.y - state.panY;
    };

    const beginPinch = () => {
      const [first, second] = Array.from(pointers.values()).slice(0, 2);
      if (!first || !second) return;
      state.activeDragPoint = null;
      pointPointerId = null;
      state.isPanning = false;
      activePointerId = null;
      state.initialTouchDist = Math.hypot(first.x - second.x, first.y - second.y);
      state.initialTouchScale = state.zoom;
      sandboxWrapper.classList.remove("dragging-point");
    };

    const updatePinch = () => {
      const [first, second] = Array.from(pointers.values()).slice(0, 2);
      if (!first || !second || state.initialTouchDist <= 0) return;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      zoomAt((first.x + second.x) / 2, (first.y + second.y) / 2, state.initialTouchScale * (distance / state.initialTouchDist));
    };

    const endPointer = event => {
      if (!pointers.has(event.pointerId)) return;
      if (pointPointerId === event.pointerId) {
        state.activeDragPoint = null;
        pointPointerId = null;
        sandboxWrapper.classList.remove("dragging-point");
      }
      pointers.delete(event.pointerId);

      if (pointers.size >= 2) {
        beginPinch();
      } else if (pointers.size === 1) {
        const [pointerId, point] = Array.from(pointers.entries())[0];
        beginPan(point, pointerId);
      } else {
        activePointerId = null;
        state.isPanning = false;
        state.initialTouchDist = 0;
        sandboxWrapper.classList.remove("dragging-point");
      }
    };

    sandboxWrapper.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.target.closest(".hud-panel, button, input, select, textarea, a, .modal-overlay")) return;

      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      sandboxWrapper.setPointerCapture?.(event.pointerId);
      const pointNode = event.target.closest?.(".geo-point-wrapper");
      const hitRadius = event.pointerType === "touch" ? 58 : 38;
      const pointId = pointNode?.getAttribute("data-point-id") || getNearestPoint(event.clientX, event.clientY, hitRadius);

      if (pointers.size === 1 && pointId) {
        state.activeDragPoint = pointId;
        pointPointerId = event.pointerId;
        sandboxWrapper.classList.add("dragging-point");
      } else if (pointers.size >= 2) {
        beginPinch();
      } else {
        beginPan({ x: event.clientX, y: event.clientY }, event.pointerId);
      }
      event.preventDefault();
    }, { passive: false });

    sandboxWrapper.addEventListener("pointermove", event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointPointerId === event.pointerId && state.activeDragPoint) {
        const local = clientToLocal(event.clientX, event.clientY);
        applyPointDrag(state.activeDragPoint, local.x, local.y);
      } else if (pointers.size >= 2) {
        updatePinch();
      } else if (state.isPanning && activePointerId === event.pointerId) {
        state.panX = event.clientX - state.startPanX;
        state.panY = event.clientY - state.startPanY;
        updateTransform();
      }
      event.preventDefault();
    }, { passive: false });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
      sandboxWrapper.addEventListener(type, endPointer);
    });
  } else {
  sandboxWrapper.addEventListener("mousedown", event => {
    const pointNode = event.target.closest?.(".geo-point-wrapper");
    const pointId = pointNode?.getAttribute("data-point-id") || getNearestPoint(event.clientX, event.clientY, 38);
    if (pointId) {
      state.activeDragPoint = pointId;
      sandboxWrapper.classList.add("dragging-point");
      event.preventDefault();
      return;
    }
    if (event.button === 0) {
      state.isPanning = true;
      state.startPanX = event.clientX - state.panX;
      state.startPanY = event.clientY - state.panY;
      event.preventDefault();
    }
  });

  window.addEventListener("mousemove", event => {
    if (state.activeDragPoint) {
      const local = clientToLocal(event.clientX, event.clientY);
      applyPointDrag(state.activeDragPoint, local.x, local.y);
      event.preventDefault();
      return;
    }
    if (state.isPanning) {
      state.panX = event.clientX - state.startPanX;
      state.panY = event.clientY - state.startPanY;
      updateTransform();
    }
  });

  window.addEventListener("mouseup", () => {
    state.activeDragPoint = null;
    state.isPanning = false;
    state.initialTouchDist = 0;
    sandboxWrapper.classList.remove("dragging-point");
  });

  sandboxWrapper.addEventListener("touchstart", event => {
    if (event.touches.length === 2) {
      state.initialTouchDist = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      state.initialTouchScale = state.zoom;
      event.preventDefault();
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const pointNode = event.target.closest?.(".geo-point-wrapper");
      const pointId = pointNode?.getAttribute("data-point-id") || getNearestPoint(touch.clientX, touch.clientY, 58);
      if (pointId) {
        state.activeDragPoint = pointId;
        sandboxWrapper.classList.add("dragging-point");
        event.preventDefault();
        return;
      }
      state.isPanning = true;
      state.startPanX = touch.clientX - state.panX;
      state.startPanY = touch.clientY - state.panY;
    }
  }, { passive: false });

  sandboxWrapper.addEventListener("touchmove", event => {
    if (event.touches.length === 2 && state.initialTouchDist > 0) {
      const distNow = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      zoomAt(midX, midY, state.initialTouchScale * (distNow / state.initialTouchDist));
      event.preventDefault();
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      if (state.activeDragPoint) {
        const local = clientToLocal(touch.clientX, touch.clientY);
        applyPointDrag(state.activeDragPoint, local.x, local.y);
        event.preventDefault();
        return;
      }
      if (state.isPanning) {
        state.panX = touch.clientX - state.startPanX;
        state.panY = touch.clientY - state.startPanY;
        updateTransform();
        event.preventDefault();
      }
    }
  }, { passive: false });

  sandboxWrapper.addEventListener("touchend", () => {
    state.activeDragPoint = null;
    state.isPanning = false;
    state.initialTouchDist = 0;
    sandboxWrapper.classList.remove("dragging-point");
  });
  }

  document.querySelectorAll(".btn-preset").forEach(button => {
    button.addEventListener("click", () => loadScene(button.getAttribute("data-scene")));
  });

  layerControls.querySelectorAll(".layer-step-btn").forEach(button => {
    button.addEventListener("click", () => {
      const layer = button.getAttribute("data-layer");
      state.layers[layer] = !state.layers[layer];
      state.demoPhase = "idle";
      render();
    });
  });

  document.querySelectorAll(".btn-shape-preset").forEach(button => {
    button.addEventListener("click", () => applyPreset(button.getAttribute("data-preset")));
  });

  sliderSize.addEventListener("input", event => {
    state.size = Number(event.target.value);
    resetSceneGeometry();
    render();
  });

  sliderShape.addEventListener("input", event => {
    state.shape = Number(event.target.value);
    resetSceneGeometry();
    render();
  });

  btnToggleSnap.addEventListener("click", () => {
    state.snap = !state.snap;
    render();
  });

  btnToggleGrid.addEventListener("click", () => {
    state.grid = !state.grid;
    render();
  });

  btnPlayDemo.addEventListener("click", startDemo);
  btnResetState.addEventListener("click", () => loadScene(state.scene));
  hudToggleBtn.addEventListener("click", () => {
    state.hudExpanded = !state.hudExpanded;
    render();
  });

  document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
  document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
  document.getElementById("btn-zoom-reset").addEventListener("click", () => centerView());

  window.addEventListener("resize", () => {
    resetSceneGeometry();
    centerView();
    render();
  });

  ["contextmenu", "selectstart", "dragstart", "copy", "cut", "paste"].forEach(type => {
    sandboxWrapper.addEventListener(type, event => event.preventDefault());
  });

  window.hiddenCircleModelState = {
    get scene() { return state.scene; },
    get points() { return state.points; },
    get metrics() { return getMetrics(); },
    loadScene,
    reset: () => loadScene(state.scene)
  };

  loadScene("right-angle");
});

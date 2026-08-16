(function () {
  "use strict";

  const MODE_META = {
    distribution: {
      title: "图像性质",
      tip: "拖动曲线上的 P 点，观察数量关系",
      html: "<p>当 <b>k &gt; 0</b> 时，图像位于第一、三象限；当 <b>k &lt; 0</b> 时，图像位于第二、四象限。在每个象限内，函数都随 x 的增大而减小。<span class=\"formula\">y = k / x，k 的正负决定图像所在象限</span></p>"
    },
    rectangle: {
      title: "矩形面积不变",
      tip: "拖动 P 点，观察矩形面积保持不变",
      html: "<p>过 P 向两坐标轴作垂线，得到矩形的两边长分别为 |x|、|y|。点 P 始终满足 xy = k。<span class=\"formula\">S矩形 = |x| · |y| = |k|</span></p>"
    },
    triangle: {
      title: "三角形面积关系",
      tip: "拖动 P 点，观察三角形面积保持不变",
      html: "<p>原点、P 点及 P 到 x 轴的投影点构成直角三角形，其两条直角边长为 |x|、|y|。<span class=\"formula\">S三角形 = 1 / 2 · |x| · |y| = |k| / 2</span></p>"
    }
  };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function fixed(value, digits) { return Number(value).toFixed(digits); }

  window.MATH_INVERSE_K_APP = {
    mount(scene, panel) {
      const canvas = scene.querySelector("#inverse-k-canvas");
      const ctx = canvas.getContext("2d");
      const slider = panel.querySelector("#inverse-k-slider");
      const value = panel.querySelector("#inverse-k-value");
      const theoryTitle = panel.querySelector("#inverse-k-theory-title");
      const theory = panel.querySelector("#inverse-k-theory-content");
      const tip = scene.querySelector("#inverse-k-tip");
      const hud = scene.querySelector("#inverse-k-hud");
      const hudToggle = scene.querySelector("#inverse-k-hud-toggle");
      const hudBody = scene.querySelector("#inverse-k-hud-body");
      const play = panel.querySelector("#inverse-k-play");
      const reset = panel.querySelector("#inverse-k-reset");
      const stepButtons = Array.from(panel.querySelectorAll(".inverse-k-step"));
      const cleanups = [];
      const state = { mode: "distribution", k: 4, x: 3, zoom: 1, panX: 0, panY: 0, dragging: null, lastX: 0, lastY: 0, raf: 0, demoStart: 0, dpr: 1, width: 1, height: 1 };
      let observer = null;

      const listen = (target, type, handler, options) => { target.addEventListener(type, handler, options); cleanups.push(() => target.removeEventListener(type, handler, options)); };
      const unit = () => {
        const availableWidth = Math.max(0, state.width - 80);
        const availableHeight = Math.max(0, state.height - 140);
        const fittedUnit = Math.min(38, availableWidth / 10, availableHeight / 8);
        return Math.max(16, fittedUnit) * state.zoom;
      };
      const center = () => ({ x: state.width / 2 + state.panX, y: state.height / 2 + state.panY });
      const toScreen = (x, y) => { const c = center(), u = unit(); return { x: c.x + x * u, y: c.y - y * u }; };
      const toMath = (x, y) => { const c = center(), u = unit(); return { x: (x - c.x) / u, y: (c.y - y) / u }; };

      function resize() {
        const rect = canvas.getBoundingClientRect();
        state.width = Math.max(1, rect.width); state.height = Math.max(1, rect.height); state.dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(state.width * state.dpr); canvas.height = Math.round(state.height * state.dpr);
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0); draw();
      }

      function label(text, x, y, color, align) {
        ctx.save(); ctx.font = "700 12px Microsoft YaHei, sans-serif"; const padX = 8, h = 27, w = ctx.measureText(text).width + padX * 2;
        const desiredLeft = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
        const left = clamp(desiredLeft, 6, Math.max(6, state.width - w - 6));
        ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.shadowColor = "rgba(15,23,42,.14)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
        ctx.beginPath(); ctx.roundRect(left, y - h / 2, w, h, 8); ctx.fill(); ctx.shadowColor = "transparent";
        ctx.fillStyle = color; ctx.textBaseline = "middle"; ctx.fillText(text, left + padX, y); ctx.restore();
      }

      function drawGrid() {
        const c = center(), u = unit();
        ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = "#e2e8f0";
        for (let x = c.x % u; x <= state.width; x += u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, state.height); ctx.stroke(); }
        for (let y = c.y % u; y <= state.height; y += u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(state.width, y); ctx.stroke(); }
        ctx.strokeStyle = "#475569"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(0, c.y); ctx.lineTo(state.width, c.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(c.x, 0); ctx.lineTo(c.x, state.height); ctx.stroke();
        ctx.fillStyle = "#475569"; ctx.font = "700 12px Microsoft YaHei, sans-serif"; ctx.fillText("x", state.width - 18, c.y - 9); ctx.fillText("y", c.x + 9, 17);
        ctx.restore();
      }

      function drawCurve() {
        const maxX = Math.max(8, state.width / unit() / 2 + 2); const minX = .18;
        ctx.save(); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.shadowColor = "rgba(59,130,246,.22)"; ctx.shadowBlur = 10;
        [-1, 1].forEach(sign => { let started = false; ctx.beginPath(); for (let ax = minX; ax <= maxX; ax += .035) { const x = sign * ax, y = state.k / x; const p = toScreen(x, y); if (p.y < -120 || p.y > state.height + 120) { started = false; continue; } if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y); } ctx.stroke(); });
        ctx.restore();
      }

      function drawArea(point) {
        const c = center(), px = point.x, py = point.y;
        const areaColor = state.mode === "rectangle" ? "#f59e0b" : "#e11d48";
        ctx.save(); ctx.strokeStyle = areaColor; ctx.fillStyle = state.mode === "rectangle" ? "rgba(245,158,11,.17)" : "rgba(225,29,72,.17)"; ctx.lineWidth = 3;
        if (state.mode === "rectangle") { ctx.fillRect(c.x, c.y, px - c.x, py - c.y); ctx.strokeRect(c.x, c.y, px - c.x, py - c.y); label("S = |k| = " + fixed(Math.abs(state.k), 2), (c.x + px) / 2, (c.y + py) / 2, "#b45309", "center"); }
        if (state.mode === "triangle") { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(px, c.y); ctx.lineTo(px, py); ctx.closePath(); ctx.fill(); ctx.stroke(); label("S = |k| / 2 = " + fixed(Math.abs(state.k) / 2, 2), (c.x + px * 2) / 3, (c.y * 2 + py) / 3, "#be123c", "center"); }
        ctx.setLineDash([6, 6]); ctx.strokeStyle = "rgba(71,85,105,.72)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, c.y); ctx.moveTo(px, py); ctx.lineTo(c.x, py); ctx.stroke(); ctx.restore();
      }

      function drawPoint(point) {
        ctx.save(); ctx.fillStyle = "rgba(99,102,241,.14)"; ctx.beginPath(); ctx.arc(point.x, point.y, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(point.x, point.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        const right = point.x < state.width - 160; label("P(" + fixed(state.x, 2) + ", " + fixed(state.k / state.x, 2) + ")", point.x + (right ? 16 : -16), point.y - 21, "#4338ca", right ? "left" : "right");
      }

      function drawDirection() {
        const compact = state.width < 360;
        const text = state.k > 0 ? (compact ? "k > 0：第一、三象限" : "k > 0：第一、三象限内，y 随 x 增大而减小") : (compact ? "k < 0：第二、四象限" : "k < 0：第二、四象限内，y 随 x 增大而减小");
        label(text, state.width / 2, state.height - 74, state.k > 0 ? "#15803d" : "#be123c", "center");
      }

      function draw() {
        if (!state.width || !state.height) return;
        ctx.clearRect(0, 0, state.width, state.height); drawGrid(); drawCurve();
        const point = toScreen(state.x, state.k / state.x);
        if (state.mode !== "distribution") drawArea(point); else drawDirection();
        drawPoint(point);
      }

      function sync() {
        const meta = MODE_META[state.mode]; value.textContent = fixed(state.k, 1); slider.value = String(state.k);
        theoryTitle.innerHTML = "<span aria-hidden=\"true\">✦</span> " + meta.title; theory.innerHTML = meta.html; tip.lastChild.nodeValue = " " + meta.tip;
        stepButtons.forEach(button => { const active = button.dataset.mode === state.mode; button.classList.toggle("active", active); button.setAttribute("aria-selected", String(active)); }); draw();
      }

      function setK(next) { const value = Number(next); state.k = Math.abs(value) < .1 ? (state.k < 0 ? -.5 : .5) : clamp(value, -12, 12); state.x = clamp(state.x, -8, 8); if (Math.abs(state.x) < .45) state.x = state.x < 0 ? -.45 : .45; sync(); }
      function setMode(next) { state.mode = MODE_META[next] ? next : "distribution"; sync(); }
      function resetAll() { stopDemo(); state.mode = "distribution"; state.k = 4; state.x = 3; state.zoom = 1; state.panX = 0; state.panY = 0; sync(); }
      function stopDemo() { if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; } state.demoStart = 0; play.textContent = "⟳ 播放动态演示"; }
      function demoFrame(now) { if (!state.demoStart) state.demoStart = now; const elapsed = (now - state.demoStart) / 1000; const phase = elapsed % 12; if (phase < 4) { state.mode = "distribution"; state.k = Math.sin(phase * 1.55) >= 0 ? 4 : -4; state.x = 3; } else if (phase < 8) { state.mode = "rectangle"; state.k = 4; state.x = 3.7 + Math.sin((phase - 4) * 2) * 2; } else { state.mode = "triangle"; state.k = -4; state.x = -3.7 - Math.sin((phase - 8) * 2) * 2; } sync(); state.raf = requestAnimationFrame(demoFrame); }
      function startDemo() { if (state.raf) { stopDemo(); return; } play.textContent = "■ 暂停演示"; state.raf = requestAnimationFrame(demoFrame); }

      function eventPoint(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
      function pointerDown(event) { stopDemo(); const p = eventPoint(event), dot = toScreen(state.x, state.k / state.x); state.dragging = Math.hypot(p.x - dot.x, p.y - dot.y) < 28 ? "point" : "pan"; state.lastX = p.x; state.lastY = p.y; canvas.setPointerCapture?.(event.pointerId); event.preventDefault(); }
      function pointerMove(event) { if (!state.dragging) return; const p = eventPoint(event); if (state.dragging === "point") { const math = toMath(p.x, p.y); state.x = clamp(math.x, -9, 9); if (Math.abs(state.x) < .45) state.x = state.x < 0 ? -.45 : .45; } else { state.panX += p.x - state.lastX; state.panY += p.y - state.lastY; } state.lastX = p.x; state.lastY = p.y; sync(); }
      function pointerUp(event) { state.dragging = null; canvas.releasePointerCapture?.(event.pointerId); }

      listen(slider, "input", () => setK(slider.value));
      stepButtons.forEach(button => listen(button, "click", () => setMode(button.dataset.mode)));
      listen(play, "click", startDemo); listen(reset, "click", resetAll);
      listen(hudToggle, "click", () => { const collapsed = hud.classList.toggle("collapsed"); hudToggle.setAttribute("aria-expanded", String(!collapsed)); });
      listen(scene.querySelector("#inverse-k-zoom-in"), "click", () => { state.zoom = clamp(state.zoom * 1.18, .65, 2.5); draw(); });
      listen(scene.querySelector("#inverse-k-zoom-out"), "click", () => { state.zoom = clamp(state.zoom / 1.18, .65, 2.5); draw(); });
      listen(scene.querySelector("#inverse-k-zoom-reset"), "click", () => { state.zoom = 1; state.panX = 0; state.panY = 0; draw(); });
      listen(canvas, "pointerdown", pointerDown); listen(canvas, "pointermove", pointerMove); listen(canvas, "pointerup", pointerUp); listen(canvas, "pointercancel", pointerUp);
      listen(canvas, "wheel", event => { event.preventDefault(); state.zoom = clamp(state.zoom * (event.deltaY > 0 ? .9 : 1.1), .65, 2.5); draw(); }, { passive: false });
      observer = new ResizeObserver(resize); observer.observe(scene); resize(); sync();

      return () => { stopDemo(); observer?.disconnect(); cleanups.splice(0).forEach(fn => fn()); };
    }
  };
})();

window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};
window.BIO_VISUAL_SCENES["s_b1_m08"] = (function () {
  var PHASES = {
    interphase: { name: "间期", desc: "DNA复制，蛋白质合成，细胞适度生长。染色质呈丝状分布在细胞核内，核膜、核仁清晰可见。" },
    prophase:   { name: "前期", desc: "染色质螺旋化缩短变粗，成为染色体（每条由两条姐妹染色单体组成）。核仁解体，核膜消失，中心体发出纺锤丝形成纺锤体。" },
    metaphase:  { name: "中期", desc: "所有染色体的着丝粒整齐排列在赤道板上，纺锤丝牵引染色体。此时染色体形态固定、数目清晰，是观察染色体最佳时期。" },
    anaphase:   { name: "后期", desc: "着丝粒一分为二，姐妹染色单体分开成为独立的染色体，在纺锤丝牵引下分别移向细胞两极。染色体数目加倍。" },
    telophase:  { name: "末期", desc: "染色体解螺旋恢复为染色质。核膜、核仁重新出现，纺锤体消失。赤道板位置出现细胞板（植物）或缢裂（动物），细胞一分为二。" }
  };
  var PHASE_KEYS = ["interphase","prophase","metaphase","anaphase","telophase"];

  function lerp(a,b,t){ return a+(b-a)*t; }
  function lerpArr(a,b,t){ return a.map(function(v,i){return lerp(v,b[i],t);}); }

  // ---- Target state for each phase ----
  var TARGETS = {
    interphase: {
      nucleusR: 120, nucleusAlpha: 0.22, nucleusDash: 0,
      chromatinAlpha: 0.7, chromosomeAlpha: 0,
      chrY: [0,0,0,0], chrSep: 0,
      centroY: 0, centroSpread: 15,
      spindleAlpha: 0, cellStretchX: 1, cellStretchY: 1,
      cleavage: 0, newNucAlpha: 0
    },
    prophase: {
      nucleusR: 120, nucleusAlpha: 0.08, nucleusDash: 12,
      chromatinAlpha: 0, chromosomeAlpha: 1,
      chrY: [-90,-30,30,90], chrSep: 0,
      centroY: 0, centroSpread: 200,
      spindleAlpha: 0.12, cellStretchX: 1, cellStretchY: 1,
      cleavage: 0, newNucAlpha: 0
    },
    metaphase: {
      nucleusR: 120, nucleusAlpha: 0, nucleusDash: 12,
      chromatinAlpha: 0, chromosomeAlpha: 1,
      chrY: [-90,-30,30,90], chrSep: 0,
      centroY: 0, centroSpread: 230,
      spindleAlpha: 0.55, cellStretchX: 1, cellStretchY: 1,
      cleavage: 0, newNucAlpha: 0
    },
    anaphase: {
      nucleusR: 120, nucleusAlpha: 0, nucleusDash: 12,
      chromatinAlpha: 0, chromosomeAlpha: 1,
      chrY: [-90,-30,30,90], chrSep: 120,
      centroY: 0, centroSpread: 250,
      spindleAlpha: 0.7, cellStretchX: 1.18, cellStretchY: 0.88,
      cleavage: 0, newNucAlpha: 0
    },
    telophase: {
      nucleusR: 80, nucleusAlpha: 0, nucleusDash: 12,
      chromatinAlpha: 0, chromosomeAlpha: 0,
      chrY: [-90,-30,30,90], chrSep: 160,
      centroY: 0, centroSpread: 260,
      spindleAlpha: 0, cellStretchX: 1.25, cellStretchY: 0.82,
      cleavage: 80, newNucAlpha: 0.8
    }
  };

  return {
    mount: function mount(container, sceneEntry, externalPanel) {
      if (!container) return;
      var sceneId = "s_b1_m08";
      var abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var cleanupFns = [];
      var running = true;
      var phase = "interphase";

      // ---- Current animated state ----
      var cur = JSON.parse(JSON.stringify(TARGETS.interphase));
      var t = 0;

      // ---- Style ----
      var style = document.createElement("style");
      style.textContent = [
        '[data-scope="'+sceneId+'"]{width:100%;height:100%;display:flex;background:#09090b}',
        '[data-scope="'+sceneId+'"] .cell-stage{flex:1;min-width:0;position:relative;background:radial-gradient(circle at center,#022c22 0%,#020617 100%);display:flex;flex-direction:column;overflow:hidden}',
        '[data-scope="'+sceneId+'"] .cell-stageHead{position:absolute;top:32px;left:36px;z-index:10;pointer-events:none}',
        '[data-scope="'+sceneId+'"] .cell-kicker{font-size:14px;font-weight:800;color:#34d399;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px}',
        '[data-scope="'+sceneId+'"] .cell-title{font-size:32px;font-weight:900;color:#f8fafc;text-shadow:0 4px 12px rgba(0,0,0,0.5)}',
        '[data-scope="'+sceneId+'"] canvas{position:absolute;inset:0;width:100%!important;height:100%!important}',
        '.cell-panelMount-'+sceneId+'{width:100%;height:100%;padding:18px;background:transparent}',
        '.cell-panel-'+sceneId+'{width:100%;height:100%;display:flex;flex-direction:column;gap:16px;color:#e2e8f0;overflow-y:auto;scrollbar-width:none}',
        '.cell-panel-'+sceneId+'::-webkit-scrollbar{display:none}',
        '.cell-panel-'+sceneId+' *{box-sizing:border-box}',
        '.cell-panel-'+sceneId+' .panel-card{border-radius:20px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);padding:18px;display:grid;gap:14px}',
        '.cell-panel-'+sceneId+' .panel-eyebrow{font-size:11px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;color:rgba(110,231,183,0.72)}',
        '.cell-panel-'+sceneId+' .panel-title{font-size:20px;font-weight:900;line-height:1.3;color:#f8fafc}',
        '.cell-panel-'+sceneId+' .switchRow{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
        '.cell-panel-'+sceneId+' .switchBtn{appearance:none;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#e2e8f0;border-radius:14px;padding:12px 14px;font-size:13px;font-weight:800;text-align:center;cursor:pointer;transition:0.2s ease}',
        '.cell-panel-'+sceneId+' .switchBtn:hover{transform:translateY(-1px)}',
        '.cell-panel-'+sceneId+' .switchBtn.active{background:linear-gradient(135deg,rgba(34,197,94,0.9),rgba(16,185,129,0.84));border-color:rgba(34,197,94,0.24);color:#052e16}',
        '.cell-panel-'+sceneId+' .detailTitle{font-size:22px;line-height:1.3;font-weight:900;color:#f8fafc}',
        '.cell-panel-'+sceneId+' .detailBadge{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:999px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.2);color:#fde68a;font-size:12px;font-weight:900;white-space:nowrap}',
        '.cell-panel-'+sceneId+' .detailText{font-size:15px;line-height:1.85;color:rgba(226,232,240,0.88)}'
      ].join("\n");
      document.head.appendChild(style);

      // ---- Panel Host ----
      var legacyPanelRoot = null, hiddenAsideContent = null, panelHost = externalPanel;
      if (!panelHost) {
        var mainEl = container.closest("main");
        if (mainEl) {
          var asideEl = mainEl.querySelector("[data-courseware-aside='true']");
          if (asideEl) {
            hiddenAsideContent = asideEl.firstElementChild || null;
            if (hiddenAsideContent) hiddenAsideContent.style.display = "none";
            legacyPanelRoot = document.createElement("div");
            legacyPanelRoot.className = "cell-panelMount-" + sceneId;
            asideEl.appendChild(legacyPanelRoot);
            panelHost = legacyPanelRoot;
          }
        }
      }

      function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

      function renderPanel() {
        if (!panelHost) return;
        var info = PHASES[phase];
        var phaseIdx = PHASE_KEYS.indexOf(phase);
        panelHost.innerHTML = '<div class="cell-panel-'+sceneId+'">'
          + '<div class="panel-card">'
          + '<div class="panel-eyebrow">阶段控制</div>'
          + '<div class="panel-title">有丝分裂过程</div>'
          + '<div class="switchRow">' + PHASE_KEYS.map(function(k){
              return '<button class="switchBtn'+(phase===k?' active':'')+'" type="button" data-action="phase" data-value="'+k+'">'+esc(PHASES[k].name)+'</button>';
            }).join('') + '</div>'
          + '</div>'
          + '<div class="panel-card">'
          + '<div class="panel-eyebrow">当前阶段</div>'
          + '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">'
          + '<div class="detailTitle">'+esc(info.name)+'</div>'
          + '<div class="detailBadge">'+(phaseIdx+1)+' / '+PHASE_KEYS.length+'</div>'
          + '</div>'
          + '<div class="detailText">'+esc(info.desc)+'</div>'
          + '</div>'
          + '</div>';
      }

      // ---- Canvas Setup ----
      container.setAttribute("data-scope", sceneId);
      container.innerHTML = '<div class="cell-stage">'
        + '<div class="cell-stageHead"><div class="cell-kicker">全息学术模拟</div><div class="cell-title">有丝分裂过程</div></div>'
        + '</div>';
      var stageEl = container.querySelector(".cell-stage");
      var canvas = document.createElement("canvas");
      stageEl.appendChild(canvas);
      var ctx = canvas.getContext("2d");
      var W = 800, H = 800, cx = 400, cy = 400;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);

      function resize() {
        var rect = stageEl.getBoundingClientRect();
        W = rect.width; H = rect.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        cx = W / 2; cy = H / 2;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener("resize", resize);
      cleanupFns.push(function(){ window.removeEventListener("resize", resize); });

      // ---- Drawing helpers ----
      var cellR = 0;
      function getCellR(){ return Math.min(W, H) * 0.38; }

      function drawGlow(x, y, r, color, alpha) {
        var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, color.replace("1)", alpha + ")"));
        grad.addColorStop(1, color.replace("1)", "0)"));
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
      }

      function drawCell() {
        cellR = getCellR();
        var sx = cur.cellStretchX, sy = cur.cellStretchY;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sx, sy);

        // Outer glow
        drawGlow(0, 0, cellR * 1.5, "rgba(16,185,129,1)", 0.06);

        // Cell membrane
        ctx.beginPath(); ctx.arc(0, 0, cellR, 0, Math.PI*2);
        ctx.strokeStyle = "rgba(52,211,153,0.5)";
        ctx.lineWidth = 5;
        ctx.stroke();

        // Cytoplasm fill
        var cGrad = ctx.createRadialGradient(0, 0, cellR*0.1, 0, 0, cellR);
        cGrad.addColorStop(0, "rgba(16,185,129,0.08)");
        cGrad.addColorStop(1, "rgba(2,6,23,0.02)");
        ctx.fillStyle = cGrad;
        ctx.fill();

        // Cleavage furrow (telophase)
        if (cur.cleavage > 2) {
          ctx.beginPath();
          ctx.moveTo(0, -cellR);
          ctx.quadraticCurveTo(cur.cleavage, 0, 0, cellR);
          ctx.strokeStyle = "rgba(52,211,153,0.5)"; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -cellR);
          ctx.quadraticCurveTo(-cur.cleavage, 0, 0, cellR);
          ctx.stroke();
        }

        ctx.restore();
      }

      function drawNucleus() {
        if (cur.nucleusAlpha < 0.005) return;
        ctx.save(); ctx.translate(cx, cy);
        ctx.globalAlpha = cur.nucleusAlpha;
        ctx.beginPath(); ctx.arc(0, 0, cur.nucleusR, 0, Math.PI*2);
        ctx.strokeStyle = "#34d399"; ctx.lineWidth = 3;
        if (cur.nucleusDash > 1) ctx.setLineDash([cur.nucleusDash, cur.nucleusDash]);
        ctx.stroke(); ctx.setLineDash([]);
        var nGrad = ctx.createRadialGradient(0,0,0,0,0,cur.nucleusR);
        nGrad.addColorStop(0,"rgba(16,185,129,0.12)");
        nGrad.addColorStop(1,"rgba(16,185,129,0.02)");
        ctx.fillStyle = nGrad; ctx.fill();
        ctx.globalAlpha = 1; ctx.restore();
      }

      function drawChromatin() {
        if (cur.chromatinAlpha < 0.01) return;
        ctx.save(); ctx.translate(cx, cy);
        ctx.globalAlpha = cur.chromatinAlpha;
        ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 3; ctx.lineCap = "round";
        // Draw several random-ish chromatin threads
        var paths = [
          [-60,-70, -20,-40, 30,-60, 70,-20],
          [-80,10, -30,40, 20,10, 60,50],
          [-50,60, 10,80, 50,40, 80,70],
          [-40,-30, 20,-60, 60,-10, 30,30],
          [-70,30, -20,-10, 40,20, 10,60]
        ];
        for (var i = 0; i < paths.length; i++) {
          var p = paths[i];
          ctx.beginPath(); ctx.moveTo(p[0],p[1]);
          ctx.bezierCurveTo(p[2],p[3],p[4],p[5],p[6],p[7]);
          ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.restore();
      }

      // Draw a single X-shaped chromosome
      function drawChromosome(ox, oy, sep) {
        var armLen = 28, armW = 7;
        // Left chromatid
        ctx.save(); ctx.translate(ox - sep, oy);
        ctx.strokeStyle = "#34d399"; ctx.lineWidth = armW; ctx.lineCap = "round";
        ctx.shadowColor = "#34d399"; ctx.shadowBlur = 12;
        // Upper arm
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-8, -armLen*0.5, -14, -armLen); ctx.stroke();
        // Lower arm
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-8, armLen*0.5, -14, armLen); ctx.stroke();
        // Centromere dot
        ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2);
        ctx.fillStyle = "#fef08a"; ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();

        // Right chromatid
        ctx.save(); ctx.translate(ox + sep, oy);
        ctx.strokeStyle = "#34d399"; ctx.lineWidth = armW; ctx.lineCap = "round";
        ctx.shadowColor = "#34d399"; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(8, -armLen*0.5, 14, -armLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(8, armLen*0.5, 14, armLen); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2);
        ctx.fillStyle = "#fef08a"; ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      }

      function drawChromosomes() {
        if (cur.chromosomeAlpha < 0.01) return;
        ctx.save(); ctx.translate(cx, cy);
        ctx.globalAlpha = cur.chromosomeAlpha;
        for (var i = 0; i < 4; i++) {
          drawChromosome(0, cur.chrY[i], cur.chrSep);
        }
        ctx.globalAlpha = 1; ctx.restore();
      }

      function drawCentrosomes() {
        ctx.save(); ctx.translate(cx, cy + cur.centroY);
        var spots = [[-cur.centroSpread, 0], [cur.centroSpread, 0]];
        for (var i = 0; i < 2; i++) {
          var sx = spots[i][0], sy = spots[i][1];
          drawGlow(sx, sy, 30, "rgba(251,191,36,1)", 0.25);
          ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI*2);
          ctx.fillStyle = "#fcd34d"; ctx.fill();
          // outer ring
          ctx.beginPath(); ctx.arc(sx, sy, 12, 0, Math.PI*2);
          ctx.strokeStyle = "rgba(252,211,77,0.5)"; ctx.lineWidth = 1.5;
          ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.restore();
      }

      function drawSpindles() {
        if (cur.spindleAlpha < 0.01) return;
        ctx.save(); ctx.translate(cx, cy);
        ctx.globalAlpha = cur.spindleAlpha;
        ctx.strokeStyle = "rgba(251,191,36,0.6)"; ctx.lineWidth = 1.5;
        ctx.setLineDash([5,5]);
        var lx = -cur.centroSpread, rx = cur.centroSpread;
        for (var i = 0; i < 4; i++) {
          var ty = cur.chrY[i];
          // left spindle
          ctx.beginPath(); ctx.moveTo(lx, cur.centroY); ctx.lineTo(-cur.chrSep, ty); ctx.stroke();
          // right spindle
          ctx.beginPath(); ctx.moveTo(rx, cur.centroY); ctx.lineTo(cur.chrSep, ty); ctx.stroke();
        }
        ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.restore();
      }

      function drawNewNuclei() {
        if (cur.newNucAlpha < 0.01) return;
        ctx.save(); ctx.translate(cx, cy);
        ctx.globalAlpha = cur.newNucAlpha;
        var offsets = [-cur.centroSpread * 0.65, cur.centroSpread * 0.65];
        for (var i = 0; i < 2; i++) {
          var nx = offsets[i];
          ctx.beginPath(); ctx.arc(nx, 0, cur.nucleusR, 0, Math.PI*2);
          ctx.strokeStyle = "#34d399"; ctx.lineWidth = 2.5;
          ctx.stroke();
          var nGrad = ctx.createRadialGradient(nx,0,0,nx,0,cur.nucleusR);
          nGrad.addColorStop(0,"rgba(16,185,129,0.1)");
          nGrad.addColorStop(1,"rgba(16,185,129,0.01)");
          ctx.fillStyle = nGrad; ctx.fill();
          // chromatin inside
          ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 2; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(nx-30, -20); ctx.quadraticCurveTo(nx, -40, nx+30, -15);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(nx-25, 10); ctx.quadraticCurveTo(nx+10, 30, nx+25, 5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.restore();
      }

      // Floating particles for cytoplasm depth
      var particles = [];
      for (var i = 0; i < 60; i++) {
        particles.push({
          x: (Math.random()-0.5)*2, y: (Math.random()-0.5)*2,
          r: Math.random()*2+0.5, speed: Math.random()*0.3+0.1,
          angle: Math.random()*Math.PI*2, alpha: Math.random()*0.3+0.05
        });
      }

      function drawParticles(time) {
        ctx.save(); ctx.translate(cx, cy);
        cellR = getCellR();
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          var px = p.x * cellR * 0.85 + Math.sin(time*0.001*p.speed + p.angle) * 8;
          var py = p.y * cellR * 0.85 + Math.cos(time*0.001*p.speed + p.angle) * 8;
          if (px*px + py*py > cellR*cellR*0.9) continue;
          ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI*2);
          ctx.fillStyle = "rgba(167,243,208," + p.alpha + ")";
          ctx.fill();
        }
        ctx.restore();
      }

      // ---- Animation Loop ----
      function frame(time) {
        if (!running) return;
        requestAnimationFrame(frame);

        var target = TARGETS[phase];
        var spd = 0.04;
        cur.nucleusR = lerp(cur.nucleusR, target.nucleusR, spd);
        cur.nucleusAlpha = lerp(cur.nucleusAlpha, target.nucleusAlpha, spd);
        cur.nucleusDash = lerp(cur.nucleusDash, target.nucleusDash, spd);
        cur.chromatinAlpha = lerp(cur.chromatinAlpha, target.chromatinAlpha, spd);
        cur.chromosomeAlpha = lerp(cur.chromosomeAlpha, target.chromosomeAlpha, spd);
        cur.chrSep = lerp(cur.chrSep, target.chrSep, spd);
        cur.centroY = lerp(cur.centroY, target.centroY, spd);
        cur.centroSpread = lerp(cur.centroSpread, target.centroSpread, spd);
        cur.spindleAlpha = lerp(cur.spindleAlpha, target.spindleAlpha, spd);
        cur.cellStretchX = lerp(cur.cellStretchX, target.cellStretchX, spd);
        cur.cellStretchY = lerp(cur.cellStretchY, target.cellStretchY, spd);
        cur.cleavage = lerp(cur.cleavage, target.cleavage, spd);
        cur.newNucAlpha = lerp(cur.newNucAlpha, target.newNucAlpha, spd);
        cur.chrY = lerpArr(cur.chrY, target.chrY, spd);

        ctx.clearRect(0, 0, W, H);
        drawCell();
        drawParticles(time);
        drawSpindles();
        drawNucleus();
        drawChromatin();
        drawChromosomes();
        drawCentrosomes();
        drawNewNuclei();
      }
      requestAnimationFrame(frame);

      // ---- Events ----
      function onAction(e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        if (btn.getAttribute("data-action") === "phase") {
          var v = btn.getAttribute("data-value");
          if (PHASES[v] && phase !== v) { phase = v; renderPanel(); }
        }
      }
      container.addEventListener("click", onAction);
      cleanupFns.push(function(){ container.removeEventListener("click", onAction); });
      if (panelHost && panelHost !== container) {
        panelHost.addEventListener("click", onAction);
        cleanupFns.push(function(){ panelHost.removeEventListener("click", onAction); });
      }

      renderPanel();

      // ---- Cleanup ----
      container.__bioSceneCleanup = function() {
        running = false;
        if (abortCtrl) abortCtrl.abort();
        cleanupFns.forEach(function(fn){ fn(); });
        if (style.parentNode) style.parentNode.removeChild(style);
        if (hiddenAsideContent) hiddenAsideContent.style.display = "";
        if (legacyPanelRoot && legacyPanelRoot.parentNode) legacyPanelRoot.parentNode.removeChild(legacyPanelRoot);
        if (externalPanel) externalPanel.innerHTML = "";
      };
    },
    unmount: function(container) {
      if (container && container.__bioSceneCleanup) { container.__bioSceneCleanup(); delete container.__bioSceneCleanup; }
      if (container) container.innerHTML = "";
    }
  };
})();

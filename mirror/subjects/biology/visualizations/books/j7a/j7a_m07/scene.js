window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7a_m07"] = (function () {
  function escapeHtml(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  return {
    mount: function mount(container, context) {
      const externalPanel = context && context.externalPanel ? context.externalPanel : null;
      const sceneId = "phet-organ-" + Math.random().toString(36).slice(2, 9);
      
      container.innerHTML = "";
      container.style.position = "relative";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";
      container.setAttribute("data-scope", sceneId);

      // Modes: 'seed', 'root', 'stem'
      let currentMode = 'seed';
      // States
      let seedCut = false;
      let stemDyed = false;
      let rootZone = null;

      const style = document.createElement("style");
      style.textContent = `
        [data-scope="${sceneId}"] { background: #020617; color: #e2e8f0; font-family: "Inter", sans-serif; }
        [data-scope="${sceneId}"] * { box-sizing: border-box; }
        [data-scope="${sceneId}"] .stage-wrapper { width: 100%; height: 100%; padding: 24px; position: relative; }
        [data-scope="${sceneId}"] .svg-container {
          width: 100%; height: 100%; border-radius: 30px;
          background: radial-gradient(circle at 50% 50%, #064e3b, #020617);
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: inset 0 0 80px rgba(5, 150, 105, 0.1);
          overflow: hidden; cursor: crosshair;
        }
        [data-scope="${sceneId}"] svg { width: 100%; height: 100%; display: block; }
        [data-scope="${sceneId}"] .scene-header { position: absolute; left: 48px; top: 48px; z-index: 10; pointer-events: none; }
        [data-scope="${sceneId}"] .scene-kicker { font-size: 13px; font-weight: 900; letter-spacing: 0.22em; color: #34d399; text-transform: uppercase; }
        [data-scope="${sceneId}"] .scene-title { font-size: 26px; font-weight: 900; color: #fff; margin-top: 8px; }

        .panel-${sceneId} { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; color: #f8fafc; }
        .panel-${sceneId}::-webkit-scrollbar { display: none; }
        .panel-${sceneId} .card { border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 24px; display: flex; flex-direction: column; gap: 16px; backdrop-filter: blur(16px); }
        .panel-${sceneId} .card-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #34d399; }
        .panel-${sceneId} .card-title { font-size: 22px; font-weight: 900; color: #fff; }
        
        .panel-${sceneId} .tab-row { display: flex; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; }
        .panel-${sceneId} .tab-btn { background: transparent; border: none; color: #94a3b8; font-size: 16px; font-weight: bold; cursor: pointer; padding: 8px 12px; border-radius: 8px; transition: 0.2s; }
        .panel-${sceneId} .tab-btn:hover { background: rgba(255,255,255,0.05); }
        .panel-${sceneId} .tab-btn.active { color: #10b981; background: rgba(16, 185, 129, 0.1); }

        .panel-${sceneId} .action-btn { 
           appearance: none; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); 
           border-radius: 14px; padding: 16px; color: #a7f3d0; font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .panel-${sceneId} .action-btn:hover { background: rgba(16, 185, 129, 0.2); transform: translateY(-2px); }
        .panel-${sceneId} .action-btn:active { transform: translateY(0); }

        .panel-${sceneId} .desc-box { font-size: 14px; line-height: 1.8; color: rgba(226,232,240,0.9); background: rgba(0,0,0,0.25); padding: 18px; border-radius: 14px; border-left: 3px solid #10b981; transition: 0.3s; }
        
        /* Interactive Areas */
        [data-scope="${sceneId}"] .hotspot { cursor: pointer; transition: 0.3s; }
        [data-scope="${sceneId}"] .hotspot:hover { filter: brightness(1.2); }
      `;
      document.head.appendChild(style);

      container.innerHTML = `
        <div class="stage-wrapper">
          <div class="scene-header">
            <div class="scene-kicker">解剖图解 · 虚拟实验室</div>
            <div class="scene-title">植物营养器官微观解剖</div>
          </div>
          <div class="svg-container">
            <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="seed-grad" cx="40%" cy="30%" r="60%">
                  <stop offset="0%" stop-color="#fde047" />
                  <stop offset="100%" stop-color="#ca8a04" />
                </radialGradient>
                <linearGradient id="root-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#fef08a" />
                  <stop offset="70%" stop-color="#eab308" />
                  <stop offset="100%" stop-color="#b45309" />
                </linearGradient>
                <radialGradient id="stem-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#bbf7d0" />
                  <stop offset="80%" stop-color="#22c55e" />
                  <stop offset="100%" stop-color="#14532d" />
                </radialGradient>
                <filter id="glow-root">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <g id="view-seed">
                <g id="seed-whole" transform="translate(0, 0)">
                  <path d="M-80,-20 C-80,-100 80,-100 80,0 C80,100 -80,100 -80,-20 Z" fill="url(#seed-grad)" stroke="#a16207" stroke-width="4" />
                  <text x="0" y="140" fill="#fef08a" text-anchor="middle" font-size="14">完整菜豆种子 (双子叶)</text>
                </g>
                <g id="seed-cut" transform="translate(0, 0)" opacity="0" pointer-events="none">
                  <path d="M-80,-20 C-80,-100 80,-100 80,0 C80,100 -80,100 -80,-20 Z" fill="url(#seed-grad)" stroke="#a16207" stroke-width="4" opacity="0.3" />
                  
                  <g transform="translate(-50, -30)">
                    <path d="M0,0 Q10,20 15,40" stroke="#fef08a" stroke-width="8" stroke-linecap="round" fill="none" class="hotspot" data-info="胚轴：连接胚根和胚芽的部分。" />
                    <path d="M15,40 Q20,60 10,80" stroke="#fef08a" stroke-width="6" stroke-linecap="round" fill="none" class="hotspot" data-info="胚根：发育成植物的根。" />
                    <path d="M-5,-5 Q10,0 20,-10 C25,-15 10,-20 0,0" fill="#a3e635" class="hotspot" data-info="胚芽：发育成植物的茎和叶。" />
                  </g>
                  <text x="0" y="140" fill="#fef08a" text-anchor="middle" font-size="14">已解剖：露出内部胚结构 (鼠标悬停结构查看详情)</text>
                </g>
                <g id="scalpel" transform="translate(200, -200) rotate(45)" opacity="0">
                   <path d="M0,0 L10,60 L-10,60 Z" fill="#cbd5e1" />
                   <rect x="-4" y="60" width="8" height="60" fill="#0f172a" />
                </g>
              </g>

              <g id="view-root" opacity="0" pointer-events="none" transform="translate(0, -50)">
                <path d="M-40,-150 L-30,100 C-30,130 0,160 0,160 C0,160 30,130 30,100 L40,-150 Z" fill="url(#root-grad)" stroke="#a16207" stroke-width="3" />
                
                <path class="hotspot root-zone" data-zone="cap" d="M-30,100 C-40,150 0,180 0,180 C0,180 40,150 30,100 Q0,120 -30,100 Z" fill="rgba(161, 98, 7, 0.4)" stroke="#713f12" stroke-width="2" />
                <rect class="hotspot root-zone" data-zone="meri" x="-28" y="70" width="56" height="30" fill="transparent" />
                <rect class="hotspot root-zone" data-zone="elon" x="-32" y="0" width="64" height="70" fill="transparent" />
                <rect class="hotspot root-zone" data-zone="matu" x="-40" y="-150" width="80" height="150" fill="transparent" />

                <!-- Root Hairs -->
                <g stroke="#fef08a" stroke-width="2" opacity="0.8">
                   <path d="M-38,-100 Q-70,-90 -80,-110" fill="none" />
                   <path d="M-37,-60 Q-80,-50 -90,-70" fill="none" />
                   <path d="M38,-110 Q70,-100 80,-120" fill="none" />
                   <path d="M37,-70 Q80,-60 90,-80" fill="none" />
                </g>
                <text x="0" y="220" fill="#fef08a" text-anchor="middle" font-size="14">点击根尖的四个区域进行微观探究</text>
                
                <!-- Highlight Box -->
                <rect id="root-hl" x="0" y="0" width="0" height="0" fill="none" stroke="#fef08a" stroke-width="2" filter="url(#glow-root)" opacity="0" />
              </g>

              <g id="view-stem" opacity="0" pointer-events="none">
                <circle cx="0" cy="0" r="140" fill="url(#stem-grad)" stroke="#14532d" stroke-width="6" />
                <circle cx="0" cy="0" r="50" fill="rgba(255,255,255,0.2)" stroke="#15803d" stroke-width="2" stroke-dasharray="4" />
                
                <g id="vascular-bundles"></g>
                
                <text x="0" y="180" fill="#bbf7d0" text-anchor="middle" font-size="14">双子叶植物茎横切面</text>
              </g>

            </svg>
          </div>
        </div>
      `;

      // Generate vascular bundles for stem
      const vbLayer = container.querySelector('#vascular-bundles');
      for(let i=0; i<8; i++) {
         const angle = (i/8) * Math.PI * 2;
         const cx = Math.cos(angle) * 90;
         const cy = Math.sin(angle) * 90;
         const rot = (angle * 180 / Math.PI) + 90;
         
         const g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
         g.setAttribute('transform', `translate(${cx}, ${cy}) rotate(${rot})`);
         
         g.innerHTML = `
            <path d="M-30,0 C-30,-20 -20,-40 0,-40 C20,-40 30,-20 30,0 Z" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2" class="hotspot" data-info="韧皮部 (Phloem)：内含筛管，自上而下运输有机物。" />
            <rect x="-32" y="0" width="64" height="6" fill="#facc15" class="hotspot" data-info="形成层 (Cambium)：细胞不断分裂，使茎不断加粗。" />
            <path class="xylem-block hotspot" data-info="木质部 (Xylem)：内含导管，自下而上运输水分和无机盐。" d="M-30,6 L-15,40 L15,40 L30,6 Z" fill="#22c55e" stroke="#14532d" stroke-width="2" />
         `;
         vbLayer.appendChild(g);
      }

      function renderPanel() {
        if (!externalPanel) return;
        externalPanel.innerHTML = `
          <div class="panel-${sceneId}">
            <div class="card">
              <div class="card-eyebrow">虚拟实验室</div>
              <div class="tab-row">
                 <button class="tab-btn active" data-tab="seed">🌰 种子解剖</button>
                 <button class="tab-btn" data-tab="root">🌱 根尖分区</button>
                 <button class="tab-btn" data-tab="stem">🪵 茎的运输</button>
              </div>
              
              <div id="controls-area" style="margin-top: 10px;">
                 <!-- Populated dynamically based on tab -->
              </div>
            </div>
            
            <div class="card" style="flex:1">
               <div class="card-eyebrow">微观观察结果</div>
               <div class="desc-box" id="feedback-box">
                 选择上方实验室工具进行操作。
               </div>
            </div>
          </div>
        `;

        externalPanel.querySelectorAll('.tab-btn').forEach(b => {
           b.addEventListener('click', (e) => {
              externalPanel.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
              e.currentTarget.classList.add('active');
              switchTab(e.currentTarget.getAttribute('data-tab'));
           });
        });

        switchTab('seed');
      }

      function switchTab(tab) {
         currentMode = tab;
         container.querySelector('#view-seed').setAttribute('opacity', tab === 'seed' ? '1' : '0');
         container.querySelector('#view-seed').setAttribute('pointer-events', tab === 'seed' ? 'auto' : 'none');
         container.querySelector('#view-root').setAttribute('opacity', tab === 'root' ? '1' : '0');
         container.querySelector('#view-root').setAttribute('pointer-events', tab === 'root' ? 'auto' : 'none');
         container.querySelector('#view-stem').setAttribute('opacity', tab === 'stem' ? '1' : '0');
         container.querySelector('#view-stem').setAttribute('pointer-events', tab === 'stem' ? 'auto' : 'none');

         const ctrl = externalPanel.querySelector('#controls-area');
         if (tab === 'seed') {
            ctrl.innerHTML = `<button class="action-btn" id="btn-cut">🔪 使用解剖刀切割种子</button>`;
            externalPanel.querySelector('#btn-cut').addEventListener('click', () => {
               if(seedCut) return;
               seedCut = true;
               // Animate scalpel
               const scalpel = container.querySelector('#scalpel');
               scalpel.setAttribute('opacity', '1');
               let x = 100; let y = -100;
               let intv = setInterval(() => {
                  x -= 5; y += 5;
                  scalpel.setAttribute('transform', `translate(${x}, ${y}) rotate(45)`);
                  if (x < -100) {
                     clearInterval(intv);
                     scalpel.setAttribute('opacity', '0');
                     container.querySelector('#seed-whole').setAttribute('opacity', '0');
                     container.querySelector('#seed-cut').setAttribute('opacity', '1');
                     container.querySelector('#seed-cut').setAttribute('pointer-events', 'auto');
                     externalPanel.querySelector('#feedback-box').innerHTML = "解剖完成！子叶已剥开。现在请<b>悬停</b>在暴露出的小结构上，观察胚芽、胚轴、胚根的位置。";
                  }
               }, 16);
            });
            externalPanel.querySelector('#feedback-box').innerHTML = "菜豆种子被坚硬的种皮包裹。请使用解剖刀将其切开以观察内部的<b>胚</b>。";
         } else if (tab === 'root') {
            ctrl.innerHTML = `<div style="color:#94a3b8; font-size:14px;">请直接在左侧点击根尖的不同区域。</div>`;
            externalPanel.querySelector('#feedback-box').innerHTML = "根尖是根生长最活跃的部位。它分为四个区，请点击它们探究各自的功能。";
         } else if (tab === 'stem') {
            ctrl.innerHTML = `<button class="action-btn" id="btn-dye" style="color:#fecaca; border-color:#ef4444; background:rgba(239,68,68,0.1)">🧪 滴加红墨水进行同位素示踪</button>`;
            externalPanel.querySelector('#btn-dye').addEventListener('click', () => {
               if(stemDyed) return;
               stemDyed = true;
               externalPanel.querySelector('#feedback-box').innerHTML = "⏳ 红墨水正在通过植物的茎自下而上运输...横切面中负责运输水分的<b>木质部(导管)</b>被染成了红色！";
               externalPanel.querySelector('#feedback-box').style.borderColor = "#ef4444";
               
               // Animate all xylem blocks turning red
               container.querySelectorAll('.xylem-block').forEach(el => {
                  el.setAttribute('fill', '#ef4444');
               });
            });
            externalPanel.querySelector('#feedback-box').innerHTML = "茎内有复杂的维管束结构。悬停查看各部分名称。点击红墨水按钮可进行经典的茎运输水分实验。";
         }
      }

      // Add interactivity for hotspots
      container.addEventListener('mouseover', (e) => {
         let info = e.target.getAttribute('data-info');
         if (info && externalPanel) {
            externalPanel.querySelector('#feedback-box').innerText = "🔬 观察结果：" + info;
         }
      });

      container.addEventListener('click', (e) => {
         if (currentMode === 'root') {
            let zone = e.target.closest('.root-zone');
            if (zone) {
               let zType = zone.getAttribute('data-zone');
               let hl = container.querySelector('#root-hl');
               hl.setAttribute('opacity', '1');
               let msg = "";
               if (zType === 'cap') {
                  hl.setAttribute('x', '-35'); hl.setAttribute('y', '100'); hl.setAttribute('width', '70'); hl.setAttribute('height', '80');
                  msg = "<b>根冠 (Root Cap)</b>：位于最顶端，细胞体积大，排列不整齐，像一顶帽子套在外面，具有保护分生区细胞的作用。";
               } else if (zType === 'meri') {
                  hl.setAttribute('x', '-35'); hl.setAttribute('y', '70'); hl.setAttribute('width', '70'); hl.setAttribute('height', '30');
                  msg = "<b>分生区 (Meristematic Zone)</b>：细胞体积小，细胞核大，具有很强的分裂能力，能够不断分裂产生新细胞。";
               } else if (zType === 'elon') {
                  hl.setAttribute('x', '-35'); hl.setAttribute('y', '0'); hl.setAttribute('width', '70'); hl.setAttribute('height', '70');
                  msg = "<b>伸长区 (Elongation Zone)</b>：细胞停止分裂，迅速伸长，是根生长最快的地方。";
               } else if (zType === 'matu') {
                  hl.setAttribute('x', '-45'); hl.setAttribute('y', '-150'); hl.setAttribute('width', '90'); hl.setAttribute('height', '150');
                  msg = "<b>成熟区 (Maturation Zone)</b>：表皮细胞向外突起形成根毛，极大地增加了吸水面积。内部细胞分化形成导管。这是根吸收水分和无机盐的主要部位。";
               }
               if (externalPanel) {
                  externalPanel.querySelector('#feedback-box').innerHTML = "🔬 探针检测结果：<br>" + msg;
                  externalPanel.querySelector('#feedback-box').style.borderColor = "#eab308";
               }
            }
         }
      });

      renderPanel();
    }
  };
})();

window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j8b_m05"] = (function () {
  const STAGES = [
    {
      id: "stage1",
      title: "1. 冥古宙地球",
      img: "assets/stage1.png?v=ae64517558f9",
      taskTitle: "探索任务：无机起源",
      taskDesc: "地球是一片炽热的岩浆海。请扫描并点击【无机气体释放源】。",
      hotspots: [
        { 
          top: "60%", left: "25%", 
          name: "火山脱气作用 (Outgassing)", 
          badge: "原始大气生成",
          desc: "火山喷发释放出大量水蒸气、氨气、甲烷等，构成了原始大气。注意：此时极度缺乏游离的氧气 (O₂)。",
          quiz: {
            q: "原始大气中，最缺乏的游离气体是？",
            opts: ["A. 水蒸气", "B. 氧气", "C. 甲烷"],
            ans: 1
          }
        }
      ]
    },
    {
      id: "stage2",
      title: "2. 雷暴纪",
      img: "assets/stage2.png?v=061c40792769",
      taskTitle: "探索任务：能量催化",
      taskDesc: "无机物如何变成有机物？请扫描并点击【化学进化的能量来源】。",
      hotspots: [
        { 
          top: "25%", left: "50%", 
          name: "高能雷电与紫外线", 
          badge: "米勒-尤里实验",
          desc: "雷电和紫外线撕裂了无机气体的化学键。正如『米勒-尤里实验』所证实的那样，无机小分子在放电作用下重新组合，合成了氨基酸等【有机小分子】。",
          quiz: {
            q: "米勒-尤里实验证明了在原始地球环境下：",
            opts: ["A. 生命来自外太空", "B. 无机物能生成有机小分子", "C. 有机物能变成细胞"],
            ans: 1
          },
          hasMillerSim: true
        }
      ]
    },
    {
      id: "stage3",
      title: "3. 原始汤",
      img: "assets/stage3.png?v=4cabc810a27d",
      taskTitle: "探索任务：生命摇篮",
      taskDesc: "有机小分子随雨水汇聚到了海洋。请寻找【生物大分子合成工厂】。",
      hotspots: [
        { 
          top: "65%", left: "45%", 
          name: "海底热泉口 (黑烟囱)", 
          badge: "矿物催化",
          desc: "在深海热泉喷口处，高温高压和富含矿物质的孔隙充当了天然催化剂，使得氨基酸逐步聚合成早期蛋白质等【生物大分子】。",
          quiz: {
            q: "深海热泉口之所以被称为“生命摇篮”，是因为它提供了？",
            opts: ["A. 充足的游离氧气", "B. 极低的温度", "C. 高温高压和矿物催化环境"],
            ans: 2
          }
        }
      ]
    },
    {
      id: "stage4",
      title: "4. 多分子体系",
      img: "assets/stage4.png?v=8a1bbb98a3d3",
      taskTitle: "探索任务：封闭系统",
      taskDesc: "大分子如何在海洋中保持高浓度？请点击【原始界膜】。",
      hotspots: [
        { 
          top: "60%", left: "65%", 
          name: "团聚体假说", 
          badge: "原始膜系统",
          desc: "多肽和核酸在水中聚集形成胶体液滴。表面吸附的脂质分子形成了类似于现代细胞膜的『原始界膜』，使其能与外界进行独立物质交换。",
          quiz: {
            q: "团聚体表面形成的“原始界膜”有什么重要作用？",
            opts: ["A. 使内部系统能与外界独立进行物质交换", "B. 阻止任何物质进入", "C. 直接发育成多细胞生物"],
            ans: 0
          }
        }
      ]
    },
    {
      id: "stage5",
      title: "5. RNA世界",
      img: "assets/stage5.png?v=4655eb006d54",
      taskTitle: "探索任务：自我复制",
      taskDesc: "系统如何获得繁衍能力？请寻找【最早的遗传物质】。",
      hotspots: [
        { 
          top: "45%", left: "40%", 
          name: "RNA 世界假说", 
          badge: "信息与催化合一",
          desc: "早期的遗传物质可能是单链的 RNA。RNA 不仅能携带和传递遗传密码，还能像蛋白质酶一样催化自身的复制反应。",
          quiz: {
            q: "为什么科学家认为早期生命主要依赖 RNA 而不是 DNA？",
            opts: ["A. RNA结构更坚固", "B. DNA在远古不存在", "C. RNA既能携带遗传信息，又能催化反应"],
            ans: 2
          }
        }
      ]
    },
    {
      id: "stage6",
      title: "6. LUCA 诞生",
      img: "assets/stage6.png?v=1ae090577074",
      taskTitle: "探索任务：万物始祖",
      taskDesc: "历经演化，生命迎来了质变。请点击【地球生命的共同祖先】。",
      hotspots: [
        { 
          top: "55%", left: "55%", 
          name: "LUCA", 
          badge: "单细胞生物",
          desc: "最终，拥有双层脂质细胞膜、以 DNA 为遗传物质的真正意义上的『单细胞生物』诞生了。它是地球上现存所有生命的共同祖先 (LUCA)。",
          quiz: {
            q: "“LUCA”代表的含义是？",
            opts: ["A. 一种远古恐龙", "B. 地球所有现存生命的最后广泛共同祖先", "C. 第一种能光合作用的植物"],
            ans: 1
          }
        }
      ]
    }
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return {
    mount: function (container, context) {
      const sceneEntry = context && context.sceneEntry ? context.sceneEntry : null;
      const externalPanel = context && context.externalPanel && context.externalPanel.nodeType === 1
        ? context.externalPanel
        : null;
      const sceneId = "game-" + Math.random().toString(36).slice(2, 9);
      const basePath = sceneEntry ? sceneEntry.folder + "/" : "";
      
      let currentStageIndex = 0;
      let discoveredStages = new Set();
      // Track quiz completion per stage: boolean
      let quizPassed = new Set();
      let showGraph = false;

      // Particle system state
      let pCanvas, pCtx;
      let particles = [];
      let animFrame;

      container.innerHTML = "";
      container.style.position = "relative";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";
      container.setAttribute("data-scope", sceneId);

      const style = document.createElement("style");
      style.textContent = `
        [data-scope="${sceneId}"] { position: relative; color: #e2e8f0; background: #000; }
        [data-scope="${sceneId}"] * { box-sizing: border-box; }

        [data-scope="${sceneId}"] .stage {
          width: 100%; height: 100%; padding: 18px; display: flex; flex-direction: column; gap: 16px;
        }

        [data-scope="${sceneId}"] .frame {
          position: relative; flex: 1; width: 100%; border-radius: 24px; overflow: hidden;
          border: 1px solid rgba(45, 212, 191, 0.38); box-shadow: 0 28px 60px rgba(0, 0, 0, 0.34); background: #000;
        }

        [data-scope="${sceneId}"] .image-layer {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          opacity: 0; transition: opacity 0.8s ease-in-out, transform 8s linear; transform: scale(1);
          pointer-events: none;
        }

        [data-scope="${sceneId}"] .image-layer.active { opacity: 1; transform: scale(1.05); }

        [data-scope="${sceneId}"] #particles-${sceneId} {
          position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;
        }

        [data-scope="${sceneId}"] .stageHead {
          position: absolute; left: 24px; top: 22px; z-index: 20; pointer-events: none;
        }
        
        [data-scope="${sceneId}"] .kicker {
          font-size: 11px; font-weight: 900; letter-spacing: 0.22em; color: rgba(134, 239, 172, 0.9);
          text-shadow: 0 2px 4px rgba(0,0,0,0.8); background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px;
        }
        
        [data-scope="${sceneId}"] .title {
          font-size: 28px; font-weight: 900; color: #fff; text-shadow: 0 4px 12px rgba(0,0,0,0.8); margin-top: 6px;
        }

        /* Scanning Hotspots */
        [data-scope="${sceneId}"] .hotspots-container {
          position: absolute; inset: 0; z-index: 10; pointer-events: none;
        }

        [data-scope="${sceneId}"] .hotspots-container.active { pointer-events: auto; }

        [data-scope="${sceneId}"] .target-spot {
          position: absolute; width: 60px; height: 60px; transform: translate(-50%, -50%);
          cursor: crosshair; display: none;
        }

        [data-scope="${sceneId}"] .hotspots-container.active .target-spot { display: block; }

        [data-scope="${sceneId}"] .target-spot::before {
          content: ""; position: absolute; inset: 0; border-radius: 50%;
          border: 2px dashed rgba(52, 211, 153, 0.8); animation: scanSpin 4s linear infinite;
        }
        
        [data-scope="${sceneId}"] .target-spot::after {
          content: ""; position: absolute; inset: 20px; border-radius: 50%;
          background: rgba(52, 211, 153, 0.4); box-shadow: 0 0 15px rgba(52, 211, 153, 0.8);
          animation: scanPulse 1.5s ease-in-out infinite alternate;
        }

        [data-scope="${sceneId}"] .target-spot:hover::before { border-style: solid; border-color: #fcd34d; }
        [data-scope="${sceneId}"] .target-spot:hover::after { background: rgba(252, 211, 77, 0.6); box-shadow: 0 0 20px #fcd34d; }

        @keyframes scanSpin { 100% { transform: rotate(360deg); } }
        @keyframes scanPulse { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.2); opacity: 1; } }

        [data-scope="${sceneId}"] .target-spot.scanned::before {
          border-style: solid; border-color: #60a5fa; animation: none;
        }
        [data-scope="${sceneId}"] .target-spot.scanned::after {
          background: #3b82f6; box-shadow: 0 0 20px #3b82f6; animation: none; transform: scale(0.5);
        }

        /* Timeline */
        [data-scope="${sceneId}"] .timeline-container {
          height: 80px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; display: flex; align-items: center; padding: 0 24px; position: relative;
        }

        [data-scope="${sceneId}"] .timeline-track {
          position: absolute; top: 50%; left: 40px; right: 40px; height: 2px;
          background: rgba(255,255,255,0.15); transform: translateY(-50%); z-index: 1;
        }
        
        [data-scope="${sceneId}"] .timeline-progress {
          position: absolute; top: 0; left: 0; height: 100%; background: #34d399; transition: width 0.4s ease;
        }

        [data-scope="${sceneId}"] .timeline-nodes {
          position: relative; z-index: 2; width: 100%; display: flex; justify-content: space-between;
        }

        [data-scope="${sceneId}"] .timeline-node {
          display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; opacity: 0.5; pointer-events: none;
        }

        [data-scope="${sceneId}"] .timeline-node.unlocked { opacity: 1; pointer-events: auto; }

        [data-scope="${sceneId}"] .node-dot {
          width: 16px; height: 16px; border-radius: 50%; background: #1e293b;
          border: 2px solid rgba(255,255,255,0.4); transition: all 0.3s ease;
        }

        [data-scope="${sceneId}"] .timeline-node.active .node-dot {
          background: #34d399; border-color: #34d399; box-shadow: 0 0 12px #34d399;
        }

        [data-scope="${sceneId}"] .node-label {
          font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.5); transition: color 0.3s ease; white-space: nowrap;
        }

        [data-scope="${sceneId}"] .timeline-node.active .node-label {
          color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.4);
        }

        /* Panel Styles */
        .panel-${sceneId} {
          width: 100%; height: 100%; display: flex; flex-direction: column; gap: 12px;
          color: #e2e8f0; font-family: "Microsoft YaHei UI", sans-serif; overflow-y: auto;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .panel-${sceneId}::-webkit-scrollbar { display: none; }
        .panelMount-${sceneId} { width: 100%; height: 100%; padding: 14px; background: transparent; }
        .panel-${sceneId} .card {
          flex-shrink: 0;
          border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          padding: 16px; display: grid; gap: 10px; position: relative;
        }
        .panel-${sceneId} .card.success {
          background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.3);
        }
        .panel-${sceneId} .eyebrow {
          font-size: 10px; font-weight: 900; letter-spacing: 0.18em; color: rgba(110, 231, 183, 0.72);
        }
        .panel-${sceneId} .p-title {
          font-size: 16px; font-weight: 900; color: #f8fafc; line-height: 1.3;
        }
        .panel-${sceneId} .task-box {
          background: rgba(255, 255, 255, 0.05); padding: 12px 14px; border-radius: 10px;
          border-left: 3px solid #fcd34d; font-size: 13px; line-height: 1.65; color: #fdf6e3;
        }
        .panel-${sceneId} .task-box.completed { border-left-color: #34d399; }

        .panel-${sceneId} .detailHead {
          display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
        }
        .panel-${sceneId} .detailBadge {
          padding: 0 10px; height: 24px; display: inline-flex; align-items: center;
          border-radius: 999px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd; font-size: 11px; font-weight: 900; white-space: nowrap;
        }
        .panel-${sceneId} .detailTitle {
          font-size: 18px; font-weight: 900; color: #34d399; line-height: 1.25; word-break: break-word;
        }
        .panel-${sceneId} .detailText {
          font-size: 13px; line-height: 1.8; color: rgba(226, 232, 240, 0.88);
        }
        .panel-${sceneId} .navButtons { display: flex; gap: 8px; margin-top: 4px; }
        .panel-${sceneId} .navBtn {
          flex: 1; padding: 10px 6px; border-radius: 10px; border: 1px solid rgba(52,211,153,0.3);
          background: rgba(52,211,153,0.1); color: #34d399; font-weight: 800; cursor: pointer;
          transition: all 0.2s; text-align: center; font-size: 13px;
        }
        .panel-${sceneId} .navBtn:hover { background: rgba(52,211,153,0.2); transform: translateY(-2px); }
        .panel-${sceneId} .navBtn:disabled {
          opacity: 0.3; cursor: not-allowed; transform: none; background: transparent;
          color: #64748b; border-color: rgba(255,255,255,0.1);
        }
        .panel-${sceneId} .navBtn.graphBtn {
          background: linear-gradient(90deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2));
          border-color: rgba(236,72,153,0.5); color: #f9a8d4;
        }

        .panel-${sceneId} .lock-overlay {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 20px 10px; text-align: center; color: rgba(148, 163, 184, 0.8); font-size: 13px; gap: 10px;
        }
        .panel-${sceneId} .lock-icon { width: 32px; height: 32px; opacity: 0.5; }

        /* Quiz Styles */
        .panel-${sceneId} .quiz-box {
          background: rgba(0,0,0,0.3); border: 1px solid rgba(147,197,253,0.3); border-radius: 12px; padding: 14px;
        }
        .panel-${sceneId} .quiz-q { font-size: 14px; color: #bfdbfe; margin-bottom: 12px; font-weight: bold; }
        .panel-${sceneId} .quiz-opt {
          padding: 10px; margin-bottom: 8px; border-radius: 8px; background: rgba(255,255,255,0.05);
          cursor: pointer; font-size: 13px; transition: all 0.2s; border: 1px solid transparent;
        }
        .panel-${sceneId} .quiz-opt:hover { background: rgba(255,255,255,0.1); }
        .panel-${sceneId} .quiz-opt.wrong { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); color: #fca5a5; }

        /* Miller-Urey Simulator */
        .panel-${sceneId} .miller-box {
          margin-top: 10px; padding: 16px 10px; background: rgba(15,23,42,0.6); border-radius: 12px; border: 1px solid rgba(59,130,246,0.3);
          text-align: center; display: flex; flex-direction: column; gap: 12px; align-items: center; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        .panel-${sceneId} .miller-app-container {
          width: 100%; max-width: 260px;
        }
        .panel-${sceneId} .miller-btn {
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          color: white; border: 1px solid #60a5fa; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;
          box-shadow: 0 4px 10px rgba(37,99,235,0.4); transition: all 0.2s;
        }
        .panel-${sceneId} .miller-btn:hover { background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%); transform: translateY(-1px); }
        .panel-${sceneId} .miller-btn:active { transform: translateY(1px); box-shadow: none; }
        .panel-${sceneId} .miller-btn:disabled { background: #475569 !important; color: #94a3b8 !important; border-color: #334155 !important; box-shadow: none !important; cursor: not-allowed; transform: none; }
        
        @keyframes spark { 0% { opacity:0.2; } 50% { opacity:1; } 100% { opacity:0.2; } }
        @keyframes boil { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-15px); opacity: 0; } }
        .panel-${sceneId} .sparking-path { animation: spark 0.1s infinite; opacity: 1 !important; }
        .panel-${sceneId} .boiling-anim { animation: boil 1s infinite linear; }
        .panel-${sceneId} .drop-anim { animation: dropFall 2s forwards; }
        @keyframes dropFall { 0% { opacity:0; transform:translateY(-20px); } 100% { opacity:1; transform:translateY(0); } }

        /* Knowledge Graph Overlay */
        [data-scope="${sceneId}"] .graph-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 50;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        [data-scope="${sceneId}"] .graph-node {
          padding: 8px 16px; border-radius: 20px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.5);
          color: #a7f3d0; font-size: 14px; font-weight: bold; position: absolute; box-shadow: 0 0 15px rgba(52,211,153,0.2);
        }
        [data-scope="${sceneId}"] .graph-line { position: absolute; background: rgba(52,211,153,0.5); z-index: 0; }
        [data-scope="${sceneId}"] .close-graph {
          position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); color: #fff;
          border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; z-index: 60;
        }
      `;
      document.head.appendChild(style);

      let legacyPanelRoot = null;
      let hiddenAsideContent = null;
      let panelHost = externalPanel;

      if (!panelHost) {
        const mainElement = container.closest("main");
        if (mainElement) {
          const asideElement = mainElement.querySelector("[data-courseware-aside='true']");
          if (asideElement) {
            hiddenAsideContent = asideElement.firstElementChild || null;
            if (hiddenAsideContent) {
              hiddenAsideContent.style.display = "none";
            }
            legacyPanelRoot = document.createElement("div");
            legacyPanelRoot.className = "panelMount-" + sceneId;
            asideElement.appendChild(legacyPanelRoot);
            panelHost = legacyPanelRoot;
          }
        }
      }

      function initParticles() {
        pCanvas = container.querySelector(`#particles-${sceneId}`);
        pCtx = pCanvas.getContext('2d');
        const resize = () => {
          pCanvas.width = pCanvas.offsetWidth;
          pCanvas.height = pCanvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < 50; i++) {
          particles.push({
            x: Math.random() * pCanvas.width,
            y: Math.random() * pCanvas.height,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            size: Math.random() * 3 + 1,
            life: Math.random() * 100
          });
        }
        
        const loop = () => {
          if (!pCtx) return;
          pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
          
          particles.forEach(p => {
            if (currentStageIndex === 0) { // Embers up
              p.y -= Math.random() * 2;
              p.x += (Math.random() - 0.5);
              if (p.y < 0) p.y = pCanvas.height;
              pCtx.fillStyle = 'rgba(239, 68, 68, 0.6)';
            } else if (currentStageIndex === 1) { // Rain down
              p.y += Math.random() * 5 + 2;
              p.x += 1;
              if (p.y > pCanvas.height) { p.y = 0; p.x = Math.random() * pCanvas.width; }
              pCtx.fillStyle = 'rgba(147, 197, 253, 0.4)';
            } else if (currentStageIndex === 2) { // Bubbles
              p.y -= 1;
              p.x += Math.sin(p.y / 20) * 0.5;
              if (p.y < 0) p.y = pCanvas.height;
              pCtx.fillStyle = 'rgba(52, 211, 153, 0.5)';
            } else if (currentStageIndex === 3) { // Clumping
              p.x += Math.cos(p.life) * 0.5;
              p.y += Math.sin(p.life) * 0.5;
              p.life += 0.05;
              pCtx.fillStyle = 'rgba(250, 204, 21, 0.5)';
            } else if (currentStageIndex === 4) { // RNA spirals
              p.x += Math.cos(p.y/10) * 2;
              p.y -= 0.5;
              if(p.y < 0) p.y = pCanvas.height;
              pCtx.fillStyle = 'rgba(168, 85, 247, 0.6)';
            } else { // Cells pulsing
              p.size = 3 + Math.sin(p.life) * 2;
              p.life += 0.05;
              pCtx.fillStyle = 'rgba(59, 130, 246, 0.6)';
            }
            
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            pCtx.fill();
          });
          animFrame = requestAnimationFrame(loop);
        };
        loop();
      }

      function switchStage(index) {
        currentStageIndex = index;
        
        const images = container.querySelectorAll(".image-layer");
        images.forEach((img, i) => img.classList.toggle("active", i === index));

        const hsContainers = container.querySelectorAll(".hotspots-container");
        hsContainers.forEach((hc, i) => hc.classList.toggle("active", i === index));

        const nodes = container.querySelectorAll(".timeline-node");
        nodes.forEach((node, i) => {
          node.classList.toggle("active", i === index);
          if (i === 0 || quizPassed.has(i - 1) || quizPassed.has(i)) {
            node.classList.add("unlocked");
          }
        });

        const progress = container.querySelector(".timeline-progress");
        if (progress) {
          progress.style.width = `${(index / (STAGES.length - 1)) * 100}%`;
        }

        renderPanel();
      }

      function onHotspotDiscovered(stageIndex, hotspotIndex) {
        discoveredStages.add(stageIndex);
        
        const hsContainers = container.querySelectorAll(".hotspots-container");
        const hsEl = hsContainers[stageIndex].querySelectorAll(".target-spot")[hotspotIndex];
        if (hsEl) hsEl.classList.add("scanned");

        renderPanel();
      }

      function answerQuiz(stageIndex, optIndex, correctIndex) {
        if (optIndex === correctIndex) {
          quizPassed.add(stageIndex);
          const nodes = container.querySelectorAll(".timeline-node");
          if (stageIndex + 1 < STAGES.length) {
            nodes[stageIndex + 1].classList.add("unlocked");
          }
          renderPanel();
        } else {
          // just visual feedback handled via DOM
        }
      }

      function toggleGraph() {
        showGraph = !showGraph;
        renderStage();
      }

      function renderPanel() {
        if (!panelHost) return;
        
        const stage = STAGES[currentStageIndex];
        const isDiscovered = discoveredStages.has(currentStageIndex);
        const isPassed = quizPassed.has(currentStageIndex);
        const canGoNext = isPassed && currentStageIndex < STAGES.length - 1;

        let contentHtml = "";

        if (!isDiscovered) {
          contentHtml = `
            <div class="lock-overlay">
              <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>请在左侧主视口中找出发光的扫描目标并点击，<br/>解锁知识卡片。</span>
            </div>
          `;
        } else if (!isPassed) {
          const quiz = stage.hotspots[0].quiz;
          const optsHtml = quiz.opts.map((o, i) => 
            `<div class="quiz-opt" data-opt="${i}">${escapeHtml(o)}</div>`
          ).join('');
          
          contentHtml = `
            <div class="detailHead">
              <div class="detailBadge">${escapeHtml(stage.hotspots[0].badge)}</div>
              <div class="detailTitle">${escapeHtml(stage.hotspots[0].name)}</div>
            </div>
            <div class="detailText">${escapeHtml(stage.hotspots[0].desc)}</div>
            <div class="quiz-box" style="margin-top:10px;">
              <div class="quiz-q">❓ 知识确验证：${escapeHtml(quiz.q)}</div>
              ${optsHtml}
            </div>
          `;
        } else {
          contentHtml = `
            <div class="detailHead">
              <div class="detailBadge">✓ 掌握</div>
              <div class="detailTitle">${escapeHtml(stage.hotspots[0].name)}</div>
            </div>
            <div class="detailText">${escapeHtml(stage.hotspots[0].desc)}</div>
          `;

          if (stage.hotspots[0].hasMillerSim) {
            contentHtml += `
              <div class="miller-box">
                <div style="font-size:12px;color:#93c5fd;letter-spacing:1px;font-weight:bold;">米勒-尤里实验模拟器 (1953)</div>
                <div class="miller-app-container">
                  <svg viewBox="0 0 200 220" style="width:100%; height:180px; overflow:visible;">
                    <!-- Boiling Flask -->
                    <circle cx="50" cy="150" r="25" fill="rgba(30,58,138,0.5)" stroke="#3b82f6" stroke-width="2"/>
                    <path class="boil-bubbles" d="M45,160 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0 M55,165 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0" fill="#60a5fa" style="opacity:0"/>
                    <text x="50" y="155" fill="#93c5fd" font-size="10" text-anchor="middle">沸水</text>
                    <text x="50" y="195" fill="#ef4444" font-size="12" text-anchor="middle">🔥 热源</text>
                    
                    <!-- Tubes -->
                    <path d="M 50 125 L 50 40 L 140 40" fill="none" stroke="#475569" stroke-width="4" stroke-linejoin="round"/>
                    <path d="M 140 100 L 140 180 L 100 180" fill="none" stroke="#475569" stroke-width="4" stroke-linejoin="round"/>
                    
                    <!-- Spark Chamber -->
                    <circle cx="140" cy="70" r="30" fill="rgba(15,23,42,0.8)" stroke="#3b82f6" stroke-width="2"/>
                    <text x="140" y="55" fill="#93c5fd" font-size="8" text-anchor="middle">还原性气体</text>
                    <text x="140" y="92" fill="#93c5fd" font-size="8" text-anchor="middle">CH₄, NH₃, H₂</text>
                    
                    <!-- Electrodes -->
                    <line x1="95" y1="70" x2="115" y2="70" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
                    <line x1="185" y1="70" x2="165" y2="70" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
                    
                    <!-- Lightning -->
                    <path id="miller-lightning-${sceneId}" d="M 115 70 L 130 55 L 140 85 L 165 70" fill="none" stroke="#fcd34d" stroke-width="2" filter="drop-shadow(0 0 4px #fcd34d)" style="opacity:0;"/>
                    
                    <!-- Condenser -->
                    <rect x="130" y="110" width="20" height="40" rx="4" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 2"/>
                    <text x="165" y="135" fill="#38bdf8" font-size="9">冷凝槽</text>
                    <path d="M 125 120 L 115 120 M 125 140 L 115 140" stroke="#38bdf8" stroke-width="1"/>
                    
                    <!-- U-Trap -->
                    <path d="M 100 180 A 15 15 0 0 1 70 180" fill="none" stroke="#475569" stroke-width="4"/>
                    
                    <!-- Drops -->
                    <g id="miller-drops-${sceneId}" style="opacity:0;">
                       <circle cx="85" cy="187" r="4" fill="#34d399" filter="drop-shadow(0 0 4px #34d399)"/>
                       <circle cx="95" cy="190" r="3" fill="#34d399" filter="drop-shadow(0 0 4px #34d399)"/>
                       <text x="85" y="215" fill="#34d399" font-size="10" font-weight="bold" text-anchor="middle">生命基石: 氨基酸</text>
                    </g>
                  </svg>
                </div>
                <button class="miller-btn" id="miller-btn-${sceneId}">⚡ 启动高压模拟放电</button>
              </div>
            `;
          }
        }

        panelHost.innerHTML = `
          <div class="panel-${sceneId}">
            <div class="card">
              <div class="eyebrow">阶段 ${currentStageIndex + 1} / ${STAGES.length}</div>
              <div class="p-title">${escapeHtml(stage.title)}</div>
              
              <div class="task-box ${isPassed ? 'completed' : ''}">
                <strong style="color: ${isPassed ? '#34d399' : '#fcd34d'}">
                  ${isPassed ? '✓ 任务与测试完成：' : '🎯 ' + escapeHtml(stage.taskTitle) + '：'}
                </strong>
                <br/>
                ${escapeHtml(stage.taskDesc)}
              </div>
            </div>

            <div class="card ${isPassed ? 'success' : ''}">
              <div class="eyebrow">阶段核心解析</div>
              ${contentHtml}
              
              <div class="navButtons">
                <button class="navBtn" id="btn-prev-${sceneId}" ${currentStageIndex === 0 ? 'disabled' : ''}>⬅ 上一纪元</button>
                ${currentStageIndex === STAGES.length - 1 && isPassed ? 
                  `<button class="navBtn graphBtn" id="btn-graph-${sceneId}">✨ 知识星图</button>` : 
                  `<button class="navBtn" id="btn-next-${sceneId}" ${!canGoNext ? 'disabled' : ''}>下一纪元 ➡</button>`
                }
              </div>
            </div>
          </div>
        `;

        // Bind Quiz Logic
        if (isDiscovered && !isPassed) {
          const opts = panelHost.querySelectorAll('.quiz-opt');
          const ans = stage.hotspots[0].quiz.ans;
          opts.forEach((opt, i) => {
            opt.addEventListener('click', () => {
              if (i === ans) {
                answerQuiz(currentStageIndex, i, ans);
              } else {
                opt.classList.add('wrong');
                opt.innerText += " (不正确)";
              }
            });
          });
        }

        // Bind Miller Sim
        const millerBtn = panelHost.querySelector(`#miller-btn-${sceneId}`);
        if (millerBtn) {
          millerBtn.addEventListener('click', () => {
            const lightning = panelHost.querySelector(`#miller-lightning-${sceneId}`);
            const bubbles = panelHost.querySelector('.boil-bubbles');
            const drops = panelHost.querySelector(`#miller-drops-${sceneId}`);
            
            lightning.classList.add("sparking-path");
            bubbles.style.opacity = "1";
            bubbles.classList.add("boiling-anim");
            millerBtn.innerText = "⚡ 放电与循环合成中...";
            millerBtn.disabled = true;
            
            setTimeout(() => {
              lightning.classList.remove("sparking-path");
              lightning.style.opacity = "0";
              bubbles.style.opacity = "0";
              bubbles.classList.remove("boiling-anim");
              
              drops.style.opacity = "1";
              drops.classList.add("drop-anim");
              millerBtn.innerText = "合成成功：检测到氨基酸";
              millerBtn.style.background = "linear-gradient(180deg, #10b981 0%, #059669 100%)";
              millerBtn.style.borderColor = "#34d399";
            }, 3000);
          });
        }

        const btnPrev = panelHost.querySelector(`#btn-prev-${sceneId}`);
        const btnNext = panelHost.querySelector(`#btn-next-${sceneId}`);
        const btnGraph = panelHost.querySelector(`#btn-graph-${sceneId}`);

        if (btnPrev && currentStageIndex > 0) btnPrev.addEventListener("click", () => switchStage(currentStageIndex - 1));
        if (btnNext && canGoNext) btnNext.addEventListener("click", () => switchStage(currentStageIndex + 1));
        if (btnGraph) btnGraph.addEventListener("click", toggleGraph);
      }

      function renderStage() {
        if (showGraph) {
           const nodes = ["无机小分子", "氨基酸/核苷酸", "蛋白质/核酸", "团聚体(多分子)", "RNA自我复制", "LUCA单细胞"];
           const positions = [
             {t: 20, l: 20}, {t: 40, l: 40}, {t: 60, l: 20}, {t: 80, l: 50}, {t: 60, l: 80}, {t: 30, l: 80}
           ];
           let gNodesHtml = nodes.map((n, i) => `<div class="graph-node" style="top:${positions[i].t}%; left:${positions[i].l}%;">${n}</div>`).join('');
           
           container.innerHTML = `
             <div class="stage">
               <div class="frame" style="background:#020617;">
                 <div class="graph-overlay">
                   <button class="close-graph" id="close-graph-${sceneId}">关闭图谱</button>
                   <div style="color:#34d399; font-size:24px; font-weight:bold; margin-bottom:40px; position:absolute; top:40px;">生命起源：化学进化全景星图</div>
                   ${gNodesHtml}
                   <!-- Simple SVG lines -->
                   <svg style="position:absolute; inset:0; width:100%; height:100%; z-index:-1;">
                      <line x1="20%" y1="20%" x2="40%" y2="40%" stroke="#34d399" stroke-width="2" stroke-dasharray="5,5" />
                      <line x1="40%" y1="40%" x2="20%" y2="60%" stroke="#34d399" stroke-width="2" stroke-dasharray="5,5" />
                      <line x1="20%" y1="60%" x2="50%" y2="80%" stroke="#34d399" stroke-width="2" stroke-dasharray="5,5" />
                      <line x1="50%" y1="80%" x2="80%" y2="60%" stroke="#34d399" stroke-width="2" stroke-dasharray="5,5" />
                      <line x1="80%" y1="60%" x2="80%" y2="30%" stroke="#34d399" stroke-width="2" stroke-dasharray="5,5" />
                   </svg>
                 </div>
               </div>
             </div>
           `;
           container.querySelector(`#close-graph-${sceneId}`).addEventListener("click", toggleGraph);
           return;
        }

        let imageLayersHtml = "";
        let hotspotsHtml = "";
        let nodesHtml = "";

        STAGES.forEach((s, i) => {
          imageLayersHtml += `<img src="${basePath}${s.img}" class="image-layer ${i === 0 ? 'active' : ''}" />`;
          
          let hsDivs = s.hotspots.map((hs, hi) => 
            `<div class="target-spot ${discoveredStages.has(i) ? 'scanned' : ''}" style="top: ${hs.top}; left: ${hs.left};" data-stage="${i}" data-hotspot="${hi}"></div>`
          ).join('');
          hotspotsHtml += `<div class="hotspots-container ${i === 0 ? 'active' : ''}">${hsDivs}</div>`;

          nodesHtml += `
            <div class="timeline-node ${i === 0 ? 'active unlocked' : ''}" data-index="${i}">
               <div class="node-dot"></div>
               <div class="node-label">${escapeHtml(s.title.split(" ")[1])}</div>
            </div>`;
        });

        container.innerHTML = `
          <div class="stage">
            <div class="frame">
              <div class="stageHead">
                <div class="kicker">互动推演探索</div>
                <div class="title">化学进化与生命起源</div>
              </div>
              ${imageLayersHtml}
              <canvas id="particles-${sceneId}"></canvas>
              ${hotspotsHtml}
            </div>
            
            <div class="timeline-container">
              <div class="timeline-track">
                 <div class="timeline-progress" style="width: 0%;"></div>
              </div>
              <div class="timeline-nodes">
                ${nodesHtml}
              </div>
            </div>
          </div>
        `;

        // Start particles after rendering
        initParticles();

        // Bind clicks to hotspots
        const spots = container.querySelectorAll(".target-spot");
        spots.forEach(spot => {
          spot.addEventListener("click", (e) => {
            const si = parseInt(spot.getAttribute("data-stage"));
            const hi = parseInt(spot.getAttribute("data-hotspot"));
            if (si === currentStageIndex) {
              onHotspotDiscovered(si, hi);
            }
          });
        });

        // Bind clicks to timeline nodes
        const nodes = container.querySelectorAll(".timeline-node");
        nodes.forEach(node => {
          node.addEventListener("click", () => {
            if (node.classList.contains("unlocked")) {
              const index = parseInt(node.getAttribute("data-index"));
              switchStage(index);
            }
          });
        });
      }

      renderStage();
      renderPanel();

      return {
        unmount: function () {
          if (animFrame) cancelAnimationFrame(animFrame);
          if (style && style.parentNode) {
            style.parentNode.removeChild(style);
          }
          if (legacyPanelRoot && legacyPanelRoot.parentNode) {
            legacyPanelRoot.parentNode.removeChild(legacyPanelRoot);
          }
          if (hiddenAsideContent) {
            hiddenAsideContent.style.display = "";
          }
        }
      };
    }
  };
})();

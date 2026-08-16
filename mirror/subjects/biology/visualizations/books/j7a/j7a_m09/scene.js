window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7a_m09"] = (function () {

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadModelViewer() {
    if (window.BiologyApp && typeof window.BiologyApp.loadBiologyModelViewer === "function") {
      return window.BiologyApp.loadBiologyModelViewer();
    }
    if (window.customElements && window.customElements.get("model-viewer")) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  const TASKS = [
    {
      id: "transpiration",
      title: "蒸腾主线",
      label: "气孔与水蒸气散失",
      accent: "#38bdf8",
      cameraOrbit: "-18deg 68deg 116%",
      summary: "叶片横切结构可以同时看到表皮、叶肉、叶脉等层次，适合定位蒸腾作用发生和水分运输的路径。",
      prompt: "观察叶片表皮和叶肉之间的空间关系：水分经叶脉进入叶片，在叶肉细胞间隙形成水蒸气，再主要通过气孔散失到空气中。",
      checks: ["蒸腾作用主要通过气孔进行", "叶片是蒸腾作用的主要器官", "蒸腾拉力有助于水和无机盐向上运输"],
      imageRelativeUrl: "assets/images/transpiration.png?v=b6db6cdf5df5"
    },
    {
      id: "vascular",
      title: "水分运输",
      label: "叶脉与导管方向",
      accent: "#22d3ee",
      cameraOrbit: "44deg 70deg 110%",
      summary: "叶脉为叶肉组织提供水分和无机盐，也把制造的有机物运离叶片，是叶片功能的交通通道。",
      prompt: "把褐色维管束看作叶片内部的运输枢纽：导管把水分送到叶片，筛管把有机物运走，结构上的通道支撑了生理过程。",
      checks: ["导管主要运输水和无机盐", "筛管主要运输有机物", "叶脉让叶片的光合与蒸腾活动持续进行"],
      imageRelativeUrl: "assets/images/vascular.png?v=80cad393cadd"
    },
    {
      id: "photosynthesis",
      title: "光合关联",
      label: "叶肉细胞与叶绿体",
      accent: "#22c55e",
      cameraOrbit: "14deg 66deg 105%",
      summary: "这个模型也能解释光合作用的位置：绿色叶肉细胞富含叶绿体，是制造有机物的重要场所。",
      prompt: "讲光合作用时，把重点放到叶肉细胞和叶绿体上；讲蒸腾作用时，把重点放到气孔、水分运输和水蒸气散失上。",
      checks: ["叶肉细胞通常含有较多叶绿体", "光合作用需要二氧化碳和水", "蒸腾作用与光合作用共享叶片结构背景"],
      imageRelativeUrl: "assets/images/photosynthesis.png?v=181501932f53"
    },
    {
      id: "biosphere",
      title: "生物圈联系",
      label: "水循环与物质循环",
      accent: "#facc15",
      cameraOrbit: "-52deg 72deg 114%",
      summary: "叶片不是孤立结构：蒸腾作用参与水循环，光合作用把无机物转化为有机物，二者共同连接植物和生物圈。",
      prompt: "把模型放到生态尺度理解：叶片散失水分影响空气湿度和水循环，叶片制造有机物则为植物自身和其他生物提供物质基础。",
      checks: ["植物蒸腾参与生物圈水循环", "绿色植物制造有机物进入食物链", "叶片结构支撑多种生命活动"],
      imageRelativeUrl: "assets/images/biosphere.png?v=c66f84d9febb"
    }
  ];

  const FLOW = [
    { label: "水分进入", value: "根吸水，经导管进入叶脉" },
    { label: "叶片散失", value: "叶肉间隙水蒸气经气孔散出" },
    { label: "光合关联", value: "叶肉细胞利用水和二氧化碳制造有机物" },
    { label: "生态意义", value: "蒸腾参与水循环，光合支撑食物链" }
  ];

  const SCENARIOS = [
    { id: "sunny", label: "晴热通风", env: { light: 86, temp: 32, humidity: 32, wind: 62 } },
    { id: "humid", label: "阴湿环境", env: { light: 32, temp: 22, humidity: 84, wind: 12 } },
    { id: "dry", label: "干燥强光", env: { light: 92, temp: 36, humidity: 20, wind: 38 } }
  ];

  return {
    mount: function mount(container, context) {
      const sceneId = "leaf-transpiration-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const modelSource = {
        desktop: `${assetBase}assets/models/leaf-cross-section.glb?v=2f6e5b562d68`,
        tablet: `${assetBase}assets/models/leaf-cross-section.tablet.glb?v=d1acf46c2aec`,
        mobile: `${assetBase}assets/models/leaf-cross-section.mobile.glb?v=cd8c00c8ed32`
      };
      const modelSrc = window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function"
        ? window.BiologyApp.resolveBiologyModelVariantSource(modelSource)
        : (typeof runtimeVersioner === "function" ? runtimeVersioner(modelSource.desktop) : modelSource.desktop);

      let disposed = false;
      let style = null;

      const state = {
        activeTask: "transpiration",
        autoRotate: true,
        upperBlocked: false,
        lowerBlocked: false,
        showModal: false,
        env: {
          light: 60,
          wind: 32,
          humidity: 46,
          temp: 28
        }
      };

      function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "56, 189, 248";
      }

      function renderChineseLabels(taskId, accent) {
        const labelsData = {
          transpiration: [
            { text: "表皮与气孔 (水分散失的主要门户)", top: "72%", left: "35%", pos: "right" },
            { text: "水蒸气散失 (经气孔间隙扩散入空气)", top: "60%", left: "62%", pos: "right" },
            { text: "栅栏组织 (富含水分，受热蒸腾散热)", top: "36%", left: "50%", pos: "top" }
          ],
          vascular: [
            { text: "导管 (运输水和无机盐的管道)", top: "48%", left: "36%", pos: "right" },
            { text: "筛管 (运输叶片制造的有机物)", top: "36%", left: "64%", pos: "right" },
            { text: "叶脉 (起支撑和运输的维管束网络)", top: "25%", left: "50%", pos: "top" }
          ],
          photosynthesis: [
            { text: "叶绿体 (光合作用能量转换器)", top: "42%", left: "35%", pos: "right" },
            { text: "栅栏组织 (密集吸光，光合主阵地)", top: "32%", left: "60%", pos: "right" },
            { text: "海绵组织 (疏松多孔，利于气体交换)", top: "64%", left: "48%", pos: "bottom" }
          ],
          biosphere: [
            { text: "蒸腾拉力 (拉动根部水分向顶端运送)", top: "55%", left: "36%", pos: "right" },
            { text: "降雨与水循环 (蒸腾水汽形成降水)", top: "22%", left: "52%", pos: "top" },
            { text: "碳氧平衡 (光合吸收CO2释放O2平衡气候)", top: "70%", left: "64%", pos: "right" }
          ]
        };

        const list = labelsData[taskId] || [];
        return list.map((item, index) => `
          <div class="leaf-stage__hotspot leaf-stage__hotspot--${item.pos}" 
               style="top: ${item.top}; left: ${item.left}; --accent-color: ${accent}; --delay: ${index * 0.15}s">
            <div class="leaf-stage__hotspot-dot"></div>
            <div class="leaf-stage__hotspot-badge">${escapeHtml(item.text)}</div>
          </div>
        `).join("");
      }

      function getActiveTask() {
        return TASKS.find(task => task.id === state.activeTask) || TASKS[0];
      }

      function findViewer() {
        return container.querySelector("model-viewer");
      }

      function getRate() {
        const light = state.env.light * 0.24;
        const wind = state.env.wind * 0.22;
        const humidity = (100 - state.env.humidity) * 0.3;
        const tempScore = Math.max(0, 100 - Math.abs(state.env.temp - 30) * 3) * 0.24;
        const blockFactor = (state.upperBlocked ? 0.86 : 1) * (state.lowerBlocked ? 0.46 : 1);
        return Math.max(0, Math.min(100, Math.round((light + wind + humidity + tempScore) * blockFactor)));
      }

      function rateLevel(rate) {
        if (rate >= 72) return "强";
        if (rate >= 42) return "中";
        return "弱";
      }

      function setScopedStyle() {
        style = document.createElement("style");
        style.id = `${sceneId}-style`;
        style.textContent = `
          [data-scope="${sceneId}"] {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            position: relative;
            overflow: hidden;
            color: #f8fafc;
            background: #020617;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
            --task-accent: #38bdf8;
            --task-accent-soft: rgba(56, 189, 248, 0.22);
            --vapor-opacity: 0.56;
          }

          [data-scope="${sceneId}"] * {
            box-sizing: border-box;
          }

          [data-scope="${sceneId}"] .leaf-stage {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            padding: 18px;
            display: grid;
            background:
              radial-gradient(circle at 22% 28%, rgba(34, 211, 238, 0.16), transparent 30%),
              radial-gradient(circle at 72% 38%, rgba(34, 197, 94, 0.16), transparent 32%),
              linear-gradient(145deg, #020617 0%, #071713 56%, #09111f 100%);
          }

          [data-scope="${sceneId}"] .leaf-stage__frame {
            position: relative;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            border-radius: 24px;
            border: 1px solid rgba(103, 232, 249, 0.22);
            background:
              linear-gradient(rgba(255, 255, 255, 0.024) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.024) 1px, transparent 1px),
              radial-gradient(circle at center, rgba(15, 118, 110, 0.12), rgba(2, 6, 23, 0.94));
            background-size: 34px 34px, 34px 34px, auto;
            box-shadow: inset 0 0 90px rgba(15, 23, 42, 0.82), 0 24px 60px rgba(0, 0, 0, 0.36);
          }

          [data-scope="${sceneId}"] .leaf-stage__modelViewer {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
            z-index: 1;
            --poster-color: transparent;
            --progress-bar-color: var(--task-accent);
          }

          [data-scope="${sceneId}"] .leaf-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: rgba(226, 232, 240, 0.78);
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            background: rgba(2, 6, 23, 0.76);
          }

          [data-scope="${sceneId}"] .leaf-stage__vapor {
            position: absolute;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            opacity: var(--vapor-opacity);
            background:
              radial-gradient(circle at 58% 25%, rgba(125, 211, 252, 0.38) 0 2px, transparent 3px),
              radial-gradient(circle at 62% 34%, rgba(186, 230, 253, 0.32) 0 2px, transparent 3px),
              radial-gradient(circle at 49% 18%, rgba(103, 232, 249, 0.24) 0 2px, transparent 3px);
            background-size: 82px 92px, 104px 112px, 126px 136px;
            mix-blend-mode: screen;
            animation: leaf-vapor-rise-${sceneId} 8s linear infinite;
          }

          @keyframes leaf-vapor-rise-${sceneId} {
            from { background-position: 0 40px, 20px 60px, 34px 80px; }
            to { background-position: 0 -120px, 20px -110px, 34px -100px; }
          }

          [data-scope="${sceneId}"] .leaf-stage__hud {
            position: absolute;
            z-index: 4;
            top: 18px;
            left: 18px;
            right: 18px;
            display: flex;
            align-items: flex-start;
            justify-content: flex-end;
            gap: 14px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .leaf-stage__summary {
            margin-top: 10px;
            max-width: 660px;
            color: rgba(226, 232, 240, 0.9);
            font-size: 14px;
            line-height: 1.65;
            text-shadow: 0 4px 18px rgba(2, 6, 23, 0.9);
          }

          [data-scope="${sceneId}"] .leaf-stage__metric {
            width: 190px;
            min-height: 104px;
            flex: 0 0 auto;
            padding: 15px;
            border-radius: 18px;
            background: rgba(2, 6, 23, 0.72);
            border: 1px solid rgba(148, 163, 184, 0.24);
            box-shadow: 0 16px 42px rgba(0, 0, 0, 0.24);
          }

          [data-scope="${sceneId}"] .leaf-stage__metricLabel {
            color: rgba(203, 213, 225, 0.82);
            font-size: 12px;
            font-weight: 800;
          }

          [data-scope="${sceneId}"] .leaf-stage__rate {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-top: 6px;
            color: #ffffff;
            font-weight: 950;
          }

          [data-scope="${sceneId}"] .leaf-stage__rate strong {
            color: var(--task-accent);
            font-size: 34px;
            line-height: 1;
          }

          [data-scope="${sceneId}"] .leaf-stage__bar {
            width: 100%;
            height: 8px;
            margin-top: 12px;
            border-radius: 999px;
            overflow: hidden;
            background: rgba(148, 163, 184, 0.18);
          }

          [data-scope="${sceneId}"] .leaf-stage__bar > span {
            display: block;
            height: 100%;
            width: var(--rate-width, 50%);
            border-radius: inherit;
            background: linear-gradient(90deg, #38bdf8, #22c55e, #facc15);
            transition: width 0.22s ease;
          }

          [data-scope="${sceneId}"] .leaf-stage__taskBadge {
            margin-top: 10px;
            color: rgba(248, 250, 252, 0.92);
            font-size: 12px;
            font-weight: 800;
          }

          [data-scope="${sceneId}"] .leaf-stage__bottom {
            position: absolute;
            z-index: 4;
            left: 18px;
            right: 18px;
            bottom: 18px;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .leaf-stage__legend {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            min-width: 0;
          }

          [data-scope="${sceneId}"] .leaf-stage__legendItem {
            min-height: 34px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 8px 12px;
            border-radius: 999px;
            color: rgba(248, 250, 252, 0.92);
            font-size: 12px;
            font-weight: 800;
            line-height: 1.2;
            background: rgba(2, 6, 23, 0.66);
            border: 1px solid rgba(148, 163, 184, 0.2);
            white-space: nowrap;
          }

          [data-scope="${sceneId}"] .leaf-stage__dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: var(--dot-color);
            box-shadow: 0 0 12px var(--dot-color);
            flex: 0 0 auto;
          }

          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 14px;
            overflow-y: auto;
            padding-right: 4px;
            color: #f8fafc;
            --task-accent: #38bdf8;
            --task-accent-soft: rgba(56, 189, 248, 0.2);
          }

          .panel-${sceneId}::-webkit-scrollbar {
            width: 6px;
          }

          .panel-${sceneId}::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: rgba(148, 163, 184, 0.24);
          }

          .panel-${sceneId} .p-card {
            min-width: 0;
            border-radius: 18px;
            padding: 18px;
            background: rgba(15, 23, 42, 0.62);
            border: 1px solid rgba(148, 163, 184, 0.14);
            box-shadow: 0 18px 44px rgba(2, 6, 23, 0.24);
          }

          .panel-${sceneId} .p-eyebrow {
            display: block;
            color: var(--task-accent);
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .panel-${sceneId} .p-title {
            margin: 8px 0 0;
            color: #ffffff;
            font-size: 20px;
            line-height: 1.2;
            letter-spacing: 0;
            font-weight: 950;
          }

          .panel-${sceneId} .p-desc {
            margin: 10px 0 0;
            color: rgba(226, 232, 240, 0.88);
            font-size: 14px;
            line-height: 1.72;
          }

          .panel-${sceneId} .p-actionRow,
          .panel-${sceneId} .p-scenarioGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 14px;
          }

          .panel-${sceneId} .p-scenarioGrid {
            grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
          }

          .panel-${sceneId} button {
            font: inherit;
          }

          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-scenario,
          .panel-${sceneId} .p-task,
          .panel-${sceneId} .p-toggle {
            min-width: 0;
            min-height: 44px;
            appearance: none;
            cursor: pointer;
            border-radius: 13px;
            border: 1px solid rgba(148, 163, 184, 0.18);
            background: rgba(2, 6, 23, 0.42);
            color: rgba(248, 250, 252, 0.9);
            transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
          }

          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-scenario,
          .panel-${sceneId} .p-toggle {
            padding: 11px 12px;
            font-size: 13px;
            font-weight: 850;
            line-height: 1.25;
          }

          .panel-${sceneId} .p-action:hover,
          .panel-${sceneId} .p-scenario:hover,
          .panel-${sceneId} .p-task:hover,
          .panel-${sceneId} .p-toggle:hover {
            border-color: color-mix(in srgb, var(--task-accent) 58%, transparent);
            background: rgba(15, 23, 42, 0.78);
            transform: translateY(-1px);
          }

          .panel-${sceneId} .p-action.is-active,
          .panel-${sceneId} .p-task.is-active,
          .panel-${sceneId} .p-toggle.is-active {
            color: #ffffff;
            border-color: color-mix(in srgb, var(--task-accent) 72%, transparent);
            background: var(--task-accent-soft);
          }

          .panel-${sceneId} .p-taskGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 14px;
          }

          .panel-${sceneId} .p-task {
            display: grid;
            gap: 4px;
            padding: 12px;
            text-align: left;
          }

          .panel-${sceneId} .p-task strong {
            min-width: 0;
            color: #ffffff;
            font-size: 14px;
            line-height: 1.22;
          }

          .panel-${sceneId} .p-task span {
            min-width: 0;
            color: rgba(203, 213, 225, 0.84);
            font-size: 12px;
            line-height: 1.35;
          }

          .panel-${sceneId} .p-controlGroup {
            display: grid;
            gap: 10px;
            margin-top: 14px;
          }

          .panel-${sceneId} .p-control {
            min-width: 0;
            padding: 12px;
            border-radius: 14px;
            background: rgba(2, 6, 23, 0.34);
            border: 1px solid rgba(148, 163, 184, 0.13);
          }

          .panel-${sceneId} .p-controlLabel {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            color: rgba(226, 232, 240, 0.92);
            font-size: 13px;
            font-weight: 850;
            line-height: 1.35;
          }

          .panel-${sceneId} .p-value {
            flex: 0 0 auto;
            min-width: 52px;
            padding: 4px 8px;
            border-radius: 999px;
            text-align: center;
            color: #e0f2fe;
            background: rgba(14, 165, 233, 0.2);
            font-size: 12px;
            font-weight: 900;
          }

          .panel-${sceneId} input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            min-height: 40px;
            width: 100%;
            margin: 4px 0 0;
            background: transparent;
            accent-color: var(--task-accent);
            touch-action: pan-x;
          }

          .panel-${sceneId} input[type="range"]::-webkit-slider-runnable-track {
            height: 8px;
            border-radius: 999px;
          }

          .panel-${sceneId} input[type="range"]::-webkit-slider-thumb {
            min-width: 24px;
            min-height: 24px;
          }

          .panel-${sceneId} .p-rateBox {
            display: grid;
            gap: 8px;
            margin-top: 14px;
            padding: 14px;
            border-radius: 14px;
            background: rgba(8, 47, 73, 0.28);
            border: 1px solid rgba(103, 232, 249, 0.18);
          }

          .panel-${sceneId} .p-rateLine {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 10px;
            color: rgba(226, 232, 240, 0.9);
            font-size: 13px;
            font-weight: 800;
          }

          .panel-${sceneId} .p-rateLine strong {
            color: var(--task-accent);
            font-size: 22px;
            line-height: 1;
          }

          .panel-${sceneId} .p-checkList {
            margin: 12px 0 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .p-checkList li {
            min-width: 0;
            padding: 9px 10px;
            border-radius: 11px;
            color: rgba(241, 245, 249, 0.9);
            background: rgba(2, 6, 23, 0.34);
            border: 1px solid rgba(148, 163, 184, 0.11);
            font-size: 13px;
            line-height: 1.45;
          }

          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 9px;
            margin-top: 14px;
          }

          .panel-${sceneId} .p-flowLine {
            min-width: 0;
            min-height: 52px;
            display: grid;
            grid-template-columns: 86px minmax(0, 1fr);
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 13px;
            background: rgba(2, 6, 23, 0.34);
            border: 1px solid rgba(148, 163, 184, 0.12);
          }

          .panel-${sceneId} .p-flowLine span {
            color: rgba(148, 163, 184, 0.92);
            font-size: 12px;
            font-weight: 900;
            line-height: 1.3;
          }

          .panel-${sceneId} .p-flowLine strong {
            min-width: 0;
            color: rgba(248, 250, 252, 0.94);
            font-size: 13px;
            line-height: 1.45;
            font-weight: 850;
          }

          @media (max-width: 860px) {
            [data-scope="${sceneId}"] .leaf-stage__metric {
              display: none;
            }

            [data-scope="${sceneId}"] .leaf-stage__summary {
              max-width: 100%;
              font-size: 13px;
              line-height: 1.55;
            }

            [data-scope="${sceneId}"] .leaf-stage__legendItem {
              font-size: 11px;
              padding: 7px 10px;
            }

            .panel-${sceneId} .p-taskGrid,
            .panel-${sceneId} .p-actionRow {
              grid-template-columns: 1fr;
            }
          }

          /* Fully-Enlarged Widescreen Modal Overlay and Responsive Chinese Labels System */
          [data-scope="${sceneId}"] .leaf-stage__modalOverlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(3, 7, 18, 0.65);
            backdrop-filter: blur(20px) saturate(150%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            opacity: 0;
            pointer-events: none;
            visibility: hidden;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s ease;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalOverlay.is-open {
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalContent {
            width: 90%;
            max-width: 1100px;
            height: 85vh;
            max-height: 800px;
            background: rgba(8, 17, 14, 0.96);
            border: 1.5px solid rgba(103, 232, 249, 0.28);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px rgba(103, 232, 249, 0.1);
            border-radius: 32px;
            position: relative;
            padding: 40px;
            transform: scale(0.94) translateY(16px);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalOverlay.is-open .leaf-stage__modalContent {
            transform: scale(1) translateY(0);
          }

          [data-scope="${sceneId}"] .leaf-stage__modalClose {
            position: absolute;
            top: 24px;
            right: 24px;
            width: 36px;
            height: 36px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 10;
            padding: 0;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalClose:hover {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
            transform: rotate(90deg) scale(1.05);
          }

          [data-scope="${sceneId}"] .leaf-stage__modalGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            height: 100%;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalImageContainer {
            position: relative;
            border-radius: 24px;
            overflow: visible;
            border: 1.5px solid rgba(255, 255, 255, 0.12);
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            max-height: 520px;
            aspect-ratio: 1;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
            margin: 0 auto;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalImage {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
            transition: transform 0.5s ease;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalImageContainer:hover .leaf-stage__modalImage {
            transform: scale(1.02);
          }

          [data-scope="${sceneId}"] .leaf-stage__modalImageGlow {
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 45px rgba(var(--glow-color-rgb), 0.25);
            pointer-events: none;
            border-radius: 22px;
          }

          [data-scope="${sceneId}"] .leaf-stage__labelsOverlay {
            position: absolute;
            inset: 0;
            pointer-events: auto;
            z-index: 10;
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -50%);
            animation: leafHotspotFadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            animation-delay: var(--delay, 0s);
          }

          @keyframes leafHotspotFadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--accent-color, #10b981);
            border: 2px solid #fff;
            box-shadow: 0 0 16px var(--accent-color, #10b981), 0 0 0 4px rgba(255, 255, 255, 0.2);
            cursor: pointer;
            z-index: 5;
            position: relative;
            transition: all 0.25s ease;
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot-dot::after {
            content: "";
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 1px dashed var(--accent-color, #10b981);
            opacity: 0.7;
            animation: leafHotspotPulse 2s infinite linear;
          }

          @keyframes leafHotspotPulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot:hover .leaf-stage__hotspot-dot {
            transform: scale(1.3);
            background: #fff;
            border-color: var(--accent-color, #10b981);
            box-shadow: 0 0 24px var(--accent-color, #10b981);
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot-badge {
            position: absolute;
            background: rgba(15, 23, 42, 0.9);
            border: 1.5px solid var(--accent-color, #10b981);
            color: #fff;
            padding: 5px 10px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 12px rgba(255, 255, 255, 0.05);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            backdrop-filter: blur(8px);
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot--left .leaf-stage__hotspot-badge {
            right: 20px;
            left: auto;
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot--right .leaf-stage__hotspot-badge {
            left: 20px;
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot--top .leaf-stage__hotspot-badge {
            bottom: 20px;
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot--bottom .leaf-stage__hotspot-badge {
            top: 20px;
          }

          [data-scope="${sceneId}"] .leaf-stage__hotspot:hover .leaf-stage__hotspot-badge {
            background: var(--accent-color, #10b981);
            color: #030712;
            transform: scale(1.06);
          }

          [data-scope="${sceneId}"] .leaf-stage__modalDetails {
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: left;
            height: 100%;
            overflow-y: auto;
            padding-right: 16px;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalDetails::-webkit-scrollbar {
            width: 6px;
          }
          [data-scope="${sceneId}"] .leaf-stage__modalDetails::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 3px;
          }
          [data-scope="${sceneId}"] .leaf-stage__modalDetails::-webkit-scrollbar-thumb {
            background: rgba(103, 232, 249, 0.3);
            border-radius: 3px;
          }
          [data-scope="${sceneId}"] .leaf-stage__modalDetails::-webkit-scrollbar-thumb:hover {
            background: rgba(103, 232, 249, 0.5);
          }

          [data-scope="${sceneId}"] .leaf-stage__modalEyebrow {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.08em;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalTitle {
            margin: 0;
            font-size: 26px;
            font-weight: 950;
            color: #fff;
            letter-spacing: -0.01em;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalSummary {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: rgba(226, 232, 240, 0.85);
          }

          [data-scope="${sceneId}"] .leaf-stage__modalSectionTitle {
            margin: 0 0 6px 0;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.06em;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalPrompt {
            margin: 0;
            font-size: 13px;
            line-height: 1.55;
            color: rgba(226, 232, 240, 0.72);
            background: rgba(255, 255, 255, 0.02);
            border-left: 3px solid var(--task-accent, #38bdf8);
            padding: 10px 12px;
            border-radius: 4px 10px 10px 4px;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalChecks {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 10px;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalChecks li {
            font-size: 13px;
            line-height: 1.5;
            color: rgba(226, 232, 240, 0.8);
            display: flex;
            gap: 10px;
            align-items: flex-start;
          }

          [data-scope="${sceneId}"] .leaf-stage__modalChecks li::before {
            content: "✓";
            color: var(--check-color, #22c55e);
            font-weight: 900;
            flex: none;
          }

          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .leaf-stage__modalContent {
              padding: 24px;
              height: 90vh;
              overflow-y: auto;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 24px;
              height: auto;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalImageContainer {
              max-width: 320px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalDetails {
              height: auto;
              overflow-y: visible;
              padding-right: 0;
            }
          }

          /* Unified mobile/tablet layout for observation-task image popups. */
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .leaf-stage__modalOverlay {
              align-items: center;
              justify-content: center;
              padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalContent {
              width: min(calc(100vw - 48px), 560px);
              max-width: 560px;
              height: auto;
              min-height: 0;
              max-height: min(90vh, 760px);
              max-height: min(90dvh, 760px);
              padding: 54px 22px 22px;
              border-radius: 26px;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalClose {
              position: absolute;
              top: 14px;
              right: 14px;
              width: 44px;
              height: 44px;
              min-width: 44px;
              min-height: 44px;
              border-radius: 14px;
              background: rgba(15, 23, 42, 0.78);
              border-color: rgba(255, 255, 255, 0.16);
              color: rgba(255, 255, 255, 0.92);
              backdrop-filter: blur(12px);
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
            }

            [data-scope="${sceneId}"] .leaf-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: start;
              height: auto;
              min-height: 0;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalImageContainer {
              width: min(100%, 320px);
              max-width: 320px;
              height: auto;
              max-height: none;
              aspect-ratio: 1 / 1;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalImage {
              width: 100%;
              height: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalDetails {
              height: auto;
              min-height: 0;
              max-height: none;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
              overflow-wrap: anywhere;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalSummary,
            [data-scope="${sceneId}"] .leaf-stage__modalPrompt,
            [data-scope="${sceneId}"] .leaf-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.5;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .leaf-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .leaf-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalImageContainer {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .leaf-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .leaf-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalImageContainer {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalDetails::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .leaf-stage__modalSummary,
            [data-scope="${sceneId}"] .leaf-stage__modalPrompt,
            [data-scope="${sceneId}"] .leaf-stage__modalChecks li {
              font-size: 12px;
              line-height: 1.45;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const task = getActiveTask();
        const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
        container.innerHTML = `
          <div class="leaf-stage">
            <div class="leaf-stage__frame">
              <model-viewer
                class="leaf-stage__modelViewer"
                data-role="model-viewer"
                src="${escapeHtml(modelSrc)}"
                camera-controls
                interaction-prompt="none"
                shadow-intensity="0.78"
                exposure="0.98"
                auto-rotate
                auto-rotate-delay="0"
                rotation-per-second="14deg"
                environment-image="neutral"
                loading="eager"
                field-of-view="42deg"
                min-field-of-view="12deg"
                max-field-of-view="82deg"
                camera-orbit="${escapeHtml(task.cameraOrbit)}"
                alt="叶片横切与蒸腾作用 3D 模型">
                <div class="leaf-stage__poster" slot="poster">模型加载中...</div>
              </model-viewer>
              <div class="leaf-stage__vapor" aria-hidden="true"></div>
              <div class="leaf-stage__hud">
                <div class="leaf-stage__metric">
                  <div class="leaf-stage__metricLabel">模拟蒸腾速率</div>
                  <div class="leaf-stage__rate"><strong data-role="rate-value">0</strong><span data-role="rate-level">弱</span></div>
                  <div class="leaf-stage__bar"><span data-role="rate-bar"></span></div>
                  <div class="leaf-stage__taskBadge" data-role="task-label">${escapeHtml(task.title)}</div>
                </div>
              </div>
              <div class="leaf-stage__bottom">
                <div class="leaf-stage__legend" aria-label="叶片结构与功能图例">
                  <div class="leaf-stage__legendItem"><span class="leaf-stage__dot" style="--dot-color:#38bdf8"></span>气孔蒸腾</div>
                  <div class="leaf-stage__legendItem"><span class="leaf-stage__dot" style="--dot-color:#22d3ee"></span>叶脉水流</div>
                  <div class="leaf-stage__legendItem"><span class="leaf-stage__dot" style="--dot-color:#22c55e"></span>叶肉光合</div>
                  <div class="leaf-stage__legendItem"><span class="leaf-stage__dot" style="--dot-color:#facc15"></span>生物圈水循环</div>
                </div>
              </div>

              <!-- Interactive Pedagogical Modal Overlay -->
              <div class="leaf-stage__modalOverlay${state.showModal ? " is-open" : ""}" data-role="modal-overlay">
                <div class="leaf-stage__modalContent">
                  <button class="leaf-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="leaf-stage__modalGrid">
                    <div class="leaf-stage__modalImageContainer">
                      <img class="leaf-stage__modalImage" src="${escapeHtml(assetBase + task.imageRelativeUrl)}" alt="${escapeHtml(task.title)}" />
                      <div class="leaf-stage__modalImageGlow" style="--glow-color-rgb: ${hexToRgb(task.accent)}"></div>
                      <div class="leaf-stage__labelsOverlay" data-role="labels-overlay">
                        ${renderChineseLabels(task.id, task.accent)}
                      </div>
                    </div>
                    <div class="leaf-stage__modalDetails">
                      <div>
                        <span class="leaf-stage__modalEyebrow" style="background: ${task.accent}1c; color: ${task.accent}">
                          蒸腾与水循环 · 核心精讲
                        </span>
                        <h2 class="leaf-stage__modalTitle">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="photo-stage__modalSummary" style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(226, 232, 240, 0.85);">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="leaf-stage__modalSectionTitle" style="color: ${task.accent}">💡 学习提示</h3>
                        <p class="leaf-stage__modalPrompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="leaf-stage__modalSectionTitle" style="color: ${task.accent}">📝 知识要点</h3>
                        <ul class="leaf-stage__modalChecks" style="--check-color: ${task.accent}">
                          ${task.checks.map(chk => `<li>${escapeHtml(chk)}</li>`).join("")}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        `;
      }

      function updateStage() {
        const task = getActiveTask();
        const rate = getRate();
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}33`);
        container.style.setProperty("--vapor-opacity", String(Math.max(0.16, rate / 100)));
        const summary = container.querySelector('[data-role="task-summary"]');
        const label = container.querySelector('[data-role="task-label"]');
        const rateValue = container.querySelector('[data-role="rate-value"]');
        const rateLevelNode = container.querySelector('[data-role="rate-level"]');
        const rateBar = container.querySelector('[data-role="rate-bar"]');
        if (summary) summary.textContent = task.summary;
        if (label) label.textContent = task.title;
        if (rateValue) rateValue.textContent = String(rate);
        if (rateLevelNode) rateLevelNode.textContent = rateLevel(rate);
        if (rateBar) rateBar.style.setProperty("--rate-width", `${rate}%`);

        const viewer = findViewer();
        if (viewer) {
          if (!state.showModal) {
            viewer.setAttribute("camera-orbit", task.cameraOrbit);
          }
          if (state.autoRotate) viewer.setAttribute("auto-rotate", "");
          else viewer.removeAttribute("auto-rotate");
        }

        const modalOverlay = container.querySelector('[data-role="modal-overlay"]');
        if (modalOverlay) {
          if (state.showModal) {
            const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
            const modalImage = modalOverlay.querySelector('.leaf-stage__modalImage');
            const modalImageGlow = modalOverlay.querySelector('.leaf-stage__modalImageGlow');
            const modalEyebrow = modalOverlay.querySelector('.leaf-stage__modalEyebrow');
            const modalTitle = modalOverlay.querySelector('.leaf-stage__modalTitle');
            const modalPrompt = modalOverlay.querySelector('.leaf-stage__modalPrompt');
            const modalChecks = modalOverlay.querySelector('.leaf-stage__modalChecks');
            const modalContent = modalOverlay.querySelector('.leaf-stage__modalContent');
            const modalSecTitles = modalOverlay.querySelectorAll('.leaf-stage__modalSectionTitle');
            const labelsOverlay = modalOverlay.querySelector('[data-role="labels-overlay"]');

            if (modalImage) modalImage.src = escapeHtml(assetBase + task.imageRelativeUrl);
            if (modalImage) modalImage.alt = escapeHtml(task.title);
            if (modalImageGlow) {
              modalImageGlow.style.setProperty("--glow-color-rgb", hexToRgb(task.accent));
            }
            if (modalEyebrow) {
              modalEyebrow.style.background = `${task.accent}1c`;
              modalEyebrow.style.color = task.accent;
            }
            if (modalTitle) modalTitle.textContent = task.title;
            if (modalPrompt) {
              modalPrompt.textContent = task.prompt;
              modalPrompt.style.borderLeftColor = task.accent;
            }
            if (modalChecks) {
              modalChecks.style.setProperty("--check-color", task.accent);
              modalChecks.innerHTML = task.checks.map(chk => `<li>${escapeHtml(chk)}</li>`).join("");
            }
            if (modalContent) {
              modalContent.style.borderColor = `${task.accent}3d`;
              modalContent.style.boxShadow = `0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px ${task.accent}14`;
            }
            modalSecTitles.forEach(titleNode => {
              titleNode.style.color = task.accent;
            });
            if (labelsOverlay) {
              labelsOverlay.innerHTML = renderChineseLabels(task.id, task.accent);
            }

            modalOverlay.classList.add('is-open');
          } else {
            modalOverlay.classList.remove('is-open');
          }
        }
      }

      function setViewerTask() {
        const viewer = findViewer();
        const task = getActiveTask();
        if (viewer) {
          viewer.setAttribute("camera-orbit", task.cameraOrbit);
        }
        updateStage();
      }

      function setAutoRotate(enabled) {
        state.autoRotate = Boolean(enabled);
        const viewer = findViewer();
        if (viewer) {
          if (state.autoRotate) viewer.setAttribute("auto-rotate", "");
          else viewer.removeAttribute("auto-rotate");
        }
      }

      function applyScenario(scenarioId) {
        const scenario = SCENARIOS.find(item => item.id === scenarioId);
        if (!scenario) return;
        state.env = Object.assign({}, state.env, scenario.env);
        syncPanelValues();
        updateStage();
      }

      function syncPanelValues() {
        if (!panelHost) return;
        const env = state.env;
        const pairs = [
          ["light", env.light, "%"],
          ["wind", env.wind, "%"],
          ["humidity", env.humidity, "%"],
          ["temp", env.temp, "℃"]
        ];
        pairs.forEach(([id, value, unit]) => {
          const input = panelHost.querySelector(`[data-env="${id}"]`);
          const badge = panelHost.querySelector(`[data-value="${id}"]`);
          if (input) input.value = String(value);
          if (badge) badge.textContent = `${value}${unit}`;
        });
        const rate = getRate();
        const rateText = panelHost.querySelector('[data-panel-rate="value"]');
        const rateLevelText = panelHost.querySelector('[data-panel-rate="level"]');
        if (rateText) rateText.textContent = String(rate);
        if (rateLevelText) rateLevelText.textContent = rateLevel(rate);
      }

      function renderPanel() {
        if (!panelHost) return;
        const task = getActiveTask();
        const taskButtons = TASKS.map(taskItem => `
          <button class="p-task${taskItem.id === state.activeTask ? " is-active" : ""}"
                  type="button"
                  data-action="select-task"
                  data-value="${escapeHtml(taskItem.id)}"
                  style="--item-accent:${taskItem.accent}">
            <strong>${escapeHtml(taskItem.title)}</strong>
            <span>${escapeHtml(taskItem.label)}</span>
          </button>
        `).join("");
        const scenarioButtons = SCENARIOS.map(scenario => `
          <button class="p-scenario" type="button" data-action="scenario" data-value="${escapeHtml(scenario.id)}">${escapeHtml(scenario.label)}</button>
        `).join("");
        const checks = task.checks.map(item => `<li>${escapeHtml(item)}</li>`).join("");
        const flow = FLOW.map(item => `
          <div class="p-flowLine"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>
        `).join("");
        const rate = getRate();

        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--task-accent:${task.accent}; --task-accent-soft:${task.accent}33">
            <div class="p-card">
              <span class="p-eyebrow">3D 结构合并课件</span>
              <h2 class="p-title">叶片横切模型</h2>
              <p class="p-desc">这张卡以蒸腾作用为主线，合并叶片横切 3D 模型；光合作用作为叶肉细胞功能关联出现，避免和光合作用卡重复讲同一件事。</p>
              <div class="p-actionRow">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">自动旋转</button>
                <button class="p-action" type="button" data-action="reset-camera">复位视角</button>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">观察任务</span>
              <div class="p-taskGrid">${taskButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">环境变量</span>
              <h2 class="p-title">蒸腾速率模拟</h2>
              <div class="p-controlGroup">
                <div class="p-control">
                  <div class="p-controlLabel"><span>光照强度</span><span class="p-value" data-value="light">${state.env.light}%</span></div>
                  <input type="range" min="0" max="100" value="${state.env.light}" data-env="light" />
                </div>
                <div class="p-control">
                  <div class="p-controlLabel"><span>风速</span><span class="p-value" data-value="wind">${state.env.wind}%</span></div>
                  <input type="range" min="0" max="100" value="${state.env.wind}" data-env="wind" />
                </div>
                <div class="p-control">
                  <div class="p-controlLabel"><span>空气湿度</span><span class="p-value" data-value="humidity">${state.env.humidity}%</span></div>
                  <input type="range" min="0" max="100" value="${state.env.humidity}" data-env="humidity" />
                </div>
                <div class="p-control">
                  <div class="p-controlLabel"><span>温度</span><span class="p-value" data-value="temp">${state.env.temp}℃</span></div>
                  <input type="range" min="0" max="45" value="${state.env.temp}" data-env="temp" />
                </div>
              </div>
              <div class="p-rateBox">
                <div class="p-rateLine"><span>当前蒸腾速率</span><strong data-panel-rate="value">${rate}</strong></div>
                <div class="p-rateLine"><span>强弱判断</span><strong data-panel-rate="level">${rateLevel(rate)}</strong></div>
              </div>
              <div class="p-scenarioGrid">${scenarioButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">气孔处理</span>
              <div class="p-actionRow">
                <button class="p-toggle${state.upperBlocked ? " is-active" : ""}" type="button" data-action="toggle-upper">上表皮受阻</button>
                <button class="p-toggle${state.lowerBlocked ? " is-active" : ""}" type="button" data-action="toggle-lower">下表皮受阻</button>
              </div>
              <p class="p-desc">多数陆生植物下表皮气孔较多，因此下表皮受阻时蒸腾速率下降更明显。</p>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">教学卡片</span>
              <h2 class="p-title">${escapeHtml(task.title)}</h2>
              <p class="p-desc">${escapeHtml(task.prompt)}</p>
              <ul class="p-checkList">${checks}</ul>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">过程梳理</span>
              <div class="p-flow">${flow}</div>
            </div>
          </div>
        `;

        panelHost.querySelectorAll("[data-env]").forEach(input => {
          input.addEventListener("input", event => {
            const key = event.currentTarget.dataset.env;
            const value = Number(event.currentTarget.value);
            state.env[key] = value;
            syncPanelValues();
            updateStage();
          });
        });

        panelHost.querySelectorAll("[data-action]").forEach(button => {
          button.addEventListener("click", event => {
            const action = event.currentTarget.dataset.action;
            const value = event.currentTarget.dataset.value;
            if (action === "select-task") {
              state.activeTask = value;
              state.showModal = true;
              renderPanel();
              setViewerTask();
            }
            if (action === "toggle-auto-rotate") {
              setAutoRotate(!state.autoRotate);
              renderPanel();
              updateStage();
            }
            if (action === "reset-camera") {
              state.showModal = false;
              setViewerTask();
              renderPanel();
            }
            if (action === "scenario") {
              applyScenario(value);
            }
            if (action === "toggle-upper") {
              state.upperBlocked = !state.upperBlocked;
              renderPanel();
              updateStage();
            }
            if (action === "toggle-lower") {
              state.lowerBlocked = !state.lowerBlocked;
              renderPanel();
              updateStage();
            }
          });
        });

        syncPanelValues();
      }

      function handleStageClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");

        if (action === "close-modal") {
          state.showModal = false;
          updateStage();
          renderPanel();
        }
      }

      container.innerHTML = "";
      container.setAttribute("data-scope", sceneId);
      setScopedStyle();
      renderStage();
      renderPanel();
      updateStage();
      container.addEventListener("click", handleStageClick);

      loadModelViewer().then(() => {
        if (disposed) return;
        const viewer = findViewer();
        if (viewer) setAutoRotate(state.autoRotate);
        if (window.BiologyApp && typeof window.BiologyApp.enhanceBiologyModelViewerProgress === "function") {
          window.BiologyApp.enhanceBiologyModelViewerProgress(container);
        }
      });

      return {
        destroy: function destroy() {
          disposed = true;
          container.removeEventListener("click", handleStageClick);
          window.BiologyApp?.releaseBiologyModelViewers?.(container);
          if (style && style.parentNode) style.parentNode.removeChild(style);
          if (panelHost) panelHost.innerHTML = "";
          container.innerHTML = "";
        }
      };
    }
  };
})();

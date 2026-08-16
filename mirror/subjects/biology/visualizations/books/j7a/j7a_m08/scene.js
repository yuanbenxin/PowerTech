window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7a_m08"] = (function () {

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

  const OBSERVATION_TASKS = [
    {
      id: "light",
      title: "光能捕获",
      label: "叶绿素吸收光能",
      accent: "#facc15",
      cameraOrbit: "0deg 68deg 118%",
      summary: "光能被叶绿体中的色素捕获，为后续把无机物转化为有机物提供能量。",
      prompt: "先把模型当作微观光合作用场景来观察：光能不是直接变成糖，而是先被叶绿素等色素吸收并转化为化学反应可用的能量。",
      checks: ["光合作用需要光能驱动", "叶绿体是绿色植物进行光合作用的主要场所", "光照过弱时，有机物制造速度会明显下降"],
      imageRelativeUrl: "assets/images/light.png?v=dfddcf1e86c5"
    },
    {
      id: "chloroplast",
      title: "叶绿体结构",
      label: "反应场所定位",
      accent: "#22c55e",
      cameraOrbit: "32deg 70deg 105%",
      summary: "叶绿体内部的膜结构扩大反应面积，让光反应和有机物合成能高效进行。",
      prompt: "观察模型中的层次结构，重点建立“结构服务功能”的思路：叶绿体不是简单绿色小球，而是具有复杂膜系统的能量转换场所。",
      checks: ["叶绿体含有叶绿素", "类囊体膜扩大了受光和反应面积", "植物绿色部分通常更适合进行光合作用"],
      imageRelativeUrl: "assets/images/chloroplast.png?v=6bd2cd2d8844"
    },
    {
      id: "materials",
      title: "原料进入",
      label: "水和二氧化碳",
      accent: "#38bdf8",
      cameraOrbit: "-34deg 68deg 112%",
      summary: "水和二氧化碳是制造有机物的主要原料，缺少任一原料都会限制光合作用。",
      prompt: "把水、二氧化碳和光照一起看：叶脉把水分送到叶肉组织，二氧化碳进入叶片后，叶绿体才能持续合成有机物。",
      checks: ["水通常经叶脉运输到叶肉组织", "二氧化碳进入叶片后参与有机物合成", "氧气是光合作用释放的重要产物"],
      imageRelativeUrl: "assets/images/materials.png?v=324f8f4f2b3b"
    },
    {
      id: "products",
      title: "有机物制造",
      label: "糖类和氧气形成",
      accent: "#f97316",
      cameraOrbit: "54deg 72deg 112%",
      summary: "光合作用把二氧化碳和水转化为储存能量的有机物，并释放氧气。",
      prompt: "把最后的产物与生物圈联系起来：绿色植物制造的有机物进入食物链，释放的氧气也维持了许多生物的呼吸。",
      checks: ["有机物储存了来自光能的能量", "氧气是光合作用释放的重要产物", "光合作用连接植物自身生长和生物圈物质循环"],
      imageRelativeUrl: "assets/images/products.png?v=1315f3fccc90"
    }
  ];

  const PROCESS_FLOW = [
    { label: "能量来源", value: "光能被叶绿素等色素吸收" },
    { label: "主要原料", value: "二氧化碳 + 水" },
    { label: "反应场所", value: "绿色植物细胞中的叶绿体" },
    { label: "核心产物", value: "有机物 + 氧气" }
  ];

  const QUIZ = {
    question: "光合作用制造有机物时，主要利用的原料是？",
    options: [
      { id: "right-materials", text: "二氧化碳和水", correct: true },
      { id: "wrong-oxygen", text: "氧气和无机盐", correct: false },
      { id: "wrong-sugar", text: "淀粉和蛋白质", correct: false }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "photosynthesis-model-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const modelSource = {
        desktop: `${assetBase}assets/models/photosynthesis.glb?v=2f6e5b562d68`,
        tablet: `${assetBase}assets/models/photosynthesis.tablet.glb?v=d1acf46c2aec`,
        mobile: `${assetBase}assets/models/photosynthesis.mobile.glb?v=cd8c00c8ed32`
      };
      const modelSrc = window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function"
        ? window.BiologyApp.resolveBiologyModelVariantSource(modelSource)
        : (typeof runtimeVersioner === "function" ? runtimeVersioner(modelSource.desktop) : modelSource.desktop);

      let disposed = false;

      const state = {
        activeTask: "light",
        autoRotate: true,
        quizAnswer: "",
        quizFeedback: "",
        showModal: false
      };

      function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "34, 197, 94";
      }

      function renderChineseLabels(taskId, accent) {
        const labelsData = {
          light: [
            { text: "太阳光能 (光合作用动力源泉)", top: "15%", left: "45%", pos: "top" },
            { text: "上表皮细胞 (无色透明利于透光)", top: "32%", left: "34%", pos: "right" },
            { text: "叶绿体色素 (吸收并转化光能)", top: "55%", left: "52%", pos: "right" }
          ],
          chloroplast: [
            { text: "外膜 (维持叶绿体稳定形态)", top: "25%", left: "32%", pos: "right" },
            { text: "内膜 (选择性控制物质进出)", top: "28%", left: "65%", pos: "right" },
            { text: "类囊体基粒 (极大地扩大光反应面积)", top: "56%", left: "42%", pos: "right" },
            { text: "基质 (暗反应场所，含合成酶与DNA)", top: "68%", left: "58%", pos: "right" }
          ],
          materials: [
            { text: "气孔 (二氧化碳气体进入的门户)", top: "75%", left: "50%", pos: "bottom" },
            { text: "导管/叶脉 (提供根部吸收的水分)", top: "42%", left: "35%", pos: "right" },
            { text: "栅栏/海绵组织 (制造有机物的核心厂房)", top: "38%", left: "62%", pos: "right" }
          ],
          products: [
            { text: "淀粉等有机物 (储存化学能，供生命活动)", top: "48%", left: "42%", pos: "right" },
            { text: "氧气释放 (经气孔释放，维持碳氧平衡)", top: "74%", left: "54%", pos: "bottom" },
            { text: "筛管/叶脉 (输送有机物至全植株)", top: "35%", left: "60%", pos: "right" }
          ]
        };

        const list = labelsData[taskId] || [];
        return list.map((item, index) => `
          <div class="photo-stage__hotspot photo-stage__hotspot--${item.pos}" 
               style="top: ${item.top}; left: ${item.left}; --accent-color: ${accent}; --delay: ${index * 0.15}s">
            <div class="photo-stage__hotspot-dot"></div>
            <div class="photo-stage__hotspot-line"></div>
            <div class="photo-stage__hotspot-badge">${escapeHtml(item.text)}</div>
          </div>
        `).join("");
      }

      function getActiveTask() {
        return OBSERVATION_TASKS.find(task => task.id === state.activeTask) || OBSERVATION_TASKS[0];
      }

      function findViewer() {
        return container.querySelector("model-viewer");
      }

      function setScopedStyle() {
        const style = document.createElement("style");
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
            background: #030712;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }

          [data-scope="${sceneId}"] * {
            box-sizing: border-box;
          }

          [data-scope="${sceneId}"] .photo-stage {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            display: grid;
            padding: 18px;
            background:
              radial-gradient(circle at 44% 36%, rgba(250, 204, 21, 0.16), transparent 30%),
              radial-gradient(circle at 18% 72%, rgba(56, 189, 248, 0.12), transparent 28%),
              radial-gradient(circle at 78% 28%, rgba(34, 197, 94, 0.14), transparent 34%),
              linear-gradient(145deg, #020617 0%, #07140f 50%, #141006 100%);
          }

          [data-scope="${sceneId}"] .photo-stage__frame {
            position: relative;
            min-width: 0;
            min-height: 0;
            border-radius: 26px;
            overflow: hidden;
            border: 1px solid rgba(248, 250, 252, 0.1);
            background:
              linear-gradient(rgba(255, 255, 255, 0.024) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.024) 1px, transparent 1px),
              radial-gradient(circle at center, rgba(21, 128, 61, 0.1), rgba(2, 6, 23, 0.94));
            background-size: 34px 34px, 34px 34px, auto;
            box-shadow: inset 0 0 90px rgba(15, 23, 42, 0.78), 0 24px 60px rgba(0, 0, 0, 0.34);
          }

          [data-scope="${sceneId}"] .photo-stage__modelViewer {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
            background: transparent;
            --poster-color: transparent;
          }

          [data-scope="${sceneId}"] .photo-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: rgba(226, 232, 240, 0.78);
            font-size: 14px;
            background: rgba(2, 6, 23, 0.66);
          }

          [data-scope="${sceneId}"] .photo-stage__hud {
            position: absolute;
            inset: 18px 18px auto 18px;
            z-index: 8;
            display: flex;
            align-items: flex-start;
            justify-content: flex-end;
            gap: 12px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .photo-stage__taskText {
            max-width: 520px;
            color: rgba(226, 232, 240, 0.84);
            font-size: 13px;
            line-height: 1.55;
            text-shadow: 0 4px 18px rgba(0, 0, 0, 0.42);
          }

          [data-scope="${sceneId}"] .photo-stage__modeBadge {
            min-width: 176px;
            flex: none;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.58);
            padding: 12px;
            display: grid;
            gap: 8px;
            backdrop-filter: blur(16px);
          }

          [data-scope="${sceneId}"] .photo-stage__modeLabel {
            color: rgba(226, 232, 240, 0.68);
            font-size: 11px;
            font-weight: 800;
          }

          [data-scope="${sceneId}"] .photo-stage__modeValue {
            color: var(--task-accent, #facc15);
            font-size: 16px;
            line-height: 1.2;
            font-weight: 950;
          }

          [data-scope="${sceneId}"] .photo-stage__bottom {
            position: absolute;
            z-index: 8;
            left: 18px;
            right: 18px;
            bottom: 18px;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .photo-stage__legend {
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          [data-scope="${sceneId}"] .photo-stage__legendItem {
            min-height: 30px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 7px 10px;
            border-radius: 999px;
            color: rgba(248, 250, 252, 0.86);
            background: rgba(2, 6, 23, 0.56);
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 12px;
            line-height: 1.2;
            backdrop-filter: blur(14px);
          }

          [data-scope="${sceneId}"] .photo-stage__dot {
            width: 8px;
            height: 8px;
            flex: none;
            border-radius: 999px;
            background: var(--dot-color);
            box-shadow: 0 0 14px var(--dot-color);
          }

          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 14px;
            color: #f8fafc;
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
          }

          .panel-${sceneId} * {
            box-sizing: border-box;
          }

          .panel-${sceneId} .p-card {
            width: 100%;
            min-width: 0;
            display: grid;
            gap: 12px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.035);
            padding: 15px;
          }

          .panel-${sceneId} .p-eyebrow {
            color: var(--task-accent, #facc15);
            font-size: 11px;
            line-height: 1.1;
            font-weight: 950;
            letter-spacing: 0.08em;
          }

          .panel-${sceneId} .p-title {
            margin: 0;
            color: #fff;
            font-size: 22px;
            line-height: 1.18;
            font-weight: 950;
            letter-spacing: 0;
          }

          .panel-${sceneId} .p-desc {
            margin: 0;
            color: rgba(226, 232, 240, 0.78);
            font-size: 13px;
            line-height: 1.65;
          }

          .panel-${sceneId} button {
            font-family: inherit;
          }

          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-task,
          .panel-${sceneId} .p-quizOption {
            appearance: none;
            width: 100%;
            min-width: 0;
            cursor: pointer;
          }

          .panel-${sceneId} .p-actionRow {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
            gap: 8px;
          }

          .panel-${sceneId} .p-action {
            min-height: 40px;
            border-radius: 13px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(2, 6, 23, 0.38);
            color: rgba(248, 250, 252, 0.86);
            font-size: 13px;
            line-height: 1.2;
            font-weight: 900;
          }

          .panel-${sceneId} .p-action.is-active {
            color: #fff;
            border-color: var(--task-accent, #facc15);
            background: var(--task-accent-soft, rgba(250, 204, 21, 0.16));
          }

          .panel-${sceneId} .p-taskGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .panel-${sceneId} .p-task {
            min-height: 76px;
            display: grid;
            align-content: center;
            gap: 6px;
            padding: 12px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.025);
            color: #f8fafc;
            text-align: left;
            transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
          }

          .panel-${sceneId} .p-task:hover {
            transform: translateY(-1px);
            background: rgba(255, 255, 255, 0.052);
          }

          .panel-${sceneId} .p-task.is-active {
            border-color: var(--item-accent);
            background: rgba(255, 255, 255, 0.06);
          }

          .panel-${sceneId} .p-task strong {
            color: #fff;
            font-size: 14px;
            line-height: 1.16;
            font-weight: 950;
          }

          .panel-${sceneId} .p-task span {
            color: rgba(226, 232, 240, 0.62);
            font-size: 11px;
            line-height: 1.25;
            font-weight: 800;
          }

          .panel-${sceneId} .p-checkList {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          .panel-${sceneId} .p-checkList li {
            min-width: 0;
            display: flex;
            gap: 8px;
            align-items: flex-start;
            color: rgba(226, 232, 240, 0.76);
            font-size: 12px;
            line-height: 1.48;
          }

          .panel-${sceneId} .p-checkList li::before {
            content: "";
            width: 7px;
            height: 7px;
            flex: none;
            margin-top: 6px;
            border-radius: 50%;
            background: var(--task-accent, #facc15);
            box-shadow: 0 0 12px var(--task-accent, #facc15);
          }

          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .p-flowLine {
            display: grid;
            grid-template-columns: 76px minmax(0, 1fr);
            gap: 10px;
            align-items: center;
            min-height: 42px;
            border-radius: 14px;
            background: rgba(2, 6, 23, 0.32);
            padding: 8px 10px;
          }

          .panel-${sceneId} .p-flowLine span {
            color: rgba(226, 232, 240, 0.62);
            font-size: 11px;
            font-weight: 900;
          }

          .panel-${sceneId} .p-flowLine strong {
            min-width: 0;
            color: #fff;
            font-size: 13px;
            line-height: 1.35;
            font-weight: 900;
          }

          .panel-${sceneId} .p-quiz {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .p-quizQuestion {
            color: #f8fafc;
            font-size: 13px;
            line-height: 1.45;
            font-weight: 900;
          }

          .panel-${sceneId} .p-quizOption {
            min-height: 42px;
            padding: 10px 12px;
            border-radius: 13px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(2, 6, 23, 0.35);
            color: rgba(226, 232, 240, 0.82);
            text-align: left;
            font-size: 12px;
            line-height: 1.38;
            font-weight: 800;
          }

          .panel-${sceneId} .p-quizOption.is-selected {
            border-color: var(--task-accent, #facc15);
            color: #fff;
            background: var(--task-accent-soft, rgba(250, 204, 21, 0.16));
          }

          .panel-${sceneId} .p-feedback {
            min-height: 38px;
            border-radius: 13px;
            padding: 10px 12px;
            background: rgba(2, 6, 23, 0.32);
            color: rgba(226, 232, 240, 0.78);
            font-size: 12px;
            line-height: 1.5;
          }

          .panel-${sceneId} .p-feedback.is-correct {
            color: #bbf7d0;
            background: rgba(34, 197, 94, 0.13);
          }

          .panel-${sceneId} .p-feedback.is-wrong {
            color: #fecaca;
            background: rgba(239, 68, 68, 0.13);
          }

          @media (max-width: 820px) {
            [data-scope="${sceneId}"] .photo-stage {
              padding: 8px;
            }

            [data-scope="${sceneId}"] .photo-stage__hud {
              inset: 10px 10px auto 10px;
              align-items: flex-end;
              flex-direction: column;
            }

            [data-scope="${sceneId}"] .photo-stage__modeBadge {
              width: max-content;
              max-width: 100%;
              min-width: 0;
            }

            [data-scope="${sceneId}"] .photo-stage__taskText {
              display: none;
            }

            [data-scope="${sceneId}"] .photo-stage__bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
            }
          }

          /* Fully-Enlarged Widescreen Modal Overlay and Responsive Chinese Labels System */
          [data-scope="${sceneId}"] .photo-stage__modalOverlay {
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

          [data-scope="${sceneId}"] .photo-stage__modalOverlay.is-open {
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
          }

          [data-scope="${sceneId}"] .photo-stage__modalContent {
            width: 90%;
            max-width: 1100px;
            height: 85vh;
            max-height: 800px;
            background: rgba(8, 17, 14, 0.96);
            border: 1.5px solid rgba(34, 197, 94, 0.28);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px rgba(34, 197, 94, 0.1);
            border-radius: 32px;
            position: relative;
            padding: 40px;
            transform: scale(0.94) translateY(16px);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          [data-scope="${sceneId}"] .photo-stage__modalOverlay.is-open .photo-stage__modalContent {
            transform: scale(1) translateY(0);
          }

          [data-scope="${sceneId}"] .photo-stage__modalClose {
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

          [data-scope="${sceneId}"] .photo-stage__modalClose:hover {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
            transform: rotate(90deg) scale(1.05);
          }

          [data-scope="${sceneId}"] .photo-stage__modalGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            height: 100%;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .photo-stage__modalImageContainer {
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

          [data-scope="${sceneId}"] .photo-stage__modalImage {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
            transition: transform 0.5s ease;
          }

          [data-scope="${sceneId}"] .photo-stage__modalImageContainer:hover .photo-stage__modalImage {
            transform: scale(1.02);
          }

          [data-scope="${sceneId}"] .photo-stage__modalImageGlow {
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 45px rgba(var(--glow-color-rgb), 0.25);
            pointer-events: none;
            border-radius: 22px;
          }

          [data-scope="${sceneId}"] .photo-stage__labelsOverlay {
            position: absolute;
            inset: 0;
            pointer-events: auto;
            z-index: 10;
          }

          [data-scope="${sceneId}"] .photo-stage__hotspot {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -50%);
            animation: photoHotspotFadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            animation-delay: var(--delay, 0s);
          }

          @keyframes photoHotspotFadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }

          [data-scope="${sceneId}"] .photo-stage__hotspot-dot {
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

          [data-scope="${sceneId}"] .photo-stage__hotspot-dot::after {
            content: "";
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 1px dashed var(--accent-color, #10b981);
            opacity: 0.7;
            animation: photoHotspotPulse 2s infinite linear;
          }

          @keyframes photoHotspotPulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          [data-scope="${sceneId}"] .photo-stage__hotspot:hover .photo-stage__hotspot-dot {
            transform: scale(1.3);
            background: #fff;
            border-color: var(--accent-color, #10b981);
            box-shadow: 0 0 24px var(--accent-color, #10b981);
          }

          [data-scope="${sceneId}"] .photo-stage__hotspot-badge {
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

          [data-scope="${sceneId}"] .photo-stage__hotspot--left .photo-stage__hotspot-badge {
            right: 20px;
            left: auto;
          }

          [data-scope="${sceneId}"] .photo-stage__hotspot--right .photo-stage__hotspot-badge {
            left: 20px;
          }

          [data-scope="${sceneId}"] .photo-stage__hotspot--top .photo-stage__hotspot-badge {
            bottom: 20px;
          }

          [data-scope="${sceneId}"] .photo-stage__hotspot--bottom .photo-stage__hotspot-badge {
            top: 20px;
          }

          [data-scope="${sceneId}"] .photo-stage__hotspot:hover .photo-stage__hotspot-badge {
            background: var(--accent-color, #10b981);
            color: #030712;
            transform: scale(1.06);
          }

          [data-scope="${sceneId}"] .photo-stage__modalDetails {
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: left;
            height: 100%;
            overflow-y: auto;
            padding-right: 16px;
          }

          [data-scope="${sceneId}"] .photo-stage__modalDetails::-webkit-scrollbar {
            width: 6px;
          }
          [data-scope="${sceneId}"] .photo-stage__modalDetails::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 3px;
          }
          [data-scope="${sceneId}"] .photo-stage__modalDetails::-webkit-scrollbar-thumb {
            background: rgba(34, 197, 94, 0.3);
            border-radius: 3px;
          }
          [data-scope="${sceneId}"] .photo-stage__modalDetails::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 197, 94, 0.5);
          }

          [data-scope="${sceneId}"] .photo-stage__modalEyebrow {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.08em;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          [data-scope="${sceneId}"] .photo-stage__modalTitle {
            margin: 0;
            font-size: 26px;
            font-weight: 950;
            color: #fff;
            letter-spacing: -0.01em;
          }

          [data-scope="${sceneId}"] .photo-stage__modalSummary {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: rgba(226, 232, 240, 0.85);
          }

          [data-scope="${sceneId}"] .photo-stage__modalSectionTitle {
            margin: 0 0 6px 0;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.06em;
          }

          [data-scope="${sceneId}"] .photo-stage__modalPrompt {
            margin: 0;
            font-size: 13px;
            line-height: 1.55;
            color: rgba(226, 232, 240, 0.72);
            background: rgba(255, 255, 255, 0.02);
            border-left: 3px solid var(--task-accent, #facc15);
            padding: 10px 12px;
            border-radius: 4px 10px 10px 4px;
          }

          [data-scope="${sceneId}"] .photo-stage__modalChecks {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 10px;
          }

          [data-scope="${sceneId}"] .photo-stage__modalChecks li {
            font-size: 13px;
            line-height: 1.5;
            color: rgba(226, 232, 240, 0.8);
            display: flex;
            gap: 10px;
            align-items: flex-start;
          }

          [data-scope="${sceneId}"] .photo-stage__modalChecks li::before {
            content: "✓";
            color: var(--check-color, #22c55e);
            font-weight: 900;
            flex: none;
          }

          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .photo-stage__modalContent {
              padding: 24px;
              height: 90vh;
              overflow-y: auto;
            }

            [data-scope="${sceneId}"] .photo-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 24px;
              height: auto;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .photo-stage__modalImageContainer {
              max-width: 320px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .photo-stage__modalDetails {
              height: auto;
              overflow-y: visible;
              padding-right: 0;
            }
          }

          /* Unified mobile/tablet layout for observation-task image popups. */
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .photo-stage__modalOverlay {
              align-items: center;
              justify-content: center;
              padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .photo-stage__modalContent {
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

            [data-scope="${sceneId}"] .photo-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .photo-stage__modalClose {
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

            [data-scope="${sceneId}"] .photo-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: start;
              height: auto;
              min-height: 0;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .photo-stage__modalImageContainer {
              width: min(100%, 320px);
              max-width: 320px;
              height: auto;
              max-height: none;
              aspect-ratio: 1 / 1;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .photo-stage__modalImage {
              width: 100%;
              height: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .photo-stage__modalDetails {
              height: auto;
              min-height: 0;
              max-height: none;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .photo-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
              overflow-wrap: anywhere;
            }

            [data-scope="${sceneId}"] .photo-stage__modalSummary,
            [data-scope="${sceneId}"] .photo-stage__modalPrompt,
            [data-scope="${sceneId}"] .photo-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.5;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .photo-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .photo-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .photo-stage__modalImageContainer {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .photo-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .photo-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .photo-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .photo-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .photo-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .photo-stage__modalImageContainer {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .photo-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .photo-stage__modalDetails::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .photo-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .photo-stage__modalSummary,
            [data-scope="${sceneId}"] .photo-stage__modalPrompt,
            [data-scope="${sceneId}"] .photo-stage__modalChecks li {
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
        container.setAttribute("data-scope", sceneId);
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        container.innerHTML = `
          <div class="photo-stage">
            <div class="photo-stage__frame" data-role="frame">
              <model-viewer
                class="photo-stage__modelViewer"
                data-role="model-viewer"
                src="${escapeHtml(modelSrc)}"
                camera-controls
                interaction-prompt="none"
                shadow-intensity="0.82"
                exposure="0.96"
                auto-rotate-delay="0"
                rotation-per-second="16deg"
                environment-image="neutral"
                loading="eager"
                field-of-view="42deg"
                min-field-of-view="12deg"
                max-field-of-view="82deg"
                camera-orbit="${escapeHtml(task.cameraOrbit)}"
                alt="叶片横切光合作用 3D 模型">
                <div class="photo-stage__poster" slot="poster">模型加载中...</div>
              </model-viewer>
              <div class="photo-stage__hud">
                <div class="photo-stage__modeBadge">
                  <div class="photo-stage__modeLabel">当前观察任务</div>
                  <div class="photo-stage__modeValue" data-role="task-label">${escapeHtml(task.title)}</div>
                </div>
              </div>
              <div class="photo-stage__bottom">
                <div class="photo-stage__legend" aria-label="光合作用结构图例">
                  <div class="photo-stage__legendItem"><span class="photo-stage__dot" style="--dot-color:#facc15"></span>光能</div>
                  <div class="photo-stage__legendItem"><span class="photo-stage__dot" style="--dot-color:#38bdf8"></span>CO2 + 水</div>
                  <div class="photo-stage__legendItem"><span class="photo-stage__dot" style="--dot-color:#22c55e"></span>叶肉细胞</div>
                  <div class="photo-stage__legendItem"><span class="photo-stage__dot" style="--dot-color:#f97316"></span>有机物 + O2</div>
                </div>
              </div>

              <!-- Interactive Pedagogical Modal Overlay -->
              <div class="photo-stage__modalOverlay${state.showModal ? " is-open" : ""}" data-role="modal-overlay">
                <div class="photo-stage__modalContent">
                  <button class="photo-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="photo-stage__modalGrid">
                    <div class="photo-stage__modalImageContainer">
                      <img class="photo-stage__modalImage" src="${escapeHtml(assetBase + task.imageRelativeUrl)}" alt="${escapeHtml(task.title)}" />
                      <div class="photo-stage__modalImageGlow" style="--glow-color-rgb: ${hexToRgb(task.accent)}"></div>
                      <div class="photo-stage__labelsOverlay" data-role="labels-overlay">
                        ${renderChineseLabels(task.id, task.accent)}
                      </div>
                    </div>
                    <div class="photo-stage__modalDetails">
                      <div>
                        <span class="photo-stage__modalEyebrow" style="background: ${task.accent}1c; color: ${task.accent}">
                          光合与有机物制造 · 核心精讲
                        </span>
                        <h2 class="photo-stage__modalTitle">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="photo-stage__modalSummary">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="photo-stage__modalSectionTitle" style="color: ${task.accent}">💡 学习提示</h3>
                        <p class="photo-stage__modalPrompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="photo-stage__modalSectionTitle" style="color: ${task.accent}">📝 知识要点</h3>
                        <ul class="photo-stage__modalChecks" style="--check-color: ${task.accent}">
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

      function renderPanel() {
        if (!panelHost) return;

        const task = getActiveTask();
        const taskButtons = OBSERVATION_TASKS.map(taskItem => `
          <button class="p-task${taskItem.id === state.activeTask ? " is-active" : ""}"
                  type="button"
                  data-action="select-task"
                  data-value="${escapeHtml(taskItem.id)}"
                  style="--item-accent:${taskItem.accent}">
            <strong>${escapeHtml(taskItem.title)}</strong>
            <span>${escapeHtml(taskItem.label)}</span>
          </button>
        `).join("");
        const checks = task.checks.map(item => `<li>${escapeHtml(item)}</li>`).join("");
        const flowLines = PROCESS_FLOW.map(item => `
          <div class="p-flowLine"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>
        `).join("");
        const quizOptions = QUIZ.options.map(option => `
          <button class="p-quizOption${state.quizAnswer === option.id ? " is-selected" : ""}"
                  type="button"
                  data-action="answer-quiz"
                  data-value="${escapeHtml(option.id)}">
            ${escapeHtml(option.text)}
          </button>
        `).join("");
        const picked = QUIZ.options.find(option => option.id === state.quizAnswer);
        const feedbackClass = picked ? picked.correct ? " is-correct" : " is-wrong" : "";

        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--task-accent:${task.accent}; --task-accent-soft:${task.accent}26">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <h2 class="p-title">光合作用与有机物制造</h2>
              <p class="p-desc">左侧是叶片横切结构，用来定位光合作用主要发生的叶肉细胞和叶绿体；叶脉只作为水分运输背景。</p>
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
              <span class="p-eyebrow">教学卡片</span>
              <h2 class="p-title">${escapeHtml(task.title)}</h2>
              <p class="p-desc">${escapeHtml(task.prompt)}</p>
              <ul class="p-checkList">${checks}</ul>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">过程梳理</span>
              <div class="p-flow">${flowLines}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">快速判断</span>
              <div class="p-quiz">
                <div class="p-quizQuestion">${escapeHtml(QUIZ.question)}</div>
                ${quizOptions}
                <div class="p-feedback${feedbackClass}">${state.quizFeedback || "选择一个答案后，这里会给出即时反馈。"}</div>
              </div>
            </div>
          </div>
        `;
      }

      function updateStage() {
        const task = getActiveTask();
        const viewer = findViewer();
        const taskText = container.querySelector('[data-role="task-text"]');
        const taskLabel = container.querySelector('[data-role="task-label"]');
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        if (taskText) taskText.textContent = task.summary;
        if (taskLabel) taskLabel.textContent = task.title;
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
            const modalImage = modalOverlay.querySelector('.photo-stage__modalImage');
            const modalImageGlow = modalOverlay.querySelector('.photo-stage__modalImageGlow');
            const modalEyebrow = modalOverlay.querySelector('.photo-stage__modalEyebrow');
            const modalTitle = modalOverlay.querySelector('.photo-stage__modalTitle');
            const modalSummary = modalOverlay.querySelector('.photo-stage__modalSummary');
            const modalPrompt = modalOverlay.querySelector('.photo-stage__modalPrompt');
            const modalChecks = modalOverlay.querySelector('.photo-stage__modalChecks');
            const modalContent = modalOverlay.querySelector('.photo-stage__modalContent');
            const modalSecTitles = modalOverlay.querySelectorAll('.photo-stage__modalSectionTitle');
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
            if (modalSummary) modalSummary.textContent = task.summary;
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

      function resetCamera() {
        const viewer = findViewer();
        const task = getActiveTask();
        if (!viewer) return;
        viewer.setAttribute("camera-orbit", task.cameraOrbit);
        viewer.dismissPoster?.();
        viewer.jumpCameraToGoal?.();
      }

      function handlePanelClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") || "";

        if (action === "select-task") {
          state.activeTask = value;
          state.showModal = true;
          updateStage();
          renderPanel();
          return;
        }

        if (action === "toggle-auto-rotate") {
          state.autoRotate = !state.autoRotate;
          updateStage();
          renderPanel();
          return;
        }

        if (action === "reset-camera") {
          state.showModal = false;
          resetCamera();
          updateStage();
          renderPanel();
          return;
        }

        if (action === "answer-quiz") {
          const picked = QUIZ.options.find(option => option.id === value);
          state.quizAnswer = value;
          state.quizFeedback = picked && picked.correct
            ? "正确。光合作用以二氧化碳和水为主要原料，在光能驱动下制造有机物并释放氧气。"
            : "再看一次原料 and 产物：二氧化碳和水是主要原料，有机物和氧气是重要产物。";
          renderPanel();
        }
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

      function cleanupScene() {
        disposed = true;
        window.BiologyApp?.releaseBiologyModelViewers?.(container);
        container.removeEventListener("click", handleStageClick);
        if (panelHost) {
          panelHost.removeEventListener("click", handlePanelClick);
          panelHost.innerHTML = "";
        }
        const style = document.getElementById(`${sceneId}-style`);
        if (style) style.remove();
      }

      setScopedStyle();
      renderStage();
      renderPanel();
      updateStage();
      container.addEventListener("click", handleStageClick);
      if (panelHost) panelHost.addEventListener("click", handlePanelClick);
      container.__bioSceneCleanup = cleanupScene;

      loadModelViewer().then(() => {
        if (disposed) return;
        const viewer = findViewer();
        viewer?.dismissPoster?.();
        updateStage();
      });
      if (window.BiologyApp && typeof window.BiologyApp.enhanceBiologyModelViewerProgress === "function") {
        window.BiologyApp.enhanceBiologyModelViewerProgress(container);
      }
    },

    unmount: function unmount(container) {
      if (container && container.__bioSceneCleanup) {
        container.__bioSceneCleanup();
        delete container.__bioSceneCleanup;
      }
      if (container) {
        container.innerHTML = "";
      }
    }
  };
})();

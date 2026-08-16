window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7b_m03"] = (function () {

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
      id: "airway",
      title: "呼吸道路径",
      label: "空气进入身体的路线",
      accent: "#38bdf8",
      cameraOrbit: "-22deg 70deg 118%",
      summary: "空气依次经过鼻腔、咽、喉、气管和支气管，最终到达肺部深处的肺泡。",
      prompt: "观察模型中从上到下的连续管道结构：鼻腔与咽喉负责初步处理空气，气管和支气管把空气分配到左右肺。",
      checks: ["鼻腔能清洁、温暖、湿润空气", "气管和支气管内壁有黏液与纤毛", "呼吸道只负责通气，不是气体交换的主要场所"],
      imageRelativeUrl: "assets/images/airway.png?v=c6e1b1cc3cbc"
    },
    {
      id: "lungs",
      title: "左右肺结构",
      label: "肺叶与支气管分支",
      accent: "#f97316",
      cameraOrbit: "25deg 72deg 112%",
      summary: "左右肺位于胸腔内，支气管进入肺后不断分支，把气体送到更细小的结构。",
      prompt: "把左右肺看成由大量细小管道 and 肺泡共同组成的海绵状器官。分支越细，气体越接近真正交换的位置。",
      checks: ["肺不是一整块实心组织", "支气管在肺内反复分支", "肺泡数量巨大，显著增大气体交换面积"],
      imageRelativeUrl: "assets/images/lungs.png?v=8f7d3d269df9"
    },
    {
      id: "alveoli",
      title: "肺泡交换",
      label: "氧气与二氧化碳扩散",
      accent: "#22c55e",
      cameraOrbit: "42deg 66deg 104%",
      summary: "肺泡壁和毛细血管壁都很薄，氧气进入血液，二氧化碳进入肺泡后随呼气排出。",
      prompt: "关注肺泡与毛细血管的紧贴关系。气体交换依靠浓度差扩散完成，薄壁和丰富毛细血管让扩散距离更短。",
      checks: ["氧气方向：肺泡 -> 血液", "二氧化碳方向：血液 -> 肺泡", "肺泡外毛细血管丰富，有利于持续交换"],
      imageRelativeUrl: "assets/images/alveoli.png?v=58bb7fc89418"
    },
    {
      id: "diaphragm",
      title: "呼吸运动",
      label: "胸腔容积变化",
      accent: "#a78bfa",
      cameraOrbit: "0deg 58deg 132%",
      summary: "吸气时膈肌收缩下降，胸腔容积变大；呼气时膈肌舒张上升，胸腔容积变小。",
      prompt: "把模型与呼吸动画一起看：真正推动空气进出的不是肺主动拉气，而是胸腔容积变化造成肺内气压变化。",
      checks: ["吸气：膈肌收缩下降，肺内气压降低", "呼气：膈肌舒张上升，肺内气压升高", "肋间肌也参与胸廓扩大与缩小"],
      imageRelativeUrl: "assets/images/diaphragm.png?v=cda26d737df3"
    }
  ];

  const GAS_FLOW = [
    { label: "空气进入", value: "鼻腔 -> 咽 -> 喉 -> 气管 -> 支气管" },
    { label: "吸气变化", value: "胸腔容积增大，肺内气压低于外界" },
    { label: "肺泡交换", value: "O2 进入血液，CO2 进入肺泡" },
    { label: "呼气排出", value: "胸腔容积减小，气体被排出体外" }
  ];

  const QUIZ = {
    question: "氧气在肺泡处扩散的主要方向是？",
    options: [
      { id: "right-o2", text: "肺泡 -> 毛细血管血液", correct: true },
      { id: "wrong-co2", text: "毛细血管血液 -> 肺泡", correct: false },
      { id: "wrong-airway", text: "气管 -> 鼻腔", correct: false }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "respiratory-system-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );
      const modelSource = {
        desktop: `${assetBase}assets/models/respiratory-system.glb?v=f1df8be4bdb7`,
        tablet: `${assetBase}assets/models/respiratory-system.tablet.glb?v=3e7ac68bf9e1`,
        mobile: `${assetBase}assets/models/respiratory-system.mobile.glb?v=b71203523e51`
      };
      const resolveModelSource = source => {
        if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
          return window.BiologyApp.resolveBiologyModelVariantSource(source);
        }
        const fallback = isMobileModelTarget ? (source.mobile || source.tablet || source.desktop) : source.desktop;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(fallback) : fallback;
      };
      const setViewerSource = (viewer, source) => {
        if (!viewer) return "";
        if (window.BiologyApp && typeof window.BiologyApp.setBiologyModelViewerSource === "function") {
          return window.BiologyApp.setBiologyModelViewerSource(viewer, source);
        }
        const nextSrc = resolveModelSource(source);
        if (viewer.getAttribute("src") !== nextSrc) viewer.setAttribute("src", nextSrc);
        return nextSrc;
      };
      const modelSrc = resolveModelSource(modelSource);

      let disposed = false;

      const state = {
        activeTask: "airway",
        autoRotate: !isMobileModelTarget,
        playAnimation: !isMobileModelTarget,
        quizAnswer: "",
        quizFeedback: "",
        showModal: false
      };

      function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "56, 189, 248";
      }

      function renderChineseLabels(taskId, accent) {
        const labelsData = {
          airway: [
            { text: "鼻腔 (温暖、湿润、清洁空气)", top: "15%", left: "45%", pos: "top" },
            { text: "咽与喉 (气体和食物的共同通道)", top: "25%", left: "48%", pos: "right" },
            { text: "气管 (内壁有纤毛和黏液)", top: "42%", left: "47%", pos: "left" },
            { text: "支气管 (向左右肺分支)", top: "58%", left: "49%", pos: "right" }
          ],
          lungs: [
            { text: "右肺 (分三叶，气体交换主要场所)", top: "60%", left: "30%", pos: "right" },
            { text: "左肺 (分两叶，容纳心脏空间)", top: "60%", left: "70%", pos: "right" },
            { text: "树状支气管分支 (逐渐变细细分)", top: "48%", left: "52%", pos: "top" }
          ],
          alveoli: [
            { text: "肺泡壁 (仅由一层上皮细胞构成)", top: "45%", left: "35%", pos: "right" },
            { text: "毛细血管网 (紧贴肺泡外壁)", top: "62%", left: "65%", pos: "right" },
            { text: "氧气扩散 (肺泡 ➔ 血液，静脉血变动脉血)", top: "28%", left: "48%", pos: "top" },
            { text: "二氧化碳扩散 (血液 ➔ 肺泡，排出体外)", top: "72%", left: "50%", pos: "bottom" }
          ],
          diaphragm: [
            { text: "胸腔容积 (容积变大气压降，气体被动吸入)", top: "38%", left: "50%", pos: "top" },
            { text: "弹性肺 (胸腔变小肺回缩，气体被动呼出)", top: "52%", left: "42%", pos: "right" },
            { text: "膈肌运动 (收缩下降吸气，舒张上升呼气)", top: "78%", left: "50%", pos: "bottom" }
          ]
        };

        const list = labelsData[taskId] || [];
        return list.map((item, index) => `
          <div class="resp-stage__hotspot resp-stage__hotspot--${item.pos}" 
               style="top: ${item.top}; left: ${item.left}; --accent-color: ${accent}; --delay: ${index * 0.15}s">
            <div class="resp-stage__hotspot-dot"></div>
            <div class="resp-stage__hotspot-line"></div>
            <div class="resp-stage__hotspot-badge">${escapeHtml(item.text)}</div>
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

          [data-scope="${sceneId}"] .resp-stage {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            display: grid;
            padding: 18px;
            background:
              radial-gradient(circle at 50% 42%, rgba(34, 197, 94, 0.16), transparent 36%),
              radial-gradient(circle at 18% 18%, rgba(56, 189, 248, 0.13), transparent 32%),
              radial-gradient(circle at 82% 26%, rgba(249, 115, 22, 0.12), transparent 30%),
              linear-gradient(145deg, #020617 0%, #07131f 52%, #101012 100%);
          }

          [data-scope="${sceneId}"] .resp-stage__frame {
            position: relative;
            min-width: 0;
            min-height: 0;
            border-radius: 26px;
            overflow: hidden;
            border: 1px solid rgba(248, 250, 252, 0.1);
            background:
              linear-gradient(rgba(255, 255, 255, 0.024) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.024) 1px, transparent 1px),
              radial-gradient(circle at center, rgba(15, 23, 42, 0.28), rgba(2, 6, 23, 0.94));
            background-size: 34px 34px, 34px 34px, auto;
            box-shadow: inset 0 0 90px rgba(15, 23, 42, 0.78), 0 24px 60px rgba(0, 0, 0, 0.34);
          }

          [data-scope="${sceneId}"] .resp-stage__modelViewer {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
            background: transparent;
            --poster-color: transparent;
          }

          [data-scope="${sceneId}"] .resp-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: rgba(226, 232, 240, 0.78);
            font-size: 14px;
            background: rgba(2, 6, 23, 0.66);
          }

          [data-scope="${sceneId}"] .resp-stage__hud {
            position: absolute;
            inset: 18px 18px auto 18px;
            z-index: 8;
            display: flex;
            align-items: flex-start;
            justify-content: flex-end;
            gap: 12px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .resp-stage__taskText {
            max-width: 520px;
            color: rgba(226, 232, 240, 0.84);
            font-size: 13px;
            line-height: 1.55;
            text-shadow: 0 4px 18px rgba(0, 0, 0, 0.42);
          }

          [data-scope="${sceneId}"] .resp-stage__modeBadge {
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

          [data-scope="${sceneId}"] .resp-stage__modeLabel {
            color: rgba(226, 232, 240, 0.68);
            font-size: 11px;
            font-weight: 800;
          }

          [data-scope="${sceneId}"] .resp-stage__modeValue {
            color: var(--task-accent, #38bdf8);
            font-size: 16px;
            line-height: 1.2;
            font-weight: 950;
          }

          [data-scope="${sceneId}"] .resp-stage__bottom {
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

          [data-scope="${sceneId}"] .resp-stage__legend {
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          [data-scope="${sceneId}"] .resp-stage__legendItem {
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

          [data-scope="${sceneId}"] .resp-stage__dot {
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
            color: var(--task-accent, #38bdf8);
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
            background: var(--task-accent, #38bdf8);
            box-shadow: 0 0 12px var(--task-accent, #38bdf8);
          }

          .panel-${sceneId} .p-actionRow {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
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
            border-color: var(--task-accent, #38bdf8);
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
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
            border-color: var(--task-accent, #38bdf8);
            color: #fff;
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
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
            [data-scope="${sceneId}"] .resp-stage {
              padding: 8px;
            }

            [data-scope="${sceneId}"] .resp-stage__hud {
              inset: 10px 10px auto 10px;
              align-items: flex-end;
              flex-direction: column;
            }

            [data-scope="${sceneId}"] .resp-stage__modeBadge {
              width: max-content;
              max-width: 100%;
              min-width: 0;
            }

            [data-scope="${sceneId}"] .resp-stage__taskText {
              display: none;
            }

            [data-scope="${sceneId}"] .resp-stage__bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
            }
          }

          /* Fully-Enlarged Widescreen Modal Overlay and Responsive Chinese Labels System */
          [data-scope="${sceneId}"] .resp-stage__modalOverlay {
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

          [data-scope="${sceneId}"] .resp-stage__modalOverlay.is-open {
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
          }

          [data-scope="${sceneId}"] .resp-stage__modalContent {
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

          [data-scope="${sceneId}"] .resp-stage__modalOverlay.is-open .resp-stage__modalContent {
            transform: scale(1) translateY(0);
          }

          [data-scope="${sceneId}"] .resp-stage__modalClose {
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

          [data-scope="${sceneId}"] .resp-stage__modalClose:hover {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
            transform: rotate(90deg) scale(1.05);
          }

          [data-scope="${sceneId}"] .resp-stage__modalGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            height: 100%;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .resp-stage__modalImageContainer {
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

          [data-scope="${sceneId}"] .resp-stage__modalImage {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
            transition: transform 0.5s ease;
          }

          [data-scope="${sceneId}"] .resp-stage__modalImageContainer:hover .resp-stage__modalImage {
            transform: scale(1.02);
          }

          [data-scope="${sceneId}"] .resp-stage__modalImageGlow {
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 45px rgba(var(--glow-color-rgb), 0.25);
            pointer-events: none;
            border-radius: 22px;
          }

          [data-scope="${sceneId}"] .resp-stage__labelsOverlay {
            position: absolute;
            inset: 0;
            pointer-events: auto;
            z-index: 10;
          }

          [data-scope="${sceneId}"] .resp-stage__hotspot {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -50%);
            animation: respHotspotFadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            animation-delay: var(--delay, 0s);
          }

          @keyframes respHotspotFadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }

          [data-scope="${sceneId}"] .resp-stage__hotspot-dot {
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

          [data-scope="${sceneId}"] .resp-stage__hotspot-dot::after {
            content: "";
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 1px dashed var(--accent-color, #10b981);
            opacity: 0.7;
            animation: respHotspotPulse 2s infinite linear;
          }

          @keyframes respHotspotPulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          [data-scope="${sceneId}"] .resp-stage__hotspot:hover .resp-stage__hotspot-dot {
            transform: scale(1.3);
            background: #fff;
            border-color: var(--accent-color, #10b981);
            box-shadow: 0 0 24px var(--accent-color, #10b981);
          }

          [data-scope="${sceneId}"] .resp-stage__hotspot-badge {
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

          [data-scope="${sceneId}"] .resp-stage__hotspot--left .resp-stage__hotspot-badge {
            right: 20px;
            left: auto;
          }

          [data-scope="${sceneId}"] .resp-stage__hotspot--right .resp-stage__hotspot-badge {
            left: 20px;
          }

          [data-scope="${sceneId}"] .resp-stage__hotspot--top .resp-stage__hotspot-badge {
            bottom: 20px;
          }

          [data-scope="${sceneId}"] .resp-stage__hotspot--bottom .resp-stage__hotspot-badge {
            top: 20px;
          }

          [data-scope="${sceneId}"] .resp-stage__hotspot:hover .resp-stage__hotspot-badge {
            background: var(--accent-color, #10b981);
            color: #030712;
            transform: scale(1.06);
          }

          [data-scope="${sceneId}"] .resp-stage__modalDetails {
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: left;
            height: 100%;
            overflow-y: auto;
            padding-right: 16px;
          }

          [data-scope="${sceneId}"] .resp-stage__modalDetails::-webkit-scrollbar {
            width: 6px;
          }
          [data-scope="${sceneId}"] .resp-stage__modalDetails::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 3px;
          }
          [data-scope="${sceneId}"] .resp-stage__modalDetails::-webkit-scrollbar-thumb {
            background: rgba(34, 197, 94, 0.3);
            border-radius: 3px;
          }
          [data-scope="${sceneId}"] .resp-stage__modalDetails::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 197, 94, 0.5);
          }

          [data-scope="${sceneId}"] .resp-stage__modalEyebrow {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.08em;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          [data-scope="${sceneId}"] .resp-stage__modalTitle {
            margin: 0;
            font-size: 26px;
            font-weight: 950;
            color: #fff;
            letter-spacing: -0.01em;
          }

          [data-scope="${sceneId}"] .resp-stage__modalSummary {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: rgba(226, 232, 240, 0.85);
          }

          [data-scope="${sceneId}"] .resp-stage__modalSectionTitle {
            margin: 0 0 6px 0;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.06em;
          }

          [data-scope="${sceneId}"] .resp-stage__modalPrompt {
            margin: 0;
            font-size: 13px;
            line-height: 1.55;
            color: rgba(226, 232, 240, 0.72);
            background: rgba(255, 255, 255, 0.02);
            border-left: 3px solid var(--task-accent, #38bdf8);
            padding: 10px 12px;
            border-radius: 4px 10px 10px 4px;
          }

          [data-scope="${sceneId}"] .resp-stage__modalChecks {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 10px;
          }

          [data-scope="${sceneId}"] .resp-stage__modalChecks li {
            font-size: 13px;
            line-height: 1.5;
            color: rgba(226, 232, 240, 0.8);
            display: flex;
            gap: 10px;
            align-items: flex-start;
          }

          [data-scope="${sceneId}"] .resp-stage__modalChecks li::before {
            content: "✓";
            color: var(--check-color, #10b981);
            font-weight: 900;
            flex: none;
          }

          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .resp-stage__modalContent {
              padding: 24px;
              height: 90vh;
              overflow-y: auto;
            }

            [data-scope="${sceneId}"] .resp-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 24px;
              height: auto;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .resp-stage__modalImageContainer {
              max-width: 320px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .resp-stage__modalDetails {
              height: auto;
              overflow-y: visible;
              padding-right: 0;
            }
          }

          /* Unified mobile/tablet layout for observation-task image popups. */
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .resp-stage__modalOverlay {
              align-items: center;
              justify-content: center;
              padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .resp-stage__modalContent {
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

            [data-scope="${sceneId}"] .resp-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .resp-stage__modalClose {
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

            [data-scope="${sceneId}"] .resp-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: start;
              height: auto;
              min-height: 0;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .resp-stage__modalImageContainer {
              width: min(100%, 320px);
              max-width: 320px;
              height: auto;
              max-height: none;
              aspect-ratio: 1 / 1;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .resp-stage__modalImage {
              width: 100%;
              height: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .resp-stage__modalDetails {
              height: auto;
              min-height: 0;
              max-height: none;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .resp-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
              overflow-wrap: anywhere;
            }

            [data-scope="${sceneId}"] .resp-stage__modalSummary,
            [data-scope="${sceneId}"] .resp-stage__modalPrompt,
            [data-scope="${sceneId}"] .resp-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.5;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .resp-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .resp-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .resp-stage__modalImageContainer {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .resp-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .resp-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .resp-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .resp-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .resp-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .resp-stage__modalImageContainer {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .resp-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .resp-stage__modalDetails::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .resp-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .resp-stage__modalSummary,
            [data-scope="${sceneId}"] .resp-stage__modalPrompt,
            [data-scope="${sceneId}"] .resp-stage__modalChecks li {
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
          <div class="resp-stage">
            <div class="resp-stage__frame" data-role="frame">
              <model-viewer
                class="resp-stage__modelViewer"
                data-role="model-viewer"
                src="${escapeHtml(modelSrc)}"
                camera-controls
                interaction-prompt="none"
                animation-name="Take 001"
                shadow-intensity="${isMobileModelTarget ? "0.35" : "0.85"}"
                exposure="${isMobileModelTarget ? "0.88" : "0.95"}"
                auto-rotate-delay="0"
                rotation-per-second="${isMobileModelTarget ? "10deg" : "18deg"}"
                environment-image="neutral"
                loading="eager"
                field-of-view="42deg"
                min-field-of-view="12deg"
                max-field-of-view="82deg"
                camera-orbit="${escapeHtml(task.cameraOrbit)}"
                alt="呼吸系统 3D 模型">
                <div class="resp-stage__poster" slot="poster">模型加载中...</div>
              </model-viewer>
              <div class="resp-stage__hud">
                <div class="resp-stage__modeBadge">
                  <div class="resp-stage__modeLabel">当前观察任务</div>
                  <div class="resp-stage__modeValue" data-role="task-label">${escapeHtml(task.title)}</div>
                </div>
              </div>
              <div class="resp-stage__bottom">
                <div class="resp-stage__legend" aria-label="气体交换图例">
                  <div class="resp-stage__legendItem"><span class="resp-stage__dot" style="--dot-color:#ef4444"></span>氧气进入血液</div>
                  <div class="resp-stage__legendItem"><span class="resp-stage__dot" style="--dot-color:#38bdf8"></span>二氧化碳进入肺泡</div>
                  <div class="resp-stage__legendItem"><span class="resp-stage__dot" style="--dot-color:#22c55e"></span>肺泡扩大交换面积</div>
                </div>
              </div>

              <!-- Interactive Pedagogical Modal Overlay -->
              <div class="resp-stage__modalOverlay${state.showModal ? " is-open" : ""}" data-role="modal-overlay">
                <div class="resp-stage__modalContent">
                  <button class="resp-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="resp-stage__modalGrid">
                    <div class="resp-stage__modalImageContainer">
                      <img class="resp-stage__modalImage" src="${escapeHtml(assetBase + task.imageRelativeUrl)}" alt="${escapeHtml(task.title)}" />
                      <div class="resp-stage__modalImageGlow" style="--glow-color-rgb: ${hexToRgb(task.accent)}"></div>
                      <div class="resp-stage__labelsOverlay" data-role="labels-overlay">
                        ${renderChineseLabels(task.id, task.accent)}
                      </div>
                    </div>
                    <div class="resp-stage__modalDetails">
                      <div>
                        <span class="resp-stage__modalEyebrow" style="background: ${task.accent}1c; color: ${task.accent}">
                          呼吸与气体交换 · 核心精讲
                        </span>
                        <h2 class="resp-stage__modalTitle">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="resp-stage__modalSummary">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="resp-stage__modalSectionTitle" style="color: ${task.accent}">💡 学习提示</h3>
                        <p class="resp-stage__modalPrompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="resp-stage__modalSectionTitle" style="color: ${task.accent}">📝 知识要点</h3>
                        <ul class="resp-stage__modalChecks" style="--check-color: ${task.accent}">
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
        const flowLines = GAS_FLOW.map(item => `
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
              <h2 class="p-title">呼吸系统与气体交换</h2>
              <p class="p-desc">左侧使用统一 3D 模型查看器。拖拽旋转、滚轮缩放；点击观察任务会自动切换到适合讲解的视角。</p>
              <div class="p-actionRow">
                <button class="p-action${state.playAnimation ? " is-active" : ""}" type="button" data-action="toggle-animation">呼吸动画</button>
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
          setViewerSource(viewer, modelSource);
          if (state.autoRotate) viewer.setAttribute("auto-rotate", "");
          else viewer.removeAttribute("auto-rotate");
          viewer.setAttribute("animation-name", "Take 001");
          if (state.playAnimation) {
            viewer.setAttribute("autoplay", "");
            viewer.play?.({ repetitions: Infinity });
          } else {
            viewer.removeAttribute("autoplay");
            viewer.pause?.();
          }
        }

        const modalOverlay = container.querySelector('[data-role="modal-overlay"]');
        if (modalOverlay) {
          if (state.showModal) {
            const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
            const modalImage = modalOverlay.querySelector('.resp-stage__modalImage');
            const modalImageGlow = modalOverlay.querySelector('.resp-stage__modalImageGlow');
            const modalEyebrow = modalOverlay.querySelector('.resp-stage__modalEyebrow');
            const modalTitle = modalOverlay.querySelector('.resp-stage__modalTitle');
            const modalSummary = modalOverlay.querySelector('.resp-stage__modalSummary');
            const modalPrompt = modalOverlay.querySelector('.resp-stage__modalPrompt');
            const modalChecks = modalOverlay.querySelector('.resp-stage__modalChecks');
            const modalContent = modalOverlay.querySelector('.resp-stage__modalContent');
            const modalSecTitles = modalOverlay.querySelectorAll('.resp-stage__modalSectionTitle');
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

        if (action === "toggle-animation") {
          state.playAnimation = !state.playAnimation;
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
            ? "正确。氧气从肺泡内扩散进入毛细血管血液，随后由血液运输到全身组织。"
            : "再看一次方向：二氧化碳是从血液进入肺泡，而氧气是从肺泡进入血液。";
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

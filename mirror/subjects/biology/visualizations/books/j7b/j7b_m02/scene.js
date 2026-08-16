window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7b_m02"] = (function () {
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

  const VIEW_MODES = [
    {
      id: "overview",
      label: "整体观察",
      accent: "#38bdf8",
      cameraOrbit: "0deg 72deg 118%",
      fieldOfView: "28deg",
      summary: "先建立整体路线：食物依次经过口腔、食道、胃、小肠和大肠；肝脏、胰腺等消化腺向消化道提供消化液。"
    },
    {
      id: "upper",
      label: "胃肝胰区",
      accent: "#f59e0b",
      cameraOrbit: "-28deg 68deg 102%",
      fieldOfView: "24deg",
      summary: "重点观察胃、肝脏和胰腺的位置关系：胃暂时储存并初步消化蛋白质，肝脏分泌胆汁，胰腺分泌胰液。"
    },
    {
      id: "intestine",
      label: "小肠吸收",
      accent: "#22c55e",
      cameraOrbit: "32deg 70deg 108%",
      fieldOfView: "25deg",
      summary: "小肠是消化和吸收的主要场所，胆汁、胰液和肠液在这里共同作用，绒毛结构显著增加吸收面积。"
    },
    {
      id: "lower",
      label: "大肠回收",
      accent: "#fb7185",
      cameraOrbit: "145deg 74deg 116%",
      fieldOfView: "27deg",
      summary: "大肠主要吸收水分、无机盐和部分维生素，未被消化吸收的残渣最终形成粪便排出体外。"
    }
  ];

  const TASKS = [
    {
      id: "system",
      title: "消化系统由两部分组成",
      label: "系统总览",
      accent: "#38bdf8",
      imageRelativeUrl: "assets/images/digestive-overview-square.png?v=dbada741d5a3",
      summary: "人体消化系统由消化道和消化腺组成。消化道负责运输、混合、消化和吸收，消化腺负责分泌消化液。",
      prompt: "讲解时先让学生沿着食物路线找结构，再补充肝脏、胰腺、唾液腺等消化腺的作用。",
      checks: ["消化道包括口腔、咽、食道、胃、小肠、大肠和肛门", "消化腺分泌的消化液进入消化道发挥作用", "小肠是消化和吸收的主要器官"]
    },
    {
      id: "amylase",
      title: "唾液淀粉酶的条件",
      label: "实验探究",
      accent: "#f59e0b",
      imageRelativeUrl: "assets/images/amylase-experiment-square.png?v=48541e8ddb89",
      summary: "唾液中的淀粉酶能把淀粉初步分解为麦芽糖。碘液遇淀粉变蓝，可用来验证淀粉是否被分解。",
      prompt: "对照实验要控制变量：两支试管都加入淀粉糊，实验组加唾液，对照组加清水，并放在接近体温的环境中。",
      checks: ["37 摄氏度左右更接近唾液淀粉酶的适宜温度", "实验组不变蓝，说明淀粉已被分解", "对照组变蓝，说明清水不能分解淀粉"]
    },
    {
      id: "villi",
      title: "小肠绒毛提高吸收效率",
      label: "吸收结构",
      accent: "#22c55e",
      imageRelativeUrl: "assets/images/villi-absorption-square.png?v=7f3f6bf7ca38",
      summary: "小肠内表面有环形皱襞和大量小肠绒毛，能显著增大吸收面积。绒毛内的毛细血管和毛细淋巴管分别吸收不同营养物质。",
      prompt: "让学生比较两类通道：葡萄糖、氨基酸等主要进入毛细血管，脂肪成分主要进入毛细淋巴管。",
      checks: ["小肠绒毛使内表面积大幅增加", "毛细血管吸收葡萄糖和氨基酸", "毛细淋巴管吸收脂肪成分"]
    },
    {
      id: "transport",
      title: "营养物质进入运输系统",
      label: "去向梳理",
      accent: "#fb7185",
      imageRelativeUrl: "assets/images/nutrient-transport-square.png?v=9453276e03a8",
      summary: "被吸收的营养物质进入血液或淋巴，再被运送到全身细胞，用于供能、合成身体物质或储存。",
      prompt: "把“消化”与“吸收”分开讲：消化是把大分子分解成小分子，吸收是小分子穿过小肠壁进入体内运输系统。",
      checks: ["消化发生在消化道内", "吸收后营养物质进入血液或淋巴", "营养物质最终服务于全身细胞的生命活动"]
    }
  ];

  const FLOW_STEPS = [
    { label: "口腔", text: "牙齿咀嚼、舌搅拌，唾液淀粉酶开始分解淀粉。" },
    { label: "胃", text: "胃液中的胃蛋白酶初步消化蛋白质，胃壁肌肉把食物磨成食糜。" },
    { label: "小肠", text: "胆汁、胰液和肠液共同作用，完成主要消化并吸收大部分营养。" },
    { label: "大肠", text: "吸收剩余水分和无机盐，未消化残渣形成粪便。" }
  ];

  const QUIZ = {
    question: "下列哪一项最能说明小肠适合吸收营养物质？",
    options: [
      { id: "right", text: "内表面有皱襞和大量小肠绒毛", correct: true },
      { id: "wrong-acid", text: "能分泌强酸杀灭食物中的细菌", correct: false },
      { id: "wrong-water", text: "主要负责回收食物残渣中的水分", correct: false }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "digestive-stage-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );

      const modelSource = {
        desktop: "assets/models/digestive-system.glb?v=f43ff3d51b76",
        tablet: "assets/models/digestive-system.tablet.glb?v=4462d8df7ffa",
        mobile: "assets/models/digestive-system.mobile.glb?v=51dad1070230"
      };

      let disposed = false;
      const state = {
        activeView: "overview",
        activeTask: "system",
        autoRotate: !isMobileModelTarget,
        quizAnswer: "",
        quizFeedback: "",
        modalOpen: false
      };

      function resolveAssetUrl(relativeUrl) {
        const rawUrl = `${assetBase}${relativeUrl}`;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(rawUrl) : rawUrl;
      }

      function resolveModelSource(source) {
        const withBase = {};
        Object.keys(source).forEach(key => {
          withBase[key] = `${assetBase}${source[key]}`;
        });
        if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
          return window.BiologyApp.resolveBiologyModelVariantSource(withBase);
        }
        const fallback = isMobileModelTarget ? (withBase.mobile || withBase.tablet || withBase.desktop) : withBase.desktop;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(fallback) : fallback;
      }

      function setViewerSource(viewer) {
        if (!viewer) return "";
        const withBase = {};
        Object.keys(modelSource).forEach(key => {
          withBase[key] = `${assetBase}${modelSource[key]}`;
        });
        if (window.BiologyApp && typeof window.BiologyApp.setBiologyModelViewerSource === "function") {
          return window.BiologyApp.setBiologyModelViewerSource(viewer, withBase);
        }
        const nextSrc = resolveModelSource(modelSource);
        if (viewer.getAttribute("src") !== nextSrc) viewer.setAttribute("src", nextSrc);
        return nextSrc;
      }

      function getActiveView() {
        return VIEW_MODES.find(view => view.id === state.activeView) || VIEW_MODES[0];
      }

      function getActiveTask() {
        return TASKS.find(task => task.id === state.activeTask) || TASKS[0];
      }

      function findViewer() {
        return container.querySelector("model-viewer");
      }

      function renderChecks(task) {
        return (task.checks || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
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
            background: #07130f;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }
          [data-scope="${sceneId}"] * { box-sizing: border-box; }
          [data-scope="${sceneId}"] .digestive-stage {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            padding: 12px;
            overflow: hidden;
          }
          [data-scope="${sceneId}"] .digestive-stage__frame {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            border-radius: 22px;
            border: 1px solid rgba(45, 212, 191, 0.22);
            background:
              radial-gradient(circle at 18% 18%, rgba(56, 189, 248, 0.17), transparent 32%),
              radial-gradient(circle at 78% 72%, rgba(251, 113, 133, 0.15), transparent 34%),
              linear-gradient(135deg, rgba(6, 24, 23, 0.98), rgba(18, 20, 12, 0.98));
            box-shadow: inset 0 0 90px rgba(20, 184, 166, 0.08), 0 24px 70px rgba(0, 0, 0, 0.42);
          }
          [data-scope="${sceneId}"] .digestive-stage__grid {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            opacity: 0.16;
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
            background-size: 42px 42px;
            mask-image: radial-gradient(circle at center, #000 32%, transparent 78%);
          }
          [data-scope="${sceneId}"] .digestive-stage__viewerWrap {
            position: absolute;
            inset: 0;
            z-index: 2;
          }
          [data-scope="${sceneId}"] .digestive-stage__viewer {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            --poster-color: transparent;
          }
          [data-scope="${sceneId}"] .digestive-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: rgba(236, 253, 245, 0.78);
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0;
          }
          [data-scope="${sceneId}"] .digestive-stage__ambient {
            position: absolute;
            inset: 10%;
            z-index: 1;
            pointer-events: none;
            border-radius: 999px;
            background:
              radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.16), transparent 34%),
              radial-gradient(circle at 42% 62%, rgba(34, 197, 94, 0.13), transparent 42%);
            filter: blur(14px);
            opacity: 0.8;
          }
          [data-scope="${sceneId}"] .digestive-stage__hint {
            position: absolute;
            left: 14px;
            bottom: 14px;
            z-index: 4;
            max-width: min(340px, calc(100% - 28px));
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            pointer-events: none;
          }
          [data-scope="${sceneId}"] .digestive-stage__chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 28px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(2, 6, 23, 0.58);
            padding: 6px 10px;
            color: rgba(248, 250, 252, 0.82);
            font-size: 12px;
            font-weight: 800;
            line-height: 1.2;
            backdrop-filter: blur(12px);
          }
          [data-scope="${sceneId}"] .digestive-stage__chipDot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: var(--chip-color);
            box-shadow: 0 0 10px var(--chip-color);
          }
          [data-scope="${sceneId}"] .digestive-modal {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 36px;
            background: rgba(3, 7, 18, 0.68);
            backdrop-filter: blur(18px) saturate(145%);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 0.22s ease, visibility 0s linear 0.22s;
            overscroll-behavior: contain;
          }
          [data-scope="${sceneId}"] .digestive-modal.is-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transition: opacity 0.22s ease, visibility 0s linear 0s;
          }
          [data-scope="${sceneId}"] .digestive-modal__content {
            position: relative;
            width: min(1080px, 100%);
            max-height: min(760px, calc(100dvh - 72px));
            display: grid;
            grid-template-columns: minmax(340px, 0.92fr) minmax(320px, 1fr);
            gap: 22px;
            overflow: hidden;
            border: 1px solid rgba(148, 163, 184, 0.24);
            border-radius: 8px;
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(8, 28, 24, 0.97)),
              radial-gradient(circle at 18% 16%, rgba(56, 189, 248, 0.2), transparent 30%);
            padding: 22px;
            box-shadow: 0 30px 90px rgba(0, 0, 0, 0.54);
          }
          [data-scope="${sceneId}"] .digestive-modal__close {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 5;
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.86);
            color: #f8fafc;
            cursor: pointer;
            transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          }
          [data-scope="${sceneId}"] .digestive-modal__close:hover {
            transform: scale(1.04);
            border-color: rgba(248, 250, 252, 0.52);
            background: rgba(30, 41, 59, 0.95);
          }
          [data-scope="${sceneId}"] .digestive-modal__close svg {
            width: 20px;
            height: 20px;
          }
          [data-scope="${sceneId}"] .digestive-modal__imageBox {
            position: relative;
            min-height: 0;
            aspect-ratio: 1 / 1;
            overflow: hidden;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.42);
          }
          [data-scope="${sceneId}"] .digestive-modal__image {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }
          [data-scope="${sceneId}"] .digestive-modal__details {
            min-width: 0;
            min-height: 0;
            overflow: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 2px 48px 2px 0;
          }
          [data-scope="${sceneId}"] .digestive-modal__details::-webkit-scrollbar {
            display: none;
          }
          [data-scope="${sceneId}"] .digestive-modal__eyebrow {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            border-radius: 999px;
            padding: 6px 10px;
            background: color-mix(in srgb, var(--accent-color) 18%, transparent);
            color: var(--accent-color);
            font-size: 12px;
            font-weight: 900;
            line-height: 1.2;
          }
          [data-scope="${sceneId}"] .digestive-modal__title {
            margin: 14px 0 10px;
            color: #fff;
            font-size: clamp(23px, 3vw, 34px);
            line-height: 1.15;
            letter-spacing: 0;
          }
          [data-scope="${sceneId}"] .digestive-modal__summary,
          [data-scope="${sceneId}"] .digestive-modal__prompt {
            margin: 0;
            color: rgba(226, 232, 240, 0.86);
            font-size: 15px;
            line-height: 1.8;
          }
          [data-scope="${sceneId}"] .digestive-modal__sectionTitle {
            margin: 18px 0 8px;
            color: var(--accent-color);
            font-size: 14px;
            font-weight: 900;
          }
          [data-scope="${sceneId}"] .digestive-modal__checks {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          [data-scope="${sceneId}"] .digestive-modal__checks li {
            position: relative;
            min-height: 34px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.06);
            padding: 8px 10px 8px 28px;
            color: rgba(248, 250, 252, 0.9);
            font-size: 14px;
            line-height: 1.6;
          }
          [data-scope="${sceneId}"] .digestive-modal__checks li::before {
            content: "";
            position: absolute;
            left: 11px;
            top: 18px;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--accent-color);
            box-shadow: 0 0 12px var(--accent-color);
          }
          .digest-panel-${sceneId} {
            width: 100%;
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            color: #f8fafc;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }
          .digest-panel-${sceneId}::-webkit-scrollbar {
            display: none;
          }
          .digest-panel-${sceneId} .p-card {
            border-radius: 8px;
            border: 1px solid rgba(148, 163, 184, 0.14);
            background: rgba(15, 23, 42, 0.46);
            padding: 16px;
            box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
          }
          .digest-panel-${sceneId} .p-head {
            display: grid;
            gap: 8px;
          }
          .digest-panel-${sceneId} .p-eyebrow {
            color: #67e8f9;
            font-size: 12px;
            font-weight: 900;
            line-height: 1.3;
          }
          .digest-panel-${sceneId} .p-title {
            margin: 0;
            color: #fff;
            font-size: 22px;
            line-height: 1.18;
            letter-spacing: 0;
          }
          .digest-panel-${sceneId} .p-desc {
            margin: 0;
            color: rgba(226, 232, 240, 0.76);
            font-size: 13px;
            line-height: 1.7;
          }
          .digest-panel-${sceneId} .p-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
          }
          .digest-panel-${sceneId} .p-button {
            min-height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 10px;
            background: rgba(2, 6, 23, 0.35);
            color: rgba(248, 250, 252, 0.86);
            padding: 8px 11px;
            font-size: 13px;
            font-weight: 900;
            line-height: 1.2;
            cursor: pointer;
            transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
          }
          .digest-panel-${sceneId} .p-button:hover {
            transform: translateY(-1px);
            border-color: rgba(103, 232, 249, 0.48);
            background: rgba(8, 47, 73, 0.32);
          }
          .digest-panel-${sceneId} .p-button.is-active {
            color: #fff;
            border-color: var(--accent-color);
            background: color-mix(in srgb, var(--accent-color) 22%, rgba(2, 6, 23, 0.48));
            box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-color) 18%, transparent);
          }
          .digest-panel-${sceneId} .p-buttonDot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: var(--accent-color, #38bdf8);
            box-shadow: 0 0 10px var(--accent-color, #38bdf8);
          }
          .digest-panel-${sceneId} .p-button--wide {
            width: 100%;
            justify-content: flex-start;
            text-align: left;
          }
          .digest-panel-${sceneId} .p-viewSummary {
            margin-top: 12px;
            border-left: 3px solid var(--accent-color);
            border-radius: 8px;
            background: rgba(2, 6, 23, 0.34);
            padding: 12px;
            color: rgba(226, 232, 240, 0.86);
            font-size: 13px;
            line-height: 1.7;
          }
          .digest-panel-${sceneId} .p-flow {
            display: grid;
            gap: 8px;
            margin-top: 12px;
          }
          .digest-panel-${sceneId} .p-flowItem {
            display: grid;
            grid-template-columns: 56px 1fr;
            gap: 10px;
            align-items: start;
            min-height: 42px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
            padding: 10px;
          }
          .digest-panel-${sceneId} .p-flowLabel {
            color: #fde68a;
            font-size: 13px;
            font-weight: 900;
            line-height: 1.4;
          }
          .digest-panel-${sceneId} .p-flowText {
            color: rgba(226, 232, 240, 0.8);
            font-size: 13px;
            line-height: 1.55;
          }
          .digest-panel-${sceneId} .p-quiz {
            display: grid;
            gap: 8px;
            margin-top: 12px;
          }
          .digest-panel-${sceneId} .p-quizQuestion {
            margin: 0;
            color: rgba(248, 250, 252, 0.9);
            font-size: 13px;
            font-weight: 900;
            line-height: 1.5;
          }
          .digest-panel-${sceneId} .p-quizOption {
            min-height: 38px;
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 8px;
            background: rgba(2, 6, 23, 0.34);
            color: rgba(226, 232, 240, 0.84);
            padding: 8px 10px;
            text-align: left;
            font-size: 13px;
            line-height: 1.45;
            cursor: pointer;
          }
          .digest-panel-${sceneId} .p-quizOption.is-selected {
            border-color: #34d399;
            background: rgba(16, 185, 129, 0.14);
            color: #ecfdf5;
          }
          .digest-panel-${sceneId} .p-feedback {
            min-height: 28px;
            color: #bbf7d0;
            font-size: 13px;
            line-height: 1.6;
          }
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .digestive-stage {
              padding: 8px;
            }
            [data-scope="${sceneId}"] .digestive-stage__frame {
              border-radius: 18px;
            }
            [data-scope="${sceneId}"] .digestive-stage__hint {
              left: 10px;
              right: 10px;
              bottom: 10px;
              max-width: none;
              gap: 6px;
            }
            [data-scope="${sceneId}"] .digestive-stage__chip {
              min-height: 26px;
              padding: 5px 8px;
              font-size: 11px;
            }
            [data-scope="${sceneId}"] .digestive-modal {
              align-items: stretch;
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }
            [data-scope="${sceneId}"] .digestive-modal__content {
              width: 100%;
              max-height: none;
              height: 100%;
              grid-template-columns: 1fr;
              grid-template-rows: minmax(220px, 42dvh) minmax(0, 1fr);
              gap: 14px;
              padding: 14px;
              overflow: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            [data-scope="${sceneId}"] .digestive-modal__content::-webkit-scrollbar {
              display: none;
            }
            [data-scope="${sceneId}"] .digestive-modal__imageBox {
              width: min(100%, 52dvh);
              max-width: 100%;
              justify-self: center;
              align-self: start;
            }
            [data-scope="${sceneId}"] .digestive-modal__details {
              padding: 0;
              overflow: visible;
            }
            [data-scope="${sceneId}"] .digestive-modal__title {
              font-size: 24px;
            }
            [data-scope="${sceneId}"] .digestive-modal__summary,
            [data-scope="${sceneId}"] .digestive-modal__prompt,
            [data-scope="${sceneId}"] .digestive-modal__checks li {
              font-size: 13px;
            }
          }
          @media (max-width: 520px) {
            [data-scope="${sceneId}"] .digestive-modal__content {
              grid-template-rows: minmax(180px, 34dvh) minmax(0, 1fr);
              padding: 12px;
            }
            [data-scope="${sceneId}"] .digestive-modal__close {
              top: 10px;
              right: 10px;
            }
            .digest-panel-${sceneId} .p-card {
              padding: 14px;
            }
            .digest-panel-${sceneId} .p-title {
              font-size: 20px;
            }
            .digest-panel-${sceneId} .p-button {
              flex: 1 1 calc(50% - 8px);
              min-width: 0;
              padding: 8px;
              font-size: 12px;
            }
            .digest-panel-${sceneId} .p-button--wide {
              flex-basis: 100%;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const activeView = getActiveView();
        const modelSrc = resolveModelSource(modelSource);
        container.innerHTML = `
          <div class="digestive-stage">
            <div class="digestive-stage__frame" data-role="model-frame">
              <div class="digestive-stage__grid" aria-hidden="true"></div>
              <div class="digestive-stage__ambient" aria-hidden="true"></div>
              <div class="digestive-stage__viewerWrap">
                <model-viewer
                  class="digestive-stage__viewer"
                  data-role="model-viewer"
                  src="${escapeHtml(modelSrc)}"
                  camera-controls
                  ${state.autoRotate ? "auto-rotate" : ""}
                  rotation-per-second="18deg"
                  interaction-prompt="none"
                  loading="eager"
                  reveal="auto"
                  camera-orbit="${escapeHtml(activeView.cameraOrbit)}"
                  field-of-view="${escapeHtml(activeView.fieldOfView)}"
                  min-camera-orbit="auto auto 70%"
                  max-camera-orbit="auto auto 190%"
                  exposure="1"
                  shadow-intensity="0.5"
                  environment-image="neutral"
                  alt="人体消化系统 3D 模型">
                  <div class="digestive-stage__poster" slot="poster">模型加载中...</div>
                </model-viewer>
              </div>
              <div class="digestive-stage__hint" aria-hidden="true">
                <div class="digestive-stage__chip"><span class="digestive-stage__chipDot" style="--chip-color:#fb7185"></span>消化道</div>
                <div class="digestive-stage__chip"><span class="digestive-stage__chipDot" style="--chip-color:#f59e0b"></span>消化腺</div>
                <div class="digestive-stage__chip"><span class="digestive-stage__chipDot" style="--chip-color:#22c55e"></span>吸收部位</div>
              </div>
            </div>
            ${renderModal()}
          </div>
        `;

        loadModelViewer().then(() => {
          if (disposed) return;
          const viewer = findViewer();
          setViewerSource(viewer);
          applyViewToModel();
          if (window.BiologyApp && typeof window.BiologyApp.enhanceBiologyModelViewerProgress === "function") {
            window.BiologyApp.enhanceBiologyModelViewerProgress(container);
          }
        });
      }

      function renderModal() {
        const task = getActiveTask();
        return `
          <div class="digestive-modal${state.modalOpen ? " is-open" : ""}" data-role="modal" style="--accent-color:${task.accent}">
            <div class="digestive-modal__content" role="dialog" aria-modal="true" aria-label="${escapeHtml(task.title)}">
              <button class="digestive-modal__close" type="button" data-action="close-modal" aria-label="关闭弹窗">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                </svg>
              </button>
              <div class="digestive-modal__imageBox">
                <img class="digestive-modal__image" data-role="modal-image" src="${escapeHtml(resolveAssetUrl(task.imageRelativeUrl))}" alt="${escapeHtml(task.title)}" />
              </div>
              <div class="digestive-modal__details">
                <span class="digestive-modal__eyebrow" data-role="modal-eyebrow">营养与消化吸收 · ${escapeHtml(task.label)}</span>
                <h2 class="digestive-modal__title" data-role="modal-title">${escapeHtml(task.title)}</h2>
                <p class="digestive-modal__summary" data-role="modal-summary">${escapeHtml(task.summary)}</p>
                <h3 class="digestive-modal__sectionTitle">学习提示</h3>
                <p class="digestive-modal__prompt" data-role="modal-prompt">${escapeHtml(task.prompt)}</p>
                <h3 class="digestive-modal__sectionTitle">知识要点</h3>
                <ul class="digestive-modal__checks" data-role="modal-checks">${renderChecks(task)}</ul>
              </div>
            </div>
          </div>
        `;
      }

      function renderPanel() {
        if (!panelHost) return;
        panelHost.innerHTML = `
          <div class="digest-panel-${sceneId}">
            <section class="p-card p-head">
              <span class="p-eyebrow">3D 模型观察</span>
              <h2 class="p-title">营养与消化吸收</h2>
              <p class="p-desc">左侧使用统一 3D 模型查看器。视角按钮只调整模型观察方向；观察任务打开配图弹窗讲解。</p>
              <div class="p-row" data-role="view-buttons">
                ${VIEW_MODES.map(view => `
                  <button class="p-button" type="button" data-view="${view.id}" style="--accent-color:${view.accent}">
                    <span class="p-buttonDot"></span>${escapeHtml(view.label)}
                  </button>
                `).join("")}
              </div>
              <div class="p-viewSummary" data-role="view-summary"></div>
              <div class="p-row">
                <button class="p-button" type="button" data-action="toggle-rotate">自动旋转</button>
                <button class="p-button" type="button" data-action="reset-camera">复位视角</button>
              </div>
            </section>

            <section class="p-card">
              <span class="p-eyebrow">观察任务</span>
              <div class="p-row" data-role="task-buttons">
                ${TASKS.map(task => `
                  <button class="p-button p-button--wide" type="button" data-task="${task.id}" style="--accent-color:${task.accent}">
                    <span class="p-buttonDot"></span>${escapeHtml(task.label)}
                  </button>
                `).join("")}
              </div>
            </section>

            <section class="p-card">
              <span class="p-eyebrow">消化路线</span>
              <div class="p-flow">
                ${FLOW_STEPS.map(step => `
                  <div class="p-flowItem">
                    <div class="p-flowLabel">${escapeHtml(step.label)}</div>
                    <div class="p-flowText">${escapeHtml(step.text)}</div>
                  </div>
                `).join("")}
              </div>
            </section>

            <section class="p-card">
              <span class="p-eyebrow">即时判断</span>
              <div class="p-quiz">
                <p class="p-quizQuestion">${escapeHtml(QUIZ.question)}</p>
                ${QUIZ.options.map(option => `
                  <button class="p-quizOption" type="button" data-quiz="${option.id}">${escapeHtml(option.text)}</button>
                `).join("")}
                <div class="p-feedback" data-role="quiz-feedback"></div>
              </div>
            </section>
          </div>
        `;

        panelHost.querySelectorAll("[data-view]").forEach(button => {
          button.addEventListener("click", () => {
            state.activeView = button.getAttribute("data-view") || "overview";
            updatePanelState();
            applyViewToModel();
          });
        });

        panelHost.querySelector("[data-action='toggle-rotate']")?.addEventListener("click", () => {
          state.autoRotate = !state.autoRotate;
          updatePanelState();
          applyViewToModel();
        });

        panelHost.querySelector("[data-action='reset-camera']")?.addEventListener("click", () => {
          state.activeView = "overview";
          updatePanelState();
          applyViewToModel();
          const viewer = findViewer();
          if (viewer && typeof viewer.resetTurntableRotation === "function") {
            try { viewer.resetTurntableRotation(); } catch (error) {}
          }
        });

        panelHost.querySelectorAll("[data-task]").forEach(button => {
          button.addEventListener("click", () => {
            state.activeTask = button.getAttribute("data-task") || "system";
            openModal();
            updatePanelState();
          });
        });

        panelHost.querySelectorAll("[data-quiz]").forEach(button => {
          button.addEventListener("click", () => {
            state.quizAnswer = button.getAttribute("data-quiz") || "";
            const answer = QUIZ.options.find(option => option.id === state.quizAnswer);
            state.quizFeedback = answer && answer.correct
              ? "判断正确：小肠绒毛和皱襞共同增大吸收面积。"
              : "再想一步：胃偏重初步消化，大肠偏重水分回收，小肠才是主要吸收场所。";
            updatePanelState();
          });
        });

        updatePanelState();
      }

      function updatePanelState() {
        if (!panelHost) return;
        const view = getActiveView();
        panelHost.querySelectorAll("[data-view]").forEach(button => {
          const active = button.getAttribute("data-view") === state.activeView;
          button.classList.toggle("is-active", active);
        });
        panelHost.querySelectorAll("[data-task]").forEach(button => {
          const active = button.getAttribute("data-task") === state.activeTask;
          button.classList.toggle("is-active", active);
        });
        panelHost.querySelectorAll("[data-quiz]").forEach(button => {
          button.classList.toggle("is-selected", button.getAttribute("data-quiz") === state.quizAnswer);
        });
        const summary = panelHost.querySelector("[data-role='view-summary']");
        if (summary) {
          summary.style.setProperty("--accent-color", view.accent);
          summary.textContent = view.summary;
        }
        const rotateButton = panelHost.querySelector("[data-action='toggle-rotate']");
        if (rotateButton) {
          rotateButton.classList.toggle("is-active", state.autoRotate);
          rotateButton.textContent = state.autoRotate ? "关闭旋转" : "开启旋转";
          rotateButton.style.setProperty("--accent-color", "#67e8f9");
        }
        const resetButton = panelHost.querySelector("[data-action='reset-camera']");
        if (resetButton) resetButton.style.setProperty("--accent-color", "#f59e0b");
        const feedback = panelHost.querySelector("[data-role='quiz-feedback']");
        if (feedback) feedback.textContent = state.quizFeedback;
      }

      function applyViewToModel() {
        const viewer = findViewer();
        if (!viewer) return;
        const view = getActiveView();
        viewer.setAttribute("camera-orbit", view.cameraOrbit);
        viewer.setAttribute("field-of-view", view.fieldOfView);
        if (state.autoRotate) {
          viewer.setAttribute("auto-rotate", "");
        } else {
          viewer.removeAttribute("auto-rotate");
        }
      }

      function updateModalContent() {
        const modal = container.querySelector("[data-role='modal']");
        if (!modal) return;
        const task = getActiveTask();
        modal.style.setProperty("--accent-color", task.accent);
        modal.classList.toggle("is-open", state.modalOpen);
        const content = modal.querySelector(".digestive-modal__content");
        if (content) content.setAttribute("aria-label", task.title);
        const image = modal.querySelector("[data-role='modal-image']");
        if (image) {
          image.setAttribute("src", resolveAssetUrl(task.imageRelativeUrl));
          image.setAttribute("alt", task.title);
        }
        const eyebrow = modal.querySelector("[data-role='modal-eyebrow']");
        if (eyebrow) eyebrow.textContent = `营养与消化吸收 · ${task.label}`;
        const title = modal.querySelector("[data-role='modal-title']");
        if (title) title.textContent = task.title;
        const summary = modal.querySelector("[data-role='modal-summary']");
        if (summary) summary.textContent = task.summary;
        const prompt = modal.querySelector("[data-role='modal-prompt']");
        if (prompt) prompt.textContent = task.prompt;
        const checks = modal.querySelector("[data-role='modal-checks']");
        if (checks) checks.innerHTML = renderChecks(task);
        const details = modal.querySelector(".digestive-modal__details");
        if (details) details.scrollTop = 0;
      }

      function openModal() {
        state.modalOpen = true;
        updateModalContent();
      }

      function closeModal() {
        state.modalOpen = false;
        updateModalContent();
      }

      function bindStageEvents() {
        container.addEventListener("click", event => {
          const closeButton = event.target.closest("[data-action='close-modal']");
          if (closeButton) {
            closeModal();
            return;
          }
          const modal = event.target.closest("[data-role='modal']");
          if (modal && event.target === modal) closeModal();
        });
        const onKeyDown = event => {
          if (event.key === "Escape" && state.modalOpen) closeModal();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
      }

      container.innerHTML = "";
      container.style.position = "relative";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";
      container.setAttribute("data-scope", sceneId);

      setScopedStyle();
      renderStage();
      renderPanel();
      const unbindStageEvents = bindStageEvents();

      const observer = new MutationObserver(() => {
        if (!document.body.contains(container)) {
          disposed = true;
          unbindStageEvents();
          window.BiologyApp?.releaseBiologyModelViewers?.(container);
          document.getElementById(`${sceneId}-style`)?.remove();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };
})();

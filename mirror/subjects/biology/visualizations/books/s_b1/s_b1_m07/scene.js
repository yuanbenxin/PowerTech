window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["s_b1_m07"] = (function () {
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

  const MODEL = {
    title: "叶绿体",
    accent: "#84cc16",
    src: {
      desktop: "assets/models/chloroplast-photosynthesis.glb?v=a809395c9ef2",
      tablet: "assets/models/chloroplast-photosynthesis.tablet.glb?v=66e9f7ba98dc",
      mobile: "assets/models/chloroplast-photosynthesis.mobile.glb?v=66e9f7ba98dc"
    },
    alt: "叶绿体与光合作用 3D 模型",
    cameraOrbit: "28deg 64deg 116%",
    fieldOfView: "38deg",
    exposure: "1.03",
    shadowIntensity: "0.68",
    concept: "叶绿体是绿色植物光合作用的主要场所。类囊体膜承担光反应，叶绿体基质承担 CO2 固定和糖类合成，双层膜与内部膜系统共同支持能量转换。",
    focus: [
      "类囊体膜上分布光合色素和相关酶，是光能吸收、电子传递和 ATP 合成的重要位置。",
      "叶绿体基质中进行 CO2 固定和 C3 还原，需要光反应提供的 ATP 和 NADPH。",
      "光合作用把光能转化为有机物中稳定的化学能，并释放 O2。"
    ]
  };

  const TASKS = [
    {
      id: "overview",
      title: "光合作用总览",
      label: "物质与能量",
      accent: "#84cc16",
      imageRelativeUrl: "assets/images/photosynthesis-overview-square.png?v=8505aaa29c00",
      summary: "光合作用利用光能，把 CO2 和 H2O 转化为有机物，并释放 O2。它不是单一步骤，而是由光反应和暗反应协同完成的能量转换与物质合成过程。",
      prompt: "讲解时抓住两条线：物质变化是 CO2 进入、有机物形成、O2 释放；能量变化是光能转化为 ATP 和 NADPH 中的活跃化学能，再转入糖类等有机物中。",
      checks: ["O2 来自水的光解", "CO2 参与暗反应中的碳固定", "光合作用最终把能量储存在有机物中", "叶绿体内部结构体现结构与功能相适应"],
      deepPoint: "高中表达要更精确：光反应直接利用光能，暗反应不直接需要光，但需要光反应提供的 ATP 和 NADPH。"
    },
    {
      id: "light",
      title: "光反应",
      label: "类囊体膜",
      accent: "#facc15",
      imageRelativeUrl: "assets/images/light-reaction-square.png?v=8d342432372c",
      summary: "光反应发生在类囊体膜上。光合色素吸收光能后，水被分解并释放 O2，电子沿传递链传递，形成 ATP 和 NADPH，为暗反应提供能量和还原力。",
      prompt: "先找类囊体膜，再解释三件事：水光解产生 O2，电子传递形成 NADPH，跨膜质子梯度驱动 ATP 合成。",
      checks: ["光反应需要光和水", "O2 来源于 H2O 而不是 CO2", "ATP 和 NADPH 会被暗反应消耗", "类囊体堆叠成基粒可扩大膜面积"],
      deepPoint: "这部分与细胞呼吸的电子传递链可对照：二者都利用膜上的电子传递和质子梯度，但能量来源和最终用途不同。"
    },
    {
      id: "calvin",
      title: "暗反应与碳固定",
      label: "叶绿体基质",
      accent: "#22c55e",
      imageRelativeUrl: "assets/images/calvin-cycle-square.png?v=be5423ef24d7",
      summary: "暗反应发生在叶绿体基质中。CO2 首先被固定形成 C3，随后在 ATP 和 NADPH 参与下被还原，最终形成糖类等有机物，同时再生 CO2 受体。",
      prompt: "暗反应不是完全与光无关。它不直接利用光能，但高度依赖光反应提供的 ATP 和 NADPH，因此光照停止后暗反应也会逐渐受阻。",
      checks: ["暗反应场所在叶绿体基质", "CO2 被固定形成 C3", "C3 还原需要 ATP 和 NADPH", "C5 再生使碳循环得以持续"],
      deepPoint: "分析 C3、C5 含量变化时，要看 CO2 供应和光反应产物供应哪个先受限制，这是高中光合作用题的核心。"
    },
    {
      id: "factors",
      title: "影响因素分析",
      label: "曲线与限制",
      accent: "#38bdf8",
      imageRelativeUrl: "assets/images/photosynthesis-factors-square.png?v=bfc7248904dd",
      summary: "光照强度、CO2 浓度、温度、水分和矿质元素都会影响光合作用速率。不同条件下的限制因素不同，曲线平台期通常说明另一个因素成为限制条件。",
      prompt: "读图时先判断横坐标改变的因素，再观察曲线是否进入平台。若光照增强后速率不再升高，可能是 CO2 浓度或温度等因素限制。",
      checks: ["弱光下光照常是主要限制因素", "CO2 浓度影响暗反应碳固定", "温度主要通过影响酶活性改变反应速率", "水分不足会间接影响 CO2 吸收"],
      deepPoint: "高中题常把真实光合速率、净光合速率和呼吸速率放在一起考。净光合速率等于实际光合速率减去呼吸速率。"
    }
  ];

  const VIEWPOINTS = [
    { id: "overview", label: "整体", orbit: "28deg 64deg 116%", fov: "38deg" },
    { id: "grana", label: "基粒", orbit: "-48deg 62deg 98%", fov: "30deg" },
    { id: "stroma", label: "基质", orbit: "72deg 70deg 108%", fov: "32deg" }
  ];

  const QUIZ = {
    question: "光合作用释放的 O2 主要来源于哪种物质？",
    options: [
      { id: "co2", text: "CO2", correct: false },
      { id: "water", text: "H2O", correct: true },
      { id: "glucose", text: "葡萄糖", correct: false }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "senior-photosynthesis-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );

      const externalPanelStyle = panelHost ? {
        overflow: panelHost.style.overflow,
        overflowY: panelHost.style.overflowY,
        overscrollBehavior: panelHost.style.overscrollBehavior,
        scrollbarWidth: panelHost.style.scrollbarWidth,
        touchAction: panelHost.style.touchAction,
        webkitOverflowScrolling: panelHost.style.webkitOverflowScrolling,
        minHeight: panelHost.style.minHeight,
        height: panelHost.style.height
      } : null;

      let disposed = false;
      const state = {
        activeTask: "overview",
        activeView: "overview",
        autoRotate: !isMobileModelTarget,
        quizAnswer: "",
        quizFeedback: "",
        showModal: false
      };

      function resolveAssetUrl(relativeUrl) {
        const rawUrl = `${assetBase}${relativeUrl}`;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(rawUrl) : rawUrl;
      }

      function sourceWithBase(source) {
        if (source && typeof source === "object") {
          const mapped = {};
          Object.keys(source).forEach(key => {
            mapped[key] = `${assetBase}${source[key]}`;
          });
          return mapped;
        }
        return `${assetBase}${source}`;
      }

      function resolveModelSource(source) {
        const withBase = sourceWithBase(source);
        if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
          return window.BiologyApp.resolveBiologyModelVariantSource(withBase);
        }
        const picked = withBase && typeof withBase === "object"
          ? (isMobileModelTarget ? (withBase.mobile || withBase.tablet || withBase.desktop) : withBase.desktop)
          : withBase;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(picked) : picked;
      }

      function setViewerModelSource(viewer, source) {
        if (!viewer) return "";
        const withBase = sourceWithBase(source);
        if (window.BiologyApp && typeof window.BiologyApp.setBiologyModelViewerSource === "function") {
          return window.BiologyApp.setBiologyModelViewerSource(viewer, withBase);
        }
        const modelSrc = resolveModelSource(source);
        if (viewer.getAttribute("src") !== modelSrc) viewer.setAttribute("src", modelSrc);
        return modelSrc;
      }

      function getActiveTask() {
        return TASKS.find(task => task.id === state.activeTask) || TASKS[0];
      }

      function getActiveView() {
        return VIEWPOINTS.find(view => view.id === state.activeView) || VIEWPOINTS[0];
      }

      function findViewer() {
        return container.querySelector("model-viewer");
      }

      function hexToRgb(hex) {
        const fullHex = String(hex || "#84cc16").replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "132, 204, 22";
      }

      function renderChecks(task) {
        return (task.checks || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
      }

      function renderFocusList() {
        return MODEL.focus.map(item => `<li>${escapeHtml(item)}</li>`).join("");
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
            background: #06110b;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }
          [data-scope="${sceneId}"] * { box-sizing: border-box; }
          [data-scope="${sceneId}"] .photo-stage {
            width: 100%;
            height: 100%;
            min-height: 0;
            padding: 12px;
            overflow: hidden;
          }
          [data-scope="${sceneId}"] .photo-stage__frame {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(132, 204, 22, 0.22);
            background:
              radial-gradient(circle at 18% 22%, rgba(250, 204, 21, 0.18), transparent 34%),
              radial-gradient(circle at 82% 70%, rgba(34, 197, 94, 0.16), transparent 36%),
              linear-gradient(135deg, rgba(6, 24, 16, 0.98), rgba(3, 7, 18, 0.98));
            box-shadow: inset 0 0 90px rgba(132, 204, 22, 0.08), 0 24px 70px rgba(0,0,0,0.46);
          }
          [data-scope="${sceneId}"] .photo-stage__mesh {
            position: absolute;
            inset: 0;
            z-index: 1;
            opacity: 0.18;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
            background-size: 44px 44px;
            mask-image: radial-gradient(circle at center, #000 32%, transparent 78%);
          }
          [data-scope="${sceneId}"] .photo-stage__viewerWrap {
            position: absolute;
            inset: 0;
            z-index: 2;
          }
          [data-scope="${sceneId}"] .photo-stage__viewer {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            --poster-color: transparent;
          }
          [data-scope="${sceneId}"] .photo-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            background: rgba(2, 6, 23, 0.8);
            color: rgba(248,250,252,0.72);
            font-size: 13px;
            line-height: 1.4;
            font-weight: 900;
            letter-spacing: 0.08em;
          }
          [data-scope="${sceneId}"] .photo-stage__bottom {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            z-index: 6;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 10px;
            pointer-events: none;
          }
          [data-scope="${sceneId}"] .photo-stage__legend {
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          [data-scope="${sceneId}"] .photo-stage__chip {
            min-height: 30px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 7px 10px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(2,6,23,0.6);
            color: rgba(226,232,240,0.9);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 850;
            backdrop-filter: blur(12px);
            overflow-wrap: anywhere;
          }
          [data-scope="${sceneId}"] .photo-stage__dot {
            width: 8px;
            height: 8px;
            flex: none;
            border-radius: 999px;
            background: var(--dot-color);
            box-shadow: 0 0 14px var(--dot-color);
          }
          [data-scope="${sceneId}"] .photo-stage__buttons {
            display: flex;
            flex: none;
            gap: 8px;
            pointer-events: auto;
          }
          [data-scope="${sceneId}"] .photo-stage__iconBtn {
            width: 42px;
            height: 42px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(15,23,42,0.68);
            color: rgba(248,250,252,0.84);
            cursor: pointer;
            padding: 0;
            backdrop-filter: blur(10px);
            transition: transform 160ms ease, color 160ms ease, border-color 160ms ease, background 160ms ease;
            -webkit-tap-highlight-color: transparent;
          }
          [data-scope="${sceneId}"] .photo-stage__iconBtn svg { pointer-events: none; }
          [data-scope="${sceneId}"] .photo-stage__iconBtn:hover,
          [data-scope="${sceneId}"] .photo-stage__iconBtn.is-active {
            transform: translateY(-1px);
            border-color: var(--task-accent, #84cc16);
            background: var(--task-accent-soft, rgba(132,204,22,0.16));
            color: #fff;
          }
          [data-scope="${sceneId}"] .photo-stage__modalOverlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            background: rgba(2,6,23,0.7);
            backdrop-filter: blur(20px) saturate(150%);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            overscroll-behavior: contain;
            touch-action: pan-y;
            transition: opacity 0.26s ease, visibility 0.26s ease;
          }
          [data-scope="${sceneId}"] .photo-stage__modalOverlay.is-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }
          [data-scope="${sceneId}"] .photo-stage__modalContent {
            width: 90%;
            max-width: 1100px;
            height: 85vh;
            max-height: 800px;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            isolation: isolate;
            padding: 40px;
            border-radius: 32px;
            border: 1.5px solid rgba(132,204,22,0.28);
            background: rgba(6, 16, 13, 0.96);
            box-shadow: 0 30px 70px rgba(0,0,0,0.75), inset 0 0 45px rgba(132,204,22,0.1);
            transform: scale(0.96) translateY(12px);
            transition: transform 0.26s ease;
          }
          [data-scope="${sceneId}"] .photo-stage__modalOverlay.is-open .photo-stage__modalContent {
            transform: scale(1) translateY(0);
          }
          [data-scope="${sceneId}"] .photo-stage__modalClose {
            position: absolute;
            top: 24px;
            right: 24px;
            z-index: 80;
            width: 40px;
            height: 40px;
            min-width: 40px;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.06);
            color: rgba(255,255,255,0.78);
            cursor: pointer;
            padding: 0;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition: transform 160ms ease, color 160ms ease, background 160ms ease, border-color 160ms ease;
          }
          [data-scope="${sceneId}"] .photo-stage__modalClose svg { pointer-events: none; }
          [data-scope="${sceneId}"] .photo-stage__modalClose:hover {
            color: #fff;
            background: rgba(239,68,68,0.18);
            border-color: rgba(239,68,68,0.34);
            transform: rotate(90deg) scale(1.04);
          }
          [data-scope="${sceneId}"] .photo-stage__modalGrid {
            height: 100%;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 40px;
            align-items: center;
            overflow: hidden;
          }
          [data-scope="${sceneId}"] .photo-stage__modalImageShell {
            position: relative;
            width: 100%;
            max-height: 520px;
            aspect-ratio: 1;
            margin: 0 auto;
            overflow: hidden;
            border-radius: 24px;
            border: 1.5px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.38);
            box-shadow: 0 15px 40px rgba(0,0,0,0.5);
          }
          [data-scope="${sceneId}"] .photo-stage__modalImage {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }
          [data-scope="${sceneId}"] .photo-stage__modalImageGlow {
            position: absolute;
            inset: 0;
            border-radius: 22px;
            pointer-events: none;
            box-shadow: inset 0 0 45px rgba(var(--glow-color-rgb), 0.24);
          }
          [data-scope="${sceneId}"] .photo-stage__modalDetails {
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 18px;
            overflow-y: auto;
            padding-right: 14px;
            text-align: left;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          [data-scope="${sceneId}"] .photo-stage__modalDetails::-webkit-scrollbar { width: 0; height: 0; display: none; }
          [data-scope="${sceneId}"] .photo-stage__modalEyebrow {
            width: fit-content;
            max-width: 100%;
            display: inline-flex;
            align-items: center;
            min-height: 26px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(132,204,22,0.12);
            color: #84cc16;
            font-size: 11px;
            line-height: 1.2;
            font-weight: 900;
            overflow-wrap: anywhere;
          }
          [data-scope="${sceneId}"] .photo-stage__modalTitle {
            margin: 10px 0 0;
            color: #f8fafc;
            font-size: 31px;
            line-height: 1.16;
            font-weight: 950;
            overflow-wrap: anywhere;
          }
          [data-scope="${sceneId}"] .photo-stage__modalSummary,
          [data-scope="${sceneId}"] .photo-stage__modalPrompt,
          [data-scope="${sceneId}"] .photo-stage__modalDeep,
          [data-scope="${sceneId}"] .photo-stage__modalChecks li {
            color: rgba(226,232,240,0.82);
            font-size: 14px;
            line-height: 1.72;
            overflow-wrap: anywhere;
          }
          [data-scope="${sceneId}"] .photo-stage__modalPrompt,
          [data-scope="${sceneId}"] .photo-stage__modalDeep {
            margin: 0;
            padding: 14px 16px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.56);
          }
          [data-scope="${sceneId}"] .photo-stage__modalSectionTitle {
            margin: 0 0 8px;
            color: var(--task-accent, #84cc16);
            font-size: 13px;
            line-height: 1.2;
            font-weight: 950;
          }
          [data-scope="${sceneId}"] .photo-stage__modalChecks {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          [data-scope="${sceneId}"] .photo-stage__modalChecks li {
            position: relative;
            padding-left: 18px;
          }
          [data-scope="${sceneId}"] .photo-stage__modalChecks li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.68em;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--task-accent, #84cc16);
            box-shadow: 0 0 12px var(--task-accent, #84cc16);
          }
          .panel-${sceneId} {
            min-width: 0;
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 14px;
            overflow-y: auto;
            padding: 4px 2px 14px;
            color: #f8fafc;
            scrollbar-width: none;
            -ms-overflow-style: none;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }
          .panel-${sceneId}::-webkit-scrollbar { width: 0; height: 0; display: none; }
          .panel-${sceneId} * { box-sizing: border-box; }
          .panel-${sceneId} .p-card {
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
            padding: 14px;
            border-radius: 8px;
            border: 1px solid rgba(148,163,184,0.14);
            background: rgba(8,18,28,0.72);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          }
          .panel-${sceneId} .p-eyebrow {
            color: rgba(148,163,184,0.84);
            font-size: 11px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-title {
            margin: 0;
            color: #f8fafc;
            font-size: 19px;
            line-height: 1.22;
            font-weight: 950;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-desc,
          .panel-${sceneId} .p-checkList li,
          .panel-${sceneId} .p-flowLine strong,
          .panel-${sceneId} .p-feedback,
          .panel-${sceneId} .p-quizQuestion {
            color: rgba(226,232,240,0.78);
            font-size: 13px;
            line-height: 1.62;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-taskGrid,
          .panel-${sceneId} .p-viewGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
            min-width: 0;
          }
          .panel-${sceneId} .p-viewGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .panel-${sceneId} .p-task,
          .panel-${sceneId} .p-view,
          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-quizOption {
            min-width: 0;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            border: 1px solid rgba(148,163,184,0.16);
            background: rgba(15,23,42,0.62);
            color: rgba(248,250,252,0.86);
            font-size: 12px;
            line-height: 1.32;
            font-weight: 900;
            cursor: pointer;
            transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;
            padding: 10px;
            text-align: left;
            -webkit-tap-highlight-color: transparent;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-task {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
          }
          .panel-${sceneId} .p-task strong {
            color: currentColor;
            font-size: 13px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-task span {
            color: rgba(203,213,225,0.62);
            font-size: 11px;
            line-height: 1.28;
            font-weight: 750;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-task:hover,
          .panel-${sceneId} .p-view:hover,
          .panel-${sceneId} .p-action:hover,
          .panel-${sceneId} .p-quizOption:hover,
          .panel-${sceneId} .p-task.is-active,
          .panel-${sceneId} .p-view.is-active,
          .panel-${sceneId} .p-action.is-active,
          .panel-${sceneId} .p-quizOption.is-selected {
            transform: translateY(-1px);
            border-color: var(--item-accent, var(--task-accent, #84cc16));
            background: color-mix(in srgb, var(--item-accent, var(--task-accent, #84cc16)) 16%, rgba(15,23,42,0.74));
            color: #fff;
          }
          .panel-${sceneId} .p-actionRow {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .panel-${sceneId} .p-action {
            flex: 1 1 96px;
            text-align: center;
          }
          .panel-${sceneId} .p-checkList {
            display: grid;
            gap: 8px;
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .panel-${sceneId} .p-checkList li {
            position: relative;
            padding-left: 18px;
          }
          .panel-${sceneId} .p-checkList li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.66em;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--task-accent, #84cc16);
            box-shadow: 0 0 12px var(--task-accent, #84cc16);
          }
          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 8px;
          }
          .panel-${sceneId} .p-flowLine {
            display: grid;
            gap: 4px;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid rgba(148,163,184,0.12);
            background: rgba(2,6,23,0.35);
          }
          .panel-${sceneId} .p-flowLine span {
            color: var(--task-accent, #84cc16);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 950;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-quiz {
            display: grid;
            gap: 9px;
          }
          .panel-${sceneId} .p-quizOption {
            justify-content: flex-start;
            text-align: left;
          }
          .panel-${sceneId} .p-feedback {
            min-height: 42px;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid rgba(148,163,184,0.12);
            background: rgba(2,6,23,0.35);
          }
          .panel-${sceneId} .p-feedback.is-correct {
            color: #bbf7d0;
            border-color: rgba(34,197,94,0.28);
            background: rgba(34,197,94,0.1);
          }
          .panel-${sceneId} .p-feedback.is-wrong {
            color: #fecaca;
            border-color: rgba(248,113,113,0.28);
            background: rgba(248,113,113,0.1);
          }
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .photo-stage { padding: 8px; }
            [data-scope="${sceneId}"] .photo-stage__frame { border-radius: 22px; }
            [data-scope="${sceneId}"] .photo-stage__bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
            }
            [data-scope="${sceneId}"] .photo-stage__legend { max-width: calc(100% - 100px); }
            [data-scope="${sceneId}"] .photo-stage__chip {
              min-height: 28px;
              font-size: 10.5px;
              padding: 6px 9px;
            }
            [data-scope="${sceneId}"] .photo-stage__iconBtn {
              width: 40px;
              height: 40px;
              border-radius: 13px;
            }
            [data-scope="${sceneId}"] .photo-stage__modalOverlay {
              align-items: flex-start;
              padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
              overflow: hidden;
            }
            [data-scope="${sceneId}"] .photo-stage__modalContent {
              width: min(100%, 390px);
              max-width: calc(100vw - 20px);
              height: calc(100vh - 20px);
              height: calc(100dvh - 20px);
              max-height: none;
              padding: 54px 16px 18px;
              border-radius: 26px;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            [data-scope="${sceneId}"] .photo-stage__modalContent::-webkit-scrollbar { width: 0; height: 0; display: none; }
            [data-scope="${sceneId}"] .photo-stage__modalClose {
              position: fixed;
              top: max(14px, env(safe-area-inset-top));
              right: max(14px, env(safe-area-inset-right));
              width: 42px;
              height: 42px;
              min-width: 42px;
              min-height: 42px;
            }
            [data-scope="${sceneId}"] .photo-stage__modalGrid {
              height: auto;
              min-height: 0;
              grid-template-columns: 1fr;
              gap: 16px;
              align-items: start;
              overflow: visible;
            }
            [data-scope="${sceneId}"] .photo-stage__modalImageShell {
              width: min(100%, 300px);
              max-width: 300px;
              max-height: none;
            }
            [data-scope="${sceneId}"] .photo-stage__modalDetails {
              height: auto;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }
            [data-scope="${sceneId}"] .photo-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
            }
            [data-scope="${sceneId}"] .photo-stage__modalSummary,
            [data-scope="${sceneId}"] .photo-stage__modalPrompt,
            [data-scope="${sceneId}"] .photo-stage__modalDeep,
            [data-scope="${sceneId}"] .photo-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.52;
            }
          }
          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .photo-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }
            [data-scope="${sceneId}"] .photo-stage__modalImageShell {
              width: min(100%, 280px);
              max-width: 280px;
            }
            [data-scope="${sceneId}"] .photo-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
            .panel-${sceneId} .p-taskGrid,
            .panel-${sceneId} .p-viewGrid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 900px) and (max-height: 480px) {
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
            [data-scope="${sceneId}"] .photo-stage__modalImageShell {
              width: min(34vw, 220px);
              max-width: 220px;
            }
            [data-scope="${sceneId}"] .photo-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
            }
            [data-scope="${sceneId}"] .photo-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const task = getActiveTask();
        const view = getActiveView();
        container.setAttribute("data-scope", sceneId);
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        container.innerHTML = `
          <div class="photo-stage">
            <div class="photo-stage__frame">
              <div class="photo-stage__mesh"></div>
              <div class="photo-stage__viewerWrap">
                <model-viewer
                  class="photo-stage__viewer"
                  data-role="model-viewer"
                  src="${escapeHtml(resolveModelSource(MODEL.src))}"
                  draco-decoder-url="${escapeHtml(assetBase)}assets/draco/"
                  camera-controls
                  interaction-prompt="none"
                  shadow-intensity="${escapeHtml(MODEL.shadowIntensity)}"
                  exposure="${escapeHtml(MODEL.exposure)}"
                  environment-image="neutral"
                  loading="eager"
                  field-of-view="${escapeHtml(view.fov || MODEL.fieldOfView)}"
                  min-field-of-view="12deg"
                  max-field-of-view="82deg"
                  camera-orbit="${escapeHtml(view.orbit || MODEL.cameraOrbit)}"
                  alt="${escapeHtml(MODEL.alt)}">
                  <div class="photo-stage__poster" slot="poster">模型加载中...</div>
                </model-viewer>
              </div>
              <div class="photo-stage__bottom">
                <div class="photo-stage__legend" aria-label="光合作用图例">
                  <div class="photo-stage__chip"><span class="photo-stage__dot" style="--dot-color:#facc15"></span>光能吸收</div>
                  <div class="photo-stage__chip"><span class="photo-stage__dot" style="--dot-color:#84cc16"></span>类囊体</div>
                  <div class="photo-stage__chip"><span class="photo-stage__dot" style="--dot-color:#38bdf8"></span>CO2 与 O2</div>
                </div>
                <div class="photo-stage__buttons">
                  <button class="photo-stage__iconBtn${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate" aria-label="自动旋转">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3.2-6.9"></path><path d="M21 4v6h-6"></path></svg>
                  </button>
                  <button class="photo-stage__iconBtn" type="button" data-action="reset-camera" aria-label="复位视角">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2"></path><path d="M21 3v6h-6"></path><path d="M21 12a9 9 0 0 1-15.5 6.2"></path><path d="M3 21v-6h6"></path></svg>
                  </button>
                </div>
              </div>
              <div class="photo-stage__modalOverlay" data-role="task-modal">
                <div class="photo-stage__modalContent">
                  <button class="photo-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="photo-stage__modalGrid">
                    <div class="photo-stage__modalImageShell">
                      <img class="photo-stage__modalImage" data-role="modal-image" src="${escapeHtml(resolveAssetUrl(task.imageRelativeUrl))}" alt="${escapeHtml(task.title)}教学配图">
                      <div class="photo-stage__modalImageGlow" data-role="modal-image-glow" style="--glow-color-rgb:${hexToRgb(task.accent)}"></div>
                    </div>
                    <div class="photo-stage__modalDetails">
                      <div>
                        <span class="photo-stage__modalEyebrow" data-role="modal-eyebrow">光合作用 · 高中深度讲解</span>
                        <h2 class="photo-stage__modalTitle" data-role="modal-title">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="photo-stage__modalSummary" data-role="modal-summary">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="photo-stage__modalSectionTitle">观察提示</h3>
                        <p class="photo-stage__modalPrompt" data-role="modal-prompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="photo-stage__modalSectionTitle">知识要点</h3>
                        <ul class="photo-stage__modalChecks" data-role="modal-checks">${renderChecks(task)}</ul>
                      </div>
                      <div>
                        <h3 class="photo-stage__modalSectionTitle">高中深化</h3>
                        <p class="photo-stage__modalDeep" data-role="modal-deep">${escapeHtml(task.deepPoint)}</p>
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
        const taskButtons = TASKS.map(item => `
          <button class="p-task${item.id === state.activeTask ? " is-active" : ""}" type="button" data-action="select-task" data-value="${escapeHtml(item.id)}" style="--item-accent:${escapeHtml(item.accent)}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.label)}</span>
          </button>
        `).join("");
        const viewButtons = VIEWPOINTS.map(item => `
          <button class="p-view${item.id === state.activeView ? " is-active" : ""}" type="button" data-action="select-view" data-value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>
        `).join("");
        const quizOptions = QUIZ.options.map(option => `
          <button class="p-quizOption${state.quizAnswer === option.id ? " is-selected" : ""}" type="button" data-action="answer-quiz" data-value="${escapeHtml(option.id)}">${escapeHtml(option.text)}</button>
        `).join("");

        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--task-accent:${escapeHtml(task.accent)}; --task-accent-soft:${escapeHtml(task.accent)}26">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <h2 class="p-title">叶绿体与光合作用</h2>
              <p class="p-desc">${escapeHtml(MODEL.concept)}</p>
              <div class="p-actionRow">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">自动旋转</button>
                <button class="p-action" type="button" data-action="reset-camera">复位视角</button>
              </div>
              <div class="p-viewGrid">${viewButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">结构与功能</span>
              <ul class="p-checkList">${renderFocusList()}</ul>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">观察任务</span>
              <div class="p-taskGrid">${taskButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">教学卡片</span>
              <h2 class="p-title" data-role="task-title">${escapeHtml(task.title)}</h2>
              <p class="p-desc" data-role="task-prompt">${escapeHtml(task.prompt)}</p>
              <ul class="p-checkList" data-role="task-checks">${renderChecks(task)}</ul>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">过程链路</span>
              <div class="p-flow">
                <div class="p-flowLine"><span>光反应</span><strong>类囊体膜吸收光能，水光解释放 O2，同时形成 ATP 和 NADPH。</strong></div>
                <div class="p-flowLine"><span>暗反应</span><strong>叶绿体基质中 CO2 被固定并还原，最终形成糖类等有机物。</strong></div>
                <div class="p-flowLine"><span>影响因素</span><strong>光照、CO2、温度、水分共同影响光合速率；平台期通常意味着其他因素成为限制。</strong></div>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">快速判断</span>
              <div class="p-quiz">
                <div class="p-quizQuestion">${escapeHtml(QUIZ.question)}</div>
                ${quizOptions}
                <div class="p-feedback" data-role="quiz-feedback">选择一个答案后，这里会给出即时反馈。</div>
              </div>
            </div>
          </div>
        `;
      }

      function updatePanel() {
        if (!panelHost) return;
        const panel = panelHost.querySelector(`.panel-${sceneId}`);
        if (!panel) return;
        const task = getActiveTask();
        panel.style.setProperty("--task-accent", task.accent);
        panel.style.setProperty("--task-accent-soft", `${task.accent}26`);
        panel.querySelectorAll("[data-action='select-task']").forEach(button => {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.activeTask);
        });
        panel.querySelectorAll("[data-action='select-view']").forEach(button => {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.activeView);
        });
        panel.querySelectorAll("[data-action='toggle-auto-rotate']").forEach(button => {
          button.classList.toggle("is-active", state.autoRotate);
        });
        panel.querySelectorAll("[data-action='answer-quiz']").forEach(button => {
          button.classList.toggle("is-selected", button.getAttribute("data-value") === state.quizAnswer);
        });
        const taskTitle = panel.querySelector('[data-role="task-title"]');
        const taskPrompt = panel.querySelector('[data-role="task-prompt"]');
        const taskChecks = panel.querySelector('[data-role="task-checks"]');
        const quizFeedback = panel.querySelector('[data-role="quiz-feedback"]');
        if (taskTitle) taskTitle.textContent = task.title;
        if (taskPrompt) taskPrompt.textContent = task.prompt;
        if (taskChecks) taskChecks.innerHTML = renderChecks(task);
        if (quizFeedback) {
          quizFeedback.textContent = state.quizFeedback || "选择一个答案后，这里会给出即时反馈。";
          quizFeedback.classList.toggle("is-correct", state.quizAnswer === "water");
          quizFeedback.classList.toggle("is-wrong", Boolean(state.quizAnswer && state.quizAnswer !== "water"));
        }
      }

      function applyModelAndCamera() {
        const viewer = findViewer();
        if (!viewer) return;
        const view = getActiveView();
        setViewerModelSource(viewer, MODEL.src);
        viewer.setAttribute("draco-decoder-url", `${assetBase}assets/draco/`);
        viewer.setAttribute("camera-orbit", view.orbit || MODEL.cameraOrbit);
        viewer.setAttribute("field-of-view", view.fov || MODEL.fieldOfView);
        viewer.setAttribute("shadow-intensity", MODEL.shadowIntensity);
        viewer.setAttribute("exposure", MODEL.exposure);
        viewer.setAttribute("alt", MODEL.alt);
        if (state.autoRotate) {
          viewer.setAttribute("auto-rotate", "");
          viewer.setAttribute("auto-rotate-delay", "0");
          viewer.setAttribute("rotation-per-second", isMobileModelTarget ? "8deg" : "16deg");
        } else {
          viewer.removeAttribute("auto-rotate");
        }
        try {
          viewer.jumpCameraToGoal?.();
        } catch (error) {}
        container.querySelectorAll("[data-action='toggle-auto-rotate']").forEach(button => {
          button.classList.toggle("is-active", state.autoRotate);
        });
      }

      function updateModal() {
        const task = getActiveTask();
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        const overlay = container.querySelector('[data-role="task-modal"]');
        if (!overlay) return;
        const image = overlay.querySelector('[data-role="modal-image"]');
        const glow = overlay.querySelector('[data-role="modal-image-glow"]');
        const eyebrow = overlay.querySelector('[data-role="modal-eyebrow"]');
        const title = overlay.querySelector('[data-role="modal-title"]');
        const summary = overlay.querySelector('[data-role="modal-summary"]');
        const prompt = overlay.querySelector('[data-role="modal-prompt"]');
        const checks = overlay.querySelector('[data-role="modal-checks"]');
        const deep = overlay.querySelector('[data-role="modal-deep"]');
        const content = overlay.querySelector(".photo-stage__modalContent");
        if (image) {
          image.src = resolveAssetUrl(task.imageRelativeUrl);
          image.alt = `${task.title}教学配图`;
        }
        if (glow) glow.style.setProperty("--glow-color-rgb", hexToRgb(task.accent));
        if (eyebrow) {
          eyebrow.style.background = `${task.accent}1c`;
          eyebrow.style.color = task.accent;
        }
        if (title) title.textContent = task.title;
        if (summary) summary.textContent = task.summary;
        if (prompt) prompt.textContent = task.prompt;
        if (checks) checks.innerHTML = renderChecks(task);
        if (deep) deep.textContent = task.deepPoint;
        if (content) {
          content.style.borderColor = `${task.accent}42`;
          content.style.boxShadow = `0 30px 70px rgba(0,0,0,0.75), inset 0 0 45px ${task.accent}14`;
        }
        overlay.classList.toggle("is-open", state.showModal);
      }

      function closeModal() {
        state.showModal = false;
        updateModal();
        updatePanel();
      }

      function handleClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") || "";

        if (action === "select-task") {
          if (!TASKS.some(task => task.id === value)) return;
          state.activeTask = value;
          state.showModal = true;
          updateModal();
          updatePanel();
          return;
        }
        if (action === "select-view") {
          if (!VIEWPOINTS.some(view => view.id === value)) return;
          state.activeView = value;
          applyModelAndCamera();
          updatePanel();
          return;
        }
        if (action === "toggle-auto-rotate") {
          state.autoRotate = !state.autoRotate;
          applyModelAndCamera();
          updatePanel();
          return;
        }
        if (action === "reset-camera") {
          state.activeView = "overview";
          applyModelAndCamera();
          updatePanel();
          return;
        }
        if (action === "close-modal") {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
          return;
        }
        if (action === "answer-quiz") {
          const picked = QUIZ.options.find(option => option.id === value);
          if (!picked) return;
          state.quizAnswer = value;
          state.quizFeedback = picked.correct
            ? "判断正确。光合作用释放的 O2 来自水的光解，CO2 中的碳主要进入糖类等有机物。"
            : "再看物质来源：释放出的 O2 不是来自 CO2，而是来自光反应中水的分解。";
          updatePanel();
        }
      }

      function start() {
        if (disposed) return;
        container.innerHTML = "";
        container.setAttribute("data-scope", sceneId);
        container.style.position = "relative";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.overflow = "hidden";
        setScopedStyle();
        if (panelHost) {
          panelHost.style.overflow = "hidden auto";
          panelHost.style.overflowY = "auto";
          panelHost.style.overscrollBehavior = "contain";
          panelHost.style.scrollbarWidth = "none";
          panelHost.style.touchAction = "pan-y";
          panelHost.style.webkitOverflowScrolling = "touch";
          panelHost.style.height = "100%";
          panelHost.style.minHeight = "0";
        }
        renderStage();
        renderPanel();
        applyModelAndCamera();
        updateModal();
        updatePanel();
        container.addEventListener("click", handleClick);
        if (panelHost) panelHost.addEventListener("click", handleClick);
        window.BiologyApp?.enhanceBiologyModelViewerProgress?.(container);
      }

      loadModelViewer().then(start);

      container.__bioSceneCleanup = function cleanup() {
        disposed = true;
        window.BiologyApp?.releaseBiologyModelViewers?.(container);
        container.removeEventListener("click", handleClick);
        if (panelHost) {
          panelHost.removeEventListener("click", handleClick);
          panelHost.innerHTML = "";
          if (externalPanelStyle) Object.assign(panelHost.style, externalPanelStyle);
        }
        const style = document.getElementById(`${sceneId}-style`);
        if (style) style.remove();
      };
    },

    unmount: function unmount(container) {
      if (container && typeof container.__bioSceneCleanup === "function") {
        container.__bioSceneCleanup();
        delete container.__bioSceneCleanup;
      }
      if (container) container.innerHTML = "";
    }
  };
})();

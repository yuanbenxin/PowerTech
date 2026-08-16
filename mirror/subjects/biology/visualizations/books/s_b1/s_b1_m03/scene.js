window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["s_b1_m03"] = (function () {
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

  const MODELS = {
    "plant-cell": {
      title: "植物细胞",
      label: "细胞壁 叶绿体 大液泡",
      accent: "#22c55e",
      src: "assets/models/plant-cell.glb?v=2e840d901a7e",
      cover: "assets/images/plant-cell.jpg?v=967c4505480e",
      alt: "植物细胞 3D 模型",
      cameraOrbit: "38deg 70deg 128%",
      fieldOfView: "42deg",
      exposure: "0.95",
      shadowIntensity: "0.62",
      concept: "植物细胞是真核细胞，既有细胞膜、细胞质、细胞核等共有结构，又具有细胞壁、叶绿体和大型液泡等特有结构。",
      focus: ["细胞壁维持细胞形态并提供支持", "叶绿体把光能转化为有机物中的化学能", "大液泡参与渗透调节并维持细胞膨压"],
      compare: "重点比较植物细胞和动物细胞的共有结构与特有结构，理解结构差异如何服务于营养方式和生活方式。"
    },
    "animal-cell": {
      title: "动物细胞",
      label: "细胞膜 细胞核 膜性细胞器",
      accent: "#f43f5e",
      src: "assets/models/animal-cell.glb?v=42ca8478bddc",
      cover: "assets/images/animal-cell.jpg?v=2806b7572ccb",
      alt: "动物细胞 3D 模型",
      cameraOrbit: "40deg 70deg 125%",
      fieldOfView: "42deg",
      exposure: "0.92",
      shadowIntensity: "0.66",
      concept: "动物细胞没有细胞壁和叶绿体，细胞形态更灵活，细胞内膜系统和细胞骨架共同支撑复杂的物质运输与生命活动。",
      focus: ["细胞膜控制物质进出并参与信息交流", "细胞核储存遗传信息并控制代谢活动", "内质网、高尔基体和囊泡构成重要运输网络"],
      compare: "动物细胞适合讲解膜结构、分泌蛋白运输、细胞器分工和细胞整体协调。"
    },
    mitochondrion: {
      title: "线粒体",
      label: "有氧呼吸 ATP 合成",
      accent: "#fb923c",
      src: "assets/models/mitochondrion.glb?v=a99693b04cdf",
      cover: "assets/images/mitochondrion.jpg?v=6e0a4271f88e",
      alt: "线粒体 3D 模型",
      cameraOrbit: "-30deg 68deg 112%",
      fieldOfView: "38deg",
      exposure: "1",
      shadowIntensity: "0.72",
      concept: "线粒体是有氧呼吸的主要场所，双层膜结构和内膜折叠形成的嵴扩大了反应面积，有利于 ATP 的高效合成。",
      focus: ["外膜控制整体边界，内膜高度折叠形成嵴", "基质中含少量 DNA、RNA 和核糖体", "有氧呼吸释放的能量大多用于合成 ATP"],
      compare: "与叶绿体对比时，要抓住双层膜、自主遗传物质和能量转换方向的差异。"
    },
    chloroplast: {
      title: "叶绿体",
      label: "类囊体 光合作用",
      accent: "#84cc16",
      src: "assets/models/chloroplast.glb?v=66e9f7ba98dc",
      cover: "assets/images/chloroplast.jpg?v=daf373732740",
      alt: "叶绿体 3D 模型",
      cameraOrbit: "28deg 64deg 112%",
      fieldOfView: "38deg",
      exposure: "1.02",
      shadowIntensity: "0.68",
      concept: "叶绿体是绿色植物进行光合作用的主要场所，类囊体膜上分布着光合色素和相关酶，基质中进行有机物合成。",
      focus: ["双层膜包裹内部基质和类囊体系统", "类囊体堆叠成基粒，显著扩大膜面积", "光能最终转化为有机物中的稳定化学能"],
      compare: "叶绿体适合承接光合作用内容，也能与线粒体一起讲解细胞内能量转换。"
    }
  };

  const MODEL_ORDER = ["plant-cell", "animal-cell", "mitochondrion", "chloroplast"];

  const TASKS = [
    {
      id: "endomembrane",
      title: "生物膜系统",
      label: "结构联系",
      accent: "#38bdf8",
      imageRelativeUrl: "assets/images/endomembrane-system-square.png?v=7a7a01d18afb",
      summary: "细胞膜、核膜、内质网膜、高尔基体膜、溶酶体膜和囊泡膜等共同构成生物膜系统，使细胞内部形成相对独立又相互联系的功能区。",
      prompt: "观察时先找核膜、粗面内质网、高尔基体和囊泡，再思考它们为什么都属于膜性结构，以及膜之间如何通过囊泡实现物质转运。",
      checks: ["生物膜系统不包括核糖体和中心体", "膜结构让代谢反应在不同区域有序进行", "膜成分和膜面积会随物质运输动态变化"],
      deepPoint: "高中重点不是只记名称，而是理解膜系统如何提高细胞内反应效率，并维持细胞内部环境的相对稳定。"
    },
    {
      id: "secretory",
      title: "分泌蛋白路径",
      label: "合成与运输",
      accent: "#a855f7",
      imageRelativeUrl: "assets/images/secretory-pathway-square.png?v=c756726803c6",
      summary: "分泌蛋白通常在附着于粗面内质网的核糖体上合成，经内质网初步加工，再由囊泡运输到高尔基体进一步修饰、分类和包装，最后通过囊泡与细胞膜融合排出细胞。",
      prompt: "把路径按顺序拆开：核糖体合成肽链 -> 内质网加工运输 -> 高尔基体修饰分拣 -> 囊泡转运 -> 细胞膜胞吐。",
      checks: ["核糖体本身没有膜结构", "内质网和高尔基体之间常通过囊泡转运", "线粒体为蛋白质合成和运输提供能量"],
      deepPoint: "分泌蛋白路径体现了细胞器的分工与协调，是理解细胞整体性的典型例子。"
    },
    {
      id: "energy",
      title: "能量转换细胞器",
      label: "线粒体与叶绿体",
      accent: "#f59e0b",
      imageRelativeUrl: "assets/images/energy-organelles-square.png?v=050759d50f5c",
      summary: "线粒体通过有氧呼吸释放有机物中的能量并合成 ATP，叶绿体通过光合作用把光能转化为有机物中的化学能。二者都具有双层膜，并含有少量 DNA 和核糖体。",
      prompt: "比较时抓住三个维度：膜结构、能量转化方向、发生的主要生命活动。不要把线粒体简单理解为产生能量，而要说它合成 ATP。",
      checks: ["线粒体和叶绿体都属于半自主性细胞器", "线粒体普遍存在于真核细胞，叶绿体主要存在于绿色植物细胞", "能量流动与物质变化总是同步发生"],
      deepPoint: "双层膜和内部膜系统都是结构与功能相适应的证据，常用于解释反应面积、酶分布和能量转换效率。"
    },
    {
      id: "comparison",
      title: "动植物细胞器比较",
      label: "共有与特有",
      accent: "#10b981",
      imageRelativeUrl: "assets/images/plant-animal-comparison-square.png?v=86f3a47e2522",
      summary: "动植物细胞都是真核细胞，共有细胞膜、细胞质、细胞核、线粒体、内质网、高尔基体和核糖体等结构。植物细胞通常还具有细胞壁、叶绿体和大型液泡。",
      prompt: "先区分共有结构，再判断特有结构；答题时要注意并非所有植物细胞都有叶绿体，例如根尖细胞通常没有叶绿体。",
      checks: ["细胞壁不是生物膜系统的一部分", "叶绿体不是所有植物细胞都具有", "中心体常见于动物细胞和低等植物细胞"],
      deepPoint: "比较题的核心是用结构解释功能，例如植物细胞固定形态、自养生活和渗透调节，与相应结构密切相关。"
    }
  ];

  const QUIZ = {
    question: "下列哪一组顺序最符合分泌蛋白的合成和运输路径？",
    options: [
      { id: "wrong-mito", text: "线粒体 -> 高尔基体 -> 细胞膜 -> 核糖体", correct: false },
      { id: "right-secretory", text: "核糖体 -> 内质网 -> 高尔基体 -> 囊泡 -> 细胞膜", correct: true },
      { id: "wrong-chloro", text: "叶绿体 -> 核膜 -> 中心体 -> 细胞壁", correct: false }
    ]
  };

  const VIEWPOINTS = [
    { id: "overview", label: "整体", orbitDelta: 0, fovOffset: 0 },
    { id: "upper", label: "俯视", orbit: "0deg 38deg 120%", fov: "40deg" },
    { id: "side", label: "侧面", orbit: "86deg 72deg 118%", fov: "42deg" }
  ];

  return {
    mount: function mount(container, context) {
      const sceneId = "senior-organelle-" + Math.random().toString(36).slice(2, 9);
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
        activeModel: "plant-cell",
        activeTask: "endomembrane",
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

      function resolveModelSource(source) {
        const rawUrl = `${assetBase}${source}`;
        if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
          return window.BiologyApp.resolveBiologyModelVariantSource(rawUrl);
        }
        return resolveAssetUrl(source);
      }

      function setViewerModelSource(viewer, source) {
        if (!viewer) return "";
        const rawUrl = `${assetBase}${source}`;
        if (window.BiologyApp && typeof window.BiologyApp.setBiologyModelViewerSource === "function") {
          return window.BiologyApp.setBiologyModelViewerSource(viewer, rawUrl);
        }
        const modelSrc = resolveModelSource(source);
        if (viewer.getAttribute("src") !== modelSrc) {
          viewer.setAttribute("src", modelSrc);
        }
        return modelSrc;
      }

      function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = String(hex || "#38bdf8").replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "56, 189, 248";
      }

      function getActiveModel() {
        return MODELS[state.activeModel] || MODELS["plant-cell"];
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

      function renderFocusList(model) {
        return (model.focus || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
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
            background: #061017;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }

          [data-scope="${sceneId}"] * {
            box-sizing: border-box;
          }

          [data-scope="${sceneId}"] .organelle-stage {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            padding: 12px;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .organelle-stage__frame {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(148, 163, 184, 0.18);
            background:
              linear-gradient(140deg, rgba(6, 24, 32, 0.98), rgba(9, 19, 36, 0.98) 42%, rgba(18, 28, 22, 0.98)),
              repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.045) 0 1px, transparent 1px 42px);
            box-shadow: inset 0 0 90px rgba(20, 184, 166, 0.08), 0 24px 70px rgba(0, 0, 0, 0.46);
          }

          [data-scope="${sceneId}"] .organelle-stage__mesh {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            opacity: 0.22;
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 44px 44px;
            mask-image: linear-gradient(180deg, transparent, #000 14%, #000 82%, transparent);
          }

          [data-scope="${sceneId}"] .organelle-stage__viewerWrap {
            position: absolute;
            inset: 0;
            z-index: 2;
          }

          [data-scope="${sceneId}"] .organelle-stage__viewer {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            --poster-color: transparent;
          }

          [data-scope="${sceneId}"] .organelle-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            background: rgba(2, 6, 23, 0.8);
            color: rgba(248, 250, 252, 0.72);
            font-size: 13px;
            line-height: 1.4;
            font-weight: 900;
            letter-spacing: 0.08em;
          }

          [data-scope="${sceneId}"] .organelle-stage__controls {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            z-index: 6;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .organelle-stage__legend {
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          [data-scope="${sceneId}"] .organelle-stage__chip {
            min-height: 30px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 7px 10px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.58);
            color: rgba(226, 232, 240, 0.9);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 850;
            backdrop-filter: blur(12px);
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .organelle-stage__dot {
            width: 8px;
            height: 8px;
            flex: none;
            border-radius: 999px;
            background: var(--dot-color);
            box-shadow: 0 0 14px var(--dot-color);
          }

          [data-scope="${sceneId}"] .organelle-stage__buttonRow {
            flex: none;
            display: flex;
            gap: 8px;
            pointer-events: auto;
          }

          [data-scope="${sceneId}"] .organelle-stage__controlBtn {
            width: 42px;
            height: 42px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(15, 23, 42, 0.68);
            color: rgba(248, 250, 252, 0.84);
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: transform 160ms ease, color 160ms ease, border-color 160ms ease, background 160ms ease;
            padding: 0;
            -webkit-tap-highlight-color: transparent;
          }

          [data-scope="${sceneId}"] .organelle-stage__controlBtn svg {
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .organelle-stage__controlBtn:hover,
          [data-scope="${sceneId}"] .organelle-stage__controlBtn.is-active {
            transform: translateY(-1px);
            border-color: var(--task-accent, #38bdf8);
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
            color: #fff;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalOverlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            background: rgba(2, 6, 23, 0.7);
            backdrop-filter: blur(20px) saturate(150%);
            opacity: 0;
            pointer-events: none;
            visibility: hidden;
            overscroll-behavior: contain;
            touch-action: pan-y;
            transition: opacity 0.26s ease, visibility 0.26s ease;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalOverlay.is-open {
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalContent {
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
            border: 1.5px solid rgba(56, 189, 248, 0.28);
            background: rgba(6, 15, 22, 0.96);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px rgba(56, 189, 248, 0.1);
            transform: scale(0.96) translateY(12px);
            transition: transform 0.26s ease;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalOverlay.is-open .organelle-stage__modalContent {
            transform: scale(1) translateY(0);
          }

          [data-scope="${sceneId}"] .organelle-stage__modalClose {
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
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.06);
            color: rgba(255, 255, 255, 0.78);
            cursor: pointer;
            padding: 0;
            pointer-events: auto;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition: transform 160ms ease, color 160ms ease, background 160ms ease, border-color 160ms ease;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalClose svg {
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalClose:hover {
            color: #fff;
            background: rgba(239, 68, 68, 0.18);
            border-color: rgba(239, 68, 68, 0.34);
            transform: rotate(90deg) scale(1.04);
          }

          [data-scope="${sceneId}"] .organelle-stage__modalGrid {
            height: 100%;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 40px;
            align-items: center;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalImageShell {
            position: relative;
            width: 100%;
            max-height: 520px;
            aspect-ratio: 1;
            margin: 0 auto;
            overflow: hidden;
            border-radius: 24px;
            border: 1.5px solid rgba(255, 255, 255, 0.12);
            background: rgba(0, 0, 0, 0.38);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
          }

          [data-scope="${sceneId}"] .organelle-stage__modalImage {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalImageGlow {
            position: absolute;
            inset: 0;
            border-radius: 22px;
            pointer-events: none;
            box-shadow: inset 0 0 45px rgba(var(--glow-color-rgb), 0.24);
          }

          [data-scope="${sceneId}"] .organelle-stage__modalDetails {
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

          [data-scope="${sceneId}"] .organelle-stage__modalDetails::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalEyebrow {
            width: fit-content;
            max-width: 100%;
            display: inline-flex;
            align-items: center;
            min-height: 26px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(56, 189, 248, 0.12);
            color: #38bdf8;
            font-size: 11px;
            line-height: 1.2;
            font-weight: 900;
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalTitle {
            margin: 10px 0 0;
            color: #f8fafc;
            font-size: 31px;
            line-height: 1.16;
            font-weight: 950;
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalSummary,
          [data-scope="${sceneId}"] .organelle-stage__modalPrompt,
          [data-scope="${sceneId}"] .organelle-stage__modalDeep,
          [data-scope="${sceneId}"] .organelle-stage__modalChecks li {
            color: rgba(226, 232, 240, 0.82);
            font-size: 14px;
            line-height: 1.72;
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalPrompt,
          [data-scope="${sceneId}"] .organelle-stage__modalDeep {
            margin: 0;
            padding: 14px 16px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(15, 23, 42, 0.56);
          }

          [data-scope="${sceneId}"] .organelle-stage__modalSectionTitle {
            margin: 0 0 8px;
            color: var(--task-accent, #38bdf8);
            font-size: 13px;
            line-height: 1.2;
            font-weight: 950;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalChecks {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalChecks li {
            position: relative;
            padding-left: 18px;
          }

          [data-scope="${sceneId}"] .organelle-stage__modalChecks li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.68em;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--task-accent, #38bdf8);
            box-shadow: 0 0 12px var(--task-accent, #38bdf8);
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

          .panel-${sceneId}::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }

          .panel-${sceneId} * {
            box-sizing: border-box;
          }

          .panel-${sceneId} .p-card {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 14px;
            border-radius: 8px;
            border: 1px solid rgba(148, 163, 184, 0.14);
            background: rgba(8, 18, 28, 0.72);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
            min-width: 0;
          }

          .panel-${sceneId} .p-eyebrow {
            color: rgba(148, 163, 184, 0.84);
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
            color: rgba(226, 232, 240, 0.78);
            font-size: 13px;
            line-height: 1.62;
            overflow-wrap: anywhere;
          }

          .panel-${sceneId} .p-modelGrid,
          .panel-${sceneId} .p-taskGrid,
          .panel-${sceneId} .p-viewGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
            min-width: 0;
          }

          .panel-${sceneId} .p-model,
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
            border: 1px solid rgba(148, 163, 184, 0.16);
            background: rgba(15, 23, 42, 0.62);
            color: rgba(248, 250, 252, 0.86);
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

          .panel-${sceneId} .p-model,
          .panel-${sceneId} .p-task {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
          }

          .panel-${sceneId} .p-model strong,
          .panel-${sceneId} .p-task strong {
            color: currentColor;
            font-size: 13px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }

          .panel-${sceneId} .p-model span,
          .panel-${sceneId} .p-task span {
            color: rgba(203, 213, 225, 0.62);
            font-size: 11px;
            line-height: 1.28;
            font-weight: 750;
            overflow-wrap: anywhere;
          }

          .panel-${sceneId} .p-model:hover,
          .panel-${sceneId} .p-task:hover,
          .panel-${sceneId} .p-view:hover,
          .panel-${sceneId} .p-action:hover,
          .panel-${sceneId} .p-quizOption:hover,
          .panel-${sceneId} .p-model.is-active,
          .panel-${sceneId} .p-task.is-active,
          .panel-${sceneId} .p-view.is-active,
          .panel-${sceneId} .p-action.is-active,
          .panel-${sceneId} .p-quizOption.is-selected {
            transform: translateY(-1px);
            border-color: var(--item-accent, var(--task-accent, #38bdf8));
            background: color-mix(in srgb, var(--item-accent, var(--task-accent, #38bdf8)) 16%, rgba(15, 23, 42, 0.74));
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
            background: var(--task-accent, #38bdf8);
            box-shadow: 0 0 12px var(--task-accent, #38bdf8);
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
            border: 1px solid rgba(148, 163, 184, 0.12);
            background: rgba(2, 6, 23, 0.35);
          }

          .panel-${sceneId} .p-flowLine span {
            color: var(--task-accent, #38bdf8);
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
            border: 1px solid rgba(148, 163, 184, 0.12);
            background: rgba(2, 6, 23, 0.35);
          }

          .panel-${sceneId} .p-feedback.is-correct {
            color: #bbf7d0;
            border-color: rgba(34, 197, 94, 0.28);
            background: rgba(34, 197, 94, 0.1);
          }

          .panel-${sceneId} .p-feedback.is-wrong {
            color: #fecaca;
            border-color: rgba(248, 113, 113, 0.28);
            background: rgba(248, 113, 113, 0.1);
          }

          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .organelle-stage {
              padding: 8px;
            }

            [data-scope="${sceneId}"] .organelle-stage__frame {
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .organelle-stage__controls {
              left: 10px;
              right: 10px;
              bottom: 10px;
              align-items: flex-end;
            }

            [data-scope="${sceneId}"] .organelle-stage__legend {
              max-width: calc(100% - 100px);
            }

            [data-scope="${sceneId}"] .organelle-stage__chip {
              min-height: 28px;
              font-size: 10.5px;
              padding: 6px 9px;
            }

            [data-scope="${sceneId}"] .organelle-stage__controlBtn {
              width: 40px;
              height: 40px;
              border-radius: 13px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalOverlay {
              align-items: flex-start;
              padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalContent {
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

            [data-scope="${sceneId}"] .organelle-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalClose {
              position: fixed;
              top: max(14px, env(safe-area-inset-top));
              right: max(14px, env(safe-area-inset-right));
              width: 42px;
              height: 42px;
              min-width: 42px;
              min-height: 42px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalGrid {
              height: auto;
              min-height: 0;
              grid-template-columns: 1fr;
              gap: 16px;
              align-items: start;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalImageShell {
              width: min(100%, 300px);
              max-width: 300px;
              max-height: none;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalDetails {
              height: auto;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalSummary,
            [data-scope="${sceneId}"] .organelle-stage__modalPrompt,
            [data-scope="${sceneId}"] .organelle-stage__modalDeep,
            [data-scope="${sceneId}"] .organelle-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.52;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .organelle-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .organelle-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalImageShell {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }

            .panel-${sceneId} .p-modelGrid,
            .panel-${sceneId} .p-taskGrid,
            .panel-${sceneId} .p-viewGrid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .organelle-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .organelle-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalImageShell {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
            }

            [data-scope="${sceneId}"] .organelle-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const model = getActiveModel();
        const task = getActiveTask();
        container.setAttribute("data-scope", sceneId);
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        container.innerHTML = `
          <div class="organelle-stage">
            <div class="organelle-stage__frame">
              <div class="organelle-stage__mesh"></div>
              <div class="organelle-stage__viewerWrap">
                <model-viewer
                  class="organelle-stage__viewer"
                  data-role="model-viewer"
                  src="${escapeHtml(resolveModelSource(model.src))}"
                  draco-decoder-url="${escapeHtml(assetBase)}assets/draco/"
                  camera-controls
                  interaction-prompt="none"
                  shadow-intensity="${escapeHtml(model.shadowIntensity)}"
                  exposure="${escapeHtml(model.exposure)}"
                  environment-image="neutral"
                  loading="eager"
                  field-of-view="${escapeHtml(model.fieldOfView)}"
                  min-field-of-view="12deg"
                  max-field-of-view="82deg"
                  camera-orbit="${escapeHtml(model.cameraOrbit)}"
                  alt="${escapeHtml(model.alt)}">
                  <div class="organelle-stage__poster" slot="poster">模型加载中...</div>
                </model-viewer>
              </div>
              <div class="organelle-stage__controls">
                <div class="organelle-stage__legend" aria-label="细胞结构图例">
                  <div class="organelle-stage__chip"><span class="organelle-stage__dot" style="--dot-color:#22c55e"></span>细胞整体</div>
                  <div class="organelle-stage__chip"><span class="organelle-stage__dot" style="--dot-color:#a855f7"></span>内膜系统</div>
                  <div class="organelle-stage__chip"><span class="organelle-stage__dot" style="--dot-color:#f59e0b"></span>能量转换</div>
                </div>
                <div class="organelle-stage__buttonRow">
                  <button class="organelle-stage__controlBtn${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate" aria-label="自动旋转">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3.2-6.9"></path><path d="M21 4v6h-6"></path></svg>
                  </button>
                  <button class="organelle-stage__controlBtn" type="button" data-action="reset-camera" aria-label="复位视角">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2"></path><path d="M21 3v6h-6"></path><path d="M21 12a9 9 0 0 1-15.5 6.2"></path><path d="M3 21v-6h6"></path></svg>
                  </button>
                </div>
              </div>
              <div class="organelle-stage__modalOverlay" data-role="task-modal">
                <div class="organelle-stage__modalContent">
                  <button class="organelle-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="organelle-stage__modalGrid">
                    <div class="organelle-stage__modalImageShell">
                      <img class="organelle-stage__modalImage" data-role="modal-image" src="${escapeHtml(resolveAssetUrl(task.imageRelativeUrl))}" alt="${escapeHtml(task.title)}教学配图">
                      <div class="organelle-stage__modalImageGlow" data-role="modal-image-glow" style="--glow-color-rgb:${hexToRgb(task.accent)}"></div>
                    </div>
                    <div class="organelle-stage__modalDetails">
                      <div>
                        <span class="organelle-stage__modalEyebrow" data-role="modal-eyebrow">细胞结构与细胞器观察 · 深度讲解</span>
                        <h2 class="organelle-stage__modalTitle" data-role="modal-title">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="organelle-stage__modalSummary" data-role="modal-summary">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="organelle-stage__modalSectionTitle">观察提示</h3>
                        <p class="organelle-stage__modalPrompt" data-role="modal-prompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="organelle-stage__modalSectionTitle">知识要点</h3>
                        <ul class="organelle-stage__modalChecks" data-role="modal-checks">${renderChecks(task)}</ul>
                      </div>
                      <div>
                        <h3 class="organelle-stage__modalSectionTitle">高中深化</h3>
                        <p class="organelle-stage__modalDeep" data-role="modal-deep">${escapeHtml(task.deepPoint)}</p>
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
        const model = getActiveModel();
        const task = getActiveTask();
        const modelButtons = MODEL_ORDER.map(key => {
          const item = MODELS[key];
          return `
            <button class="p-model${key === state.activeModel ? " is-active" : ""}" type="button" data-action="select-model" data-value="${escapeHtml(key)}" style="--item-accent:${escapeHtml(item.accent)}">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.label)}</span>
            </button>
          `;
        }).join("");
        const viewButtons = VIEWPOINTS.map(item => `
          <button class="p-view${item.id === state.activeView ? " is-active" : ""}" type="button" data-action="select-view" data-value="${escapeHtml(item.id)}">
            ${escapeHtml(item.label)}
          </button>
        `).join("");
        const taskButtons = TASKS.map(item => `
          <button class="p-task${item.id === state.activeTask ? " is-active" : ""}" type="button" data-action="select-task" data-value="${escapeHtml(item.id)}" style="--item-accent:${escapeHtml(item.accent)}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.label)}</span>
          </button>
        `).join("");
        const quizOptions = QUIZ.options.map(option => `
          <button class="p-quizOption${state.quizAnswer === option.id ? " is-selected" : ""}" type="button" data-action="answer-quiz" data-value="${escapeHtml(option.id)}">
            ${escapeHtml(option.text)}
          </button>
        `).join("");

        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--task-accent:${escapeHtml(task.accent)}; --task-accent-soft:${escapeHtml(task.accent)}26">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <div class="p-modelGrid">${modelButtons}</div>
              <div class="p-actionRow">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">自动旋转</button>
                <button class="p-action" type="button" data-action="reset-camera">复位视角</button>
              </div>
              <div class="p-viewGrid">${viewButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">当前模型</span>
              <h2 class="p-title" data-role="model-title">${escapeHtml(model.title)}</h2>
              <p class="p-desc" data-role="model-concept">${escapeHtml(model.concept)}</p>
              <ul class="p-checkList" data-role="model-focus">${renderFocusList(model)}</ul>
              <div class="p-flow">
                <div class="p-flowLine">
                  <span>讲解重点</span>
                  <strong data-role="model-compare">${escapeHtml(model.compare)}</strong>
                </div>
              </div>
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
              <span class="p-eyebrow">核心链路</span>
              <div class="p-flow">
                <div class="p-flowLine"><span>生物膜系统</span><strong>核膜、内质网膜、高尔基体膜、囊泡膜和细胞膜在结构与功能上连续协作。</strong></div>
                <div class="p-flowLine"><span>分泌蛋白</span><strong>核糖体 -> 内质网 -> 高尔基体 -> 囊泡 -> 细胞膜，线粒体提供能量。</strong></div>
                <div class="p-flowLine"><span>能量转换</span><strong>叶绿体把光能转化为有机物中的化学能，线粒体把有机物中的能量转化为 ATP 中的能量。</strong></div>
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
        const model = getActiveModel();
        const task = getActiveTask();
        panel.style.setProperty("--task-accent", task.accent);
        panel.style.setProperty("--task-accent-soft", `${task.accent}26`);

        panel.querySelectorAll("[data-action='select-model']").forEach(button => {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.activeModel);
        });
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

        const modelTitle = panel.querySelector('[data-role="model-title"]');
        const modelConcept = panel.querySelector('[data-role="model-concept"]');
        const modelFocus = panel.querySelector('[data-role="model-focus"]');
        const modelCompare = panel.querySelector('[data-role="model-compare"]');
        const taskTitle = panel.querySelector('[data-role="task-title"]');
        const taskPrompt = panel.querySelector('[data-role="task-prompt"]');
        const taskChecks = panel.querySelector('[data-role="task-checks"]');
        const quizFeedback = panel.querySelector('[data-role="quiz-feedback"]');

        if (modelTitle) modelTitle.textContent = model.title;
        if (modelConcept) modelConcept.textContent = model.concept;
        if (modelFocus) modelFocus.innerHTML = renderFocusList(model);
        if (modelCompare) modelCompare.textContent = model.compare;
        if (taskTitle) taskTitle.textContent = task.title;
        if (taskPrompt) taskPrompt.textContent = task.prompt;
        if (taskChecks) taskChecks.innerHTML = renderChecks(task);
        if (quizFeedback) {
          quizFeedback.textContent = state.quizFeedback || "选择一个答案后，这里会给出即时反馈。";
          quizFeedback.classList.toggle("is-correct", state.quizAnswer === "right-secretory");
          quizFeedback.classList.toggle("is-wrong", Boolean(state.quizAnswer && state.quizAnswer !== "right-secretory"));
        }
      }

      function applyModelAndCamera() {
        const viewer = findViewer();
        if (!viewer) return;
        const model = getActiveModel();
        const view = VIEWPOINTS.find(item => item.id === state.activeView) || VIEWPOINTS[0];
        setViewerModelSource(viewer, model.src);
        viewer.setAttribute("draco-decoder-url", `${assetBase}assets/draco/`);
        viewer.setAttribute("camera-orbit", view.orbit || model.cameraOrbit);
        viewer.setAttribute("field-of-view", view.fov || model.fieldOfView);
        viewer.setAttribute("shadow-intensity", model.shadowIntensity);
        viewer.setAttribute("exposure", model.exposure);
        viewer.setAttribute("alt", model.alt);
        if (state.autoRotate) {
          viewer.setAttribute("auto-rotate", "");
          viewer.setAttribute("auto-rotate-delay", "0");
          viewer.setAttribute("rotation-per-second", isMobileModelTarget ? "9deg" : "18deg");
        } else {
          viewer.removeAttribute("auto-rotate");
        }
        if (typeof viewer.jumpCameraToGoal === "function") {
          try {
            viewer.jumpCameraToGoal();
          } catch (error) {
            // The viewer may still be preparing the newly selected model.
          }
        }

        const stageButtons = container.querySelectorAll("[data-action='toggle-auto-rotate']");
        stageButtons.forEach(button => button.classList.toggle("is-active", state.autoRotate));
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
        const content = overlay.querySelector(".organelle-stage__modalContent");

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
          content.style.boxShadow = `0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px ${task.accent}14`;
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

        if (action === "select-model") {
          if (!MODELS[value]) return;
          state.activeModel = value;
          state.activeView = "overview";
          applyModelAndCamera();
          updatePanel();
          return;
        }

        if (action === "select-view") {
          if (!VIEWPOINTS.some(item => item.id === value)) return;
          state.activeView = value;
          applyModelAndCamera();
          updatePanel();
          return;
        }

        if (action === "select-task") {
          if (!TASKS.some(item => item.id === value)) return;
          state.activeTask = value;
          state.showModal = true;
          updateModal();
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
            ? "判断正确。分泌蛋白的合成和运输体现了核糖体、内质网、高尔基体、囊泡和细胞膜之间的分工协作。"
            : "再核对一次路径。分泌蛋白先由核糖体合成，再经内质网和高尔基体加工、包装，最后通过囊泡运输到细胞膜。";
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
        if (window.BiologyApp && typeof window.BiologyApp.enhanceBiologyModelViewerProgress === "function") {
          window.BiologyApp.enhanceBiologyModelViewerProgress(container);
        }
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
      if (container) {
        container.innerHTML = "";
      }
    }
  };
})();

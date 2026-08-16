window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7b_m04"] = (function () {
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
      id: "components",
      title: "血液成分",
      label: "分层辨认",
      accent: "#f43f5e",
      summary: "血液由血浆和血细胞组成。加入抗凝剂后静置或离心，可看到血浆、白细胞和血小板薄层、红细胞三层。",
      prompt: "观察时先区分上层淡黄色血浆、中间很薄的白细胞和血小板层、下层暗红色红细胞层，再联系各自功能。",
      checks: ["血浆主要运输养料、废物和血细胞", "红细胞数量最多，主要运输氧气", "白细胞和血小板位于中间薄层"],
      imageRelativeUrl: "assets/images/blood-components-square.png?v=91f309d85486"
    },
    {
      id: "vessels",
      title: "三类血管",
      label: "结构比较",
      accent: "#38bdf8",
      summary: "动脉、静脉和毛细血管在管壁厚度、弹性、血流速度和功能上不同，结构与功能相适应。",
      prompt: "比较三类血管时，抓住动脉管壁厚、静脉管腔大且有静脉瓣、毛细血管壁薄且只允许红细胞单行通过。",
      checks: ["动脉把血液从心脏输送到全身", "静脉把血液从身体各处送回心脏", "毛细血管适合进行物质交换"],
      imageRelativeUrl: "assets/images/blood-vessels-square.png?v=704171e48f26"
    },
    {
      id: "platelet",
      title: "血小板止血",
      label: "凝血过程",
      accent: "#facc15",
      summary: "血管受损后，血小板会在伤口处聚集并释放凝血相关物质，帮助形成纤维蛋白网和血凝块。",
      prompt: "讲解时按顺序梳理：血管破损、血小板黏附聚集、纤维蛋白网形成、血细胞被网住并逐渐封闭伤口。",
      checks: ["血小板体积小，没有细胞核", "血小板参与止血和凝血", "血凝块能减少继续出血"],
      imageRelativeUrl: "assets/images/platelet-clotting-square.png?v=db86a6edb48e"
    },
    {
      id: "exchange",
      title: "毛细血管交换",
      label: "物质交换",
      accent: "#22c55e",
      summary: "毛细血管壁很薄，管腔很细，红细胞单行通过，有利于血液与组织细胞之间交换物质。",
      prompt: "让学生说出交换方向：氧气和营养物质从血液进入组织细胞，二氧化碳等代谢废物从组织细胞进入血液。",
      checks: ["毛细血管壁通常只由一层上皮细胞构成", "红细胞单行通过使交换距离更短", "物质交换依靠浓度差等方式完成"],
      imageRelativeUrl: "assets/images/capillary-exchange-square.png?v=96be640e1d0b"
    }
  ];

  const MODELS = {
    "circulatory-system": {
      title: "血液循环系统",
      label: "全身血管与心脏",
      src: {
        desktop: "assets/models/circulatory-system.glb?v=7e11b28fd256",
        tablet: "assets/models/circulatory-system.tablet.glb?v=75479f907ca6",
        mobile: "assets/models/circulatory-system.mobile.glb?v=c78123bcdcc6"
      },
      alt: "血液循环系统 3D 模型",
      accent: "#38bdf8",
      cameraOrbit: "0deg 75deg 132%",
      fieldOfView: "30deg",
      exposure: "1.08",
      shadowIntensity: "0.48"
    },
    "platelet": {
      title: "血小板模型一",
      label: "聚集与表面结构",
      src: {
        desktop: "assets/models/platelet.glb?v=eee705acd278",
        tablet: "assets/models/platelet.tablet.glb?v=2e6c68784fea",
        mobile: "assets/models/platelet.mobile.glb?v=ae570eeef382"
      },
      alt: "血小板 3D 模型一",
      accent: "#f43f5e",
      cameraOrbit: "35deg 68deg 118%",
      fieldOfView: "42deg",
      exposure: "0.95",
      shadowIntensity: "0.72"
    },
    "platelet-2": {
      title: "血小板模型二",
      label: "多细胞形态",
      src: {
        desktop: "assets/models/platelet-2.glb?v=4fc738730c0b",
        tablet: "assets/models/platelet-2.tablet.glb?v=65ffcba817c9",
        mobile: "assets/models/platelet-2.mobile.glb?v=2ccc6d25cd64"
      },
      alt: "血小板 3D 模型二",
      accent: "#f97316",
      cameraOrbit: "-28deg 70deg 122%",
      fieldOfView: "42deg",
      exposure: "0.98",
      shadowIntensity: "0.72"
    },
    "platelet-3": {
      title: "血小板模型三",
      label: "轻量观察模型",
      src: "assets/models/platelet-3.glb?v=aeed2568ed8d",
      alt: "血小板 3D 模型三",
      accent: "#facc15",
      cameraOrbit: "0deg 66deg 108%",
      fieldOfView: "38deg",
      exposure: "1",
      shadowIntensity: "0.62"
    }
  };

  const CIRCULATORY_HOTSPOTS = [
    { slot: "aorta", label: "主动脉", position: "0.14m 1.48m 0.1m", normal: "0m 0m 1m", side: "right" },
    { slot: "heart", label: "心脏", position: "0.04m 1.24m 0.13m", normal: "0m 0m 1m", side: "right" },
    { slot: "superior-vena-cava", label: "上腔静脉", position: "-0.08m 1.56m 0.11m", normal: "0m 0m 1m", side: "left" },
    { slot: "inferior-vena-cava", label: "下腔静脉", position: "-0.06m 1.43m 0.12m", normal: "0m 0m 1m", side: "left" },
    { slot: "femoral-artery", label: "股动脉", position: "-0.18m 0.82m 0.11m", normal: "0m 0m 1m", side: "left" },
    { slot: "femoral-vein", label: "股静脉", position: "0.2m 0.82m 0.11m", normal: "0m 0m 1m", side: "right" }
  ];

  const FLOW_STEPS = [
    { label: "成分", text: "血浆负责运输，红细胞运输氧气，白细胞防御，血小板参与止血。" },
    { label: "血管", text: "动脉、静脉、毛细血管结构不同，分别适应输送、回流和交换。" },
    { label: "损伤", text: "血管破损时血小板会迅速聚集，启动止血和凝血过程。" },
    { label: "交换", text: "毛细血管壁薄、血流慢，便于血液与组织细胞交换物质。" }
  ];

  const QUIZ = {
    question: "红细胞只能单行通过，最适合进行物质交换的是哪一类血管？",
    options: [
      { id: "artery", text: "动脉", correct: false },
      { id: "vein", text: "静脉", correct: false },
      { id: "capillary", text: "毛细血管", correct: true }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "blood-vessel-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );

      let disposed = false;
      const state = {
        activeTask: "components",
        activeModel: isMobileModelTarget ? "platelet-3" : "circulatory-system",
        autoRotate: !isMobileModelTarget,
        quizAnswer: "",
        quizFeedback: "",
        showModal: false,
        preservePanelScroll: true
      };

      function resolveAssetUrl(relativeUrl) {
        const rawUrl = `${assetBase}${relativeUrl}`;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(rawUrl) : rawUrl;
      }

      function resolveModelSource(source) {
        if (source && typeof source === "object") {
          const withBase = {};
          Object.keys(source).forEach(key => {
            withBase[key] = `${assetBase}${source[key]}`;
          });
          if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
            return window.BiologyApp.resolveBiologyModelVariantSource(withBase);
          }
          return resolveAssetUrl(isMobileModelTarget ? (source.mobile || source.tablet || source.desktop) : source.desktop);
        }
        return resolveAssetUrl(source);
      }

      function setViewerModelSource(viewer, source) {
        if (!viewer) return "";
        if (source && typeof source === "object" && window.BiologyApp && typeof window.BiologyApp.setBiologyModelViewerSource === "function") {
          const withBase = {};
          Object.keys(source).forEach(key => {
            withBase[key] = `${assetBase}${source[key]}`;
          });
          return window.BiologyApp.setBiologyModelViewerSource(viewer, withBase);
        }
        const modelSrc = resolveModelSource(source);
        if (viewer.getAttribute("src") !== modelSrc) {
          window.BiologyApp?.releaseBiologyModelViewer?.(viewer);
          viewer.setAttribute("src", modelSrc);
        }
        return modelSrc;
      }

      function getActiveTask() {
        return TASKS.find(task => task.id === state.activeTask) || TASKS[0];
      }

      function getActiveModel() {
        return MODELS[state.activeModel] || MODELS.platelet;
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
            background: #020617;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }

          [data-scope="${sceneId}"] * {
            box-sizing: border-box;
          }

          [data-scope="${sceneId}"] .blood-stage {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            padding: 12px;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .blood-stage__frame {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(244, 63, 94, 0.22);
            background:
              radial-gradient(circle at 28% 26%, rgba(244, 63, 94, 0.22), transparent 32%),
              radial-gradient(circle at 78% 72%, rgba(56, 189, 248, 0.16), transparent 34%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
            box-shadow: inset 0 0 90px rgba(244, 63, 94, 0.08), 0 24px 70px rgba(0, 0, 0, 0.46);
          }

          [data-scope="${sceneId}"] .blood-stage__grid {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            opacity: 0.2;
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
            background-size: 42px 42px;
            mask-image: radial-gradient(circle at center, #000 32%, transparent 78%);
          }

          [data-scope="${sceneId}"] .blood-stage__viewerWrap {
            position: absolute;
            inset: 0;
            z-index: 2;
          }

          [data-scope="${sceneId}"] .blood-stage__viewer {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            --poster-color: transparent;
          }

          [data-scope="${sceneId}"] .blood-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            background: rgba(2, 6, 23, 0.78);
            color: rgba(248, 250, 252, 0.66);
            font-size: 13px;
            line-height: 1.4;
            font-weight: 900;
            letter-spacing: 0.08em;
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot {
            min-width: 54px;
            min-height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 5px 9px;
            border-radius: 10px;
            border: 1px solid rgba(226, 232, 240, 0.2);
            background: rgba(15, 23, 42, 0.76);
            box-shadow: 0 12px 26px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            color: rgba(248, 250, 252, 0.94);
            font-size: 12px;
            line-height: 1.1;
            font-weight: 900;
            white-space: nowrap;
            pointer-events: none;
            transform: translate(-50%, -50%);
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot::before {
            content: "";
            position: absolute;
            top: 50%;
            width: 28px;
            height: 1px;
            background: linear-gradient(90deg, rgba(56, 189, 248, 0.72), rgba(248, 250, 252, 0.1));
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot::after {
            content: "";
            position: absolute;
            top: calc(50% - 3px);
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: #38bdf8;
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.85);
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="left"] {
            transform: translate(calc(-100% - 32px), -50%);
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="left"]::before {
            left: 100%;
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="left"]::after {
            left: calc(100% + 26px);
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="right"] {
            transform: translate(32px, -50%);
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="right"]::before {
            right: 100%;
            transform: scaleX(-1);
          }

          [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="right"]::after {
            right: calc(100% + 26px);
          }

          [data-scope="${sceneId}"] .blood-stage__hud {
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 6;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .blood-stage__taskBadge {
            width: min(240px, calc(100vw - 48px));
            display: grid;
            gap: 7px;
            padding: 13px 14px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.62);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.34);
            backdrop-filter: blur(16px);
          }

          [data-scope="${sceneId}"] .blood-stage__taskLabel {
            color: rgba(248, 250, 252, 0.52);
            font-size: 10px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.16em;
          }

          [data-scope="${sceneId}"] .blood-stage__taskValue {
            min-width: 0;
            color: var(--task-accent, #f43f5e);
            font-size: 16px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .blood-stage__bottom {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            z-index: 6;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .blood-stage__legend {
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          [data-scope="${sceneId}"] .blood-stage__legendItem {
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
          }

          [data-scope="${sceneId}"] .blood-stage__dot {
            width: 8px;
            height: 8px;
            flex: none;
            border-radius: 999px;
            background: var(--dot-color);
            box-shadow: 0 0 14px var(--dot-color);
          }

          [data-scope="${sceneId}"] .blood-stage__controls {
            display: flex;
            flex: none;
            gap: 8px;
            pointer-events: auto;
          }

          [data-scope="${sceneId}"] .blood-stage__controlBtn {
            min-height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 12px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(15, 23, 42, 0.68);
            color: rgba(248, 250, 252, 0.84);
            font-size: 12px;
            line-height: 1;
            font-weight: 900;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: transform 160ms ease, color 160ms ease, border-color 160ms ease, background 160ms ease;
          }

          [data-scope="${sceneId}"] .blood-stage__controlBtn:hover,
          [data-scope="${sceneId}"] .blood-stage__controlBtn.is-active {
            transform: translateY(-1px);
            border-color: var(--task-accent, #f43f5e);
            background: var(--task-accent-soft, rgba(244, 63, 94, 0.16));
            color: #fff;
          }

          [data-scope="${sceneId}"] .blood-stage__modalOverlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            background: rgba(3, 7, 18, 0.68);
            backdrop-filter: blur(20px) saturate(150%);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            overscroll-behavior: contain;
            touch-action: pan-y;
            transition: opacity 0.26s ease, visibility 0.26s ease;
          }

          [data-scope="${sceneId}"] .blood-stage__modalOverlay.is-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }

          [data-scope="${sceneId}"] .blood-stage__modalContent {
            position: relative;
            isolation: isolate;
            width: 90%;
            max-width: 1100px;
            height: 85vh;
            max-height: 800px;
            display: flex;
            flex-direction: column;
            padding: 40px;
            overflow: hidden;
            border-radius: 32px;
            border: 1.5px solid var(--task-accent-soft, rgba(244, 63, 94, 0.24));
            background: rgba(12, 12, 18, 0.96);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px var(--task-accent-soft, rgba(244, 63, 94, 0.14));
            transform: scale(0.94) translateY(16px);
            transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          [data-scope="${sceneId}"] .blood-stage__modalOverlay.is-open .blood-stage__modalContent {
            transform: scale(1) translateY(0);
          }

          [data-scope="${sceneId}"] .blood-stage__modalClose {
            position: absolute;
            top: 24px;
            right: 24px;
            z-index: 80;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.055);
            color: rgba(255, 255, 255, 0.82);
            cursor: pointer;
            pointer-events: auto;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          [data-scope="${sceneId}"] .blood-stage__modalClose svg {
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .blood-stage__modalGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            height: 100%;
            min-height: 0;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .blood-stage__modalImageShell {
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
            min-height: 0;
            max-height: 520px;
            aspect-ratio: 1;
            margin: 0 auto;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
          }

          [data-scope="${sceneId}"] .blood-stage__modalImage {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
            transition: transform 0.5s ease;
          }

          [data-scope="${sceneId}"] .blood-stage__modalImageShell:hover .blood-stage__modalImage {
            transform: scale(1.02);
          }

          [data-scope="${sceneId}"] .blood-stage__modalImageShell::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 22px;
            box-shadow: inset 0 0 45px var(--task-accent-soft, rgba(244, 63, 94, 0.24));
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .blood-stage__modalDetails {
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: left;
            height: 100%;
            overflow-y: auto;
            padding-right: 16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          [data-scope="${sceneId}"] .blood-stage__modalDetails::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }

          [data-scope="${sceneId}"] .blood-stage__modalEyebrow {
            display: inline-flex;
            max-width: 100%;
            padding: 7px 11px;
            border-radius: 999px;
            background: var(--task-accent-soft, rgba(244, 63, 94, 0.16));
            color: var(--task-accent, #f43f5e);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 950;
            letter-spacing: 0.12em;
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .blood-stage__modalTitle {
            margin: 14px 0 0;
            color: #fff;
            font-size: 34px;
            line-height: 1.1;
            font-weight: 950;
            letter-spacing: 0;
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .blood-stage__modalSummary,
          [data-scope="${sceneId}"] .blood-stage__modalPrompt {
            margin: 0;
            color: rgba(226, 232, 240, 0.86);
            font-size: 15px;
            line-height: 1.75;
            font-weight: 760;
          }

          [data-scope="${sceneId}"] .blood-stage__modalPrompt {
            padding: 14px 16px;
            border-left: 3px solid var(--task-accent, #f43f5e);
            border-radius: 14px;
            background: rgba(2, 6, 23, 0.34);
          }

          [data-scope="${sceneId}"] .blood-stage__modalSectionTitle {
            margin: 0 0 10px;
            color: var(--task-accent, #f43f5e);
            font-size: 14px;
            line-height: 1.3;
            font-weight: 950;
          }

          [data-scope="${sceneId}"] .blood-stage__modalChecks {
            display: grid;
            gap: 10px;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          [data-scope="${sceneId}"] .blood-stage__modalChecks li {
            position: relative;
            min-height: 34px;
            padding: 9px 12px 9px 30px;
            border-radius: 13px;
            background: rgba(2, 6, 23, 0.34);
            color: rgba(248, 250, 252, 0.9);
            font-size: 13px;
            line-height: 1.45;
            font-weight: 850;
          }

          [data-scope="${sceneId}"] .blood-stage__modalChecks li::before {
            content: "";
            position: absolute;
            left: 12px;
            top: 16px;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--task-accent, #f43f5e);
            box-shadow: 0 0 12px var(--task-accent, #f43f5e);
          }

          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow-y: auto;
            padding: 12px;
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
            display: grid;
            gap: 10px;
            min-width: 0;
            padding: 14px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.09);
            background: rgba(15, 23, 42, 0.42);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          }

          .panel-${sceneId} .p-eyebrow {
            color: var(--task-accent, #f43f5e);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 950;
            letter-spacing: 0.14em;
          }

          .panel-${sceneId} .p-title {
            margin: 0;
            min-width: 0;
            color: #fff;
            font-size: 20px;
            line-height: 1.25;
            font-weight: 950;
            letter-spacing: 0;
            overflow-wrap: anywhere;
          }

          .panel-${sceneId} .p-desc {
            margin: 0;
            color: rgba(226, 232, 240, 0.76);
            font-size: 13px;
            line-height: 1.55;
            font-weight: 760;
          }

          .panel-${sceneId} .p-modelGrid,
          .panel-${sceneId} .p-taskGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .panel-${sceneId} .p-model,
          .panel-${sceneId} .p-task {
            appearance: none;
            min-width: 0;
            min-height: 58px;
            display: grid;
            align-content: center;
            gap: 4px;
            padding: 10px 12px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(2, 6, 23, 0.36);
            color: rgba(226, 232, 240, 0.82);
            text-align: left;
            cursor: pointer;
            transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
          }

          .panel-${sceneId} .p-model strong,
          .panel-${sceneId} .p-task strong {
            min-width: 0;
            color: #fff;
            font-size: 13px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }

          .panel-${sceneId} .p-model span,
          .panel-${sceneId} .p-task span {
            min-width: 0;
            color: rgba(226, 232, 240, 0.62);
            font-size: 11px;
            line-height: 1.25;
            font-weight: 850;
            overflow-wrap: anywhere;
          }

          .panel-${sceneId} .p-model:hover,
          .panel-${sceneId} .p-task:hover {
            transform: translateY(-1px);
          }

          .panel-${sceneId} .p-model.is-active,
          .panel-${sceneId} .p-task.is-active {
            border-color: var(--item-accent, var(--task-accent, #f43f5e));
            background: color-mix(in srgb, var(--item-accent, var(--task-accent, #f43f5e)) 18%, rgba(2, 6, 23, 0.44));
          }

          .panel-${sceneId} .p-actionRow {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(94px, 1fr));
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
            cursor: pointer;
          }

          .panel-${sceneId} .p-action.is-active {
            color: #fff;
            border-color: var(--task-accent, #f43f5e);
            background: var(--task-accent-soft, rgba(244, 63, 94, 0.16));
          }

          .panel-${sceneId} .p-checkList {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          .panel-${sceneId} .p-checkList li {
            min-height: 34px;
            padding: 9px 10px;
            border-radius: 12px;
            background: rgba(2, 6, 23, 0.32);
            color: rgba(226, 232, 240, 0.82);
            font-size: 12px;
            line-height: 1.45;
            font-weight: 800;
          }

          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .p-flowLine {
            display: grid;
            grid-template-columns: 54px minmax(0, 1fr);
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
            line-height: 1.2;
            font-weight: 900;
          }

          .panel-${sceneId} .p-flowLine strong {
            min-width: 0;
            color: #fff;
            font-size: 12.5px;
            line-height: 1.38;
            font-weight: 850;
            overflow-wrap: anywhere;
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
            cursor: pointer;
          }

          .panel-${sceneId} .p-quizOption.is-selected {
            border-color: var(--task-accent, #f43f5e);
            color: #fff;
            background: var(--task-accent-soft, rgba(244, 63, 94, 0.16));
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

          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .blood-stage__modalOverlay {
              align-items: center;
              padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .blood-stage__modalContent {
              width: min(calc(100vw - 48px), 520px);
              max-width: 520px;
              height: auto;
              max-height: min(90vh, 760px);
              max-height: min(90dvh, 760px);
              padding: 24px;
              border-radius: 28px;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .blood-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .blood-stage__modalClose {
              position: sticky;
              top: 0;
              align-self: flex-end;
              width: 40px;
              height: 40px;
              margin: -8px -8px -30px auto;
              border-radius: 14px;
              background: rgba(15, 23, 42, 0.72);
              border-color: rgba(255, 255, 255, 0.16);
              color: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(12px);
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
            }

            [data-scope="${sceneId}"] .blood-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 20px;
              height: auto;
              min-height: min-content;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .blood-stage__modalImageShell {
              width: min(100%, 320px);
              max-width: min(100%, 320px);
              height: auto;
              max-height: none;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .blood-stage__modalImage {
              aspect-ratio: 1;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalDetails {
              height: auto;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalTitle {
              font-size: 24px;
              line-height: 1.15;
            }

            [data-scope="${sceneId}"] .blood-stage__modalSummary,
            [data-scope="${sceneId}"] .blood-stage__modalPrompt,
            [data-scope="${sceneId}"] .blood-stage__modalChecks li {
              font-size: 12.5px;
            }

            [data-scope="${sceneId}"] .blood-stage {
              padding: 8px;
            }

            [data-scope="${sceneId}"] .blood-stage__frame {
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .blood-stage__hud {
              display: none;
            }

            [data-scope="${sceneId}"] .blood-stage__bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
            }

            [data-scope="${sceneId}"] .blood-stage__legend {
              max-width: 64%;
            }

            [data-scope="${sceneId}"] .blood-stage__legendItem {
              min-height: 28px;
              padding: 6px 8px;
              font-size: 10px;
            }

            [data-scope="${sceneId}"] .blood-stage__controlBtn {
              min-height: 34px;
              padding: 0 9px;
              font-size: 11px;
            }

            [data-scope="${sceneId}"] .blood-stage__hotspot {
              min-width: 46px;
              min-height: 22px;
              padding: 4px 7px;
              border-radius: 9px;
              font-size: 10.5px;
            }

            [data-scope="${sceneId}"] .blood-stage__hotspot::before {
              width: 18px;
            }

            [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="left"] {
              transform: translate(calc(-100% - 22px), -50%);
            }

            [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="left"]::after {
              left: calc(100% + 16px);
            }

            [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="right"] {
              transform: translate(22px, -50%);
            }

            [data-scope="${sceneId}"] .blood-stage__hotspot[data-side="right"]::after {
              right: calc(100% + 16px);
            }

            .panel-${sceneId} {
              padding: 10px;
              gap: 10px;
            }

            .panel-${sceneId} .p-card {
              padding: 10px;
              gap: 7px;
            }

            .panel-${sceneId} .p-modelGrid,
            .panel-${sceneId} .p-taskGrid {
              grid-template-columns: 1fr;
            }

            .panel-${sceneId} .p-title {
              font-size: 18px;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .blood-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
            }

            [data-scope="${sceneId}"] .blood-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 18px 16px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalClose {
              width: 44px;
              height: 44px;
              margin: -4px -4px -36px auto;
            }

            [data-scope="${sceneId}"] .blood-stage__modalGrid {
              gap: 16px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalImageShell {
              width: min(100%, 280px);
              max-width: min(100%, 280px);
            }

            [data-scope="${sceneId}"] .blood-stage__modalTitle {
              font-size: 22px;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .blood-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) 16px max(10px, env(safe-area-inset-bottom));
            }

            [data-scope="${sceneId}"] .blood-stage__modalContent {
              width: min(calc(100vw - 32px), 640px);
              max-width: 640px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 16px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalClose {
              width: 40px;
              height: 40px;
              margin: -4px -4px -32px auto;
            }

            [data-scope="${sceneId}"] .blood-stage__modalGrid {
              grid-template-columns: minmax(190px, 0.85fr) minmax(0, 1.15fr);
              align-items: start;
              gap: 16px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalImageShell {
              width: min(100%, 220px);
              max-width: min(100%, 220px);
            }

            [data-scope="${sceneId}"] .blood-stage__modalDetails {
              gap: 10px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalTitle {
              margin-top: 10px;
              font-size: 20px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalSummary,
            [data-scope="${sceneId}"] .blood-stage__modalPrompt,
            [data-scope="${sceneId}"] .blood-stage__modalChecks li {
              font-size: 12px;
              line-height: 1.45;
            }
          }

          /* Unified mobile/tablet layout for observation-task image popups. */
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .blood-stage__modalOverlay {
              align-items: center;
              justify-content: center;
              padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .blood-stage__modalContent {
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

            [data-scope="${sceneId}"] .blood-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .blood-stage__modalClose {
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

            [data-scope="${sceneId}"] .blood-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: start;
              height: auto;
              min-height: 0;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .blood-stage__modalImageShell {
              width: min(100%, 320px);
              max-width: 320px;
              height: auto;
              max-height: none;
              aspect-ratio: 1 / 1;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .blood-stage__modalImage {
              width: 100%;
              height: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalDetails {
              height: auto;
              min-height: 0;
              max-height: none;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
              overflow-wrap: anywhere;
            }

            [data-scope="${sceneId}"] .blood-stage__modalSummary,
            [data-scope="${sceneId}"] .blood-stage__modalPrompt,
            [data-scope="${sceneId}"] .blood-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.5;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .blood-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .blood-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalImageShell {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .blood-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .blood-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .blood-stage__modalImageShell {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .blood-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .blood-stage__modalDetails::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .blood-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .blood-stage__modalSummary,
            [data-scope="${sceneId}"] .blood-stage__modalPrompt,
            [data-scope="${sceneId}"] .blood-stage__modalChecks li {
              font-size: 12px;
              line-height: 1.45;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const task = getActiveTask();
        const model = getActiveModel();
        container.setAttribute("data-scope", sceneId);
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        container.innerHTML = `
          <div class="blood-stage">
            <div class="blood-stage__frame">
              <div class="blood-stage__grid"></div>
              <div class="blood-stage__viewerWrap">
                <model-viewer
                  class="blood-stage__viewer"
                  data-role="model-viewer"
                  src="${escapeHtml(resolveModelSource(model.src))}"
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
                  <div class="blood-stage__poster" slot="poster">模型加载中...</div>
                  ${renderModelHotspots(model)}
                </model-viewer>
              </div>
              <div class="blood-stage__hud">
                <div class="blood-stage__taskBadge">
                  <div class="blood-stage__taskLabel">当前观察任务</div>
                  <div class="blood-stage__taskValue" data-role="task-label">${escapeHtml(task.title)}</div>
                </div>
              </div>
              <div class="blood-stage__bottom">
                <div class="blood-stage__legend" aria-label="血液与血管图例">
                  <div class="blood-stage__legendItem"><span class="blood-stage__dot" style="--dot-color:#38bdf8"></span>循环系统</div>
                  <div class="blood-stage__legendItem"><span class="blood-stage__dot" style="--dot-color:#f43f5e"></span>血液成分</div>
                  <div class="blood-stage__legendItem"><span class="blood-stage__dot" style="--dot-color:#22c55e"></span>血管结构</div>
                  <div class="blood-stage__legendItem"><span class="blood-stage__dot" style="--dot-color:#facc15"></span>血小板</div>
                </div>
                <div class="blood-stage__controls">
                  <button class="blood-stage__controlBtn${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">旋转</button>
                  <button class="blood-stage__controlBtn" type="button" data-action="reset-camera">复位</button>
                </div>
              </div>
              <div class="blood-stage__modalOverlay${state.showModal ? " is-open" : ""}" data-role="task-modal">
                <div class="blood-stage__modalContent">
                  <button class="blood-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="blood-stage__modalGrid">
                    <div class="blood-stage__modalImageShell">
                      <img class="blood-stage__modalImage" data-role="modal-image" src="${escapeHtml(resolveAssetUrl(task.imageRelativeUrl))}" alt="${escapeHtml(task.title)}教学配图">
                    </div>
                    <div class="blood-stage__modalDetails">
                      <div>
                        <span class="blood-stage__modalEyebrow">血液与血管 · 教学观察</span>
                        <h2 class="blood-stage__modalTitle" data-role="modal-title">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="blood-stage__modalSummary" data-role="modal-summary">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="blood-stage__modalSectionTitle">学习提示</h3>
                        <p class="blood-stage__modalPrompt" data-role="modal-prompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="blood-stage__modalSectionTitle">知识要点</h3>
                        <ul class="blood-stage__modalChecks" data-role="modal-checks">${renderChecks(task)}</ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        applyModelAndCamera();
      }

      function renderModelButtons() {
        return Object.keys(MODELS).map(key => {
          const model = MODELS[key];
          return `
            <button
              class="p-model${key === state.activeModel ? " is-active" : ""}"
              type="button"
              data-action="select-model"
              data-value="${escapeHtml(key)}"
              style="--item-accent:${escapeHtml(model.accent)}">
              <strong>${escapeHtml(model.title)}</strong>
              <span>${escapeHtml(model.label)}</span>
            </button>
          `;
        }).join("");
      }

      function renderModelHotspots(model) {
        const desktopSrc = typeof model?.src === "object" ? model.src.desktop : model?.src;
        if (!desktopSrc || desktopSrc.indexOf("circulatory-system.glb") === -1) return "";
        return CIRCULATORY_HOTSPOTS.map(hotspot => `
          <button
            class="blood-stage__hotspot"
            slot="hotspot-${escapeHtml(hotspot.slot)}"
            data-position="${escapeHtml(hotspot.position)}"
            data-normal="${escapeHtml(hotspot.normal)}"
            data-side="${escapeHtml(hotspot.side)}"
            type="button"
            tabindex="-1"
            aria-label="${escapeHtml(hotspot.label)}">
            ${escapeHtml(hotspot.label)}
          </button>
        `).join("");
      }

      function renderTaskButtons() {
        return TASKS.map(task => `
          <button
            class="p-task${task.id === state.activeTask ? " is-active" : ""}"
            type="button"
            data-action="select-task"
            data-value="${escapeHtml(task.id)}"
            style="--item-accent:${escapeHtml(task.accent)}">
            <strong>${escapeHtml(task.title)}</strong>
            <span>${escapeHtml(task.label)}</span>
          </button>
        `).join("");
      }

      function renderFlow() {
        return FLOW_STEPS.map(step => `
          <div class="p-flowLine">
            <span>${escapeHtml(step.label)}</span>
            <strong>${escapeHtml(step.text)}</strong>
          </div>
        `).join("");
      }

      function renderQuizOptions() {
        return QUIZ.options.map(option => `
          <button class="p-quizOption${state.quizAnswer === option.id ? " is-selected" : ""}" type="button" data-action="answer-quiz" data-value="${escapeHtml(option.id)}">
            ${escapeHtml(option.text)}
          </button>
        `).join("");
      }

      function renderPanel() {
        if (!panelHost) return;
        const previousPanel = panelHost.querySelector(`.panel-${sceneId}`);
        const previousScrollTop = previousPanel ? previousPanel.scrollTop : 0;
        const task = getActiveTask();
        const picked = QUIZ.options.find(option => option.id === state.quizAnswer);
        const feedbackClass = picked ? picked.correct ? " is-correct" : " is-wrong" : "";
        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--task-accent:${escapeHtml(task.accent)}; --task-accent-soft:${escapeHtml(task.accent)}26">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <h2 class="p-title">血液与血管</h2>
              <p class="p-desc">左侧使用统一 3D 模型查看器。多模型内容在这里切换；观察任务只打开教学图片弹窗。</p>
              <div class="p-modelGrid">${renderModelButtons()}</div>
              <div class="p-actionRow">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">自动旋转</button>
                <button class="p-action" type="button" data-action="reset-camera">复位视角</button>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">观察任务</span>
              <div class="p-taskGrid">${renderTaskButtons()}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">教学卡片</span>
              <h2 class="p-title">${escapeHtml(task.title)}</h2>
              <p class="p-desc">${escapeHtml(task.prompt)}</p>
              <ul class="p-checkList">${renderChecks(task)}</ul>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">过程梳理</span>
              <div class="p-flow">${renderFlow()}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">快速判断</span>
              <div class="p-quiz">
                <div class="p-quizQuestion">${escapeHtml(QUIZ.question)}</div>
                ${renderQuizOptions()}
                <div class="p-feedback${feedbackClass}">${escapeHtml(state.quizFeedback || "选择一个答案后，这里会给出即时反馈。")}</div>
              </div>
            </div>
          </div>
        `;
        const nextPanel = panelHost.querySelector(`.panel-${sceneId}`);
        if (nextPanel && state.preservePanelScroll && previousScrollTop > 0) {
          nextPanel.scrollTop = previousScrollTop;
        }
        state.preservePanelScroll = true;
      }

      function updateModal() {
        const task = getActiveTask();
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        const label = container.querySelector('[data-role="task-label"]');
        if (label) label.textContent = task.title;

        const modalOverlay = container.querySelector('[data-role="task-modal"]');
        if (!modalOverlay) return;
        const modalImage = modalOverlay.querySelector('[data-role="modal-image"]');
        const modalTitle = modalOverlay.querySelector('[data-role="modal-title"]');
        const modalSummary = modalOverlay.querySelector('[data-role="modal-summary"]');
        const modalPrompt = modalOverlay.querySelector('[data-role="modal-prompt"]');
        const modalChecks = modalOverlay.querySelector('[data-role="modal-checks"]');
        const modalContent = modalOverlay.querySelector('.blood-stage__modalContent');
        if (modalImage) {
          modalImage.src = resolveAssetUrl(task.imageRelativeUrl);
          modalImage.alt = `${task.title}教学配图`;
        }
        if (modalTitle) modalTitle.textContent = task.title;
        if (modalSummary) modalSummary.textContent = task.summary;
        if (modalPrompt) modalPrompt.textContent = task.prompt;
        if (modalChecks) modalChecks.innerHTML = renderChecks(task);
        if (modalContent) {
          modalContent.style.borderColor = `${task.accent}3d`;
          modalContent.style.boxShadow = `0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px ${task.accent}14`;
        }
        modalOverlay.classList.toggle("is-open", state.showModal);
      }

      function applyModelAndCamera() {
        const viewer = findViewer();
        if (!viewer) return;
        const model = getActiveModel();
        setViewerModelSource(viewer, model.src);
        viewer.querySelectorAll(".blood-stage__hotspot").forEach(node => node.remove());
        const hotspots = renderModelHotspots(model);
        if (hotspots) viewer.insertAdjacentHTML("beforeend", hotspots);
        viewer.setAttribute("camera-orbit", model.cameraOrbit);
        viewer.setAttribute("field-of-view", model.fieldOfView);
        viewer.setAttribute("shadow-intensity", model.shadowIntensity);
        viewer.setAttribute("exposure", model.exposure);
        viewer.setAttribute("alt", model.alt);
        if (state.autoRotate) {
          viewer.setAttribute("auto-rotate", "");
          viewer.setAttribute("auto-rotate-delay", "0");
          viewer.setAttribute("rotation-per-second", isMobileModelTarget ? "10deg" : "20deg");
        } else {
          viewer.removeAttribute("auto-rotate");
        }
        viewer.removeAttribute("animation-name");
        viewer.removeAttribute("autoplay");
        if (typeof viewer.jumpCameraToGoal === "function") {
          try {
            viewer.jumpCameraToGoal();
          } catch (error) {
            // The model may still be loading; attributes above remain applied.
          }
        }
      }

      function closeModal() {
        state.showModal = false;
        updateModal();
        renderPanel();
      }

      function handleClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") || "";

        if (action === "select-model") {
          if (!MODELS[value]) return;
          state.activeModel = value;
          state.preservePanelScroll = false;
          applyModelAndCamera();
          renderPanel();
          return;
        }

        if (action === "select-task") {
          if (!TASKS.some(task => task.id === value)) return;
          state.activeTask = value;
          state.quizFeedback = "";
          state.showModal = true;
          updateModal();
          renderPanel();
          return;
        }

        if (action === "toggle-auto-rotate") {
          state.autoRotate = !state.autoRotate;
          applyModelAndCamera();
          renderPanel();
          return;
        }

        if (action === "reset-camera") {
          state.showModal = false;
          applyModelAndCamera();
          updateModal();
          renderPanel();
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
            ? "判断正确。毛细血管管壁薄、管腔细，红细胞单行通过，最适合进行物质交换。"
            : "再比较一次：动脉和静脉主要负责输送血液，毛细血管才是血液和组织细胞交换物质的主要场所。";
          renderPanel();
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
        renderStage();
        renderPanel();
        updateModal();
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

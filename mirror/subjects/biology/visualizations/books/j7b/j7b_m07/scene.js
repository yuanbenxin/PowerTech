window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7b_m07"] = (function () {
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
      id: "system",
      title: "神经系统",
      label: "整体定位",
      accent: "#38bdf8",
      summary: "神经系统由中枢神经系统和周围神经系统组成。脑和脊髓负责整合信息，脑神经和脊神经把刺激与反应连接起来。",
      prompt: "观察整体模型时，先分清脑、脊髓和向外分布的神经，再把它们对应到中枢和周围两大部分。",
      checks: ["脑和脊髓属于中枢神经系统", "脑神经和脊神经属于周围神经系统", "神经系统负责调节人体活动"],
      imageRelativeUrl: "assets/images/nervous-system-overview-square.png?v=05db1528d522"
    },
    {
      id: "neuron",
      title: "神经元结构",
      label: "基本单位",
      accent: "#a78bfa",
      summary: "神经元是神经系统结构和功能的基本单位，通常由细胞体、树突和轴突等部分组成。",
      prompt: "把神经元看作信息处理单元：树突接收信息，细胞体整合信息，轴突把兴奋传向神经末梢。",
      checks: ["树突多而短，主要接收信息", "细胞体含细胞核并整合兴奋", "轴突较长，负责远距离传导"],
      imageRelativeUrl: "assets/images/neuron-structure-square.png?v=8c9a5e59dfe4"
    },
    {
      id: "impulse",
      title: "神经冲动",
      label: "传导方向",
      accent: "#facc15",
      summary: "神经冲动沿神经元传导，到突触处通过神经递质把信息传递给下一个神经元或效应器。",
      prompt: "讲解时按“树突或细胞体接收兴奋 -> 轴突传导 -> 神经末梢释放递质 -> 下一个细胞接受”来梳理。",
      checks: ["兴奋通常沿固定方向传导", "髓鞘可提高传导速度", "突触处常依靠化学递质传递信息"],
      imageRelativeUrl: "assets/images/neural-impulse-square.png?v=4dbd1ffcfa5e"
    },
    {
      id: "reflex",
      title: "反射与感觉",
      label: "路径辨析",
      accent: "#22c55e",
      summary: "反射活动需要完整的反射弧。缩手反射可以先在脊髓完成，痛觉通常随后上传到大脑形成感觉。",
      prompt: "让学生按顺序说出反射弧：感受器、传入神经、神经中枢、传出神经、效应器，并区分反射和感觉形成。",
      checks: ["反射弧必须保持完整", "缩手反射的中枢可在脊髓", "痛觉形成通常需要大脑皮层参与"],
      imageRelativeUrl: "assets/images/reflex-sense-pathway-square.png?v=c0d647e9ecf0"
    }
  ];

  const MODEL_INFO = {
    "nervous-system": {
      title: "神经系统",
      label: "人体神经分布",
      src: {
        desktop: "assets/models/nervous-system.glb?v=c7e6a45d9f7f",
        tablet: "assets/models/nervous-system.tablet.glb?v=33f2f357a47a",
        mobile: "assets/models/nervous-system.mobile.glb?v=ce6dc4d653bf"
      },
      alt: "神经系统 3D 模型",
      accent: "#38bdf8",
      cameraOrbit: "20deg 72deg 116%",
      exposure: "0.92",
      shadowIntensity: "0.72",
      fieldOfView: "42deg",
      hotspots: [
        { id: "brain", label: "大脑", position: "0.08m 1.78m 0.04m" },
        { id: "spinal-cord", label: "脊髓", position: "-0.17m 1.52m 0.04m" },
        { id: "intercostal", label: "肋间神经", position: "-0.32m 1.34m 0.04m" },
        { id: "sciatic", label: "坐骨神经", position: "-0.28m 0.92m 0.04m" },
        { id: "median", label: "正中神经", position: "0.34m 1.12m 0.04m" },
        { id: "femoral", label: "股神经", position: "0.18m 0.82m 0.04m" },
        { id: "tibial", label: "胫神经", position: "0.18m 0.36m 0.04m" }
      ]
    },
    "neuron-basic": {
      title: "神经细胞",
      label: "轻量结构模型",
      src: "assets/models/nerve-cell.glb?v=d4cf03f6c0d5",
      alt: "神经细胞 3D 模型",
      accent: "#a78bfa",
      cameraOrbit: "-28deg 68deg 112%",
      exposure: "0.96",
      shadowIntensity: "0.82",
      fieldOfView: "38deg"
    },
    "neuron-detailed": {
      title: "神经元细胞",
      label: "精细动画模型",
      src: {
        desktop: "assets/models/neuron-cell-detailed.glb?v=1b2abfc78c00",
        tablet: "assets/models/neuron-cell-detailed.tablet.glb?v=4fdd81153d38",
        mobile: "assets/models/neuron-cell-detailed.mobile.glb?v=62180e303bb3"
      },
      alt: "精细神经元细胞 3D 模型",
      accent: "#facc15",
      cameraOrbit: "52deg 72deg 108%",
      exposure: "0.9",
      shadowIntensity: "0.7",
      fieldOfView: "42deg",
      animationName: "Take 001"
    }
  };

  const FLOW_STEPS = [
    { label: "刺激", text: "感受器接受刺激并产生兴奋" },
    { label: "传入", text: "传入神经把兴奋送到神经中枢" },
    { label: "整合", text: "脊髓或脑对信息进行处理" },
    { label: "传出", text: "传出神经把指令送到效应器" },
    { label: "反应", text: "肌肉或腺体产生相应活动" }
  ];

  const QUIZ = {
    question: "缩手反射中，痛觉形成通常需要哪一结构参与？",
    options: [
      { id: "brain", text: "大脑皮层的感觉中枢", correct: true },
      { id: "muscle", text: "手臂肌肉本身", correct: false },
      { id: "receptor", text: "皮肤感受器单独完成", correct: false }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "nervous-reflex-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );

      let disposed = false;
      const state = {
        activeTask: "system",
        activeModel: "nervous-system",
        autoRotate: !isMobileModelTarget,
        playAnimation: !isMobileModelTarget,
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
        return MODEL_INFO[state.activeModel] || MODEL_INFO["nervous-system"];
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

          [data-scope="${sceneId}"] .nervous-stage {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            padding: 12px;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .nervous-stage__frame {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(56, 189, 248, 0.2);
            background:
              radial-gradient(circle at 34% 28%, rgba(56, 189, 248, 0.22), transparent 34%),
              radial-gradient(circle at 76% 72%, rgba(167, 139, 250, 0.15), transparent 34%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98));
            box-shadow: inset 0 0 80px rgba(56, 189, 248, 0.08), 0 24px 70px rgba(0, 0, 0, 0.46);
          }

          [data-scope="${sceneId}"] .nervous-stage__grid {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            opacity: 0.22;
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
            background-size: 42px 42px;
            mask-image: radial-gradient(circle at center, #000 28%, transparent 76%);
          }

          [data-scope="${sceneId}"] .nervous-stage__viewerWrap {
            position: absolute;
            inset: 0;
            z-index: 2;
          }

          [data-scope="${sceneId}"] .nervous-stage__viewer {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            --poster-color: transparent;
          }

          [data-scope="${sceneId}"] .nervous-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            background: rgba(2, 6, 23, 0.78);
            color: rgba(248, 250, 252, 0.64);
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.12em;
          }

          [data-scope="${sceneId}"] .nervous-stage__hotspot {
            min-height: 30px;
            min-width: 52px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 10px;
            border: 0;
            border-radius: 12px;
            background: rgba(15, 23, 42, 0.78);
            color: rgba(248, 250, 252, 0.94);
            box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
            font: 900 12px/1.16 Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
            white-space: nowrap;
            pointer-events: none;
            transform: translate(-50%, -50%);
          }

          [data-scope="${sceneId}"] .nervous-stage__viewerTip {
            position: absolute;
            left: 18px;
            top: 18px;
            z-index: 6;
            color: rgba(226, 232, 240, 0.5);
            font-size: 11px;
            line-height: 1.3;
            font-weight: 800;
            letter-spacing: 0.08em;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .nervous-stage__hud {
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 6;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .nervous-stage__taskBadge {
            width: min(250px, calc(100vw - 48px));
            display: grid;
            gap: 7px;
            padding: 13px 14px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.62);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.34);
            backdrop-filter: blur(16px);
          }

          [data-scope="${sceneId}"] .nervous-stage__taskLabel {
            color: rgba(248, 250, 252, 0.52);
            font-size: 10px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.18em;
          }

          [data-scope="${sceneId}"] .nervous-stage__taskValue {
            min-width: 0;
            color: var(--task-accent, #38bdf8);
            font-size: 16px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .nervous-stage__bottom {
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

          [data-scope="${sceneId}"] .nervous-stage__legend {
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          [data-scope="${sceneId}"] .nervous-stage__legendItem {
            min-height: 30px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 7px 10px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.56);
            color: rgba(226, 232, 240, 0.9);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 850;
            backdrop-filter: blur(12px);
          }

          [data-scope="${sceneId}"] .nervous-stage__dot {
            width: 8px;
            height: 8px;
            flex: none;
            border-radius: 999px;
            background: var(--dot-color);
            box-shadow: 0 0 14px var(--dot-color);
          }

          [data-scope="${sceneId}"] .nervous-stage__controls {
            display: flex;
            flex: none;
            gap: 8px;
            pointer-events: auto;
          }

          [data-scope="${sceneId}"] .nervous-stage__controlBtn {
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

          [data-scope="${sceneId}"] .nervous-stage__controlBtn:hover,
          [data-scope="${sceneId}"] .nervous-stage__controlBtn.is-active {
            transform: translateY(-1px);
            border-color: var(--task-accent, #38bdf8);
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
            color: #fff;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalOverlay {
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

          [data-scope="${sceneId}"] .nervous-stage__modalOverlay.is-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalContent {
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
            border: 1.5px solid var(--task-accent-soft, rgba(56, 189, 248, 0.24));
            background: rgba(8, 17, 22, 0.96);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px var(--task-accent-soft, rgba(56, 189, 248, 0.14));
            transform: scale(0.94) translateY(16px);
            transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          [data-scope="${sceneId}"] .nervous-stage__modalOverlay.is-open .nervous-stage__modalContent {
            transform: scale(1) translateY(0);
          }

          [data-scope="${sceneId}"] .nervous-stage__modalClose {
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

          [data-scope="${sceneId}"] .nervous-stage__modalClose svg {
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            height: 100%;
            min-height: 0;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalImageShell {
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

          [data-scope="${sceneId}"] .nervous-stage__modalImage {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
            transition: transform 0.5s ease;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalImageShell:hover .nervous-stage__modalImage {
            transform: scale(1.02);
          }

          [data-scope="${sceneId}"] .nervous-stage__modalImageShell::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 22px;
            box-shadow: inset 0 0 45px var(--task-accent-soft, rgba(56, 189, 248, 0.18));
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalDetails {
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

          [data-scope="${sceneId}"] .nervous-stage__modalDetails::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalEyebrow {
            display: inline-block;
            margin-bottom: 8px;
            padding: 5px 12px;
            border-radius: 999px;
            color: var(--task-accent, #38bdf8);
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
            font-size: 11px;
            line-height: 1.1;
            font-weight: 950;
            letter-spacing: 0.08em;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalTitle {
            margin: 0;
            color: #fff;
            font-size: 28px;
            line-height: 1.16;
            font-weight: 950;
            letter-spacing: 0;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalSummary {
            margin: 0;
            color: rgba(226, 232, 240, 0.86);
            font-size: 14px;
            line-height: 1.65;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalSectionTitle {
            margin: 0 0 7px;
            color: var(--task-accent, #38bdf8);
            font-size: 13px;
            line-height: 1.2;
            font-weight: 950;
            letter-spacing: 0.04em;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalPrompt {
            margin: 0;
            padding: 10px 13px;
            border-left: 3px solid var(--task-accent, #38bdf8);
            border-radius: 0 10px 10px 0;
            background: rgba(255, 255, 255, 0.03);
            color: rgba(226, 232, 240, 0.76);
            font-size: 13px;
            line-height: 1.58;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalChecks {
            display: grid;
            gap: 7px;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalChecks li {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            color: rgba(226, 232, 240, 0.82);
            font-size: 13px;
            line-height: 1.45;
          }

          [data-scope="${sceneId}"] .nervous-stage__modalChecks li::before {
            content: "✓";
            flex: none;
            color: var(--task-accent, #38bdf8);
            font-weight: 950;
          }

          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 14px;
            overflow-y: auto;
            overscroll-behavior: contain;
            scrollbar-width: none;
            -ms-overflow-style: none;
            color: #f8fafc;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }

          .panel-${sceneId}::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }

          .panel-${sceneId} .p-card {
            width: 100%;
            min-width: 0;
            flex: 0 0 auto;
            display: grid;
            gap: 12px;
            padding: 15px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.035);
            overflow: hidden;
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
            color: rgba(226, 232, 240, 0.76);
            font-size: 13px;
            line-height: 1.65;
          }

          .panel-${sceneId} button {
            font-family: inherit;
          }

          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-model,
          .panel-${sceneId} .p-task,
          .panel-${sceneId} .p-quizOption {
            appearance: none;
            width: 100%;
            min-width: 0;
            cursor: pointer;
          }

          .panel-${sceneId} .p-actionRow {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
            gap: 8px;
          }

          .panel-${sceneId} .p-modelGrid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(108px, 1fr));
            gap: 8px;
          }

          .panel-${sceneId} .p-action {
            min-height: 40px;
            border-radius: 13px;
            border: 1px solid rgba(255, 255, 255, 0.09);
            background: rgba(2, 6, 23, 0.38);
            color: rgba(248, 250, 252, 0.78);
            font-size: 13px;
            line-height: 1.2;
            font-weight: 900;
          }

          .panel-${sceneId} .p-action.is-active,
          .panel-${sceneId} .p-action:hover,
          .panel-${sceneId} .p-model:hover,
          .panel-${sceneId} .p-quizOption:hover {
            border-color: var(--task-accent, #38bdf8);
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
            color: #fff;
          }

          .panel-${sceneId} .p-model {
            min-height: 58px;
            display: grid;
            align-content: center;
            gap: 5px;
            padding: 10px 11px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(2, 6, 23, 0.35);
            color: rgba(248, 250, 252, 0.84);
            text-align: left;
          }

          .panel-${sceneId} .p-model.is-active {
            border-color: var(--model-accent);
            background: var(--model-accent-soft);
            color: #fff;
          }

          .panel-${sceneId} .p-model strong {
            color: inherit;
            font-size: 13px;
            line-height: 1.16;
            font-weight: 950;
          }

          .panel-${sceneId} .p-model span {
            color: rgba(226, 232, 240, 0.58);
            font-size: 11px;
            line-height: 1.25;
            font-weight: 800;
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

          .panel-${sceneId} .p-task.is-active strong {
            color: var(--item-accent);
          }

          .panel-${sceneId} .p-task strong {
            color: #fff;
            font-size: 14px;
            line-height: 1.16;
            font-weight: 950;
          }

          .panel-${sceneId} .p-task span {
            color: rgba(226, 232, 240, 0.54);
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

          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .p-flowLine {
            display: grid;
            grid-template-columns: 70px minmax(0, 1fr);
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

          @media (max-width: 760px) {
            [data-scope="${sceneId}"] .nervous-stage__modalOverlay {
              align-items: flex-start;
              padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalContent {
              width: min(100%, 390px);
              max-width: calc(100vw - 20px);
              height: calc(100vh - 20px);
              height: calc(100dvh - 20px);
              max-height: none;
              padding: 58px 16px 18px;
              overflow-y: auto;
              border-radius: 26px;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalClose {
              position: fixed;
              top: max(14px, env(safe-area-inset-top));
              right: max(14px, env(safe-area-inset-right));
              width: 44px;
              height: 44px;
              min-width: 44px;
              min-height: 44px;
              flex: 0 0 44px;
              border-radius: 14px;
              background: rgba(15, 23, 42, 0.72);
              border-color: rgba(255, 255, 255, 0.16);
              color: rgba(255, 255, 255, 0.9);
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
              backdrop-filter: blur(12px);
            }

            [data-scope="${sceneId}"] .nervous-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              height: auto;
              min-height: min-content;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalImageShell {
              width: 100%;
              max-width: min(100%, 300px);
              height: auto;
              max-height: none;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalImage {
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalDetails {
              height: auto;
              overflow-y: visible;
              gap: 14px;
              padding-right: 0;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalTitle {
              font-size: 24px;
              line-height: 1.15;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalSummary,
            [data-scope="${sceneId}"] .nervous-stage__modalPrompt,
            [data-scope="${sceneId}"] .nervous-stage__modalChecks li {
              font-size: 12.5px;
            }

            [data-scope="${sceneId}"] .nervous-stage {
              padding: 8px;
            }

            [data-scope="${sceneId}"] .nervous-stage__frame {
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .nervous-stage__taskBadge,
            [data-scope="${sceneId}"] .nervous-stage__viewerTip {
              display: none;
            }

            [data-scope="${sceneId}"] .nervous-stage__bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
            }

            [data-scope="${sceneId}"] .nervous-stage__legend {
              max-width: 62%;
            }

            [data-scope="${sceneId}"] .nervous-stage__legendItem {
              min-height: 28px;
              padding: 6px 8px;
              font-size: 10px;
            }

            [data-scope="${sceneId}"] .nervous-stage__controlBtn {
              min-height: 34px;
              padding: 0 9px;
              font-size: 11px;
            }

            .panel-${sceneId} {
              padding: 10px;
              gap: 10px;
            }

            .panel-${sceneId} .p-card {
              padding: 10px;
              gap: 7px;
            }

            .panel-${sceneId} .p-taskGrid {
              grid-template-columns: 1fr;
            }

            .panel-${sceneId} .p-title {
              font-size: 18px;
            }
          }

          /* Unified mobile/tablet layout for observation-task image popups. */
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .nervous-stage__modalOverlay {
              align-items: center;
              justify-content: center;
              padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalContent {
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

            [data-scope="${sceneId}"] .nervous-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalClose {
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

            [data-scope="${sceneId}"] .nervous-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: start;
              height: auto;
              min-height: 0;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalImageShell {
              width: min(100%, 320px);
              max-width: 320px;
              height: auto;
              max-height: none;
              aspect-ratio: 1 / 1;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalImage {
              width: 100%;
              height: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalDetails {
              height: auto;
              min-height: 0;
              max-height: none;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
              overflow-wrap: anywhere;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalSummary,
            [data-scope="${sceneId}"] .nervous-stage__modalPrompt,
            [data-scope="${sceneId}"] .nervous-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.5;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .nervous-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .nervous-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalImageShell {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .nervous-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .nervous-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalImageShell {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalDetails::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .nervous-stage__modalSummary,
            [data-scope="${sceneId}"] .nervous-stage__modalPrompt,
            [data-scope="${sceneId}"] .nervous-stage__modalChecks li {
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
        const modelSrc = resolveModelSource(model.src);
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        container.innerHTML = `
          <div class="nervous-stage">
            <div class="nervous-stage__frame">
              <div class="nervous-stage__grid"></div>
              <div class="nervous-stage__viewerWrap">
                <model-viewer
                  class="nervous-stage__viewer"
                  src="${escapeHtml(modelSrc)}"
                  camera-controls
                  interaction-prompt="none"
                  shadow-intensity="${escapeHtml(model.shadowIntensity || "0.72")}"
                  exposure="${escapeHtml(model.exposure || "0.92")}"
                  environment-image="neutral"
                  loading="eager"
                  field-of-view="${escapeHtml(model.fieldOfView || "42deg")}"
                  min-field-of-view="12deg"
                  max-field-of-view="82deg"
                  camera-orbit="${escapeHtml(model.cameraOrbit || "20deg 72deg 116%")}"
                  alt="${escapeHtml(model.alt)}">
                  <div class="nervous-stage__poster" slot="poster">模型加载中...</div>
                  ${renderModelHotspots(model)}
                </model-viewer>
              </div>
              <div class="nervous-stage__viewerTip">拖拽旋转 · 双指缩放 · 鼠标滚轮</div>
              <div class="nervous-stage__hud">
                <div class="nervous-stage__taskBadge">
                  <div class="nervous-stage__taskLabel">当前观察任务</div>
                  <div class="nervous-stage__taskValue" data-role="task-label">${escapeHtml(task.title)}</div>
                </div>
              </div>
              <div class="nervous-stage__bottom">
                <div class="nervous-stage__legend" aria-label="神经系统图例">
                  <div class="nervous-stage__legendItem"><span class="nervous-stage__dot" style="--dot-color:#38bdf8"></span>中枢</div>
                  <div class="nervous-stage__legendItem"><span class="nervous-stage__dot" style="--dot-color:#a78bfa"></span>神经元</div>
                  <div class="nervous-stage__legendItem"><span class="nervous-stage__dot" style="--dot-color:#22c55e"></span>反射通路</div>
                </div>
                <div class="nervous-stage__controls">
                  <button class="nervous-stage__controlBtn${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">旋转</button>
                  ${model.animationName ? `<button class="nervous-stage__controlBtn${state.playAnimation ? " is-active" : ""}" type="button" data-action="toggle-animation">动画</button>` : ""}
                  <button class="nervous-stage__controlBtn" type="button" data-action="reset-camera">复位</button>
                </div>
              </div>
              <div class="nervous-stage__modalOverlay${state.showModal ? " is-open" : ""}" data-role="task-modal">
                <div class="nervous-stage__modalContent">
                  <button class="nervous-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="nervous-stage__modalGrid">
                    <div class="nervous-stage__modalImageShell">
                      <img class="nervous-stage__modalImage" data-role="modal-image" src="${escapeHtml(resolveAssetUrl(task.imageRelativeUrl))}" alt="${escapeHtml(task.title)}教学配图">
                    </div>
                    <div class="nervous-stage__modalDetails">
                      <div>
                        <span class="nervous-stage__modalEyebrow">神经系统与反射感觉 · 教学观察</span>
                        <h2 class="nervous-stage__modalTitle" data-role="modal-title">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="nervous-stage__modalSummary" data-role="modal-summary">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="nervous-stage__modalSectionTitle">学习提示</h3>
                        <p class="nervous-stage__modalPrompt" data-role="modal-prompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="nervous-stage__modalSectionTitle">知识要点</h3>
                        <ul class="nervous-stage__modalChecks" data-role="modal-checks">${renderChecks(task)}</ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        const viewer = findViewer();
        if (viewer) {
          if (state.autoRotate) viewer.setAttribute("auto-rotate", "");
          if (model.animationName) {
            viewer.setAttribute("animation-name", model.animationName);
            if (state.playAnimation) viewer.setAttribute("autoplay", "");
          }
        }
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

      function renderModelButtons() {
        return Object.keys(MODEL_INFO).map(key => {
          const model = MODEL_INFO[key];
          return `
            <button
              class="p-model${key === state.activeModel ? " is-active" : ""}"
              type="button"
              data-action="select-model"
              data-value="${escapeHtml(key)}"
              style="--model-accent:${escapeHtml(model.accent || "#38bdf8")}; --model-accent-soft:${escapeHtml(model.accent || "#38bdf8")}26">
              <strong>${escapeHtml(model.title)}</strong>
              <span>${escapeHtml(model.label || model.alt)}</span>
            </button>
          `;
        }).join("");
      }

      function renderModelHotspots(model) {
        return (model.hotspots || []).map(hotspot => `
          <button
            class="nervous-stage__hotspot"
            slot="hotspot-${escapeHtml(hotspot.id)}"
            data-position="${escapeHtml(hotspot.position)}"
            data-normal="${escapeHtml(hotspot.normal || "0m 0m 1m")}"
            type="button">
            ${escapeHtml(hotspot.label)}
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
        const model = getActiveModel();
        const picked = QUIZ.options.find(option => option.id === state.quizAnswer);
        const feedbackClass = picked ? picked.correct ? " is-correct" : " is-wrong" : "";
        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--task-accent:${escapeHtml(task.accent)}; --task-accent-soft:${escapeHtml(task.accent)}26">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <h2 class="p-title">神经系统与反射感觉</h2>
              <p class="p-desc">左侧使用统一 3D 模型查看器。多模型内容在这里切换；观察任务只打开教学图片弹窗。</p>
              <div class="p-modelGrid">${renderModelButtons()}</div>
              <div class="p-actionRow">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">自动旋转</button>
                ${model.animationName ? `<button class="p-action${state.playAnimation ? " is-active" : ""}" type="button" data-action="toggle-animation">模型动画</button>` : ""}
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
              <span class="p-eyebrow">反射通路</span>
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

      function applyModelAndCamera() {
        const model = getActiveModel();
        const viewer = findViewer();
        if (!viewer) return;
        setViewerModelSource(viewer, model.src);
        viewer.querySelectorAll(".nervous-stage__hotspot").forEach(node => node.remove());
        const hotspots = renderModelHotspots(model);
        if (hotspots) viewer.insertAdjacentHTML("beforeend", hotspots);
        viewer.setAttribute("camera-orbit", model.cameraOrbit || "20deg 72deg 116%");
        viewer.setAttribute("field-of-view", model.fieldOfView || "42deg");
        viewer.setAttribute("shadow-intensity", model.shadowIntensity || "0.72");
        viewer.setAttribute("exposure", model.exposure || "0.92");
        viewer.setAttribute("alt", model.alt);
        if (state.autoRotate) viewer.setAttribute("auto-rotate", "");
        else viewer.removeAttribute("auto-rotate");
        if (model.animationName) {
          viewer.setAttribute("animation-name", model.animationName);
          if (state.playAnimation) {
            viewer.setAttribute("autoplay", "");
            viewer.play?.({ repetitions: Infinity });
          } else {
            viewer.removeAttribute("autoplay");
            viewer.pause?.();
          }
        } else {
          viewer.removeAttribute("animation-name");
          viewer.removeAttribute("autoplay");
          viewer.pause?.();
        }
        if (typeof viewer.jumpCameraToGoal === "function") {
          try {
            viewer.jumpCameraToGoal();
          } catch (error) {
            // model-viewer may still be loading; attributes above remain applied.
          }
        }
      }

      function updateStage() {
        const task = getActiveTask();
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        const label = container.querySelector('[data-role="task-label"]');
        if (label) label.textContent = task.title;

        const modalOverlay = container.querySelector('[data-role="task-modal"]');
        if (modalOverlay) {
          const modalImage = modalOverlay.querySelector('[data-role="modal-image"]');
          const modalTitle = modalOverlay.querySelector('[data-role="modal-title"]');
          const modalSummary = modalOverlay.querySelector('[data-role="modal-summary"]');
          const modalPrompt = modalOverlay.querySelector('[data-role="modal-prompt"]');
          const modalChecks = modalOverlay.querySelector('[data-role="modal-checks"]');
          const modalContent = modalOverlay.querySelector('.nervous-stage__modalContent');
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
      }

      function closeModal() {
        state.showModal = false;
        updateStage();
        renderPanel();
      }

      function handleClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") || "";

        if (action === "select-task") {
          if (!TASKS.some(task => task.id === value)) return;
          state.activeTask = value;
          state.quizFeedback = "";
          state.showModal = true;
          updateStage();
          renderPanel();
          return;
        }

        if (action === "select-model") {
          if (!MODEL_INFO[value]) return;
          state.activeModel = value;
          if (value === "neuron-basic" && state.playAnimation) state.playAnimation = false;
          state.preservePanelScroll = false;
          applyModelAndCamera();
          updateStage();
          renderPanel();
          return;
        }

        if (action === "toggle-auto-rotate") {
          state.autoRotate = !state.autoRotate;
          applyModelAndCamera();
          updateStage();
          renderPanel();
          return;
        }

        if (action === "toggle-animation") {
          state.playAnimation = !state.playAnimation;
          applyModelAndCamera();
          updateStage();
          renderPanel();
          return;
        }

        if (action === "reset-camera") {
          state.showModal = false;
          applyModelAndCamera();
          updateStage();
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
            ? "判断正确。痛觉形成通常需要大脑皮层感觉中枢参与。"
            : "再想想：反射动作可在脊髓完成，但痛觉等感觉通常要上传到大脑皮层。";
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
        updateStage();
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

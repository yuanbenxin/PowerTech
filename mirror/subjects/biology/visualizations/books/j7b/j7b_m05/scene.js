window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7b_m05"] = (function () {

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
      id: "chambers",
      title: "四腔结构",
      label: "结构辨认",
      accent: "#38bdf8",
      cameraOrbit: "20deg 74deg 3.8m",
      summary: "心脏由左右心房和左右心室构成，同侧心房与心室相通，左右两侧由间隔分开。",
      prompt: "先找上方较薄的心房，再找下方肌肉更厚的心室；左心室壁通常更厚，因为它要把血液送往全身。",
      checks: ["心房在上，心室在下", "左、右心不能直接相通", "左心室负责体循环起点"],
      imageRelativeUrl: "assets/images/chambers.png?v=017b512df80b"
    },
    {
      id: "valves",
      title: "瓣膜防逆流",
      label: "单向流动",
      accent: "#f59e0b",
      cameraOrbit: "-18deg 72deg 4m",
      summary: "房室瓣和动脉瓣像单向门，保证血液只能按既定方向流动。",
      prompt: "把瓣膜理解成压力控制的门：心室收缩时房室瓣关闭，动脉瓣打开，血液被射入动脉。",
      checks: ["房室瓣防止血液回到心房", "动脉瓣防止动脉血倒流", "瓣膜开闭由两侧压力差决定"],
      imageRelativeUrl: "assets/images/valves.png?v=21be8af9a008"
    },
    {
      id: "pulmonary",
      title: "肺循环",
      label: "蓝到红",
      accent: "#60a5fa",
      cameraOrbit: "-40deg 72deg 4.2m",
      summary: "右心室将静静脉血送入肺动脉，血液在肺部交换气体后经肺静脉回到左心房。",
      prompt: "肺循环的关键变化是血液含氧量升高：从右心出发时含氧少，回到左心时含氧多。",
      checks: ["起点：右心室", "终点：左心房", "肺动脉内流静脉血"],
      imageRelativeUrl: "assets/images/pulmonary.png?v=945a5e78be41"
    },
    {
      id: "systemic",
      title: "体循环",
      label: "红到蓝",
      accent: "#ef4444",
      cameraOrbit: "42deg 72deg 4.2m",
      summary: "左心室将动脉血泵入主动脉，血液把氧和营养送到全身组织后经静脉回到右心房。",
      prompt: "体循环路径长、阻力大，所以左心室肌肉更厚，能够产生更高的泵血压力。",
      checks: ["起点：左心室", "终点：右心房", "主动脉内流动脉血"],
      imageRelativeUrl: "assets/images/systemic.png?v=d48f104bb06f"
    }
  ];

  const QUIZ = {
    question: "哪一条路线描述的是肺循环？",
    options: [
      { id: "wrong-systemic", text: "左心室 -> 主动脉 -> 全身 -> 右心房", correct: false },
      { id: "right-pulmonary", text: "右心室 -> 肺动脉 -> 肺部 -> 左心房", correct: true },
      { id: "wrong-valve", text: "左心房 -> 房室瓣 -> 右心室 -> 肺静脉", correct: false }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "heart-circulation-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );
      const MODEL_OPTIONS = [
        {
          id: "anatomy",
          title: "解剖模型",
          label: "内部结构",
          accent: "#38bdf8",
          description: "显示心腔、瓣膜与循环通路的解剖视角，适合辨认四腔结构和血液流向。",
          alt: "心脏解剖 3D 模型",
          cameraDistance: "110%",
          animationName: "test",
          source: {
            desktop: `${assetBase}assets/models/heart-anatomy.glb?v=e758b151dcad`,
            tablet: `${assetBase}assets/models/heart-anatomy.tablet.glb?v=d60e1e362d69`,
            mobile: `${assetBase}assets/models/heart-anatomy.mobile.glb?v=9d2260221d53`
          }
        },
        {
          id: "overall",
          title: "整体模型",
          label: "全景外观",
          accent: "#fb7185",
          description: "显示心脏整体外观与空间形态，适合建立完整器官的全景印象。",
          alt: "心脏整体全景 3D 模型",
          cameraDistance: null,
          animationName: "",
          source: {
            desktop: `${assetBase}assets/models/heart-circulation.glb?v=5f340f5d2515`,
            tablet: `${assetBase}assets/models/heart-circulation.tablet.glb?v=c496fe6a0ad2`,
            mobile: `${assetBase}assets/models/heart-circulation.mobile.glb?v=81fc290a49f9`
          }
        }
      ];
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
      let disposed = false;

      const state = {
        activeModel: "anatomy",
        activeTask: "chambers",
        autoRotate: !isMobileModelTarget,
        playAnimation: false,
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
          chambers: [
            { text: "右心房", top: "33%", left: "36%", pos: "left" },
            { text: "右心室", top: "66%", left: "39%", pos: "left" },
            { text: "左心房", top: "35%", left: "65%", pos: "right" },
            { text: "左心室", top: "68%", left: "62%", pos: "right" }
          ],
          valves: [
            { text: "房室瓣 (左心房与左心室之间)", top: "38%", left: "26%", pos: "left" },
            { text: "动脉瓣 (左心室与主动脉之间)", top: "54%", left: "73%", pos: "right" },
            { text: "心房 (血液流入的腔室)", top: "18%", left: "49%", pos: "top" },
            { text: "心室 (泵出血液的肌肉腔室)", top: "76%", left: "51%", pos: "bottom" }
          ],
          pulmonary: [
            { text: "右心室 (起点)", top: "58%", left: "45%", pos: "left" },
            { text: "肺动脉 (送静脉血至肺)", top: "32%", left: "40%", pos: "left" },
            { text: "肺部毛细血管 (气体交换)", top: "28%", left: "18%", pos: "top" },
            { text: "肺静脉 (送动脉血回心)", top: "40%", left: "66%", pos: "right" },
            { text: "左心房 (终点)", top: "52%", left: "59%", pos: "right" }
          ],
          systemic: [
            { text: "左心室 (起点)", top: "52%", left: "54%", pos: "right" },
            { text: "主动脉 (送动脉血至全身)", top: "42%", left: "50%", pos: "top" },
            { text: "全身毛细血管 (物质交换)", top: "12%", left: "50%", pos: "top" },
            { text: "上下腔静脉 (回流静脉血)", top: "46%", left: "34%", pos: "left" },
            { text: "右心房 (终点)", top: "52%", left: "46%", pos: "left" }
          ]
        };

        const list = labelsData[taskId] || [];
        return list.map((item, index) => `
          <div class="heart-stage__hotspot heart-stage__hotspot--${item.pos}" 
               style="top: ${item.top}; left: ${item.left}; --accent-color: ${accent}; --delay: ${index * 0.15}s">
            <div class="heart-stage__hotspot-dot"></div>
            <div class="heart-stage__hotspot-line"></div>
            <div class="heart-stage__hotspot-badge">${escapeHtml(item.text)}</div>
          </div>
        `).join("");
      }

      function getActiveTask() {
        return OBSERVATION_TASKS.find(task => task.id === state.activeTask) || OBSERVATION_TASKS[0];
      }

      function getActiveModel() {
        return MODEL_OPTIONS.find(model => model.id === state.activeModel) || MODEL_OPTIONS[0];
      }

      function getTaskCameraOrbit(task, model) {
        if (!model || !model.cameraDistance) return task.cameraOrbit;
        const parts = task.cameraOrbit.split(/\s+/);
        return `${parts[0]} ${parts[1]} ${model.cameraDistance}`;
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

          [data-scope="${sceneId}"] .heart-stage__modalOverlay {
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
            overscroll-behavior: contain;
            touch-action: pan-y;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s ease;
          }

          [data-scope="${sceneId}"] .heart-stage__modalOverlay.is-open {
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
          }

          [data-scope="${sceneId}"] .heart-stage__modalContent {
            width: 90%;
            max-width: 1100px;
            height: 85vh;
            max-height: 800px;
            background: rgba(8, 17, 14, 0.96);
            border: 1.5px solid rgba(16, 185, 129, 0.28);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px rgba(16, 185, 129, 0.1);
            border-radius: 32px;
            position: relative;
            isolation: isolate;
            padding: 40px;
            transform: scale(0.94) translateY(16px);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          [data-scope="${sceneId}"] .heart-stage__modalOverlay.is-open .heart-stage__modalContent {
            transform: scale(1) translateY(0);
          }

          [data-scope="${sceneId}"] .heart-stage__modalClose {
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
            z-index: 80;
            padding: 0;
            pointer-events: auto;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          [data-scope="${sceneId}"] .heart-stage__modalClose svg {
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .heart-stage__modalClose:hover {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
            transform: rotate(90deg) scale(1.05);
          }

          [data-scope="${sceneId}"] .heart-stage__modalGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            height: 100%;
            min-height: 0;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .heart-stage__modalImageContainer {
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
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
            margin: 0 auto;
          }

          [data-scope="${sceneId}"] .heart-stage__modalImage {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
            transition: transform 0.5s ease;
          }

          [data-scope="${sceneId}"] .heart-stage__modalImageContainer:hover .heart-stage__modalImage {
            transform: scale(1.02);
          }

          [data-scope="${sceneId}"] .heart-stage__modalImageGlow {
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 45px rgba(var(--glow-color-rgb), 0.25);
            pointer-events: none;
            border-radius: 22px;
          }

          [data-scope="${sceneId}"] .heart-stage__labelsOverlay {
            position: absolute;
            inset: 0;
            pointer-events: auto;
            z-index: 10;
          }

          [data-scope="${sceneId}"] .heart-stage__hotspot {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -50%);
            animation: hotspotFadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            animation-delay: var(--delay, 0s);
          }

          @keyframes hotspotFadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }

          [data-scope="${sceneId}"] .heart-stage__hotspot-dot {
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

          [data-scope="${sceneId}"] .heart-stage__hotspot-dot::after {
            content: "";
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 1px dashed var(--accent-color, #10b981);
            opacity: 0.7;
            animation: hotspotPulse 2s infinite linear;
          }

          @keyframes hotspotPulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          [data-scope="${sceneId}"] .heart-stage__hotspot:hover .heart-stage__hotspot-dot {
            transform: scale(1.3);
            background: #fff;
            border-color: var(--accent-color, #10b981);
            box-shadow: 0 0 24px var(--accent-color, #10b981);
          }

          [data-scope="${sceneId}"] .heart-stage__hotspot-badge {
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

          [data-scope="${sceneId}"] .heart-stage__hotspot--left .heart-stage__hotspot-badge {
            right: 20px;
            left: auto;
          }

          [data-scope="${sceneId}"] .heart-stage__hotspot--right .heart-stage__hotspot-badge {
            left: 20px;
          }

          [data-scope="${sceneId}"] .heart-stage__hotspot--top .heart-stage__hotspot-badge {
            bottom: 20px;
          }

          [data-scope="${sceneId}"] .heart-stage__hotspot--bottom .heart-stage__hotspot-badge {
            top: 20px;
          }

          [data-scope="${sceneId}"] .heart-stage__hotspot:hover .heart-stage__hotspot-badge {
            background: var(--accent-color, #10b981);
            color: #030712;
            transform: scale(1.06);
          }

          [data-scope="${sceneId}"] .heart-stage__modalDetails {
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: left;
            height: 100%;
            overflow-y: auto;
            padding-right: 16px;
          }

          [data-scope="${sceneId}"] .heart-stage__modalDetails::-webkit-scrollbar {
            width: 6px;
          }
          [data-scope="${sceneId}"] .heart-stage__modalDetails::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 3px;
          }
          [data-scope="${sceneId}"] .heart-stage__modalDetails::-webkit-scrollbar-thumb {
            background: rgba(16, 185, 129, 0.3);
            border-radius: 3px;
          }
          [data-scope="${sceneId}"] .heart-stage__modalDetails::-webkit-scrollbar-thumb:hover {
            background: rgba(16, 185, 129, 0.5);
          }

          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .heart-stage__modalOverlay {
              align-items: flex-start;
              padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .heart-stage__modalContent {
              width: min(100%, 390px);
              max-width: calc(100vw - 20px);
              height: calc(100vh - 20px);
              height: calc(100dvh - 20px);
              max-height: none;
              padding: 52px 16px 18px;
              border-radius: 26px;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .heart-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .heart-stage__modalClose {
              position: fixed;
              top: max(14px, env(safe-area-inset-top));
              right: max(14px, env(safe-area-inset-right));
              width: 44px;
              height: 44px;
              border-radius: 14px;
              background: rgba(15, 23, 42, 0.72);
              border-color: rgba(255, 255, 255, 0.16);
              color: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(12px);
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
            }

            [data-scope="${sceneId}"] .heart-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              height: auto;
              min-height: min-content;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .heart-stage__modalImageContainer {
              width: 100%;
              max-width: min(100%, 300px);
              height: auto;
              max-height: none;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .heart-stage__modalImage {
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalDetails {
              height: auto;
              overflow-y: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalTitle {
              font-size: 24px;
              line-height: 1.15;
            }

            [data-scope="${sceneId}"] .heart-stage__modalSummary,
            [data-scope="${sceneId}"] .heart-stage__modalPrompt,
            [data-scope="${sceneId}"] .heart-stage__modalChecks li {
              font-size: 12.5px;
            }

            [data-scope="${sceneId}"] .heart-stage__hotspot-dot {
              width: 10px;
              height: 10px;
            }

            [data-scope="${sceneId}"] .heart-stage__hotspot-badge {
              max-width: 92px;
              padding: 4px 7px;
              border-radius: 8px;
              font-size: 10px;
              line-height: 1.18;
              white-space: normal;
              text-align: center;
            }

            [data-scope="${sceneId}"] .heart-stage__hotspot--left .heart-stage__hotspot-badge {
              right: 16px;
            }

            [data-scope="${sceneId}"] .heart-stage__hotspot--right .heart-stage__hotspot-badge {
              left: 16px;
            }

            [data-scope="${sceneId}"] .heart-stage__hotspot--top .heart-stage__hotspot-badge {
              bottom: 16px;
            }

            [data-scope="${sceneId}"] .heart-stage__hotspot--bottom .heart-stage__hotspot-badge {
              top: 16px;
            }
          }

          [data-scope="${sceneId}"] .heart-stage__modalEyebrow {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.08em;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          [data-scope="${sceneId}"] .heart-stage__modalTitle {
            margin: 0;
            font-size: 26px;
            font-weight: 950;
            color: #fff;
            letter-spacing: -0.01em;
          }

          [data-scope="${sceneId}"] .heart-stage__modalSummary {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: rgba(226, 232, 240, 0.85);
          }

          [data-scope="${sceneId}"] .heart-stage__modalSectionTitle {
            margin: 0 0 6px 0;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.06em;
          }

          [data-scope="${sceneId}"] .heart-stage__modalPrompt {
            margin: 0;
            font-size: 13px;
            line-height: 1.55;
            color: rgba(226, 232, 240, 0.72);
            background: rgba(255, 255, 255, 0.02);
            border-left: 3px solid #10b981;
            padding: 8px 12px;
            border-radius: 0 8px 8px 0;
          }

          [data-scope="${sceneId}"] .heart-stage__modalChecks {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 6px;
          }

          [data-scope="${sceneId}"] .heart-stage__modalChecks li {
            font-size: 13px;
            color: rgba(226, 232, 240, 0.82);
            display: flex;
            align-items: center;
            gap: 8px;
            line-height: 1.4;
          }

          [data-scope="${sceneId}"] .heart-stage__modalChecks li::before {
            content: "✓";
            color: var(--check-color, #10b981);
            font-weight: 950;
          }

          [data-scope="${sceneId}"] .heart-stage {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            display: grid;
            padding: 18px;
            background:
              radial-gradient(circle at 48% 42%, rgba(239, 68, 68, 0.18), transparent 38%),
              radial-gradient(circle at 20% 18%, rgba(14, 165, 233, 0.13), transparent 30%),
              linear-gradient(145deg, #020617 0%, #08111f 48%, #10060b 100%);
          }

          [data-scope="${sceneId}"] .heart-stage__frame {
            position: relative;
            min-width: 0;
            min-height: 0;
            border-radius: 26px;
            overflow: hidden;
            border: 1px solid rgba(248, 250, 252, 0.1);
            background:
              linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
              radial-gradient(circle at center, rgba(15, 23, 42, 0.34), rgba(2, 6, 23, 0.94));
            background-size: 34px 34px, 34px 34px, auto;
            box-shadow: inset 0 0 90px rgba(15, 23, 42, 0.78), 0 24px 60px rgba(0, 0, 0, 0.34);
          }

          [data-scope="${sceneId}"] .heart-stage__modelViewer {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
            background: transparent;
            --poster-color: transparent;
          }

          [data-scope="${sceneId}"] .heart-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: rgba(226, 232, 240, 0.78);
            font-size: 14px;
            background: rgba(2, 6, 23, 0.66);
          }

          [data-scope="${sceneId}"] .heart-stage__hud {
            position: absolute;
            inset: 18px 18px auto 18px;
            z-index: 8;
            display: flex;
            align-items: flex-start;
            justify-content: flex-end;
            gap: 12px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .heart-stage__taskText {
            max-width: 520px;
            color: rgba(226, 232, 240, 0.84);
            font-size: 13px;
            line-height: 1.55;
            text-shadow: 0 4px 18px rgba(0, 0, 0, 0.42);
          }

          [data-scope="${sceneId}"] .heart-stage__modeBadge {
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

          [data-scope="${sceneId}"] .heart-stage__modeLabel {
            color: rgba(226, 232, 240, 0.68);
            font-size: 11px;
            font-weight: 800;
          }

          [data-scope="${sceneId}"] .heart-stage__modeValue {
            color: var(--task-accent, #38bdf8);
            font-size: 16px;
            line-height: 1.2;
            font-weight: 950;
          }

          [data-scope="${sceneId}"] .heart-stage__bottom {
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

          [data-scope="${sceneId}"] .heart-stage__legend {
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          [data-scope="${sceneId}"] .heart-stage__legendItem {
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

          [data-scope="${sceneId}"] .heart-stage__dot {
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
          .panel-${sceneId} .p-model,
          .panel-${sceneId} .p-task,
          .panel-${sceneId} .p-quizOption {
            appearance: none;
            width: 100%;
            min-width: 0;
            cursor: pointer;
          }

          .panel-${sceneId} .p-modelGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .panel-${sceneId} .p-model {
            min-height: 72px;
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

          .panel-${sceneId} .p-model:hover {
            transform: translateY(-1px);
            background: rgba(255, 255, 255, 0.052);
          }

          .panel-${sceneId} .p-model.is-active {
            border-color: var(--item-accent);
            background: rgba(255, 255, 255, 0.06);
          }

          .panel-${sceneId} .p-model strong {
            color: #fff;
            font-size: 14px;
            line-height: 1.16;
            font-weight: 950;
          }

          .panel-${sceneId} .p-model span {
            color: rgba(226, 232, 240, 0.62);
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
            [data-scope="${sceneId}"] .heart-stage {
              padding: 8px;
            }

            [data-scope="${sceneId}"] .heart-stage__hud {
              inset: 10px 10px auto 10px;
              align-items: flex-end;
              flex-direction: column;
            }

            [data-scope="${sceneId}"] .heart-stage__modeBadge {
              width: max-content;
              max-width: 100%;
              min-width: 0;
            }

            [data-scope="${sceneId}"] .heart-stage__taskText {
              display: none;
            }

            [data-scope="${sceneId}"] .heart-stage__bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
            }
          }

          /* Unified mobile/tablet layout for observation-task image popups. */
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .heart-stage__modalOverlay {
              align-items: center;
              justify-content: center;
              padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .heart-stage__modalContent {
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

            [data-scope="${sceneId}"] .heart-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .heart-stage__modalClose {
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

            [data-scope="${sceneId}"] .heart-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: start;
              height: auto;
              min-height: 0;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .heart-stage__modalImageContainer {
              width: min(100%, 320px);
              max-width: 320px;
              height: auto;
              max-height: none;
              aspect-ratio: 1 / 1;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .heart-stage__modalImage {
              width: 100%;
              height: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalDetails {
              height: auto;
              min-height: 0;
              max-height: none;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
              overflow-wrap: anywhere;
            }

            [data-scope="${sceneId}"] .heart-stage__modalSummary,
            [data-scope="${sceneId}"] .heart-stage__modalPrompt,
            [data-scope="${sceneId}"] .heart-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.5;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .heart-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .heart-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalImageContainer {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .heart-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .heart-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .heart-stage__modalImageContainer {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .heart-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .heart-stage__modalDetails::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .heart-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .heart-stage__modalSummary,
            [data-scope="${sceneId}"] .heart-stage__modalPrompt,
            [data-scope="${sceneId}"] .heart-stage__modalChecks li {
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
        const modelSrc = resolveModelSource(model.source);
        const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
        container.setAttribute("data-scope", sceneId);
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        container.innerHTML = `
          <div class="heart-stage">
            <div class="heart-stage__frame" data-role="frame">
              <model-viewer
                class="heart-stage__modelViewer"
                data-role="model-viewer"
                src="${escapeHtml(modelSrc)}"
                camera-controls
                interaction-prompt="none"
                shadow-intensity="${isMobileModelTarget ? "0.35" : "0.8"}"
                exposure="${isMobileModelTarget ? "0.88" : "0.95"}"
                auto-rotate-delay="0"
                rotation-per-second="${isMobileModelTarget ? "10deg" : "22deg"}"
                environment-image="neutral"
                loading="eager"
                field-of-view="42deg"
                min-field-of-view="12deg"
                max-field-of-view="82deg"
                max-camera-orbit="auto auto 10m"
                camera-orbit="${escapeHtml(getTaskCameraOrbit(task, model))}"
                alt="${escapeHtml(model.alt)}">
                <div class="heart-stage__poster" slot="poster">模型加载中...</div>
              </model-viewer>
              <div class="heart-stage__hud">
                <div class="heart-stage__modeBadge">
                  <div class="heart-stage__modeLabel">当前模型</div>
                  <div class="heart-stage__modeValue" data-role="model-label">${escapeHtml(model.title)}</div>
                </div>
                <div class="heart-stage__modeBadge">
                  <div class="heart-stage__modeLabel">当前观察任务</div>
                  <div class="heart-stage__modeValue" data-role="task-label">${escapeHtml(task.title)}</div>
                </div>
              </div>
              <div class="heart-stage__bottom">
                <div class="heart-stage__legend" aria-label="血液颜色图例">
                  <div class="heart-stage__legendItem"><span class="heart-stage__dot" style="--dot-color:#ef4444"></span>含氧较多的动脉血</div>
                  <div class="heart-stage__legendItem"><span class="heart-stage__dot" style="--dot-color:#3b82f6"></span>含氧较少的静脉血</div>
                </div>
              </div>

              <!-- Interactive Pedagogical Modal Overlay -->
              <div class="heart-stage__modalOverlay${state.showModal ? " is-open" : ""}" data-role="modal-overlay">
                <div class="heart-stage__modalContent">
                  <button class="heart-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="heart-stage__modalGrid">
                    <div class="heart-stage__modalImageContainer">
                      <img class="heart-stage__modalImage" src="${escapeHtml(assetBase + task.imageRelativeUrl)}" alt="${escapeHtml(task.title)}" />
                      <div class="heart-stage__modalImageGlow" style="--glow-color-rgb: ${hexToRgb(task.accent)}"></div>
                      <div class="heart-stage__labelsOverlay" data-role="labels-overlay">
                        ${renderChineseLabels(task.id, task.accent)}
                      </div>
                    </div>
                    <div class="heart-stage__modalDetails">
                      <div>
                        <span class="heart-stage__modalEyebrow" style="background: ${task.accent}1c; color: ${task.accent}">
                          心脏与血液循环 · 核心精讲
                        </span>
                        <h2 class="heart-stage__modalTitle">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="heart-stage__modalSummary">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="heart-stage__modalSectionTitle" style="color: ${task.accent}">💡 学习提示</h3>
                        <p class="heart-stage__modalPrompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="heart-stage__modalSectionTitle" style="color: ${task.accent}">📝 知识要点</h3>
                        <ul class="heart-stage__modalChecks" style="--check-color: ${task.accent}">
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
        const model = getActiveModel();
        const modelButtons = MODEL_OPTIONS.map(modelItem => `
          <button class="p-model${modelItem.id === state.activeModel ? " is-active" : ""}"
                  type="button"
                  data-action="select-model"
                  data-value="${escapeHtml(modelItem.id)}"
                  style="--item-accent:${modelItem.accent}">
            <strong>${escapeHtml(modelItem.title)}</strong>
            <span>${escapeHtml(modelItem.label)}</span>
          </button>
        `).join("");
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
        const animationButton = model.animationName
          ? `<button class="p-action${state.playAnimation ? " is-active" : ""}" type="button" data-action="toggle-animation">${state.playAnimation ? "暂停解剖动画" : "播放解剖动画"}</button>`
          : "";

        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--task-accent:${task.accent}; --task-accent-soft:${task.accent}26">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <h2 class="p-title">心脏与血液循环</h2>
              <p class="p-desc">左侧保留解剖模型和整体模型。拖拽旋转，滚轮缩放；点击观察任务会自动切换到对应视角。</p>
              <div class="p-actionRow">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">自动旋转</button>
                ${animationButton}
                <button class="p-action" type="button" data-action="reset-camera">复位视角</button>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">模型切换</span>
              <div class="p-modelGrid">${modelButtons}</div>
              <p class="p-desc">${escapeHtml(model.description)}</p>
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
              <span class="p-eyebrow">循环路线</span>
              <div class="p-flow">
                <div class="p-flowLine"><span>肺循环</span><strong>右心室 -> 肺动脉 -> 肺部毛细血管 -> 肺静脉 -> 左心房</strong></div>
                <div class="p-flowLine"><span>体循环</span><strong>左心室 -> 主动脉 -> 全身毛细血管 -> 上下腔静脉 -> 右心房</strong></div>
              </div>
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
        const model = getActiveModel();
        const viewer = findViewer();
        const taskText = container.querySelector('[data-role="task-text"]');
        const taskLabel = container.querySelector('[data-role="task-label"]');
        const modelLabel = container.querySelector('[data-role="model-label"]');
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        if (taskText) taskText.textContent = task.summary;
        if (taskLabel) taskLabel.textContent = task.title;
        if (modelLabel) modelLabel.textContent = model.title;
        if (viewer) {
          const cameraOrbit = getTaskCameraOrbit(task, model);
          const previousCameraKey = viewer.dataset.heartCameraKey || "";
          const previousSrc = viewer.getAttribute("src") || "";
          viewer.setAttribute("camera-orbit", cameraOrbit);
          viewer.setAttribute("alt", model.alt);
          const nextSrc = setViewerSource(viewer, model.source);
          const cameraKey = `${model.id}|${task.id}|${cameraOrbit}|${nextSrc}`;
          const shouldApplyCameraGoal = previousCameraKey !== cameraKey;
          viewer.dataset.heartCameraKey = cameraKey;
          if (state.autoRotate) viewer.setAttribute("auto-rotate", "");
          else viewer.removeAttribute("auto-rotate");
          if (state.playAnimation && model.animationName) {
            viewer.setAttribute("animation-name", model.animationName);
            viewer.setAttribute("autoplay", "");
            viewer.play?.();
          } else {
            viewer.removeAttribute("animation-name");
            viewer.removeAttribute("autoplay");
            viewer.pause?.();
          }
          if (shouldApplyCameraGoal) {
            const applyCameraGoal = () => {
              viewer.dismissPoster?.();
              viewer.jumpCameraToGoal?.();
            };
            if (previousSrc !== nextSrc) {
              viewer.addEventListener("load", () => {
                requestAnimationFrame(applyCameraGoal);
              }, { once: true });
            } else {
              requestAnimationFrame(applyCameraGoal);
            }
          }
        }

        const modalOverlay = container.querySelector('[data-role="modal-overlay"]');
        if (modalOverlay) {
          if (state.showModal) {
            const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
            const modalImage = modalOverlay.querySelector('.heart-stage__modalImage');
            const modalImageGlow = modalOverlay.querySelector('.heart-stage__modalImageGlow');
            const modalEyebrow = modalOverlay.querySelector('.heart-stage__modalEyebrow');
            const modalTitle = modalOverlay.querySelector('.heart-stage__modalTitle');
            const modalSummary = modalOverlay.querySelector('.heart-stage__modalSummary');
            const modalPrompt = modalOverlay.querySelector('.heart-stage__modalPrompt');
            const modalChecks = modalOverlay.querySelector('.heart-stage__modalChecks');
            const modalContent = modalOverlay.querySelector('.heart-stage__modalContent');
            const modalSecTitles = modalOverlay.querySelectorAll('.heart-stage__modalSectionTitle');
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
        const model = getActiveModel();
        if (!viewer) return;
        viewer.setAttribute("camera-orbit", getTaskCameraOrbit(task, model));
        viewer.dismissPoster?.();
        viewer.jumpCameraToGoal?.();
      }

      function closeModal() {
        state.showModal = false;
        updateStage();
        renderPanel();
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

        if (action === "select-model") {
          state.activeModel = value;
          const model = getActiveModel();
          if (!model.animationName) state.playAnimation = false;
          state.showModal = false;
          updateStage();
          renderPanel();
          resetCamera();
          return;
        }

        if (action === "toggle-auto-rotate") {
          state.autoRotate = !state.autoRotate;
          updateStage();
          renderPanel();
          return;
        }

        if (action === "toggle-animation") {
          const model = getActiveModel();
          if (!model.animationName) return;
          state.playAnimation = !state.playAnimation;
          updateStage();
          renderPanel();
          return;
        }

        if (action === "reset-camera") {
          closeModal();
          resetCamera();
          return;
        }

        if (action === "answer-quiz") {
          const picked = QUIZ.options.find(option => option.id === value);
          state.quizAnswer = value;
          state.quizFeedback = picked && picked.correct
            ? "正确。肺循环从右心室出发，经肺动脉到肺部完成气体交换，再由肺静脉回到左心房。"
            : "再看一次路线：只有从右心室出发、经过肺部、回到左心房的路径才是肺循环。";
          renderPanel();
        }
      }

      function handleStageClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");

        if (action === "close-modal") {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
        }
      }

      function cleanupScene() {
        disposed = true;
        window.BiologyApp?.releaseBiologyModelViewers?.(container);
        if (panelHost) panelHost.removeEventListener("click", handlePanelClick);
        container.removeEventListener("click", handleStageClick);
        const style = document.getElementById(`${sceneId}-style`);
        if (style) style.remove();
      }

      setScopedStyle();
      renderStage();
      renderPanel();
      updateStage();
      if (panelHost) panelHost.addEventListener("click", handlePanelClick);
      container.addEventListener("click", handleStageClick);
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
    }
  };
})();

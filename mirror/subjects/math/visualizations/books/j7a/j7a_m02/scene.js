window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m02";
  const VENDOR_PATH = "assets/vendor/three/";
  const STYLE_ID = "math-net-fold-scene-style";
  const SCRIPT_CACHE = window.__MATH_SCENE_SCRIPT_CACHE__ || (window.__MATH_SCENE_SCRIPT_CACHE__ = new Map());

  function loadScriptOnce(src) {
    if (!src) return Promise.resolve(false);
    if (SCRIPT_CACHE.has(src)) return SCRIPT_CACHE.get(src);

    const promise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-math-scene-src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve(true);
          return;
        }
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.mathSceneSrc = src;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve(true);
      };
      script.onerror = () => {
        SCRIPT_CACHE.delete(src);
        script.remove();
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });

    SCRIPT_CACHE.set(src, promise);
    return promise;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .math-net-scene,
      .math-net-scene *,
      .math-net-panel,
      .math-net-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-net-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 26% 20%, rgba(56,189,248,0.17), transparent 32%),
          radial-gradient(circle at 78% 70%, rgba(250,204,21,0.09), transparent 36%),
          linear-gradient(145deg, #020617 0%, #08111f 52%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-net-host {
        position: absolute;
        inset: 0;
        overflow: hidden;
        touch-action: none;
      }
      .math-net-host canvas {
        display: block;
        width: 100%;
        height: 100%;
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-net-loading,
      .math-net-error {
        position: absolute;
        inset: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
        color: rgba(248,250,252,0.9);
        font-size: 14px;
        font-weight: 900;
        line-height: 1.6;
        background: radial-gradient(circle at center, rgba(56,189,248,0.14), rgba(2,6,23,0.96));
      }
      .math-net-error {
        color: #fecaca;
      }
      .math-net-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 4;
        display: grid;
        grid-template-columns: repeat(3, minmax(78px, 1fr));
        gap: 8px;
        width: min(430px, calc(100% - 28px));
        pointer-events: none;
      }
      .math-net-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-net-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 950;
        white-space: nowrap;
      }
      .math-net-stat-value {
        margin-top: 3px;
        color: #f8fafc;
        font-size: 15px;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .math-net-face-label {
        position: absolute;
        left: 14px;
        bottom: 14px;
        z-index: 4;
        max-width: min(460px, calc(100% - 28px));
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.56);
        backdrop-filter: blur(12px);
        padding: 9px 11px;
        color: rgba(226,232,240,0.86);
        font-size: 12px;
        font-weight: 750;
        line-height: 1.45;
        pointer-events: none;
      }
      .math-net-minimap {
        position: absolute;
        right: 14px;
        bottom: 14px;
        z-index: 4;
        width: min(210px, calc(100% - 28px));
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.58);
        backdrop-filter: blur(12px);
        padding: 8px;
        pointer-events: auto;
      }
      .math-net-minimap-title {
        color: rgba(226,232,240,0.72);
        font-size: 10px;
        font-weight: 950;
        margin-bottom: 5px;
      }
      .math-net-minimap svg {
        display: block;
        width: 100%;
        height: 118px;
        cursor: pointer;
        touch-action: manipulation;
      }
      .math-net-cell {
        fill: rgba(15,23,42,0.78);
        stroke: rgba(125,211,252,0.42);
        stroke-width: 1.4;
        rx: 3;
      }
      .math-net-cell.active {
        fill: rgba(250,204,21,0.22);
        stroke: rgba(250,204,21,0.92);
        stroke-width: 2.2;
      }
      .math-net-cell.hover {
        fill: rgba(56,189,248,0.24);
        stroke: rgba(103,232,249,0.95);
        stroke-width: 2.2;
      }
      .math-net-cell-text {
        fill: rgba(248,250,252,0.92);
        font-size: 10px;
        font-weight: 950;
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .math-net-panel {
        --math-net-accent: #38bdf8;
        --math-net-accent-strong: #67e8f9;
        --math-net-gold: #facc15;
        --math-net-violet: #a78bfa;
        --math-net-line: rgba(255,255,255,0.086);
        --math-net-card: rgba(8,13,24,0.46);
        --math-net-control: rgba(255,255,255,0.052);
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        display: flex;
        flex-direction: column;
        gap: 9px;
        padding: 8px;
        color: #f8fafc;
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: pan-y;
      }
      .math-net-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-net-panel[data-size="compact"] {
        gap: 6px;
        padding: 8px;
      }
      .math-net-panel[data-size="micro"] {
        gap: 5px;
        padding: 7px;
      }
      .math-net-card {
        flex: 0 0 auto;
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--math-net-line);
        border-radius: 12px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.046), rgba(255,255,255,0.026)),
          var(--math-net-card);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.045);
        backdrop-filter: blur(12px);
        padding: 8px;
      }
      .math-net-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
        color: rgba(226,232,240,0.68);
        font-size: 11px;
        font-weight: 950;
      }
      .math-net-card-head span:last-child {
        color: rgba(103,232,249,0.88);
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 10px;
      }
      .math-net-panel[data-size="compact"] .math-net-card {
        padding: 8px;
      }
      .math-net-panel[data-size="micro"] .math-net-card {
        padding: 7px;
      }
      .math-net-shape-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }
      .math-net-shape-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .math-net-shape-section + .math-net-shape-section {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.07);
      }
      .math-net-section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        color: rgba(226,232,240,0.58);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 0;
      }
      .math-net-section-title b {
        color: rgba(248,250,252,0.86);
        font-size: 11px;
      }
      .math-net-section-title span {
        color: rgba(103,232,249,0.74);
        font-family: "JetBrains Mono", Consolas, monospace;
      }
      .math-net-button {
        width: 100%;
        min-width: 0;
        min-height: 30px;
        border: 1px solid var(--math-net-line);
        border-radius: 8px;
        background: var(--math-net-control);
        color: rgba(248,250,252,0.9);
        font-size: 12px;
        font-weight: 950;
        line-height: 1.15;
        cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
        white-space: normal;
        overflow-wrap: anywhere;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-net-button:hover {
        border-color: rgba(56,189,248,0.52);
        background: rgba(56,189,248,0.09);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(103,232,249,0.06);
      }
      .math-net-button:active {
        transform: scale(0.98);
      }
      .math-net-button.active {
        border-color: rgba(103,232,249,0.68);
        background: linear-gradient(135deg, rgba(14,165,233,0.74), rgba(37,99,235,0.66));
        color: #f8fafc;
        box-shadow: 0 8px 20px rgba(14,165,233,0.16);
      }
      .math-net-button.toggle-on {
        border-color: rgba(250,204,21,0.6);
        background: rgba(250,204,21,0.14);
        color: #fde68a;
      }
      .math-net-button.warn.toggle-on {
        border-color: rgba(250,204,21,0.6);
        background: rgba(250,204,21,0.14);
        color: #fde68a;
      }
      .math-net-control-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        color: rgba(226,232,240,0.72);
        font-size: 11px;
        font-weight: 950;
      }
      .math-net-value {
        color: var(--math-net-accent-strong);
        font-family: "JetBrains Mono", Consolas, monospace;
      }
      .math-net-range {
        width: 100%;
        height: 24px;
        min-height: 24px;
        margin: 0 0 5px;
        accent-color: var(--math-net-accent);
        cursor: pointer;
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-net-range::-webkit-slider-runnable-track {
        min-height: 5px;
      }
      .math-net-range::-webkit-slider-thumb {
        min-width: 18px;
        min-height: 18px;
      }
      .math-net-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }
      .math-net-stage-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 5px;
        margin: 6px 0;
      }
      .math-net-stage-grid .math-net-button {
        min-height: 26px;
        font-size: 10px;
      }
      .math-net-panel[data-wide="true"] .math-net-shape-grid,
      .math-net-panel[data-wide="true"] .math-net-actions {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .math-net-panel[data-wide="true"] .math-net-shape-section[data-kind="cube"] .math-net-shape-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .math-net-panel[data-size="compact"] .math-net-button,
      .math-net-panel[data-size="micro"] .math-net-button {
        min-height: 28px;
        font-size: 11px;
      }
      .math-net-panel[data-size="micro"] .math-net-button {
        min-height: 26px;
      }
      .math-net-panel[data-size="micro"] .math-net-shape-grid,
      .math-net-panel[data-size="micro"] .math-net-actions,
      .math-net-panel[data-size="micro"] .math-net-stage-grid {
        gap: 5px;
      }
      .math-net-panel[data-size="micro"] .math-net-range {
        height: 28px;
        min-height: 24px;
        margin: 0 0 4px;
      }
      .math-net-explain {
        flex: 0 0 auto;
        min-height: 0;
        display: flex;
        align-items: center;
        border-left: 4px solid var(--math-net-accent);
        color: rgba(226,232,240,0.88);
        font-size: 12px;
        font-weight: 650;
        line-height: 1.42;
        padding-top: 6px;
        padding-bottom: 6px;
      }
      .math-net-explain strong {
        color: var(--math-net-gold);
      }
      .math-net-panel[data-size="micro"] .math-net-explain {
        font-size: 11px;
        line-height: 1.42;
      }
      @media (max-width: 980px), (max-height: 620px) {
        .math-net-hud {
          left: 10px;
          top: 10px;
          gap: 6px;
        }
        .math-net-stat {
          padding: 7px 8px;
        }
        .math-net-stat-value {
          font-size: 13px;
        }
        .math-net-face-label {
          left: 10px;
          bottom: 10px;
          font-size: 11px;
          max-width: calc(100% - 218px);
        }
        .math-net-minimap {
          right: 10px;
          bottom: 10px;
          width: 190px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createScene(container, context) {
    ensureStyle();

    const panel = context.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
    const sceneEl = document.createElement("div");
    sceneEl.className = "math-net-scene";
    sceneEl.innerHTML = `
      <div class="math-net-host" data-host></div>
      <div class="math-net-loading" data-loading>正在载入本地三维几何引擎...</div>
      <div class="math-net-hud">
        <div class="math-net-stat">
          <div class="math-net-stat-label">图形</div>
          <div class="math-net-stat-value" data-hud-shape>正方体</div>
        </div>
        <div class="math-net-stat">
          <div class="math-net-stat-label">折叠</div>
          <div class="math-net-stat-value" data-hud-fold>0%</div>
        </div>
        <div class="math-net-stat">
          <div class="math-net-stat-label">面片</div>
          <div class="math-net-stat-value" data-hud-face>6 个</div>
        </div>
      </div>
      <div class="math-net-face-label" data-face-label>拖动左侧模型可自由旋转视角，悬停面片可高亮追踪。</div>
      <div class="math-net-minimap" data-minimap>
        <div class="math-net-minimap-title">展开图联动</div>
        <svg viewBox="0 0 180 118" data-minimap-svg></svg>
      </div>
    `;
    container.innerHTML = "";
    container.appendChild(sceneEl);

    if (panel) {
      panel.innerHTML = `
        <div class="math-net-panel" data-panel>
          <section class="math-net-card">
            <div class="math-net-card-head"><span>图形</span><span data-current-shape>正方体</span></div>
            <div data-shapes>
              <div class="math-net-shape-section" data-kind="cube">
                <div class="math-net-section-title"><b>正方体展开图</b><span>11 种</span></div>
                <div class="math-net-shape-grid">
                  <button class="math-net-button active" type="button" data-shape="cube">01 十字形</button>
                  <button class="math-net-button" type="button" data-shape="cube222">02 阶梯 2-2-2</button>
                  <button class="math-net-button" type="button" data-shape="cube231">03 型 2-3-1</button>
                  <button class="math-net-button" type="button" data-shape="cube33">04 阶梯 3-3</button>
                  <button class="math-net-button" type="button" data-shape="cubeNet05">05 型 1-4-1</button>
                  <button class="math-net-button" type="button" data-shape="cubeNet06">06 型 1-3-1-1</button>
                  <button class="math-net-button" type="button" data-shape="cubeNet07">07 型 1-2-1-2</button>
                  <button class="math-net-button" type="button" data-shape="cubeNet08">08 型 1-4-1</button>
                  <button class="math-net-button" type="button" data-shape="cubeNet09">09 型 1-4-1</button>
                  <button class="math-net-button" type="button" data-shape="cubeNet10">10 型 1-4-1</button>
                  <button class="math-net-button" type="button" data-shape="cubeNet11">11 型 1-2-2-1</button>
                </div>
              </div>
              <div class="math-net-shape-section" data-kind="solid">
                <div class="math-net-section-title"><b>其他立体图形</b><span>柱体 / 锥体</span></div>
                <div class="math-net-shape-grid">
                  <button class="math-net-button" type="button" data-shape="cuboid">长方体</button>
                  <button class="math-net-button" type="button" data-shape="prism">三棱柱</button>
                  <button class="math-net-button" type="button" data-shape="hexprism">六棱柱</button>
                  <button class="math-net-button" type="button" data-shape="pyramid">四棱锥</button>
                  <button class="math-net-button" type="button" data-shape="octahedron">正八面体</button>
                  <button class="math-net-button" type="button" data-shape="cylinder">圆柱</button>
                </div>
              </div>
            </div>
          </section>
          <section class="math-net-card">
            <div class="math-net-control-head">
              <span>折叠进度</span>
              <span class="math-net-value" data-progress-value>0%</span>
            </div>
            <input class="math-net-range" type="range" min="0" max="1" step="0.01" value="0" data-control="fold" aria-label="折叠进度">
            <div class="math-net-card-head"><span>阶段</span><span></span></div>
            <div class="math-net-stage-grid">
              <button class="math-net-button" type="button" data-stage="0">0%</button>
              <button class="math-net-button" type="button" data-stage="0.25">25%</button>
              <button class="math-net-button" type="button" data-stage="0.5">50%</button>
              <button class="math-net-button" type="button" data-stage="0.75">75%</button>
              <button class="math-net-button" type="button" data-stage="1">100%</button>
            </div>
            <div class="math-net-card-head"><span>操作</span><span></span></div>
            <div class="math-net-actions">
              <button class="math-net-button warn" type="button" data-action="auto">演示一遍</button>
              <button class="math-net-button toggle-on" type="button" data-action="sequence">逐面折叠</button>
              <button class="math-net-button" type="button" data-action="explode">爆炸分离</button>
              <button class="math-net-button" type="button" data-action="xray">透视</button>
            </div>
          </section>
          <section class="math-net-card math-net-explain" data-explain>
            <strong>正方体 1-4-1：</strong>经典十字形展开图。推动滑杆可观察 6 个正方形面如何沿公共棱折叠成完整立方体。
          </section>
        </div>
      `;
    }

    const state = {
      destroyed: false,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      grid: null,
      current: null,
      currentType: "cube",
      progress: 0,
      isXRay: false,
      isExploded: false,
      targetExplode: 0,
      currentExplode: 0,
      isAnimating: false,
      animDir: 1,
      demoStopIndex: 0,
      pauseUntil: 0,
      isSequential: true,
      activeHingeIndex: -1,
      hoveredFace: null,
      lockedFace: null,
      mouse: null,
      raycaster: null,
      tapStart: null,
      raf: 0,
      resizeObserver: null,
      abort: typeof AbortController !== "undefined" ? new AbortController() : null
    };

    const els = {
      host: sceneEl.querySelector("[data-host]"),
      loading: sceneEl.querySelector("[data-loading]"),
      hudShape: sceneEl.querySelector("[data-hud-shape]"),
      hudFold: sceneEl.querySelector("[data-hud-fold]"),
      hudFace: sceneEl.querySelector("[data-hud-face]"),
      faceLabel: sceneEl.querySelector("[data-face-label]"),
      minimapSvg: sceneEl.querySelector("[data-minimap-svg]"),
      panel: panel?.querySelector("[data-panel]") || null,
      slider: panel?.querySelector('[data-control="fold"]') || null,
      progressValue: panel?.querySelector("[data-progress-value]") || null,
      currentShape: panel?.querySelector("[data-current-shape]") || null,
      explain: panel?.querySelector("[data-explain]") || null
    };

    const shapeMeta = {
      cube: {
        label: "正方体 1-4-1",
        faces: 6,
        explain: "<strong>正方体：</strong>十字展开，逐面闭合。"
      },
      cube222: {
        label: "正方体 2-2-2",
        faces: 6,
        explain: "<strong>正方体：</strong>阶梯展开，连续翻折。"
      },
      cube231: {
        label: "正方体 2-3-1",
        faces: 6,
        explain: "<strong>正方体：</strong>2-3-1 展开，上排 2 面、中排 3 面、下排 1 面，观察分支面如何围成缺口并闭合。"
      },
      cube33: {
        label: "正方体 3-3 阶梯",
        faces: 6,
        explain: "<strong>正方体：</strong>3-3 阶梯展开，两排各 3 面错位连接，适合比较阶梯形展开的折叠方向。"
      },
      cubeNet05: {
        label: "正方体展开 05",
        faces: 6,
        explain: "<strong>正方体：</strong>1-4-1 变式。观察中间四连面与两侧面如何封闭成相对面。"
      },
      cubeNet06: {
        label: "正方体展开 06",
        faces: 6,
        explain: "<strong>正方体：</strong>1-3-1-1 型。重点看连续折叠后两端面不会重叠。"
      },
      cubeNet07: {
        label: "正方体展开 07",
        faces: 6,
        explain: "<strong>正方体：</strong>1-2-1-2 型。分支面沿公共棱折起后补齐缺口。"
      },
      cubeNet08: {
        label: "正方体展开 08",
        faces: 6,
        explain: "<strong>正方体：</strong>1-4-1 变式。比较它与十字形展开的相同折叠骨架。"
      },
      cubeNet09: {
        label: "正方体展开 09",
        faces: 6,
        explain: "<strong>正方体：</strong>1-4-1 端部变式。关注端面折起后的相对位置。"
      },
      cubeNet10: {
        label: "正方体展开 10",
        faces: 6,
        explain: "<strong>正方体：</strong>1-4-1 另一种端部变式，验证六面围合不重叠。"
      },
      cubeNet11: {
        label: "正方体展开 11",
        faces: 6,
        explain: "<strong>正方体：</strong>1-2-2-1 型。用折叠验证阶梯连接的合法性。"
      },
      cuboid: {
        label: "长方体",
        faces: 6,
        explain: "<strong>长方体：</strong>三组相对面配对闭合。"
      },
      prism: {
        label: "三棱柱",
        faces: 5,
        explain: "<strong>三棱柱：</strong>侧面围合，三角底面封闭。"
      },
      hexprism: {
        label: "六棱柱",
        faces: 8,
        explain: "<strong>六棱柱：</strong>六个侧面卷合成柱。"
      },
      pyramid: {
        label: "四棱锥",
        faces: 5,
        explain: "<strong>四棱锥：</strong>四个侧面汇聚顶点。"
      },
      octahedron: {
        label: "正八面体",
        faces: 8,
        explain: "<strong>正八面体：</strong>三角面带折成双锥。"
      },
      cylinder: {
        label: "圆柱",
        faces: 38,
        explain: "<strong>圆柱：</strong>侧面卷合，圆面封闭。"
      }
    };

    const netCells = {
      cube: [[2, 1], [0, 2], [1, 2], [2, 2], [3, 2], [2, 3]],
      cube222: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
      cube231: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
      cube33: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]],
      cubeNet05: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1], [3, 1]],
      cubeNet06: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 1]],
      cubeNet07: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 3]],
      cubeNet08: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 1], [3, 1]],
      cubeNet09: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [3, 1]],
      cubeNet10: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
      cubeNet11: [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 2]],
      cuboid: [[2, 1], [1, 2], [2, 2], [3, 2], [4, 2], [2, 3]],
      prism: [[1, 1], [2, 1], [3, 1], [1, 0], [1, 2]],
      hexprism: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [2, 0], [2, 2]],
      pyramid: [[2, 2], [2, 1], [3, 2], [2, 3], [1, 2]],
      octahedron: [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [2, 0], [1, 2], [2, 2]],
      cylinder: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [2, 0], [2, 2]]
    };

    function addEvent(target, eventName, handler, options) {
      if (!target) return;
      target.addEventListener(eventName, handler, state.abort ? { ...options, signal: state.abort.signal } : options);
    }

    function blockNativeTouchMenus(target) {
      addEvent(target, "contextmenu", event => event.preventDefault());
      addEvent(target, "selectstart", event => event.preventDefault());
      addEvent(target, "dragstart", event => event.preventDefault());
    }

    function setError(message) {
      if (state.destroyed) return;
      els.loading.className = "math-net-error";
      els.loading.textContent = message;
    }

    function setExplain(html) {
      if (els.explain) els.explain.innerHTML = html;
    }

    function renderMiniMap(activeFaceIndex = -1, hoverFaceIndex = -1) {
      if (!els.minimapSvg) return;
      const cells = netCells[state.currentType] || netCells.cube;
      const minX = Math.min(...cells.map(cell => cell[0]));
      const maxX = Math.max(...cells.map(cell => cell[0]));
      const minY = Math.min(...cells.map(cell => cell[1]));
      const maxY = Math.max(...cells.map(cell => cell[1]));
      const cellSize = Math.min(26, 150 / Math.max(1, maxX - minX + 1), 92 / Math.max(1, maxY - minY + 1));
      const gap = 4;
      const width = (maxX - minX + 1) * (cellSize + gap) - gap;
      const height = (maxY - minY + 1) * (cellSize + gap) - gap;
      const ox = (180 - width) / 2;
      const oy = (108 - height) / 2 + 4;
      els.minimapSvg.innerHTML = cells.map((cell, index) => {
        const x = ox + (cell[0] - minX) * (cellSize + gap);
        const y = oy + (cell[1] - minY) * (cellSize + gap);
        const faceIndex = index + 1;
        const cls = `math-net-cell${faceIndex === activeFaceIndex ? " active" : ""}${faceIndex === hoverFaceIndex ? " hover" : ""}`;
        return `
          <rect class="${cls}" data-face="${faceIndex}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"></rect>
          <text class="math-net-cell-text" data-face="${faceIndex}" x="${x + cellSize / 2}" y="${y + cellSize / 2}">${faceIndex}</text>
        `;
      }).join("");
    }

    function setActiveHinge(index) {
      state.activeHingeIndex = index;
      if (!state.current) {
        renderMiniMap(-1, -1);
        return;
      }
      state.current.allFaces.forEach(face => {
        face.traverse(child => {
          if (child.material?.emissive) child.material.emissive.setHex(0x000000);
        });
      });
      if (state.lockedFace) setFaceEmissive(state.lockedFace, 0x1a5b8a);
      state.current.hinges.forEach((hinge, hingeIndex) => {
        if (hinge.glow) hinge.glow.visible = hingeIndex === index;
      });
      const hinge = state.current.hinges[index];
      const activeFace = hinge?.face || state.current.allFaces[index + 1];
      if (activeFace) {
        activeFace.traverse(child => {
          if (child.material?.emissive) child.material.emissive.setHex(0x3f3000);
        });
        els.faceLabel.textContent = `面片 ${activeFace.userData.faceIndex} 正沿公共棱折起。`;
      }
      const activeFaceIndex = activeFace?.userData?.faceIndex || -1;
      const hoverFaceIndex = getFaceIndex(state.lockedFace || state.hoveredFace) || -1;
      renderMiniMap(activeFaceIndex, hoverFaceIndex);
    }

    function fitPanel() {
      if (!els.panel || !panel) return;
      const rect = panel.getBoundingClientRect();
      let size = "normal";
      if (rect.height < 720 || rect.width < 312 || context.layout?.shortHeight) size = "compact";
      if (rect.height < 620 || rect.width < 276 || context.layout?.tinyLandscape) size = "micro";
      els.panel.dataset.size = size;
      els.panel.dataset.wide = rect.width >= 430 ? "true" : "false";
      if (els.panel.scrollHeight > els.panel.clientHeight + 1 && size === "normal") {
        size = "compact";
        els.panel.dataset.size = size;
      }
      if (els.panel.scrollHeight > els.panel.clientHeight + 1 && size !== "micro") {
        size = "micro";
        els.panel.dataset.size = size;
      }
    }

    function colorFor(index) {
      const colors = [0x38bdf8, 0x67e8f9, 0xfacc15, 0xa78bfa, 0x60a5fa, 0xfde047, 0x22d3ee, 0xc084fc];
      return colors[index % colors.length];
    }

    function createFaceGroup(geo, matIndex, isFaint = false) {
      const THREE = window.THREE;
      const group = new THREE.Group();
      const explodeGroup = new THREE.Group();
      const outerMaterial = new THREE.MeshPhysicalMaterial({
        color: colorFor(matIndex),
        transparent: true,
        opacity: isFaint ? 0.64 : 0.86,
        side: THREE.BackSide,
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 0.55,
        emissive: 0x000000
      });
      const innerMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf8fafc,
        transparent: true,
        opacity: isFaint ? 0.48 : 0.82,
        side: THREE.FrontSide,
        roughness: 0.82,
        metalness: 0.0,
        emissive: 0x000000
      });

      outerMaterial.userData = { baseOpacity: outerMaterial.opacity, isOuter: true };
      innerMaterial.userData = { baseOpacity: innerMaterial.opacity, isInner: true };

      const outer = new THREE.Mesh(geo, outerMaterial);
      const inner = new THREE.Mesh(geo, innerMaterial);
      outer.userData = { isFaceMesh: true };
      inner.userData = { isFaceMesh: true };
      explodeGroup.add(outer, inner);

      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: isFaint ? 0x7dd3fc : 0xffffff,
          transparent: true,
          opacity: isFaint ? 0.34 : 0.96
        })
      );
      line.userData = { isEdge: true, baseOpacity: line.material.opacity, isFaint };
      explodeGroup.add(line);

      group.add(explodeGroup);
      group.userData.explodeGroup = explodeGroup;
      group.userData.faceIndex = matIndex + 1;
      return group;
    }

    function attachHingeGlow(hinge) {
      const THREE = window.THREE;
      const axis = hinge.axis || new THREE.Vector3(1, 0, 0);
      const length = 2.7;
      const start = axis.clone().normalize().multiplyScalar(-length / 2);
      const end = axis.clone().normalize().multiplyScalar(length / 2);
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const material = new THREE.LineBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.96,
        depthTest: false
      });
      const glow = new THREE.Line(geometry, material);
      glow.visible = false;
      glow.renderOrder = 20;
      hinge.obj.add(glow);
      hinge.glow = glow;
    }

    function createCube() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const size = 2.4;
      const half = size / 2;
      const geo = new THREE.PlaneGeometry(size, size);
      const base = createFaceGroup(geo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);

      function add(parent, pivotPos, meshOffset, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(geo, matIndex);
        face.position.set(...meshOffset);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
        return face;
      }

      const top = add(base, [0, half, 0], [0, half, 0], [1, 0, 0], Math.PI / 2, 1);
      add(base, [0, -half, 0], [0, -half, 0], [1, 0, 0], -Math.PI / 2, 2);
      add(base, [half, 0, 0], [half, 0, 0], [0, 1, 0], -Math.PI / 2, 3);
      add(base, [-half, 0, 0], [-half, 0, 0], [0, 1, 0], Math.PI / 2, 4);
      add(top, [0, half, 0], [0, half, 0], [1, 0, 0], Math.PI / 2, 5);
      return { root, hinges, allFaces };
    }

    function createCube222() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const size = 2.4;
      const half = size / 2;
      const geo = new THREE.PlaneGeometry(size, size);
      const base = createFaceGroup(geo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);

      function add(parent, pivotPos, meshOffset, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(geo, matIndex);
        face.position.set(...meshOffset);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
        return face;
      }

      const s2 = add(base, [half, 0, 0], [half, 0, 0], [0, 1, 0], -Math.PI / 2, 1);
      const s3 = add(s2, [0, -half, 0], [0, -half, 0], [1, 0, 0], -Math.PI / 2, 2);
      const s4 = add(s3, [half, 0, 0], [half, 0, 0], [0, 1, 0], -Math.PI / 2, 3);
      const s5 = add(s4, [0, -half, 0], [0, -half, 0], [1, 0, 0], -Math.PI / 2, 4);
      add(s5, [half, 0, 0], [half, 0, 0], [0, 1, 0], -Math.PI / 2, 5);
      root.position.set(-size, 0, size);
      return { root, hinges, allFaces };
    }

    function createCube231() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const size = 2.4;
      const half = size / 2;
      const geo = new THREE.PlaneGeometry(size, size);
      const base = createFaceGroup(geo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);

      function add(parent, pivotPos, meshOffset, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(geo, matIndex);
        face.position.set(...meshOffset);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
        return face;
      }

      const middleRight = add(base, [half, 0, 0], [half, 0, 0], [0, 1, 0], -Math.PI / 2, 1);
      add(middleRight, [half, 0, 0], [half, 0, 0], [0, 1, 0], -Math.PI / 2, 2);
      const upper = add(base, [0, half, 0], [0, half, 0], [1, 0, 0], Math.PI / 2, 3);
      add(upper, [-half, 0, 0], [-half, 0, 0], [0, 1, 0], Math.PI / 2, 4);
      add(middleRight, [0, -half, 0], [0, -half, 0], [1, 0, 0], -Math.PI / 2, 5);
      root.position.set(-size * 0.7, 0, size * 0.35);
      return { root, hinges, allFaces };
    }

    function createCube33() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const size = 2.4;
      const half = size / 2;
      const geo = new THREE.PlaneGeometry(size, size);
      const base = createFaceGroup(geo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);

      function add(parent, pivotPos, meshOffset, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(geo, matIndex);
        face.position.set(...meshOffset);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
        return face;
      }

      const topMiddle = add(base, [-half, 0, 0], [-half, 0, 0], [0, 1, 0], Math.PI / 2, 1);
      add(topMiddle, [-half, 0, 0], [-half, 0, 0], [0, 1, 0], Math.PI / 2, 2);
      const lowerLeft = add(base, [0, -half, 0], [0, -half, 0], [1, 0, 0], -Math.PI / 2, 3);
      const lowerMiddle = add(lowerLeft, [half, 0, 0], [half, 0, 0], [0, 1, 0], -Math.PI / 2, 4);
      add(lowerMiddle, [half, 0, 0], [half, 0, 0], [0, 1, 0], -Math.PI / 2, 5);
      root.position.set(size * 0.4, 0, size * 0.55);
      return { root, hinges, allFaces };
    }

    function createCubeNetFromCells(cells) {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const size = 2.4;
      const half = size / 2;
      const geo = new THREE.PlaneGeometry(size, size);
      const cellMap = new Map(cells.map((cell, index) => [`${cell[0]},${cell[1]}`, { x: cell[0], y: cell[1], index }]));
      const minX = Math.min(...cells.map(cell => cell[0]));
      const maxX = Math.max(...cells.map(cell => cell[0]));
      const minY = Math.min(...cells.map(cell => cell[1]));
      const maxY = Math.max(...cells.map(cell => cell[1]));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const rootCell = cells[Math.floor(cells.length / 2)] || cells[0];
      const rootKey = `${rootCell[0]},${rootCell[1]}`;
      const baseCell = cellMap.get(rootKey) || cellMap.values().next().value;
      const base = createFaceGroup(geo, baseCell.index);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      root.position.set((centerX - baseCell.x) * size, 0, (baseCell.y - centerY) * size);
      allFaces.push(base);

      function hingeSpec(dx, dy) {
        if (dx === 1) return { pivot: [half, 0, 0], offset: [half, 0, 0], axis: [0, 1, 0], angle: -Math.PI / 2 };
        if (dx === -1) return { pivot: [-half, 0, 0], offset: [-half, 0, 0], axis: [0, 1, 0], angle: Math.PI / 2 };
        if (dy === 1) return { pivot: [0, half, 0], offset: [0, half, 0], axis: [1, 0, 0], angle: Math.PI / 2 };
        return { pivot: [0, -half, 0], offset: [0, -half, 0], axis: [1, 0, 0], angle: -Math.PI / 2 };
      }

      function add(parent, cell, dx, dy) {
        const spec = hingeSpec(dx, dy);
        const pos = new THREE.Group();
        pos.position.set(...spec.pivot);
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(geo, cell.index);
        face.position.set(...spec.offset);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...spec.axis), angle: spec.angle });
        allFaces.push(face);
        return face;
      }

      const queue = [{ cell: baseCell, face: base }];
      const visited = new Set([`${baseCell.x},${baseCell.y}`]);
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (queue.length) {
        const item = queue.shift();
        directions.forEach(([dx, dy]) => {
          const key = `${item.cell.x + dx},${item.cell.y + dy}`;
          const nextCell = cellMap.get(key);
          if (!nextCell || visited.has(key)) return;
          visited.add(key);
          const face = add(item.face, nextCell, dx, dy);
          queue.push({ cell: nextCell, face });
        });
      }

      return { root, hinges, allFaces };
    }

    function createCuboid() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const w = 3.6;
      const d = 2.0;
      const h = 1.6;
      const baseGeo = new THREE.PlaneGeometry(w, d);
      const frontGeo = new THREE.PlaneGeometry(w, h);
      const sideGeo = new THREE.PlaneGeometry(h, d);
      const base = createFaceGroup(baseGeo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);

      function add(parent, geo, pivotPos, meshOffset, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(geo, matIndex);
        face.position.set(...meshOffset);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
        return face;
      }

      const front = add(base, frontGeo, [0, d / 2, 0], [0, h / 2, 0], [1, 0, 0], Math.PI / 2, 1);
      add(base, frontGeo, [0, -d / 2, 0], [0, -h / 2, 0], [1, 0, 0], -Math.PI / 2, 2);
      add(base, sideGeo, [w / 2, 0, 0], [h / 2, 0, 0], [0, 1, 0], -Math.PI / 2, 3);
      add(base, sideGeo, [-w / 2, 0, 0], [-h / 2, 0, 0], [0, 1, 0], Math.PI / 2, 4);
      add(front, baseGeo, [0, h / 2, 0], [0, d / 2, 0], [1, 0, 0], Math.PI / 2, 5);
      return { root, hinges, allFaces };
    }

    function createPrism() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const w = 2.4;
      const h = 3.6;
      const halfW = w / 2;
      const rectGeo = new THREE.PlaneGeometry(w, h);
      const base = createFaceGroup(rectGeo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);

      function addRect(pivotPos, meshOffset, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        base.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(rectGeo, matIndex);
        face.position.set(...meshOffset);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
      }
      addRect([-halfW, 0, 0], [-halfW, 0, 0], [0, 1, 0], Math.PI * 2 / 3, 1);
      addRect([halfW, 0, 0], [halfW, 0, 0], [0, 1, 0], -Math.PI * 2 / 3, 2);

      const triHeight = Math.sqrt(w * w - halfW * halfW);
      const shape = new THREE.Shape();
      shape.moveTo(-halfW, 0);
      shape.lineTo(halfW, 0);
      shape.lineTo(0, triHeight);
      shape.lineTo(-halfW, 0);
      const triGeo = new THREE.ShapeGeometry(shape);

      function addTri(pivotPos, rotZ, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        pos.rotation.z = rotZ;
        base.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(triGeo, matIndex);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
      }

      addTri([0, h / 2, 0], 0, [1, 0, 0], Math.PI / 2, 3);
      addTri([0, -h / 2, 0], Math.PI, [1, 0, 0], Math.PI / 2, 4);
      return { root, hinges, allFaces };
    }

    function createHexPrism() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const w = 1.4;
      const h = 3.6;
      const r = w;
      const rectGeo = new THREE.PlaneGeometry(w, h);
      const base = createFaceGroup(rectGeo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);

      function addRect(parent, pivotPos, meshOffset, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(rectGeo, matIndex);
        face.position.set(...meshOffset);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
        return face;
      }

      let current = base;
      let middle = base;
      for (let i = 1; i <= 5; i += 1) {
        current = addRect(current, [w / 2, 0, 0], [w / 2, 0, 0], [0, 1, 0], -Math.PI / 3, i);
        if (i === 2) middle = current;
      }

      const hexGeo = new THREE.CircleGeometry(r, 6);
      const apothem = r * Math.sqrt(3) / 2;
      function addHex(parent, yPos, foldDir, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(0, yPos, 0);
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(hexGeo, matIndex);
        face.position.set(0, foldDir * apothem, 0);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(1, 0, 0), angle: foldDir * Math.PI / 2 });
        allFaces.push(face);
      }
      addHex(middle, h / 2, 1, 6);
      addHex(middle, -h / 2, -1, 7);
      root.position.x = -w * 2;
      return { root, hinges, allFaces };
    }

    function createPyramid() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const size = 2.8;
      const half = size / 2;
      const baseGeo = new THREE.PlaneGeometry(size, size);
      const base = createFaceGroup(baseGeo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);

      const shape = new THREE.Shape();
      shape.moveTo(-half, 0);
      shape.lineTo(half, 0);
      shape.lineTo(0, size);
      shape.lineTo(-half, 0);
      const triGeo = new THREE.ShapeGeometry(shape);

      function addTri(pivotPos, rotZ, axis, angle, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(...pivotPos);
        pos.rotation.z = rotZ;
        base.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(triGeo, matIndex);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(...axis), angle });
        allFaces.push(face);
      }

      const foldAngle = Math.PI * 2 / 3;
      addTri([0, half, 0], 0, [1, 0, 0], foldAngle, 1);
      addTri([0, -half, 0], Math.PI, [1, 0, 0], foldAngle, 2);
      addTri([-half, 0, 0], Math.PI / 2, [1, 0, 0], foldAngle, 3);
      addTri([half, 0, 0], -Math.PI / 2, [1, 0, 0], foldAngle, 4);
      return { root, hinges, allFaces };
    }

    function createOctahedron() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const a = 2.4;
      const h = a * Math.sqrt(3) / 2;
      const shape = new THREE.Shape();
      shape.moveTo(-a / 2, 0);
      shape.lineTo(a / 2, 0);
      shape.lineTo(0, h);
      shape.lineTo(-a / 2, 0);
      const triGeo = new THREE.ShapeGeometry(shape);
      const base = createFaceGroup(triGeo, 0);
      base.rotation.x = -Math.PI / 2;
      root.add(base);
      allFaces.push(base);
      const foldAngle = Math.PI - Math.acos(-1 / 3);

      function addFace(parent, pivotX, pivotY, alignZ, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(pivotX, pivotY, 0);
        pos.rotation.z = alignZ;
        parent.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(triGeo, matIndex);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(1, 0, 0), angle: foldAngle });
        allFaces.push(face);
        return face;
      }

      const t1 = addFace(base, a / 4, h / 2, -Math.PI / 3, 1);
      const t2 = addFace(t1, a / 4, h / 2, -Math.PI / 3, 2);
      const t3 = addFace(t2, -a / 4, h / 2, Math.PI / 3, 3);
      addFace(base, -a / 4, h / 2, Math.PI / 3, 4);
      addFace(t1, -a / 4, h / 2, Math.PI / 3, 5);
      addFace(t2, a / 4, h / 2, -Math.PI / 3, 6);
      addFace(t3, a / 4, h / 2, -Math.PI / 3, 7);
      root.position.set(-a, 0, a);
      return { root, hinges, allFaces };
    }

    function createCylinder() {
      const THREE = window.THREE;
      const root = new THREE.Group();
      const hinges = [];
      const allFaces = [];
      const radius = 1.4;
      const height = 3.5;
      const segments = 36;
      const circumference = Math.PI * 2 * radius;
      const width = circumference / segments;
      const rootPivot = new THREE.Group();
      rootPivot.position.x = -circumference / 2 + width / 2;
      root.add(rootPivot);

      const segGeo = new THREE.PlaneGeometry(width, height);
      let previous = rootPivot;
      let middle = null;
      for (let i = 0; i < segments; i += 1) {
        const pos = new THREE.Group();
        previous.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(segGeo, i, true);
        face.position.set(width / 2, 0, 0);
        hinge.add(face);
        allFaces.push(face);
        if (i > 0) hinges.push({ obj: hinge, axis: new THREE.Vector3(0, 1, 0), angle: -(Math.PI * 2) / segments });
        if (i === Math.floor(segments / 2)) middle = hinge;
        const next = new THREE.Group();
        next.position.set(width, 0, 0);
        hinge.add(next);
        previous = next;
      }

      const circleGeo = new THREE.CircleGeometry(radius, 48);
      function addCircle(yPos, rotZ, foldDir, matIndex) {
        const pos = new THREE.Group();
        pos.position.set(width / 2, yPos, 0);
        pos.rotation.z = rotZ;
        middle.add(pos);
        const hinge = new THREE.Group();
        pos.add(hinge);
        const face = createFaceGroup(circleGeo, matIndex);
        face.position.set(0, radius, 0);
        hinge.add(face);
        hinges.push({ obj: hinge, axis: new THREE.Vector3(1, 0, 0), angle: foldDir * Math.PI / 2 });
        allFaces.push(face);
      }
      addCircle(height / 2, 0, 1, 36);
      addCircle(-height / 2, Math.PI, 1, 37);
      root.rotation.x = -Math.PI / 2;
      return { root, hinges, allFaces };
    }

    const factories = {
      cube: createCube,
      cube222: createCube222,
      cube231: createCube231,
      cube33: createCube33,
      cubeNet05: () => createCubeNetFromCells(netCells.cubeNet05),
      cubeNet06: () => createCubeNetFromCells(netCells.cubeNet06),
      cubeNet07: () => createCubeNetFromCells(netCells.cubeNet07),
      cubeNet08: () => createCubeNetFromCells(netCells.cubeNet08),
      cubeNet09: () => createCubeNetFromCells(netCells.cubeNet09),
      cubeNet10: () => createCubeNetFromCells(netCells.cubeNet10),
      cubeNet11: () => createCubeNetFromCells(netCells.cubeNet11),
      cuboid: createCuboid,
      prism: createPrism,
      hexprism: createHexPrism,
      pyramid: createPyramid,
      octahedron: createOctahedron,
      cylinder: createCylinder
    };

    function applyFold(value) {
      state.progress = Math.max(0, Math.min(1, Number(value) || 0));
      const eased = state.progress < 0.5
        ? 2 * state.progress * state.progress
        : 1 - Math.pow(-2 * state.progress + 2, 2) / 2;
      if (els.slider) els.slider.value = String(state.progress);
      if (els.progressValue) els.progressValue.textContent = `${Math.round(state.progress * 100)}%`;
      if (els.hudFold) els.hudFold.textContent = `${Math.round(state.progress * 100)}%`;
      if (!state.current) return;
      const hingeCount = Math.max(1, state.current.hinges.length);
      const activeIndex = state.progress <= 0 ? -1 : Math.min(hingeCount - 1, Math.floor(state.progress * hingeCount));
      state.current.hinges.forEach((hinge, index) => {
        let local = eased;
        if (state.isSequential) {
          local = Math.max(0, Math.min(1, state.progress * hingeCount - index));
          local = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
        }
        hinge.obj.setRotationFromAxisAngle(hinge.axis, hinge.angle * local);
      });
      setActiveHinge(state.progress >= 1 ? hingeCount - 1 : activeIndex);
      if (els.panel) {
        els.panel.querySelectorAll("[data-stage]").forEach(button => {
          button.classList.toggle("active", Math.abs(Number(button.dataset.stage) - state.progress) < 0.01);
        });
      }
    }

    function setAutoState(active) {
      state.isAnimating = active;
      if (active) {
        if (state.progress >= 0.98) applyFold(0);
        state.animDir = 1;
        state.demoStopIndex = 0;
        state.pauseUntil = 0;
        if (els.faceLabel) els.faceLabel.textContent = "自动演示：先观察展开图，再逐面沿公共棱折起。";
      }
      if (!els.panel) return;
      const button = els.panel.querySelector('[data-action="auto"]');
      if (!button) return;
      button.classList.toggle("toggle-on", active);
      button.textContent = active ? "演示中" : "演示一遍";
    }

    function applyXRay() {
      if (!state.current) return;
      state.current.root.traverse(child => {
        if (child.material) {
          if (child.userData?.isEdge) {
            child.material.depthTest = !state.isXRay;
            child.material.opacity = state.isXRay ? 0.92 : child.userData.baseOpacity;
          } else if (child.material.userData?.isOuter) {
            child.material.opacity = state.isXRay ? 0.24 : child.material.userData.baseOpacity;
            child.material.depthWrite = !state.isXRay;
          } else if (child.material.userData?.isInner) {
            child.material.opacity = state.isXRay ? 0.08 : child.material.userData.baseOpacity;
            child.material.depthWrite = !state.isXRay;
          }
        }
      });
    }

    function getFaceIndex(faceGroup) {
      return faceGroup?.userData?.faceIndex || faceGroup?.parent?.userData?.faceIndex || 0;
    }

    function setFaceEmissive(faceGroup, color) {
      if (!faceGroup?.traverse) return;
      faceGroup.traverse(child => {
        if (child.material?.emissive) child.material.emissive.setHex(color);
      });
    }

    function clearHover() {
      if (!state.hoveredFace) return;
      if (state.hoveredFace !== state.lockedFace) setFaceEmissive(state.hoveredFace, 0x000000);
      state.hoveredFace = null;
    }

    function setHover(faceGroup) {
      if (state.lockedFace) return;
      if (state.hoveredFace === faceGroup) return;
      clearHover();
      state.hoveredFace = faceGroup;
      if (state.hoveredFace) {
        setFaceEmissive(state.hoveredFace, 0x123f66);
        const index = getFaceIndex(faceGroup) || "";
        els.faceLabel.textContent = `面片 ${index} 已高亮，点按可锁定追踪。`;
        renderMiniMap(state.current?.hinges[state.activeHingeIndex]?.face?.userData?.faceIndex || -1, index);
      } else {
        els.faceLabel.textContent = state.activeHingeIndex >= 0
          ? `面片 ${(state.current?.hinges[state.activeHingeIndex]?.face?.userData?.faceIndex || "")} 正沿公共棱折起。`
          : "拖动模型旋转视角；点按面片或小地图编号可锁定追踪。";
        renderMiniMap(state.current?.hinges[state.activeHingeIndex]?.face?.userData?.faceIndex || -1, -1);
      }
    }

    function findFaceShellByIndex(faceIndex) {
      const face = state.current?.allFaces?.find(item => item.userData?.faceIndex === faceIndex);
      return face?.userData?.explodeGroup || face || null;
    }

    function setLockedFace(faceGroup) {
      if (!faceGroup) {
        if (state.lockedFace) setFaceEmissive(state.lockedFace, 0x000000);
        state.lockedFace = null;
        setHover(null);
        return;
      }
      if (state.lockedFace === faceGroup) {
        setFaceEmissive(state.lockedFace, 0x000000);
        state.lockedFace = null;
        setHover(null);
        return;
      }
      if (state.lockedFace) setFaceEmissive(state.lockedFace, 0x000000);
      clearHover();
      state.lockedFace = faceGroup;
      setFaceEmissive(state.lockedFace, 0x1a5b8a);
      const index = getFaceIndex(faceGroup) || "";
      const activeIndex = state.current?.hinges[state.activeHingeIndex]?.face?.userData?.faceIndex || -1;
      els.faceLabel.textContent = `面片 ${index} 已锁定；点按小地图或模型面片可切换追踪。`;
      renderMiniMap(activeIndex, index);
    }

    function pickFaceAt(clientX, clientY) {
      if (!state.current || !state.raycaster || !state.mouse || !state.renderer) return null;
      const rect = state.renderer.domElement.getBoundingClientRect();
      state.mouse.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      state.mouse.y = -((clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      state.raycaster.setFromCamera(state.mouse, state.camera);
      const hits = state.raycaster.intersectObject(state.current.root, true);
      for (const hit of hits) {
        if (hit.object?.userData?.isFaceMesh) return hit.object.parent;
      }
      return null;
    }

    function updateButtons() {
      if (!els.panel) return;
      els.panel.querySelectorAll("[data-shape]").forEach(button => {
        button.classList.toggle("active", button.dataset.shape === state.currentType);
      });
      const explode = els.panel.querySelector('[data-action="explode"]');
      const xray = els.panel.querySelector('[data-action="xray"]');
      const sequence = els.panel.querySelector('[data-action="sequence"]');
      if (explode) explode.classList.toggle("toggle-on", state.isExploded);
      if (xray) xray.classList.toggle("toggle-on", state.isXRay);
      if (sequence) sequence.classList.toggle("toggle-on", state.isSequential);
      els.panel.querySelectorAll("[data-stage]").forEach(button => {
        button.classList.toggle("active", Math.abs(Number(button.dataset.stage) - state.progress) < 0.01);
      });
    }

    function loadShape(type) {
      const factory = factories[type] || factories.cube;
      const meta = shapeMeta[type] || shapeMeta.cube;
      if (state.current) {
        state.scene.remove(state.current.root);
        state.current.root.traverse(child => {
          if (child.geometry) child.geometry.dispose?.();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(mat => mat.dispose?.());
            else child.material.dispose?.();
          }
        });
      }
      clearHover();
      state.lockedFace = null;
      state.currentType = type;
      state.current = factory();
      state.current.hinges.forEach((hinge, index) => {
        hinge.face = state.current.allFaces[index + 1] || null;
        attachHingeGlow(hinge);
      });
      state.scene.add(state.current.root);
      state.activeHingeIndex = -1;
      state.isExploded = false;
      state.targetExplode = 0;
      state.currentExplode = 0;
      setAutoState(false);
      applyFold(0);
      applyXRay();
      updateButtons();
      setExplain(meta.explain);
      if (els.hudShape) els.hudShape.textContent = meta.label;
      if (els.currentShape) els.currentShape.textContent = meta.label;
      if (els.hudFace) els.hudFace.textContent = `${meta.faces} 个`;
      if (els.faceLabel) els.faceLabel.textContent = "拖动模型旋转视角，悬停面片可联动展开图。";
      renderMiniMap(-1, -1);
    }

    function resize() {
      if (!state.renderer || !state.camera) {
        fitPanel();
        return;
      }
      const rect = els.host.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      state.camera.aspect = width / height;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(width, height, false);
      fitPanel();
    }

    function buildThreeScene() {
      const THREE = window.THREE;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020617, 0.026);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
      camera.position.set(7, 7, 12);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x020617, 0);
      if ("outputEncoding" in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      els.host.appendChild(renderer.domElement);

      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = true;
      controls.screenSpacePanning = true;
      controls.minDistance = 5;
      controls.maxDistance = 42;
      controls.target.set(0, 0, 0);
      if (THREE.TOUCH) {
        controls.touches.ONE = THREE.TOUCH.ROTATE;
        controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
      }
      renderer.domElement.setAttribute("draggable", "false");
      renderer.domElement.style.touchAction = "none";
      renderer.domElement.style.webkitTouchCallout = "none";
      renderer.domElement.style.userSelect = "none";
      blockNativeTouchMenus(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.58));
      const key = new THREE.DirectionalLight(0xffffff, 0.94);
      key.position.set(8, 12, 9);
      key.castShadow = true;
      key.shadow.mapSize.width = 1024;
      key.shadow.mapSize.height = 1024;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x38bdf8, 0.55);
      rim.position.set(-8, 3, -10);
      scene.add(rim);

      const grid = new THREE.GridHelper(28, 28, 0x38bdf8, 0x1e293b);
      grid.position.y = -2.15;
      grid.material.transparent = true;
      grid.material.opacity = 0.42;
      scene.add(grid);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(12, 96),
        new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.16;
      scene.add(floor);

      state.scene = scene;
      state.camera = camera;
      state.renderer = renderer;
      state.controls = controls;
      state.grid = grid;
      state.mouse = new THREE.Vector2(-10, -10);
      state.raycaster = new THREE.Raycaster();

      addEvent(renderer.domElement, "pointermove", event => {
        const rect = renderer.domElement.getBoundingClientRect();
        state.mouse.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
        state.mouse.y = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      });
      addEvent(renderer.domElement, "pointerdown", event => {
        if (!event.isPrimary) return;
        state.tapStart = { x: event.clientX, y: event.clientY, time: performance.now() };
      });
      addEvent(renderer.domElement, "pointerup", event => {
        if (!event.isPrimary || !state.tapStart) return;
        const dx = event.clientX - state.tapStart.x;
        const dy = event.clientY - state.tapStart.y;
        const dt = performance.now() - state.tapStart.time;
        state.tapStart = null;
        if (Math.hypot(dx, dy) > 10 || dt > 650) return;
        setLockedFace(pickFaceAt(event.clientX, event.clientY));
      });
      addEvent(renderer.domElement, "pointerleave", () => {
        state.mouse.x = -10;
        state.mouse.y = -10;
        state.tapStart = null;
        setHover(null);
      });

      loadShape("cube");
      resize();
      els.loading.style.display = "none";
      animate(performance.now());
    }

    function animate(time) {
      if (state.destroyed) return;
      state.raf = window.requestAnimationFrame(animate);
      if (state.controls) state.controls.update();

      if (state.isAnimating && time > state.pauseUntil) {
        const demoStops = [0.25, 0.5, 0.75, 1];
        const demoHints = [
          "关键点：先找公共棱，第一批面片开始竖起。",
          "关键点：侧面围合，注意相邻面不能重叠。",
          "关键点：最后两面补齐缺口，顶点逐渐汇合。",
          "演示完成：6 个面闭合成完整立体图形。"
        ];
        let demoCompleted = false;
        let next = state.progress + 0.0048;
        const stopValue = demoStops[state.demoStopIndex] ?? 1;
        if (next >= stopValue) {
          next = stopValue;
          if (els.faceLabel) els.faceLabel.textContent = demoHints[state.demoStopIndex] || demoHints[demoHints.length - 1];
          state.demoStopIndex += 1;
          if (next >= 1) {
            demoCompleted = true;
            setAutoState(false);
          } else {
            state.pauseUntil = time + 980;
          }
        }
        applyFold(next);
        if (demoCompleted && els.faceLabel) els.faceLabel.textContent = demoHints[demoHints.length - 1];
      }

      if (Math.abs(state.currentExplode - state.targetExplode) > 0.001) {
        state.currentExplode += (state.targetExplode - state.currentExplode) * 0.14;
        if (state.current) {
          state.current.allFaces.forEach(face => {
            if (face.userData.explodeGroup) {
              face.userData.explodeGroup.position.z = -0.64 * state.currentExplode;
            }
          });
        }
      }

      if (state.current && state.raycaster && state.mouse) {
        state.raycaster.setFromCamera(state.mouse, state.camera);
        const hits = state.raycaster.intersectObject(state.current.root, true);
        let found = null;
        for (const hit of hits) {
          if (hit.object?.userData?.isFaceMesh) {
            found = hit.object.parent;
            break;
          }
        }
        setHover(found);
      }

      state.renderer.render(state.scene, state.camera);
    }

    async function init() {
      try {
        if (!window.THREE) await loadScriptOnce(`${VENDOR_PATH}three.min.js`);
        if (!window.THREE) throw new Error("THREE is unavailable");
        if (typeof window.THREE.OrbitControls !== "function") {
          await loadScriptOnce(`${VENDOR_PATH}OrbitControls.js`);
        }
        if (typeof window.THREE.OrbitControls !== "function") throw new Error("OrbitControls is unavailable");
        if (state.destroyed) return;
        buildThreeScene();
      } catch (error) {
        setError("本地三维引擎载入失败，请确认数学 vendor/three 文件存在。");
      }
    }

    if (els.panel) {
      addEvent(els.panel, "click", event => {
        const shapeButton = event.target.closest("[data-shape]");
        if (shapeButton) {
          loadShape(shapeButton.dataset.shape);
          return;
        }
        const stageButton = event.target.closest("[data-stage]");
        if (stageButton) {
          setAutoState(false);
          applyFold(Number(stageButton.dataset.stage));
          updateButtons();
          return;
        }
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) return;
        const action = actionButton.dataset.action;
        if (action === "auto") {
          setAutoState(!state.isAnimating);
        }
        if (action === "sequence") {
          state.isSequential = !state.isSequential;
          applyFold(state.progress);
          updateButtons();
        }
        if (action === "explode") {
          state.isExploded = !state.isExploded;
          state.targetExplode = state.isExploded ? 1 : 0;
          updateButtons();
        }
        if (action === "xray") {
          state.isXRay = !state.isXRay;
          applyXRay();
          updateButtons();
        }
      });
    }

    if (els.slider) {
      addEvent(els.slider, "input", event => {
        setAutoState(false);
        applyFold(Number(event.target.value));
        updateButtons();
      });
    }

    if (els.minimapSvg) {
      addEvent(els.minimapSvg, "click", event => {
        const target = event.target.closest("[data-face]");
        if (!target) return;
        const faceIndex = Number(target.dataset.face);
        if (!Number.isFinite(faceIndex)) return;
        setLockedFace(findFaceShellByIndex(faceIndex));
      });
    }

    [sceneEl, els.host, els.panel, panel].forEach(blockNativeTouchMenus);

    state.resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (state.resizeObserver) {
      state.resizeObserver.observe(sceneEl);
      if (panel) state.resizeObserver.observe(panel);
    }
    addEvent(window, "resize", resize);
    fitPanel();
    init();

    return {
      destroy() {
        state.destroyed = true;
        if (state.abort) state.abort.abort();
        if (state.resizeObserver) state.resizeObserver.disconnect();
        if (state.raf) window.cancelAnimationFrame(state.raf);
        if (state.current) {
          state.current.root.traverse(child => {
            if (child.geometry) child.geometry.dispose?.();
            if (child.material) {
              if (Array.isArray(child.material)) child.material.forEach(mat => mat.dispose?.());
              else child.material.dispose?.();
            }
          });
        }
        if (state.grid?.geometry) state.grid.geometry.dispose?.();
        if (state.renderer) {
          state.renderer.dispose();
          state.renderer.domElement?.remove();
        }
        container.innerHTML = "";
        if (panel) panel.innerHTML = "";
      }
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount(container, context) {
      const instance = createScene(container, context || {});
      container.__mathNetFoldScene = instance;
    },
    unmount(container) {
      if (container.__mathNetFoldScene && typeof container.__mathNetFoldScene.destroy === "function") {
        container.__mathNetFoldScene.destroy();
      } else {
        container.innerHTML = "";
      }
      delete container.__mathNetFoldScene;
    }
  };
})();

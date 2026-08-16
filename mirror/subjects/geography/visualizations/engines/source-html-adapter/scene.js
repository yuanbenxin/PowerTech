window.GEOGRAPHY_VISUAL_SCENES = window.GEOGRAPHY_VISUAL_SCENES || {};

(function () {
  const SOURCE_CARD_IDS = ['j7a_m01', 'j7a_m02', 'j7a_m03', 'j7a_m04', 'j7a_m05', 'j7a_m06', 'j7a_m07', 'j7a_m08', 'j7a_m09', 'j7b_m01', 'j8a_m01', 'j8a_m02', 'j8a_m09', 'j8b_m01', 'sb1_m01', 'sb1_m04', 'sb1_m06', 'sb1_m07', 'sb1_m08', 'sb1_m10', 'sb1m11', 'sb1m12', 'sb2_m01', 'sb2_m04', 'sb2_m05', 'sx2_m01', 'sx1m11', 'sx2m14', 'sx3m14', 'sx3m15', 'sx3m16', 'sx3m17'];
  const DEFAULT_PANEL_SELECTORS = [
    '#top-panel',
    '#data-panel',
    '#event-panel',
    '#info-panel',
    '#hud-panel',
    '#mantle-panel',
    '#radar-panel',
    '.panel'
  ];
  const mounts = new WeakMap();
  const scriptCache = new Map();
  const styleCache = new Map();

  function getAppRuntime() {
    return window.GeographyApp || {};
  }

  function appendRuntimeVersion(path) {
    const app = getAppRuntime();
    if (typeof app.appendRuntimeVersion === 'function') return app.appendRuntimeVersion(path);
    return path;
  }

  function measureScene(sceneRoot) {
    const rect = sceneRoot.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width || sceneRoot.clientWidth || 1)),
      height: Math.max(1, Math.round(rect.height || sceneRoot.clientHeight || 1))
    };
  }

  function fitSceneMedia(sceneRoot) {
    if (!sceneRoot) return;
    sceneRoot.style.setProperty('width', '100%', 'important');
    sceneRoot.style.setProperty('height', '100%', 'important');
    sceneRoot.querySelectorAll('#app-container, #canvas-container, #terrain-scene, [data-canvas-host], .main-stage, .leaflet-container').forEach(node => {
      node.style.setProperty('width', '100%', 'important');
      node.style.setProperty('height', '100%', 'important');
      node.style.setProperty('max-width', '100%', 'important');
      node.style.setProperty('max-height', '100%', 'important');
      node.style.setProperty('min-width', '0', 'important');
      node.style.setProperty('min-height', '0', 'important');
      node.style.setProperty('overflow', 'hidden', 'important');
    });
    sceneRoot.querySelectorAll('canvas').forEach(canvas => {
      const isPrimaryCanvas = Boolean(canvas.closest('#canvas-container, [data-canvas-host], .main-stage'));
      canvas.style.setProperty('width', '100%', 'important');
      canvas.style.setProperty('height', '100%', 'important');
      canvas.style.setProperty('max-width', 'none', 'important');
      canvas.style.setProperty('max-height', 'none', 'important');
      canvas.style.setProperty('display', 'block', 'important');
      canvas.style.setProperty('touch-action', 'none', 'important');
      if (isPrimaryCanvas) {
        canvas.style.setProperty('min-width', '100%', 'important');
        canvas.style.setProperty('min-height', '100%', 'important');
      }
    });
  }

  function scheduleSceneResize(instance, sceneRoot) {
    [0, 60, 140, 300, 620, 1100].forEach(delay => {
      const id = window.setTimeout(() => {
        instance.timeoutIds.delete(id);
        if (instance.cancelled) return;
        fitSceneMedia(sceneRoot);
        refreshLeafletMaps(instance);
        window.dispatchEvent(new Event('resize'));
        window.visualViewport?.dispatchEvent?.(new Event('resize'));
      }, delay);
      instance.timeoutIds.add(id);
    });
  }

  function refreshLeafletMaps(instance) {
    if (!instance?.leafletMaps?.size) return;
    instance.leafletMaps.forEach(map => {
      try {
        map.invalidateSize({ pan: false, debounceMoveend: true });
      } catch (error) {}
    });
  }

  function getSceneBaseUrl(context) {
    const folder = String(context?.sceneEntry?.folder || '').replace(/\/?$/, '/');
    return new URL(folder || './', window.location.href).href;
  }

  function isPassthroughUrl(value) {
    return /^(?:data|blob|javascript|mailto|tel):/i.test(String(value || ''))
      || String(value || '').startsWith('#');
  }

  function resolveResourceUrl(baseUrl, value) {
    const raw = String(value || '').trim();
    if (!raw || isPassthroughUrl(raw)) return raw;
    try {
      return new URL(raw, baseUrl).href;
    } catch (error) {
      return raw;
    }
  }

  function getSourceImageTier() {
    const width = Math.round(window.visualViewport?.width || window.innerWidth || 0);
    const height = Math.round(window.visualViewport?.height || window.innerHeight || 0);
    const coarsePointer = Boolean(window.matchMedia?.('(pointer: coarse)').matches);
    const shortSide = Math.min(width, height);
    if (width <= 700 || (coarsePointer && shortSide <= 900)) return 'mobile';
    if (width <= 1180 || coarsePointer) return 'tablet';
    return 'desktop';
  }

  function supportsThreeTierSourceImages(url) {
    return /\/visualizations\/books\/(?:s_b1\/sb1_m04|s_b1\/sb1m12|s_b2\/sx2_m01|s_x1\/sx1m11|s_x3\/sx3m14|s_x3\/sx3m15)\/assets\//i.test(url.pathname);
  }

  function getOptimizedSourceImageCandidates(baseUrl, value) {
    const original = resolveResourceUrl(baseUrl, value);
    const raw = String(value || '').trim();
    if (!raw || isPassthroughUrl(raw) || /^(?:https?:)?\/\//i.test(raw)) return [original];

    let url;
    try {
      url = new URL(raw, baseUrl);
    } catch (error) {
      return [original];
    }

    if (!/\.(?:png|jpe?g|webp)$/i.test(url.pathname)) return [original];
    if (/\/(?:vendor|draco)\//i.test(url.pathname) || /\/mobile\//i.test(url.pathname)) return [original];
    const desktop = new URL(url.href);
    desktop.pathname = desktop.pathname.replace(/\.(?:png|jpe?g|webp)$/i, '.webp');

    const mobile = new URL(desktop.href);
    const slashIndex = mobile.pathname.lastIndexOf('/');
    mobile.pathname = `${mobile.pathname.slice(0, slashIndex)}/mobile/${mobile.pathname.slice(slashIndex + 1)}`;

    const tablet = new URL(desktop.href);
    tablet.pathname = `${desktop.pathname.slice(0, slashIndex)}/tablet/${desktop.pathname.slice(slashIndex + 1)}`;
    const tier = getSourceImageTier();
    const candidates = supportsThreeTierSourceImages(url)
      ? (tier === 'mobile'
        ? [mobile.href, tablet.href, desktop.href, original]
        : tier === 'tablet'
          ? [tablet.href, desktop.href, original]
          : [desktop.href, original])
      : (tier === 'mobile' ? [mobile.href, desktop.href, original] : [desktop.href, original]);
    return Array.from(new Set(candidates)).map(candidate => appendRuntimeVersion(candidate));
  }

  function resolveOptimizedResourceUrl(baseUrl, value) {
    return getOptimizedSourceImageCandidates(baseUrl, value)[0] || resolveResourceUrl(baseUrl, value);
  }

  function loadScriptOnce(path) {
    if (!path) return Promise.resolve(false);
    const app = getAppRuntime();
    const resolvedPath = appendRuntimeVersion(path);
    if (scriptCache.has(resolvedPath)) return scriptCache.get(resolvedPath);

    const promise = typeof app.loadSceneScript === 'function'
      ? app.loadSceneScript(path)
      : new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = resolvedPath;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => {
          scriptCache.delete(resolvedPath);
          script.remove();
          reject(new Error('Failed to load local source dependency: ' + path));
        };
        document.body.appendChild(script);
      });

    scriptCache.set(resolvedPath, promise);
    return promise;
  }

  function loadStyleOnce(path) {
    if (!path) return Promise.resolve(false);
    const resolvedPath = appendRuntimeVersion(path);
    if (styleCache.has(resolvedPath)) return styleCache.get(resolvedPath);

    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = resolvedPath;
      link.onload = () => resolve(true);
      link.onerror = () => {
        styleCache.delete(resolvedPath);
        link.remove();
        reject(new Error('Failed to load local source stylesheet: ' + path));
      };
      document.head.appendChild(link);
    });

    styleCache.set(resolvedPath, promise);
    return promise;
  }

  async function loadDependencies(config) {
    const vendor = config?.vendor || {};
    const styles = [
      vendor.leafletCss
    ].filter(Boolean);
    const scripts = [
      vendor.three === false ? null : (vendor.three || 'assets/vendor/three/three.min.js'),
      vendor.orbitControls === false ? null : (vendor.orbitControls || 'assets/vendor/three/OrbitControls.js'),
      vendor.tween,
      ...(Array.isArray(vendor.scripts) ? vendor.scripts : []),
      vendor.leaflet,
      vendor.d3,
      vendor.topojson
    ].filter(Boolean);

    for (const style of styles) {
      await loadStyleOnce(style);
    }
    for (const script of scripts) {
      await loadScriptOnce(script);
    }
  }

  async function fetchText(url) {
    const response = await fetch(appendRuntimeVersion(url), { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load source html: ' + url);
    return response.text();
  }

  async function fetchConfiguredSourceText(config, baseUrl, key) {
    const paths = Array.isArray(config?.[key]) ? config[key] : [];
    const texts = [];
    for (const path of paths) {
      if (!path) continue;
      texts.push(await fetchText(resolveResourceUrl(baseUrl, path)));
    }
    return texts;
  }

  function extractKeyframeBlocks(css) {
    const blocks = [];
    let output = '';
    let cursor = 0;
    const lower = css.toLowerCase();

    while (cursor < css.length) {
      const start = lower.indexOf('@keyframes', cursor);
      if (start < 0) {
        output += css.slice(cursor);
        break;
      }

      const braceStart = css.indexOf('{', start);
      if (braceStart < 0) {
        output += css.slice(cursor);
        break;
      }

      let depth = 0;
      let end = braceStart;
      for (; end < css.length; end += 1) {
        const char = css[end];
        if (char === '{') depth += 1;
        if (char === '}') {
          depth -= 1;
          if (depth === 0) {
            end += 1;
            break;
          }
        }
      }

      const placeholder = `__GEOGRAPHY_KEYFRAMES_${blocks.length}__`;
      output += css.slice(cursor, start) + placeholder;
      blocks.push(css.slice(start, end));
      cursor = end;
    }

    return {
      css: output,
      restore(value) {
        return blocks.reduce((current, block, index) => (
          current.replace(`__GEOGRAPHY_KEYFRAMES_${index}__`, block)
        ), value);
      }
    };
  }

  function scopeOneSelector(selector, sceneClass, panelClass) {
    const trimmed = String(selector || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('@')) return trimmed;
    const bodyState = trimmed.match(/^(?:html\s+)?body((?:[.#][A-Za-z0-9_-]+)+)(.*)$/i);
    if (bodyState) {
      return `.${sceneClass}${bodyState[1]}${bodyState[2]}, .${panelClass}${bodyState[1]}${bodyState[2]}`;
    }

    let normalized = trimmed
      .replace(/^html\s+body\b/i, '')
      .replace(/^(?:html|body)(?=$|[\s.#[:])/i, '')
      .trim();

    if (!normalized || normalized === ':root') return `.${sceneClass}, .${panelClass}`;
    if (normalized.startsWith(':root')) {
      const withoutRoot = normalized.slice(5).trim();
      return withoutRoot ? `.${sceneClass}${withoutRoot}, .${panelClass}${withoutRoot}` : `.${sceneClass}, .${panelClass}`;
    }
    return `.${sceneClass} ${normalized}, .${panelClass} ${normalized}`;
  }

  function scopeCss(css, sceneClass, panelClass, baseUrl) {
    const withLocalUrls = String(css || '').replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, rawUrl) => {
      const resolved = resolveOptimizedResourceUrl(baseUrl, rawUrl);
      return `url("${resolved}")`;
    });
    const preserved = extractKeyframeBlocks(withLocalUrls);
    const scoped = preserved.css.replace(/(^|[{}])\s*([^@{}][^{}]*)\{/g, (match, closeBrace, selectorText) => {
      const scopedSelectors = selectorText
        .split(',')
        .map(selector => scopeOneSelector(selector, sceneClass, panelClass))
        .filter(Boolean)
        .join(', ');
      return `${closeBrace}\n${scopedSelectors} {`;
    });
    return preserved.restore(scoped);
  }

  function resolveInlineElementResources(root, baseUrl) {
    if (!root || !baseUrl) return;

    root.querySelectorAll('[src]').forEach(node => {
      const value = node.getAttribute('src');
      if (!value || isPassthroughUrl(value)) return;
      node.setAttribute('src', resolveOptimizedResourceUrl(baseUrl, value));
    });

    root.querySelectorAll('[poster]').forEach(node => {
      const value = node.getAttribute('poster');
      if (!value || isPassthroughUrl(value)) return;
      node.setAttribute('poster', resolveOptimizedResourceUrl(baseUrl, value));
    });
  }

  function buildAdapterCss(sceneClass, panelClass) {
    return `
      .${sceneClass} {
        position: absolute;
        inset: 0;
        overflow: hidden;
        min-width: 0 !important;
        min-height: 0 !important;
        background: #020617;
        color: #fff;
        font-family: Inter, "Microsoft YaHei UI", system-ui, sans-serif;
        touch-action: none;
        user-select: none;
      }
      .${sceneClass} *, .${panelClass} * { box-sizing: border-box; }
      .${sceneClass} #app-container,
      .${sceneClass} #canvas-container,
      .${sceneClass} #terrain-scene {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;
        z-index: 1;
      }
      .${sceneClass} #map,
      .${sceneClass} .leaflet-container,
      .${sceneClass} .main-stage {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      .${sceneClass} .ui-shell {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none;
      }
      .${sceneClass} .leaflet-control-container {
        pointer-events: auto;
      }
      .${sceneClass} .map-badge,
      .${sceneClass} .map-credit,
      .${sceneClass} #loader {
        pointer-events: none;
      }
      .${sceneClass} canvas {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
        display: block;
        touch-action: none;
      }
      .${sceneClass} #canvas-container canvas,
      .${sceneClass} #terrain-scene canvas,
      .${sceneClass} [data-canvas-host] canvas,
      .${sceneClass} .main-stage canvas {
        min-width: 100% !important;
        min-height: 100% !important;
      }
      .${sceneClass} #loading,
      .${sceneClass} #impact-flash {
        position: absolute !important;
        inset: 0 !important;
      }
      .${panelClass} {
        --geo-source-readout-font-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 28), 12px);
        width: 100%;
        height: 100%;
        min-width: 0 !important;
        min-height: 0 !important;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: none;
        touch-action: pan-y;
        overscroll-behavior: contain;
        padding: clamp(8px, 1.35vh, 10px) clamp(8px, 1.35vh, 10px) 14px;
        color: #e5e7eb;
        font-family: Inter, "Microsoft YaHei UI", system-ui, sans-serif;
      }
      .${panelClass}::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .${panelClass} h1,
      .${panelClass} .brand,
      .${panelClass} p.subtitle {
        display: none !important;
      }
      .${panelClass} .panel,
      .${panelClass} #hud-panel,
      .${panelClass} #mantle-panel,
      .${panelClass} #radar-panel,
      .${panelClass} .sidebar,
      .${panelClass} .detail-panel,
      .${panelClass} .dock,
      .${panelClass} .floating-actions,
      .${panelClass} .terrain-chip,
      .${panelClass} .scene-chip,
      .${panelClass} .bottom-dock {
        position: relative !important;
        inset: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        left: auto !important;
        transform: none !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 0 12px !important;
        padding: 14px !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.82) !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        box-shadow: none !important;
        backdrop-filter: blur(14px);
      }
      .${panelClass} #mantle-panel {
        min-height: 210px !important;
        height: 220px !important;
        overflow: hidden !important;
      }
      .${panelClass} .control-panel,
      .${panelClass} .force-box,
      .${panelClass} .hud-text {
        border-radius: 8px !important;
        max-width: 100%;
      }
      .${panelClass} .btn-group,
      .${panelClass} .btn-row {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)) !important;
        gap: 8px !important;
      }
      .${panelClass} .mode-list,
      .${panelClass} .dock,
      .${panelClass} .floating-actions,
      .${panelClass} .view-list,
      .${panelClass} .toolbar,
      .${panelClass} .region-list,
      .${panelClass} .boundary-list,
      .${panelClass} .river-list,
      .${panelClass} .layer-list,
      .${panelClass} .bottom-dock {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .${panelClass} .toggle-row,
      .${panelClass} .score-row,
      .${panelClass} .legend-item,
      .${panelClass} .mode-btn,
      .${panelClass} .tool-btn,
      .${panelClass} .toggle-btn,
      .${panelClass} .float-btn,
      .${panelClass} .step-btn,
      .${panelClass} .view-btn,
      .${panelClass} .region-btn,
      .${panelClass} .line-btn,
      .${panelClass} .river-btn,
      .${panelClass} .layer-btn {
        min-width: 0 !important;
      }
      .${panelClass} button,
      .${panelClass} .btn,
      .${panelClass} .mode-btn,
      .${panelClass} .tool-btn,
      .${panelClass} .toggle-btn,
      .${panelClass} .float-btn,
      .${panelClass} .step-btn,
      .${panelClass} .view-btn,
      .${panelClass} .region-btn,
      .${panelClass} .line-btn,
      .${panelClass} .river-btn,
      .${panelClass} .layer-btn {
        min-height: 38px !important;
        width: 100% !important;
        white-space: normal !important;
        word-break: keep-all;
        overflow-wrap: anywhere;
        line-height: 1.25 !important;
        border-radius: 8px !important;
        touch-action: manipulation;
      }
      .${panelClass} input[type="range"] {
        width: 100% !important;
        min-height: 32px !important;
        touch-action: none;
      }
      .${panelClass} .slider-group label {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) minmax(6em, 48%) !important;
        align-items: center;
        gap: 8px;
        min-width: 0 !important;
      }
      .${panelClass} .slider-group label > :first-child {
        min-width: 0 !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      .${panelClass} .val-badge,
      .${panelClass} .hud-value,
      .${panelClass} .time-year,
      .${panelClass} .event-badge,
      .${panelClass} .vector-speed,
      .${panelClass} .score-row,
      .${panelClass} .score-row * {
        max-width: 100% !important;
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
        line-height: 1.15 !important;
        font-size: var(--geo-source-readout-font-size) !important;
        font-variant-numeric: tabular-nums !important;
        font-feature-settings: "tnum" 1, "lnum" 1 !important;
      }
      .${panelClass} .mode-name,
      .${panelClass} .mode-note,
      .${panelClass} .region-name,
      .${panelClass} .region-note,
      .${panelClass} .step-name,
      .${panelClass} .step-note,
      .${panelClass} .detail-main,
      .${panelClass} .selected-card {
        max-width: 100% !important;
        min-width: 0 !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: normal !important;
        word-break: keep-all !important;
        overflow-wrap: anywhere !important;
      }
      .${panelClass} .mode-name,
      .${panelClass} .region-name,
      .${panelClass} .step-name {
        line-height: 1.22 !important;
        font-size: calc(var(--geo-source-readout-font-size) + 1px) !important;
      }
      .${panelClass} .mode-note,
      .${panelClass} .region-note,
      .${panelClass} .step-note,
      .${panelClass} .detail-main,
      .${panelClass} .selected-card {
        line-height: 1.42 !important;
        font-size: var(--geo-source-readout-font-size) !important;
      }
      .${panelClass} .val-badge {
        justify-self: end !important;
        text-align: right !important;
      }
      .${panelClass} canvas {
        max-width: 100% !important;
      }
      .${panelClass} svg {
        max-width: 100%;
      }
      .geo-source-panel-j7a_m04 .geo-source-workbench,
      .geo-source-panel-j7a_m04 .geo-source-panel-shell,
      .geo-source-panel-j7a_m04 #top-panel {
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        flex: 0 0 auto !important;
      }
      .geo-source-panel-j7a_m04 .geo-source-panel-shell {
        display: block !important;
      }
      .geo-source-panel-j7a_m04 #top-panel {
        position: relative !important;
        inset: auto !important;
        width: 100% !important;
      }
      .geo-source-panel-j7a_m04 .plate-card {
        flex: 0 0 auto !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      .geo-source-panel-j8a_m01 {
        --geo-source-readout-font-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 30), 12px);
        padding: clamp(8px, 1.2vh, 10px) 10px 14px !important;
        background: transparent !important;
      }
      .geo-source-panel-j8a_m01::before,
      .geo-source-panel-j8a_m01::after,
      .geo-source-panel-j8a_m01 .geo-source-workbench::before,
      .geo-source-panel-j8a_m01 .geo-source-workbench::after,
      .geo-source-panel-j8a_m01 .geo-source-panel-card::before,
      .geo-source-panel-j8a_m01 .geo-source-panel-card::after,
      .geo-source-panel-j8a_m01 .geo-source-panel-shell::before,
      .geo-source-panel-j8a_m01 .geo-source-panel-shell::after,
      .geo-source-panel-j8a_m01 :is(.sidebar, .detail-panel, .bottom-dock)::before,
      .geo-source-panel-j8a_m01 :is(.sidebar, .detail-panel, .bottom-dock)::after {
        content: none !important;
        display: none !important;
        background: none !important;
      }
      .geo-source-panel-j8a_m01 .geo-source-workbench {
        display: grid !important;
        gap: 10px !important;
        padding-bottom: 12px !important;
        background: transparent !important;
      }
      .geo-source-panel-j8a_m01 .geo-source-panel-card,
      .geo-source-panel-j8a_m01 .geo-source-panel-shell {
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .geo-source-panel-j8a_m01 .geo-source-workbench > .geo-source-panel-shell:nth-child(1) {
        order: 1 !important;
      }
      .geo-source-panel-j8a_m01 .geo-source-workbench > .geo-source-panel-shell:nth-child(2) {
        order: 2 !important;
      }
      .geo-source-panel-j8a_m01 .geo-source-workbench > .geo-source-panel-shell:nth-child(3) {
        order: 3 !important;
      }
      .geo-source-panel-j8a_m01 :is(.sidebar, .detail-panel, .bottom-dock) {
        display: grid !important;
        gap: 10px !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        padding: 12px !important;
        margin: 0 !important;
        border: 0 !important;
        border-radius: 8px !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .geo-source-panel-j8a_m01 .source-note,
      .geo-source-panel-j8a_m01 .brand {
        display: none !important;
      }
      .geo-source-panel-j8a_m01 .section-title {
        display: flex !important;
        align-items: center !important;
        min-height: 20px !important;
        gap: 8px !important;
        margin: 0 !important;
        color: #e5e7eb !important;
        font-size: 11px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m01 .section-title span:last-child {
        margin-left: auto !important;
        color: #8fb6c9 !important;
        font-size: 10px !important;
        line-height: 1 !important;
        font-weight: 800 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m01 .mode-list,
      .geo-source-panel-j8a_m01 .toggle-row {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        margin: 0 !important;
      }
      .geo-source-panel-j8a_m01 .demo-row {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 8px !important;
        margin: 0 0 8px !important;
      }
      .geo-source-panel-j8a_m01 .mode-btn {
        display: grid !important;
        grid-template-columns: 28px minmax(0, 1fr) !important;
        justify-content: stretch !important;
        gap: 8px !important;
        min-height: 40px !important;
        padding: 0 8px !important;
        text-align: left !important;
      }
      .geo-source-panel-j8a_m01 .mode-icon {
        display: grid !important;
        place-items: center !important;
        width: 28px !important;
        height: 28px !important;
        border-radius: 7px !important;
        color: #081018 !important;
        font-size: 12px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        background: var(--mode-color) !important;
      }
      .geo-source-panel-j8a_m01 .mode-btn > span:last-child {
        display: flex !important;
        align-items: center !important;
        min-width: 0 !important;
        gap: 8px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }
      .geo-source-panel-j8a_m01 .mode-name,
      .geo-source-panel-j8a_m01 .mode-note {
        display: inline !important;
        min-width: 0 !important;
        margin: 0 !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
      }
      .geo-source-panel-j8a_m01 .mode-name {
        flex: 0 0 auto !important;
        font-size: 11px !important;
        font-weight: 900 !important;
      }
      .geo-source-panel-j8a_m01 .mode-note {
        flex: 1 1 auto !important;
        color: #9fb0bf !important;
        font-size: 10px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .geo-source-panel-j8a_m01 :is(.tool-btn, .mode-btn) {
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        background: rgba(15, 23, 42, 0.72) !important;
        color: #e5e7eb !important;
        box-shadow: none !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m01 .tool-btn.active,
      .geo-source-panel-j8a_m01 .mode-btn.active,
      .geo-source-panel-j8a_m01 .demo-btn {
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.94), rgba(56, 189, 248, 0.82)) !important;
        border-color: rgba(250, 204, 21, 0.48) !important;
        color: #081018 !important;
      }
      .geo-source-panel-j8a_m01 .teaching-question,
      .geo-source-panel-j8a_m01 .misread-box,
      .geo-source-panel-j8a_m01 .selected-card,
      .geo-source-panel-j8a_m01 .rule-item,
      .geo-source-panel-j8a_m01 .pattern-card {
        min-width: 0 !important;
        padding: 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.13) !important;
        background: rgba(15, 23, 42, 0.56) !important;
        color: #dbe5f1 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-j8a_m01 .teaching-question {
        color: #fde68a !important;
        border-color: rgba(250, 204, 21, 0.18) !important;
      }
      .geo-source-panel-j8a_m01 .legend {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 7px !important;
        margin: 0 !important;
      }
      .geo-source-panel-j8a_m01 .legend-item {
        display: grid !important;
        grid-template-columns: 18px minmax(0, 1fr) !important;
        align-items: center !important;
        min-height: 22px !important;
        gap: 8px !important;
        color: #cbd5e1 !important;
        font-size: 10.5px !important;
        line-height: 1.15 !important;
      }
      .geo-source-panel-j8a_m01 .legend-swatch {
        width: 12px !important;
        height: 12px !important;
      }
      .geo-source-panel-j8a_m01 .mode-kicker {
        justify-self: start !important;
        min-height: 22px !important;
        padding: 0 8px !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m01 #detail-title {
        margin: 0 !important;
        color: #f8fafc !important;
        font-size: 14px !important;
        line-height: 1.25 !important;
        font-weight: 900 !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .geo-source-panel-j8a_m01 #detail-main {
        margin: 0 !important;
        color: #dbe5f1 !important;
        font-size: 11px !important;
        line-height: 1.5 !important;
      }
      .geo-source-panel-j8a_m01 .rule-list {
        display: grid !important;
        gap: 7px !important;
      }
      .geo-source-panel-j8a_m01 .rule-item {
        display: grid !important;
        grid-template-columns: 22px minmax(0, 1fr) !important;
        gap: 7px !important;
        align-items: start !important;
        font-size: 10.5px !important;
        line-height: 1.42 !important;
      }
      .geo-source-panel-j8a_m01 .rule-num {
        display: grid !important;
        place-items: center !important;
        width: 22px !important;
        height: 22px !important;
        border-radius: 7px !important;
        background: var(--mode-color) !important;
        color: #081018 !important;
        font-size: 10px !important;
        font-weight: 900 !important;
      }
      .geo-source-panel-j8a_m01 .misread-box,
      .geo-source-panel-j8a_m01 .selected-card {
        margin-top: 0 !important;
        font-size: 10.5px !important;
        line-height: 1.42 !important;
      }
      .geo-source-panel-j8a_m01 .selected-card strong {
        display: block !important;
        margin: 0 0 4px !important;
        color: var(--mode-color) !important;
        font-size: 11px !important;
        line-height: 1.15 !important;
      }
      .geo-source-panel-j8a_m01 .bottom-dock {
        grid-template-columns: 1fr !important;
      }
      .geo-source-panel-j8a_m01 .pattern-card {
        min-height: 0 !important;
      }
      .geo-source-panel-j8a_m01 .pattern-card h3 {
        margin: 0 0 4px !important;
        color: #f8fafc !important;
        font-size: 11px !important;
        line-height: 1.15 !important;
      }
      .geo-source-panel-j8a_m01 .pattern-card p {
        margin: 0 !important;
        color: #a8b3c4 !important;
        font-size: 10.5px !important;
        line-height: 1.38 !important;
      }
      .geo-source-panel-j8a_m02 {
        --geo-source-readout-font-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 30), 12px);
        padding: clamp(8px, 1.2vh, 10px) 10px 14px !important;
        background: transparent !important;
      }
      .geo-source-panel-j8a_m02::before,
      .geo-source-panel-j8a_m02::after,
      .geo-source-panel-j8a_m02 .geo-source-workbench::before,
      .geo-source-panel-j8a_m02 .geo-source-workbench::after,
      .geo-source-panel-j8a_m02 .geo-source-panel-card::before,
      .geo-source-panel-j8a_m02 .geo-source-panel-card::after,
      .geo-source-panel-j8a_m02 .geo-source-panel-shell::before,
      .geo-source-panel-j8a_m02 .geo-source-panel-shell::after,
      .geo-source-panel-j8a_m02 :is(.sidebar, .detail-panel, .dock)::before,
      .geo-source-panel-j8a_m02 :is(.sidebar, .detail-panel, .dock)::after {
        content: none !important;
        display: none !important;
        background: none !important;
      }
      .geo-source-panel-j8a_m02 .geo-source-workbench {
        display: grid !important;
        gap: 10px !important;
        padding-bottom: 12px !important;
        background: transparent !important;
      }
      .geo-source-panel-j8a_m02 .geo-source-panel-card,
      .geo-source-panel-j8a_m02 .geo-source-panel-shell {
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .geo-source-panel-j8a_m02 .geo-source-workbench > .geo-source-panel-shell:nth-child(3) {
        order: 1 !important;
      }
      .geo-source-panel-j8a_m02 .geo-source-workbench > .geo-source-panel-shell:nth-child(1) {
        order: 2 !important;
      }
      .geo-source-panel-j8a_m02 .geo-source-workbench > .geo-source-panel-shell:nth-child(2) {
        order: 3 !important;
      }
      .geo-source-panel-j8a_m02 .geo-source-workbench > .geo-source-panel-shell:nth-child(4) {
        display: none !important;
      }
      .geo-source-panel-j8a_m02 :is(.sidebar, .detail-panel, .dock) {
        display: grid !important;
        gap: 10px !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        padding: 12px !important;
        margin: 0 !important;
        border-radius: 8px !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .geo-source-panel-j8a_m02 .dock {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        padding: 10px !important;
      }
      .geo-source-panel-j8a_m02 .sidebar {
        align-self: auto !important;
      }
      .geo-source-panel-j8a_m02 .sidebar > .view-block {
        order: 1 !important;
      }
      .geo-source-panel-j8a_m02 .sidebar > div:has(#step-list) {
        order: 2 !important;
      }
      .geo-source-panel-j8a_m02 .sidebar > .stat-grid {
        order: 3 !important;
      }
      .geo-source-panel-j8a_m02 .sidebar > .enhance-block {
        order: 1.5 !important;
      }
      .geo-source-panel-j8a_m02 .sidebar > div:has(#legend) {
        order: 4 !important;
      }
      .geo-source-panel-j8a_m02 .sidebar > .question {
        order: 5 !important;
      }
      .geo-source-panel-j8a_m02 .source-note {
        display: none !important;
      }
      .geo-source-panel-j8a_m02 .section-title {
        display: flex !important;
        align-items: center !important;
        min-height: 20px !important;
        gap: 8px !important;
        color: #e5e7eb !important;
        font-size: 11px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m02 .section-title span:last-child {
        margin-left: auto !important;
        color: #8fb6c9 !important;
        font-size: 10px !important;
        line-height: 1 !important;
        font-weight: 800 !important;
      }
      .geo-source-panel-j8a_m02 .view-list,
      .geo-source-panel-j8a_m02 .effect-grid,
      .geo-source-panel-j8a_m02 .dock {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        margin: 0 !important;
      }
      .geo-source-panel-j8a_m02 .view-list .view-btn:first-child {
        grid-column: 1 / -1 !important;
      }
      .geo-source-panel-j8a_m02 .effect-btn.primary {
        grid-column: 1 / -1 !important;
      }
      .geo-source-panel-j8a_m02 .enhance-block {
        display: grid !important;
        gap: 8px !important;
      }
      .geo-source-panel-j8a_m02 :is(.view-btn, .effect-btn, .toggle-btn, .step-btn) {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 38px !important;
        width: 100% !important;
        padding: 0 8px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        background: rgba(15, 23, 42, 0.72) !important;
        color: #e5e7eb !important;
        box-shadow: none !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow: hidden !important;
        text-overflow: clip !important;
      }
      .geo-source-panel-j8a_m02 :is(.view-btn, .effect-btn, .toggle-btn, .step-btn).active,
      .geo-source-panel-j8a_m02 .effect-btn.primary {
        background: linear-gradient(135deg, rgba(66, 200, 255, 0.92), rgba(72, 169, 120, 0.86)) !important;
        border-color: rgba(130, 224, 255, 0.55) !important;
        color: #0b1320 !important;
      }
      .geo-source-panel-j8a_m02 .mini-slider {
        display: grid !important;
        gap: 7px !important;
        min-width: 0 !important;
        padding: 9px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.13) !important;
        background: rgba(15, 23, 42, 0.56) !important;
      }
      .geo-source-panel-j8a_m02 .mini-slider label {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 8px !important;
        color: #e5e7eb !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
      }
      .geo-source-panel-j8a_m02 .mini-slider label span:first-child {
        min-width: 0 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m02 .mini-slider label span:last-child {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 48px !important;
        min-height: 20px !important;
        padding: 0 8px !important;
        border-radius: 999px !important;
        background: rgba(66, 200, 255, 0.16) !important;
        color: #a7f3ff !important;
        font-size: 10px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m02 .mini-slider input[type="range"] {
        width: 100% !important;
        min-height: 28px !important;
        margin: 0 !important;
        accent-color: #42c8ff !important;
      }
      .geo-source-panel-j8a_m02 .step-list {
        display: grid !important;
        gap: 8px !important;
        margin: 0 !important;
      }
      .geo-source-panel-j8a_m02 .step-btn {
        display: grid !important;
        grid-template-columns: 28px minmax(0, 1fr) !important;
        justify-content: stretch !important;
        gap: 8px !important;
        min-height: 40px !important;
        padding: 0 8px !important;
        text-align: left !important;
      }
      .geo-source-panel-j8a_m02 .step-badge {
        display: grid !important;
        place-items: center !important;
        width: 28px !important;
        height: 28px !important;
        border-radius: 7px !important;
        color: #111820 !important;
        font-size: 12px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        background: var(--step-color) !important;
        flex: 0 0 auto !important;
      }
      .geo-source-panel-j8a_m02 .step-btn > span:last-child {
        min-width: 0 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }
      .geo-source-panel-j8a_m02 .step-name,
      .geo-source-panel-j8a_m02 .step-note {
        display: inline !important;
        min-width: 0 !important;
        margin: 0 !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
      }
      .geo-source-panel-j8a_m02 .step-name {
        flex: 0 0 auto !important;
        color: inherit !important;
        font-size: 11px !important;
        font-weight: 900 !important;
      }
      .geo-source-panel-j8a_m02 .step-note {
        flex: 1 1 auto !important;
        color: #9fb0bf !important;
        font-size: 10px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .geo-source-panel-j8a_m02 .step-btn.active .step-note {
        color: rgba(11, 19, 32, 0.78) !important;
      }
      .geo-source-panel-j8a_m02 .stat-grid,
      .geo-source-panel-j8a_m02 .fact-grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 7px !important;
        margin: 0 !important;
      }
      .geo-source-panel-j8a_m02 .fact-grid {
        grid-template-columns: 1fr !important;
      }
      .geo-source-panel-j8a_m02 :is(.stat-card, .fact-card) {
        min-width: 0 !important;
        padding: 8px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.13) !important;
        background: rgba(15, 23, 42, 0.56) !important;
      }
      .geo-source-panel-j8a_m02 :is(.stat-card, .fact-card) span {
        color: #94a3b8 !important;
        font-size: 10px !important;
        line-height: 1 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m02 :is(.stat-card, .fact-card) strong {
        display: block !important;
        margin-top: 5px !important;
        color: #f8fafc !important;
        font-size: 9.5px !important;
        line-height: 1.1 !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
        overflow: visible !important;
      }
      .geo-source-panel-j8a_m02 .fact-card strong {
        font-size: 10.5px !important;
      }
      .geo-source-panel-j8a_m02 .question {
        margin: 0 !important;
        padding: 9px 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(66, 200, 255, 0.22) !important;
        background: rgba(66, 200, 255, 0.08) !important;
        color: #dff5ff !important;
        font-size: 11px !important;
        line-height: 1.42 !important;
      }
      .geo-source-panel-j8a_m02 .legend {
        display: grid !important;
        gap: 7px !important;
        margin: 0 !important;
      }
      .geo-source-panel-j8a_m02 .legend-row {
        display: grid !important;
        grid-template-columns: 22px minmax(0, 1fr) !important;
        align-items: center !important;
        gap: 8px !important;
        min-height: 22px !important;
        color: #cbd5e1 !important;
        font-size: 10.5px !important;
        line-height: 1.15 !important;
      }
      .geo-source-panel-j8a_m02 .swatch {
        width: 22px !important;
        height: 10px !important;
        border-radius: 3px !important;
      }
      .geo-source-panel-j8a_m02 .detail-panel {
        --current-color: var(--current-color, #42c8ff);
      }
      .geo-source-panel-j8a_m02 .detail-kicker {
        margin: 0 !important;
        color: var(--current-color) !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8a_m02 #detail-title {
        margin: 0 !important;
        color: #f8fafc !important;
        font-size: 14px !important;
        line-height: 1.25 !important;
        font-weight: 900 !important;
        letter-spacing: 0 !important;
      }
      .geo-source-panel-j8a_m02 #detail-main {
        margin: 0 !important;
        color: #dbe5f1 !important;
        font-size: 11px !important;
        line-height: 1.5 !important;
      }
      .geo-source-panel-j8a_m02 .rule-list {
        display: grid !important;
        gap: 7px !important;
      }
      .geo-source-panel-j8a_m02 .rule-item {
        display: grid !important;
        grid-template-columns: 22px minmax(0, 1fr) !important;
        gap: 7px !important;
        align-items: start !important;
        color: #dbe5f1 !important;
        font-size: 10.5px !important;
        line-height: 1.42 !important;
      }
      .geo-source-panel-j8a_m02 .rule-num {
        display: grid !important;
        place-items: center !important;
        width: 22px !important;
        height: 22px !important;
        border-radius: 7px !important;
        background: var(--current-color) !important;
        color: #111820 !important;
        font-size: 10px !important;
        font-weight: 900 !important;
      }
      .geo-source-panel-j8a_m02 .profile-card {
        display: grid !important;
        gap: 7px !important;
        padding: 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(244, 211, 94, 0.22) !important;
        background: rgba(244, 211, 94, 0.08) !important;
      }
      .geo-source-panel-j8a_m02 .profile-bar {
        height: 36px !important;
        border-radius: 7px !important;
      }
      .geo-source-panel-j8a_m02 .profile-labels {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 4px !important;
        color: #f8fafc !important;
        font-size: 10px !important;
        line-height: 1.18 !important;
        font-weight: 800 !important;
      }
      .geo-source-panel-j7a_m09 {
        --geo-source-readout-font-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 30), 12px);
        padding: clamp(8px, 1.2vh, 10px) 10px 14px !important;
      }
      .geo-source-panel-j7a_m09 .geo-source-workbench {
        display: grid !important;
        gap: 10px !important;
        padding-bottom: 12px !important;
      }
      .geo-source-panel-j7a_m09 .geo-source-panel-card,
      .geo-source-panel-j7a_m09 .geo-source-panel-shell {
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .geo-source-panel-j7a_m09 :is(#top-panel, #data-panel, #radar-panel) {
        display: grid !important;
        gap: 10px !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        padding: 12px !important;
        margin: 0 !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.58)) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
        backdrop-filter: blur(14px) !important;
      }
      .geo-source-panel-j7a_m09 #top-panel h1,
      .geo-source-panel-j7a_m09 #top-panel .subtitle {
        display: none !important;
      }
      .geo-source-panel-j7a_m09 #top-panel > p:not(.subtitle) {
        display: flex !important;
        align-items: center !important;
        min-height: 20px !important;
        margin: 2px 0 -2px !important;
        color: #facc15 !important;
        font-size: 11px !important;
        line-height: 1 !important;
        font-weight: 800 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j7a_m09 .slider-group {
        display: grid !important;
        gap: 8px !important;
        margin: 0 !important;
      }
      .geo-source-panel-j7a_m09 .slider-group label {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 8px !important;
        margin: 0 !important;
        color: #e5e7eb !important;
        font-size: 11.5px !important;
        line-height: 1.1 !important;
        font-weight: 800 !important;
      }
      .geo-source-panel-j7a_m09 .slider-group label > span:first-child {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j7a_m09 .val-badge {
        padding: 4px 8px !important;
        border-radius: 999px !important;
        background: rgba(250, 204, 21, 0.92) !important;
        color: #111827 !important;
        font-size: 10px !important;
        line-height: 1 !important;
        font-weight: 900 !important;
      }
      .geo-source-panel-j7a_m09 input[type="range"] {
        height: 30px !important;
        min-height: 30px !important;
        margin: -2px 0 0 !important;
      }
      .geo-source-panel-j7a_m09 input[type="range"]::-webkit-slider-thumb {
        width: 18px !important;
        height: 18px !important;
      }
      .geo-source-panel-j7a_m09 .btn-group {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        margin: 0 !important;
      }
      .geo-source-panel-j7a_m09 .btn,
      .geo-source-panel-j7a_m09 button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 38px !important;
        width: 100% !important;
        padding: 0 8px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        background: rgba(15, 23, 42, 0.74) !important;
        color: #e5e7eb !important;
        box-shadow: none !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
        font-weight: 800 !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow: hidden !important;
        text-overflow: clip !important;
      }
      .geo-source-panel-j7a_m09 .btn-play {
        grid-column: 1 / -1 !important;
        margin: 2px 0 0 !important;
        font-size: 11px !important;
      }
      .geo-source-panel-j7a_m09 .btn:hover,
      .geo-source-panel-j7a_m09 .btn.active {
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.94), rgba(56, 189, 248, 0.86)) !important;
        border-color: rgba(250, 204, 21, 0.55) !important;
        color: #0f172a !important;
      }
      .geo-source-panel-j7a_m09 .legend {
        display: grid !important;
        gap: 7px !important;
        margin: 0 !important;
        color: #cbd5e1 !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
      }
      .geo-source-panel-j7a_m09 .legend-item {
        min-height: 22px !important;
        padding: 6px 8px !important;
        border-radius: 7px !important;
        background: rgba(15, 23, 42, 0.62) !important;
        border: 1px solid rgba(148, 163, 184, 0.12) !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j7a_m09 .color-line {
        width: 24px !important;
        flex: 0 0 24px !important;
      }
      .geo-source-panel-j7a_m09 #data-panel {
        gap: 9px !important;
      }
      .geo-source-panel-j7a_m09 #data-panel .hud-item {
        display: grid !important;
        gap: 6px !important;
        margin: 0 !important;
        padding: 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        background: rgba(15, 23, 42, 0.62) !important;
      }
      .geo-source-panel-j7a_m09 #data-panel .hud-label {
        margin: 0 !important;
        color: #facc15 !important;
        font-size: 10.5px !important;
        line-height: 1.1 !important;
        font-weight: 800 !important;
        text-transform: none !important;
      }
      .geo-source-panel-j7a_m09 #data-panel .hud-value {
        min-height: 22px !important;
        color: #fde68a !important;
        font-size: 18px !important;
        line-height: 1.15 !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .geo-source-panel-j7a_m09 #data-panel .hud-text {
        padding: 0 !important;
        border: 0 !important;
        border-left: 0 !important;
        background: transparent !important;
        color: #dbeafe !important;
        font-size: 11.5px !important;
        line-height: 1.42 !important;
        overflow: visible !important;
      }
      .geo-source-panel-j7a_m09 #data-panel .hud-item div[style*="font-size"] {
        color: #94a3b8 !important;
        font-size: 10px !important;
        line-height: 1.2 !important;
      }
      .geo-source-panel-j7a_m09 .daylight-card,
      .geo-source-panel-j7a_m09 .shadow-card {
        gap: 8px !important;
      }
      .geo-source-panel-j7a_m09 .daylight-row {
        display: grid !important;
        grid-template-columns: 42px minmax(0, 1fr) 42px !important;
        align-items: center !important;
        gap: 7px !important;
        min-height: 18px !important;
        color: #dbeafe !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
      }
      .geo-source-panel-j7a_m09 .daylight-row span:first-child,
      .geo-source-panel-j7a_m09 .daylight-row b {
        min-width: 0 !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .geo-source-panel-j7a_m09 .daylight-row b {
        color: #fde68a !important;
        font-size: 10px !important;
        line-height: 1 !important;
        text-align: right !important;
        font-variant-numeric: tabular-nums !important;
      }
      .geo-source-panel-j7a_m09 .daylight-track,
      .geo-source-panel-j7a_m09 .shadow-meter {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        height: 8px !important;
        border-radius: 999px !important;
        overflow: hidden !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        background: rgba(15, 23, 42, 0.72) !important;
      }
      .geo-source-panel-j7a_m09 .daylight-track i,
      .geo-source-panel-j7a_m09 .shadow-meter i {
        display: block !important;
        height: 100% !important;
        min-width: 4px !important;
        border-radius: inherit !important;
      }
      .geo-source-panel-j7a_m09 .daylight-track i {
        background: linear-gradient(90deg, #38bdf8, #fde68a) !important;
      }
      .geo-source-panel-j7a_m09 .shadow-meter {
        height: 10px !important;
      }
      .geo-source-panel-j7a_m09 .shadow-meter i {
        background: linear-gradient(90deg, #facc15, #fb923c, #ef4444) !important;
      }
      .geo-source-panel-j7a_m09 #radar-panel {
        gap: 8px !important;
      }
      .geo-source-panel-j7a_m09 #radar-panel > div:first-child {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 3px !important;
        margin: 0 !important;
        color: #38bdf8 !important;
        font-size: 10.5px !important;
        line-height: 1.2 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j7a_m09 #radar-panel > div:first-child span:last-child {
        color: #94a3b8 !important;
        font-size: 10px !important;
      }
      .geo-source-panel-j7a_m09 #radar-canvas {
        display: block !important;
        width: 100% !important;
        height: 126px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(56, 189, 248, 0.24) !important;
        background: #020617 !important;
      }
      .geo-source-scene-j7a_m09 .zone-label {
        padding: 5px 10px !important;
        border-radius: 7px !important;
        font-size: 13px !important;
        line-height: 1.05 !important;
        max-width: 132px !important;
      }
      .geo-source-scene-j7a_m09 .zone-label span {
        font-size: 10px !important;
        line-height: 1.1 !important;
      }
      .geo-source-scene-j7a_m09 #label-pole {
        font-size: 11px !important;
        max-width: 128px !important;
      }
      .geo-source-panel-j7a_m07 .geo-source-workbench {
        gap: 10px !important;
        padding-bottom: 12px !important;
      }
      .geo-source-panel-j7a_m07 .pangaea-card {
        padding: 10px !important;
        gap: 8px !important;
      }
      .geo-source-panel-j7a_m07 .pangaea-card--title {
        min-height: 78px !important;
      }
      .geo-source-panel-j7a_m07 .layer-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .geo-source-panel-j7a_m07 .layer-toggle {
        min-height: 38px !important;
        grid-template-columns: 10px max-content !important;
        justify-content: center !important;
        gap: 6px !important;
        padding: 0 8px !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .geo-source-panel-j7a_m07 .layer-toggle span {
        min-width: max-content !important;
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j7a_m07 .timeline {
        gap: 6px !important;
      }
      .geo-source-panel-j7a_m07 .timeline-item {
        min-height: 36px !important;
      }
      .geo-source-panel-j7a_m07 .event-desc,
      .geo-source-panel-j7a_m07 .force-desc {
        line-height: 1.5 !important;
      }
      .geo-source-panel-j7a_m07 .force-box {
        padding: 12px 12px 16px !important;
        overflow: visible !important;
      }
      .geo-source-panel-j7a_m07 .force-title {
        margin-bottom: 8px !important;
        line-height: 1.18 !important;
      }
      .geo-source-panel-j7a_m07 .force-desc {
        padding-bottom: 2px !important;
      }
      .geo-source-panel-j7a_m07 #mantle-panel {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      .geo-source-panel-j7a_m07 #mantle-anim {
        height: 112px !important;
      }
      .geo-source-scene-j7b_m01,
      .geo-source-panel-j7b_m01 {
        min-width: 0 !important;
        min-height: 0 !important;
      }
      .geo-source-scene-j7b_m01 #ui-layer,
      .geo-source-scene-j7b_m01 #labels-layer {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        pointer-events: none !important;
      }
      .geo-source-scene-j7b_m01 .map-label {
        max-width: 132px !important;
        padding: 4px 6px !important;
        font-size: 11px !important;
        line-height: 1.18 !important;
      }
      .geo-source-scene-j7b_m01 .map-label b {
        font-size: 11px !important;
      }
      .geo-source-scene-j7b_m01 .map-label small {
        font-size: 10px !important;
      }
      .geo-source-scene-j7b_m01 .hover-info {
        position: absolute !important;
        max-width: 172px !important;
        font-size: 11px !important;
      }
      .geo-source-panel-j7b_m01 .panel,
      .geo-source-panel-j7b_m01 .source-chip,
      .geo-source-panel-j7b_m01 .lesson-panel,
      .geo-source-panel-j7b_m01 .profile-panel,
      .geo-source-panel-j7b_m01 .map2d-panel {
        position: relative !important;
        inset: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        left: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 0 12px !important;
        padding: 12px !important;
        transform: none !important;
        border-radius: 8px !important;
        box-shadow: none !important;
      }
      .geo-source-panel-j7b_m01 .metric-grid,
      .geo-source-panel-j7b_m01 .segmented,
      .geo-source-panel-j7b_m01 .toggle-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .geo-source-panel-j7b_m01 .tool-btn,
      .geo-source-panel-j7b_m01 .profile-step,
      .geo-source-panel-j7b_m01 .map2d-head button {
        min-height: 40px !important;
        min-width: 0 !important;
        width: 100% !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        touch-action: manipulation;
      }
      .geo-source-panel-j7b_m01 .metric strong,
      .geo-source-panel-j7b_m01 .metric span,
      .geo-source-panel-j7b_m01 .legend-row,
      .geo-source-panel-j7b_m01 .profile-title,
      .geo-source-panel-j7b_m01 .profile-title span,
      .geo-source-panel-j7b_m01 .kicker,
      .geo-source-panel-j7b_m01 .focus-question,
      .geo-source-panel-j7b_m01 .lesson-panel,
      .geo-source-panel-j7b_m01 .conclusion,
      .geo-source-panel-j7b_m01 .data-source {
        max-width: 100% !important;
        min-width: 0 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        line-height: 1.42 !important;
      }
      .geo-source-panel-j7b_m01 .profile-title {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 4px !important;
      }
      .geo-source-panel-j7b_m01 .profile-title span:last-child {
        white-space: normal !important;
      }
      .geo-source-panel-j7b_m01 .profile-controls {
        display: grid !important;
        grid-template-columns: 40px minmax(0, 1fr) 72px 40px !important;
        gap: 7px !important;
      }
      .geo-source-panel-j7b_m01 .profile-input {
        width: 100% !important;
        min-width: 0 !important;
      }
      .geo-source-panel-j7b_m01 #profile-svg {
        width: 100% !important;
        height: 118px !important;
      }
      .geo-source-panel-j7b_m01 .legend-row {
        grid-template-columns: 46px minmax(0, 1fr) !important;
      }
      .geo-source-panel-j7b_m01 .swatch {
        width: 46px !important;
      }
      .geo-source-panel-j7b_m01 .map2d-panel {
        display: none !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      .geo-source-panel-j7b_m01 .map2d-panel.visible {
        display: flex !important;
        max-height: 60vh !important;
      }
      .geo-source-panel-j7b_m01 .map2d-head {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) 40px !important;
        align-items: center !important;
      }
      .geo-source-panel-j7b_m01 .map2d-head span {
        min-width: 0 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      .geo-source-panel-j7b_m01 .map2d-panel img {
        width: 100% !important;
        height: auto !important;
        max-height: calc(60vh - 74px) !important;
        object-fit: contain !important;
      }
      .geo-source-scene-sb1_m06 {
        background: #020617 !important;
      }
      .geo-source-scene-sb1_m06 #app-container,
      .geo-source-scene-sb1_m06 #viewport-container {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
      .geo-source-scene-sb1_m06 #viewport-container canvas,
      .geo-source-scene-sb1_m06 #level1-split canvas {
        pointer-events: auto !important;
        touch-action: none !important;
      }
      .geo-source-scene-sb1_m06 #level1-split {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        left: 0 !important;
        display: none;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 1px !important;
      }
      .geo-source-scene-sb1_m06 .split-viewport {
        min-width: 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .geo-source-scene-sb1_m06 .split-label,
      .geo-source-scene-sb1_m06 #hud-instructions {
        max-width: min(240px, calc(100% - 24px)) !important;
        padding: 8px 10px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        line-height: 1.3 !important;
        color: rgba(226, 232, 240, 0.92) !important;
        background: rgba(2, 6, 23, 0.72) !important;
        border: 1px solid rgba(125, 211, 252, 0.22) !important;
        pointer-events: none !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85) !important;
      }
      .geo-source-scene-sb1_m06 #hud-instructions {
        top: 12px !important;
        left: 12px !important;
        right: auto !important;
        bottom: auto !important;
      }
      .geo-source-panel-sb1_m06 {
        padding: 10px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        scrollbar-width: none !important;
        touch-action: pan-y !important;
      }
      .geo-source-panel-sb1_m06 .panel,
      .geo-source-panel-sb1_m06 #left-panel,
      .geo-source-panel-sb1_m06 .guide-step,
      .geo-source-panel-sb1_m06 .quiz-container,
      .geo-source-panel-sb1_m06 #bottom-panel {
        flex: 0 0 auto !important;
        position: relative !important;
        inset: auto !important;
        left: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        overflow: visible !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sb1_m06 #left-panel > .control-group:first-child h2 {
        display: none !important;
      }
      .geo-source-panel-sb1_m06 .control-group,
      .geo-source-panel-sb1_m06 .guide-step,
      .geo-source-panel-sb1_m06 .quiz-container {
        padding: 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        background: rgba(15, 23, 42, 0.74) !important;
      }
      .geo-source-panel-sb1_m06 #lvl1-controls,
      .geo-source-panel-sb1_m06 #lvl2-controls,
      .geo-source-panel-sb1_m06 #lvl3-controls {
        gap: 8px !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
      }
      .geo-source-panel-sb1_m06 .level-selector,
      .geo-source-panel-sb1_m06 .segmented-controls,
      .geo-source-panel-sb1_m06 .quiz-options {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .geo-source-panel-sb1_m06 .level-selector {
        grid-template-columns: 1fr !important;
      }
      .geo-source-panel-sb1_m06 .control-label,
      .geo-source-panel-sb1_m06 label[style*="display: flex"] {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        gap: 8px !important;
        align-items: center !important;
        color: #e5e7eb !important;
        line-height: 1.25 !important;
      }
      .geo-source-panel-sb1_m06 .control-label span,
      .geo-source-panel-sb1_m06 .value-display {
        min-width: 0 !important;
        text-align: right !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        color: #67e8f9 !important;
      }
      .geo-source-panel-sb1_m06 button,
      .geo-source-panel-sb1_m06 .level-btn,
      .geo-source-panel-sb1_m06 .seg-btn,
      .geo-source-panel-sb1_m06 .action-btn,
      .geo-source-panel-sb1_m06 .quiz-opt-btn {
        min-height: 42px !important;
        border-radius: 8px !important;
        padding: 9px 10px !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        word-break: keep-all !important;
        text-align: center !important;
        color: #e5e7eb !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        background: rgba(30, 41, 59, 0.72) !important;
        box-shadow: none !important;
        touch-action: manipulation !important;
      }
      .geo-source-panel-sb1_m06 .level-btn.active,
      .geo-source-panel-sb1_m06 .seg-btn.active,
      .geo-source-panel-sb1_m06 .action-btn {
        color: #f8fafc !important;
        border-color: rgba(34, 211, 238, 0.55) !important;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.58), rgba(20, 184, 166, 0.42)) !important;
      }
      .geo-source-panel-sb1_m06 .action-btn.secondary {
        background: rgba(51, 65, 85, 0.72) !important;
        border-color: rgba(148, 163, 184, 0.22) !important;
      }
      .geo-source-panel-sb1_m06 input[type="range"] {
        min-height: 34px !important;
        touch-action: none !important;
      }
      .geo-source-panel-sb1_m06 #lvl3-controls > .control-group {
        padding: 8px !important;
        gap: 8px !important;
      }
      .geo-source-panel-sb1_m06 .legend-box {
        display: grid !important;
        gap: 6px !important;
        min-height: 0 !important;
      }
      .geo-source-panel-sb1_m06 .kicker,
      .geo-source-panel-sb1_m06 .guide-step,
      .geo-source-panel-sb1_m06 .quiz-q,
      .geo-source-panel-sb1_m06 .quiz-feedback,
      .geo-source-panel-sb1_m06 .legend-row {
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        line-height: 1.35 !important;
        color: rgba(226, 232, 240, 0.9) !important;
      }
      .geo-source-panel-sb1_m06 .legend-row {
        gap: 8px !important;
        font-size: 12px !important;
        min-height: 0 !important;
      }
      .geo-source-panel-sb1_m06 #bottom-panel {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        margin-top: 0 !important;
      }
      .geo-source-panel-sb1_m06 .metric-card {
        min-width: 0 !important;
        padding: 10px !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.74) !important;
      }
      .geo-source-panel-sb1_m06 .metric-label,
      .geo-source-panel-sb1_m06 .metric-val,
      .geo-source-panel-sb1_m06 .metric-unit {
        max-width: 100% !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        line-height: 1.2 !important;
      }
      .geo-source-panel-sb1_m06 .metric-val {
        font-size: clamp(16px, calc(var(--bio-scene-panel-width, 320px) / 18), 22px) !important;
      }
      .geo-source-panel-sb1_m06 .hidden {
        display: none !important;
      }
      .geo-source-scene-sb1_m08 {
        background: #020617 !important;
      }
      .geo-source-scene-sb1_m08 #svg-container {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        display: none;
        align-items: center !important;
        justify-content: center !important;
        padding: 12px !important;
        overflow: hidden !important;
        pointer-events: none !important;
        z-index: 2 !important;
      }
      .geo-source-scene-sb1_m08 #weather-svg {
        width: min(92%, 720px) !important;
        height: auto !important;
        max-height: 92% !important;
        display: block !important;
      }
      .geo-source-scene-sb1_m08 #labels-container {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 4 !important;
      }
      .geo-source-scene-sb1_m08 .label,
      .geo-source-scene-sb1_m08 .annotation {
        max-width: min(170px, 38vw) !important;
        padding: 5px 7px !important;
        border-radius: 6px !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9) !important;
        pointer-events: none !important;
      }
      .geo-source-scene-sb1_m08 .pressure-label {
        max-width: 112px !important;
        pointer-events: none !important;
        white-space: pre-line !important;
      }
      .geo-source-scene-sb1_m08 .pressure-label[data-pressure-type="isobar"] {
        opacity: 0.68;
      }
      .geo-source-scene-sb1_m01 {
        background: #020617 !important;
      }
      .geo-source-scene-sb1_m01 .ui-layer {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        padding: 0 !important;
        pointer-events: none !important;
        z-index: 6 !important;
      }
      .geo-source-scene-sb1_m01 .title-box {
        display: none !important;
      }
      .geo-source-scene-sb1_m01 .title-box h1 {
        display: none !important;
      }
      .geo-source-scene-sb1_m01 #alert-banner {
        position: absolute !important;
        left: 14px !important;
        top: 14px !important;
        max-width: min(520px, calc(100% - 28px)) !important;
        margin: 0 !important;
        pointer-events: none !important;
        line-height: 1.35 !important;
        white-space: normal !important;
      }
      .geo-source-scene-sb1_m01 #labels-container {
        position: absolute !important;
        inset: 0 !important;
        display: block !important;
        pointer-events: none !important;
        z-index: 8 !important;
      }
      .geo-source-scene-sb1_m01 .annotation {
        display: none !important;
      }
      .geo-source-scene-sb1_m01 .annotation.planet-name {
        display: block !important;
      }
      .geo-source-scene-sb1_m01 .annotation.milky-way-marker {
        display: block !important;
        padding: 3px 7px !important;
        border-radius: 4px !important;
        background: rgba(2, 6, 23, 0.66) !important;
        border: 1px solid rgba(125, 211, 252, 0.55) !important;
        color: #dff7ff !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
        letter-spacing: 0 !important;
        white-space: pre-line !important;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95) !important;
        transform: translate(-50%, -135%) !important;
      }
      .geo-source-scene-sb1_m01 #l_gal_scale,
      .geo-source-scene-sb1_m01 #l_gal_dist,
      .geo-source-scene-sb1_m01 #l_gal_solar_tb {
        display: block !important;
        opacity: 0;
        visibility: hidden;
        padding: 3px 8px !important;
        border-radius: 4px !important;
        background: rgba(0, 0, 0, 0.48) !important;
        border: 1px solid rgba(255, 255, 255, 0.5) !important;
        color: #f8fafc !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95) !important;
      }
      .geo-source-scene-sb1_m01 #l_gal_scale.galaxy-scale-marker-visible,
      .geo-source-scene-sb1_m01 #l_gal_dist.galaxy-scale-marker-visible,
      .geo-source-scene-sb1_m01 #l_gal_solar_tb.galaxy-scale-marker-visible {
        opacity: 1 !important;
        visibility: visible !important;
      }
      .geo-source-scene-sb1_m01 #l_gal_solar_tb {
        color: #fde047 !important;
        border-color: rgba(250, 204, 21, 0.7) !important;
        background: rgba(55, 45, 0, 0.48) !important;
      }
      .geo-source-scene-sb1_m01 .education-modal {
        position: absolute !important;
        inset: 0 !important;
        padding: 14px !important;
        z-index: 30 !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .geo-source-scene-sb1_m01 .education-modal .modal-content {
        width: min(560px, calc(100% - 20px)) !important;
        max-height: calc(100% - 20px) !important;
        overflow-y: auto !important;
        padding: 12px !important;
      }
      .geo-source-scene-sb1_m01 .education-modal .modal-content.planet-card-content {
        width: min(500px, calc(100% - 20px)) !important;
        max-height: calc(100% - 20px) !important;
        overflow: hidden !important;
        padding: 8px !important;
      }
      .geo-source-scene-sb1_m01 .education-modal .modal-content p {
        min-height: 92px !important;
        max-height: 150px !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
      }
      .geo-source-scene-sb1_m01 .education-modal .modal-content.planet-card-content p {
        display: none !important;
      }
      .geo-source-scene-sb1_m01 .education-modal .modal-content img {
        height: clamp(112px, 42%, 150px) !important;
        max-height: 150px !important;
        object-fit: cover !important;
      }
      .geo-source-scene-sb1_m01 .education-modal .modal-content.planet-card-content img {
        width: 100% !important;
        height: auto !important;
        max-height: calc(100% - 16px) !important;
        object-fit: contain !important;
      }
      .geo-source-panel-sb1_m01 {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        padding: 10px !important;
        touch-action: pan-y !important;
      }
      .geo-source-panel-sb1_m01 .panel,
      .geo-source-panel-sb1_m01 .left-panel,
      .geo-source-panel-sb1_m01 .right-panel,
      .geo-source-panel-sb1_m01 .bottom-panel {
        flex: 0 0 auto !important;
        position: relative !important;
        inset: auto !important;
        left: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        transform: none !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 11px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        overflow: visible !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.76) !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        box-shadow: none !important;
        backdrop-filter: blur(12px) !important;
      }
      .geo-source-panel-sb1_m01 h2 {
        margin: 0 !important;
        padding: 0 0 0 8px !important;
        color: #67e8f9 !important;
        font-size: 12px !important;
        line-height: 1.3 !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
      }
      .geo-source-panel-sb1_m01 .control-group {
        gap: 8px !important;
      }
      .geo-source-panel-sb1_m01 .control-label,
      .geo-source-panel-sb1_m01 .effect-title,
      .geo-source-panel-sb1_m01 .hud-label {
        max-width: 100% !important;
        min-width: 0 !important;
        color: rgba(203, 213, 225, 0.88) !important;
        font-size: 12px !important;
        line-height: 1.35 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      .geo-source-panel-sb1_m01 .btn-row {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .geo-source-panel-sb1_m01 .left-panel .btn-row,
      .geo-source-panel-sb1_m01 .right-panel .btn-row {
        grid-template-columns: 1fr !important;
      }
      .geo-source-panel-sb1_m01 .btn,
      .geo-source-panel-sb1_m01 button {
        min-height: 42px !important;
        width: 100% !important;
        padding: 9px 10px !important;
        border-radius: 8px !important;
        color: #dbeafe !important;
        border: 1px solid rgba(148, 163, 184, 0.22) !important;
        background: rgba(30, 41, 59, 0.76) !important;
        box-shadow: none !important;
        text-align: center !important;
        white-space: normal !important;
        word-break: keep-all !important;
        overflow-wrap: anywhere !important;
        line-height: 1.25 !important;
        font-size: 12px !important;
        touch-action: manipulation !important;
      }
      .geo-source-panel-sb1_m01 .btn.active,
      .geo-source-panel-sb1_m01 button.active {
        color: #f8fafc !important;
        border-color: rgba(45, 212, 191, 0.58) !important;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.62), rgba(20, 184, 166, 0.44)) !important;
      }
      .geo-source-panel-sb1_m01 input[type="range"] {
        width: 100% !important;
        min-height: 34px !important;
        touch-action: none !important;
      }
      .geo-source-panel-sb1_m01 .effect-card {
        padding: 10px !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.38) !important;
      }
      .geo-source-panel-sb1_m01 .bottom-panel {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
      }
      .geo-source-panel-sb1_m01 .hud-value,
      .geo-source-panel-sb1_m01 .val-badge {
        max-width: 100% !important;
        min-width: 0 !important;
        font-size: 12px !important;
        line-height: 1.18 !important;
        overflow-wrap: anywhere !important;
        white-space: normal !important;
      }
      @media (max-width: 720px), (orientation: portrait) {
        .geo-source-scene-sb1_m01 .title-box {
          display: none !important;
        }
        .geo-source-scene-sb1_m01 .title-box h1 {
          display: none !important;
        }
        .geo-source-scene-sb1_m01 #alert-banner {
          left: 10px !important;
          top: 10px !important;
          max-width: calc(100% - 20px) !important;
          font-size: 11px !important;
          padding: 6px 10px !important;
        }
        .geo-source-scene-sb1_m01 .annotation {
          display: none !important;
        }
        .geo-source-scene-sb1_m01 .annotation.planet-name {
          display: none !important;
        }
        .geo-source-panel-sb1_m01 .bottom-panel {
          grid-template-columns: 1fr !important;
        }
      }
      .geo-source-panel-sb1_m08 {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        padding: 10px !important;
        touch-action: pan-y !important;
      }
      .geo-source-panel-sb1_m08 .panel,
      .geo-source-panel-sb1_m08 .controls-box,
      .geo-source-panel-sb1_m08 .title-box,
      .geo-source-panel-sb1_m08 .legend-box,
      .geo-source-panel-sb1_m08 .info-panel {
        flex: 0 0 auto !important;
        position: relative !important;
        inset: auto !important;
        left: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        overflow: visible !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sb1_m08 .title-box h1,
      .geo-source-panel-sb1_m08 .title-box > p {
        display: none !important;
      }
      .geo-source-panel-sb1_m08 .control-group,
      .geo-source-panel-sb1_m08 .title-box > div,
      .geo-source-panel-sb1_m08 .legend-box,
      .geo-source-panel-sb1_m08 .info-panel {
        padding: 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.15) !important;
        background: rgba(15, 23, 42, 0.74) !important;
      }
      .geo-source-panel-sb1_m08 .control-group .control-group {
        margin-top: 10px !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
      }
      .geo-source-panel-sb1_m08 .control-label,
      .geo-source-panel-sb1_m08 .info-title {
        display: block !important;
        margin: 0 0 8px !important;
        min-width: 0 !important;
        color: #67e8f9 !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        line-height: 1.3 !important;
        letter-spacing: 0 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      .geo-source-panel-sb1_m08 .btn-row {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .geo-source-panel-sb1_m08 .btn-row[style*="margin-top"] {
        margin-top: 8px !important;
      }
      .geo-source-panel-sb1_m08 .btn,
      .geo-source-panel-sb1_m08 button {
        min-height: 42px !important;
        width: 100% !important;
        padding: 9px 10px !important;
        border-radius: 8px !important;
        color: #dbeafe !important;
        border: 1px solid rgba(148, 163, 184, 0.22) !important;
        background: rgba(30, 41, 59, 0.76) !important;
        box-shadow: none !important;
        text-align: center !important;
        white-space: normal !important;
        word-break: keep-all !important;
        overflow-wrap: anywhere !important;
        line-height: 1.25 !important;
        font-size: 12px !important;
        touch-action: manipulation !important;
      }
      .geo-source-panel-sb1_m08 .btn.active,
      .geo-source-panel-sb1_m08 button.active {
        color: #f8fafc !important;
        border-color: rgba(45, 212, 191, 0.58) !important;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.62), rgba(20, 184, 166, 0.44)) !important;
      }
      .geo-source-panel-sb1_m08 input[type="range"] {
        width: 100% !important;
        min-height: 34px !important;
        touch-action: none !important;
      }
      .geo-source-panel-sb1_m08 .legend-item {
        display: grid !important;
        grid-template-columns: 18px minmax(0, 1fr) !important;
        gap: 8px !important;
        align-items: center !important;
        min-width: 0 !important;
        color: rgba(226, 232, 240, 0.9) !important;
        font-size: 12px !important;
        line-height: 1.32 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      .geo-source-panel-sb1_m08 .legend-color {
        width: 14px !important;
        height: 14px !important;
        min-width: 14px !important;
        border-radius: 999px !important;
      }
      .geo-source-panel-sb1_m08 #desc-content,
      .geo-source-panel-sb1_m08 .title-box div,
      .geo-source-panel-sb1_m08 .title-box span {
        max-width: 100% !important;
        min-width: 0 !important;
        color: rgba(226, 232, 240, 0.88) !important;
        font-size: 12px !important;
        line-height: 1.42 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      .geo-source-panel-sb1_m08 .meteorology-chart-box {
        overflow: hidden !important;
      }
      .geo-source-panel-sb1_m08 .meteorology-chart-head {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 8px !important;
        margin-bottom: 8px !important;
      }
      .geo-source-panel-sb1_m08 .meteorology-chart-title,
      .geo-source-panel-sb1_m08 #chart-type {
        line-height: 1.25 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .geo-source-panel-sb1_m08 .meteorology-chart-title {
        color: #67e8f9 !important;
        font-size: 12px !important;
        font-weight: 700 !important;
      }
      .geo-source-panel-sb1_m08 #chart-type {
        color: rgba(203, 213, 225, 0.72) !important;
        font-size: 11px !important;
      }
      .geo-source-panel-sb1_m08 #meteorology-chart {
        width: 100% !important;
        height: 120px !important;
        max-height: 120px !important;
        display: block !important;
      }
      [data-bio-scene-controls="true"].geo-source-panel-sb2_m04 {
        gap: 7px !important;
        padding: 8px !important;
        scrollbar-width: thin !important;
        scrollbar-color: rgba(34, 211, 238, 0.55) transparent !important;
      }
      [data-bio-scene-controls="true"].geo-source-panel-sb2_m04::-webkit-scrollbar {
        display: block !important;
        width: 4px !important;
        height: 4px !important;
      }
      [data-bio-scene-controls="true"].geo-source-panel-sb2_m04::-webkit-scrollbar-thumb {
        border-radius: 999px !important;
        background: rgba(34, 211, 238, 0.48) !important;
      }
      .geo-source-panel-sb2_m04 .geo-source-workbench {
        gap: 8px !important;
      }
      .geo-source-panel-sb2_m04 .geo-source-panel-card {
        padding: 9px !important;
        border-radius: 8px !important;
        overflow: visible !important;
      }
      .geo-source-panel-sb2_m04 .geo-source-panel-card[data-source-panel-card="1"] {
        padding-bottom: 8px !important;
      }
      .geo-source-panel-sb2_m04 .geo-source-panel-card[data-source-panel-card="3"] {
        padding: 4px 7px !important;
      }
      .geo-source-panel-sb2_m04 #ui-left,
      .geo-source-panel-sb2_m04 #ui-right,
      .geo-source-panel-sb2_m04 #status-hud {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        gap: 7px !important;
      }
      .geo-source-panel-sb2_m04 #ui-left .desc {
        color: rgba(203, 213, 225, 0.78) !important;
        font-size: 11px !important;
        line-height: 1.34 !important;
      }
      .geo-source-panel-sb2_m04 #ui-left .tabs {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
        margin: 0 !important;
      }
      .geo-source-panel-sb2_m04 #ui-left .tab-btn {
        min-height: 40px !important;
        padding: 7px 8px !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
        text-align: center !important;
      }
      .geo-source-panel-sb2_m04 #controls-container {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 6px !important;
        margin: 0 !important;
      }
      .geo-source-panel-sb2_m04 .slider-group {
        margin: 0 !important;
        padding: 5px 7px !important;
        min-width: 0 !important;
      }
      .geo-source-panel-sb2_m04 .slider-label {
        margin: 0 0 2px !important;
        font-size: 11px !important;
        line-height: 1.18 !important;
      }
      .geo-source-panel-sb2_m04 .value-badge {
        min-width: 28px !important;
        padding: 1px 6px !important;
        font-size: 10px !important;
      }
      .geo-source-panel-sb2_m04 input[type="range"] {
        height: 22px !important;
        min-height: 22px !important;
      }
      .geo-source-panel-sb2_m04 #ui-right .deck-header {
        gap: 8px !important;
      }
      .geo-source-panel-sb2_m04 #ui-right .deck-title,
      .geo-source-panel-sb2_m04 #ui-right .info-title {
        font-size: 12px !important;
        line-height: 1.22 !important;
      }
      .geo-source-panel-sb2_m04 #ui-right .control-section {
        padding: 7px !important;
        border-radius: 8px !important;
      }
      .geo-source-panel-sb2_m04 #ui-right .section-title {
        margin-bottom: 5px !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
      }
      .geo-source-panel-sb2_m04 #ui-right .chip-grid,
      .geo-source-panel-sb2_m04 #ui-right .chip-row {
        display: grid !important;
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        gap: 5px !important;
      }
      .geo-source-panel-sb2_m04 #ui-right .control-chip {
        min-height: 28px !important;
        height: auto !important;
        padding: 4px 5px !important;
        font-size: 10.5px !important;
        line-height: 1.15 !important;
        text-align: center !important;
      }
      .geo-source-panel-sb2_m04 #ui-right .info-text,
      .geo-source-panel-sb2_m04 #ui-right .info-section {
        font-size: 11px !important;
        line-height: 1.36 !important;
      }
      .geo-source-panel-sb2_m04 #status-hud {
        display: flex !important;
        flex-wrap: wrap !important;
        padding: 4px 0 !important;
        gap: 3px 7px !important;
        font-size: 10px !important;
        line-height: 1.22 !important;
      }
      .geo-source-panel-sb2_m04 #status-hud .legend-item,
      .geo-source-panel-sb2_m04 #status-hud .status-item {
        white-space: normal !important;
      }
      .geo-source-panel-sb2_m04 #status-hud .legend-dot {
        width: 8px !important;
        height: 8px !important;
      }
      .geo-source-scene-j8b_m01 .ui-shell {
        position: absolute !important;
        inset: 0 !important;
        z-index: 6 !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        grid-template-rows: minmax(0, 1fr) !important;
        width: 100% !important;
        height: 100% !important;
        padding: 10px !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide {
        grid-column: 1 !important;
        grid-row: 1 !important;
        align-self: start !important;
        justify-self: start !important;
        width: auto !important;
        max-width: min(286px, calc(100% - 18px)) !important;
        max-height: min(56%, 210px) !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        background: rgba(8, 13, 22, 0.62) !important;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.16) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        pointer-events: auto !important;
        overflow: hidden !important;
        touch-action: manipulation !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide:not([open]) {
        width: 54px !important;
        height: 32px !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide[open] {
        width: min(286px, calc(100% - 18px)) !important;
        background: rgba(8, 13, 22, 0.78) !important;
      }
      .geo-source-scene-j8b_m01 .scene-guide-toggle {
        list-style: none !important;
        height: 32px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 54px !important;
        padding: 0 12px !important;
        color: #fff7ed !important;
        font-size: 12px !important;
        font-weight: 950 !important;
        line-height: 1 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        cursor: pointer !important;
        user-select: none !important;
        touch-action: manipulation !important;
      }
      .geo-source-scene-j8b_m01 .scene-guide-toggle::-webkit-details-marker,
      .geo-source-scene-j8b_m01 .scene-guide-toggle::marker {
        display: none !important;
        content: "" !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide[open] .scene-guide-toggle {
        width: 100% !important;
        justify-content: space-between !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide[open] .scene-guide-toggle::after {
        content: "收起" !important;
        color: rgba(250, 204, 21, 0.82) !important;
        font-size: 10px !important;
        font-weight: 900 !important;
      }
      .geo-source-scene-j8b_m01 .scene-guide-body {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 8px !important;
        max-height: calc(min(56%, 210px) - 33px) !important;
        padding: 9px !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .legend-block,
      .geo-source-scene-j8b_m01 .scene-map-guide .elevation-key {
        min-width: 0 !important;
        display: grid !important;
        gap: 5px !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .section-title {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        margin: 0 !important;
        color: #fff7ed !important;
        font-size: 11px !important;
        font-weight: 950 !important;
        line-height: 1.1 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .section-title span:last-child {
        color: rgba(250, 204, 21, 0.86) !important;
        font-size: 10px !important;
        font-weight: 900 !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .legend {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 4px 6px !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .legend-item {
        min-width: 0 !important;
        min-height: 17px !important;
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 0 5px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        background: rgba(255, 255, 255, 0.045) !important;
        color: rgba(248, 250, 252, 0.88) !important;
        font-size: 10px !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .legend-swatch {
        flex: 0 0 auto !important;
        width: 9px !important;
        height: 9px !important;
        border-radius: 999px !important;
        background: var(--swatch) !important;
        box-shadow: 0 0 8px color-mix(in srgb, var(--swatch) 50%, transparent) !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .elevation-ramp {
        height: 9px !important;
        border-radius: 999px !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .elevation-ticks {
        display: flex !important;
        justify-content: space-between !important;
        gap: 5px !important;
        color: rgba(226, 232, 240, 0.82) !important;
        font-size: 10px !important;
        line-height: 1 !important;
      }
      .geo-source-scene-j8b_m01 .scene-map-guide .elevation-ticks span {
        min-width: 0 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .geo-source-panel-j8b_m01 {
        padding: clamp(8px, 1.5vh, 12px) !important;
        background: transparent !important;
        border: 0 !important;
        color: #f8fafc !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        touch-action: pan-y !important;
        overscroll-behavior: contain !important;
        scrollbar-width: none !important;
      }
      .geo-source-panel-j8b_m01::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
      }
      .geo-source-panel-j8b_m01 .geo-source-workbench {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        width: 100% !important;
        min-width: 0 !important;
      }
      .geo-source-panel-j8b_m01 .geo-source-panel-card {
        position: relative !important;
        margin: 0 !important;
        padding: 12px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.075) !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.024)) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045) !important;
        overflow: hidden !important;
      }
      .geo-source-panel-j8b_m01 .geo-source-panel-card::before {
        content: "" !important;
        position: absolute !important;
        top: 0 !important;
        left: 12px !important;
        right: 12px !important;
        height: 1px !important;
        pointer-events: none !important;
        background: linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.44), rgba(56, 189, 248, 0.34), transparent) !important;
      }
      .geo-source-panel-j8b_m01 .geo-source-panel-card:has(.floating-actions),
      .geo-source-panel-j8b_m01 .geo-source-panel-card[data-source-panel-card="4"] {
        order: -2 !important;
        padding: 10px !important;
      }
      .geo-source-panel-j8b_m01 .geo-source-panel-card:has(.terrain-chip),
      .geo-source-panel-j8b_m01 .geo-source-panel-card[data-source-panel-card="5"] {
        order: 5 !important;
        padding: 9px 11px !important;
      }
      .geo-source-panel-j8b_m01 .sidebar,
      .geo-source-panel-j8b_m01 .detail-panel,
      .geo-source-panel-j8b_m01 .bottom-dock,
      .geo-source-panel-j8b_m01 .floating-actions,
      .geo-source-panel-j8b_m01 .terrain-chip {
        display: grid !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        gap: 10px !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .geo-source-panel-j8b_m01 .brand {
        display: none !important;
      }
      .geo-source-panel-j8b_m01 .floating-actions {
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        align-items: stretch !important;
        justify-content: stretch !important;
      }
      .geo-source-panel-j8b_m01 .floating-actions > div {
        display: none !important;
      }
      .geo-source-panel-j8b_m01 .toolbar {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 7px !important;
      }
      .geo-source-panel-j8b_m01 .region-list,
      .geo-source-panel-j8b_m01 .boundary-list,
      .geo-source-panel-j8b_m01 .river-list,
      .geo-source-panel-j8b_m01 .layer-list {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
      }
      .geo-source-panel-j8b_m01 .control-block,
      .geo-source-panel-j8b_m01 .legend-block,
      .geo-source-panel-j8b_m01 .elevation-key,
      .geo-source-panel-j8b_m01 .model-stats,
      .geo-source-panel-j8b_m01 .fact-grid,
      .geo-source-panel-j8b_m01 .factor-list,
      .geo-source-panel-j8b_m01 .rule-list {
        min-width: 0 !important;
        max-width: 100% !important;
      }
      .geo-source-panel-j8b_m01 .model-stats,
      .geo-source-panel-j8b_m01 .fact-grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 7px !important;
      }
      .geo-source-panel-j8b_m01 .section-title {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        margin: 0 0 6px !important;
        color: #fff7ed !important;
        font-size: 12px !important;
        font-weight: 950 !important;
        line-height: 1.15 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8b_m01 .section-title span {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j8b_m01 .section-title span:last-child {
        flex: 0 1 auto !important;
        color: rgba(250, 204, 21, 0.68) !important;
        font-size: 10px !important;
        font-weight: 900 !important;
      }
      .geo-source-panel-j8b_m01 .quick-control {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 8px !important;
      }
      .geo-source-panel-j8b_m01 .quick-control .section-title,
      .geo-source-panel-j8b_m01 .quick-control .floating-actions {
        grid-column: 1 / -1 !important;
      }
      .geo-source-panel-j8b_m01 .quick-control .floating-actions {
        width: 100% !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 6px !important;
      }
      .geo-source-panel-j8b_m01 .sidebar:not(.show-layers) .model-stats,
      .geo-source-panel-j8b_m01 .sidebar:not(.show-layers) .advanced-control,
      .geo-source-panel-j8b_m01 .source-note {
        display: none !important;
      }
      .geo-source-panel-j8b_m01 .geo-source-control,
      .geo-source-panel-j8b_m01 :is(button, .tool-btn, .float-btn, .region-btn, .line-btn, .river-btn, .layer-btn) {
        appearance: none !important;
        width: 100% !important;
        min-width: 0 !important;
        min-height: 40px !important;
        padding: 0 9px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        background: rgba(255, 255, 255, 0.038) !important;
        color: rgba(248, 250, 252, 0.86) !important;
        box-shadow: none !important;
        font-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 30), 12px) !important;
        font-weight: 950 !important;
        line-height: 1 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        touch-action: manipulation !important;
        cursor: pointer !important;
      }
      .geo-source-panel-j8b_m01 .region-btn,
      .geo-source-panel-j8b_m01 .line-btn,
      .geo-source-panel-j8b_m01 .river-btn,
      .geo-source-panel-j8b_m01 .layer-btn {
        display: grid !important;
        grid-template-columns: 24px minmax(0, 1fr) !important;
        align-items: center !important;
        gap: 7px !important;
        min-height: 42px !important;
        text-align: left !important;
      }
      .geo-source-panel-j8b_m01 .region-btn .region-icon {
        width: 24px !important;
        height: 24px !important;
        border-radius: 8px !important;
        display: grid !important;
        place-items: center !important;
        background: var(--region-color) !important;
        color: #071019 !important;
        font-size: 12px !important;
        font-weight: 950 !important;
      }
      .geo-source-panel-j8b_m01 .line-sample,
      .geo-source-panel-j8b_m01 .river-sample,
      .geo-source-panel-j8b_m01 .layer-sample {
        width: 24px !important;
        min-width: 24px !important;
        justify-self: center !important;
      }
      .geo-source-panel-j8b_m01 .region-name,
      .geo-source-panel-j8b_m01 .region-note,
      .geo-source-panel-j8b_m01 .line-btn span,
      .geo-source-panel-j8b_m01 .river-btn span,
      .geo-source-panel-j8b_m01 .layer-btn span {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
      }
      .geo-source-panel-j8b_m01 :is(.region-btn, .river-btn, .layer-btn) .region-note {
        display: none !important;
      }
      .geo-source-panel-j8b_m01 :is(.tool-btn, .float-btn):hover,
      .geo-source-panel-j8b_m01 :is(.region-btn, .line-btn, .river-btn, .layer-btn):hover {
        border-color: rgba(250, 204, 21, 0.38) !important;
        background: rgba(255, 255, 255, 0.06) !important;
        transform: none !important;
      }
      .geo-source-panel-j8b_m01 :is(.active, button.active, .tool-btn.active, .float-btn.active, .region-btn.active, .line-btn.active, .river-btn.active, .layer-btn.active) {
        color: #f8fafc !important;
        border-color: rgba(250, 204, 21, 0.58) !important;
        background: rgba(250, 204, 21, 0.14) !important;
        box-shadow: 0 0 18px rgba(250, 204, 21, 0.1) !important;
      }
      .geo-source-panel-j8b_m01 .stat-pill,
      .geo-source-panel-j8b_m01 .selected-card,
      .geo-source-panel-j8b_m01 .teaching-question,
      .geo-source-panel-j8b_m01 .legend-item,
      .geo-source-panel-j8b_m01 .pattern-card,
      .geo-source-panel-j8b_m01 .fact,
      .geo-source-panel-j8b_m01 .factor-row,
      .geo-source-panel-j8b_m01 .rule-item,
      .geo-source-panel-j8b_m01 .misread-box {
        min-width: 0 !important;
        border-radius: 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.065) !important;
        background: rgba(255, 255, 255, 0.028) !important;
        box-shadow: none !important;
      }
      .geo-source-panel-j8b_m01 .stat-pill {
        padding: 7px !important;
      }
      .geo-source-panel-j8b_m01 .stat-pill span,
      .geo-source-panel-j8b_m01 .stat-pill strong,
      .geo-source-panel-j8b_m01 .fact *,
      .geo-source-panel-j8b_m01 .legend-item,
      .geo-source-panel-j8b_m01 .elevation-ticks span {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        word-break: keep-all !important;
      }
      .geo-source-panel-j8b_m01 .stat-pill strong,
      .geo-source-panel-j8b_m01 .selected-card strong {
        color: #fde68a !important;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", monospace !important;
        font-weight: 950 !important;
      }
      .geo-source-panel-j8b_m01 .selected-card,
      .geo-source-panel-j8b_m01 .teaching-question,
      .geo-source-panel-j8b_m01 .detail-main,
      .geo-source-panel-j8b_m01 .misread-box,
      .geo-source-panel-j8b_m01 .source-note,
      .geo-source-panel-j8b_m01 .pattern-card p {
        color: rgba(226, 232, 240, 0.74) !important;
        font-size: 11px !important;
        line-height: 1.45 !important;
        letter-spacing: 0 !important;
        word-break: keep-all !important;
        overflow-wrap: anywhere !important;
      }
      .geo-source-panel-j8b_m01 .detail-title,
      .geo-source-panel-j8b_m01 .pattern-card h3 {
        margin: 0 !important;
        color: #fff7ed !important;
        font-size: 12px !important;
        font-weight: 950 !important;
        line-height: 1.22 !important;
        letter-spacing: 0 !important;
      }
      .geo-source-panel-j8b_m01 .detail-kicker {
        margin: 0 !important;
        color: rgba(56, 189, 248, 0.72) !important;
        font-size: 10px !important;
        font-weight: 950 !important;
        line-height: 1 !important;
        letter-spacing: 0 !important;
      }
      .geo-source-panel-j8b_m01 .legend {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 6px !important;
      }
      .geo-source-panel-j8b_m01 .legend-swatch {
        flex: 0 0 auto !important;
        width: 10px !important;
        height: 10px !important;
        border-radius: 999px !important;
      }
      .geo-source-panel-j8b_m01 .elevation-ramp {
        height: 10px !important;
        border-radius: 999px !important;
      }
      .geo-source-panel-j8b_m01 .bottom-dock {
        grid-template-columns: 1fr !important;
        gap: 8px !important;
      }
      .geo-source-panel-j8b_m01 .pattern-card {
        min-height: 0 !important;
        padding: 10px !important;
      }
      .geo-source-panel-j8b_m01 .terrain-chip {
        display: block !important;
        color: rgba(226, 232, 240, 0.68) !important;
        font-size: 10.5px !important;
        line-height: 1.35 !important;
        text-align: left !important;
      }
      .geo-source-panel-j8b_m01 input[type="range"] {
        width: 100% !important;
        touch-action: pan-x !important;
      }
      .geo-source-panel-j8b_m01 #cross-section-slot {
        display: grid !important;
        width: 100% !important;
        min-width: 0 !important;
        gap: 8px !important;
      }
      .geo-source-scene-j8b_m01 #cross-section-panel {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      .geo-source-panel-j8b_m01 #cross-section-panel {
        position: relative !important;
        inset: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        left: auto !important;
        transform: none !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        height: 136px !important;
        min-height: 126px !important;
        margin: 0 !important;
        padding: 9px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(56, 189, 248, 0.28) !important;
        background: rgba(8, 13, 22, 0.62) !important;
        box-shadow: none !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        overflow: hidden !important;
        pointer-events: auto !important;
        z-index: auto !important;
      }
      .geo-source-panel-j8b_m01 #cross-section-panel.show {
        display: flex !important;
        opacity: 1 !important;
      }
      .geo-source-panel-j8b_m01 #cross-section-panel:not(.show) {
        display: none !important;
      }
      .geo-source-panel-j8b_m01 #cross-section-panel .cs-header {
        margin: 0 0 5px !important;
        color: #bae6fd !important;
        font-size: 12px !important;
        font-weight: 950 !important;
        line-height: 1.1 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .geo-source-panel-j8b_m01 #cross-section-panel #cs-canvas {
        display: block !important;
        flex: 1 1 auto !important;
        width: 100% !important;
        min-width: 0 !important;
        height: 0 !important;
        min-height: 0 !important;
      }
      .geo-source-panel-j8b_m01 #time-diff-slot {
        display: grid !important;
        width: 100% !important;
        min-width: 0 !important;
      }
      .geo-source-panel-j8b_m01 #time-diff-panel {
        padding: 9px !important;
      }
      .geo-source-panel-j8b_m01 #time-clock {
        margin-bottom: 3px !important;
        font-size: 16px !important;
        line-height: 1.1 !important;
      }
      .geo-source-panel-j8b_m01 #time-note {
        font-size: 11px !important;
        line-height: 1.35 !important;
      }
      @media (max-width: 700px), (max-height: 620px) {
        .geo-source-panel-j8b_m01 {
          padding: 8px !important;
        }
        .geo-source-panel-j8b_m01 .geo-source-workbench {
          gap: 8px !important;
        }
        .geo-source-panel-j8b_m01 .geo-source-panel-card {
          padding: 10px !important;
        }
        .geo-source-panel-j8b_m01 .quick-control .floating-actions {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          gap: 6px !important;
        }
        .geo-source-panel-j8b_m01 .region-list,
        .geo-source-panel-j8b_m01 .boundary-list,
        .geo-source-panel-j8b_m01 .river-list,
        .geo-source-panel-j8b_m01 .layer-list {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .geo-source-panel-j8b_m01 .geo-source-control,
        .geo-source-panel-j8b_m01 :is(button, .tool-btn, .float-btn, .region-btn, .line-btn, .river-btn, .layer-btn) {
          min-height: 36px !important;
          padding-inline: 7px !important;
          font-size: 10px !important;
        }
        .geo-source-scene-j8b_m01 .scene-map-guide {
          max-width: min(260px, calc(100% - 16px)) !important;
          max-height: 52% !important;
        }
        .geo-source-scene-j8b_m01 .scene-map-guide:not([open]) {
          width: 52px !important;
          height: 30px !important;
        }
        .geo-source-scene-j8b_m01 .scene-map-guide[open] {
          width: min(260px, calc(100% - 16px)) !important;
        }
        .geo-source-scene-j8b_m01 .scene-guide-toggle {
          min-width: 52px !important;
          height: 30px !important;
          padding-inline: 10px !important;
          font-size: 11px !important;
        }
        .geo-source-scene-j8b_m01 .scene-guide-body {
          gap: 7px !important;
          padding: 8px !important;
        }
        .geo-source-scene-j8b_m01 .scene-map-guide .legend {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 4px 6px !important;
        }
        .geo-source-scene-j8b_m01 .scene-map-guide .legend-item {
          min-height: 17px !important;
          font-size: 10px !important;
        }
      }
      @media (max-width: 720px), (orientation: portrait) {
        .geo-source-scene-sb1_m06 #level1-split {
          grid-template-columns: 1fr !important;
          grid-template-rows: repeat(2, minmax(0, 1fr)) !important;
        }
        .geo-source-panel-sb1_m06 .segmented-controls,
        .geo-source-panel-sb1_m06 .quiz-options,
        .geo-source-panel-sb1_m06 #bottom-panel {
          grid-template-columns: 1fr !important;
        }
        .geo-source-scene-sb1_m08 .label,
        .geo-source-scene-sb1_m08 .annotation {
          max-width: min(132px, 42vw) !important;
          font-size: 10px !important;
        }
        .geo-source-scene-sb1_m08 .pressure-label[data-pressure-type="isobar"] {
          display: none !important;
        }
        .geo-source-scene-sb1_m08 .pressure-label[data-pressure-type="center"] {
          font-size: 20px !important;
          opacity: 0.72 !important;
        }
        .geo-source-panel-sb1_m08 .btn-row {
          grid-template-columns: 1fr !important;
        }
        .geo-source-panel-sb1_m08 .meteorology-chart-head {
          grid-template-columns: 1fr !important;
          gap: 3px !important;
        }
        .geo-source-panel-sb1_m08 #chart-type {
          white-space: normal !important;
        }
      }
      .${panelClass} .geo-source-panel-card {
        padding: clamp(13px, 1.9vh, 16px) !important;
        margin: 0 !important;
        border-radius: 8px !important;
      }
      .${panelClass} .geo-source-panel-shell {
        padding: 0 !important;
        border-color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .${panelClass} .geo-source-hidden-exit {
        display: none !important;
      }
      .${panelClass} .geo-source-exit-hidden-parent {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
      }
      .${panelClass} :is(
        h1,
        h2,
        .panel-title,
        .deck-title,
        .chart-title,
        .info-title
      ) {
        max-width: 100% !important;
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
        letter-spacing: 0 !important;
        line-height: 1.16 !important;
      }
      .${panelClass} .geo-source-control,
      .${panelClass} :is(
        button,
        select,
        [role="button"],
        .btn,
        .mode-btn,
        .tool-btn,
        .toggle-btn,
        .float-btn,
        .step-btn,
        .view-btn,
        .region-btn,
        .line-btn,
        .river-btn,
        .layer-btn,
        .level-btn,
        .seg-btn,
        .action-btn,
        .quiz-opt-btn,
        .tab-btn,
        .control-chip
      ) {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        min-width: 0 !important;
        width: 100% !important;
        min-height: max(34px, min(var(--bio-touch-target, 40px), 42px)) !important;
        padding: 0 10px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
        line-height: 1 !important;
        font-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 31), 12px) !important;
        letter-spacing: 0 !important;
      }
      .${panelClass} .geo-source-control > *,
      .${panelClass} :is(
        button,
        select,
        [role="button"],
        .btn,
        .mode-btn,
        .tool-btn,
        .toggle-btn,
        .float-btn,
        .step-btn,
        .view-btn,
        .region-btn,
        .line-btn,
        .river-btn,
        .layer-btn,
        .level-btn,
        .seg-btn,
        .action-btn,
        .quiz-opt-btn,
        .tab-btn,
        .control-chip
      ) > * {
        max-width: 100% !important;
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
      }
      .${panelClass} .geo-source-long-control {
        grid-column: 1 / -1 !important;
      }
      .${panelClass} .geo-source-extra-long-control {
        grid-column: 1 / -1 !important;
        font-size: clamp(9px, calc(var(--bio-scene-panel-width, 320px) / 36), 10.5px) !important;
        padding-inline: 8px !important;
      }
      .geo-source-panel-sb1m11 .mode-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .geo-source-panel-sb1m11 .mode-grid .geo-source-long-control,
      .geo-source-panel-sb1m11 .mode-grid .geo-source-extra-long-control {
        grid-column: auto !important;
        font-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 31), 12px) !important;
        padding-inline: 8px !important;
      }
      /* sb1m11: remove the platform workbench shell; keep only source cards. */
      .geo-source-panel.geo-source-panel-sb1m11 {
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel.geo-source-panel-sb1m11 > .geo-source-workbench {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .geo-source-panel.geo-source-panel-sb1m11 #panel .panel-scroll {
        padding: 8px 0 12px !important;
      }
      @media (max-width: 700px) {
        .geo-source-panel-sb1m11 .mode-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .geo-source-panel-sb1m11 .mode-btn {
          min-height: 44px !important;
          padding-inline: 9px !important;
        }
        .geo-source-panel-sb1m11 .mode-btn span {
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: normal !important;
          line-height: 1.25 !important;
        }
        .geo-source-panel.geo-source-panel-sb1m11 #panel .panel-scroll {
          padding: 8px 0 12px !important;
        }
      }
      .geo-source-panel-j7a_m09 .btn-group {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .geo-source-panel-j7a_m09 .btn-group .geo-source-long-control,
      .geo-source-panel-j7a_m09 .btn-group .geo-source-extra-long-control {
        grid-column: auto !important;
        font-size: 10px !important;
        padding-inline: 6px !important;
      }
      .geo-source-panel-j7a_m09 .btn-play.geo-source-long-control,
      .geo-source-panel-j7a_m09 .btn-play.geo-source-extra-long-control {
        grid-column: 1 / -1 !important;
      }
      .${panelClass} #chart-type {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .${panelClass} #status-hud {
        padding: 8px 10px !important;
        gap: 6px 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        background: rgba(8, 13, 28, 0.66) !important;
      }
      .${panelClass} #status-hud :is(.legend-item, .status-item) {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
      }
      .${panelClass} :is(
        .tabs,
        .segmented,
        .segmented-controls,
        .btn-group,
        .btn-row,
        .mode-list,
        .dock,
        .floating-actions,
        .view-list,
        .toolbar,
        .region-list,
        .boundary-list,
        .river-list,
        .layer-list,
        .bottom-dock,
        .chip-grid,
        .chip-row
      ) {
        gap: 8px !important;
        align-items: stretch !important;
      }
      .${panelClass} :is(
        .panel-kicker,
        .kicker,
        .focus-question,
        .lesson-panel,
        .conclusion,
        .data-source,
        .info-text,
        .info-section,
        .mode-note,
        .region-note,
        .step-note,
        .detail-main,
        .selected-card
      ) {
        letter-spacing: 0 !important;
        word-break: keep-all !important;
        overflow-wrap: anywhere !important;
      }
      .geo-source-panel-j7a_m09 #top-panel .btn-group {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .geo-source-panel-j7a_m09 #top-panel .btn-group .btn {
        grid-column: auto !important;
        min-width: 0 !important;
        width: 100% !important;
        padding-inline: 6px !important;
        font-size: 10px !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-j7a_m09 #top-panel .btn-play {
        grid-column: 1 / -1 !important;
      }
      .geo-source-panel-j8b_m01 .region-list {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
      }
      .geo-source-panel-j8b_m01 .region-list .region-btn {
        grid-column: auto !important;
        display: grid !important;
        grid-template-columns: 24px minmax(0, 1fr) !important;
        min-height: 38px !important;
        width: 100% !important;
        padding-inline: 7px !important;
        justify-content: stretch !important;
        text-align: left !important;
      }
      .geo-source-panel-j8b_m01 .region-list .region-btn:first-child {
        grid-column: 1 / -1 !important;
      }
      .geo-source-panel-j8b_m01 .region-list .region-btn .region-name {
        font-size: 10.5px !important;
      }
      .geo-source-scene-sx2m14 #app,
      .geo-source-scene-sx2m14 #viewport,
      .geo-source-scene-sx2m14 #canvasWrap {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      /* sx2m14: the platform panel root is a transparent layout host. */
      .geo-source-panel.geo-source-panel-sx2m14 {
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel.geo-source-panel-sx2m14 > .geo-source-workbench {
        display: block !important;
        gap: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx2m14 .geo-source-panel-card,
      .geo-source-panel-sx2m14 .geo-source-panel-shell,
      .geo-source-panel-sx2m14 #panel,
      .geo-source-panel-sx2m14 #panel .panel-scroll {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        min-width: 0 !important;
        min-height: 0 !important;
        max-width: 100% !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sx2m14 #panel .card {
        min-width: 0 !important;
        margin: 0 0 10px !important;
        padding: 12px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.74) !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx2m14 #panel .card-title {
        margin: 0 0 9px !important;
        color: #bae6fd !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        letter-spacing: 0 !important;
      }
      .geo-source-panel-sx2m14 #panel .mode-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .geo-source-panel-sx2m14 #panel :is(.mode-btn, .ring-btn, .flow-btn, .region-btn, .mini-btn) {
        min-width: 0 !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.72) !important;
        color: #e5eef9 !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx2m14 #panel :is(.mode-btn, .ring-btn, .flow-btn, .region-btn).active {
        border-color: rgba(103, 232, 249, 0.58) !important;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.72), rgba(20, 184, 166, 0.48)) !important;
        color: #f8fafc !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx2m14 #panel .mode-btn i {
        flex: 0 0 auto !important;
      }
      .geo-source-panel-sx2m14 #panel .mode-desc,
      .geo-source-panel-sx2m14 #panel .info-card,
      .geo-source-panel-sx2m14 #panel .panel-foot {
        color: #b7c7d9 !important;
        font-size: 11px !important;
        line-height: 1.55 !important;
        letter-spacing: 0 !important;
      }
      .geo-source-panel-sx2m14 #panel .ctl-block {
        display: grid !important;
        gap: 8px !important;
        margin: 0 0 12px !important;
      }
      .geo-source-panel-sx2m14 #panel .ctl-block:last-child {
        margin-bottom: 0 !important;
      }
      .geo-source-panel-sx2m14 #panel :is(.ring-btns, .flow-btns, .region-btns) {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 6px !important;
        margin: 0 !important;
      }
      .geo-source-panel-sx2m14 #panel .switch-row {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) 40px !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 5px 0 !important;
        color: #dbe7f5 !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
      }
      .geo-source-panel-sx2m14 #panel .switch-row > label:first-child {
        min-width: 0 !important;
      }
      .geo-source-panel-sx2m14 #panel .quiz-btn {
        margin: 0 !important;
        border-radius: 8px !important;
        background: linear-gradient(135deg, #38bdf8, #2dd4bf) !important;
        color: #082f49 !important;
        box-shadow: none !important;
      }
      .geo-source-scene-sx3m17 #app,
      .geo-source-scene-sx3m17 #viewport,
      .geo-source-scene-sx3m17 #canvasWrap,
      .geo-source-scene-sx3m17 #canvasWrap canvas {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      .geo-source-scene-sx3m17 #app {
        display: block !important;
      }
      .geo-source-scene-sx3m17 #viewport {
        flex: none !important;
      }
      /* sx3m17: the platform panel root is only a layout host.  Keep the
         source cards, but never leave a second dark workbench around them. */
      .geo-source-panel.geo-source-panel-sx3m17 {
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel.geo-source-panel-sx3m17 > .geo-source-workbench {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx3m17 .geo-source-panel-card,
      .geo-source-panel-sx3m17 .geo-source-panel-shell,
      .geo-source-panel-sx3m17 #panel,
      .geo-source-panel-sx3m17 #panel .panel-scroll {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        min-width: 0 !important;
        min-height: 0 !important;
        max-width: 100% !important;
        overflow: visible !important;
        margin: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel.geo-source-panel-sx3m17 #panel .panel-scroll {
        padding: 8px 0 12px !important;
      }
      .geo-source-panel-sx3m17 #panel .card {
        min-width: 0 !important;
        margin: 0 0 10px !important;
        padding: 12px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 10px !important;
        background: rgba(15, 23, 42, 0.74) !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx3m17 #panel .mode-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .geo-source-panel-sx3m17 #panel .mode-btn {
        min-height: 44px !important;
        padding-inline: 8px !important;
      }
      .geo-source-panel-sx3m17 #panel .mode-btn span {
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }
      /* Four imported full-page lessons reserve a right sidebar in their
         original layout. The platform already supplies that sidebar, so the
         simulation must occupy the complete left frame and its controls must
         become one clean, scrollable native panel. */
      .geo-source-scene-sx2_m01 #stage,
      .geo-source-scene-sx3m14 #stage,
      .geo-source-scene-sx3m15 #stage,
      .geo-source-scene-sx2_m01 #scene-canvas,
      .geo-source-scene-sx3m14 #scene-canvas,
      .geo-source-scene-sx3m15 #scene-canvas {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      .geo-source-scene-sx2_m01 #stage,
      .geo-source-scene-sx3m14 #stage,
      .geo-source-scene-sx3m15 #stage {
        overflow: hidden !important;
      }
      .geo-source-scene-sx2_m01 #toolbar,
      .geo-source-scene-sx3m14 #toolbar,
      .geo-source-scene-sx3m15 #toolbar,
      .geo-source-scene-sx2_m01 #hud-title,
      .geo-source-scene-sx3m14 #hud-title,
      .geo-source-scene-sx3m15 #hud-title,
      .geo-source-scene-sx2_m01 #hud-hint,
      .geo-source-scene-sx3m14 #hud-hint,
      .geo-source-scene-sx3m15 #hud-hint,
      .geo-source-scene-sx1m11 .ovTitle {
        display: none !important;
      }
      .geo-source-scene-sx1m11 #stage {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .geo-source-panel.geo-source-panel-sx2_m01,
      .geo-source-panel.geo-source-panel-sx3m14,
      .geo-source-panel.geo-source-panel-sx3m15,
      .geo-source-panel.geo-source-panel-sx1m11,
      .geo-source-panel.geo-source-panel-sx2_m01 > .geo-source-workbench,
      .geo-source-panel.geo-source-panel-sx3m14 > .geo-source-workbench,
      .geo-source-panel.geo-source-panel-sx3m15 > .geo-source-workbench,
      .geo-source-panel.geo-source-panel-sx1m11 > .geo-source-workbench,
      .geo-source-panel-sx2_m01 .geo-source-panel-card,
      .geo-source-panel-sx3m14 .geo-source-panel-card,
      .geo-source-panel-sx3m15 .geo-source-panel-card,
      .geo-source-panel-sx1m11 .geo-source-panel-card,
      .geo-source-panel-sx2_m01 .geo-source-panel-shell,
      .geo-source-panel-sx3m14 .geo-source-panel-shell,
      .geo-source-panel-sx3m15 .geo-source-panel-shell,
      .geo-source-panel-sx1m11 .geo-source-panel-shell {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sx2_m01 #panel,
      .geo-source-panel-sx3m14 #panel,
      .geo-source-panel-sx3m15 #panel,
      .geo-source-panel-sx1m11 #panel {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        min-width: 0 !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        position: relative !important;
        inset: auto !important;
        overflow: visible !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sx2_m01 #panel .p-banner,
      .geo-source-panel-sx3m14 #panel .p-banner,
      .geo-source-panel-sx3m15 #panel .p-banner {
        display: none !important;
      }
      .geo-source-panel-sx2_m01 #panel .tabs,
      .geo-source-panel-sx3m14 #panel .tabs,
      .geo-source-panel-sx3m15 #panel .tabs {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 6px !important;
        padding: 0 0 10px !important;
      }
      .geo-source-panel-sx2_m01 #panel .tab,
      .geo-source-panel-sx3m14 #panel .tab,
      .geo-source-panel-sx3m15 #panel .tab {
        min-width: 0 !important;
        padding: 7px 3px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 9px !important;
        background: rgba(15, 23, 42, 0.62) !important;
        color: #aebed0 !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
      }
      .geo-source-panel-sx2_m01 #panel .tab.active,
      .geo-source-panel-sx3m14 #panel .tab.active,
      .geo-source-panel-sx3m15 #panel .tab.active {
        color: #e2f8ff !important;
        border-color: rgba(94, 234, 212, 0.62) !important;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.24), rgba(20, 184, 166, 0.18)) !important;
      }
      .geo-source-panel-sx2_m01 #panel .tab .ico,
      .geo-source-panel-sx3m14 #panel .tab .ico,
      .geo-source-panel-sx3m15 #panel .tab .ico {
        font-size: 14px !important;
        margin-bottom: 1px !important;
      }
      .geo-source-panel-sx2_m01 #panel .pages,
      .geo-source-panel-sx3m14 #panel .pages,
      .geo-source-panel-sx3m15 #panel .pages {
        flex: 0 0 auto !important;
        overflow: visible !important;
        padding: 0 0 14px !important;
      }
      .geo-source-panel-sx2_m01 #panel .card,
      .geo-source-panel-sx3m14 #panel .card,
      .geo-source-panel-sx3m15 #panel .card,
      .geo-source-panel-sx1m11 #panel .card {
        min-width: 0 !important;
        margin: 0 0 9px !important;
        padding: 11px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 10px !important;
        background: rgba(15, 23, 42, 0.66) !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx2_m01 #panel .tip-box,
      .geo-source-panel-sx3m14 #panel .tip-box,
      .geo-source-panel-sx3m15 #panel .tip-box {
        margin: 0 0 9px !important;
        padding: 9px 10px !important;
        border-radius: 9px !important;
        font-size: 12px !important;
        line-height: 1.48 !important;
      }
      .geo-source-panel-sx2_m01 #panel :is(.kpi-row, .tog-grid),
      .geo-source-panel-sx3m14 #panel :is(.kpi-row, .tog-grid),
      .geo-source-panel-sx3m15 #panel :is(.kpi-row, .tog-grid) {
        gap: 6px !important;
      }
      .geo-source-panel-sx1m11 #panel {
        gap: 0 !important;
      }
      .geo-source-panel-sx1m11 #panel .card h3 {
        margin-bottom: 8px !important;
        letter-spacing: 1px !important;
      }
      .geo-source-panel-sx1m11 #panel .pills,
      .geo-source-panel-sx1m11 #panel .togs {
        gap: 6px !important;
      }
      .geo-source-panel-sx2_m01 :is(.geo-lesson-focus, .geo-lesson-disclosure),
      .geo-source-panel-sx3m14 :is(.geo-lesson-focus, .geo-lesson-disclosure),
      .geo-source-panel-sx3m15 :is(.geo-lesson-focus, .geo-lesson-disclosure),
      .geo-source-panel-sx1m11 :is(.geo-lesson-focus, .geo-lesson-disclosure) {
        display: block !important;
        min-width: 0 !important;
        margin: 0 0 9px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 10px !important;
        background: rgba(15, 23, 42, 0.66) !important;
        overflow: hidden !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-focus,
      .geo-source-panel-sx3m14 .geo-lesson-focus,
      .geo-source-panel-sx3m15 .geo-lesson-focus,
      .geo-source-panel-sx1m11 .geo-lesson-focus {
        padding: 10px 11px !important;
        border-left: 3px solid rgba(94, 234, 212, 0.78) !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-focus strong,
      .geo-source-panel-sx3m14 .geo-lesson-focus strong,
      .geo-source-panel-sx3m15 .geo-lesson-focus strong,
      .geo-source-panel-sx1m11 .geo-lesson-focus strong {
        display: block !important;
        color: #d9fbff !important;
        font-size: 12px !important;
        line-height: 1.25 !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-focus p,
      .geo-source-panel-sx3m14 .geo-lesson-focus p,
      .geo-source-panel-sx3m15 .geo-lesson-focus p,
      .geo-source-panel-sx1m11 .geo-lesson-focus p {
        margin: 5px 0 0 !important;
        color: rgba(226, 232, 240, 0.82) !important;
        font-size: 11px !important;
        line-height: 1.48 !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-disclosure > summary,
      .geo-source-panel-sx3m14 .geo-lesson-disclosure > summary,
      .geo-source-panel-sx3m15 .geo-lesson-disclosure > summary,
      .geo-source-panel-sx1m11 .geo-lesson-disclosure > summary {
        display: flex !important;
        align-items: center !important;
        min-height: 38px !important;
        padding: 9px 11px !important;
        color: #dbeafe !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        line-height: 1.28 !important;
        cursor: pointer !important;
        list-style: none !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-disclosure > summary::-webkit-details-marker,
      .geo-source-panel-sx3m14 .geo-lesson-disclosure > summary::-webkit-details-marker,
      .geo-source-panel-sx3m15 .geo-lesson-disclosure > summary::-webkit-details-marker,
      .geo-source-panel-sx1m11 .geo-lesson-disclosure > summary::-webkit-details-marker {
        display: none !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-disclosure > summary::after,
      .geo-source-panel-sx3m14 .geo-lesson-disclosure > summary::after,
      .geo-source-panel-sx3m15 .geo-lesson-disclosure > summary::after,
      .geo-source-panel-sx1m11 .geo-lesson-disclosure > summary::after {
        content: '⌄' !important;
        margin-left: auto !important;
        color: #67e8f9 !important;
        font-size: 15px !important;
        transition: transform .18s ease !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-disclosure[open] > summary,
      .geo-source-panel-sx3m14 .geo-lesson-disclosure[open] > summary,
      .geo-source-panel-sx3m15 .geo-lesson-disclosure[open] > summary,
      .geo-source-panel-sx1m11 .geo-lesson-disclosure[open] > summary {
        border-bottom: 1px solid rgba(148, 163, 184, 0.14) !important;
        background: rgba(30, 41, 59, 0.42) !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-disclosure[open] > summary::after,
      .geo-source-panel-sx3m14 .geo-lesson-disclosure[open] > summary::after,
      .geo-source-panel-sx3m15 .geo-lesson-disclosure[open] > summary::after,
      .geo-source-panel-sx1m11 .geo-lesson-disclosure[open] > summary::after {
        transform: rotate(180deg) !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-disclosure > :not(summary),
      .geo-source-panel-sx3m14 .geo-lesson-disclosure > :not(summary),
      .geo-source-panel-sx3m15 .geo-lesson-disclosure > :not(summary),
      .geo-source-panel-sx1m11 .geo-lesson-disclosure > :not(summary) {
        margin-left: 10px !important;
        margin-right: 10px !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-preset-row,
      .geo-source-panel-sx3m14 .geo-lesson-preset-row,
      .geo-source-panel-sx3m15 .geo-lesson-preset-row {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 6px !important;
        margin: 0 0 9px !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-preset,
      .geo-source-panel-sx3m14 .geo-lesson-preset,
      .geo-source-panel-sx3m15 .geo-lesson-preset {
        min-height: 40px !important;
        padding: 7px 5px !important;
        border-radius: 9px !important;
        color: #cbd5e1 !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        background: rgba(15, 23, 42, 0.66) !important;
        font-size: 11px !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx2_m01 .geo-lesson-preset.active,
      .geo-source-panel-sx3m14 .geo-lesson-preset.active,
      .geo-source-panel-sx3m15 .geo-lesson-preset.active {
        color: #effdff !important;
        border-color: rgba(94, 234, 212, 0.64) !important;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.3), rgba(20, 184, 166, 0.22)) !important;
      }
      .geo-source-panel-sx3m14 .carbon-chart #chart-canvas {
        height: 150px !important;
        margin: 0 0 8px !important;
      }
      .geo-source-panel-sx1m11 .geo-lesson-disclosure > .card {
        margin-top: 9px !important;
      }
      /* sb1_m04 / sb1m12: both sources were authored as full-width desktop
         workbenches. Keep their evolving Canvas and timeline on the left;
         release the source sidebar into the platform panel without a second
         dark shell. */
      .geo-source-scene-sb1_m04 #stage,
      .geo-source-scene-sb1m12 #stage,
      .geo-source-scene-sb1_m04 #cv,
      .geo-source-scene-sb1m12 #cv {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      .geo-source-scene-sb1_m04 #stage,
      .geo-source-scene-sb1m12 #stage {
        overflow: hidden !important;
      }
      .geo-source-scene-sb1_m04 .ovTitle,
      .geo-source-scene-sb1_m04 #badges,
      .geo-source-scene-sb1m12 .ovTitle {
        display: none !important;
      }
      .geo-source-panel.geo-source-panel-sb1_m04,
      .geo-source-panel.geo-source-panel-sb1m12,
      .geo-source-panel.geo-source-panel-sb1_m04 > .geo-source-workbench,
      .geo-source-panel.geo-source-panel-sb1m12 > .geo-source-workbench,
      .geo-source-panel-sb1_m04 .geo-source-panel-card,
      .geo-source-panel-sb1m12 .geo-source-panel-card,
      .geo-source-panel-sb1_m04 .geo-source-panel-shell,
      .geo-source-panel-sb1m12 .geo-source-panel-shell {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sb1_m04 #panel,
      .geo-source-panel-sb1m12 #panel {
        position: relative !important;
        inset: auto !important;
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        min-width: 0 !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sb1_m04 #panel .card,
      .geo-source-panel-sb1m12 #panel .card {
        min-width: 0 !important;
        margin: 0 0 9px !important;
        padding: 11px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 10px !important;
        background: rgba(15, 23, 42, 0.66) !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sb1m12 #viewPills {
        position: relative !important;
        inset: auto !important;
        left: auto !important;
        top: auto !important;
        transform: none !important;
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
        width: 100% !important;
        margin: 0 0 9px !important;
        padding: 0 !important;
      }
      .geo-source-panel-sb1m12 #viewPills .vp {
        min-width: 0 !important;
        min-height: 38px !important;
        padding: 8px 6px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
      }
      @media (max-width: 720px), (orientation: portrait) {
        .geo-source-scene-sb1_m04 #badges,
        .geo-source-scene-sb1m12 #eraBig,
        .geo-source-scene-sb1m12 #flash {
          display: none !important;
        }
      }
      @media (max-width: 720px), (orientation: portrait) {
        .geo-source-scene-sx2_m01 .hud,
        .geo-source-scene-sx3m14 .hud,
        .geo-source-scene-sx3m15 .hud,
        .geo-source-scene-sx1m11 #badgeTerm,
        .geo-source-scene-sx1m11 #chips {
          display: none !important;
        }
      }
      /* sx3m16: the imported ecology island was authored as a full-page app
         with a 410px sidebar. The platform owns the panel, so release the
         scene from that width reservation and keep the live 3D island centred. */
      .geo-source-scene-sx3m16 #stage,
      .geo-source-scene-sx3m16 #scene-canvas {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      .geo-source-scene-sx3m16 #stage {
        overflow: hidden !important;
      }
      .geo-source-scene-sx3m16 #scene-canvas {
        cursor: grab !important;
      }
      .geo-source-scene-sx3m16 #scene-canvas:active {
        cursor: grabbing !important;
      }
      .geo-source-scene-sx3m16 #hud-title {
        display: none !important;
      }
      .geo-source-scene-sx3m16 :is(#hud-stat .num, .gauge-num) {
        text-shadow: none !important;
      }
      /* Keep feedback generated by the simulation, but do not leave a second
         dark shell around the migrated controls. */
      .geo-source-panel.geo-source-panel-sx3m16,
      .geo-source-panel.geo-source-panel-sx3m16 > .geo-source-workbench,
      .geo-source-panel-sx3m16 .geo-source-panel-card,
      .geo-source-panel-sx3m16 .geo-source-panel-shell {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sx3m16 #panel {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        min-width: 0 !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 0 10px !important;
        padding: 0 !important;
        position: relative !important;
        inset: auto !important;
        overflow: visible !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sx3m16 #panel .p-banner {
        display: none !important;
      }
      .geo-source-panel-sx3m16 #panel .tabs {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 6px !important;
        padding: 0 0 10px !important;
      }
      .geo-source-panel-sx3m16 #panel .tab {
        min-width: 0 !important;
        padding: 7px 3px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 9px !important;
        background: rgba(15, 23, 42, 0.62) !important;
        color: #aebed0 !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
      }
      .geo-source-panel-sx3m16 #panel .tab.active {
        border-color: rgba(94, 234, 212, 0.62) !important;
        background: rgba(13, 148, 136, 0.18) !important;
        color: #99f6e4 !important;
      }
      .geo-source-panel-sx3m16 #panel .tab .ico {
        margin-bottom: 1px !important;
        font-size: 14px !important;
      }
      .geo-source-panel-sx3m16 #panel .dimension-grid .geo-source-long-control,
      .geo-source-panel-sx3m16 #panel .dimension-grid .geo-source-extra-long-control {
        grid-column: auto !important;
      }
      .geo-source-panel-sx3m16 #panel .scenario-grid .geo-source-long-control,
      .geo-source-panel-sx3m16 #panel .scenario-grid .geo-source-extra-long-control {
        grid-column: auto !important;
      }
      .geo-source-panel-sx3m16 #panel .scenario-grid .scenario-btn {
        display: block !important;
        min-height: 56px !important;
        padding: 7px 4px !important;
        overflow: visible !important;
        white-space: normal !important;
      }
      .geo-source-panel-sx3m16 #panel .scenario-grid .scenario-btn > strong,
      .geo-source-panel-sx3m16 #panel .scenario-grid .scenario-btn > small {
        display: block !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }
      .geo-source-panel-sx3m16 #panel .scenario-grid .scenario-btn > strong {
        font-size: 10.5px !important;
      }
      .geo-source-panel-sx3m16 #panel .scenario-grid .scenario-btn > small {
        margin-top: 3px !important;
        font-size: 8.5px !important;
      }
      .geo-source-panel-sx3m16 #panel .metric-row {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 6px !important;
      }
      .geo-source-panel-sx3m16 #panel .metric-row .metric-chip,
      .geo-source-panel-sx3m16 #panel .metric-row .geo-source-long-control,
      .geo-source-panel-sx3m16 #panel .metric-row .geo-source-extra-long-control {
        grid-column: auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 2px !important;
        min-height: 34px !important;
        padding: 5px 6px !important;
      }
      .geo-source-panel-sx3m16 #panel .metric-row .metric-chip > span {
        min-width: 0 !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
        font-size: 9px !important;
      }
      .geo-source-panel-sx3m16 #panel .metric-row .metric-chip > b {
        display: block !important;
        min-width: 0 !important;
        margin-left: auto !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
        font-size: 14px !important;
      }
      .geo-source-panel-sx3m16 #panel .pages {
        display: block !important;
        flex: none !important;
        overflow: visible !important;
        padding: 0 !important;
      }
      .geo-source-panel-sx3m16 #panel .card {
        min-width: 0 !important;
        margin: 0 0 10px !important;
        padding: 12px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 10px !important;
        background: rgba(15, 23, 42, 0.74) !important;
        box-shadow: none !important;
      }
      .geo-source-panel-sx3m16 #panel .gauge-num {
        text-shadow: none !important;
      }
      .geo-source-panel-sx3m16 #toolbar2,
      .geo-source-panel-sx3m16 #toolbar {
        position: relative !important;
        inset: auto !important;
        left: auto !important;
        bottom: auto !important;
        transform: none !important;
        width: 100% !important;
        margin: 0 0 10px !important;
        padding: 10px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 10px !important;
        background: rgba(15, 23, 42, 0.74) !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .geo-source-panel-sx3m16 #toolbar2 {
        display: grid !important;
        grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
        align-items: center !important;
        gap: 7px !important;
      }
      .geo-source-panel-sx3m16 #toolbar2 .tb2-label {
        display: grid !important;
        place-items: center !important;
        min-height: 34px !important;
      }
      .geo-source-panel-sx3m16 #toolbar2 .tb2-sep {
        display: none !important;
      }
      .geo-source-panel-sx3m16 #toolbar2 input[type="range"] {
        grid-column: span 5 !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
      }
      .geo-source-panel-sx3m16 #toolbar2 button {
        display: grid !important;
        place-items: center !important;
        width: 100% !important;
        min-width: 0 !important;
        height: 38px !important;
        min-height: 38px !important;
        padding: 0 !important;
        color: #e5eef9 !important;
      }
      .geo-source-panel-sx3m16 #toolbar {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
      }
      .geo-source-panel-sx3m16 #toolbar button {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 40px !important;
        padding: 8px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        white-space: normal !important;
      }
      /* 这组来源页的场景玩具不服务本节的干扰—保护—论证主线，
         不应挤占学生的学习操作面板。 */
      .geo-source-panel-sx3m16 #toolbar2,
      .geo-source-panel-sx3m16 #toolbar {
        display: none !important;
      }
      body.touring .geo-source-scene-sx3m16 .cine {
        height: 46px !important;
      }
      @media (max-width: 700px) {
        .geo-source-scene-sb1m11 .hud {
          display: none !important;
        }
        .geo-source-panel-sb1m11 #panel .mode-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .geo-source-panel-sb1m11 #panel .mode-btn {
          min-height: 44px !important;
          padding-inline: 9px !important;
        }
        .geo-source-panel-sb1m11 #panel .mode-btn span {
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: nowrap !important;
        }
        .geo-source-scene-sx2m14 :is(.hud, #splitHud, #commuteCap) {
          display: none !important;
        }
        .geo-source-panel-sx2m14 #panel .mode-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .geo-source-panel-sx2m14 #panel .mode-btn {
          min-height: 44px !important;
          padding-inline: 8px !important;
        }
        .geo-source-scene-sx3m17 :is(#legend, #hint, #sceneCap) {
          display: none !important;
        }
        .geo-source-panel.geo-source-panel-sx3m17 #panel .panel-scroll {
          padding: 8px 0 12px !important;
        }
        .geo-source-scene-sx3m16 .hud {
          display: none !important;
        }
        .geo-source-scene-sx3m16 #infoCard {
          left: 12px !important;
          bottom: 12px !important;
          width: min(320px, calc(100% - 24px)) !important;
          max-width: calc(100% - 24px) !important;
        }
        .geo-source-scene-sx3m16 #caption {
          bottom: 28px !important;
          max-width: calc(100% - 32px) !important;
        }
        .geo-source-scene-sx3m16 #caption .cp-title {
          font-size: 19px !important;
        }
        .geo-source-panel-sx3m16 #panel .tabs {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }
      }
    `;
  }

  function makeArrayNodeList(items) {
    const list = Array.from(items);
    list.item = index => list[index] || null;
    return list;
  }

  function createLifecycleEvent(type, target) {
    const event = new Event(type);
    try {
      Object.defineProperty(event, 'target', { value: target, configurable: true });
      Object.defineProperty(event, 'currentTarget', { value: target, configurable: true });
    } catch (error) {}
    return event;
  }

  function createScopedDocument(instance, sceneRoot, panelRoot) {
    const roots = [sceneRoot, panelRoot].filter(Boolean);
    const findById = id => {
      for (const root of roots) {
        const found = root.querySelector(`#${cssEscape(id)}`);
        if (found) return found;
      }
      return null;
    };

    return {
      get body() { return sceneRoot; },
      get head() { return document.head; },
      get documentElement() { return sceneRoot; },
      createElement: document.createElement.bind(document),
      createElementNS: document.createElementNS.bind(document),
      createTextNode: document.createTextNode.bind(document),
      getElementById: findById,
      querySelector(selector) {
        for (const root of roots) {
          try {
            const found = root.querySelector(selector);
            if (found) return found;
          } catch (error) {
            return null;
          }
        }
        return null;
      },
      querySelectorAll(selector) {
        const results = [];
        for (const root of roots) {
          try {
            results.push(...root.querySelectorAll(selector));
          } catch (error) {}
        }
        return makeArrayNodeList(results);
      },
      addEventListener(type, listener, options) {
        if (type === 'load' || type === 'DOMContentLoaded') {
          const id = window.setTimeout(() => {
            instance.timeoutIds.delete(id);
            if (!instance.cancelled && typeof listener === 'function') {
              listener.call(this, createLifecycleEvent(type, this));
            }
          }, 0);
          instance.timeoutIds.add(id);
          return;
        }
        sceneRoot.addEventListener(type, listener, options);
      },
      removeEventListener(type, listener, options) {
        sceneRoot.removeEventListener(type, listener, options);
      }
    };
  }

  async function loadDataGlobals(config, baseUrl) {
    const entries = Object.entries(config?.dataGlobals || {});
    if (!entries.length) return {};
    const output = {};
    for (const [name, relativePath] of entries) {
      if (!name || !relativePath) continue;
      const url = resolveResourceUrl(baseUrl, relativePath);
      const response = await fetch(appendRuntimeVersion(url), { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load local source data: ' + relativePath);
      output[name] = await response.json();
    }
    return output;
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function createLocalThree(baseUrl) {
    if (!window.THREE) return window.THREE;
    const localThree = Object.create(window.THREE);
    const NativeTextureLoader = window.THREE.TextureLoader;
    localThree.TextureLoader = function LocalTextureLoader(manager) {
      const loader = new NativeTextureLoader(manager);
      const nativeLoad = loader.load.bind(loader);
      loader.load = (url, onLoad, onProgress, onError) => (
        nativeLoad(resolveOptimizedResourceUrl(baseUrl, url), onLoad, onProgress, onError)
      );
      return loader;
    };
    localThree.TextureLoader.prototype = NativeTextureLoader.prototype;
    return localThree;
  }

  function createLocalImage(baseUrl) {
    const NativeImage = window.Image;
    const prototype = window.HTMLImageElement?.prototype || NativeImage?.prototype;
    const srcDescriptor = prototype && Object.getOwnPropertyDescriptor(prototype, 'src');
    if (typeof NativeImage !== 'function' || !srcDescriptor?.get || !srcDescriptor?.set) return NativeImage;

    function LocalImage(...args) {
      const image = new NativeImage(...args);
      let requestVersion = 0;
      Object.defineProperty(image, 'src', {
        configurable: true,
        enumerable: true,
        get() {
          return srcDescriptor.get.call(image);
        },
        set(value) {
          const version = ++requestVersion;
          const resolved = resolveOptimizedResourceUrl(baseUrl, value);
          // Imported lessons commonly assign `src` before they attach their
          // final `onload` handler later in the same script. Defer the native
          // request by one microtask so fast local WebP cache hits cannot fire
          // before that teaching scene is ready to observe the load event.
          Promise.resolve().then(() => {
            if (version === requestVersion) srcDescriptor.set.call(image, resolved);
          });
        }
      });
      return image;
    }

    LocalImage.prototype = NativeImage.prototype;
    return LocalImage;
  }

  function createLocalLeaflet(scopedDocument, instance) {
    if (!window.L) return window.L;
    const localLeaflet = Object.create(window.L);
    localLeaflet.map = (target, options) => {
      const resolvedTarget = typeof target === 'string'
        ? (scopedDocument.getElementById(target) || target)
        : target;
      const map = window.L.map(resolvedTarget, options);
      instance?.leafletMaps?.add(map);
      return map;
    };
    if (window.L.Map && typeof window.L.Map.addInitHook === 'function') {
      try {
        window.L.Map.addInitHook(function () {
          if (!this || !this._container) return;
          this._container.classList.add('geo-source-leaflet-map');
        });
      } catch (error) {}
    }
    return localLeaflet;
  }

  function createRuntimeScope(instance, sceneRoot, panelRoot, baseUrl) {
    const scopedDocument = createScopedDocument(instance, sceneRoot, panelRoot);
    const localWindow = Object.create(window);
    const nativeMatchMedia = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;
    const nativeGetComputedStyle = typeof window.getComputedStyle === 'function' ? window.getComputedStyle.bind(window) : null;
    const nativeScrollTo = typeof window.scrollTo === 'function' ? window.scrollTo.bind(window) : null;
    const nativeScrollBy = typeof window.scrollBy === 'function' ? window.scrollBy.bind(window) : null;

    Object.defineProperties(localWindow, {
      innerWidth: { get: () => measureScene(sceneRoot).width },
      innerHeight: { get: () => measureScene(sceneRoot).height },
      document: { get: () => scopedDocument },
      devicePixelRatio: { get: () => window.devicePixelRatio || 1 }
    });

    if (nativeMatchMedia) localWindow.matchMedia = nativeMatchMedia;
    if (nativeGetComputedStyle) localWindow.getComputedStyle = nativeGetComputedStyle;
    if (nativeScrollTo) localWindow.scrollTo = nativeScrollTo;
    if (nativeScrollBy) localWindow.scrollBy = nativeScrollBy;
    localWindow.GEOGRAPHY_VISUAL_SCENES = Object.create(null);
    localWindow.__GEOGRAPHY_SOURCE_BASE_URL__ = baseUrl;
    localWindow.__GEOGRAPHY_SOURCE_ALLOW_AUTOMOUNT__ = false;
    localWindow.resolveGeographySourceAsset = value => resolveResourceUrl(baseUrl, value);

    localWindow.addEventListener = (type, listener, options) => {
      if (type === 'load' || type === 'DOMContentLoaded') {
        const id = localSetTimeout(() => {
          if (!instance.cancelled && typeof listener === 'function') {
            listener.call(localWindow, createLifecycleEvent(type, localWindow));
          }
        }, 0);
        instance.timeoutIds.add(id);
        return;
      }
      if (type === 'resize') {
        const wrapped = event => {
          if (!instance.cancelled) listener.call(localWindow, event);
        };
        instance.resizeListeners.push({ listener, wrapped, options });
        window.addEventListener(type, wrapped, options);
        return;
      }
      sceneRoot.addEventListener(type, listener, options);
    };

    localWindow.removeEventListener = (type, listener, options) => {
      if (type === 'resize') {
        const index = instance.resizeListeners.findIndex(item => item.listener === listener);
        if (index >= 0) {
          const item = instance.resizeListeners.splice(index, 1)[0];
          window.removeEventListener(type, item.wrapped, item.options);
        }
        return;
      }
      sceneRoot.removeEventListener(type, listener, options);
    };

    localWindow.dispatchEvent = event => {
      if (event?.type === 'resize') {
        window.dispatchEvent(event);
        window.visualViewport?.dispatchEvent?.(new Event('resize'));
        return true;
      }
      return sceneRoot.dispatchEvent(event);
    };

    const localFetch = (input, init) => {
      const resolvedInput = typeof input === 'string' || input instanceof URL
        ? resolveResourceUrl(baseUrl, input)
        : input;
      return window.fetch(resolvedInput, init);
    };

    const localRequestAnimationFrame = callback => {
      const id = window.requestAnimationFrame(time => {
        instance.rafIds.delete(id);
        if (!instance.cancelled) callback(time);
      });
      instance.rafIds.add(id);
      return id;
    };

    const localCancelAnimationFrame = id => {
      instance.rafIds.delete(id);
      window.cancelAnimationFrame(id);
    };

    const localSetTimeout = (callback, delay, ...args) => {
      const id = window.setTimeout(() => {
        instance.timeoutIds.delete(id);
        if (!instance.cancelled) callback(...args);
      }, delay);
      instance.timeoutIds.add(id);
      return id;
    };

    const localClearTimeout = id => {
      instance.timeoutIds.delete(id);
      window.clearTimeout(id);
    };

    const localSetInterval = (callback, delay, ...args) => {
      const id = window.setInterval(() => {
        if (!instance.cancelled) callback(...args);
      }, delay);
      instance.intervalIds.add(id);
      return id;
    };

    const localClearInterval = id => {
      instance.intervalIds.delete(id);
      window.clearInterval(id);
    };

    return {
      window: localWindow,
      document: scopedDocument,
      Image: createLocalImage(baseUrl),
      THREE: createLocalThree(baseUrl),
      d3: window.d3,
      topojson: window.topojson,
      L: createLocalLeaflet(scopedDocument, instance),
      fetch: localFetch,
      requestAnimationFrame: localRequestAnimationFrame,
      cancelAnimationFrame: localCancelAnimationFrame,
      setTimeout: localSetTimeout,
      clearTimeout: localClearTimeout,
      setInterval: localSetInterval,
      clearInterval: localClearInterval
    };
  }

  function extractFunctionNames(script) {
    const names = new Set();
    String(script || '').replace(/function\s+([A-Za-z_$][\w$]*)\s*\(/g, (match, name) => {
      names.add(name);
      return match;
    });
    return Array.from(names);
  }

  function exposeInlineHandlers(instance, exports) {
    Object.entries(exports || {}).forEach(([name, fn]) => {
      if (typeof fn !== 'function') return;
      const hadOwn = Object.prototype.hasOwnProperty.call(window, name);
      const previous = window[name];
      instance.globalRestores.push(() => {
        if (hadOwn) window[name] = previous;
        else {
          try { delete window[name]; } catch (error) { window[name] = undefined; }
        }
      });
      window[name] = (...args) => fn(...args);
    });
  }

  function executeSourceScript(instance, script, scope) {
    const functionNames = extractFunctionNames(script);
    const dataGlobals = scope.dataGlobals && typeof scope.dataGlobals === 'object' ? scope.dataGlobals : {};
    const dataNames = Object.keys(dataGlobals).filter(name => /^[A-Za-z_$][\w$]*$/.test(name));
    const returnMap = functionNames
      .map(name => `${JSON.stringify(name)}: typeof ${name} === "function" ? ${name} : undefined`)
      .join(',');
    const runner = new Function(
      'window',
      'document',
      'Image',
      'THREE',
      'd3',
      'topojson',
      'L',
      'fetch',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      ...dataNames,
      `${script}\n;return {${returnMap}};`
    );
    const exports = runner.call(
      scope.window,
      scope.window,
      scope.document,
      scope.Image,
      scope.THREE,
      scope.d3,
      scope.topojson,
      scope.L,
      scope.fetch,
      scope.requestAnimationFrame,
      scope.cancelAnimationFrame,
      scope.setTimeout,
      scope.clearTimeout,
      scope.setInterval,
      scope.clearInterval,
      ...dataNames.map(name => dataGlobals[name])
    );
    const runtimeWindowFunctionNames = new Set([
      'addEventListener',
      'removeEventListener',
      'dispatchEvent',
      'matchMedia',
      'getComputedStyle',
      'scrollTo',
      'scrollBy'
    ]);
    const windowExports = {};
    Object.keys(scope.window || {}).forEach(name => {
      if (runtimeWindowFunctionNames.has(name)) return;
      if (typeof scope.window[name] === 'function') windowExports[name] = scope.window[name];
    });
    exposeInlineHandlers(instance, Object.assign({}, exports, windowExports));
  }

  async function mountRegisteredSourceScene(instance, sceneRoot, context, scope) {
    const localScenes = scope?.window?.GEOGRAPHY_VISUAL_SCENES;
    const localDefinition = localScenes?.[context?.card?.id];
    if (!localDefinition || typeof localDefinition.mount !== 'function') return;

    const sourceContainer = sceneRoot.querySelector('#app-container') || sceneRoot;
    const inlinePanel = sceneRoot.querySelector('#ui-panel');
    if (inlinePanel && context?.externalPanel) {
      inlinePanel.style.setProperty('display', 'none', 'important');
      inlinePanel.setAttribute('aria-hidden', 'true');
    }

    instance.sourceDefinition = localDefinition;
    instance.sourceContainer = sourceContainer;

    const sourceContext = {
      ...context,
      externalPanel: context?.externalPanel || null,
      localWindow: scope.window,
      localDocument: scope.document
    };
    const mountResult = localDefinition.mount(sourceContainer, sourceContext);
    if (mountResult && typeof mountResult.then === 'function') {
      await mountResult;
    }
  }

  function isBundledVendorScript(scriptText) {
    const head = String(scriptText || '').slice(0, 4096);
    return /three\.js\s+r\d+/i.test(head)
      || /THREE\s*=\s*\{\}/.test(head) && /WebGLRenderer|PerspectiveCamera|BufferGeometry/.test(head);
  }

  function parseSourceHtml(html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const styles = Array.from(parsed.querySelectorAll('style')).map(node => node.textContent || '').join('\n');
    const scripts = Array.from(parsed.querySelectorAll('script:not([src])'))
      .map(node => node.textContent || '')
      .filter(scriptText => !isBundledVendorScript(scriptText))
      .join('\n\n');
    parsed.querySelectorAll('script, link[rel="stylesheet"]').forEach(node => node.remove());
    return {
      styles,
      scripts,
      body: parsed.body ? parsed.body.innerHTML : ''
    };
  }

  function resetMovedPanelNode(node) {
    if (!node || node.nodeType !== 1) return;
    node.classList.add('geo-source-panel-node');
    node.style.setProperty('position', 'relative', 'important');
    node.style.setProperty('inset', 'auto', 'important');
    node.style.setProperty('top', 'auto', 'important');
    node.style.setProperty('right', 'auto', 'important');
    node.style.setProperty('bottom', 'auto', 'important');
    node.style.setProperty('left', 'auto', 'important');
    node.style.setProperty('transform', 'none', 'important');
    node.style.setProperty('width', '100%', 'important');
    node.style.setProperty('max-width', '100%', 'important');
    node.style.setProperty('min-width', '0', 'important');
    node.style.setProperty('margin', '0', 'important');
    node.style.setProperty('padding', '0', 'important');
    node.style.setProperty('border', '0', 'important');
    node.style.setProperty('border-radius', '0', 'important');
    node.style.setProperty('background', 'transparent', 'important');
    node.style.setProperty('box-shadow', 'none', 'important');
    node.style.setProperty('backdrop-filter', 'none', 'important');
    node.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    node.style.setProperty('overflow', 'visible', 'important');
  }

  function createPanelWorkbench(panelRoot) {
    const workbench = document.createElement('div');
    workbench.className = 'geo-source-workbench';
    panelRoot.appendChild(workbench);
    return workbench;
  }

  function appendPanelCard(workbench, node) {
    resetMovedPanelNode(node);
    const card = document.createElement('section');
    card.className = 'geo-source-panel-card geo-source-panel-shell';
    card.dataset.sourcePanelCard = String(workbench.children.length + 1);
    card.appendChild(node);
    workbench.appendChild(card);
  }

  function normalizePanelControlLabel(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getPanelControlLabel(control) {
    if (!control) return '';
    if (control.matches?.('input[type="button"], input[type="submit"]')) {
      return normalizePanelControlLabel(control.value || control.getAttribute('aria-label'));
    }
    return normalizePanelControlLabel(control.textContent || control.getAttribute('aria-label') || control.getAttribute('title'));
  }

  function normalizePanelControls(panelRoot) {
    if (!panelRoot?.querySelectorAll) return;
    const controls = panelRoot.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"], .btn, .mode-btn, .tool-btn, .toggle-btn, .float-btn, .step-btn, .view-btn, .region-btn, .line-btn, .river-btn, .layer-btn, .level-btn, .seg-btn, .action-btn, .quiz-opt-btn, .tab-btn, .control-chip');
    controls.forEach(control => {
      if (!control || control.nodeType !== 1) return;
      const label = getPanelControlLabel(control);
      if (!label) return;
      control.classList.add('geo-source-control');
      if (!control.getAttribute('title') && label.length > 1) {
        control.setAttribute('title', label);
      }
      const parentText = normalizePanelControlLabel(control.parentElement?.textContent || '');
      if (label === '退出' || (label === '展示' && parentText.includes('可视化指挥台'))) {
        control.classList.add('geo-source-hidden-exit');
        control.setAttribute('aria-hidden', 'true');
        control.setAttribute('tabindex', '-1');
        control.parentElement?.classList?.add('geo-source-exit-hidden-parent');
        return;
      }
      const compactLabel = label.replace(/\s+/g, '');
      const labelLength = Array.from(compactLabel).length;
      control.dataset.geoControlLength = String(labelLength);
      if (labelLength >= 14) {
        control.classList.add('geo-source-extra-long-control');
      } else {
        control.classList.remove('geo-source-extra-long-control');
      }
      if (labelLength >= 7) {
        control.classList.add('geo-source-long-control');
      } else {
        control.classList.remove('geo-source-long-control');
      }
    });
  }

  function installPanelControlNormalizer(instance, panelRoot) {
    if (!panelRoot?.querySelectorAll) return;
    let frame = null;
    const run = () => {
      const currentFrame = frame;
      frame = null;
      if (currentFrame != null) instance.rafIds.delete(currentFrame);
      if (!instance.cancelled) normalizePanelControls(panelRoot);
    };
    const schedule = () => {
      if (frame != null) return;
      frame = window.requestAnimationFrame(run);
      instance.rafIds.add(frame);
    };
    normalizePanelControls(panelRoot);

    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(schedule);
    observer.observe(panelRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-label', 'title', 'value']
    });
    instance.globalRestores.push(() => {
      observer.disconnect();
      if (frame != null) {
        window.cancelAnimationFrame(frame);
        instance.rafIds.delete(frame);
      }
    });
  }

  function installJ8bCrossSectionPanelBridge(instance, sceneRoot, panelRoot, cardId) {
    if (cardId !== 'j8b_m01' || !sceneRoot || !panelRoot?.querySelector) return;

    const ensureSlot = () => {
      let slot = panelRoot.querySelector('#cross-section-slot');
      if (slot) return slot;

      slot = document.createElement('div');
      slot.id = 'cross-section-slot';
      slot.className = 'cross-section-slot';

      const teachingQuestion = panelRoot.querySelector('#teaching-question');
      if (teachingQuestion?.parentElement) {
        teachingQuestion.insertAdjacentElement('afterend', slot);
        return slot;
      }

      const selectedCard = panelRoot.querySelector('#selected-card');
      if (selectedCard?.parentElement) {
        selectedCard.insertAdjacentElement('beforebegin', slot);
        return slot;
      }

      const host = panelRoot.querySelector('.sidebar')
        || panelRoot.querySelector('.geo-source-workbench')
        || panelRoot;
      host.appendChild(slot);
      return slot;
    };

    let frame = null;
    const movePanel = () => {
      const currentFrame = frame;
      frame = null;
      if (currentFrame != null) instance.rafIds.delete(currentFrame);
      if (instance.cancelled) return;

      const panel = sceneRoot.querySelector('#cross-section-panel')
        || panelRoot.querySelector('#cross-section-panel');
      if (!panel) return;

      const slot = ensureSlot();
      if (panel.parentElement !== slot) {
        slot.appendChild(panel);
      }
    };
    const scheduleMove = () => {
      if (frame != null || instance.cancelled) return;
      frame = window.requestAnimationFrame(movePanel);
      instance.rafIds.add(frame);
    };

    ensureSlot();
    scheduleMove();

    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(scheduleMove);
    observer.observe(sceneRoot, { childList: true, subtree: true });
    observer.observe(panelRoot, { childList: true, subtree: true });
    instance.globalRestores.push(() => {
      observer.disconnect();
      if (frame != null) {
        window.cancelAnimationFrame(frame);
        instance.rafIds.delete(frame);
      }
    });
  }

  function createLessonDisclosure(title, nodes, options = {}) {
    const details = document.createElement('details');
    details.className = `geo-lesson-disclosure ${options.className || ''}`.trim();
    details.open = Boolean(options.open);
    const summary = document.createElement('summary');
    summary.textContent = title;
    details.appendChild(summary);
    nodes.filter(Boolean).forEach(node => details.appendChild(node));
    return details;
  }

  function createLessonFocus(icon, title, body) {
    const focus = document.createElement('section');
    focus.className = 'geo-lesson-focus';
    focus.innerHTML = `<strong>${icon} ${title}</strong><p>${body}</p>`;
    return focus;
  }

  function setLessonSlider(panelRoot, id, value) {
    const slider = panelRoot?.querySelector(`#${cssEscape(id)}`);
    if (!slider) return;
    slider.value = String(value);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function createLessonPreset(label, action, active = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `geo-lesson-preset${active ? ' active' : ''}`;
    button.textContent = label;
    button.addEventListener('click', () => {
      action();
      button.parentElement?.querySelectorAll('.geo-lesson-preset').forEach(item => item.classList.toggle('active', item === button));
    });
    return button;
  }

  function installCarbonLessonEnhancement(panelRoot) {
    const overview = panelRoot?.querySelector('#p1');
    const pathway = panelRoot?.querySelector('#p3');
    if (!overview || !pathway || overview.dataset.lessonEnhanced) return;
    overview.dataset.lessonEnhanced = 'true';

    const intro = overview.querySelector('.tip-box');
    intro?.insertAdjacentElement('afterend', createLessonFocus('⚖️', '先看碳收支', '人为排放持续大于自然吸收，才会让大气中的 CO₂ 浓度上升。先点一条碳流，再定位相关碳库。'));
    const reservoirs = Array.from(overview.querySelectorAll('.card.clickable'));
    const fluxTitle = Array.from(overview.querySelectorAll('h3')).find(node => node.textContent.includes('碳通量'));
    const fluxes = Array.from(overview.querySelectorAll('.flux-btn'));
    const reservoirDetails = createLessonDisclosure('五大碳库 · 按需定位', reservoirs, { className: 'carbon-reservoirs' });
    const fluxDetails = createLessonDisclosure('五条碳通量 · 选一条观察方向与量级', [fluxTitle, ...fluxes], { className: 'carbon-fluxes' });
    overview.append(reservoirDetails, fluxDetails);

    const pathwayIntro = pathway.querySelector('.tip-box');
    pathwayIntro?.insertAdjacentElement('afterend', createLessonFocus('🎯', '先选一条路径', '先用情景预设比较“排放端”和“吸收端”的组合，再展开精细杠杆解释为什么结果不同。'));
    const sliders = Array.from(pathway.querySelectorAll('.slider-block'));
    const scenarios = Array.from(pathway.querySelectorAll('button[onclick^="applyScenario"]'));
    const simulation = pathway.querySelector('button[onclick^="runSimulation"]');
    const chart = pathway.querySelector('#chart-canvas')?.closest('.card');
    const scenarioRow = document.createElement('div');
    scenarioRow.className = 'geo-lesson-preset-row';
    scenarios.forEach(button => scenarioRow.appendChild(button));
    const energyDetails = createLessonDisclosure('源头减排 · 能源结构与电气化', sliders.slice(0, 3), { className: 'carbon-controls' });
    const sinkDetails = createLessonDisclosure('增汇固碳 · 生态碳汇与 CCUS', sliders.slice(3), { className: 'carbon-controls' });
    const chartDetails = createLessonDisclosure('查看 2025—2060 排放路径曲线', [chart], { className: 'carbon-chart' });
    pathway.append(scenarioRow, energyDetails, sinkDetails, simulation, chartDetails);
  }

  function installBasinLessonEnhancement(panelRoot) {
    const overview = panelRoot?.querySelector('#p1');
    const sandbox = panelRoot?.querySelector('#p4');
    if (!overview || !sandbox || overview.dataset.lessonEnhanced) return;
    overview.dataset.lessonEnhanced = 'true';

    const intro = overview.querySelector('.tip-box');
    intro?.insertAdjacentElement('afterend', createLessonFocus('🧭', '从上游看到河口', '依次观察山地、水库、枢纽、平原、城市与湿地：自然条件决定开发方向，也决定必须统筹的生态代价。'));
    const nodes = Array.from(overview.querySelectorAll('.card.clickable'));
    overview.appendChild(createLessonDisclosure('六个关键空间节点 · 点选定位', nodes, { className: 'basin-nodes' }));

    const tip = sandbox.querySelector('.tip-box');
    tip?.insertAdjacentElement('afterend', createLessonFocus('⚖️', '调度不是追求单项最大', '观察“库水位—下泄流量—发电出力—城市风险”的取舍；暴雨时优先削峰，平水期再兼顾发电与供水。'));
    const presetRow = document.createElement('div');
    presetRow.className = 'geo-lesson-preset-row';
    presetRow.append(
      createLessonPreset('☀️ 平水常态', () => { setLessonSlider(panelRoot, 's-rain', 30); setLessonSlider(panelRoot, 's-gate', 50); setLessonSlider(panelRoot, 's-veg', 55); }, true),
      createLessonPreset('☔ 暴雨削峰', () => { setLessonSlider(panelRoot, 's-rain', 88); setLessonSlider(panelRoot, 's-gate', 72); setLessonSlider(panelRoot, 's-veg', 78); }),
      createLessonPreset('🌲 生态涵养', () => { setLessonSlider(panelRoot, 's-rain', 45); setLessonSlider(panelRoot, 's-gate', 46); setLessonSlider(panelRoot, 's-veg', 88); })
    );
    tip?.insertAdjacentElement('afterend', presetRow);
  }

  function installPollutionLessonEnhancement(panelRoot) {
    const overview = panelRoot?.querySelector('#p1');
    const governance = panelRoot?.querySelector('#p3');
    if (!overview || !governance || overview.dataset.lessonEnhanced) return;
    overview.dataset.lessonEnhanced = 'true';

    const intro = overview.querySelector('.tip-box');
    intro?.insertAdjacentElement('afterend', createLessonFocus('🧭', '一次只追踪一条路径', '先分清自然输送与人为转移，再看“源头 → 载体 → 受影响区 → 环境风险”。选中路线后，其他路线应作为背景。'));
    const routeCards = Array.from(overview.querySelectorAll('.card.clickable')).slice(0, 3);
    const caseCards = Array.from(overview.querySelectorAll('.card.clickable')).slice(3);
    overview.append(
      createLessonDisclosure('三条转移路径 · 逐条追踪', routeCards, { className: 'pollution-routes', open: true }),
      createLessonDisclosure('热点与案例 · 需要时再展开', caseCards, { className: 'pollution-cases' })
    );

    const tip = governance.querySelector('.tip-box');
    tip?.insertAdjacentElement('afterend', createLessonFocus('🛡️', '治理看综合效果', '先选择治理方案，再展开四项杠杆。分数应由跨境监管、源头减量、清洁生产和监测能力共同决定。'));
    const presetRow = document.createElement('div');
    presetRow.className = 'geo-lesson-preset-row';
    presetRow.append(
      createLessonPreset('⚪ 现状基线', () => { setLessonSlider(panelRoot, 's-treaty', 45); setLessonSlider(panelRoot, 's-ban', 45); setLessonSlider(panelRoot, 's-industry', 35); setLessonSlider(panelRoot, 's-monitor', 40); }, true),
      createLessonPreset('🤝 协同共治', () => { setLessonSlider(panelRoot, 's-treaty', 82); setLessonSlider(panelRoot, 's-ban', 78); setLessonSlider(panelRoot, 's-industry', 70); setLessonSlider(panelRoot, 's-monitor', 76); }),
      createLessonPreset('🔎 监管优先', () => { setLessonSlider(panelRoot, 's-treaty', 88); setLessonSlider(panelRoot, 's-ban', 92); setLessonSlider(panelRoot, 's-industry', 50); setLessonSlider(panelRoot, 's-monitor', 90); })
    );
    tip?.insertAdjacentElement('afterend', presetRow);
    const controls = Array.from(governance.querySelectorAll('.slider-block'));
    governance.appendChild(createLessonDisclosure('展开四项治理杠杆', controls, { className: 'pollution-controls' }));
  }

  function installSolarLessonEnhancement(panelRoot) {
    const panel = panelRoot?.querySelector('#panel');
    if (!panel || panel.dataset.lessonEnhanced) return;
    panel.dataset.lessonEnhanced = 'true';
    const cards = Array.from(panel.children).filter(node => node.classList?.contains('card'));
    if (cards.length < 7) return;
    cards[0].insertAdjacentElement('afterend', createLessonFocus('🧠', '先定日期，再定地点', '太阳直射点纬度 δ 与观测点纬度 φ 一起决定正午太阳高度；时刻只改变你在昼弧或夜弧上的位置。'));
    const dateDetails = createLessonDisclosure('① 日期与地点', [cards[1], cards[2]], { className: 'solar-date-place', open: true });
    const timeDetails = createLessonDisclosure('② 一天中的变化', [cards[3]], { className: 'solar-time' });
    const observeDetails = createLessonDisclosure('③ 深入观察与检测', [cards[4], cards[5], cards[6]], { className: 'solar-observe' });
    panel.append(dateDetails, timeDetails, observeDetails);
  }

  function installImportedLessonEnhancements(instance, panelRoot, cardId) {
    if (!panelRoot) return;
    const install = () => {
      if (instance.cancelled) return;
      if (cardId === 'sx3m14') installCarbonLessonEnhancement(panelRoot);
      if (cardId === 'sx2_m01') installBasinLessonEnhancement(panelRoot);
      if (cardId === 'sx3m15') installPollutionLessonEnhancement(panelRoot);
      if (cardId === 'sx1m11') installSolarLessonEnhancement(panelRoot);
      normalizePanelControls(panelRoot);
    };
    install();
    const id = window.setTimeout(install, 0);
    instance.timeoutIds.add(id);
  }

  function movePanels(sceneRoot, panelRoot, selectors) {
    if (!panelRoot) return;
    panelRoot.innerHTML = '';
    panelRoot.classList.add('geo-source-panel');

    const workbench = createPanelWorkbench(panelRoot);
    const moved = new Set();
    selectors.forEach(selector => {
      sceneRoot.querySelectorAll(selector).forEach(node => {
        if (moved.has(node) || node.id === 'canvas-container' || node.closest('.geo-source-panel')) return;
        moved.add(node);
        appendPanelCard(workbench, node);
      });
    });
  }

  function createInstance(container, context) {
    return {
      cancelled: false,
      container,
      context,
      styleElement: null,
      rafIds: new Set(),
      timeoutIds: new Set(),
      intervalIds: new Set(),
      leafletMaps: new Set(),
      resizeListeners: [],
      globalRestores: [],
      sourceDefinition: null,
      sourceContainer: null
    };
  }

  async function mountSource(container, context, instance) {
    const config = context?.config || {};
    const baseUrl = getSceneBaseUrl(context);
    await loadDependencies(config);
    /* 部署版 Draco 解码补丁：three.js 场景自动附加本地解码器（DRACOLoader.js
       位于引擎 vendor 目录，decoder 三件套在 /draco/1.5.6/），使 Draco 压缩
       后的 GLB 离线/在线均可解码 */
    if (!window.__ptDracoPatched && window.THREE && window.THREE.GLTFLoader && !window.THREE.DRACOLoader) {
      try {
        await loadScriptOnce('/subjects/geography/visualizations/engines/source-html-adapter/vendor/DRACOLoader.js');
      } catch (err) {
      }
      if (window.THREE && window.THREE.DRACOLoader) {
        const __OrigGLTFLoader = window.THREE.GLTFLoader;
        const __PatchedGLTFLoader = function () {
          const loader = new __OrigGLTFLoader(...arguments);
          if (loader && !loader.dracoLoader) {
            try {
              const draco = new window.THREE.DRACOLoader();
              draco.setDecoderPath('/draco/1.5.6/');
              loader.setDRACOLoader(draco);
            } catch (err2) {
            }
          }
          return loader;
        };
        __PatchedGLTFLoader.prototype = __OrigGLTFLoader.prototype;
        window.THREE.GLTFLoader = __PatchedGLTFLoader;
        window.__ptDracoPatched = true;
      }
    }
    if (instance.cancelled) return;

    const sourceUrl = resolveResourceUrl(baseUrl, config.source || 'source.html');
    const sourceHtml = await fetchText(sourceUrl);
    if (instance.cancelled) return;

    const parsed = parseSourceHtml(sourceHtml);
    const configuredStyles = await fetchConfiguredSourceText(config, baseUrl, 'sourceStyles');
    const configuredScripts = await fetchConfiguredSourceText(config, baseUrl, 'sourceScripts');
    if (instance.cancelled) return;
    const sceneClass = `geo-source-scene-${context.card.id}`;
    const panelClass = `geo-source-panel-${context.card.id}`;
    const sceneRoot = document.createElement('div');
    sceneRoot.className = `geo-source-scene ${sceneClass}`;
    sceneRoot.innerHTML = parsed.body;
    resolveInlineElementResources(sceneRoot, baseUrl);
    container.innerHTML = '';
    container.appendChild(sceneRoot);

    const panelRoot = context.externalPanel || null;
    movePanels(sceneRoot, panelRoot, config.panelSelectors || DEFAULT_PANEL_SELECTORS);
    if (panelRoot) panelRoot.classList.add(panelClass);
    installPanelControlNormalizer(instance, panelRoot);
    installJ8bCrossSectionPanelBridge(instance, sceneRoot, panelRoot, context?.card?.id);

    const styleElement = document.createElement('style');
    styleElement.textContent = [
      scopeCss([parsed.styles, ...configuredStyles].join('\n'), sceneClass, panelClass, baseUrl),
      buildAdapterCss(sceneClass, panelClass)
    ].join('\n');
    document.head.appendChild(styleElement);
    instance.styleElement = styleElement;

    const dataGlobals = await loadDataGlobals(config, baseUrl);
    if (instance.cancelled) return;
    const scope = createRuntimeScope(instance, sceneRoot, panelRoot || sceneRoot, baseUrl);
    scope.dataGlobals = dataGlobals;
    executeSourceScript(instance, [parsed.scripts, ...configuredScripts].join('\n\n'), scope);
    if (instance.cancelled) return;
    await mountRegisteredSourceScene(instance, sceneRoot, context, scope);
    installImportedLessonEnhancements(instance, panelRoot, context?.card?.id);

    fitSceneMedia(sceneRoot);
    scheduleSceneResize(instance, sceneRoot);
  }

  function cleanupInstance(instance) {
    if (!instance || instance.cancelled) return;
    instance.cancelled = true;
    if (instance.sourceDefinition && typeof instance.sourceDefinition.unmount === 'function' && instance.sourceContainer) {
      try {
        instance.sourceDefinition.unmount(instance.sourceContainer, instance.context);
      } catch (error) {}
    }
    instance.rafIds.forEach(id => window.cancelAnimationFrame(id));
    instance.timeoutIds.forEach(id => window.clearTimeout(id));
    instance.intervalIds.forEach(id => window.clearInterval(id));
    instance.resizeListeners.forEach(item => window.removeEventListener('resize', item.wrapped, item.options));
    instance.globalRestores.reverse().forEach(restore => restore());
    if (instance.styleElement) instance.styleElement.remove();
    if (instance.context?.externalPanel) instance.context.externalPanel.innerHTML = '';
    if (instance.container) instance.container.innerHTML = '';
  }

  const definition = {
    mount(container, context) {
      const previous = mounts.get(container);
      if (previous) cleanupInstance(previous);
      const instance = createInstance(container, context);
      mounts.set(container, instance);
      return mountSource(container, context, instance);
    },
    unmount(container) {
      const instance = mounts.get(container);
      if (instance) cleanupInstance(instance);
      mounts.delete(container);
    }
  };

  SOURCE_CARD_IDS.forEach(cardId => {
    window.GEOGRAPHY_VISUAL_SCENES[cardId] = definition;
  });
})();

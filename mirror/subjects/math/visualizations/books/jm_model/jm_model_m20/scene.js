window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "jm_model_m20";
  const STYLE_ID = "math-apollonius-circle-style";
  const FALLBACK_ERROR = "阿氏圆模型课件载入失败，请检查本卡片目录内 source.html 与 scene.js?v=e79b86f0966d";
  const mounts = new WeakMap();

  function appendRuntimeVersion(path) {
    const app = window.MathApp || {};
    if (typeof app.appendRuntimeVersion === "function") return app.appendRuntimeVersion(path);
    return path;
  }

  function resolveSourceUrl(context) {
    const folder = String(context?.sceneEntry?.folder || "").replace(/\/+$/, "");
    return appendRuntimeVersion((folder ? folder + "/" : "") + "source.html");
  }

  function createCleanup() {
    return {
      disposed: false,
      listeners: [],
      rafs: new Set(),
      timeouts: new Set(),
      intervals: new Set(),
      roots: [],
      shadowHosts: [],
      addListener(target, type, handler, options) {
        if (!target || typeof target.addEventListener !== "function") return;
        target.addEventListener(type, handler, options);
        this.listeners.push([target, type, handler, options]);
      },
      dispose() {
        if (this.disposed) return;
        this.disposed = true;
        this.listeners.forEach(([target, type, handler, options]) => {
          target.removeEventListener(type, handler, options);
        });
        this.rafs.forEach(id => window.cancelAnimationFrame(id));
        this.timeouts.forEach(id => window.clearTimeout(id));
        this.intervals.forEach(id => window.clearInterval(id));
        this.roots.forEach(root => root.remove());
        this.shadowHosts.forEach(host => host.remove());
      }
    };
  }

  function collectSource(doc) {
    const scriptParts = [];
    doc.querySelectorAll("script").forEach(node => {
      if (node.src) {
        node.remove();
        return;
      }
      const type = String(node.getAttribute("type") || "").trim().toLowerCase();
      if (type && type !== "text/javascript" && type !== "application/javascript") {
        node.remove();
        return;
      }
      scriptParts.push(node.textContent || "");
      node.remove();
    });

    const styleText = Array.from(doc.querySelectorAll("style"))
      .map(node => node.textContent || "")
      .join("\n");
    doc.querySelectorAll('style, script[src], link[rel="stylesheet"], link[as="style"]').forEach(node => node.remove());

    return {
      styleText,
      script: scriptParts.join("\n"),
      body: doc.body
    };
  }

  function makeShadowHost(className) {
    const host = document.createElement("div");
    host.className = className;
    host.dataset.cardId = CARD_ID;
    const shadow = host.attachShadow({ mode: "open" });
    return { host, shadow };
  }

  function baseStyleText() {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        color: #f8fafc;
        font-family: Inter, "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      .source-shell {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
      #canvas-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        cursor: pointer;
        touch-action: none;
        overscroll-behavior: contain;
      }
      canvas {
        cursor: inherit;
      }
      #control-panel {
        position: relative;
        width: 100%;
        max-width: none;
        height: auto;
        min-height: 100%;
        overflow: visible;
        background: transparent;
      }
      .apollonius-panel-scroll {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        background: transparent;
      }
      .apollonius-panel-scroll::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      @media (pointer: coarse), (hover: none), (max-width: 768px) {
        #hint-keyboard {
          display: none;
        }
      }
    `;
  }

  function attachStyle(shadow, sourceStyle) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `${sourceStyle || ""}\n${baseStyleText()}`;
    shadow.appendChild(style);
  }

  function extractLayout(body, sourceStyle, cleanup) {
    const canvasNode = body.querySelector("#canvas-container");
    const panelNode = body.querySelector("#control-panel");
    if (!canvasNode) throw new Error("canvas-container missing");
    if (!panelNode) throw new Error("control-panel missing");
    canvasNode.className = "";
    panelNode.className = "";

    const scene = makeShadowHost("apollonius-scene");
    const sceneShell = document.createElement("div");
    sceneShell.className = "source-shell";
    attachStyle(scene.shadow, sourceStyle);
    sceneShell.appendChild(canvasNode);
    scene.shadow.appendChild(sceneShell);
    scene.host.style.cssText = "position:absolute;inset:0;width:100%;height:100%;min-height:0;overflow:hidden;";

    const panel = makeShadowHost("apollonius-panel");
    const panelShell = document.createElement("div");
    panelShell.className = "apollonius-panel-scroll";
    attachStyle(panel.shadow, sourceStyle);
    panelShell.appendChild(panelNode);
    panel.shadow.appendChild(panelShell);
    panel.host.style.cssText = "display:block;width:100%;height:100%;min-height:0;overflow:hidden;";

    cleanup.shadowHosts.push(scene.host, panel.host);
    return { sceneRoot: scene.shadow, sceneHost: scene.host, panelRoot: panel.shadow, panelHost: panel.host };
  }

  function scopedQuery(sceneRoot, panelRoot, selector) {
    if (!selector) return null;
    try {
      return sceneRoot.querySelector(selector) || panelRoot.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  function scopedQueryAll(sceneRoot, panelRoot, selector) {
    const results = [];
    if (!selector) return results;
    try { results.push(...sceneRoot.querySelectorAll(selector)); } catch (error) {}
    try { results.push(...panelRoot.querySelectorAll(selector)); } catch (error) {}
    return results;
  }

  function makeScopedDocument(sceneRoot, panelRoot, cleanup) {
    return new Proxy(document, {
      get(target, prop) {
        if (prop === "getElementById") {
          return id => scopedQuery(sceneRoot, panelRoot, "#" + CSS.escape(String(id)));
        }
        if (prop === "querySelector") {
          return selector => scopedQuery(sceneRoot, panelRoot, selector);
        }
        if (prop === "querySelectorAll") {
          return selector => scopedQueryAll(sceneRoot, panelRoot, selector);
        }
        if (prop === "addEventListener") {
          return (type, handler, options) => {
            cleanup.addListener(sceneRoot, type, handler, options);
            cleanup.addListener(panelRoot, type, handler, options);
          };
        }
        if (prop === "removeEventListener") return () => {};
        if (prop === "body") return sceneRoot;
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
  }

  function makeScopedWindow(sceneHost, cleanup) {
    const visualViewportProxy = window.visualViewport ? new Proxy(window.visualViewport, {
      get(target, prop) {
        if (prop === "addEventListener") {
          return (type, handler, options) => cleanup.addListener(target, type, handler, options);
        }
        if (prop === "removeEventListener") return target.removeEventListener.bind(target);
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      }
    }) : window.visualViewport;

    return new Proxy(window, {
      get(target, prop) {
        if (prop === "innerWidth") return Math.max(1, Math.round(sceneHost.clientWidth || target.innerWidth || 1));
        if (prop === "innerHeight") return Math.max(1, Math.round(sceneHost.clientHeight || target.innerHeight || 1));
        if (prop === "visualViewport") return visualViewportProxy;
        if (prop === "addEventListener") {
          return (type, handler, options) => cleanup.addListener(target, type, handler, options);
        }
        if (prop === "removeEventListener") return target.removeEventListener.bind(target);
        if (prop === "requestAnimationFrame") {
          return callback => {
            const id = target.requestAnimationFrame(time => {
              cleanup.rafs.delete(id);
              if (!cleanup.disposed) callback(time);
            });
            cleanup.rafs.add(id);
            return id;
          };
        }
        if (prop === "cancelAnimationFrame") {
          return id => {
            cleanup.rafs.delete(id);
            target.cancelAnimationFrame(id);
          };
        }
        if (prop === "setTimeout") {
          return (handler, delay, ...args) => {
            const id = target.setTimeout(() => {
              cleanup.timeouts.delete(id);
              if (!cleanup.disposed) handler(...args);
            }, delay);
            cleanup.timeouts.add(id);
            return id;
          };
        }
        if (prop === "clearTimeout") {
          return id => {
            cleanup.timeouts.delete(id);
            target.clearTimeout(id);
          };
        }
        if (prop === "setInterval") {
          return (handler, delay, ...args) => {
            const id = target.setInterval(() => {
              if (!cleanup.disposed) handler(...args);
            }, delay);
            cleanup.intervals.add(id);
            return id;
          };
        }
        if (prop === "clearInterval") {
          return id => {
            cleanup.intervals.delete(id);
            target.clearInterval(id);
          };
        }
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      }
    });
  }

  function blockNativeTouchMenus(root, cleanup) {
    ["contextmenu", "selectstart", "dragstart"].forEach(type => {
      cleanup.addListener(root, type, event => event.preventDefault());
    });
    cleanup.addListener(root, "touchstart", event => {
      if (event.touches && event.touches.length > 1 && !event.target.closest("#control-panel")) {
        event.preventDefault();
      }
    }, { passive: false });
  }

  function bridgePanelRangeGestures(panelHost, panelRoot, cleanup) {
    let activePointerId = null;

    function findRatioRow(clientX, clientY) {
      const row = panelRoot.querySelector(".ap-slider-row");
      const slider = panelRoot.querySelector("#slider-ratio");
      if (!row || !slider) return null;
      const rect = row.getBoundingClientRect();
      const hitPad = 10;
      const inRow = clientX >= rect.left - hitPad &&
        clientX <= rect.right + hitPad &&
        clientY >= rect.top - hitPad &&
        clientY <= rect.bottom + hitPad;
      return inRow ? { row, slider } : null;
    }

    function dispatchToSlider(target, sourceEvent, type) {
      target.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: sourceEvent.pointerId,
        pointerType: sourceEvent.pointerType || "touch",
        clientX: sourceEvent.clientX,
        clientY: sourceEvent.clientY,
        button: 0,
        buttons: type === "pointerup" || type === "pointercancel" ? 0 : 1
      }));
    }

    cleanup.addListener(panelHost, "pointerdown", event => {
      const hit = findRatioRow(event.clientX, event.clientY);
      if (!hit) return;
      activePointerId = event.pointerId;
      event.preventDefault();
      dispatchToSlider(hit.row, event, "pointerdown");
    }, { passive: false });

    cleanup.addListener(panelHost, "pointermove", event => {
      if (activePointerId !== event.pointerId) return;
      const row = panelRoot.querySelector(".ap-slider-row");
      if (!row) return;
      event.preventDefault();
      dispatchToSlider(row, event, "pointermove");
    }, { passive: false });

    ["pointerup", "pointercancel"].forEach(type => {
      cleanup.addListener(panelHost, type, event => {
        if (activePointerId !== event.pointerId) return;
        const row = panelRoot.querySelector(".ap-slider-row");
        activePointerId = null;
        if (!row) return;
        event.preventDefault();
        dispatchToSlider(row, event, type);
      }, { passive: false });
    });
  }

  function runSourceScript(script, sceneRoot, panelRoot, sceneHost, cleanup) {
    const scopedDocument = makeScopedDocument(sceneRoot, panelRoot, cleanup);
    const scopedWindow = makeScopedWindow(sceneHost, cleanup);
    const source = String(script || "").replace(/requestAnimationFrame/g, "window.requestAnimationFrame");
    const runner = new Function(
      "document",
      "window",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "CSS",
      `"use strict";\n${source}\n//# sourceURL=jm_model_m20_source.js`
    );
    runner(
      scopedDocument,
      scopedWindow,
      scopedWindow.requestAnimationFrame,
      scopedWindow.cancelAnimationFrame,
      scopedWindow.setTimeout,
      scopedWindow.clearTimeout,
      scopedWindow.setInterval,
      scopedWindow.clearInterval,
      window.CSS
    );
  }

  function showError(container, context, message) {
    container.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:#07111f;color:#fecaca;font:800 14px/1.8 Microsoft YaHei,sans-serif;text-align:center;">${message}</div>`;
    if (context?.externalPanel) context.externalPanel.innerHTML = "";
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    async mount(container, context) {
      const previous = mounts.get(container);
      if (previous) previous.dispose();

      const cleanup = createCleanup();
      mounts.set(container, cleanup);
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
      container.style.position = container.style.position || "relative";
      container.style.overflow = "hidden";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.minHeight = "100%";

      try {
        const response = await fetch(resolveSourceUrl(context), { cache: "no-store" });
        if (!response.ok) throw new Error("source.html " + response.status);
        const html = await response.text();
        if (cleanup.disposed) return;

        const doc = new DOMParser().parseFromString(html, "text/html");
        const source = collectSource(doc);
        const { sceneRoot, sceneHost, panelRoot, panelHost } = extractLayout(source.body, source.styleText, cleanup);

        container.appendChild(sceneHost);
        cleanup.roots.push(sceneHost);

        const externalPanel = context?.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
        if (externalPanel) {
          externalPanel.appendChild(panelHost);
          cleanup.roots.push(panelHost);
        } else {
          panelHost.style.position = "absolute";
          panelHost.style.right = "12px";
          panelHost.style.top = "12px";
          panelHost.style.bottom = "12px";
          panelHost.style.width = "min(340px, calc(100% - 24px))";
          panelHost.style.zIndex = "20";
          container.appendChild(panelHost);
          cleanup.roots.push(panelHost);
        }

        blockNativeTouchMenus(sceneRoot, cleanup);
        blockNativeTouchMenus(panelRoot, cleanup);
        runSourceScript(source.script, sceneRoot, panelRoot, sceneHost, cleanup);
        bridgePanelRangeGestures(panelHost, panelRoot, cleanup);
        window.dispatchEvent(new Event("resize"));
      } catch (error) {
        console.error("Failed to mount apollonius circle model card:", error);
        if (!cleanup.disposed) showError(container, context, FALLBACK_ERROR);
      }
    },
    unmount(container, context) {
      const cleanup = mounts.get(container);
      if (cleanup) cleanup.dispose();
      mounts.delete(container);
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
    }
  };
})();

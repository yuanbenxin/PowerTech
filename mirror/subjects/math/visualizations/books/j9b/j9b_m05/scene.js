window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j9b_m05";
  let runtimePromise = null;

  function versioned(path) {
    const app = window.MathApp || {};
    return typeof app.appendRuntimeVersion === "function" ? app.appendRuntimeVersion(path) : path;
  }

  function assetUrl(context, name) {
    const folder = String(context?.sceneEntry?.folder || "").replace(/\/+$/, "");
    return versioned((folder ? folder + "/" : "") + name);
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(url + " " + response.status);
    return response.text();
  }

  function loadRuntime(context) {
    if (window.MATH_INVERSE_K_APP) return Promise.resolve(window.MATH_INVERSE_K_APP);
    if (!runtimePromise) runtimePromise = fetchText(assetUrl(context, "app.js?v=cf9ec06f0ef4")).then(code => {
      new Function(code)();
      if (!window.MATH_INVERSE_K_APP) throw new Error("反比例函数运行时未注册");
      return window.MATH_INVERSE_K_APP;
    });
    return runtimePromise;
  }

  function showError(container) {
    container.innerHTML = '<div style="display:grid;height:100%;place-items:center;padding:24px;background:#071019;color:#fecaca;font:700 14px/1.8 Microsoft YaHei,sans-serif;text-align:center;">反比例函数课件载入失败，请检查本卡片目录内 source.html、style.css?v=8f092ddffb65 与 scene.js?v=23a19e4037a7</div>';
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    async mount(container, context) {
      const externalPanel = context?.externalPanel;
      container.innerHTML = "";
      if (externalPanel) externalPanel.innerHTML = "";
      try {
        const [html, css, runtime] = await Promise.all([fetchText(assetUrl(context, "source.html")), fetchText(assetUrl(context, "style.css?v=8f092ddffb65")), loadRuntime(context)]);
        const doc = new DOMParser().parseFromString(html, "text/html");
        const scene = doc.querySelector("[data-inverse-k-scene]")?.cloneNode(true);
        const panel = doc.querySelector("[data-inverse-k-panel]")?.cloneNode(true);
        if (!scene || !panel) throw new Error("课件结构不完整");
        const style = document.createElement("style");
        style.dataset.inverseKStyle = CARD_ID;
        style.textContent = css;
        document.head.appendChild(style);
        container.appendChild(scene);
        if (externalPanel) externalPanel.appendChild(panel);
        else { panel.style.position = "absolute"; panel.style.zIndex = "4"; panel.style.right = "12px"; panel.style.top = "12px"; panel.style.width = "min(360px, calc(100% - 24px))"; container.appendChild(panel); }
        const destroy = runtime.mount(scene, panel);
        container.__inverseKCleanup = () => { destroy?.(); style.remove(); scene.remove(); panel.remove(); };
      } catch (error) {
        console.error("Failed to mount inverse proportion courseware", error);
        showError(container);
      }
    },
    unmount(container, context) {
      container.__inverseKCleanup?.();
      container.__inverseKCleanup = null;
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
    }
  };
})();

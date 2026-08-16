window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "sb1_m15";
  const versioned = path => typeof window.MathApp?.appendRuntimeVersion === "function" ? window.MathApp.appendRuntimeVersion(path) : path;
  const fail = (container, message) => { container.innerHTML = `<div style="position:absolute;inset:0;display:grid;place-items:center;padding:24px;background:#fff;color:#b45334;font:700 14px/1.8 Microsoft YaHei,sans-serif;text-align:center;">${message}</div>`; };
  window.MATH_VISUAL_SCENES[CARD_ID] = {
    async mount(container, context) {
      const cleanups = [];
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
      container.style.position = "absolute";
      container.style.inset = "0";
      container.style.overflow = "hidden";
      try {
        const folder = String(context?.sceneEntry?.folder || "").replace(/\/+$/, "");
        const response = await fetch(versioned(`${folder}/source.html`), { cache: "no-store" });
        if (!response.ok) throw new Error(`source.html ${response.status}`);
        const doc = new DOMParser().parseFromString(await response.text(), "text/html");
        const stageTemplate = doc.querySelector("#m15-stage");
        const panelTemplate = doc.querySelector("#m15-panel");
        const runtime = doc.querySelector("script.m15-runtime")?.textContent;
        if (!stageTemplate || !panelTemplate || !runtime) throw new Error("课件结构不完整");
        const style = document.createElement("style");
        style.textContent = Array.from(doc.querySelectorAll("style"), item => item.textContent || "").join("\n");
        document.head.appendChild(style);
        cleanups.push(() => style.remove());
        const script = document.createElement("script");
        script.textContent = runtime;
        document.head.appendChild(script);
        script.remove();
        if (typeof window.__SB1M15Init !== "function") throw new Error("课件运行程序未加载");
        const stage = stageTemplate.cloneNode(true);
        const panel = panelTemplate.cloneNode(true);
        stage.dataset.cardId = CARD_ID;
        panel.dataset.cardId = CARD_ID;
        stage.style.width = "100%";
        stage.style.height = "100%";
        container.appendChild(stage);
        if (context?.externalPanel) context.externalPanel.appendChild(panel);
        else { panel.style.cssText = "position:absolute;right:12px;top:12px;width:320px;max-height:calc(100% - 24px);overflow:auto;z-index:6"; container.appendChild(panel); }
        const dispose = window.__SB1M15Init(stage, panel);
        if (typeof dispose === "function") cleanups.push(dispose);
        container.__sb1m15Cleanup = () => cleanups.splice(0).reverse().forEach(fn => fn());
      } catch (cause) {
        console.error("Failed to mount", CARD_ID, cause);
        fail(container, "课件载入失败，请检查本卡片目录内的 source.html 和 scene.js?v=20f5457a4aa3");
      }
    },
    unmount(container, context) {
      if (typeof container.__sb1m15Cleanup === "function") container.__sb1m15Cleanup();
      container.__sb1m15Cleanup = null;
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
    }
  };
})();

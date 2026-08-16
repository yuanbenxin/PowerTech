window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "sb1_m14";

  function appendRuntimeVersion(path) {
    const app = window.MathApp || {};
    return typeof app.appendRuntimeVersion === "function" ? app.appendRuntimeVersion(path) : path;
  }

  function sourceUrl(context) {
    const folder = String(context?.sceneEntry?.folder || "").replace(/\/+$/, "");
    return appendRuntimeVersion((folder ? folder + "/" : "") + "source.html");
  }

  function error(container, message) {
    container.innerHTML = `<div style="position:absolute;inset:0;display:grid;place-items:center;padding:24px;background:#fff;color:#b91c1c;font:700 14px/1.8 Microsoft YaHei,sans-serif;text-align:center;">${message}</div>`;
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    async mount(container, context) {
      const cleanups = [];
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
      // CardVisualStage provides an absolute inset host. Preserve that fill
      // behavior so the white simulation frame never exposes its dark shell.
      container.style.position = "absolute";
      container.style.inset = "0";
      container.style.overflow = "hidden";

      try {
        const response = await fetch(sourceUrl(context), { cache: "no-store" });
        if (!response.ok) throw new Error(`source.html ${response.status}`);
        const doc = new DOMParser().parseFromString(await response.text(), "text/html");
        const stageTemplate = doc.querySelector("#m14-stage");
        const panelTemplate = doc.querySelector("#m14-panel");
        const runtime = doc.querySelector("script.m14-runtime")?.textContent;
        if (!stageTemplate || !panelTemplate || !runtime) throw new Error("课件结构不完整");

        const style = document.createElement("style");
        style.textContent = Array.from(doc.querySelectorAll("style"), node => node.textContent || "").join("\n");
        document.head.appendChild(style);
        cleanups.push(() => style.remove());

        const script = document.createElement("script");
        script.textContent = runtime;
        document.head.appendChild(script);
        script.remove();
        if (typeof window.__SB1M14Init !== "function") throw new Error("课件运行程序未加载");

        const stage = stageTemplate.cloneNode(true);
        const panel = panelTemplate.cloneNode(true);
        stage.dataset.cardId = CARD_ID;
        panel.dataset.cardId = CARD_ID;
        stage.style.width = "100%";
        stage.style.height = "100%";
        container.appendChild(stage);
        if (context?.externalPanel) {
          context.externalPanel.appendChild(panel);
        } else {
          panel.style.position = "absolute";
          panel.style.top = "12px";
          panel.style.right = "12px";
          panel.style.width = "320px";
          panel.style.maxHeight = "calc(100% - 24px)";
          panel.style.overflowY = "auto";
          container.appendChild(panel);
        }

        const dispose = window.__SB1M14Init(stage, panel);
        if (typeof dispose === "function") cleanups.push(dispose);
        container.__sb1m14Cleanup = () => cleanups.splice(0).reverse().forEach(fn => fn());
      } catch (cause) {
        console.error("Failed to mount", CARD_ID, cause);
        error(container, "课件载入失败，请检查本卡片目录内的 source.html 和 scene.js?v=468336e6c8fd");
      }
    },
    unmount(container, context) {
      if (typeof container.__sb1m14Cleanup === "function") {
        container.__sb1m14Cleanup();
        container.__sb1m14Cleanup = null;
      }
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
    }
  };
})();

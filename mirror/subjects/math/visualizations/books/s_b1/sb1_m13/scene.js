window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = 'sb1_m13';
  const versioned = path => typeof window.MathApp?.appendRuntimeVersion === 'function' ? window.MathApp.appendRuntimeVersion(path) : path;
  const sourceUrl = context => {
    const folder = String(context?.sceneEntry?.folder || '').replace(/\/+$/, '');
    return versioned((folder ? folder + '/' : '') + 'source.html');
  };
  const fail = (container, message) => {
    container.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:24px;background:#fff;color:#b91c1c;font:700 14px/1.8 Microsoft YaHei,sans-serif;text-align:center;">' + message + '</div>';
  };
  const repairRuntime = runtime => {
    const broken = `svg.innerHTML=grid()+'<path d="'+domain+'" fill="none" stroke="#0ea5e9" stroke-width="6" opacity=".45"/><path d="'+range+'" fill="none" stroke="#10b981" stroke-width="6" opacity=".45"/>'+asym+`;
    const corrected = `svg.innerHTML=grid()+domain.replace('/>',' fill="none" stroke="#0ea5e9" stroke-width="6" opacity=".45"/>')+range.replace('/>',' fill="none" stroke="#10b981" stroke-width="6" opacity=".45"/>')+asym+`;
    let patched = runtime.replace(broken, corrected);
    if (patched === runtime) throw new Error('扫描高亮路径未能初始化');
    const applyRefreshRule = (from, to) => {
      const next = patched.replace(from, to);
      if (next === patched) throw new Error('参数控件刷新规则未能初始化');
      patched = next;
    };
    applyRefreshRule(';renderSteps();ui.cmd.textContent=', ';if(!steps.querySelector(\'[data-key]\'))renderSteps();ui.cmd.textContent=');
    applyRefreshRule(';draw()})}function setModel', ';b.parentElement.querySelector(\'.m13-step-value\').textContent=fmt(state[k]);draw()})}function setModel');
    applyRefreshRule('b.dataset.model===m));draw()}tabs.querySelectorAll', 'b.dataset.model===m));renderSteps();draw()}tabs.querySelectorAll');
    applyRefreshRule('}draw();e.preventDefault()}function end', '}if(state.drag===\'anchor\'||state.drag===\'shape\')steps.replaceChildren();draw();e.preventDefault()}function end');
    applyRefreshRule('state.last=world(e.clientX,e.clientY);svg.setPointerCapture', 'state.last=world(e.clientX,e.clientY);svg.style.cursor=\'grabbing\';svg.setPointerCapture');
    applyRefreshRule('state.drag=null;state.pinch=null;try{svg.releasePointerCapture', 'state.drag=null;state.pinch=null;svg.style.cursor=\'grab\';try{svg.releasePointerCapture');
    applyRefreshRule("svg.addEventListener('pointerdown',down,{passive:false});", "svg.addEventListener('wheel',e=>{const before=world(e.clientX,e.clientY),r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;state.zoom=clamp(state.zoom*(e.deltaY<0?1.12:1/1.12),.55,3);state.panX=-(before.x-px*(W/state.zoom));state.panY=-(before.y-py*(H/state.zoom));draw();e.preventDefault()},{passive:false});svg.addEventListener('pointerdown',down,{passive:false});");
    return patched;
  };

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    async mount(container, context) {
      const cleanups = [];
      container.innerHTML = '';
      if (context?.externalPanel) context.externalPanel.innerHTML = '';
      container.style.position = 'absolute';
      container.style.inset = '0';
      container.style.overflow = 'hidden';
      try {
        const response = await fetch(sourceUrl(context), { cache: 'no-store' });
        if (!response.ok) throw new Error('source.html ' + response.status);
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const stageNode = doc.querySelector('#m13-stage');
        const panelNode = doc.querySelector('#m13-panel');
        let runtime = doc.querySelector('script.m13-runtime')?.textContent;
        if (!stageNode || !panelNode || !runtime) throw new Error('课件结构不完整');
        runtime = repairRuntime(runtime);

        const style = document.createElement('style');
        style.textContent = Array.from(doc.querySelectorAll('style'), node => node.textContent || '').join('\n');
        document.head.appendChild(style);
        cleanups.push(() => style.remove());

        const script = document.createElement('script');
        script.textContent = runtime;
        document.head.appendChild(script);
        script.remove();
        if (typeof window.__SB1M13Init !== 'function') throw new Error('课件运行程序未加载');

        const stage = stageNode.cloneNode(true);
        const panel = panelNode.cloneNode(true);
        stage.dataset.cardId = CARD_ID;
        panel.dataset.cardId = CARD_ID;
        stage.style.width = '100%';
        stage.style.height = '100%';
        container.appendChild(stage);
        if (context?.externalPanel) context.externalPanel.appendChild(panel);
        else {
          panel.style.cssText += ';position:absolute;right:12px;top:12px;width:320px;max-height:calc(100% - 24px);overflow-y:auto';
          container.appendChild(panel);
        }
        const dispose = window.__SB1M13Init(stage, panel);
        if (typeof dispose === 'function') cleanups.push(dispose);
        container.__sb1m13Cleanup = () => cleanups.splice(0).reverse().forEach(fn => fn());
      } catch (error) {
        console.error('Failed to mount', CARD_ID, error);
        fail(container, '课件载入失败，请检查本卡片目录内的 source.html 和 scene.js?v=af6bbffcd21d');
      }
    },
    unmount(container, context) {
      if (typeof container.__sb1m13Cleanup === 'function') {
        container.__sb1m13Cleanup();
        container.__sb1m13Cleanup = null;
      }
      container.innerHTML = '';
      if (context?.externalPanel) context.externalPanel.innerHTML = '';
    }
  };
})();

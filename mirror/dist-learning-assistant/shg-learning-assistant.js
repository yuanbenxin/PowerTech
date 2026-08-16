/* global THREE */
(function () {
  'use strict';

  const config = window.SHG_LEARNING_ASSISTANT_CONFIG || {};
  const subjectName = String(config.subjectName || '当前学科');
  let motion = 'idle';
  let motionStartedAt = performance.now();
  let dialog;
  let messages;
  let input;
  let dragState;
  let suppressAvatarClick = false;
  let host;
  let guideContextKey = '';
  let guideIndexVersion = 0;
  let guideLoadPromise;
  let viewportRecoveryFrame = 0;
  let viewportRecoveryTimer;
  let keyboardRestoreTimer;
  let keyboardSession;
  let stableViewportSize = { width: 0, height: 0 };
  const guideIndex = new Map();
  const DRAG_GUTTER = 8;
  const TOP_SAFE_AREA = 64;
  const AVATAR_FRONT_Y = Math.PI / 2;

  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const getCoursewareRoot = () => document.querySelector('[data-courseware-mode]');
  const isSubjectVisualApp = () => Boolean(document.getElementById('root') || document.getElementById('homeRoot'));
  const isVisibleElement = selector => {
    const element = document.querySelector(selector);
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  };
  // The question bank lives inside the same subject SPA, but 小拾光 is only for visual courseware.
  const isQuestionBankOpen = () => isVisibleElement('[data-qb-card-state], .question-bank-v15-workbench, [data-qb-filter-panel]');
  const getSubjectCardTitle = () => document.querySelector('main h2')?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const isPhysicsSimulationOpen = () => {
    const overlay = document.getElementById('simOverlay');
    return Boolean(overlay && getComputedStyle(overlay).display !== 'none' && getComputedStyle(overlay).visibility !== 'hidden');
  };
  const getContext = () => {
    if (isQuestionBankOpen()) {
      return { cardId: '', title: '', scope: 'question-bank', active: false };
    }
    const root = getCoursewareRoot();
    if (root) {
      return {
        cardId: root.dataset.shgCardId || '',
        title: root.dataset.shgCardTitle || '当前课件',
        scope: 'courseware',
        active: true
      };
    }
    if (isPhysicsSimulationOpen()) {
      return {
        cardId: '',
        title: document.getElementById('simTitle')?.textContent?.trim() || '当前物理实验',
        scope: 'courseware',
        active: true
      };
    }
    const detailTitle = getSubjectCardTitle();
    return {
      cardId: '',
      title: detailTitle || `${subjectName}课程卡片`,
      scope: detailTitle ? 'card-detail' : 'catalog',
      active: isSubjectVisualApp()
    };
  };

  function setMotion(next) {
    motion = next;
    motionStartedAt = performance.now();
  }

  function setDialogOpen(open) {
    dialog.hidden = !open;
    if (open) {
      renderCoursewareGuide(getContext());
      window.requestAnimationFrame(() => { constrainHostToVisibleArea(); fitDialogIntoViewport(); input.focus(); });
    }
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  }

  function getVisibleViewportBounds() {
    const viewport = window.visualViewport;
    const left = Number(viewport?.offsetLeft || 0);
    const top = Number(viewport?.offsetTop || 0);
    const width = Number(viewport?.width || window.innerWidth);
    const height = Number(viewport?.height || window.innerHeight);
    return { left, top, right: left + width, bottom: top + height, width, height };
  }

  function beginKeyboardSession() {
    window.clearTimeout(keyboardRestoreTimer);
    if (!keyboardSession) {
      const viewport = getVisibleViewportBounds();
      const stableHeight = Math.abs(stableViewportSize.width - viewport.width) < 80
        ? stableViewportSize.height
        : 0;
      keyboardSession = {
        baselineHeight: Math.max(viewport.height, stableHeight),
        restoreDeadline: 0,
        hostPosition: {
          left: host.style.left,
          top: host.style.top,
          bottom: host.style.bottom
        },
        wasOpen: false
      };
    }
    scheduleViewportRecovery();
  }

  function isSoftwareKeyboardOpen() {
    if (!keyboardSession) return false;
    const heightLoss = keyboardSession.baselineHeight - getVisibleViewportBounds().height;
    return heightLoss > 80 && (document.activeElement === input || keyboardSession.wasOpen);
  }

  function restoreAfterKeyboard() {
    if (!keyboardSession) return;
    const savedPosition = keyboardSession.hostPosition;
    const baselineHeight = keyboardSession.baselineHeight;
    keyboardSession = undefined;
    host.classList.remove('is-keyboard-open');
    host.style.left = savedPosition.left;
    host.style.top = savedPosition.top;
    host.style.bottom = savedPosition.bottom;
    host.style.removeProperty('--shg-assistant-keyboard-dialog-height');
    dialog.style.left = '';
    dialog.style.bottom = '';
    const viewport = getVisibleViewportBounds();
    if (viewport.height >= baselineHeight - 40) {
      stableViewportSize = { width: viewport.width, height: viewport.height };
    }
    window.requestAnimationFrame(() => {
      if (!dialog.hidden) fitDialogIntoViewport();
    });
  }

  function scheduleKeyboardRestore() {
    window.clearTimeout(keyboardRestoreTimer);
    if (!keyboardSession) return;
    if (!keyboardSession.restoreDeadline) keyboardSession.restoreDeadline = performance.now() + 1800;
    keyboardRestoreTimer = window.setTimeout(() => {
      const viewportRecovered = getVisibleViewportBounds().height >= keyboardSession.baselineHeight - 40;
      if (viewportRecovered || performance.now() >= keyboardSession.restoreDeadline) {
        restoreAfterKeyboard();
        return;
      }
      scheduleKeyboardRestore();
    }, 120);
  }

  function fitAssistantIntoVisibleViewport() {
    const viewport = getVisibleViewportBounds();
    let hostRect = host.getBoundingClientRect();
    let dialogRect = dialog.hidden ? hostRect : dialog.getBoundingClientRect();
    if (!dialog.hidden) {
      const avatarSpanBelowDialog = Math.max(0, hostRect.bottom - dialogRect.bottom);
      const availableDialogHeight = Math.max(
        132,
        viewport.height - TOP_SAFE_AREA - (DRAG_GUTTER * 2) - avatarSpanBelowDialog
      );
      host.style.setProperty('--shg-assistant-keyboard-dialog-height', `${availableDialogHeight}px`);
      hostRect = host.getBoundingClientRect();
      dialogRect = dialog.getBoundingClientRect();
    }
    const groupLeft = Math.min(hostRect.left, dialogRect.left);
    const groupRight = Math.max(hostRect.right, dialogRect.right);
    const groupTop = Math.min(hostRect.top, dialogRect.top);
    const groupBottom = Math.max(hostRect.bottom, dialogRect.bottom);
    let shiftX = 0;
    let shiftY = 0;

    if (groupRight > viewport.right - DRAG_GUTTER) shiftX -= groupRight - (viewport.right - DRAG_GUTTER);
    if (groupLeft + shiftX < viewport.left + DRAG_GUTTER) shiftX += viewport.left + DRAG_GUTTER - (groupLeft + shiftX);
    if (groupBottom > viewport.bottom - DRAG_GUTTER) shiftY -= groupBottom - (viewport.bottom - DRAG_GUTTER);
    if (groupTop + shiftY < viewport.top + TOP_SAFE_AREA) shiftY += viewport.top + TOP_SAFE_AREA - (groupTop + shiftY);

    host.style.left = `${hostRect.left + shiftX}px`;
    host.style.top = `${hostRect.top + shiftY}px`;
    host.style.bottom = 'auto';
  }

  function fitDialogIntoViewport() {
    if (dialog.hidden) return;
    dialog.style.left = '';
    dialog.style.bottom = '';
    const viewport = getVisibleViewportBounds();
    const hostRect = host.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const targetLeft = clamp(hostRect.left, viewport.left + DRAG_GUTTER, viewport.right - dialogRect.width - DRAG_GUTTER);
    dialog.style.left = `${targetLeft - hostRect.left}px`;
    const adjustedRect = dialog.getBoundingClientRect();
    if (adjustedRect.top < viewport.top + TOP_SAFE_AREA) {
      const currentBottom = Number.parseFloat(window.getComputedStyle(dialog).bottom) || 0;
      dialog.style.bottom = `${Math.max(0, currentBottom - (viewport.top + TOP_SAFE_AREA - adjustedRect.top))}px`;
    }
  }

  function getDragBounds() {
    const viewport = getVisibleViewportBounds();
    const hostRect = host.getBoundingClientRect();
    let minimumLeft = viewport.left + DRAG_GUTTER;
    let maximumLeft = viewport.right - hostRect.width - DRAG_GUTTER;
    let minimumTop = viewport.top + TOP_SAFE_AREA;
    let maximumTop = viewport.bottom - hostRect.height - DRAG_GUTTER;
    if (!dialog.hidden) {
      const dialogRect = dialog.getBoundingClientRect();
      const offsetLeft = dialogRect.left - hostRect.left;
      const offsetTop = dialogRect.top - hostRect.top;
      minimumLeft = Math.max(minimumLeft, viewport.left + DRAG_GUTTER - offsetLeft);
      maximumLeft = Math.min(maximumLeft, viewport.right - DRAG_GUTTER - (offsetLeft + dialogRect.width));
      minimumTop = Math.max(minimumTop, viewport.top + TOP_SAFE_AREA - offsetTop);
      maximumTop = Math.min(maximumTop, viewport.bottom - DRAG_GUTTER - (offsetTop + dialogRect.height));
    }
    return { minimumLeft, maximumLeft, minimumTop, maximumTop };
  }

  function constrainHostToVisibleArea() {
    const rect = host.getBoundingClientRect();
    const bounds = getDragBounds();
    const left = clamp(rect.left, bounds.minimumLeft, bounds.maximumLeft);
    const top = clamp(rect.top, bounds.minimumTop, bounds.maximumTop);
    if (left === rect.left && top === rect.top) return;
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.bottom = 'auto';
  }

  function recoverAfterViewportChange() {
    viewportRecoveryFrame = 0;
    if (!host || host.hidden) return;
    const viewport = getVisibleViewportBounds();
    const canInferKeyboard = !keyboardSession
      && document.activeElement === input
      && Math.abs(stableViewportSize.width - viewport.width) < 80
      && stableViewportSize.height - viewport.height > 80;
    if (canInferKeyboard) {
      keyboardSession = {
        baselineHeight: stableViewportSize.height,
        restoreDeadline: 0,
        hostPosition: {
          left: host.style.left,
          top: host.style.top,
          bottom: host.style.bottom
        },
        wasOpen: true
      };
      host.classList.add('is-keyboard-open');
      fitAssistantIntoVisibleViewport();
      return;
    }
    if (keyboardSession && isSoftwareKeyboardOpen()) {
      keyboardSession.wasOpen = true;
      host.classList.add('is-keyboard-open');
      window.clearTimeout(keyboardRestoreTimer);
      fitAssistantIntoVisibleViewport();
      return;
    }
    if (keyboardSession?.wasOpen) {
      scheduleKeyboardRestore();
      return;
    }
    const rect = host.getBoundingClientRect();
    const left = clamp(rect.left, viewport.left + DRAG_GUTTER, viewport.right - rect.width - DRAG_GUTTER);
    const top = clamp(rect.top, viewport.top + TOP_SAFE_AREA, viewport.bottom - rect.height - DRAG_GUTTER);
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.bottom = 'auto';
    if (!dialog.hidden) {
      dialog.style.left = '';
      dialog.style.bottom = '';
      fitDialogIntoViewport();
      constrainHostToVisibleArea();
    }
    stableViewportSize = { width: viewport.width, height: viewport.height };
  }

  function scheduleViewportRecovery() {
    if (viewportRecoveryFrame) window.cancelAnimationFrame(viewportRecoveryFrame);
    window.clearTimeout(viewportRecoveryTimer);
    viewportRecoveryFrame = window.requestAnimationFrame(recoverAfterViewportChange);
    // Mobile browsers report the final visual viewport shortly after orientation change.
    viewportRecoveryTimer = window.setTimeout(recoverAfterViewportChange, 180);
  }

  function beginAvatarDrag(event) {
    if (event.button !== 0) return;
    const rect = host.getBoundingClientRect();
    dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveAvatarDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) < 5) return;
    dragState.moved = true;
    const bounds = getDragBounds();
    host.style.left = `${clamp(dragState.left + deltaX, bounds.minimumLeft, bounds.maximumLeft)}px`;
    host.style.top = `${clamp(dragState.top + deltaY, bounds.minimumTop, bounds.maximumTop)}px`;
    host.style.bottom = 'auto';
    host.classList.add('is-dragging');
    fitDialogIntoViewport();
  }

  function endAvatarDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    suppressAvatarClick = dragState.moved;
    dragState = undefined;
    host.classList.remove('is-dragging');
    if (suppressAvatarClick) window.setTimeout(() => { suppressAvatarClick = false; }, 0);
  }

  function addMessage(type, html) {
    const row = document.createElement('article');
    row.className = `shg-assistant-message${type === 'user' ? ' is-user' : ''}`;
    row.innerHTML = `<b aria-hidden="true">${type === 'user' ? '我' : '拾'}</b><p>${html}</p>`;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function loadCoursewareGuides() {
    if (guideLoadPromise) return guideLoadPromise;
    const guideUrl = String(config.guideUrl || './shg-courseware-guides.json');
    guideLoadPromise = window.fetch(guideUrl, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`Unable to load courseware guides: ${response.status}`);
        return response.json();
      })
      .then(payload => {
        const guides = Array.isArray(payload?.guides) ? payload.guides : [];
        for (const guide of guides) {
          const subjectKey = String(guide?.subjectKey || '').trim();
          const cardId = String(guide?.cardId || '').trim();
          if (subjectKey && cardId) guideIndex.set(`${subjectKey}:${cardId}`, guide);
        }
        guideIndexVersion += 1;
      })
      .catch(() => undefined);
    return guideLoadPromise;
  }

  function getCoursewareGuide(context) {
    if (context.scope === 'catalog') {
      return {
        isWelcome: true,
        intro: `你好，我是小拾光。选一张${subjectName}课件开始学习吧；进入课件后，我会帮你梳理关键概念和操作方法。`,
        concepts: [],
        questions: []
      };
    }
    const title = context.title || '当前课件';
    const subjectKey = String(config.subjectKey || '');
    const record = guideIndex.get(`${subjectKey}:${context.cardId}`)
      || [...guideIndex.values()].find(item => item.subjectKey === subjectKey && item.title === title);
    if (record?.usageGuide) {
      const guide = record.usageGuide;
      return {
        intro: String(guide.overview || '请结合课件画面与操作面板进行观察。'),
        concepts: (record.concepts || []).slice(0, 5),
        questions: [
          `《${title}》应怎样开始操作？`,
          `《${title}》需要重点观察什么？`
        ]
      };
    }
    return {
      intro: '先观察画面中可以改变的条件，再说明变化过程和得到的结论。',
      concepts: [title, '关键条件', '变化关系'],
      questions: [`《${title}》的核心概念是什么？`, '画面中应先观察哪一步？']
    };
  }

  function renderCoursewareGuide(context) {
    const key = `${config.subjectKey || ''}|${context.scope || ''}|${context.cardId}|${context.title}|${guideIndexVersion}`;
    if (key === guideContextKey && messages.childElementCount) return;
    guideContextKey = key;
    input.value = '';
    input.style.height = 'auto';
    const guide = getCoursewareGuide(context);
    dialog.classList.toggle('is-welcome', Boolean(guide.isWelcome));
    const row = document.createElement('article');
    row.className = 'shg-assistant-message shg-assistant-guide';
    row.innerHTML = guide.isWelcome
      ? `<b aria-hidden="true">拾</b><div class="shg-assistant-guide-content"><p><strong>小拾光</strong><span>${escapeHtml(guide.intro)}</span></p></div>`
      : `<b aria-hidden="true">拾</b><div class="shg-assistant-guide-content"><p><strong>${escapeHtml(context.title || '当前课件')}</strong><span>${escapeHtml(guide.intro)}</span></p><div class="shg-assistant-questions"></div></div>`;
    const questions = row.querySelector('.shg-assistant-questions');
    guide.questions.forEach(question => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = question;
      button.addEventListener('click', () => {
        input.value = question;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      });
      questions.appendChild(button);
    });
    messages.replaceChildren(row);
    messages.scrollTop = 0;
    loadCoursewareGuides().then(() => {
      if (!dialog.hidden && !messages.querySelector('.shg-assistant-message.is-user')) {
        renderCoursewareGuide(getContext());
      }
    });
  }

  function formatAnswerBody(answer) {
    const text = String(answer || '').trim();
    const paragraphs = text.split(/\n{2,}/).map(item => item.trim()).filter(Boolean);
    return paragraphs.length
      ? paragraphs.map(paragraph => escapeHtml(paragraph).replace(/\n/g, '<br>')).join('<br><br>')
      : '暂时没有获得可用回答。';
  }

  function formatAnswer(answer, context) {
    const body = formatAnswerBody(answer);
    const source = context.scope === 'catalog' ? '学习问题' : `当前课件：${context.title || '课程内容'}`;
    return `${body}<span class="shg-assistant-source">${escapeHtml(source)}</span>`;
  }

  function createAnswerPayload(question, context) {
    return {
      question,
      subjectKey: String(config.subjectKey || ''),
      subjectName,
      cardId: String(context.cardId || ''),
      title: String(context.title || ''),
      scope: String(context.scope || 'catalog')
    };
  }

  async function requestAnswer(question, context) {
    const answerUrl = String(config.answerUrl || '/api/unified/learning-assistant/answer');
    const controller = typeof AbortController === 'function' ? new AbortController() : undefined;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 30000) : undefined;
    try {
      const response = await window.fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createAnswerPayload(question, context)),
        signal: controller?.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok || !String(payload.answer || '').trim()) {
        throw new Error(String(payload?.message || `Request failed: ${response.status}`));
      }
      return String(payload.answer).trim();
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  }

  async function requestStreamingAnswer(question, context, onDelta) {
    if (typeof window.ReadableStream !== 'function' || typeof window.TextDecoder !== 'function') {
      const answer = await requestAnswer(question, context);
      onDelta(answer);
      return answer;
    }

    const answerUrl = String(config.answerUrl || '/api/unified/learning-assistant/answer');
    const streamUrl = String(config.streamUrl || `${answerUrl.replace(/\/$/, '')}/stream`);
    const controller = typeof AbortController === 'function' ? new AbortController() : undefined;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 30000) : undefined;
    let answer = '';
    let eventBuffer = '';
    let completed = false;

    function processEvent(block) {
      let eventName = 'message';
      const dataLines = [];
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      }
      if (!dataLines.length) return;
      const payload = JSON.parse(dataLines.join('\n'));
      if (eventName === 'delta') {
        const text = String(payload?.text || '');
        if (!text) return;
        answer += text;
        onDelta(answer);
        return;
      }
      if (eventName === 'done') {
        completed = true;
        return;
      }
      if (eventName === 'error') throw new Error(String(payload?.message || 'learning_assistant_unavailable'));
    }

    try {
      const response = await window.fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(createAnswerPayload(question, context)),
        signal: controller?.signal
      });
      if (!response.ok || !response.body?.getReader) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        eventBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const blocks = eventBuffer.split(/\r?\n\r?\n/);
        eventBuffer = blocks.pop() || '';
        for (const block of blocks) processEvent(block);
        if (done) break;
      }
      if (eventBuffer.trim()) processEvent(eventBuffer);
      if (!completed || !answer.trim()) throw new Error('learning_assistant_incomplete_stream');
      return answer.trim();
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  }

  async function submitQuestion(raw) {
    const question = String(raw || '').trim();
    if (!question) return;
    const context = getContext();
    dialog.classList.remove('is-welcome');
    addMessage('user', escapeHtml(question));
    input.value = '';
    input.style.height = 'auto';
    setMotion('think');
    window.dispatchEvent(new CustomEvent('shg:learning-assistant-question', { detail: { subjectKey: config.subjectKey || '', subjectName, cardId: context.cardId, coursewareTitle: context.title, question } }));
    const answerRow = addMessage('assistant', '');
    const answerContent = answerRow.querySelector('p');
    try {
      const answer = await requestStreamingAnswer(question, context, partialAnswer => {
        answerContent.innerHTML = formatAnswerBody(partialAnswer);
        messages.scrollTop = messages.scrollHeight;
      });
      answerContent.innerHTML = formatAnswer(answer, context);
      setMotion('speak');
      window.setTimeout(() => { if (motion === 'speak') setMotion('idle'); }, 2200);
    } catch (error) {
      console.warn('小拾光问答请求失败。', error);
      answerContent.textContent = '小拾光暂时无法连接学习服务，请稍后再试。';
      setMotion('idle');
    }
  }

  function refreshVisibility() {
    const context = getContext();
    const nextHidden = !context.active;
    if (host.hidden !== nextHidden) host.hidden = nextHidden;
    if (!context.active) setDialogOpen(false);
    if (context.active && !dialog.hidden) renderCoursewareGuide(context);
  }

  function initAvatar(canvas) {
    if (!window.THREE || !window.THREE.GLTFLoader) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 1.5, 10.8);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputEncoding = THREE.sRGBEncoding;
    const avatar = new THREE.Group();
    // The supplied model has no skeleton, so gesture through the model's shared transform space.
    const motionRig = new THREE.Group();
    avatar.add(motionRig);
    scene.add(avatar);
    const lookTarget = new THREE.Vector3(0, 0.45, 0);
    camera.lookAt(lookTarget);
    scene.add(new THREE.HemisphereLight(0xe8fffb, 0xf8e0cb, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(3.5, 5.5, 7); scene.add(key);
    const fill = new THREE.DirectionalLight(0x7dd3fc, 0.55); fill.position.set(-4, 1, 3); scene.add(fill);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.75, 32), new THREE.MeshBasicMaterial({ color: 0x0f3e43, transparent: true, opacity: 0.14 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -2.02;
    scene.add(shadow);

    const loader = new THREE.GLTFLoader();
    loader.load(String(config.avatarModelUrl || './shg-learning-assistant-model.glb'), gltf => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const largestDimension = Math.max(size.x, size.y, size.z) || 1;
      const scale = 4.15 / largestDimension;
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale - 2.02, -center.z * scale);
      model.traverse(node => {
        if (!node.isMesh) return;
        node.castShadow = false;
        node.frustumCulled = true;
      });
      motionRig.add(model);
    }, undefined, error => {
      console.warn('学习助手模型加载失败。', error);
    });
    let renderWidth = 0;
    let renderHeight = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (width === renderWidth && height === renderHeight) return;
      renderWidth = width;
      renderHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let lastFrameAt = 0;
    const draw = now => {
      requestAnimationFrame(draw);
      if (host?.hidden || now - lastFrameAt < 33) return;
      lastFrameAt = now;
      resize();
      const seconds = now / 1000;
      const age = (now - motionStartedAt) / 1000;
      avatar.position.set(0, 0, 0);
      avatar.rotation.set(0, AVATAR_FRONT_Y, 0);
      avatar.scale.setScalar(1);
      motionRig.position.set(0, 0, 0);
      motionRig.rotation.set(0, 0, 0);
      motionRig.scale.setScalar(1);
      if (!prefersReducedMotion) {
        motionRig.position.y = Math.sin(seconds * 2.05) * 0.052;
        motionRig.rotation.z = Math.sin(seconds * 1.15) * 0.015;
        if (motion === 'wave') {
          const greetingStrength = Math.max(0, 1 - Math.max(0, age - 1.05) / 0.45);
          motionRig.position.y += Math.sin(age * 10) * 0.115 * greetingStrength;
          motionRig.rotation.z += Math.sin(age * 7.2) * 0.08 * greetingStrength;
          avatar.rotation.y += Math.sin(age * 6.5) * 0.16 * greetingStrength;
          if (age > 1.5) setMotion('idle');
        } else if (motion === 'think') {
          motionRig.rotation.z = 0.095;
          avatar.rotation.y = AVATAR_FRONT_Y - 0.19;
        } else if (motion === 'speak') {
          motionRig.position.y += Math.sin(seconds * 5.5) * 0.043;
          motionRig.rotation.x = Math.sin(seconds * 5.5) * 0.038;
          motionRig.rotation.z += Math.sin(seconds * 3.2) * 0.032;
          motionRig.scale.set(1.018, 0.988, 1.018);
        }
      }
      renderer.render(scene, camera);
    };
    requestAnimationFrame(draw);
  }

  function init() {
    if (document.getElementById('shgLearningAssistant')) return;
    host = document.createElement('section');
    host.id = 'shgLearningAssistant';
    host.hidden = true;
    host.setAttribute('aria-label', '小拾光学习助手');
    host.innerHTML = `
      <button class="shg-assistant-avatar" type="button" aria-label="打开小拾光学习助手"><canvas aria-hidden="true"></canvas></button>
      <section class="shg-assistant-dialog" aria-label="学习问答" hidden>
        <button class="shg-assistant-close" type="button" aria-label="关闭对话框">×</button>
        <div class="shg-assistant-messages"></div>
        <form class="shg-assistant-form"><textarea rows="1" maxlength="300" placeholder="输入你的学习问题" aria-label="输入你的学习问题" required></textarea><button class="shg-assistant-send" type="submit" aria-label="发送问题">↑</button></form>
      </section>`;
    document.body.appendChild(host);
    dialog = host.querySelector('.shg-assistant-dialog'); messages = host.querySelector('.shg-assistant-messages'); input = host.querySelector('textarea');
    const avatar = host.querySelector('.shg-assistant-avatar');
    avatar.addEventListener('pointerdown', beginAvatarDrag);
    avatar.addEventListener('pointermove', moveAvatarDrag);
    avatar.addEventListener('pointerup', endAvatarDrag);
    avatar.addEventListener('pointercancel', endAvatarDrag);
    avatar.addEventListener('click', event => { if (suppressAvatarClick) { event.preventDefault(); return; } setDialogOpen(true); setMotion('wave'); });
    host.querySelector('.shg-assistant-close').addEventListener('click', () => setDialogOpen(false));
    host.querySelector('form').addEventListener('submit', event => { event.preventDefault(); submitQuestion(input.value); });
    input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 92)}px`; });
    input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitQuestion(input.value); } });
    input.addEventListener('pointerdown', beginKeyboardSession);
    input.addEventListener('focus', beginKeyboardSession);
    input.addEventListener('blur', scheduleKeyboardRestore);
    initAvatar(host.querySelector('canvas'));
    window.addEventListener('resize', scheduleViewportRecovery);
    window.addEventListener('orientationchange', scheduleViewportRecovery);
    window.visualViewport?.addEventListener('resize', scheduleViewportRecovery);
    stableViewportSize = { width: getVisibleViewportBounds().width, height: getVisibleViewportBounds().height };
    window.setInterval(refreshVisibility, 500);
    refreshVisibility();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
}());

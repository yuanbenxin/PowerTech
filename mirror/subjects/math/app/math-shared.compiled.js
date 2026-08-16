/*
  Shared runtime helpers for the math curriculum app.
  Card content is indexed by 课程架构数据.json and split into per-book JSON files.
*/

window.MathApp = window.MathApp || {};
(() => {
  const {
    useState,
    useMemo,
    useEffect,
    useRef
  } = React;
  const DEFAULTS = {
    stage: 'junior',
    book: 'all',
    contentMode: 'all'
  };
  const COURSE_DATA_PATH = '%E8%AF%BE%E7%A8%8B%E6%9E%B6%E6%9E%84%E6%95%B0%E6%8D%AE.json';
  const VISUAL_MANIFEST_PATH = 'visualizations/manifest.json';
  const LANDING_VIDEO_PATH = 'assets/media/Flow_202605092151.mp4';
  const DEFAULT_MATH_MEDIA_BASE = '';
  const MATH_RUNTIME = typeof window !== 'undefined' ? window.__SHG_MATH_RUNTIME__ || {} : {};
  const MATH_MEDIA_BASE = normalizeRemoteMediaBase(MATH_RUNTIME.mediaBase ?? MATH_RUNTIME.MEDIA_BASE ?? DEFAULT_MATH_MEDIA_BASE);
  const BOOK_BACKGROUND_MAP = {
    j7a: 'assets/media/math_card_bg_platinum.webp',
    j7b: 'assets/media/math_card_bg_platinum.webp',
    j8a: 'assets/media/math_card_bg_platinum.webp',
    j8b: 'assets/media/math_card_bg_platinum.webp',
    j9a: 'assets/media/math_card_bg_platinum.webp',
    j9b: 'assets/media/math_card_bg_platinum.webp',
    jm_topic: 'assets/media/math_card_bg_platinum.webp',
    jm_model: 'assets/media/math_card_bg_platinum.webp',
    s_b1: 'assets/media/math_card_bg_senior.webp',
    s_b2: 'assets/media/math_card_bg_senior.webp',
    s_x1: 'assets/media/math_card_bg_senior.webp',
    s_x2: 'assets/media/math_card_bg_senior.webp',
    s_x3: 'assets/media/math_card_bg_senior.webp',
    sm_topic: 'assets/media/math_card_bg_senior.webp',
    sm_model: 'assets/media/math_card_bg_senior.webp'
  };
  const LANDING_PANELS = {
    junior: {
      label: '初中',
      img: 'assets/media/math_card_bg_platinum.webp',
      title: '初中数学',
      desc: '几何变换、代数基础与逻辑推理的启蒙。',
      accentClasses: {
        badge: 'border-slate-400/30 text-slate-300 bg-slate-400/5',
        action: 'text-slate-300'
      }
    },
    senior: {
      label: '高中',
      img: 'assets/media/math_card_bg_senior.webp',
      title: '高中数学',
      desc: '直击函数、导数、立体几何的核心建模舱。',
      accentClasses: {
        badge: 'border-slate-500/30 text-slate-400 bg-slate-500/5',
        action: 'text-slate-400'
      }
    }
  };
  const DEFAULT_CARD_IMAGE_BY_BOOK = {
    j7a: 'assets/media/math_card_bg_platinum.webp',
    j7b: 'assets/media/math_card_bg_platinum.webp',
    j8a: 'assets/media/math_card_bg_platinum.webp',
    j8b: 'assets/media/math_card_bg_platinum.webp',
    j9a: 'assets/media/math_card_bg_platinum.webp',
    j9b: 'assets/media/math_card_bg_platinum.webp',
    jm_topic: 'assets/media/math_card_bg_platinum.webp',
    jm_model: 'assets/media/math_card_bg_platinum.webp',
    s_b1: 'assets/media/math_card_bg_senior.webp',
    s_b2: 'assets/media/math_card_bg_senior.webp',
    s_x1: 'assets/media/math_card_bg_senior.webp',
    s_x2: 'assets/media/math_card_bg_senior.webp',
    s_x3: 'assets/media/math_card_bg_senior.webp',
    sm_topic: 'assets/media/math_card_bg_senior.webp',
    sm_model: 'assets/media/math_card_bg_senior.webp'
  };
  const SCENE_SCRIPT_CACHE = new Map();
  const LANDSCAPE_VIEWPORTS = {
    compact: {
      id: 'compact',
      minWidth: 1040,
      minHeight: 586,
      maxWidth: 1240,
      maxHeight: 700,
      padding: 12
    },
    standard: {
      id: 'standard',
      minWidth: 1240,
      minHeight: 690,
      maxWidth: 1480,
      maxHeight: 820,
      padding: 16
    },
    wide: {
      id: 'wide',
      minWidth: 1400,
      minHeight: 760,
      maxWidth: 1680,
      maxHeight: 920,
      padding: 18
    },
    ultrawide: {
      id: 'ultrawide',
      minWidth: 1480,
      minHeight: 760,
      maxWidth: 1820,
      maxHeight: 920,
      padding: 20
    }
  };
  const ENGINE_STUDY_TIPS = {
    microscope: ['按低倍找物、细调清晰、高倍确认的顺序观察，避免一开始就直接切高倍镜。', '先辨认结构位置，再判断名称和功能，效率会更高。', '画面不清晰时优先检查对光、光圈和调焦顺序，不要反复盲目放大。'],
    dna: ['先抓住每个过程的起点、变化和结果，再去记忆名称和术语。', '遇到连续步骤时，重点区分结构变化和信息传递分别发生在哪里。', '如果概念偏抽象，先完整看一遍流程，再回头定位关键节点。'],
    specimen: ['先看整体结构，再逐步放大到关键部位，避免只盯住局部细节。', '把结构名称和对应功能连起来理解，会比单独背名称更稳。', '遇到相似部位时，优先比较它们的位置、外形和主要作用差异。']
  };
  const LOCAL_IMAGE_ROOTS = ['assets/media/'];
  function toKebabCase(name) {
    return String(name || '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  function unique(items) {
    return [...new Set((items || []).filter(Boolean))];
  }
  function clampNumber(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }
  function normalizeRemoteMediaBase(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/\/+$/, '') + '/';
  }
  function normalizeLocalAssetPath(path) {
    if (typeof path !== 'string') return '';
    let normalized = path.trim().replace(/\\/g, '/');
    if (!normalized) return '';
    if (/^(?:https?:)?\/\//i.test(normalized)) return '';
    if (/^(?:data|blob|javascript):/i.test(normalized)) return '';
    if (typeof window !== 'undefined' && window.location?.origin && normalized.startsWith(window.location.origin)) {
      normalized = normalized.slice(window.location.origin.length);
    }
    normalized = normalized.replace(/^\/+/, '').replace(/^\.\//, '');
    return normalized;
  }
  function isAllowedLocalAssetPath(path) {
    const normalized = normalizeLocalAssetPath(path);
    return LOCAL_IMAGE_ROOTS.some(root => normalized.startsWith(root));
  }
  function resolveLocalImagePath(path, fallbackPath = 'assets/media/math_card_bg_platinum.webp') {
    if (isAllowedLocalAssetPath(path)) {
      return normalizeLocalAssetPath(path);
    }
    if (isAllowedLocalAssetPath(fallbackPath)) {
      return normalizeLocalAssetPath(fallbackPath);
    }
    return 'assets/media/math_card_bg_platinum.webp';
  }
  function resolveLocalMediaKey(path, fallbackPath = 'assets/media/math_card_bg_platinum.webp') {
    if (isAllowedLocalAssetPath(path)) {
      return normalizeLocalAssetPath(path);
    }
    if (isAllowedLocalAssetPath(fallbackPath)) {
      return normalizeLocalAssetPath(fallbackPath);
    }
    return 'assets/media/math_card_bg_platinum.webp';
  }
  function encodeUrlPathSegments(path) {
    return String(path || '').split('/').filter(Boolean).map(segment => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch (error) {
        return encodeURIComponent(segment);
      }
    }).join('/');
  }
  function getMathBucketRelativePath(path) {
    const normalized = normalizeLocalAssetPath(path);
    if (!normalized) return '';
    if (normalized.startsWith('assets/media/')) {
      return normalized.slice('assets/media/'.length);
    }
    return '';
  }
  function resolveMathMediaPath(path, fallbackPath = 'assets/media/math_card_bg_platinum.webp') {
    const raw = String(path || '').trim();
    if (!raw) return resolveMathMediaPath(fallbackPath, 'assets/media/math_card_bg_platinum.webp');
    if (/^(?:https?:)?\/\//i.test(raw) || /^(?:data|blob|javascript):/i.test(raw)) return raw;
    const bucketRelativePath = getMathBucketRelativePath(raw);
    if (MATH_MEDIA_BASE && bucketRelativePath) {
      return `${MATH_MEDIA_BASE}${encodeUrlPathSegments(bucketRelativePath)}`;
    }
    const fallbackKey = resolveLocalMediaKey(fallbackPath, 'assets/media/math_card_bg_platinum.webp');
    const fallbackRelativePath = getMathBucketRelativePath(fallbackKey);
    if (MATH_MEDIA_BASE && fallbackRelativePath) {
      return `${MATH_MEDIA_BASE}${encodeUrlPathSegments(fallbackRelativePath)}`;
    }
    return resolveLocalImagePath(raw, fallbackPath);
  }
  function normalizeThumbnailWidth(value, fallback = 720) {
    const width = Number(value);
    if (!Number.isFinite(width) || width <= 0) return fallback;
    return Math.min(Math.max(Math.round(width), 64), 3840);
  }
  function appendCosImageThumbnail(url, options = {}) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw)) return raw;
    if (!/\.(?:png|jpe?g|webp|avif)(?:[?#]|$)/i.test(raw)) return raw;
    if (/[?&](?:imageMogr2|style=)/i.test(raw)) return raw;
    const width = normalizeThumbnailWidth(typeof options === 'number' ? options : options.width);
    const separator = raw.includes('?') ? '&' : '?';
    return `${raw}${separator}imageMogr2/thumbnail/${width}x/ignore-error/1`;
  }
  function resolveMathMediaThumbnailPath(path, fallbackPath = 'assets/media/math_card_bg_platinum.webp', options = {}) {
    return appendCosImageThumbnail(resolveMathMediaPath(path, fallbackPath), options);
  }
  function applyMediaSource(target, src) {
    const nextSrc = String(src || '').trim();
    if (!target || !nextSrc) return;
    target.setAttribute('src', nextSrc);
    if (String(target.tagName || '').toLowerCase() === 'video' && typeof target.load === 'function') {
      try {
        target.load();
      } catch (error) {}
    }
  }
  function handleLocalImageError(event, fallbackPath = 'assets/media/math_card_bg_platinum.webp') {
    const target = event?.currentTarget;
    if (!target) return;
    const fallback = resolveMathMediaPath(fallbackPath, 'assets/media/math_card_bg_platinum.webp');
    if (target.dataset.localFallbackApplied === 'true' || target.getAttribute('src') === fallback) {
      target.removeAttribute('src');
      return;
    }
    target.dataset.localFallbackApplied = 'true';
    target.src = fallback;
  }
  function handleMathMediaError(event, fallbackPath = 'assets/media/math_card_bg_platinum.webp') {
    const target = event?.currentTarget;
    if (!target) return;
    const fallback = resolveLocalImagePath(fallbackPath, 'assets/media/math_card_bg_platinum.webp');
    const currentSrc = String(target.getAttribute('src') || '').trim();
    if (!fallback || target.dataset.localFallbackApplied === 'true' || currentSrc === fallback) {
      target.removeAttribute('src');
      return;
    }
    target.dataset.localFallbackApplied = 'true';
    applyMediaSource(target, fallback);
  }
  function getStage(courseData, stageId) {
    if (!courseData?.stages?.length) return null;
    return courseData.stages.find(stage => stage.id === stageId) || courseData.stages[0];
  }
  function getViewportSize() {
    const viewport = window.visualViewport;
    return {
      width: Math.max(0, Math.round(viewport?.width || window.innerWidth || 0)),
      height: Math.max(0, Math.round(viewport?.height || window.innerHeight || 0))
    };
  }
  function resolveLandscapeFrame(viewport) {
    const width = Math.max(0, Math.round(viewport?.width || 0));
    const height = Math.max(0, Math.round(viewport?.height || 0));
    const aspectRatio = width / Math.max(height, 1);
    const isPortrait = height > width;
    const narrowPortrait = isPortrait;
    let preset = LANDSCAPE_VIEWPORTS.standard;
    if (width < 1180 || height < 680) {
      preset = LANDSCAPE_VIEWPORTS.compact;
    } else if (aspectRatio >= 2.05 && width >= 1440) {
      preset = LANDSCAPE_VIEWPORTS.ultrawide;
    } else if (width >= 1500 || height >= 860) {
      preset = LANDSCAPE_VIEWPORTS.wide;
    }
    const availableWidth = Math.max(0, width - preset.padding * 2);
    const availableHeight = Math.max(0, height - preset.padding * 2);
    const frameWidth = availableWidth > 0 ? Math.min(availableWidth, preset.maxWidth) : preset.minWidth;
    const frameHeight = availableHeight > 0 ? Math.min(availableHeight, preset.maxHeight) : preset.minHeight;
    const dense = frameWidth <= 1260 || frameHeight <= 700;
    const shortHeight = frameHeight <= 660;
    const tinyLandscape = !isPortrait && (width <= 980 || height <= 460);
    const roomy = frameWidth >= 1520 && frameHeight >= 780;
    const ultraWide = aspectRatio >= 2.05;
    return {
      ...preset,
      width: frameWidth,
      height: frameHeight,
      availableWidth,
      availableHeight,
      aspectRatio,
      orientation: isPortrait ? 'portrait' : 'landscape',
      isPortrait,
      narrowPortrait,
      dense,
      compact: dense,
      shortHeight,
      roomy,
      ultraWide,
      cardColumns: narrowPortrait ? frameWidth >= 720 ? 3 : frameWidth >= 350 ? 2 : 1 : ultraWide || frameWidth >= 1440 ? 4 : dense ? 2 : 3,
      detailAsideWidth: narrowPortrait ? Math.min(frameWidth, 320) : tinyLandscape ? 236 : shortHeight ? 264 : ultraWide ? 396 : roomy ? 372 : dense ? 284 : 320,
      coursewareAsideWidth: narrowPortrait ? frameWidth : tinyLandscape ? 248 : shortHeight ? 280 : ultraWide ? 392 : roomy ? 368 : dense ? 300 : 320,
      shellPaddingX: narrowPortrait ? Math.max(6, Math.min(10, Math.round(width * 0.025))) : tinyLandscape ? 14 : ultraWide ? 44 : roomy ? 36 : dense ? 20 : 32,
      shellPaddingY: narrowPortrait ? 6 : tinyLandscape ? 10 : ultraWide ? 28 : shortHeight ? 14 : dense ? 18 : 24,
      panelGap: narrowPortrait ? 6 : tinyLandscape ? 12 : ultraWide ? 30 : roomy ? 26 : shortHeight ? 16 : dense ? 20 : 24,
      tinyLandscape
    };
  }
  function useLandscapeViewport() {
    const [viewport, setViewport] = useState(() => getViewportSize());
    useEffect(() => {
      let frame = null;
      const updateViewport = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          setViewport(getViewportSize());
        });
      };
      updateViewport();
      window.addEventListener('resize', updateViewport);
      window.addEventListener('orientationchange', updateViewport);
      window.visualViewport?.addEventListener('resize', updateViewport);
      return () => {
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener('resize', updateViewport);
        window.removeEventListener('orientationchange', updateViewport);
        window.visualViewport?.removeEventListener('resize', updateViewport);
      };
    }, []);
    const frame = resolveLandscapeFrame(viewport);
    const isLandscape = viewport.width >= viewport.height;
    const availableWidth = Math.max(0, viewport.width - frame.padding * 2);
    const availableHeight = Math.max(0, viewport.height - frame.padding * 2);
    const scale = isLandscape ? Math.min(availableWidth / frame.width, availableHeight / frame.height, 1) : 1;
    return {
      width: viewport.width,
      height: viewport.height,
      isLandscape,
      isPortrait: !isLandscape,
      scale: Math.max(scale, 0),
      frame,
      compact: frame.compact,
      dense: frame.dense,
      shortHeight: frame.shortHeight,
      roomy: frame.roomy,
      ultraWide: frame.ultraWide
    };
  }
  function useTouchCardActivation(onActivate, options = {}) {
    const activateRef = useRef(onActivate);
    const primeTimerRef = useRef(null);
    const touchPrimedRef = useRef(false);
    const touchStartedPrimedRef = useRef(false);
    const suppressNextClickRef = useRef(false);
    const lastTouchAtRef = useRef(0);
    const [isPressed, setIsPressed] = useState(false);
    const [isTouchPrimed, setIsTouchPrimed] = useState(false);
    const buttonRef = useRef(null);
    useEffect(() => {
      activateRef.current = onActivate;
    }, [onActivate]);
    useEffect(() => () => {
      if (primeTimerRef.current) {
        window.clearTimeout(primeTimerRef.current);
      }
    }, []);
    const clearTouchPrime = () => {
      touchPrimedRef.current = false;
      setIsTouchPrimed(false);
      if (primeTimerRef.current) {
        window.clearTimeout(primeTimerRef.current);
        primeTimerRef.current = null;
      }
    };
    const primeTouch = () => {
      touchPrimedRef.current = true;
      setIsTouchPrimed(true);
      if (primeTimerRef.current) {
        window.clearTimeout(primeTimerRef.current);
      }
      const timeoutMs = Number(options.primeTimeoutMs || 1800);
      primeTimerRef.current = window.setTimeout(clearTouchPrime, Math.max(800, timeoutMs));
    };
    const activate = event => {
      if (event?.preventDefault) event.preventDefault();
      if (typeof activateRef.current === 'function') {
        activateRef.current(event);
      }
    };
    const handlePointerDown = event => {
      if (event?.pointerType === 'touch') return;
      setIsPressed(true);
    };
    const handlePointerUp = event => {
      if (event?.pointerType === 'touch') return;
      setIsPressed(false);
    };
    const handlePointerLeave = () => {
      setIsPressed(false);
    };
    const handlePointerCancel = () => {
      setIsPressed(false);
    };
    const handleBlur = () => {
      setIsPressed(false);
      clearTouchPrime();
    };
    const handleTouchStart = () => {
      lastTouchAtRef.current = Date.now();
      touchStartedPrimedRef.current = touchPrimedRef.current;
      setIsPressed(true);
      if (!touchPrimedRef.current) {
        primeTouch();
      }
    };
    const handleTouchEnd = event => {
      setIsPressed(false);
      suppressNextClickRef.current = true;
      if (touchStartedPrimedRef.current) {
        clearTouchPrime();
        activate(event);
      }
    };
    const handleTouchCancel = () => {
      setIsPressed(false);
      suppressNextClickRef.current = true;
    };
    const handleClick = event => {
      const wasRecentTouch = Date.now() - lastTouchAtRef.current < 700;
      if (suppressNextClickRef.current || wasRecentTouch) {
        suppressNextClickRef.current = false;
        if (event?.preventDefault) event.preventDefault();
        return;
      }
      clearTouchPrime();
      activate(event);
    };
    return {
      buttonRef,
      isPressed,
      isTouchPrimed,
      handleClick,
      handlePointerDown,
      handlePointerUp,
      handlePointerLeave,
      handlePointerCancel,
      handleBlur,
      handleTouchStart,
      handleTouchEnd,
      handleTouchCancel
    };
  }
  function createCardDetails(mapping, chapterMap) {
    const chapters = (mapping.chapterIds || []).map(id => chapterMap[id]).filter(Boolean);
    const topics = unique(chapters.flatMap(chapter => chapter.sampleTopics || []));
    const mappingTags = Array.isArray(mapping.tags) ? mapping.tags : [];
    const mappingPoints = Array.isArray(mapping.points) ? mapping.points : [];
    const fallbackImage = DEFAULT_CARD_IMAGE_BY_BOOK[mapping.bookId] || 'assets/media/math_card_bg_platinum.webp';
    return {
      id: mapping.cardId,
      title: mapping.title,
      chapterIds: mapping.chapterIds || [],
      detail: mapping.detail || `探索 ${mapping.title} 的核心数学学概念。`,
      tags: unique([...mappingTags, ...topics]).slice(0, 4),
      icon: mapping.icon || 'BookOpen',
      abstract: mapping.abstract || `本模块聚焦于 ${mapping.title} 的结构、过程与演化规律。`,
      points: mappingPoints.length ? mappingPoints : topics.slice(0, 4),
      image: resolveLocalMediaKey(mapping.image, fallbackImage),
      fallbackImage,
      engine: mapping.engine || 'specimen'
    };
  }
  function buildCoursewareGuide(card, sceneEntry) {
    const focusPoints = unique(Array.isArray(card?.points) ? card.points : []).slice(0, 3);
    const summary = String(card?.detail || card?.title || '').replace(/\s+/g, ' ').trim();
    const tips = ENGINE_STUDY_TIPS[sceneEntry?.engine || card?.engine] || ENGINE_STUDY_TIPS.specimen;
    return {
      summary: summary.length > 30 ? `${summary.slice(0, 30)}...` : summary,
      focusPoints: focusPoints.length ? focusPoints : ['结合当前可视化内容，先梳理核心概念，再定位关键结构或关键过程。'],
      tips: tips.slice(0, 2)
    };
  }
  async function fetchJsonSafe(path) {
    try {
      const response = await fetch(appendRuntimeVersion(path), {
        cache: 'no-store'
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  }
  function getRuntimeBuildVersion() {
    const runtime = window.__SHG_MATH_RUNTIME__ || MATH_RUNTIME || {};
    const explicitVersion = String(runtime.buildVersion || runtime.BUILD_VERSION || window.SHIGUANG_BUILD_VERSION || window.__SHIGUANG_BUILD_VERSION__ || window.__BUILD_VERSION__ || '').trim();
    if (explicitVersion && !/^__.*__$/.test(explicitVersion)) return explicitVersion;
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    for (const script of scripts) {
      const src = String(script.getAttribute('src') || '');
      if (!/(^|\/)math-(shared|entry|scene-components|layout-components)(?:\.compiled)?\.js(?:\?|$)/.test(src)) continue;
      try {
        const version = new URL(src, window.location.href).searchParams.get('v');
        if (version) return version;
      } catch (error) {}
    }
    return '';
  }
  function appendRuntimeVersion(path) {
    if (!path || /^(?:data|blob|javascript):/i.test(String(path))) return path;
    const manifestUrl = resolveRuntimeManifestUrl(path);
    if (manifestUrl) return manifestUrl;
    const version = getRuntimeBuildVersion();
    if (!version) return path;
    try {
      const url = new URL(path, window.location.href);
      if (!url.searchParams.has('v')) url.searchParams.set('v', version);
      return url.href;
    } catch (error) {
      const separator = String(path || '').includes('?') ? '&' : '?';
      return `${path}${separator}v=${encodeURIComponent(version)}`;
    }
  }
  function getRuntimeAssetManifest() {
    const runtime = window.__SHG_MATH_RUNTIME__ || MATH_RUNTIME || {};
    return runtime.assetManifest || runtime.ASSET_MANIFEST || {};
  }
  function normalizeRuntimeManifestKey(value) {
    let raw = String(value || '').trim();
    if (!raw || /^(?:data|blob|javascript|mailto|tel):/i.test(raw) || raw.startsWith('#')) return '';
    try {
      const url = new URL(raw, window.location.href);
      if (url.origin !== window.location.origin) return '';
      raw = url.pathname.replace(/^\/+/, '');
    } catch (error) {
      raw = raw.split('#')[0].split('?')[0];
    }
    raw = raw.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
    return raw.replace(/^subjects\/math\//, '');
  }
  function resolveRuntimeManifestUrl(path) {
    const manifest = getRuntimeAssetManifest();
    if (!manifest || typeof manifest !== 'object') return '';
    const raw = String(path || '');
    const hashIndex = raw.indexOf('#');
    const hash = hashIndex >= 0 ? raw.slice(hashIndex) : '';
    const beforeHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
    const queryIndex = beforeHash.indexOf('?');
    const originalQuery = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '';
    const key = normalizeRuntimeManifestKey(raw);
    if (!key) return '';
    const mapped = manifest[key] || manifest[`./${key}`] || manifest[`/${key}`];
    if (!mapped) return '';
    try {
      const mappedUrl = new URL(mapped, window.location.href);
      const originalParams = new URLSearchParams(originalQuery);
      originalParams.forEach((value, name) => {
        if (name !== 'v' && !mappedUrl.searchParams.has(name)) mappedUrl.searchParams.set(name, value);
      });
      if (hash && !mappedUrl.hash) mappedUrl.hash = hash.slice(1);
      return mappedUrl.href;
    } catch (error) {
      return mapped;
    }
  }
  async function loadCourseData() {
    const courseIndex = await fetchJsonSafe(COURSE_DATA_PATH);
    if (!courseIndex) return null;
    if (courseIndex.splitBy !== 'book') {
      return courseIndex;
    }
    const stageEntries = Array.isArray(courseIndex.stages) ? courseIndex.stages : [];
    const pendingBooks = stageEntries.flatMap(stageEntry => (stageEntry.books || []).map(bookEntry => ({
      stageId: stageEntry.id,
      stageLabel: stageEntry.label,
      bookMeta: bookEntry
    })));
    const bookPayloads = await Promise.all(pendingBooks.map(async entry => {
      const payload = await fetchJsonSafe(entry.bookMeta.dataPath);
      if (!payload?.book) {
        return {
          ...entry,
          missing: true
        };
      }
      return {
        ...entry,
        missing: false,
        book: {
          ...payload.book,
          id: payload.book.id || entry.bookMeta.id,
          label: payload.book.label || entry.bookMeta.label || entry.bookMeta.id,
          stageId: payload.book.stageId || entry.stageId,
          stageLabel: payload.book.stageLabel || entry.stageLabel,
          chapters: Array.isArray(payload.book.chapters) ? payload.book.chapters : []
        },
        currentCardMapping: Array.isArray(payload.currentCardMapping) ? payload.currentCardMapping : []
      };
    }));
    const missingBooks = bookPayloads.filter(entry => entry.missing);
    if (missingBooks.length) {
      console.error('Failed to load split course book data:', missingBooks.map(entry => entry.bookMeta?.dataPath).filter(Boolean));
      return null;
    }
    const stages = stageEntries.map(stageEntry => ({
      id: stageEntry.id,
      label: stageEntry.label,
      books: bookPayloads.filter(entry => entry.stageId === stageEntry.id).map(entry => entry.book)
    }));
    return {
      version: courseIndex.version,
      updated: courseIndex.updated,
      splitBy: courseIndex.splitBy,
      ui: courseIndex.ui || {},
      stages,
      currentCardMapping: bookPayloads.flatMap(entry => (entry.currentCardMapping || []).map(mapping => ({
        ...mapping,
        stageId: entry.stageId,
        bookId: entry.book?.id || entry.bookMeta?.id
      })))
    };
  }
  function loadSceneScript(path) {
    if (!path) return Promise.resolve(false);
    const resolvedPath = (() => {
      try {
        return appendRuntimeVersion(new URL(path, window.location.href).href);
      } catch (error) {
        return appendRuntimeVersion(path);
      }
    })();
    if (SCENE_SCRIPT_CACHE.has(resolvedPath)) return SCENE_SCRIPT_CACHE.get(resolvedPath);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = resolvedPath;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        SCENE_SCRIPT_CACHE.delete(resolvedPath);
        script.remove();
        reject(new Error(`Failed to load scene script: ${path}`));
      };
      document.body.appendChild(script);
    });
    SCENE_SCRIPT_CACHE.set(resolvedPath, promise);
    return promise;
  }
  Object.assign(window.MathApp, {
    useState,
    useMemo,
    useEffect,
    useRef,
    DEFAULTS,
    COURSE_DATA_PATH,
    VISUAL_MANIFEST_PATH,
    LANDING_VIDEO_PATH,
    MATH_MEDIA_BASE,
    BOOK_BACKGROUND_MAP,
    LANDING_PANELS,
    DEFAULT_CARD_IMAGE_BY_BOOK,
    LOCAL_IMAGE_ROOTS,
    LANDSCAPE_VIEWPORTS,
    ENGINE_STUDY_TIPS,
    toKebabCase,
    unique,
    clampNumber,
    normalizeLocalAssetPath,
    isAllowedLocalAssetPath,
    resolveLocalImagePath,
    resolveLocalMediaKey,
    handleLocalImageError,
    resolveMathMediaPath,
    resolveMathMediaThumbnailPath,
    appendCosImageThumbnail,
    handleMathMediaError,
    getStage,
    getViewportSize,
    resolveLandscapeFrame,
    useLandscapeViewport,
    useTouchCardActivation,
    createCardDetails,
    buildCoursewareGuide,
    fetchJsonSafe,
    getRuntimeBuildVersion,
    appendRuntimeVersion,
    loadCourseData,
    loadSceneScript
  });
})();

/*
  Shared runtime helpers for the biology curriculum app.
  Card content is indexed by 课程架构数据.json and split into per-book JSON files.
*/

window.BiologyApp = window.BiologyApp || {};

(() => {
  const { useState, useMemo, useEffect, useRef } = React;

  const DEFAULTS = {
    stage: 'junior',
    book: 'all',
    contentMode: 'all'
  };

  const COURSE_DATA_PATH = '%E8%AF%BE%E7%A8%8B%E6%9E%B6%E6%9E%84%E6%95%B0%E6%8D%AE.json';
  const VISUAL_MANIFEST_PATH = 'visualizations/manifest.json';
  const LANDING_VIDEO_PATH = 'assets/entry/DNA_bg_video.mp4';
  const DEFAULT_BIOLOGY_MEDIA_BASE = 'https://wulikeshihua-1339740714.cos.ap-beijing.myqcloud.com/%E7%94%9F%E7%89%A9/';
  const BIOLOGY_RUNTIME = typeof window !== 'undefined' ? (window.__SHG_BIOLOGY_RUNTIME__ || {}) : {};
  const BIOLOGY_MEDIA_BASE = normalizeRemoteMediaBase(
    BIOLOGY_RUNTIME.mediaBase ?? BIOLOGY_RUNTIME.MEDIA_BASE ?? DEFAULT_BIOLOGY_MEDIA_BASE
  );
  const BIOLOGY_COURSEWARE_IMAGE_BASE = normalizeRemoteMediaBase(
    BIOLOGY_RUNTIME.coursewareImageBase ??
      BIOLOGY_RUNTIME.COURSEWARE_IMAGE_BASE ??
      `${BIOLOGY_MEDIA_BASE}courseware-images/`
  );
  const COURSEWARE_IMAGE_LOCAL_BASE = '/courseware-images/';

  const BOOK_BACKGROUND_MAP = {
    j7a: 'assets/bg_j7a.png',
    j7b: 'assets/bg_j7b.png',
    j8a: 'assets/bg_j8a.png',
    j8b: 'assets/bg_j8b.png',
    s_b1: 'assets/bg_s_b1.png',
    s_b2: 'assets/bg_s_b2.png',
    s_x1: 'assets/bg_s_x1.png',
    s_x2: 'assets/bg_s_x2.png',
    s_x3: 'assets/bg_s_x3.png'
  };

  const LANDING_PANELS = {
    junior: {
      label: '初中学段',
      img: 'assets/bg_j.png',
      title: '初中学段',
      desc: '从微观细胞到宏观生态系统，搭建扎实的生物学基础知识与实验能力。',
      accentClasses: {
        badge: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
        action: 'text-emerald-400'
      }
    },
    senior: {
      label: '高中学段',
      img: 'assets/bg_b1.png',
      title: '高中学段',
      desc: '深入分子遗传、稳态调节与生物工程，建立更完整的生命科学认知框架。',
      accentClasses: {
        badge: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
        action: 'text-blue-400'
      }
    }
  };

  const MODE_ICON_MAP = {
    all: 'assets/mode_all.png',
    lab: 'assets/mode_lab.png',
    interactive: 'assets/mode_interactive.png',
    dynamic: 'assets/mode_dynamic.png',
    card: 'assets/mode_card.png',
    exam: 'assets/mode_exam.png'
  };

  const DEFAULT_CARD_IMAGE_BY_BOOK = {
    j7a: 'assets/j_cell.png',
    j7b: 'assets/cover_human_systems.png',
    j8a: 'assets/cover_plant_structure.png',
    j8b: 'assets/cover_genetics_reproduction.png',
    s_b1: 'assets/cover_plant_cells.png',
    s_b2: 'assets/cover_mendel_genetics.png',
    s_x1: 'assets/cover_homeostasis_regulation.png',
    s_x2: 'assets/cover_biosphere_ecology.png',
    s_x3: 'assets/cover_biotech_microbiology.png'
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
    microscope: [
      '按低倍找物、细调清晰、高倍确认的顺序观察，避免一开始就直接切高倍镜。',
      '先辨认结构位置，再判断名称和功能，效率会更高。',
      '画面不清晰时优先检查对光、光圈和调焦顺序，不要反复盲目放大。'
    ],
    dna: [
      '先抓住每个过程的起点、变化和结果，再去记忆名称和术语。',
      '遇到连续步骤时，重点区分结构变化和信息传递分别发生在哪里。',
      '如果概念偏抽象，先完整看一遍流程，再回头定位关键节点。'
    ],
    specimen: [
      '先看整体结构，再逐步放大到关键部位，避免只盯住局部细节。',
      '把结构名称和对应功能连起来理解，会比单独背名称更稳。',
      '遇到相似部位时，优先比较它们的位置、外形和主要作用差异。'
    ]
  };

  const LOCAL_IMAGE_ROOTS = ['assets/', 'visualizations/'];
  const LOCAL_MEDIA_FILES = [LANDING_VIDEO_PATH];

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
    return LOCAL_IMAGE_ROOTS.some(root => normalized.startsWith(root)) || LOCAL_MEDIA_FILES.includes(normalized);
  }

  function resolveLocalImagePath(path, fallbackPath = 'assets/c1.png') {
    if (isAllowedLocalAssetPath(path)) {
      return normalizeLocalAssetPath(path);
    }

    if (isAllowedLocalAssetPath(fallbackPath)) {
      return normalizeLocalAssetPath(fallbackPath);
    }

    return 'assets/c1.png';
  }

  function resolveLocalMediaKey(path, fallbackPath = 'assets/c1.png') {
    if (isAllowedLocalAssetPath(path)) {
      return normalizeLocalAssetPath(path);
    }

    if (isAllowedLocalAssetPath(fallbackPath)) {
      return normalizeLocalAssetPath(fallbackPath);
    }

    return 'assets/c1.png';
  }

  function encodeUrlPathSegments(path) {
    return String(path || '')
      .split('/')
      .filter(Boolean)
      .map(segment => {
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch (error) {
          return encodeURIComponent(segment);
        }
      })
      .join('/');
  }

  function resolveCoursewareImageLocalFallback(path) {
    const raw = String(path || '').trim();
    if (!raw || !BIOLOGY_COURSEWARE_IMAGE_BASE || !raw.startsWith(BIOLOGY_COURSEWARE_IMAGE_BASE)) return '';

    const relativePath = raw.slice(BIOLOGY_COURSEWARE_IMAGE_BASE.length).split(/[?#]/u, 1)[0];
    if (!relativePath || relativePath.includes('../') || relativePath.includes('..\\')) return '';
    return `${COURSEWARE_IMAGE_LOCAL_BASE}${relativePath}`;
  }

  function installCoursewareImageFallback() {
    if (window.__BIOLOGY_COURSEWARE_IMAGE_FALLBACK_INSTALLED__) return;
    window.__BIOLOGY_COURSEWARE_IMAGE_FALLBACK_INSTALLED__ = true;

    window.addEventListener('error', event => {
      const target = event?.target;
      if (!target || target.nodeType !== 1) return;

      const tagName = String(target.tagName || '').toLowerCase();
      const source = tagName === 'img'
        ? String(target.currentSrc || target.getAttribute('src') || '')
        : tagName === 'image'
          ? String(target.getAttribute('href') || target.getAttributeNS?.('http://www.w3.org/1999/xlink', 'href') || '')
          : '';
      const fallback = resolveCoursewareImageLocalFallback(source);
      if (!fallback || target.getAttribute('data-courseware-image-fallback') === 'local') return;

      target.setAttribute('data-courseware-image-fallback', 'local');
      if (tagName === 'img') {
        target.removeAttribute('srcset');
        target.setAttribute('src', fallback);
        return;
      }

      target.setAttribute('href', fallback);
      if (target.hasAttributeNS?.('http://www.w3.org/1999/xlink', 'href')) {
        target.setAttributeNS('http://www.w3.org/1999/xlink', 'href', fallback);
      }
    }, true);
  }

  installCoursewareImageFallback();

  function getBiologyBucketRelativePath(path) {
    const normalized = normalizeLocalAssetPath(path);
    if (!normalized) return '';

    if (normalized.startsWith('assets/')) {
      return normalized.slice('assets/'.length);
    }

    if (LOCAL_MEDIA_FILES.includes(normalized)) {
      return normalized;
    }

    return '';
  }

  function resolveBiologyMediaPath(path, fallbackPath = 'assets/c1.png') {
    const raw = String(path || '').trim();
    if (!raw) return resolveBiologyMediaPath(fallbackPath, 'assets/c1.png');
    if (/^(?:https?:)?\/\//i.test(raw) || /^(?:data|blob|javascript):/i.test(raw)) return raw;

    const bucketRelativePath = getBiologyBucketRelativePath(raw);
    if (BIOLOGY_MEDIA_BASE && bucketRelativePath) {
      return `${BIOLOGY_MEDIA_BASE}${encodeUrlPathSegments(bucketRelativePath)}`;
    }

    const fallbackKey = resolveLocalMediaKey(fallbackPath, 'assets/c1.png');
    const fallbackRelativePath = getBiologyBucketRelativePath(fallbackKey);
    if (BIOLOGY_MEDIA_BASE && fallbackRelativePath) {
      return `${BIOLOGY_MEDIA_BASE}${encodeUrlPathSegments(fallbackRelativePath)}`;
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

  function resolveBiologyMediaThumbnailPath(path, fallbackPath = 'assets/c1.png', options = {}) {
    return appendCosImageThumbnail(resolveBiologyMediaPath(path, fallbackPath), options);
  }

  function applyMediaSource(target, src) {
    const nextSrc = String(src || '').trim();
    if (!target || !nextSrc) return;

    target.setAttribute('src', nextSrc);

    if (String(target.tagName || '').toLowerCase() === 'video' && typeof target.load === 'function') {
      try {
        target.load();
      } catch (error) {
      }
    }
  }

  function handleLocalImageError(event, fallbackPath = 'assets/c1.png') {
    const target = event?.currentTarget;
    if (!target) return;

    const fallback = resolveBiologyMediaPath(fallbackPath, 'assets/c1.png');
    if (target.dataset.localFallbackApplied === 'true' || target.getAttribute('src') === fallback) {
      target.removeAttribute('src');
      return;
    }

    target.dataset.localFallbackApplied = 'true';
    target.src = fallback;
  }

  function handleBiologyMediaError(event, fallbackPath = 'assets/c1.png') {
    const target = event?.currentTarget;
    if (!target) return;

    const fallback = resolveLocalImagePath(fallbackPath, 'assets/c1.png');
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
    const frameWidth = availableWidth > 0
      ? Math.min(availableWidth, preset.maxWidth)
      : preset.minWidth;
    const frameHeight = availableHeight > 0
      ? Math.min(availableHeight, preset.maxHeight)
      : preset.minHeight;
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
      cardColumns: narrowPortrait ? (frameWidth >= 720 ? 3 : frameWidth >= 350 ? 2 : 1) : ultraWide || frameWidth >= 1440 ? 4 : dense ? 2 : 3,
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
    const scale = isLandscape
      ? Math.min(availableWidth / frame.width, availableHeight / frame.height, 1)
      : 1;

    return {
      width: viewport.width,
      height: viewport.height,
      isLandscape,
      scale: Math.max(scale, 0),
      frame,
      compact: frame.compact,
      dense: frame.dense,
      shortHeight: frame.shortHeight,
      roomy: frame.roomy,
      ultraWide: frame.ultraWide,
      isPortrait: frame.isPortrait,
      narrowPortrait: frame.narrowPortrait
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
    const fallbackImage = DEFAULT_CARD_IMAGE_BY_BOOK[mapping.bookId] || 'assets/c1.png';

    return {
      id: mapping.cardId,
      title: mapping.title,
      chapterIds: mapping.chapterIds || [],
      detail: mapping.detail || `探索 ${mapping.title} 的核心生物学概念。`,
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
      focusPoints: focusPoints.length
        ? focusPoints
        : ['结合当前可视化内容，先梳理核心概念，再定位关键结构或关键过程。'],
      tips: tips.slice(0, 2)
    };
  }

  async function fetchJsonSafe(path) {
    try {
      const response = await fetch(appendRuntimeVersion(path), { cache: 'no-store' });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  function getRuntimeBuildVersion() {
    const runtime = window.__SHG_BIOLOGY_RUNTIME__ || BIOLOGY_RUNTIME || {};
    const explicitVersion = String(
      runtime.buildVersion ||
      runtime.BUILD_VERSION ||
      window.SHIGUANG_BUILD_VERSION ||
      window.__SHIGUANG_BUILD_VERSION__ ||
      window.__BUILD_VERSION__ ||
      ''
    ).trim();
    if (explicitVersion && !/^__.*__$/.test(explicitVersion)) return explicitVersion;

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    for (const script of scripts) {
      const src = String(script.getAttribute('src') || '');
      if (!/(^|\/)biology-(shared|entry|scene-components|layout-components)(?:\.compiled)?\.js(?:\?|$)/.test(src)) continue;
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
    const runtime = window.__SHG_BIOLOGY_RUNTIME__ || BIOLOGY_RUNTIME || {};
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
    return raw.replace(/^subjects\/biology\//, '');
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

  function getBiologyModelDeviceTier() {
    const width = Math.min(window.innerWidth || 0, window.screen?.width || window.innerWidth || 0) || window.innerWidth || 0;
    const coarsePointer = Boolean(window.matchMedia?.('(hover: none), (pointer: coarse)')?.matches);
    const tabletLike = Boolean(window.matchMedia?.('(min-width: 700px) and (max-width: 1180px)')?.matches);
    const mobileLike = Boolean(window.matchMedia?.('(max-width: 699px)')?.matches);
    const memory = Number(navigator.deviceMemory || 0);
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    const slowNetwork = Boolean(connection.saveData || /(?:slow-2g|2g|3g)/i.test(String(connection.effectiveType || '')));

    if (mobileLike || width <= 699 || (coarsePointer && memory > 0 && memory <= 4) || slowNetwork) return 'mobile';
    if (tabletLike || width <= 1180 || coarsePointer || (memory > 0 && memory <= 6)) return 'tablet';
    return 'desktop';
  }

  function splitModelUrlSuffix(source) {
    const raw = String(source || '').trim();
    const hashIndex = raw.indexOf('#');
    const hash = hashIndex >= 0 ? raw.slice(hashIndex) : '';
    const beforeHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
    const queryIndex = beforeHash.indexOf('?');
    const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : '';
    const pathPart = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
    return { path: pathPart, query, hash };
  }

  function escapeRuntimeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function addBiologyModelVariantSuffix(source, suffix) {
    const parts = splitModelUrlSuffix(source);
    if (!/\.glb$/i.test(parts.path)) return String(source || '');
    if (new RegExp(`${escapeRuntimeRegExp(suffix)}\\.glb$`, 'i').test(parts.path)) return String(source || '');
    return `${parts.path.replace(/\.glb$/i, `${suffix}.glb`)}${parts.query}${parts.hash}`;
  }

  function runtimeManifestHasAsset(source) {
    const manifest = getRuntimeAssetManifest();
    if (!manifest || typeof manifest !== 'object') return false;
    const key = normalizeRuntimeManifestKey(source);
    if (!key) return false;
    return Boolean(manifest[key] || manifest[`./${key}`] || manifest[`/${key}`]);
  }

  function resolveBiologyModelVariantSource(source, options = {}) {
    const tier = options.tier || getBiologyModelDeviceTier();
    const sourceIsObject = typeof source === 'object' && source;
    const explicitVariants = typeof source === 'object' && source
      ? source
      : {
          desktop: source,
          tablet: options.tabletSrc || options.tablet || addBiologyModelVariantSuffix(source, '.tablet'),
          mobile: options.mobileSrc || options.mobile || addBiologyModelVariantSuffix(source, '.mobile')
        };

    const desktopSource = explicitVariants.desktop || explicitVariants.default || explicitVariants.src || source;
    const ranked = tier === 'mobile'
      ? [
          { src: explicitVariants.mobile, explicit: sourceIsObject || Boolean(options.mobileSrc || options.mobile) },
          { src: explicitVariants.tablet, explicit: sourceIsObject || Boolean(options.tabletSrc || options.tablet) },
          { src: desktopSource, desktop: true }
        ]
      : tier === 'tablet'
        ? [
            { src: explicitVariants.tablet, explicit: sourceIsObject || Boolean(options.tabletSrc || options.tablet) },
            { src: explicitVariants.mobile, explicit: sourceIsObject || Boolean(options.mobileSrc || options.mobile) },
            { src: desktopSource, desktop: true }
          ]
        : [
            { src: explicitVariants.desktop || explicitVariants.desktopSrc || desktopSource, desktop: true },
            { src: desktopSource, desktop: true }
          ];

    for (const candidate of ranked) {
      if (!candidate?.src) continue;
      if (candidate.desktop || candidate.explicit || options.assumeVariantExists || runtimeManifestHasAsset(candidate.src)) {
        return appendRuntimeVersion(candidate.src);
      }
    }

    return appendRuntimeVersion(desktopSource);
  }

  function releaseBiologyModelViewer(viewer) {
    if (!viewer || !viewer.matches?.('model-viewer')) return;
    try {
      if (typeof viewer.pause === 'function') viewer.pause();
    } catch (error) {}
    viewer.removeAttribute('autoplay');
    viewer.removeAttribute('animation-name');
    viewer.removeAttribute('src');
    viewer.removeAttribute('poster');
  }

  function releaseBiologyModelViewers(root = document) {
    if (!root) return;
    if (root.matches?.('model-viewer')) releaseBiologyModelViewer(root);
    root.querySelectorAll?.('model-viewer').forEach(releaseBiologyModelViewer);
  }

  function setBiologyModelViewerSource(viewer, source, options = {}) {
    if (!viewer) return '';
    const nextSrc = resolveBiologyModelVariantSource(source, options);
    const currentSrc = String(viewer.getAttribute('src') || '');
    if (currentSrc !== nextSrc) {
      if (currentSrc) releaseBiologyModelViewer(viewer);
      viewer.setAttribute('src', nextSrc);
    }
    viewer.dataset.modelTier = options.tier || getBiologyModelDeviceTier();
    return nextSrc;
  }

  const BIOLOGY_MODEL_VIEWER_LOCAL_SRC = 'assets/vendor/js/model-viewer.min.js';
  const BIOLOGY_MODEL_VIEWER_REMOTE_SRC = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
  let biologyModelViewerLoaderPromise = null;

  function waitForBiologyModelViewerDefinition(timeoutMs = 7000) {
    if (!window.customElements?.whenDefined) {
      return Promise.resolve(!!window.customElements?.get?.('model-viewer'));
    }
    if (window.customElements.get('model-viewer')) return Promise.resolve(true);

    return Promise.race([
      window.customElements.whenDefined('model-viewer').then(() => true),
      new Promise(resolve => {
        window.setTimeout(() => {
          resolve(!!window.customElements.get('model-viewer'));
        }, timeoutMs);
      })
    ]);
  }

  function resolveBiologyModelViewerScriptSource(source) {
    const value = String(source || '').trim();
    if (!value) return '';
    if (/^(?:https?:)?\/\//i.test(value)) return value;
    try {
      return appendRuntimeVersion(new URL(value, window.location.href).href);
    } catch (error) {
      return appendRuntimeVersion(value);
    }
  }

  function loadBiologyModelViewerScript(source) {
    return new Promise(resolve => {
      if (window.customElements?.get?.('model-viewer')) {
        resolve(true);
        return;
      }

      const resolvedSource = resolveBiologyModelViewerScriptSource(source);
      if (!resolvedSource) {
        resolve(false);
        return;
      }

      const existingScript = Array.from(document.querySelectorAll('script[data-bio-model-viewer-loader="true"]'))
        .find(script => script.src === resolvedSource);

      if (existingScript) {
        if (existingScript.dataset.bioModelViewerStatus === 'error') {
          existingScript.remove();
        } else if (existingScript.dataset.bioModelViewerStatus === 'loaded') {
          waitForBiologyModelViewerDefinition().then(resolve);
          return;
        } else {
          existingScript.addEventListener('load', () => {
            existingScript.dataset.bioModelViewerStatus = 'loaded';
            waitForBiologyModelViewerDefinition().then(resolve);
          }, { once: true });
          existingScript.addEventListener('error', () => {
            existingScript.dataset.bioModelViewerStatus = 'error';
            resolve(false);
          }, { once: true });
          return;
        }
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = resolvedSource;
      script.dataset.bioModelViewerLoader = 'true';
      script.dataset.bioModelViewerStatus = 'loading';
      script.onload = () => {
        script.dataset.bioModelViewerStatus = 'loaded';
        waitForBiologyModelViewerDefinition().then(resolve);
      };
      script.onerror = () => {
        script.dataset.bioModelViewerStatus = 'error';
        script.remove();
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  function loadBiologyModelViewer() {
    if (window.customElements?.get?.('model-viewer')) return Promise.resolve(true);
    if (biologyModelViewerLoaderPromise) return biologyModelViewerLoaderPromise;

    biologyModelViewerLoaderPromise = (async () => {
      const localLoaded = await loadBiologyModelViewerScript(BIOLOGY_MODEL_VIEWER_LOCAL_SRC);
      if (localLoaded) return true;
      const remoteLoaded = await loadBiologyModelViewerScript(BIOLOGY_MODEL_VIEWER_REMOTE_SRC);
      return !!remoteLoaded || !!window.customElements?.get?.('model-viewer');
    })().then(loaded => {
      if (!loaded) biologyModelViewerLoaderPromise = null;
      return loaded;
    }).catch(error => {
      biologyModelViewerLoaderPromise = null;
      throw error;
    });

    return biologyModelViewerLoaderPromise;
  }

  const PANEL_SCROLL_PRESERVER_KEY = '__BIO_PANEL_SCROLL_PRESERVER__';

  function applyBiologyPanelScrollLayout(panel) {
    if (!panel?.style) return;

    panel.setAttribute('data-bio-panel-scroll-root', 'true');
    panel.classList?.add('no-scrollbar');
    panel.style.setProperty('display', 'block');
    panel.style.setProperty('min-height', '0');
    panel.style.setProperty('overflow-x', 'hidden', 'important');
    panel.style.setProperty('overflow-y', 'auto', 'important');
    panel.style.setProperty('overscroll-behavior-x', 'none');
    panel.style.setProperty('overscroll-behavior-y', 'contain');
    panel.style.setProperty('touch-action', 'pan-y');
    panel.style.setProperty('-webkit-overflow-scrolling', 'touch');
    panel.style.setProperty('scrollbar-width', 'none');
    panel.style.setProperty('-ms-overflow-style', 'none');
    panel.style.setProperty('scroll-padding-bottom', 'max(12px, env(safe-area-inset-bottom))');

    Array.from(panel.children || []).forEach(child => {
      if (!child?.style || /^(?:STYLE|SCRIPT|LINK)$/i.test(child.tagName || '')) return;
      child.setAttribute('data-bio-panel-scroll-content', 'true');
      child.classList?.add('no-scrollbar');
      child.style.setProperty('width', '100%');
      child.style.setProperty('height', '100%');
      child.style.setProperty('min-height', '0', 'important');
      child.style.setProperty('max-height', '100%', 'important');
      child.style.setProperty('overflow-x', 'hidden', 'important');
      child.style.setProperty('overflow-y', 'auto', 'important');
      child.style.setProperty('overscroll-behavior-x', 'none');
      child.style.setProperty('overscroll-behavior-y', 'contain');
      child.style.setProperty('touch-action', 'pan-y', 'important');
      child.style.setProperty('-webkit-overflow-scrolling', 'touch');
      child.style.setProperty('scrollbar-width', 'none');
      child.style.setProperty('-ms-overflow-style', 'none');
      child.style.setProperty('scroll-padding-bottom', 'max(12px, env(safe-area-inset-bottom))');
    });
  }

  function getNativeInnerHtmlDescriptor() {
    let proto = typeof Element !== 'undefined' ? Element.prototype : null;
    while (proto) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'innerHTML');
      if (descriptor?.get && descriptor?.set) return descriptor;
      proto = Object.getPrototypeOf(proto);
    }
    return null;
  }

  function escapeCssIdent(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function getPanelNodePath(root, node) {
    const path = [];
    let current = node;
    while (current && current !== root) {
      const parent = current.parentElement;
      if (!parent) return [];
      path.unshift(Array.prototype.indexOf.call(parent.children, current));
      current = parent;
    }
    return current === root ? path : [];
  }

  function findPanelNodeByPath(root, path) {
    let current = root;
    for (const index of path || []) {
      if (!current?.children || index < 0 || index >= current.children.length) return null;
      current = current.children[index];
    }
    return current || null;
  }

  function buildPanelScrollSelector(root, node) {
    if (!node || node === root) return '';

    const role = node.getAttribute?.('data-role');
    if (role) return `[data-role="${String(role).replace(/"/g, '\\"')}"]`;

    const scrollKey = node.getAttribute?.('data-bio-scroll-key');
    if (scrollKey) return `[data-bio-scroll-key="${String(scrollKey).replace(/"/g, '\\"')}"]`;

    if (node.id) return `#${escapeCssIdent(node.id)}`;

    const stableClasses = Array.from(node.classList || [])
      .filter(className => !/^(?:is-|active|selected|correct|wrong|open|visible|complete|error)/.test(className));
    if (stableClasses.length) {
      return stableClasses.slice(0, 3).map(className => `.${escapeCssIdent(className)}`).join('');
    }

    return '';
  }

  function captureBiologyPanelScroll(panel) {
    if (!panel?.querySelectorAll) return [];
    const nodes = [panel, ...panel.querySelectorAll('*')];
    return nodes
      .filter(node => Number(node.scrollTop) > 0 || Number(node.scrollLeft) > 0)
      .map(node => ({
        isRoot: node === panel,
        selector: buildPanelScrollSelector(panel, node),
        path: getPanelNodePath(panel, node),
        scrollTop: Number(node.scrollTop) || 0,
        scrollLeft: Number(node.scrollLeft) || 0
      }));
  }

  function restoreBiologyPanelScroll(panel, records) {
    if (!panel || !Array.isArray(records) || !records.length) return;

    const apply = () => {
      records.forEach(record => {
        let target = record.isRoot ? panel : null;
        if (!target && record.selector) {
          try {
            target = panel.querySelector(record.selector);
          } catch (error) {
            target = null;
          }
        }
        if (!target) target = findPanelNodeByPath(panel, record.path);
        if (!target) return;

        const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
        const maxLeft = Math.max(0, target.scrollWidth - target.clientWidth);
        target.scrollTop = Math.min(record.scrollTop, maxTop);
        target.scrollLeft = Math.min(record.scrollLeft, maxLeft);
      });
    };

    apply();
    window.requestAnimationFrame?.(apply);
    window.setTimeout(apply, 0);
  }

  function renderBiologyPanelHtml(panel, html, options = {}) {
    if (!panel) return;

    const preserveScroll = options.preserveScroll !== false;
    const scrollRecords = preserveScroll ? captureBiologyPanelScroll(panel) : [];
    const descriptor = getNativeInnerHtmlDescriptor();
    if (descriptor?.set) {
      descriptor.set.call(panel, html == null ? '' : String(html));
    } else {
      panel.replaceChildren();
      if (html != null && html !== '') {
        panel.insertAdjacentHTML('beforeend', String(html));
      }
    }

    if (preserveScroll) {
      restoreBiologyPanelScroll(panel, scrollRecords);
    }
    applyBiologyPanelScrollLayout(panel);
  }

  function installBiologyPanelScrollPreserver(panel) {
    if (!panel || panel[PANEL_SCROLL_PRESERVER_KEY]) return;
    applyBiologyPanelScrollLayout(panel);

    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => applyBiologyPanelScrollLayout(panel))
      : null;
    observer?.observe(panel, { childList: true });

    const descriptor = getNativeInnerHtmlDescriptor();
    if (!descriptor?.get || !descriptor?.set) {
      panel[PANEL_SCROLL_PRESERVER_KEY] = { observer };
      return;
    }

    try {
      Object.defineProperty(panel, 'innerHTML', {
        configurable: true,
        enumerable: descriptor.enumerable,
        get() {
          return descriptor.get.call(this);
        },
        set(value) {
          renderBiologyPanelHtml(this, value);
        }
      });
      panel[PANEL_SCROLL_PRESERVER_KEY] = { observer };
    } catch (error) {
      panel[PANEL_SCROLL_PRESERVER_KEY] = { observer };
    }
  }

  async function loadCourseData() {
    const courseIndex = await fetchJsonSafe(COURSE_DATA_PATH);
    if (!courseIndex) return null;

    if (courseIndex.splitBy !== 'book') {
      return courseIndex;
    }

    const stageEntries = Array.isArray(courseIndex.stages) ? courseIndex.stages : [];
    const pendingBooks = stageEntries.flatMap(stageEntry =>
      (stageEntry.books || []).map(bookEntry => ({
        stageId: stageEntry.id,
        stageLabel: stageEntry.label,
        bookMeta: bookEntry
      }))
    );

    const bookPayloads = await Promise.all(
      pendingBooks.map(async entry => {
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
      })
    );

    const missingBooks = bookPayloads.filter(entry => entry.missing);
    if (missingBooks.length) {
      console.error(
        'Failed to load split course book data:',
        missingBooks.map(entry => entry.bookMeta?.dataPath).filter(Boolean)
      );
      return null;
    }

    const stages = stageEntries.map(stageEntry => ({
      id: stageEntry.id,
      label: stageEntry.label,
      books: bookPayloads
        .filter(entry => entry.stageId === stageEntry.id)
        .map(entry => entry.book)
    }));

    return {
      version: courseIndex.version,
      updated: courseIndex.updated,
      splitBy: courseIndex.splitBy,
      ui: courseIndex.ui || {},
      stages,
      currentCardMapping: bookPayloads.flatMap(entry => entry.currentCardMapping)
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

  const MODEL_VIEWER_PROGRESS_KEY = '__BIO_MODEL_VIEWER_PROGRESS__';
  let modelViewerProgressObserver = null;

  function injectBiologyModelViewerProgressStyles() {
    if (document.getElementById('bio-model-viewer-progress-style')) return;

    const style = document.createElement('style');
    style.id = 'bio-model-viewer-progress-style';
    style.textContent = `
      .bio-model-download-progress {
        position: absolute;
        inset: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: linear-gradient(180deg, rgba(2, 6, 12, 0.72), rgba(2, 6, 12, 0.88));
        color: #d1fae5;
        pointer-events: none;
        opacity: 1;
        visibility: visible;
        transition: opacity 220ms ease, visibility 0s linear 0s;
      }

      .bio-model-download-progress.is-complete {
        opacity: 0;
        visibility: hidden;
        transition: opacity 220ms ease, visibility 0s linear 220ms;
      }

      .bio-model-download-progress__card {
        width: min(320px, 100%);
        display: grid;
        gap: 10px;
        border: 1px solid rgba(110, 231, 183, 0.28);
        border-radius: 18px;
        background: rgba(3, 7, 18, 0.76);
        padding: 14px 16px;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.46);
        backdrop-filter: blur(14px);
      }

      .bio-model-download-progress__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 0;
      }

      .bio-model-download-progress__label {
        min-width: 0;
        color: rgba(248, 250, 252, 0.9);
        font-size: 13px;
        font-weight: 800;
        line-height: 1.35;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @keyframes bio-progress-indeterminate {
        0% { margin-left: -38%; }
        100% { margin-left: 100%; }
      }

      .bio-model-download-progress__percent { display: none; display: none;
        flex: none;
        color: #6ee7b7;
        font: 800 12px/1 "JetBrains Mono", monospace;
      }

      .bio-model-download-progress__track {
        width: 100%;
        height: 7px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
      }

      .bio-model-download-progress__fill { width: 38% !important; animation: bio-progress-indeterminate 1.15s ease-in-out infinite;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #34d399, #a7f3d0);
        box-shadow: 0 0 18px rgba(110, 231, 183, 0.45);
        
      }

      .bio-model-download-progress__hint {
        color: rgba(209, 250, 229, 0.7);
        font-size: 11px;
        line-height: 1.45;
      }

      .bio-model-download-progress.is-error .bio-model-download-progress__percent,
      .bio-model-download-progress.is-error .bio-model-download-progress__label {
        color: #fca5a5;
      }

      .bio-model-download-progress.is-error .bio-model-download-progress__fill {
        background: linear-gradient(90deg, #fb7185, #fecdd3);
      }
    `;
    document.head.appendChild(style);
  }

  function getModelViewerProgressValue(event) {
    const rawValue = event?.detail?.totalProgress ?? event?.detail?.progress;
    const value = Number(rawValue);
    if (Number.isFinite(value)) return clampNumber(value, 0, 1);
    if (event?.target?.modelIsVisible === true) return 1;
    return 0;
  }

  function enhanceBiologyModelViewerProgress(root = document) {
    injectBiologyModelViewerProgressStyles();

    const viewers = [];
    if (root?.matches?.('model-viewer')) viewers.push(root);
    root?.querySelectorAll?.('model-viewer').forEach(viewer => viewers.push(viewer));

    viewers.forEach(viewer => {
      if (!viewer || viewer[MODEL_VIEWER_PROGRESS_KEY]) return;
      const parent = viewer.parentElement;
      if (!parent) return;

      const computedPosition = window.getComputedStyle(parent).position;
      if (!computedPosition || computedPosition === 'static') {
        parent.style.position = 'relative';
      }

      const overlay = document.createElement('div');
      overlay.className = 'bio-model-download-progress';
      overlay.setAttribute('aria-live', 'polite');
      overlay.innerHTML = `
        <div class="bio-model-download-progress__card">
          <div class="bio-model-download-progress__top">
            <div class="bio-model-download-progress__label">正在下载 3D 模型</div>
            <div class="bio-model-download-progress__percent">0%</div>
          </div>
          <div class="bio-model-download-progress__track" aria-hidden="true">
            <div class="bio-model-download-progress__fill"></div>
          </div>
          <div class="bio-model-download-progress__hint">首次打开模型会稍慢，请稍候。</div>
        </div>
      `;
      parent.appendChild(overlay);

      const fill = overlay.querySelector('.bio-model-download-progress__fill');
      const percent = overlay.querySelector('.bio-model-download-progress__percent');
      const label = overlay.querySelector('.bio-model-download-progress__label');
      const hint = overlay.querySelector('.bio-model-download-progress__hint');
      let lastSrc = String(viewer.getAttribute('src') || '');
      let hideTimer = null;
      let completeFallbackTimer = null;

      const setProgress = value => {
        const progress = clampNumber(value, 0, 1);
        const percentText = `${Math.round(progress * 100)}%`;
      };

      const showProgress = (value = 0) => {
        window.clearTimeout(hideTimer);
        window.clearTimeout(completeFallbackTimer);
        overlay.classList.remove('is-complete', 'is-error');
        overlay.setAttribute('aria-hidden', 'false');
        if (label) label.textContent = '正在下载 3D 模型';
        if (hint) hint.textContent = '首次打开或切换模型会稍慢，请稍候。';
        setProgress(value);
      };

      const hideProgress = () => {
        setProgress(1);
        window.clearTimeout(hideTimer);
        window.clearTimeout(completeFallbackTimer);
        hideTimer = window.setTimeout(() => {
          overlay.classList.add('is-complete');
          overlay.setAttribute('aria-hidden', 'true');
        }, 120);
      };

      const scheduleCompleteFallback = () => {
        window.clearTimeout(completeFallbackTimer);
        if (label) label.textContent = '正在打开 3D 模型';
        if (hint) hint.textContent = '模型已下载完成，正在准备显示。';
        completeFallbackTimer = window.setTimeout(() => {
          if (!overlay.classList.contains('is-error')) hideProgress();
        }, 1600);
      };

      const markLoadingFromSrcChange = () => {
        const nextSrc = String(viewer.getAttribute('src') || '');
        if (!nextSrc || nextSrc === lastSrc) return;
        lastSrc = nextSrc;
        showProgress(0);
      };

      const srcObserver = new MutationObserver(markLoadingFromSrcChange);
      srcObserver.observe(viewer, { attributes: true, attributeFilter: ['src'] });
      viewer[MODEL_VIEWER_PROGRESS_KEY] = { overlay, showProgress, hideProgress, srcObserver };

      viewer.addEventListener('progress', event => {
        const progress = getModelViewerProgressValue(event);
        showProgress(progress);
        if (progress >= 1) {
          if (viewer.modelIsVisible === true) hideProgress();
          else scheduleCompleteFallback();
        }
      });

      viewer.addEventListener('load', hideProgress);

      viewer.addEventListener('error', () => {
        window.clearTimeout(hideTimer);
        window.clearTimeout(completeFallbackTimer);
        overlay.classList.add('is-error');
        overlay.classList.remove('is-complete');
        overlay.setAttribute('aria-hidden', 'false');
        if (label) label.textContent = '3D 模型加载失败';
        if (hint) hint.textContent = '请检查模型文件路径或网络连接后重试。';
      });

      showProgress(viewer.modelIsVisible === true ? 1 : 0);
      if (viewer.modelIsVisible === true) hideProgress();
    });
  }

  function installBiologyModelViewerProgressObserver() {
    if (modelViewerProgressObserver || !document.documentElement) return;
    enhanceBiologyModelViewerProgress(document);
    modelViewerProgressObserver = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (node.nodeType === 1) enhanceBiologyModelViewerProgress(node);
        });
      });
    });
    modelViewerProgressObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installBiologyModelViewerProgressObserver, { once: true });
  } else {
    installBiologyModelViewerProgressObserver();
  }

  Object.assign(window.BiologyApp, {
    useState,
    useMemo,
    useEffect,
    useRef,
    DEFAULTS,
    COURSE_DATA_PATH,
    VISUAL_MANIFEST_PATH,
      LANDING_VIDEO_PATH,
      BIOLOGY_MEDIA_BASE,
      BIOLOGY_COURSEWARE_IMAGE_BASE,
      BOOK_BACKGROUND_MAP,
      LANDING_PANELS,
      MODE_ICON_MAP,
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
      resolveBiologyMediaPath,
      resolveCoursewareImageLocalFallback,
      resolveBiologyMediaThumbnailPath,
      appendCosImageThumbnail,
      handleBiologyMediaError,
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
    loadBiologyModelViewer,
    renderBiologyPanelHtml,
    installBiologyPanelScrollPreserver,
    applyBiologyPanelScrollLayout,
    loadCourseData,
    loadSceneScript,
    getBiologyModelDeviceTier,
    resolveBiologyModelVariantSource,
    setBiologyModelViewerSource,
    releaseBiologyModelViewer,
    releaseBiologyModelViewers,
    enhanceBiologyModelViewerProgress
  });
})();

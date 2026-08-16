function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
/*
  Math question-bank UI components.
*/

window.MathApp = window.MathApp || {};
(() => {
  const app = window.MathApp;
  const {
    useMemo,
    useState,
    useEffect
  } = app;
  const service = app.questionBankService;
  const MODE_FREE = 'free';
  const MODE_DRAW = 'draw';
  const VIEW_BROWSE = 'browse';
  const VIEW_PAPER_PREVIEW = 'paper-preview';
  const VIEW_PRACTICE = 'practice';
  const VIEW_REPORT = 'report';
  const VIEW_LECTURE = 'lecture';
  const DRAW_COUNT = 10;
  const AUTO_ADVANCE_DELAY_MS = 160;
  const QUESTION_BANK_BUSY_ACTION_START_DELAY_MS = 160;
  const QUESTION_BANK_BUSY_FEEDBACK_DELAY_MS = 1200;
  const QUESTION_BANK_INITIAL_RENDER_COUNT = 30;
  const QUESTION_BANK_RENDER_INCREMENT = 60;
  const QUESTION_BANK_BROWSE_SHUFFLE_LIMIT = 240;
  const QUESTION_BANK_OPTION_PREVIEW_LIMIT = 4;
  const PAPER_PACKAGES_STORAGE_KEY = 'mathQuestionBankPaperPackagesV1';
  const TOUCH_SCROLL_STYLE = {
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
    scrollbarWidth: 'none',
    touchAction: 'pan-y'
  };
  const QUESTION_BANK_BACKGROUND_STYLE = {
    backgroundColor: '#f6f3ea',
    backgroundImage: 'none'
  };
  const QUESTION_BANK_WORKBENCH_STYLE = {
    backgroundColor: '#fffdf7',
    backgroundImage: 'none'
  };
  const QUESTION_BANK_V15_WORKBENCH = 'question-bank-v15-workbench';
  const QUESTION_BANK_LIGHT_THEME_STYLE = 'question-bank-light-theme';
  const QUESTION_BANK_VISUAL_V2 = 'question-bank-visual-v2';
  const QUESTION_BANK_PAPER_SURFACE_CLASS = 'border border-[#e7dcc4] bg-white shadow-[0_16px_44px_rgba(89,74,40,0.08)]';
  const QUESTION_BANK_MUTED_SURFACE_CLASS = 'border border-[#e7dcc4] bg-[#fffdf7] shadow-[0_10px_28px_rgba(89,74,40,0.05)]';
  const QUESTION_BANK_PRIMARY_BUTTON_CLASS = 'min-h-[44px] rounded-[14px] bg-[#0f766e] px-4 py-2 font-black text-white shadow-[0_10px_24px_rgba(15,118,110,0.18)] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2';
  const QUESTION_BANK_PAPER_BUTTON_CLASS = 'min-h-[44px] rounded-[14px] bg-[#f4c430] px-4 py-2 font-black text-[#271f08] shadow-[0_10px_24px_rgba(244,196,48,0.22)] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b253] focus-visible:ring-offset-2';
  const QUESTION_BANK_SECONDARY_BUTTON_CLASS = 'min-h-[44px] rounded-[14px] border border-[#d9d2c3] bg-white px-4 py-2 font-black text-zinc-800 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2';
  const QUESTION_BANK_BUSY_SPINNER_CLASS = 'question-bank-busy-spinner h-4 w-4 shrink-0 rounded-full border-2 border-current border-r-transparent';
  const QUESTION_BANK_MOTION_STYLE = `
    .question-bank-visual-v2 button,
    .question-bank-visual-v2 [role="button"],
    .question-bank-visual-v2 input {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .question-bank-visual-v2 [data-qb-card-state],
    .question-bank-visual-v2 [data-qb-paper-surface],
    .question-bank-visual-v2 [data-qb-filter-panel],
    .question-bank-visual-v2 [data-qb-mobile-dock] {
      transition-property: border-color, background-color, box-shadow, transform, opacity;
      transition-duration: 180ms;
      transition-timing-function: ease-out;
    }
    .question-bank-visual-v2 .question-bank-busy-spinner {
      animation: questionBankBusySpin 760ms linear infinite;
    }
    .question-bank-visual-v2 [data-qb-busy-action][aria-busy="true"] {
      pointer-events: none;
    }
    @keyframes questionBankBusySpin {
      to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .question-bank-visual-v2 *,
      .question-bank-visual-v2 *::before,
      .question-bank-visual-v2 *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  function BusyActionContent({
    busy,
    label,
    busyLabel
  }) {
    return /*#__PURE__*/React.createElement("span", {
      className: "inline-flex min-w-0 items-center justify-center gap-2"
    }, busy ? /*#__PURE__*/React.createElement("span", {
      className: QUESTION_BANK_BUSY_SPINNER_CLASS,
      "aria-hidden": "true"
    }) : null, /*#__PURE__*/React.createElement("span", {
      className: "truncate"
    }, busy ? busyLabel : label));
  }
  function getBusyActionLabel(actionKey) {
    if (actionKey === 'basket-paper' || actionKey === 'random-paper') return '智能组卷中';
    if (actionKey === 'draw-paper') return '智能抽题中';
    if (actionKey === 'paper-save') return '正在生成 PDF';
    return '正在处理';
  }
  function QuestionBankEntryButton({
    onOpen,
    compact
  }) {
    const sizeClass = compact ? 'h-[60px] w-[60px]' : 'h-[74px] w-[74px]';
    const topBarClass = compact ? 'top-[9px] h-[5px] w-[28px]' : 'top-[11px] h-[6px] w-[34px]';
    const mainTextClass = compact ? 'text-[14px]' : 'text-[16px]';
    const subTextClass = compact ? 'mt-0.5 text-[10px]' : 'mt-1 text-[11px]';
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onOpen,
      "aria-label": "\u6253\u5F00\u9898\u5E93\u7EC3\u4E60",
      className: `group fixed z-[70] flex items-center justify-center rounded-full border-2 border-[#d8b253] bg-white text-[#5f4612] shadow-[0_18px_38px_rgba(120,96,44,0.20),0_0_0_1px_rgba(216,178,83,0.22)] transition-transform duration-200 active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b253] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec] ${sizeClass}`,
      style: {
        right: 'max(18px, env(safe-area-inset-right, 0px))',
        bottom: 'max(18px, env(safe-area-inset-bottom, 0px))',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "absolute inset-[5px] rounded-full border border-[#eadca6] bg-[#fffdf7]",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("span", {
      className: `absolute rounded-full bg-[#d8b253] shadow-[0_0_14px_rgba(216,178,83,0.42)] ${topBarClass}`,
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("span", {
      className: "relative flex flex-col items-center justify-center pt-2 text-center"
    }, /*#__PURE__*/React.createElement("span", {
      className: `${mainTextClass} font-black leading-none text-[#6b4f12]`
    }, "\u9898\u5E93"), /*#__PURE__*/React.createElement("span", {
      className: `${subTextClass} font-semibold leading-none text-[#31524d]`
    }, "\u7EC3\u4E60")));
  }
  function MathInline({
    children
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, renderMathParts(children));
  }
  function MathScript({
    type,
    children
  }) {
    const offsetClass = type === 'sub' ? 'top-[0.24em]' : '-top-[0.42em]';
    const className = `relative ${offsetClass} inline-block max-w-[min(14ch,42vw)] align-baseline text-[0.72em] leading-tight whitespace-normal break-words`;
    if (type === 'sub') {
      return /*#__PURE__*/React.createElement("sub", {
        className: className
      }, children);
    }
    return /*#__PURE__*/React.createElement("sup", {
      className: className
    }, children);
  }
  function QuestionFigure({
    figure,
    compact,
    variant = 'practice'
  }) {
    if (!figure || figure.type !== 'svg' && figure.type !== 'image') return null;
    if (figure.type === 'svg' && !figure.svg) return null;
    if (figure.type === 'image' && !figure.src) return null;
    const figureVariant = compact ? 'compact' : variant;
    const sizeClass = {
      compact: 'max-w-[min(100%,420px)] [&_svg]:max-h-52 [&_img]:max-h-52',
      practice: 'max-w-[590px] [&_svg]:max-h-[360px] [&_img]:max-h-[360px]',
      report: 'max-w-[688px] [&_svg]:max-h-[420px] [&_img]:max-h-[420px]'
    }[figureVariant] || 'max-w-[590px] [&_svg]:max-h-[360px] [&_img]:max-h-[360px]';
    const surfaceClass = figureVariant === 'compact' ? 'mt-3 border-zinc-200 bg-white p-2' : 'mt-4 border-zinc-200 bg-white p-3 sm:p-4';
    const rasterStyle = getRasterFigureStyle(figure, figureVariant);
    return /*#__PURE__*/React.createElement("figure", {
      className: `overflow-hidden rounded-[8px] border ${surfaceClass}`,
      "aria-label": figure.alt || figure.title || '题目示意图'
    }, /*#__PURE__*/React.createElement("div", _extends({
      className: `mx-auto w-full ${sizeClass} [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:w-full [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:object-contain`
    }, figure.type === 'svg' ? {
      dangerouslySetInnerHTML: {
        __html: figure.svg
      }
    } : {}), figure.type === 'image' ? /*#__PURE__*/React.createElement("img", {
      src: figure.src,
      alt: figure.alt || figure.title || '题目示意图',
      loading: "lazy",
      decoding: "async",
      style: rasterStyle
    }) : null), /*#__PURE__*/React.createElement("figcaption", {
      className: `mt-2 text-center text-[11px] font-bold ${figureVariant === 'compact' ? 'text-zinc-600' : 'text-zinc-500'}`
    }, figure.title));
  }
  function getRasterFigureStyle(figure, figureVariant = 'practice') {
    if (!figure || figure.type !== 'image') return undefined;
    const originalWidth = Number(figure.originalWidth || figure.width || 0);
    const originalHeight = Number(figure.originalHeight || figure.height || 0);
    const maxHeight = {
      compact: 208,
      practice: 360,
      report: 420
    }[figureVariant] || 360;
    const style = {
      width: 'auto',
      maxWidth: '100%',
      maxHeight: `${maxHeight}px`,
      objectFit: 'contain'
    };
    if (originalWidth > 0) style.width = `${originalWidth}px`;
    if (originalHeight > 0) style.height = 'auto';
    return style;
  }
  function renderMathParts(value) {
    const text = normalizeInlineMathText(value);
    const parts = [];
    let cursor = 0;
    let partIndex = 0;
    while (cursor < text.length) {
      const nextScriptIndex = findNextScriptIndex(text, cursor);
      if (nextScriptIndex < 0 || nextScriptIndex === text.length - 1) {
        parts.push(text.slice(cursor));
        break;
      }
      if (nextScriptIndex > cursor) parts.push(text.slice(cursor, nextScriptIndex));
      const marker = text[nextScriptIndex];
      const parsed = parseScriptToken(text, nextScriptIndex + 1);
      if (!parsed.value) {
        parts.push(marker);
        cursor = nextScriptIndex + 1;
        continue;
      }
      parts.push(marker === '^' ? /*#__PURE__*/React.createElement(MathScript, {
        key: `sup-${partIndex}`,
        type: "sup"
      }, parsed.value) : /*#__PURE__*/React.createElement(MathScript, {
        key: `sub-${partIndex}`,
        type: "sub"
      }, parsed.value));
      partIndex += 1;
      cursor = parsed.nextIndex;
    }
    return parts.length ? parts : text;
  }
  function normalizeInlineMathText(value) {
    return String(value || '').replace(/\\\\/g, '\\').replace(/[（(]\s*(?:["'“”‘’`]+\s*)+[）)]/g, '（ ）').replace(/``([^']*?)''/g, '“$1”').replace(/`{2}/g, '“').replace(/'{2}/g, '”').replace(/\\left\s*/g, '').replace(/\\right\s*/g, '').replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)').replace(/\bfrac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)').replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)').replace(/\bsqrt\s*\{([^{}]+)\}/g, '√($1)').replace(/\\overset\s*\{\s*\\?frown\s*\}\s*\{\s*([^{}]+)\s*\}/g, '⌒$1').replace(/\boverset\s*\{\s*frown\s*\}\s*\{\s*([^{}]+)\s*\}/g, '⌒$1').replace(/\\widehat\s*\{\s*([^{}]+)\s*\}/g, '⌒$1').replace(/\\overline\s*\{\s*([^{}]+)\s*\}/g, '$1').replace(/\\angle\s*/g, '∠').replace(/\bangle\s+([A-Z]{2,4})/g, '∠$1').replace(/\\triangle\s*/g, '△').replace(/\btriangle\s+([A-Z]{3,4})/g, '△$1').replace(/\\(?:cdot|times)\b/g, '×').replace(/\\(?:cap|bigcap)\b/g, '∩').replace(/\\(?:cup|bigcup)\b/g, '∪').replace(/\\(?:parallel|par)\b/g, '∥').replace(/\\perp\b/g, '⊥').replace(/\\leq\b/g, '≤').replace(/\\leqslant\b/g, '≤').replace(/\\geq\b/g, '≥').replace(/\\geqslant\b/g, '≥').replace(/\\neq\b/g, '≠').replace(/\\pi\b/g, 'π').replace(/\\infty\b/g, '∞').replace(/([≤≥])\s*slant\s*/gi, '$1').replace(/\^\s*°/g, '°').replace(/\^\s*degrees\b/gi, '°').replace(/(\d)\s*degrees\b/gi, '$1°').replace(/([A-Z])\^\s*(?=[\u4e00-\u9fff,，。.;；:：)]|$)/g, '$1′ ').replace(/[（(]\s*(?:["'“”‘’`]+\s*)+[）)]/g, '（ ）').replace(/[（(]\s*(?:~\s*)+[）)]/g, '（ ）').replace(/~?\s*_{2,}\s*~?/g, '（ ）').replace(/\s*(?:~\s*){2,}(?=\s*[\u4e00-\u9fffA-Za-z0-9])/g, '（ ）').replace(/\s*(?:~\s*){2,}/g, '').replace(/~/g, '').replace(/([A-Za-zΑ-Ωα-ω])_\s*_+\s*([A-Za-z0-9Α-Ωα-ω{}()+-]+)/g, '$1_$2').replace(/_\s*(甲|乙|丙|丁|极小值|极大值|最小值|最大值|球)(?=[\s=,，。.;；:：)]|$)/g, '_{$1}').replace(/\^\s*\^/g, '').replace(/_\s*_+/g, '_').replace(/\^\s*(?=[，。,.;；:：]|$)/g, '').replace(/_\s*(?=[=，。,.;；:：]|$)/g, '').replace(/_\s*(?=[\u4e00-\u9fff])/g, ' ').replace(/([A-Za-zΑ-Ωα-ω])\s+_+\s*([A-Za-z0-9Α-Ωα-ω{}()+-]+)/g, '$1_$2').replace(/([A-Za-zΑ-Ωα-ω0-9)\]}])\s+\^\s*([A-Za-z0-9Α-Ωα-ω{}()+-]+)/g, '$1^$2').replace(/\^\s+/g, '^').replace(/_\s+/g, '_').replace(/\s*([∩∪])\s*/g, '$1').replace(/·s\s*·s/g, '……').replace(/·s/g, '…').replace(/~{2,}/g, '').replace(/[（(]\s*~\s*[）)]/g, '（ ）').replace(/相\s+同/g, '相同').replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, '$1$2').replace(/\s+([,，。.;；:：])/g, '$1').replace(/([（(])\s+/g, '$1').replace(/\s+([）)])/g, '$1').replace(/[（(]\s*[）)]/g, '（ ）').replace(/\s+（\s*）/g, '（ ）').replace(/\s{2,}/g, ' ').trim();
  }
  function findNextScriptIndex(text, startIndex) {
    const caretIndex = text.indexOf('^', startIndex);
    const underscoreIndex = text.indexOf('_', startIndex);
    if (caretIndex < 0) return underscoreIndex;
    if (underscoreIndex < 0) return caretIndex;
    return Math.min(caretIndex, underscoreIndex);
  }
  function parseScriptToken(text, startIndex) {
    let tokenStart = startIndex;
    while (/\s/.test(text[tokenStart] || '')) tokenStart += 1;
    const first = text[tokenStart];
    if (first === '{' || first === '(') {
      const closing = first === '{' ? '}' : ')';
      const endIndex = text.indexOf(closing, tokenStart + 1);
      if (endIndex > tokenStart + 1) {
        return {
          value: text.slice(tokenStart + 1, endIndex),
          nextIndex: endIndex + 1
        };
      }
    }
    const match = text.slice(tokenStart).match(/^[+-]?\d+(?:\.\d+)?|^[A-Za-zΑ-Ωα-ω]+/);
    if (match) {
      return {
        value: match[0],
        nextIndex: tokenStart + match[0].length
      };
    }
    return {
      value: first,
      nextIndex: tokenStart + 1
    };
  }
  function QuestionBankWorkspace({
    stageId,
    stageLabel,
    cardMap,
    sceneEntryMap,
    onClose,
    onOpenCard,
    returnQuestionId,
    returnSnapshot
  }) {
    const [bank, setBank] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [mode, setMode] = useState(MODE_FREE);
    const [workspaceView, setWorkspaceView] = useState(VIEW_BROWSE);
    const [filters, setFilters] = useState({
      requireCards: false
    });
    const [browseShuffleSeed, setBrowseShuffleSeed] = useState(() => `browse-${Date.now()}-${Math.random()}`);
    const [basketIds, setBasketIds] = useState([]);
    const [practiceMode, setPracticeMode] = useState(MODE_FREE);
    const [practiceSet, setPracticeSet] = useState([]);
    const [paperDraft, setPaperDraft] = useState(null);
    const [savedPaperPackages, setSavedPaperPackages] = useState([]);
    const [paperSaveMessage, setPaperSaveMessage] = useState('');
    const [answers, setAnswers] = useState({});
    const [activeQuestionId, setActiveQuestionId] = useState('');
    const [report, setReport] = useState(null);
    const [busyAction, setBusyAction] = useState('');
    useEffect(() => {
      let active = true;
      setBank(null);
      setLoadError('');
      service.loadStageQuestionBank(stageId).then(payload => {
        if (active) setBank(payload);
      }).catch(error => {
        if (active) setLoadError(error?.message || '题库加载失败');
      });
      return () => {
        active = false;
      };
    }, [stageId]);
    useEffect(() => {
      setSavedPaperPackages(readPaperPackages(stageId));
    }, [stageId]);
    const visibleQuestions = useMemo(() => service.filterQuestions(bank?.questions || [], filters), [bank, filters]);
    const browseQuestions = useMemo(() => {
      const shufflePool = visibleQuestions.slice(0, QUESTION_BANK_BROWSE_SHUFFLE_LIMIT);
      const remainder = visibleQuestions.slice(QUESTION_BANK_BROWSE_SHUFFLE_LIMIT);
      return [...service.shuffleBrowseQuestions(shufflePool, browseShuffleSeed), ...remainder];
    }, [visibleQuestions, browseShuffleSeed]);
    useEffect(() => {
      if (!bank?.questions?.length) return;
      const snapshot = returnSnapshot && typeof returnSnapshot === 'object' ? returnSnapshot : null;
      const snapshotQuestionIds = Array.isArray(snapshot?.questionIds) ? snapshot.questionIds : [];
      if (snapshotQuestionIds.length && (!snapshot.stageId || snapshot.stageId === stageId)) {
        const nextSet = snapshotQuestionIds.map(questionId => service.getQuestion(bank.questions, questionId)).filter(Boolean);
        if (nextSet.length) {
          const nextAnswers = snapshot.answers && typeof snapshot.answers === 'object' ? {
            ...snapshot.answers
          } : {};
          const nextReport = service.buildPracticeReport({
            questions: nextSet,
            answers: nextAnswers
          });
          setPracticeMode(snapshot.practiceMode === MODE_DRAW ? MODE_DRAW : MODE_FREE);
          setPracticeSet(nextSet);
          setAnswers(nextAnswers);
          setActiveQuestionId(snapshot.activeQuestionId || returnQuestionId || nextSet[0]?.id || '');
          setReport(nextReport);
          setWorkspaceView(VIEW_REPORT);
          return;
        }
      }
      if (!returnQuestionId) return;
      const target = service.getQuestion(bank.questions, returnQuestionId);
      if (!target) return;
      const nextReport = service.buildPracticeReport({
        questions: [target],
        answers: {}
      });
      setPracticeMode(MODE_FREE);
      setPracticeSet([target]);
      setAnswers({});
      setActiveQuestionId(target.id);
      setReport(nextReport);
      setWorkspaceView(VIEW_REPORT);
    }, [returnSnapshot, returnQuestionId, bank, stageId]);
    const updateFilter = (key, value) => {
      setFilters(current => ({
        ...current,
        [key]: value
      }));
      setBrowseShuffleSeed(`filter-${Date.now()}-${Math.random()}`);
      setPracticeSet([]);
      setActiveQuestionId('');
      setReport(null);
      if (workspaceView !== VIEW_BROWSE) setWorkspaceView(VIEW_BROWSE);
    };
    const clearFilters = () => {
      setFilters({
        requireCards: false
      });
      setBrowseShuffleSeed(`filter-clear-${Date.now()}-${Math.random()}`);
      setPracticeSet([]);
      setActiveQuestionId('');
      setReport(null);
      if (workspaceView !== VIEW_BROWSE) setWorkspaceView(VIEW_BROWSE);
    };
    const updateBrowseMode = nextMode => {
      setMode(nextMode);
      setBrowseShuffleSeed(`mode-${Date.now()}-${Math.random()}`);
    };
    const toggleBasket = questionId => {
      setBasketIds(current => current.includes(questionId) ? current.filter(id => id !== questionId) : [...current, questionId]);
    };
    const runBusyAction = (actionKey, worker) => {
      if (busyAction) return;
      const startedAt = Date.now();
      setBusyAction(actionKey);
      window.setTimeout(() => {
        Promise.resolve().then(worker).finally(() => {
          const remainingMs = Math.max(0, QUESTION_BANK_BUSY_FEEDBACK_DELAY_MS - (Date.now() - startedAt));
          window.setTimeout(() => {
            setBusyAction(current => current === actionKey ? '' : current);
          }, remainingMs);
        });
      }, QUESTION_BANK_BUSY_ACTION_START_DELAY_MS);
    };
    const openPaperPreview = (nextSet, nextMode, sourceLabel) => {
      if (!nextSet.length) return;
      const nextDraft = createPaperDraft({
        stageId,
        stageLabel: stageLabel || bank?.label || '数学题库',
        questions: nextSet,
        practiceMode: nextMode,
        sourceLabel
      });
      setPaperDraft(nextDraft);
      setPaperSaveMessage('');
      setPracticeMode(nextMode);
      setPracticeSet(nextSet);
      setAnswers({});
      setReport(null);
      setActiveQuestionId(nextSet[0]?.id || '');
      setWorkspaceView(VIEW_PAPER_PREVIEW);
    };
    const startBasketPractice = () => runBusyAction('basket-paper', () => {
      const nextSet = service.createPracticeSet(bank?.questions || [], basketIds);
      if (!nextSet.length) return;
      openPaperPreview(nextSet, MODE_FREE, '手动组题');
    });
    const startRandomPractice = count => runBusyAction('random-paper', () => {
      const nextSet = service.drawPracticeQuestions(bank?.questions || [], {
        ...filters,
        count,
        preferCards: true,
        seed: `${Date.now()}`
      });
      if (!nextSet.length) return;
      openPaperPreview(nextSet, MODE_FREE, '随机生成');
    });
    const drawPractice = count => runBusyAction('draw-paper', () => {
      const nextSet = service.drawPracticeQuestions(bank?.questions || [], {
        ...filters,
        count: Math.max(1, Number(count) || DRAW_COUNT),
        preferCards: true,
        seed: `${Date.now()}`
      });
      if (!nextSet.length) return;
      openPaperPreview(nextSet, MODE_DRAW, '随机抽题');
    });
    const startPaperPractice = () => {
      if (!paperDraft?.questions?.length) return;
      setPracticeMode(paperDraft.practiceMode === MODE_DRAW ? MODE_DRAW : MODE_FREE);
      setPracticeSet(paperDraft.questions);
      setAnswers({});
      setReport(null);
      setActiveQuestionId(paperDraft.questions[0]?.id || '');
      setWorkspaceView(VIEW_PRACTICE);
    };
    const openPaperLecture = () => {
      if (!paperDraft?.questions?.length) return;
      setPracticeMode(paperDraft.practiceMode === MODE_DRAW ? MODE_DRAW : MODE_FREE);
      setPracticeSet(paperDraft.questions);
      setWorkspaceView(VIEW_LECTURE);
    };
    const savePaperPackage = ({
      includeSolutions = true
    } = {}) => runBusyAction('paper-save', () => {
      if (!paperDraft?.questions?.length) return;
      const nextPackage = createSavedPaperPackage(paperDraft);
      const nextPackages = [nextPackage, ...savedPaperPackages.filter(item => item.id !== nextPackage.id && item.title !== nextPackage.title)].slice(0, 12);
      const saved = writePaperPackages(stageId, nextPackages);
      if (!saved) {
        setPaperSaveMessage('保存失败：浏览器阻止了本地存储。');
        return;
      }
      const savedPaper = {
        ...paperDraft,
        savedAt: nextPackage.savedAt
      };
      setSavedPaperPackages(nextPackages);
      setPaperDraft(current => current ? {
        ...current,
        savedAt: nextPackage.savedAt
      } : current);
      const editionLabel = includeSolutions ? '教师版' : '学生版';
      setPaperSaveMessage(`正在生成 PDF：${editionLabel}`);
      return downloadPaperPackagePdf(savedPaper, cardMap, sceneEntryMap, {
        includeSolutions
      }).then(downloaded => {
        setPaperSaveMessage(downloaded ? `已保存到最近作业包，并已下载${editionLabel} PDF` : `已保存到最近作业包，${editionLabel} PDF 下载失败`);
      });
    });
    const openSavedPaperPackage = savedPackage => {
      const nextSet = (savedPackage.questionIds || []).map(questionId => service.getQuestion(bank?.questions || [], questionId)).filter(Boolean);
      if (!nextSet.length) return;
      setPaperDraft(createPaperDraft({
        stageId,
        stageLabel: stageLabel || bank?.label || '数学题库',
        questions: nextSet,
        practiceMode: savedPackage.practiceMode === MODE_DRAW ? MODE_DRAW : MODE_FREE,
        sourceLabel: '最近作业包',
        title: savedPackage.title,
        packageId: savedPackage.id,
        savedAt: savedPackage.savedAt
      }));
      setPaperSaveMessage(savedPackage.savedAt ? '已从最近作业包打开' : '');
      setPracticeMode(savedPackage.practiceMode === MODE_DRAW ? MODE_DRAW : MODE_FREE);
      setPracticeSet(nextSet);
      setAnswers({});
      setReport(null);
      setActiveQuestionId(nextSet[0]?.id || '');
      setWorkspaceView(VIEW_PAPER_PREVIEW);
    };
    const selectNextQuestionAfterAnswer = questionId => {
      const currentIndex = practiceSet.findIndex(question => question.id === questionId);
      if (currentIndex < 0) return;
      const nextQuestion = practiceSet[currentIndex + 1];
      if (nextQuestion) setActiveQuestionId(nextQuestion.id);
    };
    const updateAnswer = (questionId, answer, options = {}) => {
      setAnswers(current => ({
        ...current,
        [questionId]: answer
      }));
      if (options.autoAdvance) {
        window.setTimeout(() => selectNextQuestionAfterAnswer(questionId), AUTO_ADVANCE_DELAY_MS);
      }
    };
    const submitPractice = () => {
      const nextReport = service.buildPracticeReport({
        questions: practiceSet,
        answers
      });
      setReport(nextReport);
      setWorkspaceView(VIEW_REPORT);
    };
    const resetToBrowse = () => {
      setWorkspaceView(VIEW_BROWSE);
      setPracticeSet([]);
      setAnswers({});
      setActiveQuestionId('');
      setReport(null);
      setPaperDraft(null);
      setPaperSaveMessage('');
    };
    const createReturnSnapshot = questionId => ({
      version: 1,
      stageId,
      view: VIEW_REPORT,
      practiceMode,
      questionIds: practiceSet.map(question => question.id),
      answers: {
        ...answers
      },
      activeQuestionId: questionId || activeQuestionId || practiceSet[0]?.id || ''
    });
    const answeredCount = useMemo(() => practiceSet.filter(question => service.isQuestionAnswered(question, answers[question.id])).length, [practiceSet, answers]);
    return /*#__PURE__*/React.createElement("div", {
      className: `${QUESTION_BANK_VISUAL_V2} fixed inset-0 z-[80] overflow-hidden bg-[#f6f3ea] text-zinc-950`,
      "data-qb-theme": QUESTION_BANK_LIGHT_THEME_STYLE,
      "data-qb-visual-version": "paper-workbench-v2",
      style: QUESTION_BANK_BACKGROUND_STYLE
    }, /*#__PURE__*/React.createElement("style", null, QUESTION_BANK_MOTION_STYLE), busyAction ? /*#__PURE__*/React.createElement("div", {
      className: "pointer-events-none absolute left-1/2 top-4 z-[95] -translate-x-1/2 rounded-full border border-[#d8b253]/35 bg-white px-4 py-2 text-xs font-black text-[#31524d] shadow-[0_14px_34px_rgba(89,74,40,0.16)]",
      "data-qb-busy-overlay": "question-bank-busy-status",
      "aria-live": "polite"
    }, /*#__PURE__*/React.createElement(BusyActionContent, {
      busy: true,
      label: getBusyActionLabel(busyAction),
      busyLabel: getBusyActionLabel(busyAction)
    })) : null, /*#__PURE__*/React.createElement("div", {
      className: "relative flex h-full min-h-0 flex-col overflow-hidden p-3 sm:p-5"
    }, /*#__PURE__*/React.createElement(QuestionBankHeader, {
      title: workspaceView === VIEW_PRACTICE ? '题库练习试卷' : workspaceView === VIEW_REPORT ? '答题报告' : workspaceView === VIEW_PAPER_PREVIEW ? '作业包预览' : workspaceView === VIEW_LECTURE ? '教师讲评' : '题库练习系统',
      eyebrow: stageLabel || bank?.label || '数学题库',
      onClose: onClose
    }), loadError ? /*#__PURE__*/React.createElement("div", {
      className: "flex flex-1 items-center justify-center rounded-[24px] border border-rose-300/20 bg-rose-50 p-8 text-center text-sm font-bold text-rose-700"
    }, loadError) : !bank ? /*#__PURE__*/React.createElement("div", {
      className: "flex flex-1 items-center justify-center rounded-[24px] border border-zinc-200 bg-white p-8 text-sm font-black text-zinc-700"
    }, /*#__PURE__*/React.createElement(BusyActionContent, {
      busy: true,
      label: "\u6B63\u5728\u52A0\u8F7D\u9898\u5E93",
      busyLabel: "\u6B63\u5728\u52A0\u8F7D\u9898\u5E93"
    })) : workspaceView === VIEW_PRACTICE ? /*#__PURE__*/React.createElement(PracticeSessionView, {
      stageLabel: stageLabel || bank.label,
      practiceMode: practiceMode,
      questions: practiceSet,
      answers: answers,
      answeredCount: answeredCount,
      activeQuestionId: activeQuestionId,
      onAnswerChange: updateAnswer,
      onSelectQuestion: setActiveQuestionId,
      onSubmit: submitPractice,
      onBack: resetToBrowse
    }) : workspaceView === VIEW_REPORT ? /*#__PURE__*/React.createElement(PracticeReportView, {
      report: report,
      practiceMode: practiceMode,
      cardMap: cardMap,
      sceneEntryMap: sceneEntryMap,
      onBack: resetToBrowse,
      onRetry: () => {
        if (!practiceSet.length) return;
        setAnswers({});
        setReport(null);
        setActiveQuestionId(practiceSet[0]?.id || '');
        setWorkspaceView(VIEW_PRACTICE);
      },
      onOpenCard: (cardId, questionId) => onOpenCard(cardId, questionId, createReturnSnapshot(questionId))
    }) : workspaceView === VIEW_PAPER_PREVIEW ? /*#__PURE__*/React.createElement(PaperPackagePreviewView, {
      paper: paperDraft,
      cardMap: cardMap,
      sceneEntryMap: sceneEntryMap,
      onBack: resetToBrowse,
      onStartPractice: startPaperPractice,
      onLecture: openPaperLecture,
      onSave: savePaperPackage,
      busyAction: busyAction,
      saveMessage: paperSaveMessage,
      onOpenCard: (cardId, questionId) => onOpenCard(cardId, questionId, createReturnSnapshot(questionId))
    }) : workspaceView === VIEW_LECTURE ? /*#__PURE__*/React.createElement(PaperLectureView, {
      paper: paperDraft,
      cardMap: cardMap,
      sceneEntryMap: sceneEntryMap,
      onBack: () => setWorkspaceView(VIEW_PAPER_PREVIEW),
      onOpenCard: (cardId, questionId) => onOpenCard(cardId, questionId, createReturnSnapshot(questionId))
    }) : /*#__PURE__*/React.createElement(QuestionBankBrowseView, {
      bank: bank,
      stageLabel: stageLabel || bank.label,
      filters: filters,
      mode: mode,
      questions: browseQuestions,
      basketIds: basketIds,
      selectedQuestions: service.createPracticeSet(bank.questions, basketIds),
      savedPaperPackages: savedPaperPackages,
      busyAction: busyAction,
      cardMap: cardMap,
      sceneEntryMap: sceneEntryMap,
      onFilterChange: updateFilter,
      onClearFilters: clearFilters,
      onModeChange: updateBrowseMode,
      onToggleBasket: toggleBasket,
      onStartBasketPractice: startBasketPractice,
      onStartRandomPractice: startRandomPractice,
      onDrawPractice: drawPractice,
      onClearBasket: () => setBasketIds([]),
      onOpenSavedPaper: openSavedPaperPackage
    })));
  }
  function readPaperPackages(stageId) {
    try {
      const payload = JSON.parse(window.localStorage?.getItem(PAPER_PACKAGES_STORAGE_KEY) || '{}');
      return Array.isArray(payload?.[stageId]) ? payload[stageId] : [];
    } catch (error) {
      return [];
    }
  }
  function writePaperPackages(stageId, packages) {
    try {
      const payload = JSON.parse(window.localStorage?.getItem(PAPER_PACKAGES_STORAGE_KEY) || '{}');
      payload[stageId] = packages;
      window.localStorage?.setItem(PAPER_PACKAGES_STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (error) {
      // Local storage may be disabled; the package preview still works without persistence.
      return false;
    }
  }
  function createPaperDraft({
    stageId,
    stageLabel,
    questions,
    practiceMode,
    sourceLabel,
    title,
    packageId,
    savedAt
  }) {
    const createdAt = new Date().toISOString();
    return {
      id: packageId || `paper-${stageId}-${Date.now()}`,
      title: title || `${stageLabel || '数学'}${practiceMode === MODE_DRAW ? '随机抽题' : '作业包'}-${questions.length}题`,
      stageId,
      stageLabel,
      practiceMode,
      sourceLabel,
      createdAt,
      savedAt: savedAt || '',
      questions,
      summary: summarizePaperQuestions(questions)
    };
  }
  function createSavedPaperPackage(paper) {
    return {
      id: paper.id,
      title: paper.title,
      stageId: paper.stageId,
      practiceMode: paper.practiceMode,
      sourceLabel: paper.sourceLabel,
      questionIds: paper.questions.map(question => question.id),
      questionCount: paper.questions.length,
      knowledgePoints: paper.summary.knowledgePoints,
      cardIds: paper.summary.cardIds,
      createdAt: paper.createdAt,
      savedAt: new Date().toISOString()
    };
  }
  function summarizePaperQuestions(questions) {
    const knowledgePoints = Array.from(new Set(questions.flatMap(question => question.knowledgePoints || []))).slice(0, 12);
    const cardIds = Array.from(new Set(questions.flatMap(question => (question.matchedCards || []).map(match => match.cardId)))).filter(Boolean);
    const types = Array.from(new Set(questions.map(question => question.type).filter(Boolean)));
    const difficulties = Array.from(new Set(questions.map(question => question.difficulty).filter(Boolean)));
    const figureCount = questions.filter(question => question.figure).length;
    return {
      knowledgePoints,
      cardIds,
      types,
      difficulties,
      figureCount
    };
  }
  function getCardDisplayName(cardId, cardMap, sceneEntryMap) {
    const normalizedCardId = String(cardId || '').trim();
    const card = cardMap?.get ? cardMap.get(normalizedCardId) : null;
    const sceneEntry = sceneEntryMap?.get ? sceneEntryMap.get(normalizedCardId) : null;
    return card?.title || card?.label || sceneEntry?.title || sceneEntry?.label || normalizedCardId;
  }
  function getQuestionLearningStageLabel(question) {
    const labels = {
      sync_basic: '同步基础',
      topic_boost: '专题提升',
      exam_decomposed: '真题拆解',
      exam_real: '真题练习',
      challenge: '压轴挑战'
    };
    return labels[question?.learningStage] || '未分层';
  }
  function getSelectedKnowledgePoints(filters) {
    const value = filters?.knowledgePoint;
    return Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean) : String(value || '').split(/[、,，;；]/).map(item => item.trim()).filter(Boolean);
  }
  function hasActiveQuestionBankFilters(filters) {
    return Boolean(filters?.grade || filters?.type || filters?.difficulty || filters?.learningStage || filters?.requireCards || getSelectedKnowledgePoints(filters).length);
  }
  function buildActiveFilterTags(filters) {
    const tags = [];
    if (filters?.grade) tags.push({
      key: 'grade',
      label: `年级：${filters.grade}`
    });
    getSelectedKnowledgePoints(filters).forEach((point, index) => {
      tags.push({
        key: `knowledge-${index}-${point}`,
        label: `知识点：${point}`
      });
    });
    if (filters?.type) tags.push({
      key: 'type',
      label: `题型：${filters.type}`
    });
    if (filters?.difficulty) tags.push({
      key: 'difficulty',
      label: `难度：${filters.difficulty}`
    });
    if (filters?.learningStage) tags.push({
      key: 'learningStage',
      label: `阶段：${filters.learningStage}`
    });
    if (filters?.requireCards) tags.push({
      key: 'requireCards',
      label: '仅可视化卡片'
    });
    return tags;
  }
  function QuestionBankBrowseView({
    bank,
    stageLabel,
    filters,
    mode,
    questions,
    basketIds,
    selectedQuestions,
    savedPaperPackages,
    busyAction,
    cardMap,
    sceneEntryMap,
    onFilterChange,
    onClearFilters,
    onModeChange,
    onToggleBasket,
    onStartBasketPractice,
    onStartRandomPractice,
    onDrawPractice,
    onClearBasket,
    onOpenSavedPaper
  }) {
    const hasActiveFilters = hasActiveQuestionBankFilters(filters);
    return /*#__PURE__*/React.createElement("div", {
      className: `${QUESTION_BANK_V15_WORKBENCH} flex flex-col flex-1 min-h-0 gap-3 overflow-y-auto lg:overflow-hidden no-scrollbar touch-pan-y overscroll-contain rounded-[22px] border border-[#e7dcc4] p-2 pr-1 pb-3 shadow-[0_22px_70px_rgba(89,74,40,0.10)] lg:p-3 lg:pr-3 lg:pb-3`,
      "data-qb-workbench": QUESTION_BANK_V15_WORKBENCH,
      style: {
        ...TOUCH_SCROLL_STYLE,
        ...QUESTION_BANK_WORKBENCH_STYLE
      }
    }, /*#__PURE__*/React.createElement(QuestionBankWorkflowStrip, {
      mode: mode,
      hasActiveFilters: hasActiveFilters,
      basketCount: basketIds.length
    }), /*#__PURE__*/React.createElement(QuestionBankActiveFilterRail, {
      filters: filters,
      onClearFilters: onClearFilters
    }), /*#__PURE__*/React.createElement(QuestionBankMobileActionDock, {
      mode: mode,
      basketCount: basketIds.length,
      availableCount: questions.length,
      busyAction: busyAction,
      onStartBasketPractice: onStartBasketPractice,
      onStartRandomPractice: onStartRandomPractice,
      onDrawPractice: onDrawPractice
    }), /*#__PURE__*/React.createElement("div", {
      className: "grid min-h-0 gap-3 lg:grid-cols-[280px_minmax(0,1fr)_340px]"
    }, /*#__PURE__*/React.createElement(QuestionBankFilters, {
      bank: bank,
      filters: filters,
      mode: mode,
      onChange: onFilterChange,
      onClearFilters: onClearFilters,
      onModeChange: onModeChange
    }), /*#__PURE__*/React.createElement(QuestionBankList, {
      questions: questions,
      basketIds: basketIds,
      cardMap: cardMap,
      sceneEntryMap: sceneEntryMap,
      onToggleBasket: onToggleBasket,
      onClearFilters: onClearFilters
    }), /*#__PURE__*/React.createElement(QuestionBankActionPanel, {
      mode: mode,
      basketCount: basketIds.length,
      availableCount: questions.length,
      selectedQuestions: selectedQuestions,
      savedPaperPackages: savedPaperPackages,
      busyAction: busyAction,
      onStartBasketPractice: onStartBasketPractice,
      onStartRandomPractice: onStartRandomPractice,
      onDrawPractice: onDrawPractice,
      onClearBasket: onClearBasket,
      onToggleBasket: onToggleBasket,
      onOpenSavedPaper: onOpenSavedPaper
    })));
  }
  function QuestionBankMobileActionDock({
    mode,
    basketCount,
    availableCount,
    busyAction,
    onStartBasketPractice,
    onStartRandomPractice,
    onDrawPractice
  }) {
    const isFree = mode === MODE_FREE;
    const quickCount = Math.max(1, Math.min(5, availableCount || 1));
    const canUseRandom = availableCount > 0;
    const basketBusy = busyAction === 'basket-paper';
    const quickBusy = isFree ? busyAction === 'random-paper' : busyAction === 'draw-paper';
    const dockStatus = isFree ? basketCount ? '已加入题目' : '待加入题目' : '快速抽题';
    return /*#__PURE__*/React.createElement("div", {
      className: `shrink-0 lg:hidden rounded-[18px] p-2 ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      "data-qb-mobile-dock": "question-bank-mobile-action-dock",
      "data-qb-paper-surface": "assignment-paper-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0 flex-1 rounded-[14px] border border-zinc-200 bg-zinc-50 px-3 py-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black tracking-[0.16em] text-zinc-500"
    }, isFree ? '出卷篮' : '抽题模式'), /*#__PURE__*/React.createElement("div", {
      className: "mt-0.5 truncate text-sm font-black text-zinc-950"
    }, dockStatus)), isFree ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onStartBasketPractice,
      disabled: !basketCount || !!busyAction,
      "aria-busy": basketBusy,
      "data-qb-busy-action": "smart-paper-generation",
      className: `${QUESTION_BANK_PAPER_BUTTON_CLASS} shrink-0 px-3 text-xs`
    }, /*#__PURE__*/React.createElement(BusyActionContent, {
      busy: basketBusy,
      label: "\u751F\u6210\u5DF2\u9009",
      busyLabel: "\u667A\u80FD\u7EC4\u5377\u4E2D"
    })) : null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => isFree ? onStartRandomPractice(quickCount) : onDrawPractice(quickCount),
      disabled: !canUseRandom || !!busyAction,
      "aria-busy": quickBusy,
      "data-qb-busy-action": isFree ? 'smart-paper-generation' : 'smart-random-draw',
      className: `${isFree ? QUESTION_BANK_PRIMARY_BUTTON_CLASS : QUESTION_BANK_PAPER_BUTTON_CLASS} shrink-0 px-3 text-xs`
    }, /*#__PURE__*/React.createElement(BusyActionContent, {
      busy: quickBusy,
      label: isFree ? '随机补齐' : '立即抽题',
      busyLabel: isFree ? '智能组卷中' : '智能抽题中'
    }))));
  }
  function QuestionBankActiveFilterRail({
    filters,
    onClearFilters
  }) {
    const tags = buildActiveFilterTags(filters);
    if (!tags.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: `shrink-0 rounded-[16px] px-3 py-2 ${QUESTION_BANK_MUTED_SURFACE_CLASS}`,
      "data-qb-active-filter-rail": "question-bank-active-filter-rail"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 text-[10px] font-black tracking-[0.18em] text-amber-800"
    }, "\u5F53\u524D\u7B5B\u9009"), /*#__PURE__*/React.createElement("div", {
      className: "flex min-w-0 flex-1 flex-wrap gap-1.5"
    }, tags.map(tag => /*#__PURE__*/React.createElement("span", {
      key: tag.key,
      className: "max-w-full truncate rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-700"
    }, tag.label))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClearFilters,
      className: `${QUESTION_BANK_PAPER_BUTTON_CLASS} min-h-[36px] shrink-0 px-3 text-[10px]`
    }, "\u6E05\u7A7A")));
  }
  function QuestionBankWorkflowStrip({
    mode,
    hasActiveFilters,
    basketCount
  }) {
    const steps = [{
      key: 'filter',
      label: '筛选定位',
      active: hasActiveFilters,
      tone: 'amber'
    }, {
      key: 'pick',
      label: mode === MODE_DRAW ? '随机抽题' : '挑题组卷',
      active: true,
      tone: mode === MODE_DRAW ? 'emerald' : 'amber'
    }, {
      key: 'paper',
      label: '生成试卷',
      active: basketCount > 0 || mode === MODE_DRAW,
      tone: 'emerald'
    }, {
      key: 'report',
      label: '练习讲评',
      active: false,
      tone: 'zinc'
    }];
    return /*#__PURE__*/React.createElement("div", {
      className: `shrink-0 rounded-[18px] p-2 sm:p-3 ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      "data-qb-flow": "QuestionBankWorkflowStrip"
    }, /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-4 gap-1.5 sm:gap-2"
    }, steps.map((step, index) => /*#__PURE__*/React.createElement("div", {
      key: step.key,
      className: `min-h-[52px] rounded-[12px] border px-1.5 py-2 sm:min-h-[48px] sm:rounded-[14px] sm:px-3 ${step.active ? step.tone === 'emerald' ? 'border-emerald-200/45 bg-emerald-50' : 'border-amber-200/45 bg-amber-50' : 'border-zinc-200 bg-zinc-50'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: `text-[9px] font-black tracking-[0.08em] sm:text-[10px] sm:tracking-[0.16em] ${step.active ? step.tone === 'emerald' ? 'text-emerald-800' : 'text-amber-800' : 'text-zinc-500'}`
    }, "\u7B2C ", index + 1, " \u6B65"), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 truncate text-[11px] font-black text-zinc-950 sm:text-xs"
    }, step.label)))));
  }
  function QuestionBankHeader({
    eyebrow,
    title,
    onClose
  }) {
    return /*#__PURE__*/React.createElement("header", {
      className: `mb-3 flex shrink-0 items-center justify-between gap-2 rounded-[18px] px-3 py-2 sm:rounded-[22px] sm:px-4 sm:py-3 ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      "data-qb-header": "question-bank-header"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex min-w-0 items-center gap-1.5 sm:gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 rounded-full border border-amber-200/60 bg-[#fff7dd] px-2 py-0.5 text-[9px] font-black tracking-[0.12em] text-amber-800 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.2em]"
    }, "\u9898\u5E93\u5DE5\u4F5C\u53F0"), /*#__PURE__*/React.createElement("span", {
      className: "min-w-0 truncate text-[10px] font-black tracking-[0.12em] text-zinc-500 uppercase sm:text-[11px] sm:tracking-[0.22em]"
    }, eyebrow)), /*#__PURE__*/React.createElement("h2", {
      className: "mt-0.5 truncate text-base font-black text-zinc-950 sm:mt-1 sm:text-2xl"
    }, title)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClose,
      className: `${QUESTION_BANK_SECONDARY_BUTTON_CLASS} shrink-0 px-3 py-2 text-[11px] sm:px-4 sm:text-xs`
    }, "\u8FD4\u56DE\u53EF\u89C6\u5316"));
  }
  function QuestionBankFilters({
    bank,
    filters,
    onChange,
    onClearFilters,
    mode,
    onModeChange
  }) {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const activeKnowledgePoints = getSelectedKnowledgePoints(filters);
    const hasActiveFilters = hasActiveQuestionBankFilters(filters);
    return /*#__PURE__*/React.createElement("aside", {
      className: `relative z-[60] order-1 shrink-0 min-h-0 overflow-visible lg:z-auto lg:overflow-y-auto no-scrollbar touch-pan-y overscroll-contain rounded-[18px] sm:rounded-[24px] p-3 sm:p-4 lg:order-none ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      "data-qb-filter-panel": "question-bank-filter-panel",
      style: TOUCH_SCROLL_STYLE
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3 grid grid-cols-2 gap-1 rounded-[16px] border border-zinc-200 bg-zinc-50 p-1"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onModeChange(MODE_FREE),
      className: `min-h-[42px] rounded-[13px] px-2 py-2 text-xs font-black transition-all ${mode === MODE_FREE ? 'bg-amber-300 text-zinc-950 shadow-[0_10px_24px_rgba(251,191,36,0.18)]' : 'bg-white text-zinc-700 active:bg-zinc-100'}`
    }, "\u81EA\u7531\u7EC4\u9898"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onModeChange(MODE_DRAW),
      className: `min-h-[42px] rounded-[13px] px-2 py-2 text-xs font-black transition-all ${mode === MODE_DRAW ? 'bg-emerald-300 text-zinc-950 shadow-[0_10px_24px_rgba(110,231,183,0.16)]' : 'bg-white text-zinc-700 active:bg-zinc-100'}`
    }, "\u968F\u673A\u62BD\u9898")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      "aria-expanded": mobileFiltersOpen,
      "data-qb-mobile-filter-toggle": "question-bank-mobile-filter-toggle",
      onClick: () => setMobileFiltersOpen(open => !open),
      className: "mb-3 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[16px] border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-black text-zinc-950 transition-all active:scale-[0.99] lg:hidden"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "block text-[10px] tracking-[0.18em] text-zinc-500"
    }, "\u7B5B\u9009\u6761\u4EF6"), /*#__PURE__*/React.createElement("span", {
      className: "mt-0.5 block"
    }, hasActiveFilters ? '已应用筛选' : '默认范围')), /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 rounded-full bg-zinc-50 px-3 py-1 text-[10px] text-zinc-700"
    }, mobileFiltersOpen ? '收起' : '展开')), /*#__PURE__*/React.createElement("div", {
      className: `${mobileFiltersOpen ? 'block' : 'hidden'} relative z-[70] rounded-[18px] border border-[#e7dcc4] bg-white p-3 shadow-[0_18px_42px_rgba(89,74,40,0.12)] lg:z-auto lg:block lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`,
      "data-qb-filter-controls": "question-bank-filter-controls",
      "data-qb-mobile-filter-sheet": "opaque-filter-sheet"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rounded-[16px] border border-zinc-200 bg-white p-3"
    }, /*#__PURE__*/React.createElement(FilterDropdown, {
      label: "\u5E74\u7EA7",
      value: filters.grade || '',
      options: bank.filters.grades,
      onChange: value => onChange('grade', value)
    }), /*#__PURE__*/React.createElement(MultiSelectDropdown, {
      label: "\u77E5\u8BC6\u70B9",
      values: filters.knowledgePoint || [],
      options: bank.filters.knowledgePoints,
      onChange: value => onChange('knowledgePoint', value)
    }), activeKnowledgePoints.length ? /*#__PURE__*/React.createElement("div", {
      className: "-mt-1 mb-3 flex flex-wrap gap-1.5"
    }, activeKnowledgePoints.slice(0, 6).map(point => /*#__PURE__*/React.createElement("span", {
      key: point,
      className: "rounded-full border border-amber-200/20 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800"
    }, point)), activeKnowledgePoints.length > 6 ? /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-400"
    }, "+", activeKnowledgePoints.length - 6) : null) : null, /*#__PURE__*/React.createElement(FilterDropdown, {
      label: "\u9898\u578B",
      value: filters.type || '',
      options: bank.filters.types,
      onChange: value => onChange('type', value)
    }), /*#__PURE__*/React.createElement(FilterDropdown, {
      label: "\u96BE\u5EA6",
      value: filters.difficulty || '',
      options: bank.filters.difficulties,
      onChange: value => onChange('difficulty', value)
    }), /*#__PURE__*/React.createElement(FilterDropdown, {
      label: "\u9636\u6BB5",
      value: filters.learningStage || '',
      options: bank.filters.learningStages,
      onChange: value => onChange('learningStage', value)
    })), /*#__PURE__*/React.createElement("label", {
      className: "mt-3 flex items-center justify-between gap-3 rounded-[16px] border border-zinc-200 bg-white px-3 py-3 text-xs font-bold text-zinc-700"
    }, /*#__PURE__*/React.createElement("span", {
      className: "leading-5"
    }, "\u53EA\u770B\u6709\u53EF\u89C6\u5316\u5361\u7247\u7684\u9898"), /*#__PURE__*/React.createElement("span", {
      className: `relative h-7 w-12 shrink-0 rounded-full border transition-all ${filters.requireCards !== false ? 'border-emerald-200/50 bg-emerald-300' : 'border-zinc-200 bg-zinc-50'}`
    }, /*#__PURE__*/React.createElement("input", {
      className: "absolute inset-0 opacity-0",
      type: "checkbox",
      checked: filters.requireCards !== false,
      onChange: event => onChange('requireCards', event.target.checked)
    }), /*#__PURE__*/React.createElement("span", {
      className: `absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${filters.requireCards !== false ? 'left-6' : 'left-1'}`
    }))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClearFilters,
      disabled: !hasActiveFilters,
      className: "mt-3 min-h-[42px] w-full rounded-[16px] border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-black text-zinc-700 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    }, "\u6E05\u7A7A\u7B5B\u9009")));
  }
  function FilterDropdown({
    label,
    value,
    options,
    onChange
  }) {
    const [open, setOpen] = useState(false);
    const normalizedValue = value || '';
    const entries = [{
      label: '全部',
      value: ''
    }, ...(options || []).map(option => ({
      label: option,
      value: option
    }))];
    const selectedLabel = entries.find(entry => entry.value === normalizedValue)?.label || '全部';
    const selectValue = nextValue => {
      onChange(nextValue);
      setOpen(false);
    };
    return /*#__PURE__*/React.createElement("div", {
      className: `relative mb-3 ${open ? 'z-[120]' : 'z-[1]'}`,
      onBlur: event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-1.5 block text-[11px] font-black tracking-widest text-zinc-500"
    }, label), /*#__PURE__*/React.createElement("button", {
      type: "button",
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      onClick: () => setOpen(current => !current),
      className: "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm font-black text-zinc-950 outline-none transition-all hover:border-amber-300 hover:bg-white focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/25"
    }, /*#__PURE__*/React.createElement("span", {
      className: "min-w-0 truncate"
    }, selectedLabel), /*#__PURE__*/React.createElement("span", {
      className: `shrink-0 text-base leading-none text-zinc-700 transition-transform ${open ? 'rotate-180' : ''}`
    }, "\u2304")), open ? /*#__PURE__*/React.createElement("div", {
      role: "listbox",
      "aria-label": label,
      className: "absolute left-0 right-0 top-[calc(100%+6px)] z-[95] max-h-60 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(120,96,44,0.16)]",
      style: TOUCH_SCROLL_STYLE
    }, entries.map(entry => {
      const selected = entry.value === normalizedValue;
      return /*#__PURE__*/React.createElement("button", {
        key: `${label}-${entry.value || 'all'}`,
        type: "button",
        role: "option",
        "aria-selected": selected,
        onMouseDown: event => event.preventDefault(),
        onClick: () => selectValue(entry.value),
        className: `flex min-h-[36px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-black transition-all ${selected ? 'bg-amber-300 text-zinc-950' : 'bg-white text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'}`
      }, /*#__PURE__*/React.createElement("span", {
        className: "min-w-0 truncate"
      }, entry.label), selected ? /*#__PURE__*/React.createElement("span", {
        className: "shrink-0 text-xs"
      }, "\u2713") : null);
    })) : null);
  }
  function MultiSelectDropdown({
    label,
    values,
    options,
    onChange
  }) {
    const [open, setOpen] = useState(false);
    const selectedValues = Array.isArray(values) ? values.map(item => String(item || '').trim()).filter(Boolean) : String(values || '').split(/[、,，;；]/).map(item => item.trim()).filter(Boolean);
    const selectedSet = new Set(selectedValues);
    const entries = (options || []).map(option => ({
      label: option,
      value: option
    }));
    const selectedLabel = selectedValues.length === 0 ? '全部' : selectedValues.length === 1 ? selectedValues[0] : `${selectedValues.length} 个知识点`;
    const clearValues = () => {
      onChange([]);
      setOpen(false);
    };
    const toggleValue = nextValue => {
      const normalizedValue = String(nextValue || '').trim();
      if (!normalizedValue) return;
      const nextValues = selectedSet.has(normalizedValue) ? selectedValues.filter(item => item !== normalizedValue) : [...selectedValues, normalizedValue];
      onChange(nextValues);
    };
    return /*#__PURE__*/React.createElement("div", {
      className: `relative mb-3 ${open ? 'z-[120]' : 'z-[1]'}`,
      onBlur: event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-1.5 block text-[11px] font-black tracking-widest text-zinc-500"
    }, label), /*#__PURE__*/React.createElement("button", {
      type: "button",
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      onClick: () => setOpen(current => !current),
      className: "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm font-black text-zinc-950 outline-none transition-all hover:border-amber-300 hover:bg-white focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/25"
    }, /*#__PURE__*/React.createElement("span", {
      className: "min-w-0 truncate"
    }, selectedLabel), /*#__PURE__*/React.createElement("span", {
      className: `shrink-0 text-base leading-none text-zinc-700 transition-transform ${open ? 'rotate-180' : ''}`
    }, "\u2304")), open ? /*#__PURE__*/React.createElement("div", {
      role: "listbox",
      "aria-label": label,
      "aria-multiselectable": "true",
      className: "absolute left-0 right-0 top-[calc(100%+6px)] z-[95] max-h-48 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain rounded-[16px] border border-zinc-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(120,96,44,0.16)]",
      style: TOUCH_SCROLL_STYLE
    }, /*#__PURE__*/React.createElement("div", {
      className: "sticky top-0 z-[1] mb-1 flex items-center justify-between gap-2 rounded-[12px] border border-zinc-200 bg-white px-2.5 py-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-black tracking-[0.16em] text-zinc-500"
    }, "\u5DF2\u9009\u77E5\u8BC6\u70B9"), /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-black text-zinc-700"
    }, selectedValues.length || '全部')), /*#__PURE__*/React.createElement("button", {
      type: "button",
      role: "option",
      "aria-selected": selectedValues.length === 0,
      onMouseDown: event => event.preventDefault(),
      onClick: clearValues,
      className: `mb-1 flex min-h-[32px] w-full items-center justify-between gap-2 rounded-[11px] px-2.5 py-1.5 text-left text-xs font-black transition-all ${selectedValues.length === 0 ? 'border border-amber-200/50 bg-amber-50 text-amber-800' : 'border border-transparent bg-white text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "min-w-0 truncate"
    }, "\u5168\u90E8"), selectedValues.length === 0 ? /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 text-xs"
    }, "\u2713") : null), entries.map(entry => {
      const selected = selectedSet.has(entry.value);
      return /*#__PURE__*/React.createElement("button", {
        key: `${label}-${entry.value}`,
        type: "button",
        role: "option",
        "aria-selected": selected,
        onMouseDown: event => event.preventDefault(),
        onClick: () => toggleValue(entry.value),
        className: `mb-1 flex min-h-[32px] w-full items-center justify-between gap-2 rounded-[11px] px-2.5 py-1.5 text-left text-xs font-black transition-all ${selected ? 'border border-amber-200/50 bg-amber-50 text-amber-800' : 'border border-transparent bg-white text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'}`
      }, /*#__PURE__*/React.createElement("span", {
        className: "min-w-0 truncate"
      }, entry.label), selected ? /*#__PURE__*/React.createElement("span", {
        className: "shrink-0 text-xs"
      }, "\u2713") : null);
    })) : null);
  }
  function QuestionBankList({
    questions,
    basketIds,
    cardMap,
    sceneEntryMap,
    onToggleBasket,
    onClearFilters
  }) {
    const [visibleQuestionCount, setVisibleQuestionCount] = useState(QUESTION_BANK_INITIAL_RENDER_COUNT);
    const renderedQuestions = useMemo(() => questions.slice(0, visibleQuestionCount), [questions, visibleQuestionCount]);
    const hasMoreQuestions = renderedQuestions.length < questions.length;
    useEffect(() => {
      setVisibleQuestionCount(QUESTION_BANK_INITIAL_RENDER_COUNT);
    }, [questions]);
    const loadMoreQuestions = () => {
      setVisibleQuestionCount(current => Math.min(current + QUESTION_BANK_RENDER_INCREMENT, questions.length));
    };
    return /*#__PURE__*/React.createElement("section", {
      className: "relative z-[1] order-3 min-h-0 shrink-0 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none no-scrollbar touch-pan-y overscroll-contain lg:order-none lg:overflow-y-auto lg:rounded-[24px] lg:border lg:border-[#e7dcc4] lg:bg-white lg:p-4 lg:shadow-[0_16px_44px_rgba(89,74,40,0.08)]",
      "data-qb-question-list": "mobile-flat-question-list",
      style: TOUCH_SCROLL_STYLE
    }, questions.length ? /*#__PURE__*/React.createElement("div", {
      className: "grid gap-3"
    }, renderedQuestions.map(question => /*#__PURE__*/React.createElement(QuestionBankQuestionCard, {
      key: question.id,
      question: question,
      selected: basketIds.includes(question.id),
      cardMap: cardMap,
      sceneEntryMap: sceneEntryMap,
      onToggleBasket: onToggleBasket
    })), /*#__PURE__*/React.createElement("div", {
      className: `rounded-[18px] p-3 text-center ${QUESTION_BANK_MUTED_SURFACE_CLASS}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-bold text-zinc-400"
    }, hasMoreQuestions ? '可继续加载更多符合条件的题目' : '当前列表已全部展开'), hasMoreQuestions ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: loadMoreQuestions,
      className: `mt-2 ${QUESTION_BANK_PAPER_BUTTON_CLASS} px-5 py-2 text-xs`
    }, "\u52A0\u8F7D\u66F4\u591A\u9898\u76EE") : null)) : /*#__PURE__*/React.createElement("div", {
      className: `rounded-[20px] p-5 text-sm font-bold leading-6 text-zinc-500 ${QUESTION_BANK_MUTED_SURFACE_CLASS}`
    }, /*#__PURE__*/React.createElement("div", null, "\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u7EC3\u4E60\u9898\u76EE\uFF0C\u53EF\u4EE5\u653E\u5BBD\u5E74\u7EA7\u3001\u77E5\u8BC6\u70B9\u6216\u9898\u578B\u7B5B\u9009\u3002"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClearFilters,
      "data-qb-empty-recovery": "clear-filters",
      className: `mt-4 ${QUESTION_BANK_PAPER_BUTTON_CLASS} text-xs`
    }, "\u6E05\u7A7A\u7B5B\u9009")));
  }
  function QuestionBankQuestionCard({
    question,
    selected,
    cardMap,
    sceneEntryMap,
    onToggleBasket
  }) {
    const matchedCards = Array.isArray(question.matchedCards) ? question.matchedCards : [];
    const cardNames = matchedCards.map(match => getCardDisplayName(match.cardId, cardMap, sceneEntryMap)).filter(Boolean).slice(0, 3);
    const knowledgePoints = Array.isArray(question.knowledgePoints) ? question.knowledgePoints : [];
    const hasFigure = Boolean(question.figure);
    const previewOptions = Array.isArray(question.options) ? question.options.slice(0, QUESTION_BANK_OPTION_PREVIEW_LIMIT) : [];
    return /*#__PURE__*/React.createElement("article", {
      "data-qb-card-state": selected ? 'selected' : 'available',
      className: `relative overflow-hidden rounded-[18px] border bg-white p-4 transition-all ${selected ? 'border-[#d8b253] shadow-[0_12px_30px_rgba(89,74,40,0.12)]' : 'border-[#e2e8f0] shadow-[0_8px_22px_rgba(15,23,42,0.04)]'}`
    }, selected ? /*#__PURE__*/React.createElement("span", {
      "data-qb-selected-rail": "question-card-selected-rail",
      className: "absolute inset-y-0 left-0 w-1 bg-[#f4c430]",
      "aria-hidden": "true"
    }) : null, /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex min-w-0 flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0 flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-1.5 text-[10px] font-black text-zinc-400"
    }, /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-zinc-50 px-2 py-1"
    }, question.grade || '未分级'), /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-zinc-50 px-2 py-1"
    }, question.type || '题型'), /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-zinc-50 px-2 py-1"
    }, question.difficulty || '难度'), /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-zinc-50 px-2 py-1"
    }, getQuestionLearningStageLabel(question)), hasFigure ? /*#__PURE__*/React.createElement("span", {
      className: "rounded-full border border-emerald-200/25 bg-emerald-50 px-2 py-1 text-emerald-800"
    }, "\u56FE\u5F62\u9898") : null, matchedCards.length ? /*#__PURE__*/React.createElement("span", {
      className: "rounded-full border border-amber-200/25 bg-amber-50 px-2 py-1 text-amber-800"
    }, "\u53EF\u89C6\u5316") : null), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 text-[15px] font-bold leading-7 text-zinc-950"
    }, /*#__PURE__*/React.createElement(MathInline, null, question.stem)))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onToggleBasket(question.id),
      className: `${selected ? QUESTION_BANK_PAPER_BUTTON_CLASS : QUESTION_BANK_SECONDARY_BUTTON_CLASS} shrink-0 px-4 py-2 text-xs`
    }, selected ? '已加入出卷篮' : '加入出卷篮')), /*#__PURE__*/React.createElement(QuestionFigure, {
      figure: question.figure,
      compact: true
    }), previewOptions.length ? /*#__PURE__*/React.createElement("div", {
      className: "mt-3 grid gap-2 sm:grid-cols-2",
      "data-qb-option-preview": "browse-card-options"
    }, previewOptions.map(option => /*#__PURE__*/React.createElement("div", {
      key: option.label,
      className: "rounded-[12px] border border-[#e7dcc4] bg-[#fffdf7] px-3 py-2 text-xs font-bold leading-5 text-zinc-700"
    }, /*#__PURE__*/React.createElement("span", {
      className: "mr-1 font-black text-[#0f766e]"
    }, option.label, "."), /*#__PURE__*/React.createElement(MathInline, null, option.text))), Array.isArray(question.options) && question.options.length > previewOptions.length ? /*#__PURE__*/React.createElement("div", {
      className: "rounded-[12px] border border-dashed border-[#d9d2c3] bg-white px-3 py-2 text-xs font-black text-zinc-400"
    }, "+", question.options.length - previewOptions.length, " \u4E2A\u9009\u9879") : null) : null, /*#__PURE__*/React.createElement("div", {
      className: "mt-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex min-w-0 flex-wrap items-start content-start gap-1.5 self-start",
      "data-qb-knowledge-tags": "browse-card-knowledge-tags",
      "data-qb-browse-visual-card-tags": "compact-inline"
    }, knowledgePoints.slice(0, 6).map(point => /*#__PURE__*/React.createElement("span", {
      key: point,
      className: "inline-flex min-h-[24px] self-start whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold leading-none text-zinc-700"
    }, point)), knowledgePoints.length > 6 ? /*#__PURE__*/React.createElement("span", {
      className: "inline-flex min-h-[24px] self-start whitespace-nowrap rounded-full bg-zinc-50 px-2 py-1 text-[10px] font-bold leading-none text-zinc-500"
    }, "+", knowledgePoints.length - 6) : null, cardNames.length ? /*#__PURE__*/React.createElement("span", {
      className: "inline-flex min-h-[24px] self-start whitespace-nowrap rounded-full border border-[#b7ddd6] bg-[#f4fbf9] px-2 py-1 text-[10px] font-black leading-none text-[#0f766e]"
    }, "\u53EF\u89C6\u5316\u5361\u7247") : null, cardNames.map(name => /*#__PURE__*/React.createElement("span", {
      key: name,
      className: "inline-flex max-w-full min-h-[24px] self-start truncate rounded-full border border-[#b7ddd6] bg-white px-2 py-1 text-[10px] font-bold leading-none text-[#0f766e]"
    }, name)), matchedCards.length > cardNames.length ? /*#__PURE__*/React.createElement("span", {
      className: "inline-flex min-h-[24px] self-start whitespace-nowrap rounded-full bg-zinc-50 px-2 py-1 text-[10px] font-bold leading-none text-zinc-500"
    }, "+", matchedCards.length - cardNames.length) : null)));
  }
  function QuestionBankActionPanel({
    mode,
    basketCount,
    availableCount,
    selectedQuestions,
    savedPaperPackages,
    busyAction,
    onStartBasketPractice,
    onStartRandomPractice,
    onDrawPractice,
    onClearBasket,
    onToggleBasket,
    onOpenSavedPaper
  }) {
    const isFree = mode === MODE_FREE;
    const randomLimit = Math.max(1, availableCount || 1);
    const [randomCount, setRandomCount] = useState(Math.min(5, randomLimit));
    const normalizedRandomCount = Math.max(1, Math.min(randomLimit, Number(randomCount) || 1));
    const basketBusy = busyAction === 'basket-paper';
    const randomBusy = busyAction === 'random-paper';
    const drawBusy = busyAction === 'draw-paper';
    const primaryBusy = isFree ? randomBusy : drawBusy;
    const updateRandomCount = value => {
      const nextValue = Math.max(1, Math.min(randomLimit, Number(value) || 1));
      setRandomCount(nextValue);
    };
    const basketStatus = isFree ? basketCount ? '已加入题目' : '待加入题目' : '随机生成试卷';
    return /*#__PURE__*/React.createElement("aside", {
      className: `hidden lg:block lg:order-none shrink-0 min-h-0 overflow-visible lg:overflow-y-auto no-scrollbar touch-pan-y overscroll-contain rounded-[18px] sm:rounded-[24px] p-3 sm:p-4 ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      style: TOUCH_SCROLL_STYLE
    }, /*#__PURE__*/React.createElement("div", {
      className: `rounded-[18px] p-4 ${QUESTION_BANK_MUTED_SURFACE_CLASS}`,
      "data-qb-paper-surface": "assignment-paper-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between gap-3"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black tracking-[0.22em] text-zinc-500"
    }, "\u51FA\u5377\u7BEE"), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-sm font-black text-zinc-950"
    }, basketStatus)), /*#__PURE__*/React.createElement("span", {
      className: `rounded-full px-2.5 py-1 text-[10px] font-black ${isFree ? 'bg-amber-300 text-zinc-950' : 'bg-emerald-300 text-zinc-950'}`
    }, isFree ? '自由组题' : '随机抽题')), isFree ? /*#__PURE__*/React.createElement("div", {
      className: "question-bank-v15-quick-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onStartBasketPractice,
      disabled: !basketCount || !!busyAction,
      "aria-busy": basketBusy,
      "data-qb-busy-action": "smart-paper-generation",
      className: `mt-4 w-full ${QUESTION_BANK_PAPER_BUTTON_CLASS} py-3 text-sm`
    }, /*#__PURE__*/React.createElement(BusyActionContent, {
      busy: basketBusy,
      label: "\u751F\u6210\u5DF2\u9009\u8BD5\u5377",
      busyLabel: "\u667A\u80FD\u7EC4\u5377\u4E2D"
    })), basketCount ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClearBasket,
      className: `mt-2 w-full ${QUESTION_BANK_SECONDARY_BUTTON_CLASS} py-3 text-xs`
    }, "\u6E05\u7A7A\u5DF2\u9009") : null) : null, /*#__PURE__*/React.createElement("div", {
      className: "mt-4 rounded-[16px] border border-[#d7ebe7] bg-[#f4fbf9] p-3",
      "data-qb-random-strategy": "balanced-distributed"
    }, /*#__PURE__*/React.createElement("label", {
      className: "block text-[11px] font-black tracking-widest text-zinc-500",
      htmlFor: "question-bank-random-count"
    }, "\u9898\u76EE\u6570\u91CF"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => updateRandomCount(normalizedRandomCount - 1),
      disabled: !availableCount || normalizedRandomCount <= 1,
      className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-zinc-200 bg-zinc-100 text-base font-black text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
    }, "-"), /*#__PURE__*/React.createElement("input", {
      id: "question-bank-random-count",
      type: "number",
      min: "1",
      max: randomLimit,
      value: normalizedRandomCount,
      onChange: event => updateRandomCount(event.target.value),
      className: "h-11 min-w-0 flex-1 rounded-[14px] border border-zinc-200 bg-white px-3 text-center text-base font-black text-zinc-950 outline-none focus:border-amber-200/70"
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => updateRandomCount(normalizedRandomCount + 1),
      disabled: !availableCount || normalizedRandomCount >= randomLimit,
      className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-zinc-200 bg-zinc-100 text-base font-black text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
    }, "+")), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-[11px] font-bold leading-5 text-zinc-500"
    }, isFree ? '按筛选随机补齐' : '按筛选随机抽取', "\uFF0C\u5C3D\u91CF\u5747\u8861\u5206\u6563\u77E5\u8BC6\u70B9\u3001\u9898\u578B\u548C\u53EF\u89C6\u5316\u5361\u7247\u3002"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => isFree ? onStartRandomPractice(normalizedRandomCount) : onDrawPractice(normalizedRandomCount),
      disabled: !availableCount || !!busyAction,
      "aria-busy": primaryBusy,
      "data-qb-busy-action": isFree ? 'smart-paper-generation' : 'smart-random-draw',
      className: `mt-3 w-full ${isFree ? QUESTION_BANK_PRIMARY_BUTTON_CLASS : QUESTION_BANK_PAPER_BUTTON_CLASS} py-3 text-sm`
    }, /*#__PURE__*/React.createElement(BusyActionContent, {
      busy: primaryBusy,
      label: isFree ? '随机生成试卷' : `随机抽 ${normalizedRandomCount} 题`,
      busyLabel: isFree ? '智能组卷中' : '智能抽题中'
    })))), isFree ? /*#__PURE__*/React.createElement("div", {
      className: `mt-3 rounded-[18px] p-4 ${QUESTION_BANK_MUTED_SURFACE_CLASS}`,
      "data-qb-paper-surface": "assignment-paper-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-zinc-500"
    }, "\u5DF2\u9009\u9898\u76EE")), selectedQuestions.length ? /*#__PURE__*/React.createElement("div", {
      className: "grid gap-2"
    }, selectedQuestions.map(question => /*#__PURE__*/React.createElement("div", {
      key: question.id,
      className: "question-bank-selected-item flex items-start gap-2 rounded-[14px] border border-[#e7dcc4] bg-white px-3 py-2 text-xs font-bold leading-5 text-zinc-700"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0 flex-1"
    }, /*#__PURE__*/React.createElement(MathInline, null, question.stem)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onToggleBasket(question.id),
      className: `${QUESTION_BANK_SECONDARY_BUTTON_CLASS} min-h-[36px] shrink-0 px-2.5 text-[10px]`
    }, "\u79FB\u9664")))) : /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-bold leading-6 text-zinc-400"
    }, "\u8FD8\u6CA1\u6709\u52A0\u5165\u9898\u76EE\u3002")) : null, /*#__PURE__*/React.createElement(SavedPaperPackages, {
      packages: savedPaperPackages || [],
      onOpen: onOpenSavedPaper
    }));
  }
  function SavedPaperPackages({
    packages,
    onOpen
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: `mt-3 rounded-[18px] p-4 ${QUESTION_BANK_MUTED_SURFACE_CLASS}`,
      "data-qb-paper-surface": "assignment-paper-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-zinc-500"
    }, "\u6700\u8FD1\u4F5C\u4E1A\u5305")), packages.length ? /*#__PURE__*/React.createElement("div", {
      className: "grid gap-2"
    }, packages.slice(0, 5).map(item => /*#__PURE__*/React.createElement("button", {
      key: item.id,
      type: "button",
      onClick: () => onOpen(item),
      className: "rounded-[14px] border border-[#e7dcc4] bg-white px-3 py-3 text-left transition-all active:scale-[0.99]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "truncate text-xs font-black text-zinc-950"
    }, item.title), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-[11px] font-bold text-zinc-500"
    }, item.questionCount, " \u9898 / ", item.knowledgePoints?.length || 0, " \u4E2A\u77E5\u8BC6\u70B9 / ", item.cardIds?.length || 0, " \u5F20\u5361\u7247")))) : /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-bold leading-6 text-zinc-400"
    }, "\u4FDD\u5B58\u540E\u7684\u8BD5\u5377\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002"));
  }
  function PaperPackagePreviewView({
    paper,
    cardMap,
    sceneEntryMap,
    onBack,
    onStartPractice,
    onLecture,
    onSave,
    busyAction,
    saveMessage,
    onOpenCard
  }) {
    const [includeSolutions, setIncludeSolutions] = useState(true);
    const questions = paper?.questions || [];
    const summary = paper?.summary || summarizePaperQuestions(questions);
    const cardTagItems = (summary.cardIds || []).slice(0, 18).map(cardId => ({
      key: cardId,
      label: getCardDisplayName(cardId, cardMap, sceneEntryMap)
    }));
    const savedAtText = formatPaperSavedAt(paper?.savedAt);
    const pdfBusy = busyAction === 'paper-save';
    return /*#__PURE__*/React.createElement("main", {
      className: `flex-1 min-h-0 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain rounded-[24px] p-4 ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      style: TOUCH_SCROLL_STYLE
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx-auto max-w-6xl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]"
    }, /*#__PURE__*/React.createElement("section", {
      className: `rounded-[20px] p-4 ${QUESTION_BANK_MUTED_SURFACE_CLASS}`,
      "data-qb-paper-surface": "assignment-paper-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-amber-700"
    }, "\u4F5C\u4E1A\u5305 V1 / ", paper?.sourceLabel || '生成试卷'), /*#__PURE__*/React.createElement("h3", {
      className: "mt-2 text-2xl font-black text-zinc-950"
    }, paper?.title || '数学作业包'), /*#__PURE__*/React.createElement("p", {
      className: "mt-2 text-sm font-bold leading-6 text-zinc-400"
    }, "\u5148\u9884\u89C8\u9898\u76EE\u7ED3\u6784\uFF0C\u518D\u9009\u62E9\u5B66\u751F\u7EC3\u4E60\u3001\u6559\u5E08\u8BB2\u8BC4\u6216\u4FDD\u5B58\u4F5C\u4E1A\u5305\u3002\u4FDD\u5B58\u540E\u53EF\u5728\u6700\u8FD1\u4F5C\u4E1A\u5305\u4E2D\u91CD\u65B0\u6253\u5F00\u3002"), /*#__PURE__*/React.createElement("div", {
      className: "mt-4 grid gap-2 sm:grid-cols-4"
    }, /*#__PURE__*/React.createElement(PaperStat, {
      label: "\u9898\u76EE",
      value: questions.length
    }), /*#__PURE__*/React.createElement(PaperStat, {
      label: "\u77E5\u8BC6\u70B9",
      value: summary.knowledgePoints.length
    }), /*#__PURE__*/React.createElement(PaperStat, {
      label: "\u5361\u7247",
      value: summary.cardIds.length
    }), /*#__PURE__*/React.createElement(PaperStat, {
      label: "\u914D\u56FE",
      value: summary.figureCount
    }))), /*#__PURE__*/React.createElement("section", {
      className: "rounded-[20px] border border-zinc-200 bg-white p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "grid gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onStartPractice,
      disabled: !questions.length,
      className: `${QUESTION_BANK_PAPER_BUTTON_CLASS} py-3 text-sm`
    }, "\u5F00\u59CB\u7EC3\u4E60"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onLecture,
      disabled: !questions.length,
      className: `${QUESTION_BANK_SECONDARY_BUTTON_CLASS} py-3 text-sm`
    }, "\u6559\u5E08\u8BB2\u8BC4"), /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-zinc-200 bg-zinc-50 p-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-2 px-1 text-[11px] font-black tracking-widest text-zinc-400"
    }, "\u4E0B\u8F7D\u5185\u5BB9"), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-1"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setIncludeSolutions(false),
      className: `min-h-[40px] rounded-xl px-2 py-2 text-xs font-black transition-all active:scale-95 ${includeSolutions ? 'bg-zinc-100 text-zinc-700' : 'bg-white text-zinc-950'}`
    }, "\u5B66\u751F\u7528\uFF1A\u4EC5\u9898\u76EE"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setIncludeSolutions(true),
      className: `min-h-[40px] rounded-xl px-2 py-2 text-xs font-black transition-all active:scale-95 ${includeSolutions ? 'bg-amber-300 text-zinc-950' : 'bg-zinc-100 text-zinc-700'}`
    }, "\u6559\u5E08\u7528\uFF1A\u5E26\u89E3\u6790"))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onSave({
        includeSolutions
      }),
      disabled: !questions.length || pdfBusy,
      "aria-busy": pdfBusy,
      "data-qb-busy-action": "pdf-generation",
      className: `py-3 text-sm ${paper?.savedAt ? QUESTION_BANK_PRIMARY_BUTTON_CLASS : QUESTION_BANK_SECONDARY_BUTTON_CLASS}`
    }, /*#__PURE__*/React.createElement(BusyActionContent, {
      busy: pdfBusy,
      label: paper?.savedAt ? `重新下载${includeSolutions ? '教师版' : '学生版'} PDF` : `保存并下载${includeSolutions ? '教师版' : '学生版'} PDF`,
      busyLabel: "\u6B63\u5728\u751F\u6210 PDF"
    })), saveMessage || savedAtText ? /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-emerald-300/25 bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800"
    }, saveMessage || '已保存', savedAtText ? ` / ${savedAtText}` : '') : null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onBack,
      className: "min-h-[42px] rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-black text-zinc-700 transition-all active:scale-95"
    }, "\u8FD4\u56DE\u7EC4\u9898")))), /*#__PURE__*/React.createElement("div", {
      className: "mb-4 grid gap-3 md:grid-cols-2"
    }, /*#__PURE__*/React.createElement(PaperTagPanel, {
      title: "\u8986\u76D6\u77E5\u8BC6\u70B9",
      items: summary.knowledgePoints
    }), /*#__PURE__*/React.createElement(PaperTagPanel, {
      title: "\u5339\u914D\u53EF\u89C6\u5316\u5361\u7247",
      items: cardTagItems
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid gap-3"
    }, questions.map((question, index) => /*#__PURE__*/React.createElement("article", {
      key: question.id,
      className: "rounded-[20px] border border-zinc-200 bg-white p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-2 flex flex-wrap items-center gap-2 text-[11px] font-black text-zinc-500"
    }, /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-white px-2.5 py-1 text-zinc-950"
    }, "\u7B2C ", index + 1, " \u9898"), /*#__PURE__*/React.createElement("span", null, question.grade), /*#__PURE__*/React.createElement("span", null, question.type), /*#__PURE__*/React.createElement("span", null, question.difficulty), /*#__PURE__*/React.createElement("span", null, getQuestionLearningStageLabel(question))), /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-black leading-7 text-zinc-950"
    }, /*#__PURE__*/React.createElement(MathInline, null, question.stem)), /*#__PURE__*/React.createElement(QuestionFigure, {
      figure: question.figure,
      compact: true
    }), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 flex flex-wrap gap-2"
    }, service.getMatchedCards(question, cardMap, sceneEntryMap).slice(0, 3).map(match => /*#__PURE__*/React.createElement("button", {
      key: `${question.id}-${match.cardId}`,
      type: "button",
      onClick: () => onOpenCard(match.cardId, question.id),
      disabled: !match.available,
      className: `rounded-xl px-3 py-2 text-[11px] font-black ${match.available ? 'bg-white text-zinc-950' : 'cursor-not-allowed bg-zinc-100 text-zinc-500'}`
    }, match.title))))))));
  }
  function PaperLectureView({
    paper,
    cardMap,
    sceneEntryMap,
    onBack,
    onOpenCard
  }) {
    const questions = paper?.questions || [];
    return /*#__PURE__*/React.createElement("main", {
      className: `flex-1 min-h-0 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain rounded-[24px] p-4 ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      style: TOUCH_SCROLL_STYLE
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx-auto max-w-6xl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-4 flex flex-wrap items-start justify-between gap-3"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-[0.24em] text-amber-700 uppercase"
    }, "\u6559\u5E08\u8BB2\u8BC4"), /*#__PURE__*/React.createElement("h3", {
      className: "mt-1 text-2xl font-black text-zinc-950"
    }, paper?.title || '作业包讲评')), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onBack,
      className: `${QUESTION_BANK_SECONDARY_BUTTON_CLASS} text-xs`
    }, "\u8FD4\u56DE\u4F5C\u4E1A\u5305")), /*#__PURE__*/React.createElement("div", {
      className: "grid gap-4"
    }, questions.map((question, index) => /*#__PURE__*/React.createElement(LectureQuestionItem, {
      key: question.id,
      question: question,
      index: index + 1,
      matches: service.getMatchedCards(question, cardMap, sceneEntryMap),
      onOpenCard: onOpenCard
    })))));
  }
  function PaperStat({
    label,
    value
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-zinc-200 bg-zinc-50 p-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-zinc-500"
    }, label), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-2xl font-black text-zinc-950"
    }, value));
  }
  function PaperTagPanel({
    title,
    items
  }) {
    const normalizedItems = (items || []).map(item => typeof item === 'object' && item !== null ? item : {
      key: item,
      label: item
    });
    return /*#__PURE__*/React.createElement("section", {
      className: "rounded-[20px] border border-zinc-200 bg-white p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3 text-[11px] font-black tracking-widest text-zinc-500"
    }, title), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2"
    }, normalizedItems.length ? normalizedItems.map(item => /*#__PURE__*/React.createElement("span", {
      key: item.key || item.label,
      className: "rounded-full bg-zinc-50 px-3 py-1.5 text-[11px] font-bold text-zinc-700"
    }, item.label)) : /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-bold text-zinc-500"
    }, "\u6682\u65E0")));
  }
  function formatPaperSavedAt(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  async function downloadPaperPackagePdf(paper, cardMap, sceneEntryMap, options = {}) {
    try {
      const includeSolutions = options.includeSolutions !== false;
      const pages = await renderPaperPackagePdfPages(paper, cardMap, sceneEntryMap, {
        includeSolutions
      });
      const pdfBytes = buildImagePdf(pages);
      const blob = new Blob([pdfBytes], {
        type: 'application/pdf'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizePdfFileName(`${paper?.title || '数学作业包'}-${includeSolutions ? '教师版含解析' : '学生版无解析'}`)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      return true;
    } catch (error) {
      console.error('Failed to download paper package PDF', error);
      return false;
    }
  }
  async function renderPaperPackagePdfPages(paper, cardMap, sceneEntryMap, options = {}) {
    const includeSolutions = options.includeSolutions !== false;
    const pageWidth = 1240;
    const pageHeight = 1754;
    const margin = 74;
    const contentWidth = pageWidth - margin * 2;
    const pages = [];
    let canvas;
    let ctx;
    let y = margin;
    const startPage = () => {
      canvas = document.createElement('canvas');
      canvas.width = pageWidth;
      canvas.height = pageHeight;
      ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageWidth, pageHeight);
      pages.push(canvas);
      y = margin;
    };
    const ensureSpace = height => {
      if (y + height <= pageHeight - margin) return;
      startPage();
    };
    const drawTextBlock = (text, options = {}) => {
      const fontSize = options.fontSize || 25;
      const lineHeight = options.lineHeight || Math.round(fontSize * 1.55);
      const color = options.color || '#111827';
      const fontWeight = options.bold ? '700' : '500';
      const lines = wrapCanvasText(ctx, normalizePdfText(text), contentWidth, `${fontWeight} ${fontSize}px "Microsoft YaHei", "SimHei", sans-serif`);
      ensureSpace(lines.length * lineHeight + (options.after || 0));
      ctx.font = `${fontWeight} ${fontSize}px "Microsoft YaHei", "SimHei", sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      lines.forEach(line => {
        ctx.fillText(line, margin, y);
        y += lineHeight;
      });
      y += options.after || 0;
    };
    const drawRule = () => {
      ensureSpace(24);
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(pageWidth - margin, y);
      ctx.stroke();
      y += 24;
    };
    const drawFigure = async figure => {
      if (!figure?.svg && !figure?.src) return;
      const image = figure.svg ? await loadSvgImage(figure.svg) : await loadRasterImage(figure.src);
      const naturalWidth = image.naturalWidth || image.width || 820;
      const naturalHeight = image.naturalHeight || image.height || Math.round(naturalWidth * 0.58);
      const maxWidth = Math.min(820, contentWidth);
      const maxHeight = 330;
      const rasterScaleLimit = figure?.src ? 1 : 1.8;
      let scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, rasterScaleLimit);
      const scaledWidth = naturalWidth * scale;
      if (scaledWidth < 120) {
        scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 120 / naturalWidth);
      }
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));
      const frameWidth = Math.min(contentWidth, Math.max(width, Math.min(560, maxWidth)));
      const frameHeight = Math.max(height, Math.min(150, Math.round(frameWidth * 0.28)));
      ensureSpace(frameHeight + 42);
      const frameX = margin + Math.round((contentWidth - frameWidth) / 2);
      const frameY = y - 14;
      const x = frameX + Math.round((frameWidth - width) / 2);
      const imageY = y + Math.round((frameHeight - height) / 2);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 2;
      ctx.fillRect(frameX - 14, frameY, frameWidth + 28, frameHeight + 28);
      ctx.strokeRect(frameX - 14, frameY, frameWidth + 28, frameHeight + 28);
      ctx.drawImage(image, x, imageY, width, height);
      y += frameHeight + 32;
    };
    startPage();
    drawTextBlock(paper?.title || '数学作业包', {
      fontSize: 42,
      lineHeight: 58,
      bold: true,
      after: 8
    });
    drawTextBlock(`${paper?.stageLabel || '数学题库'} / ${paper?.sourceLabel || '作业包'} / ${paper?.questions?.length || 0} 题 / ${includeSolutions ? '教师版：含答案解析' : '学生版：仅题目'}`, {
      fontSize: 23,
      color: '#52525b',
      after: 18
    });
    if (paper?.savedAt) drawTextBlock(`保存时间：${formatPaperSavedAt(paper.savedAt)}`, {
      fontSize: 22,
      color: '#52525b',
      after: 16
    });
    const summary = paper?.summary || summarizePaperQuestions(paper?.questions || []);
    drawTextBlock(`覆盖知识点：${(summary.knowledgePoints || []).join('、') || '暂无'}`, {
      fontSize: 22,
      color: '#374151',
      after: 8
    });
    drawTextBlock(`匹配可视化卡片：${(summary.cardIds || []).map(cardId => getCardDisplayName(cardId, cardMap, sceneEntryMap)).join('、') || '暂无'}`, {
      fontSize: 22,
      color: '#374151',
      after: 18
    });
    drawRule();
    for (const [index, question] of (paper?.questions || []).entries()) {
      ensureSpace(220);
      drawTextBlock(`第 ${index + 1} 题 / ${question.grade || ''} / ${question.type || ''} / ${question.difficulty || ''}`, {
        fontSize: 26,
        bold: true,
        after: 4
      });
      drawTextBlock(question.stem, {
        fontSize: 25,
        lineHeight: 39,
        bold: true,
        after: 6
      });
      await drawFigure(question.figure);
      if (Array.isArray(question.options) && question.options.length) {
        question.options.forEach(option => drawTextBlock(`${option.label}. ${option.text}`, {
          fontSize: 22,
          lineHeight: 34,
          after: 2
        }));
      }
      if (Array.isArray(question.steps) && question.steps.length) {
        question.steps.forEach((step, stepIndex) => {
          drawTextBlock(`${stepIndex + 1}. ${step.prompt}`, {
            fontSize: 22,
            lineHeight: 34,
            bold: true,
            after: 2
          });
          (step.options || []).forEach(option => drawTextBlock(`  ${option.label}. ${option.text}`, {
            fontSize: 21,
            lineHeight: 32,
            after: 0
          }));
        });
      }
      if (includeSolutions) {
        drawTextBlock(`答案：${formatPdfAnswer(question.answer)}`, {
          fontSize: 22,
          lineHeight: 34,
          bold: true,
          color: '#14532d',
          after: 2
        });
        drawTextBlock(`解析：${question.analysis || '暂无解析'}`, {
          fontSize: 22,
          lineHeight: 34,
          color: '#374151',
          after: 2
        });
      }
      const matchedCards = (question.matchedCards || []).map(match => getCardDisplayName(match.cardId, cardMap, sceneEntryMap));
      drawTextBlock(`对应可视化：${matchedCards.join('、') || '暂无'}`, {
        fontSize: 21,
        lineHeight: 32,
        color: '#52525b',
        after: 18
      });
      drawRule();
    }
    return pages.map(item => dataUrlToBytes(item.toDataURL('image/jpeg', 0.92)));
  }
  function wrapCanvasText(ctx, text, maxWidth, font) {
    ctx.font = font;
    const source = String(text || '');
    const lines = [];
    let current = '';
    for (const char of source) {
      const next = current + char;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }
  function loadSvgImage(svg) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
  }
  function loadRasterImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }
  function dataUrlToBytes(dataUrl) {
    const base64 = String(dataUrl || '').split(',')[1] || '';
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }
  function buildImagePdf(jpegPages) {
    const encoder = new TextEncoder();
    const chunks = [];
    const objectCount = 2 + jpegPages.length * 3;
    const offsets = Array(objectCount + 1).fill(0);
    let length = 0;
    const push = chunk => {
      const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
      chunks.push(bytes);
      length += bytes.length;
    };
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const addObject = (id, bodyChunks) => {
      offsets[id] = length;
      push(`${id} 0 obj\n`);
      bodyChunks.forEach(push);
      push('\nendobj\n');
    };
    const pageObjectIds = [];
    jpegPages.forEach((jpegBytes, index) => {
      const imageId = 3 + index * 3;
      const contentId = imageId + 1;
      const pageId = imageId + 2;
      addObject(imageId, [`<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`, jpegBytes, '\nendstream']);
      const content = `q\n595.28 0 0 841.89 0 0 cm\n/Im${index + 1} Do\nQ\n`;
      const contentBytes = encoder.encode(content);
      addObject(contentId, [`<< /Length ${contentBytes.length} >>\nstream\n`, contentBytes, '\nendstream']);
      addObject(pageId, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`]);
      pageObjectIds.push(pageId);
    });
    addObject(1, [`<< /Type /Catalog /Pages 2 0 R >>`]);
    addObject(2, [`<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`]);
    const xrefOffset = length;
    push(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
    for (let id = 1; id <= objectCount; id += 1) push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
    push(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    const output = new Uint8Array(length);
    let cursor = 0;
    chunks.forEach(chunk => {
      output.set(chunk, cursor);
      cursor += chunk.length;
    });
    return output;
  }
  function normalizePdfText(value) {
    return toPlainMathText(normalizeInlineMathText(value)).replace(/~+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const SUPERSCRIPT_MAP = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
    '+': '⁺',
    '-': '⁻',
    '=': '⁼',
    '(': '⁽',
    ')': '⁾',
    n: 'ⁿ',
    i: 'ⁱ'
  };
  const SUBSCRIPT_MAP = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
    '+': '₊',
    '-': '₋',
    '=': '₌',
    '(': '₍',
    ')': '₎',
    a: 'ₐ',
    e: 'ₑ',
    h: 'ₕ',
    i: 'ᵢ',
    j: 'ⱼ',
    k: 'ₖ',
    l: 'ₗ',
    m: 'ₘ',
    n: 'ₙ',
    o: 'ₒ',
    p: 'ₚ',
    r: 'ᵣ',
    s: 'ₛ',
    t: 'ₜ',
    u: 'ᵤ',
    v: 'ᵥ',
    x: 'ₓ'
  };
  function toPlainMathText(value) {
    const text = String(value || '');
    let output = '';
    let cursor = 0;
    while (cursor < text.length) {
      const nextScriptIndex = findNextScriptIndex(text, cursor);
      if (nextScriptIndex < 0 || nextScriptIndex === text.length - 1) {
        output += text.slice(cursor);
        break;
      }
      output += text.slice(cursor, nextScriptIndex);
      const marker = text[nextScriptIndex];
      const parsed = parseScriptToken(text, nextScriptIndex + 1);
      if (!parsed.value) {
        output += marker;
        cursor = nextScriptIndex + 1;
        continue;
      }
      output += marker === '^' ? toUnicodeScript(parsed.value, SUPERSCRIPT_MAP, '^') : toUnicodeScript(parsed.value, SUBSCRIPT_MAP, '_');
      cursor = parsed.nextIndex;
    }
    return output;
  }
  function toUnicodeScript(value, map, fallbackMarker) {
    const text = String(value || '');
    const converted = [...text].map(char => map[char] || '').join('');
    if (converted.length === text.length) return converted;
    if (/^[\u4e00-\u9fff]+$/.test(text)) return text;
    return `${fallbackMarker}(${text})`;
  }
  function formatPdfAnswer(value) {
    if (Array.isArray(value)) return value.join('、');
    if (value && typeof value === 'object') {
      return Object.entries(value).map(([key, item]) => `${key}:${item}`).join('；');
    }
    return String(value || '暂无');
  }
  function sanitizePdfFileName(value) {
    return String(value || '数学作业包').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '').slice(0, 48) || '数学作业包';
  }
  function LectureQuestionItem({
    question,
    index,
    matches,
    onOpenCard
  }) {
    return /*#__PURE__*/React.createElement("article", {
      className: `rounded-[20px] p-4 ${QUESTION_BANK_MUTED_SURFACE_CLASS}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3 flex flex-wrap items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-white px-3 py-1 text-[11px] font-black text-zinc-950"
    }, "\u7B2C ", index, " \u9898"), /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-amber-300 px-3 py-1 text-[11px] font-black text-zinc-950"
    }, "\u8BB2\u8BC4"), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-bold text-zinc-500"
    }, question.grade, " / ", question.type, " / ", question.difficulty)), /*#__PURE__*/React.createElement("div", {
      className: "text-base font-black leading-8 text-zinc-950"
    }, /*#__PURE__*/React.createElement(MathInline, null, question.stem)), /*#__PURE__*/React.createElement(QuestionFigure, {
      figure: question.figure,
      variant: "report"
    }), question.options?.length ? /*#__PURE__*/React.createElement("div", {
      className: "mt-3 grid gap-2 sm:grid-cols-2"
    }, question.options.map(option => /*#__PURE__*/React.createElement("div", {
      key: option.label,
      className: "rounded-xl bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700"
    }, option.label, ". ", /*#__PURE__*/React.createElement(MathInline, null, option.text)))) : null, /*#__PURE__*/React.createElement("div", {
      className: "mt-4 grid gap-3 md:grid-cols-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rounded-[16px] border border-emerald-300/20 bg-emerald-50 p-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-emerald-700"
    }, "\u6B63\u786E\u7B54\u6848"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-black leading-6 text-zinc-950"
    }, /*#__PURE__*/React.createElement(MathInline, null, question.answer))), /*#__PURE__*/React.createElement("div", {
      className: "rounded-[16px] border border-zinc-200 bg-zinc-50 p-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-zinc-500"
    }, "\u89E3\u6790"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-bold leading-7 text-zinc-700"
    }, /*#__PURE__*/React.createElement(MathInline, null, question.analysis)))), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 rounded-[16px] border border-amber-300/20 bg-amber-50 p-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3 text-[11px] font-black tracking-widest text-amber-800"
    }, "\u5339\u914D\u53EF\u89C6\u5316\u5361\u7247"), /*#__PURE__*/React.createElement("div", {
      className: "grid gap-2"
    }, matches.map(match => /*#__PURE__*/React.createElement("button", {
      key: `${question.id}-${match.cardId}-${match.role}`,
      type: "button",
      onClick: () => onOpenCard(match.cardId, question.id),
      disabled: !match.available,
      className: `rounded-2xl border p-3 text-left ${match.available ? 'border-amber-200/60 bg-amber-50 text-zinc-950' : 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-500'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black tracking-widest text-amber-800"
    }, match.role === 'primary' ? '主推荐' : '关联卡片'), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-sm font-black"
    }, match.title))))));
  }
  function PracticeSessionView({
    stageLabel,
    practiceMode,
    questions,
    answers,
    answeredCount,
    activeQuestionId,
    onAnswerChange,
    onSelectQuestion,
    onSubmit,
    onBack
  }) {
    const activeQuestion = service.getQuestion(questions, activeQuestionId) || questions[0] || null;
    const activeQuestionIndex = activeQuestion ? questions.findIndex(question => question.id === activeQuestion.id) : -1;
    const activeAnswer = activeQuestion ? answers[activeQuestion.id] : '';
    const activeQuestionAnswered = service.isQuestionAnswered(activeQuestion, activeAnswer);
    const isLastQuestion = activeQuestionIndex === questions.length - 1;
    const nextQuestion = activeQuestionIndex >= 0 ? questions[activeQuestionIndex + 1] : null;
    const showMultiChoiceNextButton = service.isMultiChoiceQuestion(activeQuestion) && activeQuestionAnswered && nextQuestion;
    const showFinalSubmitButton = isLastQuestion && activeQuestionAnswered;
    const progressPercent = questions.length ? Math.round(answeredCount / questions.length * 100) : 0;
    return /*#__PURE__*/React.createElement("main", {
      className: `flex-1 min-h-0 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain rounded-[24px] p-3 text-zinc-950 sm:p-5 ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      style: TOUCH_SCROLL_STYLE
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx-auto max-w-5xl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-zinc-300 pb-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-[0.24em] text-zinc-500 uppercase"
    }, stageLabel, " / ", practiceMode === MODE_FREE ? '自由组题' : '随机抽题'), /*#__PURE__*/React.createElement("h3", {
      className: "mt-1 text-2xl font-black text-zinc-950"
    }, "\u6570\u5B66\u7EC3\u4E60\u8BD5\u5377"), /*#__PURE__*/React.createElement("p", {
      className: "mt-1 text-sm font-bold text-zinc-500"
    }, "\u5171 ", questions.length, " \u9898\uFF0C\u5DF2\u7B54 ", answeredCount, " \u9898\u3002\u4EA4\u5377\u540E\u8FDB\u5165\u8BB2\u8BC4\u62A5\u544A\uFF0C\u67E5\u770B\u7ED3\u679C\u548C\u5339\u914D\u53EF\u89C6\u5316\u5361\u7247\u3002")), /*#__PURE__*/React.createElement("div", {
      className: "flex shrink-0 flex-wrap gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onBack,
      className: `${QUESTION_BANK_SECONDARY_BUTTON_CLASS} text-xs`
    }, "\u8FD4\u56DE\u7EC4\u9898"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onSubmit,
      className: `${QUESTION_BANK_PRIMARY_BUTTON_CLASS} px-5 text-xs`
    }, "\u4EA4\u5377"))), /*#__PURE__*/React.createElement("div", {
      className: "mb-4 rounded-[18px] border border-[#e7dcc4] bg-[#fffdf7] p-3",
      "data-qb-practice-progress": "paper-progress"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-2 flex items-center justify-between gap-3 text-[11px] font-black text-zinc-600"
    }, /*#__PURE__*/React.createElement("span", null, "\u7B54\u9898\u8FDB\u5EA6"), /*#__PURE__*/React.createElement("span", null, answeredCount, "/", questions.length, " \xB7 ", progressPercent, "%")), /*#__PURE__*/React.createElement("div", {
      className: "h-2 overflow-hidden rounded-full bg-[#eee6d7]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full rounded-full bg-[#0f766e]",
      style: {
        width: `${progressPercent}%`
      },
      "aria-hidden": "true"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "mb-4 flex max-h-28 flex-wrap overflow-y-auto no-scrollbar touch-pan-y overscroll-contain gap-2 pb-1 pr-1",
      "data-qb-question-navigator": "practice-question-navigator",
      style: TOUCH_SCROLL_STYLE
    }, questions.map((question, index) => {
      const answered = service.isQuestionAnswered(question, answers[question.id]);
      return /*#__PURE__*/React.createElement("button", {
        key: question.id,
        type: "button",
        "aria-label": `跳转到第 ${index + 1} 题`,
        onClick: () => onSelectQuestion(question.id),
        className: `h-11 w-11 shrink-0 rounded-full border text-xs font-black ${activeQuestion?.id === question.id ? 'border-[#0f766e] bg-[#0f766e] text-white' : answered ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-zinc-300 bg-white text-zinc-500'}`
      }, index + 1);
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid gap-4"
    }, activeQuestion ? /*#__PURE__*/React.createElement(PracticeQuestionCard, {
      question: activeQuestion,
      index: activeQuestionIndex + 1,
      value: answers[activeQuestion.id] || '',
      onAnswerChange: (value, options) => onAnswerChange(activeQuestion.id, value, options)
    }) : null, showMultiChoiceNextButton ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onSelectQuestion(nextQuestion.id),
      className: `${QUESTION_BANK_PRIMARY_BUTTON_CLASS} min-h-[52px] px-5 py-4 text-base`
    }, "\u4E0B\u4E00\u9898") : null, showFinalSubmitButton ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onSubmit,
      className: `${QUESTION_BANK_PRIMARY_BUTTON_CLASS} min-h-[56px] px-5 py-4 text-base`
    }, "\u6700\u540E\u4E00\u9898\u5DF2\u5B8C\u6210\uFF0C\u4EA4\u5377") : null)));
  }
  function shouldAutoAdvanceQuestion(question, nextAnswer) {
    if (!question || service.isMultiChoiceQuestion(question)) return false;
    if (service.isStepChoiceQuestion(question)) return service.isQuestionAnswered(question, nextAnswer);
    return Array.isArray(question.options) && question.options.length > 0;
  }
  function PracticeQuestionCard({
    question,
    index,
    value,
    onAnswerChange
  }) {
    const isStepChoice = service.isStepChoiceQuestion(question);
    const isMultiChoice = service.isMultiChoiceQuestion(question);
    const hasOptions = Array.isArray(question.options) && question.options.length > 0;
    return /*#__PURE__*/React.createElement("article", {
      className: `rounded-[18px] p-4 sm:p-5 ${QUESTION_BANK_MUTED_SURFACE_CLASS}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3 flex flex-wrap items-center gap-2 text-[11px] font-black text-zinc-500"
    }, /*#__PURE__*/React.createElement("span", null, "\u7B2C ", index, " \u9898"), /*#__PURE__*/React.createElement("span", null, question.grade), /*#__PURE__*/React.createElement("span", null, question.type), /*#__PURE__*/React.createElement("span", null, question.difficulty)), /*#__PURE__*/React.createElement("div", {
      className: "text-base font-black leading-8 text-zinc-950"
    }, /*#__PURE__*/React.createElement(MathInline, null, question.stem)), /*#__PURE__*/React.createElement(QuestionFigure, {
      figure: question.figure
    }), isStepChoice ? /*#__PURE__*/React.createElement(StepChoiceQuestion, {
      question: question,
      value: value,
      onAnswerChange: onAnswerChange
    }) : isMultiChoice ? /*#__PURE__*/React.createElement(MultiChoiceQuestion, {
      question: question,
      value: value,
      onAnswerChange: onAnswerChange
    }) : hasOptions ? /*#__PURE__*/React.createElement("div", {
      className: "mt-4 grid gap-2"
    }, question.options.map(option => /*#__PURE__*/React.createElement("button", {
      key: option.label,
      type: "button",
      "data-qb-answer-option": "practice-answer-option",
      onClick: () => onAnswerChange(option.label, {
        autoAdvance: shouldAutoAdvanceQuestion(question, option.label)
      }),
      className: `flex min-h-[52px] items-start gap-3 rounded-[14px] border px-3 py-3 text-left text-sm font-bold leading-6 transition-all active:scale-[0.99] ${String(value).trim().toUpperCase() === option.label ? 'border-[#0f766e] bg-[#0f766e] text-white shadow-[0_10px_24px_rgba(15,118,110,0.18)]' : 'border-[#e2e8f0] bg-white text-zinc-800 hover:border-[#b7ddd6] hover:bg-[#f4fbf9]'}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-black"
    }, option.label), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(MathInline, null, option.text))))) : /*#__PURE__*/React.createElement("div", {
      className: "mt-4 rounded-[8px] border border-rose-300 bg-rose-50 px-3 py-3 text-sm font-bold leading-6 text-rose-700"
    }, "\u8FD9\u9053\u9898\u7F3A\u5C11\u53EF\u70B9\u9009\u7684\u7B54\u6848\u914D\u7F6E\uFF0C\u6682\u4E0D\u80FD\u4F5C\u7B54\u3002"));
  }
  function MultiChoiceQuestion({
    question,
    value,
    onAnswerChange
  }) {
    const selectedAnswers = Array.isArray(value) ? value.map(item => String(item).trim().toUpperCase()).filter(Boolean) : String(value || '').split(/[、,，;；\s]+/).map(item => item.trim().toUpperCase()).filter(Boolean);
    const selectedSet = new Set(selectedAnswers);
    const toggleAnswer = label => {
      const normalizedLabel = String(label || '').trim().toUpperCase();
      if (!normalizedLabel) return;
      const nextSet = new Set(selectedSet);
      if (nextSet.has(normalizedLabel)) {
        nextSet.delete(normalizedLabel);
      } else {
        nextSet.add(normalizedLabel);
      }
      onAnswerChange([...nextSet].sort());
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "mt-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800"
    }, "\u53EF\u591A\u9009"), /*#__PURE__*/React.createElement("div", {
      className: "grid gap-2"
    }, question.options.map(option => {
      const selected = selectedSet.has(option.label);
      return /*#__PURE__*/React.createElement("button", {
        key: option.label,
        type: "button",
        "data-qb-answer-option": "practice-answer-option",
        "aria-pressed": selected,
        onClick: () => toggleAnswer(option.label),
        className: `flex min-h-[52px] items-start gap-3 rounded-[14px] border px-3 py-3 text-left text-sm font-bold leading-6 transition-all active:scale-[0.99] ${selected ? 'border-[#0f766e] bg-[#0f766e] text-white shadow-[0_10px_24px_rgba(15,118,110,0.18)]' : 'border-[#e2e8f0] bg-white text-zinc-800 hover:border-[#b7ddd6] hover:bg-[#f4fbf9]'}`
      }, /*#__PURE__*/React.createElement("span", {
        className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border border-current text-xs font-black"
      }, selected ? '✓' : option.label), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(MathInline, null, option.text)));
    })));
  }
  function StepChoiceQuestion({
    question,
    value,
    onAnswerChange
  }) {
    const currentAnswers = value && typeof value === 'object' ? value : {};
    const updateStepAnswer = (stepId, answerLabel) => {
      const nextAnswers = {
        ...currentAnswers,
        [stepId]: answerLabel
      };
      onAnswerChange(nextAnswers, {
        autoAdvance: shouldAutoAdvanceQuestion(question, nextAnswers)
      });
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "mt-4 grid gap-3"
    }, question.steps.map((step, index) => {
      const selectedAnswer = String(currentAnswers[step.id] || '').trim().toUpperCase();
      return /*#__PURE__*/React.createElement("section", {
        key: step.id,
        className: "rounded-[8px] border border-zinc-200 bg-zinc-50 p-3"
      }, /*#__PURE__*/React.createElement("div", {
        className: "mb-2 flex items-start gap-2"
      }, /*#__PURE__*/React.createElement("span", {
        className: "flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0f766e] px-2 text-xs font-black text-white"
      }, index + 1), /*#__PURE__*/React.createElement("div", {
        className: "text-sm font-black leading-6 text-zinc-950"
      }, /*#__PURE__*/React.createElement(MathInline, null, step.prompt))), /*#__PURE__*/React.createElement("div", {
        className: "grid gap-2 sm:grid-cols-3"
      }, step.options.map(option => /*#__PURE__*/React.createElement("button", {
        key: `${step.id}-${option.label}`,
        type: "button",
        "data-qb-answer-option": "practice-answer-option",
        "aria-pressed": selectedAnswer === option.label,
        onClick: () => updateStepAnswer(step.id, option.label),
        className: `flex min-h-[52px] items-start gap-2 rounded-[14px] border px-3 py-3 text-left text-sm font-bold leading-6 transition-all active:scale-[0.99] ${selectedAnswer === option.label ? 'border-[#0f766e] bg-[#0f766e] text-white shadow-[0_10px_24px_rgba(15,118,110,0.18)]' : 'border-[#e2e8f0] bg-white text-zinc-800 hover:border-[#b7ddd6] hover:bg-[#f4fbf9]'}`
      }, /*#__PURE__*/React.createElement("span", {
        className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-black"
      }, option.label), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(MathInline, null, option.text))))));
    }));
  }
  function PracticeReportView({
    report,
    practiceMode,
    cardMap,
    sceneEntryMap,
    onBack,
    onRetry,
    onOpenCard
  }) {
    const items = report?.items || [];
    return /*#__PURE__*/React.createElement("main", {
      className: `flex-1 min-h-0 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain rounded-[24px] p-4 ${QUESTION_BANK_PAPER_SURFACE_CLASS}`,
      style: TOUCH_SCROLL_STYLE
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx-auto max-w-6xl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-4 flex flex-wrap items-start justify-between gap-3"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-[0.24em] text-amber-700 uppercase"
    }, practiceMode === MODE_FREE ? '自由组题报告' : '随机抽题报告'), /*#__PURE__*/React.createElement("h3", {
      className: "mt-1 text-2xl font-black text-zinc-950"
    }, "\u7B54\u9898\u62A5\u544A")), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onBack,
      className: `${QUESTION_BANK_SECONDARY_BUTTON_CLASS} text-xs`
    }, "\u7EE7\u7EED\u7EC4\u9898"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onRetry,
      disabled: !items.length,
      className: `${QUESTION_BANK_PAPER_BUTTON_CLASS} text-xs`
    }, "\u91CD\u65B0\u7EC3\u4E60\u672C\u5377"))), /*#__PURE__*/React.createElement("div", {
      className: "mb-4 grid gap-3 rounded-[20px] border border-[#e7dcc4] bg-[#fffdf7] p-3 sm:grid-cols-2 lg:grid-cols-5",
      "data-qb-report-summary": "lecture-sheet"
    }, /*#__PURE__*/React.createElement(ReportStat, {
      label: "\u9898\u76EE\u6570",
      value: report?.total || 0
    }), /*#__PURE__*/React.createElement(ReportStat, {
      label: "\u5DF2\u7B54",
      value: report?.answered || 0
    }), /*#__PURE__*/React.createElement(ReportStat, {
      label: "\u6B63\u786E",
      value: report?.correct || 0,
      tone: "emerald"
    }), /*#__PURE__*/React.createElement(ReportStat, {
      label: "\u9519\u8BEF",
      value: report?.wrong || 0,
      tone: "rose"
    }), /*#__PURE__*/React.createElement(ReportStat, {
      label: "\u6B63\u786E\u7387",
      value: `${report?.accuracy || 0}%`,
      tone: "amber"
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid gap-4"
    }, items.map(item => /*#__PURE__*/React.createElement(ReportQuestionItem, {
      key: item.question.id,
      item: item,
      matches: service.getMatchedCards(item.question, cardMap, sceneEntryMap),
      onOpenCard: onOpenCard
    })))));
  }
  function ReportStat({
    label,
    value,
    tone
  }) {
    const toneClass = tone === 'emerald' ? 'border-emerald-300/20 bg-emerald-50 text-emerald-900' : tone === 'rose' ? 'border-rose-300/20 bg-rose-50 text-rose-900' : tone === 'amber' ? 'border-amber-300/20 bg-amber-50 text-amber-900' : 'border-zinc-200 bg-white text-zinc-950';
    return /*#__PURE__*/React.createElement("div", {
      className: `rounded-[20px] border p-4 ${toneClass}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest opacity-70"
    }, label), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-2xl font-black"
    }, value));
  }
  function ReportQuestionItem({
    item,
    matches,
    onOpenCard
  }) {
    const statusMeta = item.status === 'correct' ? {
      label: '正确',
      className: 'bg-emerald-300 text-zinc-950'
    } : item.status === 'wrong' ? {
      label: '错误',
      className: 'bg-rose-300 text-zinc-950'
    } : {
      label: '未答',
      className: 'bg-zinc-200 text-zinc-700'
    };
    return /*#__PURE__*/React.createElement("article", {
      className: "rounded-[20px] border border-zinc-200 bg-white p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3 flex flex-wrap items-center justify-between gap-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "rounded-full bg-white text-zinc-950 px-3 py-1 text-[11px] font-black"
    }, "\u7B2C ", item.index, " \u9898"), /*#__PURE__*/React.createElement("span", {
      className: `rounded-full px-3 py-1 text-[11px] font-black ${statusMeta.className}`
    }, statusMeta.label)), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-bold text-zinc-500"
    }, item.question.grade, " / ", item.question.type, " / ", item.question.difficulty)), /*#__PURE__*/React.createElement("div", {
      className: "text-base font-black leading-8 text-zinc-950"
    }, /*#__PURE__*/React.createElement(MathInline, null, item.question.stem)), /*#__PURE__*/React.createElement(QuestionFigure, {
      figure: item.question.figure,
      variant: "report"
    }), item.question.options?.length ? /*#__PURE__*/React.createElement("div", {
      className: "mt-3 grid gap-2 sm:grid-cols-2"
    }, item.question.options.map(option => /*#__PURE__*/React.createElement("div", {
      key: option.label,
      className: "rounded-xl bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700"
    }, option.label, ". ", /*#__PURE__*/React.createElement(MathInline, null, option.text)))) : null, item.stepResults?.length ? /*#__PURE__*/React.createElement(ReportStepResults, {
      stepResults: item.stepResults
    }) : null, /*#__PURE__*/React.createElement("div", {
      className: "mt-4 grid gap-3 md:grid-cols-2",
      "data-qb-report-answer-compare": "answer-compare"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rounded-[16px] border border-zinc-200 bg-zinc-50 p-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-zinc-500"
    }, "\u6211\u7684\u7B54\u6848"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-black leading-6 text-zinc-950"
    }, /*#__PURE__*/React.createElement(MathInline, null, item.answer || '未作答'))), /*#__PURE__*/React.createElement("div", {
      className: "rounded-[16px] border border-emerald-300/20 bg-emerald-50 p-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-emerald-700"
    }, "\u6B63\u786E\u7B54\u6848"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-black leading-6 text-zinc-950"
    }, /*#__PURE__*/React.createElement(MathInline, null, item.correctAnswer)))), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 rounded-[16px] border border-zinc-200 bg-zinc-50 p-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-widest text-zinc-500"
    }, "\u89E3\u6790"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-bold leading-7 text-zinc-700"
    }, /*#__PURE__*/React.createElement(MathInline, null, item.question.analysis))), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 rounded-[16px] border border-amber-300/20 bg-amber-50 p-3",
      "data-qb-report-visual-links": "visual-card-links"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mb-3 text-[11px] font-black tracking-widest text-amber-800"
    }, "\u5339\u914D\u53EF\u89C6\u5316\u5361\u7247"), matches.length ? /*#__PURE__*/React.createElement("div", {
      className: "grid gap-2"
    }, matches.map(match => /*#__PURE__*/React.createElement("div", {
      key: `${item.question.id}-${match.cardId}-${match.role}`,
      className: `rounded-2xl border p-3 ${match.role === 'primary' ? 'border-amber-200/60 bg-amber-50' : 'border-zinc-200 bg-zinc-50'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black tracking-widest text-amber-800"
    }, match.role === 'primary' ? '主推荐' : match.role === 'extension' ? '拓展卡片' : '关联卡片'), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-sm font-black text-zinc-950"
    }, match.title), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-xs font-bold leading-5 text-zinc-700"
    }, /*#__PURE__*/React.createElement(MathInline, null, match.stepLabel, "\uFF1A", match.reason))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onOpenCard(match.cardId, item.question.id),
      disabled: !match.available,
      className: `shrink-0 rounded-xl px-3 py-2 text-[11px] font-black ${match.available ? 'bg-white text-zinc-950' : 'cursor-not-allowed bg-zinc-100 text-zinc-500'}`
    }, match.available ? '直达' : getUnavailableCardLabel(match)))))) : /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-bold leading-6 text-zinc-700"
    }, "\u8FD9\u9053\u9898\u6682\u65F6\u6CA1\u6709\u5339\u914D\u5230\u53EF\u89C6\u5316\u5361\u7247\u3002")));
  }
  function getUnavailableCardLabel(match) {
    if (match.availabilityReason === 'not_integrated') return '未接入';
    if (match.availabilityReason === 'locked') return '未开放';
    return '不可用';
  }
  function ReportStepResults({
    stepResults
  }) {
    const getOptionText = (step, label) => {
      if (!label) return '未答';
      const option = (step.options || []).find(item => item.label === label);
      return option ? `${label}. ${option.text}` : label;
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "mt-3 grid gap-2"
    }, stepResults.map(step => {
      const statusMeta = step.status === 'correct' ? {
        label: '正确',
        className: 'bg-emerald-300 text-zinc-950'
      } : step.status === 'wrong' ? {
        label: '错误',
        className: 'bg-rose-300 text-zinc-950'
      } : {
        label: '未答',
        className: 'bg-zinc-200 text-zinc-700'
      };
      return /*#__PURE__*/React.createElement("section", {
        key: step.id,
        className: "rounded-[16px] border border-zinc-200 bg-zinc-50 p-3"
      }, /*#__PURE__*/React.createElement("div", {
        className: "mb-2 flex flex-wrap items-center gap-2"
      }, /*#__PURE__*/React.createElement("span", {
        className: "rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-zinc-950"
      }, "\u7B2C ", step.index, " \u6B65"), /*#__PURE__*/React.createElement("span", {
        className: `rounded-full px-2.5 py-1 text-[10px] font-black ${statusMeta.className}`
      }, statusMeta.label)), /*#__PURE__*/React.createElement("div", {
        className: "text-sm font-black leading-6 text-zinc-950"
      }, /*#__PURE__*/React.createElement(MathInline, null, step.prompt)), /*#__PURE__*/React.createElement("div", {
        className: "mt-2 grid gap-2 text-xs font-bold leading-5 text-zinc-700 sm:grid-cols-2"
      }, /*#__PURE__*/React.createElement("div", {
        className: "rounded-xl bg-white px-3 py-2"
      }, "\u6211\u7684\u7B54\u6848\uFF1A", /*#__PURE__*/React.createElement(MathInline, null, getOptionText(step, step.answer))), /*#__PURE__*/React.createElement("div", {
        className: "rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900"
      }, "\u6B63\u786E\u7B54\u6848\uFF1A", /*#__PURE__*/React.createElement(MathInline, null, getOptionText(step, step.correctAnswer)))));
    }));
  }
  app.QuestionBankEntryButton = QuestionBankEntryButton;
  app.QuestionBankWorkspace = QuestionBankWorkspace;
})();

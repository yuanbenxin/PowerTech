window.ChineseApp = window.ChineseApp || {};
(() => {
  const app = window.ChineseApp;
  const {
    useEffect,
    useMemo,
    useRef,
    useState
  } = React;
  const MODES = [{
    id: 'recommend',
    label: '系统推荐'
  }, {
    id: 'reinforce',
    label: '句子补强'
  }, {
    id: 'fade',
    label: '线索渐隐'
  }, {
    id: 'visual',
    label: '看图提取'
  }, {
    id: 'challenge',
    label: '全文检测'
  }];
  const HINTS = [{
    level: 0,
    label: '无提示'
  }, {
    level: 1,
    label: '画面'
  }, {
    level: 2,
    label: '首字'
  }, {
    level: 3,
    label: '关键词'
  }, {
    level: 4,
    label: '原文'
  }];
  const CHALLENGE_RATINGS = [{
    id: 'smooth',
    label: '正确'
  }, {
    id: 'order',
    label: '次序错误'
  }, {
    id: 'hesitate',
    label: '卡顿'
  }, {
    id: 'forgot',
    label: '忘记'
  }];
  const RATING_LABELS = {
    smooth: '顺利背出',
    hesitate: '有些卡顿',
    hint: '需要提示',
    forgot: '没有背出'
  };
  const REVIEW_INTERVALS = [10 * 60 * 1000, 24 * 60 * 60 * 1000, 3 * 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000, 15 * 24 * 60 * 60 * 1000];
  function pickFallbackChineseVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const chineseVoices = voices.filter(voice => /^(zh|cmn)/i.test(voice.lang) || /xiaoxiao|yunxi|xiaoyi|yaoyao|普通话|中文/i.test(voice.name));
    const preferred = [/xiaoxiao|yunxi|xiaoyi|yaoyao/i, /microsoft.*(huihui|kangkang)/i, /google.*(普通话|chinese)/i];
    for (const rule of preferred) {
      const voice = chineseVoices.find(item => rule.test(item.name));
      if (voice) return voice;
    }
    return chineseVoices[0] || null;
  }
  function speakWithSystemFallback(text) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickFallbackChineseVoice();
    utterance.lang = voice?.lang || 'zh-CN';
    utterance.voice = voice || null;
    utterance.rate = .78;
    utterance.pitch = .98;
    window.speechSynthesis.speak(utterance);
  }
  function stopRecitationLineAudio(audioRef) {
    const active = audioRef?.current;
    if (!active) return;
    active.stop();
    audioRef.current = null;
  }
  function playRecitationLineAudio(passage, line, audioRef) {
    stopRecitationLineAudio(audioRef);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const source = passage?.recitationAudioSrc;
    const start = Number(line?.audioStart);
    const end = Number(line?.audioEnd);
    if (!source || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      speakWithSystemFallback(line?.text);
      return;
    }
    const player = new Audio();
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      player.pause();
      player.removeAttribute('src');
      player.load();
      if (audioRef?.current?.player === player) audioRef.current = null;
    };
    const fallBack = () => {
      stop();
      speakWithSystemFallback(line.text);
    };
    const playClip = () => {
      if (stopped) return;
      player.currentTime = start;
      const result = player.play();
      if (result?.catch) result.catch(fallBack);
    };
    player.preload = 'auto';
    player.addEventListener('loadedmetadata', playClip, {
      once: true
    });
    player.addEventListener('timeupdate', () => {
      if (player.currentTime >= end - .04) stop();
    });
    player.addEventListener('error', fallBack, {
      once: true
    });
    audioRef.current = {
      player,
      stop
    };
    player.src = source;
    player.load();
  }
  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next.toISOString();
  }
  function calculatePassageSummary(passage, lineStats) {
    const now = Date.now();
    const masteryParts = passage.lines.map(line => {
      const stat = lineStats[line.id] || {};
      const score = Number(stat.score || 0);
      const inferredStage = stat.intervalStage == null ? Math.min(4, Math.floor(score)) : Number(stat.intervalStage || 0);
      return Math.min(1, score / 4) * .65 + Math.min(1, inferredStage / 4) * .35;
    });
    const mastery = Math.round(masteryParts.reduce((sum, value) => sum + value, 0) / Math.max(1, passage.lines.length) * 100);
    const weakCount = passage.lines.filter(line => lineStats[line.id]?.weak).length;
    const scheduledReviews = passage.lines.map(line => lineStats[line.id]?.nextReviewAt).filter(Boolean);
    const dueCount = passage.lines.filter(line => {
      const nextReviewAt = lineStats[line.id]?.nextReviewAt;
      return nextReviewAt && new Date(nextReviewAt).getTime() <= now;
    }).length;
    const status = dueCount > 0 || weakCount > 0 ? 'review' : mastery >= 85 ? 'mastered' : 'learning';
    const nextReviewAt = scheduledReviews.length ? scheduledReviews.sort((left, right) => new Date(left) - new Date(right))[0] : status === 'mastered' ? addDays(new Date(), 3) : new Date(now + REVIEW_INTERVALS[0]).toISOString();
    return {
      mastery,
      weakCount,
      dueCount,
      status,
      nextReviewAt
    };
  }
  function recitationCue(line, hintLevel) {
    if (hintLevel >= 4) return line.text;
    if (hintLevel === 3) return line.keywords.join('　');
    if (hintLevel === 2) return line.initials;
    if (hintLevel === 1) return line.anchor;
    return '请脱稿背出这一句';
  }
  function statusTone(status) {
    if (status === 'mastered') return 'is-mastered';
    if (status === 'review') return 'is-review';
    return 'is-learning';
  }
  function lineStudyStatus(stat) {
    if (!stat?.attempts) return '待背诵';
    if (stat.weak) return '需复习';
    if (Number(stat.score || 0) >= 3) return '已掌握';
    return '训练中';
  }
  function rateLineStat(current, rating, requireWeakStreak = false, hintLevel = 0, errorType = '') {
    const previous = current || {
      score: 0,
      hints: 0,
      attempts: 0,
      weak: false,
      smoothStreak: 0
    };
    const now = new Date();
    let score = Number(previous.score || 0);
    if (rating === 'smooth') score = Math.min(4, score + 1);
    if (rating === 'hesitate') score = Math.min(3, score + 0.5);
    if (rating === 'hint') score = Math.max(0, score - 0.25);
    if (rating === 'forgot') score = Math.max(0, score - 1);
    const smoothStreak = rating === 'smooth' ? Number(previous.smoothStreak || 0) + 1 : 0;
    const noHintStreak = rating === 'smooth' && hintLevel === 0 ? Number(previous.noHintStreak || 0) + 1 : 0;
    const weak = rating === 'smooth' ? score < 2 || requireWeakStreak && previous.weak && smoothStreak < 2 : true;
    const inferredStage = previous.intervalStage == null ? Math.min(4, Math.floor(Number(previous.score || 0))) : Number(previous.intervalStage || 0);
    const intervalStage = rating === 'smooth' && hintLevel === 0 ? Math.min(4, inferredStage + 1) : rating === 'smooth' ? Math.max(0, inferredStage - 1) : 0;
    const lapseStreak = rating === 'forgot' ? Number(previous.lapseStreak || 0) + 1 : rating === 'smooth' ? 0 : Number(previous.lapseStreak || 0);
    return {
      ...previous,
      score,
      weak,
      smoothStreak,
      noHintStreak,
      intervalStage,
      nextReviewAt: new Date(now.getTime() + REVIEW_INTERVALS[intervalStage]).toISOString(),
      lastReviewedAt: now.toISOString(),
      lastHintLevel: hintLevel,
      lapseStreak,
      lapseCount: Number(previous.lapseCount || 0) + (rating === 'forgot' ? 1 : 0),
      errorType: errorType || (rating === 'forgot' ? 'forgot' : rating === 'hesitate' ? 'content' : ''),
      attempts: Number(previous.attempts || 0) + 1,
      hints: Number(previous.hints || 0) + (rating === 'hint' || rating === 'forgot' ? 1 : 0),
      lastRating: rating,
      updatedAt: new Date().toISOString()
    };
  }
  function formatDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  function buildFadeLevels(passage, lineStats) {
    return passage.lines.reduce((levels, line) => {
      const score = Number(lineStats[line.id]?.score || 0);
      levels[line.id] = score >= 3 ? 0 : score >= 1 ? 2 : 3;
      return levels;
    }, {});
  }
  function buildSmartQueue(passage, lineStats) {
    const now = Date.now();
    const indexes = passage.lines.map((_line, index) => index);
    const dueWeak = indexes.filter(index => {
      const stat = lineStats[passage.lines[index].id] || {};
      return stat.weak && (!stat.weakRecheckAt || new Date(stat.weakRecheckAt).getTime() <= now);
    });
    const dueReview = indexes.filter(index => {
      const stat = lineStats[passage.lines[index].id] || {};
      return !dueWeak.includes(index) && stat.nextReviewAt && new Date(stat.nextReviewAt).getTime() <= now;
    });
    const newLines = indexes.filter(index => !lineStats[passage.lines[index].id]?.attempts);
    const reinforcement = indexes.filter(index => {
      const stat = lineStats[passage.lines[index].id] || {};
      return !dueWeak.includes(index) && !dueReview.includes(index) && !newLines.includes(index) && Number(stat.noHintStreak || 0) < 2;
    });
    const queue = [...new Set([...dueWeak, ...dueReview, ...newLines, ...reinforcement])];
    return queue.slice(0, Math.min(6, passage.lines.length));
  }
  function priorityReasonLabel(priority) {
    if (priority?.reason) return priority.reason;
    if (priority?.errorType === 'forgot') return '全文检测时没有背出';
    if (priority?.errorType === 'order') return '全文检测时句序错误';
    if (priority?.errorType === 'hesitate') return '全文检测时出现卡顿';
    return '需要优先补强';
  }

  // 专项训练只读取本地句子状态，将下一步收敛为一条明确、短时的任务。
  function buildSpecialTrainingPlan(passage, passageProgress = {}) {
    const lineStats = passageProgress.lineStats || {};
    const now = Date.now();
    const indexes = passage.lines.map((_line, index) => index);
    const statAt = index => lineStats[passage.lines[index].id] || {};
    const priority = passageProgress.guidedPriority;
    const priorityIndex = indexes.find(index => passage.lines[index].id === priority?.lineId);
    const activeWeak = indexes.filter(index => {
      const stat = statAt(index);
      return stat.weak && (!stat.weakRecheckAt || new Date(stat.weakRecheckAt).getTime() <= now);
    });
    const dueReview = indexes.filter(index => {
      const stat = statAt(index);
      return !activeWeak.includes(index) && stat.nextReviewAt && new Date(stat.nextReviewAt).getTime() <= now;
    });
    const stillUnstable = index => {
      const stat = statAt(index);
      return stat.weak || Number(stat.score || 0) < 3;
    };
    const lapseIndexes = indexes.filter(index => stillUnstable(index) && (Number(statAt(index).lapseCount || 0) > 0 || statAt(index).errorType === 'forgot'));
    const orderIndexes = indexes.filter(index => stillUnstable(index) && statAt(index).errorType === 'order');
    const hesitationIndexes = indexes.filter(index => stillUnstable(index) && (statAt(index).errorType === 'hesitate' || statAt(index).lastRating === 'hint'));
    const unfinished = indexes.filter(index => Number(statAt(index).score || 0) < 2);
    const mastery = Number(passageProgress.mastery || 0);
    const makeReinforce = (lineIndexes, reason, nextAction, focus = 'recall') => ({
      mode: 'reinforce',
      lineIndexes: [...new Set(lineIndexes)].slice(0, 3),
      reason,
      durationLabel: lineIndexes.length > 1 ? '约 1 分钟' : '约 30 秒',
      nextAction,
      focus
    });
    if (priorityIndex >= 0 && Number(priority?.severity || 0) > 0) {
      return makeReinforce([priorityIndex, ...activeWeak], `优先补第 ${priorityIndex + 1} 句：${priorityReasonLabel(priority)}`, '补强后再做一次全文检测', priority.errorType === 'order' ? 'link' : 'recall');
    }
    if (activeWeak.length) return makeReinforce(activeWeak, `有 ${activeWeak.length} 句到期薄弱句`, '完成后等待间隔复查');
    if (lapseIndexes.length) return makeReinforce(lapseIndexes, `第 ${lapseIndexes[0] + 1} 句曾经没有背出`, '补强后用线索渐隐确认');
    if (orderIndexes.length) return makeReinforce(orderIndexes, `第 ${orderIndexes[0] + 1} 句曾有句序错误`, '补强后检查上下句连接', 'link');
    if (dueReview.length) return makeReinforce(dueReview, `有 ${dueReview.length} 句到期复习`, '完成后等待下一次复习');
    if (hesitationIndexes.length) {
      return {
        mode: 'fade',
        lineIndexes: hesitationIndexes.slice(0, 3),
        reason: `第 ${hesitationIndexes[0] + 1} 句仍需线索才能背出`,
        durationLabel: '约 1 分钟',
        nextAction: '无提示通过后再做全文检测',
        focus: 'fade'
      };
    }
    if (mastery >= 85) {
      return {
        mode: 'challenge',
        lineIndexes: [],
        reason: '当前已稳定掌握，不建议重复句子训练',
        durationLabel: '约 2 分钟',
        nextAction: '用全文检测确认是否仍有遗漏',
        focus: 'challenge'
      };
    }
    if (unfinished.length) return makeReinforce(unfinished, `先建立第 ${unfinished[0] + 1} 句的无提示回忆`, '通过后继续下一条补强句');
    return {
      mode: 'visual',
      lineIndexes: [],
      reason: '句子状态稳定，适合用画面做无序提取',
      durationLabel: '约 1 分钟',
      nextAction: '提取有卡顿时回到句子补强',
      focus: 'visual'
    };
  }
  function describePassageSpecialTask(passage, itemProgress) {
    const plan = buildSpecialTrainingPlan(passage, itemProgress || {});
    return {
      ...plan,
      summary: plan.mode === 'challenge' ? '适合全文检测' : plan.mode === 'visual' ? '适合看图快速回忆' : plan.reason
    };
  }
  function buildVisualQueue(passage) {
    const queue = passage.lines.map((_line, index) => index);
    for (let index = queue.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [queue[index], queue[swapIndex]] = [queue[swapIndex], queue[index]];
    }
    return queue;
  }
  function formatReviewWait(dateValue) {
    const remaining = Math.max(0, new Date(dateValue).getTime() - Date.now());
    if (remaining < 60 * 60 * 1000) return `${Math.max(1, Math.ceil(remaining / 60000))} 分钟`;
    if (remaining < 24 * 60 * 60 * 1000) return `${Math.ceil(remaining / 3600000)} 小时`;
    return `${Math.ceil(remaining / 86400000)} 天`;
  }
  function normalizeDictationAnswer(value) {
    return String(value || '').replace(/[\s，。！？；：、“”‘’（）()《》〈〉【】\[\]]/g, '');
  }
  function buildDictationQuestions(passage, onlyLineIds = []) {
    const targetLines = onlyLineIds.length ? passage.lines.filter(line => onlyLineIds.includes(line.id)) : passage.lines;
    return targetLines.map(line => {
      const index = passage.lines.findIndex(item => item.id === line.id);
      const previous = passage.lines[index - 1];
      const next = passage.lines[index + 1];
      if (index % 3 === 0) {
        return {
          id: `meaning-${line.id}`,
          lineId: line.id,
          type: '理解性默写',
          prompt: `根据意思默写原句：${line.meaning}`,
          answer: line.text
        };
      }
      if (index % 3 === 1 && previous) {
        return {
          id: `next-${line.id}`,
          lineId: line.id,
          type: '补写下句',
          prompt: `${previous.text}请写出下一句。`,
          answer: line.text
        };
      }
      if (next) {
        return {
          id: `previous-${line.id}`,
          lineId: line.id,
          type: '补写上句',
          prompt: `${next.text}请写出上一句。`,
          answer: line.text
        };
      }
      return {
        id: `line-${line.id}`,
        lineId: line.id,
        type: '直接默写',
        prompt: `请默写这一句：${line.meaning}`,
        answer: line.text
      };
    });
  }
  function DictationWorkspace({
    passage,
    passageProgress,
    onPersist,
    onBack
  }) {
    const lineStats = passageProgress.lineStats || {};
    const [retryLineIds, setRetryLineIds] = useState([]);
    const [questions, setQuestions] = useState(() => buildDictationQuestions(passage));
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [complete, setComplete] = useState(false);
    const currentQuestion = questions[questionIndex];
    const currentAnswer = answers[currentQuestion?.id] || {
      value: '',
      checked: false
    };
    const checkedCount = Object.values(answers).filter(item => item.checked).length;
    const correctCount = Object.values(answers).filter(item => item.correct).length;
    const existingErrors = passageProgress.dictation?.errorLineIds || [];
    useEffect(() => {
      setRetryLineIds([]);
      setQuestions(buildDictationQuestions(passage));
      setQuestionIndex(0);
      setAnswers({});
      setComplete(false);
    }, [passage.id]);
    function saveResult(question, correct) {
      const currentStat = lineStats[question.lineId] || {
        score: 0,
        hints: 0,
        attempts: 0,
        weak: false
      };
      const nextLineStats = {
        ...lineStats,
        [question.lineId]: rateLineStat(currentStat, correct ? 'smooth' : 'forgot', false, 0, correct ? '' : 'dictation')
      };
      const previousErrors = passageProgress.dictation?.errorLineIds || [];
      const errorLineIds = correct ? previousErrors.filter(lineId => lineId !== question.lineId) : [...new Set([...previousErrors, question.lineId])];
      onPersist(nextLineStats, {
        ...(passageProgress.dictation || {}),
        errorLineIds,
        lastQuestionLineId: question.lineId,
        lastAttemptAt: new Date().toISOString(),
        attempts: Number(passageProgress.dictation?.attempts || 0) + 1,
        correctCount: Number(passageProgress.dictation?.correctCount || 0) + (correct ? 1 : 0)
      });
    }
    function checkCurrentAnswer() {
      if (!currentQuestion || currentAnswer.checked) return;
      const correct = normalizeDictationAnswer(currentAnswer.value) === normalizeDictationAnswer(currentQuestion.answer);
      setAnswers(values => ({
        ...values,
        [currentQuestion.id]: {
          ...currentAnswer,
          checked: true,
          correct
        }
      }));
      saveResult(currentQuestion, correct);
    }
    function nextQuestion() {
      if (questionIndex >= questions.length - 1) {
        setComplete(true);
        return;
      }
      setQuestionIndex(index => index + 1);
    }
    function previousQuestion() {
      if (questionIndex > 0) setQuestionIndex(index => index - 1);
    }
    function restartPaper(lineIds = []) {
      const nextQuestions = buildDictationQuestions(passage, lineIds);
      setRetryLineIds(lineIds);
      setQuestions(nextQuestions);
      setQuestionIndex(0);
      setAnswers({});
      setComplete(false);
    }
    if (!questions.length) return null;
    return /*#__PURE__*/React.createElement("section", {
      className: "cn-dictation fixed inset-0 z-40 flex flex-col overflow-hidden",
      "aria-label": `${passage.title}考试默写`
    }, /*#__PURE__*/React.createElement("header", {
      className: "cn-dictation-header"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cn-recitation-back",
      onClick: onBack,
      "aria-label": "\u8FD4\u56DE\u7BC7\u76EE\u76EE\u5F55"
    }, "\u2190"), /*#__PURE__*/React.createElement("div", {
      className: "cn-dictation-heading"
    }, /*#__PURE__*/React.createElement("span", null, "\u8003\u8BD5\u9ED8\u5199"), /*#__PURE__*/React.createElement("strong", null, passage.title)), /*#__PURE__*/React.createElement("div", {
      className: "cn-dictation-progress"
    }, /*#__PURE__*/React.createElement("span", null, retryLineIds.length ? '错题重写' : '模拟默写'), /*#__PURE__*/React.createElement("strong", null, complete ? '已交卷' : `${questionIndex + 1} / ${questions.length}`))), /*#__PURE__*/React.createElement("div", {
      className: "cn-dictation-body"
    }, /*#__PURE__*/React.createElement("main", {
      className: "cn-dictation-paper"
    }, complete ? /*#__PURE__*/React.createElement("section", {
      className: "cn-dictation-result"
    }, /*#__PURE__*/React.createElement("span", null, retryLineIds.length ? '错题重写完成' : '本卷完成'), /*#__PURE__*/React.createElement("strong", null, correctCount, " / ", questions.length), /*#__PURE__*/React.createElement("p", null, correctCount === questions.length ? '本轮默写全部正确。' : `还有 ${questions.length - correctCount} 题需要订正，先把错句重新写一遍。`), /*#__PURE__*/React.createElement("div", {
      className: "cn-dictation-result-actions"
    }, existingErrors.length ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => restartPaper(existingErrors)
    }, "\u91CD\u5199\u9519\u9898 ", existingErrors.length, " \u9898") : null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => restartPaper()
    }, "\u518D\u505A\u4E00\u5377"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onBack
    }, "\u8FD4\u56DE\u7BC7\u76EE"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "cn-dictation-question-meta"
    }, /*#__PURE__*/React.createElement("span", null, "\u7B2C ", questionIndex + 1, " \u9898"), /*#__PURE__*/React.createElement("b", null, currentQuestion.type)), /*#__PURE__*/React.createElement("h2", null, currentQuestion.prompt), /*#__PURE__*/React.createElement("label", {
      className: "cn-dictation-answer",
      htmlFor: "cn-dictation-input"
    }, /*#__PURE__*/React.createElement("span", null, "\u7B54\u9898\u533A"), /*#__PURE__*/React.createElement("textarea", {
      id: "cn-dictation-input",
      value: currentAnswer.value,
      disabled: currentAnswer.checked,
      placeholder: "\u8BF7\u76F4\u63A5\u9ED8\u5199\u539F\u53E5",
      onChange: event => setAnswers(values => ({
        ...values,
        [currentQuestion.id]: {
          ...currentAnswer,
          value: event.target.value,
          checked: false
        }
      })),
      autoComplete: "off",
      autoCapitalize: "off",
      spellCheck: "false"
    })), currentAnswer.checked ? /*#__PURE__*/React.createElement("div", {
      className: `cn-dictation-feedback ${currentAnswer.correct ? 'is-correct' : 'is-wrong'}`
    }, /*#__PURE__*/React.createElement("span", null, currentAnswer.correct ? '默写正确' : '请订正这一句'), /*#__PURE__*/React.createElement("strong", null, currentQuestion.answer), !currentAnswer.correct ? /*#__PURE__*/React.createElement("small", null, "\u4F60\u7684\u7B54\u6848\uFF1A", currentAnswer.value || '未作答') : null) : null)), /*#__PURE__*/React.createElement("aside", {
      className: "cn-dictation-sidebar",
      "aria-label": "\u9ED8\u5199\u9898\u5361"
    }, /*#__PURE__*/React.createElement("span", null, "\u9898\u5361"), /*#__PURE__*/React.createElement("div", {
      className: "cn-dictation-number-grid"
    }, questions.map((question, index) => {
      const answer = answers[question.id];
      return /*#__PURE__*/React.createElement("button", {
        key: question.id,
        type: "button",
        className: `${index === questionIndex && !complete ? 'is-current' : ''} ${answer?.checked ? answer.correct ? 'is-correct' : 'is-wrong' : ''}`,
        onClick: () => !complete && setQuestionIndex(index)
      }, index + 1);
    })), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5DF2\u6838\u5BF9"), /*#__PURE__*/React.createElement("dd", null, checkedCount)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u6B63\u786E"), /*#__PURE__*/React.createElement("dd", null, correctCount)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5F85\u8BA2\u6B63"), /*#__PURE__*/React.createElement("dd", null, Math.max(0, checkedCount - correctCount)))))), !complete ? /*#__PURE__*/React.createElement("footer", {
      className: "cn-dictation-footer"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: questionIndex === 0,
      onClick: previousQuestion
    }, "\u4E0A\u4E00\u9898"), !currentAnswer.checked ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-primary",
      onClick: checkCurrentAnswer
    }, "\u63D0\u4EA4\u5E76\u6838\u5BF9") : /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-primary",
      onClick: nextQuestion
    }, questionIndex >= questions.length - 1 ? '交卷' : '下一题'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onBack
    }, "\u9000\u51FA\u9ED8\u5199")) : null);
  }
  function RecitationControlPanel({
    mode,
    hintLevel,
    canSpeak,
    onSpeak,
    onCourseware,
    coursewareReady,
    activeStat
  }) {
    const hint = HINTS.find(item => item.level === hintLevel) || HINTS[0];
    const policy = mode === 'reinforce' ? '补强优先' : mode === 'fade' ? '本轮锁定' : '自主提取';
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
      className: "cn-hint-policy"
    }, /*#__PURE__*/React.createElement("h3", null, "\u5F53\u524D\u63D0\u793A"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, policy), /*#__PURE__*/React.createElement("strong", null, hint.label))), /*#__PURE__*/React.createElement("section", {
      className: "cn-recitation-actions"
    }, hintLevel >= 4 ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: !canSpeak,
      onClick: onSpeak
    }, "\u25B6 \u6717\u8BFB\u672C\u53E5") : null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: !coursewareReady,
      onClick: onCourseware
    }, "\u2197 \u53EF\u89C6\u5316\u8BFE\u4EF6")), /*#__PURE__*/React.createElement("section", {
      className: "cn-session-stats"
    }, /*#__PURE__*/React.createElement("h3", null, "\u672C\u53E5\u8BB0\u5F55"), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5C1D\u8BD5"), /*#__PURE__*/React.createElement("dd", null, activeStat.attempts || 0, " \u6B21")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u65E0\u63D0\u793A"), /*#__PURE__*/React.createElement("dd", null, activeStat.noHintStreak || 0, " \u8FDE\u7EED")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u7A33\u5B9A"), /*#__PURE__*/React.createElement("dd", null, Math.round(Math.min(4, Number(activeStat.intervalStage == null ? Math.floor(activeStat.score || 0) : activeStat.intervalStage)) / 4 * 100), "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5F31\u53E5"), /*#__PURE__*/React.createElement("dd", null, activeStat.weak ? '是' : '否')))));
  }
  const GUIDED_PHASES = [{
    id: 'arrival',
    label: '入境'
  }, {
    id: 'read',
    label: '熟读'
  }, {
    id: 'visual',
    label: '成像'
  }, {
    id: 'recall',
    label: '试背'
  }, {
    id: 'link',
    label: '连接'
  }, {
    id: 'recite',
    label: '节奏复原'
  }, {
    id: 'consolidate',
    label: '最后巩固'
  }];
  const GUIDED_DWELL = {
    arrival: 12,
    read: 6,
    visual: 5,
    recall: 0,
    link: 0
  };
  function buildRhythmParts(line) {
    const configuredParts = Array.isArray(line?.rhythm) ? line.rhythm.filter(Boolean) : [];
    if (configuredParts.length >= 2) return configuredParts;
    const keywordParts = Array.isArray(line?.keywords) ? line.keywords.filter(Boolean) : [];
    if (keywordParts.length >= 2) return keywordParts;
    return [String(line?.text || '').replace(/[，。！？；：、]/g, '').trim()].filter(Boolean);
  }
  function createRhythmOrder(parts) {
    const order = parts.map((_part, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }
    if (order.length > 1 && order.every((item, index) => item === index)) {
      order.push(order.shift());
    }
    return order;
  }
  function GuidedRecitationSession({
    passage,
    linkedCard,
    initialSession,
    quickBoost = false,
    onSessionChange,
    onRateLine,
    onFinishReview,
    onExit
  }) {
    const safeInitialPhase = quickBoost ? 'consolidate' : GUIDED_PHASES.some(item => item.id === initialSession?.phase) && initialSession.phase !== 'complete' ? initialSession.phase : 'arrival';
    const quickBoostRef = useRef(quickBoost);
    const isQuickBoost = quickBoostRef.current;
    function createLinkRound() {
      const order = [];
      for (let index = 0; index < passage.lines.length - 1; index += 1) {
        order.push({
          fromIndex: index,
          toIndex: index + 1
        });
        order.push({
          fromIndex: index + 1,
          toIndex: index
        });
      }
      for (let index = order.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
      }
      return {
        order,
        cursor: 0
      };
    }
    const [phase, setPhase] = useState(safeInitialPhase);
    const [lineIndex, setLineIndex] = useState(Number(initialSession?.lineIndex || 0));
    const [remaining, setRemaining] = useState(0);
    const [phaseReady, setPhaseReady] = useState(false);
    const [recallHint, setRecallHint] = useState(0);
    const [recallStep, setRecallStep] = useState('prompt');
    const [peekOriginal, setPeekOriginal] = useState(false);
    const [linkHint, setLinkHint] = useState(false);
    const [linkRound, setLinkRound] = useState(() => createLinkRound());
    const [rhythmOrder, setRhythmOrder] = useState([]);
    const [rhythmSelected, setRhythmSelected] = useState([]);
    const [rhythmFeedback, setRhythmFeedback] = useState('');
    const [rhythmMistakes, setRhythmMistakes] = useState({});
    const [rhythmStartedAt, setRhythmStartedAt] = useState(0);
    const [guidedIssues, setGuidedIssues] = useState({});
    const [guidedEvidence, setGuidedEvidence] = useState({
      noHintLines: {},
      linkSuccesses: 0,
      linkStumbles: 0
    });
    const [consolidation, setConsolidation] = useState(() => isQuickBoost ? {
      targetIndex: Number(initialSession?.lineIndex || 0),
      reason: initialSession?.priorityReason || '优先补强这一句。',
      severity: Number(initialSession?.prioritySeverity || 0)
    } : {
      targetIndex: 0,
      reason: '用最后一题再确认这一句。',
      severity: 0
    });
    const [completeStage, setCompleteStage] = useState('prompt');
    const lineAudioRef = useRef(null);
    const linkPrompt = linkRound.order[linkRound.cursor] || {
      fromIndex: 0,
      toIndex: 1
    };
    const activeLineIndex = phase === 'link' ? linkPrompt.toIndex : lineIndex;
    const activeLine = passage.lines[activeLineIndex] || passage.lines[0];
    const rhythmParts = buildRhythmParts(activeLine);
    const consolidationLine = passage.lines[consolidation.targetIndex] || passage.lines[0];
    const activePhaseIndex = GUIDED_PHASES.findIndex(item => item.id === phase);
    const unitLabel = passage.kind === 'prose' ? '语义段' : '句';
    useEffect(() => {
      passage.lines.forEach(line => {
        if (!line.sceneImage) return;
        const image = new Image();
        image.src = line.sceneImage;
      });
    }, [passage.id]);
    useEffect(() => () => stopRecitationLineAudio(lineAudioRef), []);
    useEffect(() => {
      if (phase !== 'recite') return;
      setRhythmOrder(createRhythmOrder(rhythmParts));
      setRhythmSelected([]);
      setRhythmFeedback('');
    }, [phase, lineIndex, passage.id]);
    useEffect(() => {
      if (phase !== 'recite') return;
      setRhythmStartedAt(Date.now());
      setRhythmMistakes({});
    }, [phase]);
    useEffect(() => {
      if (isQuickBoost && phase === 'consolidate') setRhythmStartedAt(Date.now());
    }, [isQuickBoost, phase]);
    useEffect(() => {
      const duration = GUIDED_DWELL[phase] || 0;
      setRemaining(duration);
      setPhaseReady(duration === 0);
      setRecallHint(0);
      setRecallStep('prompt');
      setPeekOriginal(false);
      setLinkHint(false);
      onSessionChange({
        phase,
        lineIndex,
        updatedAt: new Date().toISOString()
      });
      if (!duration) return undefined;
      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        const next = Math.max(0, duration - Math.floor((Date.now() - startedAt) / 1000));
        setRemaining(next);
        if (next === 0) {
          setPhaseReady(true);
          window.clearInterval(timer);
        }
      }, 250);
      return () => window.clearInterval(timer);
    }, [phase, lineIndex]);
    function moveTo(nextPhase, nextLineIndex = 0) {
      setPhase(nextPhase);
      setLineIndex(nextLineIndex);
    }
    function recordGuidedIssue(lineId, reason, severity) {
      setGuidedIssues(issues => {
        const previous = issues[lineId];
        if (previous && previous.severity >= severity) return issues;
        return {
          ...issues,
          [lineId]: {
            reason,
            severity
          }
        };
      });
    }
    function advanceReadOrVisual() {
      if (lineIndex < passage.lines.length - 1) setLineIndex(index => index + 1);else moveTo(phase === 'read' ? 'visual' : 'recall', 0);
    }
    function speakLine() {
      playRecitationLineAudio(passage, activeLine, lineAudioRef);
    }
    function advanceRecallLine() {
      if (lineIndex < passage.lines.length - 1) setLineIndex(index => index + 1);else if (passage.lines.length > 1) {
        const nextRound = createLinkRound();
        setLinkRound(nextRound);
        moveTo('link', nextRound.order[0].toIndex);
      } else moveTo('recite', 0);
    }
    function beginRecallRating() {
      setRecallStep('rating');
    }
    function handleRecall(rating) {
      onRateLine(activeLine.id, rating, recallHint);
      if (rating === 'smooth') {
        if (recallHint === 0) {
          setGuidedEvidence(evidence => ({
            ...evidence,
            noHintLines: {
              ...evidence.noHintLines,
              [activeLine.id]: true
            }
          }));
        }
        advanceRecallLine();
        return;
      }
      recordGuidedIssue(activeLine.id, rating === 'forgot' ? '试背时没有背出' : '试背时使用过提示', rating === 'forgot' ? 100 : 72);
      setRecallHint(level => Math.min(4, Math.max(1, level + 1)));
      setRecallStep('retry');
    }
    function handleLink(rating) {
      onRateLine(activeLine.id, rating === 'smooth' ? 'smooth' : 'hesitate', 0, rating === 'smooth' ? '' : 'order');
      if (rating !== 'smooth') {
        recordGuidedIssue(activeLine.id, '双向连接时卡住', 46);
        setGuidedEvidence(evidence => ({
          ...evidence,
          linkStumbles: evidence.linkStumbles + 1
        }));
        setLinkHint(true);
        return;
      }
      setGuidedEvidence(evidence => ({
        ...evidence,
        linkSuccesses: evidence.linkSuccesses + 1
      }));
      const nextCursor = linkRound.cursor + 1;
      if (nextCursor < linkRound.order.length) {
        const nextTargetIndex = linkRound.order[nextCursor].toIndex;
        setLinkRound(round => ({
          ...round,
          cursor: nextCursor
        }));
        setLineIndex(nextTargetIndex);
      } else moveTo('recite', 0);
    }
    function resetRhythmLine() {
      setRhythmOrder(createRhythmOrder(rhythmParts));
      setRhythmSelected([]);
      setRhythmFeedback('');
    }
    function selectRhythmPart(partIndex) {
      if (rhythmFeedback === 'correct' || rhythmSelected.includes(partIndex)) return;
      const nextSelected = [...rhythmSelected, partIndex];
      setRhythmSelected(nextSelected);
      if (nextSelected.length !== rhythmParts.length) return;
      const isCorrect = nextSelected.every((item, index) => item === index);
      if (isCorrect) {
        setRhythmFeedback('correct');
        return;
      }
      setRhythmMistakes(mistakes => ({
        ...mistakes,
        [activeLine.id]: true
      }));
      recordGuidedIssue(activeLine.id, '节奏词组曾错序', 26);
      setRhythmFeedback('retry');
    }
    function chooseConsolidationTarget() {
      const rankedIssues = Object.entries(guidedIssues).map(([lineId, issue]) => ({
        lineId,
        ...issue
      })).sort((left, right) => right.severity - left.severity);
      const priorityIssue = rankedIssues[0];
      const issueIndex = passage.lines.findIndex(line => line.id === priorityIssue?.lineId);
      if (issueIndex >= 0) return {
        targetIndex: issueIndex,
        reason: priorityIssue.reason,
        severity: priorityIssue.severity
      };
      const rhythmIssueId = Object.keys(rhythmMistakes)[0];
      const rhythmIssueIndex = passage.lines.findIndex(line => line.id === rhythmIssueId);
      if (rhythmIssueIndex >= 0) return {
        targetIndex: rhythmIssueIndex,
        reason: '节奏词组曾错序',
        severity: 26
      };
      return {
        targetIndex: Math.floor(Math.random() * passage.lines.length),
        reason: '用最后一题再确认这一句。',
        severity: 0
      };
    }
    function advanceRhythmLine() {
      if (lineIndex < passage.lines.length - 1) {
        setLineIndex(index => index + 1);
        return;
      }
      setConsolidation(chooseConsolidationTarget());
      setCompleteStage('prompt');
      setPhase('consolidate');
    }
    function finishConsolidation(rating) {
      onRateLine(consolidationLine.id, rating === 'smooth' ? 'smooth' : 'hesitate', rating === 'smooth' ? 0 : 1, rating === 'smooth' ? '' : 'consolidation');
      const ratings = passage.lines.reduce((result, line) => ({
        ...result,
        [line.id]: rhythmMistakes[line.id] ? 'order' : 'smooth'
      }), {});
      const nextRatings = isQuickBoost ? {
        [consolidationLine.id]: rating
      } : ratings;
      onFinishReview(nextRatings, Math.max(1, Math.floor((Date.now() - rhythmStartedAt) / 1000)), {
        quickBoost: isQuickBoost,
        priorityLineId: consolidationLine.id,
        priorityReason: consolidation.reason,
        prioritySeverity: consolidation.severity
      });
      setCompleteStage('result');
    }
    const renderOriginalPeek = () => /*#__PURE__*/React.createElement("div", {
      className: `cn-original-peek ${peekOriginal ? 'is-revealed' : ''}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-recall-cue hint-4",
      "aria-hidden": !peekOriginal
    }, activeLine.text), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onPointerDown: () => setPeekOriginal(true),
      onPointerUp: () => setPeekOriginal(false),
      onPointerCancel: () => setPeekOriginal(false),
      onPointerLeave: () => setPeekOriginal(false),
      onKeyDown: event => {
        if (event.key === ' ' || event.key === 'Enter') setPeekOriginal(true);
      },
      onKeyUp: () => setPeekOriginal(false)
    }, "\u6309\u4F4F\u67E5\u770B\u539F\u6587"));
    return /*#__PURE__*/React.createElement("main", {
      className: `cn-guided-session phase-${phase}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-progress",
      "aria-label": "\u80CC\u8BF5\u9636\u6BB5"
    }, GUIDED_PHASES.map((item, index) => /*#__PURE__*/React.createElement("span", {
      key: item.id,
      className: `${index === activePhaseIndex ? 'is-active' : ''} ${index < activePhaseIndex ? 'is-complete' : ''}`
    }, /*#__PURE__*/React.createElement("b", null, index + 1), item.label))), phase === 'arrival' ? /*#__PURE__*/React.createElement("section", {
      className: "cn-guided-arrival",
      style: linkedCard?.image ? {
        backgroundImage: `linear-gradient(90deg, rgba(20,20,17,.76), rgba(20,20,17,.2)), url(${linkedCard.image})`
      } : undefined
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, passage.dynasty, " \xB7 ", passage.author), /*#__PURE__*/React.createElement("h2", null, passage.title), /*#__PURE__*/React.createElement("p", null, passage.memoryPath[0]), /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: !phaseReady,
      onClick: () => moveTo('read', 0)
    }, phaseReady ? '开始熟读' : `静心入境 ${remaining}`))) : null, phase === 'read' ? /*#__PURE__*/React.createElement("section", {
      className: "cn-guided-focus cn-guided-read"
    }, /*#__PURE__*/React.createElement("span", null, "\u719F\u8BFB \xB7 \u7B2C ", lineIndex + 1, " ", unitLabel), /*#__PURE__*/React.createElement("p", null, activeLine.text), activeLine.meaning ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-meaning"
    }, /*#__PURE__*/React.createElement("span", null, "\u767D\u8BDD"), /*#__PURE__*/React.createElement("p", null, activeLine.meaning)) : null, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rhythm"
    }, activeLine.keywords.map(keyword => /*#__PURE__*/React.createElement("b", {
      key: keyword
    }, keyword))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: speakLine
    }, "\u6717\u8BFB\u672C\u53E5"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: !phaseReady,
      onClick: advanceReadOrVisual
    }, phaseReady ? '下一句' : `停留 ${remaining}`))) : null, phase === 'visual' ? /*#__PURE__*/React.createElement("section", {
      className: "cn-guided-visual",
      style: activeLine.sceneImage || linkedCard?.image ? {
        backgroundImage: `linear-gradient(90deg, rgba(18,18,16,.82), rgba(18,18,16,.24)), url(${activeLine.sceneImage || linkedCard.image})`
      } : undefined
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\u753B\u9762 ", lineIndex + 1, " / ", passage.lines.length), /*#__PURE__*/React.createElement("h3", null, activeLine.anchor), activeLine.meaning ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-visual-meaning"
    }, /*#__PURE__*/React.createElement("span", null, "\u8FD9\u53E5\u5199\u7684\u662F"), /*#__PURE__*/React.createElement("p", null, activeLine.meaning)) : null, /*#__PURE__*/React.createElement("p", null, activeLine.cue), /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: !phaseReady,
      onClick: advanceReadOrVisual
    }, phaseReady ? '记住画面' : `凝视 ${remaining}`))) : null, phase === 'recall' ? /*#__PURE__*/React.createElement("section", {
      className: "cn-guided-focus cn-guided-recall"
    }, /*#__PURE__*/React.createElement("span", null, "\u8BD5\u80CC \xB7 \u7B2C ", lineIndex + 1, " ", unitLabel), recallStep === 'rating' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-recall-rating"
    }, /*#__PURE__*/React.createElement("b", null, "\u521A\u624D\u8FD9\u4E00\u53E5\u80CC\u5F97\u600E\u4E48\u6837\uFF1F"), /*#__PURE__*/React.createElement("p", null, "\u5982\u5B9E\u9009\u62E9\uFF0C\u7CFB\u7EDF\u4F1A\u6309\u4F60\u7684\u72B6\u6001\u51B3\u5B9A\u662F\u5426\u8865\u63D0\u793A\u548C\u590D\u80CC\u3002"), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rating"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-smooth",
      onClick: () => handleRecall('smooth')
    }, "\u4E00\u6C14\u5475\u6210"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleRecall('hesitate')
    }, "\u4E2D\u95F4\u5361\u4F4F"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-forgot",
      onClick: () => handleRecall('forgot')
    }, "\u6CA1\u6709\u80CC\u51FA"))) : recallHint === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-recall-visual is-image-only",
      "aria-label": "\u5F53\u524D\u53E5\u753B\u9762\u63D0\u793A",
      style: activeLine.sceneImage || linkedCard?.image ? {
        backgroundImage: `url(${activeLine.sceneImage || linkedCard.image})`
      } : undefined
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-recall-image-prompt"
    }, /*#__PURE__*/React.createElement("span", null, recallStep === 'retry' ? '遮住提示，再背一次' : '看图起句'), /*#__PURE__*/React.createElement("strong", null, recallStep === 'retry' ? '现在把刚才那句再完整背一遍' : '看着画面，把这一句完整背出来'))) : recallHint === 1 ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-recall-visual",
      "aria-label": "\u5F53\u524D\u53E5\u753B\u9762\u7EBF\u7D22",
      style: activeLine.sceneImage || linkedCard?.image ? {
        backgroundImage: `linear-gradient(90deg, rgba(15,15,13,.84), rgba(15,15,13,.28)), url(${activeLine.sceneImage || linkedCard.image})`
      } : undefined
    }, /*#__PURE__*/React.createElement("span", null, "\u753B\u9762\u7EBF\u7D22"), /*#__PURE__*/React.createElement("strong", null, activeLine.anchor), /*#__PURE__*/React.createElement("p", null, activeLine.cue)) : recallHint >= 4 ? renderOriginalPeek() : /*#__PURE__*/React.createElement("div", {
      className: `cn-recall-cue hint-${recallHint}`
    }, recitationCue(activeLine, recallHint)), recallStep !== 'rating' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-recall-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-smooth",
      onClick: beginRecallRating
    }, recallHint ? '我重新背完了' : '我背完了'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleRecall(recallHint ? 'forgot' : 'hesitate')
    }, recallHint >= 4 ? '我还是没背出' : '我卡住了，给提示')) : null) : null, phase === 'link' ? /*#__PURE__*/React.createElement("section", {
      className: "cn-guided-focus cn-guided-link"
    }, /*#__PURE__*/React.createElement("span", null, "\u53CC\u5411\u968F\u673A\u8FDE\u63A5 \xB7 ", linkRound.cursor + 1, " / ", linkRound.order.length, " \xB7 \u7B2C ", linkPrompt.fromIndex + 1, " \u2192 \u7B2C ", linkPrompt.toIndex + 1, " ", unitLabel), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-link-scenes"
    }, /*#__PURE__*/React.createElement("article", {
      className: "cn-guided-link-scene is-previous"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-link-image",
      "aria-label": "\u5DF2\u7ED9\u53E5\u573A\u666F",
      style: passage.lines[linkPrompt.fromIndex]?.sceneImage || linkedCard?.image ? {
        backgroundImage: `url(${passage.lines[linkPrompt.fromIndex]?.sceneImage || linkedCard.image})`
      } : undefined
    }), /*#__PURE__*/React.createElement("span", null, "\u5DF2\u7ED9\u53E5"), /*#__PURE__*/React.createElement("p", null, passage.lines[linkPrompt.fromIndex]?.text)), /*#__PURE__*/React.createElement("b", {
      className: "cn-guided-link-arrow",
      "aria-hidden": "true"
    }, "\u2192"), /*#__PURE__*/React.createElement("article", {
      className: `cn-guided-link-scene is-next ${linkHint ? 'is-revealed' : 'is-concealed'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-link-image",
      "aria-label": linkHint ? '要接句场景提示' : '要接句场景尚未显示',
      style: linkHint && (activeLine.sceneImage || linkedCard?.image) ? {
        backgroundImage: `url(${activeLine.sceneImage || linkedCard.image})`
      } : undefined
    }), /*#__PURE__*/React.createElement("span", null, linkHint ? '要接句场景' : '要接句'), /*#__PURE__*/React.createElement("strong", null, linkHint ? activeLine.anchor : '接出对应句'), linkHint ? /*#__PURE__*/React.createElement("p", null, activeLine.initials) : null)), phaseReady ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-link-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleLink('smooth')
    }, "\u8FDE\u63A5\u987A\u5229"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleLink('hesitate')
    }, "\u5361\u5728\u8FDE\u63A5\u5904")) : /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-breath compact"
    }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("b", null, remaining))) : null, phase === 'recite' ? /*#__PURE__*/React.createElement("section", {
      className: "cn-guided-rhythm-rebuild"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rhythm-heading"
    }, /*#__PURE__*/React.createElement("span", null, "\u8282\u594F\u590D\u539F \xB7 ", lineIndex + 1, " / ", passage.lines.length, " \xB7 \u7B2C ", lineIndex + 1, " ", unitLabel), /*#__PURE__*/React.createElement("h2", null, "\u628A\u8BCD\u7EC4\u6309\u6717\u8BFB\u8282\u594F\u6392\u597D"), /*#__PURE__*/React.createElement("p", null, "\u5148\u542C\u771F\u4EBA\u6717\u8BFB\uFF0C\u518D\u70B9\u6309\u4E0B\u65B9\u8BCD\u7EC4\u3002\u6392\u5BF9\u540E\u8DDF\u8BFB\u4E00\u904D\uFF0C\u8BA9\u8BED\u5E8F\u548C\u505C\u987F\u4E00\u8D77\u8BB0\u4F4F\u3002")), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rhythm-layout"
    }, /*#__PURE__*/React.createElement("aside", {
      className: "cn-guided-rhythm-scene"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rhythm-image",
      "aria-label": `${activeLine.anchor}场景图`,
      style: activeLine.sceneImage || linkedCard?.image ? {
        backgroundImage: `url(${activeLine.sceneImage || linkedCard.image})`
      } : undefined
    }), /*#__PURE__*/React.createElement("span", null, "\u753B\u9762\u7EBF\u7D22 \xB7 ", activeLine.anchor), /*#__PURE__*/React.createElement("p", null, activeLine.meaning)), /*#__PURE__*/React.createElement("div", {
      className: `cn-guided-rhythm-task ${rhythmFeedback ? `is-${rhythmFeedback}` : ''}`
    }, /*#__PURE__*/React.createElement("span", null, "\u4F60\u7684\u8282\u594F"), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rhythm-result",
      "aria-live": "polite"
    }, rhythmSelected.length ? rhythmSelected.map((partIndex, index) => /*#__PURE__*/React.createElement("b", {
      key: partIndex
    }, rhythmParts[partIndex], index < rhythmSelected.length - 1 ? /*#__PURE__*/React.createElement("i", null, "/") : null)) : /*#__PURE__*/React.createElement("em", null, "\u6309\u4E0B\u65B9\u8BCD\u7EC4\u5F00\u59CB\u590D\u539F")), /*#__PURE__*/React.createElement("span", null, "\u5F85\u6392\u8BCD\u7EC4"), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rhythm-options"
    }, rhythmOrder.map(partIndex => /*#__PURE__*/React.createElement("button", {
      key: partIndex,
      type: "button",
      disabled: rhythmSelected.includes(partIndex) || rhythmFeedback === 'correct',
      onClick: () => selectRhythmPart(partIndex)
    }, rhythmParts[partIndex]))), rhythmFeedback === 'retry' ? /*#__PURE__*/React.createElement("p", {
      className: "cn-guided-rhythm-feedback is-retry"
    }, "\u987A\u5E8F\u8FD8\u5DEE\u4E00\u70B9\u3002\u7ED3\u5408\u753B\u9762\u548C\u6717\u8BFB\u8282\u594F\uFF0C\u518D\u6392\u4E00\u6B21\u3002") : null, rhythmFeedback === 'correct' ? /*#__PURE__*/React.createElement("p", {
      className: "cn-guided-rhythm-feedback is-correct"
    }, "\u8282\u594F\u6B63\u786E\u3002\u73B0\u5728\u8DDF\u7740\u771F\u4EBA\u6717\u8BFB\u5B8C\u6574\u8BF4\u4E00\u904D\u3002") : null, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rhythm-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-secondary",
      onClick: speakLine
    }, "\u542C\u771F\u4EBA\u6717\u8BFB"), rhythmFeedback === 'retry' ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: resetRhythmLine
    }, "\u91CD\u65B0\u6392\u5217") : null, rhythmFeedback === 'correct' ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: advanceRhythmLine
    }, lineIndex < passage.lines.length - 1 ? '下一句' : '进入最后巩固') : null)))) : null, phase === 'consolidate' ? /*#__PURE__*/React.createElement("section", {
      className: "cn-guided-complete"
    }, completeStage === 'prompt' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-consolidation"
    }, /*#__PURE__*/React.createElement("span", null, "\u6700\u540E\u5DE9\u56FA \xB7 1 / 1"), /*#__PURE__*/React.createElement("h2", null, "\u770B\u7EBF\u7D22\uFF0C\u80CC\u51FA\u8FD9\u4E00\u53E5"), /*#__PURE__*/React.createElement("p", null, "\u672C\u8F6E\u91CD\u70B9\uFF1A", consolidation.reason), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-consolidation-layout"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-consolidation-image",
      style: consolidationLine.sceneImage || linkedCard?.image ? {
        backgroundImage: `url(${consolidationLine.sceneImage || linkedCard.image})`
      } : undefined
    }), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-consolidation-cue"
    }, /*#__PURE__*/React.createElement("span", null, "\u767D\u8BDD\u7EBF\u7D22"), /*#__PURE__*/React.createElement("strong", null, consolidationLine.meaning), /*#__PURE__*/React.createElement("small", null, consolidationLine.anchor))), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-consolidation-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-smooth",
      onClick: () => setCompleteStage('check')
    }, "\u6211\u80CC\u5B8C\u4E86\uFF0C\u6838\u5BF9"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-secondary",
      onClick: () => setCompleteStage('check')
    }, "\u9700\u8981\u63D0\u793A"))) : null, completeStage === 'check' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-consolidation cn-guided-consolidation-check"
    }, /*#__PURE__*/React.createElement("span", null, "\u6838\u5BF9\u539F\u6587"), /*#__PURE__*/React.createElement("h2", null, consolidationLine.text), /*#__PURE__*/React.createElement("p", null, consolidation.reason), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-rating"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-smooth",
      onClick: () => finishConsolidation('smooth')
    }, "\u65E0\u9700\u63D0\u793A\uFF0C\u80CC\u5BF9\u4E86"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => finishConsolidation('hesitate')
    }, "\u770B\u63D0\u793A\u540E\u624D\u60F3\u8D77"))) : null, completeStage === 'result' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-result"
    }, /*#__PURE__*/React.createElement("span", null, "\u672C\u8F6E\u5B8C\u6210"), /*#__PURE__*/React.createElement("h2", null, passage.title), isQuickBoost ? /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-quick-result"
    }, /*#__PURE__*/React.createElement("b", null, consolidationLine.text), /*#__PURE__*/React.createElement("p", null, consolidation.reason), /*#__PURE__*/React.createElement("span", null, "\u8FD9\u4E00\u53E5\u5DF2\u5B8C\u6210\u4E00\u6B21\u65E0\u539F\u6587\u63D0\u53D6\u3002")) : /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-result-evidence"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, Object.keys(guidedEvidence.noHintLines).length), /*#__PURE__*/React.createElement("small", null, "\u65E0\u63D0\u793A\u80CC\u51FA / ", passage.lines.length, " \u53E5")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, guidedEvidence.linkSuccesses), /*#__PURE__*/React.createElement("small", null, "\u53CC\u5411\u8FDE\u63A5\u5B8C\u6210 / ", linkRound.order.length, " \u6B21"), /*#__PURE__*/React.createElement("i", null, "\u66FE\u5361 ", guidedEvidence.linkStumbles, " \u6B21")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, passage.lines.length - Object.keys(rhythmMistakes).length), /*#__PURE__*/React.createElement("small", null, "\u9996\u6B21\u8282\u594F\u6B63\u786E / ", passage.lines.length, " \u53E5"))), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-result-next"
    }, /*#__PURE__*/React.createElement("span", null, "\u4E0B\u4E00\u6B21\u4F18\u5148\u590D\u4E60"), /*#__PURE__*/React.createElement("strong", null, "\u7B2C ", consolidation.targetIndex + 1, " ", unitLabel, " \xB7 ", consolidationLine.text), /*#__PURE__*/React.createElement("p", null, consolidation.reason)), /*#__PURE__*/React.createElement("div", {
      className: "cn-guided-result-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-secondary",
      onClick: () => setCompleteStage('prompt')
    }, "30 \u79D2\u8865\u5F3A"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onExit
    }, "\u8FD4\u56DE\u7BC7\u76EE"))) : null) : null);
  }
  function RecitationWorkspace({
    cards,
    frame,
    initialPassageId,
    progress,
    onProgressChange,
    onClose,
    onOpenCard
  }) {
    const library = app.RECITATION_LIBRARY;
    const [selectedId, setSelectedId] = useState(initialPassageId || library[0]?.id || '');
    const [workspaceView, setWorkspaceView] = useState('home');
    const [homeBookLabel, setHomeBookLabel] = useState('');
    const [homeQuery, setHomeQuery] = useState('');
    const [mode, setMode] = useState('recommend');
    const [activeLineIndex, setActiveLineIndex] = useState(0);
    const [manualHintLevel, setManualHintLevel] = useState(null);
    const [showVisual, setShowVisual] = useState(false);
    const [peekOriginal, setPeekOriginal] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [fadeLevels, setFadeLevels] = useState({});
    const [fadeCompleted, setFadeCompleted] = useState({});
    const [lineRevisitIndex, setLineRevisitIndex] = useState(null);
    const [lineLinking, setLineLinking] = useState(false);
    const [smartQueue, setSmartQueue] = useState([]);
    const [smartCompleted, setSmartCompleted] = useState(false);
    const [visualQueue, setVisualQueue] = useState([]);
    const [visualCompleted, setVisualCompleted] = useState(false);
    const [challengePhase, setChallengePhase] = useState('ready');
    const [challengeRatings, setChallengeRatings] = useState({});
    const [challengeReviewIndex, setChallengeReviewIndex] = useState(0);
    const lineAudioRef = useRef(null);
    const [challengeStartedAt, setChallengeStartedAt] = useState(0);
    const [challengeSeconds, setChallengeSeconds] = useState(0);
    const [reviewClock, setReviewClock] = useState(Date.now());
    const stageRef = useRef(null);
    const passage = library.find(item => item.id === selectedId) || library[0];
    const homeBookLabels = useMemo(() => [...new Set(library.map(item => item.bookLabel).filter(Boolean))], [library]);
    const activeHomeBookLabel = homeBookLabel || passage.bookLabel || homeBookLabels[0] || '';
    const homePassages = useMemo(() => {
      const query = homeQuery.trim();
      return library.filter(item => item.bookLabel === activeHomeBookLabel && (!query || item.title.includes(query) || item.author.includes(query)));
    }, [library, activeHomeBookLabel, homeQuery]);
    const passageProgress = progress.passages?.[passage.id] || {
      lineStats: {},
      mastery: 0,
      status: 'learning',
      weakCount: 0
    };
    const lineStats = passageProgress.lineStats || {};
    const weakIndexes = useMemo(() => passage.lines.map((line, index) => {
      const stat = lineStats[line.id] || {};
      return stat.weak && (!stat.weakRecheckAt || new Date(stat.weakRecheckAt).getTime() <= Date.now()) ? index : -1;
    }).filter(index => index >= 0), [passage.id, passageProgress.updatedAt, reviewClock]);
    const waitingWeakIndexes = useMemo(() => passage.lines.map((line, index) => {
      const stat = lineStats[line.id] || {};
      return stat.weak && stat.weakRecheckAt && new Date(stat.weakRecheckAt).getTime() > Date.now() ? index : -1;
    }).filter(index => index >= 0), [passage.id, passageProgress.updatedAt, reviewClock]);
    const activeLine = passage.lines[activeLineIndex] || passage.lines[0];
    const activeStat = lineStats[activeLine.id] || {
      score: 0,
      hints: 0,
      attempts: 0
    };
    const linkedCard = cards.find(card => card.id === passage.cardId) || null;
    const homeHeroImage = passage.lines.find(line => line.sceneImage)?.sceneImage || linkedCard?.image || '';
    const trainingUnitLabel = passage.kind === 'prose' ? '语义段' : '句';
    const compact = frame.width < 980;
    const portrait = frame.isPortrait;
    const specialPlan = useMemo(() => buildSpecialTrainingPlan(passage, passageProgress), [passage.id, passageProgress.updatedAt, passageProgress.guidedPriority, passageProgress.mastery]);
    useEffect(() => () => stopRecitationLineAudio(lineAudioRef), []);
    const score = Number(activeStat.score || 0);
    const recommendedHint = !activeStat.attempts ? 0 : score <= 0 ? 2 : score <= 1 ? 1 : 0;
    const fadeHint = fadeLevels[activeLine.id] ?? 3;
    const modeHint = mode === 'challenge' || mode === 'reinforce' || mode === 'visual' ? 0 : mode === 'fade' ? fadeHint : recommendedHint;
    const hintLevel = manualHintLevel == null ? modeHint : manualHintLevel;
    const allIndexes = passage.lines.map((_line, index) => index);
    const firstIncompleteIndex = allIndexes.find(index => Number(lineStats[passage.lines[index].id]?.score || 0) < 2);
    const lineGateIndex = firstIncompleteIndex < 0 || firstIncompleteIndex == null ? passage.lines.length - 1 : firstIncompleteIndex;
    const defaultReinforceIndexes = specialPlan.mode === 'reinforce' && specialPlan.lineIndexes.length ? specialPlan.lineIndexes : buildSmartQueue(passage, lineStats);
    const smartIndexes = smartQueue.length ? smartQueue : defaultReinforceIndexes;
    useEffect(() => {
      setHomeBookLabel(passage.bookLabel || '');
      setActiveLineIndex(0);
      setManualHintLevel(null);
      setShowVisual(false);
      setPeekOriginal(false);
      setFeedback('');
      setFadeLevels(buildFadeLevels(passage, lineStats));
      setFadeCompleted({});
      setLineRevisitIndex(null);
      setLineLinking(false);
      const nextSmartQueue = specialPlan.mode === 'reinforce' && specialPlan.lineIndexes.length ? specialPlan.lineIndexes : buildSmartQueue(passage, lineStats);
      setSmartQueue(nextSmartQueue);
      setSmartCompleted(nextSmartQueue.length === 0);
      const nextVisualQueue = buildVisualQueue(passage);
      setVisualQueue(nextVisualQueue);
      setVisualCompleted(nextVisualQueue.length === 0);
      setChallengePhase('ready');
      setChallengeRatings({});
      setChallengeReviewIndex(0);
      setChallengeSeconds(0);
      setMode('recommend');
    }, [selectedId]);
    function selectHomeBook(bookLabel) {
      setHomeBookLabel(bookLabel);
      setHomeQuery('');
      const firstPassage = library.find(item => item.bookLabel === bookLabel);
      if (firstPassage) setSelectedId(firstPassage.id);
    }
    function getHomePassageTitleSize(title) {
      const length = Array.from(title || '').length;
      if (length >= 19) return 'is-title-extra-long';
      if (length >= 12) return 'is-title-long';
      return '';
    }
    useEffect(() => {
      const nextSmartQueue = specialPlan.mode === 'reinforce' && specialPlan.lineIndexes.length ? specialPlan.lineIndexes : buildSmartQueue(passage, lineStats);
      const nextVisualQueue = buildVisualQueue(passage);
      if (mode === 'reinforce') setActiveLineIndex(nextSmartQueue[0] ?? lineGateIndex);else if (mode === 'fade' && specialPlan.mode === 'fade' && specialPlan.lineIndexes.length) setActiveLineIndex(specialPlan.lineIndexes[0]);else if (mode === 'visual') setActiveLineIndex(nextVisualQueue[0] ?? 0);else setActiveLineIndex(0);
      setManualHintLevel(null);
      setShowVisual(false);
      setPeekOriginal(false);
      setFeedback('');
      setFadeLevels(buildFadeLevels(passage, lineStats));
      setFadeCompleted({});
      setLineRevisitIndex(null);
      setLineLinking(false);
      setSmartQueue(nextSmartQueue);
      setSmartCompleted(nextSmartQueue.length === 0);
      setVisualQueue(nextVisualQueue);
      setVisualCompleted(nextVisualQueue.length === 0);
      setChallengePhase('ready');
      setChallengeRatings({});
      setChallengeReviewIndex(0);
      setChallengeSeconds(0);
    }, [mode]);
    useEffect(() => {
      if (challengePhase !== 'reciting' || !challengeStartedAt) return undefined;
      const updateClock = () => setChallengeSeconds(Math.floor((Date.now() - challengeStartedAt) / 1000));
      updateClock();
      const timer = window.setInterval(updateClock, 1000);
      return () => window.clearInterval(timer);
    }, [challengePhase, challengeStartedAt]);
    useEffect(() => {
      const timer = window.setInterval(() => setReviewClock(Date.now()), 30000);
      return () => window.clearInterval(timer);
    }, []);
    useEffect(() => {
      stageRef.current?.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }, [mode, selectedId, smartCompleted, challengePhase]);
    useEffect(() => {
      setPeekOriginal(false);
    }, [activeLineIndex, hintLevel]);
    function persistLineStats(nextLineStats, passagePatch = {}) {
      const summary = calculatePassageSummary(passage, nextLineStats);
      const nextProgress = {
        ...progress,
        passages: {
          ...progress.passages,
          [passage.id]: {
            ...passageProgress,
            ...summary,
            lineStats: nextLineStats,
            ...passagePatch,
            updatedAt: new Date().toISOString()
          }
        }
      };
      app.saveRecitationProgress(nextProgress);
      onProgressChange(nextProgress);
      return nextProgress;
    }
    function persistDictationProgress(nextLineStats, dictation) {
      return persistLineStats(nextLineStats, {
        dictation
      });
    }
    function updateLine(rating) {
      const current = lineStats[activeLine.id] || {
        score: 0,
        hints: 0,
        attempts: 0,
        weak: false
      };
      const nextStat = rateLineStat(current, rating, mode === 'reinforce' || current.weak, hintLevel);
      if (mode === 'reinforce' && current.weak) {
        if (rating === 'smooth') {
          const isDelayedRecheck = current.weakStage === 'waiting' || current.weakRecheckAt && new Date(current.weakRecheckAt).getTime() <= Date.now();
          if (isDelayedRecheck) {
            nextStat.weak = false;
            nextStat.weakStage = 'recovered';
            nextStat.weakRecheckAt = null;
            nextStat.nextReviewAt = new Date(Date.now() + REVIEW_INTERVALS[1]).toISOString();
          } else {
            const weakRecheckAt = new Date(Date.now() + REVIEW_INTERVALS[0]).toISOString();
            nextStat.weak = true;
            nextStat.weakStage = 'waiting';
            nextStat.weakRecheckAt = weakRecheckAt;
            nextStat.nextReviewAt = weakRecheckAt;
          }
        } else {
          nextStat.weak = true;
          nextStat.weakStage = 'active';
          nextStat.weakRecheckAt = null;
        }
      }
      const nextLineStats = {
        ...lineStats,
        [activeLine.id]: nextStat
      };
      const clearsGuidedPriority = mode === 'reinforce' && rating === 'smooth' && passageProgress.guidedPriority?.lineId === activeLine.id;
      persistLineStats(nextLineStats, clearsGuidedPriority ? {
        guidedPriority: null
      } : {});
      setFeedback(RATING_LABELS[rating]);
      if (mode === 'visual') {
        if (rating === 'hint') {
          setManualHintLevel(hintLevel < 2 ? 2 : 4);
          setFeedback(hintLevel < 2 ? '显示首字线索' : '开放模糊原文');
          return;
        }
        if (rating === 'forgot') {
          setManualHintLevel(4);
          setFeedback('开放模糊原文，按住核对');
          return;
        }
        const remainingQueue = visualQueue.filter(index => index !== activeLineIndex);
        const nextQueue = rating === 'hesitate' ? [...remainingQueue, activeLineIndex] : remainingQueue;
        setVisualQueue(nextQueue);
        setVisualCompleted(nextQueue.length === 0);
        setFeedback(rating === 'hesitate' ? '本幅画面已移到队尾，稍后再背' : '本句已通过');
        if (nextQueue.length) setActiveLineIndex(nextQueue[0]);
        setManualHintLevel(null);
        setPeekOriginal(false);
        return;
      }
      if (mode === 'fade') {
        const currentLevel = fadeLevels[activeLine.id] ?? 3;
        const nextLevel = rating === 'smooth' ? currentLevel === 3 ? 2 : 0 : rating === 'hint' || rating === 'forgot' ? currentLevel === 0 ? 2 : 3 : currentLevel;
        const nextCompleted = {
          ...fadeCompleted,
          [activeLine.id]: rating === 'smooth' && currentLevel === 0
        };
        setFadeLevels(levels => ({
          ...levels,
          [activeLine.id]: nextLevel
        }));
        setFadeCompleted(nextCompleted);
        setManualHintLevel(null);
        setShowVisual(false);
        if (rating === 'hint' || rating === 'forgot') {
          setFeedback(currentLevel === 0 ? '本句退回首字线索' : '本句保留关键词线索');
          return;
        }
        const allComplete = passage.lines.every(line => nextCompleted[line.id]);
        if (allComplete) {
          setFeedback('全部句子已完成无提示背诵');
          return;
        }
        const nextIndex = allIndexes.find(index => index > activeLineIndex && !nextCompleted[passage.lines[index].id]) ?? allIndexes.find(index => !nextCompleted[passage.lines[index].id]) ?? activeLineIndex;
        setActiveLineIndex(nextIndex);
        return;
      }
      if (rating === 'hint') {
        setManualHintLevel(Math.min(4, hintLevel + 1));
        return;
      }
      if (rating === 'forgot') {
        const lapseStreak = Number(nextStat.lapseStreak || 1);
        setManualHintLevel(lapseStreak === 1 ? 1 : lapseStreak === 2 ? 3 : 4);
        setShowVisual(lapseStreak === 1 || lapseStreak >= 3);
        setFeedback(lapseStreak === 1 ? '先用画面锚点回想' : lapseStreak === 2 ? '增加关键词线索' : '显示原文并开放可视化课件');
        return;
      }
      if (mode === 'reinforce') {
        if (lineLinking) {
          if (rating === 'smooth') {
            setLineLinking(false);
            setFeedback('上下句连接通过');
          } else {
            setFeedback('连接还不稳定，先用线索回想');
          }
          setManualHintLevel(null);
          setShowVisual(false);
          return;
        }
        if (rating === 'smooth' && specialPlan.focus === 'link' && activeLineIndex > 0) {
          setLineLinking(true);
          setFeedback(`单句通过，再从第 ${activeLineIndex + 1} 句接回第 ${activeLineIndex} 句`);
          setManualHintLevel(null);
          setShowVisual(false);
          return;
        }
        const remainingQueue = smartIndexes.filter(index => index !== activeLineIndex);
        const nextQueue = rating === 'hesitate' ? [...remainingQueue, activeLineIndex] : rating === 'smooth' ? remainingQueue : [activeLineIndex, ...remainingQueue];
        setSmartQueue(nextQueue);
        if (!nextQueue.length) {
          setSmartCompleted(true);
          setFeedback('本轮补强完成');
        } else {
          setActiveLineIndex(nextQueue[0]);
          setFeedback(rating === 'smooth' ? '进入下一条补强句' : '这句保留在本轮，先增加线索');
        }
        setManualHintLevel(null);
        setShowVisual(false);
        return;
      }
      setManualHintLevel(null);
      setShowVisual(false);
    }
    function speakActiveLine() {
      playRecitationLineAudio(passage, activeLine, lineAudioRef);
    }
    function selectLine(index) {
      setActiveLineIndex(index);
      setManualHintLevel(null);
      setShowVisual(false);
      setFeedback('');
      setLineLinking(false);
    }
    function openLinkedCourseware() {
      if (!linkedCard?.courseware?.entry) return;
      const nextLineStats = {
        ...lineStats,
        [activeLine.id]: {
          ...activeStat,
          visualHelpCount: Number(activeStat.visualHelpCount || 0) + 1,
          updatedAt: new Date().toISOString()
        }
      };
      persistLineStats(nextLineStats);
      onOpenCard(linkedCard.id);
    }
    function startChallenge() {
      const startedAt = Date.now();
      setChallengeStartedAt(startedAt);
      setChallengeSeconds(0);
      setChallengeRatings({});
      setChallengeReviewIndex(0);
      setChallengePhase('reciting');
    }
    function restartVisualRecall() {
      const nextQueue = buildVisualQueue(passage);
      setVisualQueue(nextQueue);
      setVisualCompleted(nextQueue.length === 0);
      setActiveLineIndex(nextQueue[0] ?? 0);
      setManualHintLevel(null);
      setPeekOriginal(false);
      setFeedback('已重新打乱画面顺序');
    }
    function finishChallengeRecitation() {
      setChallengeSeconds(Math.floor((Date.now() - challengeStartedAt) / 1000));
      setChallengeReviewIndex(0);
      setChallengePhase('review');
    }
    function completeChallenge(ratings = challengeRatings) {
      const nextLineStats = {
        ...lineStats
      };
      passage.lines.forEach(line => {
        const errorType = ratings[line.id];
        const rating = errorType === 'order' ? 'hesitate' : errorType;
        nextLineStats[line.id] = rateLineStat(nextLineStats[line.id], rating, false, 0, errorType);
      });
      const priorityType = ['forgot', 'order', 'hesitate'].find(type => passage.lines.some(line => ratings[line.id] === type));
      const priorityLine = priorityType ? passage.lines.find(line => ratings[line.id] === priorityType) : null;
      const priorityPatch = priorityLine ? {
        guidedPriority: {
          lineId: priorityLine.id,
          reason: priorityType === 'forgot' ? '全文检测时没有背出' : priorityType === 'order' ? '全文检测时句序错误' : '全文检测时出现卡顿',
          errorType: priorityType,
          severity: priorityType === 'forgot' ? 100 : priorityType === 'order' ? 64 : 46,
          updatedAt: new Date().toISOString()
        }
      } : {
        guidedPriority: null
      };
      persistLineStats(nextLineStats, priorityPatch);
      setChallengePhase('result');
    }
    function startRecommendedTask() {
      if (specialPlan.mode === 'reinforce') {
        const queue = specialPlan.lineIndexes.length ? specialPlan.lineIndexes : buildSmartQueue(passage, lineStats);
        setSmartQueue(queue);
        setSmartCompleted(queue.length === 0);
        setActiveLineIndex(queue[0] ?? 0);
      }
      setMode(specialPlan.mode);
    }
    function startChallengeFollowUp() {
      const priorityType = ['forgot', 'order', 'hesitate'].find(type => passage.lines.some(line => challengeRatings[line.id] === type));
      const priorityIndex = priorityType ? passage.lines.findIndex(line => challengeRatings[line.id] === priorityType) : -1;
      const queue = priorityIndex >= 0 ? [priorityIndex] : buildSmartQueue(passage, lineStats);
      setSmartQueue(queue);
      setSmartCompleted(queue.length === 0);
      setActiveLineIndex(queue[0] ?? 0);
      setMode(priorityIndex >= 0 ? 'reinforce' : 'visual');
    }
    function rateChallengeLine(rating) {
      const line = passage.lines[challengeReviewIndex];
      const nextRatings = {
        ...challengeRatings,
        [line.id]: rating
      };
      setChallengeRatings(nextRatings);
      if (challengeReviewIndex >= passage.lines.length - 1) {
        completeChallenge(nextRatings);
      } else {
        setChallengeReviewIndex(index => index + 1);
      }
    }
    function persistGuidedSession(sessionPatch) {
      const nextProgress = {
        ...progress,
        passages: {
          ...progress.passages,
          [passage.id]: {
            ...passageProgress,
            session: {
              ...(passageProgress.session || {}),
              ...sessionPatch
            }
          }
        }
      };
      app.saveRecitationProgress(nextProgress);
      onProgressChange(nextProgress);
    }
    function startGuidedSession() {
      const resumable = passageProgress.session?.phase && passageProgress.session.phase !== 'complete';
      if (!resumable) {
        persistGuidedSession({
          phase: 'arrival',
          lineIndex: 0,
          quickBoost: false,
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setWorkspaceView('guided');
    }
    function startPriorityBoost() {
      if (!priorityReview) return;
      persistGuidedSession({
        phase: 'consolidate',
        lineIndex: priorityReview.index,
        quickBoost: true,
        priorityReason: priorityReview.reason,
        prioritySeverity: priorityReview.severity,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setWorkspaceView('guided');
    }
    function rateGuidedLine(lineId, rating, hintLevel = 0, errorType = '') {
      const current = lineStats[lineId] || {
        score: 0,
        hints: 0,
        attempts: 0,
        weak: false
      };
      const normalizedRating = rating === 'order' ? 'hesitate' : rating;
      const nextLineStats = {
        ...lineStats,
        [lineId]: rateLineStat(current, normalizedRating, false, hintLevel, errorType || (rating === 'order' ? 'order' : ''))
      };
      persistLineStats(nextLineStats);
    }
    function finishGuidedReview(ratings, seconds, guidedMeta = {}) {
      const nextLineStats = {
        ...lineStats
      };
      passage.lines.forEach(line => {
        if (!Object.prototype.hasOwnProperty.call(ratings, line.id)) return;
        const errorType = ratings[line.id];
        const rating = errorType === 'order' ? 'hesitate' : errorType;
        nextLineStats[line.id] = rateLineStat(nextLineStats[line.id], rating, false, 0, errorType);
      });
      const summary = calculatePassageSummary(passage, nextLineStats);
      const completedAt = new Date().toISOString();
      const completedPriority = guidedMeta.prioritySeverity > 0 ? {
        lineId: guidedMeta.priorityLineId,
        reason: guidedMeta.priorityReason,
        severity: guidedMeta.prioritySeverity,
        updatedAt: completedAt
      } : null;
      const nextPriority = guidedMeta.quickBoost ? ratings[guidedMeta.priorityLineId] === 'smooth' ? null : passageProgress.guidedPriority || completedPriority : completedPriority;
      const nextProgress = {
        ...progress,
        passages: {
          ...progress.passages,
          [passage.id]: {
            ...passageProgress,
            ...summary,
            lineStats: nextLineStats,
            guidedPriority: nextPriority,
            session: {
              ...(passageProgress.session || {}),
              phase: 'complete',
              lineIndex: 0,
              quickBoost: false,
              durationSeconds: seconds,
              completedAt,
              updatedAt: completedAt
            },
            updatedAt: completedAt
          }
        }
      };
      app.saveRecitationProgress(nextProgress);
      onProgressChange(nextProgress);
    }
    const summaryStatus = passageProgress.status || 'learning';
    const visibleLines = passage.lines.map((line, index) => ({
      line,
      index
    }));
    const smartTaskComplete = mode === 'reinforce' && smartCompleted;
    const regularTraining = mode === 'reinforce' || mode === 'fade';
    const fadeCounts = Object.values(fadeLevels).reduce((counts, level) => ({
      keywords: counts.keywords + (level === 3 ? 1 : 0),
      initials: counts.initials + (level === 2 ? 1 : 0),
      blank: counts.blank + (level === 0 ? 1 : 0)
    }), {
      keywords: 0,
      initials: 0,
      blank: 0
    });
    const modeStatus = mode === 'reinforce' ? {
      label: lineLinking ? '上下句连接' : '本轮补强',
      value: lineLinking ? `第 ${activeLineIndex + 1} 句接回第 ${activeLineIndex} 句` : `${Math.max(1, smartIndexes.indexOf(activeLineIndex) + 1)} / ${Math.max(1, smartIndexes.length)} · ${specialPlan.durationLabel}`
    } : mode === 'fade' ? {
      label: '按句渐隐',
      value: `关键词 ${fadeCounts.keywords} · 首字 ${fadeCounts.initials} · 无提示 ${fadeCounts.blank}`
    } : {
      label: '专项训练',
      value: specialPlan.durationLabel
    };
    const challengeReviewLine = passage.lines[challengeReviewIndex] || passage.lines[0];
    const challengeSummary = CHALLENGE_RATINGS.reduce((result, item) => ({
      ...result,
      [item.id]: Object.values(challengeRatings).filter(rating => rating === item.id).length
    }), {});
    const coursewareUnlocked = Boolean(linkedCard?.courseware?.entry) && (Number(activeStat.lapseStreak || 0) >= 3 || hintLevel >= 4);
    const guidedSession = passageProgress.session || {};
    const canResumeGuided = Boolean(guidedSession.phase && guidedSession.phase !== 'complete');
    const priorityReview = useMemo(() => {
      const priority = passageProgress.guidedPriority;
      const index = passage.lines.findIndex(line => line.id === priority?.lineId);
      return index >= 0 && Number(priority?.severity || 0) > 0 ? {
        ...priority,
        index
      } : null;
    }, [passage.id, passageProgress.guidedPriority]);
    if (workspaceView === 'home') {
      return /*#__PURE__*/React.createElement("section", {
        className: "cn-recitation cn-recitation-home-shell fixed inset-0 z-40 flex flex-col overflow-hidden",
        "aria-label": "\u53E4\u8BD7\u8BCD\u6587\u8A00\u6587\u80CC\u8BF5\u7CFB\u7EDF"
      }, /*#__PURE__*/React.createElement("header", {
        className: "cn-recitation-header flex shrink-0 items-center justify-between gap-3 px-4 sm:px-6"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex min-w-0 items-center gap-3"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "cn-recitation-back",
        onClick: onClose,
        "aria-label": "\u8FD4\u56DE\u8BED\u6587\u5361\u7247"
      }, "\u2190"), /*#__PURE__*/React.createElement("div", {
        className: "min-w-0"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-[10px] font-bold tracking-[0.24em] text-[#9b332b]"
      }, "\u7BC7\u76EE\u76EE\u5F55"), /*#__PURE__*/React.createElement("h1", {
        className: "truncate text-base font-bold text-[#1c1c1c] sm:text-xl"
      }, "\u53E4\u8BD7\u8BCD\xB7\u6587\u8A00\u6587\u80CC\u8BF5"))), /*#__PURE__*/React.createElement("strong", {
        className: "cn-recitation-count"
      }, library.length, " \u7BC7")), /*#__PURE__*/React.createElement("div", {
        className: "cn-recitation-home"
      }, /*#__PURE__*/React.createElement("aside", {
        className: "cn-recitation-home-list",
        "aria-label": "\u80CC\u8BF5\u7BC7\u76EE"
      }, /*#__PURE__*/React.createElement("div", {
        className: "cn-home-catalog-tools"
      }, /*#__PURE__*/React.createElement("label", {
        className: "cn-home-book-select"
      }, /*#__PURE__*/React.createElement("span", null, "\u9009\u62E9\u7BC7\u76EE"), /*#__PURE__*/React.createElement("select", {
        value: activeHomeBookLabel,
        onChange: event => selectHomeBook(event.target.value),
        "aria-label": "\u9009\u62E9\u518C\u6B21"
      }, homeBookLabels.map(bookLabel => /*#__PURE__*/React.createElement("option", {
        key: bookLabel,
        value: bookLabel
      }, bookLabel)))), /*#__PURE__*/React.createElement("label", {
        className: "cn-home-search"
      }, /*#__PURE__*/React.createElement("span", {
        className: "sr-only"
      }, "\u641C\u7D22\u7BC7\u76EE"), /*#__PURE__*/React.createElement("input", {
        value: homeQuery,
        onChange: event => setHomeQuery(event.target.value),
        placeholder: "\u641C\u7D22\u7BC7\u76EE\u6216\u4F5C\u8005",
        "aria-label": "\u641C\u7D22\u7BC7\u76EE\u6216\u4F5C\u8005"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "cn-home-list-heading"
      }, /*#__PURE__*/React.createElement("span", null, homeQuery ? '搜索结果' : '本册篇目'), /*#__PURE__*/React.createElement("b", null, homePassages.length, " \u7BC7")), /*#__PURE__*/React.createElement("div", {
        className: "cn-home-passage-scroll"
      }, homePassages.map(item => {
        const itemProgress = progress.passages?.[item.id];
        const index = library.findIndex(entry => entry.id === item.id);
        return /*#__PURE__*/React.createElement("button", {
          key: item.id,
          type: "button",
          className: `cn-home-passage ${getHomePassageTitleSize(item.title)} ${item.id === passage.id ? 'is-active' : ''}`,
          onClick: () => setSelectedId(item.id)
        }, /*#__PURE__*/React.createElement("span", null, String(index + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, item.title), /*#__PURE__*/React.createElement("small", null, item.dynasty, " \xB7 ", item.author)), /*#__PURE__*/React.createElement("b", null, app.formatRecitationStatus(progress, item.id)));
      }), !homePassages.length ? /*#__PURE__*/React.createElement("div", {
        className: "cn-home-empty-search"
      }, "\u6CA1\u6709\u5339\u914D\u7684\u7BC7\u76EE") : null)), /*#__PURE__*/React.createElement("main", {
        className: "cn-recitation-home-hero"
      }, /*#__PURE__*/React.createElement("div", {
        className: "cn-home-hero-art",
        "aria-hidden": "true",
        style: homeHeroImage ? {
          backgroundImage: `url(${homeHeroImage})`
        } : undefined
      }), /*#__PURE__*/React.createElement("div", {
        className: "cn-home-hero-content"
      }, /*#__PURE__*/React.createElement("div", {
        className: "cn-home-eyebrow"
      }, /*#__PURE__*/React.createElement("span", null, passage.bookLabel, " \xB7 ", passage.genre), /*#__PURE__*/React.createElement("b", null, app.formatRecitationStatus(progress, passage.id), " \xB7 ", passageProgress.mastery || 0, "%")), /*#__PURE__*/React.createElement("h2", null, passage.title), /*#__PURE__*/React.createElement("p", null, passage.dynasty, " \xB7 ", passage.author), /*#__PURE__*/React.createElement("div", {
        className: "cn-home-progress-summary"
      }, /*#__PURE__*/React.createElement("span", null, "\u672C\u7BC7\u5B66\u4E60\u8DEF\u5F84"), /*#__PURE__*/React.createElement("div", {
        className: "cn-home-memory-path"
      }, passage.memoryPath.map((item, index) => /*#__PURE__*/React.createElement("span", {
        key: item
      }, /*#__PURE__*/React.createElement("b", null, String(index + 1).padStart(2, '0')), item)))), canResumeGuided ? /*#__PURE__*/React.createElement("div", {
        className: "cn-home-resume-note"
      }, "\u4E0A\u6B21\u505C\u5728\uFF1A", GUIDED_PHASES.find(item => item.id === guidedSession.phase)?.label || '背诵中', " \xB7 \u7B2C ", Number(guidedSession.lineIndex || 0) + 1, " \u53E5") : null, priorityReview && !canResumeGuided ? /*#__PURE__*/React.createElement("div", {
        className: "cn-home-priority"
      }, /*#__PURE__*/React.createElement("span", null, "\u4E0B\u6B21\u4F18\u5148\u590D\u4E60"), /*#__PURE__*/React.createElement("strong", null, "\u7B2C ", priorityReview.index + 1, " ", trainingUnitLabel, " \xB7 ", passage.lines[priorityReview.index]?.text), /*#__PURE__*/React.createElement("small", null, priorityReview.reason)) : null, /*#__PURE__*/React.createElement("div", {
        className: `cn-home-actions ${priorityReview && !canResumeGuided ? 'has-priority' : ''}`
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "is-primary",
        onClick: () => setWorkspaceView('special')
      }, "\u5F00\u59CB\u9ED8\u5199\u8BAD\u7EC3"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: startGuidedSession
      }, canResumeGuided ? '继续今日背诵' : '开始今日背诵'), priorityReview && !canResumeGuided ? /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "cn-home-priority-action",
        onClick: startPriorityBoost
      }, "\u5148\u8865\u7B2C ", priorityReview.index + 1, " ", trainingUnitLabel, "\uFF0830 \u79D2\uFF09") : null), /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "cn-home-card-link",
        disabled: !linkedCard,
        onClick: () => linkedCard && onOpenCard(linkedCard.id)
      }, "\u67E5\u770B\u5173\u8054\u53EF\u89C6\u5316\u5361\u7247")))));
    }
    if (workspaceView === 'guided') {
      return /*#__PURE__*/React.createElement("section", {
        className: "cn-recitation cn-recitation-guided-shell fixed inset-0 z-40 flex flex-col overflow-hidden",
        "aria-label": `${passage.title}沉浸背诵`
      }, /*#__PURE__*/React.createElement("header", {
        className: "cn-guided-header"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "cn-recitation-back",
        onClick: () => setWorkspaceView('home'),
        "aria-label": "\u8FD4\u56DE\u7BC7\u76EE\u76EE\u5F55"
      }, "\u2190"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\u4ECA\u65E5\u80CC\u8BF5"), /*#__PURE__*/React.createElement("strong", null, passage.title))), /*#__PURE__*/React.createElement(GuidedRecitationSession, {
        passage: passage,
        linkedCard: linkedCard,
        initialSession: guidedSession,
        quickBoost: Boolean(guidedSession.quickBoost),
        onSessionChange: persistGuidedSession,
        onRateLine: rateGuidedLine,
        onFinishReview: finishGuidedReview,
        onExit: () => setWorkspaceView('home')
      }));
    }
    if (workspaceView === 'special') {
      return /*#__PURE__*/React.createElement(DictationWorkspace, {
        passage: passage,
        passageProgress: passageProgress,
        onPersist: persistDictationProgress,
        onBack: () => setWorkspaceView('home')
      });
    }
    return /*#__PURE__*/React.createElement("section", {
      className: "cn-recitation fixed inset-0 z-40 flex flex-col overflow-hidden",
      "aria-label": "\u53E4\u8BD7\u8BCD\u6587\u8A00\u6587\u80CC\u8BF5\u7CFB\u7EDF"
    }, /*#__PURE__*/React.createElement("header", {
      className: "cn-recitation-header flex shrink-0 items-center justify-between gap-3 px-4 sm:px-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex min-w-0 items-center gap-3"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cn-recitation-back",
      onClick: () => setWorkspaceView('home'),
      "aria-label": "\u8FD4\u56DE\u7BC7\u76EE\u76EE\u5F55"
    }, "\u2190"), /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold tracking-[0.24em] text-[#9b332b]"
    }, "\u4E13\u9879\u8BAD\u7EC3"), /*#__PURE__*/React.createElement("h1", {
      className: "truncate text-base font-bold text-[#1c1c1c] sm:text-xl"
    }, passage.title))), /*#__PURE__*/React.createElement("div", {
      className: "flex shrink-0 items-center gap-2 text-xs text-[#595348]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "hidden sm:inline"
    }, "\u672C\u5730\u4FDD\u5B58"), /*#__PURE__*/React.createElement("strong", {
      className: "cn-recitation-count"
    }, library.length, " \u7BC7"))), /*#__PURE__*/React.createElement("nav", {
      className: "cn-recitation-modes no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-3 py-2 sm:px-6",
      "aria-label": "\u80CC\u8BF5\u6A21\u5F0F"
    }, MODES.map(item => /*#__PURE__*/React.createElement("button", {
      key: item.id,
      type: "button",
      className: mode === item.id ? 'is-active' : '',
      onClick: () => setMode(item.id)
    }, item.label))), /*#__PURE__*/React.createElement("div", {
      className: `cn-recitation-body grid min-h-0 flex-1 ${portrait ? 'grid-cols-1' : compact ? 'grid-cols-[210px_minmax(0,1fr)]' : mode === 'challenge' || mode === 'visual' || mode === 'recommend' ? 'grid-cols-[240px_minmax(0,1fr)]' : 'grid-cols-[240px_minmax(0,1fr)_300px]'}`
    }, /*#__PURE__*/React.createElement("aside", {
      className: `cn-recitation-library no-scrollbar min-h-0 overflow-y-auto ${portrait ? 'flex max-h-[94px] gap-2 overflow-x-auto overflow-y-hidden' : ''}`,
      "aria-label": "\u80CC\u8BF5\u7BC7\u76EE"
    }, library.map(item => {
      const itemProgress = progress.passages?.[item.id];
      const selected = item.id === passage.id;
      const task = describePassageSpecialTask(item, itemProgress);
      return /*#__PURE__*/React.createElement("button", {
        key: item.id,
        type: "button",
        className: `cn-recitation-passage ${selected ? 'is-active' : ''}`,
        onClick: () => setSelectedId(item.id)
      }, /*#__PURE__*/React.createElement("span", {
        className: "cn-recitation-passage-book"
      }, item.bookLabel), /*#__PURE__*/React.createElement("strong", null, item.title), /*#__PURE__*/React.createElement("span", {
        className: `cn-recitation-passage-state ${statusTone(itemProgress?.status)}`
      }, app.formatRecitationStatus(progress, item.id), " \xB7 ", itemProgress?.mastery || 0, "%"), /*#__PURE__*/React.createElement("small", {
        className: "cn-recitation-passage-task"
      }, task.summary, " \xB7 ", task.durationLabel));
    })), /*#__PURE__*/React.createElement("main", {
      ref: stageRef,
      className: "cn-recitation-stage no-scrollbar min-h-0 overflow-y-auto"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-recitation-title-row"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, passage.dynasty, " \xB7 ", passage.author), /*#__PURE__*/React.createElement("h2", null, passage.title)), /*#__PURE__*/React.createElement("div", {
      className: `cn-recitation-mastery ${statusTone(summaryStatus)}`
    }, /*#__PURE__*/React.createElement("strong", null, passageProgress.mastery || 0, "%"), /*#__PURE__*/React.createElement("span", null, app.formatRecitationStatus(progress, passage.id)))), mode === 'recommend' ? /*#__PURE__*/React.createElement("section", {
      className: `cn-special-recommend is-${specialPlan.mode}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-special-recommend-kicker"
    }, "\u7CFB\u7EDF\u63A8\u8350"), /*#__PURE__*/React.createElement("strong", null, specialPlan.mode === 'challenge' ? '先做一次全文检测' : specialPlan.mode === 'fade' ? '用线索渐隐补稳记忆' : specialPlan.mode === 'visual' ? '用画面做一次无序提取' : '先补强最需要的一句'), /*#__PURE__*/React.createElement("p", null, specialPlan.reason), specialPlan.lineIndexes.length ? /*#__PURE__*/React.createElement("div", {
      className: "cn-special-recommend-lines"
    }, specialPlan.lineIndexes.map(index => /*#__PURE__*/React.createElement("span", {
      key: passage.lines[index].id
    }, "\u7B2C ", index + 1, " ", trainingUnitLabel))) : null, /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u9884\u8BA1"), /*#__PURE__*/React.createElement("dd", null, specialPlan.durationLabel)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5B8C\u6210\u540E"), /*#__PURE__*/React.createElement("dd", null, specialPlan.nextAction))), /*#__PURE__*/React.createElement("div", {
      className: "cn-special-recommend-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: startRecommendedTask
    }, specialPlan.mode === 'challenge' ? '开始全文检测' : specialPlan.mode === 'visual' ? '开始看图提取' : '开始本轮补强'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setMode('reinforce')
    }, "\u81EA\u9009\u53E5\u5B50\u8865\u5F3A"))) : mode === 'challenge' ? /*#__PURE__*/React.createElement("section", {
      className: `cn-challenge cn-challenge-${challengePhase}`
    }, challengePhase === 'ready' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-challenge-ready"
    }, /*#__PURE__*/React.createElement("span", null, "\u5168\u6587\u6311\u6218"), /*#__PURE__*/React.createElement("strong", null, passage.lines.length, " ", trainingUnitLabel), /*#__PURE__*/React.createElement("b", null, "\u51C6\u5907"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: startChallenge
    }, "\u5F00\u59CB\u6574\u7BC7\u80CC\u8BF5")) : null, challengePhase === 'reciting' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-challenge-reciting"
    }, /*#__PURE__*/React.createElement("span", null, "\u80CC\u8BF5\u8FDB\u884C\u4E2D"), /*#__PURE__*/React.createElement("strong", null, formatDuration(challengeSeconds)), /*#__PURE__*/React.createElement("div", {
      className: "cn-challenge-pulse",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: finishChallengeRecitation
    }, "\u5B8C\u6210\u80CC\u8BF5")) : null, challengePhase === 'review' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-challenge-review"
    }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("span", null, "\u9010\u53E5\u6838\u5BF9"), /*#__PURE__*/React.createElement("strong", null, challengeReviewIndex + 1, " / ", passage.lines.length)), /*#__PURE__*/React.createElement("div", {
      className: "cn-challenge-review-list"
    }, /*#__PURE__*/React.createElement("article", {
      key: challengeReviewLine.id
    }, /*#__PURE__*/React.createElement("b", null, challengeReviewIndex + 1), /*#__PURE__*/React.createElement("p", null, challengeReviewLine.text), /*#__PURE__*/React.createElement("div", null, CHALLENGE_RATINGS.map(item => /*#__PURE__*/React.createElement("button", {
      key: item.id,
      type: "button",
      onClick: () => rateChallengeLine(item.id)
    }, item.label)))))) : null, challengePhase === 'result' ? /*#__PURE__*/React.createElement("div", {
      className: "cn-challenge-result"
    }, /*#__PURE__*/React.createElement("span", null, "\u6311\u6218\u5B8C\u6210"), /*#__PURE__*/React.createElement("strong", null, formatDuration(challengeSeconds)), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u6B63\u786E"), /*#__PURE__*/React.createElement("dd", null, challengeSummary.smooth || 0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u6B21\u5E8F"), /*#__PURE__*/React.createElement("dd", null, challengeSummary.order || 0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5361\u987F"), /*#__PURE__*/React.createElement("dd", null, challengeSummary.hesitate || 0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5FD8\u8BB0"), /*#__PURE__*/React.createElement("dd", null, challengeSummary.forgot || 0))), challengeSummary.forgot || challengeSummary.order || challengeSummary.hesitate ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
      className: "cn-challenge-followup"
    }, "\u68C0\u6D4B\u5230\u8584\u5F31\u70B9\uFF0C\u5DF2\u751F\u6210\u4E0B\u4E00\u6761\u53E5\u5B50\u8865\u5F3A\u4EFB\u52A1\u3002"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: startChallengeFollowUp
    }, "\u53BB\u505A 30 \u79D2\u8865\u5F3A")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
      className: "cn-challenge-followup"
    }, "\u5168\u6587\u65E0\u660E\u663E\u95EE\u9898\uFF0C\u4E0B\u4E00\u6B65\u9002\u5408\u7528\u753B\u9762\u505A\u968F\u673A\u63D0\u53D6\u3002"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setMode('visual')
    }, "\u8FDB\u5165\u770B\u56FE\u63D0\u53D6")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cn-challenge-secondary",
      onClick: startChallenge
    }, "\u518D\u6B21\u68C0\u6D4B")) : null) : mode === 'visual' ? /*#__PURE__*/React.createElement("section", {
      className: `cn-image-recall ${visualCompleted ? 'is-complete' : ''}`
    }, visualCompleted ? /*#__PURE__*/React.createElement("div", {
      className: "cn-image-mode-complete"
    }, /*#__PURE__*/React.createElement("span", null, "\u770B\u56FE\u80CC\u53E5"), /*#__PURE__*/React.createElement("strong", null, "\u672C\u8F6E\u753B\u9762\u5DF2\u5168\u90E8\u901A\u8FC7"), /*#__PURE__*/React.createElement("p", null, "\u91CD\u65B0\u6253\u4E71\u540E\uFF0C\u53EF\u4EE5\u518D\u505A\u4E00\u8F6E\u65E0\u5E8F\u63D0\u53D6\u3002"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: restartVisualRecall
    }, "\u91CD\u65B0\u6253\u4E71\u7EC3\u4E60")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("header", {
      className: "cn-image-recall-heading"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\u968F\u673A\u753B\u9762"), /*#__PURE__*/React.createElement("strong", null, "\u770B\u56FE\u80CC\u51FA\u5BF9\u5E94\u53E5")), /*#__PURE__*/React.createElement("b", null, passage.lines.length - visualQueue.length + 1, " / ", passage.lines.length)), /*#__PURE__*/React.createElement("div", {
      className: "cn-image-recall-scene",
      role: "img",
      "aria-label": `第 ${activeLineIndex + 1} ${trainingUnitLabel}的场景图`,
      style: activeLine.sceneImage || linkedCard?.image ? {
        backgroundImage: `url(${activeLine.sceneImage || linkedCard.image})`
      } : undefined
    }), /*#__PURE__*/React.createElement("div", {
      className: "cn-image-recall-help",
      "aria-live": "polite"
    }, hintLevel >= 4 ? /*#__PURE__*/React.createElement("div", {
      className: `cn-original-peek ${peekOriginal ? 'is-revealed' : ''}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-recall-cue hint-4",
      "aria-hidden": !peekOriginal
    }, activeLine.text), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onPointerDown: () => setPeekOriginal(true),
      onPointerUp: () => setPeekOriginal(false),
      onPointerCancel: () => setPeekOriginal(false),
      onPointerLeave: () => setPeekOriginal(false),
      onKeyDown: event => {
        if (event.key === ' ' || event.key === 'Enter') setPeekOriginal(true);
      },
      onKeyUp: () => setPeekOriginal(false)
    }, "\u6309\u4F4F\u67E5\u770B\u539F\u6587")) : hintLevel >= 2 ? /*#__PURE__*/React.createElement("strong", null, activeLine.initials) : /*#__PURE__*/React.createElement("span", null, "\u5148\u6839\u636E\u753B\u9762\u56DE\u60F3\uFF0C\u4E0D\u663E\u793A\u9898\u76EE\u987A\u5E8F\u4E0E\u539F\u6587"), feedback ? /*#__PURE__*/React.createElement("small", null, feedback) : null), /*#__PURE__*/React.createElement("div", {
      className: "cn-self-check cn-image-recall-actions",
      "aria-label": "\u770B\u56FE\u80CC\u53E5\u81EA\u67E5"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-smooth",
      onClick: () => updateLine('smooth')
    }, "\u987A\u5229\u80CC\u51FA"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => updateLine('hesitate')
    }, "\u6709\u4E9B\u5361\u987F"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => updateLine('hint')
    }, hintLevel >= 2 ? '再给提示' : '提示首字'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-forgot",
      onClick: () => updateLine('forgot')
    }, "\u6CA1\u6709\u80CC\u51FA")))) : smartTaskComplete ? /*#__PURE__*/React.createElement("section", {
      className: "cn-smart-complete"
    }, /*#__PURE__*/React.createElement("span", null, "\u53E5\u5B50\u8865\u5F3A"), /*#__PURE__*/React.createElement("strong", null, "\u672C\u8F6E\u8865\u5F3A\u5B8C\u6210"), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5DF2\u8865\u5F3A"), /*#__PURE__*/React.createElement("dd", null, Math.max(1, defaultReinforceIndexes.length), " \u53E5")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u5F53\u524D\u638C\u63E1"), /*#__PURE__*/React.createElement("dd", null, passageProgress.mastery || 0, "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "\u4E0B\u4E00\u6B65"), /*#__PURE__*/React.createElement("dd", null, passageProgress.mastery >= 85 ? '全文检测' : '返回系统推荐'))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setMode(passageProgress.mastery >= 85 ? 'challenge' : 'recommend')
    }, passageProgress.mastery >= 85 ? '去做全文检测' : '查看下一条建议'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setWorkspaceView('home')
    }, "\u8FD4\u56DE\u7BC7\u76EE"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: `cn-mode-status mode-${mode}`
    }, /*#__PURE__*/React.createElement("span", null, modeStatus.label), /*#__PURE__*/React.createElement("strong", null, modeStatus.value)), /*#__PURE__*/React.createElement("div", {
      className: `cn-memory-path ${hintLevel === 0 ? 'is-concealed' : ''}`,
      "aria-label": hintLevel === 0 ? '记忆路径已隐藏' : '记忆路径'
    }, passage.memoryPath.map((item, index) => /*#__PURE__*/React.createElement("span", {
      key: item
    }, /*#__PURE__*/React.createElement("b", null, index + 1), hintLevel === 0 ? '记忆节点' : item))), /*#__PURE__*/React.createElement("div", {
      className: "cn-recitation-lines",
      "aria-label": "\u539F\u6587\u53E5\u5E8F"
    }, visibleLines.map(({
      line,
      index
    }) => {
      const stat = lineStats[line.id];
      const locked = false;
      return /*#__PURE__*/React.createElement("button", {
        key: line.id,
        type: "button",
        disabled: locked,
        className: `${index === activeLineIndex ? 'is-active' : ''} ${stat?.weak ? 'is-weak' : ''}`,
        onClick: () => selectLine(index)
      }, /*#__PURE__*/React.createElement("span", null, index + 1), /*#__PURE__*/React.createElement("strong", null, index === activeLineIndex ? '当前句' : `第 ${index + 1} 句`), /*#__PURE__*/React.createElement("small", null, lineStudyStatus(stat)));
    })), /*#__PURE__*/React.createElement("section", {
      className: "cn-recall-surface",
      "aria-live": "polite"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-recall-index"
    }, "\u7B2C ", activeLineIndex + 1, " ", trainingUnitLabel, " \xB7 ", lineLinking ? '上下句连接' : hintLevel === 0 && !showVisual ? '先背诵，再自评' : activeLine.anchor), showVisual || hintLevel === 1 ? /*#__PURE__*/React.createElement("div", {
      className: "cn-visual-anchor",
      style: activeLine.sceneImage || linkedCard?.image ? {
        backgroundImage: `linear-gradient(90deg, rgba(15,15,13,.82), rgba(15,15,13,.2)), url(${activeLine.sceneImage || linkedCard.image})`
      } : undefined
    }, /*#__PURE__*/React.createElement("span", null, "\u753B\u9762\u951A\u70B9"), /*#__PURE__*/React.createElement("strong", null, activeLine.anchor), /*#__PURE__*/React.createElement("p", null, activeLine.cue)) : null, lineLinking ? /*#__PURE__*/React.createElement("div", {
      className: "cn-line-link-cue"
    }, /*#__PURE__*/React.createElement("span", null, "\u4E0A\u4E00\u53E5"), /*#__PURE__*/React.createElement("strong", null, passage.lines[activeLineIndex - 1]?.text), /*#__PURE__*/React.createElement("b", null, "\u63A5\u51FA\u7B2C ", activeLineIndex + 1, " ", trainingUnitLabel)) : hintLevel >= 4 ? /*#__PURE__*/React.createElement("div", {
      className: `cn-original-peek ${peekOriginal ? 'is-revealed' : ''}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-recall-cue hint-4",
      "aria-hidden": !peekOriginal
    }, recitationCue(activeLine, hintLevel)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onPointerDown: () => setPeekOriginal(true),
      onPointerUp: () => setPeekOriginal(false),
      onPointerCancel: () => setPeekOriginal(false),
      onPointerLeave: () => setPeekOriginal(false),
      onKeyDown: event => {
        if (event.key === ' ' || event.key === 'Enter') setPeekOriginal(true);
      },
      onKeyUp: () => setPeekOriginal(false)
    }, "\u6309\u4F4F\u67E5\u770B\u539F\u6587")) : /*#__PURE__*/React.createElement("div", {
      className: `cn-recall-cue hint-${hintLevel}`
    }, recitationCue(activeLine, hintLevel)), feedback ? /*#__PURE__*/React.createElement("div", {
      className: "cn-recall-feedback"
    }, "\u672C\u6B21\uFF1A", feedback) : null), /*#__PURE__*/React.createElement("div", {
      className: "cn-self-check",
      "aria-label": "\u80CC\u8BF5\u81EA\u67E5"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-smooth",
      onClick: () => updateLine('smooth')
    }, "\u987A\u5229\u80CC\u51FA"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => updateLine('hesitate')
    }, "\u6709\u4E9B\u5361\u987F"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => updateLine('hint')
    }, mode === 'fade' ? '本轮卡住' : '需要提示'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-forgot",
      onClick: () => updateLine('forgot')
    }, mode === 'fade' ? '本轮未背出' : '没有背出')), compact || portrait ? /*#__PURE__*/React.createElement("div", {
      className: "cn-recitation-controls cn-controls-inline"
    }, /*#__PURE__*/React.createElement(RecitationControlPanel, {
      mode: mode,
      hintLevel: hintLevel,
      canSpeak: peekOriginal,
      onSpeak: speakActiveLine,
      onCourseware: openLinkedCourseware,
      coursewareReady: coursewareUnlocked,
      activeStat: activeStat
    })) : null)), !compact && !portrait && regularTraining ? /*#__PURE__*/React.createElement("aside", {
      className: "cn-recitation-controls no-scrollbar min-h-0 overflow-y-auto"
    }, /*#__PURE__*/React.createElement(RecitationControlPanel, {
      mode: mode,
      hintLevel: hintLevel,
      canSpeak: peekOriginal,
      onSpeak: speakActiveLine,
      onCourseware: openLinkedCourseware,
      coursewareReady: coursewareUnlocked,
      activeStat: activeStat
    })) : null));
  }
  function RecitationEntry({
    onOpen,
    frame,
    dueCount
  }) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: `cn-recitation-entry ${frame.isPortrait ? 'is-portrait' : ''}`,
      onClick: onOpen,
      "aria-label": "\u6253\u5F00\u80CC\u8BF5\u8BAD\u7EC3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "cn-recitation-seal"
    }, "\u80CC"), /*#__PURE__*/React.createElement("span", {
      className: "cn-recitation-entry-label"
    }, "\u80CC\u8BF5\u8BAD\u7EC3"), dueCount > 0 ? /*#__PURE__*/React.createElement("span", {
      className: "cn-recitation-due"
    }, dueCount) : null);
  }
  Object.assign(app, {
    RecitationWorkspace,
    RecitationEntry
  });
})();

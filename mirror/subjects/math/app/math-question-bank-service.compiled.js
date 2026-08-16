/*
  Math question-bank data service.
*/

window.MathApp = window.MathApp || {};
(() => {
  const app = window.MathApp;
  const QUESTION_BANK_BASE = 'question-bank';
  const STAGE_INDEX = {
    junior: `${QUESTION_BANK_BASE}/junior/index.json`,
    senior: `${QUESTION_BANK_BASE}/senior/index.json`
  };
  const stageBankCache = new Map();
  const stageBankInFlight = new Map();
  const normalizeText = value => String(value || '').trim();
  const normalizeArray = value => Array.isArray(value) ? value.map(normalizeText).filter(Boolean) : [];
  const normalizeQuestionDifficulty = value => normalizeText(value) || '基础';
  function uniqueValues(values) {
    return [...new Set(values.map(normalizeText).filter(Boolean))];
  }
  async function fetchQuestionBankJson(path) {
    if (typeof app.fetchJsonSafe === 'function') {
      const payload = await app.fetchJsonSafe(path);
      if (payload) return payload;
    }
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
  }
  async function loadStageQuestionBank(stageId) {
    const normalizedStage = normalizeText(stageId) || 'junior';
    if (stageBankCache.has(normalizedStage)) return stageBankCache.get(normalizedStage);
    if (stageBankInFlight.has(normalizedStage)) return stageBankInFlight.get(normalizedStage);
    const request = loadStageQuestionBankFresh(normalizedStage).then(payload => {
      stageBankCache.set(normalizedStage, payload);
      stageBankInFlight.delete(normalizedStage);
      return payload;
    }).catch(error => {
      stageBankInFlight.delete(normalizedStage);
      throw error;
    });
    stageBankInFlight.set(normalizedStage, request);
    return request;
  }
  async function loadStageQuestionBankFresh(normalizedStage) {
    const indexPath = STAGE_INDEX[normalizedStage];
    if (!indexPath) {
      return {
        stageId: normalizedStage,
        label: '题库',
        questions: [],
        filters: createEmptyFilters()
      };
    }
    const index = await fetchQuestionBankJson(indexPath);
    const shardBase = indexPath.replace(/index\.json$/, '');
    const shardPayloads = await loadQuestionBankShards(index?.shards || [], shardBase);
    const questions = shardPayloads.flatMap(payload => payload?.questions || []).map(normalizeQuestion);
    return {
      schemaVersion: index?.schemaVersion || '1.0.0',
      stageId: normalizedStage,
      label: index?.label || '数学题库',
      questions,
      filters: buildFilterModel(questions)
    };
  }
  async function loadQuestionBankShards(shards, shardBase) {
    const payloads = [];
    for (const shard of shards || []) {
      payloads.push(await fetchQuestionBankJson(`${shardBase}${shard.file}`));
    }
    return payloads;
  }
  function normalizeQuestion(question) {
    return {
      ...question,
      id: normalizeText(question.id),
      stageId: normalizeText(question.stageId),
      grade: normalizeText(question.grade),
      bookId: normalizeText(question.bookId),
      chapterIds: normalizeArray(question.chapterIds),
      knowledgePoints: normalizeArray(question.knowledgePoints),
      type: normalizeText(question.type),
      difficulty: normalizeQuestionDifficulty(question.difficulty),
      stem: normalizeMathDisplayText(question.stem),
      options: Array.isArray(question.options) ? question.options.map(normalizeQuestionOption).filter(option => option.label && option.text) : [],
      steps: Array.isArray(question.steps) ? question.steps.map(normalizeQuestionStep).filter(step => step.id) : [],
      answer: normalizeMathDisplayText(question.answer),
      analysis: normalizeMathDisplayText(question.analysis),
      matchedCards: Array.isArray(question.matchedCards) ? question.matchedCards.map(normalizeMatchedCard).filter(item => item.cardId) : [],
      source: normalizeQuestionSource(question.source),
      learningStage: normalizeText(question.learningStage),
      gradeFit: normalizeArray(question.gradeFit),
      lineage: question.lineage && typeof question.lineage === 'object' ? question.lineage : null,
      reviewStatus: normalizeText(question.reviewStatus),
      answerVerified: question.answerVerified === true,
      analysisVerified: question.analysisVerified === true,
      status: normalizeText(question.status) || 'needs_review'
    };
  }
  function normalizeQuestionStep(step) {
    return {
      id: normalizeText(step.id),
      prompt: normalizeMathDisplayText(step.prompt),
      options: Array.isArray(step.options) ? step.options.map(normalizeQuestionOption).filter(option => option.label && option.text) : [],
      answer: normalizeMathDisplayText(step.answer)
    };
  }
  function normalizeQuestionOption(option) {
    return {
      label: normalizeText(option.label),
      text: normalizeMathDisplayText(option.text)
    };
  }
  function normalizeMatchedCard(card) {
    return {
      cardId: normalizeText(card.cardId),
      role: normalizeText(card.role) || 'related',
      reason: normalizeMathDisplayText(card.reason),
      stepLabel: normalizeMathDisplayText(card.stepLabel)
    };
  }
  function normalizeMathDisplayText(value) {
    let text = normalizeText(value);
    if (!text) return '';
    text = text.replace(/\\\\/g, '\\').replace(/[（(]\s*(?:["'“”‘’`]+\s*)+[）)]/g, '（ ）').replace(/``([^']*?)''/g, '“$1”').replace(/`{2}/g, '“').replace(/'{2}/g, '”').replace(/\\left\s*/g, '').replace(/\\right\s*/g, '').replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)').replace(/\bfrac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)').replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)').replace(/\bsqrt\s*\{([^{}]+)\}/g, '√($1)').replace(/\\overset\s*\{\s*\\?frown\s*\}\s*\{\s*([^{}]+)\s*\}/g, '⌒$1').replace(/\boverset\s*\{\s*frown\s*\}\s*\{\s*([^{}]+)\s*\}/g, '⌒$1').replace(/\\widehat\s*\{\s*([^{}]+)\s*\}/g, '⌒$1').replace(/\\overline\s*\{\s*([^{}]+)\s*\}/g, '$1').replace(/\\angle\s*/g, '∠').replace(/\bangle\s+([A-Z]{2,4})/g, '∠$1').replace(/\\triangle\s*/g, '△').replace(/\btriangle\s+([A-Z]{3,4})/g, '△$1').replace(/\\(?:cdot|times)\b/g, '×').replace(/\\(?:cap|bigcap)\b/g, '∩').replace(/\\(?:cup|bigcup)\b/g, '∪').replace(/\\(?:parallel|par)\b/g, '∥').replace(/\\perp\b/g, '⊥').replace(/\\leq\b/g, '≤').replace(/\\leqslant\b/g, '≤').replace(/\\geq\b/g, '≥').replace(/\\geqslant\b/g, '≥').replace(/\\neq\b/g, '≠').replace(/\\pi\b/g, 'π').replace(/\\infty\b/g, '∞').replace(/([≤≥])\s*slant\s*/gi, '$1').replace(/\^\s*°/g, '°').replace(/\^\s*degrees\b/gi, '°').replace(/(\d)\s*degrees\b/gi, '$1°').replace(/([A-Z])\^\s*(?=[\u4e00-\u9fff,，。.;；:：)]|$)/g, '$1′ ').replace(/[（(]\s*(?:["'“”‘’`]+\s*)+[）)]/g, '（ ）').replace(/[（(]\s*(?:~\s*)+[）)]/g, '（ ）').replace(/~?\s*_{2,}\s*~?/g, '（ ）').replace(/\s*(?:~\s*){2,}(?=\s*[\u4e00-\u9fffA-Za-z0-9])/g, '（ ）').replace(/\s*(?:~\s*){2,}/g, '').replace(/~/g, '').replace(/([A-Za-zΑ-Ωα-ω])_\s*_+\s*([A-Za-z0-9Α-Ωα-ω{}()+-]+)/g, '$1_$2').replace(/_\s*(甲|乙|丙|丁|极小值|极大值|最小值|最大值|球)(?=[\s=,，。.;；:：)]|$)/g, '_{$1}').replace(/\^\s*\^/g, '').replace(/_\s*_+/g, '_').replace(/\^\s*(?=[，。,.;；:：]|$)/g, '').replace(/_\s*(?=[=，。,.;；:：]|$)/g, '').replace(/_\s*(?=[\u4e00-\u9fff])/g, ' ').replace(/([A-Za-zΑ-Ωα-ω])\s+_+\s*([A-Za-z0-9Α-Ωα-ω{}()+-]+)/g, '$1_$2').replace(/([A-Za-zΑ-Ωα-ω0-9)\]}])\s+\^\s*([A-Za-z0-9Α-Ωα-ω{}()+-]+)/g, '$1^$2').replace(/\^\s+/g, '^').replace(/_\s+/g, '_').replace(/\s*([∩∪])\s*/g, '$1').replace(/·s\s*·s/g, '……').replace(/·s/g, '…').replace(/~{2,}/g, '').replace(/[（(]\s*~\s*[）)]/g, '（ ）').replace(/相\s+同/g, '相同').replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, '$1$2').replace(/\s+([,，。.;；:：])/g, '$1').replace(/([（(])\s+/g, '$1').replace(/\s+([）)])/g, '$1').replace(/[（(]\s*[）)]/g, '（ ）').replace(/\s+（\s*）/g, '（ ）').replace(/\s{2,}/g, ' ').trim();
    return text;
  }
  function normalizeQuestionSource(source) {
    const value = source && typeof source === 'object' ? source : {};
    return {
      ...value,
      name: normalizeText(value.name),
      license: normalizeText(value.license),
      type: normalizeText(value.type),
      origin: normalizeText(value.origin),
      url: normalizeText(value.url)
    };
  }
  function createEmptyFilters() {
    return {
      grades: [],
      knowledgePoints: [],
      types: [],
      difficulties: [],
      sourceTypes: [],
      learningStages: []
    };
  }
  function buildFilterModel(questions) {
    return {
      grades: uniqueValues(questions.map(item => item.grade)),
      knowledgePoints: uniqueValues(questions.flatMap(item => item.knowledgePoints)),
      types: uniqueValues(questions.map(item => item.type)),
      difficulties: uniqueValues(questions.map(item => item.difficulty)),
      sourceTypes: uniqueValues(questions.map(item => getQuestionSourceTypeLabel(item))),
      learningStages: uniqueValues(questions.map(item => getLearningStageLabel(item.learningStage)))
    };
  }
  function filterQuestions(questions, filters = {}) {
    const grade = normalizeText(filters.grade);
    const knowledgePoints = normalizeFilterValues(filters.knowledgePoint || filters.knowledgePoints);
    const type = normalizeText(filters.type);
    const difficulty = normalizeText(filters.difficulty);
    const sourceType = normalizeText(filters.sourceType);
    const learningStage = normalizeText(filters.learningStage);
    const requireCards = Boolean(filters.requireCards);
    return (questions || []).filter(question => {
      if (question.status !== 'ready') return false;
      if (grade && question.grade !== grade) return false;
      if (knowledgePoints.length && !knowledgePoints.some(point => question.knowledgePoints.includes(point))) return false;
      if (type && question.type !== type) return false;
      if (difficulty && question.difficulty !== difficulty) return false;
      if (sourceType && getQuestionSourceTypeLabel(question) !== sourceType) return false;
      if (learningStage && getLearningStageLabel(question.learningStage) !== learningStage) return false;
      if (requireCards && !question.matchedCards.length) return false;
      return true;
    });
  }
  function normalizeFilterValues(value) {
    if (Array.isArray(value)) return uniqueValues(value);
    const text = normalizeText(value);
    return text ? [text] : [];
  }
  function getSourceTypeLabel(value) {
    const labels = {
      exam_real: '中考真题',
      exam_decomposed: '真题拆解',
      exam_adapted: '真题改编',
      open_dataset: '开源题库',
      school_exam: '校内/模拟',
      card_training: '可视化专项'
    };
    return labels[normalizeText(value)] || normalizeText(value);
  }
  function getQuestionSourceTypeLabel(question) {
    const sourceType = normalizeText(question?.source?.type);
    if (sourceType === 'exam_real') {
      return normalizeText(question?.stageId) === 'senior' || /高考|GAOKAO/i.test(`${question?.source?.name || ''} ${question?.source?.origin || ''} ${question?.source?.paper || ''}`) ? '高考真题' : '中考真题';
    }
    return getSourceTypeLabel(sourceType);
  }
  function getQuestionSourceName(source) {
    const value = source && typeof source === 'object' ? source : {};
    return normalizeText(value.name) || normalizeText(value.origin) || getSourceTypeLabel(value.type) || '未标题源';
  }
  function getLearningStageLabel(value) {
    const labels = {
      sync_basic: '同步基础',
      topic_boost: '专题提升',
      exam_decomposed: '真题拆解',
      exam_real: '中考真题',
      challenge: '压轴挑战'
    };
    return labels[normalizeText(value)] || normalizeText(value);
  }
  function getQuestion(questions, questionId) {
    const targetId = normalizeText(questionId);
    return (questions || []).find(question => question.id === targetId) || null;
  }
  function getMatchedCards(question, cardMap, sceneEntryMap) {
    if (!question) return [];
    return question.matchedCards.map(match => {
      const card = cardMap?.get ? cardMap.get(match.cardId) : null;
      const sceneEntry = sceneEntryMap?.get ? sceneEntryMap.get(match.cardId) : null;
      const hasCourseware = Boolean(sceneEntry?.folder);
      const availabilityReason = !card ? 'not_mapped' : card.isLocked ? 'locked' : !hasCourseware ? 'not_integrated' : '';
      return {
        ...match,
        card,
        title: card?.title || match.cardId,
        detail: card?.detail || match.reason,
        hasCourseware,
        availabilityReason,
        available: Boolean(card && !card.isLocked && hasCourseware)
      };
    });
  }
  function createPracticeSet(questions, questionIds) {
    const ids = new Set((questionIds || []).map(normalizeText).filter(Boolean));
    return (questions || []).filter(question => ids.has(question.id));
  }
  function shuffleBrowseQuestions(questions, seed = '') {
    return (questions || []).map((question, index) => ({
      question,
      key: deterministicDrawKey(question.id, index, seed || 'browse')
    })).sort((left, right) => left.key.localeCompare(right.key)).map(item => item.question);
  }
  function drawQuestions(questions, options = {}) {
    const limit = Math.max(1, Number(options.count || 5));
    const filtered = filterQuestions(questions, options);
    const candidates = filtered.map((question, index) => ({
      question,
      key: deterministicDrawKey(question.id, index, options.seed || '')
    })).sort((left, right) => left.key.localeCompare(right.key));
    return selectDiverseQuestions(candidates, limit, options).map(item => item.question);
  }
  function drawPracticeQuestions(questions, options = {}) {
    return drawQuestions(questions, {
      ...options,
      count: Math.max(1, Number(options.count || 10)),
      preferCards: options.preferCards !== false
    });
  }
  function normalizeUserAnswer(value) {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        return normalizeChoiceLabels(value);
      }
      return Object.fromEntries(Object.entries(value).map(([key, nextValue]) => [normalizeText(key), normalizeText(nextValue).replace(/\s+/g, ' ').toUpperCase()]).filter(([key, nextValue]) => key && nextValue));
    }
    return normalizeText(value).replace(/\s+/g, ' ').toUpperCase();
  }
  function normalizeChoiceLabels(value) {
    const labels = Array.isArray(value) ? value : normalizeText(value).split(/[、,，;；\s]+/);
    return [...new Set(labels.map(item => normalizeText(item).toUpperCase()).filter(Boolean))].sort();
  }
  function formatChoiceLabels(labels) {
    return normalizeChoiceLabels(labels).join('、');
  }
  function isStepChoiceQuestion(question) {
    return normalizeText(question?.type) === '分步选择题' && Array.isArray(question?.steps) && question.steps.length > 0;
  }
  function isMultiChoiceQuestion(question) {
    return normalizeText(question?.type) === '多选题';
  }
  function formatStepAnswerSummary(steps, answersByStep) {
    return (steps || []).map((step, index) => {
      const answer = answersByStep?.[step.id] || '';
      return `${index + 1}.${answer || '未答'}`;
    }).join('；');
  }
  function buildStepResults(question, rawAnswer) {
    const answersByStep = normalizeUserAnswer(rawAnswer);
    const normalizedAnswers = answersByStep && typeof answersByStep === 'object' ? answersByStep : {};
    return (question.steps || []).map((step, index) => {
      const answer = normalizedAnswers[step.id] || '';
      const correctAnswer = normalizeUserAnswer(step.answer);
      return {
        index: index + 1,
        id: step.id,
        prompt: step.prompt,
        options: step.options,
        answer,
        correctAnswer,
        status: answer ? answer === correctAnswer ? 'correct' : 'wrong' : 'unanswered'
      };
    });
  }
  function isQuestionAnswered(question, rawAnswer) {
    if (isStepChoiceQuestion(question)) {
      const answersByStep = normalizeUserAnswer(rawAnswer);
      const normalizedAnswers = answersByStep && typeof answersByStep === 'object' ? answersByStep : {};
      return question.steps.every(step => Boolean(normalizedAnswers[step.id]));
    }
    if (isMultiChoiceQuestion(question)) {
      return normalizeChoiceLabels(rawAnswer).length > 0;
    }
    return Boolean(normalizeUserAnswer(rawAnswer));
  }
  function gradeQuestionAnswer(question, rawAnswer) {
    if (isStepChoiceQuestion(question)) {
      const stepResults = buildStepResults(question, rawAnswer);
      if (!stepResults.some(step => step.status !== 'unanswered')) return 'unanswered';
      return stepResults.every(step => step.status === 'correct') ? 'correct' : 'wrong';
    }
    if (isMultiChoiceQuestion(question)) {
      const userAnswer = normalizeChoiceLabels(rawAnswer);
      if (!userAnswer.length) return 'unanswered';
      const correctAnswer = normalizeChoiceLabels(question?.answer);
      return userAnswer.length === correctAnswer.length && userAnswer.every((label, index) => label === correctAnswer[index]) ? 'correct' : 'wrong';
    }
    const userAnswer = normalizeUserAnswer(rawAnswer);
    if (!userAnswer) return 'unanswered';
    const correctAnswer = normalizeUserAnswer(question?.answer);
    return userAnswer === correctAnswer ? 'correct' : 'wrong';
  }
  function buildPracticeReport({
    questions = [],
    answers = {}
  } = {}) {
    const items = questions.map((question, index) => {
      const rawAnswer = answers[question.id] || '';
      const status = gradeQuestionAnswer(question, rawAnswer);
      const stepResults = isStepChoiceQuestion(question) ? buildStepResults(question, rawAnswer) : [];
      const normalizedAnswer = normalizeUserAnswer(rawAnswer);
      return {
        index: index + 1,
        question,
        answer: stepResults.length ? formatStepAnswerSummary(question.steps, normalizedAnswer) : isMultiChoiceQuestion(question) ? formatChoiceLabels(rawAnswer) : normalizeText(rawAnswer),
        correctAnswer: question.answer,
        stepResults,
        status
      };
    });
    const total = items.length;
    const answered = items.filter(item => item.status !== 'unanswered').length;
    const correct = items.filter(item => item.status === 'correct').length;
    const wrong = items.filter(item => item.status === 'wrong').length;
    const unanswered = total - answered;
    const accuracy = total ? Math.round(correct / total * 100) : 0;
    return {
      total,
      answered,
      correct,
      wrong,
      unanswered,
      accuracy,
      items
    };
  }
  function selectDiverseQuestions(candidates, limit, options = {}) {
    const remaining = [...candidates];
    const selected = [];
    while (remaining.length && selected.length < limit) {
      let bestIndex = 0;
      let bestScore = -Infinity;
      for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index];
        const score = scoreQuestionDiversity(candidate, selected.map(item => item.question), options);
        if (score > bestScore || score === bestScore && candidate.key.localeCompare(remaining[bestIndex].key) < 0) {
          bestIndex = index;
          bestScore = score;
        }
      }
      selected.push(remaining.splice(bestIndex, 1)[0]);
    }
    return selected;
  }
  function scoreQuestionDiversity(candidate, selectedQuestions, options = {}) {
    const question = candidate.question;
    let score = deterministicScoreComponent(candidate.key);
    if (options.preferCards !== false) {
      score += Math.min(question.matchedCards.length, 4) * 3;
    }
    if (!selectedQuestions.length) return score;
    const selectedKnowledgeCounts = countSelectedValues(selectedQuestions, item => item.knowledgePoints);
    const selectedCardCounts = countSelectedValues(selectedQuestions, item => item.matchedCards.map(card => card.cardId));
    const selectedTypeCounts = countSelectedValues(selectedQuestions, item => [item.type]);
    const selectedDifficultyCounts = countSelectedValues(selectedQuestions, item => [item.difficulty]);
    for (const point of question.knowledgePoints) {
      const currentCount = selectedKnowledgeCounts.get(point) || 0;
      score += currentCount ? -10 * currentCount : 12;
    }
    for (const cardId of question.matchedCards.map(card => card.cardId)) {
      const currentCount = selectedCardCounts.get(cardId) || 0;
      score += currentCount ? -12 * currentCount : 14;
    }
    score -= (selectedTypeCounts.get(question.type) || 0) * 3;
    score -= (selectedDifficultyCounts.get(question.difficulty) || 0) * 1.5;
    return score;
  }
  function countSelectedValues(questions, getValues) {
    const counts = new Map();
    for (const question of questions) {
      for (const value of getValues(question).map(normalizeText).filter(Boolean)) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    }
    return counts;
  }
  function deterministicScoreComponent(key) {
    const numericKey = Number(String(key || '0').slice(-6)) || 0;
    return (1000000 - numericKey) / 1000000;
  }
  function deterministicDrawKey(id, index, seed) {
    const text = `${seed}:${id}:${index}`;
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(i) | 0;
    }
    return String(Math.abs(hash)).padStart(12, '0');
  }
  app.questionBankService = {
    loadStageQuestionBank,
    buildFilterModel,
    filterQuestions,
    getSourceTypeLabel,
    getQuestionSourceTypeLabel,
    getQuestionSourceName,
    normalizeMathDisplayText,
    getQuestion,
    getMatchedCards,
    createPracticeSet,
    shuffleBrowseQuestions,
    drawQuestions,
    drawPracticeQuestions,
    normalizeUserAnswer,
    isStepChoiceQuestion,
    isMultiChoiceQuestion,
    isQuestionAnswered,
    gradeQuestionAnswer,
    buildPracticeReport
  };
})();

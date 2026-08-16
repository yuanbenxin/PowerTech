window.ChineseApp = window.ChineseApp || {};
(() => {
  const app = window.ChineseApp;
  const STORAGE_KEY = 'shiguang-chinese-masterpiece-practice-v2';
  async function loadMasterpiecePractice(bookId) {
    if (bookId !== 'journey') throw new Error('该名著训练尚未接入。');
    return app.fetchJson('course-data/xiyouji-practice.v1.json');
  }
  function loadMasterpiecePracticeProgress() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.version === 2 && saved.questions) return saved;
    } catch (_) {
      // Training remains usable when browser storage is unavailable.
    }
    return {
      version: 2,
      questions: {}
    };
  }
  function saveMasterpiecePracticeProgress(progress) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (_) {
      // Progress is optional in restricted browser contexts.
    }
  }
  function stableHash(value) {
    return Array.from(String(value)).reduce((hash, char) => (hash << 5) - hash + char.codePointAt(0) | 0, 0) >>> 0;
  }
  function summarizeChoice(value) {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (Array.from(normalized).length <= 58) return normalized;
    const sentenceEnd = normalized.slice(0, 58).search(/[。！？；]/);
    if (sentenceEnd >= 30) return normalized.slice(0, sentenceEnd + 1);
    return `${Array.from(normalized).slice(0, 56).join('')}...`;
  }
  function buildMasterpieceChoices(question, allQuestions) {
    if (Array.isArray(question.options) && question.options.length === 4) {
      const seed = stableHash(question.id);
      return question.options.map((text, index) => ({
        id: `choice-${question.id}-${index}`,
        text,
        fullText: text,
        correct: text === question.answer
      })).map(choice => ({
        choice,
        order: stableHash(`${seed}:position:${choice.id}`)
      })).sort((left, right) => left.order - right.order).map(({
        choice
      }) => choice);
    }
    const questionKeywords = new Set(question.scoringKeywords);
    const isUsableDistractor = candidate => candidate.id !== question.id && candidate.answer !== question.answer && !candidate.scoringKeywords.some(keyword => questionKeywords.has(keyword));
    const sameType = allQuestions.filter(candidate => candidate.type === question.type && isUsableDistractor(candidate));
    const fallback = allQuestions.filter(isUsableDistractor);
    const candidates = sameType.length >= 3 ? sameType : fallback;
    const seed = stableHash(question.id);
    const distractors = candidates.map(candidate => ({
      candidate,
      order: stableHash(`${seed}:${candidate.id}`)
    })).sort((left, right) => left.order - right.order).slice(0, 3).map(({
      candidate
    }) => ({
      id: `choice-${candidate.id}`,
      text: summarizeChoice(candidate.answer),
      fullText: candidate.answer,
      correct: false
    }));
    const choices = [{
      id: `choice-${question.id}`,
      text: summarizeChoice(question.answer),
      fullText: question.answer,
      correct: true
    }, ...distractors];
    return choices.map(choice => ({
      choice,
      order: stableHash(`${seed}:position:${choice.id}`)
    })).sort((left, right) => left.order - right.order).map(({
      choice
    }) => choice);
  }
  function gradeMasterpieceChoice(choices, selectedId) {
    const selected = choices.find(choice => choice.id === selectedId);
    const correct = Boolean(selected?.correct);
    return {
      status: correct ? 'correct' : 'retry',
      ratio: correct ? 1 : 0,
      selectedId,
      correctChoice: choices.find(choice => choice.correct) || null
    };
  }
  function flattenPracticeQuestions(payload) {
    return (payload?.cards || []).filter(card => card.visualReviewStatus === 'verified').flatMap(card => card.questions.map(question => ({
      ...question,
      card
    })));
  }
  function pickPracticeQuestions(payload, progress, count, mode = 'smart') {
    const all = flattenPracticeQuestions(payload);
    const records = progress?.questions || {};
    const now = Date.now();
    const pools = {
      fresh: all.filter(item => !records[item.id]),
      weak: all.filter(item => records[item.id] && (records[item.id].status !== 'correct' || records[item.id].mastery < 80)),
      review: all.filter(item => records[item.id]?.status === 'correct')
    };
    const selected = [];
    const pickFrom = preferred => {
      const candidates = preferred.filter(item => !selected.some(chosen => chosen.id === item.id) && !selected.slice(-1).some(chosen => chosen.card.id === item.card.id));
      const fallback = preferred.filter(item => !selected.some(chosen => chosen.id === item.id));
      const candidatePool = candidates.length ? candidates : fallback;
      if (!candidatePool.length) return null;
      return candidatePool.map(item => {
        const record = records[item.id];
        const recencyPenalty = record?.lastAnsweredAt ? Math.min(0.8, (now - record.lastAnsweredAt) / (1000 * 60 * 60 * 24 * 7)) : 1;
        const weaknessBoost = record && record.status !== 'correct' ? 2 : 1;
        return {
          item,
          score: Math.random() * Math.max(0.15, recencyPenalty) * weaknessBoost * (item.card.importance || 1)
        };
      }).sort((left, right) => right.score - left.score)[0].item;
    };
    for (let index = 0; index < count && selected.length < all.length; index += 1) {
      let preferred;
      if (mode === 'review') preferred = pools.weak.length ? pools.weak : pools.review;else if (index % 5 === 0) preferred = pools.review.length ? pools.review : pools.fresh;else if (index % 3 === 0) preferred = pools.weak.length ? pools.weak : pools.fresh;else preferred = pools.fresh.length ? pools.fresh : pools.weak.length ? pools.weak : pools.review;
      const next = pickFrom(preferred) || pickFrom(all);
      if (!next) break;
      selected.push(next);
    }
    return selected;
  }
  function updateMasterpieceProgress(progress, question, result) {
    const previous = progress?.questions?.[question.id] || {
      attempts: 0,
      correct: 0,
      mastery: 0
    };
    const attempts = previous.attempts + 1;
    const correct = previous.correct + (result.status === 'correct' ? 1 : 0);
    const mastery = Math.round(Math.min(100, Math.max(0, correct / attempts * 75 + result.ratio * 25)));
    const next = {
      version: 2,
      questions: {
        ...(progress?.questions || {}),
        [question.id]: {
          attempts,
          correct,
          mastery,
          status: result.status,
          lastAnsweredAt: Date.now()
        }
      }
    };
    saveMasterpiecePracticeProgress(next);
    return next;
  }
  Object.assign(app, {
    loadMasterpiecePractice,
    loadMasterpiecePracticeProgress,
    buildMasterpieceChoices,
    gradeMasterpieceChoice,
    pickPracticeQuestions,
    updateMasterpieceProgress
  });
})();

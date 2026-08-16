/**
 * 《天净沙·秋思》逻辑优化版。
 * 视觉外壳由现有 index.html / styles.css?v=9cb4c4199267 提供，本文件只负责教学状态与交互。
 */
(() => {
  "use strict";

  const STATE_VERSION = 3;
  const STORAGE_KEY = "qiusi-learning-state-v3";
  const SAVE_DELAY = 180;
  const byId = (id) => document.getElementById(id);
  const deepCopy = (value) => JSON.parse(JSON.stringify(value));

  const dom = {
    video: byId("poetry-video"),
    videoSlot: document.querySelector(".video-slot"),
    videoFrame: document.querySelector(".video-container-lux"),
    sceneHotspots: byId("scene-hotspots"),
    videoBadge: byId("video-state-badge"),
    btnPlayPause: byId("btn-play-pause"),
    btnReplay: byId("btn-replay"),
    playIcon: byId("play-icon"),
    pauseIcon: byId("pause-icon"),
    progressTrack: byId("progress-track"),
    progressFill: byId("progress-fill"),
    timeCurrent: byId("time-current"),
    timeTotal: byId("time-total"),
    btnVolumeToggle: byId("btn-volume-toggle"),
    iconVolumeOn: byId("icon-volume-on"),
    iconVolumeOff: byId("icon-volume-off"),
    volumeSlider: byId("volume-slider"),
    speedButtons: [...document.querySelectorAll(".speed-btn-pill")],
    modeOriginal: null,
    modeTranslation: null,
    audioTipText: null,
    headerStatus: byId("header-status-text"),
    poetryTitle: byId("poetry-title"),
    poetryMeta: byId("poetry-meta-info"),
    versesList: byId("verses-list"),
    vocabPopup: byId("vocab-popup"),
    popupCloseBtn: byId("popup-close-btn"),
    popupWordTitle: byId("popup-word-title"),
    popupWordPinyin: byId("popup-word-pinyin"),
    popupWordMeaning: byId("popup-word-meaning"),
    popupWordEvidence: byId("popup-word-zhongkao"),
    tabButtons: [...document.querySelectorAll(".panel-tab-btn")],
    tabContents: [...document.querySelectorAll(".tab-content")],
    resumeBanner: byId("resume-banner"),
    btnResumeProgress: byId("btn-resume-progress"),
    poetryIntroText: byId("poetry-intro-text-drawer"),
    btnOpenSyllabus: byId("btn-open-syllabus"),
    btnCloseSyllabus: byId("btn-close-syllabus"),
    syllabusDrawerOverlay: byId("syllabus-drawer-overlay"),
    syllabusDrawer: byId("syllabus-drawer"),
    chapterListDrawer: byId("chapter-list-drawer"),
    tpEmptyState: byId("testpoint-empty-state"),
    tpActiveCard: byId("testpoint-active-card"),
    testModulesModal: byId("test-modules-modal"),
    btnCloseTestModal: byId("btn-close-test-modal"),
    tpTitle: byId("tp-title"),
    tpVerse: byId("tp-verse"),
    tpQuestion: byId("tp-question"),
    tpNavigation: byId("tp-navigation"),
    tpTemplate: byId("tp-template"),
    btnTpContinue: byId("btn-tp-continue"),
    quizActiveCard: byId("quiz-active-card"),
    quizScoreCard: byId("quiz-score-card"),
    quizProgressText: byId("quiz-progress-text"),
    quizQuestion: byId("quiz-question"),
    quizOptionsList: byId("quiz-options-list"),
    quizExplanation: byId("quiz-explanation"),
    quizExplanationText: byId("quiz-explanation-text"),
    btnQuizJumpBack: byId("btn-quiz-jump-back"),
    btnQuizPrev: byId("btn-quiz-prev"),
    btnQuizNext: byId("btn-quiz-next"),
    scoreNumber: byId("score-number"),
    scoreMessage: byId("score-message"),
    scoreSubmessage: byId("score-submessage"),
    btnQuizRetry: byId("btn-quiz-retry"),
    btnQuizClue: byId("btn-quiz-clue"),
    quizClueBox: byId("quiz-clue-box"),
    quizClueText: byId("quiz-clue-text"),
    quizSubjectiveBox: byId("quiz-subjective-box"),
    quizSubjectiveInput: byId("quiz-subjective-input"),
    btnSubmitSubjective: byId("btn-submit-subjective"),
    btnSkipSubjective: byId("btn-skip-subjective"),
    quizGradingBox: byId("quiz-grading-box"),
    quizGradingChecklist: byId("quiz-grading-checklist"),
    btnFinishGrading: byId("btn-finish-grading"),
    btnModeRead: byId("btn-mode-read"),
    btnModeEvidence: byId("btn-mode-evidence"),
    btnModeDictate: byId("btn-mode-dictate"),
    readModeView: byId("read-mode-view"),
    evidenceModeView: byId("evidence-mode-view"),
    evidenceBank: byId("evidence-bank"),
    evidenceGroups: byId("evidence-groups"),
    evidenceProgress: byId("evidence-progress"),
    evidenceFeedback: byId("evidence-feedback"),
    evidenceConclusion: byId("evidence-conclusion"),
    btnEvidenceCheck: byId("btn-evidence-check"),
    btnEvidenceReset: byId("btn-evidence-reset"),
    dictateModeView: byId("dictate-mode-view"),
    dictateProgress: byId("dictate-progress"),
    btnDictateClue: byId("btn-dictate-clue"),
    dictateQuestionText: byId("dictate-question-text"),
    dictateInput: byId("dictate-input"),
    dictateDiffResult: byId("dictate-diff-result"),
    dictateExplanationBox: byId("dictate-explanation-box"),
    btnDictateSubmit: byId("btn-dictate-submit"),
    btnDictateNext: byId("btn-dictate-next"),
    btnToggleMindmap: byId("btn-toggle-mindmap"),
    mindmapContent: byId("mindmap-content"),
    mindmapArrow: byId("mindmap-arrow"),
    mistakesEmptyState: byId("mistakes-empty-state"),
    mistakesList: byId("mistakes-list"),
    skillBars: byId("skill-bars"),
    outcomeSteps: [...document.querySelectorAll(".lesson-outcome-step")],
    outcomeStates: [...document.querySelectorAll("[data-outcome-state]")],
    btnPlayModeInteractive: byId("btn-playmode-interactive"),
    btnPlayModeGuided: byId("btn-playmode-guided"),
    btnPlayModeContinuous: byId("btn-playmode-continuous"),
    learningModalOverlay: byId("learning-modal-overlay"),
    learningModalTitle: byId("learning-modal-title"),
    learningModalContent: byId("learning-modal-content"),
    btnLearningNarration: byId("btn-learning-narration"),
    learningNarration: byId("learning-modal-narration"),
    learningNarrationLabel: byId("learning-narration-label"),
    learningNarrationStatus: byId("learning-narration-status"),
    learningModalQuiz: byId("learning-modal-quiz"),
    btnLearningContinue: byId("btn-learning-continue")
  };

  const requiredDom = [
    "video", "videoBadge", "btnPlayPause", "progressTrack", "versesList",
    "tpActiveCard", "quizActiveCard", "dictateInput", "mistakesList", "skillBars",
    "evidenceModeView", "evidenceBank", "evidenceGroups"
  ];
  const missingDom = requiredDom.filter((key) => !dom[key]);
  if (missingDom.length) {
    console.error("页面缺少必要节点：", missingDom);
    return;
  }

  const allWords = POETRY_DATA.verses.flatMap((verse) =>
    verse.words.map((word) => ({ ...word, verseId: verse.id, verseStart: verse.start }))
  );
  const wordById = new Map(allWords.map((word) => [word.id, word]));
  const wordByText = new Map(allWords.map((word) => [word.word, word]));
  const runtimeTriggeredPoints = new Set();
  const runtimeTriggeredCheckpoints = new Set();
  let saveTimer = null;
  let isTtsSpeaking = false;
  let popupResumeAfterClose = false;
  let learningNarrationState = "idle";
  let learningNarrationUtterance = null;
  let learningNarrationError = "";
  let learningNarrationAudio = null;
  let learningNarrationSource = "";
  let learningNarrationPauseRequested = false;
  let autoNarrationCheckpointId = "";
  let autoNarrationShouldResume = false;
  let autoNarrationCloseTimer = null;
  let quizAutoAdvanceTimer = null;

  function normalizePlayMode(mode) {
    if (mode === "learning") return "interactive";
    if (mode === "guided" || mode === "continuous" || mode === "interactive") return mode;
    return "interactive";
  }

  function defaultState() {
    return {
      version: STATE_VERSION,
      activeTab: "tab-testpoint",
      readingMode: "read",
      activeVerseId: -1,
      selectedWordId: null,
      viewedWordIds: [],
      media: {
        currentTime: 0,
        duration: POETRY_DATA.media.measuredDuration,
        playbackRate: 1,
        audioMode: "original",
        playMode: "interactive",
        playModeVersion: 2,
        isPlaying: false,
        listenedToEnd: false,
        status: "点击播放开始学习",
        hasError: false
      },
      testPoints: {},
      quiz: {
        index: 0,
        locked: false,
        results: {},
        drafts: {},
        attempts: {},
        completed: false,
        retestMistakeId: null
      },
      dictation: {
        index: 0,
        draft: "",
        feedback: null,
        currentCorrect: false,
        correctIds: [],
        wrongIds: [],
        attempts: {},
        completed: false,
        retestMistakeId: null
      },
      evidence: {
        selectedItemId: null,
        assignments: {},
        incorrectIds: [],
        attempts: 0,
        completed: false
      },
      mistakes: []
    };
  }

  function loadState() {
    const base = defaultState();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || saved.version !== STATE_VERSION) return base;
      const next = {
        ...base,
        ...saved,
        viewedWordIds: Array.isArray(saved.viewedWordIds) ? [...new Set(saved.viewedWordIds)] : [],
        media: { ...base.media, ...(saved.media || {}), isPlaying: false, hasError: false },
        testPoints: saved.testPoints && typeof saved.testPoints === "object" ? saved.testPoints : {},
        quiz: { ...base.quiz, ...(saved.quiz || {}) },
        dictation: { ...base.dictation, ...(saved.dictation || {}) },
        evidence: {
          ...base.evidence,
          ...(saved.evidence || {}),
          assignments: saved.evidence?.assignments && typeof saved.evidence.assignments === "object"
            ? saved.evidence.assignments
            : {},
          incorrectIds: Array.isArray(saved.evidence?.incorrectIds) ? saved.evidence.incorrectIds : []
        },
        mistakes: Array.isArray(saved.mistakes) ? saved.mistakes : []
      };
      
      // Preserve old progress while migrating the former learning/continuous pair once.
      const savedPlayMode = saved.media?.playMode;
      next.media.playMode = saved.media?.playModeVersion === 2
        ? normalizePlayMode(savedPlayMode)
        : (savedPlayMode === "continuous" ? "guided" : normalizePlayMode(savedPlayMode));
      next.media.playModeVersion = 2;
      delete next.triggeredCheckpoints;

      next.media.status = next.media.currentTime > 1 ? "已恢复学习进度" : "点击播放开始学习";
      next.quiz.index = clampInteger(next.quiz.index, 0, POETRY_DATA.quizzes.length - 1);
      next.dictation.index = clampInteger(next.dictation.index, 0, POETRY_DATA.dictations.length - 1);
      next.mistakes = next.mistakes.filter((mistake) => {
        if (mistake.type === "dictation") return !next.dictation.correctIds.includes(mistake.questionId);
        const result = next.quiz.results[mistake.questionId];
        return !(result && result.score === result.maxScore);
      });
      return next;
    } catch (error) {
      console.warn("学习进度读取失败，已使用新进度。", error);
      return base;
    }
  }

  let state = loadState();

  function clampInteger(value, min, max) {
    const number = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : min;
    return Math.min(max, Math.max(min, number));
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, SAVE_DELAY);
  }

  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      const snapshot = deepCopy(state);
      snapshot.media.isPlaying = false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn("学习进度保存失败。", error);
    }
  }

  function validateLessonData() {
    const errors = [];
    let previousEnd = POETRY_DATA.media.contentStart;
    const ids = new Set();

    POETRY_DATA.verses.forEach((verse, index) => {
      if (Math.abs(verse.start - previousEnd) > 0.01) errors.push(`第 ${index + 1} 句时间轴不连续。`);
      if (!(verse.end > verse.start)) errors.push(`第 ${index + 1} 句时间范围无效。`);
      if (verse.end > POETRY_DATA.media.teachingEnd + 0.01) errors.push(`第 ${index + 1} 句超出教学时间。`);
      previousEnd = verse.end;
      verse.words.forEach((word) => {
        if (ids.has(word.id)) errors.push(`意象 ID 重复：${word.id}`);
        ids.add(word.id);
        if (!verse.text.includes(word.word)) errors.push(`“${word.word}”不在对应诗句中。`);
      });
    });

    if (Math.abs(previousEnd - POETRY_DATA.media.teachingEnd) > 0.01) errors.push("末句结束时间与教学结束时间不一致。");
    if (POETRY_DATA.media.teachingEnd > POETRY_DATA.media.measuredDuration) errors.push("教学时间超出媒体时长。");
    if (allWords.length < 9) errors.push("核心意象数据不足九项。");
    POETRY_DATA.quizzes.filter((q) => q.type === "subjective").forEach((q) => {
      const rubricTotal = q.scorePoints.reduce((sum, item) => sum + item.score, 0);
      if (rubricTotal !== q.maxScore) errors.push(`第 ${q.id} 题量规分值不等于满分。`);
    });
    return errors;
  }

  function initialize() {
    const errors = validateLessonData();
    if (errors.length) {
      console.error("课程数据校验未通过：", errors);
      state.media.status = "课程数据需要检查";
    }

    applyAccurateMetadata();
    configureAccessibility();
    renderVerses();
    renderChapterList();
    renderSceneHotspots();
    bindEvents();
    setPlayMode(state.media.playMode);
    setReadingMode(state.readingMode || "read", { focus: false, save: false });
    renderMindmapData(state.selectedWordId);
    renderAll();

    if (dom.video.readyState >= 1) handleLoadedMetadata();
    checkSavedProgress();
    installVideoFrameSizer();

    Object.defineProperty(window, "QIUSI_LOGIC", {
      configurable: true,
      value: Object.freeze({
        getState: () => deepCopy(state),
        validate: () => [...validateLessonData()],
        version: STATE_VERSION
      })
    });
  }

  function applyAccurateMetadata() {
    const textbook = POETRY_DATA.textbook;
    dom.headerStatus.textContent = `${textbook.grade} · ${POETRY_DATA.genre}`;
    dom.poetryTitle.textContent = POETRY_DATA.title;
    dom.poetryMeta.textContent = `〔${POETRY_DATA.dynasty}〕${POETRY_DATA.author} · ${POETRY_DATA.genre}`;
    dom.poetryIntroText.textContent = POETRY_DATA.intro;
    const emptyDescription = dom.tpEmptyState.querySelector(".empty-state-desc");
    if (emptyDescription) {
      emptyDescription.textContent = "播放至前三句结束处，系统会暂停并先请你判断画面基调，再展示中考答题证据。";
    }
  }

  function configureAccessibility() {
    dom.btnPlayPause.setAttribute("aria-label", "播放课文朗读");
    dom.btnReplay.setAttribute("aria-label", "从头播放");
    dom.progressTrack.setAttribute("role", "slider");
    dom.progressTrack.setAttribute("tabindex", "0");
    dom.progressTrack.setAttribute("aria-label", "视频进度");
    dom.btnToggleMindmap.setAttribute("role", "button");
    dom.btnToggleMindmap.setAttribute("tabindex", "0");
    dom.tabButtons.forEach((button) => {
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(button.dataset.tab === state.activeTab));
    });
    dom.tabContents.forEach((panel) => panel.setAttribute("role", "tabpanel"));
  }

  function bindEvents() {
    if (dom.btnPlayModeInteractive) {
      dom.btnPlayModeInteractive.addEventListener("click", () => setPlayMode("interactive"));
    }
    if (dom.btnPlayModeGuided) {
      dom.btnPlayModeGuided.addEventListener("click", () => setPlayMode("guided"));
    }
    if (dom.btnPlayModeContinuous) {
      dom.btnPlayModeContinuous.addEventListener("click", () => setPlayMode("continuous"));
    }
    if (dom.btnLearningContinue) {
      dom.btnLearningContinue.addEventListener("click", continueFromLearningModal);
    }
    if (dom.btnLearningNarration) {
      dom.btnLearningNarration.addEventListener("click", toggleLearningNarration);
    }

    dom.btnPlayPause.addEventListener("click", () => {
      if (dom.video.paused) playVideo();
      else pauseVideo();
    });
    dom.btnReplay.addEventListener("click", () => {
      runtimeTriggeredPoints.clear();
      runtimeTriggeredCheckpoints.clear();
      hideActiveTestPoint();
      seekTo(0);
      playVideo();
    });
    let isDraggingProgress = false;
    let wasPlayingBeforeDrag = false;

    dom.progressTrack.addEventListener("mousedown", (event) => {
      isDraggingProgress = true;
      wasPlayingBeforeDrag = state.media.isPlaying;
      pauseVideo();
      seekFromPointer(event);
    });

    document.addEventListener("mousemove", (event) => {
      if (isDraggingProgress) {
        seekFromPointer(event);
      }
    });

    document.addEventListener("mouseup", (event) => {
      if (isDraggingProgress) {
        isDraggingProgress = false;
        seekFromPointer(event);
        if (wasPlayingBeforeDrag) playVideo();
      }
    });
    dom.progressTrack.addEventListener("keydown", handleProgressKeydown);

    if (dom.volumeSlider) {
      dom.volumeSlider.addEventListener("input", () => {
        const val = Number(dom.volumeSlider.value);
        dom.video.volume = val;
        dom.video.muted = val === 0;
        updateVolumeIcons();
      });
    }

    if (dom.btnVolumeToggle) {
      dom.btnVolumeToggle.addEventListener("click", () => {
        dom.video.muted = !dom.video.muted;
        if (!dom.video.muted && dom.video.volume === 0) {
          dom.video.volume = 0.5;
        }
        updateVolumeIcons();
      });
    }

    dom.speedButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const speed = Number(button.dataset.speed);
        if (!Number.isFinite(speed)) return;
        dom.video.playbackRate = speed;
        state.media.playbackRate = speed;
        renderSpeedButtons();
        if (isTtsSpeaking && state.activeVerseId !== -1) speakTranslation(POETRY_DATA.verses[state.activeVerseId].literal);
        scheduleSave();
      });
    });

    // dom.modeOriginal.addEventListener("click", () => setAudioMode("original"));
    // dom.modeTranslation.addEventListener("click", () => setAudioMode("translation"));

    dom.popupCloseBtn.addEventListener("click", closeVocabPopup);
    window.addEventListener("resize", closeVocabPopup);

    if (dom.btnCloseTestModal) {
      dom.btnCloseTestModal.addEventListener("click", () => {
        if (dom.testModulesModal) dom.testModulesModal.style.display = "none";
      });
    }

    dom.btnOpenSyllabus.addEventListener("click", openSyllabusDrawer);
    dom.btnCloseSyllabus.addEventListener("click", closeSyllabusDrawer);
    dom.syllabusDrawerOverlay.addEventListener("click", (event) => {
      if (event.target === dom.syllabusDrawerOverlay) closeSyllabusDrawer();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeVocabPopup();
        closeSyllabusDrawer();
        closeImageModal();
      }
    });

    const btnCloseImageModal = document.getElementById("btn-close-image-modal");
    if (btnCloseImageModal) {
      btnCloseImageModal.addEventListener("click", closeImageModal);
    }
    const imageModalOverlay = document.getElementById("image-modal-overlay");
    if (imageModalOverlay) {
      imageModalOverlay.addEventListener("click", (e) => {
        if (e.target === imageModalOverlay) closeImageModal();
      });
    }

    dom.tabButtons.forEach((button, index) => {
      button.addEventListener("click", () => switchTab(button.dataset.tab));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = (index + direction + dom.tabButtons.length) % dom.tabButtons.length;
        dom.tabButtons[next].focus();
        switchTab(dom.tabButtons[next].dataset.tab);
      });
    });

    dom.btnTpContinue.addEventListener("click", continueAfterTestPoint);
    dom.btnQuizClue.addEventListener("click", showQuizClue);
    dom.btnQuizPrev.addEventListener("click", () => moveQuizBy(-1));
    dom.btnQuizNext.addEventListener("click", () => moveQuizBy(1));
    dom.btnSubmitSubjective.addEventListener("click", () => submitSubjectiveAnswer(false));
    if (dom.btnSkipSubjective) dom.btnSkipSubjective.addEventListener("click", () => submitSubjectiveAnswer(true));
    dom.btnQuizRetry.addEventListener("click", resetQuiz);

    dom.btnModeRead.addEventListener("click", () => setReadingMode("read"));
    dom.btnModeEvidence.addEventListener("click", () => setReadingMode("evidence"));
    dom.btnModeDictate.addEventListener("click", () => setReadingMode("dictation"));
    dom.btnEvidenceCheck.addEventListener("click", checkEvidenceAssignments);
    dom.btnEvidenceReset.addEventListener("click", resetEvidenceAssignments);
    dom.outcomeSteps.forEach((button) => {
      button.addEventListener("click", () => openOutcome(button.dataset.outcome));
    });
    dom.btnDictateClue.addEventListener("click", showDictationClue);
    dom.btnDictateSubmit.addEventListener("click", submitDictationAnswer);
    dom.btnDictateNext.addEventListener("click", advanceDictation);
    dom.dictateInput.addEventListener("input", () => {
      state.dictation.draft = dom.dictateInput.value;
      scheduleSave();
    });
    dom.dictateInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (state.dictation.currentCorrect) advanceDictation();
      else submitDictationAnswer();
    });

    dom.btnToggleMindmap.addEventListener("click", toggleMindmap);
    dom.btnToggleMindmap.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleMindmap();
      }
    });

    dom.video.addEventListener("loadedmetadata", handleLoadedMetadata);
    dom.video.addEventListener("durationchange", handleLoadedMetadata);
    dom.video.addEventListener("play", handleMediaPlay);
    dom.video.addEventListener("pause", handleMediaPause);
    dom.video.addEventListener("waiting", () => updateMediaStatus("正在缓冲"));
    dom.video.addEventListener("canplay", () => {
      if (!state.media.isPlaying && !state.media.hasError && !dom.learningModalOverlay?.classList.contains("active")) {
        updateMediaStatus("准备就绪");
      }
    });
    dom.video.addEventListener("timeupdate", handleTimeUpdate);
    dom.video.addEventListener("ended", handleMediaEnded);
    dom.video.addEventListener("error", () => {
      state.media.hasError = true;
      state.media.isPlaying = false;
      updateMediaStatus("视频暂不可用，可继续使用原文与练习");
    });
  }

  function installVideoFrameSizer() {
    if (!dom.videoSlot || !dom.videoFrame) return;

    const schedule = () => requestAnimationFrame(sizeVideoFrame);
    window.addEventListener("resize", schedule);

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(schedule);
      observer.observe(dom.videoSlot);
    }

    schedule();
  }

  function sizeVideoFrame() {
    if (!dom.videoSlot || !dom.videoFrame) return;

    const ratio = dom.video.videoWidth > 0 && dom.video.videoHeight > 0
      ? dom.video.videoWidth / dom.video.videoHeight
      : 16 / 9;
    const availableWidth = dom.videoSlot.clientWidth;
    const availableHeight = dom.videoSlot.clientHeight;
    if (availableWidth < 1 || availableHeight < 1) return;

    const width = Math.min(availableWidth, availableHeight * ratio);
    dom.videoFrame.style.width = `${width}px`;
    dom.videoFrame.style.height = `${width / ratio}px`;
  }

  function renderAll() {
    renderMedia();
    updateActiveVerseUI(state.activeVerseId);
    renderLearningOutcomes();
    renderEvidenceLab();
    renderTabs();
    renderQuiz();
    renderDictation();
    renderMistakesUI();
    renderSpeedButtons();
    renderAudioMode();
  }

  function getOutcomeProgress() {
    const expressionScore = Number(state.quiz.results[2]?.score || 0);
    return {
      listen: state.media.listenedToEnd,
      evidence: Boolean(state.evidence.completed),
      expression: expressionScore >= 4,
      review: Boolean(state.dictation.completed && state.mistakes.length === 0)
    };
  }

  function renderLearningOutcomes() {
    const progress = getOutcomeProgress();
    dom.outcomeSteps.forEach((button) => {
      const complete = Boolean(progress[button.dataset.outcome]);
      button.classList.toggle("complete", complete);
      button.setAttribute("aria-pressed", String(complete));
    });
    dom.outcomeStates.forEach((label) => {
      const complete = Boolean(progress[label.dataset.outcomeState]);
      label.textContent = complete ? "已完成" : "待完成";
    });
  }

  function openOutcome(outcome) {
    if (outcome === "listen") {
      setReadingMode("read", { focus: false });
      seekTo(0);
      playVideo();
      return;
    }
    if (outcome === "evidence") {
      setReadingMode("evidence");
      return;
    }
    if (outcome === "expression") {
      const targetIndex = POETRY_DATA.quizzes.findIndex((question) => question.id === 2);
      if (targetIndex !== -1) state.quiz.index = targetIndex;
      pauseVideo();
      switchTab("tab-quiz");
      renderQuiz();
      return;
    }
    if (outcome === "review") {
      if (state.mistakes.length) switchTab("tab-mistakes");
      else setReadingMode("dictation");
    }
  }

  function renderSceneHotspots() {
    if (!dom.sceneHotspots) return;
    dom.sceneHotspots.replaceChildren();
    POETRY_DATA.evidenceModel.sceneHotspots.forEach((hotspot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scene-hotspot";
      button.dataset.sceneStart = String(hotspot.start);
      button.dataset.sceneEnd = String(hotspot.end);
      button.style.left = `${hotspot.x}%`;
      button.style.top = `${hotspot.y}%`;
      button.textContent = hotspot.label;
      button.setAttribute("aria-label", `当前画面证据：${hotspot.label}`);
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
      button.addEventListener("click", () => {
        seekTo(hotspot.start, { suppressCheckpoint: true });
        setReadingMode("read", { focus: false });
        const verse = getVerseAtTime(hotspot.start);
        if (verse) updateActiveVerseUI(verse.id);
      });
      dom.sceneHotspots.appendChild(button);
    });
  }

  function updateSceneHotspots(currentTime) {
    if (!dom.sceneHotspots) return;
    dom.sceneHotspots.querySelectorAll(".scene-hotspot").forEach((button) => {
      const start = Number(button.dataset.sceneStart);
      const end = Number(button.dataset.sceneEnd);
      const active = currentTime >= start && currentTime < end;
      button.classList.toggle("active", active);
      button.setAttribute("aria-hidden", String(!active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  function renderEvidenceLab() {
    const model = POETRY_DATA.evidenceModel;
    const assignments = state.evidence.assignments;
    const selectedId = state.evidence.selectedItemId;
    const incorrectIds = new Set(state.evidence.incorrectIds || []);
    const assignedCount = model.items.filter((item) => assignments[item.id]).length;
    dom.evidenceProgress.textContent = `${assignedCount} / ${model.items.length}`;
    dom.evidenceConclusion.hidden = !state.evidence.completed;
    dom.evidenceBank.replaceChildren();
    dom.evidenceGroups.replaceChildren();

    const createChip = (item) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "evidence-chip";
      chip.textContent = item.label;
      chip.dataset.itemId = item.id;
      chip.classList.toggle("selected", selectedId === item.id);
      chip.classList.toggle("incorrect", incorrectIds.has(item.id));
      chip.setAttribute("aria-pressed", String(selectedId === item.id));
      chip.addEventListener("click", () => selectEvidenceItem(item));
      return chip;
    };

    model.items.filter((item) => !assignments[item.id]).forEach((item) => {
      dom.evidenceBank.appendChild(createChip(item));
    });
    if (!dom.evidenceBank.children.length) {
      const completeLabel = document.createElement("span");
      completeLabel.className = "evidence-bank-empty";
      completeLabel.textContent = "所有词语已放入画面，可以核对证据链。";
      dom.evidenceBank.appendChild(completeLabel);
    }

    model.groups.forEach((group) => {
      const section = document.createElement("section");
      section.className = "evidence-group";
      section.style.setProperty("--evidence-image", `url('${group.image}')`);
      const target = document.createElement("button");
      target.type = "button";
      target.className = "evidence-group-target";
      target.dataset.groupId = group.id;
      target.innerHTML = `<strong>${group.label}</strong><span>${group.cue}</span>`;
      target.addEventListener("click", () => assignSelectedEvidence(group.id));
      const bucket = document.createElement("div");
      bucket.className = "evidence-group-bucket";
      model.items.filter((item) => assignments[item.id] === group.id).forEach((item) => {
        bucket.appendChild(createChip(item));
      });
      if (!bucket.children.length) {
        const placeholder = document.createElement("span");
        placeholder.className = "evidence-group-placeholder";
        placeholder.textContent = "选择词语后放入这里";
        bucket.appendChild(placeholder);
      }
      section.append(target, bucket);
      dom.evidenceGroups.appendChild(section);
    });
  }

  function selectEvidenceItem(item) {
    state.evidence.selectedItemId = state.evidence.selectedItemId === item.id ? null : item.id;
    state.evidence.incorrectIds = state.evidence.incorrectIds.filter((id) => id !== item.id);
    if (state.evidence.selectedItemId) {
      seekTo(item.verseStart, { suppressCheckpoint: true });
      const verse = getVerseAtTime(item.verseStart);
      if (verse) updateActiveVerseUI(verse.id);
      dom.evidenceFeedback.textContent = `已选择“${item.label}”，请判断它最能说明哪一类画面。`;
    } else {
      dom.evidenceFeedback.textContent = "已取消选择。";
    }
    renderEvidenceLab();
    scheduleSave();
  }

  function assignSelectedEvidence(groupId) {
    const itemId = state.evidence.selectedItemId;
    if (!itemId) {
      dom.evidenceFeedback.textContent = "请先选择一个意象词语，再选择画面。";
      return;
    }
    const item = POETRY_DATA.evidenceModel.items.find((entry) => entry.id === itemId);
    const group = POETRY_DATA.evidenceModel.groups.find((entry) => entry.id === groupId);
    if (!item || !group) return;
    state.evidence.assignments[itemId] = groupId;
    state.evidence.selectedItemId = null;
    state.evidence.completed = false;
    state.evidence.incorrectIds = state.evidence.incorrectIds.filter((id) => id !== itemId);
    dom.evidenceFeedback.textContent = `已把“${item.label}”放入“${group.label}”。`;
    renderEvidenceLab();
    renderLearningOutcomes();
    scheduleSave();
  }

  function checkEvidenceAssignments() {
    const model = POETRY_DATA.evidenceModel;
    const assigned = model.items.filter((item) => state.evidence.assignments[item.id]);
    if (assigned.length < model.items.length) {
      dom.evidenceFeedback.textContent = `还有 ${model.items.length - assigned.length} 个词语没有归类。`;
      return;
    }
    const incorrect = model.items
      .filter((item) => state.evidence.assignments[item.id] !== item.group)
      .map((item) => item.id);
    state.evidence.attempts += 1;
    state.evidence.incorrectIds = incorrect;
    state.evidence.completed = incorrect.length === 0;
    dom.evidenceFeedback.textContent = incorrect.length
      ? `有 ${incorrect.length} 个词语需要重新判断。点击红色词语后可换组。`
      : "证据归类正确。现在沿着四层答题链读出完整赏析。";
    renderEvidenceLab();
    renderLearningOutcomes();
    scheduleSave();
  }

  function resetEvidenceAssignments() {
    state.evidence = defaultState().evidence;
    dom.evidenceFeedback.textContent = "已重置，请重新建立证据链。";
    renderEvidenceLab();
    renderLearningOutcomes();
    scheduleSave();
  }

  function renderMedia() {
    const duration = getMediaDuration();
    const current = Math.max(0, Math.min(state.media.currentTime, duration));
    const percentage = duration > 0 ? (current / duration) * 100 : 0;
    dom.progressFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    dom.timeCurrent.textContent = formatTime(current);
    dom.timeTotal.textContent = formatTime(duration);
    dom.videoBadge.textContent = state.media.status;
    dom.playIcon.style.display = state.media.isPlaying ? "none" : "block";
    dom.pauseIcon.style.display = state.media.isPlaying ? "block" : "none";
    dom.btnPlayPause.setAttribute("aria-label", state.media.isPlaying ? "暂停课文朗读" : "播放课文朗读");
    dom.progressTrack.setAttribute("aria-valuemin", "0");
    dom.progressTrack.setAttribute("aria-valuemax", String(Math.round(duration)));
    dom.progressTrack.setAttribute("aria-valuenow", String(Math.round(current)));
    dom.progressTrack.setAttribute("aria-valuetext", `${formatTime(current)} / ${formatTime(duration)}`);
    updateSceneHotspots(current);
  }

  function renderSpeedButtons() {
    dom.speedButtons.forEach((button) => {
      const active = Math.abs(Number(button.dataset.speed) - state.media.playbackRate) < 0.01;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateVolumeIcons() {
    if (!dom.iconVolumeOn || !dom.iconVolumeOff) return;
    const isMuted = dom.video.muted || dom.video.volume === 0;
    dom.iconVolumeOn.style.display = isMuted ? "none" : "block";
    dom.iconVolumeOff.style.display = isMuted ? "block" : "none";
    if (dom.volumeSlider) {
      dom.volumeSlider.value = isMuted ? 0 : dom.video.volume;
    }
  }

  function renderAudioMode() {
    // Audio mode UI has been removed.
  }

  function getMediaDuration() {
    if (Number.isFinite(dom.video.duration) && dom.video.duration > 0) return dom.video.duration;
    return state.media.duration || POETRY_DATA.media.measuredDuration;
  }

  async function playVideo() {
    state.media.hasError = false;
    updateMediaStatus("正在启动朗读");
    try {
      const promise = dom.video.play();
      if (promise && typeof promise.then === "function") await promise;
    } catch (error) {
      state.media.isPlaying = false;
      state.media.hasError = true;
      state.media.status = "浏览器未能开始播放，请再次点击播放";
      console.warn("媒体播放失败。", error);
      renderMedia();
    }
  }

  function pauseVideo() {
    if (!dom.video.paused) dom.video.pause();
    cancelTTS();
  }

  function handleMediaPlay() {
    state.media.isPlaying = true;
    state.media.hasError = false;
    state.media.status = "课文朗读中";
    if (state.media.audioMode === "translation" && state.activeVerseId !== -1) {
      speakTranslation(POETRY_DATA.verses[state.activeVerseId].literal);
    }
    renderMedia();
  }

  function handleMediaPause() {
    state.media.isPlaying = false;
    if (!dom.video.ended && !state.media.hasError && !dom.learningModalOverlay?.classList.contains("active")) {
      state.media.status = "视频已暂停";
    }
    cancelTTS();
    renderMedia();
    scheduleSave();
  }

  function handleMediaEnded() {
    state.media.isPlaying = false;
    state.media.listenedToEnd = true;
    state.media.currentTime = getMediaDuration();
    state.media.status = "已播完";
    runtimeTriggeredCheckpoints.clear();
    renderMedia();
    renderLearningOutcomes();
    scheduleSave();
  }

  function handleLoadedMetadata() {
    const duration = getMediaDuration();
    state.media.duration = duration;
    dom.video.playbackRate = state.media.playbackRate;
    if (duration + 0.08 < POETRY_DATA.media.teachingEnd) {
      state.media.hasError = true;
      state.media.status = "媒体时长短于课程时间轴";
    } else if (!state.media.isPlaying && !state.media.hasError) {
      state.media.status = state.media.currentTime > 1 ? "已恢复学习进度" : "准备就绪";
    }
    renderCheckpoints();
    renderMedia();
    sizeVideoFrame();
  }

  function handleTimeUpdate() {
    const current = Math.min(dom.video.currentTime, getMediaDuration());
    state.media.currentTime = current;
    const verse = getVerseAtTime(current);
    const nextVerseId = verse ? verse.id : -1;
    if (nextVerseId !== state.activeVerseId) {
      state.activeVerseId = nextVerseId;
      updateActiveVerseUI(nextVerseId);
      if (state.media.audioMode === "translation" && nextVerseId !== -1 && !dom.video.paused) {
        speakTranslation(verse.literal);
      }
    }

    if (state.media.playMode === "interactive") {
      POETRY_DATA.testPoints.forEach((point) => {
        const shouldTrigger = Math.abs(current - point.triggerTime) <= 0.22;
        const unanswered = !state.testPoints[point.id];
        if (shouldTrigger && unanswered && !runtimeTriggeredPoints.has(point.id)) {
          runtimeTriggeredPoints.add(point.id);
          state.media.status = `已解锁：${point.shortTitle}`;
        }
      });
    }

    if ((state.media.playMode === "interactive" || state.media.playMode === "guided") && POETRY_DATA.learningCheckpoints) {
      POETRY_DATA.learningCheckpoints.forEach((cp) => {
        if (runtimeTriggeredCheckpoints.has(cp.id)) return;
        if (current >= cp.time && current < cp.time + 0.3) {
           runtimeTriggeredCheckpoints.add(cp.id);
           showLearningModal(cp, { autoNarrate: state.media.playMode === "guided" });
        }
      });
    }
    renderMedia();
    scheduleSave();
  }

  function showToast(message) {
    let toast = document.getElementById("poetry-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "poetry-toast";
      toast.style.cssText = "position:absolute; bottom:80px; left:50%; transform:translateX(-50%); background:rgba(28,28,28,0.85); color:#f5f4ef; padding:8px 16px; border-radius:4px; font-size:13px; font-family:var(--font-serif); pointer-events:none; opacity:0; transition:opacity 0.3s; z-index:999; box-shadow:0 4px 10px rgba(0,0,0,0.2);";
      const consoleBox = document.querySelector(".control-console-lux");
      if (consoleBox) {
        consoleBox.appendChild(toast);
      }
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.style.opacity = "0";
    }, 3500);
  }

  function getVerseAtTime(seconds) {
    return POETRY_DATA.verses.find((verse) => seconds >= verse.start && seconds < verse.end) || null;
  }

  function seekTo(seconds, { suppressCheckpoint = false } = {}) {
    const duration = getMediaDuration();
    const safeTime = Math.max(0, Math.min(Number(seconds) || 0, Math.max(0, duration - 0.01)));
    
    if (POETRY_DATA.learningCheckpoints) {
      POETRY_DATA.learningCheckpoints.forEach(cp => {
        if (suppressCheckpoint && Math.abs(cp.time - safeTime) < 0.5) {
          runtimeTriggeredCheckpoints.add(cp.id);
        } else if (cp.time >= safeTime - 0.5) {
          runtimeTriggeredCheckpoints.delete(cp.id);
        }
      });
    }

    dom.video.currentTime = safeTime;
    state.media.currentTime = safeTime;
    const verse = getVerseAtTime(safeTime);
    state.activeVerseId = verse ? verse.id : -1;
    updateActiveVerseUI(state.activeVerseId);
    renderMedia();
    scheduleSave();
  }

  function seekFromPointer(event) {
    const rect = dom.progressTrack.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    seekTo(ratio * getMediaDuration());
  }

  function handleProgressKeydown(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") seekTo(0);
    else if (event.key === "End") seekTo(getMediaDuration() - 0.01);
    else seekTo(state.media.currentTime + (event.key === "ArrowRight" ? 1 : -1));
  }

  function updateMediaStatus(status) {
    state.media.status = status;
    renderMedia();
  }

  function setPlayMode(mode) {
    const nextMode = normalizePlayMode(mode);
    if (state.media.playMode !== nextMode && dom.learningModalOverlay?.classList.contains("active")) {
      closeLearningModal(false);
    }
    state.media.playMode = nextMode;
    dom.videoFrame.classList.toggle("continuous-view", nextMode === "continuous");
    const modeButtons = [
      [dom.btnPlayModeInteractive, "interactive"],
      [dom.btnPlayModeGuided, "guided"],
      [dom.btnPlayModeContinuous, "continuous"]
    ];
    modeButtons.forEach(([button, value]) => {
      if (!button) return;
      const active = nextMode === value;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderCheckpoints();
    scheduleSave();
  }

  function showLearningModal(cp, { autoNarrate = false } = {}) {
    clearAutomaticNarrationFlow();
    stopLearningNarration();
    autoNarrationCheckpointId = autoNarrate ? cp.id : "";
    autoNarrationShouldResume = autoNarrate;
    learningNarrationSource = cp.narrationSrc || "";
    if (dom.video && !dom.video.paused) {
      dom.video.pause();
    }
    state.media.isPlaying = false;
    updateMediaStatus(autoNarrate ? "【自动伴学】自动讲解中" : "【互动精学】请完成学习");
    
    if (dom.learningModalTitle) dom.learningModalTitle.innerHTML = cp.title;
    if (dom.learningModalContent) dom.learningModalContent.innerHTML = cp.content;
    placeLearningNarrationControl();
    renderLearningNarration();
    
    if (dom.learningModalQuiz) {
      dom.learningModalQuiz.style.display = "none";
      dom.learningModalQuiz.innerHTML = "";
      if (!autoNarrate && cp.quizId) {
        const qIndex = POETRY_DATA.quizzes.findIndex(q => q.id === cp.quizId);
        if (qIndex !== -1) {
          dom.learningModalQuiz.style.display = "block";
          const quizBtn = document.createElement("button");
          quizBtn.type = "button";
          quizBtn.className = "learning-modal-quiz-action";
          quizBtn.textContent = `🎯 随堂检测 · 第${qIndex + 1}题`;
          quizBtn.onclick = () => {
             closeLearningModal(false); // Do not play video
             state.quiz.index = qIndex;
             switchTab("tab-quiz");
             renderQuiz();
             if (dom.testModulesModal) dom.testModulesModal.style.display = "flex";
          };
          dom.learningModalQuiz.appendChild(quizBtn);
        }
      } else if (!autoNarrate && cp.testPointId) {
        dom.learningModalQuiz.style.display = "block";
        const tpBtn = document.createElement("button");
        tpBtn.type = "button";
        tpBtn.className = "learning-modal-quiz-action";
        tpBtn.innerHTML = "💡 核心考点：点击查看";
        tpBtn.onclick = () => {
           closeLearningModal(false); // Do not play video
           switchTab("tab-testpoint");
           if (dom.testModulesModal) dom.testModulesModal.style.display = "flex";
        };
        dom.learningModalQuiz.appendChild(tpBtn);
      }
    }
    
    if (dom.learningModalOverlay) dom.learningModalOverlay.classList.add("active");
    if (dom.btnLearningContinue) dom.btnLearningContinue.textContent = autoNarrate ? "跳过讲解，继续播放" : "我知道了，继续学习";
    if (autoNarrate) {
      window.setTimeout(() => {
        if (!isAutomaticNarrationActive(cp.id)) return;
        if (learningNarrationSource) startNeuralNarration();
        else startSystemNarration();
      }, 120);
    }
    scheduleSave();
  }

  function closeLearningModal(play) {
    clearAutomaticNarrationFlow();
    stopLearningNarration();
    if (dom.learningModalOverlay) dom.learningModalOverlay.classList.remove("active");
    if (play && dom.video && dom.video.paused) {
      dom.video.play().then(() => {
        state.media.isPlaying = true;
        updateMediaStatus("播放中");
      }).catch(console.error);
    }
  }

  function continueFromLearningModal() {
    closeLearningModal(true);
  }

  function clearAutomaticNarrationFlow() {
    if (autoNarrationCloseTimer !== null) {
      clearTimeout(autoNarrationCloseTimer);
      autoNarrationCloseTimer = null;
    }
    autoNarrationCheckpointId = "";
    autoNarrationShouldResume = false;
  }

  function isAutomaticNarrationActive(checkpointId = autoNarrationCheckpointId) {
    return Boolean(checkpointId)
      && autoNarrationCheckpointId === checkpointId
      && autoNarrationShouldResume
      && dom.learningModalOverlay?.classList.contains("active");
  }

  function continueAfterAutomaticNarration() {
    const checkpointId = autoNarrationCheckpointId;
    if (!isAutomaticNarrationActive(checkpointId) || autoNarrationCloseTimer !== null) return;
    autoNarrationCloseTimer = window.setTimeout(() => {
      autoNarrationCloseTimer = null;
      if (isAutomaticNarrationActive(checkpointId)) closeLearningModal(true);
    }, 240);
  }

  function supportsLearningNarration() {
    return "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  }

  function pickChineseNarrationVoice() {
    if (!supportsLearningNarration()) return null;
    const voices = window.speechSynthesis.getVoices();
    const chineseVoices = voices.filter((voice) => /^(zh|cmn)/i.test(voice.lang) || /xiaoxiao|yunxi|yaoyao|xiaoyi|kangkang|huihui|普通话|中文/i.test(voice.name));
    const preferred = [
      /xiaoxiao|yunxi|yaoyao|xiaoyi/i,
      /microsoft.*huihui|google.*普通话|google.*chinese/i
    ];
    for (const pattern of preferred) {
      const voice = chineseVoices.find((item) => pattern.test(item.name));
      if (voice) return voice;
    }
    return chineseVoices[0] || null;
  }

  function getLearningNarrationText() {
    const contentClone = dom.learningModalContent?.cloneNode(true);
    contentClone?.querySelector("#learning-modal-narration")?.remove();
    const content = contentClone?.textContent?.replace(/\s+/g, " ").trim() || "";
    return content;
  }

  function placeLearningNarrationControl() {
    if (!dom.learningNarration || !dom.learningModalTitle) return;
    dom.learningModalTitle.appendChild(dom.learningNarration);
  }

  function renderLearningNarration() {
    if (!dom.btnLearningNarration || !dom.learningNarrationLabel || !dom.learningNarrationStatus) return;
    const supported = supportsLearningNarration();
    const voice = pickChineseNarrationVoice();
    const hasNeuralNarration = Boolean(learningNarrationSource);
    dom.btnLearningNarration.disabled = !hasNeuralNarration && !supported;
    dom.btnLearningNarration.setAttribute("aria-pressed", String(learningNarrationState === "speaking"));

    if (!hasNeuralNarration && !supported) {
      dom.learningNarrationLabel.textContent = "语音暂不可用";
      dom.learningNarrationStatus.textContent = "当前浏览器不支持语音朗读";
    } else if (learningNarrationState === "speaking") {
      dom.learningNarrationLabel.textContent = "暂停讲解";
      dom.learningNarrationStatus.textContent = hasNeuralNarration ? "正在播放神经语音讲解" : `正在朗读${voice ? `：${voice.name}` : ""}`;
    } else if (learningNarrationState === "paused") {
      dom.learningNarrationLabel.textContent = "继续讲解";
      dom.learningNarrationStatus.textContent = "讲解已暂停";
    } else {
      dom.learningNarrationLabel.textContent = "播放讲解";
      dom.learningNarrationStatus.textContent = learningNarrationError || (hasNeuralNarration ? "播放 XiaoxiaoNeural 神经语音" : (voice ? `使用中文语音：${voice.name}` : "将使用系统默认中文语音"));
    }
    dom.btnLearningNarration.title = dom.learningNarrationStatus.textContent;
  }

  function toggleLearningNarration() {
    if (autoNarrationCheckpointId) autoNarrationShouldResume = false;
    if (learningNarrationState === "speaking") {
      if (learningNarrationAudio) {
        learningNarrationPauseRequested = true;
        learningNarrationAudio.pause();
      }
      else if (supportsLearningNarration()) window.speechSynthesis.pause();
      learningNarrationState = "paused";
      renderLearningNarration();
      return;
    }
    if (learningNarrationState === "paused") {
      if (learningNarrationAudio) {
        learningNarrationPauseRequested = false;
        learningNarrationAudio.play().then(() => {
          learningNarrationState = "speaking";
          renderLearningNarration();
        }).catch(() => fallbackToSystemNarration());
      } else if (supportsLearningNarration()) {
        window.speechSynthesis.resume();
        learningNarrationState = "speaking";
        renderLearningNarration();
      }
      return;
    }

    if (learningNarrationSource) {
      startNeuralNarration();
      return;
    }
    startSystemNarration();
  }

  function startNeuralNarration() {
    const source = learningNarrationSource;
    if (!source) {
      startSystemNarration();
      return;
    }
    learningNarrationError = "";
    learningNarrationPauseRequested = false;
    const audio = new Audio(source);
    audio.preload = "auto";
    audio.onplay = () => {
      if (learningNarrationAudio !== audio || learningNarrationPauseRequested) return;
      learningNarrationState = "speaking";
      renderLearningNarration();
    };
    audio.onended = () => {
      if (learningNarrationAudio !== audio) return;
      learningNarrationAudio = null;
      learningNarrationState = "idle";
      renderLearningNarration();
      continueAfterAutomaticNarration();
    };
    audio.onerror = () => fallbackToSystemNarration(audio);
    learningNarrationAudio = audio;
    learningNarrationState = "speaking";
    renderLearningNarration();
    audio.play().catch(() => fallbackToSystemNarration(audio));
  }

  function fallbackToSystemNarration(audio = learningNarrationAudio) {
    if (audio && learningNarrationAudio !== audio) return;
    if (audio) {
      learningNarrationPauseRequested = true;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    learningNarrationAudio = null;
    learningNarrationSource = "";
    learningNarrationState = "idle";
    learningNarrationPauseRequested = false;
    learningNarrationError = "神经语音不可用，已切换系统中文语音";
    startSystemNarration();
  }

  function startSystemNarration() {
    if (!supportsLearningNarration()) {
      renderLearningNarration();
      return;
    }

    const text = getLearningNarrationText();
    if (!text) return;
    learningNarrationError = "";
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    const voice = pickChineseNarrationVoice();
    utterance.lang = voice?.lang || "zh-CN";
    utterance.voice = voice || null;
    utterance.rate = 0.92;
    utterance.pitch = 0.98;
    utterance.volume = 1;
    utterance.onstart = () => {
      if (learningNarrationUtterance !== utterance) return;
      learningNarrationState = "speaking";
      renderLearningNarration();
    };
    utterance.onend = () => {
      if (learningNarrationUtterance !== utterance) return;
      learningNarrationUtterance = null;
      learningNarrationState = "idle";
      renderLearningNarration();
      continueAfterAutomaticNarration();
    };
    utterance.onerror = () => {
      if (learningNarrationUtterance !== utterance) return;
      learningNarrationUtterance = null;
      learningNarrationState = "idle";
      learningNarrationError = "语音播放未成功，请重试";
      renderLearningNarration();
    };
    learningNarrationUtterance = utterance;
    learningNarrationState = "speaking";
    renderLearningNarration();
    window.speechSynthesis.speak(utterance);
  }

  function stopLearningNarration() {
    if (learningNarrationAudio) {
      learningNarrationPauseRequested = true;
      learningNarrationAudio.pause();
      learningNarrationAudio.removeAttribute("src");
      learningNarrationAudio.load();
      learningNarrationAudio = null;
    }
    if (supportsLearningNarration()) window.speechSynthesis.cancel();
    learningNarrationUtterance = null;
    learningNarrationState = "idle";
    learningNarrationError = "";
    learningNarrationPauseRequested = false;
    renderLearningNarration();
  }

  function setAudioMode(mode) {
    state.media.audioMode = mode === "translation" ? "translation" : "original";
    if (state.media.audioMode === "original") {
      dom.video.volume = 1;
      cancelTTS();
    } else {
      dom.video.volume = 0.08;
      if (!dom.video.paused && state.activeVerseId !== -1) speakTranslation(POETRY_DATA.verses[state.activeVerseId].literal);
    }
    renderAudioMode();
    scheduleSave();
  }

  function speakTranslation(text) {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = Math.max(0.7, Math.min(1.25, state.media.playbackRate * 0.85));
    utterance.pitch = 1;
    utterance.onstart = () => { isTtsSpeaking = true; };
    utterance.onend = () => { isTtsSpeaking = false; };
    utterance.onerror = () => { isTtsSpeaking = false; };
    window.speechSynthesis.speak(utterance);
  }

  function cancelTTS() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    isTtsSpeaking = false;
    if (learningNarrationState !== "idle") {
      learningNarrationUtterance = null;
      learningNarrationState = "idle";
      learningNarrationError = "";
      renderLearningNarration();
    }
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function renderVerses() {
    dom.versesList.replaceChildren();
    POETRY_DATA.verses.forEach((verse) => {
      const container = document.createElement("div");
      container.className = "poetry-line-container";
      container.id = `verse-container-${verse.id}`;
      container.dataset.mode = "original";
      container.tabIndex = 0;
      container.setAttribute("role", "button");
      container.setAttribute("aria-label", `播放第 ${verse.id + 1} 句：${verse.text}`);
      container.title = "单击定位朗读，双击查看白话字面义";

      const original = document.createElement("p");
      original.className = "poetry-line";
      original.id = `verse-${verse.id}`;
      appendVerseText(original, verse);

      const translation = document.createElement("p");
      translation.className = "poetry-line";
      translation.style.display = "none";
      const translationText = document.createElement("span");
      translationText.style.cssText = "font-family: var(--font-sans); font-size: 15px; color: var(--color-primary); font-weight: bold; letter-spacing: 0.5px;";
      translationText.textContent = verse.literal;
      translation.appendChild(translationText);

      let clickTimer = null;
      container.addEventListener("click", (event) => {
        if (event.target.closest(".vocab-word")) return;
        if (event.detail !== 1 || container.dataset.mode === "translation") return;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          seekTo(verse.start);
          playVideo();
        }, 220);
      });
      container.addEventListener("dblclick", (event) => {
        event.preventDefault();
        clearTimeout(clickTimer);
        closeVocabPopup();
        const showTranslation = container.dataset.mode !== "translation";
        container.dataset.mode = showTranslation ? "translation" : "original";
        original.style.display = showTranslation ? "none" : "flex";
        translation.style.display = showTranslation ? "flex" : "none";
        container.style.background = showTranslation ? "rgba(195, 143, 29, 0.05)" : "";
        container.setAttribute("aria-label", showTranslation ? `第 ${verse.id + 1} 句字面义：${verse.literal}` : `播放第 ${verse.id + 1} 句：${verse.text}`);
      });
      container.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          seekTo(verse.start);
          playVideo();
        }
      });

      container.append(original, translation);
      dom.versesList.appendChild(container);
    });
  }

  function appendVerseText(target, verse) {
    const entries = verse.words
      .map((word) => ({ word, index: verse.text.indexOf(word.word) }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index);
    let cursor = 0;
    entries.forEach(({ word, index }) => {
      if (index > cursor) target.appendChild(document.createTextNode(verse.text.slice(cursor, index)));
      const span = document.createElement("span");
      span.className = "vocab-word";
      span.dataset.wordId = word.id;
      span.textContent = word.word;
      span.tabIndex = 0;
      span.setAttribute("role", "button");
      span.setAttribute("aria-label", `查看${word.word}的字面义与文本证据`);
      span.addEventListener("click", (event) => {
        event.stopPropagation();
        showVocabPopup(span, word.id);
      });
      span.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          showVocabPopup(span, word.id);
        }
      });
      target.appendChild(span);
      cursor = index + word.word.length;
    });
    if (cursor < verse.text.length) target.appendChild(document.createTextNode(verse.text.slice(cursor)));
  }

  function renderChapterList() {
    dom.chapterListDrawer.replaceChildren();
    POETRY_DATA.verses.forEach((verse) => {
      const item = document.createElement("div");
      item.className = "chapter-item";
      item.id = `chapter-item-${verse.id}`;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `定位到第 ${verse.id + 1} 句：${verse.text}`);
      const label = document.createElement("span");
      label.textContent = verse.text.replace(/[，。]/g, "");
      const dot = document.createElement("span");
      dot.className = "chapter-status-dot";
      item.append(label, dot);
      const activate = () => {
        openImageModal(verse.id);
      };
      item.addEventListener("click", activate);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
      dom.chapterListDrawer.appendChild(item);
    });
  }

  function updateActiveVerseUI(id) {
    document.querySelectorAll(".poetry-line-container").forEach((element) => element.classList.remove("active"));
    document.querySelectorAll(".chapter-item").forEach((element) => element.classList.remove("active"));
    if (id === -1) return;
    byId(`verse-container-${id}`)?.classList.add("active");
    byId(`chapter-item-${id}`)?.classList.add("active");
  }

  function showVocabPopup(target, wordId) {
    const word = wordById.get(wordId);
    if (!word) return;
    popupResumeAfterClose = !dom.video.paused;
    pauseVideo();
    state.selectedWordId = word.id;
    if (!state.viewedWordIds.includes(word.id)) state.viewedWordIds.push(word.id);

    dom.popupWordTitle.textContent = word.word;
    dom.popupWordPinyin.textContent = word.pinyin;
    dom.popupWordMeaning.textContent = `${word.explanation}（${word.category}）`;
    dom.popupWordEvidence.textContent = word.zhongkao;
    dom.vocabPopup.style.display = "block";

    const rect = target.getBoundingClientRect();
    const readerPanel = target.closest(".panel-body");
    if (readerPanel) {
      const panelRect = readerPanel.getBoundingClientRect();
      let left = rect.left - panelRect.left + rect.width / 2 - dom.vocabPopup.offsetWidth / 2;
      left = Math.max(10, Math.min(left, panelRect.width - dom.vocabPopup.offsetWidth - 10));
      let top = rect.top - panelRect.top - dom.vocabPopup.offsetHeight - 12;
      if (top < 8) top = rect.bottom - panelRect.top + 10;
      dom.vocabPopup.style.left = `${left}px`;
      dom.vocabPopup.style.top = `${top}px`;
    }

    renderMindmapData(word.id);
    scheduleSave();
  }

  function closeVocabPopup() {
    if (dom.vocabPopup.style.display === "none") return;
    dom.vocabPopup.style.display = "none";
    if (popupResumeAfterClose) {
      popupResumeAfterClose = false;
      playVideo();
    }
  }

  function openSyllabusDrawer() {
    pauseVideo();
    dom.syllabusDrawerOverlay.style.display = "block";
    requestAnimationFrame(() => { dom.syllabusDrawer.style.transform = "translateX(0)"; });
  }

  function closeSyllabusDrawer() {
    dom.syllabusDrawer.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (dom.syllabusDrawer.style.transform !== "translateX(0px)") dom.syllabusDrawerOverlay.style.display = "none";
    }, 300);
  }

  function openImageModal(verseId) {
    const modal = document.getElementById("image-modal-overlay");
    const img = document.getElementById("image-modal-img");
    const caption = document.getElementById("image-modal-caption");
    if (!modal || !img || !caption) return;
    
    // Determine the image path based on the verse index (1 to 5)
    img.src = `images/verse_${verseId + 1}.jpg`;
    caption.textContent = POETRY_DATA.verses[verseId].text;
    
    modal.style.display = "flex";
  }

  function closeImageModal() {
    const modal = document.getElementById("image-modal-overlay");
    if (modal) {
      modal.style.display = "none";
    }
  }

  function renderCheckpoints() {
    const container = byId("checkpoints-container");
    if (!container) return;
    container.replaceChildren();
    if (state.media.playMode === "continuous") return;
    const duration = getMediaDuration();
    
    if (POETRY_DATA.learningCheckpoints) {
      POETRY_DATA.learningCheckpoints.forEach((cp) => {
        const dot = document.createElement("div");
        dot.className = "learning-checkpoint-dot";
        dot.style.cssText = `position:absolute;left:${(cp.time / duration) * 100}%;top:50%;width:10px;height:10px;background:var(--color-gold, #cfa972);border:2px solid #fff;border-radius:50%;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto;box-shadow:0 1px 3px rgba(207, 169, 114, 0.4);transition:transform .2s; z-index: 2;`;
        dot.title = cp.title;
        dot.tabIndex = 0;
        dot.setAttribute("role", "button");
        dot.setAttribute("aria-label", `学习节点：${cp.title}`);
        const activate = (event) => {
          event?.stopPropagation();
          seekTo(cp.time);
          runtimeTriggeredCheckpoints.add(cp.id);
          showLearningModal(cp, { autoNarrate: state.media.playMode === "guided" });
        };
        dot.addEventListener("click", activate);
        dot.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activate();
          }
        });
        dot.addEventListener("mouseenter", () => { dot.style.transform = "translate(-50%,-50%) scale(1.3)"; });
        dot.addEventListener("mouseleave", () => { dot.style.transform = "translate(-50%,-50%) scale(1)"; });
        container.appendChild(dot);
      });
    }
  }

  function openTestPoint(point) {
    pauseVideo();
    dom.tpActiveCard.dataset.pointId = point.id;
    switchTab("tab-testpoint");
    renderTestPointUI();
  }

  function getUnlockedTestPoints() {
    return POETRY_DATA.testPoints.filter((point) => state.media.listenedToEnd || state.media.currentTime >= point.triggerTime);
  }

  function renderTestPointNavigation(points, activeId) {
    if (!dom.tpNavigation) return;
    dom.tpNavigation.replaceChildren();
    points.forEach((point, index) => {
      const item = document.createElement("button");
      const answered = Boolean(state.testPoints[point.id]);
      item.type = "button";
      item.className = `${point.id === activeId ? "active " : ""}${answered ? "answered" : ""}`.trim();
      item.setAttribute("role", "tab");
      item.setAttribute("aria-selected", String(point.id === activeId));
      item.textContent = `${index + 1}. ${point.shortTitle || "考点"}`;
      item.addEventListener("click", () => {
        dom.tpActiveCard.dataset.pointId = point.id;
        renderTestPointUI();
      });
      dom.tpNavigation.appendChild(item);
    });
  }

  function renderTestPointCard(point, unlockedPoints) {
    dom.tpEmptyState.style.display = "none";
    dom.tpActiveCard.style.display = "block";
    dom.tpActiveCard.dataset.pointId = point.id;
    dom.tpTitle.textContent = point.title;
    dom.tpVerse.textContent = `“${point.verse}”`;
    dom.tpQuestion.textContent = point.question;
    renderTestPointNavigation(unlockedPoints, point.id);
    const answer = state.testPoints[point.id];
    if (answer) renderTestPointExplanation(point, answer.selectedIndex);
    else renderTestPointPrediction(point);
  }

  function renderTestPointPrediction(point) {
    dom.tpTemplate.replaceChildren();
    const list = document.createElement("div");
    list.className = "quiz-options-lux";
    point.prediction.options.forEach((label, index) => {
      const option = document.createElement("div");
      option.className = "quiz-option";
      option.textContent = label;
      option.tabIndex = 0;
      option.setAttribute("role", "button");
      option.setAttribute("aria-label", `选择画面基调：${label}`);
      const choose = () => {
        state.testPoints[point.id] = {
          selectedIndex: index,
          correct: index === point.prediction.correctIndex,
          answeredAt: new Date().toISOString()
        };
        renderTestPointExplanation(point, index);
        scheduleSave();
      };
      option.addEventListener("click", choose);
      option.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose();
        }
      });
      list.appendChild(option);
    });
    dom.tpTemplate.appendChild(list);
    dom.btnTpContinue.style.display = "none";
  }

  function renderTestPointExplanation(point, selectedIndex) {
    dom.tpTemplate.replaceChildren();
    const result = document.createElement("p");
    result.style.cssText = "font-weight:bold;color:var(--color-primary);margin-bottom:10px;line-height:1.55;";
    const correct = selectedIndex === point.prediction.correctIndex;
    result.textContent = `${correct ? "判断成立" : "需要修订"}：你选择了“${point.prediction.options[selectedIndex]}”。${point.prediction.response}`;
    dom.tpTemplate.appendChild(result);

    point.steps.forEach((step) => {
      const row = document.createElement("div");
      row.className = "zhongkao-step";
      const badge = document.createElement("span");
      badge.className = "step-badge";
      badge.textContent = step.label;
      const text = document.createElement("p");
      text.textContent = step.text;
      row.append(badge, text);
      dom.tpTemplate.appendChild(row);
    });

    if (point.standardAnswer) {
      const answerBox = document.createElement("div");
      answerBox.style.cssText = "margin-top: 15px; padding: 12px; background: rgba(31, 78, 61, 0.04); border-left: 3px solid var(--color-primary); font-size: 13px; line-height: 1.6; color: var(--text-main);";
      answerBox.innerHTML = `<strong style="color: var(--color-primary); display: block; margin-bottom: 6px;">【标准满分答案】</strong>${point.standardAnswer}`;
      dom.tpTemplate.appendChild(answerBox);
    }

    const tip = document.createElement("div");
    tip.className = "zhongkao-score-tip";
    tip.textContent = `答题核验：${point.scoreTip}`;
    dom.tpTemplate.appendChild(tip);

    if (correct && point.followupQuizId) {
      const qIndex = POETRY_DATA.quizzes.findIndex((question) => question.id === point.followupQuizId);
      if (qIndex !== -1) {
        const followup = document.createElement("button");
        followup.type = "button";
        followup.className = "btn-resume-play-lux";
        followup.textContent = `巩固本考点：第${qIndex + 1}题`;
        followup.addEventListener("click", () => {
          hideActiveTestPoint();
          state.quiz.index = qIndex;
          switchTab("tab-quiz");
          renderQuiz();
          if (dom.testModulesModal) dom.testModulesModal.style.display = "flex";
          scheduleSave();
        });
        dom.tpTemplate.appendChild(followup);
      }
    }

    dom.btnTpContinue.textContent = correct ? "完成核对，继续听" : "重新判断";
    dom.btnTpContinue.style.display = "block";
  }

  function continueAfterTestPoint() {
    const pointId = dom.tpActiveCard.dataset.pointId;
    const point = POETRY_DATA.testPoints.find((item) => item.id === pointId);
    const answer = pointId ? state.testPoints[pointId] : null;
    if (!point || !answer) return;
    if (!answer.correct) {
      delete state.testPoints[pointId];
      renderTestPointPrediction(point);
      scheduleSave();
      return;
    }
    hideActiveTestPoint();
    seekTo(state.media.currentTime + 0.35);
    playVideo();
  }

  function hideActiveTestPoint() {
    dom.tpActiveCard.style.display = "none";
    dom.tpEmptyState.style.display = "flex";
    dom.tpActiveCard.dataset.pointId = "";
    if (dom.testModulesModal) dom.testModulesModal.style.display = "none";
  }

  function toggleMindmap() {
    const opening = dom.mindmapContent.style.display === "none" || !dom.mindmapContent.style.display;
    dom.mindmapContent.style.display = opening ? "flex" : "none";
    dom.mindmapArrow.textContent = opening ? "▲ 收起脑图" : "▼ 展开脑图";
    dom.btnToggleMindmap.setAttribute("aria-expanded", String(opening));
    if (opening) renderMindmapData(state.selectedWordId);
  }

  function renderMindmapData(selectedWordId = null) {
    dom.mindmapContent.replaceChildren();
    const sorted = [...POETRY_DATA.imageryMindmap].sort((a, b) => {
      if (a.id === selectedWordId) return -1;
      if (b.id === selectedWordId) return 1;
      return 0;
    });
    sorted.forEach((imagery) => {
      const item = document.createElement("div");
      const selected = imagery.id === selectedWordId;
      item.style.cssText = `border-left:2.5px solid ${selected ? "var(--color-cinnabar)" : "var(--color-gold)"};padding-left:8px;margin-bottom:8px;text-align:left;`;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `定位并比较意象：${imagery.name}`);
      const title = document.createElement("div");
      title.style.cssText = "font-weight:bold;color:var(--color-primary);font-size:13px;font-family:var(--font-serif);";
      title.textContent = `${selected ? "当前证据 · " : "意象："}${imagery.name}`;
      const symbolism = document.createElement("div");
      symbolism.style.cssText = "color:var(--text-dark);font-size:11.5px;margin:2px 0 6px;";
      symbolism.textContent = `象征与语境：${imagery.symbolism}`;
      const compareTitle = document.createElement("div");
      compareTitle.style.cssText = "font-size:11px;font-weight:bold;color:var(--color-gold-hover);";
      compareTitle.textContent = "对比阅读证据：";
      item.append(title, symbolism, compareTitle);

      imagery.comparison.forEach((comparison) => {
        const card = document.createElement("div");
        card.style.cssText = "margin-top:4px;padding:4px 6px;background:var(--color-primary-light);border-radius:4px;";
        const source = document.createElement("div");
        source.style.cssText = "font-weight:bold;color:var(--color-primary);";
        source.textContent = comparison.title;
        const quote = document.createElement("div");
        quote.style.cssText = "font-style:italic;color:var(--color-cinnabar);font-weight:500;";
        quote.textContent = `“${comparison.quote}”`;
        const note = document.createElement("div");
        note.style.cssText = "color:var(--text-muted);font-size:11px;";
        note.textContent = `考点对比：${comparison.note}`;
        card.append(source, quote, note);
        item.appendChild(card);
      });

      const activate = () => {
        seekTo(imagery.verseStart);
        updateActiveVerseUI(getVerseAtTime(imagery.verseStart)?.id ?? -1);
      };
      item.addEventListener("click", activate);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
      dom.mindmapContent.appendChild(item);
    });
  }

  function renderTabs() {
    dom.tabButtons.forEach((button) => {
      const active = button.dataset.tab === state.activeTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    dom.tabContents.forEach((panel) => panel.classList.toggle("active", panel.id === state.activeTab));
  }

  function switchTab(tabId) {
    if (!dom.tabContents.some((panel) => panel.id === tabId)) return;
    state.activeTab = tabId;
    renderTabs();
    if (tabId === "tab-quiz") renderQuiz();
    if (tabId === "tab-mistakes") renderMistakesUI();
    if (tabId === "tab-testpoint") renderTestPointUI();
    if (dom.testModulesModal) dom.testModulesModal.style.display = "flex";
    scheduleSave();
  }

  function renderTestPointUI() {
    const unlockedPoints = getUnlockedTestPoints();
    if (!unlockedPoints.length) {
      dom.tpEmptyState.style.display = "flex";
      dom.tpActiveCard.style.display = "none";
      if (dom.tpNavigation) dom.tpNavigation.replaceChildren();
      return;
    }
    const activePointId = dom.tpActiveCard.dataset.pointId;
    const activePoint = unlockedPoints.find((point) => point.id === activePointId)
      || unlockedPoints.find((point) => !state.testPoints[point.id])
      || unlockedPoints.at(-1);
    renderTestPointCard(activePoint, unlockedPoints);
  }

  function renderQuiz() {
    if (state.quiz.completed) {
      showQuizScore();
      return;
    }
    dom.quizActiveCard.style.display = "block";
    dom.quizScoreCard.style.display = "none";
    showQuizQuestion(state.quiz.index);
  }

  function showQuizQuestion(index) {
    const question = POETRY_DATA.quizzes[index];
    if (!question) {
      finishQuiz();
      return;
    }
    clearQuizAutoAdvance();
    state.quiz.index = index;
    state.quiz.locked = false;
    dom.quizProgressText.textContent = `问题 ${index + 1} / ${POETRY_DATA.quizzes.length}`;
    dom.quizQuestion.textContent = question.question;
    dom.quizClueBox.style.display = "none";
    dom.quizExplanation.style.display = "none";
    dom.quizOptionsList.replaceChildren();
    dom.quizGradingChecklist.replaceChildren();
    dom.quizGradingBox.style.display = "none";
    removeQuizNextButton();

    dom.btnQuizClue.onclick = showQuizClue;
    if (question.type === "objective") renderObjectiveQuestion(question);
    else renderSubjectiveQuestion(question);
    updateQuizNavigation();
  }

  function clearQuizAutoAdvance() {
    if (quizAutoAdvanceTimer === null) return;
    clearTimeout(quizAutoAdvanceTimer);
    quizAutoAdvanceTimer = null;
  }

  function moveQuizBy(offset) {
    const nextIndex = state.quiz.index + offset;
    if (nextIndex < 0 || nextIndex >= POETRY_DATA.quizzes.length) return;
    showQuizQuestion(nextIndex);
    scheduleSave();
  }

  function updateQuizNavigation() {
    const firstIndex = 0;
    const lastIndex = POETRY_DATA.quizzes.length - 1;
    dom.btnQuizPrev.disabled = state.quiz.index <= firstIndex;
    dom.btnQuizNext.disabled = state.quiz.index >= lastIndex;
    dom.btnQuizPrev.setAttribute("aria-disabled", String(dom.btnQuizPrev.disabled));
    dom.btnQuizNext.setAttribute("aria-disabled", String(dom.btnQuizNext.disabled));
  }

  function renderObjectiveQuestion(question) {
    dom.quizOptionsList.style.display = "flex";
    dom.quizSubjectiveBox.style.display = "none";
    question.options.forEach((label, index) => {
      const option = document.createElement("div");
      option.className = "quiz-option";
      option.textContent = label;
      option.tabIndex = 0;
      option.setAttribute("role", "button");
      option.setAttribute("aria-label", label);
      const choose = () => selectObjectiveOption(question, option, index);
      option.addEventListener("click", choose);
      option.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose();
        }
      });
      dom.quizOptionsList.appendChild(option);
    });
  }

  function selectObjectiveOption(question, selected, selectedIndex) {
    if (state.quiz.locked) return;
    state.quiz.locked = true;
    const correct = selectedIndex === question.correctIndex;
    const options = [...dom.quizOptionsList.querySelectorAll(".quiz-option")];
    selected.classList.add(correct ? "correct" : "incorrect");
    selected.setAttribute("aria-label", `${selected.textContent}，${correct ? "回答正确" : "回答错误"}`);
    if (!correct) options[question.correctIndex]?.classList.add("correct");
    state.quiz.results[question.id] = {
      score: correct ? question.maxScore : 0,
      maxScore: question.maxScore,
      correct,
      selectedIndex,
      answeredAt: new Date().toISOString()
    };

    if (correct) {
      removeMistake(`quiz-${question.id}`);
      const resolvedRetest = resolveRetestIfNeeded(`quiz-${question.id}`);
      renderLearningOutcomes();
      scheduleSave();
      clearQuizAutoAdvance();
      quizAutoAdvanceTimer = setTimeout(() => {
        quizAutoAdvanceTimer = null;
        if (resolvedRetest) switchTab("tab-mistakes");
        else advanceQuiz();
      }, 700);
    } else {
      addMistake({
        id: `quiz-${question.id}`,
        type: "quiz",
        question: question.question,
        questionId: question.id
      });
      showQuizExplanation(question, "我已核对，继续下一题");
      renderLearningOutcomes();
      scheduleSave();
    }
  }

  function renderSubjectiveQuestion(question) {
    dom.quizOptionsList.style.display = "none";
    dom.quizSubjectiveBox.style.display = "flex";
    dom.quizSubjectiveInput.disabled = false;
    dom.quizSubjectiveInput.value = state.quiz.drafts[question.id] || "";
    dom.btnSubmitSubjective.style.display = "block";
    dom.btnSubmitSubjective.onclick = () => submitSubjectiveAnswer(false);
    if (dom.btnSkipSubjective) {
      dom.btnSkipSubjective.style.display = "block";
      dom.btnSkipSubjective.onclick = () => submitSubjectiveAnswer(true);
    }
    dom.btnSubmitSubjective.textContent = "提交答案并核对得分点";
    dom.quizSubjectiveInput.oninput = () => {
      state.quiz.drafts[question.id] = dom.quizSubjectiveInput.value;
      scheduleSave();
    };
  }

  function submitSubjectiveAnswer(isSkip = false) {
    const question = POETRY_DATA.quizzes[state.quiz.index];
    if (!question || question.type !== "subjective") return;
    const answer = dom.quizSubjectiveInput.value.trim();
    if (!answer && !isSkip) {
      showInlineQuizClue("请写下自己的判断，再核对得分点。", question.jumpTime);
      dom.quizSubjectiveInput.focus();
      return;
    }

    const finalAnswer = isSkip ? "（已跳过）" : answer;
    const assessment = assessSubjective(question, finalAnswer);
    const attempt = Number(state.quiz.attempts[question.id] || 0) + 1;
    state.quiz.attempts[question.id] = attempt;
    state.quiz.drafts[question.id] = answer;
    state.quiz.results[question.id] = {
      score: assessment.score,
      maxScore: question.maxScore,
      correct: assessment.score === question.maxScore,
      checks: assessment.checks,
      answer: finalAnswer,
      attempt,
      answeredAt: new Date().toISOString()
    };

    dom.quizSubjectiveInput.disabled = true;
    dom.btnSubmitSubjective.style.display = "none";
    if (dom.btnSkipSubjective) dom.btnSkipSubjective.style.display = "none";
    renderAssessmentChecklist(question, assessment);
    if (assessment.score < question.maxScore) {
      addMistake({
        id: `quiz-${question.id}`,
        type: "quiz",
        question: question.question,
        questionId: question.id,
        userAnswer: answer
      });
    } else {
      removeMistake(`quiz-${question.id}`);
      resolveRetestIfNeeded(`quiz-${question.id}`);
    }
    renderLearningOutcomes();
    scheduleSave();
  }

  function assessSubjective(question, answer) {
    const text = normalizeText(answer);
    if (question.rubricType === "transfer") return assessTransfer(question, text);
    return assessImageryAnalysis(question, text);
  }

  function assessImageryAnalysis(question, text) {
    const technique = includesAny(text, ["列锦", "名词并列", "意象并列", "名词堆叠", "名词组合"]);
    const imageryWords = ["枯藤", "老树", "昏鸦", "小桥", "流水", "人家", "古道", "西风", "瘦马"];
    const evidence = imageryWords.filter((word) => text.includes(word));
    const picture = evidence.length >= 3 && includesAny(text, ["画面", "图景", "勾勒", "描绘", "深秋", "暮色", "黄昏", "羁旅", "荒凉"]);
    const mood = includesAny(text, ["凄清", "萧瑟", "苍凉", "孤寂", "悲凉", "凄凉"]);
    const journey = includesAny(text, ["漂泊", "羁旅", "天涯", "游子", "无归", "在路上", "劳顿"]);
    const homesick = includesAny(text, ["思乡", "乡愁", "思家", "故乡", "归乡", "怀乡"]);
    const emotion = journey && homesick;
    const values = { technique, picture, mood, emotion };
    const checks = question.scorePoints.map((point) => ({ ...point, passed: Boolean(values[point.id]) }));
    return { checks, score: checks.reduce((sum, item) => sum + (item.passed ? item.score : 0), 0), evidence };
  }

  function assessTransfer(question, text) {
    const source = includesAny(text, ["昏鸦", "流水", "夕阳", "人家", "天涯"]);
    const transfer = includesAny(text, ["斜阳", "寒鸦", "孤村", "流水绕孤村", "秦观", "满庭芳"]);
    const effect = text.length >= 28 && includesAny(text, ["孤寂", "凄清", "苍凉", "伤感", "离愁", "羁旅", "思乡", "归宿", "漂泊", "反衬", "氛围"]);
    const values = { source, transfer, effect };
    const checks = question.scorePoints.map((point) => ({ ...point, passed: Boolean(values[point.id]) }));
    return { checks, score: checks.reduce((sum, item) => sum + (item.passed ? item.score : 0), 0) };
  }

  function includesAny(text, candidates) {
    return candidates.some((candidate) => text.includes(candidate));
  }

  function normalizeText(text) {
    return String(text || "").replace(/[\s，。；：！？、,.!?;:'“”‘’（）()]/g, "");
  }

  function renderAssessmentChecklist(question, assessment) {
    dom.quizGradingBox.style.display = "flex";
    dom.quizGradingChecklist.replaceChildren();
    assessment.checks.forEach((check) => {
      const label = document.createElement("label");
      label.style.cssText = "display:flex;align-items:flex-start;gap:8px;padding:4px 0;";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "grading-checkbox";
      checkbox.checked = check.passed;
      checkbox.disabled = true;
      const text = document.createElement("span");
      text.textContent = `${check.passed ? "已覆盖" : "待补充"}：${check.text}（${check.score}分）`;
      label.append(checkbox, text);
      dom.quizGradingChecklist.appendChild(label);
    });

    const attempt = Number(state.quiz.attempts[question.id] || 1);
    const complete = assessment.score === question.maxScore;
    dom.btnFinishGrading.textContent = complete
      ? `证据完整（${assessment.score}/${question.maxScore}），查看解析`
      : attempt < 2
        ? `当前 ${assessment.score}/${question.maxScore} 分，返回修改`
        : `当前 ${assessment.score}/${question.maxScore} 分，查看解析`;
    dom.btnFinishGrading.onclick = () => {
      if (!complete && attempt < 2) {
        const missing = assessment.checks.filter((item) => !item.passed).map((item) => item.text);
        dom.quizGradingBox.style.display = "none";
        dom.quizSubjectiveInput.disabled = false;
        dom.btnSubmitSubjective.style.display = "block";
        if (dom.btnSkipSubjective) dom.btnSkipSubjective.style.display = "block";
        showInlineQuizClue(`请补充：${missing.join("；")}。`, question.jumpTime);
        dom.quizSubjectiveInput.focus();
      } else {
        dom.quizGradingBox.style.display = "none";
        showQuizExplanation(question, "完成核对，继续下一题");
      }
    };
  }

  function showQuizClue() {
    const question = POETRY_DATA.quizzes[state.quiz.index];
    if (!question) return;
    showInlineQuizClue(question.hint, question.jumpTime);
  }

  function showInlineQuizClue(text, jumpTime) {
    dom.quizClueText.textContent = text;
    dom.quizClueBox.style.display = "block";
    blinkVerseClue(jumpTime);
  }

  function showQuizExplanation(question, nextLabel) {
    dom.quizExplanation.style.display = "block";
    dom.quizExplanationText.replaceChildren();
    const tag = document.createElement("span");
    tag.className = "explanation-tag-lux";
    tag.textContent = "考点精讲与得分证据";
    dom.quizExplanationText.appendChild(tag);
    question.explanation.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      dom.quizExplanationText.appendChild(p);
    });
    dom.btnQuizJumpBack.onclick = () => {
      if (dom.testModulesModal) dom.testModulesModal.style.display = "none";
      seekTo(question.jumpTime);
      playVideo();
    };

    removeQuizNextButton();
    const next = document.createElement("button");
    next.className = "btn-resume-play-lux btn-next-quiz";
    next.style.cssText = "margin-top:12px;width:100%;";
    next.textContent = nextLabel;
    next.addEventListener("click", () => {
      const mistakeId = state.quiz.retestMistakeId;
      const result = state.quiz.results[question.id];
      const retestPassed = mistakeId === `quiz-${question.id}` && result?.score === result?.maxScore;
      if (retestPassed) {
        state.quiz.retestMistakeId = null;
        switchTab("tab-mistakes");
      } else {
        advanceQuiz();
      }
    });
    dom.quizExplanation.appendChild(next);
  }

  function removeQuizNextButton() {
    dom.quizExplanation.querySelectorAll(".btn-next-quiz").forEach((button) => button.remove());
  }

  function advanceQuiz() {
    state.quiz.index += 1;
    state.quiz.locked = false;
    if (state.quiz.index >= POETRY_DATA.quizzes.length) finishQuiz();
    else showQuizQuestion(state.quiz.index);
    scheduleSave();
  }

  function finishQuiz() {
    state.quiz.completed = true;
    state.quiz.index = POETRY_DATA.quizzes.length - 1;
    showQuizScore();
    scheduleSave();
  }

  function showQuizScore() {
    dom.quizActiveCard.style.display = "none";
    dom.quizScoreCard.style.display = "flex";
    const max = POETRY_DATA.quizzes.reduce((sum, question) => sum + question.maxScore, 0);
    const earned = POETRY_DATA.quizzes.reduce((sum, question) => sum + Number(state.quiz.results[question.id]?.score || 0), 0);
    const percentage = max ? Math.round((earned / max) * 100) : 0;
    dom.scoreNumber.textContent = String(percentage);
    const dimensions = getEvidenceDimensions();
    renderRadarChart(dimensions);
    if (percentage === 100) {
      const comprehensive = dimensions.every((item) => item.value >= 80);
      dom.scoreMessage.textContent = comprehensive ? "综合证据完整，掌握扎实" : "听后测验满分，继续完成薄弱项";
    }
    else if (percentage >= 60) dom.scoreMessage.textContent = "基本掌握，继续补强证据";
    else dom.scoreMessage.textContent = "回到原文，按证据逐项订正";
    const weak = dimensions.filter((item) => item.value < 80).map((item) => `${item.label}${Math.round(item.value)}分`);
    dom.scoreSubmessage.textContent = weak.length
      ? `测验得分 ${earned}/${max}。优先复习：${weak.join("、")}。未测或无证据的维度按 0 分记录。`
      : `测验得分 ${earned}/${max}。五个维度均有可追溯作答证据。`;
  }

  function resetQuiz() {
    clearQuizAutoAdvance();
    state.quiz = defaultState().quiz;
    dom.quizSubjectiveInput.value = "";
    renderQuiz();
    scheduleSave();
  }

  function getEvidenceDimensions() {
    const analysis = state.quiz.results[2]?.checks || [];
    const transfer = state.quiz.results[4]?.checks || [];
    const checkValue = (checks, id) => checks.find((item) => item.id === id)?.passed ? 100 : 0;
    const vocab = Math.min(100, (state.viewedWordIds.length / 6) * 100);
    const technique = checkValue(analysis, "technique");
    const imageryFromAnswer = (checkValue(analysis, "picture") + checkValue(analysis, "mood")) / 2;
    const imagery = state.evidence.completed ? Math.max(80, imageryFromAnswer) : imageryFromAnswer;
    const dictation = (state.dictation.correctIds.length / POETRY_DATA.dictations.length) * 100;
    const emotionPieces = [
      checkValue(analysis, "emotion"),
      state.quiz.results[3]?.correct ? 100 : 0,
      checkValue(transfer, "effect")
    ];
    const emotion = emotionPieces.reduce((sum, value) => sum + value, 0) / emotionPieces.length;
    return [
      { label: "字词识记", shortLabel: "字词", value: vocab },
      { label: "写作手法", shortLabel: "手法", value: technique },
      { label: "意象鉴赏", shortLabel: "意象", value: imagery },
      { label: "默写背诵", shortLabel: "默写", value: dictation },
      { label: "主旨迁移", shortLabel: "主旨", value: emotion }
    ];
  }

  function renderRadarChart(dimensions) {
    dom.skillBars.replaceChildren();
    dimensions.forEach((dimension) => {
      const value = Math.round(Math.max(0, Math.min(100, dimension.value)));
      const row = document.createElement("div");
      row.className = "skill-bar-row";
      const label = document.createElement("div");
      label.className = "skill-bar-label";
      label.innerHTML = `<span>${dimension.label}</span><strong>${value}%</strong>`;
      const track = document.createElement("div");
      track.className = "skill-bar-track";
      const fill = document.createElement("span");
      fill.className = "skill-bar-fill";
      fill.style.width = `${value}%`;
      track.appendChild(fill);
      const hint = document.createElement("p");
      hint.textContent = value >= 80 ? "证据较完整" : value > 0 ? "继续补强对应证据" : "尚未形成可追溯证据";
      row.append(label, track, hint);
      dom.skillBars.appendChild(row);
    });
  }

  function setReadingMode(mode, { focus = true, save = true } = {}) {
    const dictation = mode === "dictation";
    const evidence = mode === "evidence";
    state.readingMode = dictation ? "dictation" : evidence ? "evidence" : "read";
    dom.btnModeDictate.classList.toggle("active", dictation);
    dom.btnModeEvidence.classList.toggle("active", evidence);
    dom.btnModeRead.classList.toggle("active", !dictation && !evidence);
    dom.btnModeDictate.setAttribute("aria-pressed", String(dictation));
    dom.btnModeEvidence.setAttribute("aria-pressed", String(evidence));
    dom.btnModeRead.setAttribute("aria-pressed", String(!dictation && !evidence));
    dom.readModeView.style.display = dictation || evidence ? "none" : "block";
    dom.evidenceModeView.style.display = evidence ? "flex" : "none";
    dom.dictateModeView.style.display = dictation ? "flex" : "none";
    closeVocabPopup();
    if (evidence) {
      pauseVideo();
      renderEvidenceLab();
      if (focus) dom.evidenceModeView.focus?.();
    }
    if (dictation) {
      pauseVideo();
      if (state.dictation.completed && !state.dictation.retestMistakeId) state.dictation = defaultState().dictation;
      renderDictation();
      if (focus) setTimeout(() => dom.dictateInput.focus(), 0);
    }
    if (save) scheduleSave();
  }

  function renderDictation() {
    const question = POETRY_DATA.dictations[state.dictation.index];
    if (!question) return;
    const retest = Boolean(state.dictation.retestMistakeId);
    dom.dictateProgress.textContent = retest
      ? `错题复测 · ${state.dictation.index + 1} / ${POETRY_DATA.dictations.length}`
      : `关卡 ${state.dictation.index + 1} / ${POETRY_DATA.dictations.length}`;
    dom.dictateQuestionText.textContent = question.question;
    if (document.activeElement !== dom.dictateInput) dom.dictateInput.value = state.dictation.draft || "";
    dom.dictateInput.disabled = state.dictation.currentCorrect;
    dom.btnDictateSubmit.style.display = state.dictation.currentCorrect ? "none" : "block";
    dom.btnDictateSubmit.textContent = state.dictation.feedback && !state.dictation.feedback.correct ? "订正后再次提交" : "提交默写答案";
    dom.btnDictateNext.style.display = state.dictation.currentCorrect ? "block" : "none";
    dom.btnDictateNext.textContent = state.dictation.index === POETRY_DATA.dictations.length - 1 ? "完成默写" : "进入下一关";
    renderDictationFeedback();
  }

  function showDictationClue() {
    const question = POETRY_DATA.dictations[state.dictation.index];
    if (!question) return;
    dom.dictateExplanationBox.style.display = "block";
    dom.dictateExplanationBox.textContent = `提示：${question.hint}`;
    blinkVerseClue(question.jumpTime);
  }

  function submitDictationAnswer() {
    const question = POETRY_DATA.dictations[state.dictation.index];
    if (!question || state.dictation.currentCorrect) return;
    const actual = normalizeDictation(dom.dictateInput.value);
    if (!actual) {
      dom.dictateExplanationBox.style.display = "block";
      dom.dictateExplanationBox.textContent = "请先输入完整诗句，再提交核对。";
      dom.dictateInput.focus();
      return;
    }

    const expected = normalizeDictation(question.answer);
    const operations = diffCharacters(expected, actual);
    const correct = operations.every((operation) => operation.type === "match");
    const attempts = Number(state.dictation.attempts[question.id] || 0) + 1;
    state.dictation.attempts[question.id] = attempts;
    state.dictation.feedback = { correct, expected, actual, operations };
    state.dictation.draft = dom.dictateInput.value;
    state.dictation.currentCorrect = correct;

    if (correct) {
      if (!state.dictation.correctIds.includes(question.id)) state.dictation.correctIds.push(question.id);
      resolveRetestIfNeeded(`dictate-${question.id}`);
      removeMistake(`dictate-${question.id}`);
    } else {
      if (!state.dictation.wrongIds.includes(question.id)) state.dictation.wrongIds.push(question.id);
      addMistake({
        id: `dictate-${question.id}`,
        type: "dictation",
        question: question.question,
        questionId: question.id,
        standard: question.answer,
        userAnswer: dom.dictateInput.value
      });
    }
    renderDictation();
    if (!correct) {
      dom.dictateInput.disabled = false;
      dom.dictateInput.focus();
      dom.dictateInput.select();
    }
    scheduleSave();
  }

  function normalizeDictation(text) {
    return String(text || "").trim().replace(/[，。？！、；：,.!?;:\s]/g, "");
  }

  function diffCharacters(expected, actual) {
    const rows = expected.length + 1;
    const cols = actual.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
    for (let col = 0; col < cols; col += 1) matrix[0][col] = col;

    for (let row = 1; row < rows; row += 1) {
      for (let col = 1; col < cols; col += 1) {
        const substitution = matrix[row - 1][col - 1] + (expected[row - 1] === actual[col - 1] ? 0 : 1);
        matrix[row][col] = Math.min(substitution, matrix[row - 1][col] + 1, matrix[row][col - 1] + 1);
      }
    }

    const reversed = [];
    let row = expected.length;
    let col = actual.length;
    while (row > 0 || col > 0) {
      if (row > 0 && col > 0 && expected[row - 1] === actual[col - 1] && matrix[row][col] === matrix[row - 1][col - 1]) {
        reversed.push({ type: "match", expected: expected[row - 1], actual: actual[col - 1] });
        row -= 1;
        col -= 1;
      } else if (row > 0 && col > 0 && matrix[row][col] === matrix[row - 1][col - 1] + 1) {
        reversed.push({ type: "substitute", expected: expected[row - 1], actual: actual[col - 1] });
        row -= 1;
        col -= 1;
      } else if (row > 0 && matrix[row][col] === matrix[row - 1][col] + 1) {
        reversed.push({ type: "missing", expected: expected[row - 1], actual: "" });
        row -= 1;
      } else {
        reversed.push({ type: "extra", expected: "", actual: actual[col - 1] });
        col -= 1;
      }
    }
    return reversed.reverse();
  }

  function renderDictationFeedback() {
    const feedback = state.dictation.feedback;
    if (!feedback) {
      dom.dictateDiffResult.style.display = "none";
      return;
    }
    dom.dictateDiffResult.style.display = "block";
    dom.dictateDiffResult.replaceChildren();
    const heading = document.createElement("div");
    heading.style.cssText = "font-weight:bold;margin-bottom:4px;";
    heading.textContent = feedback.correct ? "默写完全正确" : "请按标记订正后再次提交";
    dom.dictateDiffResult.appendChild(heading);

    const line = document.createElement("div");
    feedback.operations.forEach((operation) => {
      const mark = document.createElement("span");
      mark.style.cssText = "display:inline-block;margin:1px;padding:1px 2px;font-weight:bold;";
      if (operation.type === "match") {
        mark.style.color = "var(--color-primary)";
        mark.textContent = operation.expected;
      } else if (operation.type === "substitute") {
        mark.style.cssText += "color:var(--color-cinnabar);background:#fff1f0;text-decoration:underline;";
        mark.textContent = operation.expected;
        mark.title = `你写了“${operation.actual}”，此处应为“${operation.expected}”`;
      } else if (operation.type === "missing") {
        mark.style.cssText += "color:var(--color-cinnabar);background:#fff1f0;border:1px dashed var(--color-cinnabar);";
        mark.textContent = `＋${operation.expected}`;
        mark.title = `缺少“${operation.expected}”`;
      } else {
        mark.style.cssText += "color:var(--color-cinnabar);background:#fff1f0;text-decoration:line-through;";
        mark.textContent = `－${operation.actual}`;
        mark.title = `多写了“${operation.actual}”`;
      }
      line.appendChild(mark);
    });
    dom.dictateDiffResult.appendChild(line);

    if (!feedback.correct) {
      const legend = document.createElement("div");
      legend.style.cssText = "font-size:11px;color:var(--text-muted);margin-top:5px;";
      legend.textContent = "＋表示漏字，－表示多字，红色下划线表示错字。";
      dom.dictateDiffResult.appendChild(legend);
    }
  }

  function advanceDictation() {
    if (!state.dictation.currentCorrect) return;
    if (state.dictation.retestMistakeId) {
      state.dictation.retestMistakeId = null;
      setReadingMode("read");
      switchTab("tab-mistakes");
      scheduleSave();
      return;
    }

    if (state.dictation.index >= POETRY_DATA.dictations.length - 1) {
      state.dictation.completed = true;
      state.media.status = `默写完成：${state.dictation.correctIds.length} / ${POETRY_DATA.dictations.length} 题已订正掌握`;
      setReadingMode("read");
      renderMedia();
      renderLearningOutcomes();
    } else {
      state.dictation.index += 1;
      state.dictation.draft = "";
      state.dictation.feedback = null;
      state.dictation.currentCorrect = false;
      renderDictation();
      setTimeout(() => dom.dictateInput.focus(), 0);
    }
    scheduleSave();
  }

  function blinkVerseClue(time) {
    const verse = getVerseAtTime(time);
    if (!verse) return;
    seekTo(verse.start);
    const element = byId(`verse-container-${verse.id}`);
    if (!element) return;
    element.classList.add("active");
    element.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function addMistake(item) {
    const existing = state.mistakes.find((mistake) => mistake.id === item.id);
    if (existing) Object.assign(existing, item, { updatedAt: new Date().toISOString() });
    else state.mistakes.push({ ...item, createdAt: new Date().toISOString() });
    renderMistakesUI();
    renderLearningOutcomes();
    scheduleSave();
  }

  function removeMistake(id) {
    const next = state.mistakes.filter((mistake) => mistake.id !== id);
    if (next.length === state.mistakes.length) return false;
    state.mistakes = next;
    renderMistakesUI();
    renderLearningOutcomes();
    scheduleSave();
    return true;
  }

  function resolveRetestIfNeeded(id) {
    if (state.quiz.retestMistakeId === id) {
      removeMistake(id);
      return true;
    }
    if (state.dictation.retestMistakeId === id) {
      removeMistake(id);
      return true;
    }
    return false;
  }

  function renderMistakesUI() {
    const empty = state.mistakes.length === 0;
    dom.mistakesEmptyState.style.display = empty ? "flex" : "none";
    dom.mistakesList.style.display = empty ? "none" : "flex";
    dom.mistakesList.replaceChildren();
    state.mistakes.forEach((mistake) => {
      const card = document.createElement("div");
      card.style.cssText = "background:#fff;border:1.5px solid var(--color-cinnabar);border-radius:10px;padding:12px;font-size:13px;text-align:left;box-shadow:0 4px 10px rgba(181,56,46,.04);";
      const badge = document.createElement("span");
      badge.style.cssText = "background:var(--color-cinnabar-light);border:1px solid var(--color-cinnabar);color:var(--color-cinnabar);font-size:10px;padding:1px 4px;border-radius:3px;font-weight:bold;margin-bottom:6px;display:inline-block;";
      badge.textContent = mistake.type === "dictation" ? "情境默写待订正" : "中考题待复测";
      const question = document.createElement("p");
      question.style.cssText = "font-weight:bold;color:var(--text-dark);margin-bottom:6px;";
      question.textContent = mistake.question;
      card.append(badge, question);

      if (mistake.type === "dictation") {
        const answer = document.createElement("p");
        answer.style.cssText = "font-size:11.5px;color:var(--text-muted);margin-bottom:4px;";
        answer.textContent = `上次作答：${mistake.userAnswer || "未填写"}`;
        const standard = document.createElement("p");
        standard.style.cssText = "font-size:11.5px;color:var(--color-primary);font-weight:bold;";
        standard.textContent = `订正目标：${mistake.standard}`;
        card.append(answer, standard);
      }

      const retry = document.createElement("button");
      retry.className = "btn-resume-play-lux";
      retry.style.cssText = "margin-top:10px;width:100%;padding:6px 12px;font-size:11.5px;background:var(--color-cinnabar);box-shadow:none;";
      retry.textContent = "重新挑战，答对后移除";
      retry.addEventListener("click", () => startMistakeRetest(mistake));
      card.appendChild(retry);
      dom.mistakesList.appendChild(card);
    });
  }

  function startMistakeRetest(mistake) {
    if (mistake.type === "quiz") {
      const index = POETRY_DATA.quizzes.findIndex((question) => question.id === mistake.questionId);
      if (index < 0) return;
      state.quiz.index = index;
      state.quiz.locked = false;
      state.quiz.completed = false;
      state.quiz.retestMistakeId = mistake.id;
      switchTab("tab-quiz");
      showQuizQuestion(index);
    } else {
      const index = POETRY_DATA.dictations.findIndex((question) => question.id === mistake.questionId);
      if (index < 0) return;
      state.dictation.index = index;
      state.dictation.draft = "";
      state.dictation.feedback = null;
      state.dictation.currentCorrect = false;
      state.dictation.retestMistakeId = mistake.id;
      setReadingMode("dictation");
    }
    scheduleSave();
  }

  function checkSavedProgress() {
    const savedTime = Number(state.media.currentTime);
    const duration = getMediaDuration();
    const canResume = savedTime > 1 && savedTime < duration - 0.25;
    const progress = getOutcomeProgress();
    const nextOutcome = ["listen", "evidence", "expression", "review"].find((key) => !progress[key]);
    const hasLearningState = canResume
      || state.media.listenedToEnd
      || state.evidence.attempts > 0
      || Object.keys(state.quiz.results).length > 0
      || Object.keys(state.dictation.attempts).length > 0;
    dom.resumeBanner.style.display = hasLearningState && nextOutcome ? "flex" : "none";
    if (!hasLearningState || !nextOutcome) return;
    const names = { listen: "听读", evidence: "证据归类", expression: "答题表达", review: "默写巩固" };
    const message = dom.resumeBanner.querySelector("span");
    if (message) message.textContent = canResume && nextOutcome === "listen"
      ? `上次听到 ${formatTime(savedTime)}，可从原位置继续`
      : `上次学习已保存，下一步：${names[nextOutcome]}`;
    dom.btnResumeProgress.textContent = canResume && nextOutcome === "listen" ? "继续听" : "继续学习";
    dom.btnResumeProgress.onclick = () => {
      dom.resumeBanner.style.display = "none";
      if (canResume && nextOutcome === "listen") {
        seekTo(savedTime);
        playVideo();
      } else {
        openOutcome(nextOutcome);
      }
    };
  }

  initialize();
})();

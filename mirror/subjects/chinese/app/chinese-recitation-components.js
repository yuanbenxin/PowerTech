window.ChineseApp = window.ChineseApp || {};

(() => {
    const app = window.ChineseApp;
    const { useEffect, useMemo, useRef, useState } = React;

    const MODES = [
        { id: 'recommend', label: '系统推荐' },
        { id: 'reinforce', label: '句子补强' },
        { id: 'fade', label: '线索渐隐' },
        { id: 'visual', label: '看图提取' },
        { id: 'challenge', label: '全文检测' }
    ];

    const HINTS = [
        { level: 0, label: '无提示' },
        { level: 1, label: '画面' },
        { level: 2, label: '首字' },
        { level: 3, label: '关键词' },
        { level: 4, label: '原文' }
    ];

    const CHALLENGE_RATINGS = [
        { id: 'smooth', label: '正确' },
        { id: 'order', label: '次序错误' },
        { id: 'hesitate', label: '卡顿' },
        { id: 'forgot', label: '忘记' }
    ];

    const RATING_LABELS = {
        smooth: '顺利背出',
        hesitate: '有些卡顿',
        hint: '需要提示',
        forgot: '没有背出'
    };

    const REVIEW_INTERVALS = [
        10 * 60 * 1000,
        24 * 60 * 60 * 1000,
        3 * 24 * 60 * 60 * 1000,
        7 * 24 * 60 * 60 * 1000,
        15 * 24 * 60 * 60 * 1000
    ];

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
        player.addEventListener('loadedmetadata', playClip, { once: true });
        player.addEventListener('timeupdate', () => {
            if (player.currentTime >= end - .04) stop();
        });
        player.addEventListener('error', fallBack, { once: true });
        audioRef.current = { player, stop };
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
        const nextReviewAt = scheduledReviews.length
            ? scheduledReviews.sort((left, right) => new Date(left) - new Date(right))[0]
            : status === 'mastered' ? addDays(new Date(), 3) : new Date(now + REVIEW_INTERVALS[0]).toISOString();
        return { mastery, weakCount, dueCount, status, nextReviewAt };
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
        const previous = current || { score: 0, hints: 0, attempts: 0, weak: false, smoothStreak: 0 };
        const now = new Date();
        let score = Number(previous.score || 0);
        if (rating === 'smooth') score = Math.min(4, score + 1);
        if (rating === 'hesitate') score = Math.min(3, score + 0.5);
        if (rating === 'hint') score = Math.max(0, score - 0.25);
        if (rating === 'forgot') score = Math.max(0, score - 1);
        const smoothStreak = rating === 'smooth' ? Number(previous.smoothStreak || 0) + 1 : 0;
        const noHintStreak = rating === 'smooth' && hintLevel === 0 ? Number(previous.noHintStreak || 0) + 1 : 0;
        const weak = rating === 'smooth' ? (score < 2 || (requireWeakStreak && previous.weak && smoothStreak < 2)) : true;
        const inferredStage = previous.intervalStage == null ? Math.min(4, Math.floor(Number(previous.score || 0))) : Number(previous.intervalStage || 0);
        const intervalStage = rating === 'smooth' && hintLevel === 0
            ? Math.min(4, inferredStage + 1)
            : rating === 'smooth'
                ? Math.max(0, inferredStage - 1)
                : 0;
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
        const targetLines = onlyLineIds.length
            ? passage.lines.filter(line => onlyLineIds.includes(line.id))
            : passage.lines;
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

    function DictationWorkspace({ passage, passageProgress, onPersist, onBack }) {
        const lineStats = passageProgress.lineStats || {};
        const [retryLineIds, setRetryLineIds] = useState([]);
        const [questions, setQuestions] = useState(() => buildDictationQuestions(passage));
        const [questionIndex, setQuestionIndex] = useState(0);
        const [answers, setAnswers] = useState({});
        const [complete, setComplete] = useState(false);
        const currentQuestion = questions[questionIndex];
        const currentAnswer = answers[currentQuestion?.id] || { value: '', checked: false };
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
            const currentStat = lineStats[question.lineId] || { score: 0, hints: 0, attempts: 0, weak: false };
            const nextLineStats = {
                ...lineStats,
                [question.lineId]: rateLineStat(currentStat, correct ? 'smooth' : 'forgot', false, 0, correct ? '' : 'dictation')
            };
            const previousErrors = passageProgress.dictation?.errorLineIds || [];
            const errorLineIds = correct
                ? previousErrors.filter(lineId => lineId !== question.lineId)
                : [...new Set([...previousErrors, question.lineId])];
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
                [currentQuestion.id]: { ...currentAnswer, checked: true, correct }
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

        return (
            <section className="cn-dictation fixed inset-0 z-40 flex flex-col overflow-hidden" aria-label={`${passage.title}考试默写`}>
                <header className="cn-dictation-header">
                    <button type="button" className="cn-recitation-back" onClick={onBack} aria-label="返回篇目目录">←</button>
                    <div className="cn-dictation-heading"><span>考试默写</span><strong>{passage.title}</strong></div>
                    <div className="cn-dictation-progress"><span>{retryLineIds.length ? '错题重写' : '模拟默写'}</span><strong>{complete ? '已交卷' : `${questionIndex + 1} / ${questions.length}`}</strong></div>
                </header>

                <div className="cn-dictation-body">
                    <main className="cn-dictation-paper">
                        {complete ? (
                            <section className="cn-dictation-result">
                                <span>{retryLineIds.length ? '错题重写完成' : '本卷完成'}</span>
                                <strong>{correctCount} / {questions.length}</strong>
                                <p>{correctCount === questions.length ? '本轮默写全部正确。' : `还有 ${questions.length - correctCount} 题需要订正，先把错句重新写一遍。`}</p>
                                <div className="cn-dictation-result-actions">
                                    {existingErrors.length ? <button type="button" onClick={() => restartPaper(existingErrors)}>重写错题 {existingErrors.length} 题</button> : null}
                                    <button type="button" onClick={() => restartPaper()}>再做一卷</button>
                                    <button type="button" onClick={onBack}>返回篇目</button>
                                </div>
                            </section>
                        ) : (
                            <>
                                <div className="cn-dictation-question-meta"><span>第 {questionIndex + 1} 题</span><b>{currentQuestion.type}</b></div>
                                <h2>{currentQuestion.prompt}</h2>
                                <label className="cn-dictation-answer" htmlFor="cn-dictation-input">
                                    <span>答题区</span>
                                    <textarea
                                        id="cn-dictation-input"
                                        value={currentAnswer.value}
                                        disabled={currentAnswer.checked}
                                        placeholder="请直接默写原句"
                                        onChange={event => setAnswers(values => ({ ...values, [currentQuestion.id]: { ...currentAnswer, value: event.target.value, checked: false } }))}
                                        autoComplete="off"
                                        autoCapitalize="off"
                                        spellCheck="false"
                                    />
                                </label>
                                {currentAnswer.checked ? (
                                    <div className={`cn-dictation-feedback ${currentAnswer.correct ? 'is-correct' : 'is-wrong'}`}>
                                        <span>{currentAnswer.correct ? '默写正确' : '请订正这一句'}</span>
                                        <strong>{currentQuestion.answer}</strong>
                                        {!currentAnswer.correct ? <small>你的答案：{currentAnswer.value || '未作答'}</small> : null}
                                    </div>
                                ) : null}
                            </>
                        )}
                    </main>

                    <aside className="cn-dictation-sidebar" aria-label="默写题卡">
                        <span>题卡</span>
                        <div className="cn-dictation-number-grid">
                            {questions.map((question, index) => {
                                const answer = answers[question.id];
                                return <button key={question.id} type="button" className={`${index === questionIndex && !complete ? 'is-current' : ''} ${answer?.checked ? answer.correct ? 'is-correct' : 'is-wrong' : ''}`} onClick={() => !complete && setQuestionIndex(index)}>{index + 1}</button>;
                            })}
                        </div>
                        <dl>
                            <div><dt>已核对</dt><dd>{checkedCount}</dd></div>
                            <div><dt>正确</dt><dd>{correctCount}</dd></div>
                            <div><dt>待订正</dt><dd>{Math.max(0, checkedCount - correctCount)}</dd></div>
                        </dl>
                    </aside>
                </div>

                {!complete ? (
                    <footer className="cn-dictation-footer">
                        <button type="button" disabled={questionIndex === 0} onClick={previousQuestion}>上一题</button>
                        {!currentAnswer.checked ? <button type="button" className="is-primary" onClick={checkCurrentAnswer}>提交并核对</button> : <button type="button" className="is-primary" onClick={nextQuestion}>{questionIndex >= questions.length - 1 ? '交卷' : '下一题'}</button>}
                        <button type="button" onClick={onBack}>退出默写</button>
                    </footer>
                ) : null}
            </section>
        );
    }

    function RecitationControlPanel({ mode, hintLevel, canSpeak, onSpeak, onCourseware, coursewareReady, activeStat }) {
        const hint = HINTS.find(item => item.level === hintLevel) || HINTS[0];
        const policy = mode === 'reinforce'
            ? '补强优先'
            : mode === 'fade'
                ? '本轮锁定'
                : '自主提取';
        return (
            <>
                <section className="cn-hint-policy">
                    <h3>当前提示</h3>
                    <div>
                        <span>{policy}</span>
                        <strong>{hint.label}</strong>
                    </div>
                </section>
                <section className="cn-recitation-actions">
                    {hintLevel >= 4 ? <button type="button" disabled={!canSpeak} onClick={onSpeak}>▶ 朗读本句</button> : null}
                    <button type="button" disabled={!coursewareReady} onClick={onCourseware}>↗ 可视化课件</button>
                </section>
                <section className="cn-session-stats">
                    <h3>本句记录</h3>
                    <dl>
                        <div><dt>尝试</dt><dd>{activeStat.attempts || 0} 次</dd></div>
                        <div><dt>无提示</dt><dd>{activeStat.noHintStreak || 0} 连续</dd></div>
                        <div><dt>稳定</dt><dd>{Math.round(Math.min(4, Number(activeStat.intervalStage == null ? Math.floor(activeStat.score || 0) : activeStat.intervalStage)) / 4 * 100)}%</dd></div>
                        <div><dt>弱句</dt><dd>{activeStat.weak ? '是' : '否'}</dd></div>
                    </dl>
                </section>
            </>
        );
    }

    const GUIDED_PHASES = [
        { id: 'arrival', label: '入境' },
        { id: 'read', label: '熟读' },
        { id: 'visual', label: '成像' },
        { id: 'recall', label: '试背' },
        { id: 'link', label: '连接' },
        { id: 'recite', label: '节奏复原' },
        { id: 'consolidate', label: '最后巩固' }
    ];

    const GUIDED_DWELL = { arrival: 12, read: 6, visual: 5, recall: 0, link: 0 };

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

    function GuidedRecitationSession({ passage, linkedCard, initialSession, quickBoost = false, onSessionChange, onRateLine, onFinishReview, onExit }) {
        const safeInitialPhase = quickBoost ? 'consolidate' : GUIDED_PHASES.some(item => item.id === initialSession?.phase) && initialSession.phase !== 'complete' ? initialSession.phase : 'arrival';
        const quickBoostRef = useRef(quickBoost);
        const isQuickBoost = quickBoostRef.current;

        function createLinkRound() {
            const order = [];
            for (let index = 0; index < passage.lines.length - 1; index += 1) {
                order.push({ fromIndex: index, toIndex: index + 1 });
                order.push({ fromIndex: index + 1, toIndex: index });
            }
            for (let index = order.length - 1; index > 0; index -= 1) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
            }
            return { order, cursor: 0 };
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
        const [guidedEvidence, setGuidedEvidence] = useState({ noHintLines: {}, linkSuccesses: 0, linkStumbles: 0 });
        const [consolidation, setConsolidation] = useState(() => isQuickBoost
            ? { targetIndex: Number(initialSession?.lineIndex || 0), reason: initialSession?.priorityReason || '优先补强这一句。', severity: Number(initialSession?.prioritySeverity || 0) }
            : { targetIndex: 0, reason: '用最后一题再确认这一句。', severity: 0 });
        const [completeStage, setCompleteStage] = useState('prompt');
        const lineAudioRef = useRef(null);
        const linkPrompt = linkRound.order[linkRound.cursor] || { fromIndex: 0, toIndex: 1 };
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
            onSessionChange({ phase, lineIndex, updatedAt: new Date().toISOString() });
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
                return { ...issues, [lineId]: { reason, severity } };
            });
        }

        function advanceReadOrVisual() {
            if (lineIndex < passage.lines.length - 1) setLineIndex(index => index + 1);
            else moveTo(phase === 'read' ? 'visual' : 'recall', 0);
        }

        function speakLine() {
            playRecitationLineAudio(passage, activeLine, lineAudioRef);
        }

        function advanceRecallLine() {
            if (lineIndex < passage.lines.length - 1) setLineIndex(index => index + 1);
            else if (passage.lines.length > 1) {
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
                    setGuidedEvidence(evidence => ({ ...evidence, noHintLines: { ...evidence.noHintLines, [activeLine.id]: true } }));
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
                setGuidedEvidence(evidence => ({ ...evidence, linkStumbles: evidence.linkStumbles + 1 }));
                setLinkHint(true);
                return;
            }
            setGuidedEvidence(evidence => ({ ...evidence, linkSuccesses: evidence.linkSuccesses + 1 }));
            const nextCursor = linkRound.cursor + 1;
            if (nextCursor < linkRound.order.length) {
                const nextTargetIndex = linkRound.order[nextCursor].toIndex;
                setLinkRound(round => ({ ...round, cursor: nextCursor }));
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
            setRhythmMistakes(mistakes => ({ ...mistakes, [activeLine.id]: true }));
            recordGuidedIssue(activeLine.id, '节奏词组曾错序', 26);
            setRhythmFeedback('retry');
        }

        function chooseConsolidationTarget() {
            const rankedIssues = Object.entries(guidedIssues)
                .map(([lineId, issue]) => ({ lineId, ...issue }))
                .sort((left, right) => right.severity - left.severity);
            const priorityIssue = rankedIssues[0];
            const issueIndex = passage.lines.findIndex(line => line.id === priorityIssue?.lineId);
            if (issueIndex >= 0) return { targetIndex: issueIndex, reason: priorityIssue.reason, severity: priorityIssue.severity };
            const rhythmIssueId = Object.keys(rhythmMistakes)[0];
            const rhythmIssueIndex = passage.lines.findIndex(line => line.id === rhythmIssueId);
            if (rhythmIssueIndex >= 0) return { targetIndex: rhythmIssueIndex, reason: '节奏词组曾错序', severity: 26 };
            return { targetIndex: Math.floor(Math.random() * passage.lines.length), reason: '用最后一题再确认这一句。', severity: 0 };
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
            const nextRatings = isQuickBoost ? { [consolidationLine.id]: rating } : ratings;
            onFinishReview(nextRatings, Math.max(1, Math.floor((Date.now() - rhythmStartedAt) / 1000)), {
                quickBoost: isQuickBoost,
                priorityLineId: consolidationLine.id,
                priorityReason: consolidation.reason,
                prioritySeverity: consolidation.severity
            });
            setCompleteStage('result');
        }

        const renderOriginalPeek = () => (
            <div className={`cn-original-peek ${peekOriginal ? 'is-revealed' : ''}`}>
                <div className="cn-recall-cue hint-4" aria-hidden={!peekOriginal}>{activeLine.text}</div>
                <button
                    type="button"
                    onPointerDown={() => setPeekOriginal(true)}
                    onPointerUp={() => setPeekOriginal(false)}
                    onPointerCancel={() => setPeekOriginal(false)}
                    onPointerLeave={() => setPeekOriginal(false)}
                    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') setPeekOriginal(true); }}
                    onKeyUp={() => setPeekOriginal(false)}
                >按住查看原文</button>
            </div>
        );

        return (
            <main className={`cn-guided-session phase-${phase}`}>
                <div className="cn-guided-progress" aria-label="背诵阶段">
                    {GUIDED_PHASES.map((item, index) => <span key={item.id} className={`${index === activePhaseIndex ? 'is-active' : ''} ${index < activePhaseIndex ? 'is-complete' : ''}`}><b>{index + 1}</b>{item.label}</span>)}
                </div>

                {phase === 'arrival' ? (
                    <section className="cn-guided-arrival" style={linkedCard?.image ? { backgroundImage: `linear-gradient(90deg, rgba(20,20,17,.76), rgba(20,20,17,.2)), url(${linkedCard.image})` } : undefined}>
                        <div>
                            <span>{passage.dynasty} · {passage.author}</span>
                            <h2>{passage.title}</h2>
                            <p>{passage.memoryPath[0]}</p>
                            <button type="button" disabled={!phaseReady} onClick={() => moveTo('read', 0)}>{phaseReady ? '开始熟读' : `静心入境 ${remaining}`}</button>
                        </div>
                    </section>
                ) : null}

                {phase === 'read' ? (
                    <section className="cn-guided-focus cn-guided-read">
                        <span>熟读 · 第 {lineIndex + 1} {unitLabel}</span>
                        <p>{activeLine.text}</p>
                        {activeLine.meaning ? <div className="cn-guided-meaning"><span>白话</span><p>{activeLine.meaning}</p></div> : null}
                        <div className="cn-guided-rhythm">{activeLine.keywords.map(keyword => <b key={keyword}>{keyword}</b>)}</div>
                        <div><button type="button" onClick={speakLine}>朗读本句</button><button type="button" disabled={!phaseReady} onClick={advanceReadOrVisual}>{phaseReady ? '下一句' : `停留 ${remaining}`}</button></div>
                    </section>
                ) : null}

                {phase === 'visual' ? (
                    <section className="cn-guided-visual" style={activeLine.sceneImage || linkedCard?.image ? { backgroundImage: `linear-gradient(90deg, rgba(18,18,16,.82), rgba(18,18,16,.24)), url(${activeLine.sceneImage || linkedCard.image})` } : undefined}>
                        <div>
                            <span>画面 {lineIndex + 1} / {passage.lines.length}</span>
                            <h3>{activeLine.anchor}</h3>
                            {activeLine.meaning ? <div className="cn-guided-visual-meaning"><span>这句写的是</span><p>{activeLine.meaning}</p></div> : null}
                            <p>{activeLine.cue}</p>
                            <button type="button" disabled={!phaseReady} onClick={advanceReadOrVisual}>{phaseReady ? '记住画面' : `凝视 ${remaining}`}</button>
                        </div>
                    </section>
                ) : null}

                {phase === 'recall' ? (
                    <section className="cn-guided-focus cn-guided-recall">
                        <span>试背 · 第 {lineIndex + 1} {unitLabel}</span>
                        {recallStep === 'rating' ? (
                            <div className="cn-guided-recall-rating">
                                <b>刚才这一句背得怎么样？</b>
                                <p>如实选择，系统会按你的状态决定是否补提示和复背。</p>
                                <div className="cn-guided-rating">
                                    <button type="button" className="is-smooth" onClick={() => handleRecall('smooth')}>一气呵成</button>
                                    <button type="button" onClick={() => handleRecall('hesitate')}>中间卡住</button>
                                    <button type="button" className="is-forgot" onClick={() => handleRecall('forgot')}>没有背出</button>
                                </div>
                            </div>
                        ) : recallHint === 0 ? (
                            <div
                                className="cn-guided-recall-visual is-image-only"
                                aria-label="当前句画面提示"
                                style={activeLine.sceneImage || linkedCard?.image ? { backgroundImage: `url(${activeLine.sceneImage || linkedCard.image})` } : undefined}
                            ><div className="cn-guided-recall-image-prompt"><span>{recallStep === 'retry' ? '遮住提示，再背一次' : '看图起句'}</span><strong>{recallStep === 'retry' ? '现在把刚才那句再完整背一遍' : '看着画面，把这一句完整背出来'}</strong></div></div>
                        ) : recallHint === 1 ? (
                            <div
                                className="cn-guided-recall-visual"
                                aria-label="当前句画面线索"
                                style={activeLine.sceneImage || linkedCard?.image ? { backgroundImage: `linear-gradient(90deg, rgba(15,15,13,.84), rgba(15,15,13,.28)), url(${activeLine.sceneImage || linkedCard.image})` } : undefined}
                            ><span>画面线索</span><strong>{activeLine.anchor}</strong><p>{activeLine.cue}</p></div>
                        ) : recallHint >= 4 ? renderOriginalPeek() : (
                            <div className={`cn-recall-cue hint-${recallHint}`}>{recitationCue(activeLine, recallHint)}</div>
                        )}
                        {recallStep !== 'rating' ? <div className="cn-guided-recall-actions"><button type="button" className="is-smooth" onClick={beginRecallRating}>{recallHint ? '我重新背完了' : '我背完了'}</button><button type="button" onClick={() => handleRecall(recallHint ? 'forgot' : 'hesitate')}>{recallHint >= 4 ? '我还是没背出' : '我卡住了，给提示'}</button></div> : null}
                    </section>
                ) : null}

                {phase === 'link' ? (
                    <section className="cn-guided-focus cn-guided-link">
                        <span>双向随机连接 · {linkRound.cursor + 1} / {linkRound.order.length} · 第 {linkPrompt.fromIndex + 1} → 第 {linkPrompt.toIndex + 1} {unitLabel}</span>
                        <div className="cn-guided-link-scenes">
                            <article className="cn-guided-link-scene is-previous">
                                <div
                                    className="cn-guided-link-image"
                                    aria-label="已给句场景"
                                    style={passage.lines[linkPrompt.fromIndex]?.sceneImage || linkedCard?.image ? { backgroundImage: `url(${passage.lines[linkPrompt.fromIndex]?.sceneImage || linkedCard.image})` } : undefined}
                                />
                                <span>已给句</span>
                                <p>{passage.lines[linkPrompt.fromIndex]?.text}</p>
                            </article>
                            <b className="cn-guided-link-arrow" aria-hidden="true">→</b>
                            <article className={`cn-guided-link-scene is-next ${linkHint ? 'is-revealed' : 'is-concealed'}`}>
                                <div
                                    className="cn-guided-link-image"
                                    aria-label={linkHint ? '要接句场景提示' : '要接句场景尚未显示'}
                                    style={linkHint && (activeLine.sceneImage || linkedCard?.image) ? { backgroundImage: `url(${activeLine.sceneImage || linkedCard.image})` } : undefined}
                                />
                                <span>{linkHint ? '要接句场景' : '要接句'}</span>
                                <strong>{linkHint ? activeLine.anchor : '接出对应句'}</strong>
                                {linkHint ? <p>{activeLine.initials}</p> : null}
                            </article>
                        </div>
                        {phaseReady ? <div className="cn-guided-link-actions"><button type="button" onClick={() => handleLink('smooth')}>连接顺利</button><button type="button" onClick={() => handleLink('hesitate')}>卡在连接处</button></div> : <div className="cn-guided-breath compact"><i></i><b>{remaining}</b></div>}
                    </section>
                ) : null}

                {phase === 'recite' ? (
                    <section className="cn-guided-rhythm-rebuild">
                        <div className="cn-guided-rhythm-heading">
                            <span>节奏复原 · {lineIndex + 1} / {passage.lines.length} · 第 {lineIndex + 1} {unitLabel}</span>
                            <h2>把词组按朗读节奏排好</h2>
                            <p>先听真人朗读，再点按下方词组。排对后跟读一遍，让语序和停顿一起记住。</p>
                        </div>
                        <div className="cn-guided-rhythm-layout">
                            <aside className="cn-guided-rhythm-scene">
                                <div
                                    className="cn-guided-rhythm-image"
                                    aria-label={`${activeLine.anchor}场景图`}
                                    style={activeLine.sceneImage || linkedCard?.image ? { backgroundImage: `url(${activeLine.sceneImage || linkedCard.image})` } : undefined}
                                />
                                <span>画面线索 · {activeLine.anchor}</span>
                                <p>{activeLine.meaning}</p>
                            </aside>
                            <div className={`cn-guided-rhythm-task ${rhythmFeedback ? `is-${rhythmFeedback}` : ''}`}>
                                <span>你的节奏</span>
                                <div className="cn-guided-rhythm-result" aria-live="polite">
                                    {rhythmSelected.length ? rhythmSelected.map((partIndex, index) => <b key={partIndex}>{rhythmParts[partIndex]}{index < rhythmSelected.length - 1 ? <i>/</i> : null}</b>) : <em>按下方词组开始复原</em>}
                                </div>
                                <span>待排词组</span>
                                <div className="cn-guided-rhythm-options">
                                    {rhythmOrder.map(partIndex => <button key={partIndex} type="button" disabled={rhythmSelected.includes(partIndex) || rhythmFeedback === 'correct'} onClick={() => selectRhythmPart(partIndex)}>{rhythmParts[partIndex]}</button>)}
                                </div>
                                {rhythmFeedback === 'retry' ? <p className="cn-guided-rhythm-feedback is-retry">顺序还差一点。结合画面和朗读节奏，再排一次。</p> : null}
                                {rhythmFeedback === 'correct' ? <p className="cn-guided-rhythm-feedback is-correct">节奏正确。现在跟着真人朗读完整说一遍。</p> : null}
                                <div className="cn-guided-rhythm-actions">
                                    <button type="button" className="is-secondary" onClick={speakLine}>听真人朗读</button>
                                    {rhythmFeedback === 'retry' ? <button type="button" onClick={resetRhythmLine}>重新排列</button> : null}
                                    {rhythmFeedback === 'correct' ? <button type="button" onClick={advanceRhythmLine}>{lineIndex < passage.lines.length - 1 ? '下一句' : '进入最后巩固'}</button> : null}
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}

                {phase === 'consolidate' ? (
                    <section className="cn-guided-complete">
                        {completeStage === 'prompt' ? (
                            <div className="cn-guided-consolidation">
                                <span>最后巩固 · 1 / 1</span>
                                <h2>看线索，背出这一句</h2>
                                <p>本轮重点：{consolidation.reason}</p>
                                <div className="cn-guided-consolidation-layout">
                                    <div className="cn-guided-consolidation-image" style={consolidationLine.sceneImage || linkedCard?.image ? { backgroundImage: `url(${consolidationLine.sceneImage || linkedCard.image})` } : undefined} />
                                    <div className="cn-guided-consolidation-cue"><span>白话线索</span><strong>{consolidationLine.meaning}</strong><small>{consolidationLine.anchor}</small></div>
                                </div>
                                <div className="cn-guided-consolidation-actions"><button type="button" className="is-smooth" onClick={() => setCompleteStage('check')}>我背完了，核对</button><button type="button" className="is-secondary" onClick={() => setCompleteStage('check')}>需要提示</button></div>
                            </div>
                        ) : null}
                        {completeStage === 'check' ? (
                            <div className="cn-guided-consolidation cn-guided-consolidation-check">
                                <span>核对原文</span>
                                <h2>{consolidationLine.text}</h2>
                                <p>{consolidation.reason}</p>
                                <div className="cn-guided-rating"><button type="button" className="is-smooth" onClick={() => finishConsolidation('smooth')}>无需提示，背对了</button><button type="button" onClick={() => finishConsolidation('hesitate')}>看提示后才想起</button></div>
                            </div>
                        ) : null}
                        {completeStage === 'result' ? (
                            <div className="cn-guided-result">
                                <span>本轮完成</span>
                                <h2>{passage.title}</h2>
                                {isQuickBoost ? <div className="cn-guided-quick-result"><b>{consolidationLine.text}</b><p>{consolidation.reason}</p><span>这一句已完成一次无原文提取。</span></div> : <div className="cn-guided-result-evidence"><div><b>{Object.keys(guidedEvidence.noHintLines).length}</b><small>无提示背出 / {passage.lines.length} 句</small></div><div><b>{guidedEvidence.linkSuccesses}</b><small>双向连接完成 / {linkRound.order.length} 次</small><i>曾卡 {guidedEvidence.linkStumbles} 次</i></div><div><b>{passage.lines.length - Object.keys(rhythmMistakes).length}</b><small>首次节奏正确 / {passage.lines.length} 句</small></div></div>}
                                <div className="cn-guided-result-next"><span>下一次优先复习</span><strong>第 {consolidation.targetIndex + 1} {unitLabel} · {consolidationLine.text}</strong><p>{consolidation.reason}</p></div>
                                <div className="cn-guided-result-actions"><button type="button" className="is-secondary" onClick={() => setCompleteStage('prompt')}>30 秒补强</button><button type="button" onClick={onExit}>返回篇目</button></div>
                            </div>
                        ) : null}
                    </section>
                ) : null}
            </main>
        );
    }

    function RecitationWorkspace({ cards, frame, initialPassageId, progress, onProgressChange, onClose, onOpenCard }) {
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
        const passageProgress = progress.passages?.[passage.id] || { lineStats: {}, mastery: 0, status: 'learning', weakCount: 0 };
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
        const activeStat = lineStats[activeLine.id] || { score: 0, hints: 0, attempts: 0 };
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
        const modeHint = mode === 'challenge' || mode === 'reinforce' || mode === 'visual'
            ? 0
            : mode === 'fade'
                ? fadeHint
                : recommendedHint;
        const hintLevel = manualHintLevel == null ? modeHint : manualHintLevel;
        const allIndexes = passage.lines.map((_line, index) => index);
        const firstIncompleteIndex = allIndexes.find(index => Number(lineStats[passage.lines[index].id]?.score || 0) < 2);
        const lineGateIndex = firstIncompleteIndex < 0 || firstIncompleteIndex == null ? passage.lines.length - 1 : firstIncompleteIndex;
        const defaultReinforceIndexes = specialPlan.mode === 'reinforce' && specialPlan.lineIndexes.length
            ? specialPlan.lineIndexes
            : buildSmartQueue(passage, lineStats);
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
            if (mode === 'reinforce') setActiveLineIndex(nextSmartQueue[0] ?? lineGateIndex);
            else if (mode === 'fade' && specialPlan.mode === 'fade' && specialPlan.lineIndexes.length) setActiveLineIndex(specialPlan.lineIndexes[0]);
            else if (mode === 'visual') setActiveLineIndex(nextVisualQueue[0] ?? 0);
            else setActiveLineIndex(0);
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
            stageRef.current?.scrollTo({ top: 0, behavior: 'auto' });
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
            return persistLineStats(nextLineStats, { dictation });
        }

        function updateLine(rating) {
            const current = lineStats[activeLine.id] || { score: 0, hints: 0, attempts: 0, weak: false };
            const nextStat = rateLineStat(current, rating, mode === 'reinforce' || current.weak, hintLevel);

            if (mode === 'reinforce' && current.weak) {
                if (rating === 'smooth') {
                    const isDelayedRecheck = current.weakStage === 'waiting' || (current.weakRecheckAt && new Date(current.weakRecheckAt).getTime() <= Date.now());
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
            persistLineStats(nextLineStats, clearsGuidedPriority ? { guidedPriority: null } : {});
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
                const nextLevel = rating === 'smooth'
                    ? currentLevel === 3 ? 2 : 0
                    : rating === 'hint' || rating === 'forgot'
                        ? currentLevel === 0 ? 2 : 3
                        : currentLevel;
                const nextCompleted = {
                    ...fadeCompleted,
                    [activeLine.id]: rating === 'smooth' && currentLevel === 0
                };
                setFadeLevels(levels => ({ ...levels, [activeLine.id]: nextLevel }));
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
                const nextIndex = allIndexes.find(index => index > activeLineIndex && !nextCompleted[passage.lines[index].id])
                    ?? allIndexes.find(index => !nextCompleted[passage.lines[index].id])
                    ?? activeLineIndex;
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
            const nextLineStats = { ...lineStats };
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
            } : { guidedPriority: null };
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
            const nextRatings = { ...challengeRatings, [line.id]: rating };
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
                persistGuidedSession({ phase: 'arrival', lineIndex: 0, quickBoost: false, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
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
            const current = lineStats[lineId] || { score: 0, hints: 0, attempts: 0, weak: false };
            const normalizedRating = rating === 'order' ? 'hesitate' : rating;
            const nextLineStats = {
                ...lineStats,
                [lineId]: rateLineStat(current, normalizedRating, false, hintLevel, errorType || (rating === 'order' ? 'order' : ''))
            };
            persistLineStats(nextLineStats);
        }

        function finishGuidedReview(ratings, seconds, guidedMeta = {}) {
            const nextLineStats = { ...lineStats };
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
            const nextPriority = guidedMeta.quickBoost
                ? ratings[guidedMeta.priorityLineId] === 'smooth' ? null : (passageProgress.guidedPriority || completedPriority)
                : completedPriority;
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
        const visibleLines = passage.lines.map((line, index) => ({ line, index }));
        const smartTaskComplete = mode === 'reinforce' && smartCompleted;
        const regularTraining = mode === 'reinforce' || mode === 'fade';
        const fadeCounts = Object.values(fadeLevels).reduce((counts, level) => ({
            keywords: counts.keywords + (level === 3 ? 1 : 0),
            initials: counts.initials + (level === 2 ? 1 : 0),
            blank: counts.blank + (level === 0 ? 1 : 0)
        }), { keywords: 0, initials: 0, blank: 0 });
        const modeStatus = mode === 'reinforce'
            ? { label: lineLinking ? '上下句连接' : '本轮补强', value: lineLinking ? `第 ${activeLineIndex + 1} 句接回第 ${activeLineIndex} 句` : `${Math.max(1, smartIndexes.indexOf(activeLineIndex) + 1)} / ${Math.max(1, smartIndexes.length)} · ${specialPlan.durationLabel}` }
                : mode === 'fade'
                    ? { label: '按句渐隐', value: `关键词 ${fadeCounts.keywords} · 首字 ${fadeCounts.initials} · 无提示 ${fadeCounts.blank}` }
                    : { label: '专项训练', value: specialPlan.durationLabel };
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
            return index >= 0 && Number(priority?.severity || 0) > 0 ? { ...priority, index } : null;
        }, [passage.id, passageProgress.guidedPriority]);

        if (workspaceView === 'home') {
            return (
                <section className="cn-recitation cn-recitation-home-shell fixed inset-0 z-40 flex flex-col overflow-hidden" aria-label="古诗词文言文背诵系统">
                    <header className="cn-recitation-header flex shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <button type="button" className="cn-recitation-back" onClick={onClose} aria-label="返回语文卡片">←</button>
                            <div className="min-w-0">
                                <div className="text-[10px] font-bold tracking-[0.24em] text-[#9b332b]">篇目目录</div>
                                <h1 className="truncate text-base font-bold text-[#1c1c1c] sm:text-xl">古诗词·文言文背诵</h1>
                            </div>
                        </div>
                        <strong className="cn-recitation-count">{library.length} 篇</strong>
                    </header>

                    <div className="cn-recitation-home">
                        <aside className="cn-recitation-home-list" aria-label="背诵篇目">
                            <div className="cn-home-catalog-tools">
                                <label className="cn-home-book-select">
                                    <span>选择篇目</span>
                                    <select value={activeHomeBookLabel} onChange={event => selectHomeBook(event.target.value)} aria-label="选择册次">
                                        {homeBookLabels.map(bookLabel => <option key={bookLabel} value={bookLabel}>{bookLabel}</option>)}
                                    </select>
                                </label>
                                <label className="cn-home-search">
                                    <span className="sr-only">搜索篇目</span>
                                    <input value={homeQuery} onChange={event => setHomeQuery(event.target.value)} placeholder="搜索篇目或作者" aria-label="搜索篇目或作者" />
                                </label>
                            </div>
                            <div className="cn-home-list-heading"><span>{homeQuery ? '搜索结果' : '本册篇目'}</span><b>{homePassages.length} 篇</b></div>
                            <div className="cn-home-passage-scroll">
                                {homePassages.map(item => {
                                    const itemProgress = progress.passages?.[item.id];
                                    const index = library.findIndex(entry => entry.id === item.id);
                                    return (
                                        <button key={item.id} type="button" className={`cn-home-passage ${getHomePassageTitleSize(item.title)} ${item.id === passage.id ? 'is-active' : ''}`} onClick={() => setSelectedId(item.id)}>
                                            <span>{String(index + 1).padStart(2, '0')}</span>
                                            <div><strong>{item.title}</strong><small>{item.dynasty} · {item.author}</small></div>
                                            <b>{app.formatRecitationStatus(progress, item.id)}</b>
                                        </button>
                                    );
                                })}
                                {!homePassages.length ? <div className="cn-home-empty-search">没有匹配的篇目</div> : null}
                            </div>
                        </aside>

                        <main className="cn-recitation-home-hero">
                            <div className="cn-home-hero-art" aria-hidden="true" style={homeHeroImage ? { backgroundImage: `url(${homeHeroImage})` } : undefined} />
                            <div className="cn-home-hero-content">
                                <div className="cn-home-eyebrow">
                                    <span>{passage.bookLabel} · {passage.genre}</span>
                                    <b>{app.formatRecitationStatus(progress, passage.id)} · {passageProgress.mastery || 0}%</b>
                                </div>
                                <h2>{passage.title}</h2>
                                <p>{passage.dynasty} · {passage.author}</p>
                                <div className="cn-home-progress-summary">
                                    <span>本篇学习路径</span>
                                    <div className="cn-home-memory-path">{passage.memoryPath.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, '0')}</b>{item}</span>)}</div>
                                </div>
                                {canResumeGuided ? <div className="cn-home-resume-note">上次停在：{GUIDED_PHASES.find(item => item.id === guidedSession.phase)?.label || '背诵中'} · 第 {Number(guidedSession.lineIndex || 0) + 1} 句</div> : null}
                                {priorityReview && !canResumeGuided ? <div className="cn-home-priority"><span>下次优先复习</span><strong>第 {priorityReview.index + 1} {trainingUnitLabel} · {passage.lines[priorityReview.index]?.text}</strong><small>{priorityReview.reason}</small></div> : null}
                                <div className={`cn-home-actions ${priorityReview && !canResumeGuided ? 'has-priority' : ''}`}>
                                    <button type="button" className="is-primary" onClick={() => setWorkspaceView('special')}>开始默写训练</button>
                                    <button type="button" onClick={startGuidedSession}>{canResumeGuided ? '继续今日背诵' : '开始今日背诵'}</button>
                                    {priorityReview && !canResumeGuided ? <button type="button" className="cn-home-priority-action" onClick={startPriorityBoost}>先补第 {priorityReview.index + 1} {trainingUnitLabel}（30 秒）</button> : null}
                                </div>
                                <button type="button" className="cn-home-card-link" disabled={!linkedCard} onClick={() => linkedCard && onOpenCard(linkedCard.id)}>查看关联可视化卡片</button>
                            </div>
                        </main>
                    </div>
                </section>
            );
        }

        if (workspaceView === 'guided') {
            return (
                <section className="cn-recitation cn-recitation-guided-shell fixed inset-0 z-40 flex flex-col overflow-hidden" aria-label={`${passage.title}沉浸背诵`}>
                    <header className="cn-guided-header">
                        <button type="button" className="cn-recitation-back" onClick={() => setWorkspaceView('home')} aria-label="返回篇目目录">←</button>
                        <div><span>今日背诵</span><strong>{passage.title}</strong></div>
                    </header>
                    <GuidedRecitationSession
                        passage={passage}
                        linkedCard={linkedCard}
                        initialSession={guidedSession}
                        quickBoost={Boolean(guidedSession.quickBoost)}
                        onSessionChange={persistGuidedSession}
                        onRateLine={rateGuidedLine}
                        onFinishReview={finishGuidedReview}
                        onExit={() => setWorkspaceView('home')}
                    />
                </section>
            );
        }

        if (workspaceView === 'special') {
            return (
                <DictationWorkspace
                    passage={passage}
                    passageProgress={passageProgress}
                    onPersist={persistDictationProgress}
                    onBack={() => setWorkspaceView('home')}
                />
            );
        }

        return (
            <section className="cn-recitation fixed inset-0 z-40 flex flex-col overflow-hidden" aria-label="古诗词文言文背诵系统">
                <header className="cn-recitation-header flex shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button type="button" className="cn-recitation-back" onClick={() => setWorkspaceView('home')} aria-label="返回篇目目录">←</button>
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold tracking-[0.24em] text-[#9b332b]">专项训练</div>
                            <h1 className="truncate text-base font-bold text-[#1c1c1c] sm:text-xl">{passage.title}</h1>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-[#595348]">
                        <span className="hidden sm:inline">本地保存</span>
                        <strong className="cn-recitation-count">{library.length} 篇</strong>
                    </div>
                </header>

                <nav className="cn-recitation-modes no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-3 py-2 sm:px-6" aria-label="背诵模式">
                    {MODES.map(item => (
                        <button key={item.id} type="button" className={mode === item.id ? 'is-active' : ''} onClick={() => setMode(item.id)}>{item.label}</button>
                    ))}
                </nav>

                <div className={`cn-recitation-body grid min-h-0 flex-1 ${portrait ? 'grid-cols-1' : compact ? 'grid-cols-[210px_minmax(0,1fr)]' : mode === 'challenge' || mode === 'visual' || mode === 'recommend' ? 'grid-cols-[240px_minmax(0,1fr)]' : 'grid-cols-[240px_minmax(0,1fr)_300px]'}`}>
                    <aside className={`cn-recitation-library no-scrollbar min-h-0 overflow-y-auto ${portrait ? 'flex max-h-[94px] gap-2 overflow-x-auto overflow-y-hidden' : ''}`} aria-label="背诵篇目">
                        {library.map(item => {
                            const itemProgress = progress.passages?.[item.id];
                            const selected = item.id === passage.id;
                            const task = describePassageSpecialTask(item, itemProgress);
                            return (
                                <button key={item.id} type="button" className={`cn-recitation-passage ${selected ? 'is-active' : ''}`} onClick={() => setSelectedId(item.id)}>
                                    <span className="cn-recitation-passage-book">{item.bookLabel}</span>
                                    <strong>{item.title}</strong>
                                    <span className={`cn-recitation-passage-state ${statusTone(itemProgress?.status)}`}>{app.formatRecitationStatus(progress, item.id)} · {itemProgress?.mastery || 0}%</span>
                                    <small className="cn-recitation-passage-task">{task.summary} · {task.durationLabel}</small>
                                </button>
                            );
                        })}
                    </aside>

                    <main ref={stageRef} className="cn-recitation-stage no-scrollbar min-h-0 overflow-y-auto">
                        <div className="cn-recitation-title-row">
                            <div>
                                <span>{passage.dynasty} · {passage.author}</span>
                                <h2>{passage.title}</h2>
                            </div>
                            <div className={`cn-recitation-mastery ${statusTone(summaryStatus)}`}>
                                <strong>{passageProgress.mastery || 0}%</strong>
                                <span>{app.formatRecitationStatus(progress, passage.id)}</span>
                            </div>
                        </div>

                        {mode === 'recommend' ? (
                            <section className={`cn-special-recommend is-${specialPlan.mode}`}>
                                <div className="cn-special-recommend-kicker">系统推荐</div>
                                <strong>{specialPlan.mode === 'challenge' ? '先做一次全文检测' : specialPlan.mode === 'fade' ? '用线索渐隐补稳记忆' : specialPlan.mode === 'visual' ? '用画面做一次无序提取' : '先补强最需要的一句'}</strong>
                                <p>{specialPlan.reason}</p>
                                {specialPlan.lineIndexes.length ? (
                                    <div className="cn-special-recommend-lines">
                                        {specialPlan.lineIndexes.map(index => <span key={passage.lines[index].id}>第 {index + 1} {trainingUnitLabel}</span>)}
                                    </div>
                                ) : null}
                                <dl>
                                    <div><dt>预计</dt><dd>{specialPlan.durationLabel}</dd></div>
                                    <div><dt>完成后</dt><dd>{specialPlan.nextAction}</dd></div>
                                </dl>
                                <div className="cn-special-recommend-actions">
                                    <button type="button" onClick={startRecommendedTask}>{specialPlan.mode === 'challenge' ? '开始全文检测' : specialPlan.mode === 'visual' ? '开始看图提取' : '开始本轮补强'}</button>
                                    <button type="button" onClick={() => setMode('reinforce')}>自选句子补强</button>
                                </div>
                            </section>
                        ) : mode === 'challenge' ? (
                            <section className={`cn-challenge cn-challenge-${challengePhase}`}>
                                {challengePhase === 'ready' ? (
                                    <div className="cn-challenge-ready">
                                        <span>全文挑战</span>
                                        <strong>{passage.lines.length} {trainingUnitLabel}</strong>
                                        <b>准备</b>
                                        <button type="button" onClick={startChallenge}>开始整篇背诵</button>
                                    </div>
                                ) : null}
                                {challengePhase === 'reciting' ? (
                                    <div className="cn-challenge-reciting">
                                        <span>背诵进行中</span>
                                        <strong>{formatDuration(challengeSeconds)}</strong>
                                        <div className="cn-challenge-pulse" aria-hidden="true"><i></i><i></i><i></i></div>
                                        <button type="button" onClick={finishChallengeRecitation}>完成背诵</button>
                                    </div>
                                ) : null}
                                {challengePhase === 'review' ? (
                                    <div className="cn-challenge-review">
                                        <header><span>逐句核对</span><strong>{challengeReviewIndex + 1} / {passage.lines.length}</strong></header>
                                        <div className="cn-challenge-review-list">
                                            <article key={challengeReviewLine.id}>
                                                <b>{challengeReviewIndex + 1}</b>
                                                <p>{challengeReviewLine.text}</p>
                                                <div>
                                                    {CHALLENGE_RATINGS.map(item => (
                                                        <button key={item.id} type="button" onClick={() => rateChallengeLine(item.id)}>{item.label}</button>
                                                    ))}
                                                </div>
                                            </article>
                                        </div>
                                    </div>
                                ) : null}
                                {challengePhase === 'result' ? (
                                    <div className="cn-challenge-result">
                                        <span>挑战完成</span>
                                        <strong>{formatDuration(challengeSeconds)}</strong>
                                        <dl>
                                            <div><dt>正确</dt><dd>{challengeSummary.smooth || 0}</dd></div>
                                            <div><dt>次序</dt><dd>{challengeSummary.order || 0}</dd></div>
                                            <div><dt>卡顿</dt><dd>{challengeSummary.hesitate || 0}</dd></div>
                                            <div><dt>忘记</dt><dd>{challengeSummary.forgot || 0}</dd></div>
                                        </dl>
                                        {(challengeSummary.forgot || challengeSummary.order || challengeSummary.hesitate) ? (
                                            <>
                                                <p className="cn-challenge-followup">检测到薄弱点，已生成下一条句子补强任务。</p>
                                                <button type="button" onClick={startChallengeFollowUp}>去做 30 秒补强</button>
                                            </>
                                        ) : (
                                            <>
                                                <p className="cn-challenge-followup">全文无明显问题，下一步适合用画面做随机提取。</p>
                                                <button type="button" onClick={() => setMode('visual')}>进入看图提取</button>
                                            </>
                                        )}
                                        <button type="button" className="cn-challenge-secondary" onClick={startChallenge}>再次检测</button>
                                    </div>
                                ) : null}
                            </section>
                        ) : mode === 'visual' ? (
                            <section className={`cn-image-recall ${visualCompleted ? 'is-complete' : ''}`}>
                                {visualCompleted ? (
                                    <div className="cn-image-mode-complete">
                                        <span>看图背句</span>
                                        <strong>本轮画面已全部通过</strong>
                                        <p>重新打乱后，可以再做一轮无序提取。</p>
                                        <button type="button" onClick={restartVisualRecall}>重新打乱练习</button>
                                    </div>
                                ) : (
                                    <>
                                        <header className="cn-image-recall-heading">
                                            <div><span>随机画面</span><strong>看图背出对应句</strong></div>
                                            <b>{passage.lines.length - visualQueue.length + 1} / {passage.lines.length}</b>
                                        </header>
                                        <div
                                            className="cn-image-recall-scene"
                                            role="img"
                                            aria-label={`第 ${activeLineIndex + 1} ${trainingUnitLabel}的场景图`}
                                            style={activeLine.sceneImage || linkedCard?.image ? { backgroundImage: `url(${activeLine.sceneImage || linkedCard.image})` } : undefined}
                                        />
                                        <div className="cn-image-recall-help" aria-live="polite">
                                            {hintLevel >= 4 ? (
                                                <div className={`cn-original-peek ${peekOriginal ? 'is-revealed' : ''}`}>
                                                    <div className="cn-recall-cue hint-4" aria-hidden={!peekOriginal}>{activeLine.text}</div>
                                                    <button
                                                        type="button"
                                                        onPointerDown={() => setPeekOriginal(true)}
                                                        onPointerUp={() => setPeekOriginal(false)}
                                                        onPointerCancel={() => setPeekOriginal(false)}
                                                        onPointerLeave={() => setPeekOriginal(false)}
                                                        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') setPeekOriginal(true); }}
                                                        onKeyUp={() => setPeekOriginal(false)}
                                                    >按住查看原文</button>
                                                </div>
                                            ) : hintLevel >= 2 ? <strong>{activeLine.initials}</strong> : <span>先根据画面回想，不显示题目顺序与原文</span>}
                                            {feedback ? <small>{feedback}</small> : null}
                                        </div>
                                        <div className="cn-self-check cn-image-recall-actions" aria-label="看图背句自查">
                                            <button type="button" className="is-smooth" onClick={() => updateLine('smooth')}>顺利背出</button>
                                            <button type="button" onClick={() => updateLine('hesitate')}>有些卡顿</button>
                                            <button type="button" onClick={() => updateLine('hint')}>{hintLevel >= 2 ? '再给提示' : '提示首字'}</button>
                                            <button type="button" className="is-forgot" onClick={() => updateLine('forgot')}>没有背出</button>
                                        </div>
                                    </>
                                )}
                            </section>
                        ) : smartTaskComplete ? (
                            <section className="cn-smart-complete">
                                <span>句子补强</span>
                                <strong>本轮补强完成</strong>
                                <dl>
                                    <div><dt>已补强</dt><dd>{Math.max(1, defaultReinforceIndexes.length)} 句</dd></div>
                                    <div><dt>当前掌握</dt><dd>{passageProgress.mastery || 0}%</dd></div>
                                    <div><dt>下一步</dt><dd>{passageProgress.mastery >= 85 ? '全文检测' : '返回系统推荐'}</dd></div>
                                </dl>
                                <div>
                                    <button type="button" onClick={() => setMode(passageProgress.mastery >= 85 ? 'challenge' : 'recommend')}>{passageProgress.mastery >= 85 ? '去做全文检测' : '查看下一条建议'}</button>
                                    <button type="button" onClick={() => setWorkspaceView('home')}>返回篇目</button>
                                </div>
                            </section>
                        ) : (
                            <>
                                <div className={`cn-mode-status mode-${mode}`}>
                                    <span>{modeStatus.label}</span>
                                    <strong>{modeStatus.value}</strong>
                                </div>

                                <div className={`cn-memory-path ${hintLevel === 0 ? 'is-concealed' : ''}`} aria-label={hintLevel === 0 ? '记忆路径已隐藏' : '记忆路径'}>
                                    {passage.memoryPath.map((item, index) => <span key={item}><b>{index + 1}</b>{hintLevel === 0 ? '记忆节点' : item}</span>)}
                                </div>

                                <div className="cn-recitation-lines" aria-label="原文句序">
                                    {visibleLines.map(({ line, index }) => {
                                        const stat = lineStats[line.id];
                                        const locked = false;
                                        return (
                                            <button key={line.id} type="button" disabled={locked} className={`${index === activeLineIndex ? 'is-active' : ''} ${stat?.weak ? 'is-weak' : ''}`} onClick={() => selectLine(index)}>
                                                <span>{index + 1}</span>
                                                <strong>{index === activeLineIndex ? '当前句' : `第 ${index + 1} 句`}</strong>
                                                <small>{lineStudyStatus(stat)}</small>
                                            </button>
                                        );
                                    })}
                                </div>

                                <section className="cn-recall-surface" aria-live="polite">
                                    <div className="cn-recall-index">第 {activeLineIndex + 1} {trainingUnitLabel} · {lineLinking ? '上下句连接' : hintLevel === 0 && !showVisual ? '先背诵，再自评' : activeLine.anchor}</div>
                                    {showVisual || hintLevel === 1 ? (
                                        <div className="cn-visual-anchor" style={activeLine.sceneImage || linkedCard?.image ? { backgroundImage: `linear-gradient(90deg, rgba(15,15,13,.82), rgba(15,15,13,.2)), url(${activeLine.sceneImage || linkedCard.image})` } : undefined}>
                                            <span>画面锚点</span>
                                            <strong>{activeLine.anchor}</strong>
                                            <p>{activeLine.cue}</p>
                                        </div>
                                    ) : null}
                                    {lineLinking ? (
                                        <div className="cn-line-link-cue">
                                            <span>上一句</span>
                                            <strong>{passage.lines[activeLineIndex - 1]?.text}</strong>
                                            <b>接出第 {activeLineIndex + 1} {trainingUnitLabel}</b>
                                        </div>
                                    ) : hintLevel >= 4 ? (
                                        <div className={`cn-original-peek ${peekOriginal ? 'is-revealed' : ''}`}>
                                            <div className="cn-recall-cue hint-4" aria-hidden={!peekOriginal}>{recitationCue(activeLine, hintLevel)}</div>
                                            <button
                                                type="button"
                                                onPointerDown={() => setPeekOriginal(true)}
                                                onPointerUp={() => setPeekOriginal(false)}
                                                onPointerCancel={() => setPeekOriginal(false)}
                                                onPointerLeave={() => setPeekOriginal(false)}
                                                onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') setPeekOriginal(true); }}
                                                onKeyUp={() => setPeekOriginal(false)}
                                            >按住查看原文</button>
                                        </div>
                                    ) : <div className={`cn-recall-cue hint-${hintLevel}`}>{recitationCue(activeLine, hintLevel)}</div>}
                                    {feedback ? <div className="cn-recall-feedback">本次：{feedback}</div> : null}
                                </section>

                                <div className="cn-self-check" aria-label="背诵自查">
                                    <button type="button" className="is-smooth" onClick={() => updateLine('smooth')}>顺利背出</button>
                                    <button type="button" onClick={() => updateLine('hesitate')}>有些卡顿</button>
                                    <button type="button" onClick={() => updateLine('hint')}>{mode === 'fade' ? '本轮卡住' : '需要提示'}</button>
                                    <button type="button" className="is-forgot" onClick={() => updateLine('forgot')}>{mode === 'fade' ? '本轮未背出' : '没有背出'}</button>
                                </div>
                                {compact || portrait ? (
                                    <div className="cn-recitation-controls cn-controls-inline">
                                        <RecitationControlPanel
                                            mode={mode}
                                            hintLevel={hintLevel}
                                            canSpeak={peekOriginal}
                                            onSpeak={speakActiveLine}
                                            onCourseware={openLinkedCourseware}
                                            coursewareReady={coursewareUnlocked}
                                            activeStat={activeStat}
                                        />
                                    </div>
                                ) : null}
                            </>
                        )}
                    </main>

                    {!compact && !portrait && regularTraining ? (
                        <aside className="cn-recitation-controls no-scrollbar min-h-0 overflow-y-auto">
                            <RecitationControlPanel
                                mode={mode}
                                hintLevel={hintLevel}
                                canSpeak={peekOriginal}
                                onSpeak={speakActiveLine}
                                onCourseware={openLinkedCourseware}
                                coursewareReady={coursewareUnlocked}
                                activeStat={activeStat}
                            />
                        </aside>
                    ) : null}
                </div>
            </section>
        );
    }

    function RecitationEntry({ onOpen, frame, dueCount }) {
        return (
            <button type="button" className={`cn-recitation-entry ${frame.isPortrait ? 'is-portrait' : ''}`} onClick={onOpen} aria-label="打开背诵训练">
                <span className="cn-recitation-seal">背</span>
                <span className="cn-recitation-entry-label">背诵训练</span>
                {dueCount > 0 ? <span className="cn-recitation-due">{dueCount}</span> : null}
            </button>
        );
    }

    Object.assign(app, { RecitationWorkspace, RecitationEntry });
})();

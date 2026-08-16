window.ChineseApp = window.ChineseApp || {};

(() => {
    const app = window.ChineseApp;
    const { useEffect, useMemo, useState } = app;

    function MasterpiecePracticeEntry({ frame, onOpen }) {
        return (
            <button type="button" className={`cn-masterpiece-practice-entry ${frame.isPortrait ? 'is-portrait' : ''}`} onClick={onOpen} aria-label="打开西游记读图精练">
                <span className="cn-masterpiece-practice-seal">练</span>
                <span className="cn-masterpiece-practice-label">西游精练</span>
            </button>
        );
    }

    function XiyoujiPracticeWorkspace({ onClose }) {
        const [payload, setPayload] = useState(null);
        const [loadError, setLoadError] = useState('');
        const [progress, setProgress] = useState(() => app.loadMasterpiecePracticeProgress());
        const [view, setView] = useState('home');
        const [sessionMode, setSessionMode] = useState('smart');
        const [queue, setQueue] = useState([]);
        const [index, setIndex] = useState(0);
        const [selectedChoiceId, setSelectedChoiceId] = useState('');
        const [result, setResult] = useState(null);
        const [sessionResults, setSessionResults] = useState([]);

        useEffect(() => {
            let cancelled = false;
            app.loadMasterpiecePractice('journey').then(data => {
                if (!cancelled) setPayload(data);
            }).catch(error => {
                if (!cancelled) setLoadError(error.message || '读图题库加载失败。');
            });
            return () => { cancelled = true; };
        }, []);

        const allQuestions = useMemo(() => payload ? payload.cards.filter(card => card.visualReviewStatus === 'verified').flatMap(card => card.questions.map(question => ({ ...question, card }))) : [], [payload]);
        const stats = useMemo(() => {
            const records = progress.questions || {};
            const practiced = Object.keys(records).length;
            const weak = Object.values(records).filter(item => item.status !== 'correct' || item.mastery < 80).length;
            const mastered = Object.values(records).filter(item => item.mastery >= 80).length;
            return { practiced, weak, mastered };
        }, [progress]);
        const current = queue[index] || null;
        const choices = useMemo(() => current ? app.buildMasterpieceChoices(current, allQuestions) : [], [current, allQuestions]);

        const startSession = mode => {
            const nextQueue = app.pickPracticeQuestions(payload, progress, 5, mode);
            setSessionMode(mode);
            setQueue(nextQueue);
            setIndex(0);
            setSelectedChoiceId('');
            setResult(null);
            setSessionResults([]);
            setView('session');
        };

        const submitChoice = () => {
            if (!current || !selectedChoiceId) return;
            const nextResult = app.gradeMasterpieceChoice(choices, selectedChoiceId);
            setResult(nextResult);
            setProgress(previous => app.updateMasterpieceProgress(previous, current, nextResult));
            setSessionResults(previous => [...previous, nextResult]);
        };

        const advance = () => {
            if (index + 1 >= queue.length) {
                setView('result');
                return;
            }
            setIndex(value => value + 1);
            setSelectedChoiceId('');
            setResult(null);
        };

        if (loadError) return <section className="cn-masterpiece-practice fixed inset-0 z-40 grid place-items-center p-6"><div className="cn-practice-load-state"><strong>无法打开读图精练</strong><p>{loadError}</p><button type="button" onClick={onClose}>返回西游记</button></div></section>;
        if (!payload) return <section className="cn-masterpiece-practice fixed inset-0 z-40 grid place-items-center p-6"><div className="cn-practice-load-state"><strong>正在整理《西游记》题图...</strong></div></section>;

        if (view === 'home') {
            const hero = payload.cards.find(card => card.theme === '三打白骨精') || payload.cards[0];
            return (
                <section className="cn-masterpiece-practice fixed inset-0 z-40 overflow-y-auto" aria-label="西游记读图精练">
                    <header className="cn-practice-header"><button type="button" onClick={onClose} aria-label="返回西游记专题">←</button><div><span>名著导读 · 本书精练</span><strong>西游记读图精练</strong></div><b>{payload.cards.length} 图</b></header>
                    <main className="cn-practice-home">
                        <section className="cn-practice-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(18, 20, 18, .94) 0%, rgba(18, 20, 18, .62) 47%, rgba(18, 20, 18, .08) 100%), url(${hero.image})` }}>
                            <div><span>以图为证据 · 追问原著细节</span><h1>不只认画面，<br />还要读懂故事。</h1><p>从画面线索追问人物来历、情节因果、法宝作用和结局；选择后立即回看对应的原著要点。</p><button type="button" onClick={() => startSession('smart')}>开始今日精练</button></div>
                        </section>
                        <section className="cn-practice-stat-grid" aria-label="练习进度"><div><b>{allQuestions.length}</b><span>道题</span></div><div><b>{stats.practiced}</b><span>已作答</span></div><div><b>{stats.weak}</b><span>待补强</span></div><div><b>{stats.mastered}</b><span>已掌握</span></div></section>
                        <section className="cn-practice-home-grid">
                            <article><span>01</span><h2>全书新题</h2><p>以图片为线索，练人物关系、事件因果、法宝作用和情节结果。</p><button type="button" onClick={() => startSession('smart')}>练 5 题</button></article>
                            <article><span>02</span><h2>错题复练</h2><p>优先回到人物来历、情节转折和法宝用法容易混淆的题目。</p><button type="button" onClick={() => startSession('review')} disabled={!stats.weak}>复练薄弱题</button></article>
                            <article><span>03</span><h2>章节地图</h2><p>已导入 {payload.cards.length} 张横版情节图，当前已逐图核验 {allQuestions.length} 道题目。</p><button type="button" onClick={() => startSession('smart')}>从已核验题开始</button></article>
                        </section>
                    </main>
                </section>
            );
        }

        if (view === 'result') {
            const correct = sessionResults.filter(item => item.status === 'correct').length;
            return (
                <section className="cn-masterpiece-practice fixed inset-0 z-40 overflow-y-auto" aria-label="西游记读图精练结果">
                    <header className="cn-practice-header"><button type="button" onClick={() => setView('home')} aria-label="返回读图精练">←</button><div><span>本轮完成</span><strong>西游记读图精练</strong></div><b>{queue.length} 题</b></header>
                    <main className="cn-practice-result"><span>本轮成绩</span><strong>{correct} / {queue.length}</strong><p>{correct === queue.length ? '本轮全部答对，下一轮将推进到新题。' : '错题已进入复练队列，下一轮会优先出现。'}</p><div><button type="button" onClick={() => startSession(sessionMode)}>再练 5 题</button><button type="button" onClick={() => startSession('review')}>复练薄弱题</button><button type="button" onClick={() => setView('home')}>返回目录</button></div></main>
                </section>
            );
        }

        return (
            <section className="cn-masterpiece-practice fixed inset-0 z-40 flex flex-col" aria-label="西游记读图精练答题">
                <header className="cn-practice-header"><button type="button" onClick={() => setView('home')} aria-label="退出本轮练习">←</button><div><span>读图练习 · {current.type}</span><strong>西游记读图精练</strong></div><b>{index + 1} / {queue.length}</b></header>
                <main className="cn-practice-session">
                    <section className="cn-practice-art"><img src={current.card.image} alt={current.card.theme} /><span>{`画面 · ${current.card.theme}`}</span></section>
                    <section className="cn-practice-question" aria-live="polite"><div className="cn-practice-question-meta"><span>{current.type}</span><b>看图选择</b></div><h1>{current.prompt}</h1>{result ? <p className={`cn-practice-choice-result is-${result.status}`}>{result.status === 'correct' ? '回答正确，继续下一题。' : '正确答案已用绿色标出。'}</p> : null}<div className="cn-practice-options" role="radiogroup" aria-label="选择答案">{choices.map((choice, choiceIndex) => <button key={choice.id} type="button" role="radio" aria-checked={selectedChoiceId === choice.id} disabled={Boolean(result)} onClick={() => setSelectedChoiceId(choice.id)} className={`${selectedChoiceId === choice.id ? 'is-selected' : ''} ${result && choice.correct ? 'is-correct' : ''} ${result && selectedChoiceId === choice.id && !choice.correct ? 'is-wrong' : ''}`}><b>{String.fromCharCode(65 + choiceIndex)}</b><span>{choice.text}</span></button>)}</div></section>
                </main>
                <footer className="cn-practice-footer"><span>{result ? `读图要点：${current.explanation}` : '请选择一个最符合题意的答案'}</span>{result ? <button type="button" onClick={advance}>{index + 1 >= queue.length ? '查看本轮结果' : '下一题'}</button> : <button type="button" onClick={submitChoice} disabled={!selectedChoiceId}>确认选择</button>}</footer>
            </section>
        );
    }

    Object.assign(app, { MasterpiecePracticeEntry, XiyoujiPracticeWorkspace });
})();

window.ChineseApp = window.ChineseApp || {};

(() => {
    const app = window.ChineseApp;
    const { useState } = app;

    const BAIGUJING_STORY = [
        {
            id: 'watch',
            label: '妖怪设局',
            title: '白骨精窥见取经人',
            summary: '白骨精得知唐僧肉能长生，躲在山林中观察师徒，决定用伪装逐步接近。',
            observe: ['看白骨精藏身的位置：她先观察，再设局。', '看取经队伍的行进状态：危险尚未显露。', '这一幕是整场误会的起点。'],
            memory: '白骨精因觊觎唐僧肉而设计伪装接近师徒。'
        },
        {
            id: 'maiden',
            label: '村姑送斋',
            title: '悟空第一次识破伪装',
            summary: '白骨精变作村姑送斋。悟空看出妖气，唐僧却只看见一名无辜女子。',
            observe: ['悟空依据火眼金睛判断妖怪。', '唐僧只根据眼前所见作判断。', '两人的判断差异由此出现。'],
            memory: '悟空能识妖，唐僧却被表象迷惑。'
        },
        {
            id: 'old-woman',
            label: '老妇寻女',
            title: '师徒误会逐步加深',
            summary: '白骨精又变作老妇寻找女儿，借唐僧的善良扩大他对悟空的误会。',
            observe: ['老妇身份是第二层伪装。', '妖怪利用的是唐僧的同情心。', '悟空坚持除妖，冲突并未解除。'],
            memory: '第二次伪装让唐僧更相信悟空伤害无辜。'
        },
        {
            id: 'old-man',
            label: '老翁寻亲',
            title: '第三次伪装被当场揭破',
            summary: '白骨精第三次变成老翁寻亲。悟空再次出手，终于使妖怪现出原形。',
            observe: ['三次变化是这一回最重要的情节线。', '悟空的行动始终围绕“识妖、除妖”。', '唐僧的误解也在此达到顶点。'],
            memory: '白骨精三变：村姑、老妇、老翁。'
        },
        {
            id: 'banished',
            label: '悟空被逐',
            title: '除妖的悟空反而受冤',
            summary: '唐僧仍把悟空当作滥杀无辜的人，念紧箍咒并赶走悟空，师徒矛盾爆发。',
            observe: ['悟空护在师父前方，说明他始终在守护取经队伍。', '唐僧的愤怒来自他对事实的误判。', '结局不是降妖成功，而是悟空受冤被逐。'],
            memory: '人物评价要写出悟空“识妖、打妖、受冤”三层。'
        }
    ];

    function JourneyStoryLesson({ card, frame }) {
        const [activeIndex, setActiveIndex] = useState(0);
        const [showAnswer, setShowAnswer] = useState(false);
        const scene = BAIGUJING_STORY[activeIndex];
        const narrow = frame.isPortrait;
        const detailImage = card.storyboardImage || card.image;

        const goToScene = nextIndex => {
            setActiveIndex(Math.max(0, Math.min(BAIGUJING_STORY.length - 1, nextIndex)));
            setShowAnswer(false);
        };

        return (
            <article className="xyj-lesson custom-scrollbar" aria-label="三打白骨精图解课件">
                <section className="xyj-lesson-hero">
                    <div className="xyj-lesson-hero-art" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 22, 25, 0.92) 0%, rgba(9, 22, 25, 0.56) 47%, rgba(9, 22, 25, 0.16) 100%), url(${card.image})` }} />
                    <div className="xyj-lesson-hero-content">
                        <p className="xyj-lesson-kicker">西游记图解精学</p>
                        <p className="xyj-lesson-chapter">第 27 回</p>
                        <h1>三打白骨精</h1>
                        <p className="xyj-lesson-question">孙悟空明明识破了妖怪，为什么最后却被唐僧赶走？</p>
                        <div className="xyj-lesson-hero-meta">
                            <span>5 幕图解</span><span>人物冲突</span><span>名著答题</span>
                        </div>
                    </div>
                </section>

                <section className="xyj-lesson-intro" aria-label="本课学习路径">
                    <div>
                        <p className="xyj-lesson-section-kicker">先看整卷</p>
                        <h2>五幕看懂师徒误会</h2>
                    </div>
                    <p>同一张连环画固定人物形象，用五次关键转折串起“识妖、除妖、受冤”的完整过程。</p>
                </section>

                <section className="xyj-storyboard-overview" aria-label="三打白骨精五幕连环画总览">
                    <img src={detailImage} alt="三打白骨精图解主视觉" />
                </section>

                <nav className="xyj-scene-nav" aria-label="五幕故事导航">
                    {BAIGUJING_STORY.map((item, index) => (
                        <button key={item.id} type="button" onClick={() => goToScene(index)} className={index === activeIndex ? 'is-active' : ''} aria-current={index === activeIndex ? 'step' : undefined}>
                            <span>{String(index + 1).padStart(2, '0')}</span><b>{item.label}</b>
                        </button>
                    ))}
                </nav>

                <section className={`xyj-scene-stage ${narrow ? 'is-narrow' : ''}`} aria-live="polite">
                    <div className="xyj-scene-art" style={{ backgroundImage: `url(${detailImage})`, backgroundPosition: `${activeIndex * 25}% center` }}>
                        <span className="xyj-scene-count">{String(activeIndex + 1).padStart(2, '0')} / 05</span>
                    </div>
                    <div className="xyj-scene-copy">
                        <p className="xyj-lesson-section-kicker">{scene.label}</p>
                        <h2>{scene.title}</h2>
                        <p className="xyj-scene-summary">{scene.summary}</p>
                        <div className="xyj-observe-list">
                            <p>图中要看</p>
                            <ul>{scene.observe.map(item => <li key={item}>{item}</li>)}</ul>
                        </div>
                        <p className="xyj-memory-line"><span>记忆句</span>{scene.memory}</p>
                    </div>
                </section>

                <div className="xyj-scene-actions" aria-label="切换故事场景">
                    <button type="button" onClick={() => goToScene(activeIndex - 1)} disabled={activeIndex === 0}>上一幕</button>
                    <span>{scene.label}</span>
                    <button type="button" onClick={() => goToScene(activeIndex + 1)} disabled={activeIndex === BAIGUJING_STORY.length - 1}>下一幕</button>
                </div>

                <section className="xyj-insight-grid">
                    <div className="xyj-relationship">
                        <p className="xyj-lesson-section-kicker">读懂人物</p>
                        <h2>为什么会发生冲突？</h2>
                        <div className="xyj-relationship-line">
                            <div><b>孙悟空</b><span>火眼金睛，坚持除妖</span></div>
                            <i>判断相反</i>
                            <div><b>唐僧</b><span>心地善良，相信表象</span></div>
                        </div>
                        <p>白骨精利用伪装和唐僧的善良，制造师徒之间的信任危机。</p>
                    </div>
                    <div className="xyj-evidence">
                        <p className="xyj-lesson-section-kicker">原著证据</p>
                        <blockquote>“那唐僧一见，心中大怒，便念起紧箍儿咒来。”</blockquote>
                        <p>唐僧只看见悟空打人，没有看见妖怪现形，因此误判并惩罚悟空。</p>
                    </div>
                </section>

                <section className="xyj-answer-board">
                    <div><p className="xyj-lesson-section-kicker">会答名著题</p><h2>这一回要会什么？</h2></div>
                    <div className="xyj-answer-columns">
                        <div><b>情节概括</b><p>白骨精三次伪装，悟空三次识破，唐僧误会悟空并将他赶走。</p></div>
                        <div><b>人物形象</b><p>悟空火眼金睛、嫉恶如仇、守护师父，也承受了不被理解的冤屈。</p></div>
                        <div><b>主题理解</b><p>故事表现真相与表象的冲突，也揭示师徒之间的信任考验。</p></div>
                    </div>
                </section>

                <section className="xyj-self-check">
                    <div><p className="xyj-lesson-section-kicker">一题自测</p><h2>请概括孙悟空三打白骨精的经过，并分析其人物形象。</h2></div>
                    <button type="button" onClick={() => setShowAnswer(value => !value)} aria-expanded={showAnswer}>{showAnswer ? '收起答题线索' : '查看答题线索'}</button>
                    {showAnswer ? <p className="xyj-self-check-answer">按“妖怪三变 - 悟空三打 - 唐僧误会 - 悟空被逐”概括情节；人物形象从“火眼金睛、嫉恶如仇、忍受冤屈”三个方面作答。</p> : null}
                </section>
            </article>
        );
    }

    Object.assign(app, { JourneyStoryLesson });
})();

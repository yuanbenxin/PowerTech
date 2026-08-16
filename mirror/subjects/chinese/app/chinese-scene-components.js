window.ChineseApp = window.ChineseApp || {};

(() => {
    const app = window.ChineseApp;

    function DashboardOverlayShell({ eyebrow, title, subtitle, onClose, maxWidth = 'max-w-5xl', children }) {
        return (
            <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 py-5 backdrop-blur-md sm:px-6">
                <div className={`w-full ${maxWidth} max-h-full overflow-hidden rounded-[34px] border border-white/10 bg-[#07110f]/96 text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]`}>
                    <div className="flex items-start justify-between gap-5 border-b border-white/8 px-5 py-5 sm:px-7">
                        <div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-300/90">{eyebrow}</div><div className="mt-2 text-3xl font-black italic tracking-tight text-white">{title}</div>{subtitle ? <div className="mt-2 max-w-3xl text-sm leading-7 text-white/60">{subtitle}</div> : null}</div>
                        <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-black tracking-[0.18em] text-white/70 transition-all hover:text-white">关闭</button>
                    </div>
                    <div className="max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar px-5 py-5 sm:px-7 sm:py-6">{children}</div>
                </div>
            </div>
        );
    }

    function formatDateTime(value) {
        const date = new Date(value || '');
        if (Number.isNaN(date.getTime())) return '未设置';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    function formatTier(value) {
        return ({ founding: '初创会员', normal: '正式会员', regular: '正式会员', trial: '试用会员', 'local-preview': '本地预览' })[String(value || '').toLowerCase()] || '未设置';
    }

    function formatAccess(value) {
        return ({ active: '已开通', expired: '已到期', inactive: '未开通' })[String(value || '').toLowerCase()] || '未设置';
    }

    function AnnouncementCenter() {
        const [loading, setLoading] = React.useState(false);
        const [items, setItems] = React.useState([]);
        const [error, setError] = React.useState('');
        const refresh = async () => {
            setLoading(true);
            try {
                const payload = await app.requestUnifiedApi('/api/announcements/recent?limit=12&scan=120');
                setItems(Array.isArray(payload?.items) ? payload.items : []);
                setError('');
            } catch (requestError) {
                setError(requestError.message || '公告加载失败，请稍后重试。');
            } finally {
                setLoading(false);
            }
        };
        React.useEffect(() => { void refresh(); }, []);
        return <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black tracking-[0.3em] text-slate-300/85">公告中心</div><div className="mt-3 text-sm leading-7 text-white/68">这里会收纳最近的消息提醒、功能更新和与你账号相关的通知。</div></div><button type="button" onClick={() => { void refresh(); }} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white/76">{loading ? '刷新中...' : '刷新'}</button></div><div className={`mt-5 rounded-[22px] border px-4 py-5 text-sm ${error ? 'border-rose-400/18 bg-rose-500/[0.08] text-rose-50' : 'border-dashed border-white/10 bg-white/[0.03] text-white/58'}`}>{error || (items.length ? `当前共有 ${items.length} 条公告。` : '暂无公告消息。')}</div></section>;
    }

    function FeedbackCenter() {
        const [type, setType] = React.useState('bug');
        const [title, setTitle] = React.useState('');
        const [content, setContent] = React.useState('');
        const [state, setState] = React.useState({ type: '', text: '' });
        const [submitting, setSubmitting] = React.useState(false);
        const submit = async event => {
            event.preventDefault();
            if (!title.trim() || !content.trim() || submitting) return;
            setSubmitting(true);
            try {
                await app.requestUnifiedApi('/api/suggestions/submit', { method: 'POST', json: { source: 'chinese', type, title: title.trim(), content: content.trim() } });
                setState({ type: 'success', text: '意见已提交，我们会尽快查看。' }); setTitle(''); setContent('');
            } catch (requestError) {
                setState({ type: 'error', text: requestError.message || '意见提交失败，请稍后重试。' });
            } finally { setSubmitting(false); }
        };
        return <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"><div className="text-[10px] font-black tracking-[0.3em] text-slate-300/85">意见箱</div><div className="mt-3 text-sm leading-7 text-white/68">你可以在这里提交问题、功能建议和内容修正。</div>{state.text ? <div className={`mt-4 rounded-[20px] border px-4 py-3 text-sm ${state.type === 'success' ? 'border-slate-400/18 bg-slate-500/[0.08] text-slate-50' : 'border-rose-400/18 bg-rose-500/[0.08] text-rose-50'}`}>{state.text}</div> : null}<form className="mt-5 space-y-4" onSubmit={submit}><div className="flex flex-wrap gap-2">{[{ id: 'bug', label: '问题反馈' }, { id: 'feature', label: '功能建议' }, { id: 'ui', label: '界面优化' }, { id: 'content', label: '内容修正' }].map(item => <button key={item.id} type="button" onClick={() => setType(item.id)} className={`rounded-full border px-3 py-2 text-xs font-black tracking-[0.12em] ${type === item.id ? 'border-slate-400/18 bg-slate-500/[0.08] text-slate-100' : 'border-white/10 bg-white/[0.03] text-white/62'}`}>{item.label}</button>)}</div><input value={title} onChange={event => setTitle(event.target.value)} placeholder="反馈标题" className="w-full rounded-[18px] border border-white/10 bg-[#07110f] px-4 py-3 text-sm text-white outline-none focus:border-slate-400/40" /><textarea value={content} onChange={event => setContent(event.target.value)} placeholder="详细描述" className="min-h-[118px] w-full rounded-[18px] border border-white/10 bg-[#07110f] px-4 py-3 text-sm leading-7 text-white outline-none focus:border-slate-400/40" /><div className="flex justify-end"><button type="submit" disabled={submitting} className="rounded-[18px] bg-slate-400 px-5 py-3 text-sm font-black tracking-[0.14em] text-black disabled:opacity-60">{submitting ? '提交中...' : '提交意见'}</button></div></form></section>;
    }

    function AccountOverlay({ payload, onClose }) {
        const user = payload?.user || payload?.resolved?.user || {};
        const access = payload?.subject_access || payload?.resolved?.subject_access || {};
        const [copied, setCopied] = React.useState(false);
        const [loggingOut, setLoggingOut] = React.useState(false);
        const memberId = user.member_id || '未设置';
        const logout = async () => { if (loggingOut) return; setLoggingOut(true); await app.logoutFromUnifiedSubject('chinese'); };
        const copy = async () => { try { await navigator.clipboard?.writeText(memberId); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch (error) {} };
        return (
            <DashboardOverlayShell eyebrow="CHINESE ACCOUNT" title="个人中心" subtitle="查看统一账号资料和初中语文学科访问状态。" onClose={onClose} maxWidth="max-w-6xl">
                <div className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300/85">会员资料</div><div className="mt-3 text-3xl font-black italic text-white">{user.username || user.member_id || '统一账号'}</div><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-slate-400/18 bg-slate-500/[0.08] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-slate-100">{formatTier(access.membership_tier || user.membership_tier)}</span><span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white/74">{formatAccess(access.access_status)}</span></div></div><div className="min-w-[170px] rounded-[22px] border border-white/10 bg-[#06110f]/70 px-4 py-4"><div className="text-[10px] font-black tracking-[0.22em] text-white/36">会员编号</div><div className="mt-3 break-all text-sm font-semibold text-white/88">{memberId}</div></div></div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: '身份', value: user.identity === 'teacher' ? '教师' : '学生' }, { label: '学科权限', value: formatAccess(access.access_status) }, { label: '有效期', value: formatDateTime(access.expires_at || user.expires_at) }, { label: '当前学科', value: '初中语文' }].map(item => <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"><div className="text-[10px] font-black tracking-[0.22em] text-white/35">{item.label}</div><div className="mt-3 break-words text-base font-black text-white">{item.value}</div></div>)}</div>
                        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={copy} className="rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black tracking-[0.12em] text-white transition-all hover:bg-white/[0.09]">{copied ? '已复制会员号' : '复制会员号'}</button><button type="button" onClick={logout} disabled={loggingOut} className="rounded-[18px] border border-rose-400/18 bg-rose-500/[0.10] px-4 py-3 text-sm font-black tracking-[0.12em] text-rose-50 transition-all hover:bg-rose-500/[0.16] disabled:opacity-60">{loggingOut ? '处理中...' : '退出登录'}</button></div>
                    </section>
                    <aside className="space-y-4"><div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"><div className="text-[10px] font-black tracking-[0.3em] text-white/40">当前学习区</div><div className="mt-3 text-2xl font-black text-white">初中语文</div><div className="mt-2 text-base font-semibold text-slate-300">诗词与文言文卡片</div><div className="mt-4 text-sm leading-7 text-white/62">当前教材定位会保留在这个学科工作台中，后续接入课件后仍可从同一张卡片继续学习。</div></div><div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"><div className="text-[10px] font-black tracking-[0.3em] text-white/40">账号状态</div><div className="mt-4 grid gap-3">{[{ label: '会员类型', value: formatTier(access.membership_tier || user.membership_tier) }, { label: '访问状态', value: formatAccess(access.access_status) }, { label: '到期时间', value: formatDateTime(access.expires_at || user.expires_at) }].map(item => <div key={item.label} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3"><div className="text-[10px] font-black tracking-[0.2em] text-white/34">{item.label}</div><div className="mt-2 text-sm font-black text-white">{item.value}</div></div>)}</div></div></aside>
                </div>
                <div className="grid gap-4 xl:grid-cols-2"><AnnouncementCenter /><FeedbackCenter /></div>
                </div>
            </DashboardOverlayShell>
        );
    }

    function CardDetail({ card, frame }) {
        const coursewareEntry = String(card.courseware?.entry || '').trim();
        const narrow = frame.isPortrait;
        const titleSize = narrow ? (card.title.length > 11 ? 'text-[24px]' : 'text-[30px]') : 'text-[32px]';
        const bgUrl = card.image;
        const isTopic = Boolean(card.isTopic);
        const isJourneyTopic = isTopic && Boolean(card.chapterRange);
        const isMasterpiece = Boolean(card.isMasterpiece);

        if (coursewareEntry) {
            return (
                <div className="h-full w-full p-0 sm:p-1">
                    <iframe
                        title={`${card.title}交互式课件`}
                        src={coursewareEntry}
                        allow="autoplay; fullscreen"
                        className="h-full w-full border border-[#deb85b]/80 bg-[#071114] shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
                        style={{ borderRadius: narrow ? '12px' : '18px', touchAction: 'pan-y' }}
                    />
                </div>
            );
        }

        return (
            <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
                <div 
                    className="w-full max-w-2xl bg-zinc-900/60 border border-white/5 flex flex-col overflow-y-auto custom-scrollbar max-h-full"
                    style={{ 
                        borderRadius: '24px',
                        padding: narrow ? '20px' : '28px'
                    }}
                >
                    {/* Header */}
                    <div className="mb-4 shrink-0">
                        <h2 
                            className={`cn-detail-title ${titleSize} font-bold leading-tight text-slate-300 break-words`}
                            style={{ fontFamily: '"Kaiti", "STKaiti", "楷体", "华文楷体", "Georgia", serif' }}
                        >
                            {card.title}
                        </h2>
                        <p className="cn-detail-meta mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                            {card.bookLabel} / {app.contentTypeLabel(card.contentType)}
                        </p>
                    </div>

                    {/* Preview Image */}
                    <div 
                        className={`cn-detail-art cn-card-art-${card.contentType} relative shrink-0 overflow-hidden border border-white/5 bg-zinc-950/50 h-[200px] sm:h-[240px]`} 
                        style={{ 
                            borderRadius: '16px',
                            ...(bgUrl ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : isTopic || isMasterpiece ? { backgroundImage: 'radial-gradient(circle at 18% 12%, rgba(203, 151, 57, 0.32), transparent 34%), radial-gradient(circle at 78% 84%, rgba(125, 34, 34, 0.44), transparent 40%), linear-gradient(135deg, #22140e, #351510 52%, #0f1212)' } : {})
                        }}
                    >
                        <div className="cn-card-texture absolute inset-0" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                            <div className="text-[9px] font-black tracking-[0.3em] text-slate-200/70">CARD STATUS</div>
                            <div className="mt-2 text-xl font-black text-white">{isTopic ? '整本书重点考查' : isMasterpiece ? (card.status === 'ready' ? '名著专题已整理' : '名著专题规划中') : '课件待接入'}</div>
                            <div className="mt-1 text-xs leading-5 text-white/70">{isJourneyTopic ? `${card.chapterRange} · 统编版“精读和跳读”专题的高频锚点，适合用作情节、人物与主题复习。` : isTopic ? `《${card.bookLabel.replace(' · 名著导读', '')}》 · 围绕人物、情节、主题或写法设置的高频复习专题。` : isMasterpiece ? `作者：${card.author} · ${card.grade}${card.topicCount ? ` · 已整理 ${card.topicCount} 个专题` : ' · 尚未创建书内专题'}` : '当前已完成教材卡片与目录定位，原文、注释、译文、音频及互动课件将在后续单独接入。'}</div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mt-5 flex flex-col gap-5">
                        {/* Objectives */}
                        <div>
                            <h5 className="mb-3 text-[9px] font-black uppercase tracking-widest text-[#B53D35]">核心要点 / Objectives</h5>
                            <div className="space-y-3">
                                {card.points.map(point => (
                                    <div key={point} className="flex gap-2.5 text-[13px] font-medium leading-6 text-zinc-800">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B53D35]" />
                                        {point}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Abstract */}
                        <div className="border-t border-black/5 pt-5">
                            <h5 className="mb-2 text-[9px] font-black uppercase tracking-widest text-[#B53D35]">摘要 / Abstract</h5>
                            <p className="text-sm font-light italic leading-7 text-zinc-700">{card.detail}</p>
                        </div>

                        {/* Warning Box */}
                        <div className="mt-1 rounded-xl border border-amber-300/18 bg-amber-300/[0.08] px-4 py-3.5 text-[11px] font-bold leading-5 text-amber-50/88">
                            {isJourneyTopic ? '本专题卡用于定位原著回目与复习重点；不同地区中考的材料和命题角度会有差异，请以本地考试说明为准。' : isTopic ? '本专题卡用于整合书内人物、情节、主题和写法；不同地区中考的材料与命题角度会有差异，请以本地考试说明为准。' : isMasterpiece ? (card.status === 'ready' ? '本书已可进入专题卡复习；后续会在同一书内继续补充人物、情节与主题模块。' : '本书已进入名著导读总目录，但书内专题尚未创建；不会被误标为已经完成。') : '本卡片暂不提供课件入口，待课件完成后按同一位置接入。'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    Object.assign(app, { CardDetail, AccountOverlay });
})();

/*
  Application entry.
*/

window.GeographyApp = window.GeographyApp || {};

(() => {
  const app = window.GeographyApp;
  const {
    useState,
    useMemo,
    useEffect,
    DEFAULTS,
    VISUAL_MANIFEST_PATH,
    LANDING_VIDEO_PATH,
    BOOK_BACKGROUND_MAP,
    unique,
    getStage,
    createCardDetails,
    loadCourseData,
    fetchJsonSafe,
    resolveGeographyMediaPath,
    resolveGeographyMediaThumbnailPath,
    handleGeographyMediaError,
    resolveLocalMediaKey,
    useUnifiedSubjectBootstrap,
    getUnifiedPortalHref,
    getUnifiedSubjectAuthHeaders,
    logoutFromUnifiedSubject,
    LandscapeOnlyViewport,
    CoursewareWorkbench,
    LandingChoiceCard,
    CardTile,
    Icon
  } = app;

  const GEOGRAPHY_SUBJECT_KEY = 'geography';
  const GEOGRAPHY_SUBJECT_BOOTSTRAP_PATH = `/api/unified/bootstrap/subjects/${encodeURIComponent(GEOGRAPHY_SUBJECT_KEY)}`;
  const GEOGRAPHY_STAGE_STORAGE_KEY = 'shg:geography-stage-variant';

  function isLocalStaticHost() {
    const protocol = String(window.location.protocol || '').trim().toLowerCase();
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  }

  function resolveSubjectReturnPath() {
    try {
      const currentUrl = new URL(window.location.href);
      if (String(currentUrl.protocol || '').toLowerCase() === 'file:') return '/subjects/geography/';
      const pathname = String(currentUrl.pathname || '').trim();
      const search = String(currentUrl.search || '').trim();
      return pathname ? `${pathname}${search}` : '/subjects/geography/';
    } catch (error) {
      return '/subjects/geography/';
    }
  }

  function openSubjectSubscription() {
    const subscriptionPath = isLocalStaticHost() ? '/dist-subscription/index.html' : '/subscription/';
    const url = new URL(subscriptionPath, window.location.href);
    url.searchParams.set('subject', GEOGRAPHY_SUBJECT_KEY);
    url.searchParams.set('return', resolveSubjectReturnPath());
    window.location.assign(url.toString());
  }

  function isGeographyLocalPreviewHost() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const mode = String(params.get('subjectAuth') || '').trim().toLowerCase();
      if (mode === 'off') return true;
      if (mode === 'on') return false;
    } catch (error) {
    }

    const protocol = String(window.location.protocol || '').trim().toLowerCase();
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  }

  async function createLocalGeographyBootstrapPayload() {
    if (typeof app.fetchUnifiedSubjectBootstrap === 'function') {
      const payload = await app.fetchUnifiedSubjectBootstrap(GEOGRAPHY_SUBJECT_KEY);
      if (payload) return payload;
    }

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    return {
      ok: true,
      user: {
        id: 'local-preview',
        username: '本地预览',
        member_id: 'LOCAL-PREVIEW',
        identity: 'teacher',
        auth_source: 'local-preview',
        membership_tier: 'local-preview',
        subject_capabilities: {
          enter_shell: true,
          open_engine: true
        }
      },
      subject_access: {
        subject_key: GEOGRAPHY_SUBJECT_KEY,
        subject_name: '地理可视化',
        access_status: 'active',
        membership_tier: 'local-preview',
        expires_at: expiresAt
      },
      resolved: {
        user: {
          id: 'local-preview',
          username: '本地预览',
          member_id: 'LOCAL-PREVIEW',
          identity: 'teacher',
          auth_source: 'local-preview',
          membership_tier: 'local-preview',
          subject_capabilities: {
            enter_shell: true,
            open_engine: true
          }
        },
        subject_access: {
          subject_key: GEOGRAPHY_SUBJECT_KEY,
          subject_name: '地理可视化',
          access_status: 'active',
          membership_tier: 'local-preview',
          expires_at: expiresAt
        }
      },
      purchase_requests: null,
      capabilities: {
        enter_shell: true,
        open_engine: true,
        access_mode: 'full',
        local_preview: true
      }
    };
  }

  async function createLocalGeographyApiPayload(path, options = {}) {
    const normalizedPath = String(path || '').trim();
    const method = String(options.method || 'GET').trim().toUpperCase() || 'GET';

    if (normalizedPath === GEOGRAPHY_SUBJECT_BOOTSTRAP_PATH) {
      return createLocalGeographyBootstrapPayload();
    }

    if (normalizedPath === '/api/announcements/active') {
      return { ok: true, announcement: null };
    }

    if (normalizedPath.startsWith('/api/announcements/recent')) {
      return { ok: true, items: [], unread_total: 0 };
    }

    if (/^\/api\/announcements\/[^/]+\/read(?:\?.*)?$/.test(normalizedPath)) {
      return { ok: true };
    }

    if (normalizedPath.startsWith('/api/suggestions?')) {
      return {
        ok: true,
        items: [],
        stats: { pending: 0, adopted: 0, rejected: 0 }
      };
    }

    if (normalizedPath === '/api/suggestions/submit' && method === 'POST') {
      return { ok: true, item: null };
    }

    return null;
  }

  function normalizeGeographyStageId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'senior' ? 'senior' : (normalized === 'junior' ? 'junior' : '');
  }

  function getInitialGeographyStageId() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const stageFromUrl = normalizeGeographyStageId(params.get('stage'));
      if (stageFromUrl) {
        window.sessionStorage?.setItem(GEOGRAPHY_STAGE_STORAGE_KEY, stageFromUrl);
        return stageFromUrl;
      }
    } catch (error) {
    }

    try {
      return normalizeGeographyStageId(window.sessionStorage?.getItem(GEOGRAPHY_STAGE_STORAGE_KEY));
    } catch (error) {
      return '';
    }
  }

  function getInitialGeographyOpenCardId() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return String(params.get('open') || '').trim();
    } catch (error) {
      return '';
    }
  }

  const GEOGRAPHY_ACCESS_MODE_LABELS = Object.freeze({
    full: '完整访问',
    shell: '试用浏览',
    expired: '授权已到期',
    locked: '待开通'
  });
  const GEOGRAPHY_SUBSCRIPTION_META = Object.freeze({
    trial_month: Object.freeze({
      key: 'trial_month',
      label: '月卡',
      kicker: '考前冲刺',
      description: '30 天地理可视化权限，适合考前单模块集中突破。',
      accent: 'yellow',
      fallbackPriceCents: 4990
    }),
    subscription_half: Object.freeze({
      key: 'subscription_half',
      label: '半年卡',
      kicker: '学期方案',
      description: '183 天地理可视化权限，适合一个完整学期持续使用。',
      accent: 'lime',
      fallbackPriceCents: 15900
    }),
    subscription_annual: Object.freeze({
      key: 'subscription_annual',
      label: '年卡',
      kicker: '长期方案',
      description: '365 天完整权限，适合全年课程推进与长期复习。',
      accent: 'amber',
      fallbackPriceCents: 28900
    }),
    founding_buyout: Object.freeze({
      key: 'founding_buyout',
      label: '初创会员',
      kicker: '长期保留',
      description: '一次开通长期保留地理可视化权限，适合长期学习与反复复盘。',
      accent: 'yellow',
      fallbackPriceCents: 39900
    })
  });
  const GEOGRAPHY_FEEDBACK_TYPES = Object.freeze([
    Object.freeze({
      id: 'bug',
      label: '问题反馈',
      buttonClass: 'border-rose-400/18 bg-rose-500/[0.08] text-rose-100',
      badgeClass: 'border-rose-400/18 bg-rose-500/[0.08] text-rose-100'
    }),
    Object.freeze({
      id: 'feature',
      label: '功能建议',
      buttonClass: 'border-amber-400/18 bg-amber-500/[0.08] text-amber-100',
      badgeClass: 'border-amber-400/18 bg-amber-500/[0.08] text-amber-100'
    }),
    Object.freeze({
      id: 'ui',
      label: '界面优化',
      buttonClass: 'border-cyan-400/18 bg-cyan-500/[0.08] text-cyan-100',
      badgeClass: 'border-cyan-400/18 bg-cyan-500/[0.08] text-cyan-100'
    }),
    Object.freeze({
      id: 'content',
      label: '内容修正',
      buttonClass: 'border-yellow-400/18 bg-yellow-500/[0.08] text-yellow-100',
      badgeClass: 'border-yellow-400/18 bg-yellow-500/[0.08] text-yellow-100'
    }),
    Object.freeze({
      id: 'other',
      label: '其他',
      buttonClass: 'border-white/12 bg-white/[0.04] text-white/82',
      badgeClass: 'border-white/12 bg-white/[0.04] text-white/82'
    })
  ]);
  function formatDateTimeText(value) {
    if (!value) return '未设置';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未设置';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function formatTierText(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'founding') return '初创会员';
    if (normalized === 'normal' || normalized === 'regular') return '正式会员';
    if (normalized === 'trial') return '试用会员';
    return normalized || '未设置';
  }

  function formatAccessStatusText(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'active') return '已开通';
    if (normalized === 'expired') return '已到期';
    if (normalized === 'inactive') return '未开通';
    return normalized || '未设置';
  }

  const SUBJECT_ENGINE_ACCESS_DENIED_MESSAGE = '当前账号可以进入系统，但本学科交互引擎权限尚未开通或已到期，请先开通或续费后再进入课件。';

  function getAccessTimeValue(value) {
    if (!value) return null;
    const timeValue = new Date(value).getTime();
    return Number.isFinite(timeValue) ? timeValue : null;
  }

  function getResolvedSubjectAccessExpiryValue(subjectAccess, user) {
    return subjectAccess?.expires_at
      || subjectAccess?.trial_expires_at
      || subjectAccess?.expired_at
      || user?.trial_expires_at
      || user?.expires_at
      || user?.expired_at
      || null;
  }

  function getEffectiveSubjectAccessStatus(subjectAccess, user) {
    const rawStatus = String(subjectAccess?.access_status || user?.access_status || '').trim().toLowerCase();
    const accessStatus = rawStatus || (typeof user?.has_access === 'boolean' ? (user.has_access ? 'active' : 'inactive') : '');
    if (accessStatus !== 'active') return accessStatus;

    const expiresAt = getAccessTimeValue(getResolvedSubjectAccessExpiryValue(subjectAccess, user));
    if (expiresAt !== null && expiresAt <= Date.now()) return 'expired';
    return 'active';
  }

  function canOpenSubjectEngine(unifiedPayload, subjectAccess, user) {
    const capabilities = unifiedPayload?.capabilities && typeof unifiedPayload.capabilities === 'object'
      ? unifiedPayload.capabilities
      : {};
    const subjectCapabilities = user?.subject_capabilities && typeof user.subject_capabilities === 'object'
      ? user.subject_capabilities
      : {};

    if (String(user?.auth_source || '').trim().toLowerCase() === 'local-preview' || capabilities.local_preview === true) {
      return capabilities.open_engine === true || subjectCapabilities.open_engine === true;
    }

    const effectiveStatus = getEffectiveSubjectAccessStatus(subjectAccess, user);
    if (['expired', 'inactive', 'disabled', 'blocked'].includes(effectiveStatus)) return false;

    if (typeof capabilities.open_engine === 'boolean') return capabilities.open_engine;
    if (typeof subjectCapabilities.open_engine === 'boolean') return subjectCapabilities.open_engine;
    if (!unifiedPayload && !subjectAccess && !user) return false;
    return effectiveStatus === 'active';
  }

  function formatIdentityText(identity, authSource) {
    if (String(authSource || '').trim().toLowerCase() === 'local-preview') return '浏览模式';
    return String(identity || '').trim().toLowerCase() === 'teacher' ? '教师' : '学生';
  }

  function maskPhoneText(value) {
    const phone = String(value || '').trim();
    if (!phone) return '未绑定';
    if (phone.length < 7) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }

  function buildUnifiedGeographyHref(reason, options = {}) {
    try {
      const baseHref = typeof getUnifiedPortalHref === 'function'
        ? getUnifiedPortalHref(reason, GEOGRAPHY_SUBJECT_KEY)
        : new URL('/', window.location.href).toString();
      const url = new URL(baseHref, window.location.href);
      const stage = String(options.stage || '').trim().toLowerCase();
      const tab = String(options.tab || '').trim();
      const planKey = String(options.planKey || '').trim();

      if (stage) url.searchParams.set('stage', stage);
      if (tab) url.searchParams.set('tab', tab);
      if (planKey) url.searchParams.set('plan', planKey);
      return url.toString();
    } catch (error) {
      return '/';
    }
  }

  async function fetchUnifiedGeographyEngineConfig() {
    if (isGeographyLocalPreviewHost()) {
      return {};
    }

    try {
      const headers = Object.assign(
        {
          'X-SHG-Subject': GEOGRAPHY_SUBJECT_KEY
        },
        typeof getUnifiedSubjectAuthHeaders === 'function' ? (getUnifiedSubjectAuthHeaders() || {}) : {}
      );
      const response = await fetch('/api/unified/subjects/geography/engines', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        headers
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        return {};
      }

      return (Array.isArray(payload?.result?.engines) ? payload.result.engines : []).reduce((map, row) => {
        const engineKey = String(row?.engine_key || '').trim();
        if (!engineKey) return map;
        map[engineKey] = {
          is_enabled: Number(row?.is_enabled ?? 1) !== 0,
          is_hidden: Number(row?.is_hidden ?? 0) !== 0,
          advanced: Number(row?.advanced ?? 0) !== 0,
          sort_order: Number(row?.sort_order ?? 0) || 0
        };
        return map;
      }, {});
    } catch (error) {
      return {};
    }
  }

  function createGeographySubjectHeaders(extraHeaders = {}, includeJsonContentType = false) {
    return Object.assign(
      includeJsonContentType ? { 'Content-Type': 'application/json' } : {},
      { 'X-SHG-Subject': GEOGRAPHY_SUBJECT_KEY },
      typeof getUnifiedSubjectAuthHeaders === 'function' ? (getUnifiedSubjectAuthHeaders() || {}) : {},
      extraHeaders || {}
    );
  }

  async function requestGeographyUnifiedApi(path, options = {}) {
    if (isGeographyLocalPreviewHost()) {
      const localPayload = await createLocalGeographyApiPayload(path, options);
      if (localPayload) return localPayload;
    }

    const method = String(options.method || 'GET').trim().toUpperCase() || 'GET';
    const response = await fetch(path, {
      method,
      cache: options.cache || 'no-store',
      credentials: 'same-origin',
      headers: createGeographySubjectHeaders(options.headers || {}, options.json !== undefined),
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      const message = String(payload?.error || payload?.message || '').trim()
        || (response.status === 401 ? '请先登录后再继续。' : `请求失败 (${response.status})`);
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  function getGeographyFeedbackTypeMeta(type) {
    return GEOGRAPHY_FEEDBACK_TYPES.find(item => item.id === type) || GEOGRAPHY_FEEDBACK_TYPES[GEOGRAPHY_FEEDBACK_TYPES.length - 1];
  }

  function getGeographyFeedbackStatusMeta(status) {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'adopted') {
      return {
        label: '已采纳',
        className: 'border-yellow-400/18 bg-yellow-500/[0.08] text-yellow-100'
      };
    }

    if (normalized === 'rejected') {
      return {
        label: '暂未采纳',
        className: 'border-rose-400/18 bg-rose-500/[0.08] text-rose-100'
      };
    }

    return {
      label: '处理中',
      className: 'border-amber-400/18 bg-amber-500/[0.08] text-amber-100'
    };
  }

  function getGeographyAnnouncementTitle(item) {
    return String(item?.title || item?.subject || item?.name || '').trim() || '平台公告';
  }

  function getGeographyAnnouncementBody(item) {
    return String(item?.content || item?.body || item?.summary || item?.description || '').trim() || '暂无公告内容。';
  }

  function getGeographySuggestionReply(record) {
    return String(
      record?.reply_content
      || record?.reply
      || record?.review_note
      || record?.admin_note
      || record?.resolution
      || ''
    ).trim();
  }

  async function copyGeographyText(value) {
    const text = String(value || '').trim();
    if (!text) return false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
    }

    let textarea = null;
    try {
      textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      return document.execCommand('copy');
    } catch (error) {
      return false;
    } finally {
      if (textarea && textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
    }
  }

  function GeographyAccessPrompt({ title, description, actionHref, actionLabel }) {
    return (
      <div className="rounded-[24px] border border-yellow-400/14 bg-yellow-500/[0.06] p-5">
        <div className="text-sm font-black tracking-[0.14em] text-yellow-100">{title}</div>
        <div className="mt-3 text-sm leading-7 text-white/72">{description}</div>
        <a
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-[18px] border border-yellow-300/18 bg-yellow-400 px-4 py-3 text-sm font-black tracking-[0.12em] text-black transition-all hover:brightness-105"
        >
          <Icon name="ExternalLink" size={15} /> {actionLabel}
        </a>
      </div>
    );
  }

  function GeographyAnnouncementCenter({ enabled, loginHref }) {
    const [loading, setLoading] = useState(Boolean(enabled));
    const [refreshing, setRefreshing] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [items, setItems] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [selectedId, setSelectedId] = useState('');

    const selectedAnnouncement = useMemo(
      () => items.find(item => String(item?.id || '') === String(selectedId || '')) || items[0] || null,
      [items, selectedId]
    );

    const loadAnnouncements = async (showLoading = true) => {
      if (!enabled) return;

      if (showLoading) setLoading(true);
      else setRefreshing(true);

      try {
        const payload = await requestGeographyUnifiedApi('/api/announcements/recent?limit=12&scan=120');
        const nextItems = Array.isArray(payload?.items) ? payload.items : [];
        setItems(nextItems);
        setUnreadTotal(Number(payload?.unread_total || 0));
        setSelectedId(current => (
          nextItems.some(item => String(item?.id || '') === String(current || ''))
            ? current
            : String(nextItems[0]?.id || '')
        ));
        setErrorText('');
      } catch (error) {
        setErrorText(error?.message || '公告加载失败，请稍后重试。');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    useEffect(() => {
      if (!enabled) {
        setLoading(false);
        setRefreshing(false);
        setItems([]);
        setUnreadTotal(0);
        setSelectedId('');
        setErrorText('');
        return;
      }

      let active = true;
      const run = async () => {
        try {
          await loadAnnouncements(true);
        } catch (error) {
          if (active) {
            setErrorText(error?.message || '公告加载失败，请稍后重试。');
          }
        }
      };

      void run();
      return () => {
        active = false;
      };
    }, [enabled]);

    const handleSelectAnnouncement = async announcement => {
      setSelectedId(String(announcement?.id || ''));
      if (!announcement?.id || announcement?.is_read) return;

      try {
        await requestGeographyUnifiedApi(`/api/announcements/${encodeURIComponent(announcement.id)}/read`, {
          method: 'POST',
          json: {}
        });
        setItems(currentItems => currentItems.map(item => (
          item?.id === announcement.id
            ? Object.assign({}, item, { is_read: true, read_at: new Date().toISOString() })
            : item
        )));
        setUnreadTotal(currentTotal => Math.max(0, currentTotal - 1));
      } catch (error) {
      }
    };

    if (!enabled) {
      return (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-300/85">公告中心</div>
          <div className="mt-3">
            <GeographyAccessPrompt
              title="登录后查看专属公告"
              description="账号登录后，这里会展示你的系统通知、会员消息和最近更新。"
              actionHref={loginHref}
              actionLabel="前往登录"
            />
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-300/85">公告中心</div>
            <div className="mt-3 text-sm leading-7 text-white/68">
              这里会收纳最近的消息提醒、功能更新和与你账号相关的通知。
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.16em] ${
              unreadTotal > 0
                ? 'border-amber-400/18 bg-amber-500/[0.08] text-amber-100'
                : 'border-white/10 bg-white/[0.05] text-white/70'
            }`}>
              未读 {unreadTotal}
            </span>
            <button
              type="button"
              onClick={() => { void loadAnnouncements(false); }}
              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white/76 transition-all hover:bg-white/[0.09]"
            >
              {refreshing ? '刷新中...' : '刷新'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/62">
            正在加载公告...
          </div>
        ) : errorText ? (
          <div className="mt-5 rounded-[22px] border border-rose-400/18 bg-rose-500/[0.08] px-4 py-5 text-sm leading-7 text-rose-50">
            {errorText}
          </div>
        ) : !items.length ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/58">
            暂无公告消息。
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-3">
              {items.map(item => {
                const isActive = String(selectedAnnouncement?.id || '') === String(item?.id || '');
                return (
                  <button
                    key={String(item?.id || getGeographyAnnouncementTitle(item))}
                    type="button"
                    onClick={() => { void handleSelectAnnouncement(item); }}
                    className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
                      isActive
                        ? 'border-yellow-400/20 bg-yellow-500/[0.10]'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-black text-white">{getGeographyAnnouncementTitle(item)}</div>
                      {!item?.is_read ? (
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.65)]" />
                      ) : null}
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs leading-6 text-white/56">
                      {getGeographyAnnouncementBody(item)}
                    </div>
                    <div className="mt-3 text-[11px] font-semibold text-white/34">
                      {formatDateTimeText(item?.published_at || item?.created_at || item?.updated_at)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#06110f]/82 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xl font-black tracking-tight text-white">
                  {getGeographyAnnouncementTitle(selectedAnnouncement)}
                </div>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.16em] ${
                  selectedAnnouncement?.is_read
                    ? 'border-white/10 bg-white/[0.05] text-white/70'
                    : 'border-amber-400/18 bg-amber-500/[0.08] text-amber-100'
                }`}>
                  {selectedAnnouncement?.is_read ? '已读' : '未读'}
                </span>
              </div>

              <div className="mt-3 text-[11px] font-semibold tracking-[0.14em] text-white/38">
                发布时间 {formatDateTimeText(selectedAnnouncement?.published_at || selectedAnnouncement?.created_at || selectedAnnouncement?.updated_at)}
              </div>

              <div className="mt-5 whitespace-pre-wrap text-sm leading-8 text-white/78">
                {getGeographyAnnouncementBody(selectedAnnouncement)}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  function GeographyFeedbackCenter({ enabled, loginHref }) {
    const [activeSection, setActiveSection] = useState('submit');
    const [type, setType] = useState('bug');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(Boolean(enabled));
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackTone, setFeedbackTone] = useState('');
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({ pending: 0, adopted: 0, rejected: 0 });

    const selectedType = useMemo(() => getGeographyFeedbackTypeMeta(type), [type]);

    const loadRecords = async () => {
      if (!enabled) return;

      setLoading(true);
      try {
        const payload = await requestGeographyUnifiedApi('/api/suggestions?limit=50');
        setRecords(Array.isArray(payload?.items) ? payload.items : []);
        setStats({
          pending: Number(payload?.stats?.pending || 0),
          adopted: Number(payload?.stats?.adopted || 0),
          rejected: Number(payload?.stats?.rejected || 0)
        });
        setFeedbackText('');
        setFeedbackTone('');
      } catch (error) {
        setFeedbackText(error?.message || '意见记录加载失败，请稍后重试。');
        setFeedbackTone('error');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (!enabled) {
        setLoading(false);
        setFeedbackText('');
        setFeedbackTone('');
        setRecords([]);
        setStats({ pending: 0, adopted: 0, rejected: 0 });
        return;
      }

      let active = true;
      const run = async () => {
        try {
          await loadRecords();
        } catch (error) {
          if (active) {
            setFeedbackText(error?.message || '意见记录加载失败，请稍后重试。');
            setFeedbackTone('error');
          }
        }
      };

      void run();
      return () => {
        active = false;
      };
    }, [enabled]);

    const handleSubmit = async event => {
      event.preventDefault();
      if (!title.trim() || !content.trim() || submitting) return;

      setSubmitting(true);
      try {
        await requestGeographyUnifiedApi('/api/suggestions/submit', {
          method: 'POST',
          json: {
            source: GEOGRAPHY_SUBJECT_KEY,
            type,
            title: title.trim(),
            content: content.trim()
          }
        });

        await loadRecords();
        setTitle('');
        setContent('');
        setActiveSection('history');
        setFeedbackText('意见已提交，我们会尽快查看。');
        setFeedbackTone('success');
      } catch (error) {
        setFeedbackText(error?.message || '意见提交失败，请稍后重试。');
        setFeedbackTone('error');
      } finally {
        setSubmitting(false);
      }
    };

    if (!enabled) {
      return (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-300/85">意见箱</div>
          <div className="mt-3">
            <GeographyAccessPrompt
              title="登录后使用意见箱"
              description="登录账号后，你可以提交问题、功能建议和内容修正，也能查看处理进度。"
              actionHref={loginHref}
              actionLabel="前往登录"
            />
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-300/85">意见箱</div>
            <div className="mt-3 text-sm leading-7 text-white/68">
              你可以在这里提交问题、改进建议和内容修正，也能查看每条反馈的处理进度。
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'pending', label: '处理中' },
              { key: 'adopted', label: '已采纳' },
              { key: 'rejected', label: '暂未采纳' }
            ].map(item => (
              <span
                key={item.key}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white/76"
              >
                {item.label} {stats[item.key]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 inline-flex rounded-[18px] border border-white/10 bg-black/[0.18] p-1">
          {[
            { key: 'submit', label: '提交意见' },
            { key: 'history', label: `我的记录${records.length ? ` (${records.length})` : ''}` }
          ].map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveSection(item.key)}
              className={`rounded-[14px] px-4 py-2 text-sm font-black transition-all ${
                activeSection === item.key
                  ? 'bg-yellow-400 text-black'
                  : 'text-white/62 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {feedbackText ? (
          <div className={`mt-4 rounded-[20px] border px-4 py-4 text-sm leading-7 ${
            feedbackTone === 'success'
              ? 'border-yellow-400/18 bg-yellow-500/[0.08] text-yellow-50'
              : feedbackTone === 'error'
                ? 'border-rose-400/18 bg-rose-500/[0.08] text-rose-50'
                : 'border-white/10 bg-white/[0.04] text-white/76'
          }`}>
            {feedbackText}
          </div>
        ) : null}

        {activeSection === 'submit' ? (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <div className="mb-3 text-xs font-black tracking-[0.16em] text-white/42">反馈类型</div>
              <div className="flex flex-wrap gap-2">
                {GEOGRAPHY_FEEDBACK_TYPES.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`rounded-full border px-3 py-2 text-xs font-black tracking-[0.12em] transition-all ${
                      type === item.id
                        ? item.buttonClass
                        : 'border-white/10 bg-white/[0.03] text-white/62 hover:bg-white/[0.05]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-xs font-black tracking-[0.16em] text-white/42">标题</div>
              <input
                type="text"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder={`例如：${selectedType.label}需要调整`}
                className="w-full rounded-[18px] border border-white/10 bg-[#07110f] px-4 py-3 text-sm text-white caret-yellow-300 outline-none transition-all placeholder:text-white/35 focus:border-yellow-400/40 focus:bg-[#0a1814]"
              />
            </div>

            <div>
              <div className="mb-3 text-xs font-black tracking-[0.16em] text-white/42">详细描述</div>
              <textarea
                value={content}
                onChange={event => setContent(event.target.value)}
                placeholder="把你遇到的问题、想优化的地方或者内容修正建议写在这里。"
                className="min-h-[150px] w-full rounded-[18px] border border-white/10 bg-[#07110f] px-4 py-3 text-sm leading-7 text-white caret-yellow-300 outline-none transition-all placeholder:text-white/35 focus:border-yellow-400/40 focus:bg-[#0a1814]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs leading-6 text-white/42">
                提交后会自动收录到你的反馈记录中，方便后续追踪处理状态。
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-yellow-400 px-5 py-3 text-sm font-black tracking-[0.14em] text-black transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name={submitting ? 'Sparkles' : 'Send'} size={16} />
                {submitting ? '提交中...' : '提交意见'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/62">
                正在加载意见记录...
              </div>
            ) : !records.length ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/58">
                还没有提交过意见，欢迎把你的想法告诉我们。
              </div>
            ) : (
              records.map(record => {
                const typeMeta = getGeographyFeedbackTypeMeta(record?.type);
                const statusMeta = getGeographyFeedbackStatusMeta(record?.status);
                const replyText = getGeographySuggestionReply(record);

                return (
                  <div
                    key={String(record?.id || `${record?.created_at || ''}-${record?.title || ''}`)}
                    className="rounded-[22px] border border-white/10 bg-[#06110f]/80 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-black text-white">{String(record?.title || '').trim() || '未命名反馈'}</div>
                        <div className="mt-2 text-[11px] font-semibold tracking-[0.12em] text-white/34">
                          提交时间 {formatDateTimeText(record?.created_at || record?.updated_at)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.12em] ${typeMeta.badgeClass}`}>
                          {typeMeta.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.12em] ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/76">
                      {String(record?.content || '').trim() || '暂无内容。'}
                    </div>

                    {replyText ? (
                      <div className="mt-4 rounded-[18px] border border-yellow-400/14 bg-yellow-500/[0.06] px-4 py-4">
                        <div className="text-[11px] font-black tracking-[0.12em] text-yellow-100">处理回复</div>
                        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/74">{replyText}</div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    );
  }

  function DashboardOverlayShell({ eyebrow, title, subtitle, onClose, maxWidth = 'max-w-5xl', children }) {
    return (
      <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 py-5 backdrop-blur-md sm:px-6">
        <div className={`w-full ${maxWidth} max-h-full overflow-hidden rounded-[34px] border border-white/10 bg-[#07110f]/96 text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]`}>
          <div className="flex items-start justify-between gap-5 border-b border-white/8 px-5 py-5 sm:px-7">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.34em] text-yellow-300/90">{eyebrow}</div>
              <div className="mt-2 text-3xl font-black italic tracking-tight text-white">{title}</div>
              {subtitle ? (
                <div className="mt-2 max-w-3xl text-sm leading-7 text-white/60">{subtitle}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-black tracking-[0.18em] text-white/70 transition-all hover:text-white"
            >
              关闭
            </button>
          </div>
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar px-5 py-5 sm:px-7 sm:py-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  function GeographyBetaNotice({ announcement, onClose }) {
    const [submitting, setSubmitting] = useState(false);

    const handleClose = async () => {
      if (submitting) return;
      setSubmitting(true);

      try {
        if (announcement?.id) {
          await requestGeographyUnifiedApi(`/api/announcements/${encodeURIComponent(announcement.id)}/read`, {
            method: 'POST',
            json: {}
          });
        }
      } catch (error) {
      } finally {
        setSubmitting(false);
        onClose?.();
      }
    };

    if (!announcement) return null;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(1, 6, 18, 0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          fontFamily: '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif',
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            void handleClose();
          }
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '100%',
            overflowY: 'auto',
            borderRadius: '28px',
            padding: '32px 30px 26px',
            background: 'linear-gradient(160deg, rgba(6,16,34,0.98), rgba(8,24,50,0.96) 55%, rgba(6,18,38,0.98))',
            border: '1px solid rgba(52,211,153,0.18)',
            boxShadow: '0 48px 120px rgba(1,4,18,0.75), 0 0 80px rgba(52,211,153,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
            color: '#dff0fa',
            scrollbarWidth: 'none',
          }}
        >
          <div style={{ position: 'absolute', top: -1, left: '18%', right: '18%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent)', borderRadius: '999px' }} />

          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <button
            type="button"
            onClick={() => { void handleClose(); }}
            aria-label="关闭公告"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(148,163,184,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              zIndex: 2,
            }}
          >
            ×
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '22px' }}>
            <div
              style={{
                flexShrink: 0,
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(52,211,153,0.16), rgba(16,185,129,0.1))',
                border: '1px solid rgba(52,211,153,0.24)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 900,
                color: '#a7f3d0',
              }}
            >
              公
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 10px', borderRadius: '999px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.24)', color: '#6ee7b7', fontSize: '11px', fontWeight: 700 }}>系统公告</span>
                <span style={{ padding: '2px 10px', borderRadius: '999px', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.26)', color: '#fbbf24', fontSize: '11px', fontWeight: 700 }}>
                  {formatDateTimeText(announcement.created_at)}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#eaf7ff', letterSpacing: '-0.3px', lineHeight: 1.3 }}>
                {announcement.title || '系统公告'}
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(148,163,184,0.8)', lineHeight: 1.6 }}>
                最新公告会在登录后优先展示，确认后会自动记录为已读。
              </p>
            </div>
          </div>

          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.2), transparent)', marginBottom: '20px' }} />

          <div
            style={{
              fontSize: '14px',
              lineHeight: 1.9,
              color: 'rgba(203,219,232,0.94)',
              marginBottom: '22px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {announcement.content || '暂无公告内容。'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { void handleClose(); }}
              disabled={submitting}
              style={{
                height: '44px',
                padding: '0 22px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                color: '#dff0fa',
                fontSize: '14px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.72 : 1,
              }}
            >
              稍后查看
            </button>

            <button
              type="button"
              onClick={() => { void handleClose(); }}
              disabled={submitting}
              style={{
                height: '44px',
                padding: '0 24px',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #34d399, #10b981 60%, #059669)',
                color: '#021824',
                fontSize: '14px',
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(52,211,153,0.28)',
                opacity: submitting ? 0.72 : 1,
              }}
            >
              {submitting ? '处理中...' : '我知道了'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function App() {
    const [courseData, setCourseData] = useState(null);
    const [visualManifest, setVisualManifest] = useState(null);
    const [engineRuntimeMap, setEngineRuntimeMap] = useState({});
    const [loadError, setLoadError] = useState('');
    const initialStageId = getInitialGeographyStageId();
    const initialOpenCardId = getInitialGeographyOpenCardId();
    const [view, setView] = useState(initialStageId ? 'dashboard' : 'landing');
    const [stageId, setStageId] = useState(initialStageId || DEFAULTS.stage);
    const [bookId, setBookId] = useState(DEFAULTS.book);
    const [activeCardId, setActiveCardId] = useState(null);
    const [coursewareCardId, setCoursewareCardId] = useState(null);
    const [pendingOpenCardId, setPendingOpenCardId] = useState(initialOpenCardId);
    const [overlayMode, setOverlayMode] = useState('');
    const [memberIdCopied, setMemberIdCopied] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [betaNotice, setBetaNotice] = useState(null);
    const [landingUsesImageBackground, setLandingUsesImageBackground] = useState(false);
    const landingBackgroundPool = useMemo(() => unique([
      'assets/bg_j.webp',
      'assets/bg_s.webp',
      ...Object.values(BOOK_BACKGROUND_MAP || {})
    ]), []);
    const [landingImageBackground, setLandingImageBackground] = useState(() => {
      const pool = unique([
        'assets/bg_j.webp',
        'assets/bg_s.webp',
        ...Object.values(BOOK_BACKGROUND_MAP || {})
      ]);
      return pool[Math.floor(Math.random() * pool.length)] || 'assets/bg_j.webp';
    });

    useEffect(() => {
      let active = true;
      async function loadActiveAnnouncement() {
        try {
          const payload = await requestGeographyUnifiedApi('/api/announcements/active');
          if (active) setBetaNotice(payload?.announcement || null);
        } catch (error) {
        }
      }
      void loadActiveAnnouncement();
      return () => {
        active = false;
      };
    }, []);

    const unifiedPayload = typeof useUnifiedSubjectBootstrap === 'function'
      ? useUnifiedSubjectBootstrap(GEOGRAPHY_SUBJECT_KEY)
      : null;
    const unifiedUser = unifiedPayload?.user || null;
    const subjectAccess = unifiedPayload?.subject_access || unifiedPayload?.resolved?.subject_access || null;
    const canOpenCourseware = useMemo(
      () => canOpenSubjectEngine(unifiedPayload, subjectAccess, unifiedUser),
      [unifiedPayload, subjectAccess, unifiedUser]
    );

    const stage = useMemo(() => getStage(courseData, stageId), [courseData, stageId]);
    const books = stage?.books || [];
    const book = useMemo(() => books.find(item => item.id === bookId) || null, [books, bookId]);

    const allChapterMap = useMemo(() => {
      if (!courseData?.stages?.length) return {};

      const chapterMap = {};
      courseData.stages.forEach(stageItem => {
        stageItem.books.forEach(bookItem => {
          bookItem.chapters.forEach(chapter => {
            chapterMap[chapter.id] = chapter;
          });
        });
      });
      return chapterMap;
    }, [courseData]);

    useEffect(() => {
      if (view !== 'landing') return undefined;

      const backgroundVideo = document.querySelector('[data-geography-landing-video]');
      if (!(backgroundVideo instanceof HTMLVideoElement)) return undefined;

      const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setLandingUsesImageBackground(isMobileOrTablet);
      if (isMobileOrTablet) {
        if (backgroundVideo) backgroundVideo.remove();
        return undefined;
      }

      backgroundVideo.autoplay = true;
      backgroundVideo.loop = true;
      backgroundVideo.muted = true;
      backgroundVideo.defaultMuted = true;
      backgroundVideo.controls = false;
      backgroundVideo.playsInline = true;
      backgroundVideo.disablePictureInPicture = true;
      backgroundVideo.disableRemotePlayback = true;

      const playPromise = backgroundVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});

      return () => {
      };
    }, [view]);

    useEffect(() => {
      if (view !== 'landing' || !landingUsesImageBackground || landingBackgroundPool.length < 2) return undefined;

      const timer = window.setInterval(() => {
        setLandingImageBackground(current => {
          const options = landingBackgroundPool.filter(item => item !== current);
          return options[Math.floor(Math.random() * options.length)] || current;
        });
      }, 8000);

      return () => window.clearInterval(timer);
    }, [view, landingUsesImageBackground, landingBackgroundPool]);

    useEffect(() => {
      let ignore = false;

      (async () => {
        const [course, manifest, engineConfig] = await Promise.all([
          loadCourseData(),
          fetchJsonSafe(VISUAL_MANIFEST_PATH),
          fetchUnifiedGeographyEngineConfig()
        ]);

        if (ignore) return;

        if (!course) {
          setLoadError('课程数据未能加载，请确认“课程架构数据.json”索引和各书册 JSON 文件都可以被本地服务器正常访问。');
          return;
        }

        setCourseData(course);
        setVisualManifest(manifest || { cards: [] });
        setEngineRuntimeMap(engineConfig || {});
      })();

      return () => {
        ignore = true;
      };
    }, []);

    const cards = useMemo(() => {
      if (!courseData) return [];

      return courseData.currentCardMapping
        .filter(mapping => {
          return (
            mapping.stageId === stageId &&
            (bookId === 'all' || mapping.bookId === bookId)
          );
        })
        .map((mapping, index) => {
          const cardKey = String(mapping?.cardId || '').trim();
          const baseEngineKey = String(mapping?.engine || '').trim();
          const runtimeConfig = (cardKey && engineRuntimeMap?.[cardKey]) || (baseEngineKey && engineRuntimeMap?.[baseEngineKey]) || null;
          return {
            mapping,
            runtimeConfig,
            baseIndex: index
          };
        })
        .filter(({ runtimeConfig }) => {
          if (!runtimeConfig) return true;
          return runtimeConfig.is_hidden !== true;
        })
        .sort((left, right) => {
          const leftSort = Number(left.runtimeConfig?.sort_order || 0);
          const rightSort = Number(right.runtimeConfig?.sort_order || 0);
          const leftWeight = leftSort > 0 ? leftSort : 100000 + left.baseIndex;
          const rightWeight = rightSort > 0 ? rightSort : 100000 + right.baseIndex;
          if (leftWeight !== rightWeight) return leftWeight - rightWeight;
          return left.baseIndex - right.baseIndex;
        })
        .map(({ mapping, runtimeConfig }) => {
          const bookItem = books.find(item => item.id === mapping.bookId) || books[0];
          const details = createCardDetails(mapping, allChapterMap);
          const hasRuntimeEnabled = runtimeConfig && Object.prototype.hasOwnProperty.call(runtimeConfig, 'is_enabled');
          const isLocked = hasRuntimeEnabled ? runtimeConfig.is_enabled === false : mapping.isLocked === true;
          return {
            ...details,
            stageId: mapping.stageId,
            bookId: mapping.bookId,
            bookLabel: bookItem?.label,
            visualLevel: mapping.visualLevel,
            isLocked
          };
        })
    }, [courseData, stageId, bookId, books, allChapterMap, engineRuntimeMap]);

    useEffect(() => {
      if (activeCardId && !cards.some(card => card.id === activeCardId)) {
        setActiveCardId(null);
      }
      if (coursewareCardId && !cards.some(card => card.id === coursewareCardId)) {
        setCoursewareCardId(null);
      }
    }, [cards, activeCardId, coursewareCardId]);

    const activeCard = useMemo(
      () => cards.find(card => card.id === activeCardId) || null,
      [cards, activeCardId]
    );

    const coursewareCard = useMemo(
      () => cards.find(card => card.id === coursewareCardId) || null,
      [cards, coursewareCardId]
    );

    const coursewareSceneEntry = useMemo(
      () => visualManifest?.cards?.find(item => item.cardId === coursewareCardId) || null,
      [visualManifest, coursewareCardId]
    );

    useEffect(() => {
      if (!coursewareCardId || canOpenCourseware) return;
      setCoursewareCardId(null);
      openSubjectSubscription();
    }, [coursewareCardId, canOpenCourseware]);

    useEffect(() => {
      if (!pendingOpenCardId || !courseData) return;
      if (typeof useUnifiedSubjectBootstrap === 'function' && !unifiedPayload) return;

      const targetMapping = courseData.currentCardMapping.find(mapping => String(mapping?.cardId || '').trim() === pendingOpenCardId);
      if (!targetMapping) {
        setPendingOpenCardId('');
        return;
      }

      const targetStageId = normalizeGeographyStageId(targetMapping.stageId) || stageId;
      const targetBookId = String(targetMapping.bookId || '').trim();
      if (targetStageId && targetStageId !== stageId) {
        setStageId(targetStageId);
        try {
          window.sessionStorage?.setItem(GEOGRAPHY_STAGE_STORAGE_KEY, targetStageId);
        } catch (error) {
        }
        setView('dashboard');
        return;
      }
      if (targetBookId && bookId !== targetBookId && !cards.some(card => card.id === pendingOpenCardId)) {
        setBookId(targetBookId);
        setView('dashboard');
        return;
      }

      const targetCard = cards.find(card => card.id === pendingOpenCardId);
      if (!targetCard) {
        setPendingOpenCardId('');
        return;
      }
      if (targetCard.isLocked && !isGeographyLocalPreviewHost()) {
        setActiveCardId(pendingOpenCardId);
        setPendingOpenCardId('');
        return;
      }
      if (!canOpenCourseware) {
        setPendingOpenCardId('');
        setCoursewareCardId(null);
        openSubjectSubscription();
        return;
      }

      setOverlayMode('');
      setActiveCardId(null);
      setCoursewareCardId(pendingOpenCardId);
      setPendingOpenCardId('');
      setView('dashboard');
    }, [pendingOpenCardId, courseData, unifiedPayload, canOpenCourseware, stageId, bookId, cards]);

    const activeBackground = resolveLocalMediaKey(
      BOOK_BACKGROUND_MAP[bookId] || (stageId === 'junior' ? 'assets/bg_j.webp' : 'assets/bg_s.webp'),
      stageId === 'junior' ? 'assets/bg_j.webp' : 'assets/bg_s.webp'
    );
    const coursewareBackground = resolveLocalMediaKey(
      BOOK_BACKGROUND_MAP[coursewareCard?.bookId] || activeBackground,
      activeBackground
    );
    const currentStageLabel = stage?.label || '地理学科';
    const currentBookLabel = book?.label || '全部单元';
    const displayName = unifiedUser?.username || unifiedUser?.member_id || '游客模式';
    const memberId = unifiedUser?.member_id || '登录后可查看';
    const membershipTier = formatTierText(subjectAccess?.membership_tier || unifiedUser?.membership_tier || '');
    const accessStatus = formatAccessStatusText(getEffectiveSubjectAccessStatus(subjectAccess, unifiedUser));
    const identityLabel = formatIdentityText(unifiedUser?.identity, unifiedUser?.auth_source);
    const phoneText = maskPhoneText(unifiedUser?.phone);
    const registeredAtText = formatDateTimeText(unifiedUser?.created_at);
    const accessExpiresText = formatDateTimeText(
      subjectAccess?.expires_at || unifiedUser?.trial_expires_at || unifiedUser?.expires_at || unifiedUser?.expired_at || null
    );
    const accessMode = GEOGRAPHY_ACCESS_MODE_LABELS[String(unifiedPayload?.access_mode || unifiedPayload?.capabilities?.access_mode || '').trim().toLowerCase()] || '同步中';
    const profileHref = useMemo(
      () => buildUnifiedGeographyHref('subject_profile', { tab: 'profile' }),
      []
    );
    const currentAuthHeaders = typeof getUnifiedSubjectAuthHeaders === 'function'
      ? (getUnifiedSubjectAuthHeaders() || {})
      : {};
    const hasAuthorizedAccount = Boolean(String(currentAuthHeaders?.Authorization || '').trim())
      && String(unifiedUser?.auth_source || '').trim().toLowerCase() !== 'local-preview';
    const resetDashboardState = () => {
      setOverlayMode('');
      setCoursewareCardId(null);
      setActiveCardId(null);
      setBookId(DEFAULTS.book);
    };
    const returnCoursewareToList = () => {
      setCoursewareCardId(null);
      setActiveCardId(null);
    };

    const enterStage = nextStageId => {
      setStageId(nextStageId);
      try {
        window.sessionStorage?.setItem(GEOGRAPHY_STAGE_STORAGE_KEY, nextStageId);
      } catch (error) {
      }
      resetDashboardState();
      setView('dashboard');
    };

    const backToHub = () => {
      resetDashboardState();
      setView('landing');
    };
    const closeOverlay = () => {
      setOverlayMode('');
      setMemberIdCopied(false);
    };
    const openOverlay = nextOverlayMode => {
      setOverlayMode(nextOverlayMode);
    };
    const requestCoursewareOpen = cardId => {
      const targetCard = cards.find(card => card.id === cardId);
      if (!targetCard || targetCard.isLocked) return;
      if (!canOpenCourseware) {
        setCoursewareCardId(null);
        openSubjectSubscription();
        return;
      }
      setActiveCardId(null);
      setCoursewareCardId(cardId);
    };

    const handleCopyMemberId = async () => {
      if (!unifiedUser?.member_id) return;
      const copied = await copyGeographyText(unifiedUser.member_id);
      setMemberIdCopied(Boolean(copied));
      if (copied) {
        window.setTimeout(() => setMemberIdCopied(false), 1800);
      }
    };

    const handleLogout = async () => {
      if (loggingOut) return;
      setLoggingOut(true);

      try {
        if (typeof logoutFromUnifiedSubject === 'function') {
          await logoutFromUnifiedSubject(GEOGRAPHY_SUBJECT_KEY);
          return;
        }

        const authHeaders = createGeographySubjectHeaders();
        try {
          await fetch('/api/unified/auth/logout', {
            method: 'POST',
            credentials: 'same-origin',
            headers: authHeaders
          });
        } catch (error) {
        }

        try {
          window.localStorage?.removeItem('shg_token');
        } catch (error) {
        }

        try {
          window.sessionStorage?.removeItem(`shg:subject-bootstrap:${GEOGRAPHY_SUBJECT_KEY}`);
        } catch (error) {
        }

        window.location.href = typeof getUnifiedPortalHref === 'function'
          ? getUnifiedPortalHref('logout', GEOGRAPHY_SUBJECT_KEY)
          : '/';
      } finally {
        setLoggingOut(false);
      }
    };

    if (loadError) {
      return (
        <div className="fixed inset-0 bg-[#080808] text-zinc-100 flex items-center justify-center px-6">
          <div className="w-full max-w-2xl rounded-[36px] border border-rose-500/20 bg-black/60 p-10 text-center backdrop-blur-3xl">
            <div className="text-[11px] tracking-[0.35em] uppercase text-rose-300 mb-3">加载错误</div>
            <div className="text-3xl font-black italic tracking-tight text-white">Geography Curriculum</div>
            <div className="text-base text-zinc-300 mt-4 leading-8">{loadError}</div>
            <div className="text-sm text-zinc-400 mt-4">
              建议用本地静态服务器打开页面，例如 `python -m http.server 5500`。
            </div>
          </div>
        </div>
      );
    }

    if (!courseData) {
      return (
        <div className="shg-subject-auth-overlay !bg-[#080808]">
          <div className="shg-subject-auth-card">
            <div className="shg-subject-auth-glow shg-subject-auth-glow-a"></div>
            <div className="shg-subject-auth-glow shg-subject-auth-glow-b"></div>
            <div className="shg-subject-auth-visual" aria-hidden="true">
              <span className="shg-subject-auth-orbit shg-subject-auth-orbit-a"></span>
              <span className="shg-subject-auth-orbit shg-subject-auth-orbit-b"></span>
              <span className="shg-subject-auth-core-ring"></span>
              <span className="shg-subject-auth-core"></span>
            </div>
            <p className="shg-subject-auth-eyebrow">SHIGUANG VISION</p>
            <div className="shg-subject-auth-meta-row">
              <div className="shg-subject-auth-meta">地理可视化</div>
              <div className="shg-subject-auth-phase">系统载入中</div>
            </div>
            <h1 className="shg-subject-auth-title">正在准备教学资源</h1>
            <p className="shg-subject-auth-desc">
              权限核验已通过，正在初始化地理课程架构与可视化资源，请稍候。
            </p>
            <div className="shg-subject-auth-progress" aria-hidden="true">
              <span className="is-done">身份识别</span>
              <span className="is-done">权限核验</span>
              <span className="is-active">系统载入</span>
            </div>
          </div>
        </div>
      );
    }

    if (view === 'landing') {
      window.location.replace('./stage-selector.html');
      return null;
    }

    if (coursewareCard && canOpenCourseware) {
      return (
        <>
          <CoursewareWorkbench
          card={coursewareCard}
          sceneEntry={coursewareSceneEntry}
          backgroundImage={coursewareBackground}
          onBack={returnCoursewareToList}
        />
        <GeographyBetaNotice announcement={betaNotice} onClose={() => setBetaNotice(null)} />
      </>
      );
    }

    return (
      <>
        <LandscapeOnlyViewport
          title={activeCard?.title || stage?.label || 'THE GEOGRAPHY CURRICULUM'}
        backgroundImage={activeBackground}
        onBack={() => {
          if (activeCardId) {
            setActiveCardId(null);
            return;
          }
          backToHub();
        }}
      >
        {viewport => {
          const { compact, frame } = viewport;
          const narrowStack = frame.narrowStack || !viewport.isLandscape;
          const portraitCompact = narrowStack && (!viewport.isLandscape || frame.width <= 760);
          const topBarStacked = frame.width < 1220;
          const shellMaxWidth = narrowStack ? frame.width : frame.ultraWide ? 1840 : frame.roomy ? 1660 : 1280;
          const detailGap = narrowStack ? 12 : frame.ultraWide ? 36 : frame.shortHeight ? 20 : frame.dense ? 28 : 48;
          const detailAsideWidth = frame.detailAsideWidth;
          const gridGap = portraitCompact ? 8 : frame.tinyLandscape ? 10 : frame.shortHeight ? 14 : frame.ultraWide ? 24 : frame.roomy ? 22 : frame.dense ? 14 : 24;
          const dashboardPaddingTop = portraitCompact ? 4 : Math.max(10, frame.shellPaddingY - (frame.ultraWide ? 24 : frame.roomy ? 18 : frame.shortHeight ? 8 : 14));
          const contentPadding = activeCard
            ? `${frame.shellPaddingY}px ${frame.shellPaddingX}px`
            : `${dashboardPaddingTop}px ${frame.shellPaddingX}px ${frame.shellPaddingY}px`;
          const cardInteractionInset = portraitCompact ? 4 : frame.ultraWide ? 20 : frame.roomy ? 18 : frame.dense ? 12 : 16;
          const headerHeight = portraitCompact ? 38 : narrowStack ? 44 : frame.ultraWide ? 72 : frame.roomy ? 66 : frame.shortHeight ? 52 : frame.dense ? 56 : 60;
          const headerXPadding = portraitCompact ? 8 : narrowStack ? 10 : frame.ultraWide ? 40 : frame.roomy ? 36 : frame.dense ? 16 : 32;
          const activeTitleLength = String(activeCard?.title || '').trim().length;
          const baseDetailTitleSize = narrowStack
            ? (portraitCompact ? 26 : 30)
            : frame.tinyLandscape
            ? 26
            : frame.shortHeight
              ? 34
              : frame.ultraWide
                ? 74
                : frame.roomy
                  ? 66
                  : compact
                    ? 40
                    : 60;
          const titleLengthScale = activeTitleLength >= 10
            ? 0.78
            : activeTitleLength >= 7
              ? 0.88
              : 1;
          const detailTitleSize = Math.round(baseDetailTitleSize * titleLengthScale);
          const minDetailTitleSize = narrowStack ? 21 : frame.tinyLandscape ? 22 : 30;
          const detailTitleStyle = {
            fontSize: `${Math.max(minDetailTitleSize, detailTitleSize)}px`,
            lineHeight: narrowStack || frame.tinyLandscape ? 0.9 : 0.94,
            maxWidth: '100%'
          };
          const detailTitleBlockClass = narrowStack ? 'mb-2' : frame.tinyLandscape ? 'mb-2' : compact ? 'mb-4' : 'mb-6';
          const detailTitleMarginClass = frame.tinyLandscape ? 'mb-1' : 'mb-2';
          const detailPreviewHeight = narrowStack
            ? Math.max(
                frame.width < 480 ? 224 : 292,
                Math.min(
                  frame.width < 480 ? 286 : 340,
                  Math.round(Math.min(frame.height * 0.32, frame.width * 0.44))
                )
              )
            : null;
          const detailPreviewRadius = narrowStack ? '22px' : frame.shortHeight ? '34px' : compact ? '40px' : '60px';
          const detailPanelPadding = narrowStack ? '14px' : frame.ultraWide ? '36px' : compact ? '20px' : '32px';
          const detailPanelRadius = narrowStack ? '20px' : frame.ultraWide ? '44px' : compact ? '28px' : '40px';
          const detailPanelMarginBottom = narrowStack ? '0' : compact ? '16px' : '24px';
          const detailPointsClass = narrowStack ? 'space-y-2 mb-4' : 'space-y-4 mb-8';
          const detailPointClass = `flex ${narrowStack ? 'text-[12px]' : 'text-[13px]'} text-zinc-300 font-medium ${narrowStack ? 'gap-2.5 leading-snug' : compact ? 'gap-3' : 'gap-4'}`;
          const detailAbstractClass = `italic font-light text-zinc-400 ${narrowStack ? 'text-[12px] leading-snug line-clamp-3' : frame.shortHeight ? 'text-[13px] leading-relaxed' : frame.ultraWide ? 'text-[16px] leading-relaxed' : compact ? 'text-sm leading-relaxed' : 'text-[15px] leading-relaxed'}`;
          const detailPreviewShellClass = narrowStack
            ? 'relative mx-auto my-auto flex min-h-0 flex-col overflow-hidden border border-white/10 bg-zinc-950/82 shadow-[0_38px_110px_-30px_rgba(0,0,0,0.75)] backdrop-blur-2xl animate-in slide-in-from-right-10 duration-500'
            : 'relative h-full flex flex-col animate-in slide-in-from-right-10 duration-500 overflow-hidden';
          const detailPreviewShellStyle = narrowStack
              ? {
                width: 'min(90vw, 36rem)',
                maxHeight: 'min(700px, calc(100% - 12px))',
                borderRadius: '24px'
              }
            : undefined;
          const brandTextClass = frame.ultraWide ? 'text-[14px]' : frame.roomy ? 'text-[13px]' : frame.shortHeight ? 'text-[11px]' : 'text-[12px]';
          const headerMetaClass = portraitCompact ? 'text-[8px]' : frame.ultraWide ? 'text-[12px]' : frame.roomy ? 'text-[11px]' : frame.shortHeight ? 'text-[10px]' : 'text-[10px]';
          const headerActionClass = `${headerMetaClass} min-h-[38px] rounded-full border border-white/10 bg-white/[0.04] ${portraitCompact ? 'px-2.5 py-2 tracking-0' : narrowStack ? 'px-3 py-2 tracking-[0.08em]' : 'px-4 py-2.5 tracking-[0.16em]'} font-black text-white/78 transition-all hover:border-yellow-400/25 hover:bg-yellow-500/[0.08] hover:text-white active:scale-95`;
          const filterChipClass = portraitCompact ? 'text-[8px] px-1 py-1.5' : frame.ultraWide ? 'text-[13px] px-7 py-3' : frame.roomy ? 'text-[12px] px-6 py-2.5' : compact ? 'text-[11px] px-4 py-2' : 'text-[12px] px-6 py-2.5';
          const filterChipTrackingClass = portraitCompact ? 'tracking-0' : 'tracking-[0.15em]';
          const formatBookChipLabel = label => {
            if (!portraitCompact) return label;
            return String(label || '')
              .replace(/年级/g, '')
              .replace(/上册/g, '上')
              .replace(/下册/g, '下')
              .replace(/选择性必修/g, '选必')
              .replace(/必修/g, '必');
          };

          return (
            <div
              className="w-full h-full relative text-zinc-100 overflow-hidden flex flex-col"
              style={{
                background: `radial-gradient(circle at center, rgba(12,18,15,0.7) 0%, rgba(5,5,5,0.95) 100%), url(${resolveGeographyMediaThumbnailPath(activeBackground, 'assets/bg_j.webp', { width: 1920 })}) center/cover no-repeat`
              }}
            >
            <header
              className="border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl z-50 shrink-0"
              style={{
                height: `${headerHeight}px`,
                padding: `0 ${headerXPadding}px`
              }}
            >
              <button
                type="button"
                className={`min-h-[38px] flex items-center ${portraitCompact ? 'gap-2' : 'gap-3'} cursor-pointer group appearance-none bg-transparent text-left transition-all active:scale-[0.97] active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80`}
                onClick={() => {
                  resetDashboardState();
                }}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <div className={`${portraitCompact ? 'w-7 h-7' : 'w-8 h-8'} rounded-md border border-yellow-500/60 bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 group-active:bg-yellow-500/25 transition-all`}>
                  <span className="text-yellow-400 font-black text-[14px] translate-y-[0.5px]">地</span>
                </div>
                <span className={`${narrowStack ? 'hidden' : 'inline'} font-black tracking-widest text-white ${brandTextClass}`}>PowerTech在线教学演示</span>
              </button>
              <div className={`flex items-center ${portraitCompact ? 'gap-1.5' : compact ? 'gap-2.5' : 'gap-3.5'}`}>
                {activeCard ? (
                  <button
                    type="button"
                    onClick={() => setActiveCardId(null)}
                    className={`${headerMetaClass} min-h-[38px] px-2 font-black tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95 active:text-white`}
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    返回列表
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => openOverlay('account')}
                  className={headerActionClass}
                >
                  个人中心
                </button>
                <button
                  type="button"
                  onClick={openSubjectSubscription}
                  className={headerActionClass}
                >
                  订阅中心
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = '/'}
                  className={headerActionClass}
                >
                  退出系统
                </button>
                <div className={`${narrowStack ? 'hidden' : 'block'} h-4 w-[1px] bg-white/10`} />
                <div className={`${narrowStack ? 'hidden' : 'flex'} items-center gap-2.5 ${headerMetaClass} font-black text-yellow-500`}>
                  <span>{stage?.label}</span>
                  <span className="opacity-30">/</span>
                  <span className="text-white">{book?.label || '全部单元'}</span>
                </div>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <main
                className="flex-1 overflow-hidden"
                style={{ padding: contentPadding }}
                onClick={activeCard ? event => {
                  if (event.target === event.currentTarget) setActiveCardId(null);
                } : undefined}
              >
                <div
                  className="h-full mx-auto flex flex-col"
                  style={{ maxWidth: `${shellMaxWidth}px` }}
                  onClick={activeCard ? event => {
                    if (event.target === event.currentTarget) setActiveCardId(null);
                  } : undefined}
                >
                  {!activeCard ? (
                    <div className="h-full flex flex-col animate-in fade-in duration-700">
                      <div
                        className={`border-b border-white/5 pt-1 ${portraitCompact ? 'pb-1 mb-1' : 'pb-2 mb-2'} shrink-0 ${
                          topBarStacked ? `flex flex-col items-start ${portraitCompact ? 'gap-1.5' : 'gap-2.5'}` : 'flex items-center justify-between'
                        }`}
                      >
                        <div
                          className={portraitCompact ? 'grid w-full gap-1 min-w-0' : `flex overflow-x-auto no-scrollbar min-w-0 ${compact ? 'gap-2' : 'gap-2'}`}
                          style={portraitCompact ? { gridTemplateColumns: `repeat(${books.length + 1}, minmax(0, 1fr))` } : undefined}
                        >
                          <button
                            type="button"
                            onClick={() => setBookId('all')}
                            className={`font-black ${filterChipTrackingClass} rounded-full border transition-all whitespace-nowrap active:scale-95 ${filterChipClass} ${bookId === 'all' ? 'bg-yellow-500 text-black border-yellow-500 active:bg-yellow-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 active:border-white/25 active:text-white active:bg-white/10'}`}
                          >
                            {portraitCompact ? '全部' : '全部单元'}
                          </button>
                          {books.map(bookItem => (
                            <button
                              type="button"
                              key={bookItem.id}
                              onClick={() => setBookId(bookItem.id)}
                              className={`font-black ${filterChipTrackingClass} rounded-full border transition-all whitespace-nowrap active:scale-95 ${filterChipClass} ${bookId === bookItem.id ? 'bg-yellow-500 text-black border-yellow-500 active:bg-yellow-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 active:border-white/25 active:text-white active:bg-white/10'}`}
                            >
                              {formatBookChipLabel(bookItem.label)}
                            </button>
                          ))}
                        </div>
                        <div className={`${headerMetaClass} font-bold ${portraitCompact ? 'tracking-[0.08em]' : 'tracking-[0.3em]'} text-zinc-500 uppercase whitespace-nowrap ${topBarStacked ? '' : 'ml-4'}`}>
                          模块单元数量: {cards.length}
                        </div>
                      </div>
                      <div
                        className={`flex-1 overflow-y-auto ${portraitCompact ? 'no-scrollbar' : 'custom-scrollbar'}`}
                        style={{
                          paddingTop: `${cardInteractionInset}px`,
                          paddingRight: `${cardInteractionInset + (compact ? 8 : 12)}px`,
                          paddingBottom: `${cardInteractionInset + (portraitCompact ? 8 : 24)}px`,
                          paddingLeft: `${cardInteractionInset}px`
                        }}
                      >
                        <div
                          className="grid"
                          style={{
                            gridTemplateColumns: `repeat(${frame.cardColumns}, minmax(0, 1fr))`,
                            gap: `${gridGap}px`
                          }}
                        >
                          {cards.map(card => (
                            <CardTile
                              key={card.id}
                              card={card}
                              compact={compact}
                              dense={frame.dense}
                              shortHeight={frame.shortHeight}
                              tinyLandscape={frame.tinyLandscape}
                              narrowPortrait={portraitCompact}
                              roomy={frame.roomy || frame.ultraWide}
                              onOpen={cardId => {
                                closeOverlay();
                                setActiveCardId(cardId);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={detailPreviewShellClass}
                      style={detailPreviewShellStyle}
                      onClick={event => event.stopPropagation()}
                    >
                      <div
                        className={narrowStack ? 'flex-1 grid min-h-0 overflow-y-auto no-scrollbar' : 'flex-1 flex min-h-0'}
                        style={{
                          gap: `${detailGap}px`,
                          gridTemplateRows: narrowStack ? `${detailPreviewHeight}px auto` : undefined,
                          padding: narrowStack ? '14px 12px 0' : undefined
                        }}
                      >
                        <div className="flex-1 flex flex-col min-w-0">
                          <div className={`shrink-0 ${detailTitleBlockClass}`}>
                            <h2
                              className={`font-black italic tracking-tighter text-yellow-500 ${detailTitleMarginClass} uppercase break-words`}
                              style={detailTitleStyle}
                            >
                              {activeCard.title}
                            </h2>
                            <p className="text-[11px] tracking-[0.3em] font-black text-white/40 uppercase line-clamp-2">
                              {activeCard.detail}
                            </p>
                          </div>

                          <div
                            className="flex-1 bg-zinc-950/50 border border-white/5 relative overflow-hidden group"
                            style={{ borderRadius: detailPreviewRadius }}
                          >
                            <div className="w-full h-full">
                              <img
                                src={resolveGeographyMediaThumbnailPath(activeCard.image, activeCard.fallbackImage || 'assets/geography_card_bg_golden.webp', { width: 1280 })}
                                onError={event => handleGeographyMediaError(event, activeCard.fallbackImage || 'assets/geography_card_bg_golden.webp')}
                                className="w-full h-full object-cover"
                                style={narrowStack ? { objectPosition: 'center 42%' } : undefined}
                                alt=""
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col shrink-0" style={{ width: narrowStack ? '100%' : `${detailAsideWidth}px` }}>
                          <div
                            className={`${narrowStack ? '' : 'flex-1'} bg-zinc-900/60 border border-white/5 ${narrowStack ? 'overflow-hidden' : 'overflow-y-auto'} no-scrollbar`}
                            style={{
                              padding: detailPanelPadding,
                              borderRadius: detailPanelRadius,
                              marginBottom: detailPanelMarginBottom
                            }}
                          >
                            <h5 className={`text-[9px] font-black text-zinc-400 tracking-widest uppercase ${narrowStack ? 'mb-3' : compact ? 'mb-4' : 'mb-6'}`}>
                              核心要点 / Objectives
                            </h5>
                            <div className={detailPointsClass}>
                              {activeCard.points.map(point => (
                                <div key={point} className={detailPointClass}>
                                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 shrink-0" />
                                  {point}
                                </div>
                              ))}
                            </div>
                            
                            <div className={`${narrowStack ? 'pt-3' : 'pt-6'} border-t border-white/10 mt-auto`}>
                              <h5 className={`text-[9px] font-black text-yellow-400 tracking-widest uppercase ${narrowStack ? 'mb-2' : 'mb-3'}`}>
                                摘要 / Abstract
                              </h5>
                              <p className={detailAbstractClass}>
                                {activeCard.abstract}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            data-courseware-enter="true"
                            data-card-id={activeCard.id}
                            onClick={() => requestCoursewareOpen(activeCard.id)}
                            className={`${narrowStack ? 'hidden' : 'w-full'} bg-yellow-500 text-black font-black text-sm shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.985] active:bg-yellow-400 active:shadow-yellow-500/35 transition-all shrink-0 ${compact ? 'py-4 rounded-xl tracking-widest' : 'py-5 rounded-2xl tracking-[0.2em]'}`}
                          >
                            进入交互课件
                          </button>
                        </div>
                      </div>
                      {narrowStack ? (
                        <div className="shrink-0 border-t border-white/10 bg-black/78 p-3 backdrop-blur-2xl">
                          <button
                            type="button"
                            data-courseware-enter="true"
                            data-card-id={activeCard.id}
                            onClick={() => requestCoursewareOpen(activeCard.id)}
                            className="w-full min-h-[44px] rounded-xl bg-yellow-500 text-sm font-black tracking-widest text-black shadow-xl shadow-yellow-500/25 transition-all active:scale-[0.985] active:bg-yellow-400"
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                          >
                            进入交互课件
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </main>
            </div>

            {overlayMode === 'account' ? (
              <DashboardOverlayShell
                eyebrow="GEOGRAPHY ACCOUNT"
                title="个人中心"
                subtitle="查看会员资料、公告消息和意见箱记录，所有信息都会跟随你的账号一起同步。"
                onClose={closeOverlay}
                maxWidth="max-w-6xl"
              >
                <div className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-300/85">会员资料</div>
                          <div className="mt-3 text-3xl font-black italic tracking-tight text-white">{displayName}</div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-yellow-400/18 bg-yellow-500/[0.08] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-yellow-100">
                              {membershipTier}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white/74">
                              {accessStatus}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-[170px] rounded-[22px] border border-white/10 bg-[#06110f]/70 px-4 py-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/36">会员编号</div>
                          <div className="mt-3 break-all text-sm font-semibold text-white/88">{memberId}</div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[24px] border border-yellow-500/12 bg-yellow-500/[0.08] px-4 py-4 text-sm leading-7 text-white/78">
                        {hasAuthorizedAccount
                          ? '当前账号已进入地理可视化工作台，你可以在这里接收公告并提交使用建议。'
                          : '登录后可以同步完整会员信息、查看公告动态，并保留你的意见反馈记录。'}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          { label: '身份', value: identityLabel },
                          { label: '手机号', value: phoneText },
                          { label: '注册时间', value: registeredAtText },
                          { label: '访问范围', value: accessMode }
                        ].map(item => (
                          <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">{item.label}</div>
                            <div className="mt-3 text-base font-black text-white break-words">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCopyMemberId}
                          disabled={!unifiedUser?.member_id}
                          className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black tracking-[0.12em] text-white transition-all hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Icon name={memberIdCopied ? 'Check' : 'Copy'} size={16} />
                          {memberIdCopied ? '已复制会员号' : '复制会员号'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { void handleLogout(); }}
                          disabled={loggingOut}
                          className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-rose-400/18 bg-rose-500/[0.10] px-4 py-3 text-sm font-black tracking-[0.12em] text-rose-50 transition-all hover:bg-rose-500/[0.16] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Icon name="LogOut" size={16} />
                          {loggingOut ? '处理中...' : hasAuthorizedAccount ? '退出登录' : '前往登录'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">当前学习区</div>
                        <div className="mt-3 text-2xl font-black text-white">{currentStageLabel}</div>
                        <div className="mt-2 text-base font-semibold text-yellow-300">{currentBookLabel}</div>
                        <div className="mt-4 text-sm leading-7 text-white/62">
                          你当前正在浏览的内容会保持在这里，切换章节后也能快速回到最近的学习位置。
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">账号状态</div>
                        <div className="mt-4 grid gap-3">
                          {[
                            { label: '会员类型', value: membershipTier },
                            { label: '学科权限', value: accessStatus },
                            { label: '有效期', value: accessExpiresText }
                          ].map(item => (
                            <div key={item.label} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/34">{item.label}</div>
                              <div className="mt-2 text-sm font-black text-white break-words">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <GeographyAnnouncementCenter enabled={hasAuthorizedAccount} loginHref={profileHref} />
                    <GeographyFeedbackCenter enabled={hasAuthorizedAccount} loginHref={profileHref} />
                  </div>
                </div>
              </DashboardOverlayShell>
            ) : null}

          </div>
          );
        }}
      </LandscapeOnlyViewport>
      <GeographyBetaNotice announcement={betaNotice} onClose={() => setBetaNotice(null)} />
    </>
    );
  }

  app.App = App;

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();

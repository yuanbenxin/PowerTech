/*
  Unified subject auth bridge for the math app.
  Reads the shared subject bootstrap populated by the platform gate.
*/

window.MathApp = window.MathApp || {};
(() => {
  const {
    useState,
    useEffect
  } = React;
  const app = window.MathApp;
  const UNIFIED_SUBJECT_KEY = 'math';
  const SUBJECT_BOOTSTRAP_STORAGE_PREFIX = 'shg:subject-bootstrap:';
  const UNIFIED_TOKEN_STORAGE_KEY = 'shg_token';
  function isLocalPreviewHost() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const mode = String(params.get('subjectAuth') || '').trim().toLowerCase();
      if (mode === 'off') return true;
      if (mode === 'on') return false;
    } catch (error) {}
    const protocol = String(window.location.protocol || '').trim().toLowerCase();
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  }
  function createLocalPreviewBootstrap(subjectKey = UNIFIED_SUBJECT_KEY) {
    const normalizedSubjectKey = String(subjectKey || '').trim() || UNIFIED_SUBJECT_KEY;
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const user = {
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
    };
    const subjectAccess = {
      subject_key: normalizedSubjectKey,
      subject_name: '数学可视化',
      access_status: 'active',
      membership_tier: 'local-preview',
      expires_at: expiresAt
    };
    return {
      ok: true,
      user,
      subject_access: subjectAccess,
      resolved: {
        user: Object.assign({}, user),
        subject_access: Object.assign({}, subjectAccess)
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
  function normalizeLocalPreviewBootstrap(subjectKey = UNIFIED_SUBJECT_KEY, payload = null) {
    if (!payload || typeof payload !== 'object') return payload;
    const capabilities = payload.capabilities && typeof payload.capabilities === 'object' ? payload.capabilities : {};
    const authSource = String(payload.user?.auth_source || payload.resolved?.user?.auth_source || '').trim().toLowerCase();
    if (authSource !== 'local-preview' && capabilities.local_preview !== true) return payload;
    const normalizedSubjectKey = String(subjectKey || '').trim() || UNIFIED_SUBJECT_KEY;
    const fallback = createLocalPreviewBootstrap(normalizedSubjectKey);
    const user = Object.assign({}, fallback.user, payload.user || {}, {
      auth_source: 'local-preview'
    });
    user.subject_capabilities = Object.assign({}, fallback.user.subject_capabilities, user.subject_capabilities || {}, {
      enter_shell: true,
      open_engine: true
    });
    const subjectAccess = Object.assign({}, fallback.subject_access, payload.subject_access || {}, {
      subject_key: normalizedSubjectKey,
      access_status: 'active',
      membership_tier: payload.subject_access?.membership_tier || 'local-preview'
    });
    const resolvedUser = Object.assign({}, fallback.resolved.user, payload.resolved?.user || user, {
      auth_source: 'local-preview'
    });
    resolvedUser.subject_capabilities = Object.assign({}, fallback.user.subject_capabilities, resolvedUser.subject_capabilities || {}, {
      enter_shell: true,
      open_engine: true
    });
    const resolvedSubjectAccess = Object.assign({}, fallback.resolved.subject_access, payload.resolved?.subject_access || subjectAccess, {
      subject_key: normalizedSubjectKey,
      access_status: 'active',
      membership_tier: payload.resolved?.subject_access?.membership_tier || subjectAccess.membership_tier || 'local-preview'
    });
    return Object.assign({}, fallback, payload, {
      ok: true,
      user,
      subject_access: subjectAccess,
      resolved: Object.assign({}, payload.resolved || {}, {
        user: resolvedUser,
        subject_access: resolvedSubjectAccess
      }),
      capabilities: Object.assign({}, capabilities, {
        enter_shell: true,
        open_engine: true,
        access_mode: 'full',
        local_preview: true
      })
    });
  }
  function ensureLocalPreviewBootstrap(subjectKey = UNIFIED_SUBJECT_KEY) {
    const payload = createLocalPreviewBootstrap(subjectKey);
    writeUnifiedSubjectBootstrap(subjectKey, payload);
    return payload;
  }
  function getBootstrapStorageKey(subjectKey = UNIFIED_SUBJECT_KEY) {
    return `${SUBJECT_BOOTSTRAP_STORAGE_PREFIX}${String(subjectKey || '').trim() || UNIFIED_SUBJECT_KEY}`;
  }
  function readUnifiedSubjectBootstrap(subjectKey = UNIFIED_SUBJECT_KEY) {
    try {
      const raw = window.sessionStorage?.getItem(getBootstrapStorageKey(subjectKey));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return normalizeLocalPreviewBootstrap(subjectKey, parsed?.payload || null);
    } catch (error) {
      return null;
    }
  }
  function getUnifiedSubjectBootstrapTokenKey(token = getStoredUnifiedToken()) {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) return 'guest';
    return `${normalizedToken.length}:${normalizedToken.slice(0, 12)}:${normalizedToken.slice(-12)}`;
  }
  function writeUnifiedSubjectBootstrap(subjectKey = UNIFIED_SUBJECT_KEY, payload = null) {
    const normalizedSubjectKey = String(subjectKey || '').trim() || UNIFIED_SUBJECT_KEY;
    if (!payload) return null;
    const normalizedPayload = normalizeLocalPreviewBootstrap(normalizedSubjectKey, payload);
    const token = getStoredUnifiedToken();
    const record = {
      subjectKey: normalizedSubjectKey,
      payload: normalizedPayload,
      cachedAt: Date.now(),
      tokenKey: getUnifiedSubjectBootstrapTokenKey(token),
      tokenPresent: Boolean(token),
      source: 'subject-auth-bridge'
    };
    try {
      window.sessionStorage?.setItem(getBootstrapStorageKey(normalizedSubjectKey), JSON.stringify(record));
    } catch (error) {}
    return record;
  }
  function formatAccessStatus(status) {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'active') return '已开通';
    if (normalized === 'expired') return '已到期';
    if (normalized === 'inactive') return '未开通';
    return normalized || '未设置';
  }
  function formatTier(tier) {
    const normalized = String(tier || '').trim().toLowerCase();
    if (normalized === 'founding') return '初创会员';
    if (normalized === 'normal' || normalized === 'regular') return '正式会员';
    if (normalized === 'trial') return '试用会员';
    return normalized || '未设置';
  }
  function formatDateTime(value) {
    if (!value) return '未设置';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未设置';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  function getUnifiedPortalHref(reason = 'subject_profile', subjectKey = UNIFIED_SUBJECT_KEY) {
    try {
      const url = new URL('/', window.location.href);
      const normalizedReason = String(reason || '').trim().toLowerCase() || 'subject_profile';
      url.searchParams.set('subject', String(subjectKey || '').trim() || UNIFIED_SUBJECT_KEY);
      url.searchParams.set('reason', normalizedReason);
      if (normalizedReason !== 'logout' && normalizedReason !== 'subject_exit') {
        url.searchParams.set('return', window.location.href);
      }
      return url.toString();
    } catch (error) {
      return '/';
    }
  }
  function getStoredUnifiedToken() {
    try {
      return String(window.localStorage?.getItem(UNIFIED_TOKEN_STORAGE_KEY) || '').trim();
    } catch (error) {
      return '';
    }
  }
  function getUnifiedSubjectAuthHeaders(extraHeaders = {}) {
    const token = getStoredUnifiedToken();
    return token ? Object.assign({}, extraHeaders, {
      Authorization: `Bearer ${token}`
    }) : Object.assign({}, extraHeaders);
  }
  async function fetchUnifiedSubjectBootstrap(subjectKey = UNIFIED_SUBJECT_KEY) {
    const normalizedSubjectKey = String(subjectKey || '').trim() || UNIFIED_SUBJECT_KEY;
    if (isLocalPreviewHost()) {
      return ensureLocalPreviewBootstrap(normalizedSubjectKey);
    }
    const response = await fetch(`/api/unified/bootstrap/subjects/${encodeURIComponent(normalizedSubjectKey)}`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: getUnifiedSubjectAuthHeaders({
        'X-SHG-Subject': normalizedSubjectKey
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.ok === false) {
      return null;
    }
    writeUnifiedSubjectBootstrap(normalizedSubjectKey, payload);
    return payload;
  }
  async function logoutFromUnifiedSubject(subjectKey = UNIFIED_SUBJECT_KEY) {
    const token = getStoredUnifiedToken();
    if (isLocalPreviewHost()) {
      try {
        window.localStorage?.removeItem(UNIFIED_TOKEN_STORAGE_KEY);
      } catch (error) {}
      try {
        window.sessionStorage?.removeItem(getBootstrapStorageKey(subjectKey));
      } catch (error) {}
      return ensureLocalPreviewBootstrap(subjectKey);
    }
    try {
      await fetch('/api/unified/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      });
    } catch (error) {}
    try {
      window.localStorage?.removeItem(UNIFIED_TOKEN_STORAGE_KEY);
    } catch (error) {}
    try {
      window.sessionStorage?.removeItem(getBootstrapStorageKey(subjectKey));
    } catch (error) {}
    window.location.href = getUnifiedPortalHref('logout', subjectKey);
  }
  function useUnifiedSubjectBootstrap(subjectKey = UNIFIED_SUBJECT_KEY) {
    const [payload, setPayload] = useState(() => isLocalPreviewHost() ? ensureLocalPreviewBootstrap(subjectKey) : readUnifiedSubjectBootstrap(subjectKey));
    useEffect(() => {
      let active = true;
      let refreshPromise = null;
      const commitPayload = nextPayload => {
        if (!active || !nextPayload) return;
        setPayload(nextPayload);
      };
      const syncFromStorage = () => {
        if (!active) return;
        const nextPayload = readUnifiedSubjectBootstrap(subjectKey);
        commitPayload(nextPayload);
      };
      const refreshFromApi = () => {
        if (!active) return Promise.resolve(null);
        if (refreshPromise) return refreshPromise;
        refreshPromise = fetchUnifiedSubjectBootstrap(subjectKey).then(nextPayload => {
          if (nextPayload) commitPayload(nextPayload);
          return nextPayload;
        }).catch(() => null).finally(() => {
          refreshPromise = null;
        });
        return refreshPromise;
      };
      if (isLocalPreviewHost()) {
        commitPayload(ensureLocalPreviewBootstrap(subjectKey));
        return () => {
          active = false;
        };
      }
      syncFromStorage();
      void refreshFromApi();
      const readyStore = window.__SHG_SUBJECT_GATE_READY__ || {};
      const readyPromise = readyStore[subjectKey];
      if (readyPromise && typeof readyPromise.then === 'function') {
        readyPromise.then(nextPayload => {
          if (!active) return;
          if (nextPayload) {
            commitPayload(nextPayload);
            return;
          }
          syncFromStorage();
        }).catch(() => {});
      }
      const handleFocus = () => {
        syncFromStorage();
        void refreshFromApi();
      };
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          handleFocus();
        }
      };
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        active = false;
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [subjectKey]);
    return payload;
  }
  function UnifiedAccountDock({
    subjectKey = UNIFIED_SUBJECT_KEY
  }) {
    const payload = useUnifiedSubjectBootstrap(subjectKey);
    const user = payload?.user || null;
    const subjectAccess = payload?.subject_access || payload?.resolved?.subject_access || null;
    const [open, setOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    if (!user) return null;
    const displayName = user.username || user.member_id || '统一账号';
    const memberId = user.member_id || '未设置';
    const membershipTier = formatTier(subjectAccess?.membership_tier || user.membership_tier || '');
    const accessStatus = formatAccessStatus(subjectAccess?.access_status || '');
    const expiresText = formatDateTime(subjectAccess?.expires_at || user.trial_expires_at || user.expires_at || user.expired_at || null);
    const handleLogout = async () => {
      if (loggingOut) return;
      setLoggingOut(true);
      await logoutFromUnifiedSubject(subjectKey);
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setOpen(true),
      className: "absolute right-4 bottom-4 z-[140] rounded-[22px] border border-white/10 bg-black/55 px-4 py-3 text-left text-white backdrop-blur-3xl shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-all hover:bg-black/70"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[9px] font-black uppercase tracking-[0.28em] text-slate-300/90"
    }, "\u7EDF\u4E00\u8D26\u53F7"), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-sm font-black leading-tight"
    }, displayName), /*#__PURE__*/React.createElement("div", {
      className: "mt-1 text-[11px] text-white/55"
    }, membershipTier, " \xB7 ", accessStatus)), open ? /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 z-[160] flex items-center justify-center bg-black/55 px-6 py-8 backdrop-blur-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-full max-w-md rounded-[30px] border border-white/10 bg-[#07110f]/95 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.36)]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between gap-4"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black uppercase tracking-[0.32em] text-slate-300/90"
    }, "PowerTech在线教学演示"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-2xl font-black italic tracking-tight"
    }, displayName), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm text-white/65"
    }, "\u5F53\u524D\u901A\u8FC7\u7EDF\u4E00\u5E73\u53F0\u8FDB\u5165\u6570\u5B66\u53EF\u89C6\u5316\u7CFB\u7EDF")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setOpen(false),
      className: "rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-black text-white/70 transition-all hover:text-white"
    }, "\u5173\u95ED")), /*#__PURE__*/React.createElement("div", {
      className: "mt-6 space-y-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black uppercase tracking-[0.24em] text-white/40"
    }, "\u4F1A\u5458\u7F16\u53F7"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-semibold text-white/90 break-all"
    }, memberId)), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 gap-3 sm:grid-cols-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black uppercase tracking-[0.24em] text-white/40"
    }, "\u4F1A\u5458\u7C7B\u578B"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-semibold text-white/90"
    }, membershipTier)), /*#__PURE__*/React.createElement("div", {
      className: "rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black uppercase tracking-[0.24em] text-white/40"
    }, "\u5B66\u79D1\u6743\u9650"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-semibold text-white/90"
    }, accessStatus))), /*#__PURE__*/React.createElement("div", {
      className: "rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-black uppercase tracking-[0.24em] text-white/40"
    }, "\u6709\u6548\u671F"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm font-semibold text-white/90"
    }, expiresText))), /*#__PURE__*/React.createElement("div", {
      className: "mt-6 flex flex-col gap-3 sm:flex-row"
    }, /*#__PURE__*/React.createElement("a", {
      href: getUnifiedPortalHref('subject_profile', subjectKey),
      className: "flex-1 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.22em] text-white/80 transition-all hover:bg-white/[0.08]"
    }, "\u8FD4\u56DE\u7EDF\u4E00\u5165\u53E3"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: handleLogout,
      disabled: loggingOut,
      className: "flex-1 rounded-[20px] bg-slate-400 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-black transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
    }, loggingOut ? '退出中...' : '退出登录')))) : null);
  }
  Object.assign(app, {
    UNIFIED_SUBJECT_KEY,
    getUnifiedPortalHref,
    getStoredUnifiedToken,
    getUnifiedSubjectAuthHeaders,
    fetchUnifiedSubjectBootstrap,
    readUnifiedSubjectBootstrap,
    useUnifiedSubjectBootstrap,
    logoutFromUnifiedSubject,
    UnifiedAccountDock
  });
})();

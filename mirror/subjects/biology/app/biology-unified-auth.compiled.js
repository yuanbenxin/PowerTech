/*
  Unified subject auth bridge for the biology app.
  Reads the shared subject bootstrap populated by the platform gate.
*/

window.BiologyApp = window.BiologyApp || {};
(() => {
  const {
    useState,
    useEffect
  } = React;
  const app = window.BiologyApp;
  const UNIFIED_SUBJECT_KEY = 'biology';
  const SUBJECT_BOOTSTRAP_STORAGE_PREFIX = 'shg:subject-bootstrap:';
  const UNIFIED_TOKEN_STORAGE_KEY = 'shg_token';
  function getBootstrapStorageKey(subjectKey = UNIFIED_SUBJECT_KEY) {
    return `${SUBJECT_BOOTSTRAP_STORAGE_PREFIX}${String(subjectKey || '').trim() || UNIFIED_SUBJECT_KEY}`;
  }
  function readUnifiedSubjectBootstrap(subjectKey = UNIFIED_SUBJECT_KEY) {
    try {
      const raw = window.sessionStorage?.getItem(getBootstrapStorageKey(subjectKey));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.payload || null;
    } catch (error) {
      return null;
    }
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
      url.searchParams.set('subject', String(subjectKey || '').trim() || UNIFIED_SUBJECT_KEY);
      url.searchParams.set('reason', String(reason || '').trim() || 'subject_profile');
      url.searchParams.set('return', window.location.href);
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
  async function logoutFromUnifiedSubject(subjectKey = UNIFIED_SUBJECT_KEY) {
    const token = getStoredUnifiedToken();
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
    const [payload, setPayload] = useState(() => readUnifiedSubjectBootstrap(subjectKey));
    useEffect(() => {
      let active = true;
      const syncFromStorage = () => {
        if (!active) return;
        const nextPayload = readUnifiedSubjectBootstrap(subjectKey);
        if (nextPayload) {
          setPayload(nextPayload);
        }
      };
      syncFromStorage();
      const readyStore = window.__SHG_SUBJECT_GATE_READY__ || {};
      const readyPromise = readyStore[subjectKey];
      if (readyPromise && typeof readyPromise.then === 'function') {
        readyPromise.then(nextPayload => {
          if (!active) return;
          if (nextPayload) {
            setPayload(nextPayload);
            return;
          }
          syncFromStorage();
        }).catch(() => {});
      }
      window.addEventListener('focus', syncFromStorage);
      return () => {
        active = false;
        window.removeEventListener('focus', syncFromStorage);
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
      className: "text-[9px] font-black uppercase tracking-[0.28em] text-emerald-300/90"
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
      className: "text-[10px] font-black uppercase tracking-[0.32em] text-emerald-300/90"
    }, "PowerTech在线教学演示"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-2xl font-black italic tracking-tight"
    }, displayName), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-sm text-white/65"
    }, "\u5F53\u524D\u901A\u8FC7\u7EDF\u4E00\u5E73\u53F0\u8FDB\u5165\u751F\u7269\u53EF\u89C6\u5316\u7CFB\u7EDF")), /*#__PURE__*/React.createElement("button", {
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
      className: "flex-1 rounded-[20px] bg-emerald-400 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-black transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
    }, loggingOut ? '退出中...' : '退出登录')))) : null);
  }
  Object.assign(app, {
    UNIFIED_SUBJECT_KEY,
    getUnifiedPortalHref,
    getStoredUnifiedToken,
    getUnifiedSubjectAuthHeaders,
    readUnifiedSubjectBootstrap,
    useUnifiedSubjectBootstrap,
    logoutFromUnifiedSubject,
    UnifiedAccountDock
  });
})();

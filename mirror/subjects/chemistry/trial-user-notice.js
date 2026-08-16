(function trialUserNoticeModule(global, document) {
    'use strict';

    const HIDDEN_KEY_PREFIX = 'shg:trial-notice:hidden:';
    const WECHAT = '18584322518';
    let activeInstance = null;
    let toastTimer = null;

    function text(value, fallback = '') {
        const result = String(value == null ? '' : value).trim();
        return result || fallback;
    }

    function getSubjectAccess(payload, subjectKey) {
        if (payload?.subject_access && !Array.isArray(payload.subject_access)) return payload.subject_access;
        return Array.isArray(payload?.subject_access)
            ? payload.subject_access.find((item) => text(item?.subject_key).toLowerCase() === text(subjectKey).toLowerCase()) || null
            : null;
    }

    function getTrialState(options) {
        const payload = options.bootstrap || options.authPayload || {};
        const access = options.subjectAccess || getSubjectAccess(payload, options.subjectKey) || {};
        const user = options.authUser || payload.user || payload.resolved?.user || {};
        const tier = text(access.membership_tier || user.membership_tier || payload.membership_tier).toLowerCase();
        const accessStatus = text(access.access_status || payload.access_status).toLowerCase();
        const expiresAt = options.trialExpiresAt || access.expires_at || access.trial_expires_at || user.trial_expires_at || payload.trial_expires_at;
        const activatedAt = options.trialActivatedAt || access.activated_at || user.trial_activated_at || payload.trial_activated_at;
        const expiryMs = expiresAt ? new Date(expiresAt).getTime() : NaN;
        const activatedMs = activatedAt ? new Date(activatedAt).getTime() : NaN;
        const actualDurationMinutes = Number.isFinite(expiryMs) && Number.isFinite(activatedMs) && expiryMs > activatedMs
            ? Math.round((expiryMs - activatedMs) / 60000)
            : 0;
        const configuredDurationMinutes = Number(options.trialDurationMinutes || payload.trial?.duration_minutes || payload.trial_duration_minutes || 0);
        const durationMinutes = actualDurationMinutes || (Number.isFinite(configuredDurationMinutes) && configuredDurationMinutes > 0
            ? Math.round(configuredDurationMinutes)
            : 0);
        const statusAllowsEntry = accessStatus !== 'expired' && accessStatus !== 'inactive' && accessStatus !== 'denied';
        return {
            isTrial: tier === 'trial' && statusAllowsEntry && (!Number.isFinite(expiryMs) || expiryMs > Date.now()),
            expiresAt,
            expiryMs,
            durationMinutes,
            user
        };
    }

    function getUserKey(options, user) {
        return text(options.userId || user.id || user.user_id || user.username || user.phone, 'anonymous');
    }

    function isHidden(key) {
        try { return global.localStorage?.getItem(`${HIDDEN_KEY_PREFIX}${key}`) === '1'; } catch { return false; }
    }

    function setHidden(key) {
        try { global.localStorage?.setItem(`${HIDDEN_KEY_PREFIX}${key}`, '1'); } catch { /* private browsing */ }
    }

    function showToast(message) {
        const existing = document.querySelector('.shg-trial-notice-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'shg-trial-notice-toast';
        toast.setAttribute('role', 'status');
        toast.textContent = message;
        document.body.appendChild(toast);
        global.clearTimeout(toastTimer);
        toastTimer = global.setTimeout(() => toast.remove(), 2400);
    }

    function formatRemaining(expiryMs) {
        if (!Number.isFinite(expiryMs)) return '12小时试用';
        const seconds = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
        if (seconds <= 0) return '试用已结束';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}小时 ${minutes}分` : `${minutes}分`;
    }

    function formatTrialDuration(minutes) {
        const normalizedMinutes = Math.max(0, Math.round(Number(minutes) || 0));
        if (!normalizedMinutes) return '试用';
        const hours = Math.floor(normalizedMinutes / 60);
        const remainingMinutes = normalizedMinutes % 60;
        if (!hours) return `${remainingMinutes}分钟`;
        return remainingMinutes ? `${hours}小时${remainingMinutes}分` : `${hours}小时`;
    }

    function getSubscriptionHref(options) {
        const hostname = text(global.location?.hostname).toLowerCase();
        const private172 = hostname.match(/^172\.(\d{1,3})\./);
        const local = global.location?.protocol === 'file:'
            || hostname === 'localhost'
            || hostname === '127.0.0.1'
            || hostname === '::1'
            || hostname.startsWith('10.')
            || hostname.startsWith('192.168.')
            || (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
        const base = options.subscriptionPath || (local ? '/dist-subscription/index.html' : '/subscription/');
        try {
            const url = new URL(base, global.location.href);
            url.searchParams.set('subject', text(options.subjectKey));
            url.searchParams.set('return', options.returnPath || global.location.href);
            return url.toString();
        } catch { return base; }
    }

    function copyWechat() {
        const fallback = () => showToast(`客服微信：${WECHAT}`);
        try {
            if (!global.navigator?.clipboard?.writeText) return fallback();
            global.navigator.clipboard.writeText(WECHAT).then(() => showToast(`客服微信已复制：${WECHAT}`)).catch(fallback);
        } catch { fallback(); }
    }

    function mount(options = {}) {
        if (activeInstance) activeInstance.destroy();
        const subjectKey = text(options.subjectKey || global.__SHG_SUBJECT_GATE_CONFIG__?.subjectKey);
        const subjectName = text(options.subjectName || global.__SHG_SUBJECT_GATE_CONFIG__?.subjectName, '当前学科');
        const trial = getTrialState(options);
        const userKey = getUserKey(options, trial.user);
        if (!trial.isTrial || isHidden(userKey)) return null;

        const root = document.createElement('div');
        root.className = 'shg-trial-notice-root';
        root.setAttribute('role', 'presentation');
        root.innerHTML = `
            <article class="shg-trial-notice-dialog" role="dialog" aria-modal="true" aria-labelledby="shg-trial-notice-title">
                <header class="shg-trial-notice-head">
                    <div><p class="shg-trial-notice-eyebrow">PowerTech在线教学演示 · 试用体验</p><h2 class="shg-trial-notice-title" id="shg-trial-notice-title"></h2></div>
                    <button class="shg-trial-notice-close" type="button" aria-label="关闭试用提示">×</button>
                </header>
                <div class="shg-trial-notice-body">
                    <span class="shg-trial-notice-badge">试用权益已开启</span>
                    <p class="shg-trial-notice-lead"></p>
                    <p class="shg-trial-notice-copy">先完整体验，合适再订阅。试用结束后，可从右上角“订阅中心”继续开通。</p>
                    <div class="shg-trial-notice-summary"><div class="shg-trial-notice-summary-cell"><span>本次体验</span><strong class="shg-trial-notice-subject"></strong></div><div class="shg-trial-notice-summary-cell"><span>剩余体验时间</span><strong class="shg-trial-notice-countdown"></strong></div></div>
                    <div class="shg-trial-notice-service"><span>遇到使用问题？添加客服微信</span><button class="shg-trial-notice-wechat" type="button">${WECHAT}</button></div>
                    <div class="shg-trial-notice-actions"><button class="shg-trial-notice-primary" type="button">开始体验</button><button class="shg-trial-notice-secondary" type="button">不再提示</button></div>
                    <button class="shg-trial-notice-subscribe" type="button">查看订阅方案</button>
                </div>
            </article>`;
        document.body.appendChild(root);
        const dialog = root.querySelector('.shg-trial-notice-dialog');
        root.querySelector('.shg-trial-notice-title').textContent = `先体验${subjectName}，再决定是否订阅`;
        root.querySelector('.shg-trial-notice-lead').textContent = trial.durationMinutes
            ? `本次${formatTrialDuration(trial.durationMinutes)}试用期内，${subjectName}全部内容免费体验`
            : `试用期内，${subjectName}全部内容免费体验`;
        root.querySelector('.shg-trial-notice-subject').textContent = `${subjectName}全部内容`;
        const countdown = root.querySelector('.shg-trial-notice-countdown');
        const updateCountdown = () => { countdown.textContent = formatRemaining(trial.expiryMs); };
        updateCountdown();
        const countdownTimer = global.setInterval(updateCountdown, 30000);
        const close = () => { root.remove(); global.clearInterval(countdownTimer); if (activeInstance?.root === root) activeInstance = null; };
        const subscribe = () => {
            const href = getSubscriptionHref({ ...options, subjectKey });
            const opened = global.open?.(href, '_blank', 'noopener,noreferrer');
            if (!opened) global.location.href = href;
        };
        root.querySelector('.shg-trial-notice-close').addEventListener('click', close);
        root.querySelector('.shg-trial-notice-primary').addEventListener('click', close);
        root.querySelector('.shg-trial-notice-secondary').addEventListener('click', () => { setHidden(userKey); close(); showToast('已记住你的选择，后续进入其他学科不再提示。'); });
        root.querySelector('.shg-trial-notice-wechat').addEventListener('click', copyWechat);
        root.querySelector('.shg-trial-notice-subscribe').addEventListener('click', subscribe);
        root.addEventListener('click', (event) => { if (event.target === root) close(); });
        const onKeyDown = (event) => { if (event.key === 'Escape') close(); };
        document.addEventListener('keydown', onKeyDown);
        activeInstance = { root, close, destroy: () => { document.removeEventListener('keydown', onKeyDown); close(); } };
        return activeInstance;
    }

    global.SHGTrialNotice = { mount, dismiss: () => activeInstance?.close() };

    function mountFromBootstrap(payload) {
        const config = global.__SHG_SUBJECT_GATE_CONFIG__ || {};
        mount({ bootstrap: payload, subjectKey: config.subjectKey, subjectName: config.subjectName, returnPath: global.location.href });
    }

    global.addEventListener('shg:subject-auth-ready', (event) => mountFromBootstrap(event.detail || {}));
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { if (global.__SHG_SUBJECT_BOOTSTRAP__) mountFromBootstrap(global.__SHG_SUBJECT_BOOTSTRAP__); }, { once: true });
    } else if (global.__SHG_SUBJECT_BOOTSTRAP__) {
        mountFromBootstrap(global.__SHG_SUBJECT_BOOTSTRAP__);
    }
})(window, document);

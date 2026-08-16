/* Unified subject auth bridge for the Chinese app. */
window.ChineseApp = window.ChineseApp || {};

(() => {
    const { useState, useEffect } = React;
    const app = window.ChineseApp;
    const SUBJECT_KEY = 'chinese';
    const TOKEN_KEY = 'shg_token';
    const BOOTSTRAP_PREFIX = 'shg:subject-bootstrap:';

    function isLocalPreview() {
        const protocol = String(window.location.protocol || '').toLowerCase();
        const hostname = String(window.location.hostname || '').toLowerCase();
        const isLocalPreviewOrigin = protocol === 'file:' || ['localhost', '127.0.0.1', '::1'].includes(hostname);
        try {
            const mode = new URLSearchParams(window.location.search || '').get('subjectAuth');
            if (String(mode || '').toLowerCase() === 'on') return false;
            if (String(mode || '').toLowerCase() === 'off') return isLocalPreviewOrigin;
        } catch (error) {
        }
        return isLocalPreviewOrigin;
    }

    function bootstrapKey(subjectKey = SUBJECT_KEY) {
        return `${BOOTSTRAP_PREFIX}${subjectKey}`;
    }

    function getToken() {
        try { return String(window.localStorage?.getItem(TOKEN_KEY) || '').trim(); } catch (error) { return ''; }
    }

    function getAuthHeaders(extra = {}) {
        const token = getToken();
        return token ? Object.assign({}, extra, { Authorization: `Bearer ${token}` }) : Object.assign({}, extra);
    }

    function localBootstrap(subjectKey = SUBJECT_KEY) {
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        const user = {
            id: 'local-preview',
            username: '本地预览',
            member_id: 'LOCAL-PREVIEW',
            identity: 'teacher',
            auth_source: 'local-preview',
            membership_tier: 'local-preview'
        };
        const subjectAccess = {
            subject_key: subjectKey,
            subject_name: '初中语文可视化',
            access_status: 'active',
            membership_tier: 'local-preview',
            expires_at: expiresAt
        };
        return { ok: true, user, subject_access: subjectAccess, resolved: { user, subject_access: subjectAccess }, purchase_requests: null, capabilities: { enter_shell: true, open_engine: true, access_mode: 'full', local_preview: true } };
    }

    function readBootstrap(subjectKey = SUBJECT_KEY) {
        try {
            const record = JSON.parse(window.sessionStorage?.getItem(bootstrapKey(subjectKey)) || 'null');
            return record?.payload || null;
        } catch (error) {
            return null;
        }
    }

    function writeBootstrap(subjectKey = SUBJECT_KEY, payload = null) {
        if (!payload) return null;
        try { window.sessionStorage?.setItem(bootstrapKey(subjectKey), JSON.stringify({ payload, cachedAt: Date.now() })); } catch (error) {
        }
        return payload;
    }

    async function fetchBootstrap(subjectKey = SUBJECT_KEY) {
        if (isLocalPreview()) {
            const payload = localBootstrap(subjectKey);
            writeBootstrap(subjectKey, payload);
            return payload;
        }
        const response = await fetch(`/api/unified/bootstrap/subjects/${encodeURIComponent(subjectKey)}`, {
            method: 'GET', cache: 'no-store', credentials: 'same-origin', headers: getAuthHeaders({ 'X-SHG-Subject': subjectKey })
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload || payload.ok === false) return null;
        return writeBootstrap(subjectKey, payload);
    }

    async function requestUnifiedApi(path, options = {}) {
        const method = String(options.method || 'GET').toUpperCase();
        if (isLocalPreview()) {
            if (String(path).startsWith('/api/announcements/recent')) return { ok: true, items: [], unread_total: 0 };
            if (String(path).startsWith('/api/suggestions?')) return { ok: true, items: [], stats: { pending: 0, adopted: 0, rejected: 0 } };
            if (path === '/api/suggestions/submit' && method === 'POST') return { ok: true, item: null };
            return { ok: true };
        }
        const response = await fetch(path, {
            method,
            cache: 'no-store',
            credentials: 'same-origin',
            headers: getAuthHeaders(Object.assign({ 'X-SHG-Subject': SUBJECT_KEY }, options.json ? { 'Content-Type': 'application/json' } : {})),
            body: options.json ? JSON.stringify(options.json) : undefined
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.ok === false) {
            const error = new Error(String(payload?.message || '').trim() || `请求失败：${response.status}`);
            error.status = response.status;
            throw error;
        }
        return payload;
    }

    function getUnifiedPortalHref(reason = 'subject_profile', subjectKey = SUBJECT_KEY, params = {}) {
        try {
            const url = new URL('/', window.location.href);
            url.searchParams.set('subject', subjectKey);
            url.searchParams.set('reason', reason);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && String(value).trim()) url.searchParams.set(key, String(value));
            });
            if (!['logout', 'subject_exit'].includes(reason)) url.searchParams.set('return', window.location.href);
            return url.toString();
        } catch (error) {
            return '/';
        }
    }

    async function logoutFromUnifiedSubject(subjectKey = SUBJECT_KEY) {
        if (isLocalPreview()) {
            try { window.localStorage?.removeItem(TOKEN_KEY); window.sessionStorage?.removeItem(bootstrapKey(subjectKey)); } catch (error) {
            }
            window.location.href = 'index.html';
            return;
        }
        try { await fetch('/api/unified/auth/logout', { method: 'POST', credentials: 'same-origin', headers: getAuthHeaders() }); } catch (error) {
        }
        try { window.localStorage?.removeItem(TOKEN_KEY); window.sessionStorage?.removeItem(bootstrapKey(subjectKey)); } catch (error) {
        }
        window.location.href = getUnifiedPortalHref('logout', subjectKey);
    }

    function useUnifiedSubjectBootstrap(subjectKey = SUBJECT_KEY) {
        const [payload, setPayload] = useState(() => isLocalPreview() ? localBootstrap(subjectKey) : readBootstrap(subjectKey));
        useEffect(() => {
            let active = true;
            fetchBootstrap(subjectKey).then(next => { if (active && next) setPayload(next); }).catch(() => {});
            return () => { active = false; };
        }, [subjectKey]);
        return payload;
    }

    Object.assign(app, { SUBJECT_KEY, isLocalPreview, getAuthHeaders, requestUnifiedApi, getUnifiedPortalHref, logoutFromUnifiedSubject, useUnifiedSubjectBootstrap });
})();

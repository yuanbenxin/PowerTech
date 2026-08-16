(function subjectAuthGate() {
    const config = Object.assign(
        {
            subjectKey: '',
            subjectName: '',
            unifiedApiBase: '/api/unified',
            portalEntry: '/',
            localPortalEntry: '../dist-portal/index.html',
            allowExpiredTrialShell: false
        },
        window.__SHG_SUBJECT_GATE_CONFIG__ || {}
    );

    const html = document.documentElement;
    const pendingClass = 'shg-subject-auth-pending';
    const blockedClass = 'shg-subject-auth-blocked';
    const overlayId = 'shgSubjectAuthOverlay';
    const cacheWindowKey = '__SHG_SUBJECT_BOOTSTRAP_CACHE__';
    const readyWindowKey = '__SHG_SUBJECT_GATE_READY__';
    const cacheStoragePrefix = 'shg:subject-bootstrap:';
    const cacheTtlMs = 30 * 1000;
    const normalizedSubjectKey = String(config.subjectKey || '').trim();
    let resolveReadyPromise = null;

    function getSubjectName() {
        return String(config.subjectName || config.subjectKey || '学科').trim() || '学科';
    }

    function getCacheStore() {
        if (!window[cacheWindowKey] || typeof window[cacheWindowKey] !== 'object') {
            window[cacheWindowKey] = {};
        }
        return window[cacheWindowKey];
    }

    function getReadyStore() {
        if (!window[readyWindowKey] || typeof window[readyWindowKey] !== 'object') {
            window[readyWindowKey] = {};
        }
        return window[readyWindowKey];
    }

    function getStorageKey() {
        return `${cacheStoragePrefix}${normalizedSubjectKey}`;
    }

    function getBootstrapTokenKey(token = getStoredToken()) {
        const normalizedToken = String(token || '').trim();
        if (!normalizedToken) return 'guest';
        return `${normalizedToken.length}:${normalizedToken.slice(0, 12)}:${normalizedToken.slice(-12)}`;
    }

    function isFreshCacheRecord(record) {
        const cachedAt = Number(record?.cachedAt || 0);
        return Boolean(record?.payload) && Number.isFinite(cachedAt) && (Date.now() - cachedAt) <= cacheTtlMs;
    }

    function persistBootstrapCache(payload, options = {}) {
        if (!normalizedSubjectKey || !payload) return null;

        const record = {
            subjectKey: normalizedSubjectKey,
            payload,
            cachedAt: Date.now(),
            tokenKey: getBootstrapTokenKey(options.token),
            tokenPresent: Boolean(options.tokenPresent),
            source: 'subject-gate'
        };

        getCacheStore()[normalizedSubjectKey] = record;

        try {
            window.sessionStorage?.setItem(getStorageKey(), JSON.stringify(record));
        } catch (error) {
        }

        return record;
    }

    function readBootstrapCache(options = {}) {
        if (!normalizedSubjectKey) return null;
        const tokenKey = getBootstrapTokenKey(options.token);

        const windowRecord = getCacheStore()[normalizedSubjectKey];
        if (windowRecord?.tokenKey === tokenKey && isFreshCacheRecord(windowRecord)) {
            return windowRecord;
        }

        try {
            const rawRecord = window.sessionStorage?.getItem(getStorageKey());
            if (!rawRecord) return null;

            const parsedRecord = JSON.parse(rawRecord);
            if (parsedRecord?.tokenKey !== tokenKey || !isFreshCacheRecord(parsedRecord)) return null;

            getCacheStore()[normalizedSubjectKey] = parsedRecord;
            return parsedRecord;
        } catch (error) {
            return null;
        }
    }

    function resolveGateReady(payload = null) {
        if (typeof resolveReadyPromise === 'function') {
            resolveReadyPromise(payload);
            resolveReadyPromise = null;
        }
    }

    function publishBootstrap(payload) {
        if (!payload || typeof payload !== 'object') return;
        window.__SHG_SUBJECT_BOOTSTRAP__ = payload;
        try {
            window.dispatchEvent(new CustomEvent('shg:subject-auth-ready', { detail: payload }));
        } catch (error) {
        }
    }

    if (normalizedSubjectKey) {
        getReadyStore()[normalizedSubjectKey] = new Promise((resolve) => {
            resolveReadyPromise = resolve;
        });
    }

    function isPrivatePreviewHost(hostname) {
        if (!hostname) return false;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
        if (hostname.startsWith('10.')) return true;
        if (hostname.startsWith('192.168.')) return true;

        const match = hostname.match(/^172\.(\d{1,3})\./);
        if (!match) return false;

        const secondOctet = Number(match[1]);
        return secondOctet >= 16 && secondOctet <= 31;
    }

    function shouldBypass() {
        const protocol = String(window.location.protocol || '').toLowerCase();
        const hostname = String(window.location.hostname || '').trim().toLowerCase();
        const isLocalPreviewOrigin = protocol === 'file:' || isPrivatePreviewHost(hostname);
        const params = new URLSearchParams(window.location.search || '');
        const mode = String(params.get('subjectAuth') || '').trim().toLowerCase();
        if (mode === 'on') return false;
        // A query parameter must never disable authentication on a LAN or public origin.
        if (mode === 'off') return isLocalPreviewOrigin;
        return isLocalPreviewOrigin;
    }

    function createLocalPreviewBootstrap() {
        const subjectName = getSubjectName();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        return {
            ok: true,
            user: {
                id: 'local-preview',
                username: '本地预览',
                identity: 'teacher',
                auth_source: 'local-preview'
            },
            subject_access: {
                subject_key: normalizedSubjectKey,
                subject_name: subjectName,
                access_status: 'active',
                membership_tier: 'local-preview',
                expires_at: expiresAt
            },
            resolved: {
                user: {
                    id: 'local-preview',
                    username: '本地预览',
                    identity: 'teacher',
                    auth_source: 'local-preview'
                },
                subject_access: {
                    subject_key: normalizedSubjectKey,
                    subject_name: subjectName,
                    access_status: 'active',
                    membership_tier: 'local-preview',
                    expires_at: expiresAt
                }
            },
            capabilities: {
                enter_shell: true,
                open_engine: true,
                access_mode: 'engine',
                local_preview: true
            }
        };
    }

    function enableLocalPreviewEngineAccess(payload) {
        if (!payload || typeof payload !== 'object') return payload;
        const authSource = String(payload.user?.auth_source || payload.resolved?.user?.auth_source || '').trim().toLowerCase();
        const capabilities = payload.capabilities || {};
        if (authSource !== 'local-preview' && capabilities.local_preview !== true) return payload;

        payload.capabilities = Object.assign({}, capabilities, {
            enter_shell: true,
            open_engine: true,
            access_mode: 'engine',
            local_preview: true
        });
        return payload;
    }

    function getStoredToken() {
        try {
            return String(window.localStorage?.getItem('shg_token') || '').trim();
        } catch (error) {
            return '';
        }
    }

    function clearStoredToken() {
        try {
            window.localStorage?.removeItem('shg_token');
        } catch (error) {
        }
    }

    function normalizeAccessStatus(status) {
        return String(status || '').trim().toLowerCase();
    }

    function normalizeMembershipTier(tier) {
        return String(tier || '').trim().toLowerCase();
    }

    function getAccessTimeValue(value) {
        if (!value) return null;
        const timeValue = new Date(value).getTime();
        return Number.isFinite(timeValue) ? timeValue : null;
    }

    function getResolvedAccessExpiryValue(access) {
        return access?.expires_at || access?.trial_expires_at || access?.expired_at || null;
    }

    function getEffectiveSubjectAccessStatus(access) {
        const accessStatus = normalizeAccessStatus(access?.access_status);
        if (accessStatus !== 'active') return accessStatus;

        const expiresAt = getAccessTimeValue(getResolvedAccessExpiryValue(access));
        if (expiresAt !== null && expiresAt <= Date.now()) {
            return 'expired';
        }

        return accessStatus;
    }

    function canReleaseExpiredTrialShell(result) {
        if (typeof result?.capabilities?.enter_shell === 'boolean') {
            return result.capabilities.enter_shell;
        }

        if (!config.allowExpiredTrialShell) return false;
        const subjectAccess = result?.resolved?.subject_access || result?.subject_access || null;
        return getEffectiveSubjectAccessStatus(subjectAccess) === 'expired';
    }

    let overlayWaitPromise = null;

    function findOverlay() {
        return document.getElementById(overlayId);
    }

    function waitForOverlay() {
        const existing = findOverlay();
        if (existing) {
            return Promise.resolve(existing);
        }

        if (overlayWaitPromise) {
            return overlayWaitPromise;
        }

        overlayWaitPromise = new Promise((resolve) => {
            let settled = false;
            let observer = null;
            let fallbackTimer = null;

            const cleanup = () => {
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
                if (fallbackTimer) {
                    window.clearTimeout(fallbackTimer);
                    fallbackTimer = null;
                }
                document.removeEventListener('readystatechange', tryResolve);
            };

            const finish = (overlay) => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(overlay || null);
            };

            const tryResolve = () => {
                const overlay = findOverlay();
                if (overlay) {
                    finish(overlay);
                }
            };

            const target = document.documentElement || document;
            if (target && typeof MutationObserver === 'function') {
                observer = new MutationObserver(tryResolve);
                observer.observe(target, { childList: true, subtree: true });
            }

            document.addEventListener('readystatechange', tryResolve);
            fallbackTimer = window.setTimeout(() => finish(findOverlay()), 2500);
            tryResolve();
        }).finally(() => {
            overlayWaitPromise = null;
        });

        return overlayWaitPromise;
    }

    function resolvePortalHref(reason) {
        const baseHref = window.location.protocol === 'file:' ? config.localPortalEntry : config.portalEntry;
        try {
            const url = new URL(baseHref || '/', window.location.href);
            url.searchParams.set('subject', config.subjectKey || '');
            url.searchParams.set('return', window.location.href);
            if (reason) url.searchParams.set('reason', reason);
            return url.toString();
        } catch (error) {
            return baseHref || '/';
        }
    }

    async function updateOverlay(options = {}) {
        const overlay = await waitForOverlay();
        if (!overlay) return;

        const title = overlay.querySelector('[data-shg-auth-title]');
        const desc = overlay.querySelector('[data-shg-auth-desc]');
        const meta = overlay.querySelector('[data-shg-auth-meta]');
        const phase = overlay.querySelector('[data-shg-auth-phase]');
        const primary = overlay.querySelector('[data-shg-auth-primary]');
        const secondary = overlay.querySelector('[data-shg-auth-secondary]');

        if (title) title.textContent = options.title || `正在进入${getSubjectName()}系统`;
        if (desc) desc.textContent = options.desc || '正在核验当前账号的统一登录状态，并准备进入该学科系统，请稍候。';
        if (meta) meta.textContent = options.meta || `${getSubjectName()}入口`;
        if (phase) phase.textContent = options.phase || '正在连接统一权限中心';
        if (primary) {
            primary.textContent = options.primaryText || '返回统一入口';
            primary.href = options.primaryHref || resolvePortalHref(options.reason || '');
        }
        if (secondary) {
            secondary.textContent = options.secondaryText || '刷新重试';
            secondary.href = options.secondaryHref || window.location.href;
        }
    }

    async function checkAccess(headers = {}) {
        const subjectKey = encodeURIComponent(String(config.subjectKey || '').trim());
        const response = await fetch(`${config.unifiedApiBase}/bootstrap/subjects/${subjectKey}`, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
            headers
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(payload?.message || `Request failed: ${response.status}`);
            error.payload = payload;
            throw error;
        }

        return payload;
    }

    async function releaseOverlay() {
        html.classList.remove(pendingClass);
        html.classList.remove(blockedClass);
        const overlay = await waitForOverlay();
        if (overlay) overlay.remove();
    }

    async function blockOverlay(options = {}) {
        html.classList.remove(pendingClass);
        html.classList.add(blockedClass);
        await updateOverlay(options);
    }

    async function validate() {
        let result = null;
        let resolvedToken = getStoredToken();

        if (!config.subjectKey || shouldBypass()) {
            const cachedPayload = readBootstrapCache({ token: resolvedToken })?.payload;
            const previewPayload = enableLocalPreviewEngineAccess(cachedPayload || createLocalPreviewBootstrap());
            if (config.subjectKey && !cachedPayload) {
                persistBootstrapCache(previewPayload, {
                    tokenPresent: Boolean(resolvedToken),
                    token: resolvedToken
                });
            }
            publishBootstrap(previewPayload);
            await releaseOverlay();
            resolveGateReady(previewPayload);
            return;
        }

        html.classList.add(pendingClass);
        await updateOverlay({
            title: `正在进入${getSubjectName()}系统`,
            desc: '正在确认当前登录状态与该学科的访问权限，请稍候。',
            meta: `${getSubjectName()}入口`,
            phase: '统一账号验证中'
        });

        try {
            const token = resolvedToken;

            if (token) {
                try {
                    result = await checkAccess({
                        Authorization: `Bearer ${token}`
                    });
                    resolvedToken = token;
                } catch (error) {
                }
            }

            if (!result?.ok && !canReleaseExpiredTrialShell(result)) {
                result = await checkAccess();
                resolvedToken = '';
            }

            if (result) {
                persistBootstrapCache(result, {
                    tokenPresent: Boolean(resolvedToken),
                    token: resolvedToken
                });
            }

            if (result?.capabilities?.enter_shell || canReleaseExpiredTrialShell(result)) {
                publishBootstrap(result);
                await releaseOverlay();
                return;
            }

            const loggedIn = Boolean(result?.user || result?.resolved?.user || result?.checks?.logged_in);
            if (!loggedIn && token) {
                clearStoredToken();
                resolvedToken = '';
            }

            await blockOverlay({
                title: loggedIn ? '当前账号暂未开通该学科' : '请先登录统一入口',
                desc: loggedIn
                    ? `当前账号尚未获得${getSubjectName()}的访问权限，请返回统一入口切换账号，或联系后台管理员授权后再进入。`
                    : `当前未检测到有效登录状态，请先通过统一官网登录或注册，再重新进入${getSubjectName()}系统。`,
                meta: loggedIn ? `${getSubjectName()}未授权` : '需要统一登录',
                phase: loggedIn ? '当前账号未获得该学科权限' : '未检测到有效登录状态',
                primaryText: '返回统一入口',
                reason: loggedIn ? 'subject_denied' : 'login_required'
            });
        } catch (error) {
            await blockOverlay({
                title: '暂时无法验证学科权限',
                desc: '当前无法连接统一权限服务，请稍后重试，或先返回统一入口后再次进入。',
                meta: '统一权限服务不可用',
                phase: '统一权限服务暂不可用',
                primaryText: '返回统一入口',
                reason: 'service_unavailable'
            });
        } finally {
            resolveGateReady(readBootstrapCache({ token: resolvedToken })?.payload || result || null);
        }
    }

    validate();
})();

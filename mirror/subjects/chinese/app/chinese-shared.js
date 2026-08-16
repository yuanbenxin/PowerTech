window.ChineseApp = window.ChineseApp || {};

(() => {
    const { useState, useMemo, useEffect } = React;
    const app = window.ChineseApp;

    const COURSE_INDEX_PATH = 'course-data/index.json';

    async function fetchJson(path) {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) throw new Error(`无法读取 ${path}`);
        return response.json();
    }

    async function loadChineseCurriculum() {
        const index = await fetchJson(COURSE_INDEX_PATH);
        const books = index?.stages?.[0]?.books || [];
        const payloads = await Promise.all(books.map(async book => ({
            meta: book,
            payload: await fetchJson(book.dataPath)
        })));
        const cards = payloads.flatMap(({ meta, payload }) => (payload.currentCardMapping || []).map(card => ({
            ...card,
            id: card.cardId,
            bookId: meta.id,
            bookLabel: meta.label,
            stageId: 'junior',
            visualLevel: '待接入'
        })));
        return { index, books, cards };
    }

    function contentTypeLabel(contentType) {
        if (contentType === 'classical_chinese') return '文言文阅读';
        if (contentType === 'masterpiece') return '名著导读';
        return '古诗词诵读';
    }

    function getViewportSize() {
        const viewport = window.visualViewport;
        return {
            width: Math.max(0, Math.round(viewport?.width || window.innerWidth || 0)),
            height: Math.max(0, Math.round(viewport?.height || window.innerHeight || 0))
        };
    }

    function resolveDashboardFrame(viewport) {
        const width = Math.max(0, viewport.width || 0);
        const height = Math.max(0, viewport.height || 0);
        const isPortrait = height > width;
        const aspectRatio = width / Math.max(height, 1);
        const ultraWide = aspectRatio >= 2.05;
        const tinyLandscape = !isPortrait && (width <= 980 || height <= 460);
        const dense = width <= 1260 || height <= 700;
        const shortHeight = height <= 660;
        const roomy = width >= 1520 && height >= 780;

        return {
            width,
            height,
            isPortrait,
            ultraWide,
            tinyLandscape,
            dense,
            shortHeight,
            roomy,
            compact: dense,
            cardColumns: isPortrait ? (width >= 720 ? 3 : width >= 350 ? 2 : 1) : ultraWide || width >= 1440 ? 4 : dense ? 2 : 3,
            detailAsideWidth: isPortrait ? width : tinyLandscape ? 236 : shortHeight ? 264 : ultraWide ? 396 : roomy ? 372 : dense ? 284 : 320,
            shellPaddingX: isPortrait ? Math.max(8, Math.min(12, Math.round(width * 0.03))) : tinyLandscape ? 14 : ultraWide ? 44 : roomy ? 36 : dense ? 20 : 32,
            shellPaddingY: isPortrait ? 8 : tinyLandscape ? 10 : ultraWide ? 28 : shortHeight ? 14 : dense ? 18 : 24
        };
    }

    function useDashboardViewport() {
        const [viewport, setViewport] = useState(getViewportSize);

        useEffect(() => {
            let frame = null;
            const updateViewport = () => {
                if (frame) cancelAnimationFrame(frame);
                frame = requestAnimationFrame(() => setViewport(getViewportSize()));
            };
            updateViewport();
            window.addEventListener('resize', updateViewport);
            window.addEventListener('orientationchange', updateViewport);
            window.visualViewport?.addEventListener('resize', updateViewport);
            return () => {
                if (frame) cancelAnimationFrame(frame);
                window.removeEventListener('resize', updateViewport);
                window.removeEventListener('orientationchange', updateViewport);
                window.visualViewport?.removeEventListener('resize', updateViewport);
            };
        }, []);

        return { ...viewport, frame: resolveDashboardFrame(viewport) };
    }

    Object.assign(app, {
        useState,
        useMemo,
        useEffect,
        fetchJson,
        loadChineseCurriculum,
        contentTypeLabel,
        useDashboardViewport
    });
})();

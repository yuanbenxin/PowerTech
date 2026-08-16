window.ChineseApp = window.ChineseApp || {};

(() => {
    const app = window.ChineseApp;

    const RECITATION_LIBRARY = [
        {
            id: 'c7a_m02',
            cardId: 'c7a_m02',
            title: '闻王昌龄左迁龙标遥有此寄',
            author: '李白',
            dynasty: '唐',
            genre: '古诗词',
            kind: 'poetry',
            bookLabel: '七年级上册',
            recitationAudioSrc: 'visualizations/books/c7a/c7a_m02/lesson/李白.mp4',
            memoryPath: ['暮春闻讯', '贬谪远行', '寄情明月', '一路相随'],
            lines: [
                { id: 'line-1', text: '杨花落尽子规啼，', meaning: '暮春时节，杨花已经落尽，杜鹃鸟正在凄切地啼叫。', keywords: ['杨花落尽', '子规啼'], rhythm: ['杨花落尽', '子规啼'], initials: '杨 · 子', anchor: '暮春闻讯', cue: '飘零的杨花与哀啼的子规，先写听闻消息时的凄凉。', sceneImage: 'visualizations/books/c7a/c7a_m02/lesson/images/verse_1.jpg', audioStart: .9, audioEnd: 4.3 },
                { id: 'line-2', text: '闻道龙标过五溪。', meaning: '听说你被贬到偏远的龙标，途中还要经过五溪。', keywords: ['闻道', '龙标', '五溪'], rhythm: ['闻道', '龙标', '过五溪'], initials: '闻 · 龙 · 五', anchor: '贬谪远行', cue: '从听闻消息转到友人远赴龙标、行过五溪的艰难旅程。', sceneImage: 'visualizations/books/c7a/c7a_m02/lesson/images/verse_2.jpg', audioStart: 4.3, audioEnd: 7.8 },
                { id: 'line-3', text: '我寄愁心与明月，', meaning: '我把对你的忧愁和牵挂托付给天上的明月。', keywords: ['寄', '愁心', '明月'], rhythm: ['我寄', '愁心', '与明月'], initials: '我 · 愁 · 明', anchor: '寄情明月', cue: '无法相送，便把无形的愁心交给明月。', sceneImage: 'visualizations/books/c7a/c7a_m02/lesson/images/verse_3.jpg', audioStart: 7.8, audioEnd: 10.9 },
                { id: 'line-4', text: '随君直到夜郎西。', meaning: '让明月陪着你一直到遥远的夜郎以西。', keywords: ['随君', '直到', '夜郎西'], rhythm: ['随君', '直到', '夜郎西'], initials: '随 · 直 · 夜', anchor: '一路相随', cue: '承接明月，让它陪伴友人一直到遥远的夜郎西。', sceneImage: 'visualizations/books/c7a/c7a_m02/lesson/images/verse_4.jpg', audioStart: 10.9, audioEnd: 15 }
            ]
        },
        {
            id: 'c7a_m04',
            cardId: 'c7a_m04',
            title: '天净沙·秋思',
            author: '马致远',
            dynasty: '元',
            genre: '元曲',
            kind: 'poetry',
            bookLabel: '七年级上册',
            recitationAudioSrc: 'visualizations/books/c7a/c7a_m04/lesson/1.mp4',
            memoryPath: ['衰败暮色', '温暖归宿', '羁旅无归', '题眼收束'],
            lines: [
                { id: 'line-1', text: '枯藤老树昏鸦，', meaning: '枯萎的藤蔓、衰老的树木、黄昏归巢的乌鸦。', keywords: ['枯藤', '老树', '昏鸦'], rhythm: ['枯藤', '老树', '昏鸦'], initials: '枯 · 老 · 昏', anchor: '衰败暮色', cue: '枯、老、昏依次叠加，先定下日暮衰飒的底色。', sceneImage: 'visualizations/books/c7a/c7a_m04/lesson/images/verse_1.jpg', audioStart: 2.2, audioEnd: 6 },
                { id: 'line-2', text: '小桥流水人家，', meaning: '小桥下面流水潺潺，近旁坐落着温暖的人家。', keywords: ['小桥', '流水', '人家'], rhythm: ['小桥', '流水', '人家'], initials: '小 · 流 · 人', anchor: '温暖归宿', cue: '画面转向有人烟、可停驻、可归去的温暖生活。', sceneImage: 'visualizations/books/c7a/c7a_m04/lesson/images/verse_2.jpg', audioStart: 6, audioEnd: 9.2 },
                { id: 'line-3', text: '古道西风瘦马。', meaning: '荒凉的古道上，秋风吹着一匹疲瘦的马。', keywords: ['古道', '西风', '瘦马'], rhythm: ['古道', '西风', '瘦马'], initials: '古 · 西 · 瘦', anchor: '羁旅无归', cue: '从别人可归转回游子仍在古道上的劳顿与漂泊。', sceneImage: 'visualizations/books/c7a/c7a_m04/lesson/images/verse_3.jpg', audioStart: 9.2, audioEnd: 12.6 },
                { id: 'line-4', text: '夕阳西下，', meaning: '夕阳正在向西边落下。', keywords: ['夕阳', '西下'], rhythm: ['夕阳', '西下'], initials: '夕 · 西', anchor: '日暮收束', cue: '夕阳落下，把前三组画面统一收到黄昏时刻。', sceneImage: 'visualizations/books/c7a/c7a_m04/lesson/images/verse_4.jpg', audioStart: 12.6, audioEnd: 14.6 },
                { id: 'line-5', text: '断肠人在天涯。', meaning: '伤心欲断的游子，正漂泊在远离故乡的地方。', keywords: ['断肠人', '天涯'], rhythm: ['断肠人', '在天涯'], initials: '断 · 天', anchor: '题眼收束', cue: '由景入情，最终点明远在天涯的游子与思乡之愁。', sceneImage: 'visualizations/books/c7a/c7a_m04/lesson/images/verse_5.jpg', audioStart: 14.6, audioEnd: 17.6 }
            ]
        },
        {
            id: 'c7a_m10',
            cardId: 'c7a_m10',
            title: '夜雨寄北',
            author: '李商隐',
            dynasty: '唐',
            genre: '古诗词',
            kind: 'poetry',
            bookLabel: '七年级上册',
            recitationAudioSrc: 'visualizations/books/c7a/c7a_m10/lesson/夜雨寄北.mp4',
            memoryPath: ['归期无定', '巴山夜雨', '想象重逢', '回望今夜'],
            lines: [
                { id: 'line-1', text: '君问归期未有期，', meaning: '你问我什么时候能回去，我还没有确定的归期。', keywords: ['君问', '归期', '未有期'], rhythm: ['君问', '归期', '未有期'], initials: '君 · 归 · 未', anchor: '归期无定', cue: '一问一答，从亲友询问归期写到诗人无法确定归期。', sceneImage: 'visualizations/books/c7a/c7a_m10/lesson/images/verse_1.jpg', audioStart: 2.2, audioEnd: 6 },
                { id: 'line-2', text: '巴山夜雨涨秋池。', meaning: '巴山的秋夜下着连绵的雨，池水已经涨满。', keywords: ['巴山', '夜雨', '涨秋池'], rhythm: ['巴山', '夜雨', '涨秋池'], initials: '巴 · 夜 · 涨', anchor: '眼前实景', cue: '镜头落到眼前，秋夜连雨，池水上涨，愁绪也在积聚。', sceneImage: 'visualizations/books/c7a/c7a_m10/lesson/images/verse_2.jpg', audioStart: 6, audioEnd: 10 },
                { id: 'line-3', text: '何当共剪西窗烛，', meaning: '什么时候我们才能在西窗下相聚，一同剪烛长谈？', keywords: ['何当', '共剪', '西窗烛'], rhythm: ['何当', '共剪', '西窗烛'], initials: '何 · 共 · 西', anchor: '想象重逢', cue: '由眼前转向未来，想象何时能在西窗下共同剪烛。', sceneImage: 'visualizations/books/c7a/c7a_m10/lesson/images/verse_3.jpg', audioStart: 10, audioEnd: 14 },
                { id: 'line-4', text: '却话巴山夜雨时。', meaning: '到那时，再回头谈起今夜巴山夜雨中的思念。', keywords: ['却话', '巴山夜雨时'], rhythm: ['却话', '巴山', '夜雨时'], initials: '却 · 巴 · 夜', anchor: '回望今夜', cue: '未来重逢时，再回头讲述此刻的巴山夜雨。', sceneImage: 'visualizations/books/c7a/c7a_m10/lesson/images/verse_4.jpg', audioStart: 14, audioEnd: 17.6 }
            ]
        }
    ];

    const RECITATION_STORAGE_KEY = 'shiguang.chinese.recitation.v1';

    function emptyRecitationProgress() {
        return { version: 1, passages: {} };
    }

    function loadRecitationProgress() {
        try {
            const parsed = JSON.parse(localStorage.getItem(RECITATION_STORAGE_KEY) || 'null');
            if (!parsed || parsed.version !== 1 || typeof parsed.passages !== 'object') return emptyRecitationProgress();
            return parsed;
        } catch (_error) {
            return emptyRecitationProgress();
        }
    }

    function saveRecitationProgress(progress) {
        try {
            localStorage.setItem(RECITATION_STORAGE_KEY, JSON.stringify(progress));
        } catch (_error) {
            // Local progress is optional; training remains available when storage is blocked.
        }
    }

    function getRecitationPassage(cardId) {
        return RECITATION_LIBRARY.find(item => item.cardId === cardId) || null;
    }

    function getPassageProgress(progress, passageId) {
        return progress?.passages?.[passageId] || null;
    }

    function formatRecitationStatus(progress, passageId) {
        const passage = getPassageProgress(progress, passageId);
        if (!passage) return '未开始';
        if (passage.nextReviewAt && new Date(passage.nextReviewAt).getTime() <= Date.now()) return '需要复习';
        if (passage.status === 'mastered') return '稳定掌握';
        if (passage.status === 'review') return '需要复习';
        return '正在背';
    }

    Object.assign(app, {
        RECITATION_LIBRARY,
        loadRecitationProgress,
        saveRecitationProgress,
        getRecitationPassage,
        getPassageProgress,
        formatRecitationStatus
    });
})();

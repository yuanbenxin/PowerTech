window.ChineseApp = window.ChineseApp || {};

(() => {
    const app = window.ChineseApp;
    const journeyMediaBase = 'https://wulikeshihua-1339740714.cos.ap-beijing.myqcloud.com/%E8%AF%AD%E6%96%87/';

    // 统编版七上“名著导读：精读和跳读”专题锚点。
    // 这是面向整本书阅读的高频考查清单，不把它伪装成教材规定的唯一必考回目。
    const JOURNEY_TO_THE_WEST_CARDS = [
        {
            id: 'xiyouji_01', title: '第 1—7 回 · 大圣出世与大闹天宫', chapterRange: '第 1—7 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_01.jpg',
            storyboardImage: 'assets/media/journey/xyj_01.jpg',
            courseware: { entry: 'visualizations/books/journey/xiyouji_01/index.html', mode: 'embedded-lesson' },
            tags: ['孙悟空', '反抗精神', '称王'],
            points: ['理清“花果山—龙宫—地府—天宫”的成长线索。', '掌握孙悟空自封“齐天大圣”、大闹蟠桃会等关键情节。', '常考人物：桀骜不驯、敢于反抗、追求自由。'],
            detail: '从石猴出世到大闹天宫，是孙悟空性格的奠基段，也是人物形象、情节排序与反抗主题的核心考查区。'
        },
        {
            id: 'xiyouji_02', title: '第 8—12 回 · 取经缘起与唐僧身世', chapterRange: '第 8—12 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_02.jpg',
            storyboardImage: 'assets/media/journey/xyj_02.jpg',
            courseware: { entry: 'visualizations/books/journey/xiyouji_02/index.html', mode: 'embedded-lesson' },
            tags: ['如来', '观音', '唐僧身世'],
            points: ['理解西天取经任务由如来、观音发起的缘由。', '掌握金蝉子转世、江流儿、玄奘受命等身世线索。', '能说明“取经团队”在出发前已完成的使命铺垫。'],
            detail: '这一段把神佛世界与人间取经人连接起来，常以人物关系、取经缘由和唐僧身世的填空或简答出现。'
        },
        {
            id: 'xiyouji_03', title: '第 13—15 回 · 踏上西行与白龙马', chapterRange: '第 13—15 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_03.jpg',
            storyboardImage: 'assets/media/journey/xyj_03.jpg',
            courseware: { entry: 'visualizations/books/journey/xiyouji_03/index.html', mode: 'embedded-lesson' },
            tags: ['唐僧', '白龙马', '西行起点'],
            points: ['掌握唐僧离开长安、开始西行的节点。', '识记小白龙因误食白马而化作白龙马。', '理解白龙马在团队中“坐骑兼护法”的作用。'],
            detail: '这一组回目是取经主线真正启动的位置，重点不在大场面，而在团队成员白龙马的来历与职责。'
        },
        {
            id: 'xiyouji_04', title: '第 23 回 · 四圣试禅心', chapterRange: '第 23 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_04.jpg',
            storyboardImage: 'assets/media/journey/lessons/xiyouji_04_reading_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_04/index.html',
                mode: 'embedded-lesson'
            },
            tags: ['猪八戒', '禅心', '讽刺'],
            points: ['识记黎山老母与观音、普贤、文殊化身试探师徒。', '重点辨析猪八戒贪恋女色、意志不坚的性格弱点。', '理解情节对取经人“戒欲守志”的提醒。'],
            detail: '“四圣试禅心”是猪八戒形象题的高频材料：既要记住事件，也要能从他的言行概括性格。'
        },
        {
            id: 'xiyouji_05', title: '第 24—26 回 · 偷吃人参果', chapterRange: '第 24—26 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_05.jpg',
            storyboardImage: 'assets/media/journey/lessons/xiyouji_05_reading_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_05/index.html',
                mode: 'embedded-lesson'
            },
            tags: ['人参果', '镇元子', '责任'],
            points: ['掌握人参果外形、稀有性及五庄观背景。', '理清“偷吃—推倒果树—寻方医树—赔礼和解”的因果。', '比较悟空的冲动与最终敢于承担、设法补救。'],
            detail: '该段常考故事起因、孙悟空的行为转折以及镇元子与师徒和解的结局，适合训练因果复述。'
        },
        {
            id: 'xiyouji_06', title: '第 27 回 · 三打白骨精', chapterRange: '第 27 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_06.jpg',
            storyboardImage: 'assets/media/journey/lessons/xiyouji_06_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_06/index.html',
                mode: 'embedded-lesson'
            },
            tags: ['白骨精', '孙悟空', '唐僧'],
            points: ['识记白骨精三次变为村姑、老妇、老翁的伪装。', '分析悟空火眼金睛与唐僧肉眼凡胎造成的误解。', '掌握悟空被逐、师徒矛盾激化这一情节后果。'],
            detail: '“三打白骨精”是全书最常见的名著题材料之一，人物评价必须结合“识妖、打妖、受冤”三层展开。'
        },
        {
            id: 'xiyouji_07', title: '第 32—35 回 · 莲花洞斗金角银角', chapterRange: '第 32—35 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_07.jpg',
            storyboardImage: 'assets/media/journey/lessons/xiyouji_07_reading_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_07/index.html',
                mode: 'embedded-lesson'
            },
            tags: ['金角银角', '法宝', '机智'],
            points: ['识记紫金红葫芦、羊脂玉净瓶、芭蕉扇等法宝。', '理解悟空以假名、智取等方式反制妖怪。', '考查重点是“斗智”而非只记法宝名称。'],
            detail: '莲花洞故事适合出法宝归属、情节排序和孙悟空机智应变题，是典型的“智斗型”回目。'
        },
        {
            id: 'xiyouji_08', title: '第 40—42 回 · 大战红孩儿', chapterRange: '第 40—42 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_08.jpg',
            tags: ['红孩儿', '三昧真火', '观音'],
            storyboardImage: 'assets/media/journey/lessons/xiyouji_08_reading_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_08/index.html',
                mode: 'embedded-lesson'
            },
            points: ['掌握红孩儿是牛魔王与铁扇公主之子。', '识记三昧真火使悟空受困，观音最终收伏红孩儿。', '能解释“悟空有本领仍需外援”的情节逻辑。'],
            detail: '红孩儿段常考亲属关系、三昧真火和观音收伏。它也能用于分析取经团队的局限与协作。'
        },
        {
            id: 'xiyouji_09', title: '第 45—46 回 · 车迟国斗法', chapterRange: '第 45—46 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
              image: 'assets/media/journey/xyj_09.jpg',
              tags: ['车迟国', '虎力大仙', '斗法'],
              storyboardImage: 'assets/media/journey/lessons/xiyouji_09_reading_storyboard.png',
              courseware: {
                  entry: 'visualizations/books/journey/xiyouji_09/index.html',
                  mode: 'embedded-lesson'
              },
              points: ['识记虎力、鹿力、羊力三大仙及车迟国背景。', '掌握求雨、坐禅、隔板猜物、砍头等斗法线索。', '理解作品以夸张、讽刺批评邪术欺世。'],
            detail: '车迟国斗法重在情节复述和讽刺意味：不能只背“谁赢了”，还要说清楚正邪较量的价值判断。'
        },
        {
            id: 'xiyouji_10', title: '第 54—55 回 · 女儿国与蝎子精', chapterRange: '第 54—55 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
              image: 'assets/media/journey/xyj_10.jpg',
              tags: ['女儿国', '唐僧', '取经意志'],
              storyboardImage: 'assets/media/journey/lessons/xiyouji_10_reading_storyboard.png',
              courseware: {
                  entry: 'visualizations/books/journey/xiyouji_10/index.html',
                  mode: 'embedded-lesson'
              },
              points: ['掌握女儿国国王挽留唐僧的情节。', '理解唐僧在情感诱惑前仍坚持取经使命。', '识记蝎子精的厉害之处及昴日星官降伏妖怪。'],
            detail: '女儿国故事常被用于考查唐僧“慈悲而坚定”的复杂形象；答题要避免把影视改编情节当作原著事实。'
        },
        {
            id: 'xiyouji_11', title: '第 56—58 回 · 真假美猴王', chapterRange: '第 56—58 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_11.jpg',
            tags: ['六耳猕猴', '如来', '真假'],
            storyboardImage: 'assets/media/journey/lessons/xiyouji_11_reading_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_11/index.html',
                mode: 'embedded-lesson'
            },
            points: ['识记假悟空为六耳猕猴，众神难辨，最终由如来识破。', '掌握师徒矛盾、二心困扰与悟空回归团队的线索。', '能从“二心”角度理解故事的修行寓意。'],
            detail: '真假美猴王不仅考人物和结局，也常延伸到“二心”“真假难辨”的主题理解，是高辨识度回目。'
        },
        {
            id: 'xiyouji_12', title: '第 59—61 回 · 三调芭蕉扇', chapterRange: '第 59—61 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_12.jpg',
            tags: ['火焰山', '铁扇公主', '牛魔王'],
            storyboardImage: 'assets/media/journey/lessons/xiyouji_12_reading_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_12/index.html',
                mode: 'embedded-lesson'
            },
            points: ['理清火焰山阻路、借扇失败、变身斗智、最终灭火的过程。', '识记铁扇公主、牛魔王与红孩儿的家庭关系。', '重点训练复述“三调”中的策略变化。'],
            detail: '“三调芭蕉扇”是最稳定的情节概括题素材之一。回答时要突出三次借扇的不同结果，而非笼统写“借到了扇子”。'
        },
        {
            id: 'xiyouji_13', title: '第 65—66 回 · 小雷音寺降黄眉', chapterRange: '第 65—66 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_13.jpg',
            tags: ['黄眉怪', '小雷音寺', '弥勒'],
            storyboardImage: 'assets/media/journey/lessons/xiyouji_13_reading_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_13/index.html',
                mode: 'embedded-lesson'
            },
            points: ['识记黄眉怪假设“小雷音寺”迷惑师徒。', '掌握人种袋、金铙等法宝给团队带来的困境。', '明确最终由弥勒佛收伏黄眉童子。'],
            detail: '这段高频考查“假佛寺”与黄眉怪的身份，适合辨析真伪、法宝及神佛关系。'
        },
        {
            id: 'xiyouji_14', title: '第 72—73 回 · 盘丝洞斗蜘蛛精', chapterRange: '第 72—73 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_14.jpg',
            tags: ['盘丝洞', '蜘蛛精', '黄花观'],
            storyboardImage: 'assets/media/journey/lessons/xiyouji_14_reading_storyboard.png',
            courseware: {
                entry: 'visualizations/books/journey/xiyouji_14/index.html',
                mode: 'embedded-lesson'
            },
            points: ['识记七个蜘蛛精在盘丝洞设局擒唐僧。', '掌握悟空与蜘蛛精、蜈蚣精周旋的主要线索。', '注意作品对贪欲、迷惑的夸张书写。'],
            detail: '盘丝洞故事常以妖怪数量、地点、后续黄花观情节来考查，适合与女儿国的“诱惑”主题对照。'
        },
        {
            id: 'xiyouji_15', title: '第 74—77 回 · 狮驼岭三魔', chapterRange: '第 74—77 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_15.jpg',
            storyboardImage: 'assets/media/journey/xyj_15.jpg',
            courseware: { entry: 'visualizations/books/journey/xiyouji_15/index.html', mode: 'embedded-lesson' },
            tags: ['狮驼岭', '青狮白象', '大鹏'],
            points: ['识记青狮、白象、大鹏三魔及狮驼岭险境。', '理解“大鹏”背景与如来最终出手的原因。', '抓住团队遭遇重创、悟空多方求援的情节。'],
            detail: '狮驼岭是后半部险难最重的段落之一，常考三魔身份、势力和最终降伏者。'
        },
        {
            id: 'xiyouji_16', title: '第 81—83 回 · 黑松林与镇海寺', chapterRange: '第 81—83 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_16.jpg',
            storyboardImage: 'assets/media/journey/xyj_16.jpg',
            courseware: { entry: 'visualizations/books/journey/xiyouji_16/index.html', mode: 'embedded-lesson' },
            tags: ['黑松林', '镇海寺', '白鼠精'],
            points: ['掌握唐僧在黑松林遇难、悟空寻师的情节。', '识记地涌夫人（白鼠精）与镇海寺故事。', '训练从“救师”情节中概括悟空的责任感。'],
            detail: '这一段属于跳读时应能定位的后段故事，重点在地点、妖怪身份和悟空寻师救师的行为。'
        },
        {
            id: 'xiyouji_17', title: '第 86—87 回 · 凤仙郡祈雨', chapterRange: '第 86—87 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_17.jpg',
            storyboardImage: 'assets/media/journey/xyj_17.jpg',
            courseware: { entry: 'visualizations/books/journey/xiyouji_17/index.html', mode: 'embedded-lesson' },
            tags: ['凤仙郡', '劝善', '祈雨'],
            points: ['识记凤仙郡久旱与郡侯冒犯上天的缘由。', '掌握悟空劝善、郡侯改过、天降甘霖的结果。', '理解故事把因果报应与劝善主题结合。'],
            detail: '凤仙郡篇强调劝善与改过，适合考查情节因果和《西游记》的伦理教化意味。'
        },
        {
            id: 'xiyouji_18', title: '第 97—100 回 · 取经功成与封圣', chapterRange: '第 97—100 回',
            bookId: 'journey', bookLabel: '西游记专题', contentType: 'masterpiece', isTopic: true, status: 'ready',
            image: 'assets/media/journey/xyj_18.jpg',
            storyboardImage: 'assets/media/journey/xyj_18.jpg',
            courseware: { entry: 'visualizations/books/journey/xiyouji_18/index.html', mode: 'embedded-lesson' },
            tags: ['真经', '八十一难', '封圣'],
            points: ['掌握取经将成时仍须补足“八十一难”的结构安排。', '识记师徒取得真经、返回东土、各受封号的结局。', '能概括全书“历难—修心—功成”的主线。'],
            detail: '结尾常考八十一难、无字经与有字真经、师徒封号及全书主题，是整本书阅读的收束点。'
        }
    ];

    for (const card of JOURNEY_TO_THE_WEST_CARDS) {
        for (const key of ['image', 'storyboardImage']) {
            if (card[key]?.startsWith('assets/media/journey/')) {
                card[key] = `${journeyMediaBase}${card[key]}`;
            }
        }
    }

    Object.assign(app, { JOURNEY_TO_THE_WEST_CARDS });
})();

(() => {
  const base = 'https://wulikeshihua-1339740714.cos.ap-beijing.myqcloud.com/%E8%AF%AD%E6%96%87/assets/media/journey/lessons/';
  const keyBase = `${base}xiyouji_11_key_shots/`;
  const legacyPortraitBase = `${base}xiyouji_06_portraits/`;
  const portraitBase = `${base}xiyouji_11_portraits/`;

  document.title = '真假美猴王 · 名著精学';
  document.body.style.background = `linear-gradient(135deg,rgba(10,25,28,.55),rgba(4,10,12,.78)),url('${keyBase}05-two-wukongs-meet.png') center/cover no-repeat fixed`;
  document.querySelector('.eyebrow').textContent = '西游记 · 第 56—58 回 · 名著精学';
  document.querySelector('h1').textContent = '真假美猴王';
  document.getElementById('story-video-trigger').style.display = 'none';
  document.getElementById('story-video-modal').hidden = true;

  const tabs = [...document.querySelectorAll('.tabs button')];
  const topics = [...document.querySelectorAll('.topic')];
  const openTopic = id => {
    topics.forEach(topic => topic.classList.toggle('is-active', topic.id === id));
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.topic === id));
  };
  tabs.forEach(tab => tab.addEventListener('click', () => openTopic(tab.dataset.topic)));

  const pages = [
    ['师徒裂痕', '唐僧因前事责怪悟空，悟空一时负气离开队伍。师徒之间的误会尚未消散，取经路上先有了心结。', '这一页是“真假”故事的前提。六耳猕猴能趁虚而入，正因为师徒之间已经有了不信任；后文的两猴之争，也可理解为悟空内心“二心”的外化。'],
    ['假悟空作乱', '忽有一个悟空模样的行者出现，打伤唐僧，又取走行李关文，声称要自己去西天取经。八戒、沙僧见状惊疑。', '假悟空不只会变脸，还复制了悟空的本领与身份。它把原本的师徒矛盾推到极端：若连悟空都可以被替代，团队还能凭什么互相信任？'],
    ['二猴相争', '真悟空闻讯赶回，两个行者相貌、兵器、本领无不相同，金箍棒来往相击，旁人难辨真假。', '写“难辨”不是为了拖延情节，而是把真假之争从外貌推进到本心。只看表面、只凭一时证词，都无法判断谁真正护持取经大业。'],
    ['四方难辨', '二猴先后到观音、天庭、地府、兜率宫求证，诸神虽各施法术，仍不能分辨，最后只得同赴灵山。', '众神难辨说明六耳猕猴善于仿效，不等于真相不存在。故事不断转换场景，突出一般方法失效，因而需要能洞察根本的如来作最终判断。'],
    ['如来辨真', '如来道出假悟空乃六耳猕猴。妖猴现形逃走，悟空将其除去；唐僧、悟空重归一心，师徒再上西行路。', '结局不只是“打败一个妖怪”。如来点破“六耳”与“二心”，悟空除假、师徒和好，才让取经队从误会中重新恢复共同目标。'],
  ];
  const reading = document.getElementById('reading');
  const readingImage = reading.querySelector('.scene-image-frame img');
  readingImage.src = `${base}xiyouji_11_reading_storyboard.png`;
  readingImage.alt = '真假美猴王五幕连环图';
  const readingCopy = reading.querySelector('.reading-copy');
  readingCopy.innerHTML = '<div class="reading-pager-top"><div class="reading-mode-switch"><button class="is-active" data-mode="both">对照</button><button data-mode="old">原文</button><button data-mode="new">白话</button></div><span class="reading-progress"></span></div><section class="reading-page"></section><div class="reading-pager-bottom"><button class="reading-nav" data-move="-1">←</button><div class="reading-stage-dots"></div><button class="reading-nav" data-move="1">→</button></div>';
  let pageIndex = 0;
  let readingMode = 'both';
  const renderReading = () => {
    const [title, original, explanation] = pages[pageIndex];
    const panels = [];
    if (readingMode !== 'new') panels.push(`<article class="reading-panel"><h3>情节原貌 · ${title}</h3><p>${original}</p></article>`);
    if (readingMode !== 'old') panels.push(`<article class="reading-panel"><h3>白话精读 · ${title}</h3><p>${explanation}</p></article>`);
    readingCopy.querySelector('.reading-page').innerHTML = panels.join('');
    readingCopy.querySelector('.reading-page').classList.toggle('is-single', panels.length === 1);
    readingCopy.querySelector('.reading-progress').textContent = `${String(pageIndex + 1).padStart(2, '0')} / 05`;
    readingCopy.querySelector('.reading-stage-dots').innerHTML = pages.map((page, index) => `<button class="reading-stage-dot${index === pageIndex ? ' is-active' : ''}" data-page="${index}" title="${page[0]}"></button>`).join('');
    readingCopy.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('is-active', button.dataset.mode === readingMode));
    readingCopy.querySelectorAll('[data-move]').forEach(button => {
      button.disabled = (Number(button.dataset.move) < 0 && pageIndex === 0) || (Number(button.dataset.move) > 0 && pageIndex === pages.length - 1);
    });
  };
  readingCopy.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.mode) readingMode = button.dataset.mode;
    if (button.dataset.page !== undefined) pageIndex = Number(button.dataset.page);
    if (button.dataset.move) pageIndex = Math.max(0, Math.min(pages.length - 1, pageIndex + Number(button.dataset.move)));
    renderReading();
  });
  renderReading();

  const groups = [
    ['rift', '01 师徒决裂', '从师徒误会到假悟空作乱，交代“二心”出现的情境。'],
    ['duel', '02 二猴相争', '两个悟空的形貌、本领都难分辨，真假冲突正面爆发。'],
    ['search', '03 四方难辨', '观音、天庭、地府、老君各施方法，却仍无法判定。'],
    ['tathagata', '04 如来辨真', '灵山给出根本判断，六耳猕猴的身份与寓意一并点破。'],
    ['return', '05 归队西行', '悟空除假、师徒和好，取经队重新回到共同目标。'],
  ];
  const scenes = [
    ['rift', '师父责备', '唐僧责怪悟空', '01-tang-rebukes-wukong', '师徒矛盾没有化解，是后续“二心”故事的起点。'],
    ['rift', '悟空离队', '悟空负气离开', '02-wukong-leaves-team', '队伍出现裂痕，为假悟空趁隙而入留下空间。'],
    ['rift', '六耳现身', '六耳猕猴出现', '03-six-ear-appears', '假悟空不是普通妖怪，它擅长仿效真悟空。'],
    ['rift', '假猴作乱', '假悟空袭击师父', '04-false-wukong-attacks', '假悟空故意破坏师徒信任，使误会进一步扩大。'],
    ['duel', '二猴相会', '两个悟空正面相逢', '05-two-wukongs-meet', '外貌、兵器相同，真假判断不能只凭第一眼。'],
    ['duel', '金箍棒斗', '两根金箍棒相击', '06-staffs-clash', '本领也难区分，冲突从口头争辩发展成正面较量。'],
    ['duel', '师徒难辨', '八戒沙僧难认真身', '07-team-cannot-tell', '团队成员亲眼所见仍难下结论，突出“真假难辨”。'],
    ['duel', '观音难辨', '观音察看二猴', '08-guanyin-cannot-tell', '权威者一时也难分辨，故事需要继续寻找根本判断。'],
    ['search', '龙神守望', '神将围观二猴', '09-dragons-guard', '神界的围观不能代替证据，真假问题仍未解决。'],
    ['search', '地府查簿', '阎王翻查生死簿', '10-netherworld-record', '地府记录查不出假身，说明六耳猕猴来历特殊。'],
    ['search', '天庭会审', '天庭众神辨认', '11-heavenly-court-hearing', '天庭不能判定，层层求证反衬问题的复杂。'],
    ['search', '老君试法', '太上老君试探二猴', '12-laojun-tests', '法器失效，推动二猴前往能洞察本源的灵山。'],
    ['tathagata', '抵达灵山', '二猴同到灵山', '13-buddhist-mountain', '空间转换意味着判断标准由外在本领转向内在本心。'],
    ['tathagata', '佛前静立', '二猴站在如来前', '14-before-tathagata', '激斗暂歇，故事进入决定真假归属的关键场面。'],
    ['tathagata', '如来点破', '如来说出六耳身份', '15-tathagata-explains', '如来能辨真，是因为看见六耳猕猴的根本来历。'],
    ['tathagata', '妖猴现形', '六耳猕猴露出真身', '16-six-ear-revealed', '假悟空终于从“相同外表”中脱出，真相显现。'],
    ['return', '悟空追击', '悟空追赶六耳猕猴', '17-wukong-strikes-six-ear', '悟空除假，是拒绝分心、重新护师的行动。'],
    ['return', '六耳败亡', '六耳猕猴被除', '18-six-ear-defeated', '危机被清除，但故事的真正收束还在师徒关系。'],
    ['return', '师徒和好', '唐僧悟空重归一心', '19-master-disciple-reconcile', '误会得到弥合，团队信任重新建立。'],
    ['return', '再上西行', '四众继续西行', '20-team-resumes-westward', '回归取经目标，点明本回的最终落点。'],
  ];
  const plot = document.getElementById('plot');
  plot.innerHTML = '<div class="story-groups"></div><div class="plot-layout"><div class="scene-art"><img></div><article class="scene-copy"><div class="group-detail"></div><h3></h3><p></p><ul></ul></article></div><div class="scene-selector"></div>';
  let activeGroup = 'rift';
  const showScene = index => {
    const scene = scenes[index];
    const image = plot.querySelector('.scene-art img');
    image.src = `${keyBase}${scene[3]}.png`;
    image.alt = scene[2];
    plot.querySelector('h3').textContent = scene[2];
    plot.querySelector('.scene-copy p').textContent = scene[4];
    plot.querySelector('ul').innerHTML = `<li><b class="highlight">情节作用：</b>${scene[4]}</li><li><b class="highlight">人物关系：</b>师徒裂痕与真假冲突交织，最终重新归于一心。</li><li><b class="highlight">中考方向：</b>概括情节时写清“为何难辨、如何辨真”。</li>`;
    plot.querySelectorAll('[data-scene]').forEach(button => button.classList.toggle('is-active', Number(button.dataset.scene) === index));
  };
  const renderPlot = () => {
    const group = groups.find(item => item[0] === activeGroup);
    const list = scenes.map((scene, index) => ({ scene, index })).filter(item => item.scene[0] === activeGroup);
    plot.querySelector('.story-groups').innerHTML = groups.map(item => `<button class="${item[0] === activeGroup ? 'is-active' : ''}" data-group="${item[0]}"><b>${item[1]}</b></button>`).join('');
    plot.querySelector('.group-detail').textContent = group[2];
    plot.querySelector('.scene-selector').innerHTML = list.map(({ scene, index }) => `<button data-scene="${index}"><span>${String(index + 1).padStart(2, '0')} / 20</span><b>${scene[1]}</b></button>`).join('');
    showScene(list[0].index);
  };
  plot.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.group) { activeGroup = button.dataset.group; renderPlot(); }
    if (button.dataset.scene !== undefined) showScene(Number(button.dataset.scene));
  });
  renderPlot();

  const person = (src, name, role, traits, copy) => `<article class="person"><div class="portrait"><img src="${src}" alt="${name}人物群像"></div><div class="person-copy"><p class="person-role"><b>${name}</b><span>${role}</span></p><div class="traits">${traits}</div><p>${copy}</p></div></article>`;
  document.getElementById('people').innerHTML = `<div class="relationship-map"><article class="relationship-card"><span>师徒考验</span><b>唐僧 × 孙悟空</b><p>误会使悟空离队；除假后师徒重新建立信任。</p></article><article class="relationship-card core"><span>真假之争</span><b>孙悟空 × 六耳猕猴</b><p>形貌、本领相同，却分别指向护师的一心与扰乱的二心。</p></article><article class="relationship-card"><span>真相判断</span><b>如来 × 二猴</b><p>如来一言辨真，点破六耳来历与“二心”寓意。</p></article></div><div class="people-grid">${person(`${legacyPortraitBase}tang-sanzang.png`, '唐三藏', '取经人 · 误会者', '<span class="trait-core">慈悲</span><span class="trait-flaw">易生误会</span>', '他对悟空的责怪使团队出现裂痕；和好后也显示出取经队必须靠互信同行。')}${person(`${legacyPortraitBase}sun-wukong.png`, '孙悟空', '护师者 · 归队者', '<span class="trait-core">忠诚担当</span><span class="trait-action">明辨真假</span>', '受冤离队后仍赶回护师；在如来前除去假身，行动始终指向<b class="highlight">守护取经</b>。')}${person(`${legacyPortraitBase}zhu-bajie.png`, '猪八戒', '同伴 · 见证者', '<span class="trait-core">忠于师父</span><span class="trait-action">惊疑难辨</span>', '他面对两个悟空一时难辨，也让读者看到外貌与武艺都不足以证明真身。')}${person(`${legacyPortraitBase}sha-wujing.png`, '沙悟净', '同伴 · 稳定者', '<span class="trait-core">忠厚稳重</span><span class="trait-action">守护队伍</span>', '他随师兄追寻真相，在混乱中守住师父与行李，体现团队的稳定力量。')}${person(`${portraitBase}six-eared-macaque.png`, '六耳猕猴', '仿效者 · 扰乱者', '<span class="trait-flaw">善于仿效</span><span class="trait-flaw">挑拨离间</span>', '它能复制悟空的样貌和本领，却以伤师、夺物为目的，是“二心”和虚假自我的象征。')}</div>`;

  const exam = document.getElementById('exam');
  exam.innerHTML = '<div class="exam-grid"><article class="exam-card answer-card"><h3>人物题答案搭建器</h3><div class="answer-builder"><div class="answer-step"><span>01 锁定人物</span><b>孙悟空</b><p>点明受冤离队的处境。</p></div><div class="answer-step"><span>02 选择证据</span><b>护师辨真</b><p>抓赶回、争斗、除假。</p></div><div class="answer-step"><span>03 提炼特点</span><b>忠诚担当</b><p>由具体行为归纳。</p></div><div class="answer-step"><span>04 写出结果</span><b>归队西行</b><p>补足情节的收束。</p></div></div><p class="formula"><b>完整答案：</b>孙悟空虽因师徒误会离队，却在假悟空伤师夺物后赶回护师，并与其一路求证真假；如来点破六耳猕猴后，他除去假身，表现出忠诚担当、明辨是非的特点。故事也借此化解师徒“二心”，让团队重新西行。</p><div class="answer-evidence"><section class="evidence-board"><h4>把答案写实：三处证据定位</h4><div class="evidence-list"><div><b>受冤仍护师</b><span>离队后得知假悟空作乱，仍返回处理危机，不把个人委屈置于师父安危之前。</span></div><div><b>明辨真假</b><span>与假悟空相争并四方求证，关注的是谁真正护持取经，而非单凭外貌取胜。</span></div><div><b>归队西行</b><span>六耳被除后师徒和好，悟空重新承担护师西行的责任。</span></div></div></section><aside class="answer-checklist"><h4>落笔前自检</h4><p>写清师徒裂痕</p><p>列出辨真证据</p><p>提炼忠诚与二心</p><p>补足团队回归</p></aside></div></article><article class="exam-card avoid-card"><h3>高频题与易失分</h3><div class="exam-types"><div class="exam-type"><b>情节顺序</b><p>裂痕、作乱、相争、求证、辨真、归队，按因果概括。</p></div><div class="exam-type"><b>人物形象</b><p>写悟空要用护师、求证、除假等行为作证。</p></div><div class="exam-type"><b>真假与二心</b><p>真假不只在外貌，更在是否一心护持取经大业。</p></div><div class="exam-type"><b>作用分析</b><p>众神难辨铺垫如来出场，也放大信任主题。</p></div></div><ul><li>假悟空是六耳猕猴，不要误写成白骨精或普通妖怪。</li><li>观音、天庭等难辨，不等于如来也难辨；最终判断来自如来。</li><li>“二心”不能只解释为两个长得一样的猴子，要写到分心、误会与一心归队。</li></ul><div class="exam-review"><section class="review-item"><span>考场 30 秒</span><b>先定题型</b><p>顺序题写节点，人物题写行为，主题题写真假与一心。</p></section><section class="review-item"><span>答题核心</span><b>证据在前</b><p>先写受冤仍护师、四方求证或如来辨真，再归纳意义。</p></section><section class="review-item"><span>最后检查</span><b>因果写全</b><p>写清为何难辨、如何辨真，以及师徒如何回归西行。</p></section></div></article></div>';

  const questions = [
    ['情节顺序', '下列哪一项最符合“真假美猴王”的主线顺序？', ['师徒裂痕—假悟空作乱—二猴相争—如来辨真—师徒西行', '如来辨真—悟空离队—二猴相争—假悟空作乱', '假悟空作乱—白骨精现形—天庭收妖—师徒西行', '唐僧被蝎子精掳走—二猴相争—昴日星官除妖'], 0, '先有师徒裂痕，假悟空才趁隙作乱；最后由如来辨真，团队重新西行。', 'plot', '回到关键镜头'],
    ['人物识记', '假悟空的真实身份是？', ['红孩儿', '六耳猕猴', '黄袍怪', '白骨精'], 1, '如来最终指出，假悟空正是善于仿效的六耳猕猴。', 'people', '回到人物群像'],
    ['辨真原因', '为什么许多神佛一时难辨二猴，而如来能辨明？', ['如来只凭外貌猜测', '六耳猕猴的本领完全消失', '六耳善于仿效，而如来洞察其根本来历', '唐僧告诉如来答案'], 2, '前者难辨说明外在证据不足；如来从根本来历点破六耳。', 'reading', '回到名著精读'],
    ['主题理解', '“二心”寓意最恰当的一项是？', ['只指两个猴子外貌相同', '指个人分心、师徒误会，最终应回归一心取经', '指悟空不想西行', '指所有神仙都不会辨认真相'], 1, '故事用两个悟空呈现分心与误会，最终落点是师徒和好、同心西行。', 'exam', '回到中考攻略'],
    ['简答框架', '分析孙悟空形象时，哪种写法最完整？', ['只写“孙悟空很厉害”', '受冤离队—仍回护师并辨真—忠诚担当—师徒归队西行', '只写如来法力高强', '只复述二猴打斗'], 1, '人物题要把处境、行为、特点和结果连成因果链。', 'exam', '回到中考攻略'],
  ];
  const questionImages = ['01-tang-rebukes-wukong.png', '03-six-ear-appears.png', '11-heavenly-court-hearing.png', '15-tathagata-explains.png', '19-master-disciple-reconcile.png'];
  const questionTabs = document.getElementById('question-tabs');
  const stem = document.getElementById('stem');
  const options = document.getElementById('options');
  const feedback = document.getElementById('feedback');
  const reviewLink = document.getElementById('review-link');
  const questionProgress = document.getElementById('question-progress');
  const questionLayout = document.querySelector('.question-layout');
  const showQuestion = index => {
    const question = questions[index];
    stem.textContent = question[1];
    questionLayout.style.backgroundImage = `url('${keyBase}${questionImages[index]}')`;
    questionLayout.style.backgroundSize = 'cover';
    questionLayout.style.backgroundPosition = 'center';
    options.replaceChildren(...question[2].map((option, optionIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + optionIndex)}</span><span class="opt-text">${option}</span>`;
      button.addEventListener('click', () => {
        [...options.children].forEach(item => item.classList.remove('is-selected', 'is-correct', 'is-wrong'));
        const correct = optionIndex === question[3];
        button.classList.add('is-selected', correct ? 'is-correct' : 'is-wrong');
        feedback.textContent = `${correct ? '回答正确。' : '再想一想。'}${question[4]}`;
        reviewLink.classList.toggle('is-visible', !correct);
        if (!correct) { reviewLink.textContent = question[6]; reviewLink.onclick = () => openTopic(question[5]); }
      });
      return button;
    }));
    questionProgress.textContent = `第 ${index + 1} / ${questions.length} 题`;
    [...questionTabs.children].forEach((button, tabIndex) => button.classList.toggle('is-active', tabIndex === index));
    feedback.textContent = '选择一个选项后查看解析。';
    reviewLink.classList.remove('is-visible');
  };
  questionTabs.replaceChildren();
  questions.forEach((question, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${String(index + 1).padStart(2, '0')} ${question[0]}`;
    button.addEventListener('click', () => showQuestion(index));
    questionTabs.appendChild(button);
  });
  showQuestion(0);
})();

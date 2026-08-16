(() => {
  'use strict';

  const base = 'https://wulikeshihua-1339740714.cos.ap-beijing.myqcloud.com/%E8%AF%AD%E6%96%87/assets/media/journey/lessons/';
  const keyBase = `${base}xiyouji_09_key_shots/`;
  const portraitBase = `${base}xiyouji_09_portraits/`;
  const legacyPortraitBase = `${base}xiyouji_06_portraits/`;

  document.title = '车迟国斗法 · 名著精学';
  document.body.style.background = `linear-gradient(135deg,rgba(10,25,28,.55),rgba(4,10,12,.78)),url('${keyBase}07-tiger-power-prays-for-rain.png') center/cover no-repeat fixed`;
  document.querySelector('.eyebrow').textContent = '西游记 · 第 45—46 回 · 名著精学';
  document.querySelector('h1').textContent = '车迟国斗法';
  document.getElementById('story-video-trigger').style.display = 'none';
  document.getElementById('story-video-modal').hidden = true;

  const tabs = [...document.querySelectorAll('.tabs button')];
  const topics = [...document.querySelectorAll('.topic')];
  const openTopic = id => {
    topics.forEach(topic => topic.classList.toggle('is-active', topic.id === id));
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.topic === id));
  };
  tabs.forEach(tab => tab.addEventListener('click', () => openTopic(tab.dataset.topic)));

  const reading = document.getElementById('reading');
  const readingPages = [
    ['僧人受压', '行者入车迟国，只见许多和尚披枷戴锁，推车担石，尽受道士役使。行者问明缘由，便与八戒、沙僧暗中相助。', '车迟国国王偏信虎力、鹿力、羊力三妖，把僧人贬作苦役。师徒亲眼看见不平，悟空决定先救出受压的僧人，为后面的正邪较量立下理由。'],
    ['三清观破局', '行者与八戒、沙僧到了三清观中，见供桌丰盛，便各变作三清尊像，受用了供物。那三个道士回来见了，心中又惊又怒。', '三徒变化三清受供，不是贪玩，而是借道士最看重的神像和供奉，反衬他们表面敬神、实则欺世。三妖由此认定师徒是对手。'],
    ['祈雨斗法', '虎力大仙登坛，口中念念有词，要显求雨之能。行者早知他靠妖术取信，便暗中请风伯、雨师、雷公、电母听候调遣。', '虎力想把求雨当作证明自己“神通”的招牌；悟空看穿其底细，以真正能调动天时的本领回应。雨势既落，也让国王第一次看见妖道并非无所不能。'],
    ['朝堂连试', '国王又命两边比坐禅、隔板猜物。行者随机应变，或在云台上显能，或暗助同伴，使鹿力等人的夸口一一落空。', '坐禅和猜物把斗法从单一比试推进到连续检验。悟空不是只靠蛮力，而是观察规则、及时应变，使三妖的虚张声势在朝堂上逐层露馅。'],
    ['三妖伏诛', '虎力、鹿力、羊力强逞妖法，终于在砍头、剖腹、下油锅等比试中自取其败。国王醒悟，释放僧人，师徒又整装西行。', '三妖的败亡不是偶然。它收束了“邪术蒙蔽国王、僧人受苦”的前因，也写出正法归位、民心回正的结果。'],
  ];
  const readingImage = reading.querySelector('.scene-image-frame img');
  readingImage.src = `${base}xiyouji_09_reading_storyboard.png`;
  readingImage.alt = '车迟国斗法五幕连环图';
  const readingCopy = reading.querySelector('.reading-copy');
  readingCopy.innerHTML = '<div class="reading-pager-top"><div class="reading-mode-switch" role="tablist" aria-label="阅读模式"><button class="is-active" data-reading-mode="compare" type="button">对照</button><button data-reading-mode="original" type="button">原文</button><button data-reading-mode="modern" type="button">白话</button></div><span class="reading-progress">01 / 05</span></div><section class="reading-page" aria-live="polite"></section><div class="reading-pager-bottom"><button class="reading-nav" type="button" data-reading-nav="prev" aria-label="上一段" title="上一段">←</button><div class="reading-stage-dots"></div><button class="reading-nav" type="button" data-reading-nav="next" aria-label="下一段" title="下一段">→</button></div>';
  let readingIndex = 0;
  let readingMode = 'compare';
  const renderReading = () => {
    const [name, original, modern] = readingPages[readingIndex];
    const panels = [];
    if (readingMode !== 'modern') panels.push(`<article class="reading-panel"><h3>原文节选 · ${name}</h3><p>${original}</p></article>`);
    if (readingMode !== 'original') panels.push(`<article class="reading-panel"><h3>白话精读 · ${name}</h3><p>${modern}</p></article>`);
    const page = readingCopy.querySelector('.reading-page');
    page.classList.toggle('is-single', panels.length === 1);
    page.innerHTML = panels.join('');
    readingCopy.querySelector('.reading-progress').textContent = `${String(readingIndex + 1).padStart(2, '0')} / 05`;
    readingCopy.querySelector('[data-reading-nav="prev"]').disabled = readingIndex === 0;
    readingCopy.querySelector('[data-reading-nav="next"]').disabled = readingIndex === readingPages.length - 1;
    readingCopy.querySelector('.reading-stage-dots').innerHTML = readingPages.map((item, index) => `<button class="reading-stage-dot${index === readingIndex ? ' is-active' : ''}" type="button" data-reading-index="${index}" aria-label="${item[0]}" title="${item[0]}"></button>`).join('');
    readingCopy.querySelectorAll('[data-reading-mode]').forEach(button => button.classList.toggle('is-active', button.dataset.readingMode === readingMode));
  };
  readingCopy.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.readingMode) readingMode = button.dataset.readingMode;
    if (button.dataset.readingIndex !== undefined) readingIndex = Number(button.dataset.readingIndex);
    if (button.dataset.readingNav === 'prev') readingIndex = Math.max(0, readingIndex - 1);
    if (button.dataset.readingNav === 'next') readingIndex = Math.min(readingPages.length - 1, readingIndex + 1);
    renderReading();
  });
  renderReading();

  const groups = [
    ['pressure', '01 国中受压', '和尚受役与悟空救僧，先交代车迟国被妖道颠倒的是非。'],
    ['temple', '02 三清观破局', '三徒借三清观受供，撕开三妖敬神欺世的外衣，并引出朝堂挑战。'],
    ['rain', '03 求雨与辨伪', '从祈雨到坐禅、猜物，悟空连续拆穿三妖的夸口和虚假神通。'],
    ['ending', '04 三妖终局', '虎、鹿、羊三力在最后比试中相继败亡，国王与僧人都迎来转变。'],
  ];
  const scenes = [
    ['pressure', '僧人受役', '和尚被迫劳作', '车迟国僧人戴锁服役，妖道借国王之信压制僧众。', ['情节作用：交代冲突根源。', '人物关系：三妖蒙蔽国王，僧人受苦。', '中考方向：车迟国背景。'], '01-monks-forced-labor.png'],
    ['pressure', '悟空救僧', '先解众僧之困', '悟空见僧人受苦，与同伴相助，使被压抑的僧人先得到喘息。', ['情节作用：确立师徒立场。', '人物证据：悟空敢于担当。', '中考方向：斗法的起因。'], '02-wukong-frees-the-monks.png'],
    ['temple', '三清观供奉', '丰盛供品映出虚伪', '道士把供奉摆得隆重，却把真实僧人当作苦役，形成强烈反差。', ['情节作用：铺垫三徒变化。', '人物关系：妖道敬神表象与欺世实质。', '中考方向：讽刺意味。'], '03-sanqing-temple-offerings.png'],
    ['temple', '三徒变化', '假三清受供', '悟空、八戒、沙僧变化成三清尊像，借道士信仰的外壳反制对方。', ['情节作用：斗法前的智取。', '人物证据：三徒配合默契。', '中考方向：三清观情节。'], '04-three-disciples-disguise.png'],
    ['temple', '三妖发觉', '供品失踪引怒', '虎力、鹿力、羊力发现供品被受用，既羞又怒，决意将师徒带到朝堂较量。', ['情节作用：矛盾公开化。', '人物关系：三妖与师徒正式对立。', '中考方向：挑战缘由。'], '05-three-immortals-discover.png'],
    ['temple', '朝堂约斗', '国王偏信妖道', '国王把斗法当作裁决是非的方式，仍把三妖视为可信的国师。', ['情节作用：进入公开较量。', '人物关系：国王受妖术蒙蔽。', '中考方向：车迟国王态度。'], '06-royal-court-challenge.png'],
    ['rain', '虎力祈雨', '妖道登坛夸能', '虎力大仙登坛求雨，企图以一场雨继续巩固自己在国王心中的权威。', ['情节作用：第一场核心较量。', '人物证据：虎力善于虚张声势。', '中考方向：求雨情节。'], '07-tiger-power-prays-for-rain.png'],
    ['rain', '悟空调雨', '真本领回应假神通', '悟空识破求雨的门道，调动风雨雷电，以真本领掌握雨势。', ['情节作用：关键反转。', '人物证据：悟空机智应变。', '中考方向：悟空如何破局。'], '08-wukong-commands-the-rain.png'],
    ['rain', '雨中露馅', '国王开始动摇', '雨势不再只听虎力指使，妖道的“神通”被事实拆穿，国王的盲信出现裂缝。', ['情节作用：改变权力关系。', '人物关系：国王由盲信转向怀疑。', '中考方向：求雨的作用。'], '09-rain-reveals-the-truth.png'],
    ['rain', '云台坐禅', '比耐力也比定力', '悟空与虎力比坐禅，云台之上既有本领之争，也有谁能守住心性的较量。', ['情节作用：把斗法推进为连试。', '人物证据：悟空沉着不乱。', '中考方向：坐禅比试。'], '10-cloud-platform-meditation.png'],
    ['rain', '隔板猜物', '鹿力夸口落空', '鹿力凭妖术逞能，悟空却随机应变，使隔板后的答案反成拆穿夸口的证据。', ['情节作用：连续揭露三妖。', '人物证据：悟空善察规则。', '中考方向：隔板猜物。'], '11-deer-power-guessing.png'],
    ['ending', '砍头比试', '虎力强逞邪术', '虎力以砍头炫耀妖法，悟空顺势应战，让其把骄横推向最危险的一步。', ['情节作用：终局前的升级。', '人物证据：虎力自负逞强。', '中考方向：砍头斗法。'], '12-tiger-power-beheading-duel.png'],
    ['ending', '虎力败亡', '邪术反噬其身', '虎力的妖法被破，最终不能复头，自取败亡。', ['情节作用：首妖伏诛。', '主题线索：假神通难敌正法。', '中考方向：虎力结局。'], '13-tiger-power-defeated.png'],
    ['ending', '鹿羊再试', '同伙仍不醒悟', '鹿力、羊力不肯收手，继续用剖腹、下油锅等比试维系妖道威势。', ['情节作用：显示三妖共同的执迷。', '人物关系：三妖互相壮胆。', '中考方向：后续比试。'], '14-deer-and-goat-final-trials.png'],
    ['ending', '三妖尽败', '国王醒悟释僧', '三妖相继失败，国王终于认清真相，释放僧人，车迟国的秩序回到正道。', ['情节作用：矛盾完整收束。', '人物关系：正法归位，民心回正。', '中考方向：结局与主题。'], '15-three-immortals-fall.png'],
  ];
  const plot = document.getElementById('plot');
  plot.innerHTML = '<div class="story-groups"></div><div class="plot-layout"><div class="scene-art"><img alt=""></div><article class="scene-copy"><div class="group-detail"></div><h3></h3><p></p><ul></ul></article></div><div class="scene-selector"></div>';
  let activeGroup = 'pressure';
  const showScene = index => {
    const scene = scenes[index];
    const image = plot.querySelector('.scene-art img');
    image.src = `${keyBase}${scene[5]}`;
    image.alt = `${scene[2]}：${scene[3]}`;
    plot.querySelector('.scene-copy h3').textContent = scene[2];
    plot.querySelector('.scene-copy p').textContent = scene[3];
    plot.querySelector('.scene-copy ul').innerHTML = scene[4].map(item => {
      const [label, ...copy] = item.split('：');
      return `<li><b class="highlight">${label}：</b>${copy.join('：')}</li>`;
    }).join('');
    plot.querySelectorAll('[data-scene]').forEach(button => button.classList.toggle('is-active', Number(button.dataset.scene) === index));
  };
  const renderPlot = () => {
    const selectedGroup = groups.find(group => group[0] === activeGroup);
    const subset = scenes.map((scene, index) => ({ scene, index })).filter(item => item.scene[0] === activeGroup);
    plot.querySelector('.story-groups').innerHTML = groups.map(group => `<button class="${group[0] === activeGroup ? 'is-active' : ''}" type="button" data-group="${group[0]}"><b>${group[1]}</b></button>`).join('');
    plot.querySelector('.group-detail').textContent = selectedGroup[2];
    plot.querySelector('.scene-selector').innerHTML = subset.map(({ scene, index }) => `<button type="button" data-scene="${index}"><span>${String(index + 1).padStart(2, '0')} / ${scenes.length}</span><b>${scene[1]}</b></button>`).join('');
    showScene(subset[0].index);
  };
  plot.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.group) {
      activeGroup = button.dataset.group;
      renderPlot();
    } else if (button.dataset.scene !== undefined) {
      showScene(Number(button.dataset.scene));
    }
  });
  renderPlot();

  const personCard = (image, name, role, traits, copy) => `<article class="person"><div class="portrait"><img src="${image}" alt="${name}人物群像"></div><div class="person-copy"><p class="person-role"><b>${name}</b><span>${role}</span></p><div class="traits">${traits}</div><p>${copy}</p></div></article>`;
  document.getElementById('people').innerHTML = `<div class="relationship-map"><article class="relationship-card"><span>权力误置</span><b>车迟国王 × 三妖</b><p>国王盲信邪术，让妖道压制僧人、颠倒是非。</p></article><article class="relationship-card core"><span>斗法主线</span><b>孙悟空 × 三妖</b><p>悟空用真本领与随机应变，逐层拆穿假神通。</p></article><article class="relationship-card"><span>正法归位</span><b>师徒 × 被役僧人</b><p>救僧、斗法与醒悟相连，车迟国重回正道。</p></article></div><div class="people-grid">${personCard(`${legacyPortraitBase}sun-wukong.png`, '孙悟空', '斗法者 · 破伪者', '<span class="trait-core">机智应变</span><span class="trait-core">敢于担当</span><span class="trait-action">识破邪术</span>', '他看出三妖借邪术欺世，在求雨、坐禅和猜物等比试中<b class="highlight">因势应变</b>，最终救僧正名。')}${personCard(`${legacyPortraitBase}tang-sanzang.png`, '唐三藏', '取经人 · 正法象征', '<span class="trait-core">持守信念</span><span class="trait-core">宽厚</span><span class="trait-action">稳住队伍</span>', '他不以争胜为目的，却让师徒始终站在受压僧人的一边，体现对<b class="highlight">正法与取经信念</b>的坚守。')}${personCard(`${portraitBase}tiger-power.png`, '虎力大仙', '首领 · 逞强者', '<span class="trait-flaw">自负夸口</span><span class="trait-action">登坛祈雨</span><span class="trait-flaw">邪术欺世</span>', '他依仗国王信任，以求雨和砍头制造神通幻象；越是逞强，越暴露出<b class="highlight">外强中干</b>。')}${personCard(`${portraitBase}deer-power.png`, '鹿力大仙', '帮凶 · 欺世者', '<span class="trait-flaw">随声附和</span><span class="trait-action">隔板猜物</span><span class="trait-flaw">不知收手</span>', '他随虎力一同蒙蔽国王，又在猜物、剖腹等比试中继续夸能，显示三妖的<b class="highlight">共同执迷</b>。')}${personCard(`${portraitBase}goat-power.png`, '羊力大仙', '帮凶 · 终局受挫', '<span class="trait-flaw">迷信邪术</span><span class="trait-action">下油锅</span><span class="trait-flaw">自取其败</span>', '他仍想以奇术维持妖道威势，最终在斗法中失败，和两位同伙共同完成了<b class="highlight">邪不胜正</b>的结局。')}</div>`;

  document.getElementById('exam').innerHTML = '<div class="exam-grid"><article class="exam-card answer-card"><h3>人物题答案搭建器</h3><div class="answer-builder"><div class="answer-step"><span>01 锁定人物</span><b>孙悟空</b><p>明确斗法中的行动者。</p></div><div class="answer-step"><span>02 选取证据</span><b>识破祈雨</b><p>用具体情节作证明。</p></div><div class="answer-step"><span>03 提炼特点</span><b>机智应变</b><p>由行为概括人物品质。</p></div><div class="answer-step"><span>04 写出结果</span><b>拆穿三妖</b><p>补足情节与主题结果。</p></div></div><p class="formula"><b>完整答案：</b>孙悟空看出虎力大仙借祈雨等邪术欺世，便根据比试规则调动真风雨、随机应变，又在后续连试中继续揭穿三妖，表现出机智应变、敢于担当的特点；他的行动促成国王醒悟、僧人获释，体现了正法终能战胜虚妄。</p><div class="answer-evidence"><section class="evidence-board"><h4>把答案写实：三处证据定位</h4><div class="evidence-list"><div><b>先看本质</b><span>看出三妖借国王盲信压制僧人。</span></div><div><b>再破神通</b><span>在求雨、坐禅、猜物中因势应变。</span></div><div><b>最后收束</b><span>三妖伏诛，国王释放受役僧人。</span></div></div></section><aside class="answer-checklist"><h4>落笔前自检</h4><p>写清人物任务</p><p>列出具体行为</p><p>提炼性格作用</p><p>交代情节结果</p></aside></div></article><article class="exam-card avoid-card"><h3>高频题与易失分</h3><div class="exam-types"><div class="exam-type"><b>情节顺序</b><p>受压、破局、祈雨、连试、伏诛，必须写出因果。</p></div><div class="exam-type"><b>人物理解</b><p>悟空取胜靠识破与应变，不能只写“法力大”。</p></div><div class="exam-type"><b>情节作用</b><p>求雨比试拆穿假神通，推动国王开始醒悟。</p></div><div class="exam-type"><b>讽刺主题</b><p>三妖借邪术与权势欺世，最终暴露虚妄本质。</p></div></div><ul><li>虎力、鹿力、羊力是车迟国三位妖道，不能与其他妖王混淆。</li><li>写“祈雨”要交代悟空以真本领拆穿假神通的因果。</li><li>结局不能只写三妖败亡，还要写国王醒悟、僧人获释。</li></ul><div class="exam-review"><section class="review-item"><span>考场 30 秒</span><b>先抓转折</b><p>求雨露馅，是国王由盲信转向动摇的开始。</p></section><section class="review-item"><span>答题核心</span><b>行为在前</b><p>先写悟空如何应对，再概括机智应变。</p></section><section class="review-item"><span>最后检查</span><b>因果写全</b><p>受压为何发生，正法怎样归位，结局如何变化。</p></section></div></article></div>';

  const questions = [
    ['情节顺序', '下列最符合《车迟国斗法》因果链的是？', ['僧人受压—三清观破局—祈雨斗法—连试三妖—三妖伏诛', '三妖伏诛—祈雨斗法—僧人受压—三清观破局', '悟空借芭蕉扇—祈雨斗法—三清观破局', '真假悟空—国王醒悟—三妖登坛'], 0, '故事先写妖道压制僧人，后经三清观破局与连场斗法，最终三妖伏诛。', 'plot', '回到关键镜头精讲', '01-monks-forced-labor.png'],
    ['人物理解', '斗法中孙悟空最突出的特点是？', ['只会正面硬拼', '善于识破虚伪、随机应变', '害怕比试、推卸责任', '只关心自己胜负'], 1, '悟空会观察三妖的把戏，再顺着规则寻找破局方法，体现机智与担当。', 'people', '回到人物群像', '07-tiger-power-prays-for-rain.png'],
    ['情节作用', '“求雨”情节在本回中的主要作用是？', ['让唐僧离开取经队', '以真本领拆穿妖道的欺世神通，推动国王开始醒悟', '说明八戒学会祈雨', '交代三妖害怕下雨'], 1, '雨势是否受三妖控制成为可见证据，第一次动摇了国王对妖道的盲信。', 'plot', '回到关键镜头精讲', '10-cloud-platform-meditation.png'],
    ['人物群像', '虎力、鹿力、羊力三妖在本回中的共同作用更接近？', ['帮助僧人恢复地位', '凭邪术蒙蔽国王、压制僧人，最终被正法揭穿', '护送唐僧继续西行', '为悟空提供法宝'], 1, '三妖共同依靠邪术和权势欺世，是车迟国僧人受压与斗法冲突的根源。', 'people', '回到人物群像', '14-deer-and-goat-final-trials.png'],
    ['简答框架', '分析孙悟空在本回的形象时，最完整的答法是？', ['只写“孙悟空很厉害”', '只复述三妖会妖术', '具体行为 → 性格或作用 → 情节结果', '只写国王最后醒悟'], 2, '人物题需要以悟空识破、应对斗法等具体行为为证据，再落到特点和结果。', 'exam', '回到中考攻略', '15-three-immortals-fall.png'],
  ];
  const qtabs = document.getElementById('question-tabs');
  const stem = document.getElementById('stem');
  const options = document.getElementById('options');
  const feedback = document.getElementById('feedback');
  const reviewLink = document.getElementById('review-link');
  const qprogress = document.getElementById('question-progress');
  const qlayout = document.querySelector('.question-layout');
  const showQuestion = index => {
    const question = questions[index];
    stem.textContent = question[1];
    qlayout.style.backgroundImage = `url('${keyBase}${question[7]}')`;
    qlayout.style.backgroundSize = 'cover';
    qlayout.style.backgroundPosition = 'center';
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
        if (!correct) {
          reviewLink.textContent = question[6];
          reviewLink.onclick = () => openTopic(question[5]);
        }
      });
      return button;
    }));
    qprogress.textContent = `第 ${index + 1} / ${questions.length} 题`;
    [...qtabs.children].forEach((button, buttonIndex) => button.classList.toggle('is-active', buttonIndex === index));
    feedback.textContent = '选择一个选项后查看解析。';
    reviewLink.classList.remove('is-visible');
  };
  qtabs.replaceChildren();
  questions.forEach((question, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${String(index + 1).padStart(2, '0')} ${question[0]}`;
    button.addEventListener('click', () => showQuestion(index));
    qtabs.appendChild(button);
  });
  showQuestion(0);
})();

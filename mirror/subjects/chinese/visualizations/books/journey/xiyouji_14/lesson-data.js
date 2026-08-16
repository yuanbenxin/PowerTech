(() => {
  const base = 'https://wulikeshihua-1339740714.cos.ap-beijing.myqcloud.com/%E8%AF%AD%E6%96%87/assets/media/journey/lessons/';
  const key = `${base}xiyouji_14_key_shots/`;
  const legacyPortrait = `${base}xiyouji_06_portraits/`;
  const portrait = `${base}xiyouji_14_portraits/`;

  const scenes = [
    ['silk','盘丝洞入境','师徒来到盘丝洞外','山洞与荒岭先建立险境，唐僧即将独自走入妖怪的生活空间。',['作用：交代地点与危机伏笔。','人物：师徒尚未识破妖气。','考点：盘丝洞是前半段主地点。'],'01-silk-cave-arrival-v2.png'],
    ['silk','七蛛现身','七个蜘蛛精暗中窥伺','七个女妖发现取经人，决定以美色和蛛丝设下陷阱。',['人物：七个蜘蛛精。','动机：觊觎唐僧肉。','考点：妖怪数量与本相。'],'02-seven-spiders-watch-v2.png'],
    ['silk','唐僧问路','唐僧独自入庄问路','唐僧因轻信屋舍主人而进入庄院，悟空等人暂在外等候。',['作用：制造唐僧落单条件。','人物：唐僧慈悲却易受表象迷惑。','考点：危机的直接起因。'],'03-tang-enters-manor-v2.png'],
    ['silk','蛛丝困师','蜘蛛精吐丝缚住唐僧','女妖现出手段，以蛛丝将唐僧困住并转移到盘丝洞。',['冲突：救师主线启动。','物件：蛛丝是核心陷阱。','考点：盘丝洞设局方式。'],'04-web-captures-tang-v2.png'],
    ['silk','悟空察觉','悟空发现师父失踪','悟空从屋舍异状判断唐僧遇险，开始追查妖怪踪迹。',['人物：悟空警觉、行动迅速。','作用：从受困转入破局。','考点：悟空的救师责任。'],'05-wukong-discovers-trap-v2.png'],
    ['silk','濯垢泉边','蜘蛛精在濯垢泉沐浴','七个蜘蛛精暂离洞府，濯垢泉一幕给悟空观察其弱点的机会。',['地点：濯垢泉。','结构：妖怪暂时疏于防备。','考点：盘丝洞相关地点辨析。'],'06-spiders-at-spring.png'],
    ['silk','八戒忘形','八戒受美色迷惑','八戒面对蜘蛛精一度忘形，反衬他贪恋女色的性格弱点。',['人物：八戒贪色、易动凡心。','作用：增加救师过程的阻碍。','考点：人物弱点必须结合情节。'],'07-bajie-loses-composure.png'],
    ['silk','悟空破网','悟空斩断蛛丝救师','悟空回到盘丝洞，以机智和行动断开蛛网，救出唐僧。',['动作：破蛛网、救唐僧。','人物：悟空善于发现弱点。','考点：前半段破局结果。'],'08-wukong-cuts-web.png'],
    ['silk','蜘蛛求援','女妖奔赴黄花观','蜘蛛精受挫后前往黄花观，请师兄百眼魔君相助。',['转场：盘丝洞转入黄花观。','关系：蜘蛛精与百眼魔君同属妖党。','考点：双地点故事衔接。'],'09-spiders-seek-help.png'],
    ['silk','黄花观设席','百眼魔君假意迎客','百眼魔君在黄花观假装热情相待，实际准备以毒计困住师徒。',['人物：百眼魔君善于伪装。','冲突：假礼遇背后是新陷阱。','考点：黄花观与百眼魔君。'],'10-hundred-eyed-hosts.png'],
    ['flower','毒茶试探','黄花观暗藏毒计','妖怪用表面的款待降低师徒警惕，危机从蛛丝转为毒计和妖光。',['作用：转换冲突手段。','对比：盘丝洞靠蛛丝，黄花观靠毒计。','考点：两段故事的区别。'],'11-poisoned-hospitality.png'],
    ['flower','百目金光','百眼魔君放出金光','百眼魔君现出本相，千眼齐开，放出的毒光令悟空难以近身。',['法术：百目金光。','冲突：悟空不能靠硬拼获胜。','考点：百眼魔君的厉害之处。'],'12-golden-light-trap.png'],
    ['flower','悟空受困','悟空在金光中周旋','悟空尝试破法，却被妖光和毒气所困，必须改变策略。',['人物：遇强不莽撞。','作用：推动外援线索。','考点：悟空破局方式的变化。'],'13-wukong-trapped-by-light.png'],
    ['flower','寻访毗蓝','悟空求见毗蓝婆菩萨','悟空得知应请毗蓝婆菩萨相助，故事进入“找准克制之物”的阶段。',['策略：先找克制关系。','人物：悟空善于求教。','考点：毗蓝婆菩萨的作用。'],'14-wukong-seeks-pilam.png'],
    ['flower','昴日受命','毗蓝婆请出昴日星官','毗蓝婆菩萨安排昴日星官出手，正好克制百眼魔君的妖法。',['关系：毗蓝婆与昴日星官。','逻辑：不是随意加援兵，而是相克破法。','考点：最终降魔者。'],'15-pleiades-answers-call.png'],
    ['flower','星官临观','昴日星官来到黄花观','昴日星官现身，百眼魔君的毒光失去威势，妖怪开始露出破绽。',['作用：局面由困转胜。','人物：昴日星官专破百眼妖法。','考点：降魔关键节点。'],'16-pleiades-arrives.png'],
    ['flower','妖怪现形','百眼魔君显出蜈蚣本相','百眼魔君无法维持道士外表，现出百足蜈蚣的妖怪本相。',['身份：百眼魔君的本相。','作用：真相被揭露。','考点：人物别称与本相。'],'17-hundred-eyed-revealed.png'],
    ['flower','昴日破魔','昴日星官破除妖法','昴日星官以自身神力破掉毒光，百眼魔君被制伏。',['结果：妖法被克制。','人物：外援对应妖怪弱点。','考点：结局不能误写成悟空独胜。'],'18-pleiades-subdues-demon.png'],
    ['flower','师徒脱险','唐僧与弟子重聚','两处险境都已解除，唐僧获救，队伍恢复西行秩序。',['结果：救师成功。','结构：双地点危机完整收束。','考点：情节结局。'],'19-team-reunites.png'],
    ['flower','双线回收','盘丝洞与黄花观因果收束','本课以“蛛丝困师—妖光困悟空—相克破法”形成连环故事，说明取经路上既要警觉，也要善于求助。',['结构：盘丝洞—黄花观。','主题：识破诱惑、合作破局。','考点：完整情节概括。'],'20-two-lines-resolve.png']
  ];

  const groups = [
    ['silk','01 盘丝洞设局','从唐僧落单到蛛丝困师，危机由七个蜘蛛精主动设下。'],
    ['rescue','02 濯垢泉破局','悟空识破妖怪弱点，八戒的忘形与悟空的救师形成对照。'],
    ['flower','03 黄花观毒光','蜘蛛精求援后，百眼魔君以假礼遇和百目金光制造更大困局。'],
    ['resolve','04 相克收魔','悟空求见毗蓝婆，昴日星官以相克之法破掉百眼妖法。']
  ];
  scenes.forEach((scene, index) => {
    if (index >= 5 && index <= 8) scene[0] = 'rescue';
    if (index >= 13) scene[0] = 'resolve';
  });

  const readingPages = [
    ['盘丝洞设局','唐僧一行经过盘丝洞，七个蜘蛛精见取经人来到，便以屋舍与女色作伪装。唐僧独自入庄问路，女妖趁机以蛛丝把他缚住，转入洞中。','这一段先写“看似有人家”的表象，再写唐僧落单受困。读情节时要抓住因果：轻信表象并不等于唐僧有恶意，却给妖怪留下了设局机会。'],
    ['濯垢泉破局','悟空追查到盘丝洞，又见蜘蛛精在濯垢泉边沐浴。八戒见女妖一度忘形，悟空则借机观察，最终回洞破网救师。','这里不只考“蜘蛛精沐浴”，更考人物对比：八戒受诱惑，悟空抓破绽。前者增加波折，后者把救师行动推向成功。'],
    ['黄花观转场','蜘蛛精受挫后逃往黄花观，请师兄百眼魔君相助。百眼魔君假装热情相迎，实则将新的毒计和妖法藏在礼遇之后。','盘丝洞与黄花观并非两件无关故事。蜘蛛精求援把前一段失败转为后一段危机，因此情节概括必须写出这条衔接。'],
    ['百目金光','百眼魔君现出妖相，放出百目金光与毒气。悟空一时难以近身，知道不能只靠棍棒硬破，转而寻找能克制妖法的人。','这一步体现悟空的应变：先承认硬拼无效，再找“谁能破什么法”。答人物题应写出这种观察、求教和调整策略。'],
    ['昴日破魔','悟空求见毗蓝婆菩萨，菩萨请昴日星官出手。昴日星官来到黄花观，破除百眼妖法，师徒终于脱险并继续西行。','结局的关键是“相克”。降伏百眼魔君的不是悟空单独取胜，而是毗蓝婆指引、昴日星官破法，体现取经队伍遇险时的合作与求助。']
  ];

  document.title = '盘丝洞斗蜘蛛精 · 名著精学';
  document.body.style.background = `linear-gradient(135deg,rgba(10,25,28,.55),rgba(4,10,12,.78)),url('${key}01-silk-cave-arrival-v2.png') center/cover fixed`;
  document.querySelector('.eyebrow').textContent = '西游记 · 第 72—73 回 · 名著精学';
  document.querySelector('h1').textContent = '盘丝洞斗蜘蛛精';
  const videoTrigger = document.getElementById('story-video-trigger');
  if (videoTrigger) videoTrigger.style.display = 'none';

  const readingImage = document.querySelector('.scene-image-frame img');
  readingImage.src = `${base}xiyouji_14_reading_storyboard.png`;
  readingImage.alt = '盘丝洞与黄花观五幕连环图';
  const artCopy = document.querySelector('.art-copy');
  artCopy.innerHTML = '<p class="meta">第 72—73 回 · 五幕连环图</p><strong>沿双地点读懂连环险境</strong><p>从盘丝洞蛛丝困师，到黄花观百目毒光，再看悟空如何找到相克之法。</p>';

  const readingPage = document.getElementById('reading-page');
  const readingProgress = document.getElementById('reading-progress');
  const readingDots = document.getElementById('reading-stage-dots');
  const readingPrev = document.getElementById('reading-prev');
  const readingNext = document.getElementById('reading-next');
  const readingModes = [...document.querySelectorAll('[data-reading-mode]')];
  let pageIndex = 0;
  let mode = 'compare';
  const renderReading = () => {
    const [title, original, modern] = readingPages[pageIndex];
    const panels = [];
    if (mode !== 'modern') panels.push(`<article class="reading-panel"><h3>原文情节 · ${title}</h3><p>${original}</p></article>`);
    if (mode !== 'original') panels.push(`<article class="reading-panel"><h3>白话精读 · ${title}</h3><p>${modern}</p></article>`);
    readingPage.classList.toggle('is-single', panels.length === 1);
    readingPage.innerHTML = panels.join('');
    readingProgress.textContent = `${String(pageIndex + 1).padStart(2, '0')} / 05`;
    readingPrev.disabled = pageIndex === 0;
    readingNext.disabled = pageIndex === readingPages.length - 1;
    readingDots.innerHTML = readingPages.map(([title], index) => `<button class="reading-stage-dot${index === pageIndex ? ' is-active' : ''}" data-page="${index}" title="${title}" aria-label="第 ${index + 1} 段：${title}"></button>`).join('');
    readingModes.forEach(button => {
      const active = button.dataset.readingMode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
  };
  document.getElementById('reading').onclick = event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.readingMode) mode = button.dataset.readingMode;
    if (button.dataset.page !== undefined) pageIndex = Number(button.dataset.page);
    if (button.id === 'reading-prev') pageIndex = Math.max(0, pageIndex - 1);
    if (button.id === 'reading-next') pageIndex = Math.min(readingPages.length - 1, pageIndex + 1);
    renderReading();
  };
  renderReading();

  const groupSelector = document.getElementById('story-groups');
  const selector = document.getElementById('scene-selector');
  const sceneArtImage = document.getElementById('scene-art-image');
  const sceneTitle = document.getElementById('scene-title');
  const sceneText = document.getElementById('scene-text');
  const sceneList = document.getElementById('scene-list');
  const groupDetail = document.getElementById('group-detail');
  let activeGroup = 'silk';
  const showScene = index => {
    const [group, label, title, description, notes, image] = scenes[index];
    sceneArtImage.src = `${key}${image}`;
    sceneArtImage.alt = `${label}：${title}`;
    sceneTitle.textContent = title;
    sceneText.textContent = description;
    sceneList.innerHTML = notes.map(note => {
      const [lead, ...rest] = note.split('：');
      return `<li><b class="highlight">${lead}：</b>${rest.join('：')}</li>`;
    }).join('');
    [...selector.children].forEach(button => button.classList.toggle('is-active', Number(button.dataset.index) === index));
  };
  const showGroup = groupId => {
    activeGroup = groupId;
    const group = groups.find(item => item[0] === groupId);
    groupDetail.textContent = group[2];
    const groupScenes = scenes.map((item, index) => ({ item, index })).filter(({ item }) => item[0] === groupId);
    selector.innerHTML = groupScenes.map(({ item, index }) => `<button type="button" data-index="${index}"><span>${String(index + 1).padStart(2, '0')} / 20</span><b>${item[1]}</b></button>`).join('');
    [...groupSelector.children].forEach(button => button.classList.toggle('is-active', button.dataset.group === groupId));
    showScene(groupScenes[0].index);
  };
  groupSelector.innerHTML = groups.map(([id, label]) => `<button type="button" data-group="${id}"><b>${label}</b></button>`).join('');
  groupSelector.onclick = event => {
    const button = event.target.closest('button');
    if (button) showGroup(button.dataset.group);
  };
  selector.onclick = event => {
    const button = event.target.closest('button');
    if (button) showScene(Number(button.dataset.index));
  };
  showGroup(activeGroup);

  const personCard = (src, name, role, traits, detail) => `<article class="person"><div class="portrait"><img src="${src}" alt="${name}人物群像"></div><div class="person-copy"><p class="person-role"><b>${name}</b><span>${role}</span></p><div class="traits">${traits.map(([kind, text]) => `<span class="${kind}">${text}</span>`).join('')}</div><p>${detail}</p></div></article>`;
  document.querySelector('.relationship-map').innerHTML = '<article class="relationship-card"><span>第一段 · 盘丝洞设局</span><b>蜘蛛精 × 唐三藏</b><p>蜘蛛精以美色和蛛丝设局，利用唐僧的善意制造受困危机。</p></article><article class="relationship-card core"><span>第二段 · 破局转场</span><b>孙悟空识破陷阱</b><p>悟空破网救师，并从观察与求教中找到继续破局的关键。</p></article><article class="relationship-card"><span>第三段 · 黄花观降魔</span><b>毗蓝婆 × 昴日星官</b><p>毗蓝婆指明相克关系，昴日星官奉命破除百眼魔君的妖法。</p></article>';
  document.querySelector('.people-grid').innerHTML = [
    personCard(`${legacyPortrait}sun-wukong.png`, '孙悟空', '破局者 · 求教者', [['trait-core','警觉善断'],['trait-action','救师破网'],['trait-action','求教破法']], '面对蛛丝和百目金光，悟空没有只靠蛮力，而是先<b class="highlight">找破绽</b>、再<b class="highlight">找相克之法</b>。'),
    personCard(`${legacyPortrait}tang-sanzang.png`, '唐三藏', '取经人 · 受困者', [['trait-core','心怀善意'],['trait-flaw','易信表象'],['trait-action','两度遇险']], '唐僧入庄问路后被蛛丝困住，提醒读者：善意需要与<b class="highlight">警觉</b>同行。'),
    personCard(`${portrait}spider-demon.png`, '蜘蛛精', '设局者 · 诱惑者', [['trait-flaw','狡诈'],['trait-action','蛛丝困师'],['trait-flaw','以色迷人']], '七个蜘蛛精以美色和蛛丝设险，推动盘丝洞一段的<b class="highlight">救师主线</b>。'),
    personCard(`${portrait}hundred-eyed-demon.png?v=20260730234545`, '百眼魔君', '黄花观妖主', [['trait-flaw','假意迎客'],['trait-action','百目毒光'],['trait-flaw','倚仗妖法']], '他接替蜘蛛精扩大危机，百目金光说明这不是单靠兵器就能破解的险关。'),
    personCard(`${portrait}pleiades-star-official.png`, '昴日星官', '相克者 · 降魔者', [['trait-core','专破妖法'],['trait-action','破百目金光'],['trait-core','奉命相助']], '在毗蓝婆菩萨指引下出手，准确说明结局是<b class="highlight">相克破法</b>，并非悟空独自取胜。')
  ].join('');

  document.getElementById('exam').innerHTML = '<div class="exam-grid"><article class="exam-card answer-card"><h3>情节题答案搭建器</h3><div class="answer-builder"><div class="answer-step"><span>01 锁定地点</span><b>盘丝洞</b><p>先写蜘蛛精设局、唐僧受困。</p></div><div class="answer-step"><span>02 补全转折</span><b>悟空救师</b><p>写悟空破网，不能漏前段结果。</p></div><div class="answer-step"><span>03 写明升级</span><b>黄花观</b><p>女妖求援，百眼魔君以毒光困敌。</p></div><div class="answer-step"><span>04 点出破法</span><b>相克收魔</b><p>毗蓝婆指引，昴日星官降魔。</p></div></div><p class="formula"><b>完整答案：</b>七个蜘蛛精在盘丝洞以美色和蛛丝缚住唐僧，悟空破网救师；女妖转往黄花观请百眼魔君相助，百眼魔君以百目金光困住悟空，悟空求见毗蓝婆菩萨，昴日星官最终破除妖法，师徒脱险西行。</p><div class="answer-evidence"><section class="evidence-board"><h4>把答案写实：三处证据定位</h4><div class="evidence-list"><div><b>先写困师</b><span>盘丝洞的七个蜘蛛精以美色和蛛丝设下陷阱，唐僧因此受困。</span></div><div><b>再写转场</b><span>悟空破网救师后，蜘蛛精受挫，前往黄花观请百眼魔君相助。</span></div><div><b>最后破法</b><span>百目金光不能硬拼，毗蓝婆指明相克关系，昴日星官破除妖法。</span></div></div></section><aside class="answer-checklist"><h4>落笔前自检</h4><p>写清两个地点</p><p>交代求援转场</p><p>写出妖法与克制</p><p>补足师徒脱险</p></aside></div></article><article class="exam-card avoid-card"><h3>高频题与易失分</h3><div class="exam-types"><div class="exam-type"><b>情节概括</b><p>盘丝洞困师、悟空破网、黄花观毒光、相克破法，按因果写全。</p></div><div class="exam-type"><b>人物关系</b><p>蜘蛛精设局，百眼魔君扩险，悟空观察求教，昴日星官降魔。</p></div><div class="exam-type"><b>情节补写</b><p>抓住蛛丝、求援、百目金光、昴日破法这些关键节点。</p></div><div class="exam-type"><b>主题探究</b><p>从警惕表象、寻找弱点、合作求助三个层面切入。</p></div></div><ul><li>盘丝洞的七个女妖是蜘蛛精，主要陷阱是蛛丝。</li><li>黄花观的妖主是百眼魔君，不能只笼统写“蜈蚣精”。</li><li>最终破掉百眼妖法的是昴日星官，不是悟空独自硬拼。</li></ul><div class="exam-review"><section class="review-item"><span>考场 30 秒</span><b>先定地点</b><p>盘丝洞与黄花观要同时写出，不能割裂成两件小事。</p></section><section class="review-item"><span>答题核心</span><b>因果在前</b><p>先写设局与求援，再写破法与脱险。</p></section><section class="review-item"><span>最后检查</span><b>相克写全</b><p>不要漏掉毗蓝婆指引和昴日星官降魔。</p></section></div></article></div>';

  const questions = [
    ['地点辨析','盘丝洞一段中，蜘蛛精困住唐僧的主要手段是？',['蛛丝','芭蕉扇','金铙','人种袋'],0,'蜘蛛精以蛛丝设险，盘丝洞是本课前半段的主要地点。','plot'],
    ['情节衔接','盘丝洞危机为什么会转入黄花观？',['唐僧主动去拜访道士','蜘蛛精受挫后去请百眼魔君相助','悟空把师父送到黄花观','百眼魔君来盘丝洞借法宝'],1,'蜘蛛精受挫后前往黄花观求援，才把两段故事连成一条线。','plot'],
    ['人物理解','濯垢泉一段最能反映猪八戒什么性格弱点？',['贪恋女色、易受诱惑','火眼金睛','善于谋略','严守戒律'],0,'八戒面对蜘蛛精一度忘形，需结合具体情节概括为贪色、易受诱惑。','people'],
    ['降魔关系','最终破掉百眼魔君妖法的关键人物是？',['孙悟空独自','唐僧','昴日星官','七个蜘蛛精'],2,'悟空求见毗蓝婆菩萨，昴日星官出手破除百眼妖法。','people'],
    ['概括方法','概括本课情节时，最完整的结构是？',['只写蜘蛛精被打败','盘丝洞困师—悟空救师—黄花观毒光—相克破法','只写百眼魔君现形','只写悟空请来援兵'],1,'本课是双地点连环故事，必须写清盘丝洞、黄花观以及相克破法的因果。','exam']
  ];
  const questionTabs = document.getElementById('question-tabs');
  const stem = document.getElementById('stem');
  const options = document.getElementById('options');
  const feedback = document.getElementById('feedback');
  const reviewLink = document.getElementById('review-link');
  const progress = document.getElementById('question-progress');
  const layout = document.querySelector('.question-layout');
  const showQuestion = index => {
    const [label, question, answers, correct, answer, target] = questions[index];
    stem.textContent = question;
    layout.style.backgroundImage = `url('${key}${scenes[[3, 8, 6, 17, 19][index]][5]}')`;
    options.innerHTML = answers.map((text, optionIndex) => `<button type="button" data-option="${optionIndex}"><span class="opt-letter">${String.fromCharCode(65 + optionIndex)}</span><span class="opt-text">${text}</span></button>`).join('');
    options.onclick = event => {
      const button = event.target.closest('button');
      if (!button) return;
      const isCorrect = Number(button.dataset.option) === correct;
      [...options.children].forEach(item => item.classList.remove('is-selected','is-correct','is-wrong'));
      button.classList.add('is-selected', isCorrect ? 'is-correct' : 'is-wrong');
      feedback.textContent = `${isCorrect ? '回答正确。' : '再想一想。'}${answer}`;
      reviewLink.classList.toggle('is-visible', !isCorrect);
      reviewLink.textContent = target === 'exam' ? '回到中考攻略' : '回到关键镜头精讲';
      reviewLink.onclick = () => document.querySelector(`[data-topic="${target}"]`).click();
    };
    progress.textContent = `第 ${index + 1} / ${questions.length} 题`;
    [...questionTabs.children].forEach((button, tabIndex) => button.classList.toggle('is-active', tabIndex === index));
    feedback.textContent = '选择一个选项后查看解析。';
    reviewLink.classList.remove('is-visible');
  };
  questionTabs.innerHTML = questions.map(([label], index) => `<button type="button" data-question="${index}">${String(index + 1).padStart(2, '0')} ${label}</button>`).join('');
  questionTabs.onclick = event => {
    const button = event.target.closest('button');
    if (button) showQuestion(Number(button.dataset.question));
  };
  showQuestion(0);
})();

(() => {
  const config = window.JourneyLessonConfig;
  if (!config) return;

  const base = 'https://wulikeshihua-1339740714.cos.ap-beijing.myqcloud.com/%E8%AF%AD%E6%96%87/assets/media/journey/';
  const standardPortraits = `${base}lessons/xiyouji_06_portraits/`;
  const cover = `${base}${config.cover}`;
  const tabs = [...document.querySelectorAll('.tabs button')];
  const topics = [...document.querySelectorAll('.topic')];
  const open = id => {
    topics.forEach(topic => topic.classList.toggle('is-active', topic.id === id));
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.topic === id));
  };

  document.title = `${config.name} · 名著精学`;
  document.querySelector('main')?.setAttribute('aria-label', `${config.name}名著精学课件`);
  document.querySelector('.eyebrow').textContent = `西游记 · ${config.range} · 名著精学`;
  document.querySelector('h1').textContent = config.name;
  document.body.style.background = `linear-gradient(135deg,rgba(10,25,28,.55),rgba(4,10,12,.78)),url('${cover}') center/cover fixed`;
  const video = document.getElementById('story-video-trigger');
  if (video) video.style.display = 'none';
  const modal = document.getElementById('story-video-modal');
  if (modal) modal.hidden = true;
  tabs.forEach(tab => { tab.onclick = () => open(tab.dataset.topic); });

  const reading = document.getElementById('reading');
  const readingImage = reading.querySelector('.scene-image-frame img');
  readingImage.src = config.readingStoryboard ? `${base}lessons/${config.readingStoryboard}` : cover;
  readingImage.alt = `${config.name}五幕连环阅读插图`;
  const readingCopy = reading.querySelector('.reading-copy');
  readingCopy.innerHTML = '<div class="reading-pager-top"><div class="reading-mode-switch"><button class="is-active" data-mode="both" type="button">对照</button><button data-mode="old" type="button">原文</button><button data-mode="new" type="button">白话</button></div><span class="reading-progress"></span></div><section class="reading-page"></section><div class="reading-pager-bottom"><button class="reading-nav" data-move="-1" type="button" aria-label="上一段">←</button><div class="reading-stage-dots"></div><button class="reading-nav" data-move="1" type="button" aria-label="下一段">→</button></div>';
  let readingIndex = 0;
  let readingMode = 'both';
  const renderReading = () => {
    const item = config.reading[readingIndex];
    const panels = [];
    if (readingMode !== 'new') panels.push(`<article class="reading-panel"><h3>情节原貌 · ${item[0]}</h3><p>${item[1]}</p></article>`);
    if (readingMode !== 'old') panels.push(`<article class="reading-panel"><h3>白话精读 · ${item[0]}</h3><p>${item[2]}</p></article>`);
    readingCopy.querySelector('.reading-page').innerHTML = panels.join('');
    readingCopy.querySelector('.reading-progress').textContent = `${String(readingIndex + 1).padStart(2, '0')} / 05`;
    readingCopy.querySelector('.reading-stage-dots').innerHTML = config.reading.map((page, index) => `<button type="button" class="reading-stage-dot${index === readingIndex ? ' is-active' : ''}" data-page="${index}" title="${page[0]}"></button>`).join('');
    [...readingCopy.querySelectorAll('[data-mode]')].forEach(button => button.classList.toggle('is-active', button.dataset.mode === readingMode));
  };
  readingCopy.onclick = event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.mode) readingMode = button.dataset.mode;
    if (button.dataset.page !== undefined) readingIndex = Number(button.dataset.page);
    if (button.dataset.move) readingIndex = Math.max(0, Math.min(4, readingIndex + Number(button.dataset.move)));
    renderReading();
  };
  renderReading();

  const plot = document.getElementById('plot');
  plot.innerHTML = '<div class="story-groups"></div><div class="plot-layout"><div class="scene-art"><img></div><article class="scene-copy"><div class="group-detail"></div><h3></h3><p></p><ul></ul></article></div><div class="scene-selector"></div>';
  let activeGroup = 0;
  const lessonId = config.cover.match(/\d+/)?.[0];
  const shotDirectory = `${base}lessons/xiyouji_${lessonId}_key_shots/`;
  const sceneList = config.groups.flatMap((group, groupIndex) => group.scenes.map((label, sceneIndex) => ({ groupIndex, sceneIndex, label, detail: group.detail })));
  const showScene = index => {
    const scene = sceneList[index];
    const sceneNote = config.sceneNotes?.[index] || `${scene.label}推动本回主线发展。`;
    const image = plot.querySelector('.scene-art img');
    image.onerror = () => { image.onerror = null; image.src = cover; };
    image.src = `${shotDirectory}${String(index + 1).padStart(2, '0')}.png`;
    image.alt = `${scene.label}插图占位`;
    plot.querySelector('h3').textContent = scene.label;
    plot.querySelector('.scene-copy p').textContent = sceneNote;
    plot.querySelector('.scene-copy ul').innerHTML = `<li><b class="highlight">情节作用：</b>${sceneNote}</li><li><b class="highlight">人物关系：</b>${config.relationshipFocus}</li><li><b class="highlight">中考方向：</b>${config.examFocus}</li>`;
    plot.querySelectorAll('[data-scene]').forEach(button => button.classList.toggle('is-active', Number(button.dataset.scene) === index));
  };
  const renderPlot = () => {
    const group = config.groups[activeGroup];
    const list = sceneList.map((scene, index) => ({ scene, index })).filter(item => item.scene.groupIndex === activeGroup);
    plot.querySelector('.story-groups').innerHTML = config.groups.map((item, index) => `<button class="${index === activeGroup ? 'is-active' : ''}" data-group="${index}" type="button"><b>${item.label}</b></button>`).join('');
    plot.querySelector('.group-detail').textContent = group.detail;
    plot.querySelector('.scene-selector').innerHTML = list.map(({ scene, index }) => `<button data-scene="${index}" type="button"><span>${String(index + 1).padStart(2, '0')} / 20</span><b>${scene.label}</b></button>`).join('');
    showScene(list[0].index);
  };
  plot.onclick = event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.group !== undefined) { activeGroup = Number(button.dataset.group); renderPlot(); }
    if (button.dataset.scene !== undefined) showScene(Number(button.dataset.scene));
  };
  renderPlot();

  const portraitFor = person => person.image ? `${base}${person.image}` : `${standardPortraits}${person.key || 'sun-wukong'}.png`;
  const personCard = person => `<article class="person"><div class="portrait"><img src="${portraitFor(person)}" alt="${person.name}人物占位"></div><div class="person-copy"><p class="person-role"><b>${person.name}</b><span>${person.role}</span></p><div class="traits">${person.traits.map((trait, index) => `<span class="${index === 0 ? 'trait-core' : 'trait-action'}">${trait}</span>`).join('')}</div><p>${person.detail}</p></div></article>`;
  document.getElementById('people').innerHTML = `<div class="relationship-map">${config.relationships.map((item, index) => `<article class="relationship-card${index === 1 ? ' core' : ''}"><span>${item[0]}</span><b>${item[1]}</b><p>${item[2]}</p></article>`).join('')}</div><div class="people-grid">${config.people.map(personCard).join('')}</div>`;

  const exam = document.getElementById('exam');
  const steps = config.exam.steps.map((step, index) => `<div class="answer-step"><span>0${index + 1} ${step[0]}</span><b>${step[1]}</b><p>${step[2]}</p></div>`).join('');
  const evidence = config.exam.evidence.map(item => `<div><b>${item[0]}</b><span>${item[1]}</span></div>`).join('');
  const types = config.exam.types.map(item => `<div class="exam-type"><b>${item[0]}</b><p>${item[1]}</p></div>`).join('');
  const warnings = config.exam.warnings.map(item => `<li>${item}</li>`).join('');
  const reviews = config.exam.reviews.map(item => `<section class="review-item"><span>${item[0]}</span><b>${item[1]}</b><p>${item[2]}</p></section>`).join('');
  exam.innerHTML = `<div class="exam-grid"><article class="exam-card answer-card"><h3>${config.exam.title}</h3><div class="answer-builder">${steps}</div><p class="formula"><b>完整答案：</b>${config.exam.answer}</p><div class="answer-evidence"><section class="evidence-board"><h4>把答案写实：三处证据定位</h4><div class="evidence-list">${evidence}</div></section><aside class="answer-checklist"><h4>落笔前自检</h4>${config.exam.checks.map(item => `<p>${item}</p>`).join('')}</aside></div></article><article class="exam-card avoid-card"><h3>高频题与易失分</h3><div class="exam-types">${types}</div><ul>${warnings}</ul><div class="exam-review">${reviews}</div></article></div>`;

  const qtabs = document.getElementById('question-tabs');
  const stem = document.getElementById('stem');
  const options = document.getElementById('options');
  const feedback = document.getElementById('feedback');
  const review = document.getElementById('review-link');
  const progress = document.getElementById('question-progress');
  const layout = document.querySelector('.question-layout');
  const practiceBackgrounds = config.practiceBackgrounds || [];
  document.querySelector('#practice .question-side p').textContent = `${config.name}的情节、人物、主题与简答框架自测。`;
  document.querySelector('#practice .question-main h3').textContent = `《${config.name}》自测`;
  const showQuestion = index => {
    const question = config.questions[index];
    stem.textContent = question[1];
    const questionBackground = practiceBackgrounds[index]
      ? `${shotDirectory}${practiceBackgrounds[index]}`
      : cover;
    layout.style.backgroundImage = `url('${questionBackground}')`;
    layout.style.backgroundSize = 'cover';
    layout.style.backgroundPosition = 'center';
    layout.style.backgroundRepeat = 'no-repeat';
    options.replaceChildren(...question[2].map((text, optionIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + optionIndex)}</span><span class="opt-text">${text}</span>`;
      button.onclick = () => {
        [...options.children].forEach(item => item.classList.remove('is-selected', 'is-correct', 'is-wrong'));
        const correct = optionIndex === question[3];
        button.classList.add('is-selected', correct ? 'is-correct' : 'is-wrong');
        feedback.textContent = `${correct ? '回答正确。' : '再想一想。'}${question[4]}`;
        review.classList.toggle('is-visible', !correct);
        if (!correct) { review.textContent = question[6]; review.onclick = () => open(question[5]); }
      };
      return button;
    }));
    progress.textContent = `第 ${index + 1} / ${config.questions.length} 题`;
    [...qtabs.children].forEach((button, buttonIndex) => button.classList.toggle('is-active', buttonIndex === index));
    feedback.textContent = '选择一个选项后查看解析。';
    review.classList.remove('is-visible');
  };
  qtabs.replaceChildren();
  config.questions.forEach((question, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${String(index + 1).padStart(2, '0')} ${question[0]}`;
    button.onclick = () => showQuestion(index);
    qtabs.appendChild(button);
  });
  showQuestion(0);
})();

/*!
 * PowerTech 在线教学演示 — 全站 UI 覆盖层
 * 注入于各科目 app.html / stage-selector.html / 欢迎页
 * 职责：主题（默认浅色）、导航工具栏（搜索/关于/声明/主题）、题库主题还原、
 *       化学侧边栏改造、返回按钮统一、毛玻璃/平滑滚动/圆角规范化、iframe 主题传播
 */
(function () {
  'use strict';

  var SUBJECT = (location.pathname.match(/subjects\/([a-z]+)/) || [])[1] || '';
  var IS_CHEM = SUBJECT === 'chemistry';
  var KEY = 'shg-theme';
  var PIN_KEY = 'pt-chem-pin';

  var mode = 'light';
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') mode = saved;
  } catch (e) {}

  /* 化学内部自带“背景切换”与全局主题冲突：锁定其内部为深色，
     浅色外观统一交给全局反转滤镜实现 */
  if (IS_CHEM) {
    try { localStorage.setItem('shiguang-background-theme', 'dark'); } catch (e) {}
  }

  /* ============================ 样式 ============================ */

  var CSS = [
    '/* ==== PowerTech UI 覆盖层 ==== */',

    /* 残留入口隐藏（登录/订阅/个人中心/化学自带主题钮与展开钮） */
    '[title="个人中心"],[aria-label="打开个人中心"],[title="订阅中心"],[aria-label="订阅中心"],',
    '[title="退出登录"],[aria-label="退出登录"],[title="退出系统"],[aria-label="退出系统"],',
    '[title="切换到浅色背景"],[title="切换到深色背景"],',
    '[title="展开侧边栏"],[aria-label="展开"],[title="收起侧边栏"],[aria-label="收起"]{display:none !important;}',

    /* 浅色主题：整体反色（保色相），媒体二次反色还原。
       注意：body 自身背景必须给深色基色（反转后视觉为浅色），
       若直接给浅色会被滤镜反转成深色页面底。 */
    'html.shg-light{background:#f4f5f7;}',
    'html.shg-light body{filter:invert(1) hue-rotate(180deg);background:#0c0d0f !important;}',
    'html.shg-light body :is(img,video,canvas,iframe,model-viewer){filter:invert(1) hue-rotate(180deg);}',
    'html.shg-light body [style*="url("]{background-image:none !important;}',
    /* 化学演示画布：canvas 在双重反转清单内（视觉恒等），背景直接给浅色终值 */
    'html.shg-light body canvas{background-color:#e9ebee;}',
    /* 数学题库 v2：自带米白纸感主题，双重反转还原原生观感 */
    'html.shg-light body .question-bank-visual-v2{filter:invert(1) hue-rotate(180deg);}',
    'html.shg-light body .question-bank-visual-v2 :is(img,video,canvas,iframe,model-viewer){filter:none;}',

    /* 视觉规范化：平滑滚动 / 大圆角收敛 / 卡片毛玻璃 */
    '*{scroll-behavior:smooth;}',
    '.rounded-\\[22px\\],.rounded-\\[24px\\],.rounded-\\[28px\\],.rounded-\\[30px\\],.rounded-\\[34px\\],',
    '.rounded-\\[40px\\],.rounded-\\[44px\\],.rounded-\\[46px\\],.rounded-\\[60px\\]{border-radius:16px !important;}',
    '[style*="grid-template-columns"]>*:not(:has(canvas)):not(.pt-no-glass){',
    '  -webkit-backdrop-filter:blur(14px) saturate(1.28);backdrop-filter:blur(14px) saturate(1.28);',
    '  box-shadow:0 10px 32px -14px rgba(0,0,0,.28);}',

    /* 导航工具栏（挂进各科目 header；无法挂载时固定右上） */
    '#pt-nav{display:flex;align-items:center;gap:8px;margin:0 4px 0 12px;position:relative;z-index:60;}',
    '#pt-nav.pt-floating{position:fixed;top:10px;right:12px;z-index:2147483000;margin:0;}',
    '#pt-nav .pt-btn{height:32px;min-width:32px;border-radius:10px;border:1px solid rgba(130,140,150,.35);',
    '  background:rgba(22,25,30,.62);color:#e6e8ea;display:flex;align-items:center;justify-content:center;',
    '  cursor:pointer;transition:transform .15s ease,background .2s ease;text-decoration:none;',
    '  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-size:12px;font-weight:700;letter-spacing:.02em;}',
    '#pt-nav .pt-btn.pt-lbl{padding:0 11px;gap:6px;}',
    '#pt-nav .pt-btn:not(.pt-lbl){width:32px;padding:0;}',
    '#pt-nav .pt-btn:hover{transform:translateY(-1px);background:rgba(38,42,48,.72);}',
    '#pt-nav .pt-btn:active{transform:scale(.92);}',
    '#pt-nav .pt-btn svg{width:15px;height:15px;flex:none;}',
    '#pt-nav .pt-search{position:relative;}',
    '#pt-nav .pt-search input{width:130px;height:32px;border-radius:10px;outline:none;font-size:12.5px;',
    '  border:1px solid rgba(130,140,150,.35);background:rgba(22,25,30,.62);color:#e6e8ea;padding:0 10px 0 30px;',
    '  transition:width .25s ease;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:inherit;}',
    '#pt-nav .pt-search input:focus{width:210px;border-color:rgba(110,231,183,.55);}',
    '#pt-nav .pt-search input::placeholder{color:rgba(210,214,220,.55);}',
    '#pt-nav .pt-search .pt-search-ico{position:absolute;left:9px;top:50%;transform:translateY(-50%);',
    '  width:14px;height:14px;color:rgba(210,214,220,.7);pointer-events:none;}',
    '#pt-results{position:absolute;top:calc(100% + 10px);right:0;width:360px;max-height:420px;overflow:auto;',
    '  border-radius:14px;border:1px solid rgba(130,140,150,.32);background:rgba(20,23,28,.92);',
    '  -webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 24px 60px -18px rgba(0,0,0,.5);',
    '  padding:8px;display:none;z-index:2147483000;color:#e6e8ea;}',
    '#pt-results.pt-open{display:block;}',
    '#pt-results .pt-scope{display:flex;gap:4px;padding:2px 4px 8px;}',
    '#pt-results .pt-scope button{flex:1;padding:5px 0;border-radius:8px;font-size:11.5px;font-weight:700;',
    '  border:1px solid rgba(130,140,150,.3);background:transparent;color:rgba(214,217,222,.8);cursor:pointer;}',
    '#pt-results .pt-scope button.pt-on{background:rgba(110,231,183,.16);border-color:rgba(110,231,183,.45);color:#6ee7b7;}',
    '#pt-results .pt-item{display:block;width:100%;text-align:left;padding:8px 10px;border-radius:10px;',
    '  border:0;background:transparent;color:#e6e8ea;cursor:pointer;text-decoration:none;}',
    '#pt-results .pt-item:hover,#pt-results .pt-item.pt-hot{background:rgba(255,255,255,.07);}',
    '#pt-results .pt-item .pt-t{font-size:13px;font-weight:700;line-height:1.35;}',
    '#pt-results .pt-item .pt-m{font-size:11px;opacity:.6;margin-top:2px;}',
    '#pt-results .pt-group{font-size:10px;font-weight:800;letter-spacing:.18em;opacity:.45;',
    '  text-transform:uppercase;padding:8px 10px 4px;}',
    '#pt-results .pt-empty{padding:18px 10px;text-align:center;font-size:12px;opacity:.6;}',

    /* 统一的“返回列表”按钮 */
    '.pt-back{display:inline-flex !important;align-items:center;gap:7px !important;',
    '  padding:7px 14px !important;border-radius:11px !important;border:1px solid rgba(130,140,150,.35) !important;',
    '  background:rgba(22,25,30,.62) !important;color:#e6e8ea !important;font-weight:800 !important;',
    '  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:transform .15s ease,background .2s ease;}',
    '.pt-back:hover{background:rgba(38,42,48,.74) !important;transform:translateY(-1px);}',
    '.pt-back:active{transform:scale(.95);}',
    '.pt-back .pt-back-ico{display:inline-flex;width:14px;height:14px;}',
    '.pt-back .pt-back-ico svg{width:14px;height:14px;}',

    /* 化学侧边栏图钉按钮 */
    '#pt-chem-pin{position:fixed;left:14px;bottom:14px;z-index:2147483000;width:40px;height:40px;',
    '  border-radius:999px;border:1px solid rgba(130,140,150,.35);background:rgba(22,25,30,.7);color:#e6e8ea;',
    '  display:none;align-items:center;justify-content:center;cursor:pointer;',
    '  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,.3);',
    '  transition:transform .15s ease;}',
    '#pt-chem-pin:hover{transform:scale(1.07);}',
    '#pt-chem-pin.pt-pinned{background:rgba(110,231,183,.2);border-color:rgba(110,231,183,.5);color:#6ee7b7;}',
    '#pt-chem-pin svg{width:18px;height:18px;}',

    /* 化学导航 SVG 图标 */
    'nav .pt-chem-ico{display:inline-flex;width:18px;height:18px;flex:none;}',
    'nav .pt-chem-ico svg{width:18px;height:18px;}'
  ].join('\n');

  var SVG = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>',
    about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>'
  };

  /* ============================ 化学导航图标（emoji → SVG） ============================ */

  var CHEM_ICONS = {
    '元素周期表': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
    '晶体与晶胞': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>',
    '有机结构': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/></svg>',
    '杂化轨道': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m6.5 6.5 3.5 3.5M17.5 6.5 14 10M6.5 17.5 10 14M17.5 17.5 14 14"/></svg>',
    '无机图谱': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>',
    '动态原理': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    '分析检验': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6.2L4.4 16.5A2 2 0 0 0 6.2 19.5h11.6a2 2 0 0 0 1.8-3L15 8.2V2"/><path d="M8 2h8M7 14h10"/></svg>',
    '化学计算': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></svg>',
    '安全演示': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>'
  };

  function chemIconize() {
    if (!IS_CHEM) return;
    var nav = chemNav();
    if (!nav) return;
    var btns = nav.querySelectorAll('button[title]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var title = b.getAttribute('title') || '';
      var icon = CHEM_ICONS[title];
      if (!icon || b.dataset.ptIcon) continue;
      b.dataset.ptIcon = '1';
      /* 移除 emoji 字符，插入 SVG 图标 */
      var walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, null);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (var j = 0; j < nodes.length; j++) {
        var t = nodes[j];
        if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u.test(t.nodeValue)) {
          t.nodeValue = t.nodeValue.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '');
        }
      }
      var span = document.createElement('span');
      span.className = 'pt-chem-ico';
      span.innerHTML = icon;
      b.insertBefore(span, b.firstChild);
    }
  }

  /* ============================ 主题 ============================ */

  function applyTheme() {
    document.documentElement.classList.toggle('shg-light', mode === 'light');
    var btn = document.getElementById('pt-theme-btn');
    if (btn) {
      btn.innerHTML = mode === 'light' ? SVG.sun : SVG.moon;
      btn.title = mode === 'light' ? '切换到深色主题' : '切换到浅色主题';
    }
    propagateIframes();
  }

  function toggleTheme() {
    mode = mode === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    applyTheme();
  }

  /* 同源 iframe（自包含模拟器）传播主题 */
  var IFRAME_CSS = null;
  function iframeCss() {
    if (IFRAME_CSS) return IFRAME_CSS;
    IFRAME_CSS = CSS.split('/* ====')[0] &&
      ['html.shg-light{background:#f4f5f7;}',
       'html.shg-light body{filter:invert(1) hue-rotate(180deg);background:#f4f5f7 !important;}',
       'html.shg-light body :is(img,video,canvas){filter:invert(1) hue-rotate(180deg);}',
       'html.shg-light body [style*="url("]{background-image:none !important;}'].join('\n');
    return IFRAME_CSS;
  }

  function propagateIframes() {
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      try {
        var doc = frames[i].contentDocument;
        if (!doc || !doc.documentElement) continue;
        if (!doc.getElementById('pt-iframe-theme')) {
          var st = doc.createElement('style');
          st.id = 'pt-iframe-theme';
          st.textContent = iframeCss();
          (doc.head || doc.documentElement).appendChild(st);
        }
        doc.documentElement.classList.toggle('shg-light', mode === 'light');
      } catch (e) { /* 跨域忽略 */ }
    }
  }

  /* ============================ 搜索 ============================ */

  var searchIndex = null;
  var scope = 'site'; // site=全站 subject=本学科
  var SUBJECT_NAMES = { biology: '生物', math: '数学', geography: '地理', chinese: '语文', chemistry: '化学' };

  function loadIndex(cb) {
    if (searchIndex) return cb();
    fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (d) {
      searchIndex = d.items || [];
      cb();
    }).catch(function () { searchIndex = []; cb(); });
  }

  function doSearch(q) {
    q = String(q || '').trim().toLowerCase();
    if (!q || !searchIndex) return [];
    var out = [];
    for (var i = 0; i < searchIndex.length && out.length < 40; i++) {
      var it = searchIndex[i];
      if (scope === 'subject' && it.s !== SUBJECT) continue;
      var t = (it.t || '').toLowerCase();
      var hay = (it.h || '').toLowerCase();
      var score = 0;
      if (t === q) score = 10;
      else if (t.indexOf(q) === 0) score = 8;
      else if (t.indexOf(q) > -1) score = 6;
      else if (hay.indexOf(q) > -1) score = 3;
      if (score) { it._score = score + (it.s === SUBJECT ? 1 : 0); out.push(it); }
    }
    out.sort(function (a, b) { return b._score - a._score; });
    return out.slice(0, 14);
  }

  function renderResults(box, q) {
    var res = doSearch(q);
    var html = '';
    html += '<div class="pt-scope">' +
      '<button data-scope="subject" class="' + (scope === 'subject' ? 'pt-on' : '') + '">本学科</button>' +
      '<button data-scope="site" class="' + (scope === 'site' ? 'pt-on' : '') + '">全站</button></div>';
    if (!q.trim()) {
      html += '<div class="pt-empty">输入关键词，检索全部学科的模块与知识点</div>';
    } else if (!res.length) {
      html += '<div class="pt-empty">没有找到与「' + escHtml(q) + '」匹配的内容</div>';
    } else {
      var lastSubject = '';
      for (var i = 0; i < res.length; i++) {
        var it = res[i];
        if (it.s !== lastSubject) {
          lastSubject = it.s;
          html += '<div class="pt-group">' + (SUBJECT_NAMES[it.s] || it.s) + '</div>';
        }
        html += '<a class="pt-item" href="' + it.u + '">' +
          '<div class="pt-t">' + escHtml(it.t) + '</div>' +
          '<div class="pt-m">' + escHtml(it.m || '') + '</div></a>';
      }
    }
    box.innerHTML = html;
    var btns = box.querySelectorAll('.pt-scope button');
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener('click', function (e) {
        scope = e.currentTarget.getAttribute('data-scope');
        var input = document.getElementById('pt-search-input');
        renderResults(box, input ? input.value : '');
      });
    }
    var items = box.querySelectorAll('.pt-item');
    for (var k = 0; k < items.length; k++) {
      items[k].addEventListener('mousedown', function () { box.classList.remove('pt-open'); });
    }
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ============================ 工具栏 ============================ */

  function buildToolbar() {
    var nav = document.createElement('div');
    nav.id = 'pt-nav';

    /* 搜索 */
    var search = document.createElement('div');
    search.className = 'pt-search';
    search.innerHTML = '<span class="pt-search-ico">' + SVG.search + '</span>';
    var input = document.createElement('input');
    input.id = 'pt-search-input';
    input.type = 'text';
    input.placeholder = '搜索全站资源';
    input.autocomplete = 'off';
    search.appendChild(input);
    var results = document.createElement('div');
    results.id = 'pt-results';
    search.appendChild(results);
    nav.appendChild(search);

    input.addEventListener('focus', function () {
      loadIndex(function () {
        results.classList.add('pt-open');
        renderResults(results, input.value);
      });
    });
    input.addEventListener('input', function () {
      loadIndex(function () { renderResults(results, input.value); });
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { results.classList.remove('pt-open'); input.blur(); }
      if (e.key === 'Enter') {
        var first = results.querySelector('.pt-item');
        if (first) { location.href = first.getAttribute('href'); }
      }
    });
    document.addEventListener('click', function (e) {
      if (!search.contains(e.target)) results.classList.remove('pt-open');
    });

    /* 关于作者 */
    var about = document.createElement('a');
    about.className = 'pt-btn pt-lbl';
    about.href = 'https://yuanbenxin.github.io/myblog/';
    about.target = '_blank';
    about.rel = 'noopener';
    about.title = '关于作者';
    about.innerHTML = SVG.about + '<span>关于作者</span>';
    nav.appendChild(about);

    /* 重要声明 */
    var decl = document.createElement('a');
    decl.className = 'pt-btn pt-lbl';
    decl.href = '/disclaimer.html';
    decl.target = '_blank';
    decl.rel = 'noopener';
    decl.title = '重要声明';
    decl.innerHTML = SVG.doc + '<span>重要声明</span>';
    nav.appendChild(decl);

    /* 友情链接 */
    var friends = document.createElement('a');
    friends.className = 'pt-btn pt-lbl';
    friends.href = '/friends.html';
    friends.target = '_blank';
    friends.rel = 'noopener';
    friends.title = '友情链接';
    friends.innerHTML = SVG.link + '<span>友情链接</span>';
    nav.appendChild(friends);

    /* 主题 */
    var theme = document.createElement('button');
    theme.type = 'button';
    theme.className = 'pt-btn';
    theme.id = 'pt-theme-btn';
    theme.dataset.ptBound = '1';
    theme.addEventListener('click', toggleTheme);
    nav.appendChild(theme);

    return nav;
  }

  var mountFails = 0;
  var floatPermanent = false; // React 页反复清掉 header 内的工具栏时，永久改用浮动定位
  function mountToolbar() {
    var existing = document.getElementById('pt-nav');
    var nav = existing || buildToolbar();
    var header = document.querySelector('header');
    var host = header && header.lastElementChild;
    if (!floatPermanent && host && host.tagName !== 'SCRIPT' && host.tagName !== 'STYLE') {
      if (nav.parentNode !== host) host.appendChild(nav);
      nav.classList.remove('pt-floating');
    } else if (!nav.isConnected) {
      nav.classList.add('pt-floating');
      document.documentElement.appendChild(nav);
    }
    applyTheme();
  }

  /* 品牌（PowerTech 在线教学演示）点击回到主页（全站通用） */
  function initBrandHome() {
    var header = document.querySelector('header');
    if (!header || header._ptBrandHome) return;
    header._ptBrandHome = true;
    header.addEventListener('click', function (e) {
      var n = e.target;
      while (n && n !== header) {
        if (n.textContent && n.textContent.replace(/\s+/g, '').indexOf('PowerTech在线教学演示') > -1) {
          e.preventDefault();
          location.href = '/';
          return;
        }
        n = n.parentElement;
      }
    });
  }

  /* 3D 遮罩看门狗：模型已加载但遮罩/poster 未隐藏时强制隐藏 */
  function posterWatchdog() {
    var viewers = document.querySelectorAll('model-viewer');
    for (var i = 0; i < viewers.length; i++) {
      var v = viewers[i];
      if (!v.loaded) continue;
      var parent = v.parentElement;
      if (parent) {
        var ov = parent.querySelector(':scope > .bio-model-download-progress:not(.is-complete)');
        if (ov) ov.classList.add('is-complete');
      }
      var posters = v.querySelectorAll('[slot="poster"]');
      for (var j = 0; j < posters.length; j++) {
        if (posters[j].style.display !== 'none') posters[j].style.display = 'none';
      }
    }
  }

  /* ============================ 返回按钮统一 ============================ */

  function unifyBackButtons() {
    var btns = document.querySelectorAll('header button, .pt-back-scan button');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.dataset.ptBack) continue;
      if (b.textContent.trim() === '返回列表') {
        b.dataset.ptBack = '1';
        b.classList.add('pt-back');
        b.insertAdjacentHTML('afterbegin', '<span class="pt-back-ico">' + SVG.back + '</span>');
      }
    }
  }

  /* ============================ 化学侧边栏 ============================ */

  function chemNav() { return IS_CHEM ? document.querySelector('nav') : null; }
  function chemExpanded() {
    var n = chemNav();
    return !!n && n.getBoundingClientRect().width > 120;
  }
  function chemToggleRaw() {
    var b = document.querySelector('[title="展开侧边栏"],[title="收起侧边栏"],[aria-label="展开"],[aria-label="收起"]');
    if (b) b.click();
  }
  var chemPinned = false;
  try { chemPinned = localStorage.getItem(PIN_KEY) === '1'; } catch (e) {}

  function installChem() {
    if (!IS_CHEM) return;
    var pin = document.createElement('button');
    pin.type = 'button';
    pin.id = 'pt-chem-pin';
    pin.title = chemPinned ? '取消固定侧边栏' : '固定侧边栏（保持展开）';
    pin.innerHTML = SVG.pin;
    pin.classList.toggle('pt-pinned', chemPinned);
    pin.addEventListener('click', function () {
      chemPinned = !chemPinned;
      try { localStorage.setItem(PIN_KEY, chemPinned ? '1' : '0'); } catch (e) {}
      pin.classList.toggle('pt-pinned', chemPinned);
      pin.title = chemPinned ? '取消固定侧边栏' : '固定侧边栏（保持展开）';
      if (chemPinned && !chemExpanded()) chemToggleRaw();
      if (!chemPinned && chemExpanded()) chemToggleRaw();
    });
    document.documentElement.appendChild(pin);
    requestAnimationFrame(function () { pin.style.display = 'flex'; });
  }

  function bindChemHover() {
    if (!IS_CHEM) return;
    var n = chemNav();
    if (!n || n.dataset.ptHover) return;
    n.dataset.ptHover = '1';
    n.addEventListener('mouseenter', function () {
      if (!chemExpanded()) chemToggleRaw();
    });
    n.addEventListener('mouseleave', function () {
      if (chemExpanded() && !chemPinned) chemToggleRaw();
    });
  }

  /* ============================ 安装 ============================ */

  function install() {
    var style = document.createElement('style');
    style.id = 'pt-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    /* 主题按钮事件委托兜底：工具栏被 React/页面重建后，新按钮若未绑事件，
       点击时在此补绑并触发，避免"刚刷新有效、过一会失效" */
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('#pt-theme-btn') : null;
      if (!t || t.dataset.ptBound === '1') return;
      t.dataset.ptBound = '1';
      t.addEventListener('click', toggleTheme);
      toggleTheme();
    });

    mountToolbar();
    installChem();
    applyTheme();
    unifyBackButtons();

    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        var nav = document.getElementById('pt-nav');
        if (!nav || !nav.isConnected) {
          mountFails++;
          /* React 页的 header 每次重渲染都会清掉我们挂进去的工具栏：
             连续丢失多次后永久改用浮动定位（挂 documentElement，React 不会动它），
             避免"刚刷新能点、过一会没反应" */
          if (mountFails >= 6) floatPermanent = true;
        }
        mountToolbar();
        unifyBackButtons();
        bindChemHover();
        chemIconize();
        posterWatchdog();
        propagateIframes();
      });
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener('hashchange', propagateIframes);

    /* 静态页面/空闲期兜底：轮询保证按钮统一与遮罩回收（后台标签页 rAF
       暂停时应用侧回调可能迟到，这里长期低频兜底） */
    window.setInterval(function () {
      unifyBackButtons();
      initBrandHome();
      posterWatchdog();
      propagateIframes();
    }, 1000);
  }

  applyTheme();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();

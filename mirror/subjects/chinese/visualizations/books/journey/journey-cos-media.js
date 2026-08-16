(() => {
  'use strict';

  const localPrefix = '../../../../assets/media/journey/';
  const cosPrefix = 'https://wulikeshihua-1339740714.cos.ap-beijing.myqcloud.com/%E8%AF%AD%E6%96%87/assets/media/journey/';

  const rewrite = value => typeof value === 'string' ? value.split(localPrefix).join(cosPrefix) : value;
  const rewriteElement = element => {
    for (const attribute of ['src', 'poster', 'style']) {
      const value = element.getAttribute?.(attribute);
      const nextValue = rewrite(value);
      if (nextValue !== value) element.setAttribute(attribute, nextValue);
    }
  };
  const rewriteTree = root => {
    if (root.nodeType === Node.ELEMENT_NODE) rewriteElement(root);
    root.querySelectorAll?.('[src], [poster], [style]').forEach(rewriteElement);
    root.querySelectorAll?.('style').forEach(style => {
      style.textContent = rewrite(style.textContent);
    });
  };

  rewriteTree(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') rewriteElement(record.target);
      for (const node of record.addedNodes) rewriteTree(node);
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['src', 'poster', 'style'],
    childList: true,
    subtree: true
  });
})();

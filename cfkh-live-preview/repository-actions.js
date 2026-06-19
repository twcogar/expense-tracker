(() => {
  const $ = (selector) => document.querySelector(selector);
  function clickWhenReady(selector, fallback) {
    const attempt = () => {
      const target = document.querySelector(selector);
      if (target) target.click();
      else if (fallback) fallback();
    };
    window.setTimeout(attempt, 260);
  }
  document.querySelectorAll('[data-intake]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.intake;
      clickWhenReady(`[data-new="${type}"]`, () => $('#pc')?.click() || $('#previewCreate')?.click() || $('#adminBtn')?.click());
    });
  });
  document.querySelectorAll('[data-view-review]').forEach((button) => {
    button.addEventListener('click', () => $('#reviewBtn')?.click());
  });
  document.querySelectorAll('[data-repo-search]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $('#q');
      if (!input) return;
      input.value = button.dataset.repoSearch;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      document.querySelector('.catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
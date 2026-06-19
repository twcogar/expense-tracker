(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const REVIEW_KEY_CANDIDATES = ['cfkh.preview.v6', 'cfkh.preview.records.v5', 'cfkh.preview.records.v4', 'cfkh.preview.records.v3', 'cfkh.preview.records.v2', 'cfkh.preview.records.v1'];

  function previewReviewCount() {
    return REVIEW_KEY_CANDIDATES.reduce((count, key) => {
      try {
        const rows = JSON.parse(localStorage.getItem(key) || '[]');
        return count + rows.filter((row) => row && ['In Review', 'Needs Review'].includes(row.status)).length;
      } catch (_) {
        return count;
      }
    }, 0);
  }

  function updateAlertBadge() {
    const badge = $('#alertBadge');
    const alertsButton = $('.hotspots .h-alerts');
    if (!badge || !alertsButton) return;
    const count = 2 + previewReviewCount();
    const noun = count === 1 ? 'review item' : 'review items';
    badge.textContent = String(count);
    badge.hidden = count < 1;
    badge.setAttribute('aria-label', `${count} ${noun}`);
    alertsButton.setAttribute('aria-label', `Alerts — ${count} ${noun}`);
    const reviewCount = $('#reviewCount');
    if (reviewCount) reviewCount.textContent = String(count);
  }

  function activate(button) {
    $$('.hotspots button').forEach((node) => {
      const current = node === button;
      node.classList.toggle('is-active', current);
      node.setAttribute('aria-pressed', current ? 'true' : 'false');
    });
  }

  function clickSelector(selector) {
    const target = $(selector);
    if (target) target.click();
  }

  function focusFilters() {
    const panel = $('#filterPanel');
    if (!panel) return;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel.classList.add('filter-focus');
    window.setTimeout(() => panel.classList.remove('filter-focus'), 1500);
    window.setTimeout(() => $('#type')?.focus(), 320);
  }

  function mapAction(button) {
    const action = button.dataset.map;
    activate(button);
    switch (action) {
      case 'sop':
        clickSelector('.tab[data-tab="SOP"]');
        break;
      case 'gov':
        clickSelector('.tab[data-tab="Governance Standard"]');
        break;
      case 'search': {
        const input = $('#q');
        input?.focus();
        input?.select?.();
        break;
      }
      case 'filters':
        focusFilters();
        break;
      case 'settings':
        clickSelector('#adminBtn');
        break;
      case 'alerts':
        clickSelector('#reviewBtn');
        break;
      default:
        break;
    }
  }

  function init() {
    $$('.hotspots button').forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.onclick = (event) => {
        event.preventDefault();
        mapAction(button);
      };
      button.addEventListener('pointerenter', () => button.classList.add('is-hovering'));
      button.addEventListener('pointerleave', () => button.classList.remove('is-hovering'));
    });
    updateAlertBadge();
    window.setInterval(updateAlertBadge, 500);
    window.addEventListener('storage', updateAlertBadge);
    document.addEventListener('click', () => window.setTimeout(updateAlertBadge, 30));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
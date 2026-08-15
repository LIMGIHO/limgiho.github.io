function initJourney(root) {
  const items = [...root.querySelectorAll('[data-journey-item]')];
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-current'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry) => {
        items.forEach((item) => item.classList.remove('is-current'));
        entry.target.classList.add('is-current');
      });
  }, { threshold: 0.45 });

  items.forEach((item) => observer.observe(item));
}

function initDecisionCards(root) {
  const cards = [...root.querySelectorAll('[data-decision-id]')];
  const printState = new Map();

  cards.forEach((card) => {
    const button = card.querySelector('.decision-toggle');
    const detail = card.querySelector('.decision-detail');
    if (!button || !detail) return;

    if (!card.classList.contains('is-featured')) {
      button.setAttribute('aria-expanded', 'false');
      button.textContent = '판단 과정 보기';
      detail.hidden = true;
    }

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      button.textContent = expanded ? '판단 과정 보기' : '판단 과정 접기';
      detail.hidden = expanded;
    });
  });

  window.addEventListener('beforeprint', () => {
    cards.forEach((card) => {
      const button = card.querySelector('.decision-toggle');
      const detail = card.querySelector('.decision-detail');
      if (!button || !detail) return;
      printState.set(detail, detail.hidden);
      detail.hidden = false;
      button.setAttribute('aria-expanded', 'true');
    });
  });

  window.addEventListener('afterprint', () => {
    cards.forEach((card) => {
      const button = card.querySelector('.decision-toggle');
      const detail = card.querySelector('.decision-detail');
      if (!button || !detail || !printState.has(detail)) return;
      detail.hidden = printState.get(detail);
      button.setAttribute('aria-expanded', String(!detail.hidden));
      button.textContent = detail.hidden ? '판단 과정 보기' : '판단 과정 접기';
    });
    printState.clear();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initJourney(document);
  initDecisionCards(document);
});

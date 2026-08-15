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

document.addEventListener('DOMContentLoaded', () => initJourney(document));

// Native anchors remain usable without JavaScript. Only the current location is enhanced.
document.addEventListener('DOMContentLoaded', () => {
  const implementation = document.querySelector('.architecture-disclosure');
  if (implementation) {
    document.querySelectorAll('[data-architecture-node], [data-architecture-mobile-node]').forEach((node) => {
      node.addEventListener('click', () => { implementation.open = true; });
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') implementation.open = true;
      });
    });
  }
  const links = [...document.querySelectorAll('[data-case-toc]')];
  const sections = links.map((link) => document.getElementById(link.hash.slice(1)));
  let scheduled = false;

  function updateLocation() {
    let current = 0;
    const offset = window.innerWidth <= 820 ? 145 : 120;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= offset) current = index;
    });
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }

  const menu = document.querySelector('.case-mobile-menu');
  const smallScreen = window.matchMedia('(max-width: 820px)');
  function updateMenu() {
    if (menu) menu.open = !smallScreen.matches;
    updateLocation();
  }
  links.forEach((link) => link.addEventListener('click', () => {
    if (smallScreen.matches && menu) menu.open = false;
  }));
  smallScreen.addEventListener('change', updateMenu);
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateLocation);
    }
  }, { passive: true });
  window.addEventListener('resize', updateLocation);
  updateMenu();
});

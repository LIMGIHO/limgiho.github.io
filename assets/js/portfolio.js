function initJourney(root) {
  const items = [...root.querySelectorAll('[data-journey-item]')];
  if (!items.length) return;

  // 최신 항목(kwe-platform)만 활성화
  const currentItem = root.querySelector('#journey-kwe-platform');
  if (currentItem) {
    currentItem.classList.add('is-current');
  }
}

function initArchitecture(root) {
  const dataElement = root.querySelector('#architecture-data');
  const triggers = [...root.querySelectorAll(
    '[data-architecture-node], [data-architecture-mobile-node]'
  )];
  const edges = [...root.querySelectorAll('[data-architecture-edge]')];
  const detailFields = [...root.querySelectorAll('[data-architecture-detail]')];
  if (!dataElement || !triggers.length || !detailFields.length) return;

  let nodes;
  try {
    nodes = JSON.parse(dataElement.textContent);
  } catch (_error) {
    return;
  }
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  function selectNode(nodeId) {
    const node = nodesById.get(nodeId);
    if (!node) return;

    triggers.forEach((trigger) => {
      const triggerId = trigger.dataset.architectureNode
        || trigger.dataset.architectureMobileNode;
      const selected = triggerId === nodeId;
      trigger.classList.toggle('is-selected', selected);
      trigger.setAttribute('aria-pressed', String(selected));
    });

    edges.forEach((edge) => {
      const related = edge.dataset.edgeFrom === nodeId || edge.dataset.edgeTo === nodeId;
      edge.classList.toggle('is-related', related);
    });

    detailFields.forEach((field) => {
      const key = field.dataset.architectureDetail;
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        field.textContent = Array.isArray(node[key]) ? node[key].join(' · ') : node[key];
      }
    });
  }

  triggers.forEach((trigger) => {
    const selectTrigger = () => {
      selectNode(
        trigger.dataset.architectureNode || trigger.dataset.architectureMobileNode
      );
    };
    trigger.addEventListener('click', selectTrigger);
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectTrigger();
      }
    });
  });

  selectNode(nodes[0]?.id);
}

function initThemeToggle(root) {
  const toggle = root.querySelector('[data-theme-toggle]');
  const body = root.body;
  if (!toggle || !body) return;

  const THEMES = ['blueprint', 'editorial'];
  const STORAGE_KEY = 'portfolio-theme';
  const label = toggle.querySelector('[data-theme-toggle-label]');

  function currentTheme() {
    return THEMES.find((theme) => body.classList.contains(`theme-${theme}`)) || THEMES[0];
  }

  function applyTheme(theme) {
    THEMES.forEach((name) => body.classList.toggle(`theme-${name}`, name === theme));
    toggle.setAttribute('aria-pressed', String(theme === 'editorial'));
    if (label) {
      label.textContent = theme === 'blueprint' ? '라이트 모드' : '다크 모드';
    }
  }

  let stored = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch (_error) {
    stored = null;
  }
  applyTheme(THEMES.includes(stored) ? stored : currentTheme());

  toggle.addEventListener('click', () => {
    const next = currentTheme() === 'blueprint' ? 'editorial' : 'blueprint';
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_error) {
      // localStorage를 쓸 수 없어도(사생활 보호 모드 등) 토글 자체는 계속 동작한다
    }
  });
}

function initNav(root) {
  const nav = root.querySelector('[data-portfolio-nav]');
  if (!nav) return;

  const progressFill = nav.querySelector('[data-nav-progress-fill]');
  if (progressFill) {
    const updateProgress = () => {
      const doc = root.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressFill.style.transform = `scaleX(${ratio})`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  const links = [...nav.querySelectorAll('[data-nav-link]')];
  const sections = links
    .map((link) => root.getElementById(link.dataset.navLink))
    .filter(Boolean);
  if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          links.forEach((link) => {
            link.classList.toggle('is-active', link.dataset.navLink === entry.target.id);
          });
        });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  sections.forEach((section) => observer.observe(section));
}

document.addEventListener('DOMContentLoaded', () => {
  initJourney(document);
  initArchitecture(document);
  initThemeToggle(document);
  initNav(document);
});

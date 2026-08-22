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
  const detailRows = [...root.querySelectorAll('[data-architecture-detail-row]')];
  const structureField = root.querySelector('[data-architecture-detail="structure"]');
  const rationaleBlock = root.querySelector('[data-architecture-rationale]');
  const writeupBlock = root.querySelector('[data-architecture-writeup]');
  const writeupLink = root.querySelector('[data-architecture-writeup-link]');
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

    detailRows.forEach((row) => {
      const key = row.dataset.architectureDetailRow;
      const value = node[key];
      const hasValue = Object.prototype.hasOwnProperty.call(node, key) && value;
      row.hidden = !hasValue;
    });

    detailFields.forEach((field) => {
      const key = field.dataset.architectureDetail;
      const value = node[key];
      const hasValue = Object.prototype.hasOwnProperty.call(node, key) && value;
      // 노드에 이 키가 없으면 이전 노드의 값이 남지 않도록 반드시 비운다.
      field.textContent = hasValue
        ? (Array.isArray(value) ? value.join(' · ') : value)
        : '';
    });

    if (structureField) {
      structureField.classList.toggle(
        'architecture-detail-tree',
        node.structure_type === 'tree'
      );
    }

    if (rationaleBlock) {
      rationaleBlock.hidden = !node.rationale;
    }

    if (writeupBlock && writeupLink) {
      const writeup = node.writeup;
      writeupBlock.hidden = !writeup;
      if (writeup) {
        writeupLink.href = writeup.url;
        writeupLink.textContent = writeup.label;
      }
    }
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

function initReveal(root) {
  const targets = [...root.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  // 기본 상태는 이미 보이는 상태다. 여기서부터만 reveal-pending을 붙여
  // 잠깐 숨겼다가 뷰포트에 들어오는 순간 되돌린다. 한 번 나타난 요소는
  // 다시 숨기지 않는다(unobserve).
  // rootMargin을 아래로 넉넉히 확장해 요소가 실제로 화면에 보이기
  // 전에 미리 나타나게 한다 — 특히 다이어그램이 여러 개 들어있는 긴
  // 섹션(예: 통합 업무 플랫폼)이 스크롤 전까지 텅 비어 보이던 문제를
  // 해결한다.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0, rootMargin: '0px 0px 400px 0px' }
  );

  targets.forEach((target) => {
    target.classList.add('reveal-pending');
    observer.observe(target);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initJourney(document);
  initArchitecture(document);
  initThemeToggle(document);
  initNav(document);
  initReveal(document);
});

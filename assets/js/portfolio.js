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

document.addEventListener('DOMContentLoaded', () => {
  initJourney(document);
  initArchitecture(document);
});

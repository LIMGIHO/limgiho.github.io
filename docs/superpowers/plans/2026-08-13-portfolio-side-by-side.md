# Before/After 좌우 비대칭 배치 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 토글로 감춰져 있던 BEFORE를 AFTER 옆에 상시 노출해, 클릭 없이 첫 화면에서 통합의 대비가 읽히게 만든다.

**Architecture:** 하나의 레이어드 SVG를 두 개의 독립 SVG로 분리한다. BEFORE는 좁은 세로형 viewBox(560×660)의 비대화형 그림, AFTER는 기존 1000×620 대화형 다이어그램. 토글 UI와 모드 상태는 전부 제거하고, "왜 통합인가" 카드는 패널의 기본값이 된다. 패널은 우측 컬럼에서 두 다이어그램 아래 전체 폭으로 내려온다.

**Tech Stack:** 순수 HTML/CSS/JS, 인라인 SVG, Python 3 검증 스크립트

**Spec:** `docs/superpowers/specs/2026-08-13-system-architecture-portfolio-design.md`
**선행 계획:** `docs/superpowers/plans/2026-08-13-system-architecture-portfolio.md` (Task 1–7 완료)

---

## 제거되는 것

| 대상 | 이유 |
|---|---|
| `.toggle` CSS, 토글 버튼 마크업, 버튼 리스너 | 배치가 토글을 대체한다 |
| `mode`, `setMode()`, `setLayerHidden()` | 감출 레이어가 없다 |
| `.hidden-layer`, `.legacy-layer` 관련 전환 CSS | 위와 동일 |
| `findSelection()`의 `type === 'toggle'` 분기 | 기본 상태로 대체된다 |
| `.panel-empty` 안내문 | 초기 상태가 c1 카드로 채워진다 |

카드 10장·노드 10개·엣지 8개·레거시 15종은 그대로다. 검증 스크립트도 그대로 통과해야 한다.

---

## Task 1: BEFORE 다이어그램을 독립 SVG로 분리

**Files:**
- Modify: `assets/portfolio/architecture.html`

- [ ] **Step 1: `renderDiagram()`에서 BEFORE 레이어 블록을 통째로 들어낸다**

`renderDiagram()` 안에서 `svg.appendChild(defs);` 다음에 오는 주석 `// BEFORE 레이어: 레거시 15개 + 얽힌 연결선 + 문제 라벨` 부터 `svg.appendChild(legacyLayer);` 까지를 삭제한다. 삭제 후 `svg.appendChild(defs);` 바로 다음 줄은 `// 같은 노드에서 같은 쪽으로 나가는 엣지는 통로를 어긋나게 한다.` 주석이 되어야 한다.

- [ ] **Step 2: BEFORE 전용 렌더러를 추가한다**

`renderDiagram()` 함수 정의가 끝나는 `}` 바로 다음에 삽입한다:

```js
const BEFORE_VIEW = { w: 560, h: 660 };

/** 통합 이전 구조. 라벨을 읽히게 하는 것이 목적이 아니라 "엉켜 있다"를 보여주는 것이
 *  목적이므로, 좁은 폭에 빽빽하게 채우고 클릭 대상은 두지 않는다. */
function renderBeforeDiagram() {
  const svg = svgEl('svg', {
    id: 'before-diagram',
    viewBox: `0 0 ${BEFORE_VIEW.w} ${BEFORE_VIEW.h}`,
    role: 'img',
    'aria-label':
      '통합 이전 구조. 15종의 시스템이 데이터베이스와 외부 시스템에 각자 직접 연결돼 있다.',
  });

  const boxW = 152;
  const boxH = 40;
  const sinks = [
    { x: 90, y: 470, name: 'Oracle' },
    { x: 225, y: 470, name: 'UNI-PASS' },
    { x: 360, y: 470, name: '거래처 EDI' },
    { x: 495, y: 470, name: 'FTP' },
  ];

  const wires = svgEl('g', { class: 'legacy-wires' });
  const boxes = svgEl('g');

  MODEL.legacy.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cx = 100 + col * 180;
    const cy = 60 + row * 70;
    for (const sink of sinks) {
      wires.appendChild(svgEl('path', {
        d: `M ${cx} ${cy + boxH / 2} C ${cx} ${cy + 120}, ${sink.x} ${sink.y - 120}, ${sink.x} ${sink.y - 20}`,
      }));
    }
    const box = svgEl('g', { class: 'legacy' });
    box.appendChild(svgEl('rect', { x: cx - boxW / 2, y: cy - boxH / 2, width: boxW, height: boxH }));
    const label = svgEl('text', { x: cx, y: cy - 2, 'text-anchor': 'middle' });
    label.textContent = item.label;
    box.appendChild(label);
    const tech = svgEl('text', { class: 'tech', x: cx, y: cy + 12, 'text-anchor': 'middle' });
    tech.textContent = item.tech;
    box.appendChild(tech);
    boxes.appendChild(box);
  });

  svg.appendChild(wires);
  svg.appendChild(boxes);

  for (const sink of sinks) {
    const group = svgEl('g', { class: 'legacy' });
    group.appendChild(svgEl('rect', { x: sink.x - 60, y: sink.y - 20, width: 120, height: 40 }));
    const label = svgEl('text', { x: sink.x, y: sink.y + 5, 'text-anchor': 'middle' });
    label.textContent = sink.name;
    group.appendChild(label);
    svg.appendChild(group);
  }

  ['동일 로직 중복 구현', '장애 원인 추적 불가', '신규 연동 시 15곳 수정'].forEach((note, index) => {
    const text = svgEl('text', { class: 'before-note', x: 24, y: 545 + index * 26 });
    text.textContent = `⚠ ${note}`;
    svg.appendChild(text);
  });

  return svg;
}
```

- [ ] **Step 3: 좌표가 viewBox 안에 들어가는지 확인한다**

Run: `node --check` 로 문법만 확인한 뒤, 브라우저에서 실제 `getBBox()` 로 검사한다. 기대값:
- 레거시 박스 15개: x는 24~536, y는 40~360 범위 (viewBox 560×660 안)
- sink 4개: x는 30~555, y는 450~490
- 문제 라벨 3개: y는 545, 571, 597

범위를 벗어나면 보고한다. 좌표를 임의로 고치지 않는다.

- [ ] **Step 4: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "feat: BEFORE 다이어그램을 독립 SVG로 분리"
```

---

## Task 2: 토글 제거와 좌우 배치

**Files:**
- Modify: `assets/portfolio/architecture.html`

- [ ] **Step 1: 죽은 CSS를 지우고 배치 CSS로 교체한다**

아래 규칙들을 **삭제**한다:

```css
.layout { display: grid; grid-template-columns: 1fr 380px; min-height: 100vh; }
.toggle { display: inline-flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
.toggle button {
  border: 0; background: transparent; color: var(--muted);
  padding: 6px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: inherit;
}
.toggle button[aria-pressed="true"] { background: var(--accent); color: #fff; }
.legacy, .legacy-wires { transition: opacity .4s ease; }
/* 실제로 opacity 가 바뀌는 것은 부모 레이어다 — 전환은 여기 걸려 있어야 한다. */
.legacy-layer, .nodes, .edges { transition: opacity .4s ease; }
.hidden-layer { opacity: 0; pointer-events: none; }
```

그리고 기존 `#panel` 규칙을 **삭제**한다:

```css
#panel {
  border-left: 1px solid var(--border);
  background: var(--surface);
  padding: 22px 20px;
  overflow-y: auto;
  max-height: 100vh;
}
```

`.stage`, `.stage-head`, `svg#diagram` 규칙도 삭제한다:

```css
.stage { padding: 20px 24px; min-width: 0; }
.stage-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 8px; }
.stage-head h1 { font-size: 20px; margin: 0; letter-spacing: -0.01em; }
.stage-head p { margin: 0; color: var(--muted); font-size: 14px; }
svg#diagram { width: 100%; height: auto; display: block; }
```

삭제한 자리(원래 `.layout` 이 있던 위치, `body` 규칙 바로 다음)에 아래를 넣는다:

```css
.layout { display: flex; flex-direction: column; min-height: 100vh; }
.page-head { padding: 20px 24px 12px; }
.page-head h1 { font-size: 20px; margin: 0 0 2px; letter-spacing: -0.01em; }
.page-head p { margin: 0; color: var(--muted); font-size: 14px; }

/* 반반이 아니라 35:65 — BEFORE 는 읽히는 게 아니라 엉킨 게 보이면 된다. */
.boards { display: grid; grid-template-columns: minmax(0, 35fr) minmax(0, 65fr); gap: 24px; padding: 0 24px 20px; align-items: start; }
.board { min-width: 0; }
.board-label { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 8px; color: var(--muted); }
.board-before .board-label { color: var(--warn); }
.board svg { width: 100%; height: auto; display: block; }
```

- [ ] **Step 2: 패널 CSS를 하단 전체 폭용으로 교체한다**

`.panel-empty` 규칙을 삭제하고, 그 자리에 새 `#panel` 규칙을 넣는다:

```css
#panel {
  border-top: 1px solid var(--border);
  background: var(--surface);
  padding: 20px 24px 40px;
}
.panel-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; align-items: start; }
```

- [ ] **Step 3: 모드 상태와 토글 함수를 제거한다**

아래 두 블록을 **통째로 삭제**한다:

```js
let mode = 'after';

/** 레이어를 숨길 때는 투명도만이 아니라 포커스·접근성 트리에서도 빼야 한다. */
function setLayerHidden(layer, hidden) {
  layer.classList.toggle('hidden-layer', hidden);
  layer.setAttribute('aria-hidden', String(hidden));
  for (const el of layer.querySelectorAll('[tabindex]')) {
    el.setAttribute('tabindex', hidden ? '-1' : '0');
  }
}

function setMode(next) {
  mode = next;
  const svg = document.getElementById('diagram');
  setLayerHidden(svg.querySelector('.legacy-layer'), mode !== 'before');
  for (const layer of [svg.querySelector('.nodes'), svg.querySelector('.edges')]) {
    setLayerHidden(layer, mode !== 'after');
  }
  for (const button of document.querySelectorAll('.toggle button')) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  }
  if (mode === 'before') {
    selected = { type: 'toggle', id: 'toggle' };
  } else {
    selected = null;
  }
  for (const el of document.querySelectorAll('.node, .edge')) el.classList.remove('is-selected');
  renderPanel();
}
```

`let selected = null;` 은 남긴다.

- [ ] **Step 4: 기본 패널 상태를 "왜 통합인가" 카드로 만든다**

`findSelection()` 의 앞부분, 즉

```js
function findSelection() {
  if (!selected) return null;
  if (selected.type === 'toggle') {
    return {
      title: '통합 이전 — 15종 파편화',
      kicker: 'C# · VB6 · Oracle Forms · 구 React · Excel 매크로 · ASP',
      role: '각 시스템이 DB와 외부 시스템에 직접 연결돼 있었다. 같은 업무 로직이 여러 벌 존재했다.',
      structure: null,
      cards: MODEL.toggleCards,
    };
  }
```

를 포함해 `findSelection` 함수 **전체**를 아래로 교체한다. 기존의 `return node && {...}` /
`return edge && {...}` 는 `undefined` 를 반환할 수 있는데, `renderPanel` 의 널 가드가
`.panel-empty` 와 함께 사라지므로 함수 쪽을 전역(total)으로 만든다.

```js
/** 아무것도 선택하지 않은 상태가 곧 "왜 통합인가" 카드다.
 *  BEFORE 는 클릭 대상이 아니므로 이 카드는 기본값이어야 한다. */
function introView() {
  return {
    title: '통합 이전 — 15종 파편화',
    kicker: 'C# · VB6 · Oracle Forms · 구 React · Excel 매크로 · ASP',
    role: '각 시스템이 DB와 외부 시스템에 직접 연결돼 있었다. 같은 업무 로직이 여러 벌 존재했다. 오른쪽 다이어그램의 노드나 화살표를 클릭하면 그 지점의 설계 판단이 열린다.',
    structure: null,
    cards: MODEL.toggleCards,
  };
}

/** 항상 뷰를 돌려준다 — 못 찾으면 기본 뷰로 떨어진다. renderPanel 이 널 검사를 하지 않아도 되게. */
function findSelection() {
  if (!selected) return introView();

  if (selected.type === 'node') {
    const node = nodeById(selected.id);
    if (node) {
      return {
        title: node.label, kicker: node.sub, role: node.role,
        structure: node.structure, cards: node.cards,
      };
    }
  } else {
    const edge = MODEL.edges.find(item => item.id === selected.id);
    if (edge) {
      return {
        title: `${nodeById(edge.from).label} → ${nodeById(edge.to).label}`,
        kicker: edge.label, role: '', structure: null, cards: edge.cards,
      };
    }
  }

  return introView();
}
```

아울러 `renderPanel()` 안의 `if (!view) { … class="panel-empty" … }` 가드를 삭제한다.
`.panel-empty` 는 CSS에서도 제거되므로 남겨두면 죽은 코드가 된다.

- [ ] **Step 5: 카드를 2단으로 흐르게 감싼다**

`renderPanel()` 안의 cards 계산식을 교체한다. 기존:

```js
  const cards = view.cards.length
    ? `<p class="panel-section-label">설계 결정</p>${view.cards.map(cardHtml).join('')}`
    : '';
```

교체:

```js
  const cards = view.cards.length
    ? `<p class="panel-section-label">설계 결정</p>
       <div class="panel-cards">${view.cards.map(cardHtml).join('')}</div>`
    : '';
```

- [ ] **Step 6: `mount()` 를 새 구조로 바꾼다**

`mount()` 전체를 아래로 교체한다:

```js
function mount() {
  const app = document.getElementById('app');
  app.className = 'layout';

  const head = document.createElement('header');
  head.className = 'page-head';
  head.innerHTML = `
    <h1>${MODEL.meta.project}</h1>
    <p>${MODEL.meta.tagline}</p>`;
  app.appendChild(head);

  const boards = document.createElement('section');
  boards.className = 'boards';

  const before = document.createElement('div');
  before.className = 'board board-before';
  before.innerHTML = `<h2 class="board-label">Before — 파편화된 15종</h2>`;
  before.appendChild(renderBeforeDiagram());
  boards.appendChild(before);

  const after = document.createElement('div');
  after.className = 'board board-after';
  after.innerHTML = `<h2 class="board-label">After — 통합 플랫폼 (클릭 가능)</h2>`;
  const scroller = document.createElement('div');
  scroller.className = 'diagram-scroll';
  scroller.appendChild(renderDiagram());
  after.appendChild(scroller);
  boards.appendChild(after);

  app.appendChild(boards);

  const panel = document.createElement('aside');
  panel.id = 'panel';
  panel.setAttribute('aria-live', 'polite');
  panel.setAttribute('aria-label', '선택한 지점의 상세');
  app.appendChild(panel);

  renderPanel();
}
```

- [ ] **Step 7: 반응형 규칙을 새 구조에 맞춘다**

기존 `@media (max-width: 900px)` 블록 전체를 아래로 교체한다:

```css
@media (max-width: 900px) {
  .boards { grid-template-columns: 1fr; gap: 20px; padding: 0 16px 16px; }
  .page-head { padding: 16px 16px 10px; }
  .page-head h1 { font-size: 18px; }
  #panel { padding: 18px 16px 32px; }
  /* AFTER 만 가로 스크롤을 갖는다. BEFORE 는 좁은 폭에 맞게 줄어들면 그만이다. */
  .board-after .diagram-scroll { overflow-x: auto; }
  .board-after svg#diagram { min-width: 720px; }
}
```

- [ ] **Step 8: 검증**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `PASS: 익명화·모델 완전성 검사 통과`

Run: 비 JSON `<script>` 블록을 추출해 `node --check`
Expected: 문법 오류 없음

Run: `grep -nE "setMode|setLayerHidden|hidden-layer|panel-empty|stage-head|'toggle'" assets/portfolio/architecture.html`
Expected: 출력 없음 — 죽은 코드가 남지 않았다는 뜻

- [ ] **Step 9: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "feat: Before/After 좌우 비대칭 배치로 전환하고 토글 제거"
```

---

## Task 3: 실제 확인

**Files:** 없음 (검증 작업)

- [ ] **Step 1: 넓은 화면에서 확인한다 (1440px)**

브라우저에서 확인하고 관찰한 것을 보고한다:
- BEFORE와 AFTER가 좌우로 나란히 보이고, 스크롤 없이 둘 다 첫 화면에 들어오는가
- 패널이 두 다이어그램 아래에 있고, 초기 상태에 "왜 통합인가" 카드가 이미 열려 있는가
- AFTER의 노드 10개와 화살표 1개가 여전히 클릭되고, 패널이 교체되는가
- BEFORE 안에는 클릭·포커스 대상이 하나도 없는가 (`document.querySelectorAll('#before-diagram [tabindex]').length` 가 0)
- 콘솔 오류가 없는가

- [ ] **Step 2: 좁은 화면에서 확인한다 (390px)**

iframe 등으로 실제 390px 뷰포트를 만들어 측정하고 보고한다:
- `document.documentElement.scrollWidth` 가 뷰포트 폭을 넘지 않는가
- BEFORE와 AFTER가 세로로 쌓이는가
- AFTER만 가로 스크롤되고 BEFORE는 폭에 맞춰 줄어드는가

- [ ] **Step 3: 다크 모드 확인**

`data-theme="dark"` 를 걸고, BEFORE의 주황 점선 박스·연결선·경고 라벨과 AFTER의 노드·화살표가 모두 읽히는지 확인해 보고한다.

- [ ] **Step 4: 키보드 확인**

Tab 순서를 처음부터 끝까지 훑어 보고한다. 기대: AFTER의 노드 10개와 카드를 가진 화살표 1개만 포커스를 받고, BEFORE 요소는 하나도 받지 않는다.

---

## Self-Review

**스펙 커버리지**

| 스펙 항목 | 태스크 |
|---|---|
| 좌우 35:65 비대칭 배치 | Task 2 Step 1 |
| BEFORE 비대화형 | Task 1 Step 2 (tabindex·리스너 없음), Task 3 Step 1 |
| AFTER만 클릭 대상 | Task 2 Step 3 (토글 제거), 기존 Task 4 렌더러 유지 |
| 패널 하단 전체 폭 | Task 2 Step 2, Step 6 |
| 초기 상태 = c1 카드 | Task 2 Step 4 |
| 카드 2단 흐름 | Task 2 Step 5 |
| 900px 이하 세로 스택 | Task 2 Step 7, Task 3 Step 2 |
| 죽은 코드 제거 | Task 2 Step 8 grep |

**타입 일관성**: 카드 필드(`title/problem/alternative/choice/result`), 노드 필드, 엣지 필드는 데이터 모델을 건드리지 않으므로 그대로다. 새로 도입된 이름은 `BEFORE_VIEW`, `renderBeforeDiagram`, `.boards`, `.board`, `.board-label`, `.page-head`, `.panel-cards` 뿐이고 전 태스크에서 동일하게 쓰인다.

**자리표시자**: 레거시 15종은 여전히 사용자 확정 대기 상태이며 이 계획의 범위 밖이다.

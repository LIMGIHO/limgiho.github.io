# Implementation-Focused Architecture Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 경력기술서 반복 문장을 제거하고, 통합 업무 플랫폼의 책임·경계·계약·실행·배포 구조를 한 화면에서 설명하는 상세 아키텍처를 구현한다.

**Architecture:** `_data/portfolio.yml`을 10개 컴포넌트와 명시적인 연결 계약의 canonical model로 바꾸고 Liquid가 데스크톱 SVG와 모바일 카드를 함께 렌더링한다. JavaScript는 선택한 노드의 구현·구조·운영·입출력·배포 정보를 하나의 상세 패널에 표시하며, 비활성화되어도 모든 노드의 한 줄 책임은 남는다.

**Tech Stack:** Jekyll, Liquid, YAML, inline SVG, SCSS, vanilla JavaScript, Python `unittest`, Playwright CLI

## Global Constraints

- 실제 시스템명, 고객사명, 내부 URL, 주소는 표시하지 않는다.
- 아키텍처는 Presentation, Application, Async execution, Integration & data, Delivery 경계를 구분한다.
- 동기 요청, 비동기 작업, 점진 이관, 배포의 네 흐름을 서로 다른 선 스타일로 구분한다.
- 모든 연결선은 실제 호출 방식이나 계약명을 가진다.
- Web과 API는 핵심 애플리케이션으로 강조한다.
- Legacy API는 병행 운영·모듈 단위 이관 중인 상태를 점선으로 표시한다.
- 데스크톱 SVG와 모바일 세로 카드가 같은 10개 노드 데이터를 사용한다.
- 기본 Ice Blue와 카카오 Graphite Yellow 구조는 같고 강조색만 다르다.
- 장식 목적의 애니메이션과 PDF 생성은 하지 않는다.
- 사용자 승인 없이 원격 저장소에 push하지 않는다.

---

### Task 1: 상세 아키텍처 데이터 계약

**Files:**
- Modify: `_data/portfolio.yml`
- Modify: `_data/portfolio_profiles.yml`
- Modify: `scripts/verify-portfolio.py`
- Test: `tests/test_verify_portfolio.py`

**Interfaces:**
- Produces: `flagship.nodes: Array<Node>`, `flagship.edges: Array<Edge>`, `flagship.pipeline.steps: Array<String>`
- `Node`: `id`, `label`, `tech`, `kind`, `boundary`, `summary`, `implementation`, `structure`, `operation`, `inputs`, `outputs`, `contract`, `deployment`, `x`, `y`, `width`, `height`
- `Edge`: `id`, `from`, `to`, `flow`, `label`, `path`, `label_x`, `label_y`
- Node ids: `web`, `api`, `legacy-api`, `queue`, `worker`, `batch`, `external`, `local-llm`, `data`, `cicd`

- [ ] **Step 1: 실패하는 소스 계약 테스트 작성**

```python
def test_architecture_requires_ten_implementation_nodes_and_named_edges(self):
    content = self.verify.load_yaml(ROOT / "_data" / "portfolio.yml")
    flagship = content["flagship"]
    self.assertEqual(
        {node["id"] for node in flagship["nodes"]},
        self.verify.REQUIRED_ARCHITECTURE_NODE_IDS,
    )
    self.assertTrue(all(edge["label"] for edge in flagship["edges"]))
    self.assertEqual(
        {edge["flow"] for edge in flagship["edges"]},
        {"sync", "async", "migration", "delivery"},
    )
```

`validate_source`의 유효 노드에는 다음 필드를 모두 요구하는 테스트도 추가한다.

```python
required = {
    "id", "label", "tech", "kind", "boundary", "summary",
    "implementation", "structure", "operation", "inputs", "outputs",
    "contract", "deployment", "x", "y", "width", "height",
}
self.assertFalse(required - set(node))
```

- [ ] **Step 2: RED 확인**

Run: `python3 -m unittest tests.test_verify_portfolio.PortfolioSourceContractTests -v`

Expected: `REQUIRED_ARCHITECTURE_NODE_IDS`가 없고 기존 `flagship.decisions` 모델만 있어 FAIL.

- [ ] **Step 3: canonical data를 10개 노드로 교체**

`flagship`의 문제·제약·역할·성과·evidence·architecture·decisions를 제거하고 다음 구조를 작성한다.

```yaml
flagship:
  id: integrated-platform
  title: 통합 업무 플랫폼 개발
  period: 2023–현재
  scope_summary:
    - 15종 운영 시스템 분석과 기능 이관
    - 90여 개 업무 화면 개발
    - 5개 업무 도메인 구성
    - 8종 외부 시스템 연동
    - API·Queue·Worker·Batch 분리 운영
    - 변경 앱 기반 CI/CD 구성
  nodes:
    - id: web
      label: Web
      tech: Next.js · TypeScript
      kind: app
      boundary: Presentation
      summary: 90여 개 업무 화면과 화면·도메인 슬라이스
      implementation: 업무 화면, 공통 UI, 인증 상태와 API 클라이언트를 구현했습니다.
      structure: app 라우트 아래 화면 로컬 슬라이스를 두고 화면을 넘어 공유되는 기능만 도메인 슬라이스로 분리했습니다.
      operation: 사용자의 동기 요청이 REST 계약을 통해 API로 전달됩니다.
      inputs: 사용자 입력 · 인증 상태
      outputs: REST 요청 · 파일 다운로드
      contract: REST · typed client
      deployment: 독립 Web 이미지
      x: 500
      y: 70
      width: 270
      height: 76
```

나머지 노드는 명세의 10개 노드 내용을 같은 필드로 작성한다. `edges`에는 아래 연결을 정확히 넣는다.

```yaml
edges:
  - { id: web-api, from: web, to: api, flow: sync, label: REST }
  - { id: api-data, from: api, to: data, flow: sync, label: repository }
  - { id: api-external, from: api, to: external, flow: sync, label: port / adapter }
  - { id: api-llm, from: api, to: local-llm, flow: sync, label: internal HTTP }
  - { id: legacy-api, from: legacy-api, to: api, flow: migration, label: module migration }
  - { id: api-queue, from: api, to: queue, flow: async, label: enqueue contract }
  - { id: queue-worker, from: queue, to: worker, flow: async, label: consume contract }
  - { id: worker-batch, from: worker, to: batch, flow: async, label: job execution }
  - { id: worker-external, from: worker, to: external, flow: async, label: port / adapter }
  - { id: cicd-runtime, from: cicd, to: web, flow: delivery, label: SHA image deploy }
```

각 edge에는 렌더용 `path`, `label_x`, `label_y`도 입력한다. `pipeline.steps`는 `변경 감지`, `Test`, `Kaniko Build`, `Swarm Deploy`다.

`portfolio_profiles.yml`에서 더 이상 사용하는 `featured_decisions`를 제거한다.

- [ ] **Step 4: 검증기 구현과 GREEN 확인**

`scripts/verify-portfolio.py`에 다음 상수를 추가하고 `validate_source`가 노드 필드, edge의 양 끝 노드, 네 flow, 비어 있지 않은 label을 검사하게 한다.

```python
REQUIRED_ARCHITECTURE_NODE_IDS = {
    "web", "api", "legacy-api", "queue", "worker", "batch",
    "external", "local-llm", "data", "cicd",
}
REQUIRED_ARCHITECTURE_FLOWS = {"sync", "async", "migration", "delivery"}
```

Run: `python3 -m unittest tests.test_verify_portfolio.PortfolioSourceContractTests -v && python3 scripts/verify-portfolio.py --source-only`

Expected: source contract PASS.

- [ ] **Step 5: 커밋**

```bash
git add _data/portfolio.yml _data/portfolio_profiles.yml scripts/verify-portfolio.py tests/test_verify_portfolio.py
git commit -m "refactor: model implementation architecture"
```

### Task 2: 시스템 맵과 구현 범위 렌더링

**Files:**
- Modify: `_includes/portfolio/flagship.html`
- Modify: `_includes/portfolio/architecture.html`
- Delete: `_includes/portfolio/decision-card.html`
- Modify: `scripts/verify-portfolio.py`
- Test: `tests/test_verify_portfolio.py`

**Interfaces:**
- Consumes: Task 1의 `flagship.nodes`, `flagship.edges`, `flagship.pipeline.steps`
- Produces: `[data-architecture-node]`, `[data-architecture-mobile-node]`, `[data-architecture-edge]`, `#architecture-detail`, `#architecture-data`

- [ ] **Step 1: 새 렌더 계약을 실패 테스트로 작성**

기존 decision/Before-After 테스트를 다음 계약으로 교체한다.

```python
def test_rendered_architecture_shows_components_boundaries_and_flows(self):
    for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
        text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
        self.assertIn("02 · 통합 업무 플랫폼 개발", text)
        self.assertEqual(text.count("data-architecture-node="), 10)
        self.assertEqual(text.count("data-architecture-mobile-node="), 10)
        self.assertEqual(text.count("data-architecture-edge="), 10)
        for phrase in (
            "Presentation", "Application", "Async execution",
            "Integration &amp; data", "Delivery", "REST", "repository",
            "enqueue contract", "consume contract", "module migration",
            "SHA image deploy",
        ):
            self.assertIn(phrase, text)
        for phrase in (
            "FLAGSHIP CASE", "OUTCOMES", "SUPPORTING EVIDENCE",
            "ENGINEERING DECISIONS", 'data-decision-id=',
        ):
            self.assertNotIn(phrase, text)
```

- [ ] **Step 2: RED 확인**

Run: `bundle exec jekyll build && python3 -m unittest tests.test_verify_portfolio.PortfolioRenderedContractTests -v`

Expected: 기존 Flagship Case, Before/After, decision 카드가 렌더되어 FAIL.

- [ ] **Step 3: Flagship을 구현 범위와 시스템 맵으로 교체**

`flagship.html`은 헤더, 6개 scope item, architecture include만 렌더한다.

```liquid
<p class="section-number">02 · 통합 업무 플랫폼 개발</p>
<h2 id="flagship-title">{{ include.flagship.title }}</h2>
<p>{{ include.flagship.period }} · 시스템 구성과 실행 흐름</p>
```

`architecture.html`은 다음 순서로 구성한다.

1. `.architecture-boundary-grid` 범례
2. `svg#implementation-architecture` 안의 boundary rect, edge path, node group
3. 같은 노드 데이터의 `.architecture-mobile-list`
4. 선택된 노드의 `#architecture-detail`
5. `#architecture-data` JSON

노드는 기본 정보가 항상 보이게 한다.

```liquid
<g class="architecture-node kind-{{ node.kind }}" data-architecture-node="{{ node.id }}"
   role="button" tabindex="0" aria-controls="architecture-detail">
  <rect x="{{ node.x }}" y="{{ node.y }}" width="{{ node.width }}" height="{{ node.height }}" rx="10"></rect>
  <text class="node-label" x="{{ node.x | plus: 16 }}" y="{{ node.y | plus: 25 }}">{{ node.label }}</text>
  <text class="node-tech" x="{{ node.x | plus: 16 }}" y="{{ node.y | plus: 45 }}">{{ node.tech }}</text>
  <text class="node-summary" x="{{ node.x | plus: 16 }}" y="{{ node.y | plus: 64 }}">{{ node.summary }}</text>
</g>
```

모바일 카드는 `data-architecture-mobile-node` 속성과 함께 `label`, `tech`, `summary`, `boundary`를 모두 표시한다. 상세 패널에는 `구현`, `구조`, `운영`, `입력`, `출력`, `계약`, `배포` 필드를 둔다.

- [ ] **Step 4: 렌더 검증기 갱신과 GREEN 확인**

`validate_rendered`에서 old decision count와 old architecture 문구 요구를 제거하고 새 10개 node, 10개 edge, 상세 패널, 6개 scope item, 범례와 네 flow를 검사한다.

Run: `bundle exec jekyll build && python3 -m unittest tests.test_verify_portfolio.PortfolioRenderedContractTests -v && python3 scripts/verify-portfolio.py --site-dir _site`

Expected: rendered contract PASS.

- [ ] **Step 5: 커밋**

```bash
git add _includes/portfolio/flagship.html _includes/portfolio/architecture.html scripts/verify-portfolio.py tests/test_verify_portfolio.py
git add -u _includes/portfolio/decision-card.html
git commit -m "feat: render detailed implementation architecture"
```

### Task 3: 노드 상세 상호작용과 반응형 시각화

**Files:**
- Modify: `assets/js/portfolio.js`
- Modify: `assets/css/portfolio.scss`
- Test: `tests/test_verify_portfolio.py`

**Interfaces:**
- Consumes: `#architecture-data` JSON, `[data-architecture-node]`, `[data-architecture-mobile-node]`
- Produces: `initArchitecture(root)`, 선택 클래스 `is-selected`, `aria-pressed`, 상세 패널 필드

- [ ] **Step 1: 실패하는 상호작용·스타일 계약 작성**

```python
def test_architecture_script_supports_pointer_keyboard_and_static_fallback(self):
    script = (ROOT / "assets/js/portfolio.js").read_text(encoding="utf-8")
    for phrase in (
        "initArchitecture", "architecture-data", "data-architecture-node",
        "data-architecture-mobile-node",
        "aria-pressed", "keydown", "Enter", "is-selected",
    ):
        self.assertIn(phrase, script)
    self.assertNotIn("initDecisionCards", script)

def test_architecture_css_distinguishes_boundaries_flows_and_mobile_fallback(self):
    css = (ROOT / "_site/assets/css/portfolio.css").read_text(encoding="utf-8")
    for phrase in (
        ".flow-sync", ".flow-async", ".flow-migration", ".flow-delivery",
        ".kind-app", ".kind-infra", ".kind-boundary", ".kind-legacy",
        ".architecture-mobile-list", "@media(max-width:760px)",
    ):
        self.assertIn(phrase, css.replace(" ", ""))
```

- [ ] **Step 2: RED 확인**

Run: `bundle exec jekyll build && python3 -m unittest tests.test_verify_portfolio.PortfolioRenderedContractTests.test_architecture_script_supports_pointer_keyboard_and_static_fallback tests.test_verify_portfolio.PortfolioRenderedContractTests.test_architecture_css_distinguishes_boundaries_flows_and_mobile_fallback -v`

Expected: `initArchitecture`와 새 flow/kind 스타일이 없어 FAIL.

- [ ] **Step 3: 최소 상호작용 구현**

`initDecisionCards`를 제거하고 `initArchitecture`를 구현한다.

```javascript
function initArchitecture(root) {
  const dataElement = root.querySelector('#architecture-data');
  const panel = root.querySelector('#architecture-detail');
  const triggers = [...root.querySelectorAll('[data-architecture-node], [data-architecture-mobile-node]')];
  if (!dataElement || !panel || !triggers.length) return;
  const nodes = JSON.parse(dataElement.textContent).nodes;

  function selectNode(id) {
    const node = nodes.find((item) => item.id === id);
    if (!node) return;
    triggers.forEach((trigger) => {
      const triggerId = trigger.dataset.architectureNode || trigger.dataset.architectureMobileNode;
      const selected = triggerId === id;
      trigger.classList.toggle('is-selected', selected);
      trigger.setAttribute('aria-pressed', String(selected));
    });
    panel.querySelector('[data-detail-title]').textContent = node.label;
    panel.querySelector('[data-detail-tech]').textContent = node.tech;
    for (const field of ["implementation", "structure", "operation", "inputs", "outputs", "contract", "deployment"]) {
      panel.querySelector(`[data-detail-${field}]`).textContent = node[field];
    }
  }

  triggers.forEach((trigger) => {
    const triggerId = trigger.dataset.architectureNode || trigger.dataset.architectureMobileNode;
    trigger.addEventListener('click', () => selectNode(triggerId));
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectNode(triggerId);
      }
    });
  });
  selectNode(nodes[0].id);
}
```

`DOMContentLoaded`에서 `initJourney(document)`와 `initArchitecture(document)`만 호출한다.

- [ ] **Step 4: 데스크톱·모바일 스타일 구현**

- boundary rect는 얇은 배경과 라벨로 책임 영역을 표시한다.
- `kind-app`, `kind-infra`, `kind-boundary`, `kind-legacy`, `kind-pipeline`을 선과 배경으로 구분한다.
- `flow-sync`는 실선, `flow-async`는 강조 실선, `flow-migration`은 점선, `flow-delivery`는 이중 또는 굵은 하단 레일로 구분한다.
- 760px 이하에서는 SVG를 숨기고 `.architecture-mobile-list`를 표시한다.
- detail panel은 7개 필드를 2열 정의 목록으로 표시하며 모바일에서는 1열로 바꾼다.
- `prefers-reduced-motion`에서는 선택 전환을 제거한다.

- [ ] **Step 5: 자동 검증과 브라우저 검증**

Run: `bundle exec jekyll build && python3 -m unittest tests/test_verify_portfolio.py -v && python3 scripts/verify-portfolio.py --site-dir _site && git diff --check`

Expected: 모든 테스트와 source/rendered contract PASS.

Run: `bundle exec jekyll serve --host 127.0.0.1 --port 4000`

Playwright로 기본·카카오 URL을 데스크톱 `1440×1000`, 모바일 `390×844`에서 확인한다.

```text
architecture nodes = 10
architecture edges = 10
selected detail changes after click and Enter
documentElement.scrollWidth <= innerWidth
console errors = 0
```

- [ ] **Step 6: 커밋**

```bash
git add assets/js/portfolio.js assets/css/portfolio.scss tests/test_verify_portfolio.py
git commit -m "style: clarify architecture flows and details"
```

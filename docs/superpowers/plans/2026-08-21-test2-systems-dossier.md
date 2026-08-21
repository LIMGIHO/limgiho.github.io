# Test2 Systems Dossier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the existing `/` portfolio and add an independently styled `/test2/` systems-dossier portfolio that leads with the `15 → 1` transformation artifact.

**Architecture:** A new Jekyll page selects a dedicated layout. The layout composes test2-only includes and reads the existing portfolio data without mutating it. A separate SCSS entrypoint imports test2-only partials; no existing portfolio stylesheet or JavaScript changes.

**Tech Stack:** Jekyll 3.9, Liquid, semantic HTML, SCSS, Python `unittest`, bundled Ruby/Jekyll build.

## Global Constraints

- Existing `/` source files and rendered appearance remain unchanged.
- All facts and metrics come from `_data/portfolio.yml` and `_data/portfolio_profiles.yml`.
- The new route is exactly `/test2/`.
- The emitted body must retain direction seed `9d7999ee`.
- No theme toggle, four-cell KPI strip, rounded-card system, or mobile horizontal diagram scrolling.
- JavaScript is not required for core content.
- Mobile touch targets are at least 44px and reduced-motion is respected.
- The user’s unrelated staged and unstaged changes are never added to a task commit.

---

### Task 1: Route and isolation contract

**Files:**
- Create: `tests/test_test2_portfolio.py`
- Create: `test2/index.md`
- Create: `_layouts/portfolio-test2.html`
- Create: `assets/css/portfolio-test2.scss`

**Interfaces:**
- Consumes: Jekyll front matter and `site.data.portfolio` / `site.data.portfolio_profiles`.
- Produces: `/test2/`, layout class `portfolio-test2`, stylesheet `/assets/css/portfolio-test2.css`, and production direction contract seed `9d7999ee`.

- [ ] **Step 1: Write the failing route and isolation tests**

```python
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class TestTest2Portfolio(unittest.TestCase):
    def test_test2_route_uses_dedicated_layout(self):
        source = (ROOT / "test2/index.md").read_text(encoding="utf-8")
        self.assertIn("layout: portfolio-test2", source)
        self.assertIn("permalink: /test2/", source)

    def test_layout_keeps_direction_contract_and_data_source(self):
        source = (ROOT / "_layouts/portfolio-test2.html").read_text(encoding="utf-8")
        self.assertIn("9d7999ee", source)
        self.assertIn("site.data.portfolio", source)
        self.assertIn("portfolio-test2.css", source)
        self.assertNotIn("theme-toggle", source)

    def test_existing_layout_does_not_reference_test2(self):
        source = (ROOT / "_layouts/portfolio.html").read_text(encoding="utf-8")
        self.assertNotIn("portfolio-test2", source)
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `python3 -m unittest tests/test_test2_portfolio.py -v`

Expected: errors for missing `test2/index.md` and `_layouts/portfolio-test2.html`.

- [ ] **Step 3: Add the minimal route, root layout, and stylesheet entrypoint**

`test2/index.md`:

```yaml
---
layout: portfolio-test2
portfolio_profile: default
permalink: /test2/
---
```

The root layout must assign `portfolio` and `profile`, include `portfolio/head.html`, add the six-block Impeccable direction contract as the first body child, render test2 includes, and link only `/assets/css/portfolio-test2.css`.

`assets/css/portfolio-test2.scss` must contain Jekyll front matter and imports for `portfolio-test2/tokens`, `foundation`, `masthead`, `hero`, `sections`, and `responsive`.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `python3 -m unittest tests/test_test2_portfolio.py -v`

Expected: all Task 1 tests pass.

- [ ] **Step 5: Commit only Task 1 paths**

```bash
git add -- tests/test_test2_portfolio.py test2/index.md _layouts/portfolio-test2.html assets/css/portfolio-test2.scss
git commit --only -m "feat: add isolated test2 portfolio route" -- tests/test_test2_portfolio.py test2/index.md _layouts/portfolio-test2.html assets/css/portfolio-test2.scss
```

### Task 2: First viewport and visual system

**Files:**
- Modify: `tests/test_test2_portfolio.py`
- Create: `_includes/portfolio-test2/masthead.html`
- Create: `_includes/portfolio-test2/hero.html`
- Create: `_sass/portfolio-test2/_tokens.scss`
- Create: `_sass/portfolio-test2/_foundation.scss`
- Create: `_sass/portfolio-test2/_masthead.scss`
- Create: `_sass/portfolio-test2/_hero.scss`

**Interfaces:**
- Consumes: `portfolio.person`, `portfolio.metrics`, `portfolio.flagship`, and `profile` from layout includes.
- Produces: compact masthead, one dominant case thesis, `test2-transform` semantic artifact, and diagram annotations.

- [ ] **Step 1: Add failing assertions for the first viewport**

```python
    def test_first_viewport_leads_with_the_transformation(self):
        hero = (ROOT / "_includes/portfolio-test2/hero.html").read_text(encoding="utf-8")
        self.assertIn("15개의 운영 시스템", hero)
        self.assertIn("test2-transform", hero)
        self.assertIn("1,000만+", hero)
        self.assertNotIn("hero-metrics", hero)

    def test_visual_system_rejects_rounded_card_tropes(self):
        sources = "\n".join(
            path.read_text(encoding="utf-8")
            for path in (ROOT / "_sass/portfolio-test2").glob("*.scss")
        )
        self.assertNotIn("border-radius", sources)
        self.assertNotIn("box-shadow", sources)
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `python3 -m unittest tests.test_test2_portfolio.TestTest2Portfolio.test_first_viewport_leads_with_the_transformation tests.test_test2_portfolio.TestTest2Portfolio.test_visual_system_rejects_rounded_card_tropes -v`

Expected: missing hero and SCSS directory failures.

- [ ] **Step 3: Build masthead and hero**

The masthead exposes only name, `사례`, `경력`, `제품`, and `이력서 PDF`. The hero renders:

```html
<section class="test2-hero" id="case-01" aria-labelledby="test2-title">
  <div class="test2-hero-copy">
    <p class="test2-case-index">CASE 01 / PLATFORM CONSOLIDATION</p>
    <h1 id="test2-title">15개의 운영 시스템을<br>하나의 플랫폼으로 전환했습니다.</h1>
    <p>{{ include.flagship.description }}</p>
  </div>
  <figure class="test2-transform" aria-labelledby="test2-transform-caption">
    <!-- fifteen before marks, one decision spine, and five after boundaries -->
    <figcaption id="test2-transform-caption">15종 운영 시스템을 하나의 플랫폼 경계로 전환한 구조</figcaption>
  </figure>
</section>
```

The artifact uses square CSS grid cells and text labels, not a horizontally scrolling SVG. The three proof annotations are `1,000만+ 데이터 이관`, `90+ 업무 화면`, and `변경 앱만 빌드·배포`.

- [ ] **Step 4: Implement the committed manifest visual system**

Define tokens for cool paper, ink, cobalt field, vermilion decision marks, and blue-gray rules. The first viewport uses an asymmetric grid and a large cobalt artifact field. Do not use gradients, shadows, glow, rounded containers, or decorative icon tiles.

- [ ] **Step 5: Run tests and build**

Run: `python3 -m unittest tests/test_test2_portfolio.py -v && bundle exec jekyll build`

Expected: tests pass and `_site/test2/index.html` is generated.

- [ ] **Step 6: Commit only Task 2 paths**

Stage and commit `tests/test_test2_portfolio.py`, the two test2 includes, and the four test2 SCSS partials with message `feat: build test2 transformation hero`.

### Task 3: Evidence chapters and progressive disclosure

**Files:**
- Modify: `tests/test_test2_portfolio.py`
- Create: `_includes/portfolio-test2/case-study.html`
- Create: `_includes/portfolio-test2/operations.html`
- Create: `_includes/portfolio-test2/career.html`
- Create: `_includes/portfolio-test2/products.html`
- Create: `_includes/portfolio-test2/footer.html`
- Create: `_sass/portfolio-test2/_sections.scss`

**Interfaces:**
- Consumes: `flagship.scope_summary`, `flagship.nodes`, `flagship.document_flow`, `flagship.delivery_flow`, `automation`, `journey`, and `additional_work`.
- Produces: four-part case narrative, native technical appendix, vertical operations evidence, career ledger, large product spreads, and final contact action.

- [ ] **Step 1: Add failing semantic structure tests**

```python
    def test_case_story_is_problem_decision_result_not_card_grid(self):
        layout = (ROOT / "_layouts/portfolio-test2.html").read_text(encoding="utf-8")
        for include in ("case-study", "operations", "career", "products", "footer"):
            self.assertIn(f"portfolio-test2/{include}.html", layout)
        case = (ROOT / "_includes/portfolio-test2/case-study.html").read_text(encoding="utf-8")
        for label in ("문제", "제약", "결정", "결과"):
            self.assertIn(label, case)
        self.assertIn("<details", case)

    def test_product_images_are_real_portfolio_assets(self):
        products = (ROOT / "_includes/portfolio-test2/products.html").read_text(encoding="utf-8")
        self.assertIn("assets/portfolio/screenshots", products)
        self.assertIn("loading=\"lazy\"", products)
```

- [ ] **Step 2: Run and verify RED**

Run: `python3 -m unittest tests/test_test2_portfolio.py -v`

Expected: missing include failures.

- [ ] **Step 3: Implement the case and operations evidence**

Use an ordered document layout rather than cards. Render problem, constraint, decision, and result as numbered rows. Show the five platform boundaries in a responsive CSS map. Put node-level implementation text inside native `<details>` elements. Convert document processing and deployment into vertical ordered steps that never require horizontal scrolling.

- [ ] **Step 4: Implement career, products, and footer**

Render career as a ruled ledger with period, company, title, and concise description. Render personal products as alternating full-width spreads where the two screenshots occupy the dominant column; technology strings are captions. End with email, GitHub, and PDF links.

- [ ] **Step 5: Run tests and build**

Run: `python3 -m unittest tests/test_test2_portfolio.py -v && bundle exec jekyll build`

Expected: tests pass and every `portfolio-test2/` include appears in `_site/test2/index.html`.

- [ ] **Step 6: Commit only Task 3 paths**

Commit the modified test, five new includes, and `_sections.scss` with message `feat: add test2 evidence chapters`.

### Task 4: Responsive contract and release verification

**Files:**
- Modify: `tests/test_test2_portfolio.py`
- Create: `_sass/portfolio-test2/_responsive.scss`
- Create after finish: `DESIGN.md`
- Create after screenshots: `.impeccable/review/test2-desktop.png`
- Create after screenshots: `.impeccable/review/test2-mobile.png`

**Interfaces:**
- Consumes: all test2 markup and SCSS.
- Produces: 1440px desktop and 390px mobile layouts with no page-level horizontal overflow, plus finish-review evidence and documented visual truth.

- [ ] **Step 1: Add failing responsive and build-output tests**

```python
    def test_mobile_contract_has_large_targets_without_horizontal_diagram_scroll(self):
        source = (ROOT / "_sass/portfolio-test2/_responsive.scss").read_text(encoding="utf-8")
        self.assertIn("@media (max-width: 760px)", source)
        self.assertIn("min-height: 44px", source)
        self.assertNotIn("overflow-x: auto", source)

    def test_build_contains_route_and_direction_seed(self):
        built = ROOT / "_site/test2/index.html"
        self.assertTrue(built.exists())
        self.assertIn("9d7999ee", built.read_text(encoding="utf-8"))
```

- [ ] **Step 2: Run the responsive test and verify RED**

Run: `python3 -m unittest tests.test_test2_portfolio.TestTest2Portfolio.test_mobile_contract_has_large_targets_without_horizontal_diagram_scroll -v`

Expected: missing `_responsive.scss` failure.

- [ ] **Step 3: Implement responsive re-composition**

At 760px and below, switch the masthead to a two-row wrap, stack hero copy above the transformation, make the fifteen before units a compact 5×3 grid, turn system boundaries and evidence rows into single-column sequences, preserve 44px targets, and keep images within `max-width: 100%`.

- [ ] **Step 4: Run automated verification**

Run in order:

```bash
python3 scripts/verify-portfolio.py --source-only
bundle exec jekyll build
python3 -m unittest tests/test_test2_portfolio.py -v
```

Expected: all commands pass.

- [ ] **Step 5: Inspect desktop and mobile in Browser**

Serve on `127.0.0.1:4000` or the next free localhost port. Capture valid top-of-document screenshots at 1440×1000 and 390×844 into `.impeccable/review/test2-desktop.png` and `.impeccable/review/test2-mobile.png`. Confirm `documentElement.scrollWidth == documentElement.clientWidth`, first-viewport artifact dominance, visible focus, and readable product spreads.

- [ ] **Step 6: Run Impeccable detector once**

Run: `node /private/tmp/impeccable-review.VvoYHk/.agents/skills/impeccable/scripts/detect.mjs --json test2 _layouts/portfolio-test2.html _includes/portfolio-test2 _sass/portfolio-test2 assets/css/portfolio-test2.scss`

Expected: review any direct test2 source findings; do not rerun after the fix batch.

- [ ] **Step 7: Obtain independent finish verdict and document the built world**

Send the original request, artifact path, screenshots, direction contract, detector results, and craft-floor path to the Impeccable finish reviewer. Apply one bounded fix batch if the disposition is `fix`, recapture, and request a verdict pass. After the final verdict, create or update `DESIGN.md` from the shipped test2 visual truth.

- [ ] **Step 8: Commit only test2 implementation and review documentation**

Commit the test2 route/layout/includes/SCSS/tests and `DESIGN.md`, excluding user-owned unrelated paths and ephemeral `.impeccable/review/*.png`, with message `feat: ship test2 systems dossier portfolio`.

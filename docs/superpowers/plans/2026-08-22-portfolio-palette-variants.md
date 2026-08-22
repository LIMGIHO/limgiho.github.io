# Portfolio Palette Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reuse the current portfolio for `/test1/`, `/test2/`, and `/test3/` with palette-only light/dark color variants while preserving `/` exactly and retiring the old `/test2/` redesign.

**Architecture:** The existing `_layouts/portfolio.html`, `portfolio/*` includes, data, and JavaScript remain the single shared implementation. Route front matter supplies an optional `portfolio_palette`; the shared layout appends a `palette-*` body class only for comparison routes. `_sass/portfolio/_tokens.scss` defines palette/mode combinations that override only custom properties, while the existing `theme-editorial`/`theme-blueprint` toggle remains the mode switch.

**Tech Stack:** Jekyll, Liquid, SCSS custom properties, vanilla JavaScript, Python `unittest`, Playwright CLI.

## Global Constraints

- Keep `/` markup, content, section order, typography, spacing, geometry, shadows, SVGs, responsive rules, animation, and interaction unchanged.
- Do not change `assets/js/portfolio.js`.
- Do not copy the portfolio includes for the comparison routes.
- Use the supplied light/dark palette values exactly; derive only the omitted dark `group-fill` as a subtle matching-accent alpha.
- Keep Industrial light `--accent: #e05a1f` for signal uses and use `--accent-text: #b94717` only for small text that otherwise fails WCAG AA.
- Delete the old `/test2/` layout, includes, SCSS, and CSS implementation.
- Do not modify unrelated user changes in the working tree.

---

### Task 1: Replace stale route tests with palette contracts

**Files:**
- Modify: `tests/test_test2_portfolio.py`

**Interfaces:**
- Produces tests that describe the three shared-layout routes and palette token contract used by later tasks.

- [ ] **Step 1: Replace old test2 redesign assertions with failing route tests**

Replace the file contents with tests that assert:

```python
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TestPortfolioPaletteVariants(unittest.TestCase):
    def test_comparison_routes_use_shared_layout_and_palette(self):
        expected = {
            "test1": ("precision", "/test1/"),
            "test2": ("product", "/test2/"),
            "test3": ("industrial", "/test3/"),
        }
        for route, (palette, permalink) in expected.items():
            source = (ROOT / route / "index.md").read_text(encoding="utf-8")
            self.assertIn("layout: portfolio", source)
            self.assertIn(f"portfolio_palette: {palette}", source)
            self.assertIn(f"permalink: {permalink}", source)

    def test_shared_layout_adds_palette_without_changing_root_contract(self):
        source = (ROOT / "_layouts/portfolio.html").read_text(encoding="utf-8")
        self.assertIn("page.portfolio_palette", source)
        self.assertIn("palette-{{ page.portfolio_palette }}", source)
        self.assertIn('class="portfolio theme-{{ profile.theme }}', source)

    def test_palette_tokens_define_light_and_dark_modes(self):
        source = (ROOT / "_sass/portfolio/_tokens.scss").read_text(encoding="utf-8")
        for palette in ("precision", "product", "industrial"):
            self.assertIn(f".palette-{palette}.theme-editorial", source)
            self.assertIn(f".palette-{palette}.theme-blueprint", source)

    def test_old_test2_implementation_is_retired(self):
        self.assertFalse((ROOT / "_layouts/portfolio-test2.html").exists())
        self.assertFalse((ROOT / "_includes/portfolio-test2").exists())
        self.assertFalse((ROOT / "_sass/portfolio-test2").exists())
        self.assertFalse((ROOT / "assets/css/portfolio-test2.scss").exists())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the focused tests and verify the expected RED state**

Run:

```bash
python3 -m unittest tests/test_test2_portfolio.py
```

Expected: failures because `test1/`, `test3/`, shared palette routing, new tokens, and legacy deletion are not implemented yet.

---

### Task 2: Add shared-layout comparison routes

**Files:**
- Modify: `_layouts/portfolio.html`
- Modify: `test2/index.md`
- Create: `test1/index.md`
- Create: `test3/index.md`

**Interfaces:**
- Consumes `page.portfolio_palette` from each route.
- Produces the same rendered portfolio document and `body` class `palette-{palette}` for comparison routes.

- [ ] **Step 1: Add an optional palette class to the existing body element**

Change only the body class expression to:

```liquid
<body class="portfolio theme-{{ profile.theme }}{% if page.portfolio_palette %} palette-{{ page.portfolio_palette }}{% endif %}">
```

Leave all includes, scripts, attributes, and order unchanged.

- [ ] **Step 2: Point all comparison route pages at the shared layout**

Use these exact front matters:

`test1/index.md`

```yaml
---
layout: portfolio
portfolio_profile: default
portfolio_palette: precision
permalink: /test1/
---
```

`test2/index.md`

```yaml
---
layout: portfolio
portfolio_profile: default
portfolio_palette: product
permalink: /test2/
---
```

`test3/index.md`

```yaml
---
layout: portfolio
portfolio_profile: default
portfolio_palette: industrial
permalink: /test3/
---
```

---

### Task 3: Add the three light/dark token palettes

**Files:**
- Modify: `_sass/portfolio/_tokens.scss`

**Interfaces:**
- Consumes existing `theme-editorial` and `theme-blueprint` classes.
- Produces only custom-property overrides for `palette-precision`, `palette-product`, and `palette-industrial`.

- [ ] **Step 1: Add exact palette selector blocks after the existing root theme blocks**

Add these values without changing the existing `.theme-blueprint`, `.theme-editorial`, or `body.theme-blueprint` rules:

```scss
.palette-precision.theme-editorial {
  --page: #f3f6fa;
  --paper: #ffffff;
  --surface: #eef3f8;
  --ink: #17202b;
  --muted: #5c6877;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --accent-soft: #dbeafe;
  --rule: #cdd6e1;
  --danger: #c9362b;
  --group-fill: rgba(37, 99, 235, 0.04);
  --diagram-tech: #334155;
}

.palette-precision.theme-blueprint {
  --page: #0b1220;
  --paper: #111827;
  --surface: #172033;
  --ink: #e6edf7;
  --muted: #9aa8bc;
  --accent: #60a5fa;
  --accent-strong: #93c5fd;
  --accent-soft: #172b4d;
  --rule: #2b3a50;
  --danger: #fb7185;
  --group-fill: rgba(96, 165, 250, 0.05);
  --diagram-tech: #c5d0e0;
}

.palette-product.theme-editorial {
  --page: #f5f7fa;
  --paper: #ffffff;
  --surface: #edf2f5;
  --ink: #14213d;
  --muted: #5d687a;
  --accent: #0f766e;
  --accent-strong: #115e59;
  --accent-soft: #ccfbf1;
  --rule: #d2dae3;
  --danger: #c2413b;
  --group-fill: rgba(15, 118, 110, 0.04);
  --diagram-tech: #36465d;
}

.palette-product.theme-blueprint {
  --page: #0a1220;
  --paper: #111b2d;
  --surface: #17253a;
  --ink: #e7edf6;
  --muted: #9aa7ba;
  --accent: #2dd4bf;
  --accent-strong: #5eead4;
  --accent-soft: #123c38;
  --rule: #2c3c53;
  --danger: #fb7185;
  --group-fill: rgba(45, 212, 191, 0.05);
  --diagram-tech: #c6d1df;
}

.palette-industrial.theme-editorial {
  --page: #eceff1;
  --paper: #fafbfc;
  --surface: #e2e7ea;
  --ink: #1c2329;
  --muted: #58636c;
  --accent: #e05a1f;
  --accent-strong: #b94717;
  --accent-text: #b94717;
  --accent-soft: #fce1d3;
  --rule: #bcc6cc;
  --danger: #b42318;
  --group-fill: rgba(56, 69, 78, 0.04);
  --diagram-tech: #38454e;
}

.palette-industrial.theme-blueprint {
  --page: #11161a;
  --paper: #181e23;
  --surface: #222a30;
  --ink: #edf1f3;
  --muted: #a4afb7;
  --accent: #ff7a33;
  --accent-strong: #ff9a62;
  --accent-soft: #3a261b;
  --rule: #3b464e;
  --danger: #ff5b5b;
  --group-fill: rgba(255, 122, 51, 0.05);
  --diagram-tech: #cbd3d8;
}
```

- [ ] **Step 2: Confirm the JavaScript remains untouched**

Change only text-color declarations that currently use `var(--accent)` to `var(--accent-text)` in `_sass/portfolio/_automation.scss`, `_sass/portfolio/_hero.scss`, `_sass/portfolio/_footer.scss`, `_sass/portfolio/_additional-work.scss`, `_sass/portfolio/_writings.scss`, and `_sass/portfolio/_architecture.scss`. Keep border, background, fill, and stroke uses on `var(--accent)` so signal geometry retains the supplied Industrial orange.

- [ ] **Step 3: Confirm the JavaScript remains untouched**

Run:

```bash
git diff -- assets/js/portfolio.js
```

Expected: no output from this task.

---

### Task 4: Remove the retired test2 implementation

**Files:**
- Delete: `_layouts/portfolio-test2.html`
- Delete: `_includes/portfolio-test2/` and its seven include files
- Delete: `_sass/portfolio-test2/` and its six SCSS files
- Delete: `assets/css/portfolio-test2.scss`

**Interfaces:**
- Leaves `/test2/` served by `_layouts/portfolio.html`; no shared portfolio include is duplicated.

- [ ] **Step 1: Delete only the explicitly retired files**

Remove the paths above. Do not delete `assets/css/portfolio.scss`, `_sass/portfolio/`, or any portfolio data/include.

- [ ] **Step 2: Verify no route references the retired implementation**

Run:

```bash
rg -n "portfolio-test2|test2-(masthead|hero|case|operations|products)" --glob '!docs/**' --glob '!_site/**' .
```

Expected: no output.

---

### Task 5: Run build, tests, and visual regression checks

**Files:**
- No source changes; generated `_site/` output is verification only.

- [ ] **Step 1: Run source contracts and tests**

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/verify-portfolio.py
git diff --check
```

Expected: all tests pass, `PASS: portfolio source contract`, `exit=0`, and no diff-check output.

- [ ] **Step 2: Build all four routes**

```bash
bundle exec jekyll build
test -f _site/index.html
test -f _site/test1/index.html
test -f _site/test2/index.html
test -f _site/test3/index.html
```

- [ ] **Step 3: Confirm root markup and route classes**

```bash
for route in index test1/index test2/index test3/index; do
  printf '%s: ' "$route"
  rg -o '<body class="[^"]+"' "_site/${route}.html" | head -1
done
```

Expected: root has only `portfolio theme-editorial` initially; comparison routes add exactly one `palette-*` class.

- [ ] **Step 4: Use Playwright at the requested viewports and modes**

Open each route at `1440×1000` and `390×844`, capture light and dark screenshots, and inspect the architecture, document-flow, and delivery-flow diagrams. Use the existing toggle to switch modes; confirm no horizontal overflow, text/line contrast remains readable, and all route content/sections match `/`.

- [ ] **Step 5: Report only the requested handoff**

Report the four implemented paths and palette names, changed files, root preservation result, build/test output, and any desktop/mobile color issues. Do not report unrelated pre-existing worktree changes as part of this feature.

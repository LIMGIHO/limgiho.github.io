# Portfolio Palette Variants Design

## Goal

Keep the current `/` portfolio's markup, content, layout, interaction, responsive behavior, and animation unchanged while exposing three color-only comparison routes:

- `/test1/` — Precision Blue
- `/test2/` — Product Navy & Teal
- `/test3/` — Industrial Steel

The existing `/test2/` redesign is retired rather than reused.

## Design

All four routes use `_layouts/portfolio.html` and the existing `portfolio/*` includes. The root page remains without a palette class, so its current `theme-editorial`/`theme-blueprint` rendering is unchanged. Comparison pages set `page.portfolio_palette`, and the shared layout conditionally adds `palette-precision`, `palette-product`, or `palette-industrial` to the existing body class.

The existing `portfolio.js` theme toggle remains unchanged. It continues to switch `theme-editorial` and `theme-blueprint`; palette selectors combine with those mode classes to override only CSS custom properties. The existing local-storage behavior and toggle interaction therefore apply to all comparison routes without route-specific JavaScript.

`_sass/portfolio/_tokens.scss` remains the only visual source for the new palettes. Each palette defines the supplied light and dark values for page, paper, surface, ink, muted, accent, accent-strong, accent-soft, rule, danger, diagram-tech, and group-fill. Dark `group-fill` values, which were not supplied, use the matching dark accent at a subtle 4–5% alpha so diagram boundary fills stay palette-specific without becoming a broad accent surface.

Industrial light keeps the requested `--accent: #e05a1f` for signal strokes, borders, and large metrics. Its small text links and tabular values use the semantic `--accent-text: #b94717` alias so those text/background pairs meet WCAG AA without changing the named palette token.

## Retired implementation

The old `/test2/` implementation is deleted:

- `_layouts/portfolio-test2.html`
- `_includes/portfolio-test2/`
- `_sass/portfolio-test2/`
- `assets/css/portfolio-test2.scss`

`test2/index.md` is rewritten to use the shared portfolio layout and Product Navy & Teal palette. No old test2 markup is copied into any comparison route.

## Constraints

- Do not change portfolio data, include markup, section order, typography, spacing, card geometry, shadows, SVG geometry, responsive rules, animation, or interaction.
- Do not change `assets/js/portfolio.js`.
- Do not change the root page's rendered palette.
- Keep the existing light/dark toggle on all routes.
- Keep accent limited to existing semantic uses and danger limited to failure/error flows.
- Verify light and dark contrast at desktop and mobile sizes.

## Verification

- Run the existing Python portfolio tests after updating stale test2 route expectations.
- Run `python3 scripts/verify-portfolio.py`.
- Run `bundle exec jekyll build`.
- Confirm `/`, `/test1/`, `/test2/`, and `/test3/` are generated.
- Compare root source and generated markup to ensure only palette class routing differs.
- Use a real browser at 1440×1000 and 390×844 to inspect light/dark variants, including architecture, document-flow, and delivery-flow diagrams.

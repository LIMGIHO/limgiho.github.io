# Publish Precision Portfolio Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish the selected Precision Blue `test1` portfolio at `/portfolio/` on GitHub Pages while leaving the existing `/` page unchanged.

**Architecture:** Keep the shared `portfolio` layout and data as the single implementation. Add a small `/portfolio/` page entry with the same `default` profile and `precision` palette as `/test1/`, so the comparison route remains available and the public route is an alias without duplicated markup. Simplify the Pages workflow to build the repository's existing `_config.yml` once, which includes both routes.

**Tech Stack:** Jekyll, Liquid, Sass, GitHub Actions Pages deployment, Python unittest.

## Global Constraints

- Preserve the root `/` page and its current markup, content, palette, and behavior.
- Do not duplicate portfolio includes or data; the public route must reuse `_layouts/portfolio.html`.
- Keep `/test1/` available as the Precision Blue comparison route.
- Build only the existing `_config.yml`; do not reference missing profile configs.
- Deploy the complete current worktree changes requested by the user, with no destructive reset.

---

### Task 1: Add the public portfolio route

**Files:**
- Create: `portfolio/index.md`

- [ ] **Step 1: Add the shared-layout route entry**

```yaml
---
layout: portfolio
portfolio_profile: default
portfolio_palette: precision
permalink: /portfolio/
---
```

- [ ] **Step 2: Verify the route entry does not alter the root page**

Run: `sed -n '1,20p' index.md; sed -n '1,20p' portfolio/index.md`
Expected: `index.md` keeps `permalink: /`; the new page uses `permalink: /portfolio/`, the shared `portfolio` layout, and the `precision` palette.

### Task 2: Update route contract tests

**Files:**
- Modify: `tests/test_test2_portfolio.py`

- [ ] **Step 1: Extend the route contract**

Add the public route to the expected mapping:

```python
            "portfolio": ("precision", "/portfolio/"),
```

- [ ] **Step 2: Run the focused test**

Run: `python3 -m unittest tests/test_test2_portfolio.py`
Expected: all tests pass.

### Task 3: Make GitHub Pages build the current site

**Files:**
- Modify: `.github/workflows/pages-deploy.yml`

- [ ] **Step 1: Remove stale missing-config build steps**

Keep checkout, Ruby, Pages setup, artifact upload, and deploy jobs. Use one build step:

```yaml
      - name: Build site
        env:
          JEKYLL_ENV: production
        run: bundle exec jekyll build --config _config.yml --destination _site
```

Then verify the public files:

```yaml
      - name: Verify public routes
        run: |
          test -f _site/index.html
          test -f _site/test1/index.html
          test -f _site/portfolio/index.html
```

- [ ] **Step 2: Validate the workflow text locally**

Run: `rg -n "Build (site|default)|_config\.(kurly|42dot|woowahan)|_site/(index|test1|portfolio)" .github/workflows/pages-deploy.yml`
Expected: only `_config.yml`, the `Build site` step, and all three route checks are present; no missing profile config remains.

### Task 4: Verify, commit, push, and confirm deployment

**Files:**
- No additional source files.

- [ ] **Step 1: Build and run repository checks**

Run `bundle exec jekyll build --config _config.yml --destination _site`, `python3 -m unittest discover -s tests -p 'test_*.py'`, `python3 scripts/verify-portfolio.py`, and `git diff --check`. The source-only verifier is intentional because `_config.yml` excludes the legacy application pages that the verifier's optional rendered profile map expects.

Expected: build succeeds; tests pass; source/rendered contract reports `PASS`; diff check has no output; all three route files exist.

- [ ] **Step 2: Confirm root and public page palette classes**

Run:

```bash
grep -o '<body class="[^"]*"' _site/index.html | head -1
grep -o '<body class="[^"]*"' _site/portfolio/index.html | head -1
```

Expected: root has no `palette-*` class; `/portfolio/` has `palette-precision`.

- [ ] **Step 3: Commit the requested current worktree and push `main`**

Run `git add -A`, `git commit -m "feat: publish precision portfolio at portfolio route"`, and `git push origin main`.

Expected: commit succeeds and `main` is pushed to `LIMGIHO/limgiho.github.io`.

- [ ] **Step 4: Confirm GitHub Pages deployment**

Run `gh run list --repo LIMGIHO/limgiho.github.io --workflow "Deploy GitHub Pages" --limit 3` and request `https://limgiho.github.io/portfolio/`.

Expected: the pushed `main` run succeeds, `/portfolio/` returns the Precision Blue page, and `/` remains available.

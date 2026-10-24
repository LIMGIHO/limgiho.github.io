# Resume Profile Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the company-neutral main resume from Daangn and future application profiles, and document the public publishing model in the root README.

**Architecture:** Each resume route has one `career_profile` selector. Shared main career data and the main introduction come from `_data/main_career.yml`; a selected company profile supplies only its own overrides and visual theme. Application working packages are excluded from Pages, while curated public route pages live under `pages/applications/<slug>/` and use explicit permalinks.

**Tech Stack:** Jekyll, Liquid, YAML, Node.js built-in test runner, GitHub Pages Actions.

## Global Constraints

- Keep `/` and its `/resume/` alias company-neutral and sourced from `_data/main_career.yml`.
- Keep Daangn-specific content and appearance on `/daangn/` and `/daangn/portfolio/` only.
- Allow future company-specific resume and portfolio routes to use explicit profile keys without copying the full career history.
- Preserve the single GitHub Pages deployment.
- Do not delete or rewrite the user's current application files.
- Publish only curated application pages and explicitly selected deliverables; exclude the application working packages from the Pages artifact.

---

### Task 1: Lock main and Daangn separation in integration tests

**Files:**
- Modify: `tests/ink-resume-jekyll.test.mjs`
- Modify: `tests/daangn-pages.test.mjs`

**Interfaces:**
- Consumes: built pages at `_workspace/ink-resume-jekyll-site/` and `_workspace/ink-resume-baseurl/`.
- Produces: regression assertions that distinguish the main and Daangn profiles and reject application workspace output.

- [x] **Step 1: Update the main-page assertions**

In `tests/ink-resume-jekyll.test.mjs`, change every main-page article count expectation from 21 to 22, including the main-career independence test. Add these assertions after loading `page`:

```js
const about = page.slice(page.indexOf('class="about-prose"'), page.indexOf('class="about-image"'));
assert.ok(about.includes('반복 업무를 자동화하는 시스템을 만들고 운영해 온 백엔드 개발자 임기호입니다.'));
assert.doesNotMatch(about, /업무의 의미가 드러나고, 안심하고 바꿀 수 있는 코드를 지향합니다\./);
assert.ok(page.includes('RPA 프로젝트 (삼성 NERP 연동)'));
await assert.rejects(access(new URL('applications/2026-08-03/kakaopay-fde/portfolio/index.html', site)));
```

Keep the `/resume/` alias assertion comparing its articles with `/`.

The application-route assertion must fail before the application directory is excluded; `README.md` is already excluded by the current config and is not a useful regression target.

- [x] **Step 2: Rewrite the cross-profile assertions**

In the first test in `tests/daangn-pages.test.mjs`, rename it to describe distinct content. Keep the Daangn page's count at 21 and assert the main page has 22. For each Daangn-excluded RPA text, assert it is absent from Daangn and present in the main page. Assert that Daangn's about text includes its headline while the main about includes the main headline; assert the two about sections differ. Keep the existing Daangn theme, link, canonical, project override, and portfolio checks.

Replace the equality assertion with these checks:

```js
assert.ok(about.includes('업무의 의미가 드러나고, 안심하고 바꿀 수 있는 코드를 지향합니다.'));
assert.ok(mainAbout.includes('반복 업무를 자동화하는 시스템을 만들고 운영해 온 백엔드 개발자 임기호입니다.'));
assert.notEqual(mainAbout, about, 'main and Daangn use separate introductions');
```

- [x] **Step 3: Run the focused tests to confirm the regression is exposed**

Run:

```sh
bundle exec jekyll build --config _config.yml --destination _workspace/ink-resume-jekyll-site
node --test tests/ink-resume-jekyll.test.mjs tests/daangn-pages.test.mjs
```

Expected: the tests fail because the main page still selects Daangn content and the legacy Kakaopay route is still eligible for output.

### Task 2: Use one resume profile selector

**Files:**
- Modify: `index.md`
- Modify: `resume/index.html`
- Modify: `_layouts/ink-resume.html`

**Interfaces:**
- Consumes: `page.career_profile`, `_data/main_career.yml`, and `_data/career_profiles.yml`.
- Produces: one selected profile object used for resume overrides, links, and theme, with main data as the fallback.

- [x] **Step 1: Set explicit route profiles**

Set the front matter of `index.md` and `resume/index.html` to:

```yaml
layout: ink-resume
career_profile: main
```

Keep each file's existing permalink, canonical URL, and title. Remove `career_content_profile: daangn`.

The Daangn page already selects `career_profile: daangn`; leave that value and its copy unchanged.

- [x] **Step 2: Remove the second profile lookup from the layout**

In `_layouts/ink-resume.html`, remove the `career_content_variant` assignment. Use `career_variant` in every existing content-override lookup: introduction, excluded projects, hidden subtitles, description overrides, and description removals. Keep `resume_profile` sourced from `site.data.main_career | default: site.data.resume`, and keep the existing fallback chain from the selected profile's `about` to `resume_profile.about`.

- [x] **Step 3: Run the focused tests again**

Run:

```sh
bundle exec jekyll build --config _config.yml --destination _workspace/ink-resume-jekyll-site
node --test tests/ink-resume-jekyll.test.mjs tests/daangn-pages.test.mjs
```

Expected: profile-content and introduction assertions pass; the Kakaopay-route assertion remains failing until Task 3.

### Task 3: Separate application workspaces from published pages and document the model

**Files:**
- Modify: `_config.yml`
- Modify: `README.md`
- Modify: `docs/ink-resume-production.md`
- Modify: `scripts/verify-portfolio.py`

**Interfaces:**
- Consumes: the route/profile contract from Tasks 1–2.
- Produces: an explicit Pages source boundary and an operational README for main, Daangn, and future company profiles.

- [x] **Step 1: Exclude application working packages from Jekyll output**

Add `applications/` to the root `exclude` list in `_config.yml`. Keep curated page sources under `pages/applications/<slug>/`; a public application page must set an explicit permalink such as `/applications/<slug>/` and an explicit `career_profile`. Only deliberately selected public deliverables belong under `assets/applications/<slug>/`. Do not move, delete, or edit files in `applications/`.

- [x] **Step 2: Reorganize the root README around publishing**

Retain the current portfolio architecture notes, but make the README an entry point with these sections:

1. route map: `/`, `/resume/`, `/portfolio/`, `/daangn/`, `/daangn/portfolio/`, and the future `/applications/<slug>/` pattern;
2. a source-of-truth table for `_data/main_career.yml`, `_data/career_profiles.yml`, `_data/portfolio.yml`, and `_data/portfolio_profiles.yml`;
3. the rule that `career_profile` selects a resume profile and `portfolio_profile` selects a portfolio profile;
4. the boundary between the excluded `applications/` workspace, curated `pages/applications/` sources, and deliberately published `assets/applications/<slug>/` deliverables;
5. the steps for adding a company profile, including matching resume and portfolio slugs where both exist;
6. local build, verification, and the existing single GitHub Pages workflow.

Update or remove the outdated Kakaopay example route if it is no longer a curated public route. Keep the existing statement that public portfolio copy must not expose customer names, internal system names, private URLs, or connection information.

- [x] **Step 3: Correct the production notes**

In `docs/ink-resume-production.md`, document that `/` and `/resume/` use the main profile and main career data, while `/daangn/` alone uses the Daangn resume profile. Remove the statement that main pages share the Daangn profile. Keep the current route map, assets, and validation commands accurate.

- [x] **Step 4: Align portfolio validation with active public routes**

In `scripts/verify-portfolio.py`, change `RENDERED_PROFILES` to validate `portfolio/index.html` as `default` and `daangn/portfolio/index.html` as `daangn`. Change `PDF_PROFILES` to include only `assets/portfolio/lim-giho-portfolio.pdf`, the sole current public portfolio PDF. Remove the stale Kakao page and PDF paths; they are application-package sources and are excluded from the Pages build.

- [x] **Step 5: Run focused tests and inspect output paths**

Run:

```sh
node --test tests/ink-resume-jekyll.test.mjs tests/daangn-pages.test.mjs
```

Expected: all focused tests and `python3 scripts/verify-portfolio.py --site-dir _workspace/ink-resume-jekyll-site` pass, including the assertion that `applications/` working files are absent from the built site.

### Task 4: Verify the complete site and review the final diff

**Files:**
- No additional files; validate the changes from Tasks 1–3.

**Interfaces:**
- Consumes: final Jekyll output and the existing GitHub Pages route smoke checks.
- Produces: verified main and Daangn pages, matching route behavior under a base URL, and a clean diff limited to the approved files.

- [x] **Step 1: Build standard and baseurl sites**

Run:

```sh
bundle exec jekyll build --config _config.yml --destination _workspace/ink-resume-jekyll-site
bundle exec jekyll build --config _config.yml --destination _workspace/ink-resume-baseurl --baseurl /ink-resume-check
```

Expected: both commands succeed; `/`, `/resume/`, `/portfolio/`, `/daangn/`, and `/daangn/portfolio/` exist, and `applications/` source packages do not appear in the output.

- [x] **Step 2: Run the existing resume, profile, and portfolio checks**

Run:

```sh
node --test tests/ink-resume-jekyll.test.mjs tests/ink-resume-portal-controller.test.mjs tests/ink-resume-portal-model.test.mjs tests/ink-resume-portal-renderer.test.mjs tests/ink-resume-portal-nav.test.mjs
node --test tests/daangn-pages.test.mjs
python3 scripts/verify-portfolio.py --site-dir _workspace/ink-resume-jekyll-site
```

Expected: all commands pass.

- [x] **Step 3: Review the patch boundary**

Run:

```sh
git diff --check
git status --short
```

Expected: no whitespace errors; the feature diff contains only `_config.yml`, `README.md`, `docs/ink-resume-production.md`, `index.md`, `resume/index.html`, `_layouts/ink-resume.html`, `scripts/verify-portfolio.py`, and the two named tests. Do not stage or commit any pre-existing application deletions or untracked files.

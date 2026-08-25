# PDF Architecture Appendix and KakaoPay Support Materials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add a data-driven print-only architecture appendix and prepare a separate KakaoPay senior server application package dated 2026-08-22 without changing the existing FDE package or web interaction.

**Architecture:** Shared Liquid includes remain the source of truth. The architecture include keeps the existing JS-driven detail and renders its first-node state for print without adding an index or a second set of detail cards. The new application route reuses the shared portfolio layout through an explicit Jekyll include, while a wrapper invokes the common PDF builder only for the new route.

**Tech Stack:** Jekyll/Liquid, Sass print media rules, Chrome headless PDF, Python verification, Poppler PNG rendering.

## Global Constraints

- Do not modify `assets/js/portfolio.js`, the existing architecture SVG geometry, or the existing `applications/2026-08-03/kakaopay-fde/` files.
- Keep the web `.architecture-detail` and node-selection behavior unchanged.
- Keep the original `/portfolio/` page count and layout; do not add duplicated node cards or an index.
- Do not claim Kotlin, Spring, Kubernetes, or MongoDB experience without repository evidence.
- Do not commit, push, or submit an application.
- Use `tmp/pdfs/` for intermediate renders and remove them after visual review.

---

### Task 1: Add failing contracts for the print appendix and support package

**Files:**
- Create: `tests/test_pdf_architecture_and_kakaopay.py`

- [ ] **Step 1: Write source contracts first**

The test must assert the architecture include keeps `.architecture-detail` and its data attributes, the JS source must not change, the new profile and route must exist, and the old FDE folder must not be modified by the implementation contract.

- [ ] **Step 2: Run the focused test and observe the expected failure**

Run: `python3 -m unittest tests/test_pdf_architecture_and_kakaopay.py`

Expected: failure because the print-only classes, new profile, route, and support files do not exist yet.

### Task 2: Implement the print-only static architecture appendix

**Files:**
- Modify: `_includes/portfolio/architecture.html`
- Modify: `_sass/portfolio/_architecture.scss`

- [ ] **Step 1: Add print-only node numbers without changing SVG geometry**

Inside the existing node loop, add a text element using `forloop.index | prepend: "0"`, positioned at the lower-right of each existing node box. Give it class `architecture-node-index` and no screen display.

- [ ] **Step 2: Add data-driven index and detail loops**

Keep the existing architecture figure and `.architecture-detail` as the only architecture detail rendered for print. Add the support job title to that existing heading when the route provides `application_title`; do not create a print-only index or duplicate cards.

- [ ] **Step 3: Add print CSS**

Keep the new containers `display: none` by default. Under `@media print`, display the map numbers and static containers, hide `.architecture-detail`, use A4-friendly two-column index/cards, make tree/long cards full width, and apply `break-inside: avoid` plus page breaks before details and long tree cards.

- [ ] **Step 4: Run the focused source test**

Run: `python3 -m unittest tests/test_pdf_architecture_and_kakaopay.py`

Expected: print appendix source contracts pass; support-package assertions remain the only failures.

### Task 3: Add the KakaoPay profile and public support route

**Files:**
- Modify: `_data/portfolio_profiles.yml`
- Modify: `_config.yml`
- Create: `applications/2026-08-22/kakaopay-server-senior-minor/portfolio/index.md`

- [ ] **Step 1: Add the factual server-focused profile**

Add `kakaopay_server_senior_minor` with editorial theme, the headline `복잡한 업무 흐름을 안정적인 서버 경계로 바꿉니다`, a summary grounded in API/Queue/Worker/Data and operations, metrics `[legacy-integration, migration-volume, automation-hours, lookup-time]`, and `show_additional_work: true`.

- [ ] **Step 2: Allow only portfolio entry points through the application tree**

Remove the broad `exclude: applications/` entry and replace it with file patterns for application README/source/scripts/PDFs/resumes. This leaves the existing and new `portfolio/index.md` pages renderable without publishing application preparation documents.

- [ ] **Step 3: Add the route front matter**

```yaml
---
layout: portfolio
portfolio_profile: kakaopay_server_senior_minor
permalink: /applications/2026-08-22/kakaopay-server-senior-minor/portfolio/
---
```

- [ ] **Step 4: Verify route and profile contracts**

Run: `python3 -m unittest tests/test_pdf_architecture_and_kakaopay.py`

Expected: source contracts pass before writing the application prose.

### Task 4: Write the dated application package

**Files:**
- Create: `applications/2026-08-22/kakaopay-server-senior-minor/README.md`
- Create: `applications/2026-08-22/kakaopay-server-senior-minor/job-posting.md`
- Create: `applications/2026-08-22/kakaopay-server-senior-minor/fit-analysis.md`
- Create: `applications/2026-08-22/kakaopay-server-senior-minor/cover-letter.md`
- Create: `applications/2026-08-22/kakaopay-server-senior-minor/verify.py`
- Create: `applications/2026-08-22/kakaopay-server-senior-minor/build.sh`
- Copy: `assets/resume/lim-giho-resume.pdf` to `applications/2026-08-22/kakaopay-server-senior-minor/resume.pdf`

- [ ] **Step 1: Record the posting and preparation state**

Write the supplied company, role, URL, date, employment, location, requirements, preferences, process note, `지원 상태: 준비 중`, and file commands. Mark live-coding details as requiring confirmation when the posting does not specify them.

- [ ] **Step 2: Build the fit table only from real evidence**

Map each requested experience to `_data/portfolio.yml`, `_includes/portfolio/transition.html`, `_data/portfolio.yml` writings, the existing resume PDF, or the personal-project data. Mark Kotlin/Spring/Kubernetes/MongoDB as `직접 근거 부족` unless a source explicitly proves them; describe only transferable NestJS/TypeScript/Redis/BullMQ/Docker/Swarm experience.

- [ ] **Step 3: Write a restrained cover-letter draft**

Center it on server boundaries, operations, migration, async processing, incident analysis, deployment, cross-functional problem definition, and shipped products. Do not imply Kotlin/Spring experience.

- [ ] **Step 4: Add build and verification wrappers**

`build.sh` invokes the common PDF builder with the new route target and `verify.py` checks required files, PDF size/page count/text extraction, job title, all eight architecture labels, document and deployment headings.

- [ ] **Step 5: Copy the stable resume without editing the source**

Use `cp assets/resume/lim-giho-resume.pdf applications/2026-08-22/kakaopay-server-senior-minor/resume.pdf` and verify the two files have matching SHA-256 hashes.

### Task 5: Extend PDF generation and run all verification

**Files:**
- Modify: `scripts/build-portfolio-pdf.sh`

- [ ] **Step 1: Add target-aware route rendering**

Keep the existing root and 2026-08-03 route commands available, add the new route output, and support a target argument so the new support wrapper does not write into the old support folder. Use a temporary Chrome profile and the local light profile so PDF output does not depend on localStorage.

- [ ] **Step 2: Run the source and site checks**

Run:

```bash
bundle exec jekyll build
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/verify-portfolio.py
python3 applications/2026-08-22/kakaopay-server-senior-minor/verify.py --html-only
```

- [ ] **Step 3: Generate the new portfolio PDF**

Run: `bash applications/2026-08-22/kakaopay-server-senior-minor/build.sh`

Expected: `applications/2026-08-22/kakaopay-server-senior-minor/portfolio.pdf` exists and is non-empty.

- [ ] **Step 4: Render every PDF page to `tmp/pdfs/` and inspect**

Use `pdftoppm -png` for the new portfolio PDF and inspect every PNG. Confirm the 01-08 numbering, static cards, document flow, delivery flow, no clipped Korean/text/tree/SVG, no blank pages, and readable type. Remove `tmp/pdfs/` after review.

- [ ] **Step 5: Run final package verification and diff checks**

Run `python3 applications/2026-08-22/kakaopay-server-senior-minor/verify.py`, `git diff --check`, and confirm `git status --short` contains no changes under `applications/2026-08-03/kakaopay-fde/`. Do not commit or push.

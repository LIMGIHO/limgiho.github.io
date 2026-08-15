# Enterprise Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current résumé-style GitHub Pages root with an enterprise-submission portfolio that produces a default Ice Blue URL/PDF and a Kakao Graphite Yellow URL/PDF from one sanitized content source.

**Architecture:** Jekyll renders shared YAML content through focused Liquid includes. Each entry page selects a profile that changes only semantic theme tokens, Hero copy, metric order, decision emphasis, and optional work visibility. Vanilla JavaScript progressively enhances the Career Journey and decision cards; print CSS keeps every critical detail visible for Chromium PDF generation.

**Tech Stack:** Jekyll 4, Liquid, YAML, semantic HTML, SCSS/CSS, Vanilla JavaScript, Python 3 standard library, Ruby standard library YAML parser, Google Chrome headless, PyMuPDF through `uv`.

## Global Constraints

- Keep the site compatible with GitHub Pages-style static hosting; add no server runtime.
- Do not add React, Next.js, a client framework, a CSS framework, or a JavaScript package manager dependency.
- Publish the default profile at `/` and the Kakao profile at `/applications/2026-08-03/kakaopay-fde/portfolio/`.
- Generate default PDF at `assets/portfolio/lim-giho-portfolio.pdf` and Kakao PDF at `applications/2026-08-03/kakaopay-fde/portfolio.pdf`.
- Keep project facts in `_data/portfolio.yml`; profiles may only select or reorder facts.
- Keep the default theme Ice Blue and the Kakao theme Graphite Yellow.
- Publicly show employer names, roles, and periods; anonymize clients, internal organizations, proprietary system names, infrastructure identifiers, and private URLs.
- Preserve all 10 design decisions from `assets/portfolio/architecture.html` before deleting that standalone file.
- Critical content must remain readable without JavaScript and with `prefers-reduced-motion: reduce`.
- PDF output is A4 portrait, includes working links, and expands every design decision.
- Preserve unrelated user changes and the already-approved cleanup; never restore deleted backup files.

## File Map

| Path | Responsibility |
| --- | --- |
| `_data/portfolio.yml` | Canonical sanitized career, metrics, projects, architecture, decisions, technologies, and additional work |
| `_data/portfolio_profiles.yml` | `default` and `kakao` presentation-only overrides |
| `_layouts/portfolio.html` | Document shell, metadata, profile lookup, shared section composition |
| `_includes/portfolio/head.html` | Profile-aware title, description, CSS, favicon, canonical metadata |
| `_includes/portfolio/hero.html` | Positioning, metrics, résumé/GitHub actions |
| `_includes/portfolio/journey.html` | Chronological Career Journey markup |
| `_includes/portfolio/flagship.html` | Flagship problem, constraints, role, evidence, and outcomes |
| `_includes/portfolio/architecture.html` | Print-safe Before/After SVG diagram |
| `_includes/portfolio/decision-card.html` | Accessible problem/alternative/choice/result card |
| `_includes/portfolio/automation.html` | Automation case study |
| `_includes/portfolio/experience.html` | Compact experience and contextual technology groups |
| `_includes/portfolio/additional-work.html` | Optional compact personal-project links |
| `assets/css/portfolio.scss` | Reset, Ice Blue and Kakao tokens, responsive document layout, print rules |
| `assets/js/portfolio.js` | Journey observation, card expansion, before/after print state |
| `index.md` | Default-profile entry point |
| `applications/2026-08-03/kakaopay-fde/portfolio/index.md` | Kakao-profile entry point |
| `scripts/verify-portfolio.py` | Source/profile/rendered HTML/PDF contract checks |
| `scripts/build-portfolio-pdf.sh` | Production build and atomic generation of two PDFs |
| `tests/test_verify_portfolio.py` | Unit tests for validation behavior |
| `assets/portfolio/architecture.html` | Delete after the 10 decisions and diagram meaning are verified in the integrated page |
| `scripts/verify-architecture-portfolio.py` | Delete after its anonymization and completeness checks move to the new verifier |

---

### Task 1: Checkpoint the Approved Repository Cleanup

**Files:**
- Verify: `applications/2026-08-03/kakaopay-fde/README.md`
- Verify: `applications/2026-08-03/kakaopay-fde/resume.pdf`
- Verify: `applications/2026-08-03/kakaopay-fde/cover-letter.md`
- Verify: `assets/resume/lim-giho-resume.pdf`
- Modify: all currently tracked cleanup deletions and `_config.yml`/`.gitignore` changes already present in the working tree

**Interfaces:**
- Consumes: the user-approved cleanup already present in the dirty working tree
- Produces: a clean checkpoint commit that subsequent portfolio commits can build on without mixing deleted backups into feature commits

- [ ] **Step 1: Verify the retained application archive and PDFs**

Run:

```bash
uv run --with pymupdf python applications/2026-08-03/kakaopay-fde/verify.py
```

Expected:

```text
HTML checks passed; detailed PDF: 5 pages
PDF checks passed: 3 A4 pages, 2 detailed-career links
```

- [ ] **Step 2: Verify the current Jekyll source builds before portfolio replacement**

Run:

```bash
bundle install
portfolio_prebuild_dir="$(mktemp -d)"
bundle exec jekyll build --destination "$portfolio_prebuild_dir"
test -f "$portfolio_prebuild_dir/index.html"
test -f "$portfolio_prebuild_dir/assets/resume/lim-giho-resume.pdf"
find "$portfolio_prebuild_dir" -depth -delete
```

Expected: Jekyll prints `done in` and both `test` commands exit 0.

- [ ] **Step 3: Review the cleanup scope**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the approved backup/cache/config deletions, `_config.yml`, `.gitignore`, the stable résumé PDF, and `applications/2026-08-03/kakaopay-fde/` remain outside committed design/plan documents. `assets/portfolio/architecture.html` and `scripts/verify-architecture-portfolio.py` still exist.

- [ ] **Step 4: Commit the cleanup checkpoint**

```bash
git add -A
git commit -m "chore: archive latest application materials"
```

Expected: one commit containing the approved cleanup and application archive; `git status --short` is empty.

---

### Task 2: Add the Canonical Content and Profile Contracts

**Files:**
- Create: `_data/portfolio.yml`
- Create: `_data/portfolio_profiles.yml`
- Create: `scripts/verify-portfolio.py`
- Create: `tests/test_verify_portfolio.py`

**Interfaces:**
- Consumes: facts from `_config.yml`, all 10 cards from the JSON model in `assets/portfolio/architecture.html`, and stable links under `assets/resume/`
- Produces: `load_yaml(path: Path) -> dict`, `validate_source(content: dict, profiles: dict) -> list[str]`, constants `REQUIRED_DECISION_IDS` and `FORBIDDEN_PATTERNS`, plus the canonical Liquid data keys used by every later task

- [ ] **Step 1: Write failing validation tests**

Create `tests/test_verify_portfolio.py` with these contract cases:

```python
import copy
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "verify_portfolio", ROOT / "scripts" / "verify-portfolio.py"
)
verify = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(verify)


class PortfolioSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = verify.load_yaml(ROOT / "_data" / "portfolio.yml")
        cls.profiles = verify.load_yaml(ROOT / "_data" / "portfolio_profiles.yml")

    def test_canonical_source_is_valid(self):
        self.assertEqual(verify.validate_source(self.content, self.profiles), [])

    def test_all_ten_architecture_decisions_are_present(self):
        ids = {item["id"] for item in self.content["flagship"]["decisions"]}
        self.assertEqual(ids, verify.REQUIRED_DECISION_IDS)

    def test_unknown_profile_reference_fails(self):
        profiles = copy.deepcopy(self.profiles)
        profiles["default"]["featured_decisions"].append("missing-decision")
        errors = verify.validate_source(self.content, profiles)
        self.assertTrue(any("missing-decision" in error for error in errors))

    def test_missing_metric_source_fails(self):
        content = copy.deepcopy(self.content)
        content["metrics"][0]["source"] = ""
        errors = verify.validate_source(content, self.profiles)
        self.assertTrue(any("source" in error for error in errors))

    def test_proprietary_client_name_fails(self):
        content = copy.deepcopy(self.content)
        content["automation"]["title"] = "삼성 NERP 자동화"
        errors = verify.validate_source(content, self.profiles)
        self.assertTrue(any("익명화" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and verify the missing-module failure**

Run:

```bash
python3 -m unittest tests/test_verify_portfolio.py -v
```

Expected: FAIL because `scripts/verify-portfolio.py` or the two YAML files do not exist.

- [ ] **Step 3: Create the canonical YAML schemas**

Create `_data/portfolio.yml` with these exact top-level keys and stable identifiers:

```yaml
person:
  name: 임기호
  email: lasid84@gmail.com
  phone: 010-5496-0663
  github_url: https://github.com/limgiho
  resume_url: /assets/resume/lim-giho-resume.pdf

metrics:
  - id: legacy-integration
    value: "15 → 1"
    label: 레거시 시스템 통합
    source: 기존 architecture.html 모델 및 경력기술서
  - id: work-screens
    value: "90+"
    label: 통합 업무 화면
    source: 기존 architecture.html Web 노드 역할 설명
  - id: lookup-time
    value: "10분 → 5초"
    label: 외부 정보 조회
    source: 최신 경력기술서의 Web 기반 사내 시스템 전면 통합 항목
  - id: automation-hours
    value: "월 1,200h"
    label: 반복 작업 절감
    source: 최신 경력기술서의 업무 자동화 항목
  - id: migration-volume
    value: "1,000만+"
    label: 데이터 이관
    source: 최신 경력기술서의 DB 리뉴얼 항목

journey:
  - id: iljin-foundation
    period: 2010–2015
    company: ILJIN Global
    role: Software Engineer
    title: 제조 현장의 데이터를 시스템으로 연결
    description: 생산 데이터 수집과 MES·ERP 업무 시스템을 개발하며 제조 현장의 흐름을 익혔습니다.
  - id: iljin-lead
    period: 2016–2022
    company: ILJIN Global
    role: Project Lead
    title: 국내외 공장 MES 고도화를 리드
    description: 노후 클라이언트를 현대화하고 국내외 공장의 추적성과 실시간 ERP 연계를 구축했습니다.
  - id: kwe-automation
    period: 2022–2023
    company: KWE Korea
    role: Lead Software Engineer
    title: 물류 업무 자동화와 데이터 전환
    description: 반복 입력, 외부 연동, 이기종 데이터 이관을 검증 가능한 자동화 흐름으로 바꿨습니다.
  - id: kwe-platform
    period: 2023–현재
    company: KWE Korea
    role: Lead Software Engineer
    title: 레거시를 통합 플랫폼으로 전환
    description: 15종 운영 시스템을 분석하고 웹·API·Worker·데이터 경계를 갖춘 단일 플랫폼으로 전환하고 있습니다.

flagship:
  id: integrated-platform
  title: 15종 레거시 시스템을 단일 플랫폼으로
  legacy_count: 15
  domain_count: 5
  problem: 15종 이상의 프로그램과 3종의 DBMS가 각자 업무와 외부 연동을 품고 있어 변경과 장애의 영향 범위를 파악하기 어려웠습니다.
  constraint: 매일 사용하는 운영 시스템이므로 업무를 중단하거나 전체 기능을 한 번에 재작성할 수 없었습니다.
  role: 기존 시스템 분석, 목표 구조 설계, 웹·API 구현, 데이터 전환, 단계별 배포와 운영을 주도했습니다.
  outcomes:
    - 15종의 분산된 시스템을 5개 업무 도메인의 단일 웹 플랫폼으로 수렴
    - 외부 조회 업무를 건당 10분에서 5초 이내로 단축
    - 변경 경계와 배포 계약을 코드와 빌드 단계에서 검증
  evidence:
    - id: database-migration
      title: 1,000만 건 이상 이기종 데이터 이관과 교차 검증
    - id: backend-modernization
      title: Express에서 NestJS 모듈 구조로 점진적 전환
    - id: delivery-standardization
      title: 테스트 게이트와 변경 경로 기반 CI/CD 표준화
  decisions:
    - { id: integration, title: 왜 통합인가 }
    - { id: frontend-slices, title: 클린 아키텍처를 프론트에 넣으려다 접었다 }
    - { id: typed-boundaries, title: 경계를 규칙이 아니라 타입으로 지켰다 }
    - { id: incremental-migration, title: 한 번에 갈아엎지 않았다 }
    - { id: worker-contract, title: 배포 단위가 다른 둘 사이의 계약 }
    - { id: distributed-cron, title: replica를 늘리자 크론이 두 번 돌았다 }
    - { id: private-llm, title: 서류를 밖으로 내보낼 수 없었다 }
    - { id: llm-evaluation, title: 믿지 않고 측정했다 }
    - { id: adapter-boundary, title: 외부 8종을 한 경계 뒤로 }
    - { id: affected-deploy, title: 모노레포에서 바뀐 것만 배포한다 }

automation:
  id: external-workflow-automation
  title: 외부 업무 시스템 입력 자동화

experience: []
technology_groups: []
additional_work: []
```

For each decision, copy the existing `problem`, `alternative`, `choice`, and `result` text verbatim from the corresponding card in `assets/portfolio/architecture.html`. Populate `experience`, `technology_groups`, and `additional_work` from the current `_config.yml`, removing client/system proper nouns under the anonymization policy.

Create `_data/portfolio_profiles.yml` with presentation-only references:

```yaml
default:
  theme: ice-blue
  eyebrow: PLATFORM · INTEGRATION · FULL-STACK
  headline: 복잡한 운영을 하나의 흐름으로 바꿉니다
  summary: 레거시, 반복 업무, 데이터 단절을 통합 플랫폼과 자동화로 해결해 온 풀스택 엔지니어입니다.
  metrics: [legacy-integration, lookup-time, automation-hours, migration-volume]
  featured_decisions: [incremental-migration, typed-boundaries, worker-contract]
  show_additional_work: true

kakao:
  theme: graphite-yellow
  eyebrow: FRONTEND · PLATFORM · INTEGRATION
  headline: 복잡한 업무를 명확한 제품 경험으로 바꿉니다
  summary: 대규모 업무 화면과 도메인 경계를 설계하며 운영 가능한 프론트엔드 구조를 만들어 왔습니다.
  metrics: [work-screens, legacy-integration, lookup-time, migration-volume]
  featured_decisions: [frontend-slices, typed-boundaries, incremental-migration]
  show_additional_work: true
```

- [ ] **Step 4: Implement the source verifier without adding Python dependencies**

Create `scripts/verify-portfolio.py`. `load_yaml()` must call Ruby's standard YAML parser and return JSON to Python:

```python
#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIRED_DECISION_IDS = {
    "integration", "frontend-slices", "typed-boundaries",
    "incremental-migration", "worker-contract", "distributed-cron",
    "private-llm", "llm-evaluation", "adapter-boundary", "affected-deploy",
}
FORBIDDEN_PATTERNS = (
    re.compile(r"samsung|삼성|nerp", re.I),
    re.compile(r"(?<![A-Za-z0-9])limo(?![A-Za-z0-9])", re.I),
    re.compile(r"(?<![A-Za-z0-9])ufs(?![A-Za-z0-9])", re.I),
    re.compile(r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b"),
)


def load_yaml(path: Path) -> dict:
    ruby = "puts JSON.generate(YAML.safe_load(File.read(ARGV[0]), aliases: true))"
    completed = subprocess.run(
        ["ruby", "-ryaml", "-rjson", "-e", ruby, str(path)],
        check=True, capture_output=True, text=True,
    )
    return json.loads(completed.stdout)


def flatten_strings(value):
    if isinstance(value, dict):
        for child in value.values():
            yield from flatten_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from flatten_strings(child)
    elif isinstance(value, str):
        yield value


def validate_source(content: dict, profiles: dict) -> list[str]:
    errors = []
    decisions = content.get("flagship", {}).get("decisions", [])
    decision_ids = {item.get("id") for item in decisions}
    if decision_ids != REQUIRED_DECISION_IDS:
        errors.append(f"decision ids mismatch: {sorted(decision_ids)}")
    metric_ids = {item.get("id") for item in content.get("metrics", [])}
    for metric in content.get("metrics", []):
        if not metric.get("source"):
            errors.append(f"metric source missing: {metric.get('id')}")
    for name in ("default", "kakao"):
        profile = profiles.get(name)
        if not profile:
            errors.append(f"profile missing: {name}")
            continue
        for metric_id in profile.get("metrics", []):
            if metric_id not in metric_ids:
                errors.append(f"unknown metric in {name}: {metric_id}")
        for decision_id in profile.get("featured_decisions", []):
            if decision_id not in decision_ids:
                errors.append(f"unknown decision in {name}: {decision_id}")
    public_text = "\n".join(flatten_strings(content))
    for pattern in FORBIDDEN_PATTERNS:
        match = pattern.search(public_text)
        if match:
            errors.append(f"익명화 위반: {match.group(0)}")
    return errors
```

Add a CLI `main()` that loads both YAML files, prints every error, and exits 1 on failure; otherwise print `PASS: portfolio source contract`.

- [ ] **Step 5: Run the source tests**

Run:

```bash
python3 -m unittest tests/test_verify_portfolio.py -v
python3 scripts/verify-portfolio.py --source-only
```

Expected: 5 tests pass and the CLI prints `PASS: portfolio source contract`.

- [ ] **Step 6: Commit the content contract**

```bash
git add _data/portfolio.yml _data/portfolio_profiles.yml scripts/verify-portfolio.py tests/test_verify_portfolio.py
git commit -m "feat: add portfolio content contracts"
```

---

### Task 3: Render the Profile-Aware Document Shell and Hero

**Files:**
- Create: `_layouts/portfolio.html`
- Create: `_includes/portfolio/head.html`
- Create: `_includes/portfolio/hero.html`
- Create: `assets/css/portfolio.scss`
- Modify: `index.md`
- Create: `applications/2026-08-03/kakaopay-fde/portfolio/index.md`
- Modify: `scripts/verify-portfolio.py`
- Modify: `tests/test_verify_portfolio.py`

**Interfaces:**
- Consumes: `site.data.portfolio`, `site.data.portfolio_profiles[page.portfolio_profile]`
- Produces: `<body class="portfolio theme-{theme}">`, `.portfolio-hero`, `.metric-grid`, stable `#top`, résumé and GitHub links, and two rendered HTML entry points

- [ ] **Step 1: Add a failing rendered-shell test**

Extend `tests/test_verify_portfolio.py` with a temporary-site fixture and assertions implemented through `verify.validate_rendered(site_dir)`:

```python
def test_rendered_profiles_have_shell_and_correct_theme(self):
    errors = verify.validate_rendered(ROOT / "_site")
    self.assertEqual(errors, [])
```

`validate_rendered()` must require:

```python
RENDERED_PROFILES = {
    "default": (Path("index.html"), "theme-ice-blue"),
    "kakao": (
        Path("applications/2026-08-03/kakaopay-fde/portfolio/index.html"),
        "theme-graphite-yellow",
    ),
}
```

For each file, require `class="portfolio`, the expected theme class, `id="top"`, `class="portfolio-hero"`, `/assets/resume/lim-giho-resume.pdf`, and `https://github.com/limgiho`.

- [ ] **Step 2: Run the rendered test and verify failure**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
```

Expected: FAIL because the old default layout has no profile-aware portfolio shell.

- [ ] **Step 3: Create the profile-aware layout and entries**

Use this layout boundary in `_layouts/portfolio.html`:

```liquid
{% assign portfolio = site.data.portfolio %}
{% assign profile = site.data.portfolio_profiles[page.portfolio_profile] %}
<!doctype html>
<html lang="ko">
  {% include portfolio/head.html portfolio=portfolio profile=profile %}
  <body class="portfolio theme-{{ profile.theme }}">
    <a class="skip-link" href="#main-content">본문으로 이동</a>
    <main id="main-content">
      {% include portfolio/hero.html portfolio=portfolio profile=profile %}
      <div id="portfolio-sections"></div>
    </main>
    <script src="{{ '/assets/js/portfolio.js' | relative_url }}" defer></script>
  </body>
</html>
```

Set `index.md` to:

```yaml
---
layout: portfolio
portfolio_profile: default
permalink: /
---
```

Set the Kakao entry front matter to:

```yaml
---
layout: portfolio
portfolio_profile: kakao
permalink: /applications/2026-08-03/kakaopay-fde/portfolio/
---
```

`head.html` must use `profile.headline` in the title/description and load only `/assets/css/portfolio.css`. `hero.html` must resolve each profile metric ID against `portfolio.metrics`, render semantic `<dl>` items, and render the résumé and GitHub links from `portfolio.person`.

- [ ] **Step 4: Add the minimum buildable stylesheet**

Create `assets/css/portfolio.scss` with Jekyll front matter and baseline styles:

```scss
---
---
:root { color-scheme: light; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body.portfolio { margin: 0; background: #eef2f5; color: #1d2228; font-family: system-ui, -apple-system, "Pretendard", "Malgun Gothic", sans-serif; }
.skip-link { position: absolute; left: -9999px; }
.skip-link:focus { left: 1rem; top: 1rem; z-index: 20; }
.portfolio-hero { max-width: 1120px; margin: 0 auto; padding: 72px 48px 56px; background: #fff; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 760px) {
  .portfolio-hero { padding: 48px 22px 40px; }
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

- [ ] **Step 5: Build and run the rendered contract**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
python3 scripts/verify-portfolio.py --site-dir _site
```

Expected: source and rendered-profile tests pass; both HTML routes exist with their expected theme class.

- [ ] **Step 6: Commit the shell**

```bash
git add _layouts/portfolio.html _includes/portfolio/head.html _includes/portfolio/hero.html assets/css/portfolio.scss index.md applications/2026-08-03/kakaopay-fde/portfolio/index.md scripts/verify-portfolio.py tests/test_verify_portfolio.py
git commit -m "feat: render profile-aware portfolio shell"
```

---

### Task 4: Add the Career Journey Progressive Enhancement

**Files:**
- Create: `_includes/portfolio/journey.html`
- Create: `assets/js/portfolio.js`
- Modify: `_layouts/portfolio.html`
- Modify: `assets/css/portfolio.scss`
- Modify: `scripts/verify-portfolio.py`
- Modify: `tests/test_verify_portfolio.py`

**Interfaces:**
- Consumes: `portfolio.journey`
- Produces: `#career-journey`, `[data-journey-item]`, `.is-current`, and `initJourney(root: Document) -> void`; all cards are visible before enhancement

- [ ] **Step 1: Add failing journey markup and script contract tests**

Extend `validate_rendered()` to require four `data-journey-item` attributes, `id="career-journey"`, all four journey IDs, and `/assets/js/portfolio.js`. Add a unit test that reads the script and requires these strings:

```python
def test_journey_script_has_accessible_fallbacks(self):
    script = (ROOT / "assets/js/portfolio.js").read_text(encoding="utf-8")
    for phrase in ("IntersectionObserver", "prefers-reduced-motion", "is-current"):
        self.assertIn(phrase, script)
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
```

Expected: FAIL because no journey include or JavaScript exists.

- [ ] **Step 3: Render the full journey before adding behavior**

Create `_includes/portfolio/journey.html` as an ordered list. Each item must expose `item.id`, `period`, `company`, `role`, `title`, and its description from the canonical YAML. Include it immediately after the Hero in `_layouts/portfolio.html`:

```liquid
{% include portfolio/hero.html portfolio=portfolio profile=profile %}
{% include portfolio/journey.html journey=portfolio.journey %}
```

The include's stable boundary is:

```liquid
<section class="portfolio-section journey-section" id="career-journey" aria-labelledby="journey-title">
  <p class="section-number">01 · CAREER JOURNEY</p>
  <h2 id="journey-title">개발에서 플랫폼 책임까지</h2>
  <ol class="journey-list">
    {% for item in include.journey %}
      <li class="journey-item" data-journey-item id="journey-{{ item.id }}">
        <time>{{ item.period }}</time>
        <div><p>{{ item.company }} · {{ item.role }}</p><h3>{{ item.title }}</h3><p>{{ item.description }}</p></div>
      </li>
    {% endfor %}
  </ol>
</section>
```

- [ ] **Step 4: Add progressive enhancement**

Implement `initJourney()` in `assets/js/portfolio.js` so it returns without changing markup when `IntersectionObserver` is unavailable. With reduced motion, mark every item current immediately. Otherwise observe at threshold `0.45`, remove `.is-current` from siblings, and add it to the intersecting item. Call the function on `DOMContentLoaded`.

```javascript
function initJourney(root) {
  const items = [...root.querySelectorAll('[data-journey-item]')];
  if (!items.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-current'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
      items.forEach((item) => item.classList.remove('is-current'));
      entry.target.classList.add('is-current');
    });
  }, { threshold: 0.45 });
  items.forEach((item) => observer.observe(item));
}

document.addEventListener('DOMContentLoaded', () => initJourney(document));
```

- [ ] **Step 5: Style the timeline with a non-animated baseline**

Add a vertical rule on `.journey-list`, visible markers on `.journey-item::before`, and color emphasis on `.journey-item.is-current`. Put transitions only inside `@media (prefers-reduced-motion: no-preference)`. Mobile keeps one content column and the same reading order.

- [ ] **Step 6: Build, test, and commit**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
python3 scripts/verify-portfolio.py --site-dir _site
```

Expected: all tests pass and each rendered profile contains four readable journey items.

```bash
git add _includes/portfolio/journey.html _layouts/portfolio.html assets/js/portfolio.js assets/css/portfolio.scss scripts/verify-portfolio.py tests/test_verify_portfolio.py _data/portfolio.yml
git commit -m "feat: add career journey timeline"
```

---

### Task 5: Integrate the Flagship Architecture and All 10 Decisions

**Files:**
- Create: `_includes/portfolio/flagship.html`
- Create: `_includes/portfolio/architecture.html`
- Create: `_includes/portfolio/decision-card.html`
- Modify: `_layouts/portfolio.html`
- Modify: `assets/js/portfolio.js`
- Modify: `assets/css/portfolio.scss`
- Modify: `scripts/verify-portfolio.py`
- Modify: `tests/test_verify_portfolio.py`

**Interfaces:**
- Consumes: `portfolio.flagship`, `profile.featured_decisions`
- Produces: `#flagship`, `#architecture-before-after`, ten `[data-decision-id]` cards, three `.is-featured` cards per profile, `initDecisionCards(root: Document) -> void`

- [ ] **Step 1: Add failing completeness tests**

For both rendered profiles, require all ten `data-decision-id` values, exactly three `is-featured` decision cards, `id="architecture-before-after"`, text `15종`, text `5개 업무 도메인`, and the four labels `문제`, `검토`, `선택`, `결과`.

```python
def test_rendered_flagship_preserves_all_decisions(self):
    for relative_path, _theme in verify.RENDERED_PROFILES.values():
        text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
        self.assertEqual(text.count("data-decision-id="), 10)
        self.assertEqual(text.count("decision-card is-featured"), 3)
        for decision_id in verify.REQUIRED_DECISION_IDS:
            self.assertIn(f'data-decision-id="{decision_id}"', text)
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
```

Expected: FAIL because the integrated flagship section does not exist.

- [ ] **Step 3: Render the flagship narrative and profile ordering**

`flagship.html` must render, in order: problem, operating constraint, personal role, the architecture include, outcomes/evidence, then decisions. Resolve featured IDs first in profile order; render the other seven afterward in canonical order without duplication.

Use a captured ID string such as `|incremental-migration|typed-boundaries|worker-contract|` to test membership in Liquid rather than comparing whole objects. Pass `featured=true` to `decision-card.html` for the first group and `featured=false` to the rest.

- [ ] **Step 4: Create a print-safe semantic SVG diagram**

`architecture.html` must use an SVG with a `viewBox`, text labels, and no external image resources. The left group shows representative legacy categories rather than proprietary system names:

```text
업무 클라이언트 · 자동화 도구 · 정산/재무 · 외부 연동 · 이기종 DB
```

The right group shows:

```text
Web (90+ screens) → API / Queue / Worker → 5개 업무 도메인 → 통합 데이터·외부 어댑터
```

Add a visible caption explaining that the illustration abstracts 15 operating systems into responsibilities and boundaries. Ensure the SVG contains `<title>` and `<desc>` referenced by `aria-labelledby`.

- [ ] **Step 5: Render accessible decision cards**

Each card must show title and result without JavaScript. Featured cards show every field initially. Secondary cards use a button with `aria-expanded="true"` in the server HTML so no-JavaScript users see the content; JavaScript may collapse them after load.

The include boundary is:

```liquid
<article class="decision-card{% if include.featured %} is-featured{% endif %}" data-decision-id="{{ include.decision.id }}">
  <h3>{{ include.decision.title }}</h3>
  <p class="decision-result">{{ include.decision.result }}</p>
  <button class="decision-toggle" type="button" aria-expanded="true" aria-controls="decision-{{ include.decision.id }}">판단 과정 보기</button>
  <div class="decision-detail" id="decision-{{ include.decision.id }}">
    <dl><dt>문제</dt><dd>{{ include.decision.problem }}</dd><dt>검토</dt><dd>{{ include.decision.alternative }}</dd><dt>선택</dt><dd>{{ include.decision.choice }}</dd><dt>결과</dt><dd>{{ include.decision.result }}</dd></dl>
  </div>
</article>
```

- [ ] **Step 6: Add card enhancement and print restoration**

Implement `initDecisionCards()` to collapse only non-featured cards after `DOMContentLoaded`, toggle `hidden` and `aria-expanded` on click, expose every detail in `beforeprint`, and restore prior states in `afterprint`. CSS must include:

```css
@media print {
  .decision-toggle { display: none !important; }
  .decision-detail[hidden] { display: block !important; }
}
```

- [ ] **Step 7: Build, test, and commit**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
python3 scripts/verify-portfolio.py --site-dir _site
```

Expected: both profiles render exactly ten decisions, each has exactly three featured cards in its configured order, and no forbidden term appears.

```bash
git add _includes/portfolio/flagship.html _includes/portfolio/architecture.html _includes/portfolio/decision-card.html _layouts/portfolio.html assets/js/portfolio.js assets/css/portfolio.scss scripts/verify-portfolio.py tests/test_verify_portfolio.py
git commit -m "feat: integrate flagship architecture case study"
```

---

### Task 6: Add Automation, Experience, Technology Context, and Additional Work

**Files:**
- Create: `_includes/portfolio/automation.html`
- Create: `_includes/portfolio/experience.html`
- Create: `_includes/portfolio/additional-work.html`
- Modify: `_layouts/portfolio.html`
- Modify: `_data/portfolio.yml`
- Modify: `assets/css/portfolio.scss`
- Modify: `scripts/verify-portfolio.py`
- Modify: `tests/test_verify_portfolio.py`

**Interfaces:**
- Consumes: `portfolio.automation`, `portfolio.experience`, `portfolio.technology_groups`, `portfolio.additional_work`, `profile.show_additional_work`
- Produces: `#automation`, `#experience`, optional `#additional-work`, contextual technology labels, and no skill-percentage markup

- [ ] **Step 1: Add failing section and anonymization tests**

Require both rendered profiles to contain `id="automation"`, `id="experience"`, `외부 업무 시스템 입력 자동화`, `월 1,200시간`, `ILJIN Global`, and `KWE Korea`. Reject these presentational patterns:

```python
FORBIDDEN_RENDERED_PATTERNS = (
    r"skill-bar", r"progress-bar", r"aria-valuenow", r"문의하기", r"상담 신청",
)
```

Require `id="additional-work"` only when `show_additional_work` is true.

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
```

Expected: FAIL because the three lower sections are absent.

- [ ] **Step 3: Complete the canonical lower-section data**

Populate the automation narrative with five explicit stages: manual-error problem, pre-input validation, automated transfer/input, failure detection/retry, and monthly time reduction. Use `외부 업무 시스템`, never the customer or proprietary system name.

Populate two experience records with company, period, role, and 2–3 evidence bullets. Group technologies by use context:

```yaml
technology_groups:
  - title: Product & Frontend
    technologies: [Next.js, React, TypeScript, Zustand, WinForms]
    context: 90여 개 업무 화면, 화면 중심 슬라이스, 운영 도구 개발
  - title: Backend & Automation
    technologies: [Node.js, NestJS, Express, C#, Redis, BullMQ]
    context: 도메인 API, 비동기 작업, RPA와 배치 처리
  - title: Data & Integration
    technologies: [PostgreSQL, Oracle, MySQL, SAP, gRPC, WCF]
    context: 이기종 데이터 이관, 정합성 검증, 외부 시스템 연동
  - title: Delivery & Operations
    technologies: [GitLab CI/CD, Docker, Docker Swarm, Portainer]
    context: 테스트 게이트, 변경 경로 기반 빌드, 배포 추적과 롤백
```

Populate only verified personal projects from the existing `_config.yml`; each item needs `title`, `summary`, `technologies`, and `url`. Do not invent missing URLs.

- [ ] **Step 4: Render the three sections**

Render automation as `문제 → 검증 → 처리 → 예외 → 성과`, experience as two compact employer blocks, technologies as contextual lists, and additional work as a compact link list. Do not render skill levels, percent values, or sales/contact language.

- [ ] **Step 5: Build, test, and commit**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
python3 scripts/verify-portfolio.py --site-dir _site
```

Expected: all lower-section requirements pass and no anonymization violation or forbidden UI pattern is reported.

```bash
git add _includes/portfolio/automation.html _includes/portfolio/experience.html _includes/portfolio/additional-work.html _layouts/portfolio.html _data/portfolio.yml assets/css/portfolio.scss scripts/verify-portfolio.py tests/test_verify_portfolio.py
git commit -m "feat: complete portfolio evidence sections"
```

---

### Task 7: Finish the Ice Blue/Kakao Visual System and Responsive Behavior

**Files:**
- Modify: `assets/css/portfolio.scss`
- Modify: `_includes/portfolio/head.html`
- Modify: `scripts/verify-portfolio.py`
- Modify: `tests/test_verify_portfolio.py`

**Interfaces:**
- Consumes: `theme-ice-blue` and `theme-graphite-yellow` body classes plus semantic component classes from Tasks 3–6
- Produces: semantic custom properties, 1120px document canvas, desktop/mobile layouts, reduced-motion behavior, and A4 print styles

- [ ] **Step 1: Add a failing theme-token contract test**

Require the compiled `_site/assets/css/portfolio.css` to contain these tokens and media rules:

```python
required_css = (
    "--accent", "--accent-soft", "--ink", "--muted", "--rule",
    ".theme-ice-blue", ".theme-graphite-yellow",
    "prefers-reduced-motion: reduce", "@media print", "@page",
)
```

Also reject `transition: all`, fixed content heights on `.portfolio-section`, and remote `@import`/`url(http` resources.

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
```

Expected: FAIL until the complete token and print contract is present.

- [ ] **Step 3: Implement semantic theme tokens**

Use these approved palettes:

```scss
.theme-ice-blue {
  --accent: #287dae;
  --accent-strong: #155f8d;
  --accent-soft: #e3f4fc;
  --surface: #f5fbfe;
  --paper: #ffffff;
  --ink: #1d2228;
  --muted: #66707a;
  --rule: #cbe5f3;
}

.theme-graphite-yellow {
  --accent: #8a7000;
  --accent-strong: #5e4d00;
  --accent-soft: #fff7cf;
  --surface: #faf9f3;
  --paper: #ffffff;
  --ink: #1d2228;
  --muted: #68675f;
  --rule: #e3debf;
}
```

Use tokens by meaning; do not add profile-specific selectors inside component rules.

- [ ] **Step 4: Complete document, component, mobile, and print styles**

Desktop uses a maximum 1120px white paper canvas with 48–72px vertical spacing. Mobile below 760px uses 22px horizontal padding, stacks metrics and architecture groups, preserves source order, and allows the SVG to scale without horizontal page scrolling.

Print rules must set:

```scss
@page { size: A4 portrait; margin: 14mm 13mm 16mm; }
@media print {
  body.portfolio { background: #fff; font-size: 9.5pt; }
  .portfolio-shell { max-width: none; box-shadow: none; }
  .portfolio-section, .decision-card, .journey-item, .architecture-figure { break-inside: avoid; }
  .screen-only, .decision-toggle { display: none !important; }
  .decision-detail[hidden] { display: block !important; }
  a { color: inherit; text-decoration: none; }
}
```

Reduced motion removes smooth scrolling, transitions, and journey reveal transforms.

- [ ] **Step 5: Build and run static checks**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests/test_verify_portfolio.py -v
python3 scripts/verify-portfolio.py --site-dir _site
```

Expected: all tests pass and the compiled CSS contains both palettes, reduced-motion behavior, and print rules.

- [ ] **Step 6: Inspect both themes in a real browser**

Run a local server:

```bash
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Using the browser automation workflow, capture and inspect:

```text
http://127.0.0.1:4000/
http://127.0.0.1:4000/applications/2026-08-03/kakaopay-fde/portfolio/
```

Check desktop at 1440×1000 and mobile at 390×844. Expected: no horizontal overflow, Career Journey emphasizes on scroll, ten decision cards are keyboard reachable, default is Ice Blue, and Kakao is Graphite Yellow with identical section structure.

- [ ] **Step 7: Commit the visual system**

```bash
git add assets/css/portfolio.scss _includes/portfolio/head.html scripts/verify-portfolio.py tests/test_verify_portfolio.py
git commit -m "style: add portfolio theme and print system"
```

---

### Task 8: Generate and Verify Both PDFs, Then Retire the Standalone Architecture Page

**Files:**
- Create: `scripts/build-portfolio-pdf.sh`
- Modify: `scripts/verify-portfolio.py`
- Modify: `tests/test_verify_portfolio.py`
- Create: `assets/portfolio/lim-giho-portfolio.pdf`
- Create: `applications/2026-08-03/kakaopay-fde/portfolio.pdf`
- Delete: `assets/portfolio/architecture.html`
- Delete: `scripts/verify-architecture-portfolio.py`
- Modify: `README.md`

**Interfaces:**
- Consumes: production `_site` output from both profiles and Chrome executable at `PORTFOLIO_CHROME_BIN` or `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Produces: two atomically replaced PDFs and `validate_pdfs(paths: dict[str, Path]) -> list[str]`

- [ ] **Step 1: Add failing PDF and retirement tests**

Extend the test suite to require both PDF paths, A4 pages, extracted text for each required section, all ten decision titles, the résumé URL, and GitHub URL. Add checks that the standalone HTML and verifier no longer exist only after the integrated-render completeness checks pass.

Use PyMuPDF in CLI verification, installed ephemerally through `uv`; do not import it in source-only unit tests.

- [ ] **Step 2: Run the PDF verification and verify failure**

Run:

```bash
uv run --with pymupdf python scripts/verify-portfolio.py --site-dir _site --pdf
```

Expected: FAIL because the two portfolio PDFs have not been generated.

- [ ] **Step 3: Implement atomic dual-profile PDF generation**

Create `scripts/build-portfolio-pdf.sh` with `set -euo pipefail`. It must:

1. Run `bundle exec jekyll build`.
2. Resolve Chrome from `${PORTFOLIO_CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}`.
3. Create one `mktemp -d` profile directory and trap cleanup with `find "$profile_dir" -depth -delete`.
4. Print `_site/index.html` and the Kakao `_site/.../portfolio/index.html` to temporary PDFs using `--headless=new`, `--no-pdf-header-footer`, and `--print-to-pdf`.
5. Wait until each temporary PDF size is stable for four 250ms polls, with a 30-second limit.
6. Move completed PDFs to their final paths only after both temporary PDFs exist and are non-empty.
7. Run `uv run --with pymupdf python scripts/verify-portfolio.py --site-dir _site --pdf`.

The profile mapping must be explicit:

```bash
default_html="$repo_root/_site/index.html"
default_pdf="$repo_root/assets/portfolio/lim-giho-portfolio.pdf"
kakao_html="$repo_root/_site/applications/2026-08-03/kakaopay-fde/portfolio/index.html"
kakao_pdf="$repo_root/applications/2026-08-03/kakaopay-fde/portfolio.pdf"
```

- [ ] **Step 4: Build and verify both PDFs**

Run:

```bash
bash scripts/build-portfolio-pdf.sh
```

Expected: the verifier reports two PDFs, every page is approximately 595.28×841.89 points, required sections and ten decision titles are present, and both URLs are clickable.

- [ ] **Step 5: Render every PDF page for visual QA**

Run:

```bash
portfolio_render_dir="$(mktemp -d)"
pdftoppm -png -r 120 assets/portfolio/lim-giho-portfolio.pdf "$portfolio_render_dir/default"
pdftoppm -png -r 120 applications/2026-08-03/kakaopay-fde/portfolio.pdf "$portfolio_render_dir/kakao"
find "$portfolio_render_dir" -name '*.png' -maxdepth 1 -print | sort
```

Open every listed page image. Expected: no clipped Korean text, overlapping cards, orphan headings, unreadable architecture labels, unintended blank pages, or color backgrounds that overwhelm the document. Keep the render directory until all fixes are complete, then remove it with `find "$portfolio_render_dir" -depth -delete`.

- [ ] **Step 6: Remove the superseded standalone architecture artifacts**

Before deletion, run:

```bash
bundle exec jekyll build
python3 scripts/verify-portfolio.py --site-dir _site
```

Expected: both integrated profiles contain all ten decisions and the Before/After architecture. Then delete only:

```text
assets/portfolio/architecture.html
scripts/verify-architecture-portfolio.py
```

Use the repository patch tool for the deletions.

- [ ] **Step 7: Document maintenance commands**

Update `README.md` with:

```markdown
## Portfolio

- Default URL: `https://limgiho.github.io/`
- Kakao profile: `/applications/2026-08-03/kakaopay-fde/portfolio/`
- Shared content: `_data/portfolio.yml`
- Profile overrides: `_data/portfolio_profiles.yml`
- Build and verify both PDFs: `bash scripts/build-portfolio-pdf.sh`
- Verify HTML only: `python3 scripts/verify-portfolio.py --site-dir _site`
```

- [ ] **Step 8: Run the complete release gate**

Run:

```bash
python3 -m unittest tests/test_verify_portfolio.py -v
bundle exec jekyll build
python3 scripts/verify-portfolio.py --site-dir _site
bash scripts/build-portfolio-pdf.sh
uv run --with pymupdf python applications/2026-08-03/kakaopay-fde/verify.py
git diff --check
git status --short
```

Expected: all tests and builds pass; application résumé remains valid; `git diff --check` is silent; status contains only the intended integrated portfolio changes and generated PDFs.

- [ ] **Step 9: Commit the completed portfolio**

```bash
git add README.md scripts/build-portfolio-pdf.sh scripts/verify-portfolio.py tests/test_verify_portfolio.py assets/portfolio/lim-giho-portfolio.pdf applications/2026-08-03/kakaopay-fde/portfolio.pdf assets/portfolio/architecture.html scripts/verify-architecture-portfolio.py
git commit -m "feat: publish enterprise portfolio profiles"
```

Expected: the commit records both verified PDFs, build/verification commands, and retirement of the standalone architecture page.

---

## Final Review Checklist

- [ ] Root URL uses the default Ice Blue profile.
- [ ] Kakao URL uses Graphite Yellow and frontend-oriented Hero/metric/decision ordering.
- [ ] Both profiles consume the same canonical content.
- [ ] Career Journey is readable without JavaScript and animated only when motion is allowed.
- [ ] All 10 architecture decisions survive integration.
- [ ] Customer and proprietary system names are absent from rendered HTML and PDFs.
- [ ] Personal projects remain compact and are controlled by the profile flag.
- [ ] URL and PDF versions share the same information hierarchy.
- [ ] Every PDF page has been visually inspected.
- [ ] The latest career-detail PDF remains linked and the Kakao résumé archive still verifies.

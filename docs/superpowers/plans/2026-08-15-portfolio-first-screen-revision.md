# Portfolio First-Screen Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 표지형 Hero를 제거하고 담백한 Career Journey부터 시작하는 로컬 검토용 포트폴리오로 되돌린다.

**Architecture:** Jekyll 레이아웃에서 Hero include를 제거하고 Career Journey include와 공통 데이터의 문구만 사실 중심으로 바꾼다. 렌더 계약은 Hero 부재와 새 문구를 검증하도록 전환하며, 조기에 생성한 PDF 바이너리는 삭제하되 향후 사용할 생성 도구는 유지한다.

**Tech Stack:** Jekyll, Liquid, YAML, SCSS, Python `unittest`, Playwright CLI

## Global Constraints

- 이번 수정에서는 포트폴리오 PDF를 생성하거나 렌더 검수하지 않는다.
- Career Journey의 기간과 회사명은 유지한다.
- 공식 직급과 역할은 뒤의 경력 섹션에만 표시한다.
- 기본 Ice Blue와 카카오 Graphite Yellow 프로필 구조는 유지한다.
- 사용자 승인 없이 원격 저장소에 push하지 않는다.

---

### Task 1: Hero 없이 주요 경력부터 시작

**Files:**
- Modify: `tests/test_verify_portfolio.py`
- Modify: `scripts/verify-portfolio.py`
- Modify: `_layouts/portfolio.html`
- Modify: `_includes/portfolio/journey.html`
- Modify: `_data/portfolio.yml`
- Modify: `assets/css/portfolio.scss`
- Delete: `_includes/portfolio/hero.html`

**Interfaces:**
- Consumes: `site.data.portfolio.journey`, `site.data.portfolio_profiles[page.portfolio_profile]`
- Produces: `#career-journey`가 첫 콘텐츠인 기본·카카오 렌더 결과

- [ ] **Step 1: 새 첫 화면 계약을 실패 테스트로 작성**

`PortfolioRenderedContractTests`에서 두 렌더 페이지 모두 다음을 요구한다.

```python
self.assertNotIn('class="portfolio-hero"', text)
self.assertIn('<h2 id="journey-title">주요 경력</h2>', text)
self.assertIn(
    "제조·물류 시스템을 개발하고 운영해 온 경험을 시간순으로 정리했습니다.",
    text,
)
self.assertNotIn("개발에서 플랫폼 책임까지", text)
self.assertLess(text.index('id="career-journey"'), text.index('id="flagship"'))
```

- [ ] **Step 2: 실패 확인**

Run: `bundle exec jekyll build && python3 -m unittest tests.test_verify_portfolio.PortfolioRenderedContractTests -v`

Expected: Hero가 존재하고 새 문구가 없어 FAIL.

- [ ] **Step 3: 최소 화면 수정 구현**

`_layouts/portfolio.html`에서 Hero include를 제거한다. Journey 헤더는 다음 문구를 사용한다.

```html
<p class="section-number">01 · CAREER JOURNEY</p>
<h2 id="journey-title">주요 경력</h2>
<p>제조·물류 시스템을 개발하고 운영해 온 경험을 시간순으로 정리했습니다.</p>
```

Journey 메타는 회사명만 렌더링한다.

```liquid
<p class="journey-meta">{{ item.company }}</p>
```

`_data/portfolio.yml`의 타임라인 제목은 다음 네 문구로 바꾼다.

```yaml
- title: MES·ERP 업무 시스템 개발
- title: 국내외 공장 MES 고도화
- title: 물류 업무 자동화와 데이터 전환
- title: 통합 업무 플랫폼 개발 및 운영
```

첫 섹션에 중복 경계선이 생기지 않도록 추가한다.

```scss
.portfolio-section:first-child {
  border-top: 0;
}
```

렌더 검증기의 Hero·Hero 링크 요구를 제거하고 새 문구와 Hero 부재를 검증한다. 사용하지 않는 `_includes/portfolio/hero.html`과 전용 Hero 스타일을 제거한다.

- [ ] **Step 4: 테스트와 빌드 통과 확인**

Run: `bundle exec jekyll build && python3 -m unittest tests/test_verify_portfolio.py -v && python3 scripts/verify-portfolio.py --site-dir _site`

Expected: 모든 테스트와 source/rendered contract PASS.

- [ ] **Step 5: 커밋**

```bash
git add _data/portfolio.yml _includes/portfolio/journey.html _layouts/portfolio.html assets/css/portfolio.scss scripts/verify-portfolio.py tests/test_verify_portfolio.py
git add -u _includes/portfolio/hero.html
git commit -m "refactor: start portfolio with factual career timeline"
```

### Task 2: 조기 PDF 산출물 제거와 로컬 문서 정리

**Files:**
- Modify: `tests/test_verify_portfolio.py`
- Modify: `README.md`
- Modify: `applications/2026-08-03/kakaopay-fde/README.md`
- Delete: `assets/portfolio/lim-giho-portfolio.pdf`
- Delete: `applications/2026-08-03/kakaopay-fde/portfolio.pdf`

**Interfaces:**
- Consumes: `scripts/build-portfolio-pdf.sh`의 향후 수동 PDF 생성 기능
- Produces: PDF 바이너리 없이 로컬 HTML 검토를 기본으로 설명하는 저장소

- [ ] **Step 1: PDF 비추적 계약을 실패 테스트로 작성**

기존 `test_repository_pdfs_pass_the_contract`를 다음 테스트로 교체한다.

```python
def test_portfolio_pdf_outputs_are_not_committed_during_screen_iteration(self):
    for relative_path in self.verify.PDF_PROFILES.values():
        self.assertFalse((ROOT / relative_path).exists())
```

- [ ] **Step 2: 실패 확인**

Run: `python3 -m unittest tests.test_verify_portfolio.PortfolioPdfContractTests.test_portfolio_pdf_outputs_are_not_committed_during_screen_iteration -v`

Expected: 현재 PDF 두 파일이 존재하므로 FAIL.

- [ ] **Step 3: PDF 산출물과 문서 참조 제거**

두 PDF 파일을 삭제한다. 루트 README의 기본 작업 흐름은 다음처럼 로컬 화면 확인만 안내한다.

````markdown
## 로컬 확인

```bash
bundle exec jekyll serve
```
````

PDF 생성 명령과 생성 결과 목록은 제거하고, 지원 폴더 README에서도 `portfolio.pdf` 항목과 재생성 명령을 제거한다. `scripts/build-portfolio-pdf.sh`와 검증기의 `--pdf` 옵션은 향후 명시적 요청에 대비해 유지한다.

- [ ] **Step 4: 전체 자동 검증**

Run: `bundle exec jekyll build && python3 -m unittest tests/test_verify_portfolio.py -v && python3 scripts/verify-portfolio.py --site-dir _site && git diff --check`

Expected: 모든 테스트와 source/rendered contract PASS, PDF 생성 명령 실행 없음.

- [ ] **Step 5: 로컬 브라우저 검증**

Run: `bundle exec jekyll serve --host 127.0.0.1 --port 4000`

Playwright로 기본·카카오 URL을 데스크톱 `1440×1000`과 모바일 `390×844`에서 열고 다음을 확인한다.

```text
.portfolio-hero count = 0
#career-journey count = 1
documentElement.scrollWidth <= innerWidth
console errors = 0
```

- [ ] **Step 6: 커밋**

```bash
git add README.md applications/2026-08-03/kakaopay-fde/README.md tests/test_verify_portfolio.py
git add -u assets/portfolio/lim-giho-portfolio.pdf applications/2026-08-03/kakaopay-fde/portfolio.pdf
git commit -m "chore: defer portfolio PDF generation"
```

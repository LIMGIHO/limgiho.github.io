# KakaoPay FDE Resume v04 Introduction Emphasis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 첫 페이지의 `경력 요약`을 `소개`로 바꾸고 핵심 구절만 절제해 강조한다.

**Architecture:** 기존 세 문단과 페이지 구조는 유지하고, 의미가 바뀌지 않는 구절에만 시맨틱 `<strong>`을 추가한다. 강조 표현은 전용 CSS 규칙으로 통제하고 기존 HTML 검증 스크립트에 제목·강조 개수 검사를 추가한다.

**Tech Stack:** HTML5, CSS, Python 검증 스크립트

## Global Constraints

- 소개 세 문단의 사실과 문장은 바꾸지 않는다.
- 문단별 강약을 두고 전체 일곱 개의 핵심 구절만 `<strong>`으로 표시한다.
- HTML과 CSS만 수정하며 PDF는 생성하지 않는다.
- 다른 섹션과 기존 PDF 파일은 변경하지 않는다.

---

### Task 1: 소개 제목과 핵심 강조

**Files:**
- Modify: `scripts/verify-kakaopay-fde-v04-resume.py`
- Modify: `resumes/kakaopay-fde-v04/index.html`
- Modify: `resumes/kakaopay-fde-v04/resume.css`

**Interfaces:**
- Consumes: 기존 `.summary-copy` 세 문단과 `check_html()` 검증 함수
- Produces: `소개` 제목, 일곱 개의 `<strong>` 강조 구절, `.summary-copy strong` 스타일

- [ ] **Step 1: 실패하는 HTML 검증 작성**

기존 PDF는 다시 만들지 않아도 검증할 수 있도록 제목 조건을 공용 `REQUIRED`가 아니라 `check_html()`에만 추가한다. 강조 개수 검사와 함께 아래 코드를 사용한다.

```python
    if '<h2 id="summary-title">소개</h2>' not in text:
        fail("HTML: expected 소개 summary heading")
    if '<h2 id="summary-title">경력 요약</h2>' in text:
        fail("HTML: legacy 경력 요약 heading found")

    summary_match = re.search(
        r'<div class="summary-copy">(.*?)</div>', text, re.DOTALL
    )
    if not summary_match:
        fail("HTML: summary-copy section missing")
    strong_count = len(re.findall(r"<strong>.*?</strong>", summary_match.group(1)))
    if strong_count != 7:
        fail(f"HTML: expected 7 summary highlights, found {strong_count}")
```

- [ ] **Step 2: 검증 실패 확인**

Run: `python3 scripts/verify-kakaopay-fde-v04-resume.py --html-only`

Expected: `FAILED: HTML: expected 소개 summary heading`

- [ ] **Step 3: HTML과 CSS 최소 변경**

제목을 `소개`로 바꾸고 다음 일곱 구절만 `<strong>`으로 감싼다.

```html
<strong>현업의 작업 순서와 예외를 파악하고</strong>
<strong>15종 이상의 사내 프로그램과 데이터를 단일 통합 플랫폼으로</strong>
<strong>세계 80개국에서 사용하는 글로벌 시스템 UFS+</strong>
<strong>AI 에이전트로 여러 해결안을 빠르게 MVP로 구현해 현업 검증 시점을 앞당기고</strong>
<strong>온프레미스 LLM</strong>
<strong>RAG</strong>
<strong>로컬시스템팀 리더</strong>
```

강조는 본문 색상을 유지하면서 굵기만 높인다.

```css
.summary-copy strong {
  color: var(--ink);
  font-weight: 700;
}
```

- [ ] **Step 4: HTML 검증 통과 확인**

Run: `python3 scripts/verify-kakaopay-fde-v04-resume.py --html-only`

Expected: `HTML checks passed`와 `CSS checks passed`

- [ ] **Step 5: PDF가 변경되지 않았는지 확인**

Run: `git status --short -- output/pdf/versions/lim-giho-kakaopay-fde-resume-v04.pdf`

Expected: 출력 없음

- [ ] **Step 6: 변경사항 커밋**

```bash
git add resumes/kakaopay-fde-v04/index.html \
  resumes/kakaopay-fde-v04/resume.css \
  scripts/verify-kakaopay-fde-v04-resume.py \
  docs/superpowers/plans/2026-08-02-kakaopay-fde-resume-v04-introduction-emphasis.md
git commit -m "docs: v04 소개 핵심 내용 강조"
```

# 카카오페이 FDE 이력서 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카카오페이 FDE 전용 이력서를 장식적인 발표 자료 형식에서 담백한 한국형 경력 이력서 형식으로 바꾼다.

**Architecture:** 기존 3페이지 HTML과 Chrome PDF 빌드 방식은 유지한다. 검증 스크립트에 금지 문구와 필수 제목을 먼저 추가한 뒤 HTML 구조와 CSS 표현을 차례로 단순화하고, 마지막에 PDF 자동 검사와 이미지 렌더링을 수행한다.

**Tech Stack:** HTML, CSS, Python 3, Chrome headless PDF, PyPDF, PyMuPDF

## Global Constraints

- 기존 범용 이력서는 수정하지 않는다.
- A4 3페이지 단일 컬럼 형식을 유지한다.
- 하단 표기는 모든 페이지에서 정확히 `limgiho`를 사용한다.
- 영문 eyebrow, 장식용 섹션 번호, 카드형 성과 지표를 제거한다.
- 확인된 회사명, 기간, 수치, 시스템명, 기술명을 바꾸지 않는다.
- AEPOS는 AI 활용 사례 안에서 한 번만 언급한다.
- Java 또는 Kotlin 실무 경험을 암시하지 않는다.

---

### Task 1: 재설계 규칙을 자동 검증에 반영

**Files:**
- Modify: `scripts/verify-kakaopay-fde-resume.py`
- Test: `scripts/verify-kakaopay-fde-resume.py`

**Interfaces:**
- Consumes: `resumes/kakaopay-fde/index.html`, `output/pdf/lim-giho-kakaopay-fde-resume.pdf`
- Produces: 필수 제목, 금지 문구, 정확한 푸터 표기를 검사하는 명령행 검증

- [ ] **Step 1: 재설계 필수 문구와 금지 문구 검사 추가**

  필수 문구에 `경력 요약`, `KWE 주요 업무`, `주요 결과`, `주요 프로젝트`, `경력 및 기술`, `limgiho`를 추가한다. 금지 문구에 아래 값을 추가한다.

  ```python
  forbidden = [
      "KAKAO PAY FDE APPLICATION",
      "이 역할과 맞닿는 두 가지 경험",
      "KWE Transformation Journey",
      "SELECTED EVIDENCE",
      "문제를 찾고, 작동하는 시스템으로 확인했습니다",
      "CAREER & FOUNDATION",
      "여러 기술을 거쳤지만, 문제를 푸는 기준은 같았습니다",
      "새로운 코드베이스에 들어가는 방식",
      "IM GIHO",
  ]
  ```

  `limgiho` 푸터가 HTML에 정확히 세 번 있는지도 검사한다.

- [ ] **Step 2: 검증을 실행해 RED 확인**

  Run: `python3 scripts/verify-kakaopay-fde-resume.py`

  Expected: 현재 HTML에 금지 문구가 있고 필수 제목과 `limgiho` 푸터가 없어서 실패한다.

- [ ] **Step 3: 검증 스크립트만 커밋**

  ```bash
  git add scripts/verify-kakaopay-fde-resume.py
  git commit -m "test: 이력서 재설계 규칙 검증 추가"
  ```

### Task 2: HTML을 한국형 경력 이력서 구조로 수정

**Files:**
- Modify: `resumes/kakaopay-fde/index.html`
- Test: `scripts/verify-kakaopay-fde-resume.py`

**Interfaces:**
- Consumes: 재설계 명세의 제목 변경표와 보존할 기존 경력 사실
- Produces: 세 페이지의 의미 구조와 최종 문안

- [ ] **Step 1: 1페이지 제목과 구성을 수정**

  상단을 `임기호`, `소프트웨어 엔지니어`, 연락처, `지원 분야 · 카카오페이 FDE`로 정리한다. `경력 요약`, `KWE 주요 업무`, `주요 결과` 세 섹션을 일반 제목과 목록 또는 표로 구성한다. 카드와 영문 제목을 위한 HTML 요소는 삭제한다.

- [ ] **Step 2: 2페이지를 주요 프로젝트로 수정**

  페이지 제목은 `주요 프로젝트`만 사용한다. 각 프로젝트는 기간과 기술을 표시하고 `배경`, `담당 업무`, `결과`로 기술한다. 두 번째 프로젝트 제목은 `AI를 활용한 MVP 개발과 업무 검증`으로 바꾸고 AEPOS는 본문에서 한 번만 언급한다.

- [ ] **Step 3: 3페이지를 경력 및 기술로 수정**

  페이지 제목을 `경력 및 기술`로 바꾼다. 섹션 제목은 `경력`, `기술`, `개인 프로젝트`, `기술 전환 경험`만 사용한다. 자기 해석형 aside는 삭제하고 기술 전환 내용을 정규 섹션으로 이동한다.

- [ ] **Step 4: 모든 푸터를 수정**

  각 페이지 푸터를 아래처럼 통일한다.

  ```html
  <footer class="page-footer"><span>limgiho</span><span>1 / 3</span></footer>
  ```

  페이지 번호만 1, 2, 3으로 변경한다.

- [ ] **Step 5: HTML 검증에서 금지 문구가 사라졌는지 확인**

  Run: `python3 scripts/verify-kakaopay-fde-resume.py`

  Expected: HTML 검사는 통과하고 PDF는 이전 문안이므로 실패한다.

- [ ] **Step 6: HTML 변경 커밋**

  ```bash
  git add resumes/kakaopay-fde/index.html
  git commit -m "docs: 카카오페이 FDE 이력서 문안 재구성"
  ```

### Task 3: CSS에서 발표 자료형 장식 제거

**Files:**
- Modify: `resumes/kakaopay-fde/resume.css`
- Test: `scripts/build-kakaopay-fde-pdf.sh`, `scripts/verify-kakaopay-fde-resume.py`

**Interfaces:**
- Consumes: Task 2의 새 HTML 클래스와 3페이지 구분
- Produces: A4 인쇄용 단순한 단일 컬럼 레이아웃

- [ ] **Step 1: 장식 스타일 제거**

  `.eyebrow`, `.section-index`, `.fit-card`, `.metric-grid` 등 삭제된 요소의 스타일을 제거한다. 노란색 면 채움과 둥근 카드 테두리를 사용하지 않는다.

- [ ] **Step 2: 일반 이력서 계층 정의**

  이름은 28~32px, 페이지 제목은 24~28px, 섹션 제목은 16~18px, 본문은 인쇄 기준 10pt 이상으로 설정한다. 섹션 구분은 얇은 회색 선과 여백으로만 표현하고 상단 노란색 선은 유지한다.

- [ ] **Step 3: 표와 프로젝트 레이아웃 정의**

  `KWE 주요 업무`와 `주요 결과`는 테두리를 최소화한 행 구조로 표시한다. 프로젝트는 세로로 쌓고 회사·기간·기술을 제목 가까이에 둔다.

- [ ] **Step 4: PDF를 빌드해 GREEN 확인**

  Run: `scripts/build-kakaopay-fde-pdf.sh && python3 scripts/verify-kakaopay-fde-resume.py`

  Expected: `HTML checks passed`와 `PDF checks passed: 3 A4 pages`가 출력된다.

- [ ] **Step 5: CSS와 PDF 커밋**

  ```bash
  git add resumes/kakaopay-fde/resume.css output/pdf/lim-giho-kakaopay-fde-resume.pdf
  git commit -m "style: 카카오페이 FDE 이력서 디자인 단순화"
  ```

### Task 4: 문체와 렌더링 최종 검증

**Files:**
- Modify: `resumes/kakaopay-fde/index.html` only if inspection finds a defect
- Modify: `resumes/kakaopay-fde/resume.css` only if inspection finds a defect
- Create: `_workspace/2026-08-02-002/final.md`
- Generate: `tmp/pdfs/kakaopay-fde-redesign/page-1.png`
- Generate: `tmp/pdfs/kakaopay-fde-redesign/page-2.png`
- Generate: `tmp/pdfs/kakaopay-fde-redesign/page-3.png`

**Interfaces:**
- Consumes: 최신 HTML과 PDF
- Produces: AI 문체 점검 기록과 시각 검수가 끝난 최종 PDF

- [ ] **Step 1: humanize-korean 보수 모드 점검**

  고유명사와 수치를 보호하고 추상적 자기평가, 영문 장식, 동일 종결 반복을 검사한다. 변경이 필요한 문장만 수정하고 `_workspace/2026-08-02-002/final.md`에 검사 요약을 남긴다.

- [ ] **Step 2: PDF 재빌드와 자동 검사**

  Run: `scripts/build-kakaopay-fde-pdf.sh && python3 scripts/verify-kakaopay-fde-resume.py`

  Expected: HTML과 PDF 검사 모두 통과하고 페이지 수가 3이다.

- [ ] **Step 3: PDF 페이지를 PNG로 렌더링**

  PyMuPDF로 각 페이지를 `tmp/pdfs/kakaopay-fde-redesign/` 아래 PNG로 만들고 세 페이지를 모두 확인한다.

- [ ] **Step 4: 시각 결함 수정 후 재검증**

  잘림, 겹침, 작은 본문, 표 정렬, 페이지별 과도한 빈 공간, 푸터 표기를 확인한다. 결함이 있으면 HTML 또는 CSS를 수정하고 Step 2와 Step 3을 반복한다.

- [ ] **Step 5: 최종 변경 커밋**

  ```bash
  git add resumes/kakaopay-fde/index.html resumes/kakaopay-fde/resume.css output/pdf/lim-giho-kakaopay-fde-resume.pdf
  git commit -m "docs: 카카오페이 FDE 이력서 재설계 확정"
  ```

  변경되지 않은 파일은 Git이 자동으로 제외한다. `_workspace`와 `tmp`는 커밋하지 않는다.

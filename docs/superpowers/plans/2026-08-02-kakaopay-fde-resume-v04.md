# 카카오페이 FDE 이력서 v04 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v03의 담백한 3페이지 형식과 v07의 구체적인 경험을 결합하고, 삼성SDS 전세기 프로젝트의 업무량을 agent 근거로 산정한 v04 PDF를 만든다.

**Architecture:** Claude 작업 파일과 기존 PDF를 보호하기 위해 v04 전용 HTML, CSS, 빌드 스크립트, 검증 스크립트를 별도 경로에 만든다. 검증 스크립트로 RED를 확인한 뒤 HTML과 CSS를 구현하고 Chrome으로 PDF를 생성한다. 마지막에 문체 검사, 자동 검사, PNG 렌더링을 수행한다.

**Tech Stack:** HTML, CSS, Python 3, PyMuPDF, Chrome headless PDF

## Global Constraints

- `resumes/kakaopay-fde/`와 기존 `scripts/build-kakaopay-fde-pdf.sh`, `scripts/verify-kakaopay-fde-resume.py`를 수정하지 않는다.
- 기존 Claude PDF와 v01~v03 PDF를 수정하지 않는다.
- 결과 파일은 `output/pdf/versions/lim-giho-kakaopay-fde-resume-v04.pdf`다.
- A4 3페이지 단일 컬럼이다.
- 모든 푸터는 `limgiho`다.
- `월 200시간 절감`이라고 쓰지 않고 산정 조건과 `월 약 200시간 규모`를 함께 쓴다.
- AEPOS는 한 번만 등장한다.
- Java 또는 Kotlin 실무 경험을 암시하지 않는다.
- 삼성SDS 전세기 수치는 9종, 55개, 19개, 하루 20건, 월 200시간 규모를 사용한다.

---

### Task 1: v04 전용 검증 스크립트 작성

**Files:**
- Create: `scripts/verify-kakaopay-fde-v04-resume.py`
- Test: `scripts/verify-kakaopay-fde-v04-resume.py`

**Interfaces:**
- Consumes: `resumes/kakaopay-fde-v04/index.html`, `output/pdf/versions/lim-giho-kakaopay-fde-resume-v04.pdf`
- Produces: HTML 문구, 금지 표현, AEPOS 횟수, 푸터, A4 3페이지와 PDF 텍스트를 검증하는 명령행 프로그램

- [ ] **Step 1: 필수·금지 문구와 PDF 구조 검사 작성**

  필수 문구는 다음 값을 포함한다.

  ```python
  REQUIRED = [
      "경력 요약",
      "KWE 주요 업무",
      "주요 결과",
      "주요 프로젝트",
      "삼성SDS 전세기 프로젝트 IT 지원",
      "9종",
      "55개",
      "19개",
      "하루 20건",
      "월 약 200시간 규모",
      "HealthDog",
      "액션톡",
      "Local LLM",
      "human-in-the-loop",
  ]
  ```

  금지 문구는 다음 값을 포함한다.

  ```python
  FORBIDDEN = [
      "이 역할과 맞닿는",
      "KAKAO PAY FDE APPLICATION",
      "IM GIHO",
      "월 200시간 절감",
      "40개 이상의 작업 단위",
      "NestJS를 고른 이유",
      "Java/Kotlin",
  ]
  ```

  HTML의 `<span>limgiho</span>`가 3개인지, `AEPOS`가 1개인지 검사한다. PDF는 3페이지 A4이고 각 페이지 추출 문자가 700자 이상이며 필수·금지 문구가 동일하게 적용되는지 검사한다.

- [ ] **Step 2: RED 확인**

  Run: `python3 scripts/verify-kakaopay-fde-v04-resume.py --html-only`

  Expected: `resumes/kakaopay-fde-v04/index.html`이 없어 실패한다.

- [ ] **Step 3: 검증 스크립트 커밋**

  ```bash
  git add scripts/verify-kakaopay-fde-v04-resume.py
  git commit -m "test: 카카오페이 FDE 이력서 v04 검증 추가"
  ```

### Task 2: v04 HTML 문안 작성

**Files:**
- Create: `resumes/kakaopay-fde-v04/index.html`
- Test: `scripts/verify-kakaopay-fde-v04-resume.py`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-08-02-kakaopay-fde-resume-v04-design.md`, Claude v07 PDF의 확인된 사실, agent 삼성 전세기 기록
- Produces: 3페이지의 의미 구조와 최종 이력서 문안

- [ ] **Step 1: 1페이지 작성**

  `임기호`, `소프트웨어 엔지니어`, 연락처, `경력 요약`, `KWE 주요 업무`, `주요 결과`를 작성한다. 역할 적합성 카드와 공고 해설 문구는 넣지 않는다.

- [ ] **Step 2: 2페이지 작성**

  업무 플랫폼·UFS+ 연동, AI MVP, Local LLM 세 프로젝트를 작성한다. v07 대비 중복 문장을 줄이고 AEPOS는 AI MVP 본문에서 한 번만 쓴다.

- [ ] **Step 3: 3페이지 삼성 전세기 프로젝트 작성**

  9종 서류, 55개 실질 대조 항목, 19개 자동검증, 하루 20건 기준 최대 1,100개 항목, 월 20일 기준 22,000개 항목, 항목당 30초와 문서 전환 시간을 적용한 월 약 200시간 규모를 명시한다. 나머지 36개는 판단 기준 부재 14개, 추출 불가 9개, 현업 정의 대기 13개로 구분한다.

- [ ] **Step 4: 3페이지 경력·기술·개인 프로젝트 작성**

  KWE와 ILJIN 경력, 실제 사용 기술, VB6→C#·.NET→Node.js·NestJS 전환, 댓글 필터, HealthDog, 액션톡을 작성한다. NestJS 일반론은 쓰지 않는다.

- [ ] **Step 5: HTML GREEN 확인**

  Run: `python3 scripts/verify-kakaopay-fde-v04-resume.py --html-only`

  Expected: `HTML checks passed`

- [ ] **Step 6: HTML 커밋**

  ```bash
  git add resumes/kakaopay-fde-v04/index.html
  git commit -m "docs: 카카오페이 FDE 이력서 v04 문안 작성"
  ```

### Task 3: v04 인쇄 스타일과 PDF 빌드 구현

**Files:**
- Create: `resumes/kakaopay-fde-v04/resume.css`
- Create: `scripts/build-kakaopay-fde-v04-pdf.sh`
- Generate: `output/pdf/versions/lim-giho-kakaopay-fde-resume-v04.pdf`
- Test: `scripts/verify-kakaopay-fde-v04-resume.py`

**Interfaces:**
- Consumes: `resumes/kakaopay-fde-v04/index.html`
- Produces: A4 3페이지 PDF와 반복 가능한 빌드 명령

- [ ] **Step 1: CSS 작성**

  흰 배경, 검정·회색 본문, 2px 노란 상단선, 얇은 구분선, 10pt 이상 본문을 사용한다. 카드와 영문 eyebrow는 만들지 않는다. 2페이지는 세 프로젝트가 읽을 수 있는 크기로 들어가도록 문단 간격과 제목 계층을 조절한다.

- [ ] **Step 2: 전용 빌드 스크립트 작성**

  Chrome headless로 `resumes/kakaopay-fde-v04/index.html`을 열고 `output/pdf/versions/lim-giho-kakaopay-fde-resume-v04.pdf`에 출력한다. 기존 배포용 PDF는 출력 대상으로 사용하지 않는다.

- [ ] **Step 3: PDF 빌드와 GREEN 확인**

  Run: `scripts/build-kakaopay-fde-v04-pdf.sh && python3 scripts/verify-kakaopay-fde-v04-resume.py`

  Expected: `HTML checks passed`와 `PDF checks passed: 3 A4 pages`

- [ ] **Step 4: CSS·빌드 스크립트·PDF 커밋**

  ```bash
  git add resumes/kakaopay-fde-v04/resume.css scripts/build-kakaopay-fde-v04-pdf.sh output/pdf/versions/lim-giho-kakaopay-fde-resume-v04.pdf
  git commit -m "build: 카카오페이 FDE 이력서 v04 PDF 생성"
  ```

### Task 4: 문체와 시각 품질 검증

**Files:**
- Modify: `resumes/kakaopay-fde-v04/index.html` only if inspection finds a defect
- Modify: `resumes/kakaopay-fde-v04/resume.css` only if inspection finds a defect
- Generate: `_workspace/2026-08-02-003/final.md`
- Generate: `tmp/pdfs/kakaopay-fde-v04/page-1.png`
- Generate: `tmp/pdfs/kakaopay-fde-v04/page-2.png`
- Generate: `tmp/pdfs/kakaopay-fde-v04/page-3.png`

**Interfaces:**
- Consumes: 최신 v04 HTML과 PDF
- Produces: 문체와 렌더링 검사가 끝난 최종 v04 PDF

- [ ] **Step 1: humanize-korean 보수 점검**

  고유명사와 수치를 보호하고 반복 구조, 번역투, 홍보성 표현을 검사한다. 결과와 검사 요약을 `_workspace/2026-08-02-003/final.md`에 기록한다.

- [ ] **Step 2: PNG 렌더링과 세 페이지 확인**

  PyMuPDF로 각 페이지를 1.7배 렌더링하고, 잘림·겹침·작은 글자·과도한 빈 공간·푸터를 직접 확인한다.

- [ ] **Step 3: 보호 파일 해시 확인**

  작업 전후에 아래 파일의 SHA-256이 같은지 비교한다.

  ```text
  resumes/kakaopay-fde/index.html
  resumes/kakaopay-fde/resume.css
  scripts/build-kakaopay-fde-pdf.sh
  scripts/verify-kakaopay-fde-resume.py
  output/pdf/versions/lim-giho-kakaopay-fde-resume-v03.pdf
  output/pdf/versions/lim-giho-kakaopay-fde-resume-claude-v07.pdf
  ```

- [ ] **Step 4: 최종 자동 검사와 커밋**

  Run: `python3 scripts/verify-kakaopay-fde-v04-resume.py`

  Expected: HTML과 PDF 검사 통과. 시각 수정이 발생했으면 수정 파일과 재생성된 PDF만 커밋한다. `_workspace`와 `tmp`는 커밋하지 않는다.

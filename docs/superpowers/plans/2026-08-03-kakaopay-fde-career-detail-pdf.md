# KakaoPay FDE Career Detail PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished four-page KakaoPay FDE career-detail PDF directly from HTML/CSS, with completed results separated from ongoing expansion work.

**Architecture:** A dedicated print-only HTML/CSS source produces both a stable public PDF asset and a versioned v02 artifact through headless Chrome. A Python verifier checks wording, status labels, page count, links, and extractable text before visual PDF review.

**Tech Stack:** HTML5, CSS print layout, Bash, headless Google Chrome, Python 3, PyMuPDF

## Global Constraints

- Generate exactly four A4 pages.
- Reuse the v04 resume's yellow top rule, black headings, gray metadata, thin dividers, and minimum 9pt body text.
- Use `UFS+` exactly once, following the plain-language name `글로벌 물류 운영 시스템`.
- Keep the stable public URL `https://limgiho.github.io/assets/resume/lim-giho-kakaopay-fde-career-detail.pdf`.
- Preserve the existing Google Docs export as `output/pdf/versions/lim-giho-kakaopay-fde-career-detail-v01.pdf`.
- Publish the new PDF as both the stable asset and `output/pdf/versions/lim-giho-kakaopay-fde-career-detail-v02.pdf`.
- Do not modify the three-page v04 resume body.
- Do not add unverified metrics or outcomes.

---

### Task 1: Career-detail verifier

**Files:**
- Create: `scripts/verify-kakaopay-fde-career-detail.py`
- Test: `scripts/verify-kakaopay-fde-career-detail.py`

**Interfaces:**
- Consumes: `resumes/kakaopay-fde-career-detail/index.html`, `resumes/kakaopay-fde-career-detail/resume.css`, and the v02 PDF.
- Produces: exit code 0 only when content, status, layout, and link requirements pass.

- [ ] **Step 1: Write the failing verifier**

Create a Python verifier that requires these status phrases:

```python
REQUIRED_STATUSES = {
    "운영·확장 중",
    "구축 완료·운영 중",
    "적용·고도화 중",
    "개발 중",
    "완료",
}
```

Require all six KWE projects, four ILJIN projects, three personal projects, two Google Play URLs, the comment-filter web and development links, three page footers, exactly one `UFS+`, no Google Docs URL, and no `기술 전환 경험` section. The PDF check must require four A4 pages, at least 700 extractable characters per page, and all public links.

- [ ] **Step 2: Run the verifier and confirm RED**

Run:

```bash
python3 scripts/verify-kakaopay-fde-career-detail.py --html-only
```

Expected: `FAILED: HTML not found: resumes/kakaopay-fde-career-detail/index.html`.

- [ ] **Step 3: Commit the failing verifier**

```bash
git add scripts/verify-kakaopay-fde-career-detail.py
git commit -m "test: 상세 경력기술서 검증 기준 추가"
```

### Task 2: Four-page HTML and CSS source

**Files:**
- Create: `resumes/kakaopay-fde-career-detail/index.html`
- Create: `resumes/kakaopay-fde-career-detail/resume.css`
- Test: `scripts/verify-kakaopay-fde-career-detail.py`

**Interfaces:**
- Consumes: confirmed career facts from the v04 resume and the existing v01 detail PDF.
- Produces: four `.resume-page` sections with fixed A4 print layout.

- [ ] **Step 1: Create the HTML with exact page ownership**

Use this page mapping:

```text
Page 1: Profile, KWE overview, status timeline, platform/automation project
Page 2: CI/CD, AI-agent MVP, on-premise LLM/RAG
Page 3: Samsung charter, tax invoice renewal, ILJIN overview, freight-cost project, MES-SAP project
Page 4: MES renewal, SPC alerts, awards, personal projects, skills
```

Use past tense for shipped outcomes. Only the final sentence of active projects may use current tense:

```text
통합 플랫폼과 마감·인보이스 자동화를 구축해 운영에 적용했습니다. 현재는 대상 업무와 운영 추적 범위를 확장하고 있습니다.
PM2 수동 배포를 GitLab CI/CD와 Docker Swarm 기반으로 전환했습니다. 구축한 체계를 운영하고 있으며 Runner 분리를 후속 과제로 두고 있습니다.
삼성 전세기 프로젝트의 서류 대조와 자동검증 MVP를 완료했습니다.
```

- [ ] **Step 2: Create the CSS design system**

Define these print primitives:

```css
@page { size: A4; margin: 0; }
.resume-page { width: 210mm; height: 297mm; padding: 13mm 16mm 12mm; }
.status { font-size: 8pt; font-weight: 700; color: #555b61; }
.project-details { display: grid; grid-template-columns: 20mm 1fr; }
.page-footer { position: absolute; bottom: 5.5mm; left: 16mm; right: 16mm; }
```

Use `#f2c51f` for the top rule and active status marker, `#202124` for primary text, and `#6c7278` for secondary text. Body copy must remain at or above 9pt.

- [ ] **Step 3: Run the HTML verifier and confirm GREEN**

Run:

```bash
python3 scripts/verify-kakaopay-fde-career-detail.py --html-only
```

Expected:

```text
HTML checks passed
CSS checks passed
```

- [ ] **Step 4: Commit the source**

```bash
git add resumes/kakaopay-fde-career-detail scripts/verify-kakaopay-fde-career-detail.py
git commit -m "feat: 상세 경력기술서 HTML 구성"
```

### Task 3: PDF build, publication, and visual verification

**Files:**
- Create: `scripts/build-kakaopay-fde-career-detail-pdf.sh`
- Create: `output/pdf/versions/lim-giho-kakaopay-fde-career-detail-v02.pdf`
- Replace: `assets/resume/lim-giho-kakaopay-fde-career-detail.pdf`
- Test: `scripts/verify-kakaopay-fde-career-detail.py`

**Interfaces:**
- Consumes: the dedicated HTML/CSS source.
- Produces: byte-identical stable and versioned PDFs.

- [ ] **Step 1: Create the build script**

The script must print the HTML to a temporary v02 PDF with headless Chrome, copy that PDF to the stable asset path, and leave the v01 PDF untouched. Use `mktemp -d` for the Chrome profile and clean it through a shell trap.

- [ ] **Step 2: Build the PDF**

Run:

```bash
./scripts/build-kakaopay-fde-career-detail-pdf.sh
```

Expected: both v02 and stable asset paths are printed and both files exist.

- [ ] **Step 3: Run the full verifier**

Run:

```bash
python3 scripts/verify-kakaopay-fde-career-detail.py
```

Expected:

```text
HTML checks passed
CSS checks passed
PDF checks passed: 4 A4 pages
```

- [ ] **Step 4: Render and visually inspect all pages**

Render each page to `tmp/pdfs/kakaopay-career-detail/page-N.png` with PyMuPDF at 1.5x. Check headings, status labels, paragraph alignment, link labels, footer numbers, clipping, overlap, and excess whitespace. If any defect appears, adjust HTML/CSS, rebuild, and rerun the verifier.

- [ ] **Step 5: Confirm publication identity**

Run:

```bash
shasum -a 256 assets/resume/lim-giho-kakaopay-fde-career-detail.pdf output/pdf/versions/lim-giho-kakaopay-fde-career-detail-v02.pdf
```

Expected: identical SHA-256 hashes.

- [ ] **Step 6: Commit implementation artifacts**

```bash
git add scripts/build-kakaopay-fde-career-detail-pdf.sh scripts/verify-kakaopay-fde-career-detail.py resumes/kakaopay-fde-career-detail assets/resume/lim-giho-kakaopay-fde-career-detail.pdf output/pdf/versions/lim-giho-kakaopay-fde-career-detail-v02.pdf
git commit -m "feat: 상세 경력기술서 PDF 제작"
```

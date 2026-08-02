# KakaoPay FDE Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, three-page Korean PDF resume tailored to KakaoPay's FDE role without changing the existing general resume.

**Architecture:** Store the resume as semantic standalone HTML and print-focused CSS under `resumes/kakaopay-fde`. Build the PDF with the locally installed Google Chrome in headless print mode, then verify page count, A4 dimensions, text density, required claims, and forbidden unsupported claims with a Python verification script. Keep the generated PDF under `output/pdf` and render PNGs under `tmp/pdfs/kakaopay-fde` for visual review.

**Tech Stack:** HTML5, CSS print media, Google Chrome headless PDF printing, Python 3, PyMuPDF (`fitz`)

## Global Constraints

- Keep `_config.yml` and the existing resume PDFs unchanged.
- Create a separate three-page, single-column resume.
- Use only facts supported by the current resume or Obsidian KWE records.
- Do not claim Java/Kotlin production experience.
- Distinguish AI-assisted development from AI features embedded in products.
- Describe AEPOS and Samsung charter work as evidence within the KWE transformation, not as the overall headline.
- Do not use an unverified percentage or time-saving figure for AI-assisted development.
- Preserve names, dates, technical terms, and verified metrics during Korean humanization.
- Use white, charcoal, gray, and a restrained yellow accent; do not imitate KakaoPay branding.
- Render to A4 with exactly three non-empty pages.

---

## File Structure

- Create `resumes/kakaopay-fde/index.html`: semantic resume content and source links.
- Create `resumes/kakaopay-fde/resume.css`: screen preview and exact three-page A4 print layout.
- Create `scripts/build-kakaopay-fde-pdf.sh`: deterministic Chrome PDF build entry point.
- Create `scripts/verify-kakaopay-fde-resume.py`: HTML claim checks and PDF layout checks.
- Create `output/pdf/lim-giho-kakaopay-fde-resume.pdf`: generated application PDF.
- Generate `tmp/pdfs/kakaopay-fde/page-*.png`: temporary visual QA images, not committed.

### Task 1: Add automated content and PDF verification

**Files:**
- Create: `scripts/verify-kakaopay-fde-resume.py`

**Interfaces:**
- Consumes: `resumes/kakaopay-fde/index.html` and optional `output/pdf/lim-giho-kakaopay-fde-resume.pdf`
- Produces: exit code 0 with `HTML checks passed` and `PDF checks passed: 3 A4 pages`, or a descriptive assertion failure

- [ ] **Step 1: Create the verification script**

```python
#!/usr/bin/env python3
from pathlib import Path
import sys

import fitz

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "resumes/kakaopay-fde/index.html"
PDF = ROOT / "output/pdf/lim-giho-kakaopay-fde-resume.pdf"

required = [
    "Enterprise Platform",
    "AI-enabled Delivery",
    "15종",
    "10분",
    "5초",
    "1,200시간",
    "1,000만 건",
    "Local LLM",
    "human-in-the-loop",
]
forbidden = [
    "Java/Kotlin 실무 경험",
    "Java/Kotlin 운영 경험 보유",
    "AI로 생산성 100%",
    "구현비용 제로",
]

text = HTML.read_text(encoding="utf-8")
for phrase in required:
    assert phrase in text, f"missing required phrase: {phrase}"
for phrase in forbidden:
    assert phrase not in text, f"unsupported phrase present: {phrase}"
print("HTML checks passed")

if "--html-only" in sys.argv:
    raise SystemExit(0)

doc = fitz.open(PDF)
assert doc.page_count == 3, f"expected 3 pages, got {doc.page_count}"
for index, page in enumerate(doc, start=1):
    width, height = page.rect.width, page.rect.height
    assert abs(width - 595.28) < 3, f"page {index} width is not A4: {width}"
    assert abs(height - 841.89) < 3, f"page {index} height is not A4: {height}"
    page_text = page.get_text().strip()
    assert len(page_text) >= 700, f"page {index} is too sparse: {len(page_text)} chars"
print("PDF checks passed: 3 A4 pages")
```

- [ ] **Step 2: Run the HTML-only check and verify it fails before content exists**

Run: `python3 scripts/verify-kakaopay-fde-resume.py --html-only`

Expected: FAIL with `FileNotFoundError` for `resumes/kakaopay-fde/index.html`.

- [ ] **Step 3: Commit the verification contract**

```bash
git add scripts/verify-kakaopay-fde-resume.py
git commit -m "test: 카카오페이 FDE 이력서 검증 추가"
```

### Task 2: Write the standalone resume content

**Files:**
- Create: `resumes/kakaopay-fde/index.html`

**Interfaces:**
- Consumes: facts in `_config.yml`, `docs/superpowers/specs/2026-08-02-kakaopay-fde-resume-design.md`, and Obsidian KWE `agent` records
- Produces: three `.resume-page` sections with semantic content and no dependency on Jekyll

- [ ] **Step 1: Create the HTML document and page-one positioning**

Use a document header with `lang="ko"`, UTF-8, viewport metadata, `resume.css`, and title `임기호 - 카카오페이 FDE 지원 이력서`.

Page one must contain these exact content blocks:

```html
<h1>임기호</h1>
<p class="role">Software Engineer | Enterprise Platform · AI-enabled Delivery · Automation</p>
<p class="summary">파편화된 현업 업무를 하나의 운영 플랫폼으로 전환하고, 동작하는 MVP를 빠르게 제공해 현업과 함께 요구사항과 예외를 발견해 온 엔지니어입니다. 최근에는 AI를 설계·구현·검증 과정에 활용해 더 많은 가설을 짧은 주기로 확인하고, Local LLM을 실제 문서 처리와 내부 검색에 적용하고 있습니다.</p>
```

Add two role-fit blocks titled `전사 주요 프로젝트` and `AI 기반 업무 생산성`, followed by a four-step `KWE Transformation Journey` using the stages `통합 방향 수립`, `운영 플랫폼 구축`, `개발·운영 기반 정비`, and `AI 기반 고속 MVP`.

Add verified metric cards for `15종 → 5개 업무 플랫폼`, `수작업 10분 → 5초`, `월 1,200시간 절감`, and `1,000만 건 데이터 이전`.

- [ ] **Step 2: Add page-two selected evidence**

Create three evidence sections with these headings:

1. `통합 운영 플랫폼 전환`
2. `AI 에이전트 기반 MVP와 업무 발견`
3. `Local LLM 기반 업무 자동화`

For each section use the labels `문제`, `판단과 구현`, and `검증과 변화`.

The second section must distinguish development acceleration from embedded AI and include Samsung charter real-document analysis, the AEPOS legacy-data UI harness, and the OneDrive standalone MVP as examples of executable prototypes used to discover requirements.

The third section must include export-declaration PDF extraction, grouped-page context, partial success, repeated evaluation, the R&R deterministic candidate boundary, and fallback behavior. It must include the phrase `human-in-the-loop` only as a parenthetical explanation after natural Korean wording.

- [ ] **Step 3: Add page-three career and technical foundation**

Add career entries for KWE Korea (`2022.01 ~ 현재`) and ILJIN Global (`2010.12 ~ 2022.01`). Keep the KWE entry focused on the transformation program. Keep the ILJIN entry focused on MES modernization, SAP integration, global factory rollout, SPC processing, promotion, and award.

Add skill groups for `Backend`, `Frontend`, `Data`, `Operations`, `AI & Automation`, and `Stack Adaptability`. In `Stack Adaptability`, state the progression `VB6 → C#/.NET → Node.js/NestJS` and explain that DI, domain boundaries, transactions, asynchronous processing, testing, and operations are transferable foundations. Do not name Java or Kotlin in this block.

Add a short personal-project block for the on-device comment filter and links to GitHub, the current detailed resume, and the development article.

- [ ] **Step 4: Run the HTML verification**

Run: `python3 scripts/verify-kakaopay-fde-resume.py --html-only`

Expected: `HTML checks passed`.

- [ ] **Step 5: Commit the content source**

```bash
git add resumes/kakaopay-fde/index.html
git commit -m "docs: 카카오페이 FDE 전용 이력서 내용 작성"
```

### Task 3: Implement the three-page print layout

**Files:**
- Create: `resumes/kakaopay-fde/resume.css`

**Interfaces:**
- Consumes: `.resume`, `.resume-page`, `.metric-grid`, `.journey`, `.evidence`, `.career`, and `.skill-grid` classes from the HTML
- Produces: A4 pages with explicit page breaks and a usable screen preview

- [ ] **Step 1: Add typography and screen preview styles**

Use this font stack and palette:

```css
:root {
  --ink: #202124;
  --muted: #5f6368;
  --line: #d9dde3;
  --paper: #ffffff;
  --canvas: #edf0f3;
  --accent: #f2cf32;
  --accent-soft: #fff8cf;
}

body {
  margin: 0;
  color: var(--ink);
  background: var(--canvas);
  font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  font-size: 10.2pt;
  line-height: 1.55;
  word-break: keep-all;
}
```

Center each page on screen with a subtle shadow and an A4 aspect ratio.

- [ ] **Step 2: Add print styles and explicit page boundaries**

```css
@page {
  size: A4;
  margin: 0;
}

@media print {
  body { background: #fff; }
  .resume { margin: 0; }
  .resume-page {
    width: 210mm;
    height: 297mm;
    padding: 13mm 15mm 12mm;
    box-sizing: border-box;
    break-after: page;
    box-shadow: none;
    overflow: hidden;
  }
  .resume-page:last-child { break-after: auto; }
  a { color: inherit; text-decoration: none; }
}
```

Keep body copy at 10pt or larger in print. Use yellow only for a 3px top rule, metric highlights, and small section markers. Avoid multi-column body text; a two-column grid is allowed only for short metric and skill blocks.

- [ ] **Step 3: Commit the layout**

```bash
git add resumes/kakaopay-fde/resume.css
git commit -m "style: 카카오페이 FDE 이력서 3페이지 레이아웃 추가"
```

### Task 4: Add the PDF build entry point

**Files:**
- Create: `scripts/build-kakaopay-fde-pdf.sh`

**Interfaces:**
- Consumes: `resumes/kakaopay-fde/index.html`
- Produces: `output/pdf/lim-giho-kakaopay-fde-resume.pdf`

- [ ] **Step 1: Add the build script**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CHROME_BIN="${KAKAOPAY_RESUME_CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
INPUT_HTML="$ROOT_DIR/resumes/kakaopay-fde/index.html"
OUTPUT_DIR="$ROOT_DIR/output/pdf"
OUTPUT_PDF="$OUTPUT_DIR/lim-giho-kakaopay-fde-resume.pdf"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome executable not found: $CHROME_BIN" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$OUTPUT_PDF" \
  "file://$INPUT_HTML"

echo "$OUTPUT_PDF"
```

- [ ] **Step 2: Make the script executable and build**

Run:

```bash
chmod +x scripts/build-kakaopay-fde-pdf.sh
scripts/build-kakaopay-fde-pdf.sh
```

Expected: Chrome reports the PDF byte count and the script prints the stable output path.

- [ ] **Step 3: Run PDF verification**

Run: `python3 scripts/verify-kakaopay-fde-resume.py`

Expected: `HTML checks passed` followed by `PDF checks passed: 3 A4 pages`.

- [ ] **Step 4: Commit the build script and generated PDF**

```bash
git add scripts/build-kakaopay-fde-pdf.sh output/pdf/lim-giho-kakaopay-fde-resume.pdf
git commit -m "build: 카카오페이 FDE 이력서 PDF 생성"
```

### Task 5: Humanize and visually verify the final resume

**Files:**
- Modify: `resumes/kakaopay-fde/index.html`
- Regenerate: `output/pdf/lim-giho-kakaopay-fde-resume.pdf`
- Generate temporarily: `tmp/pdfs/kakaopay-fde/page-1.png`, `page-2.png`, `page-3.png`

**Interfaces:**
- Consumes: the completed HTML and installed `humanize-korean` guidance
- Produces: final natural Korean copy with unchanged facts and a visually clean three-page PDF

- [ ] **Step 1: Apply conservative Korean humanization**

Review the HTML copy for translation-like `~를 통해`, repeated `또한/따라서`, inflated words such as `혁신`, mechanical three-part parallelism, repeated sentence endings, unnecessary English parentheses, bold saturation, and identical bullet rhythm. Change only affected spans. Preserve all names, dates, metrics, and technical terms.

- [ ] **Step 2: Rebuild and rerun deterministic checks**

Run:

```bash
scripts/build-kakaopay-fde-pdf.sh
python3 scripts/verify-kakaopay-fde-resume.py
git diff --check
```

Expected: three A4 pages, no unsupported claims, and no whitespace errors.

- [ ] **Step 3: Render all PDF pages to PNG**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import fitz

root = Path.cwd()
pdf = root / "output/pdf/lim-giho-kakaopay-fde-resume.pdf"
out = root / "tmp/pdfs/kakaopay-fde"
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(pdf)
for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
    pix.save(out / f"page-{i}.png")
PY
```

- [ ] **Step 4: Inspect all three PNGs**

Check that no text is clipped, section headings do not orphan at page bottoms, metric cards align, line lengths are comfortable, links are readable, page three is not sparse, and font size is visibly larger than the current five-page PDF.

- [ ] **Step 5: Commit the final copy and regenerated PDF**

```bash
git add resumes/kakaopay-fde/index.html output/pdf/lim-giho-kakaopay-fde-resume.pdf
git commit -m "docs: 카카오페이 FDE 이력서 문안과 레이아웃 확정"
```

## Final Verification

Run:

```bash
python3 scripts/verify-kakaopay-fde-resume.py
git status --short
```

Expected:

- `HTML checks passed`
- `PDF checks passed: 3 A4 pages`
- Existing unrelated user changes remain untouched.

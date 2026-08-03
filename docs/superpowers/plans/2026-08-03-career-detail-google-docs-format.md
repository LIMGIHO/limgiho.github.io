# Career Detail Google Docs Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every visible word in the current detailed career document unchanged while converting its visual treatment to a plain Google Docs-style PDF.

**Architecture:** Preserve `index.html` byte-for-byte and implement the change only in the document stylesheet. Verify the source HTML checksum before and after, then build and visually inspect every PDF page.

**Tech Stack:** HTML, CSS print styles, headless Chrome, PyMuPDF

## Global Constraints

- Do not change, add, remove, or reorder visible text.
- Keep the existing four-page document and stable public PDF path.
- Use a white page, generous document margins, simple headings, rules, bullets, and restrained typography.
- Remove card-like status pills, colored bands, shadows, and dashboard-style timeline blocks.

---

### Task 1: Add layout regression checks

**Files:**
- Modify: `scripts/verify-kakaopay-fde-career-detail.py`

- [ ] Add assertions for the plain document format and removal of card styling.
- [ ] Run the HTML-only verifier and confirm it fails against the current card layout.

### Task 2: Convert the stylesheet without touching copy

**Files:**
- Modify: `resumes/kakaopay-fde-career-detail/resume.css`

- [ ] Record the checksum of `index.html`.
- [ ] Replace the visual rules with a Google Docs-style document layout.
- [ ] Confirm the `index.html` checksum is unchanged.
- [ ] Run the HTML-only verifier and confirm it passes.

### Task 3: Build and inspect the PDF

**Files:**
- Modify: `assets/resume/lim-giho-kakaopay-fde-career-detail.pdf`
- Modify: `output/pdf/versions/lim-giho-kakaopay-fde-career-detail-v02.pdf`

- [ ] Build the PDF with the existing script.
- [ ] Run the full verifier and compare extracted text with the source document.
- [ ] Render every page to `tmp/pdfs/` and inspect for clipping, overlaps, and weak page breaks.
- [ ] Remove temporary renders after visual approval.

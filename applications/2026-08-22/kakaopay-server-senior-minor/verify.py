#!/usr/bin/env python3
from pathlib import Path
import shutil
import subprocess
import sys


APP_DIR = Path(__file__).resolve().parent
ROOT = APP_DIR.parents[2]
PDF = APP_DIR / "portfolio.pdf"
EXPECTED_PAGE_COUNT = 7

REQUIRED_FILES = (
    APP_DIR / "README.md",
    APP_DIR / "job-posting.md",
    APP_DIR / "fit-analysis.md",
    APP_DIR / "cover-letter.md",
    APP_DIR / "portfolio/index.md",
    APP_DIR / "resume.pdf",
    APP_DIR / "build.sh",
)

REQUIRED_TEXT = (
    "SERVER · PLATFORM · RELIABILITY",
    "문서 처리",
    "배포",
    "현장 PDA 앱",
    "Web",
    "API",
    "외부 시스템 8종",
    "로컬 LLM",
    "PostgreSQL",
    "작업 계약 · 큐",
    "Worker",
)


def pdf_document():
    try:
        import pymupdf as fitz
    except ImportError:
        try:
            import fitz
        except ImportError:
            return None
    return fitz.open(PDF)


def pdf_page_count_and_text():
    document = pdf_document()
    if document is not None:
        return document.page_count, "\n".join(page.get_text() for page in document)

    if not shutil.which("pdfinfo") or not shutil.which("pdftotext"):
        raise SystemExit(
            "PDF verification requires PyMuPDF or Poppler (pdfinfo and pdftotext)"
        )

    info = subprocess.check_output(["pdfinfo", str(PDF)], text=True)
    pages = next(
        int(line.split(":", 1)[1].strip())
        for line in info.splitlines()
        if line.startswith("Pages:")
    )
    text = subprocess.check_output(["pdftotext", str(PDF), "-"], text=True)
    return pages, text


def verify_files() -> None:
    for path in REQUIRED_FILES:
        if not path.is_file():
            raise AssertionError(f"missing required file: {path.relative_to(APP_DIR)}")
    if not PDF.is_file() or PDF.stat().st_size == 0:
        raise AssertionError("portfolio.pdf is missing or empty")


def verify_pdf() -> None:
    page_count, text = pdf_page_count_and_text()
    if page_count != EXPECTED_PAGE_COUNT:
        raise AssertionError(
            f"portfolio.pdf must use the normalized {EXPECTED_PAGE_COUNT}-page layout "
            f"(got {page_count})"
        )
    for phrase in REQUIRED_TEXT:
        if phrase not in text:
            raise AssertionError(f"PDF missing required text: {phrase}")
    print(f"PDF checks passed: {page_count} pages, {len(text)} extracted characters")


def main() -> None:
    verify_files()
    print("Support package files passed")
    if "--html-only" not in sys.argv:
        verify_pdf()


if __name__ == "__main__":
    main()

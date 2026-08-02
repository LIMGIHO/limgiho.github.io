#!/usr/bin/env python3
from pathlib import Path
import sys

import fitz


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "resumes/kakaopay-fde/index.html"
PDF = ROOT / "output/pdf/lim-giho-kakaopay-fde-resume.pdf"

REQUIRED = [
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

FORBIDDEN = [
    "Java/Kotlin 실무 경험",
    "Java/Kotlin 운영 경험 보유",
    "AI로 생산성 100%",
    "구현비용 제로",
]


def verify_html() -> None:
    text = HTML.read_text(encoding="utf-8")

    for phrase in REQUIRED:
        assert phrase in text, f"missing required phrase: {phrase}"

    for phrase in FORBIDDEN:
        assert phrase not in text, f"unsupported phrase present: {phrase}"

    print("HTML checks passed")


def verify_pdf() -> None:
    doc = fitz.open(PDF)
    assert doc.page_count == 3, f"expected 3 pages, got {doc.page_count}"

    for index, page in enumerate(doc, start=1):
        width, height = page.rect.width, page.rect.height
        assert abs(width - 595.28) < 3, f"page {index} width is not A4: {width}"
        assert abs(height - 841.89) < 3, f"page {index} height is not A4: {height}"

        page_text = page.get_text().strip()
        assert len(page_text) >= 700, f"page {index} is too sparse: {len(page_text)} chars"

    print("PDF checks passed: 3 A4 pages")


def main() -> None:
    verify_html()
    if "--html-only" not in sys.argv:
        verify_pdf()


if __name__ == "__main__":
    main()

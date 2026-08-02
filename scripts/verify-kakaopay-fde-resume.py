#!/usr/bin/env python3
from pathlib import Path
import sys

import fitz


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "resumes/kakaopay-fde/index.html"
PDF = ROOT / "output/pdf/lim-giho-kakaopay-fde-resume.pdf"

REQUIRED = [
    "경력 요약",
    "KWE 주요 업무",
    "주요 결과",
    "주요 프로젝트",
    "경력 및 기술",
    "15종",
    "10분",
    "5초",
    "1,200시간",
    "1,000만 건",
    "Local LLM",
    "human-in-the-loop",
]

FORBIDDEN = [
    "KAKAO PAY FDE APPLICATION",
    "이 역할과 맞닿는 두 가지 경험",
    "KWE Transformation Journey",
    "SELECTED EVIDENCE",
    "문제를 찾고, 작동하는 시스템으로 확인했습니다",
    "CAREER & FOUNDATION",
    "여러 기술을 거쳤지만, 문제를 푸는 기준은 같았습니다",
    "새로운 코드베이스에 들어가는 방식",
    "IM GIHO",
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

    footer_marker = "<span>limgiho</span>"
    assert text.count(footer_marker) == 3, "expected limgiho in all 3 page footers"
    assert text.count("AEPOS") == 1, "expected AEPOS to appear once as a supporting example"

    print("HTML checks passed")


def verify_pdf() -> None:
    doc = fitz.open(PDF)
    assert doc.page_count == 3, f"expected 3 pages, got {doc.page_count}"

    extracted_pages = []
    for index, page in enumerate(doc, start=1):
        width, height = page.rect.width, page.rect.height
        assert abs(width - 595.28) < 3, f"page {index} width is not A4: {width}"
        assert abs(height - 841.89) < 3, f"page {index} height is not A4: {height}"

        page_text = page.get_text().strip()
        assert len(page_text) >= 700, f"page {index} is too sparse: {len(page_text)} chars"
        extracted_pages.append(page_text)

    extracted_text = "\n".join(extracted_pages)
    for phrase in REQUIRED:
        assert phrase in extracted_text, f"PDF missing required phrase: {phrase}"

    for phrase in FORBIDDEN:
        assert phrase not in extracted_text, f"PDF contains forbidden phrase: {phrase}"

    footer_lines = [
        line.strip()
        for page_text in extracted_pages
        for line in page_text.splitlines()
        if line.strip() == "limgiho"
    ]
    assert len(footer_lines) == 3, "expected limgiho in all 3 PDF page footers"

    print("PDF checks passed: 3 A4 pages")


def main() -> None:
    verify_html()
    if "--html-only" not in sys.argv:
        verify_pdf()


if __name__ == "__main__":
    main()

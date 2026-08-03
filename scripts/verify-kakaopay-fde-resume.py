#!/usr/bin/env python3
from pathlib import Path
import hashlib
import sys

import fitz


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "resumes/kakaopay-fde/index.html"
CSS = ROOT / "resumes/kakaopay-fde/resume.css"
DETAIL_PDF = ROOT / "resumes/kakaopay-fde/_config_20260413.pdf"
OUTPUT_PDF = ROOT / "output/pdf/lim-giho-kakaopay-fde-resume.pdf"
PUBLIC_PDF = ROOT / "assets/resume/lim-giho-kakaopay-fde-resume.pdf"
DETAIL_URL = "https://limgiho.github.io/resumes/kakaopay-fde/_config_20260413.pdf"

REQUIRED = [
    "소개",
    "사용자와 팀의 효율을 함께 높이는 개발자를 지향합니다.",
    "KWE 주요 업무",
    "다양한 기술 스택의 15종 이상 프로그램 → 단일 통합 플랫폼",
    "월 1,200시간 상당 반복 작업 절감",
    "AI 에이전트를 이용한 MVP 개발과 요구사항 확인",
    "삼성 전세기 프로젝트 IT 지원",
    "온프레미스 LLM이 주소·품목·수량·금액을 미리 정의한 JSON 키에 매핑",
    "월 약 200시간의 수작업 확인 시간을 절감",
    "경력 및 기술",
]

FORBIDDEN = [
    "경력 요약",
    "5개 업무 플랫폼",
    "온프레미스 LLM 기반 문서 처리와 담당 업무 검색",
    "기술 전환 경험",
    "IM GIHO",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_html() -> None:
    assert HTML.is_file(), f"missing canonical HTML: {HTML}"
    assert CSS.is_file(), f"missing canonical CSS: {CSS}"
    assert DETAIL_PDF.is_file(), f"missing detailed career PDF: {DETAIL_PDF}"

    text = HTML.read_text(encoding="utf-8")
    for phrase in REQUIRED:
        assert phrase in text, f"missing required phrase: {phrase}"
    for phrase in FORBIDDEN:
        assert phrase not in text, f"outdated phrase present: {phrase}"

    assert text.count(DETAIL_URL) == 2, "expected the requested detail URL in both links"
    assert text.count("<section class=\"resume-page") == 3, "expected 3 source pages"
    assert text.count("<span>limgiho</span>") == 3, "expected 3 page footers"
    for page_number in ("1 / 3", "2 / 3", "3 / 3"):
        assert page_number in text, f"missing footer: {page_number}"

    page_two = text.split('<section class="resume-page page-projects"', 1)[1]
    page_two = page_two.split('<section class="resume-page page-career"', 1)[0]
    assert "삼성 전세기 프로젝트 IT 지원" in page_two, "Samsung project must be on page 2"

    detail = fitz.open(DETAIL_PDF)
    assert detail.page_count > 0, "detailed career PDF is empty"
    print(f"HTML checks passed; detailed PDF: {detail.page_count} pages")


def verify_pdf() -> None:
    assert OUTPUT_PDF.is_file(), f"missing final PDF: {OUTPUT_PDF}"
    assert PUBLIC_PDF.is_file(), f"missing deployable PDF: {PUBLIC_PDF}"
    assert sha256(OUTPUT_PDF) == sha256(PUBLIC_PDF), "output and deployable PDFs differ"

    doc = fitz.open(OUTPUT_PDF)
    assert doc.page_count == 3, f"expected 3 pages, got {doc.page_count}"

    pages = []
    urls = []
    for index, page in enumerate(doc, start=1):
        width, height = page.rect.width, page.rect.height
        assert abs(width - 595.28) < 3, f"page {index} width is not A4: {width}"
        assert abs(height - 841.89) < 3, f"page {index} height is not A4: {height}"
        page_text = page.get_text().strip()
        assert len(page_text) >= 500, f"page {index} is too sparse: {len(page_text)} chars"
        pages.append(page_text)
        urls.extend(link.get("uri") for link in page.get_links() if link.get("uri"))

    extracted = "".join("".join(pages).split())
    for phrase in REQUIRED:
        assert "".join(phrase.split()) in extracted, f"PDF missing required phrase: {phrase}"
    for phrase in FORBIDDEN:
        assert "".join(phrase.split()) not in extracted, f"PDF contains outdated phrase: {phrase}"

    assert urls.count(DETAIL_URL) == 2, "PDF must contain two clickable detail links"
    for index, page_text in enumerate(pages, start=1):
        assert f"{index} / 3" in page_text, f"PDF page {index} footer is missing"

    print("PDF checks passed: 3 A4 pages, 2 detailed-career links")


def main() -> None:
    verify_html()
    if "--html-only" not in sys.argv:
        verify_pdf()


if __name__ == "__main__":
    main()

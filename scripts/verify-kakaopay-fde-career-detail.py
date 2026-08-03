#!/usr/bin/env python3
"""Validate the KakaoPay FDE career-detail HTML and generated PDFs."""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "resumes/kakaopay-fde-career-detail/index.html"
CSS = ROOT / "resumes/kakaopay-fde-career-detail/resume.css"
VERSIONED_PDF = (
    ROOT / "output/pdf/versions/lim-giho-kakaopay-fde-career-detail-gdocs-v03.pdf"
)
PUBLIC_PDF = ROOT / "assets/resume/lim-giho-kakaopay-fde-career-detail.pdf"

REQUIRED_PHRASES = [
    "운영·확장 중",
    "구축 완료·운영 중",
    "적용·고도화 중",
    "개발 중",
    "완료",
    "업무 플랫폼 통합과 글로벌 물류 운영 자동화",
    "GitLab CI/CD와 컨테이너 배포 체계 구축",
    "AI 에이전트를 이용한 MVP 개발과 요구사항 확인",
    "온프레미스 LLM 문서 구조화와 RAG 담당 업무 검색",
    "삼성 전세기 프로젝트 IT 지원",
    "세금계산서 프로그램 리뉴얼",
    "8개 공장 운반비 전산화",
    "MES-SAP 실시간 인터페이스",
    "제천·슬로바키아 공장 MES 리뉴얼",
    "SPC 이상 현상 실시간 알림",
    "월 1,200시간",
    "월 약 200시간",
    "건당 10분에서 5초 이내",
    "1,000만 건",
    "HealthDog",
    "액션독",
]

FORBIDDEN_PHRASES = [
    "docs.google.com/document",
    "기술 전환 경험",
    "글로벌 시스템 UFS+",
    "UFS+ 업무 자동화",
    "본사",
    "무인 연동",
    "AEPOS",
    "5개 업무 플랫폼",
]

REQUIRED_URLS = {
    "mailto:lasid84@gmail.com",
    "https://github.com/limgiho",
    "https://play.google.com/store/apps/details?id=com.giholim.commentfilter&hl=ko",
    "https://merbl-filter.vercel.app/posts",
    "https://velog.io/@lasid84/commentfilter-1",
    "https://play.google.com/store/apps/details?id=com.healthdog.app",
    "https://play.google.com/store/apps/details?id=com.giholim.actiondog",
}

GOOGLE_DOCS_PDF_REQUIRED_PHRASES = [
    "경력기술서",
    "업무 플랫폼 통합과 글로벌 시스템 자동화",
    "GitLab CI/CD와 컨테이너 배포 체계 구축",
    "AI 에이전트를 이용한 MVP 개발과 요구사항 확인",
    "온프레미스 LLM 문서 구조화와 RAG 담당 업무 검색",
    "삼성 전세기 프로젝트 IT 지원",
    "세금계산서 프로그램 리뉴얼",
    "ILJIN Global",
    "월 1,200시간",
    "월 약 200시간",
    "HealthDog",
    "액션독",
]

GOOGLE_DOCS_PDF_REQUIRED_URLS = {
    "https://github.com/limgiho",
}


def fail(message: str) -> None:
    raise AssertionError(message)


def compact(value: str) -> str:
    return re.sub(r"\s+", "", value)


def check_phrases(text: str, label: str) -> None:
    compact_text = compact(text)
    for phrase in REQUIRED_PHRASES:
        if phrase not in text and compact(phrase) not in compact_text:
            fail(f"{label}: required phrase missing: {phrase}")
    for phrase in FORBIDDEN_PHRASES:
        if phrase in text or compact(phrase) in compact_text:
            fail(f"{label}: forbidden phrase found: {phrase}")


def check_css() -> None:
    if not CSS.exists():
        fail(f"CSS not found: {CSS.relative_to(ROOT)}")
    css = CSS.read_text(encoding="utf-8")
    for selector in (".resume-page", ".status", ".project-details", ".page-footer"):
        if selector not in css:
            fail(f"CSS: required selector missing: {selector}")
    if "@page" not in css or "size: A4" not in css:
        fail("CSS: A4 page rule missing")
    compact_css = compact(css)
    document_format_rules = {
        "page decoration removed": ".resume-page::before{display:none;}",
        "flat page surface": "box-shadow:none;",
        "plain status labels": ".status{background:transparent;border:0;border-radius:0;",
        "linear project timeline": ".status-timeline{display:block;",
        "support label remains visible": ".intro.eyebrow{display:block;",
    }
    for label, rule in document_format_rules.items():
        if compact(rule) not in compact_css:
            fail(f"CSS: Google Docs-style rule missing: {label}")
    font_sizes = [float(value) for value in re.findall(r"font-size:\s*([0-9.]+)pt", css)]
    if not font_sizes or min(size for size in font_sizes if size >= 8) < 8:
        fail("CSS: readable font-size rules missing")
    print("CSS checks passed")


def check_html() -> None:
    if not HTML.exists():
        fail(f"HTML not found: {HTML.relative_to(ROOT)}")
    text = HTML.read_text(encoding="utf-8")
    check_phrases(text, "HTML")
    if text.count("UFS+") != 1:
        fail(f"HTML: expected UFS+ once, found {text.count('UFS+')}")
    if len(re.findall(r'<section class="resume-page', text)) != 4:
        fail("HTML: expected exactly four resume pages")
    if len(re.findall(r"<span>\s*limgiho\s*</span>", text)) != 4:
        fail("HTML: expected four limgiho footers")
    for index in range(1, 5):
        if f"{index} / 4" not in text:
            fail(f"HTML: footer page number missing: {index} / 4")
    for url in REQUIRED_URLS:
        html_url = url.replace("&", "&amp;")
        if url not in text and html_url not in text:
            fail(f"HTML: required URL missing: {url}")
    if text.count("하고 있습니다") > 4:
        fail("HTML: ongoing-tense wording is repeated too often")
    check_css()
    print("HTML checks passed")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_pdf() -> None:
    for path in (VERSIONED_PDF, PUBLIC_PDF):
        if not path.exists():
            fail(f"PDF not found: {path.relative_to(ROOT)}")
    if sha256(VERSIONED_PDF) != sha256(PUBLIC_PDF):
        fail("PDF: versioned and public files differ")

    document = fitz.open(VERSIONED_PDF)
    try:
        if document.page_count != 4:
            fail(f"PDF: expected 4 pages, found {document.page_count}")
        page_texts: list[str] = []
        pdf_urls: set[str] = set()
        for index, page in enumerate(document, start=1):
            rect = page.rect
            if abs(rect.width - 595.28) > 2 or abs(rect.height - 841.89) > 2:
                fail(
                    f"PDF page {index}: expected A4, found "
                    f"{rect.width:.2f} x {rect.height:.2f} pt"
                )
            page_text = page.get_text("text")
            if len(page_text.strip()) < 100:
                fail(
                    f"PDF page {index}: too little extractable text "
                    f"({len(page_text.strip())} chars)"
                )
            page_texts.append(page_text)
            pdf_urls.update(
                link["uri"] for link in page.get_links() if link.get("uri")
            )

        full_text = "\n".join(page_texts)
        compact_pdf_text = compact(full_text)
        for phrase in GOOGLE_DOCS_PDF_REQUIRED_PHRASES:
            if compact(phrase) not in compact_pdf_text:
                fail(f"PDF: Google Docs phrase missing: {phrase}")
        missing_urls = GOOGLE_DOCS_PDF_REQUIRED_URLS - pdf_urls
        if missing_urls:
            fail(f"PDF: required URLs missing: {sorted(missing_urls)}")
    finally:
        document.close()

    print("PDF checks passed: Google Docs original, 4 A4 pages")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--html-only",
        action="store_true",
        help="validate HTML and CSS without requiring generated PDFs",
    )
    args = parser.parse_args()

    try:
        check_html()
        if not args.html_only:
            check_pdf()
    except AssertionError as error:
        print(f"FAILED: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Validate the dedicated KakaoPay FDE resume v04 HTML and PDF."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "resumes/kakaopay-fde-v04/index.html"
CSS = ROOT / "resumes/kakaopay-fde-v04/resume.css"
PDF = ROOT / "output/pdf/versions/lim-giho-kakaopay-fde-resume-v04.pdf"

REQUIRED = [
    "경력 요약",
    "KWE 주요 업무",
    "주요 결과",
    "주요 프로젝트",
    "삼성SDS 전세기 프로젝트 IT 지원",
    "9종",
    "55개",
    "하루 20건",
    "월 약 200시간 규모",
    "글로벌 시스템 UFS+",
    "업무 플랫폼 통합과 글로벌 시스템 자동화",
    "세계 80개국",
    "하우스 마감",
    "인보이스 생성",
    "마스터 마감",
    "월 1,200시간",
    "프론트엔드·API·Worker·공용 라이브러리",
    "내부 HTTP API",
    "Playwright E2E 테스트",
    "레거시 실데이터",
    "RAG",
    "형식이 다른 물류·통관 문서",
    "미리 정의한 JSON 스키마",
    "지정된 JSON 키",
    "텍스트가 포함된 PDF",
    "스캔본",
    "OCR",
    "HealthDog",
    "액션톡",
    "Local LLM",
    "human-in-the-loop",
]

FORBIDDEN = [
    "이 역할과 맞닿는",
    "KAKAO PAY FDE APPLICATION",
    "IM GIHO",
    "월 200시간 절감",
    "40개 이상의 작업 단위",
    "NestJS를 고른 이유",
    "Java/Kotlin",
    "본사",
    "무인 연동",
    "AEPOS",
    "3개 DBMS",
    "부서를 옮겨",
    "화면과 배치가 같은 조회 경로",
    "벤더마다 형식",
    "19개",
    "판단 기준이 없는 14개",
    "추출할 수 없는 9개",
    "현업 정의를 기다리는 13개",
    "2010년부터 제조 MES",
    "수출신고필증은 국가에서 발행",
    "문서 처리와 담당자 검색(RAG)",
]

MINIMUM_FONT_SIZES = {
    ".project-tech": 8.0,
    ".project-details dt": 9.1,
    ".project-details dd": 9.7,
    ".career li": 9.2,
    ".skill-list dd": 8.9,
    ".stack-section p": 9.1,
    ".personal-project p": 9.1,
    ".personal-more": 9.1,
    ".project-links": 8.4,
}


def fail(message: str) -> None:
    raise AssertionError(message)


def check_phrases(text: str, label: str) -> None:
    compact_text = re.sub(r"\s+", "", text)
    for phrase in REQUIRED:
        compact_phrase = re.sub(r"\s+", "", phrase)
        if phrase not in text and compact_phrase not in compact_text:
            fail(f"{label}: required phrase missing: {phrase}")
    for phrase in FORBIDDEN:
        compact_phrase = re.sub(r"\s+", "", phrase)
        if phrase in text or compact_phrase in compact_text:
            fail(f"{label}: forbidden phrase found: {phrase}")


def font_size_for_selector(css: str, selector: str) -> float:
    for selector_group, declarations in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        selectors = [item.strip() for item in selector_group.split(",")]
        if selector not in selectors:
            continue
        match = re.search(r"font-size:\s*([0-9.]+)pt", declarations)
        if match:
            return float(match.group(1))
    fail(f"CSS: font-size rule missing for {selector}")
    return 0


def check_css() -> None:
    if not CSS.exists():
        fail(f"CSS not found: {CSS.relative_to(ROOT)}")

    css = CSS.read_text(encoding="utf-8")
    for selector in (".history-list li::before", ".history-list li::after"):
        if selector not in css:
            fail(f"CSS: timeline selector missing: {selector}")

    for selector, minimum in MINIMUM_FONT_SIZES.items():
        actual = font_size_for_selector(css, selector)
        if actual < minimum:
            fail(
                f"CSS: {selector} font-size {actual:g}pt is below "
                f"the {minimum:g}pt minimum"
            )

    print("CSS checks passed")


def check_html() -> None:
    if not HTML.exists():
        fail(f"HTML not found: {HTML.relative_to(ROOT)}")

    text = HTML.read_text(encoding="utf-8")
    check_phrases(text, "HTML")

    footer_count = len(re.findall(r"<span>\s*limgiho\s*</span>", text))
    if footer_count != 3:
        fail(f"HTML: expected 3 limgiho footers, found {footer_count}")
    if len(re.findall(r"<ol class=\"history-list\">.*?</ol>", text, re.DOTALL)) != 1:
        fail("HTML: expected one KWE timeline")

    print("HTML checks passed")
    check_css()


def check_pdf() -> None:
    if not PDF.exists():
        fail(f"PDF not found: {PDF.relative_to(ROOT)}")

    document = fitz.open(PDF)
    try:
        if document.page_count != 3:
            fail(f"PDF: expected 3 pages, found {document.page_count}")

        page_texts: list[str] = []
        for index, page in enumerate(document, start=1):
            rect = page.rect
            if abs(rect.width - 595.28) > 2 or abs(rect.height - 841.89) > 2:
                fail(
                    f"PDF page {index}: expected A4, found "
                    f"{rect.width:.2f} x {rect.height:.2f} pt"
                )
            page_text = page.get_text("text")
            if len(page_text.strip()) < 700:
                fail(
                    f"PDF page {index}: too little extractable text "
                    f"({len(page_text.strip())} chars)"
                )
            page_texts.append(page_text)

        full_text = "\n".join(page_texts)
        check_phrases(full_text, "PDF")
        if len(re.findall(r"(?m)^limgiho\s*$", full_text)) != 3:
            fail("PDF: expected exactly 3 limgiho footer lines")
    finally:
        document.close()

    print("PDF checks passed: 3 A4 pages")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--html-only",
        action="store_true",
        help="validate the HTML without requiring a generated PDF",
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

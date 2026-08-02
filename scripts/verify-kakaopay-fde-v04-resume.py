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
PDF = ROOT / "output/pdf/versions/lim-giho-kakaopay-fde-resume-v04.pdf"

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

FORBIDDEN = [
    "이 역할과 맞닿는",
    "KAKAO PAY FDE APPLICATION",
    "IM GIHO",
    "월 200시간 절감",
    "40개 이상의 작업 단위",
    "NestJS를 고른 이유",
    "Java/Kotlin",
]


def fail(message: str) -> None:
    raise AssertionError(message)


def check_phrases(text: str, label: str) -> None:
    for phrase in REQUIRED:
        if phrase not in text:
            fail(f"{label}: required phrase missing: {phrase}")
    for phrase in FORBIDDEN:
        if phrase in text:
            fail(f"{label}: forbidden phrase found: {phrase}")


def check_html() -> None:
    if not HTML.exists():
        fail(f"HTML not found: {HTML.relative_to(ROOT)}")

    text = HTML.read_text(encoding="utf-8")
    check_phrases(text, "HTML")

    footer_count = len(re.findall(r"<span>\s*limgiho\s*</span>", text))
    if footer_count != 3:
        fail(f"HTML: expected 3 limgiho footers, found {footer_count}")
    if text.count("AEPOS") != 1:
        fail(f"HTML: expected AEPOS once, found {text.count('AEPOS')}")

    print("HTML checks passed")


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
        if full_text.count("AEPOS") != 1:
            fail(f"PDF: expected AEPOS once, found {full_text.count('AEPOS')}")
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

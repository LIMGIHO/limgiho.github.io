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
CAREER_DOCUMENT_PDF = (
    ROOT / "assets/resume/lim-giho-kakaopay-fde-career-detail.pdf"
)
CAREER_DOCUMENT_URL = (
    "https://limgiho.github.io/assets/resume/"
    "lim-giho-kakaopay-fde-career-detail.pdf"
)

REQUIRED = [
    "KWE 주요 업무",
    "주요 결과",
    "주요 프로젝트",
    "9종",
    "55개",
    "하루 20건",
    "글로벌 물류 운영 시스템(UFS+)",
    "업무 플랫폼 통합과 글로벌 시스템 자동화",
    "세계 80개국",
    "인보이스 생성",
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
    "액션독",
    "Local LLM",
    "human-in-the-loop",
    "다양한 기술 스택",
    "15종 이상의 사내 프로그램",
    "단일 통합 플랫폼",
    "통합 플랫폼 설계와 개발 기반 수립",
    "레거시 기능과 데이터 통합",
    "글로벌 시스템 자동화와 운영 구조 개선",
    "AI 기반 검증과 업무 기능 확장",
]

PERSONAL_PROJECT_URLS = {
    "https://play.google.com/store/apps/details?id=com.healthdog.app",
    "https://play.google.com/store/apps/details?id=com.giholim.actiondog",
}

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
    "5개 업무 플랫폼",
    "5개 플랫폼",
    "15종 이상 → 5개",
    "2023-2025",
    "2025-2026",
]

MINIMUM_FONT_SIZES = {
    ".project-tech": 8.0,
    ".project-details dt": 9.1,
    ".project-details dd": 9.7,
    ".career li": 9.2,
    ".skill-list dd": 8.9,
    ".career-detail-link": 8.5,
    ".personal-project p": 9.1,
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
    if '<h2 id="summary-title">소개</h2>' not in text:
        fail("HTML: expected 소개 summary heading")
    if '<h2 id="summary-title">경력 요약</h2>' in text:
        fail("HTML: legacy 경력 요약 heading found")
    if text.count("UFS+") != 1:
        fail("HTML: UFS+ should appear once with a plain-language description")
    if "<strong>세계 80개국" in text or "<strong>UFS+</strong>" in text:
        fail("HTML: internal system scale or name should not be emphasized")
    if 'id="stack-title"' in text or "기술 전환 경험" in text:
        fail("HTML: redundant technical-transition section found")
    if text.count(CAREER_DOCUMENT_URL) != 2:
        fail("HTML: expected career-document links in header and career section")
    if "docs.google.com/document" in text:
        fail("HTML: private Google Docs career-document link found")
    if not CAREER_DOCUMENT_PDF.exists():
        fail("HTML: linked career-document PDF asset missing")
    career_document = fitz.open(CAREER_DOCUMENT_PDF)
    try:
        if not 3 <= career_document.page_count <= 6:
            fail(
                "HTML: expected 3-6 career-document pages, found "
                f"{career_document.page_count}"
            )
        career_text = "\n".join(page.get_text("text") for page in career_document)
        if len(career_text.strip()) < 3500:
            fail("HTML: career-document PDF has too little extractable text")
    finally:
        career_document.close()
    if '<p class="career-detail-link">' not in text:
        fail("HTML: career-section detail link missing")
    if '<p class="personal-more">' in text:
        fail("HTML: personal projects should be separate linked entries")
    for label in ("HealthDog 링크", "액션독 링크"):
        if f'aria-label="{label}"' not in text:
            fail(f"HTML: {label} navigation missing")
    for url in PERSONAL_PROJECT_URLS:
        if url not in text:
            fail(f"HTML: personal-project URL missing: {url}")
    if "<h3>삼성 전세기 프로젝트 IT 지원</h3>" not in text:
        fail("HTML: expected Samsung charter project heading")
    if "<h3>삼성SDS 전세기 프로젝트 IT 지원</h3>" in text:
        fail("HTML: legacy Samsung SDS project heading found")
    expected_automation_result = (
        "개별 운송장 마감, 인보이스 생성, 통합 운송장 마감으로 이어지는 업무를 "
        "자동화했습니다. 실패 건은 재시도하고 진행 상태를 추적할 수 있게 해 월 "
        "1,200시간 상당의 반복 작업을 줄였습니다."
    )
    if expected_automation_result not in text:
        fail("HTML: plain-language UFS+ automation result missing")
    for legacy_term in ("하우스 마감", "마스터 마감"):
        if legacy_term in text:
            fail(f"HTML: unexplained logistics term found: {legacy_term}")
    expected_cicd_result = (
        "PM2 수동 배포를 GitLab CI/CD·Docker Swarm 기반으로 전환해 테스트가 실패한 "
        "변경을 배포 전에 차단하고, 커밋 단위 이미지로 배포 이력과 롤백 기준을 "
        "만들었습니다. 빌드 단계를 측정해 일반 변경은 8분에서 6분으로 줄였지만, "
        "추가 단축안은 GitLab과 Runner가 같은 호스트에 있어 권한 위험이 커진다고 "
        "판단해 적용하지 않고 Runner 분리를 후속안으로 계획하고 있습니다."
    )
    if expected_cicd_result not in text:
        fail("HTML: CI/CD operations result missing")
    expected_charter_impact = (
        "하루 20건 기준으로 9종 서류의 55개 항목을 대조해 일 1,100개, 월 "
        "22,000개 항목을 확인하는 업무입니다. 자동검증으로 월 약 200시간의 "
        "수작업 확인 시간을 절감했습니다."
    )
    if expected_charter_impact not in text:
        fail("HTML: assertive Samsung charter impact missing")
    if "실측 절감 시간이 아니라" in text:
        fail("HTML: defensive Samsung charter caveat found")
    check_phrases(text, "HTML")

    footer_count = len(re.findall(r"<span>\s*limgiho\s*</span>", text))
    if footer_count != 3:
        fail(f"HTML: expected 3 limgiho footers, found {footer_count}")
    if len(re.findall(r"<ol class=\"history-list\">.*?</ol>", text, re.DOTALL)) != 1:
        fail("HTML: expected one KWE timeline")

    summary_match = re.search(
        r'<div class="summary-copy">(.*?)</div>', text, re.DOTALL
    )
    if not summary_match:
        fail("HTML: summary-copy section missing")
    strong_count = len(re.findall(r"<strong>.*?</strong>", summary_match.group(1)))
    if strong_count != 6:
        fail(f"HTML: expected 6 summary highlights, found {strong_count}")

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
        pdf_urls: set[str] = set()
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
            pdf_urls.update(
                link["uri"]
                for link in page.get_links()
                if link.get("uri")
            )

        full_text = "\n".join(page_texts)
        check_phrases(full_text, "PDF")
        if len(re.findall(r"(?m)^limgiho\s*$", full_text)) != 3:
            fail("PDF: expected exactly 3 limgiho footer lines")
        missing_urls = PERSONAL_PROJECT_URLS - pdf_urls
        if missing_urls:
            fail(f"PDF: personal-project URLs missing: {sorted(missing_urls)}")
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

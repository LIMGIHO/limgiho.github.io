#!/usr/bin/env python3
"""기업 제출형 포트폴리오의 소스·HTML·PDF 계약을 검증한다."""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RENDERED_PROFILES = {
    "default": (Path("index.html"), "theme-ice-blue"),
    "kakao": (
        Path("applications/2026-08-03/kakaopay-fde/portfolio/index.html"),
        "theme-graphite-yellow",
    ),
}
PDF_PROFILES = {
    "default": Path("assets/portfolio/lim-giho-portfolio.pdf"),
    "kakao": Path("applications/2026-08-03/kakaopay-fde/portfolio.pdf"),
}

REQUIRED_ARCHITECTURE_NODE_IDS = {
    "web",
    "api",
    "queue",
    "worker",
    "batch",
    "external",
    "local-llm",
    "data",
    "cicd",
}
REQUIRED_ARCHITECTURE_FLOWS = {"sync", "async", "delivery"}
REQUIRED_ARCHITECTURE_NODE_FIELDS = (
    "id",
    "label",
    "tech",
    "kind",
    "boundary",
    "summary",
    "implementation",
    "structure",
    "operation",
    "inputs",
    "outputs",
    "contract",
    "deployment",
    "x",
    "y",
    "width",
    "height",
)
REQUIRED_ARCHITECTURE_EDGE_FIELDS = (
    "id",
    "from",
    "to",
    "flow",
    "label",
    "path",
    "label_x",
    "label_y",
)
FORBIDDEN_PATTERNS = (
    re.compile(r"samsung|삼성|nerp", re.IGNORECASE),
    re.compile(r"kream", re.IGNORECASE),
    re.compile(r"(?<![-A-Za-z0-9])apple(?![A-Za-z0-9])|애플(?!리케이션)", re.IGNORECASE),
    re.compile(r"(?<![A-Za-z0-9])limo(?![A-Za-z0-9])", re.IGNORECASE),
    re.compile(r"(?<![A-Za-z0-9])ufs(?![A-Za-z0-9])", re.IGNORECASE),
    re.compile(
        r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3})\b"
    ),
)


def load_yaml(path):
    ruby = "puts JSON.generate(YAML.safe_load(File.read(ARGV[0]), aliases: true))"
    completed = subprocess.run(
        ["ruby", "-ryaml", "-rjson", "-e", ruby, str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def flatten_strings(value):
    if isinstance(value, dict):
        for child in value.values():
            yield from flatten_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from flatten_strings(child)
    elif isinstance(value, str):
        yield value


def validate_source(content, profiles):
    errors = []

    metrics = content.get("metrics", [])
    metric_ids = {metric.get("id") for metric in metrics}
    for metric in metrics:
        if not metric.get("source"):
            errors.append(f"metric source missing: {metric.get('id')}")

    flagship = content.get("flagship", {})
    if not flagship.get("scope_summary"):
        errors.append("flagship scope_summary missing")

    nodes = flagship.get("nodes", [])
    node_ids = {node.get("id") for node in nodes}
    if node_ids != REQUIRED_ARCHITECTURE_NODE_IDS:
        errors.append(f"architecture node ids mismatch: {sorted(node_ids)}")
    for node in nodes:
        for key in REQUIRED_ARCHITECTURE_NODE_FIELDS:
            if node.get(key) in (None, ""):
                errors.append(
                    f"architecture node {node.get('id', '?')} field missing: {key}"
                )

    edges = flagship.get("edges", [])
    flows = {edge.get("flow") for edge in edges}
    if flows != REQUIRED_ARCHITECTURE_FLOWS:
        errors.append(f"architecture flows mismatch: {sorted(flows)}")
    for edge in edges:
        for key in REQUIRED_ARCHITECTURE_EDGE_FIELDS:
            if edge.get(key) in (None, ""):
                errors.append(
                    f"architecture edge {edge.get('id', '?')} field missing: {key}"
                )
        for endpoint in ("from", "to"):
            endpoint_id = edge.get(endpoint)
            if endpoint_id and endpoint_id not in node_ids:
                errors.append(
                    f"architecture edge {edge.get('id', '?')} unknown {endpoint}: "
                    f"{endpoint_id}"
                )

    if not flagship.get("pipeline", {}).get("steps"):
        errors.append("architecture pipeline steps missing")

    for profile_name in ("default", "kakao"):
        profile = profiles.get(profile_name)
        if not profile:
            errors.append(f"profile missing: {profile_name}")
            continue
        for metric_id in profile.get("metrics", []):
            if metric_id not in metric_ids:
                errors.append(f"unknown metric in {profile_name}: {metric_id}")

    public_text = "\n".join(flatten_strings(content))
    for pattern in FORBIDDEN_PATTERNS:
        match = pattern.search(public_text)
        if match:
            errors.append(f"익명화 위반: {match.group(0)}")

    return errors


def validate_rendered(site_dir):
    errors = []
    for profile_name, (relative_path, theme_class) in RENDERED_PROFILES.items():
        html_path = Path(site_dir) / relative_path
        if not html_path.is_file():
            errors.append(f"rendered profile missing: {profile_name} ({relative_path})")
            continue
        text = html_path.read_text(encoding="utf-8")
        required = (
            'class="portfolio ',
            theme_class,
            'id="career-journey"',
            '<h2 id="journey-title">주요 경력</h2>',
            "제조·물류 시스템을 개발하고 운영해 온 경험을 시간순으로 정리했습니다.",
            "/assets/js/portfolio.js",
            'id="journey-iljin-foundation"',
            'id="journey-iljin-lead"',
            'id="journey-kwe-automation"',
            'id="journey-kwe-platform"',
            'id="flagship"',
            'id="implementation-architecture"',
            'id="architecture-detail"',
            "02 · 통합 업무 플랫폼 개발",
            "15종",
            "5개 업무 도메인",
            'id="automation"',
            'id="experience"',
            'id="additional-work"',
            "외부 업무 시스템 입력 자동화",
            "1,200시간",
            "ILJIN Global",
            "KWE Korea",
        )
        for phrase in required:
            if phrase not in text:
                errors.append(f"{profile_name} rendered phrase missing: {phrase}")
        if text.count("data-journey-item") != 4:
            errors.append(
                f"{profile_name} journey item count: "
                f"{text.count('data-journey-item')} (expected 4)"
            )
        if text.count("data-architecture-node=") != 9:
            errors.append(
                f"{profile_name} architecture node count: "
                f"{text.count('data-architecture-node=')} (expected 9)"
            )
        if text.count("data-architecture-mobile-node=") != 9:
            errors.append(
                f"{profile_name} mobile architecture node count: "
                f"{text.count('data-architecture-mobile-node=')} (expected 9)"
            )
        if text.count("data-architecture-edge=") != 9:
            errors.append(
                f"{profile_name} architecture edge count: "
                f"{text.count('data-architecture-edge=')} (expected 9)"
            )
        for node_id in REQUIRED_ARCHITECTURE_NODE_IDS:
            if f'data-architecture-node="{node_id}"' not in text:
                errors.append(f"{profile_name} architecture node missing: {node_id}")
        for phrase in (
            "FLAGSHIP CASE",
            "OUTCOMES",
            "SUPPORTING EVIDENCE",
            "ENGINEERING DECISIONS",
            "data-decision-id",
        ):
            if phrase in text:
                errors.append(f"{profile_name} retired flagship content: {phrase}")
        for pattern_text in (
            'class="portfolio-hero"',
            "개발에서 플랫폼 책임까지",
            "skill-bar",
            "progress-bar",
            "aria-valuenow",
            "문의하기",
            "상담 신청",
        ):
            if pattern_text in text:
                errors.append(
                    f"{profile_name} forbidden presentation: {pattern_text}"
                )
        for pattern in FORBIDDEN_PATTERNS:
            match = pattern.search(text)
            if match:
                errors.append(
                    f"{profile_name} rendered 익명화 위반: {match.group(0)}"
                )

    css_path = Path(site_dir) / "assets" / "css" / "portfolio.css"
    if not css_path.is_file():
        errors.append("compiled portfolio css missing")
        return errors
    css = css_path.read_text(encoding="utf-8")
    for token in (
        "--accent",
        "--accent-soft",
        "--ink",
        "--muted",
        "--rule",
        ".theme-ice-blue",
        ".theme-graphite-yellow",
        "prefers-reduced-motion: reduce",
        "@media print",
        "@page",
    ):
        if token not in css:
            errors.append(f"compiled css contract missing: {token}")
    for forbidden in ("transition: all", "@import url", "url(http"):
        if forbidden in css:
            errors.append(f"compiled css forbidden pattern: {forbidden}")
    return errors


def validate_pdf(pdf_path, content):
    """PDF가 제출 가능한 A4 문서이며 핵심 증거와 공개 링크를 보존하는지 확인한다."""
    errors = []
    pdf_path = Path(pdf_path)
    if not pdf_path.is_file():
        return [f"PDF missing: {pdf_path}"]

    try:
        import pymupdf as fitz
    except ImportError:
        return ["PyMuPDF missing: run with `uv run --with pymupdf python3 ...`"]

    try:
        document = fitz.open(pdf_path)
    except Exception as error:
        return [f"PDF open failed: {pdf_path} ({error})"]

    if not document.page_count:
        errors.append(f"PDF has no pages: {pdf_path}")
        document.close()
        return errors
    if document.page_count > 20:
        errors.append(f"PDF page count too high: {document.page_count}")

    all_text = []
    link_uris = set()
    for page_number, page in enumerate(document, start=1):
        width, height = page.rect.width, page.rect.height
        if not (590 <= width <= 605 and 835 <= height <= 850):
            errors.append(
                f"page {page_number} is not A4: {width:.1f} x {height:.1f} pt"
            )
        page_text = page.get_text("text").strip()
        all_text.append(page_text)
        if len(page_text) < 100:
            errors.append(f"page {page_number} has too little text")
        for link in page.get_links():
            uri = link.get("uri")
            if uri:
                link_uris.add(uri)
    document.close()

    text = "\n".join(all_text)
    required_phrases = (
        "CAREER JOURNEY",
        "15종",
        "BEFORE · 15 SYSTEMS",
        "AFTER · INTEGRATED PLATFORM",
        "Web · 90+ 업무 화면",
        "외부 어댑터",
        "외부 업무 시스템 입력 자동화",
        "1,200시간",
        "ILJIN Global",
        "KWE Korea",
    )
    required_phrases += tuple(
        decision.get("title", "")
        for decision in content.get("flagship", {}).get("decisions", [])
    )
    for phrase in required_phrases:
        if phrase and phrase not in text:
            errors.append(f"PDF phrase missing: {phrase}")

    required_links = (
        "https://limgiho.github.io/assets/resume/lim-giho-resume.pdf",
        "https://github.com/limgiho",
    )
    for required_link in required_links:
        if not any(uri.startswith(required_link) for uri in link_uris):
            errors.append(f"PDF link missing: {required_link}")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-only", action="store_true")
    parser.add_argument("--site-dir", type=Path)
    parser.add_argument("--pdf", action="store_true")
    args = parser.parse_args()

    content = load_yaml(ROOT / "_data" / "portfolio.yml")
    profiles = load_yaml(ROOT / "_data" / "portfolio_profiles.yml")
    errors = validate_source(content, profiles)
    if errors:
        print(f"FAIL: portfolio source contract ({len(errors)})")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS: portfolio source contract")

    if not args.source_only and args.site_dir:
        rendered_errors = validate_rendered(args.site_dir)
        if rendered_errors:
            print(f"FAIL: portfolio rendered contract ({len(rendered_errors)})")
            for error in rendered_errors:
                print(f"  - {error}")
            return 1
        print("PASS: portfolio rendered contract")

    if args.pdf:
        pdf_errors = []
        for profile_name, relative_path in PDF_PROFILES.items():
            profile_errors = validate_pdf(ROOT / relative_path, content)
            pdf_errors.extend(
                f"{profile_name}: {error}" for error in profile_errors
            )
        if pdf_errors:
            print(f"FAIL: portfolio PDF contract ({len(pdf_errors)})")
            for error in pdf_errors:
                print(f"  - {error}")
            return 1
        print("PASS: portfolio PDF contract")
    return 0


if __name__ == "__main__":
    sys.exit(main())

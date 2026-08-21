#!/usr/bin/env python3
"""포트폴리오 공개 산출물의 익명화 계약을 검증한다."""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RENDERED_PROFILES = {"default": Path("index.html"), "kakao": Path("applications/2026-08-03/kakaopay-fde/portfolio/index.html")}
PDF_PROFILES = {"default": Path("assets/portfolio/lim-giho-portfolio.pdf"), "kakao": Path("applications/2026-08-03/kakaopay-fde/portfolio.pdf")}

FORBIDDEN_PATTERNS = (
    re.compile(r"samsung|삼성|nerp", re.IGNORECASE),
    re.compile(r"kream", re.IGNORECASE),
    re.compile(r"(?<![-A-Za-z0-9])apple(?![A-Za-z0-9])|애플(?!리케이션)", re.IGNORECASE),
    re.compile(r"(?<![A-Za-z0-9])limo(?![A-Za-z0-9])", re.IGNORECASE),
    re.compile(r"(?<![A-Za-z0-9])ufs(?![A-Za-z0-9])", re.IGNORECASE),
    re.compile(r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b"),
    re.compile(r"expdeclcert", re.IGNORECASE),
    re.compile(r"(?<![A-Za-z0-9])(?:ssms|aicms|sclp)(?![A-Za-z0-9])", re.IGNORECASE),
    re.compile(r"\b[A-Z]{4}\d{4}\b", re.IGNORECASE),
)


def load_yaml(path):
    ruby = "puts JSON.generate(YAML.safe_load(File.read(ARGV[0]), aliases: true))"
    return json.loads(subprocess.run(["ruby", "-ryaml", "-rjson", "-e", ruby, str(path)], check=True, capture_output=True, text=True).stdout)


def flatten_strings(value):
    if isinstance(value, dict):
        for child in value.values():
            yield from flatten_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from flatten_strings(child)
    elif isinstance(value, str):
        yield value


def forbidden_errors(text, scope):
    errors = []
    for pattern in FORBIDDEN_PATTERNS:
        if match := pattern.search(text):
            errors.append(f"{scope} 익명화 위반: {match.group(0)}")
    return errors


def validate_source(content):
    return forbidden_errors("\n".join(flatten_strings(content)), "portfolio source")


def validate_rendered(site_dir):
    errors = []
    for profile_name, relative_path in RENDERED_PROFILES.items():
        html_path = Path(site_dir) / relative_path
        if not html_path.is_file():
            errors.append(f"rendered profile missing: {profile_name} ({relative_path})")
            continue
        errors.extend(forbidden_errors(html_path.read_text(encoding="utf-8"), f"{profile_name} rendered"))
    return errors


def validate_pdf(pdf_path):
    pdf_path = Path(pdf_path)
    if not pdf_path.is_file():
        return [f"PDF missing: {pdf_path}"]
    try:
        import pymupdf as fitz
    except ImportError:
        try:
            import fitz
        except ImportError:
            print(f"INFO: PyMuPDF unavailable; skipped PDF content checks for {pdf_path}")
            return []
    try:
        with fitz.open(pdf_path) as document:
            text = "\n".join(page.get_text("text") for page in document)
    except Exception as error:
        return [f"PDF open failed: {pdf_path} ({error})"]
    return forbidden_errors(text, f"{pdf_path} PDF")


def report(label, errors):
    if errors:
        print(f"FAIL: {label} ({len(errors)})")
        for error in errors:
            print(f"  - {error}")
        return False
    print(f"PASS: {label}")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-only", action="store_true")
    parser.add_argument("--site-dir", type=Path)
    parser.add_argument("--pdf", action="store_true")
    args = parser.parse_args()

    content = load_yaml(ROOT / "_data" / "portfolio.yml")
    if not report("portfolio source contract", validate_source(content)):
        return 1
    if not args.source_only and args.site_dir:
        if not report("portfolio rendered contract", validate_rendered(args.site_dir)):
            return 1
    if args.pdf:
        errors = []
        for profile_name, relative_path in PDF_PROFILES.items():
            errors.extend(f"{profile_name}: {error}" for error in validate_pdf(ROOT / relative_path))
        if not report("portfolio PDF contract", errors):
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

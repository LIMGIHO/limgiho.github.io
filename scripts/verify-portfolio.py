#!/usr/bin/env python3
"""기업 제출형 포트폴리오의 소스·HTML·PDF 계약을 검증한다."""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REQUIRED_DECISION_IDS = {
    "integration",
    "frontend-slices",
    "typed-boundaries",
    "incremental-migration",
    "worker-contract",
    "distributed-cron",
    "private-llm",
    "llm-evaluation",
    "adapter-boundary",
    "affected-deploy",
}
FORBIDDEN_PATTERNS = (
    re.compile(r"samsung|삼성|nerp", re.IGNORECASE),
    re.compile(r"kream", re.IGNORECASE),
    re.compile(r"(?<![-A-Za-z0-9])apple(?![A-Za-z0-9])|애플", re.IGNORECASE),
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

    decisions = content.get("flagship", {}).get("decisions", [])
    decision_ids = {decision.get("id") for decision in decisions}
    if decision_ids != REQUIRED_DECISION_IDS:
        errors.append(f"decision ids mismatch: {sorted(decision_ids)}")
    for decision in decisions:
        for key in ("id", "title", "problem", "alternative", "choice", "result"):
            if not decision.get(key):
                errors.append(
                    f"decision {decision.get('id', '?')} field missing: {key}"
                )

    for profile_name in ("default", "kakao"):
        profile = profiles.get(profile_name)
        if not profile:
            errors.append(f"profile missing: {profile_name}")
            continue
        for metric_id in profile.get("metrics", []):
            if metric_id not in metric_ids:
                errors.append(f"unknown metric in {profile_name}: {metric_id}")
        for decision_id in profile.get("featured_decisions", []):
            if decision_id not in decision_ids:
                errors.append(f"unknown decision in {profile_name}: {decision_id}")

    public_text = "\n".join(flatten_strings(content))
    for pattern in FORBIDDEN_PATTERNS:
        match = pattern.search(public_text)
        if match:
            errors.append(f"익명화 위반: {match.group(0)}")

    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-only", action="store_true")
    parser.parse_args()

    content = load_yaml(ROOT / "_data" / "portfolio.yml")
    profiles = load_yaml(ROOT / "_data" / "portfolio_profiles.yml")
    errors = validate_source(content, profiles)
    if errors:
        print(f"FAIL: portfolio source contract ({len(errors)})")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("PASS: portfolio source contract")
    return 0


if __name__ == "__main__":
    sys.exit(main())

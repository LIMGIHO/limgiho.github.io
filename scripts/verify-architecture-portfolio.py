#!/usr/bin/env python3
"""시스템 아키텍처 포트폴리오 HTML 검증.

익명화 위반과 데이터 모델 완전성을 검사한다. 실패 시 종료 코드 1.
"""
import json
import re
import sys
from pathlib import Path

HTML_PATH = Path(__file__).resolve().parent.parent / "assets" / "portfolio" / "architecture.html"

# 결과물에 절대 남아서는 안 되는 문자열. 회사·거래처·사내 인프라를 특정할 수 있는 것들.
FORBIDDEN_PATTERNS = [
    (r"kream", "회사 제품명"),
    (r"(?<![A-Za-z0-9])kwe(?![A-Za-z0-9])", "회사 모노레포 코드명"),
    (r"samsung|삼성", "거래처명"),
    # `-apple-system` 폰트 키워드는 예외 — 앞에 하이픈이 붙은 경우만 허용한다.
    (r"(?<![-A-Za-z0-9])apple(?![A-Za-z0-9])|애플", "거래처명"),
    (r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b", "사설 IP"),
    (r"\b[a-z]{4}\d{4}\b", "화면 코드"),
    (r"(?<![A-Za-z0-9])limo(?![A-Za-z0-9])", "사내 시스템명"),
    (r"(?<![A-Za-z0-9])ufs(?![A-Za-z0-9])", "사내 시스템명"),
]

failures = []


def fail(message):
    failures.append(message)


def check_forbidden(text):
    for pattern, why in FORBIDDEN_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            line = text.count("\n", 0, match.start()) + 1
            fail(f"익명화 위반 ({why}): {match.group(0)!r} @ line {line}")


def check_no_external_resources(text):
    for match in re.finditer(r"""(?:src|href)\s*=\s*["'](https?:)?//""", text):
        line = text.count("\n", 0, match.start()) + 1
        fail(f"외부 리소스 참조 발견 @ line {line} — 단일 파일이어야 한다")

    for match in re.finditer(r"""url\(\s*["']?(?:https?:)?//|@import\s+["'](?:https?:)?//""", text, re.IGNORECASE):
        line = text.count("\n", 0, match.start()) + 1
        fail(f"CSS 외부 리소스 참조 발견 @ line {line} — 단일 파일이어야 한다")


def extract_model(text):
    """<script id="model" type="application/json"> 안의 JSON을 꺼낸다."""
    match = re.search(
        r'<script id="model" type="application/json">(.*?)</script>',
        text,
        re.DOTALL,
    )
    if not match:
        fail('id="model" JSON 스크립트 블록을 찾을 수 없다')
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError as error:
        fail(f"모델 JSON 파싱 실패: {error}")
        return None


def check_model(model):
    legacy = model.get("legacy", [])
    if len(legacy) != 13:
        fail(f"legacy 항목은 13개여야 한다. 현재 {len(legacy)}개")
    sinks = model.get("sinks", [])
    if not sinks:
        fail("sinks 목록이 비어 있다")
    sink_ids = set()
    for sink in sinks:
        for key in ("id", "label"):
            if not sink.get(key):
                fail(f"sink 항목에 {key} 누락: {sink}")
        sink_ids.add(sink.get("id"))

    legacy_ids = set()
    for item in legacy:
        for key in ("id", "label", "tech"):
            if not item.get(key):
                fail(f"legacy 항목에 {key} 누락: {item}")
        legacy_ids.add(item.get("id"))

    # 흐름선은 실제 박스를 가리켜야 한다. 오타가 나면 선이 조용히 사라지므로 여기서 잡는다.
    known = legacy_ids | sink_ids
    flows = model.get("legacyFlows", [])
    if not flows:
        fail("legacyFlows 가 비어 있다")
    connected = set()
    for flow in flows:
        for end in ("from", "to"):
            target = flow.get(end)
            if target not in known:
                fail(f"legacyFlows 의 {end}={target!r} 에 해당하는 박스가 없다")
            connected.add(target)

    # 레거시 박스는 정말로 아무 데도 안 붙는 것이 있을 수 있다(독립 프로그램).
    # 다만 아무도 쓰지 않는 sink 는 그릴 이유가 없으므로 잡는다.
    for unused in sorted(sink_ids - connected):
        fail(f"아무도 연결하지 않는 sink 가 있다: {unused!r}")

    cards = []
    for node in model.get("nodes", []):
        cards.extend(node.get("cards", []))
    for edge in model.get("edges", []):
        cards.extend(edge.get("cards", []))
    cards.extend(model.get("toggleCards", []))

    if len(cards) != 10:
        fail(f"카드는 정확히 10장이어야 한다. 현재 {len(cards)}장")

    for card in cards:
        for key in ("title", "problem", "alternative", "choice", "result"):
            if not card.get(key):
                fail(f"카드 {card.get('title', '?')!r} 에 {key} 누락")

    node_ids = {node.get("id") for node in model.get("nodes", [])}
    for edge in model.get("edges", []):
        for end in ("from", "to"):
            target = edge.get(end)
            if target not in node_ids:
                fail(f"엣지 {edge.get('id', '?')!r} 의 {end}={target!r} 노드가 없다")


def check_theme_tokens(text):
    if "prefers-color-scheme: dark" not in text:
        fail("다크 테마 대응(prefers-color-scheme)이 없다")
    if not re.search(r":root\s*\{", text):
        fail(":root 토큰 정의가 없다")


def main():
    if not HTML_PATH.exists():
        print(f"FAIL: {HTML_PATH} 가 없다")
        return 1

    text = HTML_PATH.read_text(encoding="utf-8")
    check_forbidden(text)
    check_no_external_resources(text)
    check_theme_tokens(text)
    model = extract_model(text)
    if model:
        check_model(model)

    if failures:
        print(f"FAIL ({len(failures)}건)")
        for message in failures:
            print(f"  - {message}")
        return 1

    print("PASS: 익명화·모델 완전성 검사 통과")
    return 0


if __name__ == "__main__":
    sys.exit(main())

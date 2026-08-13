# 시스템 아키텍처 인터랙티브 포트폴리오 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 물류 포워딩 플랫폼의 Before/After 시스템 흐름도를 클릭하면 설계 판단 카드가 열리는, 의존성 없는 단일 HTML 포트폴리오를 만든다.

**Architecture:** 데이터(노드·엣지·카드를 담은 JS 객체 리터럴) / 렌더러(인라인 SVG 다이어그램 + 우측 패널) / 스타일(CSS 커스텀 프로퍼티 토큰) 세 덩어리로 나눈 단일 HTML 파일. 다이어그램과 패널은 모두 같은 데이터 객체에서 렌더되므로 내용 수정은 객체 한 곳만 고치면 된다. 검증은 파이썬 스크립트 하나가 담당한다 — 익명화 위반 문자열 스캔과 데이터 모델 완전성 검사.

**Tech Stack:** 순수 HTML/CSS/JS (라이브러리 없음), 인라인 SVG, 검증용 Python 3 표준 라이브러리

**Spec:** `docs/superpowers/specs/2026-08-13-system-architecture-portfolio-design.md`

---

## File Structure

| 경로 | 책임 |
|---|---|
| `assets/portfolio/architecture.html` | 결과물 전체. 단일 파일 안에 `<style>` / `<body>` 마크업 / `<script>`(데이터 + 렌더러) |
| `scripts/verify-architecture-portfolio.py` | 검증. 익명화 위반 스캔, 카드 10장·레거시 15종 완전성, 외부 리소스 참조 금지, 다크 테마 토큰 존재 |

기존 저장소에 Node 툴체인이 없고 `scripts/verify-kakaopay-fde-resume.py` 선례가 있으므로 검증은 Python 표준 라이브러리로 작성한다. `assets/` 아래 파일은 Jekyll이 그대로 복사하므로 front matter 없이 둔다.

---

## Task 1: 검증 스크립트와 HTML 뼈대

**Files:**
- Create: `scripts/verify-architecture-portfolio.py`
- Create: `assets/portfolio/architecture.html`

- [ ] **Step 1: 검증 스크립트를 작성한다 (아직 통과하지 않는다)**

Create `scripts/verify-architecture-portfolio.py`:

```python
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
    # `\b` 는 언더스코어를 단어 문자로 보므로 AWS_KWE_PROD 같은 표기를 놓친다.
    # 영숫자만 경계로 삼는다.
    (r"(?<![A-Za-z0-9])kwe(?![A-Za-z0-9])", "회사 모노레포 코드명"),
    (r"samsung|삼성", "거래처명"),
    # `-apple-system` 폰트 키워드는 예외 — 앞에 하이픈이 붙은 경우만 허용한다.
    (r"(?<![-A-Za-z0-9])apple(?![A-Za-z0-9])|애플", "거래처명"),
    # 특정 IP 하나가 아니라 사설 대역 전체를 막는다.
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
    # CSS 안의 외부 참조도 막는다 — url(), @import 는 속성 검사에 걸리지 않는다.
    for match in re.finditer(
        r"""url\(\s*["']?(?:https?:)?//|@import\s+["'](?:https?:)?//""", text, re.IGNORECASE
    ):
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
    if len(legacy) != 15:
        fail(f"legacy 항목은 15개여야 한다. 현재 {len(legacy)}개")
    for item in legacy:
        for key in ("id", "label", "tech"):
            if not item.get(key):
                fail(f"legacy 항목에 {key} 누락: {item}")

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
```

- [ ] **Step 2: 실행해서 실패를 확인한다**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `FAIL: .../assets/portfolio/architecture.html 가 없다`, 종료 코드 1

- [ ] **Step 3: HTML 뼈대를 만든다**

Create `assets/portfolio/architecture.html`:

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LogiFlow Architecture</title>
<style>
:root {
  --bg: #ffffff;
  --surface: #f6f7f9;
  --border: #d8dbe0;
  --text: #17191c;
  --muted: #5f656e;
  --accent: #2f6fed;
  --accent-soft: #e7effd;
  --warn: #b4531a;
  --radius: 10px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f1114;
    --surface: #171a1f;
    --border: #2b3038;
    --text: #e8eaed;
    --muted: #9aa1ab;
    --accent: #7aa5ff;
    --accent-soft: #1b2740;
    --warn: #e0954f;
  }
}
:root[data-theme="dark"] {
  --bg: #0f1114;
  --surface: #171a1f;
  --border: #2b3038;
  --text: #e8eaed;
  --muted: #9aa1ab;
  --accent: #7aa5ff;
  --accent-soft: #1b2740;
  --warn: #e0954f;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  /* 벤더 한글 폰트명은 익명화 검사에 걸리므로 쓰지 않는다. system-ui 로 충분하다. */
  font: 15px/1.6 system-ui, -apple-system, "Pretendard", "Malgun Gothic", sans-serif;
}
</style>
</head>
<body>
<main id="app"></main>

<script id="model" type="application/json">
{
  "meta": { "project": "LogiFlow", "tagline": "파편화된 15종 사내 시스템을 하나의 플랫폼으로" },
  "legacy": [],
  "nodes": [],
  "edges": [],
  "toggleCards": []
}
</script>

<script>
const MODEL = JSON.parse(document.getElementById('model').textContent);
</script>
</body>
</html>
```

- [ ] **Step 4: 실행해서 모델 완전성만 실패하는지 확인한다**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `FAIL (2건)` — legacy 0개, 카드 0장. 익명화·외부리소스·테마 검사는 통과해야 한다. 익명화 위반이 함께 뜬다면 스타일 블록 안에 벤더 폰트명이 남아 있는 것이다 — 금지 패턴 목록을 고치지 말고 폰트명을 지운다.

- [ ] **Step 5: 커밋**

```bash
git add scripts/verify-architecture-portfolio.py assets/portfolio/architecture.html
git commit -m "feat: 아키텍처 포트폴리오 뼈대와 검증 스크립트"
```

---

## Task 2: 데이터 모델 — 레거시 15종과 노드

**Files:**
- Modify: `assets/portfolio/architecture.html` (`<script id="model">` 블록)

`legacy` 15종은 스펙의 미결 사항이다. 사용자가 실제 목록을 주기 전까지 대표 유형으로 채우고, 각 항목에 `"placeholder": true` 를 달아 나중에 찾아 바꿀 수 있게 한다.

좌표계는 viewBox `0 0 1000 620` 기준이다. `x`,`y` 는 노드 박스의 중심점이다.

- [ ] **Step 1: legacy 15종과 nodes 배열을 채운다**

`<script id="model">` 블록 전체를 아래로 교체한다:

```html
<script id="model" type="application/json">
{
  "meta": {
    "project": "LogiFlow",
    "tagline": "파편화된 15종 사내 시스템을 하나의 플랫폼으로"
  },
  "legacy": [
    { "id": "l1",  "label": "출고 관리",       "tech": "C# WinForms",   "placeholder": true },
    { "id": "l2",  "label": "입고 관리",       "tech": "C# WinForms",   "placeholder": true },
    { "id": "l3",  "label": "계근대 연동",     "tech": "VB6",           "placeholder": true },
    { "id": "l4",  "label": "라벨 발행",       "tech": "VB6",           "placeholder": true },
    { "id": "l5",  "label": "정산",            "tech": "Oracle Forms",  "placeholder": true },
    { "id": "l6",  "label": "요율 관리",       "tech": "Oracle Forms",  "placeholder": true },
    { "id": "l7",  "label": "기준정보",        "tech": "Oracle Forms",  "placeholder": true },
    { "id": "l8",  "label": "수출 신고",       "tech": "구 React",      "placeholder": true },
    { "id": "l9",  "label": "수입 통관",       "tech": "구 React",      "placeholder": true },
    { "id": "l10", "label": "운송 배차",       "tech": "구 React",      "placeholder": true },
    { "id": "l11", "label": "거래처 EDI 송수신","tech": "배치 스크립트", "placeholder": true },
    { "id": "l12", "label": "실적 집계",       "tech": "Excel 매크로",  "placeholder": true },
    { "id": "l13", "label": "청구서 생성",     "tech": "Excel 매크로",  "placeholder": true },
    { "id": "l14", "label": "스케줄 조회",     "tech": "ASP",           "placeholder": true },
    { "id": "l15", "label": "사용자·권한",     "tech": "ASP",           "placeholder": true }
  ],
  "nodes": [
    {
      "id": "web",
      "label": "Web",
      "sub": "Next.js",
      "kind": "app",
      "featured": true,
      "x": 500, "y": 70,
      "role": "업무 화면 90여 개를 담는 단일 웹 클라이언트. 15종 레거시 UI가 여기로 수렴했다.",
      "structure": [
        "app/            라우트 = 업무 화면",
        "  └ _features/  화면 로컬 슬라이스 (container · view)",
        "features/       화면을 넘어 공유되는 도메인 슬라이스",
        "shared/         UI · 유틸 · API 클라이언트"
      ],
      "cards": []
    },
    {
      "id": "api",
      "label": "API",
      "sub": "NestJS",
      "kind": "app",
      "x": 500, "y": 190,
      "role": "모든 업무 요청과 외부 연동이 통과하는 단일 진입점.",
      "structure": [
        "core/      업무 도메인 (수출 · 수입 · 배치)",
        "system/    도메인 공통 능력 (파일 · 인증 · 메일 · 출력)",
        "external/  외부 시스템 어댑터",
        "port/      외부를 향한 인터페이스 정의"
      ],
      "cards": []
    },
    {
      "id": "legacyApi",
      "label": "Legacy API",
      "sub": "Express",
      "kind": "legacy",
      "x": 175, "y": 190,
      "role": "전환 이전의 API. 신규 개발은 멈추고 모듈 단위로 이전 중이다.",
      "structure": [
        "도메인 모듈 단위로 신규 API에 이관",
        "공용 라이브러리는 구 · 신 두 벌을 병행 유지"
      ],
      "cards": []
    },
    {
      "id": "queue",
      "label": "Queue",
      "sub": "Redis · BullMQ",
      "kind": "infra",
      "x": 820, "y": 190,
      "role": "API와 워커를 잇는 잡 큐. 업무 성격별로 큐를 분리했다.",
      "structure": [
        "글로벌 연동 · EDI · 알림 · 계근 소켓 · 문서추출",
        "문서추출 큐만 동시성 1 · 락 600초"
      ],
      "cards": []
    },
    {
      "id": "worker",
      "label": "Worker",
      "sub": "cron + 분산락",
      "kind": "app",
      "x": 820, "y": 320,
      "role": "예약 실행과 큐 소비를 담당하는 별도 배포 단위.",
      "structure": [
        "scheduler/  크론 정의 · Redis 분산 락",
        "queue/      큐 ↔ 잡 타입 매핑",
        "worker/     잡 실행 · 타임아웃"
      ],
      "cards": []
    },
    {
      "id": "batch",
      "label": "Batch",
      "sub": "스크래핑 · FTP · 엑셀",
      "kind": "app",
      "x": 820, "y": 445,
      "role": "브라우저 자동화와 대용량 파일 생성처럼 무겁고 오래 걸리는 작업.",
      "structure": [
        "API 프로세스와 분리해 메모리 · 시간 영향 격리"
      ],
      "cards": []
    },
    {
      "id": "llm",
      "label": "Local LLM",
      "sub": "온프레미스 추론",
      "kind": "infra",
      "x": 500, "y": 445,
      "role": "수출입 서류에서 값을 읽어내는 사내 추론 서버. OpenAI 호환 인터페이스.",
      "structure": [
        "domain/  포트 인터페이스 (Symbol DI)",
        "infra/   HTTP 어댑터",
        "app/     문서유형별 추출 서비스 (JSON Schema 강제)"
      ],
      "cards": []
    },
    {
      "id": "adapters",
      "label": "External 어댑터 층",
      "sub": "외부 8종",
      "kind": "boundary",
      "x": 175, "y": 330,
      "role": "정부·상용·거래처·하드웨어를 한 경계 뒤로 모은 층.",
      "structure": [
        "UNI-PASS (관세청)   글로벌 포워딩 시스템",
        "Descartes (EDI)     운송관리 TMS",
        "거래처 EDI          계근대 소켓",
        "FTP / SFTP          LDAP · SMTP"
      ],
      "cards": []
    },
    {
      "id": "db",
      "label": "Data",
      "sub": "Oracle · MySQL · PG · ODBC",
      "kind": "infra",
      "x": 175, "y": 460,
      "role": "레거시 Oracle과 신규 DB가 공존한다. 리포지토리 뒤에 숨는다.",
      "structure": [
        "읽기 · 쓰기 리포지토리 분리",
        "드라이버 차이는 리포지토리 구현체 안에서 흡수"
      ],
      "cards": []
    },
    {
      "id": "cicd",
      "label": "CI / CD",
      "sub": "GitLab → Kaniko → Swarm",
      "kind": "pipeline",
      "x": 500, "y": 560,
      "role": "변경된 앱만 골라 빌드하고, 브랜치가 곧 환경이 되는 파이프라인.",
      "structure": [
        "Parent 파이프라인이 변경 감지 → 해당 앱 Child만 실행",
        "test → build → deploy 3단 고정",
        "dev · staging · production, 환경별 replica"
      ],
      "cards": []
    }
  ],
  "edges": [],
  "toggleCards": []
}
</script>
```

- [ ] **Step 2: 검증을 실행한다**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `FAIL` — 카드 0장. legacy 15개 검사는 통과하므로 실패 건수가 1건으로 줄어든다.

- [ ] **Step 3: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "feat: 포트폴리오 데이터 모델 — 레거시 15종과 노드 10개"
```

---

## Task 3: 데이터 모델 — 카드 10장과 엣지

**Files:**
- Modify: `assets/portfolio/architecture.html` (`<script id="model">` 블록의 `cards` · `edges` · `toggleCards`)

카드는 `title / problem / alternative / choice / result` 5필드다. 화면에는 제목 + 4줄로 렌더된다.

- [ ] **Step 1: toggleCards 를 채운다**

`"toggleCards": []` 를 아래로 교체:

```json
  "toggleCards": [
    {
      "id": "c1",
      "title": "왜 통합인가",
      "problem": "15종 클라이언트가 각자 DB와 외부 시스템에 직접 붙어 있었다. 같은 업무 로직이 여러 벌 존재하고, 장애가 나면 어디서 시작됐는지 추적할 수 없었다.",
      "alternative": "레거시를 그대로 두고 연동 게이트웨이만 앞에 세우는 안도 검토했다. 단기 비용은 낮지만 중복 로직은 그대로 남는다.",
      "choice": "화면과 API를 하나의 플랫폼으로 수렴시키고, 외부 연동은 어댑터 한 층으로 모았다. 데이터 접근 경로를 하나로 만드는 것이 목적이었다.",
      "result": "새 외부 시스템을 붙일 때 고쳐야 할 곳이 15곳에서 1곳이 됐다."
    }
  ]
```

- [ ] **Step 2: Web 노드에 대표 카드를 넣는다**

`"id": "web"` 노드의 `"cards": []` 를 교체:

```json
      "cards": [
        {
          "id": "c2",
          "title": "클린 아키텍처를 프론트에 넣으려다 접었다",
          "problem": "백엔드에서 레이어 분리로 효과를 봤기에 같은 구조를 프론트에 이식했다. 그런데 화면 하나를 고치려면 entities · usecase · ui 세 폴더를 오가야 했고, 레이어 대부분이 통과만 하는 껍데기가 됐다.",
          "alternative": "레이어를 유지하고 규칙을 더 촘촘히 만드는 방향도 시도했다. 규칙이 늘수록 신규 화면 작성 비용만 올라갔다.",
          "choice": "업무 화면 90여 개는 화면 자체가 업무 단위였다. 레이어가 아니라 슬라이스로 나눠야 했다. 화면 폴더 안에 로컬 슬라이스를 두고(container · view), 화면을 넘어 재사용되는 것만 도메인 슬라이스로 올렸다.",
          "result": "화면 수정이 폴더 하나 안에서 끝난다. 삭제도 폴더째 지우면 된다."
        }
      ]
```

- [ ] **Step 3: 나머지 노드 카드를 채운다**

각 노드의 `"cards": []` 를 해당 내용으로 교체한다.

`api` 노드:

```json
      "cards": [
        {
          "id": "c3",
          "title": "경계를 규칙이 아니라 타입으로 지켰다",
          "problem": "폴더로 계층을 나눠도 시간이 지나면 도메인이 인프라를 직접 부른다. 코드 리뷰로 막는 데는 한계가 있었다.",
          "alternative": "린트 규칙으로 import 경로를 막는 방법도 있었다. 우회가 쉽고 위반 시점이 늦다.",
          "choice": "도메인은 Symbol 포트만 알고 구현체는 모듈 등록에서 주입한다. 문서유형처럼 확장되는 지점은 유형 목록을 키로 가진 레코드 타입으로 두어, 새 유형을 추가하면 핸들러를 연결할 때까지 컴파일이 통과하지 않게 했다.",
          "result": "등록을 잊은 채 배포되는 사고가 구조적으로 불가능해졌다."
        }
      ]
```

`legacyApi` 노드:

```json
      "cards": [
        {
          "id": "c4",
          "title": "한 번에 갈아엎지 않았다",
          "problem": "레거시 API는 매일 쓰이는 운영 시스템이었다. 전면 재작성은 멈출 수 없는 업무를 볼모로 잡는 일이었다.",
          "alternative": "기능 동결 후 일괄 전환도 검토했다. 전환 기간 동안 개선 요청을 전부 거절해야 했다.",
          "choice": "구 API를 살려둔 채 모듈 단위로 신규 API에 이전했다. 공용 라이브러리도 구 · 신 두 벌을 한동안 병행하고, 신규 기능은 반드시 신규 쪽에만 넣었다.",
          "result": "운영 중단 없이 전환이 진행됐고, 어느 시점에 멈춰도 시스템은 동작한다."
        }
      ]
```

`worker` 노드:

```json
      "cards": [
        {
          "id": "c6",
          "title": "replica를 늘리자 크론이 두 번 돌았다",
          "problem": "가용성을 위해 워커를 2대로 늘렸더니 스케줄 잡이 양쪽에서 동시에 실행됐다. 집계가 두 번 반영되는 문제가 생겼다.",
          "alternative": "워커 하나를 스케줄 전담으로 고정하는 방법이 있었다. 그 한 대가 죽으면 예약 실행 전체가 멈춘다.",
          "choice": "실행 직전 Redis에 TTL 붙은 키를 NX로 선점하게 했다. 선점에 성공한 한 대만 실행하고 나머지는 조용히 넘어간다.",
          "result": "몇 대로 늘려도 잡은 한 번만 돈다. 어느 대가 죽어도 남은 대가 이어받는다."
        }
      ]
```

`llm` 노드 (2장):

```json
      "cards": [
        {
          "id": "c7",
          "title": "서류를 밖으로 내보낼 수 없었다",
          "problem": "수출입 서류에는 거래처 단가와 신고 정보가 들어 있다. 외부 API로 보내는 선택지가 처음부터 없었다.",
          "alternative": "사람이 계속 입력하는 현행 유지, 또는 규칙 기반 파서. 서식이 거래처마다 달라 규칙으로는 감당이 안 됐다.",
          "choice": "사내망에 OpenAI 호환 추론 서버를 두고 붙였다. 출력은 JSON Schema로 강제하고, 신고번호처럼 형식이 정해진 값은 정규식으로 교차 검증한다. PDF는 텍스트 레이어 품질을 먼저 판정해 깨진 경우에만 OCR로 넘긴다.",
          "result": "서류가 사내망을 벗어나지 않고, 응답이 스키마를 벗어나면 애초에 파싱되지 않는다."
        },
        {
          "id": "c8",
          "title": "믿지 않고 측정했다",
          "problem": "모델 출력은 매번 같지 않다. 잘 되는 것 같다는 느낌만으로 운영에 올릴 수는 없었다.",
          "alternative": "샘플 몇 건을 눈으로 확인하고 넘어가는 방법. 실패율이 낮을수록 눈으로는 안 보인다.",
          "choice": "같은 문서를 반복 추출해 결과를 DB에 적재하는 평가 하네스를 만들고, 프롬프트나 모델을 바꿀 때마다 돌렸다. 별개로 OCR이 부모 프로세스 메모리를 반환하지 않는 문제가 있어 추출을 자식 프로세스로 분리했다.",
          "result": "추출 신뢰도를 수치로 말할 수 있게 됐고, 장시간 운영해도 API 메모리가 우상향하지 않는다."
        }
      ]
```

`adapters` 노드:

```json
      "cards": [
        {
          "id": "c9",
          "title": "외부 8종을 한 경계 뒤로",
          "problem": "관세청 API, 상용 EDI 플랫폼, 거래처 전문, 계근대 하드웨어까지 성격이 제각각이다. 예전에는 각 시스템이 필요할 때마다 직접 붙었다.",
          "alternative": "공통 클라이언트 하나로 추상화하는 방법도 검토했다. 프로토콜이 HTTP · FTP · 소켓으로 갈려 억지 추상화가 된다.",
          "choice": "추상화를 강요하지 않고 위치만 통일했다. 외부와 말하는 코드는 전부 어댑터 층에 두고, 도메인은 포트 인터페이스만 본다.",
          "result": "외부 장애와 스펙 변경이 도메인으로 새지 않는다. 연동 하나를 통째로 교체해도 도메인 코드는 그대로다."
        }
      ]
```

`cicd` 노드:

```json
      "cards": [
        {
          "id": "c10",
          "title": "모노레포에서 바뀐 것만 배포한다",
          "problem": "앱 여러 개가 한 저장소에 있으니 커밋 하나에 전체가 빌드됐다. 대기 시간이 길고 무관한 앱이 재배포됐다.",
          "alternative": "앱마다 저장소를 쪼개는 안. 공용 패키지 버전 관리 비용이 그만큼 늘어난다.",
          "choice": "부모 파이프라인이 변경 경로를 감지해 해당 앱의 자식 파이프라인만 띄운다. 브랜치가 곧 환경이고 replica 수까지 브랜치 규칙에서 결정한다. 빌드가 push한 커밋 SHA 태그를 배포가 그대로 쓴다.",
          "result": "무관한 앱은 아예 돌지 않고, 지금 떠 있는 이미지가 어느 커밋인지 태그만 보면 안다."
        }
      ]
```

`batch` 와 `db` 노드는 카드 없이 역할·구조만 보여준다. `"cards": []` 를 그대로 둔다.

- [ ] **Step 4: 엣지를 채운다**

`"edges": []` 를 교체:

```json
  "edges": [
    { "id": "e-web-api",    "from": "web",     "to": "api",      "label": "REST",    "cards": [] },
    { "id": "e-legacy-api", "from": "legacyApi","to": "api",     "label": "이전 중", "dashed": true, "cards": [] },
    { "id": "e-api-db",     "from": "api",     "to": "db",       "label": "",        "cards": [] },
    { "id": "e-api-adp",    "from": "api",     "to": "adapters", "label": "",        "cards": [] },
    { "id": "e-api-llm",    "from": "api",     "to": "llm",      "label": "",        "cards": [] },
    { "id": "e-worker-batch","from": "worker", "to": "batch",    "label": "",        "cards": [] },
    {
      "id": "e-api-queue",
      "from": "api",
      "to": "queue",
      "label": "enqueue",
      "featured": true,
      "cards": [
        {
          "id": "c5",
          "title": "배포 단위가 다른 둘 사이의 계약",
          "problem": "잡을 넣는 쪽(API)과 꺼내 쓰는 쪽(워커)이 따로 배포된다. 페이로드 필드 하나를 바꾸면 배포 순서에 따라 런타임에 터졌다.",
          "alternative": "메시지에 버전을 붙여 양쪽에서 분기하는 방법. 분기가 쌓이면 아무도 지우지 못한다.",
          "choice": "큐 이름 · 잡 타입 · 페이로드 · 내부 라우트를 한 패키지에 모으고 양쪽이 그것만 참조하게 했다. 계약을 바꾸면 두 앱이 함께 컴파일 대상이 된다.",
          "result": "계약 위반이 런타임이 아니라 빌드에서 터진다."
        }
      ]
    },
    { "id": "e-queue-worker", "from": "queue", "to": "worker", "label": "consume", "cards": [] }
  ]
```

- [ ] **Step 5: 검증을 실행한다**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `PASS: 익명화·모델 완전성 검사 통과`

- [ ] **Step 6: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "feat: 설계 결정 카드 10장과 엣지 정의"
```

---

## Task 4: AFTER 다이어그램 렌더링

**Files:**
- Modify: `assets/portfolio/architecture.html` (`<style>` 추가, `<script>` 렌더러 추가)

- [ ] **Step 1: 레이아웃과 SVG 스타일을 추가한다**

`<style>` 블록 끝(`body { ... }` 뒤)에 추가:

```css
.layout { display: grid; grid-template-columns: 1fr 380px; min-height: 100vh; }
.stage { padding: 20px 24px; }
.stage-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 8px; }
.stage-head h1 { font-size: 20px; margin: 0; letter-spacing: -0.01em; }
.stage-head p { margin: 0; color: var(--muted); font-size: 14px; }
svg#diagram { width: 100%; height: auto; display: block; }
.node rect {
  fill: var(--surface); stroke: var(--border); stroke-width: 1.5;
  rx: 10; transition: transform .55s ease, opacity .35s ease;
}
.node text { fill: var(--text); font-size: 14px; font-weight: 600; }
.node text.sub { fill: var(--muted); font-size: 11px; font-weight: 400; }
.node { cursor: pointer; transition: transform .55s cubic-bezier(.4,0,.2,1), opacity .35s ease; }
.node:hover rect { stroke: var(--accent); }
.node.is-featured rect { stroke: var(--accent); stroke-width: 2.5; }
.node.is-selected rect { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 2.5; }
.node.kind-legacy rect { stroke-dasharray: 5 4; }
.edge { transition: opacity .35s ease; }
.edge path { stroke: var(--border); stroke-width: 1.6; fill: none; marker-end: url(#arrow); }
.edge.is-featured path { stroke: var(--accent); stroke-width: 2.2; }
.edge.is-dashed path { stroke-dasharray: 5 4; }
.edge text { fill: var(--muted); font-size: 11px; }
.edge.clickable { cursor: pointer; }
.edge.clickable:hover path { stroke: var(--accent); }
.edge.is-selected path { stroke: var(--accent); stroke-width: 2.6; }
```

- [ ] **Step 2: 렌더러를 작성한다**

`const MODEL = ...` 아래에 추가:

```js
const SVG_NS = 'http://www.w3.org/2000/svg';
const NODE_W = 190;
const NODE_H = 56;

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

function nodeById(id) {
  return MODEL.nodes.find(node => node.id === id);
}

/** 두 노드 중심을 잇되, 박스 경계에서 시작·종료하는 직교 경로를 만든다. */
function edgePath(from, to) {
  const vertical = Math.abs(to.y - from.y) > Math.abs(to.x - from.x);
  if (vertical) {
    const dir = to.y > from.y ? 1 : -1;
    const y1 = from.y + dir * (NODE_H / 2);
    const y2 = to.y - dir * (NODE_H / 2);
    if (from.x === to.x) return `M ${from.x} ${y1} L ${to.x} ${y2}`;
    const mid = (y1 + y2) / 2;
    return `M ${from.x} ${y1} L ${from.x} ${mid} L ${to.x} ${mid} L ${to.x} ${y2}`;
  }
  const dir = to.x > from.x ? 1 : -1;
  const x1 = from.x + dir * (NODE_W / 2);
  const x2 = to.x - dir * (NODE_W / 2);
  if (from.y === to.y) return `M ${x1} ${from.y} L ${x2} ${to.y}`;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${from.y} L ${mid} ${from.y} L ${mid} ${to.y} L ${x2} ${to.y}`;
}

function renderDiagram() {
  const svg = svgEl('svg', { id: 'diagram', viewBox: '0 0 1000 620', role: 'group' });

  const defs = svgEl('defs');
  const marker = svgEl('marker', {
    id: 'arrow', viewBox: '0 0 10 10', refX: '9', refY: '5',
    markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse',
  });
  marker.appendChild(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'var(--border)' }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  const edgeLayer = svgEl('g', { class: 'edges' });
  for (const edge of MODEL.edges) {
    const from = nodeById(edge.from);
    const to = nodeById(edge.to);
    const group = svgEl('g', { class: 'edge', 'data-id': edge.id });
    if (edge.featured) group.classList.add('is-featured');
    if (edge.dashed) group.classList.add('is-dashed');
    group.appendChild(svgEl('path', { d: edgePath(from, to) }));
    if (edge.label) {
      const label = svgEl('text', {
        x: (from.x + to.x) / 2 + 8,
        y: (from.y + to.y) / 2 - 6,
        'text-anchor': 'middle',
      });
      label.textContent = edge.label;
      group.appendChild(label);
    }
    if (edge.cards.length) {
      group.classList.add('clickable');
      group.addEventListener('click', () => select('edge', edge.id));
    }
    edgeLayer.appendChild(group);
  }
  svg.appendChild(edgeLayer);

  const nodeLayer = svgEl('g', { class: 'nodes' });
  for (const node of MODEL.nodes) {
    const group = svgEl('g', {
      class: `node kind-${node.kind}`,
      'data-id': node.id,
      tabindex: '0',
      role: 'button',
      'aria-label': `${node.label} 상세 보기`,
    });
    if (node.featured) group.classList.add('is-featured');
    group.appendChild(svgEl('rect', {
      x: node.x - NODE_W / 2, y: node.y - NODE_H / 2, width: NODE_W, height: NODE_H,
    }));
    const title = svgEl('text', { x: node.x, y: node.y - 3, 'text-anchor': 'middle' });
    title.textContent = node.label;
    group.appendChild(title);
    const sub = svgEl('text', { class: 'sub', x: node.x, y: node.y + 15, 'text-anchor': 'middle' });
    sub.textContent = node.sub;
    group.appendChild(sub);
    group.addEventListener('click', () => select('node', node.id));
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select('node', node.id);
      }
    });
    nodeLayer.appendChild(group);
  }
  svg.appendChild(nodeLayer);
  return svg;
}

let selected = null;

function select(type, id) {
  selected = { type, id };
  for (const el of document.querySelectorAll('.node, .edge')) {
    el.classList.toggle('is-selected', el.dataset.id === id);
  }
  renderPanel();
}

function renderPanel() { /* Task 5 에서 구현 */ }

function mount() {
  const app = document.getElementById('app');
  app.className = 'layout';
  const stage = document.createElement('section');
  stage.className = 'stage';
  stage.innerHTML = `
    <div class="stage-head">
      <h1>${MODEL.meta.project}</h1>
      <p>${MODEL.meta.tagline}</p>
    </div>`;
  stage.appendChild(renderDiagram());
  app.appendChild(stage);
  const panel = document.createElement('aside');
  panel.id = 'panel';
  app.appendChild(panel);
  renderPanel();
}

mount();
```

- [ ] **Step 3: 브라우저에서 확인한다**

Run: `open assets/portfolio/architecture.html`
Expected: 노드 10개가 화살표로 연결된 다이어그램이 보인다. 노드에 마우스를 올리면 테두리가 강조되고, 클릭하면 선택 상태(배경 강조)가 된다. 오른쪽은 아직 빈 영역이다. 콘솔 에러 없음.

- [ ] **Step 4: 검증을 실행한다**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "feat: AFTER 다이어그램 SVG 렌더링"
```

---

## Task 5: 우측 상세 패널

**Files:**
- Modify: `assets/portfolio/architecture.html`

- [ ] **Step 1: 패널 스타일을 추가한다**

`<style>` 끝에 추가:

```css
#panel {
  border-left: 1px solid var(--border);
  background: var(--surface);
  padding: 22px 20px;
  overflow-y: auto;
  max-height: 100vh;
}
.panel-empty { color: var(--muted); font-size: 14px; }
.panel-title { font-size: 17px; font-weight: 700; margin: 0 0 2px; }
.panel-kicker { font-size: 12px; color: var(--muted); margin: 0 0 14px; }
.panel-role { margin: 0 0 18px; font-size: 14px; }
.panel-section-label {
  font-size: 11px; font-weight: 700; letter-spacing: .08em;
  color: var(--muted); text-transform: uppercase; margin: 0 0 6px;
}
.panel-structure {
  background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 10px 12px; margin: 0 0 20px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; line-height: 1.7; color: var(--muted);
  white-space: pre; overflow-x: auto;
}
.card {
  background: var(--bg); border: 1px solid var(--border);
  border-left: 3px solid var(--accent); border-radius: var(--radius);
  padding: 14px 15px; margin-bottom: 14px;
}
.card h3 { margin: 0 0 10px; font-size: 15px; }
.card dl { margin: 0; display: grid; grid-template-columns: 52px 1fr; gap: 6px 10px; }
.card dt {
  font-size: 11px; font-weight: 700; color: var(--muted);
  padding-top: 2px; letter-spacing: .02em;
}
.card dd { margin: 0; font-size: 13.5px; line-height: 1.65; }
.card dd.result { color: var(--accent); font-weight: 600; }
```

- [ ] **Step 2: `renderPanel` 을 구현한다**

`function renderPanel() { /* Task 5 에서 구현 */ }` 를 아래로 교체:

```js
const CARD_FIELDS = [
  ['problem', '문제'],
  ['alternative', '대안'],
  ['choice', '선택'],
  ['result', '결과'],
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]
  ));
}

function cardHtml(card) {
  const rows = CARD_FIELDS.map(([key, label]) => `
      <dt>${label}</dt>
      <dd class="${key === 'result' ? 'result' : ''}">${escapeHtml(card[key])}</dd>`).join('');
  return `
    <article class="card">
      <h3>${escapeHtml(card.title)}</h3>
      <dl>${rows}</dl>
    </article>`;
}

function findSelection() {
  if (!selected) return null;
  if (selected.type === 'node') {
    const node = nodeById(selected.id);
    return node && {
      title: node.label, kicker: node.sub, role: node.role,
      structure: node.structure, cards: node.cards,
    };
  }
  const edge = MODEL.edges.find(item => item.id === selected.id);
  return edge && {
    title: `${nodeById(edge.from).label} → ${nodeById(edge.to).label}`,
    kicker: edge.label, role: '', structure: null, cards: edge.cards,
  };
}

function renderPanel() {
  const panel = document.getElementById('panel');
  const view = findSelection();
  if (!view) {
    panel.innerHTML = `<p class="panel-empty">노드나 화살표를 클릭하면 그 지점의 설계 판단이 열립니다.</p>`;
    return;
  }
  const structure = view.structure && view.structure.length
    ? `<p class="panel-section-label">구조</p>
       <div class="panel-structure">${escapeHtml(view.structure.join('\n'))}</div>`
    : '';
  const cards = view.cards.length
    ? `<p class="panel-section-label">설계 결정</p>${view.cards.map(cardHtml).join('')}`
    : '';
  panel.innerHTML = `
    <h2 class="panel-title">${escapeHtml(view.title)}</h2>
    <p class="panel-kicker">${escapeHtml(view.kicker || '')}</p>
    ${view.role ? `<p class="panel-role">${escapeHtml(view.role)}</p>` : ''}
    ${structure}
    ${cards}`;
}
```

- [ ] **Step 3: 브라우저에서 확인한다**

Run: `open assets/portfolio/architecture.html`
Expected: 초기 상태는 안내 문구. Web 노드를 클릭하면 우측에 역할 → 구조 트리 → "클린 아키텍처를 프론트에 넣으려다 접었다" 카드가 문제/대안/선택/결과 4줄로 표시된다. API→Queue 화살표를 클릭하면 잡 계약 카드가 뜬다.

- [ ] **Step 4: 검증을 실행한다**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `PASS`

- [ ] **Step 5: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "feat: 노드·엣지 상세 패널과 설계 결정 카드"
```

---

## Task 6: BEFORE 레이아웃과 토글 애니메이션

**Files:**
- Modify: `assets/portfolio/architecture.html`

BEFORE는 별도 SVG가 아니라 **같은 캔버스의 다른 배치**다. 레거시 15개 박스는 항상 존재하되 AFTER에서는 투명도 0으로 숨고, 통합 노드들은 BEFORE에서 숨는다. 좌표를 바꾸고 CSS transition이 이동을 만든다.

- [ ] **Step 1: 토글 UI 스타일을 추가한다**

`<style>` 끝에 추가:

```css
.toggle { display: inline-flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
.toggle button {
  border: 0; background: transparent; color: var(--muted);
  padding: 6px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: inherit;
}
.toggle button[aria-pressed="true"] { background: var(--accent); color: #fff; }
.legacy rect { fill: var(--surface); stroke: var(--warn); stroke-width: 1.3; rx: 7; stroke-dasharray: 4 3; }
.legacy text { fill: var(--text); font-size: 11px; font-weight: 600; }
.legacy text.tech { fill: var(--muted); font-size: 9.5px; font-weight: 400; }
.legacy, .node, .edge, .legacy-wires { transition: opacity .4s ease; }
.hidden-layer { opacity: 0; pointer-events: none; }
.legacy-wires path { stroke: var(--warn); stroke-width: .7; fill: none; opacity: .35; }
.before-note {
  fill: var(--warn); font-size: 12.5px; font-weight: 600;
}
```

- [ ] **Step 2: BEFORE 레이어를 렌더에 추가한다**

`renderDiagram()` 안에서 `svg.appendChild(defs);` 바로 다음에 삽입:

```js
  // BEFORE 레이어: 레거시 15개 + 얽힌 연결선 + 문제 라벨
  const legacyLayer = svgEl('g', { class: 'legacy-layer hidden-layer' });
  const wires = svgEl('g', { class: 'legacy-wires' });
  const boxW = 168;
  const boxH = 42;
  const sinks = [
    { x: 200, y: 500 }, { x: 420, y: 500 }, { x: 640, y: 500 }, { x: 850, y: 500 },
  ];
  MODEL.legacy.forEach((item, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const cx = 110 + col * 195;
    const cy = 80 + row * 66;
    for (const sink of sinks) {
      wires.appendChild(svgEl('path', {
        d: `M ${cx} ${cy + boxH / 2} C ${cx} ${cy + 140}, ${sink.x} ${sink.y - 140}, ${sink.x} ${sink.y - 22}`,
      }));
    }
    const box = svgEl('g', { class: 'legacy' });
    box.appendChild(svgEl('rect', { x: cx - boxW / 2, y: cy - boxH / 2, width: boxW, height: boxH }));
    const label = svgEl('text', { x: cx, y: cy - 2, 'text-anchor': 'middle' });
    label.textContent = item.label;
    box.appendChild(label);
    const tech = svgEl('text', { class: 'tech', x: cx, y: cy + 12, 'text-anchor': 'middle' });
    tech.textContent = item.tech;
    box.appendChild(tech);
    legacyLayer.appendChild(box);
  });
  legacyLayer.insertBefore(wires, legacyLayer.firstChild);

  sinks.forEach((sink, index) => {
    const names = ['Oracle', 'UNI-PASS', '거래처 EDI', 'FTP'];
    const group = svgEl('g', { class: 'legacy' });
    group.appendChild(svgEl('rect', { x: sink.x - 80, y: sink.y - 20, width: 160, height: 40 }));
    const label = svgEl('text', { x: sink.x, y: sink.y + 5, 'text-anchor': 'middle' });
    label.textContent = names[index];
    group.appendChild(label);
    legacyLayer.appendChild(group);
  });

  ['동일 로직 중복 구현', '장애 원인 추적 불가', '신규 연동 시 15곳 수정'].forEach((note, index) => {
    const text = svgEl('text', { class: 'before-note', x: 40, y: 580 + index * 0 });
    text.setAttribute('x', 40 + index * 300);
    text.textContent = `⚠ ${note}`;
    legacyLayer.appendChild(text);
  });

  svg.appendChild(legacyLayer);
```

- [ ] **Step 3: 토글 상태와 버튼을 연결한다**

`let selected = null;` 아래에 추가:

```js
let mode = 'after';

function setMode(next) {
  mode = next;
  const svg = document.getElementById('diagram');
  svg.querySelector('.legacy-layer').classList.toggle('hidden-layer', mode !== 'before');
  for (const layer of [svg.querySelector('.nodes'), svg.querySelector('.edges')]) {
    layer.classList.toggle('hidden-layer', mode !== 'after');
  }
  for (const button of document.querySelectorAll('.toggle button')) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  }
  if (mode === 'before') {
    selected = { type: 'toggle', id: 'toggle' };
  } else {
    selected = null;
  }
  for (const el of document.querySelectorAll('.node, .edge')) el.classList.remove('is-selected');
  renderPanel();
}
```

`findSelection()` 의 첫 줄 `if (!selected) return null;` 다음에 추가:

```js
  if (selected.type === 'toggle') {
    return {
      title: '통합 이전 — 15종 파편화',
      kicker: 'C# · VB6 · Oracle Forms · 구 React · Excel 매크로 · ASP',
      role: '각 시스템이 DB와 외부 시스템에 직접 연결돼 있었다. 같은 업무 로직이 여러 벌 존재했다.',
      structure: null,
      cards: MODEL.toggleCards,
    };
  }
```

`mount()` 의 `stage.innerHTML` 을 아래로 교체:

```js
  stage.innerHTML = `
    <div class="stage-head">
      <h1>${MODEL.meta.project}</h1>
      <p>${MODEL.meta.tagline}</p>
      <div class="toggle" role="group" aria-label="구조 전환">
        <button data-mode="before" aria-pressed="false">Before</button>
        <button data-mode="after" aria-pressed="true">After</button>
      </div>
    </div>`;
```

`mount()` 의 `renderPanel();` 앞에 추가:

```js
  for (const button of stage.querySelectorAll('.toggle button')) {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  }
```

- [ ] **Step 4: 브라우저에서 확인한다**

Run: `open assets/portfolio/architecture.html`
Expected: Before 버튼을 누르면 통합 구조가 사라지고 레거시 15개 박스와 얽힌 연결선, 하단 문제 라벨 3개가 나타난다. 우측 패널에 "왜 통합인가" 카드가 뜬다. After를 누르면 원래 구조로 돌아온다. 전환이 뚝 끊기지 않고 페이드된다.

- [ ] **Step 5: 검증을 실행한다**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `PASS`

- [ ] **Step 6: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "feat: Before/After 토글과 레거시 파편화 레이어"
```

---

## Task 7: 모바일 대응과 마감

**Files:**
- Modify: `assets/portfolio/architecture.html`

- [ ] **Step 1: 반응형 스타일을 추가한다**

`<style>` 끝에 추가:

```css
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .stage { padding: 16px; }
  #panel {
    border-left: 0; border-top: 1px solid var(--border);
    max-height: none; padding: 18px 16px;
  }
  .stage-head h1 { font-size: 18px; }
  svg#diagram { min-width: 720px; }
  .diagram-scroll { overflow-x: auto; }
}
```

- [ ] **Step 2: 다이어그램을 가로 스크롤 컨테이너로 감싼다**

`mount()` 의 `stage.appendChild(renderDiagram());` 를 아래로 교체:

```js
  const scroller = document.createElement('div');
  scroller.className = 'diagram-scroll';
  scroller.appendChild(renderDiagram());
  stage.appendChild(scroller);
```

- [ ] **Step 3: 좁은 화면에서 확인한다**

Run: `open assets/portfolio/architecture.html` 후 브라우저 창을 800px 이하로 줄인다.
Expected: 패널이 다이어그램 아래로 내려가고, 다이어그램은 가로로만 스크롤된다. 페이지 본문 자체는 가로 스크롤이 생기지 않는다.

- [ ] **Step 4: 익명화 최종 확인**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `PASS: 익명화·모델 완전성 검사 통과`

추가로 눈으로 한 번 훑는다:

Run: `grep -inE "kream|kwe|samsung|삼성|apple|애플|10\.33|[a-z]{4}[0-9]{4}" assets/portfolio/architecture.html`
Expected: 출력 없음

- [ ] **Step 5: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "feat: 모바일 레이아웃 대응"
```

---

## Task 8: 15종 레거시 목록 확정

**Files:**
- Modify: `assets/portfolio/architecture.html` (`legacy` 배열)

이 태스크는 **사용자가 실제 15종 목록을 알려준 뒤에** 실행한다. 그 전까지는 자리표시자로 둔다.

- [ ] **Step 1: 자리표시자를 찾는다**

Run: `grep -n '"placeholder": true' assets/portfolio/architecture.html | wc -l`
Expected: `15`

- [ ] **Step 2: 실제 목록으로 교체한다**

각 항목의 `label`(업무명)과 `tech`(구현 기술)를 사용자가 준 내용으로 바꾸고 `"placeholder": true` 를 제거한다. 항목 수는 15개를 유지한다 — 검증 스크립트가 개수를 강제한다.

- [ ] **Step 3: 검증을 실행한다**

Run: `python3 scripts/verify-architecture-portfolio.py`
Expected: `PASS`

Run: `grep -c '"placeholder": true' assets/portfolio/architecture.html`
Expected: `0`

- [ ] **Step 4: 커밋**

```bash
git add assets/portfolio/architecture.html
git commit -m "docs: 레거시 15종 실제 목록 반영"
```

---

## Task 9: Artifact 공개

**Files:** 없음 (배포 작업)

- [ ] **Step 1: Artifact 로 발행한다**

`Artifact` 도구를 `file_path: assets/portfolio/architecture.html`, `favicon: "🗺️"`, `description: "파편화된 15종 사내 시스템을 하나의 플랫폼으로 통합한 과정 — 흐름도를 클릭하면 설계 판단이 열린다"` 로 호출한다.

발행 전 파일 전체를 읽어 익명화 위반이 없는지 최종 확인한다. Artifact 는 기본 비공개지만, 공유 시 되돌릴 수 없다.

- [ ] **Step 2: 발행된 페이지를 확인한다**

받은 URL을 열어 토글·클릭·다크모드가 모두 동작하는지 본다. Artifact 는 뷰어 테마를 따르므로 다크에서 배경이 비치지 않는지 특히 확인한다.

---

## Self-Review

**스펙 커버리지**

| 스펙 항목 | 태스크 |
|---|---|
| 익명화 매핑 | Task 1 (검증 스크립트가 강제), Task 7 Step 4 |
| 단일 HTML | Task 1 (외부 리소스 참조 검사) |
| Before/After 토글 | Task 6 |
| AFTER 흐름도 | Task 4 |
| 우측 패널 3단 (역할·구조·카드) | Task 5 |
| 엣지 클릭 | Task 4 (핸들러), Task 5 (패널) |
| 카드 10장 4줄 | Task 3 (내용), Task 5 (렌더), Task 1 (개수 검증) |
| Web 노드 시각적 강조 | Task 2 (`featured: true`), Task 4 (`.is-featured`) |
| 라이트/다크 | Task 1 (토큰) |
| 모바일 | Task 7 |
| 미결 — 15종 목록 | Task 8 |

**타입 일관성 확인 완료**: 카드 필드는 전 태스크에서 `title / problem / alternative / choice / result` 로 통일. 노드 필드는 `id / label / sub / kind / x / y / role / structure / cards`(+선택적 `featured`). 엣지 필드는 `id / from / to / label / cards`(+선택적 `featured` `dashed`). 검증 스크립트, 데이터, 렌더러가 같은 이름을 쓴다.

**자리표시자**: Task 8의 레거시 15종만 의도적으로 남긴 자리표시자이며, 스펙의 미결 사항과 일치하고 검증 스크립트가 잔존 여부를 잡는다.

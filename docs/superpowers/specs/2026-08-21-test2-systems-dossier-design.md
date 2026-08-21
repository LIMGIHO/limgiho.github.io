# `/test2/` 운영 시스템 전환 기록 디자인

## 승인과 범위

사용자는 기존 `/` 포트폴리오를 그대로 유지하고 새 시안을 `/test2/`에 구현하도록 요청했다. 이 문서는 직전 Impeccable critique에서 추천한 **운영 시스템 전환 기록 / Annotated Systems Dossier** 방향을 구현 계약으로 고정한다.

작업은 additive change다. 기존 `_layouts/portfolio.html`, `_includes/portfolio/`, `_sass/portfolio/`, `assets/css/portfolio.scss`, `assets/js/portfolio.js`, `/` 경로의 렌더 결과는 변경하지 않는다.

## 제품 맥락

방문자는 채용 검토자와 기술 면접관이다. 첫 화면에서 임기호의 대표 작업을 이해하고, 아래로 내려가며 문제·제약·결정·결과를 확인한 뒤 이력서 PDF 또는 GitHub로 이동한다. 모든 사실과 수치는 `_data/portfolio.yml`과 `_data/portfolio_profiles.yml`에서 가져온다.

## Impeccable 방향 결정

방문자 모드는 `Experience`다. 작업물이 첫 뷰포트부터 화면을 주도하고 인터페이스는 물러난다.

고유 메커니즘은 **15종의 분산 운영 시스템을 Web·API·Queue·Worker·Data 경계가 있는 하나의 플랫폼으로 전환한 과정**이다. 문화적 기반은 물류·제조 현장에서 실제로 쓰는 변경 관리 기록, 화물 인계표, 이관 대사표, 시스템 배치도다.

고려한 기반 세계는 다음 순서다.

1. 운영 시스템 변경 기록과 주석 도면
2. 화물 인계표와 라우팅 라벨
3. 제조 변경 관리 redline packet
4. 창고 교대 근무 handover board
5. 장애 사후 분석 타임라인
6. 데이터 이관 대사 원장
7. 설비 정비 기록부

Impeccable direction seed `9d7999ee`는 5번을 배정했지만, 사용자가 직전 대화에서 1번 방향을 구현하도록 요청했으므로 사용자 승인 방향이 roll보다 우선한다.

외부 challenger 평가는 다음과 같다.

- Variable type specimen — declined: 채용 맥락 식별성이 낮다. 단, 거대 artifact와 작은 판독 정보 사이의 강한 크기 대비를 가져온다.
- Seven-segment instruments — declined: 기술 포트폴리오 상투형으로 돌아갈 위험이 크다. 고정 슬롯에서 상태만 바뀌는 정직한 전환 원칙만 유지한다.
- Street typography — declined: 공연 포스터 문법은 제품 진실과 멀다. 첫 화면 제목과 도면을 화면 경계까지 밀어붙이는 규모의 용기를 가져온다.
- Mezzotint — declined: 정보 명료성과 채용 맥락을 모두 약화한다.
- Paper automata — competitive: 연결 구조를 드러내는 방식은 메커니즘과 맞지만 유희성이 전문성을 약화할 수 있다. 시스템 연결선이 한 흐름으로 연속되는 원칙을 가져온다.
- Rain-night cityscape — declined: 제품 명료성과 audience identification이 모두 낮다.

결과적으로 선택 방향은 다음 세 가지 raise를 포함한다.

1. **Specimen raise:** `15 → 1`을 부속 KPI가 아니라 첫 화면의 가장 큰 물체로 만든다.
2. **Street-scale raise:** 제목과 전환 도면이 표준 hero/card shell을 벗어나 화면 경계까지 점유한다.
3. **Automata raise:** Before와 After를 분리된 카드가 아니라 하나의 연속된 변환선으로 연결한다.

## 시각 세계

### 재료와 색

따뜻한 크림색 editorial이나 navy/cyan blueprint를 사용하지 않는다. 대신 물류 현장의 carbonless manifest와 변경 관리 스탬프에서 가져온 차가운 회녹색 종이, 검은 잉크, cobalt 기록 필드, vermilion 수정 표시를 사용한다.

- 바탕: 차가운 paper gray-green
- 본문: ink black
- 큰 정보 필드: committed cobalt
- 변경·결정 표시: vermilion
- 보조선: blue-gray rule

색은 작은 accent로 흩뿌리지 않는다. 첫 화면의 도면 필드처럼 큰 영역을 cobalt가 점유하고 vermilion은 결정 지점에만 쓴다.

### 형태

- 둥근 카드와 그림자를 쓰지 않는다.
- 경계는 1px rule, 절취선, 행 번호, 도면 좌표, stamp로 만든다.
- 큰 섹션은 카드가 아니라 문서의 장과 판으로 편집한다.
- 기술 상세은 native `<details>`로 접는다.
- 각 장은 질문 하나와 증거 하나만 갖는다.

### 타이포그래피

시스템 기본 글꼴만으로 끝내지 않는다. 한글 본문은 읽기 좋은 독립 웹폰트를 사용하고, 제목은 넓고 단단한 display weight로 대비한다. 모노스페이스는 도면 좌표, 기간, 단계 번호에만 제한한다. 영문 대문자 eyebrow를 모든 섹션에 반복하지 않는다.

## 첫 뷰포트

상단 masthead는 이름, 세 개 이하의 탐색 항목, 이력서 링크만 가진다. theme toggle은 없다.

첫 뷰포트 왼쪽에는 `CASE 01`, 대표 제목, 역할과 핵심 결정을 둔다. 오른쪽 또는 아래의 절반 이상은 `15개의 분산 단위 → Web / API / Queue / Worker / PostgreSQL` 전환 도면이 차지한다. `1,000만+`, `90+`, `변경 앱만`은 별도 KPI 카드가 아니라 도면에 붙은 annotation으로 표현한다.

모바일에서는 두 열을 단순 축소하지 않는다. `Before → Decision → After`를 세로로 재배치하고 모든 핵심 관계를 최초 375px 폭 안에서 읽을 수 있게 한다.

## 방문자 흐름

1. **첫 화면 — 전환:** 무엇을 바꿨는지 즉시 이해한다.
2. **문제와 제약:** 왜 통합이 필요했는지 읽는다.
3. **구조적 결정:** 시스템 경계와 핵심 계약을 확인한다.
4. **운영 증거:** 문서 처리, 배포, 자동화 결과를 본다.
5. **경력 맥락:** 이 결과가 어떤 경력 흐름에서 나왔는지 확인한다.
6. **직접 운영한 제품:** 앱 화면을 크게 보고 사람과 제작 역량을 기억한다.
7. **종료:** GitHub와 이력서 PDF로 이동한다.

## 파일과 책임 경계

- `test2/index.md`: `/test2/` route와 profile 선택
- `_layouts/portfolio-test2.html`: 문서 구조, Liquid 데이터 연결, direction contract
- `_includes/portfolio-test2/`: 첫 화면, 사례, 운영 증거, 경력, 제품, footer의 독립 section
- `_sass/portfolio-test2/`: tokens, foundation, masthead/hero, case sections, products, responsive 규칙
- `assets/css/portfolio-test2.scss`: test2 전용 SCSS entrypoint
- `assets/js/portfolio-test2.js`: progressive enhancement가 필요한 경우에만 사용
- `tests/test_test2_portfolio.py`: route·구조·독립성·반응형 계약 검증

## 접근성과 실패 처리

- skip link와 의미 있는 heading 계층을 제공한다.
- 모든 링크와 `<summary>`는 keyboard focus가 보인다.
- 터치 대상은 최소 44px다.
- 색만으로 상태를 전달하지 않는다.
- `prefers-reduced-motion`에서 전환 효과를 제거한다.
- JavaScript가 없어도 모든 핵심 내용과 링크가 보인다.
- 긴 도표는 모바일에서 세로 구조로 재편하며 내부 가로 스크롤에 의존하지 않는다.

## 검증 계약

- `/`의 source와 built output은 새 test2 class나 stylesheet를 참조하지 않는다.
- `_site/test2/index.html`이 생성된다.
- direction contract의 seed `9d7999ee`가 production output에 남는다.
- test2 화면에는 theme toggle, 4칸 KPI strip, page-level horizontal overflow가 없다.
- 1440px desktop과 390px mobile에서 첫 뷰포트, 대표 사례, 제품 spread를 확인한다.
- `python3 scripts/verify-portfolio.py --source-only`, Jekyll build, test2 unittest가 통과한다.
- 변경 대상에 Impeccable detector를 한 번 실행하고, 독립 finish reviewer의 verdict를 따른다.

## 범위 밖

- 기존 `/` 디자인 수정
- 포트폴리오 사실과 수치 변경
- 새 고객·성과·벤치마크 창작
- 이력서 PDF 재생성
- 기존 application별 포트폴리오 변경

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- 채용 검토자: 짧은 시간 안에 지원자의 역할, 대표 성과, 문제 해결 범위를 판단한다.
- 기술 면접관과 엔지니어: 아키텍처 경계, 운영 제약, 검증 방식, 기술 선택의 근거를 확인한다.

## Product Purpose

임기호의 경력기술서를 보완하는 포트폴리오다. 복잡한 제조·물류 운영을 플랫폼과 자동화로 전환한 실제 사례를 시각적 증거와 함께 전달한다. 성공 기준은 첫 화면에서 대표 사례를 이해하고, 이후 세부 설계와 이력서 PDF까지 자연스럽게 탐색할 수 있는 것이다.

## Positioning

기술 목록이나 자기평가가 아니라 `15종 운영 시스템 → 단일 플랫폼`, 1,000만 건 이상 데이터 이관, 비동기 실행 계약, 사내망 문서 처리, 변경 앱만 배포한 구조를 실제 작업 증거로 보여준다.

## Operating Context

방문자는 데스크톱 또는 모바일 브라우저에서 포트폴리오를 훑고, 대표 프로젝트의 문제·제약·결정·결과를 읽은 뒤 GitHub 또는 이력서 PDF로 이동한다. 포트폴리오는 GitHub Pages에 배포되는 Jekyll 정적 사이트다.

## Capabilities and Constraints

- 기존 `/` 포트폴리오의 데이터와 사실을 재사용한다.
- 기존 `/` 화면과 스타일은 변경하지 않는다.
- 새 시안은 `/test2/`에서 독립적으로 렌더한다.
- 고객사명, 내부 시스템명, 사설 주소, 실데이터를 새로 노출하지 않는다.
- 성과 수치와 기술 범위를 새로 발명하지 않는다.
- JavaScript가 실패해도 핵심 콘텐츠를 읽을 수 있어야 한다.
- 데스크톱과 모바일에서 가로 페이지 스크롤 없이 동작해야 한다.

## Evidence on Hand

- 프로젝트 사실과 수치: `_data/portfolio.yml`
- 프로필별 헤드라인과 노출 규칙: `_data/portfolio_profiles.yml`
- 개인 프로젝트 화면: `assets/portfolio/screenshots/`
- 이력서 PDF: `assets/resume/lim-giho-resume.pdf`
- 기존 아키텍처·문서 처리·배포 흐름: `_includes/portfolio/`

## Product Principles

1. 작업물이 인터페이스보다 먼저 보여야 한다.
2. 주장보다 구조·수치·제약으로 증명한다.
3. 한 화면에는 질문 하나와 핵심 증거 하나만 둔다.
4. 기술 상세은 필요할 때 펼쳐 보고, 기본 읽기 흐름은 간결하게 유지한다.
5. 모바일은 데스크톱 도면의 축소판이 아니라 세로 서사로 다시 편집한다.

## Accessibility & Inclusion

의미 있는 heading 구조, 키보드 접근, 명시적 focus 표시, 충분한 대비, 44px 이상 모바일 터치 영역, `prefers-reduced-motion` 지원을 유지한다.

# PDF 아키텍처 부록과 카카오페이 서버 지원자료 설계

**목표:** 웹에서 선택적으로 보이던 아키텍처 상세를 인쇄 전용 정적 부록으로 바꾸고, 2026-08-22 카카오페이 서버 개발자 지원자료를 기존 FDE 자료와 분리해 준비한다.

## 범위와 불변 조건

- 기존 화면용 SVG의 좌표·경계·화살표·노드 텍스트와 `assets/js/portfolio.js`의 선택 인터랙션은 변경하지 않는다.
- 화면과 인쇄 모두 원본 포트폴리오의 레이아웃과 분량을 유지한다.
- 클릭으로 표시되는 기존 `.architecture-detail`만 인쇄 시에도 유지하고, 전체 노드 인덱스·상세 카드처럼 페이지를 늘리는 정적 부록은 추가하지 않는다.
- 기존 `applications/2026-08-03/kakaopay-fde/`의 소스와 PDF는 수정하지 않는다.
- `applications/` 전체를 제외하는 대신 지원 폴더의 문서·원본·PDF만 파일 패턴으로 제외해 두 portfolio 진입점만 렌더한다.
- Kotlin, Spring, Kubernetes, MongoDB는 실제 저장소 근거가 없으므로 적합도에서 직접 근거 부족으로 표시한다.
- 지원 제출·커밋·푸시는 하지 않는다.

## PDF용 아키텍처 구조

`_includes/portfolio/architecture.html`의 기존 동적 상세 영역을 서버가 첫 노드 데이터로 렌더한 상태 그대로 인쇄한다. 웹에서는 JavaScript가 클릭한 노드의 값으로 같은 영역을 교체하고, 인쇄에서는 그 영역을 숨기지 않는다. SVG와 문서 처리·배포 Flow의 순서·크기·페이지 배치는 원본과 동일하게 둔다.

## 지원자료 구조

`applications/2026-08-22/kakaopay-server-senior-minor/`를 만들고 README, 공고 요약, 적합도 표, 지원동기 초안, 공유 레이아웃을 쓰는 portfolio 진입점, PDF 빌드 wrapper, 검증 스크립트, 안정본 이력서 복사본을 둔다.

`kakaopay_server_senior_minor` 프로필은 editorial 라이트 테마를 사용하고 서버 경계·데이터 이관·비동기·장애·배포 지표를 우선 노출한다. 기존 `default`와 `kakao` 프로필은 변경하지 않는다.

`_config.yml`은 `applications/` 부모 디렉터리를 통째로 제외하지 않고, 지원 폴더의 README·작성 문서·원본·이력서·PDF·검증 파일만 제외한다. 따라서 다음 두 portfolio 진입점만 렌더된다.

- `applications/2026-08-03/kakaopay-fde/portfolio/index.md`
- `applications/2026-08-22/kakaopay-server-senior-minor/portfolio/index.md`

이렇게 하면 기존 공통 build script의 경로와 새 경로가 모두 렌더되며, 기존 지원 폴더의 문서와 source는 그대로 둔다.

## PDF 생성·검증

공통 `scripts/build-portfolio-pdf.sh`는 root, 기존 FDE, 새 서버 지원 경로를 생성할 수 있도록 유지한다. 새 폴더의 `build.sh`는 공통 스크립트의 새 경로 대상 모드를 호출해 기존 지원 폴더 산출물을 건드리지 않는다. Chrome 인쇄는 임시 사용자 프로필과 라이트 프로필 경로를 사용한다.

`verify.py`는 새 파일 존재, 원본과 동일한 13페이지, PDF 텍스트 추출, 직무명, 8개 구성요소, 문서 처리·배포 Flow, 비어 있지 않은 PDF를 검사한다. PDF는 Poppler로 모든 페이지를 PNG로 렌더링하고 실제 이미지에서 원본과 다른 페이지 증가·겹침·빈 페이지·한글 깨짐을 확인한다.

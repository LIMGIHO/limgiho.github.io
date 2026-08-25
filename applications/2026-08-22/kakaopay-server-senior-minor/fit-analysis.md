# 카카오페이 서버 개발자 지원 적합도 분석

공고 요구사항과 현재 저장소에서 확인되는 근거를 분리해 정리한다. 근거가 없는 기술은 보유 경험으로 쓰지 않는다.

| 공고 요구사항 | 지원자의 실제 근거 | 근거 위치 | 적합도 | 부족하거나 확인할 부분 | 지원서에서 사용할 표현 |
|---|---|---|---|---|---|
| 서버 개발 5년 이상 | 2010년부터 제조·물류 업무 시스템, 2022년 이후 자동화·플랫폼을 개발·운영 | `_data/portfolio.yml` `journey` | 높음 | 실제 경력기술서의 기간·직함 최종 대조 | 제조·물류 현장에서 업무 흐름을 서버 시스템으로 바꿔 온 경험 |
| 시니어·미성년 서비스의 신규 기능과 성능 개선 | 운영 시스템을 분석하고 신규 플랫폼으로 전환하면서 운영 중 예외와 성능을 계속 보완 | `_data/portfolio.yml` `journey`, `flagship`, `automation` | 부분 | 금융·미성년 도메인 경험은 없음 | 새 기능과 기존 운영 안정성을 함께 보는 방식 |
| Kotlin 기반 설계·개발 | 현재 공개 근거는 NestJS·TypeScript 중심 | `_data/portfolio.yml` API/Web/Worker 노드 | 직접 근거 부족 | Kotlin 사용 기간과 실제 프로젝트 확인 | Kotlin 경험을 보유 기술처럼 쓰지 않고, 서버 경계 설계 경험과 전환 가능성을 설명 |
| Spring Framework | 현재 공개 근거에서 Spring 사용 기록을 확인하지 못함 | 저장소·안정본 이력서 재확인 필요 | 직접 근거 부족 | 실제 사용 여부 확인 | NestJS에서 포트·어댑터·유스케이스 경계를 적용한 경험 |
| MySQL·Redis 모델링·개발·튜닝 | Oracle·MySQL·ODBC 데이터를 PostgreSQL로 통합했고, Redis·BullMQ 작업 계약과 락을 운영 | `_includes/portfolio/transition.html`, `_data/portfolio.yml` `queue`·`worker` | 부분~높음 | MySQL 튜닝의 구체 사례는 추가 확인 | 여러 DB를 통합하고 Redis 기반 비동기 실행 경계를 운영한 경험 |
| 여러 직군 커뮤니케이션 | 다섯 부서가 반복하던 본사 업무를 분석해 자동화 흐름으로 전환 | `_data/portfolio.yml` `automation.brief`, `journey` | 높음 | 협업 상대·의사결정 사례를 면접용으로 구체화 | 현업의 실제 절차와 예외를 확인해 시스템 계약으로 바꾼 경험 |
| MSA 기반 서비스 구성 | Web·API·Queue·Worker·Data를 독립 경계와 배포 단위로 나눔 | `_data/portfolio.yml` `flagship.nodes`, `delivery_flow` | 전환 가능한 경험 | MSA라는 용어를 적용한 실제 배포 구조인지 확인 | 독립 배포 가능한 경계와 비동기 계약을 설계한 경험 |
| MongoDB | 현재 공개 근거 없음 | 저장소 전체 검색 결과 | 직접 근거 부족 | 사용 여부 확인 | 보유 기술로 기재하지 않음 |
| Docker·Kubernetes | Docker/Kaniko와 Swarm 기반 빌드·롤링 업데이트는 근거가 있음. Kubernetes는 없음 | `_data/portfolio.yml` `delivery_flow`, `writings` | Docker 높음 / Kubernetes 직접 근거 부족 | Kubernetes 운영 경험 확인 | Docker·Kaniko·Swarm 배포 경험, Kubernetes는 전환 학습 항목 |
| AI 기반 개발 생산성 향상 | 로컬 LLM·OCR로 문서를 구조화하고 JSON Schema·정규식으로 검증 | `_data/portfolio.yml` `local-llm`, `document_flow` | 부분 | 코드 생성·리뷰 등 개발 생산성 적용 경험은 별도 확인 | 사내망 문서 처리와 검증 가능한 AI 파이프라인 경험 |
| 데이터 통합·대량 이관 | Oracle·MySQL·ODBC 운영 데이터를 PostgreSQL로 재설계하고 1,000만 건 이상 이관 | `_includes/portfolio/transition.html`, `_data/portfolio.yml` `data` | 높음 | 이관 기간·검증 절차를 면접용으로 정리 | 원본·대상 양쪽 교차 검증을 포함한 데이터 이관 경험 |
| 비동기 처리 | Redis·BullMQ 큐, typed payload, Worker의 API 내부 실행 위임, Redis lock | `_data/portfolio.yml` `queue`·`worker`, edges | 높음 | 금융 트래픽 규모와 장애 정책은 별도 경험 확인 | 실행 계약과 Worker/API 경계를 분리해 재시도·중복 실행을 관리한 경험 |
| 장애 분석·재발 방지 | 운영 API OOM의 원인을 로그·설치 버전·조회 행수·반복 측정으로 좁힘 | `_data/portfolio.yml` `writings`, API writeup | 높음 | 금융 서비스 장애 대응 프로세스는 없음 | 추측을 측정으로 바꾸고 재발 방지까지 연결한 경험 |
| 직접 만든 모바일·웹 제품 운영 | 댓글 필터, 액션독, HealthDog를 모바일·웹으로 출시·운영 | `_data/portfolio.yml` `additional_work` | 부분~높음 | 금융·미성년 사용자 제품 경험은 없음 | 사용자가 실제로 쓰는 제품을 직접 만들고 운영한 경험 |

## 우선 연결할 경험

1. API·Queue·Worker·Data 경계를 먼저 보여 주고, 그 경계가 중복 실행·재시도·배포에 어떤 영향을 주는지 설명한다.
2. 1,000만 건 이상 데이터 이관과 OOM 분석을 통해 성능·안정성을 수치와 검증 절차로 설명한다.
3. 외부 시스템 8종과 여러 부서의 업무를 분석한 경험으로 도메인 지식과 커뮤니케이션을 연결한다.

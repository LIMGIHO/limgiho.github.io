# 카카오페이 FDE 이력서 PDF 버전

파일명에 `claude`가 붙은 것은 Claude가 생성한 안이고, 붙지 않은 것은 Codex가 생성한 안이다.

- Codex 배포본: `../lim-giho-kakaopay-fde-resume.pdf` (v03과 동일, 수정하지 않음)
- Claude 배포본: `../lim-giho-kakaopay-fde-resume-claude.pdf` (현재 v07)

| 버전 | 파일 | 내용 | 원본 커밋 |
| --- | --- | --- | --- |
| v01 | `lim-giho-kakaopay-fde-resume-v01.pdf` | 영문 소제목과 카드형 지표를 사용한 최초 3페이지 안 | `bed705d` |
| v02 | `lim-giho-kakaopay-fde-resume-v02.pdf` | v01 문안을 보수적으로 윤문한 안 | `671b142` |
| v03 | `lim-giho-kakaopay-fde-resume-v03.pdf` | 영문 장식과 서사형 제목을 제거한 한국형 경력 이력서 | `427a92f` |
| v04 | `lim-giho-kakaopay-fde-resume-claude-v04.pdf` | 삼성 NERP RPA(C#)를 UFS+ 무인 연동으로 교체하고, 프로젝트를 배경·판단·구현·남긴 것 4단으로 재구성한 4페이지 안. 삼성SDS 전세기 독립 승격 | 미커밋 |
| v05 | `lim-giho-kakaopay-fde-resume-claude-v05.pdf` | v04에서 자기소개서형 "이 역할과 맞닿는 지점" 블록을 제거하고, 로컬시스템팀 리더(팀원 2명) 표기를 추가한 안 | 미커밋 |
| v06 | `lim-giho-kakaopay-fde-resume-claude-v06.pdf` | 3페이지로 압축. 프로젝트 마감 칸을 결과·발견·검증·인계로 분리, KWE 주요 업무를 세로 타임라인으로 변경, 여백·중복 정리 | 미커밋 |
| v07 | `lim-giho-kakaopay-fde-resume-claude-v07.pdf` | 개인 프로젝트에 HealthDog·액션톡을 한 줄로 추가(구독 결제·광고 연동, 도메인 4계층 설계) | 미커밋 |

`a157142`에 저장된 PDF는 v03과 화면, 문안, 페이지 구성이 같다. PDF 생성 시각 등의 메타데이터만 달라 별도 버전으로 복사하지 않았다.

기존 범용 이력서 PDF는 `assets/resume/`와 `output/pdf/`에 있던 파일을 이동하거나 덮어쓰지 않고 그대로 유지한다.

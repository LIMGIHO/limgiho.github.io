# 카카오페이 서버 개발자 - 시니어/미성년 사용자 전용 서비스 지원 - 2026-08-22

- 회사: 카카오페이
- 직무: 서버 개발자 - 시니어/미성년 사용자 전용 서비스
- 지원일: 2026-08-22
- 지원 상태: `준비 중`
- 공고: https://kakaopay.career.greetinghr.com/ko/o/228860
- 경력 조건: 5년 이상
- 고용 형태: 정규직
- 근무지: 경기도 성남시 분당구 판교역로 166

## 파일

- `job-posting.md`: 2026-08-22 기준 공고 요약
- `fit-analysis.md`: 요구사항과 실제 근거를 대조한 표
- `cover-letter.md`: 이번 공고용 지원 동기 초안
- `portfolio/index.md`: 공통 포트폴리오 레이아웃을 사용하는 지원용 진입점
- `portfolio.pdf`: 지원용 포트폴리오 PDF
- `resume.pdf`: `assets/resume/lim-giho-resume.pdf`의 복사본
- `build.sh`: 지원용 포트폴리오 PDF 재생성 wrapper
- `verify.py`: 지원자료·PDF 검증 스크립트

## 재생성

저장소 루트에서 실행한다.

```bash
./applications/2026-08-22/kakaopay-server-senior-minor/build.sh
```

## 검증

```bash
python3 applications/2026-08-22/kakaopay-server-senior-minor/verify.py
```

검증은 PyMuPDF(`pymupdf` 또는 `fitz`)를 우선 사용하고, 없으면 Poppler의 `pdfinfo`·`pdftotext`로 대체한다.

## 실제 제출 전 확인

- 공고가 아직 모집 중인지와 지원 조건·절차가 바뀌지 않았는지 확인한다.
- 이력서와 지원동기의 날짜, 연락처, 경력 기간을 최신 정보와 대조한다.
- Kotlin·Spring·Kubernetes·MongoDB 경험을 실제 이력과 다시 대조하고, 근거가 없으면 보유 기술처럼 표현하지 않는다.
- PDF를 직접 열어 원본과 같은 페이지 순서·분량, 한글, 시스템 구성 상세, 문서 처리·배포 Flow를 확인한다.
- 외부 공개 링크와 익명화 상태를 확인한 뒤에만 제출한다.

# 카카오페이 FDE 지원 - 2026-08-03

최종 제출본과 재생성에 필요한 최소 소스만 보관한다.

## 파일

- `resume.pdf`: 최종 제출한 3페이지 지원서
- `portfolio.pdf`: Graphite Yellow 테마의 지원용 포트폴리오
- `portfolio/index.md`: 지원용 포트폴리오 프로필 진입점
- `cover-letter.md`: 제출한 지원 동기 원문
- `source/index.html`: 지원서 원문
- `source/resume.css`: 화면 및 A4 인쇄 스타일
- `build.sh`: Chrome 기반 PDF 생성 스크립트
- `verify.py`: HTML, PDF 내용과 페이지 구조 검증

상세 경력기술서는 저장소의 안정 경로인
`assets/resume/lim-giho-resume.pdf`를 사용한다.

## 재생성

```bash
./build.sh
python3 verify.py
```

검증 스크립트에는 PyMuPDF가 필요하다.

포트폴리오는 저장소 루트에서 다음 명령으로 재생성한다.

```bash
./scripts/build-portfolio-pdf.sh
uv run --with pymupdf python3 scripts/verify-portfolio.py --site-dir _site --pdf
```

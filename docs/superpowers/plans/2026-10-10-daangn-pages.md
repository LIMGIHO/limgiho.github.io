# Daangn Pages Implementation Plan

**Goal:** 당근 지원용 경력기술서와 포트폴리오를 공개하고 제출 PDF 링크를 연결한다.

**Architecture:** 공통 Jekyll 레이아웃에 선택적 프로필을 추가한다. 경력 프로필은 제외 항목·문장·링크·색상을, 포트폴리오 프로필은 소개·대표 수치·링크를 정의한다.

**Tech Stack:** Jekyll, Liquid, YAML, CSS/Sass, Node test runner, PyMuPDF, Playwright.

## Constraints

- 공개 경로: `/daangn/`, `/daangn/portfolio/`.
- 삼성 NERP RPA 프로젝트 및 지정한 두 문장은 당근 경력기술서에서 제거한다.
- 대표 수치는 `/Users/limgiho/Downloads/lim-giho-daangn-local-jobs-v14.pdf`에서 확인한다.
- PDF는 링크만 수정하고 v15로 저장한다.

## Tasks

- [x] `tests/daangn-pages.test.mjs`에 렌더링된 두 경로, 콘텐츠 제외, 링크와 baseurl 검증을 작성하고 `node --test tests/daangn-pages.test.mjs`의 실패를 확인한다.
- [x] `_data/career_profiles.yml`, `daangn/index.md`, `daangn/portfolio/index.md`를 만들고 `_layouts/ink-resume.html`에 프로필 선택을 추가한다.
- [x] `_data/portfolio_profiles.yml`에 당근 소개·수치를 추가하고 `_layouts/portfolio.html`, `_includes/portfolio/{hero,nav,footer,head}.html`에 프로필 링크를 적용한다.
- [x] `assets/css/daangn.css`, `_sass/portfolio/_tokens.scss`에 흰 배경·주황색 테마를 추가한다.
- [x] PyMuPDF로 v14의 두 URL을 변경해 `assets/resume/lim-giho-daangn-local-jobs-v15.pdf`, `output/pdf/lim-giho-daangn-local-jobs-v15.pdf`, Downloads의 v15 파일을 저장한다. 본문과 페이지 픽셀 해시를 비교한다.
- [x] `bundle exec jekyll build --destination _workspace/ink-resume-jekyll-site` 및 `bundle exec jekyll build --destination _workspace/ink-resume-baseurl --baseurl /ink-resume-check`를 실행한다. 새 통합 테스트와 기존 ink-resume 테스트, 포트폴리오 스타일 테스트를 실행한다.
- [x] Playwright로 데스크톱·모바일 페이지와 테마 전환을 확인한다. 배포 워크플로에 새 경로 확인을 추가한다.
- [ ] 변경 파일만 커밋하고 main에 push한다. GitHub Pages 배포 완료와 공개 경로·PDF를 확인한다.

# GIHO 웹 이력서

## 공개 경로

- 메인: `https://limgiho.github.io/`
- 메인 별칭: `/resume/` (canonical은 `/`)
- 포트폴리오: `/portfolio/`
- 당근 경력기술서: `/daangn/`
- 당근 프로젝트 포트폴리오: `/daangn/portfolio/`
- 향후 지원처별 공개 페이지는 `/applications/<slug>/` 경로를 사용한다.

메인과 `/resume/`은 `career_profile: main`을 사용한다. 소개와 22개 경력 항목은 `_data/main_career.yml`에서 가져온다. 당근 경력기술서만 `career_profile: daangn`으로 `_data/career_profiles.yml`의 소개·본문 대체 문안, 제외 항목, 링크와 스타일을 적용한다. 메인 페이지는 당근 프로필을 참조하지 않는다.

`_layouts/ink-resume.html`은 페이지의 `career_profile` 하나로 경력기술서 콘텐츠 오버라이드와 화면 스타일을 선택한다. 지원처 프로필에 정의되지 않은 내용은 메인 경력 데이터로 대체한다. `career_content_profile`은 사용하지 않는다. 포트폴리오는 별도로 `portfolio_profile`을 사용한다. `/portfolio/`은 `default`, `/daangn/portfolio/`는 `daangn` 프로필이다.

공통 경력과 프로젝트 사실은 `_data/main_career.yml`, 지원처별 경력 차이는 `_data/career_profiles.yml`에서 관리한다. 포트폴리오는 `_data/portfolio.yml`이 공통 내용이고 `_data/portfolio_profiles.yml`이 지원처별 문구와 지표를 담는다. 지원용 작업 파일은 `applications/`에 보관하고 Pages 빌드에서 제외한다. 공개 페이지 원본은 `pages/applications/<slug>/`, 공개 PDF 등은 `assets/applications/<slug>/`에 명시적으로 둔다. 기존 지원 페이지가 참조하는 `_data/resume.yml`은 보존한다. 경력 대조 및 검증 기록은 `docs/main-career-review.md`에 있다.

## 정적 자산과 동작

브라우저가 읽는 파일은 `assets/js/ink-resume.js`와 `assets/css/ink-resume.css`다. GIHO 한 줄 표지, 네이티브 스크롤에 따른 O 확대, 기본 입자의 이동, 손자취의 부드러운 소멸, 실제 읽는 위치에 따른 목차 강조를 포함한다. 정지·모션 감소·키보드 진입/복귀/본문 건너뛰기를 지원하며 JavaScript가 꺼져도 전체 본문을 읽을 수 있다.

JS 원본은 `samples/ink-resume-portal/`의 app/model/portal/renderer/resume-nav 모듈이다. 공통 geometry/material/stroke는 `samples/ink-portal-fluid/`를 사용한다. CSS 원본은 `samples/ink-resume/style.css`와 `samples/ink-resume-portal/style.css`다. 원본 변경 시 기존 환경에 설치된 esbuild로 정적 자산을 다시 생성한다:

```sh
node scripts/build-ink-resume.mjs /path/to/esbuild/lib/main.js
```

esbuild가 Node 모듈 경로에 설치되어 있으면 경로 인자를 생략할 수 있다. 생성된 JS/CSS도 함께 커밋한다. 사이트 배포에는 Jekyll만 필요하다.

## 빌드와 검증

```sh
bundle exec jekyll build --destination _workspace/ink-resume-jekyll-site
bundle exec jekyll build --destination _workspace/ink-resume-baseurl --baseurl /ink-resume-check
node --test tests/ink-resume-jekyll.test.mjs tests/ink-resume-portal-controller.test.mjs tests/ink-resume-portal-model.test.mjs tests/ink-resume-portal-renderer.test.mjs tests/ink-resume-portal-nav.test.mjs
node --test tests/daangn-pages.test.mjs
```

기존 Bundler 환경의 설정을 사용한다. 통합 테스트는 실제 빌드의 메인/22항목/원본 프로젝트별 기간·성과/최신 사실/외부 링크 속성/로컬 자산/fragment/normal 및 baseurl canonical을 확인한다. controller/model/renderer/nav 회귀는 43개다. 원래 Fluid model도 비교 회귀의 기준 소스로 보관한다.

`.github/workflows/pages-deploy.yml`이 main push 시 production Jekyll 빌드와 공개 경로 확인 후 GitHub Pages로 배포한다. 배포 완료 후 실제 메인 주소에서 runtime, PDF, font, 포트폴리오, fragment와 입자 움직임을 확인한다.

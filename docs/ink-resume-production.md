# GIHO 웹 이력서

## 공개 경로

- 메인: `https://limgiho.github.io/`
- 포트폴리오: `/portfolio/`
- `/resume/`에서도 동일 이력서를 볼 수 있으며 canonical은 메인 `/`다.

메인은 `index.md`에서 `_layouts/ink-resume.html`을 사용한다. `_data/resume.yml`에 2026-09-13 경력기술서 기준의 최신 소개와 20항목을 둔다. 표시 직함은 Backend Developer다. 경력기술서 링크는 `assets/resume/lim-giho-resume-20260913.pdf`를 사용한다.

## 정적 자산과 동작

브라우저가 읽는 파일은 `assets/js/ink-resume.js`와 `assets/css/ink-resume.css`다. GIHO 한 줄 표지, 네이티브 스크롤에 따른 O 확대, 기본 입자의 이동, 손자취의 부드러운 소멸, 실제 읽는 위치에 따른 목차 강조를 포함한다. 정지·모션 감소·키보드 진입/복귀/본문 건너뛰기를 지원하며 JavaScript가 꺼져도 본문과 PDF를 읽을 수 있다.

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
```

기존 Bundler 환경의 설정을 사용한다. 통합 테스트 3개는 실제 빌드의 메인/20항목/최신 사실/로컬 자산/fragment/normal 및 baseurl canonical을 확인한다. controller/model/renderer/nav 회귀 43개와 합계 46개다. 원래 Fluid model도 비교 회귀의 기준 소스로 보관한다.

`.github/workflows/pages-deploy.yml`이 main push 시 production Jekyll 빌드와 공개 경로 확인 후 GitHub Pages로 배포한다. 배포 완료 후 실제 메인 주소에서 runtime, PDF, font, 포트폴리오, fragment와 입자 움직임을 확인한다.

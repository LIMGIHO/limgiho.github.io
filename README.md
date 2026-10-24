# GIHO 경력기술서와 프로젝트 포트폴리오

공통 경력 데이터에서 메인 경력기술서와 지원처별 페이지를 만듭니다. 한 GitHub Pages 사이트에서 공개 경로와 프로필을 분리하고, 회사별 문구가 메인 페이지에 섞이지 않도록 관리합니다.

## 공개 경로

| 주소 | 용도 | 프로필 |
| --- | --- | --- |
| `/` | 메인 경력기술서 | `career_profile: main` |
| `/resume/` | 메인 경력기술서 별칭, canonical은 `/` | `career_profile: main` |
| `/portfolio/` | 공통 프로젝트 포트폴리오 | `portfolio_profile: default` |
| `/daangn/` | 당근 지원용 경력기술서 | `career_profile: daangn` |
| `/daangn/portfolio/` | 당근 지원용 프로젝트 포트폴리오 | `portfolio_profile: daangn` |
| `/applications/<slug>/` | 지원처별 페이지 패턴. 페이지를 명시적으로 추가한 경우에만 공개 | 지원처 slug |

## 데이터와 프로필

| 파일 | 책임 |
| --- | --- |
| `_data/main_career.yml` | 메인 소개와 공통 경력·프로젝트의 기준 데이터 |
| `_data/career_profiles.yml` | 지원처별 경력기술서 차이: 소개, 강조·제외 항목, 문구, 링크, 테마 |
| `_data/portfolio.yml` | 공통 포트폴리오 내용과 프로젝트 근거 |
| `_data/portfolio_profiles.yml` | 지원처별 포트폴리오 문구, 지표, 테마 |

경력기술서는 `career_profile` 하나로 내용과 화면을 선택합니다. `main`은 `_data/main_career.yml`을 사용하고, `daangn`은 공통 경력 데이터 위에 당근 프로필의 차이만 적용합니다. 지원처 프로필에 없는 소개나 프로젝트 내용은 메인 데이터에서 가져옵니다. `career_content_profile`처럼 내용과 화면에 서로 다른 프로필을 지정하는 키는 사용하지 않습니다.

포트폴리오는 별도 레이아웃과 데이터이므로 `portfolio_profile`로 선택합니다. 경력기술서와 포트폴리오를 함께 제공하는 지원처는 두 프로필에 같은 slug를 사용합니다.

## 페이지와 지원서 작업 파일

Jekyll이 처리하는 페이지 원본은 루트의 메인 페이지와 `pages/applications/<slug>/` 아래의 선별된 지원용 페이지입니다. 지원용 페이지에는 공개 경로를 지정하는 `permalink`와 프로필 키를 명시합니다.

```yaml
---
layout: ink-resume
career_profile: toss-securities-nodejs
permalink: /applications/toss-securities-nodejs/
title: 임기호 — 토스증권 지원용 경력기술서
---
```

`applications/`는 공고, 지원서 초안, 검토 자료, 코드 과제 등 작업용 패키지이며 Pages 빌드에서 제외됩니다. 지원 페이지 원본은 `pages/applications/<slug>/`, 공개할 PDF 등은 `assets/applications/<slug>/`에 따로 둡니다. 작업용 파일을 공개하려면 공개용 위치에 결과물을 명시적으로 준비해야 합니다.

새 지원처를 추가할 때는 안정적인 slug를 정하고, `_data/career_profiles.yml`에 경력기술서 차이만 추가합니다. 포트폴리오도 필요하면 `_data/portfolio_profiles.yml`에 같은 slug로 차이를 추가하고, `pages/applications/<slug>/`에 필요한 페이지 원본을 만듭니다. 전체 경력 내용을 복사해 지원서마다 중복 관리하지 않습니다.

공개 문구에는 고객사명, 내부 시스템명, 사설 주소와 연결 정보를 넣지 않습니다. 대표 프로젝트의 시스템 구성은 `_data/portfolio.yml`의 `nodes`, `edges`, `pipeline`을 기준으로 표현합니다.

## 로컬 빌드와 검증

Ruby 3.1.6과 저장소의 `Gemfile.lock` 기준으로 실행합니다.

```sh
bundle install
bundle exec jekyll serve
bundle exec jekyll build --config _config.yml --destination _workspace/ink-resume-jekyll-site
bundle exec jekyll build --config _config.yml --destination _workspace/ink-resume-baseurl --baseurl /ink-resume-check
node --test tests/ink-resume-jekyll.test.mjs tests/ink-resume-portal-controller.test.mjs tests/ink-resume-portal-model.test.mjs tests/ink-resume-portal-renderer.test.mjs tests/ink-resume-portal-nav.test.mjs
node --test tests/daangn-pages.test.mjs
python3 scripts/verify-portfolio.py --site-dir _workspace/ink-resume-jekyll-site
```

`.github/workflows/pages-deploy.yml`은 `main`에 반영된 변경을 한 번 빌드해 GitHub Pages에 배포합니다. 상세한 이력서 빌드·검증 절차는 [`docs/ink-resume-production.md`](docs/ink-resume-production.md)를 참고하세요.

# 임기호 엔지니어링 포트폴리오

경력기술서와 함께 기업에 제출하는 프로젝트 중심 포트폴리오다. 기본 URL은 범용 Ice Blue 프로필을 사용하고, 지원 회사별 문구·핵심 지표·강조 판단·테마는 프로필 데이터로 교체한다.

## 로컬 확인

```bash
bundle install
bundle exec jekyll serve
```

- 기본 포트폴리오: `http://127.0.0.1:4000/`
- 카카오 지원 프로필: `http://127.0.0.1:4000/applications/2026-08-03/kakaopay-fde/portfolio/`

## 콘텐츠와 프로필

- 공통 경력·프로젝트 근거: `_data/portfolio.yml`
- 지원처별 헤드라인·지표·강조 판단·테마: `_data/portfolio_profiles.yml`
- 기본 페이지: `index.md`
- 카카오 지원 페이지: `applications/2026-08-03/kakaopay-fde/portfolio/index.md`

새 지원처용 페이지는 `portfolio_profile` 값만 새 프로필 키로 지정한다. 외부 공개 문구에는 고객사명, 내부 시스템명, 사설 주소와 연결 정보를 넣지 않는다.

현재는 로컬 화면에서 내용을 다듬는 단계다. PDF는 화면과 문구가 확정된 뒤 명시적으로 생성한다.

화면 검증은 다음 명령으로 실행한다.

```bash
bundle exec jekyll build
python3 scripts/verify-portfolio.py --site-dir _site
```

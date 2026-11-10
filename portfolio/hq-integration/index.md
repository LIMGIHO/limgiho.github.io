---
layout: case-study
case_study: hq-integration
permalink: /portfolio/hq-integration/
---
<section id="problem" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">01</span>문제와 제약</h2>

본사 시스템에 반복 입력하던 업무를 Puppeteer로 자동화했습니다. 운임 입력·정산·마감 등 반복 업무를 자동화해, 당시 처리량과 작업 시간을 기준으로 월 약 1,200시간의 절감 효과를 추산했습니다. 자동화 범위가 늘면서 회선 부담을 줄일 필요가 있었습니다.

[업무별 절감 효과와 산정 근거 ↗](https://velog.io/@lasid84/RPA프로젝트구축)

브라우저가 화면 자원을 함께 불러오면서 100Mbps 사내 회선의 60~70Mbps를 사용했습니다. 공개된 연동 API가 없어 화면이 주고받는 요청과 인증 흐름을 직접 분석했습니다.
</section>

<section id="analysis" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">02</span>화면의 API 호출과 업무 조건 분석</h2>

<div class="hq-analysis-columns" markdown="0">
  <section><span class="hq-analysis-number">01</span><h3>입력 항목별 요청</h3><p>차지 입력 시 항목마다 호출되는 API 확인</p></section>
  <section><span class="hq-analysis-number">02</span><h3>실행 조건</h3><p>B/L 상태·ETD에 따른 처리 구분</p></section>
  <section><span class="hq-analysis-number">03</span><h3>처리 순서</h3><p>모든 하우스의 마감 완료 후 마스터 마감</p></section>
</div>
</section>

<section id="implementation" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">03</span>두 서버의 로그인 충돌 방지</h2>

<div class="case-side-by-side" markdown="0">
{% include case-study/hq-session.html %}
<div class="side-copy" markdown="1">

### 두 서버에서 같은 세션 사용

본사 시스템은 새로 로그인하면 기존 세션이 끊겼습니다. API 서버 두 대가 각각 로그인하면 서로의 요청에 영향을 줄 수 있어, Redis에서 세션을 공유하고 분산 락으로 인증 과정을 제어했습니다.



락을 획득한 뒤에도 공유 세션을 다시 확인했습니다. 기다리는 동안 다른 요청이 이미 갱신했다면 그 세션을 사용해 불필요한 재로그인을 피하도록 했습니다. 사용자 요청과 배치에서는 같은 인증 로직을 재사용했습니다.

</div>
</div>

</section>

<section id="improvement" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">04</span>운영 후 반복 조회 개선 <small>2026.10</small></h2>

항공수출 화면에서 목록의 행을 연속으로 선택하면, 최종 선택한 항목뿐 아니라 이동 중 거친 항목의 문서도 조회했습니다. 변경이 드문 템플릿 역시 상세 화면을 열 때마다 본사 시스템에서 다시 불러왔습니다.

<ol class="decision-list">
  <li><h3>연속 선택 중 마지막 대상 조회</h3><p>공통 첨부파일 관리 패널에 0.5초 디바운스를 적용했습니다. 최초 열기와 명시적 새로고침은 즉시 처리하고, 이전 대상의 늦은 응답은 제외했습니다.</p></li>
  <li><h3>변경이 드문 템플릿 캐시</h3><p>템플릿 검색 결과를 Redis에 1시간 캐시했습니다. 빈 결과는 재사용하되 오류는 저장하지 않고, Redis 장애 시 본사 시스템을 직접 조회하도록 했습니다.</p></li>
</ol>

<aside class="case-callout">연속 선택 시 마지막 항목만 조회하고, 템플릿은 캐시해 해당 화면의 일일 외부 호출을 <strong>약 7천 건에서 5천 건</strong>으로 줄였습니다.</aside>
</section>

---
layout: case-study
case_study: platform-integration
permalink: /portfolio/platform-integration/
---
<section id="problem" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">01</span>통합이 필요했던 이유</h2>

100개 이상의 프로그램을 인계받았습니다. 기술과 DB가 달라 같은 업무를 바꾸려 해도 프로그램마다 따로 수정해야 했습니다.

{% include case-study/platform-transition.html %}

- **거래처 정산 방식 변경:** 항공수입·항공수출 프로그램에서 각각 설정을 변경.
- **다른 부서의 같은 요구:** 항공수출에 만든 제출 자료 구성 기능을 해운수출에서도 원했지만, 기술이 달라 그대로 적용하지 못함.

</section>

<section id="structure" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">02</span>시스템 구성</h2>

전체 구조를 설계하고 3명이 개발했습니다. 기존 프로그램과 DB 프로시저의 업무 로직을 NestJS 백엔드로 옮겼습니다.

{% include case-study/architecture.html flagship=site.data.platform_architecture %}

<ul class="platform-decisions">
  <li><strong>전달할 작업은 DB에 기록.</strong> Relay가 미전달 행을 잠그고 같은 jobId로 큐에 등록합니다. 중단된 전달은 다시 시도합니다.</li>
  <li><strong>업무 완료는 API에서 기록.</strong> 결과와 DONE을 저장한 뒤 Consumer가 큐 처리를 끝냅니다. 외부 응답이 유실된 작업은 실제 처리 결과를 확인합니다.</li>
  <li><strong>외부 연동은 방식별로 분리.</strong> HTTP 요청·파일 수집·TCP 수신을 각각 구현하고, 본사 연동과 관세청 조회를 여러 부서에서 재사용했습니다.</li>
</ul>
</section>

<section id="operation" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">03</span>바뀐 점</h2>

<dl class="rule-examples">
  <div><dt>거래처 정보 통합</dt><dd>5개 업무부의 거래처 약 3만 건을 정제해 글로벌 코드에 연결했습니다. 같은 사업자번호라도 공장별로 구분해야 하는 예외는 현업과 확인했습니다.</dd></div>
  <div><dt>조회·입력 연결</dt><dd>관세청 통관 상태 조회와 본사 입력을 연결해, 두 시스템을 오가던 작업을 건당 약 10분에서 약 5초로 줄였습니다.</dd></div>
  <div><dt>유지보수 절차 마련</dt><dd>개선 요청을 접수·검토한 뒤 개발에 반영하고, 주간 코드 리뷰와 변경 내역 문서화를 진행했습니다.</dd></div>
</dl>
</section>

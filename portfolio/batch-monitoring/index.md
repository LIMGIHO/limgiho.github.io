---
layout: case-study
case_study: batch-monitoring
permalink: /portfolio/batch-monitoring/
---
<section id="why" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">01</span>왜 만들었나</h2>

API·Worker 등 여러 컨테이너의 로그를 한곳에서 보기 위해 만들었습니다. 목적은 배치 작업 확인에 그치지 않고, 사용자가 화면을 어떻게 쓰는지, 알려지지 않은 채 반복되는 에러가 있는지, 응답이 느린 요청이 어디인지, 손봐야 할 기술 부채 후보가 무엇인지를 로그로 파악하는 것입니다.

Docker Swarm 노드 두 대에서 프론트·API·Worker·Redis 서비스가 컨테이너로 실행되고, 모든 컨테이너 로그를 Loki로 모아 한 화면에서 조회합니다.

<figure class="log-flow">
  <div class="log-flow-scroll">
  <svg viewBox="0 0 770 350" role="img" aria-labelledby="logflow-title logflow-desc" xmlns="http://www.w3.org/2000/svg">
    <title id="logflow-title">로그 수집과 조회 구조</title>
    <desc id="logflow-desc">Docker Swarm의 두 노드 각각에서 컨테이너별로 Docker 로그 파일(json-file)이 하나씩 만들어지고, 노드마다 하나의 Grafana Alloy가 그 파일들을 모아 읽는다. 두 Alloy가 Loki로 로그를 전송한다. 로그 모니터링 화면(Next.js)은 Loki에 조회를 요청하고 결과를 받는다.</desc>
    <defs>
      <marker id="lf-send" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 10 5 0 10z" fill="#0f766e"/></marker>
      <marker id="lf-query" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 10 5 0 10z" fill="#4b5563"/></marker>
      <marker id="lf-result" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 10 5 0 10z" fill="#1d4ed8"/></marker>
      <marker id="lf-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" fill="#6b7280"/></marker>
      <g id="lf-container"><rect width="32" height="26" rx="4" fill="#fff" stroke="#4b5563" stroke-width="1.6"/><path d="M5 9h22M5 17h22" stroke="#4b5563" stroke-width="1.6"/></g>
      <g id="lf-file"><path d="M0 4a4 4 0 0 1 4-4h16l10 10v22a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4z" fill="#fff" stroke="#4b5563" stroke-width="1.6"/><path d="M20 0v10h10" fill="none" stroke="#4b5563" stroke-width="1.6"/><path d="M7 18h16M7 25h16" stroke="#9ca3af" stroke-width="2"/></g>
      <g id="lf-alloy"><rect width="44" height="38" rx="7" fill="#e7f4ef" stroke="#0f766e" stroke-width="1.8"/><path d="M11 10h22L25 21v9l-6-3v-6z" fill="#0f766e"/></g>
      <g id="lf-browser"><rect width="70" height="60" rx="6" fill="#fff" stroke="#4b5563" stroke-width="1.8"/><path d="M0 14h70" stroke="#4b5563" stroke-width="1.8"/><circle cx="9" cy="7" r="2.2" fill="#4b5563"/><circle cx="17" cy="7" r="2.2" fill="#4b5563"/><circle cx="25" cy="7" r="2.2" fill="#4b5563"/><path d="M10 28h50M10 38h36M10 48h44" stroke="#9ca3af" stroke-width="2.4"/></g>
    </defs>
    <rect x="8" y="8" width="552" height="334" rx="10" fill="#f6faf8" stroke="#6b8f84" stroke-width="1.6" stroke-dasharray="7 5"/>
    <text x="24" y="32" class="lf-t lf-b">Docker Swarm</text>
    <rect x="28" y="62" width="324" height="126" rx="8" fill="#fff" stroke="#b5c4be" stroke-width="1.4"/>
    <use href="#lf-container" x="44" y="76"/>
    <path d="M76 89H98" stroke="#6b7280" stroke-width="2" fill="none"/>
    <g transform="translate(100 77)"><use href="#lf-file" transform="scale(.62)"/></g>
    <path d="M122 89H140" stroke="#6b7280" stroke-width="2" fill="none"/>
    <use href="#lf-container" x="44" y="112"/>
    <path d="M76 125H98" stroke="#6b7280" stroke-width="2" fill="none"/>
    <g transform="translate(100 113)"><use href="#lf-file" transform="scale(.62)"/></g>
    <path d="M122 125H140" stroke="#6b7280" stroke-width="2" fill="none"/>
    <use href="#lf-container" x="44" y="148"/>
    <path d="M76 161H98" stroke="#6b7280" stroke-width="2" fill="none"/>
    <g transform="translate(100 149)"><use href="#lf-file" transform="scale(.62)"/></g>
    <path d="M122 161H140" stroke="#6b7280" stroke-width="2" fill="none"/>
    <path d="M140 89V161" stroke="#6b7280" stroke-width="2" fill="none"/>
    <path d="M140 125H186" stroke="#6b7280" stroke-width="2" fill="none" marker-end="url(#lf-gray)"/>
    <use href="#lf-alloy" x="190" y="106"/>
    <text x="212" y="172" class="lf-t" text-anchor="middle" fill="#0f766e">Alloy</text>
    <rect x="28" y="200" width="324" height="126" rx="8" fill="#fff" stroke="#b5c4be" stroke-width="1.4"/>
    <use href="#lf-container" x="44" y="214"/>
    <path d="M76 227H98" stroke="#6b7280" stroke-width="2" fill="none"/>
    <g transform="translate(100 215)"><use href="#lf-file" transform="scale(.62)"/></g>
    <path d="M122 227H140" stroke="#6b7280" stroke-width="2" fill="none"/>
    <use href="#lf-container" x="44" y="250"/>
    <path d="M76 263H98" stroke="#6b7280" stroke-width="2" fill="none"/>
    <g transform="translate(100 251)"><use href="#lf-file" transform="scale(.62)"/></g>
    <path d="M122 263H140" stroke="#6b7280" stroke-width="2" fill="none"/>
    <use href="#lf-container" x="44" y="286"/>
    <path d="M76 299H98" stroke="#6b7280" stroke-width="2" fill="none"/>
    <g transform="translate(100 287)"><use href="#lf-file" transform="scale(.62)"/></g>
    <path d="M122 299H140" stroke="#6b7280" stroke-width="2" fill="none"/>
    <path d="M140 227V299" stroke="#6b7280" stroke-width="2" fill="none"/>
    <path d="M140 263H186" stroke="#6b7280" stroke-width="2" fill="none" marker-end="url(#lf-gray)"/>
    <use href="#lf-alloy" x="190" y="244"/>
    <text x="212" y="310" class="lf-t" text-anchor="middle" fill="#0f766e">Alloy</text>
    <path d="M234 125H440V194" stroke="#0f766e" stroke-width="2.6" fill="none"/>
    <path d="M234 263H440V194" stroke="#0f766e" stroke-width="2.6" fill="none"/>
    <path d="M440 194H458" stroke="#0f766e" stroke-width="2.6" fill="none" marker-end="url(#lf-send)"/>
    <text x="395" y="116" class="lf-t" text-anchor="middle" fill="#0f766e">전송</text>
    <path d="M462 176v36a25 7 0 0 0 50 0v-36" fill="#fff" stroke="#4b5563" stroke-width="1.8"/>
    <ellipse cx="487" cy="176" rx="25" ry="7" fill="#e5e7eb" stroke="#4b5563" stroke-width="1.8"/>
    <path d="M462 194a25 7 0 0 0 50 0" fill="none" stroke="#4b5563" stroke-width="1.8"/>
    <text x="487" y="246" class="lf-t lf-b" text-anchor="middle">Loki</text>
    <text x="487" y="268" class="lf-t" text-anchor="middle">로그 저장</text>
    <path d="M646 182H516" stroke="#4b5563" stroke-width="2.2" stroke-dasharray="6 4" fill="none" marker-end="url(#lf-query)"/>
    <text x="604" y="170" class="lf-t" text-anchor="middle" fill="#4b5563">조회 요청</text>
    <path d="M516 206H646" stroke="#1d4ed8" stroke-width="2.2" fill="none" marker-end="url(#lf-result)"/>
    <text x="604" y="230" class="lf-t" text-anchor="middle" fill="#1d4ed8">조회 결과</text>
    <use href="#lf-browser" x="650" y="164"/>
    <text x="685" y="252" class="lf-t lf-b" text-anchor="middle">로그 모니터링</text>
    <text x="685" y="274" class="lf-t" text-anchor="middle">Next.js</text>
  </svg>
  </div>
  <figcaption>각 노드의 Alloy가 Docker 로그 파일을 읽어 Loki로 보냅니다.<span class="log-flow-hint"> 좁은 화면에서는 좌우로 밀어 볼 수 있습니다.</span></figcaption>
</figure>
</section>

<section id="all-logs" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">02</span>전체 로그 화면</h2>

앱·레벨·검색어·request_id·기간으로 컨테이너 로그를 조회합니다. API·Worker·프론트(KREAM_APP) 로그가 시각순으로 한 목록에 섞여 보이고, HTTP 요청은 메서드·응답 코드·처리 시간이 함께 보입니다. 같은 조회 범위의 시간대별 건수, 레벨 분포, 요청 경로별 건수·5xx·p95도 화면 오른쪽 패널에 보입니다.

<figure class="monitor-capture">
  <a href="{{ '/assets/portfolio/batch-monitoring/all-logs.png' | relative_url }}" target="_blank" rel="noopener"><img src="{{ '/assets/portfolio/batch-monitoring/all-logs.png' | relative_url }}" alt="전체 로그 화면: 왼쪽에 앱·레벨·기간 필터와 시각순 로그 목록, 오른쪽에 시간대별 건수·레벨 분포·요청 경로별 집계 패널" width="2989" height="1471" loading="lazy"></a>
  <figcaption>전체 로그 화면 전체 캡처입니다. 클릭하면 원본 크기로 열립니다. 이름, 로그인 ID, 접속 주소, 운송장·문서 번호, 파일명만 가렸습니다.</figcaption>
</figure>
</section>

<section id="reading" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">03</span>매일 로그 확인과 개선</h2>

매일 로그에서 반복되는 오류와 응답이 느린 요청을 찾아 개선할 부분을 정합니다. 요청 상세 화면에서는 같은 request_id의 로그가 기록 시각순으로 나열됩니다.

<figure class="monitor-capture">
  <a href="{{ '/assets/portfolio/batch-monitoring/request-detail.png' | relative_url }}" target="_blank" rel="noopener"><img src="{{ '/assets/portfolio/batch-monitoring/request-detail.png' | relative_url }}" alt="요청 상세 화면: 선택한 로그 한 줄과 같은 request_id의 로그가 기록 시각순으로 나열된 패널" width="2991" height="1474" loading="lazy"></a>
  <figcaption>요청 상세 화면 전체 캡처입니다. 클릭하면 원본 크기로 열립니다.</figcaption>
</figure>
</section>

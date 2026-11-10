---
layout: case-study
case_study: document-automation
permalink: /portfolio/document-automation/
---
<section id="problem" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">01</span>담당자마다 달랐던 검토 기준</h2>

통관 서류를 보낼 때는 인보이스와 발주서의 발주번호·수량 등 여러 문서의 값이 같은지 확인해야 했습니다. 하지만 어떤 서류를 기준으로 대조할지, 추가 서류가 필요한 조건은 무엇인지가 담당자의 경험에 의존하고 있었습니다.

누군가는 인보이스에서, 누군가는 패킹리스트에서 값을 확인했습니다. 필수 서류의 필요 여부도 서로 다른 문서를 근거로 판단했습니다. 서류를 보낸 뒤 부족하다는 회신이 와야 다시 확인하는 일이 생겼습니다.

<aside class="case-callout">자동화에 앞서 현업과 서류 9종의 대조 항목과 조건을 정리하고, 20개 업무 규칙으로 검토 기준을 맞췄습니다.</aside>
</section>

<section id="extraction" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">02</span>다양한 파일을 검토 가능한 정보로 변환</h2>

업체마다 양식이 다르고 DOC·DOCX·엑셀·PDF·스캔본 등 접수 형식도 다양했습니다. 파일 형식에 따른 데이터 추출과 LLM 호출을 나누고, 문서별 추출 항목과 few-shot 예시를 설정으로 관리했습니다.

<div class="document-ocr-case document-model-choice" markdown="0">
<h3>6GB GPU에서 사용할 모델 선택</h3>
<p>GPU 증설 전에 기존 사내 장비로 자동화 효과를 확인해야 했습니다. Gemma·Qwen·카나나의 4B~8B급 모델을 테스트했습니다.</p>
<table><thead><tr><th scope="col">모델</th><th scope="col">테스트에서 확인한 점</th></tr></thead><tbody><tr><th scope="row">카나나</th><td>문서 추출 성능이 부족</td></tr><tr><th scope="row">Qwen</th><td>추출 성능은 괜찮았지만 응답에 중국어가 섞이는 경우 발생</td></tr><tr class="document-model-selected"><th scope="row">Gemma 4B</th><td>추출 결과와 6GB GPU에서의 실행 안정성을 고려해 선택</td></tr></tbody></table>
</div>

{% include case-study/document-flow.html flow=site.data.document_case_flow %}

<div class="document-ocr-case" markdown="0">
<h3>해상도를 높였지만 품목 순번이 누락된 사례</h3>
<p>같은 발주서를 해상도별로 비교하니, 400dpi에서 품목 순번 5개가 모두 누락됐습니다. 200·300dpi에서는 정상 추출돼 기본값을 200dpi로 정하고, 신뢰도가 낮은 페이지만 높은 해상도로 재시도하도록 했습니다.</p>
<table><thead><tr><th scope="col">확인 항목</th><th scope="col">200dpi</th><th scope="col">300dpi</th><th scope="col">400dpi</th></tr></thead><tbody><tr><th scope="row">발주서 A의 품목 순번 추출</th><td>5/5</td><td>5/5</td><td>0/5</td></tr><tr><th scope="row">발주서 B의 품목 순번 추출</th><td>2/2</td><td>2/2</td><td>2/2</td></tr></tbody></table>
<p class="document-ocr-source">2026.09.01 발주서 2건 비교 · 추출된 품목 순번 수 / 해당 문서의 품목 수</p>
</div>

</section>

<section id="validation" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">03</span>서류 간 불일치와 누락 항목 확인</h2>

OCR·로컬 LLM으로 추출한 정보를 이용해 발주번호·수량 등 문서 간 값의 일치와 필수 서류 구비 여부를 검사했습니다. 담당자가 결과를 확인할 수 있도록 판정 근거를 화면에 표시했습니다.

<dl class="rule-examples">
  <div><dt>문서 간 값 비교</dt><dd>인보이스와 발주서 등의 발주번호·수량이 일치하는지 확인</dd></div>
  <div><dt>필수 서류 확인</dt><dd>현업과 정리한 업무 조건에 따라 필요한 서류의 구비 여부 확인</dd></div>
  <div><dt>담당자 확인</dt><dd>불일치·누락 결과와 판정 근거를 화면에서 검토</dd></div>
</dl>

문서에서 어떤 항목을 읽어야 하는지와 업무에서 그 항목을 어떻게 대조할지 구분해 관리했습니다. 문서별 추출 설정을 조정하면서도 현업과 맞춘 검토 기준을 확인할 수 있도록 구성했습니다.
</section>

<section id="outcome" class="case-section" data-case-section markdown="1">
<h2><span class="section-no">04</span>검토부터 후속 업무까지 연결</h2>

특정 고객사 관련 월 약 600건의 통관 업무에서, 현업 확인 기준 통관 1건당 서류 검토 시간이 8분에서 3분으로 줄었습니다.

<figure class="workflow-figure">
  <p class="figure-title">추출한 정보를 후속 업무에서 재사용</p>
  <ol class="flow-steps workflow-steps"><li><strong>서류 검토</strong><span>누락·불일치 확인</span></li><li><strong>시스템 등록</strong><span>추출 정보 활용</span></li><li><strong>메일 작성·첨부</strong><span>관련 서류 연결</span></li></ol>
  <figcaption>시스템 입력과 회신 메일 작성·파일 첨부까지 이어지도록 자동화했습니다.</figcaption>
</figure>

검토 과정에서 추출한 정보로 선적서와 프리알럿 메일을 작성하고 관련 서류를 첨부하도록 연결했습니다. 담당자가 같은 정보를 다시 입력하는 작업도 함께 줄였습니다.
</section>

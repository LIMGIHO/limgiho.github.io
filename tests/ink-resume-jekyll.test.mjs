import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url),site=new URL('_workspace/ink-resume-jekyll-site/',root);
const html=()=>readFile(new URL('index.html',site),'utf8').catch(()=>'');

test('the original Jekyll main URL uses the latest resume and remains canonical for the separate route',async()=>{
  const page=await html();assert.ok(page,'build the real Jekyll main page');
  assert.doesNotMatch(page,/\{[%{]/);assert.equal([...page.matchAll(/<article class="resume-item"/g)].length,23);
  const about=page.slice(page.indexOf('class="about-prose"'),page.indexOf('class="about-image"'));
  for(const paragraph of [
    '업무의 의미가 드러나고, 안심하고 바꿀 수 있는 코드를 지향합니다.',
    '비슷해 보이는 코드라도 업무에서 맡는 책임과 변경 이유를 살펴 공통화합니다. 함께 바뀌어야 하는 것은 모으고, 업무마다 달라지는 판단은 분리합니다.',
    '테스트로 기존 업무 동작이 유지되는지 확인하며 구조를 개선합니다. 운영 중 반복되는 문제와 변경하기 어려운 부분을 찾아, 팀이 이해하고 고쳐 나갈 수 있는 코드로 다듬습니다.',
    '문제를 해결할 때는 제 판단도 검증의 대상으로 둡니다. 예상과 실제 동작이 다르면 로그와 실행 환경을 다시 확인하고, 근거에 따라 판단을 바꿉니다.'
  ])assert.ok(about.includes(paragraph),paragraph);
  assert.doesNotMatch(about,/반복 업무를 자동화하는 시스템을 만들고 운영해 온 백엔드 개발자 임기호입니다\./);
  assert.ok(page.includes('RPA 프로젝트 (삼성 NERP 연동)'));
  const nerp=page.split('<h4>RPA 프로젝트 (삼성 NERP 연동)</h4>')[1].split('</article>')[0];
  assert.doesNotMatch(nerp,/1,200|산정치/);
  assert.doesNotMatch(page,/기존 경력기술서 산정치|회신 메일|최우수사원|통합하고 있습니다/);
  for(const fact of ['20개 업무 규칙','월 100~600건','프리알럿','해운수입 업무의 신규 전산화','힙·RSS를 분석하고'])assert.ok(page.includes(fact),fact);
  for(const fact of ['백엔드 개발자','디지털솔루션부','후속 업무에서 하루 약 1시간','60~70Mbps','5Mbps 미만','액션독','수만 건','500건','별도로 모사해','heapUsed','약 12분에서 6분','2020년 우수사원 선정','2017년 과장 조기 진급','TCP','1,000만 건'])assert.ok(page.includes(fact),fact);
  assert.doesNotMatch(page,/Full-Stack|월 약 200시간|월 200시간|전략개발부|54,565행|BL 건수와 API 호출 수는 별개|30~40%|3인 공동 장애 분석|3분 27초|2분 25초/);
  assert.doesNotMatch(page,/href="[^"]*\.pdf(?:[?#][^"]*)?"/);
  assert.match(page,/<link rel="canonical" href="https:\/\/limgiho\.github\.io\/">/);
  const alias=await readFile(new URL('resume/index.html',site),'utf8');
  assert.match(alias,/<link rel="canonical" href="https:\/\/limgiho\.github\.io\/">/);
  const entries=value=>[...value.matchAll(/<article class="resume-item"[^>]*>[\s\S]*?<\/article>/g)].map(match=>match[0]);
  assert.deepEqual(entries(alias),entries(page),'the resume alias retains the main content');
});
test('web links open independently while reading navigation stays local and all career entries are visible',async()=>{
  const page=await html();assert.ok(page);
  const links=[...page.matchAll(/<a\b([^>]+)>/g)].map(m=>m[1]);
  for(const attrs of links){
    const href=attrs.match(/href="([^"]+)"/)?.[1]??'';
    if(/^https?:|^\/portfolio\//.test(href)){
      assert.match(attrs,/target="_blank"/,href);
      assert.match(attrs,/rel="noopener noreferrer"/,href);
    }
    if(href.startsWith('#'))assert.doesNotMatch(attrs,/target=/,href);
  }
  const surface=page.slice(page.indexOf('class="resume-surface"'));
  assert.doesNotMatch(surface,/<details|\binert\b|\shidden(?:\s|>|=)/);
  assert.ok(page.includes('동료 1명'));assert.ok(page.includes('세션을 다시 확인'));assert.ok(page.includes('3인 개발팀에서 주간 코드 리뷰와 개발 기준 정립을 담당합니다.'));
  assert.doesNotMatch(surface,/토스|지원 동기|검토본|ELK|loginPromises|exactly.once/i);
});
test('selected work projects retain their periods and approved outcomes, alongside three personal products',async()=>{
  const page=await html();
  const articles=[...page.matchAll(/<article class="resume-item"[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
  const expected=[
    ['통관 서류 검증 자동화','2026.06 ~ 2026.09','9종','55개','8분','3분','하루 약 1시간'],
    ['웹 기반 통합 사내 시스템 구축','2023.09 ~ 2026.08','15종','5개 업무부','3만 건','10분','5초'],
    ['본사 시스템 연동 방식 전환과 처리 결과 검증','2025.06 ~ 2025.10','기존 자동화','1,200시간','추산'],
    ['호출 기록 분석과 반복 조회 개선','2026.10','약 29%','약 7천 건에서 5천 건','항공수출 업무 화면','0.5초','1시간'],
    ['Docker Swarm 기반 CI/CD 표준 배포 체계 구축','2025.11 ~ 2025.12','실패','브랜치·SHA 태그','디제스트','Portainer','모니터링 환경을 구축','약 12분에서 6분'],
    ['백엔드 서비스 리팩토링(Express → NestJS)','2025.06 ~ 2025.10','Redis','BullMQ','API/Worker','단위·통합 테스트'],
    ['세금계산서 프로그램 리뉴얼','2023.01 ~ 2023.07','PL/pgSQL','라이선스','1,000만 건','정합성','스마트빌'],
    ['운반비 전산화 구축','2020.04 ~ 2020.07','8개 공장','SAP'],
    ['MES - SAP 연동 인터페이스 개발','2019.01 ~ 2019.12','생산·납품·재고','기준정보','기준정보를 자동 이관'],
    ['제천·슬로바키아 공장 MES 업그레이드','2016.04 ~ 2017.12','LOT','Oracle 9i'],
    ['SPC 이상현상 알림 시스템 개발','2015.09','단독','100만 건','7가지','TCP','SMS'],
    ['댓글 필터 (Android · Web)','WebView','Transformers.js','WebLLM','Web Worker','혼자'],
    ['HealthDog','Google OAuth','Firebase','Supabase','AdMob','RevenueCat','혼자'],
    ['액션독: 3라인 퍼즐 (Android)','4계층','매치 판정','콤보','랭킹','혼자'],
  ];
  const escape=value=>value.replaceAll('&','&amp;').replaceAll('>','&gt;').replaceAll('<','&lt;');
  for(const [title,...facts] of expected){
    const article=articles.find(value=>value.includes(`<h4>${escape(title)}</h4>`));
    assert.ok(article,`source project: ${title}`);
    for(const fact of facts)assert.ok(article.includes(escape(fact)),`${title}: ${fact}`);
  }
});
test('main career editing leaves the application full-career data independent',async()=>{
  const main=await html();
  const shared=spawnSync('ruby',['-ryaml','-rjson','-e','puts JSON.generate(YAML.load_file("_data/resume.yml")["content"].flat_map { |group| group["content"].map { |item| item["title"] } })'],{encoding:'utf8'});
  assert.equal(shared.status,0,shared.stderr);
  const titles=JSON.parse(shared.stdout);
  assert.equal([...main.matchAll(/<article class="resume-item"/g)].length,23);
  assert.equal(titles.length,20);
  assert.ok(main.includes('Node.js API 서버 메모리 장애 개선'));
  assert.ok(!titles.includes('Node.js API 서버 메모리 장애 개선'));
  await assert.rejects(access(new URL('applications/2026-08-03/kakaopay-fde/portfolio/index.html',site)));
  const application=await readFile(new URL('applications/toss-securities-nodejs/index.html',site),'utf8').catch(()=>null);
  if(application)assert.equal([...application.matchAll(/<article class="career-detail"/g)].length,20);
});
test('the Jekyll page resolves its local runtime, stylesheet, PDF and fragments without sample imports',async()=>{
  const page=await html();assert.ok(page,'build the real Jekyll main page');
  const ids=new Set([...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const [,href] of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if(/^(?:https?:|mailto:|tel:|data:)/.test(href))continue;
    const [path,fragment]=href.split('#');
    if(!path){assert.ok(ids.has(fragment),`fragment ${href}`);continue;}
    const target=new URL(path.startsWith('/')?path.slice(1):path,site);
    if(path.endsWith('/'))target.pathname+='index.html';
    await access(target);
    if(fragment&&target.pathname.endsWith('.html'))assert.ok((await readFile(target,'utf8')).includes(`id="${fragment}"`),href);
  }
  assert.match(page,/<script type="module" src="\/assets\/js\/ink-resume\.js"/);
  const js=await readFile(new URL('assets/js/ink-resume.js',site),'utf8');
  assert.equal(spawnSync(process.execPath,['--input-type=module','--check'],{input:js}).status,0);
  assert.doesNotMatch(js,/\bimport\s*(?:\(|["'{*])/);
  const css=await readFile(new URL('assets/css/ink-resume.css',site),'utf8');
  for(const [,url]of css.matchAll(/url\(["']?([^"')]+)["']?\)/g))await access(resolve(dirname(new URL('assets/css/ink-resume.css',site).pathname),url));
  const pdf=await readFile(new URL('assets/resume/lim-giho-resume-20260913.pdf',site));assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
});
test('a real baseurl build retains its prefix for the Jekyll resume assets and local links',async()=>{
  const page=await readFile(new URL('_workspace/ink-resume-baseurl/index.html',root),'utf8').catch(()=>'');
  assert.ok(page,'build with --baseurl /ink-resume-check');assert.doesNotMatch(page,/\{[%{]/);
  for(const [,href]of page.matchAll(/(?:href|src)="(\/[^" ]+)"/g))assert.ok(href.startsWith('/ink-resume-check/'),href);
  assert.match(page,/src="\/ink-resume-check\/assets\/js\/ink-resume\.js"/);
  assert.match(page,/<link rel="canonical" href="https:\/\/limgiho\.github\.io\/ink-resume-check\/">/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url),site=new URL('_workspace/ink-resume-jekyll-site/',root);
const html=()=>readFile(new URL('index.html',site),'utf8').catch(()=>'');

test('the original Jekyll main URL uses the latest resume and remains canonical for the separate route',async()=>{
  const page=await html();assert.ok(page,'build the real Jekyll main page');
  assert.doesNotMatch(page,/\{[%{]/);assert.equal([...page.matchAll(/<article class="resume-item"/g)].length,22);
  for(const fact of ['백엔드 개발자','디지털솔루션부','8.3시간','월 100건','60~70Mbps','5Mbps 미만','액션독','월 1,200시간','수만 건','500건','30~40%','모사 실험','3분 27초','2분 25초','2026년 9월','최우수사원','특진','TCP','1,000만 건'])assert.ok(page.includes(fact),fact);
  assert.doesNotMatch(page,/Full-Stack|월 약 200시간|월 200시간|전략개발부|54,565행|BL 건수와 API 호출 수는 별개/);
  assert.doesNotMatch(page,/href="[^"]*\.pdf(?:[?#][^"]*)?"/);
  assert.match(page,/<link rel="canonical" href="https:\/\/limgiho\.github\.io\/">/);
  const alias=await readFile(new URL('resume/index.html',site),'utf8');
  assert.match(alias,/<link rel="canonical" href="https:\/\/limgiho\.github\.io\/">/);
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
  assert.ok(page.includes('동료 1명'));assert.ok(page.includes('세션을 다시 확인'));assert.ok(page.includes('기존 경력기술서 산정치'));
  assert.doesNotMatch(surface,/토스|지원 동기|검토본|ELK|loginPromises|exactly.once/i);
});
test('all ten source PDF work projects retain their periods and outcomes, alongside three personal products',async()=>{
  const page=await html();
  const articles=[...page.matchAll(/<article class="resume-item"[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
  const expected=[
    ['통관 서류 검증 자동화','2026.06 ~ 2026.08','9종','55개','8분','3분','8.3시간'],
    ['웹 기반 통합 사내 시스템 구축','2023.09 ~ 2026.07','15종','5개 업무부','3만 건','10분','5초','C#','Express'],
    ['Docker Swarm 기반 CI/CD 표준 배포 체계 구축','2025.11 ~ 2025.12','실패','SHA','디제스트','Portainer'],
    ['백엔드 서비스 리팩토링(Express → NestJS)','2025.06 ~ 2025.10','Redis','BullMQ','DI','단위·통합 테스트'],
    ['RPA 프로젝트 (삼성 NERP 연동)','2024.08 ~ 2024.12','월 1,200시간','입력 누락','기존 경력기술서 산정치'],
    ['세금계산서 프로그램 리뉴얼','2023.01 ~ 2023.07','PL/pgSQL','라이선스','1,000만 건','정합성','스마트빌'],
    ['운반비 전산화 구축','2020.04 ~ 2020.07','8개 공장','SAP','최우수사원'],
    ['MES - SAP 연동 인터페이스 개발','2019.01 ~ 2019.12','생산·납품·재고','기준정보','이관'],
    ['제천·슬로바키아 공장 MES 업그레이드','2016.04 ~ 2017.12','LOT','특진','Oracle 9i'],
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
  assert.equal([...main.matchAll(/<article class="resume-item"/g)].length,22);
  assert.equal(titles.length,20);
  assert.ok(main.includes('Node.js API 서버 메모리 장애 개선'));
  assert.ok(!titles.includes('Node.js API 서버 메모리 장애 개선'));
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

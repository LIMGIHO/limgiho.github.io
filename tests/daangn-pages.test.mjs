import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const site = new URL('_workspace/ink-resume-jekyll-site/', root);
const readPage = (path, build = site) => readFile(new URL(path, build), 'utf8').catch(() => '');

test('main and Daangn careers share the requested content while retaining their own presentation', async () => {
  const page = await readPage('daangn/index.html');
  assert.ok(page, 'build /daangn/');
  assert.equal([...page.matchAll(/<article class="resume-item"/g)].length, 21);
  for (const text of [
    'RPA 프로젝트 (삼성 NERP 연동)',
    'C# 기반 입력 자동화를 웹 플랫폼으로 통합하고, 공용 라이브러리로 중복 코드를 정리했습니다.',
    '이후 NestJS로 백엔드를 전환하고 컨테이너 기반 배포 체계를 구축했습니다.',
  ]) {
    assert.ok(!page.includes(text), `excluded: ${text}`);
    assert.ok(!(await readPage('index.html')).includes(text), `main excludes: ${text}`);
  }
  for (const text of ['15종', '3만 건', '8분', '500건', '액션독']) assert.ok(page.includes(text), text);
  const main = await readPage('index.html');
  for (const subtitle of ['KWE Korea', 'KWE Korea · 통합 플랫폼 개선 사례']) {
    assert.ok(!page.includes(`<p class="item-subtitle">${subtitle}</p>`), `hidden project subtitle: ${subtitle}`);
    assert.ok(!main.includes(`<p class="item-subtitle">${subtitle}</p>`), `main hides project subtitle: ${subtitle}`);
  }
  const about = page.slice(page.indexOf('class="about-prose"'), page.indexOf('class="about-image"'));
  for (const text of ['실제 업무의 의미와 책임이 잘 드러나는지', '무리하게 공통화하지 않습니다.', '테스트와 코드 리뷰를 중요하게 생각합니다.', '로그와 실제 실행 환경을 다시 확인하며']) assert.ok(about.includes(text), text);
  assert.doesNotMatch(about, /hero-kicker|업무 흐름이 읽히고|AI가 만든 코드/);
  const mainAbout = main.slice(main.indexOf('class="about-prose"'), main.indexOf('class="about-image"'));
  assert.equal(mainAbout, about, 'main shares the Daangn introduction');
  assert.doesNotMatch(main, /theme-daangn|\/assets\/css\/daangn\.css/);
  assert.ok(main.includes('href="/portfolio/"'), 'main keeps its portfolio route');
  assert.doesNotMatch(main, /href="\/daangn\/portfolio\/"/);
  const articles = [...page.matchAll(/<article class="resume-item"[^>]*>([\s\S]*?)<\/article>/g)].map(match => match[1]);
  const mainArticles = [...main.matchAll(/<article class="resume-item"[^>]*>([\s\S]*?)<\/article>/g)].map(match => match[1]);
  assert.deepEqual(mainArticles, articles, 'main shares all Daangn career entries');
  const company = articles.find(article => article.includes('<h4>KWE Korea</h4>'));
  assert.ok(company.includes('<p class="item-subtitle">디지털솔루션부 차장 (Lead Software Engineer)</p>'), 'company retains its role');
  assert.ok(company.includes('항공·해운 수출입과 재무 업무를 다루는 사내 통합 플랫폼'), 'company summary');
  assert.ok(company.includes('3인 개발팀에서 매주 코드 리뷰를 진행하며 구현 방식과 주요 변경 사항을 함께 검토합니다.'), 'weekly code review');
  assert.doesNotMatch(company, /동료|단독/);
  const refactoring = articles.find(article => article.includes('<h4>백엔드 서비스 리팩토링(Express → NestJS)</h4>'));
  assert.equal([...refactoring.matchAll(/<li>/g)].length, 1, 'module overview is followed by the async lifecycle explanation');
  for (const text of ['업무 도메인별 책임과 API·Worker의 역할을 정리했습니다.', '팀 코드 컨벤션과 단위·통합 테스트 환경을 구축했습니다.', 'BullMQ Worker는 작업 실행 요청과 재시도를 담당하도록 구성했습니다.', '업무 식별 키별 PostgreSQL advisory lock을 획득하고,']) assert.ok(refactoring.includes(text), text);
  assert.ok(page.includes('후속 업무에서 하루 약 1시간'), 'follow-up savings');
  assert.ok(page.includes('DOC·DOCX·엑셀·PDF·스캔본'), 'varied document formats');
  assert.ok(page.includes('100개 이상의 프로그램 소스코드를 인계받았습니다.'), 'integration background');
  assert.doesNotMatch(page, /8\.3시간|월 100건|30~40%|3인 공동 장애 분석/);
  assert.doesNotMatch(main, /8\.3시간|월 100건|30~40%|3인 공동 장애 분석/);
  const memory = articles.find(article => article.includes('<h4>Node.js API 서버 메모리 장애 개선</h4>'));
  assert.equal([...memory.matchAll(/<li>/g)].length, 3, 'memory details use the three requested points');
  for (const text of ['<strong>수만 건의 데이터를 한 번에 불러와 응답으로 가공하는 구조</strong>', '<strong>500건 단위 페이지네이션</strong>', '<strong>힙 사용량(heapUsed)과 RSS</strong>', '모사한 응답 처리 경로에서는 지속적인 누수 징후가 관측되지 않았습니다.']) assert.ok(memory.includes(text), text);
  assert.doesNotMatch(memory, /조회 구조 개선 이후 동일 장애는 재발하지 않았습니다/);
  const delivery = articles.find(article => article.includes('<h4>Docker Swarm 기반 CI/CD 표준 배포 체계 구축</h4>'));
  assert.equal([...delivery.matchAll(/<li>/g)].length, 2, 'delivery details use the two requested points');
  for (const text of ['테스트와 배포 과정도 분리돼 있었습니다.', '테스트 실패 시 후속 단계를 차단하도록 구성했습니다.', 'Portainer에서 서비스·태스크 상태와 컨테이너 로그를 확인할 수 있도록 운영 환경을 정비했습니다.', '러너·캐시 설정과 변경 경로별 잡 실행', '<strong>약 12분에서 6분으로 단축했습니다.</strong>']) assert.ok(delivery.includes(text), text);
  assert.doesNotMatch(delivery, /3분 27초|2분 25초|실패 원인을 추적했습니다/);
  const sap = articles.find(article => article.includes('<h4>MES - SAP 연동 인터페이스 개발</h4>'));
  assert.ok(sap.includes('SAP 기준정보를 MES에 자동 반영해 수작업 입력과 데이터 불일치 가능성을 줄였습니다.'), 'SAP master data wording');
  assert.doesNotMatch(sap, /기준정보를 자동 이관해 운영 오류와 수작업을 줄였습니다/);
  const mes = articles.find(article => article.includes('<h4>제천·슬로바키아 공장 MES 업그레이드</h4>'));
  assert.equal([...mes.matchAll(/<li>/g)].length, 2, 'MES details use the two requested points');
  for (const text of ['VB6 → C# (.NET 4.5), ASP.NET, WinForms, WCF, Oracle 9i → 11g, PL/SQL', '<strong>박스 단위까지 세분화</strong>', '원자재부터 생산 공정·완제품까지 이력을 연결해', '프로젝트 완료 후 과장으로 특진했습니다.']) assert.ok(mes.includes(text), text);
  const spc = articles.find(article => article.includes('<h4>SPC 이상현상 알림 시스템 개발</h4>'));
  for (const text of ['일평균 약 100만 건의 생산 데이터가 발생하는 환경에서', '<strong>7가지 SPC 이상 징후를 SQL로 판정하는 로직</strong>', '감지된 이상 징후를 SMS와 현황판으로 전달하도록 구성했습니다.']) assert.ok(spc.includes(text), text);
  assert.doesNotMatch(spc, /<li>/, 'SPC details use paragraphs');
  for (const [title, stack] of [
    ['백엔드', ['Node.js, TypeScript, Express, NestJS, Prisma, Redis, BullMQ', 'C# (.NET Framework, .NET 6), gRPC, WCF']],
    ['프론트엔드', ['Next.js, React, React Native, Expo, WinForms']],
    ['데이터', ['PostgreSQL, Oracle, MySQL, PL/SQL, PL/pgSQL']],
    ['배포·운영', ['GitLab CI/CD, Docker, Docker Swarm, buildx, Portainer, PM2, Turborepo']],
    ['문서 처리·검증', ['Local LLM, Tesseract OCR, Vitest']],
  ]) {
    const technology = articles.find(article => article.includes(`<h4>${title}</h4>`));
    const prose = technology.match(/<div class="resume-prose">([\s\S]*?)<\/div>/)[1];
    assert.equal(prose.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(), stack.join(' '), `${title}: technology names only`);
  }
});

test('Daangn pages link to each other without PDF links and retain their own canonicals', async () => {
  for (const [path, other] of [['daangn/', '/daangn/portfolio/'], ['daangn/portfolio/', '/daangn/']]) {
    const page = await readPage(`${path}index.html`);
    assert.ok(page, path);
    assert.ok(page.includes(`href="${other}"`), `cross-link: ${other}`);
    assert.doesNotMatch(page, /href="[^"]*\.pdf(?:[?#][^"]*)?"|제출용 이력서 PDF/);
    assert.ok(page.includes(`<link rel="canonical" href="https://limgiho.github.io/${path}">`), 'own canonical');
    assert.doesNotMatch(page, /href="(?:\/|\/portfolio\/|\/assets\/resume\/lim-giho-resume\.pdf)"/);
    assert.doesNotMatch(page, /\{[%{]/);
    const ids = new Set([...page.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const [, href] of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|tel:|data:)/.test(href)) continue;
      const [localPath, fragment] = href.split('#');
      if (!localPath) { assert.ok(ids.has(fragment), href); continue; }
      const target = new URL(localPath.replace(/^\//, ''), site);
      if (localPath.endsWith('/')) target.pathname += 'index.html';
      await access(target);
    }
  }
  assert.ok((await readPage('portfolio/index.html')).includes('class="nav-resume"'), 'default portfolio keeps its PDF link');
});

test('Daangn portfolio highlights the four figures in the submission resume', async () => {
  const page = await readPage('daangn/portfolio/index.html');
  assert.ok(page, 'build /daangn/portfolio/');
  const hero = page.slice(page.indexOf('<header class="portfolio-hero"'), page.indexOf('</header>', page.indexOf('<header class="portfolio-hero"')));
  for (const text of ['15종+', '5Mbps 미만', '60~70Mbps', '8분 → 3분', '12분 → 6분']) assert.ok(hero.includes(text), text);
  assert.ok(!hero.includes('1,227'), 'hero uses the submission figures');
  assert.ok(!page.includes('54,565'), 'OOM summary uses the useful page limit rather than the exact incident row count');
  const documentFlow = page.slice(page.indexOf('<section class="document-flow"'), page.indexOf('<section class="delivery-flow"'));
  assert.ok(documentFlow.includes('DOC·DOCX·엑셀·PDF·스캔본'), 'format context in portfolio');
  assert.ok(documentFlow.includes('8분에서 3분'), 'review savings in portfolio');
  assert.ok(documentFlow.includes('후속 업무에서 하루 약 1시간'), 'follow-up savings in portfolio');
  const deliveryFlow = page.slice(page.indexOf('<section class="delivery-flow"'), page.indexOf('</section>', page.indexOf('<section class="delivery-flow"')));
  for (const text of ['현재 buildx 기반', 'buildx로 전환', '약 12분에서 6분', '모니터링 환경을 구축']) assert.ok(deliveryFlow.includes(text), text);
});

test('nested Daangn routes and their assets retain the deployment baseurl', async () => {
  const build = new URL('_workspace/ink-resume-baseurl/', root);
  for (const path of ['daangn/', 'daangn/portfolio/']) {
    const page = await readPage(`${path}index.html`, build);
    assert.ok(page, path);
    for (const [, href] of page.matchAll(/(?:href|src)="(\/[^" ]+)"/g)) assert.ok(href.startsWith('/ink-resume-check/'), href);
    assert.ok(page.includes(`href="https://limgiho.github.io/ink-resume-check/${path}"`), 'canonical with prefix');
  }
});

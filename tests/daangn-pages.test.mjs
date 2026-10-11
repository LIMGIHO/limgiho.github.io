import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const site = new URL('_workspace/ink-resume-jekyll-site/', root);
const readPage = (path, build = site) => readFile(new URL(path, build), 'utf8').catch(() => '');

test('Daangn career selects the requested content without changing the main career', async () => {
  const page = await readPage('daangn/index.html');
  assert.ok(page, 'build /daangn/');
  assert.equal([...page.matchAll(/<article class="resume-item"/g)].length, 21);
  for (const text of [
    'RPA 프로젝트 (삼성 NERP 연동)',
    'C# 기반 입력 자동화를 웹 플랫폼으로 통합하고, 공용 라이브러리로 중복 코드를 정리했습니다.',
    '이후 NestJS로 백엔드를 전환하고 컨테이너 기반 배포 체계를 구축했습니다.',
  ]) {
    assert.ok(!page.includes(text), `excluded: ${text}`);
    assert.ok((await readPage('index.html')).includes(text), `main retains: ${text}`);
  }
  for (const text of ['15종', '3만 건', '8분', '500건', '액션독']) assert.ok(page.includes(text), text);
  const main = await readPage('index.html');
  const about = page.slice(page.indexOf('class="about-prose"'), page.indexOf('class="about-image"'));
  assert.ok(about.includes('업무 흐름이 읽히고, 안심하고 바꿀 수 있는 코드'), 'Daangn philosophy introduction');
  assert.ok(main.includes('반복 업무를 자동화하는 시스템을 만들고 운영해 온'), 'main keeps its introduction');
  const articles = [...page.matchAll(/<article class="resume-item"[^>]*>([\s\S]*?)<\/article>/g)].map(match => match[1]);
  const company = articles.find(article => article.includes('<h4>KWE Korea</h4>'));
  assert.ok(company.includes('항공·해운 수출입과 재무 업무를 다루는 사내 통합 플랫폼'), 'company summary');
  assert.doesNotMatch(company, /동료|단독|3인|코드 리뷰/);
  assert.ok(page.includes('후속 업무에서 하루 약 1시간'), 'follow-up savings');
  assert.ok(page.includes('DOC·DOCX·엑셀·PDF·스캔본'), 'varied document formats');
  assert.ok(page.includes('기능과 데이터도 여러 시스템에 나뉘어'), 'integration background');
  assert.doesNotMatch(page, /8\.3시간|월 100건|30~40%|3인 공동 장애 분석/);
  assert.ok(main.includes('월 100건'), 'Daangn content overrides stay scoped');
  const delivery = articles.find(article => article.includes('<h4>Docker Swarm 기반 CI/CD 표준 배포 체계 구축</h4>'));
  for (const text of ['약 12분에서 6분', '모니터링 환경을 구축', '실패 단계의 로그를 확인할 수 있도록']) assert.ok(delivery.includes(text), text);
  assert.doesNotMatch(delivery, /3분 27초|2분 25초|실패 원인을 추적했습니다/);
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
  for (const text of ['초기 Kaniko 기반', 'buildx로 전환', '약 12분에서 6분', '모니터링 환경을 구축']) assert.ok(deliveryFlow.includes(text), text);
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

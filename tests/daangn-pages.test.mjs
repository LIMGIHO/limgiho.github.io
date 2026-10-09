import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const site = new URL('_workspace/ink-resume-jekyll-site/', root);
const pdfPath = '/assets/resume/lim-giho-daangn-local-jobs-v15.pdf';
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
});

test('Daangn pages link to each other and to the submission PDF with their own canonicals', async () => {
  for (const [path, other] of [['daangn/', '/daangn/portfolio/'], ['daangn/portfolio/', '/daangn/']]) {
    const page = await readPage(`${path}index.html`);
    assert.ok(page, path);
    assert.ok(page.includes(`href="${other}"`), `cross-link: ${other}`);
    assert.ok(page.includes(`href="${pdfPath}"`), 'submission PDF');
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
  assert.equal((await readFile(new URL(pdfPath.slice(1), site))).subarray(0, 5).toString(), '%PDF-');
});

test('Daangn portfolio highlights the four figures in the submission resume', async () => {
  const page = await readPage('daangn/portfolio/index.html');
  assert.ok(page, 'build /daangn/portfolio/');
  const hero = page.slice(page.indexOf('<header class="portfolio-hero"'), page.indexOf('</header>', page.indexOf('<header class="portfolio-hero"')));
  for (const text of ['15종+', '5Mbps 미만', '60~70Mbps', '8분 → 3분', '12분 → 6분']) assert.ok(hero.includes(text), text);
  assert.ok(!hero.includes('1,227'), 'hero uses the submission figures');
  assert.ok(!page.includes('54,565'), 'OOM summary uses the useful page limit rather than the exact incident row count');
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

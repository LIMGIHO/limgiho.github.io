import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url),site=new URL('_workspace/ink-resume-jekyll-site/',root);
const html=()=>readFile(new URL('index.html',site),'utf8').catch(()=>'');

test('the original Jekyll main URL uses the latest resume and remains canonical for the separate route',async()=>{
  const page=await html();assert.ok(page,'build the real Jekyll main page');
  assert.doesNotMatch(page,/\{[%{]/);assert.equal([...page.matchAll(/<article class="resume-item"/g)].length,20);
  for(const fact of ['Backend Developer','디지털솔루션부','8.3시간','월 100건','60~70Mbps','5Mbps 미만','액션독','월 1,200시간'])assert.ok(page.includes(fact),fact);
  assert.doesNotMatch(page,/Full-Stack|월 약 200시간|월 200시간|전략개발부/);
  assert.match(page,/href="\/assets\/resume\/lim-giho-resume-20260913\.pdf"/);
  assert.match(page,/<link rel="canonical" href="https:\/\/limgiho\.github\.io\/">/);
  const alias=await readFile(new URL('resume/index.html',site),'utf8');
  assert.match(alias,/<link rel="canonical" href="https:\/\/limgiho\.github\.io\/">/);
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

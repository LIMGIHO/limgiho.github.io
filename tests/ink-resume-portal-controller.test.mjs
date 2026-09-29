import test from 'node:test';
import assert from 'node:assert/strict';
import { materialPoint } from '../samples/ink-resume-portal/model.mjs';
const module = await import('../samples/ink-resume-portal/portal.mjs').catch(() => null);

class Target {
  listeners = new Map(); attrs = {}; hidden = true; textContent = ''; disabled = false; inert = false; style = {}; dataset = {};
  constructor() { const classes = new Set(); this.classList = { add: n => classes.add(n), remove: n => classes.delete(n), contains: n => classes.has(n), toggle: (n, on) => on ? classes.add(n) : classes.delete(n) }; }
  addEventListener(t, cb) { const set = this.listeners.get(t) ?? new Set(); set.add(cb); this.listeners.set(t, set); }
  removeEventListener(t, cb) { this.listeners.get(t)?.delete(cb); }
  emit(t, event = {}) { for (const cb of this.listeners.get(t) ?? []) cb({ type: t, target: this, ...event }); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  closest() { return null; }
  contains(target) { return target === this || this.children?.includes(target); }
}
function fixture({ reduced = false, canvasFailure = false, scrollY = 0, trackTop = 0, width = 1440, height = 900 } = {}) {
  const canvases = [];
  const makeCanvas = () => {
    const calls = [], stack = [], context = { globalAlpha: 1, fillStyle: '', calls };
    for (const name of ['setTransform', 'clearRect', 'fillRect', 'moveTo', 'lineTo', 'bezierCurveTo']) context[name] = (...args) => { assert.ok(args.every(Number.isFinite)); calls.push({ name, args, alpha: context.globalAlpha }); };
    for (const name of ['beginPath', 'closePath', 'clip', 'fill', 'stroke']) context[name] = () => calls.push({ name, alpha: context.globalAlpha });
    context.save = () => stack.push({ globalAlpha: context.globalAlpha, fillStyle: context.fillStyle });
    context.restore = () => Object.assign(context, stack.pop() ?? {});
    context.drawImage = () => calls.push({ name: 'drawImage' }); context.createPattern = () => ({});
    const canvas = { width: 0, height: 0, getContext: () => context, ownerDocument: { createElement: makeCanvas }, context }; canvases.push(canvas); return canvas;
  };
  const env = new Target(), document = new Target(), media = new Target(), track = new Target(), stage = new Target();
  Object.assign(stage, { clientWidth: width, clientHeight: height });
  env.scrollY = scrollY;
  track.getBoundingClientRect = () => ({ top: trackTop - env.scrollY });
  Object.defineProperty(track, 'offsetHeight', { get: () => stage.clientHeight * (track.classList.contains('portal-live') ? 2.04 : 1) });
  stage.getBoundingClientRect = () => { const top = Math.max(trackTop - env.scrollY, Math.min(0, trackTop + track.offsetHeight - stage.clientHeight - env.scrollY)); return { left: 0, top, bottom: top + stage.clientHeight, width: stage.clientWidth, height: stage.clientHeight }; };
  const canvas = makeCanvas(); if (canvasFailure) canvas.getContext = () => null;
  const pause = new Target(), clear = new Target(), status = new Target(), enter = new Target(), back = new Target(), inside = new Target(), insideHeading = new Target();
  inside.children = [insideHeading, back]; inside.inert = true;
  document.hidden = false; document.activeElement = null; media.matches = reduced;
  for (const el of [stage, enter, back, insideHeading]) el.focus = options => { document.activeElement = el; el.focusOptions = options; };
  const raf = new Map(), scrolls = []; let id = 0;
  Object.assign(env, { document, devicePixelRatio: 1, matchMedia: () => media,
    requestAnimationFrame: cb => { raf.set(++id, cb); return id; }, cancelAnimationFrame: key => raf.delete(key),
    scrollTo: options => { scrolls.push(options); env.scrollY = options.top; env.emit('scroll'); },
    ResizeObserver: class { constructor(cb) { env.resize = cb; } observe() {} disconnect() { env.resize = null; } },
    IntersectionObserver: class { constructor(cb) { env.intersection = cb; } observe() {} disconnect() { env.intersection = null; } } });
  const frame = now => { const callbacks = [...raf.values()]; raf.clear(); callbacks.forEach(cb => cb(now)); };
  const scroll = y => { env.scrollY = y; env.emit('scroll'); };
  const draws = () => canvas.context.calls.filter(call => call.name === 'drawImage').length;
  const resetCalls = () => canvases.forEach(c => { c.context.calls.length = 0; });
  const ink = () => canvases[1].context.calls.filter(c => ['moveTo', 'lineTo', 'bezierCurveTo', 'stroke'].includes(c.name));
  return { env, document, media, track, stage, canvas, pause, clear, status, enter, back, inside, insideHeading, raf, scrolls, frame, scroll, draws, resetCalls, ink, canvases };
}
function start(options) { assert.equal(typeof module?.mountPortal, 'function', 'real portal controller must exist'); const f = fixture(options); f.dispose = module.mountPortal(f, f.env); return f; }

test('portal position uses the real track top/travel and leaves a full-inside hold', () => {
  assert.equal(typeof module?.portalPosition, 'function');
  for (const [y, expected] of [[100, 0], [460, .5], [820, 1], [1000, 1], [-5, 0]]) assert.equal(module.portalPosition({ scrollY: y, top: 100, travel: 900 }), expected);
  assert.equal(module.portalPosition({ scrollY: 100, top: 0, travel: 0 }), 0);
});
test('opening length is independent of the added inside hold', () => {
  for (const travel of [810,1530]) {
    assert.equal(module.portalPosition({scrollY:324,top:0,travel,opening:648}),.5);
    assert.equal(module.portalPosition({scrollY:648,top:0,travel,opening:648}),1);
    assert.equal(module.portalPosition({scrollY:travel,top:0,travel,opening:648}),1);
  }
});
test('a native scroll plateau shows the same drawn ink before the resume without a timed lock', () => {
  const f=start(); f.scroll(648); f.pause.emit('click');
  f.resetCalls(); f.scroll(700); const before=f.ink(); assert.equal(f.inside.inert,false); assert.equal(Number(f.inside.style.opacity),1);
  for(const y of [740,840,930]) { f.resetCalls(); f.scroll(y); assert.equal(f.env.scrollY,y); assert.equal(f.stage.getBoundingClientRect().top,0); assert.deepEqual(f.ink(),before); assert.equal(f.inside.inert,false); }
  f.scroll(1000); assert.ok(f.stage.getBoundingClientRect().top<0,'native scroll leaves the shorter held surface');
  assert.equal(f.scrolls.length,0); assert.equal(f.raf.size,0); f.dispose();
});
test('native scrolling opens the genuine O and scrolling back restores the front', () => {
  const f = start(); assert.ok(f.stage.classList.contains('ready')); assert.ok(f.track.classList.contains('portal-live')); assert.ok(f.draws() > 0);
  assert.equal(f.inside.inert, true); f.scroll(360); for (let n = 0; n < 100; n++) f.frame(n * 16);
  assert.equal(f.inside.inert, true); f.scroll(720); assert.equal(f.inside.inert, false); assert.equal(Number(f.inside.style.opacity), 1);
  f.scroll(0); assert.equal(f.inside.inert, true); assert.equal(Number(f.inside.style.opacity), 0);
  assert.equal(f.scrolls.length, 0, 'native scroll never produces another scroll');
  for (const event of ['wheel', 'touchmove']) assert.equal(f.env.listeners.has(event), false);
  f.dispose(); assert.equal(f.raf.size, 0);
});
test('ambient ink visibly drifts inside the O without pointer or further scroll input', () => {
  for(const [width,height] of [[390,844],[1440,900]]) {
    const f=start({width,height});f.scroll(Math.ceil(height*.72));f.frame(100);
    const starts=()=>f.ink().filter(call=>call.name==='moveTo').filter((_,index)=>index%7===0).map(call=>call.args);
    f.resetCalls();f.frame(116);const before=starts();
    for(let frame=1;frame<=125;frame++){f.resetCalls();f.frame(116+frame*16);}
    const after=starts();assert.equal(before.length,8);assert.equal(after.length,8);
    const moved=before.filter(([x,y],index)=>Math.hypot(after[index][0]-x,after[index][1]-y)>=12);
    assert.ok(moved.length>=6,`${width}px: at least six seed particles must move visibly within two seconds (${moved.length})`);
    f.dispose();
  }
});
test('explicit enter and return work with keyboard focus and respect reduced motion', () => {
  const f = start({ reduced: true }); assert.equal(f.raf.size, 0);
  f.enter.emit('click'); assert.equal(f.inside.inert, false); assert.equal(f.document.activeElement, f.insideHeading);
  assert.equal(f.scrolls[0].behavior, 'instant'); assert.equal(f.scrolls[0].top, 648);
  f.back.emit('click'); assert.equal(f.document.activeElement, f.enter); assert.equal(f.inside.inert, true); assert.equal(f.scrolls[1].top, 0); f.dispose();
});
test('short viewports with integer scroll positions can complete a fractional entry goal', () => {
  const f = start({ reduced: true, width: 568, height: 320 });
  f.env.scrollTo = options => { f.scrolls.push(options); f.scroll(Math.round(options.top)); };
  f.enter.emit('click'); assert.equal(f.inside.inert, false); assert.equal(f.document.activeElement, f.insideHeading);
  assert.equal(Number(f.inside.style.opacity), 1); f.back.emit('click'); assert.equal(f.document.activeElement, f.enter); f.dispose();
});
test('ordinary scroll never steals resume focus; reverse scroll rescues only hidden inside controls', () => {
  const f = start({ reduced: true }); const resume = new Target(); f.document.activeElement = resume;
  f.scroll(1200); f.scroll(0); assert.equal(f.document.activeElement, resume);
  f.scroll(720); f.back.focus(); f.scroll(0); assert.equal(f.document.activeElement, f.enter); assert.deepEqual(f.enter.focusOptions, { preventScroll: true }); f.dispose();
});
test('pause freezes time and ink but a native scroll still renders the matching static portal', () => {
  const f = start(); f.frame(100); f.frame(116); f.pause.emit('click'); assert.equal(f.raf.size, 0);
  const before = f.draws(); f.scroll(720); assert.ok(f.draws() > before); assert.equal(f.inside.inert, false); assert.equal(f.raf.size, 0);
  const count = f.draws(); f.frame(10000); assert.equal(f.draws(), count);
  f.scroll(0); assert.equal(f.inside.inert, true); f.pause.emit('click'); assert.equal(f.raf.size, 1); f.dispose();
});
test('entry/return, resize, and BFCache preserve the same actual drawn ink', () => {
  const f = start();
  for (const u of [.08, .13, .18, .23]) { const p = materialPoint({ glyph: 0, u, v: .6 }, { width: 1440, height: 900, progress: 0, time: 0, pointerForce: 0 }); f.stage.emit('pointermove', { clientX: p.x, clientY: p.y, pointerType: 'mouse' }); }
  f.pause.emit('click'); f.resetCalls(); f.scroll(0); const before = f.ink(); assert.ok(before.some(c => c.name === 'bezierCurveTo'));
  f.scroll(720); f.scroll(0); f.env.resize(); f.env.emit('pagehide', { persisted: true }); f.env.emit('pageshow', { persisted: true });
  f.resetCalls(); f.scroll(0); assert.deepEqual(f.ink(), before); assert.equal(f.raf.size, 0);
  f.clear.emit('click'); f.resetCalls(); f.scroll(0); assert.equal(f.ink().length, 0); f.dispose();
});
test('fast jumps, offscreen return, resize and page restore immediately synchronize actual scroll', () => {
  const f = start({ scrollY: 1200, trackTop: 100 }); assert.equal(f.inside.inert, false);
  f.env.intersection([{ isIntersecting: false }]); f.scroll(100); assert.equal(f.raf.size, 0);
  f.env.intersection([{ isIntersecting: true }]); assert.equal(f.inside.inert, true); assert.equal(Number(f.inside.style.opacity), 0);
  f.env.emit('pagehide', { persisted: true }); f.env.scrollY = 1000; f.env.emit('pageshow', { persisted: true }); assert.equal(f.inside.inert, false);
  f.stage.clientWidth = 390; f.stage.clientHeight = 600; f.env.scrollY = 532; f.env.resize(); assert.equal(f.inside.inert, false);
  assert.equal(f.canvas.width, 390); assert.equal(f.canvas.height, 600); f.dispose();
});
test('reduced motion and runtime preference change never schedule aging and still permit native reading', () => {
  const f = start({ reduced: true }); assert.equal(f.raf.size, 0); f.scroll(720); assert.equal(f.inside.inert, false); assert.equal(f.raf.size, 0);
  f.stage.emit('pointermove', { clientX: 200, clientY: 300, pointerType: 'mouse' }); assert.equal(f.raf.size, 0);
  f.media.matches = false; f.media.emit('change'); assert.equal(f.raf.size, 1);
  f.media.matches = true; f.media.emit('change'); assert.equal(f.raf.size, 0); assert.equal(f.pause.disabled, true); f.dispose();
});
test('hidden pages suspend drawing and resume at the real position without aging the hidden gap', () => {
  const f = start(); f.document.hidden = true; f.document.emit('visibilitychange'); const count = f.draws(); f.scroll(720); f.frame(10000);
  assert.equal(f.draws(), count); assert.equal(f.raf.size, 0);
  f.document.hidden = false; f.document.emit('visibilitychange'); assert.equal(f.inside.inert, false); assert.equal(f.raf.size, 1); f.dispose();
});
test('initial Canvas failure is static; later failure never collapses an activated track', () => {
  const broken = start({ canvasFailure: true }); assert.equal(broken.stage.classList.contains('ready'), false); assert.equal(broken.track.classList.contains('portal-live'), false); assert.equal(broken.raf.size, 0); broken.dispose();
  const f = start(); const height = f.track.offsetHeight; f.canvas.context.setTransform = () => { throw Error('resize failure'); }; f.env.resize();
  assert.equal(f.stage.classList.contains('ready'), false); assert.equal(f.track.offsetHeight, height); assert.equal(f.enter.hidden, true); assert.equal(f.inside.inert, true); assert.equal(f.pause.hidden, true); assert.equal(f.raf.size, 0); f.dispose();
});
test('interrupted smooth entry cannot steal focus from later native resume navigation', () => {
  for (const viaHash of [false, true]) {
    const f = start(); f.env.scrollTo = options => f.scrolls.push(options); f.enter.focus(); f.enter.emit('click'); f.scroll(200);
    const resume = new Target(); f.document.activeElement = resume;
    if (viaHash) { f.env.scrollY = 1800; f.env.emit('hashchange'); } else f.scroll(1800);
    assert.equal(f.document.activeElement, resume); f.dispose();
  }
});
test('a late scroll focus request only resolves at its own visible destination', () => {
  const f = start(); f.env.scrollTo = options => f.scrolls.push(options); f.enter.focus(); f.enter.emit('click');
  f.scroll(2800); assert.equal(f.document.activeElement, f.enter, 'offscreen overshoot must not focus the portal'); f.dispose();
});
test('new user navigation cancels a deferred entry focus without intercepting that input', () => {
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'focusin']) {
    const f = start(); f.env.scrollTo = options => f.scrolls.push(options); f.enter.focus(); f.enter.emit('click');
    f.document.emit(type, { target: new Target(), key: 'PageDown', preventDefault: () => assert.fail('do not intercept native input') });
    f.scroll(648); assert.equal(f.document.activeElement, f.enter, `cancel focus after ${type}`); f.dispose();
  }
});
test('reverse scroll reveals the front control before trying to focus it', () => {
  const f = start({ reduced: true }); const focus = f.enter.focus, attempts = [];
  f.enter.focus = options => { attempts.push(f.stage.dataset.inside); if (f.stage.dataset.inside !== 'true') focus(options); };
  f.scroll(720); f.back.focus(); f.scroll(0); assert.equal(f.document.activeElement, f.enter);
  assert.ok(attempts.every(inside => inside === 'false'), 'no focus attempt may precede CSS visibility'); f.dispose();
});
test('browser focus fixup when the front control hides does not cancel an otherwise owned entry', () => {
  const f = start(); f.document.body = new Target(); f.env.scrollTo = options => f.scrolls.push(options);
  f.enter.focus(); f.enter.emit('click'); f.scroll(600); for (let n = 0; n < 100; n++) f.frame(n * 16);
  assert.equal(f.stage.dataset.inside, 'true'); f.document.activeElement = f.document.body;
  f.document.emit('focusin', { target: f.document.body }); f.scroll(648);
  assert.equal(f.document.activeElement, f.insideHeading); f.dispose();
});
test('a failed portal restores hidden art focus but leaves a focused resume alone', () => {
  for (const focusedInside of [true, false]) {
    const f = start({ reduced: true }); f.enter.emit('click'); const resume = new Target();
    if (!focusedInside) f.document.activeElement = resume;
    f.canvas.context.setTransform = () => { throw Error('resize failure'); }; f.env.resize();
    assert.equal(f.document.activeElement, focusedInside ? f.stage : resume);
    f.document.hidden = true; f.document.emit('visibilitychange'); f.document.hidden = false; f.document.emit('visibilitychange');
    assert.equal(f.inside.inert, true, 'failed hidden UI cannot reactivate'); assert.equal(f.raf.size, 0); f.dispose();
  }
});

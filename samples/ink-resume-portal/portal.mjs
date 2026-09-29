import { createPortrait, recordGesture, stepPortrait, finishPortrait, clearPortrait, damp, clamp01, frameState } from './model.mjs';
import { createRenderer } from './renderer.mjs';

const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
// Opening and the finite inside hold are independent; native scrolling stays free.
export function portalPosition({ scrollY, top, travel, opening = travel * .8 }) {
  const distance = Math.min(Math.max(0, finite(opening)), Math.max(0, finite(travel)));
  return distance > 0 ? clamp01((finite(scrollY) - finite(top)) / distance) : 0;
}

// The scroll track owns the view. The resume itself is independent static DOM.
export function mountPortal({ track, stage, canvas, pause, clear, status, enter, back, inside, insideHeading }, environment = globalThis) {
  const env = environment, doc = env.document, media = env.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = [], pointer = { x: .3, y: .45, force: 0, targetX: .3, targetY: .45, targetForce: 0 };
  let portrait = createPortrait(137), renderer, resizeObserver, intersectionObserver, raf = 0, previous = 0;
  let reduced = media.matches, paused = false, visible = !doc.hidden, onscreen = true, suspended = false;
  let failed = false, disposed = false, touched = false, width = 1, height = 1, time = 0, lastGesture = null;
  let progress = 0, target = 0, pendingFocus = null;
  const listen = (el, type, callback, options) => { el.addEventListener(type, callback, options); listeners.push(() => el.removeEventListener(type, callback, options)); };
  const canDraw = () => !failed && !disposed && !!renderer && visible && onscreen && !suspended;
  const canAnimate = () => canDraw() && !paused && !reduced;
  const stop = () => { env.cancelAnimationFrame(raf); raf = 0; previous = 0; };
  const request = () => { if (!raf && canAnimate()) raf = env.requestAnimationFrame(tick); };
  const release = () => { pointer.targetForce = 0; lastGesture = null; };
  const view = () => ({ width, height, progress, time: reduced ? 0 : time, pointerX: pointer.x, pointerY: pointer.y, pointerForce: reduced ? 0 : pointer.force, portrait });
  function position() {
    const scrollY = finite(env.scrollY), top = finite(track.getBoundingClientRect().top) + scrollY;
    const travel = Math.max(0, finite(track.offsetHeight) - height);
    return { scrollY, top, travel, opening: Math.min(travel, height * .72) };
  }
  function surface(frame) {
    const restoreFront = !frame.inside && inside.contains(doc.activeElement) && !enter.hidden;
    // Make the front button CSS-visible before asking the browser to focus it.
    stage.dataset.inside = String(frame.inside);
    if (restoreFront) { pendingFocus = null; enter.focus({ preventScroll: true }); }
    inside.inert = !frame.inside;
    inside.style.opacity = String(frame.reverseOpacity);
    const intent = pendingFocus;
    if (!intent) return;
    const active = doc.activeElement, at = position(), rect = stage.getBoundingClientRect();
    const stillOwned = !active || active === doc.body || active === intent.owner || active === intent.trigger;
    const overshot = intent.destination === 'inside' ? at.scrollY > intent.top + 3 : at.scrollY < intent.top - 3;
    if (!stillOwned || overshot) { pendingFocus = null; return; }
    const actuallyVisible = finite(rect.bottom, rect.top + height) > 0 && rect.top < finite(env.innerHeight, height);
    if (!onscreen || suspended || !visible || !actuallyVisible || Math.abs(at.scrollY - intent.top) > 3) return;
    if (intent.destination === 'inside' && frame.inside && progress >= .999) {
      pendingFocus = null; insideHeading.focus({ preventScroll: true });
    } else if (intent.destination === 'front' && progress <= .001) {
      pendingFocus = null; enter.focus({ preventScroll: true });
    }
  }
  function sync(immediate = false) {
    target = portalPosition(position());
    // Endpoints and restored/offscreen/paused views cannot trail the actual document.
    if (immediate || !canAnimate() || target === 0 || target === 1) progress = target;
    surface(frameState(view()));
  }
  function updateControls() {
    pause.disabled = reduced;
    pause.textContent = reduced ? '정적 보기' : paused ? '계속' : '정지';
    pause.setAttribute('aria-pressed', String(paused || reduced));
    pause.setAttribute('aria-label', reduced ? '모션 감소 적용 중' : paused ? '움직임 계속' : '움직임 정지');
    stage.dataset.paused = String(paused); stage.dataset.reduced = String(reduced);
  }
  function fail() {
    if (failed || disposed) return;
    failed = true; stop(); release(); pendingFocus = null;
    resizeObserver?.disconnect(); intersectionObserver?.disconnect();
    const restoreStatic = inside.contains(doc.activeElement) || [enter, pause, clear].includes(doc.activeElement);
    stage.classList.remove('ready'); stage.dataset.inside = 'false';
    if (restoreStatic) stage.focus({ preventScroll: true });
    inside.inert = true; inside.style.opacity = '0';
    pause.hidden = true; clear.hidden = true; enter.hidden = true;
    // Keep an already activated track's height: failure must not relocate the resume.
    status.textContent = '정적인 이름 표지입니다. 이력서는 아래에서 그대로 읽을 수 있습니다.';
    try { renderer?.dispose(); } catch { /* The static document remains usable. */ }
    renderer = null;
  }
  function draw(force = false) {
    if (!renderer || failed || disposed || (!force && !canDraw())) return false;
    try { surface(renderer.render(view())); return true; } catch { fail(); return false; }
  }
  function resize() {
    if (failed || disposed || !renderer) return;
    release(); pendingFocus = null;
    try {
      width = Math.max(1, finite(stage.clientWidth, 1440)); height = Math.max(1, finite(stage.clientHeight, 900));
      renderer.resize(width, height); sync(true); draw(); request();
    } catch { fail(); }
  }
  function tick(now) {
    raf = 0;
    if (!canAnimate()) { previous = 0; return; }
    const dt = previous ? Math.min(.05, Math.max(0, (now - previous) / 1000)) : 0; previous = now;
    time += dt; if (dt > 0) portrait = stepPortrait(portrait, dt);
    progress = damp(progress, target, dt, 5.2);
    const initialTouch = !touched && time < 2 && target === 0;
    pointer.x = damp(pointer.x, initialTouch ? .28 + time * .14 : pointer.targetX, dt, 4);
    pointer.y = damp(pointer.y, initialTouch ? .46 + Math.sin(time) * .05 : pointer.targetY, dt, 4);
    pointer.force = damp(pointer.force, initialTouch ? .5 : pointer.targetForce, dt, 5);
    draw(); request();
  }
  function navigate(destination) {
    if (failed || disposed) return;
    touched = true; release();
    const at = position();
    // Round outward so integer-scroll browsers really reach the endpoint.
    const top = destination === 'inside' ? Math.ceil(at.top + at.opening) : Math.floor(at.top);
    pendingFocus = { destination, top, owner: doc.activeElement, trigger: destination === 'inside' ? enter : back };
    env.scrollTo({ top, behavior: reduced || paused ? 'instant' : 'smooth' });
    sync(); draw(); request();
  }
  function dispose() {
    if (disposed) return;
    disposed = true; stop(); release(); resizeObserver?.disconnect(); intersectionObserver?.disconnect();
    listeners.splice(0).forEach(remove => remove());
    try { renderer?.dispose(); } catch { /* Unmount never owns document links. */ }
    renderer = null; stage.classList.remove('ready'); inside.inert = true;
  }

  listen(enter, 'click', () => navigate('inside'));
  listen(back, 'click', () => navigate('front'));
  listen(env, 'scroll', () => {
    if (failed || disposed) return;
    touched = true; release(); sync(); draw(); request();
  }, { passive: true });
  listen(env, 'hashchange', () => { if (failed || disposed) return; pendingFocus = null; release(); stop(); sync(true); draw(); request(); });
  // Observe takeover only to cancel an obsolete focus request; never cancel native input.
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) listen(doc, type, () => { pendingFocus = null; }, { passive: true });
  listen(doc, 'focusin', event => {
    if (pendingFocus && event.target !== doc.body && event.target !== pendingFocus.owner && event.target !== pendingFocus.trigger) pendingFocus = null;
  });
  listen(pause, 'click', () => {
    if (failed || disposed || reduced) return;
    touched = true; release(); paused = !paused; stop(); updateControls(); sync(true); draw(); request();
  });
  listen(clear, 'click', () => {
    if (failed || disposed) return;
    portrait = clearPortrait(137); if (reduced) portrait = finishPortrait(portrait);
    touched = true; release(); status.textContent = '이름의 흔적을 지웠습니다.'; draw();
  });
  listen(stage, 'pointermove', event => {
    if (!canAnimate()) return;
    if (event.target.closest?.('a,button,summary')) { release(); return; }
    touched = true; const rect = stage.getBoundingClientRect();
    let samples; try { samples = event.getCoalescedEvents?.() ?? []; } catch { samples = []; }
    if (!Array.isArray(samples)) samples = [];
    const tail = samples.at(-1);
    if (!tail || tail.clientX !== event.clientX || tail.clientY !== event.clientY) samples = [...samples, event];
    if (samples.length > 24) { const all = samples; samples = Array.from({ length: 24 }, (_, i) => all[Math.round(i * (all.length - 1) / 23)]); }
    for (const sample of samples) {
      const x = clamp01((sample.clientX - rect.left) / width), y = clamp01((sample.clientY - rect.top) / height);
      const dx = lastGesture ? x - lastGesture.x : .01, dy = lastGesture ? y - lastGesture.y : 0;
      pointer.targetX = x; pointer.targetY = y; pointer.targetForce = event.pointerType === 'touch' ? .65 : 1;
      if (!lastGesture || Math.hypot(dx * width, dy * height) >= 3) {
        const before = portrait;
        portrait = recordGesture(portrait, { x, y, dx, dy, start: !lastGesture }, view());
        lastGesture = before === portrait ? null : { x, y };
      }
    }
    request();
  }, { passive: true });
  for (const event of ['pointerleave', 'pointerup', 'pointercancel']) listen(stage, event, release);
  listen(doc, 'visibilitychange', () => { if (failed || disposed) return; release(); visible = !doc.hidden; stop(); sync(true); if (visible) { draw(); request(); } });
  listen(media, 'change', () => {
    if (failed || disposed) return;
    stop(); release(); touched = true; reduced = media.matches;
    if (reduced) { pointer.force = 0; portrait = finishPortrait(portrait); }
    updateControls(); sync(true); draw(); request();
  });
  listen(env, 'pagehide', event => { suspended = true; stop(); release(); if (!event.persisted) dispose(); });
  listen(env, 'pageshow', event => { if (!event.persisted || disposed || failed) return; suspended = false; visible = !doc.hidden; resize(); });
  try {
    renderer = createRenderer(canvas); if (reduced) portrait = finishPortrait(portrait);
    width = Math.max(1, finite(stage.clientWidth, 1440)); height = Math.max(1, finite(stage.clientHeight, 900));
    renderer.resize(width, height); sync(true);
    if (draw(true)) {
      track.classList.add('portal-live'); stage.classList.add('ready');
      enter.hidden = false; pause.hidden = false; clear.hidden = false; updateControls(); sync(true); draw(); request();
      resizeObserver = new env.ResizeObserver(resize); resizeObserver.observe(stage); resizeObserver.observe(track);
      if (typeof env.IntersectionObserver !== 'undefined') {
        intersectionObserver = new env.IntersectionObserver(entries => {
          if (failed || disposed) return;
          onscreen = entries.some(entry => entry.isIntersecting); release(); stop(); sync(true); if (onscreen) { draw(); request(); }
        }); intersectionObserver.observe(stage);
      }
    }
  } catch { fail(); }
  return dispose;
}

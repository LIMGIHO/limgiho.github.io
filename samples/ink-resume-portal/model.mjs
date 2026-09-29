import { finite, clamp, smooth, surfaceAnchor, deformPoint, GLYPH_BOUNDS, O_METRICS } from '../ink-portal-fluid/geometry.mjs';
import { PALETTE } from '../ink-portal-fluid/material.mjs';
export { surfaceAnchor as glyphAnchor } from '../ink-portal-fluid/geometry.mjs';
export { strokeCurve } from '../ink-portal-fluid/stroke.mjs';
export const MAX_MARKS = 96;
export const MAX_TRACE_POINTS = 768;
export const MAX_POINTS_PER_STROKE = 128;
export const MAX_RETIRING_MARKS = 384;
export const MAX_RETIRING_POINTS = 384;
export const RETIRE_DURATION = 1.4;
export const MAX_INK_OPACITY = .52;
export const TONES = PALETTE.pigments;
export const clamp01 = value => clamp(value, 0, 1);
export function damp(current, target, dt, rate = 5) { const a = finite(current), b = finite(target); return a + (b - a) * (1 - Math.exp(-Math.max(0, finite(dt)) * Math.max(0, finite(rate)))); }
export function randomSource(seed = 137) { let state = finite(seed, 137) >>> 0; return () => { state += 0x6d2b79f5; let n = state; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; }; }

export function layout(width = 1440, height = 900) {
  const w = Math.max(1, finite(width, 1440)), h = Math.max(1, finite(height, 900));
  const inset = Math.min(w, h) * .04, topBound = 70 + inset, available = Math.max(1, h - 235 - inset * 2);
  const gaps = .12, row = [0, 1, 2, 3];
  const rowWidth = row.reduce((sum, id) => sum + GLYPH_BOUNDS[id].right - GLYPH_BOUNDS[id].left, gaps * 3);
  const size = Math.min(w * (w < 660 ? .9 : .88) / rowWidth, available / 1.2);
  const top = topBound + (available - size * 1.2) / 2;
  let cursor = (w - rowWidth * size) / 2;
  const glyphs = row.map(id => {
    const glyph = { id, letter: 'GIHO'[id], x: cursor - GLYPH_BOUNDS[id].left * size, y: top };
    cursor += (GLYPH_BOUNDS[id].right - GLYPH_BOUNDS[id].left + gaps) * size;
    return glyph;
  });
  return { width: w, height: h, size, glyphs };
}

export function frameState(view = {}) {
  const scene = layout(view.width, view.height), o = scene.glyphs[3], p = clamp01(view.progress);
  const centerX = o.x + scene.size * O_METRICS.cx, centerY = o.y + scene.size * O_METRICS.cy;
  const maxRadius = Math.max(...[[0, 0], [scene.width, 0], [0, scene.height], [scene.width, scene.height]].map(([x, y]) => Math.hypot(x - centerX, y - centerY))) + Math.min(scene.width, scene.height) * .09;
  const radius = scene.size * O_METRICS.innerRX + (maxRadius - scene.size * O_METRICS.innerRX) * smooth(p);
  const aspect = O_METRICS.innerRY / O_METRICS.innerRX;
  return { progress: p, centerX, centerY, radius, maxRadius, scaleY: aspect + (1 - aspect) * smooth(p), portalTint: smooth(p / .08), reverseOpacity: smooth((p - .58) / .34), inside: p > .84 };
}

// A mark has one glyph/material coordinate. The expanding O reaches that coordinate
// before carrying it into the enlarged atlas; the same projection is used in reverse.
export function materialPoint(anchor = {}, view = {}) {
  const scene = layout(view.width, view.height), frame = frameState(view);
  return projectAnchor(anchor, view, scene, frame);
}
export function createProjection(view = {}) {
  const scene = layout(view.width, view.height), frame = frameState(view);
  return anchor => projectAnchor(anchor, view, scene, frame);
}
function projectAnchor(anchor = {}, view, scene, frame) {
  const glyph = Math.round(clamp(anchor.glyph, 0, 3)), u = clamp(anchor.u, 0, 1), v = clamp(anchor.v, 0, 1.2);
  const attached = surfaceAnchor(glyph, u, v), letter = scene.glyphs[glyph];
  const front = deformPoint(letter.x + attached.u * scene.size, letter.y + attached.v * scene.size, { ...view, width: scene.width, height: scene.height });
  const targetX = scene.width * ((glyph % 2 + u) * .5);
  const targetY = scene.height * ((Math.floor(glyph / 2) + v / 1.2) * .5);
  const activation = Math.max(Math.hypot(front.x - frame.centerX, front.y - frame.centerY), Math.hypot(targetX - frame.centerX, targetY - frame.centerY)) + Math.min(scene.width, scene.height) * .045;
  const blend = frame.progress === 1 ? 1 : smooth((frame.radius - activation) / Math.max(1, frame.maxRadius - activation));
  return { x: front.x + (targetX - front.x) * blend, y: front.y + (targetY - front.y) * blend,
    scaleX: scene.size + (scene.width * .5 - scene.size) * blend,
    scaleY: scene.size + (scene.height * .5 / 1.2 - scene.size) * blend, blend };
}

export function inverseMaterialPoint(x, y, view = {}) {
  const scene = layout(view.width, view.height), px = finite(x, scene.width / 2), py = finite(y, scene.height / 2), p = clamp01(view.progress);
  const project = createProjection(view);
  if (p === 1) {
    let best, distance = Infinity;
    for (let glyph = 0; glyph < 4; glyph++) {
      const anchor = { glyph, u: clamp(px / scene.width * 2 - glyph % 2, 0, 1), v: clamp((py / scene.height * 2 - Math.floor(glyph / 2)) * 1.2, 0, 1.2) };
      const point = project(anchor), d = (point.x - px) ** 2 + (point.y - py) ** 2;
      if (d < distance) { best = anchor; distance = d; }
    }
    return best;
  }
  let best = { glyph: 0, u: .2, v: .6 }, distance = Infinity;
  const seeds = [];
  const consider = anchor => {
    const point = project(anchor), d = (point.x - px) ** 2 + (point.y - py) ** 2;
    if (d < distance) { best = anchor; distance = d; }
    return d;
  };
  const sample = anchor => seeds.push({ anchor, distance: consider(anchor) });
  for (let glyph = 0; glyph < 4; glyph++) {
    const letter = scene.glyphs[glyph];
    sample(surfaceAnchor(glyph, (px - letter.x) / scene.size, (py - letter.y) / scene.size));
    if (p > .02) for (let u = 0; u <= 1; u += .25) for (let v = 0; v <= 1.201; v += .3) sample({ glyph, u, v });
  }
  const initialSeed = best;
  const refine = () => {
    for (let step = .12; step > .003; step /= 2) {
      const center = best;
      for (const du of [-step, 0, step]) for (const dv of [-step, 0, step]) consider({ glyph: center.glyph, u: clamp(center.u + du, 0, 1), v: clamp(center.v + dv, 0, 1.2) });
    }
  };
  refine();
  // Entry can fold multiple parts of the same glyph onto nearby pixels. Keep
  // alternate branches, but cap refinement at four seeds even over empty space.
  if (distance > 4) {
    let winner = best, winnerDistance = distance, refinements = 1;
    for (const seed of seeds.sort((a, b) => a.distance - b.distance)) {
      if (seed.anchor === initialSeed) continue;
      if (refinements === 4) break;
      refinements++;
      best = seed.anchor; distance = seed.distance; refine();
      if (distance < winnerDistance) { winner = best; winnerDistance = distance; }
      if (winnerDistance <= 4) break;
    }
    best = winner;
  }
  return best;
}

export function markAppearance(mark = {}, view = {}) {
  const points = mark.path?.length ?? 1;
  const newerMarks = finite(view.portrait?.counter) - finite(mark.sequence) - 1;
  const newerInputs = finite(view.portrait?.inputCount) - finite(mark.lastInput);
  const chunkReserve = Math.ceil((MAX_TRACE_POINTS + MAX_RETIRING_POINTS) / MAX_POINTS_PER_STROKE);
  const countEnd = MAX_MARKS + Math.min(MAX_RETIRING_MARKS, Math.floor(MAX_RETIRING_POINTS / points)) - chunkReserve;
  const countWindow = Math.min(MAX_RETIRING_POINTS - MAX_POINTS_PER_STROKE, countEnd);
  // Predict pressure from individual inputs, including while a path is still
  // live. Retiring a sealed chunk must never cause a jump in its appearance.
  const pressure = Math.max(
    (newerMarks - (countEnd - countWindow)) / countWindow,
    (newerInputs - (MAX_TRACE_POINTS - points - chunkReserve)) / (MAX_RETIRING_POINTS - MAX_POINTS_PER_STROKE),
  );
  const opacity = 1 - smooth(Math.max(mark.retireAge === undefined ? 0 : finite(mark.retireAge) / RETIRE_DURATION, pressure));
  if (!mark.ambient || clamp01(view.progress) <= .55) return { x:0, y:0, scale:1, opacity };
  const inside = smooth((clamp01(view.progress) - .55) / .45);
  const phase = finite(mark.textureSeed) / 0xffffffff * Math.PI * 2, time = finite(view.time);
  return {
    x: (Math.sin(time * .42 + phase) * .07 + Math.sin(time * .19 + phase * 1.61) * .022) * finite(view.width,1440) * inside,
    y: (Math.cos(time * .34 + phase * .73) * .045 + Math.sin(time * .23 + phase * 1.3) * .015) * finite(view.height,900) * inside,
    scale: 1 + Math.sin(time * .24 + phase) * .18 * inside,
    opacity: opacity * (1 - inside * .35 * (.5 + .5 * Math.sin(time * .2 + phase))),
  };
}

export function clearPortrait(seed = 137) { return { seed: finite(seed, 137) >>> 0, marks: [], retiring: [], counter: 0, inputCount:0, time: 0 }; }
const stateOf = portrait => portrait && Array.isArray(portrait.marks) ? portrait : clearPortrait();
function newMark(seed, index, anchor, dx = .03, dy = .01, settled = false) {
  const random = randomSource(seed + index * 173 + 19), speed = Math.min(.2, Math.hypot(finite(dx), finite(dy)));
  const radius = .036 + speed * .025 + random() * .005, id = `ink-${seed}-${index}`;
  return { id, strokeId: id, sequence:index, lastInput:0, anchor, styleAnchor: { ...anchor }, tone: TONES[Math.floor(random() * TONES.length)], textureSeed: Math.floor(random() * 0xffffffff),
    path: [{ ...anchor }], radiusU: radius, radiusV: radius,
    angle: 0, alpha: .2 + random() * .055, settle: settled ? 1 : 0, age: 0 };
}
export function createPortrait(seed = 137) {
  const state = clearPortrait(seed), random = randomSource(state.seed);
  const marks = Array.from({ length: 8 }, (_, index) => ({ ...newMark(state.seed, index, surfaceAnchor(index % 4, .08 + random() * .84, .12 + random() * .98), .04, (random() - .5) * .03, true), alpha: .1, ambient: true }));
  return { ...state, marks, counter: marks.length };
}
export function recordGesture(portrait, gesture = {}, view = {}) {
  const state = stateOf(portrait), scene = layout(view.width, view.height);
  const x = clamp01(gesture.x ?? .5) * scene.width, y = clamp01(gesture.y ?? .5) * scene.height;
  const anchor = inverseMaterialPoint(x, y, { ...view, width: scene.width, height: scene.height });
  const attached = materialPoint(anchor, { ...view, width: scene.width, height: scene.height });
  if (clamp01(view.progress) < .92 && Math.hypot(attached.x - x, attached.y - y) > Math.max(18, scene.size * .28)) return state;
  const last = state.marks.at(-1), extend = gesture.start === false && last?.path?.length, inputCount = finite(state.inputCount) + 1;
  let marks, counter = state.counter;
  if (extend) {
    if (last.path.length < MAX_POINTS_PER_STROKE) {
      marks = [...state.marks.slice(0, -1), { ...last, lastInput:inputCount, path: [...last.path, { ...anchor }] }];
    } else {
      // Finalize only the former active tail. Never resample a sealed path.
      const sealed = { ...last, after: { ...anchor } }, join = last.path.at(-1);
      const continuationIndex = counter++;
      const continuation = { ...last, id: `ink-${state.seed}-${continuationIndex}`, sequence:continuationIndex, lastInput:inputCount, strokeId: last.strokeId ?? last.id,
        anchor: { ...join }, styleAnchor: { ...(last.styleAnchor ?? last.anchor) },
        before: { ...last.path.at(-2) }, path: [{ ...join }, { ...anchor }] };
      delete continuation.after;
      marks = [...state.marks.slice(0, -1), sealed, continuation];
    }
  } else {
    const mark = {...newMark(state.seed, counter++, anchor, clamp(gesture.dx, -.25, .25), clamp(gesture.dy, -.25, .25)), lastInput:inputCount};
    marks = [...state.marks, mark];
  }
  const removed = marks.slice(0, Math.max(0, marks.length - MAX_MARKS));
  marks = marks.slice(-MAX_MARKS);
  let knots = marks.reduce((sum, mark) => sum + (mark.path?.length ?? 1), 0);
  while (knots > MAX_TRACE_POINTS && marks.length > 1) { knots -= marks[0].path?.length ?? 1; removed.push(marks[0]); marks = marks.slice(1); }
  let retiring = [...(state.retiring ?? []), ...removed.map(mark => ({...mark, retireAge:0}))].slice(-MAX_RETIRING_MARKS);
  let retiringKnots = retiring.reduce((sum,mark)=>sum+(mark.path?.length ?? 1),0);
  while (retiringKnots > MAX_RETIRING_POINTS && retiring.length) { retiringKnots -= retiring[0].path?.length ?? 1; retiring = retiring.slice(1); }
  return { ...state, counter, marks, retiring, inputCount };
}
export function stepPortrait(portrait, dt) {
  const state = stateOf(portrait), delta = clamp(dt, 0, 1);
  if (!delta) return state;
  return { ...state, time: Math.min(600, finite(state.time) + delta), marks: state.marks.map(mark => ({ ...mark, age: Math.min(600, mark.age + delta), settle: damp(mark.settle, 1, delta, 2.8) })),
    retiring: (state.retiring ?? []).map(mark => ({...mark, retireAge:finite(mark.retireAge)+delta})).filter(mark => mark.retireAge < RETIRE_DURATION) };
}
export function finishPortrait(portrait) { const state = stateOf(portrait); return { ...state, marks: state.marks.map(mark => ({ ...mark, settle: 1 })) }; }
export function demoProgress(seconds) { const t = Math.max(0, finite(seconds)); if (t <= 2 || t >= 13) return 0; if (t < 6.5) return smooth((t - 2) / 4.5); if (t <= 8.5) return 1; return smooth((13 - t) / 4.5); }

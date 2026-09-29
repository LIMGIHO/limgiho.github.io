import { finite, clamp, smooth, surfaceAnchor, deformPoint, GLYPH_BOUNDS, O_METRICS } from './geometry.mjs';
import { PALETTE } from './material.mjs';
export { surfaceAnchor as glyphAnchor } from './geometry.mjs';
export { strokeCurve } from './stroke.mjs';
export const MAX_MARKS = 96;
export const MAX_TRACE_POINTS = 768;
export const MAX_POINTS_PER_STROKE = 128;
export const MAX_INK_OPACITY = .52;
export const TONES = PALETTE.pigments;
export const clamp01 = value => clamp(value, 0, 1);
export function damp(current, target, dt, rate = 5) { const a = finite(current), b = finite(target); return a + (b - a) * (1 - Math.exp(-Math.max(0, finite(dt)) * Math.max(0, finite(rate)))); }
export function randomSource(seed = 137) { let state = finite(seed, 137) >>> 0; return () => { state += 0x6d2b79f5; let n = state; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; }; }

export function layout(width = 1440, height = 900) {
  const w = Math.max(1, finite(width, 1440)), h = Math.max(1, finite(height, 900));
  const inset = Math.min(w, h) * .04, topBound = 70 + inset, available = Math.max(1, h - 235 - inset * 2);
  const narrow = w < 660, gaps = narrow ? .13 : .12, rows = narrow ? [[0, 1], [2, 3]] : [[0, 1, 2, 3]];
  const rowWidths = rows.map(row => row.reduce((sum, id) => sum + GLYPH_BOUNDS[id].right - GLYPH_BOUNDS[id].left, gaps * (row.length - 1)));
  const size = Math.min(w * .88 / Math.max(...rowWidths), available / (narrow ? 2.5 : 1.2));
  const top = topBound + (available - size * (narrow ? 2.5 : 1.2)) / 2, glyphs = [];
  rows.forEach((row, rowIndex) => {
    let cursor = (w - rowWidths[rowIndex] * size) / 2;
    for (const id of row) {
      glyphs.push({ id, letter: 'GIHO'[id], x: cursor - GLYPH_BOUNDS[id].left * size, y: top + rowIndex * size * 1.3 });
      cursor += (GLYPH_BOUNDS[id].right - GLYPH_BOUNDS[id].left + gaps) * size;
    }
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
  const consider = anchor => { const point = project(anchor), d = (point.x - px) ** 2 + (point.y - py) ** 2; if (d < distance) { best = anchor; distance = d; } };
  for (let glyph = 0; glyph < 4; glyph++) {
    const letter = scene.glyphs[glyph];
    consider(surfaceAnchor(glyph, (px - letter.x) / scene.size, (py - letter.y) / scene.size));
    if (p > .02) for (let u = 0; u <= 1; u += .25) for (let v = 0; v <= 1.201; v += .3) consider({ glyph, u, v });
  }
  for (let step = .12; step > .003; step /= 2) {
    const center = best;
    for (const du of [-step, 0, step]) for (const dv of [-step, 0, step]) consider({ glyph: center.glyph, u: clamp(center.u + du, 0, 1), v: clamp(center.v + dv, 0, 1.2) });
  }
  return best;
}

export function clearPortrait(seed = 137) { return { seed: finite(seed, 137) >>> 0, marks: [], counter: 0, time: 0 }; }
const stateOf = portrait => portrait && Array.isArray(portrait.marks) ? portrait : clearPortrait();
function newMark(seed, index, anchor, dx = .03, dy = .01, settled = false) {
  const random = randomSource(seed + index * 173 + 19), speed = Math.min(.2, Math.hypot(finite(dx), finite(dy)));
  const radius = .036 + speed * .025 + random() * .005, id = `ink-${seed}-${index}`;
  return { id, strokeId: id, anchor, styleAnchor: { ...anchor }, tone: TONES[Math.floor(random() * TONES.length)], textureSeed: Math.floor(random() * 0xffffffff),
    path: [{ ...anchor }], radiusU: radius, radiusV: radius,
    angle: 0, alpha: .2 + random() * .055, settle: settled ? 1 : 0, age: 0 };
}
export function createPortrait(seed = 137) {
  const state = clearPortrait(seed), random = randomSource(state.seed);
  const marks = Array.from({ length: 8 }, (_, index) => ({ ...newMark(state.seed, index, surfaceAnchor(index % 4, .08 + random() * .84, .12 + random() * .98), .04, (random() - .5) * .03, true), alpha: .1 }));
  return { ...state, marks, counter: marks.length };
}
export function recordGesture(portrait, gesture = {}, view = {}) {
  const state = stateOf(portrait), scene = layout(view.width, view.height);
  const x = clamp01(gesture.x ?? .5) * scene.width, y = clamp01(gesture.y ?? .5) * scene.height;
  const anchor = inverseMaterialPoint(x, y, { ...view, width: scene.width, height: scene.height });
  const attached = materialPoint(anchor, { ...view, width: scene.width, height: scene.height });
  if (clamp01(view.progress) < .92 && Math.hypot(attached.x - x, attached.y - y) > Math.max(18, scene.size * .28)) return state;
  const last = state.marks.at(-1), extend = gesture.start === false && last?.path?.length;
  let marks, counter = state.counter;
  if (extend) {
    if (last.path.length < MAX_POINTS_PER_STROKE) {
      marks = [...state.marks.slice(0, -1), { ...last, path: [...last.path, { ...anchor }] }];
    } else {
      // Finalize only the former active tail. Never resample a sealed path.
      const sealed = { ...last, after: { ...anchor } }, join = last.path.at(-1);
      const continuation = { ...last, id: `ink-${state.seed}-${counter++}`, strokeId: last.strokeId ?? last.id,
        anchor: { ...join }, styleAnchor: { ...(last.styleAnchor ?? last.anchor) },
        before: { ...last.path.at(-2) }, path: [{ ...join }, { ...anchor }] };
      delete continuation.after;
      marks = [...state.marks.slice(0, -1), sealed, continuation];
    }
  } else {
    const mark = newMark(state.seed, counter++, anchor, clamp(gesture.dx, -.25, .25), clamp(gesture.dy, -.25, .25));
    marks = [...state.marks, mark];
  }
  marks = marks.slice(-MAX_MARKS);
  let knots = marks.reduce((sum, mark) => sum + (mark.path?.length ?? 1), 0);
  while (knots > MAX_TRACE_POINTS && marks.length > 1) { knots -= marks[0].path?.length ?? 1; marks = marks.slice(1); }
  return { ...state, counter, marks };
}
export function stepPortrait(portrait, dt) {
  const state = stateOf(portrait), delta = clamp(dt, 0, 1);
  if (!delta) return state;
  return { ...state, time: Math.min(600, finite(state.time) + delta), marks: state.marks.map(mark => ({ ...mark, age: Math.min(600, mark.age + delta), settle: damp(mark.settle, 1, delta, 2.8) })) };
}
export function finishPortrait(portrait) { const state = stateOf(portrait); return { ...state, marks: state.marks.map(mark => ({ ...mark, settle: 1 })) }; }
export function demoProgress(seconds) { const t = Math.max(0, finite(seconds)); if (t <= 2 || t >= 13) return 0; if (t < 6.5) return smooth((t - 2) / 4.5); if (t <= 8.5) return 1; return smooth((13 - t) / 4.5); }

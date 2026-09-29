export const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, finite(value, min)));
export const smooth = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
export const ellipse = (cx, cy, rx, ry, count = 100) => Array.from({ length: count + 1 }, (_, i) => [cx + Math.cos(i / count * Math.PI * 2) * rx, cy + Math.sin(i / count * Math.PI * 2) * ry]);

export const O_METRICS = Object.freeze({ cx: .5, cy: .6, rx: .49, ry: .6, innerRX: .32, innerRY: .43, exponent: 2.6 });
const TAU = Math.PI * 2;
const signedPower = value => Math.abs(value) < 1e-12 ? 0 : Math.sign(value) * Math.abs(value) ** (2 / O_METRICS.exponent);
const squarePoint = (cx, cy, rx, ry, angle) => [finite(cx + rx * signedPower(Math.cos(angle)), cx), finite(cy + ry * signedPower(Math.sin(angle)), cy)];

export function portalContour(cx = O_METRICS.cx, cy = O_METRICS.cy, rx = O_METRICS.rx, ry = O_METRICS.ry, count = 140) {
  const x = finite(cx, O_METRICS.cx), y = finite(cy, O_METRICS.cy);
  const radiusX = Math.abs(finite(rx, O_METRICS.rx)), radiusY = Math.abs(finite(ry, O_METRICS.ry));
  const steps = Math.round(clamp(count, 16, 512)) || 140;
  const points = Array.from({ length: steps }, (_, i) => squarePoint(x, y, radiusX, radiusY, i / steps * TAU));
  points.push([...points[0]]);
  return points;
}

function line(points, x, y, steps = 10) {
  const start = points.at(-1);
  for (let i = 1; i <= steps; i++) points.push([start[0] + (x - start[0]) * i / steps, start[1] + (y - start[1]) * i / steps]);
}
function curve(points, a, b, c) {
  const start = points.at(-1);
  for (let i = 1; i <= 18; i++) {
    const t = i / 18, s = 1 - t;
    points.push([s ** 3 * start[0] + 3 * s * s * t * a[0] + 3 * s * t * t * b[0] + t ** 3 * c[0],
      s ** 3 * start[1] + 3 * s * s * t * a[1] + 3 * s * t * t * b[1] + t ** 3 * c[1]]);
  }
}
function closed(points) { points.push([...points[0]]); return points; }
function positive(points) {
  const area = points.reduce((sum, a, i) => { const b = points[(i + 1) % points.length]; return sum + a[0] * b[1] - b[0] * a[1]; }, 0);
  return area < 0 ? points.reverse() : points;
}
function roundedRect(left, top, right, bottom, radius) {
  const r = Math.min(radius, (right - left) / 2, (bottom - top) / 2);
  const points = [[left + r, top]];
  const arc = (x, y, start) => { for (let i = 1; i <= 12; i++) { const angle = start + i / 12 * Math.PI / 2; points.push([x + Math.cos(angle) * r, y + Math.sin(angle) * r]); } };
  line(points, right - r, top); arc(right - r, top + r, -Math.PI / 2);
  line(points, right, bottom - r); arc(right - r, bottom - r, 0);
  line(points, left + r, bottom); arc(left + r, bottom - r, Math.PI / 2);
  line(points, left, top + r); arc(left + r, top + r, Math.PI);
  return positive(closed(points));
}
function squareArc(cx, cy, rx, ry, from, to) {
  const steps = Math.ceil(Math.abs(to - from) / TAU * 140);
  return Array.from({ length: steps + 1 }, (_, i) => squarePoint(cx, cy, rx, ry, from + (to - from) * i / steps));
}

// The G bowl shares O's broad rounded-square curvature, with an open upper
// counter and an integrated bar. I has no slabs; all H stems have soft ends.
const g = squareArc(.5, .6, .49, .6, -.23 * Math.PI, -TAU);
line(g, .545, .6); curve(g, [.522, .6], [.515, .607], [.515, .63]);
line(g, .515, .77); curve(g, [.515, .793], [.522, .8], [.545, .8]);
const innerG = squareArc(.5, .6, .31, .42, .12 * Math.PI, 1.77 * Math.PI);
line(g, innerG[0][0], innerG[0][1]); g.push(...innerG.slice(1));
export const CONTOURS = [
  [positive(closed(g))],
  [roundedRect(.4, 0, .6, 1.2, .095)],
  [roundedRect(.04, 0, .25, 1.2, .09), roundedRect(.75, 0, .96, 1.2, .09), roundedRect(.18, .5, .82, .7, .05)],
  [portalContour()],
];
export const GLYPH_BOUNDS = CONTOURS.map(contours => {
  const points = contours.flat();
  return { left: Math.min(...points.map(point => point[0])), right: Math.max(...points.map(point => point[0])) };
});
const oCounter = portalContour(O_METRICS.cx, O_METRICS.cy, O_METRICS.innerRX, O_METRICS.innerRY);

function nearest(x, y, contours) {
  let point = [x, y], distance = Infinity;
  for (const contour of contours) for (let i = 1; i < contour.length; i++) {
    const a = contour[i - 1], b = contour[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    const px = a[0] + dx * t, py = a[1] + dy * t, d = (px - x) ** 2 + (py - y) ** 2;
    if (d < distance) { point = [px, py]; distance = d; }
  }
  return point;
}
function inPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j], b = points[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    if (Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) < 1e-10) return true;
    if ((a[1] > y) !== (b[1] > y) && x < dx * (y - a[1]) / dy + a[0]) inside = !inside;
  }
  return inside;
}
export function surfaceAnchor(glyph, u, v) {
  const id = Math.round(clamp(glyph, 0, 3)), x = clamp(u, 0, 1), y = clamp(v, 0, 1.2);
  let point = [x, y];
  if (id === 3 && inPolygon(x, y, oCounter)) {
    const edge = nearest(x, y, [oCounter]);
    // A small outward inset keeps the anchor beyond the sampled paper counter.
    point = [O_METRICS.cx + (edge[0] - O_METRICS.cx) * 1.004, O_METRICS.cy + (edge[1] - O_METRICS.cy) * 1.004];
  } else if (!CONTOURS[id].some(contour => inPolygon(x, y, contour))) point = nearest(x, y, CONTOURS[id]);
  return { glyph: id, u: point[0], v: point[1] };
}

export function deformPoint(x, y, view = {}) {
  const width = Math.max(1, finite(view.width, 1440)), height = Math.max(1, finite(view.height, 900));
  const force = clamp(view.pointerForce, 0, 1), time = Math.max(0, finite(view.time));
  const px = clamp(view.pointerX ?? .5, 0, 1) * width, py = clamp(view.pointerY ?? .5, 0, 1) * height;
  const dx = x - px, dy = y - py, scale = Math.min(width, height);
  const near = Math.exp(-(dx * dx + dy * dy) / (scale * .36) ** 2), wave = Math.sin(time * .65 + x / width * 3.5 + y / height * .8);
  const amplitude = scale * .03 * (1 - smooth(view.progress));
  return { x: x + amplitude * (force * near * .62 + wave * .05), y: y + amplitude * (force * near * (.7 + Math.sin(x / width * 5) * .28) + wave * .05) };
}

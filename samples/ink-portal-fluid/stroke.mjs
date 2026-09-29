const finitePoint = point => ({
  x: Number.isFinite(point?.x) ? point.x : 0,
  y: Number.isFinite(point?.y) ? point.y : 0,
});

// Catmull-style tangents, capped locally so unequal sample spacing cannot
// pull a sharp corner into a large loop. All endpoints are the real samples.
export function strokeCurve(input = [], neighbours = {}) {
  if (!Array.isArray(input) || input.length < 2) return [];
  const points = input.map(finitePoint), segments = [];
  const previous = neighbours.before ? finitePoint(neighbours.before) : points[0];
  const following = neighbours.after ? finitePoint(neighbours.after) : points.at(-1);
  const control = (origin, dx, dy, limit) => {
    const length = Math.hypot(dx, dy), scale = length > limit ? limit / length : 1;
    return { x: origin.x + dx * scale, y: origin.y + dy * scale };
  };
  for (let index = 0; index < points.length - 1; index++) {
    const start = points[index], end = points[index + 1];
    const before = index === 0 ? previous : points[index - 1];
    const after = index === points.length - 2 ? following : points[index + 2];
    const limit = Math.hypot(end.x - start.x, end.y - start.y) * .35;
    segments.push({ start, end,
      c1: control(start, (end.x - before.x) / 6, (end.y - before.y) / 6, limit),
      c2: control(end, (start.x - after.x) / 6, (start.y - after.y) / 6, limit),
    });
  }
  return segments;
}

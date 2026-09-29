import { layout, frameState, createProjection, markAppearance, MAX_MARKS, MAX_TRACE_POINTS, MAX_POINTS_PER_STROKE, MAX_RETIRING_MARKS, MAX_RETIRING_POINTS, MAX_INK_OPACITY, randomSource } from './model.mjs';
import { CONTOURS, portalContour, O_METRICS, deformPoint, finite, clamp } from '../ink-portal-fluid/geometry.mjs';
import { strokeCurve } from '../ink-portal-fluid/stroke.mjs';
import { PALETTE } from '../ink-portal-fluid/material.mjs';

// Soft width bands describe one curve; they never scatter independent stamps.
const BANDS = [[2.15, .015], [1.85, .022], [1.6, .032], [1.38, .045], [1.19, .058], [1.04, .075], [.89, .09]];
export function createRenderer(canvas) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas2D unavailable');
  let width = 1, height = 1, disposed = false, paperPattern;
  const makeCanvas = (w, h) => {
    const image = canvas.ownerDocument?.createElement('canvas') ?? new OffscreenCanvas(w, h);
    image.width = w; image.height = h; return image;
  };
  const inkLayer = makeCanvas(1, 1), inkContext = inkLayer.getContext('2d');
  if (!inkContext) throw new Error('Ink composition unavailable');
  const createPaper = () => {
    const image = makeCanvas(144, 144), ctx = image.getContext('2d'), random = randomSource(137);
    ctx.clearRect(0, 0, 144, 144); ctx.fillStyle = 'rgba(23,23,23,.022)';
    for (let index = 0; index < 650; index++) ctx.fillRect(random() * 144, random() * 144, .5 + random() * .5, .5 + random() * .5);
    return context.createPattern(image, 'repeat');
  };
  const appendPoints = (points, view) => {
    points.forEach(([x, y], index) => {
      const p = deformPoint(x, y, view);
      if (!index) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y);
    });
    context.closePath();
  };
  const appendGlyph = (points, glyph, scene, view) =>
    appendPoints(points.map(([u, v]) => [glyph.x + u * scene.size, glyph.y + v * scene.size]), view);
  const appendPortal = (frame, view) =>
    appendPoints(portalContour(frame.centerX, frame.centerY, frame.radius, frame.radius * frame.scaleY), view);
  const paintCurve = ({ start, segments }) => {
    inkContext.beginPath(); inkContext.moveTo(start.x, start.y);
    if (!segments.length) inkContext.lineTo(start.x + .01, start.y);
    else for (const s of segments) inkContext.bezierCurveTo(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.end.x, s.end.y);
    inkContext.stroke();
  };
  const assertLive = () => { if (disposed) throw new Error('Renderer disposed'); };
  return {
    resize(w, h) {
      assertLive(); width = Math.max(1, finite(w, 1440)); height = Math.max(1, finite(h, 900));
      const ratio = Math.min(2, Math.max(1, finite(globalThis.devicePixelRatio, 1)));
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      inkLayer.width = canvas.width; inkLayer.height = canvas.height;
      inkContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!paperPattern) paperPattern = createPaper();
    },
    render(options = {}) {
      assertLive();
      const view = { ...options, width, height, progress: clamp(options.progress, 0, 1) };
      const scene = layout(width, height), frame = frameState(view), project = createProjection(view);
      context.globalAlpha = 1; context.fillStyle = PALETTE.paper; context.fillRect(0, 0, width, height);
      context.beginPath();
      for (const glyph of scene.glyphs) for (const contour of CONTOURS[glyph.id]) appendGlyph(contour, glyph, scene, view);
      context.fillStyle = PALETTE.ink; context.fill();
      context.beginPath(); appendPortal(frame, view);
      context.globalAlpha = frame.portalTint; context.fill(); context.globalAlpha = 1;
      context.save(); context.beginPath();
      for (const glyph of scene.glyphs) for (const contour of CONTOURS[glyph.id]) appendGlyph(contour, glyph, scene, view);
      appendPortal(frame, view); context.clip();

      inkContext.globalAlpha = 1; inkContext.clearRect(0, 0, width, height);
      inkContext.lineCap = 'round'; inkContext.lineJoin = 'round';
      const strokes = [];
      for (const pool of [
        {marks:options.portrait?.retiring ?? [],count:MAX_RETIRING_MARKS,points:MAX_RETIRING_POINTS},
        {marks:options.portrait?.marks ?? [],count:MAX_MARKS,points:MAX_TRACE_POINTS},
      ]) {
        let remaining = pool.points;
        for (const mark of pool.marks.slice(-pool.count)) {
          if (!remaining) break;
          const anchors = (mark.path?.length ? mark.path : [mark.anchor]).slice(-Math.min(MAX_POINTS_PER_STROKE, remaining));
          if (!anchors.length) break;
          remaining -= anchors.length;
          const appearance = markAppearance(mark,view);
          if (appearance.opacity <= 0) continue;
          const projected = anchor => {const p=project(anchor);return {...p,x:p.x+appearance.x,y:p.y+appearance.y};};
          const points = anchors.map(projected), segments = strokeCurve(points, {
            before: mark.before && projected(mark.before), after: mark.after && projected(mark.after),
          });
          const strokeId = mark.strokeId ?? mark.id, previous = strokes.at(-1);
          if (previous?.strokeId === strokeId && !mark.ambient && previous.mark.retireAge === mark.retireAge && previous.appearance.opacity === appearance.opacity) previous.segments.push(...segments);
          else strokes.push({ strokeId, mark, appearance, start: points[0], segments });
        }
      }
      for (const stroke of strokes) {
        const mark = stroke.mark, reference = project(mark.styleAnchor ?? mark.anchor);
        // Keep the original material width; new samples and elapsed time cannot restyle it.
        const scale = Math.sqrt(reference.scaleX * reference.scaleY);
        const radius = clamp(mark.radiusU, .02, .06) * scale * .9 * stroke.appearance.scale;
        inkContext.strokeStyle = PALETTE.pigments[0];
        const density = clamp(mark.alpha, 0, .3) / .25;
        for (const [spread, alpha] of BANDS) {
          inkContext.lineWidth = Math.max(.5, radius * 2 * spread);
          inkContext.globalAlpha = Math.min(.12, alpha * density) * stroke.appearance.opacity; paintCurve(stroke);
        }
      }
      inkContext.globalAlpha = 1;
      context.globalAlpha = MAX_INK_OPACITY; context.drawImage(inkLayer, 0, 0, width, height);
      context.restore(); context.globalAlpha = 1;

      const o = O_METRICS;
      context.beginPath();
      appendPoints(portalContour(frame.centerX, frame.centerY, scene.size * o.innerRX, scene.size * o.innerRY, 100), view);
      context.fillStyle = PALETTE.paper; context.globalAlpha = 1 - frame.portalTint; context.fill(); context.globalAlpha = 1;
      if (paperPattern) { context.fillStyle = paperPattern; context.fillRect(0, 0, width, height); }
      return { reverseOpacity: frame.reverseOpacity, inside: frame.inside };
    },
    dispose() { disposed = true; paperPattern = null; inkLayer.width = 1; inkLayer.height = 1; },
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import * as original from '../samples/ink-portal-fluid/model.mjs';
import { GLYPH_BOUNDS, O_METRICS } from '../samples/ink-portal-fluid/geometry.mjs';
const variant = await import('../samples/ink-resume-portal/model.mjs').catch(() => null);
const model = () => { assert.ok(variant, 'the isolated single-line model must exist'); return variant; };

test('mobile, breakpoint and short viewports keep GIHO in one row within safe bounds', () => {
  const m = model();
  for (const [width, height] of [[320,568],[360,780],[390,844],[430,932],[659,844],[660,844],[1440,900],[568,320]]) {
    const scene = m.layout(width,height); assert.equal(scene.glyphs.map(g=>g.letter).join(''),'GIHO');
    assert.equal(new Set(scene.glyphs.map(g=>g.y)).size,1,`one row at ${width}×${height}`);
    const left = Math.min(...scene.glyphs.map(g=>g.x+GLYPH_BOUNDS[g.id].left*scene.size));
    const right = Math.max(...scene.glyphs.map(g=>g.x+GLYPH_BOUNDS[g.id].right*scene.size));
    assert.ok(left>=width*.049 && right<=width*.951); assert.ok(scene.glyphs[0].y>=70);
    assert.ok(scene.glyphs[0].y+scene.size*1.2<height-100);
    if (width<660 && height>500) assert.ok(Math.abs((right-left)/width-.9)<1e-10,'mobile word uses 90% width');
  }
});
test('the desktop form and canonical seed geometry are unchanged', () => {
  const m = model(); assert.deepEqual(m.layout(1440,900),original.layout(1440,900));
  const canonical = portrait => ({ ...portrait, retiring:undefined, inputCount:undefined, marks:portrait.marks.map(({ambient,sequence,lastInput,...mark})=>mark) });
  assert.deepEqual(canonical(m.createPortrait(137)),canonical(original.createPortrait(137)));
  assert.deepEqual(canonical(m.stepPortrait(m.createPortrait(137),.1)),canonical(original.stepPortrait(original.createPortrait(137),.1)));
});
test('the O origin belongs to the same single-line layout used for drawing', () => {
  const m=model(),scene=m.layout(390,844),frame=m.frameState({width:390,height:844,progress:0});
  assert.equal(frame.centerX,scene.glyphs[3].x+scene.size*O_METRICS.cx);
  assert.equal(frame.centerY,scene.glyphs[3].y+scene.size*O_METRICS.cy);
});
test('narrow deformed letters and O entry preserve consistent input inverse coordinates', () => {
  const m=model();
  for (const width of [320,390,430]) for (const glyph of [0,3]) for (const progress of [0,.35,.7,1]) {
    const view={width,height:844,progress,time:.7,pointerX:.4,pointerY:.5,pointerForce:.7};
    const p=m.materialPoint({glyph,u:.08,v:.6},view),anchor=m.inverseMaterialPoint(p.x,p.y,view),back=m.materialPoint(anchor,view);
    assert.ok(Math.hypot(p.x-back.x,p.y-back.y)<2,`${width}/${glyph}/${progress}`);
  }
});
test('short landscape entry records ink on overlapping H projections', () => {
  const m = model();
  for (const progress of [.85, .9]) {
    const view = { width:568, height:320, progress, time:0, pointerForce:0 };
    const point = m.materialPoint({glyph:2, u:.9, v:.2}, view);
    const empty = m.clearPortrait(137);
    const portrait = m.recordGesture(empty, {x:point.x / view.width, y:point.y / view.height, start:true}, view);
    assert.equal(portrait.marks.length, 1, `ink is recorded during entry at ${progress}`);
    const recorded = m.materialPoint(portrait.marks[0].anchor, view);
    assert.ok(Math.hypot(point.x-recorded.x, point.y-recorded.y) < 2, `ink stays under the pointer at ${progress}`);
  }
});
test('empty-space pointer input stays within the original inverse search work budget', () => {
  const m = model(), view = {width:390,height:844,progress:.1,time:0,pointerForce:0};
  const run = implementation => {
    const start = performance.now();
    for (let n=0; n<4; n++) implementation.inverseMaterialPoint(195,120,view);
    return performance.now()-start;
  };
  for (let n=0; n<3; n++) { run(original); run(m); }
  const baseline=[], variant=[];
  for (let n=0; n<9; n++) { baseline.push(run(original)); variant.push(run(m)); }
  const median = values => values.sort((a,b)=>a-b)[4];
  // Use a generous relative limit and medians to tolerate runner contention.
  assert.ok(median(variant) < median(baseline)*6,
    `empty-space input took ${median(variant).toFixed(1)}ms against original ${median(baseline).toFixed(1)}ms`);
});
test('the inside atlas still covers the plane and front/rotation projections leave history intact', () => {
  const m=model(),portrait=m.createPortrait(137),snapshot=structuredClone(portrait);
  for (const [width,height] of [[390,844],[844,390],[1440,900]]) {
    const view={width,height,progress:1,pointerForce:0,time:0};
    for (const [x,y] of [[20,20],[width/2,height/2],[width-20,height-20]]) {
      const anchor=m.inverseMaterialPoint(x,y,view),p=m.materialPoint(anchor,view); assert.ok(Math.hypot(x-p.x,y-p.y)<.001);
    }
    for (const mark of portrait.marks) for (const progress of [0,1,0]) m.materialPoint(mark.anchor,{...view,progress});
  }
  assert.deepEqual(portrait,snapshot);
});
test('the isolated variant keeps sealed trace geometry and material style fixed during later input', () => {
  const m=model(),view={width:390,height:844,progress:1,time:0,pointerForce:0}; let portrait=m.clearPortrait(137);
  for(let i=0;i<140;i++) portrait=m.recordGesture(portrait,{x:.1+i*.002,y:.3+Math.sin(i*.05)*.03,dx:.002,dy:.001,start:i===0},view);
  const first=portrait.marks[0],fixed=structuredClone({path:first.path,after:first.after,styleAnchor:first.styleAnchor,radiusU:first.radiusU,alpha:first.alpha,strokeId:first.strokeId});
  for(let i=140;i<260;i++) portrait=m.recordGesture(portrait,{x:.1+i*.002,y:.3+Math.sin(i*.05)*.03,dx:.002,dy:.001,start:false},view);
  const retained=portrait.marks[0]; assert.deepEqual({path:retained.path,after:retained.after,styleAnchor:retained.styleAnchor,radiusU:retained.radiusU,alpha:retained.alpha,strokeId:retained.strokeId},fixed);
  assert.ok(portrait.marks.length<=m.MAX_MARKS); assert.ok(portrait.marks.reduce((n,mark)=>n+mark.path.length,0)<=m.MAX_TRACE_POINTS);
});
test('desktop material coordinates preserve the original projection throughout entry', () => {
  const m=model();
  for (const progress of [0,.4,.8,1]) for (let glyph=0;glyph<4;glyph++) for(const u of [.15,.65]) {
    const view={width:1440,height:900,progress,time:1,pointerForce:.3,pointerX:.2,pointerY:.4};
    const anchor={glyph,u,v:.6};
    assert.deepEqual(m.materialPoint(anchor,view),original.materialPoint(anchor,view));
  }
});
test('overflowing ink retires with its original geometry and fades before removal', () => {
  const m=model(),view={width:390,height:844,progress:1}; let portrait=m.clearPortrait(137);
  for(let i=0;i<m.MAX_MARKS;i++) portrait=m.recordGesture(portrait,{x:.2,y:.3,start:true},view);
  const oldest=structuredClone(portrait.marks[0]);
  portrait=m.recordGesture(portrait,{x:.6,y:.4,start:true},view);
  assert.equal(portrait.marks.length,m.MAX_MARKS);
  assert.equal(portrait.retiring?.[0]?.id,oldest.id,'old ink stays visible while retiring');
  assert.deepEqual(portrait.retiring[0].path,oldest.path);
  assert.deepEqual(portrait.retiring[0].styleAnchor,oldest.styleAnchor);
  const first=m.markAppearance(portrait.retiring[0],view).opacity;
  const later=m.stepPortrait(portrait,.7), middle=m.markAppearance(later.retiring[0],view).opacity;
  assert.equal(first,1); assert.ok(middle>0 && middle<first);
  assert.deepEqual(later.retiring[0].path,oldest.path);
  assert.equal(m.stepPortrait(later,.7).retiring.length,0);
  assert.equal(m.clearPortrait(137).retiring.length,0);
});
test('long strokes retain evicted chunks for fading while live and retiring pools stay bounded', () => {
  const m=model(),view={width:390,height:844,progress:1}; let portrait=m.clearPortrait(137);
  for(let i=0;i<1800;i++) portrait=m.recordGesture(portrait,{x:.15+(i%300)*.002,y:.4,start:i===0},view);
  assert.ok(portrait.retiring?.length>0);
  assert.ok(portrait.marks.length<=m.MAX_MARKS);
  assert.ok(portrait.marks.reduce((n,mark)=>n+mark.path.length,0)<=m.MAX_TRACE_POINTS);
  assert.ok(portrait.retiring.length<=m.MAX_RETIRING_MARKS);
  assert.ok(portrait.retiring.reduce((n,mark)=>n+mark.path.length,0)<=m.MAX_RETIRING_POINTS);
  assert.equal(portrait.retiring.at(-1).strokeId,portrait.marks[0].strokeId);
  assert.ok(portrait.retiring.at(-1).after);
});
test('burst input fades retiring ink before its bounded pool evicts it', () => {
  const m=model(),view={width:390,height:844,progress:1};
  for(const pattern of ['separate','continuous','long-then-short','short-then-long']) {
    let portrait=m.clearPortrait(137),checked=0;
    for(let i=0;i<3500;i++) {
      const before=portrait;
      const separate=pattern==='separate' || (pattern==='long-then-short' && i>=1300) || (pattern==='short-then-long' && i<300);
      portrait=m.recordGesture(portrait,{x:.2+(i%100)*.005,y:.4,start:separate||i===0},view);
      const oldest=before.retiring?.[0];
      if(oldest && !portrait.retiring.some(mark=>mark.id===oldest.id)) {
        assert.ok(m.markAppearance(oldest,{...view,portrait:before}).opacity<.025,'capacity only removes ink that is already almost transparent');checked++;
      }
    }
    assert.ok(checked>0);
  }
});
test('sealed chunk retirement never makes a continuous stroke jump to invisible between frames', () => {
  const m=model(),view={width:1440,height:900,progress:1};let portrait=m.clearPortrait(),previous=new Map(),checked=0;
  for(let i=0;i<1800;i++) {
    portrait=m.recordGesture(portrait,{x:.2+(i%100)*.005,y:.4,start:i===0},view);
    if(i%24!==23)continue;
    portrait=m.stepPortrait(portrait,1/60);
    const current=new Map([...portrait.retiring,...portrait.marks].map(mark=>[mark.id,m.markAppearance(mark,{...view,portrait}).opacity]));
    for(const [id,opacity] of current)if(previous.has(id)) {
      const delta=previous.get(id)-opacity;
      assert.ok(delta>=-1e-12,'an older path must not become brighter');
      assert.ok(delta<.16,`a chunk boundary must not abruptly erase visible ink (${delta})`);checked++;
    }
    previous=current;
  }
  assert.ok(checked>100);
});
test('only ambient seeds drift and breathe inside the O without changing stored paths', () => {
  const m=model(); assert.equal(typeof m.markAppearance,'function');
  const seed=m.createPortrait(137).marks[0],snapshot=structuredClone(seed);
  assert.equal(seed.ambient,true);
  const a=m.markAppearance(seed,{width:390,height:844,progress:1,time:0});
  const b=m.markAppearance(seed,{width:390,height:844,progress:1,time:6});
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>1); assert.notEqual(a.scale,b.scale);
  assert.ok(a.opacity>0 && a.opacity<=1); assert.deepEqual(seed,snapshot);
  assert.deepEqual(m.markAppearance(seed,{width:390,height:844,progress:0,time:0}),m.markAppearance(seed,{width:390,height:844,progress:0,time:6}));
  const user=m.recordGesture(m.clearPortrait(),{x:.4,y:.5,start:true},{width:390,height:844,progress:1}).marks[0];
  assert.deepEqual(m.markAppearance(user,{width:390,height:844,progress:1,time:0}),m.markAppearance(user,{width:390,height:844,progress:1,time:6}));
});

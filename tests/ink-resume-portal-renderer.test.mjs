import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from '../samples/ink-resume-portal/renderer.mjs';
import * as m from '../samples/ink-resume-portal/model.mjs';

function fixture() {
  const canvases=[];
  const make=()=>{
    let path=[]; const stack=[],ctx={globalAlpha:1,fillStyle:'',strokes:[]};
    for(const name of ['setTransform','fillRect','drawImage','fill','clip','closePath']) ctx[name]=()=>{};
    ctx.clearRect=()=>{ctx.strokes=[];};
    ctx.beginPath=()=>{path=[];};
    for(const name of ['moveTo','lineTo','bezierCurveTo']) ctx[name]=(...args)=>{assert.ok(args.every(Number.isFinite));path.push({name,args});};
    ctx.stroke=()=>ctx.strokes.push({alpha:ctx.globalAlpha,width:ctx.lineWidth,path:structuredClone(path)});
    ctx.save=()=>stack.push({globalAlpha:ctx.globalAlpha,fillStyle:ctx.fillStyle});
    ctx.restore=()=>Object.assign(ctx,stack.pop()); ctx.createPattern=()=>({});
    const canvas={ownerDocument:{createElement:make},getContext:()=>ctx,context:ctx};canvases.push(canvas);return canvas;
  };
  const canvas=make(),renderer=createRenderer(canvas);renderer.resize(390,844);
  const render=options=>{renderer.render({width:390,height:844,progress:1,time:0,pointerForce:0,...options});return structuredClone(canvases[1].context.strokes);};
  return {render,renderer};
}
function userMark(){return m.recordGesture(m.clearPortrait(),{x:.2,y:.3,start:true},{width:390,height:844,progress:1}).marks[0];}

test('retiring ink fades in the real renderer without moving its saved path',()=>{
  const f=fixture(),mark=userMark();
  const a=f.render({portrait:{marks:[],retiring:[{...mark,retireAge:0}]}});
  const b=f.render({portrait:{marks:[],retiring:[{...mark,retireAge:.7}]}});
  assert.equal(a.length,7,'the retiring stroke is still drawn');assert.equal(b.length,7);
  for(let i=0;i<7;i++){assert.deepEqual(a[i].path,b[i].path);assert.equal(a[i].width,b[i].width);assert.ok(b[i].alpha>0 && b[i].alpha<a[i].alpha);}
  assert.equal(f.render({portrait:{marks:[],retiring:[{...mark,retireAge:1.4}]}}).length,0);f.renderer.dispose();
});
test('fading an old chunk does not dim the live continuation of that stroke',()=>{
  const f=fixture(),mark=userMark(),live={...mark,id:'live',path:[{...mark.anchor,u:.6,v:.8}]};
  const before=f.render({portrait:{marks:[live],retiring:[]}});
  const after=f.render({portrait:{marks:[live],retiring:[{...mark,retireAge:.7}]}});
  assert.equal(after.length,14);assert.deepEqual(after.slice(7),before);f.renderer.dispose();
});
test('same-frame retiring chunks preserve their individual pressure fade',()=>{
  const f=fixture(),mark=userMark();
  const old={...mark,retireAge:0};
  const newer={...mark,id:'newer',sequence:20,lastInput:100,path:[{...mark.anchor,u:.6,v:.8}],retireAge:0};
  const state={marks:[],counter:422,inputCount:120};
  const combined=f.render({portrait:{...state,retiring:[old,newer]}});
  const separate=[...f.render({portrait:{...state,retiring:[old]}}),...f.render({portrait:{...state,retiring:[newer]}})];
  assert.deepEqual(combined,separate,'a new chunk must not inherit the older chunk opacity');f.renderer.dispose();
});
test('ambient seed ink drifts and breathes while user ink and frozen time stay fixed',()=>{
  const f=fixture(),seed=m.createPortrait().marks[0],portrait={marks:[seed],retiring:[]};
  const a=f.render({portrait,time:0}),b=f.render({portrait,time:6});assert.notDeepEqual(a,b);
  assert.deepEqual(b,f.render({portrait,time:6}),'paused time produces the same ink');
  const user={marks:[userMark()],retiring:[]};assert.deepEqual(f.render({portrait:user,time:0}),f.render({portrait:user,time:6}));f.renderer.dispose();
});

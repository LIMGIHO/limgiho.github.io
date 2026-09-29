import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../samples/ink-resume-portal/resume-nav.mjs').catch(()=>null);

class Target {
  listeners=new Map();
  addEventListener(name,callback){const set=this.listeners.get(name)??new Set();set.add(callback);this.listeners.set(name,set);}
  removeEventListener(name,callback){this.listeners.get(name)?.delete(callback);}
  emit(name,event={}){for(const callback of this.listeners.get(name)??[])callback(event);}
}
function fixture(){
  const env=new Target(),raf=new Map();let next=0;
  const targets=['about','section-1','section-2','section-3','section-4','section-5'].map((id,i)=>({id,top:2000+i*1000,getBoundingClientRect(){return {top:this.top-env.scrollY};}}));
  const links=[...targets.map(target=>({href:`#${target.id}`,attrs:{}})),{href:'#top',attrs:{}}];
  for(const link of links){link.getAttribute=name=>name==='href'?link.href:link.attrs[name];link.setAttribute=(name,value)=>{link.attrs[name]=value;};link.removeAttribute=name=>{delete link.attrs[name];};}
  const container={contains:target=>targets.includes(target)},nav={querySelectorAll:()=>links};
  Object.assign(env,{innerHeight:900,scrollY:0,document:{documentElement:{scrollHeight:8000},getElementById:id=>targets.find(t=>t.id===id),activeElement:{id:'reader'}},
    requestAnimationFrame:cb=>{raf.set(++next,cb);return next;},cancelAnimationFrame:id=>raf.delete(id),
    ResizeObserver:class{constructor(cb){env.layout=cb;}observe(){}disconnect(){env.disconnected=true;}},scrollTo:()=>assert.fail('the nav must not scroll')});
  const flush=()=>{const tasks=[...raf.values()];raf.clear();tasks.forEach(task=>task());};
  const active=()=>links.filter(link=>link.attrs['aria-current']==='location').map(link=>link.href);
  assert.equal(typeof module?.mountResumeNav,'function');const dispose=module.mountResumeNav({nav,container},env);
  return {env,targets,links,raf,flush,active,dispose};
}

test('the active section follows the reading line in both directions and at document end',()=>{
  assert.equal(typeof module?.activeSectionIndex,'function');
  assert.equal(module.activeSectionIndex([500,1500,2500],180),-1);
  assert.equal(module.activeSectionIndex([100,1100,2100],180),0);
  assert.equal(module.activeSectionIndex([-900,100,1100],180),1);
  assert.equal(module.activeSectionIndex([-1900,-900,100],180),2);
  assert.equal(module.activeSectionIndex([100,1100,2100],180),0);
  assert.equal(module.activeSectionIndex([],180,true),-1);
});
test('scrolling selects one local section without moving focus or highlighting the back link',()=>{
  const f=fixture(),focused=f.env.document.activeElement;
  assert.deepEqual(f.active(),[]);
  f.env.scrollY=1900;f.env.emit('scroll');f.env.emit('scroll');assert.equal(f.raf.size,1);f.flush();assert.deepEqual(f.active(),['#about']);
  f.env.scrollY=3900;f.env.emit('scroll');f.flush();assert.deepEqual(f.active(),['#section-2']);
  f.env.scrollY=2900;f.env.emit('scroll');f.flush();assert.deepEqual(f.active(),['#section-1']);
  assert.equal(f.env.document.activeElement,focused);assert.equal(f.links.at(-1).attrs['aria-current'],undefined);
  f.env.scrollY=0;f.env.emit('scroll');f.flush();assert.deepEqual(f.active(),[]);f.dispose();
});
test('document end does not skip technical skills when the personal heading is still below the reading line',()=>{
  const f=fixture();f.env.innerHeight=1300;f.env.scrollY=6700;
  f.targets[4].top=6880.05;f.targets[5].top=7505.65;
  f.env.emit('scroll');f.flush();assert.deepEqual(f.active(),['#section-4']);
  f.env.document.documentElement.scrollHeight=9000;f.env.scrollY=7326;
  f.env.emit('scroll');f.flush();assert.deepEqual(f.active(),['#section-5']);f.dispose();
});
test('fragment navigation, resize, layout, restoration and document end resynchronize the nav',()=>{
  const f=fixture();f.env.scrollY=4900;f.env.emit('hashchange');f.flush();assert.deepEqual(f.active(),['#section-3']);
  f.targets[3].top+=400;f.env.emit('resize');f.flush();assert.deepEqual(f.active(),['#section-2']);
  f.targets[3].top-=400;f.env.layout();f.flush();assert.deepEqual(f.active(),['#section-3']);
  f.env.emit('pagehide',{persisted:true});f.env.scrollY=1900;f.env.emit('pageshow',{persisted:true});f.flush();assert.deepEqual(f.active(),['#about']);
  f.env.scrollY=7100;f.env.emit('scroll');f.flush();assert.deepEqual(f.active(),['#section-5']);f.dispose();
});
test('disposing the nav cancels pending work and removes all highlights and listeners',()=>{
  const f=fixture();f.env.scrollY=1900;f.env.emit('scroll');f.flush();f.env.emit('scroll');f.dispose();
  assert.equal(f.raf.size,0);assert.deepEqual(f.active(),[]);assert.equal(f.env.disconnected,true);
  f.env.emit('scroll');assert.equal(f.raf.size,0);f.dispose();
});

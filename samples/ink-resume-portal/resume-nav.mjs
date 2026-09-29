export function activeSectionIndex(tops, line) {
  if (!tops.length) return -1;
  let active = -1;
  tops.forEach((top,index) => { if (Number.isFinite(top) && top <= line + 1) active = index; });
  return active;
}

export function mountResumeNav({nav,container}, environment = globalThis) {
  if (!nav || !container) return () => {};
  const env=environment, doc=env.document, listeners=[];
  const items=[...nav.querySelectorAll('a[href^="#"]')].flatMap(link => {
    const href=link.getAttribute('href'); let target;
    try { target=doc.getElementById(decodeURIComponent(href.slice(1))); } catch { return []; }
    return target && container.contains(target) ? [{link,target}] : [];
  });
  let pending=0, disposed=false, suspended=false, observer;
  const listen=(name,callback) => {env.addEventListener(name,callback,{passive:true});listeners.push(()=>env.removeEventListener(name,callback));};
  function update() {
    pending=0;
    if (disposed || suspended) return;
    const height=env.innerHeight, line=Math.min(180,Math.max(80,height*.22));
    const active=activeSectionIndex(items.map(({target})=>target.getBoundingClientRect().top),line);
    items.forEach(({link},index) => {if(index===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
  function schedule() {if(!pending && !disposed && !suspended)pending=env.requestAnimationFrame(update);}
  function dispose() {
    if(disposed)return;disposed=true;env.cancelAnimationFrame(pending);pending=0;
    observer?.disconnect();listeners.splice(0).forEach(remove=>remove());
    items.forEach(({link})=>link.removeAttribute('aria-current'));
  }
  for(const name of ['scroll','resize','hashchange','load'])listen(name,schedule);
  listen('pagehide',event=>{suspended=true;env.cancelAnimationFrame(pending);pending=0;if(!event.persisted)dispose();});
  listen('pageshow',()=>{suspended=false;schedule();});
  if(typeof env.ResizeObserver==='function'){observer=new env.ResizeObserver(schedule);observer.observe(container);}
  doc.fonts?.ready.then(schedule).catch(()=>{});
  update();
  return dispose;
}

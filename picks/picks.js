const view=location.pathname.includes('/selected/')?'selected':'consideration';
const links=[...document.querySelectorAll('[data-view]')],sections=[...document.querySelectorAll('section')],states=new Map();
links.find(a=>a.dataset.view===view).setAttribute('aria-current','page');
addEventListener('picks-update',({detail:r})=>{
 const section=document.getElementById(r.scope);if(!section)return;states.set(r.scope,r);
 for(const a of links){a.querySelector('b').textContent=sections.every(s=>states.get(s.id)?.ready)?sections.reduce((n,s)=>n+states.get(s.id).counts[a.dataset.view],0):'—'}
 const lost=r.missing[view];section.querySelector('p').textContent=!r.ready?'Shared picks not confirmed. Refresh this shortlist to retry.':(r.counts[view]?r.counts[view]+' picks':'No picks in this view.')+(lost.length?' · No longer in current catalog: '+lost.join(', '):'');
});
for(const s of sections){const frame=document.createElement('iframe');frame.title=s.querySelector('h2').textContent;frame.src='../../'+s.id+'/?collection=all&picks='+view;
 frame.onload=()=>{const body=frame.contentDocument.body;const resize=()=>{frame.height=Math.ceil(body.getBoundingClientRect().height+2)};new ResizeObserver(resize).observe(body);resize()};s.append(frame);
 setTimeout(()=>{if(!states.has(s.id))s.querySelector('p').textContent='Display unavailable. Reload to retry.'},15000);
}
const key='universal-picks:scroll:'+view;let y=Number(sessionStorage.getItem(key)),restore=y>0;if('scrollRestoration'in history)history.scrollRestoration='manual';for(const e of ['wheel','touchstart','pointerdown','keydown'])addEventListener(e,()=>restore=false,{passive:true});let until=performance.now()+10000;function tick(){if(!restore)return;scrollTo(0,y);if(Math.abs(scrollY-y)<2||performance.now()>until)restore=false;else requestAnimationFrame(tick)}requestAnimationFrame(tick);addEventListener('pagehide',()=>{if(!restore)sessionStorage.setItem(key,scrollY)});

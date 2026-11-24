/* Only loaded by the monitored-deals export. Links use native document navigation. */
window.DealsToolbar=(()=>{
 const paths={active:'items',consideration:'in-consideration',selected:'selected',removed:'removed'};
 const scope=document.documentElement.dataset.shortlistTopic;
 const sources={'monitored-deals':'https://monitored-deals-shortlist.wren-tools.workers.dev/state','natural-jackets-under-300':'https://jacket-shared-archive.wren-tools.workers.dev/shortlist/state'};
 const universal=Object.hasOwn(sources,scope), picked=s=>s==='consideration'||s==='selected';
 const pane=universal && window!==parent && new URLSearchParams(location.search).get('picks');
 const view=picked(pane)?pane:Object.keys(paths).find(k=>location.pathname.replace(/\/$/,'').endsWith('/'+paths[k]))||'active';
 const key=document.documentElement.dataset.shortlistTopic+':toolbar:v1:'+view;
 function get(k){try{return localStorage.getItem(key+k)}catch{return null}}
 function put(k,v){if(pane)return;try{localStorage.setItem(key+k,v)}catch{}}
 function link(s,label){const a=document.createElement('a');a.href=universal&&picked(s)?new URL('../picks/'+paths[s]+'/',document.baseURI):new URL(paths[s]+'/'+location.search,document.baseURI);a.textContent=label;if(s===view)a.setAttribute('aria-current','page');return a}
 const target=Math.max(0,Number(get(':y'))||0);let restoring=!pane&&target>0,started=false;
 if('scrollRestoration' in history)history.scrollRestoration='manual';
 function cancel(){restoring=false}
 for(const e of ['wheel','touchstart','pointerdown','keydown'])addEventListener(e,cancel,{passive:true,capture:true});
 addEventListener('pagehide',()=>{if(!restoring)put(':y',String(scrollY))});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&!restoring)put(':y',String(scrollY))});
 function ready(){if(started||!restoring)return;started=true;const until=performance.now()+2500;function tick(){if(!restoring)return;scrollTo(0,target);if(Math.abs(scrollY-target)<2||performance.now()>until){restoring=false;return}requestAnimationFrame(tick)}requestAnimationFrame(tick)}
 function mount(bar,details,endpoint){const form=document.createElement('form');form.className='deals-intake';const field=document.createElement('input'),save=document.createElement('button'),msg=document.createElement('span');field.type='url';field.required=true;field.maxLength=850;field.placeholder='Product URL';field.setAttribute('aria-label','Product URL');save.textContent='Save';save.type='submit';msg.setAttribute('role','status');msg.className='intake-status';form.append(field,save);bar.append(form);details.append(msg);
 const api=new URL('/intake',endpoint);function describe(r){return r.status==='matched'?'Matched an existing card. Shortlist unchanged.':'Saved for review. No verified card yet.'}
 const prior=get(':receipt');if(prior&&/^[a-f0-9-]{36}$/.test(prior))fetch(api+'/'+prior,{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():null).then(r=>{if(r&&!msg.textContent)msg.textContent=describe(r)}).catch(()=>{});
 form.onsubmit=async e=>{e.preventDefault();save.disabled=true;msg.textContent='Saving…';try{const res=await fetch(api,{method:'POST',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json'},body:JSON.stringify({url:field.value.trim()})});const r=await res.json();if(!res.ok)throw Error(r.error||'Save failed.');put(':receipt',r.receipt);msg.textContent=(r.duplicate?'Already submitted. ':'')+describe(r);field.value=''}catch(err){msg.textContent=err.message||'Save not confirmed.'}finally{save.disabled=false}}}
 let other=null, repaint;
 async function sibling(){try{const response=await fetch(Object.entries(sources).find(([k])=>k!==scope)[1],{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error();other=Object.values((await response.json()).items)}catch{other=null}repaint?.()}
 if(universal&&!pane){sibling();document.addEventListener('visibilitychange',()=>{if(!document.hidden)sibling()})}
 function report(tabs,records,ids,ready){if(!universal)return;
 const counts={},missing={};for(const s of ['selected','consideration']){const rows=[...records].filter(([,r])=>r.state===s);counts[s]=rows.length;missing[s]=rows.filter(([id])=>!ids.has(id)).map(([id])=>id)}
 if(pane){parent.dispatchEvent(new CustomEvent('picks-update',{detail:{scope,counts,missing,ready}}));return}
 repaint=()=>{for(const s of ['selected','consideration']){const label=s==='selected'?'Selected':'In consideration';tabs[s].textContent=label+' ('+(ready&&other?counts[s]+other.filter(r=>r.state===(s==='selected'?s:'considering')).length:'—')+')'}};repaint();}
 if(pane)document.documentElement.classList.add('picks-pane');
 return {view,link,ready,mount,pane,report};})();

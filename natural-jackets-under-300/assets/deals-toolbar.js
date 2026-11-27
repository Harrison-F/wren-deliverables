/* Only loaded by the monitored-deals export. Links use native document navigation. */
window.DealsToolbar=(()=>{
 const paths={active:'items',consideration:'in-consideration',selected:'selected',removed:'removed'};
 const scope=document.documentElement.dataset.shortlistTopic;
 if(scope==='monitored-deals')paths.new='new-additions';
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
 const api='https://monitored-deals-shortlist.wren-tools.workers.dev/picks';
 form.onsubmit=async e=>{e.preventDefault();if(save.disabled)return;save.disabled=field.disabled=true;msg.textContent='Saving…';try{
   const res=await fetch(api,{method:'POST',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json'},body:JSON.stringify({url:field.value.trim()})});
   const r=await res.json().catch(()=>({}));if(!res.ok||!r.id||!['selected','considering'].includes(r.state)||!Number.isSafeInteger(r.version))throw Error(r.error||'Save not confirmed.');
   const label=r.state==='selected'?'Selected':'In consideration';msg.textContent=(r.duplicate?(r.state==='selected'?'Already in Selected.':'Already in consideration.'):'Added to '+label+'.')+' ';const a=document.createElement('a');a.href=new URL((location.pathname.includes('/picks/')?'../':'../picks/')+(r.state==='selected'?'selected':'in-consideration')+'/',document.baseURI);a.textContent='View pick';msg.append(a);field.value='';document.dispatchEvent(new Event('shared-pick-saved'));
 }catch(err){msg.textContent=err.message||'Save not confirmed.'}finally{save.disabled=field.disabled=false}}}
 function manualProduct(id,row){if(!id.startsWith('manual-')||!row.url)return null;const u=new URL(row.url);if(u.protocol!=='https:')return null;const name=u.pathname.split('/').filter(Boolean).pop().replace(/[-_]+/g,' ');return {id,url:u.href,name,store:u.hostname,category:'Manual pick',collectionIds:['matches','size-review'],priceLabel:'Price unverified',facts:{Fabric:'Material unverified'},images:[],sizeLinks:[{size:'Open listing',url:u.href}],fulfillmentNote:'Manually saved · availability unverified',materialCaveat:'Not a verified deal'};}
 async function appendManual(topic){if(topic.id!=='monitored-deals')return;try{const r=await fetch('https://monitored-deals-shortlist.wren-tools.workers.dev/state',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});if(!r.ok)return;for(const [id,row] of Object.entries((await r.json()).items)){const p=manualProduct(id,row);if(p)topic.products.push(p)}}catch{/* Static catalog remains usable offline. */}}
 let other=null, repaint;
 async function sibling(){try{const response=await fetch(Object.entries(sources).find(([k])=>k!==scope)[1],{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error();other=Object.values((await response.json()).items)}catch{other=null}repaint?.()}
 if(universal&&!pane){sibling();document.addEventListener('shared-pick-saved',sibling);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sibling()})}
 function report(tabs,records,ids,ready){if(!universal)return;
 const counts={},missing={};for(const s of ['selected','consideration']){const rows=[...records].filter(([,r])=>r.state===s);counts[s]=rows.length;missing[s]=rows.filter(([id])=>!ids.has(id)).map(([id])=>id)}
 if(pane){parent.dispatchEvent(new CustomEvent('picks-update',{detail:{scope,counts,missing,ready}}));return}
 repaint=()=>{for(const s of ['selected','consideration']){const label=s==='selected'?'Selected':'In consideration';tabs[s].textContent=label+' ('+(ready&&other?counts[s]+other.filter(r=>r.state===(s==='selected'?s:'considering')).length:'—')+')'}};repaint();}
 if(pane)document.documentElement.classList.add('picks-pane');
 function mountCatalog(bar,details,endpoint){
   if(universal){const purchased=document.createElement('a');purchased.href=new URL('../purchased-clothing/',document.baseURI);purchased.textContent='Purchased';bar.prepend(purchased)}
   mount(bar,details,endpoint);
 }
 return {view,link,ready,mount:mountCatalog,pane,report,appendManual};})();

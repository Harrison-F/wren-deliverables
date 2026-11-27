/* Catalog destinations. Only a scope-matched export may send shortlist writes. */
var CatalogRemoval = (() => {
 'use strict';
 const labels={active:'Items',consideration:'In consideration',selected:'Final Picks',removed:'Removed'};
 const actions=[['removed','remove-item','🗑︎','Remove'],['consideration','consider-item','🤔','Consider'],['selected','select-item','✓','Move to Final Picks:']];
 const valid=row=>row && Object.hasOwn(labels,row.state) && Number.isSafeInteger(row.version) && row.version>=0;
 const decode=r=>r?.state==='considering'?{...r,state:'consideration'}:r;
 function attach(topic,apply){
  const grid=document.querySelector('.display-template'),config=document.documentElement.dataset;
  const shared=config.shortlistTopic===topic.id && Boolean(config.shortlistEndpoint);
  const toolbar=shared && window.DealsToolbar;
  let records=new Map(),view=toolbar?.view||'active',busy=false,ready=!shared,last=null,persistent=true;
  const defaults=new Set(topic.defaultHiddenProductIds||[]);
  const key=name=>`research-catalog-${name}:v1:${topic.id}`;
  function load(name){
   if(shared)return new Set();
   try{const ids=JSON.parse(localStorage.getItem(key(name)));return new Set(Array.isArray(ids)?ids:[]);}
   catch(_){persistent=false;return new Set();}
  }
  const hidden=load('hidden'),restored=load('restored'),selected=load('selected'),consideration=load('consideration');
  if(!shared)defaults.forEach(id=>{if(!restored.has(id))hidden.add(id);});
  hidden.forEach(id=>{selected.delete(id);consideration.delete(id);});
  selected.forEach(id=>consideration.delete(id));
  const sets={removed:hidden,consideration,selected};
  function row(id){return records.get(id)||{state:'active',version:0};}
  function state(id){return shared?row(id).state:hidden.has(id)?'removed':selected.has(id)?'selected':consideration.has(id)?'consideration':'active';}
  function localMove(id,next){
   Object.values(sets).forEach(set=>set.delete(id));sets[next]?.add(id);
   if(defaults.has(id)){if(next==='removed')restored.delete(id);else restored.add(id);}
   try{for(const [name,set] of Object.entries({hidden,restored,selected,consideration}))localStorage.setItem(key(name),JSON.stringify([...set]));}
   catch(_){persistent=false;}
  }
  function button(text){const b=document.createElement('button');b.type='button';b.textContent=text;return b;}
  const bar=document.createElement('div');bar.className='catalog-removal';bar.setAttribute('role','group');bar.setAttribute('aria-label','Item destinations');
  const destinations=toolbar&&topic.id==='monitored-deals'?{active:'Items',new:'New additions',consideration:labels.consideration,selected:labels.selected,removed:labels.removed}:labels;
  const additions=new Set(topic.newAdditionIds||[]);
  const hasReviews=Object.hasOwn(destinations,'new'), reviewApi='https://monitored-deals-reviews.wren-tools.workers.dev/reviews';
  let reviewed=new Set(),reviewsReady=false,reviewBusy=false;
  const tabs={};for(const [s,label] of Object.entries(destinations)){
   const b=tabs[s]=toolbar?toolbar.link(s,label):button(label);bar.append(b);if(!toolbar)b.onclick=()=>{view=s;refresh();};
  }
  const undo=button('Undo'),retry=button('Refresh shortlist');
  const status=document.createElement('span');status.setAttribute('role','status');
  const note=document.createElement('span');note.className='removal-note';
  const details=document.createElement('div');details.className='shortlist-details';details.append(undo,retry,note,status);
  document.querySelector('.research-sort').after(details,bar);
  if(toolbar&&!toolbar.pane)toolbar.mount(bar,details,config.shortlistEndpoint);
  const review=button('Reviewed'), reviewStatus=document.createElement('span');reviewStatus.setAttribute('role','status');
  if(view==='new'){review.title='Mark the listed additions as reviewed. They stay in Items.';bar.insertBefore(review,bar.querySelector('form'));bar.after(reviewStatus);}
  const cards=Array.from(grid.children,card=>{
   const p=topic.products[Number(card.dataset.productIndex)],group=document.createElement('div');group.className='catalog-actions';
   const buttons=actions.map(([s,cls,icon])=>{const b=button(icon);b.className=cls;
    if(s==='removed')b.innerHTML='<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg>';
    b.onclick=()=>move(p,state(p.id)===s?'active':s);group.append(b);return b;});
   card.querySelector('.card-body').append(group);return {p,card,buttons};
  });
  function refresh(){
   grid.dataset.catalogView=view;grid.dataset.removedView=String(view==='removed');
   const counts={active:0,consideration:0,selected:0,removed:0,new:0};
   for(const {p,card,buttons} of cards){const current=state(p.id);counts[current]++;
    const recent=current==='active'&&additions.has(p.id)&&!reviewed.has(p.id);if(recent)counts.new++;
    card.dataset.catalogState=view==='new'&&recent?'new':current;card.dataset.removed=String(current==='removed');
    buttons.forEach((b,i)=>{const [s,,,verb]=actions[i],on=current===s;
     b.title=on?`Restore ${p.name} to Items`:`${verb} ${p.name}`;b.setAttribute('aria-label',b.title);
     b.setAttribute('aria-pressed',String(on));b.disabled=busy||!ready;});
   }
   for(const [s,b] of Object.entries(tabs)){b.textContent=destinations[s]+(s==='active'?'':` (${counts[s]})`);if(!toolbar)b.setAttribute('aria-pressed',String(s===view));}
   undo.hidden=!last;retry.hidden=!shared;retry.disabled=busy;
   note.textContent=shared?'Shared shortlist · Anyone with the link can edit.':persistent?'Saved in this browser only.':'Storage unavailable — changes last until reload only.';
   apply();toolbar?.report?.(tabs,records,new Set(cards.map(c=>c.p.id)),ready);if(toolbar && ready && !busy)toolbar.ready();
   if(hasReviews&&!reviewsReady)tabs.new.textContent='New additions (—)';
   if(view==='new'&&ready&&reviewsReady&&!counts.new)reviewStatus.textContent='No unreviewed additions.';
   updateReview();
  }
  function listed(){return cards.filter(({p,card})=>!card.hidden&&card.dataset.catalogState==='new'&&!reviewed.has(p.id)).map(({p})=>p.id)}
  function updateReview(){if(view!=='new')return;review.disabled=busy||!ready||!reviewsReady||reviewBusy||!listed().length;}
  if(view==='new')new MutationObserver(updateReview).observe(grid,{subtree:true,attributes:true,attributeFilter:['hidden']});
  async function reviewRequest(ids){
   if(!hasReviews||reviewBusy)return;reviewBusy=true;updateReview();
   try{const r=await fetch(reviewApi,{credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(18000),...(ids?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})}:{})});
    if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data.ids))throw Error();reviewed=new Set(data.ids);reviewsReady=true;
    reviewStatus.textContent=ids?`${ids.length} reviewed. Kept in Items.`:'';
   }catch{reviewsReady=false;reviewStatus.textContent='Review status unavailable. Refresh shortlist to retry.';}
   finally{reviewBusy=false;refresh();}
  }
  review.onclick=()=>{if(!review.disabled){const ids=listed();if(ids.length)reviewRequest(ids)}};
  const request=options=>fetch(config.shortlistEndpoint,{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000),...options});
  async function read(){const res=await request();if(!res.ok)throw Error();const {items}=await res.json();
   if(!items||typeof items!=='object'||Array.isArray(items)||!Object.values(items).every(r=>valid(decode(r))))throw Error();records=new Map(Object.entries(items).map(([id,r])=>[id,decode(r)]));ready=true;
  }
  async function sync(){if(busy)return;busy=true;refresh();try{await Promise.all([read(),reviewRequest()]);status.textContent='Shared shortlist refreshed.';}
   catch(_){ready=false;status.textContent='Shortlist unavailable. Refresh before editing.';}finally{busy=false;refresh();}}
  async function move(p,next,undoing=false){
   if(!ready||busy||document.body.classList.contains('catalog-dragging'))return;
   const before=state(p.id);
   if(shared){busy=true;refresh();try{
    const version=row(p.id).version,res=await request({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,state:next==='consideration'?'considering':next,version})});
    if(res.status===409){await read();status.textContent=`Another editor changed the shortlist. Current destination: ${labels[state(p.id)]}. Review before editing.`;return;}
    if(!res.ok)throw Error();const saved=decode(await res.json());if(!valid(saved)||saved.state!==next||saved.version<=version)throw Error();records.set(p.id,saved);last=undoing?null:{p,before,version:saved.version};
   }catch(_){ready=false;status.textContent='Save not confirmed. Refresh before editing.';return;}finally{busy=false;refresh();}}
   else {localMove(p.id,next);last=undoing?null:{p,before};}
   refresh();status.textContent=`${p.name} moved to ${labels[next]}.`;tabs[view].focus({preventScroll:true});
  }
  undo.onclick=()=>{if(last&&shared&&row(last.p.id).version!==last.version){last=null;refresh();status.textContent='Undo unavailable: the item changed.';}else if(last)move(last.p,last.before,true);};retry.onclick=sync;document.addEventListener('shared-pick-saved',sync);
  refresh();if(shared){sync();document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});}
  if(!shared && topic.id==='harrison-clothes-contenders'){
   const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='Export selections';exportButton.title='Download this browser’s full order and removed selections. Nothing is uploaded.';
   exportButton.addEventListener('click',()=>{
    const order=CatalogOrder.snapshot(grid);
    const payload={schemaVersion:1,topicId:topic.id,...order,
     orderScope:order.hasManualOrder?'Full saved manual order, including removed and filtered items':'Full current sort order; no manual order saved',
     effectiveRemovedProductIds:order.fullOrderProductIds.filter(id=>hidden.has(id)),
     selectedProductIds:order.fullOrderProductIds.filter(id=>selected.has(id)),considerationProductIds:order.fullOrderProductIds.filter(id=>consideration.has(id)),catalogView:view,
     defaultHiddenProductIds:[...defaults],explicitlyRestoredDefaultProductIds:[...defaults].filter(id=>restored.has(id)),
     view:{sort:document.querySelector('.research-sort [aria-pressed="true"]')?.dataset.sort||null,search:document.querySelector('input[type=search]').value,category:document.querySelector('.catalog-categories [aria-pressed="true"]')?.dataset.categoryFilter||'All',removedView:view==='removed',visibleProductIds:[...grid.children].filter(card=>!card.hidden&&card.dataset.productId).map(card=>card.dataset.productId)},
     storageAvailable:persistent};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=topic.id+'-selections.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Selections exported. Attach the JSON file in chat; nothing was uploaded.';
   });
   details.insertBefore(exportButton,status);
  }
 }
 return {attach};
})();

/* Browser-local visibility only; full records and ordering nodes remain intact. */
var CatalogRemoval = (() => {
 'use strict';
 function attach(topic, apply) {
  const grid=document.querySelector('.display-template');
  const key='research-catalog-hidden:v1:'+topic.id;
  const ids=new Set(topic.products.map(p=>p.id));let hidden=new Set(),restored=new Set(),last=null,persistent=true,removed=false;
  const defaults=new Set((topic.defaultHiddenProductIds||[]).filter(id=>ids.has(id)));
  const restoreKey='research-catalog-restored:v1:'+topic.id;
  try {const saved=JSON.parse(localStorage.getItem(key));if(Array.isArray(saved))hidden=new Set(saved);const overrides=JSON.parse(localStorage.getItem(restoreKey));if(Array.isArray(overrides))restored=new Set(overrides);const probe=key+':probe';localStorage.setItem(probe,'1');localStorage.removeItem(probe);}catch(_){persistent=false;}
  defaults.forEach(id=>{if(!restored.has(id))hidden.add(id);});
  const selectedKey='research-catalog-selected:v1:'+topic.id;
  let selected=new Set(),view='active';
  try {const saved=JSON.parse(localStorage.getItem(selectedKey));if(Array.isArray(saved))selected=new Set(saved);}catch(_){persistent=false;}
  // Legacy removals always win; never silently restore an existing removal.
  hidden.forEach(id=>selected.delete(id));
  const bar=document.createElement('div');bar.className='catalog-removal';
  const toggle=document.createElement('button');toggle.type='button';toggle.setAttribute('aria-pressed','false');
  const undo=document.createElement('button');undo.type='button';undo.textContent='Undo';undo.hidden=true;
  const status=document.createElement('span');status.setAttribute('role','status');
  const note=document.createElement('span');note.className='removal-note';
  const items=document.createElement('button');items.type='button';items.textContent='Items';
  const selectedTab=document.createElement('button');selectedTab.type='button';
  bar.append(items,selectedTab,toggle,undo,status,note);document.querySelector('.research-sort').after(bar);
  const count=set=>[...set].filter(id=>ids.has(id)).length;
  function refresh(){
   removed=view==='removed';grid.dataset.removedView=String(removed);grid.dataset.catalogView=view;
   items.setAttribute('aria-pressed',String(view==='active'));
   selectedTab.textContent=`Selected (${count(selected)})`;selectedTab.setAttribute('aria-pressed',String(view==='selected'));
   toggle.textContent=`Removed (${count(hidden)})`;toggle.setAttribute('aria-pressed',String(removed));undo.hidden=!last;
   note.textContent=persistent?'Saved in this browser only.':'Storage unavailable — changes last until reload only.';
   [...grid.children].forEach(card=>{const p=topic.products[Number(card.dataset.productIndex)];
    card.dataset.removed=String(hidden.has(p.id));card.dataset.catalogState=hidden.has(p.id)?'removed':selected.has(p.id)?'selected':'active';
    const b=card.querySelector('.remove-item'),select=card.querySelector('.select-item');
    b.textContent=hidden.has(p.id)?'Restore':'Remove';select.textContent=selected.has(p.id)?'Unselect':'Select';
    [b,select].forEach(button=>button.setAttribute('aria-label',`${button.textContent} ${p.name}`));
   });apply();
  }
  function save(){try{localStorage.setItem(key,JSON.stringify([...hidden]));localStorage.setItem(restoreKey,JSON.stringify([...restored]));localStorage.setItem(selectedKey,JSON.stringify([...selected]));}catch(_){persistent=false;}}
  function move(p,next){
   if(document.body.classList.contains('catalog-dragging'))return;
   last={id:p.id,wasHidden:hidden.has(p.id),wasRestored:restored.has(p.id),wasSelected:selected.has(p.id)};
   hidden.delete(p.id);selected.delete(p.id);
   if(next==='removed'){hidden.add(p.id);restored.delete(p.id);}
   else {if(defaults.has(p.id))restored.add(p.id);if(next==='selected')selected.add(p.id);}
   save();refresh();status.textContent=next==='removed'?'Item removed.':next==='selected'?'Item selected.':'Item restored to items.';undo.focus({preventScroll:true});
  }
  topic.products.forEach((p,i)=>{const card=grid.querySelector(`[data-product-index="${i}"]`);
   const actions=document.createElement('div');actions.className='catalog-actions';
   const b=document.createElement('button');b.type='button';b.className='remove-item';
   const select=document.createElement('button');select.type='button';select.className='select-item';
   actions.append(b,select);card.querySelector('.card-body').append(actions);
   b.addEventListener('click',()=>move(p,hidden.has(p.id)?'active':'removed'));
   select.addEventListener('click',()=>move(p,selected.has(p.id)?'active':'selected'));
  });
  items.addEventListener('click',()=>{view='active';refresh();});
  selectedTab.addEventListener('click',()=>{view='selected';refresh();});
  toggle.addEventListener('click',()=>{view='removed';refresh();});
  undo.addEventListener('click',()=>{if(!last)return;for(const [set,value] of [[hidden,last.wasHidden],[restored,last.wasRestored],[selected,last.wasSelected]]){if(value)set.add(last.id);else set.delete(last.id);}last=null;save();refresh();status.textContent='Change undone.';items.focus({preventScroll:true});});
  refresh();
  if(topic.id==='harrison-clothes-contenders'){
   const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='Export selections';exportButton.title='Download this browser’s full order and removed selections. Nothing is uploaded.';
   exportButton.addEventListener('click',()=>{
    const order=CatalogOrder.snapshot(grid);
    const payload={schemaVersion:1,topicId:topic.id,...order,
     orderScope:order.hasManualOrder?'Full saved manual order, including removed and filtered items':'Full current sort order; no manual order saved',
     effectiveRemovedProductIds:order.fullOrderProductIds.filter(id=>hidden.has(id)),
     selectedProductIds:order.fullOrderProductIds.filter(id=>selected.has(id)),catalogView:view,
     defaultHiddenProductIds:[...defaults],explicitlyRestoredDefaultProductIds:[...defaults].filter(id=>restored.has(id)),
     view:{sort:document.querySelector('.research-sort [aria-pressed="true"]')?.dataset.sort||null,search:document.querySelector('input[type=search]').value,category:document.querySelector('.catalog-categories [aria-pressed="true"]')?.dataset.categoryFilter||'All',removedView:removed,visibleProductIds:[...grid.children].filter(card=>!card.hidden&&card.dataset.productId).map(card=>card.dataset.productId)},
     storageAvailable:persistent};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=topic.id+'-selections.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Selections exported. Attach the JSON file in chat; nothing was uploaded.';
   });
   bar.insertBefore(exportButton,status);
  }
 }
 return {attach};
})();

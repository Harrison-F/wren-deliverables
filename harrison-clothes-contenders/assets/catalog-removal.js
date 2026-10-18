/* Browser-local visibility only; full records and ordering nodes remain intact. */
var CatalogRemoval = (() => {
 'use strict';
 function attach(topic, apply) {
  const grid=document.querySelector('.display-template');
  const key='research-catalog-hidden:v1:'+topic.id;
  const ids=new Set(topic.products.map(p=>p.id));let hidden=new Set(),last=null,persistent=true,removed=false;
  try {const saved=JSON.parse(localStorage.getItem(key));if(Array.isArray(saved))hidden=new Set(saved.filter(id=>ids.has(id)));const probe=key+':probe';localStorage.setItem(probe,'1');localStorage.removeItem(probe);}catch(_){persistent=false;}
  const bar=document.createElement('div');bar.className='catalog-removal';
  const toggle=document.createElement('button');toggle.type='button';toggle.setAttribute('aria-pressed','false');
  const undo=document.createElement('button');undo.type='button';undo.textContent='Undo';undo.hidden=true;
  const status=document.createElement('span');status.setAttribute('role','status');
  const note=document.createElement('span');note.className='removal-note';
  bar.append(toggle,undo,status,note);document.querySelector('.research-sort').after(bar);
  function refresh(){grid.dataset.removedView=String(removed);toggle.textContent=removed?'Back to items':`Removed (${hidden.size})`;toggle.setAttribute('aria-pressed',String(removed));undo.hidden=!last;note.textContent=persistent?'Saved in this browser only.':'Storage unavailable — changes last until reload only.';
   [...grid.children].forEach(card=>{const id=topic.products[Number(card.dataset.productIndex)].id;card.dataset.removed=String(hidden.has(id));const b=card.querySelector('.remove-item');b.textContent=hidden.has(id)?'Restore':'Remove';b.setAttribute('aria-label',`${b.textContent} ${topic.products[Number(card.dataset.productIndex)].name}`);});apply();}
  function save(){try{localStorage.setItem(key,JSON.stringify([...hidden]));}catch(_){persistent=false;}}
  topic.products.forEach((p,i)=>{const card=grid.querySelector(`[data-product-index="${i}"]`);const b=document.createElement('button');b.type='button';b.className='remove-item';card.querySelector('.card-body').append(b);
   b.addEventListener('click',()=>{if(document.body.classList.contains('catalog-dragging'))return;const restoring=hidden.has(p.id);if(restoring)hidden.delete(p.id);else hidden.add(p.id);last={id:p.id,wasHidden:restoring};save();refresh();status.textContent=restoring?'Item restored.':'Item removed.';undo.focus({preventScroll:true});});});
  toggle.addEventListener('click',()=>{removed=!removed;refresh();});
  undo.addEventListener('click',()=>{if(!last)return;if(last.wasHidden)hidden.add(last.id);else hidden.delete(last.id);last=null;save();refresh();status.textContent='Change undone.';toggle.focus({preventScroll:true});});
  refresh();
 }
 return {attach};
})();

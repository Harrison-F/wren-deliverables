'use strict';
(() => {
 const $=s=>document.querySelector(s), grid=$('.display-template'), cards=[...grid.children], id=c=>c.dataset.productId;
 const key='wren.product-display.v1:'+document.documentElement.dataset.galleryId;
 let state={sort:'price',order:[],removed:[]}, removedView=false;
 try { Object.assign(state,JSON.parse(localStorage.getItem(key)||'{}')); } catch {}
 const save=()=>localStorage.setItem(key,JSON.stringify(state));
 const ordered=()=>{const ranks=new Map(state.order.map((v,i)=>[v,i]));return [...cards].sort((a,b)=>state.sort==='manual'?(ranks.get(id(a))??Infinity)-(ranks.get(id(b))??Infinity):state.sort==='name'?a.querySelector('h2').textContent.localeCompare(b.querySelector('h2').textContent):(state.sort==='high'?-1:1)*(a.dataset.price-b.dataset.price));};
 function render(){const query=$('input[type=search]').value.trim().toLowerCase();let count=0;
  for(const c of ordered()){const removed=state.removed.includes(id(c));c.hidden=removed!==removedView||!c.textContent.toLowerCase().includes(query);if(!c.hidden)count++;grid.append(c);const btn=c.querySelector('.remove-item'),label=(removed?'Restore ':'Remove ')+c.querySelector('h2').textContent;btn.setAttribute('aria-label',label);btn.title=label;if(removed){btn.textContent='↶';}else {btn.innerHTML=trash;}}
  $('#catalog-count').textContent=`${count} items`;$('#removed').textContent=`Removed (${state.removed.length})`;$('#undo').hidden=!state.removed.length;$('#items').setAttribute('aria-pressed',!removedView);$('#removed').setAttribute('aria-pressed',removedView);document.querySelectorAll('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sort===state.sort));
 }
 const trash=cards[0]?.querySelector('.remove-item').innerHTML||'';
 function manual(){state.order=[...grid.children].map(id);state.sort='manual';save();render();}
 new Sortable(grid,{handle:'.reorder-handle',animation:120,onEnd:manual});
 grid.addEventListener('keydown',e=>{if(!e.target.matches('.reorder-handle')||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const c=e.target.closest('article'), visible=[...grid.children].filter(el=>!el.hidden), next=visible[visible.indexOf(c)+(e.key==='ArrowUp'?-1:1)];if(next){if(e.key==='ArrowUp')next.before(c);else next.after(c);manual();e.target.focus();}});
 $('.research-sort').onclick=e=>{if(e.target.dataset.sort)state.sort=e.target.dataset.sort;else if(e.target.id==='reset'){state.sort='price';state.order=[];}else return;save();render();};
 $('#items').onclick=()=>{removedView=false;render();};$('#removed').onclick=()=>{removedView=true;render();};$('#undo').onclick=()=>{state.removed.pop();save();render();};$('input[type=search]').oninput=render;

 // Cache exact reviewed URLs, never infer a photo's product or color from its bytes.
 // A failed load/decode resolves instead of rejecting, so controls never strand the UI.
 const imageCache=new Map();
 function warm(src){
  if(imageCache.has(src))return imageCache.get(src).promise;
  const image=new Image(), entry={image,ready:false,ok:false,promise:null};image.decoding='async';
  entry.promise=new Promise(resolve=>{let settled=false;const done=ok=>{if(settled)return;settled=true;entry.ready=true;entry.ok=ok;resolve(entry);};
   image.onload=async()=>{if(image.decode){try{await image.decode();}catch{/* The URL remains usable after a decode failure. */}}done(true);};image.onerror=()=>done(false);
  });
  imageCache.set(src,entry);image.src=src;return entry.promise;
 }
 const gallery=c=>JSON.parse(c.dataset.images);
 const index=c=>Number(c.dataset.slide)||0;
 function warmAround(c){const arr=gallery(c);if(arr.length<2)return;const i=index(c);warm(arr[i].src);warm(arr[(i+1)%arr.length].src);warm(arr[(i-1+arr.length)%arr.length].src);}
 grid.addEventListener('pointerover',e=>{const c=e.target.closest('article');if(c)warmAround(c);},{passive:true});
 grid.addEventListener('focusin',e=>{const c=e.target.closest('article');if(c)warmAround(c);});
 function paint(c,i){const arr=gallery(c),img=c.querySelector('.portrait');c.dataset.slide=i;
  // Reuse the exact URL handed to the preloader, so no new request or blank loading seam.
  img.src=arr[i].src;img.alt=arr[i].alt;c.querySelector('.gallery-count').textContent=`${i+1} / ${arr.length}`;
  if($('dialog').open&&$('dialog').dataset.productId===id(c))paintExpanded(c,i);
 }
 async function step(c,delta){const arr=gallery(c);if(arr.length<2)return;const i=(index(c)+delta+arr.length)%arr.length;
  const request=c.dataset.slideRequest=String((Number(c.dataset.slideRequest)||0)+1);const target=arr[i].src;
  const cached=imageCache.get(target);if(cached?.ready&&cached.ok){paint(c,i);warmAround(c);return;}
  if(cached?.ready)imageCache.delete(target);
  // Keep the current decoded image visible while the adjacent photo decodes.
  const loaded=await warm(target);if(c.dataset.slideRequest!==request)return;
  if(!loaded.ok){if(imageCache.get(target)===loaded)imageCache.delete(target);return;}
  paint(c,i);
  // Warm both new neighbors as well as the expanded version's exact object.
  warmAround(c);
 }
 let touch;grid.addEventListener('touchstart',e=>{touch=e.touches[0];},{passive:true});grid.addEventListener('touchend',e=>{if(!touch||!e.target.closest('.photo-stage'))return;const dx=e.changedTouches[0].clientX-touch.clientX,dy=e.changedTouches[0].clientY-touch.clientY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){step(e.target.closest('article'),dx<0?1:-1);if(e.cancelable)e.preventDefault();}touch=null;},{passive:false});
 const dialog=$('dialog'), big=dialog.querySelector('img');
 function paintExpanded(c,i){const arr=gallery(c),photo=arr[i];big.src=photo.src;big.alt=photo.alt;$('#image-title').textContent=c.querySelector('h2').textContent;
  const count=$('#expanded-count');if(count)count.textContent=arr.length>1?`${i+1} / ${arr.length}`:'1 photo';
  dialog.querySelectorAll('[data-dialog-step]').forEach(b=>b.hidden=arr.length<2);warm(photo.src);
  const full=photo.fullSrc||photo.src;
  if(full!==photo.src){
   const request=dialog.dataset.fullRequest=String((Number(dialog.dataset.fullRequest)||0)+1);
   // The decoded small view stays visible; swap to its same-source original only after decode.
   warm(full).then(entry=>{if(!entry.ok){if(imageCache.get(full)===entry)imageCache.delete(full);return;}if(dialog.open&&dialog.dataset.fullRequest===request&&dialog.dataset.productId===id(c)&&index(c)===i)big.src=full;});
  }
 }
 async function openExpanded(c){await warm(gallery(c)[index(c)].src);dialog.dataset.productId=id(c);paintExpanded(c,index(c));dialog.showModal();}
 grid.onclick=e=>{const b=e.target.closest('button'),c=e.target.closest('article');if(!b||!c)return;if(b.matches('.remove-item')){if(removedView)state.removed=state.removed.filter(v=>v!==id(c));else state.removed.push(id(c));save();render();}else if(b.dataset.step)step(c,Number(b.dataset.step));else if(b.matches('.gallery-expand'))openExpanded(c);};
 dialog.querySelector('.icon-button').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{const b=e.target.closest('[data-dialog-step]');if(!b)return;const c=cards.find(c=>id(c)===dialog.dataset.productId);if(c)step(c,Number(b.dataset.dialogStep));});
 dialog.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const c=cards.find(c=>id(c)===dialog.dataset.productId);if(c&&gallery(c).length>1){e.preventDefault();step(c,e.key==='ArrowRight'?1:-1);}});
 let preloadStarted=false;
 function preloadAll(){if(preloadStarted)return;preloadStarted=true;
  // Idle queue: initial layout and visible cards win; every reviewed inline URL is then decoded once.
  const urls=[];for(const c of cards)for(const photo of gallery(c))if(!imageCache.has(photo.src))urls.push(photo.src);
  const unique=[...new Set(urls)];let next=0;const worker=()=>{if(next>=unique.length)return;return warm(unique[next++]).finally(worker);};
  const start=()=>Array.from({length:Math.min(4,unique.length)},worker);
  if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:1200});else setTimeout(start,0);
 }
 render();
 // Paint current view first, then prewarm after the first frame/load event.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(document.readyState==='complete')preloadAll();else window.addEventListener('load',preloadAll,{once:true});setTimeout(preloadAll,1500);}));
})();

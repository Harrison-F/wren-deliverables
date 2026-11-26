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
 function step(c,delta){const arr=JSON.parse(c.dataset.images),i=((Number(c.dataset.slide)||0)+delta+arr.length)%arr.length;if(arr.length<2)return;c.dataset.slide=i;const img=c.querySelector('img');img.src=arr[i].src;img.alt=arr[i].alt;c.querySelector('.gallery-count').textContent=`${i+1} / ${arr.length}`;}
 let touch;grid.addEventListener('touchstart',e=>{touch=e.touches[0];},{passive:true});grid.addEventListener('touchend',e=>{if(!touch||!e.target.closest('.photo-stage'))return;const dx=e.changedTouches[0].clientX-touch.clientX,dy=e.changedTouches[0].clientY-touch.clientY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){step(e.target.closest('article'),dx<0?1:-1);if(e.cancelable)e.preventDefault();}touch=null;},{passive:false});
 grid.onclick=e=>{const b=e.target.closest('button'),c=e.target.closest('article');if(!b||!c)return;if(b.matches('.remove-item')){if(removedView)state.removed=state.removed.filter(v=>v!==id(c));else state.removed.push(id(c));save();render();}else if(b.dataset.step)step(c,Number(b.dataset.step));else if(b.matches('.gallery-expand')){const img=c.querySelector('img'),big=$('dialog img');big.src=img.src;big.alt=img.alt;$('#image-title').textContent=c.querySelector('h2').textContent;$('dialog').showModal();}};
 $('dialog button').onclick=()=>$('dialog').close();render();
})();

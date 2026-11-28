const $=id=>document.getElementById(id), links=[...document.querySelectorAll('nav a[data-view]')];
const purchaseBase=new URL('../../purchased-clothing/',location.href), dialog=document.querySelector('dialog');
let items, pending, category='All', active='',ticket=0;
const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e};
// The producer verifies availability and exact product identity. Never infer either from receipt URLs.
// Match purchased_listings.py RULES, including only its two permitted variant query formats.
const listingRules=new Map([
 ["Abercrombie & Fitch", /^https:\/\/www\.abercrombie\.com\/shop\/us\/p\/[a-z0-9-]+-\d+\?seq=\d{2}$/],
 ["Amazon", /^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}$/],
 ["SCRT®", /^https:\/\/scrt\.onl\/products\/[a-z0-9-]+$/],
 ["COS Customer Service", /^https:\/\/www\.cos\.com\/en-us\/men\/(?:[a-z-]+\/){1,6}product\/[a-z0-9-]+-\d{10}$/],
 ["Cottonique - Allergy-free Apparel", /^https:\/\/cottonique\.com\/products\/[a-z0-9-]+\?variant=\d{10,16}$/],
 ["Helmut Lang", /^https:\/\/www\.helmutlang\.com\/[a-z0-9-]+\/[A-Z0-9]+_[A-Z0-9]+\.html$/],
 ["MR PORTER", /^https:\/\/www\.mrporter\.com\/en-us\/mens\/product\/[a-z0-9-]+\/clothing\/[a-z-]+\/[a-z0-9-]+\/\d{15,18}$/],
 ["Massimo Dutti", /^https:\/\/www\.massimodutti\.com\/us\/[a-z0-9-]+-l\d{8}$/],
 ["SANDRO", /^https:\/\/us\.sandro-paris\.com\/en\/p\/[a-z0-9-]+\/[A-Z0-9]+_[A-Z0-9]+\.html$/]
]);
function verifiedListing(i){
 const url=i.listing_url,rule=listingRules.get(i.merchant);
 return i.listing_status==='available' && typeof url==='string' && !/\s/.test(url) && rule?.test(url) ? url : null;
}
function listingNotice(trigger,message){
 const modal=text('dialog','','listing-notice'), note=text('p',message), close=text('button','Close');
 note.id='listing-message';modal.setAttribute('aria-labelledby',note.id);close.type='button';close.autofocus=true;
 modal.append(note,close);document.body.append(modal);close.onclick=()=>modal.close();
 modal.addEventListener('close',()=>{modal.remove();if(trigger.isConnected)trigger.focus()},{once:true});modal.showModal();
}
function purchaseTitle(i,name){
 const heading=text('h2',''),url=verifiedListing(i),control=text(url?'a':'button',name,'receipt-title');
 if(url){control.href=url;control.target='_blank';control.rel='noopener noreferrer'}else{
  control.type='button';control.setAttribute('aria-haspopup','dialog');control.onclick=()=>listingNotice(control,i.listing_status==='unavailable'?'This listing is no longer available.':'No verified listing is available for this item.');
 }
 heading.append(control);return heading;
}
function draw(){const rows=items.filter(i=>category==='All'||i.category===category);
 $('receipt-summary').textContent=`${rows.length} purchased ${rows.length===1?'item':'items'}`;
 $('receipt-grid').replaceChildren(...rows.map(i=>{const card=text('article','','display-card');card.dataset.purchase='';const name=i.item_name||'Unnamed item';
 if(/^assets\/purchased\/[a-zA-Z0-9_-]+\.webp$/.test(i.image_url)){const b=text('button','','receipt-photo');b.type='button';b.setAttribute('aria-label','Enlarge '+name);const img=new Image();img.loading='lazy';img.alt=name;img.src=new URL(i.image_url,purchaseBase);b.append(img);b.onclick=()=>{dialog.querySelector('img').src=img.src;dialog.querySelector('img').alt=name;$('image-title').textContent=name;$('image-caption').textContent=i.merchant||'';dialog.showModal()};card.append(b)}
 const body=text('div','','card-body');body.append(text('small',i.merchant||''),purchaseTitle(i,name));const details=[i.color,i.size&&`Size: ${i.size}`,i.variant,i.quantity&&`Qty: ${i.quantity}`,i.ordered_at].filter(Boolean);if(details.length)body.append(text('p',details.join(' · ')));card.append(body);return card}));}
async function receipt(force=false){if(items&&!force){draw();return}if(!pending){$('receipt-summary').textContent='Loading purchases…';$('receipt-refresh').disabled=true;pending=(async()=>{const r=await fetch(new URL('data/purchased.json',purchaseBase),{credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.items))throw Error();items=d.items.slice().sort((a,b)=>(b.ordered_at||'').localeCompare(a.ordered_at||''));draw()})().catch(()=>{$('receipt-summary').textContent='Purchases unavailable. Refresh to retry.'}).finally(()=>{pending=null;$('receipt-refresh').disabled=false})}await pending}
$('receipt-refresh').onclick=()=>receipt(true);document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(items)draw()});
dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}};
const scrollKey=v=>'universal-picks:scroll:'+(v==='considering'?'consideration':v);
async function route(){const seq=++ticket,link=links.find(a=>a.pathname===location.pathname)||links[1];if(active)sessionStorage.setItem(scrollKey(active),scrollY);active=link.dataset.view;const purchased=active==='purchased';links.forEach(a=>a===link?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));document.title=`${link.firstChild.textContent.trim()} · Universal picks`;document.body.dataset.tab=active;$('shortlist').hidden=purchased;$('purchases').hidden=!purchased;
 if(purchased)await receipt();else{const tpl=$('inspiration');if(tpl)tpl.replaceWith(tpl.content.cloneNode(true));try{const core=await import('./picks.js?v=664bbde8fca1');if(seq!==ticket)return;await core.show(active)}catch{$('summary').textContent='Shortlist unavailable. Reload to retry.'}}
 if(seq===ticket){if(location.hash==='#unnatural-fibers-style-inspiration'&&active==='considering')$('unnatural-fibers-style-inspiration').scrollIntoView();else scrollTo(0,Number(sessionStorage.getItem(scrollKey(active)))||0)}}
links.forEach(a=>a.onclick=e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();if(a.pathname!==location.pathname){history.pushState(null,'',a.href);route()}});history.scrollRestoration='manual';addEventListener('popstate',route);addEventListener('pagehide',()=>sessionStorage.setItem(scrollKey(active),scrollY));route();

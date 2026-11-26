const base=new URL('../../natural-jackets-under-300/',location.href);
const dialog=document.querySelector('dialog');
let sortNaturalProducts;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = value => {const u=new URL(value,location.href); if (!['https:','http:'].includes(u.protocol)) throw Error('Invalid source URL'); return esc(u.href);};
const imageURL = value => {if (!/^assets\/images\/[a-z0-9-]+\.(webp|png|jpg)$/.test(value)) throw Error('Invalid local image'); return esc(value);};
const formatUSD = value => value==null?'Price unknown':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(value);
const productVariants = p => p.variants?.length ? p.variants : [p];
function catalogColor(p){
 const variants=productVariants(p);
 const options=variants.length>1
  ? `<span class="catalog-color-options" role="group" aria-label="Available colors">${variants.map((v,index)=>`<button type="button" class="catalog-color-option" data-color-variant="${esc(v.id)}" aria-label="Show ${esc(v.color)} color" aria-pressed="${index===0}" title="${esc(v.color)}"><span class="color-swatch" data-color-key="${esc(v.colorKey||'not-stated')}" aria-hidden="true"></span></button>`).join('')}</span>`
  : `<span class="catalog-color-single"><span class="color-swatch" data-color-key="${esc(p.colorKey||'not-stated')}" aria-hidden="true"></span></span>`;
 return `<p class="catalog-color" data-field="color">${options}<span><strong>Color</strong> · <span class="catalog-color-name">${esc(p.color||'Not stated')}</span></span></p>`;
}
function originalPrices(p){
 const entries=p.sizeLinks||[], valid=entries.filter(v=>Number.isFinite(v.originalPriceUSD)&&v.originalPriceUSD>p.unitPriceUSD);
 if(!valid.length){const prior=/(?:was|from)\s*\$([\d,.]+)/i.exec(p.deal||'');const n=prior&&Number(prior[1].replaceAll(',',''));return n>p.unitPriceUSD?`<p class="catalog-original-price"><s>${formatUSD(n)}</s> · Sale${/final sale/i.test(p.deal)?' · Final sale':''}</p>`:(p.deal?`<p class="catalog-deal">${esc(p.deal)}</p>`:'');}
 const same=valid.length===entries.length&&new Set(valid.map(v=>v.originalPriceUSD)).size===1;
 const text=same?`<s>${formatUSD(valid[0].originalPriceUSD)}</s>`:valid.map(v=>`${esc(v.size)} <s>${formatUSD(v.originalPriceUSD)}</s>`).join(' · ');
 return `<p class="catalog-original-price" aria-label="Original price">${text}</p>`;
}
function sizeLinks(p){
 const links=p.sizeLinks||[];
 if(!links.length)return esc(p.facts?.Fit||'');
 const labels=[...new Set(links.flatMap(v=>v.size.split(' and ')))];
 return labels.map(size=>{const v=links.find(v=>v.size.split(' and ').includes(size));return `<a href="${safeURL(v.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(size)} — ${esc(p.name)}">${esc(size)}</a>`;}).join(' and ');
}
function catalogMeta(p){
 if(p.clinicalCard) return `<div class="card-head"><div class="identity"><h2><a class="product-title-link" href="${safeURL(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)}</a></h2></div></div><p class="catalog-store">${esc(p.store)}</p><p class="catalog-price">${esc(p.priceLabel)}</p><p class="clinical-status">${esc(p.verdict)}</p><p class="catalog-material">${esc(p.composition)}</p><p class="clinical-caution">${esc(p.summary)}</p>`;
 const item=p.name;
 const store=p.store||p.brand;
 const lining=p.nickelMinimized?'':p.materialCaveat||(p.category==='Jacket'?p.summary:'Trims not fully specified.');
 const nickel=p.nickelMinimized;
 const status=nickel ? ({Yes:'yes',Likely:'likely',No:'no',Unverified:'unknown'}[nickel.assessment]||'no') : '';
 const label=({yes:'Nickel-minimized',likely:'Likely nickel-minimized',no:'Not nickel-minimized',unknown:'Nickel status unverified'})[status];
 const badge=nickel?`<div class="nickel-status"><span class="nickel-pill nickel-${status}">${esc(label)}</span><p class="nickel-reason">${esc(nickel.reason)}</p></div>`:'';
 return `<div class="card-head"><div class="identity"><h2><a class="product-title-link" href="${safeURL(p.url)}" target="_blank" rel="noopener noreferrer">${esc(item)}</a></h2></div></div><p class="catalog-store" data-field="store">${esc(store)}</p><p class="catalog-price" data-field="price">${esc(p.priceLabel || formatUSD(p.unitPriceUSD))}</p>${originalPrices(p)}${badge}<div class="fabric-fit"><span class="catalog-material" data-field="material">${esc((p.facts?.Fabric || 'Material unverified'))}</span><span class="catalog-deal" data-field="deals">${sizeLinks(p)}</span></div>${p.fulfillmentNote?`<p class="catalog-deal">${esc(p.fulfillmentNote)}</p>`:''}`;
}
function openImage(product) {document.querySelector('#image-title').textContent=product.name;dialog.querySelector('img').src=new URL(product.image,base);dialog.querySelector('img').alt=product.imageAlt;document.querySelector('#image-caption').textContent=product.imageNote;dialog.showModal();}
const photos = p => p.images?.length ? p.images : [{src:p.image,alt:p.imageAlt}];
const productURL = (p,topic) => safeURL(p.url || topic.sources.find(s=>s.id===p.sources[0]).url);
function gallery(p,topic) {
 if(p.images && !p.images.length && !p.image) return `<section class="product-gallery" aria-label="${esc(p.name)} image unavailable"><a class="portrait-wrap product-photo-link" href="${productURL(p,topic)}" target="_blank" rel="noopener noreferrer"><span class="catalog-material missing-product-image">Retailer image unavailable<br>Open selected listing →</span></a><div class="gallery-controls"><span class="gallery-count">Gallery unavailable</span></div></section>`;
 const images=photos(p);
 return `<section class="product-gallery" data-gallery="${esc(p.id)}" aria-label="${esc(p.name)} photos" aria-roledescription="carousel"><div class="photo-stage"><a class="portrait-wrap product-photo-link" href="${productURL(p,topic)}" target="_blank" rel="noopener noreferrer" aria-label="Shop ${esc(p.name)}"><img class="portrait" src="${imageURL(images[0].src)}" alt="${esc(images[0].alt)}"></a>${images.length>1?`<button class="gallery-arrow" data-step="-1" aria-label="Previous photo of ${esc(p.name)}">←</button><button class="gallery-arrow" data-step="1" aria-label="Next photo of ${esc(p.name)}">→</button>`:''}</div><div class="gallery-controls">${images.length>1?`<span class="gallery-count" aria-live="polite">1 / ${images.length}</span>`:'<span class="gallery-count">1 photo</span>'}<button class="gallery-expand" data-image="${esc(p.id)}" aria-label="Expand ${esc(p.name)} image">Expand</button></div></section>`;
}
function attachGalleries(topic,root) {
 root.querySelectorAll('[data-gallery]').forEach(el=>{
  const p=topic.products.find(p=>p.id===el.dataset.gallery);let variant=productVariants(p)[0],images=photos(variant),index=0,start=null,suppressClick=false;
  const card=el.closest('.display-card');
  function renderImage(){const im=el.querySelector('img');im.src=new URL(images[index].src,base);im.alt=images[index].alt;const count=el.querySelector('.gallery-count');count.textContent=images.length>1?`${index+1} / ${images.length}`:'1 photo';}
  function move(step){index=(index+step+images.length)%images.length;renderImage();}
  function showVariant(id){
   variant=productVariants(p).find(v=>v.id===id)||productVariants(p)[0];images=photos(variant);index=0;renderImage();
   card.querySelectorAll('.product-title-link,.product-photo-link').forEach(link=>link.href=safeURL(variant.url));
   card.querySelector('.catalog-price').textContent=formatUSD(variant.unitPriceUSD);
   card.querySelector('.catalog-color-name').textContent=variant.color||'Not stated';
   const lining=variant.materialCaveat||(variant.category==='Jacket'?variant.summary:'Trims not fully specified.');
   card.querySelector('.catalog-material').textContent=variant.facts.Fabric+(lining?` · ${lining}`:'');
   const deal=card.querySelector('.catalog-deal');if(deal)deal.textContent=variant.deal||'';
   card.querySelectorAll('[data-color-variant]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.colorVariant===variant.id)));
  }
  card.querySelectorAll('[data-color-variant]').forEach(button=>button.addEventListener('click',()=>showVariant(button.dataset.colorVariant)));
  el.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.step))));
  el.addEventListener('keydown',e=>{if(images.length>1&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
  const link=el.querySelector('.product-photo-link');
  link.addEventListener('touchstart',e=>{start={x:e.touches[0].clientX,y:e.touches[0].clientY};suppressClick=false;},{passive:true});
  link.addEventListener('touchend',e=>{if(!start||images.length<2)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){if(e.cancelable)e.preventDefault();suppressClick=true;move(dx<0?1:-1);}start=null;},{passive:false});
  link.addEventListener('click',e=>{if(suppressClick){e.preventDefault();suppressClick=false;}});
  el.querySelector('[data-image]').addEventListener('click',()=>openImage({...variant,image:images[index].src,imageAlt:images[index].alt}));
 });
}
const prepare = topic => topic;
export let price=p=>p.unitPriceUSD ?? Infinity;
export {prepare};
export function card(product,topic){
 const el=document.createElement('article');el.className='display-card';
 el.innerHTML=gallery(product,topic)+'<div class="card-body">'+catalogMeta(product)+'</div>';
 const img=el.querySelector('img');if(img)img.src=new URL(img.getAttribute('src'),base);
 attachGalleries(topic,el);return el;
}

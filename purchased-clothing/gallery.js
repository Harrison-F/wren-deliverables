'use strict';
const gallery = document.querySelector('#gallery');
let records = [], orderCount = 0, candidates = [], view = 'purchased', candidateError = '';
const purchaseFooter = document.querySelector('footer').textContent;
let purchaseChecked = '';
function productLink(url, label) {
  const a=element('a','product-link',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function considerationCard(i) {
  const card=element('article','purchase consideration');
  const photo=productLink(i.product_url);photo.classList.add('product-photo');photo.setAttribute('aria-label',i.item_name+' — retailer product page');
  const img=element('img');img.alt=i.item_name;img.width=760;img.height=760;
  const images=(i.images||[]).filter(p=>/^assets\/consideration\/[a-f0-9]+\.webp$/.test(p));
  let index=0;
  // Resolve from the data request's site root in both private and public exports.
  const imageBase=new URL(considerationDataURL,location.href);
  function show(){img.src=new URL('../'+images[index],imageBase).href;counter.textContent=`${index+1} / ${images.length}`;}
  const counter=element('span','image-count');counter.setAttribute('aria-live','polite');
  if(images.length){show();photo.append(img);}else photo.append(element('p','missing-photo','Product image unavailable'));
  card.append(photo);
  if(images.length>1){
    const controls=element('div','gallery-controls');
    for(const [step,label,text] of [[-1,'Previous product image','←'],[1,'Next product image','→']]){
      const button=element('button','',text);button.type='button';button.setAttribute('aria-label',label);
      button.addEventListener('click',()=>{index=(index+step+images.length)%images.length;show();});controls.append(button);
    }
    controls.insertBefore(counter,controls.lastChild);card.append(controls);
  }
  const title=element('h2');title.append(productLink(i.product_url,i.item_name));
  card.append(element('p','merchant',i.merchant),title,element('p','variant',`${i.color} · ${i.size||'Size not selected'}`));
  card.append(element('p','variant',i.material),element('p','variant',i.fit));
  const details=element('details','receipt-details');details.append(element('summary','','Product details'));
  details.append(element('p','','In consideration — not purchased.'),element('p','',i.gallery_basis));
  card.append(details);return card;
}
function selectView(next) {
  view=next;
  for(const b of document.querySelectorAll('[data-view]')){const active=b.dataset.view===view;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
  for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b.dataset.filter==='All'));
  gallery.setAttribute('aria-labelledby','tab-'+view);
  document.querySelector('h1').textContent=view==='purchased'?'Purchased':'In consideration';
  document.querySelector('footer').textContent=view==='purchased'?purchaseFooter:'Saved for consideration, not purchased. Materials are from the retailer; size is not selected unless specified.';
  document.querySelector('#refreshed').textContent=view==='purchased'?purchaseChecked:'';
  render();
}
for(const button of document.querySelectorAll('[data-view]')){
  button.addEventListener('click',()=>selectView(button.dataset.view));
  button.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const next=event.key==='Home'?'purchased':event.key==='End'?'consideration':view==='purchased'?'consideration':'purchased';
    selectView(next);document.querySelector(`[data-view="${next}"]`).focus();
  });
}
const considerationDataURL='data/consideration.json';
(async()=>{try{
  const response=await fetch('data/consideration.json',{cache:'no-store'});
  if(!response.ok)throw new Error('Could not load items in consideration.');
  const data=await response.json();if(!Array.isArray(data.items))throw new Error('Consideration data unavailable.');
  candidates=data.items;
}catch(error){candidateError=error.message;}
if(view==='consideration')render();})();
function element(tag, cls, text) { const el=document.createElement(tag); if(cls)el.className=cls; if(text!==undefined)el.textContent=text; return el; }
function date(value) { if(!value)return 'Date unknown'; const d=new Date(value+'T12:00:00'); return Number.isNaN(+d)?'Date unknown':d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function render(filter='All') {
  gallery.replaceChildren();
  const notice=document.querySelector('#notice');notice.hidden=true;
  if(view==='consideration'){
    const shown=candidates.filter(i=>filter==='All'||i.category===filter);
    document.querySelector('#count').textContent=`${shown.length} ${shown.length===1?'item':'items'} in consideration`;
    for(const i of shown)gallery.append(considerationCard(i));
    if(candidateError||!shown.length){notice.hidden=false;notice.textContent=candidateError||'No items in this category yet.';}
    return;
  }
  const shown=records.filter(i=>filter==='All'||i.category===filter);
  document.querySelector('#count').textContent=filter==='All'?`${shown.length} line items · ${orderCount} orders`:`${shown.length} ${filter.toLowerCase()} line items`;
  for(const i of shown){
    const card=element('article','purchase');
    const photo=element('div','product-photo');
    if(i.image_url && /^assets\/purchased\/[a-f0-9]+\.webp$/.test(i.image_url)){
      const img=element('img');img.src=i.image_url;img.alt=i.item_name;img.width=760;img.height=760;
      img.addEventListener('error',()=>photo.replaceChildren(element('p','missing-photo','Receipt image unavailable')),{once:true});photo.append(img);
    }else photo.append(element('p','missing-photo','Receipt image unavailable'));
    card.append(photo,element('p','merchant',i.merchant||'Merchant unknown'),element('h2','',i.item_name));
    const variant=i.variant||[i.color,i.size?`Size ${i.size}`:null].filter(Boolean).join(' · ')||'Variant not specified';
    card.append(element('p','variant',variant));
    const price=element('div','price-row');price.append(element('span','quantity',i.quantity===null?'Qty unknown':`Qty ${i.quantity}`));card.append(price,element('p','purchased-date',date(i.ordered_at)));
    const details=element('details','receipt-details');details.append(element('summary','', 'Receipt details'));
    for(const [label,value] of [['Date',i.date_basis],['Source','Authenticated forwarded order confirmation'],['Image','Exact image paired with this receipt line']]){
      const p=element('p');p.append(element('strong','',label+': '),document.createTextNode(value||'Unknown'));details.append(p);
    }
    for(const note of i.notes||[])details.append(element('p','',note));
    if(i.quantity===null)details.append(element('p','','The confirmation does not state quantity for this line.'));
    card.append(details);gallery.append(card);
  }
}
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{
  for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b===button));render(button.dataset.filter);
});
(async()=>{try{
  const response=await fetch('data/purchased.json',{cache:'no-store'});
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('Could not load purchases. Please try again later.');
  const data=await response.json();if(!Array.isArray(data.items))throw new Error('Purchase data unavailable.');
  records=data.items;orderCount=data.order_count;render();
  purchaseChecked=data.generated_at?'Checked '+new Date(data.generated_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';
  if(view==='purchased')document.querySelector('#refreshed').textContent=purchaseChecked;
  if(!records.length && view==='purchased'){const n=document.querySelector('#notice');n.hidden=false;n.textContent='No clothing or accessory confirmations found yet.';}
}catch(error){document.querySelector('#count').textContent='Unable to load';const n=document.querySelector('#notice');n.hidden=false;n.textContent=error.message;}})();

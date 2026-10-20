'use strict';
const gallery = document.querySelector('#gallery');
let records = [], orderCount = 0;
function element(tag, cls, text) { const el=document.createElement(tag); if(cls)el.className=cls; if(text!==undefined)el.textContent=text; return el; }
function date(value) { if(!value)return 'Date unknown'; const d=new Date(value+'T12:00:00'); return Number.isNaN(+d)?'Date unknown':d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function render(filter='All') {
  gallery.replaceChildren();
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
    const price=element('div','price-row');price.append(element('span','price',i.price_text||'Price unknown'),element('span','quantity',i.quantity===null?'Qty unknown':`Qty ${i.quantity}`));card.append(price,element('p','purchased-date',date(i.ordered_at)));
    const details=element('details','receipt-details');details.append(element('summary','', 'Receipt details'));
    for(const [label,value] of [['Price',i.price_basis],['Currency',i.currency||'Not specified in confirmation'],['Date',i.date_basis],['Source','Authenticated forwarded order confirmation'],['Image','Exact image paired with this receipt line']]){
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
  document.querySelector('#refreshed').textContent=data.generated_at?'Checked '+new Date(data.generated_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';
  if(!records.length){const n=document.querySelector('#notice');n.hidden=false;n.textContent='No clothing or accessory confirmations found yet.';}
}catch(error){document.querySelector('#count').textContent='Unable to load';const n=document.querySelector('#notice');n.hidden=false;n.textContent=error.message;}})();

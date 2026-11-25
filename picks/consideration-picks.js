import * as deals from './monitored-deals-cards.js?v=c442a52efdd6';
import * as jackets from './natural-jackets-under-300-cards.js?v=889ef1ea4316';
const sources=[
 {id:'monitored-deals',label:'Monitored deals',native:deals,api:'https://monitored-deals-shortlist.wren-tools.workers.dev/state'},
 {id:'natural-jackets-under-300',label:'Natural outerwear',native:jackets,api:'https://jacket-shared-archive.wren-tools.workers.dev/shortlist/state'}
];
const view=location.pathname.includes('/selected/')?'selected':'considering';
// Keep each view's last receipt independent of shortlist state.
const receiptKey='universal-picks:toolbar:v1:'+view;
function get(k){try{return localStorage.getItem(receiptKey+k)}catch{return null}}
function put(k,v){try{localStorage.setItem(receiptKey+k,v)}catch{}}
 function mount(bar,details,endpoint){const form=document.createElement('form');form.className='deals-intake';const field=document.createElement('input'),save=document.createElement('button'),msg=document.createElement('span');field.type='url';field.required=true;field.maxLength=850;field.placeholder='Product URL';field.setAttribute('aria-label','Product URL');save.textContent='Save';save.type='submit';msg.setAttribute('role','status');msg.className='intake-status';form.append(field,save);bar.append(form);details.append(msg);
 const api='https://monitored-deals-shortlist.wren-tools.workers.dev/picks';
 form.onsubmit=async e=>{e.preventDefault();if(save.disabled)return;save.disabled=field.disabled=true;msg.textContent='Saving…';try{
   const res=await fetch(api,{method:'POST',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json'},body:JSON.stringify({url:field.value.trim()})});
   const r=await res.json().catch(()=>({}));if(!res.ok||!r.id||!['selected','considering'].includes(r.state)||!Number.isSafeInteger(r.version))throw Error(r.error||'Save not confirmed.');
   const label=r.state==='selected'?'Selected':'In consideration';msg.textContent=(r.duplicate?(r.state==='selected'?'Already in Selected.':'Already in consideration.'):'Added to '+label+'.')+' ';const a=document.createElement('a');a.href=new URL((location.pathname.includes('/picks/')?'../':'../picks/')+(r.state==='selected'?'selected':'in-consideration')+'/',document.baseURI);a.textContent='View pick';msg.append(a);field.value='';document.dispatchEvent(new Event('shared-pick-saved'));
 }catch(err){msg.textContent=err.message||'Save not confirmed.'}finally{save.disabled=field.disabled=false}}}
 function manualProduct(id,row){if(!id.startsWith('manual-')||!row.url)return null;const u=new URL(row.url);if(u.protocol!=='https:')return null;const name=u.pathname.split('/').filter(Boolean).pop().replace(/[-_]+/g,' ');return {id,url:u.href,name,store:u.hostname,category:'Manual pick',collectionIds:['matches','size-review'],priceLabel:'Price unverified',facts:{Fabric:'Material unverified'},images:[],sizeLinks:[{size:'Open listing',url:u.href}],fulfillmentNote:'Manually saved · availability unverified',materialCaveat:'Not a verified deal'};}
 async function appendManual(topic){if(topic.id!=='monitored-deals')return;try{const r=await fetch('https://monitored-deals-shortlist.wren-tools.workers.dev/state',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});if(!r.ok)return;for(const [id,row] of Object.entries((await r.json()).items)){const p=manualProduct(id,row);if(p)topic.products.push(p)}}catch{/* Static catalog remains usable offline. */}}

mount(document.querySelector('.picks-head nav'),document.querySelector('.picks-tools'),sources[0].api);
const links=[...document.querySelectorAll('[data-view]')],grid=document.querySelector('.display-template');
const current=links.find(a=>a.dataset.view===view);current.setAttribute('aria-current','page');
const $=id=>document.getElementById(id),undo=$('undo'),retry=$('refresh'),notice=$('notice');
const actions=[['removed','remove-item','🗑︎','Remove'],['considering','consider-item','🤔','Consider'],['selected','select-item','✓','Select']];
let busy=false,last=null;
const valid=r=>r&&['active','removed','considering','selected'].includes(r.state)&&Number.isSafeInteger(r.version)&&r.version>=0;
async function request(url,opts={}){const r=await fetch(url,{cache:'no-store',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(12000),...opts});if(!r.ok)throw Object.assign(Error(),{status:r.status});return r.json()}
async function read(s){const data=await request(s.api);if(!data.items||Array.isArray(data.items)||typeof data.items!=='object'||!Object.values(data.items).every(valid))throw Error();s.rows=data.items;}
const reviewedGalleries={
  "deal-62491cbcdb43a9e2": {
    "url": "https://www.yitai.la/products/grey-shirt-25850?variant=47415236559078",
    "photos": [
      "assets/images/gallery-12f4cd955c41a3cb35121ab8.webp",
      "assets/images/pick-9596d030f746acf96ec3.webp",
      "assets/images/pick-f4b368e7e0701b915471.webp",
      "assets/images/pick-38c741823f403be6a544.webp",
      "assets/images/pick-752a0c1b7a32af3d538c.webp",
      "assets/images/pick-d15ba54e5669c7510bcb.webp",
      "assets/images/pick-0ce416e8117afd69e9ca.webp",
      "assets/images/pick-01a489d07823a16926cf.webp"
    ]
  },
  "deal-561b1a71aa980109": {
    "url": "https://scrt.onl/products/super-heavy-waffle-sweat-black?variant=53684000752001",
    "photos": [
      "assets/images/pick-b75402106e8356407acc.webp",
      "assets/images/pick-8f926b45b1f05f7374c3.webp",
      "assets/images/pick-cb6bad49b83a8ed44dc2.webp",
      "assets/images/pick-4ab63c1a0d3620dace6b.webp"
    ]
  },
  "deal-47b2d09b20cb0ec7": {
    "url": "https://scrt.onl/products/900gsm-heavyweight-hoodie-black?variant=44521839952023",
    "photos": [
      "assets/images/pick-6694bf83cc255f36b899.webp",
      "assets/images/pick-40d1ea02cabd53af602f.webp",
      "assets/images/pick-0a14bf65161d2002bd3d.webp",
      "assets/images/pick-de6d72831e297f0b9dac.webp"
    ]
  },
  "deal-e4b6a797e91bd648": {
    "url": "https://www.abercrombie.com/shop/us/p/100-cotton-corduroy-jacket-63899372?seq=01",
    "photos": [
      "assets/images/pick-c961b41cf831fde83f75.webp",
      "assets/images/pick-a1ea7258748cb8dba577.webp",
      "assets/images/pick-aa18f1a40ae2d7d7c95e.webp",
      "assets/images/manual-anf-63899935.jpg",
      "assets/images/pick-d562067c61d26d22b710.webp",
      "assets/images/pick-1e7d11482b5c4d5d807f.webp",
      "assets/images/pick-0e8499bf6d62b24fc765.webp",
      "assets/images/pick-714e1f0a139279cff561.webp",
      "assets/images/pick-142077f357411024e9ab.webp"
    ]
  },
  "deal-21f962cd08003f45": {
    "url": "https://www.saksfifthavenue.com/product/7-for-all-mankind-corduroy-full-zip-shirt-jacket-0400026862929.html?dwvar_0400026862929_color=SMOLDER",
    "photos": [
      "assets/images/pick-d51ef319cdc0e2148218.webp",
      "assets/images/pick-12db36cb67d5ec4a42b3.webp",
      "assets/images/pick-fef8ac31140e5321168f.webp",
      "assets/images/pick-2f2f92783a7707cf0e5d.webp",
      "assets/images/pick-970fdc759965539e87a6.webp",
      "assets/images/pick-7e985dbe6125cb363401.webp"
    ]
  },
  "carpenter-reference": {
    "url": "https://www.helmutlang.com/carpenter-jacket/Q10DM101_EAH.html",
    "photos": [
      "assets/images/pick-4b0ff46a2470ce6fa204.webp",
      "assets/images/pick-9fb8dc8493173adbe9ac.webp",
      "assets/images/pick-5f89325b396fec2aa118.webp",
      "assets/images/pick-c3d59d3427e3b09bbd8a.webp",
      "assets/images/pick-29456dda57d1d7c4b394.webp",
      "assets/images/pick-c66223082ad1a838ee6b.webp",
      "assets/images/pick-ac0450dd7142837e9dde.webp",
      "assets/images/pick-c68d90c1cc64f533ded8.webp"
    ]
  }
}
;
function withReviewedGallery(p){
 const g=reviewedGalleries[p.id];if(!g||p.url!==g.url)return p;
 const images=g.photos.map((src,i)=>({src,alt:`${p.name}, photo ${i+1} of ${g.photos.length}`}));
 return {...p,image:images[0].src,imageAlt:images[0].alt,images,imageNote:'Exact product and color gallery.'};
}
const reference=document.querySelector('#carpenter-reference');
if(reference){
 const link=reference.querySelector('a');const p=withReviewedGallery({id:reference.id,url:link.href,name:link.querySelector('img').alt,facts:{},sizeLinks:[]});
 if(p.images)link.replaceWith(deals.card(p,{products:[p]}).querySelector('.product-gallery'));
}

async function catalog(s){const base='../../'+s.id+'/data/';let [topic,overlay]=await Promise.all([request(base+'topics/'+s.id+'.json'),s.native===deals?request(base+'retailer-promotion-overlay.json'):null]);s.topic=s.native.prepare(topic,overlay);if(s.native===deals)s.topic={...s.topic,products:s.topic.products.map(withReviewedGallery).concat([{"id": "manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84", "url": "https://www.madewell.com/p/mens/clothing/pants/trousers/utility-chino-pant-in-brushed-twill/OB897/?ccode=BR6308", "store": "Madewell", "name": "Utility Chino Pant in Brushed Twill · BR6308", "category": "Manual pick", "manualException": true, "facts": {"Fabric": "100% cotton", "Size": "Open listing"}, "priceLabel": "Price unverified", "collectionIds": ["size-review"], "sizeLinks": [{"size": "Open listing", "url": "https://www.madewell.com/p/mens/clothing/pants/trousers/utility-chino-pant-in-brushed-twill/OB897/?ccode=BR6308"}], "images": [{"src": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-01.webp", "alt": "Utility Chino Pant in Brushed Twill · BR6308, view 1"}, {"src": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-02.webp", "alt": "Utility Chino Pant in Brushed Twill · BR6308, view 2"}, {"src": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-03.webp", "alt": "Utility Chino Pant in Brushed Twill · BR6308, view 3"}, {"src": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-04.webp", "alt": "Utility Chino Pant in Brushed Twill · BR6308, view 4"}, {"src": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-05.webp", "alt": "Utility Chino Pant in Brushed Twill · BR6308, view 5"}, {"src": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-06.webp", "alt": "Utility Chino Pant in Brushed Twill · BR6308, view 6"}, {"src": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-07.webp", "alt": "Utility Chino Pant in Brushed Twill · BR6308, view 7"}, {"src": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-08.webp", "alt": "Utility Chino Pant in Brushed Twill · BR6308, view 8"}], "image": "assets/images/pick-manual-59d3f911-f5fe-4a48-aea8-7fa8b4c46f84-01.webp", "imageAlt": "Utility Chino Pant in Brushed Twill · BR6308, view 1"}, {"id": "manual-61236f34-9cf4-48e8-95e1-51722f42c5a8", "url": "https://www.madewell.com/p/mens/clothing/men%E2%80%99s-jeans/loose/the-1991-loose-straight-jean/NY887/?ccode=DM7033", "store": "Madewell", "name": "The 1991 Loose Straight Jean · Mayde Wash", "category": "Manual pick", "manualException": true, "facts": {"Fabric": "100% cotton rigid denim", "Size": "Open listing"}, "priceLabel": "Price unverified", "collectionIds": ["size-review"], "sizeLinks": [{"size": "Open listing", "url": "https://www.madewell.com/p/mens/clothing/men%E2%80%99s-jeans/loose/the-1991-loose-straight-jean/NY887/?ccode=DM7033"}], "images": [{"src": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-01.webp", "alt": "The 1991 Loose Straight Jean · Mayde Wash, view 1"}, {"src": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-02.webp", "alt": "The 1991 Loose Straight Jean · Mayde Wash, view 2"}, {"src": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-03.webp", "alt": "The 1991 Loose Straight Jean · Mayde Wash, view 3"}, {"src": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-04.webp", "alt": "The 1991 Loose Straight Jean · Mayde Wash, view 4"}, {"src": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-05.webp", "alt": "The 1991 Loose Straight Jean · Mayde Wash, view 5"}, {"src": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-06.webp", "alt": "The 1991 Loose Straight Jean · Mayde Wash, view 6"}, {"src": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-07.webp", "alt": "The 1991 Loose Straight Jean · Mayde Wash, view 7"}, {"src": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-08.webp", "alt": "The 1991 Loose Straight Jean · Mayde Wash, view 8"}], "image": "assets/images/pick-manual-61236f34-9cf4-48e8-95e1-51722f42c5a8-01.webp", "imageAlt": "The 1991 Loose Straight Jean · Mayde Wash, view 1"}, {"id": "manual-a066a598-febd-438c-8f8a-b7ea77efe19e", "url": "https://www.percivalclo.com/products/lucas-vintage-wash-contrast-collar-jacket-cotton-twill-mocha?variant=56835439722876", "store": "Percival", "name": "Lucas Vintage Wash Contrast Collar Jacket · Mocha", "category": "Manual pick", "manualException": true, "facts": {"Fabric": "100% cotton", "Size": "M"}, "priceLabel": "Price unverified", "collectionIds": ["size-review"], "sizeLinks": [{"size": "M", "url": "https://www.percivalclo.com/products/lucas-vintage-wash-contrast-collar-jacket-cotton-twill-mocha?variant=56835439722876"}], "images": [{"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-01.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 1"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-02.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 2"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-03.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 3"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-04.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 4"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-05.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 5"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-06.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 6"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-07.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 7"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-08.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 8"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-09.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 9"}, {"src": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-10.webp", "alt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 10"}], "image": "assets/images/pick-manual-a066a598-febd-438c-8f8a-b7ea77efe19e-01.webp", "imageAlt": "Lucas Vintage Wash Contrast Collar Jacket · Mocha, view 1"}, {"id": "manual-7c1948fa-f669-4a9e-aca0-f9f95237be4f", "url": "https://jpress.com/products/navy-lambswool-crewneck-sweater", "store": "J.Press", "name": "Navy Lambswool Crewneck Sweater", "category": "Manual pick", "manualException": true, "facts": {"Fabric": "100% Scottish lambswool", "Size": "Open listing"}, "priceLabel": "Price unverified", "collectionIds": ["size-review"], "sizeLinks": [{"size": "Open listing", "url": "https://jpress.com/products/navy-lambswool-crewneck-sweater"}], "images": [{"src": "assets/images/pick-manual-7c1948fa-f669-4a9e-aca0-f9f95237be4f-01.webp", "alt": "Navy Lambswool Crewneck Sweater, view 1"}, {"src": "assets/images/pick-manual-7c1948fa-f669-4a9e-aca0-f9f95237be4f-02.webp", "alt": "Navy Lambswool Crewneck Sweater, view 2"}, {"src": "assets/images/pick-manual-7c1948fa-f669-4a9e-aca0-f9f95237be4f-03.webp", "alt": "Navy Lambswool Crewneck Sweater, view 3"}], "image": "assets/images/pick-manual-7c1948fa-f669-4a9e-aca0-f9f95237be4f-01.webp", "imageAlt": "Navy Lambswool Crewneck Sweater, view 1"}, {"id": "manual-b75b3bb3-8836-42ea-940b-b27c8904d1cf", "url": "https://www.jcrew.com/p/mens/categories/clothing/sweaters/zip-up/CW642?display=all&fit=Classic&colorProductCode=CW642&colorCode=SR9764&color_name=marled-camel", "store": "J.Crew", "name": "Quarter-zip Sweater in Marled Cotton · Marled Camel", "category": "Manual pick", "manualException": true, "facts": {"Fabric": "Marled cotton; percentages unverified", "Size": "Open listing"}, "priceLabel": "Price unverified", "collectionIds": ["size-review"], "sizeLinks": [{"size": "Open listing", "url": "https://www.jcrew.com/p/mens/categories/clothing/sweaters/zip-up/CW642?display=all&fit=Classic&colorProductCode=CW642&colorCode=SR9764&color_name=marled-camel"}], "images": [{"src": "assets/images/pick-manual-b75b3bb3-8836-42ea-940b-b27c8904d1cf-01.webp", "alt": "Quarter-zip Sweater in Marled Cotton · Marled Camel, view 1"}, {"src": "assets/images/pick-manual-b75b3bb3-8836-42ea-940b-b27c8904d1cf-02.webp", "alt": "Quarter-zip Sweater in Marled Cotton · Marled Camel, view 2"}, {"src": "assets/images/pick-manual-b75b3bb3-8836-42ea-940b-b27c8904d1cf-03.webp", "alt": "Quarter-zip Sweater in Marled Cotton · Marled Camel, view 3"}, {"src": "assets/images/pick-manual-b75b3bb3-8836-42ea-940b-b27c8904d1cf-04.webp", "alt": "Quarter-zip Sweater in Marled Cotton · Marled Camel, view 4"}], "image": "assets/images/pick-manual-b75b3bb3-8836-42ea-940b-b27c8904d1cf-01.webp", "imageAlt": "Quarter-zip Sweater in Marled Cotton · Marled Camel, view 1"}, {"id": "manual-3e51fc1f-695a-4425-a140-88fdcfb05d82", "url": "https://jpress.com/products/wool-crew-neck-sweater-white-pre-order", "store": "J.Press", "name": "White Wool Crewneck Sweater · Trim Fit", "category": "Manual pick", "manualException": true, "facts": {"Fabric": "80% wool, 20% nylon", "Size": "Open listing"}, "priceLabel": "Price unverified", "collectionIds": ["size-review"], "sizeLinks": [{"size": "Open listing", "url": "https://jpress.com/products/wool-crew-neck-sweater-white-pre-order"}], "images": [{"src": "assets/images/pick-manual-3e51fc1f-695a-4425-a140-88fdcfb05d82-01.webp", "alt": "White Wool Crewneck Sweater · Trim Fit, view 1"}, {"src": "assets/images/pick-manual-3e51fc1f-695a-4425-a140-88fdcfb05d82-02.webp", "alt": "White Wool Crewneck Sweater · Trim Fit, view 2"}], "image": "assets/images/pick-manual-3e51fc1f-695a-4425-a140-88fdcfb05d82-01.webp", "imageAlt": "White Wool Crewneck Sweater · Trim Fit, view 1"}])};s.products=new Map(s.topic.products.map(p=>[p.id,p]));s.nodes=new Map();}
// Read material disclosures, not titles, prices, care text or missing-data flags.
const synthetic=/\b(?:polyester|polyamide|nylon|polyurethane|elastane|spandex|lycra|acrylic|modacrylic|polypropylene|polyethylene|elastomultiester|elasterell|synthetic (?:fib(?:er|re)s?|lining|fill))\b/i;
function hasSynthetic(p){return Object.entries(p.facts||{}).some(([key,value])=>/^(?:fabric|material|composition|shell|outer|body|lining|sleeve lining|body lining|fill|filling|padding|insulation|blend)$/i.test(key)&&String(value).split(/[;|]/).some(s=>!/^\s*trims?\s*:/i.test(s)&&synthetic.test(s)&&!(/\b(?:no|without|unknown|unverified|unspecified|free of)\b/i.test(s))));}
function evidencedProduct(p){
 // Exact SMOLDER maker style 7TEL0E53-3TZ; fabric-composition on
 // https://7forallmankind.com/products/zip-overshirt-in-corduroy-smolder
 if(p.id==='deal-21f962cd08003f45'&&p.url==='https://www.saksfifthavenue.com/product/7-for-all-mankind-corduroy-full-zip-shirt-jacket-0400026862929.html?dwvar_0400026862929_color=SMOLDER'&&p.facts?.Fabric==='Composition unverified')return {...p,facts:{...p.facts,Fabric:'98% cotton, 2% elastane (manufacturer)'}};
 return p;
}
function node(s,p){if(s.nodes.has(p.id))return s.nodes.get(p.id);
 const card=s.native.card(p,s.topic);card.dataset.productId=p.id;card.dataset.scope=s.id;
 const group=document.createElement('div');group.className='catalog-actions';
 for(const [state,cls,icon,verb] of actions){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=icon;b.title=(view===state?'Restore to Items: ':verb+' ')+p.name;b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(view===state));b.onclick=()=>move(s,p.id,view===state?'active':state);group.append(b)}
 card.querySelector('.card-body').append(group);s.nodes.set(p.id,card);return card;}
function render(){const ready=sources.every(s=>s.ready),entries=[],missing=[],warnings=[];
 for(const s of sources){if(!s.ready){warnings.push(s.label+' unavailable. Refresh to retry.');continue}
 for(const [id,r] of Object.entries(s.rows)){if(r.state!==view)continue;const p=s.products.get(id)||manualProduct(id,r);if(!p){missing.push(id);continue}const product=evidencedProduct(p),el=node(s,product);entries.push({el,inspiration:view==='considering'&&hasSynthetic(product),key:s.id+':'+id,price:s.native.price(p)});}}
 entries.sort((a,b)=>a.price-b.price||a.key.localeCompare(b.key));grid.replaceChildren(...entries.filter(x=>!x.inspiration).map(x=>x.el));
 const styleGrid=$('style-grid');if(styleGrid)styleGrid.replaceChildren(...entries.filter(x=>x.inspiration).map(x=>x.el),$('carpenter-reference'));
 for(const a of links)a.querySelector('b').textContent=ready?sources.reduce((n,s)=>n+Object.values(s.rows).filter(r=>r.state===a.dataset.view).length,0):'—';
 $('summary').textContent=[entries.length?`${entries.length} picks · Price: low to high`:ready?'No picks in this view.':'',...warnings,missing.length?'No longer in current catalog: '+missing.join(', '):''].filter(Boolean).join(' · ');
 undo.hidden=!last;lock(false);}
function lock(on){busy=on;retry.disabled=on;undo.disabled=on;document.querySelectorAll('.catalog-actions button').forEach(b=>b.disabled=on)}
async function refresh(){if(busy)return;lock(true);await Promise.all(sources.map(async s=>{try{await Promise.all([s.topic?null:catalog(s),read(s)]);s.ready=true}catch{s.ready=false}}));render();}
async function move(s,id,next,back=false){if(busy||!s.ready)return;const row=s.rows[id];if(back&&last.version!==row.version){last=null;notice.textContent='Undo unavailable: the item changed.';render();return}lock(true);
 try{const saved=await request(s.api,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,state:next,version:row.version})});if(!valid(saved)||saved.state!==next||saved.version<=row.version)throw Error();s.rows[id]={...row,...saved};last=back?null:{s,id,before:row.state,version:saved.version};notice.textContent=back?'Move undone.':'Item moved.';}
 catch(e){notice.textContent=e.status===409?'Another editor changed the shortlist. Review before editing.':'Save not confirmed. Refresh before editing.';s.ready=false;if(e.status===409){try{await read(s);s.ready=true}catch{}}}render();(last?undo:current).focus({preventScroll:true});}
undo.onclick=()=>{if(last)move(last.s,last.id,last.before,true)};retry.onclick=refresh;document.addEventListener('shared-pick-saved',async()=>{if(busy){while(busy)await new Promise(resolve=>setTimeout(resolve,50))}await refresh()});document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
const dialog=document.querySelector('dialog');dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}};
const key='universal-picks:scroll:'+(view==='considering'?'consideration':view);let target=Number(sessionStorage.getItem(key)),restore=target>0;if('scrollRestoration'in history)history.scrollRestoration='manual';for(const e of ['wheel','touchstart','pointerdown','keydown'])addEventListener(e,()=>restore=false,{passive:true});addEventListener('pagehide',()=>{if(!restore)sessionStorage.setItem(key,scrollY)});
refresh().then(()=>{if(location.hash==='#unnatural-fibers-style-inspiration'){$('style-grid')?.parentElement.scrollIntoView();restore=false}else if(restore){scrollTo(0,target);restore=false}});

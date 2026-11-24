import * as deals from './monitored-deals-cards.js?v=c442a52efdd6';
import * as jackets from './natural-jackets-under-300-cards.js?v=889ef1ea4316';
const sources=[
 {id:'monitored-deals',label:'Monitored deals',native:deals,api:'https://monitored-deals-shortlist.wren-tools.workers.dev/state'},
 {id:'natural-jackets-under-300',label:'Natural outerwear',native:jackets,api:'https://jacket-shared-archive.wren-tools.workers.dev/shortlist/state'}
];
const view=location.pathname.includes('/selected/')?'selected':'considering';
const links=[...document.querySelectorAll('[data-view]')],grid=document.querySelector('.display-template');
const current=links.find(a=>a.dataset.view===view);current.setAttribute('aria-current','page');
const $=id=>document.getElementById(id),undo=$('undo'),retry=$('refresh'),notice=$('notice');
const actions=[['removed','remove-item','🗑︎','Remove'],['considering','consider-item','🤔','Consider'],['selected','select-item','✓','Select']];
let busy=false,last=null;
const valid=r=>r&&['active','removed','considering','selected'].includes(r.state)&&Number.isSafeInteger(r.version)&&r.version>=0;
async function request(url,opts={}){const r=await fetch(url,{cache:'no-store',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(12000),...opts});if(!r.ok)throw Object.assign(Error(),{status:r.status});return r.json()}
async function read(s){const data=await request(s.api);if(!data.items||Array.isArray(data.items)||typeof data.items!=='object'||!Object.values(data.items).every(valid))throw Error();s.rows=data.items;}
async function catalog(s){const base='../../'+s.id+'/data/';let [topic,overlay]=await Promise.all([request(base+'topics/'+s.id+'.json'),s.native===deals?request(base+'retailer-promotion-overlay.json'):null]);s.topic=s.native.prepare(topic,overlay);s.products=new Map(s.topic.products.map(p=>[p.id,p]));s.nodes=new Map();}
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
 for(const [id,r] of Object.entries(s.rows)){if(r.state!==view)continue;const p=s.products.get(id);if(!p){missing.push(id);continue}const product=evidencedProduct(p),el=node(s,product);entries.push({el,inspiration:view==='considering'&&hasSynthetic(product),key:s.id+':'+id,price:s.native.price(p)});}}
 entries.sort((a,b)=>a.price-b.price||a.key.localeCompare(b.key));grid.replaceChildren(...entries.filter(x=>!x.inspiration).map(x=>x.el));
 const styleGrid=$('style-grid');if(styleGrid)styleGrid.replaceChildren(...entries.filter(x=>x.inspiration).map(x=>x.el),$('carpenter-reference'));
 for(const a of links)a.querySelector('b').textContent=ready?sources.reduce((n,s)=>n+Object.values(s.rows).filter(r=>r.state===a.dataset.view).length,0):'—';
 $('summary').textContent=[entries.length?`${entries.length} picks · Price: low to high`:ready?'No picks in this view.':'',...warnings,missing.length?'No longer in current catalog: '+missing.join(', '):''].filter(Boolean).join(' · ');
 undo.hidden=!last;lock(false);}
function lock(on){busy=on;retry.disabled=on;undo.disabled=on;document.querySelectorAll('.catalog-actions button').forEach(b=>b.disabled=on)}
async function refresh(){if(busy)return;lock(true);await Promise.all(sources.map(async s=>{try{await Promise.all([s.topic?null:catalog(s),read(s)]);s.ready=true}catch{s.ready=false}}));render();}
async function move(s,id,next,back=false){if(busy||!s.ready)return;const row=s.rows[id];if(back&&last.version!==row.version){last=null;notice.textContent='Undo unavailable: the item changed.';render();return}lock(true);
 try{const saved=await request(s.api,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,state:next,version:row.version})});if(!valid(saved)||saved.state!==next||saved.version<=row.version)throw Error();s.rows[id]=saved;last=back?null:{s,id,before:row.state,version:saved.version};notice.textContent=back?'Move undone.':'Item moved.';}
 catch(e){notice.textContent=e.status===409?'Another editor changed the shortlist. Review before editing.':'Save not confirmed. Refresh before editing.';s.ready=false;if(e.status===409){try{await read(s);s.ready=true}catch{}}}render();(last?undo:current).focus({preventScroll:true});}
undo.onclick=()=>{if(last)move(last.s,last.id,last.before,true)};retry.onclick=refresh;document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
const dialog=document.querySelector('dialog');dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}};
const key='universal-picks:scroll:'+(view==='considering'?'consideration':view);let target=Number(sessionStorage.getItem(key)),restore=target>0;if('scrollRestoration'in history)history.scrollRestoration='manual';for(const e of ['wheel','touchstart','pointerdown','keydown'])addEventListener(e,()=>restore=false,{passive:true});addEventListener('pagehide',()=>{if(!restore)sessionStorage.setItem(key,scrollY)});
refresh().then(()=>{if(location.hash==='#unnatural-fibers-style-inspiration'){$('style-grid')?.parentElement.scrollIntoView();restore=false}else if(restore){scrollTo(0,target);restore=false}});

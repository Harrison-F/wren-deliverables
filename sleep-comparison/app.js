'use strict';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => typeof value === 'number' ? new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2}).format(value) : 'Price unverified';
const safeURL = value => { try { const u = new URL(value, location.href); return ['https:','http:'].includes(u.protocol) ? esc(value) : '#'; } catch { return '#'; } };
function card(item) {
 const components = item.components || [];
 const sources = item.sources || [];
 return `<article class="card" id="${esc(item.id)}"><div class="photo">${item.image ? `<img src="${safeURL(item.image)}" alt="${esc(item.brand + ' ' + item.name)}" loading="lazy" width="600" height="400">` : ''}<span class="badge">${esc(item.badge || 'Materials-first option')}</span></div>
 <div class="card-title"><div class="brand">${esc(item.brand)}</div><h3>${esc(item.name)}</h3><p class="variant">${esc(item.variant)}</p></div>
 <div class="commerce"><div class="amount">${money(item.price_usd)}</div><p class="price-note">${esc(item.price_note || 'Before tax; delivery costs below')}</p><div class="shipping"><strong>${esc(item.dispatch)}</strong><span>${esc(item.arrival)}</span></div><div class="shipping"><strong>${esc(item.shipping_cost)}</strong></div>${item.availability ? `<p class="availability">${esc(item.availability)}</p>` : ''}</div>
 <div class="evaluation">${[['Natural materials',item.materials],['Sleep advantages',item.sleep],['Temperature',item.temperature]].map(([label,text]) => `<section class="criterion"><h4>${label}</h4><p>${esc(text)}</p></section>`).join('')}</div>${item.criteria ? `<section class="criteria-fit"><h4>${esc(item.criteria_status || 'Construction criteria')}</h4><ul>${item.criteria.map(([label,status])=>`<li><strong>${esc(label)}</strong> — ${esc(status)}</li>`).join('')}</ul></section>` : ''}
 <div class="risk"><strong>THE TRADEOFF</strong>${esc(item.caveat)}</div>
 <div class="card-bottom">${components.length ? `<details><summary>What’s included · itemized price</summary><div class="detail-body">${components.map(c=>`<div class="component"><a href="${safeURL(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.name)}<small>${esc(c.variant || '')}${c.quantity>1 ? ` · qty ${c.quantity}` : ''}${c.included_contents ? `<br>${esc(c.included_contents.join(' · '))}` : ''}</small></a><span>${c.included ? 'Included' : money(c.price_usd)}</span></div>`).join('')}<p style="margin-top:10px">${esc(item.fit_note || 'Pillow inserts and mattress protector are separate.')}</p></div></details>` : ''}
 <details><summary>Returns & care</summary><div class="detail-body">${esc(item.returns)}${item.care ? `<p style="margin-top:8px">${esc(item.care)}</p>` : ''}</div></details>
 <details><summary>Sources & verification</summary><div class="detail-body"><ul class="source-list">${sources.map((s,i)=>`<li><a href="${safeURL(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label || 'Source '+(i+1))} ↗</a>${s.note ? `<small>${esc(s.note)}</small>` : ''}</li>`).join('')}</ul><p>${esc(item.verified_note || 'Product specifications and purchase terms are seller-origin evidence. Performance notes are assessments, not product test results. Checked September 9, 2026.')}</p></div></details>
 <a class="buy" href="${safeURL(item.url)}" target="_blank" rel="noopener noreferrer"><span>${components.length ? 'View main bundle' : 'View product'}</span><span aria-hidden="true">↗</span></a></div></article>`;
}
function setTab(name, updateHash=true) {
 const selected = name === 'bedding' ? 'bedding' : 'mattresses';
 for (const button of document.querySelectorAll('[data-tab]')) { const active = button.dataset.tab === selected; button.setAttribute('aria-selected',String(active)); button.tabIndex = active ? 0 : -1; document.getElementById('panel-'+button.dataset.tab).hidden = !active; }
 if(updateHash) history.replaceState(null,'','#'+selected);
}
for(const button of document.querySelectorAll('[data-tab]')) {
 button.addEventListener('click',()=>setTab(button.dataset.tab));
 button.addEventListener('keydown',e=>{ if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const name=e.key==='Home'?'mattresses':e.key==='End'?'bedding':button.dataset.tab==='mattresses'?'bedding':'mattresses';setTab(name);document.getElementById('tab-'+name).focus();}});
}
window.addEventListener('hashchange',()=>setTab(location.hash.slice(1),false));
document.getElementById('back-top').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
setTab(location.hash.slice(1),false);
fetch('data.json?v=3').then(response=>{if(!response.ok)throw new Error('Comparison data unavailable');return response.json();}).then(data=>{
 if(data.mattresses.length!==4 || data.bedding.length!==4) throw new Error('Incomplete comparison');
 const groups = {mattresses:'mattress-grid', bedding:'bedding-grid', accessories:'accessory-grid'};
 for (const [group, gridId] of Object.entries(groups)) {
  const grid = document.getElementById(gridId);
  const controls = document.createElement('div');
  controls.style.cssText='display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 0';
  controls.innerHTML = `<label>Sort ${esc(group)} <select aria-label="Sort ${esc(group)}" style="min-height:44px;max-width:100%;font:inherit"><option value="recommendation">Top recommendation</option><option value="price">Price: low to high</option></select></label>`;
  grid.before(controls);
  const render = () => {
   const items = [...data[group]];
   const ids = data.defaultOrderProductIds[group];
   if(controls.querySelector('select').value==='price') items.sort((a,b)=>(a.price_usd ?? Infinity)-(b.price_usd ?? Infinity));
   else items.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
   grid.innerHTML = items.map(card).join('');
  };
  controls.querySelector('select').addEventListener('change',render);
  render();
 }
 const note=document.createElement('p');note.textContent=data.ordering_note;note.style.cssText='line-height:1.6;margin:16px 0';document.querySelector('.tabs').after(note);
 if(data.mattress_summary)document.getElementById('mattress-summary').textContent=data.mattress_summary;
 if(data.bedding_summary)document.getElementById('bedding-summary').textContent=data.bedding_summary;
 document.getElementById('context-content').innerHTML=(data.context || []).map(p=>`<p>${esc(p)}</p>`).join('');
 document.documentElement.dataset.ready='true';
}).catch(error=>{const el=document.getElementById('error');el.hidden=false;el.textContent=error.message+'. The research notes remain available above.';console.error(error);});

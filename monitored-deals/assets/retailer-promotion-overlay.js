/* Installed immediately before the deferred dashboard app. Its load event runs
   after function declarations and before render's first async library fetch settles. */
(() => {
  'use strict';
  const app = [...document.scripts].find(s => s.src && new URL(s.src).pathname.endsWith('/assets/app.js'));
  app?.addEventListener('load', () => {
    const loadBase = window.load;
    window.load = async function(path) {
      if (path !== 'data/topics/monitored-deals.json') return loadBase(path);
      window.load = loadBase;
      const base = await loadBase(path);
      try {
        const response = await fetch('data/retailer-promotion-overlay.json', {cache:'no-store', signal:AbortSignal.timeout(5000)});
        if (!response.ok) return base;
        return apply(base, await response.json());
      } catch (_) { return base; }
    };
  }, {once:true});

  function apply(topic, bundle) {
    if (bundle.version !== 1 || !Array.isArray(bundle.cards)) return topic;
    const now = Date.now();
    const offer = bundle.offers.find(o => (!o.from || now >= Date.parse(o.from)) && (!o.until || now < Date.parse(o.until)));
    if (!offer) return topic;
    const ids = new Set(topic.products.map(p => p.id));
    const urls = new Set(topic.products.flatMap(p => [p.url,...(p.sizeLinks || []).map(l => l.url)]));
    const extra = bundle.cards.filter(p => !ids.has(p.id) && !p.sizeLinks.some(l => urls.has(l.url)));
    const products = topic.products.concat(extra);
    const eligible = p => p.store === 'SCRT' && new URL(p.url).hostname === 'scrt.onl';
    const estimate = p => Math.round(Math.round(p.unitPriceUSD * 100) * (100 - offer.percent) / 100) / 100;
    const sortBase = window.sortNaturalProducts, metaBase = window.catalogMeta, galleryBase = window.gallery;
    window.sortNaturalProducts = (rows,mode) => mode !== 'price' ? sortBase(rows,mode) : [...rows].sort((a,b) =>
      (eligible(a) ? estimate(a) : a.unitPriceUSD) - (eligible(b) ? estimate(b) : b.unitPriceUSD));
    window.catalogMeta = p => {
      if (!eligible(p)) return metaBase(p);
      // Suppress the ordinary compare-at row only for this presentation; the
      // actual listed price is the reference for this code, not the old MSRP.
      const html = metaBase({...p, priceLabel: `${formatUSD(estimate(p))} with ${offer.code}`, sizeLinks:p.sizeLinks.map(s=>({...s,originalPriceUSD:null}))});
      return html.replace(/(<p class="catalog-price" data-field="price">[^<]*<\/p>)/, '$1'+`<p class="catalog-original-price" aria-label="Listed price"><s>${formatUSD(p.unitPriceUSD)}</s></p>`).replace('class="catalog-price"','class="catalog-price promotion-estimate"');
    };
    // The shared gallery validates flat local filenames. Reuse already-published
    // sibling assets for exact product/color only, including subsequent slides.
    const prefix = '../scrt-mens-unisex-natural-materials/';
    window.gallery = (p,t) => {
      if (!p.images?.[0]?.src.startsWith(prefix)) return galleryBase(p,t);
      const local = p.images.map(im => ({...im,src:im.src.slice(prefix.length)}));
      return galleryBase({...p,images:local},t).replace('src="assets/images/',`src="${prefix}assets/images/`);
    };
    if (offer.until) {
      const cutoff = Date.parse(offer.until);
      const check = () => Date.now() >= cutoff ? location.reload() : setTimeout(check,Math.min(cutoff-Date.now(),2147483647));
      check();
    }
    const text = `${products.filter(p=>p.collectionIds.includes('matches')).length} size-stock matches · ${products.filter(p=>p.collectionIds.includes('size-review')).length} need size checks.`;
    return {...topic,products,recommendation:{...topic.recommendation,text}};
  }
})();

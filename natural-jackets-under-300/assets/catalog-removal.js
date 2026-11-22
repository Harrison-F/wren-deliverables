/* Isolated jacket export: authoritative shared archive, never browser storage. */
var CatalogRemoval = (() => {
 'use strict';
 function attach(topic, apply) {
  if (topic.id !== 'natural-jackets-under-300') return;
  const grid = document.querySelector('.display-template');
  const ids = new Set(topic.products.map(p => p.id));
  let items = new Map(), revision = -1, busy = false, available = false;
  let removed = false, last = null, timer = null;
  const endpoint = typeof window.CATALOG_SHARED_ENDPOINT === 'string' ? window.CATALOG_SHARED_ENDPOINT.replace(/\/$/, '') : '';
  const bar = document.createElement('div'); bar.className = 'catalog-removal';
  const button = text => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; return b; };
  const toggle = button('Removed (0)'), undo = button('Undo'), retry = button('Retry');
  const status = document.createElement('span'); status.setAttribute('role', 'status');
  status.textContent = 'Loading shared state…';
  bar.append(toggle, undo, status, retry); document.querySelector('.research-sort').after(bar);
  const cards = topic.products.map((p, i) => {
   const card = grid.querySelector(`[data-product-index="${i}"]`), b = button('Remove');
   b.className = 'remove-item'; card.querySelector('.card-body').append(b);
   b.addEventListener('click', () => {
    if (busy || !available || document.body.classList.contains('catalog-dragging')) return;
    const item = items.get(p.id);
    mutate(p.id, !item.hidden, item.version, false);
   });
   return {p, card, b};
  });
  function refresh() {
   grid.dataset.removedView = String(removed);
   toggle.textContent = removed ? 'Back to items' : `Removed (${[...items.values()].filter(i => i.hidden).length})`;
   toggle.setAttribute('aria-pressed', String(removed)); toggle.disabled = busy || !available;
   undo.hidden = !last; undo.disabled = busy || !available;
   retry.hidden = available || busy; retry.disabled = busy;
   bar.setAttribute('aria-busy', String(busy));
   cards.forEach(({p, card, b}) => {
    const hidden = items.get(p.id)?.hidden === true;
    card.dataset.removed = String(hidden); b.textContent = hidden ? 'Restore' : 'Remove';
    b.setAttribute('aria-label', `${b.textContent} ${p.name}`); b.disabled = busy || !available;
   });
   apply();
  }
  function accept(state) {
   if (!Number.isSafeInteger(state?.revision) || state.revision < 0 || !Array.isArray(state.items)) throw Error('Invalid state');
   const next = new Map(), seen = new Set();
   for (const item of state.items) {
    if (!item || typeof item.id !== 'string' || seen.has(item.id) || typeof item.hidden !== 'boolean' || !Number.isSafeInteger(item.version) || item.version < 0) throw Error('Invalid item');
    seen.add(item.id);
    // Older topic snapshots may coexist with additive server registrations.
    if (ids.has(item.id)) next.set(item.id, {id: item.id, hidden: item.hidden, version: item.version});
   }
   if (next.size !== ids.size) throw Error('Missing local item');
   // A delayed or stale response must never roll back shared state.
   if (state.revision < revision) return false;
   for (const [id, prior] of items) {
    const now = next.get(id);
    if (now.version < prior.version || (now.version === prior.version && now.hidden !== prior.hidden)) throw Error('Inconsistent state');
   }
   if (state.revision === revision && [...next].some(([id, item]) => item.version !== items.get(id).version)) throw Error('Inconsistent revision');
   items = next; revision = state.revision;
   return true;
  }
  async function request(payload) {
   if (!endpoint) throw Error('Endpoint not configured');
   const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 10000);
   try {
    const response = await fetch(endpoint + '/state', {
     method: payload ? 'POST' : 'GET', credentials: 'omit', cache: 'no-store', signal: controller.signal,
     ...(payload ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)} : {})
    });
    if (!response.ok && response.status !== 409) throw Error('Sync unavailable');
    return {conflict: response.status === 409, state: await response.json()};
   } finally { clearTimeout(timeout); }
  }
  function schedule() {
   clearTimeout(timer);
   if (!document.hidden) timer = setTimeout(() => read(false), 5000);
  }
  async function read(explicit) {
   if (busy || document.hidden) return;
   busy = true; refresh();
   try {
    const response = await request();
    if (response.conflict) throw Error('Invalid read');
    accept(response.state);
    const recovered = !available; available = true;
    if (explicit || recovered) status.textContent = 'Shared with everyone';
   } catch (_) {
    available = false; status.textContent = "Can't sync.";
   } finally { busy = false; refresh(); schedule(); }
  }
  async function mutate(id, hidden, expectedVersion, isUndo) {
   if (busy || !available) return;
   if (isUndo && items.get(id).version !== expectedVersion) {
    last = null; status.textContent = 'Changed elsewhere. Undo not applied.'; refresh(); return;
   }
   busy = true; clearTimeout(timer); status.textContent = 'Saving…'; refresh();
   try {
    const response = await request({id, hidden, expectedVersion});
    if (!accept(response.state)) throw Error('Stale write response');
    if (response.conflict) {
     last = null; status.textContent = 'Changed elsewhere. Your change was not applied.';
    } else {
     const saved = items.get(id);
     if (saved.hidden !== hidden || saved.version !== expectedVersion + 1) throw Error('Write not confirmed');
     last = isUndo ? null : {id, hidden: !hidden, version: saved.version};
     status.textContent = 'Saved for everyone.';
    }
   } catch (_) {
    // A timeout may have committed remotely: refetch, never replay automatically.
    available = false; last = null; status.textContent = "Can't sync.";
   } finally {
    busy = false; refresh(); schedule();
    if (available) (last ? undo : toggle).focus({preventScroll: true});
   }
  }
  toggle.addEventListener('click', () => { removed = !removed; refresh(); });
  undo.addEventListener('click', () => { if (last) mutate(last.id, last.hidden, last.version, true); });
  retry.addEventListener('click', () => read(true));
  window.addEventListener('focus', () => read(false));
  document.addEventListener('visibilitychange', () => {
   if (document.hidden) clearTimeout(timer); else read(false);
  });
  window.addEventListener('pagehide', () => clearTimeout(timer));
  window.addEventListener('pageshow', () => { if (!busy) read(false); });
  refresh(); read(true);
 }
 return {attach};
})();

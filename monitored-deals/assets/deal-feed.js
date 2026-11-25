/* GitHub Pages is static: revalidate only the small response headers, not the gallery. */
window.DealFeed = (() => {
  let checking=false, baseline, path;
  async function check(){
    if(!baseline || checking || document.hidden || document.querySelector('dialog[open]') || document.activeElement?.matches('input,textarea'))return;
    checking=true;
    try{
      const r=await fetch(path+'?check='+Date.now(),{method:'HEAD',cache:'no-store'});
      const tag=r.headers.get('etag');
      if(r.ok && tag && tag!==baseline) location.reload();
    }catch{} finally{checking=false;}
  }
  return {async load(url){
    path=url;
    const r=await fetch(path+'?feed='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw Error('Deals feed unavailable');
    const data=await r.json(); baseline=r.headers.get('etag');
    document.addEventListener('visibilitychange',check);window.addEventListener('pageshow',check);setInterval(check,15000);
    return data;
  }};
})();

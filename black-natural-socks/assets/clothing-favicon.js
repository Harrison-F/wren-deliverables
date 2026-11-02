/* Clothing-only favicon: no changes to other private library topics. */
(() => {
  const topics = new Set(["abercrombie-harrison-picks", "abercrombie-natural-men-s-available", "abercrombie-natural-men", "banana-republic-dress-pants", "black-relaxed-fit-pants", "brown-jacket-outfit", "harrison-clothes-contenders", "mens-natural-wardrobe", "natural-basics", "natural-cable-knit-sweaters", "purchased-clothing", "refined-taste-pants", "sandro-mens-sale-natural-materials", "scrt-mens-unisex-natural-materials", "supplied-natural-fiber-clothes"]);
  const topic = new URLSearchParams(location.search).get('topic');
  if (!topics.has(topic)) return;
  for (const [rel, type, sizes, file] of [
    ['icon', 'image/x-icon', '16x16 32x32 48x48', 'tshirt.ico'],
    ['icon', 'image/png', '16x16', 'tshirt-16.png'],
    ['icon', 'image/png', '32x32', 'tshirt-32.png'],
    ['apple-touch-icon', 'image/png', '180x180', 'tshirt-180.png']
  ]) {
    const link = document.createElement('link');
    Object.assign(link, {rel, type, sizes, href: `assets/clothing-favicon/${file}?v=white-1`});
    document.head.append(link);
  }
})();

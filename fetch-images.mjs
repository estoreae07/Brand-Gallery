import fs from 'node:fs/promises';

const file = 'products.js';
const source = await fs.readFile(file, 'utf8');
const products = JSON.parse(source.replace(/^window\.PRODUCTS = /, '').replace(/;\s*$/, ''));
let found = 0;
for (const product of products) {
  if (!product.sourceUrl || product.imageUrl) continue;
  try {
    const response = await fetch(product.sourceUrl, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; product catalogue image updater)' }, redirect: 'follow' });
    const rawPage = await response.text();
    const page = rawPage.replace(/\\u002F|\\\//g, '/').replace(/&amp;/g, '&');
    const meta = page.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i) || page.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
    const cdn = page.match(/https?:[^"'\s<>]+cdn\.mafrservices\.com[^"'\s<>]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s<>]+)?/i);
    const image = meta?.[1] || cdn?.[0];
    if (image) { product.imageUrl = image.replace(/&amp;/g, '&'); found++; }
  } catch { /* Keep the website placeholder if a source page is unavailable. */ }
}
await fs.writeFile(file, `window.PRODUCTS = ${JSON.stringify(products)};\n`);
console.log(`Added ${found} public product image links.`);

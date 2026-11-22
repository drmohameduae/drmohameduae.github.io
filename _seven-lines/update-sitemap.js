/* Appends the Seven Lines edition URLs to sitemap.xml (idempotent). */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.ROOT || path.join(__dirname, '..');
const file = path.join(ROOT, 'sitemap.xml');
let xml = fs.readFileSync(file, 'utf8');

if (xml.includes('/seven-lines/october-2026')) {
  console.log('sitemap: already lists editions — skipping');
  process.exit(0);
}

const ids = ['october-2026', 'september-2026', 'august-2026', 'july-2026', 'june-2026'];
const today = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
const locs = [];
for (const loc of ['en', 'ar', 'es', 'fr', 'ru', 'zh']) {
  for (const id of ids) {
    locs.push(`  <url><loc>https://drmohamed.net/${loc}/reading-room/seven-lines/${id}</loc><lastmod>${today}</lastmod></url>`);
  }
}
xml = xml.replace('</urlset>', '\n' + locs.join('\n') + '\n</urlset>');
fs.writeFileSync(file, xml);
console.log(`sitemap: added ${locs.length} edition URLs (${xml.length} chars)`);

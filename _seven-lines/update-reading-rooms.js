/* Inserts the Seven Lines archive section + css link into each locale's
   reading-room page, in place, at the repository root (parent of this dir). */
const fs = require('fs');
const path = require('path');
const { section } = require('./reading-room-section.js');

const ROOT = process.env.ROOT || path.join(__dirname, '..');
const locales = ['en', 'ar', 'es', 'fr', 'ru', 'zh'];

for (const loc of locales) {
  const file = path.join(ROOT, loc, 'reading-room', 'index.html');
  let html = fs.readFileSync(file, 'utf8');

  if (html.includes('sl-editions')) {
    console.log(`${loc}: already has section — skipping`);
    continue;
  }

  // 1. css link after site.css
  const cssAnchor = '<link rel="stylesheet" href="/assets/site.css" />';
  if (!html.includes(cssAnchor)) throw new Error(`${loc}: css anchor missing`);
  html = html.replace(cssAnchor, cssAnchor + '\n  <link rel="stylesheet" href="/assets/seven-lines.css" />');

  // 2. archive section before the actions block (fallback: before </main>)
  const sec = '\n' + section(loc) + '\n';
  const actionsAnchor = '<div class="container"><div class="actions">';
  if (html.includes(actionsAnchor)) {
    html = html.replace(actionsAnchor, sec + actionsAnchor);
  } else {
    html = html.replace('</main>', sec + '</main>');
  }

  fs.writeFileSync(file, html);
  console.log(`${loc}: updated (${html.length} chars)`);
}
console.log('done');

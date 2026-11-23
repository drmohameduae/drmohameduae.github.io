/* Run from any directory. All translations are required; no silent English fallback. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {buildEdition,localizedEditions,T,editions,preservedEditions,media,esc,issueTitle}=require('./gen');
const ROOT=process.env.OUT||path.join(__dirname,'..');
const ORIGIN=process.env.SITE_ORIGIN||'https://drmohameduae.github.io';
const requested=process.argv.includes('--locale')?[process.argv[process.argv.indexOf('--locale')+1]]:Object.keys(T);
let generated=0;
for(const locale of requested){
 const t=T[locale];if(!t)throw new Error(`Unknown locale ${locale}`);
 const data=localizedEditions(locale);
 const shell=fs.readFileSync(path.join(ROOT,locale,'reading-room/index.html'),'utf8');
 const header=shell.match(/<header class="masthead">[\s\S]*?<\/header>/)?.[0];
 const footer=shell.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];
 if(!header||!footer)throw new Error(`Site shell absent ${locale}`);
 for(const [index,ed] of data.entries()){
  const result=buildEdition(t,ed,index),m=media[ed.id],name=`${t.brand} — ${issueTitle(t,ed)}`;
  const route=`/${locale}/reading-room/seven-lines/${ed.id}/`,url=ORIGIN+route;
  const jsonld={'@context':'https://schema.org','@type':'PublicationIssue',name,description:ed.intro,inLanguage:locale,issueNumber:index+1,isPartOf:{'@type':'Periodical',name:t.brand},author:{'@type':'Person',name:t.byline},url,associatedMedia:{'@type':'MediaObject',contentUrl:ORIGIN+m.originalPdf,encodingFormat:'application/pdf',inLanguage:['en','ar']}};
  const html=`<!doctype html>
<html lang="${locale}" dir="${t.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(name)} | ${esc(t.byline)}</title><meta name="description" content="${esc(ed.intro)}"><link rel="canonical" href="${url}">
${Object.keys(T).map(l=>`<link rel="alternate" hreflang="${l}" href="${ORIGIN}/${l}/reading-room/seven-lines/${ed.id}/">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${ORIGIN}/en/reading-room/seven-lines/${ed.id}/"><meta property="og:type" content="article"><meta property="og:title" content="${esc(name)}"><meta property="og:description" content="${esc(ed.intro)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ORIGIN+m.cover}"><meta property="og:locale" content="${locale}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#F7F5F0"><link rel="icon" href="/assets/favicon.png"><link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/seven-lines.css?v=20261123-a4"><link rel="stylesheet" href="/assets/print.css" media="print"><script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g,'\\u003c')}</script></head>
<body class="sl-edition-reader"><a class="skip-link" href="#main-content">${esc(t.skipMain)}</a>${header}
<nav class="breadcrumbs container" aria-label="${esc(t.readingRoom)}"><ol><li><a href="/${locale}/">${esc(t.home)}</a></li><li><a href="/${locale}/reading-room/#seven-lines-monthly-editions">${esc(t.readingRoom)}</a></li><li aria-current="page">${esc(name)}</li></ol></nav>
<main id="main-content"><section class="section container sl-reader-section"><div class="section-heading"><p class="kicker">${esc(t.title)}</p><h1>${esc(name)}</h1></div>
<div class="sl-book" data-sl-book data-total="${result.total}" data-label-page="${esc(t.page)}" data-label-of="${esc(t.of)}" data-label-reading="${esc(t.readingView)}" data-label-magazine="${esc(t.magazineView)}" data-label-fullscreen="${esc(t.fullscreen)}" data-label-exit-fullscreen="${esc(t.exitFullscreen)}">
<div class="sl-book__viewport">
<div class="sl-book__toolbar"><button type="button" data-sl-contents>${esc(t.contents)}</button><label><span class="visually-hidden">${esc(t.choosePage)}</span><select data-sl-pages aria-label="${esc(t.choosePage)}">${result.pages.map((p,i)=>`<option value="${i}">${i+1} · ${esc(p.label)}</option>`).join('')}</select></label><details class="sl-book__options"><summary aria-label="${esc(t.readingOptions)}" title="${esc(t.readingOptions)}"><span aria-hidden="true">⋯</span></summary><div class="sl-book__option-actions"><button type="button" data-sl-zoom-out aria-label="${esc(t.textSmaller)}">A−</button><button type="button" data-sl-zoom-in aria-label="${esc(t.textLarger)}">A+</button><button type="button" data-sl-fullscreen>${esc(t.fullscreen)}</button><button type="button" data-sl-view>${esc(t.readingView)}</button></div></details></div>
<div class="sl-book__paper"><div class="sl-book__stage">${result.pages.map(p=>p.html).join('\n')}</div></div>
<div class="sl-book__controls"><button type="button" data-sl-prev aria-label="${esc(t.prev)}"><span class="sl-book__arrow" aria-hidden="true"></span><span class="sl-book__turn-label">${esc(t.prev)}</span></button><span class="sl-book__progress" data-sl-progress role="status" aria-live="polite"></span><button type="button" data-sl-next aria-label="${esc(t.next)}"><span class="sl-book__arrow" aria-hidden="true"></span><span class="sl-book__turn-label">${esc(t.next)}</span></button></div>
</div><p class="sl-book__hint">${esc(t.readingInstructions)}</p>
<details class="sl-thumbnails"><summary>${esc(t.thumbnails)}</summary><ol>${result.pages.map((p,i)=>`<li><button type="button" data-sl-goto="${i}"><span>${i+1}</span>${p.thumbnail?`<img src="${p.thumbnail}" alt="" loading="lazy" width="160" height="110">`:''}<span>${esc(p.label)}</span></button></li>`).join('')}</ol></details>
<p class="sl-book__meta">${esc(t.translationNote)}</p></div>
<div class="actions sl-reader-actions"><a class="button button--primary" href="${m.originalPdf}" download>${esc(t.download)}</a><a class="button button--secondary" href="/${locale}/reading-room/#seven-lines-monthly-editions">${esc(t.allEditions)}</a></div></section></main>${footer}
<script src="/assets/site.js" defer></script><script src="/assets/seven-lines.js?v=20261123-a4" defer></script></body></html>`;
  const dest=path.join(ROOT,route);fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'index.html'),html);generated++;
 }
}
if(requested.length===Object.keys(T).length){
 process.env.ROOT=ROOT;require('./update-reading-rooms');require('./update-sitemap');
 const manifest={version:2,source:'Original newsletters supplied by the author',preservedIssues:preservedEditions,locales:Object.keys(T),issues:editions.map(ed=>({id:ed.id,articleCount:ed.articles.length,pdf:media[ed.id].originalPdf,pdfSha256:media[ed.id].pdfSha256,readers:Object.keys(T).map(l=>`/${l}/reading-room/seven-lines/${ed.id}/`)})),sourceDigests:{}};
 for(const filename of ['editions.json','breakers.json','ui.json','preserved-editions.json',...Object.keys(T).filter(l=>l!=='en').map(l=>`locales/${l}.json`)])manifest.sourceDigests[filename]=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'data',filename))).digest('hex');
 fs.writeFileSync(path.join(__dirname,'publication-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}
console.log(`Generated ${generated} complete magazine readers.`);

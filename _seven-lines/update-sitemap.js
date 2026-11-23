const fs=require('node:fs'),path=require('node:path');
const {T,editions,preservedEditions,localizedEditions,esc,issueTitle}=require('./gen');
const ROOT=process.env.ROOT||path.join(__dirname,'..');
const origin=process.env.SITE_ORIGIN||'https://drmohameduae.github.io';
const file=path.join(ROOT,'sitemap.xml');let xml=fs.readFileSync(file,'utf8');
xml=xml.replace(/\s*<url>\s*<loc>[^<]*\/reading-room\/seven-lines\/[\s\S]*?<\/url>/g,'');
const rows=[];
for(const locale of Object.keys(T)){
 const t=T[locale],data=[...localizedEditions(locale),...preservedEditions.map(ed=>({...ed,intro:ed.intro[locale]}))];
 for(const ed of [...editions,...preservedEditions])rows.push(`  <url><loc>${origin}/${locale}/reading-room/seven-lines/${ed.id}/</loc></url>`);
 const searchFile=path.join(ROOT,locale,'search-index.json');
 const search=JSON.parse(fs.readFileSync(searchFile,'utf8')).filter(v=>!v.id.startsWith('seven-lines-'));
 for(const ed of data)search.push({id:`seven-lines-${ed.id}`,title:`${t.brand} — ${issueTitle(t,ed)}`,summary:ed.intro,route:`/${locale}/reading-room/seven-lines/${ed.id}/`,type:'publication'});
 fs.writeFileSync(searchFile,JSON.stringify(search,null,2)+'\n');
 const mapFile=path.join(ROOT,locale,'sitemap/index.html');let html=fs.readFileSync(mapFile,'utf8');
 html=html.replace(/\s*<!-- seven-lines-directory:start -->[\s\S]*?<!-- seven-lines-directory:end -->/g,'');
 const section=`\n<!-- seven-lines-directory:start -->\n<section class="section container"><div class="section-heading"><h2>${esc(t.title)}</h2></div><ul class="directory">${[...data].reverse().map(ed=>`<li><a href="/${locale}/reading-room/seven-lines/${ed.id}/"><span>${esc(issueTitle(t,ed))}</span><span>${esc(ed.intro)}</span></a></li>`).join('')}</ul></section>\n<!-- seven-lines-directory:end -->\n`;
 html=html.replace(/\s*<\/main>/,section+'</main>');fs.writeFileSync(mapFile,html);
}
xml=xml.replace('</urlset>',rows.join('\n')+'\n</urlset>');fs.writeFileSync(file,xml);

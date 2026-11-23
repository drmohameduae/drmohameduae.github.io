const fs=require('node:fs'),path=require('node:path');
const {section,T}=require('./reading-room-section');
const ROOT=process.env.ROOT||path.join(__dirname,'..');
for(const loc of Object.keys(T)){
 const file=path.join(ROOT,loc,'reading-room/index.html');let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<link rel="stylesheet" href="\/assets\/seven-lines\.css(?:\?[^\"]*)?"\s*\/?\s*>/g,'');
 html=html.replace('<link rel="stylesheet" href="/assets/site.css" />','<link rel="stylesheet" href="/assets/site.css" />\n  <link rel="stylesheet" href="/assets/seven-lines.css?v=20261123" />');
 html=html.replace(/\s*<!-- seven-lines:start -->[\s\S]*?<!-- seven-lines:end -->/g,'');
 // The original Reading Room content is retained; the publication shelf follows its introduction.
 const anchor='<section class="section container">\n  <div class="section-heading"><h2';
 const at=html.indexOf(anchor,html.indexOf('<main'));
 if(at>=0)html=html.slice(0,at)+section(loc)+'\n'+html.slice(at);
 else html=html.replace('</main>',section(loc)+'\n</main>');
 fs.writeFileSync(file,html);
}

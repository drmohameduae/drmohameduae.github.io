/* Content-first magazine rendering. The original PDFs remain immutable downloads. */
const fs = require('node:fs');
const path = require('node:path');
const editions = require('./data/editions.json');
const T = require('./data/ui.json');
const media = require('./data/media.json');
const preservedEditions = require('./data/preserved-editions.json');
const { quotes, editorialNotes } = require('./data/breakers.json');
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const paras = a => (a || []).map(p => `<p>${esc(p)}</p>`).join('\n');
const localeNames = {en:'English',ar:'العربية',fr:'Français',es:'Español',ru:'Русский',zh:'中文'};
const captions = {
 'fc33c16d9186':{en:'Interlocking mechanisms: each part contributes to the whole.',ar:'آليات مترابطة: يسهم كل جزء في عمل المنظومة.',fr:'Des mécanismes imbriqués : chaque pièce contribue à l’ensemble.',es:'Mecanismos interconectados: cada pieza contribuye al conjunto.',ru:'Взаимосвязанные механизмы: каждая деталь служит целому.',zh:'相互衔接的机械部件：每一部分都为整体运转贡献力量。'},
 'f9e2c65585ae':{en:'A map and compass: a clear direction begins with perspective.',ar:'خريطة وبوصلة: وضوح الاتجاه يبدأ باتساع الرؤية.',fr:'Une carte et une boussole : une orientation claire commence par une vue d’ensemble.',es:'Un mapa y una brújula: una dirección clara empieza por la perspectiva.',ru:'Карта и компас: ясное направление начинается с понимания общей картины.',zh:'地图与指南针：清晰的方向始于开阔的视野。'},
 '82bd4e1b1dcc':{en:'A library: knowledge grows when it is shared.',ar:'مكتبة: تنمو المعرفة حين نتشاركها.',fr:'Une bibliothèque : le savoir grandit lorsqu’il se partage.',es:'Una biblioteca: el conocimiento crece cuando se comparte.',ru:'Библиотека: знания приумножаются, когда ими делятся.',zh:'图书馆：知识因分享而增长。'},
 'b8bd49d8f333':{en:'Precision in practice: ideas take shape through capability.',ar:'الدقة في العمل: تتحول الأفكار إلى واقع بفضل القدرة على التنفيذ.',fr:'La précision en action : les idées prennent forme grâce aux capacités.',es:'Precisión en la práctica: las capacidades dan forma a las ideas.',ru:'Точность на практике: возможности превращают идеи в реальность.',zh:'实践中的精度：能力让理念成为现实。'},
 '7f902a07fdee':{en:'A lighthouse in heavy seas: clarity when conditions become difficult.',ar:'منارة وسط أمواج عاتية: وضوح الرؤية حين تشتد الظروف.',fr:'Un phare dans une mer agitée : garder le cap dans la difficulté.',es:'Un faro entre grandes olas: claridad cuando las condiciones se vuelven difíciles.',ru:'Маяк в бурном море: ясный ориентир в трудных условиях.',zh:'惊涛中的灯塔：越是艰难，越需要清晰的方向。'},
 'bc8e016e2e1c':{en:'A honeycomb: repeated small structures create a resilient whole.',ar:'قرص عسل: وحدات صغيرة متكررة تبني كلاً متماسكاً.',fr:'Un rayon de miel : de petites structures répétées forment un ensemble résilient.',es:'Un panal: pequeñas estructuras repetidas crean un conjunto resiliente.',ru:'Пчелиные соты: повторяющиеся малые структуры создают устойчивое целое.',zh:'蜂巢：重复的小结构构成坚韧的整体。'}
};
function imageCaption(src,loc){return captions[path.basename(src,'.webp')]?.[loc] || T[loc].photoCaption;}
function issueTitle(t,ed){return `${t.months[ed.month]} ${ed.year}`;}
function localizedEditions(loc){
 if(loc === 'en') return editions;
 const file=path.join(__dirname,'data','locales',`${loc}.json`);
 if(!fs.existsSync(file)) throw new Error(`Missing complete translation: ${loc}`);
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!Array.isArray(data) || data.length!==editions.length) throw new Error(`Incomplete edition set: ${loc}`);
 for(let i=0;i<editions.length;i++) if(data[i].id!==editions[i].id || data[i].articles.length!==editions[i].articles.length) throw new Error(`Edition structure differs: ${loc}/${editions[i].id}`);
 return data;
}
function figure(src,loc,cls='sl-article__image'){
 const cap=imageCaption(src,loc);
 return `<figure class="${cls}"><img src="${esc(src)}" alt="${esc(cap)}" width="1600" height="1000" loading="lazy" decoding="async"><figcaption>${esc(cap)}</figcaption></figure>`;
}
function choosePhoto(ed,index){
 const pics=media[ed.id].photos.filter(p=>p.page>2);
 const article=ed.articles[index];
 return (pics.find(p=>p.page===article?.imagePage) || pics[index % pics.length]).path;
}
function buildEdition(t,ed,editionIndex){
 const loc=t.locale, title=issueTitle(t,ed), m=media[ed.id];
 const pages=[], toc=[];
 const add=(kind,label,html,extra={})=>{const index=pages.length;pages.push({kind,label,html,...extra});return index;};
 const coverPhoto=choosePhoto(ed,0);
 add('cover',t.cover,`<div class="sl-cover"><img class="sl-cover__photo" src="${coverPhoto}" alt="" width="1600" height="1000" decoding="async"><img class="sl-cover__mark" src="/assets/media/monogram.webp" alt="" width="300" height="399"><p class="sl-cover__eyebrow">${esc(t.tagline)}</p><p class="sl-cover__issue">${esc(title)} · ${esc(localeNames[loc])}</p><h2 class="sl-cover__title">${esc(t.brand)}</h2><p class="sl-cover__intro">${esc(ed.intro)}</p><p class="sl-cover__byline">${esc(t.byline)}</p></div>`,{thumbnail:m.cover});
 add('toc',t.contents,'');
 ed.articles.forEach((a,i)=>{
  const src=choosePhoto(ed,i), id=add('article',a.title,`<header class="sl-article__head"><p class="sl-kicker">${esc(t.article)} ${esc(a.num)} · ${esc(a.section)}</p><h3>${esc(a.title)}</h3></header><div class="sl-inbrief"><strong>${esc(t.inBrief)}</strong><p>${esc(a.inBrief)}</p></div>${figure(src,loc)}<div class="sl-article__text">${paras(a.intro)}${a.vs?`<div class="sl-vs"><div><strong>${esc(a.vs.leftLabel)}</strong><p>${esc(a.vs.leftSub)}</p></div><div><strong>${esc(a.vs.rightLabel)}</strong><p>${esc(a.vs.rightSub)}</p></div></div>`:''}</div>`,{thumbnail:src});
  toc.push({index:id,label:`${t.article} ${a.num}`,title:a.title});
  if(a.cont?.length || a.quote || a.frameworks?.length || a.steps?.length || a.takeaways?.length) add('article',`${a.title} · ${t.continuation}`,`<header class="sl-article__head"><p class="sl-kicker">${esc(a.section)} · ${esc(t.continuation)}</p><h3>${esc(a.contHeading || a.title)}</h3></header><div class="sl-article__text">${paras(a.cont)}${a.quote?`<blockquote class="sl-quote"><p>${esc(a.quote)}</p></blockquote>`:''}${a.frameworks?.length?`${a.frameworksTitle?`<p class="sl-kicker">${esc(a.frameworksLabel)}</p>`:''}<h4>${esc(a.frameworksTitle || a.frameworksLabel || t.frameworks)}</h4><ul class="sl-frameworks">${a.frameworks.map(f=>`<li><strong>${esc(f.label)}</strong><span>${esc(f.sub)}</span></li>`).join('')}</ul>`:''}${a.steps?.length?`<h4>${esc(a.stepsTitle || t.frameworks)}</h4><ol>${a.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}${a.takeaways?.length?`<aside class="sl-takeaways"><h4>${esc(t.takeaways)}</h4><ul>${a.takeaways.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></aside>`:''}</div>`);
  const quote=quotes[(editionIndex+i)%quotes.length];
  if(!quote.text[loc] || !quote.attribution[loc]) throw new Error(`Missing quote locale ${loc}: ${quote.id}`);
  const image=i%2===1?figure(src,loc,'sl-break__figure'):'';
  add('break',`${t.reflection} · ${quote.attribution[loc]}`,`<div class="sl-break"><p class="sl-kicker">${esc(t.reflection)}</p>${image}<blockquote class="sl-break__quote"><p>${esc(quote.text[loc])}</p></blockquote><p class="sl-break__attribution">${esc(quote.attribution[loc])}</p><p class="sl-break__source"><a href="${esc(quote.source.url)}" target="_blank" rel="noopener noreferrer">${esc(t.source)} · ${esc(quote.source.displayLabel[loc])}</a></p></div>`,{quoteId:quote.id});
 });
 const lab=ed.lab;
 let labHtml=`<div class="sl-lab"><p class="sl-kicker">${esc(t.lab)}</p><h3>${esc(lab.title)}</h3><p>${esc(lab.subtitle)}</p>`;
 if(lab.crossword)labHtml+=crossword(lab.crossword,t);
 labHtml+=`<ol class="sl-lab__items">${lab.items.map((item,i)=>`<li>${esc(item)}${lab.table?.afterItem===i?table(lab.table):''}</li>`).join('')}</ol>`;
 if(lab.table && lab.table.afterItem==null)labHtml+=table(lab.table);
 if(lab.reflection)labHtml+=`<p>${esc(lab.reflection)}</p>`;
 labHtml+=`<details class="sl-lab__guide"><summary>${esc(t.guide)}</summary><p>${esc(lab.guide)}</p></details></div>`;
 const labIndex=add('lab',lab.title,labHtml);toc.push({index:labIndex,label:t.lab,title:lab.title});
 add('backcover',t.backCover,`<div class="sl-backcover"><img src="/assets/media/monogram.webp" alt="" width="300" height="399"><p class="sl-kicker">${esc(t.brand)} · ${esc(title)}</p><p class="sl-backcover__quote">${esc(t.backQuote)}</p><div class="sl-backcover__lines" aria-hidden="true">${'<span></span>'.repeat(7)}</div><p>${esc(t.byline)}</p><p class="sl-backcover__tag">${esc(t.endOfEdition)}</p><a href="/${loc}/reading-room/#seven-lines-monthly-editions">${esc(t.allEditions)}</a></div>`);
 pages[1].html=`<div class="sl-toc"><p class="sl-kicker">${esc(t.brand)} · ${esc(title)}</p><h3>${esc(t.contents)}</h3><ol class="sl-toc__list">${toc.map(x=>`<li><a href="#page-${x.index+1}" data-sl-goto="${x.index}"><span class="sl-toc__label">${esc(x.label)}</span><span class="sl-toc__title">${esc(x.title)}</span><span class="sl-toc__page">${x.index+1}</span></a></li>`).join('')}</ol><p class="sl-book__meta">${esc(t.editionTranslationNotice)}</p></div>`;
 return {total:pages.length,pages:pages.map((p,i)=>({ ...p,html:`<section class="sl-page sl-page--${p.kind}" id="page-${i+1}" data-sl-page="${i}" data-sl-label="${esc(p.label)}"${p.quoteId?` data-quote-id="${p.quoteId}"`:''} aria-label="${esc(t.page)} ${i+1} ${esc(t.of)} ${pages.length}"><div class="sl-page__body">${p.html}<span class="sl-folio">${esc(t.brand)} · ${i+1} / ${pages.length}</span></div></section>`}))};
}
function table(data){return `<div class="sl-table-wrap"><table><thead><tr>${data.headers.map(v=>`<th scope="col">${esc(v)}</th>`).join('')}</tr></thead><tbody>${data.rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function crossword(c,t){
 const rows=c.grid || [];const nums=c.numbers || {};
 return `<div class="sl-crossword" lang="en" dir="ltr" aria-label="${esc(t.lab)}"><table><tbody>${rows.map((row,r)=>`<tr>${(Array.isArray(row)?row:[...row]).map((cell,col)=>{const blocked=cell==='#'||cell===0||cell===null;const n=(Array.isArray(nums)?nums[r]?.[col]:nums[`${r},${col}`]||nums[`${r}-${col}`])||'';return `<td class="${blocked?'sl-crossword__blocked':'sl-crossword__cell'}">${blocked?'':`<span>${esc(n)}</span><input maxlength="1" aria-label="${esc(t.lab)} ${r+1}, ${col+1}" autocomplete="off" spellcheck="false" inputmode="text">`}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
module.exports={preservedEditions,buildEdition,localizedEditions,T,editions,media,quotes,esc,issueTitle,localeNames,imageCaption};

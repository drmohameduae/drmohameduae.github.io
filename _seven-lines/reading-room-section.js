const {T,editions,preservedEditions,media,esc,issueTitle}=require('./gen');
function section(locale){
 const t=T[locale];
 return `<!-- seven-lines:start -->
<section class="section container sl-editions" id="seven-lines-monthly-editions" aria-labelledby="seven-lines-editions">
 <span id="seven-lines-monthly-edition" class="sl-editions__anchor" aria-hidden="true"></span>
 <div class="section-heading"><p class="kicker section-heading__subtitle">${esc(t.collection)}</p><h2 id="seven-lines-editions">${esc(t.title)}</h2></div>
 <p class="lede">${esc(t.intro)}</p>
 <ul class="sl-editions__grid">${[...editions,...preservedEditions].reverse().map(ed=>{const m=media[ed.id]||ed;return `<li class="sl-edition-card"><a class="sl-edition-card__link" href="/${locale}/reading-room/seven-lines/${ed.id}/"><span class="sl-edition-card__media"><img src="${m.cover}" alt="${esc(t.brand+' · '+issueTitle(t,ed))}" width="714" height="1011" loading="lazy" decoding="async"></span><span class="sl-edition-card__body"><span class="sl-edition-card__issue">${esc(issueTitle(t,ed))}</span><span class="sl-edition-card__cta">${esc(t.read)}</span></span></a>${m.originalPdf?`<a class="sl-edition-card__download" href="${m.originalPdf}" download>${esc(t.download)}</a>`:""}</li>`;}).join('\n')}</ul>
</section>
<!-- seven-lines:end -->`;
}
module.exports={section,T};

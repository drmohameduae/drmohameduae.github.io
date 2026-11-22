/* Seven Lines magazine page generator — emits locale-specific page fragments.
   Framework-free string templates. Reads extracted JSON. */
const editions = require('./data/editions.json');
const { breakers } = require('./data/breakers.json');

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const monthNum = { June: 6, July: 7, August: 8, September: 9, October: 10 };

const articleImages = [
  { src: 'dunes_sky.jpg',              en: 'The dunes of the Emirates at first light',  ar: 'كثبان الإمارات عند أول الضياء' },
  { src: 'hero_palms_road.jpg',        en: 'A palm-lined road toward the horizon',      ar: 'طريق مكسوّ بالنخيل نحو الأفق' },
  { src: 'city_skyline.jpg',           en: 'The city and the Gulf beyond',              ar: 'المدينة والخليج خلفها' },
  { src: 'mosque_courtyard_palms.jpg', en: 'Courtyard palms, quiet at midday',          ar: 'نخيل الفناء، هادئ عند منتصف النهار' },
  { src: 'desert_road_palms.jpg',      en: 'A road through the desert plantations',     ar: 'طريق عبر مزارع الصحراء' },
  { src: 'mosque_courtyard_domes.jpg', en: 'Domes over the old courtyard',              ar: 'قباب الفناء العتيق' },
];

const T = {
  en: { locale:'en', dir:'ltr', month:{June:'June',July:'July',August:'August',September:'September',October:'October'},
    sevenLines:'Seven Lines', tagline:'A monthly review of governance, knowledge and the examined life',
    impossible:'The impossible is simply the possible that has not yet found its path.',
    byline:'Dr. Mohamed Yousef Almadfaei', inBrief:'In brief', vsSub:'Two ways of seeing',
    contHeading:'Continuing the argument', takeaways:'Takeaways', labLabel:'The Leadership Lab',
    labGuide:'Discussion guide', contents:'Contents', issueNo:'Issue No.',
    backQuote:'Leave behind ideas that continue serving people long after we are gone.', backTag:'Founder’s Edition',
    article:'Article', page:'page', of:'of', prev:'Previous', next:'Next' },
  ar: { locale:'ar', dir:'rtl', month:{June:'يونيو',July:'يوليو',August:'أغسطس',September:'سبتمبر',October:'أكتوبر'},
    sevenLines:'سطرون', tagline:'مراجعة شهرية في الحوكمة والعلم والحياة المدروسة',
    impossible:'المستحيل هو الممكن الذي لم يجد طريقه بعد.',
    byline:'د. محمد بن يوسف المدفعي', inBrief:'في موجز', vsSub:'طريقان في الرؤية',
    contHeading:'استكمالاً للحوار', takeaways:'خلاصات', labLabel:'مختبر القيادة',
    labGuide:'دليل النقاش', contents:'المحتويات', issueNo:'العدد',
    backQuote:'اتركوا خلفكم أفكاراً تواصل خدمة الناس بعد رحيلنا بزمن طويل.', backTag:'نسخة المؤسس',
    article:'مقال', page:'صفحة', of:'من', prev:'السابق', next:'التالي' },
  es: { locale:'es', dir:'ltr', month:{June:'junio',July:'julio',August:'agosto',September:'septiembre',October:'octubre'},
    sevenLines:'Seven Lines', tagline:'Una revisión mensual de gobernanza, conocimiento y la vida examinada',
    impossible:'Lo imposible es solo lo posible que aún no ha encontrado su camino.',
    byline:'Dr. Mohamed Yousef Almadfaei', inBrief:'En síntesis', vsSub:'Dos formas de ver',
    contHeading:'Continuando el argumento', takeaways:'Conclusiones', labLabel:'El Laboratorio de Liderazgo',
    labGuide:'Guía de discusión', contents:'Contenido', issueNo:'Núm.',
    backQuote:'Dejen atrás ideas que sigan sirviendo a la gente mucho después de que partamos.', backTag:'Edición del Fundador',
    article:'Artículo', page:'página', of:'de', prev:'Anterior', next:'Siguiente' },
  fr: { locale:'fr', dir:'ltr', month:{June:'juin',July:'juillet',August:'août',September:'septembre',October:'octobre'},
    sevenLines:'Seven Lines', tagline:'Une revue mensuelle de gouvernance, de savoir et de vie examinée',
    impossible:'L’impossible est simplement le possible qui n’a pas encore trouvé son chemin.',
    byline:'Dr. Mohamed Yousef Almadfaei', inBrief:'En bref', vsSub:'Deux manières de voir',
    contHeading:'Poursuivre l’argument', takeaways:'À retenir', labLabel:'Le Laboratoire du Leadership',
    labGuide:'Guide de discussion', contents:'Sommaire', issueNo:'N°',
    backQuote:'Laissez derrière vous des idées qui continuent de servir les gens bien après notre départ.', backTag:'Édition du Fondateur',
    article:'Article', page:'page', of:'sur', prev:'Précédent', next:'Suivant' },
  ru: { locale:'ru', dir:'ltr', month:{June:'июнь',July:'июль',August:'август',September:'сентябрь',October:'октябрь'},
    sevenLines:'Seven Lines', tagline:'Ежемесячный обзор управления, знания и исследованной жизни',
    impossible:'Невозможное — это просто возможное, которое ещё не нашло свой путь.',
    byline:'Dr. Mohamed Yousef Almadfaei', inBrief:'Кратко', vsSub:'Два взгляда',
    contHeading:'Продолжая рассуждение', takeaways:'Выводы', labLabel:'Лаборатория лидерства',
    labGuide:'Руководство для обсуждения', contents:'Содержание', issueNo:'№',
    backQuote:'Оставьте после себя идеи, которые продолжат служить людям задолго после нашего ухода.', backTag:'Издание Основателя',
    article:'Статья', page:'стр.', of:'из', prev:'Назад', next:'Вперёд' },
  zh: { locale:'zh', dir:'ltr', month:{June:'六月',July:'七月',August:'八月',September:'九月',October:'十月'},
    sevenLines:'七行', tagline:'关于治理、知识与省思人生的月刊',
    impossible:'所谓不可能，不过是尚未找到道路的可能。',
    byline:'穆罕默德·优素福·马达法伊博士', inBrief:'提要', vsSub:'两种视角',
    contHeading:'延续论述', takeaways:'要点', labLabel:'领导力实验室',
    labGuide:'讨论指南', contents:'目录', issueNo:'第',
    backQuote:'留下一些理念，让它们在我们离去很久之后仍服务于人民。', backTag:'创始人版',
    article:'文章', page:'页', of:'共', prev:'上一页', next:'下一页' },
};

const goldDiamond = '<span class="sl-diamond" aria-hidden="true"></span>';

function pageShell(t, ed, idx, total, inner, cls = '') {
  return `<div class="sl-page ${cls}" data-sl-page="${idx}" role="group" aria-label="${esc(t.page)} ${idx + 1} ${esc(t.of)} ${total}">
${inner}
    <span class="sl-folio" aria-hidden="true">${idx + 1} / ${total}</span>
  </div>`;
}

function coverPage(t, ed, idx, total) {
  const month = t.month[ed.month];
  const inner = `<div class="sl-cover">
      <p class="sl-cover__eyebrow">${esc(t.sevenLines)} · ${esc(t.tagline)}</p>
      <p class="sl-cover__issue">${esc(t.issueNo)} ${monthNum[ed.month]} — ${ed.year}</p>
      <h2 class="sl-cover__title">${esc(month)} <span>${ed.year}</span></h2>
      <div class="sl-cover__rule">${goldDiamond}</div>
      <p class="sl-cover__intro">${esc(ed.intro)}</p>
      <figure class="sl-cover__figure"><img src="/images/dunes_sky.jpg" alt="" loading="lazy" decoding="async" /></figure>
      <p class="sl-cover__byline">${esc(t.byline)}</p>
    </div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--cover');
}

function contentsPage(t, ed, idx, total, flatList) {
  const items = flatList.map((f) =>
    `<li><button type="button" data-sl-goto="${f.idx}"><span class="sl-toc__label">${esc(f.label)}</span><span class="sl-toc__title">${esc(f.title)}</span><span class="sl-toc__page">${f.idx + 1}</span></button></li>`
  ).join('\n');
  const inner = `<div class="sl-toc">
      <p class="sl-kicker">${esc(t.contents)}</p>
      <ol class="sl-toc__list">${items}</ol>
    </div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--toc');
}

function articleOpener(t, ed, a, artIdx, idx, total) {
  const img = articleImages[artIdx % articleImages.length];
  const cap = t.dir === 'rtl' ? img.ar : img.en;
  const inner = `<div class="sl-article-open">
      <p class="sl-kicker">${esc(t.article)} ${String(artIdx + 1).padStart(2, '0')}</p>
      <p class="sl-article-open__section">${esc(a.section)}</p>
      <h3 class="sl-article-open__title">${esc(a.title)}</h3>
      <p class="sl-article-open__inbrief"><span class="sl-article-open__inbrief-label">${esc(t.inBrief)}</span>${esc(a.inBrief)}</p>
      <figure class="sl-article-open__figure"><img src="/images/${img.src}" alt="${esc(cap)}" loading="lazy" decoding="async" /><figcaption>${esc(cap)}</figcaption></figure>
    </div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--open');
}

function articleText(t, ed, a, idx, total) {
  const intro = a.intro.map((p) => `<p>${esc(p)}</p>`).join('');
  const vs = `<div class="sl-vs">
      <p class="sl-vs__sub">${esc(t.vsSub)}</p>
      <div class="sl-vs__pair">
        <div class="sl-vs__side"><span class="sl-vs__label">${esc(a.vs.leftLabel)}</span><span class="sl-vs__sub2">${esc(a.vs.leftSub)}</span></div>
        <span class="sl-vs__mark" aria-hidden="true">×</span>
        <div class="sl-vs__side"><span class="sl-vs__label">${esc(a.vs.rightLabel)}</span><span class="sl-vs__sub2">${esc(a.vs.rightSub)}</span></div>
      </div>
    </div>`;
  const cont = `<h4 class="sl-cont-heading">${esc(t.contHeading)}</h4>` + a.cont.map((p) => `<p>${esc(p)}</p>`).join('');
  const quote = a.quote ? `<blockquote class="sl-quote"><p>${esc(a.quote)}</p></blockquote>` : '';
  const fw = `<p class="sl-fw__label">${esc(a.frameworksLabel)}</p><ul class="sl-fw">${a.frameworks.map((f) => `<li><strong>${esc(f.label)}</strong><span>${esc(f.sub)}</span></li>`).join('')}</ul>`;
  const take = `<div class="sl-take"><p class="sl-take__label">${esc(t.takeaways)}</p><ul>${a.takeaways.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></div>`;
  const inner = `<div class="sl-article-text prose">${intro}${vs}${cont}${quote}${fw}${take}</div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--text');
}

function ornamentBreaker(t, ed, b, idx, total) {
  const ghost = esc(b.arabic.split(' ').slice(0, 2).join(' '));
  const inner = `<div class="sl-break sl-break--ornament">
      <span class="sl-break__ghost" lang="ar" dir="rtl" aria-hidden="true">${ghost}</span>
      <div class="sl-break__frame">
        <span class="sl-break__mark" aria-hidden="true">&ldquo;</span>
        <p class="sl-break__arabic" lang="ar" dir="rtl">${esc(b.arabic)}</p>
        <div class="sl-break__divider">${goldDiamond}</div>
        <p class="sl-break__english">${esc(b.english)}</p>
        <p class="sl-break__attr"><span class="sl-break__attr-line"></span>${esc(b.attributionArabic)}<span class="sl-break__era">${esc(b.era)}</span></p>
      </div>
    </div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--break');
}

function splitBreaker(t, ed, b, idx, total) {
  const cap = t.dir === 'rtl' ? (b.captionArabic || b.caption) : b.caption;
  const inner = `<div class="sl-break sl-break--split">
      <div class="sl-break__media"><img src="${esc(b.image)}" alt="${esc(cap || '')}" loading="lazy" decoding="async" />${cap ? `<p class="sl-break__caption">${esc(cap)}</p>` : ''}</div>
      <div class="sl-break__quote">
        <p class="sl-break__arabic" lang="ar" dir="rtl">${esc(b.arabic)}</p>
        <div class="sl-break__divider">${goldDiamond}</div>
        <p class="sl-break__english">${esc(b.english)}</p>
        <p class="sl-break__attr"><span class="sl-break__attr-line"></span>${esc(b.attribution)}<span class="sl-break__era">${esc(b.era)}</span></p>
      </div>
    </div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--break');
}

function ledgerBreaker(t, ed, b, gapIdx, idx, total) {
  const inner = `<div class="sl-break sl-break--ledger">
      <div class="sl-break__toprule">${goldDiamond}</div>
      <div class="sl-break__block">
        <span class="sl-break__num" aria-hidden="true">${String(gapIdx + 1).padStart(2, '0')}</span>
        <p class="sl-break__arabic" lang="ar" dir="rtl">${esc(b.arabic)}</p>
        <p class="sl-break__english">${esc(b.english)}</p>
        <p class="sl-break__attr"><span class="sl-break__attr-line"></span>${esc(b.attribution)}<span class="sl-break__era">${esc(b.era)}</span></p>
      </div>
    </div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--break');
}

function breakerPage(t, ed, b, gapIdx, idx, total) {
  if (b.variant === 'split' && b.image) return splitBreaker(t, ed, b, idx, total);
  if (b.variant === 'ledger') return ledgerBreaker(t, ed, b, gapIdx, idx, total);
  return ornamentBreaker(t, ed, b, idx, total);
}

function labPage(t, ed, idx, total) {
  const inner = `<div class="sl-lab">
      <p class="sl-kicker">${esc(t.labLabel)}</p>
      <h3 class="sl-lab__title">${esc(ed.lab.title)}</h3>
      <p class="sl-lab__sub">${esc(ed.lab.subtitle)}</p>
      <ol class="sl-lab__items">${ed.lab.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>
      <div class="sl-lab__guide"><p class="sl-lab__guide-label">${esc(t.labGuide)}</p><p>${esc(ed.lab.guide)}</p></div>
    </div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--lab');
}

function backCoverPage(t, ed, idx, total) {
  const inner = `<div class="sl-backcover">
      <div class="sl-backcover__frame">
        <span class="sl-break__mark" aria-hidden="true">&ldquo;</span>
        <p class="sl-backcover__impossible" lang="${t.dir === 'rtl' ? 'ar' : 'en'}" dir="${t.dir}">${esc(t.impossible)}</p>
        <div class="sl-break__divider">${goldDiamond}</div>
        <p class="sl-backcover__quote">${esc(t.backQuote)}</p>
        <p class="sl-backcover__tag">${esc(t.sevenLines)} · ${esc(t.backTag)}</p>
      </div>
    </div>`;
  return pageShell(t, ed, idx, total, inner, 'sl-page--backcover');
}

function buildEdition(t, ed, editionIndex) {
  const pages = []; const flat = []; let idx = 0;
  pages.push(coverPage(t, ed, idx, 0)); idx++;
  pages.push('__TOC__'); idx++;
  ed.articles.forEach((a, i) => {
    flat.push({ idx, label: `${t.article} ${i + 1}`, title: a.title });
    pages.push(articleOpener(t, ed, a, i, idx, 0)); idx++;
    pages.push(articleText(t, ed, a, idx, 0)); idx++;
    if (i < ed.articles.length - 1) {
      const b = breakers[(editionIndex * 5 + i) % breakers.length];
      pages.push(breakerPage(t, ed, b, i, idx, 0)); idx++;
    }
  });
  flat.push({ idx, label: t.labLabel, title: ed.lab.title });
  pages.push(labPage(t, ed, idx, 0)); idx++;
  pages.push(backCoverPage(t, ed, idx, 0)); idx++;
  const total = idx;
  const resolved = pages.map((p, i) => {
    if (p === '__TOC__') return contentsPage(t, ed, i, total, flat);
    return p.replace(` ${esc(t.of)} 0"`, ` ${esc(t.of)} ${total}"`).replace(` / 0</span>`, ` / ${total}</span>`);
  });
  return { ed, total, pages: resolved };
}

module.exports = { buildEdition, T, editions, breakers, monthNum, articleImages, esc };

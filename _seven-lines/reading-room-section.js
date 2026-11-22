/* Builds the "Seven Lines Monthly Editions" archive section for a locale. */
const editions = require('./data/editions.json');

const T = {
  en: { locale:'en', month:{June:'June',July:'July',August:'August',September:'September',October:'October'},
    label:'The Collection', headline:'The Seven Lines Monthly Editions',
    intro:'A monthly review of governance, knowledge and the examined life. Each edition opens as a magazine — turn the pages, read the articles, and pause at the breakers between them, where voices from across history speak in Arabic and English.',
    read:'Read the edition' },
  ar: { locale:'ar', month:{June:'يونيو',July:'يوليو',August:'أغسطس',September:'سبتمبر',October:'أكتوبر'},
    label:'المجموعة', headline:'إصدارات سطرون الشهرية',
    intro:'مراجعة شهرية في الحوكمة والعلم والحياة المدروسة. يُفتتح كل إصدار كمجلة — تقلّب الصفحات، وتقرأ المقالات، وتتوقف عند الفواصل بينها حيث تتحدث أصوات من مختلف التاريخ بالعربية والإنجليزية.',
    read:'اقرأ الإصدار' },
  es: { locale:'es', month:{June:'junio',July:'julio',August:'agosto',September:'septiembre',October:'octubre'},
    label:'La Colección', headline:'Las Ediciones Mensuales de Seven Lines',
    intro:'Una revisión mensual de gobernanza, conocimiento y la vida examinada. Cada edición se abre como una revista: hojea las páginas, lee los artículos y detente en los separadores, donde voces de la historia hablan en árabe e inglés.',
    read:'Leer la edición' },
  fr: { locale:'fr', month:{June:'juin',July:'juillet',August:'août',September:'septembre',October:'octobre'},
    label:'La Collection', headline:'Les Éditions Mensuelles de Seven Lines',
    intro:'Une revue mensuelle de gouvernance, de savoir et de vie examinée. Chaque édition s’ouvre comme un magazine : tournez les pages, lisez les articles, et marquez une pause aux interludes, où des voix de l’histoire parlent en arabe et en anglais.',
    read:'Lire l’édition' },
  ru: { locale:'ru', month:{June:'июнь',July:'июль',August:'август',September:'сентябрь',October:'октябрь'},
    label:'Коллекция', headline:'Ежемесячные выпуски Seven Lines',
    intro:'Ежемесячный обзор управления, знания и исследованной жизни. Каждый выпуск открывается как журнал — листайте страницы, читайте статьи и останавливайтесь на разделителях, где голоса из истории говорят на арабском и английском.',
    read:'Читать выпуск' },
  zh: { locale:'zh', month:{June:'六月',July:'七月',August:'八月',September:'九月',October:'十月'},
    label:'合集', headline:'《七行》月度刊',
    intro:'关于治理、知识与省思人生的月刊。每一期都以杂志形式打开——翻阅书页，阅读文章，并在篇章之间的插页稍作停留，历代先贤以阿拉伯文与英文在此发声。',
    read:'阅读本期' },
};

const order = ['October', 'September', 'August', 'July', 'June'];
const covers = {
  'october-2026':   { img: 'city_skyline.jpg' },
  'september-2026': { img: 'desert_road_palms.jpg' },
  'august-2026':    { img: 'mosque_courtyard_palms.jpg' },
  'july-2026':      { img: 'hero_palms_road.jpg' },
  'june-2026':      { img: 'mosque_courtyard_domes.jpg' },
};

function section(locale) {
  const t = T[locale];
  const cards = order.map((m) => {
    const ed = editions.find((e) => e.month === m);
    const c = covers[ed.id];
    const month = t.month[ed.month];
    const href = `/${locale}/reading-room/seven-lines/${ed.id}/`;
    return `    <li class="card sl-edition-card">
      <a class="sl-edition-card__link" href="${href}">
        <span class="sl-edition-card__media"><img src="/images/${c.img}" alt="" loading="lazy" decoding="async" /></span>
        <span class="sl-edition-card__body">
          <span class="sl-edition-card__issue">${month} ${ed.year}</span>
          <span class="sl-edition-card__cta">${t.read}</span>
        </span>
      </a>
    </li>`;
  }).join('\n');

  return `<section class="section container sl-editions" id="seven-lines-monthly-editions">
  <div class="section-heading">
    <p class="kicker section-heading__subtitle">${t.label}</p>
    <h2 id="seven-lines-editions">${t.headline}</h2>
  </div>
  <p class="lede">${t.intro}</p>
  <ul class="card-grid sl-editions__grid">
${cards}
  </ul>
</section>`;
}

module.exports = { section, T };

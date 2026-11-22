/* Assembles full Seven Lines magazine HTML documents per locale. */
const fs = require('fs');
const path = require('path');
const { buildEdition, T, editions } = require('./gen');

// In CI the generator lives at <repo>/_seven-lines/, so the site root is the
// parent directory. Override with OUT=... for local testing.
const OUT = process.env.OUT || require('path').join(__dirname, '..');

function head(t, ed) {
  const month = t.month[ed.month];
  const url = `https://drmohamed.net/${t.locale}/reading-room/seven-lines/${ed.id}`;
  const title = t.locale === 'ar'
    ? `د. محمد بن يوسف المدفعي | ${t.sevenLines} — ${month} ${ed.year}`
    : `Dr. Mohamed Yousef Almadfaei | ${t.sevenLines} — ${month} ${ed.year}`;
  const alts = ['en','ar','zh','fr','ru','es'].map((l) =>
    `<link rel="alternate" hreflang="${l}" href="https://drmohamed.net/${l}/reading-room/seven-lines/${ed.id}" />`).join('\n  ');
  return `<!DOCTYPE html>
<html lang="${t.locale}" dir="${t.dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${t.tagline}" />
  <link rel="canonical" href="${url}" />
  ${alts}
  <link rel="alternate" hreflang="x-default" href="https://drmohamed.net/en/reading-room/seven-lines/${ed.id}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="DRMOHAMED.NET" />
  <meta property="og:title" content="${t.sevenLines} — ${month} ${ed.year} | DRMOHAMED.NET" />
  <meta property="og:description" content="${t.tagline}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:locale" content="${t.locale}" />
  <meta name="twitter:card" content="summary" />
  <meta name="theme-color" content="#F7F5F0" />
  <link rel="icon" href="/assets/favicon.png" type="image/png" />
  <link rel="stylesheet" href="/assets/site.css" />
  <link rel="stylesheet" href="/assets/seven-lines.css" />
  <link rel="stylesheet" href="/assets/print.css" media="print" />
  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/archivo-black-400-latin.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/noto-sans-400-latin.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/noto-sans-arabic-400-arabic.woff2" crossorigin />
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","name":"${t.sevenLines} ${month} ${ed.year}","inLanguage":"${t.locale}","url":"${url}"}</script>
</head>`;
}

const NAV = {
  en: [['/en','Home'],['/en/stewardship','The Journey'],['/en/emirati-identity','Emirati Identity'],['/en/initiatives','Strategic Aspirations'],['/en/reading-room','Digital Liwan'],['/en/contact','Marsa Al Wasl']],
  ar: [['/ar','الرئيسية'],['/ar/stewardship','المسيرة'],['/ar/emirati-identity','الهوية الإماراتية'],['/ar/initiatives','تطلعات استراتيجية'],['/ar/reading-room','الليوان الرقمي'],['/ar/contact','مرسى الوصل']],
  es: [['/es','Inicio'],['/es/stewardship','El Recorrido'],['/es/emirati-identity','Identidad Emiratí'],['/es/initiatives','Aspiraciones Estratégicas'],['/es/reading-room','Liwan Digital'],['/es/contact','Marsa Al Wasl']],
  fr: [['/fr','Accueil'],['/fr/stewardship','Le Parcours'],['/fr/emirati-identity','Identité Émirienne'],['/fr/initiatives','Aspirations Stratégiques'],['/fr/reading-room','Liwan Numérique'],['/fr/contact','Marsa Al Wasl']],
  ru: [['/ru','Главная'],['/ru/stewardship','Путь'],['/ru/emirati-identity','Эмиратская идентичность'],['/ru/initiatives','Стратегические устремления'],['/ru/reading-room','Цифровой Ливан'],['/ru/contact','Марса Аль Васл']],
  zh: [['/zh','首页'],['/zh/stewardship','历程'],['/zh/emirati-identity','阿联酋认同'],['/zh/initiatives','战略愿景'],['/zh/reading-room','数字利万'],['/zh/contact','玛尔萨·阿尔·瓦斯拉']],
};

function masthead(t) {
  const currentPath = `/${t.locale}/reading-room`;
  const items = NAV[t.locale].map(([href, label]) => {
    const cur = (currentPath === href || (currentPath.startsWith(href) && href !== `/${t.locale}`)) ? ' aria-current="page"' : '';
    return `\n      <li><a href="${href}"${cur}>${label}</a></li>`;
  }).join('');
  const nameAr = '<span class="wordmark__name-ar" lang="ar" dir="rtl">د. محمــد بــن يوســف المــدفـعــي</span>';
  const nameEn = '<span class="wordmark__name-en" lang="en">Dr. Mohamed Yousef Almadfaei</span>';
  const names = t.dir === 'rtl'
    ? `${nameEn}<img class="wordmark__flag" src="/assets/media/uae-flag-brush-strip.png" alt="" width="22" height="22" decoding="async" />${nameAr}`
    : `${nameAr}<img class="wordmark__flag" src="/assets/media/uae-flag-brush-strip.png" alt="" width="22" height="22" decoding="async" />${nameEn}`;
  const opts = ['en','ar','zh','fr','ru','es'].map((l) => {
    const nm = { en:'English', ar:'العربية', zh:'中文', fr:'Français', ru:'Русский', es:'Español' }[l];
    return `<option value="${l}"${l === t.locale ? ' selected' : ''}>${nm}</option>`;
  }).join('');
  const yaqoot = t.locale === 'ar' ? 'اسأل ياقوت' : 'Ask Yaqoot';
  const menuLbl = t.locale === 'ar' ? 'القائمة' : 'Menu';
  return `<header class="masthead">
  <div class="container masthead__inner">
    <a class="wordmark" href="/${t.locale}/"><img class="monogram" src="/assets/media/monogram.webp" alt="" width="300" height="399" decoding="async" /><span class="wordmark__names">${names}</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" data-nav-toggle>
      <span class="visually-hidden">${menuLbl}</span>
      <span class="nav-toggle__icon" aria-hidden="true"><span></span><span></span><span></span></span>
    </button>
    <nav class="primary-nav" id="primary-nav" aria-label="Primary" hidden data-primary-nav>
      <ul>${items}
      </ul>
    </nav>
    <div class="masthead__controls">
      <a class="masthead__brand-link" href="https://www.nationbrand.ae" target="_blank" rel="noopener"><img class="masthead__brand" src="/assets/media/uae-nation-brand-160.webp" alt="The Emirates — الإمارات" width="30" height="40" decoding="async" /></a>
      <div class="language-selector">
        <label class="visually-hidden" for="language-select">Language</label>
        <select id="language-select" data-language-select data-current-locale="${t.locale}">${opts}</select>
      </div>
      <a class="yaqoot-launcher" href="/${t.locale}/yaqoot">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="7" fill="none" stroke="#2D4030" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" fill="#2D4030"/></svg>
        <span>${yaqoot}</span>
      </a>
    </div>
  </div>
</header>`;
}

const FOOTER = {
  en: { nav:'Trust and legal', links:[['/en/privacy','Privacy'],['/en/terms','Terms'],['/en/accessibility','Accessibility'],['/en/ai-notice','Responsible AI'],['/en/contact','Contact'],['/en/sitemap','Sitemap']], closing:'Leave behind ideas that continue serving people long after we are gone.', copy:'© 2026 Dr. Mohamed Yousef Almadfaei. All rights reserved.' },
  ar: { nav:'الثقة والشؤون القانونية', links:[['/ar/privacy','الخصوصية'],['/ar/terms','الشروط'],['/ar/accessibility','سهولة الوصول'],['/ar/ai-notice','الذكاء الاصطناعي المسؤول'],['/ar/contact','تواصل'],['/ar/sitemap','خريطة الموقع']], closing:'اتركوا خلفكم أفكاراً تواصل خدمة الناس بعد رحيلنا بزمن طويل.', copy:'© 2026 الدكتور محمد يوسف المدفعي. جميع الحقوق محفوظة.' },
  es: { nav:'Confianza y legal', links:[['/es/privacy','Privacidad'],['/es/terms','Términos'],['/es/accessibility','Accesibilidad'],['/es/ai-notice','IA Responsable'],['/es/contact','Contacto'],['/es/sitemap','Mapa del sitio']], closing:'Dejen atrás ideas que sigan sirviendo a la gente mucho después de que partamos.', copy:'© 2026 Dr. Mohamed Yousef Almadfaei. Todos los derechos reservados.' },
  fr: { nav:'Confiance et légal', links:[['/fr/privacy','Confidentialité'],['/fr/terms','Conditions'],['/fr/accessibility','Accessibilité'],['/fr/ai-notice','IA Responsable'],['/fr/contact','Contact'],['/fr/sitemap','Plan du site']], closing:'Laissez derrière vous des idées qui continuent de servir les gens bien après notre départ.', copy:'© 2026 Dr. Mohamed Yousef Almadfaei. Tous droits réservés.' },
  ru: { nav:'Доверие и право', links:[['/ru/privacy','Конфиденциальность'],['/ru/terms','Условия'],['/ru/accessibility','Доступность'],['/ru/ai-notice','Ответственный ИИ'],['/ru/contact','Контакт'],['/ru/sitemap','Карта сайта']], closing:'Оставьте после себя идеи, которые продолжат служить людям задолго после нашего ухода.', copy:'© 2026 Др. Мохаммед Юсуф Альмадафаи. Все права защищены.' },
  zh: { nav:'信任与法律', links:[['/zh/privacy','隐私'],['/zh/terms','条款'],['/zh/accessibility','无障碍'],['/zh/ai-notice','负责任的人工智能'],['/zh/contact','联系'],['/zh/sitemap','网站地图']], closing:'留下一些理念，让它们在我们离去很久之后仍服务于人民。', copy:'© 2026 穆罕默德·优素福·马达法伊博士。保留所有权利。' },
};

function footer(t) {
  const f = FOOTER[t.locale];
  const links = f.links.map(([h, l]) => `\n      <li><a href="${h}">${l}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="container">
    <nav aria-label="${f.nav}">
      <ul>${links}
      </ul>
    </nav>
    <p class="closing-line">${f.closing}</p>
    <p class="copyright">${f.copy}</p>
  </div>
</footer>
  <script src="/assets/site.js" defer></script>
  <script src="/assets/seven-lines.js" defer></script>`;
}

const order = ['October', 'September', 'August', 'July', 'June'];

for (const locale of Object.keys(T)) {
  const t = T[locale];
  order.forEach((monthName, editionIndex) => {
    const ed = editions.find((e) => e.month === monthName);
    const { total, pages } = buildEdition(t, ed, editionIndex);
    const month = t.month[ed.month];
    const book = pages.join('\n');
    const home = `/${t.locale}/reading-room`;
    const html = `${head(t, ed)}
<body>
  <a class="skip-link" href="#main-content">${t.locale === 'ar' ? 'تخطَّ إلى المحتوى الرئيسي' : 'Skip to main content'}</a>
  ${masthead(t)}
  <nav class="breadcrumbs container" aria-label="Breadcrumb"><ol><li><a href="/${t.locale}">${t.locale === 'ar' ? 'الرئيسية' : 'Home'}</a></li><li><a href="${home}">${t.locale === 'ar' ? 'غرفة القراءة' : 'Reading Room'}</a></li><li aria-current="page">${t.sevenLines} — ${month} ${ed.year}</li></ol></nav>
  <main id="main-content">
    <section class="section container">
      <div class="sl-book" data-sl-book data-total="${total}">
        <div class="sl-book__stage">
<div class="sl-book__sizer" aria-hidden="true"></div>
${book}
        </div>
        <div class="sl-book__controls">
          <button type="button" class="sl-nav" data-sl-prev>${t.prev}</button>
          <div class="sl-book__progress" data-sl-progress role="status" aria-live="polite"></div>
          <button type="button" class="sl-nav" data-sl-next>${t.next}</button>
        </div>
        <div class="container"><div class="actions">
          <a class="button button--secondary" href="${home}">${t.locale === 'ar' ? 'عودة إلى غرفة القراءة' : 'Back to the Reading Room'}</a>
        </div></div>
      </div>
    </section>
  </main>
  ${footer(t)}
</body>
</html>`;
    const dir = path.join(OUT, t.locale, 'reading-room', 'seven-lines', ed.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  });
  console.log('built locale', locale);
}
console.log('done — 30 files');

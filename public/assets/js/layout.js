import { SITE } from './site.js';
import { esc } from './util.js';
import { t, lang, setLang, applyI18n } from './i18n.js';

const NAV = [
  { href: '/filmler/', label: 'nav.films', key: 'filmler' },
  { href: '/oyunlar/', label: 'nav.games', key: 'oyunlar' },
  { href: '/projeler/', label: 'nav.projects', key: 'projeler' },
  { href: '/#hakkimda', label: 'nav.about', key: 'hakkimda' },
];

export function mountLayout(active) {
  applyI18n();

  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="/" aria-label="${esc(SITE.short)} ${t('nav.home')}">
          <span class="brand__mark">${esc(SITE.short.slice(0, 1))}</span>
          <span class="brand__text"><b>${esc(SITE.short)}</b> <span>/ ${t('nav.archive')}</span></span>
        </a>
        <div class="header-right">
          <nav class="nav" id="site-nav" aria-label="Menu">
            ${NAV.map(
              (n, i) => `<a href="${n.href}" ${n.key === active ? 'aria-current="page"' : ''}>
                <span class="nav__num">0${i + 1}</span>${t(n.label)}</a>`,
            ).join('')}
          </nav>
          <div class="lang-toggle" role="group" aria-label="${t('lang.switch')}">
            ${['tr', 'en'].map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`).join('')}
          </div>
          <button class="menu-btn" type="button" aria-label="${t('nav.menu')}" aria-expanded="false" aria-controls="site-nav"><span></span></button>
        </div>
      </div>`;

    const btn = header.querySelector('.menu-btn');
    btn.addEventListener('click', () => {
      const open = header.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    header.querySelectorAll('.nav a').forEach((a) =>
      a.addEventListener('click', () => header.classList.remove('menu-open')),
    );
    header.querySelectorAll('[data-lang]').forEach((b) =>
      b.addEventListener('click', () => { if (b.dataset.lang !== lang) setLang(b.dataset.lang); }),
    );

    const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 12);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="wrap">
        <p class="site-footer__big" aria-hidden="true">${esc(SITE.short)}</p>
        <div class="site-footer__row">
          <span>© ${new Date().getFullYear()} ${esc(SITE.name)} · ${t('footer.tagline')}</span>
          <nav aria-label="Footer">
            ${NAV.slice(0, 3).map((n) => `<a href="${n.href}">${t(n.label)}</a>`).join('')}
            ${SITE.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
          </nav>
        </div>
      </div>`;
  }
}

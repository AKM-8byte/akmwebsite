import { SITE } from './site.js';
import { esc } from './util.js';

const NAV = [
  { href: '/filmler/', label: 'Filmler', key: 'filmler' },
  { href: '/oyunlar/', label: 'Oyunlar', key: 'oyunlar' },
  { href: '/projeler/', label: 'Projeler', key: 'projeler' },
  { href: '/#hakkimda', label: 'Hakkımda', key: 'hakkimda' },
];

export function mountLayout(active) {
  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="/" aria-label="${esc(SITE.short)} ana sayfa">
          <span class="brand__mark">${esc(SITE.short.slice(0, 1))}</span>
          <span class="brand__text"><b>${esc(SITE.short)}</b> <span>/ arşiv</span></span>
        </a>
        <nav class="nav" id="site-nav" aria-label="Ana menü">
          ${NAV.map(
            (n, i) => `<a href="${n.href}" ${n.key === active ? 'aria-current="page"' : ''}>
              <span class="nav__num">0${i + 1}</span>${n.label}</a>`,
          ).join('')}
        </nav>
        <button class="menu-btn" type="button" aria-label="Menüyü aç" aria-expanded="false" aria-controls="site-nav"><span></span></button>
      </div>`;

    const btn = header.querySelector('.menu-btn');
    btn.addEventListener('click', () => {
      const open = header.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    header.querySelectorAll('.nav a').forEach((a) =>
      a.addEventListener('click', () => header.classList.remove('menu-open')),
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
          <span>© ${new Date().getFullYear()} ${esc(SITE.name)} · ${esc(SITE.tagline)}</span>
          <nav aria-label="Alt menü">
            ${NAV.slice(0, 3).map((n) => `<a href="${n.href}">${n.label}</a>`).join('')}
            ${SITE.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
          </nav>
        </div>
      </div>`;
  }
}

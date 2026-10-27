import { mountLayout } from '../layout.js';
import { getList } from '../api.js';
import { fallbackArt } from '../archive.js';
import { esc, icons, fmtMonth, hueFromString, imgFallbacks } from '../util.js';
import { t, L } from '../i18n.js';

mountLayout('projeler');

const list = document.getElementById('projects');
const root = document.getElementById('reader-root');
let all = [];

function card(p, i) {
  return `
  <button class="project reveal is-in" data-slug="${esc(p.slug)}" style="animation:card-in .7s ${i * 80}ms var(--ease) both">
    <div class="project__media">
      ${fallbackArt(p.title, (p.date || '').slice(0, 4), hueFromString(p.title))}
      ${p.image_url ? `<img data-fallback loading="lazy" src="${esc(p.image_url)}" alt="">` : ''}
    </div>
    <div class="project__body">
      <span class="project__num">№ ${String(i + 1).padStart(2, '0')}${p.date ? ` · ${esc(fmtMonth(p.date))}` : ''}${p.featured ? `<span class="chip">${t('projects.featured')}</span>` : ''}</span>
      <h2 class="project__title">${esc(p.title)}</h2>
      ${L(p, 'summary') ? `<p class="project__summary">${esc(L(p, 'summary'))}</p>` : ''}
      ${(p.tech || []).length ? `<div class="project__tech">${(p.tech || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
      <span class="project__more">${t('projects.read')} ${icons.arrow}</span>
    </div>
  </button>`;
}

function openReader(slug, push = true) {
  const p = all.find((x) => x.slug === slug);
  if (!p) return;
  if (push) history.pushState({}, '', `?p=${encodeURIComponent(slug)}`);
  root.innerHTML = `
  <div class="reader" role="dialog" aria-modal="true" aria-labelledby="rd-title">
    <article class="reader__panel">
      <div class="reader__bar"><span class="eyebrow">${t('projects.kicker')}</span><button class="icon-btn" data-close aria-label="${t('scene.close')}">${icons.close}</button></div>
      <div class="reader__img">${fallbackArt(p.title, (p.date || '').slice(0, 4), hueFromString(p.title))}${p.image_url ? `<img data-fallback src="${esc(p.image_url)}" alt="">` : ''}</div>
      <div class="reader__body">
        <span class="project__num">${p.date ? esc(fmtMonth(p.date)) : ''}</span>
        <h2 class="display" id="rd-title">${esc(p.title)}</h2>
        ${(p.tech || []).length ? `<div class="project__tech">${(p.tech || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
        <p class="reader__text">${esc(L(p, 'description') || L(p, 'summary') || '')}</p>
        <div class="reader__links">
          ${p.live_url ? `<a class="btn btn--accent" href="${esc(p.live_url)}" target="_blank" rel="noopener">${t('projects.live')} ${icons.arrowUpRight}</a>` : ''}
          ${p.github_url ? `<a class="btn" href="${esc(p.github_url)}" target="_blank" rel="noopener">${icons.github} GitHub</a>` : ''}
        </div>
      </div>
    </article>
  </div>`;
  document.documentElement.classList.add('has-scene');
  imgFallbacks(root);
  root.querySelector('[data-close]').focus();
}

function closeReader(push = true) {
  if (!root.innerHTML) return;
  root.innerHTML = '';
  document.documentElement.classList.remove('has-scene');
  if (push) history.pushState({}, '', location.pathname);
}

list.addEventListener('click', (e) => {
  const b = e.target.closest('[data-slug]');
  if (b) openReader(b.dataset.slug);
});
root.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]') || e.target.classList.contains('reader')) closeReader();
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeReader(); });
addEventListener('popstate', () => {
  const slug = new URLSearchParams(location.search).get('p');
  slug ? openReader(slug, false) : closeReader(false);
});

function render(items) {
  all = items;
  list.innerHTML = items.length
    ? items.map(card).join('')
    : `<div class="empty"><b>${t('projects.emptyTitle')}</b>${t('projects.empty')}</div>`;
  imgFallbacks(list);
  const slug = new URLSearchParams(location.search).get('p');
  if (slug) openReader(slug, false);
}

list.innerHTML = Array.from({ length: 2 }, () => '<div class="skeleton" style="height:320px"></div>').join('');
getList('projects', { onUpdate: render })
  .then(render)
  .catch(() => { list.innerHTML = `<div class="error-box"><b>${t('projects.error')}</b>${t('retry')}</div>`; });

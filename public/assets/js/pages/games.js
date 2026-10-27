import { mountLayout } from '../layout.js';
import { createArchive, favBadge, fallbackArt } from '../archive.js';
import { gameScene, gameAfterScene, GAME_STATUS } from '../scenes.js';
import { esc, stars, igdbImg, fmtScore, daysBetween, hueFromString } from '../util.js';
import { t, locale } from '../i18n.js';

mountLayout('oyunlar');

const $ = (s) => document.querySelector(s);
const norm = (s) => String(s || '').toLocaleLowerCase(locale).normalize('NFD').replace(/[̀-ͯ]/g, '');

function card(g, i) {
  const st = GAME_STATUS[g.status] || GAME_STATUS.bitirdim;
  return `
  <article class="card" data-id="${g.id}" style="--i:${i}">
    <button class="card__hit" data-open="${g.id}" aria-label="${esc(t('card.details', { title: g.title }))}">
      <div class="card__media">
        ${fallbackArt(g.title, g.year, hueFromString(g.title))}
        ${g.cover_url ? `<img data-fallback loading="lazy" src="${esc(igdbImg(g.cover_url, 'cover_big'))}" alt="">` : ''}
        <span class="card__glare"></span>
        <span class="card__badge" style="color:${st.color}">${g.status === 'oynuyorum' ? '<span class="pulse" style="width:7px;height:7px"></span>' : ''}${st.short}</span>
        ${favBadge(g)}
        <div class="card__stub" aria-hidden="true">
          <div class="stub__top"><span>${t('stub.cartridge')} · ${esc((g.platforms || [])[0] || t('scene.game'))}</span><span>№ ${String(g.id).padStart(4, '0')}</span></div>
          <p class="stub__title">${esc(g.title)}</p>
          <p class="stub__meta">${[g.year, ...(g.genres || []).slice(0, 2)].filter(Boolean).map(esc).join(' · ')}</p>
          <div class="stub__foot">${stars(g.rating)}<span class="stub__score">${fmtScore(g.rating)}/10</span></div>
        </div>
      </div>
    </button>
    <div class="card__caption">
      <span class="card__title">${esc(g.title)}</span>
      <span class="card__sub">${g.year ?? ''}${g.rating != null ? ` · ${stars(g.rating)}` : ''}</span>
    </div>
  </article>`;
}

// "Şu an oynuyorum" vitrini — sadece filtre yokken
function spotlight(visible, all, s) {
  if (s.status || s.q || s.genre) return '';
  const now = all.filter((g) => g.status === 'oynuyorum');
  if (!now.length) return '';
  return `
  <section class="spotlight" aria-label="${t('games.nowPlaying')}">
    <div class="spotlight__head"><span class="pulse"></span><span class="eyebrow">${t('games.nowPlaying')}</span></div>
    <div class="spotlight__list">
      ${now.map((g) => `
        <button class="spot" data-open="${g.id}">
          <div class="spot__media" style="position:absolute;inset:0;z-index:-2">${g.details?.backdrop || g.cover_url ? `<img data-fallback src="${esc(igdbImg(g.details?.backdrop || g.cover_url, '720p'))}" alt="">` : fallbackArt(g.title, g.year, hueFromString(g.title))}</div>
          <div class="spot__body">
            ${g.started_at ? `<span class="spot__days">${t('games.day', { n: daysBetween(g.started_at) })}</span>` : ''}
            <h2 class="spot__title">${esc(g.title)}</h2>
            <span class="spot__meta">${esc([(g.platforms || []).join(', '), (g.genres || []).slice(0, 2).join(' · ')].filter(Boolean).join(' — '))}</span>
          </div>
        </button>`).join('')}
    </div>
  </section>`;
}

function statsHtml(all) {
  const by = (s) => all.filter((g) => g.status === s).length;
  const rated = all.filter((g) => g.rating != null);
  const avg = rated.length ? rated.reduce((s, g) => s + g.rating, 0) / rated.length : null;
  return [
    [all.length, t('stat.games')],
    [by('bitirdim'), t('stat.finished')],
    [by('oynuyorum'), t('stat.playing')],
    [avg == null ? '—' : avg.toFixed(1), t('stat.avg')],
  ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
}

function onData(all) {
  const tabs = $('#tabs');
  const sel = tabs.querySelector('[aria-selected="true"]')?.dataset.status || '';
  const count = (s) => all.filter((g) => !s || g.status === s).length;
  tabs.innerHTML = [['', t('games.all'), 'var(--text)'], ...Object.entries(GAME_STATUS).map(([k, v]) => [k, v.short, v.color])]
    .map(([k, label, c]) => `<button class="tab" role="tab" data-status="${k}" aria-selected="${k === sel}" style="--c:${c}"><span class="tab__dot"></span>${label}<span class="tab__count">${count(k)}</span></button>`)
    .join('');

  const genres = new Map();
  all.forEach((g) => (g.genres || []).forEach((x) => genres.set(x, (genres.get(x) || 0) + 1)));
  const gsel = $('#genre');
  const cur = gsel.value;
  gsel.innerHTML = `<option value="">${t('films.allGenres')}</option>${[...genres].sort((a, b) => b[1] - a[1]).map(([x, n]) => `<option value="${esc(x)}">${esc(x)} (${n})</option>`).join('')}`;
  gsel.value = cur;
}

const ORDER = { oynuyorum: 0, bitirdim: 1, biraktim: 2, oynayacagim: 3 };
const SORTS = {
  recent: (a, b) => a.order - b.order,
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
  status: (a, b) => ORDER[a.status] - ORDER[b.status],
  title: (a, b) => a.title.localeCompare(b.title, locale),
};

createArchive({
  type: 'games',
  param: 'oyun',
  els: {
    grid: $('#grid'), toolbar: $('#toolbar'), stats: $('#stats'), result: $('#result'),
    ambient: $('#ambient'), sceneRoot: $('#scene-root'), extra: $('#extra'),
  },
  card,
  stats: statsHtml,
  onData,
  beforeGrid: spotlight,
  filters: {
    read: () => ({
      q: norm($('#q').value.trim()),
      status: $('#tabs [aria-selected="true"]')?.dataset.status || '',
      genre: $('#genre').value,
      fav: $('#fav').getAttribute('aria-pressed') === 'true',
      sort: $('#sort').value,
    }),
    match: (g, s) =>
      (!s.q || norm(`${g.title} ${(g.details?.developers || []).join(' ')}`).includes(s.q)) &&
      (!s.status || g.status === s.status) &&
      (!s.genre || (g.genres || []).includes(s.genre)) &&
      (!s.fav || g.favorite),
  },
  sort: (items, s) => [...items].sort(SORTS[s.sort] || SORTS.recent),
  scene: gameScene,
  afterScene: gameAfterScene,
  ambientUrl: (g) => igdbImg(g?.details?.backdrop || g?.cover_url, '720p'),
  toneUrl: (g) => igdbImg(g.cover_url, 'cover_small'),
});

import { mountLayout } from '../layout.js';
import { createArchive, favBadge, fallbackArt } from '../archive.js';
import { filmScene, filmAfterScene } from '../scenes.js';
import { esc, stars, tmdbImg, fmtScore, fmtRuntime, fmtMonth, hueFromString } from '../util.js';

mountLayout('filmler');

const $ = (s) => document.querySelector(s);
const toolbar = $('#toolbar');
const norm = (s) => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');

function card(f, i) {
  const d = f.details || {};
  const title = f.title_tr;
  return `
  <article class="card" data-id="${f.id}" style="--i:${i}">
    <button class="card__hit" data-open="${f.id}" aria-label="${esc(title)} — ayrıntılar">
      <div class="card__media">
        ${fallbackArt(title, f.year, hueFromString(title))}
        ${f.poster_path ? `<img data-fallback loading="lazy" src="${tmdbImg(f.poster_path, 'w342')}" alt="">` : ''}
        <span class="card__glare"></span>
        ${favBadge(f)}
        <div class="card__stub" aria-hidden="true">
          <div class="stub__top"><span>Giriş bileti</span><span>№ ${String(f.id).padStart(4, '0')}</span></div>
          <p class="stub__title">${esc(title)}</p>
          <p class="stub__meta">${[f.year, fmtRuntime(d.runtime), (f.genres || [])[0]].filter(Boolean).map(esc).join(' · ')}${d.directors?.[0] ? `<br>${esc(d.directors[0])}` : ''}${f.watched_at ? `<br>İzledim: ${esc(fmtMonth(f.watched_at))}` : ''}</p>
          <div class="stub__foot">${stars(f.rating)}<span class="stub__score">${fmtScore(f.rating)}/10</span></div>
        </div>
      </div>
    </button>
    <div class="card__caption">
      <span class="card__title">${esc(title)}</span>
      <span class="card__sub">${f.year ?? ''}${f.rating != null ? ` · ${stars(f.rating)}` : ''}</span>
    </div>
  </article>`;
}

function statsHtml(all) {
  const rated = all.filter((f) => f.rating != null);
  const avg = rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : null;
  const minutes = all.reduce((s, f) => s + (f.details?.runtime || 0), 0);
  return [
    [all.length, 'Film'],
    [all.filter((f) => f.favorite).length, 'Favori'],
    [avg == null ? '—' : avg.toFixed(1), 'Ortalama puanım'],
    [Math.round(minutes / 60), 'Saat perde başında'],
  ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
}

function fillGenres(all) {
  const sel = $('#genre');
  const current = sel.value;
  const counts = new Map();
  all.forEach((f) => (f.genres || []).forEach((g) => counts.set(g, (counts.get(g) || 0) + 1)));
  const sorted = [...counts].sort((a, b) => b[1] - a[1]);
  sel.innerHTML = `<option value="">Tüm türler</option>${sorted.map(([g, n]) => `<option value="${esc(g)}">${esc(g)} (${n})</option>`).join('')}`;
  sel.value = current;

  const decades = [...new Set(all.map((f) => f.year && Math.floor(f.year / 10) * 10).filter(Boolean))].sort((a, b) => b - a);
  const dsel = $('#decade');
  const dcur = dsel.value;
  dsel.innerHTML = `<option value="">Tüm yıllar</option>${decades.map((d) => `<option value="${d}">${d}'ler</option>`).join('')}`;
  dsel.value = dcur;
}

const SORTS = {
  recent: (a, b) => String(b.watched_at || b.created_at).localeCompare(String(a.watched_at || a.created_at)),
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
  year: (a, b) => (b.year ?? 0) - (a.year ?? 0),
  oldest: (a, b) => (a.year ?? 9999) - (b.year ?? 9999),
  title: (a, b) => a.title_tr.localeCompare(b.title_tr, 'tr'),
};

createArchive({
  type: 'films',
  param: 'film',
  els: {
    grid: $('#grid'), toolbar, stats: $('#stats'), result: $('#result'),
    ambient: $('#ambient'), sceneRoot: $('#scene-root'),
  },
  card,
  stats: statsHtml,
  onData: fillGenres,
  filters: {
    read: () => ({
      q: norm($('#q').value.trim()),
      genre: $('#genre').value,
      decade: Number($('#decade').value) || null,
      fav: $('#fav').getAttribute('aria-pressed') === 'true',
      sort: $('#sort').value,
    }),
    match: (f, s) =>
      (!s.q || norm(`${f.title_tr} ${f.title_original} ${(f.details?.directors || []).join(' ')} ${(f.details?.cast || []).map((c) => c.name).join(' ')}`).includes(s.q)) &&
      (!s.genre || (f.genres || []).includes(s.genre)) &&
      (!s.decade || (f.year >= s.decade && f.year < s.decade + 10)) &&
      (!s.fav || f.favorite),
  },
  sort: (items, s) => [...items].sort(SORTS[s.sort] || SORTS.recent),
  scene: filmScene,
  afterScene: filmAfterScene,
  ambientUrl: (f) => tmdbImg(f?.backdrop_path || f?.poster_path, 'w780'),
  toneUrl: (f) => tmdbImg(f.poster_path, 'w92'),
});

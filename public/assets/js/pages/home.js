import { mountLayout } from '../layout.js';
import { getList } from '../api.js';
import { SITE } from '../site.js';
import { fallbackArt } from '../archive.js';
import { esc, icons, tmdbImg, rawgImg, hueFromString, imgFallbacks, revealOnScroll } from '../util.js';

mountLayout('');

const $ = (s) => document.querySelector(s);

$('#intro').innerHTML = `${esc(SITE.name)}'in kişisel arşivi: <em>izlediklerim</em>, oynadıklarım ve yaptıklarım.`;
$('#about').textContent = SITE.about;
$('#links').innerHTML = SITE.links
  .map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ${icons.arrowUpRight}</a>`)
  .join('');
revealOnScroll();

const tile = (img, title, year) =>
  `<div>${fallbackArt(title, year, hueFromString(title))}${img ? `<img data-fallback loading="lazy" src="${esc(img)}" alt="" style="position:absolute;inset:0">` : ''}</div>`;

function render(films, games, projects) {
  $('#c-films').textContent = films.length;
  $('#c-games').textContent = games.length;
  $('#c-projects').textContent = projects.length;

  // Afiş duvarı: film ve oyunları karıştırıp 48 kareyi doldur.
  const pool = [
    ...films.filter((f) => f.poster_path).map((f) => tmdbImg(f.poster_path, 'w185')),
    ...games.filter((g) => g.cover_url).map((g) => rawgImg(g.cover_url, 420)),
  ];
  if (pool.length) {
    $('#wall').innerHTML = Array.from({ length: 48 }, (_, i) =>
      `<div style="--i:${i % 24};position:relative"><img loading="lazy" src="${esc(pool[(i + Math.floor(i / 8) * 3) % pool.length])}" alt=""></div>`,
    ).join('');
  }

  $('#fan-films').innerHTML = films.slice(0, 3).map((f) => tile(tmdbImg(f.poster_path, 'w185'), f.title_tr, f.year)).join('');
  $('#fan-games').innerHTML = games.slice(0, 3).map((g) => tile(rawgImg(g.cover_url, 420), g.title, g.year)).join('');
  $('#fan-projects').innerHTML = projects.slice(0, 3).map((p) => tile(p.image_url, p.title, (p.date || '').slice(0, 4))).join('');

  // "Şu an" satırları
  const playing = games.find((g) => g.status === 'oynuyorum');
  const lastFilm = films[0];
  const lastProject = projects[0];
  const rows = [
    lastFilm && ['Son izlediğim', lastFilm.title_tr, `/filmler/?film=${lastFilm.id}`],
    playing && ['Şu an oynuyorum', playing.title, `/oyunlar/?oyun=${playing.id}`],
    lastProject && ['Son proje', lastProject.title, `/projeler/?p=${encodeURIComponent(lastProject.slug)}`],
  ].filter(Boolean);
  $('#now').innerHTML = rows
    .map(([k, v, href]) => `<a class="now__row" href="${href}"><small>${k}</small><b>${esc(v)}</b>${icons.arrow}</a>`)
    .join('');

  // Kayan şerit: favori filmler ve oyunlar
  const words = [
    ...films.filter((f) => f.favorite).map((f) => f.title_tr),
    ...games.filter((g) => g.favorite).map((g) => g.title),
  ].slice(0, 14);
  const list = words.length ? words : ['Filmler', 'Oyunlar', 'Projeler', 'Notlar', 'Puanlar'];
  const half = list.map((w) => `<span>${esc(w)}</span>`).join('');
  $('#ticker').innerHTML = half + half;

  imgFallbacks(document);
}

const safe = (type) => getList(type, { onUpdate: () => {} }).catch(() => []);
Promise.all([safe('films'), safe('games'), safe('projects')]).then(([f, g, p]) => render(f, g, p));

// Detay sahneleri: film için sinema afişi + not kâğıdı, oyun için 3D kutu + zaman çizelgesi.
import { SITE } from './site.js';
import {
  esc, icons, tmdbImg, igdbImg, fmtDate, fmtRuntime, fmtScore, daysBetween, hueFromString,
} from './util.js';
import { fallbackArt } from './archive.js';
import { t, L, lang } from './i18n.js';

const COUNTRY = new Intl.DisplayNames([lang], { type: 'region' });

export const GAME_STATUS = Object.fromEntries(
  [
    ['oynuyorum', 'var(--accent)'],
    ['bitirdim', 'var(--ok)'],
    ['biraktim', 'var(--bad)'],
    ['oynayacagim', 'var(--gold)'],
  ].map(([k, color]) => [k, { label: t(`status.${k}`), short: t(`status.${k}.short`), color }]),
);

export const filmTitle = (f) => (lang === 'tr' ? f.title_tr : f.title_en) || f.title_tr || f.title_original;

function bar(ctx, kind) {
  return `
    <div class="scene__bar">
      <span class="scene__id">AKM · ${kind} · <b>№ ${ctx.position}</b></span>
      <div class="scene__ctrl">
        <button class="icon-btn" data-prev aria-label="${t('scene.prev')}" ${ctx.prev ? '' : 'disabled'}>${icons.left}</button>
        <button class="icon-btn" data-next aria-label="${t('scene.next')}" ${ctx.next ? '' : 'disabled'}>${icons.right}</button>
        <button class="icon-btn" data-close aria-label="${t('scene.close')}">${icons.close}</button>
      </div>
    </div>`;
}

const keys = () => `<div class="sc-keys" aria-hidden="true"><span><kbd>←</kbd><kbd>→</kbd>${t('scene.keysBrowse')}</span><span><kbd>Esc</kbd>${t('scene.keysClose')}</span></div>`;

function note(item) {
  const has = !!item.review;
  return `
    <div class="note__paper">
      <span class="note__tape"></span>
      <p class="note__label">${t('scene.myNote')}${has && lang !== 'tr' ? ` · ${t('scene.noteNotice')}` : ''}</p>
      <p class="note__hand ${has ? '' : 'is-empty'}" ${has ? 'lang="tr"' : ''}>${has ? esc(item.review) : t('scene.noNote')}</p>
      <span class="note__sign">— ${esc(SITE.name.slice(0, 1))}.</span>
    </div>`;
}

function ring(rating) {
  const off = rating == null ? 440 : 440 * (1 - rating / 10);
  return `
    <div class="score__ring">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle class="track" cx="80" cy="80" r="70"/>
        <circle class="val" cx="80" cy="80" r="70" style="--off:${off}"/>
      </svg>
      <div class="score__num"><div><b>${fmtScore(rating)}</b><span>${t('scene.myScore')}</span></div></div>
    </div>`;
}

function compare(mine, theirs, label, labelFrom) {
  if (mine == null || theirs == null) return '';
  const diff = mine - theirs;
  const d = Math.abs(diff).toFixed(1);
  const verdict =
    Math.abs(diff) < 0.6 ? t('scene.same', { label })
    : diff > 0 ? t('scene.moreMe', { label: labelFrom, d })
    : t('scene.moreThem', { label, d });
  return `
    <div class="compare">
      <div class="compare__row"><span>${t('scene.me')}</span><div class="compare__bar"><i style="--w:${mine * 10}%;--c:rgb(var(--tone))"></i></div><b>${fmtScore(mine)}</b></div>
      <div class="compare__row"><span>${label}</span><div class="compare__bar"><i style="--w:${theirs * 10}%"></i></div><b>${fmtScore(theirs)}</b></div>
      <p class="compare__verdict">${verdict}</p>
    </div>`;
}

// Aynı türleri paylaşan, yüksek puanlı kayıtlar.
function related(item, all, genresOf, limit = 6) {
  const g = new Set(genresOf(item));
  return all
    .filter((x) => x.id !== item.id)
    .map((x) => ({ x, s: genresOf(x).filter((y) => g.has(y)).length * 10 + (x.rating || 0) + (x.favorite ? 3 : 0) }))
    .filter((r) => r.s >= 10)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.x);
}

function country(code) {
  try { return COUNTRY.of(code); } catch { return code; }
}

// ================= FİLM =================

export function filmScene(f, ctx) {
  const d = f.details || {};
  const title = filmTitle(f);
  const other = lang === 'tr' ? f.title_original : f.title_original !== f.title_en ? f.title_original : f.title_tr;
  const genres = L(f, 'genres');
  const overview = L(f, 'overview');
  const tagline = L(d, 'tagline');
  const recs = related(f, ctx.all, (x) => x.genres_en || []);
  const meta = [
    f.year && [t('scene.year'), f.year],
    d.runtime && [t('scene.runtime'), fmtRuntime(d.runtime)],
    d.directors?.length && [t('scene.director'), d.directors.join(', ')],
    d.countries?.length && [t('scene.country'), d.countries.slice(0, 2).map(country).join(', ')],
  ].filter(Boolean);

  return `
  <div class="scene scene--film" role="dialog" aria-modal="true" aria-labelledby="sc-title">
    <div class="scene__bg" aria-hidden="true">${f.backdrop_path ? `<img src="${tmdbImg(f.backdrop_path, 'w1280')}" alt="">` : ''}</div>
    ${bar(ctx, t('scene.film'))}
    <div class="scene__body wrap">
      <div class="sc-grid">
        <aside class="sc-media">
          <div class="poster-frame" data-hero style="view-transition-name:akm-hero">
            ${fallbackArt(title, f.year, hueFromString(f.title_tr))}
            ${f.poster_path ? `<img data-fallback src="${tmdbImg(f.poster_path, 'w500')}" alt="${esc(t('scene.posterAlt', { title }))}">` : ''}
          </div>
          ${f.favorite ? `<div class="stamp">♥<b>${t('scene.liked')}</b></div>` : ''}
        </aside>
        <div class="sc-info">
          <span class="eyebrow">${esc(genres.slice(0, 3).join(' · ') || t('scene.film'))}</span>
          <h2 class="display sc-title" id="sc-title">${esc(title)}</h2>
          ${other && other !== title ? `<p class="sc-orig">${esc(other)}</p>` : ''}
          ${meta.length ? `<ul class="sc-meta">${meta.map(([k, v]) => `<li><small>${k}</small><span>${esc(v)}</span></li>`).join('')}</ul>` : ''}
          ${tagline ? `<p class="sc-tagline">“${esc(tagline)}”</p>` : ''}
          ${overview ? `<p class="sc-overview">${esc(overview)}</p>` : ''}
          <div class="sc-actions">
            ${d.trailer ? `<button class="btn btn--accent" data-trailer="${esc(d.trailer)}">${icons.play} ${t('scene.trailer')}</button>` : ''}
            ${f.letterboxd_url ? `<a class="btn" href="${esc(f.letterboxd_url)}" target="_blank" rel="noopener">Letterboxd ${icons.arrowUpRight}</a>` : ''}
            ${f.tmdb_id ? `<a class="btn" href="https://www.themoviedb.org/movie/${f.tmdb_id}?language=${lang === 'tr' ? 'tr-TR' : 'en-US'}" target="_blank" rel="noopener">TMDB ${icons.arrowUpRight}</a>` : ''}
          </div>
        </div>
      </div>

      <section class="note" aria-label="${t('scene.myNote')}">
        ${note(f)}
        <div class="score">
          ${ring(f.rating)}
          ${f.favorite ? `<span class="score__fav">${icons.heart} ${t('scene.liked')}</span>` : ''}
          ${compare(f.rating, d.vote_average, 'TMDB', t('scene.tmdbFrom'))}
        </div>
      </section>

      ${d.cast?.length ? `
      <section class="sc-section">
        <div class="sc-section__head"><h3>${t('scene.cast')}</h3><span class="eyebrow">${t('scene.people', { n: d.cast.length })}</span></div>
        <div class="rail">
          ${d.cast.map((c) => `
            <div class="cast">
              <div class="cast__img">${esc(c.name.slice(0, 1))}${c.profile_path ? `<img data-fallback loading="lazy" src="${tmdbImg(c.profile_path, 'w185')}" alt="">` : ''}</div>
              <b>${esc(c.name)}</b><small>${esc(c.character || '')}</small>
            </div>`).join('')}
        </div>
      </section>` : ''}

      ${recs.length ? `
      <section class="sc-section">
        <div class="sc-section__head"><h3>${t('scene.recsFilm')}</h3><span class="eyebrow">${t('scene.similar')}</span></div>
        <div class="recs">
          ${recs.map((r) => `
            <button class="rec" data-go="${r.id}">
              <div class="rec__img">${fallbackArt(filmTitle(r), r.year, hueFromString(r.title_tr))}${r.poster_path ? `<img data-fallback loading="lazy" src="${tmdbImg(r.poster_path, 'w342')}" alt="">` : ''}</div>
              <b>${esc(filmTitle(r))}</b><small>${r.year ?? ''}${r.rating != null ? ` · ${fmtScore(r.rating)}/10` : ''}</small>
            </button>`).join('')}
        </div>
      </section>` : ''}
    </div>
    ${keys()}
  </div>`;
}

export function filmAfterScene(el) {
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-trailer]');
    if (!b) return;
    const box = document.createElement('div');
    box.className = 'trailer';
    box.innerHTML = `
      <button class="icon-btn" aria-label="${t('scene.closeTrailer')}">${icons.close}</button>
      <div class="trailer__frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(b.dataset.trailer)}?autoplay=1&rel=0&hl=${lang}" title="Trailer" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
    box.addEventListener('click', (ev) => { if (!ev.target.closest('iframe')) box.remove(); });
    el.appendChild(box);
  });
}

// ================= OYUN =================

function metaColor(score) {
  return score >= 75 ? 'var(--ok)' : score >= 50 ? 'var(--warn)' : 'var(--bad)';
}

function timeline(g) {
  const s = g.status;
  const start = g.started_at;
  const end = g.finished_at;
  if (s === 'oynayacagim') {
    return `<div class="timeline">
      <div class="timeline__end"><small>${t('tl.status')}</small><b>${t('tl.listed')}</b></div>
      <div class="timeline__track is-dashed"><span class="timeline__days">${t('tl.waiting')}</span></div>
      <div class="timeline__end"><small>${t('tl.start')}</small><b>${t('tl.soon')}</b></div></div>`;
  }
  const days = start ? daysBetween(start, s === 'oynuyorum' ? null : end) : null;
  if (s === 'oynuyorum') {
    return `<div class="timeline">
      <div class="timeline__end"><small>${t('tl.started')}</small><b>${start ? esc(fmtDate(start)) : '—'}</b></div>
      <div class="timeline__track" style="--p:72%"><i></i><span class="pulse"></span><span class="timeline__days">${days != null ? t('tl.playingFor', { n: days }) : t('tl.ongoing')}</span></div>
      <div class="timeline__end"><small>${t('tl.end')}</small><b>${t('tl.notYet')}</b></div></div>`;
  }
  const broken = s === 'biraktim';
  return `<div class="timeline">
    <div class="timeline__end"><small>${t('tl.started')}</small><b>${start ? esc(fmtDate(start)) : '—'}</b></div>
    <div class="timeline__track ${broken ? 'is-broken' : ''}" style="--c:${broken ? 'var(--bad)' : 'var(--ok)'}"><i></i>${days != null ? `<span class="timeline__days">${t('tl.days', { n: days })}</span>` : ''}</div>
    <div class="timeline__end"><small>${broken ? t('tl.dropped') : t('tl.finished')}</small><b>${end ? esc(fmtDate(end)) : '—'}</b></div></div>`;
}

export function gameScene(g, ctx) {
  const d = g.details || {};
  const st = GAME_STATUS[g.status] || GAME_STATUS.bitirdim;
  const hue = hueFromString(g.title);
  const mine = new Set(g.platforms || []);
  const platforms = [...new Set([...(g.platforms || []), ...(d.all_platforms || [])])];
  const recs = related(g, ctx.all, (x) => x.genres || [], 4);
  const meta = [
    g.year && [t('scene.release'), d.released ? fmtDate(d.released) : g.year],
    d.developers?.length && [t('scene.developer'), d.developers.slice(0, 2).join(', ')],
  ].filter(Boolean);
  const scores = [
    d.critic_score && [t('scene.critics'), d.critic_score],
    d.user_score && [t('scene.players'), d.user_score],
  ].filter(Boolean);

  return `
  <div class="scene scene--game" role="dialog" aria-modal="true" aria-labelledby="sc-title">
    <div class="scene__bg" aria-hidden="true">${d.backdrop || g.cover_url ? `<img src="${esc(igdbImg(d.backdrop || g.cover_url, '1080p'))}" alt="">` : ''}</div>
    ${bar(ctx, t('scene.game'))}
    <div class="scene__body wrap">
      <div class="sc-grid">
        <aside class="sc-media gbox">
          <div class="gbox__case">
            <div class="gbox__spine"><span>${esc(g.title)}</span></div>
            <div class="gbox__front" data-hero style="view-transition-name:akm-hero">
              ${fallbackArt(g.title, g.year, hue)}
              ${g.cover_url ? `<img data-fallback src="${esc(igdbImg(g.cover_url, 'cover_big_2x'))}" alt="${esc(t('scene.coverAlt', { title: g.title }))}">` : ''}
              <span class="gbox__strip">AKM · ${esc((g.platforms || [])[0] || t('scene.game'))}</span>
              <span class="gbox__label">${esc(g.title)}</span>
            </div>
          </div>
        </aside>
        <div class="sc-info">
          <span class="status status--${esc(g.status)}">${g.status === 'oynuyorum' ? '<span class="pulse"></span>' : '<span class="status__icon"></span>'}${st.label}</span>
          <h2 class="display sc-title" id="sc-title">${esc(g.title)}</h2>
          ${meta.length || scores.length ? `
          <ul class="sc-meta">
            ${meta.map(([k, v]) => `<li><small>${k}</small><span>${esc(v)}</span></li>`).join('')}
            ${scores.map(([k, v]) => `<li><small>${k}</small><span class="meta-score" style="--c:${metaColor(v)}">${v}</span></li>`).join('')}
          </ul>` : ''}
          ${g.genres?.length ? `<div class="sc-chips">${g.genres.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
          ${platforms.length ? `
            <div>
              <span class="eyebrow" style="margin-bottom:10px;display:flex">${t('scene.platforms')} · <span style="color:rgb(var(--tone))">${t('scene.platformsMine')}</span></span>
              <div class="sc-chips">${platforms.slice(0, 10).map((p) => `<span class="chip ${mine.has(p) ? 'is-mine' : ''}">${esc(p)}</span>`).join('')}</div>
            </div>` : ''}
          ${timeline(g)}
          ${d.description ? `<p class="sc-desc" lang="en"><small>${t('scene.about')} · IGDB</small>${esc(d.description.length > 520 ? `${d.description.slice(0, 520)}…` : d.description)}</p>` : ''}
          <div class="sc-actions">
            ${d.trailer ? `<button class="btn btn--accent" data-trailer="${esc(d.trailer)}">${icons.play} ${t('scene.trailer')}</button>` : ''}
            ${d.igdb_url ? `<a class="btn" href="${esc(d.igdb_url)}" target="_blank" rel="noopener">IGDB ${icons.arrowUpRight}</a>` : ''}
            ${d.website ? `<a class="btn" href="${esc(d.website)}" target="_blank" rel="noopener">${t('scene.official')} ${icons.arrowUpRight}</a>` : ''}
          </div>
        </div>
      </div>

      <section class="note" aria-label="${t('scene.myNote')}">
        ${note(g)}
        <div class="score">
          ${ring(g.rating)}
          ${g.favorite ? `<span class="score__fav">${icons.heart} ${t('scene.liked')}</span>` : ''}
          ${compare(g.rating, d.critic_score ? d.critic_score / 10 : null, t('scene.critics'), t('scene.criticsFrom'))}
        </div>
      </section>

      ${d.screenshots?.length ? `
      <section class="sc-section">
        <div class="sc-section__head"><h3>${t('scene.shots')}</h3><span class="eyebrow">${t('scene.shotsCount', { n: d.screenshots.length })}</span></div>
        <div class="rail shots">
          ${d.screenshots.map((s) => `<button class="shot" data-shot="${esc(s)}"><img loading="lazy" src="${esc(igdbImg(s, 'screenshot_big'))}" alt=""></button>`).join('')}
        </div>
      </section>` : ''}

      ${recs.length ? `
      <section class="sc-section">
        <div class="sc-section__head"><h3>${t('scene.recsGame')}</h3><span class="eyebrow">${t('scene.similar')}</span></div>
        <div class="recs">
          ${recs.map((r) => `
            <button class="rec" data-go="${r.id}">
              <div class="rec__img">${fallbackArt(r.title, r.year, hueFromString(r.title))}${r.cover_url ? `<img data-fallback loading="lazy" src="${esc(igdbImg(r.cover_url, 'cover_big'))}" alt="">` : ''}</div>
              <b>${esc(r.title)}</b><small>${(GAME_STATUS[r.status] || {}).short || ''}${r.rating != null ? ` · ${fmtScore(r.rating)}/10` : ''}</small>
            </button>`).join('')}
        </div>
      </section>` : ''}
    </div>
    ${keys()}
  </div>`;
}

export function gameAfterScene(el) {
  filmAfterScene(el); // fragman oynatıcısı aynı
  el.addEventListener('click', (e) => {
    const s = e.target.closest('[data-shot]');
    if (!s) return;
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = `<img src="${esc(s.dataset.shot)}" alt="">`;
    box.addEventListener('click', () => box.remove());
    el.appendChild(box);
  });
}

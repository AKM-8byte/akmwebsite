// Detay sahneleri: film için sinema afişi + not kâğıdı, oyun için 3D kutu + zaman çizelgesi.
import { SITE } from './site.js';
import {
  esc, icons, tmdbImg, igdbImg, fmtDate, fmtRuntime, fmtScore, daysBetween, hueFromString,
} from './util.js';
import { fallbackArt } from './archive.js';

const COUNTRY = new Intl.DisplayNames(['tr'], { type: 'region' });

export const GAME_STATUS = {
  oynuyorum: { label: 'Şu an oynuyorum', short: 'Oynuyorum', color: 'var(--accent)' },
  bitirdim: { label: 'Bitirdim', short: 'Bitirdim', color: 'var(--ok)' },
  biraktim: { label: 'Yarım bıraktım', short: 'Bıraktım', color: 'var(--bad)' },
  oynayacagim: { label: 'Sırada', short: 'Sırada', color: 'var(--gold)' },
};

function bar(item, ctx, kind) {
  return `
    <div class="scene__bar">
      <span class="scene__id">AKM · ${kind} · <b>№ ${ctx.position}</b></span>
      <div class="scene__ctrl">
        <button class="icon-btn" data-prev aria-label="Önceki" ${ctx.prev ? '' : 'disabled'}>${icons.left}</button>
        <button class="icon-btn" data-next aria-label="Sonraki" ${ctx.next ? '' : 'disabled'}>${icons.right}</button>
        <button class="icon-btn" data-close aria-label="Kapat">${icons.close}</button>
      </div>
    </div>`;
}

const keys = `<div class="sc-keys" aria-hidden="true"><span><kbd>←</kbd><kbd>→</kbd>gez</span><span><kbd>Esc</kbd>kapat</span></div>`;

function note(item) {
  const has = !!item.review;
  return `
    <div class="note__paper">
      <span class="note__tape"></span>
      <p class="note__label">Benim notum</p>
      <p class="note__hand ${has ? '' : 'is-empty'}">${has ? esc(item.review) : 'Bunun için henüz bir şey yazmadım…'}</p>
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
      <div class="score__num"><div><b>${fmtScore(rating)}</b><span>Benim puanım</span></div></div>
    </div>`;
}

function compare(mine, theirs, label, labelFrom) {
  if (mine == null || theirs == null) return '';
  const diff = mine - theirs;
  const verdict =
    Math.abs(diff) < 0.6 ? `${label} ile aynı fikirdeyiz.`
    : diff > 0 ? `Ben ${labelFrom} <b>${diff.toFixed(1)}</b> puan daha çok sevdim.`
    : `${label} benden <b>${Math.abs(diff).toFixed(1)}</b> puan daha cömert.`;
  return `
    <div class="compare">
      <div class="compare__row"><span>Ben</span><div class="compare__bar"><i style="--w:${mine * 10}%;--c:rgb(var(--tone))"></i></div><b>${fmtScore(mine)}</b></div>
      <div class="compare__row"><span>${label}</span><div class="compare__bar"><i style="--w:${theirs * 10}%"></i></div><b>${fmtScore(theirs)}</b></div>
      <p class="compare__verdict">${verdict}</p>
    </div>`;
}

// Aynı türleri paylaşan, yüksek puanlı kayıtlar.
function related(item, all, limit = 6) {
  const g = new Set(item.genres || []);
  return all
    .filter((x) => x.id !== item.id)
    .map((x) => ({ x, s: (x.genres || []).filter((y) => g.has(y)).length * 10 + (x.rating || 0) + (x.favorite ? 3 : 0) }))
    .filter((r) => r.s >= 10)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.x);
}

// ================= FİLM =================

export function filmScene(f, ctx) {
  const d = f.details || {};
  const hue = hueFromString(f.title_tr);
  const recs = related(f, ctx.all);
  const meta = [
    f.year && ['Yıl', f.year],
    d.runtime && ['Süre', fmtRuntime(d.runtime)],
    d.directors?.length && ['Yönetmen', d.directors.join(', ')],
    d.countries?.length && ['Ülke', d.countries.slice(0, 2).map((c) => { try { return COUNTRY.of(c); } catch { return c; } }).join(', ')],
  ].filter(Boolean);

  return `
  <div class="scene scene--film" role="dialog" aria-modal="true" aria-labelledby="sc-title">
    <div class="scene__bg" aria-hidden="true">${f.backdrop_path ? `<img src="${tmdbImg(f.backdrop_path, 'w1280')}" alt="">` : ''}</div>
    ${bar(f, ctx, 'Film')}
    <div class="scene__body wrap">
      <div class="sc-grid">
        <aside class="sc-media">
          <div class="poster-frame" data-hero style="view-transition-name:akm-hero">
            ${fallbackArt(f.title_tr, f.year, hue)}
            ${f.poster_path ? `<img data-fallback src="${tmdbImg(f.poster_path, 'w500')}" alt="${esc(f.title_tr)} afişi">` : ''}
          </div>
          ${f.watched_at ? `<div class="stamp">İzlendi<b>${esc(fmtDate(f.watched_at))}</b></div>` : ''}
        </aside>
        <div class="sc-info">
          <span class="eyebrow">${esc((f.genres || []).slice(0, 3).join(' · ') || 'Film')}</span>
          <h2 class="display sc-title" id="sc-title">${esc(f.title_tr)}</h2>
          ${f.title_original && f.title_original !== f.title_tr ? `<p class="sc-orig">${esc(f.title_original)}</p>` : ''}
          ${meta.length ? `<ul class="sc-meta">${meta.map(([k, v]) => `<li><small>${k}</small><span>${esc(v)}</span></li>`).join('')}</ul>` : ''}
          ${d.tagline ? `<p class="sc-tagline">“${esc(d.tagline)}”</p>` : ''}
          ${f.overview_tr ? `<p class="sc-overview">${esc(f.overview_tr)}</p>` : ''}
          <div class="sc-actions">
            ${d.trailer ? `<button class="btn btn--accent" data-trailer="${esc(d.trailer)}">${icons.play} Fragmanı izle</button>` : ''}
            ${f.tmdb_id ? `<a class="btn" href="https://www.themoviedb.org/movie/${f.tmdb_id}?language=tr-TR" target="_blank" rel="noopener">TMDB ${icons.arrowUpRight}</a>` : ''}
          </div>
        </div>
      </div>

      <section class="note" aria-label="Benim notum ve puanım">
        ${note(f)}
        <div class="score">
          ${ring(f.rating)}
          ${f.favorite ? `<span class="score__fav">${icons.heart} Favorilerimden</span>` : ''}
          ${compare(f.rating, d.vote_average, 'TMDB', "TMDB'den")}
        </div>
      </section>

      ${d.cast?.length ? `
      <section class="sc-section">
        <div class="sc-section__head"><h3>Oyuncular</h3><span class="eyebrow">${d.cast.length} kişi</span></div>
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
        <div class="sc-section__head"><h3>Bunu sevdiysen, arşivimden</h3><span class="eyebrow">benzer türler</span></div>
        <div class="recs">
          ${recs.map((r) => `
            <button class="rec" data-go="${r.id}">
              <div class="rec__img">${fallbackArt(r.title_tr, r.year, hueFromString(r.title_tr))}${r.poster_path ? `<img data-fallback loading="lazy" src="${tmdbImg(r.poster_path, 'w342')}" alt="">` : ''}</div>
              <b>${esc(r.title_tr)}</b><small>${r.year ?? ''}${r.rating != null ? ` · ${fmtScore(r.rating)}/10` : ''}</small>
            </button>`).join('')}
        </div>
      </section>` : ''}
    </div>
    ${keys}
  </div>`;
}

export function filmAfterScene(el) {
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-trailer]');
    if (!t) return;
    const box = document.createElement('div');
    box.className = 'trailer';
    box.innerHTML = `
      <button class="icon-btn" aria-label="Fragmanı kapat">${icons.close}</button>
      <div class="trailer__frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(t.dataset.trailer)}?autoplay=1&rel=0" title="Fragman" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
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
      <div class="timeline__end"><small>Durum</small><b>Listede</b></div>
      <div class="timeline__track is-dashed"><span class="timeline__days">sırasını bekliyor</span></div>
      <div class="timeline__end"><small>Başlangıç</small><b>Yakında</b></div></div>`;
  }
  const days = start ? daysBetween(start, s === 'oynuyorum' ? null : end) : null;
  const daysTxt = days != null ? `${days} gün` : '';
  if (s === 'oynuyorum') {
    return `<div class="timeline">
      <div class="timeline__end"><small>Başladım</small><b>${start ? esc(fmtDate(start)) : '—'}</b></div>
      <div class="timeline__track" style="--p:72%"><i></i><span class="pulse"></span><span class="timeline__days">${daysTxt ? `${daysTxt}dür oynuyorum` : 'devam ediyor'}</span></div>
      <div class="timeline__end"><small>Bitiş</small><b>Henüz değil</b></div></div>`;
  }
  const broken = s === 'biraktim';
  return `<div class="timeline">
    <div class="timeline__end"><small>Başladım</small><b>${start ? esc(fmtDate(start)) : '—'}</b></div>
    <div class="timeline__track ${broken ? 'is-broken' : ''}" style="--c:${broken ? 'var(--bad)' : 'var(--ok)'}"><i></i>${daysTxt ? `<span class="timeline__days">${daysTxt}</span>` : ''}</div>
    <div class="timeline__end"><small>${broken ? 'Bıraktım' : 'Bitirdim'}</small><b>${end ? esc(fmtDate(end)) : '—'}</b></div></div>`;
}

export function gameScene(g, ctx) {
  const d = g.details || {};
  const st = GAME_STATUS[g.status] || GAME_STATUS.bitirdim;
  const hue = hueFromString(g.title);
  const mine = new Set(g.platforms || []);
  const platforms = [...new Set([...(g.platforms || []), ...(d.all_platforms || [])])];
  const recs = related(g, ctx.all, 4);
  const meta = [
    g.year && ['Çıkış', d.released ? fmtDate(d.released) : g.year],
    d.developers?.length && ['Geliştirici', d.developers.slice(0, 2).join(', ')],
  ].filter(Boolean);

  return `
  <div class="scene scene--game" role="dialog" aria-modal="true" aria-labelledby="sc-title">
    <div class="scene__bg" aria-hidden="true">${d.backdrop || g.cover_url ? `<img src="${esc(igdbImg(d.backdrop || g.cover_url, '1080p'))}" alt="">` : ''}</div>
    ${bar(g, ctx, 'Oyun')}
    <div class="scene__body wrap">
      <div class="sc-grid">
        <aside class="sc-media gbox">
          <div class="gbox__case">
            <div class="gbox__spine"><span>${esc(g.title)}</span></div>
            <div class="gbox__front" data-hero style="view-transition-name:akm-hero">
              ${fallbackArt(g.title, g.year, hue)}
              ${g.cover_url ? `<img data-fallback src="${esc(igdbImg(g.cover_url, 'cover_big_2x'))}" alt="${esc(g.title)} kapağı">` : ''}
              <span class="gbox__strip">AKM · ${esc((g.platforms || [])[0] || 'Oyun')}</span>
              <span class="gbox__label">${esc(g.title)}</span>
            </div>
          </div>
        </aside>
        <div class="sc-info">
          <span class="status status--${esc(g.status)}">${g.status === 'oynuyorum' ? '<span class="pulse"></span>' : '<span class="status__icon"></span>'}${st.label}</span>
          <h2 class="display sc-title" id="sc-title">${esc(g.title)}</h2>
          ${meta.length || d.critic_score || d.user_score ? `
          <ul class="sc-meta">
            ${meta.map(([k, v]) => `<li><small>${k}</small><span>${esc(v)}</span></li>`).join('')}
            ${d.critic_score ? `<li><small>Eleştirmenler</small><span class="meta-score" style="--c:${metaColor(d.critic_score)}">${d.critic_score}</span></li>` : ''}
            ${d.user_score ? `<li><small>Oyuncular</small><span class="meta-score" style="--c:${metaColor(d.user_score)}">${d.user_score}</span></li>` : ''}
          </ul>` : ''}
          ${g.genres?.length ? `<div class="sc-chips">${g.genres.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
          ${platforms.length ? `
            <div>
              <span class="eyebrow" style="margin-bottom:10px;display:flex">Platformlar · <span style="color:rgb(var(--tone))">dolu olanlarda oynadım</span></span>
              <div class="sc-chips">${platforms.slice(0, 10).map((p) => `<span class="chip ${mine.has(p) ? 'is-mine' : ''}">${esc(p)}</span>`).join('')}</div>
            </div>` : ''}
          ${timeline(g)}
          ${d.description ? `<p class="sc-desc"><small>Hakkında · IGDB</small>${esc(d.description.length > 520 ? `${d.description.slice(0, 520)}…` : d.description)}</p>` : ''}
          <div class="sc-actions">
            ${d.trailer ? `<button class="btn btn--accent" data-trailer="${esc(d.trailer)}">${icons.play} Fragmanı izle</button>` : ''}
            ${d.igdb_url ? `<a class="btn" href="${esc(d.igdb_url)}" target="_blank" rel="noopener">IGDB ${icons.arrowUpRight}</a>` : ''}
            ${d.website ? `<a class="btn" href="${esc(d.website)}" target="_blank" rel="noopener">Resmî site ${icons.arrowUpRight}</a>` : ''}
          </div>
        </div>
      </div>

      <section class="note" aria-label="Benim notum ve puanım">
        ${note(g)}
        <div class="score">
          ${ring(g.rating)}
          ${g.favorite ? `<span class="score__fav">${icons.heart} Favorilerimden</span>` : ''}
          ${compare(g.rating, d.critic_score ? d.critic_score / 10 : null, 'Eleştirmenler', 'eleştirmenlerden')}
        </div>
      </section>

      ${d.screenshots?.length ? `
      <section class="sc-section">
        <div class="sc-section__head"><h3>Oyundan kareler</h3><span class="eyebrow">${d.screenshots.length} görüntü</span></div>
        <div class="rail shots">
          ${d.screenshots.map((s) => `<button class="shot" data-shot="${esc(s)}"><img loading="lazy" src="${esc(igdbImg(s, 'screenshot_big'))}" alt=""></button>`).join('')}
        </div>
      </section>` : ''}

      ${recs.length ? `
      <section class="sc-section">
        <div class="sc-section__head"><h3>Raftaki benzerleri</h3><span class="eyebrow">benzer türler</span></div>
        <div class="recs">
          ${recs.map((r) => `
            <button class="rec" data-go="${r.id}">
              <div class="rec__img">${fallbackArt(r.title, r.year, hueFromString(r.title))}${r.cover_url ? `<img data-fallback loading="lazy" src="${esc(igdbImg(r.cover_url, 'cover_big'))}" alt="">` : ''}</div>
              <b>${esc(r.title)}</b><small>${(GAME_STATUS[r.status] || {}).short || ''}${r.rating != null ? ` · ${fmtScore(r.rating)}/10` : ''}</small>
            </button>`).join('')}
        </div>
      </section>` : ''}
    </div>
    ${keys}
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

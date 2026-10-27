import { mountLayout } from '../layout.js';
import { adminFetch } from '../api.js';
import { GAME_STATUS } from '../scenes.js';
import { esc, tmdbImg, rawgImg, fmtScore, imgFallbacks } from '../util.js';

mountLayout('');

const $ = (s, r = document) => r.querySelector(s);
const state = { films: [], games: [], projects: [] };

function toast(msg, bad = false) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = `toast${bad ? ' is-bad' : ''}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

async function run(fn, okMsg) {
  try {
    const r = await fn();
    if (okMsg) toast(okMsg);
    return r;
  } catch (err) {
    toast(err.message, true);
    throw err;
  }
}

async function loadList(type) {
  const res = await fetch(`/api/${type}`, { cache: 'no-store' });
  state[type] = res.ok ? await res.json() : [];
  ({ films: renderFilms, games: renderGames, projects: renderProjects })[type]();
}

const thumb = (src) => `<div class="item__img">${src ? `<img data-fallback loading="lazy" src="${esc(src)}" alt="">` : ''}</div>`;

// Ortak puan/not alanları
function commonFields(it = {}) {
  const r = it.rating ?? 8;
  return `
    <label class="field"><span>Puanım</span>
      <div class="range-wrap"><input type="range" name="rating" min="0" max="10" step="0.5" value="${r}"><output>${fmtScore(r)}/10</output></div>
    </label>
    <label class="field"><span>Notum</span><textarea class="textarea" name="review" placeholder="Bu konuda ne düşünüyorum…">${esc(it.review || '')}</textarea></label>
    <label class="check"><input type="checkbox" name="favorite" ${it.favorite ? 'checked' : ''}> Favorilerimden</label>`;
}

function bindRange(form) {
  const range = form.querySelector('input[type=range]');
  range?.addEventListener('input', () => { range.nextElementSibling.textContent = `${fmtScore(Number(range.value))}/10`; });
}

const formData = (form) => {
  const fd = new FormData(form);
  const o = Object.fromEntries(fd);
  o.favorite = fd.has('favorite');
  o.rating = Number(o.rating);
  return o;
};

// ================= FİLMLER =================

$('#film-search').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { q, year } = Object.fromEntries(new FormData(e.target));
  const box = $('#film-results');
  box.innerHTML = '<p class="hint">Aranıyor…</p>';
  const params = new URLSearchParams({ q });
  if (year) params.set('year', year);
  const hits = await run(() => adminFetch(`tmdb/search?${params}`)).catch(() => []);
  const owned = new Set(state.films.map((f) => f.tmdb_id));
  box.innerHTML = hits.length
    ? hits.map((h, i) => `
      <button class="result" data-i="${i}" ${owned.has(h.tmdb_id) ? 'disabled style="opacity:.4"' : ''}>
        <div class="result__img">${h.poster_path ? `<img data-fallback src="${tmdbImg(h.poster_path, 'w185')}" alt="">` : ''}</div>
        <b>${esc(h.title_tr)}</b><small>${h.year ?? '—'}${owned.has(h.tmdb_id) ? ' · arşivde' : ''}</small>
      </button>`).join('')
    : '<p class="hint">Sonuç yok.</p>';
  imgFallbacks(box);
  box.onclick = (ev) => {
    const b = ev.target.closest('[data-i]');
    if (!b || b.disabled) return;
    box.querySelectorAll('.result').forEach((x) => x.classList.toggle('is-picked', x === b));
    filmForm(hits[b.dataset.i]);
  };
});

function filmForm(hit, existing = null) {
  const it = existing || {};
  const holder = $('#film-form');
  holder.innerHTML = `
    <form class="form">
      <div class="form__title">
        ${hit.poster_path ? `<img src="${tmdbImg(hit.poster_path, 'w92')}" alt="">` : ''}
        <div><b>${esc(hit.title_tr)}</b><small>${esc(hit.title_original || '')} · ${hit.year ?? ''}</small></div>
      </div>
      ${commonFields(it)}
      <label class="field" style="max-width:220px"><span>İzleme tarihi</span><input class="input" type="date" name="watched_at" value="${esc(it.watched_at || (existing ? '' : new Date().toISOString().slice(0, 10)))}"></label>
      <div class="row" style="justify-content:flex-end">
        <button type="button" class="btn" data-cancel>Vazgeç</button>
        <button class="btn btn--accent">${existing ? 'Güncelle' : 'Arşive ekle'}</button>
      </div>
    </form>`;
  const form = holder.firstElementChild;
  bindRange(form);
  form.querySelector('[data-cancel]').onclick = () => { holder.innerHTML = ''; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = formData(form);
    const btn = form.querySelector('.btn--accent');
    btn.disabled = true;
    try {
      if (existing) await run(() => adminFetch(`films/${existing.id}`, { method: 'PUT', body }), 'Güncellendi');
      else await run(() => adminFetch('films', { method: 'POST', body: { ...body, tmdb_id: hit.tmdb_id } }), `${hit.title_tr} eklendi`);
      holder.innerHTML = '';
      $('#film-results').innerHTML = '';
      loadList('films');
    } catch { btn.disabled = false; }
  });
  holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderFilms() {
  const q = $('#film-filter').value.trim().toLocaleLowerCase('tr');
  const list = state.films.filter((f) => !q || f.title_tr.toLocaleLowerCase('tr').includes(q));
  $('#film-count').textContent = `(${state.films.length})`;
  $('#film-list').innerHTML = list.map((f) => `
    <div class="item">
      ${thumb(tmdbImg(f.poster_path, 'w92'))}
      <div><b>${esc(f.title_tr)}</b><small>${f.year ?? ''} · ${fmtScore(f.rating)}/10${f.favorite ? ' · ♥' : ''}${f.review ? ' · notlu' : ''}</small></div>
      <div class="item__actions">
        <button class="mini" data-edit="${f.id}">Düzenle</button>
        <button class="mini" data-refresh="${f.id}" title="TMDB'den bilgileri yeniden çek">Yenile</button>
        <button class="mini mini--danger" data-del="${f.id}">Sil</button>
      </div>
    </div>`).join('') || '<p class="hint">Henüz film yok.</p>';
  imgFallbacks($('#film-list'));
}
$('#film-filter').addEventListener('input', renderFilms);

$('#film-list').addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  const f = state.films.find((x) => String(x.id) === (t.dataset.edit || t.dataset.refresh || t.dataset.del));
  if (!f) return;
  if (t.dataset.edit) filmForm(f, f);
  if (t.dataset.refresh) { await run(() => adminFetch(`films/${f.id}/refresh`, { method: 'POST' }), 'TMDB bilgileri yenilendi'); loadList('films'); }
  if (t.dataset.del && confirm(`"${f.title_tr}" arşivden silinsin mi?`)) { await run(() => adminFetch(`films/${f.id}`, { method: 'DELETE' }), 'Silindi'); loadList('films'); }
});

// ================= OYUNLAR =================

$('#game-search').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = new FormData(e.target).get('q');
  const box = $('#game-results');
  box.innerHTML = '<p class="hint">Aranıyor…</p>';
  const hits = await run(() => adminFetch(`rawg/search?q=${encodeURIComponent(q)}`)).catch(() => []);
  const owned = new Set(state.games.map((g) => g.rawg_id));
  box.innerHTML = hits.length
    ? hits.map((h, i) => `
      <button class="result" data-i="${i}" ${owned.has(h.rawg_id) ? 'disabled style="opacity:.4"' : ''}>
        <div class="result__img">${h.cover_url ? `<img data-fallback src="${esc(rawgImg(h.cover_url, 420))}" alt="">` : ''}</div>
        <b>${esc(h.title)}</b><small>${h.year ?? '—'}${owned.has(h.rawg_id) ? ' · arşivde' : ''}</small>
      </button>`).join('')
    : '<p class="hint">Sonuç yok.</p>';
  imgFallbacks(box);
  box.onclick = (ev) => {
    const b = ev.target.closest('[data-i]');
    if (!b || b.disabled) return;
    box.querySelectorAll('.result').forEach((x) => x.classList.toggle('is-picked', x === b));
    gameForm(hits[b.dataset.i]);
  };
});

function gameForm(hit, existing = null) {
  const it = existing || {};
  const options = [...new Set([...(it.platforms || []), ...(hit.platforms || []), ...(hit.details?.all_platforms || []), 'PC'])];
  const mine = new Set(it.platforms || []);
  const holder = $('#game-form');
  holder.innerHTML = `
    <form class="form">
      <div class="form__title">
        ${hit.cover_url ? `<img src="${esc(rawgImg(hit.cover_url, 200))}" alt="" style="width:90px">` : ''}
        <div><b>${esc(hit.title)}</b><small>${hit.year ?? ''}</small></div>
      </div>
      <label class="field" style="max-width:260px"><span>Durum</span>
        <select class="input" name="status">${Object.entries(GAME_STATUS).map(([k, v]) => `<option value="${k}" ${(it.status || 'bitirdim') === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
      </label>
      <div class="field"><span>Oynadığım platform(lar)</span>
        <div class="platforms">${options.map((p) => `<label class="check"><input type="checkbox" name="platforms" value="${esc(p)}" ${mine.has(p) ? 'checked' : ''}> ${esc(p)}</label>`).join('')}</div>
      </div>
      <div class="row">
        <label class="field"><span>Başladım</span><input class="input" type="date" name="started_at" value="${esc(it.started_at || '')}"></label>
        <label class="field"><span>Bitirdim / bıraktım</span><input class="input" type="date" name="finished_at" value="${esc(it.finished_at || '')}"></label>
      </div>
      ${commonFields(it)}
      <div class="row" style="justify-content:flex-end">
        <button type="button" class="btn" data-cancel>Vazgeç</button>
        <button class="btn btn--accent">${existing ? 'Güncelle' : 'Arşive ekle'}</button>
      </div>
    </form>`;
  const form = holder.firstElementChild;
  bindRange(form);
  form.querySelector('[data-cancel]').onclick = () => { holder.innerHTML = ''; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = formData(form);
    body.platforms = new FormData(form).getAll('platforms');
    const btn = form.querySelector('.btn--accent');
    btn.disabled = true;
    try {
      if (existing) await run(() => adminFetch(`games/${existing.id}`, { method: 'PUT', body }), 'Güncellendi');
      else await run(() => adminFetch('games', { method: 'POST', body: { ...body, rawg_id: hit.rawg_id } }), `${hit.title} eklendi`);
      holder.innerHTML = '';
      $('#game-results').innerHTML = '';
      loadList('games');
    } catch { btn.disabled = false; }
  });
  holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderGames() {
  $('#game-count').textContent = `(${state.games.length})`;
  $('#game-list').innerHTML = state.games.map((g) => `
    <div class="item">
      ${thumb(rawgImg(g.cover_url, 200))}
      <div><b>${esc(g.title)}</b><small>${(GAME_STATUS[g.status] || {}).label || ''} · ${fmtScore(g.rating)}/10${g.favorite ? ' · ♥' : ''}</small></div>
      <div class="item__actions">
        <button class="mini" data-edit="${g.id}">Düzenle</button>
        <button class="mini" data-refresh="${g.id}">Yenile</button>
        <button class="mini mini--danger" data-del="${g.id}">Sil</button>
      </div>
    </div>`).join('') || '<p class="hint">Henüz oyun yok.</p>';
  imgFallbacks($('#game-list'));
}

$('#game-list').addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  const g = state.games.find((x) => String(x.id) === (t.dataset.edit || t.dataset.refresh || t.dataset.del));
  if (!g) return;
  if (t.dataset.edit) gameForm(g, g);
  if (t.dataset.refresh) { await run(() => adminFetch(`games/${g.id}/refresh`, { method: 'POST' }), 'RAWG bilgileri yenilendi'); loadList('games'); }
  if (t.dataset.del && confirm(`"${g.title}" arşivden silinsin mi?`)) { await run(() => adminFetch(`games/${g.id}`, { method: 'DELETE' }), 'Silindi'); loadList('games'); }
});

// ================= PROJELER =================

let editingProject = null;
const pform = $('#project-form');

function fillProject(p) {
  editingProject = p;
  pform.reset();
  if (p) {
    for (const [k, v] of Object.entries(p)) {
      const el = pform.elements[k];
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = Array.isArray(v) ? v.join(', ') : v ?? '';
    }
  }
  $('#project-form-title').textContent = p ? `Düzenle: ${p.title}` : 'Proje ekle';
  $('#project-cancel').hidden = !p;
}

$('#project-cancel').onclick = () => fillProject(null);
pform.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(pform);
  const body = Object.fromEntries(fd);
  body.featured = fd.has('featured');
  if (editingProject) await run(() => adminFetch(`projects/${editingProject.id}`, { method: 'PUT', body }), 'Güncellendi');
  else await run(() => adminFetch('projects', { method: 'POST', body }), 'Proje eklendi');
  fillProject(null);
  loadList('projects');
});

function renderProjects() {
  $('#project-list').innerHTML = state.projects.map((p) => `
    <div class="item">
      ${thumb(p.image_url)}
      <div><b>${esc(p.title)}</b><small>${esc(p.summary || '')}</small></div>
      <div class="item__actions">
        <button class="mini" data-edit="${p.id}">Düzenle</button>
        <button class="mini mini--danger" data-del="${p.id}">Sil</button>
      </div>
    </div>`).join('') || '<p class="hint">Henüz proje yok.</p>';
  imgFallbacks($('#project-list'));
}

$('#project-list').addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  const p = state.projects.find((x) => String(x.id) === (t.dataset.edit || t.dataset.del));
  if (!p) return;
  if (t.dataset.edit) { fillProject(p); pform.scrollIntoView({ behavior: 'smooth' }); }
  if (t.dataset.del && confirm(`"${p.title}" silinsin mi?`)) { await run(() => adminFetch(`projects/${p.id}`, { method: 'DELETE' }), 'Silindi'); loadList('projects'); }
});

// ================= TOPLU İÇE AKTAR =================

const YES = /^(evet|e|x|✓|true|1|yes|favori|♥)$/i;

function parseLines(raw, scale) {
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const sep = line.includes('\t') ? '\t' : line.includes('|') ? '|' : ',';
    const [title, year, rating, fav, date, ...rest] = line.split(sep).map((s) => s.trim());
    const r = parseFloat(String(rating || '').replace(',', '.'));
    let watched = null;
    const m = String(date || '').match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (m) watched = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(date || '')) watched = date;
    return {
      title,
      year: /^\d{4}$/.test(year || '') ? Number(year) : null,
      rating: Number.isFinite(r) ? (Number(scale) === 5 ? r * 2 : r) : null,
      favorite: YES.test(fav || ''),
      watched_at: watched,
      review: rest.join(sep).trim() || null,
    };
  }).filter((it, i) => it.title && !(i === 0 && /^(ad|film|isim|title|başlık)/i.test(it.title)));
}

$('#import-go').addEventListener('click', async () => {
  const items = parseLines($('#import-text').value, $('#import-scale').value);
  if (!items.length) return toast('Aktarılacak satır yok', true);
  const log = $('#import-log');
  const btn = $('#import-go');
  log.hidden = false;
  log.innerHTML = `${items.length} film işlenecek…\n`;
  btn.disabled = true;
  const icon = { eklendi: ['ok', '✓'], 'zaten-var': ['skip', '='], bulunamadi: ['bad', '?'], hata: ['bad', '✕'] };
  for (let i = 0; i < items.length; i += 10) {
    try {
      const { results } = await adminFetch('films/import', { method: 'POST', body: { items: items.slice(i, i + 10) } });
      results.forEach((r) => {
        const [cls, ch] = icon[r.status] || ['bad', '•'];
        log.innerHTML += `<span class="${cls}">${ch} ${esc(r.title)}${r.match ? ` → ${esc(r.match)}` : ''}${r.error ? ` (${esc(r.error)})` : ''}</span>\n`;
      });
    } catch (err) {
      log.innerHTML += `<span class="bad">✕ Paket ${i / 10 + 1} başarısız: ${esc(err.message)}</span>\n`;
    }
    log.scrollTop = log.scrollHeight;
  }
  log.innerHTML += '\nBitti. "?" işaretlileri Filmler sekmesinden elle arayıp ekleyebilirsin.';
  btn.disabled = false;
  loadList('films');
});

// ================= Başlat =================

$('#admin-tabs').addEventListener('click', (e) => {
  const t = e.target.closest('[data-tab]');
  if (!t) return;
  document.querySelectorAll('#admin-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
  document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== t.dataset.tab; });
});

adminFetch('me')
  .then((me) => {
    $('#whoami').innerHTML = `Giriş: <b>${esc(me.email)}</b>`;
    $('#app').hidden = false;
    ['films', 'games', 'projects'].forEach(loadList);
  })
  .catch((err) => {
    $('#whoami').textContent = 'Giriş yapılmadı';
    $('#gate').hidden = false;
    $('#gate-msg').textContent = err.message;
  });

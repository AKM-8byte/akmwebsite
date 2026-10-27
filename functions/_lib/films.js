// Drive tablosu + TMDB → site film kaydı. Hem Cloudflare Function'ı (canlı) hem
// scripts/sync.mjs (yerel) bu dosyayı kullanır; Node 18+ ve Workers'ta çalışır.

export const SHEET_ID = '109XTU5eyAmcDPfHfV15mgYfx6IlBXRdJnzT-u42OTkQ';
export const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export const norm = (s) =>
  String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// RFC 4180 uyumlu küçük CSV okuyucu (tırnaklı alanlar, satır içi virgül/satır sonu).
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

// Başlık satırındaki adlara göre kolonları bulur; sıra değişse de çalışır.
export function rowsToObjects(rows, aliases) {
  const header = rows[0].map(norm);
  const idx = Object.fromEntries(
    Object.entries(aliases).map(([key, names]) => [key, header.findIndex((h) => names.map(norm).includes(h))]),
  );
  return rows.slice(1).map((r) => Object.fromEntries(Object.entries(idx).map(([k, i]) => [k, i >= 0 ? (r[i] ?? '').trim() : ''])));
}

export const toNum = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
export const yes = (v) => /^(evet|e|x|true|1|yes|✓|♥)$/i.test(String(v).trim());
export const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, '').trim() || null;
const tmdbPath = (url) => (String(url).match(/\/t\/p\/[^/]+(\/[^/?#]+)$/) || [])[1] || null;

export function sheetRows(csvText) {
  return rowsToObjects(parseCsv(csvText), {
    title_tr: ['türkçe ad', 'turkce ad', 'ad'],
    title_original: ['orijinal ad', 'original title'],
    year: ['yıl', 'yil', 'year'],
    rating: ['puan', 'rating'],
    poster: ['afiş url', 'afis url', 'poster'],
    review: ['yorum', 'not', 'review'],
    liked: ['beğenildi', 'begenildi', 'liked'],
    letterboxd: ['letterboxd url', 'letterboxd'],
  }).filter((r) => r.title_tr || r.title_original);
}

// Bir tablo satırının TMDB önbellek anahtarı.
export const filmKey = (r) => `${norm(r.title_original || r.title_tr)}|${toNum(r.year) ?? ''}`;

// ---------------- TMDB ----------------

export function tmdbClient(token) {
  if (!token) return null;
  return async (p, params = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${p}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const headers = { accept: 'application/json' };
    if (token.length > 40) headers.authorization = `Bearer ${token}`;
    else url.searchParams.set('api_key', token);
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, { headers });
      if (res.status === 429) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      if (!res.ok) throw new Error(`TMDB ${res.status} ${p}`);
      return res.json();
    }
    throw new Error(`TMDB hız sınırı ${p}`);
  };
}

async function findMovieId(tmdb, title, year) {
  const tries = [{ query: title, primary_release_year: year }, { query: title, year }, { query: title }];
  for (const params of tries) {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
    const { results = [] } = await tmdb('/search/movie', { ...clean, include_adult: 'false' });
    if (!results.length) continue;
    const exact = results.find((r) => norm(r.original_title) === norm(title) || norm(r.title) === norm(title));
    return (exact || results[0]).id;
  }
  return null;
}

function pickTrailer(videos) {
  const list = (videos?.results || []).filter((v) => v.site === 'YouTube');
  const score = (v) => (v.type === 'Trailer' ? 4 : v.type === 'Teaser' ? 2 : 0) + (v.official ? 1 : 0);
  return list.sort((a, b) => score(b) - score(a))[0]?.key || null;
}

// Tablo satırı için TMDB detaylarını çeker (3 istek). Bulunamazsa { tmdb_id: null }.
export async function fetchMovie(tmdb, r) {
  const id = await findMovieId(tmdb, r.title_original || r.title_tr, toNum(r.year));
  if (!id) return { tmdb_id: null };
  const [en, tr] = await Promise.all([
    tmdb(`/movie/${id}`, { language: 'en-US', append_to_response: 'credits,videos' }),
    tmdb(`/movie/${id}`, { language: 'tr-TR' }),
  ]);
  return {
    tmdb_id: id,
    title_en: en.title,
    title_tr_tmdb: tr.title,
    backdrop_path: en.backdrop_path,
    poster_path: en.poster_path,
    overview_en: en.overview || null,
    overview_tr: tr.overview || null,
    tagline_en: en.tagline || null,
    tagline_tr: tr.tagline || null,
    genres_en: (en.genres || []).map((g) => g.name),
    genres_tr: (tr.genres || []).map((g) => g.name),
    runtime: en.runtime || null,
    release_date: en.release_date || null,
    vote_average: en.vote_average ? Math.round(en.vote_average * 10) / 10 : null,
    countries: (en.production_countries || []).map((c) => c.iso_3166_1),
    directors: (en.credits?.crew || []).filter((c) => c.job === 'Director').map((c) => c.name),
    cast: (en.credits?.cast || []).slice(0, 10).map((c) => ({ name: c.name, character: c.character, profile_path: c.profile_path })),
    trailer: pickTrailer(en.videos),
  };
}

// Tablo satırı + (varsa) TMDB detayı → sitenin kullandığı film kaydı.
export function buildFilm(r, d, i) {
  d = d || {};
  const rating = toNum(r.rating);
  return {
    id: i + 1,
    order: i,
    tmdb_id: d.tmdb_id || null,
    title_tr: r.title_tr || d.title_tr_tmdb || r.title_original,
    title_en: d.title_en || r.title_original || r.title_tr,
    title_original: r.title_original || null,
    year: toNum(r.year),
    poster_path: tmdbPath(r.poster) || d.poster_path || null,
    backdrop_path: d.backdrop_path || null,
    genres_tr: d.genres_tr || [],
    genres_en: d.genres_en || [],
    overview_tr: d.overview_tr || null,
    overview_en: d.overview_en || null,
    rating: rating == null ? null : rating * 2,
    review: stripTags(r.review),
    favorite: yes(r.liked),
    letterboxd_url: r.letterboxd || null,
    details: {
      tagline_tr: d.tagline_tr || null,
      tagline_en: d.tagline_en || null,
      runtime: d.runtime || null,
      vote_average: d.vote_average || null,
      countries: d.countries || [],
      directors: d.directors || [],
      cast: d.cast || [],
      trailer: d.trailer || null,
    },
  };
}

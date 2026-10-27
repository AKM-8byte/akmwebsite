// AKM veri senkronizasyonu
//   Google Drive'daki film tablosunu okur, TMDB'den Türkçe + İngilizce detayları ekler,
//   oyunları IGDB'den zenginleştirir ve sitenin okuduğu public/data/*.json dosyalarını yazar.
//
//   Kullanım:  node scripts/sync.mjs            (tablo + TMDB/IGDB)
//              node scripts/sync.mjs --offline  (internete çıkmadan, sadece önbellekten)
//
//   Anahtarlar .dev.vars dosyasından okunur (repoya girmez):
//     TMDB_TOKEN, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET
//   Anahtar yoksa site yine üretilir; sadece TMDB/IGDB detayları eksik kalır.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'data');
const CACHE_FILE = path.join(DATA, 'cache.json');

// Drive'daki "AKM Movies - Film Veritabanı" tablosu. Bağlantıya sahip herkes görüntüleyebilmeli.
const SHEET_ID = '109XTU5eyAmcDPfHfV15mgYfx6IlBXRdJnzT-u42OTkQ';
const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const OFFLINE = process.argv.includes('--offline');

// ---------------- yardımcılar ----------------

async function loadEnv() {
  const file = path.join(ROOT, '.dev.vars');
  if (!existsSync(file)) return {};
  const env = {};
  for (const line of (await readFile(file, 'utf8')).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !m[2].startsWith('buraya')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

// RFC 4180 uyumlu küçük CSV okuyucu (tırnaklı alanlar, satır içi virgül/satır sonu).
function parseCsv(text) {
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

const norm = (s) => String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

// Başlık satırındaki adlara göre kolonları bulur; sıra değişse de çalışır.
function rowsToObjects(rows, aliases) {
  const header = rows[0].map(norm);
  const idx = Object.fromEntries(
    Object.entries(aliases).map(([key, names]) => [key, header.findIndex((h) => names.map(norm).includes(h))]),
  );
  return rows.slice(1).map((r) => Object.fromEntries(Object.entries(idx).map(([k, i]) => [k, i >= 0 ? (r[i] ?? '').trim() : ''])));
}

const toNum = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const yes = (v) => /^(evet|e|x|true|1|yes|✓|♥)$/i.test(String(v).trim());
const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, '').trim() || null;
const tmdbPath = (url) => (url.match(/\/t\/p\/[^/]+(\/[^/?#]+)$/) || [])[1] || null;

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

// ---------------- TMDB ----------------

function tmdbClient(token) {
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
  const tries = [
    { query: title, primary_release_year: year },
    { query: title, year },
    { query: title },
  ];
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

async function movieDetails(tmdb, id) {
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

// ---------------- IGDB ----------------

function igdbClient(id, secret) {
  if (!id || !secret) return null;
  let token = null;
  return async (endpoint, body) => {
    if (!token) {
      const u = new URL('https://id.twitch.tv/oauth2/token');
      u.search = new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials' });
      const r = await fetch(u, { method: 'POST' });
      if (!r.ok) throw new Error(`Twitch giriş hatası ${r.status}`);
      token = (await r.json()).access_token;
    }
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: 'POST',
      headers: { 'Client-ID': id, authorization: `Bearer ${token}`, accept: 'application/json' },
      body,
    });
    if (!res.ok) throw new Error(`IGDB ${res.status}`);
    return res.json();
  };
}

const igdbImg = (imageId, size) => (imageId ? `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg` : null);
const platformName = (p) => (p.name.startsWith('PC (') ? 'PC' : p.name);

async function gameDetails(igdb, title) {
  const q = title.replace(/["\\]/g, ' ');
  const fields = `fields name, url, summary, first_release_date, aggregated_rating, total_rating,
    cover.image_id, artworks.image_id, screenshots.image_id, videos.video_id, genres.name, platforms.name,
    websites.url, websites.category, involved_companies.developer, involved_companies.company.name;`;
  const hits = await igdb('games', `search "${q}"; ${fields} where version_parent = null; limit 5;`);
  const g = hits.find((h) => norm(h.name) === norm(title)) || hits[0];
  if (!g) return null;
  const backdrop = g.artworks?.[0]?.image_id || g.screenshots?.[0]?.image_id;
  return {
    igdb_id: g.id,
    title: g.name,
    year: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
    genres: (g.genres || []).map((x) => x.name),
    cover_url: igdbImg(g.cover?.image_id, 'cover_big'),
    details: {
      released: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10) : null,
      critic_score: g.aggregated_rating ? Math.round(g.aggregated_rating) : null,
      user_score: g.total_rating ? Math.round(g.total_rating) : null,
      developers: (g.involved_companies || []).filter((c) => c.developer).map((c) => c.company?.name).filter(Boolean),
      all_platforms: [...new Set((g.platforms || []).map(platformName))],
      description: (g.summary || '').slice(0, 1200) || null,
      website: (g.websites || []).find((w) => w.category === 1)?.url || null,
      igdb_url: g.url || null,
      backdrop: igdbImg(backdrop, '1080p'),
      trailer: g.videos?.[0]?.video_id || null,
      screenshots: (g.screenshots || []).slice(0, 8).map((s) => igdbImg(s.image_id, '1080p')),
    },
  };
}

// ---------------- akış ----------------

async function readSheet() {
  if (!OFFLINE) {
    try {
      const res = await fetch(SHEET_CSV, { redirect: 'follow' });
      const type = res.headers.get('content-type') || '';
      if (res.ok && type.includes('text/csv')) {
        const text = await res.text();
        await writeFile(path.join(DATA, 'filmler.csv'), text);
        console.log('✓ Drive tablosu indirildi');
        return text;
      }
      console.warn('! Drive tablosu indirilemedi (tablo "bağlantıya sahip herkes görüntüleyebilir" olmalı). data/filmler.csv kullanılıyor.');
    } catch (err) {
      console.warn(`! Drive tablosu indirilemedi: ${err.message}. data/filmler.csv kullanılıyor.`);
    }
  }
  const local = path.join(DATA, 'filmler.csv');
  if (!existsSync(local)) throw new Error('Film tablosu yok: Drive paylaşımını aç ya da data/filmler.csv ekle.');
  return readFile(local, 'utf8');
}

async function syncFilms(tmdb, cache) {
  const rows = rowsToObjects(parseCsv(await readSheet()), {
    title_tr: ['türkçe ad', 'turkce ad', 'ad'],
    title_original: ['orijinal ad', 'original title'],
    year: ['yıl', 'yil', 'year'],
    rating: ['puan', 'rating'],
    poster: ['afiş url', 'afis url', 'poster'],
    review: ['yorum', 'not', 'review'],
    liked: ['beğenildi', 'begenildi', 'liked'],
    letterboxd: ['letterboxd url', 'letterboxd'],
  }).filter((r) => r.title_tr || r.title_original);

  let fetched = 0;
  let missing = 0;
  const films = await pool(rows, 6, async (r, i) => {
    const year = toNum(r.year);
    const key = `${norm(r.title_original || r.title_tr)}|${year ?? ''}`;
    let d = cache.films[key];
    if (!d && tmdb && !OFFLINE) {
      try {
        const id = await findMovieId(tmdb, r.title_original || r.title_tr, year);
        d = id ? await movieDetails(tmdb, id) : { tmdb_id: null };
        cache.films[key] = d;
        fetched++;
      } catch (err) {
        console.warn(`  ! ${r.title_tr}: ${err.message}`);
      }
    }
    if (!d?.tmdb_id) missing++;
    d = d || {};
    const rating = toNum(r.rating);
    return {
      id: i + 1,
      order: i,
      tmdb_id: d.tmdb_id || null,
      title_tr: r.title_tr || d.title_tr_tmdb || r.title_original,
      title_en: d.title_en || r.title_original || r.title_tr,
      title_original: r.title_original || null,
      year,
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
  });
  console.log(`✓ ${films.length} film (TMDB'den yeni çekilen: ${fetched}, detayı olmayan: ${missing})`);
  return films;
}

async function syncGames(igdb, cache) {
  const file = path.join(DATA, 'oyunlar.csv');
  if (!existsSync(file)) return [];
  const STATUS = { bitirdim: 'bitirdim', oynuyorum: 'oynuyorum', biraktim: 'biraktim', 'bıraktım': 'biraktim', oynayacagim: 'oynayacagim', 'oynayacağım': 'oynayacagim', sirada: 'oynayacagim', 'sırada': 'oynayacagim' };
  const rows = rowsToObjects(parseCsv(await readFile(file, 'utf8')), {
    title: ['ad', 'oyun', 'title'],
    status: ['durum', 'status'],
    rating: ['puan', 'rating'],
    platforms: ['platform', 'platformlar'],
    started_at: ['başladım', 'basladim', 'başlangıç'],
    finished_at: ['bitirdim', 'bitiş', 'bitis'],
    favorite: ['favori', 'beğenildi'],
    review: ['not', 'yorum', 'review'],
  }).filter((r) => r.title);

  const games = await pool(rows, 3, async (r, i) => {
    const key = norm(r.title);
    let d = cache.games[key];
    if (!d && igdb && !OFFLINE) {
      try {
        d = (await gameDetails(igdb, r.title)) || { igdb_id: null };
        cache.games[key] = d;
      } catch (err) {
        console.warn(`  ! ${r.title}: ${err.message}`);
      }
    }
    d = d || {};
    const rating = toNum(r.rating);
    const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    return {
      id: i + 1,
      order: i,
      igdb_id: d.igdb_id || null,
      title: d.title || r.title,
      year: d.year || null,
      genres: d.genres || [],
      cover_url: d.cover_url || null,
      status: STATUS[norm(r.status)] || STATUS[r.status?.toLowerCase()] || 'bitirdim',
      platforms: r.platforms ? r.platforms.split(/[;/]/).map((p) => p.trim()).filter(Boolean) : [],
      rating: rating == null ? null : rating * 2,
      review: stripTags(r.review),
      favorite: yes(r.favorite),
      started_at: date(r.started_at),
      finished_at: date(r.finished_at),
      details: d.details || {},
    };
  });
  console.log(`✓ ${games.length} oyun`);
  return games;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const env = { ...(await loadEnv()), ...process.env };
  const cache = existsSync(CACHE_FILE) ? JSON.parse(await readFile(CACHE_FILE, 'utf8')) : {};
  cache.films ||= {};
  cache.games ||= {};

  const tmdb = tmdbClient(env.TMDB_TOKEN);
  const igdb = igdbClient(env.IGDB_CLIENT_ID, env.IGDB_CLIENT_SECRET);
  if (!tmdb) console.warn('! TMDB_TOKEN yok: film detayları (özet, oyuncular, fragman) eklenmeyecek.');
  if (!igdb) console.warn('! IGDB anahtarları yok: oyun detayları eklenmeyecek.');

  const films = await syncFilms(tmdb, cache);
  const games = await syncGames(igdb, cache);
  const projects = JSON.parse(await readFile(path.join(DATA, 'projeler.json'), 'utf8'));

  const write = (name, data) => writeFile(path.join(OUT, `${name}.json`), JSON.stringify(data));
  await Promise.all([write('films', films), write('games', games), write('projects', projects)]);
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 1));
  console.log(`✓ public/data güncellendi (${new Date().toLocaleString('tr-TR')})`);
}

main().catch((err) => {
  console.error(`✕ ${err.message}`);
  process.exit(1);
});

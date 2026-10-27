// AKM veri senkronizasyonu
//   Canlı sitede filmler zaten /api/films ile Drive'dan otomatik okunur. Bu betik:
//   - public/data/*.json yedek kopyalarını üretir (tablo okunamazsa site bunlara düşer),
//   - oyunları IGDB'den zenginleştirir, projeleri kopyalar,
//   - --d1 ile yerel TMDB önbelleğini Cloudflare D1'e yükler.
//
//   Kullanım:  node scripts/sync.mjs            (tablo + TMDB/IGDB)
//              node scripts/sync.mjs --offline  (internete çıkmadan, sadece önbellekten)
//              node scripts/sync.mjs --d1       (ayrıca TMDB önbelleğini D1'e yükler)
//
//   Anahtarlar .dev.vars dosyasından okunur (repoya girmez):
//     TMDB_TOKEN, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET
//   Anahtar yoksa site yine üretilir; sadece TMDB/IGDB detayları eksik kalır.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  SHEET_CSV, norm, parseCsv, rowsToObjects, toNum, yes, stripTags, sheetRows, filmKey, tmdbClient, fetchMovie, buildFilm,
} from '../functions/_lib/films.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'data');
const CACHE_FILE = path.join(DATA, 'cache.json');

const OFFLINE = process.argv.includes('--offline');
const TO_D1 = process.argv.includes('--d1');

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
  const rows = sheetRows(await readSheet());
  let fetched = 0;
  const films = await pool(rows, 6, async (r, i) => {
    const key = filmKey(r);
    if (!cache.films[key] && tmdb && !OFFLINE) {
      try {
        cache.films[key] = await fetchMovie(tmdb, r);
        fetched++;
      } catch (err) {
        console.warn(`  ! ${r.title_tr}: ${err.message}`);
      }
    }
    return buildFilm(r, cache.films[key], i);
  });
  const missing = films.filter((f) => !f.tmdb_id).length;
  console.log(`✓ ${films.length} film (TMDB'den yeni çekilen: ${fetched}, detayı olmayan: ${missing})`);
  return films;
}

// Yerel TMDB önbelleğini D1'e yükler; canlı API yeni filmler dışında TMDB'ye gitmez.
function pushCacheToD1(cache) {
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const sql = Object.entries(cache.films)
    .map(([key, d]) => `INSERT OR REPLACE INTO film_tmdb (key, data) VALUES (${q(key)}, ${q(JSON.stringify(d))});`)
    .join('\n');
  const file = path.join(DATA, '.d1-seed.sql');
  return writeFile(file, sql).then(() => {
    execFileSync('npx', ['--yes', 'wrangler@4', 'd1', 'execute', 'akm-db', '--remote', '--yes', '--file=data/.d1-seed.sql'], {
      cwd: ROOT, stdio: 'inherit', shell: true,
    });
    console.log(`✓ ${Object.keys(cache.films).length} film detayı D1'e yüklendi`);
  });
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
  if (TO_D1) await pushCacheToD1(cache);
  console.log(`✓ public/data güncellendi (${new Date().toLocaleString('tr-TR')})`);
}

main().catch((err) => {
  console.error(`✕ ${err.message}`);
  process.exit(1);
});

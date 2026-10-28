// AKM veri senkronizasyonu
//   GitHub Actions bunu çalıştırır (siteyi yayınlamadan önce). Bu betik:
//   - filmleri Letterboxd dışa aktarımından, oyun ve projeleri Drive tablolarından okuyup public/data/*.json üretir,
//   - yeni film/oyun detaylarını TMDB/IGDB'den çekip yerel önbelleğe yazar,
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
import {
  SHEET_CSV, sheetRows, filmKey, tmdbClient, fetchMovie, buildFilm,
} from './lib/films.js';
import { letterboxdRows } from './lib/letterboxd.js';
import { GAMES_CSV, gameSheetRows, gameKey, igdbClient, gameDetails, buildGame } from './lib/games.js';
import { PROJECTS_CSV, projectSheetRows, buildProject } from './lib/projects.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'data');
const CACHE_FILE = path.join(DATA, 'cache.json');

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

// ---------------- akış ----------------

// Tabloyu Drive'dan indirir ve yerel yedeğe yazar; indirilemezse yerel yedeği kullanır.
async function readSheet(url, localName) {
  const local = path.join(DATA, localName);
  if (!OFFLINE) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const type = res.headers.get('content-type') || '';
      if (res.ok && type.includes('text/csv')) {
        const text = await res.text();
        await writeFile(local, text);
        console.log(`✓ Drive tablosu indirildi (${localName})`);
        return text;
      }
      console.warn(`! ${localName}: tablo indirilemedi ("bağlantıya sahip herkes görüntüleyebilir" olmalı). Yerel kopya kullanılıyor.`);
    } catch (err) {
      console.warn(`! ${localName}: tablo indirilemedi: ${err.message}. Yerel kopya kullanılıyor.`);
    }
  }
  if (!existsSync(local)) throw new Error(`${localName} yok: Drive paylaşımını aç ya da dosyayı ekle.`);
  return readFile(local, 'utf8');
}

// data/letterboxd/ doluysa filmlerin kaynağı Letterboxd dışa aktarımıdır; data/filmler.csv sadece
// eski Türkçe ad/afiş/yorum kaynağı olarak okunur (Drive'dan tekrar indirilmez).
async function filmRows() {
  const dir = path.join(DATA, 'letterboxd');
  const read = (f) => (existsSync(path.join(dir, f)) ? readFile(path.join(dir, f), 'utf8') : '');
  if (!existsSync(path.join(dir, 'watched.csv'))) return sheetRows(await readSheet(SHEET_CSV, 'filmler.csv'));
  const local = path.join(DATA, 'filmler.csv');
  const old = existsSync(local) ? sheetRows(await readFile(local, 'utf8')) : [];
  const [ratings, watched, reviews, likes] = await Promise.all(['ratings.csv', 'watched.csv', 'reviews.csv', 'likes/films.csv'].map(read));
  console.log('✓ Letterboxd dışa aktarımı okundu (data/letterboxd)');
  return letterboxdRows({ ratings, watched, reviews, likes }, old);
}

async function syncFilms(tmdb, cache) {
  const rows = await filmRows();
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

async function syncGames(igdb, cache) {
  const rows = gameSheetRows(await readSheet(GAMES_CSV, 'oyunlar.csv'));
  const games = await pool(rows, 3, async (r, i) => {
    const key = gameKey(r);
    if (!cache.games[key] && igdb && !OFFLINE) {
      try {
        cache.games[key] = await gameDetails(igdb, r.title);
      } catch (err) {
        console.warn(`  ! ${r.title}: ${err.message}`);
      }
    }
    return buildGame(r, cache.games[key], i);
  });
  console.log(`✓ ${games.length} oyun`);
  return games;
}

async function syncProjects() {
  const projects = projectSheetRows(await readSheet(PROJECTS_CSV, 'projeler.csv')).map(buildProject);
  console.log(`✓ ${projects.length} proje`);
  return projects;
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
  const projects = await syncProjects();

  const write = (name, data) => writeFile(path.join(OUT, `${name}.json`), JSON.stringify(data));
  await Promise.all([write('films', films), write('games', games), write('projects', projects)]);
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 1));
  console.log(`✓ public/data güncellendi (${new Date().toLocaleString('tr-TR')})`);
}

main().catch((err) => {
  console.error(`✕ ${err.message}`);
  process.exit(1);
});

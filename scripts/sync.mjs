// AKM veri senkronizasyonu
//   Canlı sitede filmler, oyunlar ve projeler /api/* ile Drive tablolarından otomatik okunur. Bu betik:
//   - public/data/*.json yedek kopyalarını üretir (tablo okunamazsa site bunlara düşer),
//   - yeni film/oyun detaylarını TMDB/IGDB'den çekip yerel önbelleğe yazar,
//   - --d1 ile yerel TMDB/IGDB önbelleğini Cloudflare D1'e yükler.
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
  SHEET_CSV, sheetRows, filmKey, tmdbClient, fetchMovie, buildFilm,
} from '../functions/_lib/films.js';
import { GAMES_CSV, gameSheetRows, gameKey, igdbClient, gameDetails, buildGame } from '../functions/_lib/games.js';
import { PROJECTS_CSV, projectSheetRows, buildProject } from '../functions/_lib/projects.js';

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

async function syncFilms(tmdb, cache) {
  const rows = sheetRows(await readSheet(SHEET_CSV, 'filmler.csv'));
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

// Yerel TMDB/IGDB önbelleğini D1'e yükler; canlı API yeni kayıtlar dışında dış servise gitmez.
function pushCacheToD1(cache) {
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const insert = (table, entries) =>
    Object.entries(entries).map(([key, d]) => `INSERT OR REPLACE INTO ${table} (key, data) VALUES (${q(key)}, ${q(JSON.stringify(d))});`);
  const sql = [...insert('film_tmdb', cache.films), ...insert('game_igdb', cache.games)].join('\n');
  const file = path.join(DATA, '.d1-seed.sql');
  return writeFile(file, sql).then(() => {
    execFileSync('npx', ['--yes', 'wrangler@4', 'd1', 'execute', 'akm-db', '--remote', '--yes', '--file=data/.d1-seed.sql'], {
      cwd: ROOT, stdio: 'inherit', shell: true,
    });
    console.log(`✓ ${Object.keys(cache.films).length} film, ${Object.keys(cache.games).length} oyun detayı D1'e yüklendi`);
  });
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
  if (TO_D1) await pushCacheToD1(cache);
  console.log(`✓ public/data güncellendi (${new Date().toLocaleString('tr-TR')})`);
}

main().catch((err) => {
  console.error(`✕ ${err.message}`);
  process.exit(1);
});

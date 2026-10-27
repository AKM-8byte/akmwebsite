// GET /api/films — film listesini her istekte Drive tablosundan canlı okur.
// Tabloya eklenen film birkaç dakika içinde sitede görünür; yayınlamaya gerek yok.
// TMDB detayları D1'de (film_tmdb) saklanır, sadece yeni filmler için TMDB'ye gidilir.
import { SHEET_CSV, sheetRows, filmKey, tmdbClient, fetchMovie, buildFilm } from '../_lib/films.js';

// Cloudflare bir istekte en fazla 50 dış istek sayar; film başına 3 → istek başına en çok 10 yeni film.
const MAX_NEW_PER_REQUEST = 10;

const json = (data, maxAge) =>
  new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${maxAge}, stale-while-revalidate=600`,
    },
  });

export async function onRequestGet({ request, env }) {
  let csv;
  try {
    // Tablo uçta 60 sn önbelleğe alınır: sık ziyarette Google'a yüklenmeyiz.
    const res = await fetch(SHEET_CSV, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('text/csv')) throw new Error(`tablo ${res.status}`);
    csv = await res.text();
  } catch (err) {
    // Tablo okunamazsa son yayınlanan kopyaya düş.
    console.error('Drive tablosu okunamadı:', err.message);
    return env.ASSETS.fetch(new URL('/data/films.json', request.url));
  }

  const rows = sheetRows(csv);
  const keys = rows.map(filmKey);

  const cached = new Map();
  if (env.DB) {
    const { results } = await env.DB.prepare('SELECT key, data FROM film_tmdb').all();
    for (const r of results) cached.set(r.key, JSON.parse(r.data));
  }

  const tmdb = tmdbClient(env.TMDB_TOKEN);
  const missing = [...new Set(keys.filter((k) => !cached.has(k)))];
  if (tmdb && env.DB && missing.length) {
    const batch = missing.slice(0, MAX_NEW_PER_REQUEST);
    const fetched = await Promise.all(
      batch.map(async (key) => {
        try {
          return [key, await fetchMovie(tmdb, rows[keys.indexOf(key)])];
        } catch (err) {
          console.error('TMDB:', key, err.message);
          return null;
        }
      }),
    );
    const ok = fetched.filter(Boolean);
    if (ok.length) {
      await env.DB.batch(
        ok.map(([key, d]) =>
          env.DB.prepare('INSERT OR REPLACE INTO film_tmdb (key, data, updated_at) VALUES (?, ?, datetime(\'now\'))').bind(key, JSON.stringify(d)),
        ),
      );
      ok.forEach(([key, d]) => cached.set(key, d));
    }
  }

  const films = rows.map((r, i) => buildFilm(r, cached.get(keys[i]), i));
  // Detayı henüz çekilmemiş film varsa kısa önbellek: bir sonraki ziyarette tamamlanır.
  const pending = keys.some((k) => !cached.has(k));
  return json(films, pending ? 5 : 60);
}

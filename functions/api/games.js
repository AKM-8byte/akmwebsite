// GET /api/games — oyun listesini her istekte Drive tablosundan canlı okur.
// IGDB detayları D1'de (game_igdb) saklanır, sadece yeni oyunlar için IGDB'ye gidilir.
import { GAMES_CSV, gameSheetRows, gameKey, igdbClient, gameDetails, buildGame } from '../_lib/games.js';

// Bir istekte en fazla 50 dış istek: oyun başına 1 + token 1 → en çok 20 yeni oyun.
const MAX_NEW_PER_REQUEST = 20;

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
    const res = await fetch(GAMES_CSV, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('text/csv')) throw new Error(`tablo ${res.status}`);
    csv = await res.text();
  } catch (err) {
    console.error('Oyun tablosu okunamadı:', err.message);
    return env.ASSETS.fetch(new URL('/data/games.json', request.url));
  }

  const rows = gameSheetRows(csv);
  const keys = rows.map(gameKey);

  const cached = new Map();
  if (env.DB) {
    const { results } = await env.DB.prepare('SELECT key, data FROM game_igdb').all();
    for (const r of results) cached.set(r.key, JSON.parse(r.data));
  }

  const igdb = igdbClient(env.IGDB_CLIENT_ID, env.IGDB_CLIENT_SECRET);
  const missing = [...new Set(keys.filter((k) => !cached.has(k)))];
  if (igdb && env.DB && missing.length) {
    const batch = missing.slice(0, MAX_NEW_PER_REQUEST);
    const fetched = [];
    // Twitch token'ı bir kez alınsın diye ilk oyun tek başına, kalanlar paralel.
    for (const group of [batch.slice(0, 1), batch.slice(1)]) {
      const part = await Promise.all(
        group.map(async (key) => {
          try {
            return [key, await gameDetails(igdb, rows[keys.indexOf(key)].title)];
          } catch (err) {
            console.error('IGDB:', key, err.message);
            return null;
          }
        }),
      );
      fetched.push(...part);
    }
    const ok = fetched.filter(Boolean);
    if (ok.length) {
      await env.DB.batch(
        ok.map(([key, d]) =>
          env.DB.prepare('INSERT OR REPLACE INTO game_igdb (key, data, updated_at) VALUES (?, ?, datetime(\'now\'))').bind(key, JSON.stringify(d)),
        ),
      );
      ok.forEach(([key, d]) => cached.set(key, d));
    }
  }

  const games = rows.map((r, i) => buildGame(r, cached.get(keys[i]), i));
  const pending = keys.some((k) => !cached.has(k));
  return json(games, pending ? 5 : 60);
}

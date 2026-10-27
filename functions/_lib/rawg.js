import { HttpError } from './http.js';

const BASE = 'https://api.rawg.io/api';

async function rawg(env, path, params = {}) {
  if (!env.RAWG_KEY) throw new HttpError(500, 'RAWG_KEY tanımlı değil');
  const url = new URL(BASE + path);
  url.searchParams.set('key', env.RAWG_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new HttpError(502, `RAWG hatası (${res.status})`);
  return res.json();
}

export async function searchGames(env, query) {
  const data = await rawg(env, '/games', { search: query, page_size: '12' });
  return (data.results || []).map((g) => ({
    rawg_id: g.id,
    title: g.name,
    year: g.released ? Number(g.released.slice(0, 4)) : null,
    cover_url: g.background_image,
    platforms: (g.platforms || []).map((p) => p.platform.name),
  }));
}

export async function getGame(env, id) {
  const [g, shots] = await Promise.all([
    rawg(env, `/games/${id}`),
    rawg(env, `/games/${id}/screenshots`, { page_size: '8' }).catch(() => ({ results: [] })),
  ]);
  return {
    rawg_id: g.id,
    title: g.name,
    year: g.released ? Number(g.released.slice(0, 4)) : null,
    genres: (g.genres || []).map((x) => x.name),
    cover_url: g.background_image,
    details: {
      released: g.released || null,
      metacritic: g.metacritic || null,
      playtime: g.playtime || null,
      developers: (g.developers || []).map((d) => d.name),
      publishers: (g.publishers || []).map((d) => d.name),
      all_platforms: (g.platforms || []).map((p) => p.platform.name),
      description: (g.description_raw || '').slice(0, 1200) || null,
      website: g.website || null,
      cover_alt: g.background_image_additional || null,
      screenshots: (shots.results || []).map((s) => s.image).slice(0, 8),
    },
  };
}

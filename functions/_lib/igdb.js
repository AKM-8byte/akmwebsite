import { HttpError } from './http.js';

// IGDB (Twitch'e ait, ücretsiz). Kimlik: Twitch geliştirici uygulamasının Client ID + Secret'ı.
// Bunlarla bir "app access token" alınır (~60 gün geçerli) ve isolate içinde önbelleğe alınır.
const API = 'https://api.igdb.com/v4';
const IMG = 'https://images.igdb.com/igdb/image/upload';

let tokenCache = { value: null, expiresAt: 0 };

async function getToken(env) {
  if (tokenCache.value && Date.now() < tokenCache.expiresAt) return tokenCache.value;
  if (!env.IGDB_CLIENT_ID || !env.IGDB_CLIENT_SECRET) {
    throw new HttpError(500, 'IGDB_CLIENT_ID / IGDB_CLIENT_SECRET tanımlı değil');
  }
  const url = new URL('https://id.twitch.tv/oauth2/token');
  url.searchParams.set('client_id', env.IGDB_CLIENT_ID);
  url.searchParams.set('client_secret', env.IGDB_CLIENT_SECRET);
  url.searchParams.set('grant_type', 'client_credentials');
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new HttpError(502, `Twitch kimlik doğrulaması başarısız (${res.status})`);
  const data = await res.json();
  tokenCache = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 300) * 1000 };
  return tokenCache.value;
}

async function igdb(env, endpoint, body) {
  const res = await fetch(`${API}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': env.IGDB_CLIENT_ID,
      authorization: `Bearer ${await getToken(env)}`,
      accept: 'application/json',
    },
    body,
  });
  if (res.status === 401) tokenCache = { value: null, expiresAt: 0 };
  if (!res.ok) throw new HttpError(502, `IGDB hatası (${res.status})`);
  return res.json();
}

const img = (imageId, size) => (imageId ? `${IMG}/t_${size}/${imageId}.jpg` : null);
const year = (unix) => (unix ? new Date(unix * 1000).getUTCFullYear() : null);
const isoDate = (unix) => (unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null);
// "PC (Microsoft Windows)" → "PC"
const platformName = (p) => (p.name.startsWith('PC (') ? 'PC' : p.name);

export async function searchGames(env, query) {
  const q = query.replace(/["\\]/g, ' ');
  const data = await igdb(
    env,
    'games',
    `search "${q}"; fields name, first_release_date, cover.image_id, platforms.name; where version_parent = null; limit 12;`,
  );
  return data.map((g) => ({
    igdb_id: g.id,
    title: g.name,
    year: year(g.first_release_date),
    cover_url: img(g.cover?.image_id, 'cover_big'),
    platforms: [...new Set((g.platforms || []).map(platformName))],
  }));
}

export async function getGame(env, id) {
  const [g] = await igdb(
    env,
    'games',
    `fields name, url, summary, first_release_date, aggregated_rating, total_rating,
       cover.image_id, artworks.image_id, screenshots.image_id, videos.video_id,
       genres.name, platforms.name, websites.url, websites.category,
       involved_companies.developer, involved_companies.publisher, involved_companies.company.name;
     where id = ${Number(id)};`,
  );
  if (!g) throw new HttpError(404, 'IGDB\'de oyun bulunamadı');

  const companies = g.involved_companies || [];
  const backdrop = g.artworks?.[0]?.image_id || g.screenshots?.[0]?.image_id;
  return {
    igdb_id: g.id,
    title: g.name,
    year: year(g.first_release_date),
    genres: (g.genres || []).map((x) => x.name),
    cover_url: img(g.cover?.image_id, 'cover_big'),
    details: {
      released: isoDate(g.first_release_date),
      critic_score: g.aggregated_rating ? Math.round(g.aggregated_rating) : null,
      user_score: g.total_rating ? Math.round(g.total_rating) : null,
      developers: companies.filter((c) => c.developer).map((c) => c.company?.name).filter(Boolean),
      publishers: companies.filter((c) => c.publisher).map((c) => c.company?.name).filter(Boolean),
      all_platforms: [...new Set((g.platforms || []).map(platformName))],
      description: (g.summary || '').slice(0, 1200) || null,
      website: (g.websites || []).find((w) => w.category === 1)?.url || null,
      igdb_url: g.url || null,
      backdrop: img(backdrop, '1080p'),
      trailer: g.videos?.[0]?.video_id || null,
      screenshots: (g.screenshots || []).slice(0, 8).map((s) => img(s.image_id, '1080p')),
    },
  };
}

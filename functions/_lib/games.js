// Drive oyun tablosu + IGDB → site oyun kaydı. Hem Cloudflare Function'ı (canlı) hem
// scripts/sync.mjs (yerel) bu dosyayı kullanır.
import { norm, parseCsv, rowsToObjects, toNum, yes, stripTags } from './films.js';

export const GAMES_SHEET_ID = '1-zdEPACCAm20meenV-YeFlWb8LQL86dEuRWAOcZURTg';
export const GAMES_CSV = `https://docs.google.com/spreadsheets/d/${GAMES_SHEET_ID}/export?format=csv`;

const STATUS = {
  bitirdim: 'bitirdim', oynuyorum: 'oynuyorum', biraktim: 'biraktim', oynayacagim: 'oynayacagim', sirada: 'oynayacagim',
};

export function gameSheetRows(csvText) {
  return rowsToObjects(parseCsv(csvText), {
    title: ['ad', 'oyun', 'title'],
    status: ['durum', 'status'],
    rating: ['puan', 'rating'],
    platforms: ['platform', 'platformlar'],
    started_at: ['başladım', 'basladim', 'başlangıç'],
    finished_at: ['bitirdim', 'bitiş', 'bitis'],
    favorite: ['favori', 'beğenildi'],
    review: ['not', 'yorum', 'review'],
  }).filter((r) => r.title);
}

export const gameKey = (r) => norm(r.title);

// ---------------- IGDB ----------------

export function igdbClient(id, secret) {
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

export async function gameDetails(igdb, title) {
  const q = title.replace(/["\\]/g, ' ');
  const fields = `fields name, url, summary, first_release_date, aggregated_rating, total_rating,
    cover.image_id, artworks.image_id, screenshots.image_id, videos.video_id, genres.name, platforms.name,
    websites.url, websites.category, involved_companies.developer, involved_companies.company.name;`;
  const hits = await igdb('games', `search "${q}"; ${fields} where version_parent = null; limit 5;`);
  const g = hits.find((h) => norm(h.name) === norm(title)) || hits[0];
  if (!g) return { igdb_id: null };
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

// Tablo satırı + (varsa) IGDB detayı → sitenin kullandığı oyun kaydı.
export function buildGame(r, d, i) {
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
    status: STATUS[norm(r.status)] || 'bitirdim',
    platforms: r.platforms ? r.platforms.split(/[;/]/).map((p) => p.trim()).filter(Boolean) : [],
    rating: rating == null ? null : rating * 2,
    review: stripTags(r.review),
    favorite: yes(r.favorite),
    started_at: date(r.started_at),
    finished_at: date(r.finished_at),
    details: d.details || {},
  };
}

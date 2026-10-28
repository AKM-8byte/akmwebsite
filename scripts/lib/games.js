// Drive oyun tablosu + IGDB → site oyun kaydı. Hem Cloudflare Function'ı (canlı) hem
// scripts/sync.mjs (yerel) bu dosyayı kullanır.
import { norm, parseCsv, rowsToObjects, toNum, yes, stripTags } from './films.js';

export const GAMES_SHEET_ID = '1mBIu_u2SYgbXXcCjpxoAbFYPu5SxPY7IoqCVuJp_eqE';
export const GAMES_CSV = `https://docs.google.com/spreadsheets/d/${GAMES_SHEET_ID}/export?format=csv`;

const STATUS = {
  bitirdim: 'bitirdim', oynuyorum: 'oynuyorum', biraktim: 'biraktim', oynayacagim: 'oynayacagim', sirada: 'oynayacagim',
};

export function gameSheetRows(csvText) {
  return rowsToObjects(parseCsv(csvText), {
    title: ['ad', 'oyun', 'title'],
    igdb_name: ['igdb adı', 'igdb adi', 'igdb'],
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

// Tabloya kısa yazılan adları (GTA 5, Gta San Andreas...) IGDB'deki resmi ada çevirir.
// Başka bir oyun için eşleşme tutmazsa tabloya "IGDB Adı" sütunu ekleyip resmi adı oraya yazabilirsin.
const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
export function igdbSearchName(title) {
  let t = String(title).trim().replace(/\s+/g, ' ');
  if (/^gta\b/i.test(t)) {
    t = t.replace(/^gta\b/i, 'Grand Theft Auto').replace(/^(Grand Theft Auto) ([1-5])\b/, (_, a, n) => `${a} ${ROMAN[n]}`);
    t = t.replace(/^(Grand Theft Auto) (San Andreas|Vice City Stories|Vice City|Liberty City Stories|Chinatown Wars)\b/i, '$1: $2');
  }
  return t;
}

// Aynı adlı birden fazla oyun olduğunda doğru yılı seçmek için hazır eşleştirmeler.
// Tabloda "IGDB Adı" sütununa "Ad (yıl)" yazarak (örn. "Mafia (2002)") yenisini kendin de ekleyebilirsin.
const ALIASES = {
  mafiathecityoflostheaven: 'Mafia (2002)',
  maxpayne: 'Max Payne (2001)',
};

export async function gameDetails(igdb, rawTitle) {
  const hinted = ALIASES[norm(rawTitle)] || rawTitle;
  const yearHint = Number((String(hinted).match(/\((\d{4})\)\s*$/) || [])[1]) || null;
  const title = igdbSearchName(String(hinted).replace(/\s*\(\d{4}\)\s*$/, ''));
  const q = title.replace(/["\\]/g, ' ');
  const fields = `fields name, url, summary, first_release_date, aggregated_rating, total_rating,
    cover.image_id, artworks.image_id, screenshots.image_id, videos.video_id, genres.name, platforms.name,
    websites.url, websites.category, involved_companies.developer, involved_companies.company.name;`;
  // Yıl verildiyse sadece o yıl çıkan oyunlar aranır (unix saniye cinsinden aralık).
  const range = yearHint
    ? ` & first_release_date >= ${Date.UTC(yearHint, 0, 1) / 1000} & first_release_date < ${Date.UTC(yearHint + 1, 0, 1) / 1000}`
    : '';
  const search = (text) => igdb('games', `search "${text}"; ${fields} where version_parent = null${range}; limit 10;`);
  let hits = await search(q);
  // "Mafia: The City of Lost Heaven" IGDB'de sadece "Mafia" — alt başlıksız da dene.
  if (!hits.length && q.includes(':')) hits = await search(q.split(':')[0].trim());
  // Aynı adlı çıkmamış remake'ler yerine, çıkış tarihi olan en eski eşleşmeyi seç.
  const released = (h) => h.first_release_date && h.first_release_date * 1000 < Date.now();
  const exact = hits.filter((h) => norm(h.name) === norm(title) || norm(h.name) === norm(q.split(':')[0]));
  const g =
    exact.filter(released).sort((a, b) => a.first_release_date - b.first_release_date)[0] ||
    hits.find(released) || exact[0] || hits[0];
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

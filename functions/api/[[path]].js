import { HttpError, json, readBody, toInt, toRating, toDate, toBool, text } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { searchMovies, getMovie } from '../_lib/tmdb.js';
import { searchGames, getGame } from '../_lib/igdb.js';

const GAME_STATUSES = ['bitirdim', 'oynuyorum', 'biraktim', 'oynayacagim'];

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function filmRow(r) {
  return { ...r, favorite: !!r.favorite, genres: parseJson(r.genres, []), details: parseJson(r.details, {}) };
}

function gameRow(r) {
  return {
    ...r,
    favorite: !!r.favorite,
    genres: parseJson(r.genres, []),
    platforms: parseJson(r.platforms, []),
    details: parseJson(r.details, {}),
  };
}

function projectRow(r) {
  return {
    ...r,
    featured: !!r.featured,
    tech: (r.tech || '').split(',').map((t) => t.trim()).filter(Boolean),
  };
}

function slugify(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return String(s)
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => map[c])
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'proje';
}

// ---------- Herkese açık okuma uçları ----------

async function publicRoute(db, method, [type, id]) {
  if (method !== 'GET') throw new HttpError(405, 'Sadece GET');

  if (type === 'films') {
    if (id) {
      const r = await db.prepare('SELECT * FROM films WHERE id = ?').bind(toInt(id)).first();
      if (!r) throw new HttpError(404, 'Film bulunamadı');
      return json(filmRow(r), { cache: true });
    }
    const { results } = await db
      .prepare('SELECT * FROM films ORDER BY COALESCE(watched_at, created_at) DESC, id DESC')
      .all();
    return json(results.map(filmRow), { cache: true });
  }

  if (type === 'games') {
    if (id) {
      const r = await db.prepare('SELECT * FROM games WHERE id = ?').bind(toInt(id)).first();
      if (!r) throw new HttpError(404, 'Oyun bulunamadı');
      return json(gameRow(r), { cache: true });
    }
    const { results } = await db
      .prepare('SELECT * FROM games ORDER BY COALESCE(finished_at, started_at, created_at) DESC, id DESC')
      .all();
    return json(results.map(gameRow), { cache: true });
  }

  if (type === 'projects') {
    if (id) {
      const r = await db.prepare('SELECT * FROM projects WHERE slug = ?').bind(id).first();
      if (!r) throw new HttpError(404, 'Proje bulunamadı');
      return json(projectRow(r), { cache: true });
    }
    const { results } = await db
      .prepare('SELECT * FROM projects ORDER BY featured DESC, COALESCE(date, created_at) DESC')
      .all();
    return json(results.map(projectRow), { cache: true });
  }

  throw new HttpError(404, 'Bulunamadı');
}

// ---------- Admin: filmler ----------

async function insertFilm(db, env, tmdbId, body) {
  const m = await getMovie(env, tmdbId);
  const r = await db
    .prepare(
      `INSERT INTO films (tmdb_id, title_tr, title_original, year, genres, poster_path, backdrop_path,
         overview_tr, rating, review, favorite, watched_at, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(
      m.tmdb_id, m.title_tr, m.title_original, m.year, JSON.stringify(m.genres), m.poster_path,
      m.backdrop_path, m.overview_tr, toRating(body.rating), text(body.review), toBool(body.favorite),
      toDate(body.watched_at), JSON.stringify(m.details),
    )
    .first();
  return filmRow(r);
}

async function adminFilms(db, env, request, method, [id, action]) {
  if (method === 'POST' && id === 'import') return importFilms(db, env, await readBody(request));

  if (method === 'POST' && !id) {
    const body = await readBody(request);
    const tmdbId = toInt(body.tmdb_id);
    if (!tmdbId) throw new HttpError(400, 'tmdb_id gerekli');
    const exists = await db.prepare('SELECT id FROM films WHERE tmdb_id = ?').bind(tmdbId).first();
    if (exists) throw new HttpError(409, 'Bu film zaten arşivde');
    return json(await insertFilm(db, env, tmdbId, body), { status: 201 });
  }

  const filmId = toInt(id);
  if (!filmId) throw new HttpError(400, 'Film id gerekli');

  if (method === 'POST' && action === 'refresh') {
    const cur = await db.prepare('SELECT tmdb_id FROM films WHERE id = ?').bind(filmId).first();
    if (!cur?.tmdb_id) throw new HttpError(404, 'Film bulunamadı');
    const m = await getMovie(env, cur.tmdb_id);
    const r = await db
      .prepare(
        `UPDATE films SET title_tr = ?, title_original = ?, year = ?, genres = ?, poster_path = ?,
           backdrop_path = ?, overview_tr = ?, details = ? WHERE id = ? RETURNING *`,
      )
      .bind(
        m.title_tr, m.title_original, m.year, JSON.stringify(m.genres), m.poster_path,
        m.backdrop_path, m.overview_tr, JSON.stringify(m.details), filmId,
      )
      .first();
    return json(filmRow(r));
  }

  if (method === 'PUT') {
    const body = await readBody(request);
    const r = await db
      .prepare('UPDATE films SET rating = ?, review = ?, favorite = ?, watched_at = ? WHERE id = ? RETURNING *')
      .bind(toRating(body.rating), text(body.review), toBool(body.favorite), toDate(body.watched_at), filmId)
      .first();
    if (!r) throw new HttpError(404, 'Film bulunamadı');
    return json(filmRow(r));
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM films WHERE id = ?').bind(filmId).run();
    return json({ ok: true });
  }

  throw new HttpError(405, 'Desteklenmeyen işlem');
}

// Toplu içe aktarma: her satır { title, year?, rating?, favorite?, review?, watched_at? }.
// Cloudflare bir istekte en fazla 50 dış istek sayar; film başına 2–3 istek → 10'luk paketler.
async function importFilms(db, env, body) {
  const items = Array.isArray(body.items) ? body.items.slice(0, 10) : [];
  const results = [];
  for (const item of items) {
    const title = text(item.title, 200);
    if (!title) continue;
    try {
      const year = toInt(item.year);
      let hits = await searchMovies(env, title, year);
      if (!hits.length && year) hits = await searchMovies(env, title);
      if (!hits.length) {
        results.push({ title, status: 'bulunamadi' });
        continue;
      }
      const exists = await db.prepare('SELECT id FROM films WHERE tmdb_id = ?').bind(hits[0].tmdb_id).first();
      if (exists) {
        results.push({ title, status: 'zaten-var', match: hits[0].title_tr });
        continue;
      }
      const film = await insertFilm(db, env, hits[0].tmdb_id, item);
      results.push({ title, status: 'eklendi', match: `${film.title_tr} (${film.year ?? '?'})` });
    } catch (err) {
      results.push({ title, status: 'hata', error: err.message });
    }
  }
  return json({ results });
}

// ---------- Admin: oyunlar ----------

function gameFields(body) {
  const status = GAME_STATUSES.includes(body.status) ? body.status : 'bitirdim';
  const platforms = Array.isArray(body.platforms) ? body.platforms.map((p) => text(p, 60)).filter(Boolean) : [];
  return [
    status, JSON.stringify(platforms), toRating(body.rating), text(body.review), toBool(body.favorite),
    toDate(body.started_at), toDate(body.finished_at),
  ];
}

async function adminGames(db, env, request, method, [id, action]) {
  if (method === 'POST' && !id) {
    const body = await readBody(request);
    const igdbId = toInt(body.igdb_id);
    if (!igdbId) throw new HttpError(400, 'igdb_id gerekli');
    const exists = await db.prepare('SELECT id FROM games WHERE igdb_id = ?').bind(igdbId).first();
    if (exists) throw new HttpError(409, 'Bu oyun zaten arşivde');
    const g = await getGame(env, igdbId);
    const r = await db
      .prepare(
        `INSERT INTO games (igdb_id, title, year, genres, cover_url, details,
           status, platforms, rating, review, favorite, started_at, finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .bind(g.igdb_id, g.title, g.year, JSON.stringify(g.genres), g.cover_url, JSON.stringify(g.details), ...gameFields(body))
      .first();
    return json(gameRow(r), { status: 201 });
  }

  const gameId = toInt(id);
  if (!gameId) throw new HttpError(400, 'Oyun id gerekli');

  if (method === 'POST' && action === 'refresh') {
    const cur = await db.prepare('SELECT igdb_id FROM games WHERE id = ?').bind(gameId).first();
    if (!cur?.igdb_id) throw new HttpError(404, 'Oyun bulunamadı');
    const g = await getGame(env, cur.igdb_id);
    const r = await db
      .prepare('UPDATE games SET title = ?, year = ?, genres = ?, cover_url = ?, details = ? WHERE id = ? RETURNING *')
      .bind(g.title, g.year, JSON.stringify(g.genres), g.cover_url, JSON.stringify(g.details), gameId)
      .first();
    return json(gameRow(r));
  }

  if (method === 'PUT') {
    const body = await readBody(request);
    const r = await db
      .prepare(
        `UPDATE games SET status = ?, platforms = ?, rating = ?, review = ?, favorite = ?,
           started_at = ?, finished_at = ? WHERE id = ? RETURNING *`,
      )
      .bind(...gameFields(body), gameId)
      .first();
    if (!r) throw new HttpError(404, 'Oyun bulunamadı');
    return json(gameRow(r));
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM games WHERE id = ?').bind(gameId).run();
    return json({ ok: true });
  }

  throw new HttpError(405, 'Desteklenmeyen işlem');
}

// ---------- Admin: projeler ----------

function projectFields(body) {
  const tech = Array.isArray(body.tech) ? body.tech.join(', ') : body.tech;
  return [
    text(body.title, 200), text(body.summary, 400), text(body.description, 20000), text(body.image_url, 1000),
    text(tech, 500), text(body.live_url, 1000), text(body.github_url, 1000), toBool(body.featured), toDate(body.date),
  ];
}

async function adminProjects(db, request, method, [id]) {
  if (method === 'POST' && !id) {
    const body = await readBody(request);
    if (!text(body.title)) throw new HttpError(400, 'Başlık gerekli');
    let slug = slugify(body.slug || body.title);
    const taken = await db.prepare('SELECT id FROM projects WHERE slug = ?').bind(slug).first();
    if (taken) slug = `${slug}-${Date.now().toString(36)}`;
    const r = await db
      .prepare(
        `INSERT INTO projects (title, summary, description, image_url, tech, live_url, github_url, featured, date, slug)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .bind(...projectFields(body), slug)
      .first();
    return json(projectRow(r), { status: 201 });
  }

  const projectId = toInt(id);
  if (!projectId) throw new HttpError(400, 'Proje id gerekli');

  if (method === 'PUT') {
    const body = await readBody(request);
    if (!text(body.title)) throw new HttpError(400, 'Başlık gerekli');
    const r = await db
      .prepare(
        `UPDATE projects SET title = ?, summary = ?, description = ?, image_url = ?, tech = ?,
           live_url = ?, github_url = ?, featured = ?, date = ? WHERE id = ? RETURNING *`,
      )
      .bind(...projectFields(body), projectId)
      .first();
    if (!r) throw new HttpError(404, 'Proje bulunamadı');
    return json(projectRow(r));
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM projects WHERE id = ?').bind(projectId).run();
    return json({ ok: true });
  }

  throw new HttpError(405, 'Desteklenmeyen işlem');
}

async function adminRoute(db, env, request, method, [type, ...rest], url) {
  const user = await requireAdmin(request, env);

  if (type === 'me') return json(user);
  if (type === 'tmdb' && rest[0] === 'search') {
    const q = text(url.searchParams.get('q'), 200);
    if (!q) throw new HttpError(400, 'Arama metni gerekli');
    return json(await searchMovies(env, q, toInt(url.searchParams.get('year'))));
  }
  if (type === 'igdb' && rest[0] === 'search') {
    const q = text(url.searchParams.get('q'), 200);
    if (!q) throw new HttpError(400, 'Arama metni gerekli');
    return json(await searchGames(env, q));
  }
  if (type === 'films') return adminFilms(db, env, request, method, rest);
  if (type === 'games') return adminGames(db, env, request, method, rest);
  if (type === 'projects') return adminProjects(db, request, method, rest);

  throw new HttpError(404, 'Bulunamadı');
}

export async function onRequest({ request, env, params }) {
  const url = new URL(request.url);
  const segments = [].concat(params.path || []).filter(Boolean);
  try {
    if (!env.DB) throw new HttpError(500, 'D1 bağlantısı (DB) tanımlı değil');
    if (segments[0] === 'admin') {
      return await adminRoute(env.DB, env, request, request.method, segments.slice(1), url);
    }
    return await publicRoute(env.DB, request.method, segments);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    return json({ error: err.message || 'Sunucu hatası' }, { status });
  }
}

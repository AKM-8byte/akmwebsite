import { HttpError } from './http.js';

const BASE = 'https://api.themoviedb.org/3';

// TMDB iki tür anahtar verir: uzun "Read Access Token" (Bearer) ya da kısa v3 api_key.
async function tmdb(env, path, params = {}) {
  const token = env.TMDB_TOKEN;
  if (!token) throw new HttpError(500, 'TMDB_TOKEN tanımlı değil');
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const headers = { accept: 'application/json' };
  if (token.length > 40) headers.authorization = `Bearer ${token}`;
  else url.searchParams.set('api_key', token);

  const res = await fetch(url, { headers });
  if (!res.ok) throw new HttpError(502, `TMDB hatası (${res.status})`);
  return res.json();
}

export async function searchMovies(env, query, year) {
  const params = { query, language: 'tr-TR', include_adult: 'false' };
  if (year) params.year = year;
  const data = await tmdb(env, '/search/movie', params);
  return (data.results || []).slice(0, 12).map((m) => ({
    tmdb_id: m.id,
    title_tr: m.title,
    title_original: m.original_title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    poster_path: m.poster_path,
    overview_tr: m.overview,
  }));
}

function pickTrailer(videos) {
  const list = (videos?.results || []).filter((v) => v.site === 'YouTube');
  const score = (v) =>
    (v.type === 'Trailer' ? 4 : v.type === 'Teaser' ? 2 : 0) +
    (v.iso_639_1 === 'tr' ? 2 : 0) +
    (v.official ? 1 : 0);
  return list.sort((a, b) => score(b) - score(a))[0]?.key || null;
}

// Kayıt anında bir kez çağrılır; sonuç D1'e yazılır, sayfalar TMDB'ye hiç gitmez.
export async function getMovie(env, id) {
  const m = await tmdb(env, `/movie/${id}`, {
    language: 'tr-TR',
    append_to_response: 'credits,videos',
    include_video_language: 'tr,en,null',
  });

  // Türkçe özet yoksa İngilizcesini al.
  let overview = m.overview;
  if (!overview) {
    const en = await tmdb(env, `/movie/${id}`, { language: 'en-US' });
    overview = en.overview;
  }

  return {
    tmdb_id: m.id,
    title_tr: m.title,
    title_original: m.original_title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    genres: (m.genres || []).map((g) => g.name),
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    overview_tr: overview || null,
    details: {
      tagline: m.tagline || null,
      runtime: m.runtime || null,
      release_date: m.release_date || null,
      vote_average: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
      countries: (m.production_countries || []).map((c) => c.iso_3166_1),
      directors: (m.credits?.crew || []).filter((c) => c.job === 'Director').map((c) => c.name),
      cast: (m.credits?.cast || []).slice(0, 10).map((c) => ({
        name: c.name,
        character: c.character,
        profile_path: c.profile_path,
      })),
      trailer: pickTrailer(m.videos),
    },
  };
}

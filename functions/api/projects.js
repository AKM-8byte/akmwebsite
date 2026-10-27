// GET /api/projects — proje listesini her istekte Drive tablosundan canlı okur.
import { PROJECTS_CSV, projectSheetRows, buildProject } from '../_lib/projects.js';

export async function onRequestGet({ request, env }) {
  try {
    const res = await fetch(PROJECTS_CSV, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('text/csv')) throw new Error(`tablo ${res.status}`);
    const projects = projectSheetRows(await res.text()).map(buildProject);
    return new Response(JSON.stringify(projects), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('Proje tablosu okunamadı:', err.message);
    return env.ASSETS.fetch(new URL('/data/projects.json', request.url));
  }
}

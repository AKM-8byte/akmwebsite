// Drive proje tablosu → site proje kaydı. Hem Cloudflare Function'ı hem scripts/sync.mjs kullanır.
import { norm, parseCsv, rowsToObjects, yes } from './films.js';

export const PROJECTS_SHEET_ID = '19URKnDDGlmMXB3Le4qUBXQG0MvUJK11nOIH3fZgfk_A';
export const PROJECTS_CSV = `https://docs.google.com/spreadsheets/d/${PROJECTS_SHEET_ID}/export?format=csv`;

export function projectSheetRows(csvText) {
  return rowsToObjects(parseCsv(csvText), {
    title: ['başlık', 'baslik', 'ad', 'title'],
    slug: ['slug'],
    summary_tr: ['özet tr', 'ozet tr'],
    summary_en: ['özet en', 'ozet en'],
    description_tr: ['açıklama tr', 'aciklama tr'],
    description_en: ['açıklama en', 'aciklama en'],
    image_url: ['görsel url', 'gorsel url', 'görsel'],
    tech: ['teknolojiler', 'tech'],
    live_url: ['canlı url', 'canli url', 'canlı'],
    github_url: ['github url', 'github'],
    featured: ['öne çıkan', 'one cikan', 'featured'],
    date: ['tarih', 'date'],
  }).filter((r) => r.title);
}

const slugify = (s) => norm(s) || 'proje';

export function buildProject(r, i) {
  return {
    id: i + 1,
    slug: r.slug || slugify(r.title),
    title: r.title,
    summary_tr: r.summary_tr || r.summary_en || '',
    summary_en: r.summary_en || r.summary_tr || '',
    description_tr: r.description_tr || r.summary_tr || '',
    description_en: r.description_en || r.summary_en || '',
    image_url: r.image_url || null,
    tech: r.tech ? r.tech.split(/[;,]/).map((x) => x.trim()).filter(Boolean) : [],
    live_url: r.live_url || null,
    github_url: r.github_url || null,
    featured: yes(r.featured),
    date: /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null,
  };
}

export { parseCsv };

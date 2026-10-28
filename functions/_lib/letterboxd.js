// Letterboxd dışa aktarımı (data/letterboxd/*.csv) → site film satırları.
// Satırlar Drive tablosundakiyle aynı şekilde (sheetRows çıktısı) üretilir; böylece buildFilm değişmez.
// Eski tablodaki Türkçe ad, afiş ve yorumlar Letterboxd URL'si (yoksa ad+yıl) ile eşleşip korunur.

import { parseCsv, norm, toNum } from './films.js';

const objects = (text) => {
  const rows = parseCsv(text || '');
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
};

const nameKey = (r) => `${norm(r.Name)}|${toNum(r.Year) ?? ''}`;
const slug = (url) => (String(url).match(/boxd\.it\/(\w+)/) || [])[1] || null;

// files: { ratings, watched, reviews, likes } CSV metinleri (olmayanlar boş olabilir)
// old: eski tablo satırları (sheetRows çıktısı)
export function letterboxdRows(files, old = []) {
  const oldByUrl = new Map(old.filter((o) => o.letterboxd).map((o) => [slug(o.letterboxd), o]));
  const oldByName = new Map(old.map((o) => [`${norm(o.title_original || o.title_tr)}|${toNum(o.year) ?? ''}`, o]));

  const ratings = new Map(objects(files.ratings).map((r) => [nameKey(r), r]));
  const reviews = new Map(objects(files.reviews).map((r) => [nameKey(r), r]));
  const liked = new Set(objects(files.likes).map(nameKey));

  // izlenenler (puansız olanlar dahil); en yeni izlenen sonda gelir, eski sıra korunur
  const watched = objects(files.watched);
  const rows = watched.map((w) => {
    const key = nameKey(w);
    const o = oldByUrl.get(slug(w['Letterboxd URI'])) || oldByName.get(key) || {};
    const rate = ratings.get(key);
    const rev = reviews.get(key);
    return {
      title_tr: o.title_tr || '',
      title_original: w.Name,
      year: w.Year,
      rating: rate?.Rating || '',
      poster: o.poster || '',
      review: rev?.Review || o.review || '',
      liked: liked.has(key) ? 'EVET' : 'HAYIR',
      letterboxd: w['Letterboxd URI'] || o.letterboxd || '',
      _date: w.Date,
      _old: o.title_original !== undefined || o.title_tr !== undefined ? 1 : 0,
    };
  });

  // Eski tablodaki filmler eski sırasıyla önde; yeniler tarihe göre en sona
  const oldOrder = new Map(old.map((o, i) => [`${norm(o.title_original || o.title_tr)}|${toNum(o.year) ?? ''}`, i]));
  const pos = (r) => oldOrder.get(`${norm(r.title_original)}|${toNum(r.year) ?? ''}`);
  const known = rows.filter((r) => pos(r) !== undefined).sort((a, b) => pos(a) - pos(b));
  const fresh = rows.filter((r) => pos(r) === undefined).sort((a, b) => a._date.localeCompare(b._date));
  return [...known, ...fresh].map(({ _date, _old, ...r }) => r);
}

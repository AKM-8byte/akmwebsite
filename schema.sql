-- AKM — Cloudflare D1 şeması
-- Uygula:  npx wrangler d1 execute akm-db --remote --file=schema.sql

-- Drive tablosundaki her film için TMDB'den çekilen detaylar (anahtar: orijinal ad|yıl).
CREATE TABLE IF NOT EXISTS film_tmdb (
  key        TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AKM veritabanı şeması (Cloudflare D1 / SQLite)
-- Uygula:  npx wrangler d1 execute akm-db --remote --file=schema.sql
-- JSON kolonları (genres, platforms, details) TEXT olarak saklanır.

CREATE TABLE IF NOT EXISTS films (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id        INTEGER UNIQUE,
  title_tr       TEXT NOT NULL,
  title_original TEXT,
  year           INTEGER,
  genres         TEXT NOT NULL DEFAULT '[]',
  poster_path    TEXT,
  backdrop_path  TEXT,
  overview_tr    TEXT,
  rating         REAL,                 -- 1–10 (benim puanım)
  review         TEXT,                 -- benim notum
  favorite       INTEGER NOT NULL DEFAULT 0,
  watched_at     TEXT,                 -- YYYY-MM-DD
  details        TEXT NOT NULL DEFAULT '{}', -- runtime, directors, cast, trailer, vote_average, tagline
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS games (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  igdb_id     INTEGER UNIQUE,
  title       TEXT NOT NULL,
  year        INTEGER,
  genres      TEXT NOT NULL DEFAULT '[]',
  cover_url   TEXT,
  status      TEXT NOT NULL DEFAULT 'bitirdim', -- bitirdim | oynuyorum | biraktim | oynayacagim
  platforms   TEXT NOT NULL DEFAULT '[]',       -- benim oynadığım platformlar
  rating      REAL,
  review      TEXT,
  favorite    INTEGER NOT NULL DEFAULT 0,
  started_at  TEXT,
  finished_at TEXT,
  details     TEXT NOT NULL DEFAULT '{}', -- backdrop, screenshots, critic_score, developers, all_platforms, trailer, description
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  summary     TEXT,
  description TEXT,
  image_url   TEXT,
  tech        TEXT,                 -- virgülle ayrılmış: "HTML, CSS, Cloudflare"
  live_url    TEXT,
  github_url  TEXT,
  featured    INTEGER NOT NULL DEFAULT 0,
  date        TEXT,                 -- YYYY-MM-DD
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_films_watched ON films (watched_at);
CREATE INDEX IF NOT EXISTS idx_games_status  ON games (status);

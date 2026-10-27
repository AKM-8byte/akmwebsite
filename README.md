# AKM — Kişisel Arşiv

Filmlerim, oyunlarım ve projelerim tek bir sitede: **https://akmwebsite.pages.dev**
Site tamamen statik (Cloudflare Pages). Türkçe ve İngilizce dil seçeneği var.

## Veriler nereden geliyor?

Hepsi Google Drive'daki **AKM Web Sitesi Veritabanı** klasöründeki tablolardan. Tabloya satır ekle → **en geç ~1–2 dakika içinde sitede görünür, yayınlamaya gerek yok.**

| Bölüm | Tablo | Ek bilgi |
|---|---|---|
| Filmler | *AKM Movies - Film Veritabanı* | TMDB (afiş, özet, oyuncular, fragman) → D1 `film_tmdb` |
| Oyunlar | *AKM Games - Oyun Veritabanı* | IGDB (kapak, tür, geliştirici, fragman) → D1 `game_igdb` |
| Projeler | *AKM Projects - Proje Veritabanı* | yok |

- Yeni bir film/oyun ilk kez göründüğünde ek bilgisi otomatik çekilip D1'de saklanır.
- Tablo okunamazsa site son yayınlanan kopyaya (`public/data/*.json`) düşer.
- Üç tablo da **"Bağlantıya sahip herkes → Görüntüleyen"** olarak paylaşılmış kalmalı.
- Tablo kimlikleri: `functions/_lib/films.js`, `games.js`, `projects.js`.

### Oyun tablosu sütunları
`Ad, Durum, Puan, Platform, Başladım, Bitirdim, Favori, Not`
- Durum: `bitirdim` · `oynuyorum` · `bıraktım` · `sırada`
- Puan: 5 üzerinden (4.5 gibi) · Tarih: `2026-10-27` · Favori: `evet`
- Birden fazla platform: `PC; PlayStation 5`

### Proje tablosu sütunları
`Başlık, Slug, Özet TR, Özet EN, Açıklama TR, Açıklama EN, Görsel URL, Teknolojiler, Canlı URL, GitHub URL, Öne Çıkan, Tarih`
- Teknolojiler: `HTML; CSS; JavaScript` · Öne Çıkan: `evet` · Slug boşsa başlıktan üretilir.

### Yedek kopyaları güncellemek / kodu yayınlamak
`npm run yayinla` (tabloları indirir, yedek kopyaları yeniler, siteyi yükler). Sadece içerik eklemek için gerekmez.

## Kurulum (bir kez)

- **Node.js LTS** kurulu olmalı.
- Drive tabloları **"Bağlantıya sahip herkes → Görüntüleyen"** olarak paylaşılmalı.
- `.dev.vars` dosyasına (repoya girmez) anahtarları yaz:
  ```
  TMDB_TOKEN=...            themoviedb.org → Ayarlar → API → API Read Access Token
  IGDB_CLIENT_ID=...        dev.twitch.tv/console → uygulama → Client ID
  IGDB_CLIENT_SECRET=...    aynı uygulama → New Secret
  ```
- Cloudflare girişi: `npx wrangler login`

## Yerelde bakmak

```bash
npm run sync
python scripts/dev_preview.py
```
→ http://localhost:8788

Kişisel bilgiler (isim, hakkımda, linkler): `public/assets/js/site.js`
Arayüz metinleri (TR/EN): `public/assets/js/i18n.js`

# AKM — Kişisel Arşiv

Filmlerim, oyunlarım ve projelerim tek bir sitede: **https://akmwebsite.pages.dev**
Site tamamen statik (Cloudflare Pages). Türkçe ve İngilizce dil seçeneği var.

## Veriler nereden geliyor?

| Bölüm | Kaynak | Güncelleme |
|---|---|---|
| Filmler | Google Drive → *AKM Movies - Film Veritabanı* tablosu | **Otomatik.** Site tabloyu `/api/films` ile canlı okur |
| Oyunlar | `data/oyunlar.csv` | `npm run yayinla` |
| Projeler | `data/projeler.json` | `npm run yayinla` |

### Filmler nasıl otomatik güncelleniyor?
- Tabloya film ekle / puanı değiştir → **en geç ~1–2 dakika içinde sitede görünür.** Yayınlamaya gerek yok.
- Yeni bir film ilk kez göründüğünde `functions/api/films.js` onu TMDB'de bulur; TR/EN özet, türler, oyuncular,
  yönetmen, süre, fragman ve arka planı çeker ve Cloudflare D1'de (`film_tmdb` tablosu) saklar.
- Tablo okunamazsa site son yayınlanan kopyaya (`public/data/films.json`) düşer.
- Tablo **"Bağlantıya sahip herkes → Görüntüleyen"** olarak paylaşılmış kalmalı.

## Oyun / proje ekleme

1. Oyunu `data/oyunlar.csv`'ye, projeyi `data/projeler.json`'a ekle.
2. Yayınla:
   ```bash
   npm run yayinla
   ```

### oyunlar.csv sütunları
`ad, durum, puan, platform, başladım, bitirdim, favori, not`
- durum: `bitirdim` · `oynuyorum` · `bıraktım` · `sırada`
- puan: 5 üzerinden (4.5 gibi)
- tarihler: `2026-10-27` biçiminde
- birden fazla platform: `PC; PlayStation 5`

## Kurulum (bir kez)

- **Node.js LTS** kurulu olmalı.
- Drive tablosu **"Bağlantıya sahip herkes → Görüntüleyen"** olarak paylaşılmalı (sync tabloyu böyle indirir).
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

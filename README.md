# AKM — Kişisel Arşiv

Filmlerim, oyunlarım ve projelerim tek bir sitede: **https://akmwebsite.pages.dev**
Site tamamen statik (Cloudflare Pages). Türkçe ve İngilizce dil seçeneği var.

## Veriler nereden geliyor?

| Bölüm | Kaynak | Otomatik eklenen |
|---|---|---|
| Filmler | Google Drive → *AKM Movies - Film Veritabanı* tablosu | TMDB: TR/EN özet, türler, oyuncular, yönetmen, süre, fragman, arka plan |
| Oyunlar | `data/oyunlar.csv` | IGDB: kapak, ekran görüntüleri, eleştirmen puanı, fragman |
| Projeler | `data/projeler.json` | — |

`npm run sync` tabloyu indirir, TMDB/IGDB'den detayları çeker ve `public/data/*.json` dosyalarını yazar.
Çekilen detaylar `data/cache.json`'da saklanır; sonraki senkronlarda sadece yeni filmler için TMDB'ye gidilir.

## Yeni film / oyun ekleme

1. Filmi Drive'daki tabloya ekle (ya da oyunu `data/oyunlar.csv`'ye).
2. Yayınla:
   ```bash
   npm run yayinla
   ```
   (= `npm run sync` + Cloudflare'a yükleme)

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

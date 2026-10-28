# AKM — Kişisel Arşiv

Filmlerim, oyunlarım ve projelerim tek bir sitede. Site tamamen statik ve **GitHub Pages**'te yayınlanır.
Türkçe ve İngilizce dil seçeneği var. Cloudflare kullanılmıyor.

## Nasıl çalışıyor?

GitHub Actions ([.github/workflows/pages.yml](.github/workflows/pages.yml)) her `push`'ta, **15 dakikada bir** ve elle çalıştırıldığında:
1. Filmleri Letterboxd verisinden, oyun ve projeleri Drive tablolarından okur,
2. Yeni film/oyunların detaylarını TMDB / IGDB'den çeker (afiş, Türkçe ad, özet, oyuncular, fragman),
3. `public/` klasörünü yayınlar.

Elle bir şey yayınlamana gerek yok; veriyi güncellemen yeter.

## Filmler (Letterboxd)

Letterboxd resmi API vermediği için veri, Letterboxd'den indirilen zip ile güncellenir.

1. Letterboxd → **Settings → Import & Export → Export Your Data** ile zip'i indir.
2. GitHub'da repoyu aç → `data/letterboxd` klasörü → **Add file → Upload files** → zip'i sürükle → **Commit changes**.
3. Actions kendiliğinden zip'i açar, filmleri ekler; birkaç dakikada sitede görünür.

Zip'in adı tarih içerir (`letterboxd-ahmetkyr-2026-10-28-...zip`). Birden fazla zip varsa **en yenisi** kullanılır; eskileri silebilirsin.
Bilgisayardan yapmak istersen: `npm run letterboxd -- "<zip yolu>" --push`

Yeni film için Türkçe ad, afiş vb. TMDB'den otomatik gelir. Düzeltmek istersen `data/filmler.csv`'ye (GitHub'da düzenleyebilirsin) o filmin satırını yaz:
```
türkçe ad,orijinal ad,yıl,puan,afiş url,yorum,beğenildi,letterboxd url
```
Satır, orijinal ad + yıl (ya da letterboxd url) ile filme eşlenir. Türkçe ad ve afiş url doluysa TMDB'ninkinin önüne geçer; puan, yorum ve beğeni Letterboxd'den gelir.

## Oyunlar ve projeler (Google Drive tabloları)

Tabloya satır ekle → en geç ~15 dakikada sitede. Tablolar **"Bağlantıya sahip herkes → Görüntüleyen"** olarak paylaşılmış kalmalı.
Tablo kimlikleri: `scripts/lib/games.js`, `scripts/lib/projects.js`.

| Bölüm | Ek bilgi |
|---|---|
| Oyunlar | IGDB (kapak, tür, geliştirici, fragman) |
| Projeler | yok |

### Oyun tablosu sütunları
`Ad, Durum, Puan, Platform, Başladım, Bitirdim, Favori, Not`
- Durum: `bitirdim` · `oynuyorum` · `bıraktım` · `sırada`
- Puan: 5 üzerinden (4.5 gibi) · Tarih: `2026-10-27` · Favori: `evet`
- Birden fazla platform: `PC; PlayStation 5`

### Proje tablosu sütunları
`Başlık, Slug, Özet TR, Özet EN, Açıklama TR, Açıklama EN, Görsel URL, Teknolojiler, Canlı URL, GitHub URL, Öne Çıkan, Tarih`
- Teknolojiler: `HTML; CSS; JavaScript` · Öne Çıkan: `evet` · Slug boşsa başlıktan üretilir.

## Kurulum (bir kez)

GitHub reposunda:
- **Settings → Pages → Source: GitHub Actions**
- **Settings → Secrets and variables → Actions** altında şu secret'lar tanımlı olmalı (yoksa detaylar eksik kalır):
  - `TMDB_TOKEN` — themoviedb.org → Ayarlar → API → API Read Access Token
  - `IGDB_CLIENT_ID` ve `IGDB_CLIENT_SECRET` — dev.twitch.tv/console → uygulama

## Yerelde bakmak

Node.js LTS gerekir. Anahtarları `.dev.vars` dosyasına yaz (repoya girmez; örnek: `.dev.vars.example`).

```bash
npm run sync
python scripts/dev_preview.py
```
→ http://localhost:8788

Kişisel bilgiler (isim, hakkımda, linkler): `public/assets/js/site.js`
Arayüz metinleri (TR/EN): `public/assets/js/i18n.js`

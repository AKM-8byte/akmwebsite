# AKM — Kişisel Arşiv

Filmlerim, oyunlarım ve projelerim tek bir sitede. Site tamamen statik ve **GitHub Pages**'te yayınlanır.
Türkçe ve İngilizce dil seçeneği var. Cloudflare kullanılmıyor.

## Nasıl çalışıyor?

GitHub Actions ([.github/workflows/pages.yml](.github/workflows/pages.yml)) her `push`'ta, **15 dakikada bir** ve elle çalıştırıldığında:
1. Filmleri, oyunları ve projeleri Drive tablolarından okur,
2. Yeni film/oyunların detaylarını TMDB / IGDB'den çeker (afiş, Türkçe ad, özet, oyuncular, fragman),
3. `public/` klasörünü yayınlar.

Elle bir şey yayınlamana gerek yok; veriyi güncellemen yeter.

## Filmler (Google Drive tablosu)

Tabloya satır ekle → en geç ~15 dakikada sitede. Tablo **"Bağlantıya sahip herkes → Görüntüleyen"** olarak paylaşılmış kalmalı.
Tablo kimliği: `scripts/lib/films.js`.

Sütunlar:
```
türkçe ad,orijinal ad,yıl,puan,afiş url,yorum,beğenildi,letterboxd url
```
Yeni film için sadece orijinal ad + yıl yazman yeter; Türkçe ad, afiş, özet, oyuncular, fragman TMDB'den otomatik gelir. Türkçe ad ve afiş url doluysa TMDB'ninkinin önüne geçer. Puan 5 üzerinden (4.5 gibi), beğenildi: `EVET` / `HAYIR`.

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

## Lisans ve üçüncü taraf içerikler

Bu projede tarafımdan yazılan özgün kaynak kod, [GNU GPL v3.0-only](LICENSE) koşullarıyla lisanslanmıştır. Tam lisans metni: https://www.gnu.org/licenses/gpl-3.0.txt

Bu lisans **üçüncü taraf içeriklere uygulanmaz**. TMDB/IGDB verileri, film afişleri, oyun görselleri, fragmanlar, harici yazı tipleri ve diğer üçüncü taraf materyaller ilgili hak sahiplerinin koşullarına tabidir. Bu materyallerin GPL kapsamında yeniden kullanılabileceği varsayılmamalıdır.

TMDB ve IGDB hizmetlerini kullanırken ilgili sağlayıcıların güncel kullanım, atıf ve marka kurallarına uyulmalıdır. GPLv3 ticari kullanımı yasaklamaz.

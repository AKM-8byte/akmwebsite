# AKM — Kişisel Arşiv

Filmlerim, oyunlarım ve projelerim tek bir sitede. Cloudflare Pages + D1 üzerinde çalışır; film bilgileri **TMDB**'den (Türkçe ad, afiş, oyuncular, fragman), oyun bilgileri **RAWG**'den otomatik gelir. Her `git push` siteyi otomatik yayınlar.

```
public/            Statik site (derleme yok)
  index.html       Ana sayfa
  filmler/         Film arşivi
  oyunlar/         Oyun arşivi
  projeler/        Projeler
  admin/           Yönetim paneli (Cloudflare Access ile korunur)
  assets/css, js   Ortak tasarım ve kod
functions/api/     API (Pages Functions): okuma + admin yazma uçları
schema.sql         D1 veritabanı şeması
scripts/           Yerel önizleme sunucusu ve örnek veri
```

## İlk kurulum (bir kez)

1. **Node.js LTS** kur (nodejs.org) — sadece `wrangler` komutu için.
2. **API anahtarları**
   - TMDB: themoviedb.org → hesap → Ayarlar → API → *API Read Access Token*
   - RAWG: rawg.io/apidocs → ücretsiz anahtar
3. **GitHub**: `akmwebsite` adında boş repo aç, bu klasörü push'la.
4. **D1 veritabanı**
   ```bash
   npx wrangler login
   npx wrangler d1 create akm-db
   ```
   Çıkan `database_id`'yi `wrangler.toml` içine yaz, sonra:
   ```bash
   npx wrangler d1 execute akm-db --remote --file=schema.sql
   ```
5. **Cloudflare Pages**: Workers & Pages → Create → Pages → *Connect to Git* → `akmwebsite`
   - Framework: None · Build command: boş · Output: `public`
   - Settings → Bindings: D1 → `DB` = `akm-db` (wrangler.toml'dan da okunur)
   - Settings → Variables and Secrets: `TMDB_TOKEN`, `RAWG_KEY` (Secret olarak)
6. **Admin koruması (Cloudflare Access)**: Zero Trust → Access → Applications → Self-hosted
   - Domain: `akmwebsite.pages.dev`, path `admin` ve ikinci kural olarak `api/admin`
   - Policy: Allow → sadece kendi e-postan
   - Uygulamanın *AUD tag* değerini `ACCESS_AUD`, takım alan adını (ör. `akm.cloudflareaccess.com`) `ACCESS_TEAM_DOMAIN` olarak Pages'e ekle.
7. Eski filmler: Google Sheets tablosunu kopyala → `/admin` → **Toplu içe aktar** sekmesine yapıştır.

## Günlük kullanım

- `/admin` → film/oyun adını ara → seç → puan + not → **Arşive ekle**. Gerisini site halleder.
- Kod değişikliği: düzenle → `git push` → Cloudflare 1 dakikada yayınlar.
- Kişisel bilgiler (isim, hakkımda, linkler): `public/assets/js/site.js`

## Yerelde çalıştırma

Gerçek API ile (önerilen):
```bash
cp .dev.vars.example .dev.vars   # anahtarlarını yaz
npx wrangler d1 execute akm-db --local --file=schema.sql
npx wrangler pages dev
```
Sadece tasarıma bakmak için (Node gerekmez, örnek veriyle):
```bash
python scripts/dev_preview.py
```

## Domain

Alan adı alınca: Pages projesi → Custom domains → ekle. Access uygulamasına da yeni alan adını ekle.

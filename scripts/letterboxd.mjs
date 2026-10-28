// Letterboxd dışa aktarımını (zip) siteye aktarır.
//   Kullanım:  npm run letterboxd -- "C:\Users\...\letterboxd-ahmetkyr-....zip"
//              npm run letterboxd -- "...zip" --push   (ayrıca commit + push: Actions siteyi yayınlar)
// Letterboxd → Settings → Import & Export → Export Your Data ile indirilen zip'ten ratings, watched,
// reviews ve likes dosyalarını data/letterboxd/ altına açar. Gerisini (TMDB, yayın) sync.mjs yapar.

import { mkdirSync, mkdtempSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const zip = process.argv.slice(2).find((a) => !a.startsWith('--'));
const PUSH = process.argv.includes('--push');
if (!zip || !existsSync(zip)) {
  console.error('Kullanım: npm run letterboxd -- "<zip yolu>" [--push]');
  process.exit(1);
}

const tmp = mkdtempSync(path.join(tmpdir(), 'lb-'));
// Windows'ta tar (bsdtar) zip açar; Linux/macOS'ta unzip.
if (process.platform === 'win32') execFileSync(path.join(process.env.SystemRoot || 'C:/Windows', 'System32', 'tar.exe'), ['-xf', path.resolve(zip), '-C', tmp], { stdio: 'inherit' });
else execFileSync('unzip', ['-q', '-o', zip, '-d', tmp], { stdio: 'inherit' });

const dest = path.join(ROOT, 'data', 'letterboxd');
mkdirSync(path.join(dest, 'likes'), { recursive: true });
for (const f of ['ratings.csv', 'watched.csv', 'reviews.csv', 'likes/films.csv']) {
  const from = path.join(tmp, f);
  if (existsSync(from)) { copyFileSync(from, path.join(dest, f)); console.log(`✓ ${f}`); }
  else console.warn(`! zip'te ${f} yok`);
}
rmSync(tmp, { recursive: true, force: true });

if (PUSH) {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'inherit' });
  git('add', 'data/letterboxd');
  git('commit', '-m', `Letterboxd verisi güncellendi (${new Date().toISOString().slice(0, 10)})`);
  git('push');
  console.log('✓ Push edildi; GitHub Actions siteyi yayınlayacak.');
} else {
  console.log('Şimdi: node scripts/sync.mjs (önizleme) ve git push (yayın).');
}

import { href } from './util.js';
// Okuma katmanı: önce tarayıcıdaki kopyayı anında göster, arkadan tazesini çek.
const PREFIX = 'akm:v2:';
const FRESH_MS = 60 * 1000;

function readCache(type) {
  try {
    const raw = localStorage.getItem(PREFIX + type);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(type, data) {
  try {
    localStorage.setItem(PREFIX + type, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* depolama dolu ya da kapalı — sorun değil */
  }
}

// Film, oyun ve projeler Drive tablosundan canlı gelir (/api/*); API'ye ulaşılamazsa son yayınlanan kopya.
// GitHub Pages sunucu kodu çalıştıramaz: orada sadece GitHub Actions'ın ürettiği JSON okunur.
const HAS_API = !location.hostname.endsWith('github.io');
const SOURCES = Object.fromEntries(
  ['films', 'games', 'projects'].map((t) => [t, [HAS_API && `/api/${t}`, `/data/${t}.json`].filter(Boolean).map(href)]),
);

async function fetchList(type) {
  let data;
  for (const url of SOURCES[type] || [href(`/data/${type}.json`)]) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) throw new Error(`${url} → ${res.status}`);
      data = await res.json();
      break;
    } catch (err) {
      console.warn(err.message);
    }
  }
  if (!data) throw new Error(`${type} yüklenemedi`);
  writeCache(type, data);
  return data;
}

/**
 * Listeyi döndürür. Önbellekte kopya varsa hemen onu verir ve
 * arkadan tazeler; veri değiştiyse onUpdate(yeniVeri) çağrılır.
 */
export async function getList(type, { onUpdate } = {}) {
  const cached = readCache(type);
  if (cached) {
    if (Date.now() - cached.at > FRESH_MS) {
      fetchList(type)
        .then((fresh) => {
          if (onUpdate && JSON.stringify(fresh) !== JSON.stringify(cached.data)) onUpdate(fresh);
        })
        .catch(() => {});
    }
    return cached.data;
  }
  return fetchList(type);
}

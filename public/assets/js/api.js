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

async function fetchList(type) {
  const res = await fetch(`/data/${type}.json`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`/data/${type}.json → ${res.status}`);
  const data = await res.json();
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

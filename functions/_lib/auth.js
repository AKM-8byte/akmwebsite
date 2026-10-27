import { HttpError } from './http.js';

// Admin istekleri Cloudflare Access arkasındadır. Access, her isteğe imzalı bir JWT
// ekler (Cf-Access-Jwt-Assertion). Burada imzayı, süreyi ve AUD etiketini doğruluyoruz;
// böylece Access kuralı yanlışlıkla kaldırılsa bile yazma uçları açık kalmaz.

let certCache = { domain: null, keys: null, fetchedAt: 0 };

function b64urlToBytes(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const bin = atob((str + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getKeys(domain) {
  const fresh = Date.now() - certCache.fetchedAt < 60 * 60 * 1000;
  if (certCache.domain === domain && certCache.keys && fresh) return certCache.keys;
  const res = await fetch(`https://${domain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new HttpError(500, 'Access sertifikaları alınamadı');
  const { keys } = await res.json();
  certCache = { domain, keys, fetchedAt: Date.now() };
  return keys;
}

export async function requireAdmin(request, env) {
  if (env.DEV_ADMIN === '1') return { email: 'yerel@gelistirme' };

  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    throw new HttpError(401, 'Yetkisiz: Cloudflare Access girişi gerekli');
  }

  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new HttpError(401, 'Geçersiz oturum');
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));

  const jwk = (await getKeys(env.ACCESS_TEAM_DOMAIN)).find((k) => k.kid === header.kid);
  if (!jwk) throw new HttpError(401, 'Oturum anahtarı bulunamadı');

  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`),
  );
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  const now = Math.floor(Date.now() / 1000);
  if (!valid || !aud.includes(env.ACCESS_AUD) || payload.exp < now) {
    throw new HttpError(401, 'Oturum doğrulanamadı');
  }
  return { email: payload.email };
}

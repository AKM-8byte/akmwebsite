import { t, locale } from './i18n.js';

// Sitenin kök adresi: hem akmwebsite.pages.dev/ hem kullanici.github.io/akmwebsite/ altında çalışsın diye.
export const ROOT = new URL('../../', import.meta.url);
export const href = (path) => {
  const u = new URL(path.replace(/^\//, ''), ROOT);
  return u.pathname + u.search + u.hash;
};

export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const tmdbImg = (path, size = 'w500') => (path ? `https://image.tmdb.org/t/p/${size}${path}` : '');

// IGDB görsel boyutunu değiştirir: cover_small, cover_big, cover_big_2x, screenshot_big, 720p, 1080p…
export const igdbImg = (url, size = 'cover_big') => (url ? url.replace(/\/t_[a-z0-9_]+\//, `/t_${size}/`) : '');

export const icons = {
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>',
  starHalf: '<svg viewBox="0 0 24 24"><defs><linearGradient id="h"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="currentColor" stop-opacity=".22"/></linearGradient></defs><path fill="url(#h)" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>',
  starEmpty: '<svg viewBox="0 0 24 24" fill="currentColor" opacity=".22"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2 0 3.5 1.1 4.4 2.6.9-1.5 2.4-2.6 4.4-2.6 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowUpRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 5l7 7-7 7"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 015 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0012 2z"/></svg>',
};

// 10 üzerinden puanı 5 yıldıza çevirir (yarım yıldız destekli).
export function stars(rating10) {
  if (rating10 == null) return '';
  const r = Math.round(rating10) / 2;
  let out = '';
  for (let i = 1; i <= 5; i++) out += r >= i ? icons.star : r >= i - 0.5 ? icons.starHalf : icons.starEmpty;
  return `<span class="stars" aria-label="${t('stars', { n: r })}">${out}</span>`;
}

export const fmtScore = (rating10) => (rating10 == null ? '—' : Number.isInteger(rating10) ? `${rating10}` : rating10.toFixed(1));

const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
export const fmtDate = (iso) => (iso ? dateFmt.format(new Date(`${iso.slice(0, 10)}T12:00:00`)) : '');
export const fmtMonth = (iso) => (iso ? monthFmt.format(new Date(`${iso.slice(0, 10)}T12:00:00`)) : '');

export function fmtRuntime(min) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} ${t('time.h')} ${m ? `${m} ${t('time.m')}` : ''}`.trim() : `${m} ${t('time.m')}`;
}

export const daysBetween = (a, b) =>
  Math.max(0, Math.round((new Date(b || Date.now()) - new Date(a)) / 86400000));

export const pad = (n, len = 3) => String(n).padStart(len, '0');

// Afişin ortalama "canlı" rengini çıkarır; detay sahnesi bu tona bürünür.
const toneCache = new Map();
export function extractTone(url) {
  if (!url) return Promise.resolve(null);
  if (toneCache.has(url)) return toneCache.get(url);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 24;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 24, 24);
        const data = ctx.getImageData(0, 0, 24, 24).data;
        let best = null;
        let bestScore = -1;
        let sum = [0, 0, 0];
        for (let i = 0; i < data.length; i += 4) {
          const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
          sum = [sum[0] + r, sum[1] + g, sum[2] + b];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max ? (max - min) / max : 0;
          const score = sat * (max / 255) * (max > 40 && max < 245 ? 1 : 0.2);
          if (score > bestScore) { bestScore = score; best = [r, g, b]; }
        }
        const n = data.length / 4;
        const avg = sum.map((v) => v / n);
        // Canlı renk ile ortalamayı karıştır → ne çok bağırır ne de çamurlaşır.
        resolve(bestScore > 0.15 ? best.map((v, i) => Math.round(v * 0.7 + avg[i] * 0.3)) : avg.map(Math.round));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
  toneCache.set(url, p);
  return p;
}

export function revealOnScroll(root = document) {
  const els = root.querySelectorAll('.reveal:not(.is-in)');
  if (!('IntersectionObserver' in window)) return els.forEach((el) => el.classList.add('is-in'));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

// Görsel yüklenemezse altındaki tipografik afiş görünür kalsın.
export function imgFallbacks(root = document) {
  root.querySelectorAll('img[data-fallback]:not([data-bound])').forEach((img) => {
    img.dataset.bound = '1';
    const fail = () => img.classList.add('is-broken');
    if (img.complete && img.naturalWidth === 0 && img.src) fail();
    img.addEventListener('error', fail, { once: true });
    img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    if (img.complete && img.naturalWidth > 0) img.classList.add('is-loaded');
  });
}

export function hueFromString(s) {
  let h = 0;
  for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

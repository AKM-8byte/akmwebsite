export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, { status = 200, cache = false } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache
        ? 'public, max-age=30, stale-while-revalidate=600'
        : 'no-store',
    },
  });
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Geçersiz JSON gövdesi');
  }
}

export function toInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export function toRating(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(10, Math.max(0, Math.round(n * 2) / 2));
}

export function toDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function toBool(value) {
  return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
}

export function text(value, max = 5000) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

/**
 * Middleware de segurança HTTP (Express local + espelho dos headers estáticos).
 */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

const BLOCKED_PREFIXES = [
  '/.env',
  '/.git',
  '/node_modules/',
  '/server/',
  '/scripts/',
  '/data/',
  '/package.json',
  '/package-lock.json',
];

export function applySecurityHeaders(_req, res, next) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  next();
}

export function blockSensitivePaths(req, res, next) {
  const path = (req.path || '').toLowerCase();
  if (path.includes('..') || BLOCKED_PREFIXES.some((p) => path.startsWith(p))) {
    return res.status(404).end();
  }
  next();
}

/** Limite simples no checkout — anti-abuso (por IP). */
const checkoutWindowMs = 60_000;
const checkoutMaxHits = 15;
const checkoutHits = new Map();

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function checkoutRateLimit(req, res, next) {
  const ip = clientIp(req);
  const now = Date.now();
  let bucket = checkoutHits.get(ip);
  if (!bucket || now - bucket.start > checkoutWindowMs) {
    bucket = { start: now, count: 0 };
  }
  bucket.count += 1;
  checkoutHits.set(ip, bucket);

  if (bucket.count > checkoutMaxHits) {
    return res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Try again shortly.' });
  }
  next();
}

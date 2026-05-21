/**
 * Middleware de segurança HTTP (Express local + espelho dos headers estáticos).
 */

/** Keep in sync with _headers / index.html <meta http-equiv="Content-Security-Policy"> */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' mailto:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'sha256-hBcVcGnZ45V0r+hKRdvaDAEcfOUliJqhYLHandfCazY=' https://cdn.jsdelivr.net https://unpkg.com https://js.stripe.com",
  "connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://ipapi.co https://ipwho.is https://api.stripe.com",
  'frame-src https://js.stripe.com https://hooks.stripe.com',
  "manifest-src 'self'",
  "worker-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

const HSTS_VALUE = 'max-age=63072000; includeSubDomains; preload';

function isHttpsRequest(req) {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  return typeof proto === 'string' && proto.split(',')[0].trim() === 'https';
}

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

export function applySecurityHeaders(req, res, next) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  if (isHttpsRequest(req)) {
    res.setHeader('Strict-Transport-Security', HSTS_VALUE);
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

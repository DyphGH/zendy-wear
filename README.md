# Zendy Wear® — Submersive Streetwear

Static front-end (vanilla HTML/CSS/JS) with a small **Node + Express** backend for **Stripe Embedded Checkout**. No React, no Tailwind. CDNs are loaded only where needed (Google Fonts; Three.js / GSAP / Lenis on capable devices).

**Drop 001 — Fall 2026.** 3 designs, hand-screen-printed on heavyweight black cotton in Portugal. 150 units each. No restocks.

- Melting Heads
- Sun & Moon Meltdown
- Neon Skull Melt

**Languages:** Portuguese (default) and English — `assets/js/i18n.js`, toggled in the nav.

This README covers **Phases 1–3** (foundation, security, a11y, SEO, cart, modals, i18n, WebGL, smooth scroll, **Stripe checkout on-site**). **Phase 4+** covers image pipeline at scale, newsletter API, deploy hardening, polish, QA.

---

## Quick start (local dev)

You need **Node 18+**. Do not open `index.html` as a file — ES modules and the checkout API require HTTP.

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
```

Edit `.env` (see [Stripe](#stripe-checkout) below), then:

```bash
npm run dev
# → http://localhost:3000  (or whatever PORT you set)
```

| Script | What it does |
|--------|----------------|
| `npm run dev` | Express server + file watch (`server/index.js`) |
| `npm start` / `npm run serve` | Same server, no watch |
| `npm run optimize` | AVIF/WebP/JPEG variants, favicons, OG JPG (`sharp`) |

`python3 -m http.server` **does not work** for checkout — there is no `/api/*` without the Node server.

---

## Stripe checkout

Checkout stays **on zendywear.com** (Stripe Embedded Checkout in a modal). After payment, a thank-you modal appears and the cart is cleared.

### Environment (`.env`)

Never commit `.env`. Copy from `.env.example`:

```env
STRIPE_SECRET_KEY=sk_test_...      # server only — Dashboard → API keys → Secret
STRIPE_PUBLISHABLE_KEY=pk_test_... # browser — Publishable key (required)
PORT=8000                          # optional; default 3000
CLIENT_URL=http://localhost:8000   # must match how you open the site
```

- **Test:** `sk_test_…` + `pk_test_…` — card `4242 4242 4242 4242`, any future expiry, any CVC.
- **Live:** `sk_live_…` + `pk_live_…` and `CLIENT_URL=https://zendywear.com` (or your domain).

### How it works

1. Browser: `assets/js/cart.js` → `assets/js/checkout.js` calls `POST /api/create-checkout-session` with cart line items (`id`, `size`, `qty` only).
2. Server: `server/catalog.js` validates IDs/sizes/prices (never trust the browser).
3. Server: `server/index.js` creates a Stripe Checkout Session (`ui_mode: 'embedded'`) and returns `clientSecret`.
4. Browser: Stripe.js mounts the form in `#modal-checkout`; `onComplete` opens `#modal-thank-you` and clears `localStorage` (`zendy_cart_v1`).

If Stripe is missing or misconfigured, checkout falls back to a **mailto** order email to `zendywear@gmail.com`.

### CSP (already configured)

Stripe is allowed in `_headers`, `vercel.json`, `.htaccess`, and the CSP `<meta>` in `index.html`:

- `script-src` … `https://js.stripe.com`
- `frame-src` `https://js.stripe.com` `https://hooks.stripe.com`
- `connect-src` … `https://api.stripe.com`

### API routes

| Route | Purpose |
|-------|---------|
| `GET /api/health` | `{ ok, stripe }` — quick sanity check |
| `GET /api/stripe-config` | `{ publishableKey }` for Stripe.js |
| `GET /api/pricing` | Promo state + prices shown on site |
| `POST /api/create-checkout-session` | Body: `{ items, lang }` → `{ clientSecret, pricing }` |
| `POST /api/webhooks/stripe` | Stripe webhook — counts units sold (promo limit) |

---

## Launch promo pricing

Default: show **€45** crossed out, charge **€29.99** until **50 units** sold (total across all tees). Then price becomes **€45** with no strikethrough.

Configure in `.env`:

```env
PROMO_UNIT_LIMIT=50
PROMO_COMPARE_EUR=45
PROMO_PRICE_EUR=29.99
REGULAR_PRICE_EUR=45
STRIPE_WEBHOOK_SECRET=whsec_...
```

Counter file: `data/promo-units-sold.json` (auto-created; gitignored). Copy `data/promo-units-sold.example.json` if you need a template.

**Stripe webhook (required for auto cut-off at 50):**

1. Dashboard → Developers → Webhooks → Add endpoint  
2. URL: `https://your-domain.com/api/webhooks/stripe`  
3. Event: `checkout.session.completed`  
4. Paste signing secret into `STRIPE_WEBHOOK_SECRET`

Without webhook, the site still charges the promo price from env, but the counter won’t advance — you’d need to raise `unitsSold` manually in `data/promo-units-sold.json` or wait and flip env when sold out.

Check status: `GET /api/pricing` → `{ promoActive, unitsSold, unitsRemaining, priceEur, compareAtEur }`.

---

## Cart — user flow

Click **Cart (n)** in the nav → drawer from the right. State: `localStorage` key `zendy_cart_v1`.

1. Pick a size (S–XXL). Until then, the button shows “Select size” / “Escolher tamanho” and is disabled.
2. **Add to cart** → toast, count updates.
3. Open cart → **+ / −**, remove line, total.
4. **Checkout** / **Finalizar** → payment modal (Stripe) or mailto fallback.
5. After success → thank-you modal; cart empty.

Help links in the drawer open modals: size guide, shipping & returns.

---

## Image optimisation

Before production, generate AVIF/WebP/resized JPEGs and favicons:

```bash
npm install
npm run optimize
```

This writes variants next to sources in `assets/img/products/`, updates `assets/img/products/manifest.json` (used by `assets/js/responsive-images.js`), favicon PNGs, and `assets/img/og/og-default.jpg`.

If you previously had 6 designs and still have **Hand_Back / Eye_Back / Snake_Back** variants in `products/`:

```bash
npm run clean:images              # delete orphans + refresh manifest.json
npm run clean:images -- --dry-run # preview only
npm run clean:images -- --move-archive  # move master JPEGs to _archive/ first, then delete variants
```

Cut-print masters live in `assets/img/_archive/` (see README there).

---

## Deploy

The site is **not** static-only anymore: you must run `node server/index.js` (or equivalent) so `/api/*` and Stripe work.

### Options

| Host | Notes |
|------|--------|
| **Railway / Render / Fly.io / VPS** | Straightforward: `npm start`, set env vars, point domain. |
| **Netlify** | Static publish + **Netlify Functions** or external API — adapt `server/` or use a small proxy. `_headers` at repo root still applies to static assets. |
| **Vercel** | `vercel.json` headers exist; add a **serverless** wrapper for Express routes or deploy Node as Vercel serverless functions. |

Pick **one** of `_headers` (Netlify), `vercel.json`, or `.htaccess` (Apache) for CSP/security headers on static files; delete the others if you want a clean repo.

### Production checklist

1. `npm run optimize` — commit generated images.
2. `.env` on the host: `STRIPE_*`, `CLIENT_URL=https://your-domain`, `PORT` if required.
3. [securityheaders.com](https://securityheaders.com) → target **A** or higher.
4. [SSL Labs](https://www.ssllabs.com/ssltest/) → **A+**.
5. [opengraph.xyz](https://www.opengraph.xyz/) — OG preview.
6. Google Search Console → `https://zendywear.com/sitemap.xml`.
7. Stripe Dashboard → live mode, test a real €0.50 flow if needed before drop day.

Optional later: **Stripe webhook** (`checkout.session.completed`) for order notifications — not implemented yet.

---

## File tree

```
zendy-wear/
├── index.html                 ← single page, inlined critical CSS, modals, cart drawer
├── manifest.webmanifest
├── robots.txt
├── sitemap.xml
├── .env.example               ← copy to .env (gitignored)
├── _headers / vercel.json / .htaccess
├── server/
│   ├── index.js               ← Express: API + static site
│   ├── catalog.js             ← product prices/IDs (source of truth for checkout)
│   └── middleware.js          ← security headers, rate limit, path blocking
├── assets/
│   ├── css/
│   │   ├── critical.css
│   │   ├── main.css
│   │   ├── tokens.css
│   │   └── components/        ← nav, hero, shop, cart, modals, security
│   ├── js/
│   │   ├── main.js            ← entry
│   │   ├── i18n.js            ← PT / EN
│   │   ├── cart.js            ← drawer, state, render
│   │   ├── checkout.js        ← Stripe Embedded Checkout
│   │   ├── modals.js          ← size, shipping, contact, checkout, thank-you
│   │   ├── size-selector.js
│   │   ├── newsletter.js
│   │   ├── phone-country.js
│   │   ├── viewer.js, scroll.js, shader.js, hero-blob.js, …
│   │   └── utils.js
│   ├── shaders/
│   ├── fonts/
│   └── img/
│       ├── products/
│       ├── icons/
│       ├── og/
│       └── _archive/
└── scripts/
    ├── optimize-images.mjs
    ├── generate-sri.mjs
    ├── check-i18n.mjs         ← optional: key parity PT/EN vs HTML
    ├── clean-orphan-images.mjs ← remove Hand/Eye/Snake variants from products/
    └── …
```

---

## 3D layer (Phase 3)

| | high-tier | fallback |
|---|-----------|----------|
| Trigger | `hardwareConcurrency ≥ 4`, viewport ≥ 768px, WebGL2, motion OK | otherwise |
| Background | Three.js GLSL shader | CSS gradient |
| Hero | 3D blob + bloom (if cores ≥ 6) | CSS orbs + parallax |
| Scroll | Lenis + GSAP ScrollTrigger | native + IntersectionObserver |

```js
window.__zendyCapability
```

CDN versions are pinned in `index.html` import map (Three, Lenis, GSAP).

### SRI for CDN modules

```bash
node scripts/generate-sri.mjs
```

Paste output into `<link rel="modulepreload">` in `index.html` when you bump CDN versions.

---

## i18n

- Strings: `assets/js/i18n.js` (`pt` / `en`).
- Markup: `data-i18n`, `data-i18n-html`, `data-i18n-aria`, `data-i18n-placeholder`.
- Cart line items re-render on language change; product **names** stay in English (drop titles).

Check keys:

```bash
node scripts/check-i18n.mjs
```

---

## Known TODOs / next steps

| Item | Status |
|------|--------|
| Stripe Embedded Checkout | **Done** (test + live keys in `.env`) |
| Launch promo €45 → €29.99 (50 units) | **Done** — webhook recommended |
| Run `npm run optimize` + commit images | **Before go-live** |
| Deploy Node backend + env on host | **Required for payments** |
| Newsletter real API | Phase 4 — `TODO[Phase 4]` in `assets/js/newsletter.js` |
| Stripe webhook for order emails | Optional |
| SRI on CDN modulepreload | `scripts/generate-sri.mjs` |
| Service worker / PWA offline | Phase 4 — commented in `main.js` |
| Konami, page transitions, tilt card | Phase 4 polish (optional) |
| Product image `alt` / names per language | Optional a11y |

---

## Performance & accessibility targets

| Metric | Target | Notes |
|--------|--------|--------|
| Lighthouse Performance | ≥ 90 | Run `optimize` first |
| Lighthouse Accessibility | ≥ 95 | Tabs, drawer, modals, skip link, reduced motion |
| Lighthouse Best Practices | ≥ 95 | CSP, HTTPS, no secret keys in front-end |
| Lighthouse SEO | 100 | meta, canonical, OG, JSON-LD, sitemap |
| LCP | ≤ 2.5 s | Hero text-first; products lazy-loaded |
| CLS | ≤ 0.1 | Explicit image dimensions |
| INP | ≤ 200 ms | rAF-throttled handlers |

---

## License & assets

© 2026 Zendy Wear. Product graphics © Zendy Wear. **Bebas Neue** and **DM Mono** via Google Fonts (their respective licenses).

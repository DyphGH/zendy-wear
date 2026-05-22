/**

 * Zendy Wear — API + static site.

 * Stripe Checkout: preços validados em server/catalog.js + server/pricing.js.

 */

import 'dotenv/config';

import express from 'express';

import Stripe from 'stripe';

import { fileURLToPath } from 'node:url';

import { dirname, join } from 'node:path';

import { buildLineItems } from './catalog.js';

import { getPricingSnapshot, addUnitsSold } from './pricing.js';

import {

  applySecurityHeaders,

  blockSensitivePaths,

  checkoutRateLimit,

} from './middleware.js';

import { ensureOgImage, loadIndexTemplate, sendIndexHtml } from './serve-html.js';



const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const PORT = Number(process.env.PORT) || 3000;

const CLIENT_URL = (process.env.CLIENT_URL || `http://localhost:${PORT}`).replace(/\/$/, '');



const stripeSecret = process.env.STRIPE_SECRET_KEY;

const stripePublishable = process.env.STRIPE_PUBLISHABLE_KEY || '';

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;



const app = express();

app.set('trust proxy', 1);

app.use(applySecurityHeaders);

app.use(blockSensitivePaths);



app.post(

  '/api/webhooks/stripe',

  express.raw({ type: 'application/json' }),

  async (req, res) => {

    if (!stripe || !stripeWebhookSecret) {

      return res.status(503).send('Webhook not configured');

    }

    const sig = req.headers['stripe-signature'];

    if (!sig) return res.status(400).send('Missing stripe-signature');



    let event;

    try {

      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);

    } catch (err) {

      console.error('[webhook] signature', err.message);

      return res.status(400).send(`Webhook Error: ${err.message}`);

    }



    if (event.type === 'checkout.session.completed') {

      try {

        const session = event.data.object;

        const full = await stripe.checkout.sessions.retrieve(session.id, {

          expand: ['line_items'],

        });

        let units = 0;

        for (const line of full.line_items?.data || []) {

          units += line.quantity || 0;

        }

        if (units > 0) {

          const total = await addUnitsSold(units);

          console.log(`[webhook] promo units sold: +${units} → ${total}`);

        }

      } catch (err) {

        console.error('[webhook] session', err);

        return res.status(500).send('Webhook handler failed');

      }

    }



    return res.json({ received: true });

  },

);



app.use(express.json({ limit: '32kb' }));



app.get('/api/health', async (_req, res) => {

  const pricing = await getPricingSnapshot();

  res.json({ ok: true, stripe: Boolean(stripe), pricing });

});



app.get('/api/pricing', async (_req, res) => {

  res.json(await getPricingSnapshot());

});



app.get('/api/stripe-config', (_req, res) => {

  res.json({

    publishableKey: stripe && stripePublishable ? stripePublishable : null,

  });

});



app.post('/api/create-checkout-session', checkoutRateLimit, async (req, res) => {

  if (!stripe) {

    return res.status(503).json({

      error: 'stripe_not_configured',

      message: 'Add STRIPE_SECRET_KEY to .env on the server.',

    });

  }



  try {

    const items = req.body?.items;

    if (!Array.isArray(items) || items.length === 0) {

      return res.status(400).json({ error: 'empty_cart' });

    }



    const pricing = await getPricingSnapshot();

    const line_items = await buildLineItems(items);

    const lang = req.body?.lang === 'en' ? 'en' : 'pt';



    const session = await stripe.checkout.sessions.create({

      mode: 'payment',

      ui_mode: 'embedded',

      line_items,

      return_url: `${CLIENT_URL}/?checkout=return&lang=${lang}&session_id={CHECKOUT_SESSION_ID}`,

      shipping_address_collection: { allowed_countries: ['PT', 'GB', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'US', 'CA', 'AU'] },

      billing_address_collection: 'required',

      locale: lang === 'en' ? 'en' : 'pt',

      metadata: {

        source: 'zendy-wear-web',

        promo_active: pricing.promoActive ? '1' : '0',

      },

    });



    return res.json({ clientSecret: session.client_secret, pricing });

  } catch (err) {

    console.error('[checkout]', err);

    return res.status(400).json({

      error: 'checkout_failed',

      message: err.message || 'Checkout failed',

    });

  }

});



app.get(['/', '/index.html'], (req, res) => sendIndexHtml(req, res, CLIENT_URL));

app.use(express.static(ROOT, { extensions: ['html'], index: false }));



await ensureOgImage();

await loadIndexTemplate();

app.listen(PORT, () => {

  console.log(`Zendy Wear → ${CLIENT_URL}`);

  if (!stripe) console.warn('⚠ STRIPE_SECRET_KEY missing — checkout API disabled');

  else if (!stripePublishable) console.warn('⚠ STRIPE_PUBLISHABLE_KEY missing — embedded checkout disabled');

  if (!stripeWebhookSecret) {

    console.warn('⚠ STRIPE_WEBHOOK_SECRET missing — promo unit counter will not auto-update');

  }

});



# Stripe — Zendy Wear

## Como funciona

1. O browser envia só `id`, `size` e `qty` para `POST /api/create-checkout-session`.
2. O servidor lê o preço em `server/catalog.js` (€65 por peça) — **ignora** qualquer preço no frontend.
3. O Stripe Checkout cobra o valor correcto e recolhe morada.

A chave **publicável** (`pk_live_…`) não vai no HTML por defeito: o fluxo é redirect para `checkout.stripe.com`.

A chave **secreta** (`sk_live_…`) fica só em `.env` no servidor.

## Arranque local

```bash
cp .env.example .env
# Edita .env com STRIPE_SECRET_KEY=sk_live_...
npm install
npm run dev
```

Abre http://localhost:3000 — o carrinho usa a API no mesmo domínio.

## Produção

Corre `npm start` (ou deploy Node) com `CLIENT_URL=https://zendywear.com` e `STRIPE_SECRET_KEY` nas variáveis de ambiente do hosting.

Se só publicares ficheiros estáticos (sem Node), o checkout cai para email até configurares o backend.

## Segurança

- Nunca commits `sk_live_` nem `pk_live_` no Git.
- Se expuseste a chave secreta, revoga-a no Stripe Dashboard e cria uma nova.

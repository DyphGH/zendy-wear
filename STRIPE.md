# Stripe — Zendy Wear

## Como funciona a promo

- O preço **não** vem do frontend nem de cupões no Dashboard.
- O servidor (`server/pricing.js`) cobra **€29,99** enquanto `unitsSold < 50` (total de unidades, todas as camisolas).
- Depois das 50 unidades, passa a **€45**.
- O site mostra ~~€45~~ **€29,99** via `GET /api/pricing`.
- O Stripe recebe o valor correcto em cada Checkout Session (`price_data` dinâmico em `server/catalog.js`).

**Não precisas** de criar Products, Prices nem Coupons no Stripe Dashboard para esta promo.

## 1. Variáveis no Render (ou `.env` local)

| Variável | Exemplo |
|----------|---------|
| `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` ou `pk_live_...` |
| `CLIENT_URL` | `https://zendy-wear.onrender.com` |
| `PROMO_UNIT_LIMIT` | `50` |
| `PROMO_PRICE_EUR` | `29.99` |
| `PROMO_COMPARE_EUR` | `45` |
| `REGULAR_PRICE_EUR` | `45` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (passo 2) |

Render → teu serviço → **Environment** → adiciona/edita → **Save Changes** → redeploy se pedido.

## 2. Webhook no Stripe Dashboard

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL:**  
   `https://zendy-wear.onrender.com/api/webhooks/stripe`
3. **Events:** escolhe só **`checkout.session.completed`**.
4. Cria o endpoint e abre **Signing secret** → copia `whsec_...`.
5. Cola em `STRIPE_WEBHOOK_SECRET` no Render e faz redeploy.

**Test vs Live:** em modo Teste usa chaves `sk_test_` / `pk_test_` e um webhook criado com o interruptor *Test mode* ligado. Em Live, repete com chaves `sk_live_` / `pk_live_` e outro webhook (outro `whsec_`).

## 3. Verificar

1. Abre `https://zendy-wear.onrender.com/api/pricing` — deve devolver JSON com `promoActive: true`, `priceEur: 29.99`, `unitsRemaining: 50` (se ainda não houve vendas).
2. Compra de teste: cartão `4242 4242 4242 4242`, qualquer data/CVC futuros.
3. Stripe → **Webhooks** → o teu endpoint → **Recent deliveries** — evento `checkout.session.completed` com **200**.
4. Volta a `GET /api/pricing` — `unitsSold` deve subir (quantidade comprada).

## 4. Atenção (Render gratuito)

O contador vive em `data/promo-units-sold.json` no disco do servidor. No plano gratuito do Render esse ficheiro **pode perder-se** ao redeploy ou quando a instância “adormece”. O webhook continua a funcionar entre sessões activas; se o contador voltar a 0 após deploy, confirma no Stripe **Payments** quantas vendas já houve e ajusta manualmente se necessário (ou pede persistência — disco pago / base de dados).

## Arranque local

```bash
cp .env.example .env
# Preenche STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
npm install
npm run dev
```

Para webhook local: `stripe listen --forward-to localhost:8000/api/webhooks/stripe` (CLI Stripe) e usa o `whsec_` que a CLI imprime.

## Segurança

- Nunca commits `.env` nem `data/`.
- Chave secreta só no servidor; publicável no `GET /api/stripe-config`.
- Se expuseres `sk_live_`, revoga no Dashboard e cria nova.

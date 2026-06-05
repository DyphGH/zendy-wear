# Deploy no Render (free tier)

No plano **gratuito**, o serviço Web **adormece** após ~15 minutos sem pedidos. O primeiro visitante depois disso espera o *cold start* (muitas vezes 30–90 s) até o Node arrancar.

## O que já está no repo

1. **Arranque rápido** — o servidor aceita tráfego antes de gerar o OG JPEG / carregar o template HTML.
2. **Keep-alive** — workflow GitHub Actions (`.github/workflows/keep-alive.yml`) faz ping a `/api/health` de **10 em 10 minutos**.

### Ativar o keep-alive (recomendado, grátis)

1. GitHub → repositório → **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. Criar variável **`SITE_URL`** = URL pública do Render, ex.: `https://zendy-wear.onrender.com` (sem `/` no fim)
3. **Actions** → workflow **Keep Render awake** → **Run workflow** (teste manual)
4. Confirmar que o job devolve HTTP 200

Com isto, o site fica **acordado** na maior parte do tempo. Ainda pode haver espera **logo após um deploy** (até o primeiro ping ou visita).

## Variáveis de ambiente no Render

| Variável | Exemplo |
|----------|---------|
| `CLIENT_URL` | `https://zendy-wear.onrender.com` |
| `STRIPE_SECRET_KEY` | `sk_live_…` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |

Webhook Stripe: `https://zendy-wear.onrender.com/api/webhooks/stripe`

## Se quiseres zero espera (sempre)

| Opção | Custo | Notas |
|-------|-------|-------|
| **Render Starter** (~7 USD/mês) | Pago | Instância sempre ligada, sem spin-down |
| **UptimeRobot** (alternativa ao GitHub) | Grátis | Monitor HTTP a cada 5 min no mesmo `/api/health` |
| **Static + API** (avançado) | Grátis static | Site estático no CDN; só checkout/API no Render — primeiro ecrã instantâneo, cold start só no pagamento |

No free tier, **não há forma de eliminar 100%** o cold start sem keep-alive ou plano pago. O keep-alive resolve o caso típico (“primeira pessoa do dia”).

## Checklist pós-deploy

- [ ] `CLIENT_URL` = URL final do Render
- [ ] `SITE_URL` no GitHub = mesma URL
- [ ] `https://…/api/health` → `{"ok":true,...}`
- [ ] Workflow keep-alive a correr (última execução < 15 min)

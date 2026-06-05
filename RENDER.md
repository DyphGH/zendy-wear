# Deploy no Render (free tier)

No plano **gratuito**, o serviço Web **adormece** após ~15 minutos sem pedidos. O primeiro visitante depois disso espera o *cold start* (30–90 s).

## ⚠️ Keep-alive: o que realmente funciona

O workflow GitHub Actions **sozinho não chega**. O cron do GitHub atrasa muitas vezes (10–30+ min) e o Render adormece na mesma.

**Solução recomendada (grátis, 2 minutos): UptimeRobot**

1. https://uptimerobot.com → conta grátis
2. **Add New Monitor**
3. Monitor Type: **HTTP(s)**
4. URL: `https://zendy-wear.onrender.com/api/health`
5. Monitoring Interval: **5 minutes**
6. Guardar

Isto mantém o site acordado de forma **fiável**. O GitHub Actions fica só como **backup**.

## GitHub Actions (backup)

Workflow: `.github/workflows/keep-alive.yml` — ping de 5 em 5 min (duplo cron).

Variável opcional no GitHub: **`SITE_URL`** = `https://zendy-wear.onrender.com`

Confirma em **Actions** que aparecem runs automáticos com evento `schedule` (não só `workflow_dispatch`). Se só vires runs manuais, o UptimeRobot é obrigatório.

## Horas free no Render

| Situação | Horas/mês |
|----------|-----------|
| Site adormece sem visitas | Poucas |
| Keep-alive 24/7 (1 serviço) | ~720–744 h (limite: **750 h**) |

Pings não têm quota à parte — conta o tempo com o Node **ligado**.

## Variáveis de ambiente no Render

| Variável | Exemplo |
|----------|---------|
| `CLIENT_URL` | `https://zendy-wear.onrender.com` |
| `STRIPE_SECRET_KEY` | `sk_live_…` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |

Webhook Stripe: `https://zendy-wear.onrender.com/api/webhooks/stripe`

## Zero espera (sempre)

| Opção | Custo |
|-------|-------|
| **UptimeRobot** a cada 5 min | Grátis |
| **Render Starter** | ~7 USD/mês — sem spin-down |
| Site estático + API separada | Grátis — página instantânea; cold start só no checkout |

## Checklist

- [ ] UptimeRobot configurado (5 min) ← **o mais importante**
- [ ] `CLIENT_URL` no Render = URL final
- [ ] `https://…/api/health` → `{"ok":true,...}`
- [ ] GitHub Actions com runs `schedule` (backup)

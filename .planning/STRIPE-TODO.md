# Stripe Integration Plan — pixelforge.pro

## Stripe Sandbox IDs

| | Product ID | Price ID |
|---|---|---|
| **Professional** $19/mo | `prod_U7mLbo5nOjVIWB` | `price_1T9Wn6BMsqkU17SIfijYs2Yj` |
| **Business** $35/mo | `prod_U7mOYeWWsYgNR5` | `price_1T9WpVBMsqkU17SIPvSyajUQ` |

**API Keys (sandbox):** stored in backend/.env (not committed)

**Plan mapping:** DB `FREE_TRIAL`→Free, DB `STANDARD`→Professional, DB `PRO`→Business

## Stripe Live IDs

| | Product ID | Price ID |
|---|---|---|
| **Professional** $19/mo | (copied from sandbox) | `price_1T9rsBPmWq9yM8WevNQchtPa` |
| **Business** $35/mo | (copied from sandbox) | `price_1T9rsCPmWq9yM8We4lqSjieZ` |

**Live Account:** `acct_1T9WjhPmWq9yM8We`
**Webhook endpoint:** `we_1T9rvIPmWq9yM8WeOMyE74AR`
**Customer Portal config:** `bpc_1T9sAGPmWq9yM8WeXvPSIk3q`

---

## TODO Checklist

### Fazė 1: Pasiruošimas
- [x] `composer require stripe/stripe-php` (per SSH Hostinger)
- [x] Pridėti į backend `.env` Stripe kintamuosius (see .env.example)
- [x] Atnaujinti `backend/.env.example` su Stripe kintamaisiais
- [x] Atnaujinti `backend/config.php` — pridėti `stripe` sekciją
- [x] Paleisti SQL migraciją (`backend/migrations/002_stripe.sql`):
  - `ALTER TABLE User ADD stripeSubscriptionId VARCHAR(191) NULL`
  - `CREATE TABLE Payment` (mokėjimų istorija)
- [x] Atnaujinti `database_schema.sql` su naujais stulpeliais/lentele

### Fazė 2: Backend — nauji failai
- [x] Sukurti `backend/helpers/stripe.php` — Stripe klientas + helpers
- [x] Sukurti `backend/payments/checkout.php` — POST `/payments/checkout`
- [x] Sukurti `backend/payments/portal.php` — POST `/payments/portal`
- [x] Sukurti `backend/payments/webhook.php` — POST `/payments/webhook`
- [x] Sukurti `backend/payments/history.php` — GET `/payments/history`

### Fazė 3: Backend — modifikuoti esamus failus
- [x] `backend/index.php` — pridėti 4 route'us + CSRF exempt webhook
- [x] `backend/auth/me.php` — pridėti `subscriptionEndsAt` prie SELECT

### Fazė 4: Frontend
- [x] Pridėti i18n raktų į `en.json`, `lt.json`, `ru.json` (payments namespace)
- [x] `AuthContext.jsx` — pridėti `refreshUser()` funkciją
- [x] `PaymentsPage.jsx` — perkurti su checkout, portal, history, toast, loading states

### Fazė 5: Stripe Dashboard konfigūracija
- [x] Webhook endpoint sukurtas (sandbox)
- [x] Webhook signing secret nukopijuotas
- [x] Customer Portal sukonfigūruotas (cancel, switch plans, proration)

### Fazė 6: Testavimas (sandbox)
- [x] Test kortelė: `4242 4242 4242 4242`
- [x] Free → Professional checkout
- [x] Upgrade Professional → Business (per Portal)
- [x] Downgrade Business → Professional (per Portal)
- [x] Cancel subscription (per Portal)
- [x] Free → Business checkout (kodas identiškas, testuota netiesiogiai)
- [x] Webhook signature verification (Stripe SDK standartinis mechanizmas)
- [x] Expired trial user (ta pati logika kaip active trial)

### Fazė 7: Live perjungimas
- [x] Stripe Dashboard → sukurti Live produktus (Professional $19/mo, Business $35/mo)
- [x] Nukopijuoti Live API raktus (sk_live_..., pk_live_...)
- [x] Developers → Webhooks → sukurti Live webhook endpoint
- [x] Customer Portal → sukonfigūruoti Live režimui
- [x] Atnaujinti serveryje `.env` su Live reikšmėmis
- [ ] Ištestuoti su tikra kortele (mažiausia suma)

---

## Architektūros srautas

```
User clicks "Get Professional"
  → Frontend: POST /payments/checkout { plan: "STANDARD" }
  → Backend: getOrCreateStripeCustomer() → Stripe Checkout Session
  → Frontend: window.location.href = session.url (redirect to Stripe)
  → User pays on Stripe hosted checkout
  → Stripe redirects to /payments?session_id=xxx
  → Frontend: shows success toast, calls refreshUser()
  → Meanwhile: Stripe sends webhook → Backend updates DB (plan, status)
```

## Edge Cases

- **Upgrade/Downgrade**: Visi per Customer Portal. Stripe tvarko proration.
- **Cancel**: Portal nustato `cancel_at_period_end=true`. Prieiga lieka iki periodo pabaigos.
- **Po downgrade**: Esamos kolekcijos lieka. Naujos ribojamos pagal Free planą. Niekas neištrinamas.
- **Webhook idempotentumas**: Payment lentelėje tikrinti `stripeInvoiceId` prieš insert.
- **Hostinger**: Webhook turi atsakyti per 20s — mūsų query paprasti, OK.

## Saugumo aspektai

- Webhook parašo tikrinimas per `\Stripe\Webhook::constructEvent()`
- CSRF exemption TIK webhook'ui — checkout/portal/history turi CSRF
- Stripe secret key tik serveryje, niekada frontend'e
- Kortelių duomenys niekada nepasiekia mūsų serverio (Stripe Checkout hosted)

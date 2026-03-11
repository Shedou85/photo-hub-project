# Stripe Integration Plan — pixelforge.pro

## Stripe Sandbox IDs

| | Product ID | Price ID |
|---|---|---|
| **Professional** $19/mo | `prod_U7mLbo5nOjVIWB` | `price_1T9Wn6BMsqkU17SIfijYs2Yj` |
| **Business** $35/mo | `prod_U7mOYeWWsYgNR5` | `price_1T9WpVBMsqkU17SIPvSyajUQ` |

**API Keys (sandbox):** stored in backend/.env (not committed)

**Plan mapping:** DB `FREE_TRIAL`→Free, DB `STANDARD`→Professional, DB `PRO`→Business

---

## TODO Checklist

### Fazė 1: Pasiruošimas
- [ ] `composer require stripe/stripe-php` (per SSH Hostinger)
- [ ] Pridėti į backend `.env` Stripe kintamuosius (see .env.example)
- [ ] Atnaujinti `backend/.env.example` su Stripe kintamaisiais
- [ ] Atnaujinti `backend/config.php` — pridėti `stripe` sekciją
- [ ] Paleisti SQL migraciją (`backend/migrations/002_stripe.sql`):
  - `ALTER TABLE User ADD stripeSubscriptionId VARCHAR(191) NULL`
  - `CREATE TABLE Payment` (mokėjimų istorija)
- [ ] Atnaujinti `database_schema.sql` su naujais stulpeliais/lentele

### Fazė 2: Backend — nauji failai
- [ ] Sukurti `backend/helpers/stripe.php` — Stripe klientas + helpers:
  - `getStripeClient()` — grąžina `\Stripe\StripeClient`
  - `getOrCreateStripeCustomer($pdo, $user)` — gauna/sukuria Stripe customer
  - `stripePriceToPlan($priceId)` — konvertuoja price→plan
  - `planToStripePrice($plan)` — konvertuoja plan→price
- [ ] Sukurti `backend/payments/checkout.php` — POST `/payments/checkout`
  - Priima `{ plan: "STANDARD" | "PRO" }`
  - Sukuria Stripe Checkout Session (mode: subscription)
  - Grąžina `{ url: "https://checkout.stripe.com/..." }`
  - Success URL: `https://pixelforge.pro/payments?session_id={CHECKOUT_SESSION_ID}`
  - Cancel URL: `https://pixelforge.pro/payments`
- [ ] Sukurti `backend/payments/portal.php` — POST `/payments/portal`
  - Sukuria Stripe Customer Portal sesiją
  - Grąžina `{ url: "https://billing.stripe.com/..." }`
  - Return URL: `https://pixelforge.pro/payments`
- [ ] Sukurti `backend/payments/webhook.php` — POST `/payments/webhook`
  - **CSRF-exempt, be sesijos!**
  - Tikrina Stripe signature (`\Stripe\Webhook::constructEvent()`)
  - Tvarko events:
    - `checkout.session.completed` → plan=X, subscriptionStatus=ACTIVE, stripeCustomerId, stripeSubscriptionId
    - `customer.subscription.updated` → atnaujina plan/status, jei cancel_at_period_end=true → CANCELED
    - `customer.subscription.deleted` → plan=FREE_TRIAL, subscriptionStatus=INACTIVE
    - `invoice.payment_succeeded` → įrašo į Payment lentelę
    - `invoice.payment_failed` → įrašo į Payment lentelę
- [ ] Sukurti `backend/payments/history.php` — GET `/payments/history`
  - Grąžina vartotojo mokėjimus iš Payment lentelės

### Fazė 3: Backend — modifikuoti esamus failus
- [ ] `backend/index.php` — pridėti 4 route'us:
  - `case '/payments/checkout':` → POST
  - `case '/payments/portal':` → POST
  - `case '/payments/webhook':` → POST
  - `case '/payments/history':` → GET
  - Pridėti `/payments/webhook` prie `$csrfExemptPaths` (eilutė 38)
- [ ] `backend/auth/me.php` — pridėti `subscriptionEndsAt` prie SELECT ir datetime formatavimo

### Fazė 4: Frontend
- [ ] Pridėti ~20 i18n raktų į `en.json`, `lt.json`, `ru.json` (payments namespace)
- [ ] `AuthContext.jsx` — pridėti `refreshUser()` funkciją
- [ ] `PaymentsPage.jsx` — perkurti:
  - Veikiantys mygtukai: "Get Professional", "Get Business" → POST `/payments/checkout`
  - "Manage Subscription" → POST `/payments/portal` (kai jau turi aktyvią prenumeratą)
  - Checkout success: `useEffect` tikrina `?session_id=` URL parametrą, rodo toast
  - CANCELED statusas: rodo "Canceling — Access until [date]"
  - Mokėjimų istorijos lentelė iš `/payments/history`
  - Loading states mygtukuose

### Fazė 5: Stripe Dashboard konfigūracija
- [ ] Developers → Webhooks → Add endpoint:
  - URL: `https://api.pixelforge.pro/backend/payments/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Nukopijuoti webhook signing secret → `.env` STRIPE_WEBHOOK_SECRET
- [ ] Settings → Billing → Customer Portal:
  - Enable: Cancel subscription, Update payment method, View invoices
  - Enable: Switch plans (Professional ↔ Business)
  - Return URL: `https://pixelforge.pro/payments`

### Fazė 6: Testavimas
- [ ] Test kortelė: `4242 4242 4242 4242` (any future exp, any CVC)
- [ ] Free → Professional checkout
- [ ] Free → Business checkout
- [ ] Upgrade Professional → Business (per Portal)
- [ ] Downgrade Business → Professional (per Portal)
- [ ] Cancel subscription (per Portal)
- [ ] Webhook signature verification (bad signature → 400)
- [ ] Expired trial user buys plan

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

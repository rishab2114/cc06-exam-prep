# 10 — Stripe Integration & Payment Flow

## Goal
Customer pays the platform; funds are **held (escrow-like)**; provider is paid out **after completion**, minus a **15% platform fee**. Critically, we must hold funds **without becoming a regulated money-services business** in Singapore. We achieve this with **Stripe Connect** (Stripe is the licensed/regulated party and the money never lands in CampusBuddy's own bank account as stored value).

## Model: Stripe Connect (Express) + Destination charges with manual capture

- **Connected accounts:** each provider onboards a **Connect Express** account (Stripe collects their KYC + bank). Stripe handles identity, AML, payouts.
- **Charge type:** **Destination charge** on the platform account with `transfer_data[destination] = provider_acct` and `application_fee_amount = 15%`. The platform receives the application fee; Stripe routes the rest to the provider.
- **Hold:** create the PaymentIntent with `capture_method: 'manual'` → authorizes the card (hold) without taking funds.

### Worked example (brief's numbers)
Customer pays **SGD 20.00** (`amount = 2000`).
- `application_fee_amount = 300` (15%) → platform earns **SGD 3.00**.
- Provider receives **SGD 17.00** (`1700`), via Stripe payout.

> Stripe processing fees (≈3.4% + S$0.50 for SG cards) are a separate cost. Decision: **platform absorbs processing fees out of its 15%** at MVP for a clean customer-facing number, OR pass them to the customer as a small "service fee". See docs/13; MVP absorbs to keep "you pay 20 / buddy gets 17" honest, accepting thinner net margin early.

## Lifecycle → Stripe calls

| Task state | Stripe action | Notes |
|---|---|---|
| Create task | `paymentIntents.create({ amount, currency:'sgd', capture_method:'manual', transfer_data:{destination}, application_fee_amount, metadata:{taskId} })` — but destination unknown until assigned | At create we authorize on the **platform**; set destination/transfer at assign via separate transfer, OR delay PI creation. **MVP approach:** create PI with manual capture at task creation to secure the hold; perform the **transfer to provider at release** using *separate charges & transfers* model (simpler when provider is unknown at hold time). |
| Customer authorizes | client confirms PI with Elements | `requires_capture` (authorized hold) |
| Assign provider | `paymentIntents.capture(pi)` | Funds captured to platform balance; `payment.status = CAPTURED` |
| Provider completes + customer confirms (or 48h auto) | `transfers.create({ amount: providerAmount, destination: providerAcct, source_transaction? })` | Moves provider's share to their Connect account; platform keeps fee. `RELEASED` |
| Provider payout | automatic via Connect payout schedule (or `payouts.create`) | Stripe → provider bank |
| Cancel before capture | `paymentIntents.cancel(pi)` | No funds moved |
| Refund / dispute | `refunds.create` (+ `transfers.createReversal` if already transferred) | Partial supported |

> **Chosen model: Separate Charges & Transfers** (not destination charges) because the provider is unknown at the moment we place the hold. We charge the customer to the platform (manual capture hold), capture on assignment, then `transfer` the provider's net to their connected account on release. This cleanly supports "broadcast then select".

## Webhooks (source of truth)
Endpoint `POST /webhooks/stripe` (raw body, `stripe.webhooks.constructEvent` signature check). Handle:
- `payment_intent.amount_capturable_updated` / `payment_intent.succeeded` → mark AUTHORIZED/CAPTURED.
- `payment_intent.canceled` → mark FAILED/canceled.
- `charge.refunded` → mark REFUNDED/PARTIALLY_REFUNDED + ledger.
- `transfer.created` / `transfer.reversed` → provider earning/refund ledger.
- `account.updated` → update `provider_profiles.payouts_enabled` from `charges_enabled && payouts_enabled`.
- `payout.paid` / `payout.failed` → payout status.

**Idempotency:** store processed `event.id`; ignore duplicates. Never mutate money state from the request path alone — confirm via webhook + nightly reconciliation job (`reconcile.processor.ts`).

## Connect onboarding flow
1. Provider opts in → `POST /connect/onboarding-link` → `accountLinks.create({ type:'account_onboarding', refresh_url, return_url })`.
2. Provider completes Stripe-hosted KYC.
3. `account.updated` webhook → set `payouts_enabled`.
4. Provider can now be assigned tasks.

## Money math (single source: `common/utils/money.ts`)
```ts
const PLATFORM_FEE_BPS = 1500; // 15.00%
export const platformFee = (amt: number) => Math.round((amt * PLATFORM_FEE_BPS) / 10000);
export const providerNet = (amt: number) => amt - platformFee(amt);
```

## Test plan
- Stripe **test mode** + test cards; Connect test accounts.
- `stripe listen --forward-to localhost:4000/webhooks/stripe` for local webhooks.
- Scenarios: happy path, cancel pre-capture, dispute refund post-transfer (reversal), KYC-incomplete provider blocked from assignment, duplicate webhook.

## Compliance note (see docs/16)
Using Connect means **Stripe is the money-services provider**; CampusBuddy is a platform/marketplace, not an e-money issuer. We never sweep customer funds into our own operating account as stored value. Confirm with Singapore counsel that the Connect marketplace pattern keeps us outside Payment Services Act licensing thresholds for our activity.

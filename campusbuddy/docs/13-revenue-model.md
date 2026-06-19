# 13 — Revenue Model & Unit Economics

## Primary revenue: marketplace take rate
**15% platform fee** on each completed task (per brief).

### Per-transaction (brief example, SGD)
| Item | Amount |
|---|---|
| Customer pays | 20.00 |
| Platform fee (15%) | 3.00 |
| Provider receives | 17.00 |

### The honesty problem: Stripe processing fees
Stripe SG card fee ≈ **3.4% + S$0.50** ⇒ on a S$20 charge ≈ **S$1.18**.
So gross take 3.00 − processing 1.18 = **net S$1.82 per S$20 task** if the platform absorbs fees.

**Two pricing options:**
- **A. Absorb (MVP default):** clean "you pay 20 / buddy gets 17" message. Net margin per task ≈ S$1.82. Good for trust & conversion; thin early.
- **B. Service fee passthrough:** customer pays 20 + small service fee (e.g., S$1–1.50) covering processing; platform keeps the full 15%. Better margin, slightly higher friction. **Recommended once liquidity proven.**

> Low-value tasks (e.g., S$5 parcel pickup) are margin-negative under absorb (fee 0.75 vs processing ~0.67 → net ~0.08, or negative after the fixed S$0.50). **Mitigation:** a **minimum platform fee floor** (e.g., S$1.00) and/or **minimum task value** (e.g., S$5), and batching small tasks. This is a real economic constraint — design for it from day one.

## Secondary / future revenue
- **Service fee passthrough** (option B) — small fee on the customer side.
- **Provider subscription ("Buddy+")** — lower take rate / priority feed / instant payout for a monthly fee.
- **Featured/boosted tasks** — customer pays to surface a task (surge demand).
- **Surge/priority pricing** — peak windows (exam week, move-out) with dynamic floors.
- **B2B2C with NTU/halls** — sponsored cleaning during inspection weeks, partnerships with laundromats/F&B for referral fees.
- **Ads/partnerships** — local merchants (groceries, food) — carefully, without harming UX.

## Unit economics model (illustrative)
Assumptions: avg task value (ATV) **S$15**, blended take **15%**, processing **~S$0.95/task**, option A (absorb) early then B.

| Metric | Value |
|---|---|
| Gross take / task | S$2.25 |
| Processing / task | ~S$0.95 |
| **Net contribution / task (A)** | **~S$1.30** |
| Net contribution / task (B, fee passthrough) | ~S$2.10 |
| Variable ops (support, incidents) / task | ~S$0.30 |
| Contribution margin / task (B) | ~S$1.80 |

### CAC & payback
- Blended CAC target (campus, grassroots): **S$3–6 per active user** (referrals + ambassadors keep this low).
- If an active user completes ~2 tasks/month, contribution ≈ S$3.6/month (option B) → **CAC payback ~1.5–2 months**. Referral-driven users payback faster.

### Path to profitability
- **Contribution-positive per task:** achievable immediately with fee floors + option B.
- **Operating profit:** requires scale to cover fixed costs (eng, insurance, ops salaries). Model below.

## Revenue projection (illustrative, single-campus ramp)
| Stage | Active users | Tasks/user/mo | Tasks/mo | GMV/mo (ATV S$15) | Net rev/mo (B, ~S$2.1) |
|---|---|---|---|---|---|
| Beachhead | 500 | 2 | 1,000 | S$15k | ~S$2.1k |
| Cluster | 2,000 | 2.5 | 5,000 | S$75k | ~S$10.5k |
| Half campus | 5,000 | 3 | 15,000 | S$225k | ~S$31.5k |
| Full NTU | 10,000 | 3 | 30,000 | S$450k | ~S$63k |

> At ~10k active and 30k tasks/mo, net revenue ≈ **S$60k+/month (~S$750k/yr run-rate)** — enough to cover a small team and insurance, and a proof point for multi-university expansion / fundraising. These are planning figures, not promises; frequency (tasks/user/mo) is the key sensitivity.

## Cost structure
- **COGS:** Stripe fees, SMS/email/push, S3, hosting (Vercel/Railway), KYC.
- **Fixed:** eng/ops salaries, insurance (PLI + dispute fund), legal/compliance, ambassador stipends.
- **Variable growth:** demand credits, supply guarantees (taper as liquidity self-sustains).

## Key levers (in priority order)
1. **Frequency** (tasks/user/month) — the biggest driver; recurring demand campaigns.
2. **Fill rate** — unfilled tasks = lost revenue + churn.
3. **Take realization** — fee floor + service fee passthrough.
4. **CAC** — keep grassroots/referral-led.
5. **ATV mix** — encourage higher-value tasks (cleaning, moving) over tiny ones.

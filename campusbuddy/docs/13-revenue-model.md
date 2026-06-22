# 13 — Revenue Model & Unit Economics

> **Status: current (supersedes the original flat-15%/escrow model).** See
> `17-decisions-log.md` for the decision history.

## Strategy in one line
CampusBuddy monetises a **verified-student audience**, not individual transactions.
Commission is kept **deliberately low** as an adoption lever; the durable revenue
is **advertising** to that audience, with subscriptions/partnerships layered on later.

This reframes the North Star from *"maximise take per task"* to
**"maximise verified-student engagement (DAU + frequency)."** Ads pay on attention,
so engagement — not transaction volume alone — is what we optimise.

## Why not a high transaction take
- A campus marketplace where supply and demand are the **same population** caps
  transaction volume.
- A high take + on-the-spot/PayNow behaviour invites **disintermediation** (users
  match once, then pay each other directly). An ad model is robust to this: we earn
  as long as users are **in the app**, regardless of how they settle payment.
- "Cheaper, by students" is core positioning — a fat take rate
  contradicts it.

## Revenue stream 1 — Commission (light, progressive)
Progressive marginal brackets, capped well below the old 15%:

| Portion of task value | Marginal rate |
|---|---|
| up to S$10 | 1% |
| S$10 – S$30 | 3% |
| above S$30 | 5% |

Effective rate ≈ 1% on small tasks → ~4–5% on large ones (e.g. S$20 → S$0.40;
S$100 → S$4.20). Implemented in `frontend/lib/format.ts` and
`backend/src/common/utils/money.ts`. **The fee is hidden from users in the UI**
(customer sees "You pay X"; buddy sees net "You earn Y").

> Honesty note: at 1–5%, commission may not fully cover Stripe processing
> (~3.4% + S$0.50) on its own. That's acceptable **because commission is an
> adoption lever, not the business.** If/when payment is on-platform, add a small
> flat **buyer service fee** (e.g. S$0.30–0.50) purely to cover processing — never
> framed as platform profit.

## Revenue stream 2 — Advertising (the real engine)
The **verified 18–24 student audience** is premium inventory. Buyers:
- **F&B near campus** (the highest-intent local advertiser), cafés, bubble tea.
- **Banks** (student accounts/cards), **telcos** (student SIM plans).
- **Tuition / test-prep, gyms, events, software student-discount programs.**

Ad surfaces (must be clearly labelled "Sponsored" to protect trust):
- **Sponsored card** in the home/feed (built — see `components/Sponsored.tsx`).
- A future **Deals / Offers tab** (drives daily opens — important for ad value).
- **Targeted inventory** off verification data ("verified NTU, Year 2, Engineering")
  — handle under PDPA with consent; verified status is sensitive data.

### Ad revenue math (illustrative, per campus)
A well-engaged student app earns roughly **S$5–20 per active user per year** from
ads at scale.

| Engaged students | @ S$8/user/yr | @ S$15/user/yr |
|---|---|---|
| 2,000 | S$16k/yr | S$30k/yr |
| 10,000 | S$80k/yr | S$150k/yr |
| 30,000 | S$240k/yr | S$450k/yr |

Reality check: ad revenue is **back-loaded and sales-grindy early** (hand-sold
S$200–500 campaigns to local shops). It needs **DAU and session frequency** —
a once-a-week laundry utility won't sustain it, so engagement surfaces (deals,
events, feed) are a priority, not a nice-to-have.

## Revenue stream 3 — Later layers
- **Buddy+ subscription:** priority feed / instant payout / lower take for a monthly fee.
- **Featured/boosted tasks** during surge windows (exam week, move-out).
- **B2B partnerships:** halls/laundromats/F&B referral deals; sponsored inspection-week cleaning.

## Market sizing (TAM)
Singapore tertiary students (all universities, ~250k+ incl. polytechnics & private):
NUS ~38k, NTU ~33k, SUSS ~16k, SMU ~12k, SIT ~10k, SUTD ~1.5k, + ~95k polytechnic
+ large private (SIM/Kaplan). Vision = **all campuses**; the model ports regionally
(Malaysia/India) with the same playbook.

## Go-to-market: vision wide, launch narrow
"Market = all unis" and "launch one campus first" are **not in conflict** — both
**liquidity and ad demand are local** (a laundromat near NTU won't pay to reach
SUTD). So: **win one dense campus → prove engagement + first ad dollars → clone.**
Pick the launch campus for *ad-buyer density + student density*, not sentiment.

## Key levers (priority order)
1. **Engagement / DAU** — the input to ad revenue (deals, events, habitual laundry).
2. **Frequency & retention** — weekly laundry rhythm is the wedge; measure repeat use.
3. **Fill rate** — unfilled tasks = churn on both sides.
4. **Ad sell-through & targeting quality** — premium verified inventory.
5. **CAC** — keep grassroots/referral-led (ambassadors, hall reps).

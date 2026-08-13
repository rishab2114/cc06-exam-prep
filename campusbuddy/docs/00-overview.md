# 00 — Executive Overview

> **⚠️ Direction has evolved since this doc was first written.** CampusBuddy is now
> **multi-campus** (all SG universities, not NTU-only), monetised primarily via
> **advertising** to a verified-student audience with a **light progressive
> commission** (not a flat 15% / escrow take), and the verification/safety model has
> been refined. For current truth see **`positioning.md`**, **`13-revenue-model.md`**,
> and the **`17-decisions-log.md`** (which overrides older docs where they conflict).

## The one-paragraph pitch
CampusBuddy is a closed, verified, on-demand services marketplace for NTU students. A student posts a task (clean my room before inspection, pick up my parcel, do my laundry, late-night food run). Verified NTU students nearby accept it, complete it, and get paid. Payment is escrowed by the platform via Stripe and released on completion, minus a 15% platform fee. Trust is enforced through NTU email + matric-card verification, two-sided ratings, and a safety layer.

## Who it is for
- **Customer (Requester):** A time-poor NTU student who needs a chore/errand done.
- **Provider (Buddy):** An NTU student with spare time who wants flexible income.
- **Admin:** Platform operator handling verification, disputes, payouts, and safety.

Critically, **most users are both** at different times. We design for a single account that can toggle into "Provider mode."

## What makes the MVP defensible
1. **Single-campus liquidity.** Density beats breadth in marketplaces. NTU has ~33,000 students, ~26 halls. We win one campus completely before expanding.
2. **Built-in verification.** `@e.ntu.edu.sg` email + matric card gives identity assurance most marketplaces lack.
3. **Trust loop.** Two-sided reviews + verified identity + escrowed payments reduce the cold-start trust problem.

## The hard truths (see docs/16)
The original brief is a strong consumer concept but has real risks that, if ignored, kill the company or get students hurt:
- **Money handling = potential MAS scrutiny.** Holding customer funds can look like a payment/e-money service. We sidestep this by using **Stripe Connect as the regulated money-services provider** and never touching funds in our own bank account.
- **Worker classification & student work-pass rules.** International students on a Student's Pass have strict work-hour limits. Mishandling this is a legal landmine.
- **Physical safety.** Strangers entering hall rooms, late-night runs, airport pickups — these need a real safety layer, not an afterthought.
- **Liability & insurance.** Property damage, food safety, personal injury. We need PLI + clear ToS + an escrow-backed dispute fund.
- **University relationship.** NTU could shut us down or, better, partner with us. Engage NTUC/Student Affairs early.

These are addressed by redesigning the platform (escrow model, safety layer, category gating, insurance, KYC) **before** implementation. The schema and API in this repo already reflect the redesign.

## Deliverables index
| # | Deliverable | File |
|---|---|---|
| 1 | Product Requirements Document | `01-product-requirements.md` |
| 2 | Database schema | `02-database-schema.md` |
| 3 | ER diagram | `03-er-diagram.md` |
| 4 | User flows | `04-user-flows.md` |
| 5 | Wireframes | `05-wireframes.md` |
| 6 | API architecture | `06-api-architecture.md` |
| 7 | Backend folder structure | `07-backend-structure.md` |
| 8 | Frontend folder structure | `08-frontend-structure.md` |
| 9 | Admin dashboard design | `09-admin-dashboard.md` |
| 10 | Stripe integration flow | `10-stripe-integration.md` |
| 11 | Security architecture | `11-security-architecture.md` |
| 12 | Launch strategy for NTU | `12-launch-strategy.md` |
| 13 | Revenue model | `13-revenue-model.md` |
| 14 | Growth strategy | `14-growth-strategy.md` |
| 15 | Roadmap to 10,000 users | `15-roadmap.md` |
| + | Risks, assumptions & redesign | `16-risks-and-redesign.md` |

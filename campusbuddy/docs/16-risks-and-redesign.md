# 16 — Challenging the Assumptions: Risks & Redesign

> This is the most important document in the repo. The original brief is a strong consumer concept, but several assumptions, if left unexamined, would get the company shut down or get students hurt. Below, each risk is stated bluntly, then the **redesign** that mitigates it — and these redesigns are already reflected in the schema, API, and flows.

---

## A. Legal & regulatory risks (Singapore)

### A1. Holding customer money → Payment Services Act (PSA) / MAS scrutiny
**Assumption challenged:** "Platform holds funds" sounds simple, but holding/transmitting customer money can constitute a regulated payment service (e-money / money transmission) under the **Payment Services Act 2019**, supervised by MAS. Doing this unlicensed is illegal.
**Redesign:**
- Use **Stripe Connect** so **Stripe** (a licensed/regulated entity) is the one holding/moving funds. CampusBuddy is a *marketplace platform*, never an e-money issuer; **customer funds never land in CampusBuddy's own bank account as stored value**.
- Use **separate charges & transfers** with manual capture for the escrow-like hold (docs/10).
- **Action item:** confirm with Singapore fintech counsel that the Connect marketplace pattern keeps our specific activity outside PSA licensing thresholds. Document the determination.

### A2. Worker classification — are Buddies employees?
**Assumption challenged:** Treating providers as casual contractors is not automatically safe. Misclassification creates CPF, tax, and employment-law exposure.
**Redesign:**
- Providers are **independent users transacting peer-to-peer**, not employees; platform is an intermediary. ToS + **Provider Agreement** make this explicit; platform does not set fixed shifts or guarantee work (beyond temporary launch incentives, which are structured as marketplace promotions, not wages).
- Avoid control signals that imply employment (uniforms, mandated hours).
- **Action item:** employment-law review of the Provider Agreement.

### A3. Student work-pass hour limits (the landmine)
**Assumption challenged:** "Students want side income" — but **international students on a Student's Pass (ICA/MOM rules) face strict limits** (term-time work-hour caps, type-of-work restrictions). Facilitating breaches exposes both the student and the platform.
**Redesign:**
- **Work-eligibility self-declaration** at provider onboarding (`provider_profiles.work_eligibility_ack`); clear in-app guidance on Student's Pass limits.
- Surface **earnings/hours awareness** and consider soft caps/alerts for flagged accounts.
- Position MVP categories as **occasional gig help** rather than employment.
- **Action item:** confirm current ICA/MOM rules for NTU students; tailor declarations and possibly restrict provider features for pass-types that prohibit work.

### A4. GST and income tax
**Assumption challenged:** Revenue and provider earnings have tax implications; at scale GST registration thresholds matter.
**Redesign:** track GMV/revenue; plan for **GST registration** at threshold; provide providers an **earnings summary/statement** so they can meet their own tax obligations; clear that providers are responsible for their taxes.

### A5. Food safety (SFA) for cooking & food handling
**Assumption challenged:** "Basic cooking" and meal handling carry **food-safety liability** (SFA regulations); selling/preparing food for others can require licensing.
**Redesign:** **Defer "basic cooking" to Phase 2+** with explicit guardrails (no resale of home-cooked food at scale, hygiene guidance, possibly restrict to assisted cooking in the customer's own kitchen). Food *pickup/collection* (sealed, from licensed vendors) is fine at MVP.

### A6. University relationship / "rogue app" risk
**Assumption challenged:** Launching aggressively without NTU could get the app banned on campus, ambassadors disciplined, or posters removed.
**Redesign:** Engage **NTU Student Affairs Office, hall councils, NTUSU early** (docs/12). Position as safety-first, verification-first, student-income-positive. Aim for sanctioned/partner status.

---

## B. Student safety concerns (the existential risk)
**Assumption challenged:** A marketplace that sends **strangers into dorm rooms**, does **late-night runs**, and offers **airport pickups** has serious physical-safety risk. One assault/theft incident can end the company and, far worse, harm a student.
**Redesign — a real safety layer, not a feature afterthought:**
- **Both-sides identity verification** required for any room-entry (T2) task; high-risk (T3: airport, off-campus, vehicles, cooking) **gated/deferred** until controls exist.
- **Check-in / check-out** (geo + timestamp) for in-person tasks → `safety_events`.
- **In-app SOS** → logs event, alerts admin/ops, surfaces **campus security** contact + the user's emergency steps.
- **Live task sharing** link to a friend.
- **No off-platform deals / no cash:** keep comms + payment in-app so there's a record (and so safety/dispute tooling works).
- **Block & report**, rapid suspension, and a written **incident-response runbook** (below).
- **Vetting tiers:** higher-trust tasks require higher verification + minimum rating/history.
- **Women's safety option (consideration):** allow gender preference for in-room tasks where lawful, and clear reporting.

### Incident-response runbook (summary)
1. SOS/report received → ops paged immediately.
2. Contact both parties; if danger, direct to **campus security / police (999)**.
3. Freeze the task + funds; suspend implicated account pending review.
4. Preserve evidence (chat, check-in/out, proof photos, ledger).
5. Notify university per agreed protocol; PDPC breach assessment if data involved.
6. Post-incident review; update gating/policy.

---

## C. Trust & verification issues
**Assumption challenged:** "NTU email + ID upload" is necessary but not sufficient — emails get shared, IDs get faked, alumni linger, and a verified identity ≠ a safe/competent provider.
**Redesign:**
- Email **ownership** proven via OTP/magic link, not just domain.
- Matric-card review (manual → OCR-assisted) with **liveness/selfie match** consideration in Phase 2 to bind ID to person.
- **Re-verification** on schedule / on graduation (account expiry tied to student status where possible).
- **Reputation as ongoing trust:** two-sided ratings, completed-jobs history, low-rating auto-review, fraud/velocity signals.
- **Stripe Connect KYC** adds a second, independent identity check for anyone handling money.

---

## D. Insurance requirements
**Assumption challenged:** The brief ignores liability. Property damage during cleaning/moving, lost parcels, personal injury, theft accusations — these *will* happen.
**Redesign:**
- **Public Liability Insurance (PLI)** for the platform; explore per-task / marketplace cover.
- **Escrow-backed dispute/guarantee fund:** a reserve (funded from take) to make small good-faith resolutions fast without litigation.
- **Clear liability allocation** in ToS: caps, exclusions, claims process, and what the platform does vs. doesn't cover.
- **Proof requirements** (before/after photos for cleaning/moving) reduce disputed claims.
- **Action item:** broker quotes for marketplace PLI in SG; budget in docs/13.

---

## E. Operational bottlenecks
**Assumption challenged:** The hard part isn't code — it's **liquidity, verification throughput, and dispute/safety ops**.
**Redesign / mitigations:**
- **Liquidity:** hyper-narrow launch + founding-Buddy guarantees + always-fill manual backstop (docs/12).
- **Verification backlog:** SLA + admin queue + OCR-assist; pre-verify founding cohort.
- **Disputes/support:** clear policies, auto-confirm window, evidence capture, dispute console, response SLAs.
- **Payments reconciliation:** webhook-driven truth + nightly reconciliation job; never trust request-path money state.
- **Low-value-task economics:** fee floor + min task value (docs/13).
- **Seasonality spikes:** capacity planning around inspections/exams/move-out; surge incentives.

---

## F. Privacy / PDPA
**Assumption challenged:** Collecting matric cards, location, and chat is sensitive PII under Singapore's PDPA.
**Redesign (also in docs/11):** data minimization; private encrypted ID storage with signed-URL access + access logging + watermarking; consider deleting raw ID after verification; consent + purpose limitation; subject-rights (access/erasure) workflow; breach-notification process.

---

## G. Net effect on the product
The redesign adds, before any line of feature code:
1. **Stripe Connect escrow model** (not own-bank holding) — schema: `provider_profiles.stripe_account_id/payouts_enabled`, `payments`, `ledger_entries`, `payouts`.
2. **Risk-tiered categories** with verification/safety gating — schema: `service_categories.risk_tier`, eligibility checks in `tasks.assign`.
3. **Safety layer** — schema: `safety_events`, `user_blocks`, SOS/check-in/out endpoints, share links.
4. **Verification depth** — `verifications` per kind, re-verification, Connect KYC.
5. **Work-eligibility & contractor framing** — `work_eligibility_ack`, Provider Agreement.
6. **Insurance + dispute fund + PDPA controls** — disputes flow, evidence capture, ledger/audit, private ID storage.
7. **Institutional engagement** — non-technical but gating for survival.

**Bottom line:** the original concept is buildable and attractive, but only viable if money handling, physical safety, verification, insurance, and the NTU relationship are solved *first*. This document, and the schema/API that reflect it, are that solution — engineers can build immediately on a foundation that won't collapse legally or in a safety incident.

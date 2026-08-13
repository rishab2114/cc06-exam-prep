# 17 — Decisions Log

Canonical record of product decisions made during build that **change or override
the original spec (docs 00–16)**. Where this log disagrees with an older doc, **this
log + the running app win.** Newest decisions reflect current direction.

## Market & positioning
- **Multi-campus, not NTU-only.** Rebranded "CampusBuddy NTU" → **CampusBuddy**.
  Email gate accepts all SG universities (SUTD, NTU, NUS, SMU, SIT, SUSS). TAM =
  all tertiary students (~250k+ incl. polys/private); regionally portable.
- **Launch narrow, vision wide.** Roll out **campus-by-campus** (liquidity AND ad
  demand are local) even though the platform supports all. SUTD is an early pilot;
  pick launch campuses for student + advertiser density.
- **Positioning:** "On-demand campus help — by students, for students, cheaper." Win on
  **verified + on-demand + no social debt.** See `positioning.md`.

## Revenue (see `13-revenue-model.md`)
- **Commission lowered & progressive** (was flat 15%): 1% up to S$10, 3% S$10–30,
  5% above S$30. Kept low as an **adoption lever**, not the business.
- **Platform fee hidden from users** in the UI.
- **Advertising is the primary long-term revenue** (verified-student audience).
  North Star shifts to **engagement/DAU**, not take-per-task.
- **No task minimum** (removed the old S$5 floor and S$1 fee floor).

## Payments
- Explored **on-spot PayNow/cash (no escrow)** and **reverted** it. Payment method
  is **undecided**; app currently shows a placeholder "Continue to payment".
  Guidance: keep payment on-platform to avoid disintermediation and preserve the
  ad-engagement loop; add a small flat buyer service fee only to cover processing.

## Verification & safety (overrides parts of docs 11/16)
- **Two-stage verification:**
  1. *Onboarding* → account becomes **matric-verified** (gates who can apply to
     sensitive tasks).
  2. *Arrival check-in* (every sensitive task) → **NTU pass (SSO)** or **live in-app
     matric-card photo (no gallery uploads)**; identity must match the assigned
     buddy or it's blocked and the customer alerted. **Stops substitutes.** Matric
     number is never shown.
- **Same-gender matching** for intimate tasks (cleaning/laundry), **opt-in by the
  customer**.
- **Cleaning = in-person:** done while the customer is present; the buddy is never
  alone in the room.
- **Laundry = contactless:** bag left outside the door, no room entry, with
  **Grab-style live status updates** (picked up → washing → drying → on the way back
  → delivered). Customer tracks it live.

## Services
- **Study help / peer tutoring** added: students help other students study — concept
  explanation & exam prep, hourly, in-person (library) or online. GUARDRAIL:
  tutoring/explaining only, **never** doing assignments or exam proxying (contract
  cheating is banned — serious academic-integrity risk).
- **Moving/shift = labour only.** Founder decision: help students *move* their stuff;
  do NOT run a storage facility or become a logistics/storage operator (would pivot
  away from the help-marketplace). A self-storage *referral partner* is a possible
  future upsell, explicitly deferred.
- **Room shift & storage help** added: moving belongings between rooms/halls and
  to/from storage (carry/pack/shift, often two buddies). High value per job;
  surges at move-out & semester break; customer-present so lower risk; natural
  B2B tie-in with self-storage providers.
- **"Cooking" reframed as "Spare home-cooked meal"** (sharing an extra portion, not
  a chef service). Note: still under SFA home-based food rules — keep small-scale,
  not a launch headline.
- **Grocery/Food delivery:** 7-Eleven & Prime are a **single combined option**;
  store dropdown also has FairPrice, Cheers, Amazon/Prime Now.

## Open / to revisit
- Final payment method + whether to add a flat service fee.
- Engagement surfaces required to make ads pay (deals/offers tab, events feed).
- Regulatory clearances before scaling room-entry & food: **MOM** student work-pass
  limits, **hostel/university** commercial-activity rules, **SFA** food, **PDPA**
  (storing matric/verification data), eventual **GST/income-tax** facilitation.

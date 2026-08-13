# 01 — Product Requirements Document (PRD)

**Product:** CampusBuddy NTU
**Version:** MVP 1.0
**Status:** Ready for build
**Last updated:** 2026-06

---

## 1. Problem statement
NTU students living in hall face chores/errands they can't fit around academics, internships, CCAs, exams, and limited transport. Simultaneously, many students want flexible, low-commitment income. There is no trusted, campus-native way to match them. Generic gig apps (TaskRabbit, etc.) don't operate at campus granularity, don't verify student identity, and carry trust/safety risk.

## 2. Goals & non-goals

### Goals (MVP)
- Let a verified NTU student post a task and get it done within hours.
- Let a verified NTU student earn money by accepting tasks.
- Make payment safe via escrow (hold → release on completion).
- Establish trust via verification + two-sided ratings + a safety layer.
- Achieve **marketplace liquidity in ≥3 NTU hall clusters** within 8 weeks.

### Non-goals (MVP)
- Native iOS/Android apps (ship a PWA; native later).
- Multi-university support (architected for it, not enabled).
- In-app chat with media/voice (start with templated + free-text text chat).
- Scheduling far in advance / recurring subscriptions (post-MVP).
- Provider "teams"/businesses (individuals only at MVP).

## 3. Success metrics (North Star + supporting)
- **North Star:** # of completed tasks / week.
- Liquidity: median time-to-accept < 15 min during peak; **fill rate** (tasks accepted / tasks posted) > 70%.
- Retention: 30-day requester retention > 35%; provider weekly active retention > 40%.
- Trust: dispute rate < 3% of completed tasks; safety incidents = 0 tolerated, tracked to root cause.
- Economics: take rate 15%; contribution margin positive after payment fees by month 3.

## 4. Personas
1. **Priya, Y2, lives in Hall 9, heavy CCA load.** Needs room cleaned before block inspection, parcels collected from Tamarind. Price-sensitive, time-poor, trusts peer reviews.
2. **Wei, Y3, between internships, wants income.** Has 10–15 flexible hours/week. Wants quick payouts and to control which tasks he takes. **International student → work-hour rules apply.**
3. **Admin/Ops (founder at MVP).** Verifies IDs, resolves disputes, monitors safety, triggers payouts.

## 5. Verification requirements (gate to join)
- **NTU email verification** — only `@e.ntu.edu.sg` / `@ntu.edu.sg` / `@*.ntu.edu.sg` (configurable allowlist) can register; OTP/magic-link to confirm ownership.
- **Matric card (student ID) upload** — stored privately in S3; reviewed by admin (manual at MVP, OCR-assisted later). Status: `pending → verified / rejected`.
- **Hall residence (optional)** — self-declared hall + optional proof; powers proximity matching.
- **Provider extra step:** to earn money a user must additionally (a) complete Stripe Connect onboarding (identity/KYC handled by Stripe) and (b) accept the Provider Agreement incl. **work-eligibility self-declaration** (see docs/16).

## 6. Functional requirements

### 6.1 Authentication
- Sign up (NTU email only), Login, Logout.
- Forgot password / passwordless magic-link option.
- Email verification (mandatory before any action beyond browsing).
- Session via secure http-only cookies; refresh tokens; device list.

### 6.2 User profile
- Name, profile photo, hall, school/faculty, year of study.
- Aggregate **rating** (avg of received reviews), **completed jobs** count, **earnings** (provider, lifetime + this month), **spend** (customer).
- Verification badges (Email ✓, ID ✓, Hall ✓, Payouts ✓).
- Provider toggle: "Available to accept tasks" + service categories offered.

### 6.3 Service marketplace
- Browse all open tasks (provider view) and browse service categories (customer view).
- Search by keyword; filter by category, hall/zone, budget range, time window.
- View provider profiles (rating, completed jobs, reviews, verified badges).
- Category catalog (see §8).

### 6.4 Booking system
Two booking modes:
- **Open request (default, "broadcast"):** Customer creates a task; eligible providers see it and accept (first-accept or customer-selects from applicants — MVP: **customer selects from up to N applicants**, reducing race conditions and improving fit).
- **Direct request (post-MVP):** Customer requests a specific provider.

Customer can: create task (category, description, location/hall, time window, budget), edit/cancel (before accept), select provider from applicants, confirm completion, rate.
Provider can: browse eligible tasks, apply/accept, withdraw (before start), mark in-progress, mark complete (with optional proof photo), rate.

Task lifecycle (state machine):
`DRAFT → OPEN → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED`
with side branches `CANCELLED` (by customer/provider/admin) and `DISPUTED`.

### 6.5 Payments (see docs/10)
- Customer authorizes payment at booking (Stripe PaymentIntent, **manual capture** = hold).
- Funds captured when provider is assigned (or at completion — configurable; MVP captures on assignment, releases on completion).
- On completion + confirmation, **transfer to provider's Connect account minus 15% application fee**.
- Refunds/partial refunds on cancellation/dispute.
- Provider payouts handled by Stripe Connect (Express).

### 6.6 Ratings & reviews
- After `COMPLETED`: customer rates provider, provider rates customer (1–5 + optional comment).
- Reviews are double-blind until both submit or 7 days pass (prevents retaliation bias).
- Aggregate rating shown on profile; low-rating thresholds trigger admin review.

### 6.7 Notifications (email + push)
Triggers: new matching task (provider), new applicant (customer), booking accepted/assigned, task started, task completed, payment captured/released, payout sent, review request, dispute updates, safety check-in. Channels: Web Push (VAPID) + email; per-user preferences.

### 6.8 Safety layer (added by redesign — see docs/16)
- In-app **SOS / report** button on every active task.
- **Check-in / check-out** for in-person tasks (esp. room entry, late-night, airport).
- Live task sharing link a user can send to a friend.
- Category risk tiers gating (e.g., "room entry" requires both parties ID-verified; airport pickup disabled until phase 2).
- Block/report user; admin suspension.

### 6.9 Admin (see docs/09)
Verification queue, dispute console, user management, payout monitoring, content/category management, safety incident log, analytics.

## 7. Non-functional requirements
- **Performance:** p95 API < 300ms; task feed loads < 1.5s on 4G mobile.
- **Availability:** 99.5% MVP target.
- **Mobile-first:** designed for phone; PWA installable; offline-tolerant browse.
- **Accessibility:** WCAG 2.1 AA for core flows.
- **Privacy/PDPA:** Singapore PDPA-compliant; data minimization; ID images encrypted at rest, access-logged.
- **Auditability:** every money movement and state transition is event-logged (immutable ledger table).
- **Localization:** SGD currency; English (MVP).

## 8. Service catalog (with risk tier)
| Category | Services | Risk tier | MVP? |
|---|---|---|---|
| Hall services | Room cleaning, deep clean (pre-inspection), organization, bedsheet change | **Tier 2** (room entry) | ✅ (ID-verified both sides) |
| Laundry | Pickup, wash, dry, iron, fold | Tier 1 | ✅ |
| Food & grocery | Grocery shopping, food pickup, meal collection, late-night runs | Tier 1 (Tier 2 if late-night) | ✅ |
| Convenience | Parcel/proxy collection, queue standing, printing/doc collection | Tier 1 | ✅ |
| Student help | Hall moving, **airport pickup**, luggage carrying, basic cooking | **Tier 3** (airport/cooking) | ⚠️ Phase 2 (airport, cooking); moving/luggage Tier 2 at MVP |

Risk tiers: **T1** standard; **T2** requires both parties ID-verified + check-in/out; **T3** elevated (off-campus, vehicles, food safety) → gated to Phase 2 with extra controls (see docs/16).

## 9. Key product decisions (ADRs)
- **ADR-001 Auth: Auth.js over Clerk.** Clerk is faster to ship but per-MAU pricing hurts at 10k students who are mostly low-ARPU. Auth.js gives us full control of the NTU-domain gate and is free. *Trade-off: more code. If speed-to-market dominates, start on Clerk and migrate.*
- **ADR-002 Escrow via Stripe Connect, never our own bank.** Avoids being classified as a money-services/e-money business under the SG Payment Services Act. (See docs/16.)
- **ADR-003 PWA before native.** App-store friction + review delays slow campus virality; PWA + "Add to Home Screen" is enough for MVP. Native in Phase 3.
- **ADR-004 Customer-selects-from-applicants over first-to-accept.** Better fit, fewer race conditions, lets customer see rating before commit. Adds slight latency; acceptable.
- **ADR-005 Two-sided double-blind reviews.** Reduces retaliation and inflation.

## 10. Out-of-scope risks explicitly tracked
Worker classification, MAS payment licensing, student work-pass hours, food safety (SFA), insurance, NTU institutional relationship — all in docs/16 with mitigations baked into schema/flows.

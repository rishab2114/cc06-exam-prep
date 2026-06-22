# CampusBuddy NTU — Project Handoff / Context Summary

> Paste this whole file into another assistant to bring it fully up to speed.
> Last updated: 2026-06-22.

## 1. What it is
CampusBuddy is an **on-demand services marketplace exclusively for verified NTU
(Nanyang Technological University, Singapore) students** — "Uber/TaskRabbit for a
university campus." Students post everyday tasks; other verified students ("buddies")
accept and complete them.

**Service categories:** Hall services (room cleaning, deep clean, organising, bed
sheets), Laundry (pickup/wash/dry/iron/fold), Food & Grocery (grocery runs, food
pickup, late-night runs, delivery), Convenience (parcel/proxy collection, queue
standing, printing), Student help (moving, airport pickup, luggage, basic cooking).

**Roles:** Customer (requests), Provider/"buddy" (performs), Admin (platform mgmt).

## 2. Where the code lives
- **GitHub repo:** `rishab2114/cc06-exam-prep`
- **Branch:** `claude/campusbuddy-ntu-mvp-etaymm`
- **Project root in repo:** `campusbuddy/`
- Runs locally on macOS. The frontend demo needs no backend/DB.

## 3. Tech stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS. Auth.js (NextAuth)
  with NTU email magic-link is scaffolded.
- **Backend:** NestJS + Prisma ORM + PostgreSQL (scaffold; see modules below).
- **Intended infra (per docs):** Stripe payments, AWS S3 storage, Vercel (FE) +
  Railway/Supabase (BE), Docker Compose for local Postgres.

## 4. Documentation (the "design spec", in `campusbuddy/docs/`)
These 17 markdown docs describe the FULL original design. NOTE: several product
decisions were changed during build sessions (see §7) — where the running app and
these docs disagree, **the app and §7 below are the source of truth.**

00-overview, 01-product-requirements, 02-database-schema, 03-er-diagram,
04-user-flows, 05-wireframes, 06-api-architecture, 07-backend-structure,
08-frontend-structure, 09-admin-dashboard, 10-stripe-integration,
11-security-architecture, 12-launch-strategy, 13-revenue-model, 14-growth-strategy,
15-roadmap, 16-risks-and-redesign.

## 5. What is actually BUILT and RUNNABLE right now
A **clickable frontend demo with mock data** (no backend required). Run from
`campusbuddy/frontend`: `npm install` then `npm run dev` → http://localhost:3000.

Routes (`campusbuddy/frontend/app/`):
- `/` — marketing landing page ("Campus chores, done by fellow NTU students").
- `/login` — NTU email gate (rejects non-NTU domains) → magic-link (demo).
- `/verify` — "check your email" → demo "continue to app".
- `/app` — customer home: search, **Quick Post** tiles (Clean, Laundry, Grocery,
  Parcel, Food run, **7-Eleven / Prime**), and an active-task card ("Room clean,
  3 applicants ›").
- `/app/find` — provider task feed; each task shows price, hall, distance, rating,
  and badges (🪪 ID-verified, ♀/♂ same-gender) → **Apply**.
- `/app/apply/[id]` — apply flow: verification gate + **own-price quote (bidding)** +
  message. Shows net "You earn".
- `/app/applicants/[id]` — CUSTOMER view: list of applicants, each with their quote,
  rating, jobs done, verified badge, ETA, message; sorted cheapest-first; **Accept**.
- `/app/task/[id]` — active task: **arrival check-in** (anti-impersonation) →
  "Mark task complete".

Shared logic (`campusbuddy/frontend/lib/`): `ntu.ts` (NTU email check), `auth.ts`
(Auth.js config), `format.ts` (money + progressive fee math), `mockTasks.ts`
(demo data: tasks, applicants, current provider).

## 6. Backend scaffold (NOT running locally yet)
NestJS modules in `campusbuddy/backend/src/`: `tasks`, `payments`, `prisma`,
`common` (incl. `utils/money.ts` = single source of truth for fee math), plus
`health.controller.ts`.

**Prisma models** (`backend/prisma/schema.prisma`): User, ProviderProfile,
Verification, ServiceCategory, Task, Application, TaskEvent, Payment, LedgerEntry,
Payout, Review, Dispute, SafetyEvent, UserBlock, Message, Notification,
PushSubscription.

**Local backend is currently blocked:** the developer's Mac has **no Docker**, and a
pre-existing Postgres on :5432 causes Prisma error `P1010`. Backend has not been run.
The frontend demo is unaffected (mock data).

## 7. KEY PRODUCT DECISIONS made during build (these override the docs)
1. **Two-stage verification (anti-impersonation):**
   - *Onboarding (once):* account becomes "matric-verified" (proves real NTU student).
     Gates who can APPLY to sensitive tasks (room entry / handling belongings).
   - *Arrival check-in (every sensitive task):* at the customer's door the buddy
     verifies via **(a) NTU pass (SSO re-auth)** or **(b) a live in-app photo of the
     matric card (no gallery uploads)**. The returned identity must match the assigned
     buddy; a mismatch is blocked and the customer alerted — so **nobody can send a
     substitute**. The matric NUMBER is never shown to anyone.
2. **Same-gender matching is OPT-IN by the customer** (for intimate tasks like laundry),
   matched against the provider's verified profile gender. Framed as comfort/safety.
3. **Open bidding on price:** the customer lists a budget, but providers can **quote
   their own price** (higher or lower). The customer browses applicants and picks on
   price + rating + ETA, not just lowest.
4. **Commission lowered + progressive (was flat 15%):** marginal brackets —
   **1%** up to S$10, **3%** S$10–30, **5%** above S$30 (effective ~1% small → ~4–5%
   large, never more). Implemented in BOTH `frontend/lib/format.ts` and
   `backend/src/common/utils/money.ts`. **The platform fee is HIDDEN from users** in
   the UI (customer sees only "You pay X"; buddy sees net "You earn Y").
5. **No task minimum** (removed the old S$5 floor and the S$1 fee floor).
6. **Grocery/delivery:** 7-Eleven and Prime are a **single combined option** (one home
   tile + one store-dropdown entry); dropdown also has FairPrice, Cheers, Amazon/Prime Now.
7. **Payments — OPEN/UNDECIDED:** We prototyped "on-the-spot PayNow or cash (no escrow,
   nothing held by the app)" and then **reverted it** for now. The app currently shows a
   placeholder "Continue to payment" (the docs assume Stripe escrow + payout). Payment
   method and **revenue model are not finalised**. Caveat raised: at 1–5% commission the
   platform may not cover Stripe processing fees, so monetisation needs revisiting
   (options floated: grow-free-then-monetise, featured listings, buddy subscription).

## 8. Known constraints / gotchas
- Frontend demo = **mock data only**; no real persistence, auth, or payments yet.
- Backend not runnable locally without Docker or a manually-provisioned Postgres.
- Auth.js magic-link is configured but email isn't actually sent in the demo.

## 9. Suggested next steps (not yet built)
- Customer **accept-applicant** flow → notify buddy → live "verified & arrived" status.
- Decide payments + revenue model (§7.7) and implement.
- Wire the frontend to the NestJS API + Postgres; ratings, notifications, disputes,
  admin dashboard.
- Backend tests for the progressive fee already updated in `money.spec.ts`.

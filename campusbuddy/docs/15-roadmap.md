# 15 — Roadmap: MVP → 10,000 Users

Phased by liquidity milestones, not calendar dates. Each phase has an exit gate. Rough timeline assumes a 2–4 person team.

## Phase 0 — Concierge validation (Weeks -4 → 0)
**Goal:** prove demand and learn fulfilment without full software.
- WhatsApp/Telegram + Google Form manual marketplace in one hall cluster.
- Pre-verify 20–30 founding Buddies; fulfil real tasks; learn pricing/mix/SLAs.
- Draft legal: ToS, Provider Agreement, work-eligibility declaration, privacy policy. Get PLI quotes.
**Exit gate:** ≥ 50 real tasks fulfilled manually; clear top-3 categories; pricing validated.

## Phase 1 — MVP build & closed beta (Weeks 1 → 8)
**Goal:** ship the core loop to the beachhead cluster.
- Auth (NTU domain gate) + email verification + matric-ID upload + admin verification queue.
- Profiles + provider opt-in + Stripe Connect onboarding.
- Task create → broadcast → apply → select → complete → confirm.
- Stripe escrow (manual capture + transfer on release) + 15% fee + webhooks.
- Two-sided reviews; task-scoped chat; notifications (email + web push).
- Safety v1: check-in/out, SOS, report/block, live-share link.
- Admin: verification, disputes, users, safety, metrics.
- PWA installable.
**Exit gate:** 100 verified users in cluster; 70%+ fill rate; dispute < 5%; **zero unresolved safety incidents**; payments reconcile cleanly.

## Phase 2 — Saturate beachhead & harden (Weeks 9 → 16) — ~500–1,000 users
**Goal:** make the cluster self-sustaining; remove manual props.
- Referral system (completion-gated) both sides.
- Matching improvements (zone/proximity, provider reputation ranking).
- Fee floor + optional service-fee passthrough; min task value.
- Auto-confirm (48h), review-publish timeout, re-broadcast jobs.
- Reliability: monitoring, on-call, reconciliation, backups/restore drills.
- Insurance live (PLI + dispute/escrow fund); finalize legal; engage NTU SAO/hall councils.
**Exit gate:** liquidity self-sustaining without earnings guarantees; CSAT ≥ 4.5; contribution-positive per task.

## Phase 3 — Expand across NTU (Weeks 17 → 32) — ~1,000 → 5,000 users
**Goal:** roll cluster playbook hall-by-hall to most of NTU.
- Ambassador program scaled; demand-event campaign engine (inspections/exams/move-out).
- Category expansion with controls: cleaning at scale (T2), then phased T3 (airport pickup with vetting, basic cooking with food-safety guardrails).
- Provider tiers / "Buddy+" subscription; faster payouts.
- Native app evaluation (if PWA limits push/retention on iOS).
- Trust & safety team (even part-time); formal incident runbook.
**Exit gate:** majority of NTU halls active; fill rate held > 70% at scale; healthy cohort retention.

## Phase 4 — Full NTU & scale ops (Weeks 33 → 52) — ~5,000 → 10,000 users
**Goal:** own NTU; institutionalize ops; prep multi-campus.
- Full campus coverage; recurring tasks/subscriptions; scheduled/advance bookings.
- Mature dispute automation, fraud detection, analytics/experimentation platform (PostHog + feature flags).
- Finance/compliance hardening; legal confirmation of Connect model & PDPA at scale.
- Multi-tenancy switch validated (school/domain config) for next campus.
- Hiring: ops lead, T&S, growth, +eng.
**Exit gate:** ~10,000 active NTU users; profitable contribution; repeatable launch kit for a second university.

## Beyond 10k (vision)
- NUS/SMU/SUTD replication; polytechnics; verticalized B2B2C with universities/halls; possible expansion of the verified-student network into adjacent services (tutoring, second-hand marketplace) leveraging the trust graph.

## Engineering sequencing summary
1. Auth + verification → 2. Profiles + Connect → 3. Task lifecycle → 4. Payments/escrow + webhooks → 5. Reviews + chat + notifications → 6. Safety + admin → 7. Referrals + matching → 8. Reliability/scale → 9. Category/native expansion.

## Always-on workstreams
Trust & safety, payments reconciliation/compliance, support/ops, analytics, and the NTU institutional relationship run continuously across all phases.

# 09 — Admin Dashboard Design

Audience: founder/ops at MVP, then a small trust & safety + payments team. Desktop-first, role-gated (`ADMIN`). Built in the same Next.js app under `/admin`.

## Sections

### 1. Overview / Metrics (`/admin`)
KPI tiles + charts (read from `/admin/metrics`):
- Completed tasks (today / 7d / 28d), GMV (SGD), platform revenue (take), avg take rate.
- **Liquidity:** open tasks, median time-to-accept, **fill rate**, tasks expiring unfilled.
- Active providers (available now), new signups, verification backlog size.
- Dispute rate, open disputes, safety events (7d).

### 2. Verification queue (`/admin/verifications`)
- Table of `PENDING` student-ID submissions: student name, NTU email (✓), matric image (secure viewer, watermarked, access-logged), submitted time.
- Actions: **Approve / Reject (with reason)**. Approve sets `STUDENT_ID` ✓; reject notifies user with reason.
- SLA target: < 12h. Aged items flagged red.
- Bulk view; OCR-assist (phase 2) pre-fills name/matric for reviewer confirmation.

### 3. Dispute console (`/admin/disputes`)
- Queue sorted by age/SLA. Each dispute shows: task timeline (`task_events`), chat transcript, proof photos, check-in/out geo, payment/ledger state, both parties' history.
- Resolutions (one click → ledger + Stripe): **Full refund**, **Release to provider**, **Split** (enter amounts), **Reject dispute**.
- All actions audit-logged with admin id + note.

### 4. Users (`/admin/users`)
- Search/filter by hall, role, rating, status. Profile drawer: verifications, tasks, reviews, reports against them, ledger.
- Actions: suspend/unsuspend, force-reverify, reset payouts, send message. Suspension blocks new tasks immediately.

### 5. Safety center (`/admin/safety`)
- Live feed of `safety_events` (SOS first, real-time). SOS shows task, parties, last check-in geo, contact numbers, campus security quick-dial.
- Reports queue (user/task reports) with triage states.
- Runbook links (see docs/16 incident response).

### 6. Catalog & pricing (`/admin/catalog`)
- Toggle categories active/inactive, set risk tier, suggested price ranges, control which categories are live per phase (gate T3).

### 7. Payouts & finance (`/admin/finance`)
- Failed transfers/payouts, Connect accounts pending KYC, reconciliation report (Stripe vs ledger), refunds issued. Export CSV for accounting.

## Access control & audit
- `ADMIN` role required; ideally separate sub-roles later (T&S vs Finance vs SuperAdmin) via permission flags.
- Every admin action writes an audit log (actor, target, action, before/after, timestamp).
- Matric/ID images: time-limited signed URLs, watermarked with viewer id, every view logged (PDPA).

## Tech
- Next.js `/admin` route group, server components for tables, shadcn DataTable, Recharts for KPIs. Real-time SOS via SSE/websocket channel. No separate app needed at MVP.

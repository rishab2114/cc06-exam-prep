# CampusBuddy NTU

> An on-demand, student-to-student services marketplace for Nanyang Technological University (NTU), Singapore.
> "Uber + Urban Company + TaskRabbit, exclusively for verified university students."

CampusBuddy connects **students who need everyday tasks done** (cleaning, laundry, food runs, parcel pickup, moving help) with **verified NTU students who want flexible income**. The platform handles discovery, booking, escrowed payments via Stripe, ratings, and trust & safety.

---

## Why this exists

Students in hall struggle with chores and errands because of heavy academic workload, internships, CCAs, exams, and lack of transport. Meanwhile many students want flexible side income. CampusBuddy is the marketplace that matches the two — inside the trusted, closed network of a single campus.

Starting with **one campus (NTU)** is deliberate: a closed community gives us dense supply/demand (liquidity), cheap word-of-mouth growth, natural verification (NTU email + matric card), and a defensible beachhead before expanding to other Singapore universities.

---

## Repository layout

```
campusbuddy/
├── README.md                  ← you are here
├── docs/                      ← the full design + strategy deliverables
│   ├── 00-overview.md
│   ├── 01-product-requirements.md     PRD
│   ├── 02-database-schema.md          Postgres schema + SQL
│   ├── 03-er-diagram.md               ER diagram (Mermaid)
│   ├── 04-user-flows.md               Customer / Provider / Admin flows
│   ├── 05-wireframes.md               Low-fi wireframes (ASCII + notes)
│   ├── 06-api-architecture.md         REST API contract
│   ├── 07-backend-structure.md        NestJS folder structure
│   ├── 08-frontend-structure.md       Next.js folder structure
│   ├── 09-admin-dashboard.md          Admin design
│   ├── 10-stripe-integration.md       Payments / escrow / Connect
│   ├── 11-security-architecture.md    Security & privacy
│   ├── 12-launch-strategy.md          NTU go-to-market
│   ├── 13-revenue-model.md            Unit economics
│   ├── 14-growth-strategy.md          Growth loops
│   ├── 15-roadmap.md                  MVP → 10,000 users
│   └── 16-risks-and-redesign.md       Legal/safety/insurance redesign
├── backend/                   ← NestJS + Prisma scaffold
├── frontend/                  ← Next.js (App Router) + Tailwind scaffold
└── docker-compose.yml         ← local Postgres + Redis
```

## Recommended tech stack (decided)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui** | SSR for SEO/landing, RSC, great mobile-web UX; PWA for app-like feel without app-store friction at MVP |
| Backend | **NestJS (Node + TypeScript)** | Opinionated modular structure, DI, guards/interceptors map cleanly to auth + roles; shares types with frontend |
| Database | **PostgreSQL** (Supabase or Railway) | Relational integrity for bookings/payments; PostGIS-ready for geo |
| ORM | **Prisma** | Type-safe schema, migrations, shared types |
| Auth | **Auth.js (NextAuth) with email-domain restriction + custom matric verification** | Avoids per-MAU cost of Clerk at scale; full control over NTU `@e.ntu.edu.sg` gating. (Clerk is the faster alternative — see ADR in docs/01.) |
| Payments | **Stripe (Payment Intents + manual capture + Connect Express)** | Escrow-style hold, 15% application fee, payouts to providers |
| Storage | **AWS S3** (presigned uploads) for ID/photos | Private bucket, short-lived URLs |
| Realtime/Jobs | **Redis + BullMQ** | Notifications, payout jobs, matching |
| Notifications | **Resend/Postmark (email) + Web Push (VAPID) / FCM** | Email + push per spec |
| Hosting | **Vercel (frontend) + Railway (backend, Postgres, Redis)** | Fast MVP deploys |
| Observability | **Sentry + Logtail + Stripe + PostHog (product analytics)** | Errors, logs, funnels |

> **The most important part of this repo is `docs/16-risks-and-redesign.md`.** It challenges the original concept (legal, safety, insurance, MAS/regulatory, operational) and the redesign there is reflected throughout the schema and API.

## Quick start (scaffold)

```bash
# 1. Infra
docker compose up -d           # Postgres + Redis

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev              # http://localhost:4000

# 3. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev                    # http://localhost:3000
```

See each `docs/*.md` for the detail an engineering team needs to start building immediately.

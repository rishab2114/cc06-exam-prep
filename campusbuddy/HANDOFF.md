# CampusBuddy — project handoff

Last updated: 2026-08-13

## Current context

- GitHub: `rishab2114/cc06-exam-prep`
- Working branch: `claude/campusbuddy-ntu-mvp-etaymm`
- Project root: `campusbuddy/`
- Product: student-to-student campus task and service marketplace
- First-pilot concept: NTU
- Current state: interactive, database-backed demo with synthetic seed data

## Deployed architecture

The active application is Next.js 14 in `frontend/`. It contains both the App Router UI and the authenticated `/api/v1` route handlers used by the deployed demo. Those routes use Prisma and PostgreSQL through the schema in `backend/prisma/schema.prisma`.

`backend/` also contains a NestJS implementation and tests. It is useful architecture/reference work, but it is not the request path used by the current Vercel deployment. `shared/` contains cross-workspace validation and money utilities.

## Working product loop

1. Create an account with a supported campus-email domain or enter as a seeded sample persona.
2. Post a request, browse the campus feed or list a freelance service.
3. Offer a price, counter and accept.
4. Coordinate through task chat.
5. Follow a task-specific completion flow.
6. Complete the task and leave two-sided reviews.

The app also has saved tasks, notifications, task history, service booking, study-help facets and course search.

## Demo boundaries

- Priya, Wei and Arjun are synthetic personas created by the demo seed.
- Seeded requests, completed history, reviews and services are synthetic.
- Visitors may still create and use their own password-based demo account.
- Signup currently validates the campus-email domain only. `emailVerifiedAt` remains null for those accounts; inbox OTP is not yet enforced.
- In-app payment, escrow and payout are not live. Users agree a price and settle directly after completion.
- Sponsored cards are non-clickable sample placements, not real promotions or partnerships.
- Matric-card and arrival verification copy describes a planned safety layer; the current check-in interaction is a demo.

## Seed and authentication behavior

`frontend/scripts/seed.mjs` is the Vercel-safe, idempotent seed. It creates the campus/category registry and, when `SEED_DEMO=1` or `RESEND_API_KEY` is absent, rebuilds only demo-owned rows. `backend/prisma/seed-demo.ts` mirrors the same synthetic dataset for local backend work.

Demo mode exposes one-tap access only for IDs prefixed `demo-user-`; it does not expose or impersonate user-created accounts. Adding `RESEND_API_KEY` disables public demo personas and enables the real email-code path.

## Key routes

- `/` — honest demo landing page and synthetic seed counts
- `/login` — password sign-in, account creation and sample personas
- `/app` — dashboard and quick task posting
- `/app/find` — request feed, search, safety and course facets
- `/app/services` — freelance service listings and booking
- `/app/apply/[id]` — offer and negotiation entry
- `/app/applicants/[id]` — poster-side offer comparison and acceptance
- `/app/task/[id]` — negotiation, chat, status and completion
- `/app/history`, `/app/saved`, `/app/notifications`, `/app/profile`

## Local setup

From `campusbuddy/`:

```bash
npm install
cp frontend/.env.example frontend/.env.local
npx prisma migrate dev --schema backend/prisma/schema.prisma
SEED_DEMO=1 node frontend/scripts/seed.mjs
npm run dev
```

Required environment values are documented in `frontend/.env.example`. Run `npm run build` for the production build and `npm test` for the backend test suite.

## Next pilot-critical work

1. Add and enforce inbox OTP before accounts receive a verified claim.
2. Resolve NTU policy, liability, insurance and hall commercial-activity questions.
3. Decide the payment model before implementing escrow, fees or payouts.
4. Replace demo check-in with real identity/matric verification and privacy controls.
5. Run a narrow hall/category pilot and measure task liquidity, completion and repeat use.

When historical documents disagree with the running app, treat this file, the current code and `docs/17-decisions-log.md` as the source of truth.

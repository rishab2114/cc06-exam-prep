# CampusBuddy

CampusBuddy is a student-to-student marketplace for small campus tasks and services: laundry, parcel collection, food runs, room help, moving and tutoring.

The current NTU deployment is an **interactive product demo backed by PostgreSQL**, not a static mock-up. Visitors can use one-tap synthetic personas or create a working account with a supported campus-email domain.

[Open the CampusBuddy demo](https://frontend-git-claude-campusbuddy-ntu-216c22-rishab2114s-projects.vercel.app/)

It also includes a **free NTU Hall Swap Matcher**: residents enter the hall and room type they have plus the halls, room types, and air-con options they would accept. CampusBuddy surfaces reciprocal matches only, keeps contact details private until both students agree to connect, and hands the pair back to NTU's official room-change process. It deliberately does not support room rental, cash top-ups, bidding, or unofficial transfers.

## What works today

- Post a task or list a service.
- Browse and filter the campus feed, including tutoring by course.
- Make an offer, counter and accept a price.
- Chat after matching and follow task-specific completion flows.
- Complete a task and leave two-sided reviews.
- Save tasks, receive notifications and view history.
- Create a password-based account using a supported campus-email domain.
- Find reciprocal NTU hall-swap matches and request a private introduction.

The deployed sample people, tasks, completed job and service listings are synthetic. Demo access checks the email domain; it does **not** yet prove inbox ownership. Email OTP is a pre-pilot requirement.

Payments are also intentionally not live. Students agree a price in the product and settle directly after the task; CampusBuddy does not hold funds or deduct a platform fee in the demo.

## Repository layout

```text
campusbuddy/
├── frontend/   Next.js 14 app, UI, authenticated API routes and Vercel seed
├── backend/    NestJS modules plus the shared Prisma schema and migrations
├── shared/     Shared money and validation utilities
├── docs/       Product, architecture, safety and venture decisions
└── HANDOFF.md  Current implementation context
```

The deployed application currently runs through the Next.js route handlers in `frontend/app/api/v1`. The NestJS application remains a parallel backend scaffold rather than the deployed request path.

## Local development

Requirements: Node.js 20+, npm and PostgreSQL.

```bash
npm install
cp frontend/.env.example frontend/.env.local
npx prisma migrate dev --schema backend/prisma/schema.prisma
SEED_DEMO=1 node frontend/scripts/seed.mjs
npm run dev
```

Set `DATABASE_URL` and a strong `AUTH_SECRET` in `frontend/.env.local`. Leave `RESEND_API_KEY` unset for local demo mode; configure it before real email-code sign-in.

Useful checks:

```bash
npm run build
npm test
```

## Product status

NTU is the intended first pilot. Other Singapore university domains are configured for product exploration, but they are not claims of active campus launches. Before a real pilot, the highest-priority work is email OTP, policy and liability review, matric/identity verification, and a deliberate payments decision.

See `docs/17-decisions-log.md` for the latest product decisions and `docs/16-risks-and-redesign.md` for the safety and regulatory review.

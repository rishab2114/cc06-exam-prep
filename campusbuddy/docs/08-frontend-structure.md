# 08 — Frontend Folder Structure (Next.js App Router)

Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui. Mobile-first PWA. Server Components for data fetching where possible; client components for interactive flows (forms, chat, Stripe Elements). Auth.js for sessions.

```
frontend/
├── app/
│   ├── layout.tsx                 # root layout, providers, theme
│   ├── globals.css
│   ├── page.tsx                   # marketing / landing + auth CTA
│   ├── manifest.ts                # PWA manifest
│   ├── sw.ts                      # service worker (push + offline shell)
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── verify/page.tsx        # magic-link / OTP landing
│   │   └── onboarding/
│   │       ├── profile/page.tsx
│   │       ├── student-id/page.tsx
│   │       └── provider/page.tsx  # agreement + Stripe Connect kickoff
│   │
│   ├── (app)/                     # authenticated shell (bottom nav)
│   │   ├── layout.tsx             # requires session; bottom nav
│   │   ├── page.tsx               # /app home (customer marketplace)
│   │   ├── find/page.tsx          # provider task feed
│   │   ├── tasks/
│   │   │   ├── page.tsx           # my tasks (tabs: as customer / provider)
│   │   │   ├── new/
│   │   │   │   ├── page.tsx       # create task form
│   │   │   │   └── pay/page.tsx   # Stripe Elements authorize hold
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # task detail (state-aware)
│   │   │       ├── applicants/page.tsx
│   │   │       └── chat/page.tsx
│   │   ├── wallet/page.tsx        # provider earnings + payouts
│   │   ├── notifications/page.tsx
│   │   └── profile/
│   │       ├── page.tsx           # my profile + settings
│   │       └── [id]/page.tsx      # public profile
│   │
│   ├── admin/                     # desktop admin (role-gated)
│   │   ├── layout.tsx             # sidebar
│   │   ├── page.tsx               # dashboard / metrics
│   │   ├── verifications/page.tsx
│   │   ├── disputes/page.tsx
│   │   ├── users/page.tsx
│   │   └── safety/page.tsx
│   │
│   └── api/
│       └── auth/[...nextauth]/route.ts   # Auth.js handler (NTU domain gate)
│
├── components/
│   ├── ui/                        # shadcn primitives (button, card, dialog…)
│   ├── task/                      # TaskCard, StatusBadge, ApplicantCard
│   ├── payment/                   # StripeHoldForm, FeeBreakdown
│   ├── safety/                    # SosButton, CheckInButton, ShareTask
│   ├── chat/                      # MessageList, Composer
│   ├── nav/                       # BottomNav, AdminSidebar, TopBar
│   └── verification/              # BadgeRow, IdUpload
│
├── lib/
│   ├── api-client.ts              # typed fetch wrapper (cookies, errors)
│   ├── auth.ts                    # Auth.js config (NTU domain allowlist)
│   ├── stripe.ts                  # loadStripe, Elements helpers
│   ├── hooks/                     # useSession, useTask, useNotifications
│   ├── push.ts                    # Web Push subscribe
│   └── format.ts                  # money (cents→SGD), dates
│
├── public/                        # icons, PWA assets
├── types/                         # shared API types (or generated from backend)
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## Conventions
- **Route groups:** `(auth)` unauthenticated, `(app)` authenticated mobile shell, `admin` desktop role-gated.
- **Data fetching:** RSC + `api-client` server-side where possible; SWR/React Query for interactive client lists (feed, chat, notifications).
- **Stripe:** `@stripe/react-stripe-js` Elements only in client components on the `/pay` route.
- **PWA:** `manifest.ts` + service worker for installability and Web Push; "Add to Home Screen" prompt after first completed task.
- **Auth gate:** `(app)/layout.tsx` and `admin/layout.tsx` check session/role server-side and redirect.
- **Type safety:** generate TS types from the backend OpenAPI/Prisma, or share a `packages/types` workspace if converting to a monorepo.

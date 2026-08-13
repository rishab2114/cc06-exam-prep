# 07 — Backend Folder Structure (NestJS)

Modular monolith: clear module boundaries now, extractable to services later. Domain logic lives in services; controllers are thin; Prisma is the data layer; cross-cutting concerns are guards/interceptors/pipes.

```
backend/
├── src/
│   ├── main.ts                      # bootstrap, helmet, cors, validation pipe
│   ├── app.module.ts                # root module wiring
│   ├── config/
│   │   ├── configuration.ts         # typed env config
│   │   └── env.validation.ts        # zod/joi validation of env
│   │
│   ├── common/                      # cross-cutting
│   │   ├── guards/                  # AuthGuard, RolesGuard, OwnershipGuard
│   │   ├── decorators/              # @CurrentUser, @Roles, @Idempotent
│   │   ├── interceptors/            # logging, transform, timeout
│   │   ├── filters/                 # http-exception filter (RFC7807)
│   │   ├── pipes/                   # validation
│   │   └── utils/                   # money.ts (cents/fee math), cursor.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts        # PrismaClient lifecycle
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts       # /auth/me, session validation
│   │   ├── auth.service.ts          # NTU-domain allowlist, session verify
│   │   └── ntu-domain.ts            # allowlist logic
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts         # profile, provider opt-in, aggregates
│   │   └── dto/
│   │
│   ├── verification/
│   │   ├── verification.module.ts
│   │   ├── verification.controller.ts
│   │   └── verification.service.ts  # S3 presign, status, admin decisions
│   │
│   ├── catalog/
│   │   ├── catalog.module.ts
│   │   ├── catalog.controller.ts
│   │   └── catalog.service.ts       # categories + risk tiers + seed
│   │
│   ├── tasks/
│   │   ├── tasks.module.ts
│   │   ├── tasks.controller.ts
│   │   ├── tasks.service.ts         # CRUD + feed
│   │   ├── task-state.machine.ts    # allowed transitions + guards
│   │   ├── applications.service.ts  # apply/select
│   │   └── dto/
│   │
│   ├── payments/
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts      # PaymentIntent create/capture/release
│   │   ├── ledger.service.ts        # immutable ledger writes
│   │   ├── connect.service.ts       # Stripe Connect onboarding/status
│   │   └── stripe.client.ts
│   │
│   ├── webhooks/
│   │   ├── webhooks.module.ts
│   │   └── stripe-webhook.controller.ts  # raw-body, signature verify
│   │
│   ├── reviews/
│   │   ├── reviews.module.ts
│   │   ├── reviews.controller.ts
│   │   └── reviews.service.ts       # double-blind publish logic
│   │
│   ├── messaging/
│   │   ├── messaging.module.ts
│   │   ├── messaging.controller.ts
│   │   └── messaging.service.ts
│   │
│   ├── safety/
│   │   ├── safety.module.ts
│   │   ├── safety.controller.ts     # check-in/out, SOS, share, report, block
│   │   └── safety.service.ts
│   │
│   ├── disputes/
│   │   ├── disputes.module.ts
│   │   ├── disputes.controller.ts
│   │   └── disputes.service.ts
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts # create + fan-out
│   │   ├── channels/
│   │   │   ├── email.channel.ts     # Resend/Postmark
│   │   │   └── push.channel.ts      # Web Push (VAPID)
│   │   └── templates/
│   │
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts
│   │   └── metrics.service.ts       # liquidity, GMV, take, fill-rate
│   │
│   └── jobs/                        # BullMQ
│       ├── jobs.module.ts
│       ├── queues.ts
│       └── processors/
│           ├── notification.processor.ts
│           ├── auto-confirm.processor.ts      # release after 48h
│           ├── review-publish.processor.ts    # 7-day double-blind timeout
│           ├── rebroadcast.processor.ts       # unfilled tasks
│           └── reconcile.processor.ts         # nightly Stripe reconciliation
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                      # categories, demo users
│   └── migrations/
├── test/                           # e2e (supertest)
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Key patterns
- **Service layer owns invariants** (fee math, state transitions). Controllers never touch Prisma directly.
- **`task-state.machine.ts`** is the single place that defines allowed `from→to` edges and the side-effects (capture/release/notify) per edge.
- **`ledger.service.ts`** is append-only; balances are SUM queries (cached).
- **Webhook controller uses raw body** (configure body parser exception) for Stripe signature verification.
- **Outbox table + `jobs/`** decouple state changes from external side-effects (idempotent, retryable).
- **Guards compose:** `AuthGuard` → `RolesGuard` → resource `OwnershipGuard`/policy.

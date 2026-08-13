# 06 — API Architecture

REST + JSON over HTTPS. Backend is **NestJS**. Auth via Auth.js-issued session (http-only cookie) verified by a backend guard; service-to-service and webhooks via signed secrets. Base path `/api/v1`.

## Conventions
- **Auth:** session cookie → `AuthGuard`; role checks via `@Roles()` + `RolesGuard`; resource ownership via policy guards.
- **Errors:** RFC 7807-ish `{ error: { code, message, details } }`, proper HTTP status.
- **IDs:** UUID. **Money:** integer cents, `currency: "sgd"`.
- **Idempotency:** mutating money endpoints accept `Idempotency-Key` header.
- **Pagination:** cursor-based `?cursor=&limit=`; responses `{ data, nextCursor }`.
- **Validation:** `class-validator` DTOs; reject unknown fields.
- **Rate limiting:** per-IP + per-user (Redis); stricter on auth & payment routes.

## Resource map

### Auth & session
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/signup` | Start signup with NTU email (domain-gated) → magic link |
| POST | `/auth/callback` | Verify magic link / OTP → session |
| POST | `/auth/login` | Request login link |
| POST | `/auth/logout` | Destroy session |
| GET  | `/auth/me` | Current user + verification + capabilities |

> Auth.js handles most of this on the Next.js side; backend exposes `/auth/me` and validates the session token. The NTU-domain allowlist is enforced in the `signIn` callback.

### Users & profiles
| Method | Path | Purpose |
|---|---|---|
| GET | `/users/:id` | Public profile (rating, jobs, badges, reviews) |
| PATCH | `/users/me` | Update own profile (name, hall, school, year, photo) |
| POST | `/users/me/photo` | Presigned S3 upload URL for avatar |
| POST | `/users/me/provider` | Opt into provider mode (accept agreement, categories) |
| PATCH | `/users/me/provider` | Update availability/categories |

### Verification
| Method | Path | Purpose |
|---|---|---|
| POST | `/verifications/student-id` | Get presigned upload URL + create PENDING record |
| GET | `/verifications/me` | My verification statuses |
| (admin) GET | `/admin/verifications?status=PENDING` | Queue |
| (admin) POST | `/admin/verifications/:id/decision` | approve/reject |

### Catalog
| Method | Path | Purpose |
|---|---|---|
| GET | `/categories` | List active categories (grouped, with risk tier + price hints) |

### Tasks / bookings
| Method | Path | Purpose |
|---|---|---|
| POST | `/tasks` | Create task (DRAFT/OPEN) — returns task + payment intent client secret |
| GET | `/tasks/:id` | Task detail (party-scoped) |
| GET | `/tasks/mine?role=customer\|provider&status=` | My tasks |
| GET | `/tasks/feed` | Provider feed: OPEN tasks matching my categories/zone/eligibility |
| PATCH | `/tasks/:id` | Edit (only DRAFT/OPEN, customer only) |
| POST | `/tasks/:id/cancel` | Cancel (policy-checked) |
| POST | `/tasks/:id/applications` | Provider applies (message, quote) |
| GET | `/tasks/:id/applications` | Customer views applicants |
| POST | `/tasks/:id/assign` | Customer selects provider → captures payment → ASSIGNED |
| POST | `/tasks/:id/start` | Provider → IN_PROGRESS (requires check-in if T2/T3) |
| POST | `/tasks/:id/complete` | Provider → COMPLETED (+ proof) |
| POST | `/tasks/:id/confirm` | Customer confirms → release funds → CLOSED |

### Messaging
| Method | Path | Purpose |
|---|---|---|
| GET | `/tasks/:id/messages` | Thread (party-scoped) |
| POST | `/tasks/:id/messages` | Send message |

### Reviews
| Method | Path | Purpose |
|---|---|---|
| POST | `/tasks/:id/reviews` | Submit rating (1–5 + comment) |
| GET | `/users/:id/reviews` | Published reviews for a user |

### Payments & wallet
| Method | Path | Purpose |
|---|---|---|
| GET | `/payments/:taskId` | Payment status for a task |
| POST | `/payments/:taskId/refund` | (admin/dispute) refund |
| GET | `/wallet/me` | Provider balance + ledger history |
| POST | `/connect/onboarding-link` | Create Stripe Connect onboarding/return link |
| GET | `/connect/status` | charges/payouts enabled flags |

### Safety
| Method | Path | Purpose |
|---|---|---|
| POST | `/tasks/:id/safety/check-in` | Geo + timestamp |
| POST | `/tasks/:id/safety/check-out` | |
| POST | `/tasks/:id/safety/sos` | Trigger SOS (notifies admin) |
| POST | `/tasks/:id/safety/share` | Create live-share token |
| POST | `/reports` | Report a user/task |
| POST | `/blocks` | Block a user |

### Disputes
| Method | Path | Purpose |
|---|---|---|
| POST | `/tasks/:id/disputes` | Raise dispute |
| (admin) GET | `/admin/disputes` | Queue |
| (admin) POST | `/admin/disputes/:id/resolve` | refund/release/split |

### Notifications
| Method | Path | Purpose |
|---|---|---|
| GET | `/notifications` | List (paginated) |
| POST | `/notifications/read` | Mark read |
| POST | `/push/subscribe` | Register Web Push subscription |
| PATCH | `/me/notification-prefs` | Channel prefs |

### Webhooks (no session; signature-verified)
| Method | Path | Purpose |
|---|---|---|
| POST | `/webhooks/stripe` | PaymentIntent, transfer, account.updated, payout events |

### Admin & analytics
`/admin/users`, `/admin/users/:id/suspend`, `/admin/safety-events`, `/admin/metrics` (liquidity, fill rate, GMV, take).

## Cross-cutting architecture
```
                ┌────────────┐      ┌──────────────┐
Browser (PWA) → │ Next.js     │ ───► │  NestJS API   │ ──► PostgreSQL (Prisma)
  Auth.js cookie│ (Vercel)    │ REST │  (Railway)    │ ──► Redis (BullMQ jobs, cache, rate-limit)
                └─────┬──────┘      └──────┬───────┘ ──► S3 (private, presigned)
                      │                    │
                      │ webhooks           ├─► Stripe (PaymentIntents, Connect, payouts)
                      ▼                    ├─► Email (Resend/Postmark)
                  Web Push                 └─► Web Push (VAPID) / FCM
```
- **Workers (BullMQ):** notification fan-out, payout retries, review-publish timeout, dispute SLA reminders, task auto-confirm after 48h, re-broadcast unfilled tasks.
- **Outbox pattern** for reliable side-effects: state changes write domain events to an outbox table; a worker dispatches notifications/Stripe calls, ensuring at-least-once delivery + idempotency.
- **Webhooks are the source of truth for money state** — never mark a payment CAPTURED from the request path alone; reconcile via Stripe webhook + nightly reconciliation job.

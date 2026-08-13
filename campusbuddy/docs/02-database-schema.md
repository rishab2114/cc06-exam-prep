# 02 — Database Schema (PostgreSQL)

The canonical source of truth is `backend/prisma/schema.prisma`. This document explains the model and gives the equivalent SQL DDL plus design rationale. All money is stored as **integer minor units (SGD cents)** to avoid float errors.

## Design principles
1. **Single `User`** that can act as customer and/or provider (role via `UserRole` + a `ProviderProfile` extension when they opt in).
2. **Money is immutable & ledgered.** Every movement is a `LedgerEntry`; balances are derived, never overwritten.
3. **State machines are explicit** with status enums + a `TaskEvent` audit trail.
4. **Verification & payments are separate concerns** so a user can be ID-verified but not yet payout-enabled.
5. **Soft deletes** (`deleted_at`) for user-facing entities; hard delete only via PDPA erasure workflow.

## Enums
```sql
CREATE TYPE user_role        AS ENUM ('CUSTOMER','PROVIDER','ADMIN');         -- capability flags, not exclusive
CREATE TYPE verification_kind AS ENUM ('EMAIL','STUDENT_ID','HALL','PAYOUTS');
CREATE TYPE verification_status AS ENUM ('PENDING','VERIFIED','REJECTED','EXPIRED');
CREATE TYPE task_status       AS ENUM ('DRAFT','OPEN','ASSIGNED','IN_PROGRESS','COMPLETED','CLOSED','CANCELLED','DISPUTED');
CREATE TYPE application_status AS ENUM ('APPLIED','WITHDRAWN','SELECTED','REJECTED');
CREATE TYPE payment_status    AS ENUM ('REQUIRES_AUTH','AUTHORIZED','CAPTURED','RELEASED','REFUNDED','PARTIALLY_REFUNDED','FAILED');
CREATE TYPE payout_status     AS ENUM ('PENDING','PAID','FAILED','REVERSED');
CREATE TYPE ledger_type       AS ENUM ('CHARGE','PLATFORM_FEE','PROVIDER_EARNING','REFUND','PAYOUT','ADJUSTMENT');
CREATE TYPE risk_tier         AS ENUM ('T1','T2','T3');
CREATE TYPE dispute_status    AS ENUM ('OPEN','UNDER_REVIEW','RESOLVED_REFUND','RESOLVED_RELEASE','RESOLVED_SPLIT','REJECTED');
CREATE TYPE notification_channel AS ENUM ('PUSH','EMAIL');
```

## Core tables (DDL)

```sql
-- ---------- Users & identity ----------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT UNIQUE NOT NULL,                 -- must match NTU allowlist
  email_verified_at TIMESTAMPTZ,
  full_name       TEXT NOT NULL,
  photo_url       TEXT,
  hall            TEXT,                                   -- e.g. 'Hall 9'
  school          TEXT,                                   -- faculty/school
  year_of_study   SMALLINT,
  phone           TEXT,                                   -- verified separately for safety contact
  roles           user_role[] NOT NULL DEFAULT '{CUSTOMER}',
  is_suspended    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Provider extension (only when a user opts into earning)
CREATE TABLE provider_profiles (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio                 TEXT,
  categories_offered  TEXT[] NOT NULL DEFAULT '{}',       -- category slugs
  is_available        BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_account_id   TEXT,                               -- Connect Express acct
  payouts_enabled     BOOLEAN NOT NULL DEFAULT FALSE,     -- mirrors Stripe charges/payouts_enabled
  work_eligibility_ack BOOLEAN NOT NULL DEFAULT FALSE,    -- self-declared (see docs/16)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verifications (one row per kind per user; latest wins)
CREATE TABLE verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        verification_kind NOT NULL,
  status      verification_status NOT NULL DEFAULT 'PENDING',
  evidence_key TEXT,                                      -- private S3 object key (ID image)
  reviewed_by UUID REFERENCES users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (user_id, kind)
);

-- ---------- Catalog ----------
CREATE TABLE service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,        -- 'room-cleaning'
  group_name  TEXT NOT NULL,               -- 'Hall services'
  name        TEXT NOT NULL,
  description TEXT,
  risk_tier   risk_tier NOT NULL DEFAULT 'T1',
  suggested_min_price INT,                 -- cents
  suggested_max_price INT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ---------- Tasks / bookings ----------
CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES users(id),
  provider_id   UUID REFERENCES users(id),               -- set when ASSIGNED
  category_id   UUID NOT NULL REFERENCES service_categories(id),
  title         TEXT NOT NULL,
  description   TEXT,
  status        task_status NOT NULL DEFAULT 'OPEN',
  hall          TEXT,                                     -- location zone
  location_note TEXT,                                     -- block/room/meeting point
  geo           GEOGRAPHY(POINT,4326),                    -- optional PostGIS point
  budget_cents  INT NOT NULL,                             -- customer's offered budget
  final_price_cents INT,                                  -- agreed price (== budget at MVP)
  window_start  TIMESTAMPTZ,
  window_end    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at   TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  closed_at     TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  cancel_reason TEXT
);
CREATE INDEX idx_tasks_status_hall ON tasks(status, hall);
CREATE INDEX idx_tasks_category    ON tasks(category_id);
CREATE INDEX idx_tasks_customer    ON tasks(customer_id);
CREATE INDEX idx_tasks_provider    ON tasks(provider_id);

-- Applications (provider applies; customer selects)
CREATE TABLE applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id),
  message     TEXT,
  quote_cents INT,                                        -- provider may counter-offer
  status      application_status NOT NULL DEFAULT 'APPLIED',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, provider_id)
);

-- Append-only audit of task state transitions
CREATE TABLE task_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES users(id),
  from_status task_status,
  to_status   task_status,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Payments & ledger ----------
CREATE TABLE payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id            UUID NOT NULL UNIQUE REFERENCES tasks(id),
  customer_id        UUID NOT NULL REFERENCES users(id),
  amount_cents       INT NOT NULL,                        -- total charged to customer
  platform_fee_cents INT NOT NULL,                        -- 15%
  provider_amount_cents INT NOT NULL,                     -- amount - fee
  currency           TEXT NOT NULL DEFAULT 'sgd',
  status             payment_status NOT NULL DEFAULT 'REQUIRES_AUTH',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_transfer_id TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable double-entry-ish ledger (one row per money event)
CREATE TABLE ledger_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID REFERENCES payments(id),
  user_id     UUID REFERENCES users(id),                  -- whose balance is affected (provider/platform)
  type        ledger_type NOT NULL,
  amount_cents INT NOT NULL,                              -- signed
  currency    TEXT NOT NULL DEFAULT 'sgd',
  stripe_ref  TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payouts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id),
  amount_cents INT NOT NULL,
  status      payout_status NOT NULL DEFAULT 'PENDING',
  stripe_payout_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at     TIMESTAMPTZ
);

-- ---------- Reviews ----------
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id),
  rater_id    UUID NOT NULL REFERENCES users(id),
  ratee_id    UUID NOT NULL REFERENCES users(id),
  stars       SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,            -- double-blind gate
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, rater_id)
);

-- ---------- Trust & safety ----------
CREATE TABLE disputes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id),
  raised_by   UUID NOT NULL REFERENCES users(id),
  reason      TEXT NOT NULL,
  status      dispute_status NOT NULL DEFAULT 'OPEN',
  resolution_note TEXT,
  resolved_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE safety_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES tasks(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  kind        TEXT NOT NULL,                  -- 'CHECK_IN','CHECK_OUT','SOS','REPORT','SHARE_LINK'
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_blocks (
  blocker_id  UUID NOT NULL REFERENCES users(id),
  blocked_id  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ---------- Messaging (scoped to a task) ----------
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at     TIMESTAMPTZ
);
CREATE INDEX idx_messages_task ON messages(task_id, created_at);

-- ---------- Notifications ----------
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                  -- 'BOOKING_ACCEPTED', etc.
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  keys        JSONB NOT NULL,                 -- p256dh + auth
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

-- ---------- Auth (Auth.js adapter tables, abbreviated) ----------
-- accounts, sessions, verification_tokens  (per @auth/prisma-adapter)
```

## Derived values
- **Profile rating** = `AVG(stars)` over published `reviews WHERE ratee_id = user`.
- **Completed jobs** = `COUNT(tasks WHERE provider_id = user AND status IN ('COMPLETED','CLOSED'))`.
- **Earnings (provider)** = `SUM(ledger_entries.amount WHERE user_id=user AND type='PROVIDER_EARNING')`; available balance subtracts `PAYOUT`s.
These are computed on read (cached in Redis) — never stored mutably — so they can't drift.

## Integrity rules enforced in app layer
- A task can only transition along the allowed state-machine edges; every transition writes `task_events`.
- `payments.platform_fee_cents = round(amount_cents * 0.15)`, `provider_amount_cents = amount - fee`.
- A user cannot review a task they weren't party to; reviews publish on both-submitted or 7-day timeout.
- A provider can only be assigned if `payouts_enabled = TRUE` and verifications (EMAIL, STUDENT_ID) are VERIFIED; for T2/T3 categories both parties must be ID-verified.

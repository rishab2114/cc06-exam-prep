# 03 — ER Diagram

Rendered with Mermaid (GitHub renders this natively).

```mermaid
erDiagram
    USERS ||--o| PROVIDER_PROFILES : "opts into"
    USERS ||--o{ VERIFICATIONS : "submits"
    USERS ||--o{ TASKS : "creates (customer)"
    USERS ||--o{ TASKS : "fulfils (provider)"
    USERS ||--o{ APPLICATIONS : "applies"
    USERS ||--o{ REVIEWS : "writes (rater)"
    USERS ||--o{ REVIEWS : "receives (ratee)"
    USERS ||--o{ PAYOUTS : "receives"
    USERS ||--o{ NOTIFICATIONS : "gets"
    USERS ||--o{ PUSH_SUBSCRIPTIONS : "registers"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ DISPUTES : "raises"
    USERS ||--o{ SAFETY_EVENTS : "triggers"
    USERS ||--o{ USER_BLOCKS : "blocks"

    SERVICE_CATEGORIES ||--o{ TASKS : "categorizes"

    TASKS ||--o{ APPLICATIONS : "receives"
    TASKS ||--o{ TASK_EVENTS : "audited by"
    TASKS ||--|| PAYMENTS : "paid via"
    TASKS ||--o{ REVIEWS : "rated in"
    TASKS ||--o{ MESSAGES : "scoped to"
    TASKS ||--o{ DISPUTES : "may have"
    TASKS ||--o{ SAFETY_EVENTS : "may have"

    PAYMENTS ||--o{ LEDGER_ENTRIES : "produces"
    PAYMENTS }o--o| PAYOUTS : "settles into"

    USERS {
      uuid id PK
      citext email UK
      timestamptz email_verified_at
      text full_name
      text hall
      text school
      smallint year_of_study
      user_role_array roles
      bool is_suspended
    }
    PROVIDER_PROFILES {
      uuid user_id PK_FK
      text_array categories_offered
      bool is_available
      text stripe_account_id
      bool payouts_enabled
      bool work_eligibility_ack
    }
    VERIFICATIONS {
      uuid id PK
      uuid user_id FK
      verification_kind kind
      verification_status status
      text evidence_key
    }
    SERVICE_CATEGORIES {
      uuid id PK
      text slug UK
      text group_name
      risk_tier risk_tier
    }
    TASKS {
      uuid id PK
      uuid customer_id FK
      uuid provider_id FK
      uuid category_id FK
      task_status status
      int budget_cents
      int final_price_cents
      timestamptz window_start
      timestamptz window_end
    }
    APPLICATIONS {
      uuid id PK
      uuid task_id FK
      uuid provider_id FK
      application_status status
      int quote_cents
    }
    PAYMENTS {
      uuid id PK
      uuid task_id FK_UK
      int amount_cents
      int platform_fee_cents
      int provider_amount_cents
      payment_status status
      text stripe_payment_intent_id
    }
    LEDGER_ENTRIES {
      uuid id PK
      uuid payment_id FK
      uuid user_id FK
      ledger_type type
      int amount_cents
    }
    PAYOUTS {
      uuid id PK
      uuid provider_id FK
      int amount_cents
      payout_status status
    }
    REVIEWS {
      uuid id PK
      uuid task_id FK
      uuid rater_id FK
      uuid ratee_id FK
      smallint stars
      bool is_published
    }
    DISPUTES {
      uuid id PK
      uuid task_id FK
      dispute_status status
    }
    SAFETY_EVENTS {
      uuid id PK
      uuid task_id FK
      uuid user_id FK
      text kind
    }
    MESSAGES {
      uuid id PK
      uuid task_id FK
      uuid sender_id FK
      text body
    }
    NOTIFICATIONS {
      uuid id PK
      uuid user_id FK
      text type
    }
    TASK_EVENTS {
      uuid id PK
      uuid task_id FK
      task_status from_status
      task_status to_status
    }
```

## Cardinality notes
- **User ↔ ProviderProfile:** 1:0..1 (only earners have one).
- **User ↔ Task:** 1:N as customer, 1:N as provider (two distinct FKs).
- **Task ↔ Payment:** 1:1 (a task has exactly one payment record once authorized).
- **Payment ↔ LedgerEntry:** 1:N (charge, fee, earning, refund, payout each one row).
- **Task ↔ Review:** 1:0..2 (each party reviews once).

# 11 — Security & Privacy Architecture

Threat model spans account security, money fraud, data privacy (PDPA), and physical safety (unique to this product — covered more in docs/16).

## Identity & access
- **NTU-domain gate:** registration restricted to allowlisted NTU domains; enforced in Auth.js `signIn` callback AND re-validated server-side (never trust the client).
- **Passwordless / OTP-first** to reduce credential stuffing; optional password with Argon2id hashing if used.
- **Sessions:** http-only, `Secure`, `SameSite=Lax` cookies; short-lived access + rotating refresh; device/session list with revoke.
- **Authorization:** RBAC (`CUSTOMER/PROVIDER/ADMIN`) + per-resource ownership policies (a user only sees tasks/chat they're party to). Admin actions audit-logged.
- **MFA** for admin accounts (TOTP) — mandatory.

## API & app hardening
- TLS everywhere; HSTS. `helmet` security headers; strict CSP.
- Input validation on every DTO (`class-validator`), reject unknown fields, size limits.
- **Rate limiting** (Redis): global per-IP + per-user; aggressive on `/auth/*`, `/payments/*`, upload presign, messaging.
- CSRF protection for cookie-based mutations (double-submit / SameSite + token).
- Output encoding + React's default escaping to prevent XSS; sanitize free-text (messages, reviews).
- Parameterized queries via Prisma (no raw string SQL); least-privilege DB user.
- Idempotency keys on money mutations; optimistic locking on task state transitions.

## Payments security
- **PCI:** card data never touches our servers — Stripe Elements tokenizes client-side (SAQ-A scope).
- Webhook signature verification (raw body); replay protection via stored `event.id`.
- Money state changes only via webhook + reconciliation; app path is request-to-authorize only.
- Fraud signals: velocity limits, new-account spend caps, mismatch between hold and capture, dispute-rate monitoring.

## Data protection (PDPA, Singapore)
- **Data minimization:** collect only what's needed; matric card used for verification then access-restricted.
- **ID images:** private S3 bucket, SSE (KMS) encryption at rest, **no public URLs** — only short-lived signed URLs; every access logged with viewer id; watermarked in admin viewer. Consider deleting raw image after verification, keeping only a verified flag + hash.
- **PII at rest:** DB encryption at rest; column-level encryption for phone; secrets in a manager (Doppler/Vault/Railway secrets), never in repo.
- **Consent & purpose:** explicit consent at signup; privacy policy; purpose limitation.
- **Subject rights:** access/correction/erasure workflow (`deleted_at` soft-delete + scheduled hard-erase respecting financial-record retention).
- **Retention:** financial/ledger records retained per IRAS/accounting requirements; chat/PII pruned on schedule.
- **Breach response:** PDPC notification process documented; 3-day assessment / notify if significant harm.

## Infrastructure & supply chain
- Secrets via env/secret manager; rotate Stripe + DB creds; separate test/live keys.
- Dependency scanning (Dependabot/Renovate), `npm audit` in CI, lockfiles committed.
- Principle of least privilege for cloud IAM (S3 bucket policy scoped to app role).
- Backups: automated Postgres backups + PITR; periodic restore drills.
- Observability: Sentry (errors), structured logs (no PII/secrets in logs), audit log table for security-relevant events.

## Physical/relational safety (product-level — see docs/16)
- Both-sides ID verification required for room-entry (T2) tasks.
- Check-in/out with geo + timestamp for in-person tasks; SOS; live-share link.
- Block/report; rapid suspension; safety incident runbook + campus security escalation.
- Category gating: high-risk (airport, cooking) disabled until controls exist.

## Security checklist for launch
- [ ] Pen-test / external review of auth + payments before public launch.
- [ ] Webhook signature + idempotency verified.
- [ ] S3 bucket private; no public objects; signed-URL TTL ≤ 5 min.
- [ ] Admin MFA enforced; audit logging on.
- [ ] Rate limits + WAF on auth/payment routes.
- [ ] PDPA notice, consent, and erasure workflow live.
- [ ] Incident response + on-call rota defined.

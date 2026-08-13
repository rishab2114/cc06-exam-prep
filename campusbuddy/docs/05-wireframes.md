# 05 — Wireframes (low-fidelity)

Mobile-first (375px). ASCII mockups + intent notes. Build with Tailwind + shadcn/ui. These map 1:1 to routes in `08-frontend-structure.md`.

## 1. Landing / Auth (`/`)
```
┌─────────────────────────────┐
│  CampusBuddy NTU        ☰   │
│                             │
│  Campus chores, done by     │
│  fellow NTU students.       │
│                             │
│  [ Join with NTU email  ]   │
│  [ I already have account ] │
│                             │
│  ✓ Verified students only   │
│  ✓ Secure escrow payments   │
│  ✓ Rated both ways          │
└─────────────────────────────┘
```
Notes: single CTA; trust badges above the fold; email field validates `@*.ntu.edu.sg` inline.

## 2. Home / Marketplace — Customer (`/app`)
```
┌─────────────────────────────┐
│ Hi Priya 👋      🔔  ⚙  👤 │
│ [ 🔎 Search services...   ] │
│                             │
│  Quick post:                │
│  [🧹Clean][🧺Laundry]       │
│  [🛒Grocery][📦Parcel]      │
│                             │
│  Your active tasks          │
│  ┌─────────────────────┐    │
│  │ Room clean • OPEN    │    │
│  │ 3 applicants ›       │    │
│  └─────────────────────┘    │
│                             │
│ [ + New task ]  (FAB)       │
│─────────────────────────────│
│ 🏠Home  🧾Tasks  💬  💰  👤 │
└─────────────────────────────┘
```

## 3. Create task (`/app/tasks/new`)
```
┌─────────────────────────────┐
│ ‹ New task                  │
│ Category:  [ Room cleaning ▾]│
│ What do you need?           │
│ [ textarea ................ ]│
│ Where:  [ Hall 9, Blk... ▾ ]│
│ When:   [ Today ▾][ 6–8pm ▾]│
│ Budget: SGD [ 20 ]          │
│   You pay 20 · Buddy gets 17│
│                             │
│ [ Continue to payment ]     │
└─────────────────────────────┘
```
Notes: live fee breakdown (15%); budget shows suggested range from category.

## 4. Payment authorize (`/app/tasks/new/pay`)
```
┌─────────────────────────────┐
│ ‹ Confirm & hold payment    │
│ Room cleaning · Hall 9      │
│ Today 6–8pm                 │
│ ───────────────────────     │
│ Amount            SGD 20.00 │
│ Held now, released on done  │
│ ───────────────────────     │
│ [ Stripe card element     ] │
│ [ Authorize SGD 20 hold ]   │
│ 🔒 Funds held in escrow     │
└─────────────────────────────┘
```

## 5. Task detail + applicants — Customer (`/app/tasks/:id`)
```
┌─────────────────────────────┐
│ ‹ Room cleaning   OPEN      │
│ Hall 9 · Today 6–8pm · $20  │
│                             │
│ Applicants (3)              │
│ ┌─────────────────────┐     │
│ │ 👤 Wei  ⭐4.9 (32)   │     │
│ │ "Can do 6:30, done   │     │
│ │  20 cleans before"   │     │
│ │ [ Select Wei ]       │     │
│ └─────────────────────┘     │
│ ...                         │
└─────────────────────────────┘
```

## 6. Provider task feed (`/app/find`)
```
┌─────────────────────────────┐
│ Available  ●  [Filters ▾]   │
│ Categories: Laundry, Parcel │
│ Zone: Halls 8–11            │
│ ┌─────────────────────┐     │
│ │ 📦 Parcel pickup     │     │
│ │ Hall 10 · now · $6   │     │
│ │ 0.3km · ⭐ cust 4.8  │     │
│ │ [ Apply ]            │     │
│ └─────────────────────┘     │
│ ...                         │
└─────────────────────────────┘
```

## 7. Active task (assigned) — chat + status (`/app/tasks/:id` assigned)
```
┌─────────────────────────────┐
│ ‹ Parcel pickup  ASSIGNED   │
│ with Wei ⭐4.9   [ Share ↗ ]│
│ [Check in] [SOS]  (T2/T3)   │
│ ─── chat ───                │
│  Wei: omw, 5 min            │
│  You: thanks!               │
│ [ type a message…    send ] │
│ ───────────────             │
│ [ Mark complete ] (provider)│
└─────────────────────────────┘
```

## 8. Profile (`/app/profile/:id`)
```
┌─────────────────────────────┐
│ 👤 Wei Tan                  │
│ ⭐ 4.9 · 32 jobs · Hall 10  │
│ Badges: ✉✓ 🪪✓ 🏠✓ 💳✓     │
│ Offers: Laundry, Parcel,    │
│         Grocery             │
│ ── Reviews ──               │
│ ⭐5 "Fast and friendly"     │
│ ⭐5 "Folded perfectly"      │
└─────────────────────────────┘
```

## 9. Wallet / Earnings — Provider (`/app/wallet`)
```
┌─────────────────────────────┐
│ Earnings                    │
│ Available   SGD 84.00       │
│ This month  SGD 210.00      │
│ [ Manage payouts (Stripe) ] │
│ ── History ──               │
│ +$17 Room clean   Jun 18    │
│ +$5  Parcel       Jun 17    │
│ −$84 Payout       Jun 15    │
└─────────────────────────────┘
```

## 10. Ratings prompt (post-complete)
```
┌─────────────────────────────┐
│ How was Wei?                │
│ ⭐⭐⭐⭐⭐                    │
│ [ Add a comment (optional) ]│
│ [ Submit ]                  │
└─────────────────────────────┘
```

## 11. Admin (desktop, `/admin`) — see docs/09
```
┌──────────────────────────────────────────────┐
│ CampusBuddy Admin     [Verif][Disputes][Users]│
│ Verification queue (12)                        │
│ ┌────────────┬──────────┬───────┬───────────┐ │
│ │ Student    │ Matric img│ Email │ Action    │ │
│ │ Priya K.   │ [view]    │ ✓     │ ✓ / ✗     │ │
│ └────────────┴──────────┴───────┴───────────┘ │
└──────────────────────────────────────────────┘
```

Design tokens: primary `#1F6FEB` (NTU-ish blue), success `#1A7F37`, warning `#9A6700`, radius `12px`, font Inter. Bottom-nav on mobile; sidebar on admin desktop.

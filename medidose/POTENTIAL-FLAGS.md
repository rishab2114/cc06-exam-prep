# Potential flags

Open concerns on the MediDose concept, raised while building the landing page and while
reading *Connected Home Medication-Care Startup: Market, Product, Regulatory and Financial
Assessment* (20pp, referenced below as **[p.N]**).

This is a working register, not a verdict. Every flag is something to decide about, not
something that has been decided. Several are cheap to close now and expensive to close later —
those are marked accordingly.

**Nothing here is legal or regulatory advice.** Flags touching licensing, device classification
or data protection describe the *shape* of a constraint so it can be put to a qualified adviser.
They are not a substitute for one.

---

## How to read this

| Severity | Meaning |
|---|---|
| **Critical** | Could cause patient harm, or is unlawful as currently described. Resolve before building the feature. |
| **High** | Materially changes cost, timeline, liability or the business model. Resolve before committing money. |
| **Medium** | Real, but manageable with a decision and some work. |
| **Low** | Housekeeping. |

Types: `Safety` · `Legal` · `Accuracy` (what we publicly claim) · `Strategy` · `Privacy` · `Ops`

---

## Summary

| ID | Severity | Type | Flag |
|---|---|---|---|
| [A-01](#a-01) | Critical | Accuracy | Live site sells a per-medicine compartment model the assessment tells us not to build |
| [A-02](#a-02) | High | Accuracy | Live site labels doses "Taken" — overstates what the device can know |
| [A-03](#a-03) | High | Safety | Live site describes remote release more openly than the assessment permits |
| [A-04](#a-04) | Medium | Strategy | Live site presents two co-equal apps; evidence says caregiver-first |
| [B-01](#b-01) | Critical | Legal | The app cannot be the party that orders prescription medicine |
| [B-02](#b-02) | Critical | Safety | One stale prescription would drive both the schedule and the reorder |
| [B-03](#b-03) | High | Safety | Repeats are finite and prescriptions expire — silent failure at the worst moment |
| [B-04](#b-04) | High | Legal | Someone types the prescription in, and the system then operates on it |
| [B-05](#b-05) | High | Privacy | Storing prescriptions escalates the data classification |
| [B-06](#b-06) | Medium | Strategy | A deliberately quiet app is a churn risk against a monthly subscription |
| [B-07](#b-07) | Medium | Strategy | Auto-refill is described as current; the assessment puts it in the later roadmap |
| [C-01](#c-01) | High | Strategy | Hospital-prepared cassettes inverts the buyer |
| [C-02](#c-02) | High | Strategy | The modelled pre-seed does not fund an enterprise sales motion |
| [C-03](#c-03) | High | Legal | Unified/national-ID clinical access is not available to a consumer startup |
| [C-04](#c-04) | High | Safety | The fill/dispense seam needs a hard interlock |
| [C-05](#c-05) | Medium | Ops | Prefilled cassettes are a physical supply chain, including returns |
| [C-06](#c-06) | High | Privacy | National ID + dose events + institutional linkage is a different data class |
| [D-01](#d-01) | High | Strategy | Three capability expansions in one conversation, against advice to narrow |
| [D-02](#d-02) | Medium | Strategy | Cassette serialisation should move from roadmap into V1 |
| [E-01](#e-01) | High | Legal | Early-access form has no endpoint and no real privacy policy behind it |
| [E-02](#e-02) | Medium | Privacy | Web fonts leak visitor IP to a third party |
| [E-03](#e-03) | Low | Ops | No Open Graph image; no photography |

---

## A. The live site now contradicts the assessment

The landing page at `medidose-landing.vercel.app` was written before the assessment was read.
Three of its claims are now known to be wrong, and they are wrong in public.

### A-01
**Per-medicine compartment model** · Critical · Accuracy

The site presents one medicine per compartment. The dispenser feature card says every medicine
gets "one obvious place to live," and the app mockups read `Slot 1 · Morning tablet`,
`Slot 2 · Morning capsule`.

The assessment is explicit that the device should hold **28–32 dose events, not 28–32
medicines** — the 8:00 AM compartment contains metformin, amlodipine and another tablet
*together* [p.7]. It states this as the single most important product recommendation [p.2].

Why it matters beyond wording: the per-medicine model is precisely the framing that forces the
loose-pill singulating robot the assessment tells us not to build, and it makes hospital or
pharmacy pre-fill impossible to describe — an institution fills a dose event, not a medicine slot.

*Fix:* rewrite compartment copy and mockup rows to dose events (`8:00 AM · 3 tablets`).
Files: `assets/js/data.js` (`steps`, `appScreens`, `caregiverScreens`, `dispenserFeatures`).

### A-02
**"Taken" overstates what the device knows** · High · Accuracy

The app mockups show a green **Taken** pill on completed doses. The assessment sets out a
four-state chain — **Scheduled → Released → Collected → Ingested** — and says the system must
never represent collected as swallowed [p.7]. Its own KPI guidance says the metric is
"scheduled medication events completed within the permitted window," not "medication taken" [p.13].

The site is careful about this in prose and then contradicts itself in the UI, which is the part
people actually read.

*Fix:* replace `Taken` with `Released` / `Collected` throughout the mockups and history screens.

### A-03
**Remote release described too openly** · High · Safety

Site copy says a caregiver can "release a compartment." The assessment says the app should
**never** offer an unrestricted "choose medicine, choose quantity, release" control — only
authorisation of a *preconfigured dose or approved PRN event*, within medication-specific time
and quantity limits, rejected locally by the device if it violates them [p.2, p.7].

It cites an FDA MAUDE report concerning Hero describing a reported overdose after a
manual-retrieval path opened for a user with dementia [p.2]. (A MAUDE report establishes neither
incidence nor causality — it is cited as an illustration of why fail-safe access control matters.)

*Fix:* narrow the copy to "authorise the scheduled dose," and state that the device enforces the
limits locally rather than the app.

### A-04
**Two co-equal apps** · Medium · Strategy

The site presents a medication-user app and a caregiver app as equals, with the medication user's
six screens first.

A nationally representative study of 2,228 Singapore residents aged 62+ taking prescription
medication found **0.5% were using a medication-reminder app**; current use plus near-term
intention combined was 2.6% [p.3]. The assessment concludes the phone experience should
*primarily* serve the caregiver, with the appliance kept deliberately simple.

*Consider:* caregiver app as the product, device as the elder's surface, and a minimal optional
patient view. This also aligns buyer and user, which strengthens the S$399 + S$19.90/month sell.

---

## B. Auto-ordering and prescription-on-file

### B-01
**The app cannot be the party that orders prescription medicine** · Critical · Legal

Prescription-only medicines can be supplied only by a licensed pharmacy, against a valid
prescription with remaining repeat authorisation. Software cannot hold that authority, and a
partnership does not transfer it — the partner pharmacy remains the supplier and the decision-maker.

Holding a copy of the prescription does not change this. A prescription is an instruction to a
pharmacist; our copy is a convenience record, and the pharmacy must verify against its own.

*Design consequence:* the UI can never say "ordered." It says **sent to your pharmacy**, and
status is returned by them. Auto-fulfilment without human confirmation is defensible only for
non-prescription items, and even then should be opt-in per item.

### B-02
**A stale prescription would drive both the schedule and the reorder** · Critical · Safety

This is the highest-consequence coupling in the feature. If one stored prescription generates
both what the dispenser presents and what gets reordered, a prescription changed last week
produces the wrong pills in the tray *and* orders more of them.

The assessment's hazard list already includes "old schedule persists after prescription
change" [p.11], alongside wrong compartment indexed, duplicate dose, and dose released too early.

*Mitigation:* prescription changes must invalidate the schedule and flag dispensing, not silently
update quantities. Treat a change as requiring re-verification of both paths.

### B-03
**Repeats are finite; prescriptions expire** · High · Safety

"Keep it on file and reorder based on doses" holds until repeat 3 of 3 is consumed or the script
passes its validity date. That is a certainty on every chronic prescription, not an edge case,
and the naive version fails silently at exactly the wrong moment.

*Mitigation:* `repeats_remaining` and `expires_on` as first-class fields, and a distinct
**re-prescribe** flow (contact the prescriber) that is visibly not a refill.

### B-04
**Transcription liability** · High · Legal

If a caregiver enters "500 mg twice daily" and it should have been once daily, the system
schedules and reorders on that error.

The site currently states that MediDose "does not review prescriptions, dosages or interactions" —
but computing supply *from* a prescription is operating on it. Those two positions need
reconciling before the feature ships.

*Mitigation:* the pharmacy's record is authoritative and ours is a mirror. New entries stay
`unverified` until pharmacist-confirmed. Discrepancies are displayed, never silently resolved.

### B-05
**Storing prescriptions escalates the data classification** · High · Privacy

Drug names imply diagnoses. The assessment already treats medication schedules, caregiver
identities, dose events and telemetry as sensitive personal data under PDPA, and notes that
organisations remain accountable even when using cloud providers [p.10].

Prescription images add OCR, retention policy, access control and breach-notification scope on
top of that.

### B-06
**A quiet app is a churn risk** · Medium · Strategy

The stated design goal is an app "only seen during critical periods." That is right for UX and
dangerous for retention: the model assumes S$19.90/month, 80–85% subscription attach, 90% annual
retention and a 30-month paid lifetime [p.12–13]. People cancel subscriptions they never open.

Refill is the one recurring, *visible* thing the app does — which is what reconciles the two.
Worth stating explicitly as the retention mechanism rather than leaving it implicit.

Note also the assessment's caution that churn here may be driven by care transitions,
hospitalisation, death and relocation rather than conventional SaaS behaviour [p.13].

### B-07
**Roadmap position disagrees with how it is being described** · Medium · Strategy

The assessment places "Pharmacy auto-refill integration" in the **later roadmap** column [p.8],
and the executive summary says "inventory monitoring and pharmacy/refill integration follow
later" [p.1]. It is currently being described as a current feature. One of those needs to move.

*Suggested split, since the halves have different risk profiles:*

- **V1:** prescription capture, days'-supply arithmetic, remaining-stock display, low-stock alerts.
  All local computation, already needed to build the schedule. No licence, no partner, no supply liability.
- **Behind a pharmacy partner:** the request handoff and order status. The partner's
  prescription-verification workflow shapes the data model, so building it speculatively means
  rebuilding it.

*Reconciliation worth surfacing:* compute remaining stock **two ways** — theoretical (from
prescribed rate) and actual (from the device's dispense count) — and treat divergence as a signal.
If theory says 12 days and the device counted 18 releases, something is wrong: missed doses,
manual removal or a loading error. No competitor surfaces that.

---

## C. Hospital-prepared cassettes and unified ID

This is the strongest of the proposed directions. It addresses the risk the assessment itself
rates **Critical** — "incorrect caregiver loading," whose mitigation chain ends in "later
pharmacy-prefill" [p.14] — and page 12 states directly that a pharmacy partnership "can
eventually remove the highest-risk user operation: manually putting the right medicine into the
right compartment."

It also substantially dissolves [B-01](#b-01): if an institution prepares and dispatches the
cassette, no consumer purchase of prescription medicine is occurring. And it removes
[B-02](#b-02), because their system is the source of truth rather than our mirror.

The flags below are about what it costs, not whether it is a good idea.

**Suggested wedge:** post-discharge medication, not general pharmacy integration. The days after
discharge are when the regimen has just changed and the family is scrambling; hospitals already
care because of readmission; and it is time-boxed, so it is a pilot rather than a permanent
institutional commitment.

### C-01
**It inverts the buyer** · High · Strategy

The assessment's entire go-to-market is Singapore-first household DTC, with home-care
organisations, pharmacies and assisted-living fleets sequenced *after* [p.11–12]. Hospital-filled
cassettes makes the institution the customer: procurement, security review, data-sharing
agreements, possibly tender.

### C-02
**The modelled raise does not fund an enterprise motion** · High · Strategy

The recommendation is S$2.0M pre-seed for roughly 18 months [p.2, p.15], with modelled CAC
falling from S$220 to S$110 [p.12–13]. Institutional CAC is an order of magnitude higher and
measured in quarters, and hardware businesses already consume cash ahead of collection [p.14].

Pursuing both motions on this raise is the concrete mismatch to resolve.

### C-03
**Unified/national-ID clinical access** · High · Legal

Linking to a national patient identifier and its clinical record is not something a consumer
startup can plug into; that access is restricted to licensed healthcare institutions, which means
becoming an approved vendor to each one. The assessment parks "FHIR/clinical-system APIs" in the
later roadmap [p.8] for this reason.

*Treat it as an outcome of a hospital relationship, not the way one starts.*

### C-04
**The fill/dispense seam** · High · Safety

If the hospital fills the cassette, they own a fill error. But if our carousel mis-indexes and
presents compartment 4 at compartment 3's time, that is ours — now in front of an institution.
"Wrong compartment indexed" is the first item on the assessment's hazard list [p.11].

*Required interlock:* serialised cassette, machine-readable ID read on insertion, and the device
refuses to run an unknown or mismatched cassette. **Fail closed** — the assessment is explicit
that a jam should alert and preserve medication security rather than open the reservoir [p.11].

### C-05
**Prefilled cassettes are a physical supply chain** · Medium · Ops

Tamper evidence, serialisation, dispatch, and reverse logistics for empties — not an API. Note
that dispensed medication generally cannot be returned to stock, so "just swap the cassette" has
a disposal problem attached.

### C-06
**Data class escalates again** · High · Privacy

National ID + dose events + institutional linkage is materially more sensitive than "a button was
pressed at home." It also likely makes us a data intermediary to the hospital, with audit rights,
breach terms and retention obligations flowing from their contract on top of PDPA baseline [p.10].

---

## D. Cross-cutting

### D-01
**Scope** · High · Strategy

Three capability expansions have been added in quick succession: remote release, then auto-ordering,
then hospital-prepared cassettes. Each is individually sound. Together they describe three
businesses — a device company, a fulfilment company and a health-IT integrator.

The assessment's actual bottom line is "**pursue — but narrow the first product**," and it warns
specifically against the over-engineered version [p.2, p.16]. Its exclusion list for V1: no
ingestion proof, no controlled substances, no emergency/rescue medication, no AI pill
identification, no open-ended remote dispensing, and no unattended auto-dispense that releases
with nobody present [p.8].

*Recommendation:* hold all three as **designed-for**, ship one.

### D-02
**Pull cassette serialisation into V1** · Medium · Strategy

The assessment lists "serialized cassette" and "barcode/NFC medication identity" in the later
roadmap [p.8], but also names serialisation as the mitigation for a **Critical** risk [p.14].
That is inconsistent, and the cheap resolution is to build it now.

Define a **fill manifest** as a data structure immediately:

| Field | Purpose |
|---|---|
| Cassette serial | Identity; read on insertion |
| Patient reference | Device refuses a mismatch |
| Per-compartment contents | What is in each dose event |
| Scheduled time per compartment | Drives indexing |
| Fill timestamp | Staleness and expiry checks |
| Filler identity | Caregiver, pharmacy or hospital |
| Verification level | Unverified / pharmacist-confirmed |

With this, a caregiver filling at home and a hospital pharmacy filling in bulk are **the same
operation with different actors**. "Who filled this" becomes a field, not a fork in the product —
the institutional version is a new value in an existing column rather than a second product line.

This is the cheapest way to keep [C-01](#c-01) through [C-06](#c-06) open as options without
paying for them yet.

---

## E. Carried over from the landing page build

These predate the assessment and are documented in `README.md`; repeated here so the register is
complete.

### E-01
**Form has no endpoint; legal pages are placeholders** · High · Legal

`submitEarlyAccess()` in `assets/js/app.js` resolves without sending anything, and nothing typed
is stored — deliberately, since health-adjacent details should not sit in `localStorage`. A
visible note on the page tells visitors so.

`privacy.html` and `terms.html` are scaffolding, not legal documents. Both must be replaced by a
real policy reviewed by a lawyer **before any data is collected from anyone**.

### E-02
**Web fonts leak visitor IP** · Medium · Privacy

Fonts load from Google Fonts, so Google receives each visitor's IP. Either disclose in the privacy
policy or self-host the two families. Currently disclosed only in the placeholder policy.

### E-03
**No Open Graph image; no photography** · Low · Ops

Shared links render without a preview thumbnail. `#caregivers` carries a labelled photography
placeholder; no stock imagery ships with the page.

---

## Suggested order of work

1. **[A-01](#a-01), [A-02](#a-02), [A-03](#a-03)** — the site is live and currently
   contradicts the assessment. Cheapest fix here, largest embarrassment avoided.
2. **[D-02](#d-02)** — define the fill manifest. It is a data-structure decision that
   costs almost nothing now and gets expensive to retrofit.
3. **[B-07](#b-07)** — decide the V1/partner split for refill, then build only the V1 half.
4. **[A-04](#a-04)** — decide whether the caregiver app becomes the product.
5. **[C-01](#c-01), [C-02](#c-02)** — decide whether the institutional motion is in
   scope for this raise. It probably is not, and deciding that explicitly protects the runway.

## A note on the assessment's own numbers

The document repeatedly labels its figures as planning assumptions rather than forecasts —
the TAM range, the SAM model, the BOM costs, the LTV/CAC table and the three-year P&L are all
internal estimates, several of them extrapolations [p.1, p.4, p.9, p.13, p.14]. It also warns
against building a pitch deck around a demographic-derived US$30–60B TAM [p.5]. Worth preserving
that framing when any of it is reused.

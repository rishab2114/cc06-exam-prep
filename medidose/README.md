# MediDose — concept landing page

A static, dependency-free landing page introducing **MediDose**, a concept for a connected
medication dispenser and companion app built around families who no longer live in the same
house: an older parent presses one screen at home, and an invited family member sees it on
their phone wherever they are. Its job is to explain the idea, be honest about its limits, and
collect early-access interest.

The app has two roles, and the page presents them separately because they are two people on two
phones: the **medication user** (today's schedule, reminders, history, refills, and control over
what is shared) and an **invited caregiver** (permission-based check-in, notifications, and
remote release of a compartment).

**MediDose is an early-stage concept.** It is not a certified medical device, has not been
clinically evaluated, and does not diagnose, prescribe, verify that medication was swallowed,
or guarantee adherence. It is not an emergency-monitoring system.

**On remote release.** The riskiest capability described here is a caregiver opening a
compartment from their phone. The page describes it as *releasing a compartment*, never as
giving a dose, because that is all it can do: the device cannot tell whether anyone is in the
room, whether the medicine was picked up, or whether it was taken, and an open compartment in
an empty house is a hazard in a home with children or pets. It is modelled as a permission
separate from viewing, off by default, granted and revocable by the medication user. Keep that
framing if you edit the copy — softening it into "dispense remotely" would overstate what the
system does and move the product further into regulated-device territory.

## Running it

No build step and no package manager. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000    # then visit http://localhost:8000/
```

## Structure

```
index.html              Page markup, meta/SEO, FAQ structured data
privacy.html            Placeholder — must be replaced before collecting data
terms.html              Placeholder — must be replaced before collecting data
assets/css/styles.css   Design tokens, then components
assets/js/data.js       All page copy + the inline SVG icon set
assets/js/components.js Presentational render functions (data in, HTML out)
assets/js/app.js        Behaviour: nav, tabs, accordion, validation, reveals
```

`components.js` functions take plain data and return HTML strings. They read no global state and
bind no events, which is why the same `phone()` and `dispenser()` components serve the hero, the
how-it-works stage and the app preview. All copy lives in `data.js` so it can be reviewed in one
place — including by someone who does not read CSS.

## Before this goes live

1. **Wire the form.** `submitEarlyAccess()` in `assets/js/app.js` currently resolves without
   sending anything. Nothing a visitor types is transmitted or stored — deliberately, since
   health-adjacent details should not sit in `localStorage`. POST to your endpoint there, handle
   the failure case, then remove the "concept preview" note under the submit button and the
   matching paragraph in the confirmation panel.
2. **Replace `privacy.html` and `terms.html`.** Both are scaffolding, not legal documents.
3. **Add photography.** `#caregivers` has one clearly-labelled placeholder frame. No stock imagery
   ships with this page. Give the replacement real, descriptive alt text.
4. **Decide about the web fonts.** They load from Google Fonts, which means Google sees each
   visitor's IP. Either disclose that in the privacy policy or self-host the two families.
5. **Add an OG image.** There is currently none, so shared links render without a preview image.
   The canonical and `og:url` tags point at the live Vercel deployment; update them if the site
   moves to its own domain.
6. **Regenerate the FAQ structured data** after editing `faqs` in `data.js` — the `FAQPage`
   JSON-LD in `index.html` is generated from it, and the exact command is in the HTML comment
   directly above that script tag. Do not hand-edit the JSON.

## Analytics

`MediDose.track()` pushes to `window.dataLayer` and no-ops when no tag manager is present.
CTAs, step views, app-preview views, FAQ opens and form outcomes are already instrumented via
`data-analytics` attributes. No third-party script is loaded — shipping one unannounced would
contradict the privacy copy in the trust section, so that is a deliberate later decision.

## Design and accessibility notes

The primary audience includes older adults, which drove most of the decisions:

- **Body text is 18px**, not 16px, with a 1.65 line-height. Nothing on the page is below 15px
  except labels inside the phone mockups, which sit at 12–13px because they depict a phone screen
  rendered small; the same information appears in the surrounding page copy at full size.
- **Contrast** was computed, not eyeballed. Body ink is 14.9:1 on white and secondary text 7.3:1
  (both AAA). Control borders use `--line-strong` at 3.6:1 to satisfy WCAG 1.4.11 — the softer
  `--line` is for decorative dividers only and would fail there.
- **Targets** are 48px, above the 44px floor. The consent checkbox is 28px with its label forming
  part of the target (WCAG 2.5.8 asks 24px); inline links in the footer's legal sentence rely on
  the inline exception.
- **Keyboard**: skip link, visible 3px focus rings that are never removed, roving-tabindex arrow
  key support on both tablists, Escape closes the mobile nav and returns focus, and the error
  summary moves focus to the field it names.
- **The dispenser SVG is `aria-hidden`** and its state is mirrored into a `role="status"` region,
  so screen-reader users get the step change that sighted users see in the graphic.
- **Reduced motion** is honoured, and scroll-reveal is gated behind a `.js` class so content is
  never hidden when scripting is unavailable.
- **Reflow**: verified to 200% text zoom at a 640px viewport with no horizontal scroll (the WCAG
  1.4.10 threshold).

Verified in headless Chromium: 45 checks covering rendering, both tablists, the accordion, the
full validation and confirmation flow, mobile navigation, tap targets, reflow, reduced motion and
a JavaScript-disabled render.

## Content rules this page follows

No testimonials, no clinical evidence, no certifications, no regulatory approvals, no partner
logos and no performance statistics — none of those exist, so none appear. Capabilities that are
not built are labelled proposed or in development. The benefits section is framed as design goals
rather than measured outcomes.

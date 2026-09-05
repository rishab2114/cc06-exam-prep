/* =============================================================
   MediDose — content + icon source of truth
   -------------------------------------------------------------
   All page copy lives here so components stay presentational and
   copy can be reviewed in one place. Nothing in this file may
   assert clinical outcomes, certifications, partnerships,
   testimonials, or performance statistics.
   ============================================================= */
(function (root) {
  "use strict";

  /* ---- Icons: inline stroke SVG, no icon font, no emoji ---- */
  var paths = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/>',
    type: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
    hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    battery: '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 11v2"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M1.42 9a16 16 0 0 1 21 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.5-4.5L7 20"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 13 2 2 4-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>'
  };

  function icon(name, size) {
    var d = paths[name];
    if (!d) return "";
    var s = size || 24;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + d + "</svg>";
  }

  var data = {

    nav: [
      { href: "#problem",     label: "Why MediDose" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#dispenser",   label: "Dispenser" },
      { href: "#app",         label: "App" },
      { href: "#caregivers",  label: "Caregivers" },
      { href: "#trust",       label: "Trust & safety" },
      { href: "#faq",         label: "FAQ" }
    ],

    audience: [
      "Older adults managing multiple medications",
      "People with recurring prescriptions",
      "Family members and caregivers",
      "Clinics, pharmacies and assisted-living providers"
    ],

    problems: [
      {
        icon: "clock",
        title: "Missed or delayed doses",
        body: "A dose can slip when the day changes shape — an appointment runs long, a nap runs late, a routine is interrupted. Afterwards it is often unclear whether it was taken or simply forgotten."
      },
      {
        icon: "calendar",
        title: "Complicated medication schedules",
        body: "Several medicines, several times a day, some with food and some without. Holding all of that in your head is work, and the work grows every time a prescription changes."
      },
      {
        icon: "users",
        title: "Limited caregiver visibility",
        body: "Family members often have no way to know how a routine is going without asking directly — which can feel like checking up on someone rather than supporting them."
      }
    ],

    /* Each step drives both mockups. `dispenser.active` is a 0-based
       compartment index; null means no compartment is called out. */
    steps: [
      {
        num: 1,
        title: "Load medication into labeled compartments",
        desc: "Medication is placed into separate compartments, each one clearly labeled so it is easy to see what is where.",
        dispenser: { active: null, loaded: [0,1,2,3,4,5,6], alerting: false, l1: "Ready to set up", l2: "7 compartments" },
        screen: {
          title: "Set up compartments", sub: "Step 1 of 3",
          blocks: [
            { t: "section", text: "Assign a medicine to each slot" },
            { t: "dose", time: "Slot 1", name: "Morning tablet", meta: "Label added", status: "taken", statusText: "Labeled" },
            { t: "dose", time: "Slot 2", name: "Morning capsule", meta: "Label added", status: "taken", statusText: "Labeled" },
            { t: "dose", time: "Slot 3", name: "Evening tablet", meta: "Label added", status: "taken", statusText: "Labeled" },
            { t: "dose", time: "Slot 4", name: "Not assigned", meta: "Tap to add", status: "muted", statusText: "Empty" },
            { t: "note", text: "Placeholder content. Compartment count and layout are still being designed." }
          ]
        }
      },
      {
        num: 2,
        title: "Create the schedule in the companion app",
        desc: "You or an authorized caregiver enters when each medicine is due and which compartment it belongs to, then reviews it before saving.",
        dispenser: { active: null, loaded: [0,1,2,3,4,5,6], alerting: false, l1: "Schedule syncing", l2: "3 medicines" },
        screen: {
          title: "Review schedule", sub: "Check against your prescription",
          blocks: [
            { t: "dose", time: "8:00 AM", name: "Morning tablet", meta: "Slot 1 · with food", status: "muted", statusText: "Daily" },
            { t: "dose", time: "8:00 AM", name: "Morning capsule", meta: "Slot 2", status: "muted", statusText: "Daily" },
            { t: "dose", time: "9:00 PM", name: "Evening tablet", meta: "Slot 3", status: "muted", statusText: "Daily" },
            { t: "banner", title: "Confirm before saving", text: "Check every entry against the instructions from your doctor or pharmacist." },
            { t: "note", text: "MediDose does not check prescriptions, interactions or dosages." }
          ]
        }
      },
      {
        num: 3,
        title: "Receive a reminder when a dose is due",
        desc: "At the scheduled time the dispenser signals with light and sound and shows a short on-device message. The app can send a reminder as well.",
        dispenser: { active: null, loaded: [0,1,2,3,4,5,6], alerting: true, l1: "8:00 AM", l2: "Morning dose due" },
        screen: {
          title: "Reminder", sub: "Tuesday, 8:00 AM",
          blocks: [
            { t: "banner", title: "Morning dose is due", text: "Compartment 1 and 2 — tap the dispenser when you are ready." },
            { t: "dose", time: "8:00 AM", name: "Morning tablet", meta: "Slot 1 · with food", status: "due", statusText: "Due now", due: true },
            { t: "dose", time: "8:00 AM", name: "Morning capsule", meta: "Slot 2", status: "due", statusText: "Due now", due: true },
            { t: "note", text: "Reminder timing and repeat behaviour are proposed and not finalised." }
          ]
        }
      },
      {
        num: 4,
        title: "The dispenser presents the scheduled compartment",
        desc: "The correct compartment is identified — and, if access control is enabled, made accessible — so there is nothing to remember or work out.",
        dispenser: { active: 0, loaded: [0,1,2,3,4,5,6], alerting: true, l1: "Compartment 1", l2: "Morning tablet" },
        screen: {
          title: "Ready to take", sub: "Compartment 1 is open",
          blocks: [
            { t: "banner", title: "Compartment 1", text: "Morning tablet · take with food" },
            { t: "dose", time: "Now", name: "Morning tablet", meta: "Slot 1", status: "due", statusText: "Waiting", due: true },
            { t: "note", text: "The system identifies a compartment. It cannot confirm what was removed from it, or that medication was swallowed." }
          ]
        }
      },
      {
        num: 5,
        title: "The app records the event and can notify a caregiver",
        desc: "Once you acknowledge the dose, the app logs it. If you have invited someone and granted permission, they can receive an update.",
        dispenser: { active: null, loaded: [1,2,3,4,5,6], alerting: false, l1: "Dose recorded", l2: "8:04 AM" },
        screen: {
          title: "Recorded", sub: "Tuesday, 8:04 AM",
          blocks: [
            { t: "dose", time: "8:04 AM", name: "Morning tablet", meta: "Acknowledged on device", status: "taken", statusText: "Taken" },
            { t: "dose", time: "8:04 AM", name: "Morning capsule", meta: "Acknowledged on device", status: "taken", statusText: "Taken" },
            { t: "banner", title: "Shared with Priya", text: "Morning dose acknowledged. You chose what Priya can see." },
            { t: "note", text: "Sharing is off until you invite someone and turn it on." }
          ]
        }
      }
    ],

    dispenserFeatures: [
      { icon: "grid", title: "Clearly labeled compartments", body: "Separate compartments with large, readable labels, so each medicine has one obvious place to live." },
      { icon: "volume", title: "Light and sound reminders", body: "A visible light and an audible tone at the scheduled time, with the intent that volume and brightness can be adjusted." },
      { icon: "type", title: "Accessible controls and readable display", body: "Large physical controls and a high-contrast display, sized for use without reading glasses." },
      { icon: "hourglass", title: "Dose-window indicators", body: "A simple indication of whether a dose is due now, still within its window, or has passed." },
      { icon: "lock", title: "Optional lock or access control", body: "An optional setting that keeps compartments closed outside their scheduled window. Off by default." },
      { icon: "battery", title: "Battery and connectivity status", body: "The device and the app both show power level and whether the dispenser is currently connected." }
    ],

    /* Deliberately shorter than appScreens[0]: the hero mockup is a
       product shot, not a feature tour. The full screen lives in the app section. */
    heroScreen: {
      title: "Today", sub: "Tuesday, 5 September",
      blocks: [
        { t: "dose", time: "8:00 AM", name: "Morning tablet", meta: "Slot 1 \u00b7 with food", status: "taken", statusText: "Taken" },
        { t: "dose", time: "1:00 PM", name: "Midday tablet", meta: "Slot 4", status: "due", statusText: "Due soon", due: true },
        { t: "dose", time: "9:00 PM", name: "Evening tablet", meta: "Slot 3", status: "muted", statusText: "Later" }
      ]
    },

    appScreens: [
      {
        id: "today",
        tab: "Today",
        heading: "Today's medication schedule",
        body: "One screen for the whole day, in order, with the next dose called out. No hunting through menus to answer “what do I take now?”",
        points: ["Doses grouped by time of day", "The next dose is always visible at the top", "Large type and high-contrast status labels"],
        screen: {
          title: "Today", sub: "Tuesday, 5 September",
          blocks: [
            { t: "dose", time: "8:00 AM", name: "Morning tablet", meta: "Slot 1 · with food", status: "taken", statusText: "Taken" },
            { t: "dose", time: "8:00 AM", name: "Morning capsule", meta: "Slot 2", status: "taken", statusText: "Taken" },
            { t: "dose", time: "1:00 PM", name: "Midday tablet", meta: "Slot 4", status: "due", statusText: "Due soon", due: true },
            { t: "dose", time: "9:00 PM", name: "Evening tablet", meta: "Slot 3", status: "muted", statusText: "Later" },
            { t: "note", text: "Illustrative content for a concept product." }
          ]
        }
      },
      {
        id: "reminders",
        tab: "Reminders",
        heading: "Upcoming-dose reminders",
        body: "A reminder before the dose window opens and, if you want it, a follow-up if the dose has not been acknowledged.",
        points: ["Reminder ahead of the scheduled time", "Optional follow-up reminder", "Quiet-hours settings are being explored"],
        screen: {
          title: "Reminders", sub: "How you are notified",
          blocks: [
            { t: "banner", title: "Next reminder", text: "1:00 PM — Midday tablet, Slot 4" },
            { t: "switch", label: "Reminder on the dispenser", hint: "Light and sound", on: true },
            { t: "switch", label: "Reminder on this phone", hint: "Push notification", on: true },
            { t: "switch", label: "Follow-up if not acknowledged", hint: "After 30 minutes", on: false },
            { t: "note", text: "Reminders are not an emergency alert system." }
          ]
        }
      },
      {
        id: "history",
        tab: "Dose history",
        heading: "Dose history",
        body: "A plain record of what was acknowledged and when, so patterns are visible without anyone having to keep notes.",
        points: ["Acknowledged, missed and late entries", "Filter by medicine or by date", "Export for a pharmacist or clinician appointment (proposed)"],
        screen: {
          title: "History", sub: "Last 3 days",
          blocks: [
            { t: "section", text: "Today" },
            { t: "dose", time: "8:04 AM", name: "Morning dose", meta: "Acknowledged on device", status: "taken", statusText: "Taken" },
            { t: "section", text: "Monday" },
            { t: "dose", time: "9:12 PM", name: "Evening tablet", meta: "Acknowledged 12 min late", status: "due", statusText: "Late" },
            { t: "dose", time: "1:00 PM", name: "Midday tablet", meta: "No acknowledgement recorded", status: "missed", statusText: "Missed" },
            { t: "note", text: "History reflects acknowledgements on the device, not confirmation that medication was taken." }
          ]
        }
      },
      {
        id: "refills",
        tab: "Refills",
        heading: "Refill reminders",
        body: "You tell the app how many doses you loaded; it counts down and reminds you before a compartment runs out.",
        points: ["Countdown based on the quantity you entered", "A reminder ahead of running out", "MediDose does not order or dispense prescriptions"],
        screen: {
          title: "Refills", sub: "Based on quantities you entered",
          blocks: [
            { t: "dose", time: "Slot 1", name: "Morning tablet", meta: "4 doses remaining", status: "missed", statusText: "Refill soon" },
            { t: "dose", time: "Slot 2", name: "Morning capsule", meta: "16 doses remaining", status: "taken", statusText: "OK" },
            { t: "dose", time: "Slot 3", name: "Evening tablet", meta: "22 doses remaining", status: "taken", statusText: "OK" },
            { t: "note", text: "Counts come from what you enter, not from measuring the contents." }
          ]
        }
      },
      {
        id: "sharing",
        tab: "Caregiver sharing",
        heading: "Caregiver sharing, controlled by you",
        body: "Sharing is off until you invite someone. You choose what they can see, and you can change or withdraw it at any time.",
        points: ["Invite by name, one person at a time", "Per-item permissions rather than all-or-nothing", "Withdraw access without deleting your own history"],
        screen: {
          title: "Sharing", sub: "Priya (daughter)",
          blocks: [
            { t: "switch", label: "See today's schedule", hint: "Medicine names and times", on: true },
            { t: "switch", label: "Notify if a dose is missed", hint: "After the dose window closes", on: true },
            { t: "switch", label: "See full dose history", hint: "All past entries", on: false },
            { t: "switch", label: "Edit my schedule", hint: "Add or change medicines", on: false },
            { t: "note", text: "Turning everything off removes Priya's access immediately." }
          ]
        }
      },
      {
        id: "device",
        tab: "Device",
        heading: "Device status and setup",
        body: "Power and connection state in one place, so an unplugged or offline dispenser is easy to notice.",
        points: ["Battery level and charging state", "Connected or offline indicator", "Guided first-time setup"],
        screen: {
          title: "Device", sub: "MediDose dispenser",
          blocks: [
            { t: "switch", label: "Battery", hint: "82% — running on battery", on: true },
            { t: "switch", label: "Connection", hint: "Connected to home Wi-Fi", on: true },
            { t: "switch", label: "Sound", hint: "Reminder tone at medium volume", on: true },
            { t: "switch", label: "Compartment lock", hint: "Currently off", on: false },
            { t: "note", text: "Offline behaviour is described in the FAQ below." }
          ]
        }
      }
    ],

    caregiverPoints: [
      { icon: "share",  title: "Nothing is shared until you invite someone", body: "There is no default caregiver and no automatic sharing. The feature stays dormant until the person taking the medication turns it on." },
      { icon: "sliders", title: "Permissions are itemised, not all-or-nothing", body: "Today's schedule, missed-dose notifications and full history are separate permissions. Grant one without granting the others." },
      { icon: "bell",   title: "Optional notifications, plainly worded", body: "A caregiver can be told that a dose was acknowledged, or that a dose window closed without an acknowledgement. Nothing more is inferred from that." },
      { icon: "close",  title: "Access can be withdrawn at any time", body: "Turning a permission off takes effect immediately and does not delete the user's own record." }
    ],

    benefits: [
      { icon: "sun",      title: "A simpler daily routine", body: "One place to look, in a fixed order, instead of several boxes, labels and mental notes." },
      { icon: "heart",    title: "Greater independence", body: "The routine is designed to be run by the person taking the medication — support is optional, not built in by default." },
      { icon: "phone",    title: "Fewer manual check-ins", body: "When sharing is switched on, a caregiver can see what they need without a daily phone call about tablets." },
      { icon: "history",  title: "Better visibility into habits", body: "A written record of acknowledgements makes it easier to notice a pattern and raise it with a pharmacist or clinician." },
      { icon: "users",    title: "Easier coordination with people you trust", body: "Clear, itemised permissions give families a shared reference point instead of an informal arrangement." }
    ],

    trust: [
      { title: "Privacy first, and off by default", body: "Sharing is disabled until the person taking the medication switches it on. Permissions are itemised and reversible. We are designing to collect only what the described features need." },
      { title: "Your information should be reviewed by people who know your care", body: "Any schedule entered into the app should be checked against instructions from your doctor, pharmacist or clinician. MediDose does not review prescriptions, dosages or interactions." },
      { title: "Not an emergency-response system", body: "MediDose does not call for help, contact emergency services, or monitor health. A missed-dose notification is a notification and nothing more." },
      { title: "What the system can and cannot observe", body: "The system records acknowledgements made at the dispenser or in the app. It cannot verify that medication was removed, taken or swallowed, and it does not guarantee adherence." },
      { title: "An early-stage concept, described as one", body: "Features on this page are proposed for a first version and are subject to change. Nothing here has been clinically validated." },
      { title: "No certification claimed", body: "MediDose is not a certified or approved medical device, and we make no regulatory claims. We will say plainly if that ever changes." }
    ],

    roles: [
      { value: "",             label: "Select the option that fits best" },
      { value: "medication-user",     label: "I take medication on a schedule" },
      { value: "caregiver",           label: "I help care for someone who does" },
      { value: "healthcare-professional", label: "Healthcare professional" },
      { value: "organization",        label: "Clinic, pharmacy or care provider" }
    ],

    medCounts: [
      { value: "",       label: "Select a range" },
      { value: "0",      label: "None at the moment" },
      { value: "1-2",    label: "1 to 2 per day" },
      { value: "3-5",    label: "3 to 5 per day" },
      { value: "6-9",    label: "6 to 9 per day" },
      { value: "10+",    label: "10 or more per day" },
      { value: "unsure", label: "Prefer not to say" }
    ],

    faqs: [
      {
        q: "Who is MediDose designed for?",
        a: "People who take one or more medicines on a recurring schedule — particularly older adults and anyone managing several prescriptions at once — plus the family members who support them. We are also talking to clinics, pharmacies and assisted-living providers about whether it would be useful in their settings."
      },
      {
        q: "What types of medication can it hold?",
        a: "The concept is built around solid oral medication such as tablets and capsules that a person already sorts by hand. It is not designed for liquids, injectables, refrigerated medicines, inhalers, or anything requiring special handling. Compartment size and capacity are still being worked out, and some medicines will not be suitable."
      },
      {
        q: "Does it work without internet access?",
        a: "The intent is that the schedule stays on the device, so reminders and compartment identification continue to work while the dispenser is offline. Anything that depends on the connection — syncing to the app, and caregiver notifications — would resume once it reconnects. This behaviour is proposed and has not been built or tested yet."
      },
      {
        q: "Can caregivers see every medication event?",
        a: "No, not unless the person taking the medication chooses that. Sharing is off until they invite someone, and permissions are itemised: today's schedule, missed-dose notifications and full history are separate switches. Any of them can be turned off again at any time."
      },
      {
        q: "What happens if a dose is missed?",
        a: "If the dose window closes without an acknowledgement, the app records it as missed and, where that permission has been granted, can notify a caregiver. That is the whole of it — MediDose does not escalate, does not contact emergency services, and should not be relied on as a safety net."
      },
      {
        q: "Is MediDose a certified medical device?",
        a: "No. MediDose is an early-stage concept. It is not certified, approved or cleared by any regulator, it has not been clinically evaluated, and we are not claiming otherwise. It does not diagnose, prescribe or treat, and it is not a substitute for advice from a doctor or pharmacist."
      },
      {
        q: "When will early access begin?",
        a: "We do not have a date yet. We are at the stage of validating the idea and understanding what people actually need, which is what this early-access list is for. If you join it, we will contact you when there is something concrete to show — and we will not use your details for anything else."
      }
    ],

    footer: {
      product:   [{ href: "#dispenser", label: "Dispenser" }, { href: "#app", label: "Mobile app" }, { href: "#caregivers", label: "For caregivers" }, { href: "#benefits", label: "Benefits" }],
      learn:     [{ href: "#how-it-works", label: "How it works" }, { href: "#problem", label: "Why MediDose" }, { href: "#trust", label: "Trust & safety" }, { href: "#faq", label: "FAQ" }],
      company:   [{ href: "#early-access", label: "Early access" }, { href: "mailto:hello@medidose.example", label: "Contact" }, { href: "privacy.html", label: "Privacy" }, { href: "terms.html", label: "Terms" }]
    }
  };

  root.MediDose = root.MediDose || {};
  root.MediDose.data = data;
  root.MediDose.icon = icon;
})(window);

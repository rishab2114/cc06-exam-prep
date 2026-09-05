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
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    tap: '<path d="M12 10V5a2 2 0 0 0-4 0v9l-2-2a2 2 0 0 0-3 3l5 6h7a4 4 0 0 0 4-4v-5a2 2 0 0 0-4 0"/>'
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
      { href: "#problem",      label: "Why MediDose" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#dispenser",    label: "Dispenser" },
      { href: "#app",          label: "App" },
      { href: "#caregivers",   label: "From a distance" },
      { href: "#trust",        label: "Trust & safety" },
      { href: "#faq",          label: "FAQ" }
    ],

    audience: [
      "Parents living independently at home",
      "Adult children caring from another city",
      "Only children carrying it alone",
      "Siblings sharing the load between them",
      "Home-care teams supporting people at home"
    ],

    problems: [
      {
        icon: "clock",
        title: "Missed or delayed doses",
        body: "A dose slips when the day changes shape \u2014 an appointment runs long, a nap runs late, a routine is interrupted. Afterwards nobody can say for certain whether it was taken or simply forgotten."
      },
      {
        icon: "calendar",
        title: "Complicated medication schedules",
        body: "Several medicines, several times a day, some with food and some without. Holding all of that in your head is work, and the work grows every time a prescription changes."
      },
      {
        icon: "pin",
        title: "You are not in the room",
        body: "When you live an hour or a country away, the only way to know how the week has gone is to ask. Asking every single day turns a relationship into a checklist \u2014 and still only tells you what someone remembers."
      }
    ],

    /* Each step drives both mockups. `dispenser.active` is a 0-based
       compartment index; null means no compartment is called out. */
    steps: [
      {
        num: 1,
        title: "Load the compartments",
        desc: "Medication goes into separate compartments, each one clearly labelled. This is the one part that has to happen in the house.",
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
        title: "Set the schedule \u2014 from either phone",
        desc: "The person taking the medication can do it, or an invited family member can do it for them from anywhere. Either way it is reviewed before it saves.",
        dispenser: { active: null, loaded: [0,1,2,3,4,5,6], alerting: false, l1: "Schedule syncing", l2: "3 medicines" },
        screen: {
          title: "Review schedule", sub: "Check against the prescription",
          blocks: [
            { t: "dose", time: "8:00 AM", name: "Morning tablet", meta: "Slot 1 \u00b7 with food", status: "muted", statusText: "Daily" },
            { t: "dose", time: "8:00 AM", name: "Morning capsule", meta: "Slot 2", status: "muted", statusText: "Daily" },
            { t: "dose", time: "9:00 PM", name: "Evening tablet", meta: "Slot 3", status: "muted", statusText: "Daily" },
            { t: "banner", title: "Confirm before saving", text: "Check every entry against the instructions from the doctor or pharmacist." },
            { t: "note", text: "MediDose does not check prescriptions, interactions or dosages." }
          ]
        }
      },
      {
        num: 3,
        title: "The dispenser speaks up at home",
        desc: "At the scheduled time it lights up, sounds a tone, and shows a short message on its screen \u2014 in the room, not on a phone that may be in another room.",
        dispenser: { active: null, loaded: [0,1,2,3,4,5,6], alerting: true, l1: "8:00 AM", l2: "Morning dose due" },
        screen: {
          title: "Reminder", sub: "Tuesday, 8:00 AM",
          blocks: [
            { t: "banner", title: "Morning dose is due", text: "Compartments 1 and 2. Press the screen when you are ready." },
            { t: "dose", time: "8:00 AM", name: "Morning tablet", meta: "Slot 1 \u00b7 with food", status: "due", statusText: "Due now", due: true },
            { t: "dose", time: "8:00 AM", name: "Morning capsule", meta: "Slot 2", status: "due", statusText: "Due now", due: true },
            { t: "note", text: "Reminder timing and repeat behaviour are proposed and not finalised." }
          ]
        }
      },
      {
        num: 4,
        title: "One press on the screen",
        desc: "Your parent presses the dispenser\u2019s screen and the right compartment opens. Nothing to remember, nothing to work out, no phone required.",
        dispenser: { active: 0, loaded: [0,1,2,3,4,5,6], alerting: true, l1: "Press to open", l2: "Compartment 1" },
        screen: {
          title: "Ready to take", sub: "Compartment 1 is open",
          blocks: [
            { t: "banner", title: "Compartment 1", text: "Morning tablet \u00b7 take with food" },
            { t: "dose", time: "Now", name: "Morning tablet", meta: "Slot 1", status: "due", statusText: "Waiting", due: true },
            { t: "note", text: "The dispenser opens a compartment. It cannot confirm what was removed from it, or that medication was swallowed." }
          ]
        }
      },
      {
        num: 5,
        title: "Your phone tells you, wherever you are",
        desc: "The moment it is acknowledged, the app records it \u2014 and anyone your parent has invited gets a notification. No phone call required, in either direction.",
        dispenser: { active: null, loaded: [1,2,3,4,5,6], alerting: false, l1: "Dose recorded", l2: "8:04 AM" },
        screen: {
          title: "Recorded", sub: "Tuesday, 8:04 AM",
          blocks: [
            { t: "dose", time: "8:04 AM", name: "Morning tablet", meta: "Acknowledged on the dispenser", status: "taken", statusText: "Taken" },
            { t: "dose", time: "8:04 AM", name: "Morning capsule", meta: "Acknowledged on the dispenser", status: "taken", statusText: "Taken" },
            { t: "banner", title: "Sent to Priya", text: "Morning dose acknowledged. Your mother chose what Priya can see." },
            { t: "note", text: "Sharing stays off until someone is invited and given permission." }
          ]
        }
      },
      {
        num: 6,
        title: "Stuck? Open a compartment from your phone",
        desc: "If your parent cannot manage the screen, an invited caregiver with permission can release a compartment remotely. It opens the drawer \u2014 it does not put anything in anyone\u2019s hand.",
        dispenser: { active: 2, loaded: [2,3,4,5,6], alerting: true, l1: "Opened by Priya", l2: "Compartment 3" },
        screen: {
          title: "Release a compartment", sub: "Requires a separate permission",
          blocks: [
            { t: "banner", title: "Compartment 3 released", text: "Evening tablet. Your mother can take it whenever she is ready." },
            { t: "dose", time: "9:14 PM", name: "Evening tablet", meta: "Released remotely by Priya", status: "due", statusText: "Open", due: true },
            { t: "note", text: "Releasing opens a compartment. It cannot tell whether anyone is there, and it is not a substitute for being present when that is what is needed." }
          ]
        }
      }
    ],

    dispenserFeatures: [
      { icon: "grid",    title: "Clearly labelled compartments", body: "Separate compartments with large, readable labels, so every medicine has one obvious place to live." },
      { icon: "tap",     title: "A screen you press, not a menu", body: "A large on-device screen shows what is due and opens the compartment with a single press \u2014 sized to be used without reading glasses, and without a phone." },
      { icon: "volume",  title: "Light and sound reminders", body: "A visible light and an audible tone in the room at the scheduled time, with the intent that both can be adjusted." },
      { icon: "hourglass", title: "Dose-window indicators", body: "A plain indication of whether a dose is due now, still inside its window, or has passed." },
      { icon: "unlock",  title: "Access control and remote release", body: "Compartments can stay closed outside their window. An invited caregiver with the right permission can release one from their phone. Both settings are off by default." },
      { icon: "battery", title: "Battery and connectivity status", body: "The device and both apps show power level and whether the dispenser is currently online." }
    ],

    /* Deliberately shorter than appScreens[0]: the hero mockup is a
       product shot, not a feature tour. The full screen lives in the app section. */
    heroScreen: {
      title: "Mum\u2019s day", sub: "Dispenser at home \u00b7 online",
      blocks: [
        { t: "dose", time: "8:04 AM", name: "Morning dose", meta: "Taken at the dispenser", status: "taken", statusText: "Taken" },
        { t: "dose", time: "1:00 PM", name: "Midday tablet", meta: "Slot 4", status: "due", statusText: "Due soon", due: true },
        { t: "dose", time: "9:00 PM", name: "Evening tablet", meta: "Slot 3", status: "muted", statusText: "Later" }
      ]
    },

    /* Screens in the medication user's own app. */
    appScreens: [
      {
        id: "today",
        tab: "Today",
        heading: "Today\u2019s medication schedule",
        body: "One screen for the whole day, in order, with the next dose called out. No hunting through menus to answer \u201cwhat do I take now?\u201d",
        points: ["Doses grouped by time of day", "The next dose is always visible at the top", "Large type and high-contrast status labels"],
        screen: {
          title: "Today", sub: "Tuesday, 5 September",
          blocks: [
            { t: "dose", time: "8:00 AM", name: "Morning tablet", meta: "Slot 1 \u00b7 with food", status: "taken", statusText: "Taken" },
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
            { t: "banner", title: "Next reminder", text: "1:00 PM \u2014 Midday tablet, Slot 4" },
            { t: "switch", label: "Reminder on the dispenser", hint: "Light and sound in the room", on: true },
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
        body: "A plain record of what was acknowledged and when, so patterns are visible without anyone keeping notes by hand.",
        points: ["Acknowledged, missed and late entries", "Filter by medicine or by date", "Export for a pharmacist appointment (proposed)"],
        screen: {
          title: "History", sub: "Last 3 days",
          blocks: [
            { t: "section", text: "Today" },
            { t: "dose", time: "8:04 AM", name: "Morning dose", meta: "Acknowledged on the dispenser", status: "taken", statusText: "Taken" },
            { t: "section", text: "Monday" },
            { t: "dose", time: "9:12 PM", name: "Evening tablet", meta: "Acknowledged 12 min late", status: "due", statusText: "Late" },
            { t: "dose", time: "1:00 PM", name: "Midday tablet", meta: "No acknowledgement recorded", status: "missed", statusText: "Missed" },
            { t: "note", text: "History reflects acknowledgements at the dispenser, not confirmation that medication was taken." }
          ]
        }
      },
      {
        id: "refills",
        tab: "Refills",
        heading: "Refill reminders",
        body: "You say how many doses were loaded; the app counts down and reminds you both before a compartment runs out.",
        points: ["Countdown based on the quantity entered", "A reminder ahead of running out", "MediDose does not order or dispense prescriptions"],
        screen: {
          title: "Refills", sub: "Based on quantities entered",
          blocks: [
            { t: "dose", time: "Slot 1", name: "Morning tablet", meta: "4 doses remaining", status: "missed", statusText: "Refill soon" },
            { t: "dose", time: "Slot 2", name: "Morning capsule", meta: "16 doses remaining", status: "taken", statusText: "OK" },
            { t: "dose", time: "Slot 3", name: "Evening tablet", meta: "22 doses remaining", status: "taken", statusText: "OK" },
            { t: "note", text: "Counts come from what was entered, not from measuring the contents." }
          ]
        }
      },
      {
        id: "sharing",
        tab: "Who can see",
        heading: "Sharing, controlled by the person taking the medication",
        body: "Nothing leaves the house until someone is invited. Every permission is separate \u2014 including the one that lets a caregiver operate the dispenser.",
        points: ["Invite by name, one person at a time", "Viewing and controlling are different permissions", "Withdraw access without deleting your own history"],
        screen: {
          title: "Sharing", sub: "Priya (daughter)",
          blocks: [
            { t: "switch", label: "See today\u2019s schedule", hint: "Medicine names and times", on: true },
            { t: "switch", label: "Notify if a dose is missed", hint: "After the window closes", on: true },
            { t: "switch", label: "See full dose history", hint: "All past entries", on: false },
            { t: "switch", label: "Release a compartment remotely", hint: "Can open the dispenser from her phone", on: false },
            { t: "note", text: "Remote release is its own permission. Seeing the schedule never implies control of the device." }
          ]
        }
      },
      {
        id: "device",
        tab: "Device",
        heading: "Device status and setup",
        body: "Power and connection state in one place, so an unplugged or offline dispenser is easy to notice \u2014 from either phone.",
        points: ["Battery level and charging state", "Online or offline indicator", "Guided first-time setup"],
        screen: {
          title: "Device", sub: "MediDose dispenser",
          blocks: [
            { t: "switch", label: "Battery", hint: "82% \u2014 running on battery", on: true },
            { t: "switch", label: "Connection", hint: "Online \u00b7 home Wi-Fi", on: true },
            { t: "switch", label: "Sound", hint: "Reminder tone at medium volume", on: true },
            { t: "switch", label: "Compartment lock", hint: "Currently off", on: false },
            { t: "note", text: "Offline behaviour is described in the FAQ below." }
          ]
        }
      }
    ],

    /* Screens in an invited caregiver's app. Separate on purpose:
       this is a different person, on a different phone, with a different job. */
    caregiverScreens: [
      {
        id: "checkin",
        tab: "Check in",
        heading: "See the day without asking for it",
        body: "Open the app and the question is already answered. No daily phone call that both of you know is really about tablets.",
        points: ["Today\u2019s doses and what has been acknowledged", "The dispenser\u2019s power and connection state", "Only what you have been given permission to see"],
        screen: {
          title: "Mum\u2019s day", sub: "Dispenser at home \u00b7 online",
          blocks: [
            { t: "banner", title: "Morning dose taken", text: "8:04 AM at the dispenser" },
            { t: "dose", time: "8:04 AM", name: "Morning dose", meta: "2 compartments", status: "taken", statusText: "Taken" },
            { t: "dose", time: "1:00 PM", name: "Midday tablet", meta: "Slot 4", status: "due", statusText: "Due soon", due: true },
            { t: "dose", time: "9:00 PM", name: "Evening tablet", meta: "Slot 3", status: "muted", statusText: "Later" },
            { t: "note", text: "You see this because it was shared with you, and it can be unshared at any time." }
          ]
        }
      },
      {
        id: "alerts",
        tab: "Notifications",
        heading: "Told when it matters, not constantly",
        body: "A notification when a dose is acknowledged, or when a dose window closed without one. That is the whole of it \u2014 no scores, no inferences about anyone\u2019s health.",
        points: ["Acknowledged, late and missed events", "Each notification names the dose and the time", "Not an emergency alert, and never routed to emergency services"],
        screen: {
          title: "Notifications", sub: "Last 2 days",
          blocks: [
            { t: "section", text: "Today" },
            { t: "dose", time: "8:04 AM", name: "Morning dose taken", meta: "Acknowledged at the dispenser", status: "taken", statusText: "Taken" },
            { t: "section", text: "Yesterday" },
            { t: "dose", time: "1:35 PM", name: "Midday dose missed", meta: "Window closed with no acknowledgement", status: "missed", statusText: "Missed" },
            { t: "dose", time: "9:12 PM", name: "Evening dose taken", meta: "12 minutes late", status: "due", statusText: "Late" },
            { t: "note", text: "A missed-dose notification means the device recorded nothing. It does not mean anything is wrong." }
          ]
        }
      },
      {
        id: "release",
        tab: "Remote release",
        heading: "Open a compartment from your phone",
        body: "For the times the screen is too much \u2014 a bad day, stiff hands, confusion about which slot. You release the compartment; they still take the medicine themselves.",
        points: ["Only with the separate permission granted to you", "Names the compartment and medicine before you confirm", "Recorded in the history as released by you"],
        screen: {
          title: "Release a compartment", sub: "Requires permission from your mother",
          blocks: [
            { t: "banner", title: "Compartment 3 \u00b7 Evening tablet", text: "Confirm to open the drawer at home." },
            { t: "switch", label: "Dispenser is online", hint: "Needed to release remotely", on: true },
            { t: "switch", label: "You have release permission", hint: "Granted 12 August", on: true },
            { t: "note", text: "Releasing opens a drawer in a house you are not in. It cannot tell whether anyone is there, whether the medicine was picked up, or whether it was taken. Do not use it in place of being present when that is what is needed." }
          ]
        }
      }
    ],

    caregiverPoints: [
      { icon: "home",   title: "Check the house from wherever you are", body: "Today\u2019s doses, what has been acknowledged, and whether the dispenser is still online \u2014 answered before you ask. Especially when there is no sibling to split the asking with." },
      { icon: "bell",   title: "A notification when it matters", body: "You are told that a dose was acknowledged, or that a window closed without one. Nothing further is inferred from that, and nothing is escalated." },
      { icon: "unlock", title: "Help from a distance, with permission", body: "On a difficult day you can release a compartment from your phone. It is a separate permission your parent grants and can withdraw \u2014 being able to see the schedule never means being able to operate the device." },
      { icon: "share",  title: "They stay in charge of all of it", body: "There is no default caregiver. Every permission is granted by the person taking the medication, itemised rather than bundled, and reversible immediately." }
    ],

    benefits: [
      { icon: "sun",     title: "A simpler day at home", body: "One box, one screen, one press. The routine belongs to the person taking the medication, not to whoever remembered to phone." },
      { icon: "heart",   title: "Independence that does not mean alone", body: "Support that can be switched on for a hard day and switched off again, instead of a permanent handover of control." },
      { icon: "pin",     title: "Peace of mind at a distance", body: "The daily question \u2014 did they take it? \u2014 gets answered on your phone rather than in a phone call neither of you enjoys." },
      { icon: "phone",   title: "Fewer check-in calls", body: "When the basics are visible, the conversation can be about something other than tablets." },
      { icon: "history", title: "A record worth showing someone", body: "A written history of acknowledgements makes it easier to spot a pattern and raise it with a pharmacist or GP." },
      { icon: "users",   title: "Shared care without a group chat", body: "Siblings and other family see the same itemised permissions, so nobody is guessing who is covering what." }
    ],

    trust: [
      { title: "Sharing is off until they turn it on", body: "There is no default caregiver. The person taking the medication invites people and chooses, item by item, what each can see. We are designing to collect only what the described features need." },
      { title: "Seeing is not controlling", body: "Remote release is a separate permission from viewing the schedule. Granting one never grants the other, and either can be withdrawn on its own, immediately." },
      { title: "Remote release opens a drawer, nothing more", body: "It cannot tell whether anyone is in the room, whether the medicine was picked up, or whether it was taken. It should not be used in place of someone being there when that is what is actually needed \u2014 and an open compartment in an empty house is a risk you have to weigh yourself." },
      { title: "Not an emergency-response system", body: "MediDose does not call for help, contact emergency services, or monitor health. A missed-dose notification is a notification and nothing more. It should never be the thing standing between someone and help." },
      { title: "Schedules belong to the professionals who set them", body: "Any schedule entered into the app should be checked against instructions from a doctor or pharmacist. MediDose does not review prescriptions, dosages or interactions." },
      { title: "An early-stage concept, described as one", body: "Everything here is proposed for a first version and subject to change. Nothing has been clinically validated, and MediDose is not a certified or approved medical device. We will say plainly if that ever changes." }
    ],

    roles: [
      { value: "",                        label: "Select the option that fits best" },
      { value: "medication-user",         label: "I take medication on a schedule" },
      { value: "caregiver",               label: "I care for a parent or relative" },
      { value: "healthcare-professional", label: "Healthcare professional" },
      { value: "organization",            label: "Home-care, clinic or pharmacy" }
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
        a: "Households, first and foremost \u2014 an older parent living independently at home, and the family who worry about them from somewhere else. It is built for the adult child who moved away for work, and particularly for the only child with no sibling to share the asking with. Home-care teams supporting people in their own homes may find it useful too, but this is not built for care-home wards."
      },
      {
        q: "Can I really check on my parent from another city?",
        a: "That is the point of it. With their permission your app shows today\u2019s doses, which have been acknowledged, and whether the dispenser is powered and online. You get a notification when a dose is acknowledged or when a window closes without one. What you cannot do is see anything they have not chosen to share, and none of it is health monitoring \u2014 it is a record of button presses on a box."
      },
      {
        q: "Can a caregiver dispense medication remotely?",
        a: "The proposal is that an invited caregiver can release a compartment from their phone, if the person taking the medication has granted that specific permission. It is deliberately separate from permission to view the schedule, so seeing the day never implies control of the device. Be clear about what it does: it opens a drawer in a house you are not standing in. It does not hand anyone a tablet."
      },
      {
        q: "What if nobody is there when a compartment is released?",
        a: "Then an open compartment sits there until someone comes to it. The dispenser cannot tell whether anyone is in the room, and medication left accessible is a real risk if there are children, visitors or pets in the house. This is exactly why remote release is off by default, is its own permission, and is described here as opening a drawer rather than giving a dose. If someone needs a person present to take their medication safely, remote release is not a substitute for that person."
      },
      {
        q: "What types of medication can it hold?",
        a: "The concept is built around solid oral medication \u2014 tablets and capsules that someone already sorts by hand into a pill box. It is not designed for liquids, injectables, refrigerated medicines, inhalers, or anything needing special handling. Compartment size and capacity are still being worked out, and some medicines will not be suitable."
      },
      {
        q: "Does it work without internet access?",
        a: "The intent is that the schedule lives on the device, so the reminder, the screen and the compartment opening all keep working while it is offline. What stops is anything that crosses the internet: syncing to the apps, your notifications, and remote release \u2014 you cannot open a compartment in a house whose dispenser is offline. Those resume when it reconnects. This behaviour is proposed and has not been built or tested yet."
      },
      {
        q: "Can caregivers see every medication event?",
        a: "Only what they have been given. Sharing is off until someone is invited, and permissions are itemised: today\u2019s schedule, missed-dose notifications, full history and remote release are four separate switches. Any of them can be turned off again at any time, and turning one off does not delete the user\u2019s own record."
      },
      {
        q: "What happens if a dose is missed?",
        a: "If the window closes without an acknowledgement, the app records it as missed and, where that permission has been granted, notifies the caregiver. That is the whole of it. MediDose does not escalate, does not contact emergency services, and should not be relied on as a safety net for someone who needs one."
      },
      {
        q: "Is MediDose a certified medical device?",
        a: "No. MediDose is an early-stage concept. It is not certified, approved or cleared by any regulator, it has not been clinically evaluated, and we are not claiming otherwise. It does not diagnose, prescribe or treat, and it is not a substitute for advice from a doctor or pharmacist."
      },
      {
        q: "When will early access begin?",
        a: "We do not have a date. We are validating the idea and working out what families actually need, which is what this list is for. If you join it we will contact you when there is something concrete to show \u2014 and we will not use your details for anything else."
      }
    ],

    footer: {
      product:   [{ href: "#dispenser", label: "Dispenser" }, { href: "#app", label: "Mobile app" }, { href: "#caregivers", label: "From a distance" }, { href: "#benefits", label: "Benefits" }],
      learn:     [{ href: "#how-it-works", label: "How it works" }, { href: "#problem", label: "Why MediDose" }, { href: "#trust", label: "Trust & safety" }, { href: "#faq", label: "FAQ" }],
      company:   [{ href: "#early-access", label: "Early access" }, { href: "mailto:hello@medidose.example", label: "Contact" }, { href: "privacy.html", label: "Privacy" }, { href: "terms.html", label: "Terms" }]
    }
  };

  root.MediDose = root.MediDose || {};
  root.MediDose.data = data;
  root.MediDose.icon = icon;
})(window);

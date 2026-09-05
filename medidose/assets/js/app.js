/* =============================================================
   MediDose — behaviour
   -------------------------------------------------------------
   Mounts components, then wires: navigation, the step stage, the
   app-preview tabs, the FAQ accordion, form validation and reveals.
   Nothing here talks to a network. See submitEarlyAccess().
   ============================================================= */
(function (root, doc) {
  "use strict";

  var MD = root.MediDose;
  var D = MD.data;
  var C = MD.components;

  var $  = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* -----------------------------------------------------------
     Analytics shim
     Pushes to window.dataLayer if a tag manager is ever added, and
     no-ops otherwise. No third-party script is loaded by this page —
     shipping one would contradict the privacy copy in the trust
     section, so wiring that up is a deliberate later decision.
     ----------------------------------------------------------- */
  function track(event, props) {
    var payload = { event: event };
    for (var k in props) if (Object.prototype.hasOwnProperty.call(props, k)) payload[k] = props[k];
    (root.dataLayer = root.dataLayer || []).push(payload);
  }
  MD.track = track;

  doc.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-analytics]") : null;
    if (t) track(t.getAttribute("data-analytics"), { label: (t.textContent || "").trim().slice(0, 60) });
  });

  /* -----------------------------------------------------------
     Mount content
     ----------------------------------------------------------- */
  function mount(sel, html) { var n = $(sel); if (n) n.innerHTML = html; }

  function mountAll() {
    mount("[data-mount=nav]", D.nav.map(function (l) {
      return '<li><a class="nav__link" href="' + C.esc(l.href) + '">' + C.esc(l.label) + "</a></li>";
    }).join(""));

    mount("[data-mount=mobile-nav]", D.nav.map(function (l) {
      return '<li><a class="mobile-nav__link" href="' + C.esc(l.href) + '">' + C.esc(l.label) + "</a></li>";
    }).join(""));

    mount("[data-mount=audience]", D.audience.map(function (a) { return "<li>" + C.esc(a) + "</li>"; }).join(""));
    mount("[data-mount=hero-dispenser]", C.dispenser("hero"));
    mount("[data-mount=hero-phone]", C.phone(D.heroScreen, "Mockup of the MediDose app showing today's medication schedule"));

    mount("[data-mount=problems]", D.problems.map(C.problemCard).join(""));
    mount("[data-mount=timeline]", D.steps.map(C.timelineItem).join(""));
    mount("[data-mount=step-dispenser]", C.dispenser("step"));
    mount("[data-mount=step-phone]", C.phone(D.steps[0].screen, "Mockup of the MediDose app for the selected step"));

    mount("[data-mount=dispenser-features]", D.dispenserFeatures.map(C.featureCard).join(""));
    mount("[data-mount=app-tabs-user]", D.appScreens.map(function (s, i) { return C.tabButton(s, i, "user"); }).join(""));
    mount("[data-mount=app-phone-user]", C.phone(D.appScreens[0].screen, "Mockup of the MediDose app for the person taking medication"));

    mount("[data-mount=app-tabs-caregiver]", D.caregiverScreens.map(function (s, i) { return C.tabButton(s, i, "caregiver"); }).join(""));
    mount("[data-mount=app-phone-caregiver]", C.phone(D.caregiverScreens[0].screen, "Mockup of the MediDose app as an invited caregiver sees it"));

    mount("[data-mount=caregiver-points]", D.caregiverPoints.map(C.caregiverPoint).join(""));
    mount("[data-mount=benefits]", D.benefits.map(C.benefitCard).join(""));
    mount("[data-mount=trust]", D.trust.map(C.trustItem).join(""));
    mount("[data-mount=faq]", D.faqs.map(C.faqItem).join(""));

    mount("[data-mount=role-options]", D.roles.map(C.option).join(""));
    mount("[data-mount=meds-options]", D.medCounts.map(C.option).join(""));

    mount("[data-mount=footer-product]", C.linkList(D.footer.product));
    mount("[data-mount=footer-learn]", C.linkList(D.footer.learn));
    mount("[data-mount=footer-company]", C.linkList(D.footer.company));

    $$("[data-icon]").forEach(function (n) {
      n.innerHTML = C.icon(n.getAttribute("data-icon"), parseInt(n.getAttribute("data-icon-size"), 10) || 24);
    });
  }

  /* -----------------------------------------------------------
     Header navigation
     ----------------------------------------------------------- */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var panel = $("[data-mobile-nav]");
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      toggle.querySelector("[data-nav-toggle-icon]").innerHTML = C.icon(open ? "close" : "menu", 22);
      toggle.querySelector("[data-nav-toggle-text]").textContent = open ? "Close" : "Menu";
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus(); // returning focus is the part that is easy to forget
      }
    });

    setOpen(false);

    // Mark the section currently in view, for orientation rather than decoration.
    var links = $$(".nav__link");
    var byHash = {};
    links.forEach(function (a) { byHash[a.getAttribute("href")] = a; });

    var sections = D.nav.map(function (l) { return doc.getElementById(l.href.slice(1)); }).filter(Boolean);
    if (!("IntersectionObserver" in root) || !sections.length) return;

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = byHash["#" + en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute("aria-current"); });
          a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* -----------------------------------------------------------
     Shared tablist behaviour (roving tabindex + arrow keys)
     Used by both the how-it-works timeline and the app preview.
     ----------------------------------------------------------- */
  function initTablist(tabs, onSelect) {
    if (!tabs.length) return;

    function select(i, focus) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute("aria-selected", String(on));
        t.setAttribute("tabindex", on ? "0" : "-1");
      });
      if (focus) tabs[i].focus();
      onSelect(i);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i, false); });
      tab.addEventListener("keydown", function (e) {
        var last = tabs.length - 1, next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = i === last ? 0 : i + 1;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = i === 0 ? last : i - 1;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = last;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    select(0, false);
  }

  /* -----------------------------------------------------------
     How it works — the step stage
     ----------------------------------------------------------- */
  function paintDispenser(svg, state) {
    if (!svg) return;
    svg.classList.toggle("is-alerting", !!state.alerting);

    for (var i = 0; i < 7; i++) {
      var ring = svg.querySelector('[data-slot="' + i + '"]');
      var label = svg.querySelector('[data-slot-label="' + i + '"]');
      var isActive = state.active === i;
      var isLoaded = (state.loaded || []).indexOf(i) !== -1;
      if (ring) {
        ring.classList.toggle("is-active", isActive);
        ring.classList.toggle("is-loaded", isLoaded && !isActive);
      }
      if (label) label.classList.toggle("is-active", isActive);
    }

    var l1 = svg.querySelector("[data-line1]");
    var l2 = svg.querySelector("[data-line2]");
    if (l1) l1.textContent = state.l1;
    if (l2) l2.textContent = state.l2;
  }

  function initSteps() {
    var tabs = $$("[data-step]");
    var svg = $("[data-mount=step-dispenser] [data-dispenser]");
    var phoneScreen = $("[data-mount=step-phone] [data-phone-screen]");
    var live = $("[data-step-live]");
    if (!tabs.length) return;

    initTablist(tabs, function (i) {
      var step = D.steps[i];
      paintDispenser(svg, step.dispenser);
      if (phoneScreen) phoneScreen.innerHTML = C.phoneScreen(step.screen);
      if (live) {
        live.textContent = "Step " + step.num + " of " + D.steps.length + ". " + step.title + ". " +
          "Dispenser display reads " + step.dispenser.l1 + ", " + step.dispenser.l2 + "." +
          (step.dispenser.active !== null ? " Compartment " + (step.dispenser.active + 1) + " is highlighted." : "");
      }
      track("step_view", { step: step.num });
    });
  }

  /* -----------------------------------------------------------
     Mobile app preview
     ----------------------------------------------------------- */
  function initAppPreview(group, screens) {
    var tabs = $$('[data-app-tab="' + group + '"]');
    var phoneScreen = $("[data-mount=app-phone-" + group + "] [data-phone-screen]");
    var heading = $('[data-app-heading="' + group + '"]');
    var body = $('[data-app-body="' + group + '"]');
    var points = $('[data-app-points="' + group + '"]');
    if (!tabs.length) return;

    initTablist(tabs, function (i) {
      var s = screens[i];
      if (phoneScreen) phoneScreen.innerHTML = C.phoneScreen(s.screen);
      if (heading) heading.textContent = s.heading;
      if (body) body.textContent = s.body;
      if (points) {
        points.innerHTML = s.points.map(function (p) {
          return "<li>" + C.icon("check", 22) + "<span>" + C.esc(p) + "</span></li>";
        }).join("");
      }
      track("app_preview_view", { group: group, screen: s.id });
    });
  }

  /* -----------------------------------------------------------
     FAQ accordion
     ----------------------------------------------------------- */
  function initFaq() {
    $$(".faq__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        var panel = doc.getElementById(btn.getAttribute("aria-controls"));
        if (panel) panel.hidden = open;
        if (!open) track("faq_open", { question: btn.textContent.trim().slice(0, 80) });
      });
    });
  }

  /* -----------------------------------------------------------
     Early-access form
     ----------------------------------------------------------- */
  var RULES = {
    name: function (v) {
      if (!v.trim()) return "Enter the name you would like us to use.";
      if (v.trim().length < 2) return "That looks too short — please enter at least 2 characters.";
      return "";
    },
    email: function (v) {
      if (!v.trim()) return "Enter an email address so we can reach you.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "That does not look like an email address. Check for a missing @ or a typo.";
      return "";
    },
    role: function (v) { return v ? "" : "Choose the option that best describes you."; },
    meds: function (v) { return v ? "" : "Choose a range, or select “Prefer not to say”."; },
    feedback: function (v) { return v.length > 1000 ? "Please keep this under 1000 characters." : ""; },
    consent: function (v, field) { return field.checked ? "" : "Please confirm you are happy for us to contact you about early access."; }
  };

  var LABELS = { name: "Name", email: "Email", role: "Which describes you", meds: "Medications per day", feedback: "Anything else", consent: "Consent" };

  /* No endpoint is wired up. This preview deliberately does not transmit
     or persist anything a visitor types — the form exists to prove the
     flow, and health-adjacent details should not sit in localStorage.
     To go live: POST `values` to your endpoint here and handle failure. */
  function submitEarlyAccess(values) {
    track("early_access_submit", { role: values.role, meds: values.meds });
    return Promise.resolve({ ok: true });
  }

  function initForm() {
    var form = $("[data-form]");
    if (!form) return;

    var summary = $("[data-form-summary]");
    var summaryList = $("[data-form-summary-list]");
    var confirmation = $("[data-confirmation]");
    var confirmName = $("[data-confirmation-name]");
    var touched = {};

    function fieldOf(name) { return form.elements[name]; }
    function errorNode(name) { return $('[data-error-for="' + name + '"]', form); }

    function validateField(name) {
      var field = fieldOf(name);
      if (!field) return "";
      var value = field.type === "checkbox" ? String(field.checked) : field.value;
      var msg = RULES[name](value, field);
      var node = errorNode(name);

      if (msg) {
        field.setAttribute("aria-invalid", "true");
        if (node) node.innerHTML = C.icon("alert", 16) + "<span>" + C.esc(msg) + "</span>";
      } else {
        field.removeAttribute("aria-invalid");
        if (node) node.innerHTML = "";
      }
      return msg;
    }

    Object.keys(RULES).forEach(function (name) {
      var field = fieldOf(name);
      if (!field) return;
      // Validate on blur first, then live once the field has been touched —
      // validating on every keystroke from the start is just nagging.
      field.addEventListener("blur", function () { touched[name] = true; validateField(name); });
      field.addEventListener("change", function () { touched[name] = true; validateField(name); });
      field.addEventListener("input", function () { if (touched[name]) validateField(name); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var errors = [];
      Object.keys(RULES).forEach(function (name) {
        touched[name] = true;
        var msg = validateField(name);
        if (msg) errors.push({ name: name, msg: msg });
      });

      if (errors.length) {
        if (summary && summaryList) {
          summaryList.innerHTML = errors.map(function (er) {
            return '<li><a href="#field-' + er.name + '">' + C.esc(LABELS[er.name]) + ": " + C.esc(er.msg) + "</a></li>";
          }).join("");
          summary.hidden = false;
          summary.focus();
        }
        track("early_access_error", { fields: errors.length });
        return;
      }

      if (summary) summary.hidden = true;

      var values = {
        name: fieldOf("name").value.trim(),
        email: fieldOf("email").value.trim(),
        role: fieldOf("role").value,
        meds: fieldOf("meds").value,
        feedback: fieldOf("feedback").value.trim(),
        consent: fieldOf("consent").checked
      };

      var submitBtn = $("[data-submit]", form);
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

      submitEarlyAccess(values).then(function () {
        if (confirmName) confirmName.textContent = values.name;
        form.hidden = true;
        if (confirmation) {
          confirmation.hidden = false;
          confirmation.focus();
        }
      });
    });

    // Summary links move focus to the field, not just the anchor.
    if (summaryList) {
      summaryList.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        if (!a) return;
        e.preventDefault();
        var field = fieldOf(a.getAttribute("href").replace("#field-", ""));
        if (field) field.focus();
      });
    }
  }

  /* -----------------------------------------------------------
     Scroll reveal — gated on .js so content is never hidden
     when scripting is unavailable.
     ----------------------------------------------------------- */
  function initReveal() {
    var nodes = $$(".reveal");
    if (!nodes.length) return;

    if (!("IntersectionObserver" in root)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // Small stagger reads as one group settling rather than items popping.
        setTimeout(function () { el.classList.add("is-in"); }, Math.min(i, 5) * 60);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    nodes.forEach(function (n) { io.observe(n); });
  }

  function init() {
    mountAll();
    initNav();
    initSteps();
    initAppPreview("user", D.appScreens);
    initAppPreview("caregiver", D.caregiverScreens);
    initFaq();
    initForm();
    initReveal();
    doc.documentElement.classList.add("is-ready");
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);

/* =============================================================
   MediDose — presentational components
   -------------------------------------------------------------
   Every function here takes plain data and returns an HTML string.
   No component reads global state and none of them attach events;
   behaviour lives in app.js. That split is what makes them reusable
   across the hero, the how-it-works stage and the app preview.
   ============================================================= */
(function (root) {
  "use strict";

  var MD = root.MediDose = root.MediDose || {};
  var icon = MD.icon;

  /* Escape anything that reaches innerHTML. The content is ours today,
     but these render helpers are meant to survive a CMS later. */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Small pieces ---------- */

  function pill(status, text) {
    var map = { taken: "pill--taken", due: "pill--due", missed: "pill--missed", muted: "pill--muted" };
    return '<span class="pill ' + (map[status] || "pill--muted") + '">' + esc(text) + "</span>";
  }

  function doseRow(b) {
    return '' +
      '<div class="dose-row' + (b.due ? " dose-row--due" : "") + '">' +
        '<span class="dose-row__time">' + esc(b.time) + "</span>" +
        '<span class="dose-row__body">' +
          '<span class="dose-row__name">' + esc(b.name) + "</span>" +
          '<span class="dose-row__meta">' + esc(b.meta) + "</span>" +
        "</span>" +
        pill(b.status, b.statusText) +
      "</div>";
  }

  function switchRow(b) {
    return '' +
      '<div class="switch-row">' +
        "<span>" +
          '<span class="switch-row__label">' + esc(b.label) + "</span><br>" +
          '<span class="switch-row__hint">' + esc(b.hint) + "</span>" +
        "</span>" +
        '<span class="switch' + (b.on ? " is-on" : "") + '"></span>' +
      "</div>";
  }

  function banner(b) {
    return '<div class="phone__banner"><strong>' + esc(b.title) + "</strong><span>" + esc(b.text) + "</span></div>";
  }

  var blockRenderers = {
    dose: doseRow,
    switch: switchRow,
    banner: banner,
    note: function (b) { return '<p class="phone__note">' + esc(b.text) + "</p>"; },
    section: function (b) { return '<p class="switch-row__hint" style="font-weight:700;letter-spacing:.04em;text-transform:uppercase">' + esc(b.text) + "</p>"; }
  };

  /* ---------- Phone mockup ----------
     Rendered as real HTML inside a CSS frame rather than as SVG, so the
     mockup text scales with the user's font size and stays selectable. */
  function phoneScreen(screen) {
    var body = (screen.blocks || []).map(function (b) {
      var fn = blockRenderers[b.t];
      return fn ? fn(b) : "";
    }).join("");

    return '' +
      '<div class="phone__bar">' +
        "<span>9:41</span>" +
        '<span class="phone__bar-icons">' + icon("wifi", 14) + icon("battery", 14) + "</span>" +
      "</div>" +
      '<div class="phone__head">' +
        '<p class="phone__title">' + esc(screen.title) + "</p>" +
        '<p class="phone__sub">' + esc(screen.sub) + "</p>" +
      "</div>" +
      '<div class="phone__body">' + body + "</div>";
  }

  function phone(screen, label) {
    return '' +
      '<div class="phone" role="img" aria-label="' + esc(label) + '">' +
        '<div class="phone__screen" data-phone-screen>' + phoneScreen(screen) + "</div>" +
      "</div>";
  }

  /* ---------- Dispenser mockup ----------
     Ring geometry is precomputed: radius 96, circumference 603.186,
     seven slots of 86.169 with an 11-unit gap => dash 75.169.
     The SVG is decorative; the state it shows is also written into a
     live region by app.js so it is not lost to assistive tech. */
  var RING = { dash: 75.169, rest: 528.016, offsets: [0, -86.169, -172.339, -258.508, -344.678, -430.847, -517.016] };
  var LABEL_POS = [
    [201.65, 103.51], [253.59, 168.64], [235.06, 249.86], [160, 286],
    [84.94, 249.86], [66.41, 168.64], [118.35, 103.51]
  ];

  function dispenser(idPrefix) {
    var rings = "", labels = "";
    for (var i = 0; i < 7; i++) {
      rings += '<circle class="slot" data-slot="' + i + '" cx="160" cy="190" r="96" fill="none" ' +
        'stroke-width="26" stroke-linecap="butt" ' +
        'stroke-dasharray="' + RING.dash + " " + RING.rest + '" ' +
        'stroke-dashoffset="' + RING.offsets[i] + '"/>';
      labels += '<text class="slot-label" data-slot-label="' + i + '" ' +
        'x="' + LABEL_POS[i][0] + '" y="' + LABEL_POS[i][1] + '" text-anchor="middle" ' +
        'dominant-baseline="central" font-size="20" font-weight="700">' + (i + 1) + "</text>";
    }

    return '' +
    '<svg class="dispenser" data-dispenser viewBox="0 0 320 400" aria-hidden="true" focusable="false">' +
      "<defs>" +
        '<linearGradient id="' + idPrefix + '-shell" x1="0" y1="0" x2="0.4" y2="1">' +
          '<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3EFF6"/>' +
        "</linearGradient>" +
        '<linearGradient id="' + idPrefix + '-hub" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F5FAFD"/>' +
        "</linearGradient>" +
      "</defs>" +

      // shell
      '<rect x="14" y="12" width="292" height="376" rx="54" fill="url(#' + idPrefix + '-shell)" stroke="#C4D9E6" stroke-width="2"/>' +

      // reminder halo, revealed by .is-alerting
      '<circle class="ring-glow" cx="160" cy="190" r="118" fill="none" stroke="#0F6FA3" stroke-width="5"/>' +

      // dial face: rings rotate so slot 1 starts at the top; labels stay upright
      '<circle cx="160" cy="190" r="112" fill="#FFFFFF" stroke="#E1EDF4" stroke-width="2"/>' +
      '<g transform="rotate(-90 160 190)">' + rings + "</g>" +
      "<g>" + labels + "</g>" +

      // hub carries the on-device message
      '<circle cx="160" cy="190" r="64" fill="url(#' + idPrefix + '-hub)" stroke="#D3E3EE" stroke-width="2"/>' +
      '<text class="screen-line" data-line1 x="160" y="182" text-anchor="middle" font-size="17" font-weight="700" fill="#0E2A3A">Ready</text>' +
      '<text class="screen-line" data-line2 x="160" y="206" text-anchor="middle" font-size="13" fill="#3D5A6C">MediDose</text>' +

      // status strip
      '<g transform="translate(56 332)">' +
        '<rect x="0" y="0" width="208" height="40" rx="20" fill="#FFFFFF" stroke="#D3E3EE" stroke-width="2"/>' +
        '<g transform="translate(20 12)" stroke="#3D5A6C" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M1 8.5a9 9 0 0 1 11 0"/><path d="M-1.9 5.6a13 13 0 0 1 16.8 0"/><circle cx="6.5" cy="12" r="1"/>' +
        "</g>" +
        '<text x="46" y="25" font-size="13" fill="#3D5A6C" font-weight="700">Connected</text>' +
        '<rect x="146" y="14" width="26" height="13" rx="4" fill="none" stroke="#3D5A6C" stroke-width="2"/>' +
        '<rect x="149" y="17" width="16" height="7" rx="2" fill="#1E6B45"/>' +
        '<rect x="174" y="18" width="3" height="5" rx="1.5" fill="#3D5A6C"/>' +
      "</g>" +

      // physical acknowledge button
      '<circle cx="160" cy="60" r="18" fill="#FFFFFF" stroke="#C4D9E6" stroke-width="2"/>' +
      '<path d="M153 60l5 5 9-10" fill="none" stroke="#0B5D8C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  }

  /* ---------- Section-level components ---------- */

  function problemCard(p) {
    return '' +
      '<article class="card reveal">' +
        '<span class="card__icon">' + icon(p.icon, 26) + "</span>" +
        "<h3>" + esc(p.title) + "</h3>" +
        "<p>" + esc(p.body) + "</p>" +
      "</article>";
  }

  function featureCard(f) {
    return '' +
      '<article class="card card--teal reveal">' +
        '<span class="card__icon">' + icon(f.icon, 26) + "</span>" +
        "<h3>" + esc(f.title) + "</h3>" +
        "<p>" + esc(f.body) + "</p>" +
      "</article>";
  }

  function benefitCard(b) {
    return '' +
      '<article class="benefit reveal">' +
        '<span class="benefit__icon">' + icon(b.icon, 24) + "</span>" +
        "<div><h3>" + esc(b.title) + "</h3><p>" + esc(b.body) + "</p></div>" +
      "</article>";
  }

  function trustItem(t) {
    return '<article class="trust-item reveal"><h3>' + esc(t.title) + "</h3><p>" + esc(t.body) + "</p></article>";
  }

  function caregiverPoint(c) {
    return '' +
      '<li class="benefit reveal">' +
        '<span class="benefit__icon">' + icon(c.icon, 24) + "</span>" +
        "<div><h3>" + esc(c.title) + "</h3><p>" + esc(c.body) + "</p></div>" +
      "</li>";
  }

  function timelineItem(step, i) {
    return '' +
      '<li class="timeline__item" role="presentation">' +
        '<button class="timeline__btn" type="button" role="tab" id="step-tab-' + step.num + '" ' +
          'aria-controls="step-panel" aria-selected="' + (i === 0 ? "true" : "false") + '" ' +
          'tabindex="' + (i === 0 ? "0" : "-1") + '" data-step="' + i + '">' +
          '<span class="timeline__num" aria-hidden="true">' + step.num + "</span>" +
          "<span>" +
            '<span class="timeline__title"><span class="visually-hidden">Step ' + step.num + ": </span>" + esc(step.title) + "</span>" +
            '<span class="timeline__desc">' + esc(step.desc) + "</span>" +
          "</span>" +
        "</button>" +
      "</li>";
  }

  function tabButton(s, i) {
    return '' +
      '<button class="tab" type="button" role="tab" id="app-tab-' + esc(s.id) + '" ' +
        'aria-controls="app-panel" aria-selected="' + (i === 0 ? "true" : "false") + '" ' +
        'tabindex="' + (i === 0 ? "0" : "-1") + '" data-app-tab="' + i + '">' + esc(s.tab) + "</button>";
  }

  function faqItem(f, i) {
    return '' +
      '<div class="faq__item">' +
        "<h3>" +
          '<button class="faq__btn" type="button" id="faq-btn-' + i + '" aria-expanded="false" aria-controls="faq-panel-' + i + '">' +
            "<span>" + esc(f.q) + "</span>" +
            '<span class="faq__chev">' + icon("chevron", 24) + "</span>" +
          "</button>" +
        "</h3>" +
        '<div class="faq__panel" id="faq-panel-' + i + '" role="region" aria-labelledby="faq-btn-' + i + '" hidden>' +
          "<p>" + esc(f.a) + "</p>" +
        "</div>" +
      "</div>";
  }

  function linkList(items, cls) {
    return items.map(function (l) {
      return '<li><a class="' + (cls || "") + '" href="' + esc(l.href) + '">' + esc(l.label) + "</a></li>";
    }).join("");
  }

  function option(o) {
    return '<option value="' + esc(o.value) + '">' + esc(o.label) + "</option>";
  }

  MD.components = {
    esc: esc,
    icon: icon,
    phone: phone,
    phoneScreen: phoneScreen,
    dispenser: dispenser,
    problemCard: problemCard,
    featureCard: featureCard,
    benefitCard: benefitCard,
    trustItem: trustItem,
    caregiverPoint: caregiverPoint,
    timelineItem: timelineItem,
    tabButton: tabButton,
    faqItem: faqItem,
    linkList: linkList,
    option: option
  };
})(window);

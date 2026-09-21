(function () {
  "use strict";

  /* ---------- Langue ---------- */
  const root = document.documentElement;
  const savedLang = localStorage.getItem("hiptrip-lang");
  const browserLang = navigator.language && navigator.language.startsWith("en") ? "en" : "fr";
  const initialLang = savedLang || browserLang;
  setLang(initialLang);

  document.getElementById("langToggle").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-set-lang]");
    if (!btn) return;
    setLang(btn.getAttribute("data-set-lang"));
  });

  function setLang(lang) {
    root.setAttribute("lang", lang);
    localStorage.setItem("hiptrip-lang", lang);
    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-set-lang") === lang);
    });
  }

  /* ---------- Menu mobile ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", function () {
    mainNav.classList.toggle("open");
  });
  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
    });
  });

  /* ---------- Année du pied de page ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Spectacles ---------- */
  const MOIS_FR = ["JAN", "FÉV", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
  const MOIS_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // Source des spectacles : feuille Google Sheets publiée en CSV.
  // Si elle est inaccessible, on retombe sur la copie de secours (shows.js).
  const SHOWS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSMGBTUzItU_EPilfg-1BkI9gOc43iztG5NN51IqY4g9KdqT4_ExR5KYJbmIYkbM4xQzYo2Pa8fijr2/pub?output=csv";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function safeUrl(u) {
    return /^https?:\/\//i.test(u) ? u : "";
  }

  // "25" -> "25 $"; un texte libre (ex. "Gratuit") est laissé tel quel.
  function fmtPrice(v) {
    v = (v || "").trim();
    return /^\d+([.,]\d+)?$/.test(v) ? v + " $" : v;
  }

  // "21h00" -> "21 h 00"
  function fmtTime(v) {
    v = (v || "").trim();
    return v.replace(/^(\d{1,2})\s*[hH:]\s*(\d{2})?$/, function (_, h, m) {
      return h + " h " + (m || "00");
    });
  }

  // "2026-10-3" -> "2026-10-03"; retourne "" si la date est invalide.
  function fmtDate(v) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec((v || "").trim());
    if (!m) return "";
    return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    text = text.replace(/^﻿/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') quoted = false;
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function normKey(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  }

  function csvToShows(text) {
    const rows = parseCsv(text);
    if (rows.length === 0) return [];
    const head = rows[0].map(normKey);
    return rows.slice(1).map(function (r) {
      const o = {};
      head.forEach(function (k, i) { o[k] = (r[i] || "").trim(); });
      const city = [o.ville, o.province.toUpperCase()].filter(Boolean).join(", ");
      return {
        date: fmtDate(o.date),
        time: fmtTime(o.heure),
        venue: o.lieu,
        address: [o.adresse, city].filter(Boolean).join(", "),
        price: fmtPrice(o["prix en ligne"]),
        doorPrice: fmtPrice(o["prix a la porte"]),
        notes: { fr: o.note, en: o.note },
        ticketUrl: safeUrl(o["lien billets"])
      };
    }).filter(function (s) { return s.date && s.venue; });
  }

  function loadShows() {
    return fetch(SHOWS_CSV_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(csvToShows)
      .catch(function () { return window.SHOWS || []; });
  }

  function renderShows(shows) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = shows
      .filter(function (s) { return !s.hidden; })
      .filter(function (s) { return new Date(s.date + "T23:59:59") >= today; })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });

    // Un spectacle avec un ticketUrl est "en vente"; sans lien, billets bientôt.
    const onSale = upcoming.filter(function (s) { return s.ticketUrl; });
    const soon = upcoming.filter(function (s) { return !s.ticketUrl; });

    fillGroup("showsOnSale", onSale);
    fillGroup("showsSoon", soon);

    const empty = document.getElementById("showsEmpty");
    empty.hidden = upcoming.length > 0;
    if (upcoming.length === 0) {
      empty.innerHTML =
        '<div class="empty-state">' +
        '<p data-lang="fr">Aucun spectacle annoncé pour le moment. Suivez nos réseaux sociaux!</p>' +
        '<p data-lang="en">No shows announced right now. Follow us on social media!</p>' +
        "</div>";
    }
  }

  function fillGroup(id, shows) {
    const group = document.getElementById(id);
    group.hidden = shows.length === 0;
    document.getElementById(id + "List").innerHTML = shows.map(renderShowCard).join("");
  }

  function renderShowCard(show) {
    const d = new Date(show.date + "T00:00:00");
    const day = d.getDate();
    const monthFr = MOIS_FR[d.getMonth()];
    const monthEn = MOIS_EN[d.getMonth()];

    const ticketBtn = show.ticketUrl
      ? '<a class="btn btn-primary" href="' + esc(show.ticketUrl) + '" target="_blank" rel="noopener">' +
        '<span data-lang="fr">Acheter vos billets</span><span data-lang="en">Buy your tickets</span></a>'
      : "";

    const notesFr = show.notes && show.notes.fr ? '<div class="notes">' + esc(show.notes.fr) + "</div>" : "";
    const notesEn = show.notes && show.notes.en ? '<div class="notes">' + esc(show.notes.en) + "</div>" : "";

    const poster = show.poster
      ? '<img class="show-poster" src="' + esc(show.poster) + '" alt="' + esc(show.venue) + '" data-full="' + esc(show.poster) + '" />'
      : "";

    const doorPrice = show.doorPrice
      ? '<div class="price-door">' +
        '<span data-lang="fr">' + esc(show.doorPrice) + " à la porte</span>" +
        '<span data-lang="en">' + esc(show.doorPrice) + " at the door</span></div>"
      : "";

    return (
      '<div class="show-card">' +
        poster +
        '<div class="show-date">' +
          '<div class="day">' + day + "</div>" +
          '<div class="month" data-lang="fr">' + monthFr + "</div>" +
          '<div class="month" data-lang="en">' + monthEn + "</div>" +
        "</div>" +
        '<div class="show-info">' +
          '<div class="venue">' + esc(show.venue) + "</div>" +
          '<div class="meta">' + esc(show.address) + (show.time ? " · " + esc(show.time) : "") + "</div>" +
          notesFr.replace('class="notes"', 'class="notes" data-lang="fr"') +
          notesEn.replace('class="notes"', 'class="notes" data-lang="en"') +
        "</div>" +
        '<div class="show-actions">' +
          (show.price ? '<div class="price">' + esc(show.price) + "</div>" : "") +
          doorPrice +
          ticketBtn +
        "</div>" +
      "</div>"
    );
  }

  loadShows().then(renderShows);

  /* ---------- Lightbox photos ---------- */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  document.getElementById("gallery").addEventListener("click", function (e) {
    if (e.target.tagName !== "IMG") return;
    lightboxImg.src = e.target.getAttribute("data-full") || e.target.src;
    lightboxImg.alt = e.target.alt;
    lightbox.classList.add("open");
  });
  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
  }
  document.getElementById("spectacles").addEventListener("click", function (e) {
    if (!e.target.classList.contains("show-poster")) return;
    lightboxImg.src = e.target.getAttribute("data-full") || e.target.src;
    lightboxImg.alt = e.target.alt;
    lightbox.classList.add("open");
  });
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  /* ---------- Formulaire de contact (Formspree) ---------- */
  const form = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const STATUS_MSG = {
    fr: {
      ok: "Merci! Votre message a bien été envoyé.",
      err: "Oups, l'envoi a échoué. Écrivez-nous à info@thehiptrip.ca."
    },
    en: {
      ok: "Thank you! Your message has been sent.",
      err: "Oops, something went wrong. Email us at info@thehiptrip.ca."
    }
  };

  function syncFormFields(lang) {
    // Les champs de la langue inactive sont désactivés : ils ne bloquent pas
    // la validation (required) et ne sont pas envoyés en double.
    form.querySelectorAll("[data-lang]").forEach(function (el) {
      el.disabled = el.getAttribute("data-lang") !== lang;
    });
    formStatus.textContent = "";
  }
  syncFormFields(root.getAttribute("lang"));
  document.getElementById("langToggle").addEventListener("click", function () {
    syncFormFields(root.getAttribute("lang"));
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const lang = root.getAttribute("lang");
    const buttons = form.querySelectorAll("button[type=submit]");
    buttons.forEach(function (b) { b.disabled = true; });
    formStatus.className = "form-status";
    formStatus.textContent = "";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        formStatus.classList.add("ok");
        formStatus.textContent = STATUS_MSG[lang].ok;
      })
      .catch(function () {
        formStatus.classList.add("err");
        formStatus.textContent = STATUS_MSG[lang].err;
      })
      .finally(function () {
        buttons.forEach(function (b) { b.disabled = false; });
      });
  });
})();

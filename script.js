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

  function renderShows() {
    const list = document.getElementById("showsList");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = (window.SHOWS || [])
      .filter(function (s) { return !s.hidden; })
      .filter(function (s) { return new Date(s.date + "T23:59:59") >= today; })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });

    if (upcoming.length === 0) {
      list.innerHTML =
        '<div class="empty-state">' +
        '<p data-lang="fr">Aucun spectacle annoncé pour le moment. Suivez nos réseaux sociaux!</p>' +
        '<p data-lang="en">No shows announced right now. Follow us on social media!</p>' +
        "</div>";
      return;
    }

    list.innerHTML = upcoming.map(renderShowCard).join("");
  }

  function renderShowCard(show) {
    const d = new Date(show.date + "T00:00:00");
    const day = d.getDate();
    const monthFr = MOIS_FR[d.getMonth()];
    const monthEn = MOIS_EN[d.getMonth()];

    const ticketBtn = show.ticketUrl
      ? '<a class="btn btn-primary" href="' + show.ticketUrl + '" target="_blank" rel="noopener">' +
        '<span data-lang="fr">Billets</span><span data-lang="en">Tickets</span></a>'
      : "";

    const notesFr = show.notes && show.notes.fr ? '<div class="notes">' + show.notes.fr + "</div>" : "";
    const notesEn = show.notes && show.notes.en ? '<div class="notes">' + show.notes.en + "</div>" : "";

    const poster = show.poster
      ? '<img class="show-poster" src="' + show.poster + '" alt="' + show.venue + '" data-full="' + show.poster + '" />'
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
          '<div class="venue">' + show.venue + "</div>" +
          '<div class="meta">' + show.address + (show.time ? " · " + show.time : "") + "</div>" +
          notesFr.replace('class="notes"', 'class="notes" data-lang="fr"') +
          notesEn.replace('class="notes"', 'class="notes" data-lang="en"') +
        "</div>" +
        '<div class="show-actions">' +
          (show.price ? '<div class="price">' + show.price + "</div>" : "") +
          ticketBtn +
        "</div>" +
      "</div>"
    );
  }

  renderShows();

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
  document.getElementById("showsList").addEventListener("click", function (e) {
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

  /* ---------- Formulaire de contact (mailto) ---------- */
  const form = document.getElementById("contactForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const data = new FormData(form);
    const nom = data.get("nom") || "";
    const courriel = data.get("courriel") || "";
    const message = data.get("message") || "";
    const subject = encodeURIComponent("Message du site — " + nom);
    const body = encodeURIComponent(message + "\n\n— " + nom + " (" + courriel + ")");
    window.location.href = "mailto:info@thehiptrip.ca?subject=" + subject + "&body=" + body;
  });
})();

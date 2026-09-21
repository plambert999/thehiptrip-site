/*
  COPIE DE SECOURS DES SPECTACLES — The Hip Trip
  ===============================================
  La liste à jour se gère dans la feuille Google Sheets (voir SHOWS_CSV_URL
  dans script.js). Ce fichier ne sert que si la feuille est inaccessible.

  Pour ajouter un spectacle, copie un bloc { ... } ci-dessous, colle-le
  juste avant "];" et remplis tes informations. Pour en retirer un,
  supprime son bloc au complet (ou mets "hidden: true" pour le cacher
  temporairement).

  - date: format "AAAA-MM-JJ" (obligatoire, sert à trier et à savoir
    si le spectacle est à venir ou passé)
  - time: heure affichée, ex. "21 h 00"
  - venue: nom de la salle
  - address: adresse complète
  - city: ville (affichée sur les petits écrans)
  - price: prix des billets, ex. "25 $"
  - ticketUrl: lien vers les billets (laisser "" si pas de billetterie en ligne)
  - notes: { fr: "...", en: "..." } précision libre (ex. souper, admission générale)
  - poster: chemin vers une image d'affiche (optionnel), ex. "images/poster-sample.jpg"
*/

window.SHOWS = [
  {
    date: "2026-09-26",
    time: "21 h 00",
    venue: "Le BAM Pub Culturel",
    address: "71 Montée Gagnon, Bois-des-Filion",
    city: "Bois-des-Filion, QC",
    price: "25 $",
    ticketUrl: "",
    notes: {
      fr: "Tables pour souper ou admission générale à 20 h 50",
      en: "Dinner tables or general admission at 8:50 PM",
    },
    poster: "",
    hidden: false,
  },
];

// backend/config/categories.js

const categories = [
  {
    key: "juridisch",
    label: "Juridisch",
    specialties: [
      { key: "arbeidsrecht", label: "Arbeidsrecht" },
      { key: "ontslagrecht", label: "Ontslagrecht" },
      { key: "bestuursrecht", label: "Bestuursrecht" },
      { key: "huurrecht", label: "Huurrecht" },
      { key: "familierecht", label: "Familierecht" },
      { key: "sociaal_zekerheidsrecht", label: "Sociaal zekerheidsrecht" },
    ],
  },
  {
    key: "bouw",
    label: "Bouw & Wonen",
    specialties: [
      { key: "aannemer", label: "Aannemer" },
      { key: "installateur", label: "Installateur" },
      { key: "dakdekker", label: "Dakdekker" },
      { key: "loodgieter", label: "Loodgieter" },
      { key: "elektricien", label: "Elektricien" },
    ],
  },
  {
    key: "financieel",
    label: "Financieel",
    specialties: [
      { key: "boekhouder", label: "Boekhouder" },
      { key: "accountant", label: "Accountant" },
      { key: "fiscalist", label: "Fiscalist" },
      { key: "salarisadministratie", label: "Salarisadministratie" },
    ],
  },
  {
    key: "ict",
    label: "ICT & Digital",
    specialties: [
      { key: "webdevelopment", label: "Webdevelopment" },
      { key: "it_support", label: "IT-support" },
      { key: "software", label: "Software" },
      { key: "cybersecurity", label: "Cybersecurity" },
    ],
  },
  {
    key: "zorg",
    label: "Zorg & Welzijn",
    specialties: [
      { key: "fysiotherapie", label: "Fysiotherapie" },
      { key: "psychologie", label: "Psychologie" },
      { key: "coaching", label: "Coaching" },
      { key: "maatschappelijk_werk", label: "Maatschappelijk werk" },
    ],
  },
];

function getCategories() {
  // defensief: kopie teruggeven zodat callers niet muteren
  return categories.map((c) => ({
    key: c.key,
    label: c.label,
    specialties: (c.specialties || []).map((s) => ({ key: s.key, label: s.label })),
  }));
}

module.exports = { getCategories };

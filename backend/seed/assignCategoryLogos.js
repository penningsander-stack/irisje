// backend/seed/assignCategoryLogos.js
// Automatisch koppelen van categorie-logo's aan bedrijven zonder logo

const Company = require("../models/company");

const mapping = {
  aannemer: "uploads/company-logos/aannemer.svg",
  advocaat: "uploads/company-logos/advocaat.svg",
  airco: "uploads/company-logos/airco.svg",
  bouwbedrijf: "uploads/company-logos/bouwbedrijf.svg",
  dakdekker: "uploads/company-logos/dakdekker.svg",
  duurzaam: "uploads/company-logos/duurzaam.svg",
  elektricien: "uploads/company-logos/elektricien.svg",
  glaszetter: "uploads/company-logos/glaszetter.svg",
  hovenier: "uploads/company-logos/hovenier.svg",
  installatie: "uploads/company-logos/installatie.svg",
  isolatie: "uploads/company-logos/isolatie.svg",
  klusbedrijf: "uploads/company-logos/klusbedrijf.svg",
  loodgieter: "uploads/company-logos/loodgieter.svg",
  schilder: "uploads/company-logos/schilder.svg",
  schoonmaakbedrijf: "uploads/company-logos/schoonmaakbedrijf.svg",
  slotenmaker: "uploads/company-logos/slotenmaker.svg",
  spoedservice: "uploads/company-logos/spoedservice.svg",
  stukadoor: "uploads/company-logos/stukadoor.svg",
  tegelzetter: "uploads/company-logos/tegelzetter.svg",
  timmerman: "uploads/company-logos/timmerman.svg",
  vloeren: "uploads/company-logos/vloeren.svg",
  woninginrichting: "uploads/company-logos/woninginrichting.svg",
  zonnepanelen: "uploads/company-logos/zonnepanelen.svg"
};

module.exports = async function assignCategoryLogos() {
  console.log("🔄 Toekennen van categorie-logo's...");

  const companies = await Company.find();

  for (const c of companies) {
    if (c.logo) continue;

    const cat = (c.categories || []).join(" ").toLowerCase();

    for (const key of Object.keys(mapping)) {
      if (cat.includes(key)) {
        c.logo = mapping[key];
        await c.save();
        console.log("✔ Logo toegewezen aan:", c.name);
        break;
      }
    }
  }

  console.log("🎉 Koppeling voltooid.");
};

// backend/routes/admin.js
// v20251209-ADD-LOGO-FIX-ENDPOINT

const express = require("express");
const router = express.Router();
const Company = require("../models/company");

// Automatisch categorie-logo’s toewijzen aan bedrijven zonder logo
router.post("/fix-logos", async (req, res) => {
  try {
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

    const companies = await Company.find();

    let updated = 0;

    for (const c of companies) {
      if (c.logo) continue;

      const cat = (c.categories || []).join(" ").toLowerCase();

      for (const key of Object.keys(mapping)) {
        if (cat.includes(key)) {
          c.logo = mapping[key];
          await c.save();
          updated++;
          break;
        }
      }
    }

    return res.json({
      ok: true,
      updated,
      message: `Logo's automatisch toegewezen aan ${updated} bedrijven`
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

module.exports = router;

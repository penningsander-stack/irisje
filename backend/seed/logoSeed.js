// backend/seed/logoSeed.js
// Auto-assign default category logos

const fs = require("fs");
const path = require("path");
const Company = require("../models/company");

module.exports = async function seedLogos() {
  const categories = {
    advocaat: "category-advocaat.svg",
    loodgieter: "category-loodgieter.svg",
    elektricien: "category-elektricien.svg",
    schilder: "category-schilder.svg"
    // more mappings possible
  };

  for (const [key, svg] of Object.entries(categories)) {
    const companies = await Company.find({ categories: { $regex: key, $options: "i" }});
    for (const c of companies) {
      if (!c.logo) {
        c.logo = "uploads/company-logos/" + svg;
        await c.save();
      }
    }
  }

  console.log("Default logos assigned.");
};

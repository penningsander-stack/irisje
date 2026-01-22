// backend/utils/matchCompanies.js
// Centrale match-logica voor bedrijven (request-mode & company-mode)

const Company = require("../models/Company");

async function matchCompanies({ category, specialty, city }) {
  if (!category || !specialty || !city) {
    throw new Error("matchCompanies: ontbrekende parameters");
  }

  // 1. Eerst lokaal (zelfde plaats)
  let companies = await Company.find({
    category,
    specialties: specialty,
    city,
    isActive: true
  }).lean();

  let noLocalResults = false;

  // 2. Fallback: andere plaatsen
  if (!companies.length) {
    noLocalResults = true;
    companies = await Company.find({
      category,
      specialties: specialty,
      isActive: true
    }).lean();
  }

  // 3. Ranking (exact bestaand principe)
  companies.sort((a, b) => {
    // plaats
    if (a.city === city && b.city !== city) return -1;
    if (b.city === city && a.city !== city) return 1;

    // Irisje reviews
    const irisjeA = a.averageRating || 0;
    const irisjeB = b.averageRating || 0;
    if (irisjeA !== irisjeB) return irisjeB - irisjeA;

    // Google reviews
    const googleA = a.avgRating || 0;
    const googleB = b.avgRating || 0;
    if (googleA !== googleB) return googleB - googleA;

    // verificatie
    if (a.isVerified && !b.isVerified) return -1;
    if (b.isVerified && !a.isVerified) return 1;

    return 0;
  });

  return { companies, noLocalResults };
}

module.exports = matchCompanies;

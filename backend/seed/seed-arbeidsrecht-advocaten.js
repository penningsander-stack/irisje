/**
 * backend/seed/seed-arbeidsrecht-advocaten.js
 *
 * Verbeteringen:
 * - Centrale definitie van matching-profielen (issueTypes / urgent / budget)
 * - Consistente mapping naar Company-schema
 * - Betere foutafhandeling per bedrijf (seed stopt niet bij 1 fout)
 * - Duidelijke logging
 * - Nog steeds: uniek email + automatische owner
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Company = require("../models/company");
const User = require("../models/user");

const MONGO_URI = process.env.MONGO_URI;

/**
 * Basisdata per bedrijf (display & reviews)
 * Matching-kenmerken worden hieronder centraal toegevoegd
 */
const COMPANIES = [
  {
    name: "Arbeidsrecht Advocaten Nederland",
    slug: "arbeidsrecht-advocaten-nederland",
    city: "Amsterdam",
    avgRating: 4.8,
    reviewCount: 42,
    isVerified: true,
  },
  {
    name: "Ontslagrecht & VSO Advocaten",
    slug: "ontslagrecht-vso-advocaten",
    city: "Rotterdam",
    avgRating: 4.5,
    reviewCount: 31,
    isVerified: true,
  },
  {
    name: "Werk & Recht Advocatuur",
    slug: "werk-en-recht-advocatuur",
    city: "Utrecht",
    avgRating: 4.3,
    reviewCount: 19,
    isVerified: false,
  },
  {
    name: "Juridisch Arbeidsrecht Bureau",
    slug: "juridisch-arbeidsrecht-bureau",
    city: "Eindhoven",
    avgRating: 4.1,
    reviewCount: 12,
    isVerified: false,
  },
  {
    name: "Specialisten Arbeidsrecht",
    slug: "specialisten-arbeidsrecht",
    city: "specialisten-arbeidsrecht",
    avgRating: 4.7,
    reviewCount: 27,
    isVerified: true,
  }
];

/**
 * Standaard matching-profiel voor arbeidsrecht
 * (1 plek aanpassen = alle seeds consistent)
 */
const MATCHING_PROFILE = {
  categories: ["advocaat"],
  specialties: ["arbeidsrecht"],
  issueTypes: ["ontslag", "loon", "conflict"],
  canHandleUrgent: true,
  budgetRanges: ["tot-500", "500-1500", "1500-plus"],
};

async function run() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI ontbreekt");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Verbonden met MongoDB");

  // Automatisch owner kiezen
  const owner = await User.findOne().lean();
  if (!owner) {
    console.error("❌ Geen user gevonden (minstens één gebruiker vereist)");
    process.exit(1);
  }

  console.log(`👤 Owner automatisch gekozen: ${owner.email || owner._id}`);

  let counter = 1;

  for (const data of COMPANIES) {
    try {
      const exists = await Company.findOne({ slug: data.slug }).lean();
      if (exists) {
        console.log(`↪️  Bestaat al, overslaan: ${data.slug}`);
        continue;
      }

      const email = `arbeidsrecht-${counter}@test.irisje.nl`;
      counter++;

      await Company.create({
        name: data.name,
        slug: data.slug,
        city: data.city,

        rating: data.avgRating,
        reviewCount: data.reviewCount,
        verified: data.isVerified,

        email,
        owner: owner._id,

        // 🔥 Matching (D)
        categories: MATCHING_PROFILE.categories,
        specialties: MATCHING_PROFILE.specialties,
        issueTypes: MATCHING_PROFILE.issueTypes,
        canHandleUrgent: MATCHING_PROFILE.canHandleUrgent,
        budgetRanges: MATCHING_PROFILE.budgetRanges,
      });

      console.log(`➕ Toegevoegd: ${data.name} (${email})`);
    } catch (err) {
      console.error(`❌ Fout bij seeden van ${data.slug}:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log("🏁 Seed arbeidsrecht-advocaten afgerond");
}

run().catch((err) => {
  console.error("❌ Onverwachte seed-fout:", err);
  process.exit(1);
});

/**
 * backend/seed/seed-arbeidsrecht-advocaten.js
 *
 * Doel:
 * - Zorgen dat er minimaal 5 bedrijven bestaan met:
 *   categories: ["advocaat"]
 *   specialties: ["arbeidsrecht"]
 *
 * Veilig:
 * - Maakt GEEN wijzigingen aan bestaande bedrijven
 * - Voegt alleen toe als slug nog niet bestaat
 *
 * Vereist:
 * - Geldige MongoDB connectie
 * - Bestaande User _id als OWNER_ID
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Company = require("../models/company");

const MONGO_URI = process.env.MONGO_URI;

/**
 * ⚠️ VERVANG DIT
 * Gebruik een bestaande User _id uit je database
 */
const OWNER_ID = "VUL_HIER_EEN_BESTAANDE_USER_ID_IN";

const companies = [
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
    city: "Den Haag",
    avgRating: 4.7,
    reviewCount: 27,
    isVerified: true,
  }
];

async function run() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI ontbreekt in .env");
    process.exit(1);
  }

  if (!OWNER_ID || OWNER_ID.includes("VUL_HIER")) {
    console.error("❌ OWNER_ID is niet ingevuld");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Verbonden met MongoDB");

  for (const data of companies) {
    const exists = await Company.findOne({ slug: data.slug });
    if (exists) {
      console.log(`↪️  Bestaat al, overslaan: ${data.slug}`);
      continue;
    }

    await Company.create({
      ...data,
      categories: ["advocaat"],
      specialties: ["arbeidsrecht"],
      owner: OWNER_ID,
    });

    console.log(`➕ Toegevoegd: ${data.name}`);
  }

  await mongoose.disconnect();
  console.log("🏁 Seed afgerond");
}

run().catch(err => {
  console.error("❌ Seed-fout:", err);
  process.exit(1);
});

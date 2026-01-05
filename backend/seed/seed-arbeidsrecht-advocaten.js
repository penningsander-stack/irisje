/**
 * backend/seed/seed-arbeidsrecht-advocaten.js
 *
 * DOEL
 * - Voegt automatisch 5 testbedrijven toe voor:
 *   categorie: "advocaat"
 *   specialisme: "arbeidsrecht"
 *
 * VEREENVOUDIGD (optie 1)
 * - Zoekt ZELF een bestaande user als owner
 * - Geen handmatige stappen
 * - Geen MongoDB Atlas nodig
 *
 * VEILIG
 * - Past geen bestaande bedrijven aan
 * - Slaat over als slug al bestaat
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Company = require("../models/company");
const User = require("../models/user");

const MONGO_URI = process.env.MONGO_URI;

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
    city: "Den Haag",
    avgRating: 4.7,
    reviewCount: 27,
    isVerified: true,
  }
];

async function run() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI ontbreekt");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Verbonden met MongoDB");

  // 👉 AUTOMATISCH owner bepalen
  const owner = await User.findOne().lean();
  if (!owner) {
    console.error("❌ Geen user gevonden. Er moet minimaal één gebruiker bestaan.");
    process.exit(1);
  }

  console.log(`👤 Owner automatisch gekozen: ${owner.email || owner._id}`);

  for (const data of COMPANIES) {
    const exists = await Company.findOne({ slug: data.slug });
    if (exists) {
      console.log(`↪️  Bestaat al, overslaan: ${data.slug}`);
      continue;
    }

    await Company.create({
      ...data,
      categories: ["advocaat"],
      specialties: ["arbeidsrecht"],
      owner: owner._id,
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

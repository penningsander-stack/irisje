/**
 * backend/seed/seed-arbeidsrecht-advocaten.js
 *
 * FIX:
 * - Unieke email per seedbedrijf (vereist door unique index email_1)
 * - Geen handmatige OWNER_ID nodig
 * - Veilig: overslaat bestaande slugs
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

  // Automatisch een bestaande user als owner kiezen
  const owner = await User.findOne().lean();
  if (!owner) {
    console.error("❌ Geen user gevonden (er moet minimaal één gebruiker bestaan)");
    process.exit(1);
  }

  console.log(`👤 Owner automatisch gekozen: ${owner.email || owner._id}`);

  let counter = 1;

  for (const data of COMPANIES) {
    const exists = await Company.findOne({ slug: data.slug });
    if (exists) {
      console.log(`↪️  Bestaat al, overslaan: ${data.slug}`);
      continue;
    }

    const uniqueEmail = `arbeidsrecht-${counter}@test.irisje.nl`;
    counter++;

    await Company.create({
      ...data,
      categories: ["advocaat"],
      specialties: ["arbeidsrecht"],
      email: uniqueEmail,           // 🔑 FIX: uniek emailadres
      owner: owner._id,
    });

    console.log(`➕ Toegevoegd: ${data.name} (${uniqueEmail})`);
  }

  await mongoose.disconnect();
  console.log("🏁 Seed afgerond");
}

run().catch(err => {
  console.error("❌ Seed-fout:", err);
  process.exit(1);
});

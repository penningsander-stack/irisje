// backend/seed/seed-categories.js
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/category");

const MONGO_URI = process.env.MONGO_URI;

const DATA = [
  {
    value: "advocaat",
    label: "Advocaat",
    specialties: [
      { value: "arbeidsrecht", label: "Arbeidsrecht" },
      { value: "bestuursrecht", label: "Bestuursrecht" },
      { value: "familierecht", label: "Familierecht" }
    ]
  }
];

async function run() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI ontbreekt");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Verbonden met MongoDB");

  for (const cat of DATA) {
    const exists = await Category.findOne({ value: cat.value });
    if (exists) {
      console.log(`↪️  Bestaat al, overslaan: ${cat.value}`);
      continue;
    }
    await Category.create(cat);
    console.log(`➕ Toegevoegd: ${cat.label}`);
  }

  await mongoose.disconnect();
  console.log("🏁 Seed categorieën afgerond");
}

run().catch(err => {
  console.error("❌ Seed-fout:", err);
  process.exit(1);
});

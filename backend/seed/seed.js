// backend/seed/seed.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Company = require("../models/company");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

async function seedCompanies() {
  try {
    await mongoose.connect(MONGO_URI);
    const dataPath = path.join(__dirname, "companies.json");
    const companies = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    await Company.deleteMany({});
    await Company.insertMany(companies);
    console.log(`✅ ${companies.length} bedrijven toegevoegd`);
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Fout bij seeden:", err);
    mongoose.connection.close();
  }
}

seedCompanies();

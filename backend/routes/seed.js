// backend/routes/seed.js
import express from "express";
import fs from "fs";
import path from "path";
import Company from "../models/Company.js";

const router = express.Router();

// Tijdelijke route om bedrijven te importeren
router.get("/seed-companies", async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "seed", "companies.json");
    const companies = JSON.parse(fs.readFileSync(filePath, "utf8"));

    await Company.deleteMany({});
    await Company.insertMany(companies);

    res.json({ ok: true, count: companies.length });
  } catch (err) {
    console.error("❌ Fout bij seeden:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

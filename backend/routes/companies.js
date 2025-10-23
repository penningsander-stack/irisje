// backend/routes/companies.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Company = require("../models/Company");
const Review = require("../models/review");
const User = require("../models/User");

/* ----------------------- Helper ----------------------- */
function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ----------------------- Publieke zoekopdracht ----------------------- */
router.get("/search", async (req, res) => {
  try {
    const { q = "", city = "", category = "", page = "1", limit = "10" } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const filter = {};
    if (q) filter.name = { $regex: q, $options: "i" };
    if (city) filter.city = { $regex: city, $options: "i" };
    if (category) filter.categories = { $in: [new RegExp(category, "i")] };

    const total = await Company.countDocuments(filter);
    const items = await Company.find(filter)
      .sort({ avgRating: -1, reviewCount: -1, createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .select("name slug tagline city avgRating reviewCount categories isVerified");

    res.json({ ok: true, total, page: p, limit: l, items });
  } catch (err) {
    console.error("❌ companies/search error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ----------------------- Publiek bedrijfsprofiel ----------------------- */
router.get("/:slug", async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });

    const reviews = await Review.find({ company: company._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("name rating message createdAt");

    res.json({ ok: true, company, reviews });
  } catch (err) {
    console.error("❌ companies/:slug error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ----------------------- Demo-seed ----------------------- */
router.post("/seed-demo", async (_req, res) => {
  try {
    console.log("🚀 Start seed-demo...");

    // 1️⃣ Demo-user
    let user = await User.findOne({ email: "demo@irisje.nl" });
    if (!user) {
      const hashed = await bcrypt.hash("demo1234", 10);
      user = await User.create({
        name: "Demo Bedrijf",
        email: "demo@irisje.nl",
        password: hashed,
        role: "company",
      });
      console.log("✅ Demo-user aangemaakt");
    } else {
      console.log("ℹ️ Demo-user al aanwezig:", user.email);
    }

    // 2️⃣ Oude demo-bedrijven verwijderen
    const demoSlugs = ["loodgieter-jan", "schoonmaak-sterk", "elektricien-nova"];
    await Company.deleteMany({ slug: { $in: demoSlugs } });
    console.log("🧹 Oude demo-bedrijven verwijderd");

    // 3️⃣ Nieuwe bedrijven maken
    const seeds = [
      {
        name: "Loodgieter Jan",
        tagline: "Snel geholpen bij lekkages",
        description: "24/7 service voor spoed en onderhoud.",
        categories: ["Loodgieter", "CV"],
        city: "Amsterdam",
        phone: "020-1234567",
        website: "https://voorbeeld.nl/loodgieter-jan",
        avgRating: 4.7,
        reviewCount: 26,
        isVerified: true,
      },
      {
        name: "Schoonmaak Sterk",
        tagline: "Glanzend resultaat",
        description: "Bedrijfsschoonmaak en particuliere schoonmaak.",
        categories: ["Schoonmaak"],
        city: "Utrecht",
        phone: "030-7654321",
        website: "https://voorbeeld.nl/schoonmaak-sterk",
        avgRating: 4.4,
        reviewCount: 14,
        isVerified: false,
      },
      {
        name: "Elektricien Nova",
        tagline: "Veilig en vakkundig",
        description: "Storingen, groepenkasten en keuringen.",
        categories: ["Elektricien"],
        city: "Rotterdam",
        phone: "010-9988776",
        website: "https://voorbeeld.nl/elektricien-nova",
        avgRating: 4.8,
        reviewCount: 31,
        isVerified: true,
      },
    ];

    const created = [];
    for (const s of seeds) {
      const slug = slugify(s.name);
      const companyData = { ...s, slug, owner: user._id };
      console.log("➡️ Probeer bedrijf aan te maken:", companyData);
      const c = await Company.create(companyData);
      created.push(slug);
      console.log("✅ Bedrijf toegevoegd:", slug);
    }

    console.log("🎉 Seed-demo klaar");
    res.json({ ok: true, created });
  } catch (err) {
    console.error("❌ companies/seed-demo error VOLLEDIG:", err);
    res.status(500).json({
      ok: false,
      error: err.message,
      stack: err.stack,
    });
  }
});

module.exports = router;

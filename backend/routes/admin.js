const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Company = require("../models/Company");
const Request = require("../models/Request");
const User = require("../models/User");
const { getLogs, addLog } = require("../utils/logger");

/**
 * 🌸 Irisje.nl – Admin routes
 * Functies:
 *  - 📋 Bedrijfsoverzicht, verifiëren en verwijderen
 *  - 💬 Reviewbeheer (gemeld/afhandelen)
 *  - 🧾 Serverlogs ophalen
 */

/* ============================================================
   🔒 Middleware – Alleen beheerder (info@irisje.nl)
============================================================ */
async function adminOnly(req, res, next) {
  try {
    const email = req.user?.email || req.body?.email;
    if (email !== "info@irisje.nl") {
      return res.status(403).json({ ok: false, error: "Geen beheerdersrechten." });
    }
    next();
  } catch (err) {
    console.error("Fout in adminOnly:", err);
    res.status(401).json({ ok: false, error: "Authenticatie vereist." });
  }
}

/* ============================================================
   📜 LOGS – laatste 30 regels uit utils/logger
============================================================ */
router.get("/logs", (req, res) => {
  try {
    const logs = getLogs();
    const recent = Array.isArray(logs) ? logs.slice(-30).reverse() : [];
    res.status(200).json(recent);
  } catch (err) {
    console.error("❌ Fout bij ophalen logs:", err);
    res.status(500).json([]);
  }
});

/* ============================================================
   💬 GEMELDE REVIEWS
============================================================ */

/** ✅ GET /api/admin/reported
 * Haal alle gemelde reviews op
 */
router.get("/reported", adminOnly, async (req, res) => {
  try {
    const reportedReviews = await Review.find({ reported: true })
      .sort({ createdAt: -1 })
      .lean();

    addLog(`💬 Opgevraagd: ${reportedReviews.length} gemelde reviews.`, "debug");
    res.json({ ok: true, items: reportedReviews });
  } catch (err) {
    console.error("❌ Fout bij ophalen gemelde reviews:", err);
    addLog(`❌ Fout bij ophalen gemelde reviews: ${err.message}`, "error");
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen reviews." });
  }
});

/** ✅ PATCH /api/admin/resolve/:id
 * Markeer een gemelde review als afgehandeld (reported = false)
 */
router.patch("/resolve/:id", adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      addLog(`❌ Poging tot afhandelen onbekende review: ${id}`, "error");
      return res.status(404).json({ ok: false, error: "Review niet gevonden." });
    }

    review.reported = false;
    await review.save();

    const msg = `✅ Review ${id} gemarkeerd als afgehandeld.`;
    addLog(msg, "info");
    res.json({ ok: true, message: msg, review });
  } catch (err) {
    console.error("❌ Fout bij afhandelen review:", err);
    addLog(`❌ Fout bij afhandelen review ${req.params.id}: ${err.message}`, "error");
    res.status(500).json({ ok: false, error: "Serverfout bij afhandelen review." });
  }
});

/* ============================================================
   🏢 BEDRIJFSBEHEER (beheerder)
============================================================ */

/** ✅ GET /api/admin/overview
 * Overzicht van alle bedrijven + statistieken
 */
router.get("/overview", adminOnly, async (req, res) => {
  try {
    const companies = await Company.find()
      .populate("owner", "email name")
      .sort({ createdAt: -1 })
      .lean();

    const totalRequests = await Request.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalCompanies = companies.length;
    const verified = companies.filter((c) => c.isVerified).length;

    res.json({
      ok: true,
      stats: {
        totalCompanies,
        verified,
        unverified: totalCompanies - verified,
        totalRequests,
        totalReviews,
      },
      companies,
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen admin-overview:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen overzicht." });
  }
});

/** ✅ PUT /api/admin/verify/:id
 * (De)activeer verificatie van bedrijf
 */
router.put("/verify/:id", adminOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden." });
    }

    company.isVerified = !company.isVerified;
    await company.save();

    const msg = `Bedrijf '${company.name}' is ${
      company.isVerified ? "geverifieerd" : "gedeactiveerd"
    }.`;
    addLog(`⚙️ ${msg}`, "info");

    res.json({ ok: true, message: msg, company });
  } catch (err) {
    console.error("❌ Fout bij verificatie:", err);
    addLog(`❌ Fout bij verificatie: ${err.message}`, "error");
    res.status(500).json({ ok: false, error: "Serverfout bij verificatie." });
  }
});

/** 🗑️ DELETE /api/admin/company/:id
 * Verwijder bedrijf + gekoppelde requests & reviews
 */
router.delete("/company/:id", adminOnly, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden." });
    }

    await Promise.all([
      Request.deleteMany({ companyId: company._id }),
      Review.deleteMany({ companyId: company._id }),
      company.deleteOne(),
    ]);

    const msg = `🗑️ Bedrijf '${company.name}' en gekoppelde data verwijderd.`;
    addLog(msg, "warn");
    res.json({ ok: true, message: msg });
  } catch (err) {
    console.error("❌ Fout bij verwijderen bedrijf:", err);
    addLog(`❌ Fout bij verwijderen bedrijf: ${err.message}`, "error");
    res.status(500).json({ ok: false, error: "Serverfout bij verwijderen bedrijf." });
  }
});

module.exports = router;

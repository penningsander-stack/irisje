// backend/routes/admin.js
const express = require("express");
const router = express.Router();

const Review = require("../models/review");
const Company = require("../models/company");
const ClaimRequest = require("../models/claimrequest");

const { getLogs, addLog } = require("../utils/logger");

/**
 * irisje.nl – admin routes
 * ------------------------------------------------
 * beheert:
 * - reviews (reported / resolve / delete)
 * - bedrijven (overview / verify / delete)
 * - claimverzoeken (alleen admin)
 * - logs uitlezen
 */

/* ============================================================
   LOGS
============================================================ */
router.get("/logs", (req, res) => {
  try {
    const logs = getLogs();
    if (!Array.isArray(logs)) return res.json([]);

    res.json(logs.slice(0, 30)); // laatste 30
  } catch (err) {
    console.error("logs fout:", err);
    res.status(500).json([]);
  }
});

/* ============================================================
   REVIEWBEHEER
============================================================ */

// gemelde reviews ophalen
router.get("/reported", async (req, res) => {
  try {
    const reported = await Review.find({
      reported: true,
      isDeleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .lean();

    addLog(`admin → ${reported.length} gemelde reviews opgehaald`, "debug");
    res.json(reported);

  } catch (err) {
    console.error("reported fout:", err);
    addLog("fout bij ophalen gemelde reviews: " + err.message, "error");
    res.status(500).json({ error: "serverfout bij ophalen gemelde reviews" });
  }
});

// review afhandelen (reported → false)
router.patch("/resolve/:id", async (req, res) => {
  try {
    const r = await Review.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "review niet gevonden" });

    r.reported = false;
    await r.save();

    addLog(`review ${r._id} afgehandeld`, "info");
    res.json({ ok: true, review: r });

  } catch (err) {
    console.error("resolve fout:", err);
    addLog("fout bij afhandelen review: " + err.message, "error");
    res.status(500).json({ error: "serverfout bij afhandelen review" });
  }
});

// review soft delete (isDeleted = true)
router.patch("/delete/:id", async (req, res) => {
  try {
    const r = await Review.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "review niet gevonden" });

    r.isDeleted = true;
    await r.save();

    addLog(`review ${r._id} gemarkeerd als verwijderd`, "warn");
    res.json({ ok: true, review: r });

  } catch (err) {
    console.error("delete fout:", err);
    addLog("fout bij verwijderen review: " + err.message, "error");
    res.status(500).json({ error: "serverfout bij verwijderen review" });
  }
});

/* ============================================================
   BEDRIJVENBEHEER
============================================================ */

// overzicht bedrijven voor adminpaneel
router.get("/overview", async (req, res) => {
  try {
    const companies = await Company.find({})
      .populate("owner", "email")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = companies.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      isVerified: c.isVerified,
      reviewCount: c.reviewCount || 0,
      ownerEmail: c.owner?.email || null
    }));

    res.json({ ok: true, companies: formatted });

  } catch (err) {
    console.error("overview fout:", err);
    addLog("fout bij bedrijven-overview: " + err.message, "error");
    res.status(500).json({ error: "serverfout bij overview" });
  }
});

// bedrijf (de)verifiëren
router.put("/verify/:id", async (req, res) => {
  try {
    const c = await Company.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "bedrijf niet gevonden" });

    c.isVerified = !c.isVerified;
    await c.save();

    addLog(`bedrijf ${c.slug} verificatie → ${c.isVerified}`, "info");
    res.json({ ok: true, company: c });

  } catch (err) {
    console.error("verify fout:", err);
    addLog("fout bij verifiëren bedrijf: " + err.message, "error");
    res.status(500).json({ error: "serverfout bij verifiëren" });
  }
});

// bedrijf verwijderen
router.delete("/company/:id", async (req, res) => {
  try {
    const removed = await Company.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: "bedrijf niet gevonden" });

    addLog(`bedrijf ${removed.slug} verwijderd door admin`, "warn");
    res.json({ ok: true, deleted: removed._id });

  } catch (err) {
    console.error("delete bedrijf fout:", err);
    addLog("fout bij verwijderen bedrijf: " + err.message, "error");
    res.status(500).json({ error: "serverfout bij verwijderen bedrijf" });
  }
});

/* ============================================================
   CLAIMBEHEER (alleen admin)
============================================================ */

router.get("/claims", async (req, res) => {
  try {
    const claims = await ClaimRequest.find({})
      .populate("companyId", "name city")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, items: claims });

  } catch (err) {
    console.error("claims fout:", err);
    addLog("fout bij claimbeheer admin: " + err.message, "error");
    res.status(500).json({ error: "serverfout bij claims ophalen" });
  }
});

module.exports = router;

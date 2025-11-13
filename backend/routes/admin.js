// backend/routes/admin.js
const express = require("express");
const router = express.Router();

const review = require("../models/review");
const company = require("../models/company");
const claimrequest = require("../models/claimrequest");

const { getLogs, addLog } = require("../utils/logger");

/**
 * irisje.nl – admin routes
 * - reviews beheren (melden / afhandelen / verwijderen)
 * - bedrijven beheren (overzicht / verifiëren / verwijderen)
 * - claims beheren
 * - logs uitlezen
 */

/* ============================================================
   logs
============================================================ */
router.get("/logs", (req, res) => {
  try {
    const logs = getLogs();
    if (!Array.isArray(logs)) return res.json([]);
    const recent = logs.slice(-30).reverse();
    res.status(200).json(recent);
  } catch (err) {
    console.error("fout bij logs:", err);
    res.status(500).json([]);
  }
});

/* ============================================================
   reviewbeheer
============================================================ */

/* gemelde reviews ophalen */
router.get("/reported", async (req, res) => {
  try {
    const reported = await review
      .find({ reported: true, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    addLog(`gemelde reviews opgehaald: ${reported.length}`, "debug");
    res.json(reported);
  } catch (err) {
    console.error("fout bij reported:", err);
    res.status(500).json({ error: "serverfout bij ophalen gemelde reviews" });
  }
});

/* review als afgehandeld markeren */
router.patch("/resolve/:id", async (req, res) => {
  try {
    const r = await review.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "review niet gevonden" });

    r.reported = false;
    await r.save();

    addLog(`review ${r._id} afgehandeld`, "info");
    res.json({ ok: true, review: r });
  } catch (err) {
    console.error("resolve fout:", err);
    res.status(500).json({ error: "serverfout bij afhandelen review" });
  }
});

/* review soft delete */
router.patch("/delete/:id", async (req, res) => {
  try {
    const r = await review.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "review niet gevonden" });

    r.isDeleted = true;
    await r.save();

    addLog(`review ${r._id} verwijderd`, "warn");
    res.json({ ok: true, review: r });
  } catch (err) {
    console.error("delete fout:", err);
    res.status(500).json({ error: "serverfout bij verwijderen review" });
  }
});

/* ============================================================
   bedrijvenbeheer (nieuw)
============================================================ */

/* overzicht voor admin-paneel */
router.get("/overview", async (req, res) => {
  try {
    const companies = await company
      .find({})
      .populate("owner", "email")
      .sort({ createdAt: -1 })
      .lean();

    const mapped = companies.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      isVerified: c.isVerified,
      reviewCount: c.reviewCount || 0,
      owner: c.owner || null,
    }));

    res.json({ ok: true, companies: mapped });
  } catch (err) {
    console.error("overview fout:", err);
    res.status(500).json({ error: "serverfout bij overview" });
  }
});

/* bedrijf (de)verifiëren */
router.put("/verify/:id", async (req, res) => {
  try {
    const c = await company.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "bedrijf niet gevonden" });

    c.isVerified = !c.isVerified;
    await c.save();

    addLog(`bedrijf ${c.slug} verificatie gewijzigd naar ${c.isVerified}`, "info");
    res.json({ ok: true, company: c });
  } catch (err) {
    console.error("verify fout:", err);
    res.status(500).json({ error: "serverfout bij verifiëren bedrijf" });
  }
});

/* bedrijf verwijderen */
router.delete("/company/:id", async (req, res) => {
  try {
    const removed = await company.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: "bedrijf niet gevonden" });

    addLog(`bedrijf ${removed.slug} verwijderd`, "warn");
    res.json({ ok: true, deleted: removed._id });
  } catch (err) {
    console.error("delete bedrijf fout:", err);
    res.status(500).json({ error: "serverfout bij verwijderen bedrijf" });
  }
});

/* ============================================================
   claimbeheer (uit claims.js)
============================================================ */
router.get("/claims", async (req, res) => {
  try {
    const claims = await claimrequest
      .find({})
      .populate("companyid", "name city")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, items: claims });
  } catch (err) {
    console.error("claims fout:", err);
    res.status(500).json({ error: "serverfout bij claims ophalen" });
  }
});

module.exports = router;

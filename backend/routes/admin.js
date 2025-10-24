// backend/routes/admin.js
const express = require("express");
const router = express.Router();

const Company = require("../models/Company");
const Review = require("../models/review");
const Request = require("../models/Request");

// --------------------------------------
// ADMIN: gemelde reviews bekijken
// --------------------------------------
router.get("/reports", async (_req, res) => {
  try {
    const reviews = await Review.find({ reported: true }).sort({ createdAt: -1 });
    res.json({ ok: true, reviews });
  } catch (err) {
    console.error("admin/reports error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen meldingen" });
  }
});

// --------------------------------------
// ADMIN: review verwijderen
// --------------------------------------
router.delete("/delete-review/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ ok: false, error: "Review niet gevonden" });
    res.json({ ok: true, message: "Review verwijderd" });
  } catch (err) {
    console.error("admin/delete-review error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij verwijderen review" });
  }
});

// --------------------------------------
// ADMIN: bedrijf verwijderen (voor demo cleanup)
// --------------------------------------
router.delete("/delete-company/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });

    // Verwijder ook gekoppelde aanvragen & reviews
    await Request.deleteMany({ company: company._id });
    await Review.deleteMany({ company: company._id });
    await Company.findByIdAndDelete(company._id);

    res.json({ ok: true, message: `Bedrijf '${company.name}' verwijderd` });
  } catch (err) {
    console.error("admin/delete-company error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij verwijderen bedrijf" });
  }
});

module.exports = router;

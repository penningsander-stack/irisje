// backend/routes/admin.js
const express = require("express");
const Review = require("../models/review");
const Company = require("../models/Company");
const router = express.Router();

// Simpele admin verificatie (kan later vervangen worden door login)
function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.includes("irisje_admin_2025")) {
    return res.status(403).json({ error: "Geen toegang" });
  }
  next();
}

// ✅ Gemelde reviews ophalen
router.get("/reported-reviews", verifyAdmin, async (req, res) => {
  try {
    const reviews = await Review.find({ reported: true }).sort({ date: -1 });
    const withCompany = await Promise.all(
      reviews.map(async (r) => {
        const company = await Company.findById(r.companyId);
        return { ...r._doc, companyName: company ? company.name : "Onbekend" };
      })
    );
    res.json(withCompany);
  } catch (err) {
    console.error("Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen gemelde reviews" });
  }
});

// ✅ Reviewactie uitvoeren (goedkeuren of verwijderen)
router.put("/review-action/:id", verifyAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    if (action === "approve") {
      await Review.findByIdAndUpdate(req.params.id, { reported: false });
    } else if (action === "delete") {
      await Review.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Fout bij admin-reviewactie:", err);
    res.status(500).json({ error: "Serverfout bij uitvoeren reviewactie" });
  }
});

module.exports = router;

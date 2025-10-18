// backend/routes/admin.js
const express = require("express");
const mongoose = require("mongoose");
const Company = require("../models/Company");

const router = express.Router();

// ---- Zorg dat er een Review-model beschikbaar is (zonder dubbele definities)
const ReviewSchema =
  mongoose.models.Review?.schema ||
  new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true },
    reported: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
  });
const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

// ---- Eenvoudige admin-check (kan later vervangen door echte login)
function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : "";
  if (token !== "irisje_admin_2025") {
    return res.status(403).json({ error: "Geen toegang" });
  }
  next();
}

// ---- Bedrijvenlijst ophalen (basisgegevens)
router.get("/companies", verifyAdmin, async (_req, res) => {
  try {
    const companies = await Company.find({})
      .select("_id name email category blocked dateCreated")
      .sort({ dateCreated: -1 });
    res.json(companies);
  } catch (err) {
    console.error("❌ Fout bij ophalen companies:", err);
    res.status(500).json({ error: "Serverfout bij ophalen companies" });
  }
});

// ---- Bedrijf blokkeren
router.put("/companies/:id/block", verifyAdmin, async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(
      req.params.id,
      { blocked: true },
      { new: true }
    ).select("_id name email blocked");
    if (!updated) return res.status(404).json({ error: "Bedrijf niet gevonden" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Fout bij blokkeren bedrijf:", err);
    res.status(500).json({ error: "Serverfout bij blokkeren bedrijf" });
  }
});

// ---- Bedrijf deblokkeren
router.put("/companies/:id/unblock", verifyAdmin, async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(
      req.params.id,
      { blocked: false },
      { new: true }
    ).select("_id name email blocked");
    if (!updated) return res.status(404).json({ error: "Bedrijf niet gevonden" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Fout bij deblokkeren bedrijf:", err);
    res.status(500).json({ error: "Serverfout bij deblokkeren bedrijf" });
  }
});

// ---- Gemelde reviews ophalen
router.get("/reported-reviews", verifyAdmin, async (_req, res) => {
  try {
    const reviews = await Review.find({ reported: true }).sort({ date: -1 });
    // Handmatige "populate" van bedrijfsnaam
    const companyIds = [...new Set(reviews.map((r) => String(r.companyId)))];
    const companies = await Company.find({ _id: { $in: companyIds } }).select("_id name");
    const map = new Map(companies.map((c) => [String(c._id), c.name]));

    const withCompanyName = reviews.map((r) => ({
      _id: r._id,
      companyId: r.companyId,
      companyName: map.get(String(r.companyId)) || "Onbekend",
      name: r.name,
      rating: r.rating,
      message: r.message,
      reported: r.reported,
      date: r.date,
    }));

    res.json(withCompanyName);
  } catch (err) {
    console.error("❌ Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen gemelde reviews" });
  }
});

// ---- Review-actie (goedkeuren of verwijderen)
router.put("/review-action/:id", verifyAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    if (!["approve", "delete"].includes(action)) {
      return res.status(400).json({ error: "Ongeldige actie" });
    }

    if (action === "approve") {
      const updated = await Review.findByIdAndUpdate(req.params.id, { reported: false }, { new: true });
      if (!updated) return res.status(404).json({ error: "Review niet gevonden" });
      return res.json({ success: true });
    }

    if (action === "delete") {
      const deleted = await Review.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Review niet gevonden" });
      return res.json({ success: true });
    }
  } catch (err) {
    console.error("❌ Fout bij review-actie:", err);
    res.status(500).json({ error: "Serverfout bij review-actie" });
  }
});

module.exports = router;

// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/request");
const Company = require("../models/company");
const Review = require("../models/review");

// GET /api/publicRequests/:id
// Geeft request + passende bedrijven terug (max 50)
// Belangrijk: behoudt Google fields (avgRating/reviewCount) en voegt Irisje fields toe (irisjeAvgRating/irisjeReviewCount)
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ ok: false, message: "Request niet gevonden" });

    const category = String(request.category || "").trim();
    const city = String(request.city || "").trim();

    const match = { active: true };
    if (category) match.categories = category;

    // Eerst: lokale bedrijven (zelfde city), dan overige
    const companiesRaw = await Company.aggregate([
      { $match: match },

      // Irisje reviews ophalen (alleen source: "irisje")
      {
        $lookup: {
          from: "reviews",
          let: { companyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$companyId", "$$companyId"] },
                source: "irisje",
                isHidden: { $ne: true },
              },
            },
            { $project: { rating: 1 } },
          ],
          as: "reviews",
        },
      },

      // Irisje velden toevoegen ZONDER Google velden te overschrijven
      {
        $addFields: {
          irisjeReviewCount: { $size: "$reviews" },
          irisjeAvgRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.rating" },
              0,
            ],
          },
        },
      },

      // reviews array verwijderen om payload klein te houden
      { $project: { reviews: 0, password: 0 } },
    ]);

    // client-side sort: lokaal eerst
    const local = [];
    const nonLocal = [];

    for (const c of companiesRaw) {
      const cCity = String(c.city || "").trim();
      if (city && cCity.toLowerCase() === city.toLowerCase()) local.push(c);
      else nonLocal.push(c);
    }

    // Binnen local: Irisje rating/count zwaarder, daarna Google (avgRating/reviewCount) als fallback
    const scoreSort = (a, b) => {
      const aHasI = Number.isFinite(a.irisjeAvgRating) && (a.irisjeReviewCount || 0) > 0;
      const bHasI = Number.isFinite(b.irisjeAvgRating) && (b.irisjeReviewCount || 0) > 0;

      if (aHasI && !bHasI) return -1;
      if (!aHasI && bHasI) return 1;

      if (b.irisjeAvgRating !== a.irisjeAvgRating) return (b.irisjeAvgRating || 0) - (a.irisjeAvgRating || 0);
      if ((b.irisjeReviewCount || 0) !== (a.irisjeReviewCount || 0)) return (b.irisjeReviewCount || 0) - (a.irisjeReviewCount || 0);

      // Google fallback (historisch)
      const aG = Number(a.avgRating || 0);
      const bG = Number(b.avgRating || 0);
      if (bG !== aG) return bG - aG;

      const aGC = Number(a.reviewCount || 0);
      const bGC = Number(b.reviewCount || 0);
      if (bGC !== aGC) return bGC - aGC;

      return 0;
    };

    local.sort(scoreSort);
    nonLocal.sort(scoreSort);

    const companies = [...local, ...nonLocal].slice(0, 50);

    return res.json({
      ok: true,
      request: {
        _id: request._id,
        category: request.category,
        specialty: request.specialty || "",
        city: request.city,
        companyId: request.companyId || null,
      },
      companies,
      noLocalResults: city ? local.length === 0 : false,
    });
  } catch (err) {
    console.error("publicRequests error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;

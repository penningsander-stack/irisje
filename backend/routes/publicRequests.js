// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");
const Review = require("../models/review");

// GET /api/publicRequests/:id
// Geeft request + passende bedrijven terug
// - Behoudt Google reviews (avgRating / reviewCount)
// - Voegt Irisje reviews toe (irisjeAvgRating / irisjeReviewCount)
// - Sorteert: lokaal eerst, daarna reviews
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden" });
    }

    const category = String(request.category || "").trim();
    const specialty = String(request.specialty || "").trim();
    const city = String(request.city || "").trim();

    const match = {
      active: true,
      ...(category ? { categories: category } : {}),
      ...(specialty ? { specialties: specialty } : {}),
    };

    const companiesRaw = await Company.aggregate([
      { $match: match },

      // 🔹 Google reviews behouden (uit Company)
      {
        $addFields: {
          googleRating: "$avgRating",
          googleReviewCount: "$reviewCount",
        },
      },

      // 🔹 Irisje reviews ophalen
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
          as: "irisjeReviews",
        },
      },

      // 🔹 Irisje aggregatie
      {
        $addFields: {
          irisjeReviewCount: { $size: "$irisjeReviews" },
          irisjeAvgRating: {
            $cond: [
              { $gt: [{ $size: "$irisjeReviews" }, 0] },
              { $avg: "$irisjeReviews.rating" },
              0,
            ],
          },
        },
      },

      // opschonen
      {
        $project: {
          irisjeReviews: 0,
          password: 0,
        },
      },
    ]);

    // 🔹 Lokale bedrijven eerst
    const local = [];
    const nonLocal = [];

    for (const c of companiesRaw) {
      const cCity = String(c.city || "").trim().toLowerCase();
      if (city && cCity === city.toLowerCase()) local.push(c);
      else nonLocal.push(c);
    }

    // 🔹 Sortering: Irisje > Google > fallback
    const scoreSort = (a, b) => {
      const aHasI = a.irisjeReviewCount > 0;
      const bHasI = b.irisjeReviewCount > 0;

      if (aHasI && !bHasI) return -1;
      if (!aHasI && bHasI) return 1;

      if (b.irisjeAvgRating !== a.irisjeAvgRating) {
        return b.irisjeAvgRating - a.irisjeAvgRating;
      }

      if (b.irisjeReviewCount !== a.irisjeReviewCount) {
        return b.irisjeReviewCount - a.irisjeReviewCount;
      }

      if (b.googleRating !== a.googleRating) {
        return (b.googleRating || 0) - (a.googleRating || 0);
      }

      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
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

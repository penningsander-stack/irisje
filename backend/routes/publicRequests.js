// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/* ======================================================
   POST /api/publicRequests
   → nieuwe aanvraag aanmaken
   ====================================================== */
router.post("/", async (req, res) => {
  try {
    const { name, email, message, category, specialty, city, companies } = req.body;

    if (!name || !email || !category || !city) {
      return res.status(400).json({
        ok: false,
        message: "Verplichte velden ontbreken",
      });
    }

    const request = await Request.create({
      name: String(name).trim(),
      email: String(email).trim(),
      message: String(message || "").trim(),
      category: String(category).trim(),
      specialty: String(specialty || "").trim(),
      city: String(city).trim(),
      companies: Array.isArray(companies) ? companies : [],
    });

    return res.status(201).json({
      ok: true,
      requestId: request._id,
    });
  } catch (err) {
    console.error("publicRequests POST error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* ======================================================
   GET /api/publicRequests (guard)
   ====================================================== */
router.get("/", (req, res) => {
  return res.status(400).json({
    ok: false,
    message: "requestId ontbreekt in URL (/api/publicRequests/:id)",
  });
});

/* ======================================================
   GET /api/publicRequests/:id
   → aanvraag + passende bedrijven
   ====================================================== */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden" });
    }

    const category = String(request.category || "").trim();
    const specialty = String(request.specialty || "").trim();
    const city = String(request.city || "").trim();

    const match = { active: { $ne: false } };
    if (category) match.categories = category;
    if (specialty) match.specialties = specialty;

    const companiesRaw = await Company.aggregate([
      { $match: match },

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
          as: "_irisjeReviews",
        },
      },

      {
        $addFields: {
          irisjeReviewCount: { $size: "$_irisjeReviews" },
          irisjeAvgRating: {
            $cond: [
              { $gt: [{ $size: "$_irisjeReviews" }, 0] },
              { $avg: "$_irisjeReviews.rating" },
              0,
            ],
          },
        },
      },

      { $project: { _irisjeReviews: 0, password: 0 } },
    ]);

    const local = [];
    const nonLocal = [];

    for (const c of companiesRaw) {
      const cCity = String(c.city || "").trim();
      if (city && cCity.toLowerCase() === city.toLowerCase()) local.push(c);
      else nonLocal.push(c);
    }

    const scoreSort = (a, b) => {
      const aIcount = Number(a.irisjeReviewCount || 0);
      const bIcount = Number(b.irisjeReviewCount || 0);
      const aIavg = Number(a.irisjeAvgRating || 0);
      const bIavg = Number(b.irisjeAvgRating || 0);

      const aHasI = aIcount > 0;
      const bHasI = bIcount > 0;

      if (aHasI && !bHasI) return -1;
      if (!aHasI && bHasI) return 1;

      if (bIavg !== aIavg) return bIavg - aIavg;
      if (bIcount !== aIcount) return bIcount - aIcount;

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
        category: request.category || "",
        specialty: request.specialty || "",
        city: request.city || "",
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

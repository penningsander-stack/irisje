// backend/utils/matchCompanies.js
// Centrale match-logica voor request-mode en company-mode

const Company = require("../models/company");

async function matchCompanies({ category, specialty, city }) {
  if (!category || !specialty || !city) {
    throw new Error("matchCompanies: ontbrekende parameters");
  }

  // -------------------------
  // Aggregation: bedrijven + reviews
  // -------------------------
  const pipeline = [
    {
      $match: {
        $or: [{ category }, { categories: { $in: [category] } }],
        $or: [
          { specialties: { $exists: false } },
          { specialties: { $size: 0 } },
          { specialties: { $in: [specialty] } }
        ]
      }
    },
    {
      $lookup: {
        from: "reviews",
        let: { companyId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$company", "$$companyId"] },
              isApproved: true
            }
          },
          { $project: { rating: 1 } }
        ],
        as: "reviews"
      }
    },
    {
      $addFields: {
        reviewCount: { $size: "$reviews" },
        averageRating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: "$reviews.rating" },
            null
          ]
        }
      }
    },
    {
      $project: {
        reviews: 0,
        password: 0
      }
    }
  ];

  const companies = await Company.aggregate(pipeline);

  // -------------------------
  // Plaats-fallback
  // -------------------------
  const reqCity = String(city).trim().toLowerCase();

  const localCompanies = companies.filter(
    (c) => String(c.city || "").trim().toLowerCase() === reqCity
  );

  const hasLocal = localCompanies.length > 0;
  const finalCompanies = hasLocal ? localCompanies : companies;

  // -------------------------
  // DEFINITIEVE SORTERING
  // -------------------------
  finalCompanies.sort((a, b) => {
    // 1) Irisje reviews
    const aHasIrisje = Number.isFinite(a.averageRating) && a.reviewCount > 0;
    const bHasIrisje = Number.isFinite(b.averageRating) && b.reviewCount > 0;
    if (aHasIrisje !== bHasIrisje) return aHasIrisje ? -1 : 1;

    if (aHasIrisje && bHasIrisje) {
      if (b.averageRating !== a.averageRating)
        return b.averageRating - a.averageRating;
      if ((b.reviewCount || 0) !== (a.reviewCount || 0))
        return (b.reviewCount || 0) - (a.reviewCount || 0);
    }

    // 2) Google reviews
    const aHasGoogle = Number.isFinite(a.avgRating);
    const bHasGoogle = Number.isFinite(b.avgRating);
    if (aHasGoogle !== bHasGoogle) return aHasGoogle ? -1 : 1;

    if (aHasGoogle && bHasGoogle) {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    }

    // 3) Verificatie
    const aVer = a.isVerified ? 1 : 0;
    const bVer = b.isVerified ? 1 : 0;
    if (aVer !== bVer) return bVer - aVer;

    // 4) Stabiele fallback
    return (a.name || "").localeCompare(b.name || "", "nl", {
      sensitivity: "base"
    });
  });

  return {
    companies: finalCompanies,
    noLocalResults: !hasLocal
  };
}

module.exports = matchCompanies;

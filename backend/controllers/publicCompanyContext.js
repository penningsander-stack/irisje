// backend/controllers/publicCompanyContext.js

const Company = require("../models/Company");

/**
 * GET /api/public/companyContext/:companySlug
 * Bedrijf-gecentreerde context + vergelijkbare bedrijven
 */
exports.getCompanyContext = async (req, res) => {
  try {
    const { companySlug } = req.params;

    if (!companySlug) {
      return res.status(400).json({
        ok: false,
        message: "companySlug ontbreekt"
      });
    }

    // 1. Bronbedrijf ophalen
    const sourceCompany = await Company.findOne({
      slug: companySlug,
      published: true
    }).lean();

    if (!sourceCompany) {
      return res.status(404).json({
        ok: false,
        message: "Bedrijf niet gevonden"
      });
    }

    const { category, specialisms, city } = sourceCompany;

    if (!category || !city) {
      return res.status(400).json({
        ok: false,
        message: "Bedrijf mist vereiste context (category of city)"
      });
    }

    // 2. Vergelijkbare bedrijven zoeken
    const candidates = await Company.find({
      _id: { $ne: sourceCompany._id },
      published: true,
      category: category,
      specialisms: { $in: specialisms || [] }
    })
      .lean()
      .limit(50); // ruim ophalen, later sorteren

    // 3. Sorteren: city-match eerst, daarna specialism overlap
    const scored = candidates.map(company => {
      const overlapCount = Array.isArray(company.specialisms)
        ? company.specialisms.filter(s => specialisms?.includes(s)).length
        : 0;

      const cityMatch = company.city === city ? 1 : 0;

      return {
        company,
        score: {
          cityMatch,
          overlapCount
        }
      };
    });

    scored.sort((a, b) => {
      if (b.score.cityMatch !== a.score.cityMatch) {
        return b.score.cityMatch - a.score.cityMatch;
      }
      return b.score.overlapCount - a.score.overlapCount;
    });

    const matches = scored.slice(0, 20).map(s => ({
      id: s.company._id,
      slug: s.company.slug,
      name: s.company.name,
      category: s.company.category,
      specialisms: s.company.specialisms,
      city: s.company.city
    }));

    // 4. Response
    return res.json({
      ok: true,
      sourceCompany: {
        id: sourceCompany._id,
        slug: sourceCompany.slug,
        name: sourceCompany.name,
        category: sourceCompany.category,
        specialisms: sourceCompany.specialisms,
        city: sourceCompany.city
      },
      matches,
      meta: {
        strategy: "category + specialism overlap, city-first",
        limit: 20
      }
    });

  } catch (error) {
    console.error("companyContext error:", error);
    return res.status(500).json({
      ok: false,
      message: "Interne serverfout"
    });
  }
};

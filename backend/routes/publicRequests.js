// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const requestModel = require("../models/request");
const companyModel = require("../models/company");

// Helper: normaliseer sector naar string
function normalizeSector(sector) {
  if (!sector) return null;

  if (typeof sector === "string") {
    return sector.trim();
  }

  if (Array.isArray(sector) && sector.length > 0) {
    return String(sector[0]).trim();
  }

  if (typeof sector === "object") {
    if (sector.value) return String(sector.value).trim();
    if (sector.label) return String(sector.label).trim();
  }

  return null;
}

// GET public request + matching companies
router.get("/:id", async (req, res) => {
  try {
    const request = await requestModel.findById(req.params.id).lean();

    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    const sector = normalizeSector(request.sector);
    const city = request.city;

    if (!sector || !city) {
      return res.status(400).json({
        error: "Aanvraag bevat geen geldige sector of plaats"
      });
    }

    const companies = await companyModel.find({
      $and: [
        {
          $or: [
            // categorie als string
            { categories: { $regex: sector, $options: "i" } },

            // categorie als array
            {
              categories: {
                $elemMatch: { $regex: sector, $options: "i" }
              }
            }
          ]
        },
        {
          city: { $regex: `^${city}$`, $options: "i" }
        }
      ]
    }).lean();

    return res.json({
      request,
      companies
    });

  } catch (err) {
    console.error("publicRequests error:", err);
    return res.status(500).json({
      error: "Resultaten konden niet worden opgehaald"
    });
  }
});

module.exports = router;

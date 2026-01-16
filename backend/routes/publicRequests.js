// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const requestModel = require("../models/request");
const companyModel = require("../models/company");

// helper: sector altijd string maken
function normalizeSector(sector) {
  if (!sector) return null;
  if (typeof sector === "string") return sector.trim();
  if (Array.isArray(sector) && sector.length) return String(sector[0]).trim();
  if (typeof sector === "object") {
    if (sector.value) return String(sector.value).trim();
    if (sector.label) return String(sector.label).trim();
  }
  return null;
}

// 1) ZOEK AANMAKEN
router.post("/", async (req, res) => {
  try {
    const sector = normalizeSector(req.body.sector);
    const specialty = String(req.body.specialty || "").trim();
    const city = String(req.body.city || "").trim();

    if (!sector || !specialty || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector, specialisme en plaats zijn verplicht."
      });
    }

    const request = await requestModel.create({
      sector,
      specialty,
      city
    });

    return res.json({
      ok: true,
      requestId: request._id.toString()
    });

  } catch (err) {
    console.error("publicRequests POST error:", err);
    return res.status(500).json({
      ok: false,
      message: "Aanvraag kon niet worden aangemaakt."
    });
  }
});

// 2) RESULTATEN OPHALEN
router.get("/:id", async (req, res) => {
  try {
    const request = await requestModel.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    const sector = normalizeSector(request.sector);
    const city = String(request.city || "").trim();
    if (!sector || !city) {
      return res.status(400).json({ error: "Ongeldige aanvraagdata" });
    }

    const companies = await companyModel.find({
      $and: [
        {
          $or: [
            { categories: { $regex: sector, $options: "i" } },
            { categories: { $elemMatch: { $regex: sector, $options: "i" } } }
          ]
        },
        { city: { $regex: `^${city}$`, $options: "i" } }
      ]
    }).lean();

    return res.json({ request, companies });

  } catch (err) {
    console.error("publicRequests GET error:", err);
    return res.status(500).json({
      error: "Resultaten konden niet worden opgehaald"
    });
  }
});

module.exports = router;

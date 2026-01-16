// backend/routes/publicRequests.js
// v2026-01-16 – step 1 COMPLETE: category + city matching

const express = require("express");
const router = express.Router();

const requestModel = require("../models/request");
const companyModel = require("../models/company");

router.post("/", async (req, res) => {
  try {
    const { sector, specialty, city } = req.body;

    if (!sector || !city) {
      return res.status(400).json({ error: "Sector en plaats zijn verplicht" });
    }

    const request = await requestModel.create({
      sector,
      specialty: specialty || "",
      city,
    });

    res.json({ requestId: request._id });
  } catch (err) {
    console.error("❌ POST /publicRequests error:", err);
    res.status(500).json({ error: "Aanvraag kon niet worden aangemaakt" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const request = await requestModel.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    const companies = await companyModel.find({
      categories: {
        $regex: request.sector,
        $options: "i",
      },
      city: {
        $regex: `^${request.city}$`,
        $options: "i",
      },
    }).lean();

    res.json({ request, companies });
  } catch (err) {
    console.error("❌ GET /publicRequests/:id error:", err);
    res.status(500).json({ error: "Resultaten konden niet worden opgehaald" });
  }
});

module.exports = router;

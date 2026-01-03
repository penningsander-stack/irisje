// backend/routes/publicRequests.js
// v20260102-FINAL-GET-POST

const express = require("express");
const router = express.Router();

const Company = require("../models/company");
const Request = require("../models/request");

/* ======================
   POST – nieuwe aanvraag
====================== */
router.post("/", async (req, res) => {
  try {
    const { name, email, message, category, specialty } = req.body;

    if (!name || !email || !category) {
      return res.status(400).json({
        ok: false,
        error: "Naam, e-mail en categorie zijn verplicht",
      });
    }

    const request = await Request.create({
      name,
      email,
      message,
      category,
      specialty,
      status: "Nieuw",
      source: "public",
    });

    res.json({
      ok: true,
      requestId: request._id,
    });
  } catch (err) {
    console.error("❌ POST publicRequests:", err);
    res.status(500).json({ ok: false });
  }
});

/* ======================
   GET – aanvraag ophalen
   (DIT ONTBRAK)
====================== */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();

    if (!request) {
      return res.status(404).json({
        ok: false,
        error: "Aanvraag niet gevonden",
      });
    }

    const query = {
      category: request.category,
      active: true,
    };

    if (request.specialty) {
      query.specialties = request.specialty;
    }

    const companies = await Company.find(query)
      .limit(20)
      .select("_id name city rating premium")
      .lean();

    res.json({
      ok: true,
      request,
      companies,
    });
  } catch (err) {
    console.error("❌ GET publicRequests:", err);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;

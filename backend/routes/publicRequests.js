// backend/routes/publicRequests.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

// ✅ Test route
router.get("/", (req, res) => {
  res.json({ ok: true, message: "publicRequests router actief" });
});

// ✅ Multi-aanvraag (max 5 bedrijven)
router.post("/multi", async (req, res) => {
  try {
    const { customerName, customerEmail, message, companies } = req.body || {};

    // Validaties
    if (!customerName || !customerEmail || !message) {
      return res.status(400).json({
        ok: false,
        error: "Naam, e-mailadres en bericht zijn verplicht.",
      });
    }

    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Kies minstens één bedrijf.",
      });
    }

    if (companies.length > 5) {
      return res.status(400).json({
        ok: false,
        error: "Je kunt maximaal 5 bedrijven selecteren.",
      });
    }

    // ✅ IDs controleren en omzetten naar ObjectId
    const objectIds = companies
      .filter((id) => typeof id === "string" && mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Ongeldige bedrijfskeuze.",
      });
    }

    const foundCompanies = await Company.find({ _id: { $in: objectIds } })
      .select("_id name email owner")
      .lean();

    if (!foundCompanies.length) {
      return res.status(404).json({
        ok: false,
        error: "Geen van de gekozen bedrijven bestaat.",
      });
    }

    // ✅ Eén aanvraag per bedrijf opslaan
    const toInsert = foundCompanies.map((c) => ({
      name: customerName,          // model verwacht 'name'
      email: customerEmail,        // model verwacht 'email'
      message: message || "",
      company: c._id,
      status: "Nieuw",             // model verwacht 'Nieuw' als defaultwaarde
      date: new Date(),
    }));

    await Request.insertMany(toInsert);

    return res.json({
      ok: true,
      created: toInsert.length,
    });
  } catch (err) {
    console.error("❌ Fout bij publicRequests/multi:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij opslaan van de aanvraag.",
    });
  }
});

module.exports = router;

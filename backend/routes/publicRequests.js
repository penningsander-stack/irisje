// backend/routes/publicRequests.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

// POST /api/publicRequests/multi
router.post("/multi", async (req, res) => {
  try {
    const { customerName, customerEmail, message, companies } = req.body || {};

    if (!customerName || !customerEmail) {
      return res.status(400).json({ ok: false, error: "Naam en e-mailadres zijn verplicht." });
    }

    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ ok: false, error: "Kies minstens één bedrijf." });
    }

    if (companies.length > 5) {
      return res.status(400).json({ ok: false, error: "Je kunt maximaal 5 bedrijven selecteren." });
    }

    // check of bedrijven bestaan
    const objectIds = companies
      .filter((id) => typeof id === "string" && mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return res.status(400).json({ ok: false, error: "Ongeldige bedrijfskeuze." });
    }

    const foundCompanies = await Company.find({ _id: { $in: objectIds } })
      .select("_id name email owner")
      .lean();

    if (!foundCompanies.length) {
      return res.status(404).json({ ok: false, error: "Geen van de gekozen bedrijven bestaat." });
    }

    // per bedrijf één aanvraag opslaan
    const toInsert = foundCompanies.map((c) => ({
      customerName,
      customerEmail,
      message: message || "",
      company: c._id,
      companyName: c.name || "",
      status: "open",
      source: "public-multi",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Request.insertMany(toInsert);

    return res.json({
      ok: true,
      created: toInsert.length,
    });
  } catch (err) {
    console.error("❌ Fout bij publicRequests/multi:", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij opslaan van de aanvraag." });
  }
});

module.exports = router;

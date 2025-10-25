// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");

// ✅ GET – aanvragen ophalen
router.get("/", async (req, res) => {
  try {
    const email = req.query.email;

    // Controle: geen e-mail opgegeven
    if (!email) {
      return res.status(400).json({ error: "E-mailadres ontbreekt" });
    }

    // ✅ Admin mag alle aanvragen zien
    if (email === "info@irisje.nl") {
      const allRequests = await Request.find().sort({ createdAt: -1 });
      return res.json(allRequests);
    }

    // Zoek het bedrijf bij dit e-mailadres
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(404).json({ error: "Geen bedrijf gevonden bij dit e-mailadres" });
    }

    // Zoek aanvragen van dit bedrijf
    const requests = await Request.find({ company: company._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// ✅ POST – nieuwe aanvraag opslaan
router.post("/", async (req, res) => {
  try {
    const { company, name, email, message } = req.body;

    if (!company || !name || !email || !message) {
      return res.status(400).json({ error: "Alle velden zijn verplicht" });
    }

    const newRequest = new Request({
      company,
      name,
      email,
      message,
      status: "Nieuw",
    });

    await newRequest.save();
    res.status(201).json({ ok: true, message: "Aanvraag opgeslagen", request: newRequest });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// ✅ PATCH – status bijwerken
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await Request.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) return res.status(404).json({ error: "Aanvraag niet gevonden" });

    res.json({ ok: true, message: "Status bijgewerkt", request });
  } catch (err) {
    console.error("❌ Fout bij statusupdate:", err);
    res.status(500).json({ error: "Interne serverfout" });
  }
});


// ✅ Aanvragen ophalen per bedrijf
router.get("/company/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const requests = await Request.find({ company: companyId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Fout bij ophalen aanvragen per bedrijf:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;

// backend/routes/requests.js
const express = require("express");
const auth = require("../middleware/auth");
const Request = require("../models/Request");
const Company = require("../models/Company");

const router = express.Router();

/**
 * POST /api/requests/create
 * Publieke route: klant dient een aanvraag in
 * Body: { company (bedrijfsnaam) of companyId, name, email, message }
 */
router.post("/create", async (req, res) => {
  try {
    const { company, companyId, name, email, message } = req.body;

    if (!name || !email || !message || (!company && !companyId)) {
      return res.status(400).json({ error: "Alle velden zijn verplicht." });
    }

    let targetCompanyId = companyId;

    // Toestaan op naam (zoals 'Demo Bedrijf')
    if (!targetCompanyId && company) {
      const target = await Company.findOne({ name: company }).select("_id");
      if (!target) {
        return res.status(404).json({ error: "Bedrijf niet gevonden." });
      }
      targetCompanyId = target._id;
    }

    const doc = await Request.create({
      companyId: targetCompanyId,
      name,
      email,
      message,
      status: "Nieuw",
      date: new Date(),
    });

    return res.json({ success: true, id: doc._id });
  } catch (err) {
    console.error("❌ Fout bij indienen aanvraag:", err);
    return res.status(500).json({ error: "Serverfout bij indienen aanvraag." });
  }
});

/**
 * GET /api/requests/company
 * Beveiligd: alle aanvragen van het ingelogde bedrijf
 */
router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const list = await Request.find({ companyId }).sort({ date: -1 });
    return res.json(list);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    return res.status(500).json({ error: "Serverfout bij ophalen aanvragen." });
  }
});

/**
 * PUT /api/requests/status/:id
 * Beveiligd: status wijzigen door ingelogd bedrijf
 * Body: { status: "Nieuw" | "Geaccepteerd" | "Afgewezen" | "Opgevolgd" }
 */
router.put("/status/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: "Ongeldige statuswaarde." });
    }

    // Optioneel: afdwingen dat de aanvraag bij dit bedrijf hoort
    const updated = await Request.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Aanvraag niet gevonden." });
    }

    return res.json(updated);
  } catch (err) {
    console.error("❌ Fout bij bijwerken status:", err);
    return res.status(500).json({ error: "Serverfout bij bijwerken status." });
  }
});

module.exports = router;

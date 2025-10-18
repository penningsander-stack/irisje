// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const auth = require("../middleware/auth");

// Haal alle aanvragen van het ingelogde bedrijf op
router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.json([]);

    const requests = await Request.find({ company: companyId }).sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    return res.status(500).json({ error: "Serverfout bij ophalen aanvragen" });
  }
});

// Publieke aanvraag insturen
router.post("/", async (req, res) => {
  try {
    const { name, email, message, companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: "Geen bedrijf opgegeven" });

    const newReq = new Request({
      name,
      email,
      message,
      company: companyId,
      status: "Nieuw",
    });

    await newReq.save();
    return res.json({ success: true, message: "Aanvraag verzonden" });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    return res.status(500).json({ error: "Serverfout bij opslaan aanvraag" });
  }
});

module.exports = router;

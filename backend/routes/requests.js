// backend/routes/requests.js
const express = require("express");
const auth = require("../middleware/auth");
const Request = require("../models/Request");

const router = express.Router();

// Publieke aanvraag indienen
router.post("/create", async (req, res) => {
  try {
    const { companyId, name, email, message } = req.body;
    if (!companyId || !name || !email || !message)
      return res.status(400).json({ error: "Alle velden zijn verplicht" });

    const doc = await Request.create({
      companyId,
      name,
      email,
      message,
      status: "Nieuw",
      date: new Date(),
    });

    res.json({ success: true, request: doc });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    res.status(500).json({ error: "Serverfout bij opslaan aanvraag" });
  }
});

// Aanvragen van bedrijf ophalen
router.get("/company", auth, async (req, res) => {
  try {
    const list = await Request.find({ companyId: req.user.companyId }).sort({ date: -1 });
    res.json(list);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ error: "Serverfout bij ophalen aanvragen" });
  }
});

// Status van aanvraag wijzigen
router.put("/status/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"];
    if (!valid.includes(status))
      return res.status(400).json({ error: "Ongeldige status" });

    const updated = await Request.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Aanvraag niet gevonden" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Fout bij bijwerken status:", err);
    res.status(500).json({ error: "Serverfout bij bijwerken status" });
  }
});

module.exports = router;

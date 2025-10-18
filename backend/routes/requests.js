// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Request = require("../models/Request");

// 📬 Alle aanvragen (voor admin of tests)
router.get("/", async (req, res) => {
  const all = await Request.find().lean();
  res.json(all);
});

// 🧩 Status bijwerken door bedrijf
router.patch("/status/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"].includes(status)) {
      return res.status(400).json({ error: "Ongeldige statuswaarde" });
    }

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: "Aanvraag niet gevonden" });

    request.status = status;
    await request.save();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Fout bij status-update:", err);
    res.status(500).json({ error: "Serverfout bij status-update" });
  }
});

module.exports = router;

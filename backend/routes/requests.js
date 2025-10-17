// backend/routes/requests.js
// ✅ Regelt ophalen, statistieken en status-updates van aanvragen

const express = require("express");
const router = express.Router();
const { verifyToken } = require("./auth");
const Request = require("../models/Request");

// ✅ Alle aanvragen van ingelogde company
router.get("/", verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;
    const requests = await Request.find({ company: companyId }).sort({
      createdAt: -1,
    });
    res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ message: "Serverfout bij ophalen aanvragen" });
  }
});

// ✅ Statistieken voor dashboard
router.get("/stats/overview", verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;
    const all = await Request.find({ company: companyId });

    const stats = {
      total: all.length,
      accepted: all.filter((r) => r.status === "Geaccepteerd").length,
      rejected: all.filter((r) => r.status === "Afgewezen").length,
      followedUp: all.filter((r) => r.status === "Opgevolgd").length,
    };

    res.json(stats);
  } catch (err) {
    console.error("❌ Fout bij ophalen statistieken:", err);
    res.status(500).json({ message: "Serverfout bij statistieken" });
  }
});

// ✅ Status van een aanvraag bijwerken
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status)
      return res.status(400).json({ message: "Geen status opgegeven" });

    const valid = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"];
    if (!valid.includes(status))
      return res
        .status(400)
        .json({ message: "Ongeldige status opgegeven" });

    const request = await Request.findOneAndUpdate(
      { _id: id, company: companyId },
      { status },
      { new: true }
    );

    if (!request)
      return res.status(404).json({ message: "Aanvraag niet gevonden" });

    console.log(`✅ Aanvraag ${id} → ${status}`);
    res.json(request);
  } catch (err) {
    console.error("❌ Fout bij status update:", err);
    res.status(500).json({ message: "Serverfout bij status update" });
  }
});

module.exports = router;

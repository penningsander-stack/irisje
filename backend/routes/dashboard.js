// backend/routes/dashboard.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Request = require("../models/Request");

const router = express.Router();

// Middleware om token te controleren
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Geen token meegegeven" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.companyId = decoded.companyId;
    next();
  } catch {
    return res.status(401).json({ error: "Ongeldig of verlopen token" });
  }
}

// Dashboarddata ophalen
router.get("/data", verifyToken, async (req, res) => {
  try {
    const companyId = req.companyId;
    const requests = await Request.find({ companyId }).sort({ date: -1 });

    const stats = {
      total: requests.length,
      accepted: requests.filter((r) => r.status === "Geaccepteerd").length,
      rejected: requests.filter((r) => r.status === "Afgewezen").length,
      followed: requests.filter((r) => r.status === "Opgevolgd").length,
    };

    res.json({ ...stats, requests });
  } catch (err) {
    console.error("Dashboard-fout:", err);
    res.status(500).json({ error: "Serverfout bij ophalen dashboarddata" });
  }
});

// Status bijwerken
router.put("/update/:id", verifyToken, async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;
    const { status } = req.body;

    const valid = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: "Ongeldige statuswaarde" });
    }

    const request = await Request.findOneAndUpdate(
      { _id: id, companyId },
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    res.json({ success: true, request });
  } catch (err) {
    console.error("Update-fout:", err);
    res.status(500).json({ error: "Fout bij bijwerken status" });
  }
});

module.exports = router;

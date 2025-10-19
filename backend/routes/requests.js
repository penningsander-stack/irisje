// backend/routes/requests.js
const express = require("express");
const router = express.Router();

// 🔧 Tijdelijke mock-data om het dashboard zichtbaar te maken
const demoRequests = [
  {
    _id: "req1",
    name: "Jan de Vries",
    email: "jan@example.com",
    message: "Ik heb interesse in jullie diensten.",
    status: "Nieuw",
    date: new Date("2025-10-10"),
  },
  {
    _id: "req2",
    name: "Petra Jansen",
    email: "petra@example.com",
    message: "Kunnen jullie mij morgen bellen?",
    status: "Geaccepteerd",
    date: new Date("2025-10-12"),
  },
];

// 📬 Route: aanvragen per bedrijf ophalen
router.get("/:companyId", async (req, res) => {
  try {
    // In plaats van database → direct mockdata teruggeven
    res.json(demoRequests);
  } catch (err) {
    console.error("Fout bij laden aanvragen:", err);
    res.status(500).json({ error: "Serverfout bij laden aanvragen" });
  }
});

// 📮 Nieuwe aanvraag (alleen voor test)
router.post("/", async (req, res) => {
  try {
    const newRequest = { _id: Date.now().toString(), ...req.body };
    demoRequests.push(newRequest);
    res.status(201).json(newRequest);
  } catch (err) {
    console.error("Fout bij opslaan aanvraag:", err);
    res.status(500).json({ error: "Serverfout bij opslaan aanvraag" });
  }
});

module.exports = router;

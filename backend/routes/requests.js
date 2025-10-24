// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const User = require("../models/User");

// ✅ Alle aanvragen ophalen (bedrijf of admin)
router.get("/", async (req, res) => {
  try {
    const email = req.query.email; // meegegeven via frontend
    if (!email) return res.status(400).json({ message: "E-mail ontbreekt" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Gebruiker niet gevonden" });

    let requests;

    if (user.role === "admin") {
      // Admin ziet alle aanvragen
      requests = await Request.find().sort({ createdAt: -1 });
    } else {
      // Bedrijven zien alleen hun eigen aanvragen
      requests = await Request.find({ company: user.companyId }).sort({ createdAt: -1 });
    }

    res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ message: "Fout bij laden aanvragen" });
  }
});

// ✅ Nieuwe aanvraag opslaan (publieke route)
router.post("/", async (req, res) => {
  try {
    const { company, name, email, message } = req.body;
    if (!company || !name || !email || !message) {
      return res.status(400).json({ message: "Ontbrekende velden" });
    }

    const newRequest = new Request({
      company,
      name,
      email,
      message,
      status: "Nieuw",
    });

    await newRequest.save();
    res.status(201).json({ message: "✅ Aanvraag opgeslagen", request: newRequest });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    res.status(500).json({ message: "Fout bij opslaan aanvraag" });
  }
});

// ✅ Status van aanvraag wijzigen
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ message: "Aanvraag niet gevonden" });
    res.json({ message: "Status bijgewerkt", request });
  } catch (err) {
    console.error("❌ Fout bij wijzigen status:", err);
    res.status(500).json({ message: "Fout bij wijzigen status" });
  }
});

module.exports = router;

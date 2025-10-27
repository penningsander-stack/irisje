// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");
// const { sendMail } = require("../utils/mailer"); // tijdelijk uitgeschakeld

// 📩 Nieuwe offerteaanvraag ontvangen
router.post("/", async (req, res) => {
  try {
    const { companySlug, company, companyId, name, email, city, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Ontbrekende velden" });
    }

    // Zoek optioneel bedrijf
    let companyDoc = null;
    if (companySlug) companyDoc = await Company.findOne({ slug: companySlug });
    if (!companyDoc && (company || companyId)) companyDoc = await Company.findById(company || companyId);

    // Nieuwe aanvraag opslaan
    const newRequest = new Request({
      company: companyDoc ? companyDoc._id : null,
      name,
      email,
      city,
      message,
      status: "Nieuw",
      date: new Date(),
    });

    await newRequest.save();

    // 📴 Mailfunctie tijdelijk uitgeschakeld
    // await sendMail({ ... });

    res.json({ message: "✅ Aanvraag succesvol verzonden!", request: newRequest });
  } catch (error) {
    console.error("Fout bij versturen aanvraag:", error);
    res.status(500).json({ message: "Serverfout bij versturen aanvraag" });
  }
});

// 📋 Alle aanvragen ophalen
router.get("/", async (req, res) => {
  try {
    const requests = await Request.find().lean();
    res.json(requests);
  } catch (error) {
    console.error("Fout bij ophalen aanvragen:", error);
    res.status(500).json({ message: "Serverfout bij ophalen aanvragen" });
  }
});

module.exports = router;

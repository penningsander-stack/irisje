// backend/routes/requests.js
const express = require("express");
const Company = require("../models/Company");
const Request = require("../models/Request");
const nodemailer = require("nodemailer");
const router = express.Router();

// 📧 e-mailtransport instellen met SMTP (gebruik jouw info@irisje.nl)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // true = SSL (poort 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ Nieuwe aanvraag aanmaken en e-mail sturen
router.post("/create", async (req, res) => {
  try {
    const { company, name, email, message } = req.body;

    // Basisvalidatie
    if (!company || !name || !email || !message) {
      return res.status(400).json({ error: "Alle velden zijn verplicht." });
    }

    // Zoek het bedrijf in de database
    const targetCompany = await Company.findOne({ name: company });
    if (!targetCompany) {
      return res.status(404).json({ error: "Bedrijf niet gevonden." });
    }

    // Aanvraag opslaan
    const newRequest = await Request.create({
      companyId: targetCompany._id,
      name,
      email,
      message,
      status: "Nieuw",
      date: new Date(),
    });

    console.log(`📩 Nieuwe aanvraag ontvangen voor ${company} van ${name}`);

    // E-mail versturen
    try {
      await transporter.sendMail({
        from: `"Irisje.nl" <${process.env.SMTP_USER}>`,
        to: targetCompany.email,
        subject: `Nieuwe aanvraag via Irisje.nl – ${company}`,
        html: `
          <h2>Nieuwe aanvraag ontvangen</h2>
          <p><strong>Bedrijf:</strong> ${company}</p>
          <p><strong>Naam aanvrager:</strong> ${name}</p>
          <p><strong>E-mail aanvrager:</strong> ${email}</p>
          <p><strong>Bericht:</strong><br>${message}</p>
          <p>Bekijk de aanvraag in je dashboard:<br>
          <a href="https://irisje-frontend.onrender.com/login.html">Inloggen bij Irisje.nl</a></p>
        `,
      });

      console.log(`✅ E-mail verzonden naar ${targetCompany.email}`);
    } catch (mailErr) {
      console.error("⚠️ E-mailfout:", mailErr);
    }

    return res.json({
      success: true,
      message: "Aanvraag succesvol verzonden.",
      id: newRequest._id,
    });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    res.status(500).json({ error: "Serverfout bij indienen aanvraag." });
  }
});

module.exports = router;

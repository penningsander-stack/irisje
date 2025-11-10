// backend/routes/reviews.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Review = require("../models/review");
const Company = require("../models/company");
const { sendMail } = require("../utils/mailer");
const { reviewConfirmationCustomer, reviewConfirmedAdmin } = require("../utils/emailTemplates");

/* ============================================================
   ✅ Alle reviews van een bedrijf ophalen via slug of ID
============================================================ */
router.get("/company/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier?.trim();
    if (!identifier) {
      return res.status(400).json({ error: "Geen bedrijfsidentifier opgegeven" });
    }

    let company = null;

    // Controleer of het een ObjectId of slug is
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      company = await Company.findById(identifier).lean();
    } else {
      company = await Company.findOne({ slug: identifier }).lean();
    }

    if (!company) {
      return res.status(404).json({ error: "Bedrijf niet gevonden" });
    }

    // Alleen bevestigde reviews tonen
    const reviews = await Review.find({ company: company._id, isConfirmed: true })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      company: {
        name: company.name,
        slug: company.slug,
        avgRating: company.avgRating || 0,
        reviewCount: reviews.length,
      },
      reviews,
    });
  } catch (error) {
    console.error("❌ Fout bij ophalen reviews:", error);
    res.status(500).json({ error: "Serverfout bij ophalen reviews" });
  }
});

/* ============================================================
   📝 Nieuwe review indienen (met bevestiging per e-mail)
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { companyId, name, email, rating, message } = req.body || {};

    if (!companyId || !name || !email || !rating || !message) {
      return res.status(400).json({ ok: false, error: "Alle velden zijn verplicht." });
    }

    const company = await Company.findById(companyId).lean();
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden." });
    }

    // Unieke token genereren voor bevestiging
    const token = crypto.randomBytes(32).toString("hex");

    const review = new Review({
      company: company._id,
      name,
      email,
      rating,
      message,
      confirmToken: token,
      isConfirmed: false,
    });

    await review.save();

    // ✅ Bevestigingslink opbouwen
    const confirmUrl = `${process.env.FRONTEND_URL || "https://irisje.nl"}/api/reviews/confirm/${token}`;

    // ✅ Bevestigingsmail versturen
    try {
      await sendMail({
        to: email,
        subject: `Bevestig je review voor ${company.name}`,
        html: reviewConfirmationCustomer(name, company.name, message, confirmUrl),
      });
      console.log(`📧 Reviewbevestiging verzonden naar ${email}`);
    } catch (mailErr) {
      console.error("⚠️ Fout bij verzenden reviewbevestiging:", mailErr);
    }

    res.json({ ok: true, message: "Review ontvangen. Bevestig via de link in je e-mail." });
  } catch (error) {
    console.error("❌ Fout bij opslaan review:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij opslaan review." });
  }
});

/* ============================================================
   ✅ Reviewbevestiging via e-mailtoken
============================================================ */
router.get("/confirm/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const review = await Review.findOne({ confirmToken: token });

    if (!review) {
      return res.status(404).send("<h2>Ongeldige of verlopen bevestigingslink.</h2>");
    }

    if (review.isConfirmed) {
      return res.send("<h2>Deze review is al bevestigd.</h2>");
    }

    review.isConfirmed = true;
    review.confirmToken = null;
    await review.save();

    // ✅ Beheerder informeren
    try {
      const company = await Company.findById(review.company).lean();
      await sendMail({
        to: process.env.SMTP_FROM,
        subject: `Nieuwe bevestigde review voor ${company?.name || "onbekend bedrijf"}`,
        html: reviewConfirmedAdmin(company?.name || "-", review.name, review.rating, review.message),
      });
      console.log(`📧 Beheer geïnformeerd over bevestigde review (${review.name})`);
    } catch (notifyErr) {
      console.error("⚠️ Fout bij melding beheer:", notifyErr);
    }

    res.send(`
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:40px;text-align:center;">
        <h2 style="color:#4F46E5;">✅ Review bevestigd!</h2>
        <p>Bedankt ${review.name}, je review is succesvol bevestigd en wordt nu weergegeven op de pagina van het bedrijf.</p>
        <a href="https://irisje.nl" style="display:inline-block;margin-top:20px;background:#4F46E5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Terug naar Irisje.nl</a>
      </div>
    `);
  } catch (error) {
    console.error("❌ Fout bij bevestigen review:", error);
    res.status(500).send("<h2>Er ging iets mis bij het bevestigen van je review.</h2>");
  }
});

/* ============================================================
   🚩 Review melden
============================================================ */
router.patch("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Geen review-ID opgegeven" });

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review niet gevonden" });

    review.reported = true;
    await review.save();

    res.json({ success: true, message: "Review succesvol gemeld" });
  } catch (error) {
    console.error("❌ Fout bij melden review:", error);
    res.status(500).json({ error: "Serverfout bij melden review" });
  }
});

module.exports = router;

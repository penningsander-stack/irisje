// backend/routes/reviews.js
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const router = express.Router();

const Review = require("../models/review");
const Company = require("../models/company");
const { sendMail } = require("../utils/mailer");
const {
  reviewConfirmationCustomer,
  reviewConfirmedAdmin,
} = require("../utils/emailTemplates");

/* ============================================================
   ✅ Reviews ophalen (alleen bevestigde)
============================================================ */
router.get("/company/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier?.trim();
    if (!identifier) {
      return res.status(400).json({ error: "Geen bedrijfsidentifier opgegeven" });
    }

    const company = /^[0-9a-fA-F]{24}$/.test(identifier)
      ? await Company.findById(identifier).lean()
      : await Company.findOne({ slug: identifier }).lean();

    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });

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
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

/* ============================================================
   📝 Nieuwe review indienen (met bevestiging per e-mail)
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { companyId, name, email, rating, message } = req.body || {};

    if (!companyId || !name || !email || !rating || !message) {
      return res
        .status(400)
        .json({ ok: false, error: "Alle velden zijn verplicht." });
    }

    const company = await Company.findById(companyId).lean();
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden." });
    }

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

    // ✅ Correcte backend-URL gebruiken
    const backendBase = process.env.BACKEND_URL || "https://irisje-backend.onrender.com";
    const confirmUrl = `${backendBase}/api/reviews/confirm/${token}`;

    // ✅ Verstuur bevestigingsmail
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

    res.json({
      ok: true,
      message:
        "Bedankt! Je review is ontvangen. Controleer je e-mail om deze te bevestigen voordat hij wordt geplaatst.",
    });
  } catch (error) {
    console.error("❌ Fout bij opslaan review:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij opslaan review." });
  }
});

/* ============================================================
   ✅ Review bevestigen via token
============================================================ */
router.get("/confirm/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.sendFile(path.join(__dirname, "../public/review-failed.html"));
    }

    const review = await Review.findOne({ confirmToken: token });

    // ❌ Ongeldige of verlopen token
    if (!review) {
      return res.sendFile(path.join(__dirname, "../public/review-failed.html"));
    }

    // ✅ Al bevestigd
    if (review.isConfirmed) {
      return res.sendFile(path.join(__dirname, "../public/review-confirm.html"));
    }

    // ✅ Nieuwe bevestiging
    review.isConfirmed = true;
    review.confirmToken = null;
    await review.save();

    // ✅ Beheer informeren
    try {
      const company = await Company.findById(review.company).lean();
      await sendMail({
        to: process.env.SMTP_FROM,
        subject: `Nieuwe bevestigde review voor ${company?.name || "onbekend bedrijf"}`,
        html: reviewConfirmedAdmin(
          company?.name || "-",
          review.name,
          review.rating,
          review.message
        ),
      });
      console.log(`📧 Beheer geïnformeerd over bevestigde review (${review.name})`);
    } catch (notifyErr) {
      console.error("⚠️ Fout bij melding beheer:", notifyErr);
    }

    // ✅ Toon nette bevestigingspagina
    return res.sendFile(path.join(__dirname, "../public/review-confirm.html"));
  } catch (error) {
    console.error("❌ Fout bij bevestigen review:", error);
    return res.sendFile(path.join(__dirname, "../public/review-failed.html"));
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
    res.status(500).json({ error: "Serverfout bij melden review." });
  }
});

module.exports = router;

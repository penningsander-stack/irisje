// backend/routes/reviews.js
// v20251231-REVIEWS-CONFIRM-FINAL

const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Review = require("../models/review");
const Company = require("../models/company");
const { sendMail } = require("../utils/mailer");
const {
  reviewConfirmationCustomer,
  reviewConfirmedAdmin,
} = require("../utils/emailtemplates");

/* ============================================================
   📥 Reviews ophalen (ALLEEN bevestigde)
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

    if (!company) {
      return res.status(404).json({ error: "Bedrijf niet gevonden" });
    }

    const reviews = await Review.find({
      company: company._id,
      isConfirmed: true,
    })
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
      items: reviews,
    });
  } catch (err) {
    console.error("❌ reviews ophalen:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

/* ============================================================
   📝 Review indienen + mailbevestiging
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { companySlug, name, email, rating, comment } = req.body || {};

    if (!companySlug || !name || !email || !rating || !comment) {
      return res.status(400).json({
        ok: false,
        error: "Alle velden zijn verplicht",
      });
    }

    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const review = new Review({
      company: company._id,
      name,
      email,
      rating,
      comment,
      confirmToken: token,
      isConfirmed: false,
    });

    await review.save();

    const backendBase =
      process.env.BACKEND_URL || "https://irisje-backend.onrender.com";

    const confirmUrl = `${backendBase}/api/reviews/confirm/${token}`;

    await sendMail({
      to: email,
      subject: `Bevestig je review voor ${company.name}`,
      html: reviewConfirmationCustomer(name, company.name, comment, confirmUrl),
    });

    res.json({
      ok: true,
      message: "Controleer je e-mail om je review te bevestigen.",
    });
  } catch (err) {
    console.error("❌ review opslaan:", err);
    res.status(500).json({ ok: false, error: "Serverfout" });
  }
});

/* ============================================================
   ✅ Review bevestigen
============================================================ */
router.get("/confirm/:token", async (req, res) => {
  const frontendBase = "https://irisje.nl";

  try {
    const review = await Review.findOne({ confirmToken: req.params.token });
    if (!review) {
      return res.redirect(`${frontendBase}/review-failed.html`);
    }

    if (review.isConfirmed) {
      return res.redirect(`${frontendBase}/review-confirm.html`);
    }

    review.isConfirmed = true;
    review.confirmToken = null;
    await review.save();

    const company = await Company.findById(review.company).lean();

    await sendMail({
      to: process.env.SMTP_FROM,
      subject: `Nieuwe bevestigde review voor ${company?.name || "bedrijf"}`,
      html: reviewConfirmedAdmin(
        company?.name,
        review.name,
        review.rating,
        review.comment
      ),
    });

    res.redirect(`${frontendBase}/review-confirm.html`);
  } catch (err) {
    console.error("❌ bevestigen review:", err);
    res.redirect(`${frontendBase}/review-failed.html`);
  }
});

/* ============================================================
   🚩 Review melden
============================================================ */
router.patch("/report/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review niet gevonden" });
    }

    review.reported = true;
    await review.save();

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ review melden:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;

// backend/routes/reviews.js
// v20260101-REVIEWS-CONFIRM-RESTORED
//
// Herstelt review-bevestiging (token) + consistente velden:
// - Model gebruikt: company, name, email, rating, message, isConfirmed, confirmToken, reported
// - POST accepteert ook legacy velden: comment (-> message)
// - GET /company/:identifier geeft alleen confirmed reviews terug
// - GET /confirm/:token bevestigt + herberekent avgRating/reviewCount op Company

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
   ✅ Reviews ophalen (alleen bevestigde)
   GET /api/reviews/company/:identifier
   - identifier = companyId (ObjectId) OF slug
============================================================ */
router.get("/company/:identifier", async (req, res) => {
  try {
    const identifier = (req.params.identifier || "").trim();
    if (!identifier) {
      return res.status(400).json({ ok: false, error: "Geen bedrijfsidentifier opgegeven" });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const company = isObjectId
      ? await Company.findById(identifier).lean()
      : await Company.findOne({ slug: identifier }).lean();

    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }

    const items = await Review.find({
      company: company._id,
      isConfirmed: true,
      reported: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      company: {
        name: company.name,
        slug: company.slug,
        avgRating: company.avgRating || 0,
        reviewCount: typeof company.reviewCount === "number" ? company.reviewCount : items.length,
      },
      items,
    });
  } catch (error) {
    console.error("❌ Fout bij ophalen reviews:", error);
    return res.status(500).json({ ok: false, error: "Serverfout bij ophalen reviews." });
  }
});

/* ============================================================
   📝 Nieuwe review indienen (met bevestigingstoken)
   POST /api/reviews
   Body (nieuw):
     { companySlug, rating, message, name?, email? }
   Body (legacy):
     { companySlug, rating, comment, name?, email? }  -> comment => message
============================================================ */
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    const companySlug = (body.companySlug || "").trim();
    const ratingRaw = body.rating;
    const nameRaw = body.name;
    const emailRaw = body.email;
    const messageRaw = body.message ?? body.comment; // legacy support

    if (!companySlug) {
      return res.status(400).json({ ok: false, error: "companySlug is verplicht" });
    }

    const rating = Number(ratingRaw);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, error: "rating moet 1 t/m 5 zijn" });
    }

    const message = String(messageRaw || "").trim();
    if (!message) {
      return res.status(400).json({ ok: false, error: "message/comment is verplicht" });
    }

    const name = String(nameRaw || "").trim() || "Anoniem";
    const email = String(emailRaw || "").trim();

    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const review = new Review({
      company: company._id,
      name,
      email: email || undefined,
      rating,
      message,
      isConfirmed: false,
      confirmToken: token,
    });

    await review.save();

    // ✅ Bevestigingslink
    const backendBase =
      (process.env.BACKEND_URL || "https://irisje-backend.onrender.com").replace(/\/$/, "");
    const confirmUrl = `${backendBase}/api/reviews/confirm/${token}`;

    // ✅ Mail naar klant alleen als email is ingevuld
    if (email) {
      try {
        await sendMail({
          to: email,
          subject: `Bevestig je review voor ${company.name}`,
          html: reviewConfirmationCustomer(name, company.name, message, confirmUrl),
        });
      } catch (mailErr) {
        console.error("⚠️ Fout bij verzenden reviewbevestiging:", mailErr);
        // Let op: review blijft opgeslagen; klant kan opnieuw proberen.
      }
    }

    return res.json({
      ok: true,
      message:
        email
          ? "Bedankt! Je review is ontvangen. Controleer je e-mail om deze te bevestigen."
          : "Bedankt! Je review is ontvangen. (Geen e-mail ingevuld, dus geen bevestigingsmail verzonden.)",
    });
  } catch (error) {
    console.error("❌ Fout bij opslaan review:", error);
    return res.status(500).json({ ok: false, error: "Serverfout bij opslaan review." });
  }
});

/* ============================================================
   ✅ Review bevestigen via token
   GET /api/reviews/confirm/:token
============================================================ */
router.get("/confirm/:token", async (req, res) => {
  const frontendBase = "https://irisje.nl";

  try {
    const token = (req.params.token || "").trim();
    if (!token) {
      res.writeHead(302, { Location: `${frontendBase}/review-failed.html` });
      return res.end();
    }

    const review = await Review.findOne({ confirmToken: token });
    if (!review) {
      res.writeHead(302, { Location: `${frontendBase}/review-failed.html` });
      return res.end();
    }

    // Al bevestigd
    if (review.isConfirmed) {
      res.writeHead(302, { Location: `${frontendBase}/review-confirm.html` });
      return res.end();
    }

    // Bevestigen
    review.isConfirmed = true;
    review.confirmToken = null;
    await review.save();

    // ⭐ Company stats opnieuw berekenen (confirmed only)
    try {
      const confirmed = await Review.find({
        company: review.company,
        isConfirmed: true,
        reported: { $ne: true },
      }).lean();

      const count = confirmed.length;
      const avg =
        count > 0
          ? Math.round((confirmed.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count) * 10) / 10
          : 0;

      await Company.findByIdAndUpdate(review.company, {
        avgRating: avg,
        reviewCount: count,
      });
    } catch (statErr) {
      console.error("⚠️ Fout bij herberekenen company stats:", statErr);
    }

    // ✅ Admin informeren (als SMTP_FROM bestaat)
    try {
      const company = await Company.findById(review.company).lean();
      const adminTo = process.env.SMTP_FROM;

      if (adminTo) {
        await sendMail({
          to: adminTo,
          subject: `Nieuwe bevestigde review voor ${company?.name || "onbekend bedrijf"}`,
          html: reviewConfirmedAdmin(
            company?.name || "-",
            review.name || "Anoniem",
            review.rating,
            review.message
          ),
        });
      }
    } catch (notifyErr) {
      console.error("⚠️ Fout bij melding beheer:", notifyErr);
    }

    res.writeHead(302, { Location: `${frontendBase}/review-confirm.html` });
    return res.end();
  } catch (error) {
    console.error("❌ Fout bij bevestigen review:", error);
    res.writeHead(302, { Location: `${frontendBase}/review-failed.html` });
    return res.end();
  }
});

/* ============================================================
   🚩 Review melden
   PATCH /api/reviews/report/:id
============================================================ */
router.patch("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok: false, error: "Geen review-ID opgegeven" });

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ ok: false, error: "Review niet gevonden" });

    review.reported = true;
    await review.save();

    return res.json({ ok: true, message: "Review succesvol gemeld" });
  } catch (error) {
    console.error("❌ Fout bij melden review:", error);
    return res.status(500).json({ ok: false, error: "Serverfout bij melden review." });
  }
});

module.exports = router;

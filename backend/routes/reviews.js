// backend/routes/reviews.js
// v20260111-REVIEWS-SYNC
//
// Reviews API – met automatische sync naar Company.avgRating / reviewCount
//
// Endpoints:
// - POST   /api/reviews
// - GET    /api/reviews/confirm/:token
// - GET    /api/reviews/company/:companyId
// - PATCH  /api/reviews/report/:id

const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Review = require("../models/review");
const Company = require("../models/company");
const mailer = require("../utils/mailer");

// ------------------------
// Helpers
// ------------------------
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function recalcCompanyRating(companyId) {
  const stats = await Review.aggregate([
    { $match: { companyId, status: "approved" } },
    {
      $group: {
        _id: "$companyId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length === 0) {
    await Company.findByIdAndUpdate(companyId, {
      avgRating: 0,
      reviewCount: 0,
    });
    return;
  }

  await Company.findByIdAndUpdate(companyId, {
    avgRating: Math.round(stats[0].avgRating * 10) / 10,
    reviewCount: stats[0].reviewCount,
  });
}

// ------------------------
// POST /api/reviews
// ------------------------
router.post("/", async (req, res) => {
  try {
    const {
      companyId,
      companySlug,
      rating,
      reviewerName,
      reviewerEmail,
      comment,
      message,
    } = req.body || {};

    if (!rating || !reviewerName || !reviewerEmail || (!comment && !message)) {
      return res.status(400).json({
        ok: false,
        error: "Ontbrekende verplichte velden.",
      });
    }

    let resolvedCompanyId = companyId || null;

    if (!resolvedCompanyId && companySlug) {
      const company = await Company.findOne({ slug: companySlug }).select("_id");
      if (!company) {
        return res.status(404).json({
          ok: false,
          error: "Bedrijf niet gevonden.",
        });
      }
      resolvedCompanyId = company._id;
    }

    if (!resolvedCompanyId) {
      return res.status(400).json({
        ok: false,
        error: "companyId of companySlug is verplicht.",
      });
    }

    const token = generateToken();

    const review = new Review({
      companyId: resolvedCompanyId,
      rating,
      comment: comment || message,
      reviewerName,
      reviewerEmail,
      status: "pending",
      confirmToken: token,
    });

    await review.save();

    const confirmUrl = `https://irisje-backend.onrender.com/api/reviews/confirm/${token}`;

    try {
      await mailer.sendMail({
        to: reviewerEmail,
        subject: "Bevestig je review op Irisje.nl",
        html: `
          <p>Hoi ${reviewerName},</p>
          <p>Bevestig je review via onderstaande link:</p>
          <p><a href="${confirmUrl}">${confirmUrl}</a></p>
          <p>Groet,<br>Irisje.nl</p>
        `,
      });
    } catch (mailErr) {
      console.error("[reviews] mail error:", mailErr.message);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[reviews] POST error:", err);
    return res.status(500).json({
      ok: false,
      error: "Interne fout bij opslaan review.",
    });
  }
});

// ------------------------
// GET /api/reviews/confirm/:token
// ------------------------
router.get("/confirm/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const review = await Review.findOne({ confirmToken: token });
    if (!review) {
      return res.redirect("https://irisje.nl/review-failed.html");
    }

    review.status = "approved";
    review.confirmToken = null;
    await review.save();

    // 🔁 HERBEREKEN COMPANY SCORE
    await recalcCompanyRating(review.companyId);

    return res.redirect("https://irisje.nl/review-confirm.html");
  } catch (err) {
    console.error("[reviews] confirm error:", err);
    return res.redirect("https://irisje.nl/review-failed.html");
  }
});

// ------------------------
// GET /api/reviews/company/:companyId
// ------------------------
router.get("/company/:companyId", async (req, res) => {
  try {
    const reviews = await Review.find({
      companyId: req.params.companyId,
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      reviews,
    });
  } catch (err) {
    console.error("[reviews] company load error:", err);
    return res.status(500).json({
      ok: false,
      error: "Kon reviews niet laden.",
    });
  }
});

// ------------------------
// PATCH /api/reviews/report/:id
// ------------------------
router.patch("/report/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        ok: false,
        error: "Review niet gevonden.",
      });
    }

    review.status = "rejected";
    await review.save();

    // 🔁 HERBEREKEN COMPANY SCORE
    await recalcCompanyRating(review.companyId);

    return res.json({ ok: true });
  } catch (err) {
    console.error("[reviews] report error:", err);
    return res.status(500).json({
      ok: false,
      error: "Kon review niet melden.",
    });
  }
});

module.exports = router;

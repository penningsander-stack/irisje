// backend/routes/reviews.js
// v20260102-REVIEWS-CONFIRM-FIX
//
// Reviews API – Optie B (status + confirmToken)
// Confirm-route deterministisch gemaakt (stap 7g.6)

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
      message, // legacy
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

    const mappedComment = comment || message;
    const token = generateToken();

    const review = new Review({
      companyId: resolvedCompanyId,
      rating,
      comment: mappedComment,
      reviewerName,
      reviewerEmail,
      status: "pending",
      confirmToken: token,
    });

    await review.save();

    try {
      const confirmUrl = `https://irisje.nl/review-confirm.html?token=${token}`;
      await mailer.sendMail({
        to: reviewerEmail,
        subject: "Bevestig je review op Irisje.nl",
        html: `
          <p>Hoi ${reviewerName},</p>
          <p>Bedankt voor je review. Klik op de knop hieronder om je review te bevestigen:</p>
          <p>
            <a href="${confirmUrl}"
               style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">
              Review bevestigen
            </a>
          </p>
          <p>Werkt de knop niet? Kopieer deze link:</p>
          <p>${confirmUrl}</p>
          <p>Groet,<br>Irisje.nl</p>
        `,
      });
    } catch (mailErr) {
      console.error("[reviews] confirm mail failed:", mailErr.message);
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
    if (!token) {
      return res.redirect("https://irisje.nl/review-failed.html");
    }

    // 1. Review zoeken
    const review = await Review.findOne({ confirmToken: token });
    if (!review) {
      return res.redirect("https://irisje.nl/review-failed.html");
    }

    // 2. Status aanpassen
    review.status = "approved";
    review.confirmToken = null;

    // 3. ALTIJD eerst opslaan
    await review.save();

    // 4. Pas daarna redirect
    return res.redirect("https://irisje.nl/review-confirmed.html");
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
    const { companyId } = req.params;

    const reviews = await Review.find({
      companyId,
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
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        ok: false,
        error: "Review niet gevonden.",
      });
    }

    review.status = "rejected";
    await review.save();

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

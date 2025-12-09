// backend/routes/adminTools.js
// v20251213-ADMIN-TOOLS-FULL
//
// Extra admin-routes voor het Irisje-dashboard:
// - GET /api/admin/stats   → globale statistieken
// - GET /api/admin/health  → systeemstatus (backend + database + smtp + versies)
//
// Deze router wordt in server.js onder `/api/admin` gemount:
//   const adminToolsRouter = require("./routes/adminTools");
//   app.use("/api/admin", adminToolsRouter);

const express = require("express");
const mongoose = require("mongoose");

const Company = require("../models/Company");
const Request = require("../models/Request");
const Review = require("../models/Review");
const User = require("../models/User");

const { authMiddleware, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function mapDbState(state) {
  switch (state) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
}

/**
 * GET /api/admin/stats
 * Globale statistieken voor het admin-dashboard.
 * JSON-structuur sluit aan op frontend/js/admin-tools.js.
 */
router.get("/stats", authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Basis totalen
    const [totalCompanies, totalRequests, totalReviews, totalUsers] =
      await Promise.all([
        Company.countDocuments({}),
        Request.countDocuments({}),
        Review.countDocuments({}),
        User.countDocuments({}),
      ]);

    // Open/gesloten aanvragen (status-veld komt uit jouw Request-model)
    const [openRequests, closedRequests] = await Promise.all([
      Request.countDocuments({ status: "open" }),
      Request.countDocuments({ status: "closed" }),
    ]);

    // Gemelde reviews (bijv. veld: reported === true)
    const reportedReviews = await Review.countDocuments({ reported: true });

    // Laatste activiteit
    const latestRequest = await Request.findOne({})
      .sort({ createdAt: -1 })
      .select({ createdAt: 1, _id: 0 })
      .lean()
      .exec();

    const latestReview = await Review.findOne({})
      .sort({ createdAt: -1 })
      .select({ createdAt: 1, _id: 0 })
      .lean()
      .exec();

    const stats = {
      totalCompanies,
      activeCompanies: totalCompanies, // eventueel later onderscheid maken
      totalRequests,
      openRequests,
      closedRequests,
      totalReviews,
      reportedReviews,
      totalUsers,
      latestRequestAt: latestRequest?.createdAt || null,
      latestReviewAt: latestReview?.createdAt || null,
    };

    return res.json(stats);
  } catch (err) {
    console.error("[adminTools] Fout bij /stats:", err);
    return res.status(500).json({
      ok: false,
      message: "Kon statistieken niet ophalen",
      error: err.message,
    });
  }
});

/**
 * GET /api/admin/health
 * Systeemstatus voor admin-dashboard (geen gevoelige details).
 */
router.get("/health", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const dbState = mapDbState(mongoose.connection.readyState);

    const health = {
      ok: dbState === "connected",
      backend: {
        uptimeSeconds: Math.round(process.uptime()),
        now: new Date().toISOString(),
      },
      database: {
        state: dbState,
        host: mongoose.connection.host || undefined,
        name: mongoose.connection.name || undefined,
      },
      smtp: {
        configured: !!(process.env.SMTP_HOST || process.env.SMTP_USER),
        status: "unknown", // geen echte SMTP-ping om timeouts te vermijden
      },
      version: {
        backend: process.env.BACKEND_VERSION || "1.0.0",
        node: process.version,
        env: process.env.NODE_ENV || "development",
      },
    };

    return res.json(health);
  } catch (err) {
    console.error("[adminTools] Fout bij /health:", err);
    return res.status(500).json({
      ok: false,
      message: "Kon systeemstatus niet ophalen",
      error: err.message,
    });
  }
});

module.exports = router;

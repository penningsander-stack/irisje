// backend/routes/adminTools.js
// v20251209-ADMINTOOLS-FIXED-LOWERCASE
//
// Admin extra tools:
// - GET /api/admin/stats
// - GET /api/admin/health
//
// Deze router valideert zelf de admin-JWT via Authorization: Bearer <token>
// zodat hij onafhankelijk is van andere middleware en je adminToken uit localStorage
// gewoon werkt.

const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Company = require("../models/company");
const Request = require("../models/request");
const Review = require("../models/review");
const User = require("../models/user");

const router = express.Router();

function verifyAdminRequest(req, res) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ ok: false, message: "Geen geldige Authorization header" });
      return null;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      res.status(401).json({ ok: false, message: "Geen token meegegeven" });
      return null;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[adminTools] JWT_SECRET ontbreekt in environment.");
      res.status(500).json({ ok: false, message: "Serverconfiguratie onvolledig (JWT_SECRET)" });
      return null;
    }

    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.role !== "admin") {
      res.status(403).json({ ok: false, message: "Alleen admin toegestaan" });
      return null;
    }

    req.user = decoded;
    return decoded;
  } catch (err) {
    console.error("[adminTools] Fout bij token-verificatie:", err.message);
    res.status(401).json({ ok: false, message: "Ongeldige of verlopen token" });
    return null;
  }
}

function mapDbState(state) {
  switch (state) {
    case 0: return "disconnected";
    case 1: return "connected";
    case 2: return "connecting";
    case 3: return "disconnecting";
    default: return "unknown";
  }
}

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  const admin = verifyAdminRequest(req, res);
  if (!admin) return;

  try {
    const [totalCompanies, totalRequests, totalReviews, totalUsers] = await Promise.all([
      Company.countDocuments({}),
      Request.countDocuments({}),
      Review.countDocuments({}),
      User.countDocuments({}),
    ]);

    const [openRequests, closedRequests] = await Promise.all([
      Request.countDocuments({ status: "open" }),
      Request.countDocuments({ status: "closed" }),
    ]);

    const reportedReviews = await Review.countDocuments({ reported: true });

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
      activeCompanies: totalCompanies,
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

// GET /api/admin/health
router.get("/health", async (req, res) => {
  const admin = verifyAdminRequest(req, res);
  if (!admin) return;

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
        status: "unknown",
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

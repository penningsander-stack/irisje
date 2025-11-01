// backend/routes/status.js
const express = require("express");
const mongoose = require("mongoose");
const os = require("os");
const Company = require("../models/Company");
const { getLogs } = require("../utils/logger");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = ["🔴", "🟡", "🟢", "🔵"][dbState] || "❓";
    const companyCount = await Company.countDocuments().catch(() => 0);
    const uptimeSec = process.uptime();

    res.json({
      ok: true,
      version: "2025.10-stable",
      environment: process.env.NODE_ENV || "development",
      mongoStatus: dbStatus,
      companyCount,
      uptime: `${Math.floor(uptimeSec / 60)}m ${Math.floor(uptimeSec % 60)}s`,
      memory: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
      server: os.hostname(),
      timestamp: new Date().toISOString(),
      logs: getLogs()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

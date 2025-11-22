// backend/routes/status.js
const express = require("express");
const mongoose = require("mongoose");
const os = require("os");
const Company = require("../models/company"); // ✅ correcte kleine letters
const { getLogs } = require("../utils/logger");

const router = express.Router();

// ✅ Statusendpoint: controleert verbindingen en systeeminfo
router.get("/", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = ["🔴", "🟡", "🟢", "🔵"][dbState] || "❓";
    const companyCount = await Company.countDocuments().catch(() => 0);
    const uptimeSec = process.uptime();

    // ✅ Veilige logophaal-fallback
    let logs = [];
    try {
      logs = typeof getLogs === "function" ? getLogs() : [];
    } catch {
      logs = [];
    }

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
      logs,
    });
  } catch (err) {
    console.error("❌ Fout in statusroute:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

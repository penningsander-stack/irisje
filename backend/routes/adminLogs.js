// backend/routes/adminLogs.js
const router = require("express").Router();
const fs = require("fs");
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => {
  try {
    const logFile = "/var/log/render/service.log";

    if (!fs.existsSync(logFile)) {
      return res.json({ ok: true, logs: ["Geen logbestand gevonden"] });
    }

    const raw = fs.readFileSync(logFile, "utf8");
    const lines = raw.split("\n").slice(-200);

    res.json({ ok: true, logs: lines });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Kon logs niet lezen" });
  }
});

module.exports = router;

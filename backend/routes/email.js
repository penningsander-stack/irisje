// backend/routes/email.js
const express = require("express");
const router = express.Router();

// 📧 Dummy e-mail endpoint (voorbereid)
router.post("/notify", async (req, res) => {
  const { to, subject, message } = req.body;
  console.log(`📨 E-mailnotificatie voorbereid: ${to} – ${subject}`);
  res.json({ success: true, note: "E-mailfunctie nog niet geconfigureerd (SMTP volgt later)" });
});

module.exports = router;

// backend/routes/secure.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// 👤 Test endpoint om gebruikersinformatie te tonen
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔒 Test secure route
router.get('/ping', verifyToken, (req, res) => {
  res.json({ ok: true, message: 'Secure route works ✅' });
});

module.exports = router;

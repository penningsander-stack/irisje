// backend/routes/secure.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/me
 * Headers: Authorization: Bearer <token>
 */
router.get('/me', auth(), async (req, res) => {
  const user = await User.findById(req.user.sub).select('_id email role createdAt updatedAt');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

/**
 * GET /api/secure/ping
 * Alleen voor admin
 */
router.get('/secure/ping', auth('admin'), (req, res) => {
  res.json({ ok: true, role: req.user.role, message: 'pong (admin only)' });
});

module.exports = router;

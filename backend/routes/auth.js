// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function signJWT(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/register
 * body: { email, password }
 * (Voor nu open; later kun je dit achter admin zetten)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email en wachtwoord verplicht' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Gebruiker bestaat al' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role: role === 'admin' ? 'admin' : 'company' });

    return res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 * returns: { token, user: { id, email, role } }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user || !user.isActive) return res.status(401).json({ message: 'Ongeldige inlog' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Ongeldige inlog' });

    const token = signJWT(user);
    return res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;

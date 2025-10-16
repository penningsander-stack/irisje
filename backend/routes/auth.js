// backend/routes/auth.js
// ✅ Correcte Express-router voor login + token-middleware export los

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Demo-gebruiker (werkt zonder database)
const DEMO_USER = {
  id: '68ef7f6659b5c49a78deacda',
  email: 'demo@irisje.nl',
  password: 'demo1234',
  role: 'company',
};

// 🔐 Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'E-mail en wachtwoord zijn verplicht' });

    if (email !== DEMO_USER.email || password !== DEMO_USER.password)
      return res.status(401).json({ message: 'Ongeldige inloggegevens' });

    // JWT-token genereren
    const token = jwt.sign(
      { id: DEMO_USER.id, role: DEMO_USER.role, email: DEMO_USER.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token aangemaakt voor', email);
    res.json({ token });
  } catch (err) {
    console.error('❌ Loginfout:', err);
    res.status(500).json({ message: 'Serverfout bij inloggen' });
  }
});

// 🔒 Middleware apart exporteren (voor andere routes)
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.header('Authorization');
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Geen token opgegeven' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Ongeldige token:', err.message);
    res.status(401).json({ message: 'Ongeldige token' });
  }
}

module.exports = router;            // ← Alleen de router exporteren
module.exports.verifyToken = verifyToken; // ← Middleware extra exporteren indien nodig

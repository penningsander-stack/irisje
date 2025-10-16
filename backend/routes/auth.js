// backend/routes/auth.js
// ✅ Combineert login-route + tokenverificatie middleware

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Simpele inlogdemo (je kunt dit later koppelen aan MongoDB)
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

    // Token genereren
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

// 🔒 Middleware voor beveiligde routes
function verifyToken(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Geen token opgegeven' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Geen token opgegeven' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Ongeldige token:', err.message);
    res.status(401).json({ message: 'Ongeldige token' });
  }
}

module.exports = { router, verifyToken };

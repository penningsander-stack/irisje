// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Company = require('../models/Company');

const router = express.Router();

// 📩 SMTP-transporter configureren
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 🧩 Helper: welkomstmail versturen
async function sendWelcomeEmail(email, name) {
  try {
    await transporter.sendMail({
      from: `"Irisje.nl" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welkom bij Irisje.nl!',
      html: `
        <h2>Welkom bij Irisje.nl</h2>
        <p>Hallo ${name || 'ondernemer'},</p>
        <p>Je account is succesvol aangemaakt. Je kunt vanaf nu aanvragen ontvangen en beheren in je dashboard.</p>
        <p>📊 <a href="https://irisje-frontend.onrender.com/dashboard.html">Ga naar je dashboard</a></p>
        <p>Met vriendelijke groet,<br><strong>Het Irisje.nl team</strong></p>
      `,
    });
    console.log(`📧 Welkomstmail verzonden naar ${email}`);
  } catch (err) {
    console.error('❌ Fout bij verzenden welkomstmail:', err.message);
  }
}

// 🔐 Registreren
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail en wachtwoord zijn verplicht.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mailadres is al geregistreerd.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      passwordHash: hashedPassword,
      role: role || 'company',
      isActive: true,
    });

    await user.save();

    // 🏢 Automatisch gekoppeld bedrijf aanmaken als het een bedrijf is
    if (user.role === 'company') {
      const company = new Company({
        name: email.split('@')[0],
        email,
        category: 'Algemeen',
        phone: '',
        address: '',
        website: '',
        user: user._id,
      });
      await company.save();
      console.log(`🏢 Nieuw bedrijf aangemaakt voor ${email}`);

      // ✉️ Welkomstmail sturen
      await sendWelcomeEmail(email, company.name);
    }

    res.status(201).json({ message: 'Registratie voltooid', userId: user._id });
  } catch (err) {
    console.error('❌ Fout bij registratie:', err.message);
    res.status(500).json({ message: 'Serverfout bij registratie' });
  }
});

// 🔐 Inloggen
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Onjuiste inloggegevens' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Onjuiste inloggegevens' });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '✅ Inloggen gelukt',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ Fout bij inloggen:', err.message);
    res.status(500).json({ message: 'Serverfout bij inloggen' });
  }
});

module.exports = router;

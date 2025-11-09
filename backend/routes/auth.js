// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/ser");

// === Inloggen ===
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, error: "Onbekende gebruiker" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ ok: false, error: "Wachtwoord onjuist" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAMESITE || "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    user.lastLogin = new Date();
    await user.save();

    res.json({
      ok: true,
      message: "Inloggen geslaagd",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij inloggen" });
  }
});

// === Sessies ===
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ ok: false, error: "Geen token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ ok: false, error: "Gebruiker niet gevonden" });

    res.json({ ok: true, user });
  } catch {
    res.status(401).json({ ok: false, error: "Ongeldige sessie" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: process.env.COOKIE_SAMESITE || "None",
  });
  res.json({ ok: true, message: "Uitgelogd" });
});

router.get("/ping", (_req, res) => res.json({ ok: true, service: "auth" }));

// === Extra routes voor registratie en wachtwoordherstel ===

// 📩 SMTP-transporter (volledig compatibel met WebReus)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 1️⃣ Registratie
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ ok: false, message: "Alle velden zijn verplicht." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ ok: false, message: "E-mailadres is al geregistreerd." });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role: "company" });
    await user.save();

    // Eventueel later e-mailbevestiging toevoegen
    res.json({ ok: true, message: "✅ Account aangemaakt. Je kunt nu inloggen." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij registreren." });
  }
});

// 2️⃣ Wachtwoord vergeten
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ ok: false, message: "Geen gebruiker met dit e-mailadres." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetExpires = Date.now() + 1000 * 60 * 30; // 30 minuten
    await user.save();

    const resetLink = `https://irisje.nl/password-reset.html?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to: user.email,
      subject: "Wachtwoordherstel – Irisje.nl",
      html: `
        <p>Beste ${user.name || "gebruiker"},</p>
        <p>Je hebt een verzoek ingediend om je wachtwoord te herstellen.</p>
        <p>Klik op onderstaande link om een nieuw wachtwoord in te stellen:</p>
        <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
        <p>Deze link is 30 minuten geldig.</p>
        <p>Groet,<br><strong>Irisje.nl</strong></p>
      `,
    });

    res.json({ ok: true, message: "📩 E-mail met herstelinstructies verzonden." });
  } catch (err) {
    console.error("Forgot-password error:", err);
    res.status(500).json({ ok: false, message: "Kon geen e-mail verzenden." });
  }
});

// 3️⃣ Nieuw wachtwoord instellen
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ ok: false, message: "Ongeldige of verlopen link." });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ ok: true, message: "✅ Wachtwoord succesvol gewijzigd." });
  } catch (err) {
    console.error("Reset-password error:", err);
    res.status(500).json({ ok: false, message: "Fout bij wachtwoord wijzigen." });
  }
});

module.exports = router;

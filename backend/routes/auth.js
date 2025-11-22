// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Company = require("../models/company");

/* ============================================================
   🟢 Helper: JWT maken
============================================================ */
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

/* ============================================================
   🟢 Inloggen (JWT met role + companyId, GEEN cookie meer)
============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "E-mail en wachtwoord zijn verplicht." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, error: "Onbekende gebruiker." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ ok: false, error: "Wachtwoord onjuist." });
    }

    // 🔍 companyId ophalen (alleen voor bedrijven)
    let companyId = null;
    if (user.role === "company") {
      const company = await Company.findOne({ owner: user._id }).select("_id");
      if (company) companyId = company._id.toString();
    }

    // 🔑 JWT met role + companyId
    const token = signToken({
      id: user._id.toString(),
      role: user.role,
      companyId: companyId || null,
    });

    user.lastLogin = new Date();
    await user.save();

    // 🔄 GEEN cookie meer: token terug in JSON
    res.json({
      ok: true,
      message: "Inloggen geslaagd",
      token,
      role: user.role,
      companyId,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij inloggen." });
  }
});

/* ============================================================
   🟢 /me – sessie controleren via Authorization: Bearer
============================================================ */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res
        .status(401)
        .json({ ok: false, error: "Geen token aanwezig." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, error: "Gebruiker niet gevonden." });
    }

    res.json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: decoded.role,
        companyId: decoded.companyId || null,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error("Me error:", err.message);
    res
      .status(401)
      .json({ ok: false, error: "Ongeldige of verlopen sessie." });
  }
});

/* ============================================================
   🟢 Uitloggen
   (bij JWT in localStorage is dit vooral cosmetisch;
    we legen hier wel de oude cookie voor bestaande sessies)
============================================================ */
router.post("/logout", (_req, res) => {
  // Oude cookie wissen voor legacy-sessies
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
  res.json({ ok: true, message: "Uitgelogd." });
});

/* ============================================================
   🟢 Healthcheck
============================================================ */
router.get("/ping", (_req, res) =>
  res.json({ ok: true, service: "auth" })
);

/* ============================================================
   🧩 Registreren (standaard role=company)
============================================================ */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Alle velden zijn verplicht." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ ok: false, message: "E-mailadres is al geregistreerd." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      role: "company",
    });

    await user.save();

    res.json({
      ok: true,
      message: "Account aangemaakt. Je kunt nu inloggen.",
    });
  } catch (err) {
    console.error("Register error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Serverfout bij registreren." });
  }
});

/* ============================================================
   🔑 Wachtwoord vergeten
============================================================ */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "Geen gebruiker met dit e-mailadres." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetExpires = Date.now() + 1000 * 60 * 30; // 30 minuten
    await user.save();

    const resetLink = `https://irisje.nl/password-reset.html?token=${encodeURIComponent(
      token
    )}`;

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to: user.email,
      subject: "Wachtwoordherstel – Irisje.nl",
      html: `
        <p>Beste ${user.name || "gebruiker"},</p>
        <p>Klik op deze link om je wachtwoord te herstellen:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
      `,
    });

    res.json({ ok: true, message: "E-mail verzonden." });
  } catch (err) {
    console.error("Forgot-password error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Kon geen e-mail verzenden." });
  }
});

/* ============================================================
   🔑 Nieuw wachtwoord instellen
============================================================ */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ ok: false, message: "Ongeldige of verlopen link." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetExpires = undefined;

    await user.save();

    res.json({ ok: true, message: "Wachtwoord gewijzigd." });
  } catch (err) {
    console.error("Reset-password error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Fout bij wachtwoord wijzigen." });
  }
});

module.exports = router;

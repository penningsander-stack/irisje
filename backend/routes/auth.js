// backend/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const router = express.Router();

// ===== MODEL =====
const CompanySchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  category: String,
  phone: String,
  address: String,
  website: String,
  createdAt: { type: Date, default: Date.now },
});

const Company = mongoose.model("Company", CompanySchema);

// ===== JWT FUNCTIES =====
function generateToken(company) {
  return jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Geen token meegegeven" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.companyId = decoded.companyId;
    next();
  } catch {
    return res.status(401).json({ error: "Ongeldig of verlopen token" });
  }
}

// ===== LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = await Company.findOne({ email });
    if (!company) return res.status(401).json({ error: "Onbekend e-mailadres" });

    const isMatch = await bcrypt.compare(password, company.password || "");
    if (!isMatch) return res.status(401).json({ error: "Ongeldig wachtwoord" });

    const token = generateToken(company);
    res.json({ token });
  } catch (err) {
    console.error("Login-fout:", err);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

// ===== PROFIEL =====
router.get("/me", verifyToken, async (req, res) => {
  try {
    const company = await Company.findById(req.companyId).select("-password");
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });
    res.json(company);
  } catch (err) {
    console.error("Auth/me-fout:", err);
    res.status(500).json({ error: "Serverfout bij profiel ophalen" });
  }
});

// ===== LOGOUT =====
router.post("/logout", (req, res) => res.json({ success: true }));

// ===== RESET DEMO WACHTWOORD =====
router.get("/reset-demo", async (req, res) => {
  try {
    const demoEmail = "demo@irisje.nl";
    const demoPassword = "demo1234";
    const hashed = await bcrypt.hash(demoPassword, 10);

    const company = await Company.findOneAndUpdate(
      { email: demoEmail },
      { password: hashed },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ error: "Demo-account niet gevonden" });
    }

    res.json({
      success: true,
      message: "Demo-wachtwoord is opnieuw ingesteld naar demo1234",
      email: demoEmail,
    });
  } catch (err) {
    console.error("Reset-fout:", err);
    res.status(500).json({ error: "Fout bij resetten demo-wachtwoord" });
  }
});

module.exports = router;

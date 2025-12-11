// backend/routes/publicRequests.js
// v20251211-PUBLICREQUESTS-POST
//
// Routes voor publieke aanvragen:
// - POST /api/publicRequests  → nieuwe aanvraag opslaan (+ optionele fotoupload)
// - GET  /api/publicRequests/popular-categories

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Request = require("../models/request"); // lowercase bestandsnaam

// Uploadmap aanmaken
const uploadsDir = path.join(__dirname, "..", "uploads", "requests");
fs.mkdirSync(uploadsDir, { recursive: true });

// Multer-config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const rnd = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || "");
    cb(null, `${ts}-${rnd}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,  // max 5MB
    files: 3                    // max 3 foto's
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Alleen afbeeldingen zijn toegestaan."));
    }
    cb(null, true);
  }
});

// POST – aanvraag opslaan
router.post("/", upload.array("photos", 3), async (req, res) => {
  try {
    const {
      name,
      email,
      message,      // komt uit description van wizard
      city,
      category,
      postcode,
      street,
      houseNumber,
      phone
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        message: "Naam, e-mail en omschrijving zijn verplicht."
      });
    }

    const uploadedFiles = Array.isArray(req.files) ? req.files : [];

    if (uploadedFiles.length > 0) {
      console.log("[publicRequests] Foto's geüpload:", uploadedFiles.map(f => f.filename));
    }

    const newRequest = new Request({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      message: String(message).trim(),
      city: city || "",
      category: category || ""
      // overige velden uit model blijven default
    });

    await newRequest.save();

    return res.status(201).json({
      ok: true,
      requestId: newRequest._id
    });

  } catch (err) {
    console.error("POST /api/publicRequests error:", err);

    if (err instanceof multer.MulterError) {
      let msg = "Fout bij uploaden van foto's.";
      if (err.code === "LIMIT_FILE_SIZE") msg = "Foto is groter dan 5MB.";
      if (err.code === "LIMIT_FILE_COUNT") msg = "Maximaal 3 foto's toegestaan.";
      return res.status(400).json({ ok: false, message: msg });
    }

    return res.status(500).json({
      ok: false,
      message: "Er ging iets mis bij het opslaan van je aanvraag."
    });
  }
});

// GET – populaire categorieën
router.get("/popular-categories", async (req, res) => {
  try {
    const results = await Request.aggregate([
      { $match: { category: { $exists: true, $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const categories = results.map(c => ({
      name: c._id,
      slug: c._id.toLowerCase().replace(/\s+/g, "-"),
      count: c.count
    }));

    res.json({ ok: true, categories });

  } catch (err) {
    console.error("popular-categories error:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;

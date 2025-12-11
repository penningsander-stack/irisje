// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Request = require("../models/request");

const uploadsDir = path.join(__dirname, "..", "uploads", "requests");
fs.mkdirSync(uploadsDir, { recursive: true });

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
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Alleen afbeeldingen toegestaan."));
    }
    cb(null, true);
  }
});

// GET aanvraag ophalen
router.get("/:id", async (req, res) => {
  try {
    const r = await Request.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden" });
    return res.json({ ok: true, request: r });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "Serverfout" });
  }
});

// POST nieuwe aanvraag
router.post("/", upload.array("photos", 3), async (req, res) => {
  try {
    const { name, email, message, city, category, postcode, street, houseNumber, phone } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, message: "Naam, e-mail en omschrijving zijn verplicht." });
    }

    const newRequest = new Request({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      message: String(message).trim(),
      city: city || "",
      category: category || ""
    });

    await newRequest.save();
    return res.status(201).json({ ok: true, requestId: newRequest._id });

  } catch (err) {
    if (err instanceof multer.MulterError) {
      let msg = "Uploadfout.";
      if (err.code === "LIMIT_FILE_SIZE") msg = "Foto > 5MB.";
      if (err.code === "LIMIT_FILE_COUNT") msg = "Max 3 foto's.";
      return res.status(400).json({ ok: false, message: msg });
    }
    return res.status(500).json({ ok: false, message: "Serverfout" });
  }
});

// GET populaire categorieën
router.get("/", async (req, res) => {
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
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

module.exports = router;

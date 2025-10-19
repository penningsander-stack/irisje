const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");

router.get("/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const requests = await Request.find({ companyId }).sort({ date: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Fout bij ophalen aanvragen:", err);
    res.status(500).json({ error: "Serverfout bij ophalen aanvragen." });
  }
});

module.exports = router;

// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");
const auth = require("../middleware/auth");

router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const requests = await Request.find({ company: companyId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("❌ Fout bij ophalen aanvragen:", error);
    res.status(500).json({ error: "Serverfout bij ophalen aanvragen" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, message, companyId } = req.body;
    const newReq = new Request({ name, email, message, company: companyId });
    await newReq.save();
    res.json({ success: true, message: "Aanvraag verzonden" });
  } catch (error) {
    console.error("❌ Fout bij opslaan aanvraag:", error);
    res.status(500).json({ error: "Serverfout bij opslaan aanvraag" });
  }
});

module.exports = router;

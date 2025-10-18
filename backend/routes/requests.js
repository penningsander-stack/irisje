// backend/routes/requests.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Request from "../models/Request.js";
import Company from "../models/Company.js";

const router = express.Router();

// ✅ Nieuwe aanvraag opslaan (publieke route)
router.post("/", async (req, res) => {
  try {
    const { name, email, message, companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "companyId is vereist" });
    }

    const newRequest = new Request({
      name,
      email,
      message,
      companyId,
      status: "Nieuw",
      date: new Date(),
    });

    await newRequest.save();
    res.json({ success: true, message: "Aanvraag verzonden", request: newRequest });
  } catch (err) {
    console.error("❌ Fout bij opslaan aanvraag:", err);
    res.status(500).json({ error: "Serverfout bij opslaan aanvraag" });
  }
});

// ✅ Aanvragen van ingelogd bedrijf ophalen
router.get("/company", authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.id;

    if (!companyId) {
      return res.status(400).json({ error: "Geen bedrijfs-ID gevonden" });
    }

    const requests = await Request.find({ companyId }).sort({ date: -1 });
    res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ error: "Serverfout bij ophalen aanvragen" });
  }
});

// ✅ Status van aanvraag wijzigen
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(request);
  } catch (err) {
    console.error("❌ Fout bij bijwerken status:", err);
    res.status(500).json({ error: "Serverfout bij bijwerken status" });
  }
});

export default router;

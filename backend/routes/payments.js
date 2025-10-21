// backend/routes/payments.js
// Voorbereide, veilige (no-op) betaalroute. Wordt pas actief als je hem mount in server.js.
// Breekt niets als hij (nog) niet gebruikt wordt.

const express = require("express");
const router = express.Router();

// Healthcheck / placeholder
router.get("/status", (_req, res) => {
  res.json({ ok: true, provider: "pending", enabled: false });
});

// Toekomstige endpoint voor aanmaken checkout (Mollie/Stripe).
// Nu nog een veilige placeholder-respons.
router.post("/checkout", (req, res) => {
  const { amount } = req.body || {};
  // Validatie (minimaal, future-proof)
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "Ongeldig bedrag." });
  }
  // Placeholder link / instructie
  return res.status(202).json({
    message: "Betaalfunctie wordt geactiveerd zodra provider is gekoppeld.",
    next: "/dashboard.html",
  });
});

module.exports = router;

/*
VOEG LATER VEILIG TOE IN backend/server.js (onder je andere routes):

const paymentsRouter = require('./routes/payments');
app.use('/api/payments', paymentsRouter);

Dit is backward-compatible en breekt niets.
*/

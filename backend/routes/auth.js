// Tokenverificatie (gebruikt door secure.js)
router.get("/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Geen token" });
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const company = await Company.findById(decoded.companyId).select("name email category");
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });
    res.json({ company });
  } catch {
    return res.status(401).json({ error: "Ongeldig of verlopen token" });
  }
});

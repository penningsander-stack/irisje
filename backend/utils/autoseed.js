// backe../utils/autoseed.js
const Request = require("../models/request");
const Review = require("../models/review");

/**
 * Automatisch testdata toevoegen aan de database.
 * Dit wordt uitgevoerd bij het opstarten van de server.
 */
async function autoSeed() {
  const companyId = "68f4c355ab9e361a51d29acd"; // Demo bedrijf ID

  try {
    console.log("🌱 Auto-seed gestart voor bedrijf:", companyId);

    // Oude testdata wissen
    await Request.deleteMany({ companyId });
    await Review.deleteMany({ companyId });

    // Nieuwe testaanvragen
    await Request.insertMany([
      {
        companyId,
        name: "Jan de Vries",
        email: "jan@example.com",
        message: "Ik heb interesse in jullie diensten.",
        status: "Nieuw",
        date: new Date("2025-10-10"),
      },
      {
        companyId,
        name: "Petra Jansen",
        email: "petra@example.com",
        message: "Kunnen jullie mij morgen bellen?",
        status: "Geaccepteerd",
        date: new Date("2025-10-12"),
      },
    ]);

    // Nieuwe testreviews
    await Review.insertMany([
      {
        companyId,
        name: "Klant A",
        rating: 5,
        message: "Super vriendelijk geholpen!",
        date: new Date("2025-10-05"),
        reported: false,
      },
      {
        companyId,
        name: "Klant B",
        rating: 4,
        message: "Goede communicatie en snelle service.",
        date: new Date("2025-10-08"),
        reported: false,
      },
    ]);

    console.log("✅ Auto-seed voltooid: testdata opnieuw gevuld");
  } catch (err) {
    console.error("❌ Auto-seed fout:", err);
  }
}

module.exports = autoSeed;

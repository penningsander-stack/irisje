// === Extra routes voor registratie en wachtwoordherstel ===
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// 📩 SMTP-transporter gebruiken (PHPMailer via jouw SMTP-config)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// === 1️⃣ Account registreren ===
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ ok: false, message: "Alle velden zijn verplicht." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ ok: false, message: "E-mailadres is al geregistreerd." });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role: "bedrijf" });
    await user.save();

    res.json({ ok: true, message: "Account aangemaakt. Controleer je e-mail voor bevestiging." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij registreren." });
  }
});

// === 2️⃣ Wachtwoord vergeten ===
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ ok: false, message: "Geen gebruiker met dit e-mailadres." });

    // 🔑 Token aanmaken
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetExpires = Date.now() + 1000 * 60 * 30; // 30 minuten geldig
    await user.save();

    // 🔗 Resetlink maken
    const resetLink = `https://irisje.nl/password-reset.html?token=${encodeURIComponent(token)}`;

    // 📧 E-mail verzenden
    await transporter.sendMail({
      from: `"Irisje.nl" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Wachtwoordherstel – Irisje.nl",
      html: `
        <p>Beste ${user.name || "gebruiker"},</p>
        <p>Je hebt een verzoek ingediend om je wachtwoord te herstellen.</p>
        <p>Klik op onderstaande link om een nieuw wachtwoord in te stellen:</p>
        <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
        <p>Deze link is 30 minuten geldig.</p>
        <p>Groet,<br><strong>Irisje.nl</strong></p>
      `,
    });

    res.json({ ok: true, message: "E-mail met herstelinstructies verzonden." });
  } catch (err) {
    console.error("Forgot-password error:", err);
    res.status(500).json({ ok: false, message: "Kon geen e-mail verzenden." });
  }
});

// === 3️⃣ Nieuw wachtwoord instellen ===
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ ok: false, message: "Ongeldige of verlopen link." });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ ok: true, message: "Wachtwoord succesvol gewijzigd." });
  } catch (err) {
    console.error("Reset-password error:", err);
    res.status(500).json({ ok: false, message: "Fout bij wachtwoord wijzigen." });
  }
});

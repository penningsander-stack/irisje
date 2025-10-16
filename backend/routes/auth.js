// backend/routes/auth.js
// ✅ Middleware voor tokenverificatie

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Controleert of een geldig JWT-token is meegestuurd in de Authorization-header.
 * Zet daarna de inhoud (payload) van het token in req.user zodat andere routes
 * kunnen zien welke gebruiker is ingelogd.
 */
module.exports = function (req, res, next) {
  try {
    // Verwacht header in de vorm: Authorization: Bearer <token>
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.warn('⚠️ Geen Authorization-header gevonden');
      return res.status(401).json({ message: 'Geen token opgegeven' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.warn('⚠️ Geen Bearer-token gevonden');
      return res.status(401).json({ message: 'Geen token opgegeven' });
    }

    // Token decoderen
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      console.warn('⚠️ Token kon niet worden geverifieerd');
      return res.status(401).json({ message: 'Ongeldige token' });
    }

    // Zet de payload in req.user
    req.user = decoded;

    console.log('🪶 [auth.js] Token geverifieerd:', decoded);
    next();
  } catch (err) {
    console.error('❌ Fout bij tokenverificatie:', err.message);
    res.status(401).json({ message: 'Ongeldige of verlopen token' });
  }
};

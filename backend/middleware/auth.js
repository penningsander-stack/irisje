// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * JWT auth-middleware
 * - Verwacht header: Authorization: Bearer <token>
 * - Zet req.user = { id, email, role }
 */
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Geen token opgegeven' });
  }

  const token = header.slice(7); // na 'Bearer '

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Ongeldige of verlopen token' });
  }
};

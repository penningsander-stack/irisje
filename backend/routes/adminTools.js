// backend/routes/adminTools.js
// v20251209-ADMIN-TOOLS
//
// Extra admin-routes voor het Irisje-dashboard:
// - GET /api/admin/stats   → globale statistieken
// - GET /api/admin/health  → systeemstatus (backend + database + smtp + versies)
//
// Let op:
// - Deze router wordt in server.js onder `/api/admin` gemount:
//     app.use('/api/admin', require('./routes/adminTools'));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Company = require('../models/Company');
const Request = require('../models/Request');
const Review = require('../models/Review');
const User = require('../models/User');

const router = express.Router();

function mapDbState(state) {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

/**
 * Kleine helper om admin te verifiëren zonder afhankelijk te zijn
 * van de bestaande auth-middleware (die we hier niet overschrijven).
 */
function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ ok: false, message: 'Geen of onjuiste Authorization header' });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({ ok: false, message: 'Geen token meegegeven' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[adminTools] JWT_SECRET ontbreekt in environment.');
      return res.status(500).json({ ok: false, message: 'Serverconfiguratie onvolledig (JWT_SECRET)' });
    }

    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Alleen admins hebben toegang tot deze route' });
    }

    // voor later gebruik, mocht dat nodig zijn
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[adminTools] Fout bij token-verificatie:', err.message);
    return res.status(401).json({ ok: false, message: 'Ongeldige of verlopen token' });
  }
}

/**
 * GET /api/admin/stats
 * Globale statistieken voor het admin-dashboard.
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalCompanies,
      totalRequests,
      totalReviews,
      totalUsers
    ] = await Promise.all([
      Company.countDocuments({}),
      Request.countDocuments({}),
      Review.countDocuments({}),
      User.countDocuments({})
    ]);

    const stats = {
      companies: {
        total: totalCompanies
      },
      requests: {
        total: totalRequests
      },
      reviews: {
        total: totalReviews
      },
      users: {
        total: totalUsers
      },
      generatedAt: new Date().toISOString()
    };

    return res.json({
      ok: true,
      stats
    });
  } catch (err) {
    console.error('[adminTools] Fout bij /stats:', err);
    return res.status(500).json({
      ok: false,
      message: 'Kon statistieken niet ophalen',
      error: err.message
    });
  }
});

/**
 * GET /api/admin/health
 * Systeemstatus voor admin-dashboard (geen gevoelige details).
 */
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const dbState = mapDbState(mongoose.connection.readyState);

    const health = {
      ok: dbState === 'connected',
      backend: {
        uptimeSeconds: Math.round(process.uptime()),
        now: new Date().toISOString()
      },
      database: {
        state: dbState,
        host: mongoose.connection.host || undefined,
        name: mongoose.connection.name || undefined
      },
      smtp: {
        configured: !!(process.env.SMTP_HOST || process.env.SMTP_USER),
        // we doen hier GEEN echte smtp-ping om risico op timeouts te voorkomen
        status: 'unknown'
      },
      version: {
        backend: process.env.BACKEND_VERSION || '1.0.0',
        node: process.version,
        env: process.env.NODE_ENV || 'development'
      }
    };

    return res.json({
      ok: true,
      health
    });
  } catch (err) {
    console.error('[adminTools] Fout bij /health:', err);
    return res.status(500).json({
      ok: false,
      message: 'Kon systeemstatus niet ophalen',
      error: err.message
    });
  }
});

module.exports = router;

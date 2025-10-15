// backend/routes/requests.js
const express = require('express');
const Request = require('../models/Request');
const Company = require('../models/Company');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { statusEnum } = require('../models/Request');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

/** Helper: gekoppelde companyId van user */
async function getActorCompanyId(userId) {
  const user = await User.findById(userId).select('company role');
  if (!user) return null;
  return user.company ? user.company.toString() : null;
}

/**
 * POST /api/requests
 * Publiek: maak nieuwe aanvraag; selecteer max 5 bedrijven op slug of categorie.
 * body: { customerName, customerEmail, customerPhone?, message?, category, companySlugs?: [] }
 */
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      message,
      category,
      companySlugs = []
    } = req.body || {};

    if (!customerName || !customerEmail || !category) {
      return res.status(400).json({ message: 'customerName, customerEmail en category zijn verplicht' });
    }

    let targets;
    if (Array.isArray(companySlugs) && companySlugs.length > 0) {
      targets = await Company.find(
        { slug: { $in: companySlugs.slice(0, 5) }, isActive: { $ne: false } },
        '_id name email slug'
      );
    } else {
      targets = await Company.find(
        { categories: category, isActive: { $ne: false } },
        '_id name email slug'
      ).limit(5);
    }

    const statusByCompany = targets.map(c => ({ company: c._id, status: 'Nieuw' }));

    const doc = await Request.create({
      customerName,
      customerEmail,
      customerPhone,
      message,
      category,
      targetCompanies: targets.map(t => t._id),
      statusByCompany,
      meta: {
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
        sourceUrl: req.headers['referer'] || ''
      }
    });

    // 📧 E-mailnotificaties (best-effort; fouten blokkeren niet de API)
    (async () => {
      try {
        const bcc = process.env.SMTP_FROM || process.env.SMTP_USER;
        const html = `
          <div style="font-family:Arial,sans-serif">
            <h2>Nieuwe aanvraag via irisje.nl</h2>
            <p><b>Naam:</b> ${escapeHtml(customerName)}</p>
            <p><b>E-mail:</b> ${escapeHtml(customerEmail)}</p>
            ${customerPhone ? `<p><b>Telefoon:</b> ${escapeHtml(customerPhone)}</p>` : ''}
            <p><b>Categorie:</b> ${escapeHtml(category)}</p>
            ${message ? `<p><b>Bericht:</b><br>${escapeHtml(message).replace(/\n/g,'<br>')}</p>` : ''}
          </div>
        `;
        for (const c of targets) {
          if (!c.email) continue;
          await sendMail({
            to: c.email,
            subject: `Nieuwe aanvraag via irisje.nl — ${category}`,
            html,
            text: `Nieuwe aanvraag: ${customerName} <${customerEmail}> — ${category}${customerPhone ? ` — ${customerPhone}` : ''}\n\n${message || ''}`,
            bcc
          });
        }
      } catch (err) {
        console.warn('⚠️ Mail send failed (non-blocking):', err.message);
      }
    })();

    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/** GET /api/requests (company/admin) met filters */
router.get('/', auth(), async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.sub;

    const {
      status,
      q,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sort = '-createdAt',
      companyId // admin
    } = req.query;

    let actorCompanyId = null;

    if (role === 'company') {
      actorCompanyId = await getActorCompanyId(userId);
      if (!actorCompanyId) {
        return res.status(403).json({ message: 'Geen gekoppeld bedrijf voor deze gebruiker' });
      }
    } else if (role === 'admin' && companyId) {
      actorCompanyId = companyId;
    }

    const match = {};

    if (actorCompanyId) {
      match['statusByCompany.company'] = actorCompanyId;
    }

    if (status) {
      if (!statusEnum.includes(status)) {
        return res.status(400).json({ message: `Ongeldige status. Toegestaan: ${statusEnum.join(', ')}` });
      }
      match['statusByCompany.status'] = status;
    }

    if (q) {
      match.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { customerEmail: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) match.createdAt.$lte = new Date(dateTo);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortSpec = {};
    const s = String(sort);
    sortSpec[s.replace(/^-/, '')] = s.startsWith('-') ? -1 : 1;

    const [items, total] = await Promise.all([
      Request.find(match)
        .sort(sortSpec)
        .skip(skip)
        .limit(Number(limit)),
      Request.countDocuments(match)
    ]);

    return res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/** PATCH /api/requests/:id/status — wijzig status (company/admin) */
router.patch('/:id/status', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, companyId } = req.body || {};
    const role = req.user.role;
    const userId = req.user.sub;

    if (!statusEnum.includes(status)) {
      return res.status(400).json({ message: `Ongeldige status. Toegestaan: ${statusEnum.join(', ')}` });
    }

    let targetCompanyId = null;

    if (role === 'company') {
      targetCompanyId = await getActorCompanyId(userId);
      if (!targetCompanyId) return res.status(403).json({ message: 'Geen gekoppeld bedrijf' });
    } else if (role === 'admin') {
      targetCompanyId = companyId;
      if (!targetCompanyId) return res.status(400).json({ message: 'companyId is verplicht voor admin' });
    }

    const doc = await Request.findById(id);
    if (!doc) return res.status(404).json({ message: 'Aanvraag niet gevonden' });

    const entry = doc.statusByCompany.find(e => String(e.company) === String(targetCompanyId));
    if (!entry) {
      doc.statusByCompany.push({ company: targetCompanyId, status, updatedAt: new Date() });
    } else {
      entry.status = status;
      entry.updatedAt = new Date();
    }

    await doc.save();
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/** GET /api/requests/stats/overview — counters */
router.get('/stats/overview', auth(), async (req, res) => {
  try {
    const { days = 30, companyId } = req.query;
    const role = req.user.role;
    const userId = req.user.sub;

    let actorCompanyId = null;
    if (role === 'company') {
      actorCompanyId = await getActorCompanyId(userId);
      if (!actorCompanyId) return res.status(403).json({ message: 'Geen gekoppeld bedrijf' });
    } else if (role === 'admin' && companyId) {
      actorCompanyId = companyId;
    }

    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const base = { createdAt: { $gte: since } };
    if (actorCompanyId) {
      base['statusByCompany.company'] = actorCompanyId;
    }

    const [total, accepted, rejected, followedUp] = await Promise.all([
      Request.countDocuments(base),
      Request.countDocuments({ ...base, 'statusByCompany.status': 'Geaccepteerd' }),
      Request.countDocuments({ ...base, 'statusByCompany.status': 'Afgewezen' }),
      Request.countDocuments({ ...base, 'statusByCompany.status': 'Opgevolgd' })
    ]);

    return res.json({ total, accepted, rejected, followedUp, since });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// Helper: HTML escaping
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}

module.exports = router;

// frontend/js/admin-tools.js
// v20251209-ADMIN-TOOLS-STATS
//
// Verantwoordelijk voor:
// - Ophalen en tonen van admin-statistieken (bedrijven, aanvragen, reviews, gebruikers)
// - Basis systeemdiagnose (backend online, database, SMTP-indicatie)
// - Hergebruik van het admin JWT-token uit localStorage ('adminToken')
// - Robuuste foutafhandeling zonder dat de layout breekt
//
// Let op:
// - Dit script probeert alleen DOM-elementen te vullen als ze bestaan.
// - Als een container niet bestaat, wordt er niets in de layout aangepast (alleen console logs).
// - Koppeling met backend gaat via:
//      GET /api/admin/stats
//      GET /api/admin/health
//   Voeg deze endpoints (of proxies) in de backend toe als ze nog niet bestaan.

(function () {
  'use strict';

  // ====== Config ======
  const ADMIN_TOKEN_KEY = 'adminToken';
  const DEFAULT_API_BASE_URL = 'https://irisje-backend.onrender.com';

  function getApiBaseUrl() {
    try {
      if (window.irisjeApiBaseUrl && typeof window.irisjeApiBaseUrl === 'string') {
        return window.irisjeApiBaseUrl.replace(/\/+$/, '');
      }
    } catch (e) {
      // negeren, fallback naar default
    }
    return DEFAULT_API_BASE_URL;
  }

  function getAdminToken() {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
    } catch (e) {
      console.warn('[admin-tools] Kan adminToken niet lezen uit localStorage:', e);
      return '';
    }
  }

  async function fetchJson(path, options = {}) {
    const baseUrl = getApiBaseUrl();
    const token = getAdminToken();

    if (!token) {
      console.warn('[admin-tools] Geen adminToken gevonden. Log eerst in als admin.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const config = Object.assign({}, options, {
      headers
    });

    const url = `${baseUrl}${path}`;
    console.log('[admin-tools] Fetch:', url);

    const response = await fetch(url, config);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const error = new Error(`HTTP ${response.status} tijdens ophalen van ${path}`);
      error.status = response.status;
      error.body = text;
      throw error;
    }

    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return {};
  }

  // ====== DOM helpers ======

  function qs(selector) {
    return document.querySelector(selector);
  }

  function setContainerHtml(containerSelector, html) {
    const el = qs(containerSelector);
    if (!el) {
      console.warn('[admin-tools] Container niet gevonden:', containerSelector);
      return;
    }
    el.innerHTML = html;
  }

  function showContainerMessage(containerSelector, message) {
    const el = qs(containerSelector);
    if (!el) {
      console.warn('[admin-tools] Container niet gevonden voor melding:', containerSelector);
      return;
    }
    el.innerHTML = `
      <div class="admin-message admin-message-muted">
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDateTime(value) {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleString('nl-NL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  }

  function formatBool(value) {
    if (value === true) return 'Ja';
    if (value === false) return 'Nee';
    return '-';
  }

  function formatUptime(seconds) {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '-';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}u`);
    parts.push(`${m}m`);

    return parts.join(' ');
  }

  // ====== Rendering: Statistieken ======

  function renderStats(stats) {
    if (!stats || typeof stats !== 'object') {
      showContainerMessage('#admin-stats-cards', 'Geen statistieken beschikbaar.');
      return;
    }

    const totalCompanies = stats.totalCompanies ?? '-';
    const activeCompanies = stats.activeCompanies ?? '-';
    const totalRequests = stats.totalRequests ?? '-';
    const openRequests = stats.openRequests ?? '-';
    const closedRequests = stats.closedRequests ?? '-';
    const totalReviews = stats.totalReviews ?? '-';
    const reportedReviews = stats.reportedReviews ?? '-';
    const totalUsers = stats.totalUsers ?? '-';
    const latestRequestAt = formatDateTime(stats.latestRequestAt);
    const latestReviewAt = formatDateTime(stats.latestReviewAt);

    const html = `
      <div class="admin-grid">
        <div class="admin-card">
          <div class="admin-card-label">Bedrijven</div>
          <div class="admin-card-value">${escapeHtml(String(totalCompanies))}</div>
          <div class="admin-card-meta">Actief: ${escapeHtml(String(activeCompanies))}</div>
        </div>
        <div class="admin-card">
          <div class="admin-card-label">Aanvragen</div>
          <div class="admin-card-value">${escapeHtml(String(totalRequests))}</div>
          <div class="admin-card-meta">Open: ${escapeHtml(String(openRequests))} &bull; Afgerond: ${escapeHtml(String(closedRequests))}</div>
        </div>
        <div class="admin-card">
          <div class="admin-card-label">Reviews</div>
          <div class="admin-card-value">${escapeHtml(String(totalReviews))}</div>
          <div class="admin-card-meta">Gemeld: ${escapeHtml(String(reportedReviews))}</div>
        </div>
        <div class="admin-card">
          <div class="admin-card-label">Gebruikers</div>
          <div class="admin-card-value">${escapeHtml(String(totalUsers))}</div>
          <div class="admin-card-meta">Laatste aanvraag: ${escapeHtml(latestRequestAt)}</div>
        </div>
      </div>
    `;

    setContainerHtml('#admin-stats-cards', html);
  }

  // ====== Rendering: Systeemdiagnose ======

  function renderHealth(health) {
    if (!health || typeof health !== 'object') {
      showContainerMessage('#admin-system-health', 'Geen systeeminformatie beschikbaar.');
      return;
    }

    const backend = health.backend || {};
    const database = health.database || health.mongo || {};
    const smtp = health.smtp || {};
    const queue = health.queue || {};
    const versions = health.versions || {};

    const backendStatus = backend.status || 'onbekend';
    const backendUptime = formatUptime(backend.uptimeSeconds);
    const backendTime = backend.serverTime ? formatDateTime(backend.serverTime) : '-';

    const dbStatus = database.status || 'onbekend';
    const dbLatency = typeof database.latencyMs === 'number'
      ? `${database.latencyMs} ms`
      : '-';

    const smtpEnabled = typeof smtp.enabled === 'boolean'
      ? (smtp.enabled ? 'Ingeschakeld' : 'Uitgeschakeld')
      : (smtp.status || 'onbekend');
    const smtpLastError = smtp.lastError || '-';

    const queueSize = typeof queue.pendingCount === 'number'
      ? `${queue.pendingCount} wachtend`
      : (queue.status || '-');

    const frontendVersion = versions.frontend || '-';
    const backendVersion = versions.backend || '-';

    const html = `
      <div class="admin-health-grid">
        <div class="admin-health-section">
          <div class="admin-health-title">Backend</div>
          <dl class="admin-health-list">
            <div class="admin-health-row">
              <dt>Status</dt>
              <dd>${escapeHtml(backendStatus)}</dd>
            </div>
            <div class="admin-health-row">
              <dt>Uptime</dt>
              <dd>${escapeHtml(backendUptime)}</dd>
            </div>
            <div class="admin-health-row">
              <dt>Servertijd</dt>
              <dd>${escapeHtml(backendTime)}</dd>
            </div>
          </dl>
        </div>
        <div class="admin-health-section">
          <div class="admin-health-title">Database</div>
          <dl class="admin-health-list">
            <div class="admin-health-row">
              <dt>Status</dt>
              <dd>${escapeHtml(dbStatus)}</dd>
            </div>
            <div class="admin-health-row">
              <dt>Latency</dt>
              <dd>${escapeHtml(dbLatency)}</dd>
            </div>
          </dl>
        </div>
        <div class="admin-health-section">
          <div class="admin-health-title">E-mail (SMTP)</div>
          <dl class="admin-health-list">
            <div class="admin-health-row">
              <dt>Status</dt>
              <dd>${escapeHtml(smtpEnabled)}</dd>
            </div>
            <div class="admin-health-row">
              <dt>Laatste fout</dt>
              <dd>${escapeHtml(smtpLastError)}</dd>
            </div>
          </dl>
        </div>
        <div class="admin-health-section">
          <div class="admin-health-title">Queue & versies</div>
          <dl class="admin-health-list">
            <div class="admin-health-row">
              <dt>Notificatie-queue</dt>
              <dd>${escapeHtml(queueSize)}</dd>
            </div>
            <div class="admin-health-row">
              <dt>Frontend-versie</dt>
              <dd>${escapeHtml(frontendVersion)}</dd>
            </div>
            <div class="admin-health-row">
              <dt>Backend-versie</dt>
              <dd>${escapeHtml(backendVersion)}</dd>
            </div>
          </dl>
        </div>
      </div>
    `;

    setContainerHtml('#admin-system-health', html);
  }

  // ====== Loaders ======

  async function loadAdminStats() {
    showContainerMessage('#admin-stats-cards', 'Bezig met laden van statistieken...');
    try {
      const data = await fetchJson('/api/admin/stats', {
        method: 'GET'
      });
      console.log('[admin-tools] Stats ontvangen:', data);
      renderStats(data);
    } catch (error) {
      console.error('[admin-tools] Fout bij laden van statistieken:', error);
      showContainerMessage(
        '#admin-stats-cards',
        'Kon de statistieken niet laden. Controleer of je admin bent ingelogd en de backend draait.'
      );
    }
  }

  async function loadSystemHealth() {
    showContainerMessage('#admin-system-health', 'Systeemstatus wordt geladen...');
    try {
      const data = await fetchJson('/api/admin/health', {
        method: 'GET'
      });
      console.log('[admin-tools] Health ontvangen:', data);
      renderHealth(data);
    } catch (error) {
      console.error('[admin-tools] Fout bij laden van systeemstatus:', error);
      showContainerMessage(
        '#admin-system-health',
        'Kon de systeemstatus niet ophalen. Controleer de backend of probeer het later opnieuw.'
      );
    }
  }

  // ====== UI binding ======

  function bindAdminToolsUI() {
    const refreshStatsBtn = qs('#admin-refresh-stats');
    if (refreshStatsBtn) {
      refreshStatsBtn.addEventListener('click', function () {
        loadAdminStats();
      });
    }

    const refreshHealthBtn = qs('#admin-refresh-health');
    if (refreshHealthBtn) {
      refreshHealthBtn.addEventListener('click', function () {
        loadSystemHealth();
      });
    }
  }

  function initAdminTools() {
    console.log('[admin-tools] Init gestart');
    bindAdminToolsUI();

    // Alleen proberen te laden als de containers bestaan
    if (qs('#admin-stats-cards')) {
      loadAdminStats();
    } else {
      console.log('[admin-tools] #admin-stats-cards niet gevonden — statistieken worden niet automatisch geladen.');
    }

    if (qs('#admin-system-health')) {
      loadSystemHealth();
    } else {
      console.log('[admin-tools] #admin-system-health niet gevonden — systeemstatus wordt niet automatisch geladen.');
    }
  }

  // Auto-init zodra DOM geladen is
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminTools);
  } else {
    initAdminTools();
  }

  // Exporteer naar global (optioneel gebruik in andere scripts)
  window.irisjeAdminTools = {
    init: initAdminTools,
    reloadStats: loadAdminStats,
    reloadHealth: loadSystemHealth
  };
})();

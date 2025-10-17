// frontend/js/dashboard.js
//
// Laadt statistieken en aanvragen voor het ingelogde bedrijf.
// Gebruikt Secure.fetchWithAuth uit secure.js en breekt niet als een endpoint ontbreekt.
// Werkt direct met de HTML van frontend/dashboard.html.
//
// Endpoints (probeert meerdere varianten, neemt de eerste die werkt):
// - Stats:     /api/dashboard/stats, /api/company/stats, /api/companies/me/stats
// - Requests:  /api/dashboard/requests, /api/company/requests, /api/companies/me/requests
//
// Verwachte responsvormen (flexibel):
// Stats:
//   { total: Number, accepted: Number, rejected: Number, followed: Number }
// Requests (array):
//   [
//     {
//       name: String,
//       email: String,
//       message: String,
//       status: "accepted"|"rejected"|"followed"|"new"|"pending",
//       date: String|Date (ISO)  // of createdAt
//     },
//     ...
//   ]
//
// Fouttolerant: als iets mislukt, toont de UI gewoon "0" of "Geen aanvragen gevonden" i.p.v. wit scherm.
//

(() => {
  "use strict";

  // -------- Utilities --------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function safeText(v) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }

  function formatDate(input) {
    try {
      const d = input ? new Date(input) : null;
      if (!d || isNaN(d.getTime())) return "";
      // NL-weergave (dag-maand-jaar, 24u)
      return d.toLocaleString("nl-NL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function toStatusLabel(status) {
    const s = String(status || "").toLowerCase();
    switch (s) {
      case "accepted":
      case "geaccepteerd":
        return { text: "Geaccepteerd", className: "status-chip status-accepted" };
      case "rejected":
      case "afgewezen":
        return { text: "Afgewezen", className: "status-chip status-rejected" };
      case "followed":
      case "opgevolgd":
        return { text: "Opgevolgd", className: "status-chip status-followed" };
      case "pending":
      case "nieuw":
      case "new":
      default:
        return { text: "Nieuw", className: "status-chip status-new" };
    }
  }

  // Klein beetje inline styling voor de status-chip (zonder Tailwind)
  function ensureChipStyles() {
    if (document.getElementById("irisje-chip-styles")) return;
    const style = document.createElement("style");
    style.id = "irisje-chip-styles";
    style.textContent = `
      .status-chip{display:inline-block;padding:.25rem .5rem;border-radius:999px;font-size:.8rem;font-weight:600;}
      .status-accepted{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;}
      .status-rejected{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;}
      .status-followed{background:#fffbeb;color:#92400e;border:1px solid #fde68a;}
      .status-new{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;}
      .btn-row{display:flex;gap:.5rem;flex-wrap:wrap}
      .btn{padding:.35rem .6rem;border-radius:.5rem;border:1px solid #e5e7eb;background:#fff;cursor:pointer}
      .btn:hover{background:#f9fafb}
    `;
    document.head.appendChild(style);
  }

  // Probeer een reeks endpoints; retourneer de eerste succesvolle JSON-respons.
  async function tryJsonEndpoints(endpoints, opts = {}) {
    let lastErr = null;
    for (const path of endpoints) {
      try {
        const res = await window.Secure.fetchWithAuth(path, { method: "GET", ...opts });
        if (!res.ok) continue;
        const data = await res.json();
        return { data, endpoint: path };
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    throw new Error("Geen werkend endpoint gevonden");
  }

  // -------- Data loaders --------
  async function loadStats() {
    const endpoints = ["/api/dashboard/stats", "/api/company/stats", "/api/companies/me/stats"];
    try {
      const { data } = await tryJsonEndpoints(endpoints);
      const totalEl = qs("#statTotal");
      const accEl = qs("#statAccepted");
      const rejEl = qs("#statRejected");
      const folEl = qs("#statFollowed");
      if (totalEl) totalEl.textContent = Number(data.total || 0);
      if (accEl) accEl.textContent = Number(data.accepted || 0);
      if (rejEl) rejEl.textContent = Number(data.rejected || 0);
      if (folEl) folEl.textContent = Number(data.followed || 0);
    } catch {
      // Laat defaults staan (0) – geen harde fout in UI
    }
  }

  async function loadRequests(statusFilter = "all") {
    const endpoints = [
      "/api/dashboard/requests",
      "/api/company/requests",
      "/api/companies/me/requests",
    ];

    /** normaliseer diverse mogelijke response-vormen naar eenduidige array */
    function normalizeRequests(raw) {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw.requests)) return raw.requests;
      if (Array.isArray(raw.items)) return raw.items;
      return [];
    }

    try {
      const { data } = await tryJsonEndpoints(endpoints);
      let list = normalizeRequests(data);

      if (statusFilter && statusFilter !== "all") {
        const wanted = statusFilter.toLowerCase();
        list = list.filter((r) => String(r.status || "").toLowerCase() === wanted);
      }

      renderRequests(list);
    } catch {
      renderRequests([]); // toon "Geen aanvragen gevonden" bij problemen
    }
  }

  async function setLastLoginFromProfile() {
    // Gebruik het bestaande profiel (secure.js) om "Laatst ingelogd" te tonen
    try {
      const profile = await window.Secure.loadMyCompanyProfile();
      const lastEl = qs("#lastLogin");
      const val =
        profile &&
        (profile.lastLogin || profile.updatedAt || profile.createdAt || profile.lastSeen || null);
      if (lastEl) lastEl.textContent = val ? formatDate(val) : "vandaag";
    } catch {
      const lastEl = qs("#lastLogin");
      if (lastEl) lastEl.textContent = "vandaag";
    }
  }

  // -------- Renderers --------
  function renderRequests(requests) {
    ensureChipStyles();
    const tbody = qs("#requestsTableBody");
    if (!tbody) return;

    // Leegmaken
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (!requests || requests.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.style.textAlign = "center";
      td.style.color = "var(--irisje-muted, #6b7280)";
      td.style.padding = "1rem";
      td.textContent = "Geen aanvragen gevonden.";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    for (const r of requests) {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.textContent = safeText(r.name || r.fullName || r.clientName || "-");

      const tdEmail = document.createElement("td");
      const email = safeText(r.email || r.clientEmail || "-");
      if (email && email !== "-") {
        const a = document.createElement("a");
        a.href = `mailto:${email}`;
        a.textContent = email;
        a.style.color = "var(--irisje-primary, #4f46e5)";
        a.style.textDecoration = "none";
        a.addEventListener("mouseenter", () => (a.style.textDecoration = "underline"));
        a.addEventListener("mouseleave", () => (a.style.textDecoration = "none"));
        tdEmail.appendChild(a);
      } else {
        tdEmail.textContent = "-";
      }

      const tdMsg = document.createElement("td");
      tdMsg.textContent = safeText(r.message || r.body || r.notes || "-");

      const tdStatus = document.createElement("td");
      const st = toStatusLabel(r.status);
      const chip = document.createElement("span");
      chip.className = st.className;
      chip.textContent = st.text;
      tdStatus.appendChild(chip);

      const tdDate = document.createElement("td");
      tdDate.textContent = formatDate(r.date || r.createdAt || r.updatedAt);

      const tdActions = document.createElement("td");
      const row = document.createElement("div");
      row.className = "btn-row";

      const btnAccept = document.createElement("button");
      btnAccept.className = "btn";
      btnAccept.textContent = "Markeer geaccepteerd";
      btnAccept.addEventListener("click", () => updateRequestStatus(r, "accepted"));

      const btnReject = document.createElement("button");
      btnReject.className = "btn";
      btnReject.textContent = "Markeer afgewezen";
      btnReject.addEventListener("click", () => updateRequestStatus(r, "rejected"));

      const btnFollow = document.createElement("button");
      btnFollow.className = "btn";
      btnFollow.textContent = "Markeer opgevolgd";
      btnFollow.addEventListener("click", () => updateRequestStatus(r, "followed"));

      row.appendChild(btnAccept);
      row.appendChild(btnReject);
      row.appendChild(btnFollow);
      tdActions.appendChild(row);

      tr.appendChild(tdName);
      tr.appendChild(tdEmail);
      tr.appendChild(tdMsg);
      tr.appendChild(tdStatus);
      tr.appendChild(tdDate);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  // -------- Mutations (status bijwerken) --------
  async function updateRequestStatus(request, newStatus) {
    // Zoek een bruikbaar endpoint voor updates
    const candidates = [
      { path: "/api/dashboard/requests/status", method: "PATCH" },
      { path: "/api/company/requests/status", method: "PATCH" },
      { path: "/api/companies/me/requests/status", method: "PATCH" },
    ];

    const payload = {
      id: request.id || request._id || request.requestId,
      status: newStatus,
    };

    // Als er geen id is, kunnen we niet bijwerken – geef visuele feedback en stop.
    if (!payload.id) {
      alert("Kan status niet bijwerken: ontbrekend ID.");
      return;
    }

    let updated = false;
    for (const c of candidates) {
      try {
        const res = await window.Secure.fetchWithAuth(c.path, {
          method: c.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          updated = true;
          break;
        }
      } catch {
        // Probeer volgende kandidaat
      }
    }

    if (!updated) {
      alert("Bijwerken mislukt. Probeer het later opnieuw.");
      return;
    }

    // Na update: stats en lijst verversen (behoud huidige filter)
    const filter = qs("#filterStatus");
    await Promise.all([loadStats(), loadRequests(filter ? filter.value : "all")]);
  }

  // -------- Boot --------
  window.addEventListener("DOMContentLoaded", async () => {
    // Zorg dat secure aanwezig is en dat we ingelogd zijn; secure.js regelt redirect
    if (!window.Secure || !window.Secure.requireAuth()) return;

    const filter = qs("#filterStatus");
    if (filter) {
      filter.addEventListener("change", () => loadRequests(filter.value));
    }

    await setLastLoginFromProfile();
    await loadStats();
    await loadRequests(filter ? filter.value : "all");
  });
})();

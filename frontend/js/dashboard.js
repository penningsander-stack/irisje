// frontend/js/dashboard.js
(() => {
  "use strict";

  const qs = (sel, root = document) => root.querySelector(sel);

  function safeText(v) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }

  function formatDate(input) {
    try {
      const d = new Date(input);
      return isNaN(d) ? "" : d.toLocaleString("nl-NL");
    } catch {
      return "";
    }
  }

  function renderStats(data = {}) {
    qs("#statTotal").textContent = data.total ?? 0;
    qs("#statAccepted").textContent = data.accepted ?? 0;
    qs("#statRejected").textContent = data.rejected ?? 0;
    qs("#statFollowed").textContent = data.followed ?? 0;
  }

  function renderRequests(requests = []) {
    const tbody = qs("#requestsTableBody");
    tbody.innerHTML = "";
    if (!requests.length) {
      tbody.innerHTML =
        `<tr><td colspan="6" style="text-align:center; color:gray; padding:1rem;">Geen aanvragen gevonden.</td></tr>`;
      return;
    }

    for (const r of requests) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${safeText(r.name)}</td>
        <td>${safeText(r.email)}</td>
        <td>${safeText(r.message)}</td>
        <td>${safeText(r.status)}</td>
        <td>${formatDate(r.date || r.createdAt)}</td>
        <td>-</td>
      `;
      tbody.appendChild(tr);
    }
  }

  async function loadStats() {
    try {
      const res = await window.Secure.fetchWithAuth("/api/dashboard/stats");
      const data = await res.json();
      renderStats(data);
    } catch {
      renderStats({});
    }
  }

  async function loadRequests() {
    try {
      const res = await window.Secure.fetchWithAuth("/api/dashboard/requests");
      const data = await res.json();
      renderRequests(data);
    } catch {
      renderRequests([]);
    }
  }

  window.addEventListener("DOMContentLoaded", async () => {
    if (!window.Secure.requireAuth()) return;
    await loadStats();
    await loadRequests();
  });
})();

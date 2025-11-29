// frontend/js/dashboard_safe.js
// ==========================================
// Irisje.nl - Bedrijfsdashboard (fix voor items[] en NL-statusteksten)
// ==========================================

const API_BASE = "https://irisje-backend.onrender.com/api";

// -------------------- Hulp functies --------------------

async function apiGet(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "GET",
      credentials: "include"
    });
    if (!response.ok) throw new Error(`Fout ${response.status} bij ${endpoint}`);
    return await response.json();
  } catch (err) {
    console.error("API GET-fout:", err);
    return null;
  }
}

// -------------------- UI-elementen --------------------

const companyNameEl = document.getElementById("companyName");
const lastLoginEl = document.getElementById("lastLogin");
const statTotalEl = document.getElementById("statTotal");
const statAcceptedEl = document.getElementById("statAccepted");
const statRejectedEl = document.getElementById("statRejected");
const statFollowedEl = document.getElementById("statFollowed");
const requestsBody = document.getElementById("requestsBody");
const reviewsBody = document.getElementById("reviewsBody");
const statusFilter = document.getElementById("statusFilter");
const logoutBtn = document.getElementById("logoutBtn");

// -------------------- Inloggen & Ping --------------------

async function checkAuth() {
  const ping = await apiGet("/auth/ping");
  if (!ping) {
    showDebug("Backend niet bereikbaar of ping faalt.");
    return;
  }

  const me = await apiGet("/auth/me");
  if (!me || !me.user) {
    showDebug("Niet ingelogd. Redirect naar loginpagina...");
    setTimeout(() => (window.location.href = "login.html"), 1500);
    return;
  }

  companyNameEl.textContent = me.user.name || "Bedrijf";
  lastLoginEl.textContent = formatDate(me.user.lastLogin);
}

// -------------------- Aanvragen laden --------------------

async function loadRequests() {
  const data = await apiGet("/requests");
  const list = data?.requests || data?.items || [];
  if (!Array.isArray(list) || list.length === 0) {
    renderEmpty(requestsBody, 5, "Geen aanvragen gevonden.");
    renderStats([]);
    return;
  }

  const filter = statusFilter.value;
  const filtered = list.filter(
    (r) => filter === "all" || r.status === filter
  );

  renderRequests(filtered);
  renderStats(list);
}

function renderRequests(requests) {
  requestsBody.innerHTML = "";
  if (requests.length === 0) {
    renderEmpty(requestsBody, 5, "Geen aanvragen gevonden.");
    return;
  }
  for (const r of requests) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name || "-"}</td>
      <td>${r.email || "-"}</td>
      <td>${r.message || "-"}</td>
      <td>${statusLabel(r.status)}</td>
      <td>${formatDate(r.createdAt)}</td>
    `;
    requestsBody.appendChild(tr);
  }
}

// -------------------- Reviews laden --------------------

async function loadReviews() {
  const data = await apiGet("/reviews/company");
  const list = data?.reviews || data?.items || [];
  if (!Array.isArray(list) || list.length === 0) {
    renderEmpty(reviewsBody, 5, "Geen reviews gevonden.");
    return;
  }

  reviewsBody.innerHTML = "";
  for (const r of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name || "-"}</td>
      <td>${"⭐".repeat(r.rating || 0)}</td>
      <td>${r.message || ""}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td><button class="iris-btn iris-btn-sm" data-id="${r._id}">Meld</button></td>
    `;
    reviewsBody.appendChild(tr);
  }

  reviewsBody.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => reportReview(btn.dataset.id));
  });
}

async function reportReview(id) {
  if (!confirm("Weet je zeker dat je deze review wilt melden?")) return;
  try {
    const res = await fetch(`${API_BASE}/reviews/report/${id}`, {
      method: "POST",
      credentials: "include"
    });
    if (!res.ok) throw new Error("Fout bij melden van review");
    alert("Review gemeld en wordt beoordeeld door de beheerder.");
  } catch (err) {
    console.error("Meldfout:", err);
    alert("Kon review niet melden.");
  }
}

// -------------------- Statistieken --------------------

function renderStats(requests) {
  const total = requests.length;
  const accepted = requests.filter((r) => r.status === "Geaccepteerd").length;
  const rejected = requests.filter((r) => r.status === "Afgewezen").length;
  const followed = requests.filter((r) => r.status === "Opgevolgd").length;

  statTotalEl.textContent = total;
  statAcceptedEl.textContent = accepted;
  statRejectedEl.textContent = rejected;
  statFollowedEl.textContent = followed;
}

// -------------------- Hulpfuncties --------------------

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusLabel(status) {
  const labels = {
    Nieuw: '<span class="status-followed">Nieuw</span>',
    Geaccepteerd: '<span class="status-accepted">Geaccepteerd</span>',
    Afgewezen: '<span class="status-rejected">Afgewezen</span>',
    Opgevolgd: '<span class="status-followed">Opgevolgd</span>',
  };
  return labels[status] || status || "-";
}

function renderEmpty(target, cols, text) {
  target.innerHTML = `<tr class="iris-empty-row"><td colspan="${cols}">${text}</td></tr>`;
}

function showDebug(msg) {
  console.warn("[DEBUG]", msg);
}

// -------------------- Uitloggen --------------------

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "login.html";
  });
}

// -------------------- Init --------------------

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await loadRequests();
  await loadReviews();

  if (statusFilter) {
    statusFilter.addEventListener("change", loadRequests);
  }
});

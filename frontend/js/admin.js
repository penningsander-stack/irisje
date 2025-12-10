// frontend/js/admin.js
// v20251210-SEARCH-ENABLED

const API_BASE = "https://irisje-backend.onrender.com/api/admin";

function byId(id) { return document.getElementById(id); }

function getAuthHeaders() {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch(url, options = {}) {
  const { allow404, ...rest } = options;
  const merged = { ...rest, headers: { ...(rest.headers || {}), ...getAuthHeaders() } };

  try {
    const res = await fetch(url, merged);
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }
    if (allow404 && res.status === 404) return null;

    const json = res.headers.get("content-type")?.includes("application/json");
    const data = json ? await res.json().catch(() => null) : null;

    if (!res.ok) throw new Error(data?.error || data?.message || `Error ${res.status}`);

    return data;
  } catch (err) {
    console.error("[admin] fetch error:", url, err);
    throw err;
  }
}

function initAdmin() {
  const notif = buildNotificationBar();

  const logoutBtn = byId("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      showNotif(notif, "Uitgelogd");
      setTimeout(() => (window.location = "login.html"), 500);
    };
  }

  const tabButtons = document.querySelectorAll(".admin-tab");
  const sections = [
    byId("section-overview"),
    byId("section-reported"),
    byId("section-claims"),
    byId("section-logs"),
  ];

  tabButtons.forEach((btn) => {
    btn.onclick = () => {
      const target = btn.getAttribute("data-target");

      tabButtons.forEach((b) => b.classList.remove("bg-indigo-600", "text-white"));
      btn.classList.add("bg-indigo-600", "text-white");

      sections.forEach((sec) => sec.classList.toggle("hidden", sec.id !== target));
    };
  });

  /* -----------------------------
     BEDRIJVEN + ZOEKFUNCTIE
  ----------------------------- */
  const companyBody = byId("adminCompanyTable");
  const refreshBtn = byId("refreshCompaniesBtn");
  const searchInput = byId("companySearch");

  let allCompanies = [];

  async function loadCompanies() {
    companyBody.innerHTML =
      '<tr><td colspan="4" class="p-4 text-center text-gray-400">Laden...</td></tr>';

    try {
      const data = await safeFetch(`${API_BASE}/companies`);
      const list = Array.isArray(data) ? data : data?.companies || [];

      allCompanies = list;
      renderCompanies(list);
    } catch {
      companyBody.innerHTML =
        '<tr><td colspan="4" class="p-4 text-center text-red-600">Fout bij laden</td></tr>';
    }
  }

  function renderCompanies(list) {
    if (!list.length) {
      companyBody.innerHTML =
        '<tr><td colspan="4" class="p-4 text-center text-gray-400">Geen bedrijven gevonden.</td></tr>';
      return;
    }
    companyBody.innerHTML = list.map(renderCompanyRow).join("");
  }

  function renderCompanyRow(c) {
    const verified = c.verified || c.isVerified;
    const badgeClass = verified
      ? "bg-emerald-50 text-emerald-600"
      : "bg-yellow-50 text-yellow-600";

    return `
      <tr class="border-b">
        <td class="p-3">
          <div class="font-semibold">${esc(c.name || "")}</div>
          <div class="text-xs text-gray-500">${
            c.createdAt ? new Date(c.createdAt).toLocaleDateString("nl-NL") : ""
          }</div>
        </td>
        <td class="p-3">
          ${
            c.email
              ? `<a href="mailto:${c.email}" class="text-indigo-600 hover:underline">${c.email}</a>`
              : `<span class="text-xs text-gray-400">geen e-mail</span>`
          }
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 text-xs rounded-full ${badgeClass}">
            ${verified ? "Geverifieerd" : "Niet geverifieerd"}
          </span>
        </td>
        <td class="p-3 text-right text-xs">
          <a href="results.html?company=${encodeURIComponent(c._id)}"
             class="text-indigo-600 hover:underline">
            Bekijk bedrijf
          </a>
        </td>
      </tr>
    `;
  }

  /* ----- LIVE SEARCH ----- */
  if (searchInput) {
    searchInput.oninput = () => {
      const q = searchInput.value.toLowerCase().trim();

      if (!q) {
        renderCompanies(allCompanies);
        return;
      }

      const filtered = allCompanies.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );

      renderCompanies(filtered);
    };
  }

  if (refreshBtn) refreshBtn.onclick = loadCompanies;

  loadCompanies();
}

/* -----------------------------
   HELPERS
----------------------------- */
function buildNotificationBar() {
  const el = document.createElement("div");
  el.id = "adminNotif";
  el.className =
    "hidden fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded shadow-lg z-50";
  document.body.appendChild(el);
  return el;
}

function showNotif(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
  el.style.opacity = 1;
  setTimeout(() => {
    el.style.opacity = 0;
    setTimeout(() => el.classList.add("hidden"), 300);
  }, 2000);
}

function esc(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", initAdmin);

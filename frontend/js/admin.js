// frontend/js/admin.js
// v20260111-ADMIN-FIX-LOAD-COMPANIES-AND-EDIT

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com/api";

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (sel) => document.querySelector(sel);

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function apiFetch(path, opts = {}) {
    const url = `${API_BASE}${path}`;
    const headers = {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(opts.headers || {}),
    };

    const res = await fetch(url, { ...opts, headers });

    // probeer altijd JSON te lezen; zo niet, maak duidelijke fout
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `HTTP ${res.status} (${res.statusText})`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  function setLoadingState(isLoading) {
    const btn = $("#refreshCompaniesBtn");
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "Laden..." : "Ververs";
  }

  function showCompaniesError(message) {
    const tbody = $("#adminCompanyTable");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="padding:12px; color:#64748b;">
            ${message || "Kon bedrijven niet laden."}
          </td>
        </tr>
      `;
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // -----------------------------
  // Companies
  // -----------------------------
  async function loadCompanies() {
    const token = getToken();
    if (!token) {
      showCompaniesError("Niet ingelogd. Ga naar login.");
      return;
    }

    const tbody = $("#adminCompanyTable");
    if (!tbody) return;

    setLoadingState(true);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="padding:12px; color:#64748b;">Bedrijven laden…</td>
      </tr>
    `;

    try {
      // Backend: GET /api/admin/companies -> { ok: true, companies: [...] }
      const data = await apiFetch("/admin/companies", { method: "GET" });
      const companies = data?.companies || [];

      if (!companies.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="padding:12px; color:#64748b;">Geen bedrijven gevonden.</td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = companies
        .map((c) => {
          const name = escapeHtml(c.name || "");
          const city = escapeHtml(c.city || "");
          const cats = Array.isArray(c.categories) ? c.categories : [];
          const categories = escapeHtml(cats.join(", "));
          const slug = encodeURIComponent(c.slug || "");
          const id = escapeHtml(c._id || "");

          return `
            <tr data-company-id="${id}">
              <td class="py-3 px-4">
                <div class="font-medium text-slate-900">${name}</div>
                <div class="text-xs text-slate-500">${escapeHtml(c.slug || "")}</div>
              </td>
              <td class="py-3 px-4 text-slate-700">${city}</td>
              <td class="py-3 px-4 text-slate-700">${categories}</td>
              <td class="py-3 px-4">
                <div class="flex flex-wrap gap-2">
                  <a
                    class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    href="/company.html?slug=${slug}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >Bekijken</a>

                  <button
                    type="button"
                    class="btn-edit inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                    data-edit-id="${id}"
                  >Bewerken</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");

      // bind edit handlers
      tbody.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-edit-id");
          if (!id) return;

          // haal huidige rij-waarden op als default
          const row = btn.closest("tr");
          const currentName =
            row?.querySelector("td:nth-child(1) .font-medium")?.textContent?.trim() ||
            "";
          const currentCity =
            row?.querySelector("td:nth-child(2)")?.textContent?.trim() || "";
          const currentCategories =
            row?.querySelector("td:nth-child(3)")?.textContent?.trim() || "";

          // simpele, robuuste edit-flow zonder extra HTML (geen modal nodig)
          const newName = window.prompt("Bedrijfsnaam:", currentName);
          if (newName === null) return;

          const newCity = window.prompt("Plaats:", currentCity);
          if (newCity === null) return;

          const newCategoriesStr = window.prompt(
            "Categorieën (komma-gescheiden):",
            currentCategories
          );
          if (newCategoriesStr === null) return;

          const payload = {
            name: String(newName).trim(),
            city: String(newCity).trim(),
            categories: String(newCategoriesStr)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          };

          try {
            // Backend (Stap 1B-A): PATCH /api/admin/companies/:id
            await apiFetch(`/admin/companies/${encodeURIComponent(id)}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });

            // herlaad lijst zodat je zeker consistente data hebt
            await loadCompanies();
          } catch (e) {
            alert(`Bewerken mislukt: ${e.message}`);
          }
        });
      });
    } catch (err) {
      showCompaniesError(err.message || "Kon bedrijven niet laden.");
      console.error("❌ loadCompanies error:", err);
    } finally {
      setLoadingState(false);
    }
  }

  // -----------------------------
  // Init
  // -----------------------------
  function init() {
    const refreshBtn = $("#refreshCompaniesBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", (e) => {
        e.preventDefault();
        loadCompanies();
      });
    }

    // alleen bedrijven-tab in deze minimal versie: direct laden
    loadCompanies();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

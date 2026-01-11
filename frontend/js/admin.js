// frontend/js/admin.js
// v20260111-ADMIN-EDIT-MODAL-INJECT-FIX
//
// Fixes:
// - "Bewerken" klik deed niets omdat admin.html geen editModal/editForm elements had.
// - Dit bestand injecteert nu automatisch een edit-modal in de DOM als die ontbreekt.
// - Event delegation: clicks blijven werken, ook na re-render.
// - Robust parsing van API response ({companies} of {results}).
//
// Vereist:
// - JWT token in localStorage onder key "token" (zoals bij jouw login).
// - Backend endpoint voor opslaan (PATCH /api/admin/companies/:id). Als die (nog) ontbreekt krijg je een duidelijke foutmelding.

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";

  // -----------------------------
  // Helpers
  // -----------------------------
  const qs = (sel, root = document) => root.querySelector(sel);

  const getToken = () => {
    const t = localStorage.getItem("token");
    return t && typeof t === "string" ? t.trim() : "";
  };

  const authHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  async function safeJson(res) {
    const text = await res.text().catch(() => "");
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function setStatus(message, type = "info") {
    const el = qs("#adminStatus");
    if (!el) return;

    el.classList.remove("hidden");
    el.textContent = message;

    // optioneel: simpele status styling als je classes hebt
    el.dataset.type = type;
  }

  function hideStatus() {
    const el = qs("#adminStatus");
    if (!el) return;
    el.classList.add("hidden");
    el.textContent = "";
    el.dataset.type = "";
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeArr(val) {
    if (Array.isArray(val)) return val.filter(Boolean).map(String);
    if (typeof val === "string" && val.trim()) return [val.trim()];
    return [];
  }

  // -----------------------------
  // State
  // -----------------------------
  let companies = [];
  let companiesById = new Map();

  // -----------------------------
  // Modal injection (admin.html mist dit vaak)
  // -----------------------------
  function ensureEditModal() {
    if (qs("#editModal")) return;

    const modal = document.createElement("div");
    modal.id = "editModal";
    modal.className =
      "fixed inset-0 z-50 hidden items-center justify-center bg-black/40 p-4";
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div class="w-full max-w-2xl rounded-2xl bg-white shadow-soft border border-slate-200">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div class="text-sm text-slate-500">Bedrijf bewerken</div>
            <div id="editTitle" class="text-lg font-semibold text-slate-900">—</div>
          </div>
          <button type="button" id="editClose"
            class="rounded-lg px-3 py-2 text-sm border border-slate-200 hover:bg-slate-50">
            Sluiten
          </button>
        </div>

        <form id="editForm" class="p-5 space-y-4">
          <input type="hidden" id="editId" />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <div class="text-sm font-medium text-slate-700 mb-1">Naam</div>
              <input id="editName" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>

            <label class="block">
              <div class="text-sm font-medium text-slate-700 mb-1">Plaats</div>
              <input id="editCity" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>

          <label class="block">
            <div class="text-sm font-medium text-slate-700 mb-1">Omschrijving</div>
            <textarea id="editDescription" rows="4"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
          </label>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <div class="text-sm font-medium text-slate-700 mb-1">Categorieën (komma-gescheiden)</div>
              <input id="editCategories" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>

            <label class="block">
              <div class="text-sm font-medium text-slate-700 mb-1">Specialismen (komma-gescheiden)</div>
              <input id="editSpecialties" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>

          <label class="inline-flex items-center gap-2">
            <input id="editVerified" type="checkbox" class="h-4 w-4" />
            <span class="text-sm text-slate-700">Geverifieerd</span>
          </label>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" id="editCancel"
              class="rounded-lg px-4 py-2 text-sm border border-slate-200 hover:bg-slate-50">
              Annuleren
            </button>
            <button type="submit" id="editSave"
              class="rounded-lg px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700">
              Opslaan
            </button>
          </div>

          <div id="editError" class="hidden text-sm text-red-600"></div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => hideModal(modal);

    qs("#editClose")?.addEventListener("click", close);
    qs("#editCancel")?.addEventListener("click", close);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) close();
    });

    qs("#editForm")?.addEventListener("submit", onEditSubmit);
  }

  function showModal(modalEl) {
    modalEl.classList.remove("hidden");
    modalEl.classList.add("flex");
    modalEl.setAttribute("aria-hidden", "false");
  }

  function hideModal(modalEl) {
    modalEl.classList.add("hidden");
    modalEl.classList.remove("flex");
    modalEl.setAttribute("aria-hidden", "true");
    clearEditError();
  }

  function setEditError(msg) {
    const el = qs("#editError");
    if (!el) return;
    el.classList.remove("hidden");
    el.textContent = msg;
  }

  function clearEditError() {
    const el = qs("#editError");
    if (!el) return;
    el.classList.add("hidden");
    el.textContent = "";
  }

  // -----------------------------
  // Render table
  // -----------------------------
  function renderCompaniesTable(list) {
    const tbody = qs("#companiesTbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    for (const c of list) {
      const tr = document.createElement("tr");

      const cats = normalizeArr(c.categories).join(", ");
      const city = c.city ?? "";
      const name = c.name ?? "";

      tr.innerHTML = `
        <td class="py-3 pr-3">
          <div class="font-medium text-slate-900">${escapeHtml(name)}</div>
          <div class="text-xs text-slate-500">${escapeHtml(c.slug ?? "")}</div>
        </td>
        <td class="py-3 pr-3 text-slate-700">${escapeHtml(city)}</td>
        <td class="py-3 pr-3 text-slate-700">${escapeHtml(cats)}</td>
        <td class="py-3 text-right">
          <button
            class="js-edit-btn rounded-lg px-3 py-2 text-sm border border-slate-200 hover:bg-slate-50"
            data-action="edit"
            data-id="${escapeHtml(c._id)}"
            type="button"
          >
            Bewerken
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    }
  }

  // -----------------------------
  // Load companies
  // -----------------------------
  async function loadCompanies() {
    hideStatus();

    const token = getToken();
    if (!token) {
      setStatus("Geen token gevonden. Log opnieuw in als admin.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/companies`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.ok) {
        const msg = data?.error || `Kon bedrijven niet laden (HTTP ${res.status}).`;
        setStatus(msg, "error");
        return;
      }

      // Support beide vormen: {companies: []} of {results: []}
      companies = Array.isArray(data.companies)
        ? data.companies
        : Array.isArray(data.results)
        ? data.results
        : [];

      companiesById = new Map(companies.map((c) => [String(c._id), c]));

      renderCompaniesTable(companies);
    } catch (err) {
      setStatus(`Kon bedrijven niet laden: ${err?.message || err}`, "error");
    }
  }

  // -----------------------------
  // Click handling (event delegation)
  // -----------------------------
  function bindTableClicks() {
    const tbody = qs("#companiesTbody");
    if (!tbody) return;

    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "edit") {
        const c = companiesById.get(String(id));
        if (!c) {
          setStatus("Bedrijf niet gevonden in de lijst (refresh de pagina).", "error");
          return;
        }
        openEditModal(c);
      }
    });
  }

  // -----------------------------
  // Edit flow
  // -----------------------------
  function openEditModal(company) {
    ensureEditModal();

    const modal = qs("#editModal");
    if (!modal) {
      setStatus("Edit-modal kon niet worden opgebouwd.", "error");
      return;
    }

    clearEditError();

    qs("#editTitle").textContent = company.name || "Bedrijf";
    qs("#editId").value = company._id || "";

    qs("#editName").value = company.name || "";
    qs("#editCity").value = company.city || "";
    qs("#editDescription").value = company.description || "";

    qs("#editCategories").value = normalizeArr(company.categories).join(", ");
    qs("#editSpecialties").value = normalizeArr(company.specialties).join(", ");

    // Let op: in jouw data heet het vaak isVerified (frontend),
    // maar sommige admin flows gebruiken verified. We ondersteunen beide.
    const isVerified = Boolean(company.isVerified ?? company.verified ?? false);
    qs("#editVerified").checked = isVerified;

    showModal(modal);
  }

  function parseCommaList(str) {
    return String(str ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onEditSubmit(e) {
    e.preventDefault();
    clearEditError();

    const id = qs("#editId")?.value?.trim();
    if (!id) {
      setEditError("Ontbrekende company id.");
      return;
    }

    const payload = {
      name: qs("#editName")?.value?.trim() || "",
      city: qs("#editCity")?.value?.trim() || "",
      description: qs("#editDescription")?.value || "",
      categories: parseCommaList(qs("#editCategories")?.value),
      specialties: parseCommaList(qs("#editSpecialties")?.value),
      // backend kan "isVerified" of "verified" verwachten; we sturen beide om safe te zijn
      isVerified: Boolean(qs("#editVerified")?.checked),
      verified: Boolean(qs("#editVerified")?.checked),
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/companies/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error ||
          "Opslaan mislukt. Controleer of backend PATCH /api/admin/companies/:id bestaat.";
        setEditError(msg);
        return;
      }

      // backend kan {company} of {item} teruggeven; anders herladen
      const updated =
        data.company || data.item || data.updated || null;

      if (updated && updated._id) {
        // update state lokaal
        companiesById.set(String(updated._id), updated);
        companies = companies.map((c) => (String(c._id) === String(updated._id) ? updated : c));
        renderCompaniesTable(companies);
      } else {
        await loadCompanies();
      }

      const modal = qs("#editModal");
      if (modal) hideModal(modal);
      setStatus("Bedrijf opgeslagen.", "success");
      setTimeout(() => hideStatus(), 1500);
    } catch (err) {
      setEditError(err?.message || String(err));
    }
  }

  // -----------------------------
  // Init
  // -----------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    // status element is optioneel; als admin.html hem niet heeft is dat ok
    ensureEditModal();
    bindTableClicks();
    await loadCompanies();
  });
})();

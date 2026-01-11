// frontend/js/admin.js
// v20260111-ADMIN-EDIT-FIX-COLUMNS-AND-MODAL
//
// Fixes:
// - Rendert nu 5 kolommen (incl. Status) zodat "Bewerken" onder "Acties" blijft.
// - Modal/JS structuur is nu 1-op-1 consistent met admin.html (cancelEdit/saveEdit/editId etc).
// - Event delegation voor edit buttons.
// - Robuust: ondersteunt response {companies: []} of {results: []}.

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";

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

  function parseCommaList(str) {
    return String(str ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function showError(msg) {
    const box = qs("#errorBox");
    if (!box) return;
    box.classList.remove("hidden");
    box.textContent = msg;
  }

  function hideError() {
    const box = qs("#errorBox");
    if (!box) return;
    box.classList.add("hidden");
    box.textContent = "";
  }

  // -----------------------------
  // State
  // -----------------------------
  let companies = [];
  let companiesById = new Map();

  // -----------------------------
  // Modal helpers
  // -----------------------------
  function modalEl() {
    return qs("#editModal");
  }

  function openModal() {
    const m = modalEl();
    if (!m) return;
    m.classList.remove("hidden");
    m.classList.add("flex");
  }

  function closeModal() {
    const m = modalEl();
    if (!m) return;
    m.classList.add("hidden");
    m.classList.remove("flex");
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

  function fillEditForm(company) {
    qs("#editId").value = company._id || "";

    qs("#editName").value = company.name || "";
    qs("#editCity").value = company.city || "";
    qs("#editDescription").value = company.description || "";

    qs("#editCategories").value = normalizeArr(company.categories).join(", ");
    qs("#editSpecialties").value = normalizeArr(company.specialties).join(", ");

    const isVerified = Boolean(company.isVerified ?? company.verified ?? false);
    qs("#editVerified").checked = isVerified;
  }

  // -----------------------------
  // Render
  // -----------------------------
  function renderCompaniesTable(list) {
    const tbody = qs("#companiesTbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    for (const c of list) {
      const tr = document.createElement("tr");

      const name = c.name ?? "";
      const city = c.city ?? "";
      const cats = normalizeArr(c.categories).join(", ");
      const isVerified = Boolean(c.isVerified ?? c.verified ?? false);

      tr.innerHTML = `
        <td class="px-4 py-3 align-top">
          <div class="font-medium text-slate-900">${escapeHtml(name)}</div>
          <div class="text-xs text-slate-500">${escapeHtml(c.slug ?? "")}</div>
        </td>

        <td class="px-4 py-3 align-top text-slate-700">${escapeHtml(city)}</td>

        <td class="px-4 py-3 align-top text-slate-700">${escapeHtml(cats)}</td>

        <td class="px-4 py-3 align-top text-slate-700">
          ${isVerified ? "Geverifieerd" : "Niet geverifieerd"}
        </td>

        <td class="px-4 py-3 align-top">
          <button
            type="button"
            class="js-edit-btn rounded-lg px-3 py-2 text-sm border border-slate-200 hover:bg-slate-50"
            data-action="edit"
            data-id="${escapeHtml(c._id)}"
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
    hideError();

    const token = getToken();
    if (!token) {
      showError("Geen token gevonden. Log opnieuw in als admin.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/companies`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.ok) {
        showError(data?.error || `Kon bedrijven niet laden (HTTP ${res.status}).`);
        return;
      }

      companies = Array.isArray(data.companies)
        ? data.companies
        : Array.isArray(data.results)
        ? data.results
        : [];

      companiesById = new Map(companies.map((c) => [String(c._id), c]));

      renderCompaniesTable(companies);
    } catch (err) {
      showError(`Kon bedrijven niet laden: ${err?.message || err}`);
    }
  }

  // -----------------------------
  // Click handling
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
          showError("Bedrijf niet gevonden in de lijst. Ververs de pagina.");
          return;
        }
        clearEditError();
        fillEditForm(c);
        openModal();
      }
    });
  }

  function bindModalControls() {
    qs("#cancelEdit")?.addEventListener("click", closeModal);

    // klik op backdrop sluit ook
    const m = modalEl();
    if (m) {
      m.addEventListener("click", (e) => {
        if (e.target === m) closeModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modalEl()?.classList.contains("hidden")) {
        closeModal();
      }
    });

    qs("#saveEdit")?.addEventListener("click", onSaveEdit);
  }

  // -----------------------------
  // Save
  // -----------------------------
  async function onSaveEdit() {
    clearEditError();
    hideError();

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
        setEditError(
          data?.error ||
            "Opslaan mislukt. Controleer of backend PATCH /api/admin/companies/:id bestaat en admin is ingelogd."
        );
        return;
      }

      const updated = data.company || data.item || data.updated || null;

      if (updated && updated._id) {
        companiesById.set(String(updated._id), updated);
        companies = companies.map((c) =>
          String(c._id) === String(updated._id) ? updated : c
        );
        renderCompaniesTable(companies);
      } else {
        await loadCompanies();
      }

      closeModal();
    } catch (err) {
      setEditError(err?.message || String(err));
    }
  }

  // -----------------------------
  // Init
  // -----------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    bindTableClicks();
    bindModalControls();
    await loadCompanies();
  });
})();

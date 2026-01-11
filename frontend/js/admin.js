// frontend/js/admin.js
// v20260111-ADMIN-EDIT-FIX
//
// Fix:
// - "Bewerken" klik werkte niet -> event delegation op tbody
// - Edit modal (zonder admin.html aan te passen)
// - PATCH update naar /api/admin/companies/:id (Authorization Bearer token)
//
// Verwachting backend (Stap 1B-A):
// - PATCH /api/admin/companies/:id bestaat en accepteert velden zoals:
//   name, email, city, categories[], specialties[], isVerified, description, logoUrl

(() => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const els = {
    companyTableBody: null,
    companyError: null,
  };

  // -----------------------------
  // Auth helpers
  // -----------------------------
  function getToken() {
    // probeer meerdere keys (verschilt soms per login.js)
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("irisje_token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt") ||
      ""
    );
  }

  function authHeaders() {
    const token = getToken();
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }

  // -----------------------------
  // UI helpers
  // -----------------------------
  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function pill(text, tone = "slate") {
    const map = {
      green: "bg-emerald-50 text-emerald-700 border-emerald-200",
      red: "bg-rose-50 text-rose-700 border-rose-200",
      amber: "bg-amber-50 text-amber-800 border-amber-200",
      slate: "bg-slate-50 text-slate-700 border-slate-200",
      indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
    const cls = map[tone] || map.slate;
    return `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}">${escapeHtml(
      text
    )}</span>`;
  }

  function showTableError(msg) {
    if (!els.companyError) return;
    els.companyError.textContent = msg;
    els.companyError.classList.remove("hidden");
  }

  function hideTableError() {
    if (!els.companyError) return;
    els.companyError.classList.add("hidden");
  }

  // -----------------------------
  // Fetch
  // -----------------------------
  async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: authHeaders(),
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok) {
      const msg = data?.error || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  async function apiPatch(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok) {
      const msg = data?.error || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  // -----------------------------
  // Render companies
  // -----------------------------
  function renderCompanies(companies) {
    if (!els.companyTableBody) return;

    if (!Array.isArray(companies) || companies.length === 0) {
      els.companyTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="p-4 text-center text-xs text-slate-500">Geen bedrijven gevonden.</td>
        </tr>
      `;
      return;
    }

    els.companyTableBody.innerHTML = companies
      .map((c) => {
        const isVerified = !!(c.isVerified ?? c.verified); // support beide velden
        const statusPill = isVerified ? pill("Geverifieerd", "green") : pill("Niet geverifieerd", "amber");

        const categories = Array.isArray(c.categories) ? c.categories : [];
        const catText = categories.length ? categories.join(", ") : "—";

        const reviewsCount = Number(c.reviewCount ?? 0);

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/60">
            <td class="p-3">
              <div class="font-medium text-slate-900">${escapeHtml(c.name)}</div>
              <div class="text-xs text-slate-500">${escapeHtml(c.city || "")}</div>
              <div class="mt-1 text-[11px] text-slate-500">Categorieën: ${escapeHtml(catText)}</div>
            </td>
            <td class="p-3 text-slate-700">${escapeHtml(c.email || "—")}</td>
            <td class="p-3">${statusPill}</td>
            <td class="p-3 text-center text-slate-700">${escapeHtml(reviewsCount)}</td>
            <td class="p-3">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  data-action="edit"
                  data-id="${escapeHtml(c._id)}"
                >Bewerken</button>

                <a
                  class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  href="/company.html?slug=${encodeURIComponent(c.slug || "")}"
                  target="_blank"
                  rel="noopener"
                >Open profiel</a>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  async function loadCompanies() {
    hideTableError();

    els.companyTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="admin-loading p-4 text-center text-xs text-gray-400">Laden...</td>
      </tr>
    `;

    const data = await apiGet("/admin/companies");
    // jouw backend retourneert vaak { ok:true, companies:[...] }
    const companies = data.companies || data.results || [];
    renderCompanies(companies);

    // cache voor edit modal
    window.__ADMIN_COMPANIES__ = companies;
  }

  // -----------------------------
  // Edit modal (injected)
  // -----------------------------
  function ensureModal() {
    if (document.getElementById("adminEditModalOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "adminEditModalOverlay";
    overlay.className =
      "fixed inset-0 z-[80] hidden items-center justify-center bg-slate-900/40 p-4";

    overlay.innerHTML = `
      <div class="w-full max-w-2xl surface-card rounded-2xl shadow-soft border border-slate-200 bg-white">
        <div class="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div class="text-sm font-semibold text-slate-900">Bedrijf bewerken</div>
            <div id="adminEditModalSubtitle" class="text-xs text-slate-500 mt-0.5">—</div>
          </div>
          <button type="button" id="adminEditClose"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >Sluiten</button>
        </div>

        <div class="p-5">
          <div id="adminEditError" class="hidden mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"></div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <div class="text-xs font-medium text-slate-700 mb-1">Naam</div>
              <input id="editName" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label class="block">
              <div class="text-xs font-medium text-slate-700 mb-1">E-mail</div>
              <input id="editEmail" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label class="block">
              <div class="text-xs font-medium text-slate-700 mb-1">Plaats</div>
              <input id="editCity" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label class="block">
              <div class="text-xs font-medium text-slate-700 mb-1">Logo URL</div>
              <input id="editLogoUrl" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label class="block md:col-span-2">
              <div class="text-xs font-medium text-slate-700 mb-1">Categorieën (komma-gescheiden)</div>
              <input id="editCategories" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="bijv. Loodgieter, Schilder" />
            </label>

            <label class="block md:col-span-2">
              <div class="text-xs font-medium text-slate-700 mb-1">Specialismen (komma-gescheiden)</div>
              <input id="editSpecialties" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label class="block md:col-span-2">
              <div class="text-xs font-medium text-slate-700 mb-1">Omschrijving</div>
              <textarea id="editDescription" rows="4" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"></textarea>
            </label>

            <label class="flex items-center gap-2 md:col-span-2">
              <input id="editVerified" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              <span class="text-sm text-slate-700">Geverifieerd</span>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
          <button type="button" id="adminEditCancel"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >Annuleren</button>
          <button type="button" id="adminEditSave"
            class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >Opslaan</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // close behavior
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.getElementById("adminEditClose").addEventListener("click", closeModal);
    document.getElementById("adminEditCancel").addEventListener("click", closeModal);
  }

  function openModal(company) {
    ensureModal();

    const overlay = document.getElementById("adminEditModalOverlay");
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    const subtitle = document.getElementById("adminEditModalSubtitle");
    subtitle.textContent = `${company.name || "—"} (${company._id || "—"})`;

    // fill
    document.getElementById("editName").value = company.name || "";
    document.getElementById("editEmail").value = company.email || "";
    document.getElementById("editCity").value = company.city || "";
    document.getElementById("editLogoUrl").value = company.logoUrl || "";

    const categories = Array.isArray(company.categories) ? company.categories : [];
    document.getElementById("editCategories").value = categories.join(", ");

    const specialties = Array.isArray(company.specialties) ? company.specialties : [];
    document.getElementById("editSpecialties").value = specialties.join(", ");

    document.getElementById("editDescription").value = company.description || "";
    document.getElementById("editVerified").checked = !!(company.isVerified ?? company.verified);

    // attach save handler (replace previous)
    const saveBtn = document.getElementById("adminEditSave");
    saveBtn.onclick = () => saveCompany(company._id);
  }

  function closeModal() {
    const overlay = document.getElementById("adminEditModalOverlay");
    if (!overlay) return;
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
    hideModalError();
  }

  function showModalError(msg) {
    const el = document.getElementById("adminEditError");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function hideModalError() {
    const el = document.getElementById("adminEditError");
    if (!el) return;
    el.classList.add("hidden");
    el.textContent = "";
  }

  function parseCsvList(str) {
    return String(str || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function saveCompany(companyId) {
    hideModalError();

    const payload = {
      name: document.getElementById("editName").value.trim(),
      email: document.getElementById("editEmail").value.trim(),
      city: document.getElementById("editCity").value.trim(),
      logoUrl: document.getElementById("editLogoUrl").value.trim(),
      categories: parseCsvList(document.getElementById("editCategories").value),
      specialties: parseCsvList(document.getElementById("editSpecialties").value),
      description: document.getElementById("editDescription").value.trim(),
      isVerified: document.getElementById("editVerified").checked,
    };

    if (!payload.name) {
      showModalError("Naam is verplicht.");
      return;
    }

    try {
      await apiPatch(`/admin/companies/${encodeURIComponent(companyId)}`, payload);

      closeModal();
      await loadCompanies(); // refresh tabel
    } catch (err) {
      showModalError(err.message || "Opslaan mislukt");
    }
  }

  // -----------------------------
  // Click handling (Bewerken)
  // -----------------------------
  function wireEvents() {
    // event delegation: knoppen worden dynamisch gerenderd
    els.companyTableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (!id) return;

      if (action === "edit") {
        const companies = window.__ADMIN_COMPANIES__ || [];
        const company = companies.find((c) => String(c._id) === String(id));
        if (!company) {
          showTableError("Bedrijf niet gevonden in lijst (herlaad de pagina).");
          return;
        }
        openModal(company);
      }
    });
  }

  // -----------------------------
  // Init
  // -----------------------------
  function init() {
    els.companyTableBody = document.getElementById("adminCompanyTable");

    // optionele error container (maakt niets stuk als het niet bestaat)
    els.companyError = document.getElementById("adminCompaniesError") || null;

    if (!els.companyTableBody) return;

    wireEvents();

    loadCompanies().catch((err) => {
      console.error("❌ Admin companies load error:", err);
      showTableError("Kon bedrijven niet laden.");
      // laat bestaande tabelmelding staan
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();

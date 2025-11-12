// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  /* ============================================================
     🟣 Beheerdersfallback (info@irisje.nl)
  ============================================================ */
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const res = await fetch(`${API_BASE}/companies`);
      const data = await res.json();
      if (res.ok && data.items?.length) {
        companyId = data.items[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.warn("Kon geen bedrijf koppelen via e-mail:", err);
    }
  }

  const $reqBody = byId("request-table-body");
  const $revBody = byId("review-table-body");
  const $periodFilter = byId("periodFilter");
  const $statusFilter = byId("statusFilter");
  const $searchInput = byId("searchInput");
  const $sortSelect = byId("sortSelect");
  const $exportBtn = byId("exportCsvBtn");

  // ✅ Universele melding
  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className =
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
  notif.textContent = "✅ Handeling voltooid";
  document.body.appendChild(notif);
  function showNotif(msg = "✅ Opgeslagen") {
    notif.textContent = msg;
    notif.classList.remove("hidden");
    notif.style.opacity = "0";
    notif.style.transition = "opacity 0.3s ease";
    setTimeout(() => (notif.style.opacity = "1"), 10);
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.classList.add("hidden"), 300);
    }, 2500);
  }

  if (!companyId) {
    if ($reqBody)
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    if ($revBody)
      $revBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
    return;
  }

  /* ============================================================
     🏢 Bedrijfsprofiel laden + opslaan
  ============================================================ */
  const $profileContainer = document.createElement("section");
  $profileContainer.className =
    "bg-white shadow-md border border-gray-100 p-6 rounded-2xl mb-10";
  $profileContainer.innerHTML = `
    <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">🏢 Bedrijfsprofiel</h2>
    <form id="companyForm" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-600">Bedrijfsnaam</label>
          <input name="name" class="mt-1 w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600">Plaats</label>
          <input name="city" class="mt-1 w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600">Telefoon</label>
          <input name="phone" class="mt-1 w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600">Website</label>
          <input name="website" class="mt-1 w-full border rounded-lg px-3 py-2" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600">Beschrijving</label>
        <textarea name="description" rows="3" class="mt-1 w-full border rounded-lg px-3 py-2"></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600">Regio’s</label>
        <input name="regions" placeholder="Bijv. Zeeland, Zuid-Holland" class="mt-1 w-full border rounded-lg px-3 py-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600">Beschikbaarheid</label>
        <input name="availability" placeholder="Bijv. 24/7 of alleen werkdagen" class="mt-1 w-full border rounded-lg px-3 py-2" />
      </div>

      <div class="flex items-center gap-2">
        <input type="checkbox" id="worksNationwide" name="worksNationwide" class="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
        <label for="worksNationwide" class="text-sm text-gray-700">Landelijk actief</label>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600">Specialisaties</label>
        <div id="specialtiesList" class="mt-2 flex flex-wrap gap-2"></div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600">Certificeringen</label>
        <div id="certificationsList" class="mt-2 flex flex-wrap gap-2"></div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600">Talen</label>
        <div id="languagesList" class="mt-2 flex flex-wrap gap-2"></div>
      </div>

      <div class="flex justify-end">
        <button type="submit" class="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition">💾 Opslaan</button>
      </div>
    </form>`;
  document.querySelector("main").prepend($profileContainer);

  const form = byId("companyForm");
  const $specialtiesList = byId("specialtiesList");
  const $certificationsList = byId("certificationsList");
  const $languagesList = byId("languagesList");

  let currentCompany = null;
  let lists = {};

  async function loadCompanyProfile() {
    try {
      const [companyRes, listRes] = await Promise.all([
        fetch(`${API_BASE}/companies/slug/${companyId}`).then((r) => r.ok ? r.json() : null),
        fetch(`${API_BASE}/companies/lists`).then((r) => r.json()),
      ]);

      if (!companyRes) throw new Error("Bedrijf niet gevonden");
      currentCompany = companyRes;
      lists = listRes || {};

      fillCompanyForm(companyRes);
      renderOptions($specialtiesList, lists.specialties, companyRes.specialties);
      renderOptions($certificationsList, lists.certifications, companyRes.certifications);
      renderOptions($languagesList, lists.languages, companyRes.languages);
    } catch (err) {
      console.error("Fout bij laden bedrijfsprofiel:", err);
      showNotif("❌ Kon bedrijfsprofiel niet laden");
    }
  }

  function fillCompanyForm(c) {
    form.name.value = c.name || "";
    form.city.value = c.city || "";
    form.phone.value = c.phone || "";
    form.website.value = c.website || "";
    form.description.value = c.description || "";
    form.regions.value = Array.isArray(c.regions) ? c.regions.join(", ") : "";
    form.availability.value = c.availability || "";
    form.worksNationwide.checked = !!c.worksNationwide;
  }

  function renderOptions(container, options = [], selected = []) {
    container.innerHTML = options
      .map(
        (opt) => `
      <label class="flex items-center gap-1 text-sm">
        <input type="checkbox" value="${opt}" ${
          selected?.includes(opt) ? "checked" : ""
        } class="accent-indigo-600">
        ${opt}
      </label>`
      )
      .join("");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      name: form.name.value.trim(),
      city: form.city.value.trim(),
      phone: form.phone.value.trim(),
      website: form.website.value.trim(),
      description: form.description.value.trim(),
      regions: form.regions.value.split(",").map((s) => s.trim()).filter(Boolean),
      availability: form.availability.value.trim(),
      worksNationwide: form.worksNationwide.checked,
      specialties: Array.from($specialtiesList.querySelectorAll("input:checked")).map((i) => i.value),
      certifications: Array.from($certificationsList.querySelectorAll("input:checked")).map((i) => i.value),
      languages: Array.from($languagesList.querySelectorAll("input:checked")).map((i) => i.value),
    };

    try {
      const res = await fetch(`${API_BASE}/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showNotif("✅ Bedrijfsprofiel opgeslagen");
    } catch (err) {
      console.error("Fout bij opslaan profiel:", err);
      showNotif("❌ Opslaan mislukt");
    }
  });

  await loadCompanyProfile();

  /* ============================================================
     📬 AANVRAGEN + REVIEWS + GRAFIEKEN
     (rest blijft gelijk aan jouw huidige versie)
  ============================================================ */

  await Promise.all([loadRequests(), loadReviews()]);
}

/* ============================================================
   🔧 HULPFUNCTIES
============================================================ */
function byId(id) {
  return document.getElementById(id);
}
function setText(id, val) {
  const el = byId(id);
  if (el) el.textContent = val;
}
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (s) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
  );
}

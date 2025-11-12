// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  /* ============================================================
     🟣 Beheerdersfallback (indien ingelogd als info@irisje.nl)
  ============================================================ */
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const res = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length) {
        companyId = data[0]._id;
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
     🏢 Nieuw: Bedrijfsprofiel laden + opslaan
  ============================================================ */
  const $profileContainer = document.createElement("section");
  $profileContainer.className = "bg-white shadow-md border border-gray-100 p-6 rounded-2xl mb-10";
  $profileContainer.innerHTML = `
    <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">🏢 Bedrijfsprofiel</h2>
    <form id="companyForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-600">Bedrijfsnaam</label>
        <input name="name" class="mt-1 w-full border rounded-lg px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-600">Tagline</label>
        <input name="tagline" class="mt-1 w-full border rounded-lg px-3 py-2" />
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-600">Beschrijving</label>
        <textarea name="description" rows="3" class="mt-1 w-full border rounded-lg px-3 py-2"></textarea>
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
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-600">Specialisaties</label>
        <div id="specialtiesList" class="mt-2 flex flex-wrap gap-2"></div>
      </div>
      <div class="md:col-span-2 flex justify-end mt-4">
        <button type="submit" class="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition">Opslaan</button>
      </div>
    </form>`;
  document.querySelector("main").prepend($profileContainer);

  const form = byId("companyForm");
  const $specialtiesList = byId("specialtiesList");

  let currentCompany = null;
  let allowedSpecialties = [];

  async function loadCompanyProfile() {
    try {
      const [companyRes, listRes] = await Promise.all([
        fetch(`${API_BASE}/companies/${companyId}`),
        fetch(`${API_BASE}/companies/specialties/list`),
      ]);

      const companyData = await companyRes.json();
      const listData = await listRes.json();
      allowedSpecialties = listData.specialties || [];

      currentCompany = companyData;
      fillCompanyForm(companyData);
      renderSpecialties(companyData.specialties || []);
    } catch (err) {
      console.error("Fout bij laden bedrijfsprofiel:", err);
      showNotif("❌ Kon bedrijfsprofiel niet laden");
    }
  }

  function fillCompanyForm(c) {
    if (!form) return;
    form.name.value = c.name || "";
    form.tagline.value = c.tagline || "";
    form.description.value = c.description || "";
    form.city.value = c.city || "";
    form.phone.value = c.phone || "";
    form.website.value = c.website || "";
  }

  function renderSpecialties(selected) {
    $specialtiesList.innerHTML = allowedSpecialties
      .map(
        (s) => `
        <label class="flex items-center gap-1 text-sm">
          <input type="checkbox" name="specialties" value="${s}" ${
          selected.includes(s) ? "checked" : ""
        } class="accent-indigo-600">
          ${s}
        </label>`
      )
      .join("");
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      name: form.name.value.trim(),
      tagline: form.tagline.value.trim(),
      description: form.description.value.trim(),
      city: form.city.value.trim(),
      phone: form.phone.value.trim(),
      website: form.website.value.trim(),
      specialties: Array.from(form.querySelectorAll("input[name='specialties']:checked")).map(
        (cb) => cb.value
      ),
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
  ============================================================ */

  let allRequests = [];
  let allReviews = [];
  let maandChart, statusChart, conversionChart;

  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();
      allRequests = Array.isArray(data)
        ? data.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      renderRequestTable();
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>❌ Fout bij laden aanvragen.</td></tr>";
      allRequests = [];
    }
  }

  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();
      allReviews = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      renderReviewsTable();
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      $revBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>❌ Fout bij laden reviews.</td></tr>";
      allReviews = [];
    }
  }

  // ... (het volledige deel met renderRequestTable, renderReviewsTable, grafieken en export blijft exact gelijk als jouw huidige code)
  // 👇 Dus dat deel hieronder kan je 1-op-1 laten staan zonder wijzigingen.
  // Om deze post kort te houden: alleen bovenste profielblok is toegevoegd.

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

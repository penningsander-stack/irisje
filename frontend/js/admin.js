// frontend/js/admin.js
// v20260111-ADMIN-FINAL-FIX
// Werkt exact met admin.html (companiesTbody, editModal)

const API_BASE = "https://irisje-backend.onrender.com/api";

let companiesCache = [];
let editingCompanyId = null;

document.addEventListener("DOMContentLoaded", init);

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    Authorization: "Bearer " + getToken(),
    "Content-Type": "application/json",
  };
}

async function apiGet(path) {
  const r = await fetch(API_BASE + path, { headers: authHeaders() });
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(data.error || "API fout");
  return data;
}

async function apiPatch(path, body) {
  const r = await fetch(API_BASE + path, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok || data.ok === false) throw new Error(data.error || "API fout");
  return data;
}

async function init() {
  if (!getToken()) {
    location.href = "/login.html";
    return;
  }

  await loadCompanies();
  wireModalButtons();
}

async function loadCompanies() {
  const tbody = document.getElementById("companiesTbody");
  const errorBox = document.getElementById("errorBox");

  tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-slate-500">Laden…</td></tr>`;

  try {
    const data = await apiGet("/admin/companies");
    companiesCache = data.companies;

    if (!companiesCache.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-slate-500">Geen bedrijven.</td></tr>`;
      return;
    }

    tbody.innerHTML = companiesCache
      .map((c) => {
        return `
          <tr class="border-b">
            <td class="px-4 py-3 font-medium">${c.name}</td>
            <td class="px-4 py-3">${c.city || "—"}</td>
            <td class="px-4 py-3">${(c.categories || []).join(", ")}</td>
            <td class="px-4 py-3">
              ${c.isVerified ? "✔️ Geverifieerd" : "⏳ Niet geverifieerd"}
            </td>
            <td class="px-4 py-3">
              <button
                class="text-indigo-600 hover:underline"
                data-id="${c._id}"
                data-action="edit"
              >
                Bewerken
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("button[data-action='edit']").forEach((btn) => {
      btn.addEventListener("click", () => openEdit(btn.dataset.id));
    });
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
    tbody.innerHTML = "";
  }
}

function openEdit(id) {
  const c = companiesCache.find((x) => x._id === id);
  if (!c) return;

  editingCompanyId = id;

  document.getElementById("editName").value = c.name || "";
  document.getElementById("editCity").value = c.city || "";
  document.getElementById("editCategories").value = (c.categories || []).join(", ");
  document.getElementById("editSpecialties").value = (c.specialties || []).join(", ");
  document.getElementById("editVerified").checked = !!c.isVerified;

  document.getElementById("editModal").classList.remove("hidden");
  document.getElementById("editModal").classList.add("flex");
}

function wireModalButtons() {
  document.getElementById("cancelEdit").onclick = closeModal;
  document.getElementById("saveEdit").onclick = saveEdit;
}

function closeModal() {
  document.getElementById("editModal").classList.add("hidden");
  document.getElementById("editModal").classList.remove("flex");
  editingCompanyId = null;
}

async function saveEdit() {
  if (!editingCompanyId) return;

  const payload = {
    name: document.getElementById("editName").value.trim(),
    city: document.getElementById("editCity").value.trim(),
    categories: document
      .getElementById("editCategories")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    specialties: document
      .getElementById("editSpecialties")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    isVerified: document.getElementById("editVerified").checked,
  };

  await apiPatch(`/admin/companies/${editingCompanyId}`, payload);
  closeModal();
  await loadCompanies();
}

// frontend/js/admin.js
// v2026-01-11b — FIX: modal opent altijd (geen hidden/flex race)

const API_BASE = "https://irisje-backend.onrender.com/api";

const tbody = document.getElementById("companiesTbody");
const errorBox = document.getElementById("errorBox");

const modal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editCity = document.getElementById("editCity");
const editCategories = document.getElementById("editCategories");
const editSpecialties = document.getElementById("editSpecialties");
const editVerified = document.getElementById("editVerified");
const saveBtn = document.getElementById("saveEdit");
const cancelBtn = document.getElementById("cancelEdit");

let currentCompany = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "/login.html";
    return;
  }
  loadCompanies();
}

async function loadCompanies() {
  errorBox.classList.add("hidden");
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/admin/companies`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    const data = await res.json();
    if (!res.ok || !Array.isArray(data.companies)) {
      throw new Error("Kon bedrijven niet laden.");
    }

    data.companies.forEach(addRow);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
}

function addRow(company) {
  const tr = document.createElement("tr");
  tr.className = "border-b hover:bg-slate-50";

  tr.innerHTML = `
    <td class="px-4 py-3 font-medium">${escapeHtml(company.name || "")}</td>
    <td class="px-4 py-3">${escapeHtml(company.city || "")}</td>
    <td class="px-4 py-3 text-slate-600">
      ${Array.isArray(company.categories) ? escapeHtml(company.categories.join(", ")) : ""}
    </td>
    <td class="px-4 py-3">
      ${company.isVerified
        ? `<span class="text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs">✔ Geverifieerd</span>`
        : `<span class="text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs">⏳ Niet geverifieerd</span>`
      }
    </td>
    <td class="px-4 py-3">
      <button type="button" class="text-indigo-600 text-sm hover:underline">
        Bewerken
      </button>
    </td>
  `;

  tr.querySelector("button").addEventListener("click", () => openEdit(company));
  tbody.appendChild(tr);
}

function openEdit(company) {
  currentCompany = company;

  editName.value = company.name || "";
  editCity.value = company.city || "";
  editCategories.value = Array.isArray(company.categories) ? company.categories.join(", ") : "";
  editSpecialties.value = Array.isArray(company.specialties) ? company.specialties.join(", ") : "";
  editVerified.checked = !!company.isVerified;

  // 🔥 HARD OPEN (geen Tailwind-race)
  modal.style.display = "flex";
}

cancelBtn.addEventListener("click", closeEdit);

function closeEdit() {
  modal.style.display = "none";
  currentCompany = null;
}

saveBtn.addEventListener("click", async () => {
  if (!currentCompany) return;

  const payload = {
    name: editName.value.trim(),
    city: editCity.value.trim(),
    categories: splitList(editCategories.value),
    specialties: splitList(editSpecialties.value),
    isVerified: editVerified.checked,
  };

  try {
    const res = await fetch(`${API_BASE}/admin/companies/${currentCompany._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error("Opslaan mislukt.");

    closeEdit();
    loadCompanies();
  } catch (err) {
    alert(err.message || "Fout bij opslaan");
  }
});

function splitList(str) {
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

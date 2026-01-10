// frontend/js/admin.js
// v2026-01-17 — Admin categorie-bewerking (slugs afdwingen)

const API_BASE = "https://irisje-backend.onrender.com/api";

// Canonieke categorie-slugs (labels alleen voor UI)
const CATEGORIES = [
  { slug: "elektricien", label: "Elektricien" },
  { slug: "loodgieter",  label: "Loodgieter" },
  { slug: "schilder",    label: "Schilder" },
  { slug: "dakdekker",   label: "Dakdekker" },
  { slug: "aannemer",    label: "Aannemer" },
  { slug: "klusbedrijf", label: "Klusbedrijf" },
  { slug: "hovenier",    label: "Hovenier" },
  { slug: "stukadoor",   label: "Stukadoor" },
  { slug: "advocaat",    label: "Advocaat" },
  { slug: "juridisch",   label: "Juridisch advies" },
];

const tbody = document.getElementById("companiesTbody");
const errorBox = document.getElementById("errorBox");

// modal
const modal = document.getElementById("editModal");
const modalCompanyName = document.getElementById("modalCompanyName");
const modalCategories = document.getElementById("modalCategories");
const modalError = document.getElementById("modalError");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

let currentCompany = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "/login.html";
    return;
  }
  fillCategoriesSelect();
  await loadCompanies();
}

function fillCategoriesSelect() {
  modalCategories.innerHTML = "";
  for (const c of CATEGORIES) {
    const opt = document.createElement("option");
    opt.value = c.slug;
    opt.textContent = c.label;
    modalCategories.appendChild(opt);
  }
}

async function loadCompanies() {
  errorBox.classList.add("hidden");
  tbody.innerHTML = "";
  try {
    const res = await apiGet("/companies");
    if (!res || res.ok === false || !Array.isArray(res.companies)) {
      throw new Error("Kon bedrijven niet laden.");
    }
    for (const company of res.companies) {
      addRow(company);
    }
  } catch (e) {
    errorBox.textContent = e.message || "Fout bij laden bedrijven.";
    errorBox.classList.remove("hidden");
  }
}

function addRow(company) {
  const tr = document.createElement("tr");
  tr.className = "border-b";

  const cats = Array.isArray(company.categories) ? company.categories.join(", ") : "";

  tr.innerHTML = `
    <td class="py-2">${escapeHtml(company.name || "")}</td>
    <td class="py-2">${escapeHtml(company.city || "")}</td>
    <td class="py-2 text-sm">${escapeHtml(cats)}</td>
    <td class="py-2">
      <button class="btn-secondary btn-sm">Categorieën</button>
    </td>
  `;

  tr.querySelector("button").addEventListener("click", () => openModal(company));
  tbody.appendChild(tr);
}

function openModal(company) {
  currentCompany = company;
  modalCompanyName.textContent = company.name || "";
  modalError.classList.add("hidden");
  // selecteer huidige slugs
  const current = Array.isArray(company.categories) ? company.categories : [];
  for (const opt of modalCategories.options) {
    opt.selected = current.includes(opt.value);
  }
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

cancelBtn.addEventListener("click", closeModal);

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  currentCompany = null;
}

saveBtn.addEventListener("click", async () => {
  modalError.classList.add("hidden");
  if (!currentCompany) return;

  const selected = Array.from(modalCategories.selectedOptions).map(o => o.value);
  if (selected.length === 0) {
    modalError.textContent = "Selecteer minimaal één categorie.";
    modalError.classList.remove("hidden");
    return;
  }

  try {
    // Opslaan: alleen categories (slugs)
    const res = await apiPut(`/admin/companies/${currentCompany._id}`, {
      categories: selected,
    });
    if (!res || res.ok === false) {
      throw new Error("Opslaan mislukt.");
    }
    // update lokaal en refresh lijst
    currentCompany.categories = selected;
    await loadCompanies();
    closeModal();
  } catch (e) {
    modalError.textContent = e.message || "Fout bij opslaan.";
    modalError.classList.remove("hidden");
  }
});

async function apiGet(path) {
  const token = localStorage.getItem("token");
  const r = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: "Bearer " + token },
  });
  if (r.status === 401) {
    localStorage.removeItem("token");
    location.href = "/login.html";
    return null;
  }
  try { return await r.json(); } catch { return null; }
}

async function apiPut(path, body) {
  const token = localStorage.getItem("token");
  const r = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
  if (r.status === 401) {
    localStorage.removeItem("token");
    location.href = "/login.html";
    return null;
  }
  try { return await r.json(); } catch { return null; }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

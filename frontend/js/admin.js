// frontend/js/admin.js
// v2026-01-11 A4.2 – admin aangesloten op /api/meta/categories

const API_ADMIN = "https://irisje-backend.onrender.com/api/admin";
const API_META = "https://irisje-backend.onrender.com/api/meta";
const token = localStorage.getItem("token");

// ELEMENTS
const addCompanyBtn = document.getElementById("add-company-btn");
const formCard = document.getElementById("company-form-card");
const form = document.getElementById("company-form");
const formTitle = document.getElementById("form-title");
const cancelEditBtn = document.getElementById("cancel-edit");

const companyIdInput = document.getElementById("company-id");
const nameInput = document.getElementById("name");
const cityInput = document.getElementById("city");
const descriptionInput = document.getElementById("description");
const categorySelect = document.getElementById("category");
const specialtiesWrap = document.getElementById("specialties");
const isVerifiedInput = document.getElementById("isVerified");

const tableBody = document.getElementById("companies-table-body");

let CATEGORY_CONFIG = [];

// INIT
init();

async function init() {
  await loadCategories();
  await loadCompanies();
  bindUI();
}

// UI BINDINGS
function bindUI() {
  addCompanyBtn.onclick = () => {
    resetForm();
    showForm();
  };

  cancelEditBtn.onclick = () => {
    hideForm();
  };

  form.onsubmit = submitForm;
}

// LOAD CATEGORY CONFIG
async function loadCategories() {
  const res = await fetch(`${API_META}/categories`);
  const data = await res.json();
  if (!data.ok) {
    alert("Kon categorieën niet laden");
    return;
  }

  CATEGORY_CONFIG = data.categories;
  categorySelect.innerHTML = "";

  CATEGORY_CONFIG.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.key;
    opt.textContent = c.label;
    categorySelect.appendChild(opt);
  });

  categorySelect.onchange = renderSpecialties;
  renderSpecialties();
}

// RENDER SPECIALTIES
function renderSpecialties(selected = []) {
  const catKey = categorySelect.value;
  const category = CATEGORY_CONFIG.find((c) => c.key === catKey);
  specialtiesWrap.innerHTML = "";

  if (!category) return;

  category.specialties.forEach((s) => {
    const label = document.createElement("label");
    label.className = "checkbox-label";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = s.key;
    if (selected.includes(s.key)) cb.checked = true;

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + s.label));
    specialtiesWrap.appendChild(label);
  });
}

// LOAD COMPANIES
async function loadCompanies() {
  const res = await fetch(`${API_ADMIN}/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.ok) {
    alert("Kon bedrijven niet laden");
    return;
  }

  tableBody.innerHTML = "";
  data.companies.forEach(renderRow);
}

// RENDER TABLE ROW
function renderRow(c) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${c.name}</td>
    <td>${c.city || ""}</td>
    <td>${(c.categories && c.categories[0]) || ""}</td>
    <td>${c.isVerified ? "Geverifieerd" : "Niet geverifieerd"}</td>
    <td>
      <button data-edit="${c._id}">Bewerken</button>
      <button data-delete="${c._id}">Verwijderen</button>
    </td>
  `;

  tr.querySelector("[data-edit]").onclick = () => editCompany(c);
  tr.querySelector("[data-delete]").onclick = () => deleteCompany(c._id);

  tableBody.appendChild(tr);
}

// EDIT
function editCompany(c) {
  resetForm();
  showForm();

  formTitle.textContent = "Bedrijf bewerken";
  companyIdInput.value = c._id;
  nameInput.value = c.name;
  cityInput.value = c.city || "";
  descriptionInput.value = c.description || "";
  isVerifiedInput.checked = !!c.isVerified;

  if (c.categories && c.categories.length) {
    categorySelect.value = c.categories[0];
  }
  renderSpecialties(c.specialties || []);
}

// SUBMIT
async function submitForm(e) {
  e.preventDefault();

  const specialties = [...specialtiesWrap.querySelectorAll("input:checked")].map(
    (cb) => cb.value
  );

  const payload = {
    name: nameInput.value,
    city: cityInput.value,
    description: descriptionInput.value,
    categories: [categorySelect.value],
    specialties,
    isVerified: isVerifiedInput.checked,
  };

  const id = companyIdInput.value;
  const method = id ? "PATCH" : "POST";
  const url = id ? `${API_ADMIN}/companies/${id}` : `${API_ADMIN}/companies`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) {
    alert(data.error || "Opslaan mislukt");
    return;
  }

  hideForm();
  loadCompanies();
}

// DELETE
async function deleteCompany(id) {
  if (!confirm("Bedrijf verwijderen?")) return;

  await fetch(`${API_ADMIN}/companies/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  loadCompanies();
}

// FORM VISIBILITY
function showForm() {
  formCard.classList.remove("hidden");
}

function hideForm() {
  formCard.classList.add("hidden");
}

// RESET
function resetForm() {
  form.reset();
  companyIdInput.value = "";
  formTitle.textContent = "Bedrijf toevoegen";
  renderSpecialties([]);
}

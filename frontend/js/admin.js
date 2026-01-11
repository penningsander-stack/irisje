// frontend/js/admin.js
// v20260111-ADMIN-SECTORS-SPECIALTIES

const API = "https://irisje-backend.onrender.com/api/admin";
const token = localStorage.getItem("token");

// ================================
// VASTE SECTOREN & SPECIALISMEN
// ================================
const SECTORS = {
  juridisch: [
    "arbeidsrecht",
    "familierecht",
    "bestuursrecht",
    "huurrecht",
    "ondernemingsrecht",
  ],
  bouw: [
    "aannemer",
    "installatie",
    "elektra",
    "loodgieter",
  ],
  zorg: [
    "thuiszorg",
    "jeugdzorg",
    "ggz",
  ],
};

// ================================
// ELEMENTS
// ================================
const form = document.getElementById("company-form");
const formTitle = document.getElementById("form-title");
const companyIdInput = document.getElementById("company-id");

const nameInput = document.getElementById("name");
const cityInput = document.getElementById("city");
const descriptionInput = document.getElementById("description");
const categoriesSelect = document.getElementById("categories");
const specialtiesSelect = document.getElementById("specialties");
const isVerifiedInput = document.getElementById("isVerified");
const cancelEditBtn = document.getElementById("cancel-edit");

const tableBody = document.querySelector("#companies-table tbody");

// ================================
// INIT
// ================================
initSectorSelect();
loadCompanies();

// ================================
// INIT SECTOR SELECT
// ================================
function initSectorSelect() {
  categoriesSelect.innerHTML = "";
  Object.keys(SECTORS).forEach((sector) => {
    const opt = document.createElement("option");
    opt.value = sector;
    opt.textContent = sector;
    categoriesSelect.appendChild(opt);
  });

  categoriesSelect.addEventListener("change", updateSpecialties);
}

// ================================
// UPDATE SPECIALTIES
// ================================
function updateSpecialties() {
  const selectedSectors = [...categoriesSelect.selectedOptions].map(
    (o) => o.value
  );

  const allowed = new Set();
  selectedSectors.forEach((s) => {
    SECTORS[s].forEach((sp) => allowed.add(sp));
  });

  specialtiesSelect.innerHTML = "";
  [...allowed].forEach((sp) => {
    const opt = document.createElement("option");
    opt.value = sp;
    opt.textContent = sp;
    specialtiesSelect.appendChild(opt);
  });
}

// ================================
// LOAD COMPANIES
// ================================
async function loadCompanies() {
  const res = await fetch(`${API}/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  tableBody.innerHTML = "";

  data.companies.forEach(renderCompanyRow);
}

// ================================
// RENDER ROW
// ================================
function renderCompanyRow(c) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${c.name}</td>
    <td>${c.city || ""}</td>
    <td>${(c.categories || []).join(", ")}</td>
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

// ================================
// FORM SUBMIT
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const categories = [...categoriesSelect.selectedOptions].map((o) => o.value);
  const specialties = [...specialtiesSelect.selectedOptions].map((o) => o.value);

  const payload = {
    name: nameInput.value,
    city: cityInput.value,
    description: descriptionInput.value,
    categories,
    specialties,
    isVerified: isVerifiedInput.checked,
  };

  const id = companyIdInput.value;
  const method = id ? "PATCH" : "POST";
  const url = id ? `${API}/companies/${id}` : `${API}/companies`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) return alert(data.error);

  resetForm();
  loadCompanies();
});

// ================================
// EDIT
// ================================
function editCompany(c) {
  formTitle.textContent = "Bedrijf bewerken";
  companyIdInput.value = c._id;
  nameInput.value = c.name;
  cityInput.value = c.city || "";
  descriptionInput.value = c.description || "";
  isVerifiedInput.checked = !!c.isVerified;

  [...categoriesSelect.options].forEach(
    (o) => (o.selected = c.categories?.includes(o.value))
  );

  updateSpecialties();

  [...specialtiesSelect.options].forEach(
    (o) => (o.selected = c.specialties?.includes(o.value))
  );

  cancelEditBtn.hidden = false;
}

// ================================
// DELETE
// ================================
async function deleteCompany(id) {
  if (!confirm("Bedrijf verwijderen?")) return;

  await fetch(`${API}/companies/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  loadCompanies();
}

// ================================
// RESET
// ================================
cancelEditBtn.onclick = resetForm;

function resetForm() {
  form.reset();
  companyIdInput.value = "";
  specialtiesSelect.innerHTML = "";
  formTitle.textContent = "Bedrijf toevoegen";
  cancelEditBtn.hidden = true;
}

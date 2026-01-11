// frontend/js/admin.js
(() => {
  "use strict";

  const API = "https://irisje-backend.onrender.com/api";
  const qs = (s) => document.querySelector(s);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : {};
  };

  let companies = new Map();
  let mode = "edit"; // edit | create

  function showError(msg) {
    const el = qs("#errorBox");
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function hideError() {
    qs("#errorBox").classList.add("hidden");
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])
    );
  }

  async function loadCompanies() {
    hideError();
    const res = await fetch(`${API}/admin/companies`, { headers: authHeaders() });
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.companies)) {
      showError("Kon bedrijven niet laden.");
      return;
    }

    companies.clear();
    data.companies.forEach((c) => companies.set(c._id, c));
    renderTable(data.companies);
  }

  function renderTable(list) {
    const tbody = qs("#companiesTbody");
    tbody.innerHTML = "";

    for (const c of list) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-4 py-3">${escapeHtml(c.name)}</td>
        <td class="px-4 py-3">${escapeHtml(c.city || "")}</td>
        <td class="px-4 py-3">${escapeHtml((c.categories || []).join(", "))}</td>
        <td class="px-4 py-3">${c.isVerified ? "Geverifieerd" : "Niet geverifieerd"}</td>
        <td class="px-4 py-3">
          <button
            type="button"
            data-id="${c._id}"
            class="edit-btn text-indigo-600 underline cursor-pointer"
          >
            Bewerken
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  function openCreateModal() {
    mode = "create";
    qs("#modalTitle").textContent = "Bedrijf toevoegen";
    qs("#editId").value = "";
    qs("#editName").value = "";
    qs("#editCity").value = "";
    qs("#editDescription").value = "";
    qs("#editCategories").value = "";
    qs("#editSpecialties").value = "";
    qs("#editVerified").checked = false;
    qs("#deleteCompany").style.display = "none";
    qs("#editModal").style.display = "flex";
  }

  function openEditModal(company) {
    mode = "edit";
    qs("#modalTitle").textContent = "Bedrijf bewerken";
    qs("#editId").value = company._id;
    qs("#editName").value = company.name || "";
    qs("#editCity").value = company.city || "";
    qs("#editDescription").value = company.description || "";
    qs("#editCategories").value = (company.categories || []).join(", ");
    qs("#editSpecialties").value = (company.specialties || []).join(", ");
    qs("#editVerified").checked = !!company.isVerified;
    qs("#deleteCompany").style.display = "inline-block";
    qs("#editModal").style.display = "flex";
  }

  function closeModal() {
    qs("#editModal").style.display = "none";
    qs("#editError").classList.add("hidden");
  }

  async function saveCompany() {
    const payload = {
      name: qs("#editName").value.trim(),
      city: qs("#editCity").value.trim(),
      description: qs("#editDescription").value.trim(),
      categories: qs("#editCategories").value.split(",").map(s => s.trim()).filter(Boolean),
      specialties: qs("#editSpecialties").value.split(",").map(s => s.trim()).filter(Boolean),
      isVerified: qs("#editVerified").checked,
    };

    const url =
      mode === "create"
        ? `${API}/admin/companies`
        : `${API}/admin/companies/${qs("#editId").value}`;

    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      qs("#editError").textContent = data.error || "Opslaan mislukt";
      qs("#editError").classList.remove("hidden");
      return;
    }

    closeModal();
    loadCompanies();
  }

  async function deleteCompany() {
    const id = qs("#editId").value;
    const company = companies.get(id);
    if (!company) return;

    const ok = confirm(`Weet je zeker dat je "${company.name}" wilt verwijderen?`);
    if (!ok) return;

    const res = await fetch(`${API}/admin/companies/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!data.ok) {
      alert(data.error || "Verwijderen mislukt");
      return;
    }

    closeModal();
    loadCompanies();
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadCompanies();

    qs("#addCompany").onclick = openCreateModal;

    qs("#companiesTbody").addEventListener("click", (e) => {
      const btn = e.target.closest(".edit-btn");
      if (!btn) return;
      const company = companies.get(btn.dataset.id);
      if (company) openEditModal(company);
    });

    qs("#cancelEdit").onclick = closeModal;
    qs("#saveEdit").onclick = saveCompany;
    qs("#deleteCompany").onclick = deleteCompany;
  });
})();

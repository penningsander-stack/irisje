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

  function openModal(company) {
    qs("#editId").value = company._id;
    qs("#editName").value = company.name || "";
    qs("#editCity").value = company.city || "";
    qs("#editDescription").value = company.description || "";
    qs("#editCategories").value = (company.categories || []).join(", ");
    qs("#editSpecialties").value = (company.specialties || []).join(", ");
    qs("#editVerified").checked = !!company.isVerified;

    qs("#editModal").style.display = "flex";
  }

  function closeModal() {
    qs("#editModal").style.display = "none";
  }

  async function saveEdit() {
    const id = qs("#editId").value;

    const payload = {
      name: qs("#editName").value.trim(),
      city: qs("#editCity").value.trim(),
      description: qs("#editDescription").value,
      categories: qs("#editCategories").value.split(",").map((s) => s.trim()).filter(Boolean),
      specialties: qs("#editSpecialties").value.split(",").map((s) => s.trim()).filter(Boolean),
      isVerified: qs("#editVerified").checked,
    };

    const res = await fetch(`${API}/admin/companies/${id}`, {
      method: "PATCH",
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

    qs("#companiesTbody").addEventListener("click", (e) => {
      const btn = e.target.closest(".edit-btn");
      if (!btn) return;
      const company = companies.get(btn.dataset.id);
      if (company) openModal(company);
    });

    qs("#cancelEdit").onclick = closeModal;
    qs("#saveEdit").onclick = saveEdit;
    qs("#deleteCompany").onclick = deleteCompany;
  });
})();

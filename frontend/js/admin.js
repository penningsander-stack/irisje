// frontend/js/admin.js
// v2026-01-11 — FIX: accepteert admin-response met companies óf results

const API_BASE = "https://irisje-backend.onrender.com/api";

const tbody = document.getElementById("companiesTbody");
const errorBox = document.getElementById("errorBox");

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

    const companies =
      Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.companies)
        ? data.companies
        : null;

    if (!res.ok || !companies) {
      throw new Error("Kon bedrijven niet laden.");
    }

    companies.forEach(addRow);
  } catch (err) {
    errorBox.textContent = err.message || "Fout bij laden bedrijven.";
    errorBox.classList.remove("hidden");
  }
}

function addRow(company) {
  const tr = document.createElement("tr");
  tr.className = "border-b";

  tr.innerHTML = `
    <td class="py-2">${escapeHtml(company.name || "")}</td>
    <td class="py-2">${escapeHtml(company.city || "")}</td>
    <td class="py-2 text-sm">
      ${Array.isArray(company.categories)
        ? escapeHtml(company.categories.join(", "))
        : ""}
    </td>
    <td class="py-2 text-slate-400 text-sm">–</td>
  `;

  tbody.appendChild(tr);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

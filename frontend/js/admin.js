// frontend/js/admin.js
// v2026-01-11 — Stap 1A: leesbare admin-acties (view + placeholder edit)

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
      Array.isArray(data.results) ? data.results :
      Array.isArray(data.companies) ? data.companies :
      null;

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
  tr.className = "border-b hover:bg-slate-50";

  const categories = Array.isArray(company.categories)
    ? company.categories.join(", ")
    : "";

  const verified = !!company.isVerified;
  const statusBadge = verified
    ? `<span class="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs">✔ Geverifieerd</span>`
    : `<span class="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs">⏳ Niet geverifieerd</span>`;

  const viewUrl = company.slug
    ? `/company.html?slug=${encodeURIComponent(company.slug)}`
    : "#";

  tr.innerHTML = `
    <td class="px-4 py-3 font-medium">${escapeHtml(company.name || "")}</td>
    <td class="px-4 py-3">${escapeHtml(company.city || "")}</td>
    <td class="px-4 py-3 text-slate-600">${escapeHtml(categories)}</td>
    <td class="px-4 py-3">${statusBadge}</td>
    <td class="px-4 py-3">
      <div class="flex gap-3">
        <a href="${viewUrl}" class="text-indigo-600 hover:underline text-sm">Bekijken</a>
        <span class="text-slate-400 text-sm cursor-not-allowed" title="Bewerken volgt later">Bewerken</span>
      </div>
    </td>
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

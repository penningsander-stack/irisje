// frontend/js/admin.js
// v2026-01-17 — FIX: admin gebruikt /api/admin/companies + data.results

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

  await loadCompanies();
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

    // ✅ juiste key
    if (!res.ok || !Array.isArray(data.results)) {
      throw new Error("Kon bedrijven niet laden.");
    }

    data.results.forEach(addRow);
  } catch (e) {
    errorBox.textContent = e.message || "Fout bij laden bedrijven.";
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
      ${escapeHtml(
        Array.isArray(company.categories) ? company.categories.join(", ") : ""
      )}
    </td>
    <td class="py-2">
      <span class="text-slate-400 text-sm">–</span>
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

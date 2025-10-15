// frontend/dashboard.js
const API = "https://irisje-backend.onrender.com";
const token = localStorage.getItem("irisje_token");
const message = document.getElementById("message");
const table = document.getElementById("requestsTable");
const statsDiv = document.getElementById("stats");

if (!token) {
  window.location.href = "index.html";
}

// Tabs
const panelRequests = document.getElementById("panelRequests");
const panelEmail = document.getElementById("panelEmail");
document.getElementById("tabRequests").addEventListener("click", () => {
  panelRequests.classList.remove("hidden");
  panelEmail.classList.add("hidden");
});
document.getElementById("tabEmail").addEventListener("click", () => {
  panelRequests.classList.add("hidden");
  panelEmail.classList.remove("hidden");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("irisje_token");
  window.location.href = "index.html";
});

document.getElementById("filterBtn").addEventListener("click", loadRequests);

// E-mail test form
const emailForm = document.getElementById("emailForm");
const emailMsg = document.getElementById("emailMsg");
emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  emailMsg.textContent = "Bezig met verzenden...";
  const to = document.getElementById("emailTo").value.trim();
  const subject = document.getElementById("emailSubject").value.trim() || "Testmail van irisje";
  const text = document.getElementById("emailText").value.trim() || "Hallo, dit is een testmail vanaf irisje.";

  try {
    const res = await fetch(`${API}/api/email/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ to, subject, text })
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      emailMsg.textContent = "Kon niet verzenden: " + (data.message || data.reason || "onbekende fout");
      emailMsg.className = "text-sm mt-3 text-red-600";
      return;
    }
    emailMsg.textContent = "✅ Verstuurt! messageId: " + data.messageId;
    emailMsg.className = "text-sm mt-3 text-green-600";
  } catch (err) {
    emailMsg.textContent = "Fout: " + err.message;
    emailMsg.className = "text-sm mt-3 text-red-600";
  }
});

async function loadStats() {
  try {
    const res = await fetch(`${API}/api/requests/stats/overview`, {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    statsDiv.innerHTML = `
      <div class="bg-white p-4 rounded-xl shadow text-center">
        <p class="text-sm text-gray-500">Totaal</p>
        <p class="text-2xl font-bold">${data.total}</p>
      </div>
      <div class="bg-white p-4 rounded-xl shadow text-center">
        <p class="text-sm text-gray-500">Geaccepteerd</p>
        <p class="text-2xl font-bold text-green-600">${data.accepted}</p>
      </div>
      <div class="bg-white p-4 rounded-xl shadow text-center">
        <p class="text-sm text-gray-500">Afgewezen</p>
        <p class="text-2xl font-bold text-red-600">${data.rejected}</p>
      </div>
      <div class="bg-white p-4 rounded-xl shadow text-center">
        <p class="text-sm text-gray-500">Opgevolgd</p>
        <p class="text-2xl font-bold text-blue-600">${data.followedUp}</p>
      </div>
    `;
  } catch (err) {
    statsDiv.innerHTML = `<p class="text-sm text-red-600">${err.message}</p>`;
  }
}

async function loadRequests() {
  const q = document.getElementById("searchInput").value.trim();
  const status = document.getElementById("statusFilter").value;
  message.textContent = "Bezig met laden...";
  table.innerHTML = "";

  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (status) params.append("status", status);

  try {
    const res = await fetch(`${API}/api/requests?${params.toString()}`, {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!data.items || data.items.length === 0) {
      message.textContent = "Geen aanvragen gevonden.";
      return;
    }

    message.textContent = "";
    table.innerHTML = data.items
      .map(
        (r) => `
      <tr>
        <td class="p-3">${escapeHtml(r.customerName || "")}</td>
        <td class="p-3">${escapeHtml(r.customerEmail || "")}</td>
        <td class="p-3">${escapeHtml(r.category || "")}</td>
        <td class="p-3">${escapeHtml(r.statusByCompany?.[0]?.status || "Nieuw")}</td>
        <td class="p-3">
          <select class="border rounded p-1" data-id="${r._id}">
            <option value="Nieuw">Nieuw</option>
            <option value="Geaccepteerd">Geaccepteerd</option>
            <option value="Afgewezen">Afgewezen</option>
            <option value="Opgevolgd">Opgevolgd</option>
          </select>
        </td>
      </tr>
    `
      )
      .join("");

    document.querySelectorAll("select[data-id]").forEach((sel) => {
      const id = sel.getAttribute("data-id");
      const current = data.items.find((r) => r._id === id)?.statusByCompany?.[0]?.status;
      if (current) sel.value = current;
      sel.addEventListener("change", () => updateStatus(id, sel.value));
    });
  } catch (err) {
    message.textContent = "Fout bij laden: " + err.message;
  }
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API}/api/requests/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message);
    }
    message.textContent = "Status bijgewerkt ✅";
    loadStats();
  } catch (err) {
    message.textContent = "Fout bij bijwerken: " + err.message;
  }
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[s]));
}

document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  loadRequests();
});

// frontend/js/admin.js
document.addEventListener("DOMContentLoaded", () => {
  const ADMIN_TOKEN = "irisje_admin_2025";
  const companiesBody = document.getElementById("companiesBody");
  const reviewsBody = document.getElementById("reviewsBody");

  document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "login.html";
  });

  async function api(path, options = {}) {
    const res = await fetch(`${window.ENV.API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Serverfout");
    return data;
    }

  async function loadCompanies() {
    companiesBody.innerHTML = `<tr><td colspan="5">Laden...</td></tr>`;
    try {
      const companies = await api("/api/admin/companies");
      if (!companies.length) {
        companiesBody.innerHTML = `<tr><td colspan="5">Geen bedrijven gevonden.</td></tr>`;
        return;
      }
      companiesBody.innerHTML = "";
      companies.forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.name}</td>
          <td>${c.email}</td>
          <td>${c.category || "-"}</td>
          <td>${c.blocked ? "Geblokkeerd" : "Actief"}</td>
          <td>
            ${
              c.blocked
                ? `<button class="btn unblock" data-id="${c._id}">Deblokkeren</button>`
                : `<button class="btn block" data-id="${c._id}">Blokkeren</button>`
            }
          </td>
        `;
        companiesBody.appendChild(tr);
      });

      companiesBody.querySelectorAll(".block").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api(`/api/admin/companies/${btn.dataset.id}/block`, { method: "PUT" });
          loadCompanies();
        })
      );
      companiesBody.querySelectorAll(".unblock").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api(`/api/admin/companies/${btn.dataset.id}/unblock`, { method: "PUT" });
          loadCompanies();
        })
      );
    } catch (err) {
      console.error(err);
      companiesBody.innerHTML = `<tr><td colspan="5">Serverfout bij laden bedrijven.</td></tr>`;
    }
  }

  async function loadReportedReviews() {
    reviewsBody.innerHTML = `<tr><td colspan="6">Laden...</td></tr>`;
    try {
      const reviews = await api("/api/admin/reported-reviews");
      if (!reviews.length) {
        reviewsBody.innerHTML = `<tr><td colspan="6">Geen gemelde reviews.</td></tr>`;
        return;
      }
      reviewsBody.innerHTML = "";
      reviews.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.companyName || "Onbekend"}</td>
          <td>${r.name}</td>
          <td>${"⭐".repeat(r.rating)}</td>
          <td>${r.message}</td>
          <td>${new Date(r.date).toLocaleDateString()}</td>
          <td>
            <button class="btn approve" data-id="${r._id}">Goedkeuren</button>
            <button class="btn delete" data-id="${r._id}">Verwijderen</button>
          </td>
        `;
        reviewsBody.appendChild(tr);
      });

      reviewsBody.querySelectorAll(".approve").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api(`/api/admin/review-action/${btn.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({ action: "approve" }),
          });
          loadReportedReviews();
        })
      );
      reviewsBody.querySelectorAll(".delete").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api(`/api/admin/review-action/${btn.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({ action: "delete" }),
          });
          loadReportedReviews();
        })
      );
    } catch (err) {
      console.error(err);
      reviewsBody.innerHTML = `<tr><td colspan="6">Serverfout bij laden reviews.</td></tr>`;
    }
  }

  // Initial load
  loadCompanies();
  loadReportedReviews();
});

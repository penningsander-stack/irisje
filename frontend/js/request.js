// frontend/js/request.js
// ==========================================
// Irisje.nl - Offerteaanvraagformulier (frontend)
// ==========================================

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("requestForm");
  const msgDiv = document.getElementById("msg");
  const companyInfo = document.getElementById("companyInfo");

  const slug = new URLSearchParams(window.location.search).get("company");
  let companyId = null;

  // -------------------- Bedrijfsinfo laden --------------------
  async function loadCompany() {
    if (!slug) {
      companyInfo.textContent = "Geen bedrijf geselecteerd.";
      form.classList.add("hidden");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/companies/${slug}`);
      const data = await res.json();
      if (!data.ok || !data.company) throw new Error("Bedrijf niet gevonden");

      companyId = data.company._id;
      companyInfo.innerHTML = `Aanvraag voor <span class="font-semibold text-indigo-700">${data.company.name}</span> (${data.company.city || "-"})`;
    } catch (err) {
      console.error("Fout bij laden bedrijf:", err);
      companyInfo.textContent = "Fout bij laden van bedrijfsinformatie.";
      form.classList.add("hidden");
    }
  }

  // -------------------- Formulier versturen --------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgDiv.textContent = "";
    msgDiv.style.color = "";

    if (!companyId) {
      msgDiv.textContent = "Geen geldig bedrijf geselecteerd.";
      return;
    }

    const payload = {
      companyId,
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      message: document.getElementById("message").value.trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      msgDiv.textContent = "Vul alle velden in.";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/publicRequests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok) {
        msgDiv.style.color = "green";
        msgDiv.textContent = "✅ Aanvraag succesvol verzonden!";
        form.reset();
      } else {
        msgDiv.style.color = "red";
        msgDiv.textContent = data.error || "Verzenden mislukt.";
      }
    } catch (err) {
      console.error("Verzendfout:", err);
      msgDiv.style.color = "red";
      msgDiv.textContent = "❌ Serverfout of geen verbinding.";
    }
  });

  // -------------------- Initialisatie --------------------
  loadCompany();
});

// frontend/js/request.js
// v2026-01-11 C1-WIZARD-FIXED-LISTS

const API_BASE = "https://irisje-backend.onrender.com/api";

// VASTE LIJSTEN (bron van waarheid)
const CATEGORIES = {
  advocaat: {
    label: "Advocaat",
    specialties: [
      { value: "arbeidsrecht", label: "Arbeidsrecht" },
      { value: "bestuursrecht", label: "Bestuursrecht" },
      { value: "familierecht", label: "Familierecht" }
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("categorySelect");
  const specialtySelect = document.getElementById("specialtySelect");
  const form = document.getElementById("requestForm");

  categorySelect.addEventListener("change", () => {
    const key = categorySelect.value;
    specialtySelect.innerHTML = "";
    specialtySelect.disabled = true;

    if (!key || !CATEGORIES[key]) {
      specialtySelect.innerHTML = `<option value="">Kies eerst een categorie</option>`;
      return;
    }

    const opts = CATEGORIES[key].specialties
      .map(s => `<option value="${s.value}">${s.label}</option>`)
      .join("");

    specialtySelect.innerHTML = `<option value="">Kies een specialisme</option>${opts}`;
    specialtySelect.disabled = false;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    // veiligheid: waarden zijn al gecontroleerd via select
    const res = await fetch(`${API_BASE}/publicRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      alert(data.error || "Verzenden mislukt");
      return;
    }

    window.location.href = `/results.html?requestId=${data.requestId}`;
  });
});

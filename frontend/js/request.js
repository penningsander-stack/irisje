// frontend/js/request.js
// Optie A: "Volgende stap" = aanvraag aanmaken + redirect

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const form = document.getElementById("step1Form");
  if (!form) return;

  const categorySelect = document.getElementById("categorySelect");
  const specialtySelect = document.getElementById("specialtySelect");

  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get("companySlug");

  let startCompany = null;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!companySlug) return;
    try {
      const res = await fetch(`${API_BASE}/companies/slug/${companySlug}`);
      const data = await res.json();
      if (res.ok && data.ok && data.company) startCompany = data.company;
    } catch (e) {
      console.error("Startbedrijf kon niet worden geladen", e);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector('input[name="name"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const message = form.querySelector('textarea[name="message"]').value.trim();

    let categoryValue = categorySelect.value || "";
    let specialtyValue = specialtySelect?.value || "";

    // Harde fallback: categorie vanuit startbedrijf
    if (!categoryValue && startCompany?.categories?.length) {
      categoryValue = startCompany.categories[0];
    }

    if (!categoryValue) {
      alert("Categorie kon niet worden bepaald.");
      return;
    }

    const payload = {
      name,
      email,
      message,
      category: categoryValue,
      categories: [categoryValue],
      specialty: specialtyValue || "",
      specialties: specialtyValue ? [specialtyValue] : [],
      companySlug: companySlug || null,
    };

    try {
      const res = await fetch(`${API_BASE}/publicRequests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.requestId) {
        alert("Aanvraag kon niet worden aangemaakt.");
        return;
      }
      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch (e) {
      console.error(e);
      alert("Aanvraag kon niet worden verzonden.");
    }
  });
})();

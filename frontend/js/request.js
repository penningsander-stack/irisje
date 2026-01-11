// frontend/js/request.js
// Optie A – definitieve fix categorie (nooit meer leeg)

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const form = document.getElementById("requestForm");
  if (!form) return;

  const messageInput = document.getElementById("message");

  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get("companySlug");

  let startCompany = null;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!companySlug) return;

    try {
      const res = await fetch(`${API_BASE}/companies/slug/${companySlug}`);
      const data = await res.json();

      if (res.ok && data.ok && data.company) {
        startCompany = data.company;
      }
    } catch (e) {
      console.error("Startbedrijf kon niet worden geladen", e);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 🔍 categorie robuust ophalen
    let categoryValue = "";

    const categorySelect =
      form.querySelector('select[name="category"]') ||
      document.getElementById("category");

    if (categorySelect && categorySelect.value) {
      categoryValue = categorySelect.value;
    }

    // ✅ KEIHARDE FALLBACK
    if (!categoryValue && startCompany?.categories?.length) {
      categoryValue = startCompany.categories[0];
    }

    if (!categoryValue) {
      alert("Categorie kon niet worden bepaald.");
      return;
    }

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: messageInput.value.trim(),
      category: categoryValue,
      categories: [categoryValue],
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

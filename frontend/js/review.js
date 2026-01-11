// frontend/js/review.js
// v2026-01-11 — Stap O: review schrijven flow afronden

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("companySlug");

  const slugInput = document.getElementById("companySlug");
  const titleEl = document.getElementById("reviewTitle");
  const subtitleEl = document.getElementById("reviewSubtitle");

  if (!slug) {
    if (titleEl) titleEl.textContent = "Review plaatsen";
    if (subtitleEl)
      subtitleEl.textContent =
        "Er is geen bedrijf geselecteerd om te beoordelen.";
    return;
  }

  if (slugInput) slugInput.value = slug;

  // 👉 Bedrijfsnaam ophalen voor context (Trustoo-stijl)
  try {
    const res = await fetch(
      `${API_BASE}/companies/slug/${encodeURIComponent(slug)}`
    );
    const data = await res.json();

    if (data.ok && data.company) {
      if (titleEl)
        titleEl.textContent = `Review voor ${data.company.name}`;
      if (subtitleEl)
        subtitleEl.textContent =
          "Je schrijft een review op Irisje.nl op basis van je eigen ervaring.";
    }
  } catch (e) {
    console.warn("Kon bedrijfsnaam niet laden.");
  }

  const form = document.getElementById("reviewForm");
  const status = document.getElementById("statusMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "rq-status";
    status.textContent = "Bezig met verzenden…";

    const payload = {
      companySlug: slug,
      reviewerName: document.getElementById("reviewerName").value.trim(),
      reviewerEmail: document.getElementById("reviewerEmail").value.trim(),
      rating: Number(document.getElementById("rating").value),
      comment: document.getElementById("comment").value.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Verzenden mislukt.");

      status.className = "text-green-600 text-sm mt-4";
      status.innerHTML = `
        Dank je wel!  
        <br>Controleer je e-mail om je review te bevestigen.
        <br><br>
        <a href="company.html?slug=${encodeURIComponent(slug)}"
           class="text-indigo-600 underline">
          ← Terug naar het bedrijf
        </a>
      `;

      form.reset();
    } catch (err) {
      status.className = "text-red-600 text-sm mt-4";
      status.textContent = err.message || "Fout bij verzenden.";
    }
  });
});

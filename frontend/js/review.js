// frontend/js/review.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("companySlug");

  const slugInput = document.getElementById("companySlug");
  const titleEl = document.getElementById("reviewTitle");

  if (slugInput) slugInput.value = slug || "";

  if (titleEl && slug) {
    const readable = slug.replace(/-/g, " ");
    titleEl.textContent = `Plaats een review voor ${readable}`;
  }

  const form = document.getElementById("reviewForm");
  const status = document.getElementById("statusMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Bezig met verzenden…";

    const payload = {
      companySlug: slug,
      reviewerName: document.getElementById("reviewerName").value,
      reviewerEmail: document.getElementById("reviewerEmail").value,
      rating: document.getElementById("rating").value,
      comment: document.getElementById("comment").value,
    };

    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      status.className = "text-green-600 text-sm mt-4";
      status.textContent =
        "Dank je wel! Controleer je e-mail om je review te bevestigen.";

      form.reset();
    } catch (err) {
      status.className = "text-red-600 text-sm mt-4";
      status.textContent = err.message || "Fout bij verzenden.";
    }
  });
});

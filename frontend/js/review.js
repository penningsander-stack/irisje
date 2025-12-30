// frontend/js/review.js
// v20251230-REVIEW-TITLE-CONTEXT
//
// - Toont bedrijfsnaam in reviewtitel
// - Gebruikt companySlug uit URL
// - Geen submit-logica
// - Geen redirects
// - Veilig falen (geen crashes)

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("companySlug");

  if (!slug) return;

  loadCompanyName(slug);
});

async function loadCompanyName(slug) {
  try {
    const res = await fetch(
      `https://irisje-backend.onrender.com/api/companies/slug/${encodeURIComponent(slug)}`
    );
    if (!res.ok) return;

    const data = await res.json();
    const company = data?.item || data;

    if (!company || !company.name) return;

    const titleEl = document.getElementById("reviewTitle");
    if (titleEl) {
      titleEl.textContent = `Schrijf een review over ${company.name}`;
    }
  } catch (err) {
    // stil falen = UX blijft intact
  }
}

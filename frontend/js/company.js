// frontend/js/company.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const companySlug = urlParams.get("slug");

  const companyContainer = document.getElementById("company-details");
  const reviewsContainer = document.getElementById("reviews-list");

  if (!companySlug) {
    companyContainer.innerHTML =
      "<p class='text-red-600'>Geen bedrijfsprofiel gevonden.</p>";
    return;
  }

  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  // === Bedrijf laden ===
  async function loadCompany() {
    try {
      const res = await fetch(`${API_BASE}/companies/slug/${companySlug}`);
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const company = await res.json();

      companyContainer.innerHTML = `
        <div class="bg-white rounded-2xl shadow-md p-6 fade-in">
          <div class="flex flex-col sm:flex-row sm:items-center gap-6">
            <img src="${company.logoUrl || '/img/default-logo.png'}"
                 alt="${company.name}"
                 class="w-24 h-24 rounded-xl object-cover border" />
            <div>
              <h1 class="text-2xl font-bold text-indigo-700">${company.name}</h1>
              <p class="text-gray-600">${company.city || ''}</p>
              <p class="text-sm text-gray-500 mt-2">${company.tagline || ''}</p>
              <p class="text-sm text-gray-400 mt-1">${company.categories?.join(', ') || ''}</p>
              <p class="text-yellow-500 mt-2">
                ⭐ ${company.avgRating?.toFixed(1) || '0.0'} (${company.reviewCount || 0} reviews)
              </p>
            </div>
          </div>
        </div>`;
    } catch (err) {
      console.error("❌ Fout bij laden bedrijf:", err);
      companyContainer.innerHTML =
        "<p class='text-red-600'>Fout bij laden van het bedrijfsprofiel.</p>";
    }
  }

  // === Reviews laden ===
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companySlug}`);
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const reviews = await res.json();

      if (!Array.isArray(reviews) || reviews.length === 0) {
        reviewsContainer.innerHTML =
          "<p class='text-gray-500 text-center p-4'>Nog geen reviews geplaatst.</p>";
        return;
      }

      reviewsContainer.innerHTML = reviews
        .map((r) => {
          const datum = r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("nl-NL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-";

          const showReportButton =
            userRole === "company" || userEmail === "info@irisje.nl";

          return `
            <div class="border-b py-4">
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-semibold text-gray-800">${r.name || "Anoniem"}</h3>
                <span class="text-yellow-500">${"⭐".repeat(r.rating || 0)}</span>
              </div>
              <p class="text-gray-700 mb-1">${r.message || ""}</p>
              <p class="text-xs text-gray-400">${datum}</p>
              ${
                showReportButton
                  ? `<button
                      class="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                      onclick="reportReview('${r._id}')">
                      🚩 Meld review
                    </button>`
                  : ""
              }
            </div>`;
        })
        .join("");
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      reviewsContainer.innerHTML =
        "<p class='text-red-600 text-center p-4'>Fout bij laden van reviews.</p>";
    }
  }

  // === Review melden ===
  window.reportReview = async function (reviewId) {
    if (!confirm("Weet je zeker dat je deze review wilt melden?")) return;

    try {
      const res = await fetch(`${API_BASE}/reviews/report/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      alert("✅ Review is gemeld en wordt beoordeeld door de beheerder.");
    } catch (err) {
      console.error("❌ Fout bij melden review:", err);
      alert("Er is een fout opgetreden bij het melden van deze review.");
    }
  };

  // Init
  await loadCompany();
  await loadReviews();
});

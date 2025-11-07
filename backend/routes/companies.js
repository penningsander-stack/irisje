// frontend/js/company.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const companySlug = urlParams.get("slug");

  const companyContainer = document.getElementById("company-details");
  const reviewsContainer = document.getElementById("reviews-list");
  const googleContainer = document.getElementById("google-reviews");

  if (!companySlug) {
    if (companyContainer) {
      companyContainer.innerHTML =
        "<p class='text-red-600'>Geen bedrijfsprofiel gevonden.</p>";
    }
    return;
  }

  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  // === 1. Bedrijf laden ===
  async function loadCompany() {
    try {
      const res = await fetch(`${API_BASE}/companies/${companySlug}`);
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const company = await res.json();

      if (!companyContainer) return;

      companyContainer.innerHTML = `
        <div class="bg-white rounded-2xl shadow-md p-6 fade-in">
          <div class="flex flex-col sm:flex-row sm:items-center gap-6">
            <img
              src="${company.logoUrl || '/img/default-logo.png'}"
              alt="${company.name || ''}"
              class="w-24 h-24 rounded-xl object-cover border bg-gray-100"
              onerror="this.src='/img/default-logo.png';"
            />
            <div>
              <h1 class="text-2xl font-bold text-indigo-700">${company.name || ""}</h1>
              <p class="text-gray-600">${company.city || ""}</p>
              <p class="text-sm text-gray-500 mt-2">${company.tagline || ""}</p>
              <p class="text-sm text-gray-400 mt-1">
                ${Array.isArray(company.categories) ? company.categories.join(", ") : ""}
              </p>
              <p class="text-yellow-500 mt-2">
                ⭐ ${company.avgRating?.toFixed?.(1) || "0.0"} (${company.reviewCount || 0} reviews)
              </p>
            </div>
          </div>
        </div>
      `;

      if (company.name && company.city) {
        await loadGoogleReviews(company.name, company.city);
      }
    } catch (err) {
      console.error("❌ Fout bij laden bedrijf:", err);
      if (companyContainer) {
        companyContainer.innerHTML =
          "<p class='text-red-600'>Fout bij laden van het bedrijfsprofiel.</p>";
      }
    }
  }

  // === 2. Irisje reviews laden ===
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companySlug}`);
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const reviews = await res.json();

      if (!reviewsContainer) return;

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

          const showReportButton = userRole === "company" || userEmail === "info@irisje.nl";

          const reportButtonHTML = showReportButton
            ? `<button class="inline-block text-xs text-red-600 hover:text-red-800 font-medium ml-2 report-btn" data-id="${r._id}">🚩 Meld review</button>`
            : "";

          return `
            <div class="border-b py-4">
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-semibold text-gray-800">${r.name || "Anoniem"}</h3>
                <span class="text-yellow-500">${"⭐".repeat(r.rating || 0)}</span>
              </div>
              <p class="text-gray-700 mb-1">${r.message || ""}</p>
              <p class="text-xs text-gray-400">${datum} ${reportButtonHTML}</p>
            </div>
          `;
        })
        .join("");
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      if (reviewsContainer) {
        reviewsContainer.innerHTML =
          "<p class='text-red-600 text-center p-4'>Fout bij laden van reviews.</p>";
      }
    }
  }

  // === 3. Review melden (🚩) ===
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".report-btn");
    if (!btn) return;

    if (!(userRole === "company" || userEmail === "info@irisje.nl")) {
      alert("Alleen ingelogde bedrijven kunnen reviews melden.");
      return;
    }

    const reviewId = btn.getAttribute("data-id");
    const bevestig = confirm("Weet je zeker dat je deze review wilt melden?");
    if (!bevestig) return;

    btn.disabled = true;
    btn.textContent = "⏳ Bezig...";

    try {
      const res = await fetch(`${API_BASE}/reviews/report/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      btn.textContent = "✅ Gemeld";
      btn.classList.remove("text-red-600", "hover:text-red-800");
      btn.classList.add("text-green-600");
    } catch (err) {
      console.error("❌ Fout bij melden review:", err);
      alert("Er is een fout opgetreden bij het melden van deze review.");
      btn.disabled = false;
      btn.textContent = "🚩 Meld review";
    }
  });

  // === 4. Google Reviews laden ===
  async function loadGoogleReviews(companyName, city) {
    try {
      const res = await fetch(
        `${API_BASE}/google-reviews?name=${encodeURIComponent(companyName)}&city=${encodeURIComponent(city)}`
      );
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const data = await res.json();
      if (!googleContainer) return;

      if (!data.reviews || data.reviews.length === 0) {
        googleContainer.innerHTML = "<p class='text-gray-500'>Geen Google Reviews gevonden.</p>";
        return;
      }

      googleContainer.innerHTML = `
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-indigo-700">
            ⭐ Google Reviews (${data.total || 0})
          </h3>
          <p class="text-gray-600 text-sm mb-3">Gemiddelde score: ${data.rating || "-"}</p>
        </div>
        <div class="space-y-3">
          ${data.reviews
            .slice(0, 5)
            .map(
              (r) => `
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-3 mb-2">
              <img src="${r.profile_photo_url || '/img/default-user.png'}" alt="${r.author_name}" class="w-10 h-10 rounded-full object-cover border" />
              <div>
                <p class="font-medium text-gray-800">${r.author_name || "Gebruiker"}</p>
                <p class="text-yellow-500 text-sm">${"⭐".repeat(r.rating || 0)}</p>
              </div>
            </div>
            <p class="text-gray-700 text-sm mb-1">"${r.text || ""}"</p>
            <p class="text-xs text-gray-400">${r.relative_time_description || ""}</p>
          </div>`
            )
            .join("")}
        </div>
        <p class="text-xs text-gray-400 mt-3">🗺️ Reviews afkomstig van Google Maps.</p>
      `;
    } catch (err) {
      console.error("⚠️ Fout bij ophalen Google Reviews:", err);
      if (googleContainer)
        googleContainer.innerHTML =
          "<p class='text-gray-400 text-sm'>Geen Google Reviews beschikbaar.</p>";
    }
  }

  // === Init ===
  await loadCompany();
  await loadReviews();
});

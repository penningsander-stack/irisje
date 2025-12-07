
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const companySlug = urlParams.get("slug");

  // Premium-layout elementen
  const crumbName = document.getElementById("crumbName");
  const companyNameEl = document.getElementById("companyName");
  const companyCityEl = document.getElementById("companyCity");
  const companyCategoriesEl = document.getElementById("companyCategories");
  const companyVerifiedEl = document.getElementById("companyVerified");
  const companyDescriptionEl = document.getElementById("companyDescription");
  const companyLogoEl = document.getElementById("companyLogo");
  const companyHoursEl = document.getElementById("companyHours");
  const reviewSummaryEl = document.getElementById("reviewSummary");
  const reviewListEl = document.getElementById("reviewList");

  // Optioneel: oude containers als ze nog bestaan
  const reviewsContainerLegacy = document.getElementById("reviews-list");
  const googleContainer = document.getElementById("google-reviews");

  const reviewForm = document.getElementById("review-form");
  const reviewStatus = document.getElementById("review-status");

  if (!companySlug) {
    if (companyNameEl) companyNameEl.textContent = "Geen bedrijfsprofiel gevonden";
    if (companyDescriptionEl) {
      companyDescriptionEl.textContent =
        "Er is geen geldig bedrijfsprofiel gevonden voor deze URL.";
    }
    return;
  }

  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  /* ============================================================
     1️⃣ Bedrijf laden (premium weergave)
  ============================================================ */
  async function loadCompany() {
    try {
      const res = await fetch(
        `${API_BASE}/companies/slug/${companySlug}`,
        { cache: "no-cache" }
      );
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const company = await res.json();

      if (crumbName && company.name) crumbName.textContent = company.name;
      if (companyNameEl) companyNameEl.textContent = company.name || "Bedrijf";
      if (companyCityEl) companyCityEl.textContent = company.city || "";
      if (companyCategoriesEl) {
        const cats = Array.isArray(company.categories)
          ? company.categories.join(", ")
          : "";
        companyCategoriesEl.textContent = cats;
      }

      if (companyDescriptionEl) {
        const desc =
          company.description ||
          company.tagline ||
          "Dit bedrijf heeft nog geen uitgebreide beschrijving toegevoegd.";
        companyDescriptionEl.textContent = desc;
      }

      if (companyVerifiedEl) {
        if (company.isVerified) {
          companyVerifiedEl.textContent = "Geverifieerd bedrijf";
          companyVerifiedEl.classList.remove("hidden");
        } else {
          companyVerifiedEl.textContent = "Niet geverifieerd";
          companyVerifiedEl.classList.remove("hidden");
        }
      }

      // Openingstijden (best effort)
      if (companyHoursEl) {
        const hours = company.openingHours || company.openinghours;
        if (!hours) {
          companyHoursEl.innerHTML =
            "<li>Openingstijden niet beschikbaar.</li>";
        } else if (Array.isArray(hours)) {
          companyHoursEl.innerHTML = hours
            .map((h) => `<li>${h}</li>`)
            .join("");
        } else if (typeof hours === "object") {
          companyHoursEl.innerHTML = Object.entries(hours)
            .map(
              ([day, val]) =>
                `<li><span class="font-medium">${day}:</span> ${val}</li>`
            )
            .join("");
        } else if (typeof hours === "string") {
          companyHoursEl.innerHTML = `<li>${hours}</li>`;
        }
      }

      // Logo laden
      if (companyLogoEl) {
        const defaultLogo = "img/default-logo.png";
        const logoSrc =
          company.logoUrl && company.logoUrl.trim() !== ""
            ? company.logoUrl
            : defaultLogo;

        const img = new Image();
        img.onload = () => {
          companyLogoEl.src = logoSrc;
          companyLogoEl.style.opacity = "1";
        };
        img.onerror = () => {
          console.warn("⚠️ Logo niet gevonden, val terug op default-logo.png");
          companyLogoEl.src = defaultLogo;
          companyLogoEl.style.opacity = "1";
        };
        img.src = logoSrc;
      }

      // Google-reviews (indien container aanwezig)
      if (company.name && company.city && googleContainer) {
        await loadGoogleReviews(company.name, company.city);
      }

      // Bewaar bedrijf-ID voor reviewformulier
      if (reviewForm && company._id) {
        reviewForm.dataset.companyId = company._id;
      }
    } catch (err) {
      console.error("❌ Fout bij laden bedrijf:", err);
      if (companyDescriptionEl) {
        companyDescriptionEl.textContent =
          "Fout bij het laden van het bedrijfsprofiel.";
      }
    }
  }

  /* ============================================================
     2️⃣ Irisje-reviews laden (premium weergave)
  ============================================================ */
  async function loadReviews() {
    try {
      const res = await fetch(
        `${API_BASE}/reviews/company/${companySlug}`,
        { cache: "no-cache" }
      );
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const data = await res.json();
      const reviews = Array.isArray(data.reviews) ? data.reviews : [];

      const target =
        reviewListEl || reviewsContainerLegacy;

      if (!target) return;

      if (!reviews.length) {
        if (target === reviewListEl) {
          target.innerHTML =
            "<p class='text-xs text-slate-500'>Nog geen reviews geplaatst.</p>";
        } else {
          target.innerHTML =
            "<p class='text-gray-500 text-center p-4'>Nog geen reviews geplaatst.</p>";
        }
        if (reviewSummaryEl) {
          reviewSummaryEl.textContent = "Nog geen reviews.";
        }
        return;
      }

      // Samenvatting
      if (reviewSummaryEl) {
        const avg =
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          reviews.length;
        reviewSummaryEl.textContent = `⭐ ${avg.toFixed(
          1
        )} op basis van ${reviews.length} review(s).`;
      }

      const showReportButton =
        userRole === "company" || userEmail === "info@irisje.nl";

      const html = reviews
        .map((r) => {
          const datum = r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("nl-NL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-";

          const reportButtonHTML = showReportButton
            ? `<button class="inline-block text-xs text-red-600 hover:text-red-800 font-medium ml-2 report-btn" data-id="${r._id}">🚩 Meld review</button>`
            : "";

          if (target === reviewListEl) {
            return `
              <div class="border-b border-slate-100 pb-3 mb-3">
                <div class="flex justify-between items-center mb-1">
                  <h3 class="font-medium text-slate-900">${r.name || "Anoniem"}</h3>
                  <span class="text-amber-500 text-sm">${"⭐".repeat(
                    r.rating || 0
                  )}</span>
                </div>
                <p class="text-sm text-slate-700 mb-1">${r.message || ""}</p>
                <p class="text-[11px] text-slate-400">${datum} ${reportButtonHTML}</p>
              </div>
            `;
          }

          // legacy layout
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

      target.innerHTML = html;
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      const target =
        reviewListEl || reviewsContainerLegacy;
      if (target) {
        if (target === reviewListEl) {
          target.innerHTML =
            "<p class='text-xs text-red-600'>Fout bij laden van reviews.</p>";
        } else {
          target.innerHTML =
            "<p class='text-red-600 text-center p-4'>Fout bij laden van reviews.</p>";
        }
      }
      if (reviewSummaryEl) {
        reviewSummaryEl.textContent = "Fout bij laden van reviews.";
      }
    }
  }

  /* ============================================================
     3️⃣ Nieuwe review versturen (werkt alleen als formulier aanwezig is)
  ============================================================ */
  reviewForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const companyId = reviewForm.dataset.companyId;
    const name = document.getElementById("review-name").value.trim();
    const email = document.getElementById("review-email").value.trim();
    const rating = document.getElementById("review-rating").value.trim();
    const message = document.getElementById("review-message").value.trim();

    if (!reviewStatus) return;

    reviewStatus.textContent = "";
    reviewStatus.className = "text-sm mt-2";

    if (!name || !email || !rating || !message) {
      reviewStatus.textContent = "❌ Vul alle velden in.";
      reviewStatus.classList.add("text-red-600");
      return;
    }

    const btn = e.target.querySelector("button");
    btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, name, email, rating, message }),
      });

      const result = await res.json();

      if (result.ok) {
        reviewStatus.textContent =
          "✅ Review ontvangen! Bevestig je review via de link in je e-mail.";
        reviewStatus.classList.add("text-green-600");
        reviewForm.reset();
        await loadReviews();
      } else {
        reviewStatus.textContent =
          "❌ " + (result.error || "Er ging iets mis.");
        reviewStatus.classList.add("text-red-600");
      }
    } catch (err) {
      console.error("❌ Fout bij versturen review:", err);
      reviewStatus.textContent =
        "❌ Serverfout bij verzenden van review.";
      reviewStatus.classList.add("text-red-600");
    } finally {
      btn.disabled = false;
    }
  });

  /* ============================================================
     4️⃣ Review melden (🚩)
  ============================================================ */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".report-btn");
    if (!btn) return;

    if (!(userRole === "company" || userEmail === "info@irisje.nl")) {
      alert("Alleen ingelogde bedrijven kunnen reviews melden.");
      return;
    }

    const reviewId = btn.getAttribute("data-id");
    if (!reviewId) return;
    if (!confirm("Weet je zeker dat je deze review wilt melden?")) return;

    btn.disabled = true;
    const originalText = btn.textContent;
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
      btn.textContent = originalText;
    }
  });

  /* ============================================================
     5️⃣ Google-reviews laden (alleen als container bestaat)
  ============================================================ */
  async function loadGoogleReviews(companyName, city) {
    try {
      if (!googleContainer) return;

      const res = await fetch(
        `${API_BASE}/googlereviews?name=${encodeURIComponent(
          companyName
        )}&city=${encodeURIComponent(city)}`,
        { cache: "force-cache" }
      );
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const data = await res.json();

      if (!data.reviews || data.reviews.length === 0) {
        googleContainer.innerHTML =
          "<p class='text-gray-500'>Geen Google Reviews gevonden.</p>";
        return;
      }

      googleContainer.innerHTML = `
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-indigo-700">
            ⭐ Google Reviews (${data.total || 0})
          </h3>
          <p class="text-slate-600 text-xs mb-3">Gemiddelde score: ${
            data.rating || "-"
          }</p>
        </div>
        <div class="space-y-3">
          ${data.reviews
            .slice(0, 5)
            .map(
              (r) => `
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
            <div class="flex items-center gap-3 mb-2">
              <img src="${
                r.profile_photo_url || "img/default-user.png"
              }"
                   alt="${r.author_name || "Gebruiker"}"
                   class="w-8 h-8 rounded-full object-cover border"
                   loading="lazy" />
              <div>
                <p class="font-medium text-slate-800 text-xs">${
                  r.author_name || "Gebruiker"
                }</p>
                <p class="text-amber-500 text-xs">${"⭐".repeat(
                  r.rating || 0
                )}</p>
              </div>
            </div>
            <p class="text-slate-700 text-xs mb-1">"${
              r.text || ""
            }"</p>
            <p class="text-[10px] text-slate-400">${
              r.relative_time_description || ""
            }</p>
          </div>`
            )
            .join("")}
        </div>
        <p class="text-[10px] text-slate-400 mt-2">🗺️ Reviews afkomstig van Google Maps.</p>
      `;
    } catch (err) {
      console.error("⚠️ Fout bij ophalen Google Reviews:", err);
      if (googleContainer)
        googleContainer.innerHTML =
          "<p class='text-gray-400 text-xs'>Geen Google Reviews beschikbaar.</p>";
    }
  }

  /* ============================================================
     6️⃣ Init
  ============================================================ */
  await loadCompany();
  await loadReviews();
});

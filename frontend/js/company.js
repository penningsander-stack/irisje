// frontend/js/company.js
// v20251213-COMPANY-PROFILE-FINAL-B-C
//
// Toont bedrijfsprofiel + logo of fallback + meta op company.html

const API_BASE = "https://irisje-backend.onrender.com/api";
const BACKEND_BASE = "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  initCompanyDetail();
});

async function initCompanyDetail() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const card = document.getElementById("companyCard");

  if (!slug) {
    if (card) {
      card.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          Ongeldige pagina-URL (geen bedrijfsnaam opgegeven).
        </div>`;
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`Backend gaf status: ${res.status}`);

    const data = await res.json();
    const company = data && (data.company || data);

    if (!company || company.ok === false) {
      throw new Error("Bedrijf niet gevonden");
    }

    renderCompany(company);
  } catch (err) {
    console.error("❌ company.js fout:", err);
    if (card) {
      card.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          Bedrijf niet gevonden.
        </div>`;
    }
  }
}

// B + C: emoji/fallback op basis van categorie
function getCategoryEmoji(categories) {
  const cats = Array.isArray(categories) ? categories : (categories ? [categories] : []);
  const joined = cats.join(" ").toLowerCase();

  if (joined.includes("advocaat") || joined.includes("jurid") || joined.includes("recht")) return "⚖";
  if (joined.includes("loodgiet")) return "💧";
  if (joined.includes("elektr")) return "🔌";
  if (joined.includes("schilder")) return "🎨";
  if (joined.includes("dak")) return "🏠";
  if (joined.includes("aannemer") || joined.includes("bouw")) return "🏗";
  if (joined.includes("hovenier") || joined.includes("tuin")) return "🌳";
  if (joined.includes("schoonmaak")) return "🧹";
  if (joined.includes("airco") || joined.includes("koel")) return "❄";
  if (joined.includes("isolatie")) return "🧱";
  if (joined.includes("slot") || joined.includes("slotenmaker")) return "🔑";
  if (joined.includes("vloer") || joined.includes("tegel")) return "🧱";
  if (joined.includes("zonne") || joined.includes("solar")) return "☀";
  return "🏢";
}

function renderCompany(company) {
  const logoEl = document.getElementById("companyLogo");
  const fallbackEl = document.getElementById("companyLogoFallback");
  const nameEl = document.getElementById("companyName");
  const metaEl = document.getElementById("companyMeta");
  const taglineEl = document.getElementById("companyTagline");
  const verifiedBadge = document.getElementById("verifiedBadge");
  const servicesEl = document.getElementById("companyServices");
  const hoursEl = document.getElementById("companyHours");
  const reviewsEl = document.getElementById("companyReviews");

  const name = company.name || "(Naam onbekend)";
  const city = company.city || "";
  const categoriesArray = Array.isArray(company.categories) ? company.categories : [];
  const categories = categoriesArray.join(", ");
  const description =
    company.tagline ||
    company.description ||
    "Geen beschrijving beschikbaar.";

  // ⭐ Rating + aantal reviews
  const rating = Number(company.avgRating) || 0;
  const reviewCount = Number(company.reviewCount) || 0;

  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = "★".repeat(fullStars);
  if (halfStar) stars += "☆";
  stars += "✩".repeat(emptyStars);

  // LOGO + FALLBACK (B + C)
  if (fallbackEl) {
    const emoji = getCategoryEmoji(categoriesArray);
    const firstLetter = name.trim().charAt(0).toUpperCase() || "I";
    // Toon emoji + letter voor premium look
    fallbackEl.textContent = `${emoji} ${firstLetter}`;
  }

  if (logoEl) {
    let logo = company.logo || "";

    if (logo && logo.trim() !== "") {
      if (!logo.startsWith("http://") && !logo.startsWith("https://")) {
        logo = `${BACKEND_BASE}/${logo.replace(/^\/+/, "")}`;
      }
      logoEl.src = logo;
      logoEl.alt = name;
      logoEl.classList.remove("hidden");
      if (fallbackEl) {
        fallbackEl.style.display = "none";
      }
    } else {
      // Geen logo vanuit backend → fallback zichtbaar laten
      logoEl.classList.add("hidden");
      if (fallbackEl) {
        fallbackEl.style.display = "flex";
      }
    }
  }

  // Naam
  if (nameEl) {
    nameEl.textContent = name;
  }

  // Meta: categorieën, stad, rating
  if (metaEl) {
    metaEl.innerHTML = "";

    if (categories) {
      const catSpan = document.createElement("span");
      catSpan.className =
        "inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700";
      catSpan.textContent = categories;
      metaEl.appendChild(catSpan);
    }

    if (city) {
      const citySpan = document.createElement("span");
      citySpan.className =
        "inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700";
      citySpan.textContent = city;
      metaEl.appendChild(citySpan);
    }

    if (reviewCount > 0) {
      const ratingSpan = document.createElement("span");
      ratingSpan.className =
        "inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700";
      ratingSpan.textContent = `${stars} ${rating.toFixed(1)} • ${reviewCount} reviews`;
      metaEl.appendChild(ratingSpan);
    }
  }

  // Verified badge
  if (verifiedBadge) {
    if (company.isVerified) {
      verifiedBadge.classList.remove("hidden");
    } else {
      verifiedBadge.classList.add("hidden");
    }
  }

  // Tagline / beschrijving
  if (taglineEl) {
    taglineEl.textContent = description;
  }

  // Diensten
  if (servicesEl) {
    servicesEl.innerHTML = "";
    const services = Array.isArray(company.services) ? company.services : [];

    if (services.length === 0) {
      servicesEl.innerHTML =
        '<span class="text-slate-400 text-xs">Geen diensten opgegeven.</span>';
    } else {
      services.forEach((svc) => {
        if (!svc) return;
        const chip = document.createElement("span");
        chip.className =
          "inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700";
        chip.textContent = svc;
        servicesEl.appendChild(chip);
      });
    }
  }

  // Openingstijden
  if (hoursEl) {
    hoursEl.innerHTML = "";
    const hours = company.openingHours || company.hours || null;

    if (!hours) {
      hoursEl.innerHTML =
        '<span class="text-slate-400 text-xs col-span-full">Geen openingstijden bekend.</span>';
    } else if (Array.isArray(hours)) {
      hours.forEach((row) => {
        const div = document.createElement("div");
        div.className = "text-xs bg-slate-50 rounded-lg px-2 py-1";
        div.textContent = row;
        hoursEl.appendChild(div);
      });
    } else if (typeof hours === "object") {
      Object.keys(hours).forEach((day) => {
        const div = document.createElement("div");
        div.className = "text-xs bg-slate-50 rounded-lg px-2 py-1 flex justify-between";
        div.innerHTML = `<span>${day}</span><span>${hours[day]}</span>`;
        hoursEl.appendChild(div);
      });
    }
  }

  // Reviews
  if (reviewsEl) {
    reviewsEl.innerHTML = "";
    const reviews = Array.isArray(company.reviews) ? company.reviews : [];

    if (reviews.length === 0) {
      reviewsEl.innerHTML =
        '<span class="text-slate-400 text-xs">Nog geen reviews.</span>';
    } else {
      reviews.forEach((rev) => {
        const r = document.createElement("div");
        r.className = "border border-slate-100 rounded-xl px-3 py-2 text-sm";

        const rName = rev.name || rev.author || "Anonieme klant";
        const rText = rev.comment || rev.text || "";
        const rRating = Number(rev.rating || rev.stars || 0);

        let rStars = "";
        if (rRating > 0) {
          const full = Math.round(rRating);
          rStars = "★".repeat(full) + "✩".repeat(5 - full);
        }

        r.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <span class="font-medium text-slate-800">${rName}</span>
            ${
              rStars
                ? `<span class="text-xs text-amber-500">${rStars} ${rRating.toFixed(
                    1
                  )}</span>`
                : ""
            }
          </div>
          <div class="text-xs text-slate-600 whitespace-pre-line">${rText}</div>
        `;

        reviewsEl.appendChild(r);
      });
    }
  }
}

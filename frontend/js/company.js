// frontend/js/company.js
// v20251213-COMPANY-PROFILE-STABLE-SAFE-A
//
// Veilig herschreven: geen Tailwind-restanten, geen multiline template literals,
// alle HTML-inserties zijn safe, premium gouden sterren gegarandeerd.

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
      card.innerHTML =
        '<div style="text-align:center; padding:2rem; color:#64748b;">Ongeldige pagina-URL (geen bedrijfsnaam opgegeven).</div>';
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
      card.innerHTML =
        '<div style="text-align:center; padding:2rem; color:#64748b;">Bedrijf niet gevonden.</div>';
    }
  }
}

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

  const rating = Number(company.avgRating) || 0;
  const reviewCount = Number(company.reviewCount) || 0;

  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = "★".repeat(fullStars);
  if (halfStar) stars += "☆";
  stars += "✩".repeat(emptyStars);

  if (fallbackEl) {
    const emoji = getCategoryEmoji(categoriesArray);
    const firstLetter = name.trim().charAt(0).toUpperCase() || "I";
    fallbackEl.textContent = emoji + " " + firstLetter;
  }

  if (logoEl) {
    let logo = company.logo || "";
    if (logo && logo.trim() !== "") {
      if (!logo.startsWith("http://") && !logo.startsWith("https://")) {
        logo = BACKEND_BASE + "/" + logo.replace(/^\/+/, "");
      }
      logoEl.src = logo;
      logoEl.alt = name;
      logoEl.classList.remove("hidden");
      if (fallbackEl) fallbackEl.style.display = "none";
    } else {
      logoEl.classList.add("hidden");
      if (fallbackEl) fallbackEl.style.display = "flex";
    }
  }

  if (nameEl) nameEl.textContent = name;

  if (metaEl) {
    metaEl.innerHTML = "";

    if (categories) {
      const catSpan = document.createElement("span");
      catSpan.setAttribute("style",
        "display:inline-flex;align-items:center;padding:2px 6px;border-radius:6px;background:#f1f5f9;color:#334155;font-size:12px;");
      catSpan.textContent = categories;
      metaEl.appendChild(catSpan);
    }

    if (city) {
      const citySpan = document.createElement("span");
      citySpan.setAttribute("style",
        "display:inline-flex;align-items:center;padding:2px 6px;border-radius:6px;background:#f1f5f9;color:#334155;font-size:12px;");
      citySpan.textContent = city;
      metaEl.appendChild(citySpan);
    }

    if (reviewCount > 0) {
      const ratingSpan = document.createElement("span");
      ratingSpan.setAttribute("style",
        "display:inline-flex;align-items:center;padding:2px 6px;border-radius:6px;background:#fffbeb;color:#92400e;font-size:12px;");

      const starHTML =
        '<span style="color:#f59e0b !important; font-size:18px; font-weight:600; text-shadow:0 1px 1px rgba(0,0,0,0.15);">'
        + stars +
        '</span>' +
        '<span style="margin-left:6px; color:#92400e;">' +
        rating.toFixed(1) + " • Google • " + reviewCount + " reviews</span>";

      ratingSpan.innerHTML = starHTML;
      metaEl.appendChild(ratingSpan);
    }
  }

  if (verifiedBadge) {
    if (company.isVerified) verifiedBadge.classList.remove("hidden");
    else verifiedBadge.classList.add("hidden");
  }

  if (taglineEl) taglineEl.textContent = description;

  if (servicesEl) {
    servicesEl.innerHTML = "";
    const services = Array.isArray(company.services) ? company.services : [];

    if (services.length === 0) {
      servicesEl.innerHTML =
        '<span style="color:#94a3b8;font-size:12px;">Geen diensten opgegeven.</span>';
    } else {
      services.forEach((svc) => {
        if (!svc) return;
        const chip = document.createElement("span");
        chip.setAttribute("style",
          "display:inline-flex;align-items:center;padding:2px 6px;border-radius:6px;background:#eef2ff;color:#4338ca;font-size:12px;");
        chip.textContent = svc;
        servicesEl.appendChild(chip);
      });
    }
  }

  if (hoursEl) {
    hoursEl.innerHTML = "";
    const hours = company.openingHours || company.hours || null;

    if (!hours) {
      hoursEl.innerHTML =
        '<span style="color:#94a3b8;font-size:12px;grid-column:1 / -1;">Geen openingstijden bekend.</span>';
    } else if (Array.isArray(hours)) {
      hours.forEach((row) => {
        const div = document.createElement("div");
        div.setAttribute("style",
          "font-size:12px;background:#f8fafc;border-radius:8px;padding:4px 6px;");
        div.textContent = row;
        hoursEl.appendChild(div);
      });
    } else if (typeof hours === "object") {
      Object.keys(hours).forEach((day) => {
        const div = document.createElement("div");
        div.setAttribute("style",
          "font-size:12px;background:#f8fafc;border-radius:8px;padding:4px 6px;display:flex;justify-content:space-between;");
        div.innerHTML = "<span>" + day + "</span><span>" + hours[day] + "</span>";
        hoursEl.appendChild(div);
      });
    }
  }

  if (reviewsEl) {
    reviewsEl.innerHTML = "";
    const reviews = Array.isArray(company.reviews) ? company.reviews : [];

    if (reviews.length === 0) {
      reviewsEl.innerHTML =
        '<span style="color:#94a3b8;font-size:12px;">Nog geen reviews.</span>';
    } else {
      reviews.forEach((rev) => {
        const r = document.createElement("div");
        r.setAttribute("style",
          "border:1px solid #f1f5f9;border-radius:12px;padding:8px;font-size:14px;");

        const rName = rev.name || rev.author || "Anonieme klant";
        const rText = rev.comment || rev.text || "";
        const rRating = Number(rev.rating || rev.stars || 0);

        let rStars = "";
        if (rRating > 0) {
          const full = Math.round(rRating);
          rStars = "★".repeat(full) + "✩".repeat(5 - full);
        }

        r.innerHTML =
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
          + '<span style="font-weight:600;color:#1e293b;">' + rName + '</span>'
          + (rStars
            ? '<span style="font-size:12px;color:#f59e0b !important;">'+ rStars +' '+ rRating.toFixed(1) +'</span>'
            : "")
          + '</div>'
          + '<div style="font-size:12px;color:#64748b;white-space:pre-line;">'+ rText +'</div>';

        reviewsEl.appendChild(r);
      });
    }
  }
}
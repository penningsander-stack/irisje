// frontend/js/company.js
// v20251225-COMPANY-STEP-B-FIXED
//
// FIX:
// - Backend response { ok, item } correct uitlezen
// - Geen aannames meer over response-structuur
// - Frontend-only, veilig

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initCompany);

async function initCompany() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const id = params.get("id");

  if (!slug && !id) return;

  try {
    const url = slug
      ? `${API_BASE}/companies/slug/${encodeURIComponent(slug)}`
      : `${API_BASE}/companies/${encodeURIComponent(id)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // 🔑 HIER DE FIX:
    const company =
      data?.item ||
      data?.company ||
      data;

    if (!company || !company.name) {
      throw new Error("Company data ontbreekt");
    }

    renderCompany(company);
    bindReviewSort(company.reviews || []);
  } catch (err) {
    console.error("Company load error:", err);
  }
}

function renderCompany(c) {
  setText("companyName", c.name || "Onbekend bedrijf");
  setText(
    "companyMeta",
    [c.city, (c.categories || [])[0]].filter(Boolean).join(" · ")
  );

  const logo = document.getElementById("companyLogo");

if (c.logo) {
  logo.src = c.logo;
} else if (c.website) {
  try {
    const domain = new URL(c.website).hostname;
    logo.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    logo.src = "/img/logo-placeholder.png";
  }
}


  if (c.isPremium) {
    document.getElementById("premiumBadge").classList.remove("hidden");
  }

  renderRating("companyRating", c.avgRating, c.reviewCount);

  // Over dit bedrijf – fallback
  setText(
    "companyAbout",
    c.description && c.description.trim()
      ? c.description
      : "Dit bedrijf heeft nog geen uitgebreide beschrijving toegevoegd."
  );

  // Bedrijfsgegevens
  const details = document.getElementById("companyDetails");
  details.innerHTML = "";
  addDetail(details, "Plaats", c.city);
  addDetail(details, "Categorie", (c.categories || [])[0]);
  addDetail(details, "Telefoon", c.phone);
  addDetail(details, "Website", c.website);
  addDetail(details, "Geverifieerd", c.isVerified ? "Ja" : "Nee");

  // CTA
  document.getElementById("ctaRequest").onclick = () => {
    window.location.href =
      `/ad-company.html?slug=${encodeURIComponent(c.slug || "")}`;
  };

  renderReviews(c.reviews || []);
}

function renderRating(elId, rating, count) {
  const el = document.getElementById(elId);
  if (!count) {
    el.innerHTML = `<span class="text-sm text-slate-500">Nog geen reviews</span>`;
    return;
  }
  el.innerHTML = `
    <div class="flex items-center gap-2 text-sm">
      <span style="color:#f59e0b">${"★".repeat(Math.round(rating))}</span>
      <span>${formatRating(rating)}</span>
      <span class="text-slate-500">(${count})</span>
    </div>
  `;
}

function renderReviews(list) {
  const container = document.getElementById("reviewsContainer");
  const empty = document.getElementById("noReviews");
  container.innerHTML = "";

  if (!list.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  list.forEach(r => {
    const div = document.createElement("div");
    div.className = "border border-slate-200 rounded-xl p-4";
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="font-medium text-sm">${escapeHtml(r.author || "Gebruiker")}</span>
        <span class="text-xs text-slate-400">${formatRating(r.rating)}</span>
      </div>
      <p class="text-sm text-slate-600">${escapeHtml(r.text || "")}</p>
    `;
    container.appendChild(div);
  });
}

function bindReviewSort(reviews) {
  const select = document.getElementById("reviewSort");
  select.addEventListener("change", () => {
    let sorted = [...reviews];
    if (select.value === "highest") {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    renderReviews(sorted);
  });
}

// helpers
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "";
}

function addDetail(ul, label, value) {
  if (!value) return;
  const li = document.createElement("li");
  li.innerHTML = `<span class="text-slate-400">${label}:</span> ${escapeHtml(value)}`;
  ul.appendChild(li);
}

function formatRating(n) {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

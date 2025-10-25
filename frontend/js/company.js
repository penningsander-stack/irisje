// frontend/js/company.js
const API_BASE = "https://irisje-backend.onrender.com/api";

// Helper om URL-parameters te lezen
function getSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

async function loadCompany() {
  const slug = getSlug();
  const info = document.getElementById("company-info");

  if (!slug) {
    info.innerHTML = "<p class='text-red-600'>Geen bedrijfs-slug opgegeven.</p>";
    return;
  }

  try {
    const res = await axios.get(`${API_BASE}/companies/${slug}`);
    const company = res.data;

    // Vul bedrijfsinformatie
    document.getElementById("company-name").textContent = company.name || "Onbekend bedrijf";
    document.getElementById("company-tagline").textContent = company.tagline || "";
    document.getElementById("company-city").textContent = company.city || "";
    document.getElementById("company-description").textContent = company.description || "";
    document.getElementById("company-logo").src = company.logoUrl || "";

    const catDiv = document.getElementById("company-categories");
    catDiv.innerHTML = "";
    if (company.categories && company.categories.length) {
      company.categories.forEach(cat => {
        const span = document.createElement("span");
        span.className = "bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm";
        span.textContent = cat;
        catDiv.appendChild(span);
      });
    }

    // Toon reviews
    renderReviews(company.reviews || []);
  } catch (err) {
    console.error("Fout bij laden bedrijf:", err);
    document.getElementById("company-info").innerHTML =
      "<p class='text-red-600'>Kon bedrijfsgegevens niet laden.</p>";
  }
}

function renderReviews(reviews) {
  const reviewList = document.getElementById("review-list");
  reviewList.innerHTML = "";
  if (!reviews.length) {
    reviewList.innerHTML = "<p class='text-gray-500'>Nog geen beoordelingen beschikbaar.</p>";
    return;
  }
  reviews.forEach(r => {
    const div = document.createElement("div");
    div.className = "border border-gray-200 rounded-lg p-3";
    const date = r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "";
    div.innerHTML = `
      <div class="text-yellow-400">${"⭐".repeat(r.rating || 0)}</div>
      <p class="text-gray-800 mt-1">${r.message || ""}</p>
      <p class="text-sm text-gray-500 mt-1">— ${r.name || "Anoniem"}${date ? ", " + date : ""}</p>
    `;
    reviewList.appendChild(div);
  });
}

// === Reviewformulier verzenden ===
document.addEventListener("DOMContentLoaded", () => {
  loadCompany();

  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", async e => {
      e.preventDefault();
      const slug = getSlug();
      const data = {
        companySlug: slug,
        name: e.target.reviewName.value,
        email: e.target.reviewEmail.value,
        rating: parseInt(e.target.reviewRating.value),
        message: e.target.reviewMessage.value,
      };
      try {
        await axios.post(`${API_BASE}/reviews`, data);
        document.getElementById("reviewMessageInfo").textContent =
          "✅ Je beoordeling is succesvol verzonden.";
        e.target.reset();
        loadCompany(); // herlaad reviews
      } catch (err) {
        console.error(err);
        document.getElementById("reviewMessageInfo").textContent =
          "❌ Fout bij verzenden van beoordeling.";
      }
    });
  }

  // === Offerteformulier ===
  const quoteForm = document.getElementById("quoteForm");
  if (quoteForm) {
    quoteForm.addEventListener("submit", async e => {
      e.preventDefault();
      const slug = getSlug();
      const data = {
        companySlug: slug,
        name: e.target.name.value,
        email: e.target.email.value,
        message: e.target.message.value,
      };
      try {
        await axios.post(`${API_BASE}/publicRequests`, data);
        document.getElementById("form-message").textContent =
          "✅ Je aanvraag is succesvol verzonden!";
        e.target.reset();
      } catch (err) {
        console.error(err);
        document.getElementById("form-message").textContent =
          "❌ Er ging iets mis bij het verzenden van je aanvraag.";
      }
    });
  }
});

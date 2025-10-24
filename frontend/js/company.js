// frontend/js/company.js

// ✅ Backend-basisadres
const apiBase = "https://irisje-backend.onrender.com";

// Hulpfunctie: sterren renderen
function renderStars(rating) {
  const fullStars = Math.round(rating);
  return "⭐".repeat(fullStars);
}

// ✅ Bedrijfsgegevens en reviews laden
async function loadCompany() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    document.body.innerHTML = "<p>Bedrijf niet gevonden.</p>";
    return;
  }

  try {
    const res = await axios.get(`${apiBase}/api/companies/${slug}`);
    const company = res.data;

    // Vul bedrijfsinformatie
    document.querySelector("h1").textContent = company.name;
    document.querySelector("#tagline").textContent = company.tagline;
    document.querySelector("#city").textContent = company.city;
    document.querySelector("#categories").textContent = company.categories.join(", ");
    document.querySelector("#description").textContent = company.description;

    // Gemiddelde rating en telling
    document.querySelector("#rating").textContent = renderStars(company.avgRating);
    document.querySelector("#reviewCount").textContent = `(${company.reviewCount} reviews)`;

    // Reviews renderen
    const reviewList = document.getElementById("review-list");
    reviewList.innerHTML = "";
    if (company.reviews && company.reviews.length > 0) {
      company.reviews.forEach((r) => {
        const div = document.createElement("div");
        div.className = "p-3 border-b";
        div.innerHTML = `
          <p>${renderStars(r.rating)}</p>
          <p class="mt-1">${r.message}</p>
          <p class="text-sm text-gray-500 mt-1">— ${r.name}${
            r.date ? ", " + new Date(r.date).toLocaleDateString("nl-NL") : ""
          }</p>
        `;
        reviewList.appendChild(div);
      });
    } else {
      reviewList.innerHTML = "<p>Nog geen beoordelingen beschikbaar.</p>";
    }

    // Sla slug op voor formulieren
    document.getElementById("reviewForm").dataset.slug = slug;
    document.getElementById("requestForm").dataset.slug = slug;

  } catch (error) {
    console.error("Fout bij laden bedrijfsgegevens:", error);
    document.body.innerHTML = "<p>Kon bedrijfsgegevens niet laden.</p>";
  }
}

// ✅ Review versturen
async function submitReviewForm(e) {
  e.preventDefault();
  const form = e.target;
  const slug = form.dataset.slug;
  const name = form.querySelector("#reviewName").value;
  const email = form.querySelector("#reviewEmail").value;
  const rating = parseInt(form.querySelector("#reviewRating").value);
  const message = form.querySelector("#reviewMessage").value;

  try {
    await axios.post(`${apiBase}/api/reviews`, {
      companySlug: slug,
      name,
      email,
      rating,
      message,
    });
    alert("✅ Bedankt voor je beoordeling!");
    form.reset();
    loadCompany(); // herladen om review direct te tonen
  } catch (error) {
    console.error(error);
    alert("❌ Er ging iets mis bij het verzenden van je review.");
  }
}

// ✅ Offerteaanvraag versturen
async function submitRequestForm(e) {
  e.preventDefault();
  const form = e.target;
  const slug = form.dataset.slug;
  const name = form.querySelector("#requestName").value;
  const email = form.querySelector("#requestEmail").value;
  const message = form.querySelector("#requestMessage").value;

  try {
    const res = await axios.post(`${apiBase}/api/publicRequests`, {
      companySlug: slug,
      name,
      email,
      message,
    });
    alert(res.data.message || "✅ Je aanvraag is succesvol verzonden!");
    form.reset();
  } catch (error) {
    console.error("Fout bij verzenden aanvraag:", error);
    alert("❌ Er ging iets mis bij het verzenden.");
  }
}

// ✅ Eventlisteners instellen
document.addEventListener("DOMContentLoaded", () => {
  loadCompany();

  const reviewForm = document.getElementById("reviewForm");
  const requestForm = document.getElementById("requestForm");

  if (reviewForm) reviewForm.addEventListener("submit", submitReviewForm);
  if (requestForm) requestForm.addEventListener("submit", submitRequestForm);
});

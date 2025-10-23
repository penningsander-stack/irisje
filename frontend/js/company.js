// frontend/js/company.js
const API_BASE = "https://irisje-backend.onrender.com/api";
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

async function loadCompany() {
  const res = await fetch(`${API_BASE}/companies/${slug}`);
  const data = await res.json();
  if (!data.ok) {
    document.body.innerHTML = "<p>Bedrijf niet gevonden.</p>";
    return;
  }

  document.getElementById("companyName").textContent = data.company.name;
  document.getElementById("companyTagline").textContent = data.company.tagline;

  document.getElementById("companyInfo").innerHTML = `
    <p>${data.company.description || ""}</p>
    <p><strong>Locatie:</strong> ${data.company.city}</p>
    <p><strong>Website:</strong> <a href="${data.company.website}" target="_blank">${data.company.website}</a></p>
  `;

  const reviewsHTML =
    data.reviews.length > 0
      ? data.reviews
          .map(
            (r) => `
          <div class="card">
            <p><strong>${r.name}</strong> – ⭐${r.rating}</p>
            <p>${r.message}</p>
          </div>`
          )
          .join("")
      : "<p>Geen reviews beschikbaar.</p>";

  document.getElementById("reviews").innerHTML = reviewsHTML;
}

loadCompany();

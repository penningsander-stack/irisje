document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const apiBase = "https://irisje-backend.onrender.com";


  if (!slug) {
    document.getElementById("company-info").innerHTML = "<p>Geen bedrijf gevonden.</p>";
    return;
  }

  async function loadCompany() {
    try {
      const res = await axios.get(`${apiBase}/api/companies/${slug}`);
      const company = res.data;

      document.getElementById("company-name").textContent = company.name;
      document.getElementById("company-tagline").textContent = company.tagline;
      document.getElementById("company-city").textContent = `📍 ${company.city}`;
      document.getElementById("company-description").textContent = company.description || "";
      document.getElementById("review-count").textContent = `(${company.reviewCount} reviews)`;

      if (company.logoUrl) {
        document.getElementById("company-logo").src = company.logoUrl;
      }

      const catContainer = document.getElementById("company-categories");
      catContainer.innerHTML = "";
      (company.categories || []).forEach(cat => {
        const span = document.createElement("span");
        span.className = "bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm";
        span.textContent = cat;
        catContainer.appendChild(span);
      });

      renderReviews(company.reviews || []);
      document.getElementById("company-rating").textContent = "⭐".repeat(Math.round(company.avgRating || 0));
    } catch (err) {
      console.error(err);
      document.getElementById("company-info").innerHTML = "<p>Kon bedrijfsgegevens niet laden.</p>";
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
      div.innerHTML = `
        <div class="text-yellow-400">${"⭐".repeat(r.rating)}</div>
        <p class="text-gray-800 mt-1">${r.message}</p>
        <p class="text-sm text-gray-500 mt-1">— ${r.name}, ${new Date(r.date).toLocaleDateString("nl-NL")}</p>
      `;
      reviewList.appendChild(div);
    });
  }

  await loadCompany();

  // Aanvraagformulier
  document.getElementById("quoteForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const message = e.target.message.value.trim();
    const msg = document.getElementById("form-message");
    try {
      await axios.post(`${apiBase}/api/requests`, { companySlug: slug, name, email, message });
      msg.textContent = "✅ Je aanvraag is succesvol verzonden!";
      e.target.reset();
    } catch {
      msg.textContent = "❌ Er ging iets mis bij het verzenden.";
    }
  });

  // Reviewformulier
  document.getElementById("reviewForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = e.target.reviewName.value.trim();
    const email = e.target.reviewEmail.value.trim();
    const rating = parseInt(e.target.reviewRating.value);
    const message = e.target.reviewMessage.value.trim();
    const info = document.getElementById("reviewMessageInfo");

    try {
      await axios.post(`${apiBase}/api/reviews`, { companySlug: slug, name, email, rating, message });
      info.textContent = "✅ Dank je! Je beoordeling is verzonden.";
      e.target.reset();
      await loadCompany(); // herlaadt reviews
    } catch (err) {
      info.textContent = "❌ Er ging iets mis bij het versturen van je beoordeling.";
    }
  });
});

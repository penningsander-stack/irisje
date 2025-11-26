// frontend/js/company.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  // Elements
  const cName = document.getElementById("cName");
  const cCity = document.getElementById("cCity");
  const cCategories = document.getElementById("cCategories");
  const cTagline = document.getElementById("cTagline");
  const cStars = document.getElementById("cStars");
  const cReviewCount = document.getElementById("cReviewCount");

  const companyLoading = document.getElementById("companyLoading");
  const reviewsLoading = document.getElementById("reviewsLoading");
  const reviewsList = document.getElementById("reviewsList");

  const scrollToForm = document.getElementById("scrollToForm");

  const rqName = document.getElementById("rqName");
  const rqEmail = document.getElementById("rqEmail");
  const rqPhone = document.getElementById("rqPhone");
  const rqMessage = document.getElementById("rqMessage");

  const errName = document.getElementById("errName");
  const errEmail = document.getElementById("errEmail");
  const errPhone = document.getElementById("errPhone");
  const errMessage = document.getElementById("errMessage");

  const rqStatus = document.getElementById("rqStatus");
  const companyRequestForm = document.getElementById("companyRequestForm");

  // Read slug
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    companyLoading.textContent = "❌ Geen bedrijf gevonden.";
    return;
  }

  // --------------------------
  // Load company data
  // --------------------------
  async function loadCompany() {
    try {
      const res = await fetch(`${API_BASE}/companies/slug/${slug}`);
      const data = await res.json();

      if (!res.ok || !data || !data._id) {
        throw new Error("Geen geldige data");
      }

      companyLoading.classList.add("hidden");

      cName.textContent = data.name || "";
      cCity.textContent = data.city ? `📍 ${data.city}` : "";
      cCategories.textContent = data.categories ? data.categories.join(", ") : "";
      cTagline.textContent = data.tagline || "";

      cName.classList.remove("hidden");
      cCity.classList.remove("hidden");
      cCategories.classList.remove("hidden");
      cTagline.classList.remove("hidden");

      const stars = Math.round(data.avgRating || 0);
      cStars.textContent = stars ? "⭐".repeat(stars) : "—";
      cReviewCount.textContent = `${data.reviewCount || 0} review${(data.reviewCount === 1 ? "" : "s")}`;
      document.getElementById("ratingBox").classList.remove("hidden");

      loadReviews(data._id);
    } catch (err) {
      companyLoading.textContent = "❌ Bedrijf kon niet worden geladen.";
    }
  }

  // --------------------------
  // Load reviews
  // --------------------------
  async function loadReviews(companyId) {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();

      reviewsLoading.classList.add("hidden");

      if (!res.ok || !data || !Array.isArray(data.reviews)) {
        reviewsList.innerHTML = `<p class="text-sm text-gray-500">Geen reviews.</p>`;
        reviewsList.classList.remove("hidden");
        return;
      }

      if (!data.reviews.length) {
        reviewsList.innerHTML = `<p class="text-sm text-gray-500">Nog geen reviews.</p>`;
        reviewsList.classList.remove("hidden");
        return;
      }

      const cards = data.reviews.map(r => {
        const stars = "⭐".repeat(r.rating || 0);
        return `
          <article class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div class="text-yellow-500 text-sm font-semibold">${stars}</div>
            <p class="text-gray-700 text-sm mt-2">${escapeHtml(r.text || "")}</p>
            <p class="text-xs text-gray-500 mt-3">${r.name || "Anoniem"} – ${formatDate(r.createdAt)}</p>
          </article>
        `;
      });

      reviewsList.innerHTML = cards.join("");
      reviewsList.classList.remove("hidden");
    } catch (err) {
      reviewsList.innerHTML = `<p class="text-sm text-red-600">❌ Reviews konden niet worden geladen.</p>`;
      reviewsList.classList.remove("hidden");
    }
  }

  // Helpers
  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>\"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  function formatDate(str) {
    if (!str) return "";
    const d = new Date(str);
    return d.toLocaleDateString("nl-NL");
  }

  // --------------------------
  // Scroll naar formulier
  // --------------------------
  scrollToForm.addEventListener("click", () => {
    document.getElementById("requestFormBox")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // --------------------------
  // Offerte versturen
  // --------------------------
  const validators = {
    name: v => v.trim().length >= 2 || "Vul je naam in.",
    email: v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || "Vul een geldig e-mailadres in.",
    phone: v => v.replace(/\D/g,"").length >= 8 || "Vul een geldig telefoonnummer in.",
    message: v => v.trim().length >= 5 || "Beschrijf kort je aanvraag."
  };

  function setError(el, errEl, msg) {
    if (msg === true) {
      el.classList.remove("error-border");
      errEl.style.display = "none";
    } else {
      el.classList.add("error-border");
      errEl.style.display = "block";
      errEl.textContent = msg;
    }
  }

  companyRequestForm.addEventListener("submit", async e => {
    e.preventDefault();

    const checkName = validators.name(rqName.value);
    const checkEmail = validators.email(rqEmail.value);
    const checkPhone = validators.phone(rqPhone.value);
    const checkMessage = validators.message(rqMessage.value);

    setError(rqName, errName, checkName === true ? true : checkName);
    setError(rqEmail, errEmail, checkEmail === true ? true : checkEmail);
    setError(rqPhone, errPhone, checkPhone === true ? true : checkPhone);
    setError(rqMessage, errMessage, checkMessage === true ? true : checkMessage);

    if ([checkName, checkEmail, checkPhone, checkMessage].some(v => v !== true)) {
      rqStatus.textContent = "❌ Controleer de velden hierboven.";
      rqStatus.className = "text-sm text-red-600";
      return;
    }

    try {
      rqStatus.textContent = "⏳ Aanvraag wordt verzonden...";
      rqStatus.className = "text-sm text-gray-500";

      const res = await fetch(`${API_BASE}/publicRequests`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          companyId: slug,
          customerName: rqName.value.trim(),
          customerEmail: rqEmail.value.trim(),
          customerPhone: rqPhone.value.trim(),
          message: rqMessage.value.trim()
        })
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json || json.ok === false) {
        throw new Error(json?.error || "Serverfout");
      }

      rqStatus.textContent = "✅ Aanvraag succesvol verzonden.";
      rqStatus.className = "text-sm text-green-600";

      companyRequestForm.reset();

      setTimeout(() => rqStatus.textContent = "", 2500);

    } catch (err) {
      rqStatus.textContent = "❌ Er ging iets mis. Probeer het later opnieuw.";
      rqStatus.className = "text-sm text-red-600";
    }
  });

  loadCompany();
});

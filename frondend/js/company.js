// frontend/js/company.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const nameEl = document.getElementById("companyName");
  const metaEl = document.getElementById("companyMeta");
  const descEl = document.getElementById("companyDescription");
  const extraEl = document.getElementById("companyExtra");
  const statusEl = document.getElementById("companyStatus");
  const requestBtn = document.getElementById("requestButton");

  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get("slug");
  const idParam = params.get("id");

  function setStatus(msg, color) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = color || "#6b7280";
  }

  function setCanonical(slug) {
    if (!slug) return;
    const href = `${window.location.origin}/company.html?slug=${encodeURIComponent(slug)}`;
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = href;
    document.head.appendChild(link);
  }

  function renderCompany(c) {
    if (!c) {
      setStatus("Bedrijf niet gevonden.", "#dc2626");
      return;
    }
    const name = c.name || "(naam onbekend)";
    const city = c.city || "";
    const rating = typeof c.avgRating === "number" ? c.avgRating.toFixed(1) : null;
    const reviewCount = c.reviewCount || 0;
    const slug = c.slug;
    const phone = c.phone || c.telephone || "";
    const email = c.email || "";
    const website = c.website || c.url || "";

    if (nameEl) nameEl.textContent = name;
    if (metaEl) {
      let meta = city || "";
      if (rating) meta += (meta ? " · " : "") + `${rating}★ (${reviewCount} reviews)`;
      else if (reviewCount) meta += (meta ? " · " : "") + `${reviewCount} reviews`;
      metaEl.textContent = meta;
    }
    if (descEl) {
      descEl.textContent = c.description || c.shortDescription || "";
    }

    if (extraEl) {
      const parts = [];
      if (phone) parts.push(`<div><strong>Telefoon:</strong> <a href="tel:${phone}">${phone}</a></div>`);
      if (email) parts.push(`<div><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></div>`);
      if (website) parts.push(`<div><strong>Website:</strong> <a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a></div>`);

      const services = Array.isArray(c.services) ? c.services : [];
      const specialties = Array.isArray(c.specialties) ? c.specialties : [];
      const tags = Array.isArray(c.tags) ? c.tags : [];

      if (services.length) {
        parts.push(`<div class="mt-2"><strong>Diensten:</strong> ${services.join(", ")}</div>`);
      }
      if (specialties.length) {
        parts.push(`<div class="mt-1"><strong>Specialisaties:</strong> ${specialties.join(", ")}</div>`);
      }
      if (tags.length) {
        parts.push(`<div class="mt-1"><strong>Kenmerken:</strong> ${tags.join(", ")}</div>`);
      }

      extraEl.innerHTML = parts.join("");
    }

    if (slug) {
      const newUrl = `${window.location.pathname}?slug=${encodeURIComponent(slug)}`;
      window.history.replaceState(null, "", newUrl);
      setCanonical(slug);
    }
  }

  function loadBySlug(slug) {
    return fetch(`${API_BASE}/companies/slug/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Niet gevonden");
        return res.json();
      });
  }

  function loadById(id) {
    return fetch(`${API_BASE}/companies/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Niet gevonden");
        return res.json();
      });
  }

  async function init() {
    try {
      if (slugParam) {
        const c = await loadBySlug(slugParam);
        renderCompany(c);
        setStatus("");
      } else if (idParam) {
        const c = await loadById(idParam);
        renderCompany(c);
        setStatus("");
      } else {
        setStatus("Geen bedrijf opgegeven.", "#dc2626");
      }
    } catch (err) {
      console.error("Fout bij laden bedrijf:", err);
      setStatus("Bedrijf kon niet worden geladen.", "#dc2626");
    }
  }

  if (requestBtn) {
    requestBtn.addEventListener("click", () => {
      const current = window.location.search;
      const base = "request.html";
      const url = current ? base + current : base;
      window.location.href = url;
    });
  }

  init();
});

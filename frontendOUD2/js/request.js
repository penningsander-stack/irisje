// frontend/js/request.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const form = document.getElementById("requestForm");
  const nameEl = document.getElementById("reqName");
  const emailEl = document.getElementById("reqEmail");
  const phoneEl = document.getElementById("reqPhone");
  const categoryEl = document.getElementById("reqCategory");
  const cityEl = document.getElementById("reqCity");
  const descriptionEl = document.getElementById("reqDescription");
  const preferredTimeEl = document.getElementById("reqPreferredTime");
  const agreeEl = document.getElementById("reqAgree");
  const companyIdEl = document.getElementById("reqCompanyId");
  const companySlugEl = document.getElementById("reqCompanySlug");
  const companyRawIdEl = document.getElementById("reqCompanyRawId");
  const statusEl = document.getElementById("requestStatus");
  const bannerEl = document.getElementById("requestCompanyBanner");

  const errName = document.getElementById("errReqName");
  const errEmail = document.getElementById("errReqEmail");
  const errPhone = document.getElementById("errReqPhone");
  const errCategory = document.getElementById("errReqCategory");
  const errCity = document.getElementById("errReqCity");
  const errDescription = document.getElementById("errReqDescription");
  const errAgree = document.getElementById("errReqAgree");

  function setError(input, errEl, msg) {
    if (!input || !errEl) return;
    if (!msg) {
      input.classList.remove("error-border");
      errEl.textContent = "";
    } else {
      input.classList.add("error-border");
      errEl.textContent = msg;
    }
  }

  function setStatus(msg, color) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = color || "#6b7280";
  }

  const params = new URLSearchParams(window.location.search);
  const fromSlug = params.get("slug") || "";
  const fromId = params.get("id") || "";
  const fromCategory = params.get("category") || "";
  const fromCity = params.get("city") || "";
  const fromCompanyName = params.get("name") || "";

  if (categoryEl && fromCategory) categoryEl.value = fromCategory;
  if (cityEl && fromCity) cityEl.value = fromCity;

  let activeCompanyName = fromCompanyName || "";

  if (bannerEl) {
    if (fromCompanyName) {
      bannerEl.textContent = "Je dient een aanvraag in bij " + fromCompanyName + " via Irisje.nl.";
    } else {
      bannerEl.textContent = "Je aanvraag wordt via Irisje.nl aan het geselecteerde bedrijf doorgestuurd.";
    }
  }

  function loadCompanyDetails() {
    if (!fromSlug && !fromId) return;

    let url;
    if (fromSlug) {
      url = `${API_BASE}/companies/slug/${encodeURIComponent(fromSlug)}`;
    } else if (fromId) {
      url = `${API_BASE}/companies/${encodeURIComponent(fromId)}`;
    } else {
      return;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Niet gevonden");
        return res.json();
      })
      .then((c) => {
        if (!c) return;
        if (companyIdEl && c._id) companyIdEl.value = c._id;
        if (companySlugEl && c.slug) companySlugEl.value = c.slug;
        if (companyRawIdEl && c._id) companyRawIdEl.value = c._id;
        activeCompanyName = c.name || activeCompanyName;
        if (bannerEl && c.name) {
          bannerEl.textContent = "Je dient een aanvraag in bij " + c.name + " via Irisje.nl.";
        }
      })
      .catch((err) => {
        console.error("Fout bij laden bedrijf voor aanvraag:", err);
      });
  }

  loadCompanyDetails();

  function validate() {
    let ok = true;
    const name = (nameEl.value || "").trim();
    const email = (emailEl.value || "").trim();
    const phone = (phoneEl.value || "").trim();
    const category = (categoryEl.value || "").trim();
    const city = (cityEl.value || "").trim();
    const description = (descriptionEl.value || "").trim();

    if (!name) {
      setError(nameEl, errName, "Vul je naam in.");
      ok = false;
    } else {
      setError(nameEl, errName, "");
    }

    if (!email) {
      setError(emailEl, errEmail, "Vul je e-mailadres in.");
      ok = false;
    } else {
      const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!re.test(email)) {
        setError(emailEl, errEmail, "Vul een geldig e-mailadres in.");
        ok = false;
      } else {
        setError(emailEl, errEmail, "");
      }
    }

    if (!phone) {
      setError(phoneEl, errPhone, "Vul je telefoonnummer in.");
      ok = false;
    } else {
      setError(phoneEl, errPhone, "");
    }

    if (!category) {
      setError(categoryEl, errCategory, "Beschrijf kort wat je nodig hebt.");
      ok = false;
    } else {
      setError(categoryEl, errCategory, "");
    }

    if (!city) {
      setError(cityEl, errCity, "Vul de plaats of regio in.");
      ok = false;
    } else {
      setError(cityEl, errCity, "");
    }

    if (!description) {
      setError(descriptionEl, errDescription, "Beschrijf kort de opdracht.");
      ok = false;
    } else {
      setError(descriptionEl, errDescription, "");
    }

    if (!agreeEl.checked) {
      setError(agreeEl, errAgree, "Je moet akkoord gaan met de voorwaarden.");
      ok = false;
    } else {
      setError(agreeEl, errAgree, "");
    }

    return ok;
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setStatus("", "#6b7280");

    if (!validate()) {
      setStatus("Controleer de velden hierboven.", "#dc2626");
      return;
    }

    const payload = {
      name: (nameEl.value || "").trim(),
      email: (emailEl.value || "").trim(),
      phone: (phoneEl.value || "").trim(),
      category: (categoryEl.value || "").trim(),
      city: (cityEl.value || "").trim(),
      description: (descriptionEl.value || "").trim(),
      preferredTime: (preferredTimeEl.value || "").trim(),
      companyId: companyIdEl.value || companyRawIdEl.value || null,
      companySlug: companySlugEl.value || fromSlug || null,
      source: "irisje-frontend"
    };

    setStatus("Je aanvraag wordt verzonden…", "#6b7280");

    fetch(`${API_BASE}/publicRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (!json || json.error || json.ok === false) {
          const msg = json && (json.message || json.error) ? (json.message || json.error) : "Aanvraag kon niet worden verstuurd.";
          setStatus(msg, "#dc2626");
          return;
        }

        const usp = new URLSearchParams();
        if (activeCompanyName) usp.set("company", activeCompanyName);
        const cat = (categoryEl.value || "").trim();
        const city = (cityEl.value || "").trim();
        if (cat) usp.set("category", cat);
        if (city) usp.set("city", city);

        let url = "request-success.html";
        const qs = usp.toString();
        if (qs) url += "?" + qs;

        window.location.href = url;
      })
      .catch((err) => {
        console.error("Fout bij versturen aanvraag:", err);
        setStatus("Er ging iets mis bij het versturen. Probeer het later opnieuw.", "#dc2626");
      });
  });
});

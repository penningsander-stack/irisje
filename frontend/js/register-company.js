// frontend/js/register-company.js
// v2026-01-11 A5.1 – register-company gebruikt /api/meta/categories (single category + multi specialties)

const API_META = "https://irisje-backend.onrender.com/api/meta";
const API_COMPANIES = "https://irisje-backend.onrender.com/api/companies";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-company-form");
  const statusEl = document.getElementById("form-status");
  const btnReset = document.getElementById("btn-reset");

  const nameEl = document.getElementById("companyName");
  const cityEl = document.getElementById("companyCity");
  const descEl = document.getElementById("companyDescription");
  const categoryEl = document.getElementById("companyCategory");
  const specialtiesWrap = document.getElementById("companySpecialties");

  const msgName = document.getElementById("msg-companyName");
  const msgCity = document.getElementById("msg-companyCity");
  const msgCategory = document.getElementById("msg-companyCategory");
  const msgSpecialties = document.getElementById("msg-companySpecialties");

  let CATEGORY_CONFIG = [];

  init();

  async function init() {
    clearStatus();
    await loadCategories();

    categoryEl.addEventListener("change", () => {
      renderSpecialties([]);
    });

    btnReset.addEventListener("click", () => {
      form.reset();
      renderSpecialties([]);
      clearErrors();
      setStatus("Leeggemaakt.", "text-slate-600");
    });

    form.addEventListener("submit", onSubmit);
  }

  async function loadCategories() {
    try {
      const res = await fetch(`${API_META}/categories`);
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.categories)) {
        categoryEl.innerHTML = `<option value="">Kon categorieën niet laden</option>`;
        setStatus("Kon categorieën niet laden.", "text-red-600");
        return;
      }

      CATEGORY_CONFIG = data.categories;

      categoryEl.innerHTML = `<option value="">Kies een categorie…</option>`;
      for (const c of CATEGORY_CONFIG) {
        const opt = document.createElement("option");
        opt.value = c.key;
        opt.textContent = c.label;
        categoryEl.appendChild(opt);
      }

      // initial render (none selected)
      renderSpecialties([]);
      clearStatus();
    } catch (e) {
      categoryEl.innerHTML = `<option value="">Kon categorieën niet laden</option>`;
      setStatus("Kon categorieën niet laden (netwerkfout).", "text-red-600");
    }
  }

  function renderSpecialties(selectedKeys = []) {
    specialtiesWrap.innerHTML = "";

    const catKey = categoryEl.value;
    const category = CATEGORY_CONFIG.find((c) => c.key === catKey);

    if (!category || !Array.isArray(category.specialties)) {
      return;
    }

    for (const s of category.specialties) {
      const label = document.createElement("label");
      label.className = "checkbox-label";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = s.key;
      cb.checked = selectedKeys.includes(s.key);

      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + s.label));
      specialtiesWrap.appendChild(label);
    }
  }

  function getSelectedSpecialties() {
    return [...specialtiesWrap.querySelectorAll('input[type="checkbox"]:checked')].map(
      (cb) => cb.value
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    clearErrors();
    clearStatus();

    const name = nameEl.value.trim();
    const city = cityEl.value.trim();
    const description = descEl.value.trim();
    const categoryKey = categoryEl.value;
    const specialties = getSelectedSpecialties();

    let ok = true;

    if (!name) {
      showError(msgName, "Vul een bedrijfsnaam in.");
      ok = false;
    }
    if (!city) {
      showError(msgCity, "Vul een vestigingsplaats in.");
      ok = false;
    }
    if (!categoryKey) {
      showError(msgCategory, "Kies een categorie.");
      ok = false;
    }
    if (categoryKey && specialties.length === 0) {
      showError(msgSpecialties, "Kies minimaal één specialisme.");
      ok = false;
    }

    if (!ok) {
      setStatus("Controleer je invoer.", "text-red-600");
      return;
    }

    const payload = {
      name,
      city,
      description,
      categories: [categoryKey],
      specialties,
    };

    // Verwachting: je bent ingelogd en hebt token (zoals de rest van je platform).
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("Niet ingelogd (token ontbreekt). Log in en probeer opnieuw.", "text-red-600");
      return;
    }

    // We proberen eerst een “me”-achtige endpoint. Als die niet bestaat, kan dit 404 geven.
    // Dan laten we dat netjes zien (zonder iets stuk te maken).
    setStatus("Opslaan…", "text-slate-600");

    // Strategie: eerst PATCH /api/companies/me (als je die hebt),
    // anders PATCH /api/companies (of een ander endpoint) moet jij later bevestigen.
    // We doen nu alleen een veilige poging met duidelijke foutmelding.
    const candidates = [
      { method: "PATCH", url: `${API_COMPANIES}/me` },
      { method: "PATCH", url: `${API_COMPANIES}` },
    ];

    let lastErr = null;

    for (const c of candidates) {
      try {
        const res = await fetch(c.url, {
          method: c.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await safeJson(res);

        if (res.ok && data && data.ok) {
          setStatus("Opgeslagen.", "text-emerald-600");
          return;
        }

        // als endpoint niet bestaat of niet klopt, proberen we volgende kandidaat
        lastErr = data || { ok: false, error: `HTTP ${res.status}` };

        // Alleen doorproberen bij 404 (endpoint bestaat niet)
        if (res.status !== 404) break;
      } catch (err) {
        lastErr = { ok: false, error: "Netwerkfout" };
        break;
      }
    }

    const detail = lastErr?.details || lastErr?.error || "Opslaan mislukt.";
    setStatus(`Opslaan mislukt: ${detail}`, "text-red-600");
  }

  async function safeJson(res) {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return await res.json();
  }

  function setStatus(text, cls) {
    statusEl.textContent = text;
    statusEl.className = `rq-status ${cls || "text-slate-600"}`;
  }

  function clearStatus() {
    statusEl.textContent = "";
    statusEl.className = "rq-status text-slate-600";
  }

  function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function clearErrors() {
    for (const el of [msgName, msgCity, msgCategory, msgSpecialties]) {
      el.textContent = "";
      el.classList.add("hidden");
    }
  }
});

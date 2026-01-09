// frontend/js/dashboard.js
// v20260109-DASHBOARD-INTRO-REASONS

(() => {
  const API = "https://irisje-backend.onrender.com/api";
  const token = localStorage.getItem("token");
  if (!token) return (location.href = "login.html");

  /* =========================
     OPSOMMINGEN
  ========================= */
  const CITIES = [
    "Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven",
    "Groningen","Middelburg","Zierikzee","Burgh-Haamstede"
  ];

  const REASONS = [
    "Gratis eerste advies",
    "Ook ’s avonds en in het weekend bereikbaar",
    "Specialist in spoedzaken",
    "Landelijk actief",
    "Persoonlijke begeleiding",
    "No cure no pay mogelijk",
    "Ruime ervaring in complexe zaken",
    "Snelle reactie en duidelijke communicatie"
  ];

  const MAX_REASONS = 5;

  const byId = (id) => document.getElementById(id);

  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }).then(async (r) => {
      if (!r.ok) throw new Error("API fout");
      return r.json();
    });
  }

  /* ---------- UI helpers ---------- */
  function fillSelect(id, values, selected) {
    const el = byId(id);
    el.innerHTML = `<option value="">— kies —</option>`;
    values.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      if (selected === v) o.selected = true;
      el.appendChild(o);
    });
  }

  function renderReasons(selected = []) {
    const box = byId("companyReasons");
    box.innerHTML = "";
    REASONS.forEach((label) => {
      const wrap = document.createElement("label");
      wrap.className = "flex items-center gap-2";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = label;
      input.checked = selected.includes(label);

      input.addEventListener("change", () => {
        const checked = box.querySelectorAll("input:checked").length;
        if (checked > MAX_REASONS) {
          input.checked = false;
          alert(`Je kunt maximaal ${MAX_REASONS} redenen selecteren.`);
        }
      });

      wrap.appendChild(input);
      wrap.appendChild(document.createTextNode(label));
      box.appendChild(wrap);
    });
  }

  function readReasons() {
    return [...byId("companyReasons").querySelectorAll("input:checked")]
      .map((i) => i.value);
  }

  /* ---------- Init ---------- */
  async function init() {
    const my = await authFetch(`${API}/companies/my`);
    if (!my.companies || my.companies.length === 0) {
      location.href = "register-company.html";
      return;
    }

    const companyId = my.companies[0]._id;
    const { item } = await authFetch(`${API}/companies/${companyId}`);

    byId("companyName").value = item.name;
    fillSelect("companyCity", CITIES, item.city || "");

    // Introductie
    byId("companyIntroduction").value = item.introduction || "";
    byId("introCount").textContent = (item.introduction || "").length;

    byId("companyIntroduction").addEventListener("input", (e) => {
      byId("introCount").textContent = e.target.value.length;
    });

    // Redenen
    renderReasons(item.reasons || []);

    byId("saveCompanyBtn").onclick = async () => {
      const body = {
        city: byId("companyCity").value,
        introduction: byId("companyIntroduction").value.trim(),
        reasons: readReasons(),
      };

      await authFetch(`${API}/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      byId("saveMessage").classList.remove("hidden");
      setTimeout(() => byId("saveMessage").classList.add("hidden"), 1500);
    };
  }

  /* ---------- Logout ---------- */
  const logoutBtn = byId("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      location.href = "login.html";
    });
  }

  init().catch(() => alert("Dashboard kon niet worden geladen."));
})();

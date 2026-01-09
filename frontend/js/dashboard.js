// frontend/js/dashboard.js
// v20260108-DASHBOARD-UX-POLISH

(() => {
  const API = "https://irisje-backend.onrender.com/api";
  const token = localStorage.getItem("token");
  if (!token) return (location.href = "login.html");

  /* =========================
     VASTE OPSOMMINGEN
  ========================= */
  const CITIES = ["Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven","Groningen","Middelburg","Zierikzee","Burgh-Haamstede"];
  const REGIONS = ["Zeeland","Zuid-Holland","Noord-Holland","Utrecht","Brabant","Gelderland","Overijssel","Drenthe","Groningen","Friesland","Limburg","Flevoland"];
  const SPECIALTIES = ["Arbeidsrecht","Ontslagrecht","Huurrecht","Familierecht","Bestuursrecht","Letselschade"];
  const CERTIFICATIONS = ["MfN-register","NOvA","ADR","SKJ"];
  const LANGUAGES = ["Nederlands","Engels","Duits","Frans","Spaans"];
  const MEMBERSHIPS = ["MfN","NOvA","BOVAG","Techniek Nederland"];
  const AVAILABILITY = ["Kantoortijden","Avonden","Weekenden","24/7"];

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

  function renderCheckboxGroup(containerId, values, selected = []) {
    const box = byId(containerId);
    box.innerHTML = "";
    values.forEach((v, i) => {
      const label = document.createElement("label");
      label.className = "flex items-center gap-2";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = v;
      input.checked = selected.includes(v);

      label.appendChild(input);
      label.appendChild(document.createTextNode(v));
      box.appendChild(label);
    });
  }

  function readCheckboxGroup(containerId) {
    return [...byId(containerId).querySelectorAll("input[type=checkbox]")]
      .filter((i) => i.checked)
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
    fillSelect("companyAvailability", AVAILABILITY, item.availability || "");

    renderCheckboxGroup("companyRegions", REGIONS, item.regions || []);
    renderCheckboxGroup("companySpecialties", SPECIALTIES, item.specialties || []);
    renderCheckboxGroup("companyCertifications", CERTIFICATIONS, item.certifications || []);
    renderCheckboxGroup("companyLanguages", LANGUAGES, item.languages || []);
    renderCheckboxGroup("companyMemberships", MEMBERSHIPS, item.memberships || []);

    byId("companyWorksNationwide").checked = !!item.worksNationwide;

    byId("saveCompanyBtn").onclick = async () => {
      const body = {
        city: byId("companyCity").value,
        availability: byId("companyAvailability").value,
        worksNationwide: byId("companyWorksNationwide").checked,
        regions: readCheckboxGroup("companyRegions"),
        specialties: readCheckboxGroup("companySpecialties"),
        certifications: readCheckboxGroup("companyCertifications"),
        languages: readCheckboxGroup("companyLanguages"),
        memberships: readCheckboxGroup("companyMemberships"),
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

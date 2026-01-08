// frontend/js/dashboard.js
// v20260108-DASHBOARD-ENUM-LOCKED

(() => {
  const API = "https://irisje-backend.onrender.com/api";
  const token = localStorage.getItem("token");
  if (!token) return location.href = "login.html";

  /* =========================
     VASTE OPSOMMINGEN (A1)
  ========================= */
  const CITIES = ["Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven","Groningen","Middelburg","Zierikzee","Burgh-Haamstede"];
  const REGIONS = ["Zeeland","Zuid-Holland","Noord-Holland","Utrecht","Brabant","Gelderland","Overijssel","Drenthe","Groningen","Friesland","Limburg","Flevoland"];
  const SPECIALTIES = ["Arbeidsrecht","Ontslagrecht","Huurrecht","Familierecht","Bestuursrecht","Letselschade"];
  const CERTIFICATIONS = ["MfN-register","NOvA","ADR","SKJ"];
  const LANGUAGES = ["Nederlands","Engels","Duits","Frans","Spaans"];
  const MEMBERSHIPS = ["MfN","NOvA","BOVAG","Techniek Nederland"];
  const AVAILABILITY = ["Kantoortijden","Avonden","Weekenden","24/7"];

  const byId = id => document.getElementById(id);

  function fillSelect(id, values, selected = [], multiple = false) {
    const el = byId(id);
    el.innerHTML = "";
    values.forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      if (selected.includes(v)) o.selected = true;
      el.appendChild(o);
    });
    if (!multiple) el.insertAdjacentHTML("afterbegin", `<option value="">— kies —</option>`);
  }

  async function authFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers||{}) }
    });
    if (!res.ok) throw new Error("API fout");
    return res.json();
  }

  async function init() {
   const my = await authFetch(`${API}/companies/my`);

if (!my.companies || my.companies.length === 0) {
  window.location.href = "register-company.html";
  return;
}

const companyId = my.companies[0]._id;

    const { item } = await authFetch(`${API}/companies/${companyId}`);

    byId("companyName").value = item.name;

    fillSelect("companyCity", CITIES, [item.city]);
    fillSelect("companyRegions", REGIONS, item.regions || [], true);
    fillSelect("companySpecialties", SPECIALTIES, item.specialties || [], true);
    fillSelect("companyCertifications", CERTIFICATIONS, item.certifications || [], true);
    fillSelect("companyLanguages", LANGUAGES, item.languages || [], true);
    fillSelect("companyMemberships", MEMBERSHIPS, item.memberships || [], true);
    fillSelect("companyAvailability", AVAILABILITY, [item.availability]);

    byId("companyWorksNationwide").checked = !!item.worksNationwide;

    byId("saveCompanyBtn").onclick = async () => {
      const body = {
        city: byId("companyCity").value,
        regions: [...byId("companyRegions").selectedOptions].map(o=>o.value),
        specialties: [...byId("companySpecialties").selectedOptions].map(o=>o.value),
        certifications: [...byId("companyCertifications").selectedOptions].map(o=>o.value),
        languages: [...byId("companyLanguages").selectedOptions].map(o=>o.value),
        memberships: [...byId("companyMemberships").selectedOptions].map(o=>o.value),
        availability: byId("companyAvailability").value,
        worksNationwide: byId("companyWorksNationwide").checked
      };

      await authFetch(`${API}/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      byId("saveMessage").classList.remove("hidden");
      setTimeout(()=>byId("saveMessage").classList.add("hidden"),1500);
    };
  }

  init().catch(e => {
    console.error(e);
    alert("Dashboard kon niet worden geladen.");
  });



// ------------------------------------------------------------
// Logout (altijd laten werken, ook bij errors elders)
// ------------------------------------------------------------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("Kon localStorage niet legen:", e);
    }
    window.location.href = "login.html";
  });
}





})();

// frontend/js/dashboard.js
// v20260109-TABS-SERVICES

const API_BASE = "https://irisje-backend.onrender.com/api";
const token = localStorage.getItem("token");

if (!token) location.href = "/login.html";

// ---------------- TAB LOGICA ----------------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-section").forEach(s => s.classList.add("hidden"));

    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
  });
});

// ---------------- VASTE OPTIES ----------------
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

const WORKFORMS = ["Telefonisch", "Online", "Op locatie"];
const TARGET_GROUPS = ["Particulier", "ZZP", "MKB", "Werkgever", "Werknemer"];
const SPECIALTIES = ["Arbeidsrecht", "Bestuursrecht", "Mediation", "Ontslag", "Boetes"];
const REGIONS = ["Zeeland", "Zuid-Holland", "Noord-Holland", "Brabant"];

// ---------------- INIT ----------------
let companyId = null;
let companyData = {};

init();

async function init() {
  const my = await apiGet("/companies/my");
  if (!my.companies.length) return;

  companyId = my.companies[0]._id;
  const data = await apiGet(`/companies/${companyId}`);
  companyData = data.item;

  fillProfile();
  fillServices();
}

// ---------------- PROFIEL ----------------
function fillProfile() {
  document.getElementById("companyName").value = companyData.name || "";
  document.getElementById("companyCity").value = companyData.city || "";

  const intro = companyData.introduction || "";
  const introEl = document.getElementById("companyIntroduction");
  introEl.value = intro;
  document.getElementById("introCount").innerText = intro.length;

  introEl.addEventListener("input", () => {
    document.getElementById("introCount").innerText = introEl.value.length;
  });

  renderCheckboxes("reasonsCheckboxes", REASONS, companyData.reasons || [], 5);
}

document.getElementById("saveProfileBtn").onclick = async () => {
  await apiPut(`/companies/${companyId}`, {
    city: document.getElementById("companyCity").value,
    introduction: document.getElementById("companyIntroduction").value,
    reasons: getChecked("reasonsCheckboxes")
  });
  alert("Bedrijfsprofiel opgeslagen");
};

// ---------------- DIENSTEN ----------------
function fillServices() {
  renderCheckboxes("workformsCheckboxes", WORKFORMS, companyData.workforms || []);
  renderCheckboxes("targetGroupsCheckboxes", TARGET_GROUPS, companyData.targetGroups || []);
  renderCheckboxes("specialtiesCheckboxes", SPECIALTIES, companyData.specialties || []);
  renderCheckboxes("regionsCheckboxes", REGIONS, companyData.regions || []);

  document.getElementById("worksNationwide").checked = !!companyData.worksNationwide;
}

document.getElementById("saveServicesBtn").onclick = async () => {
  await apiPut(`/companies/${companyId}`, {
    workforms: getChecked("workformsCheckboxes"),
    targetGroups: getChecked("targetGroupsCheckboxes"),
    specialties: getChecked("specialtiesCheckboxes"),
    regions: getChecked("regionsCheckboxes"),
    worksNationwide: document.getElementById("worksNationwide").checked
  });
  alert("Diensten & expertise opgeslagen");
};

// ---------------- HELPERS ----------------
function renderCheckboxes(containerId, options, selected = [], max = null) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";

  options.forEach(opt => {
    const id = `${containerId}-${opt}`;
    const checked = selected.includes(opt);

    el.insertAdjacentHTML("beforeend", `
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" value="${opt}" ${checked ? "checked" : ""}>
        ${opt}
      </label>
    `);
  });

  if (max) {
    el.addEventListener("change", () => {
      const checked = el.querySelectorAll("input:checked");
      if (checked.length > max) checked[checked.length - 1].checked = false;
    });
  }
}

function getChecked(containerId) {
  return [...document.querySelectorAll(`#${containerId} input:checked`)].map(i => i.value);
}

async function apiGet(url) {
  const r = await fetch(API_BASE + url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.json();
}

async function apiPut(url, body) {
  const r = await fetch(API_BASE + url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  return r.json();
}

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  location.href = "/login.html";
};
